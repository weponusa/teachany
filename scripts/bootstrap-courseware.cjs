#!/usr/bin/env node
/**
 * TeachAny 课件启动器（Bootstrap）v1.0
 * 
 * 在 AI 生成课件之前运行此脚本，自动完成 Phase 0.5 的知识层数据提取，
 * 生成一个 _context.json 文件，AI 只需 read_file 即可获取全部所需数据。
 * 
 * 用法：
 *   node scripts/bootstrap-courseware.cjs --topic "一次函数" --subject math --grade 8
 *   node scripts/bootstrap-courseware.cjs --topic "光合作用" --subject biology --grade 7
 *   node scripts/bootstrap-courseware.cjs --topic "欧姆定律" --subject physics --grade 9
 * 
 * 输出：
 *   ./output/_context.json — 包含知识图谱、易错点、题目、模板片段的完整上下文
 * 
 * 这个脚本解决的核心问题：
 *   将"AI 需要自觉执行 4 级降级链"变成"运行一个命令，数据自动就位"
 */

const fs = require('fs');
const path = require('path');

// ─── 参数解析 ───
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

// ─── 学科 → 领域映射（自动推断 domain） ───
const TOPIC_DOMAIN_MAP = {
  math: {
    '一次函数|正比例|函数|坐标系|变量': 'functions',
    '方程|不等式|代数|整式|因式': 'algebra',
    '三角|圆|几何|面积|体积|角|平行|垂直|对称|全等|相似': 'geometry-primary',
    '统计|概率|频率|平均数|中位数': 'statistics-probability-primary',
    '分数|小数|整数|运算|四则': 'numbers-operations',
    '长度|重量|时间|面积|体积|单位': 'measurement',
    '函数|导数|三角函数|数列|向量|集合|不等式|圆锥曲线|概率统计': 'high-school',
  },
  physics: {
    '力|牛顿|重力|摩擦|弹力|压强|浮力': 'mechanics',
    '电|欧姆|电阻|电压|电流|电功|焦耳': 'electricity',
    '光|折射|反射|透镜|色散': 'optics',
    '热|温度|内能|比热|热量|物态': 'thermal',
    '声|振动|频率|响度|音调': 'acoustics',
    '磁|电磁|感应|发电机|电动机': 'electromagnetism',
  },
  chemistry: {
    '原子|元素|分子|离子|化合物': 'matter-structure',
    '氧化|还原|酸|碱|盐|中和': 'reactions',
    '溶液|溶解|浓度|饱和': 'solutions',
    '有机|碳|甲烷|乙醇': 'organic',
  },
  biology: {
    '细胞|显微镜|组织|器官': 'cell-basics',
    '光合|呼吸|蒸腾|植物': 'plant-physiology',
    '消化|循环|呼吸|泌尿|神经|人体': 'human-body',
    '遗传|基因|DNA|变异|进化': 'genetics',
    '生态|食物链|生物圈|环境': 'ecology',
  },
  chinese: {
    '修辞|比喻|拟人|夸张|排比': 'rhetoric',
    '文言文|古文|翻译|虚词|实词': 'classical',
    '阅读|理解|中心思想|段落': 'reading',
    '写作|作文|记叙|议论|说明': 'writing',
    '诗词|古诗|唐诗|宋词': 'poetry',
    '拼音|识字|笔画|偏旁': 'literacy',
  },
  english: {
    '时态|语法|句型|被动|从句': 'grammar',
    '阅读|理解|passage|reading': 'reading',
    '写作|作文|writing|essay': 'writing',
    '听力|口语|对话|交际': 'listening-speaking',
  },
  history: {
    '古代|夏|商|周|秦|汉|唐|宋|元|明|清': 'ancient-china',
    '近代|鸦片|太平|洋务|辛亥|五四': 'modern-china',
    '世界|古埃及|古希腊|罗马|中世纪': 'world-ancient',
    '工业革命|一战|二战|冷战': 'world-modern',
  },
  geography: {
    '地球|经纬|时区|自转|公转': 'earth',
    '气候|天气|气温|降水|季风': 'climate',
    '地形|山脉|河流|平原|高原': 'landform',
    '人口|城市|农业|工业|交通': 'human-geography',
  },
  'info-tech': {
    '算法|编程|Python|Scratch|循环|条件': 'programming',
    '网络|互联网|IP|安全': 'network',
    '数据|文件|数据库|表格': 'data',
  },
};

// ─── 推断 domain ───
function inferDomain(topic, subject) {
  const map = TOPIC_DOMAIN_MAP[subject];
  if (!map) return null;

  for (const [pattern, domain] of Object.entries(map)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(topic)) return domain;
  }
  return null;
}

// ─── 查找数据目录 ───
function findDataDir() {
  // 从脚本位置向上找 skillhub-package/references/data
  const scriptDir = __dirname;
  const candidates = [
    path.join(scriptDir, '..', 'skillhub-package', 'references', 'data'),
    path.join(scriptDir, '..', 'references', 'data'),
    path.join(scriptDir, 'references', 'data'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return path.resolve(dir);
  }
  return null;
}

// ─── 在图谱中模糊搜索节点 ───
function searchNodes(graphData, topic) {
  if (!graphData || !graphData.nodes) return [];

  const keywords = topic.split(/[、，,\s]+/).filter(Boolean);
  return graphData.nodes.filter(node => {
    const searchText = [
      node.name, node.name_en, node.definition,
      ...(node.key_concepts || []),
      ...(node.real_world || []),
    ].join(' ');

    return keywords.some(kw => searchText.includes(kw));
  });
}

// ─── 在易错点中搜索 ───
function searchErrors(errorsData, nodeIds) {
  if (!errorsData) return [];
  const arr = Array.isArray(errorsData) ? errorsData : (errorsData.errors || []);
  return arr.filter(e => nodeIds.includes(e.node_id));
}

// ─── 在题库中搜索 ───
function searchExercises(exercisesData, nodeIds) {
  if (!exercisesData) return [];
  const arr = Array.isArray(exercisesData) ? exercisesData : (exercisesData.exercises || []);
  return arr.filter(e => nodeIds.includes(e.node_id));
}

// ─── 读取 JSON 文件 ───
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── 生成课件模板片段 ───
function generateTemplateHints(nodeData, errors, exercises) {
  const hints = {};

  if (nodeData) {
    // ABT 引入建议
    if (nodeData.real_world && nodeData.real_world.length > 0) {
      hints.abt_suggestion = {
        and: `学生已掌握 ${(nodeData.prerequisites || []).join('、') || '基础知识'}`,
        but: `但还不能 ${nodeData.bloom_verbs?.apply || '运用新知识解决问题'}`,
        therefore: `所以要学 ${nodeData.name}`,
        scenario: nodeData.real_world[0],
      };
    }

    // 前测建议
    if (nodeData.prerequisites && nodeData.prerequisites.length > 0) {
      hints.pretest_focus = `前测应检验 ${nodeData.prerequisites.join('、')} 的掌握情况`;
    }

    // 记忆辅助
    if (nodeData.memory_anchors) {
      hints.memory_aids = nodeData.memory_anchors;
    }

    // Bloom 练习设计
    if (nodeData.bloom_verbs) {
      hints.bloom_design = nodeData.bloom_verbs;
    }
  }

  // 高频易错点作为干扰项
  if (errors.length > 0) {
    hints.high_freq_errors = errors
      .filter(e => e.frequency === 'high')
      .map(e => ({
        description: e.description,
        wrong: e.wrong_answer,
        correct: e.correct_answer,
        diagnosis: e.diagnosis,
      }));
  }

  // 可直接复用的题目
  if (exercises.length > 0) {
    hints.reusable_exercises = exercises.slice(0, 8).map(ex => ({
      id: ex.id,
      bloom_level: ex.bloom_level,
      difficulty: ex.difficulty,
      type: ex.type,
      stem: ex.stem,
    }));
  }

  return hints;
}

// ─── meta 标签模板 ───
function generateMetaTags(nodeData, subject, grade) {
  if (!nodeData) return '';
  return [
    `<meta name="teachany-node" content="${nodeData.id}">`,
    `<meta name="teachany-subject" content="${subject}">`,
    `<meta name="teachany-domain" content="${nodeData.unit || ''}">`,
    `<meta name="teachany-grade" content="${grade}">`,
    `<meta name="teachany-prerequisites" content="${(nodeData.prerequisites || []).join(',')}">`,
    `<meta name="teachany-difficulty" content="3">`,
    `<meta name="teachany-version" content="2.0">`,
    `<meta name="teachany-author" content="">`,
  ].join('\n');
}

// ─── 主函数 ───
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.topic || !args.subject) {
    console.log('\n📋 TeachAny 课件启动器（Bootstrap）v1.0\n');
    console.log('用法：');
    console.log('  node scripts/bootstrap-courseware.cjs --topic "一次函数" --subject math --grade 8');
    console.log('  node scripts/bootstrap-courseware.cjs --topic "光合作用" --subject biology --grade 7');
    console.log('  node scripts/bootstrap-courseware.cjs --topic "欧姆定律" --subject physics --grade 9\n');
    console.log('参数：');
    console.log('  --topic     课题名称（必需）');
    console.log('  --subject   学科（必需）: math, physics, chemistry, biology, chinese, english, history, geography, info-tech');
    console.log('  --grade     年级（可选）: 1-12');
    console.log('  --output    输出目录（可选，默认 ./output）');
    process.exit(0);
  }

  const { topic, subject, grade = '8', output: outputDir = './output' } = args;

  console.log('\n🚀 TeachAny 课件启动器\n');
  console.log(`  📝 课题：${topic}`);
  console.log(`  📚 学科：${subject}`);
  console.log(`  🎓 年级：${grade}`);

  // Step 1: 查找数据目录
  const dataDir = findDataDir();
  if (!dataDir) {
    console.log('\n⚠️  未找到知识层数据目录，将生成空上下文（需要 AI 通过 Web 搜索补充）');
    const context = {
      topic, subject, grade,
      source: '🥊 模型知识（数据目录未找到）',
      graph_node: null,
      errors: [],
      exercises: [],
      template_hints: {},
      meta_tags: '',
      warning: '知识层数据未找到，AI 必须通过 Web 搜索获取知识数据',
    };
    fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.join(outputDir, '_context.json');
    fs.writeFileSync(outPath, JSON.stringify(context, null, 2), 'utf8');
    console.log(`\n📄 已生成：${outPath}（空上下文）\n`);
    process.exit(0);
  }

  console.log(`  📁 数据目录：${dataDir}`);

  // Step 2: 推断 domain
  const domain = inferDomain(topic, subject);
  console.log(`  🏷️  推断 domain：${domain || '未匹配'}`);

  // Step 3: 读取知识图谱
  let graphData = null;
  let matchedNodes = [];
  let source = '🥊 模型知识';

  if (domain) {
    const graphPath = path.join(dataDir, subject, domain, '_graph.json');
    if (fs.existsSync(graphPath)) {
      graphData = readJSON(graphPath);
      matchedNodes = searchNodes(graphData, topic);
      if (matchedNodes.length > 0) {
        source = `🥈 JSON 直读 (${path.relative(process.cwd(), graphPath)})`;
      }
    }
  }

  // 如果精确 domain 没命中，尝试遍历该学科所有 domain
  if (matchedNodes.length === 0) {
    const subjectDir = path.join(dataDir, subject);
    if (fs.existsSync(subjectDir)) {
      const domains = fs.readdirSync(subjectDir).filter(d =>
        fs.statSync(path.join(subjectDir, d)).isDirectory()
      );
      for (const d of domains) {
        const graphPath = path.join(subjectDir, d, '_graph.json');
        if (fs.existsSync(graphPath)) {
          const data = readJSON(graphPath);
          const nodes = searchNodes(data, topic);
          if (nodes.length > 0) {
            graphData = data;
            matchedNodes = nodes;
            source = `🥈 JSON 直读 (${subject}/${d}/_graph.json)`;
            console.log(`  🔍 在 ${d} 中找到匹配节点`);
            break;
          }
        }
      }
    }
  }

  console.log(`  📊 数据来源：${source}`);
  console.log(`  🎯 匹配节点：${matchedNodes.length} 个`);

  // Step 4: 读取易错点和题目
  const nodeIds = matchedNodes.map(n => n.id);
  let errors = [];
  let exercises = [];

  if (graphData && domain) {
    const subjectDir = path.join(dataDir, subject);
    const domains = fs.readdirSync(subjectDir).filter(d =>
      fs.statSync(path.join(subjectDir, d)).isDirectory()
    );
    for (const d of domains) {
      const errPath = path.join(subjectDir, d, '_errors.json');
      const exPath = path.join(subjectDir, d, '_exercises.json');
      if (fs.existsSync(errPath)) {
        errors = errors.concat(searchErrors(readJSON(errPath), nodeIds));
      }
      if (fs.existsSync(exPath)) {
        exercises = exercises.concat(searchExercises(readJSON(exPath), nodeIds));
      }
    }
  }

  console.log(`  ⚠️  易错点：${errors.length} 条`);
  console.log(`  📝 题目：${exercises.length} 题`);

  // Step 5: 生成上下文
  const primaryNode = matchedNodes[0] || null;
  const context = {
    topic,
    subject,
    grade,
    source,
    timestamp: new Date().toISOString(),
    graph_node: primaryNode,
    related_nodes: matchedNodes.slice(1),
    edges: graphData?.edges?.filter(e =>
      nodeIds.includes(e.from) || nodeIds.includes(e.to)
    ) || [],
    errors,
    exercises,
    template_hints: generateTemplateHints(primaryNode, errors, exercises),
    meta_tags: generateMetaTags(primaryNode, subject, grade),
  };

  // Step 6: 输出
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, '_context.json');
  fs.writeFileSync(outPath, JSON.stringify(context, null, 2), 'utf8');

  console.log(`\n✅ 上下文文件已生成：${outPath}`);
  console.log(`   文件大小：${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);

  // 输出摘要
  if (primaryNode) {
    console.log('\n' + '─'.repeat(50));
    console.log(`📖 ${primaryNode.name}（${primaryNode.name_en || ''}）`);
    console.log(`   定义：${primaryNode.definition}`);
    console.log(`   前置：${(primaryNode.prerequisites || []).join(' → ') || '无'}`);
    console.log(`   后续：${(primaryNode.leads_to || []).join(' → ') || '无'}`);
    if (primaryNode.real_world) {
      console.log(`   场景：${primaryNode.real_world.slice(0, 3).join(' | ')}`);
    }
    if (primaryNode.memory_anchors) {
      console.log(`   记忆：${primaryNode.memory_anchors[0]}`);
    }
    if (errors.length > 0) {
      const highFreq = errors.filter(e => e.frequency === 'high');
      console.log(`   高频错误（${highFreq.length}条）：${highFreq.map(e => e.description).join('；')}`);
    }
    console.log('─'.repeat(50));
  }

  console.log('\n💡 AI 使用方式：直接 read_file 读取 _context.json，无需自行执行降级链\n');
}

main();
