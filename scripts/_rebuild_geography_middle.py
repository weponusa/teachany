#!/usr/bin/env python3
"""批次4-4：初中地理按 2022 版义务教育地理课标重构"""
import json
from pathlib import Path

p = Path('data/trees/geography-middle.json')
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

# 域1：地球与地图
earth_map = {
    'id': 'earth-basics', 'name': '地球与地图', 'color': '#06b6d4',
    'nodes': [
        pick('geo-m-earth-shape-size',         [], 7, name='地球的形状与大小'),
        pick('geo-m-earth-basics',             ['geo-m-earth-shape-size'], 7, name='地球基础知识'),
        pick('geo-m-globe-coordinates',        ['geo-m-earth-shape-size'], 7, name='经纬网与地球坐标'),
        pick('geo-m-earth-motion-m',           ['geo-m-globe-coordinates'], 7, name='地球的自转与公转'),
        pick('geo-m-seasons-m',                ['geo-m-earth-motion-m'], 7, name='四季更替与昼夜长短'),
        pick('geo-m-map-reading',              ['geo-m-globe-coordinates'], 7, name='地图的阅读（比例尺/方向/图例）'),
        pick('geo-m-topographic-map',          ['geo-m-map-reading'], 7, name='等高线与地形图'),
    ]
}

# 域2：世界地理
world = {
    'id': 'world-geography', 'name': '世界地理', 'color': '#3b82f6',
    'nodes': [
        pick('geo-m-continents-oceans',        ['geo-m-globe-coordinates'], 7, name='大洲大洋与海陆变迁'),
        pick('geo-m-terrain-types',            ['geo-m-continents-oceans', 'geo-m-topographic-map'], 7, name='世界地形类型'),
        pick('geo-m-climate-basics',           ['geo-m-seasons-m'], 7, name='气候基础（天气/气温/降水）'),
        pick('geo-m-climate-m',                ['geo-m-climate-basics'], 7, name='世界气候类型与分布'),
        pick('geo-m-population-distribution',  ['geo-m-climate-m'], 7, name='世界人口与人种'),
        pick('geo-m-world-regions',            ['geo-m-climate-m', 'geo-m-continents-oceans'], 7, name='世界地理分区'),
        pick('geo-m-world-countries',          ['geo-m-world-regions'], 7, name='世界主要国家（日/俄/美/澳/巴西等）'),
    ]
}

# 域3：中国地理
china = {
    'id': 'china-geography', 'name': '中国地理', 'color': '#dc2626',
    'nodes': [
        pick('geo-m-china-location',           ['geo-m-continents-oceans'], 8, name='中国的地理位置与疆域'),
        pick('geo-m-china-overview',           ['geo-m-china-location'], 8, name='中国地理总论'),
        pick('geo-m-china-terrain',            ['geo-m-china-location', 'geo-m-terrain-types'], 8, name='中国地形与地势'),
        pick('geo-m-china-climate',            ['geo-m-china-terrain', 'geo-m-climate-m'], 8, name='中国气候'),
        pick('geo-m-china-rivers',             ['geo-m-china-climate'], 8, name='中国河流湖泊'),
        pick('geo-m-china-population',         ['geo-m-china-location'], 8, name='中国人口与民族'),
        pick('geo-m-china-resources',          ['geo-m-china-rivers'], 8, name='中国自然资源'),
    ]
}

# 域4：中国经济地理
economy = {
    'id': 'china-economy', 'name': '中国经济地理', 'color': '#f59e0b',
    'nodes': [
        pick('geo-m-china-agriculture',        ['geo-m-china-resources', 'geo-m-china-population'], 8, name='中国农业'),
        pick('geo-m-china-industry',           ['geo-m-china-resources'], 8, name='中国工业'),
        pick('geo-m-china-transportation',     ['geo-m-china-agriculture', 'geo-m-china-industry'], 8, name='中国交通运输'),
    ]
}

# 域5：中国区域地理
regions = {
    'id': 'china-regions', 'name': '中国区域地理', 'color': '#a855f7',
    'nodes': [
        pick('geo-m-china-regions',            ['geo-m-china-climate', 'geo-m-china-terrain'], 8, name='中国四大地理区域'),
        pick('geo-m-four-regions',             ['geo-m-china-regions'], 8, name='北方、南方、西北、青藏地区'),
        pick('geo-m-north-south',              ['geo-m-four-regions'], 8, name='北方与南方地区对比'),
        pick('geo-m-northwest-qinghai',        ['geo-m-four-regions'], 8, name='西北与青藏地区'),
        pick('geo-m-pearl-river-delta',        ['geo-m-china-industry', 'geo-m-four-regions'], 8, name='珠江三角洲'),
        pick('geo-m-yangtze-delta',            ['geo-m-china-industry', 'geo-m-four-regions'], 8, name='长江三角洲'),
    ]
}

new_domains = []
for d in [earth_map, world, china, economy, regions]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中地理重构：{len(new_domains)} 域")
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
