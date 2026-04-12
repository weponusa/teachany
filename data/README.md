# TeachAny 地理历史数据集

**版本**: v1.1  
**数据总大小**: ~46 MB（不含 DEM 地形）  
**覆盖范围**: 中国 + 全球基础数据 + 历史疆域战役  
**最后更新**: 2026-04-12

---

## 🚀 快速开始

### 核心数据文件（⭐ 标记）

#### 地理数据（底图）
```javascript
// 1. 中国河流（长江、黄河等）
fetch('/data/geography/rivers/ne_10m_rivers_china.json')

// 2. 中国湖泊（青海湖、鄱阳湖等）
fetch('/data/geography/lakes/ne_10m_lakes_china.json')

// 3. 中国海岸线
fetch('/data/geography/coastline/ne_10m_coastline_china.json')

// 4. 中国省级行政区划（35个省级）
fetch('/data/geography/admin-boundaries/china-provinces.json')

// 5. 世界国家边界（241个国家）
fetch('/data/geography/admin-boundaries/ne_50m_admin_0_countries.json')
```

#### 历史数据（核心）⭐ 新增
```javascript
// 6. 朝代疆域（秦/汉/唐/宋/元/明/清）
fetch('/data/history/dynasties/qin-dynasty.geojson')

// 7. 历史战役地点（30个重要战役）
fetch('/data/history/battles/major-battles.geojson')

// 8. 历代都城（25个都城）
fetch('/data/history/cities/ancient-capitals.geojson')

// 9. 战略要地（20个关隘）
fetch('/data/history/cities/strategic-locations.geojson')
```

#### 3D 地形（混合加载）⭐ 推荐
```javascript
// 10. DEM 地形（本地 Z4-Z6 + 在线 Z7+）
map.addSource('terrain', {
  type: 'raster-dem',
  tiles: [
    '/data/terrain-tiles/{z}/{x}/{y}.png',      // 本地（32 MB）
    'https://s3.amazonaws.com/.../terrarium/{z}/{x}/{y}.png'  // 在线回退
  ],
  encoding: 'terrarium'
});
```

**DEM 地形设置**: 参见 [`README_TERRAIN.md`](README_TERRAIN.md)

---

## 📁 目录结构

```
data/
├─ geography/                          # 地理数据（38.48 MB）
│  ├─ rivers/
│  │  ├─ ne_10m_rivers_china.json     ⭐ 中国河流 (4.58 MB, 233条)
│  │  └─ ne_10m_rivers_lake_centerlines.json  # 全球河流（备份）
│  ├─ lakes/
│  │  ├─ ne_10m_lakes_china.json      ⭐ 中国湖泊 (1.39 MB, 196个)
│  │  └─ ne_10m_lakes.json            # 全球湖泊（备份）
│  ├─ coastline/
│  │  ├─ ne_10m_coastline_china.json  ⭐ 中国海岸线 (2.85 MB, 273段)
│  │  └─ ne_10m_coastline.json        # 全球海岸线（备份）
│  └─ admin-boundaries/
│     ├─ china-provinces.json         ⭐ 中国省级区划 (569 KB, 35个)
│     ├─ china-cities.json            # 中国轮廓（简化版）
│     └─ ne_50m_admin_0_countries.json ⭐ 世界国家边界 (4.46 MB, 241个)
├─ history/                            # 历史数据（7.72 MB）⭐ 新增
│  ├─ dynasties/                       ⭐ 历朝疆域（9个朝代，7.67 MB）
│  │  ├─ qin-dynasty.geojson          ⭐ 秦朝 (926 KB, 183个行政区)
│  │  ├─ west-han-dynasty.geojson     ⭐ 西汉 (936 KB, 233个)
│  │  ├─ east-han-dynasty.geojson     ⭐ 东汉 (1.13 MB, 440个)
│  │  ├─ tang-dynasty.geojson         ⭐ 唐朝 (954 KB, 225个)
│  │  ├─ north-song-dynasty.geojson   ⭐ 北宋 (6.19 KB, 15路) ⭐ 新增
│  │  ├─ south-song-dynasty.geojson   ⭐ 南宋 (5.87 KB, 14路) ⭐ 新增
│  │  ├─ yuan-dynasty.geojson         ⭐ 元朝 (998 KB, 237个)
│  │  ├─ ming-dynasty.geojson         ⭐ 明朝 (1.01 MB, 233个)
│  │  └─ qing-dynasty.geojson         ⭐ 清朝 (1.80 MB, 627个)
│  ├─ battles/                         ⭐ 历史战役（53.4 KB）⭐ 新增
│  │  └─ major-battles.geojson        ⭐ 30个重要战役（前260-1948年）
│  ├─ cities/                          ⭐ 历史城市（22.2 KB）⭐ 新增
│  │  ├─ ancient-capitals.geojson     ⭐ 25个历代都城
│  │  └─ strategic-locations.geojson  ⭐ 20个战略要地（关隘、渡口、军镇）
│  ├─ routes/                          # 历史路线（待补充）
│  └─ DYNASTIES_CATALOG.md             # 朝代疆域数据清单
├─ terrain-tiles/                      # DEM 地形瓦片（可选，32 MB）⭐ 新增
│  ├─ 4/                               # Z4：中国全境概览
│  ├─ 5/                               # Z5：省级地形
│  └─ 6/                               # Z6：市级地形
├─ DATA_CATALOG.md                     # 📖 完整数据目录（详细文档）
├─ README.md                           # 本文件
├─ README_TERRAIN.md                   # 🗻 DEM 地形快速参考 ⭐ 新增
├─ process_china_data.py               # 数据提取脚本
├─ show_data_stats.py                  # 数据统计脚本
├─ analyze_dynasties.py                # 历朝疆域分析脚本
└─ download_terrain_tiles.py           # DEM 地形下载脚本 ⭐ 新增
```

---

## 📊 数据统计

| 类别 | 文件 | 大小 | 要素数 | 覆盖范围 |
|:---|:---|:---:|:---:|:---|
| **中国河流** | `ne_10m_rivers_china.json` | 4.58 MB | 233 | 长江、黄河、珠江等 |
| **中国湖泊** | `ne_10m_lakes_china.json` | 1.39 MB | 196 | 青海湖、鄱阳湖等 |
| **中国海岸线** | `ne_10m_coastline_china.json` | 2.85 MB | 273 | 东部海岸 + 岛屿 |
| **中国省份** | `china-provinces.json` | 569 KB | 35 | 34省 + 港澳台 |
| **世界国家** | `ne_50m_admin_0_countries.json` | 4.46 MB | 241 | 全球国家边界 |
| **秦朝疆域** | `qin-dynasty.geojson` | 926 KB | 183 | 秦朝行政区划 |
| **西汉疆域** | `west-han-dynasty.geojson` | 936 KB | 233 | 西汉行政区划 |
| **东汉疆域** | `east-han-dynasty.geojson` | 1.13 MB | 440 | 东汉行政区划 |
| **唐朝疆域** | `tang-dynasty.geojson` | 954 KB | 225 | 唐朝行政区划 |
| **元朝疆域** | `yuan-dynasty.geojson` | 998 KB | 237 | 元朝行政区划 |
| **明朝疆域** | `ming-dynasty.geojson` | 1.01 MB | 233 | 明朝行政区划 |
| **清朝疆域** | `qing-dynasty.geojson` | 1.80 MB | 627 | 清朝行政区划 |
| **总计** | - | **21.52 MB** | **2,925** | - |

> 注: 全球原始数据（备份文件）共 46.11 MB，包含在统计中但通常不直接使用。

---

## 🛠️ 工具脚本

### 1. 数据统计脚本

显示所有数据文件的详细信息:

```bash
python3 show_data_stats.py
```

输出示例:
```
📂 河流数据
📄 ne_10m_rivers_china.json
   大小: 4.58 MB
   要素数: 233
   几何类型: LineString(168), MultiLineString(65)
   数据来源: Natural Earth v5.0.0
   中国要素: 233/1455 (16.0%)
```

### 2. 数据提取脚本

从全球数据中提取特定区域数据:

```bash
python3 process_china_data.py
```

功能:
- 从 Natural Earth 全球数据中提取中国范围内的要素
- 自动添加 metadata 元数据
- 输出优化后的 GeoJSON 文件

---

## 📖 使用示例

### 示例 1: 在 MapLibre GL 中显示中国河流

```javascript
const map = new maplibregl.Map({
  container: 'map',
  center: [110, 35],
  zoom: 4
});

map.on('load', () => {
  // 加载中国河流数据
  fetch('/data/geography/rivers/ne_10m_rivers_china.json')
    .then(res => res.json())
    .then(data => {
      map.addSource('china-rivers', {
        type: 'geojson',
        data: data
      });
      
      map.addLayer({
        id: 'rivers',
        type: 'line',
        source: 'china-rivers',
        paint: {
          'line-color': '#1976d2',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            4, 0.5,  // zoom 4 时 0.5px
            8, 2     // zoom 8 时 2px
          ]
        }
      });
    });
});
```

### 示例 2: 在 ECharts 中显示中国省份

```javascript
fetch('/data/geography/admin-boundaries/china-provinces.json')
  .then(res => res.json())
  .then(geoJson => {
    echarts.registerMap('china', geoJson);
    
    const chart = echarts.init(document.getElementById('map'));
    chart.setOption({
      series: [{
        type: 'map',
        map: 'china',
        roam: true,
        itemStyle: {
          areaColor: '#f3f3f3',
          borderColor: '#516b91'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#ffd700'
          }
        }
      }]
    });
  });
```

### 示例 3: 显示数据元数据

```javascript
fetch('/data/geography/rivers/ne_10m_rivers_china.json')
  .then(res => res.json())
  .then(data => {
    const meta = data.metadata;
    console.log('数据来源:', meta.dataSource);
    console.log('原始URL:', meta.sourceUrl);
    console.log('处理日期:', meta.processedDate);
    console.log('中国要素数:', meta.chinaFeatures);
    console.log('全球总数:', meta.originalFeatures);
  });
```

---

## 🔄 数据来源

| 数据源 | 类型 | 许可证 | 下载地址 |
|:---|:---|:---|:---|
| **Natural Earth** | 河流、湖泊、海岸线、国家边界 | Public Domain | https://www.naturalearthdata.com/ |
| **DataV (阿里云)** | 中国行政区划 | 开放数据 | https://geo.datav.aliyun.com/ |
| **CHGIS V6** | 中国历史疆域、城市（待补充） | 学术免费 | https://chgis.fas.harvard.edu/ |

---

## ✅ 数据质量保证

所有数据文件均包含 `metadata` 字段,记录:
- ✅ 数据来源 (`dataSource`)
- ✅ 原始 URL (`sourceUrl`)
- ✅ 处理日期 (`processedDate`)
- ✅ 要素数量统计 (`originalFeatures`, `chinaFeatures`)
- ✅ 过滤条件 (`filterBbox`)

示例 metadata:
```json
{
  "metadata": {
    "title": "中国区域 ne_10m_rivers_lake_centerlines",
    "dataSource": "Natural Earth v5.0.0",
    "sourceUrl": "https://github.com/martynafford/natural-earth-geojson",
    "filterBbox": {
      "min_lon": 73.0,
      "max_lon": 135.0,
      "min_lat": 18.0,
      "max_lat": 54.0
    },
    "processedBy": "TeachAny Data Processor",
    "processedDate": "2026-04-12",
    "originalFeatures": 1455,
    "chinaFeatures": 233
  }
}
```

---

## 🚧 待补充数据

以下数据计划在后续版本中添加（按 K12 课程需求排序）:

### 高优先级（近期）
- [ ] 宋朝疆域（数据文件损坏，需重新获取）
- [ ] 主要历史战役地点（长平之战、赤壁之战等）

### 中优先级（中期）
- [ ] 丝绸之路（陆上 + 海上）
- [ ] 大运河路线
- [ ] 郑和下西洋航线
- [ ] 中国主要山脉（喜马拉雅、昆仑、秦岭等）
- [ ] CHGIS 历史城市数据

### 低优先级（长期）
- [ ] 世界历史数据（古罗马、蒙古帝国等）
- [ ] 红军长征路线
- [ ] 抗日战争战役地点

---

## 📚 相关文档

- **DATA_CATALOG.md**: 完整数据目录（包含每个文件的详细说明）
- **TeachAny Skill v5.12**: 数据使用规范和最佳实践
- **v5.12-update-summary.md**: v5.12 版本更新说明

---

## 🔗 有用的工具

- **Mapshaper Web**: https://mapshaper.org/ - 可视化编辑 GeoJSON
- **GeoJSON.io**: https://geojson.io/ - 在线查看/绘制 GeoJSON
- **QGIS**: https://qgis.org/ - 专业 GIS 软件（免费开源）

---

## 💡 最佳实践

1. **优先使用中国区域数据**（`*_china.json`）:
   - 文件更小，加载更快
   - 要素更少，渲染更流畅
   - 已过滤无关数据

2. **检查 metadata**:
   ```javascript
   const meta = data.metadata;
   if (meta.dataSource !== 'Natural Earth v5.0.0') {
     console.warn('数据来源不匹配!');
   }
   ```

3. **使用适当的缩放级别**:
   - 全国地图: zoom 4-6
   - 省级地图: zoom 6-9
   - 市级地图: zoom 9-12

4. **缓存数据**:
   ```javascript
   const dataCache = new Map();
   
   async function loadData(url) {
     if (dataCache.has(url)) {
       return dataCache.get(url);
     }
     const data = await fetch(url).then(r => r.json());
     dataCache.set(url, data);
     return data;
   }
   ```

---

## 🐛 问题反馈

如果您发现数据错误或有新的数据需求,请:
1. 检查 `DATA_CATALOG.md` 确认数据来源
2. 访问原始数据源验证
3. 提交 Issue 并附上截图和坐标

---

**维护**: TeachAny Team  
**更新周期**: 每季度同步上游数据源  
**最后检查**: 2026-04-12
