#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeachAny teaching-quality gate (v7.3).

Anti-shell validator: catches courseware that has files/sections but lacks
substantive teaching content. No third-party dependencies.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

PLACEHOLDER_PATTERNS = [
    r"TODO", r"待补", r"待填写", r"占位", r"placeholder", r"lorem ipsum",
    r"这里(填写|补充|插入)", r"请在此", r"示例文本", r"\bxxx\b", r"【[^】]{0,30}】",
]
GENERIC_PHRASES = [
    "本节课我们将学习", "通过本节课的学习", "掌握相关知识", "提升学习兴趣",
    "加深理解", "培养能力", "重要知识点", "核心概念", "拓展延伸",
]
DIAGNOSTIC_WORDS = ["错因", "诊断", "因为", "误区", "提示", "再想", "错误", "不是", "关键在于"]
PRODUCTION_WORDS = ["解释", "说明", "设计", "分析", "论证", "产出", "开放任务", "迁移", "探究"]


def locate_course(target: str) -> Path:
    p = Path(target)
    if p.exists():
        return p.resolve()
    for base in (ROOT / "community", ROOT / "examples", ROOT / "community" / "drafts"):
        candidate = base / target
        if candidate.exists():
            return candidate.resolve()
    return p.resolve()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def strip_tags(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<style\b[^>]*>.*?</style>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"&[a-zA-Z]+;", " ", html)
    return re.sub(r"\s+", " ", html).strip()


def count_chinese_like(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fffA-Za-z0-9]", text))


def extract_sections(html: str) -> list[str]:
    sections = re.findall(r"<section\b[^>]*>(.*?)</section>", html, flags=re.I | re.S)
    if sections:
        return sections
    return re.findall(r"<div\b[^>]*class=['\"][^'\"]*(?:section|module|card)[^'\"]*['\"][^>]*>(.*?)</div>", html, flags=re.I | re.S)


def issue(level: str, msg: str) -> dict[str, str]:
    return {"level": level, "message": msg}


def validate_course(course_dir: Path) -> dict[str, Any]:
    html_path = course_dir / "index.html"
    manifest_path = course_dir / "manifest.json"
    html = read_text(html_path)
    manifest: dict[str, Any] = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(read_text(manifest_path))
        except json.JSONDecodeError:
            manifest = {}

    issues: list[dict[str, str]] = []
    if not html:
        issues.append(issue("error", f"{course_dir.name}: 缺少 index.html，无法进行教学质量审查"))
        return {"course": course_dir.name, "issues": issues}

    text = strip_tags(html)
    text_len = count_chinese_like(text)
    if text_len < 1800:
        issues.append(issue("error", f"{course_dir.name}: 有效教学文本仅 {text_len} 字符 < 1800，疑似只有框架没有实质讲解"))

    placeholder_hits = []
    for pat in PLACEHOLDER_PATTERNS:
        if re.search(pat, html, flags=re.I):
            placeholder_hits.append(pat)
    if placeholder_hits:
        issues.append(issue("error", f"{course_dir.name}: 检测到模板/占位残留：{', '.join(placeholder_hits[:6])}"))

    generic_count = sum(html.count(p) for p in GENERIC_PHRASES)
    if generic_count >= 8 and text_len < 3500:
        issues.append(issue("error", f"{course_dir.name}: 泛化套话过多（{generic_count} 处）且文本偏少，疑似批量模板化输出"))

    sections = extract_sections(html)
    substantial_sections = [s for s in sections if count_chinese_like(strip_tags(s)) >= 120]
    if len(substantial_sections) < 5:
        issues.append(issue("error", f"{course_dir.name}: 实质 section 仅 {len(substantial_sections)} 个 < 5，每个模块需有可读讲解、例子或任务"))

    module_like = [s for s in sections if re.search(r"module|concept|section|lesson|knowledge|核心|模块|知识", s, re.I)]
    if len(module_like) < 3:
        issues.append(issue("error", f"{course_dir.name}: 核心知识模块少于 3 个，无法构成完整课件"))

    has_pre = re.search(r"pretest|前测|课前诊断", html, re.I)
    has_post = re.search(r"posttest|后测|学习检测|达标检测", html, re.I)
    if not has_pre or not has_post:
        issues.append(issue("error", f"{course_dir.name}: 缺少前测或后测，无法形成学习闭环"))

    bloom_levels = set(re.findall(r"data-bloom-level=['\"]([^'\"]+)['\"]", html, flags=re.I))
    if len(bloom_levels) < 3:
        issues.append(issue("error", f"{course_dir.name}: Bloom 层级覆盖不足（{len(bloom_levels)} 级），需至少 3 级并标注 data-bloom-level"))

    scaffolds = set(re.findall(r"data-scaffold=['\"]([^'\"]+)['\"]", html, flags=re.I))
    if len(scaffolds) < 2:
        issues.append(issue("error", f"{course_dir.name}: 脚手架分级不足，需至少 2 种 data-scaffold（full/partial/none）"))

    conceptest_count = len(re.findall(r"data-conceptest=['\"]true['\"]", html, flags=re.I))
    if conceptest_count < 1:
        issues.append(issue("error", f"{course_dir.name}: 缺少 ConcepTest 检查点（data-conceptest=\"true\"）"))

    if not any(w in text for w in DIAGNOSTIC_WORDS):
        issues.append(issue("error", f"{course_dir.name}: 未检测到诊断性反馈关键词，练习不能只判对错"))

    if not any(w in text for w in PRODUCTION_WORDS):
        issues.append(issue("error", f"{course_dir.name}: 未检测到解释/分析/设计/迁移类产出任务，疑似只有讲解和选择题"))

    curriculum = manifest.get("curriculum", "cn-national") if manifest else "cn-national"
    standards = manifest.get("curriculum_standards") if manifest else None
    if curriculum in ("cn-national", "cn") and not standards:
        issues.append(issue("error", f"{course_dir.name}: manifest.curriculum_standards 为空，未证明课件对齐真实课标"))
    elif isinstance(standards, list):
        bad = [s for s in standards if not isinstance(s, dict) or not s.get("content") or not s.get("source")]
        if bad:
            issues.append(issue("error", f"{course_dir.name}: curriculum_standards 存在缺 content/source 的条目"))

    return {"course": course_dir.name, "text_length": text_len, "sections": len(sections), "issues": issues}


def main() -> int:
    parser = argparse.ArgumentParser(description="TeachAny v7.3 anti-shell teaching-quality validator")
    parser.add_argument("target", help="课件目录、course_id 或 community/examples 下的目录名")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    args = parser.parse_args()

    course_dir = locate_course(args.target)
    report = validate_course(course_dir)
    errors = [i for i in report["issues"] if i["level"] == "error"]
    warns = [i for i in report["issues"] if i["level"] == "warn"]
    report["error_count"] = len(errors)
    report["warn_count"] = len(warns)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"TeachAny Teaching Quality Gate v7.3: {report['course']}")
        print(f"有效文本: {report.get('text_length', 0)} · section: {report.get('sections', 0)}")
        for item in report["issues"]:
            icon = "❌" if item["level"] == "error" else "⚠️"
            print(f"{icon} {item['message']}")
        if not errors:
            print("✅ 教学质量闸门通过")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
