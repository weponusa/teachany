#!/usr/bin/env python3
"""Resolve teachany-courseware root (authoritative knowledge trees + node-index)."""
from __future__ import annotations

import os
from pathlib import Path


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


def require_courseware_repo() -> Path:
    repo = find_courseware_repo()
    if repo:
        return repo
    raise SystemExit(
        "❌ 未找到 teachany-courseware（需含 data/trees/）。\n"
        "   请 clone: https://github.com/weponusa/teachany-courseware\n"
        "   并设置: export TEACHANY_COURSEWARE_REPO=/path/to/teachany-courseware"
    )
