#!/usr/bin/env python3
"""
Batch-emit community/*/knowledge-context.json via knowledge_layer lookup.

Examples:
  python3 scripts/batch-emit-knowledge-context.py --subject history
  python3 scripts/batch-emit-knowledge-context.py --subject history --stage high
  python3 scripts/batch-emit-knowledge-context.py --node-id hist-h-ancient-civ --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.json"
COMMUNITY = ROOT / "community"
LOOKUP = ROOT / "scripts" / "knowledge_layer.py"


def load_registry() -> list[dict]:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    return data.get("courses") or []


def course_dirs(
    *,
    subject: str | None,
    stage: str | None,
    node_ids: list[str] | None,
) -> list[tuple[str, Path]]:
    rows: list[tuple[str, Path]] = []
    if node_ids:
        for nid in node_ids:
            d = COMMUNITY / nid
            if d.is_dir():
                rows.append((nid, d))
        return rows

    for entry in load_registry():
        path = entry.get("path") or ""
        if not path.startswith("community/"):
            continue
        nid = entry.get("node_id") or entry.get("id")
        if not nid:
            continue
        if subject and entry.get("subject") != subject:
            continue
        if stage:
            st = entry.get("stage") or ""
            if st != stage and not str(nid).startswith(f"hist-{stage[0]}-"):
                # registry 部分历史课无 stage 字段：用 node_id 前缀粗筛
                if stage == "high" and not (
                    nid.startswith("hist-h-") or nid == "ancient-china-h"
                ):
                    continue
                if stage == "middle" and not nid.startswith("hist-m-"):
                    continue
        d = ROOT / path
        if d.is_dir():
            rows.append((nid, d))
    # 去重（registry 偶有重复）
    seen: set[str] = set()
    out: list[tuple[str, Path]] = []
    for nid, d in rows:
        if nid in seen:
            continue
        seen.add(nid)
        out.append((nid, d))
    return sorted(out, key=lambda x: x[0])


def emit_one(node_id: str, course_dir: Path, subject: str | None, dry_run: bool) -> int:
    out = course_dir / "knowledge-context.json"
    cmd = [
        sys.executable,
        str(LOOKUP),
        "lookup",
        "--node-id",
        node_id,
        "--emit-kcp",
        str(out),
    ]
    if subject:
        cmd.extend(["--subject", subject])
    if dry_run:
        print("DRY", " ".join(cmd))
        return 0
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"FAIL {node_id}: {proc.stderr.strip() or proc.stdout.strip()}", file=sys.stderr)
        return proc.returncode
    gaps = ""
    if out.is_file():
        kcp = json.loads(out.read_text(encoding="utf-8"))
        gaps = ",".join(kcp.get("gaps") or []) or "ok"
    print(f"OK   {node_id} -> {out.relative_to(ROOT)} [{gaps}]")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch emit knowledge-context.json")
    parser.add_argument("--subject", help="Filter registry by subject, e.g. history")
    parser.add_argument("--stage", help="high | middle (when registry lacks stage)")
    parser.add_argument("--node-id", action="append", dest="node_ids")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    targets = course_dirs(
        subject=args.subject,
        stage=args.stage,
        node_ids=args.node_ids,
    )
    if not targets:
        print("No matching community courses.", file=sys.stderr)
        return 1

    print(f"Emitting KCP for {len(targets)} course(s)...")
    failed = 0
    for nid, d in targets:
        rc = emit_one(nid, d, args.subject, args.dry_run)
        if rc:
            failed += 1
    print(f"Done: {len(targets) - failed} ok, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
