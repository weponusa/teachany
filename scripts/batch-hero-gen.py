#!/usr/bin/env python3
"""
TeachAny 全量 Hero 图批量生成工具
================================
通过 NotebookLM CLI 为所有缺少 hero_image 的课件自动生成知识全景信息图。

功能：
  - 自动从 registry.json 提取缺失列表
  - 根据课件 HTML 内容自动生成 prompt
  - 断点续传（记录已完成的到 progress.json）
  - 限流与重试（出错自动重试，指数退避）
  - 批量模式（可指定每批数量，中间暂停等待）
  - 完成后自动更新 registry.json

用法：
  python3 scripts/batch-hero-gen.py                    # 全量生成
  python3 scripts/batch-hero-gen.py --batch-size 20    # 每批20个
  python3 scripts/batch-hero-gen.py --subject math     # 只生成数学
  python3 scripts/batch-hero-gen.py --start-from 50    # 从第50个开始
  python3 scripts/batch-hero-gen.py --dry-run          # 仅预览不执行
  python3 scripts/batch-hero-gen.py --retry-failed     # 重试之前失败的
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# ============================================================
# 配置
# ============================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = PROJECT_ROOT / "registry.json"
PROGRESS_PATH = PROJECT_ROOT / "scripts" / "hero-gen-progress.json"

# 限流参数
DELAY_BETWEEN_COURSES = 15      # 每个课件间隔秒数
DELAY_AFTER_SOURCE = 12         # 添加 source 后等待秒数
DELAY_AFTER_GENERATE = 5        # 生成后等待下载的秒数
MAX_RETRIES = 3                 # 每个课件最大重试次数
RETRY_BACKOFF_BASE = 30         # 重试退避基数（秒）
BATCH_PAUSE_EVERY = 50          # 每50个暂停一次
BATCH_PAUSE_SECONDS = 60        # 暂停时长（秒）

# 学科中文映射
SUBJECT_CN = {
    "math": "数学",
    "chinese": "语文",
    "english": "英语",
    "biology": "生物",
    "physics": "物理",
    "chemistry": "化学",
    "history": "历史",
    "geography": "地理",
    "science": "科学",
    "politics": "道德与法治",
}

GRADE_CN = {
    1: "一年级", 2: "二年级", 3: "三年级", 4: "四年级",
    5: "五年级", 6: "六年级", 7: "七年级", 8: "八年级",
    9: "九年级", 10: "高一", 11: "高二", 12: "高三",
}

# ============================================================
# 工具函数
# ============================================================

def run_cmd(cmd: list[str], timeout: int = 120) -> tuple[int, str, str]:
    """执行命令并返回 (returncode, stdout, stderr)"""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -1, "", str(e)


def load_progress() -> dict:
    """加载进度文件"""
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH) as f:
            return json.load(f)
    return {"completed": [], "failed": [], "skipped": [], "started_at": None}


def save_progress(progress: dict):
    """保存进度文件"""
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def load_registry() -> dict:
    """加载 registry.json"""
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def save_registry(data: dict):
    """保存 registry.json"""
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  📝 registry.json 已更新")


def get_missing_courses(registry: dict, subject_filter: str = None) -> list[dict]:
    """获取所有缺少 hero_image 的课件"""
    missing = []
    for course in registry["courses"]:
        if course.get("hero_image"):
            continue
        if subject_filter and course.get("subject") != subject_filter:
            continue
        missing.append(course)
    return missing


def generate_prompt(course: dict) -> str:
    """根据课件信息自动生成 infographic prompt"""
    name = course["name"]
    subject = SUBJECT_CN.get(course.get("subject", ""), course.get("subject", ""))
    grade_num = course.get("grade", 0)
    grade = GRADE_CN.get(grade_num, f"{grade_num}年级")

    # 清理课件名称（去掉后缀信息）
    clean_name = name
    for suffix in ["— 互动课件", " — 互动课件", "互动课件", " — "]:
        clean_name = clean_name.replace(suffix, "").strip()
    # 去掉年级前缀
    for g in GRADE_CN.values():
        for s in SUBJECT_CN.values():
            prefix = f"{g}{s}"
            if clean_name.startswith(prefix):
                clean_name = clean_name[len(prefix):].strip("：:— ").strip()

    prompt = (
        f"请为【{clean_name}】这门课生成一份完整的中文知识结构信息图。"
        f"这是中国课标{grade}{subject}的内容。"
        f"信息图要求："
        f"1. 以「{clean_name}」为中心主题；"
        f"2. 展示本课所有核心知识点及其层级关系（至少3层深度）；"
        f"3. 用概念图/思维导图形式，让学生一眼看到知识全貌；"
        f"4. 标注关键公式、定义或重要结论；"
        f"5. 风格清晰、配色协调、适合教学场景使用。"
    )
    return prompt


def make_hero_filename(course_id: str) -> str:
    """根据课件 ID 生成 hero 文件名"""
    return f"hero-{course_id}.png"


# ============================================================
# 核心处理函数
# ============================================================

def process_single_course(course: dict, idx: int, total: int) -> tuple[bool, str]:
    """
    处理单个课件：创建 notebook → 添加 source → 生成 infographic → 下载 → 清理
    返回 (成功与否, 消息)
    """
    course_id = course["id"]
    name = course["name"]
    path = course["path"]
    html_path = PROJECT_ROOT / path / "index.html"
    hero_file = make_hero_filename(course_id)
    assets_dir = PROJECT_ROOT / path / "assets"
    output_path = assets_dir / hero_file

    print(f"\n{'='*60}")
    print(f"📚 [{idx}/{total}] {name}")
    print(f"   ID: {course_id} | 路径: {path}")
    print(f"{'='*60}")

    if not html_path.exists():
        return False, f"index.html 不存在: {html_path}"

    # 确保 assets 目录存在
    assets_dir.mkdir(parents=True, exist_ok=True)

    nb_id = None

    try:
        # 1. 创建 notebook
        print(f"  1️⃣  创建 Notebook...")
        rc, out, err = run_cmd(["notebooklm", "create", f"TeachAny-Hero-{course_id}"])
        if rc != 0:
            return False, f"创建 Notebook 失败: {err}"

        # 提取 notebook ID
        import re
        match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', out)
        if not match:
            return False, f"无法提取 Notebook ID: {out}"
        nb_id = match.group(0)
        print(f"     ✅ Notebook ID: {nb_id}")

        # 2. 设置活跃 notebook
        run_cmd(["notebooklm", "use", nb_id])

        # 3. 添加课件 HTML 作为 source
        print(f"  2️⃣  添加课件源文件...")
        rc, out, err = run_cmd([
            "notebooklm", "source", "add",
            str(html_path),
            "--type", "text",
            "--title", f"{name}"
        ], timeout=60)
        if rc != 0:
            return False, f"添加 source 失败: {err}"
        print(f"     ✅ 已添加: {html_path.name}")

        # 等待 source 被处理
        print(f"  ⏳ 等待 source 处理 ({DELAY_AFTER_SOURCE}s)...")
        time.sleep(DELAY_AFTER_SOURCE)

        # 4. 生成 infographic
        print(f"  3️⃣  生成信息图...")
        prompt = generate_prompt(course)
        rc, out, err = run_cmd([
            "notebooklm", "generate", "infographic",
            prompt,
            "--language", "zh",
            "--detail", "detailed",
            "--orientation", "landscape",
            "--wait"
        ], timeout=180)
        if rc != 0:
            return False, f"生成信息图失败: {err}"
        print(f"     ✅ 信息图已生成")

        # 等待一下
        time.sleep(DELAY_AFTER_GENERATE)

        # 5. 下载 infographic
        print(f"  4️⃣  下载信息图...")
        tmp_path = f"/tmp/hero-{course_id}.png"
        # 先清理可能存在的旧文件
        for f in Path("/tmp").glob(f"hero-{course_id}*.png"):
            f.unlink()

        rc, out, err = run_cmd([
            "notebooklm", "download", "infographic",
            tmp_path, "--force"
        ], timeout=120)

        # 处理可能的文件名变化
        actual_file = None
        if Path(tmp_path).exists():
            actual_file = Path(tmp_path)
        else:
            # 查找匹配的文件
            matches = list(Path("/tmp").glob(f"hero-{course_id}*.png"))
            if matches:
                actual_file = matches[0]

        if not actual_file or not actual_file.exists():
            return False, f"下载失败: 文件未找到 (stdout: {out[:200]})"

        # 复制到目标位置
        import shutil
        shutil.copy2(str(actual_file), str(output_path))
        file_size = output_path.stat().st_size / 1024
        print(f"     ✅ 已保存: {output_path.relative_to(PROJECT_ROOT)} ({file_size:.0f} KB)")

        # 清理临时文件
        actual_file.unlink(missing_ok=True)

        # 6. 删除 notebook（避免堆积太多）
        print(f"  5️⃣  清理 Notebook...")
        run_cmd(["notebooklm", "delete", nb_id, "--yes"], timeout=30)
        print(f"     🗑️ 已删除")

        return True, f"assets/{hero_file}"

    except Exception as e:
        # 尝试清理 notebook
        if nb_id:
            try:
                run_cmd(["notebooklm", "delete", nb_id, "--yes"], timeout=15)
            except:
                pass
        return False, f"异常: {str(e)}"


def process_with_retry(course: dict, idx: int, total: int) -> tuple[bool, str]:
    """带重试的课件处理"""
    for attempt in range(1, MAX_RETRIES + 1):
        success, msg = process_single_course(course, idx, total)
        if success:
            return True, msg

        if attempt < MAX_RETRIES:
            wait = RETRY_BACKOFF_BASE * attempt
            print(f"  ⚠️ 第{attempt}次尝试失败: {msg}")
            print(f"  ⏳ 等待 {wait}s 后重试...")
            time.sleep(wait)
        else:
            print(f"  ❌ 已达最大重试次数 ({MAX_RETRIES}): {msg}")

    return False, msg


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="TeachAny 全量 Hero 图批量生成工具")
    parser.add_argument("--batch-size", type=int, default=0,
                        help="每批处理数量，0=全量处理")
    parser.add_argument("--subject", type=str, default=None,
                        help="只处理指定学科 (math/chinese/english/biology/...)")
    parser.add_argument("--start-from", type=int, default=0,
                        help="从第N个开始处理（跳过前N-1个）")
    parser.add_argument("--dry-run", action="store_true",
                        help="仅预览不执行")
    parser.add_argument("--retry-failed", action="store_true",
                        help="重试之前失败的课件")
    parser.add_argument("--delay", type=int, default=DELAY_BETWEEN_COURSES,
                        help=f"课件间延迟秒数 (默认: {DELAY_BETWEEN_COURSES})")
    parser.add_argument("--no-update-registry", action="store_true",
                        help="不自动更新 registry.json")
    args = parser.parse_args()

    print("🚀 TeachAny 全量 Hero 图批量生成工具")
    print(f"   项目路径: {PROJECT_ROOT}")
    print(f"   时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 加载数据
    registry = load_registry()
    progress = load_progress()

    if not progress["started_at"]:
        progress["started_at"] = datetime.now().isoformat()

    # 获取缺失列表
    missing = get_missing_courses(registry, args.subject)
    print(f"📊 统计: 总课件 {registry['total']} | 缺失 hero 图: {len(missing)}")

    if args.retry_failed:
        # 只处理之前失败的
        failed_ids = set(progress.get("failed", []))
        missing = [c for c in missing if c["id"] in failed_ids]
        print(f"   重试模式: {len(missing)} 个失败课件待重试")
        # 清空失败列表
        progress["failed"] = []

    # 跳过已完成的
    completed_ids = set(progress.get("completed", []))
    todo = [c for c in missing if c["id"] not in completed_ids]
    print(f"   已完成: {len(completed_ids)} | 待处理: {len(todo)}")

    # 应用 start-from
    if args.start_from > 0:
        todo = todo[args.start_from:]
        print(f"   从第 {args.start_from + 1} 个开始: 实际处理 {len(todo)} 个")

    # 应用 batch-size
    if args.batch_size > 0:
        todo = todo[:args.batch_size]
        print(f"   本批次处理: {len(todo)} 个")

    if not todo:
        print("\n✅ 没有需要处理的课件！")
        return

    # Dry run 模式
    if args.dry_run:
        print(f"\n📋 预览模式 - 以下 {len(todo)} 个课件待处理:")
        for i, c in enumerate(todo, 1):
            subject = SUBJECT_CN.get(c.get("subject", ""), c.get("subject", ""))
            grade = GRADE_CN.get(c.get("grade", 0), "")
            print(f"  {i:3d}. [{subject}{grade}] {c['name']} ({c['id']})")
        print(f"\n去掉 --dry-run 参数即可开始生成。")
        return

    # 确认
    print(f"\n⚡ 即将开始处理 {len(todo)} 个课件")
    print(f"   预估时间: {len(todo) * (args.delay + DELAY_AFTER_SOURCE + DELAY_AFTER_GENERATE + 30) // 60} 分钟")
    print(f"   延迟设置: 课件间 {args.delay}s | source处理 {DELAY_AFTER_SOURCE}s")
    print()

    # 开始处理
    success_count = 0
    fail_count = 0
    start_time = time.time()

    for i, course in enumerate(todo, 1):
        course_id = course["id"]

        # 处理
        success, msg = process_with_retry(course, i, len(todo))

        if success:
            success_count += 1
            progress["completed"].append(course_id)

            # 更新 registry.json 中的 hero_image
            if not args.no_update_registry:
                hero_path = msg  # msg 就是 "assets/hero-xxx.png"
                for c in registry["courses"]:
                    if c["id"] == course_id:
                        c["hero_image"] = hero_path
                        break
                # 每成功10个保存一次 registry
                if success_count % 10 == 0:
                    save_registry(registry)

            print(f"  ✅ 成功! ({success_count}/{i} 完成)")
        else:
            fail_count += 1
            if course_id not in progress.get("failed", []):
                progress.setdefault("failed", []).append(course_id)
            print(f"  ❌ 失败: {msg}")

        # 保存进度
        save_progress(progress)

        # 批次暂停
        if i % BATCH_PAUSE_EVERY == 0 and i < len(todo):
            print(f"\n⏸️ 已处理 {i} 个，暂停 {BATCH_PAUSE_SECONDS}s 避免限流...")
            time.sleep(BATCH_PAUSE_SECONDS)

        # 课件间延迟
        if i < len(todo):
            time.sleep(args.delay)

    # 最终保存 registry
    if not args.no_update_registry and success_count > 0:
        save_registry(registry)

    # 汇总
    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"📊 批量生成完成")
    print(f"{'='*60}")
    print(f"  ✅ 成功: {success_count}")
    print(f"  ❌ 失败: {fail_count}")
    print(f"  ⏱️ 耗时: {elapsed/60:.1f} 分钟")
    print(f"  📝 进度文件: {PROGRESS_PATH}")

    if fail_count > 0:
        print(f"\n💡 重试失败的课件:")
        print(f"   python3 scripts/batch-hero-gen.py --retry-failed")


if __name__ == "__main__":
    main()
