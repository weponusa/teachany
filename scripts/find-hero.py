#!/usr/bin/env python3
"""
find-hero.py — TeachAny Hero 图四层降级查找工具

按优先级查找课件可用的 hero 封面图：
  L1: 课件本地 assets/*hero* （已存在直接用）
  L2: teachany-images/<subject>/ （独立图床仓库）
  L3: hero-review/ （精选评审版）
  L4: 未命中 → 输出 image_gen 推荐提示（需 AI 手动调用）

用法:
  python3 scripts/find-hero.py <课件目录>
  python3 scripts/find-hero.py <课件目录> --subject math --grade 8
  python3 scripts/find-hero.py community/ --batch

输出: JSON 格式 {level, source, path, action}
"""

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

# ─── 常量 ───────────────────────────────────────────────

HERO_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}
SUBJECT_DIRS = ['biology', 'chinese', 'english', 'history', 'math', 'physics', 'science']

# teachany-images 本地路径（与 teachany-opensource 同级）
TEACHANY_IMAGES_DIR = Path(os.environ.get(
    'TEACHANY_IMAGES_DIR',
    str(Path.home() / 'CodeBuddy' / '一次函数' / 'teachany-images')
))

# hero-review 本地路径
HERO_REVIEW_DIR = Path(os.environ.get(
    'HERO_REVIEW_DIR',
    str(Path.home() / 'CodeBuddy' / '一次函数' / 'hero-review')
))


# ─── 工具函数 ───────────────────────────────────────────

def find_hero_files(directory: Path) -> list[Path]:
    """在目录下查找所有 hero 图文件"""
    results = []
    if not directory.exists():
        return results
    for f in directory.rglob('*'):
        if f.is_file() and f.suffix.lower() in HERO_EXTENSIONS and 'hero' in f.name.lower():
            results.append(f)
    return results


def extract_course_meta(course_dir: Path) -> dict:
    """从课件 index.html 提取元信息"""
    html_path = course_dir / 'index.html'
    meta = {
        'course_id': course_dir.name,
        'subject': '',
        'grade': 0,
        'title': '',
    }
    if not html_path.exists():
        return meta

    text = html_path.read_text(encoding='utf-8', errors='ignore')

    # 提取 title
    m = re.search(r'<title>([^<]+)</title>', text)
    if m:
        meta['title'] = m.group(1).strip()

    # 提取 subject（两种格式：meta 标签 或 JSON 配置）
    m = re.search(r'<meta\s+name="teachany-subject"\s+content="([^"]+)"', text)
    if not m:
        m = re.search(r'"subject"\s*:\s*"([^"]+)"', text)
    if m:
        meta['subject'] = m.group(1).strip().lower()

    # 提取 grade（两种格式）
    m = re.search(r'<meta\s+name="teachany-grade"\s+content="(\d+)"', text)
    if not m:
        m = re.search(r'"grade"\s*:\s*(\d+)', text)
    if m:
        meta['grade'] = int(m.group(1))

    return meta


def subject_to_dirname(subject: str) -> str:
    """将学科关键词映射到 teachany-images 的目录名"""
    mapping = {
        'math': 'math', '数学': 'math',
        'physics': 'physics', '物理': 'physics',
        'chemistry': 'chemistry', '化学': 'chemistry',
        'biology': 'biology', '生物': 'biology',
        'chinese': 'chinese', '语文': 'chinese',
        'english': 'english', '英语': 'english',
        'history': 'history', '历史': 'history',
        'geography': 'geography', '地理': 'geography',
        'politics': 'politics', '政治': 'politics',
        'science': 'science', '科学': 'science',
    }
    return mapping.get(subject, subject)


def extract_keywords(course_id: str, title: str) -> list[str]:
    """从 course_id 和 title 提取搜索关键词"""
    keywords = []

    # 从 course_id 提取（如 bio-h-cell-membrane → cell-membrane）
    parts = course_id.split('-')
    # 去掉前缀（学科/学段标记）
    skip_prefixes = {'bio', 'bioh', 'h', 'm', 'e', 'chn', 'sci', 'math', 'phys',
                     'hist', 'geo', 'pol', 'eng', 'chem', 'sci'}
    meaningful = []
    for p in parts:
        if p.lower() not in skip_prefixes:
            meaningful.append(p)
    if meaningful:
        keywords.append('-'.join(meaningful))

    # 从 title 提取中文关键词（2-4 字的词）
    zh_words = re.findall(r'[\u4e00-\u9fff]{2,4}', title)
    keywords.extend(zh_words[:3])

    return keywords


# ─── 四层降级查找 ───────────────────────────────────────

def find_l1_local(course_dir: Path) -> dict | None:
    """L1: 课件本地 assets/ 下已有 hero 图"""
    assets_dir = course_dir / 'assets'
    heroes = find_hero_files(assets_dir)
    if heroes:
        best = sorted(heroes, key=lambda f: f.stat().st_size, reverse=True)[0]
        return {
            'level': 'L1',
            'source': 'local_assets',
            'path': str(best.relative_to(course_dir)),
            'size_kb': round(best.stat().st_size / 1024, 1),
            'action': 'use_existing',
        }
    return None


def find_l2_teachany_images(course_dir: Path, subject: str, keywords: list[str]) -> dict | None:
    """L2: teachany-images 独立图床按学科查找"""
    if not TEACHANY_IMAGES_DIR.exists():
        return None

    subj_dir = subject_to_dirname(subject)
    search_dirs = [TEACHANY_IMAGES_DIR / subj_dir]
    # 如果学科目录不存在，搜全部
    if not search_dirs[0].exists():
        search_dirs = [TEACHANY_IMAGES_DIR]

    candidates = []
    for d in search_dirs:
        if not d.exists():
            continue
        for f in d.rglob('*'):
            if f.is_file() and f.suffix.lower() in HERO_EXTENSIONS and 'hero' in f.name.lower():
                candidates.append(f)

    if not candidates:
        return None

    # 按关键词匹配度排序
    def match_score(f: Path) -> int:
        name = f.stem.lower()
        score = 0
        for kw in keywords:
            kw_lower = kw.lower().replace(' ', '-')
            if kw_lower in name:
                score += 10
            # 模糊匹配：关键词的每个部分
            for part in kw_lower.split('-'):
                if len(part) >= 3 and part in name:
                    score += 3
        return score

    scored = [(f, match_score(f)) for f in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)

    best, best_score = scored[0]
    if best_score == 0:
        return None  # 没有任何关键词匹配

    # 目标路径
    target = course_dir / 'assets' / f"{course_dir.name}-hero.png"

    return {
        'level': 'L2',
        'source': 'teachany-images',
        'path': str(best),
        'match_score': best_score,
        'action': 'copy_to_local',
        'target': str(target),
    }


def find_l3_hero_review(course_dir: Path, course_id: str) -> dict | None:
    """L3: hero-review 精选评审版，按 course_id 精确匹配"""
    if not HERO_REVIEW_DIR.exists():
        return None

    for f in HERO_REVIEW_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in HERO_EXTENSIONS and course_id in f.name:
            target = course_dir / 'assets' / f"{course_id}-hero.png"
            return {
                'level': 'L3',
                'source': 'hero-review',
                'path': str(f),
                'action': 'copy_to_local',
                'target': str(target),
            }
    return None


def generate_l4_hint(course_dir: Path, meta: dict) -> dict:
    """L4: 未命中，输出 image_gen 推荐提示"""
    grade = meta.get('grade', 9)
    subject = meta.get('subject', 'general')
    title = meta.get('title', course_dir.name)

    # 按学段选 prompt 模板
    if grade <= 6:
        style = 'warm cartoon illustration for elementary school students, bright vivid colors, friendly characters, simple shapes, educational poster style'
    elif grade <= 9:
        style = 'semi-realistic illustration with infographic elements, clear visual hierarchy, educational textbook style for middle school'
    else:
        style = 'academic geometric illustration, professional dark blue palette, conceptual diagram aesthetic, suitable for high school textbook cover'

    prompt = f'{title}, {style}, 16:9 horizontal composition'
    target = course_dir / 'assets' / f"{course_dir.name}-hero.png"

    return {
        'level': 'L4',
        'source': 'image_gen_required',
        'action': 'call_image_gen',
        'prompt': prompt,
        'target': str(target),
        'subject': subject,
        'grade': grade,
        'note': 'L1-L3 全未命中，需调用 image_gen 生成。生成后请回写 teachany-images 仓库。',
    }


# ─── 主流程 ─────────────────────────────────────────────

def find_hero_for_course(course_dir: Path, subject_override: str = '',
                          grade_override: int = 0, dry_run: bool = False) -> dict:
    """对单个课件执行四层降级查找"""

    course_dir = course_dir.resolve()
    if not course_dir.exists():
        return {'error': f'课件目录不存在: {course_dir}'}

    # 提取元信息
    meta = extract_course_meta(course_dir)
    if subject_override:
        meta['subject'] = subject_override.lower()
    if grade_override:
        meta['grade'] = grade_override

    keywords = extract_keywords(meta['course_id'], meta['title'])

    result = {
        'course_id': meta['course_id'],
        'title': meta['title'],
        'subject': meta['subject'],
        'grade': meta['grade'],
        'keywords': keywords,
    }

    # L1
    l1 = find_l1_local(course_dir)
    if l1:
        result['hero'] = l1
        result['hero']['status'] = 'found'
        return result

    # L2
    l2 = find_l2_teachany_images(course_dir, meta['subject'], keywords)
    if l2:
        result['hero'] = l2
        if not dry_run:
            # 自动复制
            target = Path(l2['target'])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(l2['path'], target)
            result['hero']['status'] = 'copied'
            result['hero']['copied_to'] = str(target)
        else:
            result['hero']['status'] = 'would_copy'
        return result

    # L3
    l3 = find_l3_hero_review(course_dir, meta['course_id'])
    if l3:
        result['hero'] = l3
        if not dry_run:
            target = Path(l3['target'])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(l3['path'], target)
            result['hero']['status'] = 'copied'
            result['hero']['copied_to'] = str(target)
        else:
            result['hero']['status'] = 'would_copy'
        return result

    # L4
    l4 = generate_l4_hint(course_dir, meta)
    result['hero'] = l4
    result['hero']['status'] = 'needs_generation'
    return result


def main():
    parser = argparse.ArgumentParser(description='TeachAny Hero 图四层降级查找工具')
    parser.add_argument('path', help='课件目录或 community/ 根目录')
    parser.add_argument('--subject', default='', help='学科覆盖（如 math/physics/history）')
    parser.add_argument('--grade', type=int, default=0, help='年级覆盖')
    parser.add_argument('--batch', action='store_true', help='批量模式（扫描 community/ 下所有课件）')
    parser.add_argument('--dry-run', action='store_true', help='仅查找不复制')
    parser.add_argument('--json', action='store_true', help='输出 JSON 格式')
    args = parser.parse_args()

    path = Path(args.path)

    if args.batch or (path.is_dir() and (path / 'community').exists() or path.name == 'community'):
        # 批量模式
        community_dir = path if path.name == 'community' else path / 'community'
        if not community_dir.exists():
            print(f'错误: {community_dir} 不存在', file=sys.stderr)
            sys.exit(1)

        results = []
        for d in sorted(community_dir.iterdir()):
            if not d.is_dir():
                continue
            if d.name in ('archive', 'pending', 'node_modules'):
                continue
            if not (d / 'index.html').exists():
                continue
            r = find_hero_for_course(d, args.subject, args.grade, args.dry_run)
            results.append(r)

        # 统计
        stats = {'L1': 0, 'L2': 0, 'L3': 0, 'L4': 0, 'error': 0}
        for r in results:
            if 'error' in r:
                stats['error'] += 1
            else:
                level = r['hero']['level']
                stats[level] = stats.get(level, 0) + 1

        if args.json:
            print(json.dumps({'results': results, 'stats': stats}, ensure_ascii=False, indent=2))
        else:
            print(f'\n=== Hero 查找统计 ===')
            print(f'  L1 本地已有: {stats.get("L1", 0)}')
            print(f'  L2 图床命中: {stats.get("L2", 0)}')
            print(f'  L3 精选命中: {stats.get("L3", 0)}')
            print(f'  L4 需生图:   {stats.get("L4", 0)}')
            print()

            for r in results:
                if 'error' in r:
                    print(f'  ❌ {r["error"]}')
                    continue
                hero = r['hero']
                level = hero['level']
                cid = r['course_id']
                status = hero['status']
                if level == 'L1':
                    print(f'  ✅ L1 {cid} → {hero["path"]} ({hero["size_kb"]}KB)')
                elif level in ('L2', 'L3'):
                    print(f'  ✅ {level} {cid} → {hero["status"]} from {hero["path"]}')
                elif level == 'L4':
                    print(f'  ⚠️  L4 {cid} → 需 image_gen: {hero["prompt"][:80]}...')

        # 非 0 个 L4 需要生成 → exit 1
        if stats.get('L4', 0) > 0:
            sys.exit(1)
        sys.exit(0)

    else:
        # 单课件模式
        result = find_hero_for_course(path, args.subject, args.grade, args.dry_run)
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            if 'error' in result:
                print(f'❌ {result["error"]}')
                sys.exit(1)
            hero = result['hero']
            level = hero['level']
            print(f'\n课件: {result["course_id"]}《{result["title"]}》')
            print(f'学科: {result["subject"]}  年级: G{result["grade"]}')
            print(f'搜索关键词: {result["keywords"]}')
            print()
            if level == 'L1':
                print(f'✅ L1 本地命中: {hero["path"]} ({hero["size_kb"]}KB)')
                print(f'   动作: 直接使用，无需重新生成')
            elif level in ('L2', 'L3'):
                print(f'✅ {level} 命中: {hero["path"]}')
                print(f'   动作: {hero["action"]} → {hero.get("target", "?")}')
                if hero['status'] == 'copied':
                    print(f'   ✅ 已复制')
                elif hero['status'] == 'would_copy':
                    print(f'   (dry-run，未实际复制)')
            elif level == 'L4':
                print(f'⚠️  L1-L3 全未命中，需调用 image_gen')
                print(f'   推荐 prompt: {hero["prompt"]}')
                print(f'   目标路径: {hero["target"]}')
                print(f'   学科: {hero["subject"]}  学段: G{hero["grade"]}')
                print(f'   生成后请回写: teachany-images/{subject_to_dirname(hero["subject"])}/')

        if result.get('hero', {}).get('status') == 'needs_generation':
            sys.exit(1)


if __name__ == '__main__':
    main()
