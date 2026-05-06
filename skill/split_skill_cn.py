#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SKILL_CN.md 拆分脚本
基于 SPLIT_PLAN.md 的行号范围，把巨文件切分为主文 + 15 个卫星文档。
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).parent.resolve()
SRC = HERE / "SKILL_CN.md"

if not SRC.exists():
    print(f"错误：{SRC} 不存在")
    sys.exit(1)

lines = SRC.read_text(encoding="utf-8").splitlines(keepends=True)
total = len(lines)
print(f"源文件：{SRC.name}，共 {total} 行")
if total != 6001:
    print(f"警告：源文件行数不是 6001（实际 {total}）")

# 创建目录
for sub in ["guides", "tech", "phases"]:
    (HERE / sub).mkdir(exist_ok=True)

def make_header(title: str, trigger: str) -> str:
    return (
        f"# {title}\n\n"
        f"> **所属**：TeachAny 技能 · 卫星文档\n"
        f"> **触发时机**：{trigger}\n"
        f"> **主文档**：[../SKILL_CN.md](../SKILL_CN.md)\n"
        f">\n"
        f"> 本文件从 SKILL_CN.md 主文拆出，按需加载以避免上下文爆炸。\n\n"
        f"---\n\n"
    )

def extract(start_1based: int, end_1based: int) -> str:
    # lines 是 0-indexed，SPLIT_PLAN 行号是 1-indexed
    return "".join(lines[start_1based - 1:end_1based])

def write_satellite(rel_path: str, title: str, trigger: str, start: int, end: int):
    out = HERE / rel_path
    content = make_header(title, trigger) + extract(start, end)
    out.write_text(content, encoding="utf-8")
    written_lines = content.count("\n")
    src_lines = end - start + 1
    print(f"  {rel_path:40s}  源 {src_lines:4d} 行 → 写 {written_lines:4d} 行")

print("\n开始切分...")

# === guides/ ===
write_satellite("guides/project-based.md",         "项目制与任务驱动",                     "做 PBL / 任务驱动课件时",       1119, 1242)
write_satellite("guides/interaction-patterns.md",  "互动与页面形态库",                     "Phase 3 选择交互形态时",        1243, 1346)
write_satellite("guides/assessment.md",            "评估系统",                              "设计评估 / 练习题时",             1347, 1454)
write_satellite("guides/prerequisites.md",         "前置知识链与学段差异",                 "Phase 0.5 知识查询阶段",        1455, 1509)
write_satellite("guides/examples.md",              "三个学科完整微型示例",                 "需要参考完整示例时",              1510, 1567)

# === tech/ （第十章内部再切）===
write_satellite("tech/stack.md",                   "推荐技术组合",                          "Phase 0.5 技术选型",              1570, 1580)
write_satellite("tech/page-structure.md",          "互动网页标准结构",                      "Phase 3 编写 HTML 主体时",        1581, 2622)
write_satellite("tech/design-system.md",           "视觉设计规范（按学段分级）",            "Phase 3 写 CSS 样式时",           2623, 2742)
write_satellite("tech/ai-multimodal.md",           "AI 多模态互动区（可选功能）",           "做多模态互动时",                  2743, 3273)
write_satellite("tech/workbuddy-agents.md",        "WorkBuddy 多 Agent 协作流水线",         "启用多 Agent 并行时",             3274, 3521)

# === phases/ ===
write_satellite("phases/workflow.md",              "课件开发标准流程（Phase 0→4 + Gate）",  "Phase 执行过程中逐步查阅",        3522, 4460)
write_satellite("phases/deliverables.md",          "输出物要求与 L2/L3 触发机制",           "L2 / L3 交付决策点",              4461, 4552)
write_satellite("phases/video-audio.md",           "视频与音频制作流水线（Remotion + TTS）","做视频 / 语音基线时",             4583, 5158)
write_satellite("phases/token-cost.md",            "Token 消耗与成本估算",                  "规划长课件时",                    5159, 5210)
write_satellite("phases/packaging.md",             "课件打包与分发",                        "L4 打包或发布阶段",               5211, 5994)

print("\n切分完成。")
