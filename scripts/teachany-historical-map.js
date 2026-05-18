/*! TeachAny Standard Historical Map · v2.0 (Leaflet based)
 * ─────────────────────────────────────────────────────────
 * 参考稳定实现：community/history-medieval-europe
 * 特点：真 Leaflet 地图引擎 + 本地 geojson + 朝代切换 + 城市标注 + 暗色主题
 *
 * 用法（HTML）：
 *   <!-- 1. 引入 Leaflet + 本模块 -->
 *   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
 *   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
 *   <link rel="stylesheet" href="../../scripts/teachany-historical-map.css">
 *   <script src="../../scripts/teachany-historical-map.js" defer></script>
 *
 *   <!-- 2. 在课件任意位置声明 -->
 *   <div data-teachany-map="my-map"
 *        data-teachany-map-scope="china"
 *        data-teachany-map-title="中国朝代演变">
 *     <script type="application/json" data-teachany-map-config>
 *     {
 *       "eras": [
 *         {
 *           "id": "qin", "label": "秦 (前221)",
 *           "file": "qin-dynasty.geojson",
 *           "desc": "<strong>秦统一中国</strong>：郡县制替代分封制…",
 *           "fill": "#6366f1", "stroke": "#4f46e5",
 *           "cities": [
 *             [34.27, 108.95, "咸阳", "Xianyang", "秦都，中央集权起点"],
 *             [34.75, 113.65, "郑州", "Zhengzhou", "中原要冲"]
 *           ]
 *         },
 *         {
 *           "id": "han", "label": "汉 (前202)",
 *           "file": "han-dynasty.geojson",
 *           "desc": "汉承秦制…",
 *           "fill": "#f59e0b", "stroke": "#d97706",
 *           "cities": [...]
 *         }
 *       ],
 *       "center": [34, 108],
 *       "zoom": 4,
 *       "fitBounds": [[15, 70], [55, 145]]
 *     }
 *     </script>
 *   </div>
 *
 * 注意：
 *   - geojson 文件路径相对于课件目录的 `assets/maps/<file>` 或全局 `/skill/assets/historical-{scope}/<file>`
 *   - scope 可选：china / world / custom
 *   - hillshade 可选：`assets/maps/hillshade.jpg`（有则自动叠加）
 */
(function () {
  "use strict";
  if (window.__TeachAnyMapInit) return;
  window.__TeachAnyMapInit = true;

  if (typeof L === "undefined") {
    console.error("[TeachAnyMap] Leaflet 未加载。请在引入本模块前先引入 leaflet.js 和 leaflet.css");
    return;
  }

  var GEOJSON_SEARCH_PATHS = function (scope, file) {
    // file 可能是 'qin-dynasty.geojson' 或 '009-ce-500.geojson' 或完整路径
    if (file.startsWith("http") || file.startsWith("/") || file.startsWith("./") || file.startsWith("../")) {
      return [file];
    }
    var bases = [];
    // 优先课件本地 assets/maps/
    bases.push("./assets/maps/" + file);
    bases.push("assets/maps/" + file);
    // 回退到 skill 仓库（相对路径）
    var scopeDir = scope === "world" ? "historical-world" : scope === "china" ? "historical-china" : "historical-" + scope;
    bases.push("../../skill/assets/" + scopeDir + "/" + file);
    bases.push("../skill/assets/" + scopeDir + "/" + file);
    bases.push("/teachany/skill/assets/" + scopeDir + "/" + file);
    return bases;
  };

  function fetchGeoJSON(scope, file) {
    var paths = GEOJSON_SEARCH_PATHS(scope, file);
    return (function next(list) {
      if (!list.length) return Promise.reject(new Error("geojson-not-found:" + file));
      return fetch(list[0], { cache: "force-cache" })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .catch(function () { return next(list.slice(1)); });
    })(paths.slice());
  }

  function readConfig(host) {
    var script = host.querySelector("script[type='application/json'][data-teachany-map-config]");
    if (!script) return null;
    try {
      return JSON.parse(script.textContent.trim());
    } catch (e) {
      console.error("[TeachAnyMap] config JSON 解析失败", e);
      return null;
    }
  }

  function buildHeader(title, eras, currentEraId, onSwitch) {
    var wrap = document.createElement("div");
    wrap.className = "thm-header";
    if (title) {
      var h = document.createElement("h3");
      h.className = "thm-title";
      h.textContent = "🗺️ " + title;
      wrap.appendChild(h);
    }
    var btnBar = document.createElement("div");
    btnBar.className = "thm-era-btns";
    eras.forEach(function (e) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thm-era-btn" + (e.id === currentEraId ? " active" : "");
      btn.setAttribute("data-era", e.id);
      btn.textContent = e.label || e.id;
      btn.addEventListener("click", function () {
        wrap.querySelectorAll(".thm-era-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        onSwitch(e.id);
      });
      btnBar.appendChild(btn);
    });
    wrap.appendChild(btnBar);
    return wrap;
  }

  function buildLegend() {
    var wrap = document.createElement("div");
    wrap.className = "thm-legend";
    wrap.innerHTML =
      '<span class="thm-legend-item"><span class="thm-legend-dot" style="background:#ef4444"></span>重要城市</span>' +
      '<span class="thm-legend-item"><span class="thm-legend-line" style="background:#6366f1"></span>疆域边界</span>' +
      '<span class="thm-legend-item thm-legend-hint">点击城市查看详情 · 悬停区域高亮</span>';
    return wrap;
  }

  function mount(host) {
    var cfg = readConfig(host);
    if (!cfg || !Array.isArray(cfg.eras) || !cfg.eras.length) {
      host.innerHTML = '<div class="thm-error">⚠ 地图配置缺失：需要在 <code>&lt;script type="application/json" data-teachany-map-config&gt;</code> 中提供 eras 数组</div>';
      return;
    }
    var mapId = host.getAttribute("data-teachany-map") || ("thm-map-" + Math.random().toString(36).slice(2, 8));
    var scope = host.getAttribute("data-teachany-map-scope") || "china";
    var title = host.getAttribute("data-teachany-map-title") || "";

    host.classList.add("thm-host");
    host.innerHTML = "";

    // UI 骨架
    var header = null;
    var currentEra = cfg.eras[0].id;
    var mapEl = document.createElement("div");
    mapEl.className = "thm-map-container";
    mapEl.id = mapId;

    var descEl = document.createElement("div");
    descEl.className = "thm-era-desc";

    var legendEl = buildLegend();

    header = buildHeader(title, cfg.eras, currentEra, function (eraId) {
      currentEra = eraId;
      loadEra(eraId);
    });

    host.appendChild(header);
    host.appendChild(mapEl);
    host.appendChild(descEl);
    host.appendChild(legendEl);

    // Leaflet 地图初始化
    var map = L.map(mapId, {
      center: cfg.center || [34, 108],
      zoom: cfg.zoom || 4,
      crs: L.CRS.EPSG4326,
      maxBounds: cfg.maxBounds || [[-90, -180], [90, 180]],
      zoomControl: true,
      minZoom: cfg.minZoom || 2,
      maxZoom: cfg.maxZoom || 8,
      worldCopyJump: false,
      attributionControl: false
    });

    if (cfg.fitBounds) {
      try { map.fitBounds(cfg.fitBounds); } catch (e) {}
    }

    // v2.3: 瓦片底图 + hillshade 叠加层
    // 默认使用 CartoDB DarkMatter 瓦片作为地理参考底图
    // 可选叠加 hillshade 影像增强地形感
    var tileLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
        opacity: 0.7,
        attribution: "© CARTO © OSM contributors"
      }
    ).addTo(map);

    // hillshade 叠加层（可选，默认关闭，cfg.hillshade=true 时开启）
    if (cfg.hillshade === true || cfg.hillshade) {
      var hillsrc = typeof cfg.hillshade === "string" ? cfg.hillshade : "./assets/maps/hillshade.jpg";
      var img = new Image();
      img.onload = function () {
        L.imageOverlay(hillsrc, [[-90, -180], [90, 180]], {
          opacity: 0.35,
          interactive: false,
          zIndex: 200
        }).addTo(map);
      };
      img.onerror = function () {
        // 静默降级
      };
      img.src = hillsrc;
    }

    // attribution 自定义
    L.control.attribution({ prefix: false })
      .addAttribution('数据 © TeachAny / Historical Basemaps · Leaflet')
      .addTo(map);

    var currentEraLayer = null;
    var currentCityLayer = null;
    var overlayLayers = []; // v2.2: CHGIS 细节叠加层（关隘/河流/古城/丝路），不随朝代切换

    // v2.2: overlays 叠加层渲染（关隘、历史河流、丝绸之路等 CHGIS 细节）
    // 配置示例：overlays: [{id, file, label, style: {color, weight, radius, dashArray}, visible: true}]
    function renderOverlays() {
      if (!Array.isArray(cfg.overlays) || !cfg.overlays.length) return;
      cfg.overlays.forEach(function (ov) {
        if (!ov.file) return;
        // overlays 文件默认在 details 子目录
        var file = ov.file.indexOf("/") >= 0 ? ov.file : ("details/" + ov.file);
        fetchGeoJSON(scope, file)
          .then(function (data) {
            var style = ov.style || {};
            var color = style.color || "#dc2626";
            var weight = style.weight || 2;
            var radius = style.radius || 4;
            var dash = style.dashArray || null;
            var layer = L.geoJSON(data, {
              pointToLayer: function (feature, latlng) {
                // 点数据（关隘、古城扩充）
                var featColor = (feature.properties && feature.properties.color) || color;
                return L.circleMarker(latlng, {
                  radius: radius,
                  fillColor: featColor,
                  color: "#fff",
                  weight: 1.2,
                  fillOpacity: 0.9
                });
              },
              style: function (feature) {
                // 线/面数据（河流、丝路）—— 允许每条 feature 自定义 color
                var featColor = (feature.properties && feature.properties.color) || color;
                return {
                  color: featColor,
                  weight: weight,
                  opacity: 0.85,
                  dashArray: dash,
                  fillColor: featColor,
                  fillOpacity: 0.15
                };
              },
              onEachFeature: function (feature, l) {
                var p = feature.properties || {};
                var name = p.name || p.NAME_CH || p.NAME_EN || "";
                var cat = p.category || p.period || p.dynasty || "";
                var note = p.note || "";
                if (name) {
                  var html = '<div class="thm-city-popup"><b>' + name + '</b>' +
                    (cat ? ' <span style="color:#fbbf24">· ' + cat + '</span>' : '') +
                    (note ? '<br><span>' + note + '</span>' : '') + '</div>';
                  l.bindPopup(html, { className: "thm-popup" });
                  l.bindTooltip(name, { sticky: true, className: "thm-feature-tip" });
                }
              }
            });
            if (ov.visible !== false) layer.addTo(map);
            overlayLayers.push({ id: ov.id, label: ov.label || ov.id, layer: layer, visible: ov.visible !== false });
            refreshOverlayToggle();
          })
          .catch(function (err) {
            console.warn("[TeachAnyMap] overlay 加载失败（不阻塞）：", ov.file, err);
          });
      });
    }

    // 叠加层开关 UI（在 legend 后追加）
    var overlayToggleEl = null;
    function refreshOverlayToggle() {
      if (!overlayLayers.length) return;
      if (!overlayToggleEl) {
        overlayToggleEl = document.createElement("div");
        overlayToggleEl.className = "thm-overlay-toggle";
        host.appendChild(overlayToggleEl);
      }
      overlayToggleEl.innerHTML = '<span class="thm-overlay-label">细节图层：</span>';
      overlayLayers.forEach(function (o) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "thm-overlay-btn" + (o.visible ? " active" : "");
        btn.textContent = o.label;
        btn.addEventListener("click", function () {
          if (o.visible) { map.removeLayer(o.layer); o.visible = false; btn.classList.remove("active"); }
          else { o.layer.addTo(map); o.visible = true; btn.classList.add("active"); }
        });
        overlayToggleEl.appendChild(btn);
      });
    }

    function loadEra(eraId) {
      var era = cfg.eras.find(function (e) { return e.id === eraId; }) || cfg.eras[0];
      if (!era) return;

      descEl.innerHTML = era.desc || "";

      if (currentEraLayer) { map.removeLayer(currentEraLayer); currentEraLayer = null; }
      if (currentCityLayer) { map.removeLayer(currentCityLayer); currentCityLayer = null; }

      if (era.file) {
        fetchGeoJSON(scope, era.file)
          .then(function (data) {
            var fill = era.fill || "#6366f1";
            var stroke = era.stroke || "#4f46e5";
            currentEraLayer = L.geoJSON(data, {
              style: function (feature) {
                // 尊重 feature.properties.LEVEL 分层：country 深色，prefecture 浅色
                var lvl = feature.properties && feature.properties.LEVEL;
                var nameCh = (feature.properties && feature.properties.NAME_CH) || "";
                // 匈奴等周边政权用虚线边框、浅色填充，与主体疆域区分
                var isNeighbor = /匈奴|鲜卑|乌桓|羌|哀牢|朝鲜|卫氏|高句丽|百济|新罗|倭/.test(nameCh);
                var isNeighborEn = /^(Xiongnu|Southern Xiongnu|Xianbei|Wuhuan|Goguryeo|Baekje|Silla|Wa|Gojoseon)$/i.test((feature.properties && feature.properties.NAME) || "");
                if (isNeighbor || isNeighborEn) {
                  return {
                    fillColor: "#94a3b8",
                    fillOpacity: lvl === "prefecture" ? 0.06 : 0.12,
                    color: "#64748b",
                    weight: 1.2,
                    opacity: 0.6,
                    dashArray: "6,4"
                  };
                }
                return {
                  fillColor: fill,
                  fillOpacity: lvl === "prefecture" ? 0.12 : 0.28,
                  color: stroke,
                  weight: lvl === "prefecture" ? 0.7 : 1.4,
                  opacity: 0.75
                };
              },
              onEachFeature: function (feature, layer) {
                var name = (feature.properties && (feature.properties.NAME_CH || feature.properties.NAME_EN || feature.properties.POWER)) || "";
                if (name) layer.bindTooltip(name, { sticky: true, className: "thm-feature-tip" });
                layer.on({
                  mouseover: function (e) {
                    e.target.setStyle({ weight: 3, color: "#fbbf24", fillOpacity: 0.5 });
                    if (!L.Browser.ie && !L.Browser.opera) e.target.bringToFront();
                  },
                  mouseout: function (e) {
                    currentEraLayer.resetStyle(e.target);
                  }
                });
              }
            }).addTo(map);
          })
          .catch(function (err) {
            console.error("[TeachAnyMap] geojson 加载失败：", era.file, err);
            descEl.innerHTML = '<div class="thm-error">⚠ 地图数据 <code>' + era.file + '</code> 加载失败。请检查 <code>assets/maps/</code> 或 <code>skill/assets/historical-' + scope + '/</code> 是否存在该文件。</div>';
          });
      }

      // 城市标注
      if (Array.isArray(era.cities) && era.cities.length) {
        var cityGroup = L.layerGroup();
        era.cities.forEach(function (c) {
          // c = [lat, lng, 中文名, 英文名, 描述]
          var lat = c[0], lng = c[1], zh = c[2], en = c[3], note = c[4];
          var marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: "#ef4444",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.95
          });
          var popup = '<div class="thm-city-popup">' +
            '<b>' + zh + '</b>' + (en ? ' · <i>' + en + '</i>' : '') +
            (note ? '<br><span>' + note + '</span>' : '') +
            '</div>';
          marker.bindPopup(popup, { className: "thm-popup" });
          // 标签
          var tooltip = L.tooltip({
            permanent: true,
            direction: "right",
            offset: [8, 0],
            className: "thm-city-label"
          }).setContent(zh);
          marker.bindTooltip(tooltip);
          cityGroup.addLayer(marker);
        });
        cityGroup.addTo(map);
        currentCityLayer = cityGroup;
      }
    }

    // 初始加载
    loadEra(currentEra);
    // v2.2: 一次性渲染 CHGIS 细节叠加层（与朝代独立）
    renderOverlays();

    // 响应容器 resize
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        setTimeout(function () { map.invalidateSize(); }, 150);
      });
      ro.observe(mapEl);
    }
  }

  function init() {
    document.querySelectorAll("[data-teachany-map]").forEach(mount);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.TeachAnyHistoricalMap = { __version: "2.3-tile-basemap", mount: mount };
})();
