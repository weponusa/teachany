#!/usr/bin/env python3
"""批次4-5：初中历史按 2022 版义务教育历史课标重构"""
import json
from pathlib import Path

p = Path('data/trees/history-middle.json')
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

# 域1：中国古代史
ancient_china = {
    'id': 'ancient-china', 'name': '中国古代史', 'color': '#dc2626',
    'nodes': [
        pick('hist-m-prehistoric',             [], 7, name='史前时期（元谋人/北京人/半坡/河姆渡）'),
        pick('hist-m-xia-shang-zhou',          ['hist-m-prehistoric'], 7, name='夏商西周'),
        pick('hist-m-spring-autumn-warring',   ['hist-m-xia-shang-zhou'], 7, name='春秋战国'),
        pick('hist-m-qin-han-unification',     ['hist-m-spring-autumn-warring'], 7, name='秦汉大一统'),
        pick('hist-m-three-kingdoms-sui-tang', ['hist-m-qin-han-unification'], 7, name='三国两晋南北朝与隋唐'),
        pick('hist-m-song-yuan-ming-qing',     ['hist-m-three-kingdoms-sui-tang'], 7, name='宋元明清'),
        pick('hist-m-tang-song-prosperity',    ['hist-m-three-kingdoms-sui-tang'], 7, name='唐宋繁荣'),
        pick('hist-m-ming-qing-decline',       ['hist-m-song-yuan-ming-qing'], 7, name='明清衰落与闭关锁国'),
        pick('hist-m-ancient-culture',         ['hist-m-qin-han-unification'], 7, name='中国古代文化成就'),
        pick('hist-m-early-civilizations',     ['hist-m-prehistoric'], 7, name='早期国家的形成'),
    ]
}

# 域2：中国近代史
modern_china = {
    'id': 'modern-china', 'name': '中国近代史', 'color': '#f59e0b',
    'nodes': [
        pick('hist-m-opium-war',               ['hist-m-song-yuan-ming-qing'], 8, name='鸦片战争'),
        pick('hist-m-opium-war-era',           ['hist-m-opium-war'], 8, name='鸦片战争后的中国'),
        pick('hist-m-taiping-westernization',  ['hist-m-opium-war'], 8, name='太平天国运动与洋务运动'),
        pick('hist-m-reform-1898',             ['hist-m-taiping-westernization'], 8, name='戊戌变法'),
        pick('hist-m-reform-revolution',       ['hist-m-reform-1898'], 8, name='改革与革命'),
        pick('hist-m-xinhai-revolution',       ['hist-m-reform-1898'], 8, name='辛亥革命'),
        pick('hist-m-may-fourth',              ['hist-m-xinhai-revolution'], 8, name='五四运动'),
        pick('hist-m-cpc-founding',            ['hist-m-may-fourth'], 8, name='中国共产党的诞生'),
        pick('hist-m-northern-expedition',     ['hist-m-cpc-founding'], 8, name='北伐战争与南京国民政府'),
        pick('hist-m-anti-japan-war',          ['hist-m-northern-expedition'], 8, name='抗日战争'),
        pick('hist-m-liberation-war',          ['hist-m-anti-japan-war'], 8, name='解放战争'),
        pick('hist-m-new-democratic-revolution',['hist-m-liberation-war'], 8, name='新民主主义革命'),
        pick('hist-m-modern-china-development',['hist-m-new-democratic-revolution'], 8, name='新中国成立与发展'),
    ]
}

# 域3：世界古代史
world_ancient = {
    'id': 'world-ancient', 'name': '世界古代史', 'color': '#10b981',
    'nodes': [
        pick('hist-m-ancient-civilizations',   [], 9, name='古代亚非文明（古埃及/古巴比伦/古印度）'),
        pick('hist-m-greece-rome',             ['hist-m-ancient-civilizations'], 9, name='古希腊与古罗马文明'),
        pick('hist-m-medieval-europe',         ['hist-m-greece-rome'], 9, name='中世纪欧洲'),
    ]
}

# 域4：世界近现代史
world_modern = {
    'id': 'world-modern', 'name': '世界近现代史', 'color': '#3b82f6',
    'nodes': [
        pick('hist-m-renaissance',             ['hist-m-medieval-europe'], 9, name='文艺复兴与宗教改革'),
        pick('hist-m-modern-world-formation',  ['hist-m-renaissance'], 9, name='资本主义制度初步确立'),
        pick('hist-m-english-revolution',      ['hist-m-renaissance'], 9, name='英国资产阶级革命'),
        pick('hist-m-american-revolution',     ['hist-m-english-revolution'], 9, name='美国独立战争'),
        pick('hist-m-french-revolution',       ['hist-m-english-revolution'], 9, name='法国大革命'),
        pick('hist-m-industrial-revolution',   ['hist-m-english-revolution'], 9, name='工业革命'),
        pick('hist-m-industrial-revolution-modernization',['hist-m-industrial-revolution'], 9, name='工业革命与近代化'),
        pick('hist-m-ww1',                     ['hist-m-industrial-revolution'], 9, name='第一次世界大战'),
        pick('hist-m-russian-revolution',      ['hist-m-ww1'], 9, name='俄国十月革命'),
        pick('hist-m-ww2',                     ['hist-m-ww1'], 9, name='第二次世界大战'),
        pick('hist-m-world-wars-cold-war',     ['hist-m-ww2'], 9, name='两次世界大战与冷战'),
        pick('hist-m-cold-war',                ['hist-m-russian-revolution', 'hist-m-ww2'], 9, name='冷战格局'),
        pick('hist-m-globalization',           ['hist-m-cold-war'], 9, name='全球化与多极化'),
    ]
}

new_domains = []
for d in [ancient_china, modern_china, world_ancient, world_modern]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中历史重构：{len(new_domains)} 域")
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
