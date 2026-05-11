#!/usr/bin/env python3
"""
TeachAny v6.11 · 批量注入 AI 学伴

扫描 community/ 和 examples/ 下所有课件目录：
  1. 复制 scripts/ai-tutor.css/js 到课件目录（如缺）
  2. 在 <head> 注入 <link rel="stylesheet" href="./ai-tutor.css"> （如缺）
  3. 在 </body> 前注入 <script src="./ai-tutor.js" defer> + __TEACHANY_TUTOR_CONFIG__（如缺）

用法：
  python3 scripts/batch-inject-ai-tutor.py            # 实际注入
  python3 scripts/batch-inject-ai-tutor.py --dry-run  # 仅预览
"""
import re
import sys
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AI_TUTOR_CSS = REPO_ROOT / 'scripts' / 'ai-tutor.css'
AI_TUTOR_JS = REPO_ROOT / 'scripts' / 'ai-tutor.js'

DRY_RUN = '--dry-run' in sys.argv

SUBJECT_FALLBACK = 'general'
GRADE_FALLBACK = 9

# 要扫描的根目录
SCAN_ROOTS = ['community', 'examples']

# 排除目录
EXCLUDE_DIRS = {'archive', 'drafts', '_pdf-archive', 'node_modules', '.git'}


def get_meta(html: str, *names) -> str:
    """按多个候选 name 抓 meta content（按顺序找到第一个非空值）"""
    for name in names:
        for pattern in [
            rf'<meta[^>]*name=["\']({re.escape(name)})["\'][^>]*content=["\']([^"\']+)["\']',
            rf'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']({re.escape(name)})["\']',
        ]:
            m = re.search(pattern, html, re.IGNORECASE)
            if m:
                # 第一个分组可能是 name，也可能是 content
                value = m.group(2) if m.group(1) == name else m.group(1)
                if value.strip():
                    return value.strip()
    return ''


def extract_title(html: str) -> str:
    """提取课件简短标题（去掉 · TeachAny 后缀和《》括号）"""
    m = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if not m:
        return '本课件'
    title = m.group(1).strip()
    title = re.sub(r'\s*[·\|・].*$', '', title)
    title = re.sub(r'^[《<]|[》>]$', '', title).strip()
    return title or '本课件'


def get_grade(html: str) -> int:
    """提取年级数字（1-12）"""
    g = get_meta(html, 'teachany-grade', 'teachany:grade', 'course-grade')
    if g and g.isdigit():
        return int(g)
    # 从 stage 推
    stage = get_meta(html, 'teachany-stage', 'teachany:stage', 'course-stage')
    return {'elementary': 4, 'primary': 4, 'middle': 8, 'junior': 8,
            'lsec': 8, 'high': 11, 'senior': 11}.get(stage.lower(), GRADE_FALLBACK)


def inject_css(html: str) -> tuple[str, bool]:
    """在 </head> 前插入 ai-tutor.css link。返回 (新 html, 是否变更)"""
    if 'ai-tutor.css' in html:
        return html, False
    css_tag = '\n  <link rel="stylesheet" href="./ai-tutor.css">'
    if '</head>' in html:
        return html.replace('</head>', css_tag + '\n</head>', 1), True
    return html, False


def inject_js(html: str, course_dir_name: str) -> tuple[str, bool]:
    """在 </body> 前插入 ai-tutor.js + __TEACHANY_TUTOR_CONFIG__。返回 (新 html, 是否变更)"""
    if 'ai-tutor.js' in html:
        return html, False

    title = extract_title(html)
    subject = get_meta(html, 'teachany-subject', 'teachany:subject', 'course-subject') or SUBJECT_FALLBACK
    grade = get_grade(html)

    # 用 JSON 转义保证 courseTitle 中如有引号也安全
    import json
    title_js = json.dumps(title, ensure_ascii=False)
    subject_js = json.dumps(subject, ensure_ascii=False)

    inject = f"""
<!-- ⭐ v6.11 AI 学伴配置（必须在 ai-tutor.js 加载前定义） -->
<script>
window.__TEACHANY_TUTOR_CONFIG__ = {{
  courseTitle: {title_js},
  subject: {subject_js},
  grade: {grade},
  learningObjectives: []
}};
</script>
<!-- ⭐ v6.11 AI 学伴脚本（左下角 FAB · 首次点击引导配置 API） -->
<script src="./ai-tutor.js" defer></script>
"""
    if '</body>' in html:
        return html.replace('</body>', inject + '\n</body>', 1), True
    # 没有 </body> 就追加到末尾
    return html + '\n' + inject, True


def process_course(course_dir: Path) -> dict:
    """处理单个课件，返回操作记录"""
    index_html = course_dir / 'index.html'
    if not index_html.exists():
        return {'status': 'skip', 'reason': 'no index.html'}

    record = {'name': course_dir.name, 'actions': []}

    # 1. 复制 ai-tutor.css/js
    for src in [AI_TUTOR_CSS, AI_TUTOR_JS]:
        target = course_dir / src.name
        if not target.exists():
            if not DRY_RUN:
                shutil.copy2(src, target)
            record['actions'].append(f'copy {src.name}')

    # 2. 注入 HTML
    html = index_html.read_text(encoding='utf-8')
    html, css_changed = inject_css(html)
    if css_changed:
        record['actions'].append('inject CSS link')
    html, js_changed = inject_js(html, course_dir.name)
    if js_changed:
        record['actions'].append('inject JS + config')

    if (css_changed or js_changed) and not DRY_RUN:
        index_html.write_text(html, encoding='utf-8')

    if not record['actions']:
        record['status'] = 'already_ok'
    else:
        record['status'] = 'updated' if not DRY_RUN else 'would_update'

    return record


def find_courses() -> list[Path]:
    """扫描课件目录"""
    courses = []
    for root in SCAN_ROOTS:
        root_path = REPO_ROOT / root
        if not root_path.exists():
            continue
        for sub in root_path.iterdir():
            if not sub.is_dir() or sub.name in EXCLUDE_DIRS:
                continue
            if (sub / 'index.html').exists():
                courses.append(sub)
            else:
                # 二级目录（examples/foo/bar/index.html）
                for sub2 in sub.iterdir():
                    if sub2.is_dir() and (sub2 / 'index.html').exists():
                        courses.append(sub2)
    return sorted(courses)


def main():
    print(f"[batch-inject-ai-tutor] {'DRY RUN' if DRY_RUN else '实际注入'}")
    print(f"[batch-inject-ai-tutor] 扫描根: {SCAN_ROOTS}")
    print(f"[batch-inject-ai-tutor] 资源源: {AI_TUTOR_CSS}")
    print()

    if not AI_TUTOR_CSS.exists() or not AI_TUTOR_JS.exists():
        print(f"❌ 找不到公共资源：{AI_TUTOR_CSS} 或 {AI_TUTOR_JS}")
        sys.exit(1)

    courses = find_courses()
    print(f"找到 {len(courses)} 个课件\n")

    stats = {'updated': 0, 'already_ok': 0, 'skip': 0, 'would_update': 0}
    updated_list = []

    for course in courses:
        rec = process_course(course)
        stats[rec['status']] = stats.get(rec['status'], 0) + 1
        if rec['status'] in ('updated', 'would_update'):
            updated_list.append(rec)
            actions_str = ', '.join(rec['actions'])
            print(f"  🔧 {course.relative_to(REPO_ROOT)}: {actions_str}")

    print()
    print("=" * 60)
    print(f"  ✅ 已更新:    {stats.get('updated', 0)}")
    print(f"  📋 待更新:    {stats.get('would_update', 0)}")
    print(f"  ✓  已合规:    {stats.get('already_ok', 0)}")
    print(f"  ⏭️  跳过:      {stats.get('skip', 0)}")
    print(f"  📦 总计:      {len(courses)}")
    print("=" * 60)

    if DRY_RUN and stats.get('would_update', 0) > 0:
        print(f"\n🔥 实际执行：python3 {Path(__file__).name}（去掉 --dry-run）")


if __name__ == '__main__':
    main()
