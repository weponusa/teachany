#!/usr/bin/env bash
# SKILL_CN.md 拆分脚本
# 基于 SPLIT_PLAN.md 的行号范围，把巨文件切分为主文 + 15 个卫星文档
set -euo pipefail

cd "$(dirname "$0")"
SRC="SKILL_CN.md"
[ -f "$SRC" ] || { echo "错误：$SRC 不存在"; exit 1; }

TOTAL=$(wc -l < "$SRC")
echo "源文件：$SRC，共 $TOTAL 行"
if [ "$TOTAL" -ne 6001 ]; then
  echo "警告：源文件行数不是 6001（实际 $TOTAL），请重新核对 SPLIT_PLAN.md 的行号"
  exit 2
fi

mkdir -p guides tech phases

# 统一的卫星文档头部模板
make_header() {
  local title="$1"
  local trigger="$2"
  cat <<EOF
# $title

> **所属**：TeachAny 技能 · 卫星文档
> **触发时机**：$trigger
> **主文档**：[../SKILL_CN.md](../SKILL_CN.md)
>
> 本文件从 SKILL_CN.md 主文拆出，按需加载以避免上下文爆炸。

---

EOF
}

# 提取原文指定行范围
extract() {
  local start="$1" end="$2"
  sed -n "${start},${end}p" "$SRC"
}

echo "开始切分..."

# === guides/ ===
{ make_header "项目制与任务驱动" "做 PBL / 任务驱动课件时"; extract 1119 1242; } > guides/project-based.md
{ make_header "互动与页面形态库" "Phase 3 选择交互形态时"; extract 1243 1346; } > guides/interaction-patterns.md
{ make_header "评估系统" "设计评估 / 练习题时"; extract 1347 1454; } > guides/assessment.md
{ make_header "前置知识链与学段差异" "Phase 0.5 知识查询阶段"; extract 1455 1509; } > guides/prerequisites.md
{ make_header "三个学科完整微型示例" "需要参考完整示例时"; extract 1510 1567; } > guides/examples.md

# === tech/ (第十章内部再切) ===
{ make_header "推荐技术组合" "Phase 0.5 技术选型"; extract 1570 1580; } > tech/stack.md
{ make_header "互动网页标准结构" "Phase 3 编写 HTML 主体时"; extract 1581 2622; } > tech/page-structure.md
{ make_header "视觉设计规范（按学段分级）" "Phase 3 写 CSS 样式时"; extract 2623 2742; } > tech/design-system.md
{ make_header "AI 多模态互动区（可选功能）" "做多模态互动时"; extract 2743 3273; } > tech/ai-multimodal.md
{ make_header "WorkBuddy 多 Agent 协作流水线" "启用多 Agent 并行时"; extract 3274 3521; } > tech/workbuddy-agents.md

# === phases/ ===
{ make_header "课件开发标准流程（Phase 0→4 + Gate）" "Phase 执行过程中逐步查阅"; extract 3522 4460; } > phases/workflow.md
{ make_header "输出物要求与 L2/L3 触发机制" "L2 / L3 交付决策点"; extract 4461 4552; } > phases/deliverables.md
{ make_header "视频与音频制作流水线（Remotion + TTS）" "做视频 / 语音基线时"; extract 4583 5158; } > phases/video-audio.md
{ make_header "Token 消耗与成本估算" "规划长课件时"; extract 5159 5210; } > phases/token-cost.md
{ make_header "课件打包与分发" "L4 打包或发布阶段"; extract 5211 5994; } > phases/packaging.md

echo ""
echo "切分完成，各文件行数："
wc -l guides/*.md tech/*.md phases/*.md | awk '{printf "  %7s %s\n", $1, $2}'
