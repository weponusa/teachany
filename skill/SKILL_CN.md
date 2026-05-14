---
name: TeachAny
version: 7.12.1
description: "K12 互动课件开发技能：用于制作或优化学科课件、教学动画、AI 学伴、TTS、知识图谱、PBL 学习路径与 TeachAny 发布。"
description_en: "K-12 interactive courseware creation for lesson pages, animations, AI tutor, TTS, knowledge graph, PBL paths, and TeachAny publishing."
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# TeachAny 中文入口

`SKILL_CN.md` 仅保留兼容入口。为避免中文用户同时加载两份超大主文件，当前唯一主规范已合并到：

- `SKILL.md`：轻量执行摘要，必读

按场景再读取卫星文档：

| 场景 | 读取 |
| --- | --- |
| 完整流程 | `phases/workflow.md` |
| 发布与打包 | `phases/packaging.md` |
| 视频/TTS | `phases/video-audio.md` |
| 基线规则与反模式 | `references/baseline-rules.md`, `RULES.md` |
| 互动设计 | `guides/interaction-patterns.md` |
| PBL 探究课 | `guides/project-based.md` |
| 页面结构 | `tech/page-structure.md` |
| 地图 / 3D / PPTX | `topics/maps-and-3d.md` |

执行时先读 `SKILL.md`，不要再把旧版中文长文整体加载进上下文。
