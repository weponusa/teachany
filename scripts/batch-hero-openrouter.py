#!/usr/bin/env python3
"""
batch-hero-openrouter.py
========================
通过 OpenRouter 调用 Nano Banana 2 (Gemini 3.1 Flash Image)
批量生成中国课标知识点 hero 信息图（知识全景地图）。

用法:
  python3 scripts/batch-hero-openrouter.py                     # 全量生成
  python3 scripts/batch-hero-openrouter.py --subject biology    # 只生成生物学科
  python3 scripts/batch-hero-openrouter.py --batch-size 5       # 每批5个后暂停
  python3 scripts/batch-hero-openrouter.py --dry-run            # 只打印 prompt 不生成
  python3 scripts/batch-hero-openrouter.py --start-from math-congruent-triangles  # 从指定课程开始
  python3 scripts/batch-hero-openrouter.py --retry-failed       # 重试失败的课程
"""

import json, os, sys, time, argparse, re, base64, requests
from pathlib import Path
from datetime import datetime

# ─── 配置 ────────────────────────────────────────────────
API_KEY = "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"
MODEL = "google/gemini-3.1-flash-image-preview"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

DELAY_BETWEEN = 8        # 每张图间隔秒数
MAX_RETRIES = 3           # 每张图最大重试次数
RETRY_BACKOFF = 20        # 重试退避基数(秒)
BATCH_PAUSE_EVERY = 50    # 每N张暂停一次

PROJ_ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = PROJ_ROOT / "registry.json"
PROGRESS_PATH = PROJ_ROOT / "scripts" / "hero-gen-progress-or.json"

# ─── 学科/年级中文映射 ──────────────────────────────────
SUBJECT_CN = {
    "math": "数学", "chinese": "语文", "english": "英语",
    "biology": "生物", "physics": "物理", "chemistry": "化学",
    "history": "历史", "geography": "地理", "science": "科学",
    "politics": "道德与法治",
}
GRADE_CN = {
    1: "一年级", 2: "二年级", 3: "三年级", 4: "四年级",
    5: "五年级", 6: "六年级", 7: "七年级", 8: "八年级",
    9: "九年级", 10: "高一", 11: "高二", 12: "高三",
}

# ─── 从课程 HTML 提取知识点 ───────────────────────────────
def extract_knowledge_from_html(html_path: Path) -> dict:
    """从课件 index.html 提取标题和知识点结构"""
    if not html_path.exists():
        return {"headings": [], "keywords": []}

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    # 提取 h2/h3/h4 标题
    headings = re.findall(r'<h[234][^>]*>(.*?)</h[234]>', html, re.DOTALL)
    headings = [re.sub(r'<[^>]+>', '', h).strip() for h in headings]
    headings = [h for h in headings if h and len(h) > 1 and len(h) < 50]

    # 提取 card-item 中的简短描述
    cards = re.findall(r'<h4>(.*?)</h4>\s*<p>(.*?)</p>', html, re.DOTALL)
    card_texts = []
    for title, desc in cards:
        t = re.sub(r'<[^>]+>', '', title).strip()
        d = re.sub(r'<[^>]+>', '', desc).strip()
        if t and d:
            card_texts.append(f"{t}：{d}")

    # 提取重要的关键词（加粗的文本）
    bolds = re.findall(r'<strong>(.*?)</strong>', html)
    keywords = list(set(re.sub(r'<[^>]+>', '', b).strip() for b in bolds if len(b) < 30))

    return {
        "headings": headings[:20],
        "cards": card_texts[:15],
        "keywords": keywords[:15],
    }


def clean_course_name(name: str) -> str:
    """清理课程名称，去掉后缀"""
    name = re.sub(r'\s*[—–-]\s*(七|八|九|初中|高中|小学|TeachAny).*$', '', name)
    name = re.sub(r'\s*[|·]\s*(初中|高中|小学).*$', '', name)
    return name.strip()


# ─── 生成 Prompt ─────────────────────────────────────────
def generate_prompt(course: dict) -> str:
    """根据课程信息和 HTML 内容自动生成信息图 prompt"""
    name = course["name"]
    clean_name = clean_course_name(name)
    subject = SUBJECT_CN.get(course.get("subject", ""), course.get("subject", ""))
    grade_num = course.get("grade", 7)
    if isinstance(grade_num, str):
        grade_num = int(grade_num) if grade_num.isdigit() else 7
    grade = GRADE_CN.get(grade_num, f"{grade_num}年级")

    # 从 HTML 提取知识点
    course_path = PROJ_ROOT / course.get("path", "")
    html_path = course_path / "index.html"
    knowledge = extract_knowledge_from_html(html_path)

    # 构建知识卡片描述
    headings = knowledge.get("headings", [])
    cards = knowledge.get("cards", [])
    keywords = knowledge.get("keywords", [])

    # 将提取的知识点组织成卡片描述
    knowledge_section = ""
    if headings or cards:
        knowledge_section = "\n\nKNOWLEDGE CONTENT EXTRACTED FROM COURSEWARE:\n"
        if headings:
            knowledge_section += "Section headings: " + " | ".join(headings[:12]) + "\n"
        if cards:
            knowledge_section += "Key concepts: " + " | ".join(cards[:10]) + "\n"
        if keywords:
            knowledge_section += "Important terms: " + ", ".join(keywords[:12]) + "\n"
        knowledge_section += "\nUse the above content to fill in 6 knowledge branch cards. Each card should have a descriptive Chinese title and 3-5 bullet points of key knowledge."

    prompt = f"""Generate a comprehensive Chinese educational knowledge panorama infographic (知识全景地图) for the topic "{clean_name}", {grade}{subject}.

STYLE & LAYOUT:
- Clean white background with soft pastel color blocks (mint green, sky blue, warm peach, lavender, soft yellow, light pink)
- Central hub: deep blue rounded rectangle with "{clean_name}" in large white bold text, subtitle "{grade}{subject} · 知识全景地图" below
- 6 knowledge branch cards radiating outward from center, each a distinct pastel color
- Curved connecting lines from center to each card
- Professional educational infographic style, information-dense, NOT a simple mind map
- Include small illustrative icons/mini-drawings next to key concepts
- Each card has a bold title and 3-5 bullet points of specific knowledge
{knowledge_section}

CARD LAYOUT:
- Cards arranged around center: top-left, top-right, right, bottom-right, bottom-left, left
- Each card: rounded rectangle with colored background, bold title, bullet points
- Bottom of infographic: a summary/application banner

CRITICAL TEXT REQUIREMENTS:
- ALL text MUST be in Simplified Chinese (简体中文)
- Every Chinese character must be correctly rendered and legible
- The exact main title is: {clean_name}
- Include specific facts, formulas, examples — not vague descriptions
- Each card must have substantive content, not just category names"""

    return prompt


# ─── 生成图片 ────────────────────────────────────────────
def generate_image(prompt: str, output_path: str) -> bool:
    """调用 OpenRouter API 生成图片并保存"""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "modalities": ["image", "text"],
                },
                timeout=180,
            )

            if resp.status_code == 429:
                wait = RETRY_BACKOFF * attempt
                print(f"    ⚠️  429 限流, 等待 {wait}s 后重试 (attempt {attempt}/{MAX_RETRIES})")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"    ❌ HTTP {resp.status_code}: {resp.text[:200]}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF * attempt)
                    continue
                return False

            result = resp.json()
            choices = result.get("choices", [])
            if not choices:
                print(f"    ❌ 没有 choices")
                return False

            msg = choices[0].get("message", {})
            images = msg.get("images", [])

            if not images:
                print(f"    ❌ 没有 images 字段")
                # 打印可能的错误信息
                content = msg.get("content", "")
                if content:
                    print(f"    回复: {content[:200]}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF * attempt)
                    continue
                return False

            # 保存第一张图片
            img_url = images[0].get("image_url", {}).get("url", "")
            if not img_url.startswith("data:"):
                print(f"    ❌ 图片 URL 格式不对: {img_url[:80]}")
                return False

            b64_data = img_url.split(",", 1)[1]
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(b64_data))

            fsize = os.path.getsize(output_path) / 1024
            cost = result.get("usage", {}).get("cost", 0)
            print(f"    ✅ 已保存 ({fsize:.0f} KB, ${cost:.4f})")
            return True

        except requests.exceptions.Timeout:
            print(f"    ⚠️  超时, 重试 (attempt {attempt}/{MAX_RETRIES})")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF * attempt)
                continue
            return False

        except Exception as e:
            print(f"    ❌ 异常: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF * attempt)
                continue
            return False

    return False


# ─── 进度管理 ────────────────────────────────────────────
def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH, "r") as f:
            return json.load(f)
    return {"completed": [], "failed": [], "skipped": [], "started_at": None}

def save_progress(progress: dict):
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)


# ─── 确定 hero 图文件名 ─────────────────────────────────
def get_hero_filename(course_id: str) -> str:
    """根据课程 ID 生成 hero 图文件名"""
    # 去掉常见前缀
    name = course_id
    for prefix in ["bio-", "math-", "chinese-", "eng-", "phy-", "chem-", "hist-", "geo-", "sci-"]:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    return f"{name}-hero.png"


# ─── 主流程 ──────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="批量生成 hero 知识全景信息图")
    parser.add_argument("--subject", help="只处理指定学科")
    parser.add_argument("--batch-size", type=int, default=0, help="每批处理N个后暂停(0=不暂停)")
    parser.add_argument("--start-from", help="从指定课程ID开始")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不生成")
    parser.add_argument("--retry-failed", action="store_true", help="重试失败的课程")
    parser.add_argument("--delay", type=int, default=DELAY_BETWEEN, help="每张图间隔秒数")
    parser.add_argument("--limit", type=int, default=0, help="最多处理N个课程")
    args = parser.parse_args()

    # 加载 registry
    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)
    courses = registry.get("courses", [])

    # 加载进度
    progress = load_progress()
    if not progress.get("started_at"):
        progress["started_at"] = datetime.now().isoformat()

    # 筛选缺失 hero 图的课程
    if args.retry_failed:
        failed_ids = set(progress.get("failed", []))
        missing = [c for c in courses if c["id"] in failed_ids]
        progress["failed"] = []  # 清除失败列表重新尝试
        print(f"🔄 重试 {len(missing)} 个失败课程")
    else:
        completed = set(progress.get("completed", []))
        missing = [c for c in courses if not c.get("hero_image") and c["id"] not in completed]

    # 按学科筛选
    if args.subject:
        missing = [c for c in missing if c.get("subject") == args.subject]

    # 从指定课程开始
    if args.start_from:
        found = False
        filtered = []
        for c in missing:
            if c["id"] == args.start_from:
                found = True
            if found:
                filtered.append(c)
        if not filtered:
            print(f"❌ 找不到课程 {args.start_from}")
            return
        missing = filtered

    # 限制数量
    if args.limit > 0:
        missing = missing[:args.limit]

    print(f"📊 待处理: {len(missing)} 个课程")
    print(f"   已完成: {len(progress.get('completed', []))}")
    print(f"   已失败: {len(progress.get('failed', []))}")

    if not missing:
        print("✅ 所有课程已处理完毕!")
        return

    # 按学科统计
    from collections import Counter
    subj_cnt = Counter(c.get("subject", "") for c in missing)
    for subj, cnt in subj_cnt.most_common():
        print(f"   {SUBJECT_CN.get(subj, subj)}: {cnt}")

    total_cost = 0.0
    batch_count = 0

    for i, course in enumerate(missing):
        cid = course["id"]
        cname = course["name"]
        subject = course.get("subject", "")
        print(f"\n[{i+1}/{len(missing)}] {cid} - {cname}")

        # 生成 prompt
        prompt = generate_prompt(course)

        if args.dry_run:
            print(f"  PROMPT ({len(prompt)} chars):")
            print(f"  {prompt[:300]}...")
            continue

        # 确定输出路径
        course_path = PROJ_ROOT / course.get("path", "")
        hero_name = get_hero_filename(cid)
        output_path = str(course_path / "assets" / hero_name)

        # 生成图片
        print(f"  📸 生成中... → {hero_name}")
        success = generate_image(prompt, output_path)

        if success:
            progress["completed"].append(cid)
            # 记录 hero_image 路径（相对于课程目录）
            course["_hero_file"] = f"assets/{hero_name}"
            batch_count += 1
        else:
            progress["failed"].append(cid)

        save_progress(progress)

        # 间隔延迟
        if i < len(missing) - 1:
            time.sleep(args.delay)

        # 批次暂停
        pause_every = args.batch_size if args.batch_size > 0 else BATCH_PAUSE_EVERY
        if batch_count > 0 and batch_count % pause_every == 0 and i < len(missing) - 1:
            print(f"\n⏸️  已完成 {batch_count} 个, 暂停 60s 避免限流...")
            time.sleep(60)

    # 更新 registry.json
    if not args.dry_run:
        completed_set = set(progress.get("completed", []))
        updated = 0
        for c in courses:
            if c["id"] in completed_set and not c.get("hero_image"):
                hero_name = get_hero_filename(c["id"])
                c["hero_image"] = f"assets/{hero_name}"
                updated += 1

        if updated > 0:
            with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
                json.dump(registry, f, indent=2, ensure_ascii=False)
            print(f"\n📝 已更新 registry.json ({updated} 个课程)")

    # 最终统计
    print(f"\n{'='*50}")
    print(f"📊 最终统计:")
    print(f"   成功: {len(progress.get('completed', []))}")
    print(f"   失败: {len(progress.get('failed', []))}")
    if not args.dry_run:
        print(f"   (失败的课程可用 --retry-failed 重试)")


if __name__ == "__main__":
    main()
