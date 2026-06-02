#!/usr/bin/env python3
"""
中国史（国家课标）知识灌注：义教/普高课标原文 + 学业要求 + 教学提示 + 统编口径。

原则：
- 以树节点 curriculum_points 为权威表述（与教材、课标一致）
- 义教段落从 义务教育历史课程标准（2022年版）结构化抽取
- 普高节点以课标点为主，辅以义教对应专题的学业要求/教学提示
- 例题、易错点体现：唯物史观、史料实证、统一多民族国家、中华民族共同体
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]
JUNIOR_CURR = ROOT.parent / "books" / "课标-整理版" / "cn" / "middle" / "history.md"
SENIOR_CURR = ROOT.parent / "books" / "课标-整理版" / "cn" / "all" / "high_history_high_curriculum.md"

CN_HISTORY_VALUES_ANCIENT = {
    "guidance": "马克思主义史学指导下的中国古代史教学",
    "core_competencies": ["唯物史观", "时空观念", "史料实证", "历史解释", "家国情怀"],
    "key_themes": [
        "统一多民族国家的形成、巩固与发展",
        "中华民族共同体形成与发展",
        "中华优秀传统文化",
        "考古成果与文献记载互证",
    ],
    "pedagogy_notes": [
        "传说史料（如黄帝、炎帝）须标注文献/传说属性，不可与考古结论混同",
        "边疆、台湾、西藏、新疆、南海诸岛等表述须符合国家主权与统编教材口径",
        "评价历史人物与事件应置于当时历史条件，避免用现代标准简单苛责或美化",
    ],
}

CN_HISTORY_VALUES_MODERN = {
    "guidance": "中国近代史教学：反帝反封建与民族独立、人民解放主线",
    "core_competencies": ["唯物史观", "时空观念", "史料实证", "历史解释", "家国情怀"],
    "key_themes": [
        "半殖民地半封建社会形态与民族危机",
        "中国人民救亡图存与革命斗争",
        "中国共产党领导的新民主主义革命",
        "马克思主义中国化（毛泽东思想）",
    ],
    "pedagogy_notes": [
        "须坚持近代史是帝国主义侵略与中华民族反抗交织的历史叙事",
        "评价洋务、维新、革命等探索应置于当时历史条件，把握进步性与局限性",
        "抗日战争是世界反法西斯战争东方主战场，中国共产党是中流砥柱",
    ],
}

CN_HISTORY_VALUES_WORLD = {
    "guidance": "世界史教学：文明多元、区域互动，非西方中心论",
    "core_competencies": ["唯物史观", "时空观念", "史料实证", "历史解释", "家国情怀"],
    "key_themes": [
        "世界古代文明多元特征",
        "各区域文明交流互鉴",
        "中国是世界文明的重要组成部分",
    ],
    "pedagogy_notes": [
        "认识古希腊罗马等文明地位，同时避免殖民主义史观与西方中心论",
        "与中国古代史对照时，强调平等互鉴而非优劣等级",
    ],
}

CN_HISTORY_VALUES = CN_HISTORY_VALUES_ANCIENT  # 默认

# node_id → 义教课标「内容要求」小节号（1.1 史前 … 1.7 明清）
NODE_JUNIOR_SECTION: dict[str, str] = {
    "ancient-china-h": "overview_ancient",
    "hist-h-ancient-civ": "1.1",
    "hist-h-early-state": "1.2",
    "hist-h-pre-qin": "1.2",
    "hist-h-feudal-system": "1.3",
    "hist-h-qin-han-empire": "1.3",
    "hist-h-imperial-system": "1.5",
    "hist-h-wei-jin-tang": "1.4",
    "hist-h-song-yuan-ming-qing-h": "1.6",
    "hist-h-ancient-economy": "1.2",
    "hist-h-ancient-culture": "1.6",
    "hist-h-ancient-thought": "1.2",
    "hist-m-prehistoric": "1.1",
    "hist-m-early-civilizations": "1.1",
    "hist-m-xia-shang-zhou": "1.2",
    "hist-m-spring-autumn-warring": "1.2",
    "hist-m-qin-han-unification": "1.3",
    "hist-m-imperial-unification": "1.3",
    "hist-m-three-kingdoms-sui-tang": "1.4",
    "hist-m-tang-song-prosperity": "1.5",
    "hist-m-song-yuan-ming-qing": "1.6",
    "hist-m-ming-qing-decline": "1.7",
    "hist-m-ancient-culture": "1.6",
}

SENIOR_CURRICULUM_LABEL = "普通高中历史课程标准（2017年版2020年修订）"
JUNIOR_CURRICULUM_LABEL = "义务教育历史课程标准（2022年版）"


@dataclass
class ParsedJuniorHistory:
    ancient_overview: str
    modern_overview: str
    world_overview: str
    sections: dict[str, str]
    academic_requirements_ancient: list[str]
    teaching_prompts_ancient: list[str]
    teaching_prompts_world: list[str]


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clean_para(p: str, max_len: int = 900) -> str:
    p = re.sub(r"\s+", " ", p).strip()
    if not p or "万史" in p[:80] or "北京1大学" in p[:60]:
        return ""
    if p.startswith("# 04."):
        return ""
    return p[:max_len]


def _is_bad_excerpt(text: str) -> bool:
    if not text or len(text.strip()) < 12:
        return True
    if "## 第" in text[:30] or "万史" in text:
        return True
    if len(text) > 600 and "课程标准" in text[:200] and "修订原则" in text:
        return True
    return False


def parse_junior_history_md(text: str) -> ParsedJuniorHistory:
    """从义教历史课标 MD 抽取中国古代史总述、1.1–1.7 与学业要求/教学提示。"""
    ancient_overview = ""
    m = re.search(
        r"\(一\)\s*中国古代史\s*(.+?)(?=\(二\)|1\.\s*ABBR|1\.\s*1\s|四、课程内容\s*\|)",
        text,
        re.S,
    )
    if m:
        ancient_overview = _clean_para(m.group(1), 2000)

    sections: dict[str, str] = {}
    if ancient_overview:
        sections["overview_ancient"] = ancient_overview

    ancient_block = ""
    m_ab = re.search(r"\(一\)\s*中国古代史([\s\S]*?)(?=\(二\)\s*中国近代史)", text)
    if m_ab:
        ancient_block = m_ab.group(1)
    for m in re.finditer(
        r"(?:^|\n)(\d+)\.\s*(\d+)\s+([^\n]+)\n([\s\S]*?)(?=\n\d+\.\s*\d+\s+|\n2\.\s*学业要求|\Z)",
        ancient_block,
    ):
        major, minor, title, body = m.group(1), m.group(2), m.group(3), m.group(4)
        if major != "1":
            continue
        key = f"ancient_{major}.{minor}"
        block = _clean_para(f"{title}：{body}", 2500)
        if block:
            sections[key] = block
            sections[f"{major}.{minor}"] = block  # 兼容 NODE 映射

    academic: list[str] = []
    m_ar = re.search(
        r"中国古代史[\s\S]*?2\.\s*学业要求\s*([\s\S]*?)(?=3\.\s*教学提示|\(二\))",
        text,
    )
    if m_ar:
        chunk = m_ar.group(1)
        for line in re.split(r"\n+", chunk):
            line = _clean_para(line, 500)
            if line and re.match(r"2\.\d", line) or "唯物史观" in line or "能够" in line:
                academic.append(line)

    teaching: list[str] = []
    m_tp = re.search(
        r"3\.\s*教学提示\s*([\s\S]*?)(?=\(二\)\s*中国近代史|学生在学习中国近代史)",
        text,
    )
    if m_tp:
        chunk = m_tp.group(1)
        for para in re.split(r"\n{2,}|\n(?=[”\"+])", chunk):
            line = _clean_para(para, 600)
            if len(line) > 40 and "教学" in line or "统一多民族" in line or "史料" in line:
                teaching.append(line)
        if not teaching:
            for line in re.split(r"\n+", chunk):
                line = _clean_para(line, 500)
                if len(line) > 50:
                    teaching.append(line)

    modern_overview = ""
    m2 = re.search(
        r"\(二\)\s*中国近代史\s*(.+?)(?=四、课程内容\s*\|\s*\n1\.\s*内容要求|\(三\))",
        text,
        re.S,
    )
    if m2:
        modern_overview = _clean_para(m2.group(1), 2000)
        if modern_overview:
            sections["modern_china"] = modern_overview

    world_overview = ""
    m3 = re.search(r"\(四\)\s*世界古代史\s*(.+?)(?=\(五\)|\(六\)|世界近代史|\Z)", text, re.S)
    if m3:
        world_overview = _clean_para(m3.group(1), 2000)
        if world_overview:
            sections["world_ancient"] = world_overview

    world_teaching: list[str] = []
    m_wt = re.search(
        r"世界古代史的学习内容[\s\S]*?3\.\s*教学提示\s*([\s\S]*?)(?=学生在学习世界古代史|\(五\))",
        text,
    )
    if m_wt:
        for para in re.split(r"\n{2,}", m_wt.group(1)):
            line = _clean_para(para, 500)
            if len(line) > 40:
                world_teaching.append(line)

    return ParsedJuniorHistory(
        ancient_overview=ancient_overview,
        modern_overview=modern_overview,
        world_overview=world_overview,
        sections=sections,
        academic_requirements_ancient=academic[:6],
        teaching_prompts_ancient=teaching[:8],
        teaching_prompts_world=world_teaching[:6],
    )


def load_junior_parser() -> Optional[ParsedJuniorHistory]:
    if not JUNIOR_CURR.is_file():
        return None
    return parse_junior_history_md(JUNIOR_CURR.read_text(encoding="utf-8", errors="replace"))


def _domain_track(domain_id: str, node_id: str) -> str:
    dom = domain_id or ""
    if "world" in dom and "war" not in node_id:
        return "world"
    if "classical-civ" in node_id or "medieval-h" in node_id or "ancient-civ-h" in node_id:
        return "world"
    if "modern" in dom or "china-modern" in dom or "new-china" in dom:
        return "modern"
    if any(
        x in node_id
        for x in (
            "opium",
            "revolution",
            "cold-war",
            "prc",
            "reform",
            "marxism",
            "democracy",
            "industrial-rev",
            "bourgeois",
            "colonial",
            "globalization",
            "enlightenment",
            "renaissance",
            "ww",
            "war",
        )
    ):
        return "modern"
    if "cold-war" in node_id or "world-war" in node_id or "ww2" in node_id:
        return "modern"
    return "ancient"


def section_for_node(node_id: str, stage: str | None, domain_id: str = "") -> str:
    track = _domain_track(domain_id, node_id)
    if track == "world":
        return "world_ancient"
    if track == "modern":
        return "modern_china"
    if node_id in NODE_JUNIOR_SECTION:
        return NODE_JUNIOR_SECTION[node_id]
    if node_id.startswith("hist-h-"):
        if "ancient-civ" in node_id or "early-state" in node_id:
            return "1.1" if "ancient-civ" in node_id else "1.2"
        if "pre-qin" in node_id or "feudal" in node_id or "qin-han" in node_id:
            return "1.3"
        if "wei-jin" in node_id or "imperial" in node_id:
            return "1.4"
        if "song" in node_id:
            return "1.6"
    if node_id.startswith("hist-m-"):
        return NODE_JUNIOR_SECTION.get(node_id, "1.1")
    return "overview_ancient"


def build_cn_exercises(name: str, cps: list[str], track: str = "ancient") -> list[dict[str, Any]]:
    if not cps:
        return []
    cp0 = _clean_text(cps[0], 200)
    if track == "modern":
        return [
            {
                "id": "q-cp-1",
                "stem": f"围绕「{name}」：{cp0} 请用 1—2 个史实例说明其历史意义与局限。",
                "answer": "须置于半殖民地半封建社会条件下分析，体现民族独立与人民解放主线。",
                "type": "short_answer",
                "source": "cn-curriculum#modern",
            },
            {
                "id": "q-cp-2",
                "stem": "绘制简要时间轴，标出本课核心事件，并说明其与前后阶段的关系。",
                "answer": "时间轴应准确、有因果说明，避免孤立罗列年份。",
                "type": "short_answer",
                "source": "cn-curriculum#modern",
            },
        ]
    if track == "world":
        return [
            {
                "id": "q-cp-1",
                "stem": f"说明「{name}」在文明多元格局中的位置：{cp0}",
                "answer": "须体现区域文明特征与交流，避免西方中心论或简单优劣评判。",
                "type": "short_answer",
                "source": "cn-curriculum#world",
            },
        ]
    # ancient
    q2 = []
    if len(cps) > 1:
        q2.append(
            {
                "id": "q-cp-2",
                "stem": f"用「证据链」说明：{_clean_text(cps[1], 120)}",
                "answer": "至少列出考古、文献、制度三类证据中的两类并互证。",
                "type": "short_answer",
                "source": "cn-curriculum#ancient",
            }
        )
    return [
        {
            "id": "q-cp-1",
            "stem": f"课标要求：{cp0} 请各举一条考古与一条文献（或制度）证据加以说明。",
            "answer": "区分史料类型；传说需标注文献/传说属性；体现统一多民族国家形成与发展线索。",
            "type": "short_answer",
            "source": "cn-curriculum#ancient",
        },
        *q2,
    ]


def _clean_text(text: str, max_len: int) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())[:max_len]


def normalize_history_excerpts(data: dict[str, Any]) -> list[dict[str, Any]]:
    """课标点 + 少量短摘录，剔除 OCR 与超长 legacy。"""
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for i, cp in enumerate(data.get("curriculum_points") or []):
        t = str(cp).strip()
        if t and not _is_bad_excerpt(t) and t not in seen:
            seen.add(t)
            out.append(
                {
                    "id": f"cp-{i + 1}",
                    "text": t[:500],
                    "source": "国家课标·内容要求",
                    "type": "curriculum_point",
                }
            )
    legacy_slots = 4 - len(out)
    for ex in data.get("excerpts") or []:
        if legacy_slots <= 0:
            break
        t = str(ex.get("text", "")) if isinstance(ex, dict) else str(ex)
        if _is_bad_excerpt(t) or t in seen or len(t) > 600:
            continue
        seen.add(t)
        item = dict(ex) if isinstance(ex, dict) else {"text": t}
        item["text"] = t[:500]
        item.setdefault("source", "课标摘录")
        out.append(item)
        legacy_slots -= 1
    return out[:6]


def build_cn_errors(name: str, track: str = "ancient") -> list[dict[str, Any]]:
    if track == "world":
        return [
            {
                "id": "err-1",
                "description": "以西方中心论贬低或拔高某一文明，忽视课标强调的世界古代文明多元特征。",
                "type": "values",
                "source": "cn-curriculum-pedagogy",
            },
            {
                "id": "err-2",
                "description": "只记希腊罗马典故，未能在时空框架中说明其制度成就与局限。",
                "type": "conceptual",
                "source": "cn-curriculum-pedagogy",
            },
        ]
    if track == "modern":
        return [
            {
                "id": "err-1",
                "description": "淡化列强侵略与民族危机，不符合中国近代史课标主线。",
                "type": "values",
                "source": "cn-curriculum-pedagogy",
            },
            {
                "id": "err-2",
                "description": "对洋务、维新、革命等探索只作简单褒贬，未分析当时条件与历史局限。",
                "type": "conceptual",
                "source": "cn-curriculum-pedagogy",
            },
        ]
    return [
        {
            "id": "err-1",
            "description": (
                "只记帝王、朝代年表，未按课标要求用考古与文献史料互证，"
                "未体现统一多民族国家形成与发展线索。"
            ),
            "type": "evidence",
            "source": "cn-curriculum-pedagogy",
        },
        {
            "id": "err-2",
            "description": (
                "将黄帝、炎帝等传说叙事直接当作信史，或忽视课标对「神话传说所蕴含历史信息」的限定表述。"
            ),
            "type": "conceptual",
            "source": "cn-curriculum-pedagogy",
        },
        {
            "id": "err-3",
            "description": (
                "割裂中原与边疆、汉族与少数民族的历史联系，忽视课标强调的交往交流交融与中华民族共同体。"
            ),
            "type": "values",
            "source": "cn-curriculum-pedagogy",
        },
    ]


def enrich_kp_satellite(
    data: dict[str, Any], junior: Optional[ParsedJuniorHistory], *, force: bool = False
) -> bool:
    """写入/覆盖中国史课标口径字段；清理不良摘录。"""
    node_id = data.get("kp_id") or data.get("node_id") or ""
    stage = data.get("stage") or ("high" if node_id.startswith("hist-h-") else "middle")
    curriculum = data.get("curriculum") or "cn"
    if curriculum != "cn" or data.get("subject") != "history":
        return False

    changed = False
    cps = [str(x).strip() for x in (data.get("curriculum_points") or []) if str(x).strip()]
    name = data.get("name") or node_id

    excerpts = normalize_history_excerpts(data)
    if excerpts != data.get("excerpts"):
        data["excerpts"] = excerpts
        changed = True

    domain_id = data.get("domain_id") or ""
    track = _domain_track(domain_id, node_id)
    values = {
        "ancient": CN_HISTORY_VALUES_ANCIENT,
        "modern": CN_HISTORY_VALUES_MODERN,
        "world": CN_HISTORY_VALUES_WORLD,
    }[track]

    sec_key = section_for_node(node_id, stage, domain_id)
    section_text = ""
    if junior:
        section_text = junior.sections.get(sec_key) or ""
        if sec_key == "overview_ancient":
            section_text = junior.ancient_overview or section_text

    is_senior = stage == "high" or node_id.startswith("hist-h-")
    curr_label = SENIOR_CURRICULUM_LABEL if is_senior else JUNIOR_CURRICULUM_LABEL
    if is_senior and cps:
        curr_label = f"{SENIOR_CURRICULUM_LABEL}（内容要求见树节点课标点）"

    align = {
        "ancient": "与统编《中国历史》一致：考古实证、统一多民族国家、交往交流交融",
        "modern": "与统编《中国历史》中国近代史编年体例一致：反帝反封建、民族独立与人民解放",
        "world": "与统编《世界历史》一致：文明多元、区域互动，坚持唯物史观",
    }[track]

    teaching_g = junior.teaching_prompts_ancient[:5] if junior and track == "ancient" else []
    if junior and track == "world":
        teaching_g = junior.teaching_prompts_world[:5]

    tc = {
        "cn_schema_version": "1.0",
        "curriculum_standard": curr_label,
        "values_framework": values,
        "history_track": track,
        "junior_section_ref": sec_key if junior else None,
        "section_excerpt": section_text[:1200] if section_text else None,
        "academic_requirements": (junior.academic_requirements_ancient[:5] if junior and track == "ancient" else []),
        "teaching_guidance": teaching_g,
        "textbook_alignment": align,
        "cn_injected_at": _utc(),
    }
    if data.get("textbook_content") != tc:
        data["textbook_content"] = tc
        changed = True

    sup = data.setdefault("supplements", {})
    sup["cn_curriculum"] = {
        "standard": curr_label,
        "section": sec_key,
        "core_literacy": values.get("core_competencies", []),
    }
    if "openstax_or_curriculum" in sup:
        del sup["openstax_or_curriculum"]
        changed = True

    ex_new = build_cn_exercises(name, cps, track)
    err_new = build_cn_errors(name, track)
    if ex_new != data.get("exercises"):
        data["exercises"] = ex_new
        changed = True
    if err_new != data.get("errors"):
        data["errors"] = err_new
        changed = True

    meta = data.setdefault("_meta", {})
    meta["cn_curriculum_inject_at"] = _utc()
    meta["sources"] = list(dict.fromkeys((meta.get("sources") or []) + ["cn-curriculum-inject"]))
    return changed or force
