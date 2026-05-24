<p align="center">
  <img src="docs/assets/logo.svg" width="120" alt="TeachAny Logo">
</p>

<h1 align="center">🎓 TeachAny（教我学）</h1>

<p align="center">
  <strong>把任意知识点变成一节能讲、能玩、能练的互动课。</strong><br>
  中文为主、英文辅助，面向中国教师、家长和学生；也支持国际课程与英文学习场景。<br>
  <em>Turn any K-12 topic into an interactive lesson with explanation, practice, feedback, and learning paths.</em>
</p>

<p align="center">
  <a href="#-快速开始--quick-start"><img src="https://img.shields.io/badge/快速开始-30秒-brightgreen?style=flat-square" alt="快速开始"></a>
  <a href="#-在线课件库--live-gallery"><img src="https://img.shields.io/badge/在线课件库-420+课件-blue?style=flat-square" alt="在线课件库"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/授权-AGPL--3.0%20%2B%20商业授权-blue?style=flat-square" alt="双授权"></a>
  <a href="docs/TRADEMARK.md"><img src="https://img.shields.io/badge/TeachAny-商标保护-orange?style=flat-square" alt="商标政策"></a>
  <a href="README_CN.md"><img src="https://img.shields.io/badge/中文文档-点击查看-red?style=flat-square" alt="中文 README"></a>
</p>

<p align="center">
  <a href="#-在线课件库--live-gallery">在线课件库 Gallery</a> ·
  <a href="#-快速开始--quick-start">快速开始 Quick Start</a> ·
  <a href="docs/getting-started.md">安装指南 Getting Started</a> ·
  <a href="docs/methodology.md">方法论 Methodology</a> ·
  <a href="docs/TRADEMARK.md">商标政策 Trademark</a> ·
  <a href="CONTRIBUTING.md">参与共建 Contributing</a>
</p>

> ⚖️ **商标说明 · Trademark Notice**：**TeachAny™** 和 **教我学™** 是项目作者持续公开使用的项目标识，自 2026-04-07 起使用。标识尚未注册，但作者保留在先使用权益。Fork 或二次发行请更名；完整规则见 [TRADEMARK.md](docs/TRADEMARK.md)。

---

## 🚀 快速开始 · Quick Start

### ⚡ 推荐方式：稀疏克隆（标准预设） · Sparse Clone

标准预设包含 TeachAny Skill 核心、知识树、课标知识点数据，以及地理/历史地图资产（工作目录约 110 MB）。适合教师、家长和开发者快速开始：

```bash
git clone --filter=blob:none --sparse https://github.com/weponusa/teachany.git
cd teachany
git sparse-checkout set --from-file .sparse-checkout-presets/standard.txt

# 将 TeachAny Skill 连接到你的 AI 工具
ln -sfn "$PWD/skill" ~/.codebuddy/skills/teachany   # CodeBuddy
ln -sfn "$PWD/skill" ~/.agents/skills/teachany      # Claude Code / Cursor / Codex CLI
```

> 💡 **为什么推荐稀疏克隆？** 完整仓库约 1.6 GB，包含 420+ 社区课件及音视频资产。标准预设已经足够用于制作课件，不需要下载全部社区课件。

### 备选方式：完整克隆（适合贡献者） · Full Clone

```bash
git clone https://github.com/weponusa/teachany.git
cd teachany
ln -sfn "$PWD/skill" ~/.codebuddy/skills/teachany
```

> 🌐 **不克隆也能用**：所有 420+ 课件都已发布到 GitHub Pages，可直接访问 **https://weponusa.github.io/teachany/** 在线浏览。

> 🧠 **AI 工具用户**：见 [skill/README.md](./skill/README.md)。TeachAny Skill 采用模块化设计，`skill/SKILL.md` 是入口，复杂章节会按需从 `skill/references/`、`skill/guides/`、`skill/phases/` 加载。

### 国内用户 🇨🇳 · Gitee Mirror
**国内访问 GitHub 不稳定时，可使用 Gitee 镜像：**
```bash
git clone https://gitee.com/weponusa/teachany.git
```

**详细安装指南**：
- 🌐 国际用户：See [Getting Started](docs/getting-started.md)
- 🇨🇳 国内用户：查看 [一键安装指南](INSTALL_CN_SIMPLE.md)（推荐）

> **包含内容 · What's included**：覆盖数学、物理、化学、生物、历史、地理、语文、英语、科学、信息技术等 14+ 学科；420+ 互动课件；支持中国课标、IB、Cambridge、AP 等多套课程体系。

---

## 🤔 我们要解决什么问题 · The Problem

现在很多 AI 生成的教学内容，看起来往往是这样：

```
📝 Here are 5 key points about quadratic functions...
📋 Quiz: What is the vertex of y = x² + 2x + 1?
   A) (1, 0)   B) (-1, 0)   C) (0, 1)   D) (-1, 1)
```

**问题不在“内容不够多”，而在“没有教学设计”。** 学生看到的是一堵文字墙，最后再配几道选择题；缺少问题情境、认知脚手架、错误诊断和完整学习闭环。

## ✨ TeachAny 怎么做 · The TeachAny Approach

TeachAny 不是提示词模板，而是一套完整的 **AI 课件教学设计系统**。它把 6+ 学习科学理论嵌入到课件结构里，让 AI 生成的不只是“内容”，而是一节真正可学、可练、可反馈的课：

| 维度 Dimension | 普通 AI 内容 Generic AI | TeachAny |
|:--|:--|:--|
| **课程结构 Lesson Structure** | 随机列知识点 | ABT 叙事：已知 → 冲突 → 为什么要学 |
| **练习反馈 Assessment** | “对了/错了” | 每个错误选项都有具体诊断 |
| **难度设计 Difficulty** | 一刀切 | 三层脚手架：完整示范 → 部分提示 → 独立完成 |
| **学科适配 Subject Adaptation** | 所有学科套同一模板 | 按学科定制互动方式、讲解逻辑和评价策略 |
| **理论基础 Theoretical Foundation** | 基本没有 | 6+ 学习科学理论内置到课件结构 |
| **互动方式 Interaction** | 点下一页、读更多 | Canvas 仿真、拖拽、概念测验、实时反馈 |
| **PBL 拆解 PBL Decomposition** | 给一个项目建议就结束 | 自动拆成知识网络，映射课标节点并生成学习路径 |

### 🧠 基于学习科学 · Built on Learning Science

<table>
<tr>
<td width="33%">

**ABT 叙事结构 · Narrative**
每个模块都从“已知事实”开始，制造认知冲突，再说明为什么这节课值得学。

</td>
<td width="33%">

**布鲁姆目标分类 · Bloom**
练习覆盖记忆、理解、应用、分析、评价、创造等不同认知层级。

</td>
<td width="33%">

**概念测验 · ConcepTest**
用关键问题暴露误解，既能自测，也适合课堂讨论和同伴互评。

</td>
</tr>
<tr>
<td>

**认知负荷理论 · Cognitive Load**
控制每张卡片的信息量，一个模块聚焦一个核心问题，新概念立刻配例子。

</td>
<td>

**梅耶多媒体学习原则 · Mayer**
把邻近、提示、分段、预训练等原则落实到页面布局和讲解节奏里。

</td>
<td>

**脚手架策略 · Scaffolding**
从模板填空，到只给提示，再到独立完成，逐步撤掉帮助。

</td>
</tr>
</table>

---

## 🖼️ 在线课件库 · Live Gallery

所有课件都可以直接在线打开体验：**[TeachAny 课件库](https://weponusa.github.io/teachany/)**。

官方精选课件 · Featured official courseware:

| 课件 Course | 学科 Subject | 年级 Grade | 亮点 Highlights |
|:--|:--|:--|:--|
| [📐 二次函数 · Quadratic Functions](community/math-quadratic-function/) | 数学 Math | 九年级 Grade 9 | Canvas 作图、顶点拖拽、逐步推导 |
| [📏 一次函数 · Linear Functions](community/math-linear-function/) | 数学 Math | 八年级 Grade 8 | 斜率/截距滑杆、实时函数图像 |
| [📚 全等三角形 · Congruent Triangles](community/math-congruent-triangles/) | 数学 Math | 八年级 Grade 8 | SVG 几何、定理比较、证明脚手架 |
| [🧬 光合作用 · Photosynthesis](community/bio-photosynthesis/) | 生物 Biology | 七年级 Grade 7 | Canvas 动画、拖拽方程、TTS 讲解 |
| [⚡ 欧姆定律 · Ohm's Law](community/phy-ohms-law/) | 物理 Physics | 九年级 Grade 9 | 虚拟电路、V-I 图像、公式推导 |
| [🌍 全球季风 · Global Monsoon](community/geo-monsoon/) | 地理 Geography | 高一 Grade 10 | Leaflet 地图、风带可视化 |
| [🔬 生活中的化学 · Chem in Daily Life](community/chem-daily-life/) | 化学 Chemistry | 九年级 Grade 9 | PhET 仿真、Canvas 动画、资源链接 |
| [📖 古典诗词 · Classical Poetry](community/course-classical-poetry/) | 语文 Chinese | 七年级 Grade 7 | 精读批注、意象分析、写作脚手架 |
| [🏛️ 工业革命 · Industrial Revolution](community/hist-m-industrial-revolution/) | 历史 History | 九年级 Grade 9 | 史料分析、时间线、多视角比较 |

> **420+ 课件**，覆盖 14+ 学科，包含官方示范课与社区共创课件。课件以 HTML 形式发布，浏览器打开即可学习，也方便教师二次改造。

---

## 🚀 使用方式 · How to Use

### 方式一：作为 AI Skill 使用（推荐） · AI Skill

TeachAny 可以作为 AI 编程助手的 Skill 使用（**推荐 [WorkBuddy](https://workbuddy.tencent.com/)**，也兼容 CodeBuddy、Cursor、Claude Code 等）：

1. 按上文稀疏克隆安装 TeachAny，并把 `skill/` 软链接到你的 AI 工具 Skill 目录。
2. 开始对话，例如：
   ```
   为“光合作用”（七年级生物）做一个互动课件。
   Create an interactive courseware for "Photosynthesis" (Grade 7 Biology).
   ```
3. AI 会按 TeachAny 的教学设计流程，生成完整的互动 HTML 课件。

> **说明**：Skill 安装只需要 `skill/` + `data/`。社区课件已在线发布在 [TeachAny 课件库](https://weponusa.github.io/teachany/)，不需要全部打包进 Skill。

> **说明**：从 v6.0 起，TeachAny 基础 Skill 已内置验证、打包和社区分享流程，不再需要单独的 admin skill 或 `GITHUB_TOKEN`。

### 方式二：浏览并改造 · Browse and Remix

1. 打开 [在线课件库](https://weponusa.github.io/teachany/)
2. 选择一个接近你教学目标的课件
3. 查看源码或克隆仓库，改成自己的课堂版本

---

## 📖 它如何工作 · How It Works

TeachAny 采用结构化的 4 阶段流程，从教学目标出发，逐步生成可交互、可评估、可发布的课件：

```
阶段 0：定义目标        阶段 1：教学设计        阶段 2：学科适配        阶段 3：构建发布
Phase 0: Define      Phase 1: Design      Phase 2: Adapt      Phase 3: Build
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│ 回答 6 个问题 │    │ ABT 叙事结构       │    │ 学科专属框架       │    │ HTML/CSS/JS    │
│ 学生/目标/场景│───▶│ 内容审查          │───▶│ 五镜头方法         │───▶│ 互动课件        │
│ 难点/验证方式 │    │ 先备知识链        │    │ 脚手架设计        │    │ 练习与反馈      │
└─────────────┘    └──────────────────┘    └──────────────────┘    └────────────────┘
```

### 课前 6 问 · The 6 Pre-Design Questions

写代码之前，TeachAny 会先把教学问题问清楚：

| # | 问题 Question | 作用 Purpose |
|:-:|:--|:--|
| 1 | **学生是谁？ Who are the students?** | 决定语言、难度和例子 |
| 2 | **需要哪些先备知识？ What prerequisites?** | 判断是否需要前测和补缺 |
| 3 | **学完要会做什么？ What should they do?** | 把“知道”变成可观察任务 |
| 4 | **真实情境是什么？ What scenario?** | 提供学习动机和应用场景 |
| 5 | **学生容易卡在哪里？ Where do they get stuck?** | 决定错误诊断和提示设计 |
| 6 | **如何验证学会了？ How to verify learning?** | 决定练习、反馈和评价方式 |

### 学科专属框架 · Subject-Specific Frameworks

TeachAny 不用一套模板打天下。不同学科有不同的讲解方式、互动形态和评价方式：

| 学科 Subject | 教学思路 Teaching Approach | 互动方式 Interaction | 评价方式 Assessment |
|:--|:--|:--|:--|
| **Math** | Visual intuition + algebraic reasoning + generalization | Graphing, dragging, step-by-step derivation | Standard + explanation questions |
| **Physics** | Observation + modeling + quantitative analysis | Parameter sliders, experiment prediction | Prediction + calculation + explanation |
| **Biology** | Structure → process → function | Labeling, sorting, flowchart puzzles | Diagram + process explanation |
| **Geography** | Spatial distribution → cause → regional comparison | Map interaction, chart reading, causal chains | Material analysis + comparison |
| **History** | Timeline → causation → evidence → multiple perspectives | Sorting, source comparison, stance analysis | Source-based + essay questions |
| **Chinese** | Close reading → expression techniques → theme transfer | Annotation, rewriting, imitation writing | Annotation + writing tasks + rubric |
| **English** | Input → scaffolded output → contextual application | Dialogue cards, fill-in, role-play | Integrated skills assessment |
| **Chemistry** | Macro phenomenon → micro explanation → symbolic representation | Experiment flow, equation balancing | Experiment explanation + structured response |
| **IT** | Task-driven + step-by-step demo + debugging | Click operations, flowcharts, code execution | Task completion + process check |

### 五镜头方法 · The Five-Lens Method

遇到难概念时，从下面 5 个角度中选 2-3 个来设计讲解：

```
👁️ 看见它 See It      → 观察现象、例子和数据
🔧 拆开它 Break It    → 拆结构、步骤和组成部分
💡 解释它 Explain It  → 讲清原因、机制和规则
⚖️ 比较它 Compare It  → 和相似/相反/错误例子对照
🎯 迁移它 Transfer It → 换个情境应用，验证是否真懂
```

### 🧩 PBL 项目拆解 · Project Decomposition

TeachAny 可以把任意 PBL 项目目标，自动拆成系统化的知识网络：

- 输入：一个项目描述，例如“设计智能温室”“制作天气 App”
- 输出：映射到课标的完整学习路径，支持中国课标、AP、Cambridge、IB、US CCSS 等体系
- 理念：**PBL 不只是学科学习的补充，而可以成为教学主体**，用真实项目反向组织知识学习

这样教师可以从真实项目出发，倒推学生需要补哪些知识节点、按什么顺序学、涉及哪些学科。

---

## 🏗️ 项目结构 · Project Structure

```
teachany/
├── README.md                    # English README (this file)
├── README_CN.md                 # Chinese README
├── LICENSE                      # Dual License (AGPL-3.0 + Commercial)
├── CONTRIBUTING.md              # Contribution guide (bilingual)
├── CHANGELOG.md                 # Version history
├── index.html                   # Gallery homepage (dynamically loads courseware)
├── path.html                    # Learning Path system (D3.js knowledge graph)
├── tree.html                    # Knowledge tree browser
├── courseware-registry.json     # 📋 Courseware registry (metadata index)
│
├── skill/                       # 🧠 TeachAny Skill (AI Prompt System)
│   ├── SKILL.md                 # Entry point (157 lines, loads modules on demand)
│   ├── README.md                # Skill installation guide
│   ├── RULES.md                 # Quality rules and constraints
│   ├── INSTALL.md               # Detailed install instructions
│   ├── guides/                  # Subject-specific guides
│   ├── phases/                  # 4-phase workflow definitions
│   ├── references/              # Heavy reference chapters (loaded on demand)
│   ├── scripts/                 # Skill-internal scripts (validate, pack, TTS, etc.)
│   ├── templates/               # Courseware starter templates
│   └── tech/                    # Technical implementation specs
│
├── data/                        # 📚 Knowledge Layer (~53 MB)
│   ├── trees/                   # Knowledge trees (5 curriculum systems × 48 subjects = 98 JSON files)
│   │   ├── cn/                  # 中国课标 (elementary / middle / high)
│   │   ├── ap/                  # AP (US Advanced Placement)
│   │   ├── cambridge/           # Cambridge IGCSE / A-Level
│   │   ├── ib/                  # IB (MYP / DP)
│   │   └── us/                  # US CCSS + NGSS
│   ├── kp/                      # 2,399 knowledge-point detail files (curriculum_points, difficulty, resources)
│   ├── geography/               # Geography map assets (world/China/terrain)
│   ├── history/                 # Historical dynasty map overlays
│   ├── curricula.json           # Curriculum system registry (v1.4)
│   ├── nodes-metadata.json      # Node metadata index
│   ├── node-index.json          # Fast node lookup index
│   └── source-mapping.json      # KP ↔ textbook page mapping
│
├── community/                   # 🌐 Community courseware (412 courses, ~238 MB)
│   └── <course-id>/            # Each course: index.html + manifest.json [+ audio/video]
│
├── scripts/                     # 🔧 Build & maintenance scripts
│   ├── validate-courseware.cjs  # 18-point quality validator
│   ├── validate-courseware.py   # Python validator (media checks)
│   ├── pack-courseware.cjs      # Courseware packaging
│   ├── publish-courseware.cjs   # Publish to registry
│   ├── batch-validate.cjs      # Batch validation runner
│   ├── knowledge_layer.py      # Knowledge layer audit CLI
│   ├── learning-path.js        # Path system runtime
│   ├── pbl-path.js             # PBL decomposition runtime
│   └── ...                     # 130+ utility scripts
│
├── references/                  # 📖 Modular documentation chapters
│   ├── media-pipeline.md
│   ├── packaging-distribution.md
│   ├── technical-implementation.md
│   └── workflow-development.md
│
├── docs/
│   ├── methodology.md           # Deep dive into learning theories
│   ├── getting-started.md       # Step-by-step guide
│   ├── design-system.md         # Visual design specification
│   └── subject-guides/          # Per-subject usage guides
│
├── assets/                      # Logo, icons, shared assets
├── styles/                      # Shared CSS
├── gallery/                     # Gallery sub-page
├── pages/                       # Cloudflare Pages deployment config
│
├── .sparse-checkout-presets/    # Sparse checkout presets (standard / full)
│
└── .github/
    ├── ISSUE_TEMPLATE/
    └── workflows/
```

---

## 🎨 设计系统 · Design System

All TeachAny courseware shares a consistent visual language:

```css
/* Core color tokens */
--bg: #0f172a;           /* Primary background */
--card: rgba(30,41,59,0.7);  /* Glassmorphism cards */
--primary: #3b82f6;      /* Blue: main accent */
--secondary: #8b5cf6;    /* Purple: secondary accent */
--accent: #f59e0b;       /* Yellow: highlights */
--success: #10b981;      /* Green: correct */
--danger: #ef4444;       /* Red: incorrect */
```

- **Typography**: 16px body, 1.7-1.8 line-height
- **Cards**: Semi-transparent glassmorphism (`backdrop-filter: blur(10px)`), 16px border-radius
- **Grid**: `repeat(auto-fit, minmax(300px, 1fr))` responsive grid
- **Formulas**: Times New Roman, accent color

---

## 📚 文档入口 · Documentation

| Document | Description |
|:---------|:------------|
| [Getting Started](docs/getting-started.md) | Create your first course in 5 minutes |
| [Methodology](docs/methodology.md) | Deep dive into all 6+ learning science theories |
| [Design System](docs/design-system.md) | Visual specification and CSS variables |
| [Subject Guides](docs/subject-guides/) | Per-subject best practices |

---

## 🤝 参与共建 · Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🎓 **Create a new course** — Pick any K-12 topic and build an interactive courseware
- 📚 **Expand the Knowledge Layer** — Add knowledge graphs, error databases, and exercise banks for any subject (see `data/schema.md`)
- 🌐 **Translate** — Help translate the Skill or documentation to your language
- 🐛 **Report issues** — Found a pedagogical error or UI bug? Let us know
- 📝 **Improve docs** — Better examples, clearer explanations, more subject guides
- 🎨 **Design components** — Reusable quiz engines, interactive widgets, visualizations

---

## 💡 原创贡献 · Original Contributions

The following frameworks and methods are **original creations** of the TeachAny project:

| Contribution | Description |
|:-------------|:------------|
| **PBL Project Decomposition Engine** | Automatically breaks down any PBL project goal into a systematic knowledge network mapped to curriculum standards (CN / AP / Cambridge / IB / CCSS), making PBL the teaching *subject* rather than a supplement to disciplinary learning |
| **Five-Lens Method** | A 5-perspective approach (See It → Break It → Explain It → Compare It → Transfer It) for teaching difficult concepts |
| **Subject Adaptation Matrix** | 9 subject-specific teaching frameworks with tailored interaction types and assessment styles |
| **6-Question Pre-Design Framework** | A structured pre-design checklist that ensures pedagogical completeness before any code is written |
| **Lesson Type Classification** | Systematic categorization (new concept / review / practice / thematic / lab) with corresponding structural templates |
| **Phase 4 Review Checklist** | A quality assurance protocol covering pedagogy, interaction, accessibility, and visual design |
| **Visual Design System** | A cohesive dark-theme glassmorphism design language optimized for educational content |

> The TeachAny Skill prompt and all associated documentation are released under a **dual license**: AGPL-3.0 for non-commercial use (personal, academic, non-profit education), and a Commercial License for commercial deployment. See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

---

## 📄 学术参考 · Academic References

TeachAny's methodology is grounded in peer-reviewed learning science:

| Theory | Original Work |
|:-------|:-------------|
| ABT Narrative | Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press. |
| Cognitive Load Theory | Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285. |
| Multimedia Learning | Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. |
| ConcepTest / Peer Instruction | Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall. |
| Bloom's Taxonomy | Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. |
| Scaffolding | Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100. |

---

## 📜 授权与商标 · License & Trademark

**Dual License**:
- 🟢 **Non-commercial use** (personal, public schools, academic research, open-source forks): free under [AGPL-3.0](LICENSE) — see [license.html](license.html) for an illustrated summary.
- 💰 **Commercial use** (SaaS, paid courses, enterprise training): requires a commercial license — see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md) or [commercial-license.html](commercial-license.html).

**Trademark**: **TeachAny™** and **教我学™** are unregistered but actively-asserted trademarks under prior-use rights. Forks must rename; see [docs/TRADEMARK.md](docs/TRADEMARK.md) for the full policy.

Contact: **weponusa@gmail.com** (prefix subject with `[TeachAny Commercial]` or `[TeachAny Trademark]`).

---

<p align="center">
  <strong>Built with ❤️ for teachers and students everywhere.</strong><br>
  <sub>If TeachAny helps you create better learning experiences, give us a ⭐</sub>
</p>
