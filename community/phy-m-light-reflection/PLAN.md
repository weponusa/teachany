# PLAN.md —— 光的反射 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：phy-m-light-reflection
- **node_id**：phy-m-light-reflection
- **学段/学科**：初中物理（八年级上册）
- **ABT 叙事**：每天照镜子能看到自己；但镜中像为什么左右互换？为什么有的反光刺眼有的不刺眼；因此学习反射定律、两种反射和平面镜成像规律。
- **Bloom 层级覆盖**：L1=2题 L2=2题 L3=2题 L4=2题 L5=1题（≥3级✓）
- **ConcepTest 锚点**：入射角≠与镜面夹角；平面镜成虚像不可接收
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：ABT引入 → 前测 → 反射定律 → 拖动实验 → 两种反射 → 平面镜成像 → 应用/深层 → 后测

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 反射定律+两种反射+平面镜 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | 反射实验 Canvas | 拖动改变入射角，验证反射角=入射角 | Canvas 互动 | inline#reflect-canvas | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M3 | 漫反射示意 Canvas | 镜面反射 vs 漫反射对比 | Canvas 静态示意 | inline#diffuse-canvas | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M4 | 平面镜成像 Canvas | 点击改变物体位置，验证等距等大 | Canvas 互动 | inline#mirror-canvas | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M5 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="phy-m-light-reflection" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M6 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M6
- [x] **Hero 图**：SVG 反射定律知识图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts/manifest.json 已就位（has_tts: false 已申报）
- [x] **Remotion 视频**：Canvas 互动实验（反射角实时显示+平面镜成像模拟）替代视频，已在 M2/M4 申报
- [x] **知识图谱**：`data-teachany-kg="phy-m-light-reflection"` 已列入 M5

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
