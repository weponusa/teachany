#!/usr/bin/env python3
"""批次4-3：初中生物按 2022 版义务教育生物课标重构"""
import json
from pathlib import Path

p = Path('data/trees/biology-middle.json')
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

# 域1：生物体的结构层次（细胞→组织→器官→系统→个体）
structure = {
    'id': 'cell-basis', 'name': '生物体的结构层次', 'color': '#10b981',
    'nodes': [
        pick('bio-m-bio-characteristics',      [], 7, name='生物的基本特征'),
        pick('bio-m-microscope-use',           ['bio-m-bio-characteristics'], 7, name='显微镜的使用'),
        pick('bio-m-cell-basics',              ['bio-m-microscope-use'], 7, name='细胞基础'),
        pick('bio-m-cell-structure-m',         ['bio-m-cell-basics'], 7, name='细胞的结构'),
        pick('bio-m-cell-life-activities',     ['bio-m-cell-structure-m'], 7, name='细胞的生命活动'),
        pick('bio-m-cell-division-m',          ['bio-m-cell-life-activities'], 7, name='细胞分裂'),
        pick('bio-m-cell-division-junior',     ['bio-m-cell-division-m'], 7, name='细胞分化'),
        pick('bio-m-tissue-types',             ['bio-m-cell-division-junior'], 7, name='组织与器官'),
    ]
}

# 域2：生物与环境
biosphere = {
    'id': 'biosphere', 'name': '生物与环境', 'color': '#3b82f6',
    'nodes': [
        pick('bio-m-biosphere',                ['bio-m-bio-characteristics'], 7, name='生物圈'),
        pick('bio-m-eco-factors',              ['bio-m-biosphere'], 7, name='生态因素'),
        pick('bio-m-biosphere-scope',          ['bio-m-biosphere'], 7, name='生物圈的范围'),
        pick('bio-m-food-chain',               ['bio-m-biosphere-scope', 'bio-m-eco-factors'], 7, name='食物链与食物网'),
        pick('bio-m-biosphere-largest',        ['bio-m-food-chain'], 7, name='生物圈是最大的生态系统'),
        pick('bio-m-ecosystem-junior',         ['bio-m-biosphere-largest'], 8, name='生态系统的组成'),
    ]
}

# 域3：植物
plants = {
    'id': 'plant-life', 'name': '植物的结构与生理', 'color': '#059669',
    'nodes': [
        pick('bio-m-plant-structure',          ['bio-m-cell-basics'], 7, name='绿色植物整体结构'),
        pick('bio-m-seed-structure',           ['bio-m-plant-structure'], 7, name='种子结构与萌发'),
        pick('bio-m-root-tip',                 ['bio-m-seed-structure'], 7, name='根尖结构'),
        pick('bio-m-stem-transport',           ['bio-m-root-tip'], 7, name='茎的运输作用'),
        pick('bio-m-leaf-structure',           ['bio-m-stem-transport'], 7, name='叶片结构'),
        pick('bio-m-photosynthesis-m',         ['bio-m-leaf-structure', 'bio-m-cell-structure-m'], 7, name='光合作用'),
        pick('bio-m-respiration-m',            ['bio-m-photosynthesis-m'], 7, name='呼吸作用'),
        pick('bio-m-transpiration',            ['bio-m-leaf-structure'], 7, name='蒸腾作用'),
        pick('bio-m-flower-structure',         ['bio-m-transpiration'], 7, name='花的结构与传粉'),
        pick('bio-m-fruit-seed-formation',     ['bio-m-flower-structure'], 7, name='果实与种子的形成'),
        pick('bio-m-asexual-reproduction',     ['bio-m-fruit-seed-formation'], 7, name='植物的无性生殖'),
        pick('bio-m-plant-classification',     ['bio-m-asexual-reproduction'], 7, name='植物的主要类群'),
    ]
}

# 域4：人体
human = {
    'id': 'human-body', 'name': '人体结构与功能', 'color': '#dc2626',
    'nodes': [
        pick('bio-m-human-body-overview',      ['bio-m-tissue-types'], 7, name='人体概述'),
        pick('bio-m-digestion-system',         ['bio-m-human-body-overview'], 7, name='消化系统'),
        pick('bio-m-respiratory-system',       ['bio-m-digestion-system'], 7, name='呼吸系统'),
        pick('bio-m-circulatory-system',       ['bio-m-respiratory-system'], 7, name='循环系统'),
        pick('bio-m-circulation-respiration',  ['bio-m-circulatory-system'], 7, name='循环与呼吸综合'),
        pick('bio-m-excretory-system',         ['bio-m-circulatory-system'], 7, name='排泄系统'),
        pick('bio-m-urinary-nervous',          ['bio-m-excretory-system'], 7, name='泌尿系统'),
        pick('bio-m-nervous-system-m',         ['bio-m-urinary-nervous'], 7, name='神经系统'),
        pick('bio-m-endocrine-system-m',       ['bio-m-nervous-system-m'], 7, name='内分泌系统'),
        pick('bio-m-reproduction-development', ['bio-m-endocrine-system-m'], 7, name='人的生殖与发育'),
    ]
}

# 域5：动物、微生物与健康
animal_micro = {
    'id': 'animal-microbe', 'name': '动物、微生物与健康', 'color': '#f59e0b',
    'nodes': [
        pick('bio-m-animal-diversity',         ['bio-m-tissue-types'], 8, name='动物的主要类群'),
        pick('bio-m-animal-behavior',          ['bio-m-animal-diversity'], 8, name='动物行为'),
        pick('bio-m-microorganism',            ['bio-m-animal-diversity', 'bio-m-cell-structure-m'], 8, name='微生物（细菌/真菌/病毒）'),
        pick('bio-m-infectious-disease',       ['bio-m-microorganism'], 8, name='传染病与免疫'),
        pick('bio-m-microorganism-health',     ['bio-m-infectious-disease'], 8, name='微生物与人类健康'),
    ]
}

# 域6：生物多样性与进化
biodiversity = {
    'id': 'biodiversity', 'name': '生物多样性与跨学科实践', 'color': '#a855f7',
    'nodes': [
        pick('bio-m-bio-classification',       ['bio-m-animal-behavior'], 8, name='生物分类'),
        pick('bio-m-biodiversity-m',           ['bio-m-bio-classification'], 8, name='生物多样性及其保护'),
        pick('bio-m-biology-cross-disciplinary-practice',['bio-m-biodiversity-m'], 8, name='生物学跨学科实践'),
    ]
}

new_domains = []
for d in [structure, biosphere, plants, human, animal_micro, biodiversity]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中生物重构：{len(new_domains)} 域")
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
