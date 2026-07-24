/**
 * TeachAny 引擎骨架模板
 * 用法：复制为 engines/<id>/v1/engine.js，替换 ENGINE_ID、场景实现。
 * 契约见 references/creating-engines.md。已验证参照：engines/function-lab/v1/engine.js。
 */
(function () {
  'use strict';

  var ENGINE_ID = 'xxx-lab';
  var ENGINE_VERSION = '1';

  var THEME = {
    bg: '#ffffff', panel: '#f8fafc', panelBorder: '#e2e8f0',
    text: '#1e293b', textLight: '#64748b',
    primary: '#3b82f6', secondary: '#06b6d4', accent: '#f59e0b'
  };

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }

  function createScene(container, config) {
    var cfg = normalizeConfig(config);
    var destroyed = false;
    var listeners = [];
    var rafId = 0;
    var resizeObserver = null;

    container.classList.add('ta-' + ENGINE_ID);
    container.innerHTML =
      '<div class="ta-' + ENGINE_ID + '-stage"><canvas></canvas></div>' +
      '<div class="ta-' + ENGINE_ID + '-controls"></div>';
    var canvas = container.querySelector('canvas');
    var ctx = canvas.getContext('2d');

    injectStyleOnce();

    // ---- 状态 ----
    var params = {};
    Object.keys(cfg.params).forEach(function (k) {
      params[k] = num(cfg.params[k].default, 0);
    });

    // ---- 控件（config 驱动）----
    var controlsEl = container.querySelector('.ta-' + ENGINE_ID + '-controls');
    Object.keys(cfg.params).forEach(function (key) {
      var p = cfg.params[key];
      var row = document.createElement('div');
      row.className = 'ta-' + ENGINE_ID + '-ctrl';
      row.innerHTML = '<label>' + p.label + '</label>' +
        '<input type="range" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + params[key] + '">' +
        '<span>' + params[key] + '</span>';
      var slider = row.querySelector('input');
      on(slider, 'input', function () {
        params[key] = num(slider.value, p.default);
        row.querySelector('span').textContent = params[key];
        draw();
      });
      controlsEl.appendChild(row);
    });

    // ---- 渲染（DPR）----
    function fit() {
      var r = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function draw() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      /* TODO: 场景绘制（读 params） */
    }

    // ---- 交互 ----
    function on(el, type, fn, opts) {
      el.addEventListener(type, fn, opts);
      listeners.push({ el: el, type: type, fn: fn, opts: opts });
    }

    function loop() {
      if (destroyed) return;
      /* 动画推进 */
      rafId = requestAnimationFrame(loop);
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(canvas.parentElement);
    }
    on(window, 'resize', fit);
    fit();
    loop();

    // ---- 实例契约 ----
    return {
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(rafId);
        resizeObserver && resizeObserver.disconnect();
        listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn, l.opts); });
        listeners = [];
        container.innerHTML = '';
        container.classList.remove('ta-' + ENGINE_ID);
      },
      getState: function () { return { params: Object.assign({}, params) }; },
      setParam: function (k, v) { if (k in params) { params[k] = num(v, params[k]); draw(); } }
    };
  }

  function normalizeConfig(config) {
    config = config || {};
    return {
      params: config.params || {},
      features: config.features || {},
      hint: config.hint || ''
    };
  }

  function injectStyleOnce() {
    var id = 'ta-' + ENGINE_ID + '-style';
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent =
      '.ta-' + ENGINE_ID + '{display:flex;flex-direction:column;gap:12px;font-family:"PingFang SC","Microsoft YaHei",sans-serif}' +
      '.ta-' + ENGINE_ID + '-stage{position:relative;height:min(62vw,460px);min-height:300px;border:1px solid ' + THEME.panelBorder + ';border-radius:14px;overflow:hidden;background:' + THEME.bg + '}' +
      '.ta-' + ENGINE_ID + '-stage canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
      '.ta-' + ENGINE_ID + '-controls{background:' + THEME.panel + ';border:1px solid ' + THEME.panelBorder + ';border-radius:14px;padding:14px 16px}' +
      '.ta-' + ENGINE_ID + '-ctrl{display:grid;grid-template-columns:110px 1fr 52px;gap:10px;align-items:center;margin-bottom:8px}' +
      '.ta-' + ENGINE_ID + '-ctrl input{accent-color:' + THEME.primary + '}';
    document.head.appendChild(s);
  }

  window.TeachAnyEngines = window.TeachAnyEngines || {};
  window.TeachAnyEngines[ENGINE_ID] = {
    version: ENGINE_VERSION,
    mount: function (container, config) { return createScene(container, config); }
  };
})();
