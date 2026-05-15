/*! TeachAny Standard Knowledge Graph Module · v2.1
 * --------------------------------------------------
 *  <link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">
 *  <div data-teachany-kg="chn-e-compound-vowel">
 *    <canvas class="tkg-fallback-canvas" width="720" height="120"></canvas>
 *  </div>
 *  <script src="../../scripts/teachany-knowledge-graph.js" defer></script>
 *
 *  视觉风格：完全对齐 tree.html 的知识地图
 *  交互：hover 放大 + tooltip；有课件节点点击跳课件，无课件虚线框
 *  v2.1 修复：闪动（增量更新SVG）、蓝底黑字（强制浅色文字）、节点交互（分离聚焦与重绘）
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

  var COURSEWARE_BASE_URL = "https://weponusa.github.io/teachany";

  function coursewareUrl(course) {
    if (!course || !course.path) return null;
    if (/^https?:\/\//i.test(course.path)) return course.path;
    return COURSEWARE_BASE_URL + "/" + String(course.path).replace(/^\/+/, "").replace(/\/$/, "") + "/index.html";
  }

  function hasCourse(node) {
    return node && node.courses && node.courses.length > 0;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function coursewarePrompt(node) {
    var name = node && (node.name || node.id) || "该知识点";
    var id = node && node.id || "";
    return "帮我生成「" + name + "」的 TeachAny 交互式课件，知识点 ID 为 " + id + "。请按 TeachAny skill 规范输出完整 HTML 课件，包含教学目标、前测、核心讲解、真实互动模块、音频/视频资源、后测、知识图谱和质量校验。";
  }

  function recordMakeCourseIntent(node, prompt) {
    try {
      if (window.TeachAnyHistory && typeof window.TeachAnyHistory.recordCreated === "function" && node) {
        window.TeachAnyHistory.recordCreated("kg-intent-" + node.id, {
          source: "knowledge-graph",
          name: (node.name || node.id) + "（知识图谱制作意图）",
          subject: node.subject || "",
          grade: node.grade ? String(node.grade) : "",
          node: node.id,
          url: "",
          prompt: prompt,
          status: "draft"
        });
      }
    } catch (_e) { /* ignore */ }
  }

  function renderMakeCourseBox(panel, node) {
    if (!panel || !node) return;
    var old = panel.querySelector(".tkg-make-course-box");
    if (old) old.remove();
    var prompt = coursewarePrompt(node);
    var promptEl = h("div", { class: "tkg-prompt", text: prompt });
    var feedback = h("span", { class: "tkg-copy-feedback", text: "已复制" });
    var copyBtn = h("button", {
      class: "tkg-make-course-btn secondary",
      type: "button",
      text: "📋 复制提示词",
      on: {
        click: function () {
          var done = function () {
            feedback.classList.add("visible");
            setTimeout(function () { feedback.classList.remove("visible"); }, 1600);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(prompt).then(done).catch(done);
          } else {
            var ta = document.createElement("textarea");
            ta.value = prompt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            done();
          }
        }
      }
    });
    var box = h("div", { class: "tkg-make-course-box" }, [
      h("strong", { text: "✨ 制作课件" }),
      h("p", { text: "复制下面提示词，在 CodeBuddy/TeachAny skill 中生成这个知识点的课件。" }),
      promptEl,
      h("div", { class: "tkg-make-actions" }, [copyBtn, feedback])
    ]);
    panel.appendChild(box);
    panel.scrollTop = panel.scrollHeight;
    recordMakeCourseIntent(node, prompt);
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

  /* ─── 布局：确定性环形分层（v2.2 取代力导向，零闪动）
   *  · self 居中
   *  · prereq 在左半圆（180°±60°），按顺序均匀
   *  · next 在右半圆（0°±60°），按顺序均匀
   *  · sibling/extend 在上下两弧（90° / 270°）填空
   *  · 所有坐标一次性算好，不需要迭代，不会有"先乱后稳"的视觉跳动
   */
  function deterministicLayout(nodes, links, width, height) {
    var cx = width / 2, cy = height / 2;
    var radius = Math.min(width, height) * 0.36;
    var padding = 60;

    var byLayer = { self: [], prereq: [], next: [], sibling: [], extend: [] };
    nodes.forEach(function (n) { (byLayer[n._layer] || byLayer.sibling).push(n); });

    function placeOnArc(group, centerAngleDeg, spanDeg, r) {
      var n = group.length;
      if (!n) return;
      var startA = (centerAngleDeg - spanDeg / 2) * Math.PI / 180;
      var endA = (centerAngleDeg + spanDeg / 2) * Math.PI / 180;
      group.forEach(function (node, i) {
        var t = n === 1 ? 0.5 : i / (n - 1);
        var a = startA + t * (endA - startA);
        node.x = cx + r * Math.cos(a);
        node.y = cy + r * Math.sin(a);
      });
    }

    // self 锚定
    if (byLayer.self.length) { byLayer.self[0].x = cx; byLayer.self[0].y = cy; }

    // 左半圆：前序（180°中心，跨度 130°）
    placeOnArc(byLayer.prereq, 180, Math.min(130, byLayer.prereq.length * 35 + 20), radius);
    // 右半圆：后续（0°中心，跨度 130°）
    placeOnArc(byLayer.next, 0, Math.min(130, byLayer.next.length * 35 + 20), radius);
    // 上弧：sibling
    placeOnArc(byLayer.sibling, -90, Math.min(120, byLayer.sibling.length * 28 + 20), radius * 0.92);
    // 下弧：extend
    placeOnArc(byLayer.extend, 90, Math.min(120, byLayer.extend.length * 28 + 20), radius * 0.92);

    // 边界保护
    nodes.forEach(function (n) {
      if (n.x < padding) n.x = padding;
      if (n.x > width - padding) n.x = width - padding;
      if (n.y < padding) n.y = padding;
      if (n.y > height - padding) n.y = height - padding;
    });
  }

  /* ─── 绘制 SVG 图谱（v2.1: 支持增量更新，不再每次全量清除） ─── */
  function renderGraph(svg, graph, handlers, existingGraph) {
    // 如果新旧图谱节点集合一致，只更新高亮和详情面板，不清除重建
    var oldNodeIds = existingGraph ? existingGraph.nodes.map(function(n){ return n.id; }).sort().join(',') : '';
    var newNodeIds = graph.nodes.map(function(n){ return n.id; }).sort().join(',');
    var sameGraph = oldNodeIds && oldNodeIds === newNodeIds;

    if (sameGraph) {
      // 增量更新：只改高亮状态，不重建SVG
      svg.querySelectorAll(".tkg-node-group").forEach(function (g) {
        var nid = g.getAttribute("data-id");
        var n = graph.nodes.find(function(x){ return x.id === nid; });
        if (!n) return;
        // 更新 _layer 可能变化了
        var isSelf = n._layer === "self";
        var hasCrs = hasCourse(n);
        var radius = hasCrs ? 24 : 20;
        if (isSelf) radius = 30;
        var domainColor = n.domain_color || "#3b82f6";
        var fill, stroke, dash;
        if (isSelf) {
          fill = hexToRgba(domainColor, 0.55);
          stroke = domainColor;
          dash = "none";
        } else if (hasCrs) {
          fill = hexToRgba(domainColor, 0.40);
          stroke = domainColor;
          dash = "none";
        } else {
          fill = hexToRgba(domainColor, 0.15);
          stroke = hexToRgba(domainColor, 0.6);
          dash = "4 3";
        }
        var circle = g.querySelector(".tkg-node-circle");
        if (circle) {
          circle.setAttribute("fill", fill);
          circle.setAttribute("stroke", stroke);
          circle.setAttribute("stroke-dasharray", dash);
          circle.setAttribute("r", radius);
        }
        // 更新 status icon
        var iconEl = g.querySelector(".tkg-node-status-icon");
        if (iconEl) {
          var icon = "📝";
          if (isSelf) icon = "🎯";
          else if (hasCrs) icon = "✅";
          iconEl.textContent = icon;
        }
        // 更新 class
        g.setAttribute("class", "tkg-node-group" + (hasCrs || isSelf ? "" : " no-course"));
      });
      return;
    }

    // 全量重建（中心节点变了，邻居集合不同了）
    // v2.3: 重建期间 SVG 设 visibility:hidden，避免"边建边看"的逐节点闪现
    svg.style.visibility = "hidden";
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // v2.2: 用 canvas 容器尺寸而不是 svg 自身（svg 在初次未布局时 width 可能为 0）
    var canvasEl = svg.parentElement;
    var bb = (canvasEl || svg).getBoundingClientRect();
    var width = bb.width || 600;
    var height = bb.height || 420;
    // 容器异常时给个保底
    if (width < 100) width = 600;
    if (height < 100) height = 420;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    deterministicLayout(graph.nodes, graph.links, width, height);

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

    // Nodes (tree.html 风格，v2.1: 提高填充不透明度，增强可读性)
    var nodeGroup = h("g", { class: "tkg-nodes" });
    graph.nodes.forEach(function (n) {
      var hasCrs = hasCourse(n);
      var isSelf = n._layer === "self";
      var radius = hasCrs ? 24 : 20;
      if (isSelf) radius = 30;
      var domainColor = n.domain_color || "#3b82f6";
      var fill, stroke, dash;
      if (isSelf) {
        fill = hexToRgba(domainColor, 0.55);
        stroke = domainColor;
        dash = "none";
      } else if (hasCrs) {
        fill = hexToRgba(domainColor, 0.40);
        stroke = domainColor;
        dash = "none";
      } else {
        fill = hexToRgba(domainColor, 0.15);
        stroke = hexToRgba(domainColor, 0.6);
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
    // v2.3: 所有节点/连线就位后再显现，避免"边建边看"的闪烁
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () { svg.style.visibility = "visible"; });
    } else {
      svg.style.visibility = "visible";
    }
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
        html += '<a class="course-link" href="' + url + '" target="_top">🚀 打开课件：' + escapeHtml(node.courses[0].name || node.courses[0].id) + '</a>';
      }
    } else {
      html += '<div class="gap-msg">该知识点暂无官方课件，欢迎贡献社区版本。</div>';
    }
    html += '<button type="button" class="course-link tkg-make-course-btn" data-tkg-make-course="' + escapeHtml(node.id) + '">✨ 制作课件</button>';
    return html;
  }

  // v2.4: tooltip 锚定到节点本身而不是鼠标，用户才能安全把鼠标移到 tooltip 上点击链接
  function positionTooltipAtNode(tooltip, root, nodeEl) {
    if (!nodeEl) return;
    var rootRect = root.getBoundingClientRect();
    var nodeRect = nodeEl.getBoundingClientRect();
    // 默认：在节点右侧，垂直居中
    var tw = tooltip.offsetWidth || 280;
    var th = tooltip.offsetHeight || 200;
    var x = nodeRect.right - rootRect.left + 8;
    var y = nodeRect.top - rootRect.top + (nodeRect.height - th) / 2;
    // 如果右侧放不下，放到左侧
    if (x + tw > rootRect.width - 4) {
      x = nodeRect.left - rootRect.left - tw - 8;
    }
    // 如果左侧也放不下（节点在最左），放到下方
    if (x < 4) {
      x = nodeRect.left - rootRect.left + (nodeRect.width - tw) / 2;
      y = nodeRect.bottom - rootRect.top + 8;
    }
    // 垂直边界保护
    if (y < 8) y = 8;
    if (y + th > rootRect.height - 8) y = rootRect.height - th - 8;
    if (x < 4) x = 4;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }

  // 旧接口：退回旧逻辑作兜底（不再用，只保留兼容）
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
          html: "<div><strong>" + escapeHtml(c.name || c.id) + "</strong><br><em>" + escapeHtml(c.source || "") + "</em></div><span>→</span>"
        }));
      });
      if (list.children.length) panel.appendChild(list);
    }
    panel.appendChild(h("button", {
      class: "tkg-make-course-btn",
      type: "button",
      text: "✨ 制作课件",
      on: { click: function () { renderMakeCourseBox(panel, node); } }
    }));
  }

  /* ─── 筛选 / 搜索 ─── */
  function applyFilter(root, filter) {
    var svg = root.querySelector(".tkg-canvas svg");
    if (!svg) return;
    var nodes = svg.__graphNodes || [];
    // Filter links
    svg.querySelectorAll(".tkg-link").forEach(function (line) {
      var t = (line.getAttribute("class") || "").split(/\s+/).find(function (c) { return c.indexOf("link-") === 0 && c !== "tkg-link"; }) || "";
      var lk = t.replace("link-", "");
      line.classList.toggle("dim", !(filter === "all" || lk === filter));
    });
    // Filter nodes
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
    canvasWrap.appendChild(h("div", { class: "tkg-canvas-hint", text: "悬停看详情 · 点击有课件节点跳转课件 / 无课件节点切换图谱焦点" }));
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

    // v7.7.5: 学习足迹模块已移除（教学价值低，且干扰主视觉）

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
    footer.appendChild(h("div", { text: "数据：data/trees + skill/assets/image-registry.json · 风格：与 tree.html 一致" }));
    el.appendChild(footer);

    // Render state
    var visited = new Set();
    var currentId = nodeId;
    var currentFilter = "all";
    var currentGraph = null; // v2.1: 保存当前图谱引用，用于增量更新

    // v7.7.5: drawProbe() 已移除（学习足迹模块下线）

    /**
     * v2.1: 聚焦节点 — 如果新焦点已在当前图谱中，仅更新高亮+详情面板
     * 如果新焦点不在当前图谱中，才触发完整重绘
     */
    function focusNode(id) {
      currentId = id;
      visited.add(id);

      // 检查新节点是否在当前图谱中
      var alreadyInGraph = currentGraph && currentGraph.nodes.some(function(n) { return n.id === id; });

      if (alreadyInGraph) {
        // 增量更新：重建邻居关系（中心节点变了，_layer 要变），但不重绘整个SVG
        var newGraph = buildNeighborhood(manifest, id);
        if (!newGraph) return;

        // 用 renderGraph 的增量模式：只更新节点样式/高亮，不重建SVG结构
        renderGraph(svg, newGraph, {
          onNodeClick: onNodeClick,
          onHover: onHover,
          onMove: onMove,
          onLeave: onLeave
        }, currentGraph);

        currentGraph = newGraph;
        svg.__graphNodes = newGraph.nodes;
      } else {
        // 全量重绘：新焦点不在当前图谱中
        var graph = buildNeighborhood(manifest, id);
        if (!graph) return;
        renderGraph(svg, graph, {
          onNodeClick: onNodeClick,
          onHover: onHover,
          onMove: onMove,
          onLeave: onLeave
        }, null);
        currentGraph = graph;
        svg.__graphNodes = graph.nodes;
      }

      // 通用更新：详情面板、高亮、筛选、统计
      renderDetailPanel(panel, id, manifest, el);
      applyFilter(el, currentFilter);

      // Highlight selected
      svg.querySelectorAll(".tkg-node-group").forEach(function (g) {
        g.classList.toggle("selected", g.getAttribute("data-id") === id);
      });
      // Stats
      var total = currentGraph.nodes.length;
      var withCourse = currentGraph.nodes.filter(hasCourse).length;
      statWrap.innerHTML = '<span>' + total + ' 节点</span><span>✅ ' + withCourse + ' 已有课件</span>';
      // v7.7.5: drawProbe() 已移除

      // 更新标题中的当前节点名
      var titleSmall = el.querySelector(".tkg-title small");
      if (titleSmall) {
        var node = manifest.nodes[id];
        titleSmall.textContent = node ? (node.name || id) : id;
      }
    }

    // 事件处理器（提取为命名函数以便复用）
    function onNodeClick(n, ev) {
      // 有课件 → 打开课件；无课件 → 聚焦到详情面板
      if (hasCourse(n) && n.id !== currentId) {
        var url = coursewareUrl(n.courses[0]);
        if (url) { window.open(url, "_top"); return; }
      }
      focusNode(n.id);
    }
    // v2.4: tooltip hover 延迟关闭 + 允许鼠标移入 tooltip 交互（点击"打开课件"按钮）
    var hideTid = null;
    function showTooltip() {
      if (hideTid) { clearTimeout(hideTid); hideTid = null; }
      tooltip.classList.add("visible");
    }
    function scheduleHide() {
      if (hideTid) clearTimeout(hideTid);
      hideTid = setTimeout(function () { tooltip.classList.remove("visible"); hideTid = null; }, 400);
    }
    // 鼠标进入 tooltip 时取消隐藏；离开 tooltip 时立即隐藏
    tooltip.addEventListener("mouseenter", function () { showTooltip(); });
    tooltip.addEventListener("mouseleave", function () { scheduleHide(); });
    tooltip.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-tkg-make-course]") : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var node = manifest.nodes[btn.getAttribute("data-tkg-make-course")];
      if (node) {
        focusNode(node.id);
        renderMakeCourseBox(panel, node);
        scheduleHide();
      }
    });

    function onHover(n, ev) {
      tooltip.innerHTML = buildTooltipContent(n);
      showTooltip();
      // v2.4: 定位到节点本身而非鼠标位置，方便用户滑到 tooltip 上点按钮
      var nodeEl = svg.querySelector('.tkg-node-group[data-id="' + n.id + '"]');
      if (nodeEl) positionTooltipAtNode(tooltip, canvasWrap, nodeEl);
      else positionTooltip(tooltip, canvasWrap, ev);
    }
    function onMove(n, ev) {
      // v2.4: tooltip 不再随鼠标移动，避免离开节点时被拖远；仅在节点切换时重新定位
      // 没有操作
    }
    function onLeave() { scheduleHide(); }

    [filterAll, filterPre, filterNext, filterSib].forEach(function (btn) {
      btn.addEventListener("click", function () {
        [filterAll, filterPre, filterNext, filterSib].forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        applyFilter(el, currentFilter);
      });
    });
    el.addEventListener("tkg:focus", function (ev) { focusNode(ev.detail); });
    renderSearch(manifest, search, searchBox, el);

    // v2.3 移除拖拽功能：确定性布局下节点位置已合理，拖拽会制造闪动（mousedown 后抖动鼠标即误触发，transform 通过 CSS transition 动画出现肉眼可感的"跳"）；
    // 保留"按下 + 立即抬起 = 点击"逻辑（浏览器自带，无需代码）。

    // 初次渲染（全量）——用 rAF 延后一帧，等待样式 / 字体 / AudioBar 等注入稳定
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () { requestAnimationFrame(function () { focusNode(nodeId); }); });
    } else {
      setTimeout(function () { focusNode(nodeId); }, 16);
    }

    // Resize（防抖，全量重绘）——仅响应真实尺寸变化，且有阈值保护
    var lastW = 0, lastH = 0;
    function maybeRelayout() {
      var bb = canvasWrap.getBoundingClientRect();
      var dw = Math.abs(bb.width - lastW), dh = Math.abs(bb.height - lastH);
      if (dw < 8 && dh < 8) return; // 小于 8px 变化忽略，避免 scrollbar/浮条来回
      lastW = bb.width; lastH = bb.height;
      currentGraph = null;
      focusNode(currentId);
    }
    window.addEventListener("resize", (function () {
      var tid = null;
      return function () { clearTimeout(tid); tid = setTimeout(maybeRelayout, 250); };
    })());
    // ResizeObserver 监测容器尺寸（TutorCard/AudioBar 注入后容器宽度可能微调）
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver((function () {
        var tid = null;
        return function () { clearTimeout(tid); tid = setTimeout(maybeRelayout, 180); };
      })());
      ro.observe(canvasWrap);
    }
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
