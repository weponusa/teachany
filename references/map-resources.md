# 十八、地理/历史课件地图资源（无需 API）

> 本文件是 SKILL_CN.md 的「十八、地理/历史课件地图资源（无需 API）」章节的详细内容，按需加载以节省上下文。
> 触发条件：做**地理 / 历史课件**，或涉及 GeoJSON / Leaflet / 地形瓦片时。

---


### 18.1 时空资产完整目录（v5.13）

所有地图与历史数据文件位于 `data/` 目录，**完全本地化，无需任何 API Key**。课件制作时**必须优先使用**这些预置资源，禁止从外部 API 临时获取地图数据。

#### 18.1.1 完整目录结构

```
data/
├── geography/                          # 地理资源目录
│   ├── hillshade/                      # ⭐ 全球地形底图（历史/地理课件必选）
│   │   ├── global-color-hillshade-4k.jpg   # ⭐ 推荐：彩色+阴影融合（835KB）
│   │   ├── global-color-hillshade-8k.jpg   # 高清版（3.2MB）
│   │   ├── global-color-hillshade-2k.jpg   # 快速加载版（200KB）
│   │   ├── global-hillshade-*.jpg          # 灰度阴影版（适合叠加数据层）
│   │   ├── global-color-relief-*.jpg       # 纯彩色版（无阴影）
│   │   └── README.md                      # 使用说明
│   ├── modern-china/                   # 现代中国行政区划
│   │   ├── provinces.geojson               # 省级边界（568KB，34个省级行政区）
│   │   ├── beijing.geojson                 # 北京市区县边界（98KB）
│   │   └── shanghai.geojson                # 上海市区县边界（83KB）
│   ├── historical-china/               # 历史朝代疆域地图
│   │   ├── qin-dynasty.geojson             # 秦朝疆域（926KB，前221–前206）
│   │   ├── west-han-dynasty.geojson        # 西汉疆域（936KB，前206–8）
│   │   ├── east-han-dynasty.geojson        # 东汉疆域（1.15MB，25–220）
│   │   ├── tang-dynasty.geojson            # 唐朝疆域（954KB，618–907）
│   │   ├── song-dynasty.geojson            # 宋朝疆域（14KB，960–1279）
│   │   ├── yuan-dynasty.geojson            # 元朝疆域（997KB，1271–1368）
│   │   ├── ming-dynasty.geojson            # 明朝疆域（1.03MB，1368–1644）
│   │   └── qing-dynasty.geojson            # 清朝疆域（1.84MB，1644–1912）
│   ├── world/                          # 世界地图
│   │   └── countries.geojson               # 世界各国边界（250KB）
│   └── templates/                      # 地图交互模板
│       └── china-base-map.html             # 中国地图交互模板（4种配色+3种数据模式）
└── history/                            # 历史资源目录
    ├── timelines/                      # 历史年表
    │   ├── chinese-dynasties.json          # 中国朝代年表（10个主要朝代，含 map_file 引用）
    │   └── dynasties-detailed.json         # 详细朝代数据（221KB）
    │                                        # 含 emperors/events/regions/landmarks/poems
    └── figures/                        # 历史人物
        └── persons.json                    # 历史人物数据库（21.75KB）
```

#### 18.1.2 地形底图资产（Hillshade）

| 文件名 | 分辨率 | 大小 | 风格 | 用途 |
|:---|:---|:---|:---|:---|
| **`global-color-hillshade-4k.jpg`** | 4096×2048 | **835KB** | 彩色+阴影融合 | **⭐ 课件默认底图** |
| `global-color-hillshade-8k.jpg` | 8192×4096 | 3.2MB | 彩色+阴影融合 | 高清演示 |
| `global-color-hillshade-2k.jpg` | 2048×1024 | 200KB | 彩色+阴影融合 | 低带宽/快速加载 |
| `global-hillshade-4k.jpg` | 4096×2048 | — | 灰度阴影 | 叠加数据层底图 |
| `global-color-relief-4k.jpg` | 4096×2048 | — | 纯彩色（无阴影） | 平面地图底色 |

- **数据来源**: Natural Earth Shaded Relief (SR_HR) + Cross-blended Hypsometric Tints (HYP_HR)
- **许可证**: Public Domain（公共领域）
- **投影**: 等距圆柱投影（Equirectangular），经纬度直接映射
- **颜色含义**: 绿色=湿润低地，棕色=干旱区，灰白=高山，白色=冰川，阴影提供立体感

#### 18.1.3 历史疆域数据资产

| 文件名 | 朝代 | 时间范围 | 大小 | 数据来源 |
|:---|:---|:---|:---|:---|
| `qin-dynasty.geojson` | 秦 | 前221–前206 | 926KB | CHGIS V6 / Natural Earth |
| `west-han-dynasty.geojson` | 西汉 | 前206–8 | 936KB | CHGIS V6 |
| `east-han-dynasty.geojson` | 东汉 | 25–220 | 1.15MB | CHGIS V6 |
| `tang-dynasty.geojson` | 唐 | 618–907 | 954KB | CHGIS V6 |
| `song-dynasty.geojson` | 宋 | 960–1279 | 14KB | CHGIS V6 |
| `yuan-dynasty.geojson` | 元 | 1271–1368 | 997KB | CHGIS V6 |
| `ming-dynasty.geojson` | 明 | 1368–1644 | 1.03MB | CHGIS V6 |
| `qing-dynasty.geojson` | 清 | 1644–1912 | 1.84MB | CHGIS V6 |

**总计**: ~7.85MB，覆盖中国 8 个主要朝代的鼎盛时期疆域。

#### 18.1.4 历史数据资产

**`dynasties-detailed.json`**（221KB）——每个朝代包含以下字段：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `key` | string | 朝代标识（如 `qin`、`tang`） |
| `name` | string | 中文名（如 "秦"、"唐"） |
| `period` | string | 时间范围（如 "前221—前206年"） |
| `area` | string | 疆域面积（如 "约340万km²"） |
| `geoFile` | string | 对应 GeoJSON 文件路径 |
| `emperors[]` | array | 皇帝列表（title/name/reign/bio/eval） |
| `landmarks[]` | array | 地标列表（id/name/loc/lat/lng/type/icon/story/poem） |
| `events[]` | array | 重大事件列表 |

**`chinese-dynasties.json`**——简要朝代年表，每个条目包含：
- `id`、`name`、`start_year`、`end_year`、`duration`、`capital`
- `map_file`：对应 GeoJSON 路径
- `color`：朝代代表色
- `major_events[]`：关键事件列表

**`persons.json`**（21.75KB）——历史人物数据库。

#### 18.1.5 外部开源数据源清单（v5.12 标准）

当预置数据不能满足需求时，**必须从以下权威开源数据源获取**，严禁手工标注：

| 数据类型 | 数据源 | 下载地址 | 格式 | 覆盖范围 | 许可证 |
|:---|:---|:---|:---|:---|:---|
| **河流水系** | Natural Earth Rivers | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_rivers_lake_centerlines.json` | GeoJSON | 全球主要河流 | Public Domain |
| **历史行政区划** | CHGIS V6 | https://dataverse.harvard.edu/dataverse/chgis_v6<br/>复旦大学: https://yugong.fudan.edu.cn/CHGIS/ | Shapefile → GeoJSON | 中国历朝历代（-221~1911） | Free for academic use |
| **现代行政边界** | Natural Earth Admin | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/cultural/ne_10m_admin_0_countries.json` | GeoJSON | 全球国家边界 | Public Domain |
| **湖泊** | Natural Earth Lakes | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_lakes.json` | GeoJSON | 全球主要湖泊 | Public Domain |
| **历史城市** | CHGIS Place Names | https://chgis.fas.harvard.edu/<br/>数据库: Time Series Datasets | Shapefile/CSV | 中国历代城市/县治 | Free for academic use |
| **DEM 地形** | AWS Terrain Tiles | https://registry.opendata.aws/terrain-tiles/<br/>Tile URL: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Terrarium RGB | 全球 30m 精度 | Public Domain |
| **⭐ 地形底图** | Natural Earth Hillshade | 本地预置: `data/geography/hillshade/global-color-hillshade-4k.jpg`<br/>原始数据: https://www.naturalearthdata.com/downloads/10m-raster-data/ | JPEG | 全球，彩色+阴影 | Public Domain |
| **海岸线** | Natural Earth Coastline | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_coastline.json` | GeoJSON | 全球 | Public Domain |

#### 18.1.6 调用规范

**地理课件**：
- ✅ **强制使用** `data/geography/` 下的 GeoJSON 文件
- ✅ **就近调用**：使用相对路径（如 `../data/geography/modern-china/provinces.geojson`）
- ❌ **禁止操作**：不得使用外部 API（DataV、天地图、百度地图 API）临时获取数据
- ✅ **可视化库**：推荐 ECharts、Leaflet、D3.js 渲染 GeoJSON

**历史课件**：
- ✅ **强制使用** `data/geography/historical-china/` 和 `data/history/` 下的数据
- ✅ **地图优先**：历史地理类知识点**必须用地图讲解**，不能仅靠文字描述
- ✅ **数据联动**：朝代地图应与 `timelines/dynasties-detailed.json` 中的皇帝、事件、地标数据联动

**地图常见场景快速索引**：

| 场景 | 使用资源 | 推荐工具 |
|:---|:---|:---|
| 中国省份识别 | `modern-china/provinces.geojson` | ECharts |
| 区域比较（人口/GDP） | `modern-china/provinces.geojson` | ECharts |
| 城市地理（区县级） | `modern-china/beijing.geojson` 等 | Leaflet |
| 世界地理 | `world/countries.geojson` | ECharts / Leaflet |
| 朝代疆域变迁 | `historical-china/*.geojson` + `chinese-dynasties.json` | ECharts Timeline |
| 历史事件定位 | `dynasties-detailed.json` 中的 `landmarks` | Leaflet Marker |
| 皇帝在位地图 | `dynasties-detailed.json` 中的 `emperors` | 时间线卡片 |
| 历史人物故事 | `persons.json` + 地图 | 弹窗卡片 |
| 史料对读 | `dynasties-detailed.json` 中的 `poem` | 侧边栏展示 |

### 18.2 使用方法

> **⛔ v5.18 核心原则（硬规则）**：
>
> 1. **技术选型**：当地图需要 **hillshade 地形底图 + GeoJSON 国界/疆域叠加** 时，**必须用 Leaflet**（`L.imageOverlay` + `L.geoJSON`）。**严禁用 ECharts `graphic` 铺底图**——`graphic` 是 DOM 覆盖层不参与缩放平移，会与 `geo` 图层错位。
> 2. **初始视图**：地图初始化后必须**立即聚焦教学核心区域**（讲希腊就聚焦爱琴海，讲秦朝就聚焦战国七雄辖区），用 `map.fitBounds(coreBounds)` 或 `map.setView([lat,lng], zoom)`，禁止停在默认 `[0,0]` 世界中心。
> 3. **仅当地图是"纯行政区划填色图（不需要 hillshade 真实地形底图）"时**，才可用 ECharts `geo`。

#### 方案 A：Leaflet ⭐（**默认首选**，适用于地形底图 + GeoJSON 叠加 + 城市点 + 路线的一切场景）

```javascript
// 1) 容器 + CRS（等距圆柱投影，与 hillshade 图完美对齐）
const map = L.map('greece-map', {
  crs: L.CRS.EPSG4326,           // ⭐ 关键：与 hillshade 等距圆柱投影一致
  minZoom: 2, maxZoom: 10,
  zoomControl: true,
  attributionControl: false,
  worldCopyJump: false
});

// 2) hillshade 底图（全球覆盖 -180~180, -90~90），随缩放平移自动同步
L.imageOverlay(
  '../../data/geography/hillshade/global-color-hillshade-4k.jpg',
  [[-90, -180], [90, 180]]
).addTo(map);

// 3) GeoJSON 国界/疆域叠加（随同一坐标系缩放）
fetch('../../data/geography/world/countries.geojson')
  .then(r => r.json())
  .then(geo => {
    L.geoJSON(geo, {
      style: f => ({
        color: f.properties.name === 'Greece' ? '#4ade80' : 'rgba(148,163,184,0.4)',
        weight: f.properties.name === 'Greece' ? 2 : 0.8,
        fillColor: f.properties.name === 'Greece' ? '#4ade80' : '#1e293b',
        fillOpacity: f.properties.name === 'Greece' ? 0.2 : 0.15
      })
    }).addTo(map);
  });

// 4) 城市点（用 divIcon 还原 pin/circle 样式）
L.marker([37.97, 23.726], {
  icon: L.divIcon({
    className: 'city-pin',
    html: '<div style="background:#fbbf24;color:#0f172a;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:bold;white-space:nowrap">🏛️ 雅典</div>',
    iconSize: [null, null], iconAnchor: [20, 10]
  })
}).addTo(map).bindPopup('民主政治的摇篮，伯里克利时代的中心');

// 5) ⭐⭐⭐ 初始视图：必须 fitBounds 到教学核心区域
const coreBounds = L.latLngBounds([[34, 19], [41, 28]]);  // 希腊+爱琴海核心
map.fitBounds(coreBounds, { padding: [20, 20] });
```

**Leaflet 为何必须做默认首选**：
- ✅ **底图与地图层同步缩放平移**：`L.imageOverlay` 使用与 `L.geoJSON` 相同坐标系，天然同步，不存在"底图错位"问题
- ✅ **fitBounds 聚焦核心区域**：支持精确对准教学重点，不会停在默认中心
- ✅ **GeoJSON 原生支持**：`L.geoJSON` 可直接绘制国界/疆域，支持 per-feature 样式
- ✅ **无需 Token / 免费离线**：hillshade + GeoJSON 均为本地资源
- ✅ **DivIcon + Popup**：自定义城市标注 + 点击弹窗一键实现

#### 方案 B：ECharts 地图（**仅限纯行政区划填色图**，不需要 hillshade 真实地形）

> ⛔ **使用前提**：当且仅当课件展示的是**纯色区划图**（如讲解"中国 34 个省级行政区"、"各省 GDP 分布热力图"），且**不需要地形底图**时，才允许使用 ECharts。一旦需要叠加 hillshade，**立即切换到方案 A Leaflet**。

```javascript
// 加载 GeoJSON 并注册为地图
fetch('../data/geography/modern-china/provinces.geojson')
  .then(res => res.json())
  .then(geoJson => {
    echarts.registerMap('china', geoJson);
    chart.setOption({
      geo: { 
        map: 'china', 
        roam: true,  // 可缩放、平移
        itemStyle: { areaColor: '#e0f2f1' }
      }
    });
  });
```

**ECharts 严禁场景**：
- ❌ 用 `graphic: [{type:'image', image:'hillshade.jpg'}]` 组件叠加 hillshade → **graphic 不参与 geo 缩放平移，必定错位**
- ❌ 地图初始化后未调用 `chart.dispatchAction({type:'geoRoam', zoom, center})` 聚焦到教学核心区域

#### 方案 C：Leaflet + OpenStreetMap（需要实景街道地图时）

```javascript
// 使用 OpenStreetMap 免费瓦片（无需 Token）
const map = L.map('map').setView([35, 108], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 18
}).addTo(map);
```

**优点**：
- ✅ **免费瓦片**：OpenStreetMap 提供全球底图
- ✅ **无需 Token**：直接使用，零配置
- ✅ **实景展示**：真实街道地图

⚠️ **注意**：需联网首次加载（瓦片可缓存）；现代历史或当代地理题材才适用，古代/中世纪课件优先用方案 A。

### 18.3 禁止使用需要 API 的方案

❌ **Mapbox GL JS**：需要申请 Token，已移除
❌ **Google Maps**：需要付费 API Key
❌ **高德/百度地图**：需要申请 Key

---

### 18.4 历史/地理课件高级可视化规范（v5.11 新增）⭐

**适用场景**：
- 历史疆域演变（秦统一六国、元朝疆域、明清海禁等）
- 地理地形分析（青藏高原、长江流域、"胡焕庸线"等）
- 历史战役复盘（长平之战、淝水之战、赤壁之战等）
- 地缘政治分析（丝绸之路、大运河、海上贸易等）

#### 18.4.1 强制三层架构（必选）

**第一层：地形底图**（必选）

历史/地理课件必须使用地形底图,不得使用纯色背景或简化示意图。

**⛔ 地形底图四级降级策略（按优先级执行）**:

| 优先级 | 方案 | 数据源 | 优点 | 适用场景 |
|:---:|:---|:---|:---|:---|
| **Level 0 ⭐** | **本地彩色 Hillshade 图片** | `data/geography/hillshade/global-color-hillshade-*.jpg` | 零依赖、离线可用、加载快、效果好 | **所有历史/地理课件（默认首选）** |
| Level 1 | MapLibre GL + AWS Terrain | AWS Terrain Tiles (Terrarium RGB) | 真 3D 地形、可交互旋转 | 需要 3D 交互的地形分析课 |
| Level 2 | 本地 Terrarium 瓦片 | `data/terrain-tiles/{z}/{x}/{y}.png` | 离线 3D | 离线环境需要 3D |
| Level 3 | 纯 2D 降级 | 无地形 | 保证可用 | 以上全部失败时 |

**🌟 标准方案（v5.13 强制）：本地彩色 Hillshade 图片**

项目已预置 3 种风格 × 3 种尺寸的全球地形底图（`data/geography/hillshade/`）：

| 文件名 | 尺寸 | 大小 | 说明 |
|:---|:---|:---|:---|
| `global-color-hillshade-8k.jpg` | 8192×4096 | 3.2 MB | 彩色+阴影融合，高清版 |
| **`global-color-hillshade-4k.jpg`** | 4096×2048 | **835 KB** | **⭐ 推荐：课件默认使用** |
| `global-color-hillshade-2k.jpg` | 2048×1024 | 200 KB | 快速加载 / 低带宽 |
| `global-hillshade-*.jpg` | 同上 | — | 灰度阴影版（适合叠加数据层） |
| `global-color-relief-*.jpg` | 同上 | — | 纯彩色版（无阴影） |

- **数据来源**: Natural Earth Shaded Relief (SR_HR) + Cross-blended Hypsometric Tints (HYP_HR)
- **许可证**: Public Domain（公共领域）
- **投影**: 等距圆柱投影（Equirectangular），经纬度直接映射
- **颜色**: 绿色=湿润低地，棕色=干旱区，灰白=高山，白色=冰川，带山体阴影立体感

**⛔ 使用规则**:
- **历史/地理课件必须使用 `global-color-hillshade-4k.jpg` 作为默认地形底图**
- **⭐ 强制方案：Leaflet `L.imageOverlay(url, [[-90,-180],[90,180]])` 铺底** —— 底图与 GeoJSON/标注层使用同一坐标系，缩放平移时自动同步
- 纯 Canvas 课件：用 `drawImage()` 绘制为底图层（仅限无交互缩放的静态情境图）
- ⛔ **严禁 ECharts `graphic` 组件铺底** —— `graphic` 是 DOM 绝对定位覆盖层，**不跟随 `geo` 缩放平移**，交互时底图必定与国界/城市点错位；若用 ECharts，请只用纯色区划图且禁止叠加 hillshade
- 仅当需要 3D 视角旋转/地形夸张时，才升级到 Level 1（MapLibre GL）

```javascript
// ✅ Level 0: 本地 Hillshade 图片（推荐，零依赖）
// === Canvas 用法 ===
const hillshade = new Image();
hillshade.src = '../../data/geography/hillshade/global-color-hillshade-4k.jpg';
hillshade.onload = () => {
  ctx.drawImage(hillshade, 0, 0, canvas.width, canvas.height);
  // 在地形底图之上叠加 GeoJSON 疆域、标注等
  drawBoundaries();
  drawMarkers();
};

// === Leaflet 用法 ===
const hillshadeLayer = L.imageOverlay(
  '../../data/geography/hillshade/global-color-hillshade-4k.jpg',
  [[-90, -180], [90, 180]]
).addTo(map);

// === CSS 背景用法 ===
// .map-container { background-image: url('...hillshade-4k.jpg'); background-size: cover; }
```

```javascript
// Level 1: MapLibre GL + AWS Terrain（仅需要 3D 交互时使用）
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e8dcc7' } },
      { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.3 } }
    ]
  },
  center: [110, 35], zoom: 5, pitch: 60
});

map.on('load', () => {
  map.addSource('terrain', {
    type: 'raster-dem',
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    encoding: 'terrarium', tileSize: 256, maxzoom: 15
  });
  map.setTerrain({ source: 'terrain', exaggeration: 2.5 });
  map.addLayer({
    id: 'hillshade', type: 'hillshade', source: 'terrain',
    paint: { 'hillshade-exaggeration': 0.8, 'hillshade-shadow-color': '#5a3d2b',
             'hillshade-highlight-color': '#f5e6d3', 'hillshade-illumination-direction': 135 }
  });
});
```

**第二层：历史疆域 GeoJSON 叠加**（必选）
```javascript
// 使用 data/geography/historical-china/ 预置数据
fetch('../data/geography/historical-china/qin-221bc.geojson')
  .then(res => res.json())
  .then(boundary => {
    chart.setOption({
      series: [{
        type: 'map',
        map: 'qin',
        data: boundary.features.map(f => ({
          name: f.properties.name,
          itemStyle: {
            areaColor: 'rgba(106,27,154,0.3)',
            borderColor: '#6a1b9a',
            borderWidth: 2
          }
        }))
      }]
    });
  });
```

**第三层：态势动画**（必选）
```javascript
// 时间轴 + 进攻路线 + 战役标记
const campaigns = [
  { year: -230, from: [108.9,34.3], to: [113.8,34.2], target: '韩' },
  { year: -228, from: [108.9,34.3], to: [114.5,36.6], target: '赵' },
  // ...
];

chart.setOption({
  timeline: {
    axisType: 'category',
    autoPlay: true,
    playInterval: 2000,
    data: campaigns.map(c => `公元${c.year}年`)
  },
  options: campaigns.map(c => ({
    series: [{
      type: 'lines',
      coordinateSystem: 'geo',
      effect: {
        show: true,
        trailLength: 0.3,
        symbol: 'arrow',
        symbolSize: 8
      },
      lineStyle: { width: 2, curveness: 0.2 },
      data: [{ coords: [c.from, c.to] }]
    }]
  }))
});
```

#### 18.4.2 三种动画设计模式

**A. 时间轴播放模式**（适合历史进程）
- 自动播放 + 可暂停
- 底部时间轴控制器
- 音频同步（推荐）

```javascript
// 语音与动画同步
audioPlayer.addEventListener('timeupdate', () => {
  const progress = audioPlayer.currentTime / audioPlayer.duration;
  const index = Math.floor(progress * campaigns.length);
  chart.dispatchAction({ type: 'timelineChange', currentIndex: index });
});
```

**B. 交互式探索模式**（适合地理地形）
- 点击地标 → 详情弹窗
- 3D 视角旋转/倾斜
- 高度夸张系数可调

**C. 对比模式**（适合疆域演变）
- 左右分屏：战国七雄 vs 秦统一后
- 滑动滑块查看变化
- 或时间轴切换

#### 18.4.3 数据规范

**⚠️ 强制使用开源数据源（禁止手工标注）**

历史/地理课件中的所有地理要素（河流、城市、战役地点等）必须来自权威开源数据集,严禁低精度手工标注。

**🌟 标准数据源清单（v5.11 必选）**:

| 数据类型 | 数据源 | 下载地址 | 格式 | 覆盖范围 | 许可证 |
|:---|:---|:---|:---|:---|:---|
| **河流水系** | Natural Earth Rivers | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_rivers_lake_centerlines.json` | GeoJSON | 全球主要河流 | Public Domain |
| **历史行政区划** | CHGIS V6 | https://dataverse.harvard.edu/dataverse/chgis_v6<br/>复旦大学: https://yugong.fudan.edu.cn/CHGIS/ | Shapefile → GeoJSON | 中国历朝历代<br/>(-221~1911) | Free for academic use |
| **现代行政边界** | Natural Earth Admin | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/cultural/ne_10m_admin_0_countries.json` | GeoJSON | 全球国家边界 | Public Domain |
| **湖泊** | Natural Earth Lakes | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_lakes.json` | GeoJSON | 全球主要湖泊 | Public Domain |
| **历史城市** | CHGIS Place Names | https://chgis.fas.harvard.edu/<br/>数据库: Time Series Datasets | Shapefile<br/>CSV | 中国历代<br/>城市/县治 | Free for academic use |
| **DEM 地形** | AWS Terrain Tiles | https://registry.opendata.aws/terrain-tiles/<br/>Tile URL: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Terrarium RGB | 全球 30m 精度 | Public Domain |
| **⭐ 地形底图** | Natural Earth Hillshade | 本地预置: `data/geography/hillshade/global-color-hillshade-4k.jpg`<br/>原始数据: https://www.naturalearthdata.com/downloads/10m-raster-data/ | JPEG | 全球，彩色+阴影 | Public Domain |
| **海岸线** | Natural Earth Coastline | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_coastline.json` | GeoJSON | 全球 | Public Domain |

**🔧 数据处理流程**:

1. **下载原始数据**（Shapefile 或 GeoJSON）
2. **转换为标准 GeoJSON**（如果是 Shapefile）:
   ```bash
   # 使用 ogr2ogr (GDAL)
   ogr2ogr -f GeoJSON output.json input.shp
   ```
3. **简化坐标**（降低文件大小，不损失精度）:
   ```bash
   # 使用 mapshaper
   mapshaper input.json -simplify 0.1% -o output-simplified.json
   ```
4. **存储到项目中**:
   ```
   data/
   ├─ geography/
   │  ├─ rivers/
   │  │  └─ ne_10m_rivers_china.json
   │  ├─ lakes/
   │  │  └─ ne_10m_lakes_china.json
   │  └─ historical-china/
   │     ├─ qin-221bc.geojson (from CHGIS)
   │     ├─ han-206bc.geojson
   │     └─ tang-618ad.geojson
   └─ history/
      ├─ cities/
      │  └─ chgis-cities-qin.json
      └─ battles/
         └─ warring-states-battles.json (人工整理 + CHGIS 地名校准)
   ```

**历史疆域 GeoJSON 标准**：
```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "dynasty": "qin",
    "year": -221,
    "capital": [108.9, 34.3],
    "dataSource": "CHGIS V6",
    "sourceUrl": "https://dataverse.harvard.edu/dataset.xhtml?persistentId=...",
    "processedBy": "TeachAny",
    "processedDate": "2026-04-12"
  },
  "features": [{
    "properties": {
      "name": "关中郡",
      "type": "prefecture",
      "area": 45000,
      "chgisId": "v6_1820_county_pgn.123" // 保留原始数据 ID
    },
    "geometry": { "type": "Polygon", "coordinates": [[...]] }
  }]
}
```

**战役/城市标记数据标准**：
```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "title": "秦灭六国战役地点",
    "period": "前230年-前221年",
    "dataSource": "CHGIS V6 地名数据库 + 史记战国策",
    "coordinateSource": "CHGIS Place Names"
  },
  "features": [{
    "type": "Feature",
    "properties": {
      "name": "长平之战",
      "chineseName": "长平之战",
      "date": "-260-05",
      "belligerents": ["秦", "赵"],
      "result": "秦胜",
      "casualties": { "qin": 50000, "zhao": 450000 },
      "terrainFactor": "太行山地形限制赵军机动",
      "modernLocation": "山西省晋城市高平市",
      "chgisId": "v6_place_5678", // CHGIS 地名 ID
      "elevation": 950
    },
    "geometry": {
      "type": "Point",
      "coordinates": [112.92, 35.80] // 来自 CHGIS，非手工标注
    }
  }]
}
```

**❌ 禁止的做法**:
```javascript
// ❌ 错误：手工标注坐标（精度低，无出处）
const rivers = [
  { name: "黄河", path: [[110, 35], [112, 36], ...] } // 禁止！
];

// ❌ 错误：使用闭源 API（无法离线使用）
fetch('https://api.某商业地图.com/rivers?key=xxx')

// ❌ 错误：直接嵌入大量 GeoJSON 到 HTML（文件巨大）
<script>const data = {"type":"FeatureCollection","features":[...]}</script>
```

**✅ 正确的做法**:
```javascript
// ✅ 正确：从预处理的 Natural Earth 数据加载
fetch('/data/geography/rivers/ne_10m_rivers_china.json')
  .then(res => res.json())
  .then(rivers => {
    map.addSource('rivers', {
      type: 'geojson',
      data: rivers
    });
    map.addLayer({
      id: 'rivers',
      type: 'line',
      source: 'rivers',
      paint: {
        'line-color': '#1976d2',
        'line-width': ['get', 'strokeweig'] // 使用 Natural Earth 自带的线宽属性
      }
    });
  });
```

#### 18.4.4 强制必选元素（历史/地理课件专用）

✅ **地形底图**：必须使用本地彩色 Hillshade 图片（`data/geography/hillshade/global-color-hillshade-4k.jpg`）；仅需 3D 交互时升级到 MapLibre GL + AWS Terrain Tiles  
✅ **历史疆域叠加**：必须使用预置 GeoJSON（来自 CHGIS V6 或 Natural Earth）  
✅ **态势动画**：战争主题必须包含时间轴自动播放  
✅ **地标标注**：至少 5 个关键地点（坐标来自 CHGIS 或 Natural Earth）  
✅ **河流水系**：使用 Natural Earth Rivers 数据（禁止手工标注）  
✅ **交互控制**：缩放/平移/视角旋转或时间轴控制  
✅ **语音同步**：动画进度与音频时间轴同步（推荐）  
✅ **数据溯源**：每个 GeoJSON 文件必须在 metadata 中注明 dataSource 和 sourceUrl

#### 18.4.5 库选择决策树

```
历史/地理课件
├─ 需要真实 3D 地球？
│  ├─ 是 → Cesium.js
│  └─ 否 → 继续
├─ 需要 3D 地形交互（旋转/倾斜/夸张）？
│  ├─ 是 → MapLibre GL + AWS Terrain Tiles (Level 1)
│  └─ 否 → 继续
├─ ⭐ 默认方案：本地彩色 Hillshade 图片 (Level 0)
│  使用 global-color-hillshade-4k.jpg 作为底图
│  Canvas/Leaflet/ECharts 均可，零依赖，离线可用
└─ 性能极差设备 → 纯 2D 降级 (Level 3)
```

#### 18.4.6 验收标准（Phase 4 新增）

| 检查项 | 标准 | 权重 |
|:---|:---|:---:|
| **地形底图是否启用** | 必须使用 `global-color-hillshade-*.jpg` 或 MapLibre GL 3D 地形（terrain exaggeration ≥ 2.0），禁止纯色/白色背景 | 20% |
| **数据源准确性** | 河流/城市/边界必须来自 CHGIS/Natural Earth，禁止手工标注 | 15% |
| **历史疆域准确性** | 边界与史料一致（±5% 误差） | 15% |
| **态势动画流畅度** | ≥30 FPS | 10% |
| **时间轴完整性** | 关键事件全覆盖 | 10% |
| **地标坐标准确性** | 误差 <10km，坐标来自 CHGIS 数据库 | 10% |
| **音频动画同步** | 偏差 <500ms | 5% |
| **交互响应速度** | 延迟 <100ms | 5% |
| **移动端适配** | 触摸流畅 | 5% |
| **数据溯源** | GeoJSON 文件必须包含 metadata.dataSource 字段 | 5% |

**总分 ≥85 分通过。**

#### 18.4.7 数据预处理工具链（推荐）

**目标**：将 Shapefile/大 GeoJSON 转换为课件可用的小文件。

**工具组合**：
1. **ogr2ogr** (GDAL) - 格式转换
2. **mapshaper** - 几何简化
3. **tippecanoe** (可选) - 矢量切片（大数据集）

**示例工作流**：

```bash
# Step 1: 从 CHGIS 下载秦朝行政区划 Shapefile
# 假设下载文件: chgis_v6_221bc_counties.shp

# Step 2: 转换为 GeoJSON
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  qin-221bc-raw.geojson \
  chgis_v6_221bc_counties.shp

# Step 3: 简化几何形状（减少 90% 点数，视觉差异 <1px）
mapshaper qin-221bc-raw.geojson \
  -simplify 0.1% keep-shapes \
  -o qin-221bc.geojson

# Step 4: 提取中国区域河流（从 Natural Earth 全球数据）
mapshaper ne_10m_rivers_lake_centerlines.json \
  -filter 'SOV_A3 === "CHN"' \
  -o ne_10m_rivers_china.json

# Step 5: 验证文件大小
ls -lh qin-221bc.geojson
# 期望结果: < 500 KB (简化后)
```

**在线工具（无需安装）**：
- **Mapshaper Web**: https://mapshaper.org/
  - 可直接在浏览器中上传 Shapefile 并导出 GeoJSON
  - 可视化简化效果预览
- **GeoJSON.io**: https://geojson.io/
  - 查看/编辑 GeoJSON
  - 绘制简单几何形状

**CHGIS 数据下载指南**：

1. 访问 https://dataverse.harvard.edu/dataverse/chgis_v6
2. 选择时间切片（例如: `CHGIS V6 Qin (221 BC)`）
3. 下载 Shapefile 压缩包
4. 解压后使用 ogr2ogr 转换
5. 保存到 `data/geography/historical-china/` 目录

**Natural Earth 数据下载指南**：

1. 访问 https://github.com/martynafford/natural-earth-geojson
2. 直接下载 GeoJSON 文件（无需转换）:
   ```bash
   # 河流
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/physical/ne_10m_rivers_lake_centerlines.json
   
   # 湖泊
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/physical/ne_10m_lakes.json
   
   # 国家边界
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/cultural/ne_10m_admin_0_countries.json
   ```
3. 如需按国家过滤,使用 mapshaper 的 `-filter` 命令

**常见问题**：

Q: CHGIS 数据太大怎么办?  
A: 使用 mapshaper 简化到 0.05%-0.1%,或者按需裁剪特定区域。

Q: 如何处理历史战役地点（CHGIS 没有）?  
A: 从 CHGIS Place Names 数据库中查找对应古代地名坐标,手工整理到 battles.json,但必须标注 `chgisId` 字段作为溯源。

Q: 如何验证坐标准确性?  
A: 在 https://geojson.io/ 中查看,对比现代卫星地图和历史地图集（如《中国历史地图集》）。

---

### 18.5 地图资源标准调用模式（内联自 `map-resources-guide.md`）

#### 18.5.1 ⭐ Leaflet + Hillshade + GeoJSON 叠加（**历史/地理课件默认模板**）

```javascript
// ⭐ v5.18 强制：底图 + 国界 + 城市点 + 初始视图四件套
const map = L.map('greece-map', {
  crs: L.CRS.EPSG4326,  // 必须与 hillshade 等距圆柱投影对齐
  minZoom: 2, maxZoom: 10,
  attributionControl: false
});

// 1) Hillshade 底图（全球 bounds，与 geoJSON 完全同步缩放平移）
L.imageOverlay(
  '../../data/geography/hillshade/global-color-hillshade-4k.jpg',
  [[-90, -180], [90, 180]]
).addTo(map);

// 2) 国界/疆域 GeoJSON 叠加
fetch('../../data/geography/world/countries.geojson')
  .then(r => r.json())
  .then(geo => {
    L.geoJSON(geo, {
      style: f => ({
        color: ['Greece','Turkey','Italy'].includes(f.properties.name) ? '#4ade80' : 'rgba(148,163,184,0.3)',
        weight: 1, fillOpacity: 0.15
      })
    }).addTo(map);
  });

// 3) 城市标注（divIcon 自定义样式）
const cities = [
  { name: '雅典',   latlng: [37.97, 23.726], color: '#fbbf24', info: '🏛️ 民主政治摇篮' },
  { name: '斯巴达', latlng: [37.07, 22.42],  color: '#f87171', info: '⚔️ 军事寡头制' },
  { name: '米利都', latlng: [37.53, 27.28],  color: '#a78bfa', info: '📚 爱奥尼亚哲学中心' }
];
cities.forEach(c => {
  L.marker(c.latlng, {
    icon: L.divIcon({
      className: 'city-pin',
      html: `<div style="background:${c.color};color:#0f172a;padding:3px 10px;border-radius:999px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${c.name}</div>`,
      iconSize: [null, null], iconAnchor: [0, 12]
    })
  }).addTo(map).bindPopup(`<strong>${c.name}</strong><br/>${c.info}`);
});

// 4) ⛔ 必做：fitBounds 聚焦教学核心区域（不得停在默认 [0,0] 世界中心）
const coreBounds = L.latLngBounds([[34, 19], [41, 28]]);  // 希腊+爱琴海核心
map.fitBounds(coreBounds, { padding: [20, 20] });
```

#### 18.5.2 ECharts 中国地图（仅限纯行政区划填色图，**不得叠加 hillshade**）

> ⛔ 若需要 hillshade 地形底图，请改用 18.5.1 Leaflet 模板。ECharts `graphic` 铺底会导致底图不跟随缩放平移。

```javascript
// 加载 GeoJSON 并注册为地图
fetch('../data/geography/modern-china/provinces.geojson')
  .then(res => res.json())
  .then(geoJson => {
    echarts.registerMap('china', geoJson);
    chart.setOption({
      title: { text: '中国省级行政区划', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}' },
      geo: {
        map: 'china',
        roam: true,
        center: [108, 34.5], zoom: 1.2,  // ⛔ 必须显式设置，聚焦教学区域
        label: { show: true },
        itemStyle: { areaColor: '#e0f2f1', borderColor: '#26a69a', borderWidth: 1 },
        emphasis: {
          itemStyle: { areaColor: '#ffab91' },
          label: { show: true, color: '#fff' }
        }
      }
    });
  });
```

#### 18.5.3 Leaflet 交互地图（OpenStreetMap 实景瓦片）

```javascript
// 初始化 + OpenStreetMap 免费瓦片（无需 Token）
const map = L.map('map').setView([34.5, 108], 4);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap', maxZoom: 18
}).addTo(map);

// 加载 GeoJSON 并添加交互
fetch('../data/geography/modern-china/provinces.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: '#1890ff', weight: 2, fillColor: '#91d5ff', fillOpacity: 0.3 },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => alert(`你点击了：${feature.properties.name}`));
      }
    }).addTo(map);
  });
```

#### 18.5.4 朝代疆域展示 + 数据联动（⭐ Leaflet + Hillshade 标准实现）

```javascript
// ⭐ v5.18：历史疆域课件统一用 Leaflet 实现，底图与疆域、城市点完全同步缩放
const map = L.map('qin-map', { crs: L.CRS.EPSG4326, minZoom: 3, maxZoom: 8 });

// 1) Hillshade 底图
L.imageOverlay(
  '../../data/geography/hillshade/global-color-hillshade-4k.jpg',
  [[-90, -180], [90, 180]]
).addTo(map);

// 2) 疆域 GeoJSON + 朝代数据联动
Promise.all([
  fetch('../../data/geography/historical-china/qin-dynasty.geojson').then(r => r.json()),
  fetch('../../data/history/timelines/dynasties-detailed.json').then(r => r.json())
]).then(([qinGeo, dynasties]) => {
  const qin = dynasties.find(d => d.key === 'qin');

  // 疆域填色
  L.geoJSON(qinGeo, {
    style: { color: '#d4a574', weight: 2, fillColor: '#3CB371', fillOpacity: 0.35 }
  }).addTo(map);

  // 重要地标（都城、关隘、长城起止点等）
  qin.landmarks.forEach(lm => {
    L.marker([lm.lat, lm.lng], {
      icon: L.divIcon({
        className: 'dynasty-pin',
        html: `<div style="background:#fbbf24;color:#1e293b;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:bold">${lm.name}</div>`,
        iconSize: [null, null]
      })
    }).addTo(map).bindPopup(`<strong>${lm.name}</strong><br/>${lm.desc || ''}`);
  });

  // 标题
  L.control({ position: 'topleft' }).onAdd = function() {
    const div = L.DomUtil.create('div', 'dynasty-title');
    div.innerHTML = `<div style="background:rgba(15,23,42,0.9);color:#fbbf24;padding:8px 16px;border-radius:8px;font-weight:bold">秦朝疆域（${qin.period}）</div>`;
    return div;
  };

  // 3) ⛔ 必做：fitBounds 聚焦秦朝核心辖区
  const qinBounds = L.latLngBounds([[20, 95], [42, 125]]);  // 秦疆域核心
  map.fitBounds(qinBounds, { padding: [20, 20] });
});
```

#### 18.5.5 朝代更替 Timeline

```javascript
fetch('../data/history/timelines/chinese-dynasties.json')
  .then(res => res.json())
  .then(dynasties => {
    chart.setOption({
      timeline: {
        axisType: 'category',
        data: dynasties.map(d => d.name),
        playInterval: 3000,
        autoPlay: true
      },
      options: dynasties.map(d => ({
        title: { text: `${d.name}（${d.start_year}~${d.end_year}）`, subtext: `都城：${d.capital}` },
        geo: { map: d.id, itemStyle: { areaColor: d.color } }
      }))
    });
  });
```

### 18.6 3D 地形集成规范（内联自 `terrain-3d-integration.md`）

#### 18.6.1 3D 地形强制使用场景

| 学科 | 场景类型 | 典型知识点 | 地形作用 |
|:---|:---|:---|:---|
| **历史** | 军事战役分析 | 长平之战、赤壁之战、淝水之战 | 展示地形优劣对战局的决定性影响 |
| **历史** | 古代交通路线 | 丝绸之路、茶马古道、蜀道 | 解释"蜀道难，难于上青天"的地理原因 |
| **历史** | 防御工程选址 | 长城、函谷关、剑门关 | 理解"一夫当关，万夫莫开"的地形依据 |
| **地理** | 河流地貌 | 长江三峡、雅鲁藏布大峡谷 | 观察河流侵蚀与峡谷形成 |
| **地理** | 山地地貌 | 喜马拉雅山脉、黄土高原、云贵高原 | 理解板块运动、水土流失 |
| **地理** | 城市选址 | 山地城市（重庆）、河谷城市（兰州） | 分析地形对城市布局的影响 |
| **地理** | 交通规划 | 川藏公路、青藏铁路、京杭大运河 | 理解工程如何克服地形障碍 |

**推荐但非强制**：农业地理（梯田分布）、气候地理（迎风坡/背风坡）、区域地理（盆地特征）。

**不适合 3D 地形**：纯概念讲解（等高线定义）、政治地图（行政区划）、抽象地理模型（地球自转/公转）。

#### 18.6.2 地形夸张倍数（exaggeration）

| 倍数 | 适用场景 | 效果 |
|:---:|:---|:---|
| **0.5–1** | 真实地形、城市规划 | 接近真实比例，视觉平缓 |
| **1–1.5** | 经济地理、河流地貌 | 略微夸张，便于观察地势 |
| **1.5–2** | 军事地理、山地地貌 | 明显夸张，突出高差 |
| **2–3** | 极端地貌、教学演示 | 高度夸张，强化视觉冲击 |

**推荐值**: 军事战役 `1.8`，经济交通 `1.5`，自然地貌 `2.5`。

#### 18.6.3 视角参数

| 参数 | 范围 | 说明 | 推荐值 |
|:---|:---|:---|:---|
| **pitch** | 0–85° | 倾斜角度（0=俯视，85=近平视） | 60–70° |
| **bearing** | 0–360° | 旋转角度（0=正北） | 根据地形走向调整 |
| **zoom** | 0–22 | 缩放级别（越大越近） | 战役: 12–14，区域: 8–10 |

#### 18.6.4 交互增强（可选）

```javascript
// 地形开关按钮
let terrainEnabled = true;
function toggleTerrain() {
  terrainEnabled = !terrainEnabled;
  map.setTerrain(terrainEnabled ?
    { source: 'terrain', exaggeration: 1.5 } : null);
}

// 夸张滑块
function setExaggeration(value) {
  map.setTerrain({ source: 'terrain', exaggeration: parseFloat(value) });
}

// 视角预设切换
const presetViews = {
  overview: { pitch: 0, bearing: 0, zoom: 8 },
  sideView: { pitch: 70, bearing: 90, zoom: 12 },
  closeUp: { pitch: 60, bearing: 45, zoom: 14 }
};
function switchView(name) {
  map.easeTo({ ...presetViews[name], duration: 1500 });
}
```

#### 18.6.5 移动端降级

```javascript
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const lowPower = navigator.hardwareConcurrency < 4;

if (isMobile || lowPower) {
  map.setTerrain({ source: 'terrain', exaggeration: 1 }); // 降低夸张
  if (map.getLayer('sky')) map.removeLayer('sky');          // 关闭天空层
}
```

### 18.7 参考文档与扩展资源

**项目内参考文档**（完整版）：
- 地图资源使用指南：`skill/map-resources-guide.md`
- 3D 地形集成规范：`skill/terrain-3d-integration.md`

**示范课件**：
- TeachAny Gallery: https://weponusa.github.io/teachany/
- 中国地图交互模板: `data/geography/templates/china-base-map.html`

**外部参考**：
- GeoJSON 规范: https://geojson.org/
- ECharts 地图文档: https://echarts.apache.org/handbook/zh/concepts/geo
- Leaflet 文档: https://leafletjs.com/
- CHGIS (Harvard): https://chgis.fas.harvard.edu/
- Natural Earth: https://www.naturalearthdata.com/
- Mapshaper Web: https://mapshaper.org/
- GeoJSON.io: https://geojson.io/

---
