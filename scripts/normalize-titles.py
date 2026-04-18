#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一课件 title 规范 + 为所有课件 manifest 添加 teachany_version 字段 (v5.27)

标准 title 格式：
    《课件名》 · 《学段》《学科》 G{grade} · TeachAny v{version}

示例：
    减数分裂与受精过程 · 高中生物 G10 · TeachAny v5.27
    复韵母乐园 · 小学语文 G1 · TeachAny v5.27

manifest 新增字段：
    teachany_version: "5.27"   # 制作时使用的 TeachAny 版本

用法：
    python3 scripts/normalize-titles.py            # dry-run
    python3 scripts/normalize-titles.py --apply    # 真写入
"""
import json
import re
import sys
from pathlib import Path

TEACHANY_VERSION = "5.27"  # 当前 SKILL 版本

# 学科中文名
SUBJECT_CN = {
    'chinese': '语文', 'math': '数学', 'english': '英语',
    'physics': '物理', 'chemistry': '化学', 'biology': '生物',
    'history': '历史', 'geography': '地理', 'info-tech': '信息技术',
}

# 学段
def grade_to_level(g):
    if not isinstance(g, int): return None
    if 1 <= g <= 6: return '小学'
    if 7 <= g <= 9: return '初中'
    if 10 <= g <= 12: return '高中'
    return None


def build_standard_title(courseware_name, subject, grade, version=TEACHANY_VERSION):
    """生成标准 title"""
    level = grade_to_level(grade)
    subj_cn = SUBJECT_CN.get(subject, subject or '')
    tail_parts = []
    if level and subj_cn:
        tail_parts.append(f"{level}{subj_cn} G{grade}")
    elif level:
        tail_parts.append(f"{level} G{grade}")
    tail_parts.append(f"TeachAny v{version}")
    return f"{courseware_name} · " + " · ".join(tail_parts)


def extract_current_title(html_text):
    m = re.search(r'<title>([^<]*)</title>', html_text)
    return m.group(1) if m else None


def extract_courseware_name(current_title, manifest_name):
    """从当前 title 提取原始课件名（去掉学段/年级/TeachAny 尾缀）"""
    if not current_title:
        return manifest_name
    # 按 · 或 - 拆分
    parts = re.split(r'[·\-—]\s*', current_title)
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        return manifest_name
    # 首段通常是课件名（排除 "TeachAny 互动课件" "教学课件" 等尾缀词）
    first = parts[0]
    # 如果首段包含"TeachAny"或"互动课件"关键词，优先使用 manifest 的 name
    if 'TeachAny' in first or '互动课件' in first or '教学课件' in first or 'teachany' in first.lower():
        return manifest_name
    return first


def apply_title(html_path, new_title):
    """替换 HTML 中的 <title>...</title>"""
    content = html_path.read_text(encoding='utf-8', errors='ignore')
    new_content, n = re.subn(
        r'<title>[^<]*</title>',
        f'<title>{new_title}</title>',
        content, count=1
    )
    if n == 0:
        # 没找到 title，尝试插在 <head> 后
        new_content = content.replace('<head>', f'<head>\n<title>{new_title}</title>', 1)
    html_path.write_text(new_content, encoding='utf-8')


def main():
    apply = '--apply' in sys.argv
    examples = Path('examples')

    changed = []
    unchanged = []
    no_manifest = []

    for ex in sorted(examples.iterdir()):
        if not ex.is_dir() or ex.name.startswith('_') or ex.name.startswith('course-'):
            continue
        mf = ex / 'manifest.json'
        html = ex / 'index.html'
        if not mf.exists() or not html.exists():
            no_manifest.append(ex.name)
            continue

        m = json.load(open(mf, encoding='utf-8'))
        mg = m.get('grade')
        ms = m.get('subject')
        mn = m.get('name', ex.name)
        html_text = html.read_text(encoding='utf-8', errors='ignore')
        current_title = extract_current_title(html_text) or ''

        # 提取课件名
        cw_name = extract_courseware_name(current_title, mn)
        # 生成标准 title
        new_title = build_standard_title(cw_name, ms, mg, TEACHANY_VERSION)

        # manifest 添加 teachany_version
        need_manifest_update = False
        if m.get('teachany_version') != TEACHANY_VERSION:
            m['teachany_version'] = TEACHANY_VERSION
            need_manifest_update = True
        # 同步 manifest.name 为课件名（保持简洁）
        # 不强制改，保持原 manifest.name

        if current_title != new_title or need_manifest_update:
            changed.append({
                'name': ex.name, 'old_title': current_title, 'new_title': new_title,
                'manifest_update': need_manifest_update
            })
            if apply:
                apply_title(html, new_title)
                if need_manifest_update:
                    with open(mf, 'w', encoding='utf-8') as f:
                        json.dump(m, f, ensure_ascii=False, indent=2)
        else:
            unchanged.append(ex.name)

    print(f"{'=== 执行' if apply else '=== Dry-run'} ===\n")
    print(f"✅ 无需变更: {len(unchanged)}")
    print(f"🔧 需要变更: {len(changed)}")
    if no_manifest:
        print(f"⚠ 缺 manifest/html: {len(no_manifest)} ({no_manifest[:5]}...)")

    print(f"\n前 15 条变更：")
    for c in changed[:15]:
        print(f"\n  📘 [{c['name']}]")
        print(f"     旧: {c['old_title']}")
        print(f"     新: {c['new_title']}")

    if not apply:
        print(f"\n\n💡 Dry-run 完毕，全量 {len(changed)} 条变更。加 --apply 执行。")
    else:
        print(f"\n✅ 已写入 {len(changed)} 个课件的 title + manifest.teachany_version={TEACHANY_VERSION}")


if __name__ == '__main__':
    main()
