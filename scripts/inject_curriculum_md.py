#!/usr/bin/env python3
"""
inject_curriculum_md.py — 把 curriculum-standards/**/*.md 内容批量注入卫星文件

数据源: /Users/wepon/CodeBuddy/一次函数/curriculum-standards/
  结构:  {学科}/{学段}/{知识点名}.md
  学科: 数学/物理/化学/生物/语文/英语/历史/地理/科学
  学段: 初中/高中/小学

注入目标: teachany-courseware/data/kp/{subject}/{node_id}.json
注入字段:
  supplements.curriculum_md_source  — MD 文件路径（来源标记）
  supplements.curriculum_md_raw     — MD 全文（供 AI 完整参考）
  supplements.textbook_summary      — "## 图文参考资料" 节（核心知识点内容）
  errors                            — 从 "易错点" 节提取的条目
  exercises                         — 从 "典型例题" 节提取的条目
  real_world                        — 从 "实际应用" / 情境导入提取的生活实例
  memory_anchors                    — 从 "记忆口诀" 节提取

匹配策略（多级 fallback）:
  1. 名字 + 学科 + 学段 精确匹配
  2. 名字 + 学科（忽略学段）
  3. 关键词模糊匹配（名字去括号/特殊符号后部分重叠）

用法:
  python3 scripts/inject_curriculum_md.py [--dry-run] [--subject 数学]
"""
import json, os, glob, re, argparse, datetime
from collections import defaultdict

# ── 路径配置 ──────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT    = os.path.dirname(SCRIPT_DIR)                          # teachany-courseware/
CS_ROOT      = '/Users/wepon/CodeBuddy/一次函数/curriculum-standards'
KP_INDEX     = os.path.join(REPO_ROOT, 'data/kp/_index.json')
KP_DIR       = os.path.join(REPO_ROOT, 'data/kp')
REPORT_OUT   = os.path.join(REPO_ROOT, 'data/kp/_inject_report.json')

NOW = datetime.datetime.now().strftime('%Y-%m-%d')

# ── 学科/学段中英文映射 ────────────────────────────────────────
SUBJ_MAP = {
    '数学': 'math', '物理': 'physics', '化学': 'chemistry',
    '生物': 'biology', '语文': 'chinese', '英语': 'english',
    '历史': 'history', '地理': 'geography', '科学': 'science',
}
STAGE_MAP = {
    '初中': 'middle', '高中': 'high', '小学': 'elementary',
}

# ── MD 解析工具 ──────────────────────────────────────────────

def read_section(md_text, heading_keywords):
    """提取以 heading_keywords 中任意关键词为标题的 Markdown 节（到下一个同级标题为止）"""
    lines = md_text.split('\n')
    in_sec = False
    level  = 0
    result = []
    for line in lines:
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            cur_level = len(m.group(1))
            cur_title = m.group(2).strip()
            if not in_sec:
                if any(kw in cur_title for kw in heading_keywords):
                    in_sec = True
                    level  = cur_level
                    result.append(line)
            else:
                if cur_level <= level:
                    break  # 遇到同级或更高级标题，停止
                result.append(line)
        elif in_sec:
            result.append(line)
    return '\n'.join(result).strip()


def extract_errors(md_text):
    """从"易错点"节提取条目列表"""
    sec = read_section(md_text, ['易错点'])
    if not sec:
        return []
    errors = []
    # 找编号条目：1. / - / * 开头
    for m in re.finditer(
        r'(?:^\d+\.\s*\*\*(.+?)\*\*|^\d+\.\s+(.+)|^[-*]\s+\*\*(.+?)\*\*|^[-*]\s+(.+))',
        sec, re.MULTILINE
    ):
        text = next((g for g in m.groups() if g), '').strip()
        if text and len(text) > 3:
            # 清理 markdown 格式
            text = re.sub(r'\*+', '', text).strip()
            # 追加后续解释行（缩进的行）
            errors.append({'description': text, 'source': 'curriculum_md'})
    return errors[:10]  # 最多取 10 条


def extract_exercises(md_text):
    """从"典型例题"节提取例题"""
    sec = read_section(md_text, ['典型例题', '例题', '练习'])
    if not sec:
        return []
    exercises = []
    # 找 **例N** 格式
    blocks = re.split(r'\n(?=\*\*例\d+)', sec)
    for block in blocks:
        if not block.strip(): continue
        # 题干
        title_m = re.match(r'\*\*例(\d+).*?\*\*[（(]?([^)）\n]*)[)）]?\s*\n(.*?)(?=\*\*解\*\*|解：|解:|\*\*解)',
                           block, re.DOTALL)
        if title_m:
            stem = title_m.group(3).strip()
        else:
            # fallback: 取前 200 字符
            stem = re.sub(r'\*+例\d+.*?\*+\s*', '', block).strip()[:200]
        # 答案
        ans_m = re.search(r'(?:\*\*解\*\*|解：|解:)\s*([\s\S]*?)(?=---|\Z)', block)
        answer = ans_m.group(1).strip()[:300] if ans_m else ''
        if stem and len(stem) > 5:
            exercises.append({
                'stem': stem[:300],
                'answer': answer,
                'bloom': 'apply',
                'source': 'curriculum_md',
            })
    return exercises[:8]


def extract_real_world(md_text):
    """从"实际应用"/ 行程问题 / 情境 等节提取生活实例句子"""
    # 从 "例4（实际应用" 类标题提取情境描述
    instances = []
    for m in re.finditer(
        r'\*\*例\d+[（(][^)）]*(?:实际|应用|情境|生活)[^)）]*[)）]\*\*\s*\n([^\n]+)',
        md_text
    ):
        s = m.group(1).strip()
        if len(s) > 10:
            instances.append(s)
    return instances[:5]


def extract_memory_anchors(md_text):
    """从"记忆口诀"节提取"""
    sec = read_section(md_text, ['记忆口诀', '口诀', '记忆'])
    if not sec:
        return []
    anchors = []
    for line in sec.split('\n'):
        line = line.strip().lstrip('-*0123456789. ')
        # 过滤掉 Markdown 标题和空行
        if line and not line.startswith('#') and len(line) > 3:
            anchors.append(line)
    return anchors[:5]


def parse_md(md_path):
    """解析 MD 文件，返回结构化内容字典"""
    with open(md_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 基本信息块
    info = {}
    for line in text.split('\n')[:20]:
        m = re.match(r'^-\s+\*\*(.+?)\*\*:\s*(.+)', line)
        if m:
            info[m.group(1)] = m.group(2).strip()

    # 完整 MD（供 AI 参考，截断到 6000 字符）
    md_raw = text[:6000] if len(text) > 6000 else text

    # "图文参考资料" 节（核心知识内容）
    textbook_summary = read_section(text, ['图文参考资料', '知识点精讲', '知识点总结'])

    return {
        'info': info,
        'md_raw': md_raw,
        'textbook_summary': textbook_summary[:3000] if textbook_summary else '',
        'errors': extract_errors(text),
        'exercises': extract_exercises(text),
        'real_world': extract_real_world(text),
        'memory_anchors': extract_memory_anchors(text),
    }


# ── 节点索引构建 ───────────────────────────────────────────────

def build_kp_index():
    with open(KP_INDEX, 'r', encoding='utf-8') as f:
        raw_idx = json.load(f)['kps']

    by_name_subj_stage = {}   # (name, subj, stage) -> (node_id, sat_path)
    by_name_subj       = defaultdict(list)  # (name, subj) -> [(node_id, sat_path)]
    all_nodes          = {}   # node_id -> (name, sat_abs_path)

    for nid, rel in raw_idx.items():
        sat_abs = os.path.join(REPO_ROOT, rel)
        if not os.path.exists(sat_abs): continue
        with open(sat_abs, 'r', encoding='utf-8') as f:
            s = json.load(f)
        name  = s.get('name', '')
        subj  = s.get('subject', '')
        stage = s.get('stage', '')
        all_nodes[nid] = (name, sat_abs)
        key = (name, subj, stage)
        if key not in by_name_subj_stage:
            by_name_subj_stage[key] = (nid, sat_abs)
        by_name_subj[(name, subj)].append((nid, sat_abs))

    return by_name_subj_stage, by_name_subj, all_nodes


def fuzzy_match(name_cn, subj_en, all_nodes):
    """
    关键词重叠匹配：把名字中的括号、标点去掉，查找节点 name_zh 中包含核心词的
    """
    # 清理名字
    core = re.sub(r'[（()）、，。的与和及其—\s]', '', name_cn)
    if len(core) < 2:
        return None
    for nid, (node_name, sat_path) in all_nodes.items():
        node_core = re.sub(r'[（()）、，。的与和及其—\s]', '', node_name)
        if not node_core: continue
        # 有效重叠：一方包含另一方的核心词（≥4字符）
        if len(core) >= 4 and core[:4] in node_core:
            return (nid, sat_path)
        if len(node_core) >= 4 and node_core[:4] in core:
            return (nid, sat_path)
    return None


# ── 注入到卫星文件 ────────────────────────────────────────────

def inject_to_satellite(sat_path, md_parsed, md_rel, dry_run=False):
    with open(sat_path, 'r', encoding='utf-8') as f:
        sat = json.load(f)

    # 已有 curriculum_md_source 且相同，跳过
    existing_src = sat.get('supplements', {}).get('curriculum_md_source', '')
    if existing_src == md_rel:
        return 'skipped'  # 已注入

    # supplements 字段
    sup = sat.setdefault('supplements', {})
    sup['curriculum_md_source'] = md_rel
    sup['curriculum_md_raw']    = md_parsed['md_raw']
    if md_parsed['textbook_summary']:
        sup['textbook_summary'] = md_parsed['textbook_summary']
    sup['injected_at'] = NOW

    # errors: 合并（不覆盖已有）
    existing_errs = {e.get('description', '') for e in sat.get('errors', [])}
    for e in md_parsed['errors']:
        if e['description'] not in existing_errs:
            sat.setdefault('errors', []).append(e)

    # exercises: 合并
    existing_stems = {ex.get('stem', '')[:30] for ex in sat.get('exercises', [])}
    for ex in md_parsed['exercises']:
        if ex['stem'][:30] not in existing_stems:
            sat.setdefault('exercises', []).append(ex)

    # real_world: 合并
    existing_rw = set(sat.get('real_world', []))
    for rw in md_parsed['real_world']:
        if rw not in existing_rw:
            sat.setdefault('real_world', []).append(rw)
            existing_rw.add(rw)

    # memory_anchors: 合并
    existing_ma = set(sat.get('memory_anchors', []))
    for ma in md_parsed['memory_anchors']:
        if ma not in existing_ma:
            sat.setdefault('memory_anchors', []).append(ma)
            existing_ma.add(ma)

    # 更新 _meta
    sat['_meta']['last_inject_curriculum_md'] = NOW
    sat['_meta']['sources'] = list(set(sat['_meta'].get('sources', []) + ['curriculum_standards_md']))

    if not dry_run:
        with open(sat_path, 'w', encoding='utf-8') as f:
            json.dump(sat, f, ensure_ascii=False, indent=2)
    return 'injected'


# ── 主流程 ────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--subject', default='', help='只处理指定学科（中文）')
    args = ap.parse_args()

    print('[1/4] 构建卫星文件索引...')
    by_nss, by_ns, all_nodes = build_kp_index()
    print(f'      节点总数: {len(all_nodes)}')

    print('[2/4] 扫描 MD 文件...')
    md_files = []
    for fp in sorted(glob.glob(os.path.join(CS_ROOT, '**/*.md'), recursive=True)):
        parts = fp.replace(CS_ROOT + '/', '').split('/')
        if len(parts) < 3: continue
        subject_cn, stage_cn = parts[0], parts[1]
        name_cn = os.path.splitext(parts[2])[0]
        if name_cn in ('README', '模板', '数学课程标准2022年版整理', '知识点文档模板'): continue
        if args.subject and subject_cn != args.subject: continue
        md_files.append((subject_cn, stage_cn, name_cn, fp))
    print(f'      MD 文件: {len(md_files)} 个')

    print('[3/4] 匹配 + 注入...')
    stats = {'injected': 0, 'skipped': 0, 'no_match': 0, 'fuzzy': 0}
    report_matched = []
    report_unmatched = []

    for subject_cn, stage_cn, name_cn, fp in md_files:
        subj_en  = SUBJ_MAP.get(subject_cn, '')
        stage_en = STAGE_MAP.get(stage_cn, '')
        md_rel   = os.path.relpath(fp, REPO_ROOT)

        # 匹配
        sat_path = node_id = None
        match_type = ''

        # Level 1: name + subj + stage
        key1 = (name_cn, subj_en, stage_en)
        if key1 in by_nss:
            node_id, sat_path = by_nss[key1]
            match_type = 'exact'

        # Level 2: name + subj
        if not sat_path:
            cands = by_ns.get((name_cn, subj_en), [])
            if len(cands) == 1:
                node_id, sat_path = cands[0]
                match_type = 'name+subj'
            elif len(cands) > 1:
                # 优先 cn curriculum
                cn = [(nid, sp) for nid, sp in cands if 'cn' in sp]
                if cn:
                    node_id, sat_path = cn[0]
                    match_type = 'name+subj(cn)'

        # Level 3: fuzzy
        if not sat_path:
            hit = fuzzy_match(name_cn, subj_en, {
                nid: v for nid, v in all_nodes.items()
                if subj_en and subj_en in nid
            })
            if hit:
                node_id, sat_path = hit
                match_type = 'fuzzy'
                stats['fuzzy'] += 1

        if not sat_path:
            stats['no_match'] += 1
            report_unmatched.append({'subject': subject_cn, 'stage': stage_cn, 'name': name_cn})
            continue

        # 解析 MD
        md_parsed = parse_md(fp)

        # 注入
        result = inject_to_satellite(sat_path, md_parsed, md_rel, dry_run=args.dry_run)
        stats[result] = stats.get(result, 0) + 1
        report_matched.append({
            'md': md_rel, 'node_id': node_id, 'match_type': match_type,
            'errors_added': len(md_parsed['errors']),
            'exercises_added': len(md_parsed['exercises']),
        })
        if result == 'injected':
            print(f'  ✅ [{match_type}] {subject_cn}/{name_cn} → {node_id}')

    print(f'\n[4/4] 完成！')
    print(f'  注入: {stats.get("injected",0)}, 跳过(已有): {stats.get("skipped",0)}, '
          f'模糊匹配: {stats.get("fuzzy",0)}, 未匹配: {stats["no_match"]}')

    # 写报告
    report = {
        'generated_at': NOW,
        'stats': stats,
        'matched': report_matched,
        'unmatched': report_unmatched,
    }
    if not args.dry_run:
        with open(REPORT_OUT, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f'  报告: {os.path.relpath(REPORT_OUT, REPO_ROOT)}')

    # 打印未匹配的（便于后续手工补充映射）
    if report_unmatched:
        print(f'\n=== 未匹配（{len(report_unmatched)} 个）===')
        for u in report_unmatched[:30]:
            print(f'  [{u["subject"]}/{u["stage"]}] {u["name"]}')
        if len(report_unmatched) > 30:
            print(f'  ... 共 {len(report_unmatched)} 个，见 {os.path.relpath(REPORT_OUT, REPO_ROOT)}')


if __name__ == '__main__':
    main()
