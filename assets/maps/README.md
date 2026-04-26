# 🗺️ TeachAny 地图资产（按时空逻辑组织）

> 本目录存放所有课件用到的地图 GeoJSON / 底图 / 3D 瓦片，按「时空维度」统一整理。
> 总大小 ~104MB · 207 个文件 · v1.0 (2026-04-26)

## 目录结构

```
assets/maps/
├── MANIFEST.json         # 统一索引（含时序、年代、元数据，机器可读）
├── physical/             # 自然地理（58MB · 地理课必备）
│   ├── hillshade/          全球地形晕渲底图（2.4M · 6 张 2K/4K jpg）
│   ├── coastline/          海岸线（21M）
│   ├── rivers/             河流（16M）
│   ├── lakes/              湖泊（7.7M）
│   └── terrain-tiles/      3D 地形瓦片 Z4-6（11M）
│
├── political/            # 政治地理（6.2MB · 现代国界和行政区）
│   ├── world/              世界现代国界
│   ├── china-modern/       中国现代省市
│   └── admin-boundaries/   详细行政边界
│
├── chrono-cn/            # 中国通史（24MB · 19 个朝代，按时序编号）
│   ├── 001-qin-dynasty.geojson          秦 BCE221-BCE207
│   ├── 002-west-han-dynasty.geojson     西汉 BCE202-8
│   ├── ...
│   └── 019-qing-dynasty.geojson         清 1636-1912
│
└── chrono-world/         # 世界通史（16MB · 21 个时期，按时序编号）
    ├── 001-bce-3000.geojson             古文明发轫
    ├── 002-bce-1500.geojson             青铜时代
    ├── ...
    └── 021-ce-2000.geojson              当代世界
```

## 快速查找

- **想看「文件一览 + 元数据」** → 打开 `MANIFEST.json`
- **想按年代找** → 目录里的 `NNN-` 前缀就是时序
- **想按朝代找** → `chrono-cn/` 按秦→汉→...→清顺序
- **想按世界时期找** → `chrono-world/` 按 BCE3000 → CE2000 时序

## 在课件中使用

```html
<!-- 直接引用（bundle_map_assets.sh 会自动打包到课件） -->
<img src="./assets/maps/tang-dynasty.geojson">

<!-- 带编号前缀也支持 -->
<img src="./assets/maps/chrono-cn/010-tang-dynasty.geojson">
```

发布时 `publish_course.sh` 会自动调用 `bundle_map_assets.sh`：

1. 扫描 HTML 里所有 `.geojson` 引用
2. 从 `assets/maps/` 各子目录查找（支持模糊匹配 `xxx.geojson` ↔ `NNN-xxx.geojson`）
3. 拷贝到课件的 `./assets/maps/` 下，让课件完全自包含

## MANIFEST.json 结构

```json
{
  "schema_version": "v1.0",
  "categories": { "physical": "...", "political": "...", ... },
  "stats": {
    "total_files": 207,
    "total_size_mb": 104.02,
    "by_category": { ... }
  },
  "files": [
    {
      "path": "chrono-cn/010-tang-dynasty.geojson",
      "size_bytes": 2301234,
      "category": "chrono-cn",
      "order": 10,
      "key": "tang-dynasty",
      "name_zh": "唐朝",
      "year_start": 618,
      "year_end": 907,
      "note": "贞观开元盛世"
    },
    ...
  ]
}
```

可以用 `jq` 查询：

```bash
# 查所有汉朝前后时期的地图
jq '.files[] | select(.category == "chrono-cn" and .year_start >= -221 and .year_end <= 280)' \
  assets/maps/MANIFEST.json

# 查总大小
jq '.stats.total_size_mb' assets/maps/MANIFEST.json
```

## 按需下载

假如用 `sparse-checkout` 排除了这个目录，可以按需下载：

```bash
# 单个文件
git sparse-checkout add assets/maps/chrono-cn/010-tang-dynasty.geojson
git checkout

# 整个子类
git sparse-checkout add assets/maps/chrono-cn/
git checkout

# 或从 CDN 直接下
curl -O https://raw.githubusercontent.com/weponusa/teachany/main/assets/maps/chrono-cn/010-tang-dynasty.geojson
```

## 历史版本兼容

旧路径（v6.11 之前）仍可用，`bundle_map_assets.sh` 会先从新路径找、再从旧路径找：

| 旧路径 | 新路径 |
|---|---|
| `skill/assets/historical-china/qin-dynasty.geojson` | `assets/maps/chrono-cn/001-qin-dynasty.geojson` |
| `skill/assets/historical-world/bce-3000.geojson` | `assets/maps/chrono-world/001-bce-3000.geojson` |
| `skill/assets/hillshade/global-hillshade-4k.jpg` | `assets/maps/physical/hillshade/global-hillshade-4k.jpg` |
| `data/_legacy/resources/geography/coastline/*` | `assets/maps/physical/coastline/*` |
| `data/terrain-tiles/*` | `assets/maps/physical/terrain-tiles/*` |
