/* ==================================================================
 * TeachAny · 情境感知气泡（v7.7.4）
 *
 * 功能：
 *  - 学生滚动到某段时，左下角 AI 学伴 FAB 旁弹出一行"思考提示"
 *  - 提示来源：
 *    1) `<section data-tsh="思考一下..."><script type="application/json"
 *       data-teachany-section-hint>"提示文本"</script></section>`
 *    2) 页面根目录可选 `./section-hints.json`：{"section-id": "提示文本", ...}
 *    3) 也可在任何元素上直接加 `data-tsh="提示文本"` —— 进入视口即触发
 *  - 默认 8 秒后自动淡出；点击 FAB 或右上角 ✕ 可立刻关闭
 *  - 无可用提示则完全不插入 DOM，零占位
 *
 * 用法：
 *   <link rel="stylesheet" href="../../scripts/teachany-section-hints.css">
 *   <script src="../../scripts/teachany-section-hints.js" defer></script>
 *
 *   在任意 section 上：
 *   <section id="module1" data-tsh="对比中国郡县制——为什么欧洲四分五裂？">
 * ================================================================== */

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__teachanySectionHints) return;
  window.__teachanySectionHints = true;

  var scriptEl = document.querySelector(
    'script[src*="teachany-section-hints"]'
  );
  var cfg = {
    hintsUrl:
      (scriptEl && scriptEl.dataset.hintsUrl) || "./section-hints.json",
    autoHideMs: parseInt(
      (scriptEl && scriptEl.dataset.autoHide) || "8000",
      10
    ),
    threshold: parseFloat(
      (scriptEl && scriptEl.dataset.threshold) || "0.35"
    ),
  };

  var state = {
    bubble: null,
    hideTimer: null,
    lastKey: null,
    externalHints: {}, // 从 section-hints.json 加载
  };

  function loadExternalHints() {
    return fetch(cfg.hintsUrl)
      .then(function (r) {
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (j) {
        if (j && typeof j === "object") state.externalHints = j;
      })
      .catch(function () {});
  }

  function buildBubble() {
    var b = document.createElement("div");
    b.className = "teachany-section-hint";
    b.setAttribute("role", "status");
    b.setAttribute("aria-live", "polite");

    var close = document.createElement("button");
    close.className = "tsh-close";
    close.textContent = "✕";
    close.title = "关闭提示";
    close.addEventListener("click", function (e) {
      e.stopPropagation();
      hide();
    });

    var span = document.createElement("span");
    span.className = "tsh-text";

    b.appendChild(span);
    b.appendChild(close);

    // 点击气泡 → 打开 AI 学伴（若存在）
    b.addEventListener("click", function () {
      var fab = document.querySelector(".ai-tutor-fab");
      if (fab && typeof fab.click === "function") {
        fab.click();
      }
      hide();
    });

    document.body.appendChild(b);
    state.bubble = b;
  }

  function show(text, key) {
    if (!state.bubble) buildBubble();
    if (state.lastKey === key) return; // 已在展示同一段
    state.lastKey = key;

    var span = state.bubble.querySelector(".tsh-text");
    span.textContent = text;
    state.bubble.classList.add("visible");

    clearTimeout(state.hideTimer);
    if (cfg.autoHideMs > 0) {
      state.hideTimer = setTimeout(hide, cfg.autoHideMs);
    }
  }

  function hide() {
    if (state.bubble) state.bubble.classList.remove("visible");
    clearTimeout(state.hideTimer);
    state.lastKey = null;
  }

  function collectTargets() {
    // 1) 显式 data-tsh 的元素
    var explicit = Array.prototype.slice.call(
      document.querySelectorAll("[data-tsh]")
    );
    // 2) 根据 section-hints.json 的 key（#id 或 [data-tsh-key]）
    var mapped = [];
    Object.keys(state.externalHints).forEach(function (key) {
      var el = document.getElementById(key);
      if (!el) el = document.querySelector('[data-tsh-key="' + key + '"]');
      if (el) {
        el._tshKey = key;
        el._tshText = state.externalHints[key];
        mapped.push(el);
      }
    });
    // 去重
    var seen = new Set();
    var all = [];
    explicit.concat(mapped).forEach(function (el) {
      if (seen.has(el)) return;
      seen.add(el);
      all.push(el);
    });
    return all;
  }

  function init() {
    if (!("IntersectionObserver" in window)) return;
    loadExternalHints().then(function () {
      var targets = collectTargets();
      if (targets.length === 0) return;

      var observer = new IntersectionObserver(
        function (entries) {
          // 找出可见度最高的一个
          var best = null;
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            if (!best || e.intersectionRatio > best.intersectionRatio)
              best = e;
          });
          if (!best) return;
          var el = best.target;
          var text =
            el.getAttribute("data-tsh") || el._tshText || "";
          var key = el.id || el._tshKey || text.slice(0, 10);
          if (text) show(text, key);
        },
        { threshold: [cfg.threshold, 0.6] }
      );

      targets.forEach(function (el) {
        observer.observe(el);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TeachAnySectionHints = {
    show: show,
    hide: hide,
    state: state,
    cfg: cfg,
  };
})();
