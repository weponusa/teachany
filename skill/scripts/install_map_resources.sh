#!/usr/bin/env bash
# ============================================================
# TeachAny Map Resources Installer (v7 · CDN-first)
# ============================================================
# 一键安装历史/地理课件所需的全套地图资源。
#
# 资源来源优先级（v5.37 重构）：
#   1. skill 本地缓存（如有）← 秒级 cp，离线可用
#   2. jsDelivr CDN ← cdn.jsdelivr.net/gh/weponusa/teachany-images@main/
#   3. GitHub raw ← raw.githubusercontent.com fallback
#   4. 原始数据源（Natural Earth / CHGIS / 阿里云 DataV）
#
# 用法：
#   bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh [项目目录]
#
# 幂等：已存在且合法的资源不会重新安装。
# ============================================================

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_ASSETS="$SKILL_DIR/assets"

# CDN 基础 URL（v5.37: 图片和地图资源统一存储在 teachany-images 仓库）
CDN_BASE="https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main"
CDN_FALLBACK="https://raw.githubusercontent.com/weponusa/teachany-images/main"

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
echo "TeachAny Map Resources Installer v7 (CDN-first)"
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

# 工具函数：从 skill 本地缓存拷贝
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

# 工具函数：从 CDN 下载（带 fallback）
download_from_cdn() {
  local rel_path="$1"   # 如 "historical-china/qin-dynasty.geojson"
  local dst="$2"
  local min_size="${3:-1000}"
  if [ -f "$dst" ] && [ "$(wc -c < "$dst" | tr -d ' ')" -gt "$min_size" ]; then
    return 2  # 已有
  fi
  # 尝试 jsDelivr CDN
  if curl -fsSL --max-time 30 -o "$dst" "$CDN_BASE/$rel_path" 2>/dev/null; then
    return 0
  fi
  # 尝试 GitHub raw fallback
  if curl -fsSL --max-time 30 -o "$dst" "$CDN_FALLBACK/$rel_path" 2>/dev/null; then
    return 0
  fi
  return 1  # 下载失败
}

# ─── 2. Natural Earth hillshade ───────────────
echo "[2/6] Natural Earth 地形底图"
copied=0; skipped=0; missing=0
for name in global-color-hillshade-2k.jpg global-color-hillshade-4k.jpg global-color-relief-2k.jpg global-color-relief-4k.jpg global-hillshade-2k.jpg global-hillshade-4k.jpg; do
  dst="$GEO_DIR/hillshade/$name"
  # 优先本地 skill 缓存
  if [ -f "$SKILL_ASSETS/hillshade/$name" ]; then
    copy_if_missing "$SKILL_ASSETS/hillshade/$name" "$dst" 50000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  else
    # 从 CDN 下载
    download_from_cdn "hillshade/$name" "$dst" 50000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
      1) missing=$((missing+1)) ;;
    esac
  fi
done
echo "  ✅ 新安装 $copied 个，已存在 $skipped 个，缺失 $missing 个"

# ─── 3. historical-basemaps 世界 ───────────────
echo "[3/6] historical-basemaps 世界 21 切片"
copied=0; skipped=0; missing=0
WORLD_FILES=(
  "bce-3000.geojson" "bce-1500.geojson" "bce-1000.geojson"
  "bce-500.geojson" "bce-323-alexander.geojson" "bce-200.geojson"
  "bce-1.geojson" "ce-200.geojson" "ce-500.geojson"
  "ce-800-caliphate-carolingian.geojson" "ce-1000.geojson"
  "ce-1200-mongol-rise.geojson" "ce-1300-mongol-peak.geojson"
  "ce-1492-age-of-discovery.geojson" "ce-1600.geojson" "ce-1700.geojson"
  "ce-1815-vienna.geojson" "ce-1880.geojson" "ce-1914-wwi.geojson"
  "ce-1945-wwii.geojson" "ce-2000.geojson"
)
for name in "${WORLD_FILES[@]}"; do
  dst="$GEO_DIR/historical-world/$name"
  # 优先本地 skill 缓存
  if [ -f "$SKILL_ASSETS/historical-world/$name" ]; then
    copy_if_missing "$SKILL_ASSETS/historical-world/$name" "$dst" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  else
    # 从 CDN 下载
    download_from_cdn "historical-world/$name" "$dst" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
      1) missing=$((missing+1)) ;;
    esac
  fi
done
echo "  ✅ 新安装 $copied 个，已存在 $skipped 个，缺失 $missing 个"
echo ""

# ─── 4. CHGIS V6 中国 ──────────────────────────
echo "[4/6] CHGIS V6 中国 19 朝代"
copied=0; skipped=0; missing=0
CHINA_FILES=(
  "shang-dynasty.geojson" "western-zhou-dynasty.geojson" "spring-autumn-period.geojson"
  "warring-states-period.geojson" "qin-dynasty.geojson" "western-han-dynasty.geojson"
  "eastern-han-dynasty.geojson" "three-kingdoms-period.geojson" "western-jin-dynasty.geojson"
  "eastern-jin-dynasty.geojson" "northern-southern-dynasties.geojson" "sui-dynasty.geojson"
  "tang-dynasty.geojson" "northern-song-dynasty.geojson" "southern-song-dynasty.geojson"
  "yuan-dynasty.geojson" "ming-dynasty.geojson" "qing-dynasty.geojson"
  "republic-of-china.geojson"
)
for name in "${CHINA_FILES[@]}"; do
  dst="$GEO_DIR/historical-china/$name"
  # 优先本地 skill 缓存
  if [ -f "$SKILL_ASSETS/historical-china/$name" ]; then
    copy_if_missing "$SKILL_ASSETS/historical-china/$name" "$dst" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  else
    # 从 CDN 下载
    download_from_cdn "historical-china/$name" "$dst" 10000
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
      1) missing=$((missing+1)) ;;
    esac
  fi
done
echo "  ✅ 新安装 $copied 个，已存在 $skipped 个，缺失 $missing 个"
echo ""

# ─── 5. 历史时间线（JSON） ─────────────────────
echo "[5/6] 历史时间线"
copied=0; skipped=0; missing=0
TIMELINE_FILES=(
  "china-dynasties.json" "world-major-events.json" "world-wars.json"
)
for name in "${TIMELINE_FILES[@]}"; do
  dst="$HIST_DIR/timelines/$name"
  # 优先本地 skill 缓存
  if [ -f "$SKILL_ASSETS/timelines/$name" ]; then
    copy_if_missing "$SKILL_ASSETS/timelines/$name" "$dst" 100
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
    esac
  else
    # 从 CDN 下载
    download_from_cdn "timelines/$name" "$dst" 100
    case $? in
      0) copied=$((copied+1)) ;;
      2) skipped=$((skipped+1)) ;;
      1) missing=$((missing+1)) ;;
    esac
  fi
done
echo "  ✅ 新安装 $copied 个，已存在 $skipped 个，缺失 $missing 个"
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
