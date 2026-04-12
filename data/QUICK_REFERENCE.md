# TeachAny 历史地理数据快速参考

**版本**: v1.1 | **更新**: 2026-04-12 | **状态**: ✅ 生产可用

---

## 📦 数据概览

```
21 个 GeoJSON 文件 | 46.20 MB | 8,548 个要素 | 100% 覆盖 K12
```

---

## 🗂️ 数据分类

### 历史数据（核心）

| 类型 | 文件路径 | 数量 | 适用 |
|:---|:---|:---:|:---|
| **朝代疆域** | `history/dynasties/*.geojson` | 9 | 初高中历史 |
| **历史战役** | `history/battles/major-battles.geojson` | 30 | 初高中历史 |
| **历代都城** | `history/cities/ancient-capitals.geojson` | 25 | 初高中历史 |
| **战略要地** | `history/cities/strategic-locations.geojson` | 20 | 高中历史 |

### 地理数据（底图）

| 类型 | 文件路径 | 范围 |
|:---|:---|:---|
| **河流** | `geography/rivers/ne_10m_rivers_china.json` | 中国区域 233 条 |
| **湖泊** | `geography/lakes/ne_10m_lakes_china.json` | 中国区域 196 个 |
| **海岸线** | `geography/coastline/ne_10m_coastline_china.json` | 中国区域 273 段 |
| **省级边界** | `geography/admin-boundaries/china-provinces.json` | 35 个省级 |
| **国家边界** | `geography/admin-boundaries/ne_50m_admin_0_countries.json` | 全球 241 个 |

---

## 🚀 快速上手

### 1. 加载 3D 地形 + 历史疆域

```javascript
const map = new maplibregl.Map({
  container: 'map',
  center: [110, 35],
  zoom: 5,
  pitch: 60
});

map.on('load', () => {
  // 加载 3D 地形
  map.addSource('terrain', {
    type: 'raster-dem',
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    encoding: 'terrarium'
  });
  map.setTerrain({ source: 'terrain', exaggeration: 2.5 });
  
  // 加载秦朝疆域
  fetch('/data/history/dynasties/qin-dynasty.geojson')
    .then(res => res.json())
    .then(data => {
      map.addSource('qin', { type: 'geojson', data });
      map.addLayer({
        id: 'qin-fill',
        type: 'fill',
        source: 'qin',
        paint: { 'fill-color': '#6a1b9a', 'fill-opacity': 0.3 }
      });
    });
});
```

### 2. 加载战役地点标注

```javascript
fetch('/data/history/battles/major-battles.geojson')
  .then(res => res.json())
  .then(data => {
    map.addSource('battles', { type: 'geojson', data });
    map.addLayer({
      id: 'battle-icons',
      type: 'symbol',
      source: 'battles',
      layout: {
        'icon-image': 'battle-icon',
        'text-field': ['get', 'name']
      }
    });
  });
```

### 3. 加载河流水系

```javascript
fetch('/data/geography/rivers/ne_10m_rivers_china.json')
  .then(res => res.json())
  .then(data => {
    map.addSource('rivers', { type: 'geojson', data });
    map.addLayer({
      id: 'rivers-line',
      type: 'line',
      source: 'rivers',
      paint: { 'line-color': '#1976d2', 'line-width': 2 }
    });
  });
```

---

## 🔍 数据筛选技巧

### 按年级筛选战役

```javascript
fetch('/data/history/battles/major-battles.geojson')
  .then(res => res.json())
  .then(data => {
    // 筛选初中历史战役
    const juniorBattles = data.features.filter(f => f.properties.grade === '初中');
    
    // 筛选高中历史战役
    const seniorBattles = data.features.filter(f => f.properties.grade === '高中');
  });
```

### 按朝代筛选战役

```javascript
// 筛选三国时期战役
const threeKingdomsBattles = data.features.filter(f => 
  f.properties.dynasty === '东汉末' || f.properties.dynasty === '三国'
);
```

### 按时间排序战役

```javascript
// 按年份升序排列
const sortedBattles = data.features.sort((a, b) => 
  a.properties.year - b.properties.year
);
```

---

## 📐 坐标精度参考

| 数据类型 | 精度 | 误差 | 用途 |
|:---|:---|:---:|:---|
| 朝代疆域 | 行政区划级 | ±10-20km | 疆域演变演示 |
| 历史战役 | 县级 | ±5km | 战役地点标注 |
| 历史名城 | 市级 | ±2km | 都城标注 |
| 战略要地 | 县级 | ±3km | 关隘标注 |

---

## 🎨 推荐配色方案

### 朝代疆域配色

```javascript
const dynastyColors = {
  'qin': '#6a1b9a',       // 紫色
  'west-han': '#1976d2',  // 蓝色
  'east-han': '#1976d2',  // 蓝色
  'tang': '#f57c00',      // 橙色
  'north-song': '#388e3c',// 绿色
  'south-song': '#689f38',// 浅绿
  'yuan': '#c62828',      // 红色
  'ming': '#d32f2f',      // 深红
  'qing': '#7b1fa2'       // 深紫
};
```

### 战役图标配色

```javascript
const battleColors = {
  '秦胜': '#6a1b9a',
  '汉胜': '#1976d2',
  '唐胜': '#f57c00',
  '宋胜': '#388e3c',
  '明胜': '#d32f2f',
  '清胜': '#7b1fa2',
  '革命军胜': '#c62828'
};
```

---

## 📚 常用属性字段

### 朝代疆域数据

```json
{
  "properties": {
    "NAME": "关中郡",        // 行政区划名称
    "TYPE": "prefecture",    // 类型
    "CAPITAL": "咸阳",       // 首府（北宋/南宋数据）
    "NOTES": "说明文字"      // 备注（北宋/南宋数据）
  }
}
```

### 历史战役数据

```json
{
  "properties": {
    "name": "长平之战",
    "dynasty": "战国",
    "date": "-260-05",
    "year": -260,
    "belligerents": ["秦", "赵"],
    "commanders": ["白起", "赵括"],
    "result": "秦胜",
    "significance": "战国七雄格局改变",
    "grade": "初中",
    "chapterRef": "战国争雄"
  }
}
```

### 历史名城数据

```json
{
  "properties": {
    "name": "长安",
    "modernName": "西安市",
    "dynasty": "西汉、唐",
    "period": "前202-公元8, 618-907",
    "type": "都城",
    "significance": "汉唐都城，丝绸之路起点",
    "grade": "初中/高中",
    "population": "约100万（唐盛期）"
  }
}
```

---

## ⚡ 性能优化建议

### 1. 数据分层加载

```javascript
// 先加载疆域（大文件）
map.on('load', () => {
  loadTerritory();  // 1-2 秒
});

// 疆域加载完成后再加载战役（小文件）
map.on('sourcedata', (e) => {
  if (e.sourceId === 'territory' && e.isSourceLoaded) {
    loadBattles();  // < 0.5 秒
  }
});
```

### 2. 使用 Simplify 简化边界

```javascript
// 对于缩放级别较低的地图，简化疆域边界
if (map.getZoom() < 6) {
  // 使用 turf.js 简化
  const simplified = turf.simplify(data, { tolerance: 0.01 });
  map.getSource('territory').setData(simplified);
}
```

### 3. 按需加载

```javascript
// 只加载用户当前查看的朝代
function loadDynasty(dynastyName) {
  fetch(`/data/history/dynasties/${dynastyName}-dynasty.geojson`)
    .then(res => res.json())
    .then(data => { /* 添加到地图 */ });
}
```

---

## 🛠️ 常用工具

### 分析朝代数据

```bash
python3 data/analyze_dynasties.py
```

### 统计所有数据

```bash
python3 data/show_data_stats.py
```

### 从全球数据提取中国区域

```bash
python3 data/process_china_data.py
```

---

## 🔗 相关链接

- **完整文档**: [DATA_CATALOG.md](DATA_CATALOG.md)
- **详细总结**: [FINAL_SUMMARY.md](FINAL_SUMMARY.md)
- **更新日志**: [数据补充完成总结.md](数据补充完成总结.md)
- **朝代清单**: [history/DYNASTIES_CATALOG.md](history/DYNASTIES_CATALOG.md)

---

## 📞 技术支持

- **GitHub**: https://github.com/teachany/teachany-opensource
- **Issues**: https://github.com/teachany/teachany-opensource/issues
- **Email**: team@teachany.com

---

**最后更新**: 2026-04-12  
**维护者**: TeachAny Team
