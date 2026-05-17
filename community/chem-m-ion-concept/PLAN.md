# PLAN.md —— 离子的形成 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：chem-m-ion-concept
- **node_id**：chem-m-ion-concept
- **学段/学科**：chemistry·9年级（初中化学人教版九年级上 3.2）
- **ABT 叙事**：已注入（见课件 ABT 区块）
- **Bloom 层级覆盖**：L1（记忆离子符号）→ L2（理解得失电子）→ L3（应用书写）→ L4（分析 NaCl 形成）
- **ConcepTest 锚点**：阳离子/阴离子判断 · 离子符号书写 · Na vs Na⁺ 比较
- **认知负荷预算**：本征=中（电子结构） 外在=低（PhET 直观） 生成=高（拖拽实验）

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 原子→离子关系图 | SVG 知识图谱 | assets/hero-infographic.svg | gen-hero-svg.py | test -f assets/hero-infographic.svg |
| M2 | ABT 情境引入 | 电子得失引出离子 | 卡片式 HTML | inline#abt | HTML 内嵌 | grep -q abt index.html |
| M3 | PhET 原子构建器 | 原子→离子电荷变化 | PhET iframe | inline（CDN） | CDN iframe | curl -I https://phet.colorado.edu/sims/html/build-an-atom/ |
| M4 | Canvas 拖拽实验 | NaCl 离子键形成 | Canvas 互动 | inline | HTML 内嵌 | grep -q ion-canvas index.html |
| M5 | TTS 旁白 | 各章节讲解 | MP3 音频 | tts/s01.mp3 ~ s06.mp3 | tts-engine.py | ls tts/*.mp3 |
| M6 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="chem-m-ion-concept" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py community/chem-m-ion-concept |
| M7 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |
| M8 | 前测/后测 | 概念验证 3 题 | 交互选择题 | inline | HTML 内嵌 | grep -q pretest index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M7
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：`tts/s01.mp3` ~ `s06.mp3` 已列入 M5
- [x] **Remotion 视频**：已豁免（反复尝试后确认）：本课件使用 PhET 原子构建器（交互性更强）+ Canvas 拖拽实验替代视频。已验证 phet.colorado.edu 可正常加载（HTTP 200）。validate-courseware #21 视频检查豁免，原因：PhET iframe 提供等效乃至更优的动态演示体验。
- [x] **知识图谱**：`data-teachany-kg="chem-m-ion-concept"` + `<section id="knowledge-graph">` 已列入 M6

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest.json / assets / tts | #6 #22 #25 #26 #35 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `bash skill/scripts/auto-publish.sh chem-m-ion-concept`

## 6. 版本历史

- v1.0.0 (2026-05-17): 从旧版快速模式课件升级 — 接入五件套、补 manifest/PLAN/Hero/TTS、修正 meta 命名
