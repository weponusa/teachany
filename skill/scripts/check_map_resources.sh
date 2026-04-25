#!/usr/bin/env bash
# ============================================================
# TeachAny Map Resources Checker v6.9 · 自包含架构
# ============================================================
# 判断 skill 自带的 assets/ 地图资源是否完整（开箱即用验证）。
# v6.9 变化：skill 不再依赖仓库 data/_legacy，直接用 skill/assets/。
#
# 用法：
#   bash ~/.codebuddy/skills/teachany/scripts/check_map_resources.sh
# 退出码：
#   0 = 完整
#   1 = 缺失
#   2 = skill 结构损坏
# ============================================================

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_ASSETS="$SKILL_DIR/assets"

if [ ! -d "$SKILL_ASSETS" ]; then
  echo "SKILL_BROKEN: $SKILL_ASSETS 不存在"
  exit 2
fi

HC="$SKILL_ASSETS/historical-china"
HW="$SKILL_ASSETS/historical-world"
HS="$SKILL_ASSETS/hillshade"
TL="$SKILL_ASSETS/timelines"

# 关键核心资源（至少要有的代表性文件，覆盖古今中外）
CORE_FILES=(
  "$HC/tang-dynasty.geojson"
  "$HW/ce-1300-mongol-peak.geojson"
  "$TL/chinese-dynasties.json"
)

missing=()
for f in "${CORE_FILES[@]}"; do
  if [ ! -f "$f" ] || [ "$(wc -c < "$f" 2>/dev/null | tr -d ' ')" -lt 1000 ]; then
    missing+=("$f")
  fi
done

# 统计（按数量粗筛）
hs_count=$(ls "$HS"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
hc_count=$(ls "$HC"/*.geojson 2>/dev/null | wc -l | tr -d ' ')
hw_count=$(ls "$HW"/*.geojson 2>/dev/null | wc -l | tr -d ' ')
tl_count=$(ls "$TL"/*.json 2>/dev/null | wc -l | tr -d ' ')

if [ ${#missing[@]} -eq 0 ] && [ "$hc_count" -ge 15 ] && [ "$hw_count" -ge 15 ]; then
  echo "OK hillshade=$hs_count china=$hc_count world=$hw_count timelines=$tl_count"
  exit 0
fi

echo "MISSING hillshade=$hs_count china=$hc_count world=$hw_count timelines=$tl_count"
for f in "${missing[@]}"; do
  echo "  - 缺: $f"
done
echo ""
echo "修复：cd \$(你的 teachany clone 目录) && git pull  # 确保 skill/assets/ 完整"
exit 1
