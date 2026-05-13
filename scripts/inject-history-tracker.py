#!/usr/bin/env python3
"""
TeachAny · 批量注入 History Tracker SDK

扫描 community/ 和 examples/ 下所有课件：
  1. 将 scripts/history-tracker.js 复制到课件目录（如缺）
  2. 在 </head> 前插入 <script src="./history-tracker.js" defer></script>（如缺，幂等）
  3. 检查并补齐 <meta name="teachany-courseware-id">
     - 优先从同目录 manifest.json 的 id / courseId / name_slug 取
     - 再降级从课件目录名取

用法：
  python3 scripts/inject-history-tracker.py            # 实际注入
  python3 scripts/inject-history-tracker.py --dry-run  # 仅预览
"""

import json
import re
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TRACKER_JS = REPO_ROOT / 'scripts' / 'history-tracker.js'

DRY_RUN = '--dry-run' in sys.argv

SCAN_ROOTS = ['community', 'examples']
EXCLUDE_DIRS = {'archive', 'drafts', '_pdf-archive', 'node_modules', '.git', '_templates'}

# 历史课件残缺，pre-commit 不通过，跳过它们的注入避免连带受影响
EXCLUDE_COURSES = {
    'community/hist-m-renaissance',
    'community/phy-light-refraction',
}


def has_tracker_script(html: str) -> bool:
    return bool(re.search(r'history-tracker\.js', html))


def has_courseware_meta(html: str) -> bool:
    return bool(re.search(r'<meta[^>]*name=["\']teachany-courseware-id["\']', html, re.IGNORECASE))


def get_meta_content(html: str, name: str) -> str:
    pattern = (
        rf'<meta[^>]*name=["\']({re.escape(name)})["\'][^>]*content=["\']([^"\']+)["\']'
        rf'|<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']({re.escape(name)})["\']'
    )
    m = re.search(pattern, html, re.IGNORECASE)
    if not m:
        return ''
    groups = m.groups()
    # 取两种顺序中 content 所在的位置
    return (groups[1] or groups[2] or '').strip()


def build_courseware_id(course_dir: Path, html: str) -> str:
    # 1) manifest.json
    mf = course_dir / 'manifest.json'
    if mf.exists():
        try:
            data = json.loads(mf.read_text(encoding='utf-8'))
            for key in ('id', 'courseId', 'course_id', 'slug'):
                v = data.get(key)
                if isinstance(v, str) and v.strip():
                    return v.strip()
            # 再尝试组合 subject+node_id
            node = data.get('node_id') or ''
            subject = data.get('subject') or ''
            if subject and node:
                return f'{subject}-{node}'
        except Exception:
            pass
    # 2) 其他 meta
    for k in ('teachany-node', 'teachany-slug', 'course-id'):
        v = get_meta_content(html, k)
        if v:
            return v
    # 3) 目录名
    return course_dir.name


def inject_meta(html: str, course_id: str) -> tuple[str, bool]:
    if has_courseware_meta(html):
        return html, False
    tag = f'\n  <meta name="teachany-courseware-id" content="{course_id}">'
    if '</head>' in html:
        return html.replace('</head>', tag + '\n</head>', 1), True
    # 没 head 就插到 html 起始
    return tag + '\n' + html, True


def inject_script(html: str) -> tuple[str, bool]:
    if has_tracker_script(html):
        return html, False
    tag = '\n  <script src="./history-tracker.js" defer></script>'
    if '</head>' in html:
        return html.replace('</head>', tag + '\n</head>', 1), True
    # 降级：在 </body> 前
    if '</body>' in html:
        return html.replace('</body>', tag + '\n</body>', 1), True
    return html + tag, True


def process_course(course_dir: Path) -> dict:
    index_html = course_dir / 'index.html'
    if not index_html.exists():
        return {'status': 'skip', 'reason': 'no index.html', 'actions': []}

    record = {'name': course_dir.name, 'actions': []}
    html = index_html.read_text(encoding='utf-8')

    # 1) 复制 tracker js 到课件目录
    target_js = course_dir / 'history-tracker.js'
    if not target_js.exists():
        if not DRY_RUN:
            shutil.copy2(TRACKER_JS, target_js)
        record['actions'].append('copy history-tracker.js')

    # 2) 注入 meta
    course_id = build_courseware_id(course_dir, html)
    html, meta_changed = inject_meta(html, course_id)
    if meta_changed:
        record['actions'].append(f'inject meta id={course_id}')

    # 3) 注入 script
    html, script_changed = inject_script(html)
    if script_changed:
        record['actions'].append('inject <script>')

    if (meta_changed or script_changed) and not DRY_RUN:
        index_html.write_text(html, encoding='utf-8')

    if not record['actions']:
        record['status'] = 'already_ok'
    else:
        record['status'] = 'would_update' if DRY_RUN else 'updated'
    return record


def find_courses() -> list[Path]:
    courses = []
    for root in SCAN_ROOTS:
        root_path = REPO_ROOT / root
        if not root_path.exists():
            continue
        for sub in root_path.iterdir():
            if not sub.is_dir() or sub.name in EXCLUDE_DIRS:
                continue
            rel = f'{root}/{sub.name}'
            if rel in EXCLUDE_COURSES:
                continue
            if (sub / 'index.html').exists():
                courses.append(sub)
            else:
                for sub2 in sub.iterdir():
                    if sub2.is_dir() and (sub2 / 'index.html').exists():
                        rel2 = f'{root}/{sub.name}/{sub2.name}'
                        if rel2 in EXCLUDE_COURSES:
                            continue
                        courses.append(sub2)
    return sorted(courses)


def main():
    print(f"[inject-history-tracker] {'DRY RUN' if DRY_RUN else '实际注入'}")
    print(f"[inject-history-tracker] 源: {TRACKER_JS}")
    print()

    if not TRACKER_JS.exists():
        print(f"❌ 找不到 {TRACKER_JS}")
        sys.exit(1)

    courses = find_courses()
    print(f"找到 {len(courses)} 个课件\n")

    stats = {}
    updated = []
    for course in courses:
        rec = process_course(course)
        stats[rec['status']] = stats.get(rec['status'], 0) + 1
        if rec['status'] in ('updated', 'would_update'):
            updated.append(rec)
            rel = course.relative_to(REPO_ROOT)
            print(f"  🔧 {rel}: {', '.join(rec['actions'])}")

    print()
    print("=" * 60)
    print(f"  ✅ 已更新:    {stats.get('updated', 0)}")
    print(f"  📋 待更新:    {stats.get('would_update', 0)}")
    print(f"  ✓  已合规:    {stats.get('already_ok', 0)}")
    print(f"  ⏭️  跳过:      {stats.get('skip', 0)}")
    print(f"  📦 总计:      {len(courses)}")
    print("=" * 60)

    if DRY_RUN and stats.get('would_update', 0):
        print(f"\n🔥 实际执行：python3 {Path(__file__).name}（去掉 --dry-run）")


if __name__ == '__main__':
    main()
