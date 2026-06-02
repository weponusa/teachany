#!/usr/bin/env python3
"""
中国课标全学科灌注：历史走 cn_history_curriculum，其余走 cn_curriculum_common。

  python3 scripts/inject-cn-curriculum.py --cn-tree-only
  python3 scripts/inject-cn-curriculum.py --re-emit-kcp
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from cn_curriculum_common import enrich_cn_subject_satellite  # noqa: E402
from cn_history_curriculum import enrich_kp_satellite, load_junior_parser  # noqa: E402

TREES = ROOT / "data" / "trees" / "cn"
KP_INDEX = ROOT / "data" / "kp" / "_index.json"


def cn_tree_node_ids() -> set[str]:
    ids: set[str] = set()

    def walk(o: object) -> None:
        if isinstance(o, dict):
            if "id" in o and "grade" in o and "prerequisites" in o:
                ids.add(o["id"])
            for v in o.values():
                if isinstance(v, (dict, list)):
                    walk(v)
        elif isinstance(o, list):
            for it in o:
                walk(it)

    for fp in TREES.rglob("*.json"):
        walk(json.loads(fp.read_text(encoding="utf-8")))
    return ids


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cn-tree-only", action="store_true", default=True)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--re-emit-kcp", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    tree_ids = cn_tree_node_ids() if args.cn_tree_only else None
    index = json.loads(KP_INDEX.read_text(encoding="utf-8")).get("kps", {})
    junior = load_junior_parser()

    hist_n = subj_n = skip = 0
    for nid, rel in sorted(index.items()):
        if tree_ids is not None and nid not in tree_ids:
            skip += 1
            continue
        fp = ROOT / rel
        if not fp.is_file():
            continue
        data = json.loads(fp.read_text(encoding="utf-8"))
        if (data.get("curriculum") or "cn") != "cn":
            skip += 1
            continue
        subject = data.get("subject")
        if subject == "history":
            ok = enrich_kp_satellite(data, junior, force=args.force)
            if ok and not args.dry_run:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            hist_n += 1 if ok else 0
        elif subject in (
            "math",
            "physics",
            "chemistry",
            "biology",
            "chinese",
            "english",
            "geography",
            "science",
            "info-tech",
        ):
            ok = enrich_cn_subject_satellite(data, force=args.force)
            if ok and not args.dry_run:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            subj_n += 1 if ok else 0

    print(f"history updated: {hist_n}, other subjects: {subj_n}, skipped: {skip}")
    if args.re_emit_kcp and not args.dry_run:
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts" / "batch-emit-knowledge-context.py"),
                "--all-with-kp",
            ],
            cwd=ROOT,
            check=False,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
