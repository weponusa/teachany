/* === TeachAny AI 学伴 v1.0（零依赖单文件）=== */
(function () {
  'use strict';

  const CONFIG = window.__TEACHANY_TUTOR_CONFIG__ || {};
  const STORAGE_KEY = 'teachany_tutor_key';

  /* ---------- 初始化 ---------- */
  function init() {
    injectStyles();
    createFab();
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (!savedKey) {
      showConfigPanel();
    }
  }

  /* ---------- 样式注入 ---------- */
  function injectStyles() {
    if (document.getElementById('teachany-tutor-styles')) return;
    const css = `
      #tutor-fab {
        position:fixed; bottom:24px; right:24px; z-index:9999;
        width:56px; height:56px; border-radius:50%;
        background:linear-gradient(135deg,#6366f1,#8b5cf6);
        border:none; color:#fff; font-size:24px;
        box-shadow:0 4px 20px rgba(99,102,241,0.4);
        cursor:pointer; transition:transform 0.2s;
      }
      #tutor-fab:hover { transform:scale(1.1); }
      #tutor-panel {
        position:fixed; bottom:90px; right:24px; z-index:10000;
        width:360px; max-height:480px; border-radius:16px;
        background:#1e293b; color:#e2e8f0;
        box-shadow:0 8px 32px rgba(0,0,0,0.3);
        display:none; flex-direction:column; overflow:hidden;
        font-family:system-ui,sans-serif;
      }
      #tutor-panel.open { display:flex; }
      .tutor-header {
        background:linear-gradient(135deg,#6366f1,#8b5cf6);
        padding:16px; color:#fff;
        display:flex; justify-content:space-between; align-items:center;
      }
      .tutor-header h3 { margin:0; font-size:16px; }
      .tutor-close { background:none; border:none; color:#fff; font-size:20px; cursor:pointer; }
      .tutor-messages {
        flex:1; padding:16px; overflow-y:auto;
        display:flex; flex-direction:column; gap:12px;
      }
      .tutor-msg {
        padding:10px 14px; border-radius:12px;
        font-size:14px; line-height:1.6; max-width:85%;
      }
      .tutor-msg.bot { background:rgba(99,102,241,0.15); align-self:flex-start; border-bottom-left-radius:4px; }
      .tutor-msg.user { background:#6366f1; align-self:flex-end; border-bottom-right-radius:4px; }
      .tutor-input-area {
        display:flex; padding:12px; gap:8px;
        border-top:1px solid rgba(255,255,255,0.1);
      }
      .tutor-input-area input {
        flex:1; padding:10px 14px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.15);
        background:rgba(255,255,255,0.05); color:#fff;
        font-size:14px; outline:none;
      }
      .tutor-input-area button {
        padding:10px 16px; border-radius:8px; border:none;
        background:#6366f1; color:#fff; cursor:pointer; font-size:14px;
      }
      .tutor-config {
        padding:20px; color:#e2e8f0;
      }
      .tutor-config h4 { margin:0 0 8px 0; font-size:15px; }
      .tutor-config p { font-size:13px; color:#94a3b8; margin-bottom:16px; }
      .tutor-config label { display:block; font-size:13px; color:#94a3b8; margin-bottom:4px; }
      .tutor-config input {
        width:100%; padding:10px 14px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.15);
        background:rgba(255,255,255,0.05); color:#fff;
        font-size:14px; margin-bottom:16px; box-sizing:border-box;
      }
      .tutor-config button {
        width:100%; padding:12px; border-radius:8px; border:none;
        background:#6366f1; color:#fff; cursor:pointer;
        font-size:14px; font-weight:600;
      }
      .tutor-save-msg { font-size:12px; color:#22c55e; margin-top:8px; display:none; }
    `;
    const style = document.createElement('style');
    style.id = 'teachany-tutor-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- FAB ---------- */
  function createFab() {
    const fab = document.createElement('button');
    fab.id = 'tutor-fab';
    fab.innerHTML = '🤖';
    fab.title = 'AI 学伴';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);
  }

  function togglePanel() {
    let panel = document.getElementById('tutor-panel');
    if (!panel) { panel = createPanel(); }
    panel.classList.toggle('open');
  }

  /* ---------- 面板 ---------- */
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'tutor-panel';

    panel.innerHTML = `
      <div class="tutor-header">
        <h3>🤖 AI 学伴</h3>
        <button class="tutor-close" onclick="document.getElementById('tutor-panel').classList.remove('open')">✕</button>
      </div>
      <div class="tutor-messages" id="tutorMessages"></div>
      <div class="tutor-input-area">
        <input type="text" id="tutorInput" placeholder="输入问题…" onkeydown="if(event.key==='Enter')window.__tutorSend()">
        <button onclick="window.__tutorSend()">发送</button>
      </div>
    `;
    document.body.appendChild(panel);

    // 显示欢迎语
    addMessage('bot', getWelcome());
    return panel;
  }

  function getWelcome() {
    const msgs = {
      elementary: '你好！我是你的 AI 学伴 🤖 对当前课件有疑问就问我吧～（2-3句话就能说清楚！）',
      middle: '你好！我是你的 AI 学伴 🤖 有任何关于本课的问题都可以问我，我会用结构化的方式帮你解答。',
      high: 'Hello! I\'m your AI tutor 🤖 Feel free to ask any questions about this lesson. I\'ll provide detailed explanations with professional terminology when needed.'
    };
    return msgs[CONFIG.grade] || msgs.elementary;
  }

  function addMessage(who, text) {
    const container = document.getElementById('tutorMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'tutor-msg ' + who;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  /* ---------- 发送消息 ---------- */
  window.__tutorSend = function () {
    const input = document.getElementById('tutorInput');
    const text = input?.value?.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) { showConfigPanel(); return; }
    callAPI(text);
  };

  async function callAPI(userMsg) {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    const context = CONFIG.getContext ? CONFIG.getContext() : '';
    const gradeLabel = { elementary: '小学', middle: '初中', high: '高中' }[CONFIG.grade] || '小学';

    const systemPrompt = `你是${CONFIG.courseTitle || '本课'}的AI学伴，面向${gradeLabel}学生。回答长度：${gradeLabel === '小学' ? '2-3句口语化' : gradeLabel === '初中' ? '3-5句结构化' : '5-8句可含专业术语'}。不要使用复杂公式或长篇大论。`;

    addMessage('bot', '🤔 思考中…');

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `课件上下文：${context}\n\n学生问题：${userMsg}` }
          ],
          max_tokens: 300
        })
      });
      const data = await resp.json();
      // 移除"思考中"
      const container = document.getElementById('tutorMessages');
      const thinking = container?.lastElementChild;
      if (thinking) thinking.remove();

      const reply = data.choices?.[0]?.message?.content || '抱歉，暂时无法回答，请稍后再试。';
      addMessage('bot', reply);
    } catch (e) {
      const container = document.getElementById('tutorMessages');
      const thinking = container?.lastElementChild;
      if (thinking) thinking.remove();
      addMessage('bot', '⚠️ 网络错误或 API Key 无效，请检查配置。');
    }
  }

  /* ---------- 配置面板 ---------- */
  function showConfigPanel() {
    let panel = document.getElementById('tutor-panel');
    if (!panel) panel = createPanel();
    const messages = panel.querySelector('.tutor-messages');
    if (!messages) return;

    messages.innerHTML = '';
    const config = document.createElement('div');
    config.className = 'tutor-config';
    config.innerHTML = `
      <h4>🔑 配置 API Key</h4>
      <p>API Key 仅保存在本浏览器（localStorage），不会上传到任何服务器。<br>支持 OpenAI 兼容接口（OpenAI、DeepSeek 等）。</p>
      <label>API Key（sk-...）</label>
      <input type="password" id="tutorApiKey" placeholder="sk-...">
      <label>API 地址（可选，默认 OpenAI）</label>
      <input type="text" id="tutorApiBase" placeholder="https://api.openai.com/v1">
      <button onclick="window.__tutorSaveKey()">保存并开始</button>
      <div class="tutor-save-msg" id="tutorSaveMsg">✅ 已保存！可以开始提问了。</div>
    `;
    messages.appendChild(config);
    panel.classList.add('open');
  }

  window.__tutorSaveKey = function () {
    const key = document.getElementById('tutorApiKey')?.value?.trim();
    if (!key) { alert('请输入 API Key！'); return; }
    localStorage.setItem(STORAGE_KEY, key);
    const base = document.getElementById('tutorApiBase')?.value?.trim();
    if (base) localStorage.setItem('teachany_tutor_base', base);
    const msg = document.getElementById('tutorSaveMsg');
    if (msg) { msg.style.display = 'block'; }
    setTimeout(() => {
      const panel = document.getElementById('tutor-panel');
      if (panel) {
        const msgs = panel.querySelector('.tutor-messages');
        if (msgs) {
          msgs.innerHTML = '';
          addMessage('bot', getWelcome());
        }
      }
    }, 1000);
  };

  /* ---------- 启动 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
