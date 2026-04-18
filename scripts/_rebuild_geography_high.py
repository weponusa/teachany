#!/usr/bin/env python3
"""批次5-4：高中地理按 2017 修订 2020 版高中地理课标重构"""
import json
from pathlib import Path

p = Path('data/trees/geography-high.json')
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

# 高中地理课标结构：必修1 自然地理 + 必修2 人文地理 + 选必1/2/3（自然地理基础 / 区域发展 / 资源环境与国家安全）

# 域1：地球与宇宙
earth_universe = {'id':'earth-universe','name':'地球与宇宙环境','color':'#3b82f6','nodes':[
    pick('geo-h-earth-in-universe',        [], 10, name='地球的宇宙环境'),
    pick('geo-h-earth-rotation',           ['geo-h-earth-in-universe'], 10, name='地球的自转（地方时/地转偏向力）'),
    pick('geo-h-earth-revolution',         ['geo-h-earth-rotation'], 10, name='地球的公转（黄赤交角/正午太阳高度）'),
    pick('geo-h-earth-motion',             ['geo-h-earth-revolution'], 10, name='地球运动综合'),
    pick('geo-h-earth-structure',          ['geo-h-earth-in-universe'], 10, name='地球的内部圈层'),
]}

# 域2：自然地理
physical = {'id':'physical-geography','name':'自然地理（大气·水·地貌·整体性）','color':'#10b981','nodes':[
    # 大气
    pick('geo-h-atmosphere',               ['geo-h-earth-rotation'], 10, name='大气圈综合'),
    pick('geo-h-atmospheric-heating',      ['geo-h-atmosphere'], 10, name='大气的受热过程'),
    pick('geo-h-atmospheric-circulation',  ['geo-h-atmospheric-heating'], 10, name='大气环流'),
    pick('geo-h-global-circulation',       ['geo-h-atmospheric-circulation'], 10, name='全球性大气环流'),
    pick('geo-h-weather-system',           ['geo-h-global-circulation'], 10, name='常见天气系统'),
    pick('geo-h-climate-types',            ['geo-h-weather-system'], 10, name='气候类型与分布'),
    pick('geo-h-climate-change',           ['geo-h-climate-types'], 10, name='全球气候变化'),
    # 水圈
    pick('geo-h-hydrosphere',              ['geo-h-atmospheric-heating'], 10, name='水圈综合'),
    pick('geo-h-water-cycle',              ['geo-h-hydrosphere'], 10, name='水循环'),
    pick('geo-h-ocean-current',            ['geo-h-water-cycle', 'geo-h-global-circulation'], 10, name='洋流'),
    pick('geo-h-river-features',           ['geo-h-water-cycle'], 10, name='河流特征与开发利用'),
    # 地貌
    pick('geo-h-plate-tectonics',          ['geo-h-earth-structure'], 10, name='板块构造'),
    pick('geo-h-crustal-movement',         ['geo-h-plate-tectonics'], 10, name='地壳运动'),
    pick('geo-h-landforms',                ['geo-h-crustal-movement'], 10, name='主要地貌类型'),
    # 整体性
    pick('geo-h-vegetation-soil',          ['geo-h-climate-types'], 10, name='植被与土壤'),
    pick('geo-h-natural-integrity',        ['geo-h-vegetation-soil', 'geo-h-landforms'], 10, name='自然地理环境整体性'),
    pick('geo-h-natural-zones',            ['geo-h-natural-integrity'], 10, name='自然地理环境差异性（自然带）'),
    pick('geo-h-natural-disaster',         ['geo-h-crustal-movement', 'geo-h-weather-system'], 10, name='自然灾害'),
]}

# 域3：人文地理
human_geo = {'id':'human-geography','name':'人文地理（人口·城市·产业·交通）','color':'#f59e0b','nodes':[
    pick('geo-h-population-growth',        [], 11, name='人口增长与分布'),
    pick('geo-h-population-migration',     ['geo-h-population-growth'], 11, name='人口迁移'),
    pick('geo-h-population-urbanization',  ['geo-h-population-migration'], 11, name='人口与城市化综合'),
    pick('geo-h-urbanization',             ['geo-h-population-migration'], 11, name='城市化'),
    pick('geo-h-urban-structure',          ['geo-h-urbanization'], 11, name='城市空间结构'),
    pick('geo-h-urban-problems',           ['geo-h-urbanization'], 11, name='城市化问题与城市规划'),
    # 产业
    pick('geo-h-agriculture',              ['geo-h-urbanization'], 11, name='农业'),
    pick('geo-h-agriculture-location',     ['geo-h-climate-types', 'geo-h-natural-zones'], 11, name='农业区位因素'),
    pick('geo-h-agriculture-types',        ['geo-h-agriculture-location'], 11, name='主要农业地域类型'),
    pick('geo-h-industry-services',        ['geo-h-urbanization'], 11, name='工业与服务业'),
    pick('geo-h-industry-location',        ['geo-h-industry-services'], 11, name='工业区位'),
    pick('geo-h-industry-cluster',         ['geo-h-industry-location'], 11, name='工业地域与工业集聚'),
    pick('geo-h-service-location',         ['geo-h-urbanization'], 11, name='服务业区位'),
    pick('geo-h-transportation',           ['geo-h-urbanization', 'geo-h-industry-location'], 11, name='交通运输布局'),
    pick('geo-h-transportation-communication',['geo-h-transportation'], 11, name='交通与区域发展'),
]}

# 域4：资源、环境与可持续发展
sustainable = {'id':'sustainable','name':'资源、环境与可持续发展','color':'#dc2626','nodes':[
    pick('geo-h-resource-energy',          ['geo-h-industry-services'], 11, name='自然资源与能源'),
    pick('geo-h-environmental-issues',     ['geo-h-climate-change', 'geo-h-resource-energy'], 11, name='环境问题'),
    pick('geo-h-sustainable-development',  ['geo-h-environmental-issues'], 11, name='可持续发展理念与实践'),
]}

new_domains = []
for d in [earth_universe, physical, human_geo, sustainable]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"\n✅ 高中地理重构：{len(new_domains)} 域")
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
