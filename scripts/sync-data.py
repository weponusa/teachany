#!/usr/bin/env python3
"""
数据合并脚本：将 courseware-registry.json 和 data/trees/*.json 双向同步。

策略：
1. registry 是官方课程的唯一数据源（single source of truth）
2. tree 中 active 节点如果有课件但不在 registry → 补入 registry
3. registry 中有但 tree 中无对应节点 → 映射到已有节点并修正 node_id
4. 统一 node_id：registry 的 node_id 必须与 tree 的 node_id 一致
"""

import json
import os
import re
import glob
import shutil
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY_PATH = os.path.join(ROOT, 'courseware-registry.json')
TREES_DIR = os.path.join(ROOT, 'data', 'trees')

# ── 手动映射：registry node_id → tree node_id（不一致的情况）
REGISTRY_TO_TREE_MAP = {
    # registry node_id 和 tree node_id 不同，但指向同一课件
    'ohms-law': 'ohm-law',                  # 差一个 s
    'periodic-table': 'element-concept',     # 完全不同的 id

    # 10 个生物课件，registry 中的 node_id 在 tree 中不存在
    # 映射到 biology-middle.json 中最匹配的已有节点
    'biosphere': 'biosphere-largest',                 # 生物与生物圈 → 生物圈是最大的生态系统
    'cell-basics': 'cell-structure-m',                # 细胞基础 → 动植物细胞结构
    'cell-division': 'cell-division-m',               # 细胞分裂 → 细胞分裂与分化
    'circulation': 'circulatory-system',              # 循环系统 → 血液循环系统
    'cross-disciplinary': 'cross-disciplinary-practice',  # 跨学科 → 跨学科实践
    'human-digestive': 'digestion-system',            # 消化系统 → 消化系统
    'plant-reproduction': 'flower-structure',         # 植物生殖与类群 → 花的结构与传粉
    'plant-structure': 'leaf-structure',              # 植物结构与生理 → 叶片结构与气孔
    'reproduction': 'human-reproduction',             # 人的生殖 → 人的生殖与发育
    'urinary-nervous': 'excretory-system',            # 泌尿/神经 → 泌尿系统与排泄
}

# ── subject + grade → tree file 映射
SUBJECT_TREE_MAP = {
    ('math', 'elementary'): 'math-elementary.json',
    ('math', 'middle'): 'math-middle.json',
    ('math', 'high'): 'math-high.json',
    ('physics', 'middle'): 'physics-middle.json',
    ('physics', 'high'): 'physics-high.json',
    ('chemistry', 'middle'): 'chemistry-middle.json',
    ('chemistry', 'high'): 'chemistry-high.json',
    ('biology', 'middle'): 'biology-middle.json',
    ('biology', 'high'): 'biology-high.json',
    ('chinese', 'elementary'): 'chinese-elementary.json',
    ('chinese', 'middle'): 'chinese-middle.json',
    ('chinese', 'high'): 'chinese-high.json',
    ('english', 'elementary'): 'english-elementary.json',
    ('english', 'middle'): 'english-middle.json',
    ('english', 'high'): 'english-high.json',
    ('geography', 'middle'): 'geography-middle.json',
    ('geography', 'high'): 'geography-high.json',
    ('history', 'middle'): 'history-middle.json',
    ('history', 'high'): 'history-high.json',
}


def grade_to_level(grade):
    """年级数字转学段"""
    g = int(grade) if grade else 0
    if 1 <= g <= 6:
        return 'elementary'
    elif 7 <= g <= 9:
        return 'middle'
    elif 10 <= g <= 12:
        return 'high'
    return 'middle'  # fallback


def get_title_from_examples(local_path):
    """从 examples 目录读取课件标题"""
    examples_dir = os.path.join(ROOT, 'examples', local_path)

    # Try manifest.json
    manifest = os.path.join(examples_dir, 'manifest.json')
    if os.path.isfile(manifest):
        try:
            with open(manifest) as f:
                return json.load(f).get('title', '')
        except:
            pass

    # Try index.html <title>
    index_html = os.path.join(examples_dir, 'index.html')
    if os.path.isfile(index_html):
        try:
            with open(index_html) as f:
                html = f.read(3000)
                m = re.search(r'<title>([^<]+)</title>', html)
                if m:
                    title = m.group(1)
                    # Clean up common suffixes
                    for suffix in [' - TeachAny', ' | TeachAny', ' · TeachAny 互动课件',
                                   ' · 教学课件', ' · TeachAny']:
                        title = title.replace(suffix, '')
                    return title.strip()
        except:
            pass

    return ''


def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def save_registry(data):
    # Backup
    backup = REGISTRY_PATH + '.backup'
    shutil.copy2(REGISTRY_PATH, backup)
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  ✅ Registry saved ({len(data["courses"])} courses)')


def load_tree(filename):
    path = os.path.join(TREES_DIR, filename)
    with open(path) as f:
        return json.load(f)


def save_tree(filename, data):
    path = os.path.join(TREES_DIR, filename)
    backup = path + '.backup'
    shutil.copy2(path, backup)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print('='*60)
    print('TeachAny 数据合并脚本')
    print('='*60)

    registry = load_registry()
    courses = registry.get('courses', [])

    # Index registry by node_id
    reg_by_node = {c['node_id']: c for c in courses if c.get('node_id')}

    # Load all tree active nodes
    tree_active = {}  # node_id -> info
    all_trees = {}    # filename -> tree data
    for tf in sorted(glob.glob(os.path.join(TREES_DIR, '*.json'))):
        fname = os.path.basename(tf)
        tree = load_tree(fname)
        all_trees[fname] = tree
        for domain in tree.get('domains', []):
            for node in domain.get('nodes', []):
                if node.get('status') == 'active' and node.get('courses'):
                    tree_active[node['id']] = {
                        'file': fname,
                        'name': node.get('name', ''),
                        'grade': node.get('grade', ''),
                        'courses': node.get('courses', []),
                        'subject': tree.get('subject', ''),
                        'grade_range': tree.get('grade_range', []),
                    }

    reg_ids = set(reg_by_node.keys())
    tree_ids = set(tree_active.keys())

    print(f'\n当前状态:')
    print(f'  Registry: {len(courses)} courses')
    print(f'  Tree active nodes: {len(tree_active)}')
    print(f'  Both: {len(reg_ids & tree_ids)}')
    print(f'  Tree only: {len(tree_ids - reg_ids)}')
    print(f'  Registry only: {len(reg_ids - tree_ids)}')

    # ── Step 1: 修正 registry 中 node_id 不一致的条目
    print(f'\n── Step 1: 修正 node_id 映射 ──')
    fixed_count = 0
    for old_id, new_id in REGISTRY_TO_TREE_MAP.items():
        if old_id in reg_by_node:
            course = reg_by_node[old_id]
            print(f'  {old_id} → {new_id} (title: {course.get("title", "") or get_title_from_examples(course.get("local_path", ""))})')
            course['node_id'] = new_id
            # Update index
            del reg_by_node[old_id]
            reg_by_node[new_id] = course
            fixed_count += 1
    print(f'  修正了 {fixed_count} 条 node_id')

    # ── Step 2: Tree → Registry 补入缺失课件
    print(f'\n── Step 2: 补入 Tree 中有但 Registry 中无的课件 ──')
    reg_ids = set(reg_by_node.keys())  # Refresh after remapping
    tree_only = tree_ids - reg_ids
    added_count = 0

    for nid in sorted(tree_only):
        info = tree_active[nid]
        course_path = info['courses'][0]  # e.g. 'examples/math-elem-add-sub-within-100'
        local_path = course_path.replace('examples/', '')

        # Verify examples dir exists
        full_path = os.path.join(ROOT, 'examples', local_path)
        if not os.path.isdir(full_path):
            print(f'  ⚠️ SKIP {nid}: examples/{local_path} not found')
            continue

        title = get_title_from_examples(local_path)
        subject = info['subject']
        grade_range = info['grade_range']
        grade = info['grade'] if info['grade'] else (grade_range[0] if grade_range else '')

        new_entry = {
            "id": f"teachany-{local_path}",
            "node_id": nid,
            "title": title or info['name'],
            "subject": subject,
            "grade": grade,
            "local_path": local_path,
            "download_url": "",
            "created_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S+08:00'),
            "source": "batch-sync"
        }

        courses.append(new_entry)
        reg_by_node[nid] = new_entry
        added_count += 1
        print(f'  + {nid:40s} | {subject:10s} | {local_path}')

    print(f'  添加了 {added_count} 条新课件')

    # ── Step 3: 更新 Tree 节点 — 把 registry-only 映射后的课件也标记为 active
    print(f'\n── Step 3: 更新 Tree 节点状态 ──')
    tree_updated_count = 0

    for nid, course in reg_by_node.items():
        local_path = course.get('local_path', '')
        if not local_path:
            continue
        course_ref = f'examples/{local_path}'

        # Find which tree file this node should be in
        subject = course.get('subject', '')
        grade = course.get('grade', '')
        level = grade_to_level(grade)
        tree_file = SUBJECT_TREE_MAP.get((subject, level))

        if not tree_file or tree_file not in all_trees:
            continue

        tree = all_trees[tree_file]
        found = False
        for domain in tree.get('domains', []):
            for node in domain.get('nodes', []):
                if node['id'] == nid:
                    found = True
                    changed = False
                    if node.get('status') != 'active':
                        node['status'] = 'active'
                        changed = True
                    if course_ref not in node.get('courses', []):
                        node['courses'] = [course_ref]
                        changed = True
                    if changed:
                        tree_updated_count += 1
                        print(f'  ✏️ {tree_file}: {nid} → active, courses=[{course_ref}]')
                    break
            if found:
                break

        if not found:
            # Node doesn't exist in tree - this shouldn't happen after remapping
            print(f'  ⚠️ Node {nid} not found in {tree_file}')

    print(f'  更新了 {tree_updated_count} 个 tree 节点')

    # ── Step 4: 保存所有文件
    print(f'\n── Step 4: 保存文件 ──')
    registry['courses'] = courses
    save_registry(registry)

    for fname, tree in all_trees.items():
        save_tree(fname, tree)
        # Count active nodes
        active = sum(1 for d in tree['domains'] for n in d['nodes']
                     if n.get('status') == 'active' and n.get('courses'))
        print(f'  ✅ {fname} saved ({active} active nodes)')

    # ── Final stats
    print(f'\n{"="*60}')
    print(f'合并完成!')
    print(f'  Registry: {len(courses)} courses (was 59)')
    final_active = sum(1 for d in tree_active.values())
    print(f'  所有数据已同步')
    print(f'{"="*60}')

    # ── Verification
    print(f'\n── 验证 ──')
    final_reg_ids = set(c['node_id'] for c in courses if c.get('node_id'))

    # Reload trees for verification
    final_tree_ids = set()
    for tf in sorted(glob.glob(os.path.join(TREES_DIR, '*.json'))):
        with open(tf) as f:
            tree = json.load(f)
        for domain in tree.get('domains', []):
            for node in domain.get('nodes', []):
                if node.get('status') == 'active' and node.get('courses'):
                    final_tree_ids.add(node['id'])

    both = final_reg_ids & final_tree_ids
    reg_only = final_reg_ids - final_tree_ids
    tree_only = final_tree_ids - final_reg_ids

    print(f'  Registry node_ids: {len(final_reg_ids)}')
    print(f'  Tree active node_ids: {len(final_tree_ids)}')
    print(f'  Both: {len(both)}')
    print(f'  Registry only: {len(reg_only)}')
    if reg_only:
        for nid in sorted(reg_only):
            print(f'    - {nid}')
    print(f'  Tree only: {len(tree_only)}')
    if tree_only:
        for nid in sorted(tree_only):
            print(f'    - {nid}')


if __name__ == '__main__':
    main()
