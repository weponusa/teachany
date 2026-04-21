# 全球地形底图（Hillshade + Color Relief）

## 数据来源

| 类型 | 数据集 | 来源 | 许可证 |
|:---|:---|:---|:---|
| **灰度阴影** | Natural Earth SR (Shaded Relief) | SRTM Plus 降采样 | Public Domain |
| **彩色地形** | Natural Earth HYP (Cross-blended Hypsometric Tints) | 气候分层设色 + 阴影 | Public Domain |

- 官网：https://www.naturalearthdata.com/downloads/10m-raster-data/
- 原始分辨率：21600 × 10800 像素
- 处理日期：2026-04-16

## 文件清单

### 灰度阴影地形（Hillshade）

| 文件名 | 分辨率 | 大小 | 适用场景 |
|:---|:---|:---|:---|
| `global-hillshade-8k.jpg` | 8192 × 4096 | 2.3 MB | 高质量底图、大屏展示 |
| `global-hillshade-4k.jpg` | 4096 × 2048 | 586 KB | 标准课件底图（推荐） |
| `global-hillshade-2k.jpg` | 2048 × 1024 | 114 KB | 快速加载 / 缩略图 |

### 彩色地形（Color Relief）

| 文件名 | 分辨率 | 大小 | 适用场景 |
|:---|:---|:---|:---|
| `global-color-relief-8k.jpg` | 8192 × 4096 | 1.7 MB | 高质量彩色底图、大屏展示 |
| `global-color-relief-4k.jpg` | 4096 × 2048 | 573 KB | 标准课件彩色底图（推荐） |
| `global-color-relief-2k.jpg` | 2048 × 1024 | 167 KB | 快速加载 / 缩略图 |

### 彩色阴影地形（Color Hillshade）⭐ 推荐

彩色地形 × 灰度阴影 Multiply 融合，兼具颜色信息和立体阴影感。

| 文件名 | 分辨率 | 大小 | 适用场景 |
|:---|:---|:---|:---|
| `global-color-hillshade-8k.jpg` | 8192 × 4096 | 3.3 MB | 高质量课件底图、大屏展示 |
| `global-color-hillshade-4k.jpg` | 4096 × 2048 | 828 KB | **标准课件底图（最佳推荐）** |
| `global-color-hillshade-2k.jpg` | 2048 × 1024 | 199 KB | 快速加载 / 缩略图 |

## 颜色说明

### 灰度阴影版
- 纯灰度，山脉和高原显示为深色阴影
- 适合叠加其他数据层（GeoJSON 疆域、标注等）
- 不干扰上层数据的颜色

### 彩色版（Cross-blended Hypsometric Tints）
- 湿润低地 = 绿色，干旱低地 = 棕色
- 高山 = 灰白色，冰川 = 白色
- 海洋 = 蓝色
- 颜色随气候带和海拔自然过渡，是教学用最经典的彩色地形图

## 使用方法

### 作为 CSS 背景
```css
/* 灰度版 */
.map-container { background-image: url('../../data/geography/hillshade/global-hillshade-4k.jpg'); }

/* 彩色版 */
.map-container { background-image: url('../../data/geography/hillshade/global-color-relief-4k.jpg'); }
```

### 作为 Canvas 底图
```javascript
const relief = new Image();
relief.src = '../../data/geography/hillshade/global-color-relief-4k.jpg';
relief.onload = () => ctx.drawImage(relief, 0, 0, canvas.width, canvas.height);
```

### 作为 Leaflet 图层
```javascript
L.imageOverlay(
  '../../data/geography/hillshade/global-color-relief-4k.jpg',
  [[-90, -180], [90, 180]]
).addTo(map);
```

## 坐标说明

所有图片使用 **等距圆柱投影**（Equirectangular / Plate Carrée）：
- 左边缘 = 180°W，右边缘 = 180°E
- 上边缘 = 90°N，下边缘 = 90°S
- 像素→经纬度：`lon = (x / width) * 360 - 180`，`lat = 90 - (y / height) * 180`
