#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重建 SKILL_CN.md 主文：保留必读骨架 + 新路由表。
"""
from pathlib import Path

HERE = Path(__file__).parent.resolve()
SRC = HERE / "SKILL_CN.md"
OUT = HERE / "SKILL_CN.md"  # 原地替换

src_lines = SRC.read_text(encoding="utf-8").splitlines(keepends=True)

def extract(start: int, end: int) -> str:
    return "".join(src_lines[start - 1:end])

# ================ 主文三段组装 ================

# Part 1: frontmatter + 标题简介（1-18 行）
part_head = extract(1, 18)

# Part 2: 新的文档路由（取代原 19-32 行的旧路由）
part_routing = """## 📖 文档路由（渐进披露）

> 本文件是 TeachAny 的**必读骨架**，每次生成课件时必读。
> 以下卫星文档按 Phase 或场景触发加载，**无需一次性全部读入**，避免上下文爆炸。

### 必读骨架（本文件已包含）

零、基线能力清单 · 一、何时使用 · 二、通用教学设计底座 · 三、课型分类 · 四、学科适配 · 十三、硬规则总览 · 十四、理论基础 · 十八、地图入口

### Phase 流程延伸

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`phases/workflow.md`](./phases/workflow.md) | 完整 Phase 0→4 执行细节 + Gate 检查点 | Phase 执行过程中逐步查阅 |
| [`phases/deliverables.md`](./phases/deliverables.md) | L2/L3 触发条件与产物要求 | L2/L3 交付决策点 |
| [`phases/video-audio.md`](./phases/video-audio.md) | Remotion/TTS/ffmpeg 流水线 | 做视频/语音基线时 |
| [`phases/packaging.md`](./phases/packaging.md) | 课件打包 + registry + 发布 | L4 打包或发布时 |
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

### 其他卫星文档（已存在）

| 文档 | 内容 | 触发时机 |
|:---|:---|:---|
| [`RULES.md`](./RULES.md) | 57 条硬规则完整列表 | Completeness Gate 按需 |
| [`curriculum-standards.md`](./curriculum-standards.md) | 课标速查表（21 棵国内课标树） | Phase 0.5 知识查询 |
| [`historical-maps.md`](./historical-maps.md) | 地图资源完整规范 | 历史/地理课件 |
| [`CHANGELOG.md`](./CHANGELOG.md) | 版本变更日志 | 仅需了解版本演进 |

"""

# Part 3: 必读章节合并
# ## 零、基线能力清单          33-371
# ## 一、何时使用               372-384
# ## 二、通用教学设计底座        385-705
# ## 三、课型分类               706-752
# ## 四、学科适配               753-1118
# ## 十三、硬规则总览           4553-4560
# ## 十四、理论基础             4561-4582
# ## 十八、地图入口             5995-6001
part_body = (
    extract(33, 1118)    # 零、一、二、三、四 连续
    + extract(4553, 4582)  # 十三、十四
    + extract(5995, 6001)  # 十八
)

# 拼合
final = part_head + part_routing + part_body
OUT.write_text(final, encoding="utf-8")

lines = final.count("\n") + (0 if final.endswith("\n") else 1)
size = OUT.stat().st_size
print(f"已重建 SKILL_CN.md：{lines} 行，{size} 字节 ({size/1024:.1f} KB)")
