#!/usr/bin/env bash
# ============================================================
# TeachAny Map Resources Checker (轻量，秒级)
# ============================================================
# 判断当前项目是否已安装完整的地图资源。
# 用法：
#   bash ~/.codebuddy/skills/teachany/scripts/check_map_resources.sh [项目目录]
# 退出码：
#   0 = 完整（可直接制作历史/地理课件）
#   1 = 缺失（需要跑 install_map_resources.sh）
#   2 = 项目路径未找到
# ============================================================

locate_project() {
  local p="$1"
  [ -n "$p" ] && [ -d "$p" ] && { echo "$p"; return; }
  [ -d "teachany-opensource/data" ] && { echo "$(pwd)/teachany-opensource"; return; }
  [ -d "data/_legacy/resources" ] || [ -d "data/geography" ] || [ -f "registry.json" ] && { echo "$(pwd)"; return; }
  echo ""
}

PROJECT_ROOT="$(locate_project "$1")"
if [ -z "$PROJECT_ROOT" ]; then
  echo "PROJECT_NOT_FOUND"
  exit 2
fi

GEO="$PROJECT_ROOT/data/geography"
HIST="$PROJECT_ROOT/data/history"

# 关键核心资源（有其中一个就能跑基础课件）
CORE_FILES=(
  "$GEO/hillshade/global-color-hillshade-4k.jpg"
  "$GEO/historical-china/tang-dynasty.geojson"
  "$GEO/historical-world/ce-1300-mongol-peak.geojson"
  "$HIST/timelines/chinese-dynasties.json"
)

missing=()
for f in "${CORE_FILES[@]}"; do
  if [ ! -f "$f" ] || [ "$(wc -c < "$f" 2>/dev/null | tr -d ' ')" -lt 1000 ]; then
    missing+=("$f")
  fi
done

# 统计
hs=$(ls "$GEO"/hillshade/*.jpg 2>/dev/null | wc -l | tr -d ' ')
hc=$(ls "$GEO"/historical-china/*.geojson 2>/dev/null | wc -l | tr -d ' ')
hw=$(ls "$GEO"/historical-world/*.geojson 2>/dev/null | wc -l | tr -d ' ')

if [ ${#missing[@]} -eq 0 ] && [ "$hs" -ge 3 ] && [ "$hc" -ge 15 ] && [ "$hw" -ge 18 ]; then
  echo "OK hillshade=$hs china=$hc world=$hw"
  exit 0
fi

# 双平台探测：teachany.cn 优先（国内外均可访问），GitHub 作为备份。
# 可用 TEACHANY_MAP_REMOTE_BASE 覆盖首选源。
remote_bases=(
  "${TEACHANY_MAP_REMOTE_BASE:-https://www.teachany.cn/assets/maps}"
  "https://cdn.jsdelivr.net/gh/weponusa/teachany-courseware@main/assets/maps"
  "https://raw.githubusercontent.com/weponusa/teachany-courseware/main/assets/maps"
)

if command -v curl >/dev/null 2>&1; then
  for base in "${remote_bases[@]}"; do
    remote_manifest="${base%/}/MANIFEST.json"
    if curl -fsSL --max-time 12 "$remote_manifest" >/dev/null 2>&1; then
      echo "REMOTE_OK hillshade=$hs china=$hc world=$hw manifest=$remote_manifest"
      echo "  - 本地地图包不完整，但远程地图清单可访问（可用远程依赖模式 · 双平台）"
      exit 0
    fi
  done
fi

echo "MISSING hillshade=$hs china=$hc world=$hw"
for f in "${missing[@]}"; do
  echo "  - $f"
done
echo "  - 双平台远程清单均不可达：${remote_bases[*]}"
exit 1
