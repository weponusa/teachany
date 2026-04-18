#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
课件挂载一致性校验器 (v5.27 新增)

在发布任何课件前（rebuild-index 之前）必须运行，确保：
  1. manifest.grade 的学段 与 manifest.node_id 的前缀（chem-h-/chem-m-/chem-e-）一致
  2. manifest.subject 与 node_id 的学科前缀一致
  3. HTML title/course-id 中的学段指示（高中/初中/小学/必修X/xxx年级）与 manifest.grade 一致

命名约定（节点 id 前缀）：
  *-e-*  → elementary (G1-6)
  *-m-*  → middle (G7-9)
  *-h-*  → high (G10-12)

用法：
  python3 scripts/validate-courseware.py             # 扫描全部
  python3 scripts/validate-courseware.py <course_id> # 扫描单个
"""
import json
import re
import sys
from pathlib import Path

LEVEL_RANGE = {'elementary': (1,6), 'middle': (7,9), 'high': (10,12)}

SUBJECT_PREFIXES = {
    'chn': 'chinese', 'math': 'math', 'eng': 'english',
    'phy': 'physics', 'chem': 'chemistry', 'bio': 'biology',
    'hist': 'history', 'geo': 'geography', 'it': 'info-tech',
}

LEVEL_INFIX = {
    '-e-': 'elementary', '-m-': 'middle', '-h-': 'high',
}

# HTML 线索关键词
HTML_LEVEL_KEYWORDS = {
    'high':       ['高中', '高一', '高二', '高三', '必修一', '必修二', '必修三', '必修四', '必修五',
                   '选择性必修', '高考', '普高'],
    'middle':     ['初中', '初一', '初二', '初三', '七年级', '八年级', '九年级', '中考'],
    'elementary': ['小学', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
}


def parse_node_id(node_id):
    """返回 (subject, level) 根据 id 前缀"""
    if not node_id:
        return None, None
    subject = None
    for prefix, subj in SUBJECT_PREFIXES.items():
        if node_id.startswith(prefix + '-'):
            subject = subj
            break
    level = None
    for infix, lv in LEVEL_INFIX.items():
        if infix in node_id:
            level = lv
            break
    return subject, level


def grade_to_level(grade):
    if not isinstance(grade, int):
        return None
    for lv, (low, high) in LEVEL_RANGE.items():
        if low <= grade <= high:
            return lv
    return None


def detect_html_level(html_head):
    """从 HTML 前面几百行检测学段线索"""
    for lv, keywords in HTML_LEVEL_KEYWORDS.items():
        for k in keywords:
            if k in html_head:
                return lv, k
    # course-id 隐含
    m = re.search(r'course-id"\s*content="([^"]+)"', html_head)
    if m:
        cid = m.group(1)
        if re.search(r'-hs-|-high[_-]', cid): return 'high', cid
        if re.search(r'-ms-|-mi-|-middle[_-]', cid): return 'middle', cid
        if re.search(r'-es-|-el-|-elem-|-primary[_-]', cid): return 'elementary', cid
    return None, None


def validate_one(course_dir):
    mf = course_dir / 'manifest.json'
    html = course_dir / 'index.html'
    if not mf.exists():
        return [('warn', f'{course_dir.name}: 无 manifest.json')]
    m = json.load(open(mf, encoding='utf-8'))
    mg = m.get('grade')
    ms = m.get('subject')
    mn = m.get('node_id')

    issues = []
    manifest_level = grade_to_level(mg)
    node_subject, node_level = parse_node_id(mn)

    # 1. manifest.grade 学段 vs node_id 学段前缀
    if manifest_level and node_level and manifest_level != node_level:
        issues.append(('error',
            f'{course_dir.name}: manifest.grade={mg}({manifest_level}) 但 node_id={mn}({node_level}) 学段不一致'))

    # 2. manifest.subject vs node_id 学科前缀
    if ms and node_subject and ms != node_subject:
        issues.append(('error',
            f'{course_dir.name}: manifest.subject={ms} 但 node_id={mn} 指向 {node_subject}'))

    # 3. HTML 线索 vs manifest.grade
    if html.exists():
        head = ''
        with open(html, encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f):
                if i > 150: break
                head += line
        html_level, clue = detect_html_level(head)
        if html_level and manifest_level and html_level != manifest_level:
            issues.append(('error',
                f'{course_dir.name}: HTML 线索指示"{html_level}"(发现 "{clue}") 但 manifest.grade={mg}({manifest_level})'))

    return issues


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    examples = Path('examples')
    all_issues = []
    scanned = 0
    for d in sorted(examples.iterdir()):
        if not d.is_dir() or d.name.startswith('_') or d.name.startswith('course-'):
            continue
        if only and d.name != only:
            continue
        issues = validate_one(d)
        all_issues.extend(issues)
        scanned += 1

    errors = [i for i in all_issues if i[0] == 'error']
    warns = [i for i in all_issues if i[0] == 'warn']

    print(f"扫描 {scanned} 个课件")
    print(f"❌ 错误: {len(errors)}")
    for _, msg in errors:
        print(f"   {msg}")
    if warns:
        print(f"⚠ 警告: {len(warns)}")
        for _, msg in warns:
            print(f"   {msg}")

    if errors:
        sys.exit(1)
    print("\n✅ 所有课件挂载一致性校验通过")


if __name__ == '__main__':
    main()
