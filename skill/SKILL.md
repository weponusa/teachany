---
name: TeachAny
version: 7.12.1
description: "K-12 interactive courseware creation. Use for school-subject lesson pages, animations, AI tutor, TTS, knowledge graph, PBL learning paths, or TeachAny publishing."
description_zh: "K12 互动课件开发技能：用于制作或优化学科课件、教学动画、AI 学伴、TTS、知识图谱、PBL 学习路径与 TeachAny 发布。"
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# TeachAny：K12 互动课件执行摘要

TeachAny 的目标不是把知识堆进页面，而是把一节课做成**有问题锚点、有互动、有讲解、有评估、有发布闭环**的学习体验。主文件只保留决策骨架；细节按需读取卫星文档。

## 何时使用

使用本技能：

- 用户要制作、改造、调试或发布 K12 学科课件、互动网页、微课、教学动画、PBL 探究课。
- 用户提到：`课件`、`教学设计`、`AI 学伴`、`TTS`、`知识图谱`、`课标`、`PBL`、`学习路径`、`发布到 Gallery`、`rebuild-index`。
- 用户是家长/教师/学生，目标是帮助中小学生理解一个具体知识点。

不要使用：企业培训、成人职业技能课、通用网站/App、纯 PPT/Word 格式转换、非 K12 展览页。

## Quick Start

用户：`我儿子初二搞不懂浮力，做个能玩的页面。`

优先输出路径：

1. 判断为**快速模式**：单知识点、非正式发布、先交付可用 HTML。
2. 查找或确认 `node_id`，复制 `templates/course-skeleton.html`。
3. 用“为什么沉浮不同？”做问题锚点，加入拖拽物体/液体密度的 Canvas 互动。
4. 保留标准五件套挂载：AI 学伴、TTS、section hints、知识图谱、导师卡片。
5. 本地验证无错；用户要求发布时再进入完整发布流程。

## 模式选择

### 快速模式（默认给普通家长/教师）

适用：单概念讲解、临时课堂演示、用户只要“先能用”。

- 可跳过 Remotion、批量 TTS、三仓发布。
- 必须保留：问题锚点、一个真实互动、基础练习/反馈、移动端可用、标准模块占位。
- 交付后说明哪些增强项未启用，用户确认发布或“做完整版”时再补齐。

### 完整模式（用于正式课件/发布）

适用：用户明确要发布、Gallery 上线、完整微课、批量维护。

- 执行 Phase 0→4。
- 启用 19 项基线：TTS、Remotion、Canvas/互动、Hero 图、AI 学伴、知识图谱、移动端、manifest、发布注册等。
- 完成后必须验证并按权限推送。

### 基础设施模式（维护 TeachAny 本身）

适用：修 `scripts/`、模板、Gallery、知识树、PBL、发布链路。

- 直接定位问题、修复、验证、提交推送。
- 不套用课件制作的全流程，但必须遵守闭环验证。

## 4-Phase 流程

```text
Phase 0  定义与检索：学生/学段/主题/课型/输出模式，定位 node_id
Phase 1  教学骨架：问题锚点 + ABT 叙事 + 互动/评估设计
Phase 2  构建页面：复制模板，填内容，接入标准模块与资源
Phase 3  验证交付：运行质量检查，浏览器/命令闭环验证
Phase 4  发布注册：仅在正式发布或用户要求时执行 Git/Registry/Gallery 流程
```

完整细节见 `phases/workflow.md`；发布细节见 `phases/packaging.md`。

## 核心规则（最终有效版）

1. **模板优先**：新课件先复制 `templates/course-skeleton.html` 与 `templates/manifest-template.json`，不要从空白页手写平台接线。
2. **学习闭环优先**：每课必须有问题锚点、互动尝试、即时反馈、总结迁移；视觉炫技不能替代学习设计。
3. **标准模块优先**：AI 学伴、导师卡片、TTS narrator、section hints、知识图谱优先用标准模块 API，不重复手写。
4. **真实互动**：标题写“互动/实验/探究/地图/画布”就必须可操作；静态图不能伪装互动。
5. **知识图谱入树**：优先匹配官方 `node_id`；没有则注册；确实无法归类才用 `free_mode` 或 `ext-*`。
6. **地图库优先**：历史/地理先用 `scripts/find-map.py` 查 bundled map library，再考虑外部数据或生成。
7. **数理化必须加载仿真工具文档**：制作**数学/物理/化学/生物**课件时，**在 Phase 2 开始前必须先读** `tech/iframe-resources.md`，按学科-工具快查表选择并嵌入至少 1 个外部交互工具（PhET / GeoGebra / Desmos / 3Dmol.js 等）。不得用纯静态图或简单 Canvas 代替已有成熟工具的场景。
8. **依赖分级**：Python/Git/浏览器验证是核心依赖；Remotion、edge-tts、ffmpeg、image_gen 是增强依赖。快速模式允许增强依赖降级，完整发布必须补齐或明确用户豁免。
8. **发布先检测环境**：没有目标仓库、权限或远端不可达时，不要假设 `weponusa/*` 可写；先提示 fork/跳过发布/本地交付。
9. **闭环验证**：说“完成/修复/可用”前必须跑命令或浏览器验证，并给出关键输出。
10. **一类问题一起扫**：修一个模块或模式后，检查同类文件、模板、courseware/opensource 双仓是否同步。

完整硬规则、基线清单与反模式：按需读 `references/baseline-rules.md`、`RULES.md`。

## 文档路由（按需加载）

| 场景 | 读取 |
| --- | --- |
| 完整 Phase 细节 | `phases/workflow.md` |
| 打包、Registry、Gallery、Git 发布 | `phases/packaging.md` |
| TTS、Remotion、视频音频 | `phases/video-audio.md` |
| 19 项基线与反模式 | `references/baseline-rules.md` |
| Phase 1 问卷 | `references/phase1-checklist.md` |
| 互动形态 | `guides/interaction-patterns.md` |
| PBL/探究课 | `guides/project-based.md` |
| 练习评估 | `guides/assessment.md` |
| 页面结构与 CSS | `tech/page-structure.md`, `tech/design-system.md` |
| 数学/科学仿真 | `tech/math-animations.md`（数学课件**必读**）, `tech/science-simulations.md`（物理/化学/生物课件**必读**） |
| **可嵌入 iframe 资源总目录** | `tech/iframe-resources.md`（**数理化必读**，PhET/GeoGebra/Desmos/3Dmol/LearningApps 等完整清单） |
| 地图 / 3D / PPTX | `topics/maps-and-3d.md` |
| 示例 | `guides/examples.md` |

## 常用脚本

假设 `TEACHANY_SKILL` 指向 skill 安装目录，`COURSE_DIR` 指向课件目录：

```bash
export TEACHANY_SKILL=/path/to/teachany/skill
export COURSE_DIR=/path/to/teachany/community/<course-id>
python3 "$TEACHANY_SKILL/scripts/preflight-check.py"
python3 "$TEACHANY_SKILL/scripts/find_nodes.py" "一次函数"
python3 "$TEACHANY_SKILL/scripts/find-hero.py" <course-id>
python3 "$TEACHANY_SKILL/scripts/gen-hero-svg.py" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/tts-engine.py" --text "讲解文本" --voice zh-CN-XiaoxiaoNeural --output "$COURSE_DIR/tts/s01.mp3"
python3 "$TEACHANY_SKILL/scripts/apply-standard-modules.py" --only "$COURSE_DIR/index.html"
python3 "$TEACHANY_SKILL/scripts/find-map.py" 唐
python3 "$TEACHANY_SKILL/scripts/apply-historical-maps.py"
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/rebuild-index.py"
```

如果脚本不存在，先在仓库根 `scripts/` 与 `skill/scripts/` 中搜索；不要引用不存在的脚本名。

## 交付标准

- 快速模式：HTML 可打开，核心互动可用，移动端不崩，说明未启用的增强项。
- 完整模式：通过 `validate-courseware.cjs`、关键资源存在、控制台无错误、Registry/Gallery 可访问。
- 维护模式：给出复现证据、修复证据、同类扫描证据、远端同步证据。

## 版本说明

当前执行摘要版本：`7.12.1`。历史变更不放入主文件，避免污染执行上下文；需要考古时查 Git 历史或仓库发布记录。
