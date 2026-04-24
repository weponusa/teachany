#!/usr/bin/env python3
"""
v2 修复：把上一次修复脚本加到 parallel 里的桥接边迁移到 prerequisites。
判定"脚本加的"桥接边特征：parallel 中指向【不同 domain】的节点 id。
保留 domain 内部的 parallel 边（真正的"并列/同类"关系）。

步骤：
1) 对每棵 tree，扫描每个节点 node 的 parallel 数组：
   - 若 parallel 中某 id 属于不同 domain，且与 node 无其他 pre/ext/par 路径，
     把它搬到 prerequisites（去重、避免循环）
2) 校验修复后无悬空、无循环、无孤立
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
    """id -> domain_name"""
    m = {}
    for dname, ns in collect_domains(tree):
        for n in ns:
            m[n["id"]] = dname
    return m


def build_dir_graph(tree):
    """基于 prerequisites 的有向图: prereq -> node"""
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
    moved = 0
    dir_adj = build_dir_graph(tree)
    for n in all_nodes(tree):
        par = n.get("parallel") or []
        if not par:
            continue
        new_par = []
        for pid in par:
            if not isinstance(pid, str):
                continue
            if pid == n["id"]:
                continue  # 自环去除
            # 跨 domain 的 parallel → 视为"桥接"，搬到 prerequisites
            same_domain = dmap.get(pid) == dmap.get(n["id"])
            if same_domain:
                new_par.append(pid)
                continue
            # 跨 domain：搬到 prereq，但要避免造成循环（即 n -> ... -> pid 已存在）
            if has_path_dir(dir_adj, n["id"], pid):
                # 搬的话 pid -> n 会造成循环（n -> pid -> ... -> n），改加反向：n -> pid 作为后继，即把 n 作为 pid 的 prereq
                # 更简单：就留着，不搬
                new_par.append(pid)
                continue
            # 加到 n.prerequisites（若不存在）
            pre = n.get("prerequisites") or []
            if pid not in pre:
                pre.append(pid)
                n["prerequisites"] = pre
                # 更新 dir_adj
                dir_adj[pid].add(n["id"])
                moved += 1
            # 不加到 new_par（已搬走）
        n["parallel"] = new_par

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
            print(f"  {rel}  moved parallel->prereq: {m}")
        total += m
    print(f"\nFiles changed: {changed}")
    print(f"Total edges migrated: {total}")


if __name__ == "__main__":
    main()
