/**
 * TeachAny Equilibrium Lab Engine v1
 * 化学平衡实验引擎 —— 可逆反应/动态平衡/勒夏特列原理探究底座。
 * 原创实现，MIT License，TeachAny 项目所有。
 *
 * 教学模型：一级可逆反应 A ⇌ B（随机质量作用模拟）。
 *   每个 A 分子每帧以概率 k正·dt 变为 B；每个 B 以概率 k逆·dt 变为 A。
 *   平衡时 N(A)·k正 = N(B)·k逆  ⇒  K = [B]/[A] = k正/k逆。
 *   v正 ∝ k正·[A]，v逆 ∝ k逆·[B]；平衡标志：v正 = v逆 ≠ 0。
 * 画布左：分子容器（红 A / 蓝 B，转化时闪烁光环，直观呈现"动态"）
 * 画布右：浓度-时间曲线 + v正/v逆 速率条
 * 扰动按钮：加入 A / 移除 B —— 观察平衡移动但 K 不变。
 *
 * 契约：window.TeachAnyEngines['equilibrium-lab'] = { version, mount(container, config) }
 */
(function () {
  'use strict';

  var ENGINE_ID = 'equilibrium-lab';
  var ENGINE_VERSION = '1';

  var THEME = {
    bg: '#ffffff', panel: '#f8fafc', panelBorder: '#e2e8f0',
    text: '#1e293b', textLight: '#64748b',
    primary: '#3b82f6', secondary: '#06b6d4', accent: '#f59e0b',
    molA: '#ef4444', molB: '#3b82f6', curveA: '#ef4444', curveB: '#3b82f6',
    rateF: '#f59e0b', rateR: '#8b5cf6', grid: '#eef2f7', axis: '#94a3b8', chamber: '#f1f5f9'
  };

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function fmt(v, digits) {
    if (!isFinite(v)) return '--';
    return v.toFixed(digits == null ? 2 : digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  }

  var DEFAULTS = {
    params: {
      kf: { label: '正反应速率常数 k正', min: 1, max: 10, step: 0.5, def: 6 },
      kr: { label: '逆反应速率常数 k逆', min: 1, max: 10, step: 0.5, def: 6 }
    },
    features: { disturb: true, particles: true },
    totalMolecules: 60
  };

  function createScene(container, config) {
    var cfg = normalize(config);
    var destroyed = false, listeners = [], rafId = 0, resizeObserver = null;

    // ---------- 状态 ----------
    var state = {
      kf: num(cfg.params.kf && cfg.params.kf.default, DEFAULTS.params.kf.def),
      kr: num(cfg.params.kr && cfg.params.kr.default, DEFAULTS.params.kr.def),
      playing: true,
      time: 0,
      molecules: [],           // {type:'A'|'B', x,y,vx,vy, glow}
      history: [],             // {t, a, b} 滚动窗口
      historyWindow: 40,       // 秒
      conversions: { f: 0, r: 0, windowF: 0, windowR: 0 } // 速率统计
    };

    function resetMolecules() {
      state.molecules = [];
      state.time = 0;
      state.history = [];
      state.conversions = { f: 0, r: 0, windowF: 0, windowR: 0 };
      for (var i = 0; i < cfg.totalMolecules; i++) {
        var a = Math.random() * Math.PI * 2, sp = 14 + Math.random() * 18;
        state.molecules.push({
          type: 'A',
          x: Math.random(), y: Math.random(),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          glow: 0
        });
      }
    }

    function counts() {
      var a = 0;
      for (var i = 0; i < state.molecules.length; i++) if (state.molecules[i].type === 'A') a++;
      return { a: a, b: state.molecules.length - a };
    }
    function K() {
      var c = counts();
      return c.a > 0 ? c.b / c.a : Infinity;
    }
    function rates() {
      var c = counts(), n = state.molecules.length || 1;
      return { f: state.kf * (c.a / n), r: state.kr * (c.b / n) };
    }

    // ---------- DOM ----------
    container.classList.add('ta-qlab');
    container.innerHTML =
      '<div class="ta-qlab-canvas-wrap"><canvas class="ta-qlab-canvas"></canvas>' +
      '  <div class="ta-qlab-readout"></div></div>' +
      '<div class="ta-qlab-controls"></div>';
    var canvas = container.querySelector('.ta-qlab-canvas');
    var readoutEl = container.querySelector('.ta-qlab-readout');
    var controlsEl = container.querySelector('.ta-qlab-controls');
    var ctx = canvas.getContext('2d');
    injectStyle();

    // ---------- 控件 ----------
    function buildControls() {
      controlsEl.innerHTML = '';
      ['kf', 'kr'].forEach(function (key) {
        var d = cfg.params[key];
        var row = document.createElement('div');
        row.className = 'ta-qlab-ctrl';
        row.innerHTML = '<label>' + d.label + '</label>' +
          '<input type="range" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + state[key] + '">' +
          '<span class="ta-qlab-val">' + fmt(state[key], 1) + '</span>';
        var slider = row.querySelector('input');
        on(slider, 'input', function () {
          state[key] = num(slider.value, state[key]);
          row.querySelector('.ta-qlab-val').textContent = fmt(state[key], 1);
          draw();
        });
        controlsEl.appendChild(row);
      });

      var btnRow = document.createElement('div');
      btnRow.className = 'ta-qlab-btns';

      var play = document.createElement('button');
      play.className = 'ta-qlab-btn' + (state.playing ? ' is-on' : '');
      play.textContent = state.playing ? '⏸ 暂停' : '▶ 运行';
      on(play, 'click', function () {
        state.playing = !state.playing;
        play.textContent = state.playing ? '⏸ 暂停' : '▶ 运行';
        play.classList.toggle('is-on', state.playing);
      });
      btnRow.appendChild(play);

      var reset = document.createElement('button');
      reset.className = 'ta-qlab-btn';
      reset.textContent = '重置（全为 A）';
      on(reset, 'click', function () { resetMolecules(); });
      btnRow.appendChild(reset);

      if (cfg.features.disturb) {
        var addA = document.createElement('button');
        addA.className = 'ta-qlab-btn warn';
        addA.textContent = '＋ 加入 A';
        on(addA, 'click', function () {
          for (var i = 0; i < Math.round(cfg.totalMolecules / 3); i++) {
            var a = Math.random() * Math.PI * 2, sp = 14 + Math.random() * 18;
            state.molecules.push({ type: 'A', x: Math.random(), y: Math.random(), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, glow: 1 });
          }
        });
        btnRow.appendChild(addA);

        var rmB = document.createElement('button');
        rmB.className = 'ta-qlab-btn warn';
        rmB.textContent = '－ 移除一半 B';
        on(rmB, 'click', function () {
          var removed = 0, target = Math.max(1, Math.round(counts().b / 2));
          state.molecules = state.molecules.filter(function (m) {
            if (m.type === 'B' && removed < target) { removed++; return false; }
            return true;
          });
        });
        btnRow.appendChild(rmB);
      }
      controlsEl.appendChild(btnRow);

      if (cfg.hint) {
        var hint = document.createElement('p');
        hint.className = 'ta-qlab-hint';
        hint.textContent = cfg.hint;
        controlsEl.appendChild(hint);
      }
    }

    // ---------- 模拟步进 ----------
    function step(dt) {
      state.time += dt;
      var pf = state.kf * dt * 0.35;   // 概率系数（教学节奏）
      var pr = state.kr * dt * 0.35;
      var n = state.molecules.length;
      var convF = 0, convR = 0;
      for (var i = 0; i < n; i++) {
        var m = state.molecules[i];
        // 布朗式漂移
        m.x += m.vx * dt * 0.02;
        m.y += m.vy * dt * 0.02;
        if (m.x < 0 || m.x > 1) { m.vx *= -1; m.x = Math.max(0, Math.min(1, m.x)); }
        if (m.y < 0 || m.y > 1) { m.vy *= -1; m.y = Math.max(0, Math.min(1, m.y)); }
        // 转化
        if (m.type === 'A' && Math.random() < pf) { m.type = 'B'; m.glow = 1; convF++; }
        else if (m.type === 'B' && Math.random() < pr) { m.type = 'A'; m.glow = 1; convR++; }
        if (m.glow > 0) m.glow = Math.max(0, m.glow - dt * 2.5);
      }
      state.conversions.windowF = convF;
      state.conversions.windowR = convR;
      // 历史曲线
      var c = counts();
      state.history.push({ t: state.time, a: c.a / n, b: c.b / n });
      while (state.history.length && state.history[0].t < state.time - state.historyWindow) state.history.shift();
    }

    // ---------- 渲染 ----------
    function fit() {
      var r = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function drawChamber(w, h) {
      var cw = w * 0.52, ch = h - 80, cx = 16, cy = 56;
      ctx.save();
      // 容器
      ctx.fillStyle = THEME.chamber;
      ctx.strokeStyle = THEME.panelBorder;
      ctx.lineWidth = 1.5;
      roundRect(cx, cy, cw - 16, ch, 12);
      ctx.fill(); ctx.stroke();
      // 标题
      ctx.fillStyle = THEME.textLight;
      ctx.font = 'bold 11px PingFang SC, sans-serif';
      ctx.textAlign = 'left';
      var c = counts();
      ctx.fillText('反应容器（点击分子可手动翻转）', cx + 4, cy - 8);
      // 分子
      var mw = cw - 16, mh = ch;
      state.molecules.forEach(function (m) {
        var px = cx + m.x * mw, py = cy + m.y * mh;
        if (m.glow > 0) {
          ctx.fillStyle = m.type === 'A' ? 'rgba(239,68,68,' + (0.35 * m.glow) + ')' : 'rgba(59,130,246,' + (0.35 * m.glow) + ')';
          ctx.beginPath(); ctx.arc(px, py, 9 + 6 * m.glow, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = m.type === 'A' ? THEME.molA : THEME.molB;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      // 计数
      ctx.font = 'bold 13px PingFang SC, sans-serif';
      ctx.fillStyle = THEME.molA;
      ctx.fillText('A: ' + c.a, cx + 8, cy + 20);
      ctx.fillStyle = THEME.molB;
      ctx.fillText('B: ' + c.b, cx + 8, cy + 38);
      ctx.restore();
    }

    function drawCurves(w, h) {
      var gx = w * 0.55, gy = 56, gw = w * 0.42, gh = (h - 100) * 0.58;
      ctx.save();
      // 框
      ctx.strokeStyle = THEME.panelBorder;
      ctx.fillStyle = '#fff';
      roundRect(gx, gy, gw - 8, gh, 12); ctx.fill(); ctx.stroke();
      var ix = gx + 34, iy = gy + 12, iw = gw - 52, ih = gh - 40;
      // 网格
      ctx.strokeStyle = THEME.grid; ctx.lineWidth = 1;
      for (var s = 0; s <= 4; s++) {
        ctx.beginPath(); ctx.moveTo(ix, iy + ih * s / 4); ctx.lineTo(ix + iw, iy + ih * s / 4); ctx.stroke();
      }
      // 轴标签
      ctx.fillStyle = THEME.textLight;
      ctx.font = '10px PingFang SC, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('浓度分数', ix - 30, iy + 10);
      ctx.fillText('时间 →', ix + iw - 40, iy + ih + 16);
      for (var t = 0; t <= 4; t++) {
        ctx.textAlign = 'right';
        ctx.fillText(fmt(1 - t / 4, 1), ix - 5, iy + ih * t / 4 + 3);
      }
      // 曲线
      var t1 = state.time, t0 = t1 - state.historyWindow;
      function plot(key, color) {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.beginPath();
        var started = false;
        state.history.forEach(function (pt) {
          var px = ix + ((pt.t - t0) / state.historyWindow) * iw;
          var py = iy + ih - pt[key] * ih;
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      plot('a', THEME.curveA);
      plot('b', THEME.curveB);
      // 图例
      ctx.textAlign = 'left';
      ctx.fillStyle = THEME.curveA; ctx.fillText('— [A]', ix + 6, iy + 12);
      ctx.fillStyle = THEME.curveB; ctx.fillText('— [B]', ix + 50, iy + 12);
      ctx.restore();
    }

    function drawRates(w, h) {
      var gx = w * 0.55, gy = 56 + (h - 100) * 0.58 + 14, gw = w * 0.42, gh = (h - 100) * 0.30;
      ctx.save();
      ctx.strokeStyle = THEME.panelBorder;
      ctx.fillStyle = '#fff';
      roundRect(gx, gy, gw - 8, gh, 12); ctx.fill(); ctx.stroke();
      var r = rates();
      var maxR = Math.max(DEFAULTS.params.kf.max, 1e-6);
      var bw = (gw - 52) / 2;
      // v正 bar
      bar(gx + 20, gy + 26, bw, gh - 52, r.f / maxR, THEME.rateF, 'v正 = k正·[A] = ' + fmt(r.f, 2));
      // v逆 bar
      bar(gx + 32 + bw, gy + 26, bw, gh - 52, r.r / maxR, THEME.rateR, 'v逆 = k逆·[B] = ' + fmt(r.r, 2));
      // 平衡指示
      var near = Math.abs(r.f - r.r) < 0.06 * Math.max(r.f, r.r, 0.1);
      ctx.fillStyle = near ? '#10b981' : THEME.textLight;
      ctx.font = 'bold 11px PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(near ? 'v正 = v逆 ≠ 0 · 动态平衡' : '趋向平衡中…（仍在转化）', gx + (gw - 8) / 2, gy + gh - 8);
      ctx.restore();
    }

    function bar(x, y, w, h, frac, color, label) {
      frac = Math.max(0, Math.min(1, frac));
      ctx.fillStyle = THEME.grid;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x, y + h * (1 - frac), w, h * frac);
      ctx.fillStyle = THEME.text;
      ctx.font = '10px PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y - 6);
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function draw() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      drawChamber(r.width, r.height);
      drawCurves(r.width, r.height);
      drawRates(r.width, r.height);
      var c = counts();
      readoutEl.innerHTML =
        '<span class="ro-k">K = [B]/[A] = <b>' + fmt(K()) + '</b>　理论 K = k正/k逆 = <b>' + fmt(state.kf / state.kr) + '</b></span>';
    }

    // ---------- 点击分子翻转 ----------
    on(canvas, 'pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      var cw = w * 0.52, ch = h - 80, cx = 16, cy = 56;
      var px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (px < cx || px > cx + cw - 16 || py < cy || py > cy + ch) return;
      var mx = (px - cx) / (cw - 16), my = (py - cy) / ch;
      // 找最近分子
      var best = null, bd = 1e9;
      state.molecules.forEach(function (m) {
        var d = (m.x - mx) * (m.x - mx) + (m.y - my) * (m.y - my);
        if (d < bd) { bd = d; best = m; }
      });
      if (best && bd < 0.004) {
        best.type = best.type === 'A' ? 'B' : 'A';
        best.glow = 1;
        draw();
      }
    });

    // ---------- 主循环 ----------
    var lastT = 0;
    function loop(ts) {
      if (destroyed) return;
      var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
      lastT = ts;
      if (state.playing) { step(dt); draw(); }
      rafId = requestAnimationFrame(loop);
    }

    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push({ el: el, type: type, fn: fn, opts: opts }); }
    function normalize(config) {
      config = config || {};
      var p = config.params || {};
      return {
        params: {
          kf: Object.assign({}, DEFAULTS.params.kf, p.kf || {}),
          kr: Object.assign({}, DEFAULTS.params.kr, p.kr || {})
        },
        features: Object.assign({}, DEFAULTS.features, config.features || {}),
        totalMolecules: num(config.totalMolecules, DEFAULTS.totalMolecules),
        hint: config.hint || ''
      };
    }

    // ---------- 启动 ----------
    resetMolecules();
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
        container.classList.remove('ta-qlab');
      },
      getState: function () {
        var c = counts();
        return { kf: state.kf, kr: state.kr, countA: c.a, countB: c.b, K: K(), rates: rates(), time: state.time, playing: state.playing };
      },
      setParam: function (k, v) {
        if (k === 'kf' || k === 'kr') { state[k] = num(v, state[k]); buildControls(); draw(); }
        if (k === 'playing') { state.playing = !!v; buildControls(); }
      }
    };
  }

  function injectStyle() {
    var id = 'ta-qlab-style';
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent =
      '.ta-qlab{display:flex;flex-direction:column;gap:12px;font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:' + THEME.text + '}' +
      '.ta-qlab-canvas-wrap{position:relative;height:min(64vw,430px);min-height:340px;border:1px solid ' + THEME.panelBorder + ';border-radius:14px;background:' + THEME.bg + ';overflow:hidden}' +
      '.ta-qlab-canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
      '.ta-qlab-readout{position:absolute;left:12px;top:10px;pointer-events:none;max-width:96%}' +
      '.ta-qlab-readout .ro-k{font:700 13px/1.5 ui-monospace,Menlo,monospace;color:' + THEME.text + ';background:rgba(255,255,255,.88);padding:3px 10px;border-radius:8px}' +
      '.ta-qlab-readout .ro-k b{color:' + THEME.primary + '}' +
      '.ta-qlab-controls{display:flex;flex-direction:column;gap:10px;background:' + THEME.panel + ';border:1px solid ' + THEME.panelBorder + ';border-radius:14px;padding:14px 16px}' +
      '.ta-qlab-ctrl{display:grid;grid-template-columns:150px 1fr 52px;align-items:center;gap:10px}' +
      '.ta-qlab-ctrl label{font-size:13px;font-weight:600}' +
      '.ta-qlab-ctrl input{width:100%;accent-color:' + THEME.primary + '}' +
      '.ta-qlab-val{font:700 13px ui-monospace,monospace;color:' + THEME.primary + ';text-align:right}' +
      '.ta-qlab-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '.ta-qlab-btn{padding:7px 16px;border-radius:999px;border:1px solid ' + THEME.panelBorder + ';background:#fff;font-size:13px;font-weight:600;color:' + THEME.text + ';cursor:pointer;transition:all .15s}' +
      '.ta-qlab-btn:hover{border-color:' + THEME.primary + ';color:' + THEME.primary + '}' +
      '.ta-qlab-btn.is-on{background:linear-gradient(135deg,' + THEME.primary + ',' + THEME.secondary + ');color:#fff;border-color:transparent}' +
      '.ta-qlab-btn.warn:hover{border-color:' + THEME.accent + ';color:' + THEME.accent + '}' +
      '.ta-qlab-hint{margin:0;font-size:12px;color:' + THEME.textLight + '}' +
      '@media (max-width:640px){.ta-qlab-ctrl{grid-template-columns:120px 1fr 44px}.ta-qlab-canvas-wrap{height:min(96vw,500px)}}';
    document.head.appendChild(s);
  }

  window.TeachAnyEngines = window.TeachAnyEngines || {};
  window.TeachAnyEngines[ENGINE_ID] = {
    version: ENGINE_VERSION,
    mount: function (container, config) { return createScene(container, config); }
  };
})();
