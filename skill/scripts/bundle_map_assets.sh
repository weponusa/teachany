#!/bin/bash
# bundle_map_assets.sh · v6.4
# 作用：把课件 index.html 里引用的地图 GeoJSON + hillshade 拷到 ./assets/maps/
#       让课件完全自包含，不依赖仓库 data/ 或线上 fallback URL。
# 原则：所有依赖要跟成果始终一起。
#
# 用法：
#   bash bundle_map_assets.sh <课件目录>
#
# 流程：
#   1. 扫描 index.html 提取所有 .geojson 文件名（去重）
#   2. 从 skill assets/historical-{china,world}/ 和仓库 data/_legacy/.../geography/
#      中依次查找这些 geojson
#   3. 拷贝到 <课件目录>/assets/maps/
#   4. 如果课件用了 hillshade，也拷贝（优先 global-hillshade-4k.jpg → hillshade.jpg）

set -e

COURSE_DIR="${1:-}"
if [ -z "$COURSE_DIR" ] || [ ! -d "$COURSE_DIR" ]; then
  echo "用法: $0 <课件目录>"
  echo "例: $0 community/history-ww2"
  exit 1
fi

HTML="$COURSE_DIR/index.html"
if [ ! -f "$HTML" ]; then
  echo "❌ 找不到 $HTML"
  exit 1
fi

echo "═════════════════════════════════════"
echo "  Bundle Map Assets · v6.4"
echo "═════════════════════════════════════"
echo "课件目录: $COURSE_DIR"
echo

# 1. 资源源：v6.12 起统一从 assets/maps/ 读（时空索引化）
#    兼容：旧版 skill/assets/historical-* 若还在也可用
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MAPS_ROOT="$REPO_ROOT/assets/maps"
SKILL_ASSETS="$(cd "$(dirname "$0")/.." && pwd)/assets"

SOURCES=(
  "$MAPS_ROOT/chrono-cn"
  "$MAPS_ROOT/chrono-world"
  "$MAPS_ROOT/physical/hillshade"
  "$MAPS_ROOT/physical/coastline"
  "$MAPS_ROOT/physical/rivers"
  "$MAPS_ROOT/physical/lakes"
  "$MAPS_ROOT/political/world"
  "$MAPS_ROOT/political/china-modern"
  "$MAPS_ROOT/political/admin-boundaries"
  # 向后兼容旧路径
  "$SKILL_ASSETS/historical-china"
  "$SKILL_ASSETS/historical-world"
  "$SKILL_ASSETS/hillshade"
  "$SKILL_ASSETS/timelines"
)

# 自检：至少要有 assets/maps 或 skill/assets
if [ ! -d "$MAPS_ROOT" ] && [ ! -d "$SKILL_ASSETS" ]; then
  echo "❌ 找不到地图资源目录"
  echo "   请确认仓库包含 assets/maps/ 或 skill/assets/"
  exit 2
fi

echo "[1/3] 资源源目录:"
for s in "${SOURCES[@]}"; do
  if [ -d "$s" ]; then
    count=$(find "$s" -maxdepth 1 -type f | wc -l | tr -d ' ')
    echo "  ✓ $s ($count 文件)"
  fi
done
echo

# 2. 扫描 HTML 提取所有 .geojson 文件名（去掉路径）
echo "[2/3] 扫描 index.html 提取地图引用..."
# 策略 A：直接匹配 *.geojson 文件名
GEOJSONS_A=$(grep -oE "['\"\`][^'\"\`]*\.geojson" "$HTML" 2>/dev/null | \
  sed -E "s|.*/([^/'\"\`]+\.geojson)|\1|" | \
  grep -oE "[a-z0-9_-]+\.geojson" | sort -u)
# 策略 B：匹配 data-map="xxx" 属性（ww2 类课件用按钮切换）
GEOJSONS_B=$(grep -oE 'data-map="[a-z0-9_-]+"' "$HTML" 2>/dev/null | \
  sed -E 's|data-map="([^"]+)"|\1.geojson|' | sort -u)
# 策略 C：匹配 loadXxxMap(this, 'xxx', ...) 的第二个参数
GEOJSONS_C=$(grep -oE "load[A-Za-z]+Map\s*\(\s*this\s*,\s*['\"][a-z0-9_-]+['\"]" "$HTML" 2>/dev/null | \
  sed -E "s|.*,\s*['\"]([^'\"]+)['\"].*|\1.geojson|" | sort -u)

GEOJSONS=$(echo -e "$GEOJSONS_A\n$GEOJSONS_B\n$GEOJSONS_C" | grep -v "^$" | sort -u)

if [ -z "$GEOJSONS" ]; then
  echo "  ℹ️  课件没有 .geojson 引用，只检查 hillshade..."
fi

# 输出引用列表
count_refs=0
for f in $GEOJSONS; do
  count_refs=$((count_refs + 1))
  echo "  📍 $f"
done
[ "$count_refs" -gt 0 ] && echo "     （共 $count_refs 个 geojson 引用）"
echo

# 3. 拷贝
mkdir -p "$COURSE_DIR/assets/maps"
DST="$COURSE_DIR/assets/maps"

echo "[3/3] 拷贝资源到 $DST ..."
copied=0
missing=0
for f in $GEOJSONS; do
  if [ -f "$DST/$f" ]; then
    echo "  ⏭️  $f (已存在, skip)"
    continue
  fi
  found=""
  for src in "${SOURCES[@]}"; do
    # 精确匹配
    if [ -f "$src/$f" ]; then
      cp "$src/$f" "$DST/$f"
      size=$(du -h "$DST/$f" | awk '{print $1}')
      echo "  ✅ $f ($size) ← $(basename "$src")"
      found=1
      copied=$((copied + 1))
      break
    fi
    # 模糊匹配：chrono-cn/chrono-world 下带时序前缀（001-xxx.geojson）
    match=$(find "$src" -maxdepth 1 -name "[0-9][0-9][0-9]-$f" 2>/dev/null | head -1)
    if [ -n "$match" ]; then
      cp "$match" "$DST/$f"
      size=$(du -h "$DST/$f" | awk '{print $1}')
      echo "  ✅ $f ($size) ← $(basename "$match") [时序匹配]"
      found=1
      copied=$((copied + 1))
      break
    fi
  done
  if [ -z "$found" ]; then
    echo "  ⚠️  $f 未找到"
    missing=$((missing + 1))
  fi
done

# hillshade
if grep -qE "hillshade|basemap" "$HTML"; then
  if [ ! -f "$DST/hillshade.jpg" ]; then
    hill_found=""
    for src in "${SOURCES[@]}"; do
      for name in "global-hillshade-4k.jpg" "global-color-hillshade-4k.jpg"; do
        if [ -f "$src/$name" ]; then
          cp "$src/$name" "$DST/hillshade.jpg"
          size=$(du -h "$DST/hillshade.jpg" | awk '{print $1}')
          echo "  ✅ hillshade.jpg ($size) ← $name"
          hill_found=1
          copied=$((copied + 1))
          break 2
        fi
      done
    done
    if [ -z "$hill_found" ]; then
      echo "  ℹ️  没找到 hillshade，课件若需要底图请手工加"
    fi
  else
    echo "  ⏭️  hillshade.jpg (已存在)"
  fi
fi

echo
echo "═════════════════════════════════════"
echo "  总结: 拷贝 $copied 个 · 缺失 $missing 个"
total_size=$(du -sh "$DST" 2>/dev/null | awk '{print $1}')
echo "  $DST 总大小: $total_size"
echo "═════════════════════════════════════"

if [ "$missing" -gt 0 ]; then
  echo
  echo "⚠️  有 $missing 个资源未找到，请检查 skill 或仓库的地图资源是否齐全"
  exit 1
fi

echo
echo "✅ 课件已完全自包含，所有依赖位于 ./assets/maps/"
echo "   可安全发布，无论仓库 data/ 是否部署都能工作"
