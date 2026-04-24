# 🗺️ 历史地图清单

本项目的**历史地图分两套**独立资产，按语境调用：

| 语境 | 资产套 | 目录 | 时间线 | 数据源 |
|:---|:---|:---|:---|:---|
| 讲**中国史** | 🇨🇳 中国历代疆域 | `data/geography/historical-china/` | `data/history/timelines/chinese-dynasties.json` | **CHGIS V6**（哈佛+复旦） |
| 讲**世界史** | 🌍 世界历代格局 | `data/geography/historical-world/` | `data/history/timelines/world-history-periods.json` | **historical-basemaps** (aourednik, GPL-3.0) |

> ⚠️ **不要混用**：中国朝代（秦、宋、明…）不等价于世界某个时间切片；世界切片（1200、1300…）也并非就是某个中国朝代的疆域。

---

## 一、🇨🇳 中国历代疆域（CHGIS V6）

### 1.1 目录清单

| 文件 | 对应朝代 | 覆盖年份 | 政区数 | 并立政权 |
|:---|:---|:---|:---:|:---|
| `qin-dynasty.geojson` | 秦 | 前221~前206 | 13 | 秦 |
| `west-han-dynasty.geojson` | 西汉 | 前202~公元8 | 73 | 西汉 |
| `east-han-dynasty.geojson` | 东汉 | 25~220 | 69 | 东汉 |
| `han-dynasty.geojson` | 汉（西+东合并） | 前202~220 | 142 | 汉 |
| `three-kingdoms.geojson` | 三国 | 220~280 | 86 | 魏/吴 |
| `jin-west-dynasty.geojson` | 西晋 | 265~316 | 77 | 西晋 |
| `jin-east-dynasty.geojson` | 东晋十六国 | 317~420 | 69 | 东晋/北方十六国 |
| `northern-southern.geojson` | 南北朝 | 420~589 | 326 | 北魏/南齐 |
| `sui-dynasty.geojson` | 隋 | 581~618 | 363 | 隋 |
| `tang-dynasty.geojson` | 唐 | 618~907 | 855 | 唐 |
| `five-dynasties.geojson` | 五代十国 | 907~960 | 233 | 中原五代/后蜀/南唐/吴越/闽/南汉/楚/荆南/北汉/辽 |
| `north-song-dynasty.geojson` | 北宋时期 | 960~1127 | 438 | **北宋**（府级） + **辽/西夏/大理/吐蕃**（疆域轮廓） |
| `south-song-dynasty.geojson` | 南宋时期 | 1127~1279 | 349 | **南宋**（府级） + **金/西夏/大理/吐蕃**（疆域轮廓） |
| `song-dynasty.geojson` | 宋代合并 | 960~1279 | 787 | 上两者合并 |
| `yuan-dynasty.geojson` | 元 | 1271~1368 | 630 | 元 |
| `ming-dynasty.geojson` | 明 | 1368~1644 | 810 | 明 |
| `qing-dynasty.geojson` | 清 | 1644~1912 | 882 | 清 |

### 1.2 feature 字段约定

| 字段 | 说明 |
|:---|:---|
| `NAME_CH` | 中文政区名（府/州/郡） |
| `NAME_PY` | 拼音 |
| `TYPE_CH` | 行政级别（府/州/路/郡/道） |
| `BEG_YR` / `END_YR` | 该政区存在的起讫年份 |
| `POWER` | **本项目自添加**：该 feature 所属政权（如"北宋"/"辽"/"魏"） |
| `LEVEL` | **本项目自添加**：`prefecture`（CHGIS 府级精细）或 `country`（疆域轮廓示意） |

### 1.3 已知偏差

| 现象 | 原因 |
|:---|:---|
| **夏、商、周无地图** | CHGIS 从秦代开始收录（分封制时代无稳定府县） |
| **春秋战国无独立地图** | 同上 |
| **三国蜀汉政区稀疏** | CHGIS 对该时期西南采集不足 |
| **辽/金/西夏是轮廓而非府级** | CHGIS 以宋为中心视角，辽金西夏府级几乎空白。本项目参考谭其骧《中国历史地图集》第六册补充了**疆域轮廓多边形**作为替代 |

---

## 二、🌍 世界历代格局（historical-basemaps）

### 2.1 目录清单

| 文件 | 对应时段 | 年份 | 国家/政权数 |
|:---|:---|:---:|:---:|
| `bce-3000.geojson` | 四大文明起源 | 前3000 | 138 |
| `bce-1500.geojson` | 青铜时代中期 | 前1500 | 163 |
| `bce-1000.geojson` | 铁器时代早期 | 前1000 | 163 |
| `bce-500.geojson` | 轴心时代 | 前500 | 189 |
| `bce-323-alexander.geojson` | 亚历山大帝国鼎盛 | 前323 | 149 |
| `bce-200.geojson` | 汉与罗马并立之初 | 前200 | 183 |
| `bce-1.geojson` | 公元之交 | 前1 | 442 |
| `ce-200.geojson` | 罗马五贤帝/汉末 | 200 | 354 |
| `ce-500.geojson` | 西罗马灭亡后 | 500 | 205 |
| `ce-800-caliphate-carolingian.geojson` | 查理曼·阿拉伯 | 800 | 225 |
| `ce-1000.geojson` | 千年之交 | 1000 | 264 |
| `ce-1200-mongol-rise.geojson` | 蒙古崛起前夜 | 1200 | 286 |
| `ce-1300-mongol-peak.geojson` | 蒙古帝国鼎盛 | 1300 | 237 |
| `ce-1492-age-of-discovery.geojson` | 大航海时代 | 1492 | 1946 |
| `ce-1600.geojson` | 早期近代 | 1600 | 866 |
| `ce-1700.geojson` | 绝对王权 | 1700 | 782 |
| `ce-1815-vienna.geojson` | 维也纳体系 | 1815 | 436 |
| `ce-1880.geojson` | 瓜分非洲前夜 | 1880 | 236 |
| `ce-1914-wwi.geojson` | 一战前夜 | 1914 | 177 |
| `ce-1945-wwii.geojson` | 二战结束 | 1945 | 227 |
| `ce-2000.geojson` | 当代世界 | 2000 | 240 |

### 2.2 feature 字段约定

| 字段 | 说明 |
|:---|:---|
| `NAME` | 国家/政权/文化区名称 |
| `SUBJECTO` | 宗主国（殖民地标注用，非殖民地填区域名） |
| `PARTOF` | 更大的文化圈归属 |
| `BORDERPRECISION` | 边界精度等级：1=近似 / 2=中等 / 3=国际法确定 |

### 2.3 使用建议

- **1648 年威斯特伐利亚和约前的"国界"都是学术重建**，仅供示意
- **不要把历史边界叠到现代物理底图**（河流、海岸线在千年尺度上会变）
- **多源交叉验证**：古代疆域学界有争议，用时请对比其他来源

---

## 三、调用方式

### 3.1 中国史语境

```javascript
// 讲宋辽对峙
fetch('./data/geography/historical-china/north-song-dynasty.geojson')
  .then(r => r.json())
  .then(data => {
    // data.features 里既有 CHGIS 的府级 feature（LEVEL=prefecture, POWER=北宋）
    // 也有手绘的辽/西夏/大理/吐蕃疆域轮廓（LEVEL=country）
  });

// 时间线切换
fetch('./data/history/timelines/chinese-dynasties.json');
```

### 3.2 世界史语境

```javascript
// 讲蒙古帝国
fetch('./data/geography/historical-world/ce-1300-mongol-peak.geojson');

// 时间线切换
fetch('./data/history/timelines/world-history-periods.json');
```

### 3.3 并存语境（中外对比）

在同一张地图上同时加载**中国府级** + **世界切片**即可，例如讲"汉武帝与罗马共和国同期"：

```javascript
Promise.all([
  fetch('./data/geography/historical-china/west-han-dynasty.geojson'),
  fetch('./data/geography/historical-world/bce-200.geojson'),
]).then(/* 同屏绘制两层 */);
```

---

## 四、其他常用地理资产

| 类别 | 目录 |
|:---|:---|
| 现代中国行政边界 | `data/geography/modern-china/` |
| 世界当代国界 | `data/geography/world/countries.geojson` |
| 地形晕渲底图 | `data/geography/hillshade/` (4k/8k 9 张) |
| 河流/湖泊/海岸线 | `data/geography/{rivers,lakes,coastline}/` |
| 历史人物/战役/古都 | `data/history/{figures,battles,cities,landmarks}/` |

---

## 五、预览页

- `data/map-inventory-preview.html` — 一键切换中国/世界两套地图，支持政权着色、缩放、hover 查看属性。
