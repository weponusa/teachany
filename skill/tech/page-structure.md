# 互动网页标准结构

> **所属**：TeachAny 技能 · 卫星文档
> **触发时机**：Phase 3 编写 HTML 主体时
> **主文档**：[../SKILL_CN.md](../SKILL_CN.md)
>
> 本文件从 SKILL_CN.md 主文拆出，按需加载以避免上下文爆炸。

---

### 10.2 互动网页标准结构

```text
Hero 区（Hero 知识结构图 + 课题名称 + 学科/年级/课型标签）
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
  <!-- ⭐ v7.9.4 标准五件套样式（公共资源，打包时复制到课件本地） -->
  <link rel="stylesheet" href="../../scripts/ai-tutor.css">
  <link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">
  <link rel="stylesheet" href="../../scripts/teachany-tts-narrator.css">
  <link rel="stylesheet" href="../../scripts/teachany-audio-player.css">
  <link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">
  <link rel="stylesheet" href="../../scripts/teachany-section-hints.css">
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
    .hero-img {
      width: 100%; max-width: 700px; border-radius: 16px; margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .hero-cover-img {
      width: 100%; max-height: 320px; object-fit: cover;
      border-radius: 0 0 18px 18px; display: block; margin-top: 0;
    }
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

    /* ═══ 12. 音频播放器 ═══ */
    /* ⛔ v7.9.4 废弃：手写 .audio-bar CSS 已废弃，必须用标准模块 teachany-audio-player.css */
    /* 新课件只需引入标准模块 CSS/JS，无需手写任何样式 */

    /* ═══ 13. 知识图谱 ═══ */
    /* ⛔ v7.9.4 废弃：手写知识图谱 CSS 已废弃，必须用标准模块 teachany-knowledge-graph.css */
    /* 新课件只需引入标准模块 CSS/JS，无需手写任何样式 */
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
    <!-- ⭐ v6.9 强制：Hero 知识结构图（一一对应，精确匹配否则留空，见 Section 10.4） -->
    <img src="./assets/hero/【节点ID】-hero.png" class="hero-img" alt="【课题名称】知识结构图">
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

    <!-- ⛔ 6 块 + 6 法强制结构，每个模块必须包含 -->

    <!-- ① ABT 叙事引入（And-But-Therefore） ⛔ MANDATORY -->
    <!-- And: 我们已经知道___  But: 但是___  Therefore: 因此本模块要___ -->
    <div class="card abt-intro">
      <!-- 情境模式：角色任务/故事冲突/生活现象/文化传承 -->
      <!-- 认知负荷：引入文字 ≤ 75 字，一个核心问题 -->
    </div>

    <!-- ② 核心讲解（含 Mayer 原则） ⛔ MANDATORY -->
    <div class="card core-explain">
      <!-- 梅耶尔-临近原则：图文紧贴放置 -->
      <!-- 梅耶尔-信号原则：关键术语 <strong> 高亮 -->
      <!-- 梅耶尔-分割原则：长概念拆为多张卡片 -->
      <!-- 梅耶尔-预训练原则：复杂概念前先预览关键术语 -->
      <!-- 认知负荷：每卡 ≤ 75 字 -->
    </div>

    <!-- ③ 深层理解 + 脚手架递进 ⛔ MANDATORY -->
    <div class="card deep-understanding">
      <!-- 脚手架等级：data-scaffold="full" → "partial" → "none" -->
      <!-- 全支架：完整 worked example -->
      <!-- 半支架：部分提示，学生填空 -->
      <!-- 无支架：独立完成 -->
    </div>

    <!-- ④ 立刻练习（Bloom 分级 + ConcepTest） ⛔ MANDATORY -->
    <div class="card practice">
      <!-- Bloom 层级标注：data-bloom-level="remember|understand|apply|analyze|evaluate|create" -->
      <!-- 至少覆盖 3 个 Bloom 层级 -->
    </div>

    <!-- ⑤ ConcepTest 概念测试检查点（Mazur 同伴教学） ⛔ 每 2 个模块至少 1 次 -->
    <div class="card conceptest" data-conceptest="true">
      <!-- 概念问题 → 独立作答 → 正确率判断（30-70%触发讨论） → 同伴讨论 → 再答 -->
      <!-- 干扰项来源：_errors.json 的 trigger/diagnosis -->
    </div>

    <!-- ⑥ 纠错反馈（诊断性） ⛔ MANDATORY -->
    <div class="card error-feedback">
      <!-- 使用 _errors.json 的 diagnosis 数据，不能只说"正确/错误" -->
    </div>

    <!-- ⑦ 小结迁移 ⛔ MANDATORY -->
    <div class="card summary-transfer">
      <!-- 本模块要点回顾 + 迁移到下一模块的桥接 -->
    </div>
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
    // ⭐ v5.34 强制：AI 学伴配置（必须在 ai-tutor.js 加载前定义）
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

    // ═══ 知识图谱渲染 ═══
    // ⛔ v7.9.4 废弃：手写知识图谱渲染代码已废弃，必须用标准模块
    // 新课件只需：<div data-teachany-kg="<node_id>"> + 引入 teachany-knowledge-graph.js
    // 以下旧代码仅存档，禁止在新生成的课件中使用
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

    // ═══ 音频播放器 ═══
    // ⛔ v7.9.4 废弃：手写 initAudioPlayer() 已废弃，必须用标准模块 teachany-audio-player.js
    // 新课件只需：<div data-teachany-audio> + JSON playlist + 引入 teachany-audio-player.js
  </script>
  <!-- ⭐ v7.9.4 标准五件套脚本（公共资源，打包时复制到课件本地） -->
  <script src="../../scripts/ai-tutor.js" defer></script>
  <script src="../../scripts/teachany-tutor-card.js" defer></script>
  <script src="../../scripts/teachany-tts-narrator.js" defer></script>
  <script src="../../scripts/teachany-audio-player.js" defer></script>
  <script src="../../scripts/teachany-knowledge-graph.js" defer></script>
  <script src="../../scripts/teachany-section-hints.js" defer></script>
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
| **音频播放器** | ⛔ v7.9.4 统一技术路线：音频播放器必须且只能用 `teachany-audio-player.js` 标准模块。在课件中写 `<div data-teachany-audio><script type="application/json" data-teachany-audio-playlist>[{...}]</script></div>`。⛔ 严禁手写 `.audio-bar` / `initAudioPlayer()` / `audioPlaylist` 内联代码 |
| **视频播放器** | 视频**必须嵌入到对应知识模块的 section 内部**（而非集中放置），使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签嵌入，外包 `.video-player` 容器 + `.video-caption` 说明。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化，仅当交互无法覆盖时才用 `<video>` 嵌入静态视频。**禁止**仅用 JS 动态创建视频元素 |
| **知识图谱** | ⛔ v7.9.4 统一技术路线：知识图谱必须且只能用 `teachany-knowledge-graph.js` 标准模块。在 `<section id="knowledge-graph">` 内写 `<div data-teachany-kg="<node_id>">`。⛔ 严禁手写 `knowledgeGraphData` / SVG / d3 / ECharts |
| **AI 生成的插图** | 使用 `image_gen` 生成后，以 `<img src="./assets/illustrations/xxx.png">` 嵌入；Hero 图以 `<img src="./assets/hero/{node_id}-hero.png">` 嵌入（详见 10.4.1） |

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
3. 查询 `data/trees/**/*.json`（递归扫描所有子目录）中的 `status` 字段判断 `hasCourseware`：仅 `status: "active"` 且 `courses` 非空的节点为 `true`

**数据注入格式**：

> ⛔ **v7.9.4 废弃：以下手写 `knowledgeGraphData` 方式已废弃，严禁使用。** 知识图谱必须且只能通过 `scripts/teachany-knowledge-graph.{css,js}` 标准模块渲染。AI 只需在 HTML 中写声明式标记 `<div data-teachany-kg="<node_id>">` 并引入模块 CSS/JS，无需手写任何数据对象。详见 SKILL_CN.md 基线⑦ 和 RULES.md #24。
>
> 以下旧代码仅作存档参考，**禁止在新生成的课件中使用**：

~~AI 在生成课件时，必须在 `<script>` 标签**最前面**（骨架 JS 之前）注入以下数据对象~~（已废弃）：

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
    <source src="./assets/video/experiment-demo.mp4" type="video/mp4">
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

**Remotion 生成的视频**：L2 渲染完成后，将 `out/*.mp4` 复制到课件的 `assets/video/` 目录，然后在 HTML 中用上述模板嵌入。

#### 10.2.5 音频播放器规范（L3 强制，v7.9.4 统一为标准模块）

> ⛔ **v7.9.4 统一技术路线**：音频播放器必须且只能通过 `scripts/teachany-audio-player.{css,js}` 标准模块渲染。⛔ **严禁在课件 HTML 中手写内联 `.audio-bar` / `initAudioPlayer()` / `audioPlaylist` 代码**——这直接违反 RULES.md #61。
>
> 以下旧代码仅作存档参考，**禁止在新生成的课件中使用**。

**唯一标准调用方式（禁止偏离）**：

1. `<head>` 引入：`<link rel="stylesheet" href="../../scripts/teachany-audio-player.css">`
2. `<section>` 内（或 body 末尾）写声明式标记：
```html
<div data-teachany-audio>
  <script type="application/json" data-teachany-audio-playlist>
  [
    {"id":"seg01","sectionId":"module-1","title":"模块1：一次函数的定义","src":"./tts/seg01_zh.mp3"},
    {"id":"seg02","sectionId":"module-2","title":"模块2：函数图像的画法","src":"./tts/seg02_zh.mp3"}
  ]
  </script>
</div>
```
3. `</body>` 前：`<script src="../../scripts/teachany-audio-player.js" defer>`

模块自动渲染：曲目卡片列表 + 底部悬浮播放条 + IntersectionObserver 滚动同步 + 自动连播。

**TTS 悬浮朗读播放器**（零 mp3 回退模式）：

课件还须引入 `scripts/teachany-tts-narrator.{css,js}`，对标注了 `<p data-tts>` 的段落自动生成浏览器原生朗读控制。⛔ 严禁在课件中手写 `speechSynthesis` 代码块。

~~以下旧代码仅存档，禁止在新生成的课件中使用~~：

<details>
<summary>旧版手写 audioPlaylist + initAudioPlayer()（已废弃）</summary>

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

</details>

#### 10.2.6 AI 学伴规范（v7.9.4 统一为标准模块）

> ⛔ **v7.9.4 统一技术路线**：AI 学伴必须同时引入 `scripts/ai-tutor.{css,js}`（FAB 悬浮球 + 对话面板）和 `scripts/teachany-tutor-card.{css,js}`（可见入口卡片）。⛔ **严禁只引入 ai-tutor.js 不放 tutor-card 卡片**——学生在长页面下看不到右下角 FAB。
>
> 以下旧代码仅作存档参考，**禁止在新生成的课件中使用**。

**唯一标准调用方式（禁止偏离）**：

1. `<head>` 引入：
   - `<link rel="stylesheet" href="../../scripts/ai-tutor.css">`
   - `<link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">`
2. 课件正文（推荐放在"小结"或"前测"区附近）写一行：
   ```html
   <div data-teachany-tutor-card></div>
   ```
3. `</body>` 前：
   - `<script src="../../scripts/ai-tutor.js" defer></script>`
   - `<script src="../../scripts/teachany-tutor-card.js" defer></script>`
4. 配置注入（`<script>` 最前面）：
   ```javascript
   window.__TEACHANY_TUTOR_CONFIG__ = {
     courseTitle: '【课件标题】',
     subject: 'math',
     grade: 9,
     learningObjectives: ['目标1', '目标2'],
     getContext: () => {
       const current = document.querySelector('section.current-section') ||
                       document.querySelector('section:target') ||
                       document.querySelector('section');
       return current?.innerText?.slice(0, 3000) || '';
     }
   };
   ```

模块自动渲染：右下角 FAB 悬浮球 + 可见入口卡片（标题、简介、4个建议提问按钮）。点击任一处唤起对话面板。

~~以下旧代码仅存档，禁止在新生成的课件中使用~~：

<details>
<summary>旧版 AI 学伴详细实现规范（已废弃）</summary>

**架构与分层**：

```
┌─ 屏幕右下角 ──────────────────────────────────────┐
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
┌─ 对话面板（360 × 520 px，右下角停驻） ────────────┐
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

1. **FAB 渲染**：`DOMContentLoaded` 后在 `<body>` 末尾注入 `<div class="ai-tutor-fab">💡</div>` + `<div class="ai-tutor-panel">...</div>`；右下距离 24px / 底部 24px，`z-index: 9998`（高于音频控制条 `audio-bar`）
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
   - 面板可被关闭按钮收回、再次点击 FAB 恢复。

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

</details>
- ❌ 不提供"清空对话"和"修改 Key"的入口

