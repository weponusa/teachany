# 3D 打印工作流程与 G-code 基础 · TeachAny 课件制作计划

## 1. 课件定位

- 课件 ID：`ext-b849401`
- 知识点 ID：`ext-b849401`
- 课型：项目式学习 / 跨学科 STEM / 信息科技拓展
- 学段：初中 G7
- 主线：问题线——“为什么文本指令能让 3D 打印机制造物体？”

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
|:---|:---|:---|:---|:---|:---|:---|
| M1 | Hero 知识结构 | 流程总览 | Hero 图 | assets/ext-b849401-hero.svg | write_to_file 生成独立 SVG 文件 | python3 scripts/check-hero.py community/ext-b849401 |
| M2 | 流程讲解 | 建模到打印 | Edge TTS 音频 | assets/tts/intro.mp3 | python3 scripts/tts-engine.py --text ... --output assets/tts/intro.mp3 | python3 scripts/validate-courseware.py ext-b849401 |
| M3 | 过程动画 | G-code 到喷嘴运动 | Remotion 视频 | assets/video/gcode-workflow.mp4 | python3 生成帧 + ffmpeg 合成音频轨 | ffprobe -v error -show_entries stream=codec_type assets/video/gcode-workflow.mp4 |
| M4 | G-code 基础 | G/M/X/Y/Z/E/F | SVG 插图 | assets/illustrations/gcode-motion-map.png | image_gen 生成教学信息图 | test -f community/ext-b849401/assets/illustrations/gcode-motion-map.png |
| M5 | 参数模拟器 | 温度速度层高挤出 | Canvas 互动 | index.html | 原生 canvas + input range 联动 | node --check scripts/validate-courseware.cjs |
| M6 | 连续音频 | 三段语音导学 | 标准模块 | scripts/teachany-audio-player.js | data-teachany-audio-playlist 声明 | node scripts/validate-courseware.cjs community/ext-b849401 |
| M7 | 知识图谱 | ext-b849401 | 标准公共模块 | data-teachany-kg="ext-b849401" | ../../scripts/teachany-knowledge-graph.js | python3 scripts/check-knowledge-graph.py community/ext-b849401 |

## 3. 五件套自检清单

- [x] AI 学伴：`ai-tutor.js` + `data-teachany-tutor-card`
- [x] TTS 朗读：`teachany-tts-narrator.js` + 3 段 Edge TTS mp3
- [x] 情境提示：`teachany-section-hints.js` + section `data-tsh`
- [x] 知识图谱：标准 `data-teachany-kg="ext-b849401"` 挂载
- [x] 连续音频：`teachany-audio-player.js` + playlist

## 4. Subagent 派遣

本次由主 agent 直接执行，未派遣子智能体；所有媒体资产、HTML、manifest、PLAN 与校验均由主 agent 完成。

## 5. 质量验证计划

1. `python3 scripts/validate-courseware.py ext-b849401`
2. `node scripts/validate-courseware.cjs community/ext-b849401`
3. `python3 scripts/check-plan.py community/ext-b849401`
4. `python3 scripts/check-knowledge-graph.py community/ext-b849401`
5. `ffprobe -v error -show_entries stream=codec_type community/ext-b849401/assets/video/gcode-workflow.mp4`

## 6. 发布计划

1. `python3 scripts/rebuild-index.py`
2. 同步到 `teachany-opensource/community/ext-b849401/`
3. 两个仓库分别提交到当前 Git 用户身份
4. `git push origin main`
5. 尝试 `git push gitee main`
