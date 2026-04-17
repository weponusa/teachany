#!/usr/bin/env python3
"""拆分聚合节点：把堆在一级节点下的课件分配到图谱中对应的细分节点"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tree_dir = os.path.join(ROOT, 'data/trees')
examples_dir = os.path.join(ROOT, 'examples')

# 1. 加载所有树
trees = {}
for f in sorted(os.listdir(tree_dir)):
    if not f.endswith('.json'): continue
    tn = f.replace('.json','')
    with open(os.path.join(tree_dir, f)) as fh:
        trees[tn] = json.load(fh)

# 2. 建立全局节点索引
node_index = {}
for tn, tree in trees.items():
    for di, domain in enumerate(tree.get('domains', [])):
        for ni, node in enumerate(domain.get('nodes', [])):
            node_index[node['id']] = {'tree': tn, 'di': di, 'ni': ni, 'node': node}

# 3. 加载课件 manifest
course_manifest = {}
for d in os.listdir(examples_dir):
    mf = os.path.join(examples_dir, d, 'manifest.json')
    if os.path.exists(mf):
        with open(mf) as fh:
            m = json.load(fh)
        course_manifest[m.get('id', d)] = m

# 4. 课件→目标细分节点映射
split_map = {
    # 初中生物
    'bio-biosphere-largest': 'bio-m-biosphere-largest',
    'bio-biosphere-scope': 'bio-m-biosphere-scope',
    'bio-characteristics': 'bio-m-bio-characteristics',
    'bio-eco-factors': 'bio-m-biosphere',
    'bio-food-chain': 'bio-m-food-chain',
    'bio-cell-life': 'bio-m-cell-life-activities',
    'bio-cell-structure': 'bio-m-cell-structure-m',
    'bio-microscope-use': 'bio-m-microscope-use',
    'bio-tissue-types': 'bio-m-tissue-types',
    'bio-circulation': 'bio-m-circulatory-system',
    'bio-respiratory': 'bio-m-respiratory-system',
    'bio-digestion': 'bio-m-digestion-system',
    'bio-human-overview': 'bio-m-human-body-overview',
    'bio-asexual-repro': 'bio-m-asexual-reproduction',
    'bio-flower-structure': 'bio-m-flower-structure',
    'bio-fruit-seed': 'bio-m-fruit-seed-formation',
    'bio-plant-classify': 'bio-m-plant-classification',
    'bio-leaf-structure': 'bio-m-leaf-structure',
    'bio-photosynthesis': 'bio-m-photosynthesis-m',
    'bio-respiration': 'bio-m-respiration-m',
    'bio-root-tip': 'bio-m-root-tip',
    'bio-seed-structure': 'bio-m-seed-structure',
    'bio-stem-transport': 'bio-m-stem-transport',
    'bio-transpiration': 'bio-m-transpiration',
    'bio-endocrine': 'bio-m-urinary-nervous',
    'bio-excretory': 'bio-m-excretory-system',
    'bio-nervous-system': 'bio-m-urinary-nervous',
    # 小学数学
    'math-elem-word-problems-multiply': 'math-e-word-problems-multiply',
    'math-elem-complex-word-problems': 'math-e-mixed-operations',
    'math-elem-word-problems-basic': 'math-e-word-problems-basic',
    'math-elem-fractions-intro': 'math-e-fractions-intro',
    'math-elem-fractions-meaning': 'math-e-fractions-meaning',
    'math-elem-decimals-intro': 'math-e-decimals-intro',
    'math-elem-decimals-meaning': 'math-e-decimals-meaning',
    'math-elem-volume-calculation': 'math-e-volume-calculation',
    'math-elem-cylinder-cone': 'math-e-cylinder-cone',
    'math-elem-equation-intro': 'math-e-letter-representation',
    'math-elem-simple-equation': 'math-e-simple-equation',
    'math-elem-line-graph': 'math-e-line-graph',
    'math-elem-pictograph': 'math-e-pictograph',
    'math-elem-add-sub-within-20': 'math-e-addition-subtraction-within-20',
    'math-elem-numbers-within-20': 'math-e-numbers-within-20',
    # 高中数学
    'math-high-circle-equation': 'math-h-circle-equation',
    'math-high-conic-comprehensive': 'math-h-conic-comprehensive',
    'math-high-ellipse': 'math-h-ellipse',
    'math-high-hyperbola': 'math-h-hyperbola',
    'math-high-line-equation': 'math-h-line-equation',
    'math-high-parabola-h': 'math-h-parabola-h',
    'math-high-exponential-function': 'math-h-exponential-function',
    'math-high-function-models': 'math-h-function-models',
    'math-high-function-properties': 'math-h-function-properties',
    'math-high-functions-concept': 'math-h-functions-concept',
    'math-high-logarithmic-function': 'math-h-logarithmic-function',
    'math-high-power-function': 'math-h-power-function',
    'math-high-binomial-theorem': 'math-h-binomial-theorem',
    'math-high-counting-principles': 'math-h-counting-principles',
    'math-high-probability-h': 'math-h-probability-h',
    'math-high-random-variable': 'math-h-random-variable',
    'math-high-regression-analysis': 'math-h-regression-analysis',
    'math-high-arithmetic-sequence': 'math-h-arithmetic-sequence',
    'math-high-geometric-sequence': 'math-h-geometric-sequence',
    'math-high-sequence-summation': 'math-h-sequence-summation',
    'math-high-trig-graphs': 'math-h-trig-graphs',
    'math-high-trig-identities': 'math-h-trig-identities',
    'math-high-trig-ratios': 'math-h-trig-ratios',
    'math-high-basic-inequality': 'math-h-basic-inequality',
    'math-high-inequalities': 'math-h-inequalities',
    'math-high-propositions': 'math-h-propositions',
    'math-high-sets': 'math-h-sets',
}

# 5. 聚合节点列表
aggregate_node_ids = [
    'bio-m-biosphere', 'bio-m-cell-basics', 'bio-m-circulation-respiration',
    'bio-m-human-body-overview', 'bio-m-plant-reproduction', 'bio-m-plant-structure',
    'bio-m-urinary-nervous',
    'math-e-word-problems-multiply', 'math-e-mixed-operations',
    'math-e-fractions-intro', 'math-e-decimals-intro', 'math-e-fraction-concept',
    'math-e-decimal-concept', 'math-e-volume-calculation', 'math-e-solid-volume',
    'math-e-letter-representation', 'math-e-data-collection-chart',
    'math-e-addition-subtraction-within-20',
    'math-h-analytic-geometry', 'math-h-functions-advanced',
    'math-h-probability-h', 'math-h-sequences', 'math-h-trigonometric-functions',
    'math-h-inequalities', 'math-h-sets-logic',
]

# 6. 执行拆分
moved = 0
agg_nodes_to_clean = set()

for agg_nid in aggregate_node_ids:
    if agg_nid not in node_index:
        continue
    agg_node = node_index[agg_nid]['node']
    courses = list(agg_node.get('courses', []))
    if len(courses) < 2:
        continue
    
    print(f'\n--- {agg_node["name"]}（{agg_nid}）---')
    new_courses_for_agg = []
    
    for cid in courses:
        target_nid = split_map.get(cid)
        if not target_nid or target_nid == agg_nid:
            new_courses_for_agg.append(cid)
            continue
        
        if target_nid not in node_index:
            print(f'  ⚠️ 目标节点 {target_nid} 不存在，{cid} 保留在 {agg_nid}')
            new_courses_for_agg.append(cid)
            continue
        
        target_node = node_index[target_nid]['node']
        if cid not in target_node.get('courses', []):
            if 'courses' not in target_node:
                target_node['courses'] = []
            target_node['courses'].append(cid)
            if target_node.get('status') != 'active':
                target_node['status'] = 'active'
            moved += 1
            print(f'  ✅ {cid} → {target_nid}（{target_node["name"]}）')
        else:
            print(f'  ⏭️ {cid} 已在 {target_nid}')
    
    agg_node['courses'] = new_courses_for_agg
    if not new_courses_for_agg:
        agg_nodes_to_clean.add(agg_nid)

# 7. 处理重复的聚合概念节点
duplicate_pairs = [
    ('math-e-fraction-concept', 'math-e-fractions-intro'),
    ('math-e-decimal-concept', 'math-e-decimals-intro'),
    ('math-e-solid-volume', 'math-e-volume-calculation'),
]
for dup_nid, keep_nid in duplicate_pairs:
    if dup_nid in node_index and keep_nid in node_index:
        dup = node_index[dup_nid]['node']
        keep = node_index[keep_nid]['node']
        for c in dup.get('courses', []):
            if c not in keep.get('courses', []):
                keep['courses'].append(c)
                print(f'  🔀 合并 {c}: {dup_nid} → {keep_nid}')
        for p in dup.get('prerequisites', []):
            if p not in keep.get('prerequisites', []):
                keep['prerequisites'].append(p)
        dup['courses'] = []
        agg_nodes_to_clean.add(dup_nid)

# 同样处理 math-e-mixed-operations 的交叉课件
if 'math-e-mixed-operations' in node_index:
    mo = node_index['math-e-mixed-operations']['node']
    new_c = []
    for cid in mo.get('courses', []):
        target = split_map.get(cid)
        if target and target != 'math-e-mixed-operations':
            # 已经被拆分到其他节点了
            t_node = node_index.get(target, {}).get('node', {})
            if cid in t_node.get('courses', []):
                print(f'  ⏭️ {cid} 已在 {target}，从 mixed-operations 去除')
                continue
        new_c.append(cid)
    mo['courses'] = new_c

print(f'\n共移动 {moved} 个课件')
print(f'需清理聚合节点: {len(agg_nodes_to_clean)}')

# 8. 清理空壳聚合节点
for nid in sorted(agg_nodes_to_clean):
    if nid not in node_index:
        continue
    info = node_index[nid]
    tn = info['tree']
    di = info['di']
    node = info['node']
    if not node.get('courses'):
        # 检查是否被引用
        is_referenced = False
        for n2id, n2info in node_index.items():
            if n2id == nid:
                continue
            if nid in n2info['node'].get('prerequisites', []):
                is_referenced = True
                break
            if nid in n2info['node'].get('extends', []):
                is_referenced = True
                break
        
        if is_referenced:
            node['status'] = 'gap'
            node['courses'] = []
            print(f'  📝 {nid}（{node["name"]}）→ gap（被引用）')
        else:
            # 重定向引用：其他节点引用该节点的 prerequisite 需要清理
            domain = trees[tn]['domains'][di]
            domain['nodes'] = [n for n in domain['nodes'] if n['id'] != nid]
            print(f'  🗑️ {nid}（{node["name"]}）→ 删除')

# 9. 保存所有树
for tn, tree in trees.items():
    fpath = os.path.join(tree_dir, tn + '.json')
    with open(fpath, 'w', encoding='utf-8') as fh:
        json.dump(tree, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
print(f'\n✅ 所有树文件已保存')

# 10. 更新 manifest.json 的 node_id
manifest_updated = 0
for cid, target_nid in split_map.items():
    if cid in course_manifest:
        m = course_manifest[cid]
        old_nid = m.get('node_id', '')
        if old_nid != target_nid:
            m['node_id'] = target_nid
            dir_name = m.get('id', cid)
            mf_path = os.path.join(examples_dir, dir_name, 'manifest.json')
            if not os.path.exists(mf_path):
                mf_path = os.path.join(examples_dir, cid, 'manifest.json')
            if os.path.exists(mf_path):
                with open(mf_path, 'w', encoding='utf-8') as fh:
                    json.dump(m, fh, ensure_ascii=False, indent=2)
                    fh.write('\n')
                manifest_updated += 1
                print(f'  📋 {cid}: {old_nid} → {target_nid}')

print(f'\n✅ 更新了 {manifest_updated} 个 manifest')

# 11. 最终统计
multi_remaining = 0
for tn, tree in trees.items():
    for domain in tree.get('domains', []):
        for node in domain.get('nodes', []):
            if len(node.get('courses', [])) >= 2:
                multi_remaining += 1
                print(f'  仍有多课件: {node["id"]}（{node["name"]}）× {len(node["courses"])}')

print(f'\n拆分后仍有 {multi_remaining} 个多课件节点（应均为物理压强类的真正多版本）')
