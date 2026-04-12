# 🗺️ Geography Data | 地理数据资源库

## 目的

为历史和地理课件提供预制地图资源，包括：
- 行政区划数据（省/市/县三级）
- 三维地形数据（DEM 高程）
- 历史地图数据（各朝代疆域）

## 数据来源

### 1. 现代行政区划

| 数据源 | 格式 | 精度 | 许可证 |
|:---|:---|:---|:---|
| [DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector) | GeoJSON | 省/市/县三级 | 开源 |
| [china-geojson](https://github.com/yezongyang/china-geojson) | GeoJSON | 省级 | MIT |

### 2. 历史地图

| 数据源 | 内容 | 来源 |
|:---|:---|:---|
| [CHGIS](https://yugong.fudan.edu.cn/CHGIS/) | 中国历史地理信息系统 | 复旦大学 |
| [chinese_historical_map](https://github.com/imbian/chinese_historical_map) | 《中国历史地图集》数字化 | 谭其骧主编 |
| [左图右史](https://history-map.osgeo.cn/) | 历史地图可视化 | OSGeo |

### 3. 地形数据

| 数据源 | 分辨率 | 格式 | 覆盖范围 |
|:---|:---|:---|:---|
| SRTM DEM | 30m | GeoTIFF | 全球 |
| ASTER GDEM | 30m | GeoTIFF | 全球 |
| China 1km DEM | 1km | GeoJSON/Raster | 中国 |

## 目录结构

```
geography/
├── README.md                       # 本文件
├── modern-china/                   # 现代中国地图
│   ├── provinces.geojson           # 省级行政区划
│   ├── cities.geojson              # 市级行政区划
│   ├── counties/                   # 县级行政区划（按省分文件）
│   │   ├── beijing.geojson
│   │   ├── shanghai.geojson
│   │   └── ...
│   ├── terrain-3d.geojson          # 三维地形数据（简化版）
│   └── relief-shading.png          # 地形晕渲图
│
├── historical-china/               # 历史地图
│   ├── qin-dynasty.geojson         # 秦朝疆域（前221-前206）
│   ├── han-dynasty.geojson         # 汉朝疆域（前202-220）
│   ├── tang-dynasty.geojson        # 唐朝疆域（618-907）
│   ├── song-dynasty.geojson        # 宋朝疆域（960-1279）
│   ├── yuan-dynasty.geojson        # 元朝疆域（1271-1368）
│   ├── ming-dynasty.geojson        # 明朝疆域（1368-1644）
│   ├── qing-dynasty.geojson        # 清朝疆域（1644-1912）
│   └── dynasties-timeline.json     # 朝代时间线与疆域变化
│
├── world/                          # 世界地图
│   ├── countries.geojson           # 世界各国边界
│   ├── continents.geojson          # 七大洲
│   └── major-cities.geojson        # 世界主要城市
│
└── templates/                      # 地图模板
    ├── china-base-map.html         # 中国底图模板
    ├── historical-map.html         # 历史地图模板
    └── terrain-3d.html             # 三维地形模板
```

## 使用方法

### 1. 在课件中调用地图

```javascript
// 在 HTML 课件中引用地图数据
fetch('data/geography/modern-china/provinces.geojson')
  .then(response => response.json())
  .then(data => {
    // 使用 D3.js 或 ECharts 绘制地图
    drawMap(data);
  });
```

### 2. 历史课件示例

```javascript
// 展示唐朝疆域
fetch('data/geography/historical-china/tang-dynasty.geojson')
  .then(response => response.json())
  .then(data => {
    // 绘制唐朝版图
    drawHistoricalMap(data, {
      title: '唐朝疆域（618-907）',
      color: '#FFD700',
      capital: { name: '长安', coords: [108.9, 34.3] }
    });
  });
```

### 3. 地理课件示例

```javascript
// 展示中国三维地形
fetch('data/geography/modern-china/terrain-3d.geojson')
  .then(response => response.json())
  .then(data => {
    // 使用 Three.js 或 ECharts GL 渲染三维地形
    render3DTerrain(data);
  });
```

## 数据更新计划

### Phase 1: 基础地图（进行中）
- [x] 省级行政区划
- [ ] 市级行政区划
- [ ] 县级行政区划（部分省份）
- [ ] 三维地形数据（简化版）

### Phase 2: 历史地图（待执行）
- [ ] 秦汉唐宋元明清七大朝代
- [ ] 朝代疆域变化动画数据
- [ ] 重要历史事件地点标注

### Phase 3: 世界地图（待执行）
- [ ] 世界各国边界
- [ ] 七大洲地形
- [ ] 重要地理事件地点

## 数据格式规范

### GeoJSON 标准格式

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "北京市",
        "code": "110000",
        "capital": "北京",
        "area": 16410.54,
        "population": 21893095
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[116.4, 39.9], ...]]
      }
    }
  ]
}
```

### 历史地图附加字段

```json
{
  "properties": {
    "name": "唐朝",
    "dynasty": "Tang Dynasty",
    "period": "618-907",
    "capital": "长安（今西安）",
    "max_extent_year": 669,
    "description": "唐朝是中国历史上统一时间最长..."
  }
}
```

## 技术栈

- **地图库**：D3.js、ECharts、Leaflet
- **三维渲染**：Three.js、ECharts GL
- **数据格式**：GeoJSON、TopoJSON
- **坐标系**：GCJ-02（国测局坐标）

## 版权说明

- 现代地图数据来自开源社区，遵循各自的开源协议
- 历史地图数据基于《中国历史地图集》（谭其骧主编）
- 仅用于教育目的，不得商业使用

## 贡献指南

如需添加新的地图数据：
1. 确保数据格式为 GeoJSON
2. 包含必要的属性字段（name, code, description）
3. 标注数据来源和许可证
4. 提供使用示例
