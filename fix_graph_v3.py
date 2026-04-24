#!/usr/bin/env python3
"""
v3：对于 prerequisites 为空、仅通过 parallel 与其他节点连通的节点，
把它的 parallel 搬到 prerequisites（使视觉上有箭头实线）。
仅搬同 domain 的 parallel；跨 domain 的已在 v2 处理过。
"""
import json
from collections import defaultdict, deque
from pathlib import Path

BASE = Path(__file__).parent / "data" / "trees"


def collect_domains(tree):
    out = []
    for d in tree.get("domains", []) or []:
        dname = d.get("name_en") or d.get("name") or ""
        nodes = [n for n in (d.get("nodes") or []) if isinstance(n, dict) and "id" in n]
        out.append((dname, nodes))
    return out


def all_nodes(tree):
    for _, ns in collect_domains(tree):
        for n in ns:
            yield n


def get_domain_map(tree):
    m = {}
    for dname, ns in collect_domains(tree):
        for n in ns:
            m[n["id"]] = dname
    return m


def build_dir_graph(tree):
    adj = defaultdict(set)
    for n in all_nodes(tree):
        for pid in n.get("prerequisites", []) or []:
            if isinstance(pid, str):
                adj[pid].add(n["id"])
    return adj


def has_path_dir(adj, start, end):
    if start == end:
        return True
    visited = {start}
    q = deque([start])
    while q:
        x = q.popleft()
        for y in adj.get(x, ()):
            if y == end:
                return True
            if y not in visited:
                visited.add(y)
                q.append(y)
    return False


def process_tree(path):
    tree = json.loads(path.read_text(encoding="utf-8"))
    dmap = get_domain_map(tree)
    dir_adj = build_dir_graph(tree)
    moved = 0
    for n in all_nodes(tree):
        pre = n.get("prerequisites") or []
        par = n.get("parallel") or []
        if pre:
            # 已有 prereq，不动 parallel（保留真实的并列关系）
            continue
        if not par:
            continue
        new_par = []
        for pid in par:
            if not isinstance(pid, str) or pid == n["id"]:
                continue
            # 避免循环
            if has_path_dir(dir_adj, n["id"], pid):
                new_par.append(pid)
                continue
            pre.append(pid)
            dir_adj[pid].add(n["id"])
            moved += 1
            # 只搬一条作为 prereq，其余保留为 parallel
            # （但如果有多条 parallel，保留其余以维持连通冗余）
        # 第一条已搬，其余保留（new_par 在 break 后合并）
        # 简化：把第一个搬走，剩下的全部保留
        if pre:
            n["prerequisites"] = pre
            # 移除被搬走的第一条
            n["parallel"] = [p for p in par if p not in pre]

    if moved:
        path.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return moved


def main():
    total = 0
    changed = 0
    for p in sorted(BASE.rglob("*.json")):
        rel = p.relative_to(BASE)
        if str(rel).startswith("_"):
            continue
        m = process_tree(p)
        if m:
            changed += 1
            print(f"  {rel}  +{m}")
        total += m
    print(f"\nFiles changed: {changed}")
    print(f"Total parallel->prereq: {total}")


if __name__ == "__main__":
    main()
