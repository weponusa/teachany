---
name: TeachAny
description: "K12各学科互动教学课件开发技能。当用户需要制作教学课件、互动课件、教学动画，或提到 K12、课件、教学设计、知识点讲解时触发。适用于数学、物理、化学、生物、地理、历史、语文、英语、信息技术等学科，融合认知负荷理论、ABT叙事结构、Bloom认知分类、同伴教学法等方法论。"
---

# TeachAny（教我学）：K12 各学科互动教学课件开发技能

面向 K12 各学科的互动课件开发技能。目标不是"把知识堆进页面"，而是把一节课设计成**有动机、有节奏、有互动、有评估闭环**的学习体验。

本技能适用于：
- 数学、物理、化学、生物、地理、历史、语文、英语、信息技术等学科
- 静态网页课件、互动网页、课堂演示页、教学动画、微课视频、课后练习页
- 从"一个知识点"到"一节完整课"的教学设计与实现

**默认原则**：先保证学习闭环，再考虑炫技效果；先保证学生学得会，再追求页面好看。

## P0 标准化调用规则：先复制模板，再填内容

每个新课件必须先复制 `templates/course-skeleton.html` 和 `templates/manifest-template.json`，再替换占位符。凡是模板已经提供标准调用的部分，一律不得让模型重新手写：

- 五件套：`ai-tutor`、`teachany-tutor-card`、`teachany-tts-narrator`、`teachany-section-hints`、`teachany-knowledge-graph`
- 标准音频播放列表：`<div data-teachany-audio>` + `data-teachany-audio-playlist`
- 知识图谱：`<div data-teachany-kg="<node_id>">`
- AI 学伴卡片：`<div data-teachany-tutor-card></div>`
- 顶部品牌栏双版本：`course-version` + `teachany-version`
- 问题锚点模块与手机 safe-area 基线

模型只负责教学内容填充、学科交互设计和资源生产；平台接线归模板负责。

---

## 📖 文档路由（渐进披露）

> 本文件是 TeachAny 的**必读骨架**，每次生成课件时必读。
> 以下卫星文档按 Phase 或场景触发加载，**无需一次性全部读入**，避免上下文爆炸。

### 必读骨架（本文件已包含）

零、基线能力清单 · 一、何时使用 · 二、通用教学设计底座 · 三、课型分类 · 四、学科适配 · 十三、硬规则总览 · 十四、理论基础 · 十八、地图入口

### Phase 流程延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`phases/workflow.md`](./phases/workflow.md) | 完整 Phase 0→4 执行细节 + Gate 检查点，含 Phase 1 标准问卷与 Phase 2 Validation | Phase 执行过程中逐步查阅 |
| [`references/phase1-checklist.md`](./references/phase1-checklist.md) | Phase 1 五问强制问卷 + 输出合同 | Phase 1 搭骨架时必读 |
| [`templates/content-section-templates.html`](./templates/content-section-templates.html) | `{{CONTENT_SECTIONS}}` 标准 HTML 片段库 | Phase 3 填充主体内容时必用 |
| [`phases/deliverables.md`](./phases/deliverables.md) | L2/L3 触发条件与产物要求 | L2/L3 交付决策点 |
| [`phases/video-audio.md`](./phases/video-audio.md) | Remotion/TTS/ffmpeg 流水线 | 做视频/语音基线时 |
| [`phases/packaging.md`](./phases/packaging.md) | 课件打包 + registry + 发布 · **§17.4 基础设施任务推送铁律**（v7.9.5 新增）| L4 打包或发布时 · 改 skill/脚本/数据完成后 |
| [`phases/token-cost.md`](./phases/token-cost.md) | 消耗估算与成本控制 | 规划长课件时 |

### 教学设计延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`guides/project-based.md`](./guides/project-based.md) | 项目制与任务驱动设计 | 做 PBL / 任务驱动课 |
| [`guides/interaction-patterns.md`](./guides/interaction-patterns.md) | 互动形态库与场景匹配 | Phase 3 选择交互形态 |
| [`guides/assessment.md`](./guides/assessment.md) | 评估系统与三级练习 | 设计练习/评估时 |
| [`guides/prerequisites.md`](./guides/prerequisites.md) | 前置知识链与学段差异 | Phase 0.5 知识查询 |
| [`guides/examples.md`](./guides/examples.md) | 三个学科完整微型示例 | 需要参考完整范例 |

### 技术实现延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`tech/stack.md`](./tech/stack.md) | 推荐技术组合 | Phase 0.5 技术选型 |
| [`tech/page-structure.md`](./tech/page-structure.md) | 互动网页标准结构（最详细） | 编写 HTML 主体时 |
| [`tech/design-system.md`](./tech/design-system.md) | 视觉设计规范（按学段分级） | 写 CSS 样式时 |
| [`tech/ai-multimodal.md`](./tech/ai-multimodal.md) | AI 多模态互动区（可选功能） | 做多模态互动 |
| [`tech/workbuddy-agents.md`](./tech/workbuddy-agents.md) | WorkBuddy 多 Agent 协作流水线 | 启用多 Agent 并行 |
| [`tech/science-simulations.md`](./tech/science-simulations.md) | PhET / Matter.js / 3Dmol.js 实验模拟 | 物理/化学/生物需交互实验 |
| [`tech/math-animations.md`](./tech/math-animations.md) | GeoGebra / Desmos / p5.js / Manim 数学可视化 | 数学需函数图像/几何动画 |
| [`tech/advanced-animations.md`](./tech/advanced-animations.md) | GSAP / Lottie / Konva 高级前端动画 | 需滚动动画/矢量动画/复杂拖拽 |

### 其他卫星文档（已存在）

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`RULES.md`](./RULES.md) | 72 条硬规则完整列表（含 #57 Hero 定义、#66 官方课件发布基线、#67 Hero 文件与 Gallery 同源、#70 地图讲解锚定、#71 单线叙事、**#72 禁止环境约束清单跳过基线**） | Completeness Gate 按需 |
| [`curriculum-standards.md`](./curriculum-standards.md) | 课标速查表（21 棵国内课标树） | Phase 0.5 知识查询 |
| [`historical-maps.md`](./historical-maps.md) | 地图资源完整规范 | 历史/地理课件 |
| [`CHANGELOG.md`](./CHANGELOG.md) | 版本变更日志 | 仅需了解版本演进 |

## 🚨 零、强制基线能力清单（Baseline Capabilities — MUST HAVE）

> ⛔ **这是开课前的第一检查项，违反任何一条 = Completeness Gate 直接判不通过。**
>
> 以下四大能力为 TeachAny 课件的**出厂标配**，不是"可选增强"、不是"用户要求才做"、不是"有时间再加"。**每一个新课件必须四项全启用**，除非用户明确说"不要 XX"。

| 能力 | 强制要求 | 实现方式 | 降级底线 |
|:---|:---|:---|:---|
| **① 多引擎 TTS 语音讲解**（v7.9.5 升级）| 必须为每个知识模块生成独立 mp3 + 同步字幕；⛔ **禁用浏览器 `speechSynthesis` 手写**；⛔ **不可整体跳过 L3**——但允许引擎自动回退 | **唯一标准入口**：`python3 scripts/tts-engine.py --text "..." --voice zh-CN-XiaoxiaoNeural --output xxx.mp3`（或 `from tts_engine import synthesize`）。该模块按以下优先级**自动回退**：(1) edge-tts 直连 → (2) edge-tts via 系统 HTTPS_PROXY/常见本地代理 → (3) macOS `say` 离线 TTS（zh: Tingting / en: Samantha）+ ffmpeg 转 mp3 → (4) pyttsx3 跨平台离线 → (5) 1 秒静音占位（前端 `teachany-tts-narrator.js` 用 Web Speech 朗读）。**所有引擎都强制校验生成的 mp3 ≥ 200 字节**——这是为了规避旧版 bug：Edge-TTS 依赖的 `wss://speech.platform.bing.com:443` 在国内常被防火墙拦截，导致 edge-tts "成功"返回但写出 0 字节 mp3。preflight-check.py 现在会在 Phase 0 实际跑一次探针，把结果写入 `.teachany-preflight.json` 的 `capabilities.L3_tts_engine` 字段，AI 必须读取并据此宣告本次实际使用的引擎。 | ⛔ **严禁以"edge-tts 网络不通"为理由跳过 L3**——必须按上述链路自动回退，不存在"无音频版课件"。⛔ 严禁直接调用 `subprocess.run(['edge-tts', ...])` 而不验证文件大小；必须走 `tts-engine.py`。⛔ 用户拒绝音频时仍须保留 `teachany-tts-narrator.js` 引用（零 mp3 回退模式），确保后续补录无需改 HTML |
| **② Remotion 程序化动画**（v7.9.8 强化信息密度铁律 / v7.9.9 强化帧级抽查 / v7.9.14 强化逻辑连贯性）| 课件必须含 **≥1 段真正用 Remotion 渲染的教学动画 mp4**（演示过程性变化），且 mp4 **必须三轨合一：画面 + 氛围音效/配乐 + TTS 语音朗读**（强烈推荐）。⛔ **视频信息密度铁律（v7.9.8 新增）**：视频是核心概念的重要动态表达方法，**不是装饰**。每段视频必须满足：(1) **画面动态变化 ≥3 个 beat**（如：等级层层浮现、要素逐项标注、关系连线生长、对比左右切换）；(2) **每分钟 ≥4 个新画面信息单元**（数字/文字/图标/连线 onEnter）；(3) **画面与 TTS 语义同步**（不是音频在讲 A、画面停在 B）；(4) **互动/可暂停回看**（前端 `<video controls>` 必备，关键节点用 `chapters` 或时间锚点供学生跳转）。⛔ **v7.9.9 新增·帧级可读文字强制（详见 §0.4.1 硬杠一）**：渲染完成后必须抽帧验证——随机截取 10 帧，每帧必须含 ≥1 个人眼可读的学科信息文字元素（标注/标题/数据/术语）；纯色块/渐变/抽象粒子/光效动画帧 ≥3 帧 = Gate 直接不通过。**"好看但看不懂" = 零信息密度 = 不合规。**⛔ **v7.9.14 新增·动画逻辑连贯性（详见 §0.4.1 硬杠八）**：动画的叙事逻辑必须与它嵌入的 section 语义严格对齐——⛔ 严禁在"亚洲详解"section 里放"全球发展格局"动画；⛔ 严禁动画场景跨越 ≥2 个 section 的主题（需要多主题则拆成多个独立视频）；⛔ 严禁动画的叙事顺序与课件主叙事线不一致。 | Remotion + React + TS 渲染 1920×1080 @30fps → 输出 `assets/video/*.mp4` → 嵌入对应 section；音频通过 `<Audio src={staticFile(...)}/>` 叠加，ffmpeg 合成背景音效/edge-tts 生成语音旁白，放 `remotion/public/audio/`；**画面层必须用 `interpolate/spring/Sequence` 编排过程性元素**（不是单张 PNG 铺满全程） | ⛔ **无降级**。Canvas/SVG/CSS 动画不得替代 Remotion 基线；**仅有画面而无音频轨的哑片 mp4 视为不合规**。⛔ **v7.9.8 新增·伪视频禁令**：**严禁"一张 hero/poster 图铺满全程 + 音频轨"的伪视频**——这等于把音频伪装成视频，零教学信息密度，与基线 ⑨ 独立连续音频模块完全重复，浪费学生流量与认知带宽。判定标准：用 `ffprobe -select_streams v:0 -show_entries frame=pict_type` 抽样 ≥10 帧，若所有帧 SSIM > 0.99（即画面几乎不变），直接 Gate 不通过。⛔ **"Node 环境不可用"不是跳过理由**——Phase 0 必须安装 Node（preflight-check.py 自动安装），安装失败必须报告用户等待解决，绝不可降级为"Canvas 动画够用了"，更不可降级为"hero 图配音频凑数"。⛔ **v7.9.14 新增·动画与 section 语义错位**：嵌入"亚洲详解"section 的动画必须讲亚洲，不能讲全球发展格局。缺 Remotion = 直接 Gate 不通过。唯一豁免：用户在**当前对话中**主动说"不需要视频/动画"——即便如此仍须在 Gate 中显式标注"L2 用户豁免" |
| **③ Canvas 互动组件** | 课件必须含 **≥1 个 Canvas 互动组件**（拖拽、画板、参数调节、实时绘图） | 原生 `<canvas>` + JS 事件 → 学生可拖动/点击/滑动改变参数并实时反馈 | 若主题确实无合适 Canvas 场景（如纯文言字词课），必须用 SVG 交互动画替代，并在 Gate 中说明理由 |
| **④ AI 生图 + 生视频** | 课件必须含 **≥2 张 image_gen 生成的情境/意境插图**；过程性学科（理/化/生/地/史）必须评估生视频需求 | Phase 3 阶段调用 `image_gen` → 存 `assets/illustrations/*.png` → `<img>` 嵌入；必要时调用生视频工具产出 `assets/video/*.mp4` | 若完全纯计算题课，可在 Gate 标注"跳过生图"并附理由，但**文科、科学、工程、社科课件一律不得跳过生图** |
| **⑤ Hero 知识结构主图**（v7.9.12 更新：永不降级） | 课件**必须**在标题 hero section **下方**独立区块呈现 **1 张知识结构主图**（信息图/脑图/模块关系图，≥1280×720），**非装饰性情境插图**；无现成图且无生图能力时走 L3 SVG 兜底（`gen-hero-svg.py` 自动生成知识结构矢量图，文字与课件语言一致），**不允许删除 figure 区块** | Phase 3 末：① `python3 scripts/find-hero.py <课件目录>` L1 查图床 → ② 未命中且有 image_gen 则 L2 生成位图（prompt 必须强调 "knowledge-structure infographic / flat poster / card nodes"，中文课件要求中文节点文字）→ ③ 仍无则 L3 `python3 scripts/gen-hero-svg.py <课件目录>` 生成 SVG；HTML 用 `<figure class="ta-standard-figure"><img class="hero-cover-img" src="./assets/<id>-hero.{png,svg}"><figcaption>知识结构主图：围绕核心问题呈现 X→Y→Z 学习模块</figcaption></figure>` 放在 hero section **之后**、学习目标 section **之前** | ⛔ **严禁**把 hero 图贴在 `<section class="hero">` 的标题背景/叠加层；⛔ **严禁**用驼队/实验室/卡通人物等装饰性情境图充当 hero（只能当正文插图用）；⛔ L2 生成必须用"信息图"风格，严禁 "warm cartoon / realistic illustration" 关键词；⛔ **v7.9.12 起严禁删除 `<figure>` 区块**——必须走 L3 SVG 兜底；⛔ 严禁手写内联 `<svg>` 塞进 HTML 代替 `<img>` 标签 |
| **⑥ 真实交互 + 连续音频** | 标题写"互动/实验/探究/画布/地图/跟读"的模块必须真的可操作；语音/拼音/英语/朗读课必须有独立连续音频播放器 | HTML 中必须有真实控件和反馈：`<canvas>`/`<input type="range">`/拖拽/地图事件/按钮状态反馈；音频用 `audioPlaylist` + 可见 `<audio controls>` 或悬浮播放器，`ended` 自动播放下一段 | ⛔ **严禁**用静态图片、SVG 截图、data:image 信息图伪装交互模块；⛔ 视频音轨不能替代独立连续音频；⛔ 单个"点我听"音效不能替代整课连续播放 |
| **⑦ 标准知识图谱模块**（v7.9.4 统一为唯一技术路线）| 课件**必须且只能**通过 `scripts/teachany-knowledge-graph.js` 标准模块挂载知识图谱，⛔ **严禁自造图谱实现** | **唯一标准调用方式（禁止偏离）**：(1) `<head>` 加入 `<link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">`；(2) `<section id="knowledge-graph">` 内写 `<div data-teachany-kg="<node_id>"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>`；(3) `</body>` 前引入 `<script src="../../scripts/teachany-knowledge-graph.js" defer>`。模块自动读取 `scripts/teachany-kg-manifest.json` 渲染本节点+前序+后续+同域，**无需手写任何数据**。⛔ **严禁手写 `knowledgeGraphData` 内联对象**；⛔ **严禁手写 SVG / d3 / ECharts / 纯 div / 静态图片版图谱**；⛔ 严禁改模块 JS/CSS 源文件（风格只覆盖 `--kg-primary/--kg-bg/--kg-card/--kg-border` 等 CSS 变量） |
| **⑧ 标准 AI 学伴入口卡片**（v7.7 新增） | 课件必须显式嵌入一张可见的 AI 学伴入口卡片，不可只依赖左下角 FAB | 引入 `scripts/teachany-tutor-card.{css,js}` + 在课件正文（推荐放在"小结"或"前测"区附近）写一行 `<div data-teachany-tutor-card></div>`；卡片显示标题、简介、4 个建议提问按钮，点击任一处都会唤起 ai-tutor.js FAB 的对话面板 | ⛔ 不允许只引入 `ai-tutor.js` 不放卡片——学生在长页面下经常看不到左下角 FAB；⛔ 不允许在卡片里硬编码 API Key，配置仍由 ai-tutor.js 负责 |
| **⑨ 标准独立连续音频模块**（v7.7 新增 / v7.9.9 强化 UX 自解释） | 凡课件有 2 段及以上音频讲解时，必须用 `scripts/teachany-audio-player.js` 渲染统一的"曲目卡片 + 底部连续播放条"，不再手写 audio-bar。⛔ **v7.9.9 新增·UX 自解释铁律（详见 §0.4.1 硬杠二）**：音频模块在 UI 上**必须**让学生无需任何额外说明即可理解其用途——(1) 必须有醒目可见的中文标题（如"🎧 语音导学模式"、"📖 课文朗读"），不能是裸播放器；(2) 每个音频条目必须有描述性中文标题（不是 `seg01`/`audio_1`）；(3) 播放区域必须有 1-2 句使用引导文字。 | 引入 `scripts/teachany-audio-player.{css,js}`；在课件中加 `<div data-teachany-audio><script type="application/json" data-teachany-audio-playlist>[{"id":"seg01","sectionId":"module-1","title":"..","src":"./tts/seg01_zh.mp3"}, ...]</script></div>`；模块自动渲染播放列表 + 全局底部条 + IntersectionObserver 滚动同步 | ⛔ **禁止**每个课件继续重复粘贴 80+ 行内联 audio-bar 代码；⛔ 单段音频可直接用 `<audio controls>`，但有播放列表必须用模块；⛔ 不可破坏自动连播逻辑（`ended` 事件自动进入下一首） |
| **⑩ 标准历史地图模块**（v7.7 新增 / v7.7.2 升级为 Leaflet / v7.9.4 统一为唯一技术路线）| 历史 / 地理课件提到"疆域 / 战役 / 路线 / 政区 / 朝代变迁"**必须且只能使用 `scripts/teachany-historical-map.js` 标准模块**，严禁自行造地图实现。 | **唯一标准调用方式（禁止偏离）**：(1) `<head>` 引入 3 行：`<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">` + `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>` + `<link rel="stylesheet" href="../../scripts/teachany-historical-map.css">`；(2) `</body>` 前：`<script src="../../scripts/teachany-historical-map.js" defer>`；(3) 复制文件到课件本地：`cp skill/assets/historical-{china,world}/<file>.geojson <课件>/assets/maps/` + `cp skill/assets/hillshade/global-color-hillshade-2k.jpg <课件>/assets/maps/hillshade.jpg`；(4) 课件 HTML 中写：`<div data-teachany-map="my-map" data-teachany-map-scope="china|world" data-teachany-map-title="标题"><script type="application/json" data-teachany-map-config>{"eras":[{"id":"qin","label":"秦","file":"qin-dynasty.geojson","fill":"#6366f1","stroke":"#4f46e5","desc":"描述","cities":[[lat,lng,"中文名","En","描述"]]}],"center":[34,108],"zoom":4,"fitBounds":[[18,72],[52,140]]}</script></div>`。⛔ **严禁自行手写 Leaflet 代码、ECharts geo、Canvas 绘图、SVG 方框、D3 地图**——只能用标准模块。⛔ **严禁用在线 XYZ 瓦片服务**。可用 geojson 清单：`skill/assets/historical-china/{qin,west-han,east-han,three-kingdoms,northern-southern,sui,tang,north-song,south-song,liao,jin-jurchen,yuan,ming,qing}-dynasty.geojson` + `skill/assets/historical-world/{bce-3000~ce-2000 共 22 个}.geojson`。批量注入工具：`python3 scripts/apply-historical-maps.py`（读取 `scripts/historical-maps-manifest.json` 自动注入）。 |config>{"eras":[{"id":"qin","label":"秦","file":"qin-dynasty.geojson","fill":"#6366f1","stroke":"#4f46e5","desc":"...","cities":[[34.27,108.95,"咸阳","Xianyang","秦都"]]}], "center":[34,108], "zoom":4, "fitBounds":[[18,72],[52,140]]}</script></div>`。批量工具：`python3 scripts/apply-historical-maps.py` 读 `scripts/historical-maps-manifest.json` 自动注入+复制 geojson+复制 hillshade；(5) 模块自动渲染朝代切换按钮、彩色阴影地形底图、悬停金黄高亮、点击红色城市 popup、时代说明面板、图例。 | ⛔ **严禁**用纯手画 SVG / Canvas 方框拼接当作"历史地图"——城市坐标会和疆域错位；⛔ **严禁**不引入 Leaflet 自造投影；⛔ **严禁**直接 fetch 跨目录 `../../skill/assets/...`——GitHub Pages 部署后 404，必须复制到课件本地；⛔ **严禁**省略 hillshade.jpg——地图会变成"暗蓝空地"；⛔ **严禁**省略时代 `desc`（学生看不懂）；⛔ 新朝代必须先在 `skill/assets/historical-{china,world}/` 补 geojson |
| **⑪ 标准 Web Speech 悬浮 TTS 播放器**（v7.7.4 新增） | 零 mp3、零配置的浏览器原生朗读控制器。课件正文中在关键段落加 `<p data-tts>...</p>` 即可自动生成右下角悬浮控制条。| `<head>` 引入 `<link rel="stylesheet" href="../../scripts/teachany-tts-narrator.css">`；`</body>` 前 `<script src="../../scripts/teachany-tts-narrator.js" defer></script>`；有 `[data-tts]` 段落时自动出现 ⏮▶️⏭ + 语速（0.85×/1.0×/1.15×/1.3×） + 当前段落高亮 + scrollIntoView；可选同级 `./narration.json`（`{"paraId": "高质量朗读稿"}`）用作 data-id 段落的替代文本；页面隐藏自动暂停；底部音频条/Tap Bar 激活时 `body.tap-bar-on` 自动上移 80px 避让。**全局 API**：`window.TeachAnyTTSNarrator.{play,stop,next,prev,toggle,cycleRate}`。| ⛔ **严禁**再在课件里手写 `speechSynthesis` 代码块和自建控制器——已全部迁到标准模块；⛔ 无 `[data-tts]` 时模块静默不插 UI（零占位）；⛔ 如同时使用 `teachany-audio-player.js` 标准音频模块，优先用后者（mp3 音质更好）；Web Speech TTS 适用于没有 mp3 脚本、但希望一键朗读正文的纯文本课件 |
| **⑫ 标准情境感知气泡模块**（v7.7.4 新增 / v7.9.4 强化 FAB 依赖） | 学生滚动到某 section 时，左下角自动弹出对应的思考/讨论提示（挨着 AI 学伴 FAB），8 秒淡出。点击气泡 = 点击 FAB 打开 AI 学伴。| `<head>` 引入 `<link rel="stylesheet" href="../../scripts/teachany-section-hints.css">`；`</body>` 前 `<script src="../../scripts/teachany-section-hints.js" defer></script>`；**数据源三选一**：(a) 在 section 上写 `<section id="module-1" data-tsh="思考：为什么要这样证明？">`；(b) 在任意元素上写 `<div data-tsh-key="my-key">` 并在 JSON 里用 `my-key` 作 key；(c) 同级 `./section-hints.json` 写 `{"module-1": "思考：为什么要这样证明？"}`。IntersectionObserver 监控可见度（threshold 0.35/0.6），取最可见的 section 展示。`body.tap-bar-on` 时自动 `bottom: 114px` 避让底部音频条。⚠️ **依赖**：模块代码硬依赖 `.ai-tutor-fab` 选择器（点击气泡时唤起对话），因此 `ai-tutor.js` 必须正确渲染 class=`ai-tutor-fab` 的 FAB（基线⑧已强制）。**全局 API**：`window.TeachAnySectionHints.{show,hide}`。| ⛔ **严禁**再在课件里手写 IntersectionObserver 气泡逻辑——已全部迁到标准模块；⛔ 无 `[data-tsh]`/`[data-tsh-key]` 和 `./section-hints.json` 时模块静默不弹（零占位）；⛔ 提示文案控制在 ≤40 字，保持"一句话触发思考"的格调；⛔ 不要用"提醒学生记笔记"这种 meta 指令——应是学科性开放提问 |
| **⑬ 五件套批量注入工具**（v7.7.4 新增，元规则）| 所有课件必须同时挂载五件套（ai-tutor + tutor-card + tts-narrator + section-hints + knowledge-graph）。管理员维护者可用批量脚本幂等注入。| `python3 scripts/apply-standard-modules.py [--dry-run] [--only <path>]` 扫描 `examples/*/index.html` + `community/*/index.html`，对每个课件检测并补齐 5 个 `<link>` + 5 个 `<script>` + tutor-card section + knowledge-graph section；node_id 解析双源（优先 `manifest.json.node_id`，fallback `courseware-registry.json.courses[].id → node_id`）；源 HTML 无 `</body>` 时 fallback 追加到文件末尾（同时提醒修复源文件的 HTML 截断问题）。| ⛔ **严禁**在批量脚本里埋"静默跳过无 manifest 课件"的分支——必须走 registry fallback 并报告 `skipped-no-node-id` 计数；⛔ 执行后必须对至少 2 个样本课件做浏览器实测验证 `window.TeachAnyTutor/TTSNarrator/SectionHints` 全部 = `object` |

| **⑭ 未挂载课件入口 · "其他知识"虚拟树**（v7.9.6 新增 / v7.9.7 支持 ext-* 学习路径课件）| 当 AI 生成的课件不属于任何现有课标体系时（如民间数学、思维方法、跨学科主题、课标未收录内容），**必须在 manifest.json 中标记 `free_mode: true`**，课件会自动出现在知识树的 ✨「其他知识 Other Knowledge」入口。| (1) 在 manifest.json 加 `"free_mode": true`；(2) `node_id` 可继续按 `<subject>-<level>-<topic>` 命名（便于 Gallery 分类）也可留空；(3) HTML `<head>` 可加 `<meta name="teachany-free-mode" content="true">` 辅助发布脚本识别；(4) `scripts/rebuild-index.py` 步骤 3.5 自动把以下四类课件收纳到 `data/trees/other/user-generated.json`：(a) `free_mode=true` 的课件、(b) `node_id` 不在任何官方课标树中的课件、(c) 缺 `node_id` 的课件、(d) **v7.9.7 新增**：`ext-*` 前缀的学习路径推荐课件（无 manifest.json，元信息从 HTML `<meta name="course-*">` 提取，通过质检的才纳入）；(5) 虚拟树自动挂到每个 curriculum 的"其他 Other"行，tree.html 零改动即可显示。**ext-\* 质检门槛**：① `course-id` 以 `ext-` 开头；② HTML ≥ 10 KB；③ 含 `<meta name="course-subject">` 和 `<meta name="course-title">`；④ 含 ≥ 5 个 `<section>`。任一不通过 → 跳过不入树，并打印 `⚠️ ext 课件未通过质检，跳过`。| ⛔ **严禁**为"挂不上树"就删除 `node_id` 字段——应优先 (A) `find_nodes.py` 搜索相近节点、(B) `register_node.py` 注册新节点，确实无法归类时再 (C) `free_mode=true`；⛔ **严禁**在"其他知识"树中手工编辑 `domains[0].nodes[]`，该字段每次 rebuild 会被完全覆写；⛔ **严禁**把已经有对应官方节点的课件强行标 free_mode（会造成知识图谱遗漏）；⛔ **严禁**绕过 ext-\* 质检门槛直接把不合格的空壳课件塞进仓库 |

### 0.0.1 其他知识入口使用指引（v7.9.6 新增）

**场景**：AI 生成课件时，用户给的主题不在任何课标体系内，常见情况：
- 民间学习方法（如"费曼学习法"、"思维导图制作"）
- 课标未收录的主题（如"AI 提示词工程入门"、"Minecraft 电路原理"）
- 跨学科融合内容（如"音乐 × 数学：和弦与频率比"）
- 用户自定义复习/拓展内容

**正确做法**（4 选 1）：

| 场景 | 处理方式 | 结果 |
|:---|:---|:---|
| 相近节点存在 | 用 `find_nodes.py` 找到后挂上该节点 | 出现在官方课标树 |
| 无相近节点但课标有定位 | 用 `register_node.py` 注册新节点 | 出现在官方课标树（status=placeholder） |
| **完全非课标内容** | manifest 加 `"free_mode": true`（+ 可选 `<meta name="teachany-free-mode" content="true">`） | **自动出现在 ✨ 其他知识树** |
| **学习路径推荐课件**（`ext-*` 前缀，无 manifest） | 在 HTML 加 `<meta name="course-id" content="ext-xxx">` + `course-subject` + `course-title` + `course-node` 等 meta | **质检通过后自动出现在 ✨ 其他知识树** |

**ext-\* 课件质检门槛**（v7.9.7 新增）：

学习路径推荐课件无 manifest.json，元信息依赖 HTML meta 标签。`rebuild-index.py` 在收纳前会做 4 项质检：

| 质检项 | 门槛 | 说明 |
|:---|:---|:---|
| 前缀 | `course-id` 以 `ext-` 开头 | 仅处理学习路径推荐课件 |
| 体积 | HTML ≥ 10 KB | 避免空壳占位 |
| 元信息 | 含 `course-subject` 和 `course-title` | 至少能分类和展示 |
| 结构 | 含 ≥ 5 个 `<section>` | 保证有基础教学结构 |

任一不通过 → 控制台打印 `⚠️ ext 课件未通过质检，跳过: <id> (<reasons>)` 并跳过，不入树不入 registry。

**在 `scripts/rebuild-index.py` 运行后**，AI 无需任何额外操作，课件会自动：
1. 进入 `data/trees/other/user-generated.json` 的 `domains[0].nodes[]`
2. 出现在 `tree.html` 的"其他 Other"学段行 → "✨ 其他知识"按钮
3. 被 `teachany-kg-manifest.json` 收录，使得 `teachany-knowledge-graph.js` 标准模块仍能正常渲染该节点的图谱区块
4. 继续出现在 Gallery（按 manifest.subject 分类）

**常见疑问**：

- Q: free_mode 课件会影响知识图谱的前后衔接吗？
  - A: 不会。虚拟节点 `prerequisites/extends/parallel` 默认为空数组，知识图谱模块会正常渲染"独立节点"视图。如希望与官方节点互联，请改为方式 (B) 注册新节点。
- Q: 删掉课件后"其他知识"树会留空节点吗？
  - A: 不会。`rebuild-index.py` 每次幂等重写 `domains[0].nodes[]`，仅收录**当前存在**的课件。



| 课件类型 | TTS | Remotion | Canvas 互动 | 生图 | 生视频 | Hero 图 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 数学（代数/几何/函数） | ✅ | ✅ 函数变换/几何证明 | ✅ 拖点画板/参数滑块 | ✅ ≥2 张情境图 | 可选 | ✅ 必须 |
| 物理 | ✅ | ✅ 实验过程/力分析 | ✅ 受力图/电路模拟 | ✅ ≥2 张 | ✅ 实验过程 | ✅ 必须 |
| 化学 | ✅ | ✅ 反应过程/分子结构 | ✅ 配平/搭建分子 | ✅ ≥2 张 | ✅ 反应动画 | ✅ 必须 |
| 生物 | ✅ | ✅ 生命过程/分裂过程 | ✅ 标注器官/拖拽匹配 | ✅ ≥2 张 | ✅ 微观过程 | ✅ 必须 |
| 地理/历史 | ✅ | ✅ 演变过程/迁徙路线 | ✅ 地图互动/时间轴 | ✅ ≥2 张情境图 | 可选 | ✅ 必须 |
| 语文（古诗词/文言文） | ✅ 必须按韵律录 | ✅ 意境动画/诵读节奏可视化 | ✅ 平仄标注/对仗匹配/翻字卡 | ✅ ≥2 张意境图 | 可选 | ✅ 必须 |
| 英语 | ✅ 英文母语声线 | ✅ 对话情境/语法动画 | ✅ 词汇匹配/句型重组 | ✅ ≥2 张 | 可选 | ✅ 必须 |
| 信息技术 | ✅ | ✅ 算法过程可视化 | ✅ 代码沙盒/可视编程 | ✅ ≥2 张 | 可选 | ✅ 必须 |

### 0.2 执行时点（强制）

1. **Phase 0（需求确认）末尾**：必须输出"基线能力开启清单"，明确声明 TTS/Remotion/Canvas/生图/Hero 五项全开（除非用户书面拒绝）
2. **Phase 0.5**：必须自动检测 Node.js/npm/ffmpeg（Remotion 的前置依赖）；缺失则自动安装（详见 [`phases/video-audio.md`](./phases/video-audio.md) Section 15.2），**不等待用户确认**
2.1. **Phase 0.5（知识点卫星文件查询）**（v7.9.13 新增）：定位课件目标知识点的 `node_id` 后，**必须**按以下顺序读取该知识点的全部个性化信息：
    - **Step 1**：从对应的知识树 JSON 节点（`data/trees/<curriculum>/<stage>/<subject>.json`）中读取 `kp_file` 字段，得到卫星文件相对路径（如 `data/kp/math/math-m-linear-function.json`）。
    - **Step 2**：`read_file(<repo>/teachany-courseware/<kp_file>)` 加载卫星文件，包含的字段：
      | 字段 | 说明 | 制作时如何使用 |
      |:---|:---|:---|
      | `curriculum_points` | 课标精炼要求（3-5 条，**双写字段**：主文件也保留供前端展示） | 写学习目标、Bloom 动词分布 |
      | `excerpts` | 课标 / 教材原文段落（最多几十条） | 写"课标依据"区块、引用原文 |
      | `textbook_chapter` / `textbook_semester` | 教材章节定位 | 写"本节在教材中的位置" |
      | `interactive_resources` | 推荐互动工具配置（GeoGebra / Desmos / PhET 等） | 直接读 `evalCommands` / `expressions` 套入课件 |
      | `textbook_content` | 多版本教材原文（人教/北师大/苏科等） | Phase 1 设计目标对齐 |
      | `supplements` | 教辅信息（典中点 / 五三 / 真题索引） | 出题、知识点扩充 |
      | `errors` | 易错点库 | Phase 3 设计"诊断 / 复习题" |
      | `exercises` | 题库（按 Bloom 分级） | 三级练习区直接调用 |
      | `memory_anchors` / `real_world` | 记忆锚点 / 实例情境 | hero 图 prompt、生活化导入 |
      | `bloom_verbs` | 该知识点专属 Bloom 动词建议 | 写学习目标 |
    - **Step 3**：若知识树节点**没有** `kp_file` 字段（极少数旧节点遗漏） → fallback 用 `data/kp/_index.json` 按 `node_id` 查找；仍找不到 → 走"其他知识树"`free_mode` 流程。
    - **Step 4**：制作完成后，**任何新发现的优质资源**（教材原文、图片素材、互动参数、题目、易错点）都应回写到卫星文件对应字段中，让下一次制作直接受益。回写示例脚本：`python3 scripts/inject-kp-fields.py --kp-id <id> --field <field> --json-file <data.json>`（待实现）。
    - ⛔ **严禁**继续从 `_archive_20260508/` 归档目录读 excerpts——已全部迁入卫星文件，归档目录视为只读历史。
    - ⛔ **严禁**直接修改 `data/trees/**/*.json` 中的节点字段（除 `prerequisites`/`status`/`courses`/`curriculum_points` 等结构性/前端展示字段外）——课标/教材类信息一律落到卫星文件；若同步修改了 `curriculum_points`，必须同时改主文件与卫星文件保持一致（推荐用 `scripts/restore_curriculum_points.py` 反向同步）。
3. **Generation Gate**：基线五项任一标注"跳过"必须附理由，且理由会被 Completeness Gate 二次审查；**Remotion 不可跳过**——"Node 环境不可用"必须先安装解决，不能当作跳过理由；**TTS 不可跳过**——即使用户拒绝也必须保留 `teachany-tts-narrator.js` 引用；**AI 学伴不可跳过**——是标准五件套之一；**知识图谱不可跳过**——知识层必定有数据，不存在"空图谱"场景；**历史/地理课件地图不可跳过**——地图是核心依赖，不存在"无地图版"课件；**Hero 知识结构主图永不降级**（v7.9.12 起：L1 图床未命中 → L2 image_gen 生位图 → L3 `gen-hero-svg.py` 生 SVG 知识结构图兜底，始终保留 `<figure>` 区块）
4. **Phase 3（制作）**：若环境支持 `task` 工具，必须并行分发 Agent C（生图含 Hero）+ Agent D（TTS）+ **Agent R（Remotion 渲染，默认必选）**；Hero 图必须在 Phase 3 末（HTML 完成前）完成生成

   ### ⛔ Subagent 派遣强制模板（v7.9.11 新增硬化）

   > **根因**：subagent 无状态，不会主动读 SKILL.md。主 agent 如果在 prompt 里自行重新定义"技术规范"（如"TTS 用 Web Speech"、"Hero 用内联 SVG"），subagent 会忠实执行并绕过硬规则。v7.9.11 起，**每次 task 工具派遣 Agent C/D/R，prompt 必须以下面的 `<HARD_RULES>` 块开头（原样拷贝，不得改写、不得精简、不得省略）**，否则视为绕过流水线。

   ```
   <HARD_RULES>
   你是 TeachAny 课件子智能体，执行任务前必须遵守以下铁律。
   任何违反 = 输出作废 + 主 agent 追责。

   【五件套铁律（v7.9.8）】每份课件必须同时具备以下 5 件，缺一不得交付：
   1. AI 学伴：scripts/ai-tutor.js + <div data-teachany-tutor-card>（#45 #60 #64）
   2. Hero 图：assets/<course-id>-hero.png 至少 1 张 PNG/JPG（#57 #64 #67）
      ⛔ 禁止用内联 SVG / 纯文字 hero 替代
   3. TTS 音频：assets/tts/*.mp3 至少 1 个（#16 #58 #61 #64）
      ⛔ 禁止用 Web Speech API (window.speechSynthesis) 代替实体 mp3
      ⛔ 必须走 python3 scripts/tts_engine.py（多引擎自动回退）
   4. Remotion 视频：assets/video/*.mp4 至少 1 个带音频轨（#32 #58 #64）
      ⛔ 禁止用 Canvas 动画 / GIF / CSS timeline 代替
      ⛔ 禁止"hero 图铺满 + 音频轨"伪视频（ffprobe SSIM>0.99 判死）
   5. 知识图谱：<div data-teachany-kg="<node_id>"> 挂载（#59 #64）
      ⛔ 禁止手写 SVG 伪装图谱

   【PLAN.md 合同】
   - 本次任务对应 PLAN.md 路径：{{PLAN_PATH}}
   - 必须先读 PLAN.md 第 2 节"模块级媒体策划表"中你负责的行
   - 你的产出物文件名必须与表中"资产文件名"完全一致
   - 产出后必须跑 PLAN.md 第 2 节中的"校验命令"自检通过

   【流水线工具链（禁止绕过）】
   - Hero：python3 scripts/find-hero.py <dir> → image_gen 兜底 → L3 scripts/gen-hero-svg.py 生 SVG（永不降级）
   - TTS：python3 scripts/tts_engine.py（Edge TTS + 多引擎回退）
   - Remotion：cd remotion && npx remotion render
   - 发布：python3 scripts/rebuild-index.py（禁手改 registry.json，#66 #67）

   【失败处理（红线四 #55）】
   - 同一处参数改 2 次失败 = 原地打转，必须换本质不同方案
   - 3 次失败未读官方文档 = 红线三不通过

   【交付前自检（红线一 #53）】
   - 声称"已完成"前必须贴命令执行输出作为证据
   - ls -lh 确认 mp4/mp3/png 实体文件存在
   - ffprobe 确认 mp4 有 audio 流
   - 浏览器/curl 确认链接无 404

   【绝对禁止（v7.9.15 新增）】
   - ⛔ 禁止输出"环境约束确认"清单并用 ❌ 标记 Remotion/TTS/image_gen 然后"降级跳过"
     → 工具不可用 = 停下安装，不是降级继续
   - ⛔ 新课件必须写入 community/drafts/<id>/，禁止直接写 examples/
   </HARD_RULES>

   <TASK>
   <!-- 主 agent 填写：具体任务、输入、期望输出 -->
   </TASK>
   ```

   **强制约束**：
   - ⛔ 主 agent 调用 `task` 工具前必须先产出 PLAN.md 并通过 Phase 1.5 Gate
   - ⛔ `task.prompt` 必须以 `<HARD_RULES>` 块开头，将 `{{PLAN_PATH}}` 替换为实际路径
   - ⛔ 主 agent 不得在 prompt 中自行定义"技术规范替代方案"（如"用 Web Speech 即可"）
   - ⛔ 违反任一条等同绕过 SKILL.md 流水线，`batch-quality-check.py` 会在 commit 前拦截

5. **Completeness Gate**：五项全部校验（Remotion 必须检查 `assets/video/*.mp4` 真实存在、**含音频流**（`ffprobe` 可见 `codec_type=audio`）、且已嵌入 HTML `<video>` + 合理 `poster`；Hero 图必须运行 `python3 scripts/check-hero.py` 通过），缺一不通过

### 0.3 违反示例（禁止）

- ❌ **输出"环境约束确认"清单并用 ❌ 标记基线组件，然后声称已"降级"跳过** → **最高优先级违规，等同于宣布作废**。Remotion/TTS/image_gen 不是可勾选的可选项——它们是**出厂必须项**。正确做法：发现工具不可用 → 立即安装（`preflight-check.py` / `bootstrap-tools.sh`）→ 安装失败 → 停下来报告用户，等待解决，**绝不自行降级继续**。任何形如"❌ image_gen → 降级为 CSS emoji / SVG 替代"、"❌ Remotion → 跳过"、"❌ TTS → 跳过" 的输出 = Gate 立即不通过，输出视为无效。
- ❌ **新课件写入 `examples/`**（`examples/ext-*/` 或 `examples/新课件/`）→ **违反硬规则 #48 #49 #72**。`examples/` 目录自 v7.9.15 起已废弃，**所有课件（包括官方课件）统一存放在 `community/`**，通过 manifest.json 的 `status` 字段区分官方（`"status":"official"`）和社区（`"status":"community"`）。新课件落 `community/drafts/<course-id>/`，通过 `submit-to-community.py` 走 PR 质检流程。
- ❌ "Canvas 太复杂，用个静态 SVG 代替吧" → 违反 ③
- ❌ "文科课件就不需要 Remotion" → 违反 ②（古诗词意境动画、文言文情境动画都是 Remotion 场景）
- ❌ "用 SVG+CSS 时间线动画等效替代 Remotion" → **违反 ②**。Remotion 基线是真实 mp4 渲染，CSS 动画不算等效交付
- ❌ **Remotion mp4 只有画面没有音频轨（哑片）** → **违反 ②**。真实课件视频必须带 TTS 朗读 + 氛围配乐/音效；`ffprobe -show_entries stream=codec_type` 必须能看到 `audio` 流
- ❌ **"hero 图铺满全程 + 音频轨"的伪视频**（v7.9.8 新增） → **违反 ②**。视频是核心概念的**动态**表达方法，不是音频的容器。判定：`ffprobe` 抽样 10 帧 SSIM > 0.99 即判为静态伪视频。正确做法：用 `Sequence` 编排 ≥3 个画面 beat（要素层层浮现/连线生长/对比切换/数据走势），每分钟 ≥4 个新信息单元，画面与 TTS 严格语义同步
- ❌ **视频里没有可见的过程性变化**（仅 fade-in 一张图后保持不变 4 分钟） → **违反 ②**。"过程性"是 Remotion 基线的本质——若主题确实只能用静态信息图表达，应直接放 `<figure>` + 独立音频模块 ⑨，**不要套个 mp4 壳**
- ❌ **视频 `<video poster="...">` 用了其他课件/其他主题的 hero 图** → **违反 ②**。每个 Remotion 视频必须配独立 poster 封面（建议用 `image_gen` 生成主题专属图），不得复用 hero-xxx.png 凑数
- ❌ **地图底图使用在线 XYZ 瓦片切片**（CartoDB / Esri / OSM 等） → **违反 ③**。历史/地理课件必须使用 `assets/maps/` 下的本地地图资源（地形底图 GeoJSON + 行政边界 + 本地地形瓦片），严禁依赖外部切片服务。详见 `historical-maps.md`
- ❌ **历史/地理课件没有地图** → **违反硬规则 #62**。地图是历史/地理课件的核心依赖，不存在"无地图版"课件——严禁以"内容简单""省事""地图资源不可用"等理由省略地图模块
- ❌ **地图底图缺失或降级为纯色背景** → **违反硬规则 #62**。hillshade.jpg 底图是教学必需，不可省略、不可用纯色背景替代
- ❌ **地图底图用 ECharts `graphic` 组件铺底** → **违反 ③**。`graphic` 是 DOM 绝对定位覆盖层，**不参与 `geo` 组件的缩放/平移变换**，用户缩放或拖动时底图会与国界/城市点严重错位
- ❌ **地图初始视图未聚焦核心区域**（默认停在 `[0,0]` 世界中心 / 视口显示大片无关海洋或空白） → **违反 ③**。必须用 `map.fitBounds(coreBounds)` 或 `setView([lat,lng], zoom)` 将初始视图精确对准该课件的教学核心区域（如讲希腊必须聚焦爱琴海 + 伯罗奔尼撒半岛，讲罗马必须聚焦地中海盆地）
- ❌ "用户没要求生图，就省略" → 违反 ④（生图/生视频/TTS/Remotion 均为**默认执行**，非用户触发）
- ❌ 在课件 HTML 中手写 `speechSynthesis` 代码块代替 TTS mp3 → 直接 Gate 不通过（前端朗读由 `teachany-tts-narrator.js` 标准模块自动注入）
- ❌ 直接 `subprocess.run(['edge-tts', ...])` 而不验证 mp3 文件大小 → 违反 ① v7.9.5。Edge-TTS 在 wss 被防火墙拦截时会"成功"返回但写出 0 字节 mp3，必须走 `python3 scripts/tts-engine.py` 或 `from tts_engine import synthesize`
- ❌ "edge-tts 装好了但 wss 不通" 就跳过 L3 → 违反 ① v7.9.5。tts-engine 自动回退到 macOS say / pyttsx3 / 静音占位，不存在"无音频版课件"
- ❌ **课件 Hero section 内 `<img class="hero-cover-img">` 贴在标题背景/叠加层** → **违反 ⑤ v7.9.1**。hero 图必须在 hero section **之后**用 `<figure class="ta-standard-figure">` 独立区块承载，不得与标题混合
- ❌ **用驼队/实验室/卡通人物等装饰性情境图充当 hero 图** → **违反 ⑤ v7.9.1**。hero = 知识结构主图（信息图/脑图），情境图只能嵌在正文某个章节作为情境插图
- ❌ **HTML 引用了 `./assets/xxx-hero.png` 但文件根本不存在**（产生 broken image 404）→ **违反 ⑤**。发布前必须 `python3 scripts/check-hero.py` 0 错误
- ❌ **多个课件复用同一张 hero 图**（如 5 个数学课件都用同一张 `math-hero.png`） → **违反 ⑤**。每张 hero 必须主题专属，由 image_gen 基于该课件主题专门生成（信息图风格）
- ❌ **L2 生成 hero 用的是 "warm cartoon / realistic illustration" 装饰性 prompt** → **违反 ⑤ v7.9.1**。必须用 "knowledge-structure infographic / flat poster / card nodes radiating / dashed connectors" 信息图风格关键词
- ❌ **L3 降级后 HTML 里仍残留空的 `<figure class="ta-standard-figure">` 标签** → **违反 ⑤**。v7.9.12 起已废除「删 figure」降级路径，必须走 SVG 兜底
- ❌ **无生图能力就直接删除 `<figure>` 区块** → **违反 ⑤ v7.9.12**。应该调用 `python3 scripts/gen-hero-svg.py <课件目录>` 生成 SVG 知识结构图兜底
- ❌ **手写内联 `<svg>` 塞进 HTML 代替 `<img src="./assets/xxx-hero.svg">`** → **违反 ⑤ v7.9.12**。SVG 必须作为独立文件由 `gen-hero-svg.py` 产出
- ❌ **把静态 PNG/SVG/data:image 放进"互动探究/互动实验/地图互动"模块** → **违反 ⑥**。只要标题或文案说"互动"，就必须有真实可操作控件、事件处理和反馈状态
- ❌ **拼音/英语/朗读课只有单个"点我听"音效或视频音轨，没有独立连续音频播放器** → **违反 ⑥**。必须提供 `audioPlaylist` + 可见播放器，并支持顺序连续播放
- ❌ **视频全程只有渐变色块/抽象光晕/粒子效果，没有任何可读文字或数据标注** → **违反 ② v7.9.9 帧级信息密度**。视频的每一帧必须含学生可暂停后能读到的学科信息（详见 §0.4.1 硬杠一）
- ❌ **音频播放器没有标题、没有使用说明，学生打开后不知道这是干嘛的** → **违反 ⑨ v7.9.9 UX 自解释铁律**。必须有醒目中文标题 + 每段条目中文命名 + 引导文字（详见 §0.4.1 硬杠二）
- ❌ **Canvas 组件只有静态渲染（零事件监听），或只有 click 切换背景色的"伪互动"** → **违反 ③ + §0.4.1 硬杠三**。Canvas 必须有 ≥2 个真实输入 + 学科相关的画面响应
- ❌ **插图/Hero 是"万能科技感背景"（宇宙星空/抽象光谱/彩色粒子），拿掉课件标题后分辨不出是什么学科** → **违反 ⑤ + §0.4.1 硬杠四**。图片必须含学科专属可识别元素
- ❌ **AI 学伴卡片建议提问写着"问题1/问题2"、音频条目叫 seg01/audio_1、figcaption 写"图片说明"等未替换占位符** → **违反 §0.4.1 硬杠五**。发布前 grep 验证零 placeholder 残留
- ❌ **互动地图只放在页面开头一次，后面按洲讲解全靠纯文字** → **违反 ⑩ + §0.4.1 硬杠七**。地理/历史课件的地图必须随讲解深入而局部复用，每个区域讲解内嵌局部地图
- ❌ **地图交互层级低于讲解层级**（地图只到洲级、讲解到子分区但地图无对应色块/边界）→ **违反 §0.4.1 硬杠七**。地图标注必须匹配讲解深度
- ❌ **比较分析需要对比两个区域但地图已滚过无法同屏可见** → **违反 §0.4.1 硬杠七**。比较场景必须同屏可见，不能凭记忆对比
- ❌ **地图旁无投影类型标注，无变形提示** → **违反 §0.4.1 硬杠七**。地理课件必须标注投影类型 + 变形提示
- ❌ **课件同时存在 ≥2 条叙事主线**（步骤导航+区域逻辑+主题逻辑三线并行）→ **违反 §0.4.1 硬杠八**。只能有一条主线，所有内容按此排列
- ❌ **导航/进度条说"第3步"但对应内容在讲"第5步"的事** → **违反 §0.4.1 硬杠八**。导航必须与内容严格对齐
- ❌ **学习目标顺序与内容呈现顺序不一致**（目标写先学依据再学分区，但内容先展示分区）→ **违反 §0.4.1 硬杠八**。目标序 = 内容序
- ❌ **嵌入在"亚洲详解"section 的动画讲的是"全球发展格局"** → **违反 §0.4.1 硬杠八**。动画语义必须与所在 section 匹配

> 📌 **一句话记住**：语音 + 动画 + 互动 + 图像 + 封面，五项齐全才是 TeachAny 课件。缺一不是 TeachAny，是普通网页。
>
> 🔒 **五件套铁律（v7.9.8 强化）**：每个新课件都必须**同时挂载并真实渲染**以下五件——任何一件缺失都视同基线不达标：
>
> 1. **AI 学伴**：`ai-tutor.js` + `teachany-tutor-card`（基线 ⑧）—— 不是只挂 FAB，必须有可见入口卡片
> 2. **Hero 知识结构主图**：独立 `<figure class="ta-standard-figure">` 区块（基线 ⑤）—— 不是装饰性情境图，必须信息图风格
> 3. **TTS 连续音频**：≥1 段 mp3 + 字幕（基线 ① + ⑨）—— 多段必须用 `teachany-audio-player.js`
> 4. **Remotion 教学视频**：≥1 段**有真实信息密度**的 mp4（基线 ②）—— ⛔ 不是 hero 图配音频，必须 ≥3 个画面 beat、画面与 TTS 同步、可暂停回看
> 5. **知识图谱**：`teachany-knowledge-graph.js` 标准模块（基线 ⑦）—— 不是手写 SVG 框框
>
> ⛔ 视频和交互动画是核心概念的重要**动态表达方法**，与"配套朗读音频"是两码事。一段教学视频如果换成 hero 图 + 同样的音频，学生体验完全不变 → 这就是伪视频，立刻返工。

---

### 0.4 严谨度铁律（Rigor Discipline — 五条红线）⛔ 必读

> ⛔ **课件开发是工程任务，不是写作任务**。每一次"差不多"、"应该可以"、"我猜是"，最后都会变成学生看到的 bug。以下五条铁律适用于**所有需要执行/验证/修复的环节**（生成 HTML、调 API、跑 Remotion、生图、Edge-TTS、批量改课件、git 推送）。**违反任一条触发 Gate 不通过，必须返工。**

#### 红线一·闭环验证（声称完成必须贴执行输出）

声明"已完成"、"已修复"、"应该没问题"之前，**必须实际跑命令并贴出执行输出作为证据**。课件开发场景下的强制证据清单：

| 操作 | 必须贴的证据 |
|:---|:---|
| 生成 HTML | `head -50 output.html` 输出 + 浏览器打开成功的 console 截图 / `puppeteer` 截图 |
| Remotion 渲染 mp4 | `ffprobe -show_streams assets/video/*.mp4` 显示 `codec_type=video` 且 `codec_type=audio` |
| Edge-TTS 生成 | `ls -la tts/*.mp3` + `file tts/*.mp3` 显示 MPEG audio + `wc -l tts/*.srt` ≥ 总段落数 |
| image_gen 生成 | `ls -la assets/illustrations/*.png` + 至少 1 张人工 review 通过的截图 |
| 批量改 N 个课件 | `find ... -exec md5 -q {} \\; \| sort -u \| wc -l` = 1（确认 N 个文件 hash 一致）|
| 修 ai-tutor.js / 互动逻辑 | curl 实测 API + Node 模拟流式解析 + 浏览器 Console 实测 |
| 推送到 Git | `git log -1` + `git rev-parse HEAD` + `git ls-remote origin main` 三个 hash 一致 |

**没有输出的"完成"叫自嗨，不是交付。** 用户接手的第一件事就是发现你撒谎。

#### 红线二·事实驱动（归因前必须用工具验证）

说出以下任何一类话之前，**必须先用工具验证**：

| 禁止说出口的猜测 | 必须先做的验证 |
|:---|:---|
| "可能是浏览器缓存问题" | 让用户贴 Console 第一行版本号 / 用 curl 模拟浏览器 fetch |
| "API key 应该过期了" | `curl -H "Authorization: Bearer ..." {endpoint}` 实测 |
| "这个模型应该不支持流式" | curl 加 `-N` 实测 SSE 输出 |
| "字体应该装上了" | `fc-list \| grep <fontname>` 验证 |
| "ffmpeg 应该可以用" | `ffmpeg -version` 验证 |
| "这个 prompt 应该能让模型理解" | 实际跑一次 image_gen / chat 看结果 |
| "课件应该可以在手机上打开" | `puppeteer` 设 viewport 375×667 截图 |
| "改完所有课件了" | 用 `grep -L` 找漏改的 |

未经验证的归因 = **甩锅**。猜的越多，用户来回的次数越多，浪费的时间越多。**先工具，再开口。**

#### 红线三·穷尽一切（说"无法解决"前必须走完五步）

声称"我无法解决"、"建议你手动处理"、"这超出能力范围"、"已尝试所有方法"之前，**必须走完通用方法论 5 步**：

1. **闻味道**：列出已试过的所有方案，看是否在原地打转（同一思路反复改参数 = 没换方案）
2. **揪头发**：
   - 用 web_search 搜官方文档原文（不是猜文档应该怎么写）
   - read_file 读源码上下文 50 行（不是只看报错那一行）
   - 反转假设（一直认为"是 A 的问题"→ 试着假设"不是 A"）
3. **照镜子**：是否在重复？是否该搜文档却凭记忆？是否忽略了最简单的可能（如重启服务、清缓存）？
4. **执行本质不同的新方案**（详见红线四）
5. **复盘**：检查同类问题（详见红线五）

**步骤 1-4 完成前不要向用户提问**——除非需求本身模糊，那先澄清。

#### 红线四·失败 2 次必换"本质不同"的方案

**反复改同一处的参数 = 原地打转**，不是"尝试新方案"。课件开发的典型反例：

| 原地打转（错） | 本质不同（对） |
|:---|:---|
| Remotion 渲染失败 → 反复改 `fps` / `durationInFrames` | 改用 `<Sequence>` 重构时间轴 / 改用 `headless` 渲染 / 拆成多个短 Composition |
| 字体不显示 → 反复改 CSS `font-family` 写法 | 用 `@font-face` 显式注册 / 改用 base64 内嵌 / 验证 fc-list / 换字体路径 |
| TTS 朗读断句不对 → 反复改 voice 参数 | 在文本里加 SSML `<break>` 标签 / 拆成多段录 / 换 voice |
| API 报 400 → 反复改 prompt 措辞 | 验证 model id / 检查请求 body schema / 看 official 错误码文档 |
| ECharts 地图错位 → 反复调 `geo.zoom`/`center` | 换实现方案：从 `geo` 组件改用 `Leaflet imageOverlay` |
| OpenRouter 返回空 → 反复改 reasoning 参数 | 直接换非推理模型 / 换非流式 / 换服务商 |

**第 2 次失败 = 立即停下，换思路；第 3 次还失败 = 必须读官方源码或文档原文。**

#### 红线五·修一个 bug 顺手扫同类问题（一类问题端到端解决）

发现并修复 X 后，**必须立即扫描同类问题**，一次性全部修掉。课件开发的标准动作：

| 发现 | 必须顺手扫的同类 |
|:---|:---|
| 一个课件的 ai-tutor.js 有 bug | 313 个课件全部 `find ... -exec cp` 同步 + md5 验证一致 |
| 一个课件的中文标题导致 fetch header 报错 | 检查所有 header 字段（Authorization / Referer / Title）+ Base URL / API Key 是否同样含中文 |
| 一个课件的 Remotion mp4 是哑片 | 用 `ffprobe` 批量扫所有 `assets/video/*.mp4`，找出全部哑片 |
| 一个课件的 image alt 缺失 | grep 全部 `<img>` 找无 alt 的 |
| 一个课件的 SSE 流式解析有问题 | 同步检查非流式 fallback 分支 + 错误处理分支 |
| 一处发现 localStorage 坏数据 | 加自动迁移逻辑（启动检测 + 读取清洗 + 保存拒绝）三层防御 |
| 一段 Edge-TTS 朗读速度不对 | 全部 mp3 用 `ffprobe -show_format` 检查时长是否合理 |

**"修完一个就交付" = 留坑给下一次。** P8 格局是"一个问题进来，一类问题出去"。

#### 适用范围声明

| 任务类型 | 是否强制执行五条铁律 |
|:---|:---:|
| Phase 3 生成 HTML / Remotion / TTS / 生图 | ✅ 全部强制 |
| 课件批改 / API 联调 / 部署 / 推送 | ✅ 全部强制 |
| 修 bug / 调 ai-tutor / 配置文件改写 | ✅ 全部强制 |
| Phase 1 教学设计文档创作 | ⚠️ 仅强制红线一（验证教学设计是否真的覆盖了用户提的知识点） |
| Phase 0 需求确认 | ⚠️ 仅强制红线二（不要猜用户意图，问清楚再开始） |

> 📌 **一句话记住**：跑命令贴输出 / 用工具不靠猜 / 走完五步再放弃 / 第二次失败必换思路 / 修完一个扫一片。课件是给真实学生看的，每一处偷工都会变成课堂事故。

---

### 0.4.1 反偷懒铁律（Anti-Hollow Implementation Rules — 八条硬杠）⛔ 必读

> ⛔ **核心原则：形式合规 ≠ 实质达标**。通过格式检查（文件存在、字节数达标、codec 正确）但内容为空壳/无意义/看不懂，视同未实现，Completeness Gate 直接不通过。
>
> 以下八条针对的是"技术上满足检查项、但学生打开后一脸懵"的偷懒行为——这比明确缺失更恶劣，因为它会骗过自动化质检，最终在学生手里暴露。

#### 硬杠一·视频帧级信息密度（Anti-Blob Rule）

**量化底线**：Remotion 渲染的每段 mp4 必须满足：
1. **每帧至少含 1 个可读文字元素**（标题/标注/数据/时间轴文字/人名/术语）——随机抽 10 帧，若超过 3 帧零文字 = Gate 不通过
2. **严禁全程抽象色块/渐变/粒子/光效**——无论多好看，若学生按暂停看不到任何可读学科信息 = 装饰品，不是教学视频
3. **至少 3 个可辨别的画面 beat**——beat 定义：画面主体视觉元素发生结构性变化（不是颜色渐变、不是缩放动画、不是同一内容重复出现）
4. **每个 beat 必须有对应的学科知识点**——不能是"第一个 beat 展示标题、后面全是装饰动画"

**判定工具（Gate 阶段强制执行）**：
```bash
# 抽帧检查可读文字
ffmpeg -i assets/video/*.mp4 -vf "select='not(mod(n\,30))'" -frames:v 10 -q:v 2 frame_%02d.png
# 人工审核：每张 frame 必须能回答"学生看到了什么学科信息？"
```

**违反案例**：
- ❌ 用 Pillow 逐像素渲染渐变色块 + 半透明圆形 → 视觉"好看"但信息密度 = 0
- ❌ 粒子系统/流体模拟/分形图案填满全程 → 与学科内容无关
- ❌ 全程只有一张背景图 + 文字淡入淡出 → 本质是幻灯片不是动画
- ✅ 时间轴逐项浮现 + 数据卡片切换 + 文字标注 + 对比表格 = 有信息密度

#### 硬杠二·音频模块必须对学生自解释（Purpose-Evident Rule）

**底线要求**：任何出现在课件中的音频播放器，学生**不看源代码、不问老师**就必须知道：
1. **这是什么**——必须有可见标题（如"🎧 语音导学模式"、"📖 课文朗读"、"🔊 重点段落精讲"）
2. **怎么用**——必须有 1-2 句使用说明（如"点击播放，跟随语音逐段学习"）
3. **每段是什么**——播放列表中每个条目必须有对应的中文标题（不能是 `seg01.mp3`、`audio_1`）

**判定方法**：截图课件音频区域，遮住所有代码，只看 UI → 如果你自己都说不出"这个播放器是干嘛的" = 不通过。

#### 硬杠三·Canvas 互动必须有真实计算逻辑（No-Static-Canvas Rule）

**底线要求**：
1. Canvas 组件**必须有至少 2 个用户可操作的输入**（拖拽手柄、滑块、点击切换、键盘输入）
2. 用户操作后**必须触发可见的画面变化**（不是只改了 console.log）
3. **画面变化必须与学科逻辑相关**（如改变 a 值 → 抛物线开口变化；拖动点 → 三角形面积实时更新）

**违反案例**：
- ❌ Canvas 只是用 JS 渲染了一张静态图（无事件监听） → 改用 `<img>` 就行了
- ❌ 有 click 事件但只是切换背景色 → 不是"互动组件"，是"颜色按钮"
- ❌ 用 Canvas 画了一张表格 → 应该用 HTML `<table>`
- ✅ 拖动函数参数 → 图像实时重绘 + 数值标注同步更新 = 真互动

#### 硬杠四·生成的图片/SVG 必须含学科内容（No-Generic-Art Rule）

**底线要求**：
1. `image_gen` 或手工制作的插图**必须含有与本课件学科主题直接相关的可识别元素**
2. "抽象科技感/宇宙星空/彩色光谱" 等万能装饰图 → 任何课件都能用 = 任何课件都不该用
3. Hero 知识结构图必须含**可读文字节点**（课件主题关键词），不能是纯图形

**判定方法**：把图片给一个不知道课件主题的人看，如果他猜不出"这是什么学科的什么知识点" = 不通过。

#### 硬杠五·所有 placeholder 必须在发布前替换（Anti-Lorem Rule）

**强制扫描项**：Gate 阶段必须用以下命令确认无残留：
```bash
grep -riE "(lorem ipsum|placeholder|TODO|FIXME|示例文本|待替换|xxx|TBD)" examples/<course-id>/index.html
# 输出必须为空
```

**违反案例**：
- ❌ AI 学伴卡片的"建议提问"写着"问题1、问题2、问题3"
- ❌ 音频标题写"segment 1, segment 2"而非中文知识点名
- ❌ figcaption 写"图片说明"而非实际描述
- ❌ section-hints 写"这里是思考提示"而非学科性提问

#### 硬杠六·信息密度基准测试（"遮住代码只看 UI" 测试法）

**总原则**：完成课件后，AI 必须对自己做一次"学生视角审查"——

> 想象你是一个初次打开这个页面的学生。对着课件的每个模块问自己：
> 1. **看得懂吗？** —— 这个模块在讲什么？我能从中学到什么？
> 2. **用得了吗？** —— 按钮/控件点了之后会发生什么？有反馈吗？
> 3. **区分得开吗？** —— 这个模块和上下文的其他模块是不同的东西吗？还是换了个壳的同一坨？

如果对三个问题中的任何一个回答"不确定"、"说不清" → 该模块需要返工。

**Gate 清单补充项（v7.9.9 新增，v7.9.14 扩充）**：
```
[ ] 视频：随机截 3 帧，每帧能回答"学生看到了什么学科信息？"
[ ] 音频播放器：不看代码，UI 上能看出"这是什么 + 怎么用"
[ ] Canvas 互动：有 ≥2 个可操作输入 + 操作后画面有学科相关变化
[ ] 插图/SVG：不知道课件主题的人能猜出这是什么学科
[ ] 无 placeholder 残留（grep 验证通过）
[ ] "学生视角审查"三问全部通过
[ ] 地图锚定：地图与讲解空间绑定，每个区域讲解内嵌局部地图，比较场景同屏可见（地理/历史课件必查）
[ ] 投影标注：地图旁有投影类型声明 + 变形提示（地理课件必查）
[ ] 单线叙事：导航与内容对齐，学习目标顺序 = 内容顺序，动画场景与 section 语义匹配
```

> 📌 **一句话记住**：**学生打开课件后 3 秒内看不懂的东西 = 不存在**。技术上"有"但用户体验上"没有"，比真的没有更糟糕——因为它占用了屏幕空间、消耗了加载时间、还让学生困惑"这是啥？是我太笨了吗？"。**空壳比缺失更恶劣。**

#### 硬杠七·地图与讲解必须空间锚定（Map-Exposition Binding Rule）

**根因**：geo-m-world-regions（2026-05-10）暴露的典型问题——互动地图出现在讲解之前，中间被其他模块隔开；地图只到洲级、讲解深入到子分区但地图无对应；比较"东亚 vs 西亚"时地图已滚过无法同屏对比。

**底线要求**：
1. **嵌入式局部地图**：每个区域/朝代的讲解模块内**必须嵌入该区域的局部地图**，不能只在页面开头放一次总览地图
2. **双向跳转锚定**：地图点击某区域 → 跳到对应讲解 section；讲解 section 的标签/标题 → 能映射回地图对应区域
3. **比较场景同屏可见**：课件设计到"比较 A 与 B"时，A 和 B 在地图上的位置必须在同一视口内（分屏/高亮/连线），不能让学生先滚过地图再凭记忆比较
4. **标注层级匹配**：讲解到"东亚/西亚"等子分区时，地图上必须能看到子分区边界或色块，不能只显示"亚洲"整体
5. **投影类型声明**：地图旁必须标注投影类型（等面积/墨卡托等），附 1 句变形提示（如"⚠️ 高纬度地区面积被放大"）

**违反案例**：
- ❌ 页面开头放一个世界地图，后面 10 个 section 都是纯文字讲解各洲 → 地图和讲解完全分离
- ❌ 地图上只有七大洲色块，但讲解深入到"东亚季风 vs 西亚沙漠" → 地图层级低于讲解层级
- ❌ "比较东亚和西亚"但两个区域在地图上无法同时高亮 → 学生无法建立空间对应
- ✅ 每个洲的 section 内嵌 Leaflet 局部地图 + 点击子分区高亮 + 文字讲解同步 → 空间锚定

#### 硬杠八·课件必须单线叙事（Single-Narrative-Line Rule）

**根因**：geo-m-world-regions（2026-05-10）暴露——页面同时存在三套内容组织逻辑在竞争（步骤导航 vs 区域逻辑 vs 主题逻辑），学生不知道自己在哪条线上；导航说"第3步"但动画已跳到"第5步"的内容；学习目标顺序与内容呈现顺序不匹配。

**底线要求**：
1. **唯一主线**：课件只能有**一条**叙事主线。可选类型：①时间线、②空间线（按区域逐一）、③逻辑线（定义→分类→比较→应用）、④问题线（提问题→分析→解决）
2. **导航与内容严格对齐**：步骤导航/进度条的第 N 步必须对应内容区的第 N 个核心 section——不允许"导航说第3步但动画在讲第5步的内容"
3. **学习目标顺序 = 内容顺序**：Phase 1 写出的学习目标列表（①②③④）必须与课件正文的 section 顺序一一对应，不允许"目标写先学依据再学分区，但内容先展示分区最后才点明依据"
4. **动画场景与 section 语义同步**：嵌入在"亚洲详解"section 的动画必须讲亚洲，不能讲"全球发展格局"
5. **概念引入遵循课标顺序**：划分依据 → 分区 → 比较 → 总结，不允许跳过依据直接展示分区

**违反案例**：
- ❌ 步骤导航7步 + 区域逻辑按洲 + 动画5场景按主题 → 三线并行认知混乱
- ❌ 步骤3 对应的内容在讲亚洲，但动画在讲发达/发展中比较 → 导航与内容脱节
- ❌ 学习目标"先学划分依据"但内容先展示所有分区最后才说依据 → 目标与内容倒序
- ✅ 选定空间线 → 导航标签就是"亚洲→欧洲→非洲→…" → 每个section的地图+讲解+动画全部聚焦该洲 → 单线清晰

---

### 0.5 Hero 图基线详解（Hero Knowledge-Structure Infographic — CDN 优先 + SVG 兜底，永不降级）⛔ 必读

> 🔄 **v7.9.1 重大定义变更**：Hero 图不再是"装饰性封面插图"，而是 **知识结构主图（信息图 / 脑图 / 模块关系图）**。它的使命是让学生在学习开始前建立全局认知锚点，一眼看清"我要学什么、分几个模块、模块之间什么关系"。**情境插图（驼队 / 实验室 / 卡通场景）不再等于 hero 图**——只能嵌在正文某个章节作为情境引入。
>
> 🆕 **v7.9.12 重大规则变更**：Hero 图**永不降级**。废除 v7.9.1 的"L3 去掉 figure 区块"路径，改为「L3 SVG 知识结构图兜底」——没有生图能力时调用 `python3 scripts/gen-hero-svg.py <课件目录>` 自动产出 SVG 矢量知识结构图（文字与课件语言一致）。**任何课件都必须有可见的 `<figure>` hero 区块**。
>
> 📍 **位置**：Hero 图必须放在 `<section class="hero">`（标题 + 副标题 + tag 徽章）**之后**、学习目标 section **之前**的**独立区块**，使用标准结构 `<figure class="ta-standard-figure"><img class="hero-cover-img" src="./assets/<course-id>-hero.{png,svg}"><figcaption>课件标题 · 知识结构主图：围绕"核心问题"展开，呈现 X→Y→Z 四大学习模块</figcaption></figure>`。⛔ **严禁**把 hero 图贴在 hero section 的标题背景上（`background-image` 或 `<img>` + overlay 叠加）。
>
> 🔽 **三级降级链（永不降级，最终用 SVG 知识结构图兜底）**：
> 1. **L1 图床检索**：`python3 scripts/find-hero.py <课件目录>` → 查 image-registry.json → 命中则用 CDN URL
> 2. **L2 image_gen 生成**（当会话有 CodeBuddy / OpenAI image / Gemini Nano Banana 等生图工具）：用 "knowledge-structure infographic / flat poster / central title / card nodes radiating / dashed connectors / clean background" 风格 prompt，**严禁** "warm cartoon / realistic scene / friendly characters" 等装饰性关键词；**中文课件要求模型生成中文节点文字**
> 3. **L3 SVG 兜底**：L1 未命中 **且** image_gen 不可用 / 连续 3 次生成结果都是情境图风格 → **必须调用 `python3 scripts/gen-hero-svg.py <课件目录>`** 自动生成 `<course-id>-hero.svg`（viewBox 1280×720 + 中心主标题 + 副标题 + 2-6 节点环绕 + 虚线连接 + 6 色调色板，文字与课件语言一致），HTML 中 `<img src="./assets/<course-id>-hero.svg">` 正常引用，check-hero.py 会识别为 `l3-svg` 状态（合规，SVG 文件豁免 10KB 下限）
>
> 🔑 **核心原则：Hero/插图走 CDN、地图资源随 skill、知识点 MD 随 skill**。Hero 图片统一存储在独立图床仓库 `weponusa/teachany-images`，通过 jsDelivr CDN 全球加速分发；历史地图 geojson、地形底图、知识点 MD 库则随 skill 一起安装（课件制作时本地 `cp` 到课件目录）。

#### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│  Skill 安装包 · standard 姿势 ~140MB（含 .git ~30MB）        │
│  ├── skill/ (~1.1MB)                                        │
│  │   ├── assets/image-registry.json ← 图片 CDN 索引 (228KB) │
│  │   ├── phases/ tech/ templates/ guides/                   │
│  │   └── SKILL_CN.md + SKILL.md + RULES.md                  │
│  ├── assets/maps/ (~104MB)                                  │
│  │   ├── chrono-cn/   ← 中国朝代 geojson (24MB, 19 个)      │
│  │   ├── chrono-world/ ← 世界史 geojson (16MB, 21 时代)     │
│  │   ├── physical/   ← 海岸线/河流/湖泊/地形/hillshade(58MB)│
│  │   └── political/  ← 现代政区边界 (6.2MB)                 │
│  ├── data/ (~32MB)                                          │
│  │   ├── trees/ ← 知识树 (2.1MB)                            │
│  │   ├── knowledge-points/ (2.0MB)                          │
│  │   └── excerpts/ ← 课标原文摘录 8 学科 JSON (26MB)        │
│  ├── scripts/ (~4.3MB) references/ docs/                    │
│  └── .sparse-checkout-presets/                               │
├─────────────────────────────────────────────────────────────┤
│  ❌ 不下载（cone 模式自动排除）                               │
│  ├── community/ (328 课件, ~4.4GB)  ← 已迁移到 weponusa/teachany-courseware，Gallery 在线浏览      │
│  ├── examples/ (示范课件, ~1.2GB)    ← 已迁移到 weponusa/teachany-courseware      │
│  └── teachany-images/ (685MB)       ← CDN 按需加载          │
├─────────────────────────────────────────────────────────────┤
│  CDN 图床 (jsDelivr，运行时按需加载)                          │
│  └── cdn.jsdelivr.net/gh/weponusa/teachany-images@main/     │
│      └── 356+ 张按学科分类的 hero/插图                       │
└─────────────────────────────────────────────────────────────┘
```

#### Hero 查找三层降级链（CDN 优先，命中即停）

| 层级 | 资源池 | 命中后动作 | 命中率参考 |
|:---|:---|:---|:---:|
| **L1** | `image-registry.json` 索引 → CDN URL | HTML 中直接引用 CDN URL | 主流学科 ≈60% |
| **L2** | CDN 命名规则探测（`{subject}/{keyword}-hero.png`） | HTML 中引用 CDN URL | 补充 ≈20% |
| **L3** | `image_gen` 兜底生成（按学段差异化 prompt） | 生成 → 上传图床 → 引用 CDN URL | 新课件 ≈20% |

> ⚠️ **不再复制图片到课件 `assets/` 目录**。HTML 直接引用 CDN URL，由浏览器从 jsDelivr 加载。如需离线使用（如导出 PPTX），脚本会在打包阶段按需下载到本地。

#### L1：image-registry.json 索引查找（首选）

`skill/assets/image-registry.json` 包含所有已注册图片的 CDN URL 和匹配规则：

```bash
# 使用 image_resolver.py 查找
python3 scripts/image_resolver.py resolve --node math-m-linear-function --slot hero
# 输出: https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/linear-function-hero.png

# 或使用 find-hero.py（更简单）
python3 scripts/find-hero.py <课件目录> --subject math --grade 8
# 输出: ✅ CDN: https://cdn.jsdelivr.net/.../linear-function-hero.png
```

**学科目录约定**：`biology` / `chinese` / `english` / `history` / `math` / `physics` / `science` / `geography` / `chemistry`

**主题关键词映射**：从课件 `course_id` 提取核心词 → 匹配 `image-registry.json` 的 `match_nodes` 或 `tags`。例如：
- 课件 `bio-h-cell-membrane` → 匹配 `match_nodes: ["bio-h-cell-membrane"]` → CDN URL
- 课件 `math-m-quadratic-function` → 匹配 `tags: ["quadratic", "function"]` → CDN URL

#### L2：CDN 命名规则探测（补充）

当 `image-registry.json` 中未找到时，按命名规则构造 CDN URL 并 HEAD 探测：

```bash
# CDN URL 命名规则
# https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{keyword}-hero.png

# 示例：课件 hist-m-ww2
curl -sI "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/history/ww2-hero.png" | head -1
# HTTP/2 200 → 命中，直接用此 CDN URL
# HTTP/2 404 → 未命中，进入 L3
```

#### L3：image_gen 兜底生成（按学段差异化）

| 学段 | 视觉风格 | Prompt 模板 |
|:---|:---|:---|
| **小学** (G1-6) | 温暖卡通插画，鲜艳明快色彩 | `<主题中文>, warm cartoon illustration for elementary school students, bright vivid colors, friendly characters, simple shapes, educational poster style, 16:9 horizontal composition` |
| **初中** (G7-9) | 半写实插画 + 信息图元素 | `<主题中文>, semi-realistic illustration with infographic elements, clear visual hierarchy, educational textbook style for middle school, 16:9 horizontal banner` |
| **高中** (G10-12) | 学术几何插画，深色专业风 | `<主题中文>, academic geometric illustration, professional dark blue palette, conceptual diagram aesthetic, suitable for high school textbook cover, 16:9 horizontal layout` |

**生成后必须（三步闭环）**：
1. 上传到 teachany-images 图床仓库：`git add <subject>/<topic>-hero.png && git commit && git push`
2. 注册到 `image-registry.json`：`python3 scripts/image_resolver.py register --id <id> --file <subject>/<topic>-hero.png --subject <学科> --slot hero --match-nodes <course-id>`
3. HTML 引用 CDN URL：`https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/<subject>/<topic>-hero.png`

> ⚠️ **不再存到课件 `assets/` 目录**。图片统一上图床，HTML 统一引用 CDN。

**失败重试策略**：image_gen 失败 → 重试 1（换 prompt 风格）→ 重试 2（简化主题词）→ 重试 3（用通用学科 prompt）；3 次都失败才允许在 Generation Gate 中标注"Hero 生成失败，需用户书面豁免"

#### CDN 命名规则

| 规则 | 示例 |
|:---|:---|
| **CDN URL 格式** | `https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{keyword}-hero.png` |
| **学科映射** | `math` / `biology` / `physics` / `chemistry` / `history` / `chinese` / `english` / `geography` / `science` |
| **关键词提取** | 从 `course_id` 中去掉学科前缀：`bio-h-cell-membrane` → `cell-membrane` |
| **回退 CDN** | 主 CDN 不可用时：① `raw.githubusercontent.com/weponusa/teachany-images/main/` ② `ghfast.top/https://raw.githubusercontent.com/...` |

#### HTML 引用标准（CDN 优先，onerror 降级）

**默认模式：CDN `<img>` + onerror 降级（推荐）**
```html
<section class="hero">
  <img class="hero-cover-img"
       src="https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{keyword}-hero.png"
       onerror="this.onerror=null;this.src='./assets/{course-id}-hero.png'"
       alt="《<课件标题>》课件封面"
       loading="eager"
       decoding="async">
  <div class="hero-text">
    <h1 class="hero-title">《<课件标题>》</h1>
    <p class="hero-subtitle"><学段><学科>·G<grade></p>
  </div>
</section>
```

**CSS background-image 模式（视觉抽象主题）**
```html
<section class="hero"
  style="background-image: url('https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{keyword}-hero.png');">
  <div class="hero-overlay">
    <h1>《<课件标题>》</h1>
  </div>
</section>
```

> 💡 **离线/导出场景**：`export-pptx.py` 等打包脚本会在构建阶段将 CDN 图片下载到本地 `assets/`，确保离线可用。HTML 的 `onerror` 降级自然兜底。

#### Phase 3 完整流程（必跑）

```
1. HTML 生成完成 → 提取课件元信息（course-id, subject, grade, title）
2. 调用 python3 scripts/find-hero.py <课件目录> --cdn
   → L1 查 image-registry.json ─┬─ 命中：返回 CDN URL ✅
                                  └─ 未命中：进入 L2
   → L2 CDN 命名规则探测 ─┬─ 命中：返回 CDN URL ✅
                            └─ 未命中：进入 L3
   → L3 image_gen 生成 ─┬─ 成功：上传图床 + 注册索引 + 返回 CDN URL ✅
                          └─ 失败 3 次：Gate 声明豁免
3. 将 CDN URL 写入 HTML 的 <img src="...">
4. 跑 python3 scripts/check-hero.py <课件目录> 校验通过
```

#### 校验脚本（必须通过）

```bash
# 单课件检查（接受 CDN URL 和本地路径）
python3 scripts/check-hero.py <课件目录>

# 批量检查（发布前必跑）
python3 scripts/check-hero.py community/

# 输出预期：
#   ✅ PASS: 314 courseware checked, all have valid hero references
```

#### 与硬规则 #57 的关系

本节的所有要求都映射到 RULES.md 的硬规则 #57，发布流程中由 `validate-courseware.py` 调用 `check-hero.py` 强制校验。任一课件不通过 = 发布流程 exit 1，rebuild-index 拒绝执行。

#### Skill 安装体积控制（v7.9.13 更新）

**standard 姿势（推荐）约 110 MB**（工作目录）+ 30 MB（.git）= **总 ~140 MB**：

| 内容 | 是否随 skill 下载 | 大小 | 说明 |
|:---|:---:|:---:|:---|
| `skill/` 内核（phases/tech/templates/guides） | ✅ | ~1.1 MB | 核心制作规范与脚本 |
| `skill/assets/image-registry.json` | ✅ | 228 KB | CDN 图片索引（356 条 hero/插图记录） |
| `assets/maps/chrono-cn/*.geojson` | ✅ | 24 MB | 中国朝代疆域数据（秦~清 19 个） |
| `assets/maps/chrono-world/*.geojson` | ✅ | 16 MB | 世界历史疆域数据（BCE 3000~CE 2000，21 时代） |
| `assets/maps/political/` | ✅ | 6.2 MB | 现代政区边界（世界地理课件） |
| `assets/maps/physical/` | ✅ | 58 MB | 海岸线/河流/湖泊/地形瓦片/hillshade 底图 |
| `data/trees/` + `data/knowledge-points/` | ✅ | 4.1 MB | 知识树与知识点索引 |
| `data/excerpts/` | ✅ | 26 MB | 课标原文摘录（8 学科管线 JSON） |
| `scripts/` `references/` `docs/` | ✅ | 4.8 MB | 构建脚本与参考文档 |
| `community/` (328 课件) | ❌ | — | 已迁移到 `weponusa/teachany-courseware`，Gallery 在线浏览，不下载 |
| `examples/` (示范课件) | ❌ | — | 已迁移到 `weponusa/teachany-courseware` |
| `teachany-images/` 图床 | ❌ | — | 已迁移到 `weponusa/teachany-courseware`，CDN 按需加载 |

> 📌 **一键安装 standard 姿势（⚠️ 必须用 cone 模式）**：
> ```bash
> git clone --depth 1 --filter=blob:none --sparse git@github.com:weponusa/teachany.git
> cd teachany
> git sparse-checkout init --cone
> git sparse-checkout set skill/ scripts/ data/ assets/maps/ references/ docs/ .sparse-checkout-presets/
> # 结果：~140 MB（含 .git），全部地图 + 课标摘录就位，可立即制作
> ```
>
> ⚠️ **必须用 `--cone` + `set` 列目录**，不要用 `--from-file`。cone 模式的规则：只列出想要的目录路径，未列出的自动排除——**无需写 `!community/` 等否定规则**（cone 模式不支持 `!` 和 `*` 通配符，写了会被忽略导致排除失效）。
>
> 💡 **full 姿势 ~1.7 GB**：`git sparse-checkout disable`，含 community/ + examples/，适用于审阅/研究/批量操作。
>
> ⛔ **既有课件不随 skill 安装（v7.9.14 铁律）**：`/install-skill` 和 `install-cn-auto.sh` **严禁**将既有课件资产拉到用户本地；既有课件统一放在 `weponusa/teachany-courseware`。理由：(1) 课件合计 ~700MB，严重拖慢安装速度；(2) 用户通过 Gallery 在线浏览即可；(3) 安装 skill 的目的是"制作新课件"，不是收藏旧课件。**cone 模式下只列正向目录即可自动排除——不需要也不能使用 `!` 否定语法。**

---


## 一、何时使用

当用户提出以下需求时应优先使用本技能：
- "做一个初中/高中 XX 的教学课件"
- "帮我设计一节 XX 课"
- "把这个知识点做成互动网页/动画"
- "帮我讲清楚 XX 为什么成立/怎么理解"
- "给这个课件补练习、补互动、补教学设计"

当任务明显属于单一工具处理（如仅转 Word、仅导出 PPT）时，可与其他技能组合使用；但只要核心问题是**教学设计与课件体验**，应以 `TeachAny` 为主导。

---

## 二、通用教学设计底座

以下方法适用于几乎所有学科，是整个技能的"操作系统"。

### 2.1 开发前先回答 6 个问题

每个课件在动手前，先回答以下 6 问：

| 序号 | 问题 | 目的 |
|:---:|:---|:---|
| 1 | **学生是谁？** 年级、基础、常见状态 | 决定难度、节奏和语言 |
| 2 | **前置知识是什么？** | 决定是否需要铺垫或前测 |
| 3 | **学完要能做什么？** | 把"知道"改成可观察任务 |
| 4 | **真实场景是什么？** | 提供学习动机 |
| 5 | **最容易卡在哪？** | 决定"深层理解"和纠错设计 |
| 6 | **怎么判断学会了？** | 决定练习与评估方式 |

**输出要求**：这 6 问必须被转写成课件中的实际结构，而不是停留在说明文字里。

### 2.2 ABT 叙事 + 情境角色设计

每个新模块默认使用 **ABT 三段式** 引入学习动机，并配合 **情境角色** 增强代入感：

#### ABT 结构

```text
【And】学生已经知道什么
【But】现有知识解决不了什么问题
【Therefore】所以这节课要学什么新工具/新视角
```

#### 情境设计四要素

好的情境让学生"想学"——每个情境必须包含以下至少 3 个要素：

| 要素 | 说明 | 示例 |
|:---|:---|:---|
| **真实性** | 来源于真实生活、社会现象或学科问题 | "硬币放入水中为什么看起来变浅了？" |
| **角色感** | 赋予学生具体角色和任务身份 | "你是光学侦探，要破解消失的硬币之谜" |
| **冲突性** | 包含认知冲突或需要解决的挑战 | "筷子插进水里为什么看起来折断了？" |
| **学科性** | 自然指向本课核心知识点 | "香料商人要航海到东方，该选哪条路线？" |

#### 四种经典情境模式

| 模式 | 结构 | 适用学科 | 示例 |
|:---|:---|:---|:---|
| **角色任务型** | "你是X角色，需要完成Y任务" | 全学科 | "你是城市规划师，要设计最优公交路线"（一次函数） |
| **故事冲突型** | "发生了X事件，出现了Y问题" | 历史、语文、科学 | "一场改变世界的航海冒险"（新航路开辟） |
| **生活现象型** | "你注意到X现象吗？为什么？" | 理科、地理 | "为什么游泳池看起来比实际浅？"（光的折射） |
| **文化传承型** | "X文化面临Y挑战，如何传承？" | 语文、历史、美术 | "用数学之美守护剪纸非遗"（轴对称） |

#### ABT + 情境综合示例

- 数学：你已经会画直线了（And），但有些轨迹是弯的（But），所以要学二次函数（Therefore）。**情境**：你是篮球教练，要计算抛物线最高点来优化投篮姿势。
- 历史：你知道事件发生顺序了（And），但还不知道为什么会发生（But），所以要分析因果链和史料证据（Therefore）。**情境**：你是博物馆策展人，要为"商鞅变法"策划一场主题展览。
- 英语：你认识单词了（And），但真实交流时不会用（But），所以要做情境表达训练（Therefore）。**情境**：你刚到伦敦餐厅，要用英语完成点餐全过程。
- 生物：你知道植物细胞和动物细胞长得不同（And），但不知道细胞怎么变成两个（But），所以要学减数分裂（Therefore）。**情境**：你是细胞研究员，要在显微镜下记录细胞分裂的每个阶段。

**选择指引**：角色任务型适用于任何学科；故事冲突型特别适合历史和语文；生活现象型适合理科；文化传承型适合需要情感共鸣的人文课题。

### 2.3 内容审计三分法：必要 / 有帮助 / 装饰性

课件内容先分级，再排布：

| 等级 | 定义 | 处理方式 |
|:---:|:---|:---|
| 🔴 必要 | 不讲就学不会 | 主线必须出现 |
| 🟡 有帮助 | 有助于理解更深 | 放入"深层理解""延伸阅读""可展开卡片" |
| ⚪ 装饰性 | 对学习结果影响不大 | 能删就删，避免信息噪音 |

**硬规则**：任何一页里，装饰性内容不能压过必要内容。

### 2.4 认知负荷管理（Sweller）

| 负荷类型 | 课件中常见表现 | 设计对策 |
|:---|:---|:---|
| **内在负荷** | 知识本身难，概念关系复杂 | 拆步、分层、先例子后抽象 |
| **外在负荷** | 文字太多、动画太乱、颜色太花 | 控字数、控动效、统一视觉规则 |
| **关联负荷** | 学生主动组织知识的思考过程 | 设置预测、比较、分类、复述、迁移任务 |

**推荐指标**：
- 单张卡片核心信息尽量控制在 **75 字左右**
- 一个小模块只承载 **1 个核心问题**
- 新概念出现后，尽快配 1 个例子或 1 个互动
- 不要为了"好看"牺牲可读性和节奏感

### 2.5 Mayer 多媒体学习原则

在设计图文排版、动画与解说的配合时，遵守以下原则：

| 原则 | 含义 | 课件中的做法 |
|:---|:---|:---|
| **临近原则** | 相关的文字和图片放在一起 | 公式解读紧贴公式，不要隔着一大段 |
| **冗余原则** | 不要同时用文字+语音说同一段话 | 动画配旁白时，屏幕上只放关键词 |
| **信号原则** | 用视觉线索引导注意力 | 重点步骤加高亮、箭头、加粗 |
| **分割原则** | 长内容分段呈现 | 复杂过程拆成"点击下一步"或分场景 |
| **预训练原则** | 先解释关键术语再用它 | 新术语首次出现时给一句话定义 |

### 2.6 脚手架策略（Scaffolding）

对于需要学生产出（写、说、做、画）的任务，采用"先给支架，再逐步撤除"的策略：

```text
Level 1（全支架）：给模板/填空/半成品，学生补全
Level 2（半支架）：给结构提示/关键词，学生自主组织
Level 3（无支架）：只给任务要求，学生独立完成
```

**应用场景**：
- 语文写作：先给句式模板 → 给段落结构提示 → 自由写作
- 英语口语：先给对话脚本 → 给关键句提示 → 自由对话
- 数学解题：先给分步引导 → 给思路提示 → 独立解题
- 历史论述：先给论点+证据框架 → 给论点提示 → 自由论述

#### 学习记录单支架

为探究活动配套"学习记录单"，用结构化表单引导思维。在课件中以**可填写的互动卡片**实现：

| 记录单类型 | 适用场景 | 核心栏目 | 课件实现 |
|:---|:---|:---|:---|
| **观察记录单** | 实验/观察类（理科） | 我观察到… → 我的猜想是… → 实验验证… → 我的结论是… | 分步填空卡片+提交按钮 |
| **比较分析单** | 概念辨析/对比类 | 对象A特征… → 对象B特征… → 相同点… → 不同点… → 发现… | 双栏对比+拖拽分类 |
| **项目规划单** | 项目/创作类 | 我的目标… → 我的计划… → 需要的资源… → 时间安排… → 完成情况… | 可编辑表格+进度条 |
| **评价反思单** | 展示/总结类 | 我学到了… → 最满意的是… → 还想改进… → 给自己打★ | 文本框+星级评分组件 |

**设计原则**：
- 用填空/选择降低书写负担（尤其小学低年级）
- 用表格/框图引导思维结构化
- 留白区域鼓励个性化表达
- 每张记录单对应一个子任务/探究活动

### 2.6.1 自适应学习设计规范（Adaptive Learning Design）⛔ 必读

自适应学习不只是一套代码引擎（`TeachAnyAdaptive`，详见 [`phases/packaging.md`](./phases/packaging.md) Section 17.2），更是**课件内容设计的底层逻辑**。AI 在设计课件时，必须为不同学习状态的学生规划**差异化的学习路径和内容**。

#### 自适应四路分支内容设计

`decideBranch()` 返回四种路径，每条路径都**必须有对应的差异化内容**，不能只写 `normal` 路径：

| 分支 | 触发条件 | 必须设计的内容 | 禁忌 |
|:---|:---|:---|:---|
| **review-prereq** | 前置知识掌握度 < 0.5 | ① 前置知识的 1-2 道诊断题 ② 带链接的前置课件跳转卡 ③ "继续学习"按钮（不阻断） | ❌ 不能只显示"请先学习 XX"一句话 |
| **scaffold** | 当前节点掌握度 < 0.3 | ① 额外的 worked example（分步详解）② 降低一级 Bloom 层级的练习 ③ 更多视觉辅助和类比 | ❌ 不能和 normal 路径内容完全相同 |
| **normal** | 掌握度 0.3–0.8 | 标准教学流程（ABT → 讲解 → 练习 → 反馈） | — |
| **challenge** | 掌握度 ≥ 0.8 | ① 跳过基础讲解，直达综合应用 ② Bloom 高层级（分析/评价/创造）任务 ③ 跨知识点综合题或开放探究 | ❌ 不能只是"多做几道同类题" |

#### Phase 1 自适应设计要求

在 Phase 1（搭建教学骨架）中，必须完成以下自适应规划：

```text
自适应设计清单（Phase 1 必填）：
1. 前置知识链（从 _graph.json 的 prerequisites 提取）
   → 学生可能卡在哪些前置知识？
   → review-prereq 路径展示什么内容？

2. Scaffold 路径设计
   → 本课最难的 1-2 个概念是什么？
   → 对于"没学过"的学生，额外提供什么帮助？
   → 举例：scaffold 路径多一个 worked example 或多一步拆解

3. Challenge 路径设计
   → 对于"已经会了"的学生，提供什么延伸？
   → 举例：跨章节综合题、开放探究任务、变式推广

4. 分支触发点
   → 在课件的哪些位置调用 decideBranch()？（至少 2 个触发点）
   → 通常：前测结束后（决定是否跳过基础）+ 核心练习后（决定是否加码）
```

#### 分支触发点的标准位置

```text
课件结构中的自适应触发点：
┌── 前测 ──┐
│ 得分高 → challenge（跳过基础讲解）
│ 得分中 → normal
│ 得分低 → scaffold（增加前置回顾）
└──────────┘
     ↓
┌── 核心练习 ──┐
│ 全对 → challenge 延伸题
│ 部分对 → normal 巩固练习
│ 错误多 → scaffold 额外 worked example + 重做
└──────────────┘
     ↓
┌── 综合任务 ──┐
│ 高掌握度 → 开放探究 / 创造性任务
│ 中掌握度 → 标准综合题
│ 低掌握度 → 带提示的简化版综合题
└──────────────┘
```

#### 硬规则

- **每个课件至少 2 个自适应触发点**（前测后 + 核心练习后）
- **scaffold 路径必须有实质性差异内容**（不能只是同样内容+提示）
- **challenge 路径必须提供更高 Bloom 层级的任务**（不能只是多做题）
- **review-prereq 路径必须提供可操作的复习资源**（链接或内嵌迷你回顾）
- **永远不阻断学生**——所有分支都提供"跳过/继续"选项

### 2.6.2 探究式学习系统规范（Inquiry-Based Learning）⛔ 必读

探究式学习不只是"让学生做实验"。它是一种以**问题驱动、证据导向、学生主导**的教学策略，贯穿理科实验、文科论证、数学建模等多学科场景。

#### 何时必须使用探究式教学

| 场景 | 是否必须探究 | 说明 |
|:---|:---|:---|
| `curriculum_standards` 中含"探究"关键词 | ⛔ 必须 | 课标明确要求的探究实验/活动，不可改为讲授式 |
| `_graph.json` 的 `bloom_verbs` 含 `create`/`evaluate` | ⛔ 强烈推荐 | 高阶思维目标天然适合探究 |
| 实验/实践课课型 | ⛔ 必须 | 活动驱动模式 + 探究结构 |
| 专题课课型 | ⛔ 推荐 | 主题探究 + 多角度分析 |
| 纯概念讲解 + 低年级 | 可选 | 可用"引导式探究"（给更多提示）替代完全开放探究 |
| 纯计算/纯技能训练 | 不需要 | 用分步脚手架即可 |

#### 探究深度四级模型

根据学生年龄和探究能力，选择不同深度：

| 级别 | 名称 | 教师主导度 | 适用学段 | 课件实现 |
|:---|:---|:---|:---|:---|
| **L1 结构化探究** | 教师给问题+方法+步骤，学生按步操作 | 高（80%） | 小学、初中低年级 | 分步操作卡片 + "下一步"按钮 + 即时反馈 |
| **L2 引导式探究** | 教师给问题+方向，学生设计具体步骤 | 中（50%） | 初中 | 问题卡片 → 学生选择方案 → 执行 → 对比结果 |
| **L3 开放式探究** | 教师给问题，学生自主设计全过程 | 低（20%） | 高中 | 学习记录单（项目规划单） + 评价量规 |
| **L4 自主探究** | 学生自己提出问题并全程自主 | 极低（10%） | 高中选修/竞赛 | 开放任务 + 作品展示 + 同伴互评 |

**选择规则**：
- 小学默认 L1，最高 L2
- 初中默认 L2，可选 L3
- 高中默认 L2-L3，优秀班 L4
- **同一课件内可混合使用不同级别**（先 L1 热身 → 再 L2/L3 主探究）

#### 探究式课件的标准模块结构

当课型判断为"需要探究"时，使用以下标准结构：

```text
探究式课件标准结构（6 步）：
┌── 1. 情境提问 ────────────────────────────────┐
│ 呈现真实现象/矛盾/悬念，激发探究欲望         │
│ 课件实现：ABT 引入 + 现象图片/视频/动画       │
│ 关键输出：学生的初始猜想（可填写的预测卡片）   │
└───────────────────────────────────────────────┘
     ↓
┌── 2. 提出假设 ────────────────────────────────┐
│ 引导学生从现象中提炼可验证的假设               │
│ 课件实现：假设选择题 或 假设填空框             │
│ L1：给 2-3 个假设选项让学生选择               │
│ L2/L3：学生自主撰写假设（学习记录单）         │
└───────────────────────────────────────────────┘
     ↓
┌── 3. 设计验证 ────────────────────────────────┐
│ 确定实验/调查/分析的具体方案                   │
│ 课件实现：实验步骤排序（拖拽） 或 方案设计单   │
│ L1：给完整步骤，学生确认理解                   │
│ L2：给关键步骤，学生补全缺失环节               │
│ L3：学生自主设计，课件给评价量规               │
│ ⚠️ 理科必须标注控制变量和对照实验设计         │
└───────────────────────────────────────────────┘
     ↓
┌── 4. 收集证据 ────────────────────────────────┐
│ 执行实验/观察/数据收集                         │
│ 课件实现：交互模拟实验 或 数据记录表           │
│ 理科：参数调节器 + 实时数据图表               │
│ 文科：资料阅读 + 证据标注/摘录               │
│ 数学：动态图形操作 + 数据记录                 │
└───────────────────────────────────────────────┘
     ↓
┌── 5. 分析结论 ────────────────────────────────┐
│ 分析数据，得出结论，回答初始问题               │
│ 课件实现：图表分析题 + 结论填写框             │
│ 关键：对比初始猜想和实际结果（认知冲突点）     │
│ L1-L2：选择结论 → 解释为什么                  │
│ L3：自主撰写结论 + 证据引用                   │
└───────────────────────────────────────────────┘
     ↓
┌── 6. 反思拓展 ────────────────────────────────┐
│ 反思探究过程，迁移到新情境                     │
│ 课件实现：评价反思单 + 迁移应用题             │
│ "如果改变 XX 条件，结果会怎样？"              │
│ "这个原理在生活中还有什么应用？"              │
└───────────────────────────────────────────────┘
```

#### 各学科探究设计示例

| 学科 | 探究主题 | 情境提问 | 假设方向 | 验证方式 |
|:---|:---|:---|:---|:---|
| **物理** | 影响浮力大小的因素 | "为什么铁块沉底但铁船能浮？" | 浮力与液体密度/体积有关 | 参数调节模拟实验 |
| **化学** | 燃烧的条件 | "为什么蜡烛盖上杯子就灭了？" | 燃烧需要氧气+可燃物+着火点 | 对照实验排列（拖拽） |
| **生物** | 唾液淀粉酶的作用 | "为什么馒头嚼久了会变甜？" | 唾液中有酶能分解淀粉 | 温度-时间实验模拟 |
| **数学** | 三角形内角和 | "是不是所有三角形内角和都是180°？" | 任意三角形内角和=180° | 动态拖拽三角形顶点 |
| **地理** | 地形对气候的影响 | "为什么山的两边降水差异大？" | 迎风坡降水多 | 3D 地形+气流模拟 |
| **历史** | 商鞅变法成功的原因 | "为什么只有秦国变法最成功？" | 变法彻底性+君主支持 | 多史料对比阅读 |

#### 探究式学习的硬规则

1. **课标要求的探究实验不可改为讲授式**——如果 `curriculum_standards` 中有"探究 XX"的要求，课件必须包含完整的探究 6 步结构
2. **每个探究活动必须配套学习记录单**——使用 Section 2.6 定义的 4 种记录单类型
3. **探究必须有"认知冲突点"**——学生的初始猜想与实验结果不一致的时刻，是学习发生的关键
4. **理科探究必须标注控制变量**——"改变什么？保持什么不变？测量什么？"三要素必须明确
5. **探究深度必须匹配学段**——小学不用 L4，高中不能全是 L1
6. **文科也可以探究**——历史的史料分析、语文的文本比较、地理的区域调查都是探究的形式

### 2.7 先学习闭环，后视觉抛光

优先级按以下顺序执行：

```text
学习目标清晰 > 任务设计有效 > 反馈能纠错 > 页面好看 > 动画炫酷
```

如果时间有限，优先保证：
- 有真实问题引入
- 有可完成的任务
- 有针对性的反馈
- 有前后呼应的小结

---

## 三、课型分类与驱动模式：不同课型用不同结构

不是所有课都是"新授课"。必须先判断课型，再选结构模板，再选驱动模式。

### 3.1 课型分类表

| 课型 | 核心目标 | 推荐结构 |
|:---|:---|:---|
| **新授课** | 建立新概念/新方法 | ABT引入 → 新知讲解 → 深层理解 → 即时练习 → 小结 |
| **复习课** | 梳理与串联已有知识 | 知识地图 → 易错辨析 → 综合练习 → 查缺补漏 |
| **习题课** | 提升解题能力 | 典型例题 → 变式训练 → 错因归类 → 举一反三 |
| **专题课** | 围绕一个主题深入探究 | 主题引入 → 多材料/多角度分析 → 综合产出任务 → 反思 |
| **实验/实践课** | 动手操作与观察 | 目标预测 → 操作步骤 → 记录观察 → 结论与讨论 |
| **项目制课** | 综合实践、产出完整作品 | 大项目分解 → 子项目推进（调研→设计→制作→展示）→ 作品评价 |
| **跨学科融合课** | 多学科知识综合解决真实问题 | 真实问题引入 → 多学科视角分析 → 融合产出 → 多维评价 |

**判断依据**：用户说"讲一个新知识点"→ 新授课；说"帮我出一套练习"→ 习题课；说"帮学生复习"→ 复习课；说"做一个主题探究"→ 专题课；说"做一个项目/作品"→ 项目制课；说"跨学科/融合"→ 跨学科融合课。

### 3.2 四种驱动模式

确定课型后，进一步选择驱动模式。驱动模式决定课堂的核心推进逻辑：

| 驱动模式 | 适用课型 | 核心特征 | 典型学科 |
|:---|:---|:---|:---|
| **问题驱动** | 新授课、专题课 | 1个核心问题 → 3-4个子问题链，层层递进 | 数学、物理、历史（单课时） |
| **项目驱动** | 项目制课、跨学科融合课 | 1个大项目 → 多个子项目阶段，产出完整作品 | 语文跨学科、历史大单元、综合实践 |
| **活动驱动** | 实验/实践课、低年级新授课 | 3-5个递进活动，做中学 | 科学、体育、小学数学、物理实验 |
| **问题链驱动** | 新授课（概念建构型） | 环环相扣的问题链，驱动思维从记忆到创造 | 各学科均可，尤其适合新授概念课 |

### 3.3 驱动模式选择决策树

```text
课程目标是什么？
├── 需要产出完整作品/成果？ ─────→ 项目驱动
├── 需要动手操作、体验感知？ ────→ 活动驱动
├── 需要深度理解一个核心概念？ ──→ 问题驱动
└── 需要建构概念体系、思维进阶？ → 问题链驱动
```

**附加规则**：
- 小学低年级（1-3年级）：优先活动驱动，降低抽象思维负担
- 涉及多学科知识：优先项目驱动
- 概念辨析、易混知识点：优先问题链驱动
- 如果不确定，默认用"问题驱动"（最通用）

---

## 四、从"全科通用"到"学科适配"

本技能不默认所有学科都用同一种讲法。必须先搭通用底座，再切到学科专属模式。

### 4.1 学科适配总表

| 学科 | 主要学习对象 | 最适合的讲解方式 | 最适合的互动形式 | 最适合的评估方式 |
|:---|:---|:---|:---|:---|
| **数学** | 概念、关系、运算、证明 | 图形直觉 + 算理推导 + 一般化 | 作图、拖拽、分步推导、错因诊断 | 标准题 + 解释题 |
| **物理** | 现象、模型、公式、预测 | 现象观察 + 建模 + 定量分析 | 参数调节、实验预测、图像判读（**必须使用生活化场景**，见 6.4） | 预测题 + 计算题 + 解释题 |
| **化学** | 现象、微观机制、符号表达 | 宏观现象 + 微观粒子 + 化学语言 | 实验流程、条件判断、方程配平 | 实验解释 + 结构化作答 |
| **生物** | 结构、过程、功能、调控 | 结构图 + 过程链 + 功能联系 | 标注、排序、流程拼图、案例判断 | 图示题 + 过程解释题 |
| **地理** | 空间分布、成因、区域差异 | 地图观察 + 成因链 + 区域比较 | 地图定位、图表读数、因果链拖拽 | 材料分析 + 区域比较 |
| **历史** | 时序、因果、证据、视角 | 时间线 + 史料证据 + 多视角解释 | 排序、史料对读、立场比较 | 材料题 + 论述题 |
| **语文** | 文本、语言、情感、表达 | 文本细读 + 表达技法 + 主题迁移 | 批注、改写、朗读提示、片段仿写 | 批注题 + 表达任务 + 量规评价 |
| **英语** | 词汇、语法、语篇、交际 | 输入理解 + 支架输出 + 情境应用 | 跟读、配对、填空、口语脚本、对话 | 听说读写组合评价 |
| **信息技术** | 工具、流程、结构、实现 | 任务驱动 + 分步演示 + 调试反馈 | 点击操作、流程图、代码运行、错误排查 | 任务完成度 + 过程检查 |

### 4.2 学科专属"深层理解"框架

不要把所有学科都讲成"公式推导课"。应按学科切换"为什么能成立"的解释框架：

| 学科 | 深层理解优先框架 |
|:---|:---|
| **数学** | 图形直觉 → 算理过程 → 一般化结论 |
| **物理** | 现象观察 → 模型假设 → 规律预测 |
| **化学** | 宏观现象 → 微观解释 → 符号表达 |
| **生物** | 结构特点 → 过程机制 → 功能结果 |
| **地理** | 空间分布 → 形成原因 → 区域比较 |
| **历史** | 时序脉络 → 因果链条 → 史料证据/多视角 |
| **语文** | 语言细节 → 表达效果 → 主题/情感/迁移 |
| **英语** | 语言输入 → 结构支架 → 情境输出 |
| **信息技术** | 任务目标 → 操作流程 → 调试与优化 |

### 4.2.1 语文·古诗词课件专属教学法（"诗教四化"方法论）

> 本节方法论适用于小学至高中的古诗词课件开发。古诗词不同于一般现代文教学，必须遵循"以诵读为核心"的教学逻辑。

#### 核心理念

**诵读是棵常青藤，其他都是藤上的瓜。** 古诗词课件的一切教学设计——平仄、押韵、意象、意境、情感——都必须围绕"诵读"这条主线展开，而非把诗词当阅读理解来讲。

#### 一、"四化"教学法框架

古诗词课件必须按以下四个维度构建教学体验：

| 维度 | 含义 | 课件中的落地方式 |
|:---|:---|:---|
| **教学流程诵读化** | 以诵读贯穿全课，诵读既是方法也是目标 | 每个模块必须有"听诵读→跟诵读→自主诵读"环节；TTS 音频必须按诗词韵律录制（平长仄短韵脚延） |
| **系统知识碎玉化** | 把平仄、押韵、对仗等系统知识拆成小块，分散植入不同诗歌 | 每首诗只讲 1-2 个知识点（如押韵规则、平仄概念），不堆砌；知识点在"深层理解"卡片中呈现 |
| **诗语解读规范化** | 按古诗词的基本规律解读，不乱贴现代阅读理解标签 | 禁止用"总分总"分析古诗结构，应使用"起承转合"；题材/体裁术语必须准确 |
| **技能训练示范化** | 通过教师示范引导学生发现诵读方法 | 课件中的"范读"音频/标注是核心互动，不是装饰；设计"听我读→猜拖腔→跟我读→比赛读"递进环节 |

#### 二、诵读设计规范（课件必须遵循）

**1. 格律诗诵读三原则**：
- **平长仄短韵脚延**：平声字读长，仄声字读短，韵脚字拖长（课件中用颜色/下划线标注）
- **两字一顿**（声音节奏）：五言 2-2-1，七言 2-2-2-1，区别于意义节奏
- **依字行腔**：按字的声调决定读法，古诗里没有"轻声"字

**2. 诵读在课件中的落地**：

| 环节 | 课件设计 | 互动形式 |
|:---|:---|:---|
| **齐读** | 用于课件开头的基本训练或气氛营造 | TTS 领读 + 学生跟读提示 |
| **示范读** | 核心环节，标注平仄、拖腔位置 | 播放范读音频 + 动态高亮当前字 |
| **比赛读** | 激发诵读热情 | 对比两种读法让学生选择 |
| **背诵检测** | 课件末尾的评估环节 | 遮字填空 + 古版排版（竖排无标点）辅助背诵 |

**3. 古版排版技巧**：对有一定难度的古诗，课件中可设计"古版"呈现（竖排、无标点），学生通过反复诵读辨认，既练背诵又增趣味。简单的诗不宜用古版，以免滑稽。

#### 三、格律知识的碎玉化植入

每首诗只携带 1-2 个格律知识点，分散学习而非一次灌输：

| 知识点 | 适合植入的诗 | 课件中的呈现方式 |
|:---|:---|:---|
| **押韵** | 任何格律诗（优先韵脚明显的） | 韵脚字高亮 + 韵部标注（如"豪韵""东韵"） |
| **平仄基础** | 五言绝句（如《登鹳雀楼》） | 平仄标注在每字上方，用●○符号 |
| **四种格律句式** | 七言绝句（如《清明》《春日》） | 交互式：学生点击判断"平起/仄起" |
| **对仗** | 律诗（如《山居秋暝》颔联颈联） | 上下句并列，词性对应高亮 |
| **入声字** | 如《江雪》（绝/灭/雪三个入声韵） | 设"知识卡片"解释入声概念 |
| **起承转合** | 绝句（如《题临安邸》） | 四句分别标注"起/承/转/合" |

**押韵四规则**（课件中可作为知识卡片）：
1. 单句不押双句押
2. 首句可押可不押
3. 韵脚必须是平声
4. 一韵到底不能换

#### 四、意象教学规范

**1. 意象不是固定标签**：同一意象在不同诗中含义可能不同，课件必须标注"在本诗中的含义"，而非简单贴标签。

**常见意象及其多义性**（课件设计参考）：

| 意象 | 常见含义 | 含义变化示例 |
|:---|:---|:---|
| **月亮** | 思乡、怀人 | 也可表宁静、孤高 |
| **柳** | 留客、惜别 | 也可表春意 |
| **梅** | 坚强、高洁 | 也可表凄凉（"驿外断桥边"） |
| **水** | 离愁、时光流逝 | 逍遥（桃花流水窅然去）、亡国之痛（一江春水向东流）、失意（抽刀断水水更流） |
| **杜鹃/猿** | 凄凉、哀伤 | — |
| **菊** | 高洁、隐逸 | 也可表秋思 |

**2. 课件规范**：在意象教学模块中，必须设计"同一意象不同含义"的对比卡片，避免学生形成死板对应。

#### 五、诗体知识教学

课件中必须正确标注诗歌体裁，不可混淆：

| 体裁 | 辨识特征 | 课件中的处理 |
|:---|:---|:---|
| **五言绝句** | 5字×4句，讲究平仄 | 标注格律句式 |
| **七言绝句** | 7字×4句，讲究平仄 | 标注格律句式 |
| **五言律诗** | 5字×8句，颔颈联对仗 | 标注对仗 + 首颔颈尾联 |
| **七言律诗** | 7字×8句，颔颈联对仗 | 标注对仗 + 首颔颈尾联 |
| **古体诗** | 不受格律限制 | 标注为"古体"，不分析平仄 |
| **词** | 按词牌填写，长短句 | 标注词牌名及韵律特点 |

**体裁流变**：课件可在"扩展阅读"中简介——古体诗（四言→五言→七言→杂言）→ 近体诗（永明体→格律诗），帮助学生建立体裁谱系感。

#### 六、教学设计选择原则

**每首诗的教学设计只选一个主线**，不贪多：
- 诵读 / 意境 / 节奏 / 韵味 / 情感 / 文化 / 吟诵 / 意象——选择其中一种作为这首诗的教学重点

**知识点选取策略**（适用于课件中该诗的深层理解模块）：
1. **选不可或缺的**：如读节奏必须讲一点平仄，读韵味必须讲韵脚拖长
2. **选让教学增色的**：
   - "人无我有"——别人不会讲的独特知识点（如词牌释义、特殊韵部）
   - "人有我精"——同样的知识点但讲出新意（如从意象选择角度切入）
   - "出乎意料"——反常识、反直觉的发现（如讽喻诗的"反转"效果）

#### 七、课件禁忌清单

| 禁忌 | 原因 | 正确做法 |
|:---|:---|:---|
| ❌ 用"总分总"分析古诗结构 | 古诗结构是"起承转合" | 使用"起承转合"四段分析 |
| ❌ 将所有古诗都翻译成大白话 | "诵读好了诗意基本了然" | 诵读为主，艰深处才辅以译文 |
| ❌ 堆砌过多格律知识 | 碎玉化：每首诗只讲1-2个 | 按碎玉化策略分配知识点 |
| ❌ 意象一一对应贴标签 | 同一意象在不同诗中含义可能完全不同 | 必须标注"在本诗中的含义" |
| ❌ 吟唱/吟诵随意使用 | "刚入门就搬上讲台结果一定是抹黑" | 吟唱只能是点缀，非必须 |
| ❌ 课件中展示隶书/黑体古诗正文 | 低段宜楷体，中高段宜宋体 | 正文用楷体或宋体 |
| ❌ 过度"表演"式教学 | 如"风吹草低见牛羊"表演 | 诵读示范为主，慎用表演 |

#### 八、课件互动组件映射

| 古诗词教学环节 | 推荐互动组件（详见 [`guides/interaction-patterns.md`](./guides/interaction-patterns.md)） |
|:---|:---|
| 诵读训练 | TTS 音频 + 字级高亮 + 跟读提示 |
| 平仄标注 | 交互式标注（点击翻转显示平/仄） |
| 韵脚识别 | 分类配对（拖拽韵脚字到对应韵部） |
| 意象理解 | 对比双栏（同一意象不同含义） |
| 古版背诵 | 遮字填空 + 竖排古版排版 |
| 起承转合 | 拖拽排序（四句诗排列+标注起承转合） |
| 诗词鉴赏 | 文本批注 + AI 多模态（生成意境画） |
| 意境感受 | AI 生图（根据诗句生成意境插图） |



### 4.3 通用难点拆解法：五镜头法

遇到学生常问的"为什么""怎么区分""为什么总做错"时，从以下 5 个镜头中选 2-3 个组合：

| 镜头 | 含义 | 优先用于 |
|:---|:---|:---|
| 1. **看见它** | 观察现象、例子、文本、图像、数据 | 理科实验、地理图表、语文原文 |
| 2. **拆开它** | 把结构、步骤、组成部分拆开 | 数学推导、化学反应、英语语法、信息技术流程 |
| 3. **解释它** | 说明因果、机制、规则、表达作用 | 物理原理、生物过程、历史因果 |
| 4. **比较它** | 与相近概念、相反情形、错误示例对比 | 易混概念、易错点、近义辨析 |
| 5. **迁移它** | 放到新情境中，检验是否真正理解 | 所有学科的"会了吗"检验 |

**选择指引**：
- 学生说"看不懂"→ 优先 **看见 + 拆开**
- 学生说"分不清"→ 优先 **比较 + 解释**
- 学生说"做不出"→ 优先 **拆开 + 迁移**
- 学生说"不知道为什么"→ 优先 **解释 + 看见**

**示例**：
- 数学"为什么配方后能看出顶点"：**看见**图像 → **拆开**配方过程 → **迁移**到一般式
- 历史"为什么变法失败"：**看见**时间线 → **比较**不同力量 → **解释**因果链
- 语文"这句话为什么有力量"：**看见**原句 → **拆开**表达手法 → **迁移**到仿写
- 英语"what 和 which 怎么选"：**比较**两者语境 → **解释**规则 → **迁移**到新例句

---

### 4.4 教学组件深度落地规范（v7.7.5 重写）⛔ 必读

> **背景**：v7.7.4 之前的课件普遍存在"组件敷衍"问题——五镜头法、常见错误、诊断反馈被当成"方法介绍"贴在页面上而不是落成具体教学卡片；知识动画、置顶图片、互动时间轴沦为"文字+配音"的伪动态。本节用**敷衍版 vs 合格版 vs 优秀版**三档锚定每类组件的交付标准，并给出字段级 checklist，必须严格遵循。

#### 4.4.1 总体判定原则：三问
每个"动画 / 图 / 时间轴 / 方法 / 反馈"组件发布前必须自问：

1. **动态起源**：页面上哪个**结构化元素（SVG 形状 / DOM 节点 / Canvas 对象 / Leaflet 图层 / 数据行）**在动？如果只有文字变化 / 配音播放 / CSS fade-in，判定为敷衍。
2. **教学追问**：这个动态**让学生看见了哪个"看不见的过程"**？（抽象操作的几何意义、隐藏的因果链、被压缩的时间演进、被省略的中间步骤）如果无法 30 秒说清学生因此学到什么，判定为敷衍。
3. **教学追问写在哪里**：组件必须**在自身旁边**用一两句话或引导式问句显式说出"我们借此看见了什么/学到了什么"（**教学追问卡**），不能假设学生自己会想到。

> ⛔ **三问任意一个答不出，整个组件 Gate 不通过**。

#### 4.4.2 "知识动画"（Knowledge Animation）落地规范

**敷衍版（⛔ 禁用）**：一段视频/动图轮播 + 旁白 TTS；学生看到的只是"一屏文字配语音"。
**合格版（✅ 基线）**：SVG / Canvas 中**至少有 1 个结构化元素会因参数变化而形状/位置/颜色/连接关系改变**，学生可见到"变化 → 结果"。
**优秀版（🏆 目标）**：学生**可交互**触发变化（拖点、滑块、参数输入），并**同时看见两侧对比**（变化前后 / 公式推导的两端 / 现象与原理的双视图）。

**强制 6 要素**（缺任一 = 敷衍）：

| # | 要素 | 说明 | 反例 |
|:---|:---|:---|:---|
| 1 | **结构化元素** | 动的不是文字块，是 SVG 形状 / Canvas 图元 / DOM 节点 / Leaflet 图层 / 数据表行 | ❌ 只有一段 CSS fade-in 的 div |
| 2 | **参数驱动** | 变化来自**一个可追溯的参数**（k/b 值、温度、年份、反应进度），不是"timeline 播放" | ❌ 固定 3 秒一切换的时间线轮播 |
| 3 | **双表征** | 学生同屏能看到**两种表征的联动**（代数式 ↔ 图像 / 文字描述 ↔ 空间结构 / 数据 ↔ 图表） | ❌ 只有图没有对应的代数式/文字 |
| 4 | **交互可逆** | 学生能拖回、重放、对比初末态；≥1 个控件（slider / button / drag handle）。纯自动播放 = 不合格 | ❌ 只能点 ▶️ 从头看到尾 |
| 5 | **教学追问卡** | 动画旁必须有一张"💡 看一看"或"🤔 想一想"卡，给出 1-2 个观察引导问题 | ❌ 只有动画没有追问 |
| 6 | **回答验证** | 追问卡下必须有 ≥1 道对追问的互动题（选择/填空/拖拽），验证学生是否真的看到了 | ❌ 追问后没有任何互动验证 |

**学科示例**：

- 📐 数学·一次函数 k/b：slider 调 k → 直线斜率实时变 + 图像右侧公式 `y = kx+b` 中 k 同步高亮；追问"k>0 时，x 每增加 1，y 如何变？"后接填空题
- ⚗️ 化学·反应进度：拖动进度条 → SVG 反应物原子重新组合成生成物 + 底部能量图同步上升/下降；追问"反应在第几步释放能量？"接选择
- 🗺️ 历史·丝绸之路：点击"张骞" / "玄奘" / "马可波罗" → Leaflet 路线图层切换，底部时间轴同步高亮对应年代；追问"三条路线的起点有何共同点？"接拖拽归类

#### 4.4.3 "Hero 置顶图 / 知识结构信息图"落地规范

**敷衍版（⛔ 禁用）**：一张风景 / 卡通 / 抽象氛围图，和本课知识点毫无信息绑定。
**合格版（✅ 基线）**：信息图风格，中心是本课核心概念，有**≥3 个分支展示本课核心要点术语/公式**。
**优秀版（🏆 目标）**：同时呈现**本课知识在知识图谱中的位置**——前序、本课、后继，让学生第一眼知道"我站在哪、要学什么、会通到哪去"。

**强制 5 要素**：

| # | 要素 | 要求 |
|:---|:---|:---|
| 1 | **中心概念明示** | 图正中必须有本课 `node_id` 对应的概念名（中文术语） |
| 2 | **分支 ≥3** | 从中心发散出 ≥3 条本课子要点（不是泛词，要写具体术语/公式） |
| 3 | **视觉层级** | 不同分支有层级区分（颜色 / 形状 / 连线样式），学生一眼能分清"主次 / 并列 / 因果" |
| 4 | **文字可读** | 图上所有文字 ≥ 18px 可读；不可出现 Pillow 生图产生的 ⊠ .notdef 方框 |
| 5 | **信息绑定** | Hero 图上**所有文字术语都必须出现在课件正文**，且**正文至少 2 个术语回指 Hero 图位置**（"请看 Hero 图左上角的…"） |

⛔ 严禁把"课件封面卡通氛围图"当 Hero；⛔ 严禁把其他课件的 Hero 图复用；⛔ 严禁 Hero 图文字与课件正文术语不一致。

#### 4.4.4 "互动时间轴"（Interactive Timeline）落地规范

**敷衍版（⛔ 禁用）**：一排节点写着朝代/年份，点了之后弹出一段文字+配音，其它地方没反应。
**合格版（✅ 基线）**：点击时间轴节点 → 至少 **2 个联动区域**同步更新（文字详情 + 地图 / 图片 / 数据表 / 人物卡）。
**优秀版（🏆 目标）**：时间轴 + 地图 + 结构化数据（疆域 / 人口 / 战役数）**三联动**，学生可**对比拖拽两个时代横向比较**。

**强制 6 要素**：

| # | 要素 | 要求 |
|:---|:---|:---|
| 1 | **可点击节点** | 每个时间节点是真实 `<button>` / `<div onclick>`，不是静态图片标签 |
| 2 | **≥2 联动区** | 点击节点时：① 详情文本更新；② 地图/图片/数据 **至少一项**同步更新 |
| 3 | **active 视觉反馈** | 当前选中节点有明确 active 样式（颜色 / 尺寸 / 下划线） |
| 4 | **横向对比** | 必须提供 ≥1 种方式横向对比两个时代（对比模式开关 / 双列视图 / 差异高亮） |
| 5 | **结构化数据** | 每个时代必须含 ≥3 条可量化/可视化数据（疆域面积、人口、战役数、GDP、关键制度数），不能全是散文式描述 |
| 6 | **教学追问卡** | 时间轴下方 ≥1 张追问卡（"从 A 到 B，最大变化是什么？为什么？"）+ 互动题验证 |

**学科示例**：

- 🏛️ 历史·中国朝代演变：点秦→汉→唐，Leaflet 疆域同步切换 + 右侧 `<table>` 人口/疆域数据高亮 + 对比开关显示"汉唐疆域差"
- 🧬 生物·细胞分裂过程：点 G1→S→G2→M，SVG 细胞结构同步变化 + 右侧 DNA 量表数据切换 + 对比开关显示"分裂前后 DNA 倍数差"
- ⚙️ 物理·牛顿到爱因斯坦：点 1687→1905→1915，右侧公式/实验装置同步切换 + 关键参数（重力加速度/光速/引力常数）对比

#### 4.4.5 "五镜头法"落地规范（强制融入教学过程）

> ⛔ **严禁把"五镜头法介绍表格"直接粘贴在课件里**——这是方法说明，不是教学内容。**五镜头必须化为 3-5 张具体教学卡片/互动组件**，每张对应一个镜头，藏在学生"看讲练"的动线里。

**正确做法**：在讲解某个难点知识时，选 **2-3 个镜头**化为**独立的 ≥2 张卡片 + 可选互动**，结构如下：

```
【难点卡片头】为什么配方后能看出顶点？  (← 这是学生常问的"为什么")
  ↓
【镜头①看见】用 SVG 画出 y=x² 到 y=(x-3)²+2 的平移动画  ← 配 SVG 互动，非 TTS
  ↓
【镜头②拆开】把配方每一步标数字 + 高亮代数式中变化的项  ← 配高亮动画
  ↓
【镜头③迁移】给出 y=2x²-4x+5，学生自己配方并与答案对比  ← 配互动练习
```

**强制 4 要素**：

| # | 要素 | 要求 | 反例 |
|:---|:---|:---|:---|
| 1 | **挂载位置** | 放在对应"难点知识点"的讲解卡片之后、练习之前；**不单独立 section** | ❌ 单独开一个"五镜头法介绍"章节 |
| 2 | **镜头卡独立** | 每个镜头是**单独一张卡片**，标题明示镜头名（`【看见】...` / `【比较】...`） | ❌ 一段话里笼统说"我们用五镜头看看" |
| 3 | **每镜头配具体载体** | **看见→SVG/图表**；**拆开→高亮步骤/代码折叠**；**解释→因果图或示意动画**；**比较→对比表 / 双视图 / 差异高亮**；**迁移→互动练习** | ❌ 所有镜头只用文字描述 |
| 4 | **选择在页面中注明** | 难点卡头部用一行小字标注"本题采用 **看见+拆开+迁移** 三镜头" | ❌ 不说为什么选这 2-3 个 |

#### 4.4.6 "常见错误 + 诊断反馈"落地规范（强制融入练习）

> ⛔ **严禁把"常见错误列表"作为独立章节展示**（"学生在这个知识点的 5 个常见错误"类黑板式清单 = 敷衍）。**每道关键练习必须在本题反馈区直接嵌入"如果你选了 X，原因是…，正确思路是…"的具体诊断**。

**强制结构**：每道关键练习必须提供以下 3 段反馈（模板化到 `_errors.json`）：

```json
{
  "question_id": "m1q2",
  "correct_option": "B",
  "correct_feedback": {
    "echo": "✅ 正确！底角 = (180° - 顶角) ÷ 2 = 70°",
    "why_right": "你抓住了\"两底角相等\"+\"内角和 180°\"两个性质",
    "next": "试试顶角 100° 的情形，底角应该是多少？"
  },
  "wrong_feedbacks": {
    "A": {
      "trigger": "40°",
      "diagnosis": "你把顶角当成了底角——想想：对称轴两侧的角才是底角",
      "scaffold": "画一画：把顶角标 40° 放在上方，两个底角标在底部",
      "retry_hint": "底角 = (180° - 40°) ÷ 2，再算一次"
    },
    "C": {
      "trigger": "60°",
      "diagnosis": "你可能误以为等腰三角形 = 等边三角形",
      "scaffold": "等边三角形 3 角都是 60°，但等腰三角形只要求**两**角相等",
      "retry_hint": "顶角 ≠ 底角时，结果不会是 60°"
    },
    "D": {
      "trigger": "100°",
      "diagnosis": "你用了错误公式：底角 ≠ 180° - 顶角",
      "scaffold": "内角和 180° = 顶角 + 2 × 底角，所以底角 = (180° - 顶角) / 2",
      "retry_hint": "除以 2 这一步别漏了"
    }
  }
}
```

**强制 5 字段**：

| # | 字段 | 作用 | 反例 |
|:---|:---|:---|:---|
| 1 | `trigger` | 选项文字 / 学生可能的错误表述（让学生确认"是的我就是这么想的"） | ❌ 只说"错了" |
| 2 | `diagnosis` | **为什么**会这样错——指向认知误区本身，而非"你算错了" | ❌ "你算错了，请再仔细点" |
| 3 | `scaffold` | 给出一个**具体可操作的帮手**（画图 / 举反例 / 代数化 / 类比） | ❌ "建议再看一遍讲解" |
| 4 | `retry_hint` | 一句话提示学生**重新作答时的关键一步** | ❌ 只说"请再做一次" |
| 5 | `next`（正确时） | 进阶引导题 / 迁移提示 | ❌ 选对后直接静音 |

**强制产出**：

- 每个课件必须有 `_errors.json`（同目录），至少覆盖 **60% 关键练习题**
- `error-feedback` 卡片必须**从 `_errors.json` 读取渲染**，不能在 HTML 里写固定"你错了"
- Completeness Gate 必查：关键题的 wrong_feedbacks 是否含 diagnosis + scaffold + retry_hint 三字段

**学科侧重**：
- 数学/物理/化学：**错因诊断**（公式错、符号错、单位错、概念混淆）
- 语文/英语/历史：**质量反馈**（论据不充分、语境错位、因果颠倒、时间错位）

#### 4.4.7 Completeness Gate 深度检查项（新增）

v7.7.5 起，Completeness Gate 必须加以下检查：

| 检查项 | 标准 | 工具 |
|:---|:---|:---|
| **知识动画 6 要素** | 每个"动画/互动演示"section 都满足 6 要素 | 人工 + `validate-courseware.py --deep` |
| **Hero 图信息绑定** | Hero 文字术语全部出现在正文、正文回指 Hero ≥2 处 | grep 正文 vs OCR Hero（可选） |
| **互动时间轴 ≥2 联动** | 时间轴 section 含 ≥2 个同步更新的联动区 | 人工 |
| **五镜头法具体化** | 难点处 3-5 张独立镜头卡 + 每镜头有具体载体 | 人工 |
| **错误诊断完整度** | `_errors.json` 覆盖 ≥60% 关键题 + 每题 5 字段齐 | `validate-courseware.py --errors` |

**现有课件改造工具**（维护者使用）：

- `python3 scripts/audit-shallow-components.py <course-path>` — 扫描出哪些 section 是"文字+配音"敷衍组件
- `python3 scripts/gen-error-diagnosis.py <course-path>` — 基于 LLM 根据题目生成 `_errors.json` 初稿，人工校对后入库

---

## 十三、57 条硬规则（违反任何一条 = Completeness Gate 不通过）

> 📋 完整的 57 条硬规则列表已拆分到独立文档，详见 [`RULES.md`](./RULES.md)。
>
> Completeness Gate 阶段必须逐条检查，任何一条违反即判定不通过。
> v6.2 新增 #52~#56 严谨度铁律（来自 Section 0.4），是对所有"执行/验证/修复"环节的硬性约束。
> v6.3 新增 #57 Hero 图基线（来自 Section 0.5），所有课件必须配主题专属 hero 封面图。

## 十四、理论基础

TeachAny 的教学设计框架综合了以下经同行评审的学习科学研究：

| 理论 | 原始文献 | 在 TeachAny 中的应用 |
|:-----|:---------|:--------------------|
| ABT 叙事结构 | Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press. | 每个模块的开篇叙事 |
| 认知负荷理论 | Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285. | 卡片字数控制、信息分块 |
| 多媒体学习原则 | Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. | 版面布局、图文配合规范 |
| ConcepTest / 同伴教学法 | Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall. | 概念检测题设计 |
| Bloom 认知分类 | Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. | 练习题层级设计 |
| 脚手架理论 | Vygotsky, L.S. (1978). *Mind in Society*; Wood, D., Bruner, J.S., & Ross, G. (1976). | 三级递进难度策略、学习记录单支架 |
| 逆向设计 | Wiggins, G. & McTighe, J. (2005). *Understanding by Design*. | 目标反推式课程结构 |
| 循证培训 | Clark, R.C. (2019). *Evidence-Based Training Methods*. | 内容审计与效果评估 |
| 问题/项目式学习 | Barrows, H.S. (1986). *A Taxonomy of Problem-Based Learning Methods*; Krajcik, J.S. & Shin, N. (2014). | 四种驱动模式、项目分解、问题链递进 |
| 情境认知理论 | Brown, J.S., Collins, A., & Duguid, P. (1989). Situated Cognition and the Culture of Learning. | 情境角色设计、真实问题驱动 |
| 表现性评价 | Stiggins, R.J. (2005). *Student-Involved Assessment for Learning*. | 过程性评价量规、多元评价体系 |

**TeachAny 原创贡献**：五镜头法（Five-Lens Method）、学科适配矩阵（Subject Adaptation Matrix）、6 问预设计框架（6-Question Pre-Design）、课型分类体系、驱动模式决策树（Driving Mode Decision Tree）、AI 多模态互动区规范（AI Media Zone Spec）、Generation Gate / Completeness Gate 双门审查机制、四级知识降级链（Script→JSON→Web→Model）均为本项目独立创作。

---

## 十八、地理/历史课件地图资源（无需 API）

> 📖 完整的地图资源规范（时空资产目录、Leaflet/ECharts 模板、XYZ 瓦片方案、3D 地形集成等）已拆分到独立文档，详见 [`historical-maps.md`](./historical-maps.md)。
>
> 制作历史/地理课件时必须查阅该文档。

---
