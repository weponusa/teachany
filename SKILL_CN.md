---
name: TeachAny
description: "K12各学科互动教学课件开发技能。当用户需要制作教学课件、互动课件、教学动画，或提到 K12、课件、教学设计、知识点讲解时触发。适用于数学、物理、化学、生物、地理、历史、语文、英语、信息技术等学科，融合认知负荷理论、ABT叙事结构、Bloom认知分类、同伴教学法等方法论。"
---

# TeachAny（教我学）：K12 互动教学课件开发技能

完整规范、卫星文档、脚本、模板和资源都放在 [`./skill/`](./skill/) 子目录中。

> ⚠️ **AI 在准备执行 TeachAny 任务时必须读取**：
>
> - [`./skill/SKILL_CN.md`](./skill/SKILL_CN.md) — 必读骨架（中文，本技能的真源）
> - [`./skill/SKILL.md`](./skill/SKILL.md) — 英文镜像
> - [`./skill/RULES.md`](./skill/RULES.md) — 67 条硬规则
> - [`./skill/guides/`](./skill/guides/) — 教学设计延伸
> - [`./skill/phases/`](./skill/phases/) — Phase 流程延伸
> - [`./skill/tech/`](./skill/tech/) — 技术实现延伸
> - [`./skill/templates/`](./skill/templates/) — HTML 模板
> - [`./skill/scripts/`](./skill/scripts/) — 自动化脚本（publish、validate、hero、TTS、地图等）

## 既有课件资产位置

为缩小安装体积，328 个社区课件、官方示范课件、Hero 图床等已迁出到独立的课件仓库：

- 仓库：<https://github.com/weponusa/teachany-courseware>
- Gallery：<https://weponusa.github.io/teachany-courseware/>

`/install-skill` 安装本仓库（`weponusa/teachany`）后只包含**制作器内核**：
SKILL 规范、Phase 文档、脚本、知识树、课标摘录、地图等。
既有课件在线浏览即可，不再下载到本地。
