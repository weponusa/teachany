#!/usr/bin/env python3
"""校验课件注册地址，防止主仓库入口指向不存在的 teachany-courseware 地址。"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

BASE_URL = "https://weponusa.github.io/teachany-courseware"
BAD_BASE_URL = "https://weponusa.github.io/teachany"
SKIP_DIRS = {"pending", "archive", "drafts", "approved", "rejected"}

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def find_courseware_root() -> Path | None:
    env = os.environ.get("TEACHANY_COURSEWARE_REPO")
    candidates = []
    if env:
        candidates.append(Path(env).expanduser())
    if ROOT.name == "teachany-courseware":
        candidates.append(ROOT)
    candidates.append(ROOT.parent / "teachany-courseware")
    for p in candidates:
        if (p / "community").is_dir():
            return p
    return None


def normalize_url(path: str) -> str:
    return f"{BASE_URL}/{path.strip('/').rstrip('/')}/index.html"


def head_ok(url: str, timeout: int = 8) -> tuple[bool, str]:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "TeachAny-Link-Checker/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= resp.status < 400, str(resp.status)
    except Exception as e:
        return False, str(e)[:160]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--online", action="store_true", help="同时 HEAD 检查线上 Pages URL")
    ap.add_argument("--id", action="append", dest="ids", help="只检查指定课件 ID，可重复传入")
    args = ap.parse_args()
    only_ids = set(args.ids or [])

    registry = load_json(ROOT / "registry.json", {"courses": []})
    community_index = load_json(ROOT / "community" / "index.json", {"courses": []})
    cw_root = find_courseware_root()

    errors: list[str] = []
    warnings: list[str] = []

    community_by_id = {c.get("id"): c for c in community_index.get("courses", []) if c.get("id")}

    for c in community_index.get("courses", []):
        cid = c.get("id", "")
        if only_ids and cid not in only_ids:
            continue
        url = c.get("download_url", "")
        if not url:
            errors.append(f"{cid}: community/index.json 缺少 download_url")
        elif url.startswith(BAD_BASE_URL + "/"):
            errors.append(f"{cid}: download_url 仍指向主仓库，会产生跳转/404：{url}")
        elif not url.startswith(BASE_URL + "/"):
            errors.append(f"{cid}: download_url 未指向课件实体仓库：{url}")

    checked = 0
    for c in registry.get("courses", []):
        cid = c.get("id", "")
        if only_ids and cid not in only_ids:
            continue
        path = (c.get("path") or "").strip("/")
        if not path.startswith("community/"):
            continue
        parts = path.split("/")
        if len(parts) < 2 or parts[1] in SKIP_DIRS:
            continue
        checked += 1
        expected = normalize_url(path)
        entry = community_by_id.get(cid)
        if entry:
            got = (entry.get("download_url") or "").rstrip("/")
            allowed = {expected.rstrip("/"), expected[:-len("index.html")].rstrip("/")}
            if got and got not in allowed:
                errors.append(f"{cid}: community/index.json URL 与 registry.path 不一致：{entry.get('download_url')} != {expected}")
        if cw_root:
            local_index = cw_root / path / "index.html"
            if not local_index.exists():
                errors.append(f"{cid}: 课件实体不存在：{local_index}")
        else:
            warnings.append("未找到本地 teachany-courseware 仓库，跳过本地实体文件检查")
        if args.online:
            ok, detail = head_ok(expected)
            if not ok:
                errors.append(f"{cid}: 线上 URL 不可访问：{expected} ({detail})")

    print(f"检查课件注册地址：{checked} 个 registry community 课件")
    if cw_root:
        print(f"本地实体仓库：{cw_root}")
    for w in sorted(set(warnings)):
        print(f"⚠️  {w}")
    if errors:
        print(f"❌ 发现 {len(errors)} 个问题：")
        for e in errors[:80]:
            print(f"  - {e}")
        if len(errors) > 80:
            print(f"  ... 另有 {len(errors) - 80} 个问题")
        return 1
    print("✅ 课件注册地址检查通过：全部直指 teachany-courseware，且本地实体存在")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
