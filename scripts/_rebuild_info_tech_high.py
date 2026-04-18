#!/usr/bin/env python3
"""批次5-6：高中信息技术按 2017 修订 2020 版高中信息技术课标重构"""
import json
from pathlib import Path

p = Path('data/trees/info-tech-high.json')
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

# 高中信息技术课标（2017 修订 2020）主题：
# 必修：数据与计算、信息系统与社会
# 选必：数据与数据结构、网络基础、数据管理与分析、人工智能初步、三维设计与创意、开源硬件项目设计

programming = {'id':'programming','name':'程序设计与数据结构','color':'#3b82f6','nodes':[
    pick('it-h-programming-basics',        [], 10, name='程序设计基础（变量/数据类型）'),
    pick('it-h-control-structures',        ['it-h-programming-basics'], 10, name='程序控制结构（顺序/分支/循环）'),
    pick('it-h-functions-modules',         ['it-h-control-structures'], 10, name='函数与模块化'),
    pick('it-h-data-structures',           ['it-h-functions-modules'], 10, name='数据结构（列表/栈/队列/树/图）'),
]}

algorithms = {'id':'algorithms','name':'算法','color':'#10b981','nodes':[
    pick('it-h-algorithm-concept',         ['it-h-data-structures'], 10, name='算法概念与复杂度'),
    pick('it-h-sorting-searching',         ['it-h-algorithm-concept'], 10, name='排序与查找算法'),
    pick('it-h-recursion',                 ['it-h-algorithm-concept', 'it-h-sorting-searching'], 11, name='递归与分治'),
]}

network_security = {'id':'network-security','name':'网络与信息安全','color':'#f59e0b','nodes':[
    pick('it-h-network-basics',            ['it-h-programming-basics'], 10, name='计算机网络基础（TCP/IP）'),
    pick('it-h-internet-applications',     ['it-h-network-basics'], 10, name='互联网应用（HTTP/Web/邮件）'),
    pick('it-h-information-security',      ['it-h-internet-applications'], 10, name='信息安全与隐私保护'),
]}

new_domains = []
for d in [programming, algorithms, network_security]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"\n✅ 高中信息技术重构：{len(new_domains)} 域")
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
