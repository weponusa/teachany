#!/usr/bin/env python3
"""批次5-1 v2：高中物理，使用原树真实 id 修正"""
import json
from pathlib import Path

p = Path('data/trees/physics-high.json')
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

# 使用真实 id（含 Phase A 翻译后新增的 mechanics/thermodynamics/optics 节点）
kinematics = {'id':'kinematics','name':'运动学','color':'#10b981','nodes':[
    pick('phy-h-motion-description',       [], 10, name='运动的描述'),
    pick('phy-h-kinematics-linear',        ['phy-h-motion-description'], 10, name='直线运动综合'),
    pick('phy-h-uniform-acceleration',     ['phy-h-motion-description'], 10, name='匀变速直线运动'),
    pick('phy-h-free-fall',                ['phy-h-uniform-acceleration'], 10, name='自由落体运动'),
    pick('phy-h-circular-motion',          ['phy-h-uniform-acceleration'], 10, name='圆周运动'),
]}

forces = {'id':'forces','name':'相互作用与牛顿定律','color':'#3b82f6','nodes':[
    pick('phy-h-common-forces',            ['phy-h-motion-description'], 10, name='常见的力'),
    pick('phy-h-force-decomposition',      ['phy-h-common-forces'], 10, name='力的合成与分解'),
    pick('phy-h-newton-laws',              ['phy-h-force-decomposition', 'phy-h-uniform-acceleration'], 10, name='牛顿运动定律'),
    pick('phy-h-projectile-motion',        ['phy-h-newton-laws'], 10, name='抛体运动'),
    pick('phy-h-universal-gravitation',    ['phy-h-newton-laws', 'phy-h-circular-motion'], 10, name='万有引力定律'),
    pick('phy-h-gravitation',              ['phy-h-universal-gravitation'], 10, name='引力综合'),
    pick('phy-h-satellite-motion',         ['phy-h-universal-gravitation'], 10, name='卫星运动与航天'),
]}

energy = {'id':'energy','name':'功与能','color':'#f59e0b','nodes':[
    pick('phy-h-work-concept',             ['phy-h-newton-laws'], 10, name='功与功率'),
    pick('phy-h-work-energy',              ['phy-h-work-concept'], 10, name='功能关系综合'),
    pick('phy-h-kinetic-energy-theorem',   ['phy-h-work-concept'], 10, name='动能定理'),
    pick('phy-h-potential-energy',         ['phy-h-work-concept'], 10, name='势能（重力/弹性）'),
    pick('phy-h-energy-conservation-mech', ['phy-h-kinetic-energy-theorem', 'phy-h-potential-energy'], 10, name='机械能守恒定律'),
    pick('phy-h-energy-conservation-general',['phy-h-energy-conservation-mech'], 11, name='能量守恒定律'),
]}

momentum = {'id':'momentum','name':'动量','color':'#dc2626','nodes':[
    pick('phy-h-momentum-impulse',         ['phy-h-newton-laws'], 11, name='动量与冲量'),
    pick('phy-h-momentum',                 ['phy-h-momentum-impulse'], 11, name='动量'),
    pick('phy-h-momentum-conservation',    ['phy-h-momentum-impulse'], 11, name='动量守恒定律'),
    pick('phy-h-collision-types',          ['phy-h-momentum-conservation', 'phy-h-energy-conservation-mech'], 11, name='碰撞与反冲'),
]}

electrostatics = {'id':'electrostatics','name':'静电场','color':'#f97316','nodes':[
    pick('phy-h-electrostatics',           ['phy-h-newton-laws'], 11, name='静电现象'),
    pick('phy-h-coulomb-law',              ['phy-h-electrostatics'], 11, name='库仑定律'),
    pick('phy-h-electric-field',           ['phy-h-coulomb-law'], 11, name='电场与电场强度'),
    pick('phy-h-electric-potential',       ['phy-h-electric-field'], 11, name='电势与电势能'),
    pick('phy-h-capacitor',                ['phy-h-electric-potential'], 11, name='电容器'),
]}

circuits = {'id':'circuits','name':'直流电路','color':'#06b6d4','nodes':[
    pick('phy-h-dc-circuits',              ['phy-h-capacitor'], 11, name='恒定电流与欧姆定律'),
    pick('phy-h-circuit-analysis',         ['phy-h-dc-circuits'], 11, name='闭合电路与电路分析'),
    pick('phy-h-electrical-experiments',   ['phy-h-circuit-analysis'], 11, name='电学实验'),
]}

em = {'id':'electromagnetism','name':'电磁场与电磁感应','color':'#8b5cf6','nodes':[
    pick('phy-h-magnetic-field',           ['phy-h-dc-circuits'], 12, name='磁场'),
    pick('phy-h-magnetic-field-h',         ['phy-h-magnetic-field'], 12, name='磁场综合（安培力/磁通量）'),
    pick('phy-h-lorentz-force',            ['phy-h-magnetic-field-h'], 12, name='洛伦兹力与带电粒子运动'),
    pick('phy-h-em-induction',             ['phy-h-magnetic-field-h'], 12, name='电磁感应'),
    pick('phy-h-electromagnetic-induction-h',['phy-h-em-induction'], 12, name='电磁感应综合应用'),
    pick('phy-h-alternating-current',      ['phy-h-em-induction'], 12, name='交变电流'),
    pick('phy-h-transformer',              ['phy-h-alternating-current'], 12, name='变压器与远距离输电'),
    pick('phy-h-electromagnetic-waves',    ['phy-h-alternating-current'], 12, name='电磁波'),
]}

# 振动与波/光学（选择性必修）
vibration_wave = {'id':'vibration-wave','name':'机械振动与波、光学','color':'#a855f7','nodes':[
    pick('phy-h-mechanical-vibration-wave',['phy-h-energy-conservation-mech'], 12, name='机械振动与机械波'),
    pick('phy-h-wave-optics',              ['phy-h-mechanical-vibration-wave'], 12, name='光的波动性（干涉/衍射）'),
]}

# 热学（选择性必修）
thermo_h = {'id':'thermodynamics','name':'热学','color':'#ec4899','nodes':[
    pick('phy-h-gas-laws',                 [], 11, name='气体实验定律与理想气体'),
]}

# 近代物理（选择性必修）
modern = {'id':'modern-physics','name':'近代物理','color':'#64748b','nodes':[
    pick('phy-h-photoelectric-effect',     ['phy-h-electromagnetic-waves'], 12, name='光电效应'),
    pick('phy-h-quantum-intro',            ['phy-h-photoelectric-effect'], 12, name='量子力学初步'),
    pick('phy-h-atomic-models',            ['phy-h-photoelectric-effect'], 12, name='原子结构（汤姆孙/卢瑟福/玻尔）'),
    pick('phy-h-atomic-structure-h',       ['phy-h-atomic-models'], 12, name='原子能级'),
    pick('phy-h-nuclear-physics',          ['phy-h-atomic-structure-h'], 12, name='原子核物理'),
    pick('phy-h-nuclear-energy',           ['phy-h-nuclear-physics'], 12, name='核能与核反应'),
]}

new_domains = []
for d in [kinematics, forces, energy, momentum, electrostatics, circuits, em, vibration_wave, thermo_h, modern]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 高中物理重构：{len(new_domains)} 域")
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
