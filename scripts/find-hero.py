#!/usr/bin/env python3
"""
find-hero.py — TeachAny Hero 图查找工具（CDN 优先版）

按优先级查找课件可用的 hero 封面图，返回 CDN URL：
  L1: image-registry.json 索引 → CDN URL
  L2: CDN 命名规则探测（{subject}/{keyword}-hero.png）
  L3: image_gen 兜底 → 生成后上传图床 → 返回 CDN URL

不再复制图片到课件本地 assets/，HTML 直接引用 CDN URL。
离线/导出场景由 export-pptx.py 等脚本按需下载。

用法:
  python3 scripts/find-hero.py <课件目录>
  python3 scripts/find-hero.py <课件目录> --subject math --grade 8
  python3 scripts/find-hero.py community/ --batch
  python3 scripts/find-hero.py <课件目录> --cdn   # 默认模式，返回 CDN URL
  python3 scripts/find-hero.py <课件目录> --local  # 兼容模式，下载到本地 assets/

输出: JSON 格式 {level, source, url, action}
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

# ─── 常量 ───────────────────────────────────────────────

HERO_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}
SUBJECT_DIRS = ['biology', 'chinese', 'english', 'history', 'math', 'physics', 'science', 'geography', 'chemistry']

# CDN 配置
CDN_BASE = "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main"
CDN_FALLBACKS = [
    "https://raw.githubusercontent.com/weponusa/teachany-images/main",
    "https://ghfast.top/https://raw.githubusercontent.com/weponusa/teachany-images/main",
]

# teachany-images 本地路径（用于 --local 模式和 L3 上传）
TEACHANY_IMAGES_DIR = Path(os.environ.get(
    'TEACHANY_IMAGES_DIR',
    str(Path.home() / 'CodeBuddy' / '一次函数' / 'teachany-images')
))

# image-registry.json 路径
SCRIPT_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPT_DIR.parent / "skill" / "assets" / "image-registry.json"


# ─── 工具函数 ───────────────────────────────────────────

def load_registry() -> dict:
    """加载 image-registry.json"""
    if REGISTRY_PATH.exists():
        with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"images": [], "cdn_base": CDN_BASE}


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

    # 提取 subject
    m = re.search(r'<meta\s+name="teachany-subject"\s+content="([^"]+)"', text)
    if not m:
        m = re.search(r'"subject"\s*:\s*"([^"]+)"', text)
    if m:
        meta['subject'] = m.group(1).strip().lower()

    # 提取 grade
    m = re.search(r'<meta\s+name="teachany-grade"\s+content="(\d+)"', text)
    if not m:
        m = re.search(r'"grade"\s*:\s*(\d+)', text)
    if m:
        meta['grade'] = int(m.group(1))

    return meta


def subject_to_dirname(subject: str) -> str:
    """将学科关键词映射到 CDN 目录名"""
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
    skip_prefixes = {'bio', 'bioh', 'h', 'm', 'e', 'chn', 'sci', 'math', 'phys',
                     'hist', 'geo', 'pol', 'eng', 'chem', 'sci', 'info'}
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


def build_cdn_url(subject: str, keyword: str) -> str:
    """构造 CDN URL"""
    subj_dir = subject_to_dirname(subject)
    return f"{CDN_BASE}/{subj_dir}/{keyword}-hero.png"


# ─── L1：image-registry.json 索引查找 ────────────────────

def find_l1_registry(course_id: str, subject: str, keywords: list[str]) -> dict | None:
    """L1: 从 image-registry.json 查找匹配的 CDN URL"""
    registry = load_registry()
    images = registry.get("images", [])
    cdn_base = registry.get("cdn_base", CDN_BASE)

    # 1. 精确匹配 match_nodes
    for img in images:
        if img.get("slot") != "hero":
            continue
        match_nodes = img.get("match_nodes", [])
        if course_id in match_nodes:
            url = img.get("url") or f"{cdn_base}/{img.get('file', '')}"
            return {
                'level': 'L1',
                'source': 'image-registry',
                'url': url,
                'file': img.get('file', ''),
                'id': img.get('id', ''),
                'action': 'use_cdn_url',
            }

    # 2. 标签匹配
    norm_keywords = [kw.lower().replace(' ', '-') for kw in keywords]
    best_match = None
    best_score = 0

    for img in images:
        if img.get("slot") != "hero":
            continue
        img_subject = img.get("subject", "")
        img_tags = [t.lower() for t in img.get("tags", [])]

        # 学科必须匹配
        if subject and img_subject != subject_to_dirname(subject):
            continue

        score = 0
        for kw in norm_keywords:
            for tag in img_tags:
                if kw == tag:
                    score += 10
                elif kw in tag or tag in kw:
                    score += 5

        if score > best_score:
            best_score = score
            best_match = img

    if best_match and best_score >= 5:
        url = best_match.get("url") or f"{cdn_base}/{best_match.get('file', '')}"
        return {
            'level': 'L1',
            'source': 'image-registry',
            'url': url,
            'file': best_match.get('file', ''),
            'id': best_match.get('id', ''),
            'match_score': best_score,
            'action': 'use_cdn_url',
        }

    return None


# ─── L2：CDN 命名规则探测 ───────────────────────────────

def find_l2_cdn_probe(subject: str, keywords: list[str]) -> dict | None:
    """L2: 按命名规则构造 CDN URL 并探测可用性

    注意：此函数不实际发起 HTTP 请求（避免依赖），
    而是返回最可能的 CDN URL，由调用方验证。
    """
    if not subject or not keywords:
        return None

    subj_dir = subject_to_dirname(subject)

    # 尝试每个关键词
    for kw in keywords:
        kw_slug = kw.lower().replace(' ', '-')
        url = f"{CDN_BASE}/{subj_dir}/{kw_slug}-hero.png"
        file_path = f"{subj_dir}/{kw_slug}-hero.png"

        return {
            'level': 'L2',
            'source': 'cdn_naming_convention',
            'url': url,
            'file': file_path,
            'keyword': kw_slug,
            'action': 'use_cdn_url',
            'note': 'CDN URL 已构造，需验证是否可访问（curl -sI URL）',
        }

    return None


# ─── L3：image_gen 兜底 ─────────────────────────────────

def generate_l3_hint(course_dir: Path, meta: dict) -> dict:
    """L3: 未命中，输出 image_gen 推荐提示 + 上传图床指引"""
    grade = meta.get('grade', 9)
    subject = meta.get('subject', 'general')
    title = meta.get('title', course_dir.name)
    course_id = meta.get('course_id', course_dir.name)

    # 按学段选 prompt 模板
    if grade <= 6:
        style = 'warm cartoon illustration for elementary school students, bright vivid colors, friendly characters, simple shapes, educational poster style'
    elif grade <= 9:
        style = 'semi-realistic illustration with infographic elements, clear visual hierarchy, educational textbook style for middle school'
    else:
        style = 'academic geometric illustration, professional dark blue palette, conceptual diagram aesthetic, suitable for high school textbook cover'

    prompt = f'{title}, {style}, 16:9 horizontal composition'

    # 构造目标 CDN 路径
    subj_dir = subject_to_dirname(subject)
    keywords = extract_keywords(course_id, title)
    keyword_slug = keywords[0] if keywords else course_id
    target_cdn_file = f"{subj_dir}/{keyword_slug}-hero.png"
    target_cdn_url = f"{CDN_BASE}/{target_cdn_file}"

    return {
        'level': 'L3',
        'source': 'image_gen_required',
        'action': 'generate_and_upload',
        'prompt': prompt,
        'target_cdn_url': target_cdn_url,
        'target_cdn_file': target_cdn_file,
        'subject': subject,
        'grade': grade,
        'steps': [
            f'1. 调用 image_gen 生成 hero 图（prompt: {prompt[:80]}...）',
            f'2. 上传到 teachany-images: git add {target_cdn_file} && git commit && git push',
            f'3. 注册索引: python3 scripts/image_resolver.py register --id {subj_dir}-{keyword_slug}-hero --file {target_cdn_file} --subject {subj_dir} --slot hero --match-nodes {course_id}',
            f'4. HTML 引用: <img src="{target_cdn_url}">',
        ],
    }


# ─── 本地兼容模式（--local）─────────────────────────────

def find_local_hero(course_dir: Path) -> dict | None:
    """查找课件本地 assets/ 下已有的 hero 图（兼容旧课件）"""
    assets_dir = course_dir / 'assets'
    if not assets_dir.exists():
        return None

    for f in assets_dir.rglob('*'):
        if f.is_file() and f.suffix.lower() in HERO_EXTENSIONS and 'hero' in f.name.lower():
            return {
                'level': 'L0',
                'source': 'local_assets',
                'path': str(f.relative_to(course_dir)),
                'size_kb': round(f.stat().st_size / 1024, 1),
                'action': 'use_local',
                'note': '本地文件，建议迁移到 CDN 以减小仓库体积',
            }
    return None


def download_cdn_to_local(cdn_url: str, course_dir: Path, course_id: str) -> dict | None:
    """将 CDN 图片下载到课件本地 assets/（--local 模式用）"""
    try:
        import urllib.request
        assets_dir = course_dir / 'assets'
        assets_dir.mkdir(parents=True, exist_ok=True)
        target = assets_dir / f"{course_id}-hero.png"
        urllib.request.urlretrieve(cdn_url, str(target))
        return {
            'action': 'downloaded',
            'local_path': str(target.relative_to(course_dir)),
            'cdn_url': cdn_url,
        }
    except Exception as e:
        return {'action': 'download_failed', 'error': str(e), 'cdn_url': cdn_url}


# ─── 主流程 ─────────────────────────────────────────────

def find_hero_for_course(course_dir: Path, subject_override: str = '',
                          grade_override: int = 0, cdn_mode: bool = True,
                          dry_run: bool = False) -> dict:
    """对单个课件执行查找"""

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

    # CDN 模式（默认）：L1 → L2 → L3
    if cdn_mode:
        # L1: image-registry.json
        l1 = find_l1_registry(meta['course_id'], meta['subject'], keywords)
        if l1:
            result['hero'] = l1
            result['hero']['status'] = 'found'
            return result

        # L2: CDN 命名规则探测
        l2 = find_l2_cdn_probe(meta['subject'], keywords)
        if l2:
            result['hero'] = l2
            result['hero']['status'] = 'found'
            return result

        # L3: image_gen 兜底
        l3 = generate_l3_hint(course_dir, meta)
        result['hero'] = l3
        result['hero']['status'] = 'needs_generation'
        return result

    # 本地兼容模式：先查本地，再查 CDN 并下载
    else:
        local = find_local_hero(course_dir)
        if local:
            result['hero'] = local
            result['hero']['status'] = 'found_local'
            return result

        # 尝试从 CDN 下载到本地
        l1 = find_l1_registry(meta['course_id'], meta['subject'], keywords)
        if l1:
            if not dry_run:
                dl = download_cdn_to_local(l1['url'], course_dir, meta['course_id'])
                result['hero'] = {**l1, 'download': dl, 'status': 'downloaded'}
            else:
                result['hero'] = {**l1, 'status': 'would_download'}
            return result

        l2 = find_l2_cdn_probe(meta['subject'], keywords)
        if l2:
            if not dry_run:
                dl = download_cdn_to_local(l2['url'], course_dir, meta['course_id'])
                result['hero'] = {**l2, 'download': dl, 'status': 'downloaded'}
            else:
                result['hero'] = {**l2, 'status': 'would_download'}
            return result

        l3 = generate_l3_hint(course_dir, meta)
        result['hero'] = l3
        result['hero']['status'] = 'needs_generation'
        return result


def main():
    parser = argparse.ArgumentParser(description='TeachAny Hero 图查找工具（CDN 优先版）')
    parser.add_argument('path', help='课件目录或 community/ 根目录')
    parser.add_argument('--subject', default='', help='学科覆盖（如 math/physics/history）')
    parser.add_argument('--grade', type=int, default=0, help='年级覆盖')
    parser.add_argument('--batch', action='store_true', help='批量模式')
    parser.add_argument('--dry-run', action='store_true', help='仅查找不下载')
    parser.add_argument('--cdn', action='store_true', default=True, help='CDN 模式（默认）')
    parser.add_argument('--local', action='store_true', help='本地模式：下载 CDN 图片到 assets/')
    parser.add_argument('--json', action='store_true', help='输出 JSON 格式')
    args = parser.parse_args()

    cdn_mode = not args.local
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
            r = find_hero_for_course(d, args.subject, args.grade, cdn_mode, args.dry_run)
            results.append(r)

        # 统计
        stats = {'L0': 0, 'L1': 0, 'L2': 0, 'L3': 0, 'error': 0}
        for r in results:
            if 'error' in r:
                stats['error'] += 1
            else:
                level = r['hero']['level']
                stats[level] = stats.get(level, 0) + 1

        if args.json:
            print(json.dumps({'results': results, 'stats': stats}, ensure_ascii=False, indent=2))
        else:
            print(f'\n=== Hero 查找统计（CDN 优先模式）===')
            print(f'  L0 本地已有: {stats.get("L0", 0)}')
            print(f'  L1 索引命中: {stats.get("L1", 0)}')
            print(f'  L2 CDN 命名: {stats.get("L2", 0)}')
            print(f'  L3 需生图:   {stats.get("L3", 0)}')
            print()

            for r in results:
                if 'error' in r:
                    print(f'  ❌ {r["error"]}')
                    continue
                hero = r['hero']
                level = hero['level']
                cid = r['course_id']
                status = hero['status']
                if level == 'L0':
                    print(f'  📁 L0 {cid} → {hero["path"]} ({hero["size_kb"]}KB, 本地)')
                elif level == 'L1':
                    url = hero.get('url', '?')
                    print(f'  🌐 L1 {cid} → {url}')
                elif level == 'L2':
                    url = hero.get('url', '?')
                    print(f'  🔗 L2 {cid} → {url} (命名规则)')
                elif level == 'L3':
                    print(f'  🎨 L3 {cid} → 需生成: {hero["prompt"][:60]}...')

        if stats.get('L3', 0) > 0:
            sys.exit(1)
        sys.exit(0)

    else:
        # 单课件模式
        result = find_hero_for_course(path, args.subject, args.grade, cdn_mode, args.dry_run)
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
            if level == 'L0':
                print(f'📁 L0 本地命中: {hero["path"]} ({hero["size_kb"]}KB)')
                print(f'   建议: 迁移到 CDN 以减小仓库体积')
            elif level == 'L1':
                print(f'🌐 L1 索引命中: {hero["url"]}')
                print(f'   ID: {hero.get("id", "?")}  文件: {hero.get("file", "?")}')
                print(f'   动作: HTML 中引用此 CDN URL')
            elif level == 'L2':
                print(f'🔗 L2 CDN 命名命中: {hero["url"]}')
                print(f'   关键词: {hero.get("keyword", "?")}')
                print(f'   动作: 验证 CDN 可访问性后引用此 URL')
            elif level == 'L3':
                print(f'🎨 L1-L2 未命中，需调用 image_gen 生成')
                print(f'   推荐 prompt: {hero["prompt"]}')
                print(f'   目标 CDN: {hero.get("target_cdn_url", "?")}')
                for step in hero.get('steps', []):
                    print(f'   {step}')

        if result.get('hero', {}).get('status') == 'needs_generation':
            sys.exit(1)


if __name__ == '__main__':
    main()
