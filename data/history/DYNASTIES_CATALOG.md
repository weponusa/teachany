# 中国历朝疆域数据清单

**数据来源**: 中国历史地理信息系统（CHGIS）/ 历史地图集  
**数据格式**: GeoJSON  
**坐标系统**: WGS84 (EPSG:4326)  
**更新日期**: 2026-04-12

---

## 📚 已收录朝代

| 朝代 | 文件名 | 大小 | 要素数 | 几何类型 | 时期 |
|:---|:---|:---:|:---:|:---|:---|
| Qin | `qin-dynasty.geojson` | 926.42 KB | 183 | MultiPolygon(183) | 前221-前206 |
| West Han | `west-han-dynasty.geojson` | 936.22 KB | 233 | MultiPolygon(233) | 前206-公元8 |
| East Han | `east-han-dynasty.geojson` | 1.13 MB | 440 | MultiPolygon(440) | 25-220 |
| Tang | `tang-dynasty.geojson` | 954.37 KB | 225 | MultiPolygon(225) | 618-907 |
| Yuan | `yuan-dynasty.geojson` | 997.70 KB | 237 | MultiPolygon(237) | 1271-1368 |
| Ming | `ming-dynasty.geojson` | 1.01 MB | 233 | MultiPolygon(233) | 1368-1644 |
| Qing | `qing-dynasty.geojson` | 1.80 MB | 627 | MultiPolygon(627) | 1644-1911 |
| North Song | `north-song-dynasty.geojson` | 6.19 KB | 15 | Polygon(15) | - |
| South Song | `south-song-dynasty.geojson` | 5.87 KB | 14 | Polygon(14) | - |

---

## 📖 数据说明

### 数据结构

所有朝代疆域文件采用标准 GeoJSON 格式:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "dynasty": "qin",
    "year": -221,
    "capital": [108.9, 34.3]
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "关中郡",
        "type": "prefecture"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

### 属性字段

各朝代数据可能包含以下属性字段:
- `name`: 行政区划名称
- `type`: 类型（prefecture/county/commandery）
- `capital`: 首都坐标
- `dynasty`: 朝代标识
- `year`: 年份

---

## 🎓 K12 课程应用场景

### 初中历史（7-9 年级）
- ✅ 秦统一六国（前221年）
- ✅ 汉朝疆域演变（西汉、东汉）
- ✅ 唐朝全盛时期疆域（贞观之治）

### 高中历史（10-12 年级）
- ✅ 宋辽金夏对峙格局
- ✅ 元朝疆域（中国历史上最大版图）
- ✅ 明清疆域对比
- ✅ 清朝最大疆域（康乾盛世）

---

## 💻 使用示例

### 在 MapLibre GL 中显示秦朝疆域

```javascript
fetch('/data/history/dynasties/qin-dynasty.geojson')
  .then(res => res.json())
  .then(data => {
    map.addSource('qin-boundary', {
      type: 'geojson',
      data: data
    });
    
    map.addLayer({
      id: 'qin-territory',
      type: 'fill',
      source: 'qin-boundary',
      paint: {
        'fill-color': '#6a1b9a',
        'fill-opacity': 0.3
      }
    });
    
    map.addLayer({
      id: 'qin-border',
      type: 'line',
      source: 'qin-boundary',
      paint: {
        'line-color': '#6a1b9a',
        'line-width': 2
      }
    });
  });
```

### 朝代疆域对比（左右分屏）

```javascript
// 左侧地图: 秦朝
const map1 = new maplibregl.Map({
  container: 'map-qin',
  center: [110, 35],
  zoom: 4
});

// 右侧地图: 清朝
const map2 = new maplibregl.Map({
  container: 'map-qing',
  center: [110, 35],
  zoom: 4
});

// 同步加载两个朝代疆域
Promise.all([
  fetch('/data/history/dynasties/qin-dynasty.geojson').then(r => r.json()),
  fetch('/data/history/dynasties/qing-dynasty.geojson').then(r => r.json())
]).then(([qinData, qingData]) => {
  // 添加到对应地图
  map1.addSource('territory', { type: 'geojson', data: qinData });
  map2.addSource('territory', { type: 'geojson', data: qingData });
  
  // 相同的样式配置
  [map1, map2].forEach(map => {
    map.addLayer({
      id: 'fill',
      type: 'fill',
      source: 'territory',
      paint: { 'fill-color': '#6a1b9a', 'fill-opacity': 0.3 }
    });
  });
});
```

---

## 🔗 相关资源

- **CHGIS 官网**: https://chgis.fas.harvard.edu/
- **中国历史地图集**: 谭其骧主编
- **复旦大学历史地理研究中心**: https://yugong.fudan.edu.cn/

---

**维护**: TeachAny Team  
**最后更新**: 2026-04-12
