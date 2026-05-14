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
import shutil
import subprocess
import sys
from collections import defaultdict
from html import unescape
from pathlib import Path
from urllib.parse import unquote, urlparse

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


LOCAL_ASSET_REF_RE = re.compile(
    r'''(?:\b(?:src|href|poster)\s*=\s*['"]([^'"]+)['"]|url\(\s*['"]?([^'")]+)['"]?\s*\))''',
    re.IGNORECASE,
)


def should_skip_asset_ref(ref):
    ref = (ref or '').strip()
    if not ref or ref.startswith(('#', '{{')):
        return True
    lowered = ref.lower()
    return lowered.startswith((
        'http://', 'https://', 'data:', 'blob:', 'mailto:', 'tel:',
        'javascript:', 'about:', 'chrome:', 'edge:',
    ))


def find_missing_local_asset_refs(course_dir, html_text):
    """检测 HTML 中会在本地/Pages 部署时产生 404 的相对静态资源引用。"""
    repo_root = Path(__file__).resolve().parents[1]
    missing = []
    seen = set()

    for match in LOCAL_ASSET_REF_RE.finditer(html_text):
        raw_ref = match.group(1) or match.group(2) or ''
        ref = unescape(raw_ref).strip()
        if should_skip_asset_ref(ref):
            continue

        parsed = urlparse(ref)
        if parsed.scheme or parsed.netloc:
            continue
        clean_ref = unquote(parsed.path)
        if not clean_ref or clean_ref.startswith('#'):
            continue

        if clean_ref.startswith('/'):
            target = (repo_root / clean_ref.lstrip('/')).resolve()
        else:
            target = (course_dir / clean_ref).resolve()

        key = (ref, str(target))
        if key in seen:
            continue
        seen.add(key)

        if not target.exists():
            try:
                target_display = target.relative_to(repo_root)
            except ValueError:
                target_display = target
            missing.append((ref, str(target_display)))

    return missing


def check_baseline_quality(course_dir, html_text):
    """v6.6 新增：内容质量硬门槛（防止劣质课件混入 community）

    检查：
    - tts/*.mp3 ≥ 5（B-2 完整版要 10，server 端宽松要 5）
    - <img src=...> ≥ 3 张（B-3a）
    - 标准 section 至少覆盖 5/8（hero/objectives/intro/concept/example/practice/summary/kg）
    - 末尾必须有 知识图谱/相关知识点 章节（B-5）
    - 课件文件总数 ≥ 8（防止只交一个 HTML 蒙混）

    返回 (errors, warns) 列表
    """
    import re
    errors = []
    warns = []

    # 1. TTS 文件数（支持 tts/ 与 assets/tts/ 两种标准目录）
    mp3_count = len(list(course_dir.glob('tts/*.mp3'))) + len(list(course_dir.glob('assets/tts/*.mp3')))
    if mp3_count < 3:
        errors.append(('error',
            f'{course_dir.name}: TTS 不足（{mp3_count} 个 mp3，至少需 3）— 课件应覆盖导入/核心模块/小结等关键讲解'))

    # 2. 图片数（HTML 引用 + 实际文件）
    img_refs = len(re.findall(r"<img[^>]+src=['\"][^'\"]+['\"]", html_text))
    img_files = sum(1 for ext in ('png', 'jpg', 'jpeg', 'webp', 'svg')
                    for _ in course_dir.rglob(f'*.{ext}'))
    if img_refs < 3:
        errors.append(('error',
            f'{course_dir.name}: HTML 仅引用 {img_refs} 张图（B-3a 要求 ≥3）— 课件应至少有 3 张可视化图'))
    if img_files < 3:
        errors.append(('error',
            f'{course_dir.name}: 课件目录仅有 {img_files} 张图文件（assets/ 至少 3 张）'))

    # 3. 标准 section 覆盖（弱化的 B-6）
    section_keywords = {
        'hero': r'(hero|英雄|首屏)',
        'objectives': r'(objectives|学习目标|目标)',
        'introduction': r'(introduction|引入|导入)',
        'core-concept': r'(核心概念|core[- ]concept|principle)',
        'example': r'(example|例题|案例|示例)',
        'practice': r'(practice|练习|测试|quiz|pretest|posttest)',
        'summary': r'(summary|总结|小结)',
        'knowledge-map': r'(知识图谱|相关知识|knowledge[- ]map|前置|后续|延伸)',
    }
    h_lower = html_text.lower()
    found = [k for k, pat in section_keywords.items() if re.search(pat, h_lower)]
    if len(found) < 5:
        errors.append(('error',
            f'{course_dir.name}: 标准结构覆盖 {len(found)}/8（缺 {set(section_keywords)-set(found)}），至少需 5 个'))

    # 4. 知识图谱/相关章节（B-5）：允许标准模块在脚本前出现，不再只看尾部 3KB
    if not re.search(r'id=[\'\"]knowledge-graph[\'\"]|data-teachany-kg|知识图谱|相关知识|前置知识|后续知识|knowledge[- ]map|延伸', html_text, re.IGNORECASE):
        errors.append(('error',
            f'{course_dir.name}: 缺知识图谱章节（B-5），需挂载标准 data-teachany-kg 模块或相关知识卡片'))

    # 5. 课件文件总数（防止 1-2 文件蒙混）
    file_count = sum(1 for f in course_dir.rglob('*') if f.is_file())
    if file_count < 8:
        errors.append(('error',
            f'{course_dir.name}: 课件文件总数 {file_count}（至少 8 个）— 完整课件应含 HTML + manifest + tts/*.mp3 + assets/*'))

    # 6. 必须有锚点跳转（导航）
    anchors = len(re.findall(r"href=['\"]#[a-zA-Z][^'\"# ]+['\"]", html_text))
    if anchors < 3:
        warns.append(('warn',
            f'{course_dir.name}: HTML 内锚点跳转 {anchors} 个（B-6 推荐 ≥3 段间跳转），课件应可前后翻页'))

    # 7. Hero 图基线（v6.3 新增 - 硬规则 #57）
    hero_file_pattern = re.compile(r'.*hero.*\.(png|jpg|jpeg|webp|svg)$', re.IGNORECASE)
    hero_ref_pattern = re.compile(
        r'''(?:src\s*=\s*['"]|url\(\s*['"]?)([^'")\s]*hero[^'")\s]*\.(?:png|jpg|jpeg|webp|svg))''',
        re.IGNORECASE
    )
    hero_files = [f for f in course_dir.rglob('*') if f.is_file() and hero_file_pattern.match(f.name)]
    hero_refs = hero_ref_pattern.findall(html_text)
    if not hero_files:
        errors.append(('error',
            f'{course_dir.name}: 缺 hero 封面图（assets/ 下无任何 *hero*.png/jpg/webp）— 硬规则 #57 / SKILL_CN Section 0.5'))
    if not hero_refs:
        errors.append(('error',
            f'{course_dir.name}: HTML 未引用 hero 图（Hero section 必须有 <img class="hero-cover-img" src="./assets/...-hero.png">）— 硬规则 #57'))
    if hero_refs and hero_files:
        hero_filenames = {f.name for f in hero_files}
        broken = []
        for ref in hero_refs:
            if re.match(r'^https?://', ref, re.IGNORECASE):
                continue
            if Path(ref).name not in hero_filenames:
                broken.append(ref)
        if broken:
            errors.append(('error',
                f'{course_dir.name}: HTML 引用了 {len(broken)} 个不存在的 hero 路径 → broken image 404 — 硬规则 #57'))

    return errors + warns


def run_teaching_quality_gate(course_dir):
    """v7.3：调用反空壳教学质量闸门。"""
    script = Path(__file__).with_name('validate-teaching-quality.py')
    if not script.exists():
        return [('error', f'{course_dir.name}: 缺少 validate-teaching-quality.py，无法执行 v7.3 教学质量闸门')]
    result = subprocess.run(
        [sys.executable, str(script), str(course_dir), '--json'],
        capture_output=True,
        text=True,
    )
    try:
        payload = json.loads(result.stdout or '{}')
    except json.JSONDecodeError:
        return [('error', f'{course_dir.name}: v7.3 教学质量闸门输出无法解析：{result.stdout[:200]} {result.stderr[:200]}')]
    issues = []
    for item in payload.get('issues', []):
        level = item.get('level', 'error')
        msg = item.get('message', '')
        if level in ('error', 'warn') and msg:
            issues.append((level, msg))
    if result.returncode != 0 and not any(i[0] == 'error' for i in issues):
        issues.append(('error', f'{course_dir.name}: v7.3 教学质量闸门失败，但未返回明确错误'))
    return issues


def has_audio_stream(mp4_path):
    """用 ffprobe 检查 mp4 是否有音频流；ffprobe 不存在时返回 None。"""
    if not shutil.which('ffprobe'):
        return None
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', str(mp4_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False
    return any(line.strip() == 'audio' for line in result.stdout.splitlines())


def validate_one(course_dir):
    mf = course_dir / 'manifest.json'
    html = course_dir / 'index.html'
    errors = []

    # ⭐ v5.34.9.2: 无 manifest.json 直接 error（发布阻断）
    # 根因：2026-04-20 发现 science-genetics-variation-intro 课件没 manifest，
    # 老逻辑只给个 warn 然后 return，导致后续 47 条硬规则全部跳过，形成"裸 HTML
    # 绕过质检"漏洞。
    if not mf.exists():
        errors.append(('error', f'{course_dir.name}: 缺少 manifest.json '
                               f'（硬规则 #18 强制 · 发布阻断 · 须含 name/subject/grade/node_id/teachany_version）'))
        # 即便缺 manifest，也继续检查 HTML 是否存在，给用户一次性反馈
    if not html.exists():
        errors.append(('error', f'{course_dir.name}: 缺少 index.html（硬规则 #21 强制）'))
    # manifest 和 html 都缺就直接返回
    if not mf.exists():
        return errors

    m = json.load(open(mf, encoding='utf-8'))
    mg = m.get('grade')
    ms = m.get('subject')
    mn = m.get('node_id')
    mv = m.get('teachany_version')
    # v5.30：curriculum 字段决定校验规则集；默认 cn-national（向下兼容）
    mc = m.get('curriculum', 'cn-national')

    issues = list(errors)  # v5.34.9.2: 把早期错误（如 html 缺失）合并进主返回列表

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

    # 6b. 共享脚本幽灵引用由通用本地资源死链检测统一处理，支持 ../../scripts/*.js/css。

    # 7. L3 TTS 语音基线（v5.34.6 新增，硬规则 #16/#31）
    #    每个课件必须有 tts/*.mp3 或 assets/tts/*.mp3 语音文件 + 可见音频播放器 UI
    mp3_files = list(course_dir.glob('tts/*.mp3')) + list(course_dir.glob('assets/tts/*.mp3'))
    if not mp3_files:
        issues.append(('error',
            f'{course_dir.name}: 缺少 tts/*.mp3 或 assets/tts/*.mp3 语音文件（硬规则 #16/#31 强制）'))
    else:
        if len(mp3_files) < 3:
            issues.append(('error',
                f'{course_dir.name}: 仅 {len(mp3_files)} 个 mp3 文件 < 3（至少覆盖三个核心讲解段）'))
        for mp3 in mp3_files:
            if mp3.stat().st_size < 20 * 1024:
                issues.append(('error',
                    f'{course_dir.name}: {mp3.relative_to(course_dir)} 仅 {mp3.stat().st_size} 字节，疑似静音/占位/低质量音频'))
        # 必须有播放器 UI（标准 audio player 或旧 audioPlaylist 任一标志）
        if html.exists():
            has_audio_ui = any(marker in full_html for marker in (
                'data-teachany-audio-playlist', 'teachany-audio-player.js', 'audioPlaylist', 'audioBadge', 'audioPanel'
            ))
            if not has_audio_ui:
                issues.append(('error',
                    f'{course_dir.name}: 已有 mp3 但 HTML 缺标准连续音频播放器 UI（需 data-teachany-audio-playlist + teachany-audio-player.js）'))

    # 7b. TTS 幽灵引用检测已由通用本地资源死链检测覆盖，支持 tts/ 与 assets/tts/。

    # 8. AI 生图基线（v5.34.6 新增，硬规则 #34）
    #    文/理/工/社科课件必须有 ≥2 张 assets/*.png/jpg 插图，并在 HTML <img> 引用
    assets_dir = course_dir / 'assets'
    img_files = []
    if assets_dir.exists():
        img_files = [f for f in assets_dir.rglob('*') if f.is_file() and f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.svg')]
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

    # 8b. 本地资源幽灵引用检测（v7.9.16 增强）——HTML 引用的本地文件不存在会导致 404
    if html.exists() and full_html:
        missing_refs = find_missing_local_asset_refs(course_dir, full_html)
        if missing_refs:
            preview = '；'.join(f'{ref} → {target}' for ref, target in missing_refs[:8])
            more = f'；另有 {len(missing_refs) - 8} 个' if len(missing_refs) > 8 else ''
            issues.append(('error',
                f'{course_dir.name}: HTML 有 {len(missing_refs)} 个本地资源引用不存在（会导致 404）：{preview}{more}'))

    # 8c. Hero 图硬校验（v7.3）——不能只有 hero 文案而无知识结构主图
    if html.exists() and full_html:
        hero_refs = re.findall(r'<img[^>]+class=[\'"][^\'"]*(?:hero-img|hero-cover-img)[^\'"]*[\'"][^>]+src=[\'"]([^\'"]+)[\'"]', full_html, re.IGNORECASE)
        hero_refs += re.findall(r'<img[^>]+src=[\'"]([^\'"]*hero[^\'"]*)[\'"][^>]+class=[\'"][^\'"]*(?:hero-img|hero-cover-img)[^\'"]*[\'"]', full_html, re.IGNORECASE)
        if not hero_refs:
            issues.append(('error',
                f'{course_dir.name}: 缺少 hero-img/hero-cover-img 知识结构主图引用（v7.3 阻断）'))
        for ref in set(hero_refs):
            clean_ref = ref.lstrip('./')
            if clean_ref.startswith('assets/') and not (course_dir / clean_ref).exists():
                issues.append(('error',
                    f'{course_dir.name}: Hero 图引用 {ref} 但文件不存在'))

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

    # 10. Canvas 互动基线（v5.34.11 新增，硬规则 #33）
    #     每个课件必须有 ≥1 个原生 <canvas> 交互组件（纯文言字词类可豁免）
    if html.exists() and full_html:
        canvas_tags = re.findall(r'<canvas\b[^>]*>', full_html, re.IGNORECASE)
        # 纯文言字词豁免：语文 + node_id 含 classical/character/stroke
        is_pure_chn_char = (ms == 'chinese' and any(kw in (mn or '') for kw in
                            ('classical', 'character', 'stroke', 'pinyin')))
        if not canvas_tags and not is_pure_chn_char:
            issues.append(('error',
                f'{course_dir.name}: HTML 无原生 <canvas> 交互组件（硬规则 #33 强制 · 拖拽/画板/参数滑块/实时绘图任一；纯文言字词可用 SVG 替代但需在 manifest 声明）'))
        elif canvas_tags:
            has_canvas_logic = bool(re.search(r'getContext\s*\(|draw\w*\s*\(', full_html))
            has_canvas_event = bool(re.search(r'addEventListener\s*\(\s*[\'\"](?:pointer|mouse|touch|click|input|change)', full_html))
            has_student_control = bool(re.search(r'<(?:input|select|button)\b', full_html, re.IGNORECASE))
            if not (has_canvas_logic and has_canvas_event and has_student_control):
                issues.append(('error',
                    f'{course_dir.name}: Canvas 存在但缺少真实互动闭环（需 getContext/draw + pointer/click/input/change 事件 + 学生可操作控件）'))

    # 11. Remotion 教学动画基线（v7.3 强化，硬规则 #32）
    #     每个课件必须有 ≥1 段真实 Remotion 渲染的 mp4，且必须带 audio 流。
    mp4_files = list(course_dir.glob('assets/*.mp4')) + list(course_dir.glob('assets/video/*.mp4')) + list(course_dir.glob('videos/*.mp4'))
    video_refs = []
    if html.exists() and full_html:
        video_refs = re.findall(r'<(?:source|video)[^>]+src=[\'"]([^\'\"]+\.mp4)[\'"]', full_html, re.IGNORECASE)
    if not mp4_files:
        issues.append(('error',
            f'{course_dir.name}: 无真实 mp4 教学动画（硬规则 #32 · v7.3 阻断）；'
            f'Canvas/SVG/CSS 动画不得替代 Remotion，必须补 assets/video/*.mp4'))
    if mp4_files and not video_refs:
        issues.append(('error',
            f'{course_dir.name}: 已有 mp4 文件但 HTML 未用 <video>/<source> 静态嵌入'))
    for ref in set(video_refs):
        clean_ref = ref.lstrip('./')
        if not (course_dir / clean_ref).exists():
            issues.append(('error',
                f'{course_dir.name}: HTML 引用了 {ref} 但文件不存在（视频死链）'))
    for mp4 in mp4_files:
        audio_state = has_audio_stream(mp4)
        if audio_state is False:
            issues.append(('error',
                f'{course_dir.name}: {mp4.relative_to(course_dir)} 无 audio 流（哑片 mp4 不合规）'))
        elif audio_state is None:
            issues.append(('warn',
                f'{course_dir.name}: 未找到 ffprobe，无法验证 {mp4.relative_to(course_dir)} 是否含 audio 流'))

    # 12. 知识图谱基线（v5.34.11 新增，硬规则 #24）
    #     课件必须含交互式 #knowledge-graph section 或相应 SVG 图
    if html.exists() and full_html:
        has_kg_section = bool(re.search(r'id=[\'"]knowledge-graph[\'"]', full_html))
        has_kg_data = 'knowledgeGraphData' in full_html or '_graph.json' in full_html
        if not has_kg_section and not has_kg_data:
            issues.append(('error',
                f'{course_dir.name}: HTML 缺 #knowledge-graph section 或 knowledgeGraphData 数据'
                f'（硬规则 #24 · 每个课件必须含交互式知识图谱）'))

    # 13. 地图基线（v5.34.11 新增，硬规则 #35/#36）
    #     历史/地理课件必须有 XYZ 瓦片底图 + fitBounds/setView 聚焦
    needs_map = ms in ('history', 'geography')
    if needs_map and html.exists() and full_html:
        has_tile_layer = bool(re.search(r'L\.tileLayer\s*\(', full_html))
        has_fit_bounds = bool(re.search(r'\.fitBounds\s*\(|\.setView\s*\(', full_html))
        has_image_overlay = bool(re.search(r'L\.imageOverlay\s*\(', full_html))
        has_echarts_graphic_image = bool(re.search(
            r'graphic\s*:\s*\[[^\]]*?type\s*:\s*[\'"]image[\'"]', full_html))
        if has_image_overlay:
            issues.append(('error',
                f'{course_dir.name}: 检测到 L.imageOverlay 旧底图方案'
                f'（硬规则 #35 严禁 · v7.3 起统一改用 L.tileLayer XYZ 瓦片）'))
        if has_echarts_graphic_image:
            issues.append(('error',
                f'{course_dir.name}: 检测到 ECharts graphic type:"image" 铺底图'
                f'（硬规则 #35 严禁 · DOM 绝对定位不跟随 geo 变换，必定错位）'))
        if not has_tile_layer:
            issues.append(('error',
                f'{course_dir.name}: 历史/地理课件 HTML 缺 L.tileLayer XYZ 瓦片底图调用'
                f'（硬规则 #35 · 必须用 cartodb-basemaps + arcgisonline hillshade 双层）'))
        if not has_fit_bounds:
            issues.append(('error',
                f'{course_dir.name}: 地图初始化未调用 fitBounds/setView 聚焦核心区域'
                f'（硬规则 #36 · 禁止停留在 [0,0] 默认中心）'))

    # 14. 视频嵌入规范（v5.34.11 新增，硬规则 #25）
    if html.exists() and full_html:
        # 若使用了视频，必须用 <video> 标签 + controls + preload + playsinline
        video_with_attrs = re.findall(
            r'<video\b[^>]*>', full_html, re.IGNORECASE)
        if video_with_attrs:
            for v in video_with_attrs:
                low = v.lower()
                if 'controls' not in low:
                    issues.append(('warn',
                        f'{course_dir.name}: <video> 标签缺 `controls` 属性'
                        f'（硬规则 #25 · 必须允许用户手动播放）'))
                    break
        # 严禁纯 JS 动态 createElement('video')（v5.34.11 放宽为 warn）
        if re.search(r'createElement\s*\(\s*[\'"]video[\'"]', full_html):
            issues.append(('warn',
                f'{course_dir.name}: 检测到 createElement("video") 动态视频注入'
                f'（硬规则 #25 · 推荐直接写 <video> 标签，便于无 JS 环境与打印）'))

    # v6.6/v7.3: 内容质量硬门槛（防止劣质课件混入 community）
    # 仅对 community/ 课件强制（examples/ 是历史保留，包含老格式课件）
    if html.exists() and full_html and 'community' in str(course_dir):
        quality_issues = check_baseline_quality(course_dir, full_html)
        issues.extend(quality_issues)
        issues.extend(run_teaching_quality_gate(course_dir))

    return issues


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    examples = Path('examples')
    community = Path('community')  # v6.6: server 端必须扫 community/
    all_issues = []
    scanned = 0
    # v5.29：收集 (course_id, node_id, status) 做跨课件冲突检测
    node_to_courses = defaultdict(list)

    # v6.6: 同时扫 examples/ 和 community/（不含 drafts/pending）
    scan_dirs = []
    if examples.exists():
        scan_dirs.extend(sorted(examples.iterdir()))
    if community.exists():
        for d in sorted(community.iterdir()):
            if d.name in ('drafts', 'pending', 'README.md'):
                continue
            scan_dirs.append(d)

    for d in scan_dirs:
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
