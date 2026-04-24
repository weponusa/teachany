#!/bin/bash
# v2：对早期朝代使用时间窗口范围过滤（而非单年切片），提升 feature 数量
# 策略：取 "BEG_YR <= window_end AND END_YR >= window_start" 的所有 feature
#   即：该府在这个时间窗口内"存在过"就保留

set -e

CACHE="/tmp/chgis_v6/cache.json"
OUT_DIR="/Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/_legacy/resources/geography/historical-china"
MAPSHAPER="npx --yes mapshaper@0.6"

# 格式：文件名 | 窗口起 | 窗口止
CUTS=(
  "qin-dynasty|-221|-206"
  "west-han-dynasty|-202|8"
  "east-han-dynasty|25|220"
  "han-dynasty|-202|220"
  "three-kingdoms|220|280"
  "jin-west-dynasty|265|316"
  "jin-east-dynasty|317|420"
  "northern-southern|420|589"
  "sui-dynasty|581|618"
  "tang-dynasty|618|907"
  "five-dynasties|907|960"
  "north-song-dynasty|960|1127"
  "south-song-dynasty|1127|1279"
  "liao-dynasty|916|1125"
  "jin-jurchen|1115|1234"
  "yuan-dynasty|1271|1368"
  "ming-dynasty|1368|1644"
  "qing-dynasty|1644|1912"
)

for entry in "${CUTS[@]}"; do
  IFS='|' read -r filename win_start win_end <<< "$entry"
  out="$OUT_DIR/$filename.geojson"
  # 该府存在于窗口内 = BEG_YR <= win_end AND END_YR >= win_start
  $MAPSHAPER "$CACHE" \
    -filter "BEG_YR<=$win_end && END_YR>=$win_start" \
    -o format=geojson precision=0.001 "$out" 2>&1 | grep -E 'Features|Retained' | head -2
  if [ -f "$out" ]; then
    feat_cnt=$(python3 -c "import json; d=json.load(open('$out')); print(len(d.get('features',[])))")
    size=$(wc -c < "$out" | tr -d ' ')
    printf "  ✅ %-25s window=[%5s,%5s] → %4s features, %s bytes\n" "$filename" "$win_start" "$win_end" "$feat_cnt" "$size"
  fi
done

echo "完成"
