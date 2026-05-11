/**
 * 升级 courseware-registry.json 中38个高中数学课件元数据到 v3.0
 * - 版本号 1.0 → 3.0
 * - 交互类型：Canvas/Slider/Quiz/ErrorDiagnosis/Scaffolding（核心节点）
 * - 描述中英文升级
 * - 核心节点（4个）有特殊丰富描述
 */
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'courseware-registry.json');

// 4个核心节点（有完整真实教学数据+Canvas可视化）
const CORE_NODES = ['sets', 'propositions', 'functions-concept', 'function-properties'];

// 14个有Canvas交互可视化的节点
const CANVAS_NODES = [
  'sets',               // Venn图集合运算
  'propositions',        // (核心)
  'functions-concept',   // (核心)
  'function-properties', // (核心) 函数图像拖拽
  'exponential-function', // 指数函数图像拖拽
  'logarithmic-function', // 对数函数图像拖拽
  'power-function',       // 幂函数图像拖拽
  'trig-ratios',          // 单位圆交互
  'trig-graphs',          // 三角函数图像
  'derivative-concept',   // 切线可视化
  'ellipse',             // 椭圆参数调节
  'hyperbola',           // 双曲线参数调节
  'parabola-h',          // 抛物线参数调节
  'line-equation'        // 直线 y=kx+b 滑块
];

// 每个节点的中文描述（v3.0）
const DESCRIPTIONS = {
  'sets': {
    zh: '高一集合概念与运算互动课件。Venn图可视化交集/并集/补集、公式框、典型例题（子集个数2ⁿ）、常见错误诊断（混淆∈和⊆）、分层练习。',
    en: 'Interactive courseware on sets. Venn diagram visualization, formula boxes, worked examples (subset count 2ⁿ), common error diagnosis (confusing ∈ and ⊆), tiered exercises.'
  },
  'propositions': {
    zh: '高一命题与充要条件互动课件。四种命题关系、充分必要条件判断方法、举反例策略、常见错误诊断、分层练习。',
    en: 'Interactive courseware on propositions and necessary/sufficient conditions. Four proposition types, proof strategies, counterexample method, error diagnosis, tiered exercises.'
  },
  'functions-concept': {
    zh: '高一函数概念与表示互动课件。三种表示法（解析法/列表法/图像法）、定义域值域求法、同一函数判定、典型例题、常见错误诊断。',
    en: 'Interactive courseware on function concepts. Three representations, domain/range, same-function criteria, worked examples, error diagnosis.'
  },
  'function-properties': {
    zh: '高一函数单调性/奇偶性/周期性互动课件。Canvas拖拽探索单调区间、奇偶性定义+判定步骤、周期性、证明完整步骤、分层练习。',
    en: 'Interactive courseware on function monotonicity, parity, periodicity. Canvas drag to explore intervals, step-by-step proofs, error diagnosis, tiered exercises.'
  },
  'exponential-function': {
    zh: '高一指数函数互动课件。Canvas拖拽探索y=aˣ随a变化的图像、定义域值域、单调性、指数运算公式、典型例题。',
    en: 'Interactive courseware on exponential functions. Canvas drag to explore y=aˣ, domain/range, monotonicity, exponent rules, worked examples.'
  },
  'logarithmic-function': {
    zh: '高一対数函数互动课件。Canvas拖拽探索y=logₐx图像、对数运算公式、换底公式、与指数函数互为反函数关系。',
    en: 'Interactive courseware on logarithmic functions. Canvas exploration, log rules, base-change formula, inverse of exponential function.'
  },
  'power-function': {
    zh: '高一幂函数互动课件。Canvas拖拽探索y=xᵅ图像随α变化的规律、常见幂函数(α=1,2,3,½,-1)性质对比。',
    en: 'Interactive courseware on power functions. Canvas drag to explore y=xᵅ, comparison of common power functions (α=1,2,3,½,-1).'
  },
  'function-models': {
    zh: '高一函数模型与应用互动课件。指数/对数/幂函数模型对比、实际应用建模、增长速度比较、综合练习。',
    en: 'Interactive courseware on function models. Exponential/logarithmic/power model comparison, real-world modeling, growth rate analysis.'
  },
  'trig-ratios': {
    zh: '高一三角函数定义互动课件。Canvas单位圆交互探索sin/cos/tan定义、象限角、三角函数线、弧度制。',
    en: 'Interactive courseware on trig definitions. Canvas unit circle exploration, sin/cos/tan definitions, quadrant angles, radian measure.'
  },
  'trig-identities': {
    zh: '高一三角恒等变换互动课件。两角和差公式、二倍角公式、辅助角公式、恒等式证明技巧、典型例题。',
    en: 'Interactive courseware on trig identities. Sum/difference formulas, double angle, auxiliary angle, proof techniques.'
  },
  'trig-graphs': {
    zh: '高一三角函数图像与性质互动课件。Canvas探索y=Asin(ωx+φ)图像变换、振幅/周期/相位、五点作图法。',
    en: 'Interactive courseware on trig graphs. Canvas exploration of y=Asin(ωx+φ) transformations, amplitude/period/phase.'
  },
  'law-of-sines-cosines': {
    zh: '高一正弦定理与余弦定理互动课件。正弦定理证明与应用、余弦定理推导、解三角形问题分类、典型例题。',
    en: 'Interactive courseware on law of sines and cosines. Proofs, applications, triangle-solving classification.'
  },
  'arithmetic-sequence': {
    zh: '高一等差数列互动课件。通项公式an=a₁+(n-1)d推导、前n项和Sn=na₁+n(n-1)d/2、性质与判定、典型例题。',
    en: 'Interactive courseware on arithmetic sequences. General term formula, sum formula, properties, worked examples.'
  },
  'geometric-sequence': {
    zh: '高一等比数列互动课件。通项公式an=a₁qⁿ⁻¹推导、前n项和公式、等比中项、性质与判定、典型例题。',
    en: 'Interactive courseware on geometric sequences. General term, sum formula, geometric mean, properties.'
  },
  'sequence-summation': {
    zh: '高一数列求和方法互动课件。倒序相加法、错位相减法、裂项相消法、分组求和法、典型例题。',
    en: 'Interactive courseware on sequence summation methods. Reverse addition, shift subtraction, telescoping, grouping.'
  },
  'inequalities': {
    zh: '高一不等式性质与解法互动课件。不等式基本性质、一元二次不等式解法、绝对值不等式、分式不等式、典型例题。',
    en: 'Interactive courseware on inequality properties and solutions. Quadratic, absolute value, fractional inequalities.'
  },
  'linear-programming': {
    zh: '高一线性规划互动课件。可行域画法、目标函数最值求解、整数解问题、实际应用建模。',
    en: 'Interactive courseware on linear programming. Feasible region, objective function optimization, integer solutions.'
  },
  'basic-inequality': {
    zh: '高一基本不等式(AM-GM)互动课件。a+b≥2√ab证明(几何+代数)、等号条件、最值问题应用、常见错误。',
    en: 'Interactive courseware on AM-GM inequality. Proof (geometric + algebraic), equality conditions, optimization.'
  },
  'space-figures': {
    zh: '高二空间几何体互动课件。棱柱/棱锥/球的结构特征、表面积与体积公式、三视图与直观图、典型例题。',
    en: 'Interactive courseware on solid figures. Prisms, pyramids, spheres, surface area, volume, orthographic views.'
  },
  'space-lines-planes': {
    zh: '高二点线面位置关系互动课件。四个公理、线线/线面/面面关系、异面直线、公理体系与推导。',
    en: 'Interactive courseware on point-line-plane relationships. Four axioms, line-line/line-plane/plane-plane relations.'
  },
  'parallel-perpendicular': {
    zh: '高二平行与垂直判定互动课件。线面平行/垂直判定定理、面面平行/垂直判定、性质定理应用、证明思路。',
    en: 'Interactive courseware on parallel and perpendicular criteria. Line-plane and plane-plane theorems, proof strategies.'
  },
  'dihedral-angle': {
    zh: '高二二面角与空间角互动课件。二面角定义与求法、线面角、异面直线所成角、空间角综合计算。',
    en: 'Interactive courseware on dihedral angles. Definition, calculation methods, line-plane angle, spatial angles.'
  },
  'space-vectors': {
    zh: '高二空间向量与立体几何互动课件。空间向量坐标运算、法向量求法、用向量求空间角与距离、综合应用。',
    en: 'Interactive courseware on space vectors. Coordinate operations, normal vectors, spatial angle/distance calculation.'
  },
  'line-equation': {
    zh: '高二直线方程互动课件。Canvas滑块调节y=kx+b参数、五种直线方程形式、两直线位置关系、点到直线距离。',
    en: 'Interactive courseware on line equations. Canvas slider for y=kx+b, five equation forms, line relationships.'
  },
  'circle-equation': {
    zh: '高二圆的方程互动课件。标准方程与一般方程、待定系数法求圆方程、直线与圆位置关系、弦长问题。',
    en: 'Interactive courseware on circle equations. Standard/general forms, line-circle position, chord length.'
  },
  'ellipse': {
    zh: '高二椭圆互动课件。Canvas拖拽调节a/b/c参数观察椭圆变化、标准方程推导、离心率、焦点三角形。',
    en: 'Interactive courseware on ellipses. Canvas drag to adjust a/b/c, standard equation derivation, eccentricity.'
  },
  'hyperbola': {
    zh: '高二双曲线互动课件。Canvas拖拽调节a/b参数、标准方程推导、渐近线、离心率、与椭圆对比。',
    en: 'Interactive courseware on hyperbolas. Canvas drag to adjust parameters, asymptotes, eccentricity, comparison with ellipse.'
  },
  'parabola-h': {
    zh: '高二抛物线互动课件。Canvas拖拽调节p参数、四种标准方程、焦点与准线、抛物线光学性质。',
    en: 'Interactive courseware on parabolas. Canvas drag to adjust p, four standard forms, focus and directrix.'
  },
  'conic-comprehensive': {
    zh: '高三圆锥曲线综合互动课件。联立方程组、韦达定理应用、弦中点问题、设而不求法、综合题。',
    en: 'Interactive courseware on conic comprehensive. System of equations, Vieta formulas, chord midpoint problems.'
  },
  'vector-basics': {
    zh: '高一向量概念与运算互动课件。向量定义、加减法几何意义、数乘运算、共线向量定理、典型例题。',
    en: 'Interactive courseware on vector concepts. Definition, addition/subtraction geometric meaning, scalar multiplication.'
  },
  'vector-coordinates': {
    zh: '高一向量坐标运算互动课件。坐标表示、数量积公式、夹角与垂直判定、平移公式、典型例题。',
    en: 'Interactive courseware on vector coordinates. Coordinate operations, dot product, angle and perpendicularity.'
  },
  'derivative-concept': {
    zh: '高三导数概念与运算互动课件。Canvas切线可视化拖动x₀观察斜率变化、极限定义、基本求导公式、运算法则。',
    en: 'Interactive courseware on derivative concepts. Canvas tangent visualization, limit definition, differentiation rules.'
  },
  'derivative-application': {
    zh: '高三导数应用互动课件。用导数判断单调性、求极值与最值、优化问题、恒成立问题、典型例题。',
    en: 'Interactive courseware on derivative applications. Monotonicity, extrema, optimization, always-true problems.'
  },
  'counting-principles': {
    zh: '高一计数原理互动课件。分类加法/分步乘法计数原理、排列与组合公式、常见模型、典型例题。',
    en: 'Interactive courseware on counting principles. Addition/multiplication rules, permutation and combination formulas.'
  },
  'binomial-theorem': {
    zh: '高二二项式定理互动课件。展开式通项公式、二项式系数性质、杨辉三角、赋值法应用、典型例题。',
    en: 'Interactive courseware on binomial theorem. General term formula, coefficient properties, Yang Hui triangle.'
  },
  'probability-h': {
    zh: '高一概率互动课件。古典概型、条件概率、独立事件、互斥事件、概率加法/乘法公式、典型例题。',
    en: 'Interactive courseware on probability. Classical, conditional, independent, mutually exclusive events, formulas.'
  },
  'random-variable': {
    zh: '高三随机变量与分布互动课件。离散型随机变量、分布列、期望与方差、二项分布/超几何分布/正态分布。',
    en: 'Interactive courseware on random variables. Distribution, expectation, variance, binomial/hypergeometric/normal.'
  },
  'regression-analysis': {
    zh: '高三回归分析与统计推断互动课件。散点图与相关性、最小二乘法回归方程、独立性检验、典型例题。',
    en: 'Interactive courseware on regression analysis. Scatter plots, least squares, independence testing.'
  }
};

// 读取注册表
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));

let updated = 0;

registry.courses.forEach(course => {
  if (!course.id.startsWith('math-high-')) return;
  
  const nodeId = course.node_id;
  const desc = DESCRIPTIONS[nodeId];
  if (!desc) return;

  // 升级版本号
  course.version = '3.0';
  
  // 升级描述
  course.description = desc.en;
  course.description_zh = desc.zh;
  
  // 升级交互类型
  const hasCanvas = CANVAS_NODES.includes(nodeId);
  const isCore = CORE_NODES.includes(nodeId);
  
  if (hasCanvas || isCore) {
    course.interactions = ['Canvas', 'Slider', 'Quiz', 'ErrorDiagnosis', 'Scaffolding'];
  } else {
    course.interactions = ['Quiz', 'ErrorDiagnosis', 'Scaffolding'];
  }
  
  // 升级 tags
  const grade = course.grade;
  course.tags = ['Math', `Grade ${grade}`, 'High School', 'Interactive'];
  if (hasCanvas || isCore) course.tags.push('Canvas');
  course.tags.push('ABT Narrative');
  
  // 确保 tag_colors 数量匹配
  course.tag_colors = course.tags.map((_, i) => {
    const colors = ['tag-blue', 'tag-purple', 'tag-green', 'tag-yellow', 'tag-cyan', 'tag-pink'];
    return colors[i % colors.length];
  });
  
  // 核心节点标记
  course.author = 'weponusa';
  course.has_tts = false;
  course.has_video = false;
  
  // 更新日期
  course.updated = '2026-04-10';
  
  updated++;
});

// 更新时间戳
registry.updated_at = new Date().toISOString();

// 写回
fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

console.log(`✅ 已升级 ${updated} 个高中数学课件元数据到 v3.0`);
console.log(`   - 4个核心节点: ${CORE_NODES.join(', ')}`);
console.log(`   - 14个Canvas节点: ${CANVAS_NODES.join(', ')}`);
