# TeachAny 版本变更日志

**当前版本**：v7.7.5（持续演进中）
**更新日期**：2026-05-06

---

## 版本摘要

- **v1.0**：数理课件版
- **v2.0**：拆成通用底座+学科适配层
- **v3.0**：补 Bloom 完整表、课型分类、脚手架策略、Mayer 原则、五镜头选择指引、3 学科完整示例、视觉设计细则、Phase 4 审查清单
- **v4.0**：TTS 引擎切换为 Edge TTS；新增视频与音频制作流水线（Remotion 自动安装、Edge TTS 集成、双语字幕系统、语言配置）、Token 与成本估算
- **v5.0**：知识图谱集成、社区课件机制
- **v6.0**：简化发布流程（移除 Admin skill 依赖、内置质检、本地打包优先、去中心化分享、零权限要求）
- **v6.1**：Pillow 本地生图字体规范 + 基线检查增强
- **v7.1**：Hero 图补充机制 — 修复新知识点课件永远没有 Hero 图的架构缺陷
- **v7.2**：Hero 图批量修复 + 质检强化 — 全量 312 课件 hero 图覆盖率从 34% 提升至 100%
- **v7.4**：真实交互 + 连续音频基线（禁止图片伪装交互）
- **v7.5**：标准知识图谱模块（`scripts/teachany-knowledge-graph.{js,css}`）
- **v7.6**：知识图谱视觉对齐 tree.html、底部位置规范、社区上传自动注册管线修复
- **v7.7**：知识图谱稳定布局重构（去 force layout，确定性环形分层，零闪动）+ 三大标准模块上线：AI 学伴入口卡片、独立连续音频播放器、历史地图渲染器
- **v7.7.1**：UI 可达性修复 — KG tooltip 可点击链接（延迟关闭+锚定节点）、AI 学伴卡片上移至 pretest 后（不再藏在底部）、FAB 自动避开底部音频条
- **v7.7.2**：历史地图模块重写为 Leaflet 真地图引擎 — 自制 SVG 投影模块废弃，复用稳定标杆（`community/history-medieval-europe`），22 个历史/地理课件批量注入
- **v7.7.3**：历史地图模块默认加载彩色阴影地形底图（205KB 全球 4096×2048 彩色阴影），22 个课件已复制本地 `assets/maps/hillshade.jpg`，地图不再出现"暗蓝空地"
- **v7.7.4**：**标准五件套默认基线**（Web Speech TTS + 情境气泡 + AI 学伴 FAB/卡片 + 知识图谱），标杆课件 `community/history-medieval-europe` 的自建悬浮播放器与情境提示抽成零配置标准模块，344 个课件批量注入，修复 2 个 HTML 标签截断的老课件
- **v7.7.5**：**教学组件深度落地规范 + 知识图谱"学习足迹"下线**。针对近期知识动画/Hero 图/互动时间轴"文字+配音敷衍"、五镜头法/常见错误/诊断反馈"泛泛描述方法本身而不融入教学"问题，新增 SKILL Section 4.4 对 6 类组件做字段级锚定 + 硬规则 #65 禁止敷衍组件；删除 KG 底部"学习足迹"小模块（教学价值低且干扰主视觉）

---

## 🆕 v7.7.5 — 教学组件深度落地 + 知识图谱"学习足迹"下线（2026-05-06）

**背景**：用户对近期批量生成的课件提出方法论批评：
1. "知识动画、置顶图片、互动时间轴都很敷衍，都是简单的文字加配音，没有结构化元素的动态，无助于学习"
2. "五镜头法等方法、常见错误与诊断反馈经常是泛泛描述方法本身，而没有融入教学过程"
3. "学习足迹：点击图谱节点会在这里累积记录你探索过的知识点，这个模块很奇怪，不要了"

问题根因：v7.7.4 把"标准五件套"拉齐了**形式**（模块都挂上了），但每个组件内部的**教学内容深度**并无硬性规范，导致 AI 生成时倾向于走最省力的路径——放一张装饰图、塞几段文字加配音、贴一张"方法介绍表"当教学内容。这与 TeachAny "深度学习 > 形式完整"的初心背离。

**对策**：

**1. 新增 SKILL_CN Section 4.4 "教学组件深度落地规范"** — 约 130 行字段级 checklist

| 小节 | 核心内容 |
|:---|:---|
| 4.4.1 | **三问判定原则**：① 这个动态的起源是什么（结构化元素/参数/数据）②想让学生追问什么（引出什么思考）③这个追问写在哪里（必须有承接卡片） |
| 4.4.2 | **知识动画 6 要素**：结构化元素（SVG/Canvas/DOM 图元，而非纯文字+配音）+ 参数驱动（滑杆/按钮/输入框）+ 双表征联动（代数式↔图像等）+ 交互可逆 + 教学追问卡（1-3 题）+ 回答验证 |
| 4.4.3 | **Hero 置顶图 5 要素**：中心概念明示 + 分支 ≥3 + 视觉层级 + 文字可读 + **信息绑定**（每元素锚定正文某 section） |
| 4.4.4 | **互动时间轴 6 要素**：可点击节点 ≥5 + **≥2 联动区**（详情+地图、详情+图表等）+ active 反馈 + 横向对比 + 结构化数据 + 教学追问卡 |
| 4.4.5 | **五镜头法落地**：⛔ 严禁粘贴方法介绍表格 → 必须化为 3-5 张独立卡片（看见/拆开/解释/比较/迁移），每镜头给具体载体 |
| 4.4.6 | **常见错误+诊断反馈**：每道关键题配 `_errors.json` 5 字段（trigger/diagnosis/scaffold/retry_hint/next），给出等腰三角形底角题完整 JSON 示例 |
| 4.4.7 | **Completeness Gate 5 项深度检查**：6 要素齐全 / Hero 信息绑定 ≥3 / 时间轴联动 ≥2 / 五镜头具体化 / 关键题全覆盖错误诊断 |

**2. 硬规则 #65 上线**：把"禁止敷衍组件"作为 Gate 直接不通过项。⛔ 知识动画无结构化图元变化 / Hero 图纯装饰无信息绑定 / 时间轴静态列表 / 贴五镜头介绍表当教学 / 错误反馈无诊断 → 全部 Gate 拦截。

**3. 知识图谱"学习足迹"模块下线**（v7.7.5 清理）：

| 变更文件 | 删除内容 |
|:---|:---|
| `scripts/teachany-knowledge-graph.js` | `probeWrap` 容器构造（L598-605）+ `drawProbe()` 函数（~47 行）+ `focusNode()` 中的 `drawProbe()` 调用 + 注释同步 |
| `scripts/teachany-knowledge-graph.css` | `.tkg-probe`、`.tkg-probe-title`、`.tkg-probe canvas` 三块 CSS（~17 行） |

下线理由：访问足迹是"行为装饰"而非"学习反馈"，学生点几个节点后看到累积图表对后续学习没有形成反馈；且该模块占据图谱底部大块空间，干扰主视觉和 tooltip 交互。保留 `visited: Set` 不破坏其他逻辑，仅移除 UI 呈现。

**4. 待补工具**（v7.7.5 下一个 patch 交付）：

| 工具 | 用途 |
|:---|:---|
| `scripts/audit-shallow-components.py` | 扫描所有课件，发现"敷衍组件"（文字动画无图元、Hero 图无绑定、时间轴无联动）并输出修复建议 |
| `scripts/gen-error-diagnosis.py` | 用 LLM 对每道关键题生成 5 字段 `_errors.json` |

**浏览器实测**（v7.7.5 学习足迹下线后，`community/history-medieval-europe`）：
- `probe container count: 0` ✅
- `"学习足迹" 文本: false` ✅
- KG 主画面正常渲染 + tooltip 交互不受影响 ✅

**影响**：

- SKILL_CN 从 v7.7.4 的 0.0 Baseline ⑪⑫⑬ 侧重"形式基线"扩展到 Section 4.4 的"内容深度基线"，形成**形式+深度双层规范**
- 所有后续新建课件的 Gate 审核将强制按 Section 4.4 逐字段检查
- 下一批存量课件升级会先跑 `audit-shallow-components.py` 定位问题再批量修

---


## 🆕 v7.7.4 — 标准五件套默认基线（2026-05-06）

**背景**：`community/history-medieval-europe` 在 v7.7.3 完善后表现最佳，其中 3 个自建组件（底部悬浮 AI 学伴 FAB + hints 面板、右下角 Web Speech TTS 控制器、滚动情境感知气泡）被用户评价为"所有课件都应该默认有"。但这些组件原本只在该课件内以内联 CSS/JS 存在，其他 343 个课件既没有悬浮播放器、也没有情境气泡，知识图谱也只有部分课件挂了。本版本把这套"五件套"抽成零配置标准模块，批量注入全部课件。

**对策**：

**1. 三个新标准模块上线**

| 模块 | 文件 | 功能 |
|:---|:---|:---|
| **Web Speech TTS 悬浮播放器** | `scripts/teachany-tts-narrator.{js,css}` | 自动收集 `[data-tts]` 段落 → 构建右下角 ⏮▶️⏭ 控制条 + 语速切换（0.85×/1.0×/1.15×/1.3×）。零 mp3 零配置：浏览器原生 `SpeechSynthesisUtterance`。可选同级 `./narration.json` 覆盖高质量文稿。无 `[data-tts]` 时零占位不插 UI。 |
| **情境感知气泡** | `scripts/teachany-section-hints.{js,css}` | IntersectionObserver 监听 section 可见度 → 最可见 section 的提示文案自动弹出左下角气泡（挨着 ai-tutor FAB）。数据源：元素 `data-tsh="文案"` 或同级 `./section-hints.json` 的 `{sectionId: 文案}`。点击气泡 = 点 FAB 打开 AI 学伴。 |
| **（复用）AI 学伴入口卡片** | `scripts/teachany-tutor-card.{js,css}` | v7.7 已上线，v7.7.4 纳入五件套标准 |

**2. 标杆课件 `community/history-medieval-europe` 重构**

- 删除原内联 `#tts-controller` + `#ai-assistant` 组件（CSS + HTML + JS 共 ~400 行）
- 改用 3 个标准模块调用，配合已有 `ai-tutor.js` + `teachany-knowledge-graph.js` = 五件套齐全
- 新增 `section-hints.json` 沉淀原 sectionHints 对象

**3. 批量注入脚本 `scripts/apply-standard-modules.py`**

- 幂等扫描 `examples/*/index.html` + `community/*/index.html`
- `ensure_head_links()` 在 `</head>` 前注入缺失的 5 个 `<link>`
- `ensure_tail_scripts()` 在 `</body>` 前注入缺失的 5 个 `<script>`（`ai-tutor.js` 外 4 个 `defer`）
  - **fallback**：源 HTML 无 `</body>` 时直接追加到文件末尾
- `ensure_tutor_card_section()` 保证 `<div data-teachany-tutor-card>` 存在
- `ensure_kg_section()` 按 node_id 检测/替换/新增 `<section id="knowledge-graph">`
- **node_id 解析双源**：优先读 `manifest.json` 的 `node_id`，fallback 到 `courseware-registry.json` 的 `courses[].id → node_id` 索引（消除 47 个老课件无 manifest 的 skip）

**4. 修复 2 个 HTML 标签截断的老课件**

批量扫描 `grep -c "</body>"` 发现 2 个课件源 HTML 存在正文 SVG/input 标签未闭合导致后续内容被浏览器解析器吞掉：

| 课件 | 截断位置 | 影响 |
|:---|:---|:---|
| `community/math-m-isosceles-triangle/index.html` | 第 398 行 `<line ... stroke-width="1.8`（缺 `"/>`） | SVG 吞掉所有后续 HTML，ai-tutor.js 不执行，FAB 不出现 |
| `community/math-m-statistics-probability-junior/index.html` | 第 347 行 `<input ... value="55,..,93"`（缺 `>`) | input 吞掉所有后续内容 |

两个课件已补全 SVG/input 标签 + 追加 `</body></html>`，浏览器实测五件套全部挂载：`window.TeachAnyTutor/TTSNarrator/SectionHints` = object，`.ai-tutor-fab` = 1，KG SVG = 1。

**5. 硬规则升级**

新增 RULES.md 第 64 条：**标准五件套默认基线**——所有课件必须同时挂载 5 个标准模块（ai-tutor + tutor-card + tts-narrator + section-hints + knowledge-graph），禁止课件内再手写内联 TTS / IntersectionObserver hints 组件；浏览器实测必须全局对象全绿。

**交付数据**：

- 批量注入覆盖：344 个课件（examples/ + community/）
- head links 新增：每课件 ≤5 个 `<link>`（已存在则跳过）
- tail scripts 新增：每课件 ≤5 个 `<script>`
- KG section node_id 解析：manifest 直读 + registry fallback，`skipped-no-node-id` 从 47 → 0
- 标杆课件实测：FAB 1 个、TTS host 4 按钮齐、KG SVG 1 个、section-hint 气泡滚动触发"对比中国的郡县制——为什么中国能大一统而欧洲四分五裂？"显示在 (88,714)

---

## 🆕 v7.7.3 — 彩色阴影地形底图默认加载（2026-05-06）

**背景**：v7.7.2 重写为 Leaflet 后，22 个历史课件地图虽然疆域与城市已对齐，但地图底色仍是纯深蓝（`#0c1526`），缺少地形参考，与 `community/history-medieval-europe` 的彩色阴影效果有显著差距。

**对策**：

**1. 模块默认加载本地 `assets/maps/hillshade.jpg`**
- `scripts/teachany-historical-map.js`：Leaflet 初始化后立即探测本地 `./assets/maps/hillshade.jpg`，加载成功则以 `L.imageOverlay([[-90,-180],[90,180]], {opacity:0.55, interactive:false, zIndex:200})` 叠加覆盖全球；404 静默回退
- 支持显式关闭：`<script data-teachany-map-config>{"hillshade":false}</script>`
- 支持自定义路径：`{"hillshade":"./assets/maps/custom-terrain.jpg"}`

**2. 批量注入脚本自动复制底图**
- `scripts/apply-historical-maps.py`：新增 `HILLSHADE_SRC = skill/assets/hillshade/global-color-hillshade-2k.jpg` + `copy_hillshade(course_dir)` 函数
- 每次注入地图模块时，自动把 205KB 的 2K 彩色阴影底图复制到 `<course>/assets/maps/hillshade.jpg`
- 已对 22 个历史/地理课件批量执行完成

**3. 浏览器实测验证**（`examples/imperial-unification/index.html`）
```
hillshade_overlays: 1
src: "maps/hillshade.jpg"
opacity: 0.55
natural_size: 4096×2048
visible: true
geojson_paths: 17 (秦朝) → 78 (西汉切换后)
```

**4. 规范强化**
- `skill/RULES.md` Rule #62 新增第 (d) 条：必须把 `skill/assets/hillshade/global-color-hillshade-2k.jpg` 复制为课件本地 `assets/maps/hillshade.jpg`
- `skill/SKILL_CN.md` Baseline ⑩：更新历史地图模块集成步骤，明确 hillshade 为必需资源

---



## 详细变更记录

### v7.7.2
⭐ 历史地图模块重写为 Leaflet 真地图引擎（v7.7 的自制 SVG 方案废弃）

**根因分析**：v7.7 写的 `teachany-historical-map.js` 是自制 SVG 投影渲染器——城市坐标和疆域 geojson 走两套投影，**会出现城市点漂在错误位置**；而且 22 个历史/地理课件实际**没有一个真正用上**该模块（`grep data-teachany-map` 计数 0）。

**对策**：参考 `community/history-medieval-europe` 这个真稳定的实现（已部署在 https://weponusa.github.io/teachany/），把模块完全重写：

**1. Leaflet 真地图引擎**
- `<head>` 引入 Leaflet 1.9.4 CDN（leaflet.css + leaflet.js）
- `EPSG:4326` 经纬度坐标系，城市 `circleMarker` 和 geojson `geoJSON` 用同一套投影 → 严丝合缝
- 暗色主题：`background: #0c1526`，覆盖 `.leaflet-popup-content-wrapper` / `.leaflet-control-zoom` / `.leaflet-control-attribution`

**2. 多朝代切换 UI（参考 history-medieval-europe）**
- `.thm-era-btns` 朝代按钮组，`.active` 高亮当前
- `.thm-era-desc` 时代说明面板，`<span class="thm-year-tag">前221</span><strong>...</strong>` 标准化
- `.thm-legend` 图例：红点=城市 / 蓝线=边界 / 提示文字
- 切换时自动 `removeLayer` 旧 era、加载新 geojson、重置 cities

**3. 标准化数据架构**
- 新增 `scripts/historical-maps-manifest.json` 集中维护 23 个课件的地图配置
- 每个 era 含：`id` / `label` / `file` / `fill` / `stroke` / `desc` / `cities[[lat,lng,zh,en,note]]`
- 自动 fallback：china scope 找不到的 geojson 会去 world 目录找（如 `ce-1945-wwii.geojson`）

**4. 自包含部署**
- 不再依赖跨目录 fetch `../../skill/assets/...`（GitHub Pages 部署后会 404）
- 批量脚本把所需 geojson 复制到课件本地 `assets/maps/<file>.geojson`

**5. 一键批量应用**
- 新增 `scripts/apply-historical-maps.py`：
  - 读 manifest → 复制 geojson → 注入 Leaflet CDN + 模块 CSS/JS → 在 `module-1` / `intro` / `objectives` / `pretest` 之后插入 `<section data-teachany-map>` 块
  - 幂等：检测已注入则跳过
- 实测注入成果：22 个课件 applied（1 skipped，因 history-medieval-europe 已自有同质量实现，不覆盖）
- 复制 geojson 累计：约 50 个文件（每课件 1-4 个 era）

**6. RULES #62 升级**
- 强制：(a) Leaflet CDN 必须引入；(b) geojson 必须复制到课件本地；(c) ≥2 个 era；(d) 每个 era 必须有 desc
- 列出全部 14 个 china dynasty + 21 个 world period 的可用 geojson

**7. SKILL_CN 基线 ⑩ 升级**
- 从"GeoJSON 渲染器"升级为"Leaflet 真地图引擎"
- 完整 HTML 引入指南 + manifest 配置示例

**实测结果**
- math-linear-function 课件触发批量改造：22 changed
- 标杆课件 history-medieval-europe 保持原貌（已是同等质量）
- 所有课件的 city 标记现在和疆域 geojson 用同一套 EPSG:4326 投影，**坐标严丝合缝**

---

### v7.7.1
⭐ UI 可达性修复（v7.7 的模块"存在但够不到"问题）

**1. KG Tooltip 三步交互（hover → 滑入 tooltip → 点击链接）**
- 鼠标离开节点后**延迟 400ms 才隐藏 tooltip**；鼠标在此期间移入 tooltip → `showTooltip()` 清除计时器，tooltip 保持可见
- Tooltip 鼠标离开时立即 `scheduleHide()`
- Tooltip 不再紧跟鼠标位置，改为**锚定到节点本身**（`positionTooltipAtNode()`）：右侧 → 左侧 → 下方三级兜底，保证鼠标能稳定滑过去
- CSS：`transition: opacity 0.12s`（缩短过渡，避免淡出期间无法点击），visible 时 `pointer-events: auto`
- 实测硬证据：hover `✅ 已有课件`节点 → tooltip 在节点左侧显示 `🚀 打开课件：正比例函数` 可点按钮（320×247），tooltip.mouseenter 清除计时器保持可见

**2. AI 学伴入口卡片迁移到课件顶部**
- 新增 `scripts/relocate-tutor-card.py`：自动把 `#teachany-ai-tutor-card` 从底部迁到 `pretest` 之后（次选 `objectives` / `hero`）
- 实测：math-linear-function 从文档 13426px → 2686px，向上挪 10740px
- 批量应用：217 个课件迁移成功（3 无卡片 / 123 结构不标准 / 0 已在顶部）

**3. FAB 避开底部音频条**
- `ai-tutor.css` 追加：`body.tap-bar-on .ai-tutor-fab, body.audio-playing .ai-tutor-fab { bottom: 100px; transition: bottom 0.25s ease; }`
- 实测：`tap-bar-on` 激活时 FAB computed `bottom: 100px` ≠ 默认 24px

**4. 新增硬规则 #63（UI 可达性基线）**
- (a) 学伴卡片必须在 pretest 之后（不得藏底部）
- (b) FAB 必须自动避开音频条
- (c) tooltip 必须支持"悬停—滑入—点击链接"三步
- 发布前必须浏览器实测上述三条可达性

---

### v7.7
⭐ 知识图谱稳定化 + 三大标准模块上线（AI 学伴卡片 / 独立音频 / 历史地图）

**1. 知识图谱模块（`teachany-knowledge-graph.{js,css}` v2.2）**
- 彻底废弃 240 轮力导向布局，改用**确定性环形分层布局**：self 居中 / prereq 在左半圆 / next 在右半圆 / sibling 在上弧 / extend 在下弧。一次算完，零迭代，**根除"先乱后稳"的视觉跳动**。
- 增量更新：聚焦同一邻居集合中的另一个节点时只改高亮和 layer 样式，不再 `removeChild` 整棵 SVG。
- 节点填充不透明度从 0.05/0.22/0.35 提升到 0.15/0.40/0.55，文字 `paint-order: stroke fill` + `stroke: rgba(15,23,42,0.85)` 描边，深色背景下也清晰可读。
- 移除导致"蓝底黑字"的 `@media (prefers-color-scheme: light)` 覆盖；tooltip / panel / 链接卡片中的颜色全部硬编码为浅色，避免被宿主 CSS 变量污染。

**2. 标准 AI 学伴入口卡片（新增 `teachany-tutor-card.{js,css}`）**
- 课件不能仅依赖左下角 FAB（学生在长页面下经常看不到），必须在课件正文显式嵌入 `<div data-teachany-tutor-card></div>`。
- 卡片包含标题、简介、4 个建议提问按钮，点击任一处都会唤起 ai-tutor.js 的对话面板。
- 新增硬规则 #60：仅 FAB 无卡片 / 卡片硬编码 Key / 修改模块源码 → Gate 直接不通过。

**3. 标准独立连续音频模块（新增 `teachany-audio-player.{js,css}`）**
- 取代每个课件重复粘贴 80+ 行内联 audio-bar 代码，统一为：曲目卡片（列表 + 当前高亮 + 单曲点击播放）+ 全局底部连续播放条（▶/⏸/⏮/⏭/进度/速度）。
- 滚动同步切轨（IntersectionObserver `threshold:0.5`）、`ended` 事件自动连播下一首、速度按钮在 1x/1.25x/1.5x/2x 循环。
- playlist 通过 `<script type="application/json" data-teachany-audio-playlist>...</script>` 声明，零侵入。
- 新增硬规则 #61：≥2 段音频未用模块 / 内联 audio-bar 复制 / 自动连播失效 / 拼音英语课段数<3 → Gate 直接不通过。

**4. 标准历史地图模块（新增 `teachany-historical-map.{js,css}`）**
- 历史/地理课件再也不允许用纯手画 SVG 方框拼接。统一调用模块加载 `skill/assets/historical-china/<dynasty>.geojson` 或 `historical-world/<period>.geojson`（已有 40 个规范文件覆盖秦至清 + 全球公元前 3000~ce 1945 重大节点）。
- 自动按 `feature.properties.LEVEL=country/prefecture` 分层渲染、绘制都城/战役/路线标注、提供图层开关、悬停显示政权名/政区名。
- 标注通过 `<script type="application/json" data-teachany-map-config>{"annotations":[...]}</script>` 声明，支持 type=city/battle/route，role=capital。
- 新增硬规则 #62：用纯 SVG 示意图 / 朝代 ID 不存在 / 历史课件无地图 / 修改模块源码 → Gate 直接不通过。

**5. SKILL_CN 基线表升级**
- 基线清单从 ⑦ 扩展到 ⑩：⑧ AI 学伴入口卡片、⑨ 独立连续音频模块、⑩ 历史地图模块。
- 每条基线明确强制要求、实现方式、降级底线。

**6. 社区课件上传自动注册链路修复**
- `rebuild-index.py` 自动串联 `register-community-uploads.py` → `sync-community-index.py` → `build-teachany-kg-manifest.py`，一次命令同时更新 `registry.json`、`community/index.json`、`data/trees/**/*.json` 和 `scripts/teachany-kg-manifest.json`。
- `register-community-uploads.py` 自动归一化 `subject:"历史"`→`history`、`grade:"初二"`→`8`、补 `node_id`。
- `build-teachany-kg-manifest.py` 改为读取 `registry.json`，且只保留实际存在 `index.html` 的课件路径，避免标准图谱误判虚挂节点为"已有课件"。

### v7.6
⭐ 标准知识图谱模块 · 视觉/布局对齐知识地图
- 模块整体样式完全对齐 `tree.html`：深色底、域色渐变节点、实线/虚线边、悬停放大 + drop-shadow、tooltip 浮窗。
- 节点根据真实课件存在性区分：有课件实心 + 点击可直接打开课件；无课件虚线框、不可点。
- manifest 构建时对 `courses[].path` 做真实性校验，只保留 `examples/` 或 `community/` 下实际有 `index.html` 的课件。
- 所有官方课件的图谱模块统一放到**最底部**（footer 之前），作为收尾。

### v7.5
⭐ 标准知识图谱模块
- 新增 `scripts/teachany-knowledge-graph.{js,css}` + `scripts/teachany-kg-manifest.json`（由 `scripts/build-teachany-kg-manifest.py` 从 `data/trees` + `data/knowledge-points` 生成），提供稳定、可搜索、可筛选、可跳转的标准图谱模块。
- 课件接入只需：`<div data-teachany-kg="node_id"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>` + 引入模块 `css/js`。
- 新增硬规则 #59：禁止再手写图谱，主题样式只能通过 CSS 变量继承。
- 17 个官方课件 `#knowledge-graph` 已批量切到标准模块，发布校验 0 错误。

### v7.4
⭐ 真实交互与连续音频基线
- 新增硬规则 #58：禁止用静态图片、SVG 截图或 data:image 信息图伪装“互动/探究/实验/地图”模块。
- 语音、拼音、英语、朗读类课件必须提供独立连续音频播放器，`audioPlaylist` 需覆盖导学与关键发音/段落，不能只靠单个“点我听”或视频音轨。
- 发布前必须浏览器实测至少一个交互控件和连续音频播放，Console 0 error 后才能声称完成。

### v7.2
⭐ Hero 图批量修复 + SKILL 规范强化
- **问题诊断**：对全量 312 个 community 课件进行质量审计，发现 207 个课件的 hero 区域缺少 `<img>` 标签引用 hero 图片（尽管 206 个已有图片文件在 `assets/` 中）
- **根因分析**：
  1. 批量课件生成流程未调用 hero 图注入脚本
  2. 课件模板中 hero 区域未自动插入 `<img>` 标签
  3. Hero 图文件存放位置不统一（`assets/hero/` vs `assets/` 根目录），导致检测逻辑不一致
- **修复执行**：
  - 编写 `batch_inject_hero_img.py` 批量注入脚本，为 206 个有图片但缺标签的课件注入 `<img class="hero-cover-img">` 标签
  - 从 `teachany-images/` 复制 2 个缺失的图片到对应课件 `assets/`
  - 为 1 个完全无图片的课件（`hist-h-song-yuan-ming-qing-h`）使用 `image_gen` 生成 hero 图
  - **最终结果：312/312 课件全部有 hero 图片覆盖**
- **SKILL 规范变更**：
  - CSS 模板新增 `.hero-cover-img` 样式定义（宽度 100%、最大高度 320px、object-fit cover）
  - Hero 图命名规则兼容 `assets/` 根目录放置（批量注入脚本和历史课件使用此模式）
  - HTML 引用铁律新增"方式 B"：hero 图可放在 hero 容器闭合标签之后，用 `<!-- hero-cover -->` 标记
  - Completeness Gate 第 30 项强化：同时检查 `hero-img` 和 `hero-cover-img` 两种 class
  - 质检清单新增"Hero 图"检查项

### v7.1
⭐ Hero 图空缺检测与维护者补充 SOP（修复架构缺陷）
- **问题**：课件生成阶段（Phase 3）严禁 image_gen 生成 Hero 图，查找链（知识点 JSON → image-registry 精确匹配）未命中则留空。但对于新增知识点（图库中无预制 hero 图），课件将**永远没有 Hero 图**，没有后续补充流程。
- **修复**：
  - Section 10.4.1 新增"维护者补充 Hero 图的 SOP"：区分课件生成阶段（禁止 image_gen）和维护者补充阶段（允许 image_gen + 审核注册）
  - Phase 3.6 发布四件套新增第⑤步"Hero 图空缺检测与补充"：发布时自动检测 hero 图是否存在，缺失时提示维护者执行补充 SOP
- **区分**：课件制作者（AI Skill）仍严禁 image_gen 生成 Hero 图；维护者（管理员）可以在发布阶段生成后审核注册

### v6.1
- **新增 Section 10.4.3**：Pillow 本地生图字体规范——定义字体选择铁律、禁用字体清单（Hiragino Sans GB / STHeiti 对 Unicode 上下标渲染为方框 ⊠）、跨平台字体降级链、HTML/Pillow/Remotion/PPTX 四场景字体对照表
- **新增硬规则 #51**：Pillow 生图字体基线——含化学/数学公式符号的本地生图必须使用 Arial Unicode MS 或 Noto Sans CJK，字体降级链全部失败必须报错终止
- **check_baseline.sh 新增 B-3a+**：PNG 图片文字完整性抽检——用 Pillow 检测 assets/ 下图片是否存在 .notdef 方框特征
- **背景**：铝课件（chem-h-aluminum-compounds）使用 Hiragino Sans GB 字体生成配图，所有化学下标（₂₃⁺⁻）显示为方框 ⊠

### v6.0
- **移除 Admin skill 依赖**：不再需要管理员权限和外部脚本
- **内置质检功能**：AI 直接检查 meta 标签、ABT 叙事、互动元素等核心项
- **本地打包优先**：生成 .teachany 文件保存到本地，用户拖入 Gallery 即可使用
- **去中心化分享**：支持 GitHub PR、邮件提交、网盘分享等多种社区贡献方式
- **零权限要求**：普通用户无需 GITHUB_TOKEN 即可制作和使用课件

### v5.34.9.2
封堵"直推 examples/ 绕过质检"漏洞 · validator 严格化 · pre-push hook 双重护栏

### v5.34.9
⭐ 社区自动提交 · 零配置 + 质检自动合并 · Cloudflare Worker 中转

### v5.34.8
⭐ 发布权分离 · 双轨制：本地 drafts + 自动社区 PR · 新增硬规则 #48

### v5.34.7
⭐ L3/L4/PPTX 强制机器校验 · 新增硬规则 #47 PPTX 含图基线

### v5.34.6
⭐ 注入课标基本要求 · 新增小学科学 · SKILL 课标速查表

### v5.34
⭐ 新增 PPTX 导出层 L5 + 所有课件强制内置右下角 AI 学伴悬浮球

### v5.31
11 棵国际课标树全部构建完成 · IB DP × 4 + A-Level × 3 + AP × 4

### v5.30
多课标体系支持 · 国际学校可用（IB/A-Level/AP）

### v5.29
清理废弃 admin skill + 删除重复课件 + 新增硬规则 #44 节点挂载基线（v5.29.1 修订：community 允许多份）

### v5.28
统一课件 title 规范 + 强制 teachany_version + Gallery 版本徽章

### v5.27
修复课件学段错挂——建立 manifest vs node_id 前缀强制校验 + 新增硬规则 #42

### v5.25
⭐⭐⭐ 全部 20 棵知识树按新课标系统性重构——从"骨架"升级到"课标级结构"

### v5.24
⭐⭐ 根治知识树系统性污染——新增清污脚本 + 硬规则 #41

### v5.23
修复选择题致命 bug——`handleQuiz` onclick 第 4 参 `selectedVal` 被硬编码为固定值

### v5.22
⭐⭐ 根治地图对不齐——弃用 `L.imageOverlay` 全球底图，改用 XYZ 瓦片

### v5.21
⭐ 再次纠正——GitHub Pages 不部署 `data/geography/` 下的大型二进制

### v5.20
⭐ 纠正 v5.19 错误结论——`tree.html` 只读 `data/trees/*.json`，不读 `_graph.json`

### v5.19
⭐ 发布成功率保障（rebuild-index 三件套必跑 + node_id 必须真实校验 + 双推降级策略）

### v5.18
⭐ 地图底图必须与缩放同步 + 初始视图必须聚焦教学核心区域

### v5.17
⭐ Remotion mp4 必须三轨合一（画面 + 音效/配乐 + 语音）+ 视频必须配专属 poster 封面

### v5.16
⭐ Remotion 基线从"可降级"升级为"真强制"

### v5.15
⭐ K12 教材版本注册表 + 中国教材内容自动注入

### v5.14
⭐ Skill 运行时强制检测 Git 最新版本并按需更新

### v5.13
⭐ 时空资产完整目录纳入 Skill 知识库

### v5.12
⭐ 强制使用开源数据源，禁止手工标注 + 基线能力强制化

### v5.11
历史/地理课件DEM地形+态势动画强制规范

### v5.10
音频滚动自动播放 + 视频优先交互演示 + 默认仅中文

### v5.9
知识图谱可视化 + 视频/音频播放器强制规范 + Remotion 中文字体修复

### v5.8
WorkBuddy 多 Agent 协作 + 版式一致性 + AI 主动生图/生视频

### v5.7
全面升级"按需调用"为"默认执行"，保证课件基本质量

### v5.6
L3 语音讲解从"显式触发"升级为"默认必选"

### v5.5
融入项目驱动教学方法论

### v5.4
新增课件打包与分发（Section 17）

### v5.3
新增例题配图硬性规范（Section 13）

---

> 💡 完整的每个版本详细变更说明（含代码差异、根因分析、修复动作描述），请参阅 `SKILL_CN.md` 中对应版本号的历史记录。
