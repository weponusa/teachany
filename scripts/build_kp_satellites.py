#!/usr/bin/env python3
"""
build_kp_satellites.py — 全量生成知识点卫星文件（每个知识点一个独立 JSON）

数据源：
  1. data/trees/**/*.json        — 知识树节点（curriculum_points / textbook_chapter / difficulty / ...）
  2. _archive_20260508/_excerpts_backup_20260508/excerpts_legacy/**/*.json — 17127 条课标/教材原文
  3. data/node-index.json        — 节点元信息（domain / curriculum / stage / subject）
  4. data/nodes-metadata.json    — 学科/年级元信息

输出：
  data/kp/{subject}/{kp_id}.json — 每个知识点一个文件
  data/kp/_index.json            — 全局索引（kp_id → 卫星路径）

约定：
  - 卫星文件主键：kp_id == node.id（不再 kp- 前缀；兼容旧 kp_ids）
  - schema_version: 1.0
"""
import json, os, glob, re, datetime
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # teachany-courseware
TREES_DIR = os.path.join(ROOT, 'data/trees')
EXCERPTS_DIR = os.path.join(ROOT, '_archive_20260508/_excerpts_backup_20260508/excerpts_legacy')
NODE_INDEX = os.path.join(ROOT, 'data/node-index.json')
OUT_DIR = os.path.join(ROOT, 'data/kp')
INDEX_OUT = os.path.join(OUT_DIR, '_index.json')

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()


def read_json(fp):
    with open(fp, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(fp, data):
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ============== 1. 收集所有节点 ==============
def collect_nodes():
    """遍历所有 tree json，返回 [(tree_relpath, node_dict, parent_domain_id, parent_domain_name, top_level)]"""
    out = []
    for fp in sorted(glob.glob(os.path.join(TREES_DIR, '**/*.json'), recursive=True)):
        try:
            tree = read_json(fp)
        except Exception as e:
            print(f'[WARN] skip {fp}: {e}')
            continue
        rel = os.path.relpath(fp, ROOT)
        # tree top metadata
        top = {
            'subject': tree.get('subject'),
            'subject_name': tree.get('name'),
            'curriculum': None,
            'stage': None,
            'grade_range': tree.get('grade_range'),
        }
        # 从路径推断 curriculum/stage：data/trees/{curriculum}/{stage}/{subject}.json
        m = re.search(r'data/trees/([^/]+)/([^/]+)/[^/]+\.json$', rel)
        if m:
            top['curriculum'] = m.group(1)
            top['stage'] = m.group(2)
        else:
            # data/trees/{curriculum}/{stage}/{subject}/...
            m2 = re.search(r'data/trees/([^/]+)/([^/]+)/', rel)
            if m2:
                top['curriculum'] = m2.group(1)
                top['stage'] = m2.group(2)

        def walk(x, dom_id='', dom_name=''):
            if isinstance(x, dict):
                # 节点判定：含 id/name/grade/prerequisites
                if 'id' in x and 'name' in x and 'grade' in x and 'prerequisites' in x:
                    out.append((rel, x, dom_id, dom_name, top))
                # domain 节点（含 domains 或 nodes）
                cur_dom_id = x.get('id', dom_id) if 'domains' in x or 'nodes' in x else dom_id
                cur_dom_name = x.get('name', dom_name) if 'domains' in x or 'nodes' in x else dom_name
                for v in x.values():
                    walk(v, cur_dom_id, cur_dom_name)
            elif isinstance(x, list):
                for v in x:
                    walk(v, dom_id, dom_name)

        walk(tree)
    return out


# ============== 2. 收集所有 excerpts，按 node_id 索引 ==============
def collect_excerpts():
    """返回 dict: node_id -> [excerpt_dict, ...]"""
    by_node = defaultdict(list)
    seen_keys = defaultdict(set)  # node_id -> set(text_hash) 去重

    for fp in sorted(glob.glob(os.path.join(EXCERPTS_DIR, '**/*.json'), recursive=True)):
        try:
            d = read_json(fp)
        except Exception as e:
            print(f'[WARN] skip excerpt {fp}: {e}')
            continue
        items = d.get('excerpts', []) if isinstance(d, dict) else (d if isinstance(d, list) else [])
        for e in items:
            if not isinstance(e, dict):
                continue
            # 收集 kp_ids
            kp_list = []
            if 'kp_id' in e and e['kp_id']:
                kp_list.append(e['kp_id'])
            if 'kp_ids' in e and isinstance(e['kp_ids'], list):
                kp_list.extend([k for k in e['kp_ids'] if k])
            # 提取 node_id：去掉 kp- 前缀；fill-kp- 前缀视为指向后段 node_id
            for kp in kp_list:
                node_id = None
                if kp.startswith('fill-kp-'):
                    # fill-kp-{parent_or_node}-{leaf_node}：取最后一个 - 之后的纯 leaf 不靠谱，
                    # 简单策略：去 fill-kp- 前缀作为复合 id 候选，留待 resolve_excerpt_to_node 处理
                    node_id = kp[len('fill-kp-'):]
                elif kp.startswith('kp-'):
                    node_id = kp[3:]
                else:
                    node_id = kp
                # text 去重 key
                text = (e.get('text') or '').strip()
                src = e.get('source', '')
                key = f'{src}::{text[:80]}'
                if key in seen_keys[node_id]:
                    continue
                seen_keys[node_id].add(key)
                by_node[node_id].append({k: v for k, v in e.items() if k not in ('kp_id', 'kp_ids')})
    return by_node


# ============== 3. 把 excerpts 的复合 id 映射到真实 node_id ==============
def resolve_excerpts(by_node, all_node_ids):
    """
    excerpt kp_id 形如：
      - "math-m-linear-function"  ✅ 直接对应
      - "math-m-number-algebra-math-m-linear-equation-two"  ✅ 复合：domain-id + node-id，取最后能匹配的后缀
    """
    resolved = defaultdict(list)
    fallback = defaultdict(list)  # 未匹配
    sorted_node_ids = sorted(all_node_ids, key=lambda x: -len(x))  # 长 id 优先匹配

    for kp_key, lst in by_node.items():
        if kp_key in all_node_ids:
            resolved[kp_key].extend(lst)
            continue
        # 后缀匹配：kp_key 以 "-{node_id}" 结尾
        matched = None
        for nid in sorted_node_ids:
            if kp_key == nid or kp_key.endswith('-' + nid):
                matched = nid
                break
        if matched:
            resolved[matched].extend(lst)
        else:
            fallback[kp_key].extend(lst)

    return resolved, fallback


# ============== 4. 构造卫星文件 ==============
# 字段从 tree node 迁移到卫星文件：
MIGRATE_FIELDS = [
    'curriculum_points', 'excerpt_ids', 'textbook_chapter', 'textbook_semester',
    'chapter_source', 'difficulty', 'description', 'curriculum_standards',
    'courseVersion', 'siblings', 'course_variants', 'source',
]
# 主文件保留的字段：
KEEP_IN_TREE = ['id', 'name', 'name_en', 'grade', 'status', 'prerequisites',
                'extends', 'parallel', 'courses', 'subject']


def build_satellite(node, tree_rel, dom_id, dom_name, top, excerpts_for_node):
    sat = {
        'kp_id': node['id'],
        'name': node.get('name'),
        'name_en': node.get('name_en'),
        'subject': top.get('subject') or node.get('subject'),
        'subject_name': top.get('subject_name'),
        'curriculum': top.get('curriculum'),
        'stage': top.get('stage'),
        'grade': node.get('grade'),
        'domain_id': dom_id,
        'domain_name': dom_name,
        'tree_file': tree_rel,
    }

    # 迁移字段
    for f in MIGRATE_FIELDS:
        if f in node and node[f] not in (None, '', [], {}):
            sat[f] = node[f]

    # 关联 excerpts
    if excerpts_for_node:
        sat['excerpts'] = excerpts_for_node

    # 预留扩展槽位（空容器，便于后续注入）
    sat.setdefault('interactive_resources', [])
    sat.setdefault('textbook_content', {})
    sat.setdefault('supplements', {})
    sat.setdefault('errors', [])
    sat.setdefault('exercises', [])
    sat.setdefault('memory_anchors', [])
    sat.setdefault('real_world', [])
    sat.setdefault('bloom_verbs', {})
    sat.setdefault('notes', [])

    sat['_meta'] = {
        'schema_version': '1.0',
        'generated_at': NOW,
        'sources': ['tree', 'excerpts_legacy'] if excerpts_for_node else ['tree'],
        'excerpt_count': len(excerpts_for_node) if excerpts_for_node else 0,
    }
    return sat


# ============== 5. 主流程 ==============
def main():
    print('[1/5] 扫描知识树节点...')
    nodes = collect_nodes()
    print(f'      共 {len(nodes)} 个节点')

    print('[2/5] 扫描 archived excerpts...')
    by_kp_raw = collect_excerpts()
    total_ex = sum(len(v) for v in by_kp_raw.values())
    print(f'      共 {total_ex} 条去重后 excerpt（{len(by_kp_raw)} 个 kp_id key）')

    print('[3/5] 解析 excerpt kp_id → node_id...')
    all_node_ids = {n['id'] for _, n, _, _, _ in nodes}
    resolved, fallback = resolve_excerpts(by_kp_raw, all_node_ids)
    matched_node_count = len(resolved)
    fallback_count = sum(len(v) for v in fallback.values())
    print(f'      已匹配 node 数: {matched_node_count}; 未匹配 excerpt 数: {fallback_count}（{len(fallback)} 个未知 key）')

    print('[4/5] 生成卫星文件...')
    # 清理旧目录（保险起见仅清理 data/kp/ 下的子目录）
    if os.path.exists(OUT_DIR):
        # 只删除 _index.json 和子目录里的 *.json，不删根目录其他东西
        for sub in os.listdir(OUT_DIR):
            p = os.path.join(OUT_DIR, sub)
            if os.path.isdir(p):
                for f in os.listdir(p):
                    if f.endswith('.json'):
                        os.remove(os.path.join(p, f))
    os.makedirs(OUT_DIR, exist_ok=True)

    index = {
        '_meta': {
            'schema_version': '1.0',
            'generated_at': NOW,
            'description': '知识点卫星文件全局索引：kp_id → 卫星文件相对路径',
        },
        'kps': {},
    }

    written = 0
    by_subject_count = defaultdict(int)
    for tree_rel, node, dom_id, dom_name, top in nodes:
        kp_id = node['id']
        subj = top.get('subject') or node.get('subject') or 'misc'
        sat = build_satellite(node, tree_rel, dom_id, dom_name, top, resolved.get(kp_id, []))

        out_rel = f'data/kp/{subj}/{kp_id}.json'
        out_abs = os.path.join(ROOT, out_rel)
        write_json(out_abs, sat)
        written += 1
        by_subject_count[subj] += 1
        index['kps'][kp_id] = out_rel

    # 保存未匹配的 excerpts 备查
    if fallback:
        write_json(os.path.join(OUT_DIR, '_unmatched_excerpts.json'), {
            '_meta': {'note': 'kp_id 无法映射到任何 node_id 的 excerpt，留待人工处理或外部脚本回填'},
            'unmatched': dict(fallback),
        })

    index['_meta']['total'] = written
    index['_meta']['by_subject'] = dict(by_subject_count)
    index['_meta']['unmatched_kp_keys'] = len(fallback)
    index['_meta']['unmatched_excerpts'] = fallback_count
    write_json(INDEX_OUT, index)

    print(f'[5/5] 完成！')
    print(f'      已写出 {written} 个卫星文件 → data/kp/<subject>/*.json')
    print(f'      索引：{os.path.relpath(INDEX_OUT, ROOT)}')
    print(f'      按学科分布：')
    for s, c in sorted(by_subject_count.items(), key=lambda x: -x[1]):
        print(f'        {s}: {c}')


if __name__ == '__main__':
    main()
