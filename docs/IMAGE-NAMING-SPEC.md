# TeachAny 图片资产命名规范 v1.0

> 本文档是课件图片资产命名的唯一权威标准。所有新建课件、Skill 模板、脚本工具均须遵守。

## 一、目录结构

所有图片统一存放在 `assets/` 目录下（禁止使用 `images/` 等其他命名）：

```
<course-dir>/
├── index.html
├── manifest.json
└── assets/
    ├── <abbrev>-hero.png      # 必需：封面/知识结构信息图
    ├── <abbrev>-scene.png     # 推荐：核心概念可视化
    └── <abbrev>-ext.png       # 可选：拓展/补充插图
```

## 二、文件命名规则

### 2.1 命名模式

```
<abbreviation>-<type>.<ext>
```

| 组成部分 | 说明 | 示例 |
|:---|:---|:---|
| `<abbreviation>` | 课件的简称，来自课件 ID 的核心词 | `linear`, `quadratic`, `monsoon`, `pressure` |
| `<type>` | 图片类型标记 | `hero`, `scene`, `ext` |
| `<ext>` | 文件扩展名 | `png`（首选）, `jpg`, `webp` |

### 2.2 三种标准图片类型

| 类型 | 命名 | 用途 | 必要性 |
|:---|:---|:---|:---|
| **Hero 图** | `<abbrev>-hero.png` | 封面图 / 知识结构信息图（用于 PPTX 导出封面、Gallery 缩略图） | ✅ 必需 |
| **Scene 图** | `<abbrev>-scene.png` | 核心概念可视化 / 情境图 | 📌 推荐 |
| **Extension 图** | `<abbrev>-ext.png` | 拓展、总结、应用场景插图 | 可选 |

### 2.3 额外图片命名

如课件需要超过 3 张图片，使用描述性名称：

```
<abbrev>-<description>.png
```

示例：`industrial-revolution-timeline.png`, `pressure-experiment.png`

## 三、缩写（abbreviation）生成规则

| 规则 | 示例 |
|:---|:---|
| 取课件 ID 中最核心的 1-2 个英文词 | `math-linear-function` → `linear` |
| 多词用连字符连接 | `history-industrial-revolution` → `industrial-revolution` |
| 保持简洁，通常 ≤ 3 个词 | `chem-oxidation-reduction` → `redox` |
| 中文课件也用英文缩写 | `course-classical-poetry` → `classical-poetry` |
| IB 课程保留 IB 前缀区分 | `chem-ib-dp-periodic-table` → `ib-periodic` |

## 四、manifest.json 字段规范

### 4.1 必需字段

manifest.json 必须使用以下标准字段（**禁止**使用 `title` / `title_zh` / `course_id` 替代）：

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `id` | 课件唯一标识符 | `"math-linear-function"` |
| `name` | 中文标题（Gallery 显示用） | `"一次函数 y=kx+b"` |
| `name_en` | 英文标题 | `"Linear Functions y=kx+b"` |

### 4.2 旧字段迁移对照

| 旧字段（禁止使用） | 标准字段 |
|:---|:---|
| `course_id` | → `id` |
| `title` | → `name`（中文）或 `name_en`（英文） |
| `title_zh` | → `name` |

## 五、registry.json 图片字段

`rebuild-index.py` 会自动检测 `assets/` 中的图片并生成以下字段：

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `hero_image` | 封面图相对路径 | `"assets/linear-hero.png"` |
| `scene_image` | 概念图相对路径 | `"assets/linear-scene.png"` |

若未检测到符合规范的图片，字段为空字符串 `""`。

## 六、检测优先级（脚本通用）

所有脚本（`export-pptx.py`, `rebuild-index.py`, `check_images.sh`）使用统一检测逻辑：

```
1. 优先：*-hero.{png,jpg,webp}     → 后缀匹配（主流模式）
2. 次选：hero-*.{png,jpg,webp}     → 前缀匹配（兼容旧命名）
3. 降级：hero.{png,jpg,webp}       → 纯名称匹配
4. 兜底：assets/ 下按字母序第一张图
```

## 七、现有课件图片对照表

| 课件目录 | Hero 文件 | 符合规范 |
|:---|:---|:---|
| `math-linear-function` | `linear-hero.png` | ✅ |
| `math-quadratic-function` | `quadratic-hero.png` | ✅ |
| `bio-photosynthesis` | `photosynthesis-hero.png` | ✅ |
| `chem-periodic-table` | `periodic-hero.png` | ✅ |
| `chem-oxidation-reduction` | `redox-hero.png` | ✅ |
| `geo-monsoon` | `monsoon-hero.png` | ✅ |
| `imperial-unification` | `qinhan-hero.png` | ✅ |
| `history-sanguo-sui-tang` | `sanguo-sui-tang-hero.png` | ✅ |
| `history-industrial-revolution` | `industrial-revolution-hero.png` | ✅ |
| `teachany-phy-mid-pressure` | `pressure-hero.png` | ✅ |
| `sci-motion-speed` | `motion-speed-hero.png` | ✅ |
| `chn-compound-vowel` | `compound-vowel-hero.png` | ✅ |
| `course-classical-poetry` | `hero-denglouque.png` | ❌ → 重命名为 `classical-poetry-hero.png` |
| `chn-pingze-grade1` | `images/hero.png` | ❌ → 移至 `assets/pingze-hero.png` |
| `history-ww2` | `hero-scene.png` | ❌ → 重命名为 `ww2-hero.png` |

---

*创建日期：2026-04-27 · 版本：v1.0*
