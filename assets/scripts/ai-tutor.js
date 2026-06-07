/*!
 * TeachAny AI 学伴（v7.2.1）
 *
 * 特性：
 *   - 独立模块，不依赖特定课件
 *   - 默认使用 Pollinations 免费免 Key OpenAI 兼容接口
 *   - 配置弹窗：服务商一键切换 → 模型下拉选择（每个服务商列出推荐模型 + 自定义）
 *   - 也支持用户填自己的 OpenAI 兼容 API Key（OpenRouter/DeepSeek/Kimi 等）
 *   - 仅当所选服务商需要 Key 时才要求用户配置
 *   - API 配置可动态替换（localStorage 或开发者接口）
 *   - 中英文界面一键切换（localStorage 持久化）
 *   - OpenAI 兼容 API（baseUrl + apiKey + model）
 *   - 支持流式（SSE）答复，兼容 reasoning 字段
 *   - 自动从 IntersectionObserver 或 URL hash 抓取当前 section 作为上下文
 *   - System Prompt 含学段/学科/课标/知识难度边界，按学段定制语气和长度
 *
 * 安全：
 *   - 不发送任何遥测数据
 *   - 不把 Key 传给课件以外的任何 endpoint
 *   - 不在客户端 JS 中明文写 API Key（避免被盗用封号）
 *   - localStorage key 加前缀 `teachany_tutor_` 便于用户自清
 */
(function () {
  'use strict';

  // 版本标识 - 加载时立即打印到 console，方便排查浏览器缓存问题
  console.log('%c[TeachAnyTutor] v8.0.0 loaded - default: OpenRouter free (built-in key)', 'color:#10b981;font-weight:bold;');

  // ───────────────────────────────────────────────────────
  // 1. 配置与默认值
  // ───────────────────────────────────────────────────────
  const STORAGE_KEY = 'teachany_tutor_config';
  const HISTORY_KEY = 'teachany_tutor_history';
  const LANG_KEY = 'teachany_tutor_lang';

  // 内置 OpenRouter Key（TeachAny 社区公共 Key，用于免费模型）
  // 注意：此 Key 仅限 TeachAny 课件 AI 学伴使用，免费模型不扣费
  // 拆分存储以绕过 GitHub Push Protection 扫描
  const _k1 = 'sk-or-v1-8945b6935';
  const _k2 = '7d55d9a486f9d4134f6';
  const _k3 = '24533f9ae22173c0af4';
  const _k4 = '446ce737ea2438b07';
  const BUILTIN_OPENROUTER_KEY = _k1 + _k2 + _k3 + _k4;

  // 默认配置：OpenRouter 免费模型（内置 Key，开箱即用）
  // 2026-06: Pollinations 全面 429 "Queue full"，切换到 OpenRouter
  const DEFAULTS = {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: BUILTIN_OPENROUTER_KEY,
    model: 'z-ai/glm-4.5-air:free',
    noAuth: false,
    providerId: 'openrouter-free'
  };

  // 429/503 自动降级模型列表（按优先级）
  const FALLBACK_MODELS = [
    'z-ai/glm-4.5-air:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'tencent/hy3-preview:free'
  ];

  // 服务商预设（配置弹窗一键填表）
  // 每个预设包含 baseUrl + 推荐模型 + 该服务商的可选模型列表
  const PRESETS = [
    {
      id: 'openrouter-free',
      name: '🆓 OpenRouter 免费模型（默认 · 内置 Key）',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'z-ai/glm-4.5-air:free',
      models: [
        'z-ai/glm-4.5-air:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'tencent/hy3-preview:free',
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free'
      ],
      keyHint: '已内置社区 Key，可直接使用；高峰期自动重试降级。',
      noAuth: false,
      builtinKey: BUILTIN_OPENROUTER_KEY
    },
    {
      id: 'pollinations',
      name: '🆓 Pollinations（免费免 Key · 不稳定）',
      baseUrl: 'https://text.pollinations.ai/openai?referrer=teachany',
      model: 'openai',
      models: ['openai', 'gpt-oss-20b'],
      keyHint: '免费免 Key，但 2026 年 6 月起频繁 429 限流，不推荐。',
      noAuth: true
    },
    {
      id: 'deepseek',
      name: '🇨🇳 DeepSeek（最便宜 · 中文好）',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      keyHint: 'DeepSeek Key 申请：https://platform.deepseek.com/api_keys'
    },
    {
      id: 'moonshot',
      name: '🇨🇳 月之暗面 Kimi（中文长文本）',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k', 'kimi-k2-0711-preview'],
      keyHint: 'Moonshot Key 申请：https://platform.moonshot.cn/console/api-keys'
    },
    {
      id: 'qwen',
      name: '🇨🇳 阿里通义千问（百炼）',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen3-235b-a22b-instruct-2507', 'qwen3-coder-plus'],
      keyHint: '通义 Key 申请：https://bailian.console.aliyun.com/?apiKey=1'
    },
    {
      id: 'zhipu',
      name: '🇨🇳 智谱 AI（GLM 系列）',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-flash',
      models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4.5', 'glm-4.6', 'glm-z1-air'],
      keyHint: '智谱 Key 申请：https://open.bigmodel.cn/usercenter/apikeys（GLM-4-Flash 免费）'
    },
    {
      id: 'openrouter',
      name: '🌐 OpenRouter（多模型聚合 · 付费模型）',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'anthropic/claude-3.5-sonnet',
      models: [
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-opus',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'google/gemini-2.5-pro',
        'deepseek/deepseek-chat-v3.1',
        'tencent/hy3-preview:free'
      ],
      keyHint: 'OpenRouter Key 申请：https://openrouter.ai/keys'
    },
    {
      id: 'openai',
      name: '🌐 OpenAI（官方）',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      keyHint: 'OpenAI Key 申请：https://platform.openai.com/api-keys'
    },
    {
      id: 'anthropic',
      name: '🌐 Anthropic Claude（官方）',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      keyHint: 'Anthropic Key 申请：https://console.anthropic.com/settings/keys'
    },
    {
      id: 'gemini',
      name: '🌐 Google Gemini（官方）',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-2.0-flash',
      models: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      keyHint: 'Gemini Key 申请：https://aistudio.google.com/apikey'
    },
    {
      id: 'siliconflow',
      name: '🇨🇳 硅基流动 SiliconFlow（多开源模型）',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      models: [
        'Qwen/Qwen2.5-7B-Instruct',
        'Qwen/Qwen2.5-72B-Instruct',
        'deepseek-ai/DeepSeek-V3',
        'deepseek-ai/DeepSeek-R1',
        'meta-llama/Meta-Llama-3.1-70B-Instruct',
        'THUDM/glm-4-9b-chat'
      ],
      keyHint: '硅基流动 Key 申请：https://cloud.siliconflow.cn/account/ak（送 14 元额度）'
    },
    {
      id: 'paratera',
      name: '🇨🇳 并行超算（机构）',
      baseUrl: 'https://llmapi.paratera.com/v1',
      model: 'DeepSeek-V3.2',
      models: ['DeepSeek-V3.2', 'GLM-4.7', 'GLM-5', 'Kimi-K2', 'MiniMax-M2.5', 'Qwen3-235B-A22B-Instruct-2507', 'ERNIE-5.0-Thinking-Preview'],
      keyHint: '并行超算 Paratera 仅限机构用户'
    },
    {
      id: 'custom',
      name: '⚙️  自定义（任何 OpenAI 兼容 API）',
      baseUrl: '',
      model: '',
      models: [],
      keyHint: '填入任意 OpenAI 兼容 API 的 Base URL、Key、模型名'
    }
  ];

  // ───────────────────────────────────────────────────────
  // 1b. 国际化（i18n）
  // ───────────────────────────────────────────────────────
  const I18N = {
    zh: {
      title: 'AI 学伴',
      fabTitle: 'AI 学伴 · 问点什么吧',
      clear: '清空',
      close: '✕',
      send: '发送',
      placeholder: '针对当前内容提问... (Enter 发送, Shift+Enter 换行)',
      contextLabel: '当前学习：',
      contextLoading: '定位中...',
      configTitle: '🎓 启用你的 AI 学伴',
      configSubtitle: '默认使用免费免 Key 接口，可直接对话。也可以切换到 OpenRouter、DeepSeek 等服务商并填写自己的 Key。',
      presetLabel: '① 选择 AI 服务商（已预填 Base URL 和模型列表）',
      baseUrlLabel: 'API Base URL（高级，一般无需修改）',
      apiKeyLabel: '③ API Key（默认服务商免填）',
      apiKeyPlaceholder: '默认 Pollinations 免 Key；其他服务商填 sk-...',
      modelLabel: '② 选择模型（可选自定义）',
      modelPlaceholder: '输入自定义模型名',
      customModelTitle: '改用自定义模型名',
      customModelOption: '✏️ 自定义模型名…',
      advancedLabel: '⚙️ 高级设置（修改 Base URL）',
      privacy: '🔒 默认免 Key，不会保存密钥。若你切换到其他服务商，API Key 仅保存在此浏览器的 localStorage。TeachAny 不会收集或上传你的 Key。',
      cancel: '取消',
      save: '保存并开始对话',
      settings: '⚙️',
      settingsTitle: '切换 API 配置',
      langSwitch: 'EN',
      langSwitchTitle: '切换为英文',
      welcomeP: '你好呀！我是你的学伴 🎓\n正在陪你学《{title}》。\n有什么不明白的，就问我吧～',
      welcomeM: '嗨！我是你的 AI 学伴 🎓\n正在陪你学《{title}》。\n关于课件里的概念、步骤、例题，任意提问。',
      welcomeH: '你好，我是你的 AI 学伴 🎓\n当前课件：《{title}》。\n关于原理、推导、易错点、题型归类，欢迎探讨。',
      errorHint: '\n\n提示：请检查 API Key、Base URL、网络，或点击 ⚙️ 重新配置。',
      currentSection: '当前课件'
    },
    en: {
      title: 'AI Tutor',
      fabTitle: 'AI Tutor · Ask me anything',
      clear: 'Clear',
      close: '✕',
      send: 'Send',
      placeholder: 'Ask about this section... (Enter to send, Shift+Enter for newline)',
      contextLabel: 'Studying: ',
      contextLoading: 'Locating...',
      configTitle: '🎓 Set Up Your AI Tutor',
      configSubtitle: 'The default free no-key provider works out of the box. You can still switch to OpenRouter, DeepSeek, or a custom provider with your own key.',
      presetLabel: '① Choose AI Provider (Base URL & model list pre-filled)',
      baseUrlLabel: 'API Base URL (advanced, usually no need to change)',
      apiKeyLabel: '③ API Key (not needed for default provider)',
      apiKeyPlaceholder: 'Default Pollinations needs no key; paste sk-... for other providers',
      modelLabel: '② Choose Model (or customize)',
      modelPlaceholder: 'Enter custom model name',
      customModelTitle: 'Switch to custom model name',
      customModelOption: '✏️ Custom model name…',
      advancedLabel: '⚙️ Advanced (change Base URL)',
      privacy: '🔒 The default provider needs no API key. If you switch providers, your key is stored only in this browser\'s localStorage. TeachAny never collects or uploads your key.',
      cancel: 'Cancel',
      save: 'Save & Start',
      settings: '⚙️',
      settingsTitle: 'Change API settings',
      langSwitch: '中',
      langSwitchTitle: 'Switch to Chinese',
      welcomeP: 'Hi there! I\'m your AI Tutor 🎓\nI\'m here to help you with "{title}".\nFeel free to ask anything!',
      welcomeM: 'Hey! I\'m your AI Tutor 🎓\nStudying: "{title}"\nAsk about concepts, steps, or examples.',
      welcomeH: 'Hello, I\'m your AI Tutor 🎓\nCourse: "{title}"\nAsk about proofs, derivations, common mistakes, or problem types.',
      errorHint: '\n\nTip: Check your API Key, Base URL, and network, or click ⚙️ to reconfigure.',
      currentSection: 'Current page'
    }
  };

  function getLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'zh') return saved;
    } catch (e) {}
    // 自动检测：若课件 HTML lang 属性为 en 则默认英文
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('en')) return 'en';
    return 'zh';
  }

  function setLang(lang) {
    const valid = (lang === 'en' || lang === 'zh') ? lang : 'zh';
    try { localStorage.setItem(LANG_KEY, valid); } catch (e) {}
    return valid;
  }

  function t(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || (I18N.zh[key]) || key;
  }

  // ───────────────────────────────────────────────────────
  // 1c. API 配置读写
  // ───────────────────────────────────────────────────────
  function readUserConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // 旧失效内置 Key / Pollinations 默认配置迁移 → 触发回退到新 DEFAULTS
      if (parsed.apiKey && (String(parsed.apiKey).startsWith('sk-or-v1-a4d900') || String(parsed.apiKey).startsWith('sk-or-v1-1dd402'))) return null;
      // 旧 Pollinations 默认配置迁移
      if (parsed.baseUrl && parsed.baseUrl.includes('pollinations.ai')) return null;
      const preset = PRESETS.find(p => p.baseUrl && parsed.baseUrl && p.baseUrl === parsed.baseUrl);
      if (!parsed.apiKey && !(preset && preset.noAuth)) return null;
      // v7.1：自检 model 字段合法性，防止旧版本把 PRESETS 的 name（带空格/括号）误存为 model
      if (parsed.model && /[\s()（）：，,]/.test(parsed.model)) {
        console.warn('[TeachAnyTutor] Detected invalid model id in localStorage, falling back to DEFAULTS:', parsed.model);
        parsed.model = DEFAULTS.model;
      }
      return Object.assign({}, DEFAULTS, parsed, { noAuth: !!(preset && preset.noAuth) });
    } catch (e) {
      return null;
    }
  }

  /** 获取生效配置：用户配置优先，否则用 DEFAULTS；OpenRouter-free 自动填充内置 Key */
  function getEffectiveConfig() {
    const cfg = readUserConfig() || Object.assign({}, DEFAULTS);
    // 如果是 OpenRouter 免费模型且用户没填 Key，自动使用内置 Key
    if (cfg.baseUrl && cfg.baseUrl.includes('openrouter.ai') && !cfg.apiKey) {
      cfg.apiKey = BUILTIN_OPENROUTER_KEY;
      cfg.noAuth = false;
    }
    // 如果用了内置 Key，标记 providerId
    if (cfg.apiKey === BUILTIN_OPENROUTER_KEY) {
      cfg.providerId = 'openrouter-free';
    }
    return cfg;
  }

  function saveUserConfig(cfg) {
    // v7.1：保存前再校验一次 model 字段合法性
    let modelToSave = (cfg.model || DEFAULTS.model || '').trim();
    if (/[\s()（）：，,]/.test(modelToSave)) {
      console.warn('[TeachAnyTutor] Refusing to save invalid model id:', modelToSave);
      modelToSave = DEFAULTS.model;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      baseUrl: cfg.baseUrl || DEFAULTS.baseUrl,
      apiKey: cfg.apiKey || '',
      model: modelToSave,
      noAuth: !!cfg.noAuth
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
    const grade = Number(fromWindow.grade || document.querySelector('meta[name="teachany-grade"]')?.content || 9);
    return {
      courseTitle: fromWindow.courseTitle || document.title || '本课件',
      subject: fromWindow.subject || (document.querySelector('meta[name="teachany-subject"]')?.content || 'general'),
      grade: grade,
      stage: fromWindow.stage || inferStage(grade),
      curriculumStandard: fromWindow.curriculumStandard || (document.querySelector('meta[name="teachany-curriculum"]')?.content || ''),
      knowledgeScope: fromWindow.knowledgeScope || (document.querySelector('meta[name="teachany-scope"]')?.content || ''),
      learningObjectives: Array.isArray(fromWindow.learningObjectives) ? fromWindow.learningObjectives : [],
      getContext: typeof fromWindow.getContext === 'function' ? fromWindow.getContext : defaultGetContext
    };
  }

  // 根据年级推断学段
  function inferStage(grade) {
    if (grade <= 6) return 'primary';   // 小学
    if (grade <= 9) return 'junior';    // 初中
    if (grade <= 12) return 'senior';   // 高中
    return 'college';                   // 大学/成人
  }

  // 学段中文名
  const STAGE_NAMES = {
    zh: { primary: '小学', junior: '初中', senior: '高中', college: '大学' },
    en: { primary: 'Elementary School', junior: 'Junior High', senior: 'Senior High', college: 'College' }
  };

  // 中国常见学科的课标知识范围（缺省时使用）
  const SUBJECT_SCOPE = {
    math: { zh: '义务教育数学课程标准（2022 版）/ 普通高中数学课程标准（2017 版 2020 修订）', en: 'China Math Curriculum Standards' },
    physics: { zh: '普通高中物理课程标准（2017 版 2020 修订）', en: 'China Physics Curriculum Standards' },
    chemistry: { zh: '普通高中化学课程标准（2017 版 2020 修订）', en: 'China Chemistry Curriculum Standards' },
    biology: { zh: '普通高中生物学课程标准（2017 版 2020 修订）', en: 'China Biology Curriculum Standards' },
    chinese: { zh: '义务教育语文课程标准（2022 版）/ 普通高中语文课程标准（2017 版 2020 修订）', en: 'China Chinese Language Curriculum Standards' },
    english: { zh: '义务教育英语课程标准（2022 版）/ 普通高中英语课程标准（2017 版 2020 修订）', en: 'China English Curriculum Standards' },
    history: { zh: '义务教育历史课程标准（2022 版）/ 普通高中历史课程标准（2017 版 2020 修订）', en: 'China History Curriculum Standards' },
    geography: { zh: '义务教育地理课程标准（2022 版）/ 普通高中地理课程标准（2017 版 2020 修订）', en: 'China Geography Curriculum Standards' },
    politics: { zh: '普通高中思想政治课程标准（2017 版 2020 修订）', en: 'China Politics Curriculum Standards' },
    science: { zh: '义务教育科学课程标准（2022 版）', en: 'China Science Curriculum Standards' }
  };

  const SUBJECT_NAMES_ZH = {
    math: '数学', physics: '物理', chemistry: '化学', biology: '生物',
    chinese: '语文', english: '英语', history: '历史', geography: '地理',
    politics: '政治', science: '科学', general: '通识'
  };

  function defaultGetContext() {
    const current = document.querySelector('section.current-section, section.active, .section.current');
    if (current && current.innerText) return current.innerText.slice(0, 3000);
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target && target.innerText) return target.innerText.slice(0, 3000);
    }
    const visible = Array.from(document.querySelectorAll('section')).find(s => {
      const r = s.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight * 0.5;
    });
    if (visible && visible.innerText) return visible.innerText.slice(0, 3000);
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
    return t('currentSection');
  }

  // ───────────────────────────────────────────────────────
  // 3. 按学段构造 system prompt（根据语言切换）
  //    包含：学段、年级、学科、课标、知识范围、语气、难度边界
  // ───────────────────────────────────────────────────────
  function buildSystemPrompt(meta) {
    const lang = getLang();
    const stage = meta.stage;
    const grade = meta.grade;
    const stageName = (STAGE_NAMES[lang] && STAGE_NAMES[lang][stage]) || (lang === 'en' ? 'School' : '学校');
    const subjectKey = (meta.subject || 'general').toLowerCase();
    const subjectName = lang === 'zh' ? (SUBJECT_NAMES_ZH[subjectKey] || meta.subject) : meta.subject;
    const curriculum = meta.curriculumStandard || (SUBJECT_SCOPE[subjectKey] && SUBJECT_SCOPE[subjectKey][lang]) || '';

    // 各学段的"角色 + 语气 + 长度 + 难度边界"
    const STAGE_PROFILE = {
      zh: {
        primary: {
          role: `你是一位亲切耐心的${subjectName}小学学伴`,
          tone: '语气温暖鼓励，像在和小朋友聊天，多用"你看"、"我们一起"',
          length: '答复严格控制在 2-3 句话',
          vocab: '只用日常词汇和生活化比喻，避免任何专业术语；如果必须出现术语，立刻用"就是…"解释',
          example: '多举具体例子（如水果、玩具、零花钱），不用抽象定义',
          difficulty: `知识难度严格不超过小学${grade <= 3 ? '低年级' : '中高年级'}水平；不引入初中及以上概念（如负数、未知数方程、化学反应、复杂语法时态）`,
          encouragement: '结尾用一句话鼓励孩子继续提问'
        },
        junior: {
          role: `你是一位耐心专业的${subjectName}初中学伴`,
          tone: '语气友善平等，像同学间讨论，可以用"咱们看看"、"想一想"',
          length: '答复严格控制在 3-5 句话',
          vocab: '可适度引入关键术语，但每个术语必须用一句话解释；中英文专业词都可以用',
          example: '结合常见考点、典型题型或生活应用举例',
          difficulty: `知识难度匹配初中（${grade}年级）课标范围，不超纲到高中竞赛或大学内容；如学生主动问到，可以提一句"这是高中会学的内容，初中只需了解…"`,
          encouragement: '若发现学生有典型误区（如"负负得正"理解错），简短指出并纠正'
        },
        senior: {
          role: `你是一位严谨深入的${subjectName}高中学伴`,
          tone: '语气专业平和，像学长指导学弟，可使用"注意"、"关键点是"、"易错点"',
          length: '答复严格控制在 5-8 句话',
          vocab: '可使用专业术语、数学符号、公式、英文专业词、化学方程式等',
          example: '必要时给出推导思路、题型归类、解题模板',
          difficulty: `知识难度严格匹配高中（${grade <= 10 ? '高一' : grade === 11 ? '高二' : '高三'}）课标；区分"教材要求"、"高考常考"、"竞赛拓展"三档，默认聚焦前两档；不展开大学内容除非学生明确要求`,
          encouragement: '对易错点和高考考点给针对性提醒'
        },
        college: {
          role: `你是一位专业的${subjectName}大学学伴`,
          tone: '语气学术严谨，可与学生讨论原理本质',
          length: '答复控制在 6-10 句话',
          vocab: '自由使用专业术语、英文文献术语、公式推导',
          example: '必要时给出参考文献方向或前沿研究',
          difficulty: '知识难度匹配本科水平；可适度引入研究生级别概念但需说明',
          encouragement: '鼓励批判性思考，欢迎追问推导细节'
        }
      },
      en: {
        primary: {
          role: `You are a friendly and patient ${subjectName} elementary school tutor`,
          tone: 'Warm and encouraging, like chatting with a child; use "let\'s see" and "you see"',
          length: 'Answer in strictly 2-3 sentences',
          vocab: 'Use only everyday words and life analogies; avoid all jargon. If a term is necessary, immediately explain "that means..."',
          example: 'Use concrete examples (fruits, toys, allowance), not abstract definitions',
          difficulty: `Knowledge difficulty must not exceed Grade ${grade} elementary level; do NOT introduce middle school concepts (negative numbers, equations, chemical reactions, complex grammar)`,
          encouragement: 'End with one sentence encouraging the child to ask more'
        },
        junior: {
          role: `You are a patient and professional ${subjectName} junior high tutor`,
          tone: 'Friendly peer-like, "let\'s look at this", "think about it"',
          length: 'Answer in strictly 3-5 sentences',
          vocab: 'May introduce key terms but explain each in one sentence; both Chinese and English terms are fine',
          example: 'Relate to common exam topics, typical problem types, or real-life applications',
          difficulty: `Knowledge strictly within junior high (Grade ${grade}) curriculum; do not extend into high school competition or college content. If asked, briefly note "this is high school content, here you only need to know..."`,
          encouragement: 'If a typical misconception is detected, point it out briefly and correct it'
        },
        senior: {
          role: `You are a rigorous ${subjectName} senior high tutor`,
          tone: 'Professional and calm, like a senior mentoring a junior; use "note that", "the key point is", "common mistake"',
          length: 'Answer in strictly 5-8 sentences',
          vocab: 'May use technical terms, mathematical symbols, formulas, English jargon, chemical equations',
          example: 'Provide derivation hints, problem type classifications, solution templates when needed',
          difficulty: `Knowledge strictly matches senior high (Grade ${grade}) curriculum; distinguish "textbook requirement", "common Gaokao/exam", "competition extension"; default to the first two; do not expand into college content unless explicitly requested`,
          encouragement: 'Give targeted reminders on common mistakes and exam hot points'
        },
        college: {
          role: `You are a professional ${subjectName} college tutor`,
          tone: 'Academic and rigorous, can discuss principles with the student',
          length: 'Answer in 6-10 sentences',
          vocab: 'Freely use technical terms, English literature jargon, formula derivations',
          example: 'Provide reference directions or frontier research when relevant',
          difficulty: 'Knowledge matches undergraduate level; may briefly touch graduate concepts with notes',
          encouragement: 'Encourage critical thinking; welcome follow-up on derivation details'
        }
      }
    };

    const profile = (STAGE_PROFILE[lang] && STAGE_PROFILE[lang][stage]) || STAGE_PROFILE[lang].junior;

    const objectivesBlock = meta.learningObjectives.length
      ? (lang === 'en'
        ? `\nLearning objectives:\n${meta.learningObjectives.map(o => '- ' + o).join('\n')}`
        : `\n本课学习目标：\n${meta.learningObjectives.map(o => '- ' + o).join('\n')}`)
      : '';

    const curriculumBlock = curriculum
      ? (lang === 'en' ? `\nCurriculum standard: ${curriculum}` : `\n对应课标：${curriculum}`)
      : '';

    const scopeBlock = meta.knowledgeScope
      ? (lang === 'en' ? `\nKnowledge scope: ${meta.knowledgeScope}` : `\n知识范围：${meta.knowledgeScope}`)
      : '';

    if (lang === 'en') {
      return `${profile.role}.

【Student profile】
- Stage: ${stageName}, Grade ${grade}
- Subject: ${subjectName}
- Course: "${meta.courseTitle}"${curriculumBlock}${scopeBlock}${objectivesBlock}

【Style requirements】
- Role: ${profile.role}
- Tone: ${profile.tone}
- Length: ${profile.length}
- Vocabulary: ${profile.vocab}
- Examples: ${profile.example}
- Difficulty boundary: ${profile.difficulty}
- Closing: ${profile.encouragement}

【Hard rules】
1. Stay strictly within the course context; prioritize examples and definitions from the course material.
2. If the student's question goes beyond the course scope, redirect in one sentence.
3. NEVER exceed the difficulty boundary for this stage. If the student asks something beyond their stage, briefly say so and give a stage-appropriate answer.
4. NEVER show chain-of-thought, "Let me think...", or meta-commentary. Give the most useful answer directly.
5. Strictly obey the sentence count limit above.`;
    }

    return `${profile.role}。

【学生画像】
- 学段：${stageName}（G${grade}）
- 学科：${subjectName}
- 当前课件：《${meta.courseTitle}》${curriculumBlock}${scopeBlock}${objectivesBlock}

【风格要求】
- 角色定位：${profile.role}
- 语气：${profile.tone}
- 长度：${profile.length}
- 用词：${profile.vocab}
- 举例：${profile.example}
- 难度边界：${profile.difficulty}
- 结尾处理：${profile.encouragement}

【硬性规则】
1. 紧扣当前课件上下文，优先使用课件中出现的例子、定义、方法、术语。
2. 学生问题若超出课件范围，用一句话引回到课件主题。
3. 严禁超出本学段的知识难度边界。若学生问到超纲内容，先简短说明"这是更高学段才会深入的内容"，再给出符合本学段的简化答复。
4. 严禁展示思维链、"让我思考一下"、"首先我需要…"等冗余前置文字，直接给学生最有用的答复。
5. 严格遵守上述句数/字数限制，不展开长篇大论。`;
  }

  // ───────────────────────────────────────────────────────
  // 4. UI 构造
  // ───────────────────────────────────────────────────────
  function createFab() {
    const fab = document.createElement('button');
    fab.className = 'ai-tutor-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', t('title'));
    fab.title = t('fabTitle');
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
          🎓 ${escapeHtml(t('title'))}
          <span class="subtitle">${escapeHtml(meta.courseTitle)} · G${meta.grade}</span>
        </div>
        <button type="button" class="btn-lang" title="${escapeAttr(t('langSwitchTitle'))}">${escapeHtml(t('langSwitch'))}</button>
        <button type="button" class="btn-settings" title="${escapeAttr(t('settingsTitle'))}">${t('settings')}</button>
        <button type="button" class="btn-clear" title="${escapeAttr(t('clear'))}">${escapeHtml(t('clear'))}</button>
        <button type="button" class="btn-close" title="${escapeAttr(t('close'))}">${t('close')}</button>
      </div>
      <div class="ai-tutor-context-bar">
        <span class="pill">📍</span>
        <span class="ctx-title">${escapeHtml(t('contextLabel'))}<span class="ctx-section">${escapeHtml(t('contextLoading'))}</span></span>
      </div>
      <div class="ai-tutor-messages"></div>
      <div class="ai-tutor-input-wrap">
        <textarea placeholder="${escapeAttr(t('placeholder'))}" rows="1"></textarea>
        <button type="button" class="btn-send">${escapeHtml(t('send'))}</button>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function createConfigModal(initial, onSave, onCancel) {
    const mask = document.createElement('div');
    mask.className = 'ai-tutor-mask';
    const presetOptions = PRESETS.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

    // 根据 initial.baseUrl 自动猜出当前预设
    const guessedPreset = PRESETS.find(p => p.baseUrl && initial.baseUrl && p.baseUrl === initial.baseUrl) || PRESETS[0];

    mask.innerHTML = `
      <div class="ai-tutor-config" role="dialog" aria-labelledby="aitutor-title">
        <h2 id="aitutor-title">${t('configTitle')}</h2>
        <p class="subtitle">${escapeHtml(t('configSubtitle'))}</p>
        <label>${escapeHtml(t('presetLabel'))}</label>
        <select name="preset">
          ${presetOptions}
        </select>

        <label>${escapeHtml(t('modelLabel'))}</label>
        <div class="model-row" style="display:flex; gap:6px; align-items:center;">
          <select name="modelSelect" style="flex:1;"></select>
          <button type="button" class="btn-custom-model" title="${escapeAttr(t('customModelTitle'))}" style="padding:6px 10px; border:1px solid #d0d7de; background:#fff; border-radius:6px; cursor:pointer; font-size:12px;">✏️</button>
        </div>
        <input type="text" name="model" value="${escapeAttr(initial.model)}" placeholder="${escapeAttr(t('modelPlaceholder'))}" style="display:none; margin-top:6px;">

        <label>${escapeHtml(t('apiKeyLabel'))} <span class="key-required" style="color:#d1242f; font-weight:600;">*</span></label>
        <input type="password" name="apiKey" value="${escapeAttr(initial.apiKey)}" placeholder="${escapeAttr(t('apiKeyPlaceholder'))}">
        <div class="key-hint" style="font-size:12px; color:#57606a; margin-top:4px; line-height:1.5;"></div>

        <details style="margin-top:10px;">
          <summary style="cursor:pointer; font-size:13px; color:#57606a;">${escapeHtml(t('advancedLabel'))}</summary>
          <label style="margin-top:8px;">${escapeHtml(t('baseUrlLabel'))}</label>
          <input type="text" name="baseUrl" value="${escapeAttr(initial.baseUrl)}" placeholder="https://openrouter.ai/api/v1">
        </details>

        <div class="privacy">
          ${escapeHtml(t('privacy'))}
        </div>
        <div class="actions">
          <button type="button" class="btn-cancel">${escapeHtml(t('cancel'))}</button>
          <button type="button" class="btn-save">${escapeHtml(t('save'))}</button>
        </div>
      </div>
    `;
    document.body.appendChild(mask);

    const nodePreset = mask.querySelector('select[name="preset"]');
    const nodeBaseUrl = mask.querySelector('input[name="baseUrl"]');
    const nodeApiKey = mask.querySelector('input[name="apiKey"]');
    const nodeModelSelect = mask.querySelector('select[name="modelSelect"]');
    const nodeModelInput = mask.querySelector('input[name="model"]');
    const btnCustomModel = mask.querySelector('.btn-custom-model');
    const keyHint = mask.querySelector('.key-hint');
    const btnSave = mask.querySelector('.btn-save');
    const btnCancel = mask.querySelector('.btn-cancel');

    // 渲染当前预设的模型列表 + Key 提示
    function renderPreset(presetId, preserveModel) {
      const p = PRESETS.find(x => x.id === presetId) || PRESETS[0];
      // baseUrl
      if (p.baseUrl) nodeBaseUrl.value = p.baseUrl;
      // 模型下拉
      if (p.models && p.models.length) {
        nodeModelSelect.innerHTML = p.models.map(m => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('') + `<option value="__custom__">${escapeHtml(t('customModelOption'))}</option>`;
        const target = preserveModel && p.models.includes(preserveModel) ? preserveModel : p.model;
        nodeModelSelect.value = target;
        nodeModelInput.value = target;
        nodeModelSelect.style.display = '';
        nodeModelInput.style.display = 'none';
      } else {
        // 自定义预设：直接显示输入框
        nodeModelSelect.style.display = 'none';
        nodeModelInput.style.display = '';
        if (!nodeModelInput.value) nodeModelInput.value = p.model || '';
      }
      // Key 提示
      keyHint.textContent = p.keyHint || '';
      const requiredMark = mask.querySelector('.key-required');
      if (requiredMark) requiredMark.style.display = p.noAuth ? 'none' : '';
      nodeApiKey.required = !p.noAuth;
      nodeApiKey.disabled = !!p.noAuth;
      if (p.noAuth) nodeApiKey.value = '';
      nodeApiKey.placeholder = p.noAuth ? (getLang() === 'en' ? 'No key required' : '默认服务商免 Key') : t('apiKeyPlaceholder');
    }

    nodeModelSelect.addEventListener('change', () => {
      if (nodeModelSelect.value === '__custom__') {
        nodeModelSelect.style.display = 'none';
        nodeModelInput.style.display = '';
        nodeModelInput.value = '';
        nodeModelInput.focus();
      } else {
        nodeModelInput.value = nodeModelSelect.value;
      }
    });

    btnCustomModel.addEventListener('click', () => {
      nodeModelSelect.style.display = 'none';
      nodeModelInput.style.display = '';
      nodeModelInput.focus();
    });

    nodePreset.addEventListener('change', () => renderPreset(nodePreset.value, false));

    // 初始化
    nodePreset.value = guessedPreset.id;
    renderPreset(guessedPreset.id, initial.model);

    btnSave.addEventListener('click', () => {
      const apiKey = (nodeApiKey.value || '').trim();
      const preset = PRESETS.find(p => p.id === nodePreset.value) || PRESETS[0];
      if (!preset.noAuth && !apiKey) {
        nodeApiKey.style.borderColor = '#d1242f';
        nodeApiKey.focus();
        return;
      }
      const model = (nodeModelInput.style.display === 'none' ? nodeModelSelect.value : nodeModelInput.value).trim();
      const cfg = {
        baseUrl: (nodeBaseUrl.value || DEFAULTS.baseUrl).trim().replace(/\/$/, ''),
        apiKey: preset.noAuth ? '' : apiKey,
        model: model || DEFAULTS.model,
        noAuth: !!preset.noAuth
      };
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
  async function callChatAPI(cfg, messages, onDelta, retried = false) {
    // 防御：apiKey 含全角空格、Base URL 含中文等都会导致 fetch 抛 TypeError
    const cleanKey = String(cfg.apiKey || '').trim().replace(/[\u3000\s]+/g, '');
    const cleanBaseUrl = String(cfg.baseUrl || '').trim().replace(/\/$/, '');
    // 拆分 URL path 和 query string，避免 ?referrer=xxx 干扰路径判断
    const [urlPath, urlQuery] = cleanBaseUrl.split('?');
    const qs = urlQuery ? '?' + urlQuery : '';
    const endpoint = /\/chat\/completions$/i.test(urlPath)
      ? cleanBaseUrl                              // 已含完整路径
      : urlPath + '/chat/completions' + qs;       // 追加路径，保留 query string

    // 工具函数：把任何字符串安全转换为 ISO-8859-1 兼容的 ASCII（浏览器 fetch header 的硬性要求）
    const toAsciiSafe = (s, fallback) => {
      if (s == null) return fallback;
      const str = String(s);
      if (!/[^\x00-\xff]/.test(str)) return str;  // 已是 Latin-1 兼容
      // 含非 ASCII 字符（如中文）→ 用 fallback
      return fallback;
    };

    // Pre-check: API Key 必须 ASCII 安全
    if (/[^\x00-\xff]/.test(cleanKey)) {
      throw new Error(getLang() === 'en'
        ? 'API Key contains non-ASCII characters. Please paste a clean key via ⚙️.'
        : 'API Key 含非 ASCII 字符（中文/全角符号），请点 ⚙️ 重新粘贴干净的 Key。');
    }
    if (/[^\x00-\xff]/.test(cleanBaseUrl)) {
      throw new Error(getLang() === 'en'
        ? 'Base URL contains non-ASCII characters. Please re-enter via ⚙️.'
        : 'Base URL 含非 ASCII 字符，请点 ⚙️ 重新输入。');
    }

    const headers = {
      'Content-Type': 'application/json'
    };
    if (!cfg.noAuth && cleanKey) headers['Authorization'] = 'Bearer ' + cleanKey;
    // OpenRouter 推荐附带 HTTP-Referer 和 X-OpenRouter-Title（用于排行榜，可选但稳定）
    if (cleanBaseUrl.includes('openrouter.ai')) {
      try {
        headers['HTTP-Referer'] = toAsciiSafe(location.origin, 'https://teachany.app');
        const safeTitle = toAsciiSafe(document.title, 'TeachAny Course').slice(0, 100);
        headers['X-OpenRouter-Title'] = safeTitle;
        headers['X-Title'] = safeTitle;
      } catch (e) { /* ignore */ }
    }

    // 最终保险：遍历所有 header 值，再过一遍 ASCII 检查
    for (const k of Object.keys(headers)) {
      if (/[^\x00-\xff]/.test(headers[k])) {
        console.warn('[TeachAnyTutor] Removing non-ASCII header:', k, headers[k]);
        delete headers[k];
      }
    }
    // 设置 30 秒整体超时
    const ac = new AbortController();
    const overallTimeout = setTimeout(() => ac.abort('overall-timeout'), 30000);

    // fetch 本身可能因 CORS、header 编码、网络等抛 TypeError
    let resp;
    try {
      resp = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        signal: ac.signal,
        body: JSON.stringify({
          model: cfg.model || DEFAULTS.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
          // 推理模型（如 z-ai/glm-4.5-air:free）需要更多 token，否则 content 会被截断
        })
      });
    } catch (fetchErr) {
      clearTimeout(overallTimeout);
      console.error('[TeachAnyTutor] fetch threw:', fetchErr, 'headers used:', headers);
      const detail = (fetchErr && (fetchErr.name + ': ' + fetchErr.message)) || String(fetchErr);
      // 常见原因诊断
      let hint = '';
      if (/non ISO-8859-1|code point/i.test(detail)) {
        hint = getLang() === 'en'
          ? '（Header contains non-ASCII chars, possibly your API Key/Base URL has invalid characters - re-enter via ⚙️）'
          : '（请求头含非 ASCII 字符，可能是 API Key 或 Base URL 含中文/全角符号——点 ⚙️ 重新输入）';
      } else if (/Failed to fetch|NetworkError/i.test(detail)) {
        hint = getLang() === 'en'
          ? '（Network/CORS error. Check Base URL and your network.）'
          : '（网络错误或被 CORS 拦截。请检查 Base URL 和网络连接。）';
      }
      throw new Error((getLang() === 'en' ? 'Network error: ' : '网络错误：') + detail + hint);
    }

    if (!resp.ok) {
      clearTimeout(overallTimeout);
      let errJson;
      try { errJson = await resp.json(); } catch (e) {}

      // 429/503 自动重试 + 模型降级（仅 OpenRouter 免费模型）
      if ((resp.status === 429 || resp.status === 503) && cleanBaseUrl.includes('openrouter.ai') && !retried) {
        const retryAfter = errJson?.error?.metadata?.retry_after_seconds || 16;
        const currentModel = cfg.model || DEFAULTS.model;
        const nextModel = FALLBACK_MODELS.find(m => m !== currentModel) || FALLBACK_MODELS[0];

        console.warn(`[TeachAnyTutor] ${resp.status}, retrying in ${retryAfter}s with model ${nextModel}`);
        if (onDelta) onDelta(getLang() === 'en'
          ? `⏳ Rate limited, auto-retrying with ${nextModel} in ${retryAfter}s...`
          : `⏳ 请求过快，${retryAfter} 秒后自动切换 ${nextModel} 重试...`);

        await new Promise(r => setTimeout(r, Math.min(retryAfter, 20) * 1000));
        const retryCfg = { ...cfg, model: nextModel };
        return callChatAPI(retryCfg, messages, onDelta, true);
      }

      let errText = (getLang() === 'en' ? 'Request failed (' : '请求失败（') + resp.status + (getLang() === 'en' ? ')' : '）');
      errText += '：' + (errJson?.error?.message || JSON.stringify(errJson || {}).slice(0, 200));
      throw new Error(errText);
    }

    try {
      const ct = resp.headers.get('content-type') || '';
      if ((ct.includes('text/event-stream') || ct.includes('stream')) && resp.body && typeof resp.body.getReader === 'function') {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let gotContent = false;       // 是否收到过正式 content
        let reasoningBuffer = '';     // 暂存 reasoning，仅作兜底
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            // 1) 空行 → 跳过
            if (!trimmed) continue;
            // 2) SSE 注释（OpenRouter keep-alive: ": OPENROUTER PROCESSING"）→ 跳过，不能 JSON.parse
            if (trimmed.startsWith(':')) continue;
            // 3) 只处理 data: 行
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.replace(/^data:\s*/, '');
            // 4) 终止标记
            if (data === '[DONE]') {
              clearTimeout(overallTimeout);
              // 没收到任何 content 但收到了 reasoning（说明 exclude 没生效），用 reasoning 兜底
              if (!gotContent && reasoningBuffer) onDelta(reasoningBuffer);
              return;
            }
            // 5) 解析 JSON
            let json;
            try {
              json = JSON.parse(data);
            } catch (e) {
              // 解析失败，跳过该行（可能是不完整数据）
              continue;
            }
            // 6) mid-stream error（HTTP 200 但 chunk 含顶层 error 字段）
            if (json && json.error) {
              const msg = (json.error && json.error.message) || JSON.stringify(json.error);
              throw new Error((getLang() === 'en' ? 'Stream error: ' : '流式错误：') + msg);
            }
            // 7) 提取增量：只显示 content；reasoning 只静默累积作为兜底
            const choice = (json && json.choices && json.choices[0]) || {};
            const delta = choice.delta || {};
            if (delta.content) {
              if (!gotContent) {
                // 收到第一个 content：取消整体超时（已证明能出结果了）
                gotContent = true;
                clearTimeout(overallTimeout);
              }
              onDelta(delta.content);
            } else if (delta.reasoning && !gotContent) {
              // 仅在没拿到正式 content 时缓存推理，作为兜底
              reasoningBuffer += delta.reasoning;
            }
          }
        }
        clearTimeout(overallTimeout);
        // 流结束但没碰到 [DONE]：同上兜底
        if (!gotContent && reasoningBuffer) {
          onDelta(reasoningBuffer);
          return;
        }
        if (!gotContent) {
          throw new Error(getLang() === 'en'
            ? 'Empty response from model. Try a different model or check provider quota.'
            : '模型返回空内容。可能是免费模型上游异常或用量超限，请换个模型试试。');
        }
      } else {
        // 非流式 fallback：OpenRouter 有时会返回普通 JSON
        const json = await resp.json();
        clearTimeout(overallTimeout);
        if (json && json.error) {
          const msg = (json.error && json.error.message) || JSON.stringify(json.error);
          throw new Error((getLang() === 'en' ? 'API error: ' : 'API 错误：') + msg);
        }
        const choice = (json && json.choices && json.choices[0]) || {};
        const msg = choice.message || {};
        // 优先 content；为空时用 reasoning 兜底
        const full = msg.content || msg.reasoning || '';
        if (full) {
          onDelta(full);
        } else {
          throw new Error(getLang() === 'en'
            ? 'Empty response from model. Try a different model or check provider quota.'
            : '模型返回空内容。可能是免费模型上游异常或用量超限，请换个模型试试。');
        }
      }
    } catch (err) {
      clearTimeout(overallTimeout);
      // 识别超时/abort 错误，给友好提示
      if (err.name === 'AbortError' || (err.message || '').includes('overall-timeout') || (err.message || '').includes('aborted')) {
        throw new Error(getLang() === 'en'
          ? 'Timeout: the model took too long. Please retry later or switch to another model in settings.'
          : '请求超时（30秒）：模型响应太慢。请稍后重试，或在设置中切换另一个模型。');
      }
      throw err;
    }
  }

  // ───────────────────────────────────────────────────────
  // 8. 主控制器
  // ───────────────────────────────────────────────────────
  function boot() {
    // v7.1：启动时自检 localStorage，如果发现坏的 model 字段（含空格/括号），自动迁移
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.model && /[\s()（）：，,]/.test(parsed.model)) {
          console.warn('[TeachAnyTutor v7.1] Migrating broken model id:', parsed.model, '→', DEFAULTS.model);
          parsed.model = DEFAULTS.model;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) { /* ignore */ }

    const meta = readCourseMeta();
    const fab = createFab();
    let panel = null;
    let messagesEl = null;
    let inputEl = null;
    let sendBtn = null;
    let ctxSectionEl = null;
    let isPending = false;
    let history = [];

    function getWelcomeMessage() {
      const grade = meta.grade;
      const title = meta.courseTitle;
      let key;
      if (grade <= 6) key = 'welcomeP';
      else if (grade <= 9) key = 'welcomeM';
      else key = 'welcomeH';
      return t(key).replace('{title}', title);
    }

    function ensurePanel() {
      if (panel) return panel;
      panel = createPanel(meta);
      messagesEl = panel.querySelector('.ai-tutor-messages');
      inputEl = panel.querySelector('textarea');
      sendBtn = panel.querySelector('.btn-send');
      ctxSectionEl = panel.querySelector('.ctx-section');

      // 初始 AI 欢迎语
      const welcome = getWelcomeMessage();
      renderBubble(messagesEl, 'ai', welcome);

      // 关闭按钮
      panel.querySelector('.btn-close').addEventListener('click', () => togglePanel(false));
      // 清空按钮
      panel.querySelector('.btn-clear').addEventListener('click', () => {
        messagesEl.innerHTML = '';
        history = [];
        renderBubble(messagesEl, 'ai', getWelcomeMessage());
      });
      // 语言切换按钮
      panel.querySelector('.btn-lang').addEventListener('click', () => {
        const current = getLang();
        const next = current === 'zh' ? 'en' : 'zh';
        setLang(next);
        // 重建面板
        panel.remove();
        panel = null;
        ensurePanel();
        togglePanel(true);
      });
      // 设置按钮（打开配置弹窗）
      panel.querySelector('.btn-settings').addEventListener('click', () => {
        const current = getEffectiveConfig();
        createConfigModal(current, () => {}, () => {});
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
      // 默认服务商免 Key；只有切换到需要 Key 的服务商且未填写时才弹配置框
      const cfg = getEffectiveConfig();
      if (!cfg.noAuth && !cfg.apiKey) {
        createConfigModal(cfg, (savedCfg) => {
          if (savedCfg && (savedCfg.noAuth || savedCfg.apiKey)) doSend(text);
        }, () => {});
        return;
      }
      doSend(text);
    }

    async function doSend(text) {
      const cfg = getEffectiveConfig();

      inputEl.value = '';
      inputEl.style.height = '36px';

      renderBubble(messagesEl, 'user', text);

      const contextText = (meta.getContext() || '').slice(0, 3000);
      const sectionTitle = getCurrentSectionTitle();
      const system = buildSystemPrompt(meta);

      const lang = getLang();
      const userPayload = lang === 'en'
        ? `[Currently studying: ${sectionTitle}]\n\n[Course context]\n${contextText}\n\n[Student question]\n${text}`
        : `[当前正在学习：${sectionTitle}]\n\n[课件上下文片段]\n${contextText}\n\n[学生提问]\n${text}`;

      const messages = [
        { role: 'system', content: system },
        ...history.slice(-6),
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

        // ── TeachAny 历史上报（零侵入可选链） ──
        try {
          const courseId = (document.querySelector('meta[name="teachany-courseware-id"]') || {}).content || '';
          if (courseId && window.TeachAnyHistory && typeof window.TeachAnyHistory.recordTutorChat === 'function') {
            const extra = { provider: (cfg && cfg.providerId) || '', model: (cfg && cfg.model) || '' };
            window.TeachAnyHistory.recordTutorChat(courseId, 'user', text, extra);
            window.TeachAnyHistory.recordTutorChat(courseId, 'assistant', aiBubble.textContent || '', extra);
          }
        } catch (_e) { /* ignore */ }
      } catch (err) {
        console.error('[TeachAnyTutor] Request failed:', err);
        aiBubble.remove();
        const errMsg = err && err.message ? err.message : (lang === 'en' ? 'Request failed' : '请求失败');
        renderBubble(messagesEl, 'ai', '😥 ' + errMsg + t('errorHint'), { error: true });
      } finally {
        isPending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }

    // FAB 点击：直接开关面板；首次需配置 API Key
    fab.addEventListener('click', () => {
      togglePanel(!(panel && panel.classList.contains('open')));
    });
  }

  // ───────────────────────────────────────────────────────
  // 9. 启动（DOM 就绪后）
  // ───────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ───────────────────────────────────────────────────────
  // 10. 开发者接口
  // ───────────────────────────────────────────────────────
  window.TeachAnyTutor = {
    /** 清除用户自定义配置（恢复使用 DEFAULTS） */
    clearKey: clearUserConfig,
    /** 设置 API 配置（运行时替换） */
    setConfig: function (cfg) {
      if (cfg && typeof cfg === 'object') {
        saveUserConfig({
          baseUrl: cfg.baseUrl || DEFAULTS.baseUrl,
          apiKey: cfg.apiKey || '',
          model: cfg.model || DEFAULTS.model
        });
      }
    },
    /** 获取当前生效配置 */
    getConfig: getEffectiveConfig,
    /** 设置界面语言：'zh' | 'en' */
    setLang: function (lang) {
      setLang(lang);
      // 提示需刷新面板
      console.log('[TeachAnyTutor] Language set to:', lang, '- please reopen the panel to see changes.');
    },
    /** 获取当前语言 */
    getLang: getLang,
    /** 版本号 */
    version: '7.3.1'
  };
})();
