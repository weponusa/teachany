#!/usr/bin/env python3
"""
fix-node-id.py — 批量修复课件 HTML 中的 teachany-node meta tag

确保每个课件的 <meta name="teachany-node"> 使用 node-index.json 中的完整 node_id，
而非缩写形式或不一致的短名。

策略：
1. 从 node-index.json 构建 dir_name → node_id 映射（courses 字段 + 直接 key 匹配）
2. 对每个课件 HTML：
   a. 如果已有 teachany-node 且值正确 → 跳过
   b. 如果已有 teachany-node 但值是短名 → 修正为完整 node_id
   c. 如果没有 teachany-node → 添加
"""

import json
import os
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
COMMUNITY_DIR = BASE_DIR / "community"
NODE_INDEX_PATH = BASE_DIR / "data" / "node-index.json"


def build_dir_to_node_map():
    """从 node-index.json 构建 dir_name → node_id 映射"""
    idx = json.load(open(NODE_INDEX_PATH, 'r', encoding='utf-8'))
    nodes = idx.get('nodes', {})

    dir_map = {}

    # 方法1：从 courses 字段
    for node_id, info in nodes.items():
        if info.get('curriculum') != 'cn':
            continue
        courses = info.get('courses', [])
        for c in courses:
            if isinstance(c, str):
                dir_map[c] = node_id
            elif isinstance(c, dict):
                cid = c.get('dir', c.get('id', ''))
                if cid:
                    dir_map[cid] = node_id

    # 方法2：直接 key 匹配（目录名本身就是 node_id）
    cn_keys = {k for k, v in nodes.items() if v.get('curriculum') == 'cn'}
    for d in os.listdir(COMMUNITY_DIR):
        if d in cn_keys and d not in dir_map:
            dir_map[d] = d

    return dir_map


def fix_html_meta(html_path: Path, correct_node_id: str) -> dict:
    """修复 HTML 中的 teachany-node meta tag"""
    text = html_path.read_text(encoding='utf-8', errors='ignore')
    result = {'path': str(html_path), 'action': 'skip', 'old': '', 'new': ''}

    # 查找现有 teachany-node meta
    pattern = r'<meta\s+name="teachany-node"\s+content="([^"]+)"'
    m = re.search(pattern, text)

    if m:
        old_value = m.group(1)
        if old_value == correct_node_id:
            result['action'] = 'skip'
            return result
        # 修正
        new_meta = f'<meta name="teachany-node" content="{correct_node_id}">'
        old_meta = m.group(0)
        text = text.replace(old_meta, new_meta)
        result['action'] = 'fixed'
        result['old'] = old_value
        result['new'] = correct_node_id
    else:
        # 查找 course-id meta，在其后插入 teachany-node
        # 先找 <meta name="course- 开头的，在最后一个后面插入
        insert_pattern = r'<meta\s+name="course-[^"]*"\s+content="[^"]*">'
        all_metas = list(re.finditer(insert_pattern, text))
        if all_metas:
            last_meta = all_metas[-1]
            insert_pos = last_meta.end()
            insert_text = f'\n<meta name="teachany-node" content="{correct_node_id}">'
            text = text[:insert_pos] + insert_text + text[insert_pos:]
        else:
            # 在 <head> 后面插入
            head_pattern = r'(<head[^>]*>)'
            hm = re.search(head_pattern, text)
            if hm:
                insert_pos = hm.end()
                insert_text = f'\n<meta name="teachany-node" content="{correct_node_id}">'
                text = text[:insert_pos] + insert_text + text[insert_pos:]

        result['action'] = 'added'
        result['old'] = '(missing)'
        result['new'] = correct_node_id

    html_path.write_text(text, encoding='utf-8')
    return result


def main():
    dir_map = build_dir_to_node_map()
    print(f"目录 → node_id 映射: {len(dir_map)} 条")

    # 遍历 community 目录
    dirs = sorted([d for d in os.listdir(COMMUNITY_DIR)
                   if os.path.isdir(COMMUNITY_DIR / d)
                   and not d.startswith('.')
                   and d not in ('archive', 'pending', 'drafts')])

    stats = {'skip': 0, 'fixed': 0, 'added': 0, 'no_map': 0, 'no_html': 0}
    no_map_dirs = []

    for d in dirs:
        course_dir = COMMUNITY_DIR / d
        html_path = course_dir / 'index.html'

        if not html_path.exists():
            stats['no_html'] += 1
            continue

        if d not in dir_map:
            stats['no_map'] += 1
            no_map_dirs.append(d)
            continue

        correct_node_id = dir_map[d]
        r = fix_html_meta(html_path, correct_node_id)
        stats[r['action']] += 1

        if r['action'] in ('fixed', 'added'):
            print(f"  ✅ {d}: {r['old']} → {r['new']}")

    print(f"\n=== 修复统计 ===")
    print(f"  跳过（已正确）: {stats['skip']}")
    print(f"  修正（短名→完整）: {stats['fixed']}")
    print(f"  新增（缺失meta）: {stats['added']}")
    print(f"  无映射: {stats['no_map']}")
    print(f"  无HTML: {stats['no_html']}")

    if no_map_dirs:
        print(f"\n⚠️  以下目录在 node-index.json 中找不到对应 node_id:")
        for d in no_map_dirs:
            print(f"  - {d}")


if __name__ == '__main__':
    main()
