#!/usr/bin/env bash
# ============================================================
# TeachAny Map Resources Installer (v6 · skill-bundled)
# ============================================================
# 一键安装历史/地理课件所需的全套地图资源。
#
# 资源来源优先级：
#   1. skill 自带（~/.codebuddy/skills/teachany/assets/）← 秒级 cp，离线可用
#   2. 联网下载（Natural Earth / historical-basemaps / CHGIS）
#
# 用法：
#   bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh [项目目录]
#
# 幂等：已存在且合法的资源不会重新安装。
# ============================================================

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_ASSETS="$SKILL_DIR/assets"

# ─── 定位项目根 ───────────────────────────────
locate_project() {
  local p="$1"
  if [ -n "$p" ] && [ -d "$p" ]; then echo "$p"; return; fi
  if [ -d "teachany-opensource/data" ]; then echo "$(pwd)/teachany-opensource"; return; fi
  if [ -d "data/_legacy/resources" ] || [ -d "data/geography" ] || [ -f "registry.json" ]; then
    echo "$(pwd)"; return
  fi
  # 宽松模式：当前目录下有 index.html 或 examples/*/index.html 也视作项目根
  if [ -f "index.html" ] || ls -d */index.html 2>/dev/null | head -1 | grep -q .; then
    echo "$(pwd)"; return
  fi
  # 默认就用当前目录（零配置，直接往这里塞 data/）
  echo "$(pwd)"
}

PROJECT_ROOT="$(locate_project "$1")"
if [ -z "$PROJECT_ROOT" ]; then
  PROJECT_ROOT="$(pwd)"
  echo "ℹ️  未识别为已知 teachany 项目，默认安装到当前目录: $PROJECT_ROOT"
fi

DATA_DIR="$PROJECT_ROOT/data"
LEGACY_ROOT="$DATA_DIR/_legacy/resources"
GEO_DIR="$LEGACY_ROOT/geography"
HIST_DIR="$LEGACY_ROOT/history"

echo "================================================"
echo "TeachAny Map Resources Installer v6"
echo "================================================"
echo "项目根目录: $PROJECT_ROOT"
echo "Skill 资源:  $SKILL_ASSETS"
echo ""

# ─── 基础目录 ─────────────────────────────────
mkdir -p "$GEO_DIR"/{hillshade,historical-china,historical-world,modern-china,world,rivers,lakes,coastline}
mkdir -p "$HIST_DIR"/{timelines,figures,battles,cities,landmarks,dynasties}

# ─── 1. 建立符号链接 ──────────────────────────
echo "[1/6] 建立 symlink: data/geography → _legacy/resources/geography"
cd "$DATA_DIR"
[ -L geography ] && rm -f geography
[ -L history ]   && rm -f history
ln -sfn _legacy/resources/geography geography
ln -sfn _legacy/resources/history history
cd - > /dev/null
echo "  ✅ symlink 已建立"
echo ""

# 工具函数：从 skill 自带 assets 拷贝
copy_if_missing() {
  local src="$1"
  local dst="$2"
  local min_size="${3:-1000}"
  if [ -f "$dst" ] && [ "$(wc -c < "$dst" | tr -d ' ')" -gt "$min_size" ]; then
    return 2  # 已有
  fi
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    return 0  # 新拷贝
  fi
  return 1  # skill 里也没有
}

# ─── 2. Natural Earth hillshade ───────────────
echo "[2/6] Natural Earth 地形底图"
copied=0; skipped=0; missing=0
if [ -d "$SKILL_ASSETS/hillshade" ]; then
  for f in "$SKILL_ASSETS/hillshade"/*.jpg; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    copy_if_missing "$f" "$GEO_DIR/hillshade/$name" 50000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  done
  echo "  ✅ 从 skill 拷入 $copied 个，$skipped 个已存在"
else
  echo "  ⚠️  skill assets 中没有 hillshade，联网下载"
  HILLSHADE_URL="https://raw.githubusercontent.com/weponusa/teachany-map-assets/main/hillshade"
  for f in global-color-hillshade-4k.jpg global-hillshade-4k.jpg global-color-relief-4k.jpg; do
    out="$GEO_DIR/hillshade/$f"
    [ -f "$out" ] && continue
    curl -fsSL --max-time 120 -o "$out" "$HILLSHADE_URL/$f" 2>/dev/null || missing=$((missing+1))
  done
fi
echo ""

# ─── 3. historical-basemaps 世界 ───────────────
echo "[3/6] historical-basemaps 世界 21 切片"
copied=0; skipped=0
if [ -d "$SKILL_ASSETS/historical-world" ]; then
  for f in "$SKILL_ASSETS/historical-world"/*.geojson; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    copy_if_missing "$f" "$GEO_DIR/historical-world/$name" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  done
  echo "  ✅ 从 skill 拷入 $copied 个，$skipped 个已存在"
else
  echo "  ⚠️  skill assets 缺失，联网下载"
  WORLD_BASE="https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson"
  declare -a WORLD_MAP=(
    "bce-3000:world_bc3000" "bce-1500:world_bc1500" "bce-1000:world_bc1000"
    "bce-500:world_bc500" "bce-323-alexander:world_bc323" "bce-200:world_bc200"
    "bce-1:world_bc1" "ce-200:world_200" "ce-500:world_500"
    "ce-800-caliphate-carolingian:world_800" "ce-1000:world_1000"
    "ce-1200-mongol-rise:world_1200" "ce-1300-mongol-peak:world_1300"
    "ce-1492-age-of-discovery:world_1492" "ce-1600:world_1600" "ce-1700:world_1700"
    "ce-1815-vienna:world_1815" "ce-1880:world_1880" "ce-1914-wwi:world_1914"
    "ce-1945-wwii:world_1945" "ce-2000:world_2000"
  )
  for entry in "${WORLD_MAP[@]}"; do
    IFS=':' read -r outname srcname <<< "$entry"
    out="$GEO_DIR/historical-world/${outname}.geojson"
    [ -f "$out" ] && [ "$(wc -c < "$out" | tr -d ' ')" -gt 100000 ] && continue
    curl -fsSL --max-time 60 -o "$out" "$WORLD_BASE/${srcname}.geojson" 2>/dev/null || true
  done
fi
echo ""

# ─── 4. CHGIS V6 中国 ──────────────────────────
echo "[4/6] CHGIS V6 中国 17 朝代"
copied=0; skipped=0
if [ -d "$SKILL_ASSETS/historical-china" ]; then
  for f in "$SKILL_ASSETS/historical-china"/*.geojson; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    copy_if_missing "$f" "$GEO_DIR/historical-china/$name" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  done
  echo "  ✅ 从 skill 拷入 $copied 个，$skipped 个已存在"
else
  echo "  ⚠️  skill assets 缺失，从 CHGIS shapefile 重新切片（首次约 2-3 分钟）"
  CHGIS_ZIP="/tmp/chgis_v6.zip"
  CHGIS_DIR="/tmp/chgis_v6"
  CHGIS_URL="https://dataverse.harvard.edu/api/access/datafile/:persistentId/?persistentId=doi:10.7910/DVN/I0Q7SM/2VUO2N"

  if [ ! -f "$CHGIS_DIR/v6_time_pref_pgn_utf_wgs84.shp" ]; then
    if [ ! -f "$CHGIS_ZIP" ] || [ "$(wc -c < "$CHGIS_ZIP" | tr -d ' ')" -lt 10000000 ]; then
      echo "  ⬇ 下载 CHGIS V6 zip (30MB)..."
      curl -fsSL --max-time 600 -o "$CHGIS_ZIP" "$CHGIS_URL" 2>/dev/null
    fi
    [ -f "$CHGIS_ZIP" ] && { mkdir -p "$CHGIS_DIR"; (cd "$CHGIS_DIR" && unzip -oq "$CHGIS_ZIP"); }
  fi

  build_sh="$SKILL_DIR/scripts/build_chgis_dynasty_maps_v2.sh"
  if [ -f "$build_sh" ] && [ -f "$CHGIS_DIR/v6_time_pref_pgn_utf_wgs84.shp" ]; then
    PROJECT_ROOT="$PROJECT_ROOT" bash "$build_sh" 2>&1 | grep -E "^\s+✅|^\s+❌" || true
    for py in annotate_dynasty_powers.py build_song_era_maps.py rebuild_china_maps.py; do
      if [ -f "$SKILL_DIR/scripts/$py" ]; then
        (cd "$PROJECT_ROOT" && python3 "$SKILL_DIR/scripts/$py" > /dev/null 2>&1) || true
      fi
    done
  else
    echo "  ⚠️  切片脚本或 shapefile 缺失，中国朝代资源暂缺"
  fi
fi
echo ""

# ─── 5. 历史时间线（JSON） ─────────────────────
echo "[5/6] 历史时间线"
copied=0; skipped=0
if [ -d "$SKILL_ASSETS/timelines" ]; then
  for f in "$SKILL_ASSETS/timelines"/*.json; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    copy_if_missing "$f" "$HIST_DIR/timelines/$name" 100
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  done
  echo "  ✅ 从 skill 拷入 $copied 个，$skipped 个已存在"
fi
echo ""

# ─── 6. 现代中国 + 世界当代 ────────────────────
echo "[6/6] 现代行政 & 世界当代"
if [ ! -f "$GEO_DIR/modern-china/provinces.geojson" ]; then
  echo "  ⬇ provinces.geojson (阿里云 DataV)"
  curl -fsSL --max-time 60 -o "$GEO_DIR/modern-china/provinces.geojson" \
    "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json" 2>/dev/null \
    || echo "    ⚠️ 失败（可稍后重试，不阻塞历史课件）"
fi
if [ ! -f "$GEO_DIR/world/countries.geojson" ]; then
  echo "  ⬇ world/countries.geojson (Natural Earth Admin)"
  curl -fsSL --max-time 60 -o "$GEO_DIR/world/countries.geojson" \
    "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/cultural/ne_50m_admin_0_countries.json" 2>/dev/null \
    || echo "    ⚠️ 失败"
fi
echo ""

# ─── 验证 ─────────────────────────────────────
echo "================================================"
echo "验证安装结果"
echo "================================================"
cd "$GEO_DIR"
hs=$(ls hillshade/*.jpg 2>/dev/null | wc -l | tr -d ' ')
hc=$(ls historical-china/*.geojson 2>/dev/null | wc -l | tr -d ' ')
hw=$(ls historical-world/*.geojson 2>/dev/null | wc -l | tr -d ' ')
mc=$(ls modern-china/*.geojson 2>/dev/null | wc -l | tr -d ' ')
wd=$(ls world/*.geojson 2>/dev/null | wc -l | tr -d ' ')
tl=$(ls "$HIST_DIR"/timelines/*.json 2>/dev/null | wc -l | tr -d ' ')

printf "  hillshade:          %2d (期望 ≥3)\n" "$hs"
printf "  historical-china:   %2d (期望 ≥15)\n" "$hc"
printf "  historical-world:   %2d (期望 ≥18)\n" "$hw"
printf "  timelines:          %2d (期望 ≥2)\n" "$tl"
printf "  modern-china:       %2d (期望 ≥1)\n" "$mc"
printf "  world:              %2d (期望 ≥1)\n" "$wd"
echo ""

ok=true
[ "$hs" -lt 3 ] && ok=false
[ "$hw" -lt 15 ] && ok=false
[ "$hc" -lt 10 ] && ok=false

if [ "$ok" = true ]; then
  echo "✅ 安装完成！"
  echo ""
  echo "下一步："
  echo "  1. python3 -m http.server 8080 -d $PROJECT_ROOT"
  echo "  2. 打开: http://localhost:8080/data/map-demo-minimal.html"
  echo "  3. 参考模板: ~/.codebuddy/skills/teachany/historical-maps.md §3"
  exit 0
else
  echo "⚠️  部分核心资源缺失，部分课件功能可能受限"
  echo "   联网后重跑本脚本即可续传（幂等）"
  exit 2
fi
