#!/usr/bin/env python3
"""批次2-1：初中数学按 2022 版义务教育数学课标重构（4 主题）"""
import json
from pathlib import Path

p = Path('data/trees/math-middle.json')
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

# ==== 域1：数与代数 ====
number_algebra = {
    'id': 'number-algebra', 'name': '数与代数', 'color': '#3b82f6',
    'nodes': [
        # 数与式
        pick('math-m-rational-number',         [], 7, name='有理数'),
        pick('math-m-rational-operations',     ['math-m-rational-number'], 7, name='有理数运算'),
        pick('math-m-algebraic-expression',    ['math-m-rational-operations'], 7, name='代数式与整式'),
        pick('math-m-algebraic-expressions',   ['math-m-algebraic-expression'], 7, name='整式加减'),
        pick('math-m-real-number',             ['math-m-rational-number'], 7, name='实数与数轴'),
        pick('math-m-monomial-multiplication', ['math-m-algebraic-expression'], 8, name='整式乘除与因式分解'),
        pick('math-m-fraction-expression',     ['math-m-monomial-multiplication'], 8, name='分式'),
        pick('math-m-quadratic-radical',       ['math-m-real-number', 'math-m-monomial-multiplication'], 8, name='二次根式'),
        # 方程与不等式
        pick('math-m-linear-equation-one',     ['math-m-algebraic-expression'], 7, name='一元一次方程'),
        pick('math-m-linear-equations',        ['math-m-linear-equation-one'], 7, name='一元一次方程应用'),
        pick('math-m-inequalities',            ['math-m-linear-equation-one'], 7, name='不等式初步'),
        pick('math-m-linear-inequality',       ['math-m-inequalities'], 8, name='一元一次不等式'),
        pick('math-m-linear-equation-two',     ['math-m-linear-equation-one'], 8, name='二元一次方程组'),
        pick('math-m-fraction-equation',       ['math-m-fraction-expression', 'math-m-linear-equation-one'], 8, name='分式方程'),
        pick('math-m-quadratic-equation',      ['math-m-quadratic-radical'], 9, name='一元二次方程'),
        # 函数
        pick('math-m-coordinate-system',       ['math-m-rational-number'], 7, name='平面直角坐标系'),
        pick('math-m-variable-and-function',   ['math-m-coordinate-system', 'math-m-algebraic-expression'], 8, name='变量与函数'),
        pick('math-m-proportional-function',   ['math-m-variable-and-function'], 8, name='正比例函数'),
        pick('math-m-linear-function',         ['math-m-proportional-function', 'math-m-linear-equation-one'], 8, name='一次函数'),
        pick('math-m-linear-equation-system-graph',['math-m-linear-function', 'math-m-linear-equation-two'], 8, name='一次函数与二元一次方程组'),
        pick('math-m-inverse-proportion',      ['math-m-linear-function', 'math-m-fraction-expression'], 9, name='反比例函数'),
        pick('math-m-quadratic-function',      ['math-m-linear-function', 'math-m-quadratic-equation'], 9, name='二次函数'),
    ]
}

# ==== 域2：图形与几何 ====
geometry = {
    'id': 'geometry', 'name': '图形与几何', 'color': '#10b981',
    'nodes': [
        # 图形认识
        pick('math-m-geometric-figure',        [], 7, name='几何图形初步'),
        pick('math-m-line-angle',              ['math-m-geometric-figure'], 7, name='相交线与平行线'),
        pick('math-m-triangle-basics',         ['math-m-line-angle'], 7, name='三角形基础'),
        pick('math-m-ruler-compass-construction',['math-m-line-angle'], 7, name='尺规作图'),
        pick('math-m-isosceles-triangle',      ['math-m-triangle-basics'], 8, name='等腰三角形与等边三角形'),
        pick('math-m-pythagorean-theorem',     ['math-m-triangle-basics', 'math-m-real-number'], 8, name='勾股定理'),
        pick('math-m-geometry-congruent-triangles',['math-m-triangle-basics'], 8, name='全等三角形'),
        pick('math-m-quadrilateral',           ['math-m-geometry-congruent-triangles'], 8, name='多边形与四边形'),
        pick('math-m-geometry-quadrilaterals', ['math-m-quadrilateral'], 8, name='四边形综合'),
        pick('math-m-special-quadrilateral',   ['math-m-quadrilateral'], 8, name='特殊四边形'),
        pick('math-m-similar-triangles',       ['math-m-pythagorean-theorem', 'math-m-quadratic-radical'], 9, name='相似三角形'),
        pick('math-m-trig-ratio',              ['math-m-similar-triangles'], 9, name='锐角三角函数'),
        # 图形变换
        pick('math-m-axial-symmetry',          ['math-m-line-angle'], 7, name='轴对称'),
        pick('math-m-rotation',                ['math-m-axial-symmetry', 'math-m-geometry-congruent-triangles'], 9, name='旋转'),
        pick('math-m-translation-dilation',    ['math-m-rotation', 'math-m-similar-triangles'], 9, name='平移与位似'),
        # 圆
        pick('math-m-circle-basics',           ['math-m-pythagorean-theorem'], 9, name='圆的基础'),
        pick('math-m-circle-angle',            ['math-m-circle-basics'], 9, name='圆周角与圆心角'),
        pick('math-m-arc-sector',              ['math-m-circle-angle'], 9, name='弧长与扇形面积'),
        pick('math-m-circle-tangent',          ['math-m-circle-basics', 'math-m-similar-triangles'], 9, name='直线与圆的位置关系'),
        pick('math-m-inscribed-circumscribed', ['math-m-circle-tangent', 'math-m-trig-ratio'], 9, name='三角形内切圆与外接圆'),
        pick('math-m-geometry-circle',         ['math-m-inscribed-circumscribed'], 9, name='圆的综合应用'),
    ]
}

# ==== 域3：统计与概率 ====
stats = {
    'id': 'statistics', 'name': '统计与概率', 'color': '#f59e0b',
    'nodes': [
        pick('math-m-data-collection',         [], 7, name='数据的收集'),
        pick('math-m-data-description',        ['math-m-data-collection'], 7, name='数据的描述'),
        pick('math-m-data-analysis',           ['math-m-data-description'], 8, name='数据的分析（均值/中位数/众数/方差）'),
        pick('math-m-sampling-estimation',     ['math-m-data-analysis'], 8, name='抽样与估计'),
        pick('math-m-probability-basic',       ['math-m-data-analysis'], 9, name='概率初步'),
        pick('math-m-probability-frequency',   ['math-m-probability-basic'], 9, name='频率与概率'),
        pick('math-m-statistics-probability-junior',['math-m-probability-frequency'], 9, name='统计与概率综合'),
    ]
}

# 过滤并组合
new_domains = []
for d in [number_algebra, geometry, stats]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中数学重构：{len(new_domains)} 域")
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
