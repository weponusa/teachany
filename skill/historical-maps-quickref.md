# 历史/地理地图快速指南

1. 先查地图库：
   ```bash
   python3 scripts/find-map.py 唐
   python3 scripts/find-map.py --era 1500
   python3 scripts/find-map.py --base hillshade
   ```
2. 复制资源：
   ```bash
   python3 scripts/find-map.py --copy 010-tang-dynasty.geojson community/<id>/assets/maps/
   ```
3. 页面使用标准地图模块，不手写 Leaflet/ECharts 地图实现。
4. `hillshade.jpg` 使用 `physical/hillshade/global-color-hillshade-2k.jpg`，bounds 固定为 `[[-90,-180],[90,180]]`，再 `fitBounds` 到教学区域。
5. 地理课件标注投影类型和面积变形提示。

完整旧版说明已移至 Git history；当前执行以 `SKILL.md` 和 `RULES.md` 为准。
