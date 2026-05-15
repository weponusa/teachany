#!/usr/bin/env python3
"""
restore_curriculum_points.py — 回填 curriculum_points 字段到主文件

背景：
  v1.0 卫星迁移把 curriculum_points 从主文件中移除，但前端 tree.html / path.html
  在节点弹窗中需要展示课标原文要点。该字段每节点仅 3-5 条短文本，体量小，
  应当保留在主文件中（前端读），同时仍在卫星文件中保留（制作时读，可双向同步）。

操作：
  对每个有卫星文件且卫星含 curriculum_points 的节点，把该字段写回主文件。
"""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREES_DIR = os.path.join(ROOT, 'data/trees')
KP_INDEX = os.path.join(ROOT, 'data/kp/_index.json')


def main():
    with open(KP_INDEX, 'r', encoding='utf-8') as f:
        idx = json.load(f).get('kps', {})

    restored = 0
    files_changed = 0
    for fp in sorted(glob.glob(os.path.join(TREES_DIR, '**/*.json'), recursive=True)):
        with open(fp, 'r', encoding='utf-8') as f:
            data = json.load(f)
        changed = False

        def walk(x):
            nonlocal changed, restored
            if isinstance(x, dict):
                if 'id' in x and 'name' in x and 'grade' in x and 'prerequisites' in x:
                    nid = x['id']
                    kp_path = idx.get(nid)
                    if kp_path:
                        sat_abs = os.path.join(ROOT, kp_path)
                        if os.path.exists(sat_abs):
                            with open(sat_abs, 'r', encoding='utf-8') as fs:
                                sat = json.load(fs)
                            cp = sat.get('curriculum_points')
                            if cp and 'curriculum_points' not in x:
                                x['curriculum_points'] = cp
                                changed = True
                                restored += 1
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)

        walk(data)
        if changed:
            with open(fp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            files_changed += 1

    print(f'已回填 curriculum_points: {restored} 个节点, {files_changed} 个 tree json')


if __name__ == '__main__':
    main()
