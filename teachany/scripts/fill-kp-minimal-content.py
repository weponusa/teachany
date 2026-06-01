#!/usr/bin/env python3
"""Fill empty exercises/errors in kp satellite JSON from curriculum_points."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KP_ROOT = ROOT / "data" / "kp"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clean_snippets(data: dict) -> bool:
    """Remove Stage7 OCR preamble dumps from textbook_content."""
    changed = False
    tc = data.get("textbook_content") or {}
    snippets = tc.get("snippets") or []
    if not snippets:
        return False

    def bad(s: str) -> bool:
        head = (s or "")[:120]
        return "万史" in head or "北京1大学" in head or len(s) > 800 and "修订原则" in s

    good = [s for s in snippets if not bad(s)]
    if len(good) != len(snippets):
        if good:
            tc["snippets"] = good[:3]
        else:
            tc.pop("snippets", None)
        data["textbook_content"] = tc
        sup = data.get("supplements") or {}
        oxc = sup.get("openstax_or_curriculum") or []
        good2 = [s for s in oxc if not bad(s)]
        if good2:
            sup["openstax_or_curriculum"] = good2[:2]
        elif "openstax_or_curriculum" in sup:
            del sup["openstax_or_curriculum"]
        data["supplements"] = sup
        changed = True
    return changed


def fill_node(data: dict) -> bool:
    changed = _clean_snippets(data)
    name = data.get("name") or data.get("kp_id") or "本知识点"
    cps = [str(x).strip() for x in (data.get("curriculum_points") or []) if str(x).strip()]
    if not cps:
        exs = data.get("excerpts") or []
        cps = [str(e.get("text", "")).strip() for e in exs if str(e.get("text", "")).strip()][:2]

    exercises = list(data.get("exercises") or [])
    if len(exercises) < 1 and cps:
        cp = cps[0][:200]
        exercises.append(
            {
                "id": "q-1",
                "stem": f"结合课标要求，说明「{name}」的核心内涵，并各举一条史料或史实依据。",
                "answer": f"应答扣课标要点：{cp[:120]}…；并区分证据类型（文献/考古/制度等）。",
                "type": "short_answer",
            }
        )
        changed = True
    if len(exercises) < 2 and len(cps) > 1:
        exercises.append(
            {
                "id": "q-2",
                "stem": f"用因果链解释：{cps[1][:80]}… 对理解「{name}」为何重要？",
                "answer": "需写出前因—制度/经济/思想变化—后果，避免只罗列年代。",
                "type": "short_answer",
            }
        )
        changed = True

    errors = list(data.get("errors") or [])
    if len(errors) < 1:
        errors.append(
            {
                "id": "err-1",
                "description": "只记年代与名词，不能用史料与制度变迁解释历史进程。",
                "type": "conceptual",
            }
        )
        changed = True
    if len(errors) < 2:
        errors.append(
            {
                "id": "err-2",
                "description": "把传说叙述与考古/文献证据混为一谈，未区分证据强度。",
                "type": "evidence",
            }
        )
        changed = True

    if changed:
        data["exercises"] = exercises[:3]
        data["errors"] = errors[:3]
        meta = data.setdefault("_meta", {})
        meta["minimal_fill_at"] = _utc()
    return changed


def process_dir(kp_dir: Path, dry_run: bool) -> tuple[int, int]:
    n = 0
    for fp in sorted(kp_dir.glob("*.json")):
        data = json.loads(fp.read_text(encoding="utf-8"))
        if fill_node(data):
            n += 1
            if not dry_run:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return n, len(list(kp_dir.glob("*.json")))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject-dir", action="append", default=["history"])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    total_changed = 0
    for subj in args.subject_dir:
        d = KP_ROOT / subj
        if not d.is_dir():
            print(f"skip missing {d}")
            continue
        changed, total = process_dir(d, args.dry_run)
        print(f"{subj}: filled {changed}/{total}")
        total_changed += changed
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
