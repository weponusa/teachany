#!/usr/bin/env python3
"""
为课件批量应用三大标准模块：
  · teachany-tutor-card.{css,js}  → 在课件正文显式嵌入 AI 学伴入口卡片
  · teachany-audio-player.{css,js} → 课件已有 audioPlaylist 时切换到标准模块
  · teachany-historical-map.{css,js} → 历史课件已有 #history-map / #map 时改用标准模块（人工 review 后再开）

策略：
  1. tutor-card：只要引用了 ai-tutor.js 就追加入口卡片
  2. audio-player：检测到课件有 IIFE 内 const audioPlaylist 数组时，并行引入 audio-player 模块 + 拷贝 playlist
  3. historical-map：本次仅打印需要人工迁移的清单，不自动改

幂等：通过检测 `data-teachany-tutor-card` / `data-teachany-audio` 已存在就跳过。
"""
import os, re, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"
COMMUNITY = ROOT / "community"

TUTOR_CARD_CSS = '<link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">'
TUTOR_CARD_JS = '<script src="../../scripts/teachany-tutor-card.js" defer></script>'
AUDIO_CSS = '<link rel="stylesheet" href="../../scripts/teachany-audio-player.css">'
AUDIO_JS = '<script src="../../scripts/teachany-audio-player.js" defer></script>'

TUTOR_CARD_BLOCK = '''
<!-- ⭐ v7.7 标准 AI 学伴入口卡片（必须显式存在，不能仅依赖 FAB） -->
<section class="ta-standard-section" id="teachany-ai-tutor-card">
  <div data-teachany-tutor-card></div>
</section>
'''

def find_courseware_files():
    """找所有引用 ai-tutor.js 的课件 index.html"""
    out = []
    for base in [EXAMPLES, COMMUNITY]:
        if not base.exists(): continue
        for p in base.rglob("index.html"):
            try:
                t = p.read_text(encoding="utf-8")
                if "ai-tutor.js" in t:
                    out.append(p)
            except Exception:
                continue
    return out

def has_module(html, marker):
    return marker in html

def inject_head_link(html, link_tag):
    """把 link 注入到 </head> 之前；幂等"""
    if link_tag in html: return html, False
    return html.replace("</head>", f"  {link_tag}\n</head>", 1), True

def inject_script_before_closing_body_or_kg(html, script_tag):
    """脚本注入到 KG 模块脚本之前或 </body> 之前；幂等"""
    if script_tag in html: return html, False
    # 优先放在 KG 模块脚本之前
    kg_marker = '<script src="../../scripts/teachany-knowledge-graph.js"'
    if kg_marker in html:
        return html.replace(kg_marker, f"{script_tag}\n{kg_marker}", 1), True
    # 否则放在 </body> 之前
    if "</body>" in html:
        return html.replace("</body>", f"{script_tag}\n</body>", 1), True
    # 兜底：附加到末尾
    return html + "\n" + script_tag + "\n", True

def inject_tutor_card_section(html):
    """把 tutor-card section 插入到 #knowledge-graph 之前；幂等"""
    if "data-teachany-tutor-card" in html: return html, False
    # 优先放在知识图谱之前
    kg_section = '<section class="ta-standard-section" id="teachany-video-overview"'
    kg_pattern = re.search(r'<section[^>]*id=["\'](knowledge-graph|teachany-video-overview)["\']', html)
    if kg_pattern:
        idx = kg_pattern.start()
        return html[:idx] + TUTOR_CARD_BLOCK + html[idx:], True
    # 否则放在 footer 之前
    if "<footer" in html:
        return html.replace("<footer", TUTOR_CARD_BLOCK + "<footer", 1), True
    if "</main>" in html:
        return html.replace("</main>", TUTOR_CARD_BLOCK + "</main>", 1), True
    if "</body>" in html:
        return html.replace("</body>", TUTOR_CARD_BLOCK + "</body>", 1), True
    return html, False

def detect_audio_playlist(html):
    """检测 IIFE 中的 audioPlaylist 数组并提取（best effort）"""
    m = re.search(r"(?:const|let|var)\s+audioPlaylist\s*=\s*(\[[\s\S]*?\]);", html)
    if not m: return None
    raw = m.group(1)
    # 把 JS 对象字面量近似转为 JSON：单引号 → 双引号；属性名加引号
    js = raw
    js = re.sub(r"//[^\n]*", "", js)  # 去注释
    # 双引号包属性名
    js = re.sub(r"([{,]\s*)([a-zA-Z_]\w*)\s*:", r'\1"\2":', js)
    # 单引号字符串 → 双引号（粗暴，但够用；前提 src/title 内不含双引号）
    js = re.sub(r"'((?:[^'\\]|\\.)*)'", r'"\1"', js)
    js = re.sub(r",\s*([\]}])", r"\1", js)  # 去尾逗号
    try:
        data = json.loads(js)
        if isinstance(data, list) and len(data) >= 1:
            return data
    except Exception as e:
        return None
    return None

def inject_audio_module(html, playlist):
    """在 #knowledge-graph 之前插入标准音频模块（幂等）"""
    if "data-teachany-audio" in html: return html, False
    json_str = json.dumps(playlist, ensure_ascii=False, indent=2)
    block = f'''
<!-- ⭐ v7.7 标准独立连续音频模块 -->
<section class="ta-standard-section" id="teachany-audio-player">
  <div data-teachany-audio>
    <script type="application/json" data-teachany-audio-playlist>
{json_str}
    </script>
  </div>
</section>
'''
    # 放在 tutor-card 之后（如果有），否则在 #knowledge-graph 之前
    if "data-teachany-tutor-card" in html:
        # 把 audio 块塞到 tutor-card section 之后
        m = re.search(r'(<section[^>]*data-teachany-tutor-card[^>]*>[\s\S]*?</section>)', html)
        if m is None:
            # 用 id 匹配
            m = re.search(r'(<section[^>]*id=["\']teachany-ai-tutor-card["\'][^>]*>[\s\S]*?</section>)', html)
        if m:
            return html[:m.end()] + block + html[m.end():], True
    # 兜底：放在 KG section 之前
    pat = re.search(r'<section[^>]*id=["\'](knowledge-graph|teachany-video-overview)["\']', html)
    if pat:
        idx = pat.start()
        return html[:idx] + block + html[idx:], True
    return html, False

def process(p):
    try:
        html = p.read_text(encoding="utf-8")
    except Exception as e:
        return None
    orig = html
    actions = []

    # 1. 注入 tutor-card 资源链接
    html, c1 = inject_head_link(html, TUTOR_CARD_CSS)
    if c1: actions.append("tutor-card.css")
    html, c2 = inject_script_before_closing_body_or_kg(html, TUTOR_CARD_JS)
    if c2: actions.append("tutor-card.js")
    # 2. 注入 tutor-card section
    html, c3 = inject_tutor_card_section(html)
    if c3: actions.append("tutor-card-section")

    # 3. 如果检测到 audioPlaylist，注入 audio-player 模块
    playlist = detect_audio_playlist(orig)
    if playlist:
        html, c4 = inject_head_link(html, AUDIO_CSS)
        if c4: actions.append("audio.css")
        html, c5 = inject_script_before_closing_body_or_kg(html, AUDIO_JS)
        if c5: actions.append("audio.js")
        html, c6 = inject_audio_module(html, playlist)
        if c6: actions.append(f"audio-section({len(playlist)} tracks)")

    if html != orig:
        p.write_text(html, encoding="utf-8")
        return actions
    return []

def main():
    files = find_courseware_files()
    print(f"扫描到 {len(files)} 个引用 ai-tutor.js 的课件")
    changed = 0
    skipped = 0
    actions_summary = {}
    for p in files:
        rel = p.relative_to(ROOT)
        actions = process(p)
        if actions:
            changed += 1
            for a in actions:
                actions_summary[a] = actions_summary.get(a, 0) + 1
            if changed <= 10:
                print(f"  ✓ {rel}: {', '.join(actions)}")
        else:
            skipped += 1
    print(f"\n汇总：修改 {changed}，跳过 {skipped}")
    print("各动作触发次数：")
    for k, v in actions_summary.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
