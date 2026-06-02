# 历史地图投影与对齐规范（强制）

制作或修改历史/地理课件地图时**必须先读本文**。违反下列任一条会导致疆域 GeoJSON、城市点与底图**系统性错位**（高纬度更明显）。

权威运行时：`teachany-courseware` 仓库 `assets/scripts/teachany-historical-map.js`（v2.7+）。

---

## 1. 投影（CRS）

| 项 | 规定 |
| --- | --- |
| 地图引擎 | Leaflet，**默认 CRS = EPSG:3857（Web Mercator）** |
| 禁止 | 在 Mercator 地图上铺等距圆柱（equirectangular）静态大图 |
| 禁止 | `L.CRS.EPSG4326` 容器 + Mercator XYZ 瓦片混用 |
| 禁止 | 课件 `index.html` 内手写 Leaflet 初始化（必须用声明式模块） |

**根因说明**：仓库内 `physical/hillshade/global-color-hillshade-*.jpg` 为 **2:1 等距圆柱** 栅格。若用 `L.imageOverlay(url, [[-90,-180],[90,180]])` 铺在默认 Leaflet 地图上，底图与 **WGS84 GeoJSON 疆域** 不在同一投影，北纬 40° 以上可肉眼看出错位。

---

## 2. 底图（必须与 GeoJSON 同投影链）

**唯一合规底图方式**：`L.tileLayer` **XYZ 瓦片**（Web Mercator）。

标准模块默认双层（均由 `teachany-historical-map.js` 加载，课件 **不要** 重复写）：

1. **Carto dark_nolabels** — 深色无标注底图  
2. **Esri World_Shaded_Relief** — 半透明地形浮雕（`cfg.terrain !== false` 时，默认开启）

| 已废弃 | 替代 |
| --- | --- |
| `config.hillshade: true` 或路径字符串 | 删除；改用默认 `terrain: true`（可省略） |
| `L.imageOverlay(hillshade.jpg, [[-90,-180],[90,180]])` | 禁止 |
| ECharts `graphic: { type: 'image' }` 铺底 | 禁止 |

仓库中的 hillshade JPG **仅** 保留作印刷/PDF/离线素材，**不得** 写入 `data-teachany-map-config`。

若必须离线全球静态地形底图：须 `gdal2tiles.py --profile=mercator` 切成 Mercator 瓦片目录，再以 `L.tileLayer` 引用（非本模块默认路径）。

---

## 3. 数据坐标格式

### 3.1 疆域 GeoJSON（`eras[].file`）

- 坐标系：**WGS84**
- GeoJSON 坐标顺序：**`[经度, 纬度]`**（标准 GeoJSON）
- 路径：`chrono-cn/` 或 `chrono-world/` 下文件名，或课件 `assets/maps/` 相对路径
- 由 `L.geoJSON` 加载；Leaflet 自动投影到 EPSG:3857，**无需** 手工换算

### 3.2 城市标注（`eras[].cities`）

每项数组：**`[纬度, 经度, 中文名, 英文名, 说明]`**

```json
[34.27, 108.95, "长安", "Chang'an", "唐都"]
```

与 GeoJSON 的 `[lng,lat]` **顺序相反**——按模块约定书写，勿对调。

### 3.3 视野：`center` / `zoom` / `fitBounds`

| 字段 | 格式 | 说明 |
| --- | --- | --- |
| `center` | `[纬度, 经度]` | 初始中心（无疆域层时的回退） |
| `zoom` | 数字 | 初始缩放 |
| `fitBounds` | `[[南纬, 西经], [北纬, 东经]]` | **西南角 → 东北角**，Leaflet `L.latLngBounds` 约定 |

示例（中国史教学区）：

```json
"fitBounds": [[18, 72], [52, 140]]
```

示例（地中海文明）：

```json
"fitBounds": [[25, -15], [48, 45]]
```

**禁止** 长期停在 `[0, 0]` 全球默认视野。切换朝代后模块会对当前疆域 `getBounds().pad(0.08)` 再 `fitBounds`。

---

## 4. 声明式接入（课件 HTML）

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="../../assets/scripts/teachany-historical-map.css">
<script src="../../assets/scripts/teachany-historical-map.js" defer></script>

<div data-teachany-map="my-map"
     data-teachany-map-scope="china"
     data-teachany-map-title="朝代疆域">
  <script type="application/json" data-teachany-map-config>
  {
    "eras": [ { "id": "tang", "label": "唐", "file": "tang-dynasty.geojson", "fill": "#dc2626", "stroke": "#991b1b", "cities": [] } ],
    "center": [34, 108],
    "zoom": 4,
    "fitBounds": [[18, 72], [52, 140]]
  }
  </script>
</div>
```

- `data-teachany-map-scope`：`china` | `world` | `custom`（决定 GeoJSON 远程回退目录）
- 资源加载顺序：**本地 `./assets/maps/` → teachany.cn → GitHub**（`apply-historical-maps.py` / 模块内 `REMOTE_MAP_BASES`）

---

## 5. 分页课件（slide-v2）对齐

地图放在 `.ta-slide` 内时：

1. 翻页后模块监听 `teachany-slide-change`，对可见地图执行 `invalidateSize`
2. 再按当前疆域或 `fitBounds` **refit**（约 160ms 防抖）

制作时建议：**一屏一图**（`map-slide-only` 类可选），避免与长文挤在同一 slide 导致首次尺寸为 0。

---

## 6. 制作脚本与质检

| 动作 | 命令 / 文件 |
| --- | --- |
| 查疆域文件 | `python3 scripts/find-map.py 唐` |
| 注入标准段 | `python3 scripts/apply-historical-maps.py`（**不得** 写入 `hillshade`） |
| 模板 | `templates/map-section-template.html` |
| 发布前 | `validate-courseware.py` 对 `"hillshade"` 报错 |

---

## 7. 自检清单（发布前必过）

- [ ] `index.html` 含 `data-teachany-map` + `teachany-historical-map.js`
- [ ] config **无** `hillshade` 字段
- [ ] config 含 `fitBounds` 或 eras 内有效 GeoJSON（模块可自动 fit）
- [ ] 浏览器：切换朝代时疆域与底图边界重合（抽查北纬 35°、45° 两点）
- [ ] slide-v2：翻页进入地图页后无空白条、无偏移条带

---

## 8. 常见错误对照

| 现象 | 原因 | 修复 |
| --- | --- | --- |
| 疆域整体偏北/偏南 | hillshade `imageOverlay` + Mercator | 删 `hillshade`，用模块默认 XYZ |
| 仅高纬度错位 | 两种投影混用 | 同上 |
| 翻页后地图挤扁 | 容器尺寸未刷新 | 用 slide-v2 + 模块 `invalidateSize` |
| 城市点在海上 | `cities` 写成 `[lng,lat]` | 改为 `[lat,lng]` |

---

## 相关文档

- `topics/maps-and-3d.md` — 地图资源与 3D
- `RULES.md` **#21** — 硬规则摘要
- `teachany-courseware/references/packaging-distribution.md` v5.22 — 弃用 imageOverlay 的决策记录
