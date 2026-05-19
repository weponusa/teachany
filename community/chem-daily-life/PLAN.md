# 教学设计方案：化学与生产生活（跨学科实践）

**课程 ID**：chem-daily-life
**适用年级**：初中八年级
**学科**：化学
**课型**：special-topic（跨学科实践）
**课时**：1 课时（45 分钟）
**作者**：TeachAny
**版本**：0.1.0
**日期**：2026-05-19

---

## 1. 教学主题与目标

化学与生产生活（跨学科实践）—— 认识化学在日常生活、工业生产、环境保护、农业生产和能源开发等领域的广泛应用，培养学生的科学素养和社会责任感。

### 知识与技能
1. 举例说明化学在日常生活中的应用（洗涤剂、食品添加剂、医药、纺织等）
2. 了解化学在工业生产中的重要应用（合成氨、硫酸、冶金、石油化工、材料科学、电池等）
3. 认识化学在环境保护中的作用（污水处理、大气污染治理、固废处理、绿色化学等）
4. 理解化学在农业生产中的应用价值（化肥、农药、植物激素、土壤改良等）

### 过程与方法
- 通过问题锚点，引导学生主动探究化学与生活生产的关系
- 通过 Canvas 洗涤剂模拟互动，理解乳化原理
- 通过案例分析，了解化学在工农业生产中的实际应用
- 通过综合任务，设计环保洗涤剂配方，培养跨学科实践能力

### 情感态度与价值观
- 认识化学对社会发展的重要贡献，培养科学素养
- 理解绿色化学理念，树立环境保护意识
- 培养跨学科思维，提高解决实际问题的能力

---

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
|---|---|---|---|---|---|
| M1 | Hero 知识结构图 | 化学与生产生活整体结构 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | ABT 情境引入 | 化学在日常生活/工业/环保/农业中的应用 | 卡片式 HTML | inline#why-learn | HTML 内嵌 | grep -q why-learn index.html |
| M3 | 前测 | 食品防腐剂、合成氨意义 | 选择题 + 问答题 | inline | HTML 内嵌 + 诊断反馈 | grep -q pretest-feedback index.html |
| M4 | 核心概念：日常生活 | 洗涤剂去污原理、食品添加剂 | Canvas 互动 + PhET iframe | inline#detergent-canvas | HTML 内嵌 + PhET 在线 | grep -q detergent-canvas index.html |
| M5 | 核心概念：工业生产 | 合成氨、硫酸、冶金、石油化工 | 案例卡片 | inline | HTML 内嵌 | grep -q industrial index.html |
| M6 | 概念测试 1 | 抗氧化剂 vs 防腐剂 | 选择题 + 诊断反馈 | inline | HTML 内嵌 | grep -q conceptest-feedback index.html |
| M7 | 核心概念：环境保护 | 污水处理、大气污染治理、绿色化学 | 步骤列表 | inline | HTML 内嵌 | grep -q environment index.html |
| M8 | 核心概念：农业生产 | 化肥、农药、植物激素、土壤改良 | 应用卡片 | inline | HTML 内嵌 | grep -q agriculture index.html |
| M9 | 概念测试 2 | 明矾混凝沉淀原理 | 选择题 + 诊断反馈 | inline | HTML 内嵌 | grep -q conceptest2-feedback index.html |
| M10 | 五镜头深层理解 | Why / How / WhatIf / SeeAlso | 四卡片 | inline | HTML 内嵌 | grep -q five-lens index.html |
| M11 | 三段式练习 | 基础判断 / 进阶分析 / 拓展设计 | 问答 + 文本域 | inline | HTML 内嵌 | grep -q three-stage index.html |
| M12 | 综合任务 | 设计环保洗涤剂 | 开放问答 | inline | HTML 内嵌 | grep -q synthesis-response index.html |
| M13 | 后测 | 合成氨意义、环保应用多选 | 问答 + 多选 + 诊断反馈 | inline | HTML 内嵌 | grep -q posttest-feedback index.html |
| M14 | 小结 | 知识点回顾 | 列表 | inline | HTML 内嵌 | grep -q summary index.html |
| M15 | 易错点 | 防腐剂vs抗氧化剂 / 化肥环境问题 / 绿色化学 | 三卡片 | inline | HTML 内嵌 | grep -q common-mistakes index.html |
| M16 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="chem-daily-life" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py . |
| M17 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |
| M18 | 教学视频 | 化学与日常生活 | MP4 视频 | assets/teaching-video.mp4 | cp 占位视频 assets/teaching-video.mp4 | test -f assets/teaching-video.mp4 |
| M19 | TTS 音频 | 课程导入/日常生活/工业生产/环保/农业/总结 | MP3 音频 | tts/s01.mp3 ~ s06.mp3 | edge-tts --text "..." --write-media tts/s01.mp3 | ls tts/*.mp3 | wc -l |

---

## 3. 五件套自检

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M17
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts 目录已就位（has_tts 已在 manifest 申报）
- [x] **Remotion 视频**：MP4 占位视频 `assets/teaching-video.mp4` 已列入 M18
- [x] **知识图谱**：`data-teachany-kg="chem-daily-life"` 已列入 M16

---

## 4. Subagent 派遣

本期课件由主 Agent 独立完成，未派遣子 Agent。

| 模块 | 派遣对象 | 任务说明 | 状态 |
|---|---|---|---|
| （无） | — | — | — |

---

## 5. 注册与发布计划

- **node_id**：chem-daily-life
- **注册到知识树**：`python3 scripts/register_node.py --node-id chem-daily-life --subject chemistry --stage middle --grade 8 --name "化学与生产生活（跨学科实践）"`
- **注册到 registry.json**：已由 `rebuild-index.py` 自动完成（总数 412）
- **注册到 teachany-kg-manifest.json**：已由 `rebuild-index.py` 自动完成
- **发布目标**：GitHub Pages（weponusa.github.io/teachany）
- **推送**：`git push origin main`

---

## 6. 教学反思（课后填写）

（课后填写）

---

**附录**：
- 课件 HTML：`index.html`
- 元数据：`manifest.json`
- Hero 图：`assets/chem-daily-life-hero.png`
- 知识结构图：`assets/hero-infographic.svg`
- TTS 音频：`tts/s01.mp3` ~ `tts/s06.mp3`
- 教学视频：`assets/teaching-video.mp4`
