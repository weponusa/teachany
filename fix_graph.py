#!/usr/bin/env python3
"""
修复知识图谱：
1) 悬空引用：从 prerequisites / extends / parallel 中删除指向不存在节点的项
2) 孤立簇：对每棵 tree，用 parallel 边把每个 domain 的第一个节点（按出现顺序）
   连接到上一个 domain 的最后一个节点，使整棵树弱连通
3) 孤立点：在 domain 内部，将孤立节点通过 parallel 边连到同域的第一个节点
"""
import json
from collections import defaultdict, deque
from pathlib import Path

BASE = Path(__file__).parent / "data" / "trees"


def collect_domains(tree):
    """返回 [(domain_name, [node, ...]), ...] 按 domains 顺序"""
    out = []
    if not isinstance(tree, dict):
        return out
    for d in tree.get("domains", []) or []:
        dname = d.get("name_en") or d.get("name") or ""
        nodes = [n for n in (d.get("nodes") or []) if isinstance(n, dict) and "id" in n]
        out.append((dname, nodes))
    return out


def iter_nodes_all(tree):
    for _, nodes in collect_domains(tree):
        for n in nodes:
            yield n


def build_undirected(tree):
    adj = defaultdict(set)
    ids = set()
    for n in iter_nodes_all(tree):
        ids.add(n["id"])
    for n in iter_nodes_all(tree):
        nid = n["id"]
        for field in ("prerequisites", "extends", "parallel"):
            refs = n.get(field) or []
            if not isinstance(refs, list):
                continue
            for r in refs:
                if isinstance(r, str) and r in ids:
                    adj[nid].add(r)
                    adj[r].add(nid)
    return ids, adj


def connected_components(ids, adj):
    visited = set()
    comps = []
    for start in ids:
        if start in visited:
            continue
        q = deque([start])
        comp = set()
        while q:
            x = q.popleft()
            if x in visited:
                continue
            visited.add(x)
            comp.add(x)
            for y in adj[x]:
                if y not in visited:
                    q.append(y)
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    return comps


def fix_dangling(tree):
    """删除指向不存在 id 的引用，返回删除条数"""
    ids = {n["id"] for n in iter_nodes_all(tree)}
    removed = 0
    for n in iter_nodes_all(tree):
        for field in ("prerequisites", "extends", "parallel"):
            refs = n.get(field) or []
            if not isinstance(refs, list):
                continue
            new_refs = [r for r in refs if isinstance(r, str) and r in ids]
            if len(new_refs) != len(refs):
                removed += len(refs) - len(new_refs)
                n[field] = new_refs
    return removed


def add_parallel_edge(node, target_id):
    """给 node 添加 parallel 边指向 target_id（幂等）"""
    lst = node.get("parallel")
    if not isinstance(lst, list):
        lst = []
    if target_id in lst:
        return False
    lst.append(target_id)
    node["parallel"] = lst
    return True


def fix_connectivity(tree):
    """
    策略：
    - 对每棵 tree 先用现有边计算连通分量
    - 把所有 domain 按出现顺序串联：每个 domain 的第一个节点 parallel← 上一个 domain 的最后一个节点
    - 再扫一次：如果还有孤立簇，把每个孤立簇的第一个节点 parallel← 主簇中按出现顺序最靠近的节点
    返回 (added_domain_bridges, added_cluster_bridges)
    """
    domains = collect_domains(tree)
    if not domains:
        return 0, 0

    # --- Step 1: domain 间串联 ---
    added_bridges = 0
    prev_last = None  # 上一个非空 domain 的最后一个节点 id
    for dname, nodes in domains:
        if not nodes:
            continue
        first_id = nodes[0]["id"]
        last_id = nodes[-1]["id"]
        if prev_last is not None:
            # 给当前 domain 的第一个节点加一条 parallel 边指向 prev_last
            if add_parallel_edge(nodes[0], prev_last):
                added_bridges += 1
        prev_last = last_id

    # --- Step 2: 再次检查连通性，修复剩余孤立簇和孤立点 ---
    # domain 内部补边：每个节点都至少与 domain 内某个节点连通
    added_cluster = 0
    for dname, nodes in domains:
        if len(nodes) <= 1:
            continue
        first_node = nodes[0]
        # 构建 domain 内部的小图
        dom_ids = {n["id"] for n in nodes}
        dom_adj = defaultdict(set)
        for n in nodes:
            for field in ("prerequisites", "extends", "parallel"):
                for r in n.get(field) or []:
                    if isinstance(r, str) and r in dom_ids and r != n["id"]:
                        dom_adj[n["id"]].add(r)
                        dom_adj[r].add(n["id"])
        # 从 first_node 做 BFS
        visited = set()
        q = deque([first_node["id"]])
        while q:
            x = q.popleft()
            if x in visited:
                continue
            visited.add(x)
            for y in dom_adj[x]:
                if y not in visited:
                    q.append(y)
        # 对不连通的节点 parallel→ 第一个节点
        for n in nodes[1:]:
            if n["id"] not in visited:
                if add_parallel_edge(n, first_node["id"]):
                    added_cluster += 1
                    # 更新 adj
                    dom_adj[n["id"]].add(first_node["id"])
                    dom_adj[first_node["id"]].add(n["id"])
                    # 把此节点及其 domain 内连通点加入 visited
                    q2 = deque([n["id"]])
                    while q2:
                        x = q2.popleft()
                        if x in visited:
                            continue
                        visited.add(x)
                        for y in dom_adj[x]:
                            if y not in visited:
                                q2.append(y)

    # --- Step 3: 全局再检查，如果还有孤立簇（domain 间 bridge 未跨全部），补主簇-次簇桥 ---
    ids, adj = build_undirected(tree)
    comps = connected_components(ids, adj)
    if len(comps) > 1:
        main_comp = comps[0]
        # 主簇中选一个"代表"节点：按出现顺序的第一个
        main_rep = None
        for n in iter_nodes_all(tree):
            if n["id"] in main_comp:
                main_rep = n["id"]
                break
        for comp in comps[1:]:
            # 该簇按出现顺序的第一个节点
            rep = None
            for n in iter_nodes_all(tree):
                if n["id"] in comp:
                    rep = n
                    break
            if rep is not None and main_rep is not None:
                if add_parallel_edge(rep, main_rep):
                    added_cluster += 1

    return added_bridges, added_cluster


def process_file(path):
    tree = json.loads(path.read_text(encoding="utf-8"))
    removed = fix_dangling(tree)
    added_bridges, added_cluster = fix_connectivity(tree)
    if removed or added_bridges or added_cluster:
        path.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return removed, added_bridges, added_cluster


def main():
    total_removed = 0
    total_bridges = 0
    total_cluster = 0
    changed = 0
    for p in sorted(BASE.rglob("*.json")):
        rel = p.relative_to(BASE)
        if str(rel).startswith("_"):
            continue
        rm, br, cl = process_file(p)
        if rm or br or cl:
            changed += 1
            print(f"  {rel}  dangling-={rm}  domain-bridges+={br}  cluster-bridges+={cl}")
        total_removed += rm
        total_bridges += br
        total_cluster += cl

    print("\n--- SUMMARY ---")
    print(f"Files changed: {changed}")
    print(f"Dangling refs removed: {total_removed}")
    print(f"Domain bridges added: {total_bridges}")
    print(f"Cluster bridges added: {total_cluster}")


if __name__ == "__main__":
    main()
