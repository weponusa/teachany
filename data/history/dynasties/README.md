# 朝代地理数据

## 数据源说明

主要朝代 GeoJSON 数据统一存放在 `data/geography/historical-china/` 目录，包括：
- 秦、西汉、东汉、唐、元、明、清

本目录保留以下独有数据：
- `north-song-dynasty.geojson` — 北宋疆域
- `south-song-dynasty.geojson` — 南宋疆域
- `*-inline.json` — 课件用的精简内联数据缓存

## 引用路径

课件中引用历史地图数据时，统一使用：

```
data/geography/historical-china/{dynasty-name}.geojson
```

北宋/南宋数据引用：

```
data/history/dynasties/north-song-dynasty.geojson
data/history/dynasties/south-song-dynasty.geojson
```
