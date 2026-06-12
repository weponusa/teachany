#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen-hero-svg.py（v8.0）—— Hero 图 L3 SVG 兜底生成器

当 CDN / Agnes 生图不可用时，生成「知识全景地图」风格 SVG：
- 从 manifest / knowledge-context.json / index.html 提取真实知识点
- 每张分支卡片含标题 + 要点（非「核心概念/关键方法」空壳）
- 支持 PBL ext-* 项目补充样式

用法:
    python3 scripts/gen-hero-svg.py community/ext-7be00e85
    python3 scripts/gen-hero-svg.py community/bio-h-nervous-regulation \\
        --title "神经调节" --subtitle "高中生物" \\
        --nodes "动作电位:膜电位变化|突触传递:化学信号跨突触"
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

VIEW_W, VIEW_H = 1280, 720
FONT = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif"

STAGE_THEMES = {
    'elementary': {'bg': ('#fffbeb', '#fef3c7'), 'accent': '#f59e0b', 'hub': '#d97706'},
    'middle': {'bg': ('#fafbff', '#eef2ff'), 'accent': '#6366f1', 'hub': '#4f46e5'},
    'high': {'bg': ('#f8fafc', '#e2e8f0'), 'accent': '#0ea5e9', 'hub': '#0369a1'},
    'default': {'bg': ('#fafbff', '#eef2ff'), 'accent': '#6366f1', 'hub': '#4f46e5'},
}

NODE_PALETTE = [
    ('#6366f1', '#eef2ff'),
    ('#06b6d4', '#ecfeff'),
    ('#10b981', '#ecfdf5'),
    ('#f59e0b', '#fffbeb'),
    ('#ec4899', '#fdf2f8'),
    ('#8b5cf6', '#f5f3ff'),
]

GENERIC_ZH = {'核心概念', '关键方法', '典型应用', '拓展迁移', '概念一', '概念二'}


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return {}


def clip(text: str, n: int) -> str:
    s = re.sub(r'\s+', ' ', str(text or '').strip())
    if len(s) <= n:
        return s
    return s[: n - 1] + '…'


def split_objective(obj: str) -> tuple[str, str]:
    """学习目标 → (卡片标题, 要点)"""
    s = str(obj).strip()
    for sep in ('——', '—', '，', ',', '；', ';', '：', ':', '–', '-'):
        if sep in s:
            a, b = s.split(sep, 1)
            a, b = a.strip(), b.strip()
            if len(a) >= 4 and (not b or len(b) >= 4):
                return clip(a, 18), clip(b, 40)
    if len(s) > 20:
        return clip(s[:18], 18), clip(s[18:], 40)
    return clip(s, 18), ''


def parse_manual_nodes(raw: str) -> list[dict]:
    cards = []
    for part in re.split(r'[,，]', raw):
        part = part.strip()
        if not part:
            continue
        if '|' in part or ':' in part or '：' in part:
            sep = '|' if '|' in part else ('：' if '：' in part else ':')
            title, bullet = part.split(sep, 1)
            cards.append({'title': clip(title.strip(), 14), 'bullets': [clip(bullet.strip(), 38)]})
        else:
            cards.append({'title': clip(part, 14), 'bullets': []})
    return cards


def extract_html_headings(course_dir: Path) -> list[str]:
    html_path = course_dir / 'index.html'
    if not html_path.exists():
        return []
    try:
        html = html_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return []
    skip = {'封面', '目录', '导航', '页脚', 'AI 学伴', '知识图谱', '封面页'}
    headings = []
    for m in re.finditer(r'<h[234][^>]*>(.*?)</h[234]>', html, re.I | re.S):
        t = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        t = re.sub(r'\s+', ' ', t)
        if t and len(t) > 1 and len(t) < 40 and t not in skip:
            headings.append(t)
    # 分页 slide 标题
    for m in re.finditer(r'data-tsh=["\']([^"\']+)["\']', html):
        t = m.group(1).strip()
        if t and t not in skip and t not in headings:
            headings.append(t)
    out, seen = [], set()
    for h in headings:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return out[:8]


def derive_cards(manifest: dict, kc: dict, headings: list[str]) -> list[dict]:
    cards: list[dict] = []

    objectives = manifest.get('learning_objectives') or []
    for obj in objectives[:4]:
        if not obj:
            continue
        title, bullet = split_objective(str(obj))
        bullets = [bullet] if bullet else []
        cards.append({'title': title, 'bullets': bullets})

    if len(cards) >= 3:
        for err in (kc.get('common_errors') or [])[:1]:
            if isinstance(err, dict) and err.get('error'):
                cards.append({'title': '易错提醒', 'bullets': [clip(err['error'], 40)]})
                break
        for item in (kc.get('extends') or [])[:1]:
            cards.append({'title': clip(str(item), 18), 'bullets': ['拓展迁移']})
        return cards[:6]

    # knowledge-context 扩展
    for item in (kc.get('extends') or [])[:2]:
        cards.append({'title': clip(str(item), 14), 'bullets': ['拓展方向']})
    for item in (kc.get('prerequisites') or [])[:2]:
        cards.append({'title': clip(str(item), 14), 'bullets': ['前置基础']})
    for err in (kc.get('common_errors') or [])[:2]:
        if isinstance(err, dict):
            cards.append({
                'title': '易错点',
                'bullets': [clip(err.get('error', ''), 38)],
            })

    if len(cards) >= 3:
        return cards[:6]

    tags = manifest.get('tags') or []
    desc = manifest.get('description') or manifest.get('description_zh') or ''
    for tag in tags[:4]:
        cards.append({'title': clip(str(tag), 14), 'bullets': [clip(desc, 36)] if desc else []})

    if len(cards) >= 3:
        return cards[:6]

    for h in headings:
        if any(x in h for x in ('练习', '封面', '学伴', '图谱', '前测', '后测')):
            continue
        cards.append({'title': clip(h, 14), 'bullets': []})
        if len(cards) >= 6:
            break

    if len(cards) >= 3:
        return cards[:6]

    # 课标摘录
    for ex in (kc.get('curriculum_excerpts') or [])[:3]:
        if isinstance(ex, dict) and ex.get('text'):
            src = clip(ex.get('source', '课标'), 12)
            cards.append({'title': src, 'bullets': [clip(ex['text'], 38)]})

    if len(cards) >= 2:
        return cards[:6]

    # 描述拆句
    if desc:
        parts = re.split(r'[；;。]', desc)
        for p in parts:
            p = p.strip()
            if len(p) > 4:
                title, bullet = split_objective(p)
                cards.append({'title': title, 'bullets': [bullet] if bullet else []})
            if len(cards) >= 4:
                break

    if cards:
        return cards[:6]

    return [
        {'title': '学习目标', 'bullets': ['本课核心概念']},
        {'title': '关键方法', 'bullets': ['探究与建模']},
        {'title': '典型应用', 'bullets': ['联系生活情境']},
        {'title': '总结迁移', 'bullets': ['回到项目主线']},
    ]


def derive_subtitle(manifest: dict, kc: dict) -> str:
    parts = []
    stage = manifest.get('stage') or ''
    stage_map = {'elementary': '小学', 'middle': '初中', 'high': '高中'}
    if stage in stage_map:
        parts.append(stage_map[stage])
    grade = manifest.get('grade')
    if isinstance(grade, int) and grade:
        if grade <= 6:
            parts.append(f'{grade}年级')
        elif grade <= 9:
            parts.append(f'初{grade - 6}')
        elif grade <= 12:
            parts.append(f'高{grade - 9}')
    subj = manifest.get('subject') or kc.get('subject') or ''
    subj_map = {
        'math': '数学', 'physics': '物理', 'chemistry': '化学', 'biology': '生物',
        'chinese': '语文', 'english': '英语', 'history': '历史', 'geography': '地理',
        'science': '科学', 'cross': '跨学科', 'other': '其他',
    }
    if subj:
        parts.append(subj_map.get(subj, subj))
    domain = manifest.get('domain') or ''
    if domain and domain not in parts:
        parts.append(clip(domain, 16))
    node_id = str(manifest.get('node_id') or '')
    if node_id.startswith('ext-') or manifest.get('lesson_type') == 'pbl-supplement':
        if 'PBL 项目补充' not in parts:
            parts.append('PBL 项目补充')
    pbl = manifest.get('pbl_context') or {}
    stage = clip(pbl.get('project_stage', ''), 12)
    if stage and stage not in parts:
        parts.append(stage)
    # 去重保序
    seen: set[str] = set()
    uniq = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return ' · '.join(uniq) if uniq else '知识全景地图'


def derive_tagline(manifest: dict, kc: dict) -> str:
    desc = manifest.get('description') or manifest.get('description_zh') or ''
    if desc:
        return clip(desc, 52)
    pbl = manifest.get('pbl_context') or {}
    if pbl.get('entry_reason'):
        return clip(pbl['entry_reason'], 52)
    if kc.get('topic'):
        return clip(kc['topic'], 52)
    return '从概念到应用 · 结构化掌握本课知识'


def pick_theme(manifest: dict) -> dict:
    stage = str(manifest.get('stage') or '').lower()
    grade = manifest.get('grade')
    if stage in STAGE_THEMES:
        return STAGE_THEMES[stage]
    if isinstance(grade, int):
        if grade <= 6:
            return STAGE_THEMES['elementary']
        if grade <= 9:
            return STAGE_THEMES['middle']
        if grade <= 12:
            return STAGE_THEMES['high']
    return STAGE_THEMES['default']


def card_positions(n: int) -> list[tuple[float, float]]:
    """知识全景：上2 / 下2 或 环绕 5-6 张"""
    layouts = {
        2: [(360, 520), (920, 520)],
        3: [(240, 520), (640, 560), (1040, 520)],
        4: [(220, 500), (460, 560), (820, 560), (1060, 500)],
        5: [(180, 480), (400, 560), (640, 580), (880, 560), (1100, 480)],
        6: [(160, 470), (360, 540), (540, 580), (740, 580), (920, 540), (1120, 470)],
    }
    return layouts.get(min(max(n, 2), 6), layouts[4])


def wrap_bullets(bullets: list[str], max_lines: int = 2, width: int = 34) -> list[str]:
    lines: list[str] = []
    for b in bullets:
        b = str(b).strip()
        if not b:
            continue
        while len(b) > width and len(lines) < max_lines:
            lines.append('· ' + b[:width])
            b = b[width:]
        if b and len(lines) < max_lines:
            lines.append('· ' + clip(b, width))
    return lines[:max_lines]


def svg_tspans(x: float, y: float, lines: list[str], size: int, fill: str, weight: int = 400, lh: int = 20) -> str:
    if not lines:
        return ''
    parts = [
        f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}">'
    ]
    for i, line in enumerate(lines):
        dy = lh if i else 0
        parts.append(f'<tspan x="{x}" dy="{dy}">{escape(line)}</tspan>')
    parts.append('</text>')
    return ''.join(parts)


def render_card(x: float, y: float, card: dict, idx: int) -> str:
    stroke, bg = NODE_PALETTE[idx % len(NODE_PALETTE)]
    w, h = 248, 118
    rx, ry = x - w / 2, y - h / 2
    title = clip(card.get('title', ''), 18)
    bullets = wrap_bullets(card.get('bullets') or [])

    out = [
        f'<g filter="url(#cardShadow)">',
        f'<rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="14" fill="white" stroke="{stroke}" stroke-width="2.5"/>',
        f'<rect x="{rx}" y="{ry}" width="{w}" height="34" rx="14" fill="{bg}"/>',
        f'<rect x="{rx}" y="{ry + 20}" width="{w}" height="14" fill="{bg}"/>',
        f'<rect x="{rx}" y="{ry}" width="5" height="{h}" rx="2.5" fill="{stroke}"/>',
        f'<text x="{x}" y="{ry + 24}" text-anchor="middle" font-family="{FONT}" '
        f'font-size="18" font-weight="700" fill="#1e293b">{escape(title)}</text>',
    ]
    if bullets:
        out.append(svg_tspans(rx + 16, ry + 52, bullets, 13, '#475569', 400, 18))
    out.append('</g>')
    return '\n'.join(out)


def render_hub_motif(cx: float, cy: float, accent: str) -> str:
    """中心装饰：知识枢纽圆环 + 节点"""
    r = 44
    lines = [
        f'<circle cx="{cx}" cy="{cy}" r="{r + 18}" fill="{accent}" opacity="0.08"/>',
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="white" stroke="{accent}" stroke-width="3" opacity="0.95"/>',
    ]
    for i in range(6):
        ang = -math.pi / 2 + i * math.pi / 3
        dx = cx + (r - 12) * math.cos(ang)
        dy = cy + (r - 12) * math.sin(ang)
        lines.append(f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="5" fill="{accent}" opacity="0.75"/>')
    lines.append(
        f'<circle cx="{cx}" cy="{cy}" r="10" fill="{accent}"/>'
    )
    return '\n'.join(lines)


def render_svg(title: str, subtitle: str, tagline: str, cards: list[dict],
               course_id: str, theme: dict, is_ext: bool) -> str:
    n = min(len(cards), 6)
    positions = card_positions(n)
    theme = theme or STAGE_THEMES['default']
    bg0, bg1 = theme['bg']
    accent, hub = theme['accent'], theme['hub']

    hub_cx, hub_cy = 640, 268
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_W} {VIEW_H}" '
        f'role="img" aria-label="{escape(title)} · 知识全景地图">',
        '<defs>',
        f'  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="{bg0}"/>'
        f'<stop offset="100%" stop-color="{bg1}"/></linearGradient>',
        f'  <linearGradient id="hubGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{accent}" stop-opacity="0.15"/>'
        f'<stop offset="100%" stop-color="{hub}" stop-opacity="0.05"/></linearGradient>',
        '  <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="140%">',
        '    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12"/>',
        '  </filter>',
        '  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">',
        f'    <path d="M0,0 L6,3 L0,6 Z" fill="{accent}" opacity="0.5"/>',
        '  </marker>',
        f'  <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">',
        f'    <circle cx="4" cy="4" r="1.3" fill="{accent}" opacity="0.07"/>',
        '  </pattern>',
        '</defs>',
        f'<rect width="{VIEW_W}" height="{VIEW_H}" fill="url(#bg)"/>',
        f'<rect width="{VIEW_W}" height="{VIEW_H}" fill="url(#dotGrid)"/>',
    ]

    # 顶部条
    lines.append(f'<rect x="0" y="0" width="{VIEW_W}" height="56" fill="white" opacity="0.55"/>')
    lines.append(
        f'<text x="48" y="36" font-family="{FONT}" font-size="15" font-weight="600" fill="#64748b">'
        f'TeachAny · 知识全景地图</text>'
    )
    if is_ext:
        lines.append(
            f'<rect x="{VIEW_W - 200}" y="14" width="152" height="28" rx="14" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>'
            f'<text x="{VIEW_W - 124}" y="33" text-anchor="middle" font-family="{FONT}" '
            f'font-size="13" font-weight="700" fill="#b45309">PBL 课标外补充</text>'
        )

    # 中心枢纽区
    lines.append(f'<ellipse cx="640" cy="300" rx="320" ry="120" fill="url(#hubGrad)"/>')
    lines.append(render_hub_motif(hub_cx, hub_cy - 36, accent))

    lines.append(
        f'<text x="640" y="248" text-anchor="middle" font-family="{FONT}" font-size="46" '
        f'font-weight="800" fill="#0f172a">{escape(clip(title, 22))}</text>'
    )
    if subtitle:
        lines.append(
            f'<text x="640" y="286" text-anchor="middle" font-family="{FONT}" font-size="20" '
            f'font-weight="500" fill="#64748b">{escape(subtitle)}</text>'
        )
    lines.append(
        f'<line x1="500" y1="302" x2="780" y2="302" stroke="{accent}" stroke-width="3" stroke-linecap="round" opacity="0.65"/>'
    )
    if tagline:
        lines.append(
            f'<text x="640" y="328" text-anchor="middle" font-family="{FONT}" font-size="15" '
            f'fill="#475569">{escape(tagline)}</text>'
        )

    # 连接线
    for (x, y) in positions[:n]:
        lines.append(
            f'<path d="M640,340 Q{(640 + x) / 2:.0f},{(340 + y) / 2 - 30:.0f} {x},{y - 50}" '
            f'fill="none" stroke="{accent}" stroke-width="2" stroke-dasharray="7 5" '
            f'opacity="0.45" marker-end="url(#arrow)"/>'
        )

    for i, ((x, y), card) in enumerate(zip(positions[:n], cards[:n])):
        lines.append(render_card(x, y, card, i))

    lines.append(
        f'<text x="{VIEW_W - 32}" y="{VIEW_H - 18}" text-anchor="end" font-family="{FONT}" '
        f'font-size="11" fill="#94a3b8">{escape(course_id)} · SVG hero v8</text>'
    )
    lines.append('</svg>')
    return '\n'.join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('course_dir', help='课件目录')
    ap.add_argument('--title', help='主标题')
    ap.add_argument('--subtitle', default='')
    ap.add_argument('--nodes', help='节点：标题:要点|标题2,…')
    ap.add_argument('--lang', default='zh', choices=['zh', 'en'])
    ap.add_argument('--course-id', help='覆盖 course id')
    args = ap.parse_args()

    course_dir = Path(args.course_dir).resolve()
    if not course_dir.is_dir():
        print(f'❌ 课件目录不存在: {course_dir}', file=sys.stderr)
        sys.exit(1)

    manifest = load_json(course_dir / 'manifest.json')
    kc = load_json(course_dir / 'knowledge-context.json')
    course_id = args.course_id or manifest.get('course_id') or manifest.get('id') or course_dir.name

    title = args.title or manifest.get('name') or manifest.get('title') or course_id
    subtitle = args.subtitle or derive_subtitle(manifest, kc)
    tagline = derive_tagline(manifest, kc)

    if args.nodes:
        cards = parse_manual_nodes(args.nodes)
    else:
        cards = derive_cards(manifest, kc, extract_html_headings(course_dir))

    # 去掉仍落入的空泛占位（若同时有更具体卡片）
    if len(cards) > 2 and any(c['title'] not in GENERIC_ZH for c in cards):
        cards = [c for c in cards if c['title'] not in GENERIC_ZH] or cards

    if len(cards) < 2:
        cards.append({'title': '知识应用', 'bullets': ['联系真实情境']})

    is_ext = str(manifest.get('node_id', course_id)).startswith('ext-')
    theme = pick_theme(manifest)
    svg_text = render_svg(title, subtitle, tagline, cards[:6], course_id, theme, is_ext)

    out_dir = course_dir / 'assets'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'{course_id}-hero.svg'
    try:
        out_path.write_text(svg_text, encoding='utf-8')
    except Exception as e:
        print(f'❌ 写文件失败: {e}', file=sys.stderr)
        sys.exit(2)

    print(json.dumps({
        'level': 'L3-svg',
        'source': 'gen-hero-svg.py',
        'version': '8.0',
        'url': f'./assets/{course_id}-hero.svg',
        'path': str(out_path.relative_to(course_dir)),
        'title': title,
        'subtitle': subtitle,
        'cards': [{'title': c['title'], 'bullets': c.get('bullets', [])} for c in cards[:6]],
        'bytes': out_path.stat().st_size,
        'action': 'generated',
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
