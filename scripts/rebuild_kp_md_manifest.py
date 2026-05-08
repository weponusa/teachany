#!/usr/bin/env python3
"""
rebuild_kp_md_manifest.py — 重建 skill/data/kp-md-manifest.json

扫描 data/trees/**/*.json 生成全量节点索引，
并根据 skill/data/kp-md/kp-{node_id}.md 是否存在决定 md_status:
  - ready:   md 存在且 tree cp 非空（两侧同步）
  - basic:   md 存在但 tree cp 为空（占位文案）
  - pending: md 不存在

encoding_rule: kp-{node_id}
"""
import json, glob, os, sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_DIR = os.path.join(ROOT, 'skill/data/kp-md')
MANIFEST_OUT = os.path.join(ROOT, 'skill/data/kp-md-manifest.json')


def main():
    entries = []
    by_status = {'ready': 0, 'basic': 0, 'pending': 0}

    for f in sorted(glob.glob(os.path.join(ROOT, 'data/trees/*/**/*.json'), recursive=True)):
        rel = os.path.relpath(f, ROOT)
        parts = rel.split('/')
        if len(parts) < 5:
            continue
        curriculum = parts[2]
        if curriculum == 'other':
            continue
        stage = parts[3]
        subject = os.path.splitext(parts[4])[0]
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception as e:
            print(f'WARN load {rel}: {e}', file=sys.stderr)
            continue
        for dom in d.get('domains', []):
            dom_id = dom.get('id', '')
            dom_name = dom.get('name', '')
            for n in dom.get('nodes', []):
                nid = n.get('id')
                if not nid:
                    continue
                cp = n.get('curriculum_points') or []
                md_name = f'kp-{nid}.md'
                md_path = os.path.join(MD_DIR, md_name)
                md_exists = os.path.exists(md_path)

                if md_exists and cp:
                    status = 'ready'; quality = 'high'
                elif md_exists and not cp:
                    status = 'basic'; quality = 'basic'
                else:
                    status = 'pending'; quality = 'none'

                by_status[status] += 1

                entries.append({
                    'kp_id': f'kp-{nid}',
                    'node_id': nid,
                    'name_zh': n.get('name', nid),
                    'name_en': n.get('name_en', ''),
                    'subject': subject,
                    'stage': stage,
                    'curriculum': curriculum,
                    'grade': n.get('grade', ''),
                    'domain_id': dom_id,
                    'domain_name': dom_name,
                    'md_file': md_name if md_exists else None,
                    'md_status': status,
                    'md_source': 'synced-from-trees' if md_exists else None,
                    'quality': quality,
                    'cp_count': len(cp),
                    'tree_file': rel,
                })

    manifest = {
        'schema_version': '2.0',
        'generated_at': datetime.now().isoformat(),
        'encoding_rule': 'kp-{node_id}',
        'encoding_note': 'node_id is the natural primary key from knowledge tree; kp- prefix marks knowledge-point entity',
        'authority_source': 'data/trees/**/*.json curriculum_points (single source of truth)',
        'sync_tool': 'scripts/sync_kp_md_from_trees.py',
        'total_nodes': len(entries),
        'md_coverage': {
            'ready': by_status['ready'],
            'basic': by_status['basic'],
            'pending': by_status['pending'],
            'ready_total': by_status['ready'] + by_status['basic'],
            'ready_rate': f'{by_status["ready"] / len(entries) * 100:.1f}%' if entries else '0%',
        },
        'entries': entries,
    }

    with open(MANIFEST_OUT, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f'✅ 重建 manifest: {MANIFEST_OUT}')
    print(f'  总节点:  {len(entries)}')
    print(f'  ready:   {by_status["ready"]}  (有 md + 有 cp)')
    print(f'  basic:   {by_status["basic"]}  (有 md 但 cp 空)')
    print(f'  pending: {by_status["pending"]} (无 md)')


if __name__ == '__main__':
    main()
