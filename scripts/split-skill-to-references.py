#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 skill/SKILL_CN.md 拆分：
- 保留骨架（前 9 节 + 第 12-14、16 节 + 目录结构）在 SKILL_CN.md
- 把 5 个大 section 挪到 references/ 下，正文用「触发器 + 指引读哪个文件」替代
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_FILE = ROOT / "skill" / "SKILL_CN.md"
REF_DIR = ROOT / "references"
REF_DIR.mkdir(exist_ok=True)

# 要拆出去的 section（标题 → 文件名）
# 标题必须与 SKILL_CN.md 里的 ## 一字不差
EXTRACTS = [
    # 十、技术实现（1358 行）
    ("十、技术实现", "technical-implementation.md",
     "需要**写课件 HTML/CSS/JS**代码时"),
    # 十一、开发流程（776 行）
    ("十一、课件开发标准流程", "workflow-development.md",
     "开始**做一节新课**，或者执行 publish/baseline-check 时"),
    # 十五、视频/音频流水线（533 行）
    ("十五、视频与音频制作流水线", "media-pipeline.md",
     "需要生成 **TTS 音频**、口播视频或 SRT 字幕时"),
    # 十七、打包与分发（958 行）
    ("十七、课件打包与分发", "packaging-distribution.md",
     "需要**打包课件、发布到 registry、推送 git**或处理 PR 时"),
    # 十八、地图资源（968 行）
    ("十八、地理/历史课件地图资源", "map-resources.md",
     "做**地理 / 历史课件**，或涉及 GeoJSON / Leaflet / 地形瓦片时"),
]


def main():
    content = SKILL_FILE.read_text(encoding="utf-8")
    lines = content.splitlines(keepends=True)
    sections = []  # [(line_start_index, title, content_string)]

    # 1. 按 ## 切分
    i = 0
    current = None
    buf = []
    for idx, line in enumerate(lines):
        if re.match(r"^## [^#]", line):
            if current is not None:
                sections.append((current[0], current[1], "".join(buf)))
            current = (idx, line.strip().lstrip("#").strip())
            buf = [line]
        else:
            buf.append(line)
    if current is not None:
        sections.append((current[0], current[1], "".join(buf)))

    # 2. 找出 extract 目标
    extract_map = {}
    for title, filename, trigger in EXTRACTS:
        for idx, (_, sec_title, sec_content) in enumerate(sections):
            if sec_title == title:
                extract_map[idx] = (filename, trigger)
                break
        else:
            # 模糊匹配
            for idx, (_, sec_title, sec_content) in enumerate(sections):
                if title[:5] in sec_title:
                    extract_map[idx] = (filename, trigger)
                    break

    # 3. 写 references/*.md + 生成替身
    new_sections = []
    total_extracted = 0
    for idx, (lineno, title, sec_content) in enumerate(sections):
        if idx in extract_map:
            filename, trigger = extract_map[idx]
            ref_path = REF_DIR / filename

            # 写入 references/
            header = f"# {title}\n\n"
            header += f"> 本文件是 SKILL_CN.md 的「{title}」章节的详细内容，按需加载以节省上下文。\n"
            header += f"> 触发条件：{trigger}。\n\n---\n\n"
            ref_path.write_text(header + sec_content.split("\n", 1)[1], encoding="utf-8")

            # 生成替身（保留在 SKILL_CN.md）
            replacement = f"""## {title}

> 📚 **本章已外移到 `references/{filename}`**（详细内容约 {len(sec_content.splitlines())} 行）
>
> **何时必须读**：{trigger}
>
> **读取方式**：`read_file /Users/wepon/CodeBuddy/一次函数/teachany-opensource/references/{filename}`

### 章节概览（本章包含的主题）

"""
            # 抽出 ### 小标题作为概览
            h3s = re.findall(r"^### (.+?)$", sec_content, re.MULTILINE)
            for h3 in h3s[:15]:  # 前 15 个小标题
                replacement += f"- {h3.strip()}\n"
            if len(h3s) > 15:
                replacement += f"- ...（共 {len(h3s)} 个子章节，详见 `references/{filename}`）\n"

            replacement += f"\n---\n\n"
            new_sections.append(replacement)
            total_extracted += len(sec_content.splitlines())
            print(f"  ✂️  抽出 {title}  →  references/{filename}  ({len(sec_content.splitlines())} 行)")
        else:
            new_sections.append(sec_content)

    # 4. 拼回 SKILL_CN.md
    # 前言（第一个 ## 之前的部分）
    first_section_start = sections[0][0] if sections else len(lines)
    prelude = "".join(lines[:first_section_start])

    # v6.12 头部升级
    upgrade_note = """
## 🚀 v6.12 变更：渐进式加载

为降低上下文压力，5 个大章节已外移到 `references/` 目录，按触发条件才加载：

| 章节 | 触发条件 | 读取路径 |
|---|---|---|
| 十、技术实现与代码模板 | 写课件 HTML/CSS/JS 代码 | `references/technical-implementation.md` |
| 十一、开发流程与检查点 | 开始做新课 / 执行 publish/baseline | `references/workflow-development.md` |
| 十五、视频音频流水线 | 生成 TTS / 口播视频 / SRT 字幕 | `references/media-pipeline.md` |
| 十七、打包与分发 | 打包发布 / 推送 git / 处理 PR | `references/packaging-distribution.md` |
| 十八、地图资源与时空知识 | 做地理/历史课 / 用 GeoJSON / Leaflet | `references/map-resources.md` |

> **AI 使用规则**：遇到以上触发条件**必须先 read_file 读相应 references 文件**，
> 不要凭"我记得应该是…"的感觉瞎猜。

---

"""
    new_content = prelude + upgrade_note + "".join(new_sections)
    SKILL_FILE.write_text(new_content, encoding="utf-8")

    new_lines = len(new_content.splitlines())
    old_lines = len(lines)
    print()
    print(f"  SKILL_CN.md: {old_lines} → {new_lines} 行 (-{old_lines-new_lines} = -{(old_lines-new_lines)*100//old_lines}%)")
    print(f"  共抽出 {total_extracted} 行到 references/")


if __name__ == "__main__":
    main()
