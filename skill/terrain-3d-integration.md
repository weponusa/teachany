# 3D / Terrain 集成（精简版）

只在地理、地形、工程空间概念确有需要时启用。

规则：
- 快速模式不强制 3D。
- 完整模式优先使用轻量 SVG/Canvas/Leaflet；3D 仅用于解释二维无法表达的空间关系。
- 地形底图先走 `scripts/find-map.py --base hillshade`。
- 任何 3D 组件必须有明确学习任务、可操作参数和反馈，不做装饰。
