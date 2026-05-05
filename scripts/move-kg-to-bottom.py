#!/usr/bin/env python3
"""把课件中的 #knowledge-graph section 移到内容区最底部（footer 之前）。

- 仅重新排列，不动内容
- 若找不到 footer，则移到 </div>（container 末尾）或 </body> 之前
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"

OPEN_RE = re.compile(r'<section\b[^>]*\bid="knowledge-graph"', re.I)

def find_kg_section(html: str):
    m = OPEN_RE.search(html)
    if not m:
        return None
    start = html.rfind("<!-- ===== Standard Knowledge Graph Module ===== -->", 0, m.start())
    if start == -1:
        # fallback：以 section 行起点的缩进起点开始
        line_start = html.rfind("\n", 0, m.start())
        start = line_start + 1 if line_start >= 0 else m.start()
    # 从 section 起点向后找 </section>
    end_open = html.find(">", m.end()) + 1
    depth = 1
    i = end_open
    while i < len(html):
        open_m = re.search(r'<section\b', html[i:], re.I)
        close_m = re.search(r'</section>', html[i:], re.I)
        if not close_m:
            return None
        if open_m and open_m.start() < close_m.start():
            depth += 1
            i += open_m.end()
        else:
            depth -= 1
            if depth == 0:
                end = i + close_m.end()
                # 吞掉尾部换行使块独立成行
                while end < len(html) and html[end] in "\n\r":
                    end += 1
                return start, end
            i += close_m.end()
    return None

def move_to_bottom(html: str):
    found = find_kg_section(html)
    if not found:
        return html, False
    start, end = found
    kg_block = html[start:end].rstrip() + "\n"
    # 从原位置删除
    new_html = html[:start] + html[end:]
    # 选择插入位置：footer 之前 > </div> 之前 > </body> 之前
    anchors = [
        r'<!-- ===== Footer ===== -->',
        r'<footer\b',
        r'</div>\s*\n\s*<script[^>]*ai-tutor',
        r'</div>\s*\n\s*</body>',
        r'</body>',
    ]
    for pat in anchors:
        m = re.search(pat, new_html, re.I)
        if not m:
            continue
        pos = m.start()
        # 保持块和前内容之间一个空行
        prefix = new_html[:pos].rstrip() + "\n\n  "
        suffix = new_html[pos:]
        insert = kg_block
        if not insert.endswith("\n"):
            insert += "\n"
        return prefix + insert + suffix, True
    # 都没找到：附加到结尾
    return new_html + "\n" + kg_block, True

def main():
    updated = []
    for course_dir in sorted(EXAMPLES.iterdir()):
        if not course_dir.is_dir() or course_dir.name.startswith("_"):
            continue
        idx = course_dir / "index.html"
        if not idx.exists():
            continue
        html = idx.read_text(encoding="utf-8")
        new_html, ok = move_to_bottom(html)
        if ok and new_html != html:
            idx.write_text(new_html, encoding="utf-8")
            updated.append(course_dir.name)
    print(f"✅ 移动 {len(updated)} 个课件的 #knowledge-graph 到最底部")
    for n in updated:
        print("  -", n)

if __name__ == "__main__":
    main()
