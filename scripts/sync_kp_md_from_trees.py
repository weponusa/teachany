#!/usr/bin/env python3
"""
sync_kp_md_from_trees.py — 把 data/trees/**/*.json 的 curriculum_points
作为唯一权威源，同步到 skill/data/kp-md/kp-{node_id}.md 的课标段。

操作规则:
1. 已存在的 md: 替换其 "### 课标原文" 或 "### 课标要点" 段内容为 tree 的 cp
2. 不存在的 md: 为有 cp 的节点生成新 md
3. "## 课标摘要" 段同步更新（一行内用；连接）
4. 所有 node_id 唯一编码规则: kp-{node_id}

幂等安全: 多次运行结果一致。

Usage:
  python3 scripts/sync_kp_md_from_trees.py --dry-run    # 只报告差异
  python3 scripts/sync_kp_md_from_trees.py              # 实际写入
"""
import json, glob, os, re, sys, argparse
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 学段/学科 中文映射（与现存 md 保持一致） ──
STAGE_ZH = {
    'elementary': '小学', 'middle': '初中', 'high': '高中',
    'k5': '小学 (K-5)', 'ms': '初中 (MS)', 'hs': '高中 (HS)',
    'primary': 'Cambridge-Primary（小学）', 'lsec': 'Cambridge-LSec（初中）',
    'igcse': 'Cambridge-IGCSE（初中/高中）', 'al': 'Cambridge A-Level（高中）',
    'pyp': 'IB-PYP（小学）', 'myp': 'IB-MYP（初中）', 'dp': 'IB-DP（高中）',
}
CURRICULUM_ZH = {
    'cn': '中国国家课标', 'ap': 'AP 美国大学先修',
    'us': '美国 Common Core / NGSS', 'cambridge': 'Cambridge 剑桥国际',
    'ib': 'IB 国际文凭',
}
SUBJECT_ZH = {
    'math': '数学', 'physics': '物理', 'chemistry': '化学', 'biology': '生物',
    'chinese': '语文', 'english': '英语', 'history': '历史', 'geography': '地理',
    'politics': '政治', 'science': '科学', 'music': '音乐', 'art': '美术',
    'pe': '体育', 'tech': '信息技术', 'cs': '计算机科学', 'economics': '经济学',
    'global-persp': '全球视野', 'mathematics': '数学',
    'calculus': '微积分', 'calculus-ab': '微积分 AB',
    'physics-1': '物理 1', 'physics-c': '物理 C',
    'us-history': '美国历史', 'math-aa': '数学 AA',
    'how-we-express': 'PYP 跨学科', 'arts': '艺术',
}
CURR_NAME_DISPLAY = {
    'cn': '义教/普高 2022年版', 'ap': 'AP Course Framework',
    'us': 'Common Core / NGSS', 'cambridge': 'Cambridge Syllabus',
    'ib': 'IB Programme',
}

MD_DIR = os.path.join(ROOT, 'skill/data/kp-md')
CP_SECTION_HEADINGS = ['### 课标原文', '### 课标要点']


def collect_tree_nodes():
    """扫 data/trees，收集 {node_id: {name, name_en, curriculum, stage, subject, grade, domain_name, cp[]}}"""
    nodes = {}
    for f in glob.glob(os.path.join(ROOT, 'data/trees/*/**/*.json'), recursive=True):
        rel = os.path.relpath(f, ROOT)
        parts = rel.split('/')
        # 形如 data/trees/{curriculum}/{stage}/{subject}.json → 5 段
        if len(parts) < 5:
            continue
        curriculum = parts[2]
        # other/ 是用户生成节点，不算正式课标，跳过
        if curriculum == 'other':
            continue
        stage = parts[3]
        subject = os.path.splitext(parts[4])[0]
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        for dom in d.get('domains', []):
            dom_name = dom.get('name', '')
            for n in dom.get('nodes', []):
                nid = n.get('id')
                if not nid:
                    continue
                nodes[nid] = {
                    'node_id': nid,
                    'name': n.get('name', nid),
                    'name_en': n.get('name_en', ''),
                    'curriculum': curriculum,
                    'stage': stage,
                    'subject': subject,
                    'grade': n.get('grade', ''),
                    'domain_name': dom_name,
                    'cp': n.get('curriculum_points') or [],
                    'prerequisites': n.get('prerequisites') or [],
                    'tree_file': rel,
                }
    return nodes


def render_md(info):
    """按统一 schema 渲染一个节点的 md 文本"""
    nid = info['node_id']
    name_zh = info['name']
    name_en = info.get('name_en', '')
    title = f'{name_zh} / {name_en}' if name_en else name_zh
    curriculum = info['curriculum']
    stage = info['stage']
    subject = info['subject']
    cp_list = info['cp']
    prereqs = info['prerequisites']

    curr_display = CURR_NAME_DISPLAY.get(curriculum, curriculum)
    stage_display = STAGE_ZH.get(stage, stage)
    subject_display = SUBJECT_ZH.get(subject, subject)
    curriculum_display = CURRICULUM_ZH.get(curriculum, curriculum)
    heading = '### 课标原文' if curriculum != 'cn' else '### 课标要点'

    lines = []
    lines.append(f'# {title}')
    lines.append('')
    lines.append(f'<!-- TeachAny KP: kp_id=kp-{nid} node_id={nid} subject={subject} stage={stage} -->')
    lines.append('')
    lines.append('## 元数据')
    lines.append('')
    lines.append('| 字段 | 值 |')
    lines.append('| --- | --- |')
    lines.append(f'| kp_id | `kp-{nid}` |')
    lines.append(f'| node_id | `{nid}` |')
    lines.append(f'| 知识点 | {name_zh} |')
    if name_en:
        lines.append(f'| 英文名 | {name_en} |')
    lines.append(f'| 学科 | {subject_display} ({subject}) |')
    lines.append(f'| 学段 | {stage_display} ({stage}) |')
    if info.get('grade'):
        lines.append(f'| 年级 | {info["grade"]} |')
    lines.append(f'| 课标系统 | {curriculum_display} |')
    if info.get('domain_name'):
        lines.append(f'| 领域 | {info["domain_name"]} |')
    lines.append(f'| tree 源 | `{info["tree_file"]}` |')
    lines.append('')
    lines.append(f'## 课标原文（{curr_display}）')
    lines.append('')
    lines.append(heading)
    lines.append('')
    if cp_list:
        for cp in cp_list:
            lines.append(cp.strip())
            lines.append('')
    else:
        lines.append('（本节点暂未录入课标要点，欢迎贡献）')
        lines.append('')

    if prereqs:
        lines.append('## 知识图谱关系')
        lines.append('')
        lines.append('### 前驱知识')
        lines.append('')
        for p in prereqs:
            lines.append(f'- `{p}`')
        lines.append('')

    if cp_list:
        lines.append('## 课标摘要')
        lines.append('')
        summary = '；'.join(cp.strip().replace('\n', ' ') for cp in cp_list)
        lines.append(summary)
        lines.append('')

    return '\n'.join(lines).rstrip() + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='只统计，不写文件')
    args = ap.parse_args()

    nodes = collect_tree_nodes()
    print(f'扫到 {len(nodes)} 个 tree 节点')

    stats = {'new': 0, 'update': 0, 'unchanged': 0, 'skip_no_cp_no_md': 0}
    new_ids = []
    updated_ids = []

    for nid, info in nodes.items():
        md_name = f'kp-{nid}.md'
        md_path = os.path.join(MD_DIR, md_name)
        new_content = render_md(info)

        if os.path.exists(md_path):
            with open(md_path, encoding='utf-8') as fp:
                old = fp.read()
            if old.strip() == new_content.strip():
                stats['unchanged'] += 1
            else:
                stats['update'] += 1
                updated_ids.append(nid)
                if not args.dry_run:
                    with open(md_path, 'w', encoding='utf-8') as fp:
                        fp.write(new_content)
        else:
            # 只有节点有 cp 时才新建 md（避免造一堆空 md）
            if info['cp']:
                stats['new'] += 1
                new_ids.append(nid)
                if not args.dry_run:
                    with open(md_path, 'w', encoding='utf-8') as fp:
                        fp.write(new_content)
            else:
                stats['skip_no_cp_no_md'] += 1

    print()
    print('== 同步结果 ==')
    for k, v in stats.items():
        print(f'  {k:22s} {v:4d}')
    print(f'\nsamples new (首10): {new_ids[:10]}')
    print(f'samples update (首10): {updated_ids[:10]}')
    if args.dry_run:
        print('\n[dry-run] 未写任何文件')


if __name__ == '__main__':
    main()
