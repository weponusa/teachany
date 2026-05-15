#!/usr/bin/env python3
"""
gen_demo_courses.py — 各学科试制课件批量生成
为每个学科生成一份完整的互动 HTML 课件 + manifest.json
"""
import os, json

BASE = os.path.join(os.path.dirname(__file__), '..', 'community')
os.makedirs(BASE, exist_ok=True)

# ── 各学科配置 ───────────────────────────────────────────────
COURSES = [
    {
        "id": "phy-m-ohms-law-demo",
        "node_id": "phy-m-ohms-law",
        "name": "欧姆定律",
        "subject": "physics", "grade": 8,
        "emoji": "⚡",
        "tag1": "初中物理", "tag2": "八年级",
        "prereqs": "电路基础,电流与电压",
        "abt_and": "你知道电路中有电流和电压",
        "abt_but": "但不知道它们之间有什么数量关系",
        "abt_therefore": "欧姆定律 I=U/R 就是这个关系的钥匙",
        "objectives": [
            ("理解", "能说出欧姆定律的内容：I=U/R"),
            ("应用", "能代入公式计算电流、电压或电阻"),
            ("分析", "能用图像分析 U-I 的正比关系"),
        ],
        "modules": [
            {
                "id": "module1", "title": "⚡ 欧姆定律内容",
                "steps": [
                    "固定电阻 R，增大电压 U → 电流 I 增大",
                    "固定电压 U，增大电阻 R → 电流 I 减小",
                    "定量关系：I = U ÷ R（欧姆定律）",
                ],
                "formula": "I = U / R（单位：A = V ÷ Ω）",
            }
        ],
        "interactive": {
            "type": "sliders",
            "vars": [("sliderU","电压 U","V",1,20,1,12), ("sliderR","电阻 R","Ω",1,20,1,4)],
            "result_id": "iResult",
            "result_label": "电流 I",
            "result_unit": "A",
            "calc_js": "const I=(parseFloat(document.getElementById('sliderU').value)/parseFloat(document.getElementById('sliderR').value)); document.getElementById('iResult').textContent=I.toFixed(2);",
        },
        "errors": [
            ("混淆变量","把电流 I 和电压 U 搞混","✅ 记忆：I=U/R，I 是[结果]，U 和 R 是[原因]"),
            ("单位错误","Ω 算成 kΩ 不换算","✅ 统一用国际基本单位：A, V, Ω"),
        ],
        "quiz": [
            ("q1","电阻 R=5Ω，电压 U=10V，电流 I=？","A. 50A","B. 2A（正确）","C. 0.5A","D. 15A","B"),
            ("q2","I=U/R 中，保持 R 不变，U 翻倍，则 I 如何变化？","A. 减半","B. 不变","C. 翻倍（正确）","D. 变为 4 倍","C"),
        ],
        "summary": ["I=U/R（欧姆定律核心公式）","电压越大→电流越大；电阻越大→电流越小","三个量只要知道两个就能求第三个"],
        "phet_url": "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_zh_CN.html",
    },
    {
        "id": "chem-m-atomic-structure-demo",
        "node_id": "chem-m-atomic-structure",
        "name": "原子结构",
        "subject": "chemistry", "grade": 8,
        "emoji": "⚛️",
        "tag1": "初中化学", "tag2": "八年级",
        "prereqs": "元素概念,分子与原子",
        "abt_and": "你知道物质由原子组成",
        "abt_but": "但不知道原子内部长什么样",
        "abt_therefore": "卢瑟福模型告诉我们：原子=核外电子+原子核（质子+中子）",
        "objectives": [
            ("记忆", "说出原子的构成：质子、中子、电子"),
            ("理解", "能解释原子序数、质量数与粒子数的关系"),
            ("应用", "能根据元素符号确定原子各粒子数"),
        ],
        "modules": [
            {
                "id": "module1", "title": "⚛️ 原子的构成",
                "steps": [
                    "原子核（中心）= 质子 + 中子；体积极小，质量占原子质量的 99.9%",
                    "核外电子：绕核运动，质量极小（约质子的 1/1836）",
                    "原子序数 Z = 质子数 = 核外电子数（中性原子）",
                ],
                "formula": "质量数 A = 质子数 Z + 中子数 N",
            }
        ],
        "interactive": {
            "type": "atom_builder",
            "vars": [("sliderZ","质子数 Z","个",1,18,1,8), ("sliderN","中子数 N","个",0,20,1,8)],
            "result_id": "atomResult",
            "result_label": "质量数 A",
            "result_unit": "",
            "calc_js": "const Z=parseInt(document.getElementById('sliderZ').value),N=parseInt(document.getElementById('sliderN').value); document.getElementById('atomResult').textContent=Z+N; document.getElementById('electronCount').textContent='核外电子='+Z+'个';",
        },
        "errors": [
            ("质子≠中子","以为质子数=中子数","✅ 只有部分元素相等，中子数=A-Z"),
            ("离子混淆","中性原子才有质子数=电子数","✅ 离子：失电子→质子>电子；得电子→质子<电子"),
        ],
        "quiz": [
            ("q1","¹²C 中，质子数:中子数:电子数=？","A. 6:6:6（正确）","B. 12:0:6","C. 6:12:6","D. 6:0:6","A"),
            ("q2","某原子质量数=23，质子数=11，则中子数=？","A. 34","B. 12（正确）","C. 11","D. 23","B"),
        ],
        "summary": ["原子=原子核（质子+中子）+核外电子","质量数A=质子数Z+中子数N","中性原子：质子数=电子数=原子序数"],
        "phet_url": "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html",
    },
    {
        "id": "bio-h-cell-division-demo",
        "node_id": "bio-h-cell-division",
        "name": "细胞的有丝分裂",
        "subject": "biology", "grade": 10,
        "emoji": "🔬",
        "tag1": "高中生物", "tag2": "十年级",
        "prereqs": "细胞结构,DNA复制",
        "abt_and": "你知道生物体由细胞组成",
        "abt_but": "但不清楚细胞如何分裂增殖、染色体如何行动",
        "abt_therefore": "有丝分裂四期（前中后末）让一个细胞变成两个完全相同的子细胞",
        "objectives": [
            ("记忆", "说出有丝分裂四个时期的名称"),
            ("理解", "描述每个时期染色体的变化特征"),
            ("应用", "判断图片对应分裂哪个时期"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🔬 四期特征",
                "steps": [
                    "前期：染色质→染色体，核膜核仁消失，纺锤体形成",
                    "中期：染色体排列在赤道板，形态最清晰（观察最佳期）",
                    "后期：着丝点分裂，姐妹染色单体分离，染色体数目加倍",
                    "末期：核膜核仁重现，细胞板形成，一分为二",
                ],
                "formula": "DNA 复制（S 期间期）→ 前→中→后→末期 → 2 个子细胞（含相同 DNA）",
            }
        ],
        "interactive": {
            "type": "phase_selector",
            "phases": ["间期","前期","中期","后期","末期"],
            "descriptions": [
                "DNA复制，细胞生长，染色质形态",
                "染色质凝缩成染色体，纺锤体出现",
                "染色体整齐排列在赤道板（最佳观察）",
                "着丝点断裂，染色单体→独立染色体，数目×2",
                "细胞板形成，核膜重现，一变二"
            ],
        },
        "errors": [
            ("期名记混","前中后末容易混淆","✅ 口诀：前失后得（前期核膜消失，末期核膜恢复）"),
            ("染色体数","后期染色体数和DNA数的关系","✅ 后期：着丝点分裂，染色体×2，但DNA不变"),
        ],
        "quiz": [
            ("q1","在哪个时期，染色体形态最清晰、最适合观察？","A. 前期","B. 中期（正确）","C. 后期","D. 间期","B"),
            ("q2","有丝分裂后期，着丝点分裂，此时染色体数目如何变化？","A. 不变","B. 减半","C. 加倍（正确）","D. 变为原来的四倍","C"),
        ],
        "summary": ["间期→前→中→后→末期，共五个阶段","中期：形态最清晰；后期：数目最多","子细胞染色体数与亲代相同"],
        "phet_url": None,
    },
    {
        "id": "geo-h-natural-zones-demo",
        "node_id": "geo-h-natural-zones",
        "name": "自然地理环境的差异性（自然带）",
        "subject": "geography", "grade": 10,
        "emoji": "🌍",
        "tag1": "高中地理", "tag2": "十年级",
        "prereqs": "气候类型分布,植被与土壤",
        "abt_and": "你知道不同地方气候不同",
        "abt_but": "但不清楚为什么从赤道到极地植被会规律性变化",
        "abt_therefore": "自然地理环境的地域分异规律（纬度地带性、经度地带性、垂直地带性）解释这一切",
        "objectives": [
            ("理解", "说出三种分异规律的名称及主导因素"),
            ("应用", "能判断某地属于哪个自然带"),
            ("分析", "对比不同自然带的气候—植被—土壤特征"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🌍 三大分异规律",
                "steps": [
                    "纬度地带性：从赤道→极地，热量变化，植被更替（热带雨林→温带草原→苔原）",
                    "经度地带性：从沿海→内陆，水分变化，植被更替（森林→草原→荒漠）",
                    "垂直地带性：山地从山麓→山顶，水热同变，植被带上移（似纬度带压缩版）",
                ],
                "formula": "纬度→热量主导；经度→水分主导；垂直→水热同变",
            }
        ],
        "interactive": {
            "type": "zone_quiz",
            "zones": [
                ("热带雨林带","赤道附近，高温多雨，常绿阔叶林","🌴"),
                ("热带草原带","赤道两侧，干湿季分明","🌾"),
                ("温带落叶阔叶林带","中纬度湿润地区，四季分明","🍂"),
                ("亚寒带针叶林带","高纬度，寒冷，针叶林","🌲"),
                ("苔原带","极地，永久冻土，苔藓地衣","❄️"),
            ],
        },
        "errors": [
            ("经度与纬度混淆","经度地带性的主导因素","✅ 经度→水分（海洋→内陆水分递减）"),
            ("垂直带基带","山地最低处的自然带","✅ 基带=山麓所在的水平自然带"),
        ],
        "quiz": [
            ("q1","从赤道到极地的地域分异，主导因素是？","A. 水分","B. 热量（正确）","C. 地形","D. 洋流","B"),
            ("q2","温带荒漠带出现在内陆地区，体现了哪种分异规律？","A. 纬度地带性","B. 垂直地带性","C. 经度地带性（正确）","D. 非地带性","C"),
        ],
        "summary": ["三大规律：纬度（热量）、经度（水分）、垂直（水热）","自然带分布规律是气候→植被→土壤的综合体现","垂直地带性：基带=山麓对应的水平带"],
        "phet_url": None,
    },
    {
        "id": "hist-m-industrial-rev-demo",
        "node_id": "hist-m-industrial-revolution",
        "name": "工业革命",
        "subject": "history", "grade": 9,
        "emoji": "🏭",
        "tag1": "初中历史", "tag2": "九年级",
        "prereqs": "资本主义萌芽,英国资产阶级革命",
        "abt_and": "你知道手工业时代生产效率很低",
        "abt_but": "但不清楚为什么 18 世纪英国率先改变了这一切",
        "abt_therefore": "工业革命=机器大生产+蒸汽动力，彻底改变了人类社会的生产方式和社会结构",
        "objectives": [
            ("记忆", "说出工业革命的主要发明及发明者"),
            ("理解", "解释英国率先发生工业革命的原因"),
            ("分析", "分析工业革命对社会结构的影响"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🏭 工业革命三阶段",
                "steps": [
                    "起点（1760s）：珍妮纺纱机（哈格里夫斯），棉纺业革命",
                    "核心（1782）：改良蒸汽机（瓦特），动力突破，工厂制度建立",
                    "扩散（1820s）：蒸汽机车（斯蒂芬森），铁路时代，工业向全球扩散",
                ],
                "formula": "蒸汽机 = 工业革命的\"发动机\"→ 工厂制度 → 工业资产阶级 + 工业无产阶级",
            }
        ],
        "interactive": {
            "type": "timeline",
            "events": [
                ("1765", "珍妮纺纱机", "哈格里夫斯发明，棉纺产量大增"),
                ("1782", "改良蒸汽机", "瓦特改良，成为通用动力机"),
                ("1807", "汽船", "富尔顿发明，水上交通革命"),
                ("1825", "蒸汽机车", "斯蒂芬森，铁路时代开启"),
                ("1840s","英国完成工业革命","世界第一个工业国，\"世界工厂\""),
            ],
        },
        "errors": [
            ("瓦特发明蒸汽机","瓦特是改良不是发明","✅ 纽科门（1712）发明蒸汽机，瓦特（1782）改良为通用动力机"),
            ("原因单一化","只说市场/资源","✅ 四要素：资本+劳动力+市场+技术（缺一不可）"),
        ],
        "quiz": [
            ("q1","工业革命首先从哪个行业开始？","A. 钢铁业","B. 棉纺织业（正确）","C. 铁路业","D. 采矿业","B"),
            ("q2","瓦特改良蒸汽机的最大意义是？","A. 发明了蒸汽","B. 提供了通用动力（正确）","C. 用于交通","D. 替代人力纺纱","B"),
        ],
        "summary": ["珍妮纺纱机→改良蒸汽机→蒸汽机车（三大标志）","英国率先：资本+劳动力+市场+技术四要素齐备","工业革命→工业资产阶级&无产阶级出现→社会矛盾加剧"],
        "phet_url": None,
    },
    {
        "id": "sci-e-photosynthesis-demo",
        "node_id": "sci-e-photosynthesis-intro",
        "name": "植物的光合作用",
        "subject": "science", "grade": 5,
        "emoji": "🌿",
        "tag1": "小学科学", "tag2": "五年级",
        "prereqs": "植物的生长,阳光与能量",
        "abt_and": "你知道植物需要水和阳光才能生长",
        "abt_but": "但不知道植物是怎么自己[做饭]的",
        "abt_therefore": "光合作用就是植物用阳光把水和二氧化碳变成食物（糖）的过程",
        "objectives": [
            ("记忆", "说出光合作用的原料和产物"),
            ("理解", "解释为什么阳光对植物生长重要"),
            ("应用", "判断影响光合作用的因素"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🌿 光合作用过程",
                "steps": [
                    "原料：二氧化碳（CO₂）+ 水（H₂O）",
                    "条件：阳光（提供能量）、叶绿体（发生场所）",
                    "产物：葡萄糖（有机物）+ 氧气（O₂）",
                    "总结：6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
                ],
                "formula": "二氧化碳 + 水 ─光照→ 葡萄糖 + 氧气",
            }
        ],
        "interactive": {
            "type": "factor_slider",
            "vars": [("sliderLight","光照强度","%",0,100,10,60), ("sliderCO2","CO₂浓度","%",0,100,10,40)],
            "result_id": "photoResult",
            "result_label": "光合速率",
            "result_unit": "%",
            "calc_js": "const L=parseFloat(document.getElementById('sliderLight').value),C=parseFloat(document.getElementById('sliderCO2').value); const rate=Math.round(L*0.6+C*0.4); document.getElementById('photoResult').textContent=rate;",
        },
        "errors": [
            ("光合=呼吸","两者容易混淆","✅ 光合：合成有机物；呼吸：分解有机物；都在细胞内进行"),
            ("白天才呼吸","以为植物夜晚不呼吸","✅ 植物全天都进行呼吸作用；光合只在有光时进行"),
        ],
        "quiz": [
            ("q1","光合作用的产物有哪些？","A. CO₂ 和 H₂O","B. 葡萄糖（正确）和 O₂","C. 只有葡萄糖","D. 只有 O₂","B"),
            ("q2","把植物放在完全黑暗处，光合作用会？","A. 加速","B. 不变","C. 停止（正确）","D. 只剩呼吸","C"),
        ],
        "summary": ["原料：CO₂+H₂O；产物：有机物+O₂","场所：叶绿体；条件：光照","植物通过光合作用自己制造有机物（[做饭]）"],
        "phet_url": None,
    },
    {
        "id": "cs-ap-a-boolean-demo",
        "node_id": "cs-ap-a-boolean-logic",
        "name": "布尔逻辑与条件判断",
        "subject": "cs", "grade": 11,
        "emoji": "💻",
        "tag1": "AP CS A", "tag2": "十一年级",
        "prereqs": "变量与类型,基本运算符",
        "abt_and": "你会写 int、String 变量和算术运算",
        "abt_but": "但程序要做决策——怎么让它[判断]？",
        "abt_therefore": "布尔值（true/false）+ 逻辑运算符（&&、||、!）= 程序决策的基础",
        "objectives": [
            ("理解", "说出 &&、||、! 的含义和真值表"),
            ("应用", "写出包含 if-else 的条件判断代码"),
            ("分析", "使用 De Morgan 定律化简复合条件"),
        ],
        "modules": [
            {
                "id": "module1", "title": "💻 逻辑运算符真值表",
                "steps": [
                    "&&（AND）：两个都为 true → true；否则 false",
                    "||（OR）：至少一个为 true → true；两个都 false → false",
                    "!（NOT）：取反，true → false，false → true",
                    "De Morgan 定律：!(A && B) == !A || !B",
                ],
                "formula": "if (条件) { 执行A } else { 执行B }",
            }
        ],
        "interactive": {
            "type": "truth_table",
            "ops": ["&&","||","!A"],
        },
        "errors": [
            ("= vs ==","赋值与比较混用","✅ = 是赋值；== 是比较；equals() 比较字符串"),
            ("短路求值","&&左边false时右边不执行","✅ 利用短路：先判安全条件再判具体条件"),
        ],
        "quiz": [
            ("q1","true && false 的结果是？","A. true","B. false（正确）","C. null","D. 报错","B"),
            ("q2","!(true || false) 的结果是？","A. true","B. false（正确）","C. true && false","D. 不确定","B"),
        ],
        "summary": ["&&：全真才真；||：有真即真；!：取反","De Morgan: !(A&&B) = !A||!B","if-else 是条件判断的基本结构"],
        "phet_url": None,
    },
    {
        "id": "economics-demand-supply-demo",
        "node_id": "economics-cam-al-demand-supply-al",
        "name": "供给与需求",
        "subject": "economics", "grade": 12,
        "emoji": "📊",
        "tag1": "A Level 经济学", "tag2": "十二年级",
        "prereqs": "稀缺性与选择,价格机制",
        "abt_and": "你知道商品有价格，消费者会买，生产者会卖",
        "abt_but": "但不知道价格是怎么决定的",
        "abt_therefore": "供需模型：需求曲线 + 供给曲线 → 均衡价格，解释市场运行的核心机制",
        "objectives": [
            ("理解", "画出并解释需求曲线和供给曲线的形状"),
            ("应用", "用供需模型分析价格和数量的变动"),
            ("评价", "评估供需模型的假设条件和局限性"),
        ],
        "modules": [
            {
                "id": "module1", "title": "📊 供需曲线基础",
                "steps": [
                    "需求曲线（D）：向右下倾斜——价格↑ → 需求量↓（负相关）",
                    "供给曲线（S）：向右上倾斜——价格↑ → 供给量↑（正相关）",
                    "均衡点（E）：D 与 S 的交点 → 均衡价格 P* 和均衡数量 Q*",
                    "市场出清：超额需求→价格上升；超额供给→价格下降",
                ],
                "formula": "P* = 均衡价格（市场出清，供给量=需求量）",
            }
        ],
        "interactive": {
            "type": "supply_demand_canvas",
        },
        "errors": [
            ("需求量vs需求","移动点vs移动曲线混淆","✅ 价格变化→需求量变化（点移动）；其他因素→需求变化（曲线移动）"),
            ("价格决定价值","把价格等同于价值","✅ 价格由市场供需决定；价值由生产成本决定（两者相关但不等同）"),
        ],
        "quiz": [
            ("q1","价格上升时，消费者需求量如何变化？","A. 增加","B. 减少（正确）","C. 不变","D. 不确定","B"),
            ("q2","居民收入增加会导致正常商品的需求曲线如何移动？","A. 向左移","B. 向右移（正确）","C. 不移动","D. 向上移","B"),
        ],
        "summary": ["需求曲线向右下倾斜（价格↑→需求↓）","供给曲线向右上倾斜（价格↑→供给↑）","均衡：D=S，价格稳定；失衡会通过价格信号自动调节"],
        "phet_url": None,
    },
    {
        "id": "humanities-population-migration-demo",
        "node_id": "humanities-ib-myp-myp-population-migration",
        "name": "人口迁移与全球化",
        "subject": "humanities", "grade": 9,
        "emoji": "🌐",
        "tag1": "MYP 人文", "tag2": "九年级",
        "prereqs": "人口分布,全球化基础",
        "abt_and": "你知道世界各地人口分布不均",
        "abt_but": "但不清楚为什么人们要大规模迁移，这又带来什么影响",
        "abt_therefore": "推拉理论（Push-Pull）解释迁移动因，全球化加速了人口流动与文化交融",
        "objectives": [
            ("理解", "用推拉理论解释人口迁移的原因"),
            ("分析", "分析人口迁移对流出地和流入地的影响"),
            ("评价", "评估全球化与人口流动的相互作用"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🌐 推拉理论（Push-Pull Model）",
                "steps": [
                    "推力（Push）：让人想离开的因素——贫困、战争、自然灾害、就业不足",
                    "拉力（Pull）：吸引人前往的因素——更高工资、安全、教育、医疗资源",
                    "阻力（Obstacles）：增加迁移成本——语言障碍、移民政策、文化差异",
                    "案例：叙利亚难民潮（推力=战争），中国农村→城市（拉力=就业）",
                ],
                "formula": "迁移决策 = 拉力 > 推力 + 阻力",
            }
        ],
        "interactive": {
            "type": "drag_sort",
            "categories": ["推力（Push）", "拉力（Pull）", "阻力"],
            "items": ["经济机会多", "战争与冲突", "语言障碍", "医疗资源丰富", "贫困", "签证政策严格", "优质教育", "自然灾害"],
        },
        "errors": [
            ("难民=移民","法律定义不同","✅ 难民：被迫离开（战争/迫害）；移民：自愿移动（经济/家庭）"),
            ("单向影响","只看流入地","✅ 迁移对流出地也有影响：劳动力减少、侨汇收入、人才流失"),
        ],
        "quiz": [
            ("q1","经济学家找工作移居另一国，这属于？","A. 难民","B. 经济移民（正确）","C. 季节工","D. 流亡者","B"),
            ("q2","人口大量流入一个城市，主要的拉力是？","A. 战争","B. 干旱","C. 就业机会多（正确）","D. 边界开放","C"),
        ],
        "summary": ["推拉理论：推力（让人离开）+ 拉力（吸引人来）+ 阻力（增加成本）","全球化→迁移更容易，文化交融加速","迁移对流出地和流入地都有正负两面影响"],
        "phet_url": None,
    },
    {
        "id": "inquiry-life-cycles-demo",
        "node_id": "inquiry-ib-pyp-pyp-life-cycles",
        "name": "生命周期探究",
        "subject": "inquiry", "grade": 4,
        "emoji": "🔎",
        "tag1": "IB PYP 探究", "tag2": "四年级",
        "prereqs": "生物基础,植物与动物",
        "abt_and": "你见过毛毛虫变蝴蝶、种子长成大树",
        "abt_but": "但还没系统探究过：生命为什么会有周期？周期有什么规律？",
        "abt_therefore": "通过观察、提问、实验、归纳，我们来探究不同生物的生命周期规律",
        "objectives": [
            ("观察", "识别并描述至少两种生物的生命周期阶段"),
            ("探究", "设计一个关于生命周期的简单观察实验"),
            ("归纳", "比较不同生物生命周期的异同"),
        ],
        "modules": [
            {
                "id": "module1", "title": "🔎 探究步骤（6步法）",
                "steps": [
                    "①情境引入：毛毛虫→蛹→蝴蝶，你有什么疑问？",
                    "②提出假设：我认为所有动物都经历……个阶段",
                    "③设计验证：选择2种动物，收集生命周期资料",
                    "④收集证据：绘制生命周期图，标注每阶段特征",
                    "⑤分析结论：比较两种生物的异同，验证假设",
                    "⑥反思迁移：还有哪些生物有有趣的周期？",
                ],
                "formula": "探究 = 观察→提问→假设→验证→结论→反思",
            }
        ],
        "interactive": {
            "type": "cycle_sorter",
            "cycles": {
                "蝴蝶": ["卵","幼虫（毛毛虫）","蛹","成虫（蝴蝶）"],
                "青蛙": ["卵","蝌蚪","幼蛙","成蛙"],
            },
        },
        "errors": [
            ("跳过假设","直接看答案","✅ 先写自己的假设，再对比——认知冲突才能促进真正理解"),
            ("只记结论","不关注过程","✅ 科学探究的价值在过程：观察→记录→分析→修正"),
        ],
        "quiz": [
            ("q1","蝴蝶的生命周期中，哪个阶段是完全不动的？","A. 卵","B. 幼虫","C. 蛹（正确）","D. 成虫","C"),
            ("q2","探究的第一步应该是？","A. 得出结论","B. 提出假设","C. 观察与提问（正确）","D. 设计实验","C"),
        ],
        "summary": ["探究六步：观察→假设→设计→收集→结论→反思","不同生物的生命周期阶段数和时长各不同","蝴蝶：完全变态；青蛙：两栖类，从水到陆"],
        "phet_url": None,
    },
]

# ── HTML 生成函数 ─────────────────────────────────────────────
def make_html(c):
    opts_html = []
    for q in c['quiz']:
        qid, stem = q[0], q[1]
        opts = q[2:6]
        correct = q[6]
        opts_str = '\n'.join([
            f'<div class="option" onclick="answer(this,\'{qid}\',\'{chr(65+i)}\')">{o}</div>'
            for i, o in enumerate(opts)
        ])
        opts_html.append(f'''
<div class="quiz-card" id="{qid}">
  <p class="question">{stem}</p>
  <div class="options">{opts_str}</div>
</div>''')

    correct_map = {q[0]: q[6] for q in c['quiz']}
    correct_js = json.dumps(correct_map)

    steps_html = ''.join([f'<div class="step">{s}</div>' for s in c['modules'][0]['steps']])

    # Interactive component
    ic = c['interactive']
    if ic['type'] == 'sliders':
        sliders_html = ''.join([
            f'<div class="slider-item"><label>{v[1]} ({v[3]}{v[2]}-{v[4]}{v[2]}) =</label>'
            f'<input type="range" id="{v[0]}" min="{v[3]}" max="{v[4]}" step="{v[5]}" value="{v[6]}" oninput="calcResult()">'
            f'<span id="val_{v[0]}">{v[6]}</span> {v[2]}</div>'
            for v in ic['vars']
        ])
        calc_update = ''.join([f"document.getElementById('val_{v[0]}').textContent=document.getElementById('{v[0]}').value;" for v in ic['vars']])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>🎛️ 互动实验：调节参数，观察结果</h3>
  <div class="slider-group">{sliders_html}</div>
  <div class="result-box">
    <span style="font-size:14px;color:var(--text2)">{ic['result_label']}：</span>
    <span id="{ic['result_id']}" style="font-size:28px;font-weight:800;color:var(--accent)">—</span>
    <span style="font-size:14px;color:var(--text2)"> {ic['result_unit']}</span>
  </div>
  <div id="electronCount" style="font-size:13px;color:var(--text2);margin-top:4px"></div>
</div>
<script>function calcResult(){{
  {calc_update}
  {ic['calc_js']}
}}calcResult();</script>'''

    elif ic['type'] == 'phase_selector':
        btns = ''.join([f'<button class="phase-btn" onclick="selectPhase({i})">{p}</button>' for i,p in enumerate(ic['phases'])])
        descs_js = json.dumps(ic['descriptions'])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>🔬 点击时期，查看特征</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">{btns}</div>
  <div id="phaseDesc" style="min-height:60px;padding:14px;background:var(--bg);border-radius:10px;font-size:14px;color:var(--text)">← 点击上方时期查看特征</div>
</div>
<script>const phaseDescs={descs_js};
function selectPhase(i){{
  document.querySelectorAll('.phase-btn').forEach((b,j)=>b.classList.toggle('active',i===j));
  document.getElementById('phaseDesc').textContent=phaseDescs[i];
}}</script>'''

    elif ic['type'] == 'timeline':
        events_html = ''.join([
            f'<div class="timeline-event" onclick="this.querySelector(\'.event-detail\').style.display=this.querySelector(\'.event-detail\').style.display===\'block\'?\'none\':\'block\'">'
            f'<div class="event-year">{e[0]}</div>'
            f'<div class="event-name">{e[1]}</div>'
            f'<div class="event-detail" style="display:none;margin-top:6px;font-size:13px;color:var(--text2)">{e[2]}</div>'
            f'</div>'
            for e in ic['events']
        ])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>📅 历史时间轴（点击展开详情）</h3>
  <div class="timeline">{events_html}</div>
</div>'''

    elif ic['type'] == 'factor_slider':
        sliders_html = ''.join([
            f'<div class="slider-item"><label>{v[1]} =</label>'
            f'<input type="range" id="{v[0]}" min="{v[3]}" max="{v[4]}" step="{v[5]}" value="{v[6]}" oninput="calcResult()">'
            f'<span id="val_{v[0]}">{v[6]}</span>{v[2]}</div>'
            for v in ic['vars']
        ])
        calc_update = ''.join([f"document.getElementById('val_{v[0]}').textContent=document.getElementById('{v[0]}').value;" for v in ic['vars']])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>🌿 调节影响因素，观察光合速率变化</h3>
  <div class="slider-group">{sliders_html}</div>
  <div class="result-box">
    <span style="font-size:14px;color:var(--text2)">{ic['result_label']}：</span>
    <span id="{ic['result_id']}" style="font-size:28px;font-weight:800;color:var(--accent)">—</span>
    <span style="font-size:14px;color:var(--text2)"> {ic['result_unit']}</span>
  </div>
</div>
<script>function calcResult(){{
  {calc_update}
  {ic['calc_js']}
}}calcResult();</script>'''

    elif ic['type'] == 'truth_table':
        interactive_html = '''
<div class="card" id="module-interactive">
  <h3>💻 布尔逻辑真值表（点击切换 A/B 值）</h3>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
    <label style="display:flex;align-items:center;gap:8px;font-size:15px">
      A = <button id="btnA" onclick="toggleBool('A')" style="padding:4px 14px;border-radius:8px;border:1.5px solid #3b82f6;background:#eff6ff;color:#3b82f6;cursor:pointer;font-weight:700">true</button>
    </label>
    <label style="display:flex;align-items:center;gap:8px;font-size:15px">
      B = <button id="btnB" onclick="toggleBool('B')" style="padding:4px 14px;border-radius:8px;border:1.5px solid #3b82f6;background:#eff6ff;color:#3b82f6;cursor:pointer;font-weight:700">true</button>
    </label>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
    <div class="result-box"><div style="font-size:12px;color:var(--text2);margin-bottom:4px">A &amp;&amp; B</div><div id="res_and" style="font-size:22px;font-weight:800;color:var(--accent)">true</div></div>
    <div class="result-box"><div style="font-size:12px;color:var(--text2);margin-bottom:4px">A || B</div><div id="res_or" style="font-size:22px;font-weight:800;color:var(--accent)">true</div></div>
    <div class="result-box"><div style="font-size:12px;color:var(--text2);margin-bottom:4px">!A</div><div id="res_not" style="font-size:22px;font-weight:800;color:var(--accent)">false</div></div>
  </div>
</div>
<script>
let boolA=true, boolB=true;
function toggleBool(v){ if(v==='A'){boolA=!boolA;document.getElementById('btnA').textContent=boolA;}else{boolB=!boolB;document.getElementById('btnB').textContent=boolB;} updateBool(); }
function updateBool(){ document.getElementById('res_and').textContent=String(boolA&&boolB); document.getElementById('res_or').textContent=String(boolA||boolB); document.getElementById('res_not').textContent=String(!boolA); }
updateBool();
</script>'''

    elif ic['type'] == 'supply_demand_canvas':
        interactive_html = '''
<div class="card" id="module-interactive">
  <h3>📊 供需曲线互动图</h3>
  <div class="slider-group">
    <div class="slider-item"><label>需求偏移 ΔD =</label>
      <input type="range" id="sdD" min="-3" max="3" step="0.5" value="0" oninput="drawSD()">
      <span id="valD">0</span></div>
    <div class="slider-item"><label>供给偏移 ΔS =</label>
      <input type="range" id="sdS" min="-3" max="3" step="0.5" value="0" oninput="drawSD()">
      <span id="valS">0</span></div>
  </div>
  <div class="canvas-wrap"><canvas id="sdCanvas" height="280"></canvas></div>
  <div id="sdDesc" style="font-size:13px;color:var(--text2);padding:8px 0"></div>
</div>
<script>
const sdC=document.getElementById('sdCanvas'), sdCtx=sdC.getContext('2d');
function drawSD(){
  const dpr=window.devicePixelRatio||1;
  const w=sdC.parentElement.clientWidth, h=280;
  sdC.width=w*dpr; sdC.height=h*dpr; sdC.style.width=w+'px'; sdC.style.height=h+'px';
  sdCtx.scale(dpr,dpr);
  const cx=w/2, cy=h/2, sc=40;
  sdCtx.clearRect(0,0,w,h);
  // Grid
  sdCtx.strokeStyle='#1e3a5f'; sdCtx.lineWidth=1;
  for(let i=0;i<=10;i++){sdCtx.beginPath();sdCtx.moveTo(i*sc,0);sdCtx.lineTo(i*sc,h);sdCtx.stroke();sdCtx.beginPath();sdCtx.moveTo(0,i*sc);sdCtx.lineTo(w,i*sc);sdCtx.stroke();}
  // Axes
  sdCtx.strokeStyle='#475569'; sdCtx.lineWidth=2;
  sdCtx.beginPath();sdCtx.moveTo(0,cy);sdCtx.lineTo(w,cy);sdCtx.stroke();
  sdCtx.beginPath();sdCtx.moveTo(cx,0);sdCtx.lineTo(cx,h);sdCtx.stroke();
  sdCtx.fillStyle='#94a3b8'; sdCtx.font='12px sans-serif';
  sdCtx.textAlign='center';sdCtx.fillText('Q（数量）',w-30,cy-8);
  sdCtx.textAlign='left';sdCtx.fillText('P（价格）',cx+8,14);
  const dShift=parseFloat(document.getElementById('sdD').value);
  const sShift=parseFloat(document.getElementById('sdS').value);
  document.getElementById('valD').textContent=dShift>0?'+'+dShift:dShift;
  document.getElementById('valS').textContent=sShift>0?'+'+sShift:sShift;
  // Demand line: P = a - bQ → Q = (a-P)/b, shifted
  const da=8+dShift, db=1.2;
  sdCtx.strokeStyle='#60a5fa'; sdCtx.lineWidth=3;
  sdCtx.beginPath(); sdCtx.moveTo(cx,cy-da*sc); sdCtx.lineTo(cx+da/db*sc,cy); sdCtx.stroke();
  sdCtx.fillStyle='#60a5fa'; sdCtx.font='bold 13px sans-serif'; sdCtx.textAlign='left';
  sdCtx.fillText('D',cx+da/db*sc-5,cy-8);
  // Supply line: P = c + dQ, shifted
  const sa=2-sShift, sd2=1.0;
  sdCtx.strokeStyle='#4ade80'; sdCtx.lineWidth=3;
  sdCtx.beginPath(); sdCtx.moveTo(cx,cy-sa*sc); const qMax=(10-sa)/sd2; sdCtx.lineTo(cx+qMax*sc,cy-(sa+sd2*qMax)*sc); sdCtx.stroke();
  sdCtx.fillStyle='#4ade80'; sdCtx.textAlign='left'; sdCtx.fillText('S',cx+qMax*sc-10,cy-(sa+sd2*qMax)*sc);
  // Equilibrium
  const qeq=(da-sa)/(db+sd2), peq=sa+sd2*qeq;
  if(qeq>0){
    sdCtx.fillStyle='#fbbf24';
    sdCtx.beginPath(); sdCtx.arc(cx+qeq*sc,cy-peq*sc,7,0,2*Math.PI); sdCtx.fill();
    sdCtx.font='12px sans-serif'; sdCtx.textAlign='left';
    sdCtx.fillText(`E: P*=${peq.toFixed(1)}, Q*=${qeq.toFixed(1)}`,cx+qeq*sc+10,cy-peq*sc);
    document.getElementById('sdDesc').textContent=`均衡价格 P*=${peq.toFixed(2)}，均衡数量 Q*=${qeq.toFixed(2)}`;
  }
}
window.addEventListener('resize',drawSD); drawSD();
</script>'''

    elif ic['type'] == 'drag_sort':
        cats = ic['categories']
        items = ic['items']
        items_html = ''.join([f'<div class="drag-item" draggable="true" ondragstart="dragStart(event)" id="item{i}">{item}</div>' for i,item in enumerate(items)])
        zones_html = ''.join([f'<div class="drop-zone" ondrop="drop(event,{i})" ondragover="event.preventDefault()" data-cat="{cat}"><div class="zone-title">{cat}</div><div class="zone-items" id="zone{i}"></div></div>' for i,cat in enumerate(cats)])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>🌐 分类拖拽：把下列因素拖入正确类别</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="itemPool">{items_html}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">{zones_html}</div>
</div>
<script>
let dragId=null;
function dragStart(e){{dragId=e.target.id;}}
function drop(e,zoneIdx){{e.preventDefault();const item=document.getElementById(dragId);if(item)document.getElementById('zone'+zoneIdx).appendChild(item);}}
</script>'''

    elif ic['type'] == 'zone_quiz':
        zones = ic['zones']
        btns = ''.join([f'<button class="zone-btn" onclick="showZone({i})">{z[0][:5]}… {z[2]}</button>' for i,z in enumerate(zones)])
        zones_js = json.dumps([{'name':z[0],'desc':z[1],'emoji':z[2]} for z in zones])
        interactive_html = f'''
<div class="card" id="module-interactive">
  <h3>🌍 点击自然带，了解特征</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">{btns}</div>
  <div id="zoneDetail" style="padding:16px;background:var(--bg);border-radius:12px;min-height:60px;font-size:14px;color:var(--text)">← 点击上方按钮</div>
</div>
<script>const zData={zones_js};
function showZone(i){{const z=zData[i];document.getElementById('zoneDetail').innerHTML='<strong>'+z.emoji+' '+z.name+'</strong><br>'+z.desc;
document.querySelectorAll('.zone-btn').forEach((b,j)=>b.classList.toggle('active',i===j));}}</script>'''

    elif ic['type'] == 'cycle_sorter':
        cyc = ic['cycles']
        cycles_list = list(cyc.items())
        interactive_html = '<div class="card" id="module-interactive"><h3>🔎 生命周期顺序排列</h3>'
        for name, stages in cycles_list:
            import random
            shuffled = stages[:]
            random.seed(42)
            random.shuffle(shuffled)
            correct_order = json.dumps(stages)
            items_html = ''.join([f'<div class="drag-item" draggable="true">{s}</div>' for s in shuffled])
            interactive_html += f'''
<div style="margin-bottom:16px">
  <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text)">{name}的生命周期（拖拽排序）</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">{items_html}</div>
  <div style="font-size:12px;color:var(--text2);margin-top:6px">正确顺序：{"→".join(stages)}</div>
</div>'''
        interactive_html += '</div>'

    else:
        interactive_html = f'<div class="card" id="module-interactive"><h3>互动区</h3><p>互动类型：{ic["type"]}</p></div>'

    errors_html = ''.join([
        f'<div class="error-card"><div class="label">易错 {i+1}</div><div class="desc">{e[0]}：{e[1]}</div><div class="fix">{e[2]}</div></div>'
        for i, e in enumerate(c['errors'])
    ])

    summary_html = ''.join([f'<li>{s}</li>' for s in c['summary']])

    phet_section = ''
    if c.get('phet_url'):
        phet_section = f'''
  <section class="section" id="simulation">
    <h2>🧪 PhET 仿真实验</h2>
    <div class="card">
      <p style="margin-bottom:12px">在真实的在线仿真中探索{c["name"]}（需要网络连接）：</p>
      <a href="{c['phet_url']}" target="_blank" style="display:inline-block;padding:10px 20px;background:var(--primary);color:#fff;border-radius:10px;text-decoration:none;font-weight:600">🔬 打开 PhET 仿真</a>
    </div>
  </section>'''

    obj_html = ''.join([f'<div class="obj-card"><div class="bloom">Bloom · {o[0]}</div><p>{o[1]}</p></div>' for o in c['objectives']])

    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="course-id" content="{c['id']}">
<meta name="course-node" content="{c['node_id']}">
<meta name="course-subject" content="{c['subject']}">
<meta name="course-title" content="{c['name']}">
<meta name="course-prereqs" content="{c['prereqs']}">
<title>{c['name']} · {c['tag1']} G{c['grade']} · TeachAny v7.9.14</title>
<style>
:root{{--bg:#f8fafc;--card:#fff;--primary:#3b82f6;--secondary:#06b6d4;--accent:#f59e0b;--text:#1e293b;--text2:#64748b;--border:#e2e8f0;--green:#22c55e;--red:#ef4444}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.75}}
.container{{max-width:860px;margin:0 auto;padding:0 16px 80px}}
.sticky-nav{{position:sticky;top:0;z-index:100;background:rgba(248,250,252,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}}
.sticky-nav a{{font-size:13px;color:var(--text2);text-decoration:none;padding:4px 10px;border-radius:20px;transition:all .2s}}
.sticky-nav a:hover,.sticky-nav a.active{{background:var(--primary);color:#fff}}
.hero{{text-align:center;padding:40px 24px 28px;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border-radius:16px;margin:24px 0 0}}
.tags{{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}}
.tag{{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(59,130,246,.1);color:var(--primary)}}
.hero h1{{font-size:clamp(26px,5vw,40px);font-weight:800;margin-bottom:10px}}
.hero p{{color:var(--text2);font-size:15px;max-width:520px;margin:0 auto}}
.section{{margin:28px 0}}.section h2{{font-size:19px;font-weight:700;margin-bottom:14px;padding-left:12px;border-left:4px solid var(--primary)}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05)}}
.card h3{{font-size:15px;font-weight:700;margin-bottom:10px}}
.card p,.card li{{font-size:14px;color:var(--text2);line-height:1.8}}
.card ul{{padding-left:18px}}
.obj-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}}
.obj-card{{background:linear-gradient(135deg,#eff6ff,#f0fdf4);border-radius:12px;padding:14px;border-left:4px solid var(--primary)}}
.obj-card .bloom{{font-size:11px;font-weight:700;color:var(--primary);margin-bottom:4px}}
.obj-card p{{font-size:13px;color:var(--text)}}
.quiz-card{{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:10px}}
.question{{font-size:14px;font-weight:600;margin-bottom:10px;color:var(--text)}}
.options{{display:grid;gap:7px}}
.option{{padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;transition:all .2s;font-size:13px;color:var(--text)}}
.option:hover{{border-color:var(--primary);background:#eff6ff}}
.option.correct{{border-color:var(--green);background:#f0fdf4;color:#166534}}
.option.wrong{{border-color:var(--red);background:#fef2f2;color:#991b1b}}
.steps{{counter-reset:step}}
.step{{position:relative;padding:12px 12px 12px 46px;border-left:2px solid var(--primary);margin-bottom:10px;font-size:14px;color:var(--text2)}}
.step::before{{counter-increment:step;content:counter(step);position:absolute;left:-14px;top:10px;width:26px;height:26px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}}
.error-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}}
.error-card{{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px}}
.error-card .label{{font-size:11px;font-weight:700;color:var(--red);margin-bottom:5px}}
.error-card .desc{{font-size:13px;color:#991b1b;margin-bottom:7px}}
.error-card .fix{{font-size:12px;color:#166534;background:#f0fdf4;padding:7px;border-radius:7px}}
.formula-block{{background:#1e293b;color:#e2e8f0;padding:12px 16px;border-radius:10px;font-size:14px;margin:8px 0;text-align:center}}
.summary-box{{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1.5px solid #86efac;border-radius:14px;padding:18px}}
.summary-box ul{{padding-left:18px}}
.summary-box li{{font-size:14px;color:#166534;line-height:1.9}}
.slider-group{{display:flex;flex-wrap:wrap;gap:14px;margin:10px 0}}
.slider-item{{display:flex;align-items:center;gap:8px;flex:1;min-width:190px;font-size:13px;color:var(--text2)}}
.slider-item input[type=range]{{flex:1;accent-color:var(--primary)}}
.result-box{{text-align:center;padding:16px;background:var(--bg);border-radius:10px;margin-top:10px}}
.timeline{{display:flex;flex-direction:column;gap:0}}
.timeline-event{{cursor:pointer;padding:12px 16px;border-left:3px solid var(--primary);margin-bottom:8px;background:var(--bg);border-radius:0 10px 10px 0;transition:background .2s}}
.timeline-event:hover{{background:#eff6ff}}
.event-year{{font-size:12px;font-weight:700;color:var(--primary);margin-bottom:2px}}
.event-name{{font-size:14px;font-weight:600;color:var(--text)}}
.tutor-card{{background:linear-gradient(135deg,#eff6ff,#eef2ff);border:1.5px solid #bfdbfe;border-radius:16px;padding:20px;text-align:center;margin:20px 0}}
.tutor-card h3{{font-size:16px;font-weight:700;color:var(--primary);margin-bottom:6px}}
.tutor-card p{{font-size:13px;color:var(--text2);margin-bottom:14px}}
.tutor-btns{{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}}
.tutor-btn{{padding:7px 14px;border:1.5px solid var(--primary);border-radius:20px;font-size:12px;color:var(--primary);background:rgba(59,130,246,.08);cursor:pointer;transition:all .2s}}
.tutor-btn:hover{{background:var(--primary);color:#fff}}
.phase-btn,.zone-btn{{padding:7px 14px;border:1.5px solid var(--border);border-radius:20px;font-size:13px;cursor:pointer;background:var(--card);transition:all .2s}}
.phase-btn.active,.zone-btn.active{{background:var(--primary);color:#fff;border-color:var(--primary)}}
.drag-item{{padding:8px 14px;background:var(--card);border:1.5px solid var(--border);border-radius:8px;cursor:grab;font-size:13px}}
.drag-item:active{{cursor:grabbing}}
.drop-zone{{min-height:80px;border:2px dashed var(--border);border-radius:12px;padding:10px}}
.zone-title{{font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px}}
.canvas-wrap{{background:#1e293b;border-radius:12px;overflow:hidden}}
canvas{{display:block;width:100%;touch-action:none}}
#knowledge-graph{{background:#1e293b;border-radius:14px;padding:16px;margin:20px 0;min-height:100px;display:flex;align-items:center;justify-content:center}}
</style>
</head>
<body>
<nav class="sticky-nav">
  <a href="#objectives">🎯 目标</a>
  <a href="#pretest">📝 前测</a>
  <a href="#module1">📖 核心</a>
  <a href="#module-interactive">🎛️ 互动</a>
  <a href="#errors">⚠️ 易错</a>
  <a href="#posttest">✅ 后测</a>
</nav>
<div class="container">
  <section class="hero">
    <div class="tags"><span class="tag">{c['tag1']}</span><span class="tag">{c['tag2']}</span><span class="tag">{c['name']}</span></div>
    <h1>{c['emoji']} {c['name']}</h1>
    <p>{c['abt_and']} · {c['abt_but']} · {c['abt_therefore']}</p>
  </section>

  <section class="section" id="objectives">
    <h2>🎯 学习目标</h2>
    <div class="obj-grid">{obj_html}</div>
  </section>

  <section class="section" id="pretest">
    <h2>📝 前测</h2>
    {''.join(opts_html[:1])}
  </section>

  <section class="section" id="module1">
    <h2>📖 {c['modules'][0]['title']}</h2>
    <div class="card"><h3>ABT 引入</h3>
      <p><strong>已知：</strong>{c['abt_and']}</p>
      <p><strong>问题：</strong>{c['abt_but']}</p>
      <p><strong>解法：</strong>{c['abt_therefore']}</p>
    </div>
    <div class="card"><h3>核心步骤</h3>
      <div class="steps">{steps_html}</div>
      <div class="formula-block">{c['modules'][0]['formula']}</div>
    </div>
  </section>

  {interactive_html}

  <section class="section" id="errors">
    <h2>⚠️ 易错点</h2>
    <div class="error-grid">{errors_html}</div>
  </section>

  <section class="section" id="posttest">
    <h2>✅ 后测</h2>
    {''.join(opts_html[1:])}
    <div class="tutor-card" data-teachany-tutor-card>
      <h3>🤖 AI 学伴</h3>
      <p>有疑问？点击提问！</p>
      <div class="tutor-btns">
        <button class="tutor-btn">这节课最难的是哪里？</button>
        <button class="tutor-btn">给我出一道练习题</button>
        <button class="tutor-btn">用生活例子解释{c['name']}</button>
      </div>
    </div>
  </section>
  {phet_section}
  <section class="section">
    <h2>📌 小结</h2>
    <div class="summary-box"><ul>{summary_html}</ul></div>
  </section>
  <section id="knowledge-graph">
    <div data-teachany-kg="{c['node_id']}"><canvas class="tkg-fallback-canvas" width="720" height="100"></canvas></div>
  </section>
</div>
<script>
const correctAnswers={correct_js};
function answer(el,qid,val){{
  const card=document.getElementById(qid);
  if(card.querySelector('.correct')||card.querySelector('.wrong')) return;
  const correct=correctAnswers[qid];
  if(val===correct){{el.classList.add('correct');el.innerHTML+=' ✓';}}
  else{{el.classList.add('wrong');el.innerHTML+=' ✗';
    card.querySelectorAll('.option').forEach(o=>{{if(o.textContent.trim().startsWith(correct))o.classList.add('correct');}})}}
}}
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{{
  if(e.isIntersecting) document.querySelectorAll('.sticky-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));
}}),[]);
document.querySelectorAll('section[id]').forEach(s=>obs.observe(s));
</script>
<script>
window.__TEACHANY_TUTOR_CONFIG__={{courseTitle:'{c['name']}',subject:'{c['subject']}',grade:{c['grade']},learningObjectives:{json.dumps([o[1] for o in c['objectives']])},getContext:()=>'{c['name']}相关内容'}};
</script>
<link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">
<link rel="stylesheet" href="../../scripts/ai-tutor.css">
<link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">
<link rel="stylesheet" href="../../scripts/teachany-tts-narrator.css">
<link rel="stylesheet" href="../../scripts/teachany-section-hints.css">
<script src="../../scripts/ai-tutor.js" defer></script>
<script src="../../scripts/teachany-tutor-card.js" defer></script>
<script src="../../scripts/teachany-tts-narrator.js" defer></script>
<script src="../../scripts/teachany-section-hints.js" defer></script>
<script src="../../scripts/teachany-knowledge-graph.js" defer></script>
</body>
</html>'''


def make_manifest(c):
    return {
        "course_id": c['id'],
        "node_id": c['node_id'],
        "name": c['name'],
        "subject": c['subject'],
        "grade": c['grade'],
        "curriculum": "cn-national" if c['subject'] in ('mathematics','physics','chemistry','biology','geography','history') else "ib",
        "teachany_version": "7.9.14",
        "status": "community",
        "created": "2026-05-10"
    }


if __name__ == '__main__':
    created = []
    for c in COURSES:
        course_dir = os.path.join(BASE, c['id'])
        os.makedirs(course_dir, exist_ok=True)
        html = make_html(c)
        with open(os.path.join(course_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(html)
        with open(os.path.join(course_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
            json.dump(make_manifest(c), f, ensure_ascii=False, indent=2)
        created.append(c['id'])
        print(f'✅ {c["id"]}  ({c["name"]})')
    print(f'\n共生成 {len(created)} 个课件')
