# PLAN.md · sci-e-3d-printing-blender

## 1. 课件设计摘要

- 课件ID：sci-e-3d-printing-blender
- 主题：3D建模入门：用 Blender 做 3D 打印模型
- 学段：小学 G5，STEM / 信息科技拓展
- 课型：新授课 + 活动驱动
- 主线：认识 3D 元素 → 认识 Blender → 操作 G/R/S → 搭建模型 → 检查 3D 打印规则。

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
|:---|:---|:---|:---|:---|:---|:---|
| M1 | Hero 知识结构主图 | 3D 建模学习路径 | Hero 图 | assets/sci-e-3d-printing-blender-hero.png | image_gen 生成知识结构图 | python3 scripts/check-hero.py community/sci-e-3d-printing-blender |
| M2 | 3D 基本概念 | 顶点、边、面、网格 | Canvas 互动 | index.html #cubeCanvas | 手写 canvas 标注交互 | grep -n "cubeCanvas" index.html |
| M3 | Blender 界面 | 视口、工具栏、属性面板 | SVG 插图 | assets/illustration-child-blender.png | image_gen 生成情境图 | test -f assets/illustration-child-blender.png |
| M4 | 基本操作技能 | G/R/S 与 XYZ 方向 | Canvas 互动 | index.html #transformCanvas | 手写 canvas 变换模拟 | grep -n "transformCanvas" index.html |
| M5 | 搭积木建模 | 从基本体到模型 | Remotion 视频 | assets/video/blender-modeling-demo.mp4 | npx remotion render | ffprobe -v error assets/video/blender-modeling-demo.mp4 |
| M6 | 3D 打印规则 | 封闭、壁厚、支撑、STL | SVG 插图 | assets/illustration-3d-printing.png | image_gen 生成情境图 | test -f assets/illustration-3d-printing.png |
| M7 | 综合任务 | 设计自己的 3D 草图 | Canvas 互动 | index.html #designCanvas | 手写 canvas 画板交互 | grep -n "designCanvas" index.html |
| M8 | TTS 语音讲解 | 多段音频导学 | Edge TTS 音频 | tts/*.mp3 | python3 scripts/tts-engine.py | ls -la tts/*.mp3 |
| M9 | AI 学伴入口 | 个性化提问 | 标准模块 | data-teachany-tutor-card | 复用 scripts/teachany-tutor-card.js | grep -n "data-teachany-tutor-card" index.html |
| M10 | 知识图谱 | 前后知识衔接 | 标准公共模块 | data-teachany-kg="sci-e-3d-printing-blender" | 复用 teachany-knowledge-graph.js | python3 scripts/check-knowledge-graph.py community/sci-e-3d-printing-blender |

## 3. 五件套自检清单

- [x] AI 学伴：已挂载 `ai-tutor.js` 与 `data-teachany-tutor-card`。
- [x] Hero 图：已提供 `assets/sci-e-3d-printing-blender-hero.png`。
- [x] TTS 音频：已提供 `tts/*.mp3` 多段讲解。
- [x] Remotion 视频：已提供 `assets/video/blender-modeling-demo.mp4`。
- [x] 知识图谱：已使用 `data-teachany-kg="sci-e-3d-printing-blender"` 标准模块。

## 4. Subagent 派遣记录

本课件已按 TeachAny 五件套规范落地。若后续派遣子智能体修改，prompt 必须包含 TeachAny `<HARD_RULES>` 块，并要求先读取本 PLAN.md 第 2 节媒体策划表。

## 5. 交付前校验命令

```bash
python3 scripts/validate-courseware.py sci-e-3d-printing-blender
python3 scripts/check-plan.py community/sci-e-3d-printing-blender
python3 scripts/check-knowledge-graph.py community/sci-e-3d-printing-blender
node scripts/validate-courseware.cjs community/sci-e-3d-printing-blender
```

## 6. 发布说明

该课件为 `free_mode=true` 的 STEM 拓展课件，应显示在“其他知识”入口，同时通过 Gallery 社区索引展示。实体课件位于 `community/sci-e-3d-printing-blender/`，线上地址由 `community/index.json.download_url` 指向 `https://weponusa.github.io/teachany-courseware/community/sci-e-3d-printing-blender/`。
