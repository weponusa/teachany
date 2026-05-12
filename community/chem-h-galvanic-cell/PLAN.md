# PLAN.md —— 原电池：化学能如何变成电能 策划文档

> 本文件是补齐索引仓库 hook 的策划合同。完整课件位于 teachany-courseware/community/chem-h-galvanic-cell/。

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：chem-h-galvanic-cell
- **node_id**：chem-h-galvanic-cell
- **学段/学科**：高中化学
- **ABT 叙事**：已知氧化还原会电子转移；但直接接触不能稳定做功；因此用两个半电池让电子走外电路。
- **Bloom 层级覆盖**：L1=1题 L2=2题 L3=2题 L4=1题 L5=1题 L6=0题（≥3级）
- **ConcepTest 锚点**：盐桥作用概念后
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：全支架(1处) → 半支架(1处) → 无支架(1处)

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 原电池整体结构 | Hero 图 | 复用courseware:assets/chem-h-galvanic-cell-hero.png | python3 PIL 绘制 | test -f courseware/assets/chem-h-galvanic-cell-hero.png |
| M2 | 电子流向视频 | 电子走导线 | Remotion 视频 | 复用courseware:assets/video/electron-flow.mp4 | ffmpeg 合成教学视频 | ffprobe -show_streams courseware/assets/video/electron-flow.mp4 |
| M3 | 浓度-电势互动 | Nernst 定性关系 | Canvas 互动 | inline#cellCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> --phase2 |
| M4 | Edge TTS 旁白 | 语音导学 | Edge TTS 音频 | 复用courseware:tts/*.mp3 | python3 scripts/tts-engine.py | ls -lh courseware/tts/*.mp3 |
| M5 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |
| M6 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="chem-h-galvanic-cell" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M7 | 线上资源引用 | 外部模拟对照 | path.html 卡 | 自动线上链接 | HTML 外链卡片 | grep -q online-resources index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M5
- [x] **Hero 图**：≥1 张 PNG 放 `assets/chem-h-galvanic-cell-hero.png` 已列入 M1
- [x] **TTS 音频**：≥1 个 MP3 放 `tts/*.mp3` 已列入 M4
- [x] **Remotion 视频**：≥1 个 MP4 放 `assets/video/*.mp4` 已列入 M2
- [x] **知识图谱**：`data-teachany-kg="chem-h-galvanic-cell"` 已列入 M6

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / assets / tts | #45 #57 #59 #60 #64 #69 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `node scripts/validate-courseware.cjs <dir> --phase2`
- `bash scripts/check_baseline.sh <dir>`
- commit + push origin main

## 6. 版本与签字

- PLAN.md 版本：v1.0
- 产出时间：2026-05-13 07:55
- 主 agent：GPT-5.5
- 准入 Gate：Phase 1.5
