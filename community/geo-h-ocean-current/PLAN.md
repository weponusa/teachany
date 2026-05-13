# PLAN.md —— 洋流：海水如何重塑气候与渔场 策划文档

> 完整课件位于 teachany-courseware/community/geo-h-ocean-current/。

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：geo-h-ocean-current
- **node_id**：geo-h-ocean-current
- **学段/学科**：高中地理
- **ABT 叙事**：同纬度海岸气候有差异；但只看纬度解释不了；因此学习洋流的方向、寒暖性质和影响。
- **Bloom 层级覆盖**：L1=1题 L2=2题 L3=2题 L4=1题 L5=1题 L6=0题（≥3级）
- **ConcepTest 锚点**：秘鲁渔场形成原因
- **认知负荷预算**：本征=中 外在=低 生成=高
- **支架路径**：读图流程 → Canvas 模型 → 迁移案例

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 洋流整体结构 | Hero 图 | 复用courseware:assets/geo-h-ocean-current-hero.png | python3 PIL 绘制 | test -f courseware/assets/geo-h-ocean-current-hero.png |
| M2 | 洋流热量输送视频 | 暖流寒流 | Remotion 视频 | 复用courseware:assets/video/current-flow.mp4 | ffmpeg 合成教学视频 | ffprobe -show_streams courseware/assets/video/current-flow.mp4 |
| M3 | 洋流互动模型 | 风带与环流 | Canvas 互动 | inline#currentCanvas | HTML 内嵌 Canvas | node scripts/validate-courseware.cjs <dir> --phase2 |
| M4 | Edge TTS 旁白 | 语音导学 | Edge TTS 音频 | 复用courseware:tts/*.mp3 | python3 scripts/tts-engine.py | ls -lh courseware/tts/*.mp3 |
| M5 | 标准地图 | 世界洋流空间背景 | GeoJSON 地图 | 复用courseware:assets/maps/world-2000.geojson | 复用标准模块 | bash scripts/check_baseline.sh <dir> |
| M6 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="geo-h-ocean-current" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M7 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M7
- [x] **Hero 图**：≥1 张 PNG 放 `assets/geo-h-ocean-current-hero.png` 已列入 M1
- [x] **TTS 音频**：≥1 个 MP3 放 `tts/*.mp3` 已列入 M4
- [x] **Remotion 视频**：≥1 个 MP4 放 `assets/video/*.mp4` 已列入 M2
- [x] **知识图谱**：`data-teachany-kg="geo-h-ocean-current"` 已列入 M6

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
- 产出时间：2026-05-13 10:30
- 主 agent：GPT-5.5
- 准入 Gate：Phase 1.5
