#!/usr/bin/env python3
"""
通用补缺脚本：
- 从 coverage_report.json 读取所有缺失 KP
- 根据 tree 文件路径自动匹配课标原文文件
- 用 LLM 从课标原文中提取/生成 excerpts
- 追加到对应 data/excerpts/*.json
"""
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "books" / "tools"))
from config import LLM_CONFIG
from openai import OpenAI

client = OpenAI(api_key=LLM_CONFIG["api_key"], base_url=LLM_CONFIG["base_url"])

BASE = Path(__file__).parent / "data"
TREES = BASE / "trees"
EXCERPTS = BASE / "excerpts"
BOOKS = Path(__file__).parent.parent / "books"
INTL_CURR = BOOKS / "国际课标"
CURATED = BOOKS / "课标-整理版"

# tree 文件 → 课标原文文件（多个，按优先级）
CURRICULUM_MAP = {
    # Cambridge
    "cambridge/al/further-math.json": [],  # 没有本地文件，纯 LLM 生成
    "cambridge/al/math.json": [
        CURATED / "cambridge/AS_A_Level/9709_Mathematics.md",
        INTL_CURR / "Cambridge/AS_A_Level/9709_Mathematics.md",
    ],
    "cambridge/al/physics.json": [
        CURATED / "cambridge/AS_A_Level/9702_Physics.md",
        INTL_CURR / "Cambridge/AS_A_Level/9702_Physics.md",
    ],
    "cambridge/igcse/economics.json": [
        CURATED / "cambridge/IGCSE/0455_Economics.md",
        INTL_CURR / "Cambridge/IGCSE/0455_Economics.md",
    ],
    "cambridge/igcse/english.json": [
        CURATED / "cambridge/IGCSE/0500_First_Language_English.md",
        INTL_CURR / "Cambridge/IGCSE/0500_First_Language_English.md",
    ],
    "cambridge/igcse/global-persp.json": [
        CURATED / "cambridge/AS_A_Level/9239_Global_Perspectives_and_Research.md",
        INTL_CURR / "Cambridge/AS_A_Level/9239_Global_Perspectives_and_Research.md",
    ],
    "cambridge/lsec/english.json": [CURATED / "cambridge/cambridge-lsec-english.md"],
    "cambridge/lsec/ict.json": [CURATED / "cambridge/cambridge-lsec-ict.md",
                                CURATED / "cambridge/cambridge-lsec-computing.md"],
    "cambridge/lsec/math.json": [CURATED / "cambridge/cambridge-lsec-math.md"],
    "cambridge/lsec/science.json": [CURATED / "cambridge/cambridge-lsec-science.md"],
    "cambridge/primary/science.json": [CURATED / "cambridge/cambridge-primary-science.md"],
    # AP
    "ap/high/cs.json": [INTL_CURR / "AP/ap-computer-science-a.md"],
    # IB DP
    "ib/dp/biology.json": [CURATED / "ib/DP/IB_DP_Biology.md"],
    "ib/dp/math-aa.json": [CURATED / "ib/DP/Mathematics_Analysis_and_Approaches.md",
                           CURATED / "ib/DP/IB_DP_Math_AI_Guide.md"],
    # IB MYP
    "ib/myp/individuals-societies.json": [CURATED / "ib/MYP/IB_MYP_Individuals_Societies.md"],
    "ib/myp/language-literature.json": [CURATED / "ib/MYP/IB_MYP_Language_Literature.md"],
    "ib/myp/pe.json": [CURATED / "ib/MYP/IB_MYP_PHE.md"],
    "ib/myp/sciences.json": [CURATED / "ib/MYP/IB_MYP_Sciences.md"],
    # IB PYP
    "ib/pyp/how-we-express.json": [CURATED / "ib/PYP/PYP_Combined_All.md",
                                   CURATED / "ib/PYP/PYP_Arts_Scope_Sequence.md",
                                   CURATED / "ib/PYP/PYP_Language_Scope_Sequence.md"],
    "ib/pyp/how-we-organize.json": [CURATED / "ib/PYP/PYP_Combined_All.md",
                                    CURATED / "ib/PYP/PYP_Social_Studies_Scope_Sequence.md"],
    "ib/pyp/how-world-works.json": [CURATED / "ib/PYP/PYP_Combined_All.md",
                                    CURATED / "ib/PYP/PYP_Science_Scope_Sequence.md"],
    "ib/pyp/where-we-are.json": [CURATED / "ib/PYP/PYP_Combined_All.md",
                                 CURATED / "ib/PYP/PYP_Social_Studies_Scope_Sequence.md"],
    "ib/pyp/who-we-are.json": [CURATED / "ib/PYP/PYP_Combined_All.md",
                               CURATED / "ib/PYP/PYP_Social_Studies_Scope_Sequence.md"],
}


def iter_nodes(tree):
    def walk(node):
        if isinstance(node, dict):
            if "id" in node and ("status" in node or "grade" in node):
                yield node
            for k, v in node.items():
                if k in ("prerequisites", "extends", "parallel", "courses"):
                    continue
                yield from walk(v)
        elif isinstance(node, list):
            for item in node:
                yield from walk(item)
    yield from walk(tree)


def load_curriculum_text(paths):
    texts = []
    for p in paths:
        if p.exists():
            texts.append(p.read_text(encoding="utf-8"))
    return "\n\n---\n\n".join(texts)


def find_relevant_segments(text: str, keywords: list, window: int = 1500) -> str:
    if not text:
        return ""
    if not keywords:
        return text[:15000]
    text_lower = text.lower()
    segments = []
    seen = set()
    for kw in keywords:
        if not kw or len(kw) < 2:
            continue
        kw_lower = kw.lower()
        pos = text_lower.find(kw_lower)
        while pos != -1:
            start = max(0, pos - window)
            end = min(len(text), pos + len(kw) + window)
            key = (start // 200)  # 粗去重
            if key not in seen:
                segments.append(text[start:end])
                seen.add(key)
            pos = text_lower.find(kw_lower, pos + len(kw))
    if not segments:
        # fallback: 取前 12k
        return text[:12000]
    merged = "\n\n...\n\n".join(segments)
    if len(merged) > 18000:
        merged = merged[:18000]
    return merged


def build_prompt(name_zh, name_en, domain, subject_ctx, curriculum_text):
    has_text = bool(curriculum_text and len(curriculum_text) > 50)
    if has_text:
        prompt = f"""You are a curriculum expert. Extract 2-4 specific curriculum statements relevant to the given knowledge point.

## Context
Subject: {subject_ctx}
Knowledge Point: {name_zh} / {name_en}
Domain: {domain}

## Curriculum Text Excerpt
{curriculum_text}

## Task
From the curriculum text above, find 2-4 statements that directly describe what students should learn, know, or be able to do regarding this knowledge point. Quote the original wording (English preferred if available), each statement ≤ 150 chars.

## Output
Return ONLY a JSON array, no extra text:
[
  {{"text": "verbatim curriculum statement 1", "source": "curriculum"}},
  {{"text": "verbatim curriculum statement 2", "source": "curriculum"}}
]

If no relevant content found, synthesize 2-3 generic learning objectives aligned with the subject and standard for this topic."""
    else:
        prompt = f"""You are a curriculum expert for {subject_ctx}.

Generate 3 authentic learning objectives for this knowledge point aligned with the official syllabus standards.

## Knowledge Point
Name: {name_zh} / {name_en}
Domain: {domain}
Subject/Course: {subject_ctx}

## Output
Return ONLY a JSON array, each statement ≤ 150 chars, using the style of official curriculum bullets (e.g., starting with "understand", "use", "apply", "recognise"):
[
  {{"text": "learning objective 1", "source": "syllabus"}},
  {{"text": "learning objective 2", "source": "syllabus"}},
  {{"text": "learning objective 3", "source": "syllabus"}}
]"""
    return prompt


def call_llm(prompt, max_retries=4):
    backoff = 1
    for attempt in range(max_retries):
        try:
            resp = client.chat.completions.create(
                model=LLM_CONFIG["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=700,
                timeout=LLM_CONFIG["timeout"],
            )
            content = resp.choices[0].message.content.strip()
            if "```json" in content:
                content = content.split("```json", 1)[1].split("```", 1)[0].strip()
            elif "```" in content:
                content = content.split("```", 1)[1].split("```", 1)[0].strip()
            # 去除可能的前缀
            s = content.find("[")
            e = content.rfind("]")
            if s != -1 and e != -1:
                content = content[s:e+1]
            result = json.loads(content)
            return result if isinstance(result, list) else []
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
            else:
                print(f"    LLM failed: {e}")
    return []


def process_kp(node, subject_ctx, curriculum_text, domain_name=""):
    name_zh = node.get("name", "")
    name_en = node.get("name_en", name_zh)
    node_id = node.get("id", "")

    keywords = [kw for kw in [name_en, name_zh, node_id] if kw]
    # 添加 node_id 的单词（去掉前缀）
    id_tail = node_id.split("-")[-1] if "-" in node_id else ""
    if id_tail and len(id_tail) > 2:
        keywords.append(id_tail)

    relevant = find_relevant_segments(curriculum_text, keywords) if curriculum_text else ""
    prompt = build_prompt(name_zh, name_en, domain_name, subject_ctx, relevant)
    raw = call_llm(prompt)
    points = []
    for item in raw:
        if isinstance(item, dict) and "text" in item:
            t = str(item["text"]).strip()
            if 10 <= len(t) <= 300:
                points.append({
                    "text": t,
                    "source": item.get("source", "curriculum"),
                    "confidence": 0.85,
                })
    return node_id, points


def make_kp_id(tree_path, node_id):
    # tree_path: cambridge/al/math.json → cambridge-al-math
    parts = tree_path.replace(".json", "").split("/")
    return "kp-" + "-".join(parts) + "-" + node_id


def fill_file(tree_rel: str, missing_ids: list, subject_ctx: str):
    tree_file = TREES / tree_rel
    ex_file = EXCERPTS / tree_rel
    tree = json.loads(tree_file.read_text(encoding="utf-8"))

    # 收集缺失节点
    nodes_map = {}
    domain_of = {}
    if isinstance(tree, dict) and "domains" in tree:
        for d in tree["domains"]:
            dname = d.get("name_en") or d.get("name") or ""
            for n in d.get("nodes", []):
                if n.get("id") in missing_ids:
                    nodes_map[n["id"]] = n
                    domain_of[n["id"]] = dname
    # 退化路径
    for n in iter_nodes(tree):
        if n.get("id") in missing_ids and n["id"] not in nodes_map:
            nodes_map[n["id"]] = n

    # 加载课标原文
    curr_paths = CURRICULUM_MAP.get(tree_rel, [])
    curriculum_text = load_curriculum_text(curr_paths) if curr_paths else ""

    print(f"\n=== {tree_rel} ({len(nodes_map)} missing) ===")
    print(f"  curriculum_chars: {len(curriculum_text)}")

    new_excerpts = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {
            ex.submit(process_kp, n, subject_ctx, curriculum_text, domain_of.get(nid, "")): nid
            for nid, n in nodes_map.items()
        }
        for fut in as_completed(futures):
            nid = futures[fut]
            try:
                node_id, points = fut.result()
                kp_id = make_kp_id(tree_rel, node_id)
                for p in points:
                    new_excerpts.append({
                        "kp_id": kp_id,
                        "text": p["text"],
                        "source": p.get("source", "curriculum"),
                        "confidence": p.get("confidence", 0.85),
                    })
                status = "✓" if points else "✗"
                print(f"  {status} {node_id} +{len(points)}")
            except Exception as e:
                print(f"  ✗ {nid} error: {e}")

    # 合并写回
    if ex_file.exists():
        ex_data = json.loads(ex_file.read_text(encoding="utf-8"))
    else:
        ex_data = {"excerpts": []}
    if isinstance(ex_data, list):
        ex_data = {"excerpts": ex_data}
    existing = ex_data.get("excerpts", [])
    existing.extend(new_excerpts)
    ex_data["excerpts"] = existing
    ex_data.setdefault("tree_path", tree_rel)

    ex_file.parent.mkdir(parents=True, exist_ok=True)
    ex_file.write_text(json.dumps(ex_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  → wrote {len(new_excerpts)} new excerpts to {ex_file.name}")


# subject context map
def subject_ctx_for(tree_rel):
    if tree_rel.startswith("cambridge/al/further-math"):
        return "Cambridge A-Level Further Mathematics (9231)"
    if tree_rel.startswith("cambridge/al/math"):
        return "Cambridge A-Level Mathematics (9709)"
    if tree_rel.startswith("cambridge/al/physics"):
        return "Cambridge A-Level Physics (9702)"
    if tree_rel.startswith("cambridge/igcse/economics"):
        return "Cambridge IGCSE Economics (0455)"
    if tree_rel.startswith("cambridge/igcse/english"):
        return "Cambridge IGCSE First Language English (0500/0990)"
    if tree_rel.startswith("cambridge/igcse/global-persp"):
        return "Cambridge IGCSE Global Perspectives (0457)"
    if tree_rel.startswith("cambridge/lsec/english"):
        return "Cambridge Lower Secondary English"
    if tree_rel.startswith("cambridge/lsec/ict"):
        return "Cambridge Lower Secondary Digital Literacy & Computing"
    if tree_rel.startswith("cambridge/lsec/math"):
        return "Cambridge Lower Secondary Mathematics"
    if tree_rel.startswith("cambridge/lsec/science"):
        return "Cambridge Lower Secondary Science"
    if tree_rel.startswith("cambridge/primary/science"):
        return "Cambridge Primary Science"
    if tree_rel.startswith("ap/high/cs"):
        return "AP Computer Science A"
    if tree_rel.startswith("ib/dp/biology"):
        return "IB Diploma Programme Biology"
    if tree_rel.startswith("ib/dp/math-aa"):
        return "IB Diploma Programme Mathematics: Analysis and Approaches"
    if tree_rel.startswith("ib/myp/individuals-societies"):
        return "IB MYP Individuals and Societies (Humanities)"
    if tree_rel.startswith("ib/myp/language-literature"):
        return "IB MYP Language and Literature"
    if tree_rel.startswith("ib/myp/pe"):
        return "IB MYP Physical and Health Education"
    if tree_rel.startswith("ib/myp/sciences"):
        return "IB MYP Sciences"
    if tree_rel.startswith("ib/pyp/"):
        return "IB Primary Years Programme (Transdisciplinary Inquiry)"
    return "International Curriculum"


def main():
    report = json.loads((Path(__file__).parent / "coverage_report.json").read_text(encoding="utf-8"))
    missing = report.get("missing", {})
    print(f"Total files with missing: {len(missing)}")
    total_missing = sum(len(v) for v in missing.values())
    print(f"Total missing KP: {total_missing}\n")

    # 按文件依次处理
    for tree_rel in sorted(missing.keys()):
        ids = missing[tree_rel]
        ctx = subject_ctx_for(tree_rel)
        fill_file(tree_rel, ids, ctx)

    print("\n\n✅ ALL DONE")


if __name__ == "__main__":
    main()
