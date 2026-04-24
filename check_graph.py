#!/usr/bin/env python3
"""
检查知识图谱完整性与连通性：
- 悬空前置（prerequisites 指向不存在节点）
- 悬空 extends / parallel
- 循环依赖
- 弱连通分量 > 1（孤立簇）
- 孤立节点（度为 0 且整树只有它自己一簇）
"""
import json
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).parent / "data" / "trees"


def iter_trees():
    for p in sorted(BASE.rglob("*.json")):
        rel = p.relative_to(BASE)
        if str(rel).startswith("_"):
            continue
        if rel.name == "README.md":
            continue
        yield rel, p


def collect_nodes(tree):
    nodes = []
    if not isinstance(tree, dict):
        return nodes
    for d in tree.get("domains", []) or []:
        dname = d.get("name_en") or d.get("name") or ""
        for n in d.get("nodes", []) or []:
            if "id" in n:
                n["_domain"] = dname
                nodes.append(n)
    return nodes


def build_graph(nodes):
    ids = {n["id"] for n in nodes}
    # 无向图用于连通性判断（prerequisites + extends + parallel 都算边）
    adj = defaultdict(set)
    # 有向前置图，用于检测循环
    dir_adj = defaultdict(set)
    dangling_prereq = []
    dangling_extends = []
    dangling_parallel = []
    for n in nodes:
        nid = n["id"]
        for field, target_list in [
            ("prerequisites", "dangling_prereq"),
            ("extends", "dangling_extends"),
            ("parallel", "dangling_parallel"),
        ]:
            refs = n.get(field) or []
            if not isinstance(refs, list):
                continue
            for r in refs:
                if not isinstance(r, str):
                    continue
                if r not in ids:
                    if field == "prerequisites":
                        dangling_prereq.append((nid, r))
                    elif field == "extends":
                        dangling_extends.append((nid, r))
                    else:
                        dangling_parallel.append((nid, r))
                    continue
                adj[nid].add(r)
                adj[r].add(nid)
                if field == "prerequisites":
                    dir_adj[r].add(nid)  # 前置 → 后续
    return ids, adj, dir_adj, dangling_prereq, dangling_extends, dangling_parallel


def connected_components(ids, adj):
    """返回弱连通分量列表，每个是节点 id 集合"""
    visited = set()
    comps = []
    for start in ids:
        if start in visited:
            continue
        stack = [start]
        comp = set()
        while stack:
            x = stack.pop()
            if x in visited:
                continue
            visited.add(x)
            comp.add(x)
            stack.extend(adj[x] - visited)
        comps.append(comp)
    return sorted(comps, key=len, reverse=True)


def detect_cycles(dir_adj):
    """检测有向图中的环，返回 edge 列表"""
    # 三色 DFS
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {}
    back_edges = []

    def dfs(u):
        color[u] = GRAY
        for v in dir_adj.get(u, set()):
            c = color.get(v, WHITE)
            if c == GRAY:
                back_edges.append((u, v))
            elif c == WHITE:
                dfs(v)
        color[u] = BLACK

    for node in list(dir_adj.keys()):
        if color.get(node, WHITE) == WHITE:
            dfs(node)
    return back_edges


def analyze_tree(tree_path):
    data = json.loads(tree_path.read_text(encoding="utf-8"))
    nodes = collect_nodes(data)
    if not nodes:
        return None
    ids, adj, dir_adj, d_pre, d_ext, d_par = build_graph(nodes)
    comps = connected_components(ids, adj)
    isolated = [c for c in comps if len(c) == 1]
    small_clusters = [c for c in comps if 1 < len(c) < max(3, len(ids) * 0.1)]
    cycles = detect_cycles(dir_adj)
    # 节点度分布
    degree = {nid: len(adj[nid]) for nid in ids}
    return {
        "total": len(ids),
        "edges_undirected": sum(len(s) for s in adj.values()) // 2,
        "components": len(comps),
        "biggest_comp": len(comps[0]) if comps else 0,
        "small_clusters": [sorted(list(c)) for c in small_clusters],
        "isolated": [list(c)[0] for c in isolated],
        "dangling_prereq": d_pre,
        "dangling_extends": d_ext,
        "dangling_parallel": d_par,
        "cycles": cycles,
        "domains_map": {n["id"]: n["_domain"] for n in nodes},
        "nodes": nodes,
    }


def main():
    full = {}
    issues_count = 0
    for rel, path in iter_trees():
        res = analyze_tree(path)
        if res is None:
            continue
        key = str(rel)
        has_issue = (
            res["components"] > 1
            or res["isolated"]
            or res["dangling_prereq"]
            or res["dangling_extends"]
            or res["dangling_parallel"]
            or res["cycles"]
        )
        if has_issue:
            issues_count += 1
        full[key] = res

    # 报告
    print(f"{'File':55s} {'N':>4s} {'E':>4s} {'C':>3s} {'Big':>4s} {'Iso':>4s} {'Dang':>5s} {'Cyc':>4s}")
    print("-" * 95)
    total_nodes = 0
    total_components = 0
    total_isolated = 0
    total_dangling = 0
    total_cycles = 0
    for f, r in sorted(full.items()):
        total_nodes += r["total"]
        total_components += r["components"]
        total_isolated += len(r["isolated"])
        dang = len(r["dangling_prereq"]) + len(r["dangling_extends"]) + len(r["dangling_parallel"])
        total_dangling += dang
        total_cycles += len(r["cycles"])
        flag = ""
        if r["components"] > 1:
            flag += "⚠"
        if dang:
            flag += "🔗"
        if r["cycles"]:
            flag += "♻"
        print(f"{f:55s} {r['total']:>4d} {r['edges_undirected']:>4d} {r['components']:>3d} "
              f"{r['biggest_comp']:>4d} {len(r['isolated']):>4d} {dang:>5d} {len(r['cycles']):>4d} {flag}")
    print("-" * 95)
    print(f"{'TOTAL':55s} {total_nodes:>4d}     {total_components:>3d}      {total_isolated:>4d} {total_dangling:>5d} {total_cycles:>4d}")
    print(f"\n问题文件数: {issues_count}/{len(full)}")

    # 详细列表
    print("\n\n===== 悬空引用详情 =====")
    for f, r in sorted(full.items()):
        if r["dangling_prereq"] or r["dangling_extends"] or r["dangling_parallel"]:
            print(f"\n## {f}")
            for src, tgt in r["dangling_prereq"]:
                print(f"  [prereq] {src} → {tgt} (not found)")
            for src, tgt in r["dangling_extends"]:
                print(f"  [extends] {src} → {tgt} (not found)")
            for src, tgt in r["dangling_parallel"]:
                print(f"  [parallel] {src} → {tgt} (not found)")

    print("\n\n===== 孤立簇详情（>1 个连通分量的文件）=====")
    for f, r in sorted(full.items()):
        if r["components"] > 1:
            print(f"\n## {f}  ({r['components']} 个簇, 最大 {r['biggest_comp']}, 共 {r['total']} 节点)")
            # 列出非主簇
            dom_map = r["domains_map"]
            # 重建 comp 列表按大小排序
            nodes = r["nodes"]
            ids, adj, *_ = build_graph(nodes)
            comps = connected_components(ids, adj)
            for i, c in enumerate(comps):
                if i == 0:
                    continue  # 主簇
                domains = sorted(set(dom_map.get(x, "") for x in c))
                print(f"  簇#{i+1} ({len(c)} 节点, 所属域: {domains}):")
                for x in sorted(c)[:10]:
                    print(f"    - {x} ({dom_map.get(x, '')})")
                if len(c) > 10:
                    print(f"    ... 还有 {len(c)-10} 个")

    print("\n\n===== 循环依赖 =====")
    for f, r in sorted(full.items()):
        if r["cycles"]:
            print(f"\n## {f}")
            for u, v in r["cycles"]:
                print(f"  cycle edge: {u} → {v}")

    # 输出 JSON
    out = {
        "summary": {
            "files": len(full),
            "files_with_issues": issues_count,
            "total_nodes": total_nodes,
            "total_dangling_refs": total_dangling,
            "total_isolated_nodes": total_isolated,
            "total_cycles": total_cycles,
        },
        "details": {f: {k: v for k, v in r.items() if k not in ("nodes", "domains_map")}
                    for f, r in full.items()},
    }
    Path(__file__).parent.joinpath("graph_report.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n报告: graph_report.json")


if __name__ == "__main__":
    main()
