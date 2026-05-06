/*! TeachAny Standard Historical Map · v1.0
 * --------------------------------------------------
 * 用法（HTML）：
 *   <link rel="stylesheet" href="../../scripts/teachany-historical-map.css">
 *
 *   <div data-teachany-map="qin-dynasty"
 *        data-teachany-map-scope="china"
 *        data-teachany-map-title="秦统一中国（前221）">
 *     <script type="application/json" data-teachany-map-config>
 *       {
 *         "annotations": [
 *           {"type":"city","coord":[108.95,34.27],"label":"咸阳","role":"capital"},
 *           {"type":"battle","coord":[110,38],"label":"长平之战","year":-260},
 *           {"type":"route","coords":[[108.95,34.27],[120.6,30.27]],"label":"秦驰道"}
 *         ]
 *       }
 *     </script>
 *   </div>
 *
 *   <script src="../../scripts/teachany-historical-map.js" defer></script>
 *
 * 数据：自动加载 ../../skill/assets/historical-{china|world}/{id}.geojson
 *       feature.properties.LEVEL ∈ {country, prefecture}：分层渲染
 */
(function () {
  "use strict";
  if (window.__TeachAnyMapInit) return;
  window.__TeachAnyMapInit = true;

  var BASE_CHINA = [
    "../../skill/assets/historical-china/",
    "../skill/assets/historical-china/",
    "/teachany/skill/assets/historical-china/"
  ];
  var BASE_WORLD = [
    "../../skill/assets/historical-world/",
    "../skill/assets/historical-world/",
    "/teachany/skill/assets/historical-world/"
  ];

  function tryFetch(bases, file) {
    return (function next(list) {
      if (!list.length) return Promise.reject(new Error("not-found:" + file));
      return fetch(list[0] + file, { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .catch(function () { return next(list.slice(1)); });
    })(bases.slice());
  }

  /* 简易 mercator-like 投影：把 [lon, lat] 映射到 [x, y]
     根据 metadata.recommended_bbox 自动定缩放 */
  function makeProjection(bbox, w, h, padding) {
    padding = padding || 30;
    var minLon = bbox[0], minLat = bbox[1], maxLon = bbox[2], maxLat = bbox[3];
    var spanLon = maxLon - minLon, spanLat = maxLat - minLat;
    var sx = (w - padding * 2) / spanLon;
    var sy = (h - padding * 2) / spanLat;
    var s = Math.min(sx, sy);
    var ox = padding + (w - padding * 2 - spanLon * s) / 2;
    var oy = padding + (h - padding * 2 - spanLat * s) / 2;
    return function (lon, lat) {
      return [ox + (lon - minLon) * s, h - (oy + (lat - minLat) * s)]; // 翻转 Y
    };
  }

  function pathFromGeometry(geom, project) {
    var d = "";
    function ring(coords) {
      coords.forEach(function (c, i) {
        var p = project(c[0], c[1]);
        d += (i === 0 ? "M" : "L") + p[0].toFixed(2) + "," + p[1].toFixed(2);
      });
      d += "Z";
    }
    if (geom.type === "Polygon") {
      geom.coordinates.forEach(ring);
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach(function (poly) { poly.forEach(ring); });
    } else if (geom.type === "LineString") {
      geom.coordinates.forEach(function (c, i) {
        var p = project(c[0], c[1]);
        d += (i === 0 ? "M" : "L") + p[0].toFixed(2) + "," + p[1].toFixed(2);
      });
    }
    return d;
  }

  function renderMap(host, geo, scope, config) {
    host.classList.add("thm-host");
    host.innerHTML = "";

    var bbox = (geo.metadata && geo.metadata.recommended_bbox) || [70, 15, 140, 55];
    if (scope === "world" && !(geo.metadata && geo.metadata.recommended_bbox)) {
      bbox = [-180, -60, 180, 80];
    }

    var card = document.createElement("section");
    card.className = "thm-card";

    // 标题
    var title = host.getAttribute("data-teachany-map-title") ||
      (geo.metadata && geo.metadata.dynasty_id) ||
      "历史地图";
    var period = geo.metadata && geo.metadata.period ? "（" + geo.metadata.period + "）" : "";

    var head = document.createElement("header");
    head.className = "thm-head";
    head.innerHTML =
      '<div class="thm-title-wrap">' +
        '<h3>🗺️ ' + title + '</h3>' +
        '<small>' + period +
          (geo.metadata && geo.metadata.sources ?
            '· 数据来源：' + (geo.metadata.sources.country_outline || "GeoJSON") : '') +
        '</small>' +
      '</div>' +
      '<div class="thm-toggles">' +
        '<label><input type="checkbox" data-layer="country" checked> 疆域轮廓</label>' +
        '<label><input type="checkbox" data-layer="prefecture" checked> 州府政区</label>' +
        '<label><input type="checkbox" data-layer="annotation" checked> 标注点</label>' +
      '</div>';
    card.appendChild(head);

    var stage = document.createElement("div");
    stage.className = "thm-stage";
    var w = 720, h = 460;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add("thm-svg");
    stage.appendChild(svg);
    card.appendChild(stage);

    // 信息面板
    var panel = document.createElement("div");
    panel.className = "thm-info";
    panel.innerHTML = '<p>悬停轮廓查看政权 / 政区名称；点击标注查看说明。</p>';
    card.appendChild(panel);

    host.appendChild(card);

    var project = makeProjection(bbox, w, h, 30);

    // 背景框
    var bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", w); bg.setAttribute("height", h);
    bg.setAttribute("fill", "#f8fafc");
    svg.appendChild(bg);

    // 经纬网（简易）
    var grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grid.setAttribute("class", "thm-grid");
    for (var lon = Math.ceil(bbox[0] / 10) * 10; lon <= bbox[2]; lon += 10) {
      var p1 = project(lon, bbox[1]), p2 = project(lon, bbox[3]);
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1[0]); line.setAttribute("y1", p1[1]);
      line.setAttribute("x2", p2[0]); line.setAttribute("y2", p2[1]);
      grid.appendChild(line);
    }
    for (var lat = Math.ceil(bbox[1] / 10) * 10; lat <= bbox[3]; lat += 10) {
      var q1 = project(bbox[0], lat), q2 = project(bbox[2], lat);
      var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", q1[0]); ln.setAttribute("y1", q1[1]);
      ln.setAttribute("x2", q2[0]); ln.setAttribute("y2", q2[1]);
      grid.appendChild(ln);
    }
    svg.appendChild(grid);

    // 分层组
    var gCountry = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gCountry.setAttribute("class", "thm-layer thm-country");
    var gPref = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gPref.setAttribute("class", "thm-layer thm-prefecture");
    var gAnno = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gAnno.setAttribute("class", "thm-layer thm-annotation");

    (geo.features || []).forEach(function (f) {
      var level = (f.properties && f.properties.LEVEL) || "country";
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathFromGeometry(f.geometry, project));
      path.setAttribute("class", "thm-feature thm-level-" + level);
      var label = (f.properties && (f.properties.NAME_CH || f.properties.NAME_EN || f.properties.POWER)) || "";
      path.setAttribute("data-label", label);
      path.addEventListener("mouseenter", function (e) {
        panel.innerHTML = '<strong>' + (label || "未命名") + '</strong>' +
          (f.properties.LEVEL ? ' · ' + f.properties.LEVEL : '');
      });
      (level === "country" ? gCountry : gPref).appendChild(path);
    });

    svg.appendChild(gCountry);
    svg.appendChild(gPref);

    // Annotations
    var annotations = (config && config.annotations) || [];
    annotations.forEach(function (a) {
      if (a.type === "route" && a.coords) {
        var line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        var pts = a.coords.map(function (c) { var p = project(c[0], c[1]); return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
        line.setAttribute("points", pts);
        line.setAttribute("class", "thm-route");
        line.addEventListener("mouseenter", function () { panel.innerHTML = '<strong>路线：' + (a.label || "") + '</strong>'; });
        gAnno.appendChild(line);
      }
      if (a.coord) {
        var p = project(a.coord[0], a.coord[1]);
        var marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
        marker.setAttribute("transform", "translate(" + p[0] + "," + p[1] + ")");
        marker.setAttribute("class", "thm-marker thm-marker-" + (a.type || "city"));
        var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("r", a.role === "capital" ? 5 : 3.5);
        marker.appendChild(dot);
        if (a.label) {
          var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
          t.setAttribute("x", 8); t.setAttribute("y", 4);
          t.textContent = a.label + (a.year ? "（" + a.year + "）" : "");
          marker.appendChild(t);
        }
        marker.addEventListener("click", function () {
          panel.innerHTML = '<strong>' + (a.label || a.type) + '</strong>' +
            (a.year ? '<br>年份：' + a.year : '') +
            (a.note ? '<br>' + a.note : '');
        });
        gAnno.appendChild(marker);
      }
    });
    svg.appendChild(gAnno);

    // Toggles
    head.querySelectorAll("input[data-layer]").forEach(function (chk) {
      chk.addEventListener("change", function () {
        var layer = chk.getAttribute("data-layer");
        var g = svg.querySelector(".thm-" + layer);
        if (g) g.style.display = chk.checked ? "" : "none";
      });
    });
  }

  function loadAndRender(host) {
    var id = host.getAttribute("data-teachany-map");
    var scope = host.getAttribute("data-teachany-map-scope") || "china";
    var configScript = host.querySelector("script[type='application/json'][data-teachany-map-config]");
    var config = {};
    if (configScript) {
      try { config = JSON.parse(configScript.textContent.trim()); }
      catch (e) { console.error("[TeachAnyMap] config parse error", e); }
    }

    var bases = scope === "world" ? BASE_WORLD : BASE_CHINA;
    host.innerHTML = '<div class="thm-loading">正在加载历史地图：' + id + '…</div>';
    tryFetch(bases, id + ".geojson")
      .then(function (geo) { renderMap(host, geo, scope, config); })
      .catch(function (err) {
        host.innerHTML = '<div class="thm-error">⚠ 历史地图加载失败：' + id + '。' +
          '请检查 skill/assets/historical-' + scope + '/ 下是否有对应 geojson。</div>';
        console.error("[TeachAnyMap]", err);
      });
  }

  function init() {
    document.querySelectorAll("[data-teachany-map]").forEach(loadAndRender);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
