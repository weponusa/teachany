# PLAN.md —— 工业革命：机器、工厂与世界市场的形成 策划文档

> 完整课件位于 teachany-courseware/community/hist-h-industrial-rev-h/。

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：hist-h-industrial-rev-h
- **node_id**：hist-h-industrial-rev-h
- **学段/学科**：高中历史
- **ABT 叙事**：手工工场有限；但机器和蒸汽动力突破限制；因此工厂制度与世界市场被重组。
- **Bloom 层级覆盖**：L1=1题 L2=2题 L3=2题 L4=1题 L5=1题 L6=0题（≥3级）
- **ConcepTest 锚点**：工业革命是否只是技术进步
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：英国条件 → 扩散地图 → 工厂扩散模型 → 影响评价

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 工业革命整体结构 | Hero 图 | 复用courseware:assets/hist-h-industrial-rev-h-hero.png | python3 PIL 绘制 | test -f courseware/assets/hist-h-industrial-rev-h-hero.png |
| M2 | 工业扩散视频 | 工业化扩散 | Remotion 视频 | 复用courseware:assets/video/industrial-diffusion.mp4 | ffmpeg 合成教学视频 | ffprobe -show_streams courseware/assets/video/industrial-diffusion.mp4 |
| M3 | 工厂扩散互动 | 工业化条件 | Canvas 互动 | inline#industryCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> --phase2 |
| M4 | Edge TTS 旁白 | 语音导学 | Edge TTS 音频 | 复用courseware:tts/*.mp3 | python3 scripts/tts-engine.py | ls -lh courseware/tts/*.mp3 |
| M5 | 标准地图 | 工业革命扩散 | GeoJSON 地图 | 复用courseware:assets/maps/ce-1815.geojson | 复用标准模块 | bash scripts/check_baseline.sh <dir> |
| M6 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="hist-h-industrial-rev-h" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M7 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M7
- [x] **Hero 图**：≥1 张 PNG 放 `assets/hist-h-industrial-rev-h-hero.png` 已列入 M1
- [x] **TTS 音频**：≥1 个 MP3 放 `tts/*.mp3` 已列入 M4
- [x] **Remotion 视频**：≥1 个 MP4 放 `assets/video/*.mp4` 已列入 M2
- [x] **知识图谱**：`data-teachany-kg="hist-h-industrial-rev-h"` 已列入 M6

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / assets / tts / map | #35 #57 #59 #60 #64 #69 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `node scripts/validate-courseware.cjs <dir> --phase2`
- `bash scripts/check_baseline.sh <dir>`
- commit + push origin main

## 6. 版本与签字

- PLAN.md 版本：v1.0
- 产出时间：2026-05-13 11:38
- 主 agent：GPT-5.5
- 准入 Gate：Phase 1.5
