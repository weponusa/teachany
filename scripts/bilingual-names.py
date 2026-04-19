#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量为 manifest.json 和 knowledge tree 节点补英文名 (name_en)。

策略：
1. 维护一个 ZH→EN 术语映射字典（覆盖 K-12 核心概念约 300 个）
2. 对每个缺 name_en 的节点/manifest：
   a. 尝试完整匹配（整句 = 词条）
   b. 尝试关键词匹配（zh 包含词条 → 用该词条的 en）
   c. fallback：空字符串（不阻塞，UI 兜底为单语）

用法：
  python3 scripts/bilingual-names.py              # dry-run
  python3 scripts/bilingual-names.py --apply      # 实际写入
  python3 scripts/bilingual-names.py --trees      # 只处理知识树节点
  python3 scripts/bilingual-names.py --manifests  # 只处理课件 manifest
"""
import json
import glob
import sys
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────────────────────
# K-12 核心术语中英对照表（按学科分组，从长到短排序以优先匹配长词）
# ─────────────────────────────────────────────────────────────
TERM_MAP = {
    # 数学 Math
    "一次函数": "Linear Function",
    "二次函数": "Quadratic Function",
    "反比例函数": "Inverse Proportion Function",
    "指数函数": "Exponential Function",
    "对数函数": "Logarithmic Function",
    "三角函数": "Trigonometric Functions",
    "幂函数": "Power Function",
    "复合函数": "Composite Function",
    "函数的概念": "Concept of Function",
    "函数概念": "Concept of Function",
    "函数的性质": "Properties of Functions",
    "函数性质": "Properties of Functions",
    "函数的表示": "Function Representation",
    "函数与方程": "Functions and Equations",
    "函数的应用": "Applications of Functions",
    "线性规划": "Linear Programming",
    "数列求和": "Series Summation",
    "均值不等式": "Mean Inequality",
    "柯西不等式": "Cauchy Inequality",
    "简单几何体": "Simple Geometric Solids",
    "空间几何": "Space Geometry",
    "空间直角坐标系": "3D Cartesian Coordinates",
    "空间向量与立体几何": "Vectors and Solid Geometry",
    "数的认识": "Number Sense",
    "数的运算": "Number Operations",
    "运算律": "Operation Laws",
    "口算": "Mental Arithmetic",
    "笔算": "Written Calculation",
    "估算": "Estimation",
    "乘法口诀": "Multiplication Tables",
    "表内乘法": "Multiplication Facts",
    "表内除法": "Division Facts",
    "小数点": "Decimal Point",
    "分数加减法": "Addition and Subtraction of Fractions",
    "分数乘除法": "Multiplication and Division of Fractions",
    "分数的意义": "Meaning of Fractions",
    "小数的意义": "Meaning of Decimals",
    "小数运算": "Decimal Operations",
    "小数乘法": "Decimal Multiplication",
    "小数除法": "Decimal Division",
    "小数四则运算": "Four Operations of Decimals",
    "四则运算": "Four Operations",
    "应用题": "Word Problems",
    "单位换算": "Unit Conversion",
    "时间": "Time",
    "货币": "Money",
    "长度": "Length",
    "重量": "Weight",
    "质量": "Mass",
    "容量": "Capacity",
    "角的认识": "Understanding Angles",
    "位置与方向": "Position and Direction",
    "观察物体": "Observing Objects",
    "图形运动": "Transformations",
    "图形变换": "Transformations",
    "统计图": "Statistical Charts",
    "条形统计图": "Bar Charts",
    "折线统计图": "Line Charts",
    "扇形统计图": "Pie Charts",
    "平均数": "Mean",
    "中位数": "Median",
    "众数": "Mode",
    "随机事件": "Random Events",
    "古典概型": "Classical Probability",
    "独立重复": "Independent Trials",
    "标准差": "Standard Deviation",
    "方差": "Variance",
    "正态分布": "Normal Distribution",
    "二项分布": "Binomial Distribution",
    "独立性检验": "Independence Test",
    "线性回归": "Linear Regression",
    # 语文补充
    "识字": "Literacy",
    "写字": "Writing Chinese Characters",
    "朗读": "Reading Aloud",
    "背诵": "Recitation",
    "默写": "Dictation",
    "口语交际": "Oral Communication",
    "综合性学习": "Comprehensive Learning",
    "名著阅读": "Classic Literature Reading",
    "整本书阅读": "Whole Book Reading",
    "文学鉴赏": "Literary Appreciation",
    "名言警句": "Famous Sayings",
    # 化学补充
    "物质的量": "Amount of Substance",
    "物质分类": "Classification of Matter",
    "溶液浓度": "Solution Concentration",
    "盐的水解": "Hydrolysis of Salts",
    "离子反应": "Ionic Reactions",
    "胶体": "Colloids",
    "晶体": "Crystals",
    "同分异构": "Isomerism",
    # 英语补充
    "日常用语": "Daily Expressions",
    "情景对话": "Situational Dialogues",
    "阅读策略": "Reading Strategies",
    "写作技巧": "Writing Skills",
    # 物理补充
    "曲线运动": "Curvilinear Motion",
    "圆周运动": "Circular Motion",
    "抛体运动": "Projectile Motion",
    "机械振动": "Mechanical Vibration",
    "机械波": "Mechanical Waves",
    "光的折射": "Refraction of Light",
    "光的反射": "Reflection of Light",
    # 生物补充
    "人体": "Human Body",
    "血液循环": "Blood Circulation",
    "神经调节": "Neural Regulation",
    "激素调节": "Hormonal Regulation",
    "免疫": "Immunity",
    "植物": "Plants",
    "动物": "Animals",
    "微生物": "Microorganisms",
    "生态": "Ecology",
    # 通用
    "的认识": "Understanding",
    "的运算": "Operations",
    "的表示": "Representation",
    "的应用": "Applications",
    "运算": "Operations",
    "认识": "Understanding",
    "综合": "Integration",
    "全等三角形": "Congruent Triangles",
    "相似三角形": "Similar Triangles",
    "圆锥曲线": "Conic Sections",
    "椭圆": "Ellipse",
    "双曲线": "Hyperbola",
    "抛物线": "Parabola",
    "圆的方程": "Equation of Circle",
    "集合": "Sets",
    "逻辑": "Logic",
    "不等式": "Inequalities",
    "解三角形": "Solving Triangles",
    "正弦定理": "Law of Sines",
    "余弦定理": "Law of Cosines",
    "向量": "Vectors",
    "平面向量": "Plane Vectors",
    "空间向量": "Space Vectors",
    "立体几何": "Solid Geometry",
    "平面几何": "Plane Geometry",
    "解析几何": "Analytic Geometry",
    "数列": "Sequences",
    "等差数列": "Arithmetic Sequence",
    "等比数列": "Geometric Sequence",
    "导数": "Derivatives",
    "微分": "Differentiation",
    "积分": "Integration",
    "定积分": "Definite Integral",
    "不定积分": "Indefinite Integral",
    "概率": "Probability",
    "统计": "Statistics",
    "概率统计": "Probability and Statistics",
    "排列组合": "Permutations and Combinations",
    "二项式定理": "Binomial Theorem",
    "复数": "Complex Numbers",
    "矩阵": "Matrices",
    "行列式": "Determinants",
    "坐标系": "Coordinate System",
    "极坐标": "Polar Coordinates",
    "参数方程": "Parametric Equations",
    "平面直角坐标系": "Cartesian Coordinate System",
    "方程": "Equations",
    "一元二次方程": "Quadratic Equations",
    "分式方程": "Fractional Equations",
    "有理数": "Rational Numbers",
    "无理数": "Irrational Numbers",
    "实数": "Real Numbers",
    "整式": "Polynomials",
    "分式": "Fractions",
    "多项式": "Polynomials",
    "因式分解": "Factoring",
    "平方根": "Square Root",
    "立方根": "Cube Root",
    "百以内加减法": "Addition and Subtraction within 100",
    "100以内加减法": "Addition and Subtraction within 100",
    "乘除法": "Multiplication and Division",
    "分数": "Fractions",
    "小数": "Decimals",
    "负数": "Negative Numbers",
    "比例": "Proportions",
    "百分数": "Percentages",
    "图形与几何": "Shapes and Geometry",
    "角": "Angles",
    "三角形": "Triangles",
    "四边形": "Quadrilaterals",
    "多边形": "Polygons",
    "圆": "Circle",
    "球": "Sphere",
    "面积": "Area",
    "周长": "Perimeter",
    "体积": "Volume",
    "表面积": "Surface Area",
    "对称": "Symmetry",
    "旋转": "Rotation",
    "平移": "Translation",
    "反射": "Reflection",
    
    # 物理 Physics
    "运动学": "Kinematics",
    "动力学": "Dynamics",
    "力学": "Mechanics",
    "牛顿运动定律": "Newton's Laws of Motion",
    "牛顿定律": "Newton's Laws",
    "万有引力": "Universal Gravitation",
    "能量守恒": "Energy Conservation",
    "动量守恒": "Momentum Conservation",
    "动量": "Momentum",
    "冲量": "Impulse",
    "功": "Work",
    "功率": "Power",
    "动能": "Kinetic Energy",
    "势能": "Potential Energy",
    "机械能": "Mechanical Energy",
    "简谐运动": "Simple Harmonic Motion",
    "波动": "Wave Motion",
    "机械波": "Mechanical Waves",
    "电磁波": "Electromagnetic Waves",
    "光学": "Optics",
    "几何光学": "Geometric Optics",
    "波动光学": "Wave Optics",
    "光的反射": "Reflection of Light",
    "光的折射": "Refraction of Light",
    "光的干涉": "Light Interference",
    "光的衍射": "Light Diffraction",
    "电场": "Electric Field",
    "磁场": "Magnetic Field",
    "电磁感应": "Electromagnetic Induction",
    "静电场": "Electrostatic Field",
    "电路": "Circuits",
    "欧姆定律": "Ohm's Law",
    "电阻": "Resistance",
    "电流": "Electric Current",
    "电压": "Voltage",
    "电势": "Electric Potential",
    "电容": "Capacitance",
    "交流电": "Alternating Current",
    "直流电": "Direct Current",
    "压强": "Pressure",
    "液体压强": "Liquid Pressure",
    "大气压强": "Atmospheric Pressure",
    "浮力": "Buoyancy",
    "密度": "Density",
    "温度": "Temperature",
    "热": "Heat",
    "热力学": "Thermodynamics",
    "热力学定律": "Laws of Thermodynamics",
    "理想气体": "Ideal Gas",
    "气体定律": "Gas Laws",
    "分子动理论": "Kinetic Theory",
    "摩擦力": "Friction",
    "弹力": "Elastic Force",
    "重力": "Gravity",
    "加速度": "Acceleration",
    "速度": "Velocity",
    "位移": "Displacement",
    "力": "Force",
    "原子": "Atom",
    "原子结构": "Atomic Structure",
    "原子核": "Atomic Nucleus",
    "核反应": "Nuclear Reactions",
    "放射性": "Radioactivity",
    "量子力学": "Quantum Mechanics",
    "光电效应": "Photoelectric Effect",
    "相对论": "Relativity",
    "流体": "Fluids",
    
    # 化学 Chemistry
    "化学反应": "Chemical Reactions",
    "氧化还原反应": "Redox Reactions",
    "元素周期表": "Periodic Table",
    "化学键": "Chemical Bonds",
    "离子键": "Ionic Bond",
    "共价键": "Covalent Bond",
    "金属键": "Metallic Bond",
    "酸碱": "Acids and Bases",
    "酸碱中和": "Neutralization",
    "盐": "Salts",
    "电解质": "Electrolytes",
    "溶液": "Solutions",
    "溶解度": "Solubility",
    "化学平衡": "Chemical Equilibrium",
    "反应速率": "Reaction Rate",
    "催化剂": "Catalysts",
    "化学能": "Chemical Energy",
    "热化学": "Thermochemistry",
    "有机化学": "Organic Chemistry",
    "无机化学": "Inorganic Chemistry",
    "碳氢化合物": "Hydrocarbons",
    "烃": "Hydrocarbons",
    "烷烃": "Alkanes",
    "烯烃": "Alkenes",
    "炔烃": "Alkynes",
    "醇": "Alcohols",
    "醛": "Aldehydes",
    "酮": "Ketones",
    "羧酸": "Carboxylic Acids",
    "酯": "Esters",
    "蛋白质": "Proteins",
    "氨基酸": "Amino Acids",
    "糖类": "Carbohydrates",
    "脂质": "Lipids",
    "聚合物": "Polymers",
    "电化学": "Electrochemistry",
    "金属": "Metals",
    "非金属": "Nonmetals",
    "过渡金属": "Transition Metals",
    "碱金属": "Alkali Metals",
    "碱土金属": "Alkaline Earth Metals",
    "卤素": "Halogens",
    "化学式": "Chemical Formulas",
    "化学方程式": "Chemical Equations",
    "摩尔": "Moles",
    "化学计量": "Stoichiometry",
    
    # 生物 Biology
    "细胞": "Cells",
    "细胞结构": "Cell Structure",
    "细胞膜": "Cell Membrane",
    "细胞器": "Organelles",
    "细胞周期": "Cell Cycle",
    "细胞分裂": "Cell Division",
    "有丝分裂": "Mitosis",
    "减数分裂": "Meiosis",
    "DNA": "DNA",
    "RNA": "RNA",
    "蛋白质合成": "Protein Synthesis",
    "基因": "Genes",
    "基因表达": "Gene Expression",
    "遗传": "Heredity",
    "遗传学": "Genetics",
    "变异": "Variation",
    "进化": "Evolution",
    "自然选择": "Natural Selection",
    "物种": "Species",
    "生态系统": "Ecosystems",
    "生物圈": "Biosphere",
    "食物链": "Food Chain",
    "食物网": "Food Web",
    "光合作用": "Photosynthesis",
    "呼吸作用": "Cellular Respiration",
    "细胞呼吸": "Cellular Respiration",
    "呼吸系统": "Respiratory System",
    "循环系统": "Circulatory System",
    "消化系统": "Digestive System",
    "神经系统": "Nervous System",
    "内分泌系统": "Endocrine System",
    "免疫系统": "Immune System",
    "激素": "Hormones",
    "酶": "Enzymes",
    "新陈代谢": "Metabolism",
    "生物多样性": "Biodiversity",
    "无性生殖": "Asexual Reproduction",
    "有性生殖": "Sexual Reproduction",
    "花的结构": "Flower Structure",
    "传粉": "Pollination",
    "种子": "Seeds",
    "果实": "Fruits",
    "显微镜": "Microscope",
    "显微镜的使用": "Using a Microscope",
    "生物的特征": "Characteristics of Living Organisms",
    "蒸腾作用": "Transpiration",
    "叶片": "Leaves",
    "叶片结构": "Leaf Structure",
    "根": "Roots",
    "茎": "Stems",
    
    # 地理 Geography
    "地球": "Earth",
    "地壳": "Earth's Crust",
    "板块构造": "Plate Tectonics",
    "气候": "Climate",
    "季风": "Monsoon",
    "气候类型": "Climate Types",
    "大气": "Atmosphere",
    "水文": "Hydrology",
    "河流": "Rivers",
    "海洋": "Oceans",
    "地形": "Landforms",
    "山脉": "Mountains",
    "平原": "Plains",
    "高原": "Plateaus",
    "经纬度": "Latitude and Longitude",
    "地图": "Maps",
    "人口": "Population",
    "城市": "Cities",
    "农业": "Agriculture",
    "工业": "Industry",
    
    # 历史 History
    "古代史": "Ancient History",
    "近代史": "Modern History",
    "现代史": "Contemporary History",
    "中国古代史": "Ancient Chinese History",
    "世界古代史": "Ancient World History",
    "文艺复兴": "Renaissance",
    "工业革命": "Industrial Revolution",
    "两次世界大战": "Two World Wars",
    "冷战": "Cold War",
    "古典文明": "Classical Civilizations",
    "希腊": "Ancient Greece",
    "罗马": "Ancient Rome",
    "秦朝": "Qin Dynasty",
    "汉朝": "Han Dynasty",
    "唐朝": "Tang Dynasty",
    "宋朝": "Song Dynasty",
    "明朝": "Ming Dynasty",
    "清朝": "Qing Dynasty",
    
    # 语文 Chinese
    "拼音": "Pinyin",
    "声母": "Initials",
    "韵母": "Finals",
    "复韵母": "Compound Finals",
    "前鼻韵母": "Front Nasal Finals",
    "后鼻韵母": "Back Nasal Finals",
    "汉字": "Chinese Characters",
    "汉字结构": "Character Structure",
    "偏旁部首": "Radicals",
    "笔画": "Strokes",
    "笔顺": "Stroke Order",
    "古诗": "Classical Poetry",
    "古诗词": "Classical Chinese Poetry",
    "文言文": "Classical Chinese",
    "小古文": "Elementary Classical Chinese",
    "现代文": "Modern Chinese",
    "阅读": "Reading",
    "阅读理解": "Reading Comprehension",
    "写作": "Writing",
    "作文": "Composition",
    "记叙文": "Narrative Writing",
    "说明文": "Expository Writing",
    "议论文": "Argumentative Writing",
    "应用文": "Practical Writing",
    "标点符号": "Punctuation",
    "修辞": "Rhetoric",
    "修辞手法": "Rhetorical Devices",
    "比喻": "Metaphor",
    "拟人": "Personification",
    "夸张": "Hyperbole",
    "排比": "Parallelism",
    "反问": "Rhetorical Question",
    "名言": "Famous Quotes",
    "成语": "Chinese Idioms",
    "谚语": "Proverbs",
    
    # 英语 English
    "音标": "Phonetics",
    "元音": "Vowels",
    "辅音": "Consonants",
    "字母": "Letters",
    "词汇": "Vocabulary",
    "语法": "Grammar",
    "时态": "Tenses",
    "一般现在时": "Simple Present",
    "一般过去时": "Simple Past",
    "现在进行时": "Present Continuous",
    "现在完成时": "Present Perfect",
    "将来时": "Future Tense",
    "被动语态": "Passive Voice",
    "从句": "Clauses",
    "定语从句": "Relative Clauses",
    "宾语从句": "Object Clauses",
    "状语从句": "Adverbial Clauses",
    "名词": "Nouns",
    "动词": "Verbs",
    "形容词": "Adjectives",
    "副词": "Adverbs",
    "介词": "Prepositions",
    "连词": "Conjunctions",
    "冠词": "Articles",
    "代词": "Pronouns",
    "听力": "Listening",
    "口语": "Speaking",
    "完形填空": "Cloze Test",
    
    # 通用后缀
    "的概念": "Concept",
    "的应用": "Applications",
    "的性质": "Properties",
    "的结构": "Structure",
    "的特征": "Characteristics",
}

# 按 key 长度倒序（优先匹配长词）
SORTED_TERMS = sorted(TERM_MAP.items(), key=lambda x: -len(x[0]))


def translate(zh: str) -> str:
    """根据 zh 字符串匹配关键词翻译为 en"""
    if not zh:
        return ""
    # 1. 完整匹配（去掉括号注释后）
    clean = re.sub(r'[（(].*?[）)]', '', zh).strip()
    if clean in TERM_MAP:
        return TERM_MAP[clean]
    # 2. 关键词匹配（遍历按长度倒序的词条）
    matched_terms = []
    matched_positions = set()
    for zh_term, en_term in SORTED_TERMS:
        if zh_term in zh:
            # 找到所有出现位置
            pos = zh.find(zh_term)
            if pos >= 0 and not any(p <= pos < p + ln for p, ln in matched_positions):
                matched_terms.append(en_term)
                matched_positions.add((pos, len(zh_term)))
    if matched_terms:
        return ' / '.join(matched_terms[:3])  # 最多 3 个术语拼接
    return ""


def process_trees(apply: bool):
    """给所有 knowledge tree 节点补 name_en"""
    files = sorted(glob.glob(str(ROOT / 'data/trees/*.json')))
    files += sorted(glob.glob(str(ROOT / 'data/trees/international/*.json')))
    total_nodes = 0
    added = 0
    files_changed = 0
    for f in files:
        if '_backup' in f or '_template' in f: continue
        d = json.load(open(f, encoding='utf-8'))
        changed_this_file = False
        for dom in d.get('domains', []):
            for n in dom.get('nodes', []):
                total_nodes += 1
                if not n.get('name_en'):
                    en = translate(n.get('name', ''))
                    if en:
                        n['name_en'] = en
                        added += 1
                        changed_this_file = True
        if apply and changed_this_file:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
            files_changed += 1
    print(f'  Trees: {total_nodes} 节点; 补译 {added} 个; {"写入" if apply else "dry-run"} {files_changed} 个文件')


def process_manifests(apply: bool):
    """给所有 examples/*/manifest.json 补 name_en"""
    files = sorted(glob.glob(str(ROOT / 'examples/*/manifest.json')))
    total = 0
    added = 0
    for f in files:
        try:
            m = json.load(open(f, encoding='utf-8'))
        except: continue
        total += 1
        if not m.get('name_en'):
            en = translate(m.get('name', ''))
            if en:
                m['name_en'] = en
                added += 1
                if apply:
                    json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'  Manifests: {total} 课件; 补译 {added} 个; {"已写入" if apply else "dry-run"}')


def main():
    apply = '--apply' in sys.argv
    only_trees = '--trees' in sys.argv
    only_manifests = '--manifests' in sys.argv
    print(f'Mode: {"APPLY (写入)" if apply else "DRY-RUN"}')
    if not only_manifests:
        process_trees(apply)
    if not only_trees:
        process_manifests(apply)
    if not apply:
        print('\n⚠ 这是 dry-run，未实际写入。加 --apply 生效。')


if __name__ == '__main__':
    main()
