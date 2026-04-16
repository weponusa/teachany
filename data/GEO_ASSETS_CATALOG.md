# K12 GeoJSON 开源资产目录

**版本**: v1.0  
**更新日期**: 2026-04-16  
**数据总量**: ~60 MB（33 个地理数据文件 + 9 张地形底图 + 10 个历史数据文件）  
**许可证**: 全部 Public Domain 或 Free for Academic Use

---

## 一、资产总览

| 类别 | 文件数 | 总大小 | 数据来源 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| [地形底图](#二地形底图) | 9 | 11 MB | Natural Earth SR + HYP | 所有地理/历史课件背景 |
| [行政边界](#三行政边界) | 6 | 5.6 MB | Natural Earth + GADM | 政区图、国家对比 |
| [河流水系](#四河流水系) | 2 | 16 MB | Natural Earth Rivers 10m | 水文地理、流域分析 |
| [湖泊](#五湖泊) | 2 | 7.7 MB | Natural Earth Lakes 10m | 水资源、湿地生态 |
| [海岸线](#六海岸线) | 2 | 21 MB | Natural Earth Coastline 10m | 海洋地理、海岸地貌 |
| [历朝疆域](#七历朝疆域) | 9 | 7.8 MB | CHGIS V6 | 朝代更替、疆域演变 |
| [历史战役](#八历史战役与地标) | 1 | 16 KB | 史料整理 | 军事地理、战争史 |
| [历史城市](#八历史战役与地标) | 2 | 20 KB | CHGIS + 史料 | 都城迁移、交通枢纽 |
| [历史年表](#九历史年表与人物) | 2 | 231 KB | 教材整理 | 朝代年表、事件线索 |
| [历史人物](#九历史年表与人物) | 1 | 22 KB | 教材整理 | 人物关系、贡献评价 |
| [朝代 inline 数据](#十朝代-inline-数据) | 3 | 756 KB | CHGIS V6 处理 | 课件直接嵌入 |

---

## 二、地形底图

**目录**: `data/geography/hillshade/`  
**来源**: Natural Earth Shaded Relief (SR) + Cross-blended Hypsometric Tints (HYP)  
**许可证**: Public Domain  
**投影**: 等距圆柱投影（Equirectangular）

| 文件名 | 尺寸 | 大小 | 风格 | K12 推荐场景 |
|:---|:---|:---:|:---|:---|
| **`global-color-hillshade-8k.jpg`** | 8192×4096 | 3.2 MB | 彩色+阴影融合 | 大屏展示、高清课件 |
| **`global-color-hillshade-4k.jpg`** ⭐ | 4096×2048 | 835 KB | 彩色+阴影融合 | **课件默认底图** |
| `global-color-hillshade-2k.jpg` | 2048×1024 | 200 KB | 彩色+阴影融合 | 快速加载、移动端 |
| `global-hillshade-8k.jpg` | 8192×4096 | 2.3 MB | 纯灰度阴影 | 叠加数据层时不干扰颜色 |
| `global-hillshade-4k.jpg` | 4096×2048 | 586 KB | 纯灰度阴影 | 标准叠加底图 |
| `global-hillshade-2k.jpg` | 2048×1024 | 114 KB | 纯灰度阴影 | 快速加载 |
| `global-color-relief-8k.jpg` | 8192×4096 | 1.7 MB | 纯彩色（无阴影） | 气候带/植被分布教学 |
| `global-color-relief-4k.jpg` | 4096×2048 | 573 KB | 纯彩色（无阴影） | 标准彩色底图 |
| `global-color-relief-2k.jpg` | 2048×1024 | 167 KB | 纯彩色（无阴影） | 快速加载 |

**颜色说明**:
- 彩色版：绿色=湿润低地，棕色=干旱区，灰白=高山，白色=冰川/海洋
- 灰度版：仅山体阴影纹理，海洋为统一灰色
- 融合版：彩色×灰度 Multiply 混合，既有颜色又有立体感

**K12 适用学科**: 地理（全部）、历史（疆域/战役/交通）

---

## 三、行政边界

**目录**: `data/geography/admin-boundaries/` + `data/geography/modern-china/` + `data/geography/world/`

### 3.1 世界级

| 文件 | Features | 大小 | 来源 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `admin-boundaries/ne_50m_admin_0_countries.json` | 241 国 | 4.5 MB | Natural Earth 50m | 世界政区图、国家对比 |
| `world/countries.geojson` | 180 国 | 250 KB | Natural Earth 简化 | 轻量世界地图（推荐） |

### 3.2 中国级

| 文件 | Features | 大小 | 来源 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `admin-boundaries/china-provinces.json` | 35 省级 | 568 KB | Natural Earth | 省级行政区划 |
| `modern-china/provinces.geojson` | 35 省级 | 568 KB | 同上（副本） | 同上 |
| `modern-china/provinces-ultra-lite.json` | 35 省级 | 27 KB | 极简化 | 超快加载、示意图 |
| `admin-boundaries/china-cities.json` | 地级市 | 158 KB | GADM 简化 | 城市分布 |

### 3.3 城市级

| 文件 | Features | 大小 | K12 用途 |
|:---|:---:|:---:|:---|
| `modern-china/beijing.geojson` | 区县 | 100 KB | 首都行政区划 |
| `modern-china/shanghai.geojson` | 区县 | 84 KB | 直辖市行政区划 |

**K12 适用**: 地理（行政区划、人口分布、经济地理）

---

## 四、河流水系

**目录**: `data/geography/rivers/`  
**来源**: Natural Earth Rivers 10m  
**许可证**: Public Domain

| 文件 | Features | 大小 | 覆盖 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `ne_10m_rivers_china.json` | 233 条 | 4.6 MB | 中国 | 长江/黄河/珠江流域、水系格局 |
| `ne_10m_rivers_lake_centerlines.json` | 全球 | 11 MB | 全球 | 世界大河对比、国际河流 |

**K12 教学场景**:
- 初中地理：中国水系分布、长江黄河对比
- 高中地理：流域综合开发、水资源利用
- 历史：京杭大运河、黄河改道

---

## 五、湖泊

**目录**: `data/geography/lakes/`  
**来源**: Natural Earth Lakes 10m  
**许可证**: Public Domain

| 文件 | Features | 大小 | 覆盖 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `ne_10m_lakes_china.json` | 196 个 | 1.4 MB | 中国 | 青海湖/鄱阳湖/洞庭湖 |
| `ne_10m_lakes.json` | 全球 | 6.3 MB | 全球 | 五大湖/贝加尔湖/里海 |

**K12 教学场景**:
- 初中地理：中国湖泊分布、淡水湖/咸水湖
- 高中地理：湿地生态、水循环

---

## 六、海岸线

**目录**: `data/geography/coastline/`  
**来源**: Natural Earth Coastline 10m  
**许可证**: Public Domain

| 文件 | Features | 大小 | 覆盖 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `ne_10m_coastline_china.json` | 273 段 | 2.8 MB | 中国 | 海岸线类型、港口分布 |
| `ne_10m_coastline.json` | 全球 | 18 MB | 全球 | 世界海岸线、大陆轮廓 |

**K12 教学场景**:
- 初中地理：中国海岸线、海洋资源
- 高中地理：海岸地貌（侵蚀/堆积）

---

## 七、历朝疆域

**目录**: `data/geography/historical-china/` + `data/history/dynasties/`  
**来源**: CHGIS V6（哈佛大学中国历史地理信息系统）  
**许可证**: Free for Academic Use

| 朝代 | 文件 | Features | 大小 | 时间范围 |
|:---|:---|:---:|:---:|:---|
| **秦** | `historical-china/qin-dynasty.geojson` | 183 郡县 | 926 KB | -221 ~ -206 |
| **西汉** | `historical-china/west-han-dynasty.geojson` | 233 郡国 | 936 KB | -206 ~ 8 |
| **东汉** | `historical-china/east-han-dynasty.geojson` | 440 郡县 | 1.1 MB | 25 ~ 220 |
| **唐** | `historical-china/tang-dynasty.geojson` | 225 州府 | 954 KB | 618 ~ 907 |
| **北宋** | `history/dynasties/north-song-dynasty.geojson` | 15 路 | 6 KB | 960 ~ 1127 |
| **南宋** | `history/dynasties/south-song-dynasty.geojson` | 14 路 | 5 KB | 1127 ~ 1279 |
| **元** | `historical-china/yuan-dynasty.geojson` | 237 行省 | 997 KB | 1271 ~ 1368 |
| **明** | `historical-china/ming-dynasty.geojson` | 233 府州 | 1.0 MB | 1368 ~ 1644 |
| **清** | `historical-china/qing-dynasty.geojson` | 627 府县 | 1.8 MB | 1644 ~ 1912 |

**K12 教学场景**:
- 初中历史：秦统一六国、汉朝丝绸之路、唐朝鼎盛
- 高中历史：中央集权制度演变、行政区划变迁
- 地理：历史地理、区域变迁

---

## 八、历史战役与地标

**目录**: `data/history/battles/` + `data/history/cities/` + `data/history/landmarks/`

| 文件 | Features | 大小 | 内容 | K12 用途 |
|:---|:---:|:---:|:---|:---|
| `battles/major-battles.geojson` | 30 场 | 16 KB | 前260年~1948年重要战役（坐标+双方+结果+地形因素） | 军事地理、战争史 |
| `cities/ancient-capitals.geojson` | 25 座 | 11 KB | 历代都城（坐标+朝代+时间） | 都城迁移、政治中心 |
| `cities/strategic-locations.geojson` | 20 处 | 9 KB | 战略要地（关隘、渡口、军镇） | 军事地理、交通要道 |
| `landmarks/qin-unification-landmarks.json` | — | 8 KB | 秦统一相关地标 | 秦统一专题课 |

**战役数据字段示例**:
```json
{
  "name": "长平之战",
  "year": -260,
  "sides": ["秦国", "赵国"],
  "result": "秦胜",
  "terrainFactor": "太行山地形限制赵军机动",
  "coordinates": [112.92, 35.80]
}
```

---

## 九、历史年表与人物

**目录**: `data/history/timelines/` + `data/history/figures/`

| 文件 | 大小 | 内容 | K12 用途 |
|:---|:---:|:---|:---|
| `timelines/chinese-dynasties.json` | 10 KB | 10 个主要朝代（起止年/都城/开国君主） | 朝代年表、时间线 |
| `timelines/dynasties-detailed.json` | 221 KB | 详细朝代数据（含皇帝列表、重大事件、地标） | 深度历史课件 |
| `figures/persons.json` | 22 KB | 历史人物数据库（姓名/朝代/身份/主要事迹） | 人物评价、群体分析 |

---

## 十、朝代 inline 数据

**目录**: `data/history/dynasties/`  
**说明**: 将疆域 GeoJSON 预处理为课件可直接 `<script>` 内嵌的 JSON，省去运行时 fetch。

| 文件 | 大小 | 对应朝代 |
|:---|:---:|:---|
| `qin-inline.json` | 189 KB | 秦 |
| `west-han-inline.json` | 207 KB | 西汉 |
| `east-han-inline.json` | 360 KB | 东汉 |

---

## 十一、数据来源与许可证汇总

| 数据源 | 网址 | 许可证 | 使用范围 |
|:---|:---|:---|:---|
| **Natural Earth** | https://www.naturalearthdata.com/ | **Public Domain** | 全球行政边界、河流、湖泊、海岸线、地形底图 |
| **CHGIS V6** | https://dataverse.harvard.edu/dataverse/chgis_v6 | **Free for Academic Use** | 中国历朝疆域、历史城市 |
| **AWS Terrain Tiles** | https://registry.opendata.aws/terrain-tiles/ | **Public Domain** | DEM 地形瓦片（3D 交互用） |
| **OpenStreetMap** | https://www.openstreetmap.org/ | **ODbL** | 在线瓦片底图 |

**教育使用说明**:
- ✅ 所有数据均可在课堂、课件、教学网站中免费使用
- ✅ Natural Earth 和 AWS Terrain Tiles 无任何使用限制
- ⚠️ CHGIS V6 限学术用途（教学属于学术用途）
- ⚠️ OpenStreetMap 瓦片需标注来源

---

## 十二、按学科速查

### 地理课件

| 课题 | 推荐资产 |
|:---|:---|
| 中国行政区划 | `provinces-ultra-lite.json`（27KB 快速）或 `china-provinces.json`（568KB 精细） |
| 中国地形与三级阶梯 | `global-color-hillshade-4k.jpg` + 自定义阶梯分界线 GeoJSON |
| 中国河流水系 | `ne_10m_rivers_china.json` + `ne_10m_lakes_china.json` |
| 世界地理概览 | `countries.geojson`（180 国，250KB） + `global-color-relief-4k.jpg` |
| 海洋与海岸 | `ne_10m_coastline_china.json` |
| 气候与植被 | `global-color-relief-4k.jpg`（颜色直接反映气候带） |

### 历史课件

| 课题 | 推荐资产 |
|:---|:---|
| 秦统一六国 | `qin-dynasty.geojson` + `major-battles.geojson` + `qin-unification-landmarks.json` + `global-color-hillshade-4k.jpg` |
| 汉朝鼎盛 | `west-han-dynasty.geojson` / `east-han-dynasty.geojson` + `ancient-capitals.geojson` |
| 唐朝疆域 | `tang-dynasty.geojson` + `strategic-locations.geojson` |
| 宋朝南迁 | `north-song-dynasty.geojson` → `south-song-dynasty.geojson`（对比动画） |
| 元朝版图 | `yuan-dynasty.geojson` + 全球底图 |
| 明清疆域 | `ming-dynasty.geojson` / `qing-dynasty.geojson` |
| 朝代更替总览 | `dynasties-detailed.json`（年表）+ 逐朝疆域 GeoJSON 时间线动画 |
| 古代战役 | `major-battles.geojson` + `global-color-hillshade-4k.jpg`（地形分析） |
| 都城迁移 | `ancient-capitals.geojson` + 朝代年表 |

---

## 十三、缺失资产与扩展计划

以下是 K12 教学中有价值但尚未收录的地理数据，可后续补充：

| 优先级 | 数据 | 来源建议 | K12 用途 |
|:---:|:---|:---|:---|
| P0 | 中国地形分区（青藏高原/黄土高原/四大盆地轮廓） | 手工绘制或 Natural Earth | 中国地形分区教学 |
| P0 | 中国气候分区（温度带/干湿区） | 教材标准分区 | 气候类型教学 |
| P1 | 丝绸之路路线 | 史料+CHGIS | 古代贸易路线 |
| P1 | 京杭大运河路线 | Natural Earth + 史料 | 交通工程 |
| P1 | 长城走向 | OpenStreetMap 提取 | 防御工程 |
| P1 | 世界主要山脉 | Natural Earth | 板块构造、山脉分布 |
| P2 | 中国铁路干线 | OpenStreetMap | 现代交通 |
| P2 | 世界大洲/大洋轮廓 | Natural Earth | 小学地理 |
| P2 | 三国时期疆域 | CHGIS V6 | 三国历史 |
| P2 | 隋唐大运河 | 史料+CHGIS | 交通史 |
| P3 | 中国民族分布 | 官方数据 | 民族地理 |
| P3 | 世界时区 | Natural Earth | 时区教学 |
| P3 | 全球板块边界 | USGS | 板块构造教学 |

---

## 十四、使用规范

### 课件引用规则

1. **地形底图**: 历史/地理课件 → 必须使用 `global-color-hillshade-4k.jpg`
2. **行政边界**: 优先使用简化版（`provinces-ultra-lite.json` 27KB），精细需求用完整版
3. **历朝疆域**: 使用 `data/geography/historical-china/` 下的 CHGIS 数据，禁止手工绘制边界
4. **河流/湖泊/海岸线**: 使用 `*_china.json` 中国裁剪版（体积更小），全球视图用完整版
5. **inline 嵌入**: 小于 200KB 的数据可直接 `<script>` 内嵌；大于 200KB 必须 `fetch()` 加载

### 坐标系

- 所有 GeoJSON 使用 **WGS84 (EPSG:4326)** 坐标系
- 经度范围: -180 ~ 180（东经为正）
- 纬度范围: -90 ~ 90（北纬为正）
- 地形底图使用等距圆柱投影，经纬度直接映射像素

### 数据溯源

每个课件使用 GeoJSON 数据时，必须在 `manifest.json` 的 `external_data` 字段或 HTML 注释中标注数据来源：

```json
{
  "external_data": {
    "terrain": "data/geography/hillshade/global-color-hillshade-4k.jpg",
    "boundary": "data/geography/historical-china/qin-dynasty.geojson",
    "data_sources": ["Natural Earth (Public Domain)", "CHGIS V6 (Academic)"]
  }
}
```
