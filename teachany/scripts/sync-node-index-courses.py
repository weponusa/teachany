#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 data/trees 中节点的 courses[] 同步到 data/node-index.json 的 nodes.*.courses。

解决：tree.html / path.html 依赖 node-index，仅 rebuild-index 更新树文件时，
node-index 仍可能 courses=[]，导致线上「知识图谱/学习路径」看不到挂树。

用法：
  python3 sync-node-index-courses.py
  python3 sync-node-index-courses.py --dry-run
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import os

def _find_courseware_root() -> Path:
    env = os.environ.get("TEACHANY_COURSEWARE_REPO", "").strip()
    for p in [
        Path(env).expanduser() if env else None,
        Path.cwd(),
        Path.home() / ".cache/teachany-courseware",
        Path.home() / "CodeBuddy/一次函数/teachany-courseware",
    ]:
        if p and (p / "data" / "node-index.json").is_file():
            return p
    if os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN"):
        from github_courseware import ensure_shallow_clone
        return ensure_shallow_clone(Path.home() / ".cache/teachany-courseware")
    raise SystemExit(
        "找不到 teachany-courseware。请 TEACHANY_COURSEWARE_REPO、在 courseware 根执行，"
        "或 GH_TOKEN + hang_tree.py rebuild --push"
    )

ROOT = _find_courseware_root()

NODE_INDEX = ROOT / "data" / "node-index.json"
TREES_DIR = ROOT / "data" / "trees"
REGISTRY = ROOT / "registry.json"
SITE_BASE = "https://www.teachany.cn"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _course_id(c):
    """courses[] 项归一化为字符串 id（兼容历史 dict 脏数据，避免 unhashable）。"""
    if isinstance(c, str):
        return c
    if isinstance(c, dict):
        return c.get("id") or c.get("course_id") or c.get("node_id")
    return None


def collect_tree_courses():
    """node_id -> [course_id, ...]"""
    out: dict[str, list[str]] = {}
    for tf in sorted(TREES_DIR.rglob("*.json")):
        if tf.name.startswith("_"):
            continue
        data = load_json(tf)
        if not isinstance(data, dict):
            continue
        for dom in data.get("domains") or []:
            for node in dom.get("nodes") or []:
                nid = node.get("id")
                if not nid:
                    continue
                cids = [cid for cid in (_course_id(c) for c in (node.get("courses") or [])) if cid]
                if cids:
                    out[nid] = sorted(set(out.get(nid, []) + cids))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not NODE_INDEX.is_file():
        raise SystemExit(f"node-index 不存在: {NODE_INDEX}")

    registry = {c["id"]: c for c in load_json(REGISTRY).get("courses", [])}
    data = load_json(NODE_INDEX)
    nodes = data.get("nodes") or {}
    tree_map = collect_tree_courses()

    updated = 0
    for nid, cids in tree_map.items():
        if nid not in nodes:
            continue
        courses = []
        for cid in cids:
            r = registry.get(cid, {})
            path = (r.get("path") or f"community/{cid}").strip("/")
            courses.append({
                "id": cid,
                "name_zh": r.get("name") or cid,
                "download_url": f"{SITE_BASE}/{path}/",
            })
        if (nodes[nid].get("courses") or []) != courses:
            nodes[nid]["courses"] = courses
            updated += 1

    data["nodes"] = nodes
    if args.dry_run:
        print(f"[dry-run] 将更新 {updated} 个节点的 courses")
        return

    NODE_INDEX.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"✅ node-index courses 已同步: {updated} 个节点更新")


if __name__ == "__main__":
    main()
