/* ==================================================================
 * TeachAny · 标准 TTS 朗读悬浮控制器（v8.0.0）
 *
 * v8 变更：默认播放 Edge Neural 预录 mp3（data-teachany-audio-playlist），
 * 禁止浏览器 Web Speech 金属音；仅开发调试可设 data-tts-mode="webspeech"。
 *
 * 功能：
 *  - 自动发现 `[data-tts]` 段落（按文档顺序收集）
 *  - 有预录 mp3 时播放高质量音频；朗读时段落高亮并 scrollIntoView
 *  - 与 `teachany-audio-player` 共用 playlist（track.section / ttsKey 映射 data-tts）
 *  - 支持 0.85×/1.0×/1.15×/1.3× 语速循环切换
 *
 * 配置（script 标签 data-tts-* 属性）：
 *   data-tts-mode="mp3"       默认；有 playlist 时强制 mp3
 *   data-tts-mode="webspeech" 仅本地调试，交付课件禁止
 *   data-tts-disabled="true"  禁用控件
 * ================================================================== */

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__teachanyTtsNarrator) return;
  window.__teachanyTtsNarrator = true;

  var SCRIPT_SEL = 'script[src*="teachany-tts-narrator"]';
  var scriptEl = document.querySelector(SCRIPT_SEL);
  var cfg = {
    lang: (scriptEl && scriptEl.dataset.ttsLang) || "zh-CN",
    rate: parseFloat((scriptEl && scriptEl.dataset.ttsRate) || "0.95"),
    narrationUrl:
      (scriptEl && scriptEl.dataset.ttsNarration) || "./narration.json",
    mode: (scriptEl && scriptEl.dataset.ttsMode) || "mp3",
    disabled: !!(scriptEl && scriptEl.dataset.ttsDisabled === "true"),
  };

  var RATES = [0.85, 1.0, 1.15, 1.3];
  var state = {
    index: 0,
    playing: false,
    paused: false,
    rate: cfg.rate,
    sections: [],
    narration: {},
    audioMap: {},
    useMp3: false,
    audio: null,
    utter: null,
    host: null,
    statusEl: null,
    playBtn: null,
    rateBtn: null,
  };

  function readPlaylist() {
    var host = document.querySelector("[data-teachany-audio]");
    if (!host) return [];
    var script = host.querySelector(
      "script[type='application/json'][data-teachany-audio-playlist]"
    );
    if (!script) return [];
    try {
      return JSON.parse(script.textContent.trim());
    } catch (_) {
      return [];
    }
  }

  function buildAudioMap(playlist) {
    var map = {};
    playlist.forEach(function (track) {
      if (!track || !track.src) return;
      var key =
        track.section || track.ttsKey || track.tts || track.id || track.sectionId;
      if (key) map[key] = { src: track.src, title: track.title || key };
    });
    return map;
  }

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
    var sections = nodes.map(function (el) {
      return { key: el.getAttribute("data-tts"), el: el };
    });
    if (state.useMp3) {
      sections = sections.filter(function (s) {
        return state.audioMap[s.key];
      });
    }
    state.sections = sections;
  }

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
      .catch(function () {});
  }

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

  function stopPlayback() {
    if (state.audio) {
      state.audio.pause();
      state.audio.onended = null;
      state.audio.onerror = null;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    state.playing = false;
    state.paused = false;
  }

  function clearHighlights() {
    document.querySelectorAll(".tts-narrator-active").forEach(function (e) {
      e.classList.remove("tts-narrator-active");
    });
  }

  function onSegmentEnd() {
    if (!state.playing) return;
    if (state.index < state.sections.length - 1) {
      state.index += 1;
      playCurrent();
    } else {
      state.playing = false;
      clearHighlights();
      updateUI();
    }
  }

  function playMp3(item) {
    var track = state.audioMap[item.key];
    if (!track) {
      gotoRelative(1);
      return;
    }
    if (!state.audio) state.audio = new Audio();
    stopPlayback();
    state.audio.src = track.src;
    state.audio.playbackRate = state.rate;
    state.audio.onended = onSegmentEnd;
    state.audio.onerror = function () {
      state.playing = false;
      if (state.statusEl) state.statusEl.textContent = "音频加载失败";
      updateUI();
    };
    state.playing = true;
    state.paused = false;
    var p = state.audio.play();
    if (p && p.catch) {
      p.catch(function () {
        state.playing = false;
        updateUI();
      });
    }
    updateUI();
  }

  function playWebSpeech(item) {
    if (!("speechSynthesis" in window)) {
      if (state.statusEl) state.statusEl.textContent = "当前浏览器不支持 TTS";
      return;
    }
    var text =
      (state.narration && state.narration[item.key]) || item.el.textContent;
    text = (text || "").trim().replace(/\s+/g, " ");
    if (!text) {
      gotoRelative(1);
      return;
    }
    stopPlayback();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = cfg.lang;
    u.rate = state.rate;
    u.onend = onSegmentEnd;
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

  function playCurrent() {
    if (state.sections.length === 0) {
      if (state.statusEl) {
        state.statusEl.textContent = state.useMp3
          ? "无预录朗读段落"
          : "无可朗读段落";
      }
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

    if (state.useMp3) playMp3(item);
    else playWebSpeech(item);
  }

  function toggle() {
    if (state.useMp3 && state.audio) {
      if (state.playing && !state.paused) {
        state.audio.pause();
        state.paused = true;
        updateUI();
        return;
      }
      if (state.playing && state.paused) {
        var p = state.audio.play();
        if (p && p.catch) p.catch(function () {});
        state.paused = false;
        updateUI();
        return;
      }
    } else if (state.playing && !state.paused) {
      try {
        window.speechSynthesis.pause();
      } catch (_) {}
      state.paused = true;
      updateUI();
      return;
    } else if (state.playing && state.paused) {
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
    stopPlayback();
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
    if (state.playing) {
      if (state.useMp3 && state.audio) {
        state.audio.playbackRate = state.rate;
      } else {
        stopPlayback();
        playCurrent();
      }
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
      var modeTag = state.useMp3 ? "Neural" : "Web";
      if (state.sections.length === 0) {
        state.statusEl.textContent = "无朗读段落";
      } else if (!state.playing) {
        state.statusEl.textContent =
          "就绪 · " + state.sections.length + " 段 · " + modeTag;
      } else if (state.paused) {
        state.statusEl.textContent =
          "已暂停：" + (state.sections[state.index]?.key || "");
      } else {
        state.statusEl.textContent =
          "朗读中：" + (state.sections[state.index]?.key || "");
      }
    }
  }

  window.addEventListener("beforeunload", stopPlayback);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state.playing) {
      if (state.useMp3 && state.audio) {
        state.audio.pause();
      } else {
        try {
          window.speechSynthesis.pause();
        } catch (_) {}
      }
      state.paused = true;
      updateUI();
    }
  });

  function init() {
    if (cfg.disabled) return;

    var playlist = readPlaylist();
    state.audioMap = buildAudioMap(playlist);
    var hasMp3 = Object.keys(state.audioMap).length > 0;
    state.useMp3 = cfg.mode !== "webspeech" && hasMp3;

    collectSections();
    if (state.sections.length === 0) return;

    buildHost();
    loadNarration().then(updateUI);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TeachAnyTTSNarrator = {
    state: state,
    cfg: cfg,
    play: playCurrent,
    stop: stopPlayback,
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
