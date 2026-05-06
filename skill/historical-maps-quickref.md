# 📋 AI 标准地图调用模板 · 历史/地理课件（v7.9.4）

> **本文档**：给 AI 的快速上手指南。完整资产清单见 `historical-maps.md`。

---

## 一、路径约定（两种场景通用）

```
课件目录结构（两种情况）：

情况A：examples/<course-id>/index.html
  引用 scripts/ → ../../scripts/teachany-historical-map.css
  引用 skill/   → ../../skill/assets/historical-china/<file>   ← 相对路径！

情况B：community/<course-id>/index.html
  引用 scripts/ → ../../scripts/teachany-historical-map.css
  引用 skill/   → ../../skill/assets/historical-china/<file>   ← 相对路径！

  ⚠️ skill/ 资产引用 ../../skill/ 而非 ../../scripts/skill/
  实际物理路径：<teachany-repo>/skill/assets/historical-china/<file>
  相对路径从课件 HTML 出发：../../skill/assets/...
```

---

## 二、快速开始（两条路径，选适合你的）

### 路径A：手动复制 → 粘贴模板（推荐 AI 生成课件时用）

**Step 1：复制资产文件到课件目录**

```bash
# 假设当前在 teachany 仓库根目录
# 以唐朝课件为例，复制唐宋历史地图资产

mkdir -p community/<course-id>/assets/maps/
cp -n skill/assets/historical-china/tang-dynasty.geojson community/<course-id>/assets/maps/ 2>/dev/null || true
cp -n skill/assets/historical-china/song-dynasty.geojson community/<course-id>/assets/maps/ 2>/dev/null || true
cp -n skill/assets/historical-china/yuan-dynasty.geojson community/<course-id>/assets/maps/ 2>/dev/null || true
cp -n skill/assets/hillshade/global-color-hillshade-2k.jpg community/<course-id>/assets/maps/hillshade.jpg 2>/dev/null || true
```

> **必需文件**（每个历史地图课件必须同时存在）：
> - `assets/maps/<朝代>.geojson` — 至少 1 个时代的 GeoJSON
> - `assets/maps/hillshade.jpg` — 全球彩色阴影地形底图（205KB）
>
> **禁止**：不复制 hillshade.jpg 就交付历史地图课件。

**Step 2：在 `<head>` 中引入依赖（一次引入，全课件生效）**

```html
<head>
  ...
  <!-- Leaflet 核心库（必须最先引入）-->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <!-- 标准历史地图模块 -->
  <link rel="stylesheet" href="../../scripts/teachany-historical-map.css">
  <script src="../../scripts/teachany-historical-map.js" defer></script>
</head>
```

**Step 3：在课件正文合适位置插入地图 section**

```html
<!-- ⭐ 标准历史地图模块（放在 module-1 之后或 intro 之后）-->
<section class="ta-standard-section" id="historical-map">
  <h2 style="text-align:center;margin-bottom:16px;">🗺️ 历史地图</h2>

  <div data-teachany-map="my-dynasty-map"
       data-teachany-map-scope="china"
       data-teachany-map-title="唐朝至清朝疆域变迁">
    <script type="application/json" data-teachany-map-config>
    {
      "eras": [
        {
          "id": "tang",
          "label": "唐 (618-907)",
          "file": "tang-dynasty.geojson",
          "fill": "#f59e0b",
          "stroke": "#d97706",
          "desc": "<span class=\"thm-year-tag\">618-907</span><strong>唐朝盛世</strong>：贞观之治、开元盛世。三省六部，两税法。",
          "cities": [
            [34.27, 108.94, "长安", "Chang'an", "唐朝都城"],
            [23.13, 113.26, "广州", "Guangzhou", "海上丝路起点"],
            [29.88, 121.55, "明州", "Mingzhou", "今宁波，对外贸易港"]
          ]
        },
        {
          "id": "song",
          "label": "北宋 (960-1127)",
          "file": "north-song-dynasty.geojson",
          "fill": "#4169E1",
          "stroke": "#2a4f9e",
          "desc": "<span class=\"thm-year-tag\">960-1127</span><strong>北宋与辽夏金并立</strong>：经济重心南移，商品经济繁荣。",
          "cities": [
            [39.90, 116.40, "开封", "Kaifeng", "北宋都城，汴京"]
          ]
        },
        {
          "id": "yuan",
          "label": "元 (1271-1368)",
          "file": "yuan-dynasty.geojson",
          "fill": "#20B2AA",
          "stroke": "#1a8a84",
          "desc": "<span class=\"thm-year-tag\">1271-1368</span><strong>元朝大一统</strong>：行省制度确立，疆域空前辽阔。",
          "cities": [
            [39.90, 116.40, "大都", "DadU", "元朝都城"]
          ]
        }
      ],
      "center": [34, 108],
      "zoom": 4,
      "fitBounds": [[15, 70], [55, 145]]
    }
    </script>
  </div>
</section>
```

**Step 4：在 `</body>` 前引入地图模块初始化脚本**

```html
<body>
  <!-- 课件内容... -->

  <!-- 五件套模块（已有则跳过）-->
  <script src="../../scripts/teachany-knowledge-graph.js" defer></script>
  <!-- ⭐ 历史地图模块（放在知识图谱之前）-->
  <script src="../../scripts/teachany-historical-map.js" defer></script>

  <!-- AI 学伴配置 + JS（必须紧跟在配置对象之后）-->
  <script>
    window.__TEACHANY_TUTOR_CONFIG__ = { /* 省略 */ };
  </script>
  <script src="../../scripts/ai-tutor.js"></script>
</body>
```

---

### 路径B：用批量脚本（已有课件需要事后补救时用）

```bash
# 用之前先编辑 historical-maps-manifest.json，添加课件配置
# 然后运行：
python3 scripts/apply-historical-maps.py
```

脚本自动完成：复制 geojson → 复制 hillshade.jpg → 注入 CSS/JS → 插入地图 section。

---

## 三、模块路径回退逻辑（自动的，但你得知道）

`teachany-historical-map.js` 内部按以下顺序找 geojson，**找到即停**：

```
1. ./assets/maps/<file>          ← 课件本地（优先，本地预览用）
2. assets/maps/<file>            ← 同上（兼容写法）
3. ../../skill/assets/historical-china/<file>   ← examples/ 下课件
4. ../../skill/assets/historical-world/<file>   ← 世界史备选
5. https://cdn.jsdelivr.net/gh/weponusa/teachany@main/skill/assets/...  ← CDN fallback
```

**重要**：第三层 `../../skill/assets/` 是从**课件 HTML 文件**出发的相对路径。如果课件在 `examples/geo-monsoon/index.html`，这个路径解析为：
```
examples/geo-monsoon/  +  ../../skill/assets/  =  skill/assets/
```
所以**不需要知道 skill 实际装在哪**，相对路径自动正确。

---

## 四、必做清单（AI 生成历史/地理课件时）

- [ ] 确认 `<head>` 中有 `leaflet.css` + `teachany-historical-map.css`
- [ ] 确认 `</body>` 前有 `teachany-historical-map.js`（带 defer）
- [ ] `assets/maps/` 下有 ≥1 个 `.geojson` 文件
- [ ] `assets/maps/hillshade.jpg` 存在（205KB 全球彩色阴影底图）
- [ ] 地图 section 在 `<section id="historical-map">` 内
- [ ] `data-teachany-map-config` JSON 中每个 era 有 `desc`（学生需要历史背景描述）
- [ ] `cities` 数组每个城市有中文名、拼音、描述（3项）
- [ ] 发布前跑 `bash scripts/check_map_resources.sh` 确认资产完整

---

## 五、常见错误速查

| 错误 | 原因 | 修复 |
|:---|:---|:---|
| 地图是白板 | 没加 hillshade.jpg | 复制 `skill/assets/hillshade/global-color-hillshade-2k.jpg` → `assets/maps/hillshade.jpg` |
| geojson 404 | 路径写错 | 用 `../../skill/assets/historical-china/<file>`，不是 `../skill/` |
| 没有底图地形 | hillshade 缺失 | 同上 |
| 地图错位 | 用错了世界史的中国文件 | 中国史用 `historical-china/`，世界史用 `historical-world/` |
| era 按钮点了没反应 | 没加 `defer` | `<script src="...historical-map.js" defer></script>` |
| 多课件缺同一文件 | 手动复制太累 | 用 `python3 scripts/apply-historical-maps.py` 批量处理 |

---

## 六、快速参考：朝代/时期 → 文件名

```javascript
// 中国历代
"秦":           "qin-dynasty.geojson"
"西汉":         "west-han-dynasty.geojson"
"东汉":         "east-han-dynasty.geojson"
"汉（合并）":   "han-dynasty.geojson"
"三国":         "three-kingdoms.geojson"
"西晋":         "jin-west-dynasty.geojson"
"东晋":         "jin-east-dynasty.geojson"
"南北朝":       "northern-southern.geojson"
"隋":           "sui-dynasty.geojson"
"唐":           "tang-dynasty.geojson"
"五代十国":     "five-dynasties.geojson"
"北宋":         "north-song-dynasty.geojson"
"南宋":         "south-song-dynasty.geojson"
"宋（合并）":   "song-dynasty.geojson"
"元":           "yuan-dynasty.geojson"
"明":           "ming-dynasty.geojson"
"清":           "qing-dynasty.geojson"

// 世界史常用
"前500 希腊城邦":   "bce-500.geojson"
"前323 亚历山大":   "bce-323-alexander.geojson"
"前200 罗马":      "bce-200.geojson"
"1300 蒙古帝国":   "ce-1300-mongol-peak.geojson"
"1492 大航海":     "ce-1492-age-of-discovery.geojson"
"1815 维也纳体系": "ce-1815-vienna.geojson"
"1914 一战前夜":   "ce-1914-wwi.geojson"
"当代":           "ce-2000.geojson"
```

完整清单见 `scripts/historical-maps-manifest.json`。
