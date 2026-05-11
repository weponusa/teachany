#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-nodes-metadata.py
-----------------------
从权威源 data/trees/**/*.json 重建 data/nodes-metadata.json
供 scripts/learning-path.js 的 LearningPathSystem.initialize() 使用。

输出结构（与旧格式保持兼容）：
{
  "version": "2.0",
  "generated_at": "...ISO8601...",
  "stats": {
    "total_graphs": N,
    "total_nodes": N,
    "by_subject": {...},
    "by_grade": {...},
    "by_domain": {...}
  },
  "nodes": [
    {
      "id": "...",
      "name": "...",
      "subject": "...",
      "domain": "...",
      "grade": 7,
      "graph_path": "cn/middle/biology.json",
      "definition": "...",
      "prerequisites": [...],
      "next_steps": [...],
      "related_nodes": [...],
      "key_concepts": [...],
      "difficulty": 0
    },
    ...
  ]
}

v7.9.10：挂到 rebuild-index.py 步骤 4.5，与 nodes-selector.json 配对维护。
"""
from __future__ import annotations
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TREES_DIR = ROOT / 'data' / 'trees'
OUT_FILE = ROOT / 'data' / 'nodes-metadata.json'


def subject_from_path(rel: Path) -> str:
    """从相对路径推断 subject：data/trees/cn/middle/biology.json → biology"""
    stem = rel.stem
    # 跳过 _template 等
    return stem


def extract_nodes(tree: dict, graph_path: str, fallback_subject: str):
    """从单棵树提取所有节点（扁平化）"""
    out = []
    tree_subj = tree.get('subject') or fallback_subject
    for dom in tree.get('domains', []) or []:
        domain_id = dom.get('id') or dom.get('slug') or ''
        for n in dom.get('nodes', []) or []:
            nid = n.get('id')
            name = n.get('name') or n.get('title')
            if not nid or not name:
                continue
            grade = n.get('grade')
            if isinstance(grade, str):
                try:
                    grade = int(grade)
                except ValueError:
                    grade = 0
            if grade is None:
                grade = 0

            # 关系字段映射
            prerequisites = list(n.get('prerequisites') or [])
            # extends = 进阶/后继；parallel = 并行关联
            next_steps = list(n.get('extends') or n.get('next_steps') or [])
            related = list(n.get('parallel') or n.get('related_nodes') or [])

            # 关键概念 & 定义
            key_concepts = list(n.get('curriculum_points') or n.get('key_concepts') or [])
            definition = n.get('definition') or (key_concepts[0] if key_concepts else '')

            # 难度：从 grade 推导（小学 0-2，初中 3-4，高中 5-6）
            diff = n.get('difficulty')
            if diff is None:
                if 1 <= grade <= 6:
                    diff = max(0, (grade - 1) // 2)
                elif 7 <= grade <= 9:
                    diff = 3 + (grade - 7) // 2
                elif grade >= 10:
                    diff = 5 + min(1, (grade - 10) // 2)
                else:
                    diff = 0

            out.append({
                'id': nid,
                'name': name,
                'subject': n.get('subject') or tree_subj or fallback_subject,
                'domain': domain_id,
                'grade': grade,
                'graph_path': graph_path,
                'definition': definition,
                'prerequisites': prerequisites,
                'next_steps': next_steps,
                'related_nodes': related,
                'key_concepts': key_concepts,
                'difficulty': diff,
            })
    return out


def main() -> int:
    if not TREES_DIR.exists():
        print(f'[FATAL] 权威源目录不存在：{TREES_DIR}', file=sys.stderr)
        return 2

    all_nodes = []
    graph_count = 0
    seen_ids = {}

    for tree_file in sorted(TREES_DIR.rglob('*.json')):
        if tree_file.name.startswith('_'):
            continue  # 跳过 _template.json 等
        rel = tree_file.relative_to(TREES_DIR)
        graph_path = str(rel).replace('\\', '/')
        try:
            with tree_file.open('r', encoding='utf-8') as f:
                tree = json.load(f)
        except Exception as e:
            print(f'[WARN] 解析失败 {tree_file}: {e}', file=sys.stderr)
            continue
        fallback_subject = subject_from_path(rel)
        nodes = extract_nodes(tree, graph_path, fallback_subject)
        if not nodes:
            continue
        graph_count += 1
        # 去重：同 id 以第一次出现为准，记录冲突
        for node in nodes:
            nid = node['id']
            if nid in seen_ids:
                # 同 id 冲突，保留更全的（字段多的）
                prev = seen_ids[nid]
                if len(node.get('key_concepts', [])) > len(prev.get('key_concepts', [])):
                    all_nodes[all_nodes.index(prev)] = node
                    seen_ids[nid] = node
            else:
                seen_ids[nid] = node
                all_nodes.append(node)

    # 统计
    by_subject = Counter(n['subject'] for n in all_nodes)
    by_grade = Counter(str(n['grade']) for n in all_nodes)
    by_domain = Counter(n['domain'] for n in all_nodes if n['domain'])

    payload = {
        'version': '2.0',
        'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'source': 'data/trees/**/*.json (authoritative)',
        'stats': {
            'total_graphs': graph_count,
            'total_nodes': len(all_nodes),
            'by_subject': dict(by_subject.most_common()),
            'by_grade': dict(sorted(by_grade.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else -1)),
            'by_domain': dict(by_domain.most_common()),
        },
        'nodes': all_nodes,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open('w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f'✅ nodes-metadata.json 已重建：{len(all_nodes)} 节点 · 覆盖 {graph_count} 棵知识树')
    top_subjects = ', '.join(f'{k}={v}' for k, v in list(by_subject.most_common())[:6])
    print(f'   Top subjects: {top_subjects}')
    # 抽检：初中地理
    geo_m = [n for n in all_nodes if n['subject'] == 'geography' and 7 <= n['grade'] <= 9]
    print(f'   抽检 · 地理初中(7-9年级): {len(geo_m)} 个节点')
    return 0


if __name__ == '__main__':
    sys.exit(main())
