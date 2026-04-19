/*!
 * TeachAny AI 学伴（v5.34）
 *
 * 特性：
 *   - 右下角 FAB 悬浮球，首次点击弹出 API Key 配置
 *   - OpenAI 兼容 API（baseUrl + apiKey + model，默认 gpt-4o-mini）
 *   - API Key 仅保存在 localStorage（明确告知用户）
 *   - 按 `window.__TEACHANY_TUTOR_CONFIG__` 提供的学段/学科/目标构造 system prompt
 *   - 答复难度按 grade 分级（小学 2-3 句 / 初中 3-5 句 / 高中 5-8 句）
 *   - 支持流式（SSE）答复
 *   - 自动从 IntersectionObserver 或 URL hash 抓取当前 section 作为上下文
 *
 * 安全：
 *   - 不发送任何遥测数据
 *   - 不把 Key 传给课件以外的任何 endpoint
 *   - localStorage key 加前缀 `teachany_tutor_` 便于用户自清
 */
(function () {
  'use strict';

  // ───────────────────────────────────────────────────────
  // 1. 配置与默认值
  // ───────────────────────────────────────────────────────
  const STORAGE_KEY = 'teachany_tutor_config';
  const HISTORY_KEY = 'teachany_tutor_history';
  const DEFAULTS = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  };

  function readUserConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.apiKey) return null;
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return null;
    }
  }

  function saveUserConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      baseUrl: cfg.baseUrl || DEFAULTS.baseUrl,
      apiKey: cfg.apiKey,
      model: cfg.model || DEFAULTS.model
    }));
  }

  function clearUserConfig() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
  }

  // ───────────────────────────────────────────────────────
  // 2. 课件元信息（来自 window.__TEACHANY_TUTOR_CONFIG__）
  // ───────────────────────────────────────────────────────
  function readCourseMeta() {
    const fromWindow = window.__TEACHANY_TUTOR_CONFIG__ || {};
    return {
      courseTitle: fromWindow.courseTitle || document.title || '本课件',
      subject: fromWindow.subject || (document.querySelector('meta[name="teachany-subject"]')?.content || 'general'),
      grade: Number(fromWindow.grade || document.querySelector('meta[name="teachany-grade"]')?.content || 9),
      learningObjectives: Array.isArray(fromWindow.learningObjectives) ? fromWindow.learningObjectives : [],
      getContext: typeof fromWindow.getContext === 'function' ? fromWindow.getContext : defaultGetContext
    };
  }

  function defaultGetContext() {
    // 1) 显式标记的 current section
    const current = document.querySelector('section.current-section, section.active, .section.current');
    if (current && current.innerText) return current.innerText.slice(0, 3000);
    // 2) URL hash 指向的 section
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target && target.innerText) return target.innerText.slice(0, 3000);
    }
    // 3) IntersectionObserver 命中（在初始化时绑定到所有 section）
    const visible = Array.from(document.querySelectorAll('section')).find(s => {
      const r = s.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight * 0.5;
    });
    if (visible && visible.innerText) return visible.innerText.slice(0, 3000);
    // 4) 回退：body 前 3000 字
    return document.body.innerText.slice(0, 3000);
  }

  function getCurrentSectionTitle() {
    const current = document.querySelector('section.current-section, section.active');
    if (current) {
      const h = current.querySelector('h1, h2, h3');
      if (h) return h.innerText.trim().slice(0, 40);
    }
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        const h = target.querySelector('h1, h2, h3');
        if (h) return h.innerText.trim().slice(0, 40);
      }
    }
    const visible = Array.from(document.querySelectorAll('section')).find(s => {
      const r = s.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight * 0.5;
    });
    if (visible) {
      const h = visible.querySelector('h1, h2, h3');
      if (h) return h.innerText.trim().slice(0, 40);
    }
    return '当前课件';
  }

  // ───────────────────────────────────────────────────────
  // 3. 按学段构造 system prompt
  // ───────────────────────────────────────────────────────
  function buildSystemPrompt(meta) {
    const grade = meta.grade;
    let style;
    if (grade <= 6) {
      style = '你是一位亲切友好的小学学伴。\n- 用 2-3 句话回答，口语化、生活化比喻。\n- 不用专业术语；如果必须提到术语，立刻用"就是..."解释。\n- 多用具体例子，少用抽象定义。\n- 鼓励学生继续提问。';
    } else if (grade <= 9) {
      style = '你是一位耐心的初中学伴。\n- 用 3-5 句话回答，结构化表达（先结论再原因）。\n- 可适度引入关键术语，必要时一句话解释。\n- 结合常见应用场景或题型举例。\n- 若学生的问题有深层误区，简短指出。';
    } else {
      style = '你是一位严谨的高中学伴。\n- 用 5-8 句话回答，逻辑清晰、有层次。\n- 可使用数学符号、公式和英文专业词。\n- 必要时给出推导思路或题型归类。\n- 对易错点给出针对性提醒。';
    }

    const objectives = meta.learningObjectives.length
      ? `\n学习目标：\n${meta.learningObjectives.map(o => '- ' + o).join('\n')}`
      : '';

    return `${style}

你正在辅导的课件：《${meta.courseTitle}》（学科：${meta.subject}，年级：G${meta.grade}）${objectives}

回答规则：
1. 紧扣课件上下文，优先用课件中提到的例子、定义、方法。
2. 学生问的若超出课件范围，用一句话引回到课件主题。
3. 禁止长篇大论。每次答复严格控制在上述字数范围内。
4. 禁止展示思维链或"让我思考..."等冗余文本，直接给学生最有用的答复。`;
  }

  // ───────────────────────────────────────────────────────
  // 4. UI 构造
  // ───────────────────────────────────────────────────────
  function createFab() {
    const fab = document.createElement('button');
    fab.className = 'ai-tutor-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'AI 学伴');
    fab.title = 'AI 学伴 · 问点什么吧';
    fab.textContent = '💡';
    document.body.appendChild(fab);
    return fab;
  }

  function createPanel(meta) {
    const panel = document.createElement('div');
    panel.className = 'ai-tutor-panel';
    panel.innerHTML = `
      <div class="ai-tutor-header">
        <div class="title">
          🎓 AI 学伴
          <span class="subtitle">${escapeHtml(meta.courseTitle)} · G${meta.grade}</span>
        </div>
        <button type="button" class="btn-clear" title="清空对话">清空</button>
        <button type="button" class="btn-close" title="关闭">✕</button>
      </div>
      <div class="ai-tutor-context-bar">
        <span class="pill">📍</span>
        <span class="ctx-title">当前学习：<span class="ctx-section">定位中...</span></span>
      </div>
      <div class="ai-tutor-messages"></div>
      <div class="ai-tutor-input-wrap">
        <textarea placeholder="针对当前内容提问... (Enter 发送, Shift+Enter 换行)" rows="1"></textarea>
        <button type="button" class="btn-send">发送</button>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function createConfigModal(initial, onSave, onCancel) {
    const mask = document.createElement('div');
    mask.className = 'ai-tutor-mask';
    mask.innerHTML = `
      <div class="ai-tutor-config" role="dialog" aria-labelledby="aitutor-title">
        <h2 id="aitutor-title">🎓 启用你的 AI 学伴</h2>
        <p class="subtitle">输入一个 OpenAI 兼容的 API Key，就可以在这个课件里向学伴提问啦。支持自建兼容接口（Ollama/vLLM/Azure OpenAI/国内代理）。</p>
        <label>API Base URL</label>
        <input type="text" name="baseUrl" value="${escapeAttr(initial.baseUrl)}" placeholder="https://api.openai.com/v1">
        <label>API Key</label>
        <input type="password" name="apiKey" value="${escapeAttr(initial.apiKey)}" placeholder="sk-...">
        <label>模型</label>
        <input type="text" name="model" value="${escapeAttr(initial.model)}" placeholder="gpt-4o-mini">
        <div class="privacy">
          🔒 你的 API Key 仅保存在此浏览器的 localStorage，关闭页面或清浏览器数据后失效。TeachAny 不会收集、上传、或把 Key 发给任何第三方。
        </div>
        <div class="actions">
          <button type="button" class="btn-cancel">取消</button>
          <button type="button" class="btn-save">保存并开始对话</button>
        </div>
      </div>
    `;
    document.body.appendChild(mask);

    const nodeBaseUrl = mask.querySelector('input[name="baseUrl"]');
    const nodeApiKey = mask.querySelector('input[name="apiKey"]');
    const nodeModel = mask.querySelector('input[name="model"]');
    const btnSave = mask.querySelector('.btn-save');
    const btnCancel = mask.querySelector('.btn-cancel');

    function updateSaveBtn() {
      btnSave.disabled = !nodeApiKey.value.trim();
    }
    nodeApiKey.addEventListener('input', updateSaveBtn);
    updateSaveBtn();

    btnSave.addEventListener('click', () => {
      const cfg = {
        baseUrl: (nodeBaseUrl.value || DEFAULTS.baseUrl).trim().replace(/\/$/, ''),
        apiKey: nodeApiKey.value.trim(),
        model: (nodeModel.value || DEFAULTS.model).trim()
      };
      if (!cfg.apiKey) return;
      saveUserConfig(cfg);
      mask.remove();
      onSave(cfg);
    });

    btnCancel.addEventListener('click', () => {
      mask.remove();
      onCancel && onCancel();
    });

    mask.addEventListener('click', (e) => {
      if (e.target === mask) {
        mask.remove();
        onCancel && onCancel();
      }
    });
    nodeApiKey.focus();
    return mask;
  }

  // ───────────────────────────────────────────────────────
  // 5. HTML 转义工具
  // ───────────────────────────────────────────────────────
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // ───────────────────────────────────────────────────────
  // 6. 消息渲染
  // ───────────────────────────────────────────────────────
  function renderBubble(container, role, text, opts = {}) {
    const bubble = document.createElement('div');
    bubble.className = 'ai-tutor-bubble ' + role + (opts.error ? ' error' : '') + (opts.loading ? ' loading' : '');
    bubble.textContent = text || '';
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  function appendToBubble(bubble, deltaText) {
    bubble.textContent = (bubble.textContent || '') + deltaText;
    const container = bubble.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }

  // ───────────────────────────────────────────────────────
  // 7. API 调用（OpenAI 兼容，支持流式）
  // ───────────────────────────────────────────────────────
  async function callChatAPI(cfg, messages, onDelta) {
    const endpoint = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!resp.ok) {
      let errText = '请求失败（' + resp.status + '）';
      try {
        const errJson = await resp.json();
        errText += '：' + (errJson?.error?.message || JSON.stringify(errJson).slice(0, 200));
      } catch (e) {}
      throw new Error(errText);
    }

    // 尝试按 SSE 流式读
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('text/event-stream') || ct.includes('stream')) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) onDelta(delta);
          } catch (e) { /* ignore parse errors */ }
        }
      }
    } else {
      // 非流式
      const json = await resp.json();
      const full = json.choices?.[0]?.message?.content || '';
      if (full) onDelta(full);
    }
  }

  // ───────────────────────────────────────────────────────
  // 8. 主控制器
  // ───────────────────────────────────────────────────────
  function boot() {
    const meta = readCourseMeta();
    const fab = createFab();
    let panel = null;
    let messagesEl = null;
    let inputEl = null;
    let sendBtn = null;
    let ctxSectionEl = null;
    let isPending = false;
    let history = [];

    function ensurePanel() {
      if (panel) return panel;
      panel = createPanel(meta);
      messagesEl = panel.querySelector('.ai-tutor-messages');
      inputEl = panel.querySelector('textarea');
      sendBtn = panel.querySelector('.btn-send');
      ctxSectionEl = panel.querySelector('.ctx-section');

      // 初始 AI 欢迎语
      const welcome = getWelcomeMessage(meta);
      renderBubble(messagesEl, 'ai', welcome);

      // 关闭按钮
      panel.querySelector('.btn-close').addEventListener('click', () => togglePanel(false));
      // 清空按钮
      panel.querySelector('.btn-clear').addEventListener('click', () => {
        messagesEl.innerHTML = '';
        history = [];
        renderBubble(messagesEl, 'ai', welcome);
      });
      // 发送
      sendBtn.addEventListener('click', handleSend);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
      inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(100, inputEl.scrollHeight) + 'px';
      });

      // 定时刷新上下文显示
      updateContextDisplay();
      setInterval(updateContextDisplay, 1500);

      return panel;
    }

    function updateContextDisplay() {
      if (!ctxSectionEl) return;
      ctxSectionEl.textContent = getCurrentSectionTitle();
    }

    function togglePanel(open) {
      ensurePanel();
      if (open) {
        panel.classList.add('open');
        setTimeout(() => inputEl && inputEl.focus(), 200);
      } else {
        panel.classList.remove('open');
      }
    }

    async function handleSend() {
      if (isPending) return;
      const text = (inputEl.value || '').trim();
      if (!text) return;

      let cfg = readUserConfig();
      if (!cfg) {
        // 未配置 key，先弹出配置
        createConfigModal(DEFAULTS, (saved) => {
          cfg = saved;
          doSend(text);
        }, () => {
          // 用户取消
        });
        return;
      }
      doSend(text);
    }

    async function doSend(text) {
      const cfg = readUserConfig();
      if (!cfg) return;

      inputEl.value = '';
      inputEl.style.height = '36px';

      renderBubble(messagesEl, 'user', text);

      const contextText = (meta.getContext() || '').slice(0, 3000);
      const sectionTitle = getCurrentSectionTitle();
      const system = buildSystemPrompt(meta);
      const userPayload = `[当前正在学习：${sectionTitle}]\n\n[课件上下文片段]\n${contextText}\n\n[学生提问]\n${text}`;

      const messages = [
        { role: 'system', content: system },
        ...history.slice(-6), // 保留最近 3 轮历史
        { role: 'user', content: userPayload }
      ];

      const aiBubble = renderBubble(messagesEl, 'ai', '', { loading: true });
      isPending = true;
      sendBtn.disabled = true;

      try {
        await callChatAPI(cfg, messages, (delta) => {
          if (aiBubble.classList.contains('loading')) {
            aiBubble.classList.remove('loading');
          }
          appendToBubble(aiBubble, delta);
        });
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: aiBubble.textContent || '' });
      } catch (err) {
        aiBubble.remove();
        renderBubble(messagesEl, 'ai', '😥 ' + (err.message || '请求失败') + '\n\n提示：请检查 API Key、Base URL、网络，或点击 FAB 再次配置。', { error: true });
      } finally {
        isPending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }

    // FAB 点击
    fab.addEventListener('click', () => {
      const cfg = readUserConfig();
      if (!cfg) {
        createConfigModal(DEFAULTS, () => togglePanel(true), () => {});
        return;
      }
      togglePanel(!(panel && panel.classList.contains('open')));
    });
  }

  function getWelcomeMessage(meta) {
    if (meta.grade <= 6) {
      return `你好呀！我是你的学伴 🎓\n正在陪你学《${meta.courseTitle}》。\n有什么不明白的，就问我吧～`;
    } else if (meta.grade <= 9) {
      return `嗨！我是你的 AI 学伴 🎓\n正在陪你学《${meta.courseTitle}》。\n关于课件里的概念、步骤、例题，任意提问。`;
    } else {
      return `你好，我是你的 AI 学伴 🎓\n当前课件：《${meta.courseTitle}》。\n关于原理、推导、易错点、题型归类，欢迎探讨。`;
    }
  }

  // ───────────────────────────────────────────────────────
  // 9. 启动（DOM 就绪后）
  // ───────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 暴露开发者接口（清理 Key / 打开面板）
  window.TeachAnyTutor = {
    clearKey: clearUserConfig,
    version: '5.34'
  };
})();
