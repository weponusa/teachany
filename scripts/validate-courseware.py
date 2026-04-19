#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
课件挂载一致性校验器 (v5.27 新增，v5.29 增强)

在发布任何课件前（rebuild-index 之前）必须运行，确保：
  1. manifest.grade 的学段 与 manifest.node_id 的前缀（chem-h-/chem-m-/chem-e-）一致
  2. manifest.subject 与 node_id 的学科前缀一致
  3. HTML title/course-id 中的学段指示（高中/初中/小学/必修X/xxx年级）与 manifest.grade 一致
  4. <title> 规范：含 TeachAny v{ver} + 学段 + 年级
  5. manifest.teachany_version 字段存在
  6. (v5.29) 同一 node_id 不挂多份不同 id 的课件（冲突挂载检测）

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
from collections import defaultdict
from pathlib import Path

LEVEL_RANGE = {'elementary': (1,6), 'middle': (7,9), 'high': (10,12)}

SUBJECT_PREFIXES = {
    'chn': 'chinese', 'math': 'math', 'eng': 'english',
    'phy': 'physics', 'chem': 'chemistry', 'bio': 'biology',
    'hist': 'history', 'geo': 'geography', 'it': 'info-tech',
    'sci': 'science',  # v5.34.6 新增：小学科学
}

LEVEL_INFIX = {
    '-e-': 'elementary', '-m-': 'middle', '-h-': 'high',
}

# 国际课标 infix 识别（v5.30 新增）——命中任一表示该课件使用非 cn-national 体系
INTERNATIONAL_INFIXES = ['-ib-dp-', '-ib-myp-', '-cam-igcse-', '-cam-as-', '-cam-al-', '-ap-']

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
    mv = m.get('teachany_version')
    # v5.30：curriculum 字段决定校验规则集；默认 cn-national（向下兼容）
    mc = m.get('curriculum', 'cn-national')

    issues = []

    # v5.30：国际课标体系走独立校验路径（ID 前缀、年级范围、HTML 线索关键词都不同）
    if mc != 'cn-national':
        # 仅做最小校验：subject 与 node_id 学科前缀一致 + teachany_version 必填 + title 含 TeachAny
        node_subject, _ = parse_node_id(mn)
        # 检查是否真的用了国际 infix
        uses_intl_infix = any(ix in (mn or '') for ix in INTERNATIONAL_INFIXES)
        if mn and not uses_intl_infix:
            issues.append(('warn',
                f'{course_dir.name}: curriculum={mc} 但 node_id={mn} 未使用国际课标 infix（如 -ib-dp- / -cam-al- / -ap-）'))
        if ms and node_subject and ms != node_subject:
            issues.append(('error',
                f'{course_dir.name}: manifest.subject={ms} 但 node_id={mn} 指向 {node_subject}'))
        if not mv:
            issues.append(('error',
                f'{course_dir.name}: manifest 缺 teachany_version 字段（示例: "5.27"）'))
        # title 只要求含 TeachAny v（学段/年级校验跳过，因为国际体系命名规范不同）
        if html.exists():
            html_head = ''
            with open(html, encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f):
                    if i > 150: break
                    html_head += line
            title_m = re.search(r'<title>([^<]+)</title>', html_head)
            if title_m and 'TeachAny v' not in title_m.group(1):
                issues.append(('error',
                    f'{course_dir.name}: <title> 不含 "TeachAny v{{version}}" 标识'))
        return issues

    # ── 以下为 cn-national（中国课标）原有校验逻辑 ──────────────
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
    html_head = ''
    if html.exists():
        with open(html, encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f):
                if i > 150: break
                html_head += line
        html_level, clue = detect_html_level(html_head)
        if html_level and manifest_level and html_level != manifest_level:
            issues.append(('error',
                f'{course_dir.name}: HTML 线索指示"{html_level}"(发现 "{clue}") 但 manifest.grade={mg}({manifest_level})'))

    # 4. title 规范（v5.27 新增）
    # 标准格式：《课件名》 · 《学段》《学科》 G{grade} · TeachAny v{version}
    if html.exists():
        title_m = re.search(r'<title>([^<]+)</title>', html_head)
        if title_m:
            title = title_m.group(1)
            # 检查是否包含 TeachAny 版本
            if 'TeachAny v' not in title:
                issues.append(('error',
                    f'{course_dir.name}: <title> 不含 "TeachAny v{{version}}" 标识 (当前: "{title}")'))
            # 检查是否包含学段标签（小学/初中/高中）
            if manifest_level:
                level_cn = {'elementary':'小学', 'middle':'初中', 'high':'高中'}[manifest_level]
                if level_cn not in title:
                    issues.append(('error',
                        f'{course_dir.name}: <title> 不含学段 "{level_cn}" (当前: "{title}")'))
            # 检查是否包含年级标识
            if isinstance(mg, int) and f'G{mg}' not in title and f'{mg}年级' not in title:
                issues.append(('error',
                    f'{course_dir.name}: <title> 不含年级 "G{mg}" (当前: "{title}")'))
        else:
            issues.append(('warn', f'{course_dir.name}: 无 <title> 标签'))

    # 5. manifest.teachany_version（v5.27 新增）
    if not mv:
        issues.append(('error',
            f'{course_dir.name}: manifest 缺 teachany_version 字段（示例: "5.27"）'))

    # 6. AI 学伴基线校验（v5.34 新增，硬规则 #45）
    if html.exists():
        try:
            full_html = html.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            full_html = ''
        if full_html:
            # ① 必须引入 ai-tutor.css
            if 'ai-tutor.css' not in full_html:
                issues.append(('error',
                    f'{course_dir.name}: HTML 缺少 <link rel="stylesheet" href="./ai-tutor.css"> （v5.34 强制 · 硬规则 #45）'))
            # ② 必须引入 ai-tutor.js
            if 'ai-tutor.js' not in full_html:
                issues.append(('error',
                    f'{course_dir.name}: HTML 缺少 <script src="./ai-tutor.js"> （v5.34 强制 · 硬规则 #45）'))
            # ③ 必须注入 TUTOR_CONFIG
            if '__TEACHANY_TUTOR_CONFIG__' not in full_html:
                issues.append(('error',
                    f'{course_dir.name}: HTML 缺少 window.__TEACHANY_TUTOR_CONFIG__ 配置注入（v5.34 强制 · 硬规则 #45）'))
            # ④ 严禁硬编码 API Key（明文 sk-xxx）
            key_leak = re.search(r'[\'"]sk-[A-Za-z0-9]{16,}[\'"]', full_html)
            if key_leak:
                issues.append(('error',
                    f'{course_dir.name}: HTML 疑似硬编码 OpenAI API Key（{key_leak.group(0)[:20]}…）— 严禁任何形式把 Key 写入代码（v5.34 强制 · 硬规则 #45）'))

    # 7. L3 TTS 语音基线（v5.34.6 新增，硬规则 #16/#31）
    #    每个课件必须有 tts/*.mp3 语音文件 + 课件 HTML 必须有音频播放器 UI 元素
    tts_dir = course_dir / 'tts'
    mp3_files = list(tts_dir.glob('*.mp3')) if tts_dir.exists() else []
    if not mp3_files:
        issues.append(('error',
            f'{course_dir.name}: 缺少 tts/*.mp3 语音文件（硬规则 #16/#31 强制 · edge-tts 生成，仅用户明确拒绝时豁免）'))
    else:
        if len(mp3_files) < 3:
            issues.append(('warn',
                f'{course_dir.name}: 仅 {len(mp3_files)} 个 mp3 文件（建议 ≥ 3 段，与 section/slide 数量对齐）'))
        # 必须有播放器 UI（audioBadge + audioPanel + mainAudio 任一标志）
        if html.exists():
            if 'audioBadge' not in full_html and 'audioPanel' not in full_html and 'audioPlaylist' not in full_html:
                issues.append(('error',
                    f'{course_dir.name}: tts/ 已有 mp3 但 HTML 缺音频播放器 UI（需 audioBadge/audioPanel/audioPlaylist 任一，v5.34.6 强制 · 硬规则 #26）'))

    # 8. AI 生图基线（v5.34.6 新增，硬规则 #34）
    #    文/理/工/社科课件必须有 ≥2 张 assets/*.png/jpg 插图，并在 HTML <img> 引用
    assets_dir = course_dir / 'assets'
    img_files = []
    if assets_dir.exists():
        img_files = [f for f in assets_dir.iterdir() if f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')]
    if html.exists() and full_html:
        img_tags = re.findall(r'<img[^>]+src=[\'"]\.?/?assets/[^\'"]+[\'"]', full_html)
        # 仅纯计算题课可豁免（subject=math 且 node_id 含 "calculation"/"operation"）
        is_pure_calc = (ms == 'math' and any(kw in (mn or '') for kw in ('calculation', 'operation', 'arithmetic')))
        if not is_pure_calc:
            if len(img_files) < 2:
                issues.append(('error',
                    f'{course_dir.name}: assets/ 仅 {len(img_files)} 张图 < 2（硬规则 #34 强制 · 需调用 image_gen 生成≥2 张情境/过程/意境插图，仅纯计算课可豁免）'))
            if len(img_tags) < 2:
                issues.append(('error',
                    f'{course_dir.name}: HTML 中 <img src="./assets/..."> 引用仅 {len(img_tags)} 处 < 2（硬规则 #34 强制 · 生成的图必须嵌入 HTML 对应 section）'))

    # 9. PPTX 基线（v5.34.6 新增，硬规则 #47）
    #    若课件存在 *.pptx，则 PPTX 必须包含图（否则是简陋 PPTX，直接 Gate 不通过）
    pptx_files = list(course_dir.glob('*.pptx'))
    if pptx_files:
        pptx_path = pptx_files[0]
        try:
            from zipfile import ZipFile
            with ZipFile(pptx_path) as z:
                all_files = z.namelist()
                pptx_slides = [f for f in all_files if 'slides/slide' in f and f.endswith('.xml')]
                pptx_media = [f for f in all_files if '/media/' in f]
            size_kb = pptx_path.stat().st_size / 1024
            # 硬规则 #47：PPTX 大小 < 100KB 或含图数 = 0 视为简陋
            if size_kb < 100:
                issues.append(('error',
                    f'{course_dir.name}: PPTX {pptx_path.name} 仅 {size_kb:.1f}KB < 100KB（过于简陋 · 硬规则 #47）— 需先确保 HTML 有 ≥2 张 assets 图再重跑 export-pptx.py'))
            if len(pptx_media) == 0 and len(pptx_slides) > 2:
                issues.append(('error',
                    f'{course_dir.name}: PPTX {pptx_path.name} 含 {len(pptx_slides)} 页幻灯片但 0 张图（硬规则 #47）— HTML 的 assets/*.png 可能未被 export-pptx.py 抓取，检查 <img src=> 路径'))
            # 建议：图数应至少覆盖 30% 的 slide
            if len(pptx_slides) > 0 and len(pptx_media) / len(pptx_slides) < 0.3:
                issues.append(('warn',
                    f'{course_dir.name}: PPTX 图片密度偏低 {len(pptx_media)}/{len(pptx_slides)} 张（建议 ≥30% · 硬规则 #47）'))
        except Exception as e:
            issues.append(('warn', f'{course_dir.name}: PPTX 解析失败: {e}'))

    return issues


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    examples = Path('examples')
    all_issues = []
    scanned = 0
    # v5.29：收集 (course_id, node_id, status) 做跨课件冲突检测
    node_to_courses = defaultdict(list)

    for d in sorted(examples.iterdir()):
        if not d.is_dir() or d.name.startswith('_') or d.name.startswith('course-'):
            continue
        if only and d.name != only:
            continue
        issues = validate_one(d)
        all_issues.extend(issues)
        scanned += 1

        # 收集 node_id（用于后续冲突检测，仅全量扫描时生效）
        if not only:
            mf = d / 'manifest.json'
            if mf.exists():
                try:
                    m = json.load(open(mf, encoding='utf-8'))
                    nid = m.get('node_id')
                    if nid:
                        node_to_courses[nid].append({
                            'course_id': d.name,
                            'status': m.get('status', 'unknown'),
                            'grade': m.get('grade'),
                            'name': m.get('name', ''),
                        })
                except Exception:
                    pass

    # v5.29：跨课件检测——同 node_id 最多 1 份 official（community 允许多份并按 likes 排序）
    if not only:
        for nid, items in sorted(node_to_courses.items()):
            officials = [it for it in items if it.get('status') == 'official']
            if len(officials) > 1:
                ids_str = ', '.join(it['course_id'] for it in officials)
                all_issues.append(('error',
                    f'节点 {nid} 被 {len(officials)} 份 official 课件同时挂载: {ids_str}；'
                    f'同一知识点的官方课件必须唯一，请合并内容或将其中一份降级为 community'))
            # 同时提供信息性警告，帮助观察哪些节点已存在多份课件（不阻断）
            elif len(items) > 1:
                ids_str = ', '.join(f"{it['course_id']}({it.get('status','?')})" for it in items)
                all_issues.append(('info',
                    f'节点 {nid} 挂载了 {len(items)} 份课件（{ids_str}）— Gallery 会按 likes 排序展示'))

    errors = [i for i in all_issues if i[0] == 'error']
    warns = [i for i in all_issues if i[0] == 'warn']
    infos = [i for i in all_issues if i[0] == 'info']

    print(f"扫描 {scanned} 个课件")
    print(f"❌ 错误: {len(errors)}")
    for _, msg in errors:
        print(f"   {msg}")
    if warns:
        print(f"⚠ 警告: {len(warns)}")
        for _, msg in warns:
            print(f"   {msg}")
    if infos:
        print(f"ℹ️  信息: {len(infos)} 个节点挂载多份课件（非错误，仅提示）")
        for _, msg in infos:
            print(f"   {msg}")

    if errors:
        sys.exit(1)
    print("\n✅ 所有课件挂载一致性校验通过")


if __name__ == '__main__':
    main()
