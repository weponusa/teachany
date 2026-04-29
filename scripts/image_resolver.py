#!/usr/bin/env python3
"""TeachAny Image Resolver — 统一图片资源发现工具。

与 knowledge_layer.py 采用同构设计：多评分匹配 + 别名支持 + 降级链。

子命令:
  resolve   -- 查找匹配图片（核心功能）
  register  -- 注册新图片到 image-registry.json
  audit     -- 审计 registry 覆盖率
  migrate   -- 迁移 hero-review/ 旧格式图片到正确位置

No third-party dependencies.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "skill" / "assets" / "image-registry.json"
COURSE_REGISTRY_PATH = ROOT / "registry.json"
# hero-review 可能在项目内或上级目录
HERO_REVIEW_DIR = ROOT / "hero-review" if (ROOT / "hero-review").exists() else ROOT.parent / "hero-review"
IMAGE_REPO_DIR = ROOT / "teachany-images"  # 本地 CDN 仓库镜像

CDN_BASE = "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main"
CDN_FALLBACKS = [
    "https://raw.githubusercontent.com/weponusa/teachany-images/main",
    "https://ghfast.top/https://raw.githubusercontent.com/weponusa/teachany-images/main",
]


# ═══════════════════════════════════════════════════════════════
#  工具函数（与 knowledge_layer.py 共享设计）
# ═══════════════════════════════════════════════════════════════

def normalize_text(text: str) -> str:
    """规范化文本，用于模糊匹配（与 knowledge_layer.py 完全一致）"""
    text = text.lower().strip()
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "", text)
    return text


def resolve_subject(subject: Optional[str]) -> Optional[str]:
    """学科名规范化（与 knowledge_layer.py 共享映射）"""
    if not subject:
        return None
    aliases = {
        "math": ["math", "数学"],
        "chinese": ["chinese", "语文", "中文"],
        "english": ["english", "英语"],
        "physics": ["physics", "物理"],
        "chemistry": ["chemistry", "化学"],
        "biology": ["biology", "bio", "生物", "生物学"],
        "science": ["science", "sci", "科学", "小学科学"],
        "geography": ["geography", "geo", "地理"],
        "history": ["history", "hist", "历史"],
        "info-tech": ["info-tech", "信息技术", "信息", "编程", "ai"],
    }
    norm = normalize_text(subject)
    for canonical, names in aliases.items():
        for name in names:
            if normalize_text(name) == norm:
                return canonical
    return subject


# node_id 别名映射（与 knowledge_layer.py 共享同一套）
NODE_ID_ALIASES: Dict[str, List[str]] = {
    "periodic-table": ["element-concept"],
    "atomic-structure": ["atom-structure"],
    # 常见 manifest node_id → image-registry match_nodes 映射
    "bio-photosynthesis": ["bio-m-photosynthesis-m"],
    "chem-periodic-table": ["chem-m-periodic-table"],
    "chem-oxidation-reduction": ["chem-h-oxidation-reduction"],
    "imperial-unification": ["hist-m-imperial-unification"],
    "teachany-phy-mid-pressure": ["phy-m-pressure"],
    "geo-monsoon": ["geo-m-monsoon"],
    "chn-compound-vowel": ["chn-e-compound-vowel"],
    "chinese-erta-stories": ["chn-m-erta-stories"],
    "history-sanguo-sui-tang": ["hist-m-sanguo-sui-tang"],
    "eng-there-be": ["eng-e-there-be"],
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_registry() -> Dict[str, Any]:
    if REGISTRY_PATH.exists():
        return load_json(REGISTRY_PATH)
    return {"version": "3.0", "images": []}


def load_course_registry() -> List[Dict[str, Any]]:
    if COURSE_REGISTRY_PATH.exists():
        data = load_json(COURSE_REGISTRY_PATH)
        return data.get("courses", data) if isinstance(data, dict) else data
    return []


# ═══════════════════════════════════════════════════════════════
#  核心匹配算法（与 find_tree_node() 同构）
# ═══════════════════════════════════════════════════════════════

def resolve_image(
    node_id: Optional[str] = None,
    slot: Optional[str] = None,
    subject: Optional[str] = None,
    tags: Optional[List[str]] = None,
    grade: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """在 image-registry.json 中查找匹配的图片，返回带评分的匹配列表。

    与 knowledge_layer.py 的 find_tree_node() 采用相同的多评分策略：
      1. 精确 node_id + slot 匹配（500 分）
      2. 别名匹配（480 分）
      3. node_id 精确但 slot 不同（300 分）
      4. subject + slot + tags 模糊匹配（200 + tag重叠×50）
      5. subject + slot 仅学科匹配（100 分）
      6. node_id 部分词在 tags 中（40 分/词）
      7. grade 匹配加分（30 分）
    """
    registry = load_registry()
    images = registry.get("images", [])
    subject = resolve_subject(subject)
    tags = tags or []

    # 展开别名
    search_ids = [node_id] if node_id else []
    if node_id and node_id in NODE_ID_ALIASES:
        search_ids.extend(NODE_ID_ALIASES[node_id])

    matches: List[Dict[str, Any]] = []

    for img in images:
        img_nodes = img.get("match_nodes", [])
        img_slot = img.get("slot", "")
        img_subject = resolve_subject(img.get("subject", ""))
        img_tags = img.get("tags", [])
        img_grade = img.get("grade")
        score = 0

        # ── 第一梯队：精确匹配 ──

        # 1. node_id + slot 精确匹配 → 500 分
        node_matched = False
        if node_id and any(nid in img_nodes for nid in search_ids):
            node_matched = True
            if slot and img_slot == slot:
                score += 500
            elif not slot:
                score += 500  # 未指定 slot 时，node_id 匹配即可
            else:
                # 3. node_id 精确但 slot 不同 → 300 分
                score += 300

        # ── 第二梯队：别名匹配 ──

        # 2. 别名反向匹配
        if node_id and not node_matched:
            for alias_key, alias_targets in NODE_ID_ALIASES.items():
                if any(nid in alias_targets for nid in img_nodes) and alias_key == node_id:
                    if slot and img_slot == slot:
                        score += 480
                    elif not slot:
                        score += 480
                    else:
                        score += 280
                    break

        # ── 第三梯队：模糊匹配 ──

        # 4. subject + slot + tags 交集
        if subject and img_subject == subject:
            slot_ok = (not slot) or img_slot == slot
            if slot_ok and tags:
                overlap = len(set(tags) & set(img_tags))
                if overlap > 0:
                    score += 200 + overlap * 50

        # 5. subject + slot 仅学科匹配
        if subject and img_subject == subject and score == 0:
            slot_ok = (not slot) or img_slot == slot
            if slot_ok:
                score += 100

        # ── 第四梯队：交叉匹配 ──

        # 6. node_id 部分词在 tags 中
        if node_id and score < 200:
            node_parts = re.split(r"[-_]", node_id)
            tags_text = " ".join(img_tags)
            for part in node_parts:
                if len(part) >= 3 and part in tags_text:
                    score += 40

        # ── 加分项 ──

        # 7. grade 匹配
        if grade is not None and img_grade is not None and grade == img_grade:
            score += 30

        if score > 0:
            matches.append({
                "score": score,
                "image_id": img.get("id", ""),
                "file": img.get("file", ""),
                "url": img.get("url", ""),
                "slot": img_slot,
                "subject": img_subject,
                "match_nodes": img_nodes,
                "tags": img_tags,
                "local_filename": Path(img.get("file", "")).name,
            })

    matches.sort(key=lambda m: (-m["score"], m["image_id"]))
    return matches


# ═══════════════════════════════════════════════════════════════
#  注册新图片（与 link_courseware_to_tree() 同构）
# ═══════════════════════════════════════════════════════════════

def register_image(
    node_id: str,
    slot: str,
    subject: str,
    file_path: str,
    prompt: str = "",
    tags: Optional[List[str]] = None,
    grade: Optional[int] = None,
    generator: str = "image_gen",
) -> Dict[str, Any]:
    """注册新图片到 image-registry.json。

    与 link_courseware_to_tree() 的逻辑对应：
    - 检查是否已存在同 node_id + slot 的记录
    - 存在则更新，不存在则新增
    - 自动生成 id、url 等字段
    """
    registry = load_registry()
    images = registry.get("images", [])
    subject = resolve_subject(subject) or subject

    # 生成标准 ID
    filename = Path(file_path).name
    stem = Path(file_path).stem
    image_id = f"{subject}-{stem}" if not stem.startswith(subject) else stem

    # 检查是否已存在
    existing_idx = None
    for idx, img in enumerate(images):
        if node_id in img.get("match_nodes", []) and img.get("slot") == slot:
            existing_idx = idx
            break

    cdn_url = f"{CDN_BASE}/{file_path}"

    entry = {
        "id": image_id,
        "file": file_path,
        "url": cdn_url,
        "subject": subject,
        "tags": tags or _extract_tags(node_id, slot),
        "slot": slot,
        "match_nodes": [node_id],
        "prompt": prompt,
        "size": "1024x1024",
        "quality": "medium",
        "style": "natural",
        "generator": generator,
        "generated": True,
        "created": _today(),
    }

    if grade is not None:
        entry["grade"] = grade

    if existing_idx is not None:
        # 保留旧的 match_nodes 并合并
        old_nodes = images[existing_idx].get("match_nodes", [])
        merged_nodes = list(set(old_nodes + [node_id]))
        entry["match_nodes"] = merged_nodes
        images[existing_idx] = entry
        action = "updated"
    else:
        images.append(entry)
        action = "created"

    registry["images"] = images
    registry["updated"] = _today()
    if "version" not in registry or registry["version"] < "3.0":
        registry["version"] = "3.0"

    save_json(REGISTRY_PATH, registry)

    return {
        "action": action,
        "image_id": image_id,
        "node_id": node_id,
        "slot": slot,
        "file": file_path,
        "url": cdn_url,
    }


def _extract_tags(node_id: str, slot: str) -> List[str]:
    """从 node_id 中提取标签"""
    parts = re.split(r"[-_]", node_id)
    # 过滤掉太短的和学科前缀
    subjects = {"math", "bio", "chem", "phy", "geo", "hist", "chn", "eng", "sci"}
    stages = {"m", "h", "e", "mid", "high", "elem"}
    tags = [p for p in parts if len(p) >= 3 and p not in subjects and p not in stages]
    tags.append(slot)
    return tags


def _today() -> str:
    from datetime import date
    return date.today().isoformat()


# ═══════════════════════════════════════════════════════════════
#  审计（与 knowledge_layer.py audit 同构）
# ═══════════════════════════════════════════════════════════════

def audit_coverage() -> Dict[str, Any]:
    """审计 image-registry.json 对所有课件的覆盖率"""
    registry = load_registry()
    images = registry.get("images", [])
    courses = load_course_registry()

    # 按 node_id + slot 建立索引
    covered_nodes: Dict[str, set] = {}  # node_id → set of slots
    for img in images:
        for nid in img.get("match_nodes", []):
            covered_nodes.setdefault(nid, set()).add(img.get("slot", ""))

    total = len(courses)
    with_hero_in_registry = 0
    with_hero_local = 0
    missing_hero = []

    subject_stats: Dict[str, Dict[str, int]] = {}

    for course in courses:
        node_id = course.get("node_id", "")
        course_id = course.get("id", "")
        subject = resolve_subject(course.get("subject", "")) or "unknown"
        hero_image = course.get("hero_image", "")

        stats = subject_stats.setdefault(subject, {"total": 0, "in_registry": 0, "local_only": 0, "missing": 0})
        stats["total"] += 1

        # 检查 registry 覆盖
        has_registry = node_id in covered_nodes and "hero" in covered_nodes[node_id]

        if has_registry:
            with_hero_in_registry += 1
            stats["in_registry"] += 1
        elif hero_image:
            with_hero_local += 1
            stats["local_only"] += 1
        else:
            missing_hero.append({
                "course_id": course_id,
                "node_id": node_id,
                "subject": subject,
                "grade": course.get("grade"),
                "name": course.get("name", ""),
            })
            stats["missing"] += 1

    return {
        "total_courses": total,
        "hero_in_registry": with_hero_in_registry,
        "hero_local_only": with_hero_local,
        "hero_missing": len(missing_hero),
        "coverage_pct": round(with_hero_in_registry / total * 100, 1) if total else 0,
        "total_images_in_registry": len(images),
        "subject_breakdown": subject_stats,
        "missing_courses": missing_hero[:20],  # 只显示前 20 个
        "missing_count": len(missing_hero),
    }


# ═══════════════════════════════════════════════════════════════
#  迁移 hero-review/ 到正确位置
# ═══════════════════════════════════════════════════════════════

def parse_hero_review_filename(filename: str) -> Dict[str, str]:
    """解析 hero-review/ 中的旧格式文件名

    旧格式：{subject}_{gradeN}_{node_id}.png
    示例：math_grade7_math-mid-linear-function.png
    返回：{"subject": "math", "grade": "7", "node_id": "math-mid-linear-function"}
    """
    stem = Path(filename).stem
    parts = stem.split("_", 2)  # 最多分 3 段
    if len(parts) < 3:
        return {}

    subject = parts[0]
    grade_str = parts[1].replace("grade", "")
    node_id = parts[2]

    return {
        "subject": subject,
        "grade": grade_str,
        "node_id": node_id,
    }


def find_course_by_node_id(node_id: str, courses: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """通过 node_id 在 registry.json 中查找课件

    优先级：
    1. course.id 精确匹配（hero-review 文件名中的 node_id 可能实际是 course ID）
    2. course.node_id 精确匹配
    3. node_id 末尾部分模糊匹配 course.node_id
    """
    # 1. course ID 精确匹配
    for course in courses:
        if course.get("id") == node_id:
            return course

    # 2. node_id 精确匹配
    for course in courses:
        if course.get("node_id") == node_id:
            return course

    # 3. 模糊匹配：提取核心部分比较
    node_core = node_id.split("-", 2)[-1] if node_id.count("-") >= 2 else node_id
    if len(node_core) >= 4:
        for course in courses:
            c_nid = course.get("node_id", "")
            c_core = c_nid.split("-", 2)[-1] if c_nid.count("-") >= 2 else c_nid
            if c_core == node_core:
                return course

    return None


def derive_abbreviation(course_id: str) -> str:
    """从 course_id 推导出图片缩写

    规则与 IMAGE-NAMING-SPEC.md 一致：
    - 取 course_id 中最核心的 1-2 个英文词
    - 去掉学科前缀和阶段标记
    """
    # 去掉常见前缀
    prefixes_to_remove = [
        "math-", "bio-", "chem-", "phy-", "geo-", "hist-", "chn-", "eng-", "sci-",
        "teachany-", "course-",
    ]
    abbrev = course_id
    for prefix in prefixes_to_remove:
        if abbrev.startswith(prefix):
            abbrev = abbrev[len(prefix):]
            break

    # 去掉阶段标记
    stage_prefixes = ["mid-", "high-", "elem-", "e-", "m-", "h-"]
    for sp in stage_prefixes:
        if abbrev.startswith(sp):
            abbrev = abbrev[len(sp):]
            break

    return abbrev


def migrate_hero_review(
    dry_run: bool = True,
    target_cdn_dir: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """迁移 hero-review/ 中的图片到正确位置

    1. 解析旧文件名 → 提取 node_id
    2. 查 registry.json → 找到 course_id
    3. 推导缩写 → 生成标准文件名
    4. 复制到 CDN 仓库目录
    5. 复制到课件 assets/ 目录
    6. 注册到 image-registry.json
    """
    if not HERO_REVIEW_DIR.exists():
        return [{"error": f"hero-review/ 目录不存在: {HERO_REVIEW_DIR}"}]

    courses = load_course_registry()
    cdn_dir = target_cdn_dir or IMAGE_REPO_DIR
    results = []

    for img_path in sorted(HERO_REVIEW_DIR.iterdir()):
        if not img_path.is_file() or img_path.suffix.lower() not in (".png", ".jpg", ".webp"):
            continue

        parsed = parse_hero_review_filename(img_path.name)
        if not parsed:
            results.append({
                "file": img_path.name,
                "status": "skipped",
                "reason": "无法解析文件名",
            })
            continue

        node_id = parsed["node_id"]
        subject = resolve_subject(parsed["subject"]) or parsed["subject"]
        grade = int(parsed["grade"]) if parsed["grade"].isdigit() else None

        # 查找对应课件
        course = find_course_by_node_id(node_id, courses)
        if not course:
            # 尝试补全 node_id 前缀
            prefixed_nid = f"{subject[0:3]}-{'m' if (grade or 7) <= 9 else 'h'}-{node_id.split('-', 2)[-1] if '-' in node_id else node_id}"
            course = find_course_by_node_id(prefixed_nid, courses)

        if course:
            course_id = course["id"]
            abbrev = derive_abbreviation(course_id)
            actual_node_id = course.get("node_id", node_id)
        else:
            course_id = node_id
            abbrev = derive_abbreviation(node_id)
            actual_node_id = node_id

        # 标准文件名
        ext = img_path.suffix
        new_filename = f"{abbrev}-hero{ext}"
        cdn_relative = f"{subject}/{new_filename}"

        # 目标路径
        cdn_target = cdn_dir / subject / new_filename

        # 课件 assets 目标路径
        course_assets = None
        for base in [ROOT / "examples", ROOT / "community"]:
            candidate = base / course_id / "assets" / new_filename
            if (base / course_id).exists():
                course_assets = candidate
                break

        result = {
            "file": img_path.name,
            "node_id": actual_node_id,
            "course_id": course_id,
            "subject": subject,
            "grade": grade,
            "abbrev": abbrev,
            "new_filename": new_filename,
            "cdn_relative": cdn_relative,
            "cdn_target": str(cdn_target),
            "course_assets": str(course_assets) if course_assets else None,
            "status": "planned" if dry_run else "migrated",
        }

        if not dry_run:
            # 复制到 CDN 目录
            cdn_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img_path, cdn_target)

            # 复制到课件 assets
            if course_assets:
                course_assets.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(img_path, course_assets)

            # 注册到 image-registry.json
            register_image(
                node_id=actual_node_id,
                slot="hero",
                subject=subject,
                file_path=cdn_relative,
                grade=grade,
                generator="openrouter",
            )

            result["status"] = "migrated"

        results.append(result)

    return results


# ═══════════════════════════════════════════════════════════════
#  CLI 入口
# ═══════════════════════════════════════════════════════════════

def print_resolve_human(matches: List[Dict[str, Any]], args) -> None:
    query_parts = []
    if args.node_id:
        query_parts.append(f"node_id={args.node_id}")
    if args.slot:
        query_parts.append(f"slot={args.slot}")
    if args.subject:
        query_parts.append(f"subject={args.subject}")
    query = ", ".join(query_parts) or "all"

    print(f"# Image Resolve: {query}")
    if not matches:
        print("No matching images found.")
        print("→ Fallback: use image_gen to generate, then register via `image_resolver.py register`")
        return

    for idx, m in enumerate(matches[:10], 1):
        print()
        print(f"## Match {idx} (score: {m['score']})")
        print(f"- ID: {m['image_id']}")
        print(f"- Slot: {m['slot']}")
        print(f"- Subject: {m['subject']}")
        print(f"- Nodes: {', '.join(m['match_nodes'])}")
        print(f"- File: {m['file']}")
        print(f"- URL: {m['url']}")
        print(f"- Local filename: {m['local_filename']}")

    if len(matches) > 10:
        print(f"\n... and {len(matches) - 10} more matches")


def print_audit_human(result: Dict[str, Any]) -> None:
    print("# Image Registry Audit Report")
    print(f"- Total courses: {result['total_courses']}")
    print(f"- Hero in CDN registry: {result['hero_in_registry']} ({result['coverage_pct']}%)")
    print(f"- Hero local only: {result['hero_local_only']}")
    print(f"- Hero missing: {result['hero_missing']}")
    print(f"- Total images in registry: {result['total_images_in_registry']}")
    print()
    print("## Subject Breakdown")
    for subject, stats in sorted(result.get("subject_breakdown", {}).items()):
        total = stats["total"]
        covered = stats["in_registry"]
        pct = round(covered / total * 100, 1) if total else 0
        print(f"  {subject:12s}  total={total:3d}  registry={covered:3d} ({pct:5.1f}%)  local={stats['local_only']:3d}  missing={stats['missing']:3d}")

    missing = result.get("missing_courses", [])
    if missing:
        print()
        print(f"## Missing Hero Images (showing {len(missing)}/{result['missing_count']})")
        for c in missing:
            print(f"  - [{c['subject']}] {c['course_id']} ({c['name']}) node={c['node_id']}")


def print_migrate_human(results: List[Dict[str, Any]], dry_run: bool) -> None:
    mode = "DRY RUN" if dry_run else "EXECUTED"
    print(f"# Migrate hero-review/ ({mode})")
    print(f"Total files: {len(results)}")
    print()

    for r in results:
        if "error" in r:
            print(f"⚠️ {r.get('error')}")
            continue
        status = r.get("status", "unknown")
        status_icon = "📋" if status == "planned" else ("✅" if status == "migrated" else "⚠️")
        print(f"{status_icon} {r.get('file', '?')}")
        if r.get("reason"):
            print(f"   → {r['reason']}")
            continue
        print(f"   → node_id: {r.get('node_id')}")
        print(f"   → course_id: {r.get('course_id')}")
        print(f"   → new_filename: {r.get('new_filename')}")
        print(f"   → cdn_relative: {r.get('cdn_relative')}")
        if r.get("course_assets"):
            print(f"   → course_assets: {r.get('course_assets')}")


def main():
    parser = argparse.ArgumentParser(
        description="TeachAny Image Resolver — 统一图片资源发现工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command")

    # resolve
    p_resolve = sub.add_parser("resolve", help="查找匹配图片")
    p_resolve.add_argument("--node-id", "-n", help="课件的 node_id")
    p_resolve.add_argument("--slot", "-s", help="图片类型 (hero/scene/experiment/concept/abt-intro)")
    p_resolve.add_argument("--subject", "-S", help="学科")
    p_resolve.add_argument("--tags", "-t", nargs="*", help="标签列表")
    p_resolve.add_argument("--grade", "-g", type=int, help="年级")
    p_resolve.add_argument("--json", action="store_true", help="JSON 输出")

    # register
    p_register = sub.add_parser("register", help="注册新图片")
    p_register.add_argument("--node-id", "-n", required=True, help="关联的 node_id")
    p_register.add_argument("--slot", "-s", required=True, help="图片类型")
    p_register.add_argument("--subject", "-S", required=True, help="学科")
    p_register.add_argument("--file", "-f", required=True, help="CDN 相对路径 (如 math/linear-hero.png)")
    p_register.add_argument("--prompt", "-p", default="", help="生成时的 prompt")
    p_register.add_argument("--tags", "-t", nargs="*", help="标签列表")
    p_register.add_argument("--grade", "-g", type=int, help="年级")
    p_register.add_argument("--generator", default="image_gen", help="生成器 (image_gen/openrouter/nano-banana)")
    p_register.add_argument("--json", action="store_true", help="JSON 输出")

    # audit
    p_audit = sub.add_parser("audit", help="审计 registry 覆盖率")
    p_audit.add_argument("--json", action="store_true", help="JSON 输出")

    # migrate
    p_migrate = sub.add_parser("migrate", help="迁移 hero-review/ 旧格式图片")
    p_migrate.add_argument("--execute", action="store_true", help="实际执行迁移（默认 dry-run）")
    p_migrate.add_argument("--cdn-dir", help="CDN 仓库本地目录 (默认 teachany-images/)")
    p_migrate.add_argument("--json", action="store_true", help="JSON 输出")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    use_json = getattr(args, "json", False)

    if args.command == "resolve":
        matches = resolve_image(
            node_id=args.node_id,
            slot=args.slot,
            subject=args.subject,
            tags=args.tags,
            grade=args.grade,
        )
        if use_json:
            # 构建结果
            result = {
                "query": {
                    "node_id": args.node_id,
                    "slot": args.slot,
                    "subject": args.subject,
                    "tags": args.tags,
                    "grade": args.grade,
                },
                "matches": matches,
                "best": matches[0] if matches else None,
                "action": "download" if matches and matches[0]["score"] >= 200 else "generate",
            }
            json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
            print()
        else:
            print_resolve_human(matches, args)

    elif args.command == "register":
        result = register_image(
            node_id=args.node_id,
            slot=args.slot,
            subject=args.subject,
            file_path=args.file,
            prompt=args.prompt,
            tags=args.tags,
            grade=args.grade,
            generator=args.generator,
        )
        if use_json:
            json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
            print()
        else:
            icon = "✏️" if result["action"] == "updated" else "✅"
            print(f"{icon} {result['action']}: {result['image_id']}")
            print(f"   node_id: {result['node_id']}")
            print(f"   slot: {result['slot']}")
            print(f"   file: {result['file']}")
            print(f"   url: {result['url']}")

    elif args.command == "audit":
        result = audit_coverage()
        if use_json:
            json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
            print()
        else:
            print_audit_human(result)

    elif args.command == "migrate":
        cdn_dir = Path(args.cdn_dir) if args.cdn_dir else None
        results = migrate_hero_review(dry_run=not args.execute, target_cdn_dir=cdn_dir)
        if use_json:
            json.dump(results, sys.stdout, ensure_ascii=False, indent=2)
            print()
        else:
            print_migrate_human(results, dry_run=not args.execute)


if __name__ == "__main__":
    main()
