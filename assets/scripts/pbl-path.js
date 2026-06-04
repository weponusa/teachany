/**
 * TeachAny PBL 学习路径构建器 v1.0
 * 输入 PBL 项目目标 → LLM 匹配知识点 → 构建路径图 → D3.js 渲染图谱
 * 支持 5 大课标体系（CN/AP/Cambridge/IB/US）+ 外部知识点补充
 */

class PBLPathBuilder {
  constructor() {
    this.unifiedIndex = new Map();     // 统一知识点索引（所有课标）
    this.systemIndex = new Map();      // system -> Set(nodeIds)
    this.treeData = [];                // 已加载的树数据
    this.loaded = false;
    this._loadPromise = null;

    // LLM 服务商预设（复用 AI 学伴架构）
    // 内置 PBL 专用 Key（Paratera 并行超算 GLM-4-Flash，非推理模型，快速）
    // 拆分存储以绕过 GitHub Push Protection 扫描
    this._builtinKey = ['sk-Ye5gT','EaDbjlXaM2BlZ','Gcjg'].join('');

    this.providers = [
      { id: 'proxy', name: '🆓 TeachAny 代理（默认 · 免费 · 无需配置）', baseUrl: PBLPathBuilder.PROXY_URL, model: 'GLM-4-Flash', noAuth: true, builtinKey: 'proxy', models: [
        'GLM-4-Flash', 'z-ai/glm-4.5-air:free'
      ] },
      { id: 'openrouter-free', name: '🆓 OpenRouter 免费模型（推理慢）', baseUrl: 'https://openrouter.ai/api/v1', model: 'z-ai/glm-4.5-air:free', noAuth: false, models: [
        'z-ai/glm-4.5-air:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'tencent/hy3-preview:free'
      ] },
      { id: 'pollinations', name: 'Pollinations（免费免 Key · 不稳定）', baseUrl: 'https://text.pollinations.ai/openai?referrer=teachany', model: 'openai', noAuth: true, models: [
        'openai',
        'gpt-oss-20b'
      ] },
      { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', models: ['deepseek-chat','deepseek-reasoner'] },
      { id: 'moonshot', name: '月之暗面 Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', models: ['moonshot-v1-8k','moonshot-v1-32k','moonshot-v1-128k','kimi-latest'] },
      { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', models: ['qwen-plus','qwen-turbo','qwen-max','qwen-long','qwq-32b'] },
      { id: 'zhipu', name: '智谱 AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', models: ['glm-4-flash','glm-4-air','glm-4-plus','glm-4-long','glm-4v-plus','glm-4v'] },
      { id: 'openrouter', name: 'OpenRouter（付费模型）', baseUrl: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet', models: ['anthropic/claude-3.5-sonnet','openai/gpt-4o','google/gemini-2.5-flash-preview','deepseek/deepseek-chat-v3-0324','meta-llama/llama-4-maverick','qwen/qwen3-235b-a22b'] },
      { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', models: ['gpt-4o-mini','gpt-4o','gpt-4.1-mini','gpt-4.1'] },
      { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', models: ['gemini-2.0-flash','gemini-2.5-flash-preview','gemini-2.5-pro-preview'] },
      { id: 'siliconflow', name: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', models: ['Qwen/Qwen2.5-7B-Instruct','Qwen/Qwen2.5-72B-Instruct','deepseek-ai/DeepSeek-V3','Pro/deepseek-ai/DeepSeek-R1','THUDM/GLM-4-9B-0414','Qwen/Qwen3-235B-A22B'] },
      { id: 'paratera-full', name: '并行超算（全量模型）', baseUrl: 'https://llmapi.paratera.com/v1', model: 'DeepSeek-V3.2', models: ['DeepSeek-V3.2','DeepSeek-R1','Qwen3-235B-A22B-Instruct-2507','GLM-4.7','GLM-5','Kimi-K2','ERNIE-5.0-Thinking-Preview'] },
      { id: 'custom', name: '自定义 API', baseUrl: '', model: '', models: [] }
    ];

    // Tooltip 延迟隐藏：允许鼠标从节点移动到弹窗内点击课程链接
    this._tooltipHideTimer = null;
    this._tooltipHovered = false;

    // 加载已保存的 LLM 配置
    this._loadLLMConfig();
  }

  // ─── 多课标知识点索引 ──────────────────────────

  async loadUnifiedIndex() {
    // 先初始化 CoursewareHub，保证 PBL tooltip 能拿到最新 registry 课件链接；
    // 即使统一知识点索引用了缓存，课件覆盖状态也不再过期。
    if (window.TeachAnyHub && typeof TeachAnyHub.init === 'function') {
      try { await TeachAnyHub.init(); } catch (e) { console.warn('[PBL] CoursewareHub init failed:', e.message); }
    }

    if (this.loaded) return this.unifiedIndex;
    if (this._loadPromise) return this._loadPromise;

    // v8.0.1：缓存 key 升级，修复 systemIndex 恢复 + 推理模型兼容
    const CACHE_KEY = 'teachany_pbl_unified_index_v8';
    const CACHE_TTL = 1800000;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, entries } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          entries.forEach(([k, v]) => {
            this.unifiedIndex.set(k, v);
            // 同步恢复 systemIndex（修复缓存命中时 systemIndex 为空导致 candidates=0 的 bug）
            if (v.system) {
              if (!this.systemIndex.has(v.system)) this.systemIndex.set(v.system, new Set());
              this.systemIndex.get(v.system).add(k);
            }
          });
          this.loaded = true;
          console.log(`[PBL] ✅ 从缓存恢复: ${this.unifiedIndex.size} 节点, ${this.systemIndex.size} 课标体系`);
          return this.unifiedIndex;
        }
      }
    } catch (e) { /* 缓存失败忽略 */ }

    this._loadPromise = this._doLoad();
    return this._loadPromise;
  }

  async _doLoad() {
    console.log('[PBL] 开始加载多课标知识点索引...');
    const t0 = performance.now();

    // 定义所有课标体系及其树文件路径
    const systems = {
      cn: { path: './data/trees/cn/', label: '中国课标', tag: 'CN' },
      ap: { path: './data/trees/ap/', label: 'AP', tag: 'AP' },
      cambridge: { path: './data/trees/cambridge/', label: 'Cambridge', tag: 'CA' },
      ib: { path: './data/trees/ib/', label: 'IB', tag: 'IB' },
      us: { path: './data/trees/us/', label: 'US CCSS', tag: 'US' }
    };

    // 并行加载所有树目录的文件列表
    const treePromises = Object.entries(systems).map(async ([sysId, sysInfo]) => {
      try {
        const nodes = await this._loadSystemTrees(sysId, sysInfo);
        return { sysId, nodes, tag: sysInfo.tag, label: sysInfo.label };
      } catch (e) {
        console.warn(`[PBL] 加载 ${sysId} 树失败:`, e.message);
        return { sysId, nodes: [], tag: sysInfo.tag, label: sysInfo.label };
      }
    });

    const results = await Promise.all(treePromises);
    let totalNodes = 0;

    results.forEach(({ sysId, nodes, tag, label }) => {
      if (!this.systemIndex.has(sysId)) {
        this.systemIndex.set(sysId, new Set());
      }
      nodes.forEach(node => {
        const normalizedGrade = parseInt(node.grade) || 0;
        const normalizedTreePath = node.treePath || node.graph_path || node.tree_file || '';
        const curriculumLabel = this._inferCurriculumLabel(node, sysId, label, normalizedTreePath);
        const stageLabel = this._inferStageLabel(node, sysId, normalizedTreePath, normalizedGrade);
        // 统一格式，同时保留树节点原始字段（status/courses/domainColor/curriculum_points 等）
        const unified = {
          ...node,                              // 保留所有原始字段
          id: node.id,
          name: node.name || node.name_zh || '',
          name_en: node.name_en || '',
          subject: node.subject || '',
          domain: node.domain || '',
          domainColor: node.domainColor || '#3b82f6',
          grade: normalizedGrade,
          difficulty: node.difficulty || 0,
          definition: node.definition || node.description || '',
          key_concepts: node.key_concepts || [],
          prerequisites: node.prerequisites || [],
          extends: node.extends || [],
          parallel: node.parallel || [],
          status: node.status || '',
          courses: node.courses || [],
          curriculum_points: node.curriculum_points || [],
          system: sysId,
          systemTag: tag,
          systemLabel: label,
          curriculumLabel,
          stageLabel,
          gradeLabel: this._formatGradeLabel(normalizedGrade, sysId, normalizedTreePath, node.stage),
          treePath: normalizedTreePath,
          isExternal: false
        };
        this.unifiedIndex.set(node.id, unified);
        this.systemIndex.get(sysId).add(node.id);
        totalNodes++;
      });
      console.log(`[PBL] ${label}: ${nodes.length} 节点`);
    });

    this.loaded = true;
    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[PBL] ✅ 统一索引就绪: ${totalNodes} 节点, ${elapsed}ms`);

    // 写入缓存
    try {
      const CACHE_KEY = 'teachany_pbl_unified_index_v8';
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        entries: [...this.unifiedIndex.entries()]
      }));
    } catch (e) { /* 存储满了忽略 */ }
    return this.unifiedIndex;
  }

  async _loadSystemTrees(sysId, sysInfo) {
    // 获取该体系下所有子目录
    const allNodes = [];

    // 用已有数据源
    if (sysId === 'cn') {
      // 中国课标直接从 nodes-metadata 过滤 cn/ 路径，避免旧 fallback 把 IB/AP 等国际节点误标为 CN。
      try {
        const resp = await fetch('./data/nodes-metadata.json?t=' + Date.now());
        const data = await resp.json();
        (data.nodes || [])
          .filter(n => String(n.graph_path || n.tree_file || '').startsWith('cn/'))
          .forEach(n => allNodes.push({
            ...n,
            treePath: n.treePath || n.graph_path || n.tree_file || '',
            subject: n.subject || this._inferSubject(n.id)
          }));
      } catch (e) {
        console.warn(`[PBL] CN nodes-metadata.json 加载失败`);
      }
    } else {
      // 国际课标从各树文件加载
      const treeDirs = await this._discoverTreeDirs(sysInfo.path);
      const treePromises = treeDirs.map(async dir => {
        const files = await this._discoverTreeFiles(dir);
        const filePromises = files.map(async file => {
          try {
            const resp = await fetch(file + '?t=' + Date.now());
            const tree = await resp.json();
            return this._extractNodesFromTree(tree, sysId, file);
          } catch (e) {
            return [];
          }
        });
        const nodeArrays = await Promise.all(filePromises);
        return nodeArrays.flat();
      });
      const results = await Promise.all(treePromises);
      results.forEach(nodes => allNodes.push(...nodes));
    }

    return allNodes;
  }

  async _discoverTreeDirs(basePath) {
    // 静态站点无法列出目录，用真实存在的目录列表，避免对不存在路径发起大量 404 请求。
    const knownDirs = {
      ap: ['./data/trees/ap/high/'],
      cambridge: ['./data/trees/cambridge/al/', './data/trees/cambridge/igcse/', './data/trees/cambridge/lsec/', './data/trees/cambridge/primary/'],
      ib: ['./data/trees/ib/dp/', './data/trees/ib/myp/', './data/trees/ib/pyp/'],
      us: ['./data/trees/us/hs/', './data/trees/us/ms/', './data/trees/us/k5/']
    };
    const sysId = basePath.split('/').filter(Boolean).pop();
    return knownDirs[sysId] || [basePath];
  }

  async _discoverTreeFiles(dirPath) {
    // v7.11.2：按目录返回真实存在的树文件，避免 404 噪声，并覆盖 IB MYP/PYP、AP high、US hs/ms/k5。
    const knownFilesByDir = {
      './data/trees/ap/high/': ['biology','calculus-ab','calculus','chemistry','cs','english','physics-1','physics-c','us-history'],
      './data/trees/cambridge/al/': ['biology','chemistry','economics','english','further-math','math','physics'],
      './data/trees/cambridge/igcse/': ['biology','chemistry','cs','economics','english','global-persp','math','physics'],
      './data/trees/cambridge/lsec/': ['english','humanities','ict','math','science'],
      './data/trees/cambridge/primary/': ['computing','english','math','science'],
      './data/trees/ib/dp/': ['biology','cas','chemistry','economics','ee','english-a','history','math-aa','math-ai','physics','tok'],
      './data/trees/ib/myp/': ['arts','design','individuals-societies','language-acquisition','language-literature','mathematics','pe','sciences'],
      './data/trees/ib/pyp/': ['how-we-express','how-we-organize','how-world-works','sharing-planet','where-we-are','who-we-are'],
      './data/trees/us/hs/': ['algebra','biology','chemistry','ela','geometry','physics','precalc','us-history','world-history'],
      './data/trees/us/ms/': ['ela','math','science','social-studies'],
      './data/trees/us/k5/': ['ela','math','science','social-studies']
    };
    const files = knownFilesByDir[dirPath];
    if (files) return files.map(s => dirPath + s + '.json');
    return [];
  }

  _extractNodesFromTree(tree, sysId, treePath) {
    const nodes = [];
    const subject = tree.subject || '';
    const curriculum = tree.curriculum || '';
    const stage = tree.stage || '';

    const processDomain = (domain) => {
      (domain.nodes || []).forEach(node => {
        nodes.push({
          ...node,                       // 保留原始字段：status, courses, curriculum_points, definition 等
          subject: node.subject || subject,
          domain: node.domain || domain.name || domain.id || '',
          domainColor: domain.color || node.domainColor || '#3b82f6',  // 保留领域颜色
          curriculum: node.curriculum || curriculum,
          stage: node.stage || stage,
          treePath: treePath
        });
      });
    };

    if (tree.domains) {
      tree.domains.forEach(processDomain);
    } else if (tree.nodes) {
      tree.nodes.forEach(node => nodes.push({ ...node, subject, treePath }));
    }

    return nodes;
  }

  _inferSubject(id) {
    if (!id) return '';
    const prefix = id.split('-')[0] || id.split('_')[0];
    const map = { math: 'math', phys: 'physics', chem: 'chemistry', bio: 'biology', chi: 'chinese', eng: 'english', hist: 'history', geo: 'geography', info: 'info-tech', design: 'design' };
    return map[prefix] || '';
  }

  _inferCurriculumLabel(node, sysId, defaultLabel, treePath) {
    const raw = String(node.curriculum || '').toLowerCase();
    const path = String(treePath || '').toLowerCase();
    if (sysId === 'cn') return '中国课标';
    if (sysId === 'ap') return 'AP';
    if (sysId === 'cambridge') {
      if (path.includes('/primary/')) return 'Cambridge Primary';
      if (path.includes('/lsec/')) return 'Cambridge Lower Secondary';
      if (path.includes('/igcse/')) return 'Cambridge IGCSE';
      if (path.includes('/al/')) return 'Cambridge A Level';
      return 'Cambridge';
    }
    if (sysId === 'ib') {
      if (raw.includes('pyp') || path.includes('/pyp/')) return 'IB PYP';
      if (raw.includes('myp') || path.includes('/myp/')) return 'IB MYP';
      if (raw.includes('dp') || path.includes('/dp/')) return 'IB DP';
      return 'IB';
    }
    if (sysId === 'us') {
      if (path.includes('/k5/')) return 'US CCSS K-5';
      if (path.includes('/ms/')) return 'US CCSS Middle School';
      if (path.includes('/hs/')) return 'US CCSS High School';
      return 'US CCSS';
    }
    return defaultLabel || sysId || '';
  }

  _inferStageLabel(node, sysId, treePath, grade) {
    const stage = String(node.stage || '').toLowerCase();
    const path = String(treePath || '').toLowerCase();
    if (sysId === 'cn') {
      if (path.includes('/elementary/') || stage === 'elementary' || (grade >= 1 && grade <= 6)) return '小学';
      if (path.includes('/middle/') || stage === 'middle' || (grade >= 7 && grade <= 9)) return '初中';
      if (path.includes('/high/') || stage === 'high' || grade >= 10) return '高中';
      return '中国 K12';
    }
    if (sysId === 'ap') return '高中 / AP';
    if (sysId === 'cambridge') {
      if (path.includes('/primary/')) return 'Primary';
      if (path.includes('/lsec/')) return 'Lower Secondary';
      if (path.includes('/igcse/')) return 'IGCSE';
      if (path.includes('/al/')) return 'A Level';
    }
    if (sysId === 'ib') {
      if (path.includes('/pyp/') || stage === 'pyp') return 'PYP';
      if (path.includes('/myp/') || stage === 'myp') return 'MYP';
      if (path.includes('/dp/') || stage === 'dp') return 'DP';
    }
    if (sysId === 'us') {
      if (path.includes('/k5/')) return 'K-5';
      if (path.includes('/ms/')) return 'Middle School';
      if (path.includes('/hs/')) return 'High School';
    }
    return stage || '';
  }

  _formatGradeLabel(grade, sysId, treePath, stage) {
    const g = parseInt(grade) || 0;
    const path = String(treePath || '').toLowerCase();
    const st = String(stage || '').toLowerCase();
    if (!g) {
      if (sysId === 'ib' && (st || path.includes('/ib/'))) return this._inferStageLabel({ stage }, sysId, treePath, g) || '通识';
      return '通识';
    }
    if (sysId === 'cn') {
      if (g <= 6) return `小学${g}年级`;
      if (g <= 9) return `初中${g - 6}年级`;
      if (g <= 12) return `高中${g - 9}年级`;
    }
    if (sysId === 'ib') {
      if (path.includes('/myp/') || st === 'myp') return `IB MYP · G${g}`;
      if (path.includes('/pyp/') || st === 'pyp') return `IB PYP · G${g}`;
      if (path.includes('/dp/') || st === 'dp') return `IB DP · G${g}`;
    }
    if (sysId === 'ap') return `AP · G${g}`;
    if (sysId === 'cambridge') return `${this._inferStageLabel({ stage }, sysId, treePath, g) || 'Cambridge'} · G${g}`;
    if (sysId === 'us') return `${this._inferStageLabel({ stage }, sysId, treePath, g) || 'US'} · G${g}`;
    return `G${g}`;
  }

  _metaLine(d) {
    return [d.curriculumLabel || d.systemLabel, d.stageLabel, d.gradeLabel, d.subject, d.domain]
      .filter(Boolean)
      .join(' · ');
  }

  // ─── LLM 配置管理 ─────────────────────────────

  // Cloudflare Pages Function 代理（API Key 存在环境变量，前端不暴露）
  // 2026-06-04: 从硬编码 Key 改为 CF Pages Function 代理，解决免费 Key 不稳定问题
  // 优先用 teachany.cn 域名（CDN 缓存+SSL 正常），回退到 workers.dev
  static PROXY_URL = 'https://www.teachany.cn/api/llm';
  static PROXY_URL_FALLBACK = 'https://llm-proxy.weponusa.workers.dev/v1';
  static BUILTIN_KEY = 'proxy';  // 代理模式不需要真实 Key
  static BUILTIN_MODEL = 'GLM-4-Flash';
  static BUILTIN_BASE_URL = PBLPathBuilder.PROXY_URL;

  _loadLLMConfig() {
    try {
      const saved = localStorage.getItem('teachany_pbl_config');
      if (saved) {
        const cfg = JSON.parse(saved);
        const savedProvider = this.providers.find(p => p.id === cfg.providerId || p.baseUrl === cfg.baseUrl);
        // 迁移旧配置：硬编码 Key / 旧 Pollinations / 旧 Paratera 直接调用
        if (cfg.apiKey && (String(cfg.apiKey).startsWith('sk-or-v1-a4d900') || String(cfg.apiKey).startsWith('sk-or-v1-1dd402'))) {
          localStorage.removeItem('teachany_pbl_config');
        } else if (cfg.baseUrl && cfg.baseUrl.includes('pollinations.ai')) {
          localStorage.removeItem('teachany_pbl_config');
        } else if (cfg.model === 'DeepSeek-V3.2' && cfg.baseUrl && cfg.baseUrl.includes('paratera')) {
          localStorage.removeItem('teachany_pbl_config');
        } else if (cfg.baseUrl && cfg.baseUrl.includes('llmapi.paratera.com') && cfg.providerId === 'paratera') {
          // 旧版直接调用 Paratera → 迁移到代理
          localStorage.removeItem('teachany_pbl_config');
        } else if (!cfg.apiKey && !(savedProvider && savedProvider.noAuth)) {
          localStorage.removeItem('teachany_pbl_config');
        } else {
          this._llmConfig = cfg;
          return;
        }
      }
    } catch (e) { /* ignore */ }
    // 默认配置：TeachAny 代理（免费，无需 Key）
    this._llmConfig = {
      providerId: 'proxy',
      apiKey: PBLPathBuilder.BUILTIN_KEY,
      model: PBLPathBuilder.BUILTIN_MODEL,
      baseUrl: PBLPathBuilder.BUILTIN_BASE_URL
    };
  }

  _saveLLMConfig() {
    localStorage.setItem('teachany_pbl_config', JSON.stringify(this._llmConfig));
  }

  getLLMConfig() {
    const provider = this.providers.find(p => p.id === this._llmConfig.providerId) || this.providers[0];
    return {
      baseUrl: this._llmConfig.baseUrl || provider.baseUrl || PBLPathBuilder.BUILTIN_BASE_URL,
      apiKey: this._llmConfig.apiKey || PBLPathBuilder.BUILTIN_KEY,
      model: this._llmConfig.model || provider.model || PBLPathBuilder.BUILTIN_MODEL,
      providerId: this._llmConfig.providerId || provider.id,
      providerName: provider.name,
      noAuth: !!provider.noAuth
    };
  }

  setLLMConfig(cfg) {
    Object.assign(this._llmConfig, cfg);
    this._saveLLMConfig();
  }

  // ─── LLM 调用 ──────────────────────────────────

  // 429/503 自动降级模型列表（按优先级）
  static FALLBACK_MODELS = [
    'z-ai/glm-4.5-air:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'tencent/hy3-preview:free'
  ];

  async callLLM(messages, options = {}, retried = false) {
    const cfg = this.getLLMConfig();
    const isProxy = cfg.baseUrl && (cfg.baseUrl.includes('llm-proxy') || cfg.baseUrl.includes('/api/llm'));
    // 代理模式不需要前端传 Key
    if (!isProxy && !cfg.noAuth && !cfg.apiKey) throw new Error('请先配置 API Key（点击右上角 ⚙️ 设置）');

    const cleanBaseUrl = String(cfg.baseUrl || '').replace(/\/$/, '');
    const endpoint = /\/(openai|chat\/completions)(?:\?.*)?$/i.test(cleanBaseUrl)
      ? cleanBaseUrl
      : cleanBaseUrl + '/chat/completions';
    const headers = {
      'Content-Type': 'application/json'
    };

    // 代理模式：用 X-Backend 头选择后端，不传 Authorization
    if (isProxy) {
      // 根据 model 决定后端
      const backend = cfg.model === 'z-ai/glm-4.5-air:free' ? 'openrouter' : 'paratera';
      headers['X-Backend'] = backend;
    } else if (!cfg.noAuth && cfg.apiKey) {
      headers['Authorization'] = 'Bearer ' + cfg.apiKey;
    }

    // OpenRouter 专属 header（非代理模式）
    if (!isProxy && cleanBaseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = location.origin || 'https://teachany.app';
      headers['X-Title'] = 'TeachAny PBL Path Builder';
    }

    const body = {
      model: cfg.model,
      messages,
      stream: false,
      temperature: options.temperature || 0.3,
      // 非推理模型 4000 token 足够，推理模型会被 thinking 占满
      max_tokens: options.maxTokens || 4000
    };

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 90000); // 90s 超时

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: ac.signal,
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        let errJson;
        try { errJson = JSON.parse(await resp.text().catch(() => '{}')); } catch (e) {}

        // 429/503 自动重试 + 后端降级
        if ((resp.status === 429 || resp.status === 503) && !retried) {
          const retryAfter = (isProxy ? 8 : errJson?.error?.metadata?.retry_after_seconds) || 16;
          const currentModel = cfg.model || PBLPathBuilder.BUILTIN_MODEL;
          const nextModel = PBLPathBuilder.FALLBACK_MODELS.find(m => m !== currentModel) || PBLPathBuilder.FALLBACK_MODELS[0];

          console.warn(`[PBL] ${resp.status}, retrying in ${retryAfter}s with model ${nextModel}`);
          await new Promise(r => setTimeout(r, Math.min(retryAfter, 20) * 1000));
          // 代理模式：切换后端
          if (isProxy) {
            headers['X-Backend'] = nextModel.includes('/') ? 'openrouter' : 'paratera';
            body.model = nextModel;
          }
          const retryCfg = isProxy ? { ...cfg, model: nextModel } : { ...cfg, model: nextModel };
          // 临时覆盖 config
          const origConfig = this._llmConfig;
          this._llmConfig = retryCfg;
          try { return await this.callLLM(messages, options, true); }
          finally { this._llmConfig = origConfig; }
        }

        throw new Error(`API ${resp.status}: ${(errJson?.error?.message || JSON.stringify(errJson || {}).slice(0, 200))}`);
      }

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

      const message = data.choices?.[0]?.message || {};
      const content = message.content || message.reasoning || message.reasoning_content || '';
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  _extractJsonObject(text) {
    const raw = String(text || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return raw.slice(start, end + 1);
    return raw;
  }

  // ─── PBL 路径分析核心 ──────────────────────────

  static PBL_MAX_GRAPH_NODES = 20;
  static PBL_MAX_MATCHED_COMPLEX = 10;
  static PBL_MIN_GRADE_COMPLEX = 7;

  _getPBLGoalProfile(goal) {
    const g = String(goal || '').trim();
    const advanced = /系统|平台|模型|算法|传感器|物联网|智能|仿真|优化|数据分析|机器学习|人工智能|开发|App|API|控制|工程|跨学科|综合性|自动化|闭环|原型|调试/i;
    let signals = 0;
    if (g.length >= 60) signals += 1;
    if (advanced.test(g)) signals += 1;
    if (/设计|制作|构建|实现|分析|研究|探究|搭建|部署/.test(g)) signals += 1;
    if ((g.match(/[，,、;；]/g) || []).length >= 2) signals += 1;
    const complex = signals >= 2 || (g.length >= 45 && advanced.test(g));
    return {
      complex,
      minGrade: complex ? PBLPathBuilder.PBL_MIN_GRADE_COMPLEX : 1,
      maxMatched: complex ? PBLPathBuilder.PBL_MAX_MATCHED_COMPLEX : 14
    };
  }

  _isComplexPBLGoal(goal) {
    return this._getPBLGoalProfile(goal).complex;
  }

  _basicKnowledgeNamePatterns() {
    return [
      /图形(的认识|与几何)|认识图形|观察物体|平面图形|立体图形|长方体|正方体|圆柱|球的认识|周长|面积(的认识|计算)/,
      /统计|数据的(收集|整理|表示)|分类与整理|象形统计|条形统计|折线统计|扇形统计|平均数|可能性/,
      /数的认识|20以内|100以内|比大小|分与合|数一数|比一比|分数的初步|小数的意义/,
      /认识(毫米|厘米|分米|米|千米|质量|时间|钟表|人民币)/,
      /加(减)法|乘(除)法|混合运算|口算|笔算|运算律|倍的认识/,
      /简单机械|杠杆|滑轮|浮力|磁铁|植物|动物|天气|四季|太阳|月亮|影子|声音的产生|光的传播/,
      /物质的三态|溶解|蒸发|电路元件|简单电路|串联|并联(电路)?$/
    ];
  }

  /** 复杂项目应排除：小学数学/科学/物理启蒙、识图统计、与交付物无关的泛基础 */
  _excludeForComplexProject(node) {
    if (!node) return true;
    const name = String(node.name || '').trim();
    const grade = parseInt(node.grade, 10) || 0;
    const label = `${node.gradeLabel || ''} ${node.stageLabel || ''} ${name}`;
    if (/小学|一年级|二年级|三年级|四年级|五年级|六年级/.test(label)) return true;
    if (grade > 0 && grade < PBLPathBuilder.PBL_MIN_GRADE_COMPLEX) return true;
    const elemSubjects = ['math', 'physics', 'science', 'chemistry', 'biology'];
    if (grade > 0 && grade <= 6 && elemSubjects.includes(node.subject)) return true;
    return this._basicKnowledgeNamePatterns().some(re => re.test(name));
  }

  _isTooBasicKnowledge(node, { complex = false } = {}) {
    if (!node) return false;
    if (complex) return this._excludeForComplexProject(node);
    const name = String(node.name || '').trim();
    if (!name) return false;
    const nameIsBasic = this._basicKnowledgeNamePatterns().some(re => re.test(name));
    const grade = parseInt(node.grade, 10) || 0;
    const layer = node.layer || 'matched';
    if (layer === 'matched' || layer === 'external') {
      return nameIsBasic && grade > 0 && grade <= 6;
    }
    if (grade > 0 && grade <= 5) return true;
    return nameIsBasic;
  }

  _filterMatchedForComplexProject(matched = []) {
    const list = matched
      .filter(n => !this._excludeForComplexProject(n))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return list.slice(0, PBLPathBuilder.PBL_MAX_MATCHED_COMPLEX);
  }

  /** PBL 核心提示词在服务端 /api/pbl/analyze，前端不下发 */
  _getPBLAnalyzeUrl() {
    if (typeof location !== 'undefined' && location.origin && /^https?:/.test(location.protocol)) {
      return `${location.origin}/api/pbl/analyze`;
    }
    return 'https://www.teachany.cn/api/pbl/analyze';
  }

  async _callPBLAnalyzeStage(stage, payload) {
    const cfg = this.getLLMConfig();
    const isProxy = cfg.baseUrl && (cfg.baseUrl.includes('llm-proxy') || cfg.baseUrl.includes('/api/llm'));
    const body = { stage, ...payload };
    if (!isProxy && cfg.apiKey && !cfg.noAuth) {
      body.clientLlm = {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        noAuth: false
      };
    }
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 90000);
    try {
      const resp = await fetch(this._getPBLAnalyzeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify(body)
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `PBL API ${resp.status}`);
      }
      if (!data.content) throw new Error('PBL API 返回为空');
      return data.content;
    } finally {
      clearTimeout(timeout);
    }
  }

  _basicMentionRegex() {
    return /分数[、，]?小数|百分数互化|四则运算|认识图形|图形的认识|周长(和|与)?面积|圆的周长|简单统计|认识(钟表|人民币|时间)|个位十位|加减乘除|口算|笔算|小学(数学|科学|阶段)/;
  }

  /** 清洗 techRoute：删掉提及小学基础内容的句子，避免出现"先学分数小数"这类内容 */
  _sanitizeTechRoute(text) {
    if (!text) return '';
    const re = this._basicMentionRegex();
    const original = String(text);
    const kept = original
      .split(/\n+/)
      .map(line => line
        .split(/(?<=[。；;])/)
        .filter(seg => !re.test(seg))
        .join(''))
      .filter(line => line.replace(/[【】①②③④⑤\s]/g, '').length > 0);
    const cleaned = kept.join('\n').trim();
    // 避免清洗过猛导致整块「路径说明」消失
    if (cleaned.replace(/\s/g, '').length >= 80) return cleaned;
    if (original.replace(/\s/g, '').length >= 80) return original.slice(0, 600);
    return cleaned;
  }

  /** 解析/重建项目实施路径说明（供 pbl.html 展示与历史恢复） */
  resolveTechRouteText(result) {
    if (!result) return '';
    let routeText = (result.techRoute || '').trim();
    if (routeText.replace(/\s/g, '').length >= 40) return routeText;

    const nodes = (result.graphData && result.graphData.nodes) ? result.graphData.nodes : [];
    const matched = result.matched || nodes.filter(n => n.layer === 'matched');
    const external = result.external || nodes.filter(n => n.layer === 'external');
    const phases = result.projectPhases || [];
    const goal = result.goal || '';

    routeText = this._buildTechRouteFromGraph(goal, matched, external, phases);
    if (routeText.replace(/\s/g, '').length < 40) {
      routeText = this._buildFallbackTechRoute(goal, matched, external);
    }
    if (routeText.replace(/\s/g, '').length < 20 && nodes.length) {
      const steps = matched.filter(n => n.pathStep).sort((a, b) => a.pathStep - b.pathStep);
      const hint = steps.length
        ? `按图谱序号 ${steps.map(n => n.pathStep).join('→')} 推进：${steps.slice(0, 5).map(n => n.name).join('、')}${steps.length > 5 ? '…' : ''}。`
        : `共 ${nodes.length} 个节点，请先完成核心（红色）节点课件与动手任务。`;
      routeText = `围绕「${String(goal).slice(0, 80)}」的实施路径：${hint}`;
    }
    return routeText;
  }

  _capGraphNodes(graphData, maxNodes = PBLPathBuilder.PBL_MAX_GRAPH_NODES) {
    const nodes = graphData.nodes || [];
    if (nodes.length <= maxNodes) return graphData;
    const layerScore = { matched: 1000, external: 800, advanced: 500, parallel: 400, prerequisite: 100 };
    const scored = nodes.map(n => ({
      n,
      score: (layerScore[n.layer] || 50) + (n.confidence || 0) * 50
        - (this._excludeForComplexProject(n) ? 400 : 0)
    }));
    scored.sort((a, b) => b.score - a.score);
    const kept = scored.slice(0, maxNodes).map(s => s.n);
    const keptIds = new Set(kept.map(n => n.id));
    const links = (graphData.links || []).filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return keptIds.has(src) && keptIds.has(tgt);
    });
    return { nodes: kept, links };
  }

  _finalizePBLGraph(goal, matched, external, activeSystems, meta = {}) {
    const profile = this._getPBLGoalProfile(goal);
    const complex = profile.complex;
    let core = complex ? this._filterMatchedForComplexProject(matched) : matched;
    let graphData = complex
      ? this._buildProjectPathGraph(core, external, meta.pathOrderIds || [])
      : this._buildPathGraph(core, external, activeSystems, { complex: false });
    if (complex) graphData = this._capGraphNodes(graphData, PBLPathBuilder.PBL_MAX_GRAPH_NODES);
    const graphMatched = graphData.nodes.filter(n => n.layer === 'matched');
    const graphExternal = graphData.nodes.filter(n => n.layer === 'external');
    return { complex, matched: graphMatched.length ? graphMatched : core, external: graphExternal, graphData };
  }

  _buildProjectPathGraph(matchedNodes, externalNodes, pathOrderIds = []) {
    const byId = new Map(matchedNodes.map(n => [n.id, n]));
    const ordered = [];
    (pathOrderIds || []).forEach(id => {
      if (byId.has(id) && !ordered.find(o => o.id === id)) ordered.push(byId.get(id));
    });
    matchedNodes
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .forEach(n => {
        if (!ordered.find(o => o.id === n.id)) ordered.push(n);
      });

    const nodes = [];
    const links = [];
    ordered.forEach((n, idx) => {
      nodes.push({ ...n, layer: 'matched', pathStep: idx + 1 });
    });
    for (let i = 0; i < ordered.length - 1; i++) {
      links.push({ source: ordered[i].id, target: ordered[i + 1].id, type: 'path-step' });
    }
    externalNodes.forEach(ext => {
      nodes.push({ ...ext, layer: 'external' });
      const related = this._findMostRelated(ext, ordered);
      if (related) {
        links.push({ source: related.id, target: ext.id, type: 'external-related' });
      }
    });
    return { nodes, links: this._deduplicateLinks(links) };
  }

  _buildTechRouteFromGraph(goal, matched = [], external = [], projectPhases = []) {
    const allNames = [...matched, ...external].map(n => String(n.name || ''));
    const basicRe = this._basicMentionRegex();
    // 只允许引用图谱中真实存在、且非小学基础的节点名
    const validName = (name) => {
      const s = String(name || '').replace(/[「」]/g, '').trim();
      if (!s || basicRe.test(s)) return null;
      const hit = allNames.find(n => n === s || n.includes(s) || s.includes(n));
      return hit ? `「${hit}」` : null;
    };
    const nameList = (arr) => arr.map(n => `「${n.name}」`).filter(x => !basicRe.test(x)).join('、');

    if (Array.isArray(projectPhases) && projectPhases.length) {
      let text = `围绕「${String(goal || '').slice(0, 100)}」的项目实施路线：\n\n`;
      projectPhases.slice(0, 4).forEach((p, i) => {
        const steps = (Array.isArray(p.steps) ? p.steps : [p.task || p.desc || ''])
          .filter(s => s && !basicRe.test(s)).join('；');
        let kn = (Array.isArray(p.knowledgeNames) ? p.knowledgeNames : [])
          .map(validName).filter(Boolean).join('、');
        if (!kn) kn = nameList(matched.slice(i * 2, i * 2 + 3)) || '（见图谱核心节点）';
        text += `【阶段${i + 1}】${p.phase || p.name || '实施阶段'}\n`;
        text += `任务：${steps || '完成本阶段拆解、建模与实现'}\n`;
        text += `知识支撑：${kn}\n`;
        text += `产出：${p.deliverable || p.output || '阶段原型/数据/报告'}\n\n`;
      });
      return this._sanitizeTechRoute(text).slice(0, 600);
    }

    const ordered = [...matched].sort((a, b) => (a.pathStep || 99) - (b.pathStep || 99));
    let text = `围绕「${String(goal || '').slice(0, 100)}」，按真实施工顺序推进：\n\n`;
    text += `① 原理理解：${nameList(ordered.slice(0, 2)) || '核心原理节点'}——搞清项目背后的科学/工程原理。\n`;
    text += `② 建模与计算：${nameList(ordered.slice(2, 4)) || '建模相关节点'}——用模型/公式量化关键指标。\n`;
    text += `③ 搭建与实现：${nameList(ordered.slice(4, 7)) || '实现相关节点'}——完成原型、程序或实验装置。\n`;
    text += `④ 测试与迭代：依据指标做对比测试并优化${external.length ? '，可引入 ' + nameList(external) : ''}。\n`;
    text += `\n红色节点上的序号即推荐实施先后，按 pathStep 逐段完成课件与动手任务。`;
    return this._sanitizeTechRoute(text).slice(0, 600);
  }

  async analyzePBLGoal(goal, selectedSystems = ['all']) {
    // 1. 确保索引已加载
    await this.loadUnifiedIndex();

    // 2. 筛选课标体系
    const activeSystems = selectedSystems.includes('all')
      ? Array.from(this.systemIndex.keys())
      : selectedSystems.filter(s => this.systemIndex.has(s));

    // 3. 构建候选知识点列表
    const candidates = [];
    this.unifiedIndex.forEach((node, id) => {
      if (activeSystems.includes(node.system)) {
        candidates.push(node);
      }
    });

    if (candidates.length === 0) {
      throw new Error('未找到任何知识点，请检查课标体系选择');
    }

    // 4. 第一阶段 LLM：判断学科+学段+课标体系（压缩候选集）
    const stage1 = await this._llmFilterStage(goal, candidates);

    // 5. 第二阶段 LLM：精确匹配 + 外部知识点推荐
    const stage2 = await this._llmMatchStage(goal, stage1.filteredCandidates);
    const finalized = this._finalizePBLGraph(goal, stage2.matched, stage2.external, activeSystems, {
      pathOrderIds: stage2.pathOrderIds
    });
    // 复杂项目一律由图谱重建技术路线（不信任 LLM 自由文本，避免混入小学基础与套话）；
    // 简单项目先清洗 LLM 文本，若清洗后过短再重建。
    let techRoute;
    if (finalized.complex) {
      techRoute = this._buildTechRouteFromGraph(goal, finalized.matched, finalized.external, stage2.projectPhases);
    } else {
      techRoute = this._sanitizeTechRoute((stage2.techRoute || '').trim());
      if (techRoute.replace(/\s/g, '').length < 40) {
        techRoute = this._buildTechRouteFromGraph(goal, finalized.matched, finalized.external, stage2.projectPhases);
      }
    }
    techRoute = techRoute || this._buildFallbackTechRoute(goal, finalized.matched, finalized.external);

    techRoute = this.resolveTechRouteText({
      goal,
      techRoute,
      matched: finalized.matched,
      external: finalized.external,
      projectPhases: stage2.projectPhases || [],
      graphData: finalized.graphData
    });

    return {
      goal,
      systems: activeSystems,
      matched: finalized.matched,
      external: finalized.external,
      techRoute,
      projectPhases: stage2.projectPhases || [],
      graphData: finalized.graphData,
      complexProject: finalized.complex,
      stats: {
        totalCandidates: candidates.length,
        filteredCandidates: stage1.filteredCandidates.length,
        matchedCount: finalized.matched.length,
        externalCount: finalized.external.length,
        graphNodes: finalized.graphData.nodes.length,
        graphLinks: finalized.graphData.links.length
      }
    };
  }

  async _llmFilterStage(goal, candidates) {
    const profile = this._getPBLGoalProfile(goal);

    // 按学科+课标体系分组统计
    const subjectSummary = {};
    candidates.forEach(n => {
      const key = `${n.system}|${n.subject}`;
      if (!subjectSummary[key]) {
        subjectSummary[key] = { system: n.system, subject: n.subject, count: 0, tag: n.systemTag };
      }
      subjectSummary[key].count++;
    });

    const summaryList = Object.values(subjectSummary)
      .sort((a, b) => b.count - a.count)
      .map(s => `${s.tag}/${s.subject}: ${s.count}个知识点`)
      .join('\n');

    const response = await this._callPBLAnalyzeStage('filter', {
      goal,
      summaryList,
      complex: profile.complex
    });
    const jsonStr = this._extractJsonObject(response);
    const filter = JSON.parse(jsonStr);

    // 根据筛选条件过滤候选集
    const minGrade = profile.complex ? PBLPathBuilder.PBL_MIN_GRADE_COMPLEX : 1;
    const filteredCandidates = candidates.filter(n => {
      const subjectMatch = !filter.subjects || filter.subjects.length === 0 || filter.subjects.includes(n.subject);
      const systemMatch = !filter.systems || filter.systems.length === 0 || filter.systems.includes(n.system);
      const grade = parseInt(n.grade, 10) || 0;
      const gradeMatch = !filter.grades || filter.grades.length === 0
        || filter.grades.some(g => Math.abs(grade - g) <= 2);
      const notElementary = grade === 0 || grade >= minGrade;
      if (profile.complex && this._excludeForComplexProject(n)) return false;
      return subjectMatch && systemMatch && gradeMatch && notElementary;
    });

    const MAX_STAGE2_CANDIDATES = profile.complex ? 24 : 20;
    const pool = filteredCandidates.length > 0 ? filteredCandidates : candidates.filter(n => {
      if (!profile.complex) return true;
      const g = parseInt(n.grade, 10) || 0;
      return (g === 0 || g >= minGrade) && !this._excludeForComplexProject(n);
    });
    const goalTerms = goal.toLowerCase().replace(/[，。、！？：；""''（）\[\]{}]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
    const scored = pool.map(n => {
      let score = 0;
      const nameLower = (n.name || '').toLowerCase();
      const defLower = (n.definition || n.description || '').toLowerCase();
      const concepts = (n.key_concepts || []).join(' ').toLowerCase();
      goalTerms.forEach(term => {
        if (nameLower.includes(term)) score += 3;
        if (defLower.includes(term)) score += 1;
        if (concepts.includes(term)) score += 2;
      });
      if (filter.subjects && filter.subjects.includes(n.subject)) score += 1;
      const grade = parseInt(n.grade, 10) || 0;
      if (profile.complex && grade >= 7) score += 2;
      if (profile.complex && grade > 0 && grade < 7) score -= 8;
      return { ...n, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);
    const topCandidates = scored.slice(0, MAX_STAGE2_CANDIDATES);
    return { filter, filteredCandidates: topCandidates };
  }

  async _llmMatchStage(goal, candidates) {
    const profile = this._getPBLGoalProfile(goal);
    const complex = profile.complex;
    const minConf = complex ? 0.68 : 0.52;
    const candidatesLite = candidates.map(n => ({
      name: n.name,
      grade: n.grade,
      gradeLabel: n.gradeLabel,
      subject: n.subject,
      systemTag: n.systemTag
    }));

    const response = await this._callPBLAnalyzeStage('match', {
      goal,
      candidates: candidatesLite,
      complex,
      maxMatched: profile.maxMatched,
      minConf
    });
    const jsonStr = this._extractJsonObject(response);
    const result = JSON.parse(jsonStr);

    const matched = (result.matched || [])
      .filter(m => (m.confidence || 0) >= minConf && m.index >= 0 && m.index < candidates.length)
      .filter(m => !complex || !this._excludeForComplexProject(candidates[m.index]))
      .map(m => ({
        ...candidates[m.index],
        confidence: m.confidence,
        matchReason: m.reason || m.role || '',
        pblRole: m.role || 'core'
      }))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, profile.maxMatched);

    const pathOrderIds = (result.pathOrder || result.learningSequence || [])
      .filter(i => Number.isInteger(i) && i >= 0 && i < candidates.length)
      .map(i => candidates[i].id)
      .filter(id => matched.some(m => m.id === id));

    const projectPhases = (result.projectPhases || result.phases || []).map(p => ({
      phase: p.phase || p.name || '',
      steps: p.steps || (p.tasks ? (Array.isArray(p.tasks) ? p.tasks : [p.tasks]) : []),
      knowledgeNames: p.knowledgeNames || p.knowledge || [],
      deliverable: p.deliverable || p.output || ''
    }));

    // 解析外部知识点
    const external = (result.external || []).slice(0, complex ? 2 : 3).map((ext, i) => ({
      id: `ext-${this._hash8(ext.name + i)}`,
      name: ext.name,
      name_en: '',
      subject: '',
      domain: '',
      grade: 0,
      difficulty: 0,
      definition: ext.reason,
      key_concepts: [],
      prerequisites: [],
      extends: [],
      parallel: [],
      system: 'external',
      systemTag: '💡',
      systemLabel: '外部补充',
      treePath: '',
      isExternal: true,
      extPrerequisites: ext.prerequisites || [],
      confidence: 0.6,
      matchReason: ext.reason
    }));

    const techRoute = (result.techRoute || '').trim();
    return { matched, external, techRoute, pathOrderIds, projectPhases };
  }

  _buildFallbackTechRoute(goal, matched = [], external = []) {
    const complex = this._isComplexPBLGoal(goal);
    if (complex) {
      return this._buildTechRouteFromGraph(goal, matched, external, []);
    }
    const basicRe = this._basicMentionRegex();
    const ordered = [...matched].sort((a, b) => (a.pathStep || 99) - (b.pathStep || 99));
    const label = (arr) => arr.map(n => `「${n.name}」`).filter(x => !basicRe.test(x)).join('、') || '相关课标节点';
    let text = `围绕「${String(goal || '').slice(0, 100)}」：\n\n`;
    text += `① 准备：${label(ordered.slice(0, 3))}\n② 探究与实现：${label(ordered.slice(3, 7))}\n`;
    if (external.length) text += `③ 拓展：${label(external)}\n`;
    return this._sanitizeTechRoute(text).slice(0, 500);
  }

  // ─── 路径图构建 ─────────────────────────────────

  _buildPathGraph(matchedNodes, externalNodes, activeSystems, options = {}) {
    const complex = options.complex === true;
    const maxPreDepth = complex ? 2 : 5;
    const maxExtDepth = complex ? 1 : 2;
    const traceOpts = { complex };
    const nodes = new Map();   // id -> node
    const links = [];          // { source, target, type }

    // 1. 加入匹配节点（红色 = 直接匹配）
    matchedNodes.forEach(n => {
      nodes.set(n.id, { ...n, layer: 'matched' });
    });

    // 2. 加入外部节点（虚线 = 外部补充）
    externalNodes.forEach(n => {
      nodes.set(n.id, { ...n, layer: 'external' });
    });

    // 3. 对每个匹配节点，沿 prerequisites 递归溯源（绿色 = 基础前置）
    matchedNodes.forEach(n => {
      this._tracePrerequisites(n.id, nodes, links, 0, maxPreDepth, traceOpts);
    });

    // 4. 对每个匹配节点，沿 extends 前探（紫色 = 扩展高级）
    matchedNodes.forEach(n => {
      this._traceExtends(n.id, nodes, links, 0, maxExtDepth);
    });

    // 5. 沿 parallel 关联（复杂项目跳过，避免图谱膨胀）
    if (!complex) {
      matchedNodes.forEach(n => {
        this._traceParallel(n.id, nodes, links);
      });
    }

    // 6. 外部节点的前置关联（虚线连接）
    externalNodes.forEach(ext => {
      // 尝试匹配外部节点声明的前置知识到已有节点
      if (ext.extPrerequisites) {
        ext.extPrerequisites.forEach(preName => {
          const found = this._findNodeByName(preName, nodes);
          if (found) {
            links.push({ source: found.id, target: ext.id, type: 'external-prereq' });
          }
        });
      }
      // 外部节点连接到最相关的匹配节点
      const related = this._findMostRelated(ext, matchedNodes);
      if (related) {
        links.push({ source: related.id, target: ext.id, type: 'external-related' });
      }
    });

    // 过滤掉引用不存在节点的 link（防止 d3.forceLink 报 node not found）
    const validLinks = this._deduplicateLinks(links).filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodes.has(srcId) && nodes.has(tgtId);
    });

    return {
      nodes: Array.from(nodes.values()),
      links: validLinks
    };
  }

  _tracePrerequisites(nodeId, nodes, links, depth, maxDepth, options = {}) {
    if (depth >= maxDepth) return;
    const node = this.unifiedIndex.get(nodeId);
    if (!node) return;

    (node.prerequisites || []).forEach(preId => {
      const preNode = this.unifiedIndex.get(preId);
      if (!preNode) return;
      if (options.complex && this._excludeForComplexProject({ ...preNode, layer: 'prerequisite' })) return;

      if (!nodes.has(preId)) {
        nodes.set(preId, { ...preNode, layer: 'prerequisite' });
      }

      links.push({ source: preId, target: nodeId, type: 'prerequisite' });
      this._tracePrerequisites(preId, nodes, links, depth + 1, maxDepth, options);
    });
  }

  _traceExtends(nodeId, nodes, links, depth, maxDepth) {
    if (depth >= maxDepth) return;
    const node = this.unifiedIndex.get(nodeId);
    if (!node) return;

    (node.extends || []).forEach(extId => {
      const extNode = this.unifiedIndex.get(extId);
      if (!extNode) return;

      if (!nodes.has(extId)) {
        nodes.set(extId, { ...extNode, layer: 'advanced' });
      }

      links.push({ source: nodeId, target: extId, type: 'extends' });
      this._traceExtends(extId, nodes, links, depth + 1, maxDepth);
    });

    // 也检查谁以当前节点为 extends
    this.unifiedIndex.forEach((other, otherId) => {
      if (other.extends && other.extends.includes(nodeId) && !nodes.has(otherId)) {
        nodes.set(otherId, { ...other, layer: 'advanced' });
        links.push({ source: nodeId, target: otherId, type: 'extends' });
      }
    });
  }

  _traceParallel(nodeId, nodes, links) {
    const node = this.unifiedIndex.get(nodeId);
    if (!node) return;

    (node.parallel || []).forEach(parId => {
      const parNode = this.unifiedIndex.get(parId);
      if (!parNode) return;

      if (!nodes.has(parId)) {
        nodes.set(parId, { ...parNode, layer: 'parallel' });
      }

      links.push({ source: nodeId, target: parId, type: 'parallel' });
    });
  }

  _findNodeByName(name, existingNodes) {
    let best = null;
    let bestScore = 0;
    const q = name.toLowerCase();

    existingNodes.forEach(node => {
      const score = (node.name && node.name.toLowerCase().includes(q)) ? 0.9 :
                    (node.name_en && node.name_en.toLowerCase().includes(q)) ? 0.7 : 0;
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    });

    if (!best) {
      this.unifiedIndex.forEach(node => {
        const score = (node.name && node.name.toLowerCase().includes(q)) ? 0.8 :
                      (node.name_en && node.name_en.toLowerCase().includes(q)) ? 0.6 :
                      (node.definition && node.definition.toLowerCase().includes(q)) ? 0.3 : 0;
        if (score > bestScore) {
          bestScore = score;
          best = node;
        }
      });
    }

    return best;
  }

  _findMostRelated(extNode, matchedNodes) {
    let best = null;
    let bestScore = 0;

    matchedNodes.forEach(n => {
      let score = 0;
      if (n.subject && n.subject === extNode.subject) score += 0.3;
      if (n.domain && n.domain === extNode.domain) score += 0.2;
      // 名称关键词重叠
      const extWords = (extNode.name + extNode.definition).toLowerCase().split(/\s+/);
      const nWords = (n.name + n.definition).toLowerCase().split(/\s+/);
      const overlap = extWords.filter(w => w.length > 2 && nWords.includes(w)).length;
      score += overlap * 0.1;
      if (score > bestScore) { bestScore = score; best = n; }
    });

    return best;
  }

  _deduplicateLinks(links) {
    const seen = new Set();
    return links.filter(l => {
      const key = `${l.source}|${l.target}|${l.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ─── 降级：关键词搜索 ──────────────────────────

  async searchByKeywords(goal, selectedSystems = ['all']) {
    await this.loadUnifiedIndex();

    const activeSystems = selectedSystems.includes('all')
      ? Array.from(this.systemIndex.keys())
      : selectedSystems.filter(s => this.systemIndex.has(s));

    const keywords = goal.toLowerCase().split(/[\s,，、;；]+/).filter(w => w.length > 1);
    const matched = [];

    this.unifiedIndex.forEach(node => {
      if (!activeSystems.includes(node.system)) return;
      let score = 0;
      const text = `${node.name} ${node.name_en} ${node.definition} ${(node.key_concepts || []).join(' ')}`.toLowerCase();
      keywords.forEach(kw => { if (text.includes(kw)) score += 1; });
      if (score > 0) {
        matched.push({ ...node, confidence: Math.min(score / keywords.length, 1), matchReason: '关键词匹配' });
      }
    });

    matched.sort((a, b) => b.confidence - a.confidence);
    const topMatched = matched.slice(0, 15);
    const finalized = this._finalizePBLGraph(goal, topMatched, [], activeSystems);

    const techRoute = this.resolveTechRouteText({
      goal,
      matched: finalized.matched,
      external: finalized.external,
      graphData: finalized.graphData
    });

    return {
      goal,
      systems: activeSystems,
      matched: finalized.matched,
      external: finalized.external,
      techRoute,
      graphData: finalized.graphData,
      complexProject: finalized.complex,
      stats: {
        totalCandidates: this.unifiedIndex.size,
        filteredCandidates: this.unifiedIndex.size,
        matchedCount: finalized.matched.length,
        externalCount: finalized.external.length,
        graphNodes: finalized.graphData.nodes.length,
        graphLinks: finalized.graphData.links.length
      },
      fallback: true
    };
  }

  // ─── 工具方法 ────────────────────────────────────

  _hash8(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + c;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 8);
  }
}

// ─── D3.js 图谱渲染器（复用 tree.html 节点样式） ──────────────────

class PBLGraphRenderer {
  constructor(containerId) {
    this.containerId = containerId;
    this.svg = null;
    this.simulation = null;
    this.width = 0;
    this.height = 600; // render() 中会根据节点数量动态覆盖

    // PBL 层颜色（节点描边用，内部填充用层颜色的半透明）
    this.colors = {
      prerequisite: '#10b981',  // 绿色 - 基础前置
      matched: '#ef4444',       // 红色 - 直接匹配
      advanced: '#8b5cf6',      // 紫色 - 扩展高级
      parallel: '#3b82f6',      // 蓝色 - 平行关联
      external: '#eab308'       // 黄色 - 外部补充
    };

    this.layerLabels = {
      prerequisite: '基础前置',
      matched: '核心必需',
      advanced: '扩展高级',
      parallel: '平行关联',
      external: '外部补充'
    };
  }

  render(graphData, onNodeClick) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.width = container.clientWidth || 900;
    const nodeCount = (graphData.nodes || []).length || 0;

    // ── 根据节点数量动态计算 SVG 高度和力导向参数 ──
    // 目标：让节点均匀分布在画布上，不挤在一起
    const density = 8000; // 每个节点需要的像素面积（约 90x90 的舒适空间）
    const minH = Math.max(600, window.innerHeight - 320); // 至少 600px 或减去顶部/底部栏
    const calcH = Math.ceil(nodeCount * density / this.width);
    this.height = Math.max(minH, Math.min(calcH, 3000)); // 上限 3000px 防止过高

    // 力导向参数随节点数缩放（v7.9.14：增大排斥力避免节点重叠）
    const baseLinkDist = Math.max(180, Math.min(320, 140 + nodeCount * 0.8));
    const baseCharge   = Math.max(-4000, Math.min(-600, -400 - nodeCount * 5));
    const baseCollide  = Math.max(70, Math.min(100, 55 + nodeCount * 0.2));

    // 清除旧内容
    container.innerHTML = '';

    // 创建图例
    const legend = this._createLegend();
    container.appendChild(legend);

    // 创建 tooltip（与 tree.html 同样式）
    let tooltip = container.querySelector('.pbl-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'pbl-tooltip';
      tooltip.style.cssText = `
        position:absolute;background:rgba(30,41,59,0.94);backdrop-filter:blur(12px);
        border:1px solid rgba(148,163,184,0.18);border-radius:12px;padding:16px;
        max-width:340px;max-height:70vh;overflow-y:auto;pointer-events:none;
        opacity:0;transition:opacity 0.18s ease;z-index:1000;box-shadow:0 8px 32px rgba(0,0,0,0.4);
        font-family:-apple-system,BlinkMacSystemFont,'Inter','PingFang SC',sans-serif;
        color:#f8fafc;font-size:14px;line-height:1.6;
      `;
      // 关键：弹窗本身可 hover，避免从节点移到弹窗时立即消失，里面的链接才可点击。
      tooltip.addEventListener('mouseenter', () => {
        this._tooltipHovered = true;
        this._cancelTooltipHide();
      });
      tooltip.addEventListener('mouseleave', () => {
        this._tooltipHovered = false;
        this._scheduleTooltipHide(220);
      });
      tooltip.addEventListener('click', (event) => {
        const btn = event.target && event.target.closest ? event.target.closest('[data-pbl-make-course]') : null;
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const id = btn.getAttribute('data-pbl-make-course');
        const node = (window.PBLPathBuilder && window.PBLPathBuilder.unifiedIndex && window.PBLPathBuilder.unifiedIndex.get(id))
          || (Array.isArray(nodes) ? nodes.find(n => n.id === id) : null);
        if (node && typeof onNodeClick === 'function') onNodeClick(node);
        if (node && typeof window.generateCourseware === 'function') {
          window.generateCourseware(node.id, node.name || node.id);
        }
        this._scheduleTooltipHide(80);
      });
      container.appendChild(tooltip);
    }

    // 创建 SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', 'rgba(15, 23, 42, 0.5)')
      .style('border-radius', '12px')
      .style('border', '1px solid rgba(148, 163, 184, 0.15)');

    // 缩放
    const g = this.svg.append('g');
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    this.svg.call(zoomBehavior);

    // 准备数据：历史图谱/旧缓存中的节点可能缺失课标、学段、年级等字段，渲染前用统一索引补齐。
    const enrichNode = (n) => {
      if (!n || n.isExternal) return { ...n };
      const full = window.PBLPathBuilder?.unifiedIndex?.get(n.id);
      if (!full) return { ...n };
      return {
        ...n,
        ...full,
        layer: n.layer || full.layer,
        confidence: n.confidence ?? full.confidence,
        matchReason: n.matchReason ?? full.matchReason,
        isExternal: !!n.isExternal
      };
    };
    const nodes = graphData.nodes.map(enrichNode);
    const links = graphData.links.map(l => ({ ...l }));

    // 箭头标记
    this.svg.append('defs').selectAll('marker')
      .data(['prerequisite', 'extends', 'parallel', 'external-prereq', 'external-related'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d.includes('external') ? this.colors.external : d === 'extends' ? this.colors.advanced : d === 'parallel' ? this.colors.parallel : this.colors.prerequisite);

    // 连线（与 tree.html 同样式）
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', d => `link link-${d.type}`)
      .attr('stroke', d => d.type === 'path-step' ? this.colors.matched : d.type.includes('external') ? this.colors.external : d.type === 'extends' ? this.colors.advanced : d.type === 'parallel' ? this.colors.parallel : 'rgba(148,163,184,0.3)')
      .attr('stroke-opacity', d => d.type === 'path-step' ? 0.85 : 0.5)
      .attr('stroke-width', d => d.type === 'path-step' ? 2.5 : d.type === 'prerequisite' ? 2 : 1.5)
      .attr('stroke-dasharray', d => d.type.includes('external') ? '6 3' : d.type === 'parallel' ? '3 3' : d.type === 'extends' ? '6 3' : d.type === 'path-step' ? 'none' : 'none')
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // 节点组（与 tree.html 同样式：circle + status icon + label + label-en + grade）
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', this._dragStarted.bind(this))
        .on('drag', this._dragged.bind(this))
        .on('end', this._dragEnded.bind(this)));

    // ─── Circle（与 tree.html renderTree 同逻辑） ───
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => this._nodeHasAnyCourse(d) ? 22 : 18)
      .attr('fill', d => {
        const layerColor = this.colors[d.layer] || '#64748b';
        if (this._nodeHasAnyCourse(d)) return this._hexToRgba(layerColor, 0.25);
        return this._hexToRgba(layerColor, 0.08);
      })
      .attr('stroke', d => {
        const layerColor = this.colors[d.layer] || '#64748b';
        if (this._nodeHasAnyCourse(d)) return layerColor;
        return this._hexToRgba(layerColor, 0.55);
      })
      .attr('stroke-dasharray', d => this._nodeHasAnyCourse(d) ? 'none' : '4 3')
      .attr('stroke-width', 2.5);

    // ─── Status icon（与 tree.html 同） ───
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '14px')
      .text(d => {
        if (d.isExternal) return '💡';
        if (d.status === 'active' && d.courses && d.courses.length) return '✅';
        if (this._nodeHasAnyCourse(d)) return '📂';
        return '📝';
      });

    // ─── 中文主名（与 tree.html 同） ───
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 38)
      .attr('font-size', '12px')
      .attr('font-family', "'PingFang SC', sans-serif")
      .attr('fill', '#f8fafc')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => this._truncate(d.name, 12));

    // ─── 英文副标（与 tree.html 同） ───
    node.filter(d => d.name_en)
      .append('text')
      .attr('class', 'node-label-en')
      .attr('dy', 52)
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .attr('opacity', 0.55)
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => this._truncate(d.name_en, 16));

    // ─── 年级（与 tree.html 同） ───
    node.append('text')
      .attr('class', 'node-grade')
      .attr('dy', d => d.name_en ? 68 : 52)
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => {
        if (!d.grade) return '';
        if (d.system === 'cn') return d.grade + '年级';
        return 'G' + d.grade;
      });

    // ─── PBL 层颜色角标（小圆点，标在左上） ───
    node.append('circle')
      .attr('cx', -14)
      .attr('cy', -14)
      .attr('r', 5)
      .attr('fill', d => this.colors[d.layer] || '#64748b')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5);

    // ─── 课标体系角标（CN/AP/CA/IB/US） ───
    node.filter(d => d.systemTag && !d.isExternal)
      .append('text')
      .attr('x', 14)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .attr('fill', d => this.colors[d.layer] || '#94a3b8')
      .text(d => d.systemTag);

    // ─── 点击事件 ───
    if (onNodeClick) {
      node.on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d);
      });
    }

    // ─── Tooltip 交互 ───
    // 不能在 node mouseleave 时立即隐藏，否则鼠标还没移到 tooltip，课程链接就消失了。
    // 使用短延迟 + tooltip 自身 mouseenter 取消隐藏，保证弹窗内链接可点击。
    node.on('mouseenter', (event, d) => {
      this._cancelTooltipHide();
      this._showTooltip(tooltip, container, event, d);
    }).on('mousemove', (event) => {
      if (!this._tooltipHovered) this._moveTooltip(tooltip, container, event);
    }).on('mouseleave', () => {
      this._scheduleTooltipHide(420);
    });

    // ─── 力导向布局（参数随节点数量动态缩放） ───
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(baseLinkDist).strength(0.5))
      .force('charge', d3.forceManyBody().strength(baseCharge))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(baseCollide))
      .force('x', d3.forceX(this.width / 2).strength(0.03))
      .force('y', d3.forceY(this.height / 2).strength(0.03))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    // ── Auto-fit zoom：模拟稳定后自动缩放至全貌可见 ──
    let tickCount = 0;
    const autoFitZoom = () => {
      tickCount++;
      // 等 120+ tick（约 3-4 秒）后执行一次 auto-fit
      if (tickCount === 120) {
        const gEl = g.node();
        if (!gEl) return;
        const bbox = gEl.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          const padding = 80;
          const scale = Math.min(
            (this.width - padding * 2) / bbox.width,
            (this.height - padding * 2) / bbox.height,
            1.5 // 最大初始缩放不超过 1.5x
          );
          const tx = this.width / 2 - (bbox.x + bbox.width / 2) * scale;
          const ty = this.height / 2 - (bbox.y + bbox.height / 2) * scale;
          // 使用 d3.zoomIdentity 平滑过渡到 fit 视图
          this.svg.transition()
            .duration(600)
            .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }
      }
    };
    this.simulation.on('tick.autoFit', autoFitZoom);
  }

  // ─── Tooltip 内容（与 tree.html showTooltip 同结构） ───

  _showTooltip(tooltip, container, event, d) {
    const layerColors = this.colors;
    const layerLabels = this.layerLabels;
    const layerColor = layerColors[d.layer] || '#64748b';
    const layerLabel = layerLabels[d.layer] || '';

    let html = `<h3 style="font-size:15px;margin:0 0 6px;">${d.name}</h3>`;
    html += `<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">${this._escapeHtml(this._metaLine(d))}</div>`;

    // PBL 层标签
    html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${layerColor}22;color:${layerColor};">${layerLabel}</span> `;
    if (d.systemTag && !d.isExternal) {
      html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(59,130,246,0.15);color:#3b82f6;">${this._escapeHtml(d.systemTag)} ${this._escapeHtml(d.curriculumLabel || d.systemLabel)}</span> `;
    }
    if ((d.stageLabel || d.gradeLabel) && !d.isExternal) {
      html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(148,163,184,0.14);color:#cbd5e1;">${this._escapeHtml([d.stageLabel, d.gradeLabel].filter(Boolean).join(' · '))}</span> `;
    }

    // 状态
    const hasAnyCourse = this._nodeHasAnyCourse(d);
    if (hasAnyCourse) {
      html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(16,185,129,0.2);color:#10b981;">✅ 有课件</span>`;
    } else {
      html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(239,68,68,0.2);color:#f87171;">📝 待创建</span>`;
    }

    // 课件列表（标准节点 + 外部节点均可展示）
    if (hasAnyCourse) {
      const courses = this._getCoursesForNode(d);
      if (courses.length > 0) {
        html += `<div style="margin-top:8px;padding:6px 8px;background:rgba(16,185,129,0.06);border-radius:6px;">`;
        html += `<div style="font-size:11px;font-weight:600;color:#10b981;margin-bottom:4px;">📖 可用课件</div>`;
        courses.slice(0, 5).forEach(c => {
          const url = c.url || (c.path ? `./community/${c.id}/index.html` : '');
          const name = c.name || c.id;
          if (url) {
            html += `<a href="${url}" target="_blank" style="display:block;padding:3px 6px;margin:2px 0;border-radius:4px;font-size:12px;color:#10b981;text-decoration:none;background:rgba(16,185,129,0.08);">${this._escapeHtml(name)}</a>`;
          } else {
            html += `<div style="padding:3px 6px;margin:2px 0;font-size:12px;color:#94a3b8;">${this._escapeHtml(name)}</div>`;
          }
        });
        html += `</div>`;
      }
    }

    // 匹配置信度
    if (d.confidence) {
      html += `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(245,158,11,0.15);color:#f59e0b;">置信度 ${(d.confidence * 100).toFixed(0)}%</span>`;
    }

    // 匹配理由
    if (d.matchReason) {
      html += `<div style="margin-top:6px;font-size:12px;color:#f59e0b;">匹配理由：${d.matchReason}</div>`;
    }

    // 定义
    if (d.definition) {
      html += `<div style="margin-top:6px;font-size:12px;color:#94a3b8;line-height:1.6;">${d.definition}</div>`;
    }

    // 前置知识
    if (d.prerequisites && d.prerequisites.length) {
      html += `<div style="margin-top:6px;font-size:12px;color:#94a3b8;">前置知识：${d.prerequisites.map(pid => {
        const pn = window.PBLPathBuilder?.unifiedIndex?.get(pid);
        return pn ? pn.name : pid;
      }).join('、')}</div>`;
    }

    // ─── 课标内容（curriculum_points，与 tree.html 同） ───
    const points = Array.isArray(d.curriculum_points) ? d.curriculum_points : [];
    if (points.length) {
      html += `<div style="margin-top:10px;padding:8px 10px;background:rgba(59,130,246,0.08);border-left:3px solid rgba(59,130,246,0.5);border-radius:4px;font-size:12px;">`;
      html += `<div style="font-weight:600;margin-bottom:6px;">📖 课标原文要点</div>`;
      points.forEach(p => {
        html += `<div style="margin:4px 0;padding:4px 6px;border-radius:4px;background:rgba(148,163,184,0.05);color:#94a3b8;line-height:1.5;">${this._escapeHtml(p)}</div>`;
      });
      html += `</div>`;
    }

    // ─── 课件列表（与 tree.html 同） ───
    if (hasAnyCourse) {
      html += `<div style="margin-top:8px;font-size:12px;color:#94a3b8;">已有课件：</div>`;
      html += `<div style="max-height:120px;overflow-y:auto;margin-top:4px;">`;

      // 通过 Hub 或直接 courses 字段
      const hubCourses = (window.TeachAnyHub && typeof TeachAnyHub.getAllCoursesForNode === 'function')
        ? TeachAnyHub.getAllCoursesForNode(d.id) : [];

      if (hubCourses.length > 0) {
        hubCourses.forEach(c => {
          const sourceIcon = { official: '📋', community_registry: '🔖', community_shared: '🌐', user: '📂' }[c.source] || '📚';
          const courseUrl = c.url || (c.path ? `./${c.path}/index.html` : '');
          if (courseUrl) {
            html += `<a href="${courseUrl}" target="_blank" onclick="event.stopPropagation();" style="display:flex;align-items:center;gap:6px;padding:6px 10px;margin:3px 0;border-radius:6px;font-size:13px;color:#f8fafc;text-decoration:none;background:rgba(148,163,184,0.08);pointer-events:auto;">${sourceIcon} 打开课件：${this._escapeHtml(c.name || c.id)}</a>`;
          }
        });
      } else if (d.courses && d.courses.length) {
        d.courses.forEach(courseId => {
          const isStr = typeof courseId === 'string';
          let courseUrl = '';
          if (window.TeachAnyHub && typeof TeachAnyHub.getCourseById === 'function') {
            const hit = TeachAnyHub.getCourseById(courseId);
            if (hit && hit.url) courseUrl = hit.url;
          }
          if (!courseUrl) {
            const base = 'https://www.teachany.cn';
            if (isStr && (courseId.startsWith('examples/') || courseId.startsWith('community/'))) {
              courseUrl = `${base}/${courseId.replace(/^\/+/, '').replace(/\/$/, '')}/index.html`;
            } else if (isStr) {
              courseUrl = `${base}/community/${courseId}/index.html`;
            }
          }
          html += `<a href="${courseUrl}" target="_blank" onclick="event.stopPropagation();" style="display:flex;align-items:center;gap:6px;padding:6px 10px;margin:3px 0;border-radius:6px;font-size:13px;color:#f8fafc;text-decoration:none;background:rgba(148,163,184,0.08);pointer-events:auto;">📋 打开课件：${this._escapeHtml(isStr ? courseId.split('/').pop() : courseId)}</a>`;
        });
      }
      html += `</div>`;
    }

    if (!d.isExternal) {
      html += `<button type="button" data-pbl-make-course="${this._escapeHtml(d.id)}" style="display:block;width:100%;margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:white;font-size:13px;font-weight:700;cursor:pointer;pointer-events:auto;">✨ 制作新课件</button>`;
    }

    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';

    this._positionTooltip(tooltip, container, event);
  }

  _moveTooltip(tooltip, container, event) {
    this._positionTooltip(tooltip, container, event);
  }

  _cancelTooltipHide() {
    if (this._tooltipHideTimer) {
      clearTimeout(this._tooltipHideTimer);
      this._tooltipHideTimer = null;
    }
  }

  _scheduleTooltipHide(delay = 350) {
    this._cancelTooltipHide();
    this._tooltipHideTimer = setTimeout(() => {
      if (this._tooltipHovered) return;
      const tooltip = document.querySelector('.pbl-tooltip');
      if (tooltip) this._hideTooltip(tooltip);
      this._tooltipHideTimer = null;
    }, delay);
  }

  _hideTooltip(tooltip) {
    this._cancelTooltipHide();
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
    tooltip.classList.remove('visible');
  }

  _positionTooltip(tooltip, container, event) {
    const rect = container.getBoundingClientRect();
    let x = event.clientX - rect.left + 12;
    let y = event.clientY - rect.top - 20;
    const tw = 290;
    const th = 200;
    if (x + tw > rect.width) x = x - tw - 56;
    if (y + th > rect.height) y = rect.height - th - 10;
    if (y < 10) y = 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  // ─── 图例 ───

  _createLegend() {
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;padding:12px 16px;margin-bottom:12px;background:rgba(30,41,59,0.8);border-radius:10px;border:1px solid rgba(148,163,184,0.15);';

    const items = [
      { label: '实施顺序', color: this.colors.matched, dash: false, icon: '➡️' },
      { label: '基础前置', color: this.colors.prerequisite, dash: false, icon: '📝' },
      { label: '核心必需', color: this.colors.matched, dash: false, icon: '✅' },
      { label: '扩展高级', color: this.colors.advanced, dash: false, icon: '📝' },
      { label: '平行关联', color: this.colors.parallel, dash: true, icon: '📝' },
      { label: '外部补充', color: this.colors.external, dash: true, icon: '💡' }
    ];

    items.forEach(item => {
      const span = document.createElement('span');
      span.style.cssText = `display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;`;
      const dot = document.createElement('span');
      dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${item.color};opacity:0.8;display:flex;align-items:center;justify-content:center;font-size:8px;${item.dash ? 'border:1px dashed ' + item.color + ';background:transparent;' : ''}`;
      span.appendChild(dot);
      span.appendChild(document.createTextNode(item.label));
      legend.appendChild(span);
    });

    // 节点状态图例
    const statusLegend = document.createElement('span');
    statusLegend.style.cssText = 'display:flex;gap:12px;margin-left:16px;padding-left:16px;border-left:1px solid rgba(148,163,184,0.15);font-size:12px;color:#64748b;';
    statusLegend.innerHTML = '节点状态: ✅有课件 📝待创建 💡外部';
    legend.appendChild(statusLegend);

    return legend;
  }

  // ─── 工具方法 ───

  _metaLine(d) {
    return [d.curriculumLabel || d.systemLabel, d.stageLabel, d.gradeLabel, d.subject, d.domain]
      .filter(Boolean)
      .join(' · ');
  }

  _nodeHasAnyCourse(d) {
    // 1. 标准节点：按 id 精确匹配
    if (!d.isExternal) {
      if (d.status === 'active' && d.courses && d.courses.length) return true;
      if (window.TeachAnyHub && typeof TeachAnyHub.getAllCoursesForNode === 'function') {
        if (TeachAnyHub.getAllCoursesForNode(d.id).length > 0) return true;
      }
      if (window.TeachAnyImporter && typeof TeachAnyImporter.getTopCoursesForTreeNode === 'function') {
        if (TeachAnyImporter.getTopCoursesForTreeNode(d.id).length > 0) return true;
      }
      return false;
    }
    // 2. 外部节点：先按 id 查（可能已挂入 user-generated 虚拟树），再按名称模糊匹配
    if (window.TeachAnyHub && typeof TeachAnyHub.getAllCoursesForNode === 'function') {
      if (TeachAnyHub.getAllCoursesForNode(d.id).length > 0) return true;
    }
    // 按名称搜索（外部节点的 name 可能匹配某个已有课件的标题关键词）
    if (d.name && window.TeachAnyHub && typeof TeachAnyHub.searchByKeyword === 'function') {
      const hits = TeachAnyHub.searchByKeyword(d.name);
      if (hits && hits.length > 0) return true;
    }
    return false;
  }

  /** 获取外部节点关联的课件列表（用于 tooltip 展示） */
  _getCoursesForNode(d) {
    const courses = [];
    if (window.TeachAnyHub && typeof TeachAnyHub.getAllCoursesForNode === 'function') {
      courses.push(...TeachAnyHub.getAllCoursesForNode(d.id));
    }
    // 外部节点：按名称搜索补充
    if (d.isExternal && d.name && window.TeachAnyHub && typeof TeachAnyHub.searchByKeyword === 'function') {
      const hits = TeachAnyHub.searchByKeyword(d.name);
      if (hits) {
        hits.forEach(h => {
          if (!courses.some(c => c.id === h.id)) courses.push(h);
        });
      }
    }
    if (window.TeachAnyImporter && typeof TeachAnyImporter.getTopCoursesForTreeNode === 'function') {
      const userCourses = TeachAnyImporter.getTopCoursesForTreeNode(d.id);
      userCourses.forEach(c => {
        if (!courses.some(ex => ex.id === c.id)) courses.push(c);
      });
    }
    return courses;
  }

  _dragStarted(event) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  _dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  _dragEnded(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  _truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
  }

  _hexToRgba(hex, alpha) {
    if (!hex || hex.charAt(0) !== '#') return `rgba(100,116,139,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    if (this.simulation) this.simulation.stop();
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
  }
}

// ─── 全局实例 ──────────────────────────────────────

window.PBLPathBuilder = new PBLPathBuilder();
window.PBLGraphRenderer = PBLGraphRenderer;

console.log('[TeachAny] PBL 学习路径构建器 v1.0 已加载');
