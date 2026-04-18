#!/usr/bin/env python3
"""批次5-5：高中历史按 2017 修订 2020 版高中历史课标重构"""
import json
from pathlib import Path

p = Path('data/trees/history-high.json')
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

# 高中历史（2017 修订 2020）：中外历史纲要（上下）+ 选必1/2/3（国家制度与社会治理 / 经济与社会生活 / 文化交流与传播）

ancient_china = {'id':'ancient-china-h','name':'中国古代史','color':'#dc2626','nodes':[
    pick('hist-h-ancient-civ',             [], 10, name='中华文明起源'),
    pick('hist-h-classical-civ',           ['hist-h-ancient-civ'], 10, name='先秦（夏商周·春秋战国）'),
    pick('hist-h-qin-han-empire',          ['hist-h-classical-civ'], 10, name='秦汉大一统'),
    pick('hist-h-wei-jin-tang',            ['hist-h-qin-han-empire'], 10, name='三国两晋南北朝与隋唐'),
    pick('hist-h-song-yuan-ming-qing-h',   ['hist-h-wei-jin-tang'], 10, name='宋元明清'),
    pick('hist-h-ancient-culture',         ['hist-h-classical-civ'], 10, name='中国古代思想文化'),
]}

modern_china = {'id':'modern-china-h','name':'中国近现代史','color':'#f59e0b','nodes':[
    pick('hist-h-opium-war-h',             ['hist-h-song-yuan-ming-qing-h'], 10, name='鸦片战争与近代中国'),
    pick('hist-h-semi-colonial',           ['hist-h-opium-war-h'], 10, name='半殖民地半封建社会'),
    pick('hist-h-reform-revolution-h',     ['hist-h-semi-colonial'], 10, name='戊戌变法与辛亥革命'),
    pick('hist-h-new-democracy',           ['hist-h-reform-revolution-h'], 10, name='新民主主义革命'),
    pick('hist-h-prc-establishment',       ['hist-h-new-democracy'], 11, name='中华人民共和国成立'),
    pick('hist-h-reform-opening',          ['hist-h-prc-establishment'], 11, name='改革开放'),
]}

world_ancient_h = {'id':'world-ancient-h','name':'世界古代中世纪史','color':'#10b981','nodes':[
    pick('hist-h-ancient-civ-h',           [], 11, name='古代亚非欧文明'),
    pick('hist-h-medieval-h',              ['hist-h-ancient-civ-h'], 11, name='中古时期（欧洲/亚洲/非洲美洲）'),
]}

world_modern_h = {'id':'world-modern-h','name':'世界近现代史','color':'#3b82f6','nodes':[
    pick('hist-h-age-of-exploration',      ['hist-h-medieval-h'], 11, name='新航路开辟与殖民扩张'),
    pick('hist-h-enlightenment',           ['hist-h-age-of-exploration'], 11, name='文艺复兴、宗教改革与启蒙运动'),
    pick('hist-h-industrial-rev-h',        ['hist-h-enlightenment'], 11, name='工业革命'),
    pick('hist-h-marxism-russian',         ['hist-h-industrial-rev-h'], 11, name='马克思主义与俄国革命'),
    pick('hist-h-two-world-wars',          ['hist-h-marxism-russian'], 12, name='两次世界大战'),
    pick('hist-h-cold-war-h',              ['hist-h-two-world-wars'], 12, name='冷战格局'),
    pick('hist-h-globalization-h',         ['hist-h-cold-war-h'], 12, name='全球化与多极化'),
]}

thematic = {'id':'thematic-history','name':'专题史（选择性必修）','color':'#a855f7','nodes':[
    # 选必1 国家制度与社会治理
    pick('hist-h-political-system-evolution',['hist-h-song-yuan-ming-qing-h'], 11, name='中外政治制度演变'),
    # 选必2 经济与社会生活
    pick('hist-h-economic-history',        ['hist-h-industrial-rev-h'], 11, name='经济史与社会生活'),
    # 选必3 文化交流与传播
    pick('hist-h-cultural-thought-history',['hist-h-ancient-culture', 'hist-h-enlightenment'], 12, name='文化史与思想史'),
    pick('hist-h-science-technology-h',    ['hist-h-industrial-rev-h'], 12, name='科技史'),
    pick('hist-h-ideological-liberation',  ['hist-h-enlightenment'], 12, name='思想解放潮流'),
    pick('hist-h-reform-comparison',       ['hist-h-reform-opening'], 12, name='中外改革比较'),
]}

new_domains = []
for d in [ancient_china, modern_china, world_ancient_h, world_modern_h, thematic]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"\n✅ 高中历史重构：{len(new_domains)} 域")
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
