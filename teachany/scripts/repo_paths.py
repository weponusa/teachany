#!/usr/bin/env python3
"""Resolve teachany-courseware root (authoritative knowledge trees + node-index)."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

REMOTE_DATA_BASES = (
    "https://www.teachany.cn/data/",
    "https://cdn.jsdelivr.net/gh/weponusa/teachany-courseware@main/data/",
    "https://raw.githubusercontent.com/weponusa/teachany-courseware/main/data/",
)


def find_courseware_repo() -> Path | None:
    """Return repo root containing data/trees (and usually data/node-index.json)."""
    env = os.environ.get("TEACHANY_COURSEWARE_REPO", "").strip()
    candidates = [
        Path(env).expanduser() if env else None,
        Path.cwd(),
        Path.home() / "CodeBuddy" / "一次函数" / "teachany-courseware",
        Path.home() / "teachany-courseware",
        Path.home() / "CodeBuddy" / "teachany-courseware",
    ]
    for c in candidates:
        if c and (c / "data" / "trees").is_dir():
            return c.resolve()
    return None


def find_skill_repo() -> Path | None:
    """Local folder teachany-opensource (GitHub: weponusa/teachany) — skill only, usually no trees."""
    candidates = [
        Path(__file__).resolve().parents[2],
        Path.home() / "CodeBuddy" / "一次函数" / "teachany-opensource",
        Path.home() / "teachany-opensource",
    ]
    for c in candidates:
        if (c / "teachany" / "scripts").is_dir() or (c / "skill" / "scripts").is_dir():
            return c.resolve()
    return None


def fetch_remote_json(rel_path: str, timeout: int = 60) -> dict | list | None:
    """只读拉取 data/ 下 JSON（无需 clone，需能访问 teachany.cn 或 jsDelivr）。"""
    rel = str(rel_path).replace("\\", "/").lstrip("/")
    if rel.startswith("data/"):
        rel = rel[5:]
    for base in REMOTE_DATA_BASES:
        url = base + rel
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "TeachAny-Skill/7.16"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            continue
    return None


def remote_data_available() -> bool:
    """探测远程课标数据是否可达（用于无本地仓时的只读脚本）。"""
    probe = fetch_remote_json("trees/cn/middle/math.json", timeout=20)
    return isinstance(probe, dict) and "domains" in probe


def list_trees_via_remote() -> list[dict]:
    """从远程 curricula.json 枚举学科树（--list-trees 无本地仓时使用）。"""
    curricula = fetch_remote_json("curricula.json")
    out: list[dict] = []
    if not isinstance(curricula, dict):
        return out
    for curr in curricula.get("curricula") or []:
        curr_id = (curr.get("id") or "").replace("-national", "").replace("-", "")
        # cn-national → cn；其余课标用 trees 路径首段
        for t in curr.get("trees") or []:
            f = (t.get("file") or "").replace("\\", "/")
            if "data/trees/" not in f:
                continue
            rel = f.split("data/trees/", 1)[-1]
            parts = rel.split("/")
            if len(parts) < 3:
                continue
            c0, stg, fname = parts[0], parts[1], parts[-1]
            out.append({
                "curriculum": c0,
                "stage": stg,
                "subject": fname.replace(".json", ""),
                "file": f"data/trees/{rel}",
                "nodes": None,
                "subject_zh": t.get("label_zh") or fname,
            })
    return out


def require_courseware_repo() -> Path:
    repo = find_courseware_repo()
    if repo:
        return repo
    if remote_data_available():
        raise SystemExit(
            "❌ 未找到本地 teachany-courseware，但远程课标数据可用。\n"
            "   只读查询请直接运行 find_nodes.py / check_node_id.py（已支持 HTTP）。\n"
            "   写入挂树/发布仍须 clone 并在本地执行 rebuild-index.py。"
        )
    raise SystemExit(
        "❌ 未找到 teachany-courseware，且无法访问远程 data/（teachany.cn / jsDelivr）。\n"
        "   请 clone: https://github.com/weponusa/teachany-courseware\n"
        "   或检查网络后重试。"
    )
