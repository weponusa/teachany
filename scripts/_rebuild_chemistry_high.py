#!/usr/bin/env python3
"""批次5-2 v2：高中化学（使用原树真实 id）"""
import json
from pathlib import Path

p = Path('data/trees/chemistry-high.json')
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

classification = {'id':'matter-classification','name':'物质的分类与化学用语','color':'#06b6d4','nodes':[
    pick('chem-h-substance-classification-h',[], 10, name='物质的分类'),
    pick('chem-h-dispersion-system',       ['chem-h-substance-classification-h'], 10, name='分散系（溶液/胶体）'),
    pick('chem-h-mole-concept',            [], 10, name='物质的量（摩尔）'),
    pick('chem-h-gas-molar-volume',        ['chem-h-mole-concept'], 10, name='气体摩尔体积'),
    pick('chem-h-solution-concentration-h',['chem-h-mole-concept'], 10, name='物质的量浓度'),
]}

ionic = {'id':'ionic-reactions','name':'离子反应与电解质','color':'#3b82f6','nodes':[
    pick('chem-h-electrolyte-concept',     ['chem-h-substance-classification-h'], 10, name='电解质与非电解质'),
    pick('chem-h-ionic-reactions-electrolyte',['chem-h-electrolyte-concept'], 10, name='电解质与离子反应综合'),
    pick('chem-h-ionic-equation',          ['chem-h-electrolyte-concept'], 10, name='离子方程式'),
    pick('chem-h-ion-identification',      ['chem-h-ionic-equation'], 10, name='离子检验与共存'),
]}

redox = {'id':'redox','name':'氧化还原反应','color':'#dc2626','nodes':[
    pick('chem-h-oxidation-reduction',     ['chem-h-ionic-equation'], 10, name='氧化还原反应概念'),
    pick('chem-h-redox-equation',          ['chem-h-oxidation-reduction'], 10, name='氧化还原方程式配平'),
]}

elements = {'id':'elements-compounds','name':'元素化合物','color':'#10b981','nodes':[
    pick('chem-h-sodium-compounds',        ['chem-h-ionic-equation', 'chem-h-oxidation-reduction'], 10, name='钠及其化合物'),
    pick('chem-h-aluminum-compounds',      ['chem-h-sodium-compounds'], 10, name='铝及其化合物'),
    pick('chem-h-iron-compounds',          ['chem-h-aluminum-compounds', 'chem-h-redox-equation'], 10, name='铁及其化合物'),
    pick('chem-h-silicon-compounds',       ['chem-h-ionic-equation'], 10, name='硅及其化合物'),
    pick('chem-h-chlorine-compounds',      ['chem-h-redox-equation'], 10, name='氯及其化合物'),
    pick('chem-h-sulfur-nitrogen',         ['chem-h-chlorine-compounds'], 10, name='硫和氮及其化合物'),
]}

structure_periodic = {'id':'atomic-structure-periodic','name':'原子结构与周期律','color':'#f59e0b','nodes':[
    pick('chem-h-atom-structure-h',        [], 10, name='原子结构'),
    pick('chem-h-periodic-law',            ['chem-h-atom-structure-h'], 10, name='元素周期律'),
    pick('chem-h-periodic-table-h',        ['chem-h-periodic-law'], 10, name='元素周期表'),
    pick('chem-h-chemical-bond',           ['chem-h-periodic-table-h'], 10, name='化学键'),
    pick('chem-h-molecular-structure',     ['chem-h-chemical-bond'], 11, name='分子结构与性质'),
]}

energy_h = {'id':'chemical-energy','name':'化学反应与能量','color':'#f97316','nodes':[
    pick('chem-h-thermochemistry',         ['chem-h-chemical-bond'], 11, name='热化学（焓变）'),
    pick('chem-h-enthalpy-change',         ['chem-h-thermochemistry'], 11, name='焓变与反应热'),
    pick('chem-h-hess-law',                ['chem-h-enthalpy-change'], 11, name='盖斯定律'),
]}

kinetics = {'id':'reaction-kinetics','name':'化学反应速率与平衡','color':'#a855f7','nodes':[
    pick('chem-h-reaction-rate',           ['chem-h-hess-law'], 11, name='化学反应速率'),
    pick('chem-h-chemical-equilibrium',    ['chem-h-reaction-rate'], 11, name='化学平衡'),
    pick('chem-h-reaction-rate-equilibrium',['chem-h-chemical-equilibrium'], 11, name='速率与平衡综合'),
    pick('chem-h-le-chatelier',            ['chem-h-chemical-equilibrium'], 11, name='勒夏特列原理'),
    pick('chem-h-equilibrium-constant',    ['chem-h-le-chatelier'], 11, name='平衡常数'),
]}

electrochem = {'id':'electrochemistry','name':'电化学','color':'#64748b','nodes':[
    pick('chem-h-electrochemistry',        ['chem-h-oxidation-reduction'], 11, name='电化学基础'),
    pick('chem-h-galvanic-cell',           ['chem-h-electrochemistry'], 11, name='原电池'),
    pick('chem-h-electrolysis',            ['chem-h-galvanic-cell'], 11, name='电解池'),
    pick('chem-h-metal-corrosion-h',       ['chem-h-electrolysis'], 11, name='金属的腐蚀与防护'),
    pick('chem-h-corrosion-protection',    ['chem-h-metal-corrosion-h'], 11, name='防腐原理与应用'),
]}

organic = {'id':'organic-chemistry','name':'有机化学基础','color':'#8b5cf6','nodes':[
    pick('chem-h-organic-intro',           ['chem-h-chemical-bond'], 11, name='有机化合物入门'),
    pick('chem-h-hydrocarbon',             ['chem-h-organic-intro'], 11, name='烃（烷/烯/炔/芳）'),
    pick('chem-h-hydrocarbons',            ['chem-h-hydrocarbon'], 11, name='烃类综合'),
    pick('chem-h-functional-groups',       ['chem-h-hydrocarbons'], 11, name='官能团（醇/酚/醛/酸/酯）'),
    pick('chem-h-organic-derivatives',     ['chem-h-functional-groups'], 11, name='烃的衍生物'),
    pick('chem-h-organic-reactions',       ['chem-h-organic-derivatives'], 11, name='有机反应类型'),
    pick('chem-h-organic-synthesis',       ['chem-h-organic-reactions'], 11, name='有机合成路线设计'),
    pick('chem-h-biomolecules',            ['chem-h-organic-reactions'], 11, name='生物大分子（糖/蛋白质/核酸）'),
    pick('chem-h-polymers',                ['chem-h-organic-reactions'], 11, name='高分子合成与应用'),
]}

new_domains = []
for d in [classification, ionic, redox, elements, structure_periodic, energy_h, kinetics, electrochem, organic]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"\n✅ 高中化学重构：{len(new_domains)} 域")
total = 0
for d in new_domains:
    print(f"  【{d['name']}】{len(d['nodes'])} 节点")
    total += len(d['nodes'])
print(f"节点总数：{total}")

old_ids = set(id2node.keys())
new_ids = set(n['id'] for d in new_domains for n in d['nodes'])
orphan = old_ids - new_ids
must_keep = [x for x in orphan if id2node[x].get('courses')]
if must_keep: print(f"🚨 挂课件节点丢失：{must_keep}")
elif orphan: print(f"⚠ 未分配（可丢）：{orphan}")
else: print("✅ 全部节点已归位")
