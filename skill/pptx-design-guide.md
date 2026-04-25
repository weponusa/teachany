# TeachAny · 图文 PPTX 设计规范（v5.34.12）

> 本文档配合 `scripts/export-pptx.py` 使用，说明"怎样让从 HTML 导出的 PPTX
> 不像办公模板、不像 AI 粗糙产物，而像真人设计的教学讲义"。
>
> ⚠️ 图片来源承诺：本项目**只使用**宿主 IDE（WorkBuddy / CodeBuddy）
> 原生提供的 `image_gen` 工具生成课件插图，**不调用**任何第三方生图
> API（Gemini / OpenAI / Replicate 等）。PPTX 是 HTML 的派生件，
> 不单独生图——它使用的图全部来自 `assets/` 下已由 `image_gen` 生成的素材。

---

## 一、版式家族（6 种标准版式）

`export-pptx.py` v5.34.12 支持 6 种版式，自动根据 section 内容选择：

| 版式 | 何时使用 | 视觉特征 |
|:---|:---|:---|
| **封面页 `title`** | 每份 PPTX 首页 | 左 45% 文字 + 右 55% hero 图；品牌色装饰条；底部徽章 |
| **节首图卡 `section_hero`** | 进入新模块（`kicker` 从"前测"变"模块一"等）时自动插入 | 超大字号模块标题 + 大配图；左侧装饰条；底部进度条 |
| **内容页 `content`（有图）** | section 有 bullet + 有配图 | 左文 60% + 右图 40%；图带浅色卡片底 + 圆角 |
| **内容页 `content`（双栏）** | bullet ≥ 4 条但无图 | 双栏 bullet，每栏 3-4 条，数字徽章 |
| **内容页 `content`（高亮）** | bullet ≤ 3 条且无图 | 大字号（22pt），大引号装饰，避免空白 |
| **题目卡片页 `quiz_cards`** | section 有识别到的练习题 | 题目各自独立卡片，题号徽章 + 琥珀色点缀 |
| **互动占位页 `placeholder`** | section 只有 Canvas/知识图谱/视频但无实质文字 | 全屏卡片 + 大 emoji 图标 + "回 HTML 体验"按钮 |
| **结尾页 `end`** | 最后一页 | 品牌主色全屏 + 装饰圆 + "谢谢观看" |

---

## 二、设计 Token（调色盘 + 字体）

### 2.1 颜色（浅色主题）

| Token | HEX | 用途 |
|:---|:---|:---|
| `bg` | `#FFFFFF` | 整体画布底色 |
| `bg_soft` | `#F8FAFC` | 卡片背景 / 弱容器 |
| `primary` | `#6366F1` | 主要装饰、标题下划线、数字徽章 |
| `primary_dk` | `#4F46E5` | 主色变体 |
| `primary_lt` | `#E0E7FF` | 浅色背景块、图片外框 |
| `accent` | `#F59E0B` | 强调色（kicker 标签、进度条、题号） |
| `accent_lt` | `#FEF3C7` | 题号徽章底 |
| `success` | `#10B981` | 正确答案勾标 |
| `text_1` | `#0F172A` | 正文标题 |
| `text_2` | `#334155` | 正文 |
| `text_3` | `#64748B` | 辅助文字（页码 / 注释） |
| `border` | `#E2E8F0` | 卡片边框 |

**禁用**：纯黑 `#000000`（太沉重）；纯红 `#FF0000`（扎眼）；亮绿 `#00FF00`（刺眼）；渐变色（python-pptx 不原生支持，近似实现 90% 场景都糟糕）。

### 2.2 字体

| 用途 | 中文 | 英文/数字 | 字号 |
|:---|:---|:---|:---|
| 封面大标题 | Microsoft YaHei (Bold) | Inter (Bold) | 40pt |
| 节首模块标题 | Microsoft YaHei (Bold) | Inter (Bold) | 44pt |
| 内容页标题 | Microsoft YaHei (Bold) | Inter (Bold) | 28pt |
| Bullet 文本 | Microsoft YaHei | Inter | 15pt |
| 小 Kicker 标签 | Microsoft YaHei (Bold) | Inter (Bold) | 13pt |
| 页码 / 脚注 | Microsoft YaHei | Inter | 11pt |

**中英混排双字体**：每个 run 必须同时设置 `latin`（英文字体）和 `eastAsia`（中文字体）。`add_text` 工具函数已通过 XML 写入 `<a:ea>` / `<a:latin>` 标签实现，请不要直接用 `python-pptx` 原生 API 写纯英文字体（会导致中文字符回退到 Cambria 等宋体，失去审美统一）。

---

## 三、核心排版原则（必须遵守）

### 3.1 图片使用

- **每份 PPTX 至少有 3 张图**：封面 1 张 hero + 至少 2 张内容图
- **封面 hero 图**：优先选 `assets/hero-*.png`，fallback 到 `assets/` 下第一张
- **节首图卡**：每新模块（"模块一/二/三/四"）自动启用一张独立配图；图和内容页复用时会跳过重复
- **内容页图**：每 section 最多取 2 张图，避免"一张图被反复使用"
- **图都没有时**：自动用"双栏 bullet"或"高亮卡片"版式，**绝不留空白右区**

### 3.2 留白与间距

- 画布四边至少留 `Inches(0.5)` 内边距
- 卡片内部至少留 `Inches(0.3)` 内边距
- bullet 行高 `1.35` 倍，段后 `4pt`
- 标题与内容之间至少 `Inches(0.4)` 间隔（用装饰短线而非空行）

### 3.3 层级

每张 slide 最多**一级主标题** + **一层次要标签**（kicker）。不要在同一张 slide 出现多个同级大标题——否则"信息扁平"失去焦点。

### 3.4 装饰元素使用节制

- 允许：圆点徽章、数字徽章、装饰短线（0.5 Inches 左右）、左侧彩色细条
- 禁止：整个顶部大色块（> 1 英寸高）、背景网格、阴影、水印重复

---

## 四、对 AI 的强制约束

### 4.1 图像来源（绝对铁律）

**只用 `image_gen`**——宿主 IDE（WorkBuddy / CodeBuddy）原生提供的工具。
绝不：

- ❌ 在 `scripts/export-pptx.py` 里调用 `requests.post('https://api.openai.com/...')`
- ❌ 读取任何 `.env` 里的 `GEMINI_API_KEY` / `OPENAI_API_KEY` 生图
- ❌ 调用 nano-banana / Replicate / Tripo / Hunyuan 等用户私人接口
- ❌ 把你记忆里的"用户 API key"写进脚本或 .env

**正确做法**：AI 在 HTML 生成阶段（Phase 3）就调用 `image_gen` 工具把图存进 `assets/`，PPTX 导出脚本只消费已有素材。

### 4.2 PPTX 生成前的图片检查

导出 PPTX 前，AI 必须：

1. 数一下 HTML 中 `<img src="./assets/">` 的引用数
2. 若 < `max(3, slide_count * 0.3)` → 先调 `image_gen` 补图、改 HTML
3. 再跑 `python3 scripts/export-pptx.py`
4. 跑 `python3 scripts/validate-courseware.py` 验 PPTX 图片密度

### 4.3 不做的事

- ❌ 不用 Matplotlib 生成示意图（审美差）
- ❌ 不用 emoji 堆成"图"代替 image
- ❌ 不在 PPTX 里硬塞"互动占位符"做视觉噪音（应用正式的互动占位页）
- ❌ 不对 PPTX 单独再做一次 HTML 样式调整（PPTX 是派生件）

---

## 五、快速质检清单（AI 导出后自查）

- [ ] PPTX 文件大小 ≥ 200KB（硬规则 #47 的 100KB 基础上再提高）
- [ ] slide 数量在 8-25 之间（少于 8 = 内容过少；多于 25 = 需要分卷）
- [ ] 至少 3 张图（其中 1 张是封面 hero）
- [ ] 图/slide 比 ≥ 30%（硬规则 #47）
- [ ] 封面和结尾页必须存在
- [ ] 每个"模块一/二/三/四" kicker 至少有一个节首图卡
- [ ] 无任何 slide 出现空白大块（右 40% 没有内容）
- [ ] 题目卡片页的题目 ≤ 3 题/张（多了分页）

---

## 六、未来增量方向

- **数据卡片版式**：大数字 + 单位 + 趋势箭头（用于数据类课件，如经济/地理）
- **引言卡片版式**：黑底白字大字号名人名言（用于文史课件）
- **SVG 装饰**：把 HTML 里的 SVG 小图标（如 `<svg class="icon">`）按原样复刻到 PPTX
- **深色主题**：`THEME_DARK` 字典待补，用于夜间讲课场景

---

## 版本信息

- 技能版本：v5.34.12
- 依赖脚本：`scripts/export-pptx.py`
- 配合硬规则：#34（生图）+ #46（PPTX 触发）+ #47（PPTX 含图）+ #50（preflight）
- 创建日期：2026-04-20
