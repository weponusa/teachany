#!/usr/bin/env python3
"""
把 2026-05-08 被误删的国际课标 excerpts 数据回迁到
data/trees/{ap,cambridge,ib}/**/*.json 的 curriculum_points 字段。

数据源: _archive_20260508/_excerpts_backup_20260508/excerpts_legacy/{curr}/
目标:   data/trees/{curr}/**/*.json  每个节点的 curriculum_points

映射:   excerpt.kp_id 以 node_id 结尾 → 写回该节点
"""
import json, glob, os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_legacy_excerpts(curriculum):
    """返回 { node_id: [text, text, ...] }"""
    nid_to_texts = {}
    pattern = os.path.join(ROOT, '_archive_20260508/_excerpts_backup_20260508/excerpts_legacy', curriculum, '**/*.json')
    for f in glob.glob(pattern, recursive=True):
        with open(f, encoding='utf-8') as fp:
            d = json.load(fp)
        for e in d.get('excerpts', []):
            kpid = e.get('kp_id', '')
            text = (e.get('text') or '').strip()
            if not kpid or not text:
                continue
            # kp_id 格式: kp-{curriculum}-{stage}-{subject}-{node_id}
            # node_id 可能含连字符，直接按 tree.json 的真实 node_id 反推
            nid_to_texts.setdefault(kpid, []).append(text)
    return nid_to_texts

def match_kpid_to_nodeid(kpid_set, node_ids):
    """返回 {kpid: nodeid}，只匹配 kpid 以 '-'+nodeid 结尾的"""
    # 按 node_id 长度倒序，避免短 id 抢占长 id
    sorted_nids = sorted(node_ids, key=len, reverse=True)
    mapping = {}
    for kpid in kpid_set:
        for nid in sorted_nids:
            if kpid.endswith('-' + nid):
                mapping[kpid] = nid
                break
    return mapping

def restore_tree(curriculum):
    print(f'\n== 处理 {curriculum} ==')
    kpid_to_texts = load_legacy_excerpts(curriculum)
    print(f'  legacy kp_id 数: {len(kpid_to_texts)}')

    tree_files = glob.glob(os.path.join(ROOT, 'data/trees', curriculum, '**/*.json'), recursive=True)

    # 先收集该 curriculum 所有 node_id
    all_node_ids = set()
    for tf in tree_files:
        with open(tf, encoding='utf-8') as fp:
            d = json.load(fp)
        for dom in d.get('domains', []):
            for n in dom.get('nodes', []):
                all_node_ids.add(n['id'])

    # 映射
    kpid_to_nid = match_kpid_to_nodeid(set(kpid_to_texts.keys()), all_node_ids)

    # 反向构造 node_id → texts
    nid_to_texts = {}
    for kpid, nid in kpid_to_nid.items():
        # 同一个 nid 可能对应多个 kpid（虽然理论上不应），合并去重
        texts = kpid_to_texts[kpid]
        dedup = []
        seen = set()
        for t in texts:
            key = t[:80]
            if key not in seen:
                seen.add(key)
                dedup.append(t)
        nid_to_texts.setdefault(nid, []).extend(dedup)

    print(f'  能映射到节点的 kp_id: {len(kpid_to_nid)}')
    print(f'  能回填的节点数: {len(nid_to_texts)}')

    # 写回 tree.json
    touched_files = 0
    touched_nodes = 0
    for tf in tree_files:
        with open(tf, encoding='utf-8') as fp:
            d = json.load(fp)
        changed = False
        for dom in d.get('domains', []):
            for n in dom.get('nodes', []):
                nid = n['id']
                if nid in nid_to_texts:
                    existing = n.get('curriculum_points') or []
                    # 已有 cp 不覆盖，避免 cn 场景下的同步问题
                    if not existing:
                        n['curriculum_points'] = nid_to_texts[nid]
                        changed = True
                        touched_nodes += 1
        if changed:
            with open(tf, 'w', encoding='utf-8') as fp:
                json.dump(d, fp, ensure_ascii=False, indent=2)
            touched_files += 1
            print(f'  ✓ {os.path.relpath(tf, ROOT)}')
    print(f'  → 修改 {touched_files} 个文件, {touched_nodes} 个节点')
    return touched_nodes

def main():
    total = 0
    for curr in ['ap', 'cambridge', 'ib']:
        total += restore_tree(curr)
    print(f'\n✅ 总计回填: {total} 个节点')

if __name__ == '__main__':
    main()
