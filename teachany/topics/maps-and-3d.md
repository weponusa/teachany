# 地图与 3D 主题指南

## 历史/地理地图（必读）

**投影、底图、坐标格式、fitBounds、分页对齐** 的强制规范见：

**→ [`historical-maps-projection.md`](historical-maps-projection.md)**

摘要（不可仅凭摘要制作，以专文为准）：

- CRS：**EPSG:3857**（Leaflet 默认 Web Mercator）
- 底图：标准模块内 **Carto XYZ + Esri 地形瓦片**；**禁止** `hillshade` JPG + `L.imageOverlay`
- 声明式：`data-teachany-map` + `teachany-historical-map.js`，禁止课件内手写 Leaflet
- GeoJSON：`[lng, lat]`；城市：`[lat, lng, …]`；`fitBounds`：`[[南纬, 西经], [北纬, 东经]]`

模板：`templates/map-section-template.html`（v8.0）

## 地图资源

地图库在 `teachany-courseware` 仓库。运行时按「本地 → teachany.cn → GitHub」获取；制作时可用 `find-map.py` 按需下载。

```bash
python3 "$TEACHANY_SKILL/scripts/find-map.py" 唐
python3 scripts/find-map.py --era 1500
python3 scripts/find-map.py --base terrain-tiles   # 查瓦片类资源说明
python3 scripts/find-map.py --copy <file> <course-dir>/assets/maps/
```

`physical/hillshade/*.jpg` 仍可在仓库中作**静态素材**，**不得** 写入课件 `data-teachany-map-config`（已废弃字段 `hillshade`）。

注入脚本：

```bash
python3 scripts/apply-historical-maps.py   # 不写入 hillshade；默认 terrain: true
```

## 地理课补充

- 涉及面积、距离、方向时，在正文中标注**投影变形**提示（麦卡托高纬度拉伸等）。
- 非历史疆域类专题图若用 ECharts，仅限**纯区划填色、无地形底图**；一旦叠加地形/疆域边界，改用标准历史地图模块。

## 3D / Terrain

- 3D 不是所有课件必需项；只有二维无法表达空间关系时才启用 3D。
- 3D 组件必须有明确学习任务、可调参数和反馈，不做装饰。
- 二维地形观感由标准模块 **Esri World_Shaded_Relief 瓦片** 提供，与 GeoJSON 同投影，无需 MapLibre 即可满足多数历史课。

## PPTX

TeachAny 默认交付互动 HTML。仅用户明确要求 PPTX 时，才从 HTML 派生展示版讲义；PPTX 不替代互动课件。
