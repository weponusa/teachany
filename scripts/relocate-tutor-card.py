#!/usr/bin/env python3
"""
v2.4: 把现有的 AI 学伴入口卡片 section 从课件底部迁到顶部可见区域：
      首选位置：pretest 之后
      次选：objectives 之后
      末选：hero 之后
幂等：检测 section 已在顶部则跳过。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TUTOR_SECTION_RE = re.compile(
    r'\n?<!--[^>]*v7\.7[^>]*-->\s*\n?<section class="ta-standard-section" id="teachany-ai-tutor-card">.*?</section>\s*',
    re.DOTALL)
# 简单匹配（如果没注释）
TUTOR_SECTION_SIMPLE_RE = re.compile(
    r'\n?<section class="ta-standard-section" id="teachany-ai-tutor-card">.*?</section>\s*',
    re.DOTALL)

def relocate(p):
    try:
        html = p.read_text(encoding="utf-8")
    except Exception:
        return None
    if "data-teachany-tutor-card" not in html:
        return None

    m = TUTOR_SECTION_RE.search(html) or TUTOR_SECTION_SIMPLE_RE.search(html)
    if not m:
        return None
    section_html = m.group(0)
    # 确保带注释标签
    if "v7.7" not in section_html and "v7.7-tutor-card" not in section_html:
        section_html_clean = section_html.strip()
    else:
        section_html_clean = section_html.strip()

    # 检查是否已在顶部（前 6000 字符）
    head_part = html[:6000]
    if 'id="teachany-ai-tutor-card"' in head_part:
        return "already-at-top"

    # 从原位置移除
    html_no = html[:m.start()] + "\n" + html[m.end():]

    # 构造新插入点：找 pretest / objectives / hero 的结束 </section>
    target_tag = None
    for sec_id in ["pretest", "objectives", "learning-goals", "hero"]:
        pattern = r'(<section[^>]*id=["\']' + sec_id + r'["\'][^>]*>)'
        sm = re.search(pattern, html_no)
        if not sm:
            continue
        # 从 section 起点开始，找配对的 </section>
        start = sm.end()
        depth = 1
        i = start
        while i < len(html_no) and depth > 0:
            # 简单搜索 <section 和 </section>
            open_m = re.search(r'<section[\s>]', html_no[i:])
            close_m = re.search(r'</section>', html_no[i:])
            if not close_m:
                break
            if open_m and open_m.start() < close_m.start():
                depth += 1
                i += open_m.end()
            else:
                depth -= 1
                i += close_m.end()
                if depth == 0:
                    # 找到匹配结束
                    target_tag = (sec_id, i)
                    break
        if target_tag:
            break

    if not target_tag:
        return "no-target"

    sec_id, insert_pos = target_tag
    # 插入
    insert_block = "\n\n<!-- ⭐ v7.7 标准 AI 学伴入口卡片（放在 " + sec_id + " 之后，课件顶部可见） -->\n" + section_html_clean + "\n"
    new_html = html_no[:insert_pos] + insert_block + html_no[insert_pos:]

    p.write_text(new_html, encoding="utf-8")
    return sec_id

def main():
    files = list((ROOT / "examples").rglob("index.html")) + list((ROOT / "community").rglob("index.html"))
    stats = {"moved": 0, "already-at-top": 0, "no-card": 0, "no-target": 0}
    moved_to = {}
    for p in files:
        r = relocate(p)
        if r is None:
            stats["no-card"] += 1
        elif r == "already-at-top":
            stats["already-at-top"] += 1
        elif r == "no-target":
            stats["no-target"] += 1
        else:
            stats["moved"] += 1
            moved_to[r] = moved_to.get(r, 0) + 1
            if stats["moved"] <= 6:
                print(f"  ✓ {p.relative_to(ROOT)} → 放在 {r} 之后")
    print(f"\n汇总：{stats}")
    print(f"移动目标：{moved_to}")

if __name__ == "__main__":
    main()
