#!/usr/bin/env python3
"""扫描所有知识点数据源，统计字段分布"""
import json, glob
from collections import Counter

all_fields = Counter()
nodes = []

def walk_node(x):
    if isinstance(x, dict):
        if 'id' in x and 'name' in x and 'grade' in x and 'prerequisites' in x:
            for k in x.keys(): all_fields[k] += 1
            nodes.append(x)
        for v in x.values(): walk_node(v)
    elif isinstance(x, list):
        for v in x: walk_node(v)

for fp in glob.glob('data/trees/**/*.json', recursive=True):
    with open(fp) as f: d = json.load(f)
    walk_node(d)

print(f'== 知识树节点: {len(nodes)} ==')
for k, v in all_fields.most_common():
    print(f'  {k}: {v}')

# excerpts
ex_fields = Counter()
ex_count = 0
type_counter = Counter()
src_counter = Counter()
ex_by_kp = {}
for fp in glob.glob('_archive_20260508/_excerpts_backup_20260508/excerpts_legacy/**/*.json', recursive=True):
    with open(fp) as f: d = json.load(f)
    items = d.get('excerpts', []) if isinstance(d, dict) else (d if isinstance(d, list) else [])
    for e in items:
        if not isinstance(e, dict): continue
        ex_count += 1
        for k in e.keys(): ex_fields[k] += 1
        type_counter[e.get('type', '')] += 1
        src_counter[e.get('source', '')] += 1
        kp = e.get('kp_id', '')
        ex_by_kp.setdefault(kp, []).append(e)

print(f'\n== Excerpts: {ex_count} ==')
for k, v in ex_fields.most_common():
    print(f'  {k}: {v}')
print(f'\nkp_id 唯一数: {len(ex_by_kp)}')
print(f'\nexcerpt types:')
for k, v in type_counter.most_common():
    print(f'  {k}: {v}')
print(f'\ntop 20 sources:')
for k, v in src_counter.most_common(20):
    print(f'  {k}: {v}')

# 节点 id 与 excerpt kp_id 的匹配率
node_ids = {n['id'] for n in nodes}
ex_kp_ids = set(ex_by_kp.keys())
# excerpt kp_id 形如 kp-{node_id} 或 kp-{parent}-{node_id}，提取尾部
def extract_node_id(kp):
    if not kp.startswith('kp-'): return kp
    return kp[3:]
matched_direct = sum(1 for k in ex_kp_ids if extract_node_id(k) in node_ids)
# fill-kp- 前缀
fill = [k for k in ex_kp_ids if k.startswith('fill-kp-')]
print(f'\nexcerpt kp_id 直接匹配 node_id（去 kp- 前缀）: {matched_direct}/{len(ex_kp_ids)}')
print(f'fill-kp- 前缀的 excerpt id 数: {len(fill)}')
