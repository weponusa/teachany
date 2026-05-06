#!/usr/bin/env python3
"""
当课件已经引入了 scripts/teachany-audio-player.js 时，
把旧的内联 IIFE `(function initAudioPlayer() { ... })();` 注释掉，
避免新旧两个底部播放条共存。

幂等：检测到 IIFE 已被 // [v7.7-disabled] 包围则跳过。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def patch(p):
    try:
        html = p.read_text(encoding="utf-8")
    except Exception:
        return False
    if "teachany-audio-player.js" not in html:
        return False
    if "[v7.7-disabled-audio-bar]" in html:
        return False  # 已处理

    # 匹配整个 IIFE：从 (function initAudioPlayer() { 到匹配的 })();
    m = re.search(r"\(function\s+initAudioPlayer\s*\(\)\s*\{", html)
    if not m:
        return False
    start = m.start()
    # 用括号计数法找匹配结尾
    depth = 0
    i = m.end() - 1  # 站在 '{' 上
    end = -1
    in_str = None
    while i < len(html):
        c = html[i]
        # 简化：跳过字符串
        if in_str:
            if c == "\\": i += 2; continue
            if c == in_str: in_str = None
            i += 1; continue
        if c in ('"', "'", "`"):
            in_str = c; i += 1; continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                # 看后面的 )(); 结束
                tail = html[i+1:i+8]
                m2 = re.match(r"\)\(\)\s*;", tail)
                if m2:
                    end = i + 1 + m2.end()
                    break
                else:
                    end = i + 1
                    break
        i += 1

    if end == -1:
        return False

    iife_block = html[start:end]
    replaced = (
        "/* [v7.7-disabled-audio-bar] 旧内联 audio-bar IIFE 被禁用，统一由 scripts/teachany-audio-player.js 处理\n" +
        iife_block.replace("*/", "* /") +
        "\n*/"
    )
    new_html = html[:start] + replaced + html[end:]
    p.write_text(new_html, encoding="utf-8")
    return True

def main():
    files = list((ROOT / "examples").rglob("index.html")) + list((ROOT / "community").rglob("index.html"))
    n = 0
    for p in files:
        if patch(p):
            n += 1
            if n <= 8:
                print(f"  ✓ {p.relative_to(ROOT)}")
    print(f"\n禁用旧 audio-bar IIFE 数：{n}")

if __name__ == "__main__":
    main()
