#!/usr/bin/env python3
"""Build Knowledge Context Pack (KCP) for TeachAny courseware generation."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
NODE_INDEX_PATH = ROOT / "data" / "node-index.json"
KP_INDEX_PATH = ROOT / "data" / "kp" / "_index.json"
KP_MD_DIRS = [
    ROOT / "data" / "kp-md",
    ROOT / "skill" / "data" / "kp-md",
]

_PLACEHOLDER_RE = re.compile(r"\[待补充\]")


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_node_index() -> Optional[Dict[str, Any]]:
    if not NODE_INDEX_PATH.exists():
        return None
    try:
        data = json.loads(NODE_INDEX_PATH.read_text(encoding="utf-8"))
        if isinstance(data.get("nodes"), dict):
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return None


def load_kp_index() -> Dict[str, str]:
    if not KP_INDEX_PATH.exists():
        return {}
    try:
        data = json.loads(KP_INDEX_PATH.read_text(encoding="utf-8"))
        kps = data.get("kps") or {}
        if isinstance(kps, dict):
            return {str(k): str(v) for k, v in kps.items()}
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def load_kp_satellite(node_id: str) -> Optional[Dict[str, Any]]:
    rel = load_kp_index().get(node_id)
    if rel:
        path = ROOT / rel
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    # fallback: scan data/kp
    for path in (ROOT / "data" / "kp").rglob(f"{node_id}.json"):
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    for path in (ROOT / "data" / "kp").rglob(f"kp-{node_id}.json"):
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    return None


def resolve_md_path(node_id: str, node_rec: Optional[Dict[str, Any]] = None) -> Optional[Path]:
    candidates: List[Path] = []
    if node_rec and node_rec.get("md_path"):
        candidates.append(ROOT / str(node_rec["md_path"]))
    for base in KP_MD_DIRS:
        candidates.append(base / f"kp-{node_id}.md")
        candidates.append(base / f"{node_id}.md")
    for path in candidates:
        if path.is_file():
            return path
    return None


def extract_md_section(md_text: str, section_title: str, max_chars: int = 4000) -> str:
    pattern = rf"^##\s+{re.escape(section_title)}[^\n]*\n(.*?)(?=^##\s|\Z)"
    match = re.search(pattern, md_text, re.M | re.S)
    if not match:
        return ""
    text = match.group(1).strip()
    if _PLACEHOLDER_RE.search(text):
        return ""
    return text[:max_chars]


def _clean_text(text: str, max_len: int = 2000) -> str:
    text = (text or "").strip()
    if not text or _PLACEHOLDER_RE.search(text):
        return ""
    return text[:max_len]


def excerpts_from_satellite(sat: Dict[str, Any], max_items: int = 8) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    seen: set[str] = set()

    def add(item_id: str, text: str, source: str) -> None:
        text = _clean_text(text, 1500)
        if not text or text in seen:
            return
        seen.add(text)
        items.append({"id": item_id, "text": text, "source": source})

    for i, pt in enumerate(sat.get("curriculum_points") or []):
        add(f"cp-{i + 1}", str(pt), "kp-json#curriculum_points")

    for i, ex in enumerate(sat.get("excerpts") or []):
        if isinstance(ex, dict):
            text = ex.get("text") or ""
            src = ex.get("source") or "kp-json#excerpts"
            eid = ex.get("id") or f"ex-{i + 1}"
        else:
            text = str(ex)
            src = "kp-json#excerpts"
            eid = f"ex-{i + 1}"
        add(str(eid), text, src)

    supplements = sat.get("supplements") or {}
    raw = supplements.get("curriculum_md_raw") or ""
    if raw:
        # 取「课标原文」或前 800 字作为一条汇总
        m = re.search(r"##\s+一、课标原文\s*\n(.*?)(?=##\s+|\Z)", raw, re.S)
        chunk = (m.group(1) if m else raw)[:800].strip()
        add("curriculum-md-raw", chunk, "kp-json#supplements.curriculum_md_raw")

    return items[:max_items]


def exercises_from_satellite(sat: Dict[str, Any], max_items: int = 6) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for i, ex in enumerate(sat.get("exercises") or []):
        if not isinstance(ex, dict):
            continue
        stem = _clean_text(ex.get("stem") or ex.get("question") or "", 1200)
        if not stem:
            continue
        answer = _clean_text(
            ex.get("answer")
            or ex.get("solution")
            or ex.get("analysis")
            or "",
            800,
        )
        out.append(
            {
                "id": str(ex.get("id") or f"q-{i + 1}"),
                "stem": stem,
                "answer": answer or "(见解析要点)",
                "source": "kp-json#exercises",
            }
        )
        if len(out) >= max_items:
            break
    return out


def errors_from_satellite(sat: Dict[str, Any], max_items: int = 3) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for i, err in enumerate(sat.get("errors") or []):
        if isinstance(err, dict):
            text = _clean_text(
                err.get("description") or err.get("text") or err.get("diagnosis") or "",
                600,
            )
            eid = str(err.get("id") or f"err-{i + 1}")
        else:
            text = _clean_text(str(err), 600)
            eid = f"err-{i + 1}"
        if not text:
            continue
        out.append({"id": eid, "text": text, "source": "kp-json#errors"})
        if len(out) >= max_items:
            break
    return out


def textbook_refs_from_satellite(sat: Dict[str, Any]) -> List[Dict[str, str]]:
    supplements = sat.get("supplements") or {}
    refs: List[Dict[str, str]] = []
    summary = supplements.get("textbook_summary") or sat.get("textbook_content")
    if isinstance(summary, str) and summary.strip():
        refs.append(
            {
                "book": "textbook_summary",
                "chapter": "",
                "path": "",
                "note": _clean_text(summary, 600),
                "source": "kp-json#textbook_summary",
            }
        )
    elif isinstance(summary, dict):
        for key, val in list(summary.items())[:3]:
            if val:
                refs.append(
                    {
                        "book": key,
                        "chapter": "",
                        "path": str(val)[:200],
                        "source": "kp-json#textbook_content",
                    }
                )
    return refs


def find_tree_node_record(node_id: str) -> Optional[Dict[str, Any]]:
    """从 data/trees/**/*.json 查找节点（node-index 未收录时的回退）。"""
    trees_root = ROOT / "data" / "trees"
    if not trees_root.is_dir():
        return None
    for tree_path in trees_root.rglob("*.json"):
        try:
            data = json.loads(tree_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for domain in data.get("domains") or []:
            for node in domain.get("nodes") or []:
                if node.get("id") == node_id:
                    return {
                        "node_id": node_id,
                        "name_zh": node.get("name"),
                        "grade": node.get("grade"),
                        "subject": data.get("subject") or tree_path.stem,
                        "curriculum": "cn" if "cn" in tree_path.parts else None,
                        "stage": tree_path.parent.name if tree_path.parent else None,
                        "tree_path": str(tree_path.relative_to(ROOT)),
                        "curriculum_points": node.get("curriculum_points") or [],
                        "prerequisites": node.get("prerequisites") or [],
                        "extends": node.get("extends") or [],
                        "courses": node.get("courses") or [],
                    }
    return None


def enrich_from_tree_record(
    kcp: Dict[str, Any],
    tree_rec: Dict[str, Any],
    *,
    max_excerpts: int = 8,
) -> None:
    if "tree-json" not in (kcp.get("sources") or []):
        kcp.setdefault("sources", []).append("tree-json")
    seen = {x["text"] for x in kcp.get("curriculum_excerpts") or []}
    for i, pt in enumerate(tree_rec.get("curriculum_points") or []):
        text = _clean_text(str(pt), 1500)
        if not text or text in seen:
            continue
        seen.add(text)
        kcp.setdefault("curriculum_excerpts", []).append(
            {
                "id": f"tree-cp-{i + 1}",
                "text": text,
                "source": f"tree-json#{tree_rec.get('tree_path', '')}",
            }
        )
    if not kcp.get("prerequisites"):
        kcp["prerequisites"] = list(tree_rec.get("prerequisites") or [])
    if not kcp.get("extends"):
        kcp["extends"] = list(tree_rec.get("extends") or [])
    if tree_rec.get("name_zh"):
        kcp["name_zh"] = tree_rec["name_zh"]
    if tree_rec.get("subject"):
        kcp["subject"] = tree_rec["subject"]
    if tree_rec.get("stage"):
        kcp["stage"] = tree_rec["stage"]
    kcp["curriculum_excerpts"] = (kcp.get("curriculum_excerpts") or [])[:max_excerpts]


def _is_usable_excerpt(text: str) -> bool:
    """过滤 OCR 页 dump、损坏课标 PDF 摘录等不宜进 KCP 的文本。"""
    if not text or len(text.strip()) < 12:
        return False
    head = text.strip()[:40]
    if head.startswith("## 第") or head.startswith("# 第"):
        return False
    if "万史" in text and "课程标准" in text:
        return False
    if len(text) > 420 and text.count("\n") >= 4:
        return False
    return True


def merge_child_kcp_excerpts(
    kcp: Dict[str, Any],
    child_node_ids: List[str],
    *,
    max_pull: int = 4,
    max_excerpts: int = 10,
) -> None:
    """总览课：从子节点卫星合并少量课标摘录。"""
    if "child-kp" not in (kcp.get("sources") or []):
        kcp.setdefault("sources", []).append("child-kp")
    seen = {x["text"] for x in kcp.get("curriculum_excerpts") or []}
    for cid in child_node_ids[:max_pull]:
        child = build_kcp(
            cid, max_excerpts=3, max_exercises=2, max_errors=1, merge_children=False
        )
        for item in child.get("curriculum_excerpts") or []:
            text = item.get("text", "")
            if text and _is_usable_excerpt(text) and text not in seen:
                seen.add(text)
                kcp.setdefault("curriculum_excerpts", []).append(
                    {
                        "id": f"from-{cid}-{item.get('id', 'ex')}",
                        "text": text,
                        "source": f"child-kp#{cid}",
                    }
                )
        for item in child.get("exercises") or []:
            if len(kcp.get("exercises") or []) >= 2:
                break
            kcp.setdefault("exercises", []).append({**item, "source": f"child-kp#{cid}"})
    kcp["curriculum_excerpts"] = (kcp.get("curriculum_excerpts") or [])[:max_excerpts]


def assess_kcp_gaps(kcp: Dict[str, Any]) -> List[str]:
    gaps: List[str] = []
    if len(kcp.get("curriculum_excerpts") or []) < 2:
        gaps.append("curriculum_excerpts<2")
    if len(kcp.get("exercises") or []) < 1:
        gaps.append("exercises<1")
    if len(kcp.get("common_errors") or []) < 1:
        gaps.append("common_errors<1")
    return gaps


def build_kcp(
    node_id: str,
    *,
    topic: Optional[str] = None,
    subject: Optional[str] = None,
    max_excerpts: int = 8,
    max_exercises: int = 6,
    max_errors: int = 3,
    merge_children: bool = True,
) -> Dict[str, Any]:
    sources: List[str] = []
    node_index = load_node_index()
    node_rec = (node_index or {}).get("nodes", {}).get(node_id) if node_index else None

    satellite = load_kp_satellite(node_id)
    tree_rec = find_tree_node_record(node_id)
    if satellite:
        sources.append("kp-json")

    curriculum_excerpts: List[Dict[str, str]] = []
    if satellite:
        curriculum_excerpts.extend(excerpts_from_satellite(satellite, max_excerpts))

    md_path = resolve_md_path(node_id, node_rec)
    md_text = ""
    if md_path:
        sources.append("kp-md")
        md_text = md_path.read_text(encoding="utf-8", errors="replace")
        for section in ("课标原文", "课标要求", "核心概念", "教学目标"):
            chunk = extract_md_section(md_text, section, 2500)
            if chunk:
                curriculum_excerpts.append(
                    {
                        "id": f"md-{section}",
                        "text": chunk,
                        "source": f"kp-md#{section}",
                    }
                )

    exercises = exercises_from_satellite(satellite or {}, max_exercises)
    common_errors = errors_from_satellite(satellite or {}, max_errors)

    # MD 例题兜底（简单按题号分段）
    if md_text and len(exercises) < 1:
        md_ex_block = extract_md_section(md_text, "典型例题", 4000)
        if md_ex_block:
            parts = re.split(r"\n(?=\d+[\.\、]|\*\*例)", md_ex_block)
            for i, part in enumerate(parts[:max_exercises]):
                stem = _clean_text(part, 1200)
                if stem:
                    exercises.append(
                        {
                            "id": f"md-q-{i + 1}",
                            "stem": stem,
                            "answer": "(见 MD 典型例题)",
                            "source": "kp-md#典型例题",
                        }
                    )

    if md_text and len(common_errors) < 1:
        md_err_block = extract_md_section(md_text, "易错点", 2000)
        if md_err_block:
            for i, line in enumerate(md_err_block.splitlines()[:max_errors]):
                text = _clean_text(line.lstrip("-•* ").strip(), 400)
                if len(text) > 8:
                    common_errors.append(
                        {"id": f"md-err-{i + 1}", "text": text, "source": "kp-md#易错点"}
                    )

    kcp_stub: Dict[str, Any] = {
        "curriculum_excerpts": curriculum_excerpts,
        "exercises": exercises,
        "common_errors": common_errors,
        "sources": sources,
        "prerequisites": [],
        "extends": [],
    }
    if len(curriculum_excerpts) < 2 and tree_rec:
        enrich_from_tree_record(kcp_stub, tree_rec, max_excerpts=max_excerpts)
        curriculum_excerpts = kcp_stub["curriculum_excerpts"]
        sources = kcp_stub["sources"]

    child_merge_ids: List[str] = []
    if tree_rec:
        trees_data_path = ROOT / (tree_rec.get("tree_path") or "")
        if trees_data_path.is_file():
            try:
                td = json.loads(trees_data_path.read_text(encoding="utf-8"))
                for domain in td.get("domains") or []:
                    for n in domain.get("nodes") or []:
                        if n.get("id") != node_id and n.get("courses"):
                            child_merge_ids.append(n["id"])
            except (OSError, json.JSONDecodeError):
                pass
        if node_id == "ancient-china-h":
            child_merge_ids = [
                "hist-h-ancient-civ",
                "hist-h-early-state",
                "hist-h-imperial-system",
            ]
    if merge_children and child_merge_ids and len(curriculum_excerpts) < max_excerpts:
        merge_child_kcp_excerpts(
            kcp_stub,
            child_merge_ids,
            max_pull=3,
            max_excerpts=max_excerpts,
        )
        curriculum_excerpts = kcp_stub["curriculum_excerpts"]
        exercises = kcp_stub.get("exercises") or exercises
        sources = kcp_stub["sources"]

    if len(common_errors) < 1 and node_id == "ancient-china-h":
        common_errors.extend(
            [
                {
                    "id": "err-1",
                    "text": "只记朝代名称，不用制度/经济/思想证据解释历史变迁。",
                    "source": "overview-pedagogy",
                },
                {
                    "id": "err-2",
                    "text": "把传说时代与考古成果混为一谈，缺少证据强度区分。",
                    "source": "overview-pedagogy",
                },
            ]
        )

    name_zh = (
        (node_rec or {}).get("name_zh")
        or (tree_rec or {}).get("name_zh")
        or (satellite or {}).get("name")
        or topic
        or node_id
    )
    prerequisites = list((node_rec or {}).get("prereq_ids") or (tree_rec or {}).get("prerequisites") or [])
    extends = list((node_rec or {}).get("next_ids") or (tree_rec or {}).get("extends") or [])
    kcp: Dict[str, Any] = {
        "node_id": node_id,
        "topic": topic or name_zh,
        "name_zh": name_zh,
        "subject": (node_rec or {}).get("subject") or (satellite or {}).get("subject") or subject,
        "stage": (node_rec or {}).get("stage") or (satellite or {}).get("stage"),
        "curriculum": (node_rec or {}).get("curriculum") or (satellite or {}).get("curriculum"),
        "lookup_at": _utc_now(),
        "sources": sources,
        "curriculum_excerpts": curriculum_excerpts[:max_excerpts],
        "exercises": exercises[:max_exercises],
        "common_errors": common_errors[:max_errors],
        "prerequisites": prerequisites,
        "extends": extends,
        "textbook_refs": textbook_refs_from_satellite(satellite or {}),
        "md_path": str(md_path.relative_to(ROOT)) if md_path else None,
        "kp_json_path": load_kp_index().get(node_id),
        "fallback_used": False,
    }
    kcp["gaps"] = assess_kcp_gaps(kcp)
    return kcp


def emit_kcp_file(kcp: Dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(kcp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def print_kcp_human(kcp: Dict[str, Any]) -> None:
    print(f"# Knowledge Context Pack: {kcp.get('name_zh')} ({kcp.get('node_id')})")
    print(f"- sources: {', '.join(kcp.get('sources') or [])}")
    if kcp.get("md_path"):
        print(f"- md: {kcp['md_path']}")
    if kcp.get("kp_json_path"):
        print(f"- kp: {kcp['kp_json_path']}")
    if kcp.get("gaps"):
        print(f"- gaps: {', '.join(kcp['gaps'])}  ← Phase 1 可触发 web_search fallback")
    print()
    print("## 课标摘录")
    for item in kcp.get("curriculum_excerpts") or []:
        print(f"- [{item['id']}] {item['text'][:200]}{'…' if len(item['text']) > 200 else ''}")
    print()
    print("## 例题")
    for item in kcp.get("exercises") or []:
        print(f"- [{item['id']}] {item['stem'][:160]}…")
    print()
    print("## 易错点")
    for item in kcp.get("common_errors") or []:
        print(f"- [{item['id']}] {item['text'][:160]}")
