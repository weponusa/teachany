# DEM 地形数据离线化指南

**重要性**: ⭐⭐⭐⭐⭐ 历史地理教学核心底图  
**状态**: ⚠️ 当前依赖在线服务（AWS S3）  
**目标**: ✅ 完全离线化

---

## 🎯 为什么必须离线化？

### 现状问题
- ❌ AWS Terrain Tiles 托管在云端（`s3.amazonaws.com`）
- ❌ 需要网络连接才能加载地形
- ❌ 在无网环境（如教室演示）无法使用
- ❌ 依赖外部服务稳定性

### 教学需求
- ✅ 历史战争地理环境分析（如长平之战的地形优势）
- ✅ 朝代疆域与地形关系（如秦岭、淮河分界线）
- ✅ 战略要地地形特征（如剑门关"一夫当关，万夫莫开"）
- ✅ 地理课件中的地形专题

---

## 📦 方案 1：下载中国区域 DEM 瓦片（推荐）⭐

### 优点
- ✅ 完全离线，无需网络
- ✅ 覆盖中国全境
- ✅ 支持缩放级别 4-8（满足教学需求）
- ✅ 数据量可控（约 500MB-2GB）

### 实施步骤

#### 1. 安装依赖
```bash
pip install requests mercantile tqdm
```

#### 2. 运行下载脚本
```bash
cd /path/to/teachany-opensource/data
python3 download_terrain_tiles.py
```

#### 3. 预计下载量

| 缩放级别 | 覆盖范围 | 瓦片数 | 估计大小 |
|:---:|:---|:---:|:---:|
| 4 | 中国全境（粗略） | ~30 | 5 MB |
| 5 | 中国全境（省级） | ~100 | 15 MB |
| 6 | 中国全境（市级） | ~400 | 60 MB |
| 7 | 中国全境（县级） | ~1,600 | 240 MB |
| 8 | 中国全境（详细） | ~6,400 | 960 MB |
| **总计** | **Z4-Z8** | **~8,530** | **~1.28 GB** |

**下载时间**：约 15-30 分钟（取决于网络速度）

#### 4. 启动本地服务
```bash
cd /path/to/teachany-opensource/data
python3 -m http.server 8000
```

#### 5. 更新课件中的地图配置
```javascript
// 将原来的在线 URL
tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']

// 改为本地 URL
tiles: ['http://localhost:8000/terrain-tiles/{z}/{x}/{y}.png']
```

---

## 📦 方案 2：使用 SRTM 原始数据（备选）

### 优点
- ✅ 30m 分辨率原始数据
- ✅ 可自定义处理
- ✅ 适合高级用户

### 缺点
- ❌ 数据量大（中国区域约 50GB）
- ❌ 需要复杂的瓦片生成流程
- ❌ 需要安装 GDAL 等专业工具

### 数据来源
- **SRTM v3.0**: https://earthexplorer.usgs.gov/
- **ASTER GDEM**: https://asterweb.jpl.nasa.gov/gdem.asp
- **ALOS World 3D**: https://www.eorc.jaxa.jp/ALOS/en/aw3d30/

### 处理流程
```bash
# 1. 下载 SRTM 数据（.hgt 文件）
# 2. 合并瓦片
gdal_merge.py -o china_dem.tif *.hgt

# 3. 转换为 Terrarium 格式
rio rgbify -b -10000 -i 0.1 china_dem.tif china_terrarium.tif

# 4. 生成瓦片
gdal2tiles.py -z 4-8 china_terrarium.tif output/
```

---

## 📦 方案 3：使用预生成的中国 DEM 瓦片集（最简单）

### 寻找现有数据集
- 国家地理信息公共服务平台（天地图）
- 中国科学院地理科学与资源研究所
- OpenTopography（全球 DEM 数据）

### 推荐数据集
1. **天地图全球地形服务**
   - URL: `http://t{0-7}.tianditu.gov.cn/ter_c/wmts`
   - 需要申请 API Key
   - 可以批量下载后离线使用

2. **全国 30 米分辨率 DEM 数据**
   - 来源：地理空间数据云
   - 免费注册后下载
   - 需要自行切片

---

## 🚀 实施建议（按优先级）

### 阶段 1：立即实施（本周）✅
使用方案 1，下载缩放级别 4-7（约 320MB）
- 覆盖中国全境
- 满足 90% 教学场景
- 下载时间 10-15 分钟

### 阶段 2：补充实施（下周）⭐
下载缩放级别 8（约 960MB）
- 提供更详细的地形
- 支持放大查看局部战场
- 适用于战役态势分析

### 阶段 3：优化实施（未来）
探索方案 3，寻找预生成的中国 DEM 数据集
- 减少下载时间
- 提高数据质量
- 可能包含更高分辨率

---

## 💾 存储规划

### 推荐目录结构
```
teachany-opensource/data/
├── terrain-tiles/              # DEM 瓦片（~1.28 GB）
│   ├── 4/                      # 缩放级别 4
│   │   ├── 12/
│   │   │   ├── 6.png
│   │   │   └── 7.png
│   │   └── 13/
│   ├── 5/
│   ├── 6/
│   ├── 7/
│   └── 8/
├── download_terrain_tiles.py   # 下载脚本
└── TERRAIN_TILES_CONFIG.md     # 配置说明（自动生成）
```

### 磁盘空间需求
| 内容 | 大小 |
|:---|:---:|
| 地理数据（已有） | 38.48 MB |
| 历史数据（已有） | 7.72 MB |
| DEM 瓦片（Z4-Z7） | 320 MB |
| DEM 瓦片（Z8） | 960 MB |
| **推荐配置总计** | **~1.33 GB** |
| **完整配置总计** | **~2.29 GB** |

---

## 🎯 技术细节

### Terrarium 编码格式
AWS Terrain Tiles 使用 Terrarium 编码：
```
高程(米) = (R * 256 + G + B / 256) - 32768

其中：
- R: 红色通道（0-255）
- G: 绿色通道（0-255）
- B: 蓝色通道（0-255）
- 精度：0.1 米
- 范围：-32768 到 +32767 米
```

### MapLibre GL 解码
MapLibre GL 会自动解码 Terrarium 格式：
```javascript
map.addSource('terrain', {
  type: 'raster-dem',
  tiles: ['http://localhost:8000/terrain-tiles/{z}/{x}/{y}.png'],
  encoding: 'terrarium',  // 关键参数
  tileSize: 256,
  minzoom: 4,
  maxzoom: 8
});
```

### Hillshade（阴影）效果
```javascript
map.addLayer({
  id: 'hillshade',
  type: 'hillshade',
  source: 'terrain',
  paint: {
    'hillshade-exaggeration': 0.5,      // 阴影强度
    'hillshade-shadow-color': '#473B24',// 阴影颜色
    'hillshade-illumination-direction': 335  // 光照方向
  }
});
```

---

## 📝 更新清单

下载完成后需要更新的文档：
- [ ] `DATA_CATALOG.md` - 添加 DEM 数据说明
- [ ] `FINAL_SUMMARY.md` - 更新数据规模统计
- [ ] `skill/SKILL_CN.md` - 更新地图技术栈说明
- [ ] `README.md` - 添加本地服务启动说明

---

## ⚠️ 注意事项

### 1. 许可证
- AWS Terrain Tiles 数据来源于公开 DEM 数据（SRTM/ASTER/ALOS）
- 数据本身是 Public Domain（公共领域）
- 可以合法下载和离线使用
- 用于教育目的完全合规

### 2. 更新频率
- DEM 数据相对稳定（地形变化缓慢）
- 建议每 1-2 年检查是否有更新版本
- 关注 AWS 是否发布新的瓦片集

### 3. 备份策略
- 下载完成后建议压缩备份
- 可以上传到团队共享云盘
- 避免重复下载浪费时间

---

## 🔗 相关资源

- **MapLibre GL 文档**: https://maplibre.org/maplibre-gl-js-docs/
- **Terrarium 格式说明**: https://github.com/tilezen/joerd/blob/master/docs/formats.md
- **Mercantile 库**: https://github.com/mapbox/mercantile
- **USGS EarthExplorer**: https://earthexplorer.usgs.gov/

---

**优先级**: 🔥🔥🔥🔥🔥 **极高**  
**建议时间**: 立即实施（本周内完成）  
**负责人**: TeachAny Team  
**更新日期**: 2026-04-12
