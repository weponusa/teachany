#!/usr/bin/env python3
"""从 registry.json 同步 community/index.json。

修复点：用户上传课件进入 community/<id>/ 后，rebuild-index.py 会写 registry.json 和知识树，
但旧流程不会刷新 community/index.json，导致 Gallery/Hub 的社区源缺失 likes/download_url 等信息。

用法：
  python3 scripts/rebuild-index.py
  python3 scripts/sync-community-index.py
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.json"
COMMUNITY_INDEX = ROOT / "community" / "index.json"

SKIP = {"drafts", "pending", "archive", "approved", "rejected"}

def load(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default

def has_index(path: str) -> bool:
    return bool(path) and (ROOT / path / "index.html").exists()

def main():
    reg = load(REGISTRY, {"courses": []})
    old = load(COMMUNITY_INDEX, {"courses": []})
    old_map = {c.get("id"): c for c in old.get("courses", []) if c.get("id")}

    courses = []
    for c in reg.get("courses", []):
        path = c.get("path") or ""
        if not path.startswith("community/"):
            continue
        # 跳过 community/pending 等非正式目录
        parts = path.split("/")
        if len(parts) < 2 or parts[1] in SKIP:
            continue
        if not has_index(path):
            continue
        cid = c.get("id")
        if not cid:
            continue
        old_entry = old_map.get(cid, {})
        courses.append({
            "id": cid,
            "node_id": c.get("node_id", ""),
            "name": c.get("name", cid),
            "subject": c.get("subject", ""),
            "grade": c.get("grade", 0),
            "author": c.get("author") or old_entry.get("author") or "TeachAny Community",
            "download_url": f"https://weponusa.github.io/teachany-courseware/{path}/",
            "approved_at": old_entry.get("approved_at") or c.get("created") or datetime.now(timezone.utc).isoformat(),
            "likes": old_entry.get("likes", 0),
            "status": old_entry.get("status") or "active",
            "tags": c.get("tags", []) or old_entry.get("tags", []),
            "name_en": c.get("name_en", ""),
        })

    courses.sort(key=lambda x: (x.get("subject", ""), str(x.get("grade", "")), x.get("id", "")))
    out = {
        "version": "1.0",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "description": f"Community-contributed TeachAny coursewares - {len(courses)} indexed courses",
        "courses": courses,
    }

    # v7.15: URL 合法性校验——拦截非法 download_url
    VALID_PREFIX = "https://weponusa.github.io/teachany-courseware/"
    ILLEGAL_PATTERNS = ["community/drafts/", "/courses/", "pages.dev/courses/"]
    bad_urls = []
    for c in courses:
        url = c.get("download_url", "")
        if not url.startswith(VALID_PREFIX):
            bad_urls.append((c["id"], url, "不以 teachany-courseware 开头"))
        for pat in ILLEGAL_PATTERNS:
            if pat in url:
                bad_urls.append((c["id"], url, f"包含非法模式 '{pat}'"))
    if bad_urls:
        print(f"❌ URL 合法性校验失败！发现 {len(bad_urls)} 个非法 URL：")
        for cid, url, reason in bad_urls[:10]:
            print(f"   {cid}: {url} ({reason})")
        raise SystemExit(1)

    COMMUNITY_INDEX.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ community/index.json 已同步：{len(courses)} 个社区课件")

if __name__ == "__main__":
    main()
