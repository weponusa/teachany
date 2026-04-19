<p align="center">
  <img src="docs/assets/logo.svg" width="120" alt="TeachAny Logo">
</p>

<h1 align="center">🎓 TeachAny（教我学）</h1>

<p align="center">
  <strong>每个学校、每个教师、每个家长，都能零成本、零门槛定制属于每个孩子的可汗学院。</strong><br>
  用 AI 将任何 K-12 知识点变成有互动、有反馈、有教学设计的学习体验——只需几分钟。
</p>

<p align="center">
  <a href="#-快速开始"><img src="https://img.shields.io/badge/快速开始-30秒-brightgreen?style=flat-square" alt="快速开始"></a>
  <a href="#-在线画廊"><img src="https://img.shields.io/badge/在线画廊-131门课-blue?style=flat-square" alt="画廊"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/许可证-MIT-yellow?style=flat-square" alt="MIT License"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/English-README-red?style=flat-square" alt="English README"></a>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="#-在线画廊">在线画廊</a> ·
  <a href="docs/getting-started.md">快速上手</a> ·
  <a href="docs/methodology.md">方法论</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a>
</p>

---

## 🤔 问题是什么

大多数 AI 生成的教学内容长这样：

```
📝 关于二次函数的 5 个要点……
📋 测验：y = x² + 2x + 1 的顶点是什么？
   A) (1, 0)   B) (-1, 0)   C) (0, 1)   D) (-1, 1)
```

**扁平、无生命、没有教学设计。** 学生看到一堆文字，末尾附上一道选择题。没有学习动机，没有脚手架，没有错因诊断，没有学习闭环。

## ✨ TeachAny 的做法

TeachAny 不是一个 prompt 模板——它是一个**完整的教学设计系统**，将 6+ 套学习科学理论嵌入 AI 生成的课件中：

| 维度 | 普通 AI | TeachAny |
|:-----|:--------|:---------|
| **课程结构** | 随机堆要点 | ABT 叙事结构（And-But-Therefore） |
| **评估方式** | "对 ✓ / 错 ✗" | 逐选项错因诊断（"你把 h 的符号搞反了"） |
| **难度分级** | 一刀切 | 三级脚手架（全支架→半支架→无支架） |
| **学科适配** | 所有学科用同一模板 | 9 个学科各有专属框架 |
| **理论基础** | 无 | 6+ 套学习科学理论 |
| **互动形式** | 点下一步→继续看 | Canvas 仿真、拖拽排序、概念检测 |

### 🧠 基于学习科学

<table>
<tr>
<td width="33%">

**ABT 叙事结构**
每个模块以 *And*（你已知的）→ *But*（矛盾点）→ *Therefore*（为什么要学）开篇。

</td>
<td width="33%">

**Bloom 认知分类**
练习覆盖全部 6 个认知层级：记忆→理解→应用→分析→评价→创造。

</td>
<td width="33%">

**ConcepTest（Mazur 同伴教学法）**
概念检测题设计在 30-70% 正确率区间——最适合激发讨论的甜蜜点。

</td>
</tr>
<tr>
<td>

**认知负荷理论（Sweller）**
每张卡片约 75 字。每个模块只承载 1 个核心问题。新概念→立即配例子。

</td>
<td>

**Mayer 多媒体学习原则**
临近性、信号、分割、预训练——应用于每一个版面决策。

</td>
<td>

**脚手架策略**
Level 1：给模板填空 → Level 2：只给提示 → Level 3：独立完成。

</td>
</tr>
</table>

---

## 🖼️ 在线画廊

点击任意课件即可体验：

| 课件 | 学科 | 年级 | 互动特色 | 代码量 |
|:-----|:-----|:-----|:---------|:-------|
| [📐 二次函数](examples/math-quadratic-function/) | 数学 | 九年级 | Canvas 作图、顶点拖拽、分步配方 | 1,300+ 行 |
| [📏 一次函数与正比例函数](examples/math-linear-function/) | 数学 | 八年级 | 斜率/截距滑块、实时图像 | 1,100+ 行 |
| [📚 全等三角形](examples/math-congruent-triangles/) | 数学 | 八年级 | SVG 几何配图、判定定理对比、证明脚手架 | 1,200+ 行 |
| [🧬 减数分裂与受精过程](examples/bio-meiosis/) | 生物 | 高一 | 细胞分裂模拟、染色体拖拽 | 1,400+ 行 |
| [🌍 全球季风系统](examples/geo-monsoon/) | 地理 | 高一 | Leaflet 地图、风向可视化、区域对比 | 1,200+ 行 |
| [💧 液体压强与浮力](examples/phy-pressure-buoyancy/) | 物理 | 八年级 | 实验模拟、参数调节 | 1,000+ 行 |
| [🧬 光合作用](examples/bio-photosynthesis/) | 生物 | 七年级 | Canvas 动画、拖拽排方程式、叶绿体标注、AI 配音 | 1,950+ 行 |
| [⚡ 欧姆定律](examples/phy-ohms-law/) | 物理 | 九年级 | 虚拟电路实验、V-I 作图、公式推导、AI 配音 | 2,630+ 行 |
| [🔤 复韵母拼读](examples/chn-compound-vowel/) | 语文 | 一年级 | 拼音音频、口型提示、分步跟读训练 | 800+ 行 |

> 所有课件均为**单文件 HTML**——无需构建，无需依赖，打开浏览器即可使用。

---

## 🚀 快速开始

### 方式一：作为 AI Skill 使用（推荐）

TeachAny 可以作为 **Skill** 嵌入 AI 编程助手（CodeBuddy、Cursor、Windsurf、Claude 等）：

1. 将 `skill/SKILL_CN.md`（中文）或 `skill/SKILL.md`（英文）复制到你的 AI 助手的 skill 目录
2. 将 `data/` 目录一同复制——其中包含 9 学科的知识树、练习题库、易错点、概念图谱等知识附件
3. 开始对话：
   ```
   帮我做一个"光合作用"（初一生物）的互动教学课件
   ```
3. AI 将遵循 TeachAny 的方法论，生成一个完整的互动 HTML 课件

> **说明**：自 v6.0 起，TeachAny 已简化发布流程，质检、打包、社区分享等能力全部内置在基础 Skill 中，不再需要单独的管理员版 Skill 和 `GITHUB_TOKEN`。

### 方式二：从模板开始

```bash
cp -r examples/_template my-new-course
# 编辑 my-new-course/index.html，填入你的内容
open my-new-course/index.html
```

### 方式三：浏览和改造

1. 克隆本仓库
2. 在浏览器中打开任意 `examples/*/index.html`
3. 修改内容，制作你自己的课件

---

## 📖 工作原理

TeachAny 遵循结构化的 4 阶段工作流：

```
Phase 0: 明确目标     Phase 1: 设计骨架      Phase 2: 学科适配      Phase 3: 开发实现
┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 回答 6 问   │    │ ABT 叙事      │    │ 学科专属框架   │    │ HTML/CSS/JS  │
│ （谁、什么、 │───▶│ 内容审计      │───▶│ 五镜头法      │───▶│ 互动课件      │
│  为什么、   │    │ 前置知识链    │    │ 脚手架策略    │    │ + 评估系统    │
│  怎么判断） │    │              │    │              │    │              │
└───────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 开发前必答的 6 个问题

| # | 问题 | 目的 |
|:-:|:-----|:-----|
| 1 | **学生是谁？** 年级、基础、常见状态 | 决定难度和语言 |
| 2 | **前置知识是什么？** | 决定是否需要铺垫或前测 |
| 3 | **学完要能做什么？** | 把"知道"变成可观察的任务 |
| 4 | **真实场景是什么？** | 提供学习动机 |
| 5 | **最容易卡在哪？** | 驱动错因诊断设计 |
| 6 | **怎么判断学会了？** | 确定评估策略 |

### 五镜头法

遇到难点概念，从 5 个镜头中选 2-3 个组合：

```
👁️ 看见它    → 观察现象、例子、数据
🔧 拆开它    → 分解结构、步骤、组成
💡 解释它    → 说明因果、机制、规则
⚖️ 比较它    → 与相近/相反/错误示例对比
🎯 迁移它    → 放到新情境，验证理解
```

---

## 🏗️ 项目结构

```
teachany/
├── README.md                    # 英文 README
├── README_CN.md                 # 中文 README（本文件）
├── LICENSE                      # MIT 许可证
├── CONTRIBUTING.md              # 贡献指南（中英双语）
├── CHANGELOG.md                 # 版本记录
├── index.html                   # Gallery 首页（动态加载课件列表）
├── courseware-registry.json     # 📋 课件注册表（所有课件的元数据索引）
│
├── skill/
│   ├── SKILL.md                 # 英文版 Skill 定义
│   └── SKILL_CN.md              # 中文版 Skill 定义
│
├── data/                        # 📚 知识层（Knowledge Layer）
│   ├── README.md                # 知识层架构说明
│   ├── schema.md                # 数据格式规范
│   ├── chinese/                 # 语文
│   │   └── pinyin/              # 拼音（含知识图谱、易错点、题库）
│   └── math/                    # 数学
│       └── functions/           # 函数（含知识图谱、易错点、题库）
│
├── docs/
│   ├── methodology.md           # 方法论深度解读
│   ├── getting-started.md       # 快速上手指南
│   ├── design-system.md         # 视觉设计规范
│   └── subject-guides/          # 各学科使用指南
│
├── examples/                    # 🌐 官方示范课件（仅网站展示，不随 skill 分发）
│   ├── math-quadratic-function/ # 二次函数（数学，九年级）
│   ├── math-linear-function/    # 一次函数（数学，八年级）
│   ├── math-congruent-triangles/# 全等三角形（数学，八年级）
│   ├── bio-meiosis/             # 减数分裂（生物，高一）
│   ├── bio-photosynthesis/      # 光合作用（生物，七年级）
│   ├── geo-monsoon/             # 季风系统（地理，高一）
│   ├── phy-ohms-law/            # 欧姆定律（物理，九年级）
│   ├── phy-pressure-buoyancy/   # 液体压强浮力（物理，八年级）
│   ├── chn-compound-vowel/      # 复韵母乐园（语文，一年级）
│   └── _template/               # 空白模板（小学/初中/高中三套）
│
├── community/                   # 🌐 社区课件索引
│   └── index.json               # 社区审核通过的课件列表
│
├── scripts/
│   ├── registry-loader.js       # 🔄 Gallery 动态加载器（从 registry 渲染课件卡片）
│   ├── courseware-importer.js   # 📥 课件导入器（支持 .teachany/.zip/.html）
│   ├── community-loader.js     # 🌐 社区课件加载器
│   ├── pack-courseware.cjs      # 📦 课件打包工具
│   ├── publish-courseware.cjs   # 🚀 课件发布工具（打包→上传 Releases→更新 registry）
│   ├── bootstrap-courseware.cjs # 🏆 知识层数据一键提取
│   ├── validate-courseware.cjs  # ✅ 课件质量 18 项自动校验
│   └── knowledge_layer.py       # 审计 + 按需检索 CLI
│
├── dist/                        # 📦 打包输出（.gitignore，不入库）
│
└── .github/
    ├── ISSUE_TEMPLATE/
    └── workflows/
```

### 📦 课件存储架构

TeachAny 采用**代码与课件分离**的存储架构：

| 层级 | 存储位置 | 内容 | 大小预算 |
|:-----|:---------|:-----|:---------|
| **代码层** | Git 仓库 | Skill 定义、知识层数据、脚本、模板 | < 50 MB |
| **元数据层** | `courseware-registry.json` | 课件名称、学科、年级、链接等 | < 100 KB |
| **课件层** | GitHub Releases | `.teachany` 课件包（含 HTML + 音频 + 视频） | 不限 |

```
开发者工作流：
  examples/ 本地开发 → pack-courseware.cjs 打包 → publish-courseware.cjs 发布到 Releases
                                                     ↓
Gallery 加载流程：                                    更新 registry
  index.html → registry-loader.js 读取 registry → 渲染课件卡片
                                                     ↓
  用户点击卡片 → 本地 examples/ 预览 或 从 Releases 下载 .teachany 包
```

**发布课件到 GitHub Releases：**

```bash
# 打包单个课件（仅本地打包，不上传）
node scripts/publish-courseware.cjs ./examples/math-linear-function --dry-run

# 发布单个课件到 GitHub Releases
GITHUB_TOKEN=ghp_xxx node scripts/publish-courseware.cjs ./examples/math-linear-function

# 发布所有课件
GITHUB_TOKEN=ghp_xxx node scripts/publish-courseware.cjs --all
```

---

## 📚 文档

| 文档 | 说明 |
|:-----|:-----|
| [快速上手](docs/getting-started.md) | 5 分钟创建你的第一个课件 |
| [方法论](docs/methodology.md) | 6+ 套学习科学理论深度解读 |
| [设计系统](docs/design-system.md) | 视觉规范和 CSS 变量 |
| [学科指南](docs/subject-guides/) | 各学科最佳实践 |

---

## 🤝 参与贡献

欢迎贡献！查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

**你可以：**
- 🎓 **创建新课件** — 选任何 K12 知识点，制作互动课件
- 📚 **扩充知识层** — 为任意学科添加知识图谱、易错点库和题库（详见 `data/schema.md`）
- 🌐 **翻译** — 帮助将 Skill 或文档翻译成其他语言
- 🐛 **报告问题** — 发现教学错误或 UI Bug？告诉我们
- 📝 **完善文档** — 更好的例子、更清晰的说明
- 🎨 **设计组件** — 可复用的测验引擎、互动组件

---

## 💡 原创贡献

以下框架和方法是 TeachAny 项目的**独立原创**：

| 原创成果 | 说明 |
|:---------|:-----|
| **五镜头法（Five-Lens Method）** | 从 5 个视角（看见它→拆开它→解释它→比较它→迁移它）切入难点概念的教学方法 |
| **学科适配矩阵（Subject Adaptation Matrix）** | 9 个学科各有专属教学框架、互动类型和评估方式 |
| **6 问预设计框架（6-Question Pre-Design）** | 在写代码之前确保教学完整性的结构化检查清单 |
| **课型分类体系** | 系统化的课型分类（新授/复习/习题/专题/实验）及对应结构模板 |
| **Phase 4 审查清单** | 覆盖教学法、互动性、无障碍和视觉设计的质量保证协议 |
| **视觉设计系统** | 专为教育内容优化的暗色主题毛玻璃设计语言 |

> TeachAny Skill prompt 及全部配套文档采用**双许可证**：非商业用途（个人学习、公立学校、学术研究、开源贡献）遵循 AGPL-3.0；商业用途需获得单独授权，详见 [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md)。

---

## 📄 学术参考

TeachAny 的方法论基于经过同行评审的学习科学研究：

| 理论 | 原始文献 |
|:-----|:---------|
| ABT 叙事结构 | Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press. |
| 认知负荷理论 | Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285. |
| 多媒体学习 | Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. |
| ConcepTest / 同伴教学法 | Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall. |
| Bloom 认知分类 | Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. |
| 脚手架理论 | Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100. |

---

## 📜 许可证

MIT License — 详见 [LICENSE](LICENSE)。

---

<p align="center">
  <strong>为每一位老师和学生而造 ❤️</strong><br>
  <sub>如果 TeachAny 帮助你创造了更好的学习体验，请给我们一个 ⭐</sub>
</p>
