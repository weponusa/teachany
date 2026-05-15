# PLAN.md —— 古希腊与古罗马文明 策划文档

> 完整课件位于 teachany-opensource/community/hist-m-greece-rome/。

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：hist-m-greece-rome
- **node_id**：hist-m-greece-rome
- **学段/学科**：初中历史（九年级上册）
- **ABT 叙事**：古希腊和古罗马都位于地中海沿岸；但两者文明形态截然不同；因此通过对比探究两种文明各自的特点及其对西方世界的影响。
- **Bloom 层级覆盖**：L1=2题 L2=3题 L3=2题 L4=2题 L5=1题（≥3级✓）
- **ConcepTest 锚点**：雅典民主与现代民主的区别；《十二铜表法》的历史意义
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：前测探知 → 希腊文明 → 罗马文明 → 对比分析 → 地图探究 → 历史影响 → 后测

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 希腊罗马整体结构 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | 前测 | 先备知识检验 | 选择题互动 | inline#pretest | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M3 | 古希腊内容 | 城邦/民主/哲学/奥运 | 信息卡片+时间轴 | inline | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M4 | 古罗马内容 | 共和制/十二铜表法/帝国 | 信息卡片+时间轴 | inline | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M5 | 对比分析 | 希腊vs罗马异同 | 对比表格 | inline | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M6 | 交互地图 | 地中海扩张 | Canvas 互动地图 | inline#greece-map | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> |
| M7 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="hist-m-greece-rome" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M8 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M8
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts/manifest.json 已就位，音频待录制（has_tts: false 已申报）
- [x] **Remotion 视频**：Canvas 互动地图替代视频（4种时期切换），已在 M6 申报
- [x] **知识图谱**：`data-teachany-kg="hist-m-greece-rome"` 已列入 M7

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / assets / tts | #35 #57 #59 #60 #64 #69 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `node scripts/validate-courseware.cjs <dir>`
- commit + push origin main

## 6. 版本与签字

- PLAN.md 版本：v1.0
- 产出时间：2026-05-15
- 主 agent：Claude-Sonnet-4.6
- 准入 Gate：Phase 1.5
