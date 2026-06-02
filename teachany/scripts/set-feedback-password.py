#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""写入或校验 manifest.json 中的学生反馈密码（FEEDBACK_SETUP.md）。

用法:
  python3 set-feedback-password.py community/foo/manifest.json --password '课堂口令' --hint '向王老师索取'
  python3 set-feedback-password.py community/foo/manifest.json --decline
  python3 set-feedback-password.py --check community/foo/manifest.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SHA256_RE = re.compile(r"^[a-f0-9]{64}$")


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_manifest(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def check_feedback(manifest: dict, course_label: str) -> list[str]:
    errors: list[str] = []
    fb = manifest.get("feedback")
    if not isinstance(fb, dict):
        errors.append(f"{course_label}: manifest 缺少 feedback 对象（Phase 3.5a 须询问教师并写入）")
        return errors
    if fb.get("teacher_declined") is True:
        if fb.get("require_password") is not False:
            errors.append(f"{course_label}: teacher_declined 时 require_password 应为 false")
        return errors
    sha = str(fb.get("password_sha256", "")).strip().lower()
    if not SHA256_RE.fullmatch(sha):
        errors.append(
            f"{course_label}: feedback.password_sha256 无效（须 64 位十六进制；"
            f"用本脚本 --password 写入，见 FEEDBACK_SETUP.md）"
        )
    if not fb.get("require_password"):
        errors.append(f"{course_label}: 已设密码哈希但 require_password 不为 true")
    if not str(fb.get("password_hint", "")).strip():
        errors.append(f"{course_label}: 建议设置 feedback.password_hint 便于学生回忆口令")
    return errors


def cmd_setup(path: Path, password: str | None, hint: str, decline: bool) -> int:
    data = load_manifest(path)
    if decline:
        data["feedback"] = {
            "require_password": False,
            "teacher_declined": True,
            "note": "授课教师选择不启用反馈密码",
        }
    else:
        if not password or not password.strip():
            print("❌ 须提供 --password，或显式 --decline", file=sys.stderr)
            return 1
        data["feedback"] = {
            "require_password": True,
            "password_sha256": sha256_hex(password),
            "password_hint": hint.strip() or "请向授课教师索取课堂反馈口令",
        }
    save_manifest(path, data)
    print(f"✅ 已写入 feedback → {path}")
    return 0


def cmd_check(path: Path) -> int:
    label = path.parent.name or str(path)
    errs = check_feedback(load_manifest(path), label)
    if errs:
        for e in errs:
            print(f"❌ {e}", file=sys.stderr)
        return 1
    print(f"✅ feedback 配置有效: {path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="TeachAny 课件反馈密码")
    parser.add_argument("manifest", nargs="?", type=Path, help="manifest.json 路径")
    parser.add_argument("--check", action="store_true", help="仅校验，不写入")
    parser.add_argument("--password", help="课堂反馈口令（明文，仅本地处理）")
    parser.add_argument("--hint", default="", help="密码提示（可显示给学生）")
    parser.add_argument("--decline", action="store_true", help="教师明确不启用反馈密码")
    args = parser.parse_args()

    if args.check:
        if not args.manifest:
            parser.error("--check 需要 manifest 路径")
        return cmd_check(args.manifest)

    if not args.manifest:
        parser.error("需要 manifest.json 路径")
    return cmd_setup(args.manifest, args.password, args.hint, args.decline)


if __name__ == "__main__":
    sys.exit(main())
