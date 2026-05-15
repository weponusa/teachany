# PLAN.md —— 原子的结构 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：chem-m-atom-structure
- **node_id**：chem-m-atom-structure
- **学段/学科**：初中化学（九年级上册）
- **ABT 叙事**：已知原子是化学变化最小粒子；但原子内部结构未知，无法解释元素性质差异；因此学习原子核（质子+中子）和核外电子排布规律。
- **Bloom 层级覆盖**：L1=3题 L2=2题 L3=2题 L4=2题（≥3级✓）
- **ConcepTest 锚点**：质子数=核外电子数等量关系；最外层电子数决定化学性质
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：ABT引入 → 模型发展史 → 原子核 → 核外电子 → 动画模拟 → 同位素 → 后测

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 原子结构整体 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | 原子模拟动画 | 质子/中子/电子层 | Canvas 动画（requestAnimationFrame） | inline#atom-canvas | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M3 | 元素切换器 | 7种元素对比 | Canvas 互动按钮 | inline#atom-canvas | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M4 | 同位素卡片 | 氢的三种同位素 | 点击互动卡片 | inline#isotope | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M5 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="chem-m-atom-structure" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M6 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M6
- [x] **Hero 图**：SVG 原子结构知识图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts/manifest.json 已就位（has_tts: false 已申报）
- [x] **Remotion 视频**：Canvas 动画原子模拟（requestAnimationFrame）替代视频，已在 M2 申报
- [x] **知识图谱**：`data-teachany-kg="chem-m-atom-structure"` 已列入 M5

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
