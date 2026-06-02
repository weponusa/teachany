#!/usr/bin/env python3
"""中国课标（cn）卫星统一 schema 与数理化生等学科灌注。"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

CN_SCHEMA_VERSION = "1.0"
JUNIOR_LABEL = "义务教育课程标准（2022年版）"
SENIOR_LABEL = "普通高中课程标准（2017年版2020年修订）"

GENERIC_EXERCISE_RE = re.compile(
    r"结合课标要求，说明|【课标探究】|学习数学的方法|数学来源于生活"
)
GENERIC_ERROR_RE = re.compile(r"只记年代与名词|只记帝王|西方中心论")

SUBJECT_VALUES: dict[str, dict[str, Any]] = {
    "math": {
        "guidance": "义务教育/普通高中数学课程标准",
        "core_competencies": ["数学抽象", "逻辑推理", "数学建模", "数学运算", "直观想象", "数据分析"],
        "key_themes": ["数与代数", "图形与几何", "统计与概率", "综合与实践"],
    },
    "physics": {
        "guidance": "物理课程标准",
        "core_competencies": ["物理观念", "科学思维", "科学探究", "科学态度与责任"],
        "key_themes": ["物质与能量", "运动与相互作用", "实验探究"],
    },
    "chemistry": {
        "guidance": "化学课程标准",
        "core_competencies": ["宏观辨识", "变化观念", "证据推理", "科学探究", "科学态度"],
        "key_themes": ["物质结构", "化学反应", "化学与生活"],
    },
    "biology": {
        "guidance": "生物学课程标准",
        "core_competencies": ["生命观念", "科学思维", "科学探究", "社会责任"],
        "key_themes": ["结构与功能", "物质与能量", "稳态与调节", "进化与适应"],
    },
    "chinese": {
        "guidance": "语文课程标准",
        "core_competencies": ["语言建构与运用", "思维发展与提升", "审美鉴赏与创造", "文化传承与理解"],
        "key_themes": ["识字与写字", "阅读", "写作", "口语交际"],
    },
    "english": {
        "guidance": "英语课程标准",
        "core_competencies": ["语言能力", "文化意识", "思维品质", "学习能力"],
        "key_themes": ["听", "说", "读", "写", "看"],
    },
    "geography": {
        "guidance": "地理课程标准",
        "core_competencies": ["人地协调观", "综合思维", "区域认知", "地理实践力"],
        "key_themes": ["自然地理", "人文地理", "区域地理"],
    },
    "science": {
        "guidance": "义务教育科学课程标准",
        "core_competencies": ["科学观念", "科学思维", "探究实践", "态度责任"],
        "key_themes": ["物质科学", "生命科学", "地球与宇宙科学", "技术与工程"],
    },
    "info-tech": {
        "guidance": "信息科技课程标准",
        "core_competencies": ["信息意识", "计算思维", "数字化学习与创新", "信息社会责任"],
        "key_themes": ["数据", "算法", "网络", "信息安全"],
    },
}


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clean(text: str, max_len: int = 800) -> str:
    t = re.sub(r"\s+", " ", (text or "").strip())
    return t[:max_len]


def extract_md_sections(raw: str) -> tuple[list[str], list[str], list[str]]:
    """从 curriculum_md_raw 抽 内容要求/学业要求/教学提示。"""
    cps: list[str] = []
    academic: list[str] = []
    teaching: list[str] = []
    if not raw:
        return cps, academic, teaching
    for m in re.finditer(r">\s*([^>\n]{20,400})", raw):
        line = _clean(m.group(1), 400)
        if line and line not in cps:
            cps.append(line)
    for block, key in (
        (r"###\s*1\.3\s*教学提示\s*([\s\S]*?)(?=###|##\s*二、|---|\Z)", teaching),
        (r"###\s*1\.2\s*学业要求\s*([\s\S]*?)(?=###|##\s*二、|---|\Z)", academic),
    ):
        m = re.search(block, raw)
        if m:
            for para in re.split(r"\n{2,}|>\s*", m.group(1)):
                line = _clean(para, 500)
                if len(line) > 30:
                    key.append(line)
    return cps[:6], academic[:4], teaching[:4]


def exercises_from_md(raw: str, max_n: int = 2) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in re.finditer(r"例\d+|【课标附录\s*例\d+[^】]*】", raw):
        start = m.start()
        chunk = raw[start : start + 600]
        stem = _clean(re.sub(r"^#+|\*+", "", chunk.split("\n")[0]), 200)
        if len(stem) > 25:
            out.append(
                {
                    "id": f"md-ex-{len(out) + 1}",
                    "stem": stem,
                    "answer": "见课标附录说明与教材例题解析。",
                    "type": "short_answer",
                    "source": "cn-curriculum#课标附录",
                }
            )
        if len(out) >= max_n:
            break
    return out


def build_subject_exercises(subject: str, name: str, cps: list[str]) -> list[dict[str, Any]]:
    if not cps:
        return []
    verbs = "理解" if subject in ("chinese", "english") else "掌握"
    return [
        {
            "id": "q-cp-1",
            "stem": _clean(f"依据课标「{name}」：{cps[0]}", 220)
            + (" 请结合实例说明。" if subject == "math" else " 请简要阐述并举例。"),
            "answer": f"应答覆盖课标要点，体现{verbs}与应用。",
            "type": "short_answer",
            "source": f"cn-curriculum#{subject}",
        },
        *(
            [
                {
                    "id": "q-cp-2",
                    "stem": _clean(f"比较说明：{cps[1]}", 200),
                    "answer": "需写出关键概念、过程或方法，避免只背结论。",
                    "type": "short_answer",
                    "source": f"cn-curriculum#{subject}",
                }
            ]
            if len(cps) > 1
            else []
        ),
    ]


def build_subject_errors(subject: str) -> list[dict[str, Any]]:
    common = {
        "math": ("套公式不求理解", "忽视定义域、单位与图形条件"),
        "physics": ("只背公式不做受力/过程分析", "混淆现象描述与物理规律"),
        "chemistry": ("只记方程式不说明反应条件与类型", "忽视实验操作与安全意识"),
        "biology": ("把名词当结论，不结合结构与功能", "忽视实验证据与变量控制"),
        "chinese": ("只记答案要点不结合文本证据", "阅读脱离语境与作者意图"),
        "english": ("只记单词不放在语篇中理解", "听说读写割裂练习"),
        "geography": ("只记地名不读图、不分析人地关系", "忽视尺度与区域差异"),
        "science": ("把结论当记忆，不经历探究过程", "忽视控制变量与证据"),
        "info-tech": ("只记操作步骤不理解原理", "忽视信息安全与伦理"),
    }
    a, b = common.get(subject, ("只记结论", "忽视课标要求的过程与证据"))
    return [
        {"id": "err-1", "description": a, "type": "conceptual", "source": "cn-curriculum"},
        {"id": "err-2", "description": b, "type": "evidence", "source": "cn-curriculum"},
    ]


def is_generic_exercise(exercises: list[Any]) -> bool:
    if not exercises:
        return True
    blob = json.dumps(exercises, ensure_ascii=False)
    return bool(GENERIC_EXERCISE_RE.search(blob))


def normalize_excerpts(data: dict[str, Any], max_items: int = 6, max_each: int = 500) -> list[dict[str, Any]]:
    """课标点优先，legacy 摘录限长限条。"""
    from cn_history_curriculum import _is_bad_excerpt  # noqa: WPS433

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for i, cp in enumerate(data.get("curriculum_points") or []):
        t = str(cp).strip()
        if t and not _is_bad_excerpt(t) and t not in seen:
            seen.add(t)
            out.append(
                {
                    "id": f"cp-{i + 1}",
                    "text": t[:max_each],
                    "source": "国家课标·内容要求",
                    "type": "curriculum_point",
                }
            )
    for ex in data.get("excerpts") or []:
        if len(out) >= max_items:
            break
        t = str(ex.get("text", ex) if isinstance(ex, dict) else ex)
        if _is_bad_excerpt(t) or t in seen:
            continue
        seen.add(t)
        item = dict(ex) if isinstance(ex, dict) else {"text": t}
        item["text"] = t[:max_each]
        item.setdefault("source", "课标摘录")
        out.append(item)
    return out[:max_items]


def enrich_cn_subject_satellite(data: dict[str, Any], *, force: bool = False) -> bool:
    if (data.get("curriculum") or "cn") != "cn":
        return False
    if data.get("subject") == "history":
        return False

    subject = data.get("subject") or "other"
    if subject not in SUBJECT_VALUES and subject != "other":
        return False

    changed = False
    name = data.get("name") or data.get("kp_id") or ""
    stage = data.get("stage") or "middle"
    cps = [str(x).strip() for x in (data.get("curriculum_points") or []) if str(x).strip()]

    raw = (data.get("supplements") or {}).get("curriculum_md_raw") or ""
    md_cps, md_acad, md_teach = extract_md_sections(raw)

    new_excerpts = normalize_excerpts(data)
    if new_excerpts != data.get("excerpts"):
        data["excerpts"] = new_excerpts
        changed = True

    values = SUBJECT_VALUES.get(subject, SUBJECT_VALUES.get("science", {}))
    label = SENIOR_LABEL if stage in ("high", "dp", "ap") else JUNIOR_LABEL
    prev_tc = data.get("textbook_content") if isinstance(data.get("textbook_content"), dict) else {}
    deep = prev_tc.get("deep_snippets") if isinstance(prev_tc, dict) else None
    if not deep and isinstance(data.get("textbook_content"), dict):
        deep = data["textbook_content"].get("deep_snippets")

    tc: dict[str, Any] = {
        "cn_schema_version": CN_SCHEMA_VERSION,
        "curriculum_standard": label,
        "subject": subject,
        "values_framework": values,
        "teaching_guidance": md_teach[:4],
        "academic_requirements": md_acad[:4],
        "textbook_alignment": f"与统编{values.get('guidance', '教材')}及课标内容要求一致",
        "cn_injected_at": _utc(),
    }
    if deep:
        tc["deep_snippets"] = deep
        tc["deep_source"] = prev_tc.get("deep_source") or "subject-pack"

    if tc != data.get("textbook_content"):
        data["textbook_content"] = tc
        changed = True

    sup = data.setdefault("supplements", {})
    sup["cn_curriculum"] = {
        "standard": label,
        "subject": subject,
        "core_literacy": values.get("core_competencies", []),
    }

    ex = data.get("exercises") or []
    if force or is_generic_exercise(ex):
        ex_new = exercises_from_md(raw) or build_subject_exercises(subject, name, cps or md_cps)
        if ex_new:
            data["exercises"] = ex_new[:3]
            changed = True

    err = data.get("errors") or []
    if force or not err or GENERIC_ERROR_RE.search(json.dumps(err, ensure_ascii=False)):
        data["errors"] = build_subject_errors(subject)
        changed = True

    meta = data.setdefault("_meta", {})
    meta["cn_curriculum_inject_at"] = _utc()
    meta["sources"] = list(dict.fromkeys((meta.get("sources") or []) + ["cn-curriculum-common"]))
    return changed or force
