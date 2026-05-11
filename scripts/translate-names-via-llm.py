#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 LLM API（OpenRouter）批量翻译课件 manifest.json 的 name → name_en

策略：
  - 扫所有 community/ examples/ 下 manifest 缺 name_en 的课件
  - 收集成 batch（每批 20 个），一次 API 调用翻译全部
  - 让 LLM 返回 JSON {"id1": "English Title", "id2": ...}
  - 写回 manifest.json

要求：
  - 环境变量 OPENROUTER_API_KEY 设置好（或用 --key 传）
  - 默认用 google/gemini-2.0-flash-exp:free 模型（免费额度大）

用法：
    python3 scripts/translate-names-via-llm.py             # dry-run
    python3 scripts/translate-names-via-llm.py --apply     # 真写入
    python3 scripts/translate-names-via-llm.py --apply --batch-size 30
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# OpenRouter 配置（用户记忆里的 key）
DEFAULT_KEY = "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"
DEFAULT_MODEL = "deepseek/deepseek-v4-flash"  # 便宜质量好，中英专业


def collect_pending(only=None):
    """收集所有缺 name_en 的课件"""
    pending = []
    for d in ["community", "examples"]:
        if only and d != only:
            continue
        root = ROOT / d
        if not root.exists():
            continue
        for sub in sorted(root.iterdir()):
            if not sub.is_dir():
                continue
            if sub.name in ("drafts", "pending", "official", "archive", "_template"):
                continue
            mf = sub / "manifest.json"
            if not mf.exists():
                continue
            try:
                m = json.load(open(mf))
            except Exception:
                continue
            name = m.get("name", "").strip()
            en = m.get("name_en", "").strip()
            has_zh = bool(re.search(r"[\u4e00-\u9fff]", name)) if name else False
            if has_zh and not en:
                pending.append({
                    "manifest_path": str(mf),
                    "id": sub.name,
                    "name": name,
                    "subject": m.get("subject"),
                    "grade": m.get("grade"),
                })
    return pending


def translate_batch(items, api_key, model):
    """一次翻译一批"""
    import urllib.request

    # 构造提示
    items_json = json.dumps(
        [{"id": x["id"], "name": x["name"], "subject": x.get("subject"), "grade": x.get("grade")} for x in items],
        ensure_ascii=False,
    )

    prompt = f"""你是 K-12 教育内容专家。请将下面这批课件的中文标题翻译成专业、简洁、自然的英文标题。

要求：
1. 严格用学科专业术语（不是字面直译）。如"百分数大冒险" → "Percentage Adventure"
2. 标题去掉"互动课件 / 教学课件 / TeachAny"等冗余词
3. 长度控制在 3-6 个英文单词
4. 保留学科特色（如古诗 → Classical Poetry, 平仄 → Tonal Rhythm）
5. 输出严格 JSON 格式，键是 id，值是英文标题字符串

输入：
{items_json}

输出（只返回 JSON，不要 markdown，不要解释）："""

    req_body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=req_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/weponusa/teachany",
            "X-Title": "TeachAny",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  ❌ API 调用失败: {e}")
        return {}

    try:
        content = data["choices"][0]["message"]["content"].strip()
        # 去 markdown code fence
        content = re.sub(r"^```json?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
        return json.loads(content)
    except Exception as e:
        print(f"  ⚠️  解析 LLM 响应失败: {e}")
        print(f"  原始响应: {content[:200] if 'content' in locals() else '?'}")
        return {}


def apply_translations(items, translations, dry_run=True):
    """把翻译写回 manifest"""
    written = 0
    for item in items:
        cid = item["id"]
        en = translations.get(cid, "").strip()
        if not en:
            continue
        if dry_run:
            print(f"  [DRY] {cid}: {item['name']} → {en}")
        else:
            mf = Path(item["manifest_path"])
            m = json.load(open(mf))
            m["name_en"] = en
            with open(mf, "w") as f:
                json.dump(m, f, ensure_ascii=False, indent=2)
            print(f"  ✏️  {cid}: → {en}")
        written += 1
    return written


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="真写入（默认 dry-run）")
    ap.add_argument("--batch-size", type=int, default=20)
    ap.add_argument("--key", default=os.environ.get("OPENROUTER_API_KEY", DEFAULT_KEY))
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--only", choices=["community", "examples"])
    ap.add_argument("--limit", type=int, help="只处理前 N 个（测试用）")
    args = ap.parse_args()

    if not args.key:
        print("❌ 需要 OpenRouter API key（--key 或 OPENROUTER_API_KEY）")
        sys.exit(1)

    pending = collect_pending(only=args.only)
    if args.limit:
        pending = pending[: args.limit]

    print(f"📋 共 {len(pending)} 个课件待翻译")
    if not pending:
        print("✅ 没有需要翻译的课件")
        return

    if not args.apply:
        print("⚠️  Dry-run 模式（用 --apply 真写入）\n")

    total_written = 0
    for i in range(0, len(pending), args.batch_size):
        batch = pending[i : i + args.batch_size]
        print(f"\n=== Batch {i // args.batch_size + 1} (共 {len(batch)} 个) ===")
        translations = translate_batch(batch, args.key, args.model)
        if translations:
            written = apply_translations(batch, translations, dry_run=not args.apply)
            total_written += written
            print(f"  ✅ 翻译成功: {len(translations)} / {len(batch)}")
        else:
            print(f"  ❌ 整批翻译失败")
        # 避免 rate limit
        time.sleep(1)

    print(f"\n═══════════════════════════════════════")
    print(f"  总写入: {total_written} / {len(pending)}")
    print(f"═══════════════════════════════════════")


if __name__ == "__main__":
    main()
