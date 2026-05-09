#!/usr/bin/env python3
"""
fill_us_curriculum.py — 批量提取 US Common Core / NGSS 课标并回填 data/trees/us/**/*.json

策略:
1. 读 /books/课标-整理版/us/common-core-math.md + ngss.md + common-core-ela.md
2. 收集 data/trees/us/**/*.json 中所有缺 curriculum_points 的节点
3. 按 subject 分组，一个 subject 调一次 LLM（放完整节点列表 + 对应 md 原文）
4. LLM 返回 JSON: { node_id: [课标原文行1, 行2,...] }
5. 回填到 tree.json

用法:
  python3 scripts/fill_us_curriculum.py --dry-run    # 只预览，不写文件
  python3 scripts/fill_us_curriculum.py --subject math  # 只处理 math
  python3 scripts/fill_us_curriculum.py                 # 处理全部
"""
import json, os, glob, argparse, re, time, sys
from pathlib import Path

# ── 配置 ──
GEMINI_API_KEY  = "AIzaSyCJd7qZoi6g3WEa6yzfujSsc0KtgXoOL-M"   # nano-banana skill key
GEMINI_API_URL  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
MODEL               = "gemini-2.5-flash"
BOOKS_US_DIR      = Path("/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us")
TREES_US_DIR     = Path("/Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/trees/us")
TIMEOUT             = 120

# ── 收集缺 cp 的节点 ──
def collect_missing_us_nodes():
    missing = []
    for jf in sorted(TREES_US_DIR.rglob("*.json")):
        d = json.loads(jf.read_text(encoding="utf-8"))
        rel = jf.relative_to(TREES_US_DIR)
        # rel = k5/math.json  or ms/ela.json  or hs/algebra.json
        subject = jf.stem
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    missing.append({
                        "file": jf,
                        "rel": str(rel),
                        "subject": subject,
                        "domain_name": dom.get("name", ""),
                        "node_id": n["id"],
                        "name_zh": n.get("name", ""),
                        "name_en": n.get("name_en", ""),
                    })
    return missing

# ── 加载对应 subject 的课标原文 md ──
def load_md_for_subject(subject: str) -> str:
    # 尝试多种文件名
    candidates = [
        BOOKS_US_DIR / f"{subject}.md",
        BOOKS_US_DIR / f"common-core-{subject}.md",
        BOOKS_US_DIR / f"ngss.md",
        BOOKS_US_DIR / f"c3-framework.md",
    ]
    for c in candidates:
        if c.exists():
            return c.read_text(encoding="utf-8")
    # 扫描整个 us/ 目录
    for md in BOOKS_US_DIR.glob("*.md"):
        return md.read_text(encoding="utf-8")
    return ""

# ── 调用 Gemini API ──
def call_llm(prompt: str) -> str:
    import requests, json as json_mod
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 4096,
            "temperature": 0.1,
        },
    }
    resp = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json_mod.dumps(payload).encode("utf-8"),
        timeout=TIMEOUT,
    )
    if not resp.ok:
        raise RuntimeError(f"Gemini API {resp.status_code}: {resp.text[:300]}")
    result = resp.json()
    # 提取文本
    try:
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        # 尝试 alternatives
        return result["candidates"][0]["text"]

# ── 为单个 subject 提取课标 ──
def extract_for_subject(subject: str, nodes: list, md_text: str) -> dict:
    """
    返回 { node_id: [cp_line1, cp_line2, ...] }
    """
    # 构造 prompt
    node_list = "\n".join(
        f"{i+1}. {n['node_id']} | {n['name_en']} | {n['name_zh']}"
        for i, n in enumerate(nodes)
    )
    prompt = f"""You are a US Common Core / NGSS curriculum expert.

Below is the plain-text extract of a US curriculum framework document (Common Core or NGSS).

Your job: for each knowledge point (node) listed below, extract the EXACT matching curriculum standard lines (the verbatim standard text) from the document.

Output format: a JSON object where each key is the node_id, and each value is an array of strings (the exact standard lines, keep original English, do NOT translate).

If a node has no direct matching standard, use an empty array [].

===== NODE LIST (node_id | name_en | name_zh) =====
{node_list}

===== CURRICULUM FRAMEWORK TEXT (truncated to ~15000 chars) =====
{md_text[:15000]}

===== OUTPUT (pure JSON, no markdown fences) =====
"""

    print(f"  📡 调用 LLM ({MODEL}) 提取 {len(nodes)} 个节点...")
    try:
        raw = call_llm(prompt)
        # 去掉可能的 ```json ``` 包裹
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE)
        cleaned = cleaned.strip()
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
        return {}
    except Exception as e:
        print(f"  ❌ LLM 调用失败: {e}")
        return {}

# ── 回填到 JSON 文件 ──
def backfill(nodes: list, cp_map: dict, dry_run: bool):
    changed = set()
    # 按文件分组
    by_file = {}
    for n in nodes:
        by_file.setdefault(str(n["file"]), []).append(n)

    for fp_str, ns in by_file.items():
        fp = Path(fp_str)
        if dry_run:
            for n in ns:
                cps = cp_map.get(n["node_id"], [])
                if cps:
                    print(f"  [dry-run] {n['node_id']} ← {len(cps)} 条")
            continue
        d = json.loads(fp.read_text(encoding="utf-8"))
        file_changed = False
        for dom in d.get("domains", []):
            for node in dom.get("nodes", []):
                key = node["id"]
                cps = cp_map.get(key)
                if cps:
                    node["curriculum_points"] = cps
                    file_changed = True
                    changed.add(key)
        if file_changed:
            fp.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  ✅ 写入 {fp.name}")

    return changed

# ── main ──
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--subject", type=str, default=None, help="只处理指定 subject，例如 math, ela, biology")
    args = ap.parse_args()

    missing = collect_missing_us_nodes()
    print(f"US 体系总计缺 cp 节点: {len(missing)}")

    by_subject = {}
    for m in missing:
        by_subject.setdefault(m["subject"], []).append(m)

    targets = [args.subject] if args.subject else list(by_subject.keys())
    print(f"将处理 subject: {targets}")

    total_filled = 0

    for subject in targets:
        nodes = by_subject.get(subject, [])
        if not nodes:
            print(f"\n⚠️  subject={subject} 无缺 cp 节点，跳过")
            continue

        print(f"\n{'='*60}")
        print(f"处理 subject: {subject}  ({len(nodes)} 个节点)")
        print(f"{'='*60}")

        md_text = load_md_for_subject(subject)
        if not md_text:
            print(f"  ⚠️  找不到 {subject} 的课标原文 md，跳过")
            continue
        print(f"  📄 课标原文长度: {len(md_text)} 字符")

        cp_map = extract_for_subject(subject, nodes, md_text)
        print(f"  ✅ LLM 返回了 {len(cp_map)} 个节点的课标")

        filled = backfill(nodes, cp_map, dry_run=args.dry_run)
        print(f"  实际回填: {len(filled)} 个节点")
        total_filled += len(filled)

        if not args.dry_run:
            time.sleep(2)  # 避免速率限制

    print(f"\n{'='*60}")
    print(f"总计回填: {total_filled} / {len(missing)} 个 US 节点")
    if args.dry_run:
        print("(dry-run 模式，未写入文件)")

if __name__ == "__main__":
    main()
