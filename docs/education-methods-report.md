# TeachAny Skill 教育方法与价值分析报告

**报告日期**：2026-04-16  
**分析对象**：TeachAny Skill v5.12+（`skill/SKILL.md` 170KB + `skill/SKILL_CN.md` 217KB）  
**覆盖学科**：数学、物理、化学、生物、地理、历史、语文、英语、信息技术（9学科）

---

## 一、教育方法全景图

TeachAny Skill 融合了 **14 套教育理论与方法**，形成一个完整的教学设计操作系统。这些方法不是简单罗列，而是被编织进了一个从"课前设计"到"课后评价"的 **4 阶段强制流程**（Phase 0.5 → Phase 1 → Phase 2 → Phase 3 → Phase 4），确保每个方法都有明确的执行节点和检查机制。

### 1.1 核心理论层（6套）

这些理论构成了 TeachAny 的底层设计哲学，贯穿所有学科和所有课件。

| # | 方法名称 | 理论来源 | 在 TeachAny 中的作用 | 执行位置 |
|:--|:---------|:---------|:---------------------|:---------|
| 1 | **ABT 叙事结构** | Randy Olson (2015) *Houston, We Have a Narrative* | 每个模块开头用 And-But-Therefore 三段式创造"知识缺口"，回答"为什么要学这个" | Phase 1 必填 |
| 2 | **认知负荷理论 (CLT)** | John Sweller (1988) *Cognitive Load Theory* | 控制单页信息量（~75字/卡片）、减少外在负荷、最大化关联负荷 | Phase 3 写内容时执行 |
| 3 | **Mayer 多媒体学习原则** | Richard Mayer (2009/2021) *Multimedia Learning* | 临近原则、信号原则、分割原则、预训练原则、冗余原则——指导图文排版和动画设计 | Phase 3 + Phase 4 检查 |
| 4 | **Bloom 认知分类（修订版）** | Anderson & Krathwohl (2001) | 练习题必须覆盖至少 3 个层级（记忆→理解→应用→分析→评价→创造），三段式作业设计 | Phase 1 标注 + Phase 4 检查 |
| 5 | **脚手架策略 (Scaffolding)** | Vygotsky (1978); Wood, Bruner & Ross (1976) | 三级渐撤支架（全支架→半支架→无支架），适用于写作、解题、论述等产出任务 | Phase 2 标记 + Phase 3 实现 |
| 6 | **ConcepTest 同伴教学法** | Eric Mazur (1997) *Peer Instruction* | 逐选项错因诊断（不只是"对/错"），目标达到 30-70% 首次正确率的"甜区" | Phase 3 练习设计 |

### 1.2 教学设计方法层（5套）

这些方法指导"怎么组织一节课"的结构和节奏。

| # | 方法名称 | 理论基础 | 在 TeachAny 中的作用 |
|:--|:---------|:---------|:---------------------|
| 7 | **五镜头法（TeachAny 原创）** | 融合 Wiggins & McTighe (2005) *Understanding by Design* 和 Perkins (1998) *Smart Schools* | 5种认知视角拆解难点：看见（可视化）→ 拆开（分步分解）→ 解释（因果机制）→ 比较（异同辨析）→ 迁移（新情境应用）。每个难点必选 2-3 个镜头组合 |
| 8 | **情境角色设计四要素** | 情境学习理论 (Lave & Wenger, 1991) | 四种经典情境模式：角色任务型、故事冲突型、生活现象型、文化传承型。每种模式必须包含真实性+角色感+冲突性+学科性中的至少3个要素 |
| 9 | **内容审计三分法** | Ruth Clark (2019) *Evidence-Based Training Methods* | 所有内容分为"必要/有帮助/装饰性"三级，装饰性内容必须削减。优先级：学习闭环 > 视觉效果 |
| 10 | **18分钟注意力重置** | Wilson & Korn (2007) 注意力研究 | 每15-18分钟插入注意力重置点（切换为互动/提问/活动），防止认知疲劳 |
| 11 | **课型分类与驱动模式** | 教学实践经验提炼 | 7种课型（新授课/复习课/习题课/专题课/实验课/项目制课/跨学科融合课）× 4种驱动模式（问题驱动/项目驱动/活动驱动/问题链驱动），用决策树匹配 |

### 1.3 自适应与个性化层（3套）

这些方法实现"因材施教"——不同水平的学生看到不同的内容。

| # | 方法名称 | 技术实现 | 在 TeachAny 中的作用 |
|:--|:---------|:---------|:---------------------|
| 12 | **自适应学习分支引擎** | `TeachAnyAdaptive` 前端引擎 + localStorage | 四路分支内容设计：review-prereq（前置不足→回顾）/ scaffold（掌握度低→额外例题+降级练习）/ normal（标准路径）/ challenge（已掌握→高阶任务+开放探究）。每个课件至少2个触发点 |
| 13 | **间隔重复引擎** | `TeachAnySR` 前端引擎 (SM-2 算法) | 完成模块后自动加入复习队列，按艾宾浩斯遗忘曲线安排复习间隔 |
| 14 | **探究式学习四级模型** | 科学探究教学理论 + 2022课标要求 | 四级探究深度（L1结构化→L2引导式→L3开放式→L4自主），匹配小学→高中。标准6步结构：情境提问→假设→设计验证→收集证据→分析结论→反思拓展 |

---

## 二、方法之间的协同关系

这14套方法不是孤立使用的，而是形成了一个**紧密协同的系统**：

```
                    ┌─────────────────────────────────┐
                    │    Phase 0.5: 知识层查阅         │
                    │   （课标数据 + 知识图谱 + 教材）  │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │    Phase 1: 教学骨架设计          │
                    │                                   │
                    │  ┌── 6 问设计 ──────────────┐    │
                    │  │ ABT叙事 + 情境角色       │    │
                    │  │ Bloom层级标注             │    │
                    │  │ 自适应四路分支规划 ⭐新增  │    │
                    │  │ 探究深度选择 ⭐新增        │    │
                    │  │ 学习记录单规划            │    │
                    │  └──────────────────────────┘    │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │    Phase 2: 学科模式选择          │
                    │                                   │
                    │  五镜头法选择（2-3个镜头组合）    │
                    │  脚手架策略标记                   │
                    │  课型 × 驱动模式匹配             │
                    │  内容审计三分法                   │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │    Generation Gate: 预检清单      │
                    │   （包含自适应+探究必填项 ⭐新增）│
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │    Phase 3: 内容制作              │
                    │                                   │
                    │  CLT 控制信息量                   │
                    │  Mayer 原则排版                   │
                    │  ConcepTest 逐选项诊断           │
                    │  18分钟注意力重置                 │
                    │  自适应引擎代码植入               │
                    │  间隔重复自动入列                 │
                    │  探究6步结构实现                  │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │    Completeness Gate: 27项检查    │
                    │   （含#25自适应+#26-27探究 ⭐新增）│
                    └─────────────────────────────────┘
```

### 关键协同点

1. **ABT叙事 × 探究式学习**：ABT的"But"（矛盾）天然就是探究的"情境提问"，两者在开篇合一
2. **Bloom分类 × 自适应分支**：scaffold路径降低Bloom层级，challenge路径提升至"评价/创造"
3. **脚手架 × 探究深度**：L1探究=全脚手架，L3探究=无脚手架，形成连续谱
4. **五镜头法 × 问题链驱动**：Level 1用"看见+拆开"，Level 4用"迁移+创造"，问题链与镜头一一对应
5. **CLT × Mayer原则**：两者共同控制信息呈现——CLT管"说多少"，Mayer管"怎么排"

---

## 三、与主流教育框架的对标

### 3.1 与 2022 版义务教育课程标准的对齐

| 课标核心素养要求 | TeachAny 对应实现 |
|:---|:---|
| **自主学习能力** | 自适应分支引擎 + 间隔重复 + 三段式分层作业（⭐/⭐⭐/⭐⭐⭐） |
| **科学探究素养** | 探究式学习四级模型 + 标准6步结构 + 控制变量三要素 |
| **信息意识与计算思维** | 信息技术学科专属框架 + 算法可视化组件 |
| **跨学科实践** | 跨学科融合设计（4种融合类型） + 项目驱动设计 |
| **核心概念理解** | 五镜头法 + ConcepTest 逐选项错因诊断 |

### 3.2 与国际教育理论的对应

| 国际理论/框架 | TeachAny 中的对应 | 覆盖深度 |
|:---|:---|:---|
| Bloom's Revised Taxonomy (2001) | 练习题层级标注 + 三段式作业 | ⭐⭐⭐⭐⭐ 完整覆盖6级 |
| Vygotsky's ZPD + Scaffolding (1978) | 三级脚手架 + 自适应分支 | ⭐⭐⭐⭐⭐ 有代码实现 |
| Sweller's CLT (1988) | 75字/卡片 + 1核心问题/模块 | ⭐⭐⭐⭐ 有量化指标 |
| Mayer's Multimedia Principles (2009) | 6项原则逐条实现 | ⭐⭐⭐⭐ 有检查清单 |
| Mazur's Peer Instruction (1997) | ConcepTest + 逐选项诊断 | ⭐⭐⭐⭐ 有模板 |
| Understanding by Design (2005) | 五镜头法 + 6问设计 | ⭐⭐⭐⭐ 原创融合 |
| Inquiry-Based Learning (NRC, 2000) | 四级探究模型 + 6步结构 | ⭐⭐⭐⭐⭐ v5.12+新增 |
| Mastery Learning (Bloom, 1968) | 自适应引擎 + 掌握度追踪 | ⭐⭐⭐⭐ 有代码引擎 |
| Spaced Repetition (Ebbinghaus) | SM-2 算法前端引擎 | ⭐⭐⭐ 有实现 |

---

## 四、TeachAny Skill 的核心价值

### 4.1 解决的核心问题

**问题**：AI 生成的教学内容通常是"知识堆砌 + 选择题"——没有教学设计、没有学习动机、没有错因诊断、没有个性化路径。

**对比**：

| 维度 | 普通 AI 生成 | TeachAny 生成 |
|:---|:---|:---|
| **课程结构** | 随机罗列要点 | ABT叙事 + 课型匹配 + 驱动模式选择 |
| **学习动机** | "今天我们学习 XX" | 情境角色 + 认知冲突 + 真实任务 |
| **评估方式** | "对 ✓ / 错 ✗" | 逐选项错因诊断 + 过程性评价量规 |
| **难度适配** | 一刀切 | 自适应四路分支 + 三级脚手架 |
| **探究实验** | 告诉结论 | 6步完整探究结构 + 认知冲突设计 |
| **学科差异** | 通用模板 | 9学科各有专属框架 |
| **知识来源** | 模型幻觉 | 课标数据 + 知识图谱 + 教材库（4级降级） |
| **学习持续性** | 一次性 | 间隔重复 + 跨课件路由 + 进度持久化 |

### 4.2 六大核心价值

#### 价值一：将教育理论从"知道"变为"必须执行"

传统做法是在培训手册中列出教育理论，靠教师自觉执行。TeachAny 将每个理论编码为**强制检查项**——Generation Gate（预检清单）和 Completeness Gate（27项输出检查）构成双重门禁。没有 ABT 引入、没有 Bloom 覆盖、没有自适应分支的课件，无法通过检查。

**核心机制**：理论 → 执行规范 → 检查清单 → 阻断规则

#### 价值二：零成本的自适应学习

传统自适应学习系统（如 Knewton、ALEKS）需要后端服务器、用户账号和数据库。TeachAny 用纯前端 `localStorage` 实现：
- 掌握度追踪（`TeachAnyAdaptive`）
- 间隔重复（`TeachAnySR`，SM-2算法）
- 进度持久化（`TeachAnyProgress`）
- 跨课件路由（`TeachAnyRouter`）

**全部在浏览器本地运行，无需任何服务器**，一个 HTML 文件即完成。

#### 价值三：课标对齐的知识层系统

TeachAny 不靠 AI "即兴发挥"，而是建立了完整的知识数据层：
- **304个知识节点**（9学科），全部注入 2022 版课标原文
- **教材补充素材库**（19个JSON文件，覆盖180+知识节点）
- **4级数据降级策略**：课标数据 → 知识图谱 → Web搜索 → 模型知识

这确保了**每一份课件的教学内容都有课标依据，而非 AI 编造**。

#### 价值四：从"单次使用"到"学习闭环"

一般的 AI 课件是一次性消费品。TeachAny 构建了完整闭环：
- **前测**检验起点 → **自适应分支**匹配路径 → **过程性评价**实时反馈 → **后测**检验增长 → **间隔重复**巩固记忆 → **跨课件路由**推荐下一站

#### 价值五：教育公平的工具

TeachAny 的设计哲学是"**每个学校、每个教师、每个家长，都能零成本定制属于每个孩子的可汗学院**"：
- MIT 开源协议
- 零后端依赖（GitHub Pages 免费托管）
- 离线可用（PWA 支持）
- 国内镜像（Gitee）
- 中英双语

#### 价值六：AI 生成内容的质量标准化

TeachAny 本质上是一套**AI 教学内容的质量标准**。它回答了：
- AI 生成的课件应该包含什么？（27项 Completeness Gate）
- 怎样算"教学设计合格"？（ABT + Bloom + 脚手架 + 自适应 + 探究）
- 怎样确保知识准确？（4级降级策略 + 课标对齐）
- 怎样实现个性化？（四路自适应分支 + 四级探究深度）

---

## 五、方法覆盖完整度评估

### 5.1 已充分覆盖的方法（强制执行+有检查）

| 方法 | Phase 设计要求 | Generation Gate 预检 | Completeness Gate 检查 | 代码实现 |
|:---|:---:|:---:|:---:|:---:|
| ABT 叙事 | ✅ Phase 1 | ✅ | ✅ #1 | — |
| Bloom 分类 | ✅ Phase 1 | ✅ | ✅ #6 | — |
| 脚手架策略 | ✅ Phase 2 | ✅ | ✅ #8 | — |
| 认知负荷 (CLT) | ✅ Phase 3 | — | ✅ #9 | — |
| Mayer 原则 | ✅ Phase 3 | — | ✅ #10 | — |
| ConcepTest | ✅ Phase 3 | — | ✅ #4 | — |
| 自适应分支 | ✅ Phase 1 | ✅ ⭐新增 | ✅ #25 ⭐新增 | ✅ `TeachAnyAdaptive` |
| 探究式学习 | ✅ Phase 1 | ✅ ⭐新增 | ✅ #26-27 ⭐新增 | — |
| 进度追踪 | ✅ Phase 3 | — | ✅ #21 | ✅ `TeachAnyProgress` |
| 间隔重复 | ✅ Phase 3 | — | — | ✅ `TeachAnySR` |

### 5.2 本次强化（v5.12+）新增的保障

| 之前状态 | 现在状态 | 变更 |
|:---|:---|:---|
| 自适应引擎代码存在，但 Phase 1-2 无设计要求 | Phase 1 强制填写自适应四路分支内容 | +预检字段 +检查项#25 |
| 探究散布在多处，无独立规范 | 独立章节 Section 2.6.2，含决策表+四级模型+6步结构 | +预检字段 +检查项#26-27 |
| Generation Gate 无自适应/探究检查 | 新增 `【自适应设计】` 和 `【探究设计】` 必填项 | 不可遗漏 |
| Completeness Gate 24项 | 扩展至 **27项** | +3项强制检查 |

---

## 六、总结

TeachAny Skill 不是一个简单的 prompt 模板，而是一个**将 14 套教育理论编码为可执行、可检查、可复现的教学设计系统**。它的价值在于：

1. **理论密度高**——融合的教育理论数量和深度在 AI 教学工具中罕见
2. **执行保障强**——双重 Gate（预检+输出检查）确保理论不是"写在纸上"
3. **技术门槛低**——零后端、纯 HTML、离线可用，真正的"普惠教育"
4. **个性化到位**——自适应四路分支+探究四级深度，实现"因材施教"
5. **课标对齐实**——304个知识节点全覆盖课标，不靠 AI 编造

**一句话概括**：TeachAny 把"好老师的教学直觉"变成了"AI 可以严格执行的操作规程"。

---

## 参考文献

1. Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman.
2. Clark, R.C. (2019). *Evidence-Based Training Methods* (3rd ed.). ATD Press.
3. Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1), 87-114.
4. Crouch, C.H. & Mazur, E. (2001). Peer Instruction: Ten years of experience and results. *American Journal of Physics*, 69(9), 970-977.
5. Graesser, A.C., Olde, B., & Klettke, B. (2002). How does the mind construct and represent stories? In M.C. Green et al. (Eds.), *Narrative Impact*. Lawrence Erlbaum.
6. Lave, J. & Wenger, E. (1991). *Situated Learning: Legitimate Peripheral Participation*. Cambridge University Press.
7. Mayer, R.E. (2009/2021). *Multimedia Learning*. Cambridge University Press.
8. Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall.
9. National Research Council. (2000). *Inquiry and the National Science Education Standards*. National Academies Press.
10. Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press.
11. Pellegrino, J.W., Chudowsky, N., & Glaser, R. (2001). *Knowing What Students Know*. National Academies Press.
12. Perkins, D. (1998). *Smart Schools*. Free Press.
13. Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285.
14. Vygotsky, L.S. (1978). *Mind in Society*. Harvard University Press.
15. Wiggins, G. & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.
16. Wilson, K. & Korn, J.H. (2007). Attention during lectures: Beyond ten minutes. *Teaching of Psychology*, 34(2), 85-89.
17. Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100.
