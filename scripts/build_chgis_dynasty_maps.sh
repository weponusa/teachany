#!/bin/bash
# 从 CHGIS V6 时间序列 shapefile 按代表年份切片，生成各朝代 GeoJSON
# 数据源: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/I0Q7SM
# 许可: Free for academic research, no commercial use

set -e

SHP="/tmp/chgis_v6/v6_time_pref_pgn_utf_wgs84.shp"
OUT_DIR="/Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/_legacy/resources/geography/historical-china"
MAPSHAPER="npx --yes mapshaper@0.6"

if [ ! -f "$SHP" ]; then
  echo "❌ 找不到 CHGIS shapefile: $SHP"
  echo "请先下载：curl -L -o /tmp/chgis_v6.zip 'https://dataverse.harvard.edu/api/access/datafile/:persistentId/?persistentId=doi:10.7910/DVN/I0Q7SM/2VUO2N'"
  exit 1
fi

mkdir -p "$OUT_DIR"

# 按朝代取代表年份（BEG_YR <= year AND END_YR >= year）
# 朝代列表：文件名 | 朝代中文 | 代表年份 | 备注
CUTS=(
  "qin-dynasty|秦|-214|秦始皇统一后第7年，郡县制确立"
  "west-han-dynasty|西汉|-108|汉武帝元封三年，极盛期"
  "east-han-dynasty|东汉|140|永和五年，东汉顺帝时"
  "han-dynasty|汉朝（合并）|2|西汉末年（含西汉郡国）"
  "three-kingdoms|三国|262|魏景元三年，蜀灭亡前夕"
  "jin-west-dynasty|西晋|281|太康二年，西晋统一后一年"
  "jin-east-dynasty|东晋|400|晋安帝隆安四年"
  "northern-southern|南北朝|497|北魏孝文帝太和二十一年，迁都后期"
  "sui-dynasty|隋|609|大业五年，隋朝极盛"
  "tang-dynasty|唐|741|开元二十九年，盛唐"
  "five-dynasties|五代十国|950|后汉末期，五代中期"
  "north-song-dynasty|北宋|1111|政和元年"
  "south-song-dynasty|南宋|1210|嘉定三年"
  "liao-dynasty|辽|1111|辽天祚帝时期，与北宋并立"
  "jin-jurchen|金|1190|金章宗明昌元年"
  "yuan-dynasty|元|1330|元文宗至顺元年"
  "ming-dynasty|明|1582|万历十年"
  "qing-dynasty|清|1820|嘉庆二十五年"
)

echo "开始按朝代切片（共 ${#CUTS[@]} 个）..."
echo

# 读原 shapefile 一次到缓存
CACHE="/tmp/chgis_v6/cache.json"
if [ ! -f "$CACHE" ]; then
  echo "首次读取：导出全量 GeoJSON 作为缓存..."
  $MAPSHAPER "$SHP" -o format=geojson precision=0.001 "$CACHE" 2>&1 | tail -3
fi

for entry in "${CUTS[@]}"; do
  IFS='|' read -r filename dyname year note <<< "$entry"
  out="$OUT_DIR/$filename.geojson"
  echo "=== $dyname ($year 年) → $filename.geojson ==="
  # 用 mapshaper 按 BEG_YR<=year AND END_YR>=year 过滤
  $MAPSHAPER "$CACHE" \
    -filter "BEG_YR<=$year && END_YR>=$year" \
    -o format=geojson precision=0.001 "$out" 2>&1 | grep -E 'Features|warning|Error' | head -3
  if [ -f "$out" ]; then
    size=$(wc -c < "$out" | tr -d ' ')
    echo "  ✅ 生成: $out ($size bytes)"
  fi
  echo
done

echo "全部完成。"
ls -la "$OUT_DIR" | grep -v "^total"
