# 十、技术实现

> 本文件是 SKILL_CN.md 的「十、技术实现」章节的详细内容，按需加载以节省上下文。
> 触发条件：需要**写课件 HTML/CSS/JS**代码时。

---


### 10.1 推荐技术组合

| 产物 | 推荐技术 | 适用场景 |
|:---|:---|:---|
| **互动网页课件（默认）** | HTML / CSS / JS / Canvas | 大多数课件主形态（默认输出） |
| **程序化教学动画** | Remotion + React + TypeScript | 需要过程演示、动态变换、讲解视频时 |
| **混合模式** | 网页主课件 + 嵌入 Remotion 视频 | 最推荐，兼顾互动与演示 |
| **PPTX 课件**（v5.34 新增，可选） | python-pptx（优先）/ Marp（备选） | 用户需要投影仪/多媒体教室/无网络环境讲课时，要求 `.pptx` 格式 |

**格式策略（v5.34 起）**：TeachAny 默认输出 HTML 互动课件；当用户在任务中明确要求 "PPT/PPTX/幻灯片/课件 ppt 版/打印讲义" 时，**在 L1 HTML 完成后**额外生成一份 `.pptx` 格式的静态讲义版（同步课件的教学骨架、关键插图与核心讲解文案，但不保留互动练习的答题逻辑）。两种格式**可以并存**于同一课件目录下，PPTX 视为 HTML 的"离线/线下讲解"派生件，而不是替代品。详见 Section 12 L5 与 Phase 3.7。

### 10.2 互动网页标准结构

```text
Hero 区（课题名称 + 学科/年级/课型标签）
导航区（锚点跳转）
学习目标
前测
知识模块 × N
  - ABT 引入
  - 核心讲解
  - 深层理解（五镜头）
  - 立刻练习
  - 反馈纠错
综合任务（带脚手架分级）
后测
拓展资源
```

#### 10.2.1 HTML 骨架模板（强制使用）

> ⚠️ **铁律**：所有课件**必须**使用以下 HTML 骨架模板作为起点。禁止自行发明页面结构。骨架中标注 `<!-- 必选 -->` 的 section 不可删除；标注 `<!-- 可选 -->` 的 section 可按需省略。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>【课题名称】- TeachAny 互动课件</title>
  <!-- TeachAny 元信息（用于打包和知识地图关联；不要添加 teachany-emoji，emoji 只写入 manifest.json） -->
  <meta name="teachany-node" content="【节点ID】">
  <meta name="teachany-subject" content="【学科ID】">
  <meta name="teachany-domain" content="【领域ID】">
  <meta name="teachany-grade" content="【年级数字】">
  <meta name="teachany-prerequisites" content="【前置节点ID】">
  <meta name="teachany-difficulty" content="【1-5】">
  <meta name="teachany-version" content="2.0">
  <meta name="teachany-author" content="teachany">
  <!-- v6.10 新增：教材章节（从 find_nodes.py 输出或 data/node-chapter-map.json 获取） -->
  <meta name="teachany-chapter" content="【如「第11章 一次函数」或「必修一 第3章」，未录入时用 web_fetch ChinaTextbook 查】">
  <meta name="teachany-semester" content="【上 或 下】">
  <!-- ⭐ v6.11 强制：AI 学伴样式（公共资源，打包时随 .teachany 分发） -->
  <link rel="stylesheet" href="./ai-tutor.css">
  <style>
    /* ═══ 1. 学段模板 CSS 变量（从 10.3 选取对应学段） ═══ */
    :root { /* ... 见 10.3 ... */ }

    /* ═══ 2. 全局布局 ═══ */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text, #1e293b); }

    /* ═══ 3. Sticky 导航栏 ═══ */
    .nav-bar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px; background: var(--card, #fff);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow-x: auto; white-space: nowrap;
    }
    .nav-bar .brand { font-weight: 700; margin-right: 12px; }
    .nav-bar a {
      text-decoration: none; padding: 6px 14px; border-radius: 20px;
      font-size: 14px; color: var(--text, #334155); transition: all 0.2s;
    }
    .nav-bar a:hover, .nav-bar a.active { background: var(--primary); color: #fff; }

    /* ═══ 4. Section 通用样式 ═══ */
    .section { max-width: 900px; margin: 40px auto; padding: 0 24px; }
    .section-title {
      font-size: 1.6rem; font-weight: 700; margin-bottom: 20px;
      padding-left: 16px; border-left: 4px solid var(--primary);
    }

    /* ═══ 5. Hero 区 ═══ */
    .hero {
      text-align: center; padding: 60px 24px 40px;
      background: linear-gradient(135deg, var(--primary), var(--secondary, var(--primary)));
      color: #fff; border-radius: 0 0 24px 24px;
    }
    .hero h1 { font-size: 2.2rem; margin-bottom: 12px; }
    .hero .tags { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .hero .tag {
      background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 13px;
    }

    /* ═══ 6. 卡片 ═══ */
    .card {
      background: var(--card, #fff); border-radius: 14px; padding: 24px;
      margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    /* ═══ 7. 练习区 ═══ */
    .quiz-option {
      display: block; width: 100%; text-align: left; padding: 14px 18px;
      margin: 8px 0; border: 2px solid #e2e8f0; border-radius: 10px;
      background: var(--card, #fff); cursor: pointer; font-size: 15px; transition: all 0.2s;
    }
    .quiz-option:hover { border-color: var(--primary); transform: translateX(3px); }
    .quiz-option.correct { border-color: #22c55e; background: #f0fdf4; }
    .quiz-option.wrong { border-color: #ef4444; background: #fef2f2; }
    .feedback { padding: 16px; border-radius: 10px; margin-top: 12px; display: none; }
    .feedback.show { display: block; }

    /* ═══ 8. 前后翻页按钮 ═══ */
    .page-nav {
      display: flex; justify-content: space-between; align-items: center;
      max-width: 900px; margin: 30px auto; padding: 0 24px;
    }
    .page-nav button {
      padding: 10px 24px; border-radius: 10px; border: 2px solid var(--primary);
      background: transparent; color: var(--primary); font-size: 15px; cursor: pointer;
      transition: all 0.2s;
    }
    .page-nav button:hover { background: var(--primary); color: #fff; }
    .page-nav .current { font-size: 14px; color: #64748b; }

    /* ═══ 9. 进度条 ═══ */
    .progress-bar {
      position: fixed; top: 0; left: 0; height: 3px; z-index: 200;
      background: var(--primary); transition: width 0.3s;
    }

    /* ═══ 10. 响应式 ═══ */
    @media (max-width: 600px) {
      .hero h1 { font-size: 1.5rem; }
      .section { padding: 0 16px; margin: 24px auto; }
      .nav-bar { padding: 10px 12px; }
    }

    /* ═══ 11. 视频播放器 ═══ */
    .video-player {
      margin: 20px 0; border-radius: 12px; overflow: hidden;
      background: #000; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .video-player video { width: 100%; display: block; border-radius: 12px; }
    .video-caption {
      text-align: center; font-size: 14px; color: var(--text-secondary, #64748b);
      padding: 8px 0; margin: 0;
    }

    /* ═══ 12. 音频播放器（底部悬浮控制条 + 滚动自动播放） ═══ */
    .audio-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: var(--card, #fff); border-top: 1px solid #e2e8f0;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
      display: none; align-items: center; gap: 10px;
      padding: 10px 18px; height: 56px;
    }
    .audio-bar.active { display: flex; }
    .audio-bar .audio-track-title {
      font-size: 13px; font-weight: 600; min-width: 80px; max-width: 200px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .audio-bar .audio-ctrl-btn {
      background: none; border: none; font-size: 18px; cursor: pointer;
      color: var(--text, #334155); padding: 4px; flex-shrink: 0;
    }
    .audio-bar .progress-track {
      flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px;
      position: relative; cursor: pointer; min-width: 60px;
    }
    .audio-bar .progress-fill {
      height: 100%; background: var(--primary); border-radius: 2px;
      transition: width 0.1s;
    }
    .audio-bar .time-display { font-size: 12px; min-width: 40px; text-align: center; }
    .audio-bar .speed-btn {
      background: var(--primary); color: #fff; border: none; border-radius: 12px;
      font-size: 12px; padding: 2px 8px; cursor: pointer; font-weight: 600;
    }
    .audio-bar .audio-subtitle {
      font-size: 12px; color: var(--text-secondary, #64748b);
      max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    @media (max-width: 600px) {
      .audio-bar { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 6px; }
      .audio-bar .audio-subtitle { max-width: 100%; order: 10; width: 100%; }
    }
    /* 底部控制条占位：防止内容被遮挡 */
    body.audio-playing { padding-bottom: 64px; }

    /* ═══ 13. 知识图谱（三列布局） ═══ */
    #kg-svg .kg-node { cursor: default; transition: filter .2s; }
    #kg-svg .kg-node.has-cw { cursor: pointer; }
    #kg-svg .kg-node.has-cw:hover rect { filter: brightness(1.15); }
    #kg-svg .kg-node.no-cw rect { stroke-dasharray: 6 3; }
    #kg-svg .kg-edge { fill: none; stroke-width: 1.5; opacity: 0.55; }
    #kg-svg .kg-chain { fill: none; stroke-width: 1.2; opacity: 0.5; }
    @media (max-width: 600px) {
      .audio-bar { flex-wrap: wrap; height: auto; }
    }
  </style>
</head>
<body>
  <!-- 进度条 -->
  <div class="progress-bar" id="progressBar" style="width: 0%"></div>

  <!-- Sticky 导航栏 -->
  <nav class="nav-bar" id="navbar">
    <span class="brand">🎓 TeachAny</span>
    <a href="#hero">首页</a>
    <a href="#objectives">目标</a>
    <a href="#pretest">前测</a>
    <!-- 知识模块导航项（按实际模块数动态添加） -->
    <a href="#module-1">模块1</a>
    <a href="#module-2">模块2</a>
    <a href="#module-3">模块3</a>
    <a href="#synthesis">综合</a>
    <a href="#posttest">后测</a>
    <a href="#summary">小结</a>
    <a href="#knowledge-graph">图谱</a>
  </nav>

  <!-- ═══ Hero 区 ═══ 必选 -->
  <section class="hero" id="hero">
    <h1>【课题名称】</h1>
    <div class="tags">
      <span class="tag">【学科】</span>
      <span class="tag">【年级】</span>
      <span class="tag">【课型标签】</span>
      <span class="tag">【驱动模式标签】</span>
    </div>
  </section>

  <!-- ═══ 学习目标 ═══ 必选 -->
  <section class="section" id="objectives">
    <h2 class="section-title">🎯 学习目标</h2>
    <!-- 3-5 条可观察、可检测的目标，用 Bloom 动词 -->
  </section>

  <!-- ═══ 前测 ═══ 必选 -->
  <section class="section" id="pretest">
    <h2 class="section-title">📋 前置知识检测</h2>
    <!-- 至少 2 道前测题，检验 prerequisites -->
  </section>

  <!-- ═══ 知识模块 × N ═══ 必选（至少 3 个模块） -->
  <section class="section" id="module-1">
    <h2 class="section-title">📖 模块 1：【子问题/子活动/阶段名称】</h2>
    <!-- 6 块结构：ABT引入 → 核心讲解 → 深层理解 → 立刻练习 → 纠错反馈 → 小结迁移 -->
  </section>

  <!-- 前后翻页（每个模块之间） -->
  <div class="page-nav">
    <button onclick="scrollToSection('pretest')">← 前测</button>
    <span class="current">模块 1 / N</span>
    <button onclick="scrollToSection('module-2')">模块 2 →</button>
  </div>

  <section class="section" id="module-2">
    <h2 class="section-title">📖 模块 2：【子问题/子活动/阶段名称】</h2>
  </section>

  <section class="section" id="module-3">
    <h2 class="section-title">📖 模块 3：【子问题/子活动/阶段名称】</h2>
  </section>
  <!-- 更多模块按需添加... -->

  <!-- ═══ 综合任务 ═══ 必选 -->
  <section class="section" id="synthesis">
    <h2 class="section-title">🏆 综合任务</h2>
    <!-- 三段式作业：⭐基础 + ⭐⭐拓展 + ⭐⭐⭐挑战 -->
  </section>

  <!-- ═══ 后测 ═══ 必选 -->
  <section class="section" id="posttest">
    <h2 class="section-title">📝 后测</h2>
    <!-- 与前测呼应，检验学习效果 -->
  </section>

  <!-- ═══ 小结 + 拓展 ═══ 必选 -->
  <section class="section" id="summary">
    <h2 class="section-title">📌 课堂小结</h2>
    <!-- 核心知识回顾 + 思维导图/要点清单 -->
  </section>

  <!-- ═══ 拓展资源 ═══ 可选 -->
  <section class="section" id="extension">
    <h2 class="section-title">🚀 拓展资源</h2>
  </section>

  <!-- ═══ 知识图谱 ═══ 必选 -->
  <section class="section" id="knowledge-graph">
    <h2 class="section-title">🗺️ 知识图谱</h2>
    <p style="color:var(--text-secondary,#64748b);margin-bottom:16px;">三列视图：前序知识 → 核心子知识点 → 后续知识。实线节点可点击跳转，虚线表示暂无课件。</p>
    <div id="kg-container" style="width:100%;min-height:500px;border:1px solid var(--border,#e2e8f0);border-radius:12px;overflow:hidden;position:relative;">
      <svg id="kg-svg" width="100%" height="100%" style="min-height:500px;"></svg>
    </div>
  </section>

  <!-- ═══ AI 多模态互动区 ═══ 文科默认插入，见 10.4 -->

  <script>
    // ⭐ v6.11 强制：AI 学伴配置（必须在 ai-tutor.js 加载前定义）
    window.__TEACHANY_TUTOR_CONFIG__ = {
      courseTitle: '【课件标题】',
      subject: '【学科ID】',         // chn/math/eng/phy/chem/bio/hist/geo/it
      grade: 【年级数字】,            // 1-12
      learningObjectives: [
        '【目标1】',
        '【目标2】',
        '【目标3】'
      ],
      // 读取当前可见 section 文本作为上下文（供 AI 答复时聚焦）
      getContext: () => {
        // 优先使用 IntersectionObserver 命中的 section
        const current = document.querySelector('section.current-section');
        if (current) return current.innerText.slice(0, 3000);
        // 次选：URL hash 对应的 section
        if (location.hash) {
          const hashed = document.querySelector(location.hash);
          if (hashed) return hashed.innerText.slice(0, 3000);
        }
        // 回退：body 前 3000 字
        return document.body.innerText.slice(0, 3000);
      }
    };

    // ═══ 导航高亮 + 滚动进度 ═══
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-bar a');
    const progressBar = document.getElementById('progressBar');

    window.addEventListener('scroll', () => {
      // 进度条
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (scrollTop / docHeight * 100) + '%';

      // 导航高亮
      let current = '';
      sections.forEach(sec => {
        if (sec.offsetTop - 120 <= scrollTop) current = sec.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    });

    // ═══ 锚点平滑滚动 ═══
    function scrollToSection(id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.getAttribute('href').slice(1);
        scrollToSection(id);
      });
    });

    // ═══ 知识图谱渲染（三列布局：前序 | 核心子知识点链 | 后续） ═══
    // knowledgeGraphData 格式见 10.2.3 节
    (function renderKnowledgeGraph() {
      if (typeof knowledgeGraphData === 'undefined') return;
      const svg = document.getElementById('kg-svg');
      if (!svg) return;
      const d = knowledgeGraphData;
      const NS = 'http://www.w3.org/2000/svg';
      const el = (tag) => document.createElementNS(NS, tag);

      // —— 颜色配置 ——
      const C = {
        pre: '#06b6d4', core: '#f59e0b', sub: '#3b82f6', next: '#10b981',
        preBg: 'rgba(6,182,212,0.12)', coreBg: 'rgba(245,158,11,0.18)',
        subBg: 'rgba(59,130,246,0.12)', nextBg: 'rgba(16,185,129,0.12)',
        noCw: '#94a3b8', noCwBg: 'rgba(148,163,184,0.08)'
      };

      // —— 布局参数 ——
      const preNodes = d.prerequisites || [];
      const subNodes = d.coreSubTopics || [];
      const nextNodes = d.nextTopics || [];
      const maxRows = Math.max(preNodes.length, subNodes.length + 1, nextNodes.length);
      const ROW_H = 70, PAD_TOP = 60, NODE_H = 44, NODE_RX = 10;
      const W = 1100, H = Math.max(500, PAD_TOP + maxRows * ROW_H + 40);
      // 三列 X 中心
      const COL = { pre: 120, core: 550, next: 970 };
      const NW = { pre: 190, core: 270, next: 220 }; // 节点宽度

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = ''; // 清空

      // —— defs：箭头 + 发光 ——
      const defs = el('defs');
      ['pre','core','sub','next'].forEach(k => {
        const color = C[k];
        const marker = el('marker');
        marker.setAttribute('id', `kg-arr-${k}`);
        marker.setAttribute('viewBox', '0 0 10 6');
        marker.setAttribute('refX', '10'); marker.setAttribute('refY', '3');
        marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto');
        const p = el('path'); p.setAttribute('d', 'M0,0 L10,3 L0,6Z'); p.setAttribute('fill', color);
        marker.appendChild(p); defs.appendChild(marker);
      });
      // 发光滤镜
      const filter = el('filter'); filter.setAttribute('id', 'kg-glow');
      const blur = el('feGaussianBlur'); blur.setAttribute('stdDeviation', '3'); blur.setAttribute('result', 'blur');
      const merge = el('feMerge');
      const mn1 = el('feMergeNode'); mn1.setAttribute('in', 'blur');
      const mn2 = el('feMergeNode'); mn2.setAttribute('in', 'SourceGraphic');
      merge.appendChild(mn1); merge.appendChild(mn2);
      filter.appendChild(blur); filter.appendChild(merge);
      defs.appendChild(filter);
      // 虚线无课件箭头
      const noCwMarker = el('marker');
      noCwMarker.setAttribute('id', 'kg-arr-nocw');
      noCwMarker.setAttribute('viewBox', '0 0 10 6');
      noCwMarker.setAttribute('refX', '10'); noCwMarker.setAttribute('refY', '3');
      noCwMarker.setAttribute('markerWidth', '8'); noCwMarker.setAttribute('markerHeight', '6');
      noCwMarker.setAttribute('orient', 'auto');
      const np = el('path'); np.setAttribute('d', 'M0,0 L10,3 L0,6Z'); np.setAttribute('fill', C.noCw);
      noCwMarker.appendChild(np); defs.appendChild(noCwMarker);
      svg.appendChild(defs);

      // —— 列标题 ——
      function addTitle(x, y, text, color) {
        const t = el('text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('fill', color); t.setAttribute('font-size', '14');
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-weight', '600');
        t.textContent = text; svg.appendChild(t);
      }
      addTitle(COL.pre, 30, '前序知识', '#64748b');
      addTitle(COL.core, 30, '核心知识', C.core);
      addTitle(COL.next, 30, '后续知识', '#64748b');

      // —— 绘制节点的通用函数 ——
      function drawNode(cx, cy, w, h, label, opts) {
        const { fill, stroke, strokeW, fontSize, fontWeight, fontColor, rx, glow, dash, clickUrl } = Object.assign(
          { fill: '#fff', stroke: '#ccc', strokeW: 1.5, fontSize: 14, fontWeight: '600', fontColor: '#333', rx: NODE_RX, glow: false, dash: false, clickUrl: '' }, opts);
        const g = el('g');
        g.setAttribute('class', 'kg-node' + (clickUrl ? ' has-cw' : (dash ? ' no-cw' : '')));
        const rect = el('rect');
        rect.setAttribute('x', cx - w/2); rect.setAttribute('y', cy - h/2);
        rect.setAttribute('width', w); rect.setAttribute('height', h);
        rect.setAttribute('rx', rx); rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke); rect.setAttribute('stroke-width', strokeW);
        if (dash) rect.setAttribute('stroke-dasharray', '6 3');
        if (glow) rect.setAttribute('filter', 'url(#kg-glow)');
        g.appendChild(rect);
        const txt = el('text');
        txt.setAttribute('x', cx); txt.setAttribute('y', cy + 5);
        txt.setAttribute('fill', fontColor); txt.setAttribute('font-size', fontSize);
        txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('font-weight', fontWeight);
        txt.textContent = label.length > 14 ? label.slice(0, 14) + '…' : label;
        g.appendChild(txt);
        if (clickUrl) {
          g.style.cursor = 'pointer';
          g.addEventListener('click', () => window.open(clickUrl, '_blank'));
        }
        svg.appendChild(g);
        return { cx, cy, left: cx - w/2, right: cx + w/2, top: cy - h/2, bottom: cy + h/2 };
      }

      // —— 绘制贝塞尔曲线 ——
      function drawCurve(x1, y1, x2, y2, color, markerKey) {
        const cpX = (x1 + x2) / 2;
        const path = el('path');
        path.setAttribute('d', `M${x1},${y1} C${cpX},${y1} ${cpX},${y2} ${x2},${y2}`);
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5'); path.setAttribute('opacity', '0.55');
        path.setAttribute('class', 'kg-edge');
        path.setAttribute('marker-end', `url(#kg-arr-${markerKey})`);
        svg.appendChild(path);
      }

      // —— 绘制前序节点 ——
      const prePos = {};
      preNodes.forEach((n, i) => {
        const cy = PAD_TOP + i * ROW_H + NODE_H/2;
        const hasCw = n.hasCourseware && n.url;
        const isDash = !n.hasCourseware;
        prePos[n.id] = drawNode(COL.pre, cy, NW.pre, NODE_H, n.label, {
          fill: isDash ? C.noCwBg : C.preBg,
          stroke: isDash ? C.noCw : C.pre,
          fontColor: isDash ? C.noCw : C.pre,
          dash: isDash,
          clickUrl: hasCw ? n.url : ''
        });
      });

      // —— 绘制核心主节点 ——
      const coreMainY = PAD_TOP + NODE_H/2;
      const coreMain = drawNode(COL.core, coreMainY, NW.core + 10, NODE_H + 8, d.currentLabel || '当前课件', {
        fill: C.coreBg, stroke: C.core, strokeW: 2.5,
        fontSize: 17, fontWeight: '700', fontColor: C.core,
        rx: 12, glow: true
      });

      // —— 绘制核心子节点链 ——
      const subPos = {};
      subNodes.forEach((n, i) => {
        const cy = PAD_TOP + (i + 1) * ROW_H + NODE_H/2;
        subPos[n.id] = drawNode(COL.core, cy, NW.core, NODE_H - 2, n.label, {
          fill: C.subBg, stroke: C.sub,
          fontColor: C.sub
        });
      });

      // —— 核心内部链式连线（主节点 → 第一个子节点，子节点间竖直连线） ——
      if (subNodes.length > 0) {
        const firstSub = subPos[subNodes[0].id];
        const chainLine = el('path');
        chainLine.setAttribute('d', `M${COL.core},${coreMain.bottom} L${COL.core},${firstSub.top}`);
        chainLine.setAttribute('fill', 'none'); chainLine.setAttribute('stroke', C.core);
        chainLine.setAttribute('stroke-width', '1.5'); chainLine.setAttribute('opacity', '0.6');
        chainLine.setAttribute('class', 'kg-chain');
        chainLine.setAttribute('marker-end', `url(#kg-arr-core)`);
        svg.appendChild(chainLine);
      }
      for (let i = 0; i < subNodes.length - 1; i++) {
        const from = subPos[subNodes[i].id], to = subPos[subNodes[i+1].id];
        const line = el('path');
        line.setAttribute('d', `M${COL.core},${from.bottom} L${COL.core},${to.top}`);
        line.setAttribute('fill', 'none'); line.setAttribute('stroke', C.sub);
        line.setAttribute('stroke-width', '1.2'); line.setAttribute('opacity', '0.5');
        line.setAttribute('class', 'kg-chain');
        line.setAttribute('marker-end', `url(#kg-arr-sub)`);
        svg.appendChild(line);
      }

      // —— 绘制后续节点 ——
      const nextPos = {};
      nextNodes.forEach((n, i) => {
        const cy = PAD_TOP + i * ROW_H + NODE_H/2;
        const hasCw = n.hasCourseware && n.url;
        const isDash = !n.hasCourseware;
        nextPos[n.id] = drawNode(COL.next, cy, NW.next, NODE_H, n.label, {
          fill: isDash ? C.noCwBg : C.nextBg,
          stroke: isDash ? C.noCw : C.next,
          fontColor: isDash ? C.noCw : C.next,
          dash: isDash,
          clickUrl: hasCw ? n.url : ''
        });
      });

      // —— 前序 → 核心：根据 connectsTo 精准连线 ——
      preNodes.forEach(n => {
        const from = prePos[n.id];
        if (!from) return;
        const targets = n.connectsTo || [];
        const isDash = !n.hasCourseware;
        const edgeColor = isDash ? C.noCw : C.pre;
        const markerKey = isDash ? 'nocw' : 'pre';
        if (targets.length === 0) {
          // 无指定目标时，连到核心主节点
          drawCurve(from.right, from.cy, coreMain.left, coreMain.cy, edgeColor, markerKey);
        } else {
          targets.forEach(tid => {
            const to = subPos[tid] || coreMain;
            drawCurve(from.right, from.cy, to.left, to.cy, edgeColor, markerKey);
          });
        }
      });

      // —— 核心 → 后续：根据 connectsFrom 精准连线 ——
      nextNodes.forEach(n => {
        const to = nextPos[n.id];
        if (!to) return;
        const sources = n.connectsFrom || [];
        const isDash = !n.hasCourseware;
        const edgeColor = isDash ? C.noCw : C.next;
        const markerKey = isDash ? 'nocw' : 'next';
        if (sources.length === 0) {
          // 无指定来源时，从核心主节点连出
          drawCurve(coreMain.right, coreMain.cy, to.left, to.cy, edgeColor, markerKey);
        } else {
          sources.forEach(sid => {
            const from = subPos[sid] || coreMain;
            drawCurve(from.right, from.cy, to.left, to.cy, edgeColor, markerKey);
          });
        }
      });
    })();

    // ═══ 音频播放器引擎（滚动自动播放 + 底部控制条） ═══
    // audioPlaylist 由 AI 在 L3 完成后注入，格式：
    // [{id, sectionId, title, src, subtitle}]
    (function initAudioPlayer() {
      if (typeof audioPlaylist === 'undefined' || !audioPlaylist.length) return;
      // 创建底部悬浮控制条
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.innerHTML = `
        <span class="audio-track-title"></span>
        <button class="audio-ctrl-btn play-btn">▶</button>
        <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
        <span class="time-display">0:00</span>
        <button class="speed-btn">1x</button>
        <span class="audio-subtitle"></span>
      `;
      document.body.appendChild(bar);
      const audio = new Audio();
      let currentIdx = -1;
      const speeds = [0.5, 1, 1.25, 1.5, 2];
      let speedIdx = 1; // 默认 1x
      function playTrack(i, autoplay) {
        if (i < 0 || i >= audioPlaylist.length) return;
        currentIdx = i;
        audio.src = audioPlaylist[i].src;
        if (autoplay !== false) audio.play();
        bar.classList.add('active');
        document.body.classList.add('audio-playing');
        bar.querySelector('.audio-track-title').textContent = audioPlaylist[i].title || '';
        bar.querySelector('.play-btn').textContent = autoplay !== false ? '⏸' : '▶';
        bar.querySelector('.audio-subtitle').textContent = audioPlaylist[i].subtitle || '';
      }
      // IntersectionObserver：滚动到 section 时自动播放对应音频
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const secId = entry.target.id;
          const idx = audioPlaylist.findIndex(item => item.sectionId === secId);
          if (idx !== -1 && idx !== currentIdx) playTrack(idx);
        });
      }, { threshold: 0.4 });
      audioPlaylist.forEach(item => {
        const sec = document.getElementById(item.sectionId);
        if (sec) observer.observe(sec);
      });
      // 播放/暂停
      bar.querySelector('.play-btn').addEventListener('click', () => {
        if (audio.paused) { if (currentIdx < 0) playTrack(0); else audio.play(); bar.querySelector('.play-btn').textContent = '⏸'; }
        else { audio.pause(); bar.querySelector('.play-btn').textContent = '▶'; }
      });
      // 调速
      bar.querySelector('.speed-btn').addEventListener('click', () => {
        speedIdx = (speedIdx + 1) % speeds.length;
        audio.playbackRate = speeds[speedIdx];
        bar.querySelector('.speed-btn').textContent = speeds[speedIdx] + 'x';
      });
      // 进度条
      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
        bar.querySelector('.progress-fill').style.width = pct + '%';
        const m = Math.floor(audio.currentTime / 60), s = Math.floor(audio.currentTime % 60);
        bar.querySelector('.time-display').textContent = m + ':' + String(s).padStart(2, '0');
      });
      // 自动连播
      audio.addEventListener('ended', () => {
        if (currentIdx < audioPlaylist.length - 1) playTrack(currentIdx + 1);
        else { bar.querySelector('.play-btn').textContent = '▶'; }
      });
      // 点击进度条跳转
      bar.querySelector('.progress-track').addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    })();
  </script>
  <!-- ⭐ v6.11 强制：AI 学伴脚本（必须放在 </body> 前，defer 保证 DOM 已就绪） -->
  <script src="./ai-tutor.js" defer></script>
</body>
</html>
```

**骨架使用规则**：

| 规则 | 说明 |
|:---|:---|
| **必选 section 不可删除** | Hero、学习目标、前测、知识模块（≥3个）、综合任务、后测、小结、**知识图谱** |
| **模块数量** | 最少 3 个，最多 5 个（与驱动结构的子问题/子活动/阶段数一致） |
| **导航项动态匹配** | nav-bar 中的锚点链接必须与实际 section id 一一对应（包含 `#knowledge-graph`） |
| **CSS 变量替换** | 将 `:root` 中的变量替换为 10.3 对应学段模板的配色 |
| **前后翻页** | 每两个相邻模块之间放一个 `.page-nav` 翻页条 |
| **进度条** | 始终保留顶部进度条，让学生知道"学到了哪里" |
| **音频播放器** | L3 语音生成后，注入 `audioPlaylist` 数组（含 `sectionId` 字段关联对应 section）并确保骨架中的音频播放器引擎正常工作（IntersectionObserver 滚动自动播放 + 底部悬浮控制条：播放/暂停+进度条+调速+字幕）。**禁止**只添加隐藏 `<audio>` 标签而不提供播放 UI |
| **视频播放器** | 视频**必须嵌入到对应知识模块的 section 内部**（而非集中放置），使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签嵌入，外包 `.video-player` 容器 + `.video-caption` 说明。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化，仅当交互无法覆盖时才用 `<video>` 嵌入静态视频。**禁止**仅用 JS 动态创建视频元素 |
| **知识图谱** | 必须注入 `knowledgeGraphData` 对象（从 `_graph.json` 的 `prerequisites` + `leads_to` 提取节点和边），当前节点高亮、有课件节点可点击跳转、无课件节点显示虚线框 |
| **AI 生成的插图** | 使用 `image_gen` 生成后，以 `<img src="./assets/xxx.png">` 嵌入（详见 10.4.1） |

#### 10.2.2 统一导航规范

所有课件**必须**使用 **Sticky 顶部导航 + 前后翻页按钮** 的导航模式。禁止使用以下替代方案：

| ❌ 禁止 | ✅ 统一使用 | 理由 |
|:---|:---|:---|
| Tab 切换（水平标签页） | Sticky 导航 + 锚点滚动 | Tab 切换隐藏内容，学生无法看到全局进度 |
| 纯手动滚动（无导航） | Sticky 导航 + 进度条 | 学生容易迷失位置 |
| 侧边栏导航 | 顶部导航（移动端友好） | 侧边栏在移动端体验差 |
| 多页 HTML（page1.html, page2.html） | 单文件 + 锚点 section | 单文件便于离线使用和打包 |

**导航交互规范**：
1. **Sticky 导航栏**：始终固定在页面顶部，滚动时不消失
2. **当前 section 高亮**：滚动到哪个 section，对应导航项自动高亮
3. **进度条**：页面顶部 3px 彩色进度条，实时反映阅读进度
4. **前后翻页**：每两个模块之间放置翻页按钮（← 上一模块 / 下一模块 →），按钮带当前位置指示（"模块 2 / 4"）
5. **平滑滚动**：所有导航和翻页点击使用 `scrollIntoView({ behavior: 'smooth' })`

#### 10.2.3 知识图谱可视化规范（必选·三列布局）

> ⚠️ **铁律**：每个课件**必须**包含交互式知识图谱 section（`#knowledge-graph`），采用**三列布局**：前序知识 → 核心子知识点链 → 后续知识。知识图谱是课件结构的必选组成部分，不可省略。

**三列布局说明**：
- **左列（前序知识）**：当前课件的前置知识节点，从 `_graph.json` 的 `prerequisites` 提取
- **中列（核心知识）**：顶部为当前课件的主节点（橙色高亮），下方展开为 5-8 个子知识点纵向链，对应课件的教学模块
- **右列（后续知识）**：学完当前课件后可进阶的知识点，从 `_graph.json` 的 `leads_to` 提取
- **连线规则**：前序节点精准连接到它所对应的核心子知识点（不是全部连到主节点）；后续节点从对应的核心子知识点引出

**数据来源**：
1. 从 `_graph.json` 的 `prerequisites` 和 `leads_to` 字段提取前序/后续节点
2. 从当前课件的教学模块（section）拆解出核心子知识点
3. 查询 `data/trees/*.json` 中的 `status` 字段判断 `hasCourseware`：仅 `status: "active"` 且 `courses` 非空的节点为 `true`

**数据注入格式**：

AI 在生成课件时，必须在 `<script>` 标签**最前面**（骨架 JS 之前）注入以下数据对象：

```html
<script>
  // ═══ 知识图谱数据（AI 从 _graph.json + 教学模块自动生成） ═══
  const knowledgeGraphData = {
    currentNode: "linear-function",          // 当前课件节点 ID
    currentLabel: "一次函数 y=kx+b",          // 核心主节点的显示标签

    // 核心子知识点（纵向链，对应课件教学模块，5-8 个）
    coreSubTopics: [
      { id: "sub-definition", label: "一次函数的定义" },
      { id: "sub-graph",      label: "两点法画图像" },
      { id: "sub-kb",         label: "k和b的几何意义" },
      { id: "sub-method",     label: "待定系数法" },
      { id: "sub-equation",   label: "一次函数与方程组" },
      { id: "sub-application",label: "实际应用" }
    ],

    // 前序知识（connectsTo 指向核心子知识点 id，精准连线）
    prerequisites: [
      { id: "coordinate-system",     label: "平面直角坐标系",  hasCourseware: false, url: "", connectsTo: ["sub-definition", "sub-graph"] },
      { id: "proportional-function", label: "正比例函数",      hasCourseware: false, url: "", connectsTo: ["sub-definition"] },
      { id: "linear-equation",       label: "一元一次方程",    hasCourseware: false, url: "", connectsTo: ["sub-method"] },
      { id: "variable-and-function", label: "变量与函数",      hasCourseware: false, url: "", connectsTo: ["sub-definition"] }
    ],

    // 后续知识（connectsFrom 指向核心子知识点 id，精准连线）
    nextTopics: [
      { id: "quadratic-function", label: "二次函数",           hasCourseware: true,  url: "../math-quadratic-function/index.html", connectsFrom: ["sub-application"] },
      { id: "linear-equation-system-graph", label: "一次函数与方程组图解", hasCourseware: false, url: "", connectsFrom: ["sub-equation"] },
      { id: "inverse-proportional", label: "反比例函数",       hasCourseware: false, url: "", connectsFrom: ["sub-kb"] }
    ]
  };
</script>
```

**字段说明**：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `currentNode` | string | 当前课件在 `_graph.json` 中的节点 ID |
| `currentLabel` | string | 核心主节点的显示文字（含公式或核心表达式） |
| `coreSubTopics` | array | 核心子知识点列表，纵向链式展示，对应课件教学模块 |
| `coreSubTopics[].id` | string | 子知识点 ID，用于 `connectsTo` / `connectsFrom` 引用 |
| `coreSubTopics[].label` | string | 子知识点显示文字 |
| `prerequisites` | array | 前序知识节点列表 |
| `prerequisites[].connectsTo` | string[] | 该前序节点连向的核心子知识点 ID 列表（精准映射） |
| `nextTopics` | array | 后续知识节点列表 |
| `nextTopics[].connectsFrom` | string[] | 该后续节点从哪些核心子知识点引出（精准映射） |
| `*.hasCourseware` | boolean | 是否有对应课件，基于 `data/trees/*.json` 的 `status: "active"` 判断 |
| `*.url` | string | 课件 URL，有课件时填相对路径，无课件填空字符串 |

**节点视觉规则（四种颜色区分）**：

| 节点类型 | 底色 | 边框色 | 文字色 | 特殊样式 |
|:---|:---|:---|:---|:---|
| **核心主节点** | `rgba(245,158,11,0.18)` | `#f59e0b`（2.5px） | `#f59e0b` | 发光滤镜、17px 粗体、圆角 12px |
| **核心子节点** | `rgba(59,130,246,0.12)` | `#3b82f6`（1.5px） | `#3b82f6` | 14px 半粗体 |
| **前序/后续（有课件）** | 对应色 12% 透明 | 对应色 1.5px 实线 | 对应色 | 可点击，hover 高亮 |
| **前序/后续（无课件）** | `rgba(148,163,184,0.08)` | `#94a3b8` 1.5px **虚线** | `#94a3b8` | 不可点击 |

**连线规则**：
- **前序 → 核心**：青色（`#06b6d4`）贝塞尔曲线，从前序节点右边缘到核心子节点左边缘
- **核心内部链**：主节点到第一个子节点用金色（`#f59e0b`），子节点间用蓝色（`#3b82f6`）直线
- **核心 → 后续**：绿色（`#10b981`）贝塞尔曲线，从核心子节点右边缘到后续节点左边缘
- **无课件节点**的连线使用灰色（`#94a3b8`）
- 所有连线带箭头 `marker-end`，opacity 0.5-0.6

**节点 ID 命名**：
- 前序/后续节点 ID 使用 `_graph.json` 中的 `node_id`（如 `linear-function`、`ohms-law`）
- 核心子知识点 ID 使用 `sub-` 前缀 + 简短英文标识（如 `sub-definition`、`sub-graph`）

**降级策略**：
- 如果 `_graph.json` 不存在或无法读取 → 使用 Web 搜索获取前置/后续知识点，手动构建节点列表
- 如果无法判断哪些节点有课件 → 所有前序/后续节点均渲染为"无课件"虚线框
- 如果课件模块较少（< 3 个教学模块） → 核心子知识点至少拆出 3 个子节点
- 绝不因为数据不完整而省略知识图谱 section

#### 10.2.4 视频播放器规范（强制）

> ⚠️ **铁律**：课件中所有视频**必须**使用 HTML `<video>` 标签静态嵌入，**禁止**仅用 JavaScript 动态创建视频元素。视频**必须嵌入到对应知识模块的 section 内部**，不可集中放在某个独立区域。

**优先交互演示原则**：
> 对于过程性变化（函数图像变化、实验过程、地理变迁等），**优先使用 CSS/JS/Canvas/SVG 交互动画**在 HTML 课件中直接实现。交互动画允许学生拖拽参数、点击触发，学习效果优于被动观看视频。仅当交互方式无法覆盖（如真实实验录像、复杂 3D 渲染）时，才使用 `<video>` 嵌入静态视频。

**优先级决策**：
| 优先级 | 方式 | 适用场景 | 示例 |
|:---|:---|:---|:---|
| 🥇 首选 | CSS/JS/Canvas/SVG 交互动画 | 参数可调的过程、几何变换、函数图像、简单物理模拟 | 拖拽滑块改变 k 值看直线旋转 |
| 🥈 次选 | Remotion 生成视频（L2） | 多步骤连续过程、需要精确时间线控制 | 细胞分裂全过程动画 |
| 🥉 保底 | `<video>` 嵌入静态视频 | 真实实验录像、外部视频素材 | 真实化学实验操作视频 |

**标准视频嵌入模板**（当确需使用 `<video>` 时）：

```html
<div class="video-player">
  <video controls preload="metadata" playsinline width="100%">
    <source src="./assets/experiment-demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</div>
<p class="video-caption">🎬 实验过程演示</p>
```

**强制属性**：
| 属性 | 必选 | 说明 |
|:---|:---|:---|
| `controls` | ✅ | 显示浏览器原生播放控件 |
| `preload="metadata"` | ✅ | 预加载元信息（时长、尺寸），不预加载完整视频 |
| `playsinline` | ✅ | 移动端内联播放，避免自动全屏 |
| `width="100%"` | ✅ | 响应式宽度 |
| `.video-player` 外包容器 | ✅ | 统一圆角和阴影样式 |
| `.video-caption` 说明文字 | ✅ | 视频下方居中说明 |

**Remotion 生成的视频**：L2 渲染完成后，将 `out/*.mp4` 复制到课件的 `assets/` 目录，然后在 HTML 中用上述模板嵌入。

#### 10.2.5 音频播放器规范（L3 强制）

> ⚠️ **铁律**：L3 语音讲解生成后，课件**必须**包含完整的音频播放器 UI（底部悬浮控制条 + 滚动自动播放）。**禁止**只添加隐藏的 `<audio>` 标签而不提供任何播放控件。

**标准音频播放器架构**（已内置于 HTML 骨架模板的 JS 中）：

```
  用户滚动到 Section 3 → IntersectionObserver 触发 → 自动播放 seg03 音频

┌─── 课件内容 ──────────────────────────────────────────────┐
│  [Section 1] 一次函数的定义        ← 滚动到此自动播放 seg01 │
│  [Section 2] 函数图像的画法        ← 滚动到此自动播放 seg02 │
│  [Section 3] k 和 b 的意义  ← 当前可见 → 自动播放 seg03   │
│  [Section 4] 实际应用              ← 滚动到此自动播放 seg04 │
└────────────────────────────────────────────────────────────┘
┌─── 底部悬浮控制条（.audio-bar） ──────────────────────────┐
│  模块3：k和b的意义  ▶/⏸  [━━━━━●━━━] 2:15  [1.25x]  字幕 │
└────────────────────────────────────────────────────────────┘
```

**核心交互**：
- **滚动自动播放**：IntersectionObserver 监听每个 section，当 section 进入视口（threshold: 0.4）时自动播放对应音频段
- **底部悬浮控制条**：显示当前播放段落标题、播放/暂停按钮、进度条、时间显示、调速按钮、字幕
- **可调速**：支持 0.5x / 1x / 1.25x / 1.5x / 2x 五档调速，点击循环切换
- **暂停/继续**：点击 ▶/⏸ 按钮暂停或继续当前音频
- **自动连播**：当前段播完自动播放下一段

**数据注入格式**：

AI 在 L3 完成后，必须在 `<script>` 标签最前面注入 `audioPlaylist` 数组：

```html
<script>
  const audioPlaylist = [
    { id: "seg01", sectionId: "module-1", title: "模块1：一次函数的定义", src: "./tts/seg01_zh.mp3", subtitle: "一次函数是形如 y=kx+b 的函数…" },
    { id: "seg02", sectionId: "module-2", title: "模块2：函数图像的画法", src: "./tts/seg02_zh.mp3", subtitle: "画一次函数图像只需要两个点…" },
    // ... 每个知识模块一段，sectionId 对应 HTML 中 section 的 id
  ];
</script>
```

> ⚠️ **关键**：每个条目的 `sectionId` 必须精确匹配 HTML 中对应 section 的 `id` 属性，否则滚动自动播放无法触发。

**播放器功能清单**：
| 功能 | 必选 | 说明 |
|:---|:---|:---|
| 底部悬浮控制条 | ✅ | `.audio-bar`，固定底部，显示当前播放信息 |
| 滚动自动播放 | ✅ | IntersectionObserver 监听 section 可见性，自动切换并播放对应音频 |
| 播放/暂停 | ✅ | ▶/⏸ 切换 |
| 调速（5档） | ✅ | 0.5x / 1x / 1.25x / 1.5x / 2x，点击循环切换 |
| 进度条 | ✅ | 可点击跳转，实时更新 |
| 时间显示 | ✅ | 当前播放时间 |
| 字幕显示 | ✅ | 当前段落的文字内容（在控制条内） |
| 自动连播 | ✅ | 一段播完自动播放下一段 |

#### 10.2.6 AI 学伴悬浮球规范（v6.11 强制 · 左下角）

> ⚠️ **铁律**：自 v6.11 起，**所有 HTML 课件必须内置"AI 学伴"悬浮球**（屏幕左下角）。学生首次点击可输入 OpenAI 兼容的 API Key 激活，随后可针对当前正在学习的内容提问，AI 以匹配学段的难度简短答复（小学 2-3 句、初中 3-5 句、高中 5-8 句）。违反此规则 = Completeness Gate #28 不通过。

**架构与分层**：

```
┌─ 屏幕左下角 ──────────────────────────────────────┐
│                                    [💡 学伴]    │ ← FAB 悬浮球（56×56 px 圆形按钮）
└───────────────────────────────────────────────────┘
          点击 →
┌─ 首次点击：API Key 配置弹窗 ──────────────────────┐
│  🎓 启用你的 AI 学伴                              │
│  ┌─────────────────────────────────────────┐    │
│  │ API Base URL                            │    │
│  │ [https://api.openai.com/v1           ]  │    │
│  │ API Key                                 │    │
│  │ [sk-xxxxxxxxxxxxxxxx                 ]  │    │
│  │ 模型                                    │    │
│  │ [gpt-4o-mini                         ]  │    │
│  │                                         │    │
│  │  ☑ 我已知道 Key 仅保存在本浏览器中       │    │
│  │    [取消]  [保存并开始对话]              │    │
│  └─────────────────────────────────────────┘    │
└───────────────────────────────────────────────────┘
          配置完成 →
┌─ 对话面板（360 × 520 px，左下角停驻） ────────────┐
│  🎓 学伴 · 二次函数的顶点式           [×] 清空    │
│  ┌─────────────────────────────────────────┐    │
│  │ 📍 当前学习：模块 3 - 顶点式推导          │    │
│  ├─────────────────────────────────────────┤    │
│  │ [AI] 关于顶点式，你想问什么？             │    │
│  │ [我] 为什么配方一下就变成顶点式了？       │    │
│  │ [AI] 好问题！因为 y=ax²+bx+c 通过把...    │    │
│  ├─────────────────────────────────────────┤    │
│  │ [针对当前内容提问...                ] ↵  │    │
│  └─────────────────────────────────────────┘    │
└───────────────────────────────────────────────────┘
```

**配置注入格式**（所有课件 `<script>` 最前面必须写入）：

```javascript
window.__TEACHANY_TUTOR_CONFIG__ = {
  // 课件元信息（用于构造 system prompt）
  courseTitle: '二次函数的顶点式',
  subject: 'math',                    // 学科ID，用于匹配学科话术
  grade: 9,                           // 年级数字（1-12），决定答复难度
  learningObjectives: [               // 学习目标（选填，但强烈推荐）
    '理解配方法的几何意义',
    '会将一般式化为顶点式',
    '能读出顶点坐标和对称轴'
  ],
  // 获取"当前学习上下文"的函数：读取用户正看的 section 文字
  // 默认实现：读取 IntersectionObserver 命中的 section.innerText
  // 可自定义以返回更精准的上下文
  getContext: () => {
    const current = document.querySelector('section.current-section') ||
                    document.querySelector('section:target') ||
                    document.querySelector('section');
    return current?.innerText?.slice(0, 3000) || '';
  }
};
```

**JS 运行时行为（由 `ai-tutor.js` 实现）**：

1. **FAB 渲染**：`DOMContentLoaded` 后在 `<body>` 末尾注入 `<div class="ai-tutor-fab">💡</div>` + `<div class="ai-tutor-panel">...</div>`；左下距离 24px / 底部 24px，`z-index: 9998`（高于音频控制条 `audio-bar`）
2. **首次点击**：检查 `localStorage.teachany_tutor_config`，若为空则弹出 API Key 配置面板（覆盖全屏 modal）；配置面板含 3 字段（`baseUrl` 默认 `https://api.openai.com/v1`、`apiKey`、`model` 默认 `gpt-4o-mini`）；保存到 `localStorage`（⚠️ 明确告知学生 Key 仅本地存储，不上传）
3. **后续点击**：直接展开对话面板
4. **发送消息**：
   - 从 `__TEACHANY_TUTOR_CONFIG__.getContext()` 拉取当前 section 文本（最长 3000 字）
   - 构造 `messages` 数组：`[system, context, ...history, user]`
   - **system prompt** 按 `grade` 动态生成：
     - 小学（1-6）："你是亲切的小学学伴，用 2-3 句话、生活化比喻、不用专业术语回答。"
     - 初中（7-9）："你是初中学伴，用 3-5 句话、结构化答复，可适度引入关键术语。"
     - 高中（10-12）："你是高中学伴，用 5-8 句话、可含数学符号/公式/英文专业词，答复要有条理。"
   - **context 注入**：`"[当前正在学习：${currentSectionId}]\n[上下文片段]\n${contextText}"`
   - 调用 `POST ${baseUrl}/chat/completions`，`Authorization: Bearer ${apiKey}`
   - 支持流式输出（SSE）；失败时吐出可读错误（401/429/网络）
5. **UI 要求**：
   - 对话气泡：AI 左、学生右；
   - 答复区支持 `\n` 转 `<br>`，代码块用 `<pre>`；
   - 头部显示当前"📍 正在学习：<section title>"；
   - 底部输入框 `Enter` 发送、`Shift+Enter` 换行；
   - 右上角"清空"按钮清空 history（不清 API Key）；
   - 面板可被关闭按钮收回、再次点击 FAB 恢复（FAB 在左下，避开右下 TTS 控制条）。

**安全与隐私**：
- ⚠️ **API Key 仅保存在 `localStorage`**，课件不得上传到任何远程服务器
- ⚠️ 课件打包时必须把 `ai-tutor.css` + `ai-tutor.js` **一起打进 .teachany 包**（相对路径 `./ai-tutor.css` / `./ai-tutor.js`）
- ⚠️ 配置面板必须有一句话明示："API Key 仅保存在你当前浏览器中，关闭页面/清浏览器数据后失效；TeachAny 不会收集或上传你的 Key"

**降级策略**：
| 情况 | 处理方式 |
|:---|:---|
| 网络不可达/Key 无效 | 面板显示友好错误文本，保留对话历史，允许用户修改 Key 重试 |
| 浏览器不支持 `fetch`（旧 IE） | FAB 仍然渲染，点击后告知"请升级浏览器" |
| `window.__TEACHANY_TUTOR_CONFIG__` 未定义 | 使用默认回退：`courseTitle` 取 `document.title`、`grade` 取 `<meta name="teachany-grade">`、`getContext` 取 `document.body.innerText.slice(0,3000)` |

**禁止项**：
- ❌ 把 API Key 硬编码到课件 HTML/JS 中（任何形式）
- ❌ 把 API Key 上传到任何后端或第三方分析服务
- ❌ 只注入 `<script>` 而不提供 FAB 或只提供 FAB 而不实现问答逻辑
- ❌ 答复长度与学段严重不符（小学课件答一大段学术文 / 高中课件只说"对的！"）
- ❌ 不提供"清空对话"和"修改 Key"的入口

### 10.3 视觉设计规范（按学段分级）

根据学生年龄特点，提供三套视觉风格模板。**生成课件时必须先判断学段，选择对应模板**。

| 学段 | 模板文件 | 风格关键词 | 背景 | 配色 |
|:---|:---|:---|:---|:---|
| **小学**（1-6 年级） | `elementary.html` | 明亮活泼、圆角卡通、彩虹糖果色 | 暖白 `#fffbf0` | 珊瑚红 + 薄荷绿 + 阳光黄 |
| **初中**（7-9 年级） | `middle-school.html` | 清新明快、蓝绿渐变、适度活泼 | 浅灰白 `#f8fafc` | 天蓝 + 青绿 + 琥珀 |
| **高中**（10-12 年级） | `high-school.html` | 沉稳专业、深色主题、学术质感 | 深蓝 `#0f172a` | 淡蓝 + 淡紫 + 金黄 |

#### 小学模板配色（`elementary.html`）
```css
:root {
  --bg: #fffbf0;       /* 暖白主背景 */
  --primary: #ff6b6b;  /* 珊瑚红 */
  --secondary: #4ecdc4;/* 薄荷绿 */
  --accent: #ffe66d;   /* 柠檬黄 */
  --purple: #cc5de8;   /* 葡萄紫 */
  --orange: #ff922b;   /* 橙子橙 */
  --card: #ffffff;     /* 纯白卡片 */
}
```
- 圆角 20px，卡片带阴影 `box-shadow: 0 4px 16px rgba(0,0,0,0.04)`
- 标题用 `font-weight: 900`，彩虹渐变文字动画
- 图标带 `bounce` 弹跳动画，选项点击带 `popIn` 缩放动画
- 答对反馈用 🎉 和鼓励语（"太棒了！"），答错反馈用 💪 和鼓励语（"没关系！"）
- 闯关式练习结构（"第一关：基础小达人" → "第二关：应用小能手" → "第三关：挑战小学霸"）
- 导航栏 emoji：🌈

#### 初中模板配色（`middle-school.html`）
```css
:root {
  --bg: #f8fafc;       /* 浅灰白背景 */
  --primary: #3b82f6;  /* 天蓝 */
  --secondary: #06b6d4;/* 青绿 */
  --accent: #f59e0b;   /* 琥珀 */
  --teal: #14b8a6;     /* 水鸭绿 */
  --card: #ffffff;     /* 白色卡片 */
}
```
- 圆角 14px，卡片带轻柔阴影
- 目标卡片顶部带 3px 彩色条（每张不同色）
- 节标题左侧用渐变色竖线（`border-image: linear-gradient(...) 1`）
- 选项 hover 时带 `translateX(3px)` 右移效果
- 正式但不刻板的反馈语气（"正确！" / "再想想。"）
- 标准 Level 1/2/3 练习结构
- 导航栏 emoji：🎓

#### 高中模板配色（`high-school.html`）
```css
:root {
  --bg: #0f172a;       /* 深蓝背景 */
  --primary: #60a5fa;  /* 淡蓝 */
  --secondary: #a78bfa;/* 淡紫 */
  --accent: #fbbf24;   /* 金黄 */
  --card: rgba(30, 41, 59, 0.65); /* 半透明毛玻璃 */
}
```
- 圆角 12px，`backdrop-filter: blur(10px)` 毛玻璃效果
- 目标卡片顶部用 2px 细线（精简克制）
- 独有组件：**公式框**（`.formula-box`，金黄强调色，衬线字体）、**推导步骤**（`.derivation`，编号圆点步进式）
- 选项 hover 无位移，仅背景色变化（克制感）
- 简洁反馈语气（"正确！" / "再想想。"）
- 导航栏品牌用 `<strong>` 区分中英文而非纯 emoji

**通用排版规范**（三套模板共享）：
- 正文字号：15-16px，行高 1.75-1.85
- 公式/代码：`Times New Roman` 或等宽字体
- 响应式网格：`grid-template-columns: repeat(auto-fit, minmax(260-340px, 1fr))`
- 间距：模块间 `margin: 40-46px 0`，卡片间 `margin-bottom: 16-20px`
- 全部支持移动端响应式（`@media max-width: 600px`）

**Remotion 动画规范**（如需要）：
- 分辨率 1920×1080，帧率 30fps
- 单 Composition 600-900 帧（20-30 秒）
- 每个 Composition 3-5 个场景
- 动画风格：`interpolate` + `spring`，渐入渐出
- 配色与 HTML 课件保持统一

### 10.4 AI 多模态互动区（适用场景默认插入）

对于适合**视觉化表达**的学科内容（尤其语文、历史、地理、美术等人文学科），课件中**默认生成**"AI 多模态互动区"——预留的交互式占位区域，教师或学生可通过 AI API 生成图片/视频内容填充。

> ⚠️ **默认规则**：当课题属于文科或涉及视觉化内容时，AI 必须自动插入互动区，不需要用户要求。仅在纯理科计算课、纯习题课时才跳过（需在 Generation Gate 中标注跳过理由）。

#### 使用场景

| 场景 | 说明 | 示例 |
|:---|:---|:---|
| **教师备课时插入** | 教师使用自己的多模态 API 生成图片/视频，嵌入课件 | 历史课：生成"丝绸之路商队"插图 |
| **学生课中创作** | 学生撰写提示词，课件调用 API 生成作为作品 | 语文课：根据诗句意境写提示词，AI 生成意境画 |
| **课后拓展任务** | 作为创新挑战题，学生用 AI 辅助完成创作 | 地理课：生成"板块运动示意动画" |

#### HTML 实现规范

在课件中使用以下 HTML 结构标记多模态互动区：

```html
<!-- AI 多模态互动区 -->
<div class="teachany-media-zone" 
     data-zone-type="image"
     data-suggested-prompt="一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画，远处有雪山和古城"
     data-context="历史·丝绸之路·情境导入">
  <div class="media-zone-placeholder">
    <div class="zone-icon">🎨</div>
    <div class="zone-title">AI 图片创作区</div>
    <div class="zone-desc">在此输入提示词，使用 AI 生成与课程相关的图片</div>
    <textarea class="prompt-input" placeholder="描述你想要生成的图片..."></textarea>
    <div class="zone-actions">
      <button class="btn-generate" onclick="generateMedia(this)" disabled>
        🖼️ 生成图片（需配置 API）
      </button>
      <button class="btn-upload" onclick="uploadMedia(this)">
        📁 上传本地图片
      </button>
    </div>
    <div class="media-result"></div>
    <div class="zone-hint">
      💡 参考提示词：<em>一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画</em>
    </div>
  </div>
</div>
```

#### 属性说明

| 属性 | 必填 | 说明 |
|:---|:---|:---|
| `data-zone-type` | ✅ | `image` / `video` / `audio` |
| `data-suggested-prompt` | ✅ | AI 建议的提示词（中文），帮助教师/学生快速生成 |
| `data-context` | ✅ | 学科·主题·用途，便于管理和理解 |

#### 交互逻辑

1. **默认状态**：显示占位区 + 建议提示词 + "上传本地图片"按钮（始终可用）
2. **教师配置 API 后**：激活"生成"按钮，可通过 API 直接生成
3. **学生模式**：学生填写自己的提示词 → 点击生成 → 作品展示在互动区（作为学习产出）
4. **降级方案**：如无 API，教师可直接上传本地图片/视频

#### 何时生成互动区

AI **默认在以下位置自动插入** AI 多模态互动区：

| 条件 | 插入位置 |
|:---|:---|
| 文科课题的 ABT 情境导入 | 导入区域（生成情境图片） |
| 项目制课的成果展示阶段 | 作品创作区域 |
| 跨学科融合课中的"图→文"或"文→图"转化 | 创作任务区域 |
| 创新挑战题（⭐⭐⭐）涉及视觉创作 | 挑战题区域 |
| 理科课题中有实验装置/现象观察 | 实验示意图区域 |
| 用户明确要求"加入 AI 创作环节" | 用户指定位置 |

**仅以下情况跳过**（需在 Generation Gate 中标注跳过理由）：
- 纯计算/纯公式推导课（无视觉化内容）
- 纯习题课（练习为主，不需要视觉创作）
- 纯复习课（知识梳理为主）

#### 10.4.1 AI 主动生图规范（课件生成阶段）

> ⚠️ **这不是用户运行时的 API 调用**，而是 **AI 在生成课件代码时主动调用 `image_gen` 工具**，生成插图并直接嵌入 HTML。
>
> 🔒 **生图来源铁律（v5.34.12 新增）**：本项目**只使用**宿主 IDE（WorkBuddy / CodeBuddy）原生提供的 `image_gen` 工具。
>
> - ✅ 允许：调用运行环境里注册的 `image_gen` 工具（由宿主 IDE 透明代理到其内部图像服务）
> - ❌ 严禁：在任何脚本里直接 `requests.post('https://api.openai.com/...')` / 调用 Gemini Vision / 调用 Replicate / 调用 nano-banana / 调用 Tripo / 调用 Hunyuan 等"用户私人 API"
> - ❌ 严禁：读取 `.env` / memory 中用户 API Key 用于生图
> - ❌ 严禁：把"用户曾告诉 AI 的某个 OpenAI/Gemini Key"写进脚本或 CI workflow
>
> **除非用户在当前对话中明确说"用我的 XX key 生图"**，AI 都必须走宿主 `image_gen` 工具。
> 即便用户曾在以往会话中提供过 key，本次若未重新明确要求，也**不得**使用。
>
> 本规则的目的：保证课件生产链路的**可移植性**（换一个宿主 IDE 跑，只要它提供 `image_gen` 工具就能开箱跑通）和**安全性**（不把用户 API 配额消耗在隐式调用上）。

**核心原则**：文科课件（语文、历史、地理、美术）和情境导入强化型理科课件中，AI **必须在生成课件的同时主动生成配图**，不能只留占位符。

**触发条件与生图位置**：

| 条件 | 生图位置 | prompt 策略 | 示例 |
|:---|:---|:---|:---|
| **文科 ABT 情境导入** | Hero 区或模块导入卡片 | "一幅描绘【场景】的【风格】插画，教育类，清晰明亮" | 历史课："一幅描绘丝绸之路商队穿越沙漠的水彩插画，远处有雪山和古城，教育风格" |
| **语文诗词/散文意境** | 课文赏析模块 | "【诗词名】意境图，中国水墨风格，【具体意象】" | "静夜思意境图，中国水墨风，月光洒在窗前，游子独坐思乡" |
| **历史场景还原** | 时间线节点 / 史料对读区 | "【历史事件】场景插画，历史教育风格" | "商鞅变法场景，秦国城门立木取信，围观百姓，教育插画风格" |
| **地理地貌/气候** | 地图标注区 / 成因分析模块 | "【地理现象】示意图，科学教育风格" | "板块碰撞形成喜马拉雅山脉的示意图，剖面图风格，标注关键构造" |
| **生物结构/过程** | 结构讲解区 | "【生物结构/过程】科学插图，标注清晰" | "植物细胞结构图，标注细胞壁、叶绿体、液泡，教育风格" |
| **角色任务型情境** | 角色介绍卡 | "一个【角色身份】的卡通形象，友好亲切" | "一个穿着探险服的中学生卡通形象，手持放大镜" |

**生图执行流程**：
```text
1. AI 在编写 HTML 课件时识别需要插图的位置
2. 调用 image_gen 工具生成图片（prompt 遵循上表策略）
3. 图片保存到课件目录下的 assets/ 文件夹
4. 在 HTML 中以 <img src="./assets/xxx.png" alt="描述文字"> 嵌入
5. 同时保留 AI 多模态互动区的占位符（供教师/学生二次创作）
```

**生图质量参数**：
| 参数 | 推荐值 | 说明 |
|:---|:---|:---|
| `size` | `1024x1024` | 正方形插图 |
| `quality` | `medium` | 平衡质量与速度 |
| `style` | `natural` | 教育场景优先自然风格 |

**降级策略**：
- 如果 `image_gen` 不可用（环境限制），保留 AI 多模态互动区占位符 + `data-suggested-prompt`，并在课件中添加提示："此处建议插入 AI 生成的插图，参考提示词：..."
- 绝不因为生图不可用而省略整个互动区

#### 10.4.2 AI 主动生视频规范（课件生成阶段）

> 当课件内容涉及**过程性变化**（理科实验、地理变化、历史演变、生物过程），AI 应评估是否适合生成短视频。

**适用场景**：

| 场景类型 | 示例 | 视频类型 | 推荐时长 |
|:---|:---|:---|:---|
| **理科实验过程** | 电解水、酸碱中和 | 实验步骤动画 | 10-20 秒 |
| **地理变化过程** | 板块漂移、冰川消融、四季更替 | 地球科学动画 | 15-30 秒 |
| **生物生命过程** | 细胞分裂、种子萌发、心脏跳动 | 生物过程动画 | 10-20 秒 |
| **历史演变** | 领土变迁、城市发展 | 时间推移动画 | 15-30 秒 |
| **数学动态变化** | 函数图像变化、几何变换 | 参数动画 | 10-15 秒 |

**执行策略**：
1. **🥇 首选 CSS/JS/Canvas/SVG 交互动画**：对于参数可调的过程（函数图像变化、简单物理模拟、几何变换等），直接在 HTML 课件中用交互组件实现，学生可拖拽参数、点击触发、实时观察变化
2. **🥈 次选 Remotion 生成视频（L2）**：如果 Generation Gate 标注 L2="需要"，且内容为多步骤连续过程（如细胞分裂全过程），通过 Remotion 生成教学动画
3. **🥉 保底 `<video>` 嵌入**：真实实验录像、外部视频素材等交互无法覆盖的内容，使用 `<video>` 标签嵌入

**视频嵌入规范**（⚠️ 硬规则，详见 10.2.4）：

> 视频**必须嵌入到对应知识模块的 section 内部**。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化；仅当交互无法覆盖时，使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签静态嵌入，外包 `.video-player` 容器。**禁止**仅用 JS 动态创建视频元素。

```html
<!-- AI 生成的教学短视频 — 必须嵌入到对应知识模块的 section 内部 -->
<!-- ⚠️ 优先用 CSS/JS/Canvas/SVG 交互动画代替静态视频 -->
<div class="video-player" data-context="物理·电解水·实验过程">
  <video controls preload="metadata" playsinline width="100%">
    <source src="./assets/experiment-demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</div>
<p class="video-caption">🎬 电解水实验过程演示</p>
```

### 10.5 WorkBuddy 多 Agent 协作流水线

> ⚠️ **本节定义 AI 在生成课件时如何利用 `task` 工具调用多个 subagent 并行协作，大幅提升课件质量和生成效率。**
>
> **适用环境**：WorkBuddy / CodeBuddy 等支持 `task` 工具的 AI 编程助手。如果运行环境不支持 `task` 工具，AI 应退回到单线程串行生成模式。

#### 协作架构

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    TeachAny 多 Agent 协作流水线                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    Phase 0-2    ┌────────────────────────────────┐ │
│  │ 主 Agent     │──────────────→│ 完成教学设计（6问+骨架+Gate）    │ │
│  │ (Orchestrator)│               └────────────────────────────────┘ │
│  └──────┬──────┘                                                   │
│         │ Phase 3：并行分发任务                                      │
│         ├──────────────────┬──────────────────┬───────────────────┐ │
│         ▼                  ▼                  ▼                   ▼ │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ Agent A      │  │ Agent B       │  │ Agent C       │  │Agent D │ │
│  │ 中文课件     │  │ 英文课件(可选)│  │ 插图生成      │  │ TTS    │ │
│  │ index.html   │  │ index_en.html │  │ image_gen ×N  │  │ 语音   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘ │
│         │                │                  │               │      │
│         └────────────────┴──────────────────┴───────────────┘      │
│                                    │                                │
│                          ┌────────▼────────┐                       │
│                          │ 主 Agent 汇总    │                       │
│                          │ Completeness Gate│                       │
│                          │ + 打包           │                       │
│                          └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Agent 角色分工表

| Agent | 职责 | 输入 | 输出 | 触发条件 |
|:---|:---|:---|:---|:---|
| **主 Agent（Orchestrator）** | Phase 0-2 教学设计 + Generation Gate + 最终审查 | 用户需求 + 知识图谱数据 | 教学骨架 JSON（含 ABT、问题链、练习设计等） | 始终执行 |
| **Agent A：中文课件** | 生成 `index.html` | 教学骨架 + HTML 骨架模板 + 学段 CSS | 完整中文课件 HTML | 始终执行 |
| **Agent B：英文课件** | 生成 `index_en.html` | 教学骨架 + HTML 骨架模板 + 学段 CSS | 完整英文课件 HTML | 用户明确要求双语时执行（默认跳过） |
| **Agent C：插图生成** | 调用 `image_gen` 生成课件配图 | ABT 场景描述 + 生图 prompt 列表 | `assets/*.png` 图片文件 | 文科课件或 Gate 标注"需要插图" |
| **Agent D：TTS 语音** | 安装 edge-tts + 生成语音 + 字幕 | 旁白脚本 JSON | `tts/*.mp3` + `*.srt` | 默认执行（用户拒绝时跳过） |
| **Agent E：质量审查**（可选） | 对 Agent A/B 产出的 HTML 做 Completeness Gate 审查 | 课件 HTML + 审查清单 | 审查报告 + 修复建议 | 环境支持 ≥ 5 并行 Agent 时 |

#### 执行流程（标准模式）

```text
Step 1：主 Agent 完成 Phase 0 → 0.5 → 1 → 2 → Generation Gate
        输出：教学骨架文档（包含 ABT 设计、问题链、练习题、旁白文案、生图 prompt 列表）

Step 2：主 Agent 并行调用 task 工具分发任务
        ├── task(Agent A): "根据以下教学骨架和 HTML 骨架模板（10.2.1）生成中文课件 index.html..."
        ├── task(Agent B): "将以下中文教学骨架翻译为英文，生成 index_en.html..."  ← 仅用户要求双语时分发
        ├── task(Agent C): "为以下课件生成 N 张插图，prompt 列表如下..."
        └── task(Agent D): "根据以下旁白脚本，安装 edge-tts 并生成 TTS 语音和字幕..."

Step 3：主 Agent 收集所有 Agent 输出
        ├── 将 Agent C 的插图路径更新到 Agent A/B 的 HTML 中
        ├── 将 Agent D 的音频路径嵌入 HTML 的 <audio> 标签
        └── 执行 Completeness Gate 审查

Step 4：主 Agent 执行打包（Phase 3.5）并交付
```

#### task 调用 prompt 模板

**Agent A（中文课件）调用模板**：
```
你是 TeachAny 课件开发 Agent。请根据以下教学骨架，使用 HTML 骨架模板生成完整的中文互动课件 index.html。

【教学骨架】
{Generation Gate 输出的完整骨架}

【强制规则】
1. 必须使用 Section 10.2.1 的 HTML 骨架模板
2. CSS 变量使用 {学段} 模板配色
3. 必选 section 不可删除：Hero、学习目标、前测、知识模块×{N}、综合任务、后测、小结、**知识图谱**
4. 每个模块遵循 6 块结构（ABT→讲解→深层理解→练习→纠错→小结）
5. 插图位置用 <img src="./assets/placeholder-{N}.png" alt="..."> 占位（Agent C 会生成实际图片）
6. 音频：注入 audioPlaylist 数组（每个条目含 sectionId 对应 HTML 中 section 的 id），骨架内置的音频引擎会自动实现滚动播放+底部控制条
7. 视频：优先使用 CSS/JS/Canvas/SVG 交互动画演示过程性变化；仅交互无法覆盖时用 <video controls preload="metadata" playsinline> 标签嵌入（见 10.2.4）。视频必须嵌入到对应模块 section 内部
8. 知识图谱：在 <script> 最前面注入 knowledgeGraphData 对象（见 10.2.3），数据从教学骨架中的 prerequisites/leads_to 提取

请生成完整的 index.html 文件。
```

**Agent C（插图生成）调用模板**：
```
你是 TeachAny 插图生成 Agent。请为以下课件生成配图。

【生图任务列表】
1. 文件名: hero-scene.png | prompt: "{ABT 情境描述}" | size: 1024x1024 | quality: medium
2. 文件名: module1-intro.png | prompt: "{模块1情境描述}" | size: 1024x1024 | quality: medium
...

请依次调用 image_gen 工具生成每张图片，保存到 {课件目录}/assets/ 下。
```

#### 降级策略

| 环境能力 | 策略 |
|:---|:---|
| 支持 `task` 工具 + 支持 `image_gen` | 完整多 Agent 协作（A+B+C+D 并行） |
| 支持 `task` 工具，不支持 `image_gen` | A+B+D 并行，C 降级为占位符 |
| 不支持 `task` 工具 | 单 Agent 串行模式（按 Phase 顺序执行），在 Generation Gate 中标注"单 Agent 模式" |

**单 Agent 串行模式的执行顺序**：
```text
中文课件 → 英文课件 → 插图生成（如支持） → TTS 语音 → Completeness Gate → 打包
```

---

