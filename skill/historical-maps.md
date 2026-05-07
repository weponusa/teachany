# 📜 历史地理课件地图使用规范（TeachAny · v7.9.4 唯一权威）

> ⚠️ **AI 必读**：本文档是历史/地理类课件**唯一**地图技术路线。所有早于 v7.9.4 的方案（v7.0 在线 CartoDB/Esri 瓦片、v7.2 本地 `data/maps/physical/` 瓦片）已**全部废弃**。
>
> 如需快速上手 HTML 模板：见 `historical-maps-quickref.md`。
> 如需修改技术细节：本文档为唯一权威，请勿引用 v7.0 / v7.2 旧方案。

---

## 一、唯一标准（v7.9.4 强制）

历史/地理课件**必须且只能**通过 `scripts/teachany-historical-map.{css,js}` 标准模块渲染地图。

⛔ **严禁自造地图实现**，包括但不限于：
- 自行手写 `L.tileLayer(...)` 在线瓦片调用（CartoDB / Esri / OpenStreetMap 等）
- 自行手写 `L.tileLayer(...)` 本地瓦片调用（v7.2 旧方案的 `./data/maps/physical/` 等）
- 自行手写 ECharts geo 组件
- 自行手写 Canvas/SVG/D3 地图
- 直接写 `new L.Map()` 而绕过 `data-teachany-map` 声明式标记

⛔ **严禁省略 `hillshade.jpg` 全球彩色阴影地形底图**——地图会变成"暗蓝空地"。

⛔ **严禁直接 `fetch('../../skill/assets/...')`**——GitHub Pages 部署后 404。GeoJSON 必须复制到课件本地 `assets/maps/`。

---

## 二、唯一调用方式（4 步）

详细 HTML 模板见 `historical-maps-quickref.md`。简要 4 步：

1. **复制资产到课件本地**：
   ```bash
   mkdir -p <课件目录>/assets/maps/
   cp skill/assets/historical-china/<朝代>-dynasty.geojson <课件目录>/assets/maps/
   cp skill/assets/hillshade/global-color-hillshade-2k.jpg <课件目录>/assets/maps/hillshade.jpg
   ```

2. **`<head>` 引入 3 行**：
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
   <link rel="stylesheet" href="../../scripts/teachany-historical-map.css">
   ```

3. **`</body>` 前 1 行**：
   ```html
   <script src="../../scripts/teachany-historical-map.js" defer></script>
   ```

4. **课件正文写声明式标记**：
   ```html
   <div data-teachany-map="my-map"
        data-teachany-map-scope="china"
        data-teachany-map-title="标题">
     <script type="application/json" data-teachany-map-config>
     {
       "eras": [
         {
           "id": "qin",
           "label": "秦",
           "file": "qin-dynasty.geojson",
           "fill": "#6366f1",
           "stroke": "#4f46e5",
           "desc": "描述",
           "cities": [[34.27, 108.95, "咸阳", "Xianyang", "秦都"]]
         }
       ],
       "center": [34, 108],
       "zoom": 4,
       "fitBounds": [[18, 72], [52, 140]]
     }
     </script>
   </div>
   ```

模块自动渲染：朝代切换按钮 + 彩色阴影地形底图 + 悬停金黄高亮 + 点击红色城市 popup + 时代说明面板 + 图例。

---

## 三、批量注入工具

如果一次性需要为多个课件注入地图，使用：

```bash
python3 scripts/apply-historical-maps.py
```

读取 `scripts/historical-maps-manifest.json`，自动完成：
- 注入 `<head>` 引用 + `<body>` 末尾 script
- 复制 geojson + hillshade 到课件本地 `assets/maps/`
- 在指定 section 插入 `<div data-teachany-map>` 标记

---

## 四、可用资产清单

### 4.1 中国历史朝代 GeoJSON

位于 `skill/assets/historical-china/`：

| 文件 | 朝代 | 时间 |
|---|---|---|
| `qin-dynasty.geojson` | 秦 | 前 221–前 207 |
| `west-han-dynasty.geojson` | 西汉 | 前 202–8 |
| `east-han-dynasty.geojson` | 东汉 | 25–220 |
| `three-kingdoms-dynasty.geojson` | 三国 | 220–280 |
| `northern-southern-dynasty.geojson` | 南北朝 | 420–589 |
| `sui-dynasty.geojson` | 隋 | 581–618 |
| `tang-dynasty.geojson` | 唐 | 618–907 |
| `north-song-dynasty.geojson` | 北宋 | 960–1127 |
| `south-song-dynasty.geojson` | 南宋 | 1127–1279 |
| `liao-dynasty.geojson` | 辽 | 916–1125 |
| `jin-jurchen-dynasty.geojson` | 金 | 1115–1234 |
| `yuan-dynasty.geojson` | 元 | 1271–1368 |
| `ming-dynasty.geojson` | 明 | 1368–1644 |
| `qing-dynasty.geojson` | 清 | 1636–1912 |

### 4.2 世界历史时段 GeoJSON

位于 `skill/assets/historical-world/`，覆盖 BCE 3000 到 CE 2000，共 22 个时间切片（每 100-200 年一个）。

文件命名：`bce-3000.geojson` … `ce-2000.geojson`。

### 4.3 全球底图

`skill/assets/hillshade/global-color-hillshade-2k.jpg`（205 KB）—— 必须复制到每个课件本地为 `assets/maps/hillshade.jpg`，由标准模块通过 `L.imageOverlay` 叠加到地图上作为彩色阴影地形底图。

> **关于投影**：hillshade.jpg 是 equirectangular（EPSG:4326）投影，在 Web Mercator 地图上叠加会有高纬度拉伸，但在 `opacity:0.55` 半透明模式下不影响教学（主要空间信息由 GeoJSON 疆域承载）。此方案在标准模块中已固化，无需 AI 干预。

---

## 五、3 张 AI 插图基线（B-3a）

历史/地理课件除地图外，**必须再补 ≥ 3 张 AI 生成的中文插图**：

- **Hero / 引入段** 1 张：知识结构信息图（思维导图/概念图风格）
- **核心概念 / 建模段** 1 张：历史事件复原、地貌示意
- **拓展 / 总结段** 1 张：人物、遗迹、文化符号

用 `image_gen` 生成，保存到 `<课件>/assets/illustrations/`，HTML 用真实 `<img>` 引用。⚠️ Prompt 必须用**中文**，图中标注必须是中文。

---

## 六、违规自检清单

发布前 AI 自检：

- [ ] HTML 中**没有** `L.tileLayer(...)` 直接调用？
- [ ] HTML 中**没有** `new L.Map(...)` 直接调用？
- [ ] HTML 中**没有** `echarts.geo` / `echarts.geoMap` 调用？
- [ ] `<head>` 已引入 leaflet.css + leaflet.js + teachany-historical-map.css？
- [ ] `</body>` 前已引入 teachany-historical-map.js（带 `defer`）？
- [ ] 课件本地 `assets/maps/` 含至少 1 个 `*.geojson` + `hillshade.jpg`？
- [ ] 课件中至少 1 个 `<div data-teachany-map="...">` 声明？
- [ ] 已生成 ≥ 3 张中文 AI 插图？

任一项不通过 → Gate 直接判定历史/地理课件不通过。

---

## 七、版本变更说明

| 版本 | 状态 | 技术路线 |
|---|---|---|
| v7.0 | ❌ **已废弃** | 在线 CartoDB Dark + Esri arcgisonline 瓦片 |
| v7.2 | ❌ **已废弃** | 本地 `data/maps/physical/terrain-tiles/` 瓦片 |
| **v7.9.4** | ✅ **当前唯一权威** | 标准模块 `teachany-historical-map.js` + `assets/maps/<朝代>.geojson` + `hillshade.jpg` |

---

> 文档版本：v7.9.4 · 唯一权威 · 替代所有 v7.0 / v7.2 旧规范
