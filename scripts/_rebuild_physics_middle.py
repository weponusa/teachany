#!/usr/bin/env python3
"""批次4-1：初中物理按 2022 版义务教育物理课标重构"""
import json
from pathlib import Path

p = Path('data/trees/physics-middle.json')
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

# 域1：声学
acoustics = {
    'id': 'acoustics', 'name': '声现象', 'color': '#06b6d4',
    'nodes': [
        pick('phy-m-sound-generation',      [], 8, name='声音的产生与传播'),
        pick('phy-m-sound-properties',      ['phy-m-sound-generation'], 8, name='声音的特性（音调/响度/音色）'),
        pick('phy-m-noise-control',         ['phy-m-sound-properties'], 8, name='噪声与声污染'),
        pick('phy-m-sound-applications',    ['phy-m-sound-properties'], 8, name='声的利用（超声/次声）'),
        pick('phy-m-acoustics-cross-disciplinary',['phy-m-sound-applications'], 8, name='声现象跨学科应用'),
    ]
}

# 域2：光学
optics = {
    'id': 'optics', 'name': '光现象', 'color': '#f59e0b',
    'nodes': [
        pick('phy-m-light-propagation',     [], 8, name='光的直线传播'),
        pick('phy-m-light-reflection',      ['phy-m-light-propagation'], 8, name='光的反射'),
        pick('phy-m-plane-mirror',          ['phy-m-light-reflection'], 8, name='平面镜成像'),
        pick('phy-m-spherical-mirror',      ['phy-m-plane-mirror'], 8, name='球面镜（凹镜/凸镜）'),
        pick('phy-m-light-refraction',      ['phy-m-light-reflection'], 8, name='光的折射'),
        pick('phy-m-refraction',            ['phy-m-light-refraction'], 8, name='折射规律应用'),
        pick('phy-m-light-dispersion',      ['phy-m-light-refraction'], 8, name='光的色散'),
        pick('phy-m-lens',                  ['phy-m-light-refraction'], 8, name='透镜（凸透镜/凹透镜）'),
        pick('phy-m-eye-vision',            ['phy-m-lens'], 8, name='眼睛与视觉矫正'),
    ]
}

# 域3：热学
thermo = {
    'id': 'thermodynamics', 'name': '热现象', 'color': '#dc2626',
    'nodes': [
        pick('phy-m-thermometer',           [], 8, name='温度与温度计'),
        pick('phy-m-phase-change',          ['phy-m-thermometer'], 8, name='物态变化（熔化/汽化/凝固）'),
        pick('phy-m-internal-energy',       ['phy-m-phase-change'], 9, name='内能与热量'),
        pick('phy-m-specific-heat',         ['phy-m-internal-energy'], 9, name='比热容'),
        pick('phy-m-heat-calculation',      ['phy-m-specific-heat'], 9, name='热量计算'),
        pick('phy-m-heat-engine',           ['phy-m-heat-calculation'], 9, name='内燃机与热机效率'),
    ]
}

# 域4：力学
mechanics = {
    'id': 'mechanics', 'name': '运动和力', 'color': '#10b981',
    'nodes': [
        # 运动
        pick('phy-m-motion-description',    [], 8, name='机械运动'),
        pick('phy-m-mass-density',          ['phy-m-motion-description'], 8, name='质量与密度'),
        # 力
        pick('phy-m-force-basics',          ['phy-m-mass-density'], 8, name='力的初步认识'),
        pick('phy-m-gravity',               ['phy-m-force-basics'], 8, name='重力'),
        pick('phy-m-friction',              ['phy-m-force-basics'], 8, name='摩擦力'),
        pick('phy-m-newton-laws',           ['phy-m-gravity', 'phy-m-friction'], 8, name='牛顿第一定律与二力平衡'),
        # 压强浮力
        pick('phy-m-pressure',              ['phy-m-newton-laws'], 8, name='压强'),
        pick('phy-m-liquid-pressure-buoyancy',['phy-m-pressure', 'phy-m-mass-density'], 8, name='液体压强与浮力'),
        pick('phy-m-atmospheric-pressure',  ['phy-m-pressure'], 8, name='大气压强'),
        pick('phy-m-fluid-flow',            ['phy-m-atmospheric-pressure'], 8, name='流体压强与流速关系'),
        # 功能
        pick('phy-m-simple-machines',       ['phy-m-newton-laws'], 9, name='简单机械（杠杆/滑轮）'),
        pick('phy-m-work-energy',           ['phy-m-simple-machines'], 9, name='功与功率'),
        pick('phy-m-mechanical-energy',     ['phy-m-work-energy'], 9, name='机械能（动能/势能）'),
        pick('phy-m-energy-conservation',   ['phy-m-mechanical-energy', 'phy-m-internal-energy'], 9, name='能量转化与守恒定律'),
    ]
}

# 域5：电学
electricity = {
    'id': 'electricity', 'name': '电现象与电路', 'color': '#f97316',
    'nodes': [
        pick('phy-m-static-electricity',    [], 9, name='静电现象'),
        pick('phy-m-current-circuit',       ['phy-m-static-electricity'], 9, name='电流与电路'),
        pick('phy-m-circuit-basics',        ['phy-m-current-circuit'], 9, name='电路基本连接'),
        pick('phy-m-series-parallel',       ['phy-m-circuit-basics'], 9, name='串联与并联电路'),
        pick('phy-m-current-measurement',   ['phy-m-series-parallel'], 9, name='电流的测量'),
        pick('phy-m-voltage',               ['phy-m-series-parallel'], 9, name='电压'),
        pick('phy-m-resistance',            ['phy-m-current-measurement', 'phy-m-voltage'], 9, name='电阻'),
        pick('phy-m-ohms-law',              ['phy-m-resistance'], 9, name='欧姆定律'),
        pick('phy-m-circuit-calculation',   ['phy-m-ohms-law'], 9, name='电路综合计算'),
        pick('phy-m-electric-power',        ['phy-m-ohms-law'], 9, name='电功率'),
        pick('phy-m-joule-law',             ['phy-m-electric-power', 'phy-m-internal-energy'], 9, name='焦耳定律'),
        pick('phy-m-electrical-safety',     ['phy-m-electric-power'], 9, name='家庭电路与安全用电'),
    ]
}

# 域6：电与磁
em = {
    'id': 'electromagnetism', 'name': '电与磁', 'color': '#8b5cf6',
    'nodes': [
        pick('phy-m-magnetism-basics',      [], 9, name='磁现象'),
        pick('phy-m-electromagnetism-basic',['phy-m-current-circuit', 'phy-m-magnetism-basics'], 9, name='电流的磁效应'),
        pick('phy-m-electric-motor',        ['phy-m-electromagnetism-basic'], 9, name='电动机原理'),
        pick('phy-m-electromagnetic-induction',['phy-m-electromagnetism-basic'], 9, name='电磁感应'),
        pick('phy-m-generator',             ['phy-m-electromagnetic-induction'], 9, name='发电机原理'),
    ]
}

new_domains = []
for d in [acoustics, optics, thermo, mechanics, electricity, em]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中物理重构：{len(new_domains)} 域")
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
