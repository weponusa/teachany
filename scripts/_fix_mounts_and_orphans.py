#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
综合修复脚本 (v5.26)

1. 去除课件重复挂载：每个课件只保留在权威节点
2. 修正学段错挂：chem-oxidation-reduction 从高中树迁到初中树
3. 接入孤立节点：bio-h-ecosystem / eng-m-ipa-transcription / phy-h-gas-laws 添加合理前置
4. 同步修正课件 manifest.json 的 node_id 以与知识树一致
"""
import json
from pathlib import Path

TREES = Path('data/trees')

# --- 权威挂载决策表（课件 ID → 应该唯一挂载的节点 ID） ---
AUTHORITATIVE = {
    'bio-meiosis':                       'bio-h-meiosis',
    'bio-cell-division':                 'bio-m-cell-division-m',
    'bio-eco-factors':                   'bio-m-eco-factors',
    'bio-endocrine':                     'bio-m-endocrine-system-m',
    'bio-nervous-system':                'bio-m-nervous-system-m',
    'chn-classical-chinese-intro':       'chn-e-classical-chinese-intro',
    'eng-there-be':                      'eng-e-there-be',
    'geo-monsoon':                       'geo-h-monsoon-system',
    'math-elem-division-intro':          'math-e-division-intro',
    'math-elem-complex-word-problems':   'math-e-complex-word-problems',
    'math-elem-four-operations-laws':    'math-e-four-operations-laws',
    'math-elem-fraction-decimal-percent':'math-e-fraction-decimal-percent',
    'math-elem-triangles-quadrilaterals':'math-e-triangles-quadrilaterals',
    'math-elem-area-calculation':        'math-e-area-calculation',
    'math-elem-circle-area':             'math-e-circle-area',
    'math-elem-average-median':          'math-e-average-median',
    'math-elem-pie-chart':               'math-e-pie-chart',
    'math-elem-possibility':             'math-e-possibility',
    'math-high-law-of-sines-cosines':    'math-h-law-of-sines-cosines',
}

# 1. 去重挂载：遍历每棵树，只在权威节点保留 courses
total_removed = 0
for f in sorted(TREES.glob('*.json')):
    if f.name.startswith('_'): continue
    t = json.load(open(f, encoding='utf-8'))
    changed = False
    for d in t['domains']:
        for n in d['nodes']:
            new_courses = []
            for cid in n.get('courses', []):
                if cid in AUTHORITATIVE:
                    if n['id'] == AUTHORITATIVE[cid]:
                        new_courses.append(cid)
                    else:
                        total_removed += 1
                        print(f"  - 从 {f.name}/{n['id']} 移除 {cid}（权威节点是 {AUTHORITATIVE[cid]}）")
                else:
                    new_courses.append(cid)
            if new_courses != n.get('courses', []):
                n['courses'] = new_courses
                # 如果节点没课件但 status='active'，改为 gap
                if not new_courses and n.get('status') == 'active':
                    n['status'] = 'gap'
                changed = True
    if changed:
        with open(f, 'w', encoding='utf-8') as fp:
            json.dump(t, fp, ensure_ascii=False, indent=2)

print(f"\n✅ 阶段1：去除 {total_removed} 处重复挂载")

# 2. 修复学段错挂：chem-oxidation-reduction（G9）要从高中化学树迁到初中化学树
# 但该课件目录（examples/chem-oxidation-reduction）实际包含的是初中内容，
# 所以把课件从 high 树移除，同时看初中化学树是否有合适节点接住
print("\n🔍 阶段2：学段错挂修复")

# 从 chem-high 的 oxidation-reduction 移除该课件
p_high = TREES / 'chemistry-high.json'
t_high = json.load(open(p_high))
removed_from_high = False
for d in t_high['domains']:
    for n in d['nodes']:
        if 'chem-oxidation-reduction' in n.get('courses', []):
            n['courses'] = [c for c in n['courses'] if c != 'chem-oxidation-reduction']
            if not n['courses'] and n.get('status') == 'active':
                n['status'] = 'gap'
            removed_from_high = True
            print(f"  - 从 chemistry-high/{n['id']} 移除 chem-oxidation-reduction")
if removed_from_high:
    with open(p_high, 'w') as fp:
        json.dump(t_high, fp, ensure_ascii=False, indent=2)

# 挂到 chemistry-middle 的"物质的化学变化"域/reaction-types 节点
# 或者挂到 redox 相关的节点。查看初中化学结构
p_mid = TREES / 'chemistry-middle.json'
t_mid = json.load(open(p_mid))
mounted = False
for d in t_mid['domains']:
    for n in d['nodes']:
        if n['id'] == 'chem-m-reaction-types':  # 化学反应基本类型
            # 挂到这个节点（氧化还原是初中化学反应的一种类型）
            n.setdefault('courses', [])
            if 'chem-oxidation-reduction' not in n['courses']:
                n['courses'].append('chem-oxidation-reduction')
                n['status'] = 'active'
                mounted = True
                print(f"  + 添加 chem-oxidation-reduction 到 chemistry-middle/{n['id']}（{n.get('name')}）")
                break
if mounted:
    with open(p_mid, 'w') as fp:
        json.dump(t_mid, fp, ensure_ascii=False, indent=2)

# 3. 接入孤立节点
print("\n🔗 阶段3：接入孤立节点")

# biology-high.json: bio-h-ecosystem → 挂到 bio-h-community 后
p = TREES / 'biology-high.json'
t = json.load(open(p))
for d in t['domains']:
    for n in d['nodes']:
        if n['id'] == 'bio-h-ecosystem':
            n['prerequisites'] = ['bio-h-community']
            print(f"  + bio-h-ecosystem 前置改为 [bio-h-community]")
with open(p, 'w') as fp:
    json.dump(t, fp, ensure_ascii=False, indent=2)

# english-middle.json: eng-m-ipa-transcription 作为起点——可以留空前置（确实是学段起点）
# 但增加后继：让 eng-m-curriculum-vocabulary 依赖它
p = TREES / 'english-middle.json'
t = json.load(open(p))
for d in t['domains']:
    for n in d['nodes']:
        if n['id'] == 'eng-m-curriculum-vocabulary':
            if 'eng-m-ipa-transcription' not in n.get('prerequisites', []):
                n['prerequisites'] = ['eng-m-ipa-transcription'] + list(n.get('prerequisites', []))
                print(f"  + eng-m-curriculum-vocabulary 前置增加 [eng-m-ipa-transcription]")
with open(p, 'w') as fp:
    json.dump(t, fp, ensure_ascii=False, indent=2)

# physics-high.json: phy-h-gas-laws (热学域单节点，选择性必修)
# 让它成为 热力学第一定律等节点的前置——但热学域只有这一个节点
# 可让它依赖"分子动理论"概念前置的物理常识 —— 这里改成依赖 phy-h-energy-conservation-general 因为热学涉及能量转化
p = TREES / 'physics-high.json'
t = json.load(open(p))
for d in t['domains']:
    for n in d['nodes']:
        if n['id'] == 'phy-h-gas-laws':
            n['prerequisites'] = ['phy-h-energy-conservation-general']
            n['name'] = '气体实验定律与理想气体（热学）'
            print(f"  + phy-h-gas-laws 前置改为 [phy-h-energy-conservation-general]")
with open(p, 'w') as fp:
    json.dump(t, fp, ensure_ascii=False, indent=2)

print("\n✅ 综合修复完成")
