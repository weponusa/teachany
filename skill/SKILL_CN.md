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

### 2.2 ABT 叙事结构：And-But-Therefore

每个新模块默认使用三段式引入：

```text
【And】学生已经知道什么
【But】现有知识解决不了什么问题
【Therefore】所以这节课要学什么新工具/新视角
```

**示例**：
- 数学：你已经会画直线了（And），但有些轨迹是弯的（But），所以要学二次函数（Therefore）
- 历史：你知道事件发生顺序了（And），但还不知道为什么会发生（But），所以要分析因果链和史料证据（Therefore）
- 英语：你认识单词了（And），但真实交流时不会用（But），所以要做情境表达训练（Therefore）
- 生物：你知道植物细胞和动物细胞长得不同（And），但不知道细胞怎么变成两个（But），所以要学减数分裂（Therefore）

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

## 三、课型分类：不同课型用不同结构

不是所有课都是"新授课"。必须先判断课型，再选结构模板。

| 课型 | 核心目标 | 推荐结构 |
|:---|:---|:---|
| **新授课** | 建立新概念/新方法 | ABT引入 → 新知讲解 → 深层理解 → 即时练习 → 小结 |
| **复习课** | 梳理与串联已有知识 | 知识地图 → 易错辨析 → 综合练习 → 查缺补漏 |
| **习题课** | 提升解题能力 | 典型例题 → 变式训练 → 错因归类 → 举一反三 |
| **专题课** | 围绕一个主题深入探究 | 主题引入 → 多材料/多角度分析 → 综合产出任务 → 反思 |
| **实验/实践课** | 动手操作与观察 | 目标预测 → 操作步骤 → 记录观察 → 结论与讨论 |

**判断依据**：用户说"讲一个新知识点"→ 新授课；说"帮我出一套练习"→ 习题课；说"帮学生复习"→ 复习课；说"做一个主题探究"→ 专题课。

---

## 四、从"全科通用"到"学科适配"

本技能不默认所有学科都用同一种讲法。必须先搭通用底座，再切到学科专属模式。

### 4.1 学科适配总表

| 学科 | 主要学习对象 | 最适合的讲解方式 | 最适合的互动形式 | 最适合的评估方式 |
|:---|:---|:---|:---|:---|
| **数学** | 概念、关系、运算、证明 | 图形直觉 + 算理推导 + 一般化 | 作图、拖拽、分步推导、错因诊断 | 标准题 + 解释题 |
| **物理** | 现象、模型、公式、预测 | 现象观察 + 建模 + 定量分析 | 参数调节、实验预测、图像判读 | 预测题 + 计算题 + 解释题 |
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

吸收 `q-educator` 的经验，优先采用"问题/任务驱动"而非"概念罗列驱动"。

### 5.1 推荐引入顺序

```text
真实任务 / 现象 / 问题 → 学生尝试 → 暴露不足 → 引入新知识 → 立即应用
```

### 5.2 各学科任务引入示例

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

---

## 十一、课件开发标准流程

### Phase 0：确定对象与目标
- 回答 6 问
- 明确学科、学段、课型（新授/复习/专题/习题/实验）
- 判断要不要前测、要不要动画、要不要开放任务

### Phase 0.5：知识层查阅（Knowledge Layer Lookup）

> 在动手做内容之前，先查一下知识层有没有现成的数据。**默认采用 graph-first + 按需检索**，不要先通读整个 `data/`。

#### 推荐顺序（优先级从高到低）

1. **先用轻量检索脚本拿摘要**：
   - 优先执行：`python3 scripts/knowledge_layer.py lookup --topic "主题" --subject 学科 --top 3 --errors 3 --exercises 3`
   - 例如：
     - `python3 scripts/knowledge_layer.py lookup --topic "一次函数" --subject math`
     - `python3 scripts/knowledge_layer.py lookup --topic "光合作用" --subject biology`
   - 目标：先拿到**紧凑上下文**，只看命中的 `subject/domain/node`，节省上下文和模型消耗。

2. **只有在摘要不够时，再回读原始 JSON**：
   - 根据检索结果再去读 `data/{subject}/{domain}/_graph.json`
   - 必要时再补读 `_errors.json`、`_exercises.json`
   - **禁止**在没有命中的情况下大范围遍历多个 domain。

3. **读取知识图谱** `_graph.json` 时，优先提取这些字段：
   - 精确定义：`definition`
   - 前置知识链：`prerequisites`
   - 后续知识：`leads_to`
   - 课程标准定位：`grade`、`semester`、`unit`
   - 真实场景：`real_world`
   - 记忆锚点：`memory_anchors`
   - Bloom 行为动词：`bloom_verbs`

4. **读取易错点库** `_errors.json` 时，只抽取与当前 node 直接相关的条目：
   - 重点看：`description`、`diagnosis`、`trigger`、`frequency`
   - 用于设计针对性的练习干扰项和错误反馈

5. **读取题库** `_exercises.json` 时，只抽取当前课件真正要用的题：
   - 优先选与当前教学目标匹配的 `bloom_level`
   - 不要整份题库全部塞进上下文

6. **如果对应目录不存在**：
   - 跳过此步骤，依赖模型自身知识生成内容
   - 但要明确提示：**此主题未命中知识层，准确性和稳定性可能较低**

#### 硬规则

- **先检索，后细读**
- **先 node，后 domain**
- **先摘要，后原文**
- **优先复用图谱中的定义、前置链、真实场景、易错点、题目，不重复现编**
- **若图谱已有足够内容，课件文案、前测、练习、反馈应尽量从图谱派生，而不是重新发明一套**

### Phase 1：搭建教学骨架
- 用 ABT 写每个模块的引入
- 列知识点并做内容三分法审计
- 建立前置知识链
- 确定每个模块的核心问题

### Phase 2：选择学科模式
- 查学科适配总表（4.1），选讲解框架、互动组件、评估题型
- 标记需要"深层理解"的难点，选五镜头组合
- 决定脚手架策略（哪些任务需要分级支架）

### Phase 3：制作内容
- 写网页结构和卡片文案
- 实现互动练习与反馈
- 如需要，再补 Remotion 动画
- 如需要配音，编写旁白脚本并生成 TTS 语音
- 生成与动画帧对齐的双语字幕数据
- 让每个模块都有"学了马上用"的任务
- 遵守 Mayer 原则排版图文

### Phase 4：教学审查清单
- [ ] 是否真的回答了"为什么学"（ABT 引入有效）
- [ ] 是否每个难点都被拆开讲了（五镜头覆盖）
- [ ] 是否至少有一次真正的输出任务（产出题或开放任务）
- [ ] 是否有针对性的纠错反馈（不只是"正确/错误"）
- [ ] 是否能从后测看出学习效果
- [ ] Bloom 层级是否覆盖至少 3 级
- [ ] 注意力重置点间隔是否合理
- [ ] 脚手架是否有分级（全支架→半支架→无支架）
- [ ] 每张卡片核心文字是否控制在 75 字左右
- [ ] 相关图文是否贴近放置（Mayer 临近原则）

---

## 十二、输出物要求

根据任务规模，可交付以下内容中的一部分或全部：

**L1 — 互动课件**（必选）：
- `public/index.html`：完整互动网页课件（中文）
- `public/index_en.html`：完整互动网页课件（英文，双语时提供）
- 练习题与答案反馈设计
- 开放任务量规
- 前测/后测题组
- 模块化教学文案

**L2 — 教学动画**（用户需要视频时提供）：
- `src/compositions/*.tsx`：教学动画组件
- `src/Root.tsx`：Remotion 注册文件
- `src/SfxPlayer.tsx`：音效播放器组件
- `src/SubtitleTrack.tsx`：双语字幕叠加组件
- `generate-sfx.js`：音效生成器
- `package.json` / `tsconfig.json` / `remotion.config.ts`：项目配置

**L3 — AI 语音讲解**（用户需要配音时提供）：
- `scripts/narration_zh.json`：中文旁白脚本（含帧时间戳）
- `scripts/narration_en.json`：英文旁白脚本（含帧时间戳）
- `scripts/generate-tts.py`：Edge TTS 生成脚本
- `scripts/generate-srt.py`：SRT 字幕导出脚本
- `public/tts/*.mp3`：生成的语音音频文件
- `public/tts/*.srt`：生成的字幕文件

---

## 十三、使用时的明确要求

使用本技能时，应主动做到：
- **先判断课型**（新授/复习/习题/专题/实验），再选结构
- **先判断学科**，再选讲解框架和互动组件，不要默认用数学模式
- **不要默认所有知识点都要"公式推导"**
- **不要只有讲解，没有练习和反馈**
- **不要只做选择题**，要补解释题或产出题
- **不要只顾页面好看，忽略学习闭环**
- **不要在没有必要时堆过多动画和装饰**
- **文科类任务必须有脚手架分级和量规评价**
- **涉及空间/几何/图形推理的例题和练习必须配图** — 几何题用内联 SVG（三角形、圆、角、平行线），坐标图用 Canvas，理科实验用标注插图。纯文字的几何证明题没有配图是教学不完整的。详见第十八节 18.8 实现指南。

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
| 脚手架理论 | Vygotsky, L.S. (1978). *Mind in Society*; Wood, D., Bruner, J.S., & Ross, G. (1976). | 三级递进难度策略 |
| 逆向设计 | Wiggins, G. & McTighe, J. (2005). *Understanding by Design*. | 目标反推式课程结构 |
| 循证培训 | Clark, R.C. (2019). *Evidence-Based Training Methods*. | 内容审计与效果评估 |

**TeachAny 原创贡献**：五镜头法（Five-Lens Method）、学科适配矩阵（Subject Adaptation Matrix）、6 问预设计框架（6-Question Pre-Design）、课型分类体系、Phase 4 审查清单均为本项目独立创作。

---

## 十五、视频与音频制作流水线

TeachAny 在互动 HTML 课件之上，支持可选的**视频 + AI 配音**增强层。本节定义从自动化环境搭建、语音生成到双语字幕渲染的完整流水线。

### 15.1 架构分层

| 层级 | 产物 | 依赖 | 是否必选 |
|:-----|:-----|:-----|:---------|
| **L1 — 互动课件** | `public/index.html` | 无（零依赖） | ✅ 始终提供 |
| **L2 — 教学动画** | `out/*.mp4`（Remotion 渲染） | Node.js ≥ 18、npm、ffmpeg | 可选 |
| **L3 — AI 语音讲解** | `public/tts/*.mp3` + `public/tts/*.srt` | Python 3.8+、edge-tts | 可选 |

**核心原则**：L1 始终可独立运行。L2 和 L3 是渐进式增强。

### 15.2 Remotion 自动化安装

当用户需要视频动画时，按以下步骤自动执行环境搭建：

#### 第 1 步：环境检测

```bash
# 检查 Node.js
node -v  # 要求 >= 18.0.0

# 检查 ffmpeg（Remotion 渲染必需）
ffmpeg -version
# macOS 缺失时：brew install ffmpeg
# Ubuntu 缺失时：sudo apt install ffmpeg
# Windows 缺失时：choco install ffmpeg
```

#### 第 2 步：初始化项目

```bash
# 创建 package.json 并安装 Remotion 依赖
npm init -y
npm install remotion @remotion/cli @remotion/bundler react react-dom typescript @types/react
```

#### 第 3 步：标准 package.json

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

### 15.4 Edge TTS 集成

#### 安装

```bash
pip install edge-tts
# 或
pip3 install edge-tts
```

#### 语音选择

| 语言 | Voice ID | 名称 | 风格 |
|:-----|:---------|:-----|:-----|
| **中文（女声）** | `zh-CN-XiaoxiaoNeural` | 晓晓 | 温暖清晰，K-12 推荐 |
| **中文（男声）** | `zh-CN-YunxiNeural` | 云希 | 年轻男声，有活力 |
| **英文（女声）** | `en-US-JennyNeural` | Jenny | 清晰标准美式 |
| **英文（男声）** | `en-US-GuyNeural` | Guy | 专业成熟 |

#### TTS 脚本格式

以 JSON 格式创建旁白脚本，含帧对齐时间戳：

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

#### TTS 生成脚本

`scripts/generate-tts.py`：
```python
#!/usr/bin/env python3
"""使用 Edge TTS 生成语音音频和 SRT 字幕。"""
import asyncio
import json
import os
import edge_tts

VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-JennyNeural",
}

async def generate_episode(episode_data, lang, output_dir):
    voice = VOICE_MAP[lang]
    os.makedirs(output_dir, exist_ok=True)
    
    for seg in episode_data["segments"]:
        mp3_path = os.path.join(output_dir, f"{seg['id']}_{lang}.mp3")
        communicate = edge_tts.Communicate(seg["text"], voice)
        await communicate.save(mp3_path)
        print(f"✅ {mp3_path}")

async def main():
    import sys
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    script_file = f"scripts/narration_{lang}.json"
    
    with open(script_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)
    
    for ep in episodes:
        output_dir = f"public/tts/{ep['episode']}"
        await generate_episode(ep, lang, output_dir)
    
    print(f"\n🎤 所有 {lang} 旁白生成完毕！")

if __name__ == "__main__":
    asyncio.run(main())
```

运行：
```bash
python3 scripts/generate-tts.py zh   # 生成中文旁白
python3 scripts/generate-tts.py en   # 生成英文旁白
```

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
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
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

**技能版本**：v5.3  
**更新日期**：2026-04-07  
**变更摘要**：
- v1.0：数理课件版
- v2.0：拆成通用底座+学科适配层
- v3.0：补 Bloom 完整表、课型分类、脚手架策略、Mayer 原则、五镜头选择指引、3 学科完整示例、视觉设计细则、Phase 4 审查清单
- v4.0：新增视频与音频制作流水线（Remotion 自动安装、Edge TTS 集成、双语字幕系统、语言配置）、Token 与成本估算
- v5.3：新增例题配图硬性规范（Section 13）——涉及空间/几何/图形推理的例题和练习必须配图；详见英文版 SKILL.md Section 18.8 完整实现指南。
