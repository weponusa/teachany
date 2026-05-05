/*! TeachAny Standard Knowledge Graph Module · v1.0
 * --------------------------------------------------
 *  <div data-teachany-kg="chn-e-compound-vowel"></div>
 *  <script src="../../scripts/teachany-knowledge-graph.js" defer></script>
 *  <link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">
 *
 *  - 零依赖
 *  - 从 scripts/teachany-kg-manifest.json 加载节点数据
 *  - 渲染本知识点 + 前序 + 后续 + 兄弟节点
 *  - 支持搜索、筛选、节点详情、跳转到有 courseware 的课件
 *  - 风格跟随宿主课件的 CSS 变量，无需额外配置
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
  var COURSEWARE_ROOT_CANDIDATES = ["../../examples/", "../examples/", "examples/"];

  var manifestPromise = null;
  function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (function tryNext(list) {
      if (!list.length) return Promise.reject(new Error("manifest-not-found"));
      return fetch(list[0], { cache: "force-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error("not-ok");
          return r.json();
        })
        .catch(function () {
          return tryNext(list.slice(1));
        });
    })(BASE_PATH_CANDIDATES.slice());
    return manifestPromise;
  }

  function coursewareUrl(course) {
    if (!course || !course.path) return null;
    // path 形如 examples/<id>，在课件内部需要 ../<id>/index.html
    var m = course.path.match(/^examples\/(.+)$/);
    if (!m) return course.path;
    var dir = m[1];
    return "../" + dir + "/index.html";
  }

  var LAYER_COLORS = {
    self: "var(--tkg-accent, #f59e0b)",
    prereq: "var(--tkg-success, #10b981)",
    next: "var(--tkg-primary, #3b82f6)",
    sibling: "#a855f7",
    extend: "#ec4899"
  };

  function h(tag, attrs, children) {
    var el = (tag === "svg" || tag === "g" || tag === "circle" || tag === "line" || tag === "text" || tag === "path" || tag === "defs" || tag === "marker" || tag === "polygon")
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") el.setAttribute("class", attrs[k]);
        else if (k === "html") el.innerHTML = attrs[k];
        else if (k === "text") el.textContent = attrs[k];
        else if (k === "on" && attrs[k]) Object.keys(attrs[k]).forEach(function (ev) { el.addEventListener(ev, attrs[k][ev]); });
        else if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  function buildNeighborhood(manifest, centerId) {
    var nodes = manifest.nodes || {};
    var center = nodes[centerId];
    if (!center) return null;
    var set = new Map();
    function push(id, layer) {
      if (!id || !nodes[id]) return;
      if (set.has(id)) return;
      var n = nodes[id];
      set.set(id, Object.assign({}, n, { _layer: layer }));
    }
    push(centerId, "self");
    (center.prerequisites || []).forEach(function (id) { push(id, "prereq"); });
    (center.next || []).forEach(function (id) { push(id, "next"); });
    (center.extends || []).forEach(function (id) { push(id, "extend"); });
    (center.siblings || []).slice(0, 6).forEach(function (id) { push(id, "sibling"); });

    var arr = Array.from(set.values());
    var links = [];
    arr.forEach(function (n) {
      (n.prerequisites || []).forEach(function (pid) {
        if (set.has(pid)) links.push({ source: pid, target: n.id, type: "prereq" });
      });
    });
    // Ensure center <-> siblings visually connected
    arr.forEach(function (n) {
      if (n._layer === "sibling") {
        links.push({ source: centerId, target: n.id, type: "sibling" });
      }
    });
    return { center: center, nodes: arr, links: links };
  }

  function forceLayout(nodes, links, width, height) {
    // 轻量力导向：只跑 200 次迭代，足够 4-15 节点用
    var padding = 60;
    nodes.forEach(function (n, i) {
      if (n._layer === "self") {
        n.x = width / 2;
        n.y = height / 2;
        n.fx = true;
      } else {
        var angle = (i / nodes.length) * Math.PI * 2;
        var r = Math.min(width, height) * 0.35;
        n.x = width / 2 + r * Math.cos(angle);
        n.y = height / 2 + r * Math.sin(angle);
      }
      n.vx = 0; n.vy = 0;
    });
    var linkSet = new Set(links.map(function (l) { return l.source + "->" + l.target; }));
    var idx = new Map(nodes.map(function (n) { return [n.id, n]; }));
    var linkObjs = links.map(function (l) { return { s: idx.get(l.source), t: idx.get(l.target), type: l.type }; }).filter(function (l) { return l.s && l.t; });
    var iter = 220;
    var idealLen = Math.min(width, height) * 0.22;
    for (var k = 0; k < iter; k++) {
      // repulsion
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var force = 2400 / (dist * dist);
          var fx = (dx / dist) * force;
          var fy = (dy / dist) * force;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      // attraction along links
      linkObjs.forEach(function (l) {
        var dx = l.t.x - l.s.x, dy = l.t.y - l.s.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var force = (dist - idealLen) * 0.08;
        var fx = (dx / dist) * force, fy = (dy / dist) * force;
        if (!l.s.fx) { l.s.vx += fx; l.s.vy += fy; }
        if (!l.t.fx) { l.t.vx -= fx; l.t.vy -= fy; }
      });
      // center gravity
      nodes.forEach(function (n) {
        if (n.fx) return;
        n.vx += (width / 2 - n.x) * 0.01;
        n.vy += (height / 2 - n.y) * 0.01;
      });
      // integrate
      nodes.forEach(function (n) {
        if (n.fx) { n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.78; n.vy *= 0.78;
        n.x += n.vx; n.y += n.vy;
        if (n.x < padding) { n.x = padding; n.vx = Math.abs(n.vx) * 0.5; }
        if (n.x > width - padding) { n.x = width - padding; n.vx = -Math.abs(n.vx) * 0.5; }
        if (n.y < padding) { n.y = padding; n.vy = Math.abs(n.vy) * 0.5; }
        if (n.y > height - padding) { n.y = height - padding; n.vy = -Math.abs(n.vy) * 0.5; }
      });
    }
  }

  function renderGraph(svg, graph, handlers) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var bb = svg.getBoundingClientRect();
    var width = bb.width || 600;
    var height = bb.height || 360;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    var defs = h("defs");
    ["prereq", "next", "sibling"].forEach(function (type) {
      var marker = h("marker", {
        id: "tkg-arrow-" + type,
        viewBox: "0 -5 10 10",
        refX: 12, refY: 0,
        markerWidth: 6, markerHeight: 6,
        orient: "auto"
      }, [h("path", { d: "M0,-5L10,0L0,5", fill: LAYER_COLORS[type === "sibling" ? "sibling" : type] })]);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    forceLayout(graph.nodes, graph.links, width, height);

    var linkGroup = h("g", { class: "tkg-links" });
    graph.links.forEach(function (l) {
      var src = graph.nodes.find(function (n) { return n.id === l.source; });
      var tgt = graph.nodes.find(function (n) { return n.id === l.target; });
      if (!src || !tgt) return;
      var line = h("line", {
        class: "tkg-link tkg-link-" + l.type,
        x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y,
        stroke: LAYER_COLORS[l.type === "sibling" ? "sibling" : l.type],
        "stroke-width": l.type === "sibling" ? 1.3 : 2,
        "stroke-dasharray": l.type === "sibling" ? "4 4" : "0",
        "marker-end": "url(#tkg-arrow-" + l.type + ")"
      });
      line.__data = l;
      linkGroup.appendChild(line);
    });
    svg.appendChild(linkGroup);

    var nodeGroup = h("g", { class: "tkg-nodes" });
    graph.nodes.forEach(function (n) {
      var radius = n._layer === "self" ? 34 : 26;
      var color = LAYER_COLORS[n._layer] || LAYER_COLORS.sibling;
      var g = h("g", {
        class: "tkg-node layer-" + n._layer,
        transform: "translate(" + n.x + "," + n.y + ")",
        "data-id": n.id,
        on: {
          click: function () { handlers.onNodeClick && handlers.onNodeClick(n.id); }
        }
      });
      g.appendChild(h("circle", {
        r: radius,
        fill: "rgba(255,255,255,0.08)",
        stroke: color,
        "stroke-width": 2.5
      }));
      var label = (n.name || n.id || "").slice(0, 10);
      g.appendChild(h("text", {
        "text-anchor": "middle",
        y: 4,
        "font-size": n._layer === "self" ? 14 : 12,
        text: label
      }));
      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);
  }

  function renderDetailPanel(panel, nodeId, manifest, rootEl) {
    var nodes = manifest.nodes;
    var node = nodes[nodeId];
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    if (!node) {
      panel.appendChild(h("div", { class: "tkg-empty", text: "找不到节点 " + nodeId }));
      return;
    }
    var head = h("div", null, [
      h("h3", { text: node.name || node.id }),
      h("div", { class: "meta", text: [node.subject, node.stage ? "G" + (node.grade || "") : "", node.domain].filter(Boolean).join(" · ") })
    ]);
    panel.appendChild(head);

    var tagsWrap = h("div", { class: "tkg-tags" });
    function addTag(id, layer) {
      var target = nodes[id];
      if (!target) return;
      var hasCourse = (target.courses || []).length > 0;
      var tag = h("a", {
        class: "tkg-tag layer-" + layer + (hasCourse ? " has-course" : " no-course"),
        href: "#",
        text: target.name || target.id,
        on: {
          click: function (ev) {
            ev.preventDefault();
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
    if (tagsWrap.children.length > 0) {
      panel.appendChild(h("div", { class: "meta", text: "前序 / 后续 / 相关知识点（📚 表示已有课件）" }));
      panel.appendChild(tagsWrap);
    }

    if ((node.curriculum_points || []).length > 0) {
      panel.appendChild(h("div", { class: "meta", text: "课标要点" }));
      var ul = h("ul");
      node.curriculum_points.slice(0, 4).forEach(function (t) {
        ul.appendChild(h("li", { text: t }));
      });
      panel.appendChild(ul);
    }

    if (node.textbook_chapter) {
      panel.appendChild(h("div", { class: "meta", text: "教材：" + node.textbook_chapter }));
    }

    var courses = node.courses || [];
    if (courses.length) {
      panel.appendChild(h("div", { class: "meta", text: "可跳转课件" }));
      var list = h("div", { class: "tkg-panel-links" });
      courses.slice(0, 4).forEach(function (c) {
        var url = coursewareUrl(c);
        if (!url) return;
        list.appendChild(h("a", {
          class: "tkg-link-card",
          href: url,
          target: "_top",
          html: "<div><strong>" + (c.name || c.id) + "</strong><br><em>" + (c.source || "") + "</em></div><span>→</span>"
        }));
      });
      if (list.children.length) panel.appendChild(list);
    }
  }

  function applyFilter(root, filter) {
    var svg = root.querySelector(".tkg-canvas svg");
    if (!svg) return;
    svg.querySelectorAll(".tkg-node").forEach(function (g) {
      var layer = (g.getAttribute("class") || "").split(/\s+/).find(function (c) { return c.indexOf("layer-") === 0; });
      var lk = (layer || "").replace("layer-", "");
      var show = filter === "all" || lk === filter || (filter === "prereq" && lk === "self") || (filter === "next" && lk === "self");
      g.classList.toggle("dim", !show);
    });
    svg.querySelectorAll(".tkg-link").forEach(function (line) {
      var type = (line.getAttribute("class") || "").split(/\s+/).find(function (c) { return c.indexOf("tkg-link-") === 0 && c !== "tkg-link"; });
      var lk = (type || "").replace("tkg-link-", "");
      var show = filter === "all" || lk === filter;
      line.classList.toggle("dim", !show);
    });
  }

  function renderSearch(manifest, input, resultBox) {
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
          class: "tkg-link-card",
          href: "#",
          html: "<div><strong>" + (n.name || n.id) + "</strong><br><em>" + (n.domain || "") + " · " + (n.stage || "") + "</em></div><span>聚焦 →</span>",
          on: {
            click: function (ev) {
              ev.preventDefault();
              input.closest(".tkg-root").dispatchEvent(new CustomEvent("tkg:focus", { detail: n.id }));
              input.value = "";
              while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
            }
          }
        }));
      });
      if (!matches.length) {
        resultBox.appendChild(h("div", { class: "tkg-empty", text: "没有匹配节点" }));
      }
    }
    input.addEventListener("input", function () { search(input.value); });
  }

  function mount(el, manifest) {
    var nodeId = el.getAttribute("data-teachany-kg");
    if (!nodeId || !manifest.nodes[nodeId]) {
      el.innerHTML = '<div class="tkg-empty">无法渲染知识图谱：缺少 node_id 或节点 ' + nodeId + ' 不存在。</div>';
      return;
    }
    el.classList.add("tkg-root");
    el.innerHTML = "";

    var centerNode = manifest.nodes[nodeId];

    var head = h("div", { class: "tkg-head" });
    head.appendChild(h("h2", { class: "tkg-title", html: "🗺️ 知识图谱 <small>" + (centerNode.name || nodeId) + "</small>" }));
    var tools = h("div", { class: "tkg-tools" });
    var filterAll = h("button", { class: "tkg-filter active", type: "button", "data-filter": "all", text: "全部" });
    var filterPre = h("button", { class: "tkg-filter", type: "button", "data-filter": "prereq", text: "前序" });
    var filterNext = h("button", { class: "tkg-filter", type: "button", "data-filter": "next", text: "后续" });
    var filterSib = h("button", { class: "tkg-filter", type: "button", "data-filter": "sibling", text: "相关" });
    var search = h("input", { type: "search", placeholder: "搜索知识点…" });
    [filterAll, filterPre, filterNext, filterSib, search].forEach(function (n) { tools.appendChild(n); });
    head.appendChild(tools);
    el.appendChild(head);

    var body = h("div", { class: "tkg-body" });
    var canvasWrap = h("div", { class: "tkg-canvas" });
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    canvasWrap.appendChild(svg);
    canvasWrap.appendChild(h("div", { class: "tkg-canvas-hint", text: "点节点看详情 · 拖动节点整理布局" }));
    body.appendChild(canvasWrap);

    var panel = h("div", { class: "tkg-panel" });
    body.appendChild(panel);

    el.appendChild(body);

    // 真实 <canvas> 学习进度探针：随着用户点击不同节点，画布上会累积“已探索”的节点。
    var probeWrap = h("div", { class: "tkg-probe" });
    probeWrap.appendChild(h("div", { class: "tkg-probe-title", text: "🎯 学习进度探针（点击左侧节点，这里会实时记录你已探索的知识点）" }));
    var probeCanvas = document.createElement("canvas");
    probeCanvas.width = 720; probeCanvas.height = 140;
    probeCanvas.setAttribute("aria-label", "知识点探索进度互动画布");
    probeWrap.appendChild(probeCanvas);
    el.appendChild(probeWrap);

    var searchBox = h("div", { class: "tkg-panel-links", style: "margin-top:8px;" });
    el.appendChild(searchBox);

    var footer = h("div", { class: "tkg-footer" });
    var legend = h("div", { class: "tkg-legend" });
    [
      ["self", "本节知识点"], ["prereq", "前序"], ["next", "后续"], ["sibling", "相关 / 领域内"]
    ].forEach(function (pair) {
      var span = h("span");
      span.innerHTML = '<span class="tkg-legend-dot" style="background:' + LAYER_COLORS[pair[0]] + ';"></span>' + pair[1];
      legend.appendChild(span);
    });
    footer.appendChild(legend);
    footer.appendChild(h("div", { text: "数据来源：data/trees + data/knowledge-points" }));
    el.appendChild(footer);

    // Build & render
    var visited = new Set();
    function drawProbe() {
      var ctx = probeCanvas.getContext("2d");
      var w = probeCanvas.width, hpx = probeCanvas.height;
      ctx.clearRect(0, 0, w, hpx);
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(59,130,246,0.14)");
      grad.addColorStop(1, "rgba(245,158,11,0.10)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, hpx);
      var items = Array.from(visited);
      if (!items.length) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("点击左边的知识图谱节点，这里会记录你已探索的知识点。", w / 2, hpx / 2);
        return;
      }
      var baseY = hpx / 2 + 12;
      ctx.strokeStyle = "#3b82f6";
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
        ctx.fillStyle = id === currentId ? "#f59e0b" : "#10b981";
        ctx.beginPath();
        ctx.arc(x, baseY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), x, baseY + 4);
        ctx.fillStyle = "#1e293b";
        ctx.font = "12px sans-serif";
        ctx.fillText((node && node.name) || id, x, baseY - 16);
      });
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("已探索 " + items.length + " 个节点", 20, 22);
    }

    var currentId = nodeId;
    function render(id) {
      currentId = id;
      visited.add(id);
      var graph = buildNeighborhood(manifest, id);
      if (!graph) return;
      renderGraph(svg, graph, { onNodeClick: function (clicked) { focus(clicked); } });
      renderDetailPanel(panel, id, manifest, el);
      applyFilter(el, currentFilter);
      // Highlight selected
      svg.querySelectorAll(".tkg-node").forEach(function (g) {
        g.classList.toggle("selected", g.getAttribute("data-id") === id);
      });
      drawProbe();
    }
    function focus(id) { render(id); }

    var currentFilter = "all";
    [filterAll, filterPre, filterNext, filterSib].forEach(function (btn) {
      btn.addEventListener("click", function () {
        [filterAll, filterPre, filterNext, filterSib].forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        applyFilter(el, currentFilter);
      });
    });
    el.addEventListener("tkg:focus", function (ev) { focus(ev.detail); });
    renderSearch(manifest, search, searchBox);

    // Drag support: let user reposition nodes
    var dragging = null;
    svg.addEventListener("mousedown", function (ev) {
      var g = ev.target.closest(".tkg-node");
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

    // Re-render on resize
    window.addEventListener("resize", (function () {
      var tid = null;
      return function () {
        clearTimeout(tid);
        tid = setTimeout(function () { render(currentId); }, 180);
      };
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

  window.TeachAnyKnowledgeGraph = {
    __initialized: true,
    mount: mount,
    loadManifest: loadManifest
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
