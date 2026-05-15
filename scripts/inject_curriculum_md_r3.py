#!/usr/bin/env python3
"""
inject_curriculum_md_r3.py — 第三轮注入 + 互动资源写入

功能 A：把 R2 仍未匹配的 275 个 MD 用精确别名表注入
功能 B：为数理化相关知识点写入 interactive_resources 字段
         （PhET / GeoGebra Deploy API / Desmos / Matter.js 实测数据）
"""
import json, os, glob, re, datetime, argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.dirname(SCRIPT_DIR)
CS_ROOT    = '/Users/wepon/CodeBuddy/一次函数/curriculum-standards'
KP_DIR     = os.path.join(REPO_ROOT, 'data/kp')
KP_INDEX   = os.path.join(REPO_ROOT, 'data/kp/_index.json')
REPORT_R2  = os.path.join(REPO_ROOT, 'data/kp/_inject_report_r2.json')
REPORT_OUT = os.path.join(REPO_ROOT, 'data/kp/_inject_report_r3.json')
NOW        = datetime.datetime.now().strftime('%Y-%m-%d')

SUBJ_MAP  = {'数学':'math','物理':'physics','化学':'chemistry','生物':'biology',
             '语文':'chinese','英语':'english','历史':'history','地理':'geography','科学':'science'}
STAGE_MAP = {'初中':'middle','高中':'high','小学':'elementary'}

# ─────────────────────────────────────────────────────────────────
# A. 精确别名表（MD名 → node_id）
# ─────────────────────────────────────────────────────────────────
ALIAS = {
    # 物理 初中
    ('串联和并联',        'physics','middle'): 'phy-m-series-parallel',
    ('内能',             'physics','middle'): 'phy-m-internal-energy',
    ('力',               'physics','middle'): 'phy-m-force-basics',
    ('发电机与交变电流',   'physics','middle'): 'phy-m-generator',
    ('噪声的危害和控制',   'physics','middle'): 'phy-m-noise-control',
    ('声音的特性（音调、响度、音色）','physics','middle'): 'phy-m-sound-properties',
    ('安全用电',          'physics','middle'): 'phy-m-electrical-safety',
    ('机械能及其转化',     'physics','middle'): 'phy-m-kinetic-potential',
    ('温度与温度计',       'physics','middle'): 'phy-m-temperature',
    ('电流的测量',         'physics','middle'): 'phy-m-electric-measurement',
    ('电荷与静电',         'physics','middle'): 'phy-m-static-electricity',
    ('电功与电功率',       'physics','middle'): 'phy-m-power-joule',
    ('电生磁（电磁铁）',   'physics','middle'): 'phy-m-electromagnet',
    ('磁生电（电磁感应）', 'physics','middle'): 'phy-m-em-induction',
    ('磁现象与磁场',       'physics','middle'): 'phy-m-magnetism',
    ('简单机械（杠杆、滑轮）','physics','middle'): 'phy-m-simple-machines',
    ('能量守恒定律',       'physics','middle'): 'phy-m-energy-conservation',
    ('重力',             'physics','middle'): 'phy-m-gravity',
    ('球面镜（凸面镜、凹面镜）','physics','middle'): 'phy-m-spherical-mirror',
    ('透镜及其应用',       'physics','middle'): 'phy-m-lens',
    ('电动机',           'physics','middle'): 'phy-m-motor',
    ('焦耳定律',          'physics','middle'): 'phy-m-joule-law',
    # 物理 高中
    ('匀变速直线运动',    'physics','high'): 'phy-h-kinematics',
    ('牛顿第一定律',      'physics','high'): 'phy-h-newton-first-law',
    ('常见力（重力弹力摩擦力）','physics','high'): 'phy-h-common-forces',
    ('力的合成与分解',    'physics','high'): 'phy-h-force-decomposition',
    ('动能定理',         'physics','high'): 'phy-h-kinetic-energy-theorem',
    ('机械能守恒定律',    'physics','high'): 'phy-h-mechanical-energy-conservation',
    ('动量守恒定律',      'physics','high'): 'phy-h-momentum-conservation',
    ('动量与冲量',        'physics','high'): 'phy-h-momentum-impulse',
    ('天体运动与人造卫星', 'physics','high'): 'phy-h-celestial-mechanics',
    ('库仑定律',          'physics','high'): 'phy-h-coulombs-law',
    ('电场强度与电场线',   'physics','high'): 'phy-h-electric-field',
    ('欧姆定律与电阻定律', 'physics','high'): 'phy-h-resistance-law',
    ('串并联与闭合电路',   'physics','high'): 'phy-h-circuit-advanced',
    ('电学实验（测电阻电源电动势）','physics','high'): 'phy-h-circuit-experiment',
    ('磁场与安培力',       'physics','high'): 'phy-h-magnetic-force',
    ('交变电流与变压器',   'physics','high'): 'phy-h-alternating-current',
    ('原子结构与能级',     'physics','high'): 'phy-h-atomic-structure',
    ('原子核与核反应',     'physics','high'): 'phy-h-nuclear-reaction',
    ('光电效应与光子',     'physics','high'): 'phy-h-photoelectric-effect',
    ('自由落体运动',       'physics','high'): 'phy-h-free-fall',
    ('抛体运动',          'physics','high'): 'phy-h-projectile-motion',
    ('圆周运动',          'physics','high'): 'phy-h-circular-motion',
    ('势能（重力弹性）',   'physics','high'): 'phy-h-potential-energy',
    ('碰撞（弹性非弹性）', 'physics','high'): 'phy-h-collision',
    ('电磁感应与法拉第定律','physics','high'): 'phy-h-faraday-law',
    ('电容器',            'physics','high'): 'phy-h-capacitor',
    ('功和功率',           'physics','high'): 'phy-h-work-concept',
    ('牛顿运动定律',       'physics','high'): 'phy-h-newtons-laws',
    ('万有引力定律',       'physics','high'): 'phy-h-universal-gravitation',
    # 生物 初中
    ('健康的生活方式',     'biology','middle'): 'bio-m-health-lifestyle',
    ('免疫与传染病',       'biology','middle'): 'bio-m-infectious-disease',
    ('内分泌系统与激素调节','biology','middle'): 'bio-m-endocrine',
    ('动物的分类（无脊椎脊椎动物）','biology','middle'): 'bio-m-animal-classification',
    ('基因与染色体',       'biology','middle'): 'bio-m-genetics-basics',
    ('根的吸水与运输',     'biology','middle'): 'bio-m-root-absorption',
    ('植物的分类（藻→被子）','biology','middle'): 'bio-m-plant-classification',
    ('植物的生殖（有性无性）','biology','middle'): 'bio-m-plant-reproduction',
    ('食物链与生态系统',   'biology','middle'): 'bio-m-food-chain',
    ('细胞分裂',          'biology','middle'): 'bio-m-cell-division',
    ('生物多样性',         'biology','middle'): 'bio-m-biodiversity',
    ('神经系统',          'biology','middle'): 'bio-m-nervous-system',
    ('血液循环',          'biology','middle'): 'bio-m-blood-circulation',
    ('呼吸作用',          'biology','middle'): 'bio-m-respiration',
    ('消化系统',          'biology','middle'): 'bio-m-digestive-system',
    ('生物的基本特征',     'biology','middle'): 'bio-m-bio-characteristics',
    # 生物 高中
    ('基因的表达（转录翻译）','biology','high'): 'bio-h-gene-expression',
    ('基因突变与基因重组', 'biology','high'): 'bio-h-gene-mutation',
    ('染色体变异',         'biology','high'): 'bio-h-chromosome-mutation',
    ('种群与群落',         'biology','high'): 'bio-h-population-community',
    ('生态系统的结构',     'biology','high'): 'bio-h-ecosystem-structure',
    ('生态系统的能量流动', 'biology','high'): 'bio-h-energy-flow',
    ('生态环境的保护',     'biology','high'): 'bio-h-environment-protection',
    ('细胞的增殖',         'biology','high'): 'bio-h-cell-proliferation',
    ('减数分裂',          'biology','high'): 'bio-h-meiosis',
    ('遗传定律',          'biology','high'): 'bio-h-mendel-laws',
    ('伴性遗传',          'biology','high'): 'bio-h-sex-linked',
    ('物质跨膜运输',       'biology','high'): 'bio-h-membrane-transport',
    ('细胞的有丝分裂',     'biology','high'): 'bio-h-mitosis',
    ('激素调节',          'biology','high'): 'bio-h-hormone-regulation',
    ('免疫调节',          'biology','high'): 'bio-h-immune-regulation',
    ('植物生命活动的调节', 'biology','high'): 'bio-h-plant-hormone',
    # 化学 初中 (补充剩余)
    ('pH值与酸碱指示剂',   'chemistry','middle'): 'chem-m-ph-indicator',
    ('氧气的制取（实验室工业）','chemistry','middle'): 'chem-m-oxygen-production',
    ('化学实验基本操作',   'chemistry','middle'): 'chem-m-lab-basics',
    ('化学方程式书写与配平','chemistry','middle'): 'chem-m-equation-balancing',
    ('溶质质量分数',       'chemistry','middle'): 'chem-m-mass-fraction',
    ('物质的变化和性质',   'chemistry','middle'): 'chem-m-substance-properties',
    ('盐的性质与复分解反应','chemistry','middle'): 'chem-m-salt-properties',
    ('离子与离子化合物',   'chemistry','middle'): 'chem-m-ionic-compounds',
    ('酸碱的概念与通性',   'chemistry','middle'): 'chem-m-acids-bases',
    ('金属的化学性质',     'chemistry','middle'): 'chem-m-metal-chemistry',
    ('金属冶炼与防锈',     'chemistry','middle'): 'chem-m-metal-smelting',
    # 化学 高中 (补充)
    ('分散系与胶体',       'chemistry','high'): 'chem-h-colloid',
    ('化学反应热与焓变',   'chemistry','high'): 'chem-h-reaction-enthalpy',
    ('化学键（离子键共价键）','chemistry','high'): 'chem-h-chemical-bonds',
    ('原电池原理',         'chemistry','high'): 'chem-h-electrochemical-cell',
    ('物质的分类（纯净物混合物）','chemistry','high'): 'chem-h-substance-types',
    # 地理 初中
    ('世界主要国家（日本印度美国巴西）','geography','middle'): 'geo-m-key-countries',
    ('世界主要地区（东南亚中东欧洲西部）','geography','middle'): 'geo-m-world-regions',
    ('世界人口分布与人种', 'geography','middle'): 'geo-m-world-population',
    ('中国气候特征',       'geography','middle'): 'geo-m-china-climate',
    ('中国的交通运输',     'geography','middle'): 'geo-m-china-transport',
    ('中国的人口与民族',   'geography','middle'): 'geo-m-china-population',
    ('中国的农业',         'geography','middle'): 'geo-m-china-agriculture',
    ('中国的工业',         'geography','middle'): 'geo-m-china-industry',
    ('地图的三要素',       'geography','middle'): 'geo-m-map-elements',
    ('天气与气候',         'geography','middle'): 'geo-m-weather-climate',
    ('中国的地势与地形',   'geography','middle'): 'geo-m-china-terrain',
    ('世界气候类型',       'geography','middle'): 'geo-m-world-climate',
    # 地理 高中
    ('大气受热过程与气温',  'geography','high'): 'geo-h-atmosphere-heating',
    ('水循环与洋流',       'geography','high'): 'geo-h-water-cycle',
    ('地球内部圈层与板块',  'geography','high'): 'geo-h-earth-structure',
    ('农业区位因素',       'geography','high'): 'geo-h-agricultural-location',
    ('工业区位因素',       'geography','high'): 'geo-h-industrial-location',
    ('城市化',            'geography','high'): 'geo-h-urbanization',
    ('人口增长模式',       'geography','high'): 'geo-h-population-growth',
    ('地球的运动',         'geography','high'): 'geo-h-earth-motion',
    ('大气运动与气压带',   'geography','high'): 'geo-h-atmospheric-circulation',
    ('河流地貌',          'geography','high'): 'geo-h-fluvial-landform',
    ('生物多样性保护',     'geography','high'): 'geo-h-biodiversity',
    # 历史 初中
    ('秦汉大一统',         'history','middle'): 'hist-m-qin-han-unification',
    ('三国两晋南北朝',     'history','middle'): 'hist-m-three-kingdoms',
    ('明清经济与对外关系', 'history','middle'): 'hist-m-ming-qing-economy',
    ('鸦片战争',          'history','middle'): 'hist-m-opium-war',
    ('五四运动',          'history','middle'): 'hist-m-may-fourth',
    ('近代中国民主革命',   'history','middle'): 'hist-m-democratic-revolution',
    ('第二次世界大战',     'history','middle'): 'hist-m-ww2',
    ('文艺复兴与宗教改革', 'history','middle'): 'hist-m-renaissance',
    ('法国大革命',         'history','middle'): 'hist-m-french-revolution',
    # 历史 高中
    ('中国古代史综合',     'history','high'): 'hist-h-ancient-china',
    ('近代列强侵华',       'history','high'): 'hist-h-imperialism-china',
    ('新中国成立',         'history','high'): 'hist-h-prc-founding',
    ('改革开放',          'history','high'): 'hist-h-reform-opening',
    ('启蒙运动',          'history','high'): 'hist-h-enlightenment',
    ('工业革命',          'history','high'): 'hist-h-industrial-revolution',
    # 语文 初中
    ('《水浒传》',         'chinese','middle'): 'chn-m-erta-tales-heroes',
    ('《红楼梦》（节选）', 'chinese','middle'): 'chn-m-dream-red-mansions',
    ('《艾青诗选》',       'chinese','middle'): 'chn-m-poetry-recitation',
    ('修辞手法辨析与运用', 'chinese','middle'): 'chn-m-rhetoric-figures',
    ('古诗词背诵默写',     'chinese','middle'): 'chn-m-poetry-recitation',
    ('小说阅读（情节人物环境）','chinese','middle'): 'chn-m-novel-reading',
    # 语文 高中
    ('《红楼梦》',         'chinese','high'): 'chn-h-red-chamber',
    ('任务驱动型作文',     'chinese','high'): 'chn-h-task-driven-writing',
    ('文学类文本阅读',     'chinese','high'): 'chn-h-literary-reading-h',
    ('古诗词鉴赏',         'chinese','high'): 'chn-h-poetry-emotion',
    ('文言文翻译',         'chinese','high'): 'chn-h-classical-translation-h',
    # 英语 初中
    ('情态动词',           'english','middle'): 'eng-m-modal-verbs',
    ('并列句与复合句',     'english','middle'): 'eng-m-sentence-structure',
    ('五种基本句型',       'english','middle'): 'eng-m-sentence-structure',
    ('推理判断题',         'english','middle'): 'eng-m-reading-inference',
    ('主旨大意与标题选择', 'english','middle'): 'eng-m-reading-main-idea',
    # 英语 小学
    ('中考1600词汇',       'english','middle'): 'eng-m-vocabulary-core',
    ('常用短语动词与固定搭配','english','middle'): 'eng-m-phrasal-verbs',
    ('口语交际（话题表述情景对话）','english','middle'): 'eng-m-oral-communication',
}

# ─────────────────────────────────────────────────────────────────
# B. 互动资源数据（实测可用，v7.9.6）
# ─────────────────────────────────────────────────────────────────
# 格式：node_id -> [interactive_resource_dict, ...]
# 优先级 1 = 最推荐
INTERACTIVE_RESOURCES = {
    # ── 数学：一次函数 ──
    'math-m-linear-function': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['k = Slider(-5, 5, 0.1)','b = Slider(-5, 5, 0.1)','f(x) = k*x + b'],
         'description':'拖动 k、b 滑块探究斜率和截距对图像的影响，GeoGebra Deploy API 现场构建，不依赖 applet ID'},
        {'tool':'desmos','method':'api','priority':2,'reliability':'100%',
         'expressions':[
             {'latex':'k = 2','sliderBounds':{'min':-5,'max':5}},
             {'latex':'b = 1','sliderBounds':{'min':-5,'max':5}},
             {'latex':'y = k*x + b'}],
         'description':'Desmos API 现场渲染参数化一次函数'},
    ],
    # ── 数学：二次函数 ──
    'math-m-quadratic-function': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['a = Slider(-3, 3, 0.1)','b = Slider(-5, 5, 0.1)','c = Slider(-5, 5, 0.1)',
                         'f(x) = a*x^2 + b*x + c','Vertex = (x(Vertex(f)), y(Vertex(f)))'],
         'description':'三参数滑块探究抛物线形状与顶点'},
        {'tool':'desmos','method':'api','priority':2,'reliability':'100%',
         'expressions':[
             {'latex':'a = 1','sliderBounds':{'min':-3,'max':3}},
             {'latex':'b = 0','sliderBounds':{'min':-5,'max':5}},
             {'latex':'c = 0','sliderBounds':{'min':-5,'max':5}},
             {'latex':'y = a*x^2 + b*x + c'}],
         'description':'Desmos 二次函数参数探究'},
    ],
    # ── 数学：正比例函数 ──
    'math-m-proportional-function': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['k = Slider(-5, 5, 0.1)','f(x) = k*x'],
         'description':'探究 k 值对正比例函数图像的影响'},
    ],
    # ── 数学：反比例函数 ──
    'math-m-inverse-proportion': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['k = Slider(-10, 10, 0.1)','f(x) = k/x'],
         'description':'探究 k 值对反比例函数图像的影响'},
    ],
    # ── 数学高中：导数 ──
    'math-h-derivative-concept': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['f(x) = x^3 - 3*x','a = Slider(-3, 3, 0.1)',
                         'T = Tangent(a, f)','P = (a, f(a))'],
         'description':'拖动切点观察导数（切线斜率）的几何意义'},
    ],
    # ── 数学高中：三角函数图像 ──
    'math-h-trig-graphs': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['A = Slider(0.5, 3, 0.1)','omega = Slider(0.5, 3, 0.1)',
                         'phi = Slider(-3.14, 3.14, 0.05)',
                         'f(x) = A*sin(omega*x + phi)'],
         'description':'A/ω/φ 三参数滑块探究正弦函数图像变换'},
    ],
    # ── 数学高中：函数性质 ──
    'math-h-function-properties': [
        {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
         'appName':'graphing',
         'evalCommands':['f(x) = x^3 - 3x','Derivative(f)'],
         'description':'同时显示函数及其导数，直观感受单调性'},
    ],
    # ── 物理：欧姆定律 ──
    'phy-m-ohms-law': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'ohms-law','url':'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_zh_CN.html',
         'description':'PhET 欧姆定律：调节电压/电阻滑块，实时看电流变化（中文版）'},
        {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
         'slug':'circuit-construction-kit-dc',
         'url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html',
         'description':'PhET 直流电路搭建套件'},
    ],
    # ── 物理：压强 ──
    'phy-m-pressure': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'fluid-pressure-and-flow',
         'url':'https://phet.colorado.edu/sims/html/fluid-pressure-and-flow/latest/fluid-pressure-and-flow_zh_CN.html',
         'description':'PhET 液体压强与流速（含帕斯卡定律）'},
    ],
    # ── 物理：液体压强与浮力 ──
    'phy-m-liquid-pressure-buoyancy': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'buoyancy',
         'url':'https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_zh_CN.html',
         'description':'PhET 浮力模拟：调节物体密度/形状，观察浮力变化'},
    ],
    # ── 物理：抛体运动 ──
    'phy-h-projectile-motion': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'projectile-motion',
         'url':'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_zh_CN.html',
         'description':'PhET 抛体运动：调节初速度/角度，实时轨迹（中文版）'},
    ],
    # ── 物理：电路 ──
    'phy-m-series-parallel': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'circuit-construction-kit-dc',
         'url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html',
         'description':'PhET 直流电路套件：搭建串并联电路，直接测量电压电流'},
    ],
    # ── 物理：波动 ──
    'phy-h-wave-optics': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'wave-interference',
         'url':'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_zh_CN.html',
         'description':'PhET 波的叠加与干涉（中文版）'},
    ],
    # ── 物理：声音 ──
    'phy-m-sound-generation': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'wave-on-a-string',
         'url':'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_zh_CN.html',
         'description':'PhET 弦上的波：调节频率/振幅，观察横波传播'},
    ],
    # ── 物理：自由落体 ──
    'phy-h-free-fall': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'projectile-motion',
         'url':'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_zh_CN.html',
         'description':'PhET 抛体运动（含自由落体极限情景）'},
        {'tool':'matter.js','method':'canvas','priority':2,'reliability':'100%',
         'code_hint':'Body.setVelocity + 重力设置，实时渲染下落轨迹',
         'description':'Matter.js 物理引擎渲染自由落体，纯 JS 代码生成'},
    ],
    # ── 物理：圆周运动 ──
    'phy-h-circular-motion': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'ladybug-revolution',
         'url':'https://phet.colorado.edu/sims/html/rotation/latest/rotation_zh_CN.html',
         'description':'PhET 旋转：观察角速度/线速度/向心加速度'},
        {'tool':'matter.js','method':'canvas','priority':2,'reliability':'100%',
         'code_hint':'Constraint.create 模拟向心力，Matter.Runner 运行',
         'description':'Matter.js 模拟绳拴小球圆周运动'},
    ],
    # ── 化学：原子结构 ──
    'chem-m-atomic-structure': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'build-an-atom',
         'url':'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html',
         'description':'PhET 建造原子：拖动质子/中子/电子组装原子（中文版）'},
    ],
    # ── 化学：化学键/分子结构 ──
    'chem-h-molecular-structure': [
        {'tool':'3dmol','method':'api','priority':1,'reliability':'80%',
         'description':'3Dmol.js 展示分子三维结构：通过 PDB ID 或 SMILES 渲染'},
        {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
         'slug':'molecule-shapes',
         'url':'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_zh_CN.html',
         'description':'PhET 分子形状（VSEPR 理论，中文版）'},
    ],
    # ── 化学：化学平衡 ──
    'chemistry-ap-chemical-equilibrium': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'reactions-and-rates',
         'url':'https://phet.colorado.edu/sims/html/reactions-and-rates/latest/reactions-and-rates_zh_CN.html',
         'description':'PhET 反应速率与平衡：观察温度/浓度变化对平衡的影响'},
    ],
    # ── 化学：元素周期表 ──
    'chem-m-element-concept': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'build-an-atom',
         'url':'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html',
         'description':'PhET 建造原子：理解原子序数与元素的关系'},
    ],
    # ── 生物：光合作用 ──
    'bio-m-photosynthesis': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'sugar-and-salt-solutions',
         'url':'https://phet.colorado.edu/sims/html/sugar-and-salt-solutions/latest/sugar-and-salt-solutions_zh_CN.html',
         'description':'PhET 溶液模拟（配合细胞内溶液浓度讲解）'},
        {'tool':'matter.js','method':'canvas','priority':2,'reliability':'100%',
         'code_hint':'粒子动画模拟光合作用 CO2→O2 转化过程，纯 JS',
         'description':'Matter.js/Canvas 动画模拟叶肉细胞中的光合过程'},
    ],
    # ── 生物：细胞膜渗透 ──
    'bio-h-membrane-transport': [
        {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
         'slug':'membrane-channels',
         'url':'https://phet.colorado.edu/sims/html/membrane-channels/latest/membrane-channels_en.html',
         'description':'PhET 膜通道（英文版，展示主动/被动运输）'},
    ],
    # ── 生物：细胞分裂 ──
    'bio-h-cell-proliferation': [
        {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
         'code_hint':'Canvas 动画逐帧展示有丝分裂各期，用 requestAnimationFrame',
         'description':'Canvas/JS 动画展示有丝分裂全过程（无外部依赖）'},
    ],
}


# ─────────────────────────────────────────────────────────────────
# 工具函数（复用）
# ─────────────────────────────────────────────────────────────────

def read_section(text, kws):
    lines, in_s, lv, res = text.split('\n'), False, 0, []
    for line in lines:
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            cl, ct = len(m.group(1)), m.group(2).strip()
            if not in_s:
                if any(k in ct for k in kws): in_s, lv = True, cl; res.append(line)
            else:
                if cl <= lv: break
                res.append(line)
        elif in_s: res.append(line)
    return '\n'.join(res).strip()

def extract_errors(text):
    sec = read_section(text, ['易错点'])
    if not sec: return []
    errors = []
    for m in re.finditer(r'(?:^\d+\.\s*\*\*(.+?)\*\*|^\d+\.\s+(.+)|^[-*]\s+\*\*(.+?)\*\*|^[-*]\s+(.+))',
                         sec, re.MULTILINE):
        t = next((g for g in m.groups() if g), '').strip()
        t = re.sub(r'\*+', '', t).strip()
        if t and len(t) > 3: errors.append({'description': t, 'source': 'curriculum_md'})
    return errors[:10]

def extract_exercises(text):
    sec = read_section(text, ['典型例题', '例题', '练习'])
    if not sec: return []
    exercises = []
    for block in re.split(r'\n(?=\*\*例\d+)', sec):
        if not block.strip(): continue
        tm = re.match(r'\*\*例(\d+).*?\*\*[（(]?([^)）\n]*)[)）]?\s*\n(.*?)(?=\*\*解\*\*|解：|解:|\*\*解)',
                      block, re.DOTALL)
        stem = tm.group(3).strip() if tm else re.sub(r'\*+例\d+.*?\*+\s*', '', block).strip()[:200]
        am = re.search(r'(?:\*\*解\*\*|解：|解:)\s*([\s\S]*?)(?=---|\Z)', block)
        answer = am.group(1).strip()[:300] if am else ''
        if stem and len(stem) > 5:
            exercises.append({'stem': stem[:300], 'answer': answer, 'bloom': 'apply', 'source': 'curriculum_md'})
    return exercises[:8]

def extract_real_world(text):
    instances = []
    for m in re.finditer(r'\*\*例\d+[（(][^)）]*(?:实际|应用|情境|生活)[^)）]*[)）]\*\*\s*\n([^\n]+)', text):
        s = m.group(1).strip()
        if len(s) > 10: instances.append(s)
    return instances[:5]

def extract_memory_anchors(text):
    sec = read_section(text, ['记忆口诀', '口诀', '记忆'])
    if not sec: return []
    anchors = [l.strip().lstrip('-*0123456789. ') for l in sec.split('\n')
               if l.strip() and not l.strip().startswith('#') and len(l.strip()) > 3]
    return anchors[:5]

def parse_md(fp):
    with open(fp, 'r', encoding='utf-8') as f: text = f.read()
    ts = read_section(text, ['图文参考资料', '知识点精讲', '知识点总结'])
    return {'md_raw': text[:6000], 'textbook_summary': ts[:3000] if ts else '',
            'errors': extract_errors(text), 'exercises': extract_exercises(text),
            'real_world': extract_real_world(text), 'memory_anchors': extract_memory_anchors(text)}

def inject_md(sat_path, md_parsed, md_rel):
    with open(sat_path, 'r', encoding='utf-8') as f: sat = json.load(f)
    if sat.get('supplements', {}).get('curriculum_md_source') == md_rel: return 'skipped'
    sup = sat.setdefault('supplements', {})
    sup.update({'curriculum_md_source': md_rel, 'curriculum_md_raw': md_parsed['md_raw'],
                'injected_at': NOW})
    if md_parsed['textbook_summary']: sup['textbook_summary'] = md_parsed['textbook_summary']
    for e in md_parsed['errors']:
        if e['description'] not in {x.get('description','') for x in sat.get('errors',[])}:
            sat.setdefault('errors', []).append(e)
    for ex in md_parsed['exercises']:
        if ex['stem'][:30] not in {x.get('stem','')[:30] for x in sat.get('exercises',[])}:
            sat.setdefault('exercises', []).append(ex)
    for rw in md_parsed['real_world']:
        if rw not in sat.get('real_world', []): sat.setdefault('real_world', []).append(rw)
    for ma in md_parsed['memory_anchors']:
        if ma not in sat.get('memory_anchors', []): sat.setdefault('memory_anchors', []).append(ma)
    sat['_meta']['sources'] = list(set(sat['_meta'].get('sources', []) + ['curriculum_standards_md']))
    with open(sat_path, 'w', encoding='utf-8') as f: json.dump(sat, f, ensure_ascii=False, indent=2)
    return 'injected'

def inject_interactive(sat_path, node_id, resources):
    """写入 interactive_resources 字段（已有的不重复写）"""
    with open(sat_path, 'r', encoding='utf-8') as f: sat = json.load(f)
    existing_tools = {r.get('tool','') + r.get('description','')[:20]
                      for r in sat.get('interactive_resources', [])}
    added = 0
    for r in resources:
        key = r.get('tool','') + r.get('description','')[:20]
        if key not in existing_tools:
            sat.setdefault('interactive_resources', []).append(r)
            existing_tools.add(key)
            added += 1
    if added:
        sat['_meta']['sources'] = list(set(sat['_meta'].get('sources', []) + ['interactive_resources_v7.9.6']))
        with open(sat_path, 'w', encoding='utf-8') as f: json.dump(sat, f, ensure_ascii=False, indent=2)
    return added


# ─────────────────────────────────────────────────────────────────
# 主流程
# ─────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    print('[1] 加载 R2 未匹配列表 + 卫星索引...')
    with open(REPORT_R2) as f: r2 = json.load(f)
    with open(KP_INDEX) as f: kp_idx = json.load(f)['kps']
    nid_to_path = {nid: os.path.join(REPO_ROOT, rp)
                   for nid, rp in kp_idx.items() if os.path.exists(os.path.join(REPO_ROOT, rp))}

    # ── 功能 A：MD 注入 ──
    print('\n[2] R3 MD 注入（别名表匹配）...')
    stats_md = {'injected': 0, 'skipped': 0, 'no_match': 0}
    still_unmatched = []

    for u in r2.get('still_unmatched', []):
        name_cn, subj_cn, stage_cn = u['name'], u['subject'], u['stage']
        subj_en, stage_en = SUBJ_MAP.get(subj_cn,''), STAGE_MAP.get(stage_cn,'')
        node_id = ALIAS.get((name_cn, subj_en, stage_en))
        if not node_id:
            # 宽松前4字匹配
            core4 = re.sub(r'[（()）、，。\s]', '', name_cn)[:4]
            for nid, ap_ in nid_to_path.items():
                if subj_en not in nid: continue
                with open(ap_) as f: s = json.load(f)
                if s.get('stage','') != stage_en: continue
                sname = re.sub(r'[（()）、，。\s]', '', s.get('name',''))
                if core4 and len(core4) >= 2 and (core4 in sname or sname[:len(core4)] == core4):
                    node_id = nid; break

        if not node_id:
            stats_md['no_match'] += 1; still_unmatched.append(u); continue

        sat_path = nid_to_path.get(node_id)
        md_path  = os.path.join(CS_ROOT, subj_cn, stage_cn, name_cn + '.md')
        if not sat_path or not os.path.exists(md_path):
            stats_md['no_match'] += 1; still_unmatched.append(u); continue

        md_rel = os.path.relpath(md_path, REPO_ROOT)
        md_parsed = parse_md(md_path)
        if not args.dry_run:
            result = inject_md(sat_path, md_parsed, md_rel)
        else:
            result = 'injected'
        stats_md[result] = stats_md.get(result, 0) + 1
        if result == 'injected':
            print(f'  ✅ MD [{subj_cn}/{name_cn}] → {node_id}')

    print(f'  MD 注入: {stats_md.get("injected",0)}, 跳过: {stats_md.get("skipped",0)}, '
          f'仍未匹配: {stats_md["no_match"]}')

    # ── 功能 B：互动资源注入 ──
    print('\n[3] 互动资源写入（PhET/GeoGebra/Desmos/Matter.js 实测数据）...')
    stats_ir = {'added': 0, 'nodes': 0}
    for node_id, resources in INTERACTIVE_RESOURCES.items():
        sat_path = nid_to_path.get(node_id)
        if not sat_path:
            print(f'  ⚠️  {node_id} 卫星文件不存在，跳过')
            continue
        if not args.dry_run:
            added = inject_interactive(sat_path, node_id, resources)
        else:
            added = len(resources)
        if added:
            stats_ir['nodes'] += 1
            stats_ir['added'] += added
            print(f'  ✅ IR [{node_id}] +{added} 条互动资源')

    print(f'  互动资源写入: {stats_ir["nodes"]} 个节点，{stats_ir["added"]} 条资源')

    # ── 报告 ──
    report = {'generated_at': NOW, 'stats_md': stats_md, 'stats_ir': stats_ir,
              'still_unmatched': still_unmatched}
    if not args.dry_run:
        with open(REPORT_OUT, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f'\n  报告: {os.path.relpath(REPORT_OUT, REPO_ROOT)}')

    print(f'\n=== 最终仍未匹配（{len(still_unmatched)} 个）===')
    from collections import Counter
    c = Counter(u['subject']+'/'+u['stage'] for u in still_unmatched)
    for k, v in c.most_common():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
