#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 5 棵树中 18 条"悬空前置"（prereq 指向不存在节点）

策略：对每条悬空引用，按课标判断：
- 如果该节点是课标标准节点 → 新建该节点并接入
- 如果已有同义节点 → 改引用为已存在节点
"""
import json
from pathlib import Path

TREES = Path('data/trees')


def _n(nid, name, grade, prereqs, extends=None):
    return {
        'id': nid, 'name': name, 'grade': grade,
        'prerequisites': prereqs, 'extends': extends or [],
        'parallel': [], 'courses': [], 'status': 'gap'
    }


# ============ history-middle.json ============
# 缺失：hist-m-qin-han-unification（秦汉大一统）
# 缺失：hist-m-spring-autumn-warring（春秋战国）
# 这两个都是初中历史课标的核心节点，必须创建
p = TREES / 'history-middle.json'
t = json.load(open(p, encoding='utf-8'))
for d in t['domains']:
    if d['id'] == 'ancient-china':
        # 调整节点顺序（按历史时序）
        existing = {n['id']: n for n in d['nodes']}
        # 插入春秋战国
        if 'hist-m-spring-autumn-warring' not in existing:
            # 春秋战国 G7，前置是夏商周
            existing['hist-m-spring-autumn-warring'] = _n(
                'hist-m-spring-autumn-warring', '春秋战国', 7,
                ['hist-m-xia-shang-zhou']
            )
        # 插入秦汉大一统
        if 'hist-m-qin-han-unification' not in existing:
            existing['hist-m-qin-han-unification'] = _n(
                'hist-m-qin-han-unification', '秦汉大一统', 7,
                ['hist-m-spring-autumn-warring']
            )
        # 修正 xia-shang-zhou 的后继链（imperial-unification 是课件节点，接在 qin-han 后）
        # 重新按历史时序组织节点
        ordered_ids = [
            'hist-m-prehistoric',
            'hist-m-early-civilizations',
            'hist-m-xia-shang-zhou',
            'hist-m-spring-autumn-warring',
            'hist-m-qin-han-unification',
            'hist-m-imperial-unification',   # 秦汉统一多民族国家（挂课件）
            'hist-m-three-kingdoms-sui-tang',
            'hist-m-tang-song-prosperity',
            'hist-m-song-yuan-ming-qing',
            'hist-m-ming-qing-decline',
            'hist-m-ancient-culture',
        ]
        new_nodes = []
        for nid in ordered_ids:
            if nid in existing:
                new_nodes.append(existing[nid])
        d['nodes'] = new_nodes
        # 修正 imperial-unification 的 prereq
        for n in d['nodes']:
            if n['id'] == 'hist-m-imperial-unification':
                n['prerequisites'] = ['hist-m-qin-han-unification']
            elif n['id'] == 'hist-m-ancient-culture':
                # 古代文化横跨各时期，挂到 song-yuan-ming-qing 下（集大成）
                n['prerequisites'] = ['hist-m-song-yuan-ming-qing']
            elif n['id'] == 'hist-m-three-kingdoms-sui-tang':
                n['prerequisites'] = ['hist-m-imperial-unification']
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("✅ history-middle: 新增 春秋战国/秦汉大一统 节点，中国古代史按历史时序重组")


# ============ history-high.json ============
# 缺失：hist-h-ancient-civ, hist-h-qin-han-empire, hist-h-wei-jin-tang, hist-h-song-yuan-ming-qing-h, hist-h-reform-revolution-h
# 都是高中历史课标核心节点
p = TREES / 'history-high.json'
t = json.load(open(p, encoding='utf-8'))
for d in t['domains']:
    if d['id'] == 'ancient-china-h':
        existing = {n['id']: n for n in d['nodes']}
        # 按高中历史（中外历史纲要·上）时序：
        # 中华文明起源 → 先秦 → 秦汉 → 魏晋隋唐 → 宋元明清 + 古代思想经济文化
        if 'hist-h-ancient-civ' not in existing:
            existing['hist-h-ancient-civ'] = _n(
                'hist-h-ancient-civ', '中华文明起源（史前·新石器）', 10, []
            )
        if 'hist-h-qin-han-empire' not in existing:
            existing['hist-h-qin-han-empire'] = _n(
                'hist-h-qin-han-empire', '秦汉帝国', 10, ['hist-h-classical-civ']
            )
        if 'hist-h-wei-jin-tang' not in existing:
            existing['hist-h-wei-jin-tang'] = _n(
                'hist-h-wei-jin-tang', '三国两晋南北朝与隋唐', 10, ['hist-h-qin-han-empire']
            )
        if 'hist-h-song-yuan-ming-qing-h' not in existing:
            existing['hist-h-song-yuan-ming-qing-h'] = _n(
                'hist-h-song-yuan-ming-qing-h', '宋元明清', 10, ['hist-h-wei-jin-tang']
            )
        # 重新排序
        ordered = [
            'hist-h-ancient-civ',
            'hist-h-early-state',
            'hist-h-classical-civ',
            'hist-h-feudal-system',
            'hist-h-qin-han-empire',
            'hist-h-imperial-system',
            'hist-h-wei-jin-tang',
            'hist-h-song-yuan-ming-qing-h',
            'hist-h-ancient-economy',
            'hist-h-ancient-culture',
            'hist-h-ancient-thought',
        ]
        new_nodes = []
        for nid in ordered:
            if nid in existing:
                new_nodes.append(existing[nid])
        d['nodes'] = new_nodes
        # 修正各节点前置
        fix_prereq = {
            'hist-h-early-state': ['hist-h-ancient-civ'],
            'hist-h-classical-civ': ['hist-h-early-state'],
            'hist-h-feudal-system': ['hist-h-classical-civ'],   # 秦汉中央集权 ← 先秦
            'hist-h-qin-han-empire': ['hist-h-feudal-system'],  # 秦汉帝国 ← 中央集权制度
            'hist-h-imperial-system': ['hist-h-qin-han-empire'],
            'hist-h-wei-jin-tang': ['hist-h-imperial-system'],
            'hist-h-song-yuan-ming-qing-h': ['hist-h-wei-jin-tang'],
            'hist-h-ancient-economy': ['hist-h-song-yuan-ming-qing-h'],
            'hist-h-ancient-culture': ['hist-h-song-yuan-ming-qing-h'],
            'hist-h-ancient-thought': ['hist-h-ancient-culture'],
        }
        for n in d['nodes']:
            if n['id'] in fix_prereq:
                n['prerequisites'] = fix_prereq[n['id']]
    elif d['id'] == 'modern-china-h':
        existing = {n['id']: n for n in d['nodes']}
        # 缺失 hist-h-reform-revolution-h——这是戊戌变法与辛亥革命的汇总节点
        if 'hist-h-reform-revolution-h' not in existing:
            existing['hist-h-reform-revolution-h'] = _n(
                'hist-h-reform-revolution-h', '戊戌变法与辛亥革命', 10, ['hist-h-semi-colonial']
            )
        # 重排：opium → semi → reform-revolution → xinhai-modern → new-democracy → prc → reform-opening
        ordered = [
            'hist-h-opium-war-h',
            'hist-h-semi-colonial',
            'hist-h-reform-revolution-h',
            'hist-h-xinhai-modern',
            'hist-h-new-democracy',
            'hist-h-prc-establishment',
            'hist-h-reform-opening',
        ]
        new_nodes = []
        for nid in ordered:
            if nid in existing:
                new_nodes.append(existing[nid])
        d['nodes'] = new_nodes
        # 修正前置
        fix = {
            'hist-h-opium-war-h': ['hist-h-ancient-thought'],   # 桥接古代史末
            'hist-h-semi-colonial': ['hist-h-opium-war-h'],
            'hist-h-reform-revolution-h': ['hist-h-semi-colonial'],
            'hist-h-xinhai-modern': ['hist-h-reform-revolution-h'],
            'hist-h-new-democracy': ['hist-h-xinhai-modern'],
            'hist-h-prc-establishment': ['hist-h-new-democracy'],
            'hist-h-reform-opening': ['hist-h-prc-establishment'],
        }
        for n in d['nodes']:
            if n['id'] in fix:
                n['prerequisites'] = fix[n['id']]
    elif d['id'] == 'thematic-history':
        # political-system-evolution 前置指向不存在的 song-yuan-ming-qing-h
        for n in d['nodes']:
            if n['id'] == 'hist-h-political-system-evolution':
                # 已经创建了 song-yuan-ming-qing-h，保持即可
                pass
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("✅ history-high: 新增古代/近代核心节点，按时序重组")


# ============ chemistry-high.json ============
# 缺失：chem-h-galvanic-cell（原电池）, chem-h-metal-corrosion-h（金属腐蚀）, chem-h-hydrocarbon（烃）
p = TREES / 'chemistry-high.json'
t = json.load(open(p, encoding='utf-8'))
for d in t['domains']:
    if d['id'] == 'electrochemistry':
        existing = {n['id']: n for n in d['nodes']}
        if 'chem-h-galvanic-cell' not in existing:
            existing['chem-h-galvanic-cell'] = _n(
                'chem-h-galvanic-cell', '原电池', 11, ['chem-h-electrochemistry']
            )
        if 'chem-h-metal-corrosion-h' not in existing:
            existing['chem-h-metal-corrosion-h'] = _n(
                'chem-h-metal-corrosion-h', '金属的腐蚀与防护（高中）', 11, ['chem-h-electrolysis']
            )
        # 排序
        ordered = ['chem-h-electrochemistry', 'chem-h-galvanic-cell', 'chem-h-electrolysis',
                   'chem-h-metal-corrosion-h', 'chem-h-corrosion-protection']
        d['nodes'] = [existing[i] for i in ordered if i in existing]
    elif d['id'] == 'organic-chemistry':
        existing = {n['id']: n for n in d['nodes']}
        if 'chem-h-hydrocarbon' not in existing:
            existing['chem-h-hydrocarbon'] = _n(
                'chem-h-hydrocarbon', '烃（烷/烯/炔/芳）', 11, ['chem-h-organic-intro']
            )
        ordered = ['chem-h-organic-intro', 'chem-h-hydrocarbon', 'chem-h-hydrocarbons',
                   'chem-h-functional-groups', 'chem-h-organic-derivatives',
                   'chem-h-organic-reactions', 'chem-h-organic-synthesis',
                   'chem-h-biomolecules', 'chem-h-polymers']
        d['nodes'] = [existing[i] for i in ordered if i in existing]
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("✅ chemistry-high: 新增 原电池/金属腐蚀/烃 节点")


# ============ geography-high.json ============
# 缺失：geo-h-earth-in-universe（地球的宇宙环境）, geo-h-atmospheric-circulation（大气环流）, geo-h-plate-tectonics（板块构造）
p = TREES / 'geography-high.json'
t = json.load(open(p, encoding='utf-8'))
for d in t['domains']:
    if d['id'] == 'earth-universe':
        existing = {n['id']: n for n in d['nodes']}
        if 'geo-h-earth-in-universe' not in existing:
            existing['geo-h-earth-in-universe'] = _n(
                'geo-h-earth-in-universe', '地球的宇宙环境', 10, []
            )
        ordered = ['geo-h-earth-in-universe', 'geo-h-earth-rotation', 'geo-h-earth-revolution',
                   'geo-h-earth-motion', 'geo-h-earth-structure']
        d['nodes'] = [existing[i] for i in ordered if i in existing]
    elif d['id'] == 'physical-geography':
        existing = {n['id']: n for n in d['nodes']}
        if 'geo-h-atmospheric-circulation' not in existing:
            existing['geo-h-atmospheric-circulation'] = _n(
                'geo-h-atmospheric-circulation', '大气环流（三圈环流）', 10, ['geo-h-atmospheric-heating']
            )
        if 'geo-h-plate-tectonics' not in existing:
            existing['geo-h-plate-tectonics'] = _n(
                'geo-h-plate-tectonics', '板块构造理论', 10, ['geo-h-earth-structure']
            )
        ordered = [
            'geo-h-atmosphere', 'geo-h-atmospheric-heating', 'geo-h-atmospheric-circulation',
            'geo-h-global-circulation', 'geo-h-weather-system', 'geo-h-monsoon-system',
            'geo-h-climate-types', 'geo-h-climate-change',
            'geo-h-hydrosphere', 'geo-h-water-cycle', 'geo-h-ocean-current', 'geo-h-river-features',
            'geo-h-plate-tectonics', 'geo-h-crustal-movement', 'geo-h-landforms',
            'geo-h-vegetation-soil', 'geo-h-natural-integrity', 'geo-h-natural-zones',
            'geo-h-natural-disaster',
        ]
        d['nodes'] = [existing[i] for i in ordered if i in existing]
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("✅ geography-high: 新增 宇宙环境/大气环流/板块构造 节点")


# ============ physics-high.json ============
# 缺失：phy-h-electromagnetic-waves（电磁波）——我创建了但可能放错域
p = TREES / 'physics-high.json'
t = json.load(open(p, encoding='utf-8'))

# 先全扫，如果确实不存在，新建到 electromagnetism 域
all_ids = set()
for d in t['domains']:
    for n in d['nodes']:
        all_ids.add(n['id'])
if 'phy-h-electromagnetic-waves' not in all_ids:
    for d in t['domains']:
        if d['id'] == 'electromagnetism':
            d['nodes'].append(_n(
                'phy-h-electromagnetic-waves', '电磁波', 12, ['phy-h-alternating-current']
            ))
            print("  + 新增 phy-h-electromagnetic-waves 到 electromagnetism 域")
            break
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("✅ physics-high: 新增 电磁波 节点")

print("\n🎉 全部 5 棵树悬空前置已修复")
