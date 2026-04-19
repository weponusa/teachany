#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate stub JSON knowledge trees for all international curricula
(IB PYP/MYP/DP, Cambridge Primary/LSec/IGCSE/A-Level, US K-5/MS/HS/AP).

Each node is a placeholder (status='placeholder', courses=[], extends=[], parallel=[]).
Structure and content based on official curriculum frameworks.

Usage:
    python3 scripts/generate-intl-trees.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "data", "trees", "international")
os.makedirs(OUT_DIR, exist_ok=True)

# ------------------------------------------------------------------
# helpers
# ------------------------------------------------------------------
def make_tree(filename, subject, curriculum, stage, name_zh, name_en,
              description, source, domains_spec):
    """
    domains_spec: list of (domain_zh, domain_en, [(suf, nz, ne, g, d, [prereq_suf]), ...])
    Returns dict; id prefix = f'{subject}-{curriculum}-{stage}'
    """
    prefix = f"{subject}-{curriculum}-{stage}".rstrip("-")
    seen = set()
    domains = []
    for dz, de, nodes in domains_spec:
        node_list = []
        for spec in nodes:
            suf, nz, ne, g, d, prereqs = spec
            nid = f"{prefix}-{suf}"
            if nid in seen:
                raise ValueError(f"Duplicate node id: {nid} in {filename}")
            seen.add(nid)
            node_list.append({
                "id": nid,
                "name": nz,
                "name_en": ne,
                "grade": g,
                "difficulty": d,
                "status": "placeholder",
                "prerequisites": [f"{prefix}-{p}" for p in prereqs],
                "courses": [],
                "extends": [],
                "parallel": []
            })
        domains.append({
            "name": f"{dz} / {de}",
            "name_en": de,
            "nodes": node_list
        })
    tree = {
        "subject": subject,
        "curriculum": curriculum,
        "stage": stage,
        "name_zh": name_zh,
        "name_en": name_en,
        "description": description,
        "source": source,
        "domains": domains
    }
    return tree


def save(filename, tree):
    out = os.path.join(OUT_DIR, filename)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {filename}  ({sum(len(d['nodes']) for d in tree['domains'])} nodes)")


# ------------------------------------------------------------------
# IB PYP (Primary Years Programme) — 6 transdisciplinary themes (K-G5)
# ------------------------------------------------------------------
def gen_ib_pyp():
    print("\n[IB PYP] 6 transdisciplinary themes")

    save("ib-pyp-who-we-are.json", make_tree(
        "ib-pyp-who-we-are.json", "theme", "ib-pyp", "who-we-are",
        "IB PYP · 我们是谁",
        "IB PYP · Who We Are",
        "Inquiry into the nature of self, beliefs, values, health, relationships.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("自我认知 Self-Awareness", "Self-Awareness", [
                ("identity", "身份认同", "Identity", 1, 1, []),
                ("emotions", "情绪识别", "Emotions", 1, 1, ["identity"]),
                ("values", "个人价值观", "Personal values", 3, 2, ["identity"]),
                ("beliefs", "信念与文化", "Beliefs & culture", 4, 2, ["values"]),
            ]),
            ("人际关系 Relationships", "Relationships", [
                ("family", "家庭关系", "Family relationships", 1, 1, []),
                ("friendship", "友谊与合作", "Friendship", 2, 1, ["family"]),
                ("community-roles", "社区角色", "Community roles", 3, 2, ["friendship"]),
                ("conflict-resolution", "冲突解决", "Conflict resolution", 4, 3, ["friendship"]),
            ]),
            ("健康与福祉 Health & Wellbeing", "Health", [
                ("body-health", "身体健康", "Body health", 1, 1, []),
                ("mental-wellbeing", "心理健康", "Mental wellbeing", 3, 2, ["emotions"]),
                ("lifestyle", "生活方式选择", "Lifestyle choices", 5, 2, ["body-health"]),
            ]),
        ]
    ))

    save("ib-pyp-where-we-are.json", make_tree(
        "ib-pyp-where-we-are.json", "theme", "ib-pyp", "where-we-are",
        "IB PYP · 时空定位",
        "IB PYP · Where We Are in Place and Time",
        "Inquiry into orientation in place and time, personal histories, homes, journeys.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("空间与地理 Place & Geography", "Place", [
                ("home-school", "家与学校", "Home & school", 1, 1, []),
                ("neighborhood", "邻里社区", "Neighborhood", 2, 1, ["home-school"]),
                ("maps-basic", "地图基础", "Basic maps", 3, 2, ["neighborhood"]),
                ("continents-oceans", "大洲与海洋", "Continents & oceans", 4, 2, ["maps-basic"]),
            ]),
            ("时间与历史 Time & History", "Time", [
                ("personal-history", "个人历史", "Personal history", 1, 1, []),
                ("family-history", "家庭史", "Family history", 2, 2, ["personal-history"]),
                ("local-history", "地方历史", "Local history", 3, 2, ["family-history"]),
                ("civilizations", "古代文明", "Ancient civilizations", 5, 3, ["local-history"]),
            ]),
            ("迁徙与旅程 Migration & Journeys", "Migration", [
                ("journeys", "旅程故事", "Journeys", 2, 2, []),
                ("migration-reasons", "迁徙原因", "Reasons for migration", 4, 3, ["journeys", "local-history"]),
            ]),
        ]
    ))

    save("ib-pyp-how-we-express.json", make_tree(
        "ib-pyp-how-we-express.json", "theme", "ib-pyp", "how-we-express",
        "IB PYP · 如何表达自己",
        "IB PYP · How We Express Ourselves",
        "Inquiry into discovery and expression of ideas, feelings, values through language, arts.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("语言表达 Language", "Language", [
                ("oral", "口语表达", "Oral expression", 1, 1, []),
                ("storytelling", "讲故事", "Storytelling", 2, 2, ["oral"]),
                ("writing-basic", "书面表达", "Writing", 3, 2, ["storytelling"]),
                ("poetry", "诗歌创作", "Poetry", 5, 3, ["writing-basic"]),
            ]),
            ("视觉艺术 Visual Arts", "Visual Arts", [
                ("drawing", "绘画", "Drawing", 1, 1, []),
                ("color-theory", "色彩与形状", "Color & shape", 2, 2, ["drawing"]),
                ("art-styles", "艺术风格", "Art styles", 4, 3, ["color-theory"]),
            ]),
            ("表演艺术 Performing Arts", "Performing Arts", [
                ("music-basic", "音乐基础", "Music basics", 1, 1, []),
                ("drama", "戏剧表演", "Drama", 3, 2, ["music-basic", "oral"]),
                ("dance", "舞蹈", "Dance", 3, 2, ["music-basic"]),
            ]),
        ]
    ))

    save("ib-pyp-how-world-works.json", make_tree(
        "ib-pyp-how-world-works.json", "theme", "ib-pyp", "how-world-works",
        "IB PYP · 世界如何运作",
        "IB PYP · How the World Works",
        "Inquiry into natural world, laws, interaction between natural world and human societies.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("自然现象 Natural Phenomena", "Natural Phenomena", [
                ("weather", "天气与季节", "Weather & seasons", 1, 1, []),
                ("water-cycle", "水循环", "Water cycle", 3, 2, ["weather"]),
                ("forces", "力与运动", "Forces & motion", 4, 2, []),
                ("energy-forms", "能量形式", "Forms of energy", 5, 3, ["forces"]),
            ]),
            ("生命世界 Living World", "Living World", [
                ("plants-animals", "动植物", "Plants & animals", 1, 1, []),
                ("life-cycles", "生命周期", "Life cycles", 2, 2, ["plants-animals"]),
                ("ecosystems", "生态系统", "Ecosystems", 4, 3, ["life-cycles"]),
            ]),
            ("物质世界 Materials", "Materials", [
                ("materials-properties", "物质属性", "Properties of materials", 2, 1, []),
                ("states-of-matter", "物质三态", "States of matter", 3, 2, ["materials-properties"]),
                ("simple-machines", "简单机械", "Simple machines", 5, 3, ["forces"]),
            ]),
        ]
    ))

    save("ib-pyp-how-we-organize.json", make_tree(
        "ib-pyp-how-we-organize.json", "theme", "ib-pyp", "how-we-organize",
        "IB PYP · 如何组织自己",
        "IB PYP · How We Organize Ourselves",
        "Inquiry into systems and organizations, human-made systems, communities, economics.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("社区与规则 Community & Rules", "Community", [
                ("rules-basic", "规则与秩序", "Rules", 1, 1, []),
                ("community-helpers", "社区工作者", "Community helpers", 2, 1, ["rules-basic"]),
                ("government-intro", "政府与治理", "Government intro", 5, 3, ["rules-basic"]),
            ]),
            ("经济系统 Economics", "Economics", [
                ("needs-wants", "需要与想要", "Needs vs wants", 2, 2, []),
                ("money-basics", "货币基础", "Money basics", 3, 2, ["needs-wants"]),
                ("trade", "贸易与交换", "Trade & exchange", 4, 3, ["money-basics"]),
            ]),
            ("人造系统 Human Systems", "Human Systems", [
                ("transportation", "交通运输", "Transportation", 2, 2, []),
                ("communication", "通讯系统", "Communication", 3, 2, ["transportation"]),
                ("cities", "城市规划", "Cities", 5, 3, ["transportation", "government-intro"]),
            ]),
        ]
    ))

    save("ib-pyp-sharing-planet.json", make_tree(
        "ib-pyp-sharing-planet.json", "theme", "ib-pyp", "sharing-planet",
        "IB PYP · 共享地球",
        "IB PYP · Sharing the Planet",
        "Inquiry into rights and responsibilities, sharing finite resources, peace and conflict.",
        "https://www.ibo.org/programmes/primary-years-programme/curriculum/",
        [
            ("环境保护 Environment", "Environment", [
                ("recycling", "回收利用", "Recycling", 1, 1, []),
                ("pollution", "污染问题", "Pollution", 3, 2, ["recycling"]),
                ("climate-change", "气候变化", "Climate change", 5, 3, ["pollution"]),
            ]),
            ("权利与责任 Rights", "Rights", [
                ("child-rights", "儿童权利", "Children's rights", 2, 2, []),
                ("fairness", "公平与正义", "Fairness", 3, 2, ["child-rights"]),
                ("global-citizenship", "全球公民", "Global citizenship", 5, 3, ["fairness"]),
            ]),
            ("可持续发展 Sustainability", "Sustainability", [
                ("resources", "自然资源", "Natural resources", 3, 2, []),
                ("biodiversity", "生物多样性", "Biodiversity", 4, 3, ["resources"]),
                ("sustainable-living", "可持续生活", "Sustainable living", 5, 3, ["biodiversity", "climate-change"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# IB MYP (Middle Years) — 8 subject groups (G6-G10)
# ------------------------------------------------------------------
def gen_ib_myp():
    print("\n[IB MYP] 8 subject groups")

    save("ib-myp-language-literature.json", make_tree(
        "ib-myp-language-literature.json", "lit", "ib-myp", "myp",
        "IB MYP · 语言与文学", "IB MYP · Language & Literature",
        "Group 1: reading, writing, listening, speaking, viewing, presenting in mother tongue.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/language-and-literature/",
        [
            ("分析 Analysis", "Analysing", [
                ("text-analysis", "文本分析", "Text analysis", 6, 2, []),
                ("lit-devices", "文学手法", "Literary devices", 7, 3, ["text-analysis"]),
                ("critical-reading", "批判性阅读", "Critical reading", 9, 4, ["lit-devices"]),
            ]),
            ("组织 Organizing", "Organizing", [
                ("essay-structure", "论文结构", "Essay structure", 6, 2, []),
                ("argumentation", "论证展开", "Argumentation", 8, 3, ["essay-structure"]),
            ]),
            ("写作 Producing Text", "Producing", [
                ("creative-writing", "创意写作", "Creative writing", 6, 2, []),
                ("analytical-writing", "分析写作", "Analytical writing", 8, 3, ["creative-writing", "essay-structure"]),
            ]),
            ("运用语言 Using Language", "Using Language", [
                ("register", "语域与风格", "Register & style", 7, 3, []),
                ("rhetoric", "修辞手法", "Rhetoric", 9, 4, ["register", "lit-devices"]),
            ]),
        ]
    ))

    save("ib-myp-language-acquisition.json", make_tree(
        "ib-myp-language-acquisition.json", "lang", "ib-myp", "myp",
        "IB MYP · 习得语言", "IB MYP · Language Acquisition",
        "Group 2: additional language learning across 6 phases (beginner to proficient).",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/language-acquisition/",
        [
            ("听力理解 Listening", "Listening", [
                ("listen-basic", "基础听力", "Basic listening", 6, 1, []),
                ("listen-intermediate", "中级听力", "Intermediate listening", 8, 3, ["listen-basic"]),
                ("listen-advanced", "高级听力", "Advanced listening", 10, 4, ["listen-intermediate"]),
            ]),
            ("口语 Speaking", "Speaking", [
                ("speak-basic", "基础口语", "Basic speaking", 6, 2, []),
                ("speak-interaction", "对话互动", "Interaction", 8, 3, ["speak-basic"]),
                ("speak-presentation", "演讲表达", "Presentation", 10, 4, ["speak-interaction"]),
            ]),
            ("阅读 Reading", "Reading", [
                ("read-basic", "基础阅读", "Basic reading", 6, 2, []),
                ("read-comprehension", "阅读理解", "Comprehension", 8, 3, ["read-basic"]),
                ("read-literature", "文学阅读", "Literature", 10, 4, ["read-comprehension"]),
            ]),
            ("写作 Writing", "Writing", [
                ("write-basic", "基础写作", "Basic writing", 6, 2, []),
                ("write-descriptive", "描述性写作", "Descriptive", 8, 3, ["write-basic"]),
                ("write-argumentative", "议论文写作", "Argumentative", 10, 4, ["write-descriptive"]),
            ]),
        ]
    ))

    save("ib-myp-individuals-societies.json", make_tree(
        "ib-myp-individuals-societies.json", "humanities", "ib-myp", "myp",
        "IB MYP · 个人与社会", "IB MYP · Individuals & Societies",
        "Group 3: history, geography, economics, politics integrated study.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/individuals-and-societies/",
        [
            ("历史 History", "History", [
                ("ancient-civilizations", "古代文明", "Ancient civilizations", 6, 2, []),
                ("medieval", "中世纪", "Medieval era", 7, 3, ["ancient-civilizations"]),
                ("modern-history", "现代史", "Modern history", 9, 4, ["medieval"]),
            ]),
            ("地理 Geography", "Geography", [
                ("physical-geo", "自然地理", "Physical geography", 6, 2, []),
                ("human-geo", "人文地理", "Human geography", 8, 3, ["physical-geo"]),
                ("global-issues", "全球议题", "Global issues", 10, 4, ["human-geo"]),
            ]),
            ("经济政治 Civics", "Civics", [
                ("civics-basic", "公民基础", "Civics basics", 7, 2, []),
                ("econ-intro", "经济入门", "Economics intro", 8, 3, ["civics-basic"]),
                ("politics", "政治制度", "Political systems", 10, 4, ["econ-intro"]),
            ]),
        ]
    ))

    save("ib-myp-sciences.json", make_tree(
        "ib-myp-sciences.json", "sci", "ib-myp", "myp",
        "IB MYP · 科学", "IB MYP · Sciences",
        "Group 4: integrated sciences (biology, chemistry, physics) with inquiry skills.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/sciences/",
        [
            ("生物 Biology", "Biology", [
                ("cells", "细胞结构", "Cells", 6, 2, []),
                ("genetics-intro", "遗传学入门", "Genetics intro", 8, 3, ["cells"]),
                ("ecology", "生态学", "Ecology", 10, 3, ["cells"]),
            ]),
            ("化学 Chemistry", "Chemistry", [
                ("matter-states", "物质状态", "States of matter", 6, 2, []),
                ("atoms-elements", "原子与元素", "Atoms & elements", 7, 3, ["matter-states"]),
                ("reactions", "化学反应", "Chemical reactions", 9, 4, ["atoms-elements"]),
            ]),
            ("物理 Physics", "Physics", [
                ("forces-motion", "力与运动", "Forces & motion", 6, 2, []),
                ("energy", "能量守恒", "Energy", 8, 3, ["forces-motion"]),
                ("waves-elec", "波与电", "Waves & electricity", 10, 4, ["energy"]),
            ]),
            ("科学方法 Scientific Method", "Scientific Method", [
                ("inquiry", "探究方法", "Inquiry", 6, 2, []),
                ("lab-skills", "实验技能", "Lab skills", 7, 3, ["inquiry"]),
            ]),
        ]
    ))

    save("ib-myp-mathematics.json", make_tree(
        "ib-myp-mathematics.json", "math", "ib-myp", "myp",
        "IB MYP · 数学", "IB MYP · Mathematics",
        "Group 5: number, algebra, geometry, statistics, with standard and extended pathways.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/mathematics/",
        [
            ("数与代数 Number & Algebra", "Number & Algebra", [
                ("integers-fractions", "整数与分数", "Integers & fractions", 6, 2, []),
                ("linear-eq", "一次方程", "Linear equations", 7, 3, ["integers-fractions"]),
                ("quadratics", "二次方程", "Quadratics", 9, 4, ["linear-eq"]),
                ("sequences", "数列", "Sequences", 10, 4, ["linear-eq"]),
            ]),
            ("几何 Geometry", "Geometry", [
                ("shapes-angles", "图形与角", "Shapes & angles", 6, 2, []),
                ("pythagoras", "勾股定理", "Pythagoras", 8, 3, ["shapes-angles"]),
                ("trig-basic", "三角比", "Trigonometry", 9, 4, ["pythagoras"]),
            ]),
            ("统计概率 Stats & Probability", "Statistics", [
                ("data-display", "数据展示", "Data displays", 6, 2, []),
                ("probability", "概率基础", "Probability", 8, 3, ["data-display"]),
                ("statistics-measures", "统计量", "Statistical measures", 9, 3, ["probability"]),
            ]),
        ]
    ))

    save("ib-myp-arts.json", make_tree(
        "ib-myp-arts.json", "arts", "ib-myp", "myp",
        "IB MYP · 艺术", "IB MYP · Arts",
        "Group 6: visual arts, performing arts with creative and critical processes.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/arts/",
        [
            ("视觉艺术 Visual Arts", "Visual Arts", [
                ("drawing-painting", "素描与绘画", "Drawing & painting", 6, 2, []),
                ("sculpture", "雕塑", "Sculpture", 8, 3, ["drawing-painting"]),
                ("digital-art", "数字艺术", "Digital art", 9, 3, ["drawing-painting"]),
            ]),
            ("表演艺术 Performing", "Performing Arts", [
                ("music-theory", "乐理基础", "Music theory", 6, 2, []),
                ("drama-basics", "戏剧基础", "Drama", 7, 3, []),
                ("composition", "音乐创作", "Composition", 10, 4, ["music-theory"]),
            ]),
            ("艺术批评 Criticism", "Criticism", [
                ("art-history", "艺术史", "Art history", 8, 3, []),
                ("critique", "作品评论", "Critique", 9, 4, ["art-history"]),
            ]),
        ]
    ))

    save("ib-myp-pe.json", make_tree(
        "ib-myp-pe.json", "pe", "ib-myp", "myp",
        "IB MYP · 体育与健康", "IB MYP · Physical & Health Education",
        "Group 7: physical literacy, health knowledge, active lifestyle.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/physical-and-health-education/",
        [
            ("运动技能 Skills", "Movement Skills", [
                ("team-sports", "团队运动", "Team sports", 6, 2, []),
                ("individual-sports", "个人运动", "Individual sports", 7, 2, ["team-sports"]),
                ("tactics", "战术策略", "Tactics", 9, 3, ["team-sports"]),
            ]),
            ("健康知识 Health Knowledge", "Health", [
                ("nutrition", "营养", "Nutrition", 6, 2, []),
                ("fitness", "体能训练", "Fitness training", 8, 3, ["nutrition"]),
                ("mental-health", "心理健康", "Mental health", 10, 3, []),
            ]),
        ]
    ))

    save("ib-myp-design.json", make_tree(
        "ib-myp-design.json", "design", "ib-myp", "myp",
        "IB MYP · 设计", "IB MYP · Design",
        "Group 8: design cycle — inquiry, developing ideas, creating solutions, evaluating.",
        "https://www.ibo.org/programmes/middle-years-programme/curriculum/design/",
        [
            ("设计流程 Design Cycle", "Design Cycle", [
                ("inquiry-analysis", "调研分析", "Inquiring & analysing", 6, 2, []),
                ("develop-ideas", "构思发展", "Developing ideas", 7, 3, ["inquiry-analysis"]),
                ("create-solution", "制作方案", "Creating solution", 8, 3, ["develop-ideas"]),
                ("evaluate", "评估反思", "Evaluating", 9, 4, ["create-solution"]),
            ]),
            ("数字设计 Digital Design", "Digital Design", [
                ("html-css", "HTML/CSS 网页", "HTML/CSS", 7, 2, []),
                ("prog-basic", "编程基础", "Programming basics", 8, 3, ["html-css"]),
                ("ux-design", "用户体验设计", "UX design", 10, 4, ["prog-basic"]),
            ]),
            ("产品设计 Product Design", "Product Design", [
                ("sketching", "草图技法", "Sketching", 6, 2, []),
                ("cad-intro", "CAD 入门", "CAD intro", 9, 3, ["sketching"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# IB DP (Diploma Programme) — remaining 7 subjects (G11-G12)
# Note: math-aa, biology, chemistry, physics already exist.
# ------------------------------------------------------------------
def gen_ib_dp():
    print("\n[IB DP] 7 remaining subjects")

    save("ib-dp-math-ai.json", make_tree(
        "ib-dp-math-ai.json", "math", "ib-dp", "ai",
        "IB DP 数学 · Applications and Interpretation",
        "IB DP Math: Applications & Interpretation (SL/HL)",
        "Applied math with technology focus; 5 topics: Number&Algebra, Functions, Geometry, Stats, Calculus.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/mathematics/",
        [
            ("数与代数 Number & Algebra", "Number & Algebra", [
                ("numbers", "数系与估算", "Number systems", 11, 2, []),
                ("exp-log-ai", "指数对数应用", "Exp & log applications", 11, 3, ["numbers"]),
                ("sequences-ai", "数列金融", "Sequences & finance", 11, 3, ["numbers"]),
            ]),
            ("函数 Functions", "Functions", [
                ("linear-quadratic", "线性/二次", "Linear/quadratic", 11, 2, []),
                ("exp-models", "指数建模", "Exponential models", 12, 3, ["linear-quadratic", "exp-log-ai"]),
                ("regression", "回归分析", "Regression", 12, 3, ["linear-quadratic"]),
            ]),
            ("几何三角 Geometry & Trig", "Geometry & Trig", [
                ("3d-geo", "三维几何", "3D geometry", 11, 3, []),
                ("voronoi", "Voronoi 图", "Voronoi diagrams (HL)", 12, 4, ["3d-geo"]),
            ]),
            ("统计概率 Stats", "Statistics", [
                ("descriptive-stats", "描述统计", "Descriptive statistics", 11, 2, []),
                ("probability-dist", "概率分布", "Probability distributions", 12, 3, ["descriptive-stats"]),
                ("hypothesis-testing", "假设检验", "Hypothesis testing", 12, 4, ["probability-dist"]),
            ]),
            ("微积分 Calculus", "Calculus", [
                ("calc-intro", "微积分入门", "Intro calculus", 12, 3, ["linear-quadratic"]),
                ("integration-ai", "积分应用", "Integration applications", 12, 4, ["calc-intro"]),
            ]),
        ]
    ))

    save("ib-dp-english-a.json", make_tree(
        "ib-dp-english-a.json", "english", "ib-dp", "lang-lit",
        "IB DP 英语 A · Language and Literature",
        "IB DP English A: Language & Literature (SL/HL)",
        "Study of literature and non-literary texts in English across time, place, culture.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/studies-in-language-and-literature/",
        [
            ("读者作者文本 Readers/Writers/Texts", "Readers & Texts", [
                ("close-reading", "精读分析", "Close reading", 11, 3, []),
                ("literary-forms", "文学形式", "Literary forms", 11, 3, ["close-reading"]),
                ("non-lit-texts", "非文学文本", "Non-literary texts", 11, 3, ["close-reading"]),
            ]),
            ("时间空间 Time & Space", "Time & Space", [
                ("historical-context", "历史语境", "Historical context", 12, 4, ["literary-forms"]),
                ("cultural-context", "文化语境", "Cultural context", 12, 4, ["historical-context"]),
            ]),
            ("相互联系 Intertextuality", "Intertextuality", [
                ("comparative", "比较分析", "Comparative analysis", 12, 4, ["literary-forms", "cultural-context"]),
                ("global-issues", "全球议题 IO", "Global issues (IO)", 12, 4, ["comparative"]),
            ]),
        ]
    ))

    save("ib-dp-economics.json", make_tree(
        "ib-dp-economics.json", "econ", "ib-dp", "econ",
        "IB DP · 经济学", "IB DP · Economics",
        "Microeconomics, macroeconomics, global economy; SL/HL pathway.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/individuals-and-societies/",
        [
            ("微观经济 Microeconomics", "Microeconomics", [
                ("demand-supply", "供求理论", "Demand & supply", 11, 2, []),
                ("elasticity", "弹性", "Elasticity", 11, 3, ["demand-supply"]),
                ("market-failure", "市场失灵", "Market failure", 11, 4, ["elasticity"]),
                ("firm-theory", "厂商理论 (HL)", "Theory of firm (HL)", 12, 4, ["market-failure"]),
            ]),
            ("宏观经济 Macroeconomics", "Macroeconomics", [
                ("gdp-measure", "GDP 度量", "Measuring GDP", 11, 2, []),
                ("unemployment-inflation", "失业与通胀", "Unemployment & inflation", 12, 3, ["gdp-measure"]),
                ("fiscal-monetary", "财政货币政策", "Fiscal & monetary policy", 12, 4, ["unemployment-inflation"]),
            ]),
            ("全球经济 Global Economy", "Global Economy", [
                ("intl-trade", "国际贸易", "International trade", 12, 3, ["demand-supply"]),
                ("exchange-rates", "汇率", "Exchange rates", 12, 4, ["intl-trade"]),
                ("development-econ", "发展经济学", "Development economics", 12, 4, ["intl-trade"]),
            ]),
        ]
    ))

    save("ib-dp-history.json", make_tree(
        "ib-dp-history.json", "history", "ib-dp", "hist",
        "IB DP · 历史", "IB DP · History",
        "Prescribed subjects, world history topics, regional option; HL paper 3.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/individuals-and-societies/",
        [
            ("规定主题 Prescribed", "Prescribed Subjects", [
                ("ww1-peacemaking", "一战与和平缔造", "WWI peacemaking", 11, 3, []),
                ("cold-war-origins", "冷战起源", "Origins of Cold War", 11, 4, []),
                ("arab-israeli", "阿以冲突", "Arab-Israeli conflict", 11, 4, []),
            ]),
            ("世界史专题 World History", "World History Topics", [
                ("authoritarian", "威权国家兴衰", "Authoritarian states", 12, 4, ["ww1-peacemaking"]),
                ("causes-wars", "战争起因", "Causes of wars", 12, 4, ["ww1-peacemaking"]),
                ("ind-rev", "独立革命", "Independence movements", 12, 4, []),
            ]),
            ("区域史 Regional (HL)", "Regional Option (HL)", [
                ("asia-hl", "亚洲与大洋洲史", "History of Asia & Oceania", 12, 5, ["authoritarian"]),
                ("europe-hl", "欧洲史", "History of Europe", 12, 5, ["ww1-peacemaking"]),
            ]),
        ]
    ))

    save("ib-dp-tok.json", make_tree(
        "ib-dp-tok.json", "tok", "ib-dp", "core",
        "IB DP · 知识理论 TOK",
        "IB DP · Theory of Knowledge",
        "Core element exploring how we know what we know; areas of knowledge + themes.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/dp-core/",
        [
            ("核心主题 Core Theme", "Core Theme", [
                ("knowledge-knower", "知识与知识者", "Knowledge & knower", 11, 3, []),
            ]),
            ("可选主题 Optional Themes", "Optional Themes", [
                ("tech-knowledge", "技术与知识", "Technology & knowledge", 11, 4, ["knowledge-knower"]),
                ("language-knowledge", "语言与知识", "Language & knowledge", 11, 4, ["knowledge-knower"]),
                ("indigenous", "原住民知识", "Indigenous knowledge", 11, 4, ["knowledge-knower"]),
                ("religion", "宗教与知识", "Religion & knowledge", 11, 4, ["knowledge-knower"]),
                ("politics", "政治与知识", "Politics & knowledge", 11, 4, ["knowledge-knower"]),
            ]),
            ("知识领域 Areas of Knowledge", "Areas of Knowledge", [
                ("aok-history", "历史", "History (AoK)", 12, 4, ["knowledge-knower"]),
                ("aok-sciences", "自然科学", "Natural sciences", 12, 4, ["knowledge-knower"]),
                ("aok-human-sci", "人文科学", "Human sciences", 12, 4, ["knowledge-knower"]),
                ("aok-math", "数学", "Mathematics (AoK)", 12, 4, ["knowledge-knower"]),
                ("aok-arts", "艺术", "Arts (AoK)", 12, 4, ["knowledge-knower"]),
            ]),
            ("评估 Assessment", "Assessment", [
                ("tok-exhibition", "TOK 展览", "TOK exhibition", 11, 4, ["knowledge-knower"]),
                ("tok-essay", "TOK 论文", "TOK essay", 12, 5, ["aok-history", "aok-sciences"]),
            ]),
        ]
    ))

    save("ib-dp-ee.json", make_tree(
        "ib-dp-ee.json", "ee", "ib-dp", "core",
        "IB DP · 拓展论文 EE",
        "IB DP · Extended Essay",
        "4000-word independent research essay across 60 subjects; core component.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/dp-core/",
        [
            ("选题 Choosing Topic", "Choosing a Topic", [
                ("subject-choice", "选择学科", "Subject choice", 11, 2, []),
                ("research-question", "研究问题形成", "Research question", 11, 3, ["subject-choice"]),
                ("scope-focus", "范围与焦点", "Scope & focus", 11, 3, ["research-question"]),
            ]),
            ("研究过程 Research Process", "Research Process", [
                ("literature-review", "文献综述", "Literature review", 11, 3, ["research-question"]),
                ("research-methods", "研究方法", "Research methods", 11, 4, ["literature-review"]),
                ("data-collection", "数据收集", "Data collection", 12, 4, ["research-methods"]),
            ]),
            ("写作与反思 Writing & Reflection", "Writing", [
                ("essay-structure-ee", "论文结构", "Essay structure", 12, 4, ["data-collection"]),
                ("rpp-reflection", "RPP 反思", "Reflection (RPP)", 12, 4, ["essay-structure-ee"]),
                ("viva-voce", "答辩", "Viva voce", 12, 4, ["rpp-reflection"]),
            ]),
        ]
    ))

    save("ib-dp-cas.json", make_tree(
        "ib-dp-cas.json", "cas", "ib-dp", "core",
        "IB DP · CAS 创造·行动·服务",
        "IB DP · Creativity, Activity, Service",
        "Experiential learning with 7 CAS learning outcomes; project-based.",
        "https://www.ibo.org/programmes/diploma-programme/curriculum/dp-core/",
        [
            ("创造 Creativity", "Creativity", [
                ("creative-exploration", "创意探索", "Creative exploration", 11, 2, []),
                ("artistic-projects", "艺术项目", "Artistic projects", 11, 3, ["creative-exploration"]),
            ]),
            ("行动 Activity", "Activity", [
                ("physical-challenge", "体能挑战", "Physical challenge", 11, 2, []),
                ("sports-team", "团队运动", "Team sports", 11, 2, ["physical-challenge"]),
            ]),
            ("服务 Service", "Service", [
                ("community-service", "社区服务", "Community service", 11, 3, []),
                ("advocacy", "倡导行动", "Advocacy", 12, 4, ["community-service"]),
                ("service-learning", "服务学习", "Service learning", 12, 4, ["community-service"]),
            ]),
            ("CAS 项目 Project", "CAS Project", [
                ("cas-project-plan", "项目策划", "Project planning", 11, 3, ["creative-exploration", "community-service"]),
                ("cas-project-exec", "项目执行", "Project execution", 12, 4, ["cas-project-plan"]),
                ("cas-reflection", "反思记录", "Reflection journal", 12, 3, ["cas-project-exec"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# Cambridge Primary (Stage 1-6, G1-G6)
# ------------------------------------------------------------------
def gen_cam_primary():
    print("\n[Cambridge Primary] 4 subjects")

    save("cam-primary-english.json", make_tree(
        "cam-primary-english.json", "english", "cam-primary", "p",
        "剑桥小学 · 英语", "Cambridge Primary English",
        "Cambridge Primary English curriculum framework (Stages 1-6).",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/cambridge-primary-curriculum/",
        [
            ("听力 Listening", "Listening", [
                ("listen-sounds", "辨音听力", "Phonemic awareness", 1, 1, []),
                ("listen-stories", "听故事", "Listening to stories", 2, 2, ["listen-sounds"]),
                ("listen-details", "细节理解", "Detailed listening", 4, 3, ["listen-stories"]),
            ]),
            ("口语 Speaking", "Speaking", [
                ("speaking-basic", "基础口语", "Basic speaking", 1, 1, []),
                ("presentation-p", "简单演讲", "Simple presentation", 4, 3, ["speaking-basic"]),
            ]),
            ("阅读 Reading", "Reading", [
                ("phonics", "拼读规则", "Phonics", 1, 1, []),
                ("fluency", "阅读流畅度", "Reading fluency", 3, 2, ["phonics"]),
                ("comprehension-p", "阅读理解", "Comprehension", 5, 3, ["fluency"]),
            ]),
            ("写作 Writing", "Writing", [
                ("handwriting", "书法", "Handwriting", 1, 1, []),
                ("sentence-construct", "句子构造", "Sentence construction", 3, 2, ["handwriting"]),
                ("paragraphs", "段落写作", "Paragraph writing", 5, 3, ["sentence-construct"]),
            ]),
        ]
    ))

    save("cam-primary-math.json", make_tree(
        "cam-primary-math.json", "math", "cam-primary", "p",
        "剑桥小学 · 数学", "Cambridge Primary Mathematics",
        "Cambridge Primary Math: Number, Geometry&Measure, Statistics&Probability, Thinking&Working.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/cambridge-primary-curriculum/",
        [
            ("数与运算 Number", "Number", [
                ("counting", "计数基础", "Counting", 1, 1, []),
                ("place-value", "位值", "Place value", 2, 2, ["counting"]),
                ("addition-subtraction", "加减法", "Addition & subtraction", 2, 2, ["place-value"]),
                ("multiplication-division", "乘除法", "Multiplication & division", 3, 3, ["addition-subtraction"]),
                ("fractions-p", "分数小数", "Fractions & decimals", 4, 3, ["multiplication-division"]),
                ("percentages", "百分比", "Percentages", 6, 4, ["fractions-p"]),
            ]),
            ("几何与测量 Geometry", "Geometry & Measure", [
                ("shapes-p", "图形认识", "Shapes", 1, 1, []),
                ("measurement", "测量", "Measurement", 3, 2, ["shapes-p"]),
                ("area-perimeter", "面积周长", "Area & perimeter", 5, 3, ["measurement"]),
            ]),
            ("统计 Statistics", "Statistics", [
                ("data-handling", "数据处理", "Data handling", 3, 2, []),
                ("prob-p", "概率初步", "Probability", 5, 3, ["data-handling"]),
            ]),
        ]
    ))

    save("cam-primary-science.json", make_tree(
        "cam-primary-science.json", "sci", "cam-primary", "p",
        "剑桥小学 · 科学", "Cambridge Primary Science",
        "Biology, Chemistry, Physics, Earth&Space + Thinking&Working Scientifically.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/cambridge-primary-curriculum/",
        [
            ("生物 Biology", "Biology", [
                ("living-things", "生物与非生物", "Living things", 1, 1, []),
                ("plants-p", "植物", "Plants", 2, 2, ["living-things"]),
                ("animals-p", "动物", "Animals", 2, 2, ["living-things"]),
                ("human-body-p", "人体", "Human body", 4, 3, ["animals-p"]),
            ]),
            ("化学 Chemistry", "Chemistry", [
                ("materials-p", "材料性质", "Materials", 2, 2, []),
                ("states-p", "物质状态", "States", 4, 3, ["materials-p"]),
            ]),
            ("物理 Physics", "Physics", [
                ("forces-p", "力", "Forces", 3, 2, []),
                ("light-sound", "光与声", "Light & sound", 4, 3, []),
                ("electricity-p", "电路", "Electricity", 6, 3, ["forces-p"]),
            ]),
            ("地球太空 Earth & Space", "Earth & Space", [
                ("weather-p", "天气", "Weather", 2, 2, []),
                ("solar-system-p", "太阳系", "Solar system", 5, 3, ["weather-p"]),
            ]),
        ]
    ))

    save("cam-primary-computing.json", make_tree(
        "cam-primary-computing.json", "comp", "cam-primary", "p",
        "剑桥小学 · 计算思维", "Cambridge Primary Computing",
        "Computational thinking, programming, managing data, networks, digital literacy.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/cambridge-primary-curriculum/",
        [
            ("计算思维 Computational Thinking", "Computational Thinking", [
                ("algorithms-p", "算法入门", "Algorithms", 2, 2, []),
                ("debugging-p", "调试", "Debugging", 3, 2, ["algorithms-p"]),
                ("decomposition", "问题分解", "Decomposition", 4, 3, ["algorithms-p"]),
            ]),
            ("编程 Programming", "Programming", [
                ("scratch-p", "Scratch 编程", "Scratch", 3, 2, ["algorithms-p"]),
                ("loops-p", "循环与条件", "Loops & conditions", 4, 3, ["scratch-p"]),
                ("variables-p", "变量", "Variables", 5, 3, ["loops-p"]),
            ]),
            ("数据 Data", "Managing Data", [
                ("data-basics", "数据基础", "Data basics", 3, 2, []),
                ("databases-p", "数据库入门", "Database intro", 5, 3, ["data-basics"]),
            ]),
            ("网络素养 Digital Literacy", "Digital Literacy", [
                ("online-safety", "网络安全", "Online safety", 2, 2, []),
                ("search-p", "搜索技能", "Search skills", 4, 2, ["online-safety"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# Cambridge Lower Secondary (Stages 7-9, G7-G9)
# ------------------------------------------------------------------
def gen_cam_lsec():
    print("\n[Cambridge Lower Secondary] 5 subjects")

    save("cam-lsec-english.json", make_tree(
        "cam-lsec-english.json", "english", "cam-lsec", "ls",
        "剑桥初中 · 英语", "Cambridge Lower Secondary English",
        "Reading, writing, speaking, listening at stages 7-9.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/",
        [
            ("阅读 Reading", "Reading", [
                ("literary-texts", "文学文本", "Literary texts", 7, 3, []),
                ("nonfiction", "非文学文本", "Non-fiction", 7, 3, ["literary-texts"]),
                ("analysis-ls", "文本分析", "Textual analysis", 9, 4, ["literary-texts", "nonfiction"]),
            ]),
            ("写作 Writing", "Writing", [
                ("narrative", "记叙文", "Narrative writing", 7, 3, []),
                ("persuasive", "说服文", "Persuasive writing", 8, 4, ["narrative"]),
                ("analytical-ls", "分析文", "Analytical writing", 9, 4, ["persuasive"]),
            ]),
            ("口语听力 Speaking & Listening", "Speaking & Listening", [
                ("discussion", "讨论辩论", "Discussion", 7, 3, []),
                ("presentation-ls", "演讲", "Presentation", 8, 4, ["discussion"]),
            ]),
        ]
    ))

    save("cam-lsec-math.json", make_tree(
        "cam-lsec-math.json", "math", "cam-lsec", "ls",
        "剑桥初中 · 数学", "Cambridge Lower Secondary Mathematics",
        "Number, Algebra, Geometry&Measure, Statistics&Probability at stages 7-9.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/",
        [
            ("数 Number", "Number", [
                ("integers-ls", "整数运算", "Integer operations", 7, 2, []),
                ("fractions-ls", "分数小数", "Fractions & decimals", 7, 3, ["integers-ls"]),
                ("ratio-proportion", "比例", "Ratio & proportion", 8, 3, ["fractions-ls"]),
            ]),
            ("代数 Algebra", "Algebra", [
                ("algebraic-expr", "代数式", "Algebraic expressions", 7, 3, []),
                ("linear-eq-ls", "一次方程", "Linear equations", 8, 3, ["algebraic-expr"]),
                ("quadratic-ls", "二次式入门", "Quadratics intro", 9, 4, ["linear-eq-ls"]),
                ("inequalities", "不等式", "Inequalities", 9, 3, ["linear-eq-ls"]),
            ]),
            ("几何 Geometry", "Geometry & Measure", [
                ("angles-ls", "角的性质", "Angle properties", 7, 3, []),
                ("transformations", "图形变换", "Transformations", 8, 3, ["angles-ls"]),
                ("pythagoras-ls", "勾股定理", "Pythagoras", 9, 3, ["angles-ls"]),
            ]),
            ("统计 Statistics", "Statistics & Probability", [
                ("stats-ls", "统计量", "Statistics measures", 7, 3, []),
                ("probability-ls", "概率", "Probability", 8, 3, ["stats-ls"]),
            ]),
        ]
    ))

    save("cam-lsec-science.json", make_tree(
        "cam-lsec-science.json", "sci", "cam-lsec", "ls",
        "剑桥初中 · 科学", "Cambridge Lower Secondary Science",
        "Biology, Chemistry, Physics, Earth&Space at stages 7-9.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/",
        [
            ("生物 Biology", "Biology", [
                ("cells-ls", "细胞", "Cells", 7, 3, []),
                ("body-systems-ls", "人体系统", "Body systems", 8, 3, ["cells-ls"]),
                ("ecosystems-ls", "生态系统", "Ecosystems", 9, 3, ["cells-ls"]),
            ]),
            ("化学 Chemistry", "Chemistry", [
                ("atoms-ls", "原子结构", "Atoms", 7, 3, []),
                ("elements-compounds", "元素化合物", "Elements & compounds", 8, 3, ["atoms-ls"]),
                ("reactions-ls", "化学反应", "Reactions", 9, 4, ["elements-compounds"]),
            ]),
            ("物理 Physics", "Physics", [
                ("forces-motion-ls", "力与运动", "Forces & motion", 7, 3, []),
                ("energy-ls", "能量", "Energy", 8, 3, ["forces-motion-ls"]),
                ("electricity-ls", "电路", "Electricity", 9, 4, ["energy-ls"]),
            ]),
            ("地球太空 Earth & Space", "Earth & Space", [
                ("earth-structure", "地球结构", "Earth's structure", 7, 3, []),
                ("universe", "宇宙", "The universe", 9, 4, ["earth-structure"]),
            ]),
        ]
    ))

    save("cam-lsec-humanities.json", make_tree(
        "cam-lsec-humanities.json", "humanities", "cam-lsec", "ls",
        "剑桥初中 · 人文", "Cambridge Lower Secondary Global Perspectives",
        "Global Perspectives: Research, Analysis, Evaluation, Reflection, Collaboration, Communication.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/",
        [
            ("研究技能 Research", "Research Skills", [
                ("source-eval", "信源评估", "Source evaluation", 7, 3, []),
                ("research-methods-ls", "研究方法", "Research methods", 8, 3, ["source-eval"]),
            ]),
            ("全球议题 Global Issues", "Global Issues", [
                ("human-rights", "人权", "Human rights", 7, 3, []),
                ("sustainability-ls", "可持续发展", "Sustainability", 8, 4, ["human-rights"]),
                ("globalisation", "全球化", "Globalisation", 9, 4, ["sustainability-ls"]),
            ]),
            ("协作交流 Collaboration", "Collaboration", [
                ("teamwork", "团队协作", "Teamwork", 7, 3, []),
                ("debate", "辩论", "Debate", 8, 3, ["teamwork"]),
            ]),
        ]
    ))

    save("cam-lsec-ict.json", make_tree(
        "cam-lsec-ict.json", "ict", "cam-lsec", "ls",
        "剑桥初中 · ICT", "Cambridge Lower Secondary ICT Starters",
        "ICT skills: computational thinking, programming, data handling, digital literacy.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/",
        [
            ("编程 Programming", "Programming", [
                ("python-intro", "Python 入门", "Python intro", 7, 3, []),
                ("functions-ls", "函数", "Functions", 8, 4, ["python-intro"]),
                ("data-structures-ls", "数据结构入门", "Data structures", 9, 4, ["functions-ls"]),
            ]),
            ("数据处理 Data", "Data Handling", [
                ("spreadsheets", "电子表格", "Spreadsheets", 7, 2, []),
                ("database-design", "数据库设计", "Database design", 9, 4, ["spreadsheets"]),
            ]),
            ("数字素养 Digital Literacy", "Digital Literacy", [
                ("e-safety", "网络安全", "E-safety", 7, 2, []),
                ("digital-footprint", "数字足迹", "Digital footprint", 8, 3, ["e-safety"]),
            ]),
        ]
    ))





# ------------------------------------------------------------------
# Cambridge IGCSE (G10-G11) — 8 subjects
# ------------------------------------------------------------------
def gen_cam_igcse():
    print("\n[Cambridge IGCSE] 8 subjects")

    save("cam-igcse-math.json", make_tree(
        "cam-igcse-math.json", "math", "cam-igcse", "igcse",
        "剑桥 IGCSE · 数学", "Cambridge IGCSE Mathematics (0580)",
        "Core and Extended: Number, Algebra, Geometry, Mensuration, Trigonometry, Statistics, Probability.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/",
        [
            ("数 Number", "Number", [
                ("number-ops", "数的运算", "Number operations", 10, 2, []),
                ("standard-form", "科学记数法", "Standard form", 10, 3, ["number-ops"]),
                ("indices", "指数法则", "Indices", 10, 3, ["number-ops"]),
            ]),
            ("代数 Algebra", "Algebra", [
                ("linear-expr", "线性代数式", "Linear expressions", 10, 3, []),
                ("quadratic-igcse", "二次方程与函数", "Quadratic functions", 11, 4, ["linear-expr"]),
                ("simultaneous", "联立方程", "Simultaneous equations", 10, 3, ["linear-expr"]),
                ("functions-igcse", "函数概念", "Functions", 11, 4, ["quadratic-igcse"]),
            ]),
            ("几何 Geometry", "Geometry", [
                ("geo-properties", "几何性质", "Geometric properties", 10, 3, []),
                ("transformations-igcse", "图形变换", "Transformations", 10, 3, ["geo-properties"]),
                ("trig-igcse", "三角函数", "Trigonometry", 11, 4, ["geo-properties"]),
            ]),
            ("统计概率 Stats & Prob", "Statistics & Probability", [
                ("stats-igcse", "统计分析", "Statistics", 11, 3, []),
                ("probability-igcse", "概率计算", "Probability", 11, 4, ["stats-igcse"]),
            ]),
        ]
    ))

    save("cam-igcse-physics.json", make_tree(
        "cam-igcse-physics.json", "physics", "cam-igcse", "igcse",
        "剑桥 IGCSE · 物理", "Cambridge IGCSE Physics (0625)",
        "Mechanics, Thermal, Waves, Electricity & Magnetism, Atomic Physics.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-physics-0625/",
        [
            ("力学 Motion & Forces", "Motion & Forces", [
                ("kinematics-igcse", "运动学", "Kinematics", 10, 3, []),
                ("newton-laws", "牛顿定律", "Newton's laws", 10, 4, ["kinematics-igcse"]),
                ("energy-work", "能量与功", "Energy & work", 10, 3, ["newton-laws"]),
                ("pressure-igcse", "压强", "Pressure", 11, 3, ["newton-laws"]),
            ]),
            ("热学 Thermal", "Thermal Physics", [
                ("temperature", "温度与热量", "Temperature & heat", 10, 3, []),
                ("thermal-processes", "热传递", "Heat transfer", 11, 3, ["temperature"]),
            ]),
            ("波动 Waves", "Waves", [
                ("wave-properties", "波的性质", "Wave properties", 10, 3, []),
                ("light-igcse", "光学", "Light", 11, 3, ["wave-properties"]),
                ("sound-igcse", "声学", "Sound", 11, 3, ["wave-properties"]),
            ]),
            ("电磁 Electricity & Magnetism", "Electricity & Magnetism", [
                ("circuits-igcse", "电路", "Circuits", 11, 4, []),
                ("electromagnetism", "电磁感应", "Electromagnetism", 11, 4, ["circuits-igcse"]),
            ]),
            ("原子 Atomic", "Atomic Physics", [
                ("radioactivity", "放射性", "Radioactivity", 11, 4, []),
            ]),
        ]
    ))

    save("cam-igcse-chemistry.json", make_tree(
        "cam-igcse-chemistry.json", "chem", "cam-igcse", "igcse",
        "剑桥 IGCSE · 化学", "Cambridge IGCSE Chemistry (0620)",
        "States of matter, atomic structure, stoichiometry, electrochemistry, chemical energetics, rates, acids, organic.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-chemistry-0620/",
        [
            ("物质结构 Structure", "Structure of Matter", [
                ("atomic-structure", "原子结构", "Atomic structure", 10, 3, []),
                ("periodic-table", "元素周期表", "Periodic table", 10, 3, ["atomic-structure"]),
                ("bonding", "化学键", "Chemical bonding", 10, 4, ["periodic-table"]),
            ]),
            ("化学计量 Stoichiometry", "Stoichiometry", [
                ("mole-concept", "摩尔概念", "Mole concept", 10, 4, ["bonding"]),
                ("chemical-equations", "化学方程式", "Chemical equations", 10, 3, ["mole-concept"]),
            ]),
            ("反应 Reactions", "Chemical Reactions", [
                ("acids-bases", "酸碱盐", "Acids & bases", 11, 3, []),
                ("redox", "氧化还原", "Redox", 11, 4, ["chemical-equations"]),
                ("electrochemistry", "电化学", "Electrochemistry", 11, 4, ["redox"]),
                ("rates", "反应速率", "Rates of reaction", 11, 4, ["chemical-equations"]),
            ]),
            ("有机化学 Organic", "Organic Chemistry", [
                ("hydrocarbons", "烃类", "Hydrocarbons", 11, 4, ["bonding"]),
                ("polymers", "聚合物", "Polymers", 11, 4, ["hydrocarbons"]),
            ]),
        ]
    ))

    save("cam-igcse-biology.json", make_tree(
        "cam-igcse-biology.json", "bio", "cam-igcse", "igcse",
        "剑桥 IGCSE · 生物", "Cambridge IGCSE Biology (0610)",
        "Cells, biological molecules, transport, respiration, photosynthesis, reproduction, genetics, ecology.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-biology-0610/",
        [
            ("细胞分子 Cells", "Cells & Molecules", [
                ("cell-structure", "细胞结构", "Cell structure", 10, 3, []),
                ("biomolecules", "生物分子", "Biomolecules", 10, 3, ["cell-structure"]),
                ("enzymes", "酶", "Enzymes", 10, 4, ["biomolecules"]),
            ]),
            ("生理 Physiology", "Physiology", [
                ("transport-plants", "植物运输", "Plant transport", 10, 3, []),
                ("transport-animals", "动物运输", "Animal transport", 10, 3, ["cell-structure"]),
                ("respiration-igcse", "呼吸作用", "Respiration", 11, 4, ["enzymes"]),
                ("photosynthesis", "光合作用", "Photosynthesis", 11, 4, ["enzymes"]),
            ]),
            ("遗传进化 Genetics", "Genetics & Evolution", [
                ("inheritance", "遗传", "Inheritance", 11, 4, ["cell-structure"]),
                ("evolution-igcse", "进化", "Evolution", 11, 4, ["inheritance"]),
            ]),
            ("生态 Ecology", "Ecology", [
                ("ecosystems-igcse", "生态系统", "Ecosystems", 11, 3, []),
                ("human-impact", "人类影响", "Human impact", 11, 4, ["ecosystems-igcse"]),
            ]),
        ]
    ))

    save("cam-igcse-english.json", make_tree(
        "cam-igcse-english.json", "english", "cam-igcse", "igcse",
        "剑桥 IGCSE · 英语", "Cambridge IGCSE English (First/Second Language)",
        "Reading, writing, speaking, listening.",
        "https://www.cambridgeinternational.org/",
        [
            ("阅读 Reading", "Reading", [
                ("reading-comprehension-igcse", "阅读理解", "Reading comprehension", 10, 3, []),
                ("summary-igcse", "概括总结", "Summary", 10, 3, ["reading-comprehension-igcse"]),
                ("analysis-igcse", "文本分析", "Analysis", 11, 4, ["summary-igcse"]),
            ]),
            ("写作 Writing", "Writing", [
                ("directed-writing", "指定写作", "Directed writing", 10, 3, []),
                ("composition", "作文创作", "Composition", 11, 4, ["directed-writing"]),
            ]),
            ("口语听力 Speaking & Listening", "Speaking & Listening", [
                ("oral-igcse", "口语考试", "Oral exam", 11, 4, []),
            ]),
        ]
    ))

    save("cam-igcse-economics.json", make_tree(
        "cam-igcse-economics.json", "econ", "cam-igcse", "igcse",
        "剑桥 IGCSE · 经济学", "Cambridge IGCSE Economics (0455)",
        "Basic economic problem, allocation, microeconomics, macroeconomics, international trade.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-economics-0455/",
        [
            ("基本概念 Basic Concepts", "Basic Concepts", [
                ("scarcity", "稀缺性", "Scarcity", 10, 2, []),
                ("opportunity-cost", "机会成本", "Opportunity cost", 10, 3, ["scarcity"]),
                ("pps", "生产可能性", "Production possibility", 10, 3, ["opportunity-cost"]),
            ]),
            ("微观 Microeconomics", "Microeconomics", [
                ("ds-igcse", "供需", "Demand & supply", 10, 3, []),
                ("market-eq", "市场均衡", "Market equilibrium", 10, 3, ["ds-igcse"]),
                ("govt-intervention", "政府干预", "Government intervention", 11, 4, ["market-eq"]),
            ]),
            ("宏观 Macroeconomics", "Macroeconomics", [
                ("gdp-igcse", "GDP", "GDP", 11, 3, []),
                ("inflation-igcse", "通货膨胀", "Inflation", 11, 3, ["gdp-igcse"]),
                ("unemployment-igcse", "失业", "Unemployment", 11, 3, ["gdp-igcse"]),
            ]),
            ("国际 International", "International", [
                ("trade-igcse", "国际贸易", "International trade", 11, 4, ["market-eq"]),
                ("balance-payments", "国际收支", "Balance of payments", 11, 4, ["trade-igcse"]),
            ]),
        ]
    ))

    save("cam-igcse-cs.json", make_tree(
        "cam-igcse-cs.json", "cs", "cam-igcse", "igcse",
        "剑桥 IGCSE · 计算机科学", "Cambridge IGCSE Computer Science (0478)",
        "Data representation, networks, hardware/software, algorithms, programming, databases.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-computer-science-0478/",
        [
            ("数据表示 Data", "Data Representation", [
                ("binary-igcse", "二进制", "Binary", 10, 3, []),
                ("hex", "十六进制", "Hexadecimal", 10, 3, ["binary-igcse"]),
                ("text-image-sound", "文本图像声音编码", "Text/image/sound encoding", 10, 4, ["binary-igcse"]),
            ]),
            ("硬件网络 Hardware & Networks", "Hardware & Networks", [
                ("computer-arch", "计算机架构", "Computer architecture", 10, 4, []),
                ("networks-igcse", "计算机网络", "Networks", 11, 4, ["computer-arch"]),
                ("security-igcse", "网络安全", "Cybersecurity", 11, 4, ["networks-igcse"]),
            ]),
            ("算法编程 Algorithms", "Algorithms & Programming", [
                ("algorithms-igcse", "算法设计", "Algorithm design", 10, 4, []),
                ("pseudocode", "伪代码", "Pseudocode", 10, 3, ["algorithms-igcse"]),
                ("programming-igcse", "编程实现", "Programming", 11, 4, ["pseudocode"]),
                ("databases-igcse", "数据库", "Databases", 11, 4, ["programming-igcse"]),
            ]),
        ]
    ))

    save("cam-igcse-global-persp.json", make_tree(
        "cam-igcse-global-persp.json", "gp", "cam-igcse", "igcse",
        "剑桥 IGCSE · 全球视野", "Cambridge IGCSE Global Perspectives (0457)",
        "Research, analysis, evaluation, reflection on global issues.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-global-perspectives-0457/",
        [
            ("研究 Research", "Research", [
                ("source-eval-igcse", "信源评估", "Source evaluation", 10, 3, []),
                ("data-analysis", "数据分析", "Data analysis", 11, 4, ["source-eval-igcse"]),
            ]),
            ("全球议题 Global Issues", "Global Issues", [
                ("climate-igcse", "气候变化", "Climate change", 10, 4, []),
                ("poverty-inequality", "贫困与不平等", "Poverty & inequality", 10, 4, []),
                ("conflict-peace", "冲突与和平", "Conflict & peace", 11, 4, ["poverty-inequality"]),
                ("migration-igcse", "迁徙", "Migration", 11, 4, ["poverty-inequality"]),
            ]),
            ("反思 Reflection", "Reflection", [
                ("perspectives", "多元视角", "Multiple perspectives", 10, 3, []),
                ("team-project", "团队项目", "Team project", 11, 4, ["perspectives"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# Cambridge A-Level (G12-G13) — 4 remaining subjects
# ------------------------------------------------------------------
def gen_cam_al():
    print("\n[Cambridge A-Level] 4 remaining subjects")

    save("cam-al-further-math.json", make_tree(
        "cam-al-further-math.json", "fmath", "cam-al", "al",
        "剑桥 A-Level · 进阶数学", "Cambridge International AS & A Level Further Mathematics (9231)",
        "Further Pure, Further Mechanics, Further Statistics, Further Probability.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-further-mathematics-9231/",
        [
            ("进阶纯数 Further Pure", "Further Pure", [
                ("complex-fmath", "复数进阶", "Complex numbers advanced", 12, 5, []),
                ("matrices-fmath", "矩阵", "Matrices", 12, 5, []),
                ("polar-fmath", "极坐标", "Polar coordinates", 12, 5, ["complex-fmath"]),
                ("de-fmath", "微分方程", "Differential equations", 13, 5, ["matrices-fmath"]),
            ]),
            ("进阶力学 Further Mech", "Further Mechanics", [
                ("momentum-fmath", "动量与冲量", "Momentum & impulse", 12, 4, []),
                ("circular-motion", "圆周运动", "Circular motion", 13, 5, ["momentum-fmath"]),
            ]),
            ("进阶统计 Further Stats", "Further Statistics", [
                ("continuous-rvs", "连续随机变量", "Continuous r.v.s", 12, 4, []),
                ("chi-squared", "卡方检验", "Chi-squared test", 13, 5, ["continuous-rvs"]),
            ]),
        ]
    ))

    save("cam-al-biology.json", make_tree(
        "cam-al-biology.json", "bio", "cam-al", "al",
        "剑桥 A-Level · 生物", "Cambridge International AS & A Level Biology (9700)",
        "Cell structure, biological molecules, enzymes, transport, gas exchange, immunity, genetics, evolution.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-biology-9700/",
        [
            ("细胞分子 Cells", "Cells & Molecules", [
                ("cells-al", "细胞结构", "Cell structure", 12, 4, []),
                ("biomolecules-al", "生物分子", "Biological molecules", 12, 4, ["cells-al"]),
                ("enzymes-al", "酶动力学", "Enzymes", 12, 5, ["biomolecules-al"]),
                ("membranes", "细胞膜", "Cell membranes", 12, 4, ["cells-al"]),
            ]),
            ("生理 Physiology", "Physiology", [
                ("transport-al", "运输系统", "Transport systems", 12, 4, ["cells-al"]),
                ("gas-exchange", "气体交换", "Gas exchange", 12, 4, ["transport-al"]),
                ("disease-immunity", "疾病与免疫", "Disease & immunity", 12, 5, ["transport-al"]),
            ]),
            ("遗传 Genetics", "Genetics & Evolution", [
                ("genetic-control", "基因控制", "Genetic control", 13, 5, ["cells-al"]),
                ("evolution-al", "进化", "Evolution", 13, 5, ["genetic-control"]),
                ("biotechnology", "生物技术", "Biotechnology", 13, 5, ["genetic-control"]),
            ]),
        ]
    ))

    save("cam-al-economics.json", make_tree(
        "cam-al-economics.json", "econ", "cam-al", "al",
        "剑桥 A-Level · 经济学", "Cambridge International AS & A Level Economics (9708)",
        "Basic ideas, price system, government micro, international trade, macroeconomics, government macro.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-economics-9708/",
        [
            ("基础概念 Basic Concepts", "Basic Concepts", [
                ("scarcity-al", "稀缺与选择", "Scarcity & choice", 12, 3, []),
                ("factors-al", "生产要素", "Factors of production", 12, 3, ["scarcity-al"]),
            ]),
            ("微观 Microeconomics", "Microeconomics", [
                ("price-system", "价格机制", "Price system", 12, 4, []),
                ("elasticity-al", "弹性", "Elasticity", 12, 4, ["price-system"]),
                ("market-failure-al", "市场失灵", "Market failure", 12, 5, ["elasticity-al"]),
                ("firms-al", "厂商理论", "Theory of the firm", 13, 5, ["market-failure-al"]),
            ]),
            ("宏观 Macroeconomics", "Macroeconomics", [
                ("ad-as", "总供求", "AD-AS", 12, 4, []),
                ("macro-indicators", "宏观指标", "Macro indicators", 13, 5, ["ad-as"]),
                ("policies-al", "宏观政策", "Macro policies", 13, 5, ["macro-indicators"]),
            ]),
            ("国际 International", "International", [
                ("trade-al", "国际贸易", "International trade", 13, 5, ["price-system"]),
                ("bop-al", "国际收支", "Balance of payments", 13, 5, ["trade-al"]),
            ]),
        ]
    ))

    save("cam-al-english.json", make_tree(
        "cam-al-english.json", "english", "cam-al", "al",
        "剑桥 A-Level · 英语文学", "Cambridge International AS & A Level Literature in English (9695)",
        "Poetry, Prose, Drama, Shakespeare; close reading and critical analysis.",
        "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-literature-in-english-9695/",
        [
            ("诗歌 Poetry", "Poetry", [
                ("poetic-forms", "诗歌形式", "Poetic forms", 12, 4, []),
                ("poetry-analysis", "诗歌分析", "Poetry analysis", 12, 5, ["poetic-forms"]),
            ]),
            ("小说 Prose", "Prose", [
                ("novel-study", "小说研究", "Novel study", 12, 4, []),
                ("narrative-tech", "叙事技巧", "Narrative techniques", 13, 5, ["novel-study"]),
            ]),
            ("戏剧 Drama", "Drama", [
                ("shakespeare-al", "莎士比亚", "Shakespeare", 12, 5, []),
                ("modern-drama", "现代戏剧", "Modern drama", 13, 5, ["shakespeare-al"]),
            ]),
            ("批评理论 Critical Theory", "Critical Theory", [
                ("critical-approaches", "批评方法", "Critical approaches", 13, 5, ["poetry-analysis", "narrative-tech"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# US K-5 (Common Core + NGSS) — 4 subjects
# ------------------------------------------------------------------
def gen_us_k5():
    print("\n[US K-5] 4 subjects (CCSS + NGSS)")

    save("us-k5-ela.json", make_tree(
        "us-k5-ela.json", "ela", "us-k5", "k5",
        "美式 K-5 · 英语语言艺术", "US K-5 · English Language Arts (Common Core)",
        "CCSS ELA strands: Reading Literature, Reading Informational, Foundational Skills, Writing, Speaking & Listening, Language.",
        "https://www.thecorestandards.org/ELA-Literacy/",
        [
            ("阅读基础 Foundational Skills", "Foundational Skills", [
                ("phonics-k5", "拼读规则", "Phonics", 1, 1, []),
                ("fluency-k5", "流畅朗读", "Fluency", 2, 2, ["phonics-k5"]),
                ("print-concepts", "印刷概念", "Print concepts", 1, 1, []),
            ]),
            ("阅读文学 Reading Literature", "Reading Literature", [
                ("story-elements", "故事元素", "Story elements", 2, 2, ["fluency-k5"]),
                ("theme-k5", "主题识别", "Theme", 3, 3, ["story-elements"]),
                ("character-analysis-k5", "人物分析", "Character analysis", 4, 3, ["theme-k5"]),
            ]),
            ("阅读信息 Reading Informational", "Reading Informational", [
                ("main-idea-k5", "中心思想", "Main idea", 2, 2, ["fluency-k5"]),
                ("text-features", "文本特征", "Text features", 3, 2, ["main-idea-k5"]),
                ("text-evidence-k5", "文本证据", "Text evidence", 5, 3, ["main-idea-k5"]),
            ]),
            ("写作 Writing", "Writing", [
                ("narrative-k5", "记叙文", "Narrative", 3, 2, []),
                ("opinion-k5", "观点文", "Opinion writing", 4, 3, ["narrative-k5"]),
                ("informative-k5", "说明文", "Informative writing", 4, 3, ["narrative-k5"]),
            ]),
            ("语言规范 Language", "Language", [
                ("grammar-k5", "语法规范", "Grammar", 2, 2, []),
                ("vocabulary-k5", "词汇扩充", "Vocabulary", 3, 2, ["grammar-k5"]),
            ]),
        ]
    ))

    save("us-k5-math.json", make_tree(
        "us-k5-math.json", "math", "us-k5", "k5",
        "美式 K-5 · 数学 (Common Core)", "US K-5 · Math (Common Core)",
        "CCSS Math: Counting, Operations & Algebraic Thinking, Number & Operations in Base Ten, Fractions, Measurement, Geometry.",
        "https://www.thecorestandards.org/Math/",
        [
            ("计数与运算 Counting & Operations", "Counting & Operations", [
                ("counting-k5", "数数", "Counting", 1, 1, []),
                ("addition-k5", "加法", "Addition", 1, 2, ["counting-k5"]),
                ("subtraction-k5", "减法", "Subtraction", 1, 2, ["addition-k5"]),
                ("multiplication-k5", "乘法", "Multiplication", 3, 3, ["addition-k5"]),
                ("division-k5", "除法", "Division", 3, 3, ["multiplication-k5"]),
            ]),
            ("位值系统 Base Ten", "Number & Operations in Base Ten", [
                ("place-value-k5", "位值", "Place value", 2, 2, ["counting-k5"]),
                ("multi-digit", "多位数运算", "Multi-digit operations", 4, 3, ["place-value-k5", "multiplication-k5"]),
            ]),
            ("分数 Fractions", "Fractions", [
                ("fractions-intro", "分数入门", "Fractions intro", 3, 3, []),
                ("fraction-ops", "分数运算", "Fraction operations", 5, 4, ["fractions-intro"]),
            ]),
            ("测量几何 Measurement & Geometry", "Measurement & Geometry", [
                ("measurement-k5", "长度时间容量", "Measurement basics", 1, 2, []),
                ("geo-shapes-k5", "几何图形", "Geometric shapes", 2, 2, []),
                ("area-volume-k5", "面积体积", "Area & volume", 5, 3, ["geo-shapes-k5", "multiplication-k5"]),
            ]),
        ]
    ))

    save("us-k5-science.json", make_tree(
        "us-k5-science.json", "sci", "us-k5", "k5",
        "美式 K-5 · 科学 (NGSS)", "US K-5 · Science (Next Generation Science Standards)",
        "NGSS disciplinary core ideas: Physical Sciences, Life Sciences, Earth & Space Sciences, Engineering Design.",
        "https://www.nextgenscience.org/",
        [
            ("物理科学 Physical Sciences", "Physical Sciences", [
                ("motion-k5", "运动", "Motion", 2, 2, []),
                ("forces-k5", "力", "Forces", 3, 2, ["motion-k5"]),
                ("energy-k5", "能量", "Energy", 4, 3, ["forces-k5"]),
                ("waves-k5", "波", "Waves", 4, 3, ["energy-k5"]),
            ]),
            ("生命科学 Life Sciences", "Life Sciences", [
                ("organisms-k5", "生物", "Organisms", 1, 1, []),
                ("ecosystems-k5", "生态系统", "Ecosystems", 3, 3, ["organisms-k5"]),
                ("heredity-k5", "遗传", "Heredity & traits", 3, 3, ["organisms-k5"]),
                ("evolution-k5", "进化入门", "Evolution basics", 5, 4, ["heredity-k5"]),
            ]),
            ("地球空间 Earth & Space", "Earth & Space Sciences", [
                ("weather-climate-k5", "天气与气候", "Weather & climate", 3, 2, []),
                ("solar-system-k5", "太阳系", "Solar system", 5, 3, []),
                ("earth-systems-k5", "地球系统", "Earth systems", 4, 3, ["weather-climate-k5"]),
            ]),
            ("工程设计 Engineering", "Engineering Design", [
                ("eng-design-k5", "工程设计流程", "Engineering design process", 3, 3, []),
            ]),
        ]
    ))

    save("us-k5-social-studies.json", make_tree(
        "us-k5-social-studies.json", "soc", "us-k5", "k5",
        "美式 K-5 · 社会学", "US K-5 · Social Studies (NCSS)",
        "NCSS C3 Framework: Civics, Economics, Geography, History themes.",
        "https://www.socialstudies.org/standards",
        [
            ("历史 History", "History", [
                ("personal-history-k5", "个人历史", "Personal history", 1, 1, []),
                ("local-history-k5", "地方历史", "Local history", 3, 2, ["personal-history-k5"]),
                ("us-history-k5", "美国历史概览", "US history overview", 5, 3, ["local-history-k5"]),
            ]),
            ("地理 Geography", "Geography", [
                ("maps-k5", "地图", "Maps", 2, 2, []),
                ("regions-k5", "区域地理", "Regions", 4, 3, ["maps-k5"]),
            ]),
            ("公民 Civics", "Civics", [
                ("community-k5", "社区与规则", "Community & rules", 2, 2, []),
                ("government-k5", "政府三权", "Branches of government", 5, 3, ["community-k5"]),
            ]),
            ("经济 Economics", "Economics", [
                ("needs-wants-k5", "需求与想要", "Needs & wants", 2, 2, []),
                ("producers-consumers", "生产者与消费者", "Producers & consumers", 3, 2, ["needs-wants-k5"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# US Middle School (G6-G8) — 4 subjects
# ------------------------------------------------------------------
def gen_us_ms():
    print("\n[US MS] 4 subjects (G6-G8)")

    save("us-ms-ela.json", make_tree(
        "us-ms-ela.json", "ela", "us-ms", "ms",
        "美式初中 · 英语语言艺术", "US Middle School · ELA (Common Core)",
        "CCSS 6-8 ELA: Reading, Writing, Speaking & Listening, Language standards.",
        "https://www.thecorestandards.org/ELA-Literacy/",
        [
            ("阅读 Reading", "Reading", [
                ("close-reading-ms", "精读", "Close reading", 6, 3, []),
                ("analyze-text", "文本分析", "Text analysis", 7, 4, ["close-reading-ms"]),
                ("author-purpose", "作者意图", "Author's purpose", 8, 4, ["analyze-text"]),
            ]),
            ("写作 Writing", "Writing", [
                ("argument-ms", "论证文", "Argumentative", 6, 4, []),
                ("research-ms", "研究论文", "Research paper", 7, 4, ["argument-ms"]),
                ("narrative-ms", "叙事文", "Narrative", 6, 3, []),
            ]),
            ("口语听力 Speaking & Listening", "Speaking & Listening", [
                ("discussion-ms", "小组讨论", "Group discussion", 6, 3, []),
                ("presentation-ms", "多媒体演讲", "Multimedia presentation", 8, 4, ["discussion-ms"]),
            ]),
            ("语言 Language", "Language", [
                ("grammar-ms", "语法", "Grammar", 6, 3, []),
                ("vocabulary-ms", "学术词汇", "Academic vocabulary", 7, 3, ["grammar-ms"]),
            ]),
        ]
    ))

    save("us-ms-math.json", make_tree(
        "us-ms-math.json", "math", "us-ms", "ms",
        "美式初中 · 数学", "US Middle School · Math (Common Core 6-8)",
        "CCSS 6-8: Ratios & Proportional Relationships, Number System, Expressions & Equations, Geometry, Statistics & Probability, Functions.",
        "https://www.thecorestandards.org/Math/",
        [
            ("比例 Ratios", "Ratios & Proportions", [
                ("ratio-ms", "比率与比例", "Ratio & proportion", 6, 3, []),
                ("percent-ms", "百分比应用", "Percent applications", 7, 3, ["ratio-ms"]),
            ]),
            ("数系 Number System", "Number System", [
                ("rational-nums", "有理数", "Rational numbers", 6, 3, []),
                ("irrational-nums", "无理数入门", "Irrational numbers intro", 8, 4, ["rational-nums"]),
            ]),
            ("代数 Expressions & Equations", "Expressions & Equations", [
                ("expressions-ms", "代数表达式", "Expressions", 6, 3, []),
                ("linear-eq-ms", "一次方程", "Linear equations", 7, 4, ["expressions-ms"]),
                ("systems-ms", "方程组", "Systems of equations", 8, 4, ["linear-eq-ms"]),
            ]),
            ("函数 Functions", "Functions", [
                ("functions-ms", "函数入门", "Functions intro", 8, 4, ["linear-eq-ms"]),
            ]),
            ("几何 Geometry", "Geometry", [
                ("angles-ms", "角与三角形", "Angles & triangles", 7, 3, []),
                ("pythagoras-ms", "勾股定理", "Pythagorean theorem", 8, 4, ["angles-ms"]),
                ("volume-ms", "体积", "Volume", 7, 3, []),
            ]),
            ("统计 Statistics", "Statistics & Probability", [
                ("stats-ms", "统计分布", "Statistical distributions", 6, 3, []),
                ("probability-ms", "概率", "Probability", 7, 3, ["stats-ms"]),
            ]),
        ]
    ))

    save("us-ms-science.json", make_tree(
        "us-ms-science.json", "sci", "us-ms", "ms",
        "美式初中 · 科学 (NGSS)", "US Middle School · Science (NGSS 6-8)",
        "NGSS Middle School: Physical, Life, Earth & Space, Engineering disciplines.",
        "https://www.nextgenscience.org/",
        [
            ("物理科学 Physical Sciences", "Physical Sciences", [
                ("matter-ms", "物质与相互作用", "Matter & interactions", 6, 3, []),
                ("motion-forces-ms", "运动与力", "Motion & forces", 7, 4, ["matter-ms"]),
                ("energy-ms", "能量", "Energy", 7, 4, ["motion-forces-ms"]),
                ("waves-ms", "波与信息", "Waves & information", 8, 4, ["energy-ms"]),
            ]),
            ("生命科学 Life Sciences", "Life Sciences", [
                ("cells-ms", "细胞与系统", "Cells & systems", 6, 3, []),
                ("genetics-ms", "遗传与生殖", "Genetics & reproduction", 7, 4, ["cells-ms"]),
                ("ecology-ms", "生态动态", "Ecology dynamics", 7, 4, ["cells-ms"]),
                ("evolution-ms", "进化证据", "Evolution evidence", 8, 4, ["genetics-ms"]),
            ]),
            ("地球空间 Earth & Space", "Earth & Space", [
                ("earth-space-ms", "地球太空", "Earth & space", 6, 3, []),
                ("earth-systems-ms", "地球系统", "Earth systems", 7, 3, ["earth-space-ms"]),
                ("human-impact-ms", "人类活动影响", "Human impacts", 8, 4, ["earth-systems-ms"]),
            ]),
            ("工程 Engineering", "Engineering", [
                ("eng-design-ms", "工程设计", "Engineering design", 6, 3, []),
            ]),
        ]
    ))

    save("us-ms-social-studies.json", make_tree(
        "us-ms-social-studies.json", "soc", "us-ms", "ms",
        "美式初中 · 社会学", "US Middle School · Social Studies",
        "World history, geography, civics, economics; C3 Framework.",
        "https://www.socialstudies.org/standards",
        [
            ("世界历史 World History", "World History", [
                ("ancient-civ-ms", "古代文明", "Ancient civilizations", 6, 3, []),
                ("medieval-ms", "中世纪", "Medieval world", 7, 4, ["ancient-civ-ms"]),
                ("modern-world-ms", "近现代世界", "Modern world", 8, 4, ["medieval-ms"]),
            ]),
            ("地理 Geography", "Geography", [
                ("world-regions", "世界区域", "World regions", 6, 3, []),
                ("human-env-ms", "人与环境", "Human-environment", 7, 3, ["world-regions"]),
            ]),
            ("公民 Civics", "Civics", [
                ("constitution-ms", "宪法基础", "Constitution basics", 7, 4, []),
                ("govt-structure-ms", "政府结构", "Government structure", 8, 4, ["constitution-ms"]),
            ]),
            ("经济 Economics", "Economics", [
                ("markets-ms", "市场经济", "Market economics", 7, 3, []),
                ("global-econ-ms", "全球经济", "Global economy", 8, 4, ["markets-ms"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# US High School (G9-G12) — 9 subjects
# ------------------------------------------------------------------
def gen_us_hs():
    print("\n[US HS] 9 subjects (G9-G12)")

    save("us-hs-ela.json", make_tree(
        "us-hs-ela.json", "ela", "us-hs", "hs",
        "美式高中 · 英语语言艺术", "US High School · ELA (Common Core 9-12)",
        "CCSS 9-12 ELA: advanced reading of literature & informational texts, rhetorical analysis, research writing.",
        "https://www.thecorestandards.org/ELA-Literacy/",
        [
            ("文学阅读 Literature", "Reading Literature", [
                ("literary-analysis-hs", "文学分析", "Literary analysis", 9, 4, []),
                ("american-lit", "美国文学", "American literature", 11, 4, ["literary-analysis-hs"]),
                ("world-lit", "世界文学", "World literature", 10, 4, ["literary-analysis-hs"]),
            ]),
            ("信息文本 Informational", "Informational Texts", [
                ("rhetorical-analysis", "修辞分析", "Rhetorical analysis", 10, 4, []),
                ("synthesis", "文本综合", "Synthesis", 11, 5, ["rhetorical-analysis"]),
            ]),
            ("写作 Writing", "Writing", [
                ("argument-hs", "论证写作", "Argument writing", 9, 4, []),
                ("research-hs", "研究论文", "Research paper", 11, 5, ["argument-hs"]),
                ("narrative-hs", "叙事写作", "Narrative writing", 9, 3, []),
            ]),
            ("语言 Language", "Language", [
                ("grammar-hs", "高级语法", "Advanced grammar", 9, 3, []),
                ("vocabulary-hs", "高阶词汇", "Advanced vocabulary", 10, 4, ["grammar-hs"]),
            ]),
        ]
    ))

    save("us-hs-algebra.json", make_tree(
        "us-hs-algebra.json", "math", "us-hs", "algebra",
        "美式高中 · 代数 I / II", "US High School · Algebra I & II",
        "CCSS High School Algebra: Seeing Structure in Expressions, Arithmetic with Polynomials, Creating Equations, Reasoning with Equations.",
        "https://www.thecorestandards.org/Math/",
        [
            ("线性 Linear", "Linear Functions", [
                ("linear-hs", "一次函数", "Linear functions", 9, 3, []),
                ("linear-systems-hs", "方程组", "Linear systems", 9, 4, ["linear-hs"]),
            ]),
            ("二次 Quadratic", "Quadratic", [
                ("factoring-hs", "因式分解", "Factoring", 9, 4, ["linear-hs"]),
                ("quadratic-hs", "二次方程", "Quadratic equations", 10, 4, ["factoring-hs"]),
                ("complex-nums-hs", "复数入门", "Complex numbers intro", 11, 4, ["quadratic-hs"]),
            ]),
            ("多项式 Polynomials", "Polynomials", [
                ("polynomials-hs", "多项式运算", "Polynomial operations", 10, 4, ["factoring-hs"]),
                ("rational-fns", "有理函数", "Rational functions", 11, 5, ["polynomials-hs"]),
            ]),
            ("指数对数 Exp & Log", "Exponential & Logarithmic", [
                ("exp-fns-hs", "指数函数", "Exponential functions", 10, 4, ["linear-hs"]),
                ("log-fns-hs", "对数函数", "Logarithmic functions", 11, 5, ["exp-fns-hs"]),
            ]),
            ("数列 Sequences", "Sequences & Series", [
                ("seq-series-hs", "等差等比数列", "Arithmetic & geometric", 11, 4, ["linear-hs"]),
            ]),
        ]
    ))

    save("us-hs-geometry.json", make_tree(
        "us-hs-geometry.json", "math", "us-hs", "geom",
        "美式高中 · 几何", "US High School · Geometry",
        "CCSS Geometry: Congruence, Similarity, Right Triangles, Circles, Coordinate Geometry, Geometric Measurement, Modeling.",
        "https://www.thecorestandards.org/Math/",
        [
            ("全等相似 Congruence & Similarity", "Congruence & Similarity", [
                ("congruence-hs", "全等", "Congruence", 10, 3, []),
                ("similarity-hs", "相似", "Similarity", 10, 4, ["congruence-hs"]),
                ("transformations-hs", "几何变换", "Transformations", 10, 4, ["congruence-hs"]),
            ]),
            ("三角 Right Triangles", "Right Triangles & Trig", [
                ("pythagoras-hs", "勾股定理", "Pythagoras", 10, 3, []),
                ("right-triangle-trig", "直角三角形三角", "Right triangle trig", 10, 4, ["pythagoras-hs"]),
            ]),
            ("圆 Circles", "Circles", [
                ("circles-hs", "圆的性质", "Circle theorems", 10, 4, ["congruence-hs"]),
                ("circle-eq", "圆的方程", "Circle equations", 11, 4, ["circles-hs"]),
            ]),
            ("立体几何 Solid Geometry", "Solid Geometry", [
                ("volume-hs", "体积公式", "Volume formulas", 10, 3, []),
            ]),
            ("坐标几何 Coordinate", "Coordinate Geometry", [
                ("coord-geo-hs", "解析几何", "Coordinate geometry", 11, 4, ["circle-eq"]),
            ]),
        ]
    ))

    save("us-hs-precalc.json", make_tree(
        "us-hs-precalc.json", "math", "us-hs", "precalc",
        "美式高中 · 微积分预备", "US High School · Pre-Calculus",
        "Functions, trigonometry, vectors, matrices, conics; preparation for calculus.",
        "https://www.thecorestandards.org/Math/",
        [
            ("函数高级 Advanced Functions", "Advanced Functions", [
                ("fn-analysis", "函数分析", "Function analysis", 11, 4, []),
                ("inverse-fns", "反函数", "Inverse functions", 11, 4, ["fn-analysis"]),
                ("composition-fns", "复合函数", "Composition of functions", 11, 4, ["fn-analysis"]),
            ]),
            ("三角 Trigonometry", "Trigonometry", [
                ("unit-circle", "单位圆", "Unit circle", 11, 4, []),
                ("trig-identities", "三角恒等式", "Trig identities", 12, 5, ["unit-circle"]),
                ("trig-equations", "三角方程", "Trig equations", 12, 5, ["trig-identities"]),
            ]),
            ("向量矩阵 Vectors & Matrices", "Vectors & Matrices", [
                ("vectors-precalc", "向量", "Vectors", 12, 4, []),
                ("matrices-precalc", "矩阵", "Matrices", 12, 5, ["vectors-precalc"]),
            ]),
            ("极限入门 Limits", "Limits Introduction", [
                ("limits-intro", "极限入门", "Limits intro", 12, 5, ["fn-analysis"]),
            ]),
            ("圆锥曲线 Conics", "Conic Sections", [
                ("conics-precalc", "圆锥曲线", "Conic sections", 12, 5, ["fn-analysis"]),
            ]),
        ]
    ))

    save("us-hs-biology.json", make_tree(
        "us-hs-biology.json", "bio", "us-hs", "hs",
        "美式高中 · 生物", "US High School · Biology (NGSS)",
        "NGSS HS Biology: Structure & Function, Matter & Energy in Organisms, Interdependent Relationships, Inheritance, Natural Selection.",
        "https://www.nextgenscience.org/",
        [
            ("细胞分子 Cells & Molecules", "Cells & Molecules", [
                ("cells-hs-bio", "细胞结构", "Cell structure", 9, 4, []),
                ("biomolecules-hs", "生物大分子", "Biological molecules", 10, 4, ["cells-hs-bio"]),
                ("cell-processes", "细胞过程", "Cell processes", 10, 4, ["biomolecules-hs"]),
            ]),
            ("遗传 Genetics", "Genetics", [
                ("dna-hs", "DNA 与基因", "DNA & genes", 10, 4, ["cells-hs-bio"]),
                ("inheritance-hs", "遗传规律", "Inheritance", 10, 4, ["dna-hs"]),
                ("biotech-hs", "生物技术", "Biotechnology", 11, 5, ["inheritance-hs"]),
            ]),
            ("进化生态 Evolution & Ecology", "Evolution & Ecology", [
                ("natural-selection", "自然选择", "Natural selection", 10, 4, ["dna-hs"]),
                ("evidence-evolution", "进化证据", "Evidence of evolution", 11, 4, ["natural-selection"]),
                ("ecology-hs", "生态系统动力学", "Ecosystem dynamics", 11, 4, []),
            ]),
        ]
    ))

    save("us-hs-chemistry.json", make_tree(
        "us-hs-chemistry.json", "chem", "us-hs", "hs",
        "美式高中 · 化学", "US High School · Chemistry (NGSS)",
        "Matter & interactions, chemical reactions, energy, electrochemistry.",
        "https://www.nextgenscience.org/",
        [
            ("物质结构 Matter", "Structure of Matter", [
                ("atomic-theory-hs", "原子理论", "Atomic theory", 10, 4, []),
                ("periodic-hs", "周期表", "Periodic table", 10, 4, ["atomic-theory-hs"]),
                ("bonding-hs", "化学键", "Chemical bonding", 10, 4, ["periodic-hs"]),
            ]),
            ("反应 Reactions", "Chemical Reactions", [
                ("stoichiometry-hs", "化学计量", "Stoichiometry", 11, 5, ["bonding-hs"]),
                ("thermo-hs", "热化学", "Thermochemistry", 11, 5, ["stoichiometry-hs"]),
                ("kinetics-hs", "反应速率", "Kinetics", 11, 5, ["stoichiometry-hs"]),
                ("equilibrium-hs", "化学平衡", "Equilibrium", 11, 5, ["kinetics-hs"]),
            ]),
            ("溶液电化学 Solutions & Electrochem", "Solutions & Electrochemistry", [
                ("acids-bases-hs", "酸碱", "Acids & bases", 11, 5, []),
                ("electrochem-hs", "电化学", "Electrochemistry", 12, 5, ["acids-bases-hs"]),
            ]),
        ]
    ))

    save("us-hs-physics.json", make_tree(
        "us-hs-physics.json", "phys", "us-hs", "hs",
        "美式高中 · 物理", "US High School · Physics (NGSS)",
        "Mechanics, waves, electricity, magnetism, modern physics.",
        "https://www.nextgenscience.org/",
        [
            ("力学 Mechanics", "Mechanics", [
                ("kinematics-hs", "运动学", "Kinematics", 11, 4, []),
                ("dynamics-hs", "动力学", "Dynamics", 11, 5, ["kinematics-hs"]),
                ("energy-momentum-hs", "能量与动量", "Energy & momentum", 11, 5, ["dynamics-hs"]),
                ("rotation-hs", "转动", "Rotational motion", 12, 5, ["dynamics-hs"]),
            ]),
            ("波电磁 Waves & EM", "Waves & Electromagnetism", [
                ("waves-hs", "机械波", "Mechanical waves", 12, 4, []),
                ("em-waves-hs", "电磁波", "EM waves", 12, 5, ["waves-hs"]),
                ("circuits-hs", "电路", "Circuits", 12, 5, []),
            ]),
            ("现代物理 Modern", "Modern Physics", [
                ("modern-physics-hs", "现代物理入门", "Modern physics intro", 12, 5, ["em-waves-hs"]),
            ]),
        ]
    ))

    save("us-hs-us-history.json", make_tree(
        "us-hs-us-history.json", "hist", "us-hs", "ush",
        "美式高中 · 美国历史", "US High School · US History",
        "Colonial America to present; political, economic, social developments.",
        "https://www.socialstudies.org/standards",
        [
            ("殖民与建国 Colonial & Founding", "Colonial & Founding", [
                ("colonial", "殖民时期", "Colonial era", 11, 4, []),
                ("revolution", "独立革命", "Revolution", 11, 4, ["colonial"]),
                ("constitution", "立宪", "Constitution", 11, 5, ["revolution"]),
            ]),
            ("19世纪 19th Century", "19th Century", [
                ("civil-war", "南北战争", "Civil War", 11, 4, ["constitution"]),
                ("reconstruction", "重建时期", "Reconstruction", 11, 4, ["civil-war"]),
                ("industrialization", "工业化", "Industrialization", 11, 4, ["reconstruction"]),
            ]),
            ("20世纪 20th Century", "20th Century", [
                ("progressive-era", "进步时代", "Progressive era", 11, 4, ["industrialization"]),
                ("world-wars", "两次世界大战", "World wars", 11, 4, ["progressive-era"]),
                ("cold-war-us", "冷战", "Cold War", 11, 5, ["world-wars"]),
                ("civil-rights", "民权运动", "Civil rights movement", 11, 5, ["cold-war-us"]),
            ]),
            ("当代 Contemporary", "Contemporary", [
                ("contemporary-us", "当代美国", "Contemporary US", 11, 5, ["civil-rights"]),
            ]),
        ]
    ))

    save("us-hs-world-history.json", make_tree(
        "us-hs-world-history.json", "hist", "us-hs", "wh",
        "美式高中 · 世界历史", "US High School · World History",
        "Ancient civilizations to modern globalization.",
        "https://www.socialstudies.org/standards",
        [
            ("古代 Ancient", "Ancient World", [
                ("ancient-mesop", "两河流域", "Mesopotamia", 10, 4, []),
                ("ancient-egypt", "古埃及", "Ancient Egypt", 10, 4, []),
                ("classical-gr-rome", "希腊罗马", "Greek & Roman", 10, 4, ["ancient-egypt"]),
                ("asian-civs", "亚洲古文明", "Asian civilizations", 10, 4, []),
            ]),
            ("中世纪 Medieval", "Medieval", [
                ("medieval-europe", "中世纪欧洲", "Medieval Europe", 10, 4, ["classical-gr-rome"]),
                ("islamic-world", "伊斯兰世界", "Islamic world", 10, 4, ["classical-gr-rome"]),
            ]),
            ("近代 Early Modern", "Early Modern", [
                ("renaissance", "文艺复兴", "Renaissance", 10, 4, ["medieval-europe"]),
                ("age-exploration", "地理大发现", "Age of exploration", 10, 4, ["renaissance"]),
                ("revolutions-wh", "革命时代", "Age of revolutions", 10, 5, ["age-exploration"]),
            ]),
            ("现代 Modern", "Modern", [
                ("imperialism-wh", "帝国主义", "Imperialism", 10, 5, ["revolutions-wh"]),
                ("world-wars-wh", "两次世界大战", "World wars", 10, 5, ["imperialism-wh"]),
                ("globalization-wh", "全球化", "Globalization", 10, 5, ["world-wars-wh"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# AP (Advanced Placement) — 5 remaining subjects
# Note: ap-calculus, ap-physics-1, ap-chemistry, ap-biology already exist.
# ------------------------------------------------------------------
def gen_ap():
    print("\n[AP] 5 remaining subjects")

    save("ap-calculus-ab.json", make_tree(
        "ap-calculus-ab.json", "math", "ap", "cab",
        "AP 微积分 AB", "AP Calculus AB",
        "CED: Limits, Differentiation, Applications of Derivatives, Integration, Applications of Integrals.",
        "https://apcentral.collegeboard.org/courses/ap-calculus-ab",
        [
            ("极限 Limits", "Limits & Continuity", [
                ("limits-ab", "极限", "Limits", 11, 4, []),
                ("continuity-ab", "连续性", "Continuity", 11, 4, ["limits-ab"]),
            ]),
            ("导数 Derivatives", "Derivatives", [
                ("derivative-def", "导数定义", "Derivative definition", 11, 4, ["limits-ab"]),
                ("diff-rules", "求导法则", "Differentiation rules", 11, 4, ["derivative-def"]),
                ("implicit-diff", "隐函数求导", "Implicit differentiation", 12, 5, ["diff-rules"]),
                ("app-derivatives", "导数应用", "Applications of derivatives", 12, 5, ["diff-rules"]),
            ]),
            ("积分 Integrals", "Integrals", [
                ("indef-integral", "不定积分", "Indefinite integrals", 12, 4, ["diff-rules"]),
                ("def-integral", "定积分", "Definite integrals", 12, 5, ["indef-integral"]),
                ("ftc", "微积分基本定理", "Fundamental theorem", 12, 5, ["def-integral"]),
                ("app-integrals", "积分应用", "Applications of integrals", 12, 5, ["ftc"]),
            ]),
            ("微分方程 DE", "Differential Equations", [
                ("sep-variables", "分离变量法", "Separation of variables", 12, 5, ["ftc"]),
            ]),
        ]
    ))

    save("ap-physics-c.json", make_tree(
        "ap-physics-c.json", "phys", "ap", "pc",
        "AP 物理 C", "AP Physics C (Mechanics + E&M)",
        "Calculus-based physics: Mechanics (kinematics, Newton's laws, energy, momentum, rotation) + Electricity & Magnetism.",
        "https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics",
        [
            ("运动学 Kinematics", "Kinematics", [
                ("kin-calc", "运动学（微积分）", "Kinematics with calculus", 12, 5, []),
            ]),
            ("牛顿力学 Newton", "Newton's Laws", [
                ("newton-c", "牛顿定律", "Newton's laws (C)", 12, 5, ["kin-calc"]),
                ("work-energy-c", "功与能", "Work & energy", 12, 5, ["newton-c"]),
                ("momentum-c", "动量", "Momentum", 12, 5, ["newton-c"]),
            ]),
            ("转动 Rotation", "Rotational Motion", [
                ("rotation-c", "转动力学", "Rotational dynamics", 12, 5, ["newton-c"]),
                ("angular-momentum-c", "角动量", "Angular momentum", 12, 5, ["rotation-c"]),
            ]),
            ("静电 Electrostatics", "Electrostatics", [
                ("coulomb", "库仑定律", "Coulomb's law", 12, 5, []),
                ("electric-field", "电场", "Electric field", 12, 5, ["coulomb"]),
                ("gauss-law", "高斯定律", "Gauss's law", 12, 5, ["electric-field"]),
                ("potential-c", "电势", "Electric potential", 12, 5, ["gauss-law"]),
            ]),
            ("电路 Circuits", "Circuits", [
                ("dc-circuits", "直流电路", "DC circuits", 12, 5, ["potential-c"]),
                ("rc-circuits", "RC 电路", "RC circuits", 12, 5, ["dc-circuits"]),
            ]),
            ("磁场 Magnetism", "Magnetism", [
                ("magnetic-field-c", "磁场", "Magnetic field", 12, 5, ["electric-field"]),
                ("ampere-law", "安培定律", "Ampere's law", 12, 5, ["magnetic-field-c"]),
                ("faraday-law", "法拉第定律", "Faraday's law", 12, 5, ["ampere-law"]),
            ]),
        ]
    ))

    save("ap-cs.json", make_tree(
        "ap-cs.json", "cs", "ap", "cs",
        "AP 计算机科学 A", "AP Computer Science A",
        "Java programming: primitive types, objects, boolean, iteration, classes, arrays, ArrayList, 2D arrays, inheritance, recursion.",
        "https://apcentral.collegeboard.org/courses/ap-computer-science-a",
        [
            ("基础 Primitives", "Primitives & Control", [
                ("primitives", "基本数据类型", "Primitive types", 11, 3, []),
                ("operators", "运算符", "Operators", 11, 3, ["primitives"]),
                ("control-flow", "控制流程", "Control flow", 11, 4, ["operators"]),
                ("iteration", "循环", "Iteration", 11, 4, ["control-flow"]),
            ]),
            ("对象 OOP", "Object-Oriented Programming", [
                ("objects", "对象与类", "Objects & classes", 11, 4, ["control-flow"]),
                ("methods", "方法", "Methods", 11, 4, ["objects"]),
                ("inheritance-cs", "继承", "Inheritance", 12, 5, ["objects"]),
                ("polymorphism", "多态", "Polymorphism", 12, 5, ["inheritance-cs"]),
            ]),
            ("数据结构 Data Structures", "Data Structures", [
                ("arrays-cs", "数组", "Arrays", 11, 4, ["iteration"]),
                ("arraylist", "ArrayList", "ArrayList", 12, 4, ["arrays-cs"]),
                ("2d-arrays", "二维数组", "2D arrays", 12, 5, ["arrays-cs"]),
            ]),
            ("递归 Recursion", "Recursion", [
                ("recursion-cs", "递归", "Recursion", 12, 5, ["methods"]),
            ]),
        ]
    ))

    save("ap-us-history.json", make_tree(
        "ap-us-history.json", "hist", "ap", "ush",
        "AP 美国历史", "AP US History (APUSH)",
        "9 periods from pre-Columbian to present, thematic learning objectives.",
        "https://apcentral.collegeboard.org/courses/ap-united-states-history",
        [
            ("早期美国 Early America", "Early America 1491-1800", [
                ("pre-columbian", "前哥伦布时期", "Pre-Columbian", 11, 4, []),
                ("colonial-ap", "殖民地时代", "Colonial period", 11, 4, ["pre-columbian"]),
                ("founding-ap", "建国时期", "Founding era", 11, 5, ["colonial-ap"]),
            ]),
            ("19世纪 19th Century", "19th Century 1800-1898", [
                ("antebellum", "内战前时期", "Antebellum era", 11, 5, ["founding-ap"]),
                ("civil-war-ap", "内战与重建", "Civil War & Reconstruction", 11, 5, ["antebellum"]),
                ("gilded-age", "镀金时代", "Gilded Age", 11, 5, ["civil-war-ap"]),
            ]),
            ("20世纪 20th Century", "20th Century 1898-1980", [
                ("progressive-ap", "进步时代", "Progressive era", 11, 5, ["gilded-age"]),
                ("world-wars-ap", "两次世界大战", "World wars", 11, 5, ["progressive-ap"]),
                ("cold-war-ap", "冷战时期", "Cold War", 11, 5, ["world-wars-ap"]),
                ("civil-rights-ap", "民权运动", "Civil rights era", 11, 5, ["cold-war-ap"]),
            ]),
            ("当代 Contemporary", "Contemporary 1980-Present", [
                ("modern-us", "现代美国", "Modern America", 11, 5, ["civil-rights-ap"]),
            ]),
        ]
    ))

    save("ap-english.json", make_tree(
        "ap-english.json", "ela", "ap", "englang",
        "AP 英语语言与写作", "AP English Language & Composition",
        "Rhetorical analysis, argument, synthesis; non-fiction focus.",
        "https://apcentral.collegeboard.org/courses/ap-english-language-and-composition",
        [
            ("修辞分析 Rhetorical Analysis", "Rhetorical Analysis", [
                ("rhetorical-situation", "修辞情境", "Rhetorical situation", 11, 4, []),
                ("claims-evidence", "主张与证据", "Claims & evidence", 11, 4, ["rhetorical-situation"]),
                ("rhetorical-strategies", "修辞策略", "Rhetorical strategies", 11, 5, ["claims-evidence"]),
            ]),
            ("论证 Argument", "Argument", [
                ("thesis-dev", "论点构建", "Thesis development", 11, 4, []),
                ("reasoning-org", "推理与组织", "Reasoning & organization", 12, 5, ["thesis-dev"]),
                ("counterargument", "反驳与让步", "Counterargument", 12, 5, ["reasoning-org"]),
            ]),
            ("综合 Synthesis", "Synthesis", [
                ("source-integration", "信源整合", "Source integration", 12, 5, ["claims-evidence"]),
                ("synthesis-essay", "综合论文", "Synthesis essay", 12, 5, ["source-integration"]),
            ]),
            ("语言写作规范 Writing Conventions", "Writing Conventions", [
                ("style-conventions", "风格与规范", "Style & conventions", 11, 4, []),
                ("revision", "修改与编辑", "Revision", 12, 4, ["style-conventions"]),
            ]),
        ]
    ))


# ------------------------------------------------------------------
# Main entrypoint
# ------------------------------------------------------------------
if __name__ == "__main__":
    gen_ib_pyp()
    gen_ib_myp()
    gen_ib_dp()
    gen_cam_primary()
    gen_cam_lsec()
    gen_cam_igcse()
    gen_cam_al()
    gen_us_k5()
    gen_us_ms()
    gen_us_hs()
    gen_ap()
    print("\n✅ Done. All international trees generated.")
