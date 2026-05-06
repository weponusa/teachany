# SKILL_CN.md 拆分执行计划

源文件：`skill/SKILL_CN.md`（6001 行 / 332 KB / ~83K tokens）
目标：主文瘦身到 ~900 行，卫星文档按需加载，单次激活技能的上下文占用从 ~83K tokens 降到 ~15K tokens。

---

## 一、保留在主文（SKILL_CN.md）的必读骨架

每次生成课件都需要的部分。行号基于源文件。

| 原章节 | 原行号 | 行数 | 处理 |
|:---|---:|---:|:---|
| 文件头 frontmatter + 标题简介 | 1-18 | 18 | **保留** |
| ## 📖 文档路由（渐进披露） | 19-32 | 13 | **重写**为新路由表 |
| ## 🚨 零、强制基线能力清单 | 33-371 | 338 | **保留** |
| ## 一、何时使用 | 372-384 | 12 | **保留** |
| ## 二、通用教学设计底座 | 385-705 | 320 | **保留** |
| ## 三、课型分类与驱动模式 | 706-752 | 46 | **保留** |
| ## 四、从"全科通用"到"学科适配" | 753-1118 | 365 | **保留** |
| ## 十三、57 条硬规则 | 4553-4560 | 7 | **保留**（引用 RULES.md）|
| ## 十四、理论基础 | 4561-4582 | 21 | **保留** |
| ## 十八、地图资源入口 | 5995-6001 | 6 | **保留**（引用卫星文档）|

**主文合计：~1146 行（~60KB / ~15K tokens）**

---

## 二、拆分到卫星文档的内容

### guides/ 目录（教学设计类延伸）

| 新文件 | 来源章节 | 源行号 | 行数 | 触发时机 |
|:---|:---|---:|---:|:---|
| `guides/project-based.md` | 五、项目制与任务驱动 | 1119-1242 | 123 | 做 PBL/任务驱动课件时 |
| `guides/interaction-patterns.md` | 六、互动与页面形态库 | 1243-1346 | 103 | Phase 3 选择交互形态时 |
| `guides/assessment.md` | 七、评估系统 | 1347-1454 | 107 | 设计评估/练习题时 |
| `guides/prerequisites.md` | 八、前置知识链与学段差异 | 1455-1509 | 54 | Phase 0.5 知识查询阶段 |
| `guides/examples.md` | 九、三个学科完整微型示例 | 1510-1567 | 57 | 需要参考完整示例时 |

### tech/ 目录（技术实现类 — 拆第十章 1953 行）

| 新文件 | 来源小节 | 源行号 | 行数 | 触发时机 |
|:---|:---|---:|---:|:---|
| `tech/stack.md` | 10.1 推荐技术组合 | 1570-1580 | 11 | Phase 0.5 技术选型 |
| `tech/page-structure.md` | 10.2 互动网页标准结构 | 1581-2622 | 1042 | Phase 3 编写 HTML 时 |
| `tech/design-system.md` | 10.3 视觉设计规范（按学段分级） | 2623-2742 | 120 | Phase 3 写样式时 |
| `tech/ai-multimodal.md` | 10.4 AI 多模态互动区（可选） | 2743-3273 | 531 | 做多模态互动时 |
| `tech/workbuddy-agents.md` | 10.5 WorkBuddy 多 Agent 协作 | 3274-3521 | 248 | 启用多 Agent 并行时 |

### phases/ 目录（流程/交付类）

| 新文件 | 来源章节 | 源行号 | 行数 | 触发时机 |
|:---|:---|---:|---:|:---|
| `phases/workflow.md` | 十一、课件开发标准流程 | 3522-4460 | 939 | Phase 0/0.5/1/2/3/4 执行时 |
| `phases/deliverables.md` | 十二、输出物 L2/L3 触发机制 | 4461-4552 | 92 | L2/L3 阶段决策 |
| `phases/video-audio.md` | 十五、视频与音频制作流水线 | 4583-5158 | 576 | Remotion/TTS 阶段 |
| `phases/token-cost.md` | 十六、Token 消耗与成本估算 | 5159-5210 | 52 | 需要估算成本时 |
| `phases/packaging.md` | 十七、课件打包与分发 | 5211-5994 | 784 | L4 打包/发布阶段 |

---

## 三、拆分后的文件清单与规模

```
skill/
├── SKILL_CN.md            (~60 KB, ~1146 行)  ⭐ 必读骨架
├── SKILL.md               (暂不动，英文镜像)
├── RULES.md               (已有，按需查阅)
├── CHANGELOG.md           (已有)
├── curriculum-standards.md (已有)
├── historical-maps.md     (已有)
├── guides/
│   ├── project-based.md
│   ├── interaction-patterns.md
│   ├── assessment.md
│   ├── prerequisites.md
│   └── examples.md
├── tech/
│   ├── stack.md
│   ├── page-structure.md
│   ├── design-system.md
│   ├── ai-multimodal.md
│   └── workbuddy-agents.md
└── phases/
    ├── workflow.md
    ├── deliverables.md
    ├── video-audio.md
    ├── token-cost.md
    └── packaging.md
```

**总计**：主文 + 15 个卫星文档，拆分无内容丢失（总字节数保持不变）。

---

## 四、主文新路由表设计

```markdown
## 📖 文档路由（渐进披露）

> 本文件是 TeachAny 的**必读骨架**，每次生成课件时必读。
> 以下卫星文档按 Phase 或场景触发加载，无需一次性全部读入。

### 必读骨架（本文件已包含）
零、基线能力清单 · 一、何时使用 · 二、通用教学设计底座 · 三、课型分类 · 四、学科适配 · 十三、硬规则总览 · 十四、理论基础 · 十八、地图入口

### Phase 流程延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| `phases/workflow.md` | 完整 Phase 0→4 执行细节 + Gate 检查点 | Phase 执行过程中逐步查阅 |
| `phases/deliverables.md` | L2/L3 触发条件与产物要求 | L2/L3 交付决策点 |
| `phases/video-audio.md` | Remotion/TTS/ffmpeg 流水线 | 做视频/语音基线时 |
| `phases/packaging.md` | 课件打包 + registry + 发布 | L4 打包或发布时 |
| `phases/token-cost.md` | 消耗估算与成本控制 | 规划长课件时 |

### 教学设计延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| `guides/project-based.md` | 项目制与任务驱动设计 | 做 PBL / 任务驱动课 |
| `guides/interaction-patterns.md` | 互动形态库与场景匹配 | Phase 3 选择交互形态 |
| `guides/assessment.md` | 评估系统与三级练习 | 设计练习/评估时 |
| `guides/prerequisites.md` | 前置知识链与学段差异 | Phase 0.5 知识查询 |
| `guides/examples.md` | 三个学科完整微型示例 | 需要参考完整范例 |

### 技术实现延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| `tech/stack.md` | 推荐技术组合 | Phase 0.5 技术选型 |
| `tech/page-structure.md` | 互动网页标准结构（最详细） | 编写 HTML 主体时 |
| `tech/design-system.md` | 视觉设计规范（按学段分级） | 写 CSS 样式时 |
| `tech/ai-multimodal.md` | AI 多模态互动区（可选功能） | 做多模态互动 |
| `tech/workbuddy-agents.md` | WorkBuddy 多 Agent 协作流水线 | 启用多 Agent 并行 |

### 其他卫星文档（已存在）

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| `RULES.md` | 57 条硬规则完整列表 | Completeness Gate 按需 |
| `curriculum-standards.md` | 课标速查表（21 棵国内课标树） | Phase 0.5 知识查询 |
| `historical-maps.md` | 地图资源完整规范 | 历史/地理课件 |
| `CHANGELOG.md` | 版本变更日志 | 仅需了解版本演进 |
```

---

## 五、执行步骤

1. ✅ 读取并分析章节边界
2. 🔄 生成本计划文档（本文件）
3. ⏳ 创建 `guides/`、`tech/`、`phases/` 三个目录
4. ⏳ 按行号范围切分 15 份卫星文档（每份头部加统一的"归属说明"）
5. ⏳ 重写 SKILL_CN.md：保留必读骨架 + 新路由表
6. ⏳ 校验：总字节数对齐、章节无遗漏、主文行数 ~1146、卫星总行数 ~4839、两者相加 ≈ 6001
7. ⏳ 不动英文版 SKILL.md（下一轮同步）

---

## 六、收益预估

| 指标 | 现状 | 拆分后 | 改善 |
|:---|---:|---:|---:|
| SKILL_CN.md 大小 | 332 KB | ~60 KB | **-82%** |
| SKILL_CN.md 行数 | 6001 | ~1146 | **-81%** |
| 单次激活上下文 tokens | ~83K | ~15K | **-82%** |
| 可用上下文窗口（200K 总） | 117K | 185K | **+58%** |
| 卫星文档数 | 5 | 15 | **+10 份按需加载** |
