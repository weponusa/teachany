#!/usr/bin/env python3
"""批次4-2：初中化学按 2022 版义务教育化学课标重构"""
import json
from pathlib import Path

p = Path('data/trees/chemistry-middle.json')
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

# 域1：科学探究与化学实验
inquiry = {
    'id': 'matter-intro', 'name': '科学探究与化学实验', 'color': '#06b6d4',
    'nodes': [
        pick('chem-m-chemistry-intro',        [], 9, name='走进化学世界'),
        pick('chem-m-lab-safety',             ['chem-m-chemistry-intro'], 9, name='实验基本操作与安全'),
        pick('chem-m-scientific-inquiry-experiment',['chem-m-lab-safety'], 9, name='科学探究方法'),
    ]
}

# 域2：物质的组成与结构
structure = {
    'id': 'matter-structure', 'name': '物质的组成与结构', 'color': '#3b82f6',
    'nodes': [
        pick('chem-m-atom-molecule',          ['chem-m-chemistry-intro'], 9, name='分子与原子'),
        pick('chem-m-atom-structure',         ['chem-m-atom-molecule'], 9, name='原子的结构'),
        pick('chem-m-atomic-structure',       ['chem-m-atom-structure'], 9, name='原子核外电子排布'),
        pick('chem-m-element-concept',        ['chem-m-atom-structure'], 9, name='元素'),
        pick('chem-m-ion-concept',            ['chem-m-atom-structure'], 9, name='离子'),
        pick('chem-m-periodic-table',         ['chem-m-element-concept'], 9, name='元素周期表'),
        pick('chem-m-chemical-formula',       ['chem-m-element-concept', 'chem-m-ion-concept'], 9, name='化学式与化合价'),
        pick('chem-m-matter-classification',  ['chem-m-element-concept'], 9, name='物质的分类'),
        pick('chem-m-substance-classification',['chem-m-matter-classification'], 9, name='纯净物、混合物、化合物'),
    ]
}

# 域3：物质的化学变化
change = {
    'id': 'chemical-change', 'name': '物质的化学变化', 'color': '#dc2626',
    'nodes': [
        pick('chem-m-mass-conservation',      ['chem-m-atom-molecule'], 9, name='质量守恒定律'),
        pick('chem-m-chemical-equation',      ['chem-m-mass-conservation', 'chem-m-chemical-formula'], 9, name='化学方程式'),
        pick('chem-m-equation-calculation',   ['chem-m-chemical-equation'], 9, name='根据化学方程式计算'),
        pick('chem-m-reaction-types',         ['chem-m-chemical-equation'], 9, name='化学反应基本类型'),
        pick('chem-m-catalyst-concept',       ['chem-m-chemical-equation'], 9, name='催化剂与催化作用'),
    ]
}

# 域4：物质的性质与应用
properties = {
    'id': 'substance-properties', 'name': '物质的性质与应用', 'color': '#10b981',
    'nodes': [
        # 空气与氧气
        pick('chem-m-air-composition',        ['chem-m-chemistry-intro'], 9, name='空气的组成'),
        pick('chem-m-oxygen-properties',      ['chem-m-air-composition'], 9, name='氧气的性质'),
        pick('chem-m-oxygen-preparation',     ['chem-m-oxygen-properties', 'chem-m-lab-safety'], 9, name='氧气的制取'),
        # 水
        pick('chem-m-water-properties',       ['chem-m-atom-molecule'], 9, name='水的组成与净化'),
        pick('chem-m-hydrogen-properties',    ['chem-m-water-properties'], 9, name='氢气的性质'),
        # 溶液
        pick('chem-m-solution-concept',       ['chem-m-water-properties'], 9, name='溶液的形成'),
        pick('chem-m-solubility',             ['chem-m-solution-concept'], 9, name='溶解度'),
        pick('chem-m-solution-concentration', ['chem-m-solubility'], 9, name='溶液浓度（质量分数）'),
        # 碳
        pick('chem-m-carbon-allotropes',      ['chem-m-element-concept'], 9, name='碳的单质（金刚石/石墨/C60）'),
        pick('chem-m-co2-properties',         ['chem-m-carbon-allotropes', 'chem-m-chemical-equation'], 9, name='二氧化碳的性质与制取'),
        pick('chem-m-co-properties',          ['chem-m-co2-properties'], 9, name='一氧化碳的性质'),
        # 金属
        pick('chem-m-metal-properties',       ['chem-m-chemical-equation'], 9, name='金属的物理与化学性质'),
        pick('chem-m-metals-activity',        ['chem-m-metal-properties'], 9, name='金属的活动性'),
        pick('chem-m-activity-series',        ['chem-m-metals-activity'], 9, name='金属活动性顺序'),
        pick('chem-m-metal-smelting',         ['chem-m-activity-series', 'chem-m-co-properties'], 9, name='金属冶炼'),
        pick('chem-m-metal-corrosion',        ['chem-m-metal-properties'], 9, name='金属的锈蚀与防护'),
        # 酸碱盐
        pick('chem-m-ph-indicators',          ['chem-m-solution-concept'], 9, name='酸碱指示剂与 pH'),
        pick('chem-m-acid-base-concept',      ['chem-m-chemical-equation', 'chem-m-ion-concept'], 9, name='酸和碱'),
        pick('chem-m-neutralization',         ['chem-m-acid-base-concept', 'chem-m-ph-indicators'], 9, name='中和反应'),
        pick('chem-m-salt-reactions',         ['chem-m-neutralization', 'chem-m-activity-series'], 9, name='盐的性质'),
        pick('chem-m-acid-base-salt',         ['chem-m-salt-reactions'], 9, name='酸碱盐综合'),
    ]
}

# 域5：化学与社会·跨学科实践
society = {
    'id': 'chemistry-society', 'name': '化学与社会·跨学科实践', 'color': '#a855f7',
    'nodes': [
        pick('chem-m-chemistry-society-practice',['chem-m-acid-base-salt'], 9, name='化学与生产生活（跨学科实践）'),
    ]
}

new_domains = []
for d in [inquiry, structure, change, properties, society]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中化学重构：{len(new_domains)} 域")
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
