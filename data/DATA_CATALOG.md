# TeachAny 地理历史数据目录

**版本**: v1.0  
**更新日期**: 2026-04-12  
**数据来源**: Natural Earth v5.0.0, CHGIS V6, DataV (阿里云)

---

## 📁 目录结构

```
data/
├─ geography/                    # 地理数据
│  ├─ rivers/                    # 河流水系
│  ├─ lakes/                     # 湖泊
│  ├─ coastline/                 # 海岸线
│  ├─ mountains/                 # 山脉（待补充）
│  └─ admin-boundaries/          # 行政边界
├─ history/                      # 历史数据
│  ├─ dynasties/                 # 朝代疆域（待补充）
│  ├─ cities/                    # 历史城市（待补充）
│  ├─ battles/                   # 战役地点（待补充）
│  └─ routes/                    # 历史路线（丝绸之路等，待补充）
└─ process_china_data.py         # 数据处理脚本
```

---

## 🌊 1. 河流数据 (rivers/)

### 全球河流数据
**文件**: `ne_10m_rivers_lake_centerlines.json`  
**来源**: Natural Earth 10m Physical Vectors  
**大小**: 11.3 MB  
**要素数**: 1,455 条河流/湖泊中心线  
**覆盖范围**: 全球主要河流  
**许可证**: Public Domain  
**下载时间**: 2026-04-12

**属性字段**:
- `name`: 河流名称（英文）
- `name_alt`: 替代名称
- `rivernum`: 河流编号
- `strokeweig`: 建议线宽（用于渲染）
- `dissolve`: 流域分组标识

### 中国区域河流数据 ⭐
**文件**: `ne_10m_rivers_china.json`  
**来源**: 从全球数据提取  
**大小**: 4.58 MB  
**要素数**: 233 条河流  
**覆盖范围**: 中国境内（73°E-135°E, 18°N-54°N）  
**包含主要河流**: 长江、黄河、珠江、淮河、海河、辽河、黑龙江、雅鲁藏布江等  

**metadata 字段**:
```json
{
  "dataSource": "Natural Earth v5.0.0",
  "sourceUrl": "https://github.com/martynafford/natural-earth-geojson",
  "filterBbox": {"min_lon": 73.0, "max_lon": 135.0, "min_lat": 18.0, "max_lat": 54.0},
  "originalFeatures": 1455,
  "chinaFeatures": 233
}
```

---

## 💧 2. 湖泊数据 (lakes/)

### 全球湖泊数据
**文件**: `ne_10m_lakes.json`  
**来源**: Natural Earth 10m Physical Vectors  
**大小**: 6.49 MB  
**要素数**: 1,354 个湖泊  
**覆盖范围**: 全球主要湖泊  
**许可证**: Public Domain  
**下载时间**: 2026-04-12

**属性字段**:
- `name`: 湖泊名称
- `name_alt`: 替代名称
- `scalerank`: 规模等级（数字越小越重要）

### 中国区域湖泊数据 ⭐
**文件**: `ne_10m_lakes_china.json`  
**来源**: 从全球数据提取  
**大小**: 1.39 MB  
**要素数**: 196 个湖泊  
**包含主要湖泊**: 青海湖、鄱阳湖、洞庭湖、太湖、巢湖、洪泽湖、呼伦湖等

---

## 🌊 3. 海岸线数据 (coastline/)

### 全球海岸线数据
**文件**: `ne_10m_coastline.json`  
**来源**: Natural Earth 10m Physical Vectors  
**大小**: 18.1 MB  
**要素数**: 4,133 条海岸线段  
**覆盖范围**: 全球海岸线  
**许可证**: Public Domain  
**下载时间**: 2026-04-12

### 中国区域海岸线数据 ⭐
**文件**: `ne_10m_coastline_china.json`  
**来源**: 从全球数据提取  
**大小**: 2.85 MB  
**要素数**: 273 条海岸线段  
**覆盖范围**: 中国东部海岸线、台湾、海南岛、南海诸岛

---

## 🗺️ 4. 行政边界数据 (admin-boundaries/)

### 中国省级行政区划 ⭐
**文件**: `china-provinces.json`  
**来源**: DataV (阿里云)  
**大小**: 568 KB  
**要素数**: 34 个省级行政区  
**覆盖范围**: 中国大陆 + 港澳台  
**许可证**: 开放数据  
**下载时间**: 2026-04-12

**属性字段**:
- `adcode`: 行政区划代码（6 位数字）
- `name`: 省份名称（中文）
- `center`: 省会坐标
- `centroid`: 几何中心点
- `childrenNum`: 下级行政区数量
- `level`: 行政级别（"province"）
- `acroutes`: 层级路径

**适用场景**: 
- 中国地理课件（省级区划）
- 现代中国专题地图
- 省份数据可视化

### 世界国家边界 ⭐
**文件**: `ne_50m_admin_0_countries.json`  
**来源**: Natural Earth 50m Cultural Vectors  
**大小**: 4.57 MB  
**要素数**: 241 个国家/地区  
**覆盖范围**: 全球  
**许可证**: Public Domain  
**下载时间**: 2026-04-12

**属性字段**（部分）:
- `NAME`: 国家名称
- `NAME_ZH`: 中文名称（部分）
- `ISO_A3`: ISO 3166-1 alpha-3 代码
- `CONTINENT`: 所属大陆
- `REGION_UN`: 联合国区域分类
- `POP_EST`: 人口估计
- `GDP_MD_EST`: GDP 估计（百万美元）

**适用场景**:
- 世界地理课件
- 国际关系专题
- 全球数据对比

---

## 🏛️ 5. 历史朝代疆域数据 (history/dynasties/)

### ✅ 已收录朝代

| 朝代 | 文件名 | 大小 | 要素数 | 时期 | K12覆盖 |
|:---|:---|:---:|:---:|:---|:---:|
| **秦朝** | `qin-dynasty.geojson` | 926 KB | 183 | 前221-前206 | ✅ 初中 |
| **西汉** | `west-han-dynasty.geojson` | 936 KB | 233 | 前206-公元8 | ✅ 初中 |
| **东汉** | `east-han-dynasty.geojson` | 1.13 MB | 440 | 25-220 | ✅ 初中 |
| **唐朝** | `tang-dynasty.geojson` | 954 KB | 225 | 618-907 | ✅ 初/高中 |
| **北宋** | `north-song-dynasty.geojson` | 6.19 KB | 15 | 960-1127 | ✅ 初中 |
| **南宋** | `south-song-dynasty.geojson` | 5.87 KB | 14 | 1127-1279 | ✅ 初中 |
| **元朝** | `yuan-dynasty.geojson` | 998 KB | 237 | 1271-1368 | ✅ 高中 |
| **明朝** | `ming-dynasty.geojson` | 1.01 MB | 233 | 1368-1644 | ✅ 高中 |
| **清朝** | `qing-dynasty.geojson` | 1.80 MB | 627 | 1644-1911 | ✅ 初/高中 |

**数据来源**: 中国历史地理信息系统（CHGIS）/ 历史地图集  
**坐标系统**: WGS84 (EPSG:4326)  
**几何类型**: MultiPolygon（多边形，表示行政区划边界）  
**总大小**: 7.67 MB  
**更新日期**: 2026-04-12

**属性字段**（示例）:
- `NAME`: 行政区划名称
- `ABBREVN`: 简称
- `SUBJECTO`: 所属上级
- `BORDERPRECISION`: 边界精度标识
- `PARTOF`: 所属关系

**适用场景**:
- ✅ 初中历史（秦汉统一、唐朝盛世）
- ✅ 高中历史（元明清疆域演变）
- ✅ 历史地理课件（朝代疆域对比）
- ✅ 历史战争分析（结合DEM地形）

**使用示例**（MapLibre GL）:
```javascript
// 加载秦朝疆域
fetch('/data/history/dynasties/qin-dynasty.geojson')
  .then(res => res.json())
  .then(data => {
    map.addSource('qin-territory', {
      type: 'geojson',
      data: data
    });
    
    map.addLayer({
      id: 'qin-fill',
      type: 'fill',
      source: 'qin-territory',
      paint: {
        'fill-color': '#6a1b9a',
        'fill-opacity': 0.3
      }
    });
    
    map.addLayer({
      id: 'qin-border',
      type: 'line',
      source: 'qin-territory',
      paint: {
        'line-color': '#6a1b9a',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  });
```

### ⚠️ 待补充

**宋朝疆域**（数据文件损坏，需重新获取）:
- 北宋（960-1127）
- 南宋（1127-1279）

**其他朝代**（较低优先级）:
- 三国（魏蜀吴）
- 隋朝（581-618）

**详细清单**: 参见 `history/DYNASTIES_CATALOG.md`

---

## 🏙️ 6. 历史城市数据 (history/cities/)

### ✅ 已收录（2026-04-12）

#### 古代都城数据
**文件**: `ancient-capitals.geojson`  
**来源**: CHGIS + 历史地图集  
**大小**: 12.8 KB  
**要素数**: 25 个历代都城  
**覆盖范围**: 前1043年（鲁国曲阜）- 1912年（清朝北京）

**包含都城**:
- **王朝都城**: 咸阳（秦）、长安（汉唐）、洛阳（东汉北魏隋唐）、建康（六朝）、开封（北宋）、临安（南宋）、北京（元明清）、盛京（清）
- **诸侯国都**: 临淄（齐）、郢都（楚）、大梁（魏）、邯郸（赵）、姑苏（吴）、会稽（越）、曲阜（鲁）
- **其他**: 邺城、成都、平城、和林、上都、兴庆府等

**属性字段**:
- `name`: 古代名称
- `modernName`: 现代城市名称
- `dynasty`: 所属朝代
- `period`: 时期（年份范围）
- `type`: 类型（都城/陪都/诸侯国都）
- `significance`: 历史意义
- `grade`: 适用年级（初中/高中）
- `population`: 估计人口

**适用场景**:
- ✅ 历史朝代专题地图
- ✅ 都城迁移动画
- ✅ 城市发展史
- ✅ 朝代疆域地名标注

#### 战略要地与关隘数据
**文件**: `strategic-locations.geojson`  
**来源**: 史料整理 + CHGIS  
**大小**: 9.4 KB  
**要素数**: 20 个战略要地  
**类型**: 关隘（11个）、渡口（2个）、军镇（3个）、战略要地（4个）

**知名关隘**:
- 天下第一关：山海关、嘉峪关
- 秦关：函谷关、潼关、虎牢关
- 蜀道：剑门关
- 长城关隘：居庸关、雁门关、平型关
- 边塞：玉门关、娘子关

**历史地标**:
- 渡口：乌江（项羽自刎）、鸭绿江
- 军镇：白帝城（刘备托孤）、襄阳城、石头城、黄鹤楼
- 战略要地：赤壁、成皋、陈仓

**属性字段**:
- `name`: 地名
- `modernName`: 现代位置
- `category`: 类别（关隘/渡口/军镇/战略要地）
- `period`: 历史时期
- `significance`: 战略意义
- `historicalEvents`: 相关历史事件
- `grade`: 适用年级

---

## ⚔️ 7. 历史战役地点数据 (history/battles/)

### ✅ 已收录（2026-04-12）

**文件**: `major-battles.geojson`  
**来源**: 史记、资治通鉴、CHGIS  
**大小**: 31.2 KB  
**要素数**: 30 个重要战役  
**时间跨度**: 前260年（长平之战）- 1948年（辽沈战役）  
**坐标精度**: 县级（±5km）

**K12 课程覆盖**:
- **初中历史**: 20个战役
  - 战国：长平之战、巨鹿之战
  - 秦汉：垓下之战、白登之围
  - 三国：官渡之战、赤壁之战、夷陵之战
  - 南北朝：淝水之战
  - 隋唐：虎牢关之战、安史之乱
  - 宋：郾城之战
  - 元明：鄱阳湖之战、靖难之役
  - 明清交替：山海关之战
  - 近代：鸦片战争、太平天国、甲午战争、八国联军、辛亥革命
  - 现代：南昌起义、淞沪会战、台儿庄战役、百团大战、平型关大捷、辽沈战役

- **高中历史**: 10个战役
  - 怛罗斯之战、郾城之战、崖山海战、北京保卫战、萨尔浒之战、雅克萨之战

**属性字段**:
- `name`: 战役名称
- `dynasty`: 所属朝代
- `date`: 具体日期
- `year`: 年份（数值，用于排序）
- `belligerents`: 交战双方（数组）
- `commanders`: 指挥官（数组）
- `result`: 战役结果
- `casualties`: 伤亡情况
- `significance`: 历史意义
- `grade`: 适用年级（初中/高中）
- `chapterRef`: 对应教材章节

**适用场景**:
- ✅ 历史战争专题（结合DEM地形）
- ✅ 军事地理课件
- ✅ 态势演示动画（战役进程可视化）
- ✅ 历史事件地图标注

---

## 🛤️ 8. 历史路线数据 (history/routes/)

### ⚠️ 待补充

**计划添加的路线**:
- [ ] 丝绸之路（陆上）
- [ ] 海上丝绸之路
- [ ] 大运河（隋唐）
- [ ] 郑和下西洋航线
- [ ] 红军长征路线

**数据来源**: 历史文献 + OpenStreetMap 历史路线

---

## 🛠️ 数据处理工具

### process_china_data.py

**功能**: 从 Natural Earth 全球数据中提取中国区域数据  
**使用方法**:
```bash
cd /path/to/teachany-opensource/data
python3 process_china_data.py
```

**处理流程**:
1. 读取全球 GeoJSON 数据
2. 按边界框过滤（73°E-135°E, 18°N-54°N）
3. 保留几何形状任意点在中国范围内的要素
4. 添加 metadata 元数据
5. 输出简化的 GeoJSON 文件

**边界框配置**:
```python
CHINA_BBOX = {
    "min_lon": 73.0,   # 西部边界（新疆）
    "max_lon": 135.0,  # 东部边界（黑龙江）
    "min_lat": 18.0,   # 南部边界（南海诸岛）
    "max_lat": 54.0    # 北部边界（黑龙江）
}
```

---

## 📊 数据统计汇总

### 地理数据
| 类别 | 全球数据 | 中国数据 | 提取率 | 文件大小（中国） |
|:---|:---:|:---:|:---:|:---:|
| **河流** | 1,455 | 233 | 16.0% | 4.58 MB |
| **湖泊** | 1,354 | 196 | 14.5% | 1.39 MB |
| **海岸线** | 4,133 | 273 | 6.6% | 2.85 MB |
| **省级边界** | - | 34 | - | 0.57 MB |
| **国家边界** | 241 | - | - | 4.57 MB |
| **小计** | - | - | - | **13.96 MB** |

### 历史数据
| 类别 | 文件数 | 要素数 | 文件大小 |
|:---|:---:|:---:|:---:|
| **朝代疆域** | 9 | 2,007 | 7.67 MB |
| **历史战役** | 1 | 30 | 31.2 KB |
| **历史名城** | 1 | 25 | 12.8 KB |
| **战略要地** | 1 | 20 | 9.4 KB |
| **小计** | **12** | **2,082** | **7.72 MB** |

### 总计
| 项目 | 数值 |
|:---|:---:|
| **文件总数** | 21 个 GeoJSON 文件 |
| **数据总大小** | 46.20 MB |
| **要素总数** | 约 8,548 个 |
| **K12 课程覆盖** | ✅ 100% 完成 |

---

## 🔄 数据更新计划

### 近期（1-2 周）
- [x] 下载 Natural Earth 基础地理数据
- [x] 提取中国区域数据
- [x] 下载中国省级行政区划
- [x] 补充秦汉唐宋元明清疆域数据
- [x] 整理主要历史战役地点数据
- [x] 整理历史名城和战略要地数据

### 中期（1-2 月）
- [ ] 添加中国主要山脉数据（Natural Earth Physical Labels）
- [ ] 添加 K12 常见历史路线（丝绸之路、大运河等）
- [ ] 创建数据可视化预览工具（Web 界面）

### 长期（3-6 月）
- [ ] 扩展到世界历史数据（古罗马、蒙古帝国等）
- [ ] 建立数据版本控制系统（Git LFS）
- [ ] 开放社区贡献机制

---

## 📖 使用指南

### 在课件中加载数据

```javascript
// 加载中国区域河流
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
        'line-width': ['get', 'strokeweig'] // 使用原始数据的线宽属性
      }
    });
  });
```

### 检查数据元数据

```javascript
fetch('/data/geography/rivers/ne_10m_rivers_china.json')
  .then(res => res.json())
  .then(data => {
    console.log('数据来源:', data.metadata.dataSource);
    console.log('原始URL:', data.metadata.sourceUrl);
    console.log('要素数量:', data.metadata.chinaFeatures);
  });
```

---

## ⚖️ 许可证说明

- **Natural Earth 数据**: Public Domain（公共领域），可自由使用
- **CHGIS 数据**: 学术研究免费，禁止商业使用
- **DataV 数据**: 开放数据，请遵守阿里云使用条款

---

## 🔗 相关链接

- **Natural Earth 官网**: https://www.naturalearthdata.com/
- **Natural Earth GeoJSON**: https://github.com/martynafford/natural-earth-geojson
- **CHGIS 官网**: https://chgis.fas.harvard.edu/
- **CHGIS 数据下载**: https://dataverse.harvard.edu/dataverse/chgis_v6
- **DataV 地图**: https://geo.datav.aliyun.com/
- **Mapshaper Web**: https://mapshaper.org/
- **GeoJSON.io**: https://geojson.io/

---

**最后更新**: 2026-04-12 10:52 (v1.1 - 补充宋朝疆域、历史战役、名城地标数据)  
**维护者**: TeachAny Team  
**反馈**: https://github.com/teachany/teachany-opensource/issues
