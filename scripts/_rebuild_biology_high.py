#!/usr/bin/env python3
"""批次5-3：高中生物按 2017 修订 2020 版高中生物课标重构"""
import json
from pathlib import Path

p = Path('data/trees/biology-high.json')
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

# 按 2017 高中生物课标：必修1 分子与细胞 + 必修2 遗传与进化 + 选必1 稳态与调节 + 选必2 生物与环境 + 选必3 生物技术

cell_structure = {'id':'cell-structure','name':'细胞的结构','color':'#10b981','nodes':[
    pick('bio-h-cell-structure',           [], 10, name='细胞总论'),
    pick('bio-h-elements-compounds',       ['bio-h-cell-structure'], 10, name='组成细胞的元素与化合物'),
    pick('bio-h-protein-nucleic-acid',     ['bio-h-elements-compounds'], 10, name='蛋白质与核酸'),
    pick('bio-h-sugar-lipid',              ['bio-h-elements-compounds'], 10, name='糖类与脂质'),
    pick('bio-h-cell-membrane',            ['bio-h-protein-nucleic-acid', 'bio-h-sugar-lipid'], 10, name='细胞膜结构'),
    pick('bio-h-organelles',               ['bio-h-cell-membrane'], 10, name='细胞器'),
    pick('bio-h-endomembrane-system',      ['bio-h-organelles'], 10, name='生物膜系统'),
    pick('bio-h-nucleus',                  ['bio-h-organelles'], 10, name='细胞核'),
    pick('bio-h-prokaryote-eukaryote',     ['bio-h-nucleus'], 10, name='原核细胞与真核细胞'),
]}

metabolism = {'id':'cell-metabolism','name':'细胞代谢','color':'#3b82f6','nodes':[
    pick('bio-h-cell-metabolism',          ['bio-h-cell-membrane'], 10, name='细胞代谢总论'),
    pick('bio-h-transport-across-membrane',['bio-h-cell-membrane'], 10, name='物质跨膜运输'),
    pick('bio-h-enzyme',                   ['bio-h-transport-across-membrane'], 10, name='酶'),
    pick('bio-h-atp',                      ['bio-h-enzyme'], 10, name='ATP 与能量代谢'),
    pick('bio-h-cellular-respiration',     ['bio-h-atp'], 10, name='细胞呼吸'),
    pick('bio-h-photosynthesis',           ['bio-h-atp'], 10, name='光合作用'),
    pick('bio-h-photosynthesis-respiration-relation',['bio-h-cellular-respiration', 'bio-h-photosynthesis'], 10, name='光合与呼吸的关系'),
]}

cell_life = {'id':'cell-life','name':'细胞的生命历程','color':'#f59e0b','nodes':[
    pick('bio-h-cell-division',            ['bio-h-nucleus'], 10, name='细胞分裂综合'),
    pick('bio-h-cell-cycle',               ['bio-h-photosynthesis-respiration-relation'], 10, name='细胞周期'),
    pick('bio-h-mitosis',                  ['bio-h-cell-cycle'], 10, name='有丝分裂'),
    pick('bio-h-meiosis',                  ['bio-h-mitosis'], 10, name='减数分裂'),
    pick('bio-h-cell-differentiation',     ['bio-h-mitosis'], 10, name='细胞分化'),
    pick('bio-h-stem-cell',                ['bio-h-cell-differentiation'], 10, name='干细胞'),
    pick('bio-h-cell-aging-apoptosis',     ['bio-h-stem-cell'], 10, name='细胞衰老与凋亡'),
    pick('bio-h-cancer-cell',              ['bio-h-cell-aging-apoptosis'], 10, name='癌细胞与癌症防治'),
]}

genetics_mendel = {'id':'genetics-mendel','name':'孟德尔遗传定律','color':'#dc2626','nodes':[
    pick('bio-h-genetics-mendel',          ['bio-h-meiosis'], 10, name='孟德尔遗传综合'),
    pick('bio-h-mendel-law-1',             ['bio-h-meiosis'], 10, name='分离定律'),
    pick('bio-h-mendel-law-2',             ['bio-h-mendel-law-1'], 10, name='自由组合定律'),
    pick('bio-h-sex-linked-inheritance',   ['bio-h-mendel-law-2'], 10, name='伴性遗传'),
    pick('bio-h-human-genetics',           ['bio-h-sex-linked-inheritance'], 10, name='人类遗传病'),
]}

genetics_molecular = {'id':'genetics-molecular','name':'基因的分子基础','color':'#a855f7','nodes':[
    pick('bio-h-dna-gene',                 ['bio-h-human-genetics'], 10, name='DNA 与基因综合'),
    pick('bio-h-dna-is-genetic-material',  ['bio-h-human-genetics'], 10, name='DNA 是遗传物质'),
    pick('bio-h-dna-structure',            ['bio-h-dna-is-genetic-material'], 10, name='DNA 分子结构'),
    pick('bio-h-dna-replication',          ['bio-h-dna-structure'], 10, name='DNA 复制'),
    pick('bio-h-gene-concept',             ['bio-h-dna-replication'], 10, name='基因的概念与表达'),
    pick('bio-h-gene-to-protein',          ['bio-h-gene-concept'], 10, name='从基因到蛋白质'),
    pick('bio-h-gene-regulation',          ['bio-h-gene-to-protein'], 10, name='基因表达调控'),
]}

variation_evolution = {'id':'variation-evolution','name':'变异与进化','color':'#f97316','nodes':[
    pick('bio-h-genetic-variation',        ['bio-h-gene-regulation'], 10, name='遗传变异综合'),
    pick('bio-h-gene-mutation',            ['bio-h-gene-regulation'], 10, name='基因突变'),
    pick('bio-h-chromosome-variation',     ['bio-h-gene-mutation'], 10, name='染色体变异'),
    pick('bio-h-breeding',                 ['bio-h-chromosome-variation'], 10, name='育种'),
    pick('bio-h-evolution-evidence',       ['bio-h-breeding'], 10, name='生物进化的证据'),
    pick('bio-h-natural-selection',        ['bio-h-evolution-evidence'], 10, name='自然选择与适应'),
    pick('bio-h-speciation',               ['bio-h-natural-selection'], 10, name='物种形成'),
]}

homeostasis = {'id':'homeostasis','name':'稳态与调节','color':'#ec4899','nodes':[
    pick('bio-h-internal-environment',     [], 11, name='内环境与稳态'),
    pick('bio-h-nervous-regulation',       ['bio-h-internal-environment', 'bio-h-atp'], 11, name='神经调节'),
    pick('bio-h-humoral-regulation',       ['bio-h-nervous-regulation'], 11, name='体液调节'),
    pick('bio-h-blood-sugar-regulation',   ['bio-h-humoral-regulation'], 11, name='血糖调节与糖尿病'),
    pick('bio-h-immune-regulation',        ['bio-h-humoral-regulation'], 11, name='免疫调节'),
    pick('bio-h-nervous-humoral-immune',   ['bio-h-blood-sugar-regulation', 'bio-h-immune-regulation'], 11, name='神经—体液—免疫综合'),
    pick('bio-h-plant-hormone',            ['bio-h-nervous-humoral-immune'], 11, name='植物激素调节'),
]}

ecology = {'id':'ecology','name':'生态学','color':'#06b6d4','nodes':[
    pick('bio-h-ecosystem',                [], 11, name='生态系统总论'),
    pick('bio-h-population',                [], 11, name='种群及其特征'),
    pick('bio-h-community',                ['bio-h-population'], 11, name='群落'),
    pick('bio-h-ecosystem-structure',      ['bio-h-community'], 11, name='生态系统结构'),
    pick('bio-h-energy-flow',              ['bio-h-ecosystem-structure'], 11, name='生态系统能量流动'),
    pick('bio-h-material-cycle-h',         ['bio-h-ecosystem-structure'], 11, name='生态系统物质循环'),
    pick('bio-h-information-transmission', ['bio-h-material-cycle-h', 'bio-h-energy-flow'], 11, name='生态系统信息传递'),
    pick('bio-h-ecosystem-stability',      ['bio-h-information-transmission'], 11, name='生态系统稳定性'),
    pick('bio-h-biodiversity-h',           ['bio-h-ecosystem-stability'], 11, name='生物多样性及其保护'),
]}

new_domains = []
for d in [cell_structure, metabolism, cell_life, genetics_mendel, genetics_molecular, variation_evolution, homeostasis, ecology]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"\n✅ 高中生物重构：{len(new_domains)} 域")
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
