/**
 * TeachAny Circuit Lab Engine v1
 * 电路实验引擎 —— 欧姆定律/串并联/电功率探究共用底座（v1 实现欧姆定律探究）。
 * 原创实现，MIT License，TeachAny 项目所有。
 *
 * 教学模型：控制变量法。
 *   模式 u-mode：R 不变，改变 U，记录 I，验证 I ∝ U
 *   模式 r-mode：U 不变，改变 R，记录 I，验证 I ∝ 1/R
 * 画布左：电路示意图（电源/开关/电流表/定值电阻/电压表/电子流动画）
 * 画布右：I-U / I-R 坐标图 + 已记录数据点 + 理论参考线
 *
 * 契约：window.TeachAnyEngines['circuit-lab'] = { version, mount(container, config) }
 */
(function () {
  'use strict';

  var ENGINE_ID = 'circuit-lab';
  var ENGINE_VERSION = '1';

  var THEME = {
    bg: '#ffffff', panel: '#f8fafc', panelBorder: '#e2e8f0',
    text: '#1e293b', textLight: '#64748b',
    primary: '#3b82f6', secondary: '#06b6d4', accent: '#f59e0b',
    wire: '#334155', resistor: '#f59e0b', meter: '#ffffff',
    electron: '#3b82f6', graphLine: '#10b981', point: '#ef4444', grid: '#eef2f7', axis: '#94a3b8'
  };

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function fmt(v, digits) {
    if (!isFinite(v)) return '--';
    var r = digits == null ? (Math.abs(v) < 1 ? 2 : 1) : digits;
    return v.toFixed(r).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  }

  var DEFAULTS = {
    params: {
      U: { label: '电压 U (V)', min: 0, max: 12, step: 0.5, def: 6 },
      R: { label: '电阻 R (Ω)', min: 1, max: 20, step: 1, def: 10 }
    },
    features: { recordData: true, electronFlow: true, modeSwitch: true }
  };

  var MODES = {
    'u-mode': { tab: '探究 I 与 U（R 不变）', xLabel: 'U / V', yLabel: 'I / A',
      theory: 'I = U / R，R 一定时 I 与 U 成正比',
      xOf: function (s) { return s.U; }, line: function (x, s) { return x / s.R; } },
    'r-mode': { tab: '探究 I 与 R（U 不变）', xLabel: 'R / Ω', yLabel: 'I / A',
      theory: 'I = U / R，U 一定时 I 与 R 成反比',
      xOf: function (s) { return s.R; }, line: function (x, s) { return s.U / x; } }
  };

  function createScene(container, config) {
    var cfg = normalize(config);
    var destroyed = false, listeners = [], rafId = 0, resizeObserver = null;

    // 状态
    var state = {
      mode: 'u-mode',
      U: num(cfg.params.U && cfg.params.U.default, DEFAULTS.params.U.def),
      R: num(cfg.params.R && cfg.params.R.default, DEFAULTS.params.R.def),
      closed: true,                 // 开关闭合
      records: { 'u-mode': [], 'r-mode': [] },  // 已记录数据点 [{x, i}]
      electrons: [],
      flash: 0                      // 记录数据时的确认闪烁
    };
    for (var i = 0; i < 14; i++) state.electrons.push({ t: i / 14 });

    // DOM
    container.classList.add('ta-clab');
    container.innerHTML =
      '<div class="ta-clab-tabs"></div>' +
      '<div class="ta-clab-canvas-wrap"><canvas class="ta-clab-canvas"></canvas>' +
      '  <div class="ta-clab-readout"></div></div>' +
      '<div class="ta-clab-controls"></div>';
    var tabsEl = container.querySelector('.ta-clab-tabs');
    var canvas = container.querySelector('.ta-clab-canvas');
    var readoutEl = container.querySelector('.ta-clab-readout');
    var controlsEl = container.querySelector('.ta-clab-controls');
    var ctx = canvas.getContext('2d');
    injectStyle();

    // ---------- 控件 ----------
    function currentI() { return state.R > 0 ? state.U / state.R : 0; }

    function buildTabs() {
      if (!cfg.features.modeSwitch) return;
      tabsEl.innerHTML = '';
      Object.keys(MODES).forEach(function (m) {
        var b = document.createElement('button');
        b.className = 'ta-clab-tab' + (state.mode === m ? ' is-on' : '');
        b.textContent = MODES[m].tab;
        on(b, 'click', function () {
          state.mode = m;
          buildTabs(); buildControls(); draw();
        });
        tabsEl.appendChild(b);
      });
    }

    function buildControls() {
      controlsEl.innerHTML = '';
      // 当前模式下滑块：u-mode 固定 R 调 U；r-mode 固定 U 调 R（但仍允许调固定量做对照）
      var defs = cfg.params;
      ['U', 'R'].forEach(function (key) {
        var d = defs[key];
        var row = document.createElement('div');
        row.className = 'ta-clab-ctrl';
        row.innerHTML = '<label>' + d.label + '</label>' +
          '<input type="range" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + state[key] + '">' +
          '<span class="ta-clab-val">' + fmt(state[key]) + '</span>';
        var slider = row.querySelector('input');
        on(slider, 'input', function () {
          state[key] = num(slider.value, state[key]);
          row.querySelector('.ta-clab-val').textContent = fmt(state[key]);
          draw();
        });
        controlsEl.appendChild(row);
      });

      var btnRow = document.createElement('div');
      btnRow.className = 'ta-clab-btns';
      if (cfg.features.recordData) {
        var rec = document.createElement('button');
        rec.className = 'ta-clab-btn primary';
        rec.textContent = '记录数据';
        on(rec, 'click', function () {
          var mode = MODES[state.mode];
          var pt = { x: mode.xOf(state), i: currentI() };
          var list = state.records[state.mode];
          // 同 x 覆盖
          var exist = list.findIndex(function (p) { return Math.abs(p.x - pt.x) < 1e-9; });
          if (exist >= 0) list[exist] = pt; else list.push(pt);
          list.sort(function (a, b) { return a.x - b.x; });
          state.flash = 1;
          draw();
        });
        btnRow.appendChild(rec);
        var clr = document.createElement('button');
        clr.className = 'ta-clab-btn';
        clr.textContent = '清空数据';
        on(clr, 'click', function () { state.records[state.mode] = []; draw(); });
        btnRow.appendChild(clr);
      }
      var sw = document.createElement('button');
      sw.className = 'ta-clab-btn' + (state.closed ? ' is-on' : '');
      sw.textContent = state.closed ? '开关：闭合' : '开关：断开';
      on(sw, 'click', function () {
        state.closed = !state.closed;
        sw.textContent = state.closed ? '开关：闭合' : '开关：断开';
        sw.classList.toggle('is-on', state.closed);
        draw();
      });
      btnRow.appendChild(sw);
      controlsEl.appendChild(btnRow);

      if (cfg.hint) {
        var hint = document.createElement('p');
        hint.className = 'ta-clab-hint';
        hint.textContent = cfg.hint;
        controlsEl.appendChild(hint);
      }
    }

    // ---------- 画布 ----------
    function fit() {
      var r = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    // 电路布局坐标（逻辑坐标系 620x300 左半）
    function circuitPath() {
      // 返回电路矩形环路关键点 {x,y} 比例坐标
      return { left: 40, right: 380, top: 50, bottom: 240 };
    }

    function drawCircuit(w, h) {
      var p = circuitPath();
      var midX = (p.left + p.right) / 2;
      var I = state.closed ? currentI() : 0;

      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = THEME.wire;

      // 主环路（矩形）：上边含电流表，右边含定值电阻，下边含电源+开关
      // 上边
      ctx.beginPath(); ctx.moveTo(p.left, p.top); ctx.lineTo(midX - 34, p.top); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX + 34, p.top); ctx.lineTo(p.right, p.top); ctx.stroke();
      // 右边（电阻）
      ctx.beginPath(); ctx.moveTo(p.right, p.top); ctx.lineTo(p.right, p.top + 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.right, p.top + 140); ctx.lineTo(p.right, p.bottom); ctx.stroke();
      // 下边（电源左半 + 开关右半）
      ctx.beginPath(); ctx.moveTo(p.right, p.bottom); ctx.lineTo(midX + 44, p.bottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX + 4, p.bottom); ctx.lineTo(midX - 44, p.bottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 84, p.bottom); ctx.lineTo(p.left, p.bottom); ctx.stroke();
      // 左边
      ctx.beginPath(); ctx.moveTo(p.left, p.bottom); ctx.lineTo(p.left, p.top); ctx.stroke();

      // 电流表 A（上边中点圆）
      drawMeter(midX, p.top, 'A', fmt(I) + ' A');
      // 定值电阻（右边矩形）
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = THEME.resistor;
      ctx.lineWidth = 2;
      ctx.fillRect(p.right - 16, p.top + 60, 32, 80);
      ctx.strokeRect(p.right - 16, p.top + 60, 32, 80);
      ctx.fillStyle = THEME.text;
      ctx.font = 'bold 13px PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(p.right - 26, p.top + 100);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('R = ' + fmt(state.R) + ' Ω', 0, 0);
      ctx.restore();
      // 电压表 V（与电阻并联，外环）
      ctx.strokeStyle = THEME.wire;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.right, p.top + 70); ctx.lineTo(p.right + 44, p.top + 70); ctx.lineTo(p.right + 44, p.top + 96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.right + 44, p.top + 164); ctx.lineTo(p.right + 44, p.top + 190); ctx.lineTo(p.right, p.top + 190); ctx.stroke();
      drawMeter(p.right + 44, p.top + 130, 'V', fmt(state.U) + ' V');
      // 电源（下边左半：长短竖线）
      ctx.strokeStyle = THEME.wire;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX - 64, p.bottom - 14); ctx.lineTo(midX - 64, p.bottom + 14); ctx.stroke(); // 长
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(midX - 52, p.bottom - 7); ctx.lineTo(midX - 52, p.bottom + 7); ctx.stroke();  // 短粗
      ctx.fillStyle = THEME.textLight;
      ctx.font = '11px PingFang SC, sans-serif';
      ctx.fillText('电源 ' + fmt(state.U) + ' V', midX - 58, p.bottom + 30);
      // 开关（下边右半）
      ctx.lineWidth = 2;
      ctx.fillStyle = THEME.wire;
      ctx.beginPath(); ctx.arc(midX + 44, p.bottom, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(midX + 4, p.bottom, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(midX + 4, p.bottom);
      if (state.closed) ctx.lineTo(midX + 44, p.bottom);
      else ctx.lineTo(midX + 38, p.bottom - 18);
      ctx.stroke();
      ctx.fillStyle = THEME.textLight;
      ctx.font = '11px PingFang SC, sans-serif';
      ctx.fillText(state.closed ? '闭合' : '断开', midX + 24, p.bottom + 30);

      // 电子流动画（速度 ∝ I）
      if (cfg.features.electronFlow && state.closed && I > 0) {
        var perimeter = 2 * ((p.right - p.left) + (p.bottom - p.top));
        ctx.fillStyle = THEME.electron;
        state.electrons.forEach(function (e) {
          var pos = pointOnLoop(p, e.t);
          ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); ctx.fill();
        });
      }
      ctx.restore();
    }

    function drawMeter(x, y, sym, reading) {
      ctx.save();
      ctx.fillStyle = THEME.meter;
      ctx.strokeStyle = THEME.wire;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = THEME.text;
      ctx.font = 'bold 15px PingFang SC, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sym, x, y - 2);
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillStyle = THEME.primary;
      ctx.fillText(reading, x, y + 30);
      ctx.restore();
    }

    function pointOnLoop(p, t) {
      // 沿矩形环路逆时针取点，t ∈ [0,1)
      var w = p.right - p.left, h = p.bottom - p.top;
      var per = 2 * (w + h), d = t * per;
      if (d < w) return { x: p.left + d, y: p.top };
      d -= w;
      if (d < h) return { x: p.right, y: p.top + d };
      d -= h;
      if (d < w) return { x: p.right - d, y: p.bottom };
      d -= w;
      return { x: p.left, y: p.bottom - d };
    }

    // I-U / I-R 图（右半）
    function drawGraph(w, h) {
      var gx = w * 0.56, gy = 36, gw = w * 0.40, gh = h - 90;
      var mode = MODES[state.mode];
      var xMax = state.mode === 'u-mode' ? cfg.params.U.max : cfg.params.R.max;
      var iMax = cfg.params.U.max / cfg.params.R.min; // 12/1 = 12A
      iMax = Math.min(iMax, 3); // 教学量程 3A
      function X(x) { return gx + (x / xMax) * gw; }
      function Y(i) { return gy + gh - (Math.min(i, iMax) / iMax) * gh; }

      ctx.save();
      // 网格与轴
      ctx.strokeStyle = THEME.grid;
      ctx.lineWidth = 1;
      var steps = 6;
      for (var s = 0; s <= steps; s++) {
        ctx.beginPath(); ctx.moveTo(gx + gw * s / steps, gy); ctx.lineTo(gx + gw * s / steps, gy + gh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, gy + gh * s / steps); ctx.lineTo(gx + gw, gy + gh * s / steps); ctx.stroke();
      }
      ctx.strokeStyle = THEME.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      ctx.fillStyle = THEME.textLight;
      ctx.font = '11px PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mode.xLabel, gx + gw / 2, gy + gh + 24);
      ctx.save();
      ctx.translate(gx - 18, gy + gh / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(mode.yLabel, 0, 0);
      ctx.restore();
      // 刻度
      ctx.font = '10px ui-monospace, monospace';
      for (var t = 0; t <= steps; t++) {
        ctx.fillText(fmt(xMax * t / steps), X(xMax * t / steps), gy + gh + 12);
        ctx.textAlign = 'right';
        ctx.fillText(fmt(iMax * (steps - t) / steps), gx - 5, gy + gh * t / steps + 3);
        ctx.textAlign = 'center';
      }
      // 理论参考线（虚线）
      ctx.strokeStyle = THEME.graphLine;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var started = false;
      for (var px = 0; px <= gw; px += 2) {
        var x = (px / gw) * xMax;
        var i = mode.line(x, state);
        if (!isFinite(i) || i < 0) { started = false; continue; }
        var py = Y(i);
        if (i > iMax) { started = false; continue; }
        if (!started) { ctx.moveTo(gx + px, py); started = true; } else ctx.lineTo(gx + px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // 已记录数据点
      var list = state.records[state.mode];
      ctx.fillStyle = THEME.point;
      list.forEach(function (pt) {
        if (pt.i > iMax) return;
        ctx.beginPath(); ctx.arc(X(pt.x), Y(pt.i), 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // 当前工作点（空心）
      var ci = currentI();
      if (state.closed && ci <= iMax) {
        ctx.strokeStyle = THEME.primary;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(mode.xOf(state)), Y(ci), 6, 0, Math.PI * 2); ctx.stroke();
      }
      // 数据表格（右上角迷你）
      ctx.fillStyle = THEME.text;
      ctx.font = 'bold 11px PingFang SC, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('实验数据（' + list.length + ' 组）', gx, gy - 14);
      ctx.restore();
    }

    function draw() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      drawCircuit(r.width, r.height);
      drawGraph(r.width, r.height);
      // 顶部读数条
      var I = currentI();
      readoutEl.innerHTML =
        '<span class="ro-formula">I = U / R = ' + fmt(state.U) + ' / ' + fmt(state.R) + ' = <b>' + fmt(state.closed ? I : 0) + ' A</b></span>' +
        '<span class="ro-theory">' + MODES[state.mode].theory + '</span>';
      // 记录确认闪烁
      if (state.flash > 0) {
        state.flash -= 0.04;
        if (state.flash < 0) state.flash = 0;
      }
    }

    // ---------- 动画帧（电子流） ----------
    var lastT = 0;
    function loop(ts) {
      if (destroyed) return;
      var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
      lastT = ts;
      if (state.closed && currentI() > 0) {
        var speed = 0.03 + currentI() * 0.06; // I 越大流越快
        state.electrons.forEach(function (e) { e.t = (e.t + speed * dt) % 1; });
        draw();
      } else if (state.flash > 0) draw();
      rafId = requestAnimationFrame(loop);
    }

    // ---------- 工具 ----------
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push({ el: el, type: type, fn: fn, opts: opts }); }
    function normalize(config) {
      config = config || {};
      var p = config.params || {};
      return {
        params: {
          U: Object.assign({}, DEFAULTS.params.U, p.U || {}),
          R: Object.assign({}, DEFAULTS.params.R, p.R || {})
        },
        features: Object.assign({}, DEFAULTS.features, config.features || {}),
        hint: config.hint || ''
      };
    }

    // ---------- 启动 ----------
    buildTabs();
    buildControls();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(canvas.parentElement);
    }
    on(window, 'resize', fit);
    fit();
    rafId = requestAnimationFrame(loop);

    return {
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(rafId);
        resizeObserver && resizeObserver.disconnect();
        listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn, l.opts); });
        listeners = [];
        container.innerHTML = '';
        container.classList.remove('ta-clab');
      },
      getState: function () {
        return { mode: state.mode, U: state.U, R: state.R, I: currentI(), closed: state.closed, records: JSON.parse(JSON.stringify(state.records)) };
      },
      setParam: function (k, v) {
        if (k === 'U' || k === 'R') { state[k] = num(v, state[k]); buildControls(); draw(); }
        if (k === 'closed') { state.closed = !!v; buildControls(); draw(); }
      }
    };
  }

  function injectStyle() {
    var id = 'ta-clab-style';
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent =
      '.ta-clab{display:flex;flex-direction:column;gap:12px;font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:' + THEME.text + '}' +
      '.ta-clab-tabs{display:flex;gap:8px;flex-wrap:wrap}' +
      '.ta-clab-tab{padding:7px 16px;border-radius:999px;border:1px solid ' + THEME.panelBorder + ';background:#fff;font-size:13px;font-weight:600;color:' + THEME.text + ';cursor:pointer}' +
      '.ta-clab-tab.is-on{background:linear-gradient(135deg,' + THEME.primary + ',' + THEME.secondary + ');color:#fff;border-color:transparent}' +
      '.ta-clab-canvas-wrap{position:relative;height:min(64vw,430px);min-height:320px;border:1px solid ' + THEME.panelBorder + ';border-radius:14px;background:' + THEME.bg + ';overflow:hidden}' +
      '.ta-clab-canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
      '.ta-clab-readout{position:absolute;left:12px;top:10px;display:flex;flex-direction:column;gap:3px;pointer-events:none;max-width:52%}' +
      '.ta-clab-readout .ro-formula{font:700 14px/1.5 ui-monospace,Menlo,monospace;color:' + THEME.text + ';background:rgba(255,255,255,.88);padding:3px 10px;border-radius:8px;width:max-content;max-width:100%}' +
      '.ta-clab-readout .ro-formula b{color:' + THEME.primary + '}' +
      '.ta-clab-readout .ro-theory{font:600 11px/1.5 "PingFang SC",sans-serif;color:' + THEME.textLight + ';background:rgba(255,255,255,.8);padding:2px 10px;border-radius:8px;width:max-content;max-width:100%}' +
      '.ta-clab-controls{display:flex;flex-direction:column;gap:10px;background:' + THEME.panel + ';border:1px solid ' + THEME.panelBorder + ';border-radius:14px;padding:14px 16px}' +
      '.ta-clab-ctrl{display:grid;grid-template-columns:110px 1fr 52px;align-items:center;gap:10px}' +
      '.ta-clab-ctrl label{font-size:13px;font-weight:600}' +
      '.ta-clab-ctrl input{width:100%;accent-color:' + THEME.primary + '}' +
      '.ta-clab-val{font:700 13px ui-monospace,monospace;color:' + THEME.primary + ';text-align:right}' +
      '.ta-clab-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '.ta-clab-btn{padding:7px 16px;border-radius:999px;border:1px solid ' + THEME.panelBorder + ';background:#fff;font-size:13px;font-weight:600;color:' + THEME.text + ';cursor:pointer;transition:all .15s}' +
      '.ta-clab-btn:hover{border-color:' + THEME.primary + ';color:' + THEME.primary + '}' +
      '.ta-clab-btn.primary{background:linear-gradient(135deg,' + THEME.primary + ',' + THEME.secondary + ');color:#fff;border-color:transparent}' +
      '.ta-clab-btn.is-on{background:' + THEME.accent + ';color:#fff;border-color:transparent}' +
      '.ta-clab-hint{margin:0;font-size:12px;color:' + THEME.textLight + '}' +
      '@media (max-width:640px){.ta-clab-ctrl{grid-template-columns:92px 1fr 46px}.ta-clab-canvas-wrap{height:min(96vw,480px)}}';
    document.head.appendChild(s);
  }

  window.TeachAnyEngines = window.TeachAnyEngines || {};
  window.TeachAnyEngines[ENGINE_ID] = {
    version: ENGINE_VERSION,
    mount: function (container, config) { return createScene(container, config); }
  };
})();
