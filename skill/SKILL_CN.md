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

## 五、项目制与任务驱动

优先采用"问题/任务/项目驱动"而非"概念罗列驱动"。根据 Section 3.2 选定的驱动模式，执行对应的设计框架。

### 5.1 推荐引入顺序（通用）

```text
真实任务 / 现象 / 问题 → 学生尝试 → 暴露不足 → 引入新知识 → 立即应用
```

### 5.2 问题驱动设计

1 个**核心问题** → 3-4 个**子问题**，形成递进式问题链：

```text
核心问题：为什么篮球投出去是弧线而不是直线？
├── 子问题1：弧线可以用什么函数描述？（记忆/理解 — 建立基本认知）
├── 子问题2：函数中的参数如何影响弧线形状？（应用/分析 — 深入理解原理）
├── 子问题3：怎样调整参数让球刚好落入篮筐？（分析/评价 — 多角度分析）
└── 子问题4：你来设计一条最优投篮弧线（评价/创造 — 迁移创造）
```

**设计原则**：
- 子问题之间有逻辑递进关系（是什么 → 为什么 → 怎么样 → 怎么办）
- 每个子问题对应一个教学活动/互动模块
- 子问题层级与 Bloom 认知层级对应（Level 1→记忆理解，Level 2→应用分析，Level 3→评价创造，Level 4→综合迁移）
- 最后一个子问题通常涉及迁移、创造或价值判断

### 5.3 项目驱动设计

1 个**大项目** → 3-5 个**子项目阶段**，产出完整作品：

```text
大项目：制作"我们的城市交通优化方案"
├── 阶段1：调研 — 收集交通数据和地图信息（输入）
├── 阶段2：分析 — 用函数模型分析交通流量（加工）
├── 阶段3：设计 — 绘制优化方案图 + 数据支撑（输出初稿）
└── 阶段4：展示 — 制作演示页 + 答辩展示（最终成果）
```

**设计原则**：
- 大项目必须有明确的**最终成果物**（展览页、报告、作品集、方案、视频等）
- 每个阶段有独立的**子成果**（阶段交付物）
- 阶段间体现"输入 → 加工 → 输出"的认知递进
- 在课件中，每个阶段对应一个可提交的互动模块

**各学科项目示例**：

| 学科 | 项目名称 | 最终成果物 |
|:---|:---|:---|
| 数学 | "校园测量师" — 用三角函数测量旗杆高度 | 测量报告 + 计算过程展示页 |
| 语文 | "诗经风雅画师" — 为诗经篇目创作图文集 | 图文作品展览页 |
| 历史 | "丝绸之路策展人" — 策划主题展览 | 数字展览馆（交互网页） |
| 物理 | "桥梁工程师" — 设计最优桥梁结构 | 结构方案 + 受力分析报告 |
| 英语 | "校园英文导览" — 制作校园双语导览 | 多页面导览网页 |

### 5.4 活动驱动设计

1 个**主题活动** → 3-5 个**子活动**，体验式学习：

```text
主题活动：探究"神奇的磁力"
├── 活动1：试一试 — 用磁铁测试不同材料（观察发现）
├── 活动2：画一画 — 描绘磁力线分布（记录表达）
├── 活动3：量一量 — 测量不同距离的磁力大小（实验探究）
└── 活动4：用一用 — 设计一个磁力小发明（拓展创造）
```

**设计原则**：
- 每个活动有明确的**操作动词**（试、画、量、做、拼、演、写）
- 活动之间有**难度递进**
- 先体验后总结，先具体后抽象
- 每个活动配套学习记录单（见 Section 2.6）

### 5.5 问题链驱动设计

环环相扣的问题链，驱动思维从记忆到创造：

```text
Level 1（记忆/理解）：XX 是什么？ → 建立基本认知
Level 2（应用/分析）：为什么是这样？ → 深入理解原理
Level 3（分析/评价）：有什么影响/区别？ → 多角度分析
Level 4（评价/创造）：如果是你，怎么做？ → 迁移创造
```

**与五镜头法结合**：问题链的每个 Level 自然对应五镜头中的不同组合——Level 1 用"看见+拆开"，Level 2 用"解释+比较"，Level 3 用"比较+迁移"，Level 4 用"迁移+创造"。

### 5.6 跨学科融合设计

当课题天然涉及多学科时，采用跨学科融合设计：

| 融合类型 | 说明 | 课件实现方式 |
|:---|:---|:---|
| **知识关联型** | 借用其他学科知识辅助理解 | 在相关知识点旁添加"跨学科链接"卡片 |
| **方法迁移型** | 将一个学科的方法用于另一学科 | 设置"方法迁移挑战"互动任务 |
| **主题统整型** | 围绕一个主题融合多学科 | 多视角分析模块（每个学科一个标签页） |
| **项目综合型** | 一个项目需要多学科知识完成 | 项目阶段中标注"本阶段需要的学科知识" |

**跨学科设计模板**：
```text
主学科：___（核心知识点：___）
辅学科1：___（关联知识点：___）
辅学科2：___（关联知识点：___）

融合点：
1. 主学科提供"___"，辅学科1提供"___"，形成"___"的理解
2. 主学科的"___"与辅学科2的"___"结合，实现"___"的转化
3. 最终成果体现：主学科素养（___）+ 辅学科素养（___）
```

### 5.7 各学科任务引入示例

- **数学**：怎样设计一条抛物线，让篮球准确落入篮筐？
- **物理**：为什么同样用力，纸团和纸片下落不同？
- **化学**：为什么同样是酸，实验现象不完全一样？
- **生物**：为什么剧烈运动后呼吸会加快？
- **地理**：为什么同纬度地区气候差异很大？
- **历史**：为什么同一事件不同史料写法不同？
- **语文**：这段文字为什么让人有画面感？换一种写法行不行？
- **英语**：如果你在国外餐厅点餐，怎么用英语完成整个过程？
- **信息技术**：如何做一个能自动计算总分并排名的小工具？

---

## 六、互动与页面形态库

课件不应只有"讲解卡片 + 选择题"。要根据学科切换交互形态。

### 6.1 通用互动组件

| 组件 | 用途 | 适用学科 |
|:---|:---|:---|
| **前测/后测** | 判断是否形成学习闭环 | 全学科 |
| **ConcepTest 概念题** | 检查是否真正理解，不只是记住 | 全学科 |
| **拖拽排序** | 建立时序、流程、结构关系 | 历史、生物、化学、信息技术 |
| **分类配对** | 区分概念、词义、现象、证据 | 语文、英语、生物、地理 |
| **图像/地图标注** | 强化视觉识别与空间理解 | 数学、地理、生物 |
| **文本批注** | 聚焦语言细节与证据定位 | 语文、英语、历史 |
| **参数调节器** | 观察变量变化带来的结果 | 数学、物理 |
| **分步推导/分步操作** | 帮学生建立完整过程感 | 数学、化学、信息技术 |
| **情境对话卡** | 训练表达与输出 | 英语、语文 |
| **实验预测卡** | 先预测再验证 | 物理、化学、生物 |
| **支架写作框** | 给结构提示辅助产出 | 语文、英语、历史 |
| **时间线/流程线** | 建立线性顺序感 | 历史、生物、化学 |
| **对比双栏** | 并列展示两种观点/版本/方案 | 历史、语文、地理 |
| **学习记录单** | 结构化填写引导探究思维 | 全学科（尤其实验/探究类） |
| **AI 多模态互动区** | 预留区域，用于教师/学生通过 AI 生成图片或视频 | 语文、历史、美术、地理（文科优先） |
| **项目进度面板** | 显示项目各阶段完成情况 | 项目制课、跨学科融合课 |
| **星级互评卡** | 按量规维度打分，支持生生互评 | 展示、作品类活动 |

### 6.2 每个模块的推荐结构

一个模块通常包含以下 6 块：

```text
1. 引入问题（ABT 或任务驱动）
2. 核心讲解（图文/动画/步骤）
3. 深层理解（五镜头选 2-3 个）
4. 立刻练习（带即时反馈）
5. 纠错反馈（针对性诊断）
6. 小结迁移（一句话总结 + 一个迁移问题）
```

如果内容较难，可拆成两个子模块；不要在一个模块里同时塞进多个大难点。

### 6.3 18 分钟注意力法则

每隔大约 15-18 分钟要设计一次"注意力重置点"：
- 从"看"切到"做"
- 从"听解释"切到"自己判断"
- 从"输入"切到"输出"
- 从"抽象"切到"真实案例"

**常见重置方式**：
- 一个概念判断题（ConcepTest）
- 一个错例辨析
- 一个小实验/小观察
- 一个一分钟复述任务
- 一个角色切换/对话任务

### 6.4 交互实验生活化设计规范

所有涉及**物理实验、参数调节、现象观察**的交互组件，**必须**使用学生日常可感知的生活场景作为载体，禁止使用抽象示意图或纯数值面板。

#### 核心原则

1. **场景真实可感**：交互背景必须是学生在生活中见过、摸过、经历过的场景，而非教科书式的线条示意图
2. **操作直觉化**：交互动作（拖拽、点击、滑动）应模拟真实世界的物理操作（放入、拉开、站上去）
3. **类比量级贴近认知**：数值对比必须选择学生能直观感知的参照物，避免抽象单位换算

#### 生活化场景设计示例表

| 知识点 | ❌ 抽象设计 | ✅ 生活化交互设计 |
|:---|:---|:---|
| **阿基米德原理** | 量筒+物块示意图 | **溢水杯实验**：可拖拽的物体放入装满水的杯子，观察水溢出量与物体体积的关系；支持更换不同物体（石头、木块、铁球） |
| **大气压强** | "1cm²承受10.3N≈一个苹果" | **平躺承压体验**：人平躺时全身承受的大气压相当于 **N 台大卡车** 的重量，用卡车堆叠动画直观呈现 |
| **大气压与海拔** | 气压计数值表格 | **马德堡半球**：可交互拖拽中学生到半球两侧，看需要多少人才能拉开；切换"山顶/山脚"场景，对比不同海拔下所需人数的变化 |
| **液体压强与深度** | 压强公式 + 数值计算 | **深海探索**：不同深度（浅海→深海→海沟）展示鱼的形态变化（越深越扁），拖动深度滑块实时观察压强数值与鱼身形变化 |
| **压强与受力面积** | F/S 公式推导 | **冰面救人**：站着 vs 趴着走上冰面，观察冰面是否裂开；可切换"穿雪鞋/穿高跟鞋/光脚"等条件 |
| **浮力条件** | 物体沉浮判断表 | **游泳池实验**：往水中放入不同材质物体（乒乓球、硬币、橡皮泥船），观察沉浮状态，可调节水的密度（清水→盐水→死海） |
| **杠杆原理** | 支点+力臂标注图 | **跷跷板游乐场**：拖动不同体重的小朋友到跷跷板两端不同位置，观察平衡状态 |
| **电路与电阻** | 电路图符号连线 | **水管类比**：粗水管（低电阻）vs 细水管（高电阻），拖动阀门调节"水压"（电压），观察"水流"（电流）变化 |

#### 通用设计规则

**场景选择优先级**（从高到低）：
1. 学生亲身经历过的场景（游泳、滑冰、骑车、坐电梯）
2. 学生在视频/新闻中见过的场景（深海探索、航天、极限运动）
3. 课本必做实验的生活化改造（弹簧测力计→拉行李箱）

**交互形式对应关系**：

| 物理操作 | 交互形式 | 示例 |
|:---|:---|:---|
| 放入/投入 | 拖拽放置 | 物体放入溢水杯 |
| 推/拉 | 拖拽滑动 | 拉开马德堡半球 |
| 调节/改变 | 滑块/旋钮 | 调节深度、改变温度 |
| 站/趴/踩 | 点击切换状态 | 切换站姿/趴姿 |
| 堆叠/增加 | 逐个点击添加 | 往半球上加人 |

**类比参照物选择规则**：
- ✅ 用学生能掂量的东西：书包（5kg）、一桶水（10kg）、一个同学（50kg）、一台小汽车（1.5吨）、一台大卡车（10吨）
- ❌ 避免使用：牛顿、帕斯卡、焦耳等抽象物理单位直接做类比
- ✅ 优先用倍数/数量关系：相当于 X 个同学的体重、相当于 N 台大卡车
- ❌ 避免用小量级类比大数值：不要用"一个苹果的重力"类比大气压

---

## 七、评估系统

### 7.1 Bloom 认知层级对照表

设计练习时必须参照此表，确保不只停在"记忆"层：

| 层级 | 关键动词 | 理科题型示例 | 文科题型示例 |
|:---|:---|:---|:---|
| **记忆** | 识别、列举、说出 | 写出二次函数一般形式 | 列出事件发生的时间顺序 |
| **理解** | 解释、比较、描述 | 解释 a>0 和 a<0 图像的区别 | 用自己的话复述段落大意 |
| **应用** | 计算、求解、运用 | 用配方法求顶点 | 用所学句型完成一段对话 |
| **分析** | 推导、区分、归纳 | 分析为什么 h=-b/(2a) 是对称轴 | 分析作者使用某修辞的意图 |
| **评价** | 判断、验证、评估 | 判断"顶点是(-2,3)"是否正确并说明理由 | 评价两段史料哪个更可信并说明依据 |
| **创造** | 设计、构建、提出 | 设计一个满足条件的抛物线方程 | 写一段运用比喻的描写 |

### 7.2 三级递进练习

| 层级 | 目标 | 特征 |
|:---:|:---|:---|
| **Level 1 基础巩固** | 记忆、识别、理解 | 单点清晰，快速反馈 |
| **Level 2 能力应用** | 应用、分析 | 需要选择方法、组织步骤 |
| **Level 3 迁移挑战** | 评价、创造 | 新情境、综合任务、开放表达 |

### 7.3 三类题型必须组合使用

| 类型 | 目的 | 适用 |
|:---|:---|:---|
| **客观题** | 快速检错 | 选择、判断、连线、拖拽 |
| **解释题** | 检查是否真正理解 | "为什么""依据是什么""哪一步错了" |
| **产出题** | 检查是否能迁移和表达 | 写一段、做一图、给一解、完成一任务 |

**比例建议**：
- 理科：客观题 50% + 解释题 30% + 产出题 20%
- 文科：客观题 30% + 解释题 30% + 产出题 40%

### 7.4 常见错误追踪

每道关键题都尽量补充：
- **常见错误**：学生最容易错哪
- **错误原因**：是概念不清、步骤丢失，还是表达混乱
- **反馈方式**：告诉学生"错在哪、为什么错、怎么改"

**注意**：
- 数学/物理/化学：更适合"错因诊断"（如"你把 h 的符号搞反了"）
- 语文/英语/历史：更适合"质量反馈"（如"你的论据不够充分，试试引用原文第X段"）

### 7.5 开放任务的量规评价

当答案不是唯一时，优先使用量规，而不是强行判对错。

**通用四维量规**（可按学科微调权重）：

| 维度 | 描述 | 理科侧重 | 文科侧重 |
|:---|:---|:---|:---|
| **内容准确** | 信息是否正确，是否跑题 | 计算对、原理对 | 事实对、观点对 |
| **证据充分** | 是否有支撑 | 推导完整、数据引用 | 引用文本、材料、细节 |
| **结构清晰** | 表达是否有层次 | 步骤有序 | 段落有逻辑 |
| **表达得体** | 语言是否准确规范 | 符号规范、单位正确 | 用语准确、语体得当 |

### 7.6 ConcepTest 与同伴讨论

- 先给一个概念题
- 学生先独立作答
- 若正确率处于 **30%-70%**，说明最适合同伴讨论
- 讨论后再次作答，再给解释

适用学科：
- 数学、物理：概念辨析
- 历史：观点与证据匹配
- 语文、英语：表达效果和语境判断

### 7.7 过程性评价与多元评价

课件不仅要有终结性检测（前后测），还要嵌入**过程性评价**——在探究活动中实时收集学习证据：

| 评价时机 | 评价方式 | 课件实现 |
|:---|:---|:---|
| 每个互动模块结束后 | 即时反馈 + 正确率统计 | 内置答题统计面板，实时显示得分 |
| 探究活动中 | 学习记录单提交 | 可填写互动卡片，提交后显示参考答案 |
| 小组展示环节 | 星级互评 | 评价量规卡片 + 1-5 星评分组件 |
| 课件结束时 | 自我反思 | 评价反思单（我学到了/最满意的/想改进的） |

**过程性评价量规模板**（可按学科微调权重）：

| 评价维度 | 优秀（A） | 良好（B） | 合格（C） |
|:---|:---|:---|:---|
| **知识掌握** | 准确运用核心概念，能举一反三 | 基本掌握核心概念，能正确运用 | 了解核心概念，运用时有困难 |
| **探究参与** | 积极参与探究，主动提出问题和假设 | 参与探究活动，完成分配任务 | 被动参与，需要提醒才行动 |
| **思维表达** | 观点清晰有据，逻辑严密，证据充分 | 能表达观点，有一定条理 | 能简单表达，逻辑不够清晰 |
| **创新实践** | 作品有创意，方法新颖，有个人见解 | 作品完整，方法正确 | 作品基本完成，方法单一 |

### 7.8 三段式作业设计

课件中的课后任务或综合练习，采用三级分层设计，满足不同能力层次学生：

| 层次 | 目标 | 比例 | 课件实现 |
|:---|:---|:---|:---|
| **基础巩固**（必做） | 巩固本课核心知识，确保"学会了" | 40%-50% | 标记为 ⭐，答题后立即反馈 |
| **拓展应用**（选做） | 迁移运用到新情境，检验"会用了" | 30%-40% | 标记为 ⭐⭐，含"提示"折叠按钮 |
| **创新挑战**（选做） | 深度探究或创造性产出 | 10%-20% | 标记为 ⭐⭐⭐，开放任务+量规评价 |

**学科示例**：
- 物理（光的折射）：⭐ 画出折射光路图 → ⭐⭐ 解释海市蜃楼成因 → ⭐⭐⭐ 设计一个利用折射原理的小装置方案
- 语文（修辞手法）：⭐ 找出文中的比喻句 → ⭐⭐ 仿写一段含比喻的描写 → ⭐⭐⭐ 为校园写一篇300字散文，运用至少3种修辞
- 历史（商鞅变法）：⭐ 列举变法核心措施 → ⭐⭐ 比较商鞅变法与吴起变法的异同 → ⭐⭐⭐ 写200字论述"变法成功的关键因素"

---

## 八、前置知识链与学段差异

### 8.1 建立知识前置链

每个课件都要明确回答：
- 学这个之前必须知道什么
- 哪些错误其实是前置知识没掌握
- 哪些内容可以前测后跳过

### 8.2 模块组织推荐顺序

```text
范围 Scope → 目标 Objectives → 结构 Structure → 内容 Content → 评估 Assessments
```

落地到课件页面：

```text
学习目标 → 前测 → 模块1 → 模块2 → 模块3 → 综合任务 → 后测 → 拓展
```

### 8.3 小学、初中、高中的差异

| 学段 | 设计重点 | 节奏 | 文本密度 | 互动方式 |
|:---|:---|:---|:---|:---|
| **小学** | 故事化、情境化、强可视化 | 5-8分钟一个小模块 | 低，图多字少 | 点击、拖拽、涂色、简单选择 |
| **初中** | 具体例子带抽象概念、错误诊断 | 10-15分钟一个模块 | 中等 | 分步操作、配对、画图、批注 |
| **高中** | 模型化、比较分析、抽象迁移 | 15-20分钟一个模块 | 可以较高 | 推导、论述、设计、多材料分析 |

---

## 九、三个学科完整微型示例

以下示例展示了"从 6 问到课件结构"的完整路径，供不同学科参考。

### 示例 A：数学（理科代表）——"二次函数的顶点式"

**6 问**：
1. 九年级学生，已学一次函数和一般式
2. 前置：平方运算、完全平方公式
3. 学完能：用配方法把一般式化为顶点式，直接读出顶点
4. 真实场景：篮球抛物线最高点
5. 易错点：h 的符号搞反、配方漏乘系数 a
6. 判断标准：能独立对 y=2x²-8x+3 配方并写出顶点

**课件结构**：
- ABT 引入："你会画 y=ax²+bx+c 了（And），但每次都要列表描点太慢（But），配方法可以一眼看出顶点（Therefore）"
- 深层理解：**看见**（y=x² 平移动画）→ **拆开**（具体例子配方过程）→ **迁移**（一般式推导 h=-b/2a）
- 互动：Canvas 画板拖动顶点观察方程变化
- 练习：Level 1 读顶点 → Level 2 配方求顶点 → Level 3 设计过指定点的抛物线
- 错误诊断："(-3, 2)" → "h 前面是减号，x-3 对应 h=3，不是 -3"

### 示例 B：历史（文科代表）——"商鞅变法为什么能成功"

**6 问**：
1. 高一学生，已学春秋战国基本背景
2. 前置：分封制瓦解、诸侯争霸的基本脉络
3. 学完能：用"背景-措施-阻力-结果"框架分析一次改革
4. 真实场景：为什么有些改革成功、有些失败？
5. 易错点：把"变法内容"和"变法成功原因"混为一谈
6. 判断标准：能写 200 字论述商鞅变法成功的关键因素并引用史料

**课件结构**：
- ABT 引入："你知道战国七雄在争霸（And），但为什么秦国最终胜出（But），关键转折点是商鞅变法（Therefore）"
- 深层理解：**看见**（时间线 + 变法前后对比数据）→ **比较**（商鞅 vs 吴起变法）→ **解释**（成功的关键条件）
- 互动：史料对读（两段不同立场的史料），拖拽排序（变法措施的因果链）
- 练习：Level 1 选择题判断措施归类 → Level 2 解释题"哪条措施对军事最关键" → Level 3 产出题"200字论述，引用至少一条史料"
- 量规反馈：内容准确 / 证据充分（是否引用史料）/ 结构清晰 / 表达得体

### 示例 C：英语（语言代表）——"餐厅点餐情境对话"

**6 问**：
1. 八年级学生，已学基本句型和食物词汇
2. 前置：can/could 句型、食物类词汇 30 个以上
3. 学完能：完成一段 6-8 轮的点餐对话（含询问、点餐、特殊要求、结账）
4. 真实场景：出国旅行在餐厅吃饭
5. 易错点：把中文语序直译、不会表达"不要加…"
6. 判断标准：能脱离模板完成一段完整点餐对话

**课件结构**：
- ABT 引入："你认识 hamburger、salad 这些词（And），但真到餐厅你说不出完整的话（But），所以要学点餐的完整对话流程（Therefore）"
- 深层理解：**看见**（一段真实点餐视频/对话文本）→ **拆开**（对话分成 4 个阶段：入座→看菜单→点餐→结账）→ **比较**（正确 vs 常见中式英语错误）
- 互动：情境对话卡（逐轮选择合适回应），填空练习（关键句型），角色扮演（切换顾客/服务员）
- 练习：Level 1 配对题（句子和场景匹配）→ Level 2 填空补全对话 → Level 3 自由写一段 8 轮对话
- 脚手架：Level 1 给完整模板 → Level 2 只给每轮开头词 → Level 3 只给场景要求
- 反馈：不是判"对错"，而是"这句话在真实场景里服务员能不能听懂"

---

## 十、技术实现

### 10.1 推荐技术组合

| 产物 | 推荐技术 | 适用场景 |
|:---|:---|:---|
| **互动网页课件** | HTML / CSS / JS / Canvas | 大多数课件主形态 |
| **程序化教学动画** | Remotion + React + TypeScript | 需要过程演示、动态变换、讲解视频时 |
| **混合模式** | 网页主课件 + 嵌入 Remotion 视频 | 最推荐，兼顾互动与演示 |

### 10.2 互动网页标准结构

```text
Hero 区（课题名称 + 学科/年级/课型标签）
导航区（锚点跳转）
学习目标
前测
知识模块 × N
  - ABT 引入
  - 核心讲解
  - 深层理解（五镜头）
  - 立刻练习
  - 反馈纠错
综合任务（带脚手架分级）
后测
拓展资源
```

#### 10.2.1 HTML 骨架模板（强制使用）

> ⚠️ **铁律**：所有课件**必须**使用以下 HTML 骨架模板作为起点。禁止自行发明页面结构。骨架中标注 `<!-- 必选 -->` 的 section 不可删除；标注 `<!-- 可选 -->` 的 section 可按需省略。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>【课题名称】- TeachAny 互动课件</title>
  <!-- TeachAny 元信息（用于打包和知识地图关联） -->
  <meta name="teachany-node" content="【节点ID】">
  <meta name="teachany-subject" content="【学科ID】">
  <meta name="teachany-domain" content="【领域ID】">
  <meta name="teachany-grade" content="【年级数字】">
  <meta name="teachany-prerequisites" content="【前置节点ID】">
  <meta name="teachany-difficulty" content="【1-5】">
  <meta name="teachany-version" content="2.0">
  <meta name="teachany-author" content="teachany">
  <style>
    /* ═══ 1. 学段模板 CSS 变量（从 10.3 选取对应学段） ═══ */
    :root { /* ... 见 10.3 ... */ }

    /* ═══ 2. 全局布局 ═══ */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text, #1e293b); }

    /* ═══ 3. Sticky 导航栏 ═══ */
    .nav-bar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px; background: var(--card, #fff);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow-x: auto; white-space: nowrap;
    }
    .nav-bar .brand { font-weight: 700; margin-right: 12px; }
    .nav-bar a {
      text-decoration: none; padding: 6px 14px; border-radius: 20px;
      font-size: 14px; color: var(--text, #334155); transition: all 0.2s;
    }
    .nav-bar a:hover, .nav-bar a.active { background: var(--primary); color: #fff; }

    /* ═══ 4. Section 通用样式 ═══ */
    .section { max-width: 900px; margin: 40px auto; padding: 0 24px; }
    .section-title {
      font-size: 1.6rem; font-weight: 700; margin-bottom: 20px;
      padding-left: 16px; border-left: 4px solid var(--primary);
    }

    /* ═══ 5. Hero 区 ═══ */
    .hero {
      text-align: center; padding: 60px 24px 40px;
      background: linear-gradient(135deg, var(--primary), var(--secondary, var(--primary)));
      color: #fff; border-radius: 0 0 24px 24px;
    }
    .hero h1 { font-size: 2.2rem; margin-bottom: 12px; }
    .hero .tags { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .hero .tag {
      background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 13px;
    }

    /* ═══ 6. 卡片 ═══ */
    .card {
      background: var(--card, #fff); border-radius: 14px; padding: 24px;
      margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    /* ═══ 7. 练习区 ═══ */
    .quiz-option {
      display: block; width: 100%; text-align: left; padding: 14px 18px;
      margin: 8px 0; border: 2px solid #e2e8f0; border-radius: 10px;
      background: var(--card, #fff); cursor: pointer; font-size: 15px; transition: all 0.2s;
    }
    .quiz-option:hover { border-color: var(--primary); transform: translateX(3px); }
    .quiz-option.correct { border-color: #22c55e; background: #f0fdf4; }
    .quiz-option.wrong { border-color: #ef4444; background: #fef2f2; }
    .feedback { padding: 16px; border-radius: 10px; margin-top: 12px; display: none; }
    .feedback.show { display: block; }

    /* ═══ 8. 前后翻页按钮 ═══ */
    .page-nav {
      display: flex; justify-content: space-between; align-items: center;
      max-width: 900px; margin: 30px auto; padding: 0 24px;
    }
    .page-nav button {
      padding: 10px 24px; border-radius: 10px; border: 2px solid var(--primary);
      background: transparent; color: var(--primary); font-size: 15px; cursor: pointer;
      transition: all 0.2s;
    }
    .page-nav button:hover { background: var(--primary); color: #fff; }
    .page-nav .current { font-size: 14px; color: #64748b; }

    /* ═══ 9. 进度条 ═══ */
    .progress-bar {
      position: fixed; top: 0; left: 0; height: 3px; z-index: 200;
      background: var(--primary); transition: width 0.3s;
    }

    /* ═══ 10. 响应式 ═══ */
    @media (max-width: 600px) {
      .hero h1 { font-size: 1.5rem; }
      .section { padding: 0 16px; margin: 24px auto; }
      .nav-bar { padding: 10px 12px; }
    }

    /* ═══ 11. 视频播放器 ═══ */
    .video-player {
      margin: 20px 0; border-radius: 12px; overflow: hidden;
      background: #000; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .video-player video { width: 100%; display: block; border-radius: 12px; }
    .video-caption {
      text-align: center; font-size: 14px; color: var(--text-secondary, #64748b);
      padding: 8px 0; margin: 0;
    }

    /* ═══ 12. 音频播放器（底部悬浮控制条 + 滚动自动播放） ═══ */
    .audio-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: var(--card, #fff); border-top: 1px solid #e2e8f0;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
      display: none; align-items: center; gap: 10px;
      padding: 10px 18px; height: 56px;
    }
    .audio-bar.active { display: flex; }
    .audio-bar .audio-track-title {
      font-size: 13px; font-weight: 600; min-width: 80px; max-width: 200px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .audio-bar .audio-ctrl-btn {
      background: none; border: none; font-size: 18px; cursor: pointer;
      color: var(--text, #334155); padding: 4px; flex-shrink: 0;
    }
    .audio-bar .progress-track {
      flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px;
      position: relative; cursor: pointer; min-width: 60px;
    }
    .audio-bar .progress-fill {
      height: 100%; background: var(--primary); border-radius: 2px;
      transition: width 0.1s;
    }
    .audio-bar .time-display { font-size: 12px; min-width: 40px; text-align: center; }
    .audio-bar .speed-btn {
      background: var(--primary); color: #fff; border: none; border-radius: 12px;
      font-size: 12px; padding: 2px 8px; cursor: pointer; font-weight: 600;
    }
    .audio-bar .audio-subtitle {
      font-size: 12px; color: var(--text-secondary, #64748b);
      max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    @media (max-width: 600px) {
      .audio-bar { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 6px; }
      .audio-bar .audio-subtitle { max-width: 100%; order: 10; width: 100%; }
    }
    /* 底部控制条占位：防止内容被遮挡 */
    body.audio-playing { padding-bottom: 64px; }

    /* ═══ 13. 知识图谱（三列布局） ═══ */
    #kg-svg .kg-node { cursor: default; transition: filter .2s; }
    #kg-svg .kg-node.has-cw { cursor: pointer; }
    #kg-svg .kg-node.has-cw:hover rect { filter: brightness(1.15); }
    #kg-svg .kg-node.no-cw rect { stroke-dasharray: 6 3; }
    #kg-svg .kg-edge { fill: none; stroke-width: 1.5; opacity: 0.55; }
    #kg-svg .kg-chain { fill: none; stroke-width: 1.2; opacity: 0.5; }
    @media (max-width: 600px) {
      .audio-bar { flex-wrap: wrap; height: auto; }
    }
  </style>
</head>
<body>
  <!-- 进度条 -->
  <div class="progress-bar" id="progressBar" style="width: 0%"></div>

  <!-- Sticky 导航栏 -->
  <nav class="nav-bar" id="navbar">
    <span class="brand">🎓 TeachAny</span>
    <a href="#hero">首页</a>
    <a href="#objectives">目标</a>
    <a href="#pretest">前测</a>
    <!-- 知识模块导航项（按实际模块数动态添加） -->
    <a href="#module-1">模块1</a>
    <a href="#module-2">模块2</a>
    <a href="#module-3">模块3</a>
    <a href="#synthesis">综合</a>
    <a href="#posttest">后测</a>
    <a href="#summary">小结</a>
    <a href="#knowledge-graph">图谱</a>
  </nav>

  <!-- ═══ Hero 区 ═══ 必选 -->
  <section class="hero" id="hero">
    <h1>【课题名称】</h1>
    <div class="tags">
      <span class="tag">【学科】</span>
      <span class="tag">【年级】</span>
      <span class="tag">【课型标签】</span>
      <span class="tag">【驱动模式标签】</span>
    </div>
  </section>

  <!-- ═══ 学习目标 ═══ 必选 -->
  <section class="section" id="objectives">
    <h2 class="section-title">🎯 学习目标</h2>
    <!-- 3-5 条可观察、可检测的目标，用 Bloom 动词 -->
  </section>

  <!-- ═══ 前测 ═══ 必选 -->
  <section class="section" id="pretest">
    <h2 class="section-title">📋 前置知识检测</h2>
    <!-- 至少 2 道前测题，检验 prerequisites -->
  </section>

  <!-- ═══ 知识模块 × N ═══ 必选（至少 3 个模块） -->
  <section class="section" id="module-1">
    <h2 class="section-title">📖 模块 1：【子问题/子活动/阶段名称】</h2>
    <!-- 6 块结构：ABT引入 → 核心讲解 → 深层理解 → 立刻练习 → 纠错反馈 → 小结迁移 -->
  </section>

  <!-- 前后翻页（每个模块之间） -->
  <div class="page-nav">
    <button onclick="scrollToSection('pretest')">← 前测</button>
    <span class="current">模块 1 / N</span>
    <button onclick="scrollToSection('module-2')">模块 2 →</button>
  </div>

  <section class="section" id="module-2">
    <h2 class="section-title">📖 模块 2：【子问题/子活动/阶段名称】</h2>
  </section>

  <section class="section" id="module-3">
    <h2 class="section-title">📖 模块 3：【子问题/子活动/阶段名称】</h2>
  </section>
  <!-- 更多模块按需添加... -->

  <!-- ═══ 综合任务 ═══ 必选 -->
  <section class="section" id="synthesis">
    <h2 class="section-title">🏆 综合任务</h2>
    <!-- 三段式作业：⭐基础 + ⭐⭐拓展 + ⭐⭐⭐挑战 -->
  </section>

  <!-- ═══ 后测 ═══ 必选 -->
  <section class="section" id="posttest">
    <h2 class="section-title">📝 后测</h2>
    <!-- 与前测呼应，检验学习效果 -->
  </section>

  <!-- ═══ 小结 + 拓展 ═══ 必选 -->
  <section class="section" id="summary">
    <h2 class="section-title">📌 课堂小结</h2>
    <!-- 核心知识回顾 + 思维导图/要点清单 -->
  </section>

  <!-- ═══ 拓展资源 ═══ 可选 -->
  <section class="section" id="extension">
    <h2 class="section-title">🚀 拓展资源</h2>
  </section>

  <!-- ═══ 知识图谱 ═══ 必选 -->
  <section class="section" id="knowledge-graph">
    <h2 class="section-title">🗺️ 知识图谱</h2>
    <p style="color:var(--text-secondary,#64748b);margin-bottom:16px;">三列视图：前序知识 → 核心子知识点 → 后续知识。实线节点可点击跳转，虚线表示暂无课件。</p>
    <div id="kg-container" style="width:100%;min-height:500px;border:1px solid var(--border,#e2e8f0);border-radius:12px;overflow:hidden;position:relative;">
      <svg id="kg-svg" width="100%" height="100%" style="min-height:500px;"></svg>
    </div>
  </section>

  <!-- ═══ AI 多模态互动区 ═══ 文科默认插入，见 10.4 -->

  <script>
    // ═══ 导航高亮 + 滚动进度 ═══
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-bar a');
    const progressBar = document.getElementById('progressBar');

    window.addEventListener('scroll', () => {
      // 进度条
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (scrollTop / docHeight * 100) + '%';

      // 导航高亮
      let current = '';
      sections.forEach(sec => {
        if (sec.offsetTop - 120 <= scrollTop) current = sec.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    });

    // ═══ 锚点平滑滚动 ═══
    function scrollToSection(id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.getAttribute('href').slice(1);
        scrollToSection(id);
      });
    });

    // ═══ 知识图谱渲染（三列布局：前序 | 核心子知识点链 | 后续） ═══
    // knowledgeGraphData 格式见 10.2.3 节
    (function renderKnowledgeGraph() {
      if (typeof knowledgeGraphData === 'undefined') return;
      const svg = document.getElementById('kg-svg');
      if (!svg) return;
      const d = knowledgeGraphData;
      const NS = 'http://www.w3.org/2000/svg';
      const el = (tag) => document.createElementNS(NS, tag);

      // —— 颜色配置 ——
      const C = {
        pre: '#06b6d4', core: '#f59e0b', sub: '#3b82f6', next: '#10b981',
        preBg: 'rgba(6,182,212,0.12)', coreBg: 'rgba(245,158,11,0.18)',
        subBg: 'rgba(59,130,246,0.12)', nextBg: 'rgba(16,185,129,0.12)',
        noCw: '#94a3b8', noCwBg: 'rgba(148,163,184,0.08)'
      };

      // —— 布局参数 ——
      const preNodes = d.prerequisites || [];
      const subNodes = d.coreSubTopics || [];
      const nextNodes = d.nextTopics || [];
      const maxRows = Math.max(preNodes.length, subNodes.length + 1, nextNodes.length);
      const ROW_H = 70, PAD_TOP = 60, NODE_H = 44, NODE_RX = 10;
      const W = 1100, H = Math.max(500, PAD_TOP + maxRows * ROW_H + 40);
      // 三列 X 中心
      const COL = { pre: 120, core: 550, next: 970 };
      const NW = { pre: 190, core: 270, next: 220 }; // 节点宽度

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = ''; // 清空

      // —— defs：箭头 + 发光 ——
      const defs = el('defs');
      ['pre','core','sub','next'].forEach(k => {
        const color = C[k];
        const marker = el('marker');
        marker.setAttribute('id', `kg-arr-${k}`);
        marker.setAttribute('viewBox', '0 0 10 6');
        marker.setAttribute('refX', '10'); marker.setAttribute('refY', '3');
        marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto');
        const p = el('path'); p.setAttribute('d', 'M0,0 L10,3 L0,6Z'); p.setAttribute('fill', color);
        marker.appendChild(p); defs.appendChild(marker);
      });
      // 发光滤镜
      const filter = el('filter'); filter.setAttribute('id', 'kg-glow');
      const blur = el('feGaussianBlur'); blur.setAttribute('stdDeviation', '3'); blur.setAttribute('result', 'blur');
      const merge = el('feMerge');
      const mn1 = el('feMergeNode'); mn1.setAttribute('in', 'blur');
      const mn2 = el('feMergeNode'); mn2.setAttribute('in', 'SourceGraphic');
      merge.appendChild(mn1); merge.appendChild(mn2);
      filter.appendChild(blur); filter.appendChild(merge);
      defs.appendChild(filter);
      // 虚线无课件箭头
      const noCwMarker = el('marker');
      noCwMarker.setAttribute('id', 'kg-arr-nocw');
      noCwMarker.setAttribute('viewBox', '0 0 10 6');
      noCwMarker.setAttribute('refX', '10'); noCwMarker.setAttribute('refY', '3');
      noCwMarker.setAttribute('markerWidth', '8'); noCwMarker.setAttribute('markerHeight', '6');
      noCwMarker.setAttribute('orient', 'auto');
      const np = el('path'); np.setAttribute('d', 'M0,0 L10,3 L0,6Z'); np.setAttribute('fill', C.noCw);
      noCwMarker.appendChild(np); defs.appendChild(noCwMarker);
      svg.appendChild(defs);

      // —— 列标题 ——
      function addTitle(x, y, text, color) {
        const t = el('text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('fill', color); t.setAttribute('font-size', '14');
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-weight', '600');
        t.textContent = text; svg.appendChild(t);
      }
      addTitle(COL.pre, 30, '前序知识', '#64748b');
      addTitle(COL.core, 30, '核心知识', C.core);
      addTitle(COL.next, 30, '后续知识', '#64748b');

      // —— 绘制节点的通用函数 ——
      function drawNode(cx, cy, w, h, label, opts) {
        const { fill, stroke, strokeW, fontSize, fontWeight, fontColor, rx, glow, dash, clickUrl } = Object.assign(
          { fill: '#fff', stroke: '#ccc', strokeW: 1.5, fontSize: 14, fontWeight: '600', fontColor: '#333', rx: NODE_RX, glow: false, dash: false, clickUrl: '' }, opts);
        const g = el('g');
        g.setAttribute('class', 'kg-node' + (clickUrl ? ' has-cw' : (dash ? ' no-cw' : '')));
        const rect = el('rect');
        rect.setAttribute('x', cx - w/2); rect.setAttribute('y', cy - h/2);
        rect.setAttribute('width', w); rect.setAttribute('height', h);
        rect.setAttribute('rx', rx); rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke); rect.setAttribute('stroke-width', strokeW);
        if (dash) rect.setAttribute('stroke-dasharray', '6 3');
        if (glow) rect.setAttribute('filter', 'url(#kg-glow)');
        g.appendChild(rect);
        const txt = el('text');
        txt.setAttribute('x', cx); txt.setAttribute('y', cy + 5);
        txt.setAttribute('fill', fontColor); txt.setAttribute('font-size', fontSize);
        txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('font-weight', fontWeight);
        txt.textContent = label.length > 14 ? label.slice(0, 14) + '…' : label;
        g.appendChild(txt);
        if (clickUrl) {
          g.style.cursor = 'pointer';
          g.addEventListener('click', () => window.open(clickUrl, '_blank'));
        }
        svg.appendChild(g);
        return { cx, cy, left: cx - w/2, right: cx + w/2, top: cy - h/2, bottom: cy + h/2 };
      }

      // —— 绘制贝塞尔曲线 ——
      function drawCurve(x1, y1, x2, y2, color, markerKey) {
        const cpX = (x1 + x2) / 2;
        const path = el('path');
        path.setAttribute('d', `M${x1},${y1} C${cpX},${y1} ${cpX},${y2} ${x2},${y2}`);
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5'); path.setAttribute('opacity', '0.55');
        path.setAttribute('class', 'kg-edge');
        path.setAttribute('marker-end', `url(#kg-arr-${markerKey})`);
        svg.appendChild(path);
      }

      // —— 绘制前序节点 ——
      const prePos = {};
      preNodes.forEach((n, i) => {
        const cy = PAD_TOP + i * ROW_H + NODE_H/2;
        const hasCw = n.hasCourseware && n.url;
        const isDash = !n.hasCourseware;
        prePos[n.id] = drawNode(COL.pre, cy, NW.pre, NODE_H, n.label, {
          fill: isDash ? C.noCwBg : C.preBg,
          stroke: isDash ? C.noCw : C.pre,
          fontColor: isDash ? C.noCw : C.pre,
          dash: isDash,
          clickUrl: hasCw ? n.url : ''
        });
      });

      // —— 绘制核心主节点 ——
      const coreMainY = PAD_TOP + NODE_H/2;
      const coreMain = drawNode(COL.core, coreMainY, NW.core + 10, NODE_H + 8, d.currentLabel || '当前课件', {
        fill: C.coreBg, stroke: C.core, strokeW: 2.5,
        fontSize: 17, fontWeight: '700', fontColor: C.core,
        rx: 12, glow: true
      });

      // —— 绘制核心子节点链 ——
      const subPos = {};
      subNodes.forEach((n, i) => {
        const cy = PAD_TOP + (i + 1) * ROW_H + NODE_H/2;
        subPos[n.id] = drawNode(COL.core, cy, NW.core, NODE_H - 2, n.label, {
          fill: C.subBg, stroke: C.sub,
          fontColor: C.sub
        });
      });

      // —— 核心内部链式连线（主节点 → 第一个子节点，子节点间竖直连线） ——
      if (subNodes.length > 0) {
        const firstSub = subPos[subNodes[0].id];
        const chainLine = el('path');
        chainLine.setAttribute('d', `M${COL.core},${coreMain.bottom} L${COL.core},${firstSub.top}`);
        chainLine.setAttribute('fill', 'none'); chainLine.setAttribute('stroke', C.core);
        chainLine.setAttribute('stroke-width', '1.5'); chainLine.setAttribute('opacity', '0.6');
        chainLine.setAttribute('class', 'kg-chain');
        chainLine.setAttribute('marker-end', `url(#kg-arr-core)`);
        svg.appendChild(chainLine);
      }
      for (let i = 0; i < subNodes.length - 1; i++) {
        const from = subPos[subNodes[i].id], to = subPos[subNodes[i+1].id];
        const line = el('path');
        line.setAttribute('d', `M${COL.core},${from.bottom} L${COL.core},${to.top}`);
        line.setAttribute('fill', 'none'); line.setAttribute('stroke', C.sub);
        line.setAttribute('stroke-width', '1.2'); line.setAttribute('opacity', '0.5');
        line.setAttribute('class', 'kg-chain');
        line.setAttribute('marker-end', `url(#kg-arr-sub)`);
        svg.appendChild(line);
      }

      // —— 绘制后续节点 ——
      const nextPos = {};
      nextNodes.forEach((n, i) => {
        const cy = PAD_TOP + i * ROW_H + NODE_H/2;
        const hasCw = n.hasCourseware && n.url;
        const isDash = !n.hasCourseware;
        nextPos[n.id] = drawNode(COL.next, cy, NW.next, NODE_H, n.label, {
          fill: isDash ? C.noCwBg : C.nextBg,
          stroke: isDash ? C.noCw : C.next,
          fontColor: isDash ? C.noCw : C.next,
          dash: isDash,
          clickUrl: hasCw ? n.url : ''
        });
      });

      // —— 前序 → 核心：根据 connectsTo 精准连线 ——
      preNodes.forEach(n => {
        const from = prePos[n.id];
        if (!from) return;
        const targets = n.connectsTo || [];
        const isDash = !n.hasCourseware;
        const edgeColor = isDash ? C.noCw : C.pre;
        const markerKey = isDash ? 'nocw' : 'pre';
        if (targets.length === 0) {
          // 无指定目标时，连到核心主节点
          drawCurve(from.right, from.cy, coreMain.left, coreMain.cy, edgeColor, markerKey);
        } else {
          targets.forEach(tid => {
            const to = subPos[tid] || coreMain;
            drawCurve(from.right, from.cy, to.left, to.cy, edgeColor, markerKey);
          });
        }
      });

      // —— 核心 → 后续：根据 connectsFrom 精准连线 ——
      nextNodes.forEach(n => {
        const to = nextPos[n.id];
        if (!to) return;
        const sources = n.connectsFrom || [];
        const isDash = !n.hasCourseware;
        const edgeColor = isDash ? C.noCw : C.next;
        const markerKey = isDash ? 'nocw' : 'next';
        if (sources.length === 0) {
          // 无指定来源时，从核心主节点连出
          drawCurve(coreMain.right, coreMain.cy, to.left, to.cy, edgeColor, markerKey);
        } else {
          sources.forEach(sid => {
            const from = subPos[sid] || coreMain;
            drawCurve(from.right, from.cy, to.left, to.cy, edgeColor, markerKey);
          });
        }
      });
    })();

    // ═══ 音频播放器引擎（滚动自动播放 + 底部控制条） ═══
    // audioPlaylist 由 AI 在 L3 完成后注入，格式：
    // [{id, sectionId, title, src, subtitle}]
    (function initAudioPlayer() {
      if (typeof audioPlaylist === 'undefined' || !audioPlaylist.length) return;
      // 创建底部悬浮控制条
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.innerHTML = `
        <span class="audio-track-title"></span>
        <button class="audio-ctrl-btn play-btn">▶</button>
        <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
        <span class="time-display">0:00</span>
        <button class="speed-btn">1x</button>
        <span class="audio-subtitle"></span>
      `;
      document.body.appendChild(bar);
      const audio = new Audio();
      let currentIdx = -1;
      const speeds = [0.5, 1, 1.25, 1.5, 2];
      let speedIdx = 1; // 默认 1x
      function playTrack(i, autoplay) {
        if (i < 0 || i >= audioPlaylist.length) return;
        currentIdx = i;
        audio.src = audioPlaylist[i].src;
        if (autoplay !== false) audio.play();
        bar.classList.add('active');
        document.body.classList.add('audio-playing');
        bar.querySelector('.audio-track-title').textContent = audioPlaylist[i].title || '';
        bar.querySelector('.play-btn').textContent = autoplay !== false ? '⏸' : '▶';
        bar.querySelector('.audio-subtitle').textContent = audioPlaylist[i].subtitle || '';
      }
      // IntersectionObserver：滚动到 section 时自动播放对应音频
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const secId = entry.target.id;
          const idx = audioPlaylist.findIndex(item => item.sectionId === secId);
          if (idx !== -1 && idx !== currentIdx) playTrack(idx);
        });
      }, { threshold: 0.4 });
      audioPlaylist.forEach(item => {
        const sec = document.getElementById(item.sectionId);
        if (sec) observer.observe(sec);
      });
      // 播放/暂停
      bar.querySelector('.play-btn').addEventListener('click', () => {
        if (audio.paused) { if (currentIdx < 0) playTrack(0); else audio.play(); bar.querySelector('.play-btn').textContent = '⏸'; }
        else { audio.pause(); bar.querySelector('.play-btn').textContent = '▶'; }
      });
      // 调速
      bar.querySelector('.speed-btn').addEventListener('click', () => {
        speedIdx = (speedIdx + 1) % speeds.length;
        audio.playbackRate = speeds[speedIdx];
        bar.querySelector('.speed-btn').textContent = speeds[speedIdx] + 'x';
      });
      // 进度条
      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
        bar.querySelector('.progress-fill').style.width = pct + '%';
        const m = Math.floor(audio.currentTime / 60), s = Math.floor(audio.currentTime % 60);
        bar.querySelector('.time-display').textContent = m + ':' + String(s).padStart(2, '0');
      });
      // 自动连播
      audio.addEventListener('ended', () => {
        if (currentIdx < audioPlaylist.length - 1) playTrack(currentIdx + 1);
        else { bar.querySelector('.play-btn').textContent = '▶'; }
      });
      // 点击进度条跳转
      bar.querySelector('.progress-track').addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    })();
  </script>
</body>
</html>
```

**骨架使用规则**：

| 规则 | 说明 |
|:---|:---|
| **必选 section 不可删除** | Hero、学习目标、前测、知识模块（≥3个）、综合任务、后测、小结、**知识图谱** |
| **模块数量** | 最少 3 个，最多 5 个（与驱动结构的子问题/子活动/阶段数一致） |
| **导航项动态匹配** | nav-bar 中的锚点链接必须与实际 section id 一一对应（包含 `#knowledge-graph`） |
| **CSS 变量替换** | 将 `:root` 中的变量替换为 10.3 对应学段模板的配色 |
| **前后翻页** | 每两个相邻模块之间放一个 `.page-nav` 翻页条 |
| **进度条** | 始终保留顶部进度条，让学生知道"学到了哪里" |
| **音频播放器** | L3 语音生成后，注入 `audioPlaylist` 数组（含 `sectionId` 字段关联对应 section）并确保骨架中的音频播放器引擎正常工作（IntersectionObserver 滚动自动播放 + 底部悬浮控制条：播放/暂停+进度条+调速+字幕）。**禁止**只添加隐藏 `<audio>` 标签而不提供播放 UI |
| **视频播放器** | 视频**必须嵌入到对应知识模块的 section 内部**（而非集中放置），使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签嵌入，外包 `.video-player` 容器 + `.video-caption` 说明。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化，仅当交互无法覆盖时才用 `<video>` 嵌入静态视频。**禁止**仅用 JS 动态创建视频元素 |
| **知识图谱** | 必须注入 `knowledgeGraphData` 对象（从 `_graph.json` 的 `prerequisites` + `leads_to` 提取节点和边），当前节点高亮、有课件节点可点击跳转、无课件节点显示虚线框 |
| **AI 生成的插图** | 使用 `image_gen` 生成后，以 `<img src="./assets/xxx.png">` 嵌入（详见 10.4.1） |

#### 10.2.2 统一导航规范

所有课件**必须**使用 **Sticky 顶部导航 + 前后翻页按钮** 的导航模式。禁止使用以下替代方案：

| ❌ 禁止 | ✅ 统一使用 | 理由 |
|:---|:---|:---|
| Tab 切换（水平标签页） | Sticky 导航 + 锚点滚动 | Tab 切换隐藏内容，学生无法看到全局进度 |
| 纯手动滚动（无导航） | Sticky 导航 + 进度条 | 学生容易迷失位置 |
| 侧边栏导航 | 顶部导航（移动端友好） | 侧边栏在移动端体验差 |
| 多页 HTML（page1.html, page2.html） | 单文件 + 锚点 section | 单文件便于离线使用和打包 |

**导航交互规范**：
1. **Sticky 导航栏**：始终固定在页面顶部，滚动时不消失
2. **当前 section 高亮**：滚动到哪个 section，对应导航项自动高亮
3. **进度条**：页面顶部 3px 彩色进度条，实时反映阅读进度
4. **前后翻页**：每两个模块之间放置翻页按钮（← 上一模块 / 下一模块 →），按钮带当前位置指示（"模块 2 / 4"）
5. **平滑滚动**：所有导航和翻页点击使用 `scrollIntoView({ behavior: 'smooth' })`

#### 10.2.3 知识图谱可视化规范（必选·三列布局）

> ⚠️ **铁律**：每个课件**必须**包含交互式知识图谱 section（`#knowledge-graph`），采用**三列布局**：前序知识 → 核心子知识点链 → 后续知识。知识图谱是课件结构的必选组成部分，不可省略。

**三列布局说明**：
- **左列（前序知识）**：当前课件的前置知识节点，从 `_graph.json` 的 `prerequisites` 提取
- **中列（核心知识）**：顶部为当前课件的主节点（橙色高亮），下方展开为 5-8 个子知识点纵向链，对应课件的教学模块
- **右列（后续知识）**：学完当前课件后可进阶的知识点，从 `_graph.json` 的 `leads_to` 提取
- **连线规则**：前序节点精准连接到它所对应的核心子知识点（不是全部连到主节点）；后续节点从对应的核心子知识点引出

**数据来源**：
1. 从 `_graph.json` 的 `prerequisites` 和 `leads_to` 字段提取前序/后续节点
2. 从当前课件的教学模块（section）拆解出核心子知识点
3. 查询 `data/trees/*.json` 中的 `status` 字段判断 `hasCourseware`：仅 `status: "active"` 且 `courses` 非空的节点为 `true`

**数据注入格式**：

AI 在生成课件时，必须在 `<script>` 标签**最前面**（骨架 JS 之前）注入以下数据对象：

```html
<script>
  // ═══ 知识图谱数据（AI 从 _graph.json + 教学模块自动生成） ═══
  const knowledgeGraphData = {
    currentNode: "linear-function",          // 当前课件节点 ID
    currentLabel: "一次函数 y=kx+b",          // 核心主节点的显示标签

    // 核心子知识点（纵向链，对应课件教学模块，5-8 个）
    coreSubTopics: [
      { id: "sub-definition", label: "一次函数的定义" },
      { id: "sub-graph",      label: "两点法画图像" },
      { id: "sub-kb",         label: "k和b的几何意义" },
      { id: "sub-method",     label: "待定系数法" },
      { id: "sub-equation",   label: "一次函数与方程组" },
      { id: "sub-application",label: "实际应用" }
    ],

    // 前序知识（connectsTo 指向核心子知识点 id，精准连线）
    prerequisites: [
      { id: "coordinate-system",     label: "平面直角坐标系",  hasCourseware: false, url: "", connectsTo: ["sub-definition", "sub-graph"] },
      { id: "proportional-function", label: "正比例函数",      hasCourseware: false, url: "", connectsTo: ["sub-definition"] },
      { id: "linear-equation",       label: "一元一次方程",    hasCourseware: false, url: "", connectsTo: ["sub-method"] },
      { id: "variable-and-function", label: "变量与函数",      hasCourseware: false, url: "", connectsTo: ["sub-definition"] }
    ],

    // 后续知识（connectsFrom 指向核心子知识点 id，精准连线）
    nextTopics: [
      { id: "quadratic-function", label: "二次函数",           hasCourseware: true,  url: "../math-quadratic-function/index.html", connectsFrom: ["sub-application"] },
      { id: "linear-equation-system-graph", label: "一次函数与方程组图解", hasCourseware: false, url: "", connectsFrom: ["sub-equation"] },
      { id: "inverse-proportional", label: "反比例函数",       hasCourseware: false, url: "", connectsFrom: ["sub-kb"] }
    ]
  };
</script>
```

**字段说明**：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `currentNode` | string | 当前课件在 `_graph.json` 中的节点 ID |
| `currentLabel` | string | 核心主节点的显示文字（含公式或核心表达式） |
| `coreSubTopics` | array | 核心子知识点列表，纵向链式展示，对应课件教学模块 |
| `coreSubTopics[].id` | string | 子知识点 ID，用于 `connectsTo` / `connectsFrom` 引用 |
| `coreSubTopics[].label` | string | 子知识点显示文字 |
| `prerequisites` | array | 前序知识节点列表 |
| `prerequisites[].connectsTo` | string[] | 该前序节点连向的核心子知识点 ID 列表（精准映射） |
| `nextTopics` | array | 后续知识节点列表 |
| `nextTopics[].connectsFrom` | string[] | 该后续节点从哪些核心子知识点引出（精准映射） |
| `*.hasCourseware` | boolean | 是否有对应课件，基于 `data/trees/*.json` 的 `status: "active"` 判断 |
| `*.url` | string | 课件 URL，有课件时填相对路径，无课件填空字符串 |

**节点视觉规则（四种颜色区分）**：

| 节点类型 | 底色 | 边框色 | 文字色 | 特殊样式 |
|:---|:---|:---|:---|:---|
| **核心主节点** | `rgba(245,158,11,0.18)` | `#f59e0b`（2.5px） | `#f59e0b` | 发光滤镜、17px 粗体、圆角 12px |
| **核心子节点** | `rgba(59,130,246,0.12)` | `#3b82f6`（1.5px） | `#3b82f6` | 14px 半粗体 |
| **前序/后续（有课件）** | 对应色 12% 透明 | 对应色 1.5px 实线 | 对应色 | 可点击，hover 高亮 |
| **前序/后续（无课件）** | `rgba(148,163,184,0.08)` | `#94a3b8` 1.5px **虚线** | `#94a3b8` | 不可点击 |

**连线规则**：
- **前序 → 核心**：青色（`#06b6d4`）贝塞尔曲线，从前序节点右边缘到核心子节点左边缘
- **核心内部链**：主节点到第一个子节点用金色（`#f59e0b`），子节点间用蓝色（`#3b82f6`）直线
- **核心 → 后续**：绿色（`#10b981`）贝塞尔曲线，从核心子节点右边缘到后续节点左边缘
- **无课件节点**的连线使用灰色（`#94a3b8`）
- 所有连线带箭头 `marker-end`，opacity 0.5-0.6

**节点 ID 命名**：
- 前序/后续节点 ID 使用 `_graph.json` 中的 `node_id`（如 `linear-function`、`ohms-law`）
- 核心子知识点 ID 使用 `sub-` 前缀 + 简短英文标识（如 `sub-definition`、`sub-graph`）

**降级策略**：
- 如果 `_graph.json` 不存在或无法读取 → 使用 Web 搜索获取前置/后续知识点，手动构建节点列表
- 如果无法判断哪些节点有课件 → 所有前序/后续节点均渲染为"无课件"虚线框
- 如果课件模块较少（< 3 个教学模块） → 核心子知识点至少拆出 3 个子节点
- 绝不因为数据不完整而省略知识图谱 section

#### 10.2.4 视频播放器规范（强制）

> ⚠️ **铁律**：课件中所有视频**必须**使用 HTML `<video>` 标签静态嵌入，**禁止**仅用 JavaScript 动态创建视频元素。视频**必须嵌入到对应知识模块的 section 内部**，不可集中放在某个独立区域。

**优先交互演示原则**：
> 对于过程性变化（函数图像变化、实验过程、地理变迁等），**优先使用 CSS/JS/Canvas/SVG 交互动画**在 HTML 课件中直接实现。交互动画允许学生拖拽参数、点击触发，学习效果优于被动观看视频。仅当交互方式无法覆盖（如真实实验录像、复杂 3D 渲染）时，才使用 `<video>` 嵌入静态视频。

**优先级决策**：
| 优先级 | 方式 | 适用场景 | 示例 |
|:---|:---|:---|:---|
| 🥇 首选 | CSS/JS/Canvas/SVG 交互动画 | 参数可调的过程、几何变换、函数图像、简单物理模拟 | 拖拽滑块改变 k 值看直线旋转 |
| 🥈 次选 | Remotion 生成视频（L2） | 多步骤连续过程、需要精确时间线控制 | 细胞分裂全过程动画 |
| 🥉 保底 | `<video>` 嵌入静态视频 | 真实实验录像、外部视频素材 | 真实化学实验操作视频 |

**标准视频嵌入模板**（当确需使用 `<video>` 时）：

```html
<div class="video-player">
  <video controls preload="metadata" playsinline width="100%">
    <source src="./assets/experiment-demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</div>
<p class="video-caption">🎬 实验过程演示</p>
```

**强制属性**：
| 属性 | 必选 | 说明 |
|:---|:---|:---|
| `controls` | ✅ | 显示浏览器原生播放控件 |
| `preload="metadata"` | ✅ | 预加载元信息（时长、尺寸），不预加载完整视频 |
| `playsinline` | ✅ | 移动端内联播放，避免自动全屏 |
| `width="100%"` | ✅ | 响应式宽度 |
| `.video-player` 外包容器 | ✅ | 统一圆角和阴影样式 |
| `.video-caption` 说明文字 | ✅ | 视频下方居中说明 |

**Remotion 生成的视频**：L2 渲染完成后，将 `out/*.mp4` 复制到课件的 `assets/` 目录，然后在 HTML 中用上述模板嵌入。

#### 10.2.5 音频播放器规范（L3 强制）

> ⚠️ **铁律**：L3 语音讲解生成后，课件**必须**包含完整的音频播放器 UI（底部悬浮控制条 + 滚动自动播放）。**禁止**只添加隐藏的 `<audio>` 标签而不提供任何播放控件。

**标准音频播放器架构**（已内置于 HTML 骨架模板的 JS 中）：

```
  用户滚动到 Section 3 → IntersectionObserver 触发 → 自动播放 seg03 音频

┌─── 课件内容 ──────────────────────────────────────────────┐
│  [Section 1] 一次函数的定义        ← 滚动到此自动播放 seg01 │
│  [Section 2] 函数图像的画法        ← 滚动到此自动播放 seg02 │
│  [Section 3] k 和 b 的意义  ← 当前可见 → 自动播放 seg03   │
│  [Section 4] 实际应用              ← 滚动到此自动播放 seg04 │
└────────────────────────────────────────────────────────────┘
┌─── 底部悬浮控制条（.audio-bar） ──────────────────────────┐
│  模块3：k和b的意义  ▶/⏸  [━━━━━●━━━] 2:15  [1.25x]  字幕 │
└────────────────────────────────────────────────────────────┘
```

**核心交互**：
- **滚动自动播放**：IntersectionObserver 监听每个 section，当 section 进入视口（threshold: 0.4）时自动播放对应音频段
- **底部悬浮控制条**：显示当前播放段落标题、播放/暂停按钮、进度条、时间显示、调速按钮、字幕
- **可调速**：支持 0.5x / 1x / 1.25x / 1.5x / 2x 五档调速，点击循环切换
- **暂停/继续**：点击 ▶/⏸ 按钮暂停或继续当前音频
- **自动连播**：当前段播完自动播放下一段

**数据注入格式**：

AI 在 L3 完成后，必须在 `<script>` 标签最前面注入 `audioPlaylist` 数组：

```html
<script>
  const audioPlaylist = [
    { id: "seg01", sectionId: "module-1", title: "模块1：一次函数的定义", src: "./public/tts/seg01_zh.mp3", subtitle: "一次函数是形如 y=kx+b 的函数…" },
    { id: "seg02", sectionId: "module-2", title: "模块2：函数图像的画法", src: "./public/tts/seg02_zh.mp3", subtitle: "画一次函数图像只需要两个点…" },
    // ... 每个知识模块一段，sectionId 对应 HTML 中 section 的 id
  ];
</script>
```

> ⚠️ **关键**：每个条目的 `sectionId` 必须精确匹配 HTML 中对应 section 的 `id` 属性，否则滚动自动播放无法触发。

**播放器功能清单**：
| 功能 | 必选 | 说明 |
|:---|:---|:---|
| 底部悬浮控制条 | ✅ | `.audio-bar`，固定底部，显示当前播放信息 |
| 滚动自动播放 | ✅ | IntersectionObserver 监听 section 可见性，自动切换并播放对应音频 |
| 播放/暂停 | ✅ | ▶/⏸ 切换 |
| 调速（5档） | ✅ | 0.5x / 1x / 1.25x / 1.5x / 2x，点击循环切换 |
| 进度条 | ✅ | 可点击跳转，实时更新 |
| 时间显示 | ✅ | 当前播放时间 |
| 字幕显示 | ✅ | 当前段落的文字内容（在控制条内） |
| 自动连播 | ✅ | 一段播完自动播放下一段 |

### 10.3 视觉设计规范（按学段分级）

根据学生年龄特点，提供三套视觉风格模板。**生成课件时必须先判断学段，选择对应模板**。

| 学段 | 模板文件 | 风格关键词 | 背景 | 配色 |
|:---|:---|:---|:---|:---|
| **小学**（1-6 年级） | `elementary.html` | 明亮活泼、圆角卡通、彩虹糖果色 | 暖白 `#fffbf0` | 珊瑚红 + 薄荷绿 + 阳光黄 |
| **初中**（7-9 年级） | `middle-school.html` | 清新明快、蓝绿渐变、适度活泼 | 浅灰白 `#f8fafc` | 天蓝 + 青绿 + 琥珀 |
| **高中**（10-12 年级） | `high-school.html` | 沉稳专业、深色主题、学术质感 | 深蓝 `#0f172a` | 淡蓝 + 淡紫 + 金黄 |

#### 小学模板配色（`elementary.html`）
```css
:root {
  --bg: #fffbf0;       /* 暖白主背景 */
  --primary: #ff6b6b;  /* 珊瑚红 */
  --secondary: #4ecdc4;/* 薄荷绿 */
  --accent: #ffe66d;   /* 柠檬黄 */
  --purple: #cc5de8;   /* 葡萄紫 */
  --orange: #ff922b;   /* 橙子橙 */
  --card: #ffffff;     /* 纯白卡片 */
}
```
- 圆角 20px，卡片带阴影 `box-shadow: 0 4px 16px rgba(0,0,0,0.04)`
- 标题用 `font-weight: 900`，彩虹渐变文字动画
- 图标带 `bounce` 弹跳动画，选项点击带 `popIn` 缩放动画
- 答对反馈用 🎉 和鼓励语（"太棒了！"），答错反馈用 💪 和鼓励语（"没关系！"）
- 闯关式练习结构（"第一关：基础小达人" → "第二关：应用小能手" → "第三关：挑战小学霸"）
- 导航栏 emoji：🌈

#### 初中模板配色（`middle-school.html`）
```css
:root {
  --bg: #f8fafc;       /* 浅灰白背景 */
  --primary: #3b82f6;  /* 天蓝 */
  --secondary: #06b6d4;/* 青绿 */
  --accent: #f59e0b;   /* 琥珀 */
  --teal: #14b8a6;     /* 水鸭绿 */
  --card: #ffffff;     /* 白色卡片 */
}
```
- 圆角 14px，卡片带轻柔阴影
- 目标卡片顶部带 3px 彩色条（每张不同色）
- 节标题左侧用渐变色竖线（`border-image: linear-gradient(...) 1`）
- 选项 hover 时带 `translateX(3px)` 右移效果
- 正式但不刻板的反馈语气（"正确！" / "再想想。"）
- 标准 Level 1/2/3 练习结构
- 导航栏 emoji：🎓

#### 高中模板配色（`high-school.html`）
```css
:root {
  --bg: #0f172a;       /* 深蓝背景 */
  --primary: #60a5fa;  /* 淡蓝 */
  --secondary: #a78bfa;/* 淡紫 */
  --accent: #fbbf24;   /* 金黄 */
  --card: rgba(30, 41, 59, 0.65); /* 半透明毛玻璃 */
}
```
- 圆角 12px，`backdrop-filter: blur(10px)` 毛玻璃效果
- 目标卡片顶部用 2px 细线（精简克制）
- 独有组件：**公式框**（`.formula-box`，金黄强调色，衬线字体）、**推导步骤**（`.derivation`，编号圆点步进式）
- 选项 hover 无位移，仅背景色变化（克制感）
- 简洁反馈语气（"正确！" / "再想想。"）
- 导航栏品牌用 `<strong>` 区分中英文而非纯 emoji

**通用排版规范**（三套模板共享）：
- 正文字号：15-16px，行高 1.75-1.85
- 公式/代码：`Times New Roman` 或等宽字体
- 响应式网格：`grid-template-columns: repeat(auto-fit, minmax(260-340px, 1fr))`
- 间距：模块间 `margin: 40-46px 0`，卡片间 `margin-bottom: 16-20px`
- 全部支持移动端响应式（`@media max-width: 600px`）

**Remotion 动画规范**（如需要）：
- 分辨率 1920×1080，帧率 30fps
- 单 Composition 600-900 帧（20-30 秒）
- 每个 Composition 3-5 个场景
- 动画风格：`interpolate` + `spring`，渐入渐出
- 配色与 HTML 课件保持统一

### 10.4 AI 多模态互动区（适用场景默认插入）

对于适合**视觉化表达**的学科内容（尤其语文、历史、地理、美术等人文学科），课件中**默认生成**"AI 多模态互动区"——预留的交互式占位区域，教师或学生可通过 AI API 生成图片/视频内容填充。

> ⚠️ **默认规则**：当课题属于文科或涉及视觉化内容时，AI 必须自动插入互动区，不需要用户要求。仅在纯理科计算课、纯习题课时才跳过（需在 Generation Gate 中标注跳过理由）。

#### 使用场景

| 场景 | 说明 | 示例 |
|:---|:---|:---|
| **教师备课时插入** | 教师使用自己的多模态 API 生成图片/视频，嵌入课件 | 历史课：生成"丝绸之路商队"插图 |
| **学生课中创作** | 学生撰写提示词，课件调用 API 生成作为作品 | 语文课：根据诗句意境写提示词，AI 生成意境画 |
| **课后拓展任务** | 作为创新挑战题，学生用 AI 辅助完成创作 | 地理课：生成"板块运动示意动画" |

#### HTML 实现规范

在课件中使用以下 HTML 结构标记多模态互动区：

```html
<!-- AI 多模态互动区 -->
<div class="teachany-media-zone" 
     data-zone-type="image"
     data-suggested-prompt="一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画，远处有雪山和古城"
     data-context="历史·丝绸之路·情境导入">
  <div class="media-zone-placeholder">
    <div class="zone-icon">🎨</div>
    <div class="zone-title">AI 图片创作区</div>
    <div class="zone-desc">在此输入提示词，使用 AI 生成与课程相关的图片</div>
    <textarea class="prompt-input" placeholder="描述你想要生成的图片..."></textarea>
    <div class="zone-actions">
      <button class="btn-generate" onclick="generateMedia(this)" disabled>
        🖼️ 生成图片（需配置 API）
      </button>
      <button class="btn-upload" onclick="uploadMedia(this)">
        📁 上传本地图片
      </button>
    </div>
    <div class="media-result"></div>
    <div class="zone-hint">
      💡 参考提示词：<em>一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画</em>
    </div>
  </div>
</div>
```

#### 属性说明

| 属性 | 必填 | 说明 |
|:---|:---|:---|
| `data-zone-type` | ✅ | `image` / `video` / `audio` |
| `data-suggested-prompt` | ✅ | AI 建议的提示词（中文），帮助教师/学生快速生成 |
| `data-context` | ✅ | 学科·主题·用途，便于管理和理解 |

#### 交互逻辑

1. **默认状态**：显示占位区 + 建议提示词 + "上传本地图片"按钮（始终可用）
2. **教师配置 API 后**：激活"生成"按钮，可通过 API 直接生成
3. **学生模式**：学生填写自己的提示词 → 点击生成 → 作品展示在互动区（作为学习产出）
4. **降级方案**：如无 API，教师可直接上传本地图片/视频

#### 何时生成互动区

AI **默认在以下位置自动插入** AI 多模态互动区：

| 条件 | 插入位置 |
|:---|:---|
| 文科课题的 ABT 情境导入 | 导入区域（生成情境图片） |
| 项目制课的成果展示阶段 | 作品创作区域 |
| 跨学科融合课中的"图→文"或"文→图"转化 | 创作任务区域 |
| 创新挑战题（⭐⭐⭐）涉及视觉创作 | 挑战题区域 |
| 理科课题中有实验装置/现象观察 | 实验示意图区域 |
| 用户明确要求"加入 AI 创作环节" | 用户指定位置 |

**仅以下情况跳过**（需在 Generation Gate 中标注跳过理由）：
- 纯计算/纯公式推导课（无视觉化内容）
- 纯习题课（练习为主，不需要视觉创作）
- 纯复习课（知识梳理为主）

#### 10.4.1 AI 主动生图规范（课件生成阶段）

> ⚠️ **这不是用户运行时的 API 调用**，而是 **AI 在生成课件代码时主动调用 `image_gen` 工具**，生成插图并直接嵌入 HTML。

**核心原则**：文科课件（语文、历史、地理、美术）和情境导入强化型理科课件中，AI **必须在生成课件的同时主动生成配图**，不能只留占位符。

**触发条件与生图位置**：

| 条件 | 生图位置 | prompt 策略 | 示例 |
|:---|:---|:---|:---|
| **文科 ABT 情境导入** | Hero 区或模块导入卡片 | "一幅描绘【场景】的【风格】插画，教育类，清晰明亮" | 历史课："一幅描绘丝绸之路商队穿越沙漠的水彩插画，远处有雪山和古城，教育风格" |
| **语文诗词/散文意境** | 课文赏析模块 | "【诗词名】意境图，中国水墨风格，【具体意象】" | "静夜思意境图，中国水墨风，月光洒在窗前，游子独坐思乡" |
| **历史场景还原** | 时间线节点 / 史料对读区 | "【历史事件】场景插画，历史教育风格" | "商鞅变法场景，秦国城门立木取信，围观百姓，教育插画风格" |
| **地理地貌/气候** | 地图标注区 / 成因分析模块 | "【地理现象】示意图，科学教育风格" | "板块碰撞形成喜马拉雅山脉的示意图，剖面图风格，标注关键构造" |
| **生物结构/过程** | 结构讲解区 | "【生物结构/过程】科学插图，标注清晰" | "植物细胞结构图，标注细胞壁、叶绿体、液泡，教育风格" |
| **角色任务型情境** | 角色介绍卡 | "一个【角色身份】的卡通形象，友好亲切" | "一个穿着探险服的中学生卡通形象，手持放大镜" |

**生图执行流程**：
```text
1. AI 在编写 HTML 课件时识别需要插图的位置
2. 调用 image_gen 工具生成图片（prompt 遵循上表策略）
3. 图片保存到课件目录下的 assets/ 文件夹
4. 在 HTML 中以 <img src="./assets/xxx.png" alt="描述文字"> 嵌入
5. 同时保留 AI 多模态互动区的占位符（供教师/学生二次创作）
```

**生图质量参数**：
| 参数 | 推荐值 | 说明 |
|:---|:---|:---|
| `size` | `1024x1024` | 正方形插图 |
| `quality` | `medium` | 平衡质量与速度 |
| `style` | `natural` | 教育场景优先自然风格 |

**降级策略**：
- 如果 `image_gen` 不可用（环境限制），保留 AI 多模态互动区占位符 + `data-suggested-prompt`，并在课件中添加提示："此处建议插入 AI 生成的插图，参考提示词：..."
- 绝不因为生图不可用而省略整个互动区

#### 10.4.2 AI 主动生视频规范（课件生成阶段）

> 当课件内容涉及**过程性变化**（理科实验、地理变化、历史演变、生物过程），AI 应评估是否适合生成短视频。

**适用场景**：

| 场景类型 | 示例 | 视频类型 | 推荐时长 |
|:---|:---|:---|:---|
| **理科实验过程** | 电解水、酸碱中和 | 实验步骤动画 | 10-20 秒 |
| **地理变化过程** | 板块漂移、冰川消融、四季更替 | 地球科学动画 | 15-30 秒 |
| **生物生命过程** | 细胞分裂、种子萌发、心脏跳动 | 生物过程动画 | 10-20 秒 |
| **历史演变** | 领土变迁、城市发展 | 时间推移动画 | 15-30 秒 |
| **数学动态变化** | 函数图像变化、几何变换 | 参数动画 | 10-15 秒 |

**执行策略**：
1. **🥇 首选 CSS/JS/Canvas/SVG 交互动画**：对于参数可调的过程（函数图像变化、简单物理模拟、几何变换等），直接在 HTML 课件中用交互组件实现，学生可拖拽参数、点击触发、实时观察变化
2. **🥈 次选 Remotion 生成视频（L2）**：如果 Generation Gate 标注 L2="需要"，且内容为多步骤连续过程（如细胞分裂全过程），通过 Remotion 生成教学动画
3. **🥉 保底 `<video>` 嵌入**：真实实验录像、外部视频素材等交互无法覆盖的内容，使用 `<video>` 标签嵌入

**视频嵌入规范**（⚠️ 硬规则，详见 10.2.4）：

> 视频**必须嵌入到对应知识模块的 section 内部**。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化；仅当交互无法覆盖时，使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签静态嵌入，外包 `.video-player` 容器。**禁止**仅用 JS 动态创建视频元素。

```html
<!-- AI 生成的教学短视频 — 必须嵌入到对应知识模块的 section 内部 -->
<!-- ⚠️ 优先用 CSS/JS/Canvas/SVG 交互动画代替静态视频 -->
<div class="video-player" data-context="物理·电解水·实验过程">
  <video controls preload="metadata" playsinline width="100%">
    <source src="./assets/experiment-demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</div>
<p class="video-caption">🎬 电解水实验过程演示</p>
```

### 10.5 WorkBuddy 多 Agent 协作流水线

> ⚠️ **本节定义 AI 在生成课件时如何利用 `task` 工具调用多个 subagent 并行协作，大幅提升课件质量和生成效率。**
>
> **适用环境**：WorkBuddy / CodeBuddy 等支持 `task` 工具的 AI 编程助手。如果运行环境不支持 `task` 工具，AI 应退回到单线程串行生成模式。

#### 协作架构

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    TeachAny 多 Agent 协作流水线                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    Phase 0-2    ┌────────────────────────────────┐ │
│  │ 主 Agent     │──────────────→│ 完成教学设计（6问+骨架+Gate）    │ │
│  │ (Orchestrator)│               └────────────────────────────────┘ │
│  └──────┬──────┘                                                   │
│         │ Phase 3：并行分发任务                                      │
│         ├──────────────────┬──────────────────┬───────────────────┐ │
│         ▼                  ▼                  ▼                   ▼ │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ Agent A      │  │ Agent B       │  │ Agent C       │  │Agent D │ │
│  │ 中文课件     │  │ 英文课件(可选)│  │ 插图生成      │  │ TTS    │ │
│  │ index.html   │  │ index_en.html │  │ image_gen ×N  │  │ 语音   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘ │
│         │                │                  │               │      │
│         └────────────────┴──────────────────┴───────────────┘      │
│                                    │                                │
│                          ┌────────▼────────┐                       │
│                          │ 主 Agent 汇总    │                       │
│                          │ Completeness Gate│                       │
│                          │ + 打包           │                       │
│                          └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Agent 角色分工表

| Agent | 职责 | 输入 | 输出 | 触发条件 |
|:---|:---|:---|:---|:---|
| **主 Agent（Orchestrator）** | Phase 0-2 教学设计 + Generation Gate + 最终审查 | 用户需求 + 知识图谱数据 | 教学骨架 JSON（含 ABT、问题链、练习设计等） | 始终执行 |
| **Agent A：中文课件** | 生成 `index.html` | 教学骨架 + HTML 骨架模板 + 学段 CSS | 完整中文课件 HTML | 始终执行 |
| **Agent B：英文课件** | 生成 `index_en.html` | 教学骨架 + HTML 骨架模板 + 学段 CSS | 完整英文课件 HTML | 用户明确要求双语时执行（默认跳过） |
| **Agent C：插图生成** | 调用 `image_gen` 生成课件配图 | ABT 场景描述 + 生图 prompt 列表 | `assets/*.png` 图片文件 | 文科课件或 Gate 标注"需要插图" |
| **Agent D：TTS 语音** | 安装 edge-tts + 生成语音 + 字幕 | 旁白脚本 JSON | `public/tts/*.mp3` + `*.srt` | 默认执行（用户拒绝时跳过） |
| **Agent E：质量审查**（可选） | 对 Agent A/B 产出的 HTML 做 Completeness Gate 审查 | 课件 HTML + 审查清单 | 审查报告 + 修复建议 | 环境支持 ≥ 5 并行 Agent 时 |

#### 执行流程（标准模式）

```text
Step 1：主 Agent 完成 Phase 0 → 0.5 → 1 → 2 → Generation Gate
        输出：教学骨架文档（包含 ABT 设计、问题链、练习题、旁白文案、生图 prompt 列表）

Step 2：主 Agent 并行调用 task 工具分发任务
        ├── task(Agent A): "根据以下教学骨架和 HTML 骨架模板（10.2.1）生成中文课件 index.html..."
        ├── task(Agent B): "将以下中文教学骨架翻译为英文，生成 index_en.html..."  ← 仅用户要求双语时分发
        ├── task(Agent C): "为以下课件生成 N 张插图，prompt 列表如下..."
        └── task(Agent D): "根据以下旁白脚本，安装 edge-tts 并生成 TTS 语音和字幕..."

Step 3：主 Agent 收集所有 Agent 输出
        ├── 将 Agent C 的插图路径更新到 Agent A/B 的 HTML 中
        ├── 将 Agent D 的音频路径嵌入 HTML 的 <audio> 标签
        └── 执行 Completeness Gate 审查

Step 4：主 Agent 执行打包（Phase 3.5）并交付
```

#### task 调用 prompt 模板

**Agent A（中文课件）调用模板**：
```
你是 TeachAny 课件开发 Agent。请根据以下教学骨架，使用 HTML 骨架模板生成完整的中文互动课件 index.html。

【教学骨架】
{Generation Gate 输出的完整骨架}

【强制规则】
1. 必须使用 Section 10.2.1 的 HTML 骨架模板
2. CSS 变量使用 {学段} 模板配色
3. 必选 section 不可删除：Hero、学习目标、前测、知识模块×{N}、综合任务、后测、小结、**知识图谱**
4. 每个模块遵循 6 块结构（ABT→讲解→深层理解→练习→纠错→小结）
5. 插图位置用 <img src="./assets/placeholder-{N}.png" alt="..."> 占位（Agent C 会生成实际图片）
6. 音频：注入 audioPlaylist 数组（每个条目含 sectionId 对应 HTML 中 section 的 id），骨架内置的音频引擎会自动实现滚动播放+底部控制条
7. 视频：优先使用 CSS/JS/Canvas/SVG 交互动画演示过程性变化；仅交互无法覆盖时用 <video controls preload="metadata" playsinline> 标签嵌入（见 10.2.4）。视频必须嵌入到对应模块 section 内部
8. 知识图谱：在 <script> 最前面注入 knowledgeGraphData 对象（见 10.2.3），数据从教学骨架中的 prerequisites/leads_to 提取

请生成完整的 index.html 文件。
```

**Agent C（插图生成）调用模板**：
```
你是 TeachAny 插图生成 Agent。请为以下课件生成配图。

【生图任务列表】
1. 文件名: hero-scene.png | prompt: "{ABT 情境描述}" | size: 1024x1024 | quality: medium
2. 文件名: module1-intro.png | prompt: "{模块1情境描述}" | size: 1024x1024 | quality: medium
...

请依次调用 image_gen 工具生成每张图片，保存到 {课件目录}/assets/ 下。
```

#### 降级策略

| 环境能力 | 策略 |
|:---|:---|
| 支持 `task` 工具 + 支持 `image_gen` | 完整多 Agent 协作（A+B+C+D 并行） |
| 支持 `task` 工具，不支持 `image_gen` | A+B+D 并行，C 降级为占位符 |
| 不支持 `task` 工具 | 单 Agent 串行模式（按 Phase 顺序执行），在 Generation Gate 中标注"单 Agent 模式" |

**单 Agent 串行模式的执行顺序**：
```text
中文课件 → 英文课件 → 插图生成（如支持） → TTS 语音 → Completeness Gate → 打包
```

---

## 十一、课件开发标准流程（强制检查点工作流）

> ⚠️ **铁律**：以下 Phase 0 → 0.5 → 1 → 2 → Generation Gate → 3 → Completeness Gate → 4 → Output Decision 是**串行强制流程**。
> 每个 Phase 末尾都有 `✅ 通过条件`，**未满足通过条件时禁止进入下一个 Phase**。
> 如果某个 Phase 的通过条件无法满足，必须在输出中明确标注跳过原因。

### Phase 0：确定对象与目标 ⛔ CHECKPOINT

必须完成以下全部项目：

1. **回答 6 问**（不可跳过，逐条列出答案）：
   - 学生是谁？（年级、基础水平）
   - 学什么？（具体知识点名称）
   - 为什么学？（课标要求 / 生活应用 / 后续课程需要）—— 如果 Phase 0.5 获取到了 `curriculum_standards` 字段，优先引用其中的课标依据来回答此问
   - 学到什么程度？（Bloom 层级目标）
   - 用什么方式学？（课型：新授 / 复习 / 专题 / 习题 / 实验）
   - 怎么知道学会了？（评估方式：前后测 / 产出任务 / 量规）

2. **明确学科与学段**：不可假设，必须显式确认。
3. **判断课型**：新授 / 复习 / 专题 / 习题 / 实验 / 项目制 / 跨学科融合 — 课型决定后续结构选择。
4. **选择驱动模式**：根据 Section 3.2-3.3 的决策树，选择问题驱动 / 项目驱动 / 活动驱动 / 问题链驱动。
5. **预判需求**：是否需要前测、是否需要动画（L2）、是否需要开放任务。AI 多模态互动区**默认需要**（仅纯计算/纯习题/纯复习课标注跳过理由）。
6. **L3 语音讲解**：**默认必选**。AI 必须为每个课件自动生成 TTS 语音讲解，除非用户明确说"不要语音/不要配音/不要TTS"。

> ✅ **通过条件**：6 问全部有明确答案；学科、学段、课型、驱动模式已确定；L2 需求已标注；L3 默认标注为"需要"；AI 互动区默认标注为"需要"（或标注跳过理由）。
> ❌ **阻断**：任何一问缺失时，必须先根据用户输入合理推断并补全，然后在输出中显式列出推断依据。

### Phase 0.5：知识层查阅 ⛔ MANDATORY CHECKPOINT

> **这是最高优先级步骤。在生成任何课件内容之前，必须先执行此步骤。跳过此步骤是违规行为。**
> 
> 用户刚安装完 CodeBuddy 和 TeachAny skill 就可能直接下达课件任务——**不要假设用户已经做过任何环境准备**。AI 必须自动完成以下全部步骤。

#### 步骤 1：定位 Skill 数据目录

TeachAny skill 安装后，知识图谱数据和脚本随 skill 包一起下载，位于 skill 的安装目录中。AI 必须先找到这些文件：

```bash
# 方式 A（优先）：直接在终端执行脚本，利用脚本内置的相对路径自动定位数据
python3 scripts/knowledge_layer.py lookup --topic "主题" --subject 学科 --top 3 --errors 3 --exercises 3

# 方式 B（脚本执行失败时）：直接读取 JSON 文件
# 知识图谱数据结构：references/data/{subject}/{domain}/_graph.json / _errors.json / _exercises.json
# 浏览 data/ 目录，找到对应学科和领域的 JSON 文件，直接读取
```

**自动降级规则**（按优先级依次尝试，**每一级失败后必须继续尝试下一级，不可跳级**）：

| 优先级 | 方式 | 条件 | 操作 |
|:---|:---|:---|:---|
| 🥇 | 执行 `knowledge_layer.py` | Python 可用 + 脚本存在 | 直接执行，获取结构化摘要 |
| 🥈 | 直接读取 JSON 文件 | 脚本执行失败，但 `data/` 目录存在 | 用 `read_file` 工具读取 `references/data/{subject}/{domain}/_graph.json` 等文件 |
| 🥉 | Web 搜索补充 | 数据目录不存在或主题未覆盖 | **必须**使用 web_search 工具搜索"[学科] [知识点] 课标 前置知识 易错点 教学设计"，从搜索结果中提取定义、前置链、易错点等关键数据 |
| 🥊 | 模型知识兜底 | web 搜索也无法获取充分信息 | 依赖模型自身知识，但必须标注 ⚠️ 并在输出中说明"此内容未经图谱或搜索验证" |

**关键**：
- 无论走哪条路径，最终都必须获取到知识层数据（或明确确认"未命中"）。
- **不允许因为脚本执行失败就跳过整个 Phase 0.5**。
- **🥉 Web 搜索是必经步骤**，不允许跳过搜索直接用模型知识。只有搜索也无法获取时才降级到 🥊。

#### 步骤 2：执行知识层检索

示例命令：
- `python3 scripts/knowledge_layer.py lookup --topic "欧姆定律" --subject physics`
- `python3 scripts/knowledge_layer.py lookup --topic "一次函数" --subject math`
- `python3 scripts/knowledge_layer.py lookup --topic "光合作用" --subject biology`

如果脚本执行失败，按降级规则切换到方式 B：直接读取 JSON 文件。

#### 步骤 3：提取关键数据（命中时必须全部提取）

从 `_graph.json` 中提取：
- `definition`：精确定义 → 用于课件概念卡片
- `prerequisites`：前置知识链 → 用于前测设计和知识回顾模块
- `leads_to`：后续知识 → 用于"学了有什么用"模块
- `grade` / `semester` / `unit`：课标定位 → 用于校验 Phase 0 的年级判断
- `real_world`：真实场景 → 用于 ABT 引入和生活应用模块
- `curriculum_standards`：课标引用（可选字段）→ 结构化的课程标准引用，每条包含 `category`（类型标签：`core_competency` 核心素养 / `required_experiment` 必做实验 / `learning_task_group` 学习任务群 / `content_thread` 内容主线 / `cross_disciplinary` 跨学科实践 / `curriculum_change` 课标调整 / `teaching_requirement` 教学要求）和 `content`（原文）。**用途**：用于 Phase 0 第三问"为什么学"的课标依据、必做实验的教学设计、跨学科活动规划。**注意**：此字段是教师视角的教学设计参考，**不要**直接作为 ABT 场景展示给学生。
- `memory_anchors`：记忆锚点 → 用于助记和总结模块
- `bloom_verbs`：Bloom 行为动词 → 用于练习题设计

从 `_errors.json` 中提取：
- `description` / `diagnosis` / `trigger` / `frequency` → 用于设计针对性练习的干扰项和纠错反馈

从 `_exercises.json` 中提取：
- 与当前教学目标匹配的 `bloom_level` 题目 → 直接复用或改编进课件

#### 步骤 3.5：查阅教材补充数据（可选增强）⭐ NEW

> **这是质量提升步骤。在已获取知识图谱数据后，进一步查阅教材补充素材，用真实教材内容替代AI编造。**

**执行条件**：
- 步骤3已成功获取 `_graph.json` 数据
- 希望提升课件的真实性和教学性
- 对应学科存在教材补充数据

**操作流程**：

1. **检查教材补充数据是否存在**：
   ```bash
   # 检查是否有对应学科的教材补充目录
   ls references/data/textbook-supplements/{subject}/
   # 示例: ls references/data/textbook-supplements/math/
   #       ls references/data/textbook-supplements/biology/
   ```

2. **根据当前节点ID，读取相关素材文件**：
   
   可用的数据文件类型：
   - `teaching_methods.json` → 教学方法(如双栏解法、Visual Connection思考题)
   - `real_world_scenarios.json` 或 `phenomena_library.json` → 真实场景/日常现象
   - `analogies.json` → 类比隐喻/记忆锚点
   - `visual_strategies.json` → 可视化策略/图表设计
   - `experiment_designs.json` → 实验设计方案(理科)
   - `ecological_cases.json` → 生态学案例(生物学特有)
   
   示例：
   ```python
   # 读取数学学科的真实场景
   scenarios = read_json("references/data/textbook-supplements/math/real_world_scenarios.json")
   
   # 读取物理学科的日常现象
   phenomena = read_json("references/data/textbook-supplements/physics/phenomena_library.json")
   
   # 读取生物学科的教学方法
   methods = read_json("references/data/textbook-supplements/biology/teaching_methods.json")
   ```

3. **筛选匹配当前节点的数据**：
   ```python
   # 从教材数据中筛选适用于当前节点的内容
   current_node_id = "linear-function"  # 示例：一次函数
   
   relevant_items = [
       item for item in data["items"] 
       if current_node_id in item.get("applicable_node_ids", [])
   ]
   ```

4. **优先使用教材素材替代AI生成内容**：
   
   | 课件模块 | 优先使用的教材数据 | 降级方案 |
   |:---|:---|:---|
   | ABT引入场景 | `real_world_scenarios` / `phenomena_library` | `_graph.json` 的 `real_world` 字段 |
   | 记忆锚点/类比 | `analogies.json` | `_graph.json` 的 `memory_anchors` 字段 |
   | 实验设计 | `experiment_designs.json` | AI设计实验方案 |
   | 可视化设计 | `visual_strategies.json` 的描述 | AI生成可视化方案 |
   | 教学方法 | `teaching_methods.json` 的 `implementation_notes` | 通用教学方法 |
   | 生态案例(生物) | `ecological_cases.json` | `real_world_scenarios` |

5. **标注数据来源**：
   - 如果使用了教材素材，在课件中标注来源：`💡 来源: [教材名称] [章节]`
   - 在Phase 0.5输出中说明：`✅ 已引用教材补充数据（X条）`
   - 如果未命中教材数据，继续使用 `_graph.json` 数据（不强制要求教材数据）

**数据优先级（降级规则）**：

| 优先级 | 数据来源 | 适用场景 | 示例 |
|:---|:---|:---|:---|
| 🥇 | 教材补充数据 | 有精确匹配的node_id | 上海磁悬浮列车案例(College Algebra Ch1) |
| 🥈 | 知识图谱数据 | 教材数据未命中 | `_graph.json` 中的 `real_world` 字段 |
| 🥉 | Web搜索 | 图谱数据不充分 | 搜索"一次函数 生活应用 案例" |
| 🥊 | 模型知识 | 所有数据源都不充分 | AI编造案例(必须标注⚠️) |

**关键原则**：
- ✅ **真实性优先**：教材中的真实案例 > AI编造的虚构案例
- ✅ **补充增强**：教材数据用于补充图谱，不替代图谱核心数据(如定义、前置知识链)
- ✅ **冲突处理**：如果教材数据与图谱数据冲突，以图谱数据为准(图谱经过课标校验)
- ✅ **可选性**：此步骤是增强项，未命中教材数据不阻断流程

**输出示例**：

```
✅ Phase 0.5 完成
- 知识图谱命中: linear-function (一次函数)
- 教材补充数据:
  • 真实场景: 上海磁悬浮列车距离函数 (OpenStax College Algebra Ch1, p.45)
  • 类比隐喻: 斜率=爬楼梯陡度 (OpenStax Prealgebra 2e Ch3, p.320)
  • 可视化策略: 四象限多表征法 (Prealgebra 2e Ch4)
- 数据来源优先级: 🥇教材数据(3条) + 🥈图谱数据
```

#### 步骤 4：补充读取（仅在摘要不够时）

- 根据检索结果去读 `references/data/{subject}/{domain}/_graph.json` 原文
- 必要时补读 `_errors.json`、`_exercises.json`
- **禁止**在没有命中的情况下大范围遍历多个 domain

#### 步骤 5：处理未命中情况

如果知识层没有对应数据（🥇🥈 均失败）：

1. **必须执行 Web 搜索**（🥉）：
   - 搜索关键词示例：`"[学科] [知识点] 课标要求 前置知识"` `"[知识点] 常见错误 易错点 教学"` `"[知识点] 真实应用 生活场景"`
   - 从搜索结果中提取：定义、前置知识链、真实场景、常见错误、教学建议
   - 将搜索到的信息整理为与图谱格式一致的结构化数据

2. **仅当搜索也不充分时**（🥊）：
   - 在输出中明确标注：**⚠️ 此主题未命中知识层且搜索结果不充分，以下内容由模型知识生成，准确性可能较低**
   - 依赖模型自身知识生成内容，但必须更加谨慎地校验事实准确性

#### 硬规则

- **先检索，后细读**
- **先 node，后 domain**
- **先摘要，后原文**
- **脚本失败不等于跳过**——必须降级到直接读 JSON
- **JSON 缺失不等于跳过**——必须降级到 Web 搜索
- **Web 搜索失败才能用模型知识**——不可跳过搜索直接用模型知识
- **优先复用图谱中的定义、前置链、真实场景、易错点、题目，不重复现编**
- **若图谱已有足够内容，课件文案、前测、练习、反馈必须从图谱派生，禁止重新发明一套**

> ✅ **通过条件**：已获取知识层数据（通过脚本、直接读取 JSON 或 Web 搜索）；已提取可用字段（或明确标注未命中+降级路径+搜索记录）。
> ❌ **阻断**：未尝试任何方式获取知识层数据就开始写内容 = 违规。跳过 Web 搜索直接用模型知识 = 违规。

### Phase 1：搭建教学骨架 ⛔ CHECKPOINT

必须完成以下全部项目：

1. **ABT + 情境角色引入设计**：为每个核心模块写 ABT 开场 + 选择情境模式（角色任务/故事冲突/生活现象/文化传承）
   
   - **数据来源优先级**（ABT引入场景选择）：
     1. 🥇 **教材补充数据优先**：如果Phase 0.5查到了 `real_world_scenarios.json` 或 `phenomena_library.json` 中匹配当前节点的场景,**必须优先使用**
        - ✅ 示例：一次函数用"上海磁悬浮列车"(OpenStax College Algebra)，而非AI编造的"打车费用"
        - ✅ 示例：浮力用"潜水员水压变化"(OpenStax HS Physics)，而非抽象的"物体在水中"
        - 📝 标注来源：`💡 案例来源: [教材名称] [章节]`
     
     2. 🥈 **知识图谱数据降级**：如果教材数据未命中，使用 `_graph.json` 的 `real_world` 字段
     
     3. 🥉 **AI生成兜底**：仅当以上两者都无法提供时，AI生成场景(但必须标注⚠️"此场景由AI生成")
   
   - **`real_world` 与 `curriculum_standards` 的用途区分**：
     - `real_world` (图谱) 或 `real_world_scenarios` (教材) → 面向学生的 ABT 引入和生活应用模块（"你遇到过这样的情况吗？"）
     - `curriculum_standards` → 面向教学设计的参考依据，用于 Phase 0 "为什么学"、必做实验规划、跨学科活动设计，**不直接展示给学生**
     - 特殊情况：`curriculum_standards` 中 `category=required_experiment` 的必做实验，可以转化为"动手做"环节的具体实验方案
   
   - **记忆锚点/类比的数据来源优先级**：
     1. 🥇 **教材类比优先**：如果Phase 0.5查到了 `analogies.json` 中的类比，优先使用教材中的类比而非AI编造
        - ✅ 示例：斜率用"爬楼梯陡度"(OpenStax Prealgebra)，而非"开车上坡"
        - ✅ 示例：分数用"切蛋糕"(OpenStax Prealgebra)，而非"分苹果"
     2. 🥈 **图谱记忆锚点**：使用 `_graph.json` 的 `memory_anchors` 字段
     3. 🥉 **AI生成类比**：AI编造类比(需验证科学性和文化适配性)
   
   - **交互实验生活化设计**（理科尤其是物理）：
     - 如果Phase 0.5查到了 `experiment_designs.json` 或 `phenomena_library.json` 中的实验方案，**优先参考教材中的实验步骤和注意事项**
     - 所有实验类交互组件（参数调节器、实验预测卡等）必须置于生活化场景中，**禁止纯抽象示意图**（详见 Section 6.4）
     - 类比和参照物选择必须贴近学生日常认知（用"大卡车"而非"牛顿"做力的类比）
     - 交互操作应模拟真实物理动作（拖拽放入=投放物体，滑块=调节深度/温度）
   
   - **教学方法借鉴**（可选增强）：
     - 如果Phase 0.5查到了 `teaching_methods.json` 中的方法，可参考其 `implementation_notes` 优化教学设计
     - ✅ 示例：数学解题用"双栏解法"(左栏解释why,右栏数学步骤)
     - ✅ 示例：生物学概念用"Visual Connection问题"(先展示图表,再提问引导思考)
     - ✅ 示例：化学解题用"Tro四步法"(Sort→Strategize→Solve→Check)
2. **驱动结构设计**：根据 Phase 0 选定的驱动模式，设计：
   - 问题驱动：核心问题 + 3-4 个子问题链（标注 Bloom 层级）
   - 项目驱动：大项目 + 3-5 个子项目阶段（标注阶段交付物）
   - 活动驱动：主题活动 + 3-5 个递进子活动（标注操作动词）
   - 问题链驱动：4 级问题链（Level 1→4，对应 Bloom 层级）
3. **知识点清单 + 内容三分法审计**：
   - 列出全部知识点
   - 每个知识点标注：讲解型 / 互动型 / 评估型，比例应大致为 3:4:3
4. **前置知识链**：
   - 使用 Phase 0.5 获取的 `prerequisites` 数据
   - 设计前测题（至少 2 题），检验学生是否具备前置知识
5. **学习记录单规划**：
   - 为每个探究活动/子任务选择记录单类型（观察/比较/项目规划/评价反思）
   - 记录单将在 Phase 3 中以互动卡片形式实现
6. **核心问题**：每个模块确定 1 个核心驱动问题（学生学完应该能回答的问题）

> ✅ **通过条件**：每个模块有 ABT + 情境引入；驱动结构已设计（问题链/项目阶段/活动序列）；知识点已列出并做了三分法标注；有前测设计；有学习记录单规划；每个模块有核心问题。
> ❌ **阻断**：没有前测 = 不通过；ABT 引入缺失 = 不通过；驱动结构缺失 = 不通过。

### Phase 2：选择学科模式 ⛔ CHECKPOINT

必须完成以下全部项目：

1. **查学科适配总表（第四节 4.1）**：
   - 确定讲解框架（如物理：现象观察 → 建模 → 定量分析）
   - 确定互动组件类型（如物理：参数调节、实验预测、图像判读）
   - 确定评估题型（如物理：预测题 + 计算题 + 解释题）
2. **标记难点，选五镜头组合**：
   - 至少选择 2-3 个镜头组合（看见、拆开、解释、比较、迁移）
   - 记录选择理由
3. **决定脚手架策略**：
   - 标记哪些任务需要分级支架（全支架 → 半支架 → 无支架）
4. **使用知识层数据交叉验证**：
   - `memory_anchors` → 融入助记设计
   - `bloom_verbs` → 校验练习题层级覆盖
   - `_errors.json` 的 `trigger` → 设计干扰项

> ✅ **通过条件**：学科模式已选择且与 4.1 表一致；五镜头组合已确定；脚手架策略已标记；知识层数据已融入设计。
> ❌ **阻断**：使用了错误学科的讲解框架 = 不通过（如物理课用了数学的"图形直觉→算理推导"）。

### ⛔ Generation Gate：内容生成前预检

> **在写任何 HTML/代码之前，必须先输出以下预检清单。这是一张"飞行前检查表"，缺项不允许起飞。**

请在开始 Phase 3 之前，输出以下结构化清单：

```
═══════════════════════════════════════════
📋 GENERATION GATE — 内容生成前预检
═══════════════════════════════════════════
【6 问答案】
  Q1 学生：___
  Q2 知识点：___
  Q3 为什么学：___
  Q4 学到什么程度：___
  Q5 课型：___
  Q6 评估方式：___

【课型判定】___（新授/复习/专题/习题/实验/项目制/跨学科融合）
【驱动模式】___（问题驱动/项目驱动/活动驱动/问题链驱动）
【情境模式】___（角色任务/故事冲突/生活现象/文化传承）
【学科模式】___ → 讲解框架：___ / 互动组件：___ / 评估题型：___
【知识层数据】（来源：🥇脚本 / 🥈JSON / 🥉Web搜索 / 🥊模型知识）
  - definition：✅已获取 / ⚠️未命中
  - prerequisites：✅已获取 / ⚠️未命中
  - real_world：✅已获取（N条） / ⚠️未命中
  - curriculum_standards：✅已获取（N条，类型：___） / ⚠️无课标引用
  - memory_anchors：✅已获取（N组） / ⚠️未命中
  - errors：✅已获取（N条） / ⚠️未命中
  - exercises：✅已获取（N题） / ⚠️未命中
  - 数据来源路径：___ （标注实际走的降级路径）
【五镜头选择】___ + ___ + ___（理由：___）
【脚手架策略】___
【驱动结构】
  - 问题驱动：核心问题=___ / 子问题数=___
  - 项目驱动：大项目=___ / 阶段数=___
  - 活动驱动：主题=___ / 子活动数=___
  - 问题链：Level 1-4 问题=___
【学习记录单】___类型 × ___个
【前测设计】___题
【L2 动画需求】✅需要 / ❌不需要
【L3 语音讲解】✅默认执行（除非用户明确拒绝 → ❌用户拒绝）
【AI 多模态互动区】✅默认插入（___处） / ❌跳过（理由：纯计算/纯习题/纯复习）
【模块数量】___个（3-5 个，与驱动结构的子问题/子活动/阶段数一致）
【HTML 骨架】✅使用标准骨架模板（Section 10.2.1）
【AI 主动生图】✅需要（___张，位置：___） / ❌不需要（纯计算/纯理科无情境）
【知识图谱数据】✅已从 _graph.json 提取（___个节点，___条边） / 🥉Web搜索构建（___个节点） / ⚠️降级为空图谱
【视频嵌入】✅有视频（___个，使用 <video> 标签） / ❌无视频内容
【音频播放器】✅默认启用（audioPlaylist 含___段，每段含 sectionId 关联对应 section） / ❌用户拒绝 L3
【Agent 协作模式】✅多 Agent 并行（A+C+D，用户要求双语时+B） / 🔶部分并行（___） / ❌单 Agent 串行（环境不支持 task 工具）
【双语课件】❌默认仅中文（用户明确要求双语时 → ✅生成英文版）
【课件打包】✅默认执行
═══════════════════════════════════════════
```

> ✅ **通过条件**：清单所有字段已填写；无"未确定"项。
> ❌ **阻断**：有任何字段为空或"待定" = 回到对应 Phase 补全。

### Phase 3：制作内容 ⛔ CHECKPOINT

按照 Generation Gate 的清单，执行内容制作：

**3.1 L1 互动课件（必选）**：
- **必须使用 Section 10.2.1 的 HTML 骨架模板**，禁止自行发明页面结构。导航使用 Sticky 顶部导航+前后翻页（见 10.2.2）
- **多 Agent 协作**：如果环境支持 `task` 工具，按 Section 10.5 的协作架构并行分发任务（Agent A 中文 + Agent C 插图 + Agent D TTS；用户要求双语时加 Agent B 英文）
- 写网页结构和卡片文案，遵守 Mayer 原则排版图文
- 每张卡片核心文字控制在 75 字左右
- **按驱动结构组织内容**：问题驱动→每个子问题一个模块；项目驱动→每个阶段一个模块；活动驱动→每个子活动一个模块
- **实现情境角色设计**：在导入区域体现角色身份和任务情境
- **AI 主动生图**：文科课件和情境导入强化型课件中，主动调用 `image_gen` 生成配图并嵌入 HTML（见 Section 10.4.1）
- 实现互动练习与反馈（不只是选择题，必须包含解释题或产出题）
- **实现学习记录单**：按 Phase 1 规划的记录单类型，以可填写的互动卡片形式嵌入课件
- 纠错反馈必须使用 `_errors.json` 的 `diagnosis` 数据（如有），不能只说"正确/错误"
- 前测 + 后测必须包含在内
- 每个模块必须有"学了马上用"的任务
- 涉及几何/图形/空间推理的题目必须配图（SVG/Canvas）
- Bloom 层级必须覆盖至少 3 级（如：记忆、理解、应用，或理解、应用、分析）
- **三段式作业**：综合练习区必须有 ⭐/⭐⭐/⭐⭐⭐ 分层设计
- **AI 多模态互动区**：默认在指定位置插入互动区 HTML（见 Section 10.4），仅 Generation Gate 标注"跳过"时才不插入
- **生活化交互场景**：物理/化学/生物的实验交互必须使用生活化场景（见 Section 6.4），禁止使用纯抽象示意图

**3.2 L2 教学动画（Generation Gate 标注"需要"时执行）**：

> ⚙️ **自动环境准备**：AI 在写 Remotion 代码之前，必须先自动完成环境搭建（详见第十五节 15.2）。用户不需要手动安装任何东西。

执行顺序：
1. **自动检测 + 安装依赖**（Node.js、npm、ffmpeg → 详见 15.2）
2. **生成项目配置**（package.json、tsconfig.json、remotion.config.ts）
3. **执行 `npm install`**
4. **编写 Remotion 动画组件**（`src/compositions/*.tsx`）
   - 分辨率 1920×1080，帧率 30fps
   - 单 Composition 600-900 帧（20-30 秒），3-5 个场景
   - 配色与 HTML 课件保持统一
5. **生成音效**（`node generate-sfx.js`）
6. **渲染视频**（`npm run build:all`）

**3.3 L3 AI 语音讲解（默认必选，自动执行）**：

> ⚠️ **L3 是默认必选项**。L1 课件生成完毕后，AI 必须立即自动执行 L3 语音生成流程，不需要等待用户确认。
> 仅当用户在最初下达任务时明确说了"不要语音/不要配音/不要TTS"时，才跳过此步骤。
>
> ⚙️ **自动环境准备**：AI 必须自动安装 edge-tts（详见第十五节 15.4）。用户不需要手动操作。

执行顺序：
1. **自动安装 edge-tts**：`pip3 install edge-tts`（如未安装）
2. **编写旁白脚本**（`scripts/narration_zh.json`；用户要求双语时另加 `narration_en.json`）
3. **生成 TTS 脚本**（`scripts/generate-tts.py`）
4. **执行语音生成**：`python3 scripts/generate-tts.py`
5. **生成 SRT 字幕**（`scripts/generate-srt.py`）
6. **执行字幕导出**：`python3 scripts/generate-srt.py zh`（用户要求双语时再执行 `en`）

> ✅ **通过条件**：L1 课件已完成（中文版）；L3 语音已生成（或用户明确拒绝）；L2 按 Gate 标注执行或跳过；课件已打包（Phase 3.5）。
> ❌ **阻断**：课件中没有互动练习 = 不通过；没有前测或后测 = 不通过；L3 未执行且用户未明确拒绝 = 不通过。

### ⛔ Completeness Gate：输出完整性审查

> **课件内容写完后、交付给用户之前，必须逐条核验以下 10 项审查清单。每项标注 ✅ 通过或 ❌ 未通过+修复方案。**

```
═══════════════════════════════════════════
🔍 COMPLETENESS GATE — 输出完整性审查
═══════════════════════════════════════════
□ 1. ABT + 情境引入：是否每个核心模块都有"为什么学"的叙事引入+情境角色？
     → ✅/❌ ___
□ 2. 五镜头覆盖：是否每个难点都用了至少 2 个镜头拆解？
     → ✅/❌ ___
□ 3. 产出任务：是否至少有 1 次真正的输出任务（产出题/开放任务/解释题）？
     → ✅/❌ ___
□ 4. 纠错反馈：练习的错误反馈是否有诊断性内容（不只是"正确/错误"）？
     → ✅/❌ ___
□ 5. 前后测：是否包含前测和后测，能看出学习效果？
     → ✅/❌ ___
□ 6. Bloom 覆盖：练习题是否覆盖至少 3 个 Bloom 层级？
     → ✅/❌ ___
□ 7. 注意力重置：模块间是否有注意力重置点（互动/提问/活动切换）？
     → ✅/❌ ___
□ 8. 脚手架分级：是否有从全支架→半支架→无支架的递进？
     → ✅/❌ ___
□ 9. 卡片字数：每张卡片核心文字是否控制在 75 字左右？
     → ✅/❌ ___
□ 10. 图文临近：相关图文是否贴近放置（Mayer 临近原则）？
     → ✅/❌ ___
□ 11. 驱动结构：内容组织是否遵循了选定的驱动模式（问题链/项目阶段/活动序列）？
     → ✅/❌ ___
□ 12. 学习记录单：探究活动是否配套了可填写的学习记录单？
     → ✅/❌ ___
□ 13. 三段式作业：综合练习是否有 ⭐/⭐⭐/⭐⭐⭐ 分层设计？
     → ✅/❌ ___
□ 14. AI 互动区（默认检查，仅 Gate 标注"跳过"时标 N/A）：是否在指定位置插入了多模态互动区？
     → ✅/❌/N/A ___
□ 15. 双语课件：用户要求双语时，是否生成了英文 index_en.html？
     → ✅/❌/N/A（用户未要求双语） ___
□ 16. 课件打包：是否生成了 manifest.json 并完成 .teachany 打包？
     → ✅/❌ ___
□ 17. 知识图谱溯源：课件核心内容是否可追溯到知识图谱/Web搜索/明确标注的来源？
     → ✅/❌ ___
□ 18. 版式一致性：是否使用了 Section 10.2.1 标准 HTML 骨架模板？导航是否为 Sticky 顶部导航+前后翻页？
     → ✅/❌ ___
□ 19. AI 主动生图（文科/情境课默认检查，纯理科计算课可标 N/A）：文科 ABT 导入和情境模块是否包含 AI 生成的配图？
     → ✅/❌/N/A ___
□ 20. Agent 协作记录：是否标注了本次使用的协作模式（多 Agent 并行 / 单 Agent 串行）？
     → ✅/❌ ___
□ 21. 知识图谱可视化：课件是否包含 `#knowledge-graph` section？`knowledgeGraphData` 是否已注入？当前节点是否高亮？有课件节点是否可点击跳转？无课件节点是否显示虚线框？
     → ✅/❌ ___
□ 22. 视频嵌入规范：所有视频是否使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签嵌入？是否有 `.video-player` 外包容器和 `.video-caption` 说明？是否存在仅用 JS 动态创建的视频？
     → ✅/❌/N/A（无视频内容） ___
□ 23. 音频播放器 UI：L3 语音是否通过 `audioPlaylist`（含 `sectionId`）注入？是否有底部悬浮控制条（播放/暂停+进度条+调速+字幕）？IntersectionObserver 滚动自动播放是否正常？是否存在只有隐藏 `<audio>` 标签而无播放 UI 的情况？
     → ✅/❌/N/A（用户拒绝 L3） ___
□ 24. Remotion 中文字体（仅 L2 执行时检查）：SubtitleTrack 的 fontFamily 是否包含 `'Noto Sans SC'` 降级？L2 环境是否执行了中文字体安装？
     → ✅/❌/N/A（未执行 L2） ___

【总评】___ / 24 通过（#14 仅纯计算/纯习题/纯复习课可标 N/A；#15 用户未要求双语时可标 N/A；#19 纯理科计算课可标 N/A；#22 无视频内容可标 N/A；#23 用户拒绝 L3 可标 N/A；#24 未执行 L2 可标 N/A）
【修复动作】（如有未通过项）___
═══════════════════════════════════════════
```

> ✅ **通过条件**：必检项（#1-#24）全部 ✅ 或 N/A（#14 仅纯计算/纯习题/纯复习课可 N/A；#15 用户未要求双语时可 N/A；#19 纯理科计算课可 N/A；#22 无视频内容可 N/A；#23 用户拒绝 L3 可 N/A；#24 未执行 L2 可 N/A），或未通过项已给出修复方案并执行修复。
> ❌ **阻断**：有 3 项以上 ❌ = 必须修复后再交付。

### Phase 4：交付与输出决策 ⛔ CHECKPOINT

1. **交付 L1 课件**（必选）：
   - 生成完整的 `index.html`（中文）
   - 如用户要求双语 → 同时生成 `index_en.html`（英文）
   - 确认所有互动功能可运行

2. **L3 语音确认**：
   - L3 语音已在 Phase 3.3 自动生成 → 在文件清单中列出生成的 mp3 和 srt 文件
   - 如用户明确拒绝了 L3 → 标注"用户要求跳过语音讲解"

3. **课件打包确认**：
   - Phase 3.5 打包已完成 → 在文件清单中列出 .teachany 包路径
   - 如打包脚本不可用 → manifest.json 已生成，提示用户手动打包

4. **L2 显式决策**：
   > 如果 Generation Gate 中 L2 标注为"不需要"，但课件中存在适合动画演示的内容（如物理实验过程、数学函数图像变化、化学反应过程），**必须主动提示用户**：
   >
   > "本课件中的 [具体内容] 适合用教学动画来增强效果。是否需要生成 L2 教学动画？"

5. **输出文件清单**：明确列出本次生成的所有文件路径。

> ✅ **通过条件**：课件已交付（中文版，用户要求时含英文版）；L3 已完成或用户已拒绝；课件已打包；L2 决策已完成（执行或已询问用户）；文件清单已列出。

---

## 十二、输出物要求与 L2/L3 触发机制

### 输出层级

| 层级 | 名称 | 是否必选 | 触发条件 |
|:---|:---|:---|:---|
| **L1** | 互动课件 | ✅ **必选** | 所有任务都必须生成 |
| **L2** | 教学动画 | 🔶 **显式决策** | 用户要求，或 Generation Gate 标注"需要" |
| **L3** | AI 语音讲解 | ✅ **默认必选** | 自动执行，除非用户明确拒绝 |

### L1 — 互动课件（必选，不可跳过）

- `public/index.html`：完整互动网页课件（中文）
- `public/index_en.html`：完整互动网页课件（英文）— **用户明确要求双语时生成**，默认仅中文
- 必须包含：练习题与答案反馈设计、前测/后测题组、模块化教学文案
- 推荐包含：开放任务量规

**L1 最低完整性标准**：
- [ ] 有 ABT 引入（每个核心模块）
- [ ] 有互动练习（不只选择题）
- [ ] 有诊断性反馈（不只"正确/错误"）
- [ ] 有前测和后测
- [ ] Bloom 覆盖 ≥ 3 级
- 不满足以上任何一项 = L1 未完成，禁止交付。

### L2 — 教学动画（显式触发）

**触发方式**（满足任一即触发）：
1. 用户明确要求"做视频/动画/Remotion"
2. Generation Gate 中 L2 标注为"需要"
3. Phase 4 中主动建议后用户确认

**文件清单**：
- `src/compositions/*.tsx`：教学动画组件
- `src/Root.tsx`：Remotion 注册文件
- `src/SfxPlayer.tsx`：音效播放器组件
- `src/SubtitleTrack.tsx`：双语字幕叠加组件
- `generate-sfx.js`：音效生成器
- `package.json` / `tsconfig.json` / `remotion.config.ts`：项目配置

### L3 — AI 语音讲解（默认必选，自动执行）

> ⚠️ **L3 与 L1 同为必选层级**。每个课件生成后，AI 必须自动安装 edge-tts 并生成语音文件，无需等待用户确认。
> **唯一跳过条件**：用户在下达任务时明确说了"不要语音""不要配音""不要TTS""不需要音频"等拒绝性表述。

**自动执行流程**（L1 课件完成后立即执行）：
1. 检测 Python → 缺失则自动安装
2. 检测 edge-tts → 缺失则自动 `pip3 install edge-tts`
3. 从课件内容中提取各模块的讲解文案，生成旁白脚本 JSON
4. 执行 `python3 scripts/generate-tts.py` 生成 mp3 语音文件
5. 执行 `python3 scripts/generate-srt.py zh` 生成 SRT 字幕
6. 将语音文件路径嵌入课件 HTML 的 `<audio>` 标签中

**降级策略**：
| 情况 | 处理方式 |
|:---|:---|
| edge-tts 安装失败（网络问题） | 保留旁白脚本 JSON，在课件中标注"语音文件待生成"，提示用户联网后执行 `pip3 install edge-tts && python3 scripts/generate-tts.py` |
| TTS 生成失败（网络中断） | 保留脚本文件，提示用户在网络正常时重新执行 |
| Python 不可用且无法安装 | 生成旁白脚本 JSON + generate-tts.py，提示用户安装 Python 后执行 |

**文件清单**：
- `scripts/narration_zh.json`：中文旁白脚本（含帧时间戳）
- `scripts/narration_en.json`：英文旁白脚本（含帧时间戳）
- `scripts/generate-tts.py`：Edge TTS 生成脚本
- `scripts/generate-srt.py`：SRT 字幕导出脚本
- `public/tts/*.mp3`：生成的语音音频文件
- `public/tts/*.srt`：生成的字幕文件

### L2 主动建议规则

L3 已默认执行，无需建议。以下规则仅适用于 L2 教学动画。即使用户未要求 L2，如果课件内容中存在以下情况，**必须在 Phase 4 交付时主动提示**：

| 课件内容特征 | 建议 |
|:---|:---|
| 理科实验过程（物理/化学/生物实验） | 建议 L2 动画演示实验过程 |
| 数学函数图像变化、几何变换 | 建议 L2 动画展示动态变化 |
| 地理气候变化、板块运动等过程 | 建议 L2 动画展示时空变化 |

---

## 十三、27 条硬规则（违反任何一条 = Completeness Gate 不通过）

> 以下规则在整个课件开发流程中**始终有效**，不可因"简化""省事""上下文不够"等理由绕过。

| # | 硬规则 | 违反后果 |
|:---|:---|:---|
| 1 | **先判断课型**（新授/复习/习题/专题/实验/项目制/跨学科融合），再选结构。不可假设所有任务都是"新授课"。 | 课型错误 → 整体结构需要重做 |
| 2 | **先判断学科**，再选讲解框架和互动组件。不可默认用数学模式。 | 学科模式错误 → Phase 2 不通过 |
| 3 | **不可默认所有知识点都要"公式推导"**。文科用文本细读，理科用现象观察，各有框架。 | 讲解框架不匹配 → 学生体验割裂 |
| 4 | **不可只有讲解，没有练习和反馈**。每个核心知识点至少配 1 道互动练习。 | 缺少练习 → Completeness Gate #3 不通过 |
| 5 | **不可只做选择题**。必须补充解释题、产出题或开放任务。 | 只有选择题 → Bloom 覆盖不足 → Gate #6 不通过 |
| 6 | **不可只顾页面好看，忽略学习闭环**。前测→讲解→练习→后测→反馈 缺一不可。 | 缺少闭环 → Gate #5 不通过 |
| 7 | **不可在没有必要时堆过多动画和装饰**。先保证内容完整，再考虑视觉效果。 | 装饰过多内容不足 → 内容审查不通过 |
| 8 | **文科类任务必须有脚手架分级和量规评价**。 | 缺少脚手架 → Gate #8 不通过 |
| 9 | **涉及几何/图形/空间推理的题目必须配图**。几何题用 SVG，坐标图用 Canvas，实验用标注插图。 | 纯文字几何题 → 教学不完整 |
| 10 | **必须执行 Phase 0.5 知识层查阅，且必须穷尽所有降级路径（脚本→JSON→Web搜索→模型知识）**。跳过此步骤或跳过中间降级层级是最高优先级违规。 | 跳过 Phase 0.5 → 整个流程无效 |
| 11 | **知识层数据可用时，课件内容必须从图谱派生**。禁止在有数据的情况下"重新发明"定义、场景、题目。 | 有数据不用 → 内容准确性和一致性降低 |
| 12 | **练习的错误反馈必须有诊断性内容**。不可只显示"正确/错误"，必须说明错在哪、为什么错。 | 无诊断反馈 → Gate #4 不通过 |
| 13 | **每张卡片核心文字控制在 75 字左右**。超长文本必须拆分为多张卡片。 | 超长卡片 → 认知负荷过高 → Gate #9 不通过 |
| 14 | **必须选择驱动模式并按对应结构组织内容**。不可没有驱动逻辑地"平铺"知识点。 | 无驱动结构 → Gate #11 不通过 |
| 15 | **AI 多模态互动区默认插入**。文科课题、项目制课、跨学科融合课、含视觉化内容的课题必须插入；仅纯计算/纯习题/纯复习课可跳过（需标注理由）。 | 应插未插 → Gate #14 不通过 |
| 16 | **L3 语音讲解默认必选**。L1 课件完成后必须自动安装 edge-tts 并生成语音文件。仅用户明确拒绝时跳过。不可因为"省事""节省 token""环境复杂"等理由擅自跳过。 | 无语音 → 课件体验不完整 → Phase 3 不通过 |
| 17 | **知识图谱未命中时必须执行 Web 搜索**。不可跳过 Web 搜索直接使用模型知识。搜索关键词需包含"课标""前置知识""易错点"等教学相关术语。 | 跳过搜索 → Phase 0.5 不通过 |
| 18 | **课件打包默认执行**。L1 课件完成后必须生成 manifest.json 并执行打包（Phase 3.5）。打包脚本不可用时至少生成 manifest.json。 | 无打包 → 课件无法被 Gallery 导入 |
| 19 | **默认仅生成中文课件**。除非用户明确要求"双语"或"英文版"，否则只生成 `index.html`（中文）。用户要求双语时同时生成 `index_en.html`（英文）。 | 不必要的英文版 → 浪费生成时间 |
| 20 | **理科实验交互必须使用生活化场景**（见 Section 6.4）。物理/化学/生物的实验类交互组件禁止使用纯抽象示意图，必须置于学生日常可感知的生活场景中。类比参照物必须贴近学生认知。 | 纯抽象实验 → 学生无法建立直觉 → 教学效果打折 |
| 21 | **课件必须使用标准 HTML 骨架模板**（见 Section 10.2.1）。必选 section（Hero、学习目标、前测、知识模块≥3个、综合任务、后测、小结）不可删除。导航必须使用 Sticky 顶部导航+前后翻页，禁止 Tab 切换或多页 HTML。 | 版式不一致 → Gate #18 不通过 |
| 22 | **文科课件 ABT 导入必须包含 AI 生成的情境插图**。语文、历史、地理、美术等文科课件的 ABT 情境导入模块，AI 必须主动调用 `image_gen` 生成配图并嵌入 HTML（见 Section 10.4.1）。生图不可用时降级为带 prompt 的占位符，但不可省略整个互动区。 | 文科课件缺图 → Gate #19 不通过 |
| 23 | **支持多 Agent 协作的环境必须使用并行模式**。当运行环境支持 `task` 工具时，AI 必须按 Section 10.5 的协作架构分发任务（中文课件 + 英文课件 + 插图 + TTS 并行），不可在有条件时仍用单线程串行。协作模式必须在 Generation Gate 中标注。 | 有条件不并行 → 效率低下 → Gate #20 不通过 |
| 24 | **课件必须包含交互式知识图谱**（见 Section 10.2.3）。每个课件的 `#knowledge-graph` section 不可删除，`knowledgeGraphData` 必须从 `_graph.json` 注入。当前节点高亮、有课件节点可点击跳转、无课件节点虚线框。数据不可用时必须走降级路径（Web搜索→空图谱），绝不省略整个 section。 | 无知识图谱 → Gate #21 不通过 |
| 25 | **视频必须嵌入到对应知识模块的 section 内部，优先使用交互动画**（见 Section 10.2.4）。过程性变化优先用 CSS/JS/Canvas/SVG 交互动画实现；仅交互无法覆盖时使用 HTML `<video>` 标签静态嵌入，必须有 `controls`、`preload="metadata"`、`playsinline` 属性，外包 `.video-player` 容器。**禁止**仅用 JavaScript 动态创建视频元素。 | 无 `<video>` 标签或视频位置错误 → Gate #22 不通过 |
| 26 | **L3 语音必须有完整播放器 UI**（见 Section 10.2.5）。L3 生成后必须注入 `audioPlaylist` 数组（每个条目含 `sectionId` 关联对应 section），课件中必须有底部悬浮控制条（播放/暂停+进度条+调速+字幕）+ IntersectionObserver 滚动自动播放。**禁止**只添加隐藏 `<audio>` 标签而无任何播放控件。 | 无播放器 UI → Gate #23 不通过 |
| 27 | **Remotion 渲染必须安装中文字体**（见 Section 15.2 步骤 2.5）。L2 执行时，AI 必须检测并安装中文字体（Linux 下安装 fonts-noto-cjk）。SubtitleTrack.tsx 的 fontFamily 必须包含 `'Noto Sans SC'` 降级。 | 中文字幕乱码 → Gate #24 不通过 |

---

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

## 十五、视频与音频制作流水线

TeachAny 在互动 HTML 课件之上，支持可选的**视频 + AI 配音**增强层。本节定义从自动化环境搭建、语音生成到双语字幕渲染的完整流水线。

> ⚠️ **核心原则**：用户只需要说"我要视频/配音"，**AI 自动完成所有环境检测、依赖安装、代码生成和渲染执行**。用户不需要手动输入任何 `npm install` 或 `pip install` 命令。

### 15.1 架构分层

| 层级 | 产物 | 依赖 | AI 自动安装 | 是否必选 |
|:-----|:-----|:-----|:------|:---------|
| **L1 — 互动课件** | `public/index.html`（+ 用户要求时 `public/index_en.html`） | 无（零依赖） | 不需要 | ✅ 始终提供（默认仅中文） |
| **L2 — 教学动画** | `out/*.mp4`（Remotion 渲染） | Node.js ≥ 18、npm、ffmpeg | ✅ AI 自动检测安装 | 🔶 显式触发 |
| **L3 — AI 语音讲解** | `public/tts/*.mp3` + `public/tts/*.srt` | Python 3.8+、edge-tts | ✅ AI 自动检测安装 | ✅ **默认必选** |
| **L4 — 课件打包** | `*.teachany` 包 | Node.js（pack-courseware.cjs） | ✅ AI 自动执行 | ✅ **默认必选** |

**L1 + L3 + L4 始终自动执行。L2 是渐进式增强。**

### 15.2 L2 环境自动搭建（Remotion）

> **当 Generation Gate 标注 L2="需要"时，AI 必须自动执行以下全部步骤，不等待用户确认。**

#### 自动化流程（AI 逐步执行）

```text
┌─────────────────────────────────────────────────────────┐
│  L2 自动安装流程（AI 在终端中依次执行）                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 检测 Node.js                                        │
│     → node -v                                           │
│     → 缺失/版本不足？安装：install_binary node 20.19.0  │
│                                                         │
│  2. 检测 ffmpeg                                         │
│     → ffmpeg -version                                   │
│     → 缺失？                                           │
│       macOS: brew install ffmpeg                        │
│       Linux: sudo apt install ffmpeg -y                 │
│       Windows: choco install ffmpeg -y                  │
│     → 安装失败？标注"L2 渲染不可用，仅生成代码"           │
│                                                         │
│  2.5 安装中文字体（Noto Sans SC）                         │
│     → 检测字体：fc-list :lang=zh 2>/dev/null            │
│     → 无中文字体？                                      │
│       macOS: 系统自带 PingFang SC，跳过                  │
│       Linux: sudo apt install -y fonts-noto-cjk         │
│              或 下载 Noto Sans SC 到 ~/.local/share/fonts│
│       Windows: 系统自带 Microsoft YaHei，跳过            │
│     → 安装后刷新缓存：fc-cache -fv                       │
│     → ⚠️ 必须确保 Remotion 渲染时能找到中文字体         │
│                                                         │
│  3. 生成 package.json（含 Remotion 依赖）                │
│                                                         │
│  4. 执行 npm install                                    │
│                                                         │
│  5. 生成配置文件                                         │
│     → tsconfig.json                                     │
│     → remotion.config.ts                                │
│                                                         │
│  6. 生成音效：node generate-sfx.js                      │
│                                                         │
│  7. 编写动画组件代码                                     │
│     → src/compositions/*.tsx                            │
│     → src/Root.tsx / SfxPlayer.tsx / SubtitleTrack.tsx   │
│                                                         │
│  8. 渲染视频：npm run build:all                         │
│                                                         │
│  ✅ 完成 → 输出 out/*.mp4                               │
│  ⚠️ 渲染失败 → 代码已生成，提示用户手动执行渲染          │
└─────────────────────────────────────────────────────────┘
```

#### 降级策略

| 情况 | 处理方式 |
|:---|:---|
| Node.js 不可用且无法安装 | 仅生成 Remotion 代码文件，提示用户安装 Node.js 后执行 `npm install && npm run build:all` |
| ffmpeg 不可用 | 生成代码 + 预览（`npm run start`），提示用户安装 ffmpeg 后执行 `npm run build:all` 渲染 |
| npm install 失败（网络问题） | 保留 package.json，提示用户检查网络后重新执行 `npm install` |

#### 标准 package.json

```json
{
  "name": "teachany-course",
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render src/index.tsx",
    "build:all": "node scripts/render-all.js",
    "generate-sfx": "node generate-sfx.js",
    "generate-tts": "python3 scripts/generate-tts.py"
  },
  "dependencies": {
    "remotion": "^4.0.409",
    "@remotion/cli": "^4.0.409",
    "@remotion/bundler": "^4.0.409",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0"
  }
}
```

#### 第 4 步：生成音效

```bash
node generate-sfx.js
# 创建 public/sfx/{pop,step,highlight,success,whoosh,ding,error}.wav
```

`generate-sfx.js` 是纯 Node.js WAV 编码器，零第三方依赖，生成 7 种教学动画音效，由 `SfxPlayer` 组件调用。

#### 第 5 步：创建配置文件

`remotion.config.ts`：
```typescript
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

`tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### 15.3 Remotion Composition 规范

每个教学动画遵循以下结构：

```text
src/
├── index.tsx          # Remotion 入口
├── Root.tsx           # Composition 注册
├── SfxPlayer.tsx      # 音效播放器组件
├── compositions/
│   ├── Episode01.tsx  # 每集一个 Composition
│   ├── Episode02.tsx
│   └── ...
└── SubtitleTrack.tsx  # 双语字幕叠加层
```

**Composition 注册**（`Root.tsx`）：
```tsx
<Composition
  id="Episode01"
  component={Episode01}
  durationInFrames={600}  // 30fps 下 20 秒
  fps={30}
  width={1920}
  height={1080}
/>
```

**动画规范**：
- 分辨率：1920×1080，30fps
- 单 Composition：480-720 帧（16-24 秒）
- 每个 Composition 3-5 个场景
- 动画风格：`interpolate` + `spring`，渐入渐出
- 配色与 HTML 课件 CSS 变量保持统一
- 通过 `SfxPlayer` 组件按帧触发音效
- **中文字体**：SubtitleTrack 的 fontFamily 必须包含 `'Noto Sans SC'` 降级（见 15.5），渲染前确保系统已安装中文字体（见 15.2 步骤 2.5）

### 15.4 Edge TTS 集成（默认）

> **L3 是默认必选项。L1 课件生成完毕后，AI 必须立即自动执行以下全部步骤生成语音讲解，不等待用户确认。**
> **唯一跳过条件**：用户在下达任务时明确说了"不要语音/不要配音/不要TTS"。

> ⚠️ **默认引擎**：**Edge TTS**（微软免费云端 TTS）。
> 
> **支持平台**：
> - ✅ **全平台**：macOS / Windows / Linux（需网络）
> 
> **为什么选择 Edge TTS**：
> - ✅ 全平台支持，无需关心操作系统差异
> - ✅ 高质量神经网络语音（24kHz，zh-CN-XiaoxiaoNeural）
> - ✅ 完全免费，微软提供
> - ✅ 安装简单：`pip3 install edge-tts`
> - ✅ 语音自然度远超系统内置 TTS
> 
> **降级方案**（网络不可用时）：
> - macOS：使用系统 `say` 命令
> - Windows：使用 `pyttsx3`（SAPI5 引擎）

#### L3 自动安装流程（AI 在终端中执行）

```text
┌─────────────────────────────────────────────────────────┐
│  L3 Edge TTS 自动安装流程                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 检测 Python 环境                                     │
│     → python3 --version                                 │
│     → 缺失？安装：install_binary python 3.12.0          │
│                                                         │
│  2. 安装 edge-tts                                        │
│     → pip3 install edge-tts                             │
│     → 验证：edge-tts --list-voices                      │
│                                                         │
│  3. 编写旁白脚本                                         │
│     → scripts/narration_zh.json（+ narration_en.json）  │
│                                                         │
│  4. 执行语音生成                                         │
│     → python3 scripts/generate-tts.py zh                │
│     → python3 scripts/generate-tts.py en（如双语）      │
│                                                         │
│  5. 生成 SRT 字幕                                       │
│     → python3 scripts/generate-srt.py zh                │
│     → python3 scripts/generate-srt.py en（如双语）      │
│                                                         │
│  ✅ 完成 → 输出 public/tts/*.mp3 + *.srt               │
│  ⚠️ 失败 → 降级到本地系统 TTS                           │
└─────────────────────────────────────────────────────────┘
```

#### 降级策略

| 情况 | 处理方式 |
|:---|:---|
| 网络不可用 | 降级到本地系统 TTS：macOS 使用 `say`，Windows 使用 `pyttsx3` |
| edge-tts 安装失败 | 保留旁白脚本 JSON，降级到本地 TTS，提示用户联网后执行 `pip3 install edge-tts` |
| Python 不可用 | 生成旁白脚本 JSON + generate-tts.py，提示用户安装 Python 3.12+ 后执行 |
| edge-tts 生成失败（网络中断） | 保留脚本文件，提示用户在网络正常时重新执行 |

**注意**：Edge TTS **完全免费**——微软免费提供。无 API Key、无配额限制。

#### 语音选择

##### Edge TTS 推荐语音

| 语言 | Voice 名称 | 风格 | 推荐 |
|:-----|:---------|:-----|:-----|
| **中文（女声）** | `zh-CN-XiaoxiaoNeural` | 温暖清晰，K-12 推荐 | ⭐ 默认 |
| **中文（女声）** | `zh-CN-XiaohanNeural` | 年轻活泼 | |
| **中文（男声）** | `zh-CN-YunxiNeural` | 沉稳可靠 | |
| **英文（女声）** | `en-US-AriaNeural` | 清晰标准美式 | ⭐ 默认 |
| **英文（女声）** | `en-US-JennyNeural` | 自然流畅 | |

##### 降级方案：本地系统语音

| 平台 | Voice 名称 | 使用命令 |
|:-----|:---------|:---------|
| **macOS** | `Tingting`（中文）/ `Samantha`（英文） | `say -v Tingting "text"` |
| **Windows** | `Microsoft Huihui`（中文）/ `Microsoft Zira`（英文） | `pyttsx3` |

**语音质量对比**：

| 特性 | Edge TTS | macOS say | Windows pyttsx3 |
|:---|:---:|:---:|:---:|
| 音质 | ⭐⭐⭐⭐⭐ 24kHz 神经网络 | ⭐⭐⭐⭐ 48kHz | ⭐⭐⭐ 16kHz |
| 自然度 | ⭐⭐⭐⭐⭐ 最佳 | ⭐⭐⭐ | ⭐⭐ |
| 跨平台 | ✅ 全平台 | ❌ 仅 macOS | ❌ 仅 Windows |
| 网络依赖 | ⚠️ 需网络 | ✅ 离线 | ✅ 离线 |
| 成本 | ✅ 免费 | ✅ 免费 | ✅ 免费 |

#### TTS 脚本格式

以 JSON 格式创建旁白脚本（与 edge-tts 格式兼容）：

`scripts/narration_zh.json`：
```json
[
  {
    "episode": "Episode01",
    "segments": [
      {
        "id": "seg01",
        "text": "大家好，今天我们来学习二次函数的概念。",
        "startFrame": 0,
        "endFrame": 90
      },
      {
        "id": "seg02",
        "text": "先从一个简单的例子开始：正方形的面积。",
        "startFrame": 100,
        "endFrame": 180
      }
    ]
  }
]
```

#### Edge TTS 生成脚本

`scripts/generate-tts.py`（已预置）：
```python
#!/usr/bin/env python3
"""
Edge TTS 生成器
- 全平台支持（macOS / Windows / Linux）
- 使用微软免费神经网络语音
- 默认语音：zh-CN-XiaoxiaoNeural
"""
# 完整脚本见：scripts/generate-tts.py

# 使用示例
# python3 scripts/generate-tts.py zh
# python3 scripts/generate-tts.py en --voice en-US-AriaNeural
# python3 scripts/generate-tts.py zh --rate +10%
```

**使用方法**：
```bash
# 安装 edge-tts
pip3 install edge-tts

# 生成中文语音（默认：zh-CN-XiaoxiaoNeural）
python3 scripts/generate-tts.py zh

# 生成英文语音（默认：en-US-AriaNeural）
python3 scripts/generate-tts.py en

# 自定义语音
python3 scripts/generate-tts.py zh --voice zh-CN-YunxiNeural

# 调整语速
python3 scripts/generate-tts.py zh --rate +10%

# 覆盖已存在的音频
python3 scripts/generate-tts.py zh --overwrite
```

**降级方案（网络不可用时）**：
- macOS：使用 `scripts/generate-tts-local.py`（系统 `say` 命令）
- Windows：使用 `scripts/generate-tts-local.py`（`pyttsx3` 引擎）

### 15.5 双语字幕系统

#### SubtitleTrack 组件

`src/SubtitleTrack.tsx`：
```tsx
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SubtitleEntry {
  startFrame: number;
  endFrame: number;
  zh: string;
  en: string;
}

interface Props {
  subtitles: SubtitleEntry[];
  showZh?: boolean;  // 默认：true
  showEn?: boolean;  // 默认：true
}

export const SubtitleTrack: React.FC<Props> = ({
  subtitles, showZh = true, showEn = true
}) => {
  const frame = useCurrentFrame();
  const current = subtitles.find(
    s => frame >= s.startFrame && frame <= s.endFrame
  );
  if (!current) return null;

  const fadeIn = interpolate(
    frame, [current.startFrame, current.startFrame + 5], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{
      position: "absolute", bottom: 60, left: 0, right: 0,
      textAlign: "center", opacity: fadeIn,
    }}>
      {showZh && (
        <div style={{
          fontSize: 36, color: "#f8fafc", fontWeight: 600,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', sans-serif",
        }}>
          {current.zh}
        </div>
      )}
      {showEn && (
        <div style={{
          fontSize: 28, color: "#94a3b8", marginTop: 4,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}>
          {current.en}
        </div>
      )}
    </div>
  );
};
```

#### 字幕数据格式

```tsx
const subtitles: SubtitleEntry[] = [
  {
    startFrame: 0, endFrame: 90,
    zh: "大家好，今天我们来学习二次函数的概念",
    en: "Hello everyone, today we'll learn about quadratic functions"
  },
  {
    startFrame: 100, endFrame: 180,
    zh: "先从一个简单的例子开始：正方形的面积",
    en: "Let's start with a simple example: the area of a square"
  },
];
```

#### SRT 导出脚本

`scripts/generate-srt.py`：
```python
#!/usr/bin/env python3
"""从旁白 JSON 生成 SRT 字幕文件。"""
import json
import sys

def frames_to_timecode(frame, fps=30):
    total_seconds = frame / fps
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    milliseconds = int((total_seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def generate_srt(narration_file, lang, output_path):
    with open(narration_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)
    
    idx = 1
    lines = []
    for ep in episodes:
        for seg in ep["segments"]:
            start = frames_to_timecode(seg["startFrame"])
            end = frames_to_timecode(seg["endFrame"])
            lines.append(f"{idx}")
            lines.append(f"{start} --> {end}")
            lines.append(seg["text"])
            lines.append("")
            idx += 1
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ {output_path}")

if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    generate_srt(f"scripts/narration_{lang}.json", lang, f"public/tts/subtitles_{lang}.srt")
```

### 15.6 语言配置

执行 TeachAny 时，用户可指定语言偏好：

| 参数 | 可选值 | 默认值 | 影响范围 |
|:-----|:-------|:-------|:---------|
| **课件语言** | `zh` / `en` | `zh` | HTML 内容语言 |
| **配音语言** | `zh` / `en` / `none` | `zh` | TTS 旁白语言 |
| **字幕模式** | `zh-only` / `en-only` / `bilingual` / `none` | `bilingual` | Remotion 中的字幕显示 |

**用户指令示例**：
- "做一个中文数学课件，中文配音，双语字幕" → 默认配置
- "做一个英文生物课件，英文配音，只显示英文字幕" → `en` / `en` / `en-only`
- "做一个中文课件，不需要视频" → 仅 L1，跳过 L2/L3

### 15.7 完整项目文件结构

```text
teachany-course/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── generate-sfx.js                    # 音效生成器（Node.js，零依赖）
├── scripts/
│   ├── generate-tts.py                # Edge TTS 生成器
│   ├── generate-srt.py                # SRT 字幕导出器
│   ├── render-all.js                  # 批量渲染所有 Composition
│   ├── narration_zh.json              # 中文旁白脚本
│   └── narration_en.json              # 英文旁白脚本
├── public/
│   ├── index.html                     # L1：互动课件（中文）
│   ├── index_en.html                  # L1：互动课件（英文）
│   ├── sfx/                           # 生成的音效文件
│   │   ├── pop.wav
│   │   ├── step.wav
│   │   ├── highlight.wav
│   │   ├── success.wav
│   │   ├── whoosh.wav
│   │   ├── ding.wav
│   │   └── error.wav
│   └── tts/                           # 生成的 TTS 语音和字幕
│       ├── Episode01/
│       │   ├── seg01_zh.mp3
│       │   ├── seg01_en.mp3
│       │   └── ...
│       ├── subtitles_zh.srt
│       └── subtitles_en.srt
├── src/
│   ├── index.tsx                      # Remotion 入口
│   ├── Root.tsx                       # Composition 注册
│   ├── SfxPlayer.tsx                  # 音效播放器组件
│   ├── SubtitleTrack.tsx              # 双语字幕叠加层
│   └── compositions/
│       ├── Episode01.tsx
│       ├── Episode02.tsx
│       └── ...
└── out/                               # 渲染输出视频
    ├── Episode01.mp4
    ├── Episode02.mp4
    └── ...
```

### 15.8 快速启动命令

```bash
# 完整安装（一次性）
npm install                             # 安装 Remotion
pip3 install edge-tts                   # 安装 Edge TTS
node generate-sfx.js                    # 生成音效

# 开发预览
npm run start                           # 打开 Remotion Studio（预览）

# 生产构建
python3 scripts/generate-tts.py zh      # 生成中文旁白
python3 scripts/generate-tts.py en      # 生成英文旁白
python3 scripts/generate-srt.py zh      # 导出中文 SRT
python3 scripts/generate-srt.py en      # 导出英文 SRT
npm run build:all                       # 渲染所有集数为 MP4
```

---

## 十六、Token 消耗与成本估算

### 16.1 单课件 Token 分解

| 组件 | 输出规模 | 预估 Token 数 | 备注 |
|:-----|:---------|:-------------|:-----|
| **L1：HTML 课件（中文）** | ~1,500 行 | 30K-40K 输出 | 含完整互动和测验引擎 |
| **L1：HTML 课件（英文）** | ~1,500 行 | 30K-40K 输出 | 英文翻译版 |
| **L2：Remotion Composition** | 6-8 集 × ~200 行 | 25K-35K 输出 | 含 SfxPlayer 的动画代码 |
| **L2：Root.tsx + SfxPlayer** | ~120 行 | 2K-3K 输出 | 模板代码 |
| **L2：generate-sfx.js** | ~180 行 | 3K-4K 输出 | 一次性，可跨项目复用 |
| **L3：旁白脚本（中文）** | ~3K 字 | 2K-3K 输出 | 含帧时间戳的 JSON |
| **L3：旁白脚本（英文）** | ~2K 字 | 2K-3K 输出 | 英文翻译版 |
| **L3：TTS/SRT 脚本** | 各 ~100 行 | 1K-2K 输出 | 一次性，可复用 |
| **输入上下文** | Skill + 指令 | 15K-25K 输入 | Skill 定义 + 用户需求 |

### 16.2 完整课件总量估算

| 场景 | 输入 Token | 输出 Token | 总 Token |
|:-----|:----------|:-----------|:---------|
| **仅 L1**（中文 HTML） | ~20K | ~35K | ~55K |
| **L1 双语**（中英 HTML） | ~25K | ~70K | ~95K |
| **L1+L2**（HTML + Remotion） | ~30K | ~100K | ~130K |
| **L1+L2+L3 全量**（HTML + 视频 + TTS + 字幕，双语） | ~35K | ~120K | ~155K |

### 16.3 按模型估算成本

| 模型 | 输入单价 | 输出单价 | 仅 L1 | L1+L2+L3 全量 |
|:-----|:---------|:---------|:------|:---------------|
| **Claude Sonnet 4** | $3/1M | $15/1M | ~$0.59 | ~$1.91 |
| **Claude Opus 4** | $15/1M | $75/1M | ~$2.93 | ~$9.53 |
| **GPT-4o** | $2.5/1M | $10/1M | ~$0.40 | ~$1.29 |
| **DeepSeek-V3** | ¥1/1M | ¥2/1M | ~¥0.09 | ~¥0.28 |

**注意**：Edge TTS **完全免费**——微软免费提供。音效在本地生成，无 API 成本。唯一的成本是 AI 代码生成的 Token 消耗。

### 16.4 时间估算

| 步骤 | 预估时间 |
|:-----|:---------|
| AI 生成 HTML 课件 | 2-4 分钟 |
| AI 生成 Remotion 代码 | 3-5 分钟 |
| AI 生成旁白脚本 | 1-2 分钟 |
| `npm install` | 1-2 分钟（首次） |
| `node generate-sfx.js` | < 1 秒 |
| `pip install edge-tts` | < 30 秒 |
| `python3 generate-tts.py` | 1-3 分钟（取决于网络） |
| `npm run build:all`（8 集） | 5-15 分钟（取决于 CPU） |
| **总计（L1+L2+L3）** | **15-30 分钟** |

---

## 十七、课件打包与分发

TeachAny 课件可以打包为 `.teachany` 文件（标准 ZIP 格式），方便导入、分享和管理。

### 17.1 课件包结构

```text
my-course.teachany          ← ZIP 压缩，扩展名 .teachany
├── manifest.json           ← 必须：课件元信息
├── index.html              ← 必须：主课件文件
├── index_en.html           ← 可选：英文版课件
├── README.md               ← 可选：课件说明
├── thumbnail.png           ← 可选：缩略图（推荐 600×400）
└── assets/                 ← 可选：音视频等资源
```

### 17.2 manifest.json 必填字段

```jsonc
{
  "name": "一次函数与正比例函数",     // 课件中文名
  "subject": "math",                   // 学科 ID
  "grade": 8,                          // 适用年级（1-12）
  "author": "weponusa",                // 作者
  "version": "1.0.0",                  // 版本号
  "node_id": "linear-function",        // 对应知识地图节点 ID（可选但推荐）
  "domain": "function",                // 所属领域（可选）
  "prerequisites": ["proportional-function"],  // 前置知识（可选）
  "emoji": "📏",                        // 展示 emoji
  "difficulty": 3,                      // 难度 1-5
  "teachany_spec": "1.0"               // 规范版本
}
```

完整 Schema 详见 `docs/courseware-package.md`。

### 17.3 打包命令

课件生成完成后，执行以下命令打包：

```bash
# 自动从 index.html meta 标签生成 manifest.json 并打包
node scripts/pack-courseware.cjs ./examples/math-linear-function

# 指定输出目录
node scripts/pack-courseware.cjs ./examples/math-linear-function ./dist
```

如果目录中已有 `manifest.json`，脚本会直接使用；否则会从 `index.html` 的 `<meta name="teachany-*">` 标签自动生成。

### 17.4 AI 生成课件后的标准流程（默认执行）

在 Phase 3（制作内容）完成后，**必须执行** Phase 3.5 — 打包：

```text
Phase 3.5：打包课件（默认必选）
1. 确认 index.html 包含完整的 teachany-* meta 标签
2. 运行 node scripts/pack-courseware.cjs <课件目录>
3. 验证生成的 .teachany 包
4. 告知用户：可将此文件拖入 TeachAny Gallery 或知识地图页面导入
```

> ⚠️ 打包是默认步骤，不需要用户要求。如果 pack-courseware.cjs 脚本不可用，在课件目录中生成 manifest.json 并告知用户手动打包即可。

### 17.5 HTML meta 标签（已有规范，此处汇总）

每个课件的 `index.html` 必须包含以下 meta 标签：

```html
<meta name="teachany-node" content="linear-function">
<meta name="teachany-subject" content="math">
<meta name="teachany-domain" content="function">
<meta name="teachany-grade" content="8">
<meta name="teachany-prerequisites" content="proportional-function">
<meta name="teachany-difficulty" content="3">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">
```

这些标签既用于知识地图关联，也用于自动生成 `manifest.json`。

### 17.6 导入方式

用户可在两个入口导入课件包：

1. **Gallery 页面**：点击「➕ 添加我的课件」按钮，拖入或选择 `.teachany` 文件
2. **知识地图页面**：点击"待创建"节点，弹出上传入口，课件自动关联到该知识节点

导入后课件存储在浏览器 localStorage 中（纯前端，无需后端），在 Gallery 中以「我的课件」标识展示。

---

**技能版本**：v5.12  
**更新日期**：2026-04-12  
**变更摘要**：
- v1.0：数理课件版
- v2.0：拆成通用底座+学科适配层
- v3.0：补 Bloom 完整表、课型分类、脚手架策略、Mayer 原则、五镜头选择指引、3 学科完整示例、视觉设计细则、Phase 4 审查清单
- v4.0：新增视频与音频制作流水线（Remotion 自动安装、Edge TTS 集成、双语字幕系统、语言配置）、Token 与成本估算
- v5.3：新增例题配图硬性规范（Section 13）——涉及空间/几何/图形推理的例题和练习必须配图；详见英文版 SKILL.md Section 18.8 完整实现指南。
- v5.4：新增课件打包与分发（Section 17）——定义 .teachany 课件包格式、打包脚本、Gallery/知识地图导入功能。
- v5.5：融入项目驱动教学方法论——新增四种驱动模式（问题/项目/活动/问题链）与决策树、情境角色设计（四种情境模式）、学习记录单支架、过程性评价量规、三段式作业设计、跨学科融合设计、AI 多模态互动区规范；扩充项目制/任务驱动设计框架；Generation Gate 和 Completeness Gate 升级为 14 项审查；硬规则从 13 条扩充至 15 条。
- v5.6：**L3 语音讲解从"显式触发"升级为"默认必选"**——L1 课件完成后自动安装 edge-tts 并生成语音文件，仅用户明确拒绝时跳过；新增三级降级策略（自动安装→保留脚本→保留 JSON）；Generation Gate L3 字段改为"默认执行"；Phase 3/4 流程重构强制 L3 执行；硬规则从 15 条扩充至 16 条。
- v5.7：**全面升级"按需调用"为"默认执行"，保证课件基本质量**——(1) 知识图谱查阅新增🥉Web搜索降级层（脚本→JSON→Web搜索→模型知识四级降级链），禁止跳过搜索直接用模型知识；(2) AI多模态互动区从"可选增强"改为"适用场景默认插入"；(3) 课件打包（Phase 3.5）改为默认必选；(4) 双语课件（中英文）改为默认生成；(5) Completeness Gate 从14项扩充至17项（+双语+打包+知识溯源）；(6) 硬规则从16条扩充至19条（+Web搜索必经+打包默认+双语默认）；(7) 架构分层新增L4打包层。
- v5.8：**WorkBuddy 多 Agent 协作 + 版式一致性 + AI 主动生图/生视频**——(1) 新增 Section 10.2.1 HTML 骨架模板（强制使用，含完整 HTML 代码模板、必选/可选 section 标注、导航/进度条/翻页按钮）；(2) 新增 Section 10.2.2 统一导航规范（强制 Sticky 顶部导航+前后翻页，禁止 Tab 切换/多页 HTML/侧边栏导航）；(3) 新增 Section 10.4.1 AI 主动生图规范（AI 在生成课件时主动调用 image_gen 生成文科配图，含 6 类触发条件、prompt 策略、降级方案）；(4) 新增 Section 10.4.2 AI 主动生视频规范（理科实验过程/地理变化/生物过程等场景的视频生成策略）；(5) 新增 Section 10.5 WorkBuddy 多 Agent 协作流水线（定义 5 个 Agent 角色分工、并行执行架构图、task 调用 prompt 模板、三级降级策略）；(6) Generation Gate 新增 4 个字段（模块数量/HTML骨架/AI主动生图/Agent协作模式）；(7) Completeness Gate 从 17 项扩充至 20 项（+版式一致性+AI主动生图+Agent协作记录）；(8) 硬规则从 20 条扩充至 23 条（+HTML骨架模板+文科配图+多Agent并行）；(9) Phase 3 L1 制作指令新增 HTML 骨架模板、多 Agent 协作、AI 主动生图的引用。
- v5.9：**知识图谱可视化 + 视频/音频播放器强制规范 + Remotion 中文字体修复**——(1) 新增 Section 10.2.3 知识图谱可视化规范（HTML 骨架新增必选 `#knowledge-graph` section，SVG 交互式图谱，节点从 `_graph.json` 提取，当前节点高亮、有课件节点可点击跳转、无课件节点虚线框）；(2) 新增 Section 10.2.4 视频播放器规范（强制使用 `<video controls preload="metadata" playsinline>` + `.video-player` 容器，禁止仅用 JS 动态创建视频）；(3) 新增 Section 10.2.5 音频播放器规范（HTML 骨架内置完整音频播放引擎——FAB 按钮+弹出式播放面板+段落列表+控制条+字幕显示，禁止只添加隐藏 `<audio>` 标签）；(4) L2 环境自动搭建新增步骤 2.5「安装中文字体」（Linux 下安装 fonts-noto-cjk）；(5) SubtitleTrack.tsx fontFamily 新增 `'Noto Sans SC'`、`'Noto Sans CJK SC'` 降级字体；(6) Generation Gate 新增 3 个字段（知识图谱数据/视频嵌入/音频播放器）；(7) Completeness Gate 从 20 项扩充至 24 项（+知识图谱可视化+视频标签+音频播放器UI+Remotion中文字体）；(8) 硬规则从 23 条扩充至 27 条（+知识图谱必选+视频必须用video标签+音频必须有播放器UI+Remotion必须安装中文字体）。
- v5.10：**音频滚动自动播放 + 视频优先交互演示 + 默认仅中文**——(1) 音频播放器从 FAB+弹出面板+手动选段 改为 IntersectionObserver 滚动自动播放+底部悬浮控制条（播放/暂停+进度条+5档调速+字幕），`audioPlaylist` 每个条目新增 `sectionId` 字段关联对应 HTML section；(2) 视频嵌入新增"优先交互演示"原则（CSS/JS/Canvas/SVG 交互动画 > Remotion > 静态视频），视频必须嵌入到对应知识模块的 section 内部而非集中放置；(3) 双语课件从"默认生成"改为"默认仅中文"，用户明确要求时才生成英文版；Agent B 从"默认执行"改为"用户要求时执行"；(4) 同步更新 Generation Gate、Completeness Gate、硬规则 #19/#25/#26、Agent 协作架构图、Phase 3/4 流程。
- v5.11：**历史/地理课件DEM地形+态势动画强制规范**——(1) 新增 Section 18.4《历史/地理课件高级可视化规范》，强制要求三层架构（DEM地形底图 + 历史疆域GeoJSON + 态势动画）；(2) 新增三种动画设计模式（时间轴播放/交互式探索/对比模式）；(3) 新增历史疆域GeoJSON与战役数据标准字段；(4) 新增库选择决策树（Cesium真3D / Maplibre地形 / ECharts GL伪3D）；(5) Phase 4 审查新增 8 项检查（DEM地形/疆域准确性/动画流畅度/时间轴完整性/地标准确性/音频同步/交互响应/移动端适配），历史/地理课件验收标准≥85分。
- v5.12：**⭐ 强制使用开源数据源，禁止手工标注**——(1) 新增 Section 18.4.3《数据规范》，强制使用权威开源数据集（CHGIS V6、Natural Earth）替代低精度手工标注；(2) 新增 7 类标准数据源清单（河流水系/历史行政区划/现代行政边界/湖泊/历史城市/DEM地形/海岸线）；(3) 新增数据处理流程（ogr2ogr 格式转换 + mapshaper 几何简化）；(4) 新增 GeoJSON metadata 标准字段（dataSource/sourceUrl/chgisId），强制数据溯源；(5) 新增 Section 18.4.7《数据预处理工具链》，包含 CHGIS/Natural Earth 数据下载指南、在线工具（Mapshaper Web、GeoJSON.io）；(6) 验收标准新增"数据源准确性"检查项（15%权重），要求河流/城市/边界必须来自开源数据集；(7) 18.4.4 强制必选元素新增"河流水系"与"数据溯源"两项；(8) 所有示例代码更新为从预处理 GeoJSON 文件加载，禁止嵌入手工标注坐标。


---

## 十八、地理/历史课件地图资源（无需 API）

### 18.1 基础地图数据

所有地图文件位于 `data/geography/` 目录，**使用 ECharts 加载，完全本地化，无需任何 API Key**：

**现代中国行政区划**（`modern-china/`）：
- `provinces.geojson` - 省级行政区划（568KB）
- `beijing.geojson` - 北京市区县（98KB）
- `shanghai.geojson` - 上海市区县（83KB）

**历史中国疆域**（`historical-china/`）：
- 8个朝代边界 GeoJSON（秦/西汉/东汉/唐/宋/元/明/清）
- 总计 ~7.85MB，用于历史疆域对比课件

**世界地图**（`world/`）：
- `countries.geojson` - 世界国家边界（250KB）

**历史数据**（`data/history/`）：
- `dynasties-detailed.json` - 详细朝代数据（221KB，含emperors/events/regions/landmarks/poems）
- `persons.json` - 历史人物数据库（21.75KB）

### 18.2 使用方法

#### 方案 A：ECharts 地图（推荐，完全本地）

```javascript
// 加载 GeoJSON 并注册为地图
fetch('../data/geography/modern-china/provinces.geojson')
  .then(res => res.json())
  .then(geoJson => {
    echarts.registerMap('china', geoJson);
    chart.setOption({
      geo: { 
        map: 'china', 
        roam: true,  // 可缩放、平移
        itemStyle: { areaColor: '#e0f2f1' }
      }
    });
  });
```

**优点**：
- ✅ **零依赖**：无需任何 API Key
- ✅ **完全本地**：GeoJSON 预置在 data 目录
- ✅ **性能优秀**：低配置设备也流畅
- ✅ **功能丰富**：支持区域填充、散点图、路线图、热力图

#### 方案 B：Leaflet + OpenStreetMap（需要实景地图）

```javascript
// 使用 OpenStreetMap 免费瓦片（无需 Token）
const map = L.map('map').setView([35, 108], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 18
}).addTo(map);
```

**优点**：
- ✅ **免费瓦片**：OpenStreetMap 提供全球底图
- ✅ **无需 Token**：直接使用，零配置
- ✅ **实景展示**：真实街道地图

⚠️ **注意**：需联网首次加载（瓦片可缓存）

### 18.3 禁止使用需要 API 的方案

❌ **Mapbox GL JS**：需要申请 Token，已移除
❌ **Google Maps**：需要付费 API Key
❌ **高德/百度地图**：需要申请 Key

---

### 18.4 历史/地理课件高级可视化规范（v5.11 新增）⭐

**适用场景**：
- 历史疆域演变（秦统一六国、元朝疆域、明清海禁等）
- 地理地形分析（青藏高原、长江流域、"胡焕庸线"等）
- 历史战役复盘（长平之战、淝水之战、赤壁之战等）
- 地缘政治分析（丝绸之路、大运河、海上贸易等）

#### 18.4.1 强制三层架构（必选）

**第一层：DEM 地形底图**（必选）

历史/地理课件必须使用真实 DEM 数据作为底图,不得使用纯色背景或简化示意图。

**🌟 标准方案(v5.11 推荐):MapLibre GL + AWS Terrain Tiles**

```javascript
// ✅ 完全开源 + 免费 + 无需 Token + 全球 DEM 覆盖
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e8dcc7' } },
      { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.3 } }
    ]
  },
  center: [110, 35],
  zoom: 5,
  pitch: 60, // 倾斜角度
  antialias: true
});

map.on('load', () => {
  // 添加 AWS 开放地形数据(Terrarium RGB 格式,30m 精度)
  map.addSource('terrain', {
    type: 'raster-dem',
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    encoding: 'terrarium',
    tileSize: 256,
    maxzoom: 15
  });
  
  // 启用 3D 地形(夸张倍数 2.5x 适合历史教学)
  map.setTerrain({ source: 'terrain', exaggeration: 2.5 });
  
  // 添加山体阴影(hillshade)增强立体感
  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'terrain',
    paint: {
      'hillshade-exaggeration': 0.8,
      'hillshade-shadow-color': '#5a3d2b',
      'hillshade-highlight-color': '#f5e6d3',
      'hillshade-illumination-direction': 135
    }
  });
});
```

**技术规格**:
- 地形数据源: AWS Terrain Tiles (Terrarium 格式)
- 精度: 30 米 DEM (0.1 米高程精度)
- 覆盖范围: 全球
- 许可证: 公共领域 (AWS Open Data)
- 依赖库: MapLibre GL JS 3.x (MIT 许可证)

**备选方案**(仅在标准方案不可用时使用):

```javascript
// 方案 B:Cesium(专业级真 3D,需 Token,适合天文/航天主题)
const viewer = new Cesium.Viewer('map', {
  terrainProvider: Cesium.createWorldTerrain()
});

// 方案 C:ECharts GL(轻量级伪 3D,适合低配置设备)
chart.setOption({
  geo3D: {
    map: 'china',
    regionHeight: 3,
    shading: 'realistic'
  }
});
```

**第二层：历史疆域 GeoJSON 叠加**（必选）
```javascript
// 使用 data/geography/historical-china/ 预置数据
fetch('../data/geography/historical-china/qin-221bc.geojson')
  .then(res => res.json())
  .then(boundary => {
    chart.setOption({
      series: [{
        type: 'map',
        map: 'qin',
        data: boundary.features.map(f => ({
          name: f.properties.name,
          itemStyle: {
            areaColor: 'rgba(106,27,154,0.3)',
            borderColor: '#6a1b9a',
            borderWidth: 2
          }
        }))
      }]
    });
  });
```

**第三层：态势动画**（必选）
```javascript
// 时间轴 + 进攻路线 + 战役标记
const campaigns = [
  { year: -230, from: [108.9,34.3], to: [113.8,34.2], target: '韩' },
  { year: -228, from: [108.9,34.3], to: [114.5,36.6], target: '赵' },
  // ...
];

chart.setOption({
  timeline: {
    axisType: 'category',
    autoPlay: true,
    playInterval: 2000,
    data: campaigns.map(c => `公元${c.year}年`)
  },
  options: campaigns.map(c => ({
    series: [{
      type: 'lines',
      coordinateSystem: 'geo',
      effect: {
        show: true,
        trailLength: 0.3,
        symbol: 'arrow',
        symbolSize: 8
      },
      lineStyle: { width: 2, curveness: 0.2 },
      data: [{ coords: [c.from, c.to] }]
    }]
  }))
});
```

#### 18.4.2 三种动画设计模式

**A. 时间轴播放模式**（适合历史进程）
- 自动播放 + 可暂停
- 底部时间轴控制器
- 音频同步（推荐）

```javascript
// 语音与动画同步
audioPlayer.addEventListener('timeupdate', () => {
  const progress = audioPlayer.currentTime / audioPlayer.duration;
  const index = Math.floor(progress * campaigns.length);
  chart.dispatchAction({ type: 'timelineChange', currentIndex: index });
});
```

**B. 交互式探索模式**（适合地理地形）
- 点击地标 → 详情弹窗
- 3D 视角旋转/倾斜
- 高度夸张系数可调

**C. 对比模式**（适合疆域演变）
- 左右分屏：战国七雄 vs 秦统一后
- 滑动滑块查看变化
- 或时间轴切换

#### 18.4.3 数据规范

**⚠️ 强制使用开源数据源（禁止手工标注）**

历史/地理课件中的所有地理要素（河流、城市、战役地点等）必须来自权威开源数据集,严禁低精度手工标注。

**🌟 标准数据源清单（v5.11 必选）**:

| 数据类型 | 数据源 | 下载地址 | 格式 | 覆盖范围 | 许可证 |
|:---|:---|:---|:---|:---|:---|
| **河流水系** | Natural Earth Rivers | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_rivers_lake_centerlines.json` | GeoJSON | 全球主要河流 | Public Domain |
| **历史行政区划** | CHGIS V6 | https://dataverse.harvard.edu/dataverse/chgis_v6<br/>复旦大学: https://yugong.fudan.edu.cn/CHGIS/ | Shapefile → GeoJSON | 中国历朝历代<br/>(-221~1911) | Free for academic use |
| **现代行政边界** | Natural Earth Admin | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/cultural/ne_10m_admin_0_countries.json` | GeoJSON | 全球国家边界 | Public Domain |
| **湖泊** | Natural Earth Lakes | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_lakes.json` | GeoJSON | 全球主要湖泊 | Public Domain |
| **历史城市** | CHGIS Place Names | https://chgis.fas.harvard.edu/<br/>数据库: Time Series Datasets | Shapefile<br/>CSV | 中国历代<br/>城市/县治 | Free for academic use |
| **DEM 地形** | AWS Terrain Tiles | https://registry.opendata.aws/terrain-tiles/<br/>Tile URL: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Terrarium RGB | 全球 30m 精度 | Public Domain |
| **海岸线** | Natural Earth Coastline | https://github.com/martynafford/natural-earth-geojson<br/>文件: `10m/physical/ne_10m_coastline.json` | GeoJSON | 全球 | Public Domain |

**🔧 数据处理流程**:

1. **下载原始数据**（Shapefile 或 GeoJSON）
2. **转换为标准 GeoJSON**（如果是 Shapefile）:
   ```bash
   # 使用 ogr2ogr (GDAL)
   ogr2ogr -f GeoJSON output.json input.shp
   ```
3. **简化坐标**（降低文件大小，不损失精度）:
   ```bash
   # 使用 mapshaper
   mapshaper input.json -simplify 0.1% -o output-simplified.json
   ```
4. **存储到项目中**:
   ```
   data/
   ├─ geography/
   │  ├─ rivers/
   │  │  └─ ne_10m_rivers_china.json
   │  ├─ lakes/
   │  │  └─ ne_10m_lakes_china.json
   │  └─ historical-china/
   │     ├─ qin-221bc.geojson (from CHGIS)
   │     ├─ han-206bc.geojson
   │     └─ tang-618ad.geojson
   └─ history/
      ├─ cities/
      │  └─ chgis-cities-qin.json
      └─ battles/
         └─ warring-states-battles.json (人工整理 + CHGIS 地名校准)
   ```

**历史疆域 GeoJSON 标准**：
```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "dynasty": "qin",
    "year": -221,
    "capital": [108.9, 34.3],
    "dataSource": "CHGIS V6",
    "sourceUrl": "https://dataverse.harvard.edu/dataset.xhtml?persistentId=...",
    "processedBy": "TeachAny",
    "processedDate": "2026-04-12"
  },
  "features": [{
    "properties": {
      "name": "关中郡",
      "type": "prefecture",
      "area": 45000,
      "chgisId": "v6_1820_county_pgn.123" // 保留原始数据 ID
    },
    "geometry": { "type": "Polygon", "coordinates": [[...]] }
  }]
}
```

**战役/城市标记数据标准**：
```jsonc
{
  "type": "FeatureCollection",
  "metadata": {
    "title": "秦灭六国战役地点",
    "period": "前230年-前221年",
    "dataSource": "CHGIS V6 地名数据库 + 史记战国策",
    "coordinateSource": "CHGIS Place Names"
  },
  "features": [{
    "type": "Feature",
    "properties": {
      "name": "长平之战",
      "chineseName": "长平之战",
      "date": "-260-05",
      "belligerents": ["秦", "赵"],
      "result": "秦胜",
      "casualties": { "qin": 50000, "zhao": 450000 },
      "terrainFactor": "太行山地形限制赵军机动",
      "modernLocation": "山西省晋城市高平市",
      "chgisId": "v6_place_5678", // CHGIS 地名 ID
      "elevation": 950
    },
    "geometry": {
      "type": "Point",
      "coordinates": [112.92, 35.80] // 来自 CHGIS，非手工标注
    }
  }]
}
```

**❌ 禁止的做法**:
```javascript
// ❌ 错误：手工标注坐标（精度低，无出处）
const rivers = [
  { name: "黄河", path: [[110, 35], [112, 36], ...] } // 禁止！
];

// ❌ 错误：使用闭源 API（无法离线使用）
fetch('https://api.某商业地图.com/rivers?key=xxx')

// ❌ 错误：直接嵌入大量 GeoJSON 到 HTML（文件巨大）
<script>const data = {"type":"FeatureCollection","features":[...]}</script>
```

**✅ 正确的做法**:
```javascript
// ✅ 正确：从预处理的 Natural Earth 数据加载
fetch('/data/geography/rivers/ne_10m_rivers_china.json')
  .then(res => res.json())
  .then(rivers => {
    map.addSource('rivers', {
      type: 'geojson',
      data: rivers
    });
    map.addLayer({
      id: 'rivers',
      type: 'line',
      source: 'rivers',
      paint: {
        'line-color': '#1976d2',
        'line-width': ['get', 'strokeweig'] // 使用 Natural Earth 自带的线宽属性
      }
    });
  });
```

#### 18.4.4 强制必选元素（历史/地理课件专用）

✅ **DEM 地形底图**：必须使用 3D 或伪 3D 地形（MapLibre GL + AWS Terrain Tiles）  
✅ **历史疆域叠加**：必须使用预置 GeoJSON（来自 CHGIS V6 或 Natural Earth）  
✅ **态势动画**：战争主题必须包含时间轴自动播放  
✅ **地标标注**：至少 5 个关键地点（坐标来自 CHGIS 或 Natural Earth）  
✅ **河流水系**：使用 Natural Earth Rivers 数据（禁止手工标注）  
✅ **交互控制**：缩放/平移/视角旋转或时间轴控制  
✅ **语音同步**：动画进度与音频时间轴同步（推荐）  
✅ **数据溯源**：每个 GeoJSON 文件必须在 metadata 中注明 dataSource 和 sourceUrl

#### 18.4.5 库选择决策树

```
历史/地理课件
├─ 需要真实 3D 地球？
│  ├─ 是 → Cesium.js
│  └─ 否 → 继续
├─ 需要地形起伏可视化？
│  ├─ 是 → Maplibre GL + Terrain-RGB
│  └─ 否 → 继续
├─ 性能要求高？
│  ├─ 是 → ECharts GL（推荐）⭐
│  └─ 否 → 任选上述方案
```

#### 18.4.6 验收标准（Phase 4 新增）

| 检查项 | 标准 | 权重 |
|:---|:---|:---:|
| **DEM 地形是否启用** | 必须有明显山脉起伏，terrain exaggeration ≥ 2.0 | 20% |
| **数据源准确性** | 河流/城市/边界必须来自 CHGIS/Natural Earth，禁止手工标注 | 15% |
| **历史疆域准确性** | 边界与史料一致（±5% 误差） | 15% |
| **态势动画流畅度** | ≥30 FPS | 10% |
| **时间轴完整性** | 关键事件全覆盖 | 10% |
| **地标坐标准确性** | 误差 <10km，坐标来自 CHGIS 数据库 | 10% |
| **音频动画同步** | 偏差 <500ms | 5% |
| **交互响应速度** | 延迟 <100ms | 5% |
| **移动端适配** | 触摸流畅 | 5% |
| **数据溯源** | GeoJSON 文件必须包含 metadata.dataSource 字段 | 5% |

**总分 ≥85 分通过。**

#### 18.4.7 数据预处理工具链（推荐）

**目标**：将 Shapefile/大 GeoJSON 转换为课件可用的小文件。

**工具组合**：
1. **ogr2ogr** (GDAL) - 格式转换
2. **mapshaper** - 几何简化
3. **tippecanoe** (可选) - 矢量切片（大数据集）

**示例工作流**：

```bash
# Step 1: 从 CHGIS 下载秦朝行政区划 Shapefile
# 假设下载文件: chgis_v6_221bc_counties.shp

# Step 2: 转换为 GeoJSON
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  qin-221bc-raw.geojson \
  chgis_v6_221bc_counties.shp

# Step 3: 简化几何形状（减少 90% 点数，视觉差异 <1px）
mapshaper qin-221bc-raw.geojson \
  -simplify 0.1% keep-shapes \
  -o qin-221bc.geojson

# Step 4: 提取中国区域河流（从 Natural Earth 全球数据）
mapshaper ne_10m_rivers_lake_centerlines.json \
  -filter 'SOV_A3 === "CHN"' \
  -o ne_10m_rivers_china.json

# Step 5: 验证文件大小
ls -lh qin-221bc.geojson
# 期望结果: < 500 KB (简化后)
```

**在线工具（无需安装）**：
- **Mapshaper Web**: https://mapshaper.org/
  - 可直接在浏览器中上传 Shapefile 并导出 GeoJSON
  - 可视化简化效果预览
- **GeoJSON.io**: https://geojson.io/
  - 查看/编辑 GeoJSON
  - 绘制简单几何形状

**CHGIS 数据下载指南**：

1. 访问 https://dataverse.harvard.edu/dataverse/chgis_v6
2. 选择时间切片（例如: `CHGIS V6 Qin (221 BC)`）
3. 下载 Shapefile 压缩包
4. 解压后使用 ogr2ogr 转换
5. 保存到 `data/geography/historical-china/` 目录

**Natural Earth 数据下载指南**：

1. 访问 https://github.com/martynafford/natural-earth-geojson
2. 直接下载 GeoJSON 文件（无需转换）:
   ```bash
   # 河流
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/physical/ne_10m_rivers_lake_centerlines.json
   
   # 湖泊
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/physical/ne_10m_lakes.json
   
   # 国家边界
   curl -O https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/cultural/ne_10m_admin_0_countries.json
   ```
3. 如需按国家过滤,使用 mapshaper 的 `-filter` 命令

**常见问题**：

Q: CHGIS 数据太大怎么办?  
A: 使用 mapshaper 简化到 0.05%-0.1%,或者按需裁剪特定区域。

Q: 如何处理历史战役地点（CHGIS 没有）?  
A: 从 CHGIS Place Names 数据库中查找对应古代地名坐标,手工整理到 battles.json,但必须标注 `chgisId` 字段作为溯源。

Q: 如何验证坐标准确性?  
A: 在 https://geojson.io/ 中查看,对比现代卫星地图和历史地图集（如《中国历史地图集》）。

---

### 18.5 参考文档

- 详细使用指南：`skill/map-resources-guide.md`
- 地形集成规范：`skill/terrain-3d-integration.md`
- 示范课件（在线查看）：
  - TeachAny Gallery: https://weponusa.github.io/teachany/

---
