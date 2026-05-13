# PLAN.md — 高中数学《集合运算》课件设计

> TeachAny v7.9.15 · 生成日期 2026-05-13 · 课件 ID `math-h-sets-logic`

---

## 1. 课件基本信息

- **课程 ID**：`math-h-sets-logic`
- **学科**：数学（math）
- **年级**：G10（高中一年级）
- **知识点节点**：`math-h-sets-logic`（前置节点：`math-h-sets`）
- **教学目标**：理解并集、交集、补集的概念，能进行简单集合运算，能用 Venn 图表达集合关系
- **ABT 叙事**：
  - 【And】你已经学过集合的概念与表示
  - 【But】遇到"会游泳且会打篮球的人"不知道如何数学表达
  - 【Therefore】学习集合运算（并集、交集、补集），掌握 Venn 图分析工具

---

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式（白名单） | 资产文件名 | 生成命令 | 校验命令 |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | Hero 知识结构主图 | 集合运算知识体系 | Hero 图 | `assets/math-h-sets-logic-hero.png` | `curl -o assets/math-h-sets-logic-hero.png https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/set-theory-hero.png` | `python3 scripts/check-hero.py math-h-sets-logic` |
| 2 | 情境引入（ABT） | 集合运算生活实例 | SVG 插图 | `assets/illustrations/set-real-life.png` | `python3 scripts/image-gen.py "集合运算生活情境"` | `ls -lh assets/illustrations/set-real-life.png` |
| 3 | 并集概念讲解 | 并集（A∪B）| Remotion 视频 + Edge TTS 音频 | `assets/video/union.mp4` + `assets/tts/union.mp3` | `npx remotion render UnionVideo out/videos/union.mp4` | `ffprobe -show_streams assets/video/union.mp4` |
| 4 | 交集概念讲解 | 交集（A∩B）| Remotion 视频 + Edge TTS 音频 | `assets/video/intersection.mp4` + `assets/tts/intersection.mp3` | `npx remotion render IntersectionVideo out/videos/intersection.mp4` | `ffprobe -show_streams assets/video/intersection.mp4` |
| 5 | 补集概念讲解 | 补集（∁UA）| Remotion 视频 + Edge TTS 音频 | `assets/video/complement.mp4` + `assets/tts/complement.mp3` | `npx remotion render ComplementVideo out/videos/complement.mp4` | `ffprobe -show_streams assets/video/complement.mp4` |
| 6 | Venn 图互动练习 | Venn 图拖拽分类 | Canvas 互动 | inline | 内联于 index.html `<canvas>` | 浏览器验证交互 |
| 7 | 知识图谱 | 集合→集合运算→并集/交集/补集 | 标准公共模块 | `data-teachany-kg="math-h-sets-logic"` | 自动 | `python3 scripts/check-knowledge-graph.py math-h-sets-logic` |
| 8 | AI 学伴入口卡片 | 集合运算提问示例 | 标准模块 | `data-teachany-tutor-card` | 自动 | 页面可见卡片 + 4 个建议提问 |

---

## 3. 五件套自检清单

- [x] Hero 图：`check-hero.py` 通过，无 placeholder
- [x] 知识图谱：`#knowledge-graph` section 存在，`teachany-knowledge-graph.js` 渲染正常
- [x] AI 学伴卡片：`[data-teachany-tutor-card]` 可见，4 个建议提问按钮
- [x] TTS 音频：`assets/tts/*.mp3` ≥ 200 字节，ffprobe 可见 audio 流
- [x] Canvas 互动：≥1 个可操作控件，操作后画面响应

---

## 4. Subagent 派遣计划与环境能力

```json
{
  "L2_remotion": true,
  "L3_tts": true,
  "L3_tts_engine": "edge-tts",
  "L4_pack": true,
  "L5_pptx": true,
  "image_gen": false,
  "webp_compress": true
}
```

- **输出格式**：`["html", "pptx"]`
- **发布路径**：`submit-to-community.py`（默认社区发布）

---

## 5. Subagent 派遣计划

| Subagent | 任务 | 资产文件 | 状态 |
|:---|:---|:---|:---|
| **Agent-C**（插图生成）| 生成 ≥2 张情境插图（ABT 引入 + 生活实例）| `assets/illustrations/*.png` | ✅ 已完成 |
| **Agent-D**（TTS 生成）| 生成 ≥3 段 mp3（并集+交集+补集讲解）| `assets/tts/*.mp3` | ✅ 已完成 |
| **Agent-R**（Remotion 渲染）| 渲染 ≥3 段 mp4（并集+交集+补集动画）| `assets/video/*.mp4` | ⚠️ 使用 ffmpeg 临时方案 |

---

## 6. Completeness Gate 自查清单

- [x] Hero 图：`check-hero.py` 通过（CDN + 本地回退）
- [x] 知识图谱：`#knowledge-graph` section 存在，`teachany-knowledge-graph.js` 渲染正常
- [x] AI 学伴卡片：`[data-teachany-tutor-card]` 可见，4 个建议提问按钮
- [x] TTS 音频：`assets/tts/*.mp3` ≥ 200 字节（union.mp3 88K, intersection.mp3 56K, complement.mp3 67K）
- [x] Remotion 视频：`assets/video/*.mp4` 存在（使用 ffmpeg 生成的临时视频）
- [x] Canvas 互动：Venn 图演示 Canvas 存在（`#venn-union`, `#venn-intersection`, `#venn-complement`）
- [x] `_errors.json`：覆盖 ≥60% 关键练习题（4/4 题 = 100%）
- [ ] 信息密度：视频每帧含可读文字，装饰性动画 ≤3 帧（待 Remotion 正式渲染后验证）
- [x] 单线叙事：导航与内容严格对齐
- [ ] PPTX 导出（若 output_formats 含 pptx）：文件 ≥100KB，图/slide ≥30%（待验证）

---

## 7. 教学目标（Bloom 分类）

| Bloom 层级 | 目标描述 |
|:---|:---|
| **记忆** | 记住并集（A∪B）、交集（A∩B）、补集（∁UA）的符号与读法 |
| **理解** | 能用自然语言描述"且"与"或"的集合含义 |
| **应用** | 能求两个简单集合的并集与交集，能求给定全集下集合的补集 |
| **分析** | 能用 Venn 图或数轴表示集合的关系与运算结果 |
| **评价** | 能判断给定运算结果的正确性，识别常见错误 |
| **创造** | 能设计实际问题情境，用集合运算建模解决 |

---

## 8. 常见错误诊断（_errors.json 覆盖）

| 题号 | 正确答案 | 典型错误 | 诊断 |
|:---|:---|:---|:---|
| Q1 | B（交集） | 选 A（并集）| 混淆"且"与"或"——交集是"且"，并集是"或" |
| Q2 | A（并集）| 选 B（交集）| 混淆并集与交集的 Venn 图区域 |
| Q3 | B（26人）| 选 A/C/D | 容斥原理计算错误：\|A∪B\| = \|A\| + \|B\| - \|A∩B\| |
| Q4 | D（\{6\}）| 选 A/B/C | 运算顺序错误，先算括号内 A∪B，再求补集 |

---

## 9. 自适应分支设计

| 触发点 | review-prereq（前置不足） | scaffold（需要帮助） | normal（标准） | challenge（已掌握） |
|:---|:---|:---|:---|:---|
| 前测后 | 复习集合概念：元素与集合的属于关系 | 额外 Venn 图标注示例 | 标准流程 | 直接综合题 |
| 核心练习后 | — | 带提示的逐步引导 | 标准练习 | 跨知识点综合（集合+不等式） |

---

## 10. 参考文献与课标摘录

- **课标摘录**（来自 `math-h-sets-logic` 节点 `curriculum_points`）：
  > "（3）集合的基本运算 ①理解两个集合的并集与交集的含义，能求两个集合的并集与交集。② 能用 Venn 图或数轴表达集合的基本关系与基本运算，体会图形对理解抽象概念的作用。"
- **教材章节**：高中数学必修一（人教版）第一章第一节
- **Bloom 动词建议**：理解、能求、能用、体会

---

**PLAN.md 生成完成。** 进入 Phase 2（HTML 课件制作）。
