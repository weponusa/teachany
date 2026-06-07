import {
  inferBloomFromBlueprint,
  formatBloomHintForFilter,
  formatBloomHintForMatch,
} from './pbl-bloom.js';
import {
  resolveArchetype,
  formatArchetypeForMatch,
  formatRegistryForMatch,
} from './pbl-archetypes.js';

/**
 * @internal PBL 拆解核心提示词 v5.1 — 仅服务端，勿复制到前端静态资源
 *
 * v5.1：Bloom 动词层级 filter + match 约束；候选节点注入先修/定义（RAG lite）
 * v5.0：项目类型自适应 — 不再以 STEM/工程为唯一假设，覆盖工程制作、科学探究、
 *       社会调查、人文创作、创意设计、商业实践、消费决策等多类项目；
 *       学科按项目类型自然选取（理工 / 语文 / 历史 / 地理 / 英语 / 信息技术…）。
 * v4.0：先全链路拆解可行方案，再匹配课标（decompose → filter → match）
 * v3.1：主线优先 — 图谱只展示能「把东西做出来」的核心知识链
 */

const PBL_MAX_MATCHED_COMPLEX = 12;
const PBL_MAX_MATCHED_NORMAL = 18;

function isConsumerDecisionGoal(goal) {
  const g = String(goal || '');
  if (/购车|买车|选车|用车方案|消费决策|方案比选|比选|选型|性价比|家用.*车|家庭.*(购车|买车|选车|用车)/.test(g)) return true;
  if (/对比|比较/.test(g) && /购|买|选|家用|家庭/.test(g) && /新能源|燃油|电动|混动|汽油|柴油/.test(g)) return true;
  if (/哪个更|哪种更|怎么选|如何选择/.test(g) && /车|新能源|燃油|电动/.test(g)) return true;
  if (/新.{0,2}旧.{0,2}能源|油电混合|油电对比|燃油车|电动车|电车|混动车/.test(g) && /车|汽车|选|购|买|方案|对比|比较/.test(g)) return true;
  if (/(车|汽车|轿车|SUV)/.test(g) && /新能源|燃油|电动|混动|油电|汽油|柴油/.test(g) && /选|购|买|对比|比较|方案|推荐|决策|建议/.test(g)) return true;
  if (/选.{0,4}(车|汽车)/.test(g) || /(车|汽车).{0,4}选/.test(g)) return true;
  return false;
}

function isChemistryInquiryGoal(goal) {
  const g = String(goal || '');
  return /浓度|溶液|溶解度|溶质|溶剂|饱和溶液|质量分数|体积分数|物质的溶解|配制溶液|混合溶液/.test(g)
    || /食盐|盐水|醋酸|苏打|洁厕|电解水|酸碱|中和|化学变化|物质的变化|离子反应/.test(g)
    || /滴定|硝酸银|电导率|莫尔法|沉淀滴定|标准溶液|物质的量浓度/.test(g)
    || /食堂|菜汤|汤水|汤汁|汤品|卤水/.test(g)
    || (/厨房|餐桌|调味|烹饪|汤/.test(g) && /盐|酸|碱|醋|化学|浓度|溶液|溶解|测|含量/.test(g));
}

function getChemistryAnalysisProfile(goal) {
  const g = String(goal || '');
  const mixed = /混合溶液|食堂|菜汤|汤水|汤汁|汤品|卤水|景区水|河水|废水|不能直接|无法.*分离|不能.*称量|不能.*称重/.test(g)
    || (/汤/.test(g) && /食堂|餐厅|厨房|测定|检测|含量|浓度|盐/.test(g))
    || /滴定|硝酸银|电导率|间接测定/.test(g);
  const wantsTitration = /滴定|硝酸银|AgNO|莫尔|沉淀滴定|氯离子|Cl⁻|Cl-/.test(g);
  const wantsConductivity = /电导率|电导|导电率|电解质.*导电/.test(g);
  const methods = [];
  if (wantsTitration) methods.push('titration');
  if (wantsConductivity) methods.push('conductivity');
  if (mixed && !methods.length) methods.push('titration', 'conductivity');
  return {
    mixed,
    methods,
    sampleLabel: /食堂|菜汤|汤水/.test(g) ? '食堂汤水' : (/混合溶液/.test(g) ? '混合溶液' : '样品溶液'),
  };
}

function mixedSolutionChemistryDomains() {
  return [
    { id: 'constraint', label: '测定约束与方案选型', keywords: ['混合溶液', '无法分离', '间接测定', '取样', '稀释', '滴定', '电导率'], subjects: ['chemistry'] },
    { id: 'titration', label: '硝酸银滴定法', keywords: ['滴定', '硝酸银', '沉淀', '氯离子', '银离子', '物质的量浓度', '标准溶液'], subjects: ['chemistry'] },
    { id: 'conductivity', label: '电导率法', keywords: ['电导率', '电解质', '导电', '离子浓度', '标准曲线'], subjects: ['chemistry', 'physics'] },
    { id: 'calc', label: '数据处理与换算', keywords: ['物质的量', '浓度', '计算', '误差', '统计', '摩尔'], subjects: ['math', 'chemistry'] },
    { id: 'report', label: '结论与应用', keywords: ['报告', '分析', '比较', '结论', '含量'], subjects: ['chemistry', 'chinese', 'math'] },
  ];
}

function directSolutionChemistryDomains() {
  return [
    { id: 'solution', label: '溶液与浓度概念', keywords: ['溶液', '溶质', '溶剂', '浓度', '质量分数', '溶解', '配制', '氯化钠'], subjects: ['chemistry'] },
    { id: 'experiment', label: '实验设计与测量', keywords: ['实验', '变量', '对照', '量取', '称量', '配制', '测量', '滴定'], subjects: ['chemistry', 'science'] },
    { id: 'data', label: '数据处理与表达', keywords: ['数据', '统计', '图表', '计算', '误差', '记录'], subjects: ['math'] },
    { id: 'application', label: '生活情境与结论', keywords: ['厨房', '食盐', '应用', '安全', '结论', '报告'], subjects: ['chemistry', 'science', 'chinese'] },
  ];
}

/** 从目标句提取核心对象（动词后的名词短语） */
function parseGoalSubject(goal) {
  const g = String(goal || '').trim();
  let subject = g;
  const m = g.match(/^(?:设计|制作|开发|建造|完成|策划|撰写|探究|调查|分析|探寻|探索|研究|调研|重塑|改造|优化|重建|更新|升级|整治|组织|开展|修复|翻新|整治)(?:一个|一款|一份|一组|一次)?\s*(.+)$/);
  if (m) subject = m[1].trim();
  subject = subject.replace(/^(?:关于|围绕|有关)\s*/, '').replace(/[，。；].*$/, '').slice(0, 36);
  return subject || g.slice(0, 36);
}

function buildTopicKeywords(goal, subject, kind) {
  const g = String(goal || '');
  const base = [subject];
  if (/太空|天文|航天|行星|月球|宇宙/.test(g + subject)) base.push('太阳系', '天文', '太空', '月球', '科学');
  if (/馆|展厅|展览|展陈/.test(g + subject)) base.push('展览', '展陈', '科普', '布局', '设计');
  if (/低空|空域|通航|无人机/.test(g + subject)) base.push('低空经济', '空域', '无人机', '飞行');
  if (kind === 'exhibition-redesign') base.push('调查', '方案', '说明', '统计', '设计', '展示');
  if (kind === 'industry-innovation') base.push('产业', '创新', '调研', '政策', '可行性');
  if (kind === 'planting-cultivation' || /种植|栽培|月季|花卉|蔬菜|盆栽|园艺|养殖|养蚕/.test(g + subject)) {
    base.push('植物', '分类', '生长', '光合', '种子', '萌发', '栽培', '根系', '蒸腾', '观察', '记录');
  }
  for (let i = 0; i < subject.length - 1; i++) {
    const w = subject.slice(i, i + 2);
    if (w.length === 2 && !/[的与及了在]$/.test(w)) base.push(w);
  }
  return [...new Set(base)].slice(0, 12);
}

function inferDeliverableHint(goal, subject, kind) {
  if (kind === 'exhibition-redesign') {
    return `「${subject}」改造方案册（现状诊断表+展陈设计图+整改实施清单+开放验收表）`;
  }
  if (kind === 'industry-innovation') {
    return `「${subject}」创新方案报告（场景调研+政策要点+可行性论证）`;
  }
  if (kind === 'planting-cultivation') {
    return `「${subject}」种植观察日记（植物分类笔记+栽培记录表+生长数据图表+总结）`;
  }
  if (/报告|调查|论文|倡议|方案/.test(goal)) return `「${subject}」专题报告（含调研数据与可检查结论）`;
  if (/设计|制作|开发|建造/.test(goal)) return `可展示的「${subject}」作品+过程记录+说明文档`;
  return `「${subject}」项目成果包（可展示交付物+过程记录+说明）`;
}

function inferTopicKind(goal, subject) {
  const g = String(goal || '');
  if (/低空经济|低空飞行|低空空域|空域管理|通航产业|城市空中交通|eVTOL|低空物流|通用航空/.test(g)) return 'industry-innovation';
  if (/太空馆|天文馆|航天馆|科技馆|博物馆|展厅|展陈|太空.*馆|天文.*馆/.test(g) || (/馆|展厅|展览/.test(g + subject) && /重塑|改造|整治|升级|策展|布展|失控|翻新|重建|优化/.test(g))) return 'exhibition-redesign';
  if (/探寻|探索|研究|调研/.test(g) && /创新|产业|经济|行业/.test(g)) return 'industry-innovation';
  if (/种植|栽培|养花|月季|花卉|玫瑰|蔬菜|种菜|盆栽|园艺|养殖|养蚕|花坛|绿化|阳台种/.test(g)) return 'planting-cultivation';
  return 'subject-anchored';
}

function isPlantingCultivationGoal(goal) {
  return inferTopicKind(String(goal || ''), parseGoalSubject(goal)) === 'planting-cultivation';
}

function plantingCropLabel(goal) {
  const g = String(goal || '');
  const m = g.match(/月季|玫瑰|番茄|黄瓜|辣椒|白菜|菠菜|多肉|薰衣草|向日葵|郁金香|菊花|荷花|草莓|葡萄|玉米|小麦|蚕|百合|牡丹/);
  return m ? m[0] : '植物';
}

function plantingCultivationDomains(goal) {
  const crop = plantingCropLabel(goal);
  const subject = parseGoalSubject(goal);
  return [
    { id: 'taxonomy', label: '植物识别与分类', keywords: [crop, subject, '植物', '分类', '特征', '结构', '器官', '绿色'], subjects: ['science', 'biology'] },
    { id: 'growth', label: '生长与环境条件', keywords: [crop, '生长', '光合', '呼吸', '种子', '萌发', '根', '蒸腾', '环境', '水分'], subjects: ['science', 'biology'] },
    { id: 'cultivate', label: '栽培实操', keywords: [crop, '种植', '栽培', '土壤', '浇水', '施肥', '扦插', '移栽', '步骤', '养护'], subjects: ['science', 'biology'] },
    { id: 'observe', label: '生长观察记录', keywords: [crop, '观察', '记录', '测量', '数据', '图表', '变化', '高度', '叶片'], subjects: ['science', 'math', 'biology'] },
    { id: 'share', label: '种植日记与分享', keywords: [crop, '日记', '报告', '总结', '分享', '说明', '写作'], subjects: ['chinese'] },
  ];
}

/** 从用户目标提取核心主题 — 任何题目都必须锚定，禁止落入通用工程模板 */
function extractTopicProfile(goal) {
  const g = String(goal || '').trim();
  const presets = [
    {
      test: /低空经济|低空飞行|低空空域|空域管理|通航产业|城市空中交通|UAM|eVTOL|低空物流|通用航空/,
      coreTopic: '低空经济',
      definition: '指在约1000–3000米低空空域内，以无人机物流配送、低空出行、应急救援、农业植保、巡检等飞行活动带动的新兴产业（含政策、空域、安全、应用场景）',
      keywords: ['低空经济', '低空', '空域', '通航', '无人机', '低空物流', '飞行', '航空', '交通', '应急救援', '植保', '政策', '法规', '安全', '产业'],
      banInSteps: ['现代物流管理', '智慧城市', '工程设计思维', '环境搭建', '硬件组件', '编写控制逻辑', '一般物流', '通用创新大赛', '原型驱动迭代', 'MVP', '快速原型'],
      deliverableHint: '低空经济创新方案报告（场景调研+政策/空域要点+技术可行性+试点建议）',
      kind: 'industry-innovation',
    },
  ];
  for (const p of presets) {
    if (p.test.test(g)) {
      return { ...p, rawGoal: g, matched: true };
    }
  }
  const subject = parseGoalSubject(g);
  const kind = inferTopicKind(g, subject);
  const banCommon = ['原型驱动迭代', 'MVP', '快速原型', '递进式实施', '浸润式场景', '硬件准备', '环境搭建', '工程设计思维', '招生简章', '现代物流管理', '智慧城市'];
  if (kind === 'industry-innovation') {
    const core = /低空经济/.test(g) ? '低空经济' : (g.match(/(?:.+?经济|.+?产业|.+?行业)/)?.[0]?.slice(0, 24) || subject);
    return {
      rawGoal: g,
      matched: true,
      coreTopic: core,
      definition: `围绕「${core}」开展创新探究，须结合真实产业场景、政策或技术应用`,
      keywords: buildTopicKeywords(g, core, kind),
      banInSteps: [...banCommon, '硬件组件', '一般物流'],
      deliverableHint: inferDeliverableHint(g, core, kind),
      kind,
    };
  }
  if (kind === 'exhibition-redesign') {
    return {
      rawGoal: g,
      matched: true,
      coreTopic: subject,
      definition: `对「${subject}」进行现状诊断、主题策划、展陈设计与整改实施，交付可验收的改造方案（非软件工程或装置研发）`,
      keywords: buildTopicKeywords(g, subject, kind),
      banInSteps: [...banCommon, '程序设计', '电解池', '搭建原型'],
      deliverableHint: inferDeliverableHint(g, subject, kind),
      kind,
    };
  }
  if (kind === 'planting-cultivation') {
    const crop = plantingCropLabel(g);
    return {
      rawGoal: g,
      matched: true,
      coreTopic: subject,
      definition: `围绕「${subject}」学习植物分类与生长原理，完成${crop}栽培实操并持续观察记录，形成种植日记`,
      keywords: buildTopicKeywords(g, subject, kind),
      banInSteps: [...banCommon, '程序设计', '牛顿', '化学方程式', '电解池'],
      deliverableHint: inferDeliverableHint(g, subject, kind),
      kind,
      crop,
    };
  }
  return {
    rawGoal: g,
    matched: true,
    coreTopic: subject,
    definition: `本项目必须围绕用户指定的「${subject}」展开，不得替换为其他主题或套用无关模板`,
    keywords: buildTopicKeywords(g, subject, kind),
    banInSteps: banCommon,
    deliverableHint: inferDeliverableHint(g, subject, kind),
    kind: 'subject-anchored',
  };
}

function formatTopicAnchorBlock(goal) {
  const t = extractTopicProfile(goal);
  return `\n## 本题核心主题（硬性锚点 — 不可替换、不可泛化）\n- 用户目标原文：「${t.rawGoal}」\n- **核心主题：${t.coreTopic}**\n- 主题定义：${t.definition}\n- projectSummary、deliverable、scheme 名称、每个 phase 的 phase名/steps/deliverable/knowledgeHints **必须直接出现「${t.coreTopic}」或其关键词，禁止换成其他项目**\n- knowledgeHints 检索词须含：${t.keywords.join('、')}\n- 建议交付物：${t.deliverableHint}\n- **禁止** scheme 名使用「递进式实施」「原型驱动迭代」等通用模板名；禁止交付物写「项目原型」「MVP」「系统演示」等与题目无关的表述\n- **禁止** steps 中出现：${(t.banInSteps || []).join('、')}\n`;
}

function isIndustryInnovationGoal(goal) {
  const t = extractTopicProfile(goal);
  return t.kind === 'industry-innovation' || t.matched;
}

function industryInnovationDomains(goal) {
  const t = extractTopicProfile(goal);
  const topic = t.coreTopic || '产业创新';
  return [
    { id: 'background', label: `${topic}背景与政策`, keywords: [topic, '产业', '政策', '法规', '空域', '发展', '规划', '经济'], subjects: ['geography', 'history', 'chinese'] },
    { id: 'scenarios', label: '应用场景调研', keywords: [topic, '物流', '出行', '应急', '植保', '巡检', '配送', '应用', '场景', '需求'], subjects: ['geography', 'chinese', 'math'] },
    { id: 'tech', label: '技术原理支撑', keywords: ['飞行', '航空', '无人机', '导航', '通信', '动力', '电池', '抛体', '牛顿', '安全'], subjects: ['physics', 'info-tech', 'science'] },
    { id: 'analysis', label: '数据与可行性分析', keywords: ['统计', '数据', '调查', '成本', '效益', '比较', '分析', '图表', '百分比'], subjects: ['math', 'chinese'] },
    { id: 'proposal', label: '创新方案与报告', keywords: ['方案', '创新', '建议', '报告', '论证', '说明', '可行性', '试点'], subjects: ['chinese', 'geography'] },
  ];
}

function isEnergyEngineeringGoal(goal) {
  const g = String(goal || '');
  if (isConsumerDecisionGoal(g)) return false;
  if (/(车|汽车|轿车|SUV|用车)/.test(g) && /新能源|燃油|电动|混动|油电/.test(g) && !/设计|制作|研发|装置|系统开发|搭建|发明|工程化|发电|储能装置/.test(g)) return false;
  if (/对比|比较|选购|购车|买车|选车|家用|家庭/.test(g) && !/设计|制作|研发|装置|系统开发|搭建|发电|储能/.test(g)) {
    if (/新能源|电动|燃油|混动|光伏|储能/.test(g)) return false;
  }
  return /新能源|光伏|太阳能|风电|风力|储能|电池|锂电|充电|发电|电能|清洁能源|碳中和|能源车|并网|逆变/.test(g)
    && /设计|制作|研发|装置|系统|搭建|工程|发电|储能|模型|实验|探究/.test(g);
}

/**
 * 项目类型分类（自适应多场景）：
 * consumer-decision / creative-media / humanities-literary / business-economics /
 * social-inquiry / engineering / scientific-inquiry / general
 */
function classifyProjectType(goal) {
  const g = String(goal || '');
  if (isConsumerDecisionGoal(g)) return 'consumer-decision';
  if (/太空馆|天文馆|航天馆|科技馆|博物馆|展厅|展陈|太空.*馆|天文.*馆/.test(g) || (/馆|展厅|展览/.test(g) && /重塑|改造|整治|升级|策展|布展|失控|翻新|重建|优化/.test(g))) return 'exhibition-redesign';
  if (/海报|短视频|微电影|动画|漫画|插画|绘画|展览|策展|广告|品牌|视觉|游戏设计|作曲|音乐创作|手工艺|表演|舞台|摄影|logo|标志设计|文创|周边设计/.test(g)) return 'creative-media';
  if (/诗歌|诗集|现代诗|诗词|写诗|小说|剧本|散文|绘本|故事集|演讲|辩论|文学|翻译|双语|新闻稿|采访稿|写一[篇组]|作文|征文|朗诵|文集|杂志|读后感|书评|话剧|文章/.test(g)) return 'humanities-literary';
  if (/创业|商业计划|营销|市场推广|运营|理财|零花钱|压岁钱|市场调研|义卖|跳蚤市场|店铺|定价|商业模式|经济效益|盈利|众筹|招商|品牌策划/.test(g)) return 'business-economics';
  if (/健康|营养|饮食|食谱|减脂|减肥|健身|锻炼|运动会?|近视|视力|护眼|睡眠|作息|心理|情绪|压力|安全|急救|防溺水|防火|防疫|卫生|疾病|人体|体重|身高/.test(g)) return 'health-life';
  if (isPlantingCultivationGoal(g)) return 'planting-cultivation';
  if (/烹饪|烘焙|美食|菜谱|料理|手工|编织|缝纫|收纳|整理|维修|清洁|打扫|劳动/.test(g)) return 'labor-practice';
  if (/活动策划|策划.{0,6}(活动|晚会|联欢|运动会|典礼|节|比赛)|联欢会|晚会|文艺汇演|毕业典礼|生日会|出游|旅行|研学|游学|路线规划|时间管理|班级布置|布置教室|嘉年华|游园/.test(g)) return 'life-planning';
  if (/田野|问卷|访谈|社区|民俗|传统文化|非遗|人口|城乡|社会现象|调研报告|公众.{0,4}认知|居民|乡土|口述史/.test(g)) return 'social-inquiry';
  if (isIndustryInnovationGoal(g)) return 'industry-innovation';
  if (/工坊|鲁班|榫卯|古典.*风格|木结构|建筑模型|微缩|传统建筑|斗拱|飞檐/.test(g)) return 'maker-workshop';
  if (/火箭|导弹|发射|机器人|物流机器人|医院.*机器人|电路|机械|硬件|装置|App|应用程序|小程序|网站|系统开发|3D打印|传感|智能|温控|储能|光伏|发电|搭建|制作|工程|发明|物联网|编程实现/.test(g)) return 'engineering';
  if (/无人机|原型/.test(g) && /设计|制作|研发|装置|系统|搭建|开发/.test(g)) return 'engineering';
  if (isChemistryInquiryGoal(g)) return 'scientific-inquiry';
  if (/探究|实验|观察|测量|验证|影响因素|变量|检测|成分|对照实验|科学问题|浓度|溶液|溶解/.test(g)) return 'scientific-inquiry';
  return 'general';
}

const TYPE_PROFILES = {
  'engineering': { label: '工程研发/制作', moduleWord: '工程子系统（原理 / 装置结构 / 电路控制 / 测试迭代）', subjectsHint: '以 physics、chemistry、math、info-tech 为主，按需含其他', redlines: '覆盖原理→装置→实验→必要定量；定量计算节点≤20%，不要只堆守恒定律/计算' },
  'scientific-inquiry': { label: '科学探究/实验', moduleWord: '探究环节（问题假设 / 变量设计 / 数据采集 / 分析结论）', subjectsHint: 'physics、chemistry、biology、science、math 为主', redlines: '必须含实验设计与数据分析类节点；理论与实验并重，不要只选纯计算' },
  'consumer-decision': { label: '消费决策/方案对比', moduleWord: '决策环节（需求调研 / 对比维度 / 成本测算 / 决策报告）', subjectsHint: 'math（统计/函数）为主，辅以相关科普与说明文写作', redlines: '交付物是决策报告/对比表；禁止电解池、原电池、程序控制、传感器、数据采集算法等研发节点' },
  'social-inquiry': { label: '社会调查/田野研究', moduleWord: '调查环节（选题抽样 / 资料收集 / 整理统计 / 结论报告）', subjectsHint: 'chinese、geography、history、math（统计）按需组合', redlines: '核心是调查方法、数据统计与报告写作；不要硬塞物理化学公式' },
  'humanities-literary': { label: '人文/文学/语言', moduleWord: '创作环节（立意选材 / 阅读积累 / 结构表达 / 修改展示）', subjectsHint: 'chinese、english、history 为主', redlines: '围绕阅读、写作、表达、文化理解；不要塞理科公式或工程装置节点' },
  'creative-media': { label: '创意设计/媒体/艺术', moduleWord: '创作环节（创意构思 / 设计草案 / 制作实现 / 展示评议）', subjectsHint: '结合 info-tech、chinese 及相关学科，技术实现可含数学/信息技术', redlines: '围绕创意表达与制作；只在确需技术实现时引入理科节点' },
  'business-economics': { label: '商业/创业/经济实践', moduleWord: '运营环节（需求调研 / 方案设计 / 成本定价 / 运营复盘）', subjectsHint: 'math（统计/比例/函数）、chinese（策划/表达）为主', redlines: '围绕调研、测算、方案与表达；不要堆无关理科节点' },
  'life-planning': { label: '生活规划/活动策划', moduleWord: '策划环节（需求目标 / 方案日程 / 预算分工 / 执行复盘）', subjectsHint: 'math（预算/时间/统计）、chinese（策划/通知/总结）、geography（路线）按需', redlines: '围绕目标、方案、预算分工与执行复盘；不要塞无关理科公式或工程装置' },
  'health-life': { label: '健康生活/运动安全', moduleWord: '健康环节（现状了解 / 知识学习 / 计划制定 / 实践评估）', subjectsHint: 'biology、science（健康原理）、math（统计监测）、chinese（宣传倡议）', redlines: '围绕健康知识、数据监测与行为改进；不要堆与健康无关的工程/纯计算节点' },
  'planting-cultivation': { label: '种植养殖/园艺栽培', moduleWord: '环节（植物识别分类 / 生长与环境 / 栽培实操 / 观察记录 / 种植日记）', subjectsHint: 'science、biology 为主线，辅以 math（数据图表）、chinese（日记）', redlines: '交付物是种植观察日记；必须含植物分类、生长原理（光合/萌发/根系）、栽培步骤；禁止原型迭代、浸润式场景、工程装置' },
  'labor-practice': { label: '劳动实践/制作', moduleWord: '实践环节（认识准备 / 操作实践 / 观察记录 / 成果分享）', subjectsHint: 'biology、science、chinese、math 按需', redlines: '围绕动手操作、观察记录与成果分享；不要拔高成科研论文或工程系统' },
  'maker-workshop': { label: '工坊/木作/建筑模型', moduleWord: '工序（现场调研 / 风格方案 / 材料BOM / 搭建装饰 / 验收展示）', subjectsHint: 'science、physics、math、history、chinese、art 按需', redlines: '交付物是实体模型+图册+BOM；steps 须有尺寸、工具、照片、检查表，禁止「环境搭建」「选择组件」空话' },
  'industry-innovation': { label: '产业创新/新兴经济探究', moduleWord: '环节（产业背景与政策 / 应用场景调研 / 技术原理支撑 / 数据可行性 / 创新方案报告）', subjectsHint: 'geography、chinese、math、physics、history、info-tech 按需；围绕主题产业而非通用物流或工程', redlines: '交付物是主题产业创新方案/调研报告；禁止现代物流管理、智慧城市、工程设计思维、装置制作等与主题无关的模块' },
  'exhibition-redesign': { label: '展陈空间/场馆改造', moduleWord: '环节（现状诊断 / 主题策划 / 展陈设计 / 实施整改 / 开放验收）', subjectsHint: 'science（天文科普）、chinese（说明/讲解）、math（预算/统计）、info-tech（展板）按需', redlines: '交付物是场馆改造方案册+展陈设计图；禁止程序设计、工程原型、招生简章等与展陈无关节点' },
  'general': { label: '综合实践', moduleWord: '项目模块（须按题目自定义，禁止套用通用四套模块名）', subjectsHint: '按交付物自然选取所需学科', redlines: '每个节点都要服务于题目交付物；禁止「递进式实施」「原型驱动迭代」等模板 scheme 名' },
};

function projectTypeProfile(goal) {
  return TYPE_PROFILES[classifyProjectType(goal)] || TYPE_PROFILES.general;
}

function typeGuardrailBlock(goal) {
  const p = projectTypeProfile(goal);
  return `\n## 本项目类型识别：${p.label}\n- 模块视角：${p.moduleWord}\n- 学科取向：${p.subjectsHint}\n- 类型红线：${p.redlines}\n`;
}

/** 非特定 STEM 类型的通用模块（供 filter/match 提供检索提示） */
function genericDomainsForType(id) {
  const map = {
    'scientific-inquiry': [
      { id: 'question', label: '问题与假设', keywords: ['问题', '假设', '猜想', '现象', '原理'], subjects: ['science', 'physics', 'chemistry', 'biology'] },
      { id: 'design', label: '变量与实验设计', keywords: ['变量', '实验', '控制变量', '对照', '方案', '测量'], subjects: ['physics', 'chemistry', 'biology', 'science'] },
      { id: 'data', label: '数据采集与处理', keywords: ['数据', '测量', '记录', '统计', '误差', '图表'], subjects: ['math', 'info-tech', 'science'] },
      { id: 'conclusion', label: '分析与结论', keywords: ['分析', '结论', '解释', '规律', '报告'], subjects: ['science', 'math', 'chinese'] },
    ],
    'social-inquiry': [
      { id: 'topic', label: '选题与调查设计', keywords: ['选题', '调查', '问卷', '访谈', '抽样', '样本'], subjects: ['chinese', 'math'] },
      { id: 'collect', label: '资料与数据收集', keywords: ['资料', '数据', '收集', '记录', '文献', '实地'], subjects: ['geography', 'history', 'chinese'] },
      { id: 'analyze', label: '整理与统计分析', keywords: ['统计', '整理', '图表', '分析', '百分比', '平均数'], subjects: ['math'] },
      { id: 'report', label: '结论与报告', keywords: ['结论', '报告', '建议', '论证', '写作', '说明'], subjects: ['chinese'] },
    ],
    'humanities-literary': [
      { id: 'theme', label: '立意与选材', keywords: ['立意', '主题', '选材', '构思', '观点'], subjects: ['chinese', 'english'] },
      { id: 'read', label: '阅读与素材积累', keywords: ['阅读', '素材', '文本', '名著', '积累', '鉴赏'], subjects: ['chinese', 'english', 'history'] },
      { id: 'express', label: '结构与表达', keywords: ['结构', '表达', '修辞', '语言', '写作', '叙述', '议论'], subjects: ['chinese', 'english'] },
      { id: 'revise', label: '修改与展示', keywords: ['修改', '评议', '朗诵', '展示', '演讲', '发表'], subjects: ['chinese'] },
    ],
    'creative-media': [
      { id: 'idea', label: '创意构思', keywords: ['创意', '构思', '主题', '灵感', '受众'], subjects: ['chinese', 'info-tech'] },
      { id: 'design', label: '设计与草案', keywords: ['设计', '草图', '分镜', '排版', '色彩', '构图'], subjects: ['info-tech', 'chinese'] },
      { id: 'make', label: '制作与实现', keywords: ['制作', '剪辑', '绘制', '编辑', '工具', '技术'], subjects: ['info-tech'] },
      { id: 'show', label: '展示与评议', keywords: ['展示', '评议', '反馈', '发布', '优化'], subjects: ['chinese'] },
    ],
    'business-economics': [
      { id: 'research', label: '需求与市场调研', keywords: ['需求', '市场', '调研', '调查', '数据', '用户'], subjects: ['math', 'chinese'] },
      { id: 'plan', label: '方案与产品设计', keywords: ['方案', '产品', '设计', '策划', '创意'], subjects: ['chinese', 'info-tech'] },
      { id: 'cost', label: '成本与定价测算', keywords: ['成本', '定价', '利润', '预算', '函数', '百分比', '统计'], subjects: ['math'] },
      { id: 'operate', label: '运营与复盘', keywords: ['运营', '推广', '复盘', '反馈', '报告'], subjects: ['chinese', 'math'] },
    ],
    'life-planning': [
      { id: 'goal', label: '需求与目标', keywords: ['需求', '目标', '调查', '问卷', '场景', '人数'], subjects: ['chinese', 'math'] },
      { id: 'plan', label: '方案与日程', keywords: ['方案', '计划', '日程', '安排', '路线', '流程', '行程'], subjects: ['chinese', 'geography', 'math'] },
      { id: 'budget', label: '预算与分工', keywords: ['预算', '成本', '费用', '统计', '函数', '分工', '百分比', '比例'], subjects: ['math'] },
      { id: 'review', label: '执行与复盘', keywords: ['执行', '记录', '反馈', '复盘', '总结', '报告', '通知'], subjects: ['chinese'] },
    ],
    'health-life': [
      { id: 'status', label: '现状了解', keywords: ['现状', '调查', '统计', '数据', '测量', '记录'], subjects: ['math', 'biology', 'science'] },
      { id: 'knowledge', label: '健康知识', keywords: ['健康', '营养', '饮食', '运动', '睡眠', '安全', '疾病', '人体', '视力'], subjects: ['biology', 'science'] },
      { id: 'plan', label: '计划制定', keywords: ['计划', '方案', '目标', '食谱', '作息', '锻炼'], subjects: ['chinese', 'math'] },
      { id: 'assess', label: '实践与评估', keywords: ['记录', '评估', '对比', '反馈', '改进', '报告', '宣传', '倡议'], subjects: ['chinese', 'math'] },
    ],
    'planting-cultivation': [
      { id: 'taxonomy', label: '植物识别与分类', keywords: ['植物', '分类', '特征', '结构', '器官', '绿色'], subjects: ['science', 'biology'] },
      { id: 'growth', label: '生长与环境', keywords: ['生长', '光合', '呼吸', '种子', '萌发', '根', '蒸腾', '环境'], subjects: ['science', 'biology'] },
      { id: 'cultivate', label: '栽培实操', keywords: ['种植', '栽培', '土壤', '浇水', '施肥', '移栽', '养护'], subjects: ['science', 'biology'] },
      { id: 'observe', label: '观察记录', keywords: ['观察', '记录', '测量', '数据', '图表', '变化'], subjects: ['science', 'math', 'biology'] },
      { id: 'share', label: '种植日记', keywords: ['日记', '报告', '总结', '分享', '说明'], subjects: ['chinese'] },
    ],
    'labor-practice': [
      { id: 'prepare', label: '认识与准备', keywords: ['认识', '准备', '材料', '工具', '原理', '步骤'], subjects: ['science', 'biology', 'chinese'] },
      { id: 'practice', label: '操作实践', keywords: ['操作', '制作', '种植', '养护', '烹饪', '步骤', '工艺'], subjects: ['science', 'biology'] },
      { id: 'record', label: '观察与记录', keywords: ['观察', '记录', '测量', '数据', '变化', '统计'], subjects: ['science', 'math', 'biology'] },
      { id: 'share', label: '成果与分享', keywords: ['成果', '分享', '展示', '总结', '报告', '改进'], subjects: ['chinese'] },
    ],
    'general': [
      { id: 'define', label: '调研与定义', keywords: ['调研', '需求', '定义', '背景', '分析'], subjects: ['chinese', 'math', 'science'] },
      { id: 'design', label: '方案设计', keywords: ['方案', '设计', '规划', '分工'], subjects: ['math', 'science', 'chinese'] },
      { id: 'make', label: '实施制作', keywords: ['实施', '制作', '搭建', '实验', '执行'], subjects: ['science', 'chemistry', 'physics'] },
      { id: 'test', label: '测试与展示', keywords: ['测试', '评估', '展示', '优化', '报告'], subjects: ['math', 'chinese'] },
    ],
  };
  return map[id] || [];
}

/** 根据项目目标推断模块/子系统（服务端兜底，与前端 domain 逻辑对齐） */
function inferProjectDomains(goal) {
  const g = String(goal || '');
  if (isChemistryInquiryGoal(g)) {
    return getChemistryAnalysisProfile(g).mixed
      ? mixedSolutionChemistryDomains()
      : directSolutionChemistryDomains();
  }
  if (isConsumerDecisionGoal(g)) {
    return [
      { id: 'needs', label: '需求与场景调研', keywords: ['调查', '数据', '统计', '问卷', '需求', '分析', '收集', '整理', '图表'], subjects: ['math', 'chinese'] },
      { id: 'cost', label: '成本与数据建模', keywords: ['函数', '一次函数', '计算', '统计', '数据', '平均数', '费用', '成本', '百分比'], subjects: ['math'] },
      { id: 'energy_compare', label: '动力与能耗差异（科普）', keywords: ['内燃机', '热机', '效率', '电能', '化学能', '能量', '热值', '做功'], subjects: ['physics', 'chemistry'] },
      { id: 'environment', label: '环保与可持续', keywords: ['环境', '污染', '排放', '碳', '气候', '资源', '可持续', '温室'], subjects: ['geography', 'chemistry'] },
      { id: 'decision', label: '决策论证与报告', keywords: ['说明', '报告', '论证', '写作', '分析', '比较', '调查'], subjects: ['chinese', 'math'] },
    ];
  }
  if (/火箭|导弹|发射|弹道|模型火箭|航天/.test(g)) {
    return [
      {
        id: 'propulsion',
        label: '推进与燃料',
        keywords: ['燃烧', '氧化', '燃料', '热值', '内能', '化学能', '能量转化', '推进', '反应'],
        subjects: ['chemistry', 'physics'],
      },
      {
        id: 'aerodynamics',
        label: '空气动力与弹道',
        keywords: ['抛体', '流体', '压强', '流速', '气动', '弹道', '抛物', '飞行轨迹'],
        subjects: ['physics', 'math'],
      },
      {
        id: 'dynamics',
        label: '运动学与动力学',
        keywords: ['牛顿', '动量', '冲量', '受力', '加速度', '机械能', '守恒', '运动'],
        subjects: ['physics', 'math'],
      },
      {
        id: 'structure',
        label: '结构与材料',
        keywords: ['结构', '材料', '强度', '压强', '设计', '稳定性'],
        subjects: ['physics', 'chemistry'],
      },
      {
        id: 'control',
        label: '控制、传感与测试',
        keywords: ['控制', '传感', '电路', '编程', '算法', '数据采集', '实验', '误差', '测试'],
        subjects: ['info-tech', 'physics'],
      },
    ];
  }
  if (/温控|温室|温度|加热|散热|PID|闭环/.test(g)) {
    return [
      { id: 'modeling', label: '数学建模', keywords: ['函数', '方程', '建模', '图像'], subjects: ['math'] },
      { id: 'physics', label: '热学原理', keywords: ['热传导', '温度', '内能', '热量'], subjects: ['physics'] },
      { id: 'hardware', label: '传感与电路', keywords: ['传感器', '电路', '采集'], subjects: ['physics', 'info-tech'] },
      { id: 'control', label: '控制算法', keywords: ['控制', '反馈', '编程', '算法'], subjects: ['info-tech', 'math'] },
    ];
  }
  if (isIndustryInnovationGoal(g)) {
    return industryInnovationDomains(g);
  }
  if (isPlantingCultivationGoal(g)) {
    return plantingCultivationDomains(g);
  }
  if (classifyProjectType(g) === 'exhibition-redesign') {
    const subject = parseGoalSubject(g);
    return [
      { id: 'diagnose', label: '现状诊断', keywords: [subject, '问题', '调查', '记录', '失控', '隐患', '现状'], subjects: ['chinese', 'math'] },
      { id: 'theme', label: '主题策划', keywords: [subject, '主题', '天文', '太阳系', '月球', '太空', '科普', '内容'], subjects: ['science', 'chinese'] },
      { id: 'design', label: '展陈设计', keywords: [subject, '布局', '动线', '展板', '设计', '模型', '互动', '展陈'], subjects: ['info-tech', 'chinese', 'math'] },
      { id: 'implement', label: '实施整改', keywords: [subject, '整改', '布置', '预算', '分工', '安全', '清单', '实施'], subjects: ['math', 'chinese'] },
      { id: 'launch', label: '开放验收', keywords: [subject, '验收', '讲解', '宣传', '说明', '展示', '反馈', '开放'], subjects: ['chinese', 'science'] },
    ];
  }
  if (isEnergyEngineeringGoal(g)) {
    return [
      { id: 'energy', label: '能量转换与守恒', keywords: ['能量转化', '能量转换', '机械能', '内能', '电能', '化学能', '热值', '效率', '做功'], subjects: ['physics', 'chemistry'] },
      { id: 'electrochem', label: '电化学与电池', keywords: ['电池', '原电池', '电解', '电解池', '氧化还原', '电极', '电化学', '充放电', '储能', '燃料电池'], subjects: ['chemistry', 'physics'] },
      { id: 'circuit', label: '电路与电磁', keywords: ['电路', '电流', '电压', '电阻', '电磁', '感应', '串联', '并联', '电磁感应', '发电机'], subjects: ['physics'] },
      { id: 'renewable', label: '新能源装置', keywords: ['光伏', '太阳能', '风能', '风电', '发电', '新能源', '光能', '光电', '太阳能电池'], subjects: ['physics', 'chemistry'] },
      { id: 'system', label: '系统测试与控制', keywords: ['控制', '传感', '传感器', '采集', '实验', '测试', '反馈', '调试', '数据采集', '误差'], subjects: ['info-tech', 'physics'] },
    ];
  }
  return genericDomainsForType(classifyProjectType(g));
}

function formatDomainHints(domains) {
  if (!domains.length) return '';
  return domains.map((d, i) =>
    `${i + 1}. 【${d.label}】必覆盖。检索候选时请优先匹配名称/课标描述中含：${d.keywords.join('、')}；学科倾向：${(d.subjects || []).join('、')}`
  ).join('\n');
}

const ANTI_VACUUM_BLOCK = `
### 反空话与反泛素养（硬性）
- **禁止** matched：批判性思维、创新思维、团队协作、项目管理、沟通能力、核心素养等综合素养类节点（除非题目明确要求协作/管理/沟通）
- projectPhases 每阶段 steps 至少 2 条，每条 ≥15 字，须写清：动作 + 对象 + 方法/工具 + 检查标准；禁止「完成探究」「进行调研」「运用知识点」
- reason 除「模块：」外须写明**本阶段怎么用**（例：「模块：数据整理。用条形图对比两方案 5 年成本，附数据来源」）`;

function systemPromptMatch(complex, goal) {
  const base = `你是资深 PBL（项目式学习）导师，精通 K12 各学科课标，能为工程制作、科学探究、社会调查、人文创作、创意设计、商业实践、消费决策、产业创新等多类项目设计学习路径。
${formatTopicAnchorBlock(goal)}
${typeGuardrailBlock(goal)}
## 第一步（必做）：把项目拆成「子任务 / 模块」

在选任何候选 index 之前，先回答：「要做出本项目的交付物，学生必须分别解决哪几个**独立子问题**？」不同类型项目的模块不同：
- 工程/制作：原理 → 装置/结构 → 电路/控制 → 测试迭代
- 科学探究：问题假设 → 变量与实验设计 → 数据采集 → 分析结论
- 社会调查：选题抽样 → 资料/问卷收集 → 整理统计 → 结论报告
- 人文/写作：立意选材 → 阅读积累 → 结构表达 → 修改展示
- 创意/媒体：创意构思 → 设计草案 → 制作实现 → 展示评议
- 商业/经济：需求调研 → 方案设计 → 成本定价 → 运营复盘
- 消费决策：需求调研 → 对比维度 → 成本测算 → 决策报告

## 第二步：从候选列表选点（相关性门禁）

对每个 index，必须通过以下测试才能入选：
1. **模块测试**：它支撑上面哪一个模块？reason 必须以「模块：XXX」开头
2. **删除测试**：若删掉它，学生完成该模块会明显受阻吗？若不会 → 不选
3. **课标测试**：名称必须来自候选列表原文，禁止编造候选中没有的知识点

## 三层知识角色

- **foundation**：完成某模块所需的工具性/前置知识
- **bridge**：连接基础与产出的关键方法
- **core**：直接用于动手/产出环节的知识

## 最高优先级：贴合交付物 > 学科齐全

- 选 matched 的唯一标准：删掉它，项目某一步就做不下去
- **学科按项目类型自然选取**：工程/科学类多用理科；社会/人文/创作/商业类该用语文、历史、地理、英语、信息技术就大胆用——不要硬塞理科，也不要为凑跨学科塞无关节点
- 宁可精准 5-8 个，也不为学科齐全凑数

常见错误（绝对禁止）：
❌ matched 名称不在候选列表里（编造）
❌ 工程/制作类只堆「XX计算」「XX守恒定律」，缺原理/装置/实验（定量节点≤20%）
❌ 「家庭购车/方案对比」写成研发方案（应是统计/函数/科普/环境/说明文，禁止电解池、原电池、程序控制、传感器）
❌ 人文写作 / 社会调查 / 创意设计类硬塞物理化学公式或工程装置节点
❌ 为凑学科数量选与交付物无关的节点
❌ 用批判性思维/团队协作/项目管理等泛素养节点凑数
❌ projectPhases steps 只有「完成本阶段探究」「进行调研」等空话
${ANTI_VACUUM_BLOCK}`;

  if (!complex) {
    return `${base}

## 输出要求（常规项目）
- matched 8-${PBL_MAX_MATCHED_NORMAL} 个，foundation/bridge/core 均有，覆盖至少 2 个模块
- 每个 matched 的 reason 以「模块：」开头
- dependsOn 构成 DAG；pathOrder 满足依赖顺序
- projectPhases 3-5 阶段，每阶段 literacy 六维（知识/方法/能力/态度/情感/价值观）各 1 句，结合学科与项目类型，禁止套话
- knowledgeChain 用 → 串联模块递进

只返回 JSON，不要 markdown，不要解释。`;
  }

  return `${base}

## 输出要求（复杂项目）
- matched 5-10 个；覆盖至少 3 个模块，每个模块 1-2 个节点即可
- 节点不够时宁可少选，不要凑无关课标
- foundation 1-2、bridge 2-3、core 2-3
- knowledgeNames / techRoute 只能出现候选列表中存在的名称

只返回 JSON，不要 markdown，不要任何解释文字。`;
}

function systemPromptDecompose(complex, goal) {
  const p = projectTypeProfile(goal);
  const depth = complex
    ? '给出 2-3 套**不同实施路线**并推荐 1 套。'
    : '至少给出 2 套可行思路并推荐 1 套。';
  return `你是资深 PBL 与跨学科课程设计顾问，覆盖工程、科学探究、社会调查、人文创作、创意设计、商业实践、消费决策、产业创新等各类项目。
${formatTopicAnchorBlock(goal)}
## 任务（本阶段**不选课标知识点**）

对用户项目目标做**全链路结构化拆解**：
1. 判断项目类型（已初步识别：${p.label}）：
   - 工程/制作：做出装置/系统/原型
   - 科学探究：用实验回答科学问题
   - 社会调查：用调查/访谈研究社会现象
   - 人文/文学：阅读、写作、表达、文化理解
   - 创意/媒体/艺术：创作海报/视频/作品并展示
   - 商业/经济：调研—方案—成本—运营
   - 消费决策：对比方案做出有据决策
   - 生活规划/活动策划：班级活动、出游研学、时间/预算安排
   - 健康生活：营养饮食、运动锻炼、近视/睡眠、安全急救
   - 劳动实践：种植养殖、烹饪手工、收纳维修等动手任务
   - 产业创新/新兴经济：调研产业场景、政策与技术，提出创新方案报告（非装置制作）
2. 澄清交付物、约束、适用学段
3. 拆出 3-5 个模块（${p.moduleWord}）
4. ${depth}
5. 为推荐方案列出 4-5 个**实施阶段**（任务步骤、产出、knowledgeHints 检索词）

## 可执行任务步骤（硬性）
- 每个 phase 的 steps 至少 2 条，每条 ≥20 字，须同时包含：**动词 + 操作对象 + 工具/数据/方法 + 可检查产出（含数量/尺寸/次数）**
- 禁止空话：「进行调研」「完成探究」「选择硬件组件」「编写基础控制逻辑」「环境搭建」「确定材料清单」等无验收标准的表述
- **每条 steps 必须出现用户目标中的关键名词**（从【项目目标】原文提取），不得换成无关领域任务（如对「鲁班工坊」写软件环境搭建，对「物流机器人」写木工榫卯）
- 若题目是口号/品牌/抽象表述，必须**落地为 1 个具体交付物**，steps 写清谁做什么、用什么表/工具、交什么稿

## 原则
- **严格贴合题目类型**：调查/对比类的交付物是报告/对比表/答辩，不是研发原型；写作/创作类的交付物是作品，不是实验装置
- knowledgeHints 是**检索关键词**，按项目类型选取（理工类用学科概念，人文/社科类用阅读/写作/统计/调查等），不写课标原文节点名
- deliverable 必须是可检查实物（报告、表格、海报、作品、数据记录表），不能是「提升素养」「增强能力」
- 不跑题、不硬凑学科

只返回 JSON，不要 markdown。`;
}

function chemistryDecomposeHint(goal) {
  const cap = getChemistryAnalysisProfile(goal);
  if (!isChemistryInquiryGoal(goal) || !cap.mixed) return '';
  const sample = cap.sampleLabel;
  return `
【混合溶液深度拆解 — 硬性要求】
- ${sample}属于混合溶液，**禁止**以「直接称量溶质+质量分数」作为唯一/主方案
- schemes 至少 2 套：A **硝酸银滴定法**（测 Cl⁻/盐含量）；B **电导率法**（标准曲线反推浓度）
- 每阶段 steps 须写：取样澄清/稀释、滴定或测电导率、物质的量浓度换算、平行测定与误差
`;
}

function userPromptDecompose(goal, complex) {
  const domains = inferProjectDomains(goal);
  const domainBlock = domains.length
    ? `\n【可参考的项目模块】\n${formatDomainHints(domains)}\n`
    : '';
  const chemHint = chemistryDecomposeHint(goal);
  const topicBlock = formatTopicAnchorBlock(goal);
  return `【项目目标】
${goal}
${topicBlock}${domainBlock}${chemHint}
返回 JSON（严格遵循字段名）：
{
  "projectSummary": "一句话概括项目",
  "deliverable": "最终交付物",
  "constraints": ["时间/安全/器材等约束"],
  "subsystems": [
    {"id": "energy", "name": "子系统名", "description": "该子系统要解决的问题"}
  ],
  "schemes": [
    {
      "id": "A",
      "name": "方案名称",
      "summary": "技术路线概述",
      "pros": ["优点"],
      "cons": ["局限"],
      "phases": [
        {
          "phase": "阶段名",
          "steps": ["任务1", "任务2"],
          "deliverable": "阶段产出",
          "subsystemIds": ["energy"],
          "knowledgeHints": ["检索关键词1", "检索关键词2"]
        }
      ]
    }
  ],
  "recommendedSchemeId": "A",
  "knowledgeChain": "子系统1 → 子系统2 → 测试迭代"
}

要求：
- schemes 至少 2 套，recommendedSchemeId 必须是其中一套的 id
- 推荐方案 phases 4-5 个
- 每个 steps 条目 ≥20 字，须含可操作动词 + 数量/尺寸/次数 + 可检查产出；动词对象必须来自用户目标原文
- phases 的 phase 名称、deliverable、steps 须与【项目目标】同一领域，禁止跨域套模板
- knowledgeHints 每阶段 2-5 个，用于下一步课标检索，勿写课标原文节点名`;
}

function formatBlueprintForMatch(blueprint) {
  if (!blueprint) return '';
  const scheme = (blueprint.schemes || []).find(s => s.id === blueprint.recommendedSchemeId)
    || (blueprint.schemes || [])[0];
  if (!scheme) return '';
  const subs = (blueprint.subsystems || []).map(s => `${s.id}:${s.name}`).join('；');
  const phases = (scheme.phases || []).map((p, i) => {
    const hints = (p.knowledgeHints || []).join('、');
    const steps = (p.steps || []).join('；');
    return `  ${i + 1}. 【${p.phase}】任务：${steps}；产出：${p.deliverable || '阶段成果'}；知识检索提示：${hints}`;
  }).join('\n');
  return `
【项目实施蓝图 — matched 必须对齐此结构，禁止跑题】
项目摘要：${blueprint.projectSummary || ''}
交付物：${blueprint.deliverable || ''}
推荐方案：${scheme.name}（${scheme.summary || ''}）
子系统：${subs}
实施阶段：
${phases}
知识链：${blueprint.knowledgeChain || ''}
`;
}

function systemPromptFilter(complex, goal) {
  const p = projectTypeProfile(goal);
  const gradeHint = complex
    ? 'grades 一般落在 7-12；若项目明显面向小学，可含 1-6。'
    : '';
  return `你是 PBL 项目与课标对齐专家，能把工程、科学探究、社会调查、人文创作、创意设计、商业实践、消费决策、产业创新等各类项目拆解为可检索的学科与模块。
${formatTopicAnchorBlock(goal)}
${typeGuardrailBlock(goal)}
## 工作流程
1. 判断项目类型（已识别：${p.label}）
2. 列出 3-5 个模块（${p.moduleWord}）
3. 为每个模块映射学科：math / physics / chemistry / biology / science / chinese / english / history / geography / info-tech
4. 确定适用 grades 与 systems
5. 从蓝图任务动词推断 Bloom 认知上限（bloomCeiling 1-6），过高阶的课标节点在 match 阶段应排除

## 选学科原则（按类型自适应）
- 学科必须能覆盖上述模块，**按项目类型自然选取**：理工类多用理科；社科/人文/创作/商业类大胆用语文、历史、地理、英语、信息技术
- 工程/火箭/能源类：以 physics/chemistry/math/info-tech 为主，避免无关人文
- 消费决策类：以 math（统计/函数）为主，辅以相关科普与说明文写作
- 社会调查/人文/创作类：以 chinese/geography/history/english/info-tech 为主，不强行加理科
- 不要为凑学科数量加入与交付物无关的学科

${gradeHint}

只返回 JSON。`;
}

function userPromptFilter(goal, summaryList, complex, projectBlueprint, bloomProfile = null) {
  const domains = inferProjectDomains(goal);
  const blueprintBlock = formatBlueprintForMatch(projectBlueprint);
  const domainBlock = domains.length
    ? `\n【本项目模块参考（filter 的 subjects 须能覆盖这些）】\n${formatDomainHints(domains)}\n`
    : '';
  const bloom = bloomProfile || inferBloomFromBlueprint(projectBlueprint);
  const bloomBlock = formatBloomHintForFilter(bloom);
  const gradeHint = complex
    ? `\n- grades 一般落在 7-12（初中、高中），除非项目面向小学`
    : '';
  return `PBL项目目标：${goal}
${formatTopicAnchorBlock(goal)}${blueprintBlock}${domainBlock}${bloomBlock}
可用的知识体系：
${summaryList}

返回 JSON：
{
  "subjects": ["math", "chinese", "geography"],
  "systems": ["cn", "ap"],
  "grades": [7, 8, 9],
  "projectDomains": ["从交付物拆出的 3-5 个模块名称"],
  "bloomCeiling": 3,
  "bloomEvidence": ["从蓝图 steps 提取的 2-4 条任务"],
  "actionVerbs": ["测量", "统计"],
  "reasoning": "说明各模块对应的学科与年级"
}

注意：
- subjects 取值：math/physics/chemistry/biology/chinese/english/history/geography/info-tech/science
- systems：cn/ap/cambridge/ib/us
- projectDomains：从项目交付物拆出的 3-5 个模块名称
- **学科按项目类型自然选取**，理工类用理科、社科人文创作类用文科/信息技术，不要硬塞无关学科
- 通常 2-5 个学科即可${gradeHint}`;
}

/** 匹配阶段按项目类型给出针对性红线 */
function typeMatchHints(goal) {
  switch (classifyProjectType(goal)) {
    case 'consumer-decision':
      return `\n### 类型要求：消费决策\n- 交付物是决策报告/对比测算表；优先统计、函数/百分比、相关科普（如内燃机效率）、环境排放、说明文写作\n- 禁止 matched：电解池、原电池、程序控制、电磁感应、电池温度、传感器、数据采集算法\n- external 示例：全生命周期用车成本、购置补贴/税费政策、保值率评估（课标外）`;
    case 'engineering':
      return `\n### 类型要求：工程/制作\n- 覆盖原理→装置→实验→必要定量；含至少 1 个装置/实验类节点\n- 数学 index ≤25%；名称含「计算/求解/方程式」的 ≤20%`;
    case 'scientific-inquiry':
      return isChemistryInquiryGoal(goal)
        ? (getChemistryAnalysisProfile(goal).mixed
          ? `\n### 类型要求：混合溶液间接测定（如食堂汤水测盐）\n- 样品为**混合溶液**，不能直接用「称量溶质求质量分数」；主方案须为**硝酸银滴定法**（Ag⁺+Cl⁻→AgCl↓）和/或**电导率法**（标准曲线）\n- matched 优先：离子反应、沉淀滴定、物质的量浓度、电解质溶液/电导率；math 用于换算与误差\n- **禁止** matched：程序设计、人体器官、饮食营养、仅用小学「数据收集/描述」糊弄\n- projectPhases 每步写清取样、滴定/测电导率、换算，禁止空话`
          : `\n### 类型要求：化学溶液/浓度探究\n- **以 chemistry 为主线**（溶液、溶质溶剂、质量分数、溶解、配制）；math 仅用于数据记录/统计图表\n- **禁止** matched：程序设计、信息技术、人体器官系统、泛泛的「饮食营养与健康」\n- projectPhases 任务须写清实验步骤与计算，禁止「完成课件」空话`)
        : `\n### 类型要求：科学探究\n- 必含实验设计与数据分析类节点；理论与实验并重，不要只选纯计算`;
    case 'social-inquiry':
      return `\n### 类型要求：社会调查\n- 围绕调查方法、统计分析、报告写作；可用语文/地理/历史/数学，**不要塞理科公式**`;
    case 'humanities-literary':
      return `\n### 类型要求：人文/文学\n- 围绕阅读、写作、表达、文化理解（语文/英语/历史）；**不要塞理科或工程节点**`;
    case 'creative-media':
      return `\n### 类型要求：创意/媒体\n- 围绕创意、设计、制作、展示；仅在确需技术实现时引入信息技术/数学`;
    case 'business-economics':
      return `\n### 类型要求：商业/经济\n- 围绕调研、成本定价测算、方案与表达（数学/语文/信息技术）`;
    case 'life-planning':
      return `\n### 类型要求：生活规划/活动策划\n- 围绕需求目标、方案日程、预算分工、执行复盘（数学/语文/地理）；不要塞工程装置或纯理科公式`;
    case 'health-life':
      return `\n### 类型要求：健康生活\n- 围绕健康知识、现状监测统计、行为计划与评估（生物/科学/数学/语文）；不要堆与健康无关的工程或纯计算节点`;
    case 'planting-cultivation': {
      const t = extractTopicProfile(goal);
      const crop = t.crop || plantingCropLabel(goal);
      return `\n### 类型要求：种植养殖/园艺栽培（${t.coreTopic}）\n- 交付物是**种植观察日记**，不是工程原型或浸润式场景任务\n- matched **必须**覆盖：植物分类/特征、生长原理（光合/种子萌发/根系吸收）、栽培相关、数据记录\n- 优先：植物的一生、绿色植物结构、种子结构与萌发、光合作用、植物分类、条形/折线统计图、说明文/日记写作\n- **禁止** matched：朝花夕拾、文言、外国文学、牛顿定律、化学方程式、程序设计、机械玩具\n- reason 须写明如何用于「${crop}」种植的具体环节（如辨认分类、理解生长、记录株高）`;
    }
    case 'labor-practice':
      return `\n### 类型要求：劳动实践\n- 围绕动手操作、观察记录、成果分享（科学/生物/语文/数学）；贴近真实操作，不要拔高成科研论文或工程系统`;
    case 'industry-innovation': {
      const t = extractTopicProfile(goal);
      const topic = t.coreTopic || '主题产业';
      return `\n### 类型要求：产业创新/新兴经济（${topic}）\n- 交付物是**${topic}创新方案/调研报告**，不是装置制作或软件工程\n- matched 须能支撑：产业背景政策、应用场景、技术原理（如飞行/导航）、数据统计、方案论证\n- 优先：交通运输布局、交通与区域发展、抛体/牛顿（飞行原理）、统计调查、说明文/报告写作、中国经济地理\n- **禁止** matched：现代物流管理（除非 reason 明确写「${topic}低空物流配送」）、智慧城市、程序设计、电解池、小学数学\n- reason 必须写明该知识点如何用于「${topic}」的具体环节，禁止泛泛「了解产业发展」`;
    }
    case 'exhibition-redesign': {
      const t = extractTopicProfile(goal);
      const topic = t.coreTopic || '场馆';
      return `\n### 类型要求：展陈空间/场馆改造（${topic}）\n- 交付物是**${topic}改造方案册**（现状诊断+展陈设计+整改清单），不是软件工程或装置研发\n- matched 须支撑：现状调查、天文/太空科普内容、展板设计、预算统计、说明文写作\n- 优先：太阳系、地球与宇宙、说明文写作、统计图表、简单设计/信息技术\n- **禁止** matched：招生简章、程序设计、电解池、牛顿定律（除非用于科普讲解）、外国文学、小学数学\n- reason 必须写明如何用于「${topic}」改造的具体环节`;
    }
    default:
      return `\n### 类型要求：综合实践\n- 每个节点服务交付物某一步，学科按需自然选取\n- 若题目抽象，先落地为 1 个可检查交付物，再选课标；禁止泛素养凑数${ANTI_VACUUM_BLOCK}`;
  }
}

// 复杂非 STEM 项目的示范（社会调查类），避免 LLM 照抄工程示例而跑偏
const GENERIC_COMPLEX_EXAMPLE = `
返回 JSON 格式（严格遵循；下列 index 仅为**格式示范**，你必须在【候选知识点】中重新检索并填写真实 index）：
{
  "matched": [
    {"index": 1, "confidence": 0.92, "role": "foundation", "reason": "模块：选题与调查设计。明确调查问题、对象与抽样方法", "dependsOn": []},
    {"index": 4, "confidence": 0.90, "role": "bridge", "reason": "模块：整理与统计分析。用统计图表呈现调查数据", "dependsOn": [1]},
    {"index": 7, "confidence": 0.88, "role": "core", "reason": "模块：结论与报告。撰写调查报告并提出建议", "dependsOn": [4]}
  ],
  "pathOrder": [1, 4, 7],
  "knowledgeChain": "调查与抽样设计 → 数据整理与统计图表 → 报告写作与论证表达",
  "projectPhases": [
    {
      "phase": "选题与调查设计",
      "steps": ["确定调查问题与对象", "设计问卷/访谈提纲与抽样方案"],
      "knowledgeNames": ["数据的收集"],
      "deliverable": "调查方案与问卷初稿",
      "literacy": {
        "knowledge": "理解抽样与调查方法的适用条件",
        "method": "用问卷/访谈设计获取一手资料",
        "ability": "能针对问题设计可操作的调查工具",
        "attitude": "尊重受访者、如实记录",
        "emotion": "对真实社会现象产生探究兴趣",
        "values": "树立实事求是的调查伦理"
      }
    },
    {
      "phase": "数据整理与分析",
      "steps": ["整理回收数据", "用统计图表分析趋势"],
      "knowledgeNames": ["条形统计图与折线统计图"],
      "deliverable": "数据分析图表",
      "literacy": {
        "knowledge": "掌握统计图表的选择与解读",
        "method": "用平均数/百分比刻画数据特征",
        "ability": "能从数据中发现规律与异常",
        "attitude": "客观对待数据，不臆断结论",
        "emotion": "体验用数据说话的成就感",
        "values": "尊重数据、不篡改结果"
      }
    },
    {
      "phase": "结论与报告",
      "steps": ["归纳结论", "撰写调查报告并提出建议"],
      "knowledgeNames": ["说明文写作"],
      "deliverable": "调查报告与答辩",
      "literacy": {
        "knowledge": "理解调查报告的结构与论证方式",
        "method": "用证据支撑结论、分层表达",
        "ability": "能清晰传达发现并提出可行建议",
        "attitude": "严谨论证、负责任地发声",
        "emotion": "在分享中获得表达自信",
        "values": "关注社会议题、服务公共利益"
      }
    }
  ],
  "external": [
    {"name": "问卷信效度检验", "reason": "调查工具质量保障方法，课标提及较少但本项目必需", "prerequisites": ["数据的收集"]},
    {"name": "访谈伦理与知情同意", "reason": "田野调查伦理要求，课本通常不单独讲授"}
  ],
  "techRoute": "阶段一：明确调查问题并设计问卷与抽样；阶段二：整理回收数据并用统计图表分析；阶段三：归纳结论、撰写报告并答辩。"
}`;

const LOW_ALTITUDE_ECONOMY_EXAMPLE = `
返回 JSON 格式（严格遵循；下列 index 仅为**格式示范**，你必须在【候选知识点】中重新检索并填写真实 index，禁止照抄示例数字）：
{
  "matched": [
    {"index": 2, "confidence": 0.94, "role": "foundation", "reason": "模块：低空经济背景与政策。用区域发展与交通布局理解低空产业与空域资源的空间约束", "dependsOn": []},
    {"index": 5, "confidence": 0.91, "role": "foundation", "reason": "模块：低空经济背景与政策。从中国经济地理把握产业政策与试点城市分布", "dependsOn": []},
    {"index": 8, "confidence": 0.90, "role": "bridge", "reason": "模块：应用场景调研。用统计调查方法整理无人机配送/应急/植保等场景需求数据", "dependsOn": [2]},
    {"index": 11, "confidence": 0.89, "role": "bridge", "reason": "模块：技术原理支撑。用抛体运动分析低空飞行器起降与航线高度约束", "dependsOn": [8]},
    {"index": 17, "confidence": 0.92, "role": "core", "reason": "模块：数据与可行性分析。用图表比较不同低空应用场景的成本效益", "dependsOn": [8]},
    {"index": 23, "confidence": 0.88, "role": "core", "reason": "模块：创新方案与报告。用说明文结构撰写低空经济创新方案与试点建议", "dependsOn": [17]}
  ],
  "pathOrder": [2, 5, 8, 11, 17, 23],
  "knowledgeChain": "产业政策与区域交通 → 场景调研与统计 → 飞行原理支撑 → 可行性分析 → 创新方案报告",
  "projectPhases": [
    {
      "phase": "低空经济背景与政策梳理",
      "steps": ["检索国家及本地低空经济试点政策≥3条并摘录要点", "用思维导图归纳空域、产业、安全三类关键词"],
      "knowledgeNames": ["交通运输布局", "中国的经济发展"],
      "deliverable": "政策与产业背景对照表",
      "literacy": {
        "knowledge": "理解低空经济是低空空域飞行活动带动的新兴产业",
        "method": "用权威来源摘录并标注政策要点",
        "ability": "能说明政策与本地场景的关系",
        "attitude": "尊重法规、不夸大政策红利",
        "emotion": "对新兴产业机遇保持理性好奇",
        "values": "关注公共安全与合规发展"
      }
    },
    {
      "phase": "应用场景调研",
      "steps": ["选定1个低空场景（配送/应急/植保/出行）并设计10题问卷", "回收≥20份有效问卷并制成统计图表"],
      "knowledgeNames": ["数据的收集", "统计图表"],
      "deliverable": "场景需求调研表与图表",
      "literacy": {
        "knowledge": "掌握调查设计与数据整理方法",
        "method": "用问卷与图表呈现场景需求",
        "ability": "能从数据提炼1条场景痛点",
        "attitude": "如实记录、不篡改数据",
        "emotion": "在实地调研中增强社会观察力",
        "values": "尊重受访者隐私与知情同意"
      }
    },
    {
      "phase": "技术原理与安全要点",
      "steps": ["查阅无人机飞行高度、载重、续航三类参数并制对比表", "用抛体运动示意图说明起降安全距离估算思路"],
      "knowledgeNames": ["抛体运动", "牛顿运动定律"],
      "deliverable": "技术参数与安全要点笔记",
      "literacy": {
        "knowledge": "理解飞行高度与运动学基本关系",
        "method": "用示意图辅助解释技术约束",
        "ability": "能指出方案中的1项安全风险",
        "attitude": "把安全合规放在首位",
        "emotion": "体验跨学科理解技术的成就感",
        "values": "树立空域安全与公众利益意识"
      }
    },
    {
      "phase": "创新方案与可行性论证",
      "steps": ["提出1个低空经济创新点子并写200字场景描述", "用成本效益简表论证可行性并列出2条落地障碍"],
      "knowledgeNames": ["说明文写作"],
      "deliverable": "低空经济创新方案报告",
      "literacy": {
        "knowledge": "掌握创新方案报告的结构与论证方式",
        "method": "用数据与政策依据支撑建议",
        "ability": "能提出可操作的试点建议",
        "attitude": "论证务实、承认局限",
        "emotion": "在方案打磨中获得表达自信",
        "values": "平衡创新与公共安全"
      }
    }
  ],
  "external": [
    {"name": "低空空域分类与管理要点", "reason": "空域划设与飞行审批是低空经济落地关键，课标无专项条目", "prerequisites": ["交通运输布局"]},
    {"name": "无人机飞行安全操作规范", "reason": "场景调研后须理解禁飞区与操作红线，课本较少系统讲授", "prerequisites": ["抛体运动"]}
  ],
  "techRoute": "阶段一：梳理低空经济政策与产业背景；阶段二：调研典型应用场景并统计需求；阶段三：补足飞行原理与安全要点；阶段四：撰写创新方案并完成可行性论证。"
}`;

function userPromptMatch(goal, candidateList, complex, maxMatched, minConf, domainHints, projectBlueprint, bloomProfile = null, archetypeId = null) {
  const matchedRange = complex ? `5-${Math.min(maxMatched, 8)}` : `8-${maxMatched}`;
  const externalMax = complex ? 2 : 3;
  const domains = domainHints && domainHints.length ? domainHints : inferProjectDomains(goal);
  const blueprintSection = formatBlueprintForMatch(projectBlueprint);
  const domainSection = domains.length
    ? `\n【项目模块 — 每个至少 1 个 matched，reason 必须以「模块：XXX」开头】\n${formatDomainHints(domains)}\n`
    : '';
  const projectType = classifyProjectType(goal);
  const topic = extractTopicProfile(goal);
  const stemType = ['engineering', 'scientific-inquiry'].includes(projectType);

  // 工程类用模型火箭示范；产业创新用低空经济示范；非 STEM 复杂项目用社会调查示范
  const rocketExample = complex ? `
返回 JSON 格式（严格遵循；下列 index 仅为**格式示范**，你必须在【候选知识点】中重新检索并填写真实 index，禁止照抄示例数字）：
{
  "matched": [
    {"index": 2, "confidence": 0.93, "role": "foundation", "reason": "子系统：运动学与动力学。建立受力与加速度关系，为弹道分析打基础", "dependsOn": []},
    {"index": 5, "confidence": 0.91, "role": "foundation", "reason": "子系统：推进与燃料。理解燃烧与氧化还原，解释化学能转化为推进动能", "dependsOn": []},
    {"index": 8, "confidence": 0.90, "role": "bridge", "reason": "子系统：空气动力与弹道。将运动分解为水平和竖直分量，分析飞行轨迹", "dependsOn": [2]},
    {"index": 11, "confidence": 0.89, "role": "bridge", "reason": "子系统：空气动力与弹道。理解气流与压强差，解释箭体所受升力与阻力", "dependsOn": [8]},
    {"index": 17, "confidence": 0.92, "role": "core", "reason": "子系统：运动学与动力学。用牛顿定律分析发射瞬间推力与加速度", "dependsOn": [2, 8]},
    {"index": 23, "confidence": 0.86, "role": "core", "reason": "子系统：控制与测试。设计发射实验、测量飞行高度与落点", "dependsOn": [17]}
  ],
  "pathOrder": [5, 2, 8, 11, 17, 23],
  "knowledgeChain": "氧化还原与燃烧 → 牛顿定律 → 抛体运动 → 流体压强与阻力 → 发射实验测试",
  "projectPhases": [
    {
      "phase": "推进原理与燃料选型",
      "steps": ["分析推进剂燃烧反应", "估算化学能转化为动能"],
      "knowledgeNames": ["氧化还原反应概念", "内能与热量"],
      "deliverable": "推进剂方案与能量估算表",
      "literacy": {
        "knowledge": "理解燃烧本质是氧化还原与能量释放",
        "method": "用热值数据估算推进能量",
        "ability": "能比较不同推进方案的化学能输出",
        "attitude": "严谨对待化学品使用与用量计算",
        "emotion": "对「一点燃料推动火箭」的化学反应感到好奇",
        "values": "树立实验安全与环保意识，合规处置残余药剂"
      }
    },
    {
      "phase": "弹道与空气动力分析",
      "steps": ["建立抛体运动模型", "讨论气流对箭体的影响"],
      "knowledgeNames": ["抛体运动", "流体压强与流速关系"],
      "deliverable": "弹道预测草图与关键参数表",
      "literacy": {
        "knowledge": "掌握抛体分解与流体压强基本原理",
        "method": "用物理模型预测轨迹并标注假设条件",
        "ability": "能解释发射角度与射程的关系",
        "attitude": "养成先建模再实验的科学思维",
        "emotion": "体验用公式预测飞行轨迹的成就感",
        "values": "尊重实测数据，不夸大模型精度"
      }
    },
    {
      "phase": "结构设计与制作",
      "steps": ["设计箭体结构", "检查重心与稳定性"],
      "knowledgeNames": ["牛顿运动定律"],
      "deliverable": "模型火箭原型与结构说明",
      "literacy": {
        "knowledge": "理解受力平衡与运动状态改变条件",
        "method": "用工程草图表达结构尺寸与连接方式",
        "ability": "能根据力学分析改进结构设计",
        "attitude": "细致检查每个连接部位",
        "emotion": "享受从图纸到实物的创造过程",
        "values": "强调制作规范与发射安全距离"
      }
    },
    {
      "phase": "发射测试与迭代",
      "steps": ["制定发射与测距方案", "记录数据并对比预测"],
      "knowledgeNames": ["抛体运动"],
      "deliverable": "测试报告（预测 vs 实测）",
      "literacy": {
        "knowledge": "综合运用动力学与弹道知识解释偏差",
        "method": "控制变量法组织对比发射实验",
        "ability": "能根据测试数据提出改进建议",
        "attitude": "客观记录失败发射并分析原因",
        "emotion": "在迭代中保持对科学探究的热情",
        "values": "遵守安全规程，对他人与场地负责"
      }
    }
  ],
  "external": [
    {"name": "模型火箭安全发射规范", "reason": "课标中无专项安全规程，但发射环节必需", "prerequisites": ["发射实验设计"]}
  ],
  "techRoute": "阶段一：从氧化还原与内能/热值理解推进剂能量；阶段二：用抛体运动与流体压强建立弹道模型；阶段三：依据牛顿定律完成结构受力设计与制作；阶段四：实施发射测试，用数据验证并迭代优化。"
}` : `
返回 JSON 格式（严格遵循）：
{
  "matched": [
    {"index": 3, "confidence": 0.95, "role": "foundation", "reason": "模块：基础建模。建立变量与关系", "dependsOn": []},
    {"index": 8, "confidence": 0.90, "role": "bridge", "reason": "模块：原理/方法探究。连接基础与产出", "dependsOn": [3]}
  ],
  "pathOrder": [3, 8],
  "knowledgeChain": "基础概念 → 原理/方法探究 → 产出实现",
  "projectPhases": [],
  "external": [
    {"name": "跨学科资料检索与引用", "reason": "整合多来源信息，课标较少系统讲授但项目落地必需"}
  ],
  "techRoute": "按模块递进实施"
}`;

  let example = rocketExample;
  if (topic.coreTopic === '低空经济' || projectType === 'industry-innovation') {
    example = LOW_ALTITUDE_ECONOMY_EXAMPLE;
  } else if (complex && !stemType) {
    example = GENERIC_COMPLEX_EXAMPLE;
  }

  const bloom = bloomProfile || inferBloomFromBlueprint(projectBlueprint);
  const bloomBlock = formatBloomHintForMatch(bloom);
  const archetype = archetypeId
    ? resolveArchetype(goal, classifyProjectType(goal), getChemistryAnalysisProfile(goal).mixed)
    : resolveArchetype(goal, classifyProjectType(goal), getChemistryAnalysisProfile(goal).mixed);
  const archetypeBlock = formatArchetypeForMatch(archetype, projectBlueprint);
  const registryBlock = archetype ? formatRegistryForMatch(archetype.id) : '';

  return `【项目目标】
${goal}
${formatTopicAnchorBlock(goal)}${blueprintSection}${domainSection}${archetypeBlock}${bloomBlock}${registryBlock}
【候选知识点】（matched 只能选下列 index；**先对齐上方蓝图阶段与 knowledgeHints**，再按模块检索选 index）
${candidateList}

${example}

## 硬性要求

### 0. 贴合交付物（最高优先级）
- 每个 matched 的 reason **必须以「模块：」开头**
- **5-8 个精准节点**即可；不要为了学科齐全凑数
- **严禁**选与交付物无关的 index（编造、凑数、跑题）
- 学科按项目类型自然选取，理工类用理科、社科人文创作类用文科/信息技术
${typeMatchHints(goal)}

### 1. 数量与角色
- matched：${matchedRange} 个，confidence≥${minConf}
- ${complex ? 'foundation 1-2、bridge 2-3、core 2-3；避免与交付物无关的 index' : '覆盖至少 2 个模块'}

### 2. 知识链
- dependsOn 构成 DAG；pathOrder 满足依赖
- knowledgeChain 体现模块递进（按项目类型，如：调查设计 → 数据分析 → 报告表达）

### 3. projectPhases
- ${complex ? '4-5' : '3-5'} 个阶段，按模块组织
- knowledgeNames **只能**使用候选列表中出现的名称（字面匹配或明显子串）
- 每阶段 literacy 六维各 1 句，结合学科与项目类型，禁止套话

### 4. 跨学科（可选，不强制）
- 围绕交付物自然跨学科即可；**禁止**为凑学科引入与项目无关的节点

### 5. external（课标外，硬性要求）
- **必须**输出 1-${externalMax} 个课标外知识点，不可为空数组
- 填写候选列表中**没有**、但完成本项目**确实需要**的专业/实践概念（如安全规范、政策解读、行业方法、工具操作等）
- 每个 external 须有 name + reason（说明为何课标未覆盖但项目必需）；可选 prerequisites 填关联的 matched 知识点名称

### 6. techRoute
- 中文，500 字内，按模块串联，体现项目实施的递进逻辑`;
}

const SUBJECT_ZH = {
  math: '数学', physics: '物理', chemistry: '化学', biology: '生物',
  science: '科学', 'info-tech': '信息技术', chinese: '语文', english: '英语',
  history: '历史', geography: '地理',
  engineering: '工程', 'computer-science': '计算机科学',
};

/**
 * @param {'decompose'|'filter'|'match'} stage
 * @param {object} payload
 * @returns {{ role: string, content: string }[]}
 */
export function buildPBMessages(stage, payload) {
  const {
    goal = '',
    summaryList = '',
    candidates = [],
    complex = false,
    maxMatched = complex ? PBL_MAX_MATCHED_COMPLEX : PBL_MAX_MATCHED_NORMAL,
    minConf = 0.68,
    domainHints = null,
    projectBlueprint = null,
    bloomProfile = null,
    archetypeId = null,
  } = payload;

  if (stage === 'decompose') {
    return [
      { role: 'system', content: systemPromptDecompose(complex, goal) },
      { role: 'user', content: userPromptDecompose(goal, complex) },
    ];
  }

  if (stage === 'filter') {
    const bloom = bloomProfile || inferBloomFromBlueprint(projectBlueprint);
    return [
      { role: 'system', content: systemPromptFilter(complex, goal) },
      { role: 'user', content: userPromptFilter(goal, summaryList, complex, projectBlueprint, bloom) },
    ];
  }

  if (stage === 'match') {
    const candidateList = (candidates || []).map((n, i) => {
      const gradeStr = n.gradeLabel || (n.grade ? `G${n.grade}` : '通识');
      const subj = SUBJECT_ZH[n.subject] || n.subject || '';
      const prereq = (n.prerequisiteNames || []).slice(0, 3).join('、') || '无';
      const def = String(n.definition || '').replace(/\s+/g, ' ').slice(0, 72);
      const defPart = def ? ` | ${def}` : '';
      return `[${i}] ${n.name} | ${gradeStr} | ${subj} | 先修:${prereq}${defPart}`;
    }).join('\n');

    const hints = domainHints && domainHints.length ? domainHints : inferProjectDomains(goal);
    const bloom = bloomProfile || inferBloomFromBlueprint(projectBlueprint);

    return [
      { role: 'system', content: systemPromptMatch(complex, goal) },
      {
        role: 'user',
        content: userPromptMatch(goal, candidateList, complex, maxMatched, minConf, hints, projectBlueprint, bloom, archetypeId),
      },
    ];
  }

  throw new Error(`Unknown PBL stage: ${stage}`);
}

export { inferProjectDomains };
