#!/usr/bin/env python3
"""批次3-1：高中数学按 2017 修订 2020 版高中数学课标重构"""
import json
from pathlib import Path

p = Path('data/trees/math-high.json')
t = json.load(open(p, encoding='utf-8'))

id2node = {}
for d in t['domains']:
    for n in d['nodes']:
        id2node[n['id']] = n

def pick(nid, prereqs=None, grade=None, name=None):
    if nid not in id2node: return None
    n = dict(id2node[nid])
    if prereqs is not None: n['prerequisites'] = prereqs
    if grade is not None: n['grade'] = grade
    if name is not None: n['name'] = name
    n['extends'] = []; n['parallel'] = []
    return n

# 域1：预备知识（集合、逻辑、不等式）
prep = {
    'id': 'sets-logic', 'name': '预备知识（集合·逻辑·不等式）', 'color': '#06b6d4',
    'nodes': [
        pick('math-h-sets',               [], 10, name='集合'),
        pick('math-h-sets-logic',         ['math-h-sets'], 10, name='集合运算'),
        pick('math-h-propositions',       ['math-h-sets'], 10, name='常用逻辑用语'),
        pick('math-h-inequalities',       ['math-h-sets'], 10, name='不等式性质'),
        pick('math-h-basic-inequality',   ['math-h-inequalities'], 10, name='基本不等式'),
        pick('math-h-linear-programming', ['math-h-inequalities'], 10, name='线性规划'),
    ]
}

# 域2：函数（含指对幂 + 高级函数 + 模型）
functions = {
    'id': 'functions', 'name': '函数', 'color': '#3b82f6',
    'nodes': [
        pick('math-h-functions-concept',  ['math-h-sets'], 10, name='函数概念'),
        pick('math-h-function-properties',['math-h-functions-concept'], 10, name='函数性质（单调性/奇偶性）'),
        pick('math-h-power-function',     ['math-h-function-properties'], 10, name='幂函数'),
        pick('math-h-exponential-function',['math-h-function-properties'], 10, name='指数函数'),
        pick('math-h-logarithmic-function',['math-h-exponential-function'], 10, name='对数函数'),
        pick('math-h-functions-advanced', ['math-h-logarithmic-function', 'math-h-power-function'], 10, name='函数综合性质'),
        pick('math-h-function-models',    ['math-h-functions-advanced'], 10, name='函数模型及其应用'),
    ]
}

# 域3：三角函数
trig = {
    'id': 'trigonometry', 'name': '三角函数', 'color': '#f59e0b',
    'nodes': [
        pick('math-h-trig-ratios',         ['math-h-function-properties'], 10, name='任意角与三角函数定义'),
        pick('math-h-trig-identities',     ['math-h-trig-ratios'], 10, name='三角恒等变换'),
        pick('math-h-trig-graphs',         ['math-h-trig-identities'], 10, name='三角函数图像与性质'),
        pick('math-h-trigonometric-functions',['math-h-trig-graphs'], 10, name='三角函数综合应用'),
        pick('math-h-law-of-sines-cosines',['math-h-trig-graphs'], 10, name='正弦定理与余弦定理'),
        pick('math-h-trigonometry-solution',['math-h-law-of-sines-cosines'], 11, name='解三角形'),
    ]
}

# 域4：向量
vectors = {
    'id': 'vectors-h', 'name': '向量', 'color': '#8b5cf6',
    'nodes': [
        pick('math-h-vector-basics',       [], 10, name='平面向量的概念与运算'),
        pick('math-h-vector-coordinates',  ['math-h-vector-basics'], 10, name='平面向量的坐标运算'),
    ]
}

# 域5：数列
sequences = {
    'id': 'sequences', 'name': '数列', 'color': '#ec4899',
    'nodes': [
        pick('math-h-arithmetic-sequence', ['math-h-functions-concept'], 10, name='等差数列'),
        pick('math-h-geometric-sequence',  ['math-h-arithmetic-sequence'], 10, name='等比数列'),
        pick('math-h-sequence-summation',  ['math-h-geometric-sequence'], 10, name='数列求和'),
    ]
}

# 域6：立体几何
solid_geo = {
    'id': 'solid-geometry', 'name': '立体几何', 'color': '#10b981',
    'nodes': [
        pick('math-h-space-figures',       [], 11, name='空间几何体的结构'),
        pick('math-h-space-lines-planes',  ['math-h-space-figures'], 11, name='空间点线面位置关系'),
        pick('math-h-parallel-perpendicular',['math-h-space-lines-planes'], 11, name='平行与垂直的判定'),
        pick('math-h-dihedral-angle',      ['math-h-parallel-perpendicular'], 11, name='二面角'),
        pick('math-h-space-vectors',       ['math-h-dihedral-angle', 'math-h-vector-coordinates'], 11, name='空间向量及其应用'),
    ]
}

# 域7：解析几何
analytic_geo = {
    'id': 'analytic-geometry', 'name': '解析几何', 'color': '#a855f7',
    'nodes': [
        pick('math-h-line-equation',       ['math-h-vector-coordinates'], 11, name='直线方程与位置关系'),
        pick('math-h-circle-equation',     ['math-h-line-equation'], 11, name='圆的方程'),
        pick('math-h-analytic-geometry',   ['math-h-circle-equation'], 11, name='解析几何综合'),
        pick('math-h-ellipse',             ['math-h-circle-equation'], 11, name='椭圆'),
        pick('math-h-hyperbola',           ['math-h-ellipse'], 11, name='双曲线'),
        pick('math-h-parabola-h',          ['math-h-ellipse'], 11, name='抛物线'),
        pick('math-h-conic-comprehensive', ['math-h-hyperbola', 'math-h-parabola-h'], 12, name='圆锥曲线综合'),
    ]
}

# 域8：概率与统计
prob_stats = {
    'id': 'probability-stats', 'name': '概率与统计', 'color': '#f97316',
    'nodes': [
        pick('math-h-counting-principles', ['math-h-sets'], 11, name='计数原理（分类/分步）'),
        pick('math-h-binomial-theorem',    ['math-h-counting-principles'], 11, name='二项式定理'),
        pick('math-h-probability-h',       ['math-h-counting-principles'], 11, name='概率'),
        pick('math-h-random-variable',     ['math-h-probability-h'], 12, name='随机变量及其分布'),
        pick('math-h-regression-analysis', ['math-h-random-variable'], 12, name='统计推断（回归/独立性检验）'),
    ]
}

# 域9：导数（微积分初步）
calculus = {
    'id': 'calculus', 'name': '导数与微积分初步', 'color': '#dc2626',
    'nodes': [
        pick('math-h-derivative-concept',     ['math-h-function-models'], 12, name='导数概念与运算'),
        pick('math-h-derivative-application', ['math-h-derivative-concept'], 12, name='导数应用（极值/最值）'),
    ]
}

new_domains = []
for d in [prep, functions, trig, vectors, sequences, solid_geo, analytic_geo, prob_stats, calculus]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 高中数学重构：{len(new_domains)} 域")
total = 0
for d in new_domains:
    print(f"  【{d['name']}】{len(d['nodes'])} 节点")
    total += len(d['nodes'])
print(f"节点总数：{total}")

old_ids = set(id2node.keys())
new_ids = set(n['id'] for d in new_domains for n in d['nodes'])
orphan = old_ids - new_ids
if orphan: print(f"⚠ 未分配：{orphan}")
else: print("✅ 全部节点已归位")
