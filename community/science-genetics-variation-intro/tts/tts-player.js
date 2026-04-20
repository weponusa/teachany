/**
 * TeachAny TTS Player v1.1 — Edge TTS Only
 * 强制使用预生成MP3（Edge TTS生成），不降级Web Speech
 */
(function () {
  'use strict';

  const TTSPlayer = {
    narration: null,
    currentSeg: -1,
    isPlaying: false,
    isPaused: false,
    audio: null,

    // 初始化
    init(narrationData) {
      this.narration = narrationData;
      this.createUI();
      this.bindEvents();
      console.log('[TTS] Edge TTS Player 初始化，共', narrationData.segments.length, '段旁白');
    },

    // 创建TTS控制UI
    createUI() {
      const existing = document.getElementById('tts-player');
      if (existing) existing.remove();

      const ui = document.createElement('div');
      ui.id = 'tts-player';
      ui.innerHTML = `
        <div class="tts-controls" style="
          position: fixed;
          bottom: 80px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 999;
          font-family: -apple-system, sans-serif;
        ">
          <button id="tts-play-btn" style="
            width: 40px; height: 40px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          " title="播放旁白">▶</button>
          <div class="tts-info" style="flex: 1; min-width: 0;">
            <div class="tts-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">🎧 Edge TTS 旁白</div>
            <div class="tts-progress-bar" style="
              height: 4px;
              background: #eee;
              border-radius: 2px;
              overflow: hidden;
            ">
              <div class="tts-progress" style="
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                width: 0%;
                transition: width 0.3s;
              "></div>
            </div>
          </div>
          <button id="tts-close-btn" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #999;
          " title="关闭语音">×</button>
        </div>
      `;
      document.body.appendChild(ui);
    },

    // 绑定事件
    bindEvents() {
      const playBtn = document.getElementById('tts-play-btn');
      const closeBtn = document.getElementById('tts-close-btn');
      if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    },

    // 切换播放/暂停
    togglePlay() {
      if (this.isPlaying && !this.isPaused) {
        this.pause();
      } else if (this.isPaused) {
        this.resume();
      } else {
        this.play();
      }
    },

    // 播放
    play() {
      this.isPlaying = true;
      this.isPaused = false;
      this.currentSeg = 0;
      this.playSegment(0);
      this.updateUI();
    },

    // 播放指定段落（强制MP3）
    playSegment(index) {
      if (!this.narration) return;
      if (index >= this.narration.segments.length) {
        this.stop();
        return;
      }

      this.currentSeg = index;
      const seg = this.narration.segments[index];
      const mp3Path = `tts/${seg.id}.mp3`;

      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }

      this.audio = new Audio(mp3Path);

      this.audio.addEventListener('canplaythrough', () => {
        this.audio.play().catch(e => {
          console.error('[TTS] 播放失败:', mp3Path, e);
          this.showError(`无法播放 ${mp3Path}，文件可能缺失`);
          // 不再降级，直接跳过
          setTimeout(() => this.playSegment(index + 1), 1000);
        });
      }, { once: true });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio.duration) {
          const progress = (this.audio.currentTime / this.audio.duration) * 100;
          this.updateProgress(progress);
        }
      });

      this.audio.addEventListener('ended', () => {
        this.playSegment(index + 1);
      });

      this.audio.addEventListener('error', () => {
        console.error('[TTS] MP3文件加载失败:', mp3Path);
        this.showError(`MP3文件缺失: ${mp3Path}。请用 edge-tts 生成：`);
        this.showError(`  edge-tts --voice "zh-CN-XiaoxiaoNeural" --text "..." --write-media tts/${seg.id}.mp3`);
        // 不再降级，停止播放
        this.stop();
      }, { once: true });

      // 高亮对应幻灯片
      if (seg.slideIndex !== undefined) {
        this.highlightSlide(seg.slideIndex);
      }

      this.audio.load();
    },

    // 显示错误提示
    showError(msg) {
      let errDiv = document.getElementById('tts-error');
      if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.id = 'tts-error';
        errDiv.style.cssText = 'position:fixed;bottom:140px;right:20px;background:#fee;color:#c33;padding:8px 12px;border-radius:8px;font-size:12px;max-width:300px;z-index:1000;';
        document.body.appendChild(errDiv);
      }
      errDiv.textContent = msg;
      errDiv.style.display = 'block';
      setTimeout(() => { if (errDiv) errDiv.style.display = 'none'; }, 5000);
    },

    // 高亮幻灯片
    highlightSlide(slideIndex) {
      const slides = document.querySelectorAll('.slide, section, [class*="slide"]');
      if (slides && slides[slideIndex]) {
        slides[slideIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    // 更新进度条
    updateProgress(percent) {
      const progressBar = document.querySelector('.tts-progress');
      if (progressBar) {
        progressBar.style.width = `${Math.min(percent, 100)}%`;
      }
    },

    // 更新UI
    updateUI() {
      const playBtn = document.getElementById('tts-play-btn');
      if (playBtn) {
        playBtn.textContent = this.isPaused ? '▶' : '⏸';
      }
    },

    // 暂停
    pause() {
      this.isPaused = true;
      if (this.audio) this.audio.pause();
      this.updateUI();
    },

    // 恢复
    resume() {
      this.isPaused = false;
      if (this.audio) this.audio.play();
      this.updateUI();
    },

    // 停止
    stop() {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentSeg = -1;
      if (this.audio) { this.audio.pause(); this.audio = null; }
      this.updateProgress(0);
      this.updateUI();
    },

    // 关闭
    close() {
      this.stop();
      const ui = document.getElementById('tts-player');
      if (ui) ui.remove();
      const err = document.getElementById('tts-error');
      if (err) err.remove();
    }
  };

  // 导出到全局
  window.TeachAnyTTS = TTSPlayer;

  // 自动加载 narration.json 并初始化
  fetch('tts/narration.json')
    .then(r => r.json())
    .then(data => TTSPlayer.init(data))
    .catch(e => console.warn('[TTS] 未找到 tts/narration.json，TTS Player 未初始化'));
})();
