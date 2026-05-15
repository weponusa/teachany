#!/usr/bin/env python3
"""
inject_curriculum_md_r2.py — 第二轮注入，处理第一轮未匹配的 304 个 MD

策略：
  1. 手工别名表（已知名字差异）
  2. 更宽松的前缀/子串匹配（取中文名前 4 字）
  3. 仅注入第一轮报告中 unmatched 的条目
"""
import json, os, glob, re, datetime
from collections import defaultdict

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.dirname(SCRIPT_DIR)
CS_ROOT     = '/Users/wepon/CodeBuddy/一次函数/curriculum-standards'
KP_INDEX    = os.path.join(REPO_ROOT, 'data/kp/_index.json')
REPORT_R1   = os.path.join(REPO_ROOT, 'data/kp/_inject_report.json')
REPORT_OUT  = os.path.join(REPO_ROOT, 'data/kp/_inject_report_r2.json')

NOW = datetime.datetime.now().strftime('%Y-%m-%d')

SUBJ_MAP  = {'数学':'math','物理':'physics','化学':'chemistry','生物':'biology',
             '语文':'chinese','英语':'english','历史':'history','地理':'geography','科学':'science'}
STAGE_MAP = {'初中':'middle','高中':'high','小学':'elementary'}

# ── 手工别名表（MD名 → node_id）────────────────────────────────
# 格式：('MD名', '学科英文', '学段英文'): 'node_id'
ALIAS = {
    # 数学初中
    ('三角形', 'math', 'middle'): 'math-m-triangle-basics',
    ('切线与切线长', 'math', 'middle'): 'math-m-circle-tangent',
    ('切线与切线长_updated', 'math', 'middle'): 'math-m-circle-tangent',
    ('圆心角与圆周角', 'math', 'middle'): 'math-m-circle-angles',
    ('圆的基本性质', 'math', 'middle'): 'math-m-circle-basics',
    ('实数', 'math', 'middle'): 'math-m-real-number',
    ('平行四边形', 'math', 'middle'): 'math-m-geometry-quadrilaterals',
    ('正多边形与圆', 'math', 'middle'): 'math-m-regular-polygon',
    ('用频率估计概率', 'math', 'middle'): 'math-m-probability',
    # 数学高中
    ('二面角与空间角', 'math', 'high'): 'math-h-dihedral-angle',
    ('函数的单调性、奇偶性、周期性', 'math', 'high'): 'math-h-function-properties',
    ('命题与充要条件', 'math', 'high'): 'math-h-propositions',
    ('数列求和方法', 'math', 'high'): 'math-h-sequence-summation',
    ('概率（古典条件独立）', 'math', 'high'): 'math-h-probability-h',
    ('集合的概念与运算', 'math', 'high'): 'math-h-sets',
    ('回归分析与统计推断', 'math', 'high'): 'math-h-statistics',
    ('随机变量与分布', 'math', 'high'): 'math-h-probability-distribution',
    ('向量的坐标运算与数量积', 'math', 'high'): 'math-h-vector-coordinates',
    ('二面角与空间角', 'math', 'high'): 'math-h-dihedral-angle',
    ('空间向量与立体几何', 'math', 'high'): 'math-h-spatial-vectors',
    ('导数的概念与运算', 'math', 'high'): 'math-h-derivative-concept',
    ('空间几何体（棱柱棱锥球）', 'math', 'high'): 'math-h-solid-geometry',
    ('计数原理（排列组合）', 'math', 'high'): 'math-h-counting-principles',
    ('三角函数的定义（任意角）', 'math', 'high'): 'math-h-trig-ratios',
    ('三角函数的图像与性质', 'math', 'high'): 'math-h-trig-graphs',
    ('函数的概念与表示', 'math', 'high'): 'math-h-functions-concept',
    ('函数模型与应用', 'math', 'high'): 'math-h-function-models',
    ('不等式的性质与解法', 'math', 'high'): 'math-h-inequalities',
    ('平行与垂直的判定和性质', 'math', 'high'): 'math-h-parallel-perpendicular',
    ('点线面的位置关系', 'math', 'high'): 'math-h-spatial-relationships',
    # 物理初中
    ('欧姆定律', 'physics', 'middle'): 'phy-m-ohms-law',
    ('浮力', 'physics', 'middle'): 'phy-m-liquid-pressure-buoyancy',
    ('声音的产生与传播', 'physics', 'middle'): 'phy-m-sound-generation',
    ('机械运动', 'physics', 'middle'): 'phy-m-uniform-motion',
    ('弹力与弹簧测力计', 'physics', 'middle'): 'phy-m-elastic-force',
    ('摩擦力', 'physics', 'middle'): 'phy-m-friction',
    ('杠杆', 'physics', 'middle'): 'phy-m-lever',
    ('液体压强', 'physics', 'middle'): 'phy-m-liquid-pressure-buoyancy',
    ('大气压强', 'physics', 'middle'): 'phy-m-atmospheric-pressure',
    ('功与功率', 'physics', 'middle'): 'phy-m-work-power',
    ('比热容与热量计算', 'physics', 'middle'): 'phy-m-specific-heat',
    ('光的折射与透镜', 'physics', 'middle'): 'phy-m-refraction',
    ('磁现象与安培定则', 'physics', 'middle'): 'phy-m-magnetism',
    ('电流与电路', 'physics', 'middle'): 'phy-m-electric-circuit',
    ('电压与电阻', 'physics', 'middle'): 'phy-m-voltage-resistance',
    ('串联与并联电路', 'physics', 'middle'): 'phy-m-series-parallel',
    ('内能与热机', 'physics', 'middle'): 'phy-m-internal-energy',
    ('电功率与焦耳定律', 'physics', 'middle'): 'phy-m-power-joule',
    ('光的直线传播与小孔成像', 'physics', 'middle'): 'phy-m-light-propagation',
    ('平面镜成像', 'physics', 'middle'): 'phy-m-plane-mirror',
    ('物态变化', 'physics', 'middle'): 'phy-m-phase-change',
    ('质量与密度', 'physics', 'middle'): 'phy-m-density',
    # 物理高中
    ('牛顿运动定律', 'physics', 'high'): 'phy-h-newtons-laws',
    ('机械能守恒定律', 'physics', 'high'): 'phy-h-mechanical-energy-conservation',
    ('动能定理与功能关系', 'physics', 'high'): 'phy-h-work-energy-theorem',
    ('曲线运动与抛体运动', 'physics', 'high'): 'phy-h-projectile-motion',
    ('圆周运动', 'physics', 'high'): 'phy-h-circular-motion',
    ('万有引力定律', 'physics', 'high'): 'phy-h-gravitation',
    ('电场与电场强度', 'physics', 'high'): 'phy-h-electric-field',
    ('电容器与电场能', 'physics', 'high'): 'phy-h-capacitor',
    ('安培力与洛伦兹力', 'physics', 'high'): 'phy-h-magnetic-force',
    ('电磁感应与楞次定律', 'physics', 'high'): 'phy-h-electromagnetic-induction',
    # 化学初中
    ('元素与元素周期表', 'chemistry', 'middle'): 'chem-m-element-concept',
    ('分子和原子', 'chemistry', 'middle'): 'chem-m-atom-molecule',
    ('利用化学方程式计算', 'chemistry', 'middle'): 'chem-m-stoichiometry',
    ('化学实验基本操作', 'chemistry', 'middle'): 'chem-m-lab-basics',
    ('化学方程式书写与配平', 'chemistry', 'middle'): 'chem-m-equation-balancing',
    ('原子的构成（质子中子电子）', 'chemistry', 'middle'): 'chem-m-atomic-structure',
    ('氧气的制取（实验室工业）', 'chemistry', 'middle'): 'chem-m-oxygen-production',
    ('氧气的性质与用途', 'chemistry', 'middle'): 'chem-m-oxygen-properties',
    ('溶解度与溶解度曲线', 'chemistry', 'middle'): 'chem-m-solubility',
    ('溶质质量分数', 'chemistry', 'middle'): 'chem-m-mass-fraction',
    ('物质的分类与转化', 'chemistry', 'middle'): 'chem-m-substance-classification',
    ('物质的变化和性质', 'chemistry', 'middle'): 'chem-m-substance-properties',
    ('盐的性质与复分解反应', 'chemistry', 'middle'): 'chem-m-salt-properties',
    ('碳的单质（金刚石石墨C60）', 'chemistry', 'middle'): 'chem-m-carbon-allotropes',
    ('离子与离子化合物', 'chemistry', 'middle'): 'chem-m-ionic-compounds',
    ('酸碱的概念与通性', 'chemistry', 'middle'): 'chem-m-acids-bases',
    ('金属冶炼与防锈', 'chemistry', 'middle'): 'chem-m-metal-smelting',
    ('金属的化学性质', 'chemistry', 'middle'): 'chem-m-metal-chemistry',
    # 化学高中
    ('元素周期表的应用', 'chemistry', 'high'): 'chem-h-periodic-table-application',
    ('分子结构与晶体类型', 'chemistry', 'high'): 'chem-h-molecular-structure',
    ('分散系与胶体', 'chemistry', 'high'): 'chem-h-colloid',
    ('化学反应热与焓变', 'chemistry', 'high'): 'chem-h-reaction-enthalpy',
    ('化学键（离子键共价键）', 'chemistry', 'high'): 'chem-h-chemical-bonds',
    ('原电池原理', 'chemistry', 'high'): 'chem-h-electrochemical-cell',
    ('平衡常数与转化率', 'chemistry', 'high'): 'chem-h-equilibrium-constant',
    ('有机合成与推断', 'chemistry', 'high'): 'chem-h-organic-synthesis',
    ('有机物的分类与命名', 'chemistry', 'high'): 'chem-h-organic-nomenclature',
    ('烃的衍生物（醇醛酸酯）', 'chemistry', 'high'): 'chem-h-organic-derivatives',
    ('物质的分类（纯净物混合物）', 'chemistry', 'high'): 'chem-h-substance-types',
    # 生物初中
    ('光合作用', 'biology', 'middle'): 'bio-m-photosynthesis',
    ('细胞的结构与功能', 'biology', 'middle'): 'bio-m-cell-structure',
    ('遗传与变异', 'biology', 'middle'): 'bio-m-genetics-basics',
    ('消化与吸收', 'biology', 'middle'): 'bio-m-digestion',
    ('生物分类', 'biology', 'middle'): 'bio-m-classification',
    ('免疫与健康', 'biology', 'middle'): 'bio-m-immunity',
    # 地理
    ('经纬网与地球运动', 'geography', 'middle'): 'geo-m-latitude-longitude',
    ('地图的三要素', 'geography', 'middle'): 'geo-m-map-elements',
    ('天气与气候', 'geography', 'middle'): 'geo-m-weather-climate',
    ('人口与城市', 'geography', 'middle'): 'geo-m-population',
}


# ── 解析工具（复用 R1 的逻辑）────────────────────────────────────

def read_section(md_text, heading_keywords):
    lines = md_text.split('\n')
    in_sec, level, result = False, 0, []
    for line in lines:
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            cur_level, cur_title = len(m.group(1)), m.group(2).strip()
            if not in_sec:
                if any(kw in cur_title for kw in heading_keywords):
                    in_sec, level = True, cur_level
                    result.append(line)
            else:
                if cur_level <= level: break
                result.append(line)
        elif in_sec:
            result.append(line)
    return '\n'.join(result).strip()


def extract_errors(text):
    sec = read_section(text, ['易错点'])
    if not sec: return []
    errors = []
    for m in re.finditer(r'(?:^\d+\.\s*\*\*(.+?)\*\*|^\d+\.\s+(.+)|^[-*]\s+\*\*(.+?)\*\*|^[-*]\s+(.+))',
                         sec, re.MULTILINE):
        t = next((g for g in m.groups() if g), '').strip()
        t = re.sub(r'\*+', '', t).strip()
        if t and len(t) > 3:
            errors.append({'description': t, 'source': 'curriculum_md'})
    return errors[:10]


def extract_exercises(text):
    sec = read_section(text, ['典型例题', '例题', '练习'])
    if not sec: return []
    exercises = []
    blocks = re.split(r'\n(?=\*\*例\d+)', sec)
    for block in blocks:
        if not block.strip(): continue
        title_m = re.match(r'\*\*例(\d+).*?\*\*[（(]?([^)）\n]*)[)）]?\s*\n(.*?)(?=\*\*解\*\*|解：|解:|\*\*解)',
                           block, re.DOTALL)
        stem = title_m.group(3).strip() if title_m else re.sub(r'\*+例\d+.*?\*+\s*', '', block).strip()[:200]
        ans_m = re.search(r'(?:\*\*解\*\*|解：|解:)\s*([\s\S]*?)(?=---|\Z)', block)
        answer = ans_m.group(1).strip()[:300] if ans_m else ''
        if stem and len(stem) > 5:
            exercises.append({'stem': stem[:300], 'answer': answer, 'bloom': 'apply', 'source': 'curriculum_md'})
    return exercises[:8]


def extract_real_world(text):
    instances = []
    for m in re.finditer(r'\*\*例\d+[（(][^)）]*(?:实际|应用|情境|生活)[^)）]*[)）]\*\*\s*\n([^\n]+)', text):
        s = m.group(1).strip()
        if len(s) > 10: instances.append(s)
    return instances[:5]


def extract_memory_anchors(text):
    sec = read_section(text, ['记忆口诀', '口诀', '记忆'])
    if not sec: return []
    anchors = []
    for line in sec.split('\n'):
        line = line.strip().lstrip('-*0123456789. ')
        if line and not line.startswith('#') and len(line) > 3:
            anchors.append(line)
    return anchors[:5]


def parse_md(md_path):
    with open(md_path, 'r', encoding='utf-8') as f: text = f.read()
    textbook_summary = read_section(text, ['图文参考资料', '知识点精讲', '知识点总结'])
    return {
        'md_raw': text[:6000],
        'textbook_summary': textbook_summary[:3000] if textbook_summary else '',
        'errors': extract_errors(text),
        'exercises': extract_exercises(text),
        'real_world': extract_real_world(text),
        'memory_anchors': extract_memory_anchors(text),
    }


def inject_to_satellite(sat_path, md_parsed, md_rel):
    with open(sat_path, 'r', encoding='utf-8') as f: sat = json.load(f)
    existing_src = sat.get('supplements', {}).get('curriculum_md_source', '')
    if existing_src == md_rel: return 'skipped'

    sup = sat.setdefault('supplements', {})
    sup['curriculum_md_source'] = md_rel
    sup['curriculum_md_raw'] = md_parsed['md_raw']
    if md_parsed['textbook_summary']:
        sup['textbook_summary'] = md_parsed['textbook_summary']
    sup['injected_at'] = NOW

    existing_errs = {e.get('description','') for e in sat.get('errors',[])}
    for e in md_parsed['errors']:
        if e['description'] not in existing_errs:
            sat.setdefault('errors', []).append(e)

    existing_stems = {ex.get('stem','')[:30] for ex in sat.get('exercises',[])}
    for ex in md_parsed['exercises']:
        if ex['stem'][:30] not in existing_stems:
            sat.setdefault('exercises', []).append(ex)

    existing_rw = set(sat.get('real_world', []))
    for rw in md_parsed['real_world']:
        if rw not in existing_rw:
            sat.setdefault('real_world', []).append(rw)
            existing_rw.add(rw)

    existing_ma = set(sat.get('memory_anchors', []))
    for ma in md_parsed['memory_anchors']:
        if ma not in existing_ma:
            sat.setdefault('memory_anchors', []).append(ma)
            existing_ma.add(ma)

    sat['_meta']['last_inject_curriculum_md_r2'] = NOW
    sat['_meta']['sources'] = list(set(sat['_meta'].get('sources', []) + ['curriculum_standards_md']))

    with open(sat_path, 'w', encoding='utf-8') as f:
        json.dump(sat, f, ensure_ascii=False, indent=2)
    return 'injected'


def main():
    print('[1/4] 加载 R1 未匹配列表...')
    with open(REPORT_R1) as f: r1 = json.load(f)
    unmatched = r1.get('unmatched', [])
    print(f'      R1 未匹配: {len(unmatched)} 个')

    print('[2/4] 加载卫星索引...')
    with open(KP_INDEX) as f: kp_idx = json.load(f)['kps']

    # 构建 node_id → sat_abs_path 索引
    nid_to_path = {}
    for nid, rp in kp_idx.items():
        ap = os.path.join(REPO_ROOT, rp)
        if os.path.exists(ap):
            nid_to_path[nid] = ap

    print(f'      卫星文件: {len(nid_to_path)} 个')

    print('[3/4] 别名映射注入...')
    stats = {'injected': 0, 'skipped': 0, 'no_match': 0}
    still_unmatched = []

    for u in unmatched:
        name_cn   = u['name']
        subj_cn   = u['subject']
        stage_cn  = u['stage']
        subj_en   = SUBJ_MAP.get(subj_cn, '')
        stage_en  = STAGE_MAP.get(stage_cn, '')

        # 别名表查找
        node_id = ALIAS.get((name_cn, subj_en, stage_en))

        # 如果别名找不到，尝试宽松前4字前缀匹配
        if not node_id:
            core4 = re.sub(r'[（()）、，。\s]', '', name_cn)[:4]
            for nid, ap in nid_to_path.items():
                if subj_en not in nid: continue
                with open(ap) as f: s = json.load(f)
                if s.get('stage','') != stage_en: continue
                sname = re.sub(r'[（()）、，。\s]', '', s.get('name',''))
                if core4 and (core4 in sname or sname[:4] in core4):
                    node_id = nid
                    break

        if not node_id:
            stats['no_match'] += 1
            still_unmatched.append(u)
            continue

        sat_path = nid_to_path.get(node_id)
        if not sat_path:
            stats['no_match'] += 1
            still_unmatched.append(u)
            continue

        # 找 MD 文件
        md_path = os.path.join(CS_ROOT, subj_cn, stage_cn, name_cn + '.md')
        if not os.path.exists(md_path):
            stats['no_match'] += 1
            still_unmatched.append(u)
            continue

        md_rel = os.path.relpath(md_path, REPO_ROOT)
        md_parsed = parse_md(md_path)
        result = inject_to_satellite(sat_path, md_parsed, md_rel)
        stats[result] = stats.get(result, 0) + 1
        if result == 'injected':
            print(f'  ✅ {subj_cn}/{name_cn} → {node_id}')

    print(f'\n[4/4] R2 完成！注入: {stats.get("injected",0)}, '
          f'跳过: {stats.get("skipped",0)}, 仍未匹配: {stats["no_match"]}')

    with open(REPORT_OUT, 'w', encoding='utf-8') as f:
        json.dump({'generated_at': NOW, 'stats': stats,
                   'still_unmatched': still_unmatched}, f, ensure_ascii=False, indent=2)
    print(f'  报告: {os.path.relpath(REPORT_OUT, REPO_ROOT)}')

    if still_unmatched:
        print(f'\n=== 仍未匹配（{len(still_unmatched)} 个）===')
        for u in still_unmatched[:20]:
            print(f'  [{u["subject"]}/{u["stage"]}] {u["name"]}')


if __name__ == '__main__':
    main()
