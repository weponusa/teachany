# 3D 地形功能集成指南（TeachAny 技能）

## 一、何时使用 3D 地形

### 1.1 强制使用场景（MUST）

以下场景**必须使用 3D 地形底图**，不能仅靠 2D 地图或文字描述：

| 学科 | 场景类型 | 典型知识点 | 地形作用 |
|:---|:---|:---|:---|
| **历史** | 军事战役分析 | 长平之战、赤壁之战、淝水之战 | 展示地形优劣对战局的决定性影响 |
| **历史** | 古代交通路线 | 丝绸之路、茶马古道、蜀道 | 解释"蜀道难，难于上青天"的地理原因 |
| **历史** | 防御工程选址 | 长城、函谷关、剑门关 | 理解"一夫当关，万夫莫开"的地形依据 |
| **地理** | 河流地貌 | 长江三峡、雅鲁藏布大峡谷、黄河壶口瀑布 | 观察河流侵蚀与峡谷形成 |
| **地理** | 山地地貌 | 喜马拉雅山脉、黄土高原、云贵高原 | 理解板块运动、水土流失 |
| **地理** | 城市选址 | 山地城市（重庆）、河谷城市（兰州） | 分析地形对城市布局的影响 |
| **地理** | 交通规划 | 川藏公路、青藏铁路、京杭大运河 | 理解工程如何克服地形障碍 |

### 1.2 推荐使用场景（SHOULD）

以下场景**推荐使用 3D 地形**，可显著提升教学效果：

- 农业地理：梯田分布、等高线耕作
- 气候地理：迎风坡/背风坡、地形雨
- 区域地理：盆地特征、平原范围
- 历史地理：都城选址、边境线划分

### 1.3 不推荐场景（AVOID）

以下场景**不适合 3D 地形**：

- 纯概念讲解（如"什么是等高线"）
- 政治地图（行政区划无需地形）
- 抽象地理模型（地球自转、公转）

---

## 二、3D 地形实现方案

### 方案选择矩阵（无需 API Key 版本）

| 方案 | 适用场景 | 优点 | 缺点 | API要求 |
|:---|:---|:---|:---|:---|
| **ECharts + GeoJSON**（推荐） | 行政区划、历史疆域、散点分布 | 完全本地、无需配置、性能优秀 | 仅支持 2D/2.5D | ❌ 无需 |
| **Leaflet + OpenStreetMap** | 实景地图、路线规划、地标标注 | 免费瓦片、不需 Token、成熟稳定 | 需联网加载瓦片 | ❌ 无需 |
| **Leaflet + 本地瓦片** | 完全离线环境、学校内网 | 不依赖外网 | 需预下载数据（~5-10GB） | ❌ 无需 |
| **Cesium（备选）** | 高级地理分析、全球视角 | 真 3D 渲染、功能强大 | 学习曲线高、性能要求高 | ❌ 无需 |

### 推荐方案（默认）

**方案 1：ECharts + GeoJSON**（80%场景适用，完全本地）

- ✅ **零依赖**：无需任何 API Key
- ✅ **完全本地**：GeoJSON 文件已预置在 `data/geography/` 目录
- ✅ **性能优秀**：渲染速度快，低配置设备也流畅
- ✅ **功能丰富**：支持区域填充、散点图、路线图、热力图
- ⚠️ **限制**：仅支持 2D 和伪 3D（geo3D），无真实地形起伏

**方案 2：Leaflet + OpenStreetMap**（需要实景地图时使用）

- ✅ **免费瓦片**：OpenStreetMap 提供免费全球底图
- ✅ **无需 Token**：直接使用，零配置
- ✅ **实景展示**：真实卫星图、街道地图
- ⚠️ **需联网**：首次加载需下载瓦片（可缓存）

---

## 三、标准实现模式

### 3.1 基础模板 A：ECharts 地图（推荐，无需 API）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ECharts 地图课件</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id='map'></div>
  
  <script>
    // 1. 初始化 ECharts
    const chart = echarts.init(document.getElementById('map'));
    
    // 2. 加载 GeoJSON（从本地或 data 目录）
    fetch('../data/geography/modern-china/provinces.geojson')
      .then(res => res.json())
      .then(geoJson => {
        // 3. 注册地图
        echarts.registerMap('china', geoJson);
        
        // 4. 配置地图
        chart.setOption({
          title: { text: '中国省级行政区划', left: 'center' },
          tooltip: { trigger: 'item', formatter: '{b}' },
          geo: {
            map: 'china',
            roam: true,  // 可缩放、平移
            itemStyle: {
              areaColor: '#e0f2f1',
              borderColor: '#26a69a',
              borderWidth: 1
            },
            emphasis: {
              itemStyle: { areaColor: '#ffab91' },
              label: { show: true, color: '#fff' }
            }
          }
        });
      });
  </script>
</body>
</html>
    });
  </script>
</body>
</html>
```

### 3.2 军事地理模板（战役分析）

```javascript
map.on('load', () => {
  // 1. 启用3D地形（夸张倍数1.5-2）
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });
  
  // 2. 飞到战场位置
  map.flyTo({
    center: [112.92, 35.80], // 长平战场坐标
    zoom: 13,
    pitch: 70,
    bearing: 30,
    essential: true,
    duration: 2000
  });
  
  // 3. 标注关键地点
  const locations = [
    { 
      coords: [112.92, 35.81], 
      name: '赵军营地', 
      color: '#ff4444',
      desc: '地势低洼，被秦军包围'
    },
    { 
      coords: [112.93, 35.80], 
      name: '秦军阵地', 
      color: '#4444ff',
      desc: '占据周围高地，形成合围'
    },
    { 
      coords: [112.91, 35.79], 
      name: '丹河峡谷', 
      color: '#888888',
      desc: '赵军退路被截断'
    }
  ];
  
  locations.forEach(loc => {
    // 创建自定义标记
    const el = document.createElement('div');
    el.style.width = '15px';
    el.style.height = '15px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = loc.color;
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
    
    // 添加弹窗
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<strong>${loc.name}</strong><br>${loc.desc}`);
    
    new mapboxgl.Marker({ element: el })
      .setLngLat(loc.coords)
      .setPopup(popup)
      .addTo(map);
  });
  
  // 4. 添加教学说明层
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `
    position: absolute; top: 20px; left: 20px;
    background: white; padding: 15px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    max-width: 300px;
  `;
  infoDiv.innerHTML = `
    <h3>长平之战地形分析</h3>
    <p><strong>赵军劣势：</strong></p>
    <ul>
      <li>背靠太行山，退路有限</li>
      <li>处于低洼地带，易受攻击</li>
      <li>粮道被秦军截断</li>
    </ul>
    <p><strong>秦军优势：</strong></p>
    <ul>
      <li>占据周围高地，居高临下</li>
      <li>控制丹河以西，形成包围</li>
    </ul>
  `;
  map.getContainer().appendChild(infoDiv);
});
```

### 3.3 经济地理模板（交通线路）

```javascript
map.on('load', () => {
  // 1. 启用地形（夸张倍数稍大，突出地势变化）
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 2 });
  
  // 2. 绘制京杭大运河路线
  map.addSource('canal-route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [116.40, 39.90], // 北京
          [117.20, 39.10], // 天津
          [117.00, 36.60], // 济南
          [118.80, 32.05], // 扬州
          [120.15, 30.25]  // 杭州
        ]
      }
    }
  });
  
  map.addLayer({
    id: 'canal-line',
    type: 'line',
    source: 'canal-route',
    paint: {
      'line-color': '#0080ff',
      'line-width': 5,
      'line-dasharray': [2, 1]
    }
  });
  
  // 3. 飞行动画（沿运河从北到南）
  const waypoints = [
    { center: [116.40, 39.90], zoom: 10, label: '北京通惠河' },
    { center: [117.00, 36.60], zoom: 9, label: '山东运河段' },
    { center: [120.15, 30.25], zoom: 10, label: '杭州终点' }
  ];
  
  let currentIndex = 0;
  function animateFlight() {
    if (currentIndex >= waypoints.length) {
      currentIndex = 0;
    }
    
    const wp = waypoints[currentIndex];
    map.flyTo({
      center: wp.center,
      zoom: wp.zoom,
      pitch: 55,
      duration: 3000,
      essential: true
    });
    
    // 显示当前段落说明
    showInfo(wp.label);
    
    currentIndex++;
    setTimeout(animateFlight, 5000);
  }
  
  setTimeout(animateFlight, 1000);
});
```

### 3.4 自然地理模板（地貌观察）

```javascript
map.on('load', () => {
  // 1. 启用地形（高夸张倍数，突出地貌特征）
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
  
  // 2. 飞到黄土高原
  map.flyTo({
    center: [109.5, 36.5],
    zoom: 11,
    pitch: 70,
    bearing: 0,
    essential: true
  });
  
  // 3. 添加对比视角按钮
  const views = [
    { name: '俯视图', pitch: 0, bearing: 0 },
    { name: '侧视图', pitch: 70, bearing: 90 },
    { name: '3D旋转', pitch: 60, bearing: 180 }
  ];
  
  const controlDiv = document.createElement('div');
  controlDiv.style.cssText = `
    position: absolute; top: 20px; right: 20px;
    background: white; padding: 10px; border-radius: 4px;
  `;
  
  views.forEach(view => {
    const btn = document.createElement('button');
    btn.textContent = view.name;
    btn.style.cssText = `
      display: block; width: 100%; margin-bottom: 5px;
      padding: 8px; border: 1px solid #ddd;
      background: white; cursor: pointer;
    `;
    btn.onclick = () => {
      map.easeTo({
        pitch: view.pitch,
        bearing: view.bearing,
        duration: 1000
      });
    };
    controlDiv.appendChild(btn);
  });
  
  map.getContainer().appendChild(controlDiv);
});
```

---

## 四、关键参数配置

### 4.1 地形夸张倍数（exaggeration）

| 倍数 | 适用场景 | 效果 | 示例 |
|:---:|:---|:---|:---|
| **0.5-1** | 真实地形、城市规划 | 接近真实比例，视觉平缓 | 现代交通路线规划 |
| **1-1.5** | 经济地理、河流地貌 | 略微夸张，便于观察地势 | 京杭大运河、长江流域 |
| **1.5-2** | 军事地理、山地地貌 | 明显夸张，突出高差 | 长平之战、长城选址 |
| **2-3** | 极端地貌、教学演示 | 高度夸张，强化视觉冲击 | 黄土高原、喜马拉雅山 |

**推荐值**：
- 军事战役：`1.8`
- 经济交通：`1.5`
- 自然地貌：`2.5`

### 4.2 视角参数（pitch/bearing）

| 参数 | 范围 | 说明 | 推荐值 |
|:---|:---|:---|:---|
| **pitch** | 0-85° | 倾斜角度，0为俯视，85为近平视 | 60-70° |
| **bearing** | 0-360° | 旋转角度，0为正北 | 根据地形走向调整 |
| **zoom** | 0-22 | 缩放级别，数字越大越近 | 战役：12-14<br>区域：8-10 |

### 4.3 地图样式（style）

| 样式 | Mapbox ID | 适用场景 |
|:---|:---|:---|
| **户外** | `mapbox://styles/mapbox/outdoors-v12` | 通用（推荐） |
| **卫星** | `mapbox://styles/mapbox/satellite-v9` | 真实地貌观察 |
| **简洁** | `mapbox://styles/mapbox/light-v11` | 突出自定义标注 |
| **深色** | `mapbox://styles/mapbox/dark-v11` | 数据可视化 |

---

## 五、交互增强

### 5.1 地形切换按钮

```javascript
let terrainEnabled = true;

function toggleTerrain() {
  terrainEnabled = !terrainEnabled;
  map.setTerrain(terrainEnabled ? 
    { source: 'mapbox-dem', exaggeration: 1.5 } : 
    null
  );
  document.getElementById('terrain-btn').textContent = 
    terrainEnabled ? '关闭地形' : '开启地形';
}
```

### 5.2 地形夸张滑块

```html
<div style="position: absolute; bottom: 20px; left: 20px; background: white; padding: 10px;">
  <label>地形夸张：<span id="exag-val">1.5</span>x</label>
  <input type="range" min="0" max="3" step="0.1" value="1.5" 
         oninput="setExaggeration(this.value)">
</div>

<script>
function setExaggeration(value) {
  map.setTerrain({ source: 'mapbox-dem', exaggeration: parseFloat(value) });
  document.getElementById('exag-val').textContent = value;
}
</script>
```

### 5.3 视角预设切换

```javascript
const presetViews = {
  overview: { pitch: 0, bearing: 0, zoom: 8 },
  sideView: { pitch: 70, bearing: 90, zoom: 12 },
  closeUp: { pitch: 60, bearing: 45, zoom: 14 }
};

function switchView(viewName) {
  const view = presetViews[viewName];
  map.easeTo({
    pitch: view.pitch,
    bearing: view.bearing,
    zoom: view.zoom,
    duration: 1500
  });
}
```

---

## 六、性能优化

### 6.1 按需加载地形

```javascript
// 初始状态不加载地形
const map = new mapboxgl.Map({ /* ... */ });

// 用户点击按钮后才加载
document.getElementById('enable-terrain').addEventListener('click', () => {
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
    });
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  }
});
```

### 6.2 限制缩放级别

```javascript
map.addSource('mapbox-dem', {
  type: 'raster-dem',
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
  tileSize: 512,
  maxzoom: 12  // 限制最大缩放级别，减少数据量
});
```

### 6.3 移动端降级

```javascript
// 检测设备性能
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const lowPower = navigator.hardwareConcurrency < 4;

if (isMobile || lowPower) {
  // 降低地形夸张倍数
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
  // 禁用天空层
  if (map.getLayer('sky')) map.removeLayer('sky');
}
```

---

## 七、常见问题

### Q1: Token 如何申请？

**A:** 访问 https://account.mapbox.com/
1. 注册免费账号
2. 进入 "Access tokens" 页面
3. 点击 "Create a token"
4. 复制 Token 并替换代码中的 `YOUR_MAPBOX_TOKEN`

**免费额度**：50,000次地图加载/月（足够100个学生用1年）

### Q2: 地形不显示怎么办？

**A:** 检查：
1. Token 是否正确
2. 是否在 `map.on('load')` 回调中添加地形
3. 浏览器是否支持 WebGL（Chrome/Firefox/Safari）

### Q3: 如何获取坐标？

**A:** 两种方法：
1. 在 [Google Maps](https://maps.google.com) 中右键点击 → "这是什么地方" → 复制坐标
2. 在地图上添加点击事件：
```javascript
map.on('click', (e) => {
  console.log(`坐标：[${e.lngLat.lng}, ${e.lngLat.lat}]`);
});
```

### Q4: 如何离线使用？

**A:** 下载 MBTiles：
```bash
# 使用 tilemill 或 mapbox-studio-classic 导出指定区域的瓦片
# 或使用 mbutil 工具
pip install mbutil
mb-util --image_format=png tiles.mbtiles tiles/
```

---

## 八、完整示例

参考文件：
- `data/geography/templates/terrain-3d-examples.html` - 5个典型场景
- `data/geography/terrain-3d/README.md` - 详细技术文档

---

**更新日期**: 2026-04-11  
**适用版本**: TeachAny v2.0+  
**维护**: TeachAny 技能开发团队
