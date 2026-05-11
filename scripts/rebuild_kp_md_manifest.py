#!/usr/bin/env python3
"""
rebuild_kp_md_manifest.py — 重建 skill/data/kp-md-manifest.json

从 data/trees/**/*.json 扫描，生成全量节点索引。
不再包含任何 md_file / md_status 字段（md 目录已删除）。

输出字段:
  kp_id, node_id, name_zh, name_en,
  subject, stage, curriculum, grade,
  domain_id, domain_name,
  quality (high/basic/none),
  cp_count,
  tree_file
"""
import json, glob, os, sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_OUT = os.path.join(ROOT, 'skill/data/kp-md-manifest.json')


def main():
    entries = []
    by_quality = {'high': 0, 'basic': 0, 'none': 0}

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
                quality = 'high' if cp else 'none'

                by_quality[quality] += 1

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
                    'quality': quality,
                    'cp_count': len(cp),
                    'tree_file': rel,
                })

    manifest = {
        'schema_version': '3.0',
        'generated_at': datetime.now().isoformat(),
        'encoding_rule': 'kp-{node_id}',
        'encoding_note': 'node_id is the natural primary key from knowledge tree; kp- prefix marks knowledge-point entity',
        'authority_source': 'data/trees/**/*.json curriculum_points (single source of truth)',
        'md_directory_deleted': '2026-05-08, scheme simplified, md files no longer needed',
        'total_nodes': len(entries),
        'cp_coverage': {
            'with_cp': by_quality['high'],
            'without_cp': by_quality['none'],
            'coverage_rate': f'{by_quality["high"] / len(entries) * 100:.1f}%' if entries else '0%',
        },
        'entries': entries,
    }

    with open(MANIFEST_OUT, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f'✅ 重建 manifest: {MANIFEST_OUT}')
    print(f'  总节点:  {len(entries)}')
    print(f'  有 cp:   {by_quality["high"]}')
    print(f'  无 cp:   {by_quality["none"]}')
    print(f'  覆盖率:  {manifest["cp_coverage"]["coverage_rate"]}')


if __name__ == '__main__':
    main()
