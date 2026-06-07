# 学段视觉模式（小初高三分法 · 强制）

> **触发时机**：Phase 2 写 HTML/CSS **之前**必读。与 `design-system.md` 配色章节一致，本文件规定**选用哪套模式**及**禁止项**。

## 一、先判学段，再选模式

从 `manifest.json` / `<meta name="teachany-stage">` / 课程 ID 前缀判断：

| 学段 | `teachany-stage` | 年级 meta | 课程 ID 常见前缀 |
| --- | --- | --- | --- |
| 小学 | `elementary` | 1–6 | `*-e-*`, `sci-e-*`, `math-elem-*` |
| 初中 | `middle` | 7–9 | `*-m-*`, `sci-m-*` |
| 高中 | `high` | 10–12 | `*-h-*`, `math-high-*` |

**禁止**：把初中/高中深色学术壳（`#07111f` / `#0f172a`）套到小学课；把小学糖果闯关风套到高中课。

## 二、三套模式对照

| 维度 | 小学 `elementary` | 初中 `middle` | 高中 `high` |
| --- | --- | --- | --- |
| **body class** | `teachany-elementary` | `teachany-middle` | `teachany-high` |
| **背景** | 暖白 `#fffbf0` | 浅灰白 `#f8fafc` | 深蓝 `#0f172a` 或 `#07111f` |
| **主色** | 珊瑚红 `#ff6b6b` + 薄荷绿 `#4ecdc4` | 天蓝 `#3b82f6` + 青绿 `#06b6d4` | 淡蓝 `#60a5fa` + 淡紫 `#a78bfa` |
| **圆角** | 20px，大阴影 | 14px，轻阴影 | 12px，毛玻璃卡片 |
| **标题气质** | emoji + 闯关/关卡/星星 | 清晰模块标签 + 适度活泼 | 克制、学术、少 emoji |
| **练习结构** | 第一关/第二关/BOSS、知做感 | Level 1/2/3 或 Scaffold 三级 | 推导步骤、证据链、公式框 |
| **反馈语气** | 「太棒了！」「没关系，再试一次！」 | 「正确！」「再想想。」 | 简洁诊断，少感叹 |
| **分页壳** | 可用 v2 `teachany-slide-v2`，**但必须覆盖小学 CSS 变量** | v2 默认浅色即可 | v2 深色默认 |

## 三、实现检查清单（Agent 自检）

1. `<body class="teachany-{stage}">` 与 meta `teachany-stage` 一致。
2. `:root` 配色来自上表，**不得**全文复制 `chn-m-*` 深色 `:root` 到 `chn-e-*`。
3. Hero：小学可用渐变标题条 + 本地 Hero 大图（`find-hero` CDN + `assets/*-hero.png` 双路径）。
4. 至少 3 张真实配图（Hero + 2 张 section 内示意图），见基线 B-3a。
5. TTS：`teachany-tts-narrator.js` **不得**带 `data-tts-disabled="true"`；`tts/*.mp3` ≥ 3 且每个 ≥ 5KB。
6. **悬浮坞**：必须加载 `teachany-floating-dock.css`（在五件套 CSS 之后）。**禁止**课件内再写 `position:fixed; right; bottom` 的学伴/气泡（与标准 AI 学伴、TTS、播放模式 FAB、学习反馈浮钮抢位）。

## 四、代码片段（小学 body 开头）

```html
<meta name="teachany-stage" content="elementary">
<body class="teachany-elementary">
<style>
:root {
  --bg: #fffbf0; --primary: #ff6b6b; --secondary: #4ecdc4;
  --accent: #ffe66d; --card: #ffffff; --text: #333;
}
</style>
```

初中将 `teachany-middle` 与 `#f8fafc` / `#3b82f6`；高中将 `teachany-high` 与深色变量。细节配色见 `design-system.md` §10.3。
