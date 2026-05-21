# TeachAny Page Structure（精简版）

## 标准页面顺序

1. `<head>` meta（现行标准）：`teachany-node`（node_id）、`teachany-id`（course-id）、`teachany-subject`、`teachany-grade`、`teachany-version`。旧版 `course-*` 命名已废弃，新课件不要使用。
2. 顶部品牌栏：TeachAny + Gallery 链接 + course version + skill version。
3. Hero 区：标题、对象、学习目标。
4. Hero 知识结构图：独立 `<figure>`，不是背景图。
5. 问题锚点：2–3 个预设场景 + 自定义问题。
6. 前测/诊断。
7. 2–5 个主体学习 section：每段包含解释、互动、反馈。
8. 总结迁移题。
9. AI 学伴入口卡片。
10. 知识图谱 section。
11. 标准脚本：AI tutor、TTS narrator、section hints、knowledge graph。

## Section 模板

```html
<section class="ta-section" id="module-1" data-tsh="想一想：这里的关键变化是什么？">
  <h2>模块标题</h2>
  <p data-tts>一段清晰解释。</p>
  <div class="interactive-card">真实互动组件</div>
  <div class="check-card">即时练习与反馈</div>
</section>
```

## 必要交互要求

- 操作前有任务；操作后有反馈。
- 图像、公式、文字至少两种表征联动。
- 学生能撤回、重试或看到状态变化。
- 不依赖 hover 才能完成核心任务。

## 移动端要求

- viewport 使用 `viewport-fit=cover`。
- 主要按钮和拖拽目标 ≥44px。
- 网格在窄屏变单列。
- 音频条、AI FAB、底部导航互不遮挡。

## 标准模块挂载

使用模板默认配置。不要复制粘贴旧课件里的内联模块实现。

---

## v2 分页模板结构（`course-skeleton-v2.html`）

> **新课件默认使用 v2 模板**。旧课件保持 v1 不动。

### 硬性要求

- **最少 12 页**（slide-page ≥ 12），Baseline B-1 会检测
- **必须包含习题讲解**（worked example / 解题过程展示），Baseline B-6 会检测
- 标准页面结构必须覆盖 ≥8/10 项检查点

### 布局标准化规范

**核心原则：每页视觉宽度必须一致，不允许出现"有宽有窄"。**

| 参数 | 值 | 说明 |
|:---|:---|:---|
| `--page-padding` | `24px` | 页面两侧内边距 |
| `.slide-inner max-width` | `880px` | 内容最大宽度 |
| `.card padding` | `24px` | 主卡片内边距 |
| `.card .card padding` | `18px` | 嵌套子卡片（无额外 box-shadow） |

**Grid 列数控制（严禁使用 `auto-fit`）：**

| 类名 | 列数 | 用途 |
|:---|:---|:---|
| `.grid` | 1 列（默认） | 选项列表、步骤列表 |
| `.grid.grid-2` | 2 列 | 并排对比（条件/实例、两类反应） |
| `.grid.grid-3` | 3 列 | 三类并列内容 |
| `.grid-2col` | 2 列 | 表单类双列布局 |

**禁止事项：**
- ❌ 不允许使用 `grid-template-columns: repeat(auto-fit, minmax(...))` — 列数不可预测
- ❌ 不允许在 `.card` 内嵌套另一个 `.card`（应改用 `.reaction-card` 或 `.inner-card`）
- ❌ 不允许给 `<figure>` 添加内联 `max-width` / `style` 属性
- ❌ 不允许给 `<select>` / `<button>` 添加内联样式（使用全局 CSS）

**标准化 CSS 类清单：**
- `.inner-card` — 辅助提示卡片（无 box-shadow，有 border）
- `.reaction-card` — 带左边框彩条的内容卡片
- `.summary-item` — 总结条目（flex 横排 + 编号）
- `.step-grid` — 步骤流（单列 grid，gap 8px）
- `.flex-row` — 操作按钮行（flex wrap）
- `.kg-chip` — 知识图谱节点药丸

### 推荐页面编排（12-18 页）

| 序号 | 页面 | data-page-type | 说明 |
|:---:|:---|:---|:---|
| 0 | 封面 | cover | Hero 图 + 驱动问题 |
| 1 | 引入/问题锚点 | interactive | 生活场景/好奇心触发 |
| 2 | 学习目标 | objectives | 3-5 个可检验目标 |
| 3 | 前测 | quiz | 诊断已有认知 |
| 4-6 | 核心概念（2-3页） | concept | ABT 结构讲解 |
| 7 | 习题讲解 | concept | 完整解题过程+思路分析 |
| 8 | 工具/参考 | concept | 公式卡、速查表 |
| 9 | 互动探究 | interactive | Canvas/预测器/拖拽 |
| 10 | 概念测试 | quiz | ConcepTest 即时反馈 |
| 11 | 后测 | quiz | 综合检验 |
| 12 | 总结 | summary | 要点回顾 |
| 13 | 知识图谱 | summary | 前后衔接可视化 |
| 14 | AI 导师 | summary | 自由提问入口 |

### 核心架构

v2 在 v1 基础上增加**分页容器 + 双模式浏览**：

```html
<div class="slide-container" id="slide-container">
  <section class="slide-page" data-page-type="cover" data-page-index="0">
    <div class="slide-inner">...</div>
  </section>
  <section class="slide-page" data-page-type="concept" data-page-index="1">
    <div class="slide-inner">...</div>
  </section>
  <!-- 每个教学模块一页，至少 12 页 -->
</div>
```

### 双模式浏览

1. **浏览模式**（默认）：连续滚动，scroll-snap proximity 吸附
2. **播放模式**：锁定当前页，通过控制器翻页，自动播放音频

切换方式：右下角 FAB 按钮 / 键盘 `F` 键

### 页面类型（data-page-type）

| 类型 | 用途 | 视觉特征 |
|:---|:---|:---|
| `cover` | 封面/标题页 | 多色渐变背景，标题渐变色 |
| `objectives` | 学习目标 | 绿色/蓝色柔和渐变 |
| `concept` | 概念讲解/习题讲解 | 蓝紫微光渐变 |
| `interactive` | 互动/Canvas/探究 | 绿色/蓝色活力渐变 |
| `quiz` | 前测/后测/ConcepTest | 琥珀/紫色渐变 |
| `summary` | 小结/知识图谱 | 蓝色中心渐变 |

### 控制器组件

- **顶部进度条**：固定在顶部，显示当前进度百分比
- **底部工具栏**：上一页/进度/页码/下一页/自动播放/全屏
- **侧边导航**（胶囊段式）：右侧垂直排列，毛玻璃容器，hover 显示页面标题，顶部显示当前页码
- **FAB 按钮**：切换浏览/播放模式

### 侧边导航设计规范

侧边导航采用**胶囊段式进度条**设计（非圆点），适配 12+ 页内容：
- 容器：毛玻璃背景（`backdrop-filter: blur(12px)`），圆角 12px
- 每个导航项：28×4px 的细条，active 时加宽到 36px 并高亮
- 顶部显示页码计数器（如 `3/14`）
- hover 时左侧弹出 tooltip 显示页面名称
- 最大高度 70vh，内容超长时可滚动

### 习题讲解页规范

习题讲解（worked example）页必须包含：
1. **题目展示**：完整题目文本，清晰标注已知条件
2. **解题思路**：分步骤展示解题过程，每步有文字说明
3. **关键技巧**：用加粗/高亮标注易错点和解题关键
4. **答案验证**：给出最终答案并验证正确性
5. **变式提示**（可选）：指出同类型题的变化方向

标记方式：`data-tsh` 中包含"习题讲解"或"解题"或"解析"关键词。

### 音频-页面同步

每个 `slide-page` 通过 `data-tts` 属性关联音频段：
- 浏览模式：手动点击播放
- 播放模式+自动播放：进入页面自动播放，播完自动翻页

### 键盘快捷键

| 按键 | 功能 |
|:---|:---|
| `→` / `↓` / `Space` | 下一页 |
| `←` / `↑` | 上一页 |
| `F` | 切换播放模式 |
| `Escape` | 退出播放模式 |

### 必要 meta 标签（v2 新增）

```html
<meta name="teachany-template-version" content="2.0">
```

### 内容填充

使用 `content-section-templates-v2.html` 中的片段，每个片段已包含 `slide-page` 容器。

### 响应式规则

- 窄屏（≤768px）：padding 缩小，网格变单列，侧边导航缩窄
- 极窄屏（≤480px）：标题缩小，进度条缩短，导航条更紧凑
