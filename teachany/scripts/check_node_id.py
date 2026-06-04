#!/usr/bin/env python3
"""
check_node_id.py · v6.5

校验课件 manifest.json 的 node_id 是否存在于知识树（优先 teachany-courseware/data/trees）。
如果不存在，提示用户选择：
  A) 改用一个相近的已有 node_id
  B) 注册新节点（在对应 tree 里新建 placeholder）

用法：
  python3 check_node_id.py <课件目录>
  python3 check_node_id.py --node-id hist-m-ww2          # 单独查某 node
  python3 check_node_id.py --list-subject math --stage middle  # 列某学科已有节点

返回码：
  0  通过（node_id 在树里）
  1  node_id 不存在
  2  manifest 缺失 / 输入错误
"""
import json, os, re, sys, glob, argparse
from pathlib import Path

EXT_NODE_RE = re.compile(r'^ext-[a-f0-9]{6,12}$', re.I)


def find_repo():
    """知识树权威源：本地 courseware 优先；无本地时返回 None（走远程 node-index）。"""
    from repo_paths import find_courseware_repo
    return find_courseware_repo()


def load_all_nodes_remote():
    from repo_paths import fetch_remote_json
    idx = fetch_remote_json('node-index.json', timeout=90)
    result = {}
    if not isinstance(idx, dict):
        return result
    nodes = idx.get('nodes') or {}
    for nid, n in nodes.items():
        if not nid:
            continue
        sub = n.get('subject') or ''
        stg = n.get('stage') or ''
        result[nid] = (sub, stg, n.get('name_zh') or n.get('name') or '', 'remote:node-index')
    return result

def load_all_nodes(repo):
    """返回 {node_id: (subject, stage, name, tree_file)}"""
    result = {}
    for f in (repo / 'data' / 'trees').rglob('*.json'):
        try:
            t = json.load(open(f, encoding='utf-8'))
            if not isinstance(t, dict) or 'domains' not in t:
                continue
            sub = t.get('subject', '') or f.stem  # 用文件名做 subject
            # stage 从路径推断（data/trees/cn/middle/xxx.json → middle）
            stg = t.get('stage', '')
            if not stg:
                parts = f.parts
                for p in parts:
                    if p in ('elementary', 'middle', 'high'):
                        stg = p
                        break
            for d in t.get('domains', []):
                for n in d.get('nodes', []):
                    nid = n.get('id')
                    if nid:
                        result[nid] = (sub, stg, n.get('name',''), f)
        except: pass
    return result

def suggest_similar(target, all_ids, limit=5):
    """基于子串相似度给建议"""
    import difflib
    return difflib.get_close_matches(target, all_ids, n=limit, cutoff=0.3)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('course_dir', nargs='?', help='课件目录')
    ap.add_argument('--node-id', help='直接校验某 node id')
    ap.add_argument('--list-subject', help='列某学科所有节点')
    ap.add_argument('--stage', help='限定学段 (elementary/middle/high)')
    args = ap.parse_args()

    repo = find_repo()
    if not repo:
        from repo_paths import remote_data_available, require_courseware_repo
        if not remote_data_available():
            require_courseware_repo()
            return
        print('📡 使用远程 node-index.json', file=sys.stderr)
        all_nodes = load_all_nodes_remote()
    else:
        all_nodes = load_all_nodes(repo)

    # Mode: list
    if args.list_subject:
        hits = [(nid, info) for nid, info in all_nodes.items()
                if info[0] == args.list_subject and (not args.stage or info[1] == args.stage)]
        print(f"📚 {args.list_subject} ({args.stage or 'all stages'}) · {len(hits)} 节点")
        for nid, (_s, _g, name, _f) in sorted(hits):
            print(f"  {nid:40s} {name}")
        return

    # Mode: check node id
    if args.node_id:
        nid = args.node_id
    elif args.course_dir:
        m_path = Path(args.course_dir) / 'manifest.json'
        if not m_path.exists():
            # 从 HTML meta 提取
            h_path = Path(args.course_dir) / 'index.html'
            if not h_path.exists():
                print(f"❌ 既无 manifest.json 也无 index.html", file=sys.stderr)
                sys.exit(2)
            import re
            html = h_path.read_text(encoding='utf-8')
            m = re.search(r'<meta[^>]*name="teachany-node"[^>]*content="([^"]+)"', html)
            if not m:
                print(f"❌ index.html 里没 teachany-node meta 标签", file=sys.stderr)
                sys.exit(2)
            nid = m.group(1)
        else:
            m = json.load(open(m_path, encoding='utf-8'))
            nid = m.get('node_id', '')
            if not nid:
                print(f"❌ manifest.json 里 node_id 为空", file=sys.stderr)
                sys.exit(2)
    else:
        ap.print_help()
        sys.exit(2)

    # PBL 外部知识点：ext-* 由 rebuild-index 写入 other/user-generated.json
    if EXT_NODE_RE.match(nid):
        print(f"✅ node_id '{nid}' 为 PBL 外部知识点（ext-*）")
        print(f"   → 发布后将挂入 data/trees/other/user-generated.json（Gallery「其他知识」）")
        print(f"   → 勿挂正式 K12 课标树；manifest 与 teachany-node 须一致")
        sys.exit(0)

    # 校验
    if nid in all_nodes:
        sub, stg, name, tree_file = all_nodes[nid]
        print(f"✅ node_id '{nid}' 已存在")
        print(f"   学科: {sub} · 学段: {stg}")
        print(f"   节点名: {name}")
        print(f"   所在树: {tree_file.relative_to(repo)}")
        print(f"   → 课件可直接提交，前端会自动反向挂载")
        sys.exit(0)
    else:
        print(f"❌ node_id '{nid}' 不在任何知识树里")
        print()
        suggestions = suggest_similar(nid, list(all_nodes.keys()))
        if suggestions:
            print("🔍 相似的已有节点：")
            for s in suggestions:
                info = all_nodes[s]
                print(f"   {s:40s} [{info[0]}/{info[1]}] {info[2]}")
            print()
            print("✋ 建议：优先改用上面某个现有 node_id（一致性更好）")
        print()
        print("🆕 或者注册新节点，在对应学科树里新增：")
        print(f"   python3 ~/.codebuddy/skills/teachany/scripts/register_node.py \\")
        print(f"     --node-id {nid} --subject <学科> --stage <学段> \\")
        print(f"     --domain <领域id> --name '<节点中文名>'")
        sys.exit(1)

if __name__ == '__main__':
    main()
