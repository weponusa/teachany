/*! TeachAny Standard Knowledge Graph Module · v2.0
 * --------------------------------------------------
 *  <link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">
 *  <div data-teachany-kg="chn-e-compound-vowel">
 *    <canvas class="tkg-fallback-canvas" width="720" height="120"></canvas>
 *  </div>
 *  <script src="../../scripts/teachany-knowledge-graph.js" defer></script>
 *
 *  视觉风格：完全对齐 tree.html 的知识地图
 *  交互：hover 放大 + tooltip；有课件节点点击跳课件，无课件虚线框
 */
(function () {
  "use strict";
  if (window.TeachAnyKnowledgeGraph && window.TeachAnyKnowledgeGraph.__initialized) return;

  var SVG_NS = "http://www.w3.org/2000/svg";
  var BASE_PATH_CANDIDATES = [
    "../../scripts/teachany-kg-manifest.json",
    "../scripts/teachany-kg-manifest.json",
    "scripts/teachany-kg-manifest.json",
    "/teachany/scripts/teachany-kg-manifest.json",
    "/scripts/teachany-kg-manifest.json"
  ];

  var manifestPromise = null;
  function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (function tryNext(list) {
      if (!list.length) return Promise.reject(new Error("manifest-not-found"));
      return fetch(list[0], { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error("not-ok"); return r.json(); })
        .catch(function () { return tryNext(list.slice(1)); });
    })(BASE_PATH_CANDIDATES.slice());
    return manifestPromise;
  }

  function hexToRgba(hex, alpha) {
    if (!hex) return "rgba(59,130,246," + alpha + ")";
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var r = parseInt(h.substr(0, 2), 16) || 59;
    var g = parseInt(h.substr(2, 2), 16) || 130;
    var b = parseInt(h.substr(4, 2), 16) || 246;
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function coursewareUrl(course) {
    if (!course || !course.path) return null;
    var m = course.path.match(/^examples\/(.+)$/);
    if (!m) return course.path;
    return "../" + m[1] + "/index.html";
  }

  function hasCourse(node) {
    return node && node.courses && node.courses.length > 0;
  }

  function h(tag, attrs, children) {
    var svgTags = ["svg", "g", "circle", "line", "text", "path", "defs", "marker", "polygon", "rect"];
    var el = svgTags.indexOf(tag) >= 0 ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") el.setAttribute("class", attrs[k]);
        else if (k === "html") el.innerHTML = attrs[k];
        else if (k === "text") el.textContent = attrs[k];
        else if (k === "on" && attrs[k]) {
          Object.keys(attrs[k]).forEach(function (ev) { el.addEventListener(ev, attrs[k][ev]); });
        } else if (attrs[k] !== null && attrs[k] !== undefined) {
          el.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  /* ─── 数据准备：中心节点 + 前序 + 后续 + 同域 + 边 ─── */
  function buildNeighborhood(manifest, centerId) {
    var nodes = manifest.nodes || {};
    var center = nodes[centerId];
    if (!center) return null;
    var picked = new Map();
    function push(id, layer) {
      if (!id || !nodes[id] || picked.has(id)) return;
      var n = nodes[id];
      picked.set(id, Object.assign({}, n, { _layer: layer }));
    }
    push(centerId, "self");
    (center.prerequisites || []).forEach(function (id) { push(id, "prereq"); });
    (center.next || []).forEach(function (id) { push(id, "next"); });
    (center.extends || []).forEach(function (id) { push(id, "extend"); });
    (center.siblings || []).slice(0, 6).forEach(function (id) { push(id, "sibling"); });

    var arr = Array.from(picked.values());
    var links = [];
    arr.forEach(function (n) {
      (n.prerequisites || []).forEach(function (pid) {
        if (picked.has(pid)) {
          var tgtLayer = n._layer;
          var type = tgtLayer === "self" || tgtLayer === "next" ? "prereq" : "prereq";
          if (n._layer === "self") type = "prereq";
          else if (n._layer === "next") type = "next";
          links.push({ source: pid, target: n.id, type: type });
        }
      });
    });
    // center <-> siblings
    arr.forEach(function (n) {
      if (n._layer === "sibling") links.push({ source: centerId, target: n.id, type: "sibling" });
      if (n._layer === "extend") links.push({ source: centerId, target: n.id, type: "extend" });
    });
    return { center: center, nodes: arr, links: links };
  }

  /* ─── 布局：轻量力导向 ─── */
  function forceLayout(nodes, links, width, height) {
    var padding = 70;
    nodes.forEach(function (n, i) {
      if (n._layer === "self") {
        n.x = width / 2; n.y = height / 2; n.fx = true;
      } else {
        var angle = (i / Math.max(1, nodes.length - 1)) * Math.PI * 2;
        var r = Math.min(width, height) * 0.34;
        n.x = width / 2 + r * Math.cos(angle);
        n.y = height / 2 + r * Math.sin(angle);
      }
      n.vx = 0; n.vy = 0;
    });
    var idx = new Map(nodes.map(function (n) { return [n.id, n]; }));
    var linkObjs = links.map(function (l) { return { s: idx.get(l.source), t: idx.get(l.target), type: l.type }; }).filter(function (l) { return l.s && l.t; });
    var idealLen = Math.min(width, height) * 0.24;
    for (var k = 0; k < 240; k++) {
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var force = 2800 / (dist * dist);
          var fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      linkObjs.forEach(function (l) {
        var dx = l.t.x - l.s.x, dy = l.t.y - l.s.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var force = (dist - idealLen) * 0.08;
        var fx = (dx / dist) * force, fy = (dy / dist) * force;
        if (!l.s.fx) { l.s.vx += fx; l.s.vy += fy; }
        if (!l.t.fx) { l.t.vx -= fx; l.t.vy -= fy; }
      });
      nodes.forEach(function (n) {
        if (n.fx) return;
        n.vx += (width / 2 - n.x) * 0.012;
        n.vy += (height / 2 - n.y) * 0.012;
      });
      nodes.forEach(function (n) {
        if (n.fx) { n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.78; n.vy *= 0.78;
        n.x += n.vx; n.y += n.vy;
        if (n.x < padding) { n.x = padding; n.vx *= -0.4; }
        if (n.x > width - padding) { n.x = width - padding; n.vx *= -0.4; }
        if (n.y < padding) { n.y = padding; n.vy *= -0.4; }
        if (n.y > height - padding) { n.y = height - padding; n.vy *= -0.4; }
      });
    }
  }

  /* ─── 绘制 SVG 图谱 ─── */
  function renderGraph(svg, graph, handlers) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var bb = svg.getBoundingClientRect();
    var width = bb.width || 600;
    var height = bb.height || 400;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    forceLayout(graph.nodes, graph.links, width, height);

    // Arrow markers
    var defs = h("defs");
    [
      { id: "tkg-arrow-prereq", color: "rgba(148,163,184,0.6)" },
      { id: "tkg-arrow-next", color: "rgba(59,130,246,0.7)" },
      { id: "tkg-arrow-sibling", color: "rgba(245,158,11,0.55)" },
      { id: "tkg-arrow-extend", color: "rgba(139,92,246,0.6)" }
    ].forEach(function (m) {
      defs.appendChild(h("marker", {
        id: m.id, viewBox: "0 -5 10 10", refX: 28, refY: 0,
        markerWidth: 6, markerHeight: 6, orient: "auto"
      }, [h("path", { d: "M0,-5L10,0L0,5", fill: m.color })]));
    });
    svg.appendChild(defs);

    // Links
    var linkGroup = h("g", { class: "tkg-links" });
    graph.links.forEach(function (l) {
      var src = graph.nodes.find(function (n) { return n.id === l.source; });
      var tgt = graph.nodes.find(function (n) { return n.id === l.target; });
      if (!src || !tgt) return;
      var line = h("line", {
        class: "tkg-link link-" + l.type,
        x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y,
        "marker-end": "url(#tkg-arrow-" + l.type + ")"
      });
      line.__data = l;
      linkGroup.appendChild(line);
    });
    svg.appendChild(linkGroup);

    // Nodes (tree.html 风格)
    var nodeGroup = h("g", { class: "tkg-nodes" });
    graph.nodes.forEach(function (n) {
      var hasCrs = hasCourse(n);
      var isSelf = n._layer === "self";
      var radius = hasCrs ? 24 : 20;
      if (isSelf) radius = 30;
      var domainColor = n.domain_color || "#3b82f6";
      var fill, stroke, dash;
      if (isSelf) {
        fill = hexToRgba(domainColor, 0.35);
        stroke = domainColor;
        dash = "none";
      } else if (hasCrs) {
        fill = hexToRgba(domainColor, 0.22);
        stroke = domainColor;
        dash = "none";
      } else {
        fill = hexToRgba(domainColor, 0.05);
        stroke = hexToRgba(domainColor, 0.55);
        dash = "4 3";
      }
      var g = h("g", {
        class: "tkg-node-group" + (hasCrs || isSelf ? "" : " no-course"),
        transform: "translate(" + n.x + "," + n.y + ")",
        "data-id": n.id,
        "data-has-course": hasCrs ? "1" : "0",
        on: {
          click: function (ev) {
            ev.stopPropagation();
            handlers.onNodeClick && handlers.onNodeClick(n, ev);
          },
          mouseenter: function (ev) { handlers.onHover && handlers.onHover(n, ev); },
          mousemove: function (ev) { handlers.onMove && handlers.onMove(n, ev); },
          mouseleave: function (ev) { handlers.onLeave && handlers.onLeave(n, ev); }
        }
      });
      g.appendChild(h("circle", {
        class: "tkg-node-circle",
        r: radius,
        fill: fill,
        stroke: stroke,
        "stroke-dasharray": dash
      }));
      // Status icon
      var icon = "📝";
      if (isSelf) icon = "🎯";
      else if (hasCrs) icon = "✅";
      g.appendChild(h("text", {
        class: "tkg-node-status-icon",
        dy: "0.35em",
        text: icon
      }));
      // Chinese label
      g.appendChild(h("text", {
        class: "tkg-node-label",
        dy: radius + 14,
        text: (n.name || n.id).slice(0, 10)
      }));
      // English label
      if (n.name_en) {
        g.appendChild(h("text", {
          class: "tkg-node-label-en",
          dy: radius + 28,
          text: n.name_en.slice(0, 18)
        }));
      }
      // Grade
      if (n.grade) {
        var gradeText = n.stage === "elementary"
          ? "小" + n.grade
          : n.stage === "middle"
            ? "初" + (n.grade - 6)
            : n.stage === "high"
              ? "高" + (n.grade - 9)
              : "G" + n.grade;
        g.appendChild(h("text", {
          class: "tkg-node-grade",
          dy: radius + (n.name_en ? 42 : 28),
          text: gradeText
        }));
      }
      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);
  }

  /* ─── Tooltip ─── */
  function buildTooltipContent(node) {
    var hasCrs = hasCourse(node);
    var stage = node.stage === "elementary" ? "小学" : node.stage === "middle" ? "初中" : node.stage === "high" ? "高中" : (node.stage || "");
    var gradeTxt = node.grade ? "G" + node.grade : "";
    var meta = [stage + gradeTxt, node.domain].filter(Boolean).join(" · ");
    var html = '<h3>' + (node.name || node.id) + (node.name_en ? ' <small style="font-size:12px;opacity:0.6;font-weight:400">' + node.name_en + '</small>' : '') + '</h3>';
    html += '<div class="meta">' + meta + '</div>';
    if (hasCrs) {
      html += '<span class="status-badge badge-active">✅ 已有课件</span>';
    } else {
      html += '<span class="status-badge badge-gap">📝 暂无课件</span>';
    }
    if ((node.prerequisites || []).length) {
      html += '<div style="margin-top:10px;font-size:12px;color:rgba(148,163,184,0.9)">前置：' + node.prerequisites.slice(0, 3).join('、') + '</div>';
    }
    if ((node.curriculum_points || []).length) {
      html += '<div style="margin-top:8px;font-size:12px;line-height:1.55;color:rgba(226,232,240,0.85)">' + (node.curriculum_points[0] || "").slice(0, 80) + '</div>';
    }
    if (hasCrs && node.courses && node.courses[0]) {
      var url = coursewareUrl(node.courses[0]);
      if (url) {
        html += '<a class="course-link" href="' + url + '" target="_top">🚀 打开课件：' + (node.courses[0].name || node.courses[0].id) + '</a>';
      }
    } else {
      html += '<div class="gap-msg">该知识点暂无官方课件，欢迎贡献社区版本。</div>';
    }
    return html;
  }

  function positionTooltip(tooltip, root, event) {
    var rootRect = root.getBoundingClientRect();
    var x = event.clientX - rootRect.left + 18;
    var y = event.clientY - rootRect.top + 18;
    var tw = tooltip.offsetWidth;
    var th = tooltip.offsetHeight;
    if (x + tw > rootRect.width) x = event.clientX - rootRect.left - tw - 12;
    if (y + th > rootRect.height) y = rootRect.height - th - 12;
    if (y < 8) y = 8;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }

  /* ─── 详情面板（右侧） ─── */
  function renderDetailPanel(panel, nodeId, manifest, rootEl) {
    var nodes = manifest.nodes;
    var node = nodes[nodeId];
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    if (!node) { panel.appendChild(h("div", { class: "tkg-empty", text: "找不到节点 " + nodeId })); return; }
    var hasCrs = hasCourse(node);
    var stage = node.stage === "elementary" ? "小学" : node.stage === "middle" ? "初中" : node.stage === "high" ? "高中" : (node.stage || "");
    panel.appendChild(h("div", null, [
      h("h3", { text: node.name || node.id }),
      h("div", { class: "meta", text: [stage, node.grade ? "G" + node.grade : "", node.domain].filter(Boolean).join(" · ") })
    ]));
    panel.appendChild(h("div", {
      class: "status-badge " + (hasCrs ? "badge-active" : "badge-gap"),
      text: hasCrs ? "✅ 已有课件" : "📝 暂无课件",
      style: "display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;background:" + (hasCrs ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.18)") + ";color:" + (hasCrs ? "var(--tkg-success)" : "var(--tkg-danger)") + ";"
    }));

    var tagsWrap = h("div", { class: "tkg-tags" });
    function addTag(id, layer) {
      var target = nodes[id];
      if (!target) return;
      var tgtHasCourse = hasCourse(target);
      var tag = h("a", {
        class: "tkg-tag layer-" + layer + (tgtHasCourse ? " has-course" : " no-course"),
        href: tgtHasCourse && target.courses[0] ? coursewareUrl(target.courses[0]) : "#",
        target: tgtHasCourse ? "_top" : undefined,
        text: target.name || target.id,
        on: {
          click: function (ev) {
            if (!tgtHasCourse) { ev.preventDefault(); }
            rootEl.dispatchEvent(new CustomEvent("tkg:focus", { detail: id }));
          }
        }
      });
      tagsWrap.appendChild(tag);
    }
    (node.prerequisites || []).forEach(function (id) { addTag(id, "prereq"); });
    (node.next || []).forEach(function (id) { addTag(id, "next"); });
    (node.extends || []).forEach(function (id) { addTag(id, "extend"); });
    (node.siblings || []).slice(0, 6).forEach(function (id) { addTag(id, "sibling"); });
    if (tagsWrap.children.length) {
      panel.appendChild(h("div", { class: "meta", text: "前序 / 后续 / 同域（📚 = 已有课件）" }));
      panel.appendChild(tagsWrap);
    }

    if ((node.curriculum_points || []).length) {
      panel.appendChild(h("div", { class: "meta", text: "课标要点" }));
      var ul = h("ul");
      node.curriculum_points.slice(0, 3).forEach(function (t) { ul.appendChild(h("li", { text: t })); });
      panel.appendChild(ul);
    }
    if (node.textbook_chapter) panel.appendChild(h("div", { class: "meta", text: "教材：" + node.textbook_chapter }));

    if ((node.courses || []).length) {
      panel.appendChild(h("div", { class: "meta", text: "可跳转课件" }));
      var list = h("div", { class: "tkg-panel-links" });
      node.courses.slice(0, 3).forEach(function (c) {
        var url = coursewareUrl(c);
        if (!url) return;
        list.appendChild(h("a", {
          class: "tkg-link-card", href: url, target: "_top",
          html: "<div><strong>" + (c.name || c.id) + "</strong><br><em>" + (c.source || "") + "</em></div><span>→</span>"
        }));
      });
      if (list.children.length) panel.appendChild(list);
    }
  }

  /* ─── 筛选 / 搜索 ─── */
  function applyFilter(root, filter) {
    var svg = root.querySelector(".tkg-canvas svg");
    if (!svg) return;
    svg.querySelectorAll(".tkg-node-group").forEach(function (g) {
      var layer = (g.getAttribute("class") || "").split(/\s+/).find(function (c) { return c.indexOf("layer-") === 0; }) || "";
      // self always shown
      var isSelf = g.querySelector(".tkg-node-status-icon") && g.querySelector(".tkg-node-status-icon").textContent === "🎯";
      var show = filter === "all" || isSelf;
      svg.querySelectorAll(".tkg-link").forEach(function (line) {
        var t = (line.getAttribute("class") || "").split(/\s+/).find(function (c) { return c.indexOf("link-") === 0 && c !== "tkg-link"; }) || "";
        var lk = t.replace("link-", "");
        line.classList.toggle("dim", !(filter === "all" || lk === filter));
      });
    });
    // Since we don't tag node-group with layer class, we re-compute by position reference.
    var nodes = svg.__graphNodes || [];
    nodes.forEach(function (n) {
      var g = svg.querySelector('.tkg-node-group[data-id="' + n.id + '"]');
      if (!g) return;
      var show = filter === "all" || n._layer === "self" || n._layer === filter;
      g.classList.toggle("dim", !show);
    });
  }

  function renderSearch(manifest, input, resultBox, root) {
    var nodes = manifest.nodes;
    function search(q) {
      q = (q || "").trim().toLowerCase();
      while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
      if (!q) return;
      var matches = [];
      Object.keys(nodes).forEach(function (id) {
        var n = nodes[id];
        var hay = (n.name || "") + " " + id + " " + (n.name_en || "");
        if (hay.toLowerCase().indexOf(q) !== -1) matches.push(n);
      });
      matches.slice(0, 6).forEach(function (n) {
        resultBox.appendChild(h("a", {
          class: "tkg-link-card", href: "#",
          html: "<div><strong>" + (n.name || n.id) + "</strong><br><em>" + (n.domain || "") + " · " + (n.stage || "") + (hasCourse(n) ? " · 📚" : "") + "</em></div><span>聚焦 →</span>",
          on: {
            click: function (ev) {
              ev.preventDefault();
              root.dispatchEvent(new CustomEvent("tkg:focus", { detail: n.id }));
              input.value = "";
              while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
            }
          }
        }));
      });
      if (!matches.length) resultBox.appendChild(h("div", { class: "tkg-empty", text: "没有匹配节点" }));
    }
    input.addEventListener("input", function () { search(input.value); });
  }

  /* ─── 挂载 ─── */
  function mount(el, manifest) {
    var nodeId = el.getAttribute("data-teachany-kg");
    if (!nodeId || !manifest.nodes[nodeId]) {
      el.innerHTML = '<div class="tkg-empty">无法渲染知识图谱：' + (nodeId ? "节点 " + nodeId + " 不存在于索引" : "缺少 data-teachany-kg 属性") + '</div>';
      return;
    }
    var centerNode = manifest.nodes[nodeId];
    el.classList.add("tkg-root");
    el.innerHTML = "";

    var head = h("div", { class: "tkg-head" });
    head.appendChild(h("h2", { class: "tkg-title", html: "🗺️ 知识图谱 <small>" + (centerNode.name || nodeId) + "</small>" }));
    var tools = h("div", { class: "tkg-tools" });
    var filterAll = h("button", { class: "tkg-filter active", type: "button", "data-filter": "all", text: "全部" });
    var filterPre = h("button", { class: "tkg-filter", type: "button", "data-filter": "prereq", text: "前序" });
    var filterNext = h("button", { class: "tkg-filter", type: "button", "data-filter": "next", text: "后续" });
    var filterSib = h("button", { class: "tkg-filter", type: "button", "data-filter": "sibling", text: "同域" });
    var search = h("input", { type: "search", placeholder: "搜索任意知识点…" });
    [filterAll, filterPre, filterNext, filterSib, search].forEach(function (n) { tools.appendChild(n); });
    head.appendChild(tools);
    el.appendChild(head);

    var body = h("div", { class: "tkg-body" });

    var canvasWrap = h("div", { class: "tkg-canvas" });
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    canvasWrap.appendChild(svg);
    canvasWrap.appendChild(h("div", { class: "tkg-canvas-hint", text: "悬停看详情 · 点击有课件节点可跳转 · 拖动整理布局" }));
    var statWrap = h("div", { class: "tkg-canvas-stat" });
    canvasWrap.appendChild(statWrap);
    // Tooltip follows mouse
    var tooltip = h("div", { class: "tkg-tooltip" });
    canvasWrap.appendChild(tooltip);
    body.appendChild(canvasWrap);

    var panel = h("div", { class: "tkg-panel" });
    body.appendChild(panel);

    el.appendChild(body);

    // Search result drawer (independent box)
    var searchBox = h("div", { class: "tkg-panel-links", style: "margin-top:10px;" });
    el.appendChild(searchBox);

    // Canvas probe
    var probeWrap = h("div", { class: "tkg-probe" });
    probeWrap.appendChild(h("div", { class: "tkg-probe-title", text: "🎯 学习足迹：点击图谱节点会在这里累积记录你探索过的知识点" }));
    var probeCanvas = document.createElement("canvas");
    probeCanvas.width = 720; probeCanvas.height = 130;
    probeCanvas.setAttribute("aria-label", "知识点探索进度互动画布");
    probeWrap.appendChild(probeCanvas);
    el.appendChild(probeWrap);

    var footer = h("div", { class: "tkg-footer" });
    var legend = h("div", { class: "tkg-legend" });
    [
      ["🎯 本节", "#f59e0b"],
      ["✅ 已有课件（点击跳转）", "#10b981"],
      ["📝 暂无课件（虚线框）", "#94a3b8"]
    ].forEach(function (p) {
      var span = h("span");
      span.innerHTML = '<span class="tkg-legend-dot" style="background:' + p[1] + ';"></span>' + p[0];
      legend.appendChild(span);
    });
    footer.appendChild(legend);
    footer.appendChild(h("div", { text: "数据：data/trees + data/knowledge-points · 风格：与 tree.html 一致" }));
    el.appendChild(footer);

    // Render
    var visited = new Set();
    var currentId = nodeId;
    var currentFilter = "all";

    function drawProbe() {
      var ctx = probeCanvas.getContext("2d");
      var w = probeCanvas.width, hpx = probeCanvas.height;
      ctx.clearRect(0, 0, w, hpx);
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(59,130,246,0.12)");
      grad.addColorStop(1, "rgba(245,158,11,0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, hpx);
      var items = Array.from(visited);
      if (!items.length) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("点击知识图谱节点，这里会记录你已探索的学习足迹。", w / 2, hpx / 2);
        return;
      }
      var baseY = hpx / 2 + 10;
      ctx.strokeStyle = "rgba(59,130,246,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      items.forEach(function (id, i) {
        var x = 40 + i * ((w - 80) / Math.max(1, items.length - 1));
        if (i === 0) ctx.moveTo(x, baseY);
        else ctx.lineTo(x, baseY);
      });
      ctx.stroke();
      items.forEach(function (id, i) {
        var node = manifest.nodes[id];
        var x = 40 + i * ((w - 80) / Math.max(1, items.length - 1));
        ctx.fillStyle = id === currentId ? "#f59e0b" : (hasCourse(node) ? "#10b981" : "#94a3b8");
        ctx.beginPath();
        ctx.arc(x, baseY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), x, baseY + 4);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "12px sans-serif";
        ctx.fillText((node && node.name) || id, x, baseY - 16);
      });
      ctx.fillStyle = "rgba(226,232,240,0.75)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("已探索 " + items.length + " 个节点", 20, 22);
    }

    function render(id) {
      currentId = id;
      visited.add(id);
      var graph = buildNeighborhood(manifest, id);
      if (!graph) return;
      renderGraph(svg, graph, {
        onNodeClick: function (n, ev) {
          // 有课件 → 打开课件；无课件 → 聚焦到详情面板
          if (hasCourse(n) && n.id !== currentId) {
            var url = coursewareUrl(n.courses[0]);
            if (url) { window.open(url, "_top"); return; }
          }
          render(n.id);
        },
        onHover: function (n, ev) {
          tooltip.innerHTML = buildTooltipContent(n);
          tooltip.classList.add("visible");
          positionTooltip(tooltip, canvasWrap, ev);
        },
        onMove: function (n, ev) {
          positionTooltip(tooltip, canvasWrap, ev);
        },
        onLeave: function () { tooltip.classList.remove("visible"); }
      });
      svg.__graphNodes = graph.nodes;
      renderDetailPanel(panel, id, manifest, el);
      applyFilter(el, currentFilter);

      // Highlight selected
      svg.querySelectorAll(".tkg-node-group").forEach(function (g) {
        g.classList.toggle("selected", g.getAttribute("data-id") === id);
      });
      // Stats
      var total = graph.nodes.length;
      var withCourse = graph.nodes.filter(hasCourse).length;
      statWrap.innerHTML = '<span>' + total + ' 节点</span><span>✅ ' + withCourse + ' 已有课件</span>';
      drawProbe();
    }

    [filterAll, filterPre, filterNext, filterSib].forEach(function (btn) {
      btn.addEventListener("click", function () {
        [filterAll, filterPre, filterNext, filterSib].forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        applyFilter(el, currentFilter);
      });
    });
    el.addEventListener("tkg:focus", function (ev) { render(ev.detail); });
    renderSearch(manifest, search, searchBox, el);

    // Drag nodes
    var dragging = null;
    svg.addEventListener("mousedown", function (ev) {
      var g = ev.target.closest(".tkg-node-group");
      if (!g) return;
      dragging = { el: g, id: g.getAttribute("data-id") };
      ev.preventDefault();
    });
    window.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      var bb = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      var x = (ev.clientX - bb.left) / bb.width * vb.width;
      var y = (ev.clientY - bb.top) / bb.height * vb.height;
      dragging.el.setAttribute("transform", "translate(" + x + "," + y + ")");
      svg.querySelectorAll(".tkg-link").forEach(function (line) {
        var d = line.__data;
        if (!d) return;
        if (d.source === dragging.id) { line.setAttribute("x1", x); line.setAttribute("y1", y); }
        if (d.target === dragging.id) { line.setAttribute("x2", x); line.setAttribute("y2", y); }
      });
    });
    window.addEventListener("mouseup", function () { dragging = null; });

    render(nodeId);

    // Resize
    window.addEventListener("resize", (function () {
      var tid = null;
      return function () { clearTimeout(tid); tid = setTimeout(function () { render(currentId); }, 180); };
    })());
  }

  function init() {
    var targets = document.querySelectorAll("[data-teachany-kg]");
    if (!targets.length) return;
    loadManifest().then(function (m) {
      targets.forEach(function (el) { mount(el, m); });
    }).catch(function (err) {
      targets.forEach(function (el) {
        el.innerHTML = '<div class="tkg-empty">知识图谱加载失败：' + (err && err.message || err) + '</div>';
      });
    });
  }

  window.TeachAnyKnowledgeGraph = { __initialized: true, mount: mount, loadManifest: loadManifest };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
