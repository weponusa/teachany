/**
 * TeachAny AI 学伴 v1.0
 * 
 * 用法：
 *   <link rel="stylesheet" href="../../assets/ai-companion/ai-companion.css">
 *   <script src="../../assets/ai-companion/ai-companion.js"></script>
 *   <script>
 *     TeachAnyAI.init({
 *       courseTitle: "古诗里的秘密节奏",
 *       grade: "小学一年级",
 *       subject: "语文",
 *       topic: "古诗平仄启蒙",
 *       systemPrompt: "你是一位专门面向小学一年级孩子的语文老师..."
 *     });
 *   </script>
 * 
 * 特性：
 * - 左下悬浮球，单击展开聊天面板
 * - 首次使用引导设置 API Key + Base URL
 * - 配置保存到 localStorage（key: teachany-ai-config）
 * - 兼容 OpenAI / DeepSeek / Moonshot / OpenRouter 等所有 OpenAI 兼容 API
 * - 流式输出（SSE）
 * - 内置课程相关提示词
 * - 适配孩子的语气与字数
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'teachany-ai-config';
  const CHAT_KEY = 'teachany-ai-chat-';

  // 默认配置预设
  const PRESETS = {
    'deepseek': {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat'
    },
    'moonshot': {
      name: 'Moonshot (Kimi)',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k'
    },
    'openrouter': {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/deepseek-chat'
    },
    'openai': {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    },
    'paratera': {
      name: 'Paratera (并行超算)',
      baseUrl: 'https://llmapi.paratera.com/v1',
      model: 'DeepSeek-V3.2'
    },
    'custom': {
      name: '自定义',
      baseUrl: '',
      model: ''
    }
  };

  // 课程上下文（由 init 设置）
  let courseContext = {
    courseTitle: 'TeachAny 课程',
    grade: '中学',
    subject: '通用',
    topic: '',
    systemPrompt: ''
  };

  // 聊天历史
  let chatHistory = [];

  // ==== 初始化 ====
  function init(context) {
    Object.assign(courseContext, context || {});

    // 注入 HTML
    if (!document.getElementById('teachany-ai-companion')) {
      injectHTML();
      bindEvents();
    }

    // 加载历史消息
    loadHistory();

    console.log('[TeachAny AI] 已初始化', courseContext);
  }

  // ==== 注入 HTML ====
  function injectHTML() {
    const html = `
      <!-- 悬浮球 -->
      <div id="teachany-ai-companion" class="ai-companion-fab" title="点击呼出 AI 学伴">
        <span class="ai-icon">🤖</span>
        <span class="ai-label">AI 学伴</span>
      </div>

      <!-- 聊天面板 -->
      <div id="teachany-ai-panel" class="ai-panel" style="display:none;">
        <div class="ai-panel-header">
          <div class="ai-panel-title">
            <span class="ai-avatar">🤖</span>
            <div>
              <div class="ai-name">AI 学伴</div>
              <div class="ai-subtitle" id="ai-subtitle">在线 · 准备就绪</div>
            </div>
          </div>
          <div class="ai-panel-actions">
            <button class="ai-btn-icon" id="ai-btn-settings" title="设置 API">⚙️</button>
            <button class="ai-btn-icon" id="ai-btn-clear" title="清空对话">🗑️</button>
            <button class="ai-btn-icon" id="ai-btn-close" title="关闭">✕</button>
          </div>
        </div>

        <div class="ai-panel-body" id="ai-panel-body">
          <div class="ai-welcome" id="ai-welcome">
            <div class="ai-welcome-emoji">👋</div>
            <div class="ai-welcome-text">
              你好！我是你的 AI 学伴<br>
              有什么不懂的，随时问我吧～
            </div>
            <div class="ai-quick-questions" id="ai-quick-questions"></div>
          </div>
        </div>

        <div class="ai-panel-footer">
          <textarea id="ai-input" placeholder="问我任何问题..." rows="2"></textarea>
          <button id="ai-send-btn" class="ai-send-btn">发送</button>
        </div>
      </div>

      <!-- 设置弹窗 -->
      <div id="ai-config-modal" class="ai-modal" style="display:none;">
        <div class="ai-modal-content">
          <div class="ai-modal-header">
            <h3>⚙️ AI 学伴设置</h3>
            <button class="ai-btn-icon" id="ai-config-close">✕</button>
          </div>
          <div class="ai-modal-body">
            <div class="ai-form-group">
              <label>选择服务商</label>
              <select id="ai-config-preset">
                <option value="deepseek">DeepSeek（推荐，便宜）</option>
                <option value="moonshot">Moonshot Kimi（中文好）</option>
                <option value="openrouter">OpenRouter（多模型聚合）</option>
                <option value="openai">OpenAI</option>
                <option value="paratera">Paratera 并行超算</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div class="ai-form-group">
              <label>API Base URL</label>
              <input type="text" id="ai-config-baseurl" placeholder="https://api.deepseek.com/v1">
              <div class="ai-hint">通常以 /v1 结尾</div>
            </div>

            <div class="ai-form-group">
              <label>API Key</label>
              <input type="password" id="ai-config-apikey" placeholder="sk-xxxxxxxx">
              <div class="ai-hint">仅保存在你的浏览器，不会上传</div>
            </div>

            <div class="ai-form-group">
              <label>模型名称</label>
              <input type="text" id="ai-config-model" placeholder="deepseek-chat">
            </div>

            <div class="ai-form-group">
              <button class="ai-btn-test" id="ai-config-test">🔍 测试连接</button>
              <span id="ai-config-test-result"></span>
            </div>
          </div>
          <div class="ai-modal-footer">
            <button class="ai-btn-secondary" id="ai-config-cancel">取消</button>
            <button class="ai-btn-primary" id="ai-config-save">保存</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    while (container.firstChild) {
      document.body.appendChild(container.firstChild);
    }

    // 渲染快捷问题
    renderQuickQuestions();
  }

  // ==== 渲染快捷问题 ====
  function renderQuickQuestions() {
    const container = document.getElementById('ai-quick-questions');
    if (!container) return;

    const questions = generateQuickQuestions();
    container.innerHTML = questions.map(q =>
      `<button class="ai-quick-btn" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`
    ).join('');

    container.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-q');
        document.getElementById('ai-input').value = q;
        sendMessage();
      });
    });
  }

  // ==== 根据课程主题生成快捷问题 ====
  function generateQuickQuestions() {
    const topic = courseContext.topic || '';
    const grade = courseContext.grade || '';

    // 根据主题定制
    if (topic.includes('平仄') || topic.includes('古诗')) {
      return [
        '什么是平仄？',
        '怎么判断一个字是平声还是仄声？',
        '《池上》和《小池》有什么不同？',
        '为什么要学平仄？',
        '再给我出一道练习题'
      ];
    }
    // 默认
    return [
      `这节课的重点是什么？`,
      `给我讲一个例子`,
      `给我出一道练习题`,
      `这个概念跟什么相关？`
    ];
  }

  // ==== 绑定事件 ====
  function bindEvents() {
    // 悬浮球点击
    document.getElementById('teachany-ai-companion').addEventListener('click', openPanel);

    // 关闭面板
    document.getElementById('ai-btn-close').addEventListener('click', closePanel);

    // 设置按钮
    document.getElementById('ai-btn-settings').addEventListener('click', openConfigModal);

    // 清空对话
    document.getElementById('ai-btn-clear').addEventListener('click', clearChat);

    // 发送消息
    document.getElementById('ai-send-btn').addEventListener('click', sendMessage);

    // 输入框 Enter 发送（Shift+Enter 换行）
    document.getElementById('ai-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 设置弹窗
    document.getElementById('ai-config-close').addEventListener('click', closeConfigModal);
    document.getElementById('ai-config-cancel').addEventListener('click', closeConfigModal);
    document.getElementById('ai-config-save').addEventListener('click', saveConfig);
    document.getElementById('ai-config-test').addEventListener('click', testConnection);

    // 预设切换
    document.getElementById('ai-config-preset').addEventListener('change', (e) => {
      const preset = PRESETS[e.target.value];
      if (preset && preset.baseUrl) {
        document.getElementById('ai-config-baseurl').value = preset.baseUrl;
        document.getElementById('ai-config-model').value = preset.model;
      }
    });
  }

  // ==== 打开/关闭面板 ====
  function openPanel() {
    document.getElementById('teachany-ai-panel').style.display = 'flex';
    document.getElementById('teachany-ai-companion').style.display = 'none';

    // 检查是否已配置
    const config = getConfig();
    if (!config.apiKey) {
      // 首次使用，提示配置
      setTimeout(() => {
        if (confirm('👋 你好！第一次使用需要配置 AI 服务。\n\n点击"确定"打开设置，或先体验内置的简易问答。')) {
          openConfigModal();
        }
      }, 300);
    }
  }

  function closePanel() {
    document.getElementById('teachany-ai-panel').style.display = 'none';
    document.getElementById('teachany-ai-companion').style.display = 'flex';
  }

  // ==== 配置弹窗 ====
  function openConfigModal() {
    const config = getConfig();
    const modal = document.getElementById('ai-config-modal');

    document.getElementById('ai-config-preset').value = config.preset || 'deepseek';
    document.getElementById('ai-config-baseurl').value = config.baseUrl || PRESETS.deepseek.baseUrl;
    document.getElementById('ai-config-apikey').value = config.apiKey || '';
    document.getElementById('ai-config-model').value = config.model || PRESETS.deepseek.model;

    modal.style.display = 'flex';
  }

  function closeConfigModal() {
    document.getElementById('ai-config-modal').style.display = 'none';
    document.getElementById('ai-config-test-result').textContent = '';
  }

  function saveConfig() {
    const config = {
      preset: document.getElementById('ai-config-preset').value,
      baseUrl: document.getElementById('ai-config-baseurl').value.trim().replace(/\/$/, ''),
      apiKey: document.getElementById('ai-config-apikey').value.trim(),
      model: document.getElementById('ai-config-model').value.trim()
    };

    if (!config.baseUrl || !config.apiKey || !config.model) {
      alert('请填写完整：Base URL、API Key、模型名称');
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    closeConfigModal();
    updateSubtitle('已配置 · ' + (PRESETS[config.preset]?.name || '自定义'));
    alert('✅ 配置已保存！现在可以开始聊天了。');
  }

  // ==== 测试连接 ====
  async function testConnection() {
    const result = document.getElementById('ai-config-test-result');
    const baseUrl = document.getElementById('ai-config-baseurl').value.trim().replace(/\/$/, '');
    const apiKey = document.getElementById('ai-config-apikey').value.trim();
    const model = document.getElementById('ai-config-model').value.trim();

    if (!baseUrl || !apiKey || !model) {
      result.textContent = '⚠️ 请先填完整';
      result.style.color = '#f57c00';
      return;
    }

    result.textContent = '🔄 测试中...';
    result.style.color = '#666';

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: '你好，请回复"OK"' }],
          max_tokens: 10
        })
      });

      if (res.ok) {
        result.textContent = '✅ 连接成功';
        result.style.color = '#2e7d32';
      } else {
        const err = await res.text();
        result.textContent = `❌ 失败 (${res.status})`;
        result.style.color = '#c62828';
        console.error('[AI] 测试失败:', err);
      }
    } catch (e) {
      result.textContent = `❌ ${e.message}`;
      result.style.color = '#c62828';
    }
  }

  // ==== 获取配置 ====
  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  // ==== 发送消息 ====
  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;

    const config = getConfig();
    if (!config.apiKey) {
      alert('请先配置 API Key（点击右上角 ⚙️ 按钮）');
      openConfigModal();
      return;
    }

    // 隐藏欢迎页
    const welcome = document.getElementById('ai-welcome');
    if (welcome) welcome.style.display = 'none';

    input.value = '';
    input.disabled = true;
    document.getElementById('ai-send-btn').disabled = true;

    // 添加用户消息
    appendMessage('user', text);

    // 添加 AI 占位
    const aiMsgId = appendMessage('assistant', '');
    const aiMsgEl = document.getElementById(aiMsgId);
    aiMsgEl.querySelector('.ai-msg-content').innerHTML = '<span class="ai-typing">●●●</span>';

    try {
      // 构建消息
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...chatHistory,
        { role: 'user', content: text }
      ];

      // 流式请求
      const reply = await streamChat(config, messages, (chunk) => {
        if (aiMsgEl.querySelector('.ai-typing')) {
          aiMsgEl.querySelector('.ai-msg-content').innerHTML = '';
        }
        aiMsgEl.querySelector('.ai-msg-content').textContent += chunk;
        scrollToBottom();
      });

      // 保存到历史
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: reply });
      saveHistory();

    } catch (e) {
      aiMsgEl.querySelector('.ai-msg-content').innerHTML =
        `<span style="color:#c62828">❌ 出错了：${escapeHtml(e.message)}</span>`;
      console.error('[AI] 出错:', e);
    } finally {
      input.disabled = false;
      document.getElementById('ai-send-btn').disabled = false;
      input.focus();
    }
  }

  // ==== 流式聊天 ====
  async function streamChat(config, messages, onChunk) {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!res.ok) {
      throw new Error(`API 错误 ${res.status}: ${await res.text().catch(() => '')}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return fullText;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    return fullText;
  }

  // ==== 构建系统提示词 ====
  function buildSystemPrompt() {
    if (courseContext.systemPrompt) {
      return courseContext.systemPrompt;
    }

    // 默认提示词模板
    return `你是 TeachAny 智能学伴，专门面向${courseContext.grade}学生。

【当前课程】${courseContext.courseTitle}
【学科】${courseContext.subject}
【主题】${courseContext.topic}

【你的任务】
1. 用学生能听懂的语言回答问题
2. 多用例子、类比，少用术语
3. 回答简洁，每次不超过150字
4. 鼓励学生思考，不要直接给答案
5. 紧密围绕本课程内容

【语气】友好、耐心、有趣，像一位会讲故事的老师。`;
  }

  // ==== 添加消息到面板 ====
  function appendMessage(role, content) {
    const id = `ai-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const body = document.getElementById('ai-panel-body');

    const html = `
      <div class="ai-msg ai-msg-${role}" id="${id}">
        <div class="ai-msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="ai-msg-content">${escapeHtml(content)}</div>
      </div>
    `;
    body.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
    return id;
  }

  // ==== 工具函数 ====
  function scrollToBottom() {
    const body = document.getElementById('ai-panel-body');
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function updateSubtitle(text) {
    const el = document.getElementById('ai-subtitle');
    if (el) el.textContent = text;
  }

  // ==== 历史记录 ====
  function getCourseKey() {
    return CHAT_KEY + (courseContext.courseTitle || 'default');
  }

  function saveHistory() {
    try {
      // 只保存最近 20 条，节省空间
      const recent = chatHistory.slice(-20);
      localStorage.setItem(getCourseKey(), JSON.stringify(recent));
    } catch (e) {
      console.warn('[AI] 保存历史失败:', e);
    }
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(getCourseKey());
      if (saved) {
        chatHistory = JSON.parse(saved);
        // 显示历史消息
        if (chatHistory.length > 0) {
          const welcome = document.getElementById('ai-welcome');
          if (welcome) welcome.style.display = 'none';
          chatHistory.forEach(msg => appendMessage(msg.role, msg.content));
        }
      }
    } catch (e) {
      console.warn('[AI] 加载历史失败:', e);
    }
  }

  function clearChat() {
    if (!confirm('确定要清空对话历史吗？')) return;
    chatHistory = [];
    localStorage.removeItem(getCourseKey());

    const body = document.getElementById('ai-panel-body');
    body.innerHTML = `
      <div class="ai-welcome" id="ai-welcome">
        <div class="ai-welcome-emoji">👋</div>
        <div class="ai-welcome-text">
          对话已清空<br>
          有什么不懂的，再问我吧～
        </div>
        <div class="ai-quick-questions" id="ai-quick-questions"></div>
      </div>
    `;
    renderQuickQuestions();
  }

  // 自动初始化（如果配置存在）
  document.addEventListener('DOMContentLoaded', () => {
    const config = getConfig();
    if (config.apiKey) {
      updateSubtitle('已配置 · ' + (PRESETS[config.preset]?.name || '自定义'));
    }
  });

  // 暴露 API
  window.TeachAnyAI = {
    init: init,
    open: openPanel,
    close: closePanel,
    config: openConfigModal,
    version: '1.0.0'
  };

})(window);
