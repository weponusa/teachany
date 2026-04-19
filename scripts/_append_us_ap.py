#!/usr/bin/env python3
"""Helper: append US sections + main to generate-intl-trees.py"""
import os
SCRIPT = os.path.join(os.path.dirname(__file__), "generate-intl-trees.py")

ADD = r'''
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
'''

with open(SCRIPT, "a", encoding="utf-8") as f:
    f.write(ADD)
print("Appended US + AP + main entrypoint")
