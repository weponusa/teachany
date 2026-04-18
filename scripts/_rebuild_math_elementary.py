#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次1-1：小学数学按 2022 版义务教育数学课标重构
4 个主题领域：数与代数 / 图形与几何 / 统计与概率 / 综合与实践
"""
import json
from pathlib import Path

p = Path('data/trees/math-elementary.json')
t = json.load(open(p, encoding='utf-8'))

# 建立 id → 原节点 索引
id2node = {}
for d in t['domains']:
    for n in d['nodes']:
        id2node[n['id']] = n

def pick(nid, prereqs=None, grade=None, name=None):
    """从原树拿节点（保留 courses/status），应用新的 prereqs/grade"""
    if nid not in id2node:
        return None
    n = dict(id2node[nid])
    if prereqs is not None:
        n['prerequisites'] = prereqs
    if grade is not None:
        n['grade'] = grade
    if name is not None:
        n['name'] = name
    # 清掉 extends/parallel（原树这些也不可靠，先不用）
    n['extends'] = []
    n['parallel'] = []
    return n

# ============ 课标重构 ============

# 域1：数与代数（数感 → 运算 → 代数入门）
number_algebra = {
    'id': 'number-algebra',
    'name': '数与代数',
    'color': '#3b82f6',
    'nodes': [
        # 数的认识（第一学段 1-2年级）
        pick('math-e-numbers-within-10',          [], 1),
        pick('math-e-numbers-within-20',          ['math-e-numbers-within-10'], 1),
        pick('math-e-numbers-within-100',         ['math-e-numbers-within-20'], 1),
        pick('math-e-numbers-within-10000',       ['math-e-numbers-within-100'], 2),
        pick('math-e-large-numbers',              ['math-e-numbers-within-10000'], 4),

        # 加减乘除
        pick('math-e-addition-subtraction-within-20', ['math-e-numbers-within-20'], 1),
        pick('math-e-addition-subtraction-within-100',['math-e-addition-subtraction-within-20', 'math-e-numbers-within-100'], 2),
        pick('math-e-multi-digit-addition-subtraction',['math-e-addition-subtraction-within-100', 'math-e-numbers-within-10000'], 3,
             name='万以内加减法'),
        pick('math-e-multiplication-table',       ['math-e-addition-subtraction-within-100'], 2),
        pick('math-e-division-intro',             ['math-e-multiplication-table'], 2),
        pick('math-e-division-concept',           ['math-e-division-intro'], 2),
        pick('math-e-multi-digit-multiplication', ['math-e-multiplication-table', 'math-e-numbers-within-10000'], 3),
        pick('math-e-multi-digit-division',       ['math-e-division-concept', 'math-e-multi-digit-multiplication'], 4),
        pick('math-e-mixed-operations',           ['math-e-multi-digit-multiplication', 'math-e-multi-digit-division'], 3),
        pick('math-e-four-operations-laws',       ['math-e-multi-digit-multiplication', 'math-e-multi-digit-division'], 4),
        pick('math-e-operations-laws',            ['math-e-four-operations-laws'], 4,
             name='运算律与简便运算'),

        # 分数、小数（第二学段 3-4年级入门，第三学段 5-6年级深入）
        pick('math-e-fractions-intro',            ['math-e-division-concept'], 3),
        pick('math-e-decimals-intro',             ['math-e-multi-digit-addition-subtraction'], 3),
        pick('math-e-fractions-meaning',          ['math-e-fractions-intro'], 5),
        pick('math-e-decimals-meaning',           ['math-e-decimals-intro'], 4),
        pick('math-e-decimal-operations',         ['math-e-decimals-meaning', 'math-e-four-operations-laws'], 5),
        pick('math-e-fraction-operations',        ['math-e-fractions-meaning', 'math-e-four-operations-laws'], 5),
        pick('math-e-fraction-decimal-percent',   ['math-e-fractions-meaning', 'math-e-decimals-meaning'], 6),
        pick('math-e-percentage',                 ['math-e-fraction-decimal-percent'], 6),

        # 负数（第三学段）
        pick('math-e-negative-numbers',           ['math-e-decimals-meaning'], 6),

        # 式与方程（第三学段 5-6）
        pick('math-e-letter-representation',      ['math-e-four-operations-laws'], 5,
             name='用字母表示数'),
        pick('math-e-simple-equation',            ['math-e-letter-representation'], 5),
        pick('math-e-ratio-proportion',           ['math-e-simple-equation', 'math-e-fraction-decimal-percent'], 6),
    ]
}

# 域2：图形与几何（合并原 geometry + measurement）
geometry = {
    'id': 'geometry',
    'name': '图形与几何',
    'color': '#10b981',
    'nodes': [
        # 图形的认识
        pick('math-e-plane-shapes',               [], 1, name='平面图形的认识'),
        pick('math-e-angle-concept',              ['math-e-plane-shapes'], 2),
        pick('math-e-triangle-properties',        ['math-e-plane-shapes', 'math-e-angle-concept'], 4),
        pick('math-e-triangles-quadrilaterals',   ['math-e-triangle-properties'], 4),
        pick('math-e-solid-shapes',               ['math-e-plane-shapes'], 1, name='立体图形的认识'),

        # 测量（长度/时间/质量/面积/体积 → 归入几何）
        pick('math-e-length-units',               ['math-e-numbers-within-100'], 2),
        pick('math-e-time-units',                 ['math-e-numbers-within-100'], 2),
        pick('math-e-mass-units',                 ['math-e-numbers-within-10000'], 3),
        pick('math-e-area-units',                 ['math-e-length-units'], 3),
        pick('math-e-volume-units',               ['math-e-area-units'], 5),
        pick('math-e-measurement-sense',          ['math-e-length-units'], '1-6',
             name='量感培养（跨学段）'),

        # 测量计算
        pick('math-e-perimeter',                  ['math-e-plane-shapes', 'math-e-length-units'], 3,
             name='周长（含长方形周长）'),
        pick('math-e-area-rectangle',             ['math-e-perimeter', 'math-e-multi-digit-multiplication', 'math-e-area-units'], 3),
        pick('math-e-area-calculation',           ['math-e-area-rectangle'], 4,
             name='多种平面图形面积'),
        pick('math-e-circle-perimeter-area',      ['math-e-area-calculation'], 6),
        pick('math-e-circle-area',                ['math-e-circle-perimeter-area'], 6),
        pick('math-e-volume-calculation',         ['math-e-volume-units', 'math-e-solid-shapes'], 5),
        pick('math-e-solid-surface-area',         ['math-e-volume-calculation', 'math-e-area-calculation'], 5),
        pick('math-e-cylinder-cone',              ['math-e-volume-calculation', 'math-e-circle-area'], 6),

        # 图形的位置与运动
        pick('math-e-position-direction',         ['math-e-plane-shapes'], 3, name='位置与方向'),
        pick('math-e-symmetry-translation-rotation',['math-e-plane-shapes'], 3, name='轴对称、平移与旋转'),
    ]
}

# 域3：统计与概率（按课标"数据分类、数据的收集整理与表达、随机现象发生可能性"）
statistics_probability = {
    'id': 'statistics-probability',
    'name': '统计与概率',
    'color': '#f59e0b',
    'nodes': [
        pick('math-e-pictograph',                 ['math-e-numbers-within-100'], 2,
             name='象形统计图（数据分类与整理）'),
        pick('math-e-line-graph',                 ['math-e-pictograph', 'math-e-multi-digit-multiplication'], 4,
             name='条形统计图与折线统计图'),
        pick('math-e-average-concept',            ['math-e-four-operations-laws'], 4,
             name='平均数概念'),
        pick('math-e-average-median',             ['math-e-average-concept'], 5,
             name='平均数与中位数'),
        pick('math-e-median-mode',                ['math-e-average-median'], 5,
             name='中位数与众数'),
        pick('math-e-pie-chart',                  ['math-e-line-graph', 'math-e-fraction-decimal-percent'], 6,
             name='扇形统计图'),
        pick('math-e-percentage-statistics',      ['math-e-percentage', 'math-e-pie-chart'], 6,
             name='百分数在统计中的应用'),
        pick('math-e-possibility-concept',        ['math-e-fractions-intro'], 4,
             name='随机现象初步（可能性）'),
        pick('math-e-possibility',                ['math-e-possibility-concept', 'math-e-fractions-meaning'], 5,
             name='用分数表示可能性大小'),
    ]
}

# 域4：综合与实践（解决问题 + 跨学科）
practical = {
    'id': 'practical-application',
    'name': '综合与实践',
    'color': '#8b5cf6',
    'nodes': [
        pick('math-e-word-problems-basic',        ['math-e-addition-subtraction-within-20'], 1,
             name='简单加减法应用题'),
        pick('math-e-word-problems-multiply',     ['math-e-word-problems-basic', 'math-e-multi-digit-multiplication'], 3,
             name='乘除法两步应用题'),
        pick('math-e-complex-word-problems',      ['math-e-word-problems-multiply', 'math-e-fraction-operations', 'math-e-ratio-proportion'], 6,
             name='综合复合应用问题'),
    ]
}

# 过滤 None（对应原树缺失节点）
new_domains = []
for d in [number_algebra, geometry, statistics_probability, practical]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

# 保存
t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

# 报告
print("✅ 小学数学按 2022 版数学课标重构完成")
print(f"域数量：{len(new_domains)}（数与代数 / 图形与几何 / 统计与概率 / 综合与实践）")
total = 0
for d in new_domains:
    print(f"  【{d['name']}】{len(d['nodes'])} 节点")
    total += len(d['nodes'])
print(f"节点总数：{total}")

# 检查是否有遗留节点未被分到新域
old_ids = set(id2node.keys())
new_ids = set()
for d in new_domains:
    for n in d['nodes']:
        new_ids.add(n['id'])
orphan = old_ids - new_ids
if orphan:
    print(f"\n⚠ 遗漏未被分配的旧节点：{orphan}")
else:
    print("\n✅ 所有旧节点均已被分到新域")
