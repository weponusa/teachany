#!/usr/bin/env python3
"""将 examples/* 下官方课件的知识图谱统一替换为标准模块。

与旧版不同：采用括号计数定位容器结束，绝不“吃掉”后续内容。
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"

STYLE_TAG = '<link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">'
SCRIPT_TAG = '<script src="../../scripts/teachany-knowledge-graph.js" defer></script>'

OPEN_RE = {
    "section": re.compile(r'<section\b', re.I),
    "div": re.compile(r'<div\b', re.I),
}
CLOSE_RE = {
    "section": re.compile(r'</section>', re.I),
    "div": re.compile(r'</div>', re.I),
}

def find_kg_container(html: str):
    """返回第一个 id="knowledge-graph" 容器 (start, end, tag)；没有返回 None。"""
    m = re.search(r'<(section|div)\b[^>]*\bid="knowledge-graph"', html, re.I)
    if not m:
        return None
    tag = m.group(1).lower()
    start = m.start()
    end_of_open = html.find('>', m.end()) + 1
    if end_of_open == 0:
        return None
    depth = 1
    i = end_of_open
    open_pat = OPEN_RE[tag]
    close_pat = CLOSE_RE[tag]
    while i < len(html):
        open_m = open_pat.search(html, i)
        close_m = close_pat.search(html, i)
        if not close_m:
            return None
        if open_m and open_m.start() < close_m.start():
            depth += 1
            i = open_m.end()
        else:
            depth -= 1
            if depth == 0:
                return (start, close_m.end(), tag)
            i = close_m.end()
    return None

def build_block(node_id: str, heading: str) -> str:
    return (
        '  <!-- ===== Standard Knowledge Graph Module ===== -->\n'
        '  <section class="section" id="knowledge-graph">\n'
        f'    <h2 class="section-title">🗺️ 知识图谱：{heading}</h2>\n'
        f'    <div data-teachany-kg="{node_id}">\n'
        '      <canvas class="tkg-fallback-canvas" width="720" height="120" aria-label="知识图谱互动画布占位" style="display:block;width:100%;max-height:140px;border-radius:12px;"></canvas>\n'
        '    </div>\n'
        '  </section>'
    )

def ensure_head(html: str) -> str:
    if STYLE_TAG in html:
        return html
    if "</head>" in html:
        return html.replace("</head>", f"{STYLE_TAG}\n</head>", 1)
    return STYLE_TAG + "\n" + html

def ensure_script(html: str) -> str:
    if SCRIPT_TAG in html:
        return html
    if "</body>" in html:
        return html.replace("</body>", f"{SCRIPT_TAG}\n</body>", 1)
    return html + "\n" + SCRIPT_TAG

def load_manifest(course_dir: Path):
    p = course_dir / "manifest.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}

def replace_kg(html: str, block: str):
    res = find_kg_container(html)
    if not res:
        return html, False
    start, end, _tag = res
    return html[:start] + block + html[end:], True

def append_kg_before_footer(html: str, block: str):
    if '<!-- ===== Footer ===== -->' in html:
        return html.replace('<!-- ===== Footer ===== -->', block + '\n  <!-- ===== Footer ===== -->', 1)
    if '</body>' in html:
        return html.replace('</body>', block + '\n</body>', 1)
    return html + "\n" + block

def update_course(course_dir: Path):
    index = course_dir / "index.html"
    if not index.exists():
        return False, "no-index"
    manifest = load_manifest(course_dir)
    node_id = manifest.get("node_id")
    if not node_id:
        return False, "no-node-id"
    html = index.read_text(encoding="utf-8")
    block = build_block(node_id, manifest.get("name") or course_dir.name)

    new_html, replaced = replace_kg(html, block)
    if not replaced:
        new_html = append_kg_before_footer(html, block)
    new_html = ensure_head(new_html)
    new_html = ensure_script(new_html)
    if new_html == html:
        return True, "unchanged"
    index.write_text(new_html, encoding="utf-8")
    return True, "replaced" if replaced else "appended"

def main():
    updated, skipped = [], []
    for course_dir in sorted(EXAMPLES.iterdir()):
        if not course_dir.is_dir() or course_dir.name.startswith("_"):
            continue
        ok, reason = update_course(course_dir)
        (updated if ok else skipped).append((course_dir.name, reason))
    print("✅ 处理", len(updated), "个课件")
    for name, reason in updated:
        print(f"  - {name}: {reason}")
    if skipped:
        print("⚠️  跳过", len(skipped))
        for name, reason in skipped:
            print(f"  - {name}: {reason}")

if __name__ == "__main__":
    main()
