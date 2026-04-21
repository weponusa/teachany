# 3D 地形资源（DEM 数字高程模型）

## 一、资源说明

本目录存放用于地理和历史课件的 **3D 地形底图数据**，主要用于：
- **军事地理分析**：地形优势、战役布局、防御工事选址
- **经济地理分析**：交通线路规划、资源分布、城市选址
- **自然地理教学**：山脉走向、河流水系、地貌类型

## 二、数据来源

### 2.1 开源 DEM 数据源

| 数据源 | 分辨率 | 覆盖范围 | 许可证 | 下载地址 |
|:---|:---|:---|:---|:---|
| **SRTM** | 30m / 90m | 全球（60°N-56°S） | 公共领域 | https://earthexplorer.usgs.gov/ |
| **ASTER GDEM** | 30m | 全球 | 公共领域 | https://asterweb.jpl.nasa.gov/gdem.asp |
| **GMTED2010** | 250m / 1km | 全球 | 公共领域 | https://www.usgs.gov/coastal-changes-and-impacts/gmted2010 |
| **Mapbox Terrain-RGB** | 矢量瓦片 | 全球 | 商业（免费额度） | https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-rgb-v1/ |

### 2.2 推荐方案

**方案 A：在线瓦片服务（推荐用于课件）**
- 使用 Mapbox / MapTiler 的 Terrain-RGB 瓦片
- 无需下载大文件，按需加载
- 支持实时 3D 渲染

**方案 B：本地 DEM 文件**
- 下载特定区域的 SRTM/ASTER 数据
- 适合离线环境或特定区域深度分析
- 需要较大存储空间（中国全境 ~10GB）

## 三、3D 地形可视化库

| 库名 | 特点 | 学习曲线 | 推荐场景 |
|:---|:---|:---|:---|
| **Mapbox GL JS** | 原生支持3D地形，性能强 | 中等 | 通用地形可视化 |
| **Cesium** | 专业级3D地球，功能强大 | 较高 | 高级地理分析、军事模拟 |
| **Deck.gl** | 高性能数据可视化 | 中等 | 地形+数据叠加 |
| **Three.js + Terrain** | 自由度高，完全自定义 | 较高 | 自定义地形场景 |

## 四、数据结构（本地存储方式）

由于 DEM 文件体积较大，本目录采用**按需下载**策略：

```
terrain-3d/
├── README.md                    # 本文件
├── china-key-regions/           # 中国重点区域 DEM
│   ├── beijing-hebei.tif       # 京津冀（含长城）
│   ├── sichuan-basin.tif       # 四川盆地
│   ├── yangtze-delta.tif       # 长江三角洲
│   └── loess-plateau.tif       # 黄土高原
├── historical-battlefields/     # 历史战场地形
│   ├── chibi.tif               # 赤壁之战（长江流域）
│   ├── guandu.tif              # 官渡之战（河南）
│   └── changping.tif           # 长平之战（山西）
└── scripts/
    ├── download_srtm.sh        # SRTM 数据下载脚本
    └── convert_to_terrain.py   # DEM → Terrain-RGB 转换
```

**注意**：为节省空间，初始状态仅包含在线瓦片服务配置，不包含大体积 DEM 文件。

## 五、快速开始：在线 3D 地形地图

### 5.1 Mapbox GL JS（推荐）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
  <style>
    body { margin: 0; padding: 0; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    .control-panel {
      position: absolute; top: 10px; right: 10px;
      background: white; padding: 10px; border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id='map'></div>
  <div class="control-panel">
    <button onclick="toggleTerrain()">切换地形</button>
    <button onclick="toggle3D()">切换3D</button>
    <label>
      地形夸张倍数：
      <input type="range" min="0" max="2" step="0.1" value="1" 
             oninput="setExaggeration(this.value)">
    </label>
  </div>
  
  <script>
    // 注意：实际使用时需要申请 Mapbox Access Token
    // 免费额度：50,000次地图加载/月
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'; // 需替换为实际 Token
    
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/outdoors-v12', // 户外风格底图
      center: [108, 34], // 中国中心
      zoom: 5,
      pitch: 60, // 倾斜角度
      bearing: 0
    });
    
    map.on('load', () => {
      // 添加 3D 地形
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
      
      // 添加天空层
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0]
        }
      });
    });
    
    let terrainEnabled = true;
    function toggleTerrain() {
      terrainEnabled = !terrainEnabled;
      map.setTerrain(terrainEnabled ? { source: 'mapbox-dem', exaggeration: 1 } : null);
    }
    
    function toggle3D() {
      const pitch = map.getPitch();
      map.easeTo({ pitch: pitch === 0 ? 60 : 0, duration: 1000 });
    }
    
    function setExaggeration(value) {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: parseFloat(value) });
    }
  </script>
</body>
</html>
```

### 5.2 Cesium（专业级）

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
  <style>
    #cesiumContainer { width: 100%; height: 100vh; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  
  <script>
    // 需要申请 Cesium Ion Token（免费）
    Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_TOKEN';
    
    const viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: Cesium.createWorldTerrain({
        requestWaterMask: true,    // 显示水体
        requestVertexNormals: true // 显示光照
      }),
      baseLayerPicker: false,
      animation: false,
      timeline: false
    });
    
    // 飞到中国长城区域
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.5, 40.5, 50000), // 北京长城
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      }
    });
  </script>
</body>
</html>
```

## 六、教学场景示例

### 6.1 军事地理：长平之战地形分析

```javascript
// 场景：展示赵军被围困的地形劣势
map.on('load', () => {
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 }); // 夸张地形便于观察
  
  // 飞到长平战场（山西高平）
  map.flyTo({
    center: [112.92, 35.80], // 长平古战场
    zoom: 13,
    pitch: 60,
    bearing: 30,
    essential: true
  });
  
  // 标注关键地点
  const markers = [
    { name: '赵军营地', coords: [112.92, 35.81], color: '#ff4444' },
    { name: '秦军包围圈', coords: [112.93, 35.80], color: '#4444ff' },
    { name: '丹河峡谷（退路）', coords: [112.91, 35.79], color: '#888888' }
  ];
  
  markers.forEach(marker => {
    new mapboxgl.Marker({ color: marker.color })
      .setLngLat(marker.coords)
      .setPopup(new mapboxgl.Popup().setText(marker.name))
      .addTo(map);
  });
});
```

### 6.2 经济地理：京杭大运河与地形关系

```javascript
map.on('load', () => {
  // 加载运河线路数据（GeoJSON）
  map.addSource('grand-canal', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [116.40, 39.90], // 北京
          [117.20, 39.10], // 天津
          [117.00, 36.60], // 济南附近
          [118.80, 32.05], // 南京附近
          [120.15, 30.25]  // 杭州
        ]
      }
    }
  });
  
  // 绘制运河路线
  map.addLayer({
    id: 'canal-route',
    type: 'line',
    source: 'grand-canal',
    paint: {
      'line-color': '#0080ff',
      'line-width': 4,
      'line-dasharray': [2, 1]
    }
  });
  
  // 添加地形以显示运河如何利用地势
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 2 });
  
  // 飞行路线动画
  animateCamera([
    { center: [116.40, 39.90], zoom: 10 },
    { center: [117.00, 36.60], zoom: 9 },
    { center: [120.15, 30.25], zoom: 10 }
  ]);
});
```

### 6.3 自然地理：长江三峡地形剖面

```javascript
map.on('load', () => {
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 2 });
  
  // 飞到三峡
  map.flyTo({
    center: [110.98, 30.82], // 三峡大坝
    zoom: 12,
    pitch: 70,
    bearing: 90, // 侧视角度
    essential: true
  });
  
  // 标注三峡地标
  const landmarks = [
    { name: '瞿塘峡', coords: [109.57, 31.05] },
    { name: '巫峡', coords: [110.05, 31.07] },
    { name: '西陵峡', coords: [110.98, 30.82] },
    { name: '三峡大坝', coords: [111.00, 30.82] }
  ];
  
  landmarks.forEach(lm => {
    new mapboxgl.Marker()
      .setLngLat(lm.coords)
      .setPopup(new mapboxgl.Popup().setText(lm.name))
      .addTo(map);
  });
});
```

## 七、API Token 申请指南

### 7.1 Mapbox（推荐用于课件）

1. 访问 https://account.mapbox.com/
2. 注册账号（免费）
3. 创建 Access Token
4. **免费额度**：
   - 50,000次地图加载/月
   - 无限制地形请求
   - 足够用于教学课件

### 7.2 Cesium Ion

1. 访问 https://cesium.com/ion/
2. 注册账号（免费）
3. 创建 Access Token
4. **免费额度**：
   - 5GB 资源存储
   - 无限制地形访问
   - 适合专业地理分析

### 7.3 MapTiler（备选方案）

1. 访问 https://www.maptiler.com/
2. 注册账号（免费）
3. 获取 API Key
4. **免费额度**：
   - 100,000次瓦片请求/月

## 八、本地 DEM 数据下载（高级用法）

如需离线环境或深度分析，可下载本地 DEM 数据：

### 8.1 下载 SRTM 数据

```bash
# 使用 GDAL 工具下载特定区域
# 安装 GDAL：brew install gdal (macOS) 或 apt install gdal-bin (Linux)

# 下载中国区域（以四川盆地为例）
gdal_translate -projwin 102 32 110 28 \
  /vsicurl/https://data.opentopography.org/raster/SRTM_GL1/SRTM_GL1_srtm.vrt \
  sichuan-basin.tif
```

### 8.2 转换为 Terrain-RGB 瓦片

```bash
# 使用 rio-rgbify 工具转换
pip install rio-rgbify

# 转换 DEM 为 Mapbox Terrain-RGB 格式
rio rgbify -b -10000 -i 0.1 sichuan-basin.tif sichuan-terrain-rgb.tif
```

### 8.3 生成 MBTiles（离线瓦片）

```bash
# 使用 gdal2tiles 生成瓦片
gdal2tiles.py -z 5-12 sichuan-terrain-rgb.tif ./tiles/
```

## 九、历史战役地形可视化案例

### 案例：赤壁之战（长江水文+地形）

```javascript
// 展示曹军为何在赤壁战败（地形+水文）
map.on('load', () => {
  // 1. 加载3D地形
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  
  // 2. 标注关键地点
  const chibiMarkers = [
    { name: '曹军营地（北岸）', coords: [113.53, 29.72], color: 'blue' },
    { name: '孙刘联军（南岸）', coords: [113.51, 29.69], color: 'red' },
    { name: '火攻起点', coords: [113.52, 29.70], color: 'orange' }
  ];
  
  chibiMarkers.forEach(m => {
    new mapboxgl.Marker({ color: m.color })
      .setLngLat(m.coords)
      .setPopup(new mapboxgl.Popup().setHTML(`
        <strong>${m.name}</strong><br>
        ${m.name === '曹军营地（北岸）' ? 
          '地形劣势：背靠山地，船只密集停泊，易受火攻' : 
          '地形优势：南岸开阔，便于撤退'}
      `))
      .addTo(map);
  });
  
  // 3. 绘制火攻路线
  map.addSource('fire-attack', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [113.52, 29.70], // 起点
          [113.53, 29.71], // 中点
          [113.53, 29.72]  // 曹军营地
        ]
      }
    }
  });
  
  map.addLayer({
    id: 'fire-route',
    type: 'line',
    source: 'fire-attack',
    paint: {
      'line-color': '#ff4400',
      'line-width': 3,
      'line-dasharray': [2, 1]
    }
  });
  
  // 4. 设置视角
  map.flyTo({
    center: [113.52, 29.71],
    zoom: 13,
    pitch: 60,
    bearing: 180, // 从南向北看
    essential: true
  });
});
```

## 十、性能优化建议

### 10.1 课件中使用建议

| 场景 | 推荐方案 | 理由 |
|:---|:---|:---|
| **通用地形展示** | Mapbox GL JS + 在线瓦片 | 轻量、快速、无需配置 |
| **高级地形分析** | Cesium + 在线瓦片 | 功能强大、适合专业场景 |
| **离线环境** | 预下载 MBTiles + Mapbox GL JS | 不依赖网络 |
| **低带宽环境** | 降低地形夸张倍数、限制缩放级别 | 减少数据传输 |

### 10.2 渲染性能优化

```javascript
// 限制地形细节级别
map.addSource('mapbox-dem', {
  type: 'raster-dem',
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
  tileSize: 512,
  maxzoom: 12  // 限制最大缩放级别，减少数据量
});

// 按需加载地形
let terrainEnabled = false;
document.getElementById('enable-terrain').addEventListener('click', () => {
  if (!terrainEnabled) {
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
    terrainEnabled = true;
  }
});
```

## 十一、注意事项

### 11.1 版权与授权

- ✅ SRTM、ASTER GDEM：公共领域，教育用途无限制
- ✅ Mapbox、Cesium：商业服务，免费额度内教育使用合规
- ❌ 禁止：将第三方地形数据重新分发或商业使用

### 11.2 性能考虑

- 3D 地形渲染对 GPU 要求较高，建议在配置较好的设备上使用
- 移动端浏览器可能性能受限，建议提供 2D 降级方案
- 地形夸张倍数不宜过大（推荐 1-2 倍），否则失真严重

### 11.3 教学适配

- 军事地理课：夸张倍数 1.5-2，突出地形优劣
- 经济地理课：夸张倍数 1-1.5，保持真实比例
- 自然地理课：夸张倍数 2-3，强化地貌特征

---

**更新日期**: 2026-04-11  
**维护**: TeachAny 技能开发团队
