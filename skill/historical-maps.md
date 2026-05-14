# 历史地图规范（精简版）

历史/地理课件必须用 TeachAny 标准地图模块，不自造地图。

## 最小流程

1. 查资源：`python3 scripts/find-map.py <keyword>`。
2. 复制资源：`python3 scripts/find-map.py --copy <file> <course>/assets/maps/`。
3. HTML 引入 Leaflet 与 `teachany-historical-map.{css,js}`。
4. 用 `data-teachany-map-config` 配置 eras、center、zoom、fitBounds。
5. 验证本地和线上资源可访问。

## 禁止

- 直接依赖在线 XYZ 瓦片作为唯一底图。
- 用 ECharts/手写 SVG/Canvas 方框冒充历史地图。
- hillshade bounds 设成局部区域导致投影错位。
