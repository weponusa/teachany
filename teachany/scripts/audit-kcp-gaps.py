#!/usr/bin/env python3
"""List community courseware missing or thin knowledge-context.json (P0/P1 audit)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMUNITY = ROOT / "community"
sys.path.insert(0, str(ROOT / "scripts"))

from knowledge_context import build_kcp, assess_kcp_gaps  # noqa: E402


def main() -> int:
    rows: list[tuple[str, list[str], bool]] = []
    for course_dir in sorted(COMMUNITY.iterdir()):
        if not course_dir.is_dir():
            continue
        kcp_path = course_dir / "knowledge-context.json"
        node_id = course_dir.name
        if kcp_path.is_file():
            kcp = json.loads(kcp_path.read_text(encoding="utf-8"))
            gaps = kcp.get("gaps") or assess_kcp_gaps(kcp)
            rows.append((node_id, gaps, True))
            continue
        try:
            kcp = build_kcp(node_id, merge_children=False)
            gaps = assess_kcp_gaps(kcp)
        except Exception as exc:  # noqa: BLE001
            rows.append((node_id, [f"build_error:{exc}"], False))
            continue
        rows.append((node_id, gaps, False))

    missing = [r for r in rows if not r[2]]
    thin = [r for r in rows if r[1]]
    print(f"community courses: {len(rows)}")
    print(f"missing knowledge-context.json: {len(missing)}")
    print(f"with gaps (file or synthetic): {len(thin)}")
    if missing:
        print("\n## missing file")
        for nid, gaps, _ in missing[:40]:
            print(f"  {nid}: {','.join(gaps) or 'no-kcp'}")
        if len(missing) > 40:
            print(f"  ... +{len(missing) - 40} more")
    if thin:
        print("\n## gaps")
        for nid, gaps, has in thin[:50]:
            tag = "file" if has else "synthetic"
            print(f"  {nid} [{tag}]: {','.join(gaps)}")
    return 0 if not missing and not thin else 1


if __name__ == "__main__":
    raise SystemExit(main())
