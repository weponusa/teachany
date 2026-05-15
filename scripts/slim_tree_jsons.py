#!/usr/bin/env python3
"""
slim_tree_jsons.py — 知识树主文件瘦身

操作：
  对 data/trees/**/*.json 中的每个知识点节点：
    - 删除已迁出到卫星文件的字段（curriculum_points / textbook_* / chapter_source / excerpt_ids /
      difficulty / description / curriculum_standards / courseVersion / siblings / course_variants / source）
    - 添加 "kp_file" 字段，指向 data/kp/{subject}/{kp_id}.json
  保留：id / name / name_en / grade / status / prerequisites / extends / parallel / courses

前端只读保留字段，不会因瘦身受影响（已确认 tree.html 解析逻辑）。

用法：
  python3 scripts/slim_tree_jsons.py --dry-run   # 预览改动
  python3 scripts/slim_tree_jsons.py             # 实际写入（自动备份到 data/trees.backup_YYYYMMDD/）
"""
import json, os, glob, shutil, argparse, datetime, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREES_DIR = os.path.join(ROOT, 'data/trees')
KP_INDEX = os.path.join(ROOT, 'data/kp/_index.json')

REMOVE_FIELDS = [
    'curriculum_points', 'excerpt_ids', 'textbook_chapter', 'textbook_semester',
    'chapter_source', 'difficulty', 'description', 'curriculum_standards',
    'courseVersion', 'siblings', 'course_variants', 'source',
]


def is_kp_node(x):
    return (isinstance(x, dict)
            and 'id' in x and 'name' in x and 'grade' in x and 'prerequisites' in x)


def slim_node(node, kp_index):
    kp_id = node.get('id')
    if not kp_id:
        return 0
    removed = 0
    for f in REMOVE_FIELDS:
        if f in node:
            del node[f]
            removed += 1
    # 加 kp_file 索引（仅在卫星文件存在时）
    if kp_id in kp_index:
        node['kp_file'] = kp_index[kp_id]
    return removed


def walk_and_slim(x, kp_index, stats):
    if isinstance(x, dict):
        if is_kp_node(x):
            r = slim_node(x, kp_index)
            stats['nodes'] += 1
            stats['removed_fields'] += r
        for v in x.values():
            walk_and_slim(v, kp_index, stats)
    elif isinstance(x, list):
        for v in x:
            walk_and_slim(v, kp_index, stats)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='只打印变化，不写入')
    args = ap.parse_args()

    with open(KP_INDEX, 'r', encoding='utf-8') as f:
        kp_index = json.load(f).get('kps', {})

    files = sorted(glob.glob(os.path.join(TREES_DIR, '**/*.json'), recursive=True))
    print(f'[1/3] 共 {len(files)} 个 tree json，{len(kp_index)} 个卫星索引')

    if not args.dry_run:
        # 备份
        ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = os.path.join(ROOT, f'data/trees.backup_{ts}')
        shutil.copytree(TREES_DIR, backup_dir)
        print(f'[2/3] 已备份至 {os.path.relpath(backup_dir, ROOT)}')

    total_stats = {'nodes': 0, 'removed_fields': 0}
    sample_before, sample_after = None, None
    for fp in files:
        with open(fp, 'r', encoding='utf-8') as f:
            data = json.load(f)
        before_size = os.path.getsize(fp)
        # 抓样本
        if 'middle/math.json' in fp.replace('\\', '/') and sample_before is None:
            def find_sample(x):
                if isinstance(x, dict):
                    if x.get('id') == 'math-m-linear-function':
                        return x
                    for v in x.values():
                        r = find_sample(v)
                        if r is not None:
                            return r
                elif isinstance(x, list):
                    for v in x:
                        r = find_sample(v)
                        if r is not None:
                            return r
                return None
            samp = find_sample(data)
            if samp:
                sample_before = json.loads(json.dumps(samp))  # deep copy

        stats = {'nodes': 0, 'removed_fields': 0}
        walk_and_slim(data, kp_index, stats)
        total_stats['nodes'] += stats['nodes']
        total_stats['removed_fields'] += stats['removed_fields']

        if sample_before is not None and sample_after is None:
            def find_sample2(x):
                if isinstance(x, dict):
                    if x.get('id') == 'math-m-linear-function':
                        return x
                    for v in x.values():
                        r = find_sample2(v)
                        if r is not None:
                            return r
                elif isinstance(x, list):
                    for v in x:
                        r = find_sample2(v)
                        if r is not None:
                            return r
                return None
            sample_after = find_sample2(data)

        if not args.dry_run:
            with open(fp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            after_size = os.path.getsize(fp)
            if 'cn/middle' in fp:
                print(f'  {os.path.relpath(fp, ROOT)}: {before_size} → {after_size} bytes')

    print(f'[3/3] 完成。处理节点 {total_stats["nodes"]}, 删除字段 {total_stats["removed_fields"]} 个')

    if sample_before:
        print('\n=== 样本对比（math-m-linear-function）===')
        print('--- BEFORE ---')
        print(json.dumps(sample_before, ensure_ascii=False, indent=2))
        print('--- AFTER ---')
        print(json.dumps(sample_after, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
