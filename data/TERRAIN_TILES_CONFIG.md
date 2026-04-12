
# 本地 Terrain Tiles 配置

## 1. 启动简单 HTTP 服务器（Python）

```bash
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data
python3 -m http.server 8000
```

## 2. MapLibre GL 配置

```javascript
map.addSource('terrain', {
  type: 'raster-dem',
  tiles: ['http://localhost:8000/terrain-tiles/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  minzoom: 4,
  maxzoom: 8
});

map.setTerrain({ source: 'terrain', exaggeration: 2.5 });

map.addLayer({
  id: 'hillshade',
  type: 'hillshade',
  source: 'terrain',
  paint: {
    'hillshade-exaggeration': 0.5,
    'hillshade-shadow-color': '#473B24'
  }
});
```

## 3. 数据覆盖范围

- **地理范围**: 中国全境（73°E-135°E, 18°N-54°N）
- **缩放级别**: 4-8（适合历史地理课件）
- **数据格式**: Terrarium（RGB 编码高程）
- **高程精度**: 30m 分辨率，0.1m 高程精度

## 4. 高程解码公式

```javascript
// Terrarium 格式：RGB 三个通道编码高程
height = (red * 256 + green + blue / 256) - 32768  // 单位：米
```
