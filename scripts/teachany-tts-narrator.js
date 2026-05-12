/* ==================================================================
 * TeachAny · 标准 TTS 朗读悬浮控制器（v7.7.4）
 *
 * 功能：
 *  - 自动发现 `[data-tts]` 段落（按文档顺序收集）
 *  - 点击 ▶️ 依次朗读每一段，朗读时该段用 .tts-narrator-active 高亮并 scrollIntoView
 *  - 可选加载 `./narration.json`，以 key 对应段落 data-tts 值，提供高质量文稿
 *  - 零音频文件、零配置即可启用；自动插入右下角悬浮控制器
 *  - 与标准 `teachany-audio-player` 模块协同：检测到底部音频条播放时，TTS 控制器
 *    上移 80px 避让
 *  - 支持 0.85×/1.0×/1.15×/1.3× 语速循环切换
 *  - 支持折叠（长按 ⏸ 两秒或双击状态栏）
 *
 * 使用：
 *  <link rel="stylesheet" href="../../scripts/teachany-tts-narrator.css">
 *  <script src="../../scripts/teachany-tts-narrator.js" defer></script>
 * 在 `<body>` 底部可选放：<div data-teachany-tts></div>（不放也会自动插入到 body 末尾）
 * 在需要朗读的段落上加：<div data-tts="section-key">…</div>
 * 可选根目录同级提供 narration.json：{"section-key":"精修朗读文稿..."}
 *
 * 配置（可选，通过 script 标签的 data-tts-* 属性）：
 *   data-tts-lang="zh-CN"   朗读语言，默认 zh-CN
 *   data-tts-rate="0.95"    初始语速，默认 0.95
 *   data-tts-narration="./narration.json"  文稿地址，默认 ./narration.json
 *   data-tts-disabled="true" 禁用（只初始化气泡不插入控件）
 * ================================================================== */

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__teachanyTtsNarrator) return; // idempotent
  window.__teachanyTtsNarrator = true;

  var SCRIPT_SEL = 'script[src*="teachany-tts-narrator"]';
  var scriptEl = document.querySelector(SCRIPT_SEL);
  var cfg = {
    lang: (scriptEl && scriptEl.dataset.ttsLang) || "zh-CN",
    rate: parseFloat((scriptEl && scriptEl.dataset.ttsRate) || "0.95"),
    narrationUrl:
      (scriptEl && scriptEl.dataset.ttsNarration) || "./narration.json",
    disabled: !!(scriptEl && scriptEl.dataset.ttsDisabled === "true"),
  };

  var RATES = [0.85, 1.0, 1.15, 1.3];
  var state = {
    index: 0,
    playing: false,
    paused: false,
    rate: cfg.rate,
    sections: [], // [{key, el}]
    narration: {}, // {key: text}
    utter: null,
    host: null,
    statusEl: null,
    playBtn: null,
    rateBtn: null,
  };

  // ---------- 1. 收集段落 ----------
  function collectSections() {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("[data-tts]")
    );
    nodes.sort(function (a, b) {
      var pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    state.sections = nodes.map(function (el) {
      return { key: el.getAttribute("data-tts"), el: el };
    });
  }

  // ---------- 2. 加载 narration.json（失败静默） ----------
  function loadNarration() {
    if (!cfg.narrationUrl) return Promise.resolve();
    return fetch(cfg.narrationUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("narration 404");
        return r.json();
      })
      .then(function (j) {
        if (j && typeof j === "object") state.narration = j;
      })
      .catch(function () {
        /* 静默 */
      });
  }

  // ---------- 3. 悬浮控件 ----------
  function buildHost() {
    var existing = document.querySelector(
      "[data-teachany-tts],.tts-narrator-host"
    );
    var host;
    if (existing && existing.hasAttribute("data-teachany-tts")) {
      host = existing;
      host.classList.add("tts-narrator-host");
    } else if (existing) {
      host = existing;
    } else {
      host = document.createElement("div");
      host.setAttribute("data-teachany-tts", "");
      host.className = "tts-narrator-host";
      document.body.appendChild(host);
    }

    host.innerHTML = "";
    var prevBtn = makeBtn("⏮", "上一段", function () {
      gotoRelative(-1);
    });
    var playBtn = makeBtn("▶️", "播放/暂停", toggle);
    var nextBtn = makeBtn("⏭", "下一段", function () {
      gotoRelative(1);
    });
    var statusEl = document.createElement("span");
    statusEl.className = "ttsn-status";
    statusEl.textContent = "就绪";
    var rateBtn = makeBtn("1.0×", "切换语速", cycleRate);
    rateBtn.classList.remove("ttsn-btn");
    rateBtn.classList.add("ttsn-rate");

    var mid = document.createElement("span");
    mid.className = "ttsn-mid";
    mid.style.display = "contents";
    mid.appendChild(prevBtn);
    mid.appendChild(playBtn);
    mid.appendChild(nextBtn);
    mid.appendChild(statusEl);
    mid.appendChild(rateBtn);

    host.appendChild(mid);

    // 双击状态栏折叠
    statusEl.addEventListener("dblclick", function () {
      host.classList.toggle("collapsed");
    });

    state.host = host;
    state.statusEl = statusEl;
    state.playBtn = playBtn;
    state.rateBtn = rateBtn;

    updateUI();
  }

  function makeBtn(text, title, onClick) {
    var b = document.createElement("button");
    b.textContent = text;
    b.title = title;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  // ---------- 4. 朗读核心 ----------
  function stopSpeech() {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    state.playing = false;
    state.paused = false;
  }

  function clearHighlights() {
    document
      .querySelectorAll(".tts-narrator-active")
      .forEach(function (e) {
        e.classList.remove("tts-narrator-active");
      });
  }

  function playCurrent() {
    if (!("speechSynthesis" in window)) {
      state.statusEl.textContent = "当前浏览器不支持 TTS";
      return;
    }
    if (state.sections.length === 0) {
      state.statusEl.textContent = "无可朗读段落";
      return;
    }
    if (state.index >= state.sections.length) state.index = 0;
    if (state.index < 0) state.index = state.sections.length - 1;

    var item = state.sections[state.index];
    if (!item || !item.el) {
      state.index = (state.index + 1) % state.sections.length;
      return;
    }

    clearHighlights();
    item.el.classList.add("tts-narrator-active");
    try {
      item.el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (_) {}

    var text = (state.narration && state.narration[item.key]) || item.el.textContent;
    text = (text || "").trim().replace(/\s+/g, " ");
    if (!text) {
      gotoRelative(1);
      return;
    }

    stopSpeech();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = cfg.lang;
    u.rate = state.rate;
    u.onend = function () {
      if (!state.playing) return; // 被打断
      // 自动进入下一段
      if (state.index < state.sections.length - 1) {
        state.index += 1;
        playCurrent();
      } else {
        state.playing = false;
        clearHighlights();
        updateUI();
      }
    };
    u.onerror = function () {
      state.playing = false;
      updateUI();
    };
    state.utter = u;
    state.playing = true;
    state.paused = false;
    window.speechSynthesis.speak(u);
    updateUI();
  }

  function toggle() {
    if (state.playing && !state.paused) {
      try {
        window.speechSynthesis.pause();
      } catch (_) {}
      state.paused = true;
      updateUI();
      return;
    }
    if (state.playing && state.paused) {
      try {
        window.speechSynthesis.resume();
      } catch (_) {}
      state.paused = false;
      updateUI();
      return;
    }
    playCurrent();
  }

  function gotoRelative(delta) {
    stopSpeech();
    clearHighlights();
    state.index = Math.max(
      0,
      Math.min(state.sections.length - 1, state.index + delta)
    );
    playCurrent();
  }

  function cycleRate() {
    var i = RATES.indexOf(state.rate);
    i = (i + 1) % RATES.length;
    state.rate = RATES[i];
    // 即时应用到当前朗读
    if (state.playing) {
      stopSpeech();
      playCurrent();
    }
    updateUI();
  }

  function updateUI() {
    if (!state.host) return;
    if (state.playBtn) {
      state.playBtn.textContent =
        state.playing && !state.paused ? "⏸️" : "▶️";
    }
    if (state.rateBtn) state.rateBtn.textContent = state.rate.toFixed(2) + "×";
    if (state.statusEl) {
      if (state.sections.length === 0) {
        state.statusEl.textContent = "无朗读段落";
      } else if (!state.playing) {
        state.statusEl.textContent = "就绪 · " + state.sections.length + " 段";
      } else if (state.paused) {
        state.statusEl.textContent =
          "已暂停：" + (state.sections[state.index]?.key || "");
      } else {
        state.statusEl.textContent =
          "朗读中：" + (state.sections[state.index]?.key || "");
      }
    }
  }

  // ---------- 5. 页面卸载时停止朗读 ----------
  window.addEventListener("beforeunload", stopSpeech);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state.playing) {
      try {
        window.speechSynthesis.pause();
      } catch (_) {}
      state.paused = true;
      updateUI();
    }
  });

  // ---------- 6. 启动 ----------
  function init() {
    if (cfg.disabled) return;
    collectSections();
    if (state.sections.length === 0) {
      // 没有 data-tts 段落就不插入任何 UI
      return;
    }
    buildHost();
    loadNarration().then(updateUI);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露命名空间供调试/扩展
  window.TeachAnyTTSNarrator = {
    state: state,
    cfg: cfg,
    play: playCurrent,
    stop: stopSpeech,
    next: function () {
      gotoRelative(1);
    },
    prev: function () {
      gotoRelative(-1);
    },
    toggle: toggle,
    cycleRate: cycleRate,
  };
})();
