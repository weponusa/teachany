#!/usr/bin/env python3
"""Helper: append Cambridge IGCSE + A-Level section to generate-intl-trees.py"""
import os
SCRIPT = os.path.join(os.path.dirname(__file__), "generate-intl-trees.py")

ADD = r'''
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

'''

with open(SCRIPT, "a", encoding="utf-8") as f:
    f.write(ADD)
print("Appended IGCSE + A-Level sections")
