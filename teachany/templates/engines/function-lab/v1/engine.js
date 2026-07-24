/**
 * TeachAny Function Lab Engine v1
 * 函数图像实验引擎 —— 一次/正比例/二次/反比例函数共用底座。
 * 原创实现，MIT License，TeachAny 项目所有。
 *
 * 契约：
 *   window.TeachAnyEngines['function-lab'] = {
 *     version: '1',
 *     mount(container, config) -> instance { destroy(), getState(), setParam(k,v) }
 *   }
 * config 结构见 docs/engine-config-schema.md（courseware.config.json）。
 */
(function () {
  'use strict';

  var ENGINE_ID = 'function-lab';
  var ENGINE_VERSION = '1';

  // ---------- 主题（TeachAny 浅色体系） ----------
  var THEME = {
    bg: '#ffffff',
    gridMinor: '#eef2f7',
    gridMajor: '#dbe4ee',
    axis: '#475569',
    axisLabel: '#64748b',
    curve: '#3b82f6',
    curveCompare: '#f59e0b',
    point: '#ef4444',
    trace: '#0f172a',
    asymptote: '#94a3b8',
    panel: '#f8fafc',
    panelBorder: '#e2e8f0',
    text: '#1e293b',
    textLight: '#64748b',
    primary: '#3b82f6',
    secondary: '#06b6d4'
  };

  // ---------- 函数定义库（可扩展） ----------
  var FUNCTION_TYPES = {
    linear: {
      label: '一次函数',
      formula: function (p) { return 'y = ' + fmt(p.k) + 'x' + (p.b >= 0 ? ' + ' : ' − ') + fmt(Math.abs(p.b)); },
      eval: function (x, p) { return p.k * x + p.b; },
      params: {
        k: { label: '斜率 k', min: -5, max: 5, step: 0.5, def: 1 },
        b: { label: '截距 b', min: -8, max: 8, step: 0.5, def: 2 }
      },
      keyPoints: function (p) {
        var pts = [{ x: 0, y: p.b, label: 'y轴截距 (0, ' + fmt(p.b) + ')' }];
        if (p.k !== 0) pts.push({ x: -p.b / p.k, y: 0, label: 'x轴截距 (' + fmt(-p.b / p.k) + ', 0)' });
        return pts;
      }
    },
    proportional: {
      label: '正比例函数',
      formula: function (p) { return 'y = ' + fmt(p.k) + 'x'; },
      eval: function (x, p) { return p.k * x; },
      params: {
        k: { label: '比例系数 k', min: -5, max: 5, step: 0.5, def: 2 }
      },
      keyPoints: function () { return [{ x: 0, y: 0, label: '必过原点 (0, 0)' }]; }
    },
    quadratic: {
      label: '二次函数（顶点式）',
      formula: function (p) {
        return 'y = ' + fmt(p.a) + '(x ' + (p.h >= 0 ? '− ' : '+ ') + fmt(Math.abs(p.h)) + ')² ' +
               (p.k >= 0 ? '+ ' : '− ') + fmt(Math.abs(p.k));
      },
      eval: function (x, p) { return p.a * (x - p.h) * (x - p.h) + p.k; },
      params: {
        a: { label: '开口 a', min: -3, max: 3, step: 0.25, def: 1 },
        h: { label: '对称轴 h', min: -6, max: 6, step: 0.5, def: 0 },
        k: { label: '顶点纵坐标 k', min: -8, max: 8, step: 0.5, def: 0 }
      },
      keyPoints: function (p) {
        return [{ x: p.h, y: p.k, label: '顶点 (' + fmt(p.h) + ', ' + fmt(p.k) + ')' }];
      },
      extras: function (p) { return { axisOfSymmetry: p.h }; }
    },
    inverse: {
      label: '反比例函数',
      formula: function (p) { return 'y = ' + fmt(p.k) + ' / x'; },
      eval: function (x, p) { return x === 0 ? NaN : p.k / x; },
      params: {
        k: { label: '比例系数 k', min: -12, max: 12, step: 1, def: 6 }
      },
      keyPoints: function () { return []; },
      extras: function () { return { verticalAsymptote: 0, horizontalAsymptote: 0 }; },
      // 反比例函数在 x=0 断开：采样时跳过 |x| < eps
      discontinuity: function (x) { return Math.abs(x) < 1e-9; }
    }
  };

  function fmt(v) {
    if (!isFinite(v)) return '--';
    var r = Math.round(v * 100) / 100;
    return String(r).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }

  // ---------- 场景实现 ----------
  function createScene(container, config) {
    var cfg = normalizeConfig(config);
    var fnType = FUNCTION_TYPES[cfg.functionType];

    // 视图状态：数学坐标系中心（cx, cy）+ 缩放（pixels per unit）
    var view = { cx: 0, cy: 0, scale: 0 };
    var params = {};       // 主曲线参数
    var compareParams = {};// 对照曲线参数
    var compareOn = false;
    var trace = { x: 1, visible: true };
    var anim = { playing: false, key: null, dir: 1 };

    var listeners = [];
    var rafId = 0;
    var resizeObserver = null;
    var destroyed = false;

    // ---------- DOM ----------
    container.classList.add('ta-flab');
    container.innerHTML =
      '<div class="ta-flab-canvas-wrap">' +
      '  <canvas class="ta-flab-canvas"></canvas>' +
      '  <div class="ta-flab-readout">' +
      '    <span class="ta-flab-formula"></span>' +
      '    <span class="ta-flab-trace"></span>' +
      '  </div>' +
      '  <div class="ta-flab-zoom">' +
      '    <button data-zoom="in" aria-label="放大">+</button>' +
      '    <button data-zoom="out" aria-label="缩小">−</button>' +
      '    <button data-zoom="reset" aria-label="复位">⌂</button>' +
      '  </div>' +
      '</div>' +
      '<div class="ta-flab-controls"></div>';

    var canvas = container.querySelector('.ta-flab-canvas');
    var controlsEl = container.querySelector('.ta-flab-controls');
    var formulaEl = container.querySelector('.ta-flab-formula');
    var traceEl = container.querySelector('.ta-flab-trace');
    var ctx = canvas.getContext('2d');

    injectStyle(container);

    // ---------- 参数与控件 ----------
    function initParams() {
      var defs = fnType.params;
      Object.keys(defs).forEach(function (k) {
        var override = (cfg.params && cfg.params[k]) || {};
        params[k] = num(override.default, defs[k].def);
        compareParams[k] = params[k];
      });
      if (cfg.functionType === 'quadratic') compareParams.a = -params.a; // 默认开口反向对照
      if (cfg.functionType === 'linear') compareParams.b = params.b + 2;
      if (cfg.functionType === 'inverse') compareParams.k = -params.k;
      if (cfg.functionType === 'proportional') compareParams.k = params.k * 2;
    }

    function buildControls() {
      controlsEl.innerHTML = '';
      var defs = fnType.params;
      Object.keys(defs).forEach(function (key) {
        var d = defs[key];
        var override = (cfg.params && cfg.params[key]) || {};
        var row = document.createElement('div');
        row.className = 'ta-flab-ctrl';
        row.innerHTML =
          '<label>' + (override.label || d.label) + '</label>' +
          '<input type="range" min="' + num(override.min, d.min) + '" max="' + num(override.max, d.max) +
          '" step="' + num(override.step, d.step) + '" value="' + params[key] + '">' +
          '<span class="ta-flab-val">' + fmt(params[key]) + '</span>';
        var slider = row.querySelector('input');
        var val = row.querySelector('.ta-flab-val');
        on(slider, 'input', function () {
          params[key] = num(slider.value, d.def);
          val.textContent = fmt(params[key]);
          draw();
        });
        // 双击进入参数动画
        on(row.querySelector('label'), 'dblclick', function () { toggleAnim(key); });
        controlsEl.appendChild(row);
      });

      var btnRow = document.createElement('div');
      btnRow.className = 'ta-flab-btns';
      if (cfg.features.compare) {
        var cmp = document.createElement('button');
        cmp.className = 'ta-flab-btn';
        cmp.textContent = '对照曲线';
        on(cmp, 'click', function () {
          compareOn = !compareOn;
          cmp.classList.toggle('is-on', compareOn);
          draw();
        });
        btnRow.appendChild(cmp);
      }
      if (cfg.features.animate) {
        var play = document.createElement('button');
        play.className = 'ta-flab-btn';
        play.textContent = '▶ 参数动画';
        on(play, 'click', function () {
          var firstKey = Object.keys(fnType.params)[0];
          toggleAnim(anim.playing ? null : firstKey);
          play.textContent = anim.playing ? '⏸ 停止动画' : '▶ 参数动画';
        });
        btnRow.appendChild(play);
      }
      controlsEl.appendChild(btnRow);

      if (cfg.hint) {
        var hint = document.createElement('p');
        hint.className = 'ta-flab-hint';
        hint.textContent = cfg.hint;
        controlsEl.appendChild(hint);
      }
    }

    function toggleAnim(key) {
      if (anim.playing && anim.key === key) { anim.playing = false; anim.key = null; return; }
      anim.playing = !!key;
      anim.key = key;
      anim.dir = 1;
    }

    function stepAnim() {
      if (!anim.playing || !anim.key) return;
      var d = fnType.params[anim.key];
      var v = params[anim.key] + d.step * anim.dir * 0.25;
      if (v >= d.max) { v = d.max; anim.dir = -1; }
      if (v <= d.min) { v = d.min; anim.dir = 1; }
      params[anim.key] = v;
      // 同步滑块显示
      var rows = controlsEl.querySelectorAll('.ta-flab-ctrl');
      Object.keys(fnType.params).forEach(function (k, i) {
        if (k === anim.key && rows[i]) {
          rows[i].querySelector('input').value = v;
          rows[i].querySelector('.ta-flab-val').textContent = fmt(v);
        }
      });
    }

    // ---------- 坐标变换 ----------
    function toPx(x, y) {
      var r = canvas.getBoundingClientRect();
      return { x: r.width / 2 + (x - view.cx) * view.scale, y: r.height / 2 - (y - view.cy) * view.scale };
    }
    toPx.x = function (x) { var r = canvas.getBoundingClientRect(); return r.width / 2 + (x - view.cx) * view.scale; };
    toPx.y = function (y) { var r = canvas.getBoundingClientRect(); return r.height / 2 - (y - view.cy) * view.scale; };
    function toMathX(px) { var r = canvas.getBoundingClientRect(); return (px - r.width / 2) / view.scale + view.cx; }
    function toMathY(py) { var r = canvas.getBoundingClientRect(); return view.cy - (py - r.height / 2) / view.scale; }

    // ---------- 渲染 ----------
    function fitCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!view.scale) {
        var range = cfg.features.gridRange;
        view.scale = Math.min(rect.width, rect.height) / (range * 2.2);
      }
      draw();
    }

    function drawGrid() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, w, h);

      var step = niceStep(1);
      var minor = step / 5;
      var x0 = toMathX(0), x1 = toMathX(w);
      var y1 = toMathY(0), y0 = toMathY(h);

      var i, x, y, px, py;
      // 细网格
      ctx.strokeStyle = THEME.gridMinor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (x = Math.floor(x0 / minor) * minor; x <= x1; x += minor) { px = toPx.x(x); ctx.moveTo(px, 0); ctx.lineTo(px, h); }
      for (y = Math.floor(y0 / minor) * minor; y <= y1; y += minor) { py = toPx.y(y); ctx.moveTo(0, py); ctx.lineTo(w, py); }
      ctx.stroke();
      // 主网格
      ctx.strokeStyle = THEME.gridMajor;
      ctx.beginPath();
      for (x = Math.floor(x0 / step) * step; x <= x1; x += step) { px = toPx.x(x); ctx.moveTo(px, 0); ctx.lineTo(px, h); }
      for (y = Math.floor(y0 / step) * step; y <= y1; y += step) { py = toPx.y(y); ctx.moveTo(0, py); ctx.lineTo(w, py); }
      ctx.stroke();
      // 坐标轴
      ctx.strokeStyle = THEME.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, toPx.y(0)); ctx.lineTo(w, toPx.y(0));
      ctx.moveTo(toPx.x(0), 0); ctx.lineTo(toPx.x(0), h);
      ctx.stroke();
      // 轴刻度数字（稀疏）
      ctx.fillStyle = THEME.axisLabel;
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (x = Math.ceil(x0 / step); x <= x1 / step; x++) {
        if (x === 0) continue;
        var vx = x * step;
        if (Math.abs(vx) < step / 2) continue;
        ctx.fillText(fmt(vx), toPx.x(vx), toPx.y(0) + 6);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (y = Math.ceil(y0 / step); y <= y1 / step; y++) {
        if (y === 0) continue;
        var vy = y * step;
        if (Math.abs(vy) < step / 2) continue;
        ctx.fillText(fmt(vy), toPx.x(0) - 6, toPx.y(vy));
      }
      ctx.fillText('O', toPx.x(0) - 6, toPx.y(0) + 10);
      return step;
    }

    function niceStep(rawUnit) {
      // 目标：主网格间距 ≥ 44px
      var want = 44 / view.scale;
      var pow = Math.pow(10, Math.floor(Math.log10(want)));
      var n = want / pow;
      var m = n >= 5 ? 10 : n >= 2 ? 5 : n >= 1 ? 2 : 1;
      return pow * m / 2 * 2; // 1/2/5 序列
    }

    function drawCurve(p, color, width, dash) {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      var pen = false;
      var prevY = 0;
      for (var px = 0; px <= w; px += 1) {
        var x = toMathX(px);
        if (fnType.discontinuity && fnType.discontinuity(x)) { pen = false; continue; }
        var y = fnType.eval(x, p);
        if (!isFinite(y)) { pen = false; continue; }
        var py = toPx.y(y);
        // 跨越渐近线/屏幕外大跳变时抬笔
        if (pen && Math.abs(py - prevY) > rect.height * 2) pen = false;
        if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
        prevY = py;
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawExtras() {
      if (!fnType.extras) return;
      var ex = fnType.extras(params);
      var rect = canvas.getBoundingClientRect();
      ctx.save();
      ctx.strokeStyle = THEME.asymptote;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1;
      if (typeof ex.axisOfSymmetry === 'number') {
        ctx.beginPath();
        ctx.moveTo(toPx.x(ex.axisOfSymmetry), 0);
        ctx.lineTo(toPx.x(ex.axisOfSymmetry), rect.height);
        ctx.stroke();
      }
      if (typeof ex.verticalAsymptote === 'number') {
        ctx.beginPath();
        ctx.moveTo(toPx.x(ex.verticalAsymptote), 0);
        ctx.lineTo(toPx.x(ex.verticalAsymptote), rect.height);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawKeyPoints() {
      if (!cfg.features.keyPoints) return;
      var pts = fnType.keyPoints(params);
      ctx.save();
      pts.forEach(function (pt) {
        var px = toPx.x(pt.x), py = toPx.y(pt.y);
        ctx.fillStyle = THEME.point;
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = THEME.text;
        ctx.font = '12px PingFang SC, Microsoft YaHei, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(pt.label, px + 8, py - 6);
      });
      ctx.restore();
    }

    function drawTrace() {
      if (!trace.visible || !cfg.features.trace) return;
      var y = fnType.eval(trace.x, params);
      if (!isFinite(y)) return;
      var px = toPx.x(trace.x), py = toPx.y(y);
      ctx.save();
      ctx.strokeStyle = 'rgba(15,23,42,0.25)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(px, toPx.y(0)); ctx.lineTo(px, py);
      ctx.lineTo(toPx.x(0), py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = THEME.trace;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      traceEl.textContent = '  P(' + fmt(trace.x) + ', ' + fmt(y) + ')';
    }

    function draw() {
      if (destroyed) return;
      drawGrid();
      drawExtras();
      if (compareOn) drawCurve(compareParams, THEME.curveCompare, 2, [7, 5]);
      drawCurve(params, THEME.curve, 2.5);
      drawKeyPoints();
      drawTrace();
      formulaEl.textContent = fnType.formula(params);
    }

    // ---------- 交互：拖拽平移 / 滚轮缩放 / 追踪点 ----------
    var drag = null;
    on(canvas, 'pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
      try { canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    on(canvas, 'pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      if (!drag) {
        // 悬停追踪
        trace.x = snap(toMathX(e.clientX - rect.left));
        draw();
        return;
      }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      view.cx = drag.cx - dx / view.scale;
      view.cy = drag.cy + dy / view.scale;
      draw();
    });
    on(canvas, 'pointerup', function (e) {
      if (drag && !drag.moved) {
        var rect = canvas.getBoundingClientRect();
        trace.x = snap(toMathX(e.clientX - rect.left));
      }
      drag = null;
      draw();
    });
    on(canvas, 'wheel', function (e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      view.scale = clamp(view.scale * factor, 6, 600);
      draw();
    }, { passive: false });

    container.querySelector('[data-zoom="in"]').addEventListener('click', function () { view.scale = clamp(view.scale * 1.25, 6, 600); draw(); });
    container.querySelector('[data-zoom="out"]').addEventListener('click', function () { view.scale = clamp(view.scale / 1.25, 6, 600); draw(); });
    container.querySelector('[data-zoom="reset"]').addEventListener('click', function () { view.cx = 0; view.cy = 0; view.scale = 0; fitCanvas(); });

    function snap(v) { return Math.round(v * 4) / 4; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    // ---------- 动画帧 ----------
    function loop() {
      if (destroyed) return;
      if (anim.playing) { stepAnim(); draw(); }
      rafId = requestAnimationFrame(loop);
    }

    // ---------- 工具 ----------
    function on(el, type, handler, opts) {
      el.addEventListener(type, handler, opts);
      listeners.push({ el: el, type: type, handler: handler, opts: opts });
    }

    // ---------- 启动 ----------
    initParams();
    buildControls();
    if (resizeObserver === null && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(function () { fitCanvas(); });
      resizeObserver.observe(canvas.parentElement);
    }
    on(window, 'resize', fitCanvas);
    fitCanvas();
    loop();

    // ---------- 实例 ----------
    return {
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(rafId);
        resizeObserver && resizeObserver.disconnect();
        listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.handler, l.opts); });
        listeners = [];
        container.innerHTML = '';
        container.classList.remove('ta-flab');
      },
      getState: function () { return { params: Object.assign({}, params), view: Object.assign({}, view) }; },
      setParam: function (k, v) { if (k in params) { params[k] = num(v, params[k]); buildControls(); draw(); } }
    };
  }

  // ---------- 配置归一化 ----------
  function normalizeConfig(config) {
    config = config || {};
    var type = FUNCTION_TYPES[config.functionType] ? config.functionType : 'linear';
    var f = config.features || {};
    return {
      functionType: type,
      params: config.params || {},
      hint: config.hint || '',
      features: {
        keyPoints: f.keyPoints !== false,
        trace: f.trace !== false,
        compare: f.compare !== false,
        animate: f.animate !== false,
        gridRange: num(f.gridRange, 10)
      }
    };
  }

  // ---------- 样式（作用域隔离） ----------
  function injectStyle(container) {
    var STYLE_ID = 'ta-flab-style';
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.ta-flab{display:flex;flex-direction:column;gap:14px;width:100%;font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:' + THEME.text + '}' +
      '.ta-flab-canvas-wrap{position:relative;width:100%;height:min(62vw,460px);min-height:300px;border:1px solid ' + THEME.panelBorder + ';border-radius:14px;overflow:hidden;background:' + THEME.bg + '}' +
      '.ta-flab-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}' +
      '.ta-flab-canvas:active{cursor:grabbing}' +
      '.ta-flab-readout{position:absolute;left:12px;top:10px;display:flex;flex-direction:column;gap:2px;pointer-events:none}' +
      '.ta-flab-formula{font:700 15px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:' + THEME.text + ';background:rgba(255,255,255,.85);padding:2px 8px;border-radius:8px;width:max-content}' +
      '.ta-flab-trace{font:600 12px/1.4 ui-monospace,Menlo,monospace;color:' + THEME.textLight + ';background:rgba(255,255,255,.75);padding:2px 8px;border-radius:8px;width:max-content}' +
      '.ta-flab-zoom{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px}' +
      '.ta-flab-zoom button{width:32px;height:32px;border-radius:9px;border:1px solid ' + THEME.panelBorder + ';background:#fff;color:' + THEME.text + ';font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 1px 3px rgba(15,23,42,.08)}' +
      '.ta-flab-zoom button:hover{border-color:' + THEME.primary + ';color:' + THEME.primary + '}' +
      '.ta-flab-controls{display:flex;flex-direction:column;gap:10px;background:' + THEME.panel + ';border:1px solid ' + THEME.panelBorder + ';border-radius:14px;padding:14px 16px}' +
      '.ta-flab-ctrl{display:grid;grid-template-columns:110px 1fr 52px;align-items:center;gap:10px}' +
      '.ta-flab-ctrl label{font-size:13px;font-weight:600;color:' + THEME.text + '}' +
      '.ta-flab-ctrl input[type=range]{width:100%;accent-color:' + THEME.primary + ';height:4px}' +
      '.ta-flab-val{font:700 13px ui-monospace,Menlo,monospace;color:' + THEME.primary + ';text-align:right}' +
      '.ta-flab-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '.ta-flab-btn{padding:7px 16px;border-radius:999px;border:1px solid ' + THEME.panelBorder + ';background:#fff;font-size:13px;font-weight:600;color:' + THEME.text + ';cursor:pointer;transition:all .15s}' +
      '.ta-flab-btn:hover{border-color:' + THEME.primary + ';color:' + THEME.primary + '}' +
      '.ta-flab-btn.is-on{background:linear-gradient(135deg,' + THEME.primary + ',' + THEME.secondary + ');color:#fff;border-color:transparent}' +
      '.ta-flab-hint{margin:0;font-size:12px;color:' + THEME.textLight + '}' +
      '@media (max-width:640px){.ta-flab-ctrl{grid-template-columns:88px 1fr 44px}.ta-flab-canvas-wrap{height:min(78vw,380px)}}';
    document.head.appendChild(s);
  }

  // ---------- 注册 ----------
  window.TeachAnyEngines = window.TeachAnyEngines || {};
  window.TeachAnyEngines[ENGINE_ID] = {
    version: ENGINE_VERSION,
    mount: function (container, config) { return createScene(container, config); }
  };
})();
