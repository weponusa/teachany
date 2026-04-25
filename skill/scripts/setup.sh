#!/usr/bin/env bash
# ============================================================
# TeachAny Skill · 一键初始化（v6.3）
# ============================================================
# 新用户首次使用 skill 时执行，完成所有必要准备：
#
# 1. 检查系统依赖（python3 / node / git / curl）
# 2. 安装 edge-tts（TTS 语音生成）
# 3. 克隆 teachany-opensource 仓库到 ~/teachany-opensource
# 4. 把 skill 自带的地图资源装到仓库 data/ 下
# 5. 冒烟测试：check_baseline 脚本能跑
# 6. 输出下一步指引
#
# 用法：
#   bash ~/.codebuddy/skills/teachany/scripts/setup.sh
#
# 环境变量：
#   TEACHANY_REPO  指定仓库路径（默认 ~/teachany-opensource）
# ============================================================

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SCRIPTS="$SKILL_DIR/scripts"

echo "================================================"
echo "TeachAny Skill · 一键初始化（v6.3）"
echo "================================================"
echo "Skill 目录: $SKILL_DIR"
echo ""

# ─── 1. 检查基础依赖 ──────────────────────────
echo "[1/6] 检查系统依赖"
MISSING=()
for cmd in python3 node git curl unzip; do
  if command -v "$cmd" > /dev/null 2>&1; then
    echo "  ✅ $cmd: $(command -v $cmd)"
  else
    echo "  ❌ $cmd: 未安装"
    MISSING+=("$cmd")
  fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "❌ 缺少依赖：${MISSING[*]}"
  echo "  macOS: brew install ${MISSING[*]}"
  echo "  Ubuntu: sudo apt install ${MISSING[*]}"
  exit 1
fi
echo ""

# ─── 2. 安装 edge-tts ─────────────────────────
echo "[2/6] 检查 edge-tts（语音合成，B-2 基线必需）"
if python3 -c "import edge_tts" 2>/dev/null; then
  echo "  ✅ edge-tts 已安装"
else
  echo "  📦 未安装，尝试 pip install --user edge-tts"
  if python3 -m pip install --user --quiet edge-tts 2>&1 | tail -3; then
    echo "  ✅ edge-tts 安装成功"
  else
    echo "  ⚠️  edge-tts 安装失败，生成 TTS 时会报错"
    echo "     可稍后手动：pip3 install --user edge-tts"
  fi
fi
echo ""

# ─── 3. Clone teachany-opensource ─────────────
echo "[3/6] 准备 teachany-opensource 仓库"
REPO_DEFAULT="$HOME/teachany-opensource"
REPO="${TEACHANY_REPO:-}"

# 先按 publish 脚本同款顺序找
if [ -z "$REPO" ]; then
  for c in \
    "$HOME/CodeBuddy/一次函数/teachany-opensource" \
    "$HOME/CodeBuddy/teachany-opensource" \
    "$HOME/teachany-opensource" \
    "$HOME/WorkBuddy/teachany-opensource"
  do
    [ -f "$c/scripts/submit-to-community.py" ] && { REPO="$c"; break; }
  done
fi

if [ -n "$REPO" ] && [ -d "$REPO" ]; then
  echo "  ✅ 已有仓库: $REPO"
else
  echo "  🔄 克隆到: $REPO_DEFAULT"
  if git clone --depth 1 https://github.com/weponusa/teachany.git "$REPO_DEFAULT" 2>&1 | tail -4; then
    REPO="$REPO_DEFAULT"
    echo "  ✅ 克隆完成: $REPO"
  else
    echo "  ❌ 克隆失败（网络问题？）"
    echo "     请手动：git clone https://github.com/weponusa/teachany.git $REPO_DEFAULT"
    exit 1
  fi
fi
echo ""

# ─── 4. 安装地图资源 ──────────────────────────
echo "[4/6] 把 skill 自带地图资源装到仓库"
if [ -x "$SKILL_SCRIPTS/install_map_resources.sh" ]; then
  # install_map_resources.sh 幂等，已装则秒过
  bash "$SKILL_SCRIPTS/install_map_resources.sh" "$REPO" 2>&1 | tail -8
else
  echo "  ⚠️  install_map_resources.sh 不存在或不可执行"
fi
echo ""

# ─── 5. 冒烟测试 ──────────────────────────────
echo "[5/6] 冒烟测试：check_baseline.sh 能跑"
# 建临时目录装 tang 示例 + 最低必要资源
SMOKE_DIR=$(mktemp -d)
cp "$SKILL_DIR/templates/example-tang-dynasty.html" "$SMOKE_DIR/index.html"
mkdir -p "$SMOKE_DIR/tts" "$SMOKE_DIR/assets"
for s in hero objectives introduction core-concept modeling examples practice quiz summary knowledge-map; do
  echo "fake" > "$SMOKE_DIR/tts/$s.mp3"
done
echo '{"sections":{}}' > "$SMOKE_DIR/tts/manifest.json"
for img in hero concept extension; do
  echo "fake" > "$SMOKE_DIR/assets/$img.png"
done
# 插入 <img> 引用
python3 -c "
import re
p = '$SMOKE_DIR/index.html'
h = open(p).read()
imgs = '<img src=\"assets/hero.png\"><img src=\"assets/concept.png\"><img src=\"assets/extension.png\">'
h = h.replace('</body>', imgs + '</body>', 1)
open(p, 'w').write(h)
"

if bash "$SKILL_SCRIPTS/check_baseline.sh" "$SMOKE_DIR" > /tmp/smoke.log 2>&1; then
  pass_count=$(grep -c "✅ PASS" /tmp/smoke.log)
  echo "  ✅ check_baseline 通过 $pass_count 项（B-1 ~ B-7 基线检查正常）"
else
  echo "  ⚠️  check_baseline 有 FAIL：$(grep -c "❌ FAIL" /tmp/smoke.log) 项"
  echo "     这只是 skill 自身的冒烟验证，不影响你的课件"
fi
rm -rf "$SMOKE_DIR"
echo ""

# ─── 6. 输出下一步 ────────────────────────────
echo "[6/6] 下一步"
echo ""
echo "================================================"
echo "✅ 初始化完成！"
echo "================================================"
echo ""
echo "📁 仓库位置: $REPO"
echo "📁 Skill 位置: $SKILL_DIR"
echo ""
echo "🎯 开始做课件："
echo ""
echo "  1. 拷贝骨架模板开始："
echo "     cp $SKILL_DIR/templates/course-skeleton.html my-course/index.html"
echo ""
echo "  2. 或在 CodeBuddy/Claude 里告诉 AI："
echo "     \"做一节初中历史关于秦朝统一的课\""
echo ""
echo "  3. 课件做完后发布："
echo "     bash $SKILL_SCRIPTS/publish_course.sh <课件目录> <course-id>"
echo ""
echo "📚 关键文档："
echo "   $SKILL_DIR/SKILL_CN.md                  课件制作完整规范"
echo "   $SKILL_DIR/historical-maps.md           历史地理地图使用"
echo "   $SKILL_DIR/templates/course-skeleton.html  合规骨架模板"
echo ""
echo "🔧 有用脚本："
echo "   check_baseline.sh       验证课件是否达标"
echo "   check_images.sh         验证 ≥3 张 AI 图"
echo "   generate-tts.py         生成语音"
echo "   install_map_resources.sh  重装地图资源"
echo ""
echo "💬 需要 AI 帮你一步步制作？告诉它："
echo "   \"读 teachany skill，做一节 XXX 课\""
