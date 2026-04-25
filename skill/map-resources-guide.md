# 地图资源使用指南（TeachAny技能专用）

## 一、资源概览

TeachAny 技能已预制完整的**历史地图**和**地理地图**资源，存放在 `data/` 目录中。这些资源**必须优先使用**，禁止在课件中从外部API临时获取地图数据。

### 1.1 资源目录结构

```
data/
├── geography/              # 地理资源目录
│   ├── hillshade/          # ⭐ 全球地形底图（v5.13 新增，历史/地理课件必选）
│   │   ├── global-color-hillshade-4k.jpg  # ⭐ 彩色+阴影融合（推荐，835KB）
│   │   ├── global-color-hillshade-8k.jpg  # 高清版（3.2MB）
│   │   ├── global-color-hillshade-2k.jpg  # 快速加载版（200KB）
│   │   ├── global-hillshade-*.jpg         # 灰度阴影版（适合叠加数据层）
│   │   ├── global-color-relief-*.jpg      # 纯彩色版（无阴影）
│   │   └── README.md                      # 使用说明
│   ├── modern-china/       # 现代中国行政区划
│   │   ├── provinces.geojson      # 省级边界 (568KB)
│   │   ├── beijing.geojson        # 北京市区县边界
│   │   └── shanghai.geojson       # 上海市区县边界
│   ├── historical-china/   # 历史朝代地图
│   │   ├── qin-dynasty.geojson        # 秦朝疆域 (926KB)
│   │   ├── west-han-dynasty.geojson   # 西汉疆域 (936KB)
│   │   ├── east-han-dynasty.geojson   # 东汉疆域 (1.15MB)
│   │   ├── tang-dynasty.geojson       # 唐朝疆域 (954KB)
│   │   ├── song-dynasty.geojson       # 宋朝疆域 (14KB)
│   │   ├── yuan-dynasty.geojson       # 元朝疆域 (997KB)
│   │   ├── ming-dynasty.geojson       # 明朝疆域 (1.03MB)
│   │   └── qing-dynasty.geojson       # 清朝疆域 (1.84MB)
│   ├── world/              # 世界地图
│   │   └── countries.geojson       # 世界各国边界 (250KB)
│   └── templates/          # 地图模板
│       └── china-base-map.html     # 中国地图交互模板
└── history/                # 历史资源目录
    ├── timelines/          # 历史年表
    │   ├── chinese-dynasties.json      # 中国朝代年表（10个主要朝代）
    │   └── dynasties-detailed.json     # 详细朝代数据（含皇帝、事件、地标）
    └── figures/            # 历史人物
        └── persons.json                # 历史人物数据库
```

---

## 二、地理课件：地图资源调用规范

### 2.1 核心原则

- ✅ **强制使用**：地理课件中涉及中国行政区划、世界地图的部分，**必须调用 `data/geography/` 下的 GeoJSON 文件**
- ✅ **就近调用**：使用相对路径（如 `../data/geography/modern-china/provinces.geojson`）
- ❌ **禁止操作**：不得使用外部API（DataV、天地图、百度地图API）临时获取数据
- ✅ **可视化库**：推荐使用 ECharts、Leaflet、D3.js 渲染 GeoJSON

### 2.2 标准调用模式

#### 模式 A：ECharts 中国地图（省级）

```javascript
// 1. 加载 GeoJSON
fetch('../data/geography/modern-china/provinces.geojson')
  .then(response => response.json())
  .then(geoJson => {
    // 2. 注册地图
    echarts.registerMap('china', geoJson);
    
    // 3. 配置地图
    const option = {
      geo: {
        map: 'china',
        roam: true,  // 允许缩放
        label: {
          show: true  // 显示省名
        },
        itemStyle: {
          areaColor: '#f3f3f3',
          borderColor: '#516b91'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#FFD700'
          }
        }
      }
    };
    
    myChart.setOption(option);
  });
```

#### 模式 B：Leaflet 交互地图

```javascript
// 1. 初始化地图
const map = L.map('map').setView([34.5, 108], 4);

// 2. 添加底图
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 3. 加载 GeoJSON 并添加交互
fetch('../data/geography/modern-china/provinces.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#1890ff',
        weight: 2,
        fillColor: '#91d5ff',
        fillOpacity: 0.3
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', function() {
          alert(`你点击了：${feature.properties.name}`);
        });
      }
    }).addTo(map);
  });
```

### 2.3 地理课件常见场景

| 场景 | 使用资源 | 推荐工具 | 示例 |
|:---|:---|:---|:---|
| **中国省份识别** | `provinces.geojson` | ECharts | 点击省份高亮，显示省会/面积/人口 |
| **区域比较** | `provinces.geojson` | ECharts | 根据数据着色（人口密度、GDP） |
| **城市地理** | `beijing.geojson` / `shanghai.geojson` | Leaflet | 区县级边界标注 |
| **世界地理** | `world/countries.geojson` | ECharts / Leaflet | 国家定位、气候分布 |
| **地理信息标注** | 任意 GeoJSON + 自定义点位 | Leaflet Marker | 山脉、河流、城市标记 |

### 2.4 地理课件模板参考

参考文件：`data/geography/templates/china-base-map.html`

该模板已实现：
- 4种配色方案切换（蓝色/绿色/暖色/经典）
- 3种数据可视化模式（人口/GDP/气温）
- 响应式设计
- 控制面板交互

**使用方式**：将模板代码复制到课件中，修改数据源和交互逻辑即可。

---

## 三、历史课件：历史地图与数据调用规范

### 3.1 核心原则

- ✅ **强制使用**：历史课件中涉及朝代疆域、历史事件地理位置的部分，**必须调用 `data/geography/historical-china/` 和 `data/history/` 下的数据**
- ✅ **地图优先**：历史地理类知识点**必须用地图讲解**，不能仅靠文字描述
- ✅ **数据联动**：朝代地图应与 `timelines/dynasties-detailed.json` 中的皇帝、事件、地标数据联动

### 3.2 标准调用模式

#### 模式 A：朝代疆域展示

```javascript
// 1. 加载朝代地图
fetch('../data/geography/historical-china/tang-dynasty.geojson')
  .then(response => response.json())
  .then(geoJson => {
    echarts.registerMap('tang', geoJson);
    
    const option = {
      title: { text: '唐朝疆域图（618-907年）' },
      geo: {
        map: 'tang',
        roam: true,
        itemStyle: {
          areaColor: '#3CB371',  // 绿色系表示中华疆域
          borderColor: '#1A4030'
        }
      }
    };
    
    myChart.setOption(option);
  });
```

#### 模式 B：历史事件地理标注

```javascript
// 1. 加载朝代地图
fetch('../data/geography/historical-china/qin-dynasty.geojson')
  .then(res => res.json())
  .then(geoJson => {
    echarts.registerMap('qin', geoJson);
  });

// 2. 加载朝代详细数据
fetch('../data/history/timelines/dynasties-detailed.json')
  .then(res => res.json())
  .then(dynasties => {
    const qinData = dynasties.find(d => d.key === 'qin');
    
    // 3. 在地图上标注地标
    const landmarkSeries = {
      type: 'scatter',
      coordinateSystem: 'geo',
      data: qinData.landmarks.map(lm => ({
        name: lm.name,
        value: [lm.lng, lm.lat],
        type: lm.type,  // 古都/关隘/遗址
        story: lm.story
      })),
      symbolSize: 12,
      label: { show: true }
    };
    
    myChart.setOption({
      geo: { map: 'qin' },
      series: [landmarkSeries]
    });
  });
```

#### 模式 C：历史时间线 + 地图联动

```javascript
// 1. 加载中国朝代年表
fetch('../data/history/timelines/chinese-dynasties.json')
  .then(res => res.json())
  .then(dynasties => {
    // 2. 渲染时间轴
    const timeline = {
      type: 'slider',
      axisType: 'category',
      data: dynasties.map(d => d.name),
      currentIndex: 3  // 默认显示唐朝
    };
    
    // 3. 为每个朝代配置地图
    const options = dynasties.map(d => ({
      title: { text: `${d.name}（${d.period}）` },
      geo: { 
        map: d.key,  // 需提前注册所有朝代地图
        itemStyle: { areaColor: d.color }
      }
    }));
    
    myChart.setOption({
      timeline: timeline,
      options: options
    });
  });
```

### 3.3 历史课件常见场景

| 场景 | 使用资源 | 推荐实现 | 示例 |
|:---|:---|:---|:---|
| **朝代疆域变迁** | `historical-china/*.geojson` + `chinese-dynasties.json` | ECharts Timeline | 时间轴切换显示秦汉唐宋元明清疆域 |
| **历史事件定位** | `dynasties-detailed.json` 中的 `landmarks` | Leaflet Marker | 标注"长城""丝绸之路""重要战役地点" |
| **皇帝在位时期** | `dynasties-detailed.json` 中的 `emperors` | 时间线卡片 | 点击皇帝名显示在位时期地图 |
| **历史人物故事** | `persons.json` + 地图 | 弹窗卡片 | 点击地标弹出人物生平和典故 |
| **史料对读** | `dynasties-detailed.json` 中的 `poem` | 侧边栏展示 | 地图旁展示相关诗词和注释 |

### 3.4 历史数据结构说明

#### `chinese-dynasties.json` 字段

```json
{
  "id": "tang",
  "name": "唐朝",
  "start_year": 618,
  "end_year": 907,
  "duration": 289,
  "capital": "长安（今陕西西安）",
  "map_file": "../geography/historical-china/tang-dynasty.geojson",
  "color": "#FFD700",
  "major_events": [
    { "year": 626, "event": "玄武门之变，李世民即位" }
  ]
}
```

#### `dynasties-detailed.json` 字段

```json
{
  "key": "qin",
  "name": "秦",
  "period": "前221—前206年",
  "area": "约340万km²",
  "geoFile": "GeoJSON/秦.geojson",
  "emperors": [
    {
      "title": "秦始皇",
      "name": "嬴政",
      "reign": "前221—前210年",
      "bio": "...",
      "eval": "..."
    }
  ],
  "landmarks": [
    {
      "id": "qin1",
      "name": "咸阳",
      "loc": "陕西咸阳",
      "lat": 34.33,
      "lng": 108.72,
      "type": "古都",
      "icon": "都",
      "story": "...",
      "poem": {
        "title": "《谏逐客书》节选",
        "author": "李斯",
        "text": "泰山不让土壤，故能成其大..."
      }
    }
  ]
}
```

---

## 四、快速开始：典型案例

### 案例1：地理课——中国省份与省会

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <div id="map" style="width:100%;height:600px"></div>
  <script>
    const myChart = echarts.init(document.getElementById('map'));
    
    fetch('../data/geography/modern-china/provinces.geojson')
      .then(res => res.json())
      .then(geoJson => {
        echarts.registerMap('china', geoJson);
        
        myChart.setOption({
          title: { text: '认识中国34个省级行政区' },
          tooltip: { trigger: 'item' },
          geo: {
            map: 'china',
            roam: true,
            label: { show: true },
            itemStyle: { areaColor: '#f3f3f3' },
            emphasis: { itemStyle: { areaColor: '#FFD700' } }
          }
        });
      });
  </script>
</body>
</html>
```

### 案例2：历史课——秦朝统一六国

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <div id="map" style="width:100%;height:600px"></div>
  <script>
    const myChart = echarts.init(document.getElementById('map'));
    
    Promise.all([
      fetch('../data/geography/historical-china/qin-dynasty.geojson').then(r => r.json()),
      fetch('../data/history/timelines/dynasties-detailed.json').then(r => r.json())
    ]).then(([geoJson, dynasties]) => {
      echarts.registerMap('qin', geoJson);
      const qinData = dynasties.find(d => d.key === 'qin');
      
      myChart.setOption({
        title: { text: `秦朝疆域（${qinData.period}）` },
        geo: {
          map: 'qin',
          roam: true,
          itemStyle: { areaColor: '#3CB371' }
        },
        series: [{
          type: 'scatter',
          coordinateSystem: 'geo',
          data: qinData.landmarks.map(lm => ({
            name: lm.name,
            value: [lm.lng, lm.lat]
          })),
          symbolSize: 10,
          label: { show: true, formatter: '{b}' }
        }]
      });
    });
  </script>
</body>
</html>
```

### 案例3：历史课——朝代更替时间线

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <div id="timeline" style="width:100%;height:600px"></div>
  <script>
    fetch('../data/history/timelines/chinese-dynasties.json')
      .then(res => res.json())
      .then(dynasties => {
        const myChart = echarts.init(document.getElementById('timeline'));
        
        myChart.setOption({
          timeline: {
            axisType: 'category',
            data: dynasties.map(d => d.name),
            playInterval: 3000,
            label: { formatter: '{value}' }
          },
          options: dynasties.map(d => ({
            title: { 
              text: `${d.name}（${d.start_year}~${d.end_year}）`,
              subtext: `都城：${d.capital}` 
            },
            series: [{
              type: 'pie',
              data: [{ name: '疆域面积', value: d.duration }]
            }]
          }))
        });
      });
  </script>
</body>
</html>
```

---

## 五、注意事项

### 5.1 数据来源与版权

- **现代地图数据**：来源于 DataV.GeoAtlas（阿里云），使用前请确认符合教育使用场景
- **历史地图数据**：来源于 http://150.158.27.74:8080/History/，教育用途免费
- **历史人物数据**：整理自公开历史资料，符合教育使用规范

### 5.2 性能优化

- GeoJSON 文件较大（最大 1.84MB），建议首次加载后缓存
- 使用 ECharts 的 `lazy` 模式按需加载地图
- Leaflet 地图使用瓦片地图底图，减少数据传输

### 5.3 更新与维护

- 历史地图数据已完整覆盖秦汉唐宋元明清
- 现代地图数据仅覆盖省级和部分直辖市（北京、上海）
- 如需补充其他城市数据，参考 `scripts/download_map_resources.sh` 脚本

---

## 六、常见问题

**Q1: 如何添加自定义标注（如山脉、河流）？**

A: 在 GeoJSON 的基础上叠加 Marker 或 Scatter 系列：
```javascript
series: [{
  type: 'scatter',
  coordinateSystem: 'geo',
  data: [
    { name: '黄河', value: [110.5, 35.5] },
    { name: '长江', value: [112, 30.5] }
  ],
  symbolSize: 8,
  label: { show: true }
}]
```

**Q2: 如何实现地图缩放和拖拽？**

A: 设置 `roam: true`：
```javascript
geo: {
  map: 'china',
  roam: true,  // 允许缩放和拖拽
  scaleLimit: { min: 1, max: 5 }
}
```

**Q3: 如何高亮特定省份？**

A: 使用 ECharts 的 `dispatchAction` API：
```javascript
myChart.dispatchAction({
  type: 'highlight',
  name: '陕西'
});
```

**Q4: 历史地图数据是否包含朝代边界变化？**

A: 当前版本的 GeoJSON 文件是静态疆域快照（朝代鼎盛时期）。如需展示疆域演变，需要准备多个时间节点的 GeoJSON 文件并用 Timeline 切换。

---

## 七、扩展资源

### 参考项目
- **原始数据来源**: http://150.158.27.74:8080/History/
- **GeoJSON 规范**: https://geojson.org/
- **ECharts 地图文档**: https://echarts.apache.org/handbook/zh/concepts/geo
- **Leaflet 文档**: https://leafletjs.com/

### 示例项目
- `data/geography/templates/china-base-map.html` - 中国地图交互模板
- `data/history/timelines/dynasties-detailed.json` - 完整历史数据示例

---

**更新日期**: 2026-04-11  
**维护**: TeachAny 技能开发团队
