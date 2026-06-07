#!/usr/bin/env python3
"""Legacy entry: submit-to-community lives in teachany-courseware.

Skill 用户请优先：
  TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish <course-id> --course-dir <path>
或：
  bash publish_course.sh <课件目录> <course-id>
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def _find_courseware_submit() -> tuple[Path, Path] | None:
    try:
        from repo_paths import find_courseware_repo

        cw = find_courseware_repo()
        if cw:
            script = cw / "scripts" / "submit-to-community.py"
            if script.is_file():
                return script, cw
    except Exception:
        pass
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        try:
            from github_courseware import ensure_shallow_clone

            cw = ensure_shallow_clone(Path.home() / ".cache" / "teachany-courseware")
            script = cw / "scripts" / "submit-to-community.py"
            if script.is_file():
                return script, cw
        except Exception:
            pass
    return None


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "用法: python3 submit-to-community.py <course-id> [options]\n"
            "推荐: TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish <course-id> --course-dir <path>",
            file=sys.stderr,
        )
        return 1

    found = _find_courseware_submit()
    if found:
        script, cwd = found
        return subprocess.call([sys.executable, str(script), *sys.argv[1:]], cwd=str(cwd))

    skill_scripts = Path(__file__).resolve().parent
    publish_sh = skill_scripts / "publish_course.sh"
    course_id = sys.argv[1]
    for base in (Path.cwd(), skill_scripts.parent.parent):
        for sub in (f"community/{course_id}", course_id, f"drafts/{course_id}"):
            src = (base / sub).resolve()
            if src.is_dir() and (src / "index.html").is_file():
                print(
                    f"📡 无本地 courseware 仓，转调 publish_course.sh → {src}",
                    file=sys.stderr,
                )
                return subprocess.call(["bash", str(publish_sh), str(src), course_id, *sys.argv[2:]])

    print(
        "❌ 未找到 teachany-courseware（scripts/submit-to-community.py）。\n"
        "   设置 TEACHANY_COURSEWARE_REPO 或 GH_TOKEN（浅克隆 ~/.cache/teachany-courseware），\n"
        "   或使用: TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish <id> --course-dir <path>",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
