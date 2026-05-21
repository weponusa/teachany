/*! TeachAny Standard Audio Player · v1.0
 * --------------------------------------------------
 * 用法（HTML）：
 *   <link rel="stylesheet" href="../../scripts/teachany-audio-player.css">
 *
 *   <!-- 在课件页面任何位置（推荐 header 之后）插入 -->
 *   <div data-teachany-audio>
 *     <script type="application/json" data-teachany-audio-playlist>
 *       [
 *         {"id":"seg01","sectionId":"module-1","title":"模块1：什么是一次函数","src":"./tts/seg01_zh.mp3","subtitle":"y=kx+b 的定义"},
 *         {"id":"seg02","sectionId":"module-2","title":"模块2：图象与斜率","src":"./tts/seg02_zh.mp3"}
 *       ]
 *     </script>
 *   </div>
 *
 *   <script src="../../scripts/teachany-audio-player.js" defer></script>
 *
 * 行为：
 *   · 在页面右上角生成播放卡片（list + 当前曲目高亮）
 *   · 在页面底部生成连续播放条（进度+变速+下一曲）
 *   · 滚动进入对应 section 时自动切轨（IntersectionObserver）
 *   · 一首播完自动连播下一首
 *   · 速度按钮在 1x / 1.25x / 1.5x / 2x 之间循环
 */
(function () {
  "use strict";
  if (window.__TeachAnyAudioInit) return;
  window.__TeachAnyAudioInit = true;

  function readPlaylist(host) {
    var script = host.querySelector("script[type='application/json'][data-teachany-audio-playlist]");
    if (!script) return [];
    try { return JSON.parse(script.textContent.trim()); }
    catch (e) { console.error("[TeachAnyAudio] playlist JSON parse error", e); return []; }
  }

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  function buildPlayer(host, playlist) {
    if (!playlist.length) {
      host.innerHTML = '<div class="tap-empty">该课件暂未生成连续音频。</div>';
      return;
    }

    var configOnly = host.hidden || host.hasAttribute("data-audio-config-only") || host.id === "audio-config";
    if (!configOnly) host.classList.add("tap-host");

    /* 1. 课件内独立卡片：曲目列表。
       当 host 为 hidden / data-audio-config-only / #audio-config 时，只读取 playlist，
       不渲染集中音频模块，避免打断教学主线。 */
    var list = null;
    if (!configOnly) {
      var card = document.createElement("section");
      card.className = "tap-card";
      card.innerHTML =
        '<header class="tap-card-head">' +
          '<h3>🔊 连续音频讲解</h3>' +
          '<span class="tap-card-meta">' + playlist.length + ' 段 · 自动连播 · 滚动同步</span>' +
        '</header>' +
        '<ol class="tap-tracklist"></ol>';
      host.appendChild(card);

      list = card.querySelector(".tap-tracklist");
      playlist.forEach(function (t, i) {
        var li = document.createElement("li");
        li.className = "tap-track-item";
        li.dataset.idx = i;
        li.innerHTML =
          '<span class="tap-track-num">' + (i + 1) + '</span>' +
          '<div class="tap-track-meta">' +
            '<div class="tap-track-title">' + (t.title || ("第 " + (i + 1) + " 段")) + '</div>' +
            (t.subtitle ? '<div class="tap-track-sub">' + t.subtitle + '</div>' : '') +
          '</div>' +
          '<button class="tap-track-play" type="button" aria-label="播放">▶</button>';
        list.appendChild(li);
      });
    }

    /* 2. 全局底部连续播放条 */
    var bar = document.createElement("div");
    bar.className = "tap-bar";
    bar.innerHTML =
      '<button class="tap-btn tap-prev" type="button" aria-label="上一段">⏮</button>' +
      '<button class="tap-btn tap-play" type="button" aria-label="播放/暂停">▶</button>' +
      '<button class="tap-btn tap-next" type="button" aria-label="下一段">⏭</button>' +
      '<div class="tap-meta">' +
        '<div class="tap-now">未播放</div>' +
        '<div class="tap-progress"><div class="tap-fill"></div></div>' +
      '</div>' +
      '<span class="tap-time">0:00 / 0:00</span>' +
      '<button class="tap-btn tap-speed" type="button">1x</button>';
    document.body.appendChild(bar);

    var audio = new Audio();
    audio.preload = "metadata";
    var idx = -1;
    var speeds = [1, 1.25, 1.5, 2];
    var speedIdx = 0;

    var nowEl = bar.querySelector(".tap-now");
    var fillEl = bar.querySelector(".tap-fill");
    var progressEl = bar.querySelector(".tap-progress");
    var timeEl = bar.querySelector(".tap-time");
    var playBtn = bar.querySelector(".tap-play");
    var prevBtn = bar.querySelector(".tap-prev");
    var nextBtn = bar.querySelector(".tap-next");
    var speedBtn = bar.querySelector(".tap-speed");

    function highlight() {
      if (!list) return;
      list.querySelectorAll(".tap-track-item").forEach(function (li, i) {
        li.classList.toggle("active", i === idx);
      });
    }

    function play(i, autoplay) {
      if (i < 0 || i >= playlist.length) return;
      idx = i;
      audio.src = playlist[i].src;
      audio.playbackRate = speeds[speedIdx];
      if (autoplay !== false) {
        var p = audio.play();
        if (p && p.catch) p.catch(function (e) { console.warn("[TeachAnyAudio] autoplay blocked", e); });
      }
      bar.classList.add("active");
      document.body.classList.add("tap-bar-on");
      nowEl.textContent = playlist[i].title || ("第 " + (i + 1) + " 段");
      playBtn.textContent = autoplay !== false ? "⏸" : "▶";
      highlight();
    }

    if (list) {
      list.addEventListener("click", function (ev) {
        var li = ev.target.closest(".tap-track-item");
        if (!li) return;
        var i = parseInt(li.dataset.idx, 10);
        if (i === idx && !audio.paused) {
          audio.pause();
          playBtn.textContent = "▶";
        } else {
          play(i, true);
        }
      });
    }

    playBtn.addEventListener("click", function () {
      if (idx < 0) { play(0, true); return; }
      if (audio.paused) { audio.play(); playBtn.textContent = "⏸"; }
      else { audio.pause(); playBtn.textContent = "▶"; }
    });
    prevBtn.addEventListener("click", function () { play(Math.max(0, idx - 1), true); });
    nextBtn.addEventListener("click", function () {
      if (idx + 1 < playlist.length) play(idx + 1, true);
    });
    speedBtn.addEventListener("click", function () {
      speedIdx = (speedIdx + 1) % speeds.length;
      audio.playbackRate = speeds[speedIdx];
      speedBtn.textContent = speeds[speedIdx] + "x";
    });
    progressEl.addEventListener("click", function (e) {
      if (!audio.duration) return;
      var rect = progressEl.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
    audio.addEventListener("timeupdate", function () {
      var pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
      fillEl.style.width = pct + "%";
      timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
    });
    audio.addEventListener("ended", function () {
      if (idx + 1 < playlist.length) play(idx + 1, true);
      else { playBtn.textContent = "▶"; bar.classList.add("tap-finished"); }
    });
    audio.addEventListener("play", function () { playBtn.textContent = "⏸"; });
    audio.addEventListener("pause", function () { playBtn.textContent = "▶"; });

    /* 3. 滚动同步切轨（仅当用户已开始播放过） */
    var sectionMap = {};
    playlist.forEach(function (t, i) {
      if (t.sectionId) sectionMap[t.sectionId] = i;
    });
    if (Object.keys(sectionMap).length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (idx < 0) return; // 用户未开始，不打扰
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = sectionMap[entry.target.id];
          if (i !== undefined && i !== idx) play(i, true);
        });
      }, { threshold: 0.5 });
      Object.keys(sectionMap).forEach(function (sid) {
        var sec = document.getElementById(sid);
        if (sec) io.observe(sec);
      });
    }

    // 初始焦点
    play(0, false);
  }

  function init() {
    var hosts = document.querySelectorAll("[data-teachany-audio]");
    hosts.forEach(function (h) {
      var pl = readPlaylist(h);
      buildPlayer(h, pl);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
