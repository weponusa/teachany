#!/usr/bin/env python3
"""
fill_ap_curriculum.py — 用 LLM 为 AP 节点提取课标原文，回填到 data/trees/ap/high/*.json

策略:
1. 读 data/trees/ap/high/*.json 收集所有缺 cp 的节点
2. 读 books/国际课标/AP/ap-<subject>.md（pdfplumber 提取的文本）
3. 调用 OpenRouter API，让 LLM 为每个节点提取对应的 AP CED 课标条款
4. 回填到 tree.json 的 curriculum_points 字段
"""
import json, os, re, requests
from pathlib import Path

# ── 配置 ──
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.5-flash-preview"
TREES_DIR = Path("/Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/trees")
BOOKS_AP_DIR = Path("/Users/wepon/CodeBuddy/一次函数/books/国际课标/AP")

# ── 1. 收集所有缺 cp 的 AP 节点 ──
def collect_missing_ap_nodes():
    missing = []
    for jf in sorted(TREES_DIR.rglob("ap/**/*.json")):
        d = json.loads(jf.read_text(encoding="utf-8"))
        rel = jf.relative_to(TREES_DIR)
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    missing.append({
                        "file": rel,
                        "abs_path": jf,
                        "node_id": n["id"],
                        "name_zh": n.get("name", ""),
                        "name_en": n.get("name_en", ""),
                        "domain": dom.get("name", ""),
                    })
    return missing

# ── 2. 读对应的 md 文件 ──
def load_md_for_subject(subject: str):
    """根据 subject 名找 books/国际课标/AP/ 下的 md 文件"""
    # subject 可能是 "calculus-ab", "biology" 等
    # md 文件名可能是 "ap-calculus-ab.md", "ap-biology.md" 等
    patterns = [
        f"ap-{subject}.md",
        f"ap-{subject.replace('-', '_')}.md",
        f"{subject}.md",
    ]
    for p in patterns:
        fp = BOOKS_AP_DIR / p
        if fp.exists():
            return fp.read_text(encoding="utf-8")
    # 模糊匹配
    for fp in BOOKS_AP_DIR.glob("*.md"):
        if subject.replace("-", "") in fp.stem.replace("-", ""):
            return fp.read_text(encoding="utf-8")
    return None

# ── 3. 调用 LLM 提取课标 ──
def extract_cp_with_llm(node: dict, md_text: str) -> list[str]:
    """让 LLM 从 md_text 中提取该节点对应的 AP CED 课标条款"""
    prompt = f"""你是 AP 课程框架分析专家。请根据以下 AP 课程框架原文，为指定的知识点提取所有相关的 AP CED 课标条款原文。

【知识点】
中文名：{node['name_zh']}
英文名：{node['name_en']}
所属领域：{node['domain']}

【AP 课程框架原文（节选）】
{md_text[:8000]}

【要求】
1. 从原文中找出所有与该知识点直接相关的 AP CED 课标条款（LO / EK 等）
2. 每条单独一行，保留原文英文，不要翻译
3. 如果原文中有多条相关条款，全部列出
4. 如果找不到明确对应的条款，输出"未找到明确对应条款"
5. 输出格式：每行一条，不要编号，不要额外解释

【课标条款原文】"""

    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1024,
                "temperature": 0.1,
            },
            timeout=60,
        )
        if not resp.ok:
            print(f"  ❌ API 错误: {resp.status_code} {resp.text[:100]}")
            return []
        result = resp.json()
        content = result["choices"][0]["message"]["content"].strip()
        if "未找到" in content:
            return []
        lines = [l.strip() for l in content.splitlines() if l.strip()]
        # 过滤掉非课标行
        lines = [l for l in lines if not l.startswith("【") and not l.startswith("#")]
        return lines[:10]  # 最多 10 条
    except Exception as e:
        print(f"  ❌ LLM 调用失败: {e}")
        return []

# ── 4. 回填 ──
def fill_cp_back_to_json(filepath: Path, node_id: str, cp_list: list[str]):
    d = json.loads(filepath.read_text(encoding="utf-8"))
    changed = False
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if n["id"] == node_id and cp_list:
                n["curriculum_points"] = cp_list
                changed = True
                break
        if changed:
            break
    if changed:
        filepath.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        return True
    return False

def main():
    missing = collect_missing_ap_nodes()
    if not missing:
        print("✅ 所有 AP 节点都有 curriculum_points，无需填充")
        return

    by_file = {}
    for m in missing:
        by_file.setdefault(str(m["abs_path"]), []).append(m)

    print(f"需填充的 AP 节点: {len(missing)} 个，分布在 {len(by_file)} 个文件中")
    print()

    for fp_str, nodes in by_file.items():
        fp = Path(fp_str)
        subject = fp.stem.replace("ap-", "").replace("_", "-")
        print(f"📂 {fp.name}")
        
        md_text = load_md_for_subject(subject)
        if not md_text:
            print(f"  ⚠️  找不到对应的 md 文件，跳过")
            continue

        for node in nodes:
            nid = node["node_id"]
            name = node["name_zh"] or node["name_en"]
            print(f"  🔍 {nid}: {name} ...")
            cp = extract_cp_with_llm(node, md_text)
            if cp:
                ok = fill_cp_back_to_json(fp, nid, cp)
                print(f"  ✅ 回填 {len(cp)} 条课标")
                for i, c in enumerate(cp[:3]):
                    print(f"     {c[:70]}")
            else:
                print(f"  ⚠️  未提取到课标")

if __name__ == "__main__":
    main()
