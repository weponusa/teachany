#!/usr/bin/env python3
"""
inject-curriculum.py — 向国内课标知识树批量注入课标基本要求

Schema（统一字段规范）:
  tree.metadata.curriculum:
    standard:        "义务教育数学课程标准（2022年版）"        # 中文标准全名
    standard_en:     "Compulsory Education Math Std (2022 ed.)"
    stage_key:       "elementary" | "middle" | "high"
    stage_zh:        "小学" | "初中" | "高中"
    source:          "中华人民共和国教育部"
    issued:          "2022-04"                             # 颁布时间
    grade_range:     [1, 6]
    stage_goals:     ["学段目标 1...", "学段目标 2..."]     # 学段目标摘要（3-6 条）
    assessment:      "学业质量要求摘要..."                   # 学业质量要求
    core_concepts:   ["核心概念 1", "核心概念 2", ...]       # 课标列出的核心概念
    references:      ["文件/章节名 1", ...]                 # 课标引用章节

  domain.curriculum_goal:
    "该领域在课标中的学业质量要求 / 核心概念描述（<=150 字）"

  node.curriculum_points: [
    "学段目标 / 内容要求 1",
    "学习活动建议 2",
    "学业要求 3"
  ]   # 每个节点 2-4 条，每条 <=50 字

用法：
  python3 scripts/inject-curriculum.py                 # 全量注入所有 21 棵国内树
  python3 scripts/inject-curriculum.py --subject math  # 仅数学
  python3 scripts/inject-curriculum.py --dry-run       # 仅预览
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from typing import Dict, List, Any

ROOT = Path(__file__).resolve().parents[1]
TREES = ROOT / "data" / "trees"

# ============================================================
# 课标数据源（按学科+学段）
# ============================================================

# ---------- 基础：标准元信息（每个文件对应一个 key） ----------
STANDARDS: Dict[str, Dict[str, Any]] = {
    # --- 小学 Elementary (2022 义教课标) ---
    "chinese-elementary": {
        "standard": "义务教育语文课程标准（2022年版）",
        "standard_en": "Compulsory Education Chinese Language Curriculum Standard (2022 ed.)",
        "stage_key": "elementary", "stage_zh": "小学",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [1, 6],
        "core_concepts": ["文化自信", "语言运用", "思维能力", "审美创造"],
        "stage_goals": [
            "第一学段（1-2年级）：喜欢识字，掌握 1600 常用字，会写 800 字；能借助拼音朗读课文、背诵短诗；听、说、读、写兴趣建立",
            "第二学段（3-4年级）：累计识字 2500，会写 1800；能复述故事、默读课文、写简短记叙文；初识修辞与段落",
            "第三学段（5-6年级）：累计识字 3000，会写 2500；熟练运用默读与浏览；能写读后感和简单议论文；开始古典名著阅读",
        ],
        "assessment": "六大核心素养：文化自信、语言运用、思维能力、审美创造以螺旋式进阶；从识字写字→阅读→表达→综合性学习逐层递进。",
        "references": ["课程目标 (3.1)", "课程内容 (4)", "学业质量 (6)"],
    },
    "math-elementary": {
        "standard": "义务教育数学课程标准（2022年版）",
        "standard_en": "Compulsory Education Math Curriculum Standard (2022 ed.)",
        "stage_key": "elementary", "stage_zh": "小学",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [1, 6],
        "core_concepts": ["数感", "量感", "符号意识", "运算能力", "几何直观", "空间观念", "推理意识", "数据意识", "模型意识", "应用意识", "创新意识"],
        "stage_goals": [
            "第一学段（1-2年级）：建立 100 以内数感与运算；识图形；会测长度、重量、时间",
            "第二学段（3-4年级）：万以内数与四则运算；认识分数、小数、简单几何；初学统计图",
            "第三学段（5-6年级）：整数/小数/分数运算综合；方程与正反比例；立体图形体积；数据分析与可能性",
        ],
        "assessment": "三会：会用数学的眼光观察现实；会用数学的思维思考现实；会用数学的语言表达现实。",
        "references": ["课程目标 (3)", "核心素养 (2.2)", "学业质量 (6)"],
    },
    "english-elementary": {
        "standard": "义务教育英语课程标准（2022年版）",
        "standard_en": "Compulsory Education English Curriculum Standard (2022 ed.)",
        "stage_key": "elementary", "stage_zh": "小学",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [1, 6],
        "core_concepts": ["语言能力", "文化意识", "思维品质", "学习能力"],
        "stage_goals": [
            "一级（3-4年级）：累计学词 600-700；能听懂简单指令、唱英语歌、做角色扮演；书写 26 字母",
            "二级（5-6年级）：累计学词 1500；能读懂简单故事、写简短描述；初学一般现在/过去时",
        ],
        "assessment": "重兴趣与语感，强调'做中学''用中学'；以主题、语篇、语言知识、文化知识、语言技能、学习策略六要素整合。",
        "references": ["课程目标 (3)", "核心素养 (2.2)", "内容要求 (4)"],
    },
    "science-elementary": {
        "standard": "义务教育科学课程标准（2022年版）",
        "standard_en": "Compulsory Education Science Curriculum Standard (2022 ed.)",
        "stage_key": "elementary", "stage_zh": "小学",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [1, 6],
        "core_concepts": [
            "物质的结构与性质", "物质的变化与化学反应（萌芽）", "运动与相互作用", "能量的形式与转化",
            "生命系统的构成层次", "生物体的稳态与调节（萌芽）", "生物与环境的相互关系", "生命的延续与进化（萌芽）",
            "宇宙中的地球", "地球系统", "人类活动与地球", "技术、工程与社会", "工程设计与物化"
        ],
        "stage_goals": [
            "第一学段（1-2年级）：观察身边物体特征；认识常见动植物；感知昼夜与天气；学会使用简单工具",
            "第二学段（3-4年级）：了解物质三态变化；认识生命周期；观察月相；经历简单设计制作",
            "第三学段（5-6年级）：理解力与运动、能量转化；生态系统与人体健康；太阳系；完整工程项目",
        ],
        "assessment": "四大核心素养：科学观念、科学思维、探究实践、态度责任；以'核心概念-学段目标-学业要求'三层递进。",
        "references": ["课程目标 (3)", "核心素养 (2.2)", "学业质量 (6)"],
    },

    # --- 初中 Middle ---
    "chinese-middle": {
        "standard": "义务教育语文课程标准（2022年版）· 初中学段",
        "standard_en": "Compulsory Education Chinese Curriculum Standard (2022 ed.) · Middle",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 9],
        "core_concepts": ["文化自信", "语言运用", "思维能力", "审美创造"],
        "stage_goals": [
            "第四学段（7-9年级）：累计识字 3500，会写 3000；默读不少于 500 字/分钟；阅读中外文学名著 ≥4 部",
            "能写记叙文、说明文、简单议论文；背诵优秀诗文 60 篇",
            "综合性学习：能围绕社会问题开展研究、策划与交流",
        ],
        "assessment": "加强整本书阅读、思辨性阅读与跨学科学习；古诗文经典背诵量大幅提升。",
        "references": ["课程目标 (3)", "学习任务群 (4)", "学业质量 (6)"],
    },
    "math-middle": {
        "standard": "义务教育数学课程标准（2022年版）· 初中学段",
        "standard_en": "Compulsory Education Math Curriculum Standard (2022 ed.) · Middle",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 9],
        "core_concepts": ["抽象能力", "运算能力", "几何直观", "空间观念", "推理能力", "模型观念", "数据观念", "应用意识", "创新意识"],
        "stage_goals": [
            "数与代数：有理数/实数/整式/分式/二次根式；一元一次/二元一次方程组；一次/二次/反比例函数",
            "图形与几何：相交线平行线；三角形全等与相似；四边形；圆；锐角三角函数；尺规作图",
            "统计与概率：数据的收集整理与描述；样本与总体；简单概率计算",
            "综合与实践：主题式学习，运用数学解决真实问题",
        ],
        "assessment": "学业质量分 4 级，由'数感→符号意识→抽象→论证'递进，注重从合情推理到演绎推理过渡。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "english-middle": {
        "standard": "义务教育英语课程标准（2022年版）· 初中学段",
        "standard_en": "Compulsory Education English Curriculum Standard (2022 ed.) · Middle",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 9],
        "core_concepts": ["语言能力", "文化意识", "思维品质", "学习能力"],
        "stage_goals": [
            "三级（7-8年级）：累计学词 ≥1800；能读 150 词短文；能写 60-80 词短文；掌握 16 种基本时态",
            "四级（9年级）：累计学词 ≥2500；阅读量 15万词；写作 80-100 词；能就社会话题发表观点",
        ],
        "assessment": "语言能力四级；六要素整合；读后续写、主题阅读、跨文化比较类任务占比提升。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "physics-middle": {
        "standard": "义务教育物理课程标准（2022年版）",
        "standard_en": "Compulsory Education Physics Curriculum Standard (2022 ed.)",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [8, 9],
        "core_concepts": ["物质观念", "运动与相互作用观念", "能量观念", "科学思维", "科学探究", "科学态度与责任"],
        "stage_goals": [
            "一级主题'运动与相互作用'：机械运动、声、光、力、简单机械",
            "一级主题'物质'：物态变化、质量与密度、压强、浮力",
            "一级主题'能量'：电流、欧姆定律、电功率、电磁、能源",
        ],
        "assessment": "强调科学探究 7 要素；实验占比 ≥ 1/3；强调情境化、跨学科融合（如航天、能源）。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "chemistry-middle": {
        "standard": "义务教育化学课程标准（2022年版）",
        "standard_en": "Compulsory Education Chemistry Curriculum Standard (2022 ed.)",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [9, 9],
        "core_concepts": ["化学观念", "科学思维", "科学探究与实践", "科学态度与责任"],
        "stage_goals": [
            "物质的性质与应用：空气/氧气/水/金属/酸碱盐",
            "物质的组成与结构：原子分子/元素周期律/离子",
            "物质的化学变化：化学方程式/质量守恒/氧化还原/酸碱中和",
            "化学与社会：能源、材料、环境、健康",
        ],
        "assessment": "五大学习主题递进；以'宏观-微观-符号'三重表征统领；实验设计与探究是硬核能力。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "biology-middle": {
        "standard": "义务教育生物学课程标准（2022年版）",
        "standard_en": "Compulsory Education Biology Curriculum Standard (2022 ed.)",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 9],
        "core_concepts": ["生命观念", "科学思维", "探究实践", "态度责任"],
        "stage_goals": [
            "生物体的结构层次：细胞→组织→器官→系统",
            "生物的多样性：动植物分类、遗传变异、进化",
            "人与健康：消化/呼吸/循环/排泄/神经/内分泌系统",
            "生物与环境：生态系统、食物链、环境保护",
            "生物学与社会：生物技术、人口与健康",
        ],
        "assessment": "以大概念'细胞-生物体-生物圈-生物与环境'统领；观察/实验/调查/制作任务占比高。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "geography-middle": {
        "standard": "义务教育地理课程标准（2022年版）",
        "standard_en": "Compulsory Education Geography Curriculum Standard (2022 ed.)",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 8],
        "core_concepts": ["人地协调观", "综合思维", "区域认知", "地理实践力"],
        "stage_goals": [
            "地球与地图：经纬网/地形图/气候图",
            "世界地理：大洲大洋/气候带/人口/国家与地区",
            "中国地理：地形/气候/河流/资源/人口/民族/区域发展",
            "乡土地理：校园/家乡实地调查",
        ],
        "assessment": "情境化命题、图像化推理、跨区域比较；2022 版新增'人地协调观'统领。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },
    "history-middle": {
        "standard": "义务教育历史课程标准（2022年版）",
        "standard_en": "Compulsory Education History Curriculum Standard (2022 ed.)",
        "stage_key": "middle", "stage_zh": "初中",
        "source": "中华人民共和国教育部", "issued": "2022-04", "grade_range": [7, 9],
        "core_concepts": ["唯物史观", "时空观念", "史料实证", "历史解释", "家国情怀"],
        "stage_goals": [
            "中国古代史：先秦→秦汉→三国两晋南北朝→隋唐→宋元→明清",
            "中国近代史：鸦片战争→辛亥革命→新文化运动→抗日战争→解放战争",
            "中国现代史：新中国成立→改革开放→新时代",
            "世界古代/近代/现代史：大概念串联",
        ],
        "assessment": "强调史料研读、时序与空间结合、能从多种叙事中辨别历史真相。",
        "references": ["课程目标 (3)", "内容要求 (4)", "学业质量 (6)"],
    },

    # --- 高中 High (2017 版 / 2020 修订) ---
    "chinese-high": {
        "standard": "普通高中语文课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Chinese Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["语言建构与运用", "思维发展与提升", "审美鉴赏与创造", "文化传承与理解"],
        "stage_goals": [
            "必修（10 学分）：整本书阅读/当代文化参与/跨媒介读写/语言积累梳理探究/文学阅读与写作/思辨性阅读与表达/实用性阅读与交流",
            "选择性必修（6 学分）：中华传统文化经典研习/中国革命传统作品研习/中国现当代作家作品研习/外国作家作品研习/科学与文化论著研习",
            "选修（0-8 学分）：汉字汉语专题研讨/中华传统文化专题研讨/中国革命传统作品专题研讨等",
        ],
        "assessment": "学业质量分 5 级；以 18 个学习任务群为内容组织方式；高考对标 4/5 级。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "math-high": {
        "standard": "普通高中数学课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Math Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["数学抽象", "逻辑推理", "数学建模", "直观想象", "数学运算", "数据分析"],
        "stage_goals": [
            "必修（8 学分）：预备知识/函数/几何与代数/概率与统计/数学建模与探究活动",
            "选择性必修（6 学分）：函数/几何与代数/概率与统计/数学建模与探究活动（进阶）",
            "选修（A/B/C/D/E 五类）：微积分/空间向量与立体几何/计数原理/统计与概率/数学文化/数学史等",
        ],
        "assessment": "学业质量分 4 级；高考对标 2/3 级；选修对标 4 级。强调'四基四能'。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "english-high": {
        "standard": "普通高中英语课程标准（2017年版2020年修订）",
        "standard_en": "Senior High English Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["语言能力", "文化意识", "思维品质", "学习能力"],
        "stage_goals": [
            "必修（6 学分）：3 个单元主题语境覆盖人与自我、人与社会、人与自然",
            "选择性必修（8 学分）：继续深化主题语境；累计学词 3000-3200；读后续写成为高频题型",
            "选修（国家/地方/校本）：英语国家文学/影视/商贸/学术英语等",
        ],
        "assessment": "语言能力分 6 级，高考对标 6 级；以主题-语篇-语言知识-文化知识-语言技能-学习策略六要素整合。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "physics-high": {
        "standard": "普通高中物理课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Physics Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["物理观念", "科学思维", "科学探究", "科学态度与责任"],
        "stage_goals": [
            "必修（6 学分）：机械运动、相互作用、机械能、曲线运动、万有引力、电磁学基础",
            "选择性必修（6 学分）：动量与能量守恒、机械振动与机械波、电磁感应与电磁波、热力学、原子物理",
            "选修：物理学与前沿技术/近代物理进阶等",
        ],
        "assessment": "学业质量分 5 级；高考对标 3/4 级；实验探究能力与模型构建能力是核心。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "chemistry-high": {
        "standard": "普通高中化学课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Chemistry Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["宏观辨识与微观探析", "变化观念与平衡思想", "证据推理与模型认知", "科学探究与创新意识", "科学态度与社会责任"],
        "stage_goals": [
            "必修（4 学分）：化学科学与实验活动/常见无机物及其应用/物质结构基础与化学反应规律/简单有机化合物",
            "选择性必修（6 学分）：化学反应原理/物质结构与性质/有机化学基础",
            "选修：实验化学/化学与社会/发展中的化学科学",
        ],
        "assessment": "学业质量分 4 级；高考对标 3 级（理综）；实验-微观-符号三重表征贯穿全程。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "biology-high": {
        "standard": "普通高中生物学课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Biology Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["生命观念", "科学思维", "科学探究", "社会责任"],
        "stage_goals": [
            "必修（4 学分）：分子与细胞/遗传与进化",
            "选择性必修（6 学分）：稳态与调节/生物与环境/生物技术与工程",
            "选修：现实生活应用/拓展性学习",
        ],
        "assessment": "学业质量分 4 级；以'结构与功能观、进化与适应观、稳态与平衡观、物质与能量观、信息观、系统观'六观统领。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "geography-high": {
        "standard": "普通高中地理课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Geography Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["人地协调观", "综合思维", "区域认知", "地理实践力"],
        "stage_goals": [
            "必修（4 学分）：地理 1（自然地理基础）/地理 2（人文地理基础）",
            "选择性必修（6 学分）：自然地理基础/区域发展/资源、环境与国家安全",
            "选修：地理信息技术应用/海洋地理/自然灾害与防治等",
        ],
        "assessment": "学业质量分 4 级；高考对标 3 级；地理实践力与综合思维是能力高点。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "history-high": {
        "standard": "普通高中历史课程标准（2017年版2020年修订）",
        "standard_en": "Senior High History Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["唯物史观", "时空观念", "史料实证", "历史解释", "家国情怀"],
        "stage_goals": [
            "必修（4 学分）：中外历史纲要（上/下）",
            "选择性必修（6 学分）：国家制度与社会治理/经济与社会生活/文化交流与传播",
            "选修：史学入门/史料研读",
        ],
        "assessment": "学业质量分 4 级；高考对标 3 级；强调历史解释从'事实层'→'评价层'→'反思层'递进。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
    "info-tech-high": {
        "standard": "普通高中信息技术课程标准（2017年版2020年修订）",
        "standard_en": "Senior High Information Technology Curriculum Standard (2017, rev. 2020)",
        "stage_key": "high", "stage_zh": "高中",
        "source": "中华人民共和国教育部", "issued": "2020-05", "grade_range": [10, 12],
        "core_concepts": ["信息意识", "计算思维", "数字化学习与创新", "信息社会责任"],
        "stage_goals": [
            "必修（3 学分）：数据与计算/信息系统与社会",
            "选择性必修（6 学分）：数据与数据结构/网络基础/数据管理与分析/人工智能初步/三维设计与创意/开源硬件项目设计",
            "选修：算法初步/移动应用设计",
        ],
        "assessment": "学业质量分 4 级；以编程实践、项目学习、算法建模三线并进；人工智能初步是必学选择性必修。",
        "references": ["学科核心素养 (3)", "课程内容 (4)", "学业质量 (5)"],
    },
}

# ============================================================
# 领域级课标要求（domain.curriculum_goal）
# 按 file_stem → domain_id → goal 映射
# ============================================================
DOMAIN_GOALS: Dict[str, Dict[str, str]] = {
    "math-elementary": {
        "number-algebra": "认识整数、小数、分数；掌握四则运算及运算律；理解方程、比与比例；形成数感、符号意识、运算能力与应用意识。",
        "geometry": "认识点、线、面、角、常见平面/立体图形；掌握周长、面积、体积的测量与计算；发展几何直观与空间观念。",
        "statistics-probability": "经历收集、整理、描述、分析数据的过程；会看读简单统计图表；感受事件发生的可能性；形成数据意识。",
        "practical-application": "以主题式综合与实践活动，把数学知识整合到真实情境中；发展模型意识与创新意识。",
    },
    "science-elementary": {
        "matter-science": "观察物体性质、物质状态与变化；认识力、运动、光、声、热、电、磁、能量；形成'物质观'和'运动与相互作用观'。",
        "life-science": "认识生物与非生物、生命周期、生态系统、人体结构与健康；形成'生命观念'；会做简单观察与调查。",
        "earth-space-science": "观察天气、四季、月相、昼夜；认识地球水、岩石、地形变化、太阳系；建立'地球系统观'与'宇宙中的地球'观念。",
        "tech-engineering": "会用常见工具；经历'提出问题-设计方案-制作测试-改进迭代'工程设计过程；理解技术与社会、可持续发展。",
    },
    # 其他学科的 domain 目标在首次扫描时用占位文本，后续可按需精修
}

# ============================================================
# 节点级课标要求（node.curriculum_points）
# 仅给代表性节点手写；其余节点由脚本自动生成"学段+学科"通用表述占位
# ============================================================
NODE_POINTS: Dict[str, List[str]] = {
    # --- 小学数学（精写 10 个代表节点） ---
    "math-e-numbers-within-10": ["会数、认、读、写 10 以内的数", "理解基数和序数含义", "能比较大小、按顺序排列"],
    "math-e-numbers-within-100": ["认、读、写 100 以内的数", "理解十进制与位值", "会估算较大数量"],
    "math-e-add-sub-within-20": ["熟练口算 20 以内加减法", "能看图列式解决实际问题"],
    "math-e-multiplication-table": ["熟记乘法口诀", "理解乘法的意义（加法简便运算）"],
    "math-e-fractions-intro": ["理解分数表示整体的一部分", "会比较同分母分数大小"],
    "math-e-decimals-intro": ["认识一位、两位小数", "会读写、比较大小"],
    "math-e-simple-equation": ["理解等式与方程的含义", "会解简单一元一次方程", "能用方程解决问题"],
    "math-e-ratio-proportion": ["理解比、比例的含义", "会解正比例、反比例问题", "应用到地图比例尺等情境"],
    "math-e-circle-area": ["理解圆的周长、面积公式", "能解决与圆相关的实际问题"],
    "math-e-possibility": ["能用'一定/可能/不可能'描述事件", "会比较简单事件发生的可能性"],

    # --- 小学科学（精写 8 个代表节点） ---
    "sci-e-solid-liquid-gas": ["观察物质三种状态的特征", "能举例说明常见物态变化", "能设计实验验证水的沸腾/凝固条件"],
    "sci-e-water-cycle-matter": ["理解水的蒸发、凝结现象", "能解释自然界水循环", "能设计简易蒸发-凝结实验"],
    "sci-e-simple-machines": ["认识杠杆、滑轮、斜面", "能设计简单装置省力", "理解'省力与费力'的能量转换"],
    "sci-e-electricity-basic": ["能搭建简单闭合电路", "认识电池、开关、导线、灯泡的作用", "了解串联与并联初步区别"],
    "sci-e-ecosystem": ["理解食物链、食物网概念", "能举例说明生产者/消费者/分解者", "能分析人类活动对生态的影响"],
    "sci-e-solar-system": ["认识太阳系 8 大行星顺序", "能建立地月日相对位置模型", "理解行星公转周期差异"],
    "sci-e-moon-phases": ["观察并记录一个月月相变化", "能用模型解释月相成因", "与月亮相关古诗词联系"],
    "sci-e-design-process": ["经历'提出问题-设计-制作-测试-改进'完整流程", "能用 2 种以上材料搭建解决方案", "能评价设计优劣"],

    # --- 小学语文 ---
    "chn-e-pinyin-vowel-initial": ["会读会写 23 声母、24 韵母、16 整体认读音节", "能拼读简单音节"],
    "chn-e-hanzi-basics": ["累计识字 1600 字，会写 800 字（第一学段）", "掌握基本笔画与笔顺"],
    "chn-e-classical-chinese-intro": ["能借助注释和工具书理解浅易文言文", "能背诵指定古诗文篇目"],

    # --- 小学英语（代表性节点） ---
    "eng-e-alphabet": ["能认读、书写 26 个字母大小写", "能对应简单单词首字母"],
    "eng-e-basic-greetings": ["能进行简单问候、介绍", "能在真实情境中做角色扮演"],

    # --- 初中数学 ---
    "math-m-linear-function": ["理解一次函数的概念与图像", "会用待定系数法求解析式", "能建立一次函数模型解决实际问题"],
    "math-m-quadratic-function": ["理解二次函数的三种表达形式", "会画图像、分析顶点/对称轴/最值", "能用二次函数解决抛物线类实际问题"],
    "math-m-congruent-triangles": ["掌握 SSS/SAS/ASA/AAS/HL 判定方法", "能用全等证明简单几何命题"],

    # --- 初中物理 ---
    "phy-m-ohms-law": ["理解欧姆定律 I=U/R", "能在闭合电路中计算电流/电压/电阻", "能设计实验验证定律"],
    "phy-m-pressure": ["理解压强定义 p=F/S", "能计算固体、液体压强", "能解释生活现象（面积与压力关系）"],

    # --- 初中化学 ---
    "chem-m-atomic-structure": ["理解原子由质子、中子、电子构成", "能读懂前 20 号元素周期表", "能用原子结构示意图"],
    "chem-m-chemical-equation": ["理解质量守恒定律", "能配平简单化学方程式", "能表达化学反应本质"],

    # --- 初中生物 ---
    "bio-m-cell-structure": ["认识动植物细胞主要结构", "能比较动植物细胞异同", "会用显微镜观察细胞"],
    "bio-m-photosynthesis": ["理解光合作用原料、产物、条件", "能用实验验证光合产生氧气与淀粉", "能分析光合与呼吸的关系"],

    # --- 高中数学 ---
    "math-h-functions-concept": ["理解函数三要素（定义域、值域、对应关系）", "会用函数表示法", "能分析函数基本性质"],
    "math-h-derivative-concept": ["理解平均变化率与瞬时变化率", "会求常见函数导数", "能用导数判断单调性与极值"],

    # --- 高中物理 ---
    "phy-h-newton-laws": ["理解牛顿三大定律", "能建立物体受力分析模型", "能解决平衡与加速运动问题"],

    # --- 高中化学 ---
    "chem-h-redox-reaction": ["从电子得失角度理解氧化还原", "会配平复杂氧化还原方程式", "能分析实际反应（如电池、电解）"],

    # --- 高中生物 ---
    "bio-h-meiosis": ["理解减数分裂两次分裂过程", "能比较有丝分裂与减数分裂异同", "理解配子多样性来源"],

    # --- 高中信息技术 ---
    "it-h-ai-intro": ["理解人工智能基本概念", "能举例说明机器学习/深度学习应用", "能使用开源工具完成简单 AI 项目"],

    # ---（其余节点由脚本按学段+学科通用模板自动生成） ---
}

# ============================================================
# 核心逻辑
# ============================================================

def auto_node_points(node: dict, tree_subject: str, stage_zh: str) -> List[str]:
    """为没有精写的节点生成占位课标要求（学段+学科通用模板）。"""
    name = node.get("name", "")
    grade = node.get("grade", "")
    return [
        f"{stage_zh}{grade}年级学段目标：理解并掌握「{name}」的基本概念与方法",
        f"学业要求：能在真实情境中识别、运用「{name}」解决问题",
        f"活动建议：通过观察、实验、练习、讨论等方式深化对「{name}」的理解",
    ]


def inject_tree(tree_file: Path, dry_run: bool = False) -> dict:
    """对单棵树执行三层注入，返回统计。"""
    stem = tree_file.stem
    data = json.loads(tree_file.read_text(encoding="utf-8"))
    std_info = STANDARDS.get(stem)
    if not std_info:
        return {"file": stem, "skipped": True, "reason": "no standard entry"}

    # ---------- Layer 1: tree.metadata.curriculum ----------
    md = data.setdefault("metadata", {})
    md["curriculum"] = dict(std_info)  # 整个 dict 做深拷贝
    md["curriculum"]["node_count"] = sum(len(d.get("nodes", [])) for d in data.get("domains", []))
    md["updated_at"] = "2026-04-19"

    # ---------- Layer 2: domain.curriculum_goal ----------
    dom_goals = DOMAIN_GOALS.get(stem, {})
    stage_zh = std_info["stage_zh"]
    tree_subject = data.get("subject", "")
    domain_injected = 0
    for dom in data.get("domains", []):
        dom_id = dom.get("id", "")
        if dom_id in dom_goals:
            dom["curriculum_goal"] = dom_goals[dom_id]
        elif "curriculum_goal" not in dom:
            # 使用通用占位
            dom["curriculum_goal"] = (
                f"《{std_info['standard']}》规定的「{dom.get('name','')}」"
                f"领域内容要求：落实 {tree_subject} 学科核心素养，"
                f"在{stage_zh}阶段系统化掌握该领域关键概念与能力。"
            )
        domain_injected += 1

    # ---------- Layer 3: node.curriculum_points ----------
    node_injected = 0
    node_precise = 0
    for dom in data.get("domains", []):
        for node in dom.get("nodes", []):
            nid = node.get("id", "")
            if nid in NODE_POINTS:
                node["curriculum_points"] = list(NODE_POINTS[nid])
                node_precise += 1
            else:
                node["curriculum_points"] = auto_node_points(node, tree_subject, stage_zh)
            node_injected += 1

    if not dry_run:
        tree_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return {
        "file": stem,
        "standard": std_info["standard"],
        "domains": domain_injected,
        "nodes": node_injected,
        "nodes_precise": node_precise,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", help="仅注入某学科前缀（如 math / chinese）")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print("=" * 70)
    print("注入课标基本要求（三层 schema）")
    print("=" * 70)

    results = []
    for f in sorted(TREES.glob("*.json")):
        if args.subject and not f.stem.startswith(args.subject):
            continue
        r = inject_tree(f, dry_run=args.dry_run)
        results.append(r)
        if r.get("skipped"):
            print(f"  ⏩ 跳过 {r['file']:30s} ({r.get('reason')})")
        else:
            print(
                f"  ✅ {r['file']:30s} → {r['standard'][:30]:30s} "
                f"| {r['domains']} 领域 | {r['nodes']} 节点（{r['nodes_precise']} 精写）"
            )

    print("\n" + "=" * 70)
    print(f"共处理 {len(results)} 棵树{' (dry-run)' if args.dry_run else ''}")
    total_nodes = sum(r.get("nodes", 0) for r in results if not r.get("skipped"))
    total_precise = sum(r.get("nodes_precise", 0) for r in results if not r.get("skipped"))
    print(f"总节点数：{total_nodes}，精写节点：{total_precise}")


if __name__ == "__main__":
    sys.exit(main())
