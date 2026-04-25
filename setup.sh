#!/usr/bin/env bash
# ============================================================
# TeachAny One-Click Setup · v6.9
# ============================================================
# clone 完 teachany 后，在仓库根目录跑：
#   bash setup.sh
# 它会自动：
#   1. 把 skill/ 软链到 ~/.codebuddy/skills/teachany 或 ~/.agents/skills/teachany
#   2. 自检 skill/assets 和 data/trees 完整性
#   3. 提示下一步
# ============================================================

set -eo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
SKILL="$REPO/skill"

echo "═════════════════════════════════════"
echo "  🎓 TeachAny Setup v6.9"
echo "═════════════════════════════════════"
echo "仓库目录: $REPO"
echo

# ─── 1. 自检 skill 目录 ─────────────────────
if [ ! -d "$SKILL" ]; then
  echo "❌ 找不到 $SKILL"
  echo "   请确认你在 teachany 仓库根目录跑这个脚本"
  exit 1
fi

echo "[1/3] 自检 skill 目录"
if [ -f "$SKILL/SKILL_CN.md" ] && [ -d "$SKILL/scripts" ] && [ -d "$SKILL/assets" ]; then
  echo "  ✅ skill/SKILL_CN.md"
  echo "  ✅ skill/scripts/ ($(ls "$SKILL/scripts" | wc -l | xargs) 个文件)"
  echo "  ✅ skill/assets/ ($(du -sh "$SKILL/assets" | cut -f1))"
else
  echo "  ❌ skill 结构不完整"
  exit 2
fi

# ─── 2. 自检 data/ ─────────────────────────
echo ""
echo "[2/3] 自检 data/ 目录"
if [ -d "$REPO/data/trees" ]; then
  tree_count=$(find "$REPO/data/trees" -name "*.json" | wc -l | xargs)
  echo "  ✅ data/trees/ ($tree_count 个知识树)"
else
  echo "  ⚠️  data/trees/ 缺失，skill 的 find_nodes 将无法工作"
fi

# ─── 3. 软链 skill ─────────────────────────
echo ""
echo "[3/3] 软链 skill 到 AI Agent"

link_skill() {
  local target="$1"
  local label="$2"
  mkdir -p "$(dirname "$target")"
  if [ -L "$target" ] || [ -d "$target" ]; then
    if [ "$(readlink "$target")" = "$SKILL" ]; then
      echo "  ✅ $label 已指向本仓（无需重复）"
      return
    fi
    echo "  ⚠️  $label 已存在（$(readlink "$target" || echo '非软链')），跳过"
    return
  fi
  ln -sfn "$SKILL" "$target"
  echo "  ✅ $label → $SKILL"
}

# CodeBuddy
link_skill "$HOME/.codebuddy/skills/teachany" "CodeBuddy"
# Claude Code / Cursor / Codex CLI (Agents common dir)
link_skill "$HOME/.agents/skills/teachany" "Claude/Cursor/Codex"

echo ""
echo "═════════════════════════════════════"
echo "  ✨ Setup 完成"
echo "═════════════════════════════════════"
echo ""
echo "试一下对 AI 说："
echo "  \"用 TeachAny 给我做一节《一次函数的图像》的八年级数学课\""
echo ""
echo "验证 skill 是否就绪："
echo "  bash $SKILL/scripts/check_map_resources.sh"
echo ""
echo "卸载软链："
echo "  rm ~/.codebuddy/skills/teachany"
echo "  rm ~/.agents/skills/teachany"
