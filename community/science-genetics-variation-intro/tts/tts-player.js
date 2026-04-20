/**
 * TeachAny TTS Player v1.0
 * 支持预生成MP3 + Web Speech API降级
 */
(function() {
  'use strict';

  const TTSPlayer = {
    narration: null,
    currentSeg: -1,
    isPlaying: false,
    isPaused: false,
    audio: null,
    useWebSpeechFallback: false,

    // 初始化
    init(narrationData) {
      this.narration = narrationData;
      this.createUI();
      this.bindEvents();
      console.log('[TTS] 初始化完成，共', narrationData.segments.length, '段旁白');
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
          ">▶</button>
          <div class="tts-info" style="flex: 1; min-width: 0;">
            <div class="tts-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">🎧 语音旁白</div>
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
          ">×</button>
        </div>
      `;
      document.body.appendChild(ui);

      // 检查是否有MP3文件
      this.checkAudioFiles();
    },

    // 检查MP3文件是否存在
    checkAudioFiles() {
      const seg0 = this.narration.segments[0];
      if (!seg0) return;

      const testAudio = new Audio(`tts/${seg0.id}.mp3`);
      testAudio.addEventListener('canplaythrough', () => {
        console.log('[TTS] MP3文件可用，使用预生成音频');
        this.useWebSpeechFallback = false;
      });
      testAudio.addEventListener('error', () => {
        console.log('[TTS] MP3文件不可用，降级到Web Speech API');
        this.useWebSpeechFallback = true;
      });
      testAudio.load();
    },

    // 绑定事件
    bindEvents() {
      const playBtn = document.getElementById('tts-play-btn');
      const closeBtn = document.getElementById('tts-close-btn');

      playBtn.addEventListener('click', () => this.togglePlay());
      closeBtn.addEventListener('click', () => this.close());
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

    // 播放指定段落
    playSegment(index) {
      if (index >= this.narration.segments.length) {
        this.stop();
        return;
      }

      this.currentSeg = index;
      const seg = this.narration.segments[index];

      if (this.useWebSpeechFallback) {
        this.playWithWebSpeech(seg);
      } else {
        this.playWithMP3(seg, index);
      }
    },

    // 使用MP3播放
    playWithMP3(seg, index) {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }

      this.audio = new Audio(`tts/${seg.id}.mp3`);
      this.audio.addEventListener('timeupdate', () => {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.updateProgress(progress);
      });
      this.audio.addEventListener('ended', () => {
        this.playSegment(index + 1);
      });
      this.audio.play().catch(e => {
        console.warn('[TTS] MP3播放失败，降级到Web Speech:', e);
        this.useWebSpeechFallback = true;
        this.playWithWebSpeech(seg);
      });

      // 高亮对应幻灯片
      this.highlightSlide(seg.slideIndex);
    },

    // 使用Web Speech API播放
    playWithWebSpeech(seg) {
      if (!('speechSynthesis' in window)) {
        console.warn('[TTS] 浏览器不支持Web Speech API');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => {
        this.playSegment(this.currentSeg + 1);
      };

      utterance.onerror = (e) => {
        console.warn('[TTS] Web Speech播放失败:', e);
        this.playSegment(this.currentSeg + 1);
      };

      speechSynthesis.speak(utterance);
      this.currentUtterance = utterance;

      // 高亮对应幻灯片
      this.highlightSlide(seg.slideIndex);

      // 模拟进度
      const duration = seg.text.length * 200;
      this.simulateProgress(duration);
    },

    // 模拟进度（Web Speech模式）
    simulateProgress(duration) {
      const start = Date.now();
      const update = () => {
        if (!this.isPlaying || this.isPaused) return;
        const elapsed = Date.now() - start;
        const progress = Math.min((elapsed / duration) * 100, 95);
        this.updateProgress(progress);
        if (progress < 95) {
          requestAnimationFrame(update);
        }
      };
      requestAnimationFrame(update);
    },

    // 高亮幻灯片
    highlightSlide(slideIndex) {
      // 尝试滚动到对应幻灯片
      const slides = document.querySelectorAll('.slide, [class*="slide"], section');
      if (slides && slides[slideIndex]) {
        slides[slideIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    // 更新进度条
    updateProgress(percent) {
      const progressBar = document.querySelector('.tts-progress');
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
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
      if (this.audio) {
        this.audio.pause();
      }
      if (this.currentUtterance) {
        speechSynthesis.pause();
      }
      this.updateUI();
    },

    // 恢复
    resume() {
      this.isPaused = false;
      if (this.audio) {
        this.audio.play();
      }
      if (this.currentUtterance) {
        speechSynthesis.resume();
      }
      this.updateUI();
    },

    // 停止
    stop() {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentSeg = -1;
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      if (this.currentUtterance) {
        speechSynthesis.cancel();
      }
      this.updateProgress(0);
      this.updateUI();
    },

    // 关闭
    close() {
      this.stop();
      const ui = document.getElementById('tts-player');
      if (ui) ui.remove();
    }
  };

  // 导出到全局
  window.TeachAnyTTS = TTSPlayer;
})();
