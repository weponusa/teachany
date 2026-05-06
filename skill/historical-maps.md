# 📜 历史地理课件地图使用规范（TeachAny · v7.9.4）

> ⛔ **v7.9.4 强制规则：历史/地理课件只能用 `scripts/teachany-historical-map.{css,js}` 标准模块渲染地图，严禁自行造地图实现。**
>
> 这意味着：
> - ✅ 用 `<div data-teachany-map="..." data-teachany-map-scope="china|world">` + `data-teachany-map-config` JSON 声明式调用
> - ❌ 禁止手写 `L.tileLayer` / `L.geoJSON` / `L.marker` 等底层 Leaflet 代码
> - ❌ 禁止用 ECharts `geo` / `graphic` 组件
> - ❌ 禁止用 Canvas / SVG / D3 自己画地图
> - ❌ 禁止用在线 XYZ 瓦片服务（CartoDB / Esri / OSM）
>
> **标准模块**自动处理：底图加载（hillshade.jpg）+ GeoJSON 疆域渲染 + 城市标注 + 朝代切换 + 描述面板 + 图例。
> AI 只需要：(1) 复制 geojson + hillshade.jpg 到课件 `assets/maps/`；(2) 写 HTML 声明块。其他全部由模块完成。
>
> 本文档是**制作历史/地理类课件时必读的唯一权威**。SKILL_CN.md 基线⑩是简要索引，详细规范、完整资产清单、可复用代码模板，全部汇总在此。
>
> **核心原则（v7.2 重构）**：本地地图资源优先（`assets/maps/` 的地形底图、行政边界 GeoJSON + 本地地形瓦片），标准 Web Mercator 投影（Leaflet 默认 CRS），彻底杜绝"无底图 / 投影错乱 / 白板地图"。
>
> ⛔ **严禁直接使用在线 XYZ 瓦片切片**（CartoDB / Esri / OpenStreetMap 等）作为地图底图。必须使用 `assets/maps/` 下的本地资源，确保课件离线可用、加载稳定、无外部依赖。
>
> ⚠️ **v7.2 变更**：不再使用在线 XYZ 瓦片服务。改用 `assets/maps/physical/` 本地地形瓦片 + `assets/maps/political/` 行政边界 GeoJSON + `assets/maps/chrono-*/` 历史疆域 GeoJSON。在线瓦片仅作最终降级回退。
>
> **v7.0 → v7.2 迁移要点**：
> - ❌ `L.tileLayer('https://{s}.basemaps.cartocdn.com/...')` → 禁止
> - ❌ `L.tileLayer('https://server.arcgisonline.com/...')` → 禁止
> - ✅ `L.tileLayer('./data/maps/physical/terrain-tiles/{z}/{x}/{y}.png')` → 本地瓦片
> - ✅ `L.imageOverlay('./data/maps/physical/hillshade/global-color-hillshade-4k.jpg', bounds)` → 本地地形阴影
> - ✅ `fetch('./data/maps/political/world/countries.geojson')` → 本地行政边界
> - ✅ `fetch('./data/maps/physical/coastline/ne_10m_coastline.json')` → 本地海岸线

---

## 🚨 开工前：AI 必须先确认资源已安装

**在为用户写任何历史/地理课件代码之前**，AI 必须：

```bash
# 1. 秒级检测
bash ~/.codebuddy/skills/teachany/scripts/check_map_resources.sh

# 2. 如退出码非 0，立即安装（幂等，可重复运行）
bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh
```

- 检测失败时**直接自己跑**，不要让用户手动执行
- 告诉用户"地图资源缺失，正在安装，首次约 3-5 分钟"
- 安装完成后再进入课件生成流程

## 🎨 另外：每个历史/地理课件至少 3 张 AI 图

历史地理类课件除了地图之外，**必须再补 ≥ 3 张 AI 生成的插图**（B-3a 基线）：

- **Hero / 引入段** 1 张：知识结构信息图，展示本课完整知识点及层级关系（思维导图/概念图风格）
- **核心概念 / 建模段** 1 张：历史事件复原、地貌示意
- **拓展 / 总结段** 1 张：人物、遗迹、文化符号

用 WorkBuddy 原生 `image_gen`，保存到 `assets/`，HTML 用 `<img>` 真实引用。**仅放 `data-suggested-prompt` 占位符不算数**。
⚠️ **Prompt 语言规则**：中国课标的历史/地理课件，所有 prompt 必须用**中文**，图中标注必须是中文。

## 🗺️ 地图路径自适应（本地/线上都要能跑）

**⚠️ 严重陷阱**：课件在 WorkBuddy 本地开发时用 `../data/...` 能跑，推到 `community/` 或 `examples/` 就会 404。**必须用自适应路径**：

```javascript
const TEACHANY_MAP_BASE = (function() {
  // GitHub Pages 部署
  if (location.hostname.endsWith('github.io')) return '/teachany/data';
  if (location.hostname.includes('teachany'))  return '/data';
  // 本地 python3 -m http.server 启动时
  return '../data';
})();
const ABS_FALLBACK = 'https://weponusa.github.io/teachany/data';

async function fetchMap(relPath) {
  const candidates = [
    `${TEACHANY_MAP_BASE}/${relPath}`,
    `../../data/${relPath}`,        // 有的课件在两层子目录
    `${ABS_FALLBACK}/${relPath}`,   // 最后回退到线上绝对 URL
  ];
  for (const url of candidates) {
    try { const r = await fetch(url); if (r.ok) return r.json(); } catch {}
  }
  throw new Error('地图资源不可达');
}
```

**为什么需要**：
- `community/<course-id>/index.html` 的 `..` = `community/`，那里没有 data/
- `examples/<course-id>/index.html` 的 `..` = `examples/`，也没有 data/
- **真正的 data/ 在仓库根**，线上路径是 `https://weponusa.github.io/teachany/data/...`

直接看 `templates/map-section-template.html` 的最新实现，AI 生成课件时应**原样拷用**。

---

## 一、资产架构总览

课件调用路径永远是 **`./data/geography/...` 和 `./data/history/...`**（相对于课件 HTML 所在目录往上两级）。实际物理文件可能位于 `data/_legacy/resources/` 下，由仓库顶层的 symlink 透出。

### 1.1 两套历史资产（按语境二选一，不要混用）

| 语境 | 资产套 | 目录 | 时间线 | 数据源 |
|:---|:---|:---|:---|:---|
| 讲**中国史** | 🇨🇳 中国历代疆域 | `data/geography/historical-china/` | `data/history/timelines/chinese-dynasties.json` | CHGIS V6（府级） + historical-basemaps（疆域轮廓） |
| 讲**世界史** | 🌍 世界历代格局 | `data/geography/historical-world/` | `data/history/timelines/world-history-periods.json` | historical-basemaps (aourednik, GPL-3.0) |

> ⚠️ **不要用中国朝代去等价世界切片**：秦朝（前 221~前 206）对应的世界切片是 `bce-200.geojson`；宋朝则跨 `ce-1000` 到 `ce-1200`。讲"同期中外对比"时同屏加载两个文件。

### 1.2 地形底图（两套都可用）

等距圆柱投影 (Plate Carrée / EPSG:4326) 的全球 JPG 影像，位于 `data/geography/hillshade/`：

| 文件 | 分辨率 | 大小 | 风格 | 使用场景 |
|:---|:---:|:---:|:---|:---|
| **`global-color-hillshade-4k.jpg`** | 4096×2048 | 828 KB | 彩色+阴影融合 | **⭐ 课件默认底图** |
| `global-color-hillshade-8k.jpg` | 8192×4096 | 3.3 MB | 同上高清 | 大屏展示 |
| `global-color-hillshade-2k.jpg` | 2048×1024 | 199 KB | 同上低清 | 快速加载 |
| `global-hillshade-4k.jpg` | 4096×2048 | 586 KB | 灰度阴影 | 要在上面叠彩色数据层时首选 |
| `global-color-relief-4k.jpg` | 4096×2048 | 573 KB | 纯彩色分层 | 不要立体阴影时 |

- 数据源：Natural Earth SR + HYP (Public Domain)
- 覆盖：`[-90°, -180°]` 至 `[90°, 180°]` 全球
- 坐标映射：`lon = (x/width)*360 - 180`, `lat = 90 - (y/height)*180`

### 1.3 中国历代疆域清单（17 个文件）

| 文件 | 朝代 | 年份 | 府级数 | 疆域轮廓政权 |
|:---|:---|:---:|:---:|:---|
| `qin-dynasty.geojson` | 秦 | 前221~前206 | 13 | 秦（疆域轮廓用同期汉近似） |
| `west-han-dynasty.geojson` | 西汉 | 前202~公元8 | 73 | 西汉 |
| `east-han-dynasty.geojson` | 东汉 | 25~220 | 69 | 东汉 + 南匈奴 |
| `han-dynasty.geojson` | 汉合并 | 前202~220 | 149 | 汉 |
| `three-kingdoms.geojson` | 三国 | 220~280 | 86 | 魏 / 蜀 / 吴 |
| `jin-west-dynasty.geojson` | 西晋 | 265~316 | 77 | 西晋 |
| `jin-east-dynasty.geojson` | 东晋 | 317~420 | 69 | 东晋 + 北方十六国 |
| `northern-southern.geojson` | 南北朝 | 420~589 | 326 | 北魏 / 南朝 |
| `sui-dynasty.geojson` | 隋 | 581~618 | 363 | 隋 |
| `tang-dynasty.geojson` | 唐 | 618~907 | 855 | 唐 |
| `five-dynasties.geojson` | 五代十国 | 907~960 | 233 | 9 个并立政权 |
| `north-song-dynasty.geojson` | 北宋 | 960~1127 | 434 | 北宋 + 辽 + 西夏 + 吐蕃 + 高丽 + 日本 |
| `south-song-dynasty.geojson` | 南宋 | 1127~1279 | 345 | 南宋 + 金 + 西夏 + 吐蕃 + 蒙古 + 高丽 + 日本 |
| `song-dynasty.geojson` | 宋合并 | 960~1279 | 779 | 上两者合并 |
| `yuan-dynasty.geojson` | 元 | 1271~1368 | 630 | 元 + 吐蕃 |
| `ming-dynasty.geojson` | 明 | 1368~1644 | 810 | 明 |
| `qing-dynasty.geojson` | 清 | 1644~1912 | 882 | 清 |

### 1.4 世界历代格局清单（21 个时间切片）

| 文件 | 时代 | 年份 | 国家数 |
|:---|:---|:---:|:---:|
| `bce-3000.geojson` | 四大文明起源 | 前3000 | 138 |
| `bce-1500.geojson` | 青铜中期（商 / 埃及新王国） | 前1500 | 163 |
| `bce-1000.geojson` | 铁器早期（西周 / 亚述） | 前1000 | 163 |
| `bce-500.geojson` | 轴心时代（春秋 / 波斯 / 希腊城邦） | 前500 | 189 |
| `bce-323-alexander.geojson` | 亚历山大帝国鼎盛 | 前323 | 149 |
| `bce-200.geojson` | 汉·罗马共和国 | 前200 | 183 |
| `bce-1.geojson` | 公元之交（西汉 / 奥古斯都） | 前1 | 442 |
| `ce-200.geojson` | 汉末 / 罗马五贤帝 | 200 | 354 |
| `ce-500.geojson` | 西罗马灭亡后 | 500 | 205 |
| `ce-800-caliphate-carolingian.geojson` | 查理曼·阿拔斯 | 800 | 225 |
| `ce-1000.geojson` | 千年之交（北宋 / 神罗 / 拜占庭） | 1000 | 264 |
| `ce-1200-mongol-rise.geojson` | 蒙古崛起前夜 | 1200 | 286 |
| `ce-1300-mongol-peak.geojson` | 蒙古帝国鼎盛 | 1300 | 237 |
| `ce-1492-age-of-discovery.geojson` | 大航海 | 1492 | 1946 |
| `ce-1600.geojson` | 早期近代 | 1600 | 866 |
| `ce-1700.geojson` | 绝对王权 | 1700 | 782 |
| `ce-1815-vienna.geojson` | 维也纳体系 | 1815 | 436 |
| `ce-1880.geojson` | 瓜分非洲前夜 | 1880 | 236 |
| `ce-1914-wwi.geojson` | 一战前夜 | 1914 | 177 |
| `ce-1945-wwii.geojson` | 二战结束 | 1945 | 227 |
| `ce-2000.geojson` | 当代世界 | 2000 | 240 |

### 1.5 其他地理资产

| 类别 | 路径 |
|:---|:---|
| 中国省级行政 | `data/geography/modern-china/provinces.geojson`（34 省级） |
| 北京区县 | `data/geography/modern-china/beijing.geojson` |
| 上海区县 | `data/geography/modern-china/shanghai.geojson` |
| 世界当代 | `data/geography/world/countries.geojson` |
| 河流水系 | `data/geography/rivers/ne_10m_rivers_china.json` |
| 湖泊 | `data/geography/lakes/` |
| 海岸线 | `data/geography/coastline/` |

### 1.6 历史数据（非空间）

| 文件 | 说明 |
|:---|:---|
| `data/history/timelines/chinese-dynasties.json` | 15 个朝代条目（含 map_file、皇帝、事件） |
| `data/history/timelines/dynasties-detailed.json` | 详细朝代数据（emperors / events / landmarks / poems） |
| `data/history/timelines/world-history-periods.json` | 21 个世界切片条目（highlights / map_file） |
| `data/history/figures/persons.json` | 历史人物数据库 |
| `data/history/battles/`、`cities/`、`landmarks/` | 古战场、古都、地标 |

---

## 二、核心调用原则（不遵守课件必翻车）

### 2.1 底图方案：XYZ 瓦片双层叠加（v7.0）

**v7.0 起使用 XYZ 瓦片服务替代本地 imageOverlay**：

| 图层 | 服务 | 作用 | 不透明度 | API Key |
|:---|:---|:---|:---|:---|
| 暗色底图 | CartoDB Dark (basemaps-{s}.global.ssl.fastly.net) | 海洋/陆地/国界线/地名标注 | 0.85-0.9 | 无需 |
| 地形纹理 | Esri World Shaded Relief (arcgisonline.com) | 山脉/河流/地形起伏 | 0.35-0.45 | 无需 |

**代码（直接使用 `templates/map-section-template.html` 的 `addBaseTiles` 函数）**：
```javascript
function addBaseTiles(map, opts = {}) {
  const terrainOpacity = opts.terrainOpacity ?? 0.4;
  const darkOpacity    = opts.darkOpacity    ?? 0.88;
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    subdomains: 'abcd', maxZoom: 19, opacity: darkOpacity,
    attribution: '© CartoDB · © OpenStreetMap'
  }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 13, opacity: terrainOpacity,
    attribution: 'Esri · Shaded Relief'
  }).addTo(map);
}
```

**优势**：
- ✅ 无投影错位（XYZ 瓦片与 GeoJSON 都是 Web Mercator / WGS84）
- ✅ 无需下载本地文件（全球 CDN，无离线资源安装步骤）
- ✅ 多级缩放（z2-z19），细节丰富
- ✅ Leaflet 默认 CRS，无需设置 `L.CRS.EPSG4326`

> ⚠️ **废弃**：v6 的 `L.CRS.EPSG4326` + `L.imageOverlay` + hillshade JPG 方案已废弃。如遇旧课件仍用此方案，应迁移到 v7.0 XYZ 瓦片方案。

### 2.2 历史地图必须双层架构（v7.0 简化）

1. **底层**：XYZ 瓦片底图（CartoDB Dark + Esri Shaded Relief，提供地理常识：山脉/沙漠/海洋/现代边界）
2. **上层**：历史疆域 GeoJSON（`historical-*/` 国家级疆域轮廓 + 可选府级政区）

缺少底层 → 学生看到白板地图，无地理参照；缺少上层 → 无历史信息。

### 2.3 视野必须锁定

中国历代 geojson 的 `metadata.recommended_bbox` 字段已经预设好**东亚视野 `[70, 15, 145, 55]`**，必须用 `fitBounds` 强制套用；否则 echarts/leaflet 会按 feature bbox 自动 fit，导致不同朝代图缩放不一致、甚至被少量远处 feature 拉扯到奇怪视角。

---

## 三、标准代码模板（复制即用）

### 3.1 ⭐ 完整中国历代课件模板（v7.0 XYZ 瓦片底图 + GeoJSON）

> ⚠️ **权威模板**：`templates/map-section-template.html` 是最新实现。以下为精简版，AI 生成课件时应以 template 文件为准。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>历史地图 · {朝代}</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  #map { width: 100%; height: 640px; background: #0c1526; }
  .leaflet-container { background: #0c1526; }
</style>
</head>
<body>
<div id="map"></div>
<script>
// ⭐ v7.0：使用 Leaflet 默认 CRS（Web Mercator），不设 L.CRS.EPSG4326
const map = L.map('map', {
  center: [34, 104],
  zoom: 4,
  minZoom: 2,
  maxZoom: 10,
});

// ⭐ v7.0 关键：双层 XYZ 瓦片底图（免费、无 API Key）
function addBaseTiles(map, opts = {}) {
  const terrainOpacity = opts.terrainOpacity ?? 0.4;
  const darkOpacity    = opts.darkOpacity    ?? 0.88;
  // 暗色底图：海洋/陆地/国界/地名
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    subdomains: 'abcd', maxZoom: 19, opacity: darkOpacity,
    attribution: '© CartoDB · © OpenStreetMap'
  }).addTo(map);
  // 地形纹理：山脉/河流
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 13, opacity: terrainOpacity,
    attribution: 'Esri · Shaded Relief'
  }).addTo(map);
}
addBaseTiles(map);

// 加载朝代数据
const DYNASTY = 'tang-dynasty';  // ← 换朝代改这里
fetch(`./data/geography/historical-china/${DYNASTY}.geojson`)
  .then(r => r.json())
  .then(data => {
    // 按 LEVEL 分层
    const countryFeats = data.features.filter(f => f.properties.LEVEL === 'country');
    const prefFeats = data.features.filter(f => f.properties.LEVEL !== 'country');

    // 国家疆域轮廓（半透明底色 + 粗边）
    L.geoJSON(countryFeats, {
      style: f => ({
        color: powerColor(f.properties.POWER),
        weight: 2.5, opacity: 0.95,
        fillColor: powerColor(f.properties.POWER),
        fillOpacity: 0.25,
      }),
      onEachFeature: (f, l) => l.bindPopup(`<b>${f.properties.NAME_CH}</b><br/>政权: ${f.properties.POWER}`),
    }).addTo(map);

    // 府级细节（饱和色 + 细边）
    L.geoJSON(prefFeats, {
      style: f => ({
        color: '#1e293b', weight: 0.3, opacity: 0.6,
        fillColor: powerColor(f.properties.POWER),
        fillOpacity: 0.55,
      }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindPopup(`<b>${p.NAME_CH}</b>（${p.TYPE_CH || '府'}）<br/>政权: ${p.POWER}<br/>存续: ${p.BEG_YR}~${p.END_YR}`);
      },
    }).addTo(map);

    // 用 metadata.recommended_bbox 锁定视野
    const bbox = data.metadata?.recommended_bbox || [70, 15, 145, 55];
    map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
  });

// 政权配色（节选，完整表见下方 3.6）
const POWER_COLORS = {
  '秦':'#8B008B','西汉':'#DC143C','东汉':'#CD5C5C','汉':'#DC143C',
  '魏':'#A52A2A','蜀':'#20B2AA','吴':'#3CB371',
  '唐':'#FFD700','北宋':'#4169E1','南宋':'#1E90FF',
  '辽':'#483D8B','金':'#8B4513','西夏':'#B8860B',
  '元':'#20B2AA','明':'#FF4500','清':'#FFD700',
  '北方十六国':'#9370DB','北魏':'#B22222','南朝':'#2E8B57',
  '隋':'#FF6347','西晋':'#DAA520','东晋':'#20B2AA',
  '蒙古':'#20B2AA','大理':'#DEB887',
};
function powerColor(p) { return POWER_COLORS[p] || '#64748b'; }
</script>
</body>
</html>
```

### 3.2 完整世界历代课件模板（v7.0）

```javascript
// v7.0：使用默认 CRS + XYZ 瓦片底图
const map = L.map('map', { center: [20, 30], zoom: 2, minZoom: 2, maxZoom: 10 });

// 双层瓦片底图
addBaseTiles(map, { terrainOpacity: 0.35, darkOpacity: 0.9 });

const PERIOD = 'ce-1300-mongol-peak';
fetch(`./data/geography/historical-world/${PERIOD}.geojson`)
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      style: f => ({
        color: '#0f172a', weight: 0.6, opacity: 0.7,
        fillColor: hashColor(f.properties.SUBJECTO || f.properties.NAME),
        fillOpacity: 0.55,
      }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindPopup(`<b>${p.NAME || '未命名'}</b><br/>宗主: ${p.SUBJECTO || '-'}<br/>属于: ${p.PARTOF || '-'}<br/>边界精度: ${p.BORDERPRECISION}/3`);
      },
    }).addTo(map);
    map.fitBounds([[-60, -180], [85, 180]]);
  });

// 世界按 NAME/SUBJECTO hash 配色
function hashColor(str) {
  if (!str) return '#64748b';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 55%, 48%)`;
}
```

### 3.3 时间线切换（中国朝代联动）

```javascript
const dynasties = await fetch('./data/history/timelines/chinese-dynasties.json').then(r => r.json());
// dynasties.dynasties[] 每项含 id/name/start_year/end_year/map_file

let currentLayer = null;
async function switchDynasty(id) {
  const dy = dynasties.dynasties.find(d => d.id === id);
  if (!dy || !dy.map_file) return;
  const data = await fetch(`./data/${dy.map_file.replace(/^\.\.\//, '')}`).then(r => r.json());
  if (currentLayer) map.removeLayer(currentLayer);
  currentLayer = L.geoJSON(data, { /* style... */ }).addTo(map);
  const bbox = data.metadata?.recommended_bbox || [70, 15, 145, 55];
  map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
}

// UI：渲染时间轴按钮
dynasties.dynasties.forEach(dy => {
  const btn = document.createElement('button');
  btn.textContent = `${dy.name} (${dy.start_year > 0 ? dy.start_year : '前' + Math.abs(dy.start_year)}~${dy.end_year})`;
  btn.onclick = () => switchDynasty(dy.id);
  document.getElementById('timeline').appendChild(btn);
});
```

### 3.4 中外同期对比（同屏双层）

```javascript
// 讲"汉武帝与罗马共和国同期"
Promise.all([
  fetch('./data/geography/historical-china/west-han-dynasty.geojson'),
  fetch('./data/geography/historical-world/bce-200.geojson'),
]).then(async ([r1, r2]) => {
  const han = await r1.json(), world = await r2.json();
  // 世界切片作底层（低透明度）
  L.geoJSON(world, { style: { color: '#555', weight: 0.5, fillOpacity: 0.25 } }).addTo(map);
  // 中国切片作上层高亮
  L.geoJSON(han, { style: f => ({ fillColor: '#DC143C', fillOpacity: 0.7, weight: 0.4 }) }).addTo(map);
  map.fitBounds([[10, 50], [55, 150]]);  // 欧亚视野
});
```

### 3.5 现代中国省级（ECharts，速度最快）

```javascript
// ECharts 只用来做数据可视化（不叠地形），不涉及历史
fetch('./data/geography/modern-china/provinces.geojson')
  .then(r => r.json())
  .then(gj => {
    echarts.registerMap('china', gj, { nameProperty: 'name' });
    const chart = echarts.init(document.getElementById('map'));
    chart.setOption({
      geo: { map: 'china', roam: true },
      series: [{ type: 'map', map: 'china', data: [
        { name: '北京市', value: 1.4 },
        { name: '上海市', value: 2.5 },
        // ...
      ]}],
    });
  });
```

### 3.6 政权配色完整表

```javascript
const CHINA_POWER_COLORS = {
  '秦':'#8B008B','秦（疆域轮廓用同期汉帝国近似）':'#8B008B',
  '西汉':'#DC143C','东汉':'#CD5C5C','汉':'#DC143C','南匈奴':'#8B4513',
  '魏':'#A52A2A','蜀':'#20B2AA','吴':'#3CB371',
  '三国（疆域沿用汉末轮廓）':'#A52A2A',
  '西晋':'#808000','东晋':'#9ACD32','北方十六国':'#B22222','北魏（拓跋）':'#B22222',
  '南齐':'#6B8E23','北魏':'#B22222','南朝':'#6B8E23',
  '隋':'#B8860B','隋（疆域轮廓用同期唐近似）':'#B8860B','唐':'#FFD700',
  '后蜀':'#20B2AA','南唐':'#4682B4','吴越':'#1E90FF','闽':'#5F9EA0',
  '南汉':'#008B8B','楚':'#9370DB','荆南':'#BA55D3','北汉':'#D2691E',
  '中原五代':'#FF4500','中原五代前身（近似）':'#FF4500','辽（契丹）':'#483D8B',
  '北宋':'#4169E1','南宋':'#1E90FF','宋':'#4169E1',
  '辽':'#483D8B','金':'#8B4513','金（沿辽地）':'#8B4513',
  '西夏':'#B8860B','吐蕃':'#A0A0A0','吐蕃（宣政院辖地）':'#A0A0A0','吐蕃诸部':'#A0A0A0',
  '大理':'#FF6B6B','高丽':'#66CDAA','日本':'#E74C3C','蒙古':'#5D4037',
  '元':'#20B2AA','明':'#FF4500','清':'#FFD700',
};
```

---

## 四、决策流程（制作历史地理课件时一步步走）

```
Q1：这节课讲什么？
├─ 中国某朝代 / 变迁 → 中国历代（3.1）
├─ 世界某时期 / 文明对比 → 世界历代（3.2）
├─ 中外同期对比 → 同屏双层（3.4）
├─ 当代地理（人口/GDP/气候等） → ECharts 省级（3.5）
└─ 3D 山川地形 → 见 terrain-3d-integration.md

Q2：需要时间联动吗？
├─ 是 → 加 3.3 时间线切换
└─ 否 → 单张地图

Q3：需要事件/人物标注吗？
├─ 是 → 叠加 `dynasties-detailed.json` 的 landmarks/battles
└─ 否 → 只展示疆域

Q4：需要 3D 地形吗？
└─ 只在讲地貌/气候/战略要地时需要，普通历史疆域用 2D hillshade 足够
```

---

## 五、决策示例

| 课件主题 | 调用资产 | 模板 |
|:---|:---|:---|
| 统一多民族国家的建立（秦） | `qin-dynasty.geojson` + `chinese-dynasties.json` | 3.1 |
| 丝绸之路 | `tang-dynasty.geojson` + `rivers/*.json` + `dynasties-detailed.json` 的 landmarks | 3.1 + 标注 |
| 宋辽夏金对峙 | `north-song-dynasty.geojson`（已含所有并立政权） | 3.1 |
| 蒙古帝国扩张 | `ce-1200-mongol-rise` → `ce-1300-mongol-peak`（动画切换） | 3.3 世界版 |
| 大航海时代 | `ce-1492-age-of-discovery.geojson` | 3.2 |
| 古典文明（希腊·罗马·波斯） | `bce-500`（希腊城邦/波斯帝国）+ `bce-200`（罗马共和/迦太基）+ 自定义城市标注层 + 贸易航线 | 3.2 + 城市/航线标注 |
| 亚历山大帝国 | `bce-323-alexander.geojson` | 3.2 |
| 汉武帝 vs 罗马共和 | `west-han-dynasty` + `bce-200` 同屏 | 3.4 |
| 省级人口分布 | `modern-china/provinces.geojson` + ECharts map | 3.5 |
| 我国地形三级阶梯 | hillshade-8k + 阶梯 polygon + SRTM DEM | 3D（见 terrain-3d） |

---

## 六、常见错误 & 排查

| 症状 | 根因 | 修复 |
|:---|:---|:---|
| **地图无底图（白板/纯黑）** | 使用了旧版 v6 的 `L.imageOverlay` 但本地无 JPG 文件 | 迁移到 v7.0 XYZ 瓦片方案（`addBaseTiles` 函数，无需本地文件） |
| **地图错位（GeoJSON 比底图偏北）** | 旧版使用 `L.CRS.EPSG4326` + JPG，与 Leaflet 默认 EPSG:3857 不匹配 | v7.0 方案使用默认 CRS + XYZ 瓦片，无此问题 |
| **历史地图使用现代国界** | 用了 `countries.geojson`（当代国界）代替 `historical-world/bce-*.geojson` | 按课件时代选择对应的世界时间切片 GeoJSON（见 1.4 清单），用 `NAME`/`SUBJECTO` 属性配色 |
| **画面像"世界地图里一小块"** | CHGIS 对早期朝代府级稀疏，auto-fit 后 bbox 过小 | 读取 `metadata.recommended_bbox` 强制 `fitBounds` |
| **宋朝只看见宋，没看见辽金** | 用了旧版 CHGIS 数据，没用新 `north-song-dynasty.geojson` | 用本文档 1.3 表里的新文件（含 LEVEL=country 轮廓） |
| **秦朝地图只有南方** | CHGIS 秦代数据只有 13 个南方郡；需要 country 轮廓层兜底 | 新版 `qin-dynasty.geojson` 已含 country feature |
| **浏览器 CORS 报错** | 直接双击 HTML 打开，走 file:// 协议 | 用 `python3 -m http.server 8080` 或部署到 GitHub Pages |

---

## 七、数据版权与引用

| 资产 | 许可证 | 引用格式 |
|:---|:---|:---|
| CartoDB Dark Basemap | CC BY 3.0 | "© CartoDB · © OpenStreetMap contributors" |
| Esri World Shaded Relief | Esri Master License | "Esri · Shaded Relief" |
| Natural Earth hillshade（旧版备用） | Public Domain | "Basemap: Natural Earth" |
| CHGIS V6 | Free for Academic Use | "China Historical GIS V6, CHGIS 2016" |
| historical-basemaps | GPL-3.0 | "Ourednik, A. (2016). Historical-basemaps. GitHub." |

**课件 HTML 需在底部或 attribution 区保留上述出处**，这是免费使用的前提。

---

## 八、版本历史

- **v7.0 (2026-04-29)**：底图架构重构
  - ⛔ 废弃 `L.CRS.EPSG4326` + `L.imageOverlay` + hillshade JPG 方案
  - 改用 XYZ 瓦片双层底图（CartoDB Dark + Esri Shaded Relief）
  - 使用 Leaflet 默认 Web Mercator CRS，与 GeoJSON 原生对齐
  - 无需下载本地 hillshade 文件，全球 CDN 加速
  - 新增更多朝代配色（北方十六国、北魏、南朝、隋、西晋、东晋、蒙古、大理）
  - Completeness Gate 新增 #36 地图规范检查
- **v6 (2026-04-23)**：双资产完整重构
  - 中国 17 朝代 + 世界 21 切片
  - 每个中国朝代补国家级疆域轮廓（解决 CHGIS 早期稀疏）
  - metadata.recommended_bbox 锁定东亚视野
  - ~~Leaflet 强制 EPSG:4326 CRS~~（已被 v7.0 废弃）
  - ~~三层架构（地形 + 疆域 + 细节）~~（v7.0 简化为双层）
- v5.13：首次引入 hillshade 地形底图
- v5.12：外部数据源清单
- v5.11：三层架构规范

---

## 九、安装与更新

### 9.1 首次使用（AI 自动触发，无需用户操作）

当 skill 检测到项目缺少地图资源时，自动执行：

```bash
bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh [可选:项目路径]
```

### 9.2 只检测不安装

```bash
bash ~/.codebuddy/skills/teachany/scripts/check_map_resources.sh
# 退出码：0=完整 / 1=缺失 / 2=未找到项目
```

### 9.3 skill 自带脚本清单

`~/.codebuddy/skills/teachany/scripts/` 目录：

| 脚本 | 作用 |
|:---|:---|
| `check_map_resources.sh` | 秒级检测当前项目的地图资源完整性 |
| `install_map_resources.sh` | 一键下载并安装全部资源（含调用下列脚本） |
| `build_chgis_dynasty_maps_v2.sh` | 用 mapshaper 切片 CHGIS V6 shapefile → 17 个朝代 GeoJSON |
| `annotate_dynasty_powers.py` | 给 feature 加 POWER 字段（魏/蜀/吴、辽/西夏、十六国等） |
| `build_song_era_maps.py` | 合成北宋/南宋地图（CHGIS 府级 + historical-basemaps 周边政权） |
| `rebuild_china_maps.py` | 给每个朝代补国家级疆域轮廓 + `metadata.recommended_bbox` |

### 9.4 完整性要求

课件可运行的最低核心资源：

- `data/geography/hillshade/global-color-hillshade-4k.jpg`（至少 4k 彩色阴影）
- `data/geography/historical-china/tang-dynasty.geojson`（至少唐朝）
- `data/geography/historical-world/ce-1300-mongol-peak.geojson`（至少一个世界切片）
- `data/history/timelines/chinese-dynasties.json`

`check_map_resources.sh` 正是以这 4 项为最低门槛。

### 9.5 手动下载清单（极端情况）

如果自动安装因网络问题失败：

| 资源 | 手动获取 |
|:---|:---|
| Natural Earth hillshade | https://www.naturalearthdata.com/downloads/10m-raster-data/<br/>用 gdal 合成 HYP_HR × SR_HR，降采样到 4k JPG |
| historical-basemaps | `git clone https://github.com/aourednik/historical-basemaps` 取 geojson/ 目录 |
| CHGIS V6 shapefile | https://dataverse.harvard.edu/dataverse/chgis_v6<br/>下载 `v6_time_pref_pgn_utf_wgs84.zip` 解压到 `/tmp/chgis_v6/` 后重跑 install 脚本 |
| 中国省级 | https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json |
| 世界当代国界 | https://github.com/martynafford/natural-earth-geojson → `50m/cultural/ne_50m_admin_0_countries.json` |
