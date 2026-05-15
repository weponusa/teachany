# PLAN.md —— 等高线与地形图 策划文档

> 完整课件位于 teachany-courseware/community/geo-m-contour-topographic/。

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：geo-m-contour-topographic
- **node_id**：geo-m-topographic-map
- **学段/学科**：初中地理（七年级）
- **ABT 叙事**：地图上有许多弯曲的线；但仅凭线条无法判断地形高低；因此学习等高线的含义、规律和地形判读方法。
- **Bloom 层级覆盖**：L1=1题 L2=2题 L3=2题 L4=1题 L5=1题 L6=0题（≥3级）
- **ConcepTest 锚点**：山脊与山谷的等高线弯曲方向判断
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：等高线原理 → 坡度判读 → 地形判读 → 剖面图绘制

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 等高线整体结构 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | 等高线生成动画 | 等高线原理 | Canvas 互动 | inline#sliceCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> |
| M3 | 坡度计算器 | 等高线疏密与坡度 | Canvas 互动 | inline#slopeCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> |
| M4 | 地形判读练习 | 五种地形识别 | Canvas 互动 | inline#terrainCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> |
| M5 | 地形剖面生成器 | 剖面图绘制 | Canvas 互动 | inline#profileCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> |
| M6 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="geo-m-topographic-map" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M7 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M7
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts/manifest.json 已就位，音频待录制（has_tts: false 已申报，媒体策划表 M4 豁免）
- [x] **Remotion 视频**：Canvas 互动动画 ×4（切面/坡度/地形/剖面）替代视频，已在 M2-M5 申报
- [x] **知识图谱**：`data-teachany-kg="geo-m-topographic-map"` 已列入 M6

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
