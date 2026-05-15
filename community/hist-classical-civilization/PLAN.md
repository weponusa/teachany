# PLAN.md —— 古代亚非文明 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：hist-classical-civilization
- **node_id**：hist-classical-civilization
- **学段/学科**：history·9年级（初中历史九年级上册）
- **ABT 叙事**：已注入（见课件 #why-learn 区块）
- **Bloom 层级覆盖**：L1-L4 多层覆盖
- **ConcepTest 锚点**：四大文明古国+大河文明特征
- **认知负荷预算**：本征=中 外在=低 生成=高

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 古代亚非文明整体结构 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | ABT 情境引入 | 已知/问题/新知 | 卡片式 HTML | inline#why-learn | HTML 内嵌 | grep -q why-learn index.html |
| M3 | 核心内容模块 | 四大文明古国+大河文明特征 | 信息卡+互动 | inline | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M4 | 互动仿真 | 无 | Canvas 动画 | inline（无外部仿真） | N/A | curl -I https://www.geogebra.org/apps/deployggb.js |
| M5 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="hist-classical-civilization" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M6 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M6
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts 目录已就位（has_tts 已在 manifest 申报）
- [x] **Remotion 视频**：Canvas 动画替代视频，已在 M4 申报
- [x] **知识图谱**：`data-teachany-kg="hist-classical-civilization"` 已列入 M5

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / assets / tts | #35 #57 #59 #60 #64 #69 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `node scripts/validate-courseware.cjs <dir>`
- commit + push origin main

## 6. 版本与签字

- PLAN.md 版本：v1.0（升级版）
- 产出时间：2026-05-15
- 主 agent：Claude-Sonnet-4.6
- 准入 Gate：Phase 1.5
