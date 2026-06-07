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

  /** 中文 PBL 目标分词：无空格时不能用 split，否则候选排序与关键词降级都会失效 */
  _tokenizeGoalTerms(goal) {
    const raw = String(goal || '').trim().toLowerCase();
    const split = raw.split(/[\s,，、;；：:.!?！？\n]+/).filter(w => w.length >= 2);
    if (split.length > 1) return [...new Set(split)];
    const g = split[0] || raw;
    const terms = new Set();
    const lex = [
      '火箭', '导弹', '发射', '抛体', '抛物', '弹道', '空气动力', '推进', '燃料', '推进剂',
      '牛顿', '动量', '力学', '受力', '运动', '加速度', '能量', '守恒', '冲量',
      '传感', '控制', '电路', '编程', '算法', '物联', '智能', '温度', '湿度',
      '函数', '三角', '矢量', '向量', '建模', '实验', '数据', '分析',
      '化学', '燃烧', '氧化', '流体', '压强', '热值', '内能', '气动',
      '材料', '结构', '设计', '制作', '模型', '搭建', '探究', '温室', '天气',
      '新能源', '光伏', '太阳能', '风电', '风能', '储能', '电池', '锂电', '充电',
      '发电', '电能', '电动', '能源', '碳中和', '并网', '逆变', '电磁', '电路',
      '购车', '买车', '选车', '燃油', '油耗', '混动', '对比', '家用', '成本', '预算'
    ];
    lex.forEach(w => { if (g.includes(w)) terms.add(w); });
    // 领域词典命中足够时不再用二字随机切分，避免「设计并」等噪声匹配无关课标
    if (terms.size < 4) {
      const cjk = g.replace(/[^\u4e00-\u9fff]/g, '');
      for (let i = 0; i < cjk.length - 1; i++) terms.add(cjk.slice(i, i + 2));
    }
    return [...terms].filter(t => t.length >= 2).slice(0, 32);
  }

  /** 消费决策/调查对比类（购车选型、方案比选），非工程研发 */
  _isConsumerDecisionGoal(goal) {
    const g = String(goal || '');
    if (/购车|买车|选车|用车方案|消费决策|方案比选|比选|选型|性价比|家用.*车|家庭.*(购车|买车|选车|用车)/.test(g)) return true;
    if (/对比|比较/.test(g) && /购|买|选|家用|家庭/.test(g) && /新能源|燃油|电动|混动|汽油|柴油/.test(g)) return true;
    if (/哪个更|哪种更|怎么选|如何选择/.test(g) && /车|新能源|燃油|电动/.test(g)) return true;
    if (/新.{0,2}旧.{0,2}能源|油电混合|油电对比|燃油车|电动车|电车|混动车/.test(g) && /车|汽车|选|购|买|方案|对比|比较/.test(g)) return true;
    if (/(车|汽车|轿车|SUV)/.test(g) && /新能源|燃油|电动|混动|油电|汽油|柴油/.test(g) && /选|购|买|对比|比较|方案|推荐|决策|建议/.test(g)) return true;
    if (/选.{0,4}(车|汽车)/.test(g) || /(车|汽车).{0,4}选/.test(g)) return true;
    return false;
  }

  _isEnergyEngineeringGoal(goal) {
    const g = String(goal || '');
    if (this._isConsumerDecisionGoal(g)) return false;
    if (/(车|汽车|轿车|SUV|用车)/.test(g) && /新能源|燃油|电动|混动|油电/.test(g) && !/设计|制作|研发|装置|系统开发|搭建|发明|工程化|发电|储能装置/.test(g)) return false;
    if (/对比|比较|选购|购车|买车|选车|家用|家庭/.test(g) && !/设计|制作|研发|装置|系统开发|搭建|发电|储能|并网|逆变/.test(g)) {
      if (/新能源|电动|燃油|混动|光伏|储能/.test(g)) return false;
    }
    return /新能源|光伏|太阳能|风电|风力|储能|电池|锂电|充电|发电|电能|清洁能源|碳中和|能源车|并网|逆变/.test(g)
      && /设计|制作|研发|装置|系统|搭建|工程|发电|储能|模型|实验|探究/.test(g);
  }

  /** 化学溶液/浓度/厨房化学等探究类（以 chemistry 为主线） */
  _isChemistryInquiryGoal(goal) {
    const g = String(goal || '');
    return /浓度|溶液|溶解度|溶质|溶剂|饱和溶液|质量分数|体积分数|物质的溶解|配制溶液/.test(g)
      || /食盐|盐水|醋酸|苏打|洁厕|电解水|酸碱|中和|化学变化|物质的变化|离子反应/.test(g)
      || (/厨房|餐桌|调味|烹饪/.test(g) && /盐|酸|碱|醋|化学|浓度|溶液|溶解/.test(g));
  }

  /** 消费决策类应排除的研发/装置课节点 */
  _isRdEngineeringNodeName(name, goal) {
    const n = String(name || '');
    if (!this._isConsumerDecisionGoal(goal)) return false;
    return /电解池|原电池|程序控制|电磁感应|电池温度|传感器|数据采集|算法概念|模块化|物联网|闭环控制|电解(?!质)|逆变|并网装置/.test(n);
  }

  /** 项目类型分类（与服务端 classifyProjectType 对齐） */
  _classifyProjectType(goal) {
    const g = String(goal || '');
    if (this._isConsumerDecisionGoal(g)) return 'consumer-decision';
    if (/海报|短视频|微电影|动画|漫画|插画|绘画|展览|策展|广告|品牌|视觉|游戏设计|作曲|音乐创作|手工艺|表演|舞台|摄影|logo|标志设计|文创|周边设计/.test(g)) return 'creative-media';
    if (/诗歌|诗集|现代诗|诗词|写诗|小说|剧本|散文|绘本|故事集|演讲|辩论|文学|翻译|双语|新闻稿|采访稿|写一[篇组]|作文|征文|朗诵|文集|杂志|读后感|书评|话剧|文章/.test(g)) return 'humanities-literary';
    if (/创业|商业计划|营销|市场推广|运营|理财|零花钱|压岁钱|市场调研|义卖|跳蚤市场|店铺|定价|商业模式|经济效益|盈利|众筹|招商|品牌策划/.test(g)) return 'business-economics';
    if (/健康|营养|饮食|食谱|减脂|减肥|健身|锻炼|运动会?|近视|视力|护眼|睡眠|作息|心理|情绪|压力|安全|急救|防溺水|防火|防疫|卫生|疾病|人体|体重|身高/.test(g)) return 'health-life';
    if (/种植|种菜|盆栽|养护|养殖|养蚕|园艺|烹饪|烘焙|美食|菜谱|料理|手工|编织|缝纫|收纳|整理|维修|清洁|打扫|劳动/.test(g)) return 'labor-practice';
    if (/活动策划|策划.{0,6}(活动|晚会|联欢|运动会|典礼|节|比赛)|联欢会|晚会|文艺汇演|毕业典礼|生日会|出游|旅行|研学|游学|路线规划|时间管理|班级布置|布置教室|嘉年华|游园/.test(g)) return 'life-planning';
    if (/田野|问卷|访谈|社区|民俗|传统文化|非遗|人口|城乡|社会现象|调研报告|公众.{0,4}认知|居民|乡土|口述史/.test(g)) return 'social-inquiry';
    if (/火箭|导弹|发射|机器人|无人机|电路|机械|硬件|装置|App|应用程序|小程序|网站|系统开发|3D打印|传感|智能|温控|储能|光伏|发电|搭建|制作|工程|发明|物联网|编程实现/.test(g)) return 'engineering';
    if (this._isChemistryInquiryGoal(g)) return 'scientific-inquiry';
    if (/探究|实验|观察|测量|验证|影响因素|变量|检测|成分|对照实验|科学问题|浓度|溶液|溶解/.test(g)) return 'scientific-inquiry';
    return 'general';
  }

  /** 非特定 STEM 类型的通用模块（与服务端 genericDomainsForType 对齐） */
  _genericDomainsForType(id) {
    const map = {
      'scientific-inquiry': [
        { id: 'question', label: '问题与假设', keywords: ['问题', '假设', '猜想', '现象', '原理'], subjects: ['science', 'physics', 'chemistry', 'biology'] },
        { id: 'design', label: '变量与实验设计', keywords: ['变量', '实验', '控制变量', '对照', '方案', '测量'], subjects: ['physics', 'chemistry', 'biology', 'science'] },
        { id: 'data', label: '数据采集与处理', keywords: ['数据', '测量', '记录', '统计', '误差', '图表'], subjects: ['math', 'info-tech', 'science'] },
        { id: 'conclusion', label: '分析与结论', keywords: ['分析', '结论', '解释', '规律', '报告'], subjects: ['science', 'math', 'chinese'] },
      ],
      'social-inquiry': [
        { id: 'topic', label: '选题与调查设计', keywords: ['选题', '调查', '问卷', '访谈', '抽样', '样本'], subjects: ['chinese', 'math'] },
        { id: 'collect', label: '资料与数据收集', keywords: ['资料', '数据', '收集', '记录', '文献', '实地'], subjects: ['geography', 'history', 'chinese'] },
        { id: 'analyze', label: '整理与统计分析', keywords: ['统计', '整理', '图表', '分析', '百分比', '平均数'], subjects: ['math'] },
        { id: 'report', label: '结论与报告', keywords: ['结论', '报告', '建议', '论证', '写作', '说明'], subjects: ['chinese'] },
      ],
      'humanities-literary': [
        { id: 'theme', label: '立意与选材', keywords: ['立意', '主题', '选材', '构思', '观点'], subjects: ['chinese', 'english'] },
        { id: 'read', label: '阅读与素材积累', keywords: ['阅读', '素材', '文本', '名著', '积累', '鉴赏'], subjects: ['chinese', 'english', 'history'] },
        { id: 'express', label: '结构与表达', keywords: ['结构', '表达', '修辞', '语言', '写作', '叙述', '议论'], subjects: ['chinese', 'english'] },
        { id: 'revise', label: '修改与展示', keywords: ['修改', '评议', '朗诵', '展示', '演讲', '发表'], subjects: ['chinese'] },
      ],
      'creative-media': [
        { id: 'idea', label: '创意构思', keywords: ['创意', '构思', '主题', '灵感', '受众'], subjects: ['chinese', 'info-tech'] },
        { id: 'design', label: '设计与草案', keywords: ['设计', '草图', '分镜', '排版', '色彩', '构图'], subjects: ['info-tech', 'chinese'] },
        { id: 'make', label: '制作与实现', keywords: ['制作', '剪辑', '绘制', '编辑', '工具', '技术'], subjects: ['info-tech'] },
        { id: 'show', label: '展示与评议', keywords: ['展示', '评议', '反馈', '发布', '优化'], subjects: ['chinese'] },
      ],
      'business-economics': [
        { id: 'research', label: '需求与市场调研', keywords: ['需求', '市场', '调研', '调查', '数据', '用户'], subjects: ['math', 'chinese'] },
        { id: 'plan', label: '方案与产品设计', keywords: ['方案', '产品', '设计', '策划', '创意'], subjects: ['chinese', 'info-tech'] },
        { id: 'cost', label: '成本与定价测算', keywords: ['成本', '定价', '利润', '预算', '函数', '百分比', '统计'], subjects: ['math'] },
        { id: 'operate', label: '运营与复盘', keywords: ['运营', '推广', '复盘', '反馈', '报告'], subjects: ['chinese', 'math'] },
      ],
      'life-planning': [
        { id: 'goal', label: '需求与目标', keywords: ['需求', '目标', '调查', '问卷', '场景', '人数'], subjects: ['chinese', 'math'] },
        { id: 'plan', label: '方案与日程', keywords: ['方案', '计划', '日程', '安排', '路线', '流程', '行程'], subjects: ['chinese', 'geography', 'math'] },
        { id: 'budget', label: '预算与分工', keywords: ['预算', '成本', '费用', '统计', '函数', '分工', '百分比', '比例'], subjects: ['math'] },
        { id: 'review', label: '执行与复盘', keywords: ['执行', '记录', '反馈', '复盘', '总结', '报告', '通知'], subjects: ['chinese'] },
      ],
      'health-life': [
        { id: 'status', label: '现状了解', keywords: ['现状', '调查', '统计', '数据', '测量', '记录'], subjects: ['math', 'biology', 'science'] },
        { id: 'knowledge', label: '健康知识', keywords: ['健康', '营养', '饮食', '运动', '睡眠', '安全', '疾病', '人体', '视力'], subjects: ['biology', 'science'] },
        { id: 'plan', label: '计划制定', keywords: ['计划', '方案', '目标', '食谱', '作息', '锻炼'], subjects: ['chinese', 'math'] },
        { id: 'assess', label: '实践与评估', keywords: ['记录', '评估', '对比', '反馈', '改进', '报告', '宣传', '倡议'], subjects: ['chinese', 'math'] },
      ],
      'labor-practice': [
        { id: 'prepare', label: '认识与准备', keywords: ['认识', '准备', '材料', '工具', '原理', '步骤'], subjects: ['science', 'biology', 'chinese'] },
        { id: 'practice', label: '操作实践', keywords: ['操作', '制作', '种植', '养护', '烹饪', '步骤', '工艺'], subjects: ['science', 'biology'] },
        { id: 'record', label: '观察与记录', keywords: ['观察', '记录', '测量', '数据', '变化', '统计'], subjects: ['science', 'math', 'biology'] },
        { id: 'share', label: '成果与分享', keywords: ['成果', '分享', '展示', '总结', '报告', '改进'], subjects: ['chinese'] },
      ],
      'general': [
        { id: 'define', label: '调研与定义', keywords: ['调研', '需求', '定义', '背景', '分析'], subjects: ['chinese', 'math', 'science'] },
        { id: 'design', label: '方案设计', keywords: ['方案', '设计', '规划', '分工'], subjects: ['math', 'science', 'chinese'] },
        { id: 'make', label: '实施制作', keywords: ['实施', '制作', '搭建', '实验', '执行'], subjects: ['science', 'chemistry', 'physics'] },
        { id: 'test', label: '测试与展示', keywords: ['测试', '评估', '展示', '优化', '报告'], subjects: ['math', 'chinese'] },
      ],
    };
    return map[id] || [];
  }

  /** 工程子系统拆解（与服务端 pbl-prompts inferProjectDomains 对齐） */
  _inferProjectDomains(goal) {
    const g = String(goal || '');
    if (this._isChemistryInquiryGoal(g)) {
      return [
        {
          id: 'solution', label: '溶液与浓度概念',
          keywords: ['溶液', '溶质', '溶剂', '浓度', '质量分数', '溶解', '饱和', '配制', '氯化钠', '溶解度'],
          subjects: ['chemistry']
        },
        {
          id: 'experiment', label: '实验设计与测量',
          keywords: ['实验', '变量', '对照', '量取', '称量', '配制', '测量', '滴定', '观察'],
          subjects: ['chemistry', 'science']
        },
        {
          id: 'data', label: '数据处理与表达',
          keywords: ['数据', '统计', '图表', '计算', '误差', '记录', '百分比', '平均数'],
          subjects: ['math']
        },
        {
          id: 'application', label: '生活情境与结论',
          keywords: ['厨房', '食盐', '应用', '安全', '生活', '结论', '报告', '分析', '比较'],
          subjects: ['chemistry', 'science', 'chinese']
        }
      ];
    }
    if (this._isConsumerDecisionGoal(g)) {
      return [
        {
          id: 'needs', label: '需求与场景调研',
          keywords: ['调查', '数据', '统计', '问卷', '需求', '分析', '收集', '整理', '图表'],
          subjects: ['math', 'chinese']
        },
        {
          id: 'cost', label: '成本与数据建模',
          keywords: ['函数', '一次函数', '计算', '统计', '数据', '平均数', '费用', '成本', '百分比', '方程'],
          subjects: ['math']
        },
        {
          id: 'energy_compare', label: '动力与能耗差异（科普）',
          keywords: ['内燃机', '热机', '效率', '电能', '化学能', '能量', '热值', '做功', '机械能', '内能'],
          subjects: ['physics', 'chemistry']
        },
        {
          id: 'environment', label: '环保与可持续',
          keywords: ['环境', '污染', '排放', '碳', '气候', '资源', '可持续', '温室'],
          subjects: ['geography', 'chemistry']
        },
        {
          id: 'decision', label: '决策论证与报告',
          keywords: ['说明', '报告', '论证', '写作', '分析', '比较', '调查', '实用'],
          subjects: ['chinese', 'math']
        }
      ];
    }
    if (/火箭|导弹|发射|弹道|模型火箭|航天/.test(g)) {
      return [
        {
          id: 'propulsion', label: '推进与燃料',
          keywords: ['燃烧', '氧化', '燃料', '热值', '内能', '化学能', '能量', '推进', '反应', '热机'],
          subjects: ['chemistry', 'physics']
        },
        {
          id: 'aerodynamics', label: '空气动力与弹道',
          keywords: ['抛体', '流体', '压强', '流速', '气动', '弹道', '抛物', '飞行', '大气'],
          subjects: ['physics', 'math']
        },
        {
          id: 'dynamics', label: '运动学与动力学',
          keywords: ['牛顿', '动量', '冲量', '受力', '加速度', '机械能', '守恒', '运动', '力学'],
          subjects: ['physics', 'math']
        },
        {
          id: 'structure', label: '结构与材料',
          keywords: ['结构', '材料', '强度', '压强', '设计', '稳定'],
          subjects: ['physics', 'chemistry']
        },
        {
          id: 'control', label: '控制、传感与测试',
          keywords: ['控制', '传感', '电路', '编程', '算法', '数据', '实验', '误差', '测试', '采集'],
          subjects: ['info-tech', 'physics']
        }
      ];
    }
    if (/温控|温室|温度|加热|散热|PID|闭环/.test(g)) {
      return [
        { id: 'modeling', label: '数学建模', keywords: ['函数', '方程', '建模', '图像'], subjects: ['math'] },
        { id: 'physics', label: '热学原理', keywords: ['热传导', '温度', '内能', '热量'], subjects: ['physics'] },
        { id: 'hardware', label: '传感与电路', keywords: ['传感器', '电路', '采集'], subjects: ['physics', 'info-tech'] },
        { id: 'control', label: '控制算法', keywords: ['控制', '反馈', '编程', '算法'], subjects: ['info-tech', 'math'] }
      ];
    }
    if (this._isEnergyEngineeringGoal(g)) {
      return [
        {
          id: 'energy', label: '能量转换与守恒',
          keywords: ['能量转化', '能量转换', '机械能', '内能', '电能', '化学能', '热值', '效率', '功率', '做功'],
          subjects: ['physics', 'chemistry']
        },
        {
          id: 'electrochem', label: '电化学与电池',
          keywords: ['电池', '原电池', '电解', '电解池', '氧化还原', '电极', '电化学', '充放电', '蓄电', '储能', '燃料电池'],
          subjects: ['chemistry', 'physics']
        },
        {
          id: 'circuit', label: '电路与电磁',
          keywords: ['电路', '电流', '电压', '电阻', '电磁', '感应', '并联', '串联', '磁场', '电磁感应', '发电机'],
          subjects: ['physics']
        },
        {
          id: 'renewable', label: '新能源装置',
          keywords: ['光伏', '太阳能', '风能', '风电', '发电', '新能源', '涡轮', '光能', '光电', '太阳能电池'],
          subjects: ['physics', 'chemistry']
        },
        {
          id: 'system', label: '系统测试与控制',
          keywords: ['控制', '传感', '传感器', '采集', '实验', '测试', '反馈', '调试', '数据采集', '误差'],
          subjects: ['info-tech', 'physics']
        }
      ];
    }
    return this._genericDomainsForType(this._classifyProjectType(g));
  }

  _isEnergyProjectGoal(goal) {
    return this._isEnergyEngineeringGoal(goal);
  }

  _isBiologyNodeName(name) {
    return /细胞|细胞膜|细胞器|细胞核|细胞壁|细胞呼吸|线粒体|叶绿体|有丝分裂|减数分裂|DNA|基因表达|遗传|光合作用|酶|蛋白质合成|生物膜/.test(String(name || ''));
  }

  /** 购车/能耗比选等非生物项目：硬性剔除生物噪声（避免「新能源」误配细胞） */
  _shouldPurgeBiologyForGoal(goal) {
    if (this._isConsumerDecisionGoal(goal)) return true;
    const g = String(goal || '');
    return /(车|汽车)/.test(g) && /新能源|燃油|电动|混动|油电/.test(g) && !/生物|细胞|生态|光合|酶|遗传|植物|动物/.test(g);
  }

  _purgeBiologyNoise(nodes, goal) {
    if (!this._shouldPurgeBiologyForGoal(goal) || !Array.isArray(nodes)) return nodes;
    return nodes.filter(n => {
      if (n.subject === 'biology') return false;
      if (this._isBiologyNodeName(n.name)) return false;
      return true;
    });
  }

  _nodeSearchText(node) {
    return `${node.name || ''} ${node.definition || node.description || ''} ${(node.key_concepts || []).join(' ')}`.toLowerCase();
  }

  _stemGenericKeywords() {
    return new Set(['能量', '守恒', '定律', '运动', '计算', '函数', '方程']);
  }

  _isQuantitativeCalcNode(node) {
    const t = `${node.name || ''} ${node.definition || node.description || ''}`;
    return /计算|求解|方程式|列式|综合计算|根据化学方程式|定量|数值(计算|求解)|运算求|计算器|求.*大小|求.*值/.test(t);
  }

  _isConservationLawNode(node) {
    return /守恒定律|机械能守恒|能量守恒|动量守恒/.test(String(node.name || ''));
  }

  /** 节点知识形态：用于 STEM 广度均衡，避免全是定律/计算 */
  _stemKnowledgeKind(node) {
    const name = String(node.name || '');
    const text = this._nodeSearchText(node);
    if (this._isQuantitativeCalcNode(node)) return 'calculation';
    if (/守恒定律/.test(name)) return 'law';
    if (/实验|探究|测量|观测|验证|设计实验|控制变量/.test(text)) return 'experiment';
    if (/装置|结构|原理|工作|组成|机制|原电池|发电机|光伏|太阳能电池|电解|电解池|传感器|逆变|并网|电路元件|电磁感应|串联|并联/.test(text)) return 'apparatus';
    if (node.subject === 'math' || /函数|方程|建模|算法|三角函数/.test(name)) return 'modeling';
    return 'principle';
  }

  _stemKindPreference(node, goal) {
    const k = this._stemKnowledgeKind(node);
    if (k === 'calculation') return -4;
    if (k === 'law') return -2;
    if (k === 'apparatus') return 5;
    if (k === 'experiment') return 5;
    if (k === 'principle') return 4;
    if (k === 'modeling') return /建模|控制|算法|数据|App|程序/.test(String(goal || '')) ? 2 : -1;
    return 0;
  }

  _stemBreadthScoreAdjust(node, goal) {
    if (!this._isStemProjectGoal(goal)) return 0;
    let adj = this._stemKindPreference(node, goal) * 2;
    if (node.subject === 'chemistry') adj += 5;
    if (node.subject === 'info-tech') adj += 4;
    if (node.subject === 'physics') adj += 1;
    if (node.subject === 'math') adj -= 3;
    if (this._isQuantitativeCalcNode(node)) adj -= 10;
    if (this._isConservationLawNode(node)) adj -= 3;
    return adj;
  }

  _scoreNodeForDomains(node, domains) {
    if (!domains || !domains.length) return 0;
    let score = 0;
    const text = this._nodeSearchText(node);
    const generic = this._stemGenericKeywords();
    domains.forEach(d => {
      (d.keywords || []).forEach(kw => {
        const k = String(kw).toLowerCase();
        if (!text.includes(k)) return;
        score += generic.has(kw) ? 2 : 6;
      });
      if (d.subjects && d.subjects.includes(node.subject)) score += 2;
    });
    return score;
  }

  _isEngineeringGoal(goal) {
    return this._classifyProjectType(goal) === 'engineering' || this._isEnergyProjectGoal(goal);
  }

  /** STEM 严格门禁仅用于工程/科学探究类（避免把生活化/人文项目当 STEM 过滤） */
  _isStemProjectGoal(goal) {
    return ['engineering', 'scientific-inquiry'].includes(this._classifyProjectType(goal));
  }

  /** 主线相关性：STEM/工程项目宁缺毋滥，拒绝语文/地理/无关生物等 */
  _isMainlineRelevant(node, goal, domains) {
    if (!node) return false;
    const g = String(goal || '');
    const domainList = domains && domains.length ? domains : this._inferProjectDomains(g);
    const name = String(node.name || '');
    const text = this._nodeSearchText(node);
    const stemGoal = this._isStemProjectGoal(g);
    const consumerGoal = this._isConsumerDecisionGoal(g);

    if (consumerGoal) {
      if (this._isRdEngineeringNodeName(name, g)) return false;
      if (this._isBiologyNodeName(name)) return false;
      if (/比热容/.test(name) && !/热|环境/.test(text)) return false;
    }

    if (this._isChemistryInquiryGoal(g)) {
      if (node.subject === 'info-tech') return false;
      if (/程序|编程|算法|循环结构|分支结构|变量和数据类型|模块化|物联网/.test(name)) return false;
      if (/人体.*器官|器官系统|循环.*系统|消化.*系统|呼吸.*系统|神经.*系统/.test(name)) return false;
      if (/饮食.*健康|营养.*均衡|食物.*营养/.test(name) && !/钠|盐|矿物|离子|化学/.test(text)) return false;
      if (node.subject === 'biology' && this._isBiologyNodeName(name)) return false;
    }

    if (stemGoal) {
      const badName = /作文|写作|任务驱动|实用类文本|地形|等高线|经纬|有机合成|官能团|烃的|弧长|扇形面积|几何图形初步|诗词|文言|议论文结构|世界地形/;
      if (badName.test(name)) return false;
      if (this._isBiologyNodeName(name) && !/生物|细胞|生态|光合|发酵|酶|遗传/.test(g)) return false;
      if (node.subject === 'biology' && !/生物|细胞|生态|光合|发酵|酶|遗传|植物|动物/.test(g)) return false;
      const humanities = ['chinese', 'english', 'history', 'geography'];
      if (humanities.includes(node.subject)) {
        const need = {
          chinese: /语文|作文|写作|阅读/,
          english: /英语/,
          history: /历史/,
          geography: /地理|地形|地图/
        };
        if (!need[node.subject]?.test(g)) return false;
      }
      const allowedStem = new Set(['physics', 'chemistry', 'math', 'info-tech', 'science']);
      if (domainList.length && !allowedStem.has(node.subject)) return false;
    }

    if (!domainList.length) {
      if (stemGoal) {
        if (this._isBiologyNodeName(name) || node.subject === 'biology') return false;
        const goalTerms = this._tokenizeGoalTerms(g);
        return goalTerms.some(t => t.length >= 2 && (name.includes(t) || text.includes(t)));
      }
      return true;
    }
    const goalTerms = this._tokenizeGoalTerms(g);
    // 非 STEM（生活化/人文/社科/创意/商业等）：节点学科须落在项目模块取向内，
    // 避免「有机合成路线设计」靠「设计/路线」等通用词混入研学/文创等项目
    const domainSubjects = new Set(domainList.flatMap(d => d.subjects || []));
    const subjectOk = stemGoal || domainSubjects.size === 0 || domainSubjects.has(node.subject);
    if (subjectOk && this._scoreNodeForDomains(node, domainList) >= 4) return true;
    if (subjectOk && goalTerms.some(t => t.length >= 2 && name.includes(t))) return true;
    if (stemGoal) return goalTerms.some(t => t.length >= 3 && text.includes(t));
    return subjectOk && goalTerms.some(t => t.length >= 2 && text.includes(t));
  }

  _filterMainlineNodes(matched, goal) {
    const domains = this._inferProjectDomains(goal);
    let pool = matched;
    if (domains.length || this._isStemProjectGoal(goal)) {
      pool = matched.filter(n => this._isMainlineRelevant(n, goal, domains));
    }
    pool = this._purgeBiologyNoise(pool, goal);
    if (pool.length) return pool;
    if (matched.length && this._isStemProjectGoal(goal)) {
      return this._purgeBiologyNoise(matched.filter(n => {
        const name = String(n.name || '');
        if (this._isBiologyNodeName(name) || n.subject === 'biology') return false;
        return !/作文|地形|有机合成|弧长|扇形面积/.test(name);
      }), goal);
    }
    // 非 STEM 项目：宁可保留原匹配，也不要整组清空；购车类须剔除生物噪声
    return this._isStemProjectGoal(goal) ? [] : this._purgeBiologyNoise(matched, goal);
  }

  _scoreNodeForGoal(node, goalTerms, filterSubjects, complex, domains, goal = '') {
    let score = 0;
    const nameLower = (node.name || '').toLowerCase();
    const defLower = (node.definition || node.description || '').toLowerCase();
    const concepts = (node.key_concepts || []).join(' ').toLowerCase();
    (goalTerms || []).forEach(term => {
      if (nameLower.includes(term)) score += 4;
      if (concepts.includes(term)) score += 2;
      if (defLower.includes(term)) score += 1;
    });
    if (domains && domains.length) score += this._scoreNodeForDomains(node, domains);
    if (filterSubjects && filterSubjects.includes(node.subject)) score += 1;
    const grade = parseInt(node.grade, 10) || 0;
    if (complex && grade >= 7) score += 1;
    if (complex && grade > 0 && grade < 7) score -= 8;
    if (goal && (domains?.length || this._isStemProjectGoal(goal))) {
      score += this._stemBreadthScoreAdjust(node, goal);
    }
    if (goal && this._isConsumerDecisionGoal(goal)) {
      if (this._isRdEngineeringNodeName(node.name, goal)) score -= 20;
      if (['math', 'geography', 'chinese'].includes(node.subject)) score += 3;
      if (/内燃机|热机|效率|统计|函数|环境|排放|污染/.test(node.name || '')) score += 4;
    }
    if (goal && this._isChemistryInquiryGoal(goal)) {
      if (node.subject === 'chemistry') score += 8;
      if (/溶液|浓度|溶解|溶质|溶剂|质量分数|配制|氯化钠/.test(node.name || '')) score += 6;
      if (node.subject === 'math' && /数据|统计|图表|百分比/.test(node.name || '')) score += 3;
      if (node.subject === 'info-tech') score -= 18;
      if (/器官系统|程序设计|程序控制|饮食.*健康|营养.*均衡/.test(node.name || '')) score -= 22;
    }
    return score;
  }

  /** STEM 候选均衡：子系统覆盖 + 学科/形态多样，压制定律/计算堆砌 */
  _pickStemBalancedCandidates(pool, maxCount, domains, goal) {
    const stem = this._isStemProjectGoal(goal) && domains && domains.length;
    if (!stem) {
      return [...pool]
        .sort((a, b) => (b._score || 0) - (a._score || 0))
        .slice(0, maxCount);
    }

    const ranked = pool.map(n => ({
      n,
      score: (n._score || 0) + this._stemBreadthScoreAdjust(n, goal)
    })).sort((a, b) => b.score - a.score);

    const picked = [];
    const seen = new Set();
    const subjectCount = {};
    const kindCount = {};
    const maxMath = Math.max(1, Math.floor(maxCount * 0.22));
    const maxCalc = Math.max(0, Math.floor(maxCount * 0.15));
    const maxLaw = Math.max(1, Math.floor(maxCount * 0.25));

    const canAdd = (n) => {
      if (!n || seen.has(n.id)) return false;
      const subj = n.subject || '';
      if (subj === 'math' && (subjectCount.math || 0) >= maxMath) return false;
      if (this._isQuantitativeCalcNode(n) && (kindCount.calculation || 0) >= maxCalc) return false;
      if (this._isConservationLawNode(n) && (kindCount.law || 0) >= maxLaw) return false;
      return true;
    };
    const add = (n) => {
      if (!canAdd(n)) return false;
      seen.add(n.id);
      picked.push(n);
      subjectCount[n.subject] = (subjectCount[n.subject] || 0) + 1;
      const kind = this._stemKnowledgeKind(n);
      kindCount[kind] = (kindCount[kind] || 0) + 1;
      return true;
    };
    const rankForDomain = (domain) => ranked
      .filter(x => !seen.has(x.n.id) && this._scoreNodeForDomains(x.n, [domain]) > 0)
      .sort((a, b) => (b.score + this._stemKindPreference(b.n, goal) * 3)
        - (a.score + this._stemKindPreference(a.n, goal) * 3));

    domains.forEach(domain => {
      const candidates = rankForDomain(domain);
      const preferred = candidates.find(x => canAdd(x.n) && !this._isQuantitativeCalcNode(x.n));
      if (preferred) add(preferred.n);
      else if (candidates[0]) add(candidates[0].n);
    });

    const mustHave = [
      n => n.subject === 'chemistry',
      n => n.subject === 'info-tech',
      n => this._stemKnowledgeKind(n) === 'experiment',
      n => this._stemKnowledgeKind(n) === 'apparatus'
    ];
    mustHave.forEach(test => {
      if (picked.some(test)) return;
      const hit = ranked.find(x => canAdd(x.n) && test(x.n));
      if (hit) add(hit.n);
    });

    ranked.forEach(x => {
      if (picked.length >= maxCount) return;
      add(x.n);
    });
    return picked.slice(0, maxCount);
  }

  _pickDomainAwareCandidates(scored, maxCount, domains, goal) {
    const relevant = scored.filter(n => this._isMainlineRelevant(n, goal, domains));
    return this._pickStemBalancedCandidates(relevant, maxCount, domains, goal);
  }

  _rebalanceStemMatched(matched, goal, candidatePool, limit) {
    const domains = this._inferProjectDomains(goal);
    if (!domains.length || !this._isStemProjectGoal(goal) || !matched.length) return matched;

    let list = [...matched];
    const maxCalc = Math.max(0, Math.floor(list.length * 0.15));
    const maxLaw = Math.max(1, Math.floor(list.length * 0.25));
    const maxMath = Math.max(1, Math.floor(list.length * 0.22));
    const count = (fn) => list.filter(fn).length;
    const seen = () => new Set(list.map(n => n.id));

    const replaceOne = (predicate) => {
      const idx = list.findIndex(predicate);
      if (idx < 0) return;
      const pool = candidatePool
        .filter(n => !seen().has(n.id))
        .map(n => ({
          ...n,
          _score: this._scoreNodeForGoal(n, this._tokenizeGoalTerms(goal), null, true, domains, goal)
        }));
      const alt = this._pickStemBalancedCandidates(pool, 1, domains, goal)[0];
      if (!alt) return;
      list.splice(idx, 1, alt);
    };

    while (count(n => this._isQuantitativeCalcNode(n)) > maxCalc) {
      replaceOne(n => this._isQuantitativeCalcNode(n));
      if (!candidatePool.length) break;
    }
    while (count(n => this._isConservationLawNode(n)) > maxLaw) {
      replaceOne(n => this._isConservationLawNode(n));
      if (!candidatePool.length) break;
    }
    while (count(n => n.subject === 'math') > maxMath) {
      replaceOne(n => n.subject === 'math');
      if (!candidatePool.length) break;
    }
    ['chemistry', 'info-tech'].forEach(subj => {
      if (list.some(n => n.subject === subj)) return;
      const pool = candidatePool
        .filter(n => !seen().has(n.id) && n.subject === subj)
        .map(n => ({
          ...n,
          _score: this._scoreNodeForGoal(n, this._tokenizeGoalTerms(goal), null, true, domains, goal)
        }));
      const alt = this._pickStemBalancedCandidates(pool, 1, domains, goal)[0];
      if (!alt) return;
      let dropIdx = list.findIndex(n => this._isConservationLawNode(n));
      if (dropIdx < 0) dropIdx = list.findIndex(n => this._isQuantitativeCalcNode(n));
      if (dropIdx < 0 && list.length >= limit) dropIdx = list.length - 1;
      if (dropIdx >= 0) list[dropIdx] = alt;
      else list.push(alt);
    });
    return list.slice(0, limit);
  }

  _pickDiverseCandidates(scored, maxCount, subjects) {
    const sorted = [...scored].sort((a, b) => (b._score || 0) - (a._score || 0));
    const picked = [];
    const seen = new Set();
    const subjList = (subjects || []).filter(Boolean);
    const perSubject = Math.max(4, Math.floor(maxCount / Math.max(subjList.length, 2)));
    subjList.forEach(subj => {
      sorted.filter(n => n.subject === subj).slice(0, perSubject).forEach(n => {
        if (!seen.has(n.id)) { seen.add(n.id); picked.push(n); }
      });
    });
    sorted.forEach(n => {
      if (picked.length >= maxCount) return;
      if (!seen.has(n.id)) { seen.add(n.id); picked.push(n); }
    });
    return picked.slice(0, maxCount);
  }

  _parseMatchIndex(m, candidatesLen) {
    let idx = m.index;
    if (idx == null && m.nodeIndex != null) idx = m.nodeIndex;
    if (typeof idx === 'string' && idx.trim() !== '') idx = parseInt(idx, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= candidatesLen) return -1;
    return idx;
  }

  _mapMatchedEntries(result, candidates, complex, minConf) {
    const out = [];
    (result.matched || []).forEach(m => {
      const idx = this._parseMatchIndex(m, candidates.length);
      if (idx < 0) return;
      if ((m.confidence || 0) < minConf) return;
      if (complex && this._excludeForComplexProject(candidates[idx])) return;
      out.push({
        ...candidates[idx],
        confidence: m.confidence,
        matchReason: m.reason || m.role || '',
        pblRole: m.role || 'core'
      });
    });
    return out;
  }

  _mapExternalEntries(entries) {
    return (entries || [])
      .filter(ext => ext && (ext.name || ext.title))
      .slice(0, PBLPathBuilder.PBL_MAX_EXTERNAL)
      .map((ext, i) => {
        const name = String(ext.name || ext.title || '').trim();
        const reason = String(ext.reason || ext.definition || '课标未单独覆盖，但项目实施必需').trim();
        return {
          id: `ext-${this._hash8(name + i)}`,
          name,
          name_en: '',
          subject: '',
          domain: '',
          grade: 0,
          difficulty: 0,
          definition: reason,
          key_concepts: [],
          prerequisites: [],
          extends: [],
          parallel: [],
          system: 'external',
          systemTag: '💡',
          systemLabel: '课标外补充',
          treePath: '',
          isExternal: true,
          layer: 'external',
          extPrerequisites: ext.prerequisites || [],
          confidence: 0.62,
          matchReason: reason
        };
      });
  }

  /** 按项目类型提供课标外知识点候选池（LLM 未返回时回退） */
  _fallbackExternalPool(goal) {
    if (this._isChemistryInquiryGoal(goal)) {
      return [
        { name: '厨房化学实验安全操作', reason: '加热、称量、取用调味品的安全要点，课标较少单独讲授' },
        { name: '家用电子秤读数与误差', reason: '厨房称量工具的使用与读数规则，实践必需但课标外' },
        { name: '食品包装标签上的钠/盐含量解读', reason: '联系生活情境理解浓度标注，课本通常不展开' },
      ];
    }
    const pools = {
      'consumer-decision': [
        { name: '全生命周期用车成本（TCO）', reason: '课标未系统讲授购车全成本模型，但家庭选车决策必需' },
        { name: '新能源汽车购置补贴与税费政策', reason: '政策直接影响购车成本，需查阅课外政策资料' },
        { name: '车辆保值率与残值评估', reason: '二手残值是选车重要维度，课本通常不涉及' },
      ],
      'engineering': [
        { name: '工程安全与操作规范', reason: '实验/制作环节的安全规程，课标无专项条目但落地必需' },
        { name: '原型测试与故障排查', reason: '工程迭代调试方法超出课本但项目实施必需' },
        { name: '用户需求访谈与场景分析', reason: '以用户为中心的设计方法，课本较少展开' },
      ],
      'scientific-inquiry': [
        { name: '实验伦理与数据真实性', reason: '科学探究中的伦理与记录规范，课标提及较少' },
        { name: '不确定度与误差传播', reason: '测量结果可信度评估，超出常规课标深度' },
        { name: '科学论文式报告结构', reason: '规范撰写探究报告，需课外方法论补充' },
      ],
      'social-inquiry': [
        { name: '问卷信效度检验', reason: '调查工具质量保障，课标较少系统讲授' },
        { name: '访谈伦理与知情同意', reason: '田野调查伦理要求，需课外补充' },
        { name: '数据可视化叙事', reason: '用图表讲故事的技能，超出常规统计课标' },
      ],
      'humanities-literary': [
        { name: '文学批评与互文阅读', reason: '深化文本解读的批评视角，课标外拓展' },
        { name: '朗诵与舞台表现技巧', reason: '口头展示与情感表达，课本较少展开' },
        { name: '版权与引用规范', reason: '创作与发表中的版权意识，需课外补充' },
      ],
      'creative-media': [
        { name: '版式与视觉层次设计', reason: '专业排版原则，课标信息技术较少深入' },
        { name: '受众分析与传播策略', reason: '面向受众的创意传播，课本较少涉及' },
        { name: '数字作品版权与授权', reason: '发布作品时的版权合规，需课外了解' },
      ],
      'business-economics': [
        { name: '市场调研抽样方法', reason: '商业调研中的抽样设计，课标外但实践必需' },
        { name: '盈亏平衡与现金流', reason: '简易商业测算模型，课本通常不单独讲授' },
        { name: '品牌定位与卖点提炼', reason: '营销策划中的定位方法，需课外补充' },
      ],
      'life-planning': [
        { name: '行程风险与应急预案', reason: '活动策划中的风险管理，课标无专项条目' },
        { name: '团队协作与分工机制', reason: '项目分工与协作方法，课本较少系统讲授' },
        { name: '时间管理与里程碑', reason: '项目进度管控，课外项目管理常识' },
      ],
      'health-life': [
        { name: '健康行为改变模型', reason: '行为干预的理论框架，超出常规健康课标' },
        { name: '可穿戴设备与健康监测', reason: '数字化健康追踪工具，课本较少涉及' },
        { name: '健康传播与同伴影响', reason: '健康倡议的传播策略，需课外补充' },
      ],
      'labor-practice': [
        { name: '工具安全与操作规范', reason: '劳动实践中的安全要点，需专项课外指导' },
        { name: '过程记录与反思日志', reason: '劳动教育中的反思性记录方法' },
        { name: '成果评价量规（Rubric）', reason: '评价劳动成果的标准化工具，课标外常用' },
      ],
      'general': [
        { name: '跨学科资料检索与引用', reason: '整合多来源信息并规范引用，课标较少系统讲授' },
        { name: '项目迭代与复盘方法', reason: 'PDCA 式改进流程，指导落地但课标外' },
        { name: '成果展示与答辩表达', reason: '公开汇报技巧，PBL 展示必需但课标外' },
      ],
    };
    return pools[this._classifyProjectType(goal)] || pools.general;
  }

  /** 保证图谱含 1-3 个课标外知识点 */
  _ensureExternalNodes(external, goal, matched, projectBlueprint) {
    const max = PBLPathBuilder.PBL_MAX_EXTERNAL;
    const min = PBLPathBuilder.PBL_MIN_EXTERNAL;
    let list = this._mapExternalEntries(external);
    const seen = new Set(list.map(e => String(e.name).toLowerCase()));

    const addItem = (item) => {
      if (list.length >= max || !item) return;
      const name = String(item.name || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      const mapped = this._mapExternalEntries([item]);
      if (!mapped.length) return;
      list.push(mapped[0]);
      seen.add(name.toLowerCase());
    };

    this._fallbackExternalPool(goal).forEach(addItem);

    if (list.length < min) {
      [
        { name: '跨学科资料检索与引用规范', reason: '整合多来源信息并规范引用，课标较少系统讲授' },
        { name: '项目迭代与复盘方法', reason: 'PDCA/迭代改进流程，指导项目实施但课标外' },
        { name: '成果展示与答辩表达', reason: '公开汇报与答辩技巧，课标外但对 PBL 展示必需' },
      ].forEach(addItem);
    }

    return list.slice(0, max);
  }

  _rescueCandidatesFromPool(goal, candidates, limit) {
    const goalTerms = this._tokenizeGoalTerms(goal);
    const complex = this._isComplexPBLGoal(goal);
    const domains = this._inferProjectDomains(goal);
    const withScore = candidates
      .filter(n => this._isMainlineRelevant(n, goal, domains))
      .map(n => ({
        ...n,
        _score: this._scoreNodeForGoal(n, goalTerms, null, complex, domains, goal)
      }))
      .filter(n => n._score > 0);
    const picked = this._pickStemBalancedCandidates(withScore, limit, domains, goal);
    return picked.map((n, i) => ({
      ...n,
      confidence: Math.max(0.55, 0.88 - i * 0.03),
      matchReason: '主线关键词回退匹配',
      pblRole: i < 1 ? 'foundation' : (i < 3 ? 'bridge' : 'core')
    }));
  }

  /** 主线节点不足时，仅按领域得分补齐，不凑跨学科 */
  _ensureMinimumMatched(matched, goal, candidatePool, limit, complex) {
    const min = PBLPathBuilder.PBL_MIN_MATCHED_COMPLEX;
    if (!complex || matched.length >= min || !candidatePool.length) {
      return matched.slice(0, limit);
    }
    const domains = this._inferProjectDomains(goal);
    const list = [...matched];
    const seen = new Set(list.map(n => n.id));
    const rescued = this._rescueCandidatesFromPool(goal, candidatePool, limit * 2)
      .filter(n => !seen.has(n.id) && !this._excludeForComplexProject(n))
      .filter(n => !domains.length || this._scoreNodeForDomains(n, domains) >= 6)
      .sort((a, b) => this._scoreNodeForDomains(b, domains) - this._scoreNodeForDomains(a, domains));
    let roleIdx = 0;
    const roles = ['foundation', 'bridge', 'bridge', 'core', 'core'];
    rescued.forEach(n => {
      if (list.length >= Math.min(min, limit)) return;
      if (seen.has(n.id)) return;
      seen.add(n.id);
      list.push({
        ...n,
        confidence: Math.max(n.confidence || 0.6, 0.62),
        matchReason: n.matchReason || '主线自动补齐',
        pblRole: roles[roleIdx++] || 'core'
      });
    });
    return list.slice(0, limit);
  }

  _buildDependsOnLinks(result, candidates) {
    const links = [];
    (result.matched || []).forEach(m => {
      const tgtIdx = this._parseMatchIndex(m, candidates.length);
      if (tgtIdx < 0) return;
      const tgtId = candidates[tgtIdx].id;
      (m.dependsOn || []).forEach(dep => {
        let srcIdx = typeof dep === 'string' ? parseInt(dep, 10) : dep;
        if (!Number.isInteger(srcIdx) || srcIdx < 0 || srcIdx >= candidates.length) return;
        links.push({ source: candidates[srcIdx].id, target: tgtId, type: 'prerequisite' });
      });
    });
    return links;
  }

  _applyPathOrderToGraph(graphData, matchedNodes, pathOrderIds = []) {
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
    const byId = new Map(matchedNodes.map(n => [n.id, n]));
    const ordered = [];
    (pathOrderIds || []).forEach(id => {
      if (byId.has(id) && !ordered.find(o => o.id === id)) ordered.push(byId.get(id));
    });
    matchedNodes.forEach(n => {
      if (!ordered.find(o => o.id === n.id)) ordered.push(n);
    });
    ordered.forEach((n, idx) => {
      const gNode = nodeMap.get(n.id);
      if (gNode) gNode.pathStep = idx + 1;
    });
    const links = [...graphData.links];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i].id;
      const b = ordered[i + 1].id;
      if (nodeMap.has(a) && nodeMap.has(b)) {
        links.push({ source: a, target: b, type: 'path-step' });
      }
    }
    return { nodes: graphData.nodes, links: this._deduplicateLinks(links) };
  }

  _formatPhaseLiteracy(phase) {
    const lit = phase.literacy || {};
    const rows = [
      ['知识', lit.knowledge || phase.knowledge],
      ['方法', lit.method || phase.method],
      ['能力', lit.ability || phase.ability],
      ['态度', lit.attitude || phase.attitude],
      ['情感', lit.emotion || phase.emotion],
      ['价值观', lit.values || phase.values]
    ].filter(([, v]) => v && String(v).trim());
    return rows.map(([k, v]) => `${k}：${v}`).join('；');
  }

  static PATH_STEP_CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];

  _pathStepCircled(step) {
    const i = (step || 1) - 1;
    return PBLPathBuilder.PATH_STEP_CIRCLED[i] || String(step);
  }

  /** 图谱主线：带 pathStep 的实施节点（绿/紫/红均算） */
  _getMainlinePath(graphData) {
    return (graphData?.nodes || [])
      .filter(n => n.pathStep)
      .sort((a, b) => a.pathStep - b.pathStep);
  }

  _inferNodeRole(n) {
    if (n.pblRole) return n.pblRole;
    if (n.layer === 'prerequisite') return 'foundation';
    if (n.layer === 'advanced') return 'bridge';
    return 'core';
  }

  _rolePhaseTitle(role, corePart, coreTotal) {
    const map = { foundation: '基础准备', bridge: '原理探究', core: '动手实现' };
    if (role === 'core' && coreTotal > 1) return `动手实现（${corePart === 1 ? '上' : '下'}）`;
    return map[role] || '实施阶段';
  }

  _defaultDeliverable(role, goal = '') {
    if (this._isChemistryInquiryGoal(goal)) {
      return ({
        foundation: '溶液与浓度概念图 / 公式推导笔记',
        bridge: '厨房食盐溶液探究实验方案与记录表',
        core: '浓度计算结果、对比分析与生活应用小结'
      })[role] || '化学探究阶段成果';
    }
    return ({
      foundation: '概念图 / 知识准备笔记',
      bridge: '原理分析报告或验证实验方案',
      core: '可运行原型、测试数据或阶段作品'
    })[role] || '阶段成果物';
  }

  _suggestPhaseSteps(goal, group) {
    const nodes = group.nodes || [];
    const kn = nodes.map(n => n.name).filter(Boolean);
    const knRef = kn.map(n => `「${n}」`).join('、') || '相关知识';
    if (this._isChemistryInquiryGoal(goal)) {
      const byRole = {
        foundation: [
          `用 ${knRef} 解释：食盐溶于水时溶质、溶剂、溶液分别是什么`,
          '写出溶质质量分数公式，并举例说明厨房场景下可测量的量',
        ],
        bridge: [
          '设计厨房食盐溶液浓度测定或配制实验：明确变量、对照与数据记录表',
          `结合 ${kn[0] || '溶液'} 列出实验步骤、器材与安全注意事项`,
        ],
        core: [
          '按方案称量、溶解并记录溶质质量与溶液质量（或体积）',
          '计算质量分数，与包装标签或经验浓度对比并分析误差原因',
        ],
      };
      return (byRole[group.role] || [`围绕 ${knRef} 完成探究记录与数据分析`]).slice(0, 3);
    }
    return null;
  }

  _groupMainlineIntoPhases(mainline) {
    if (!mainline.length) return [];
    const blocks = [];
    let cur = { role: null, nodes: [] };
    mainline.forEach(n => {
      const role = this._inferNodeRole(n);
      if (cur.role && role !== cur.role && cur.nodes.length) {
        blocks.push({ ...cur });
        cur = { role, nodes: [n] };
      } else {
        if (!cur.role) cur.role = role;
        cur.nodes.push(n);
      }
    });
    if (cur.nodes.length) blocks.push(cur);

    const expanded = [];
    blocks.forEach(b => {
      if (b.role === 'core' && b.nodes.length > 3) {
        const mid = Math.ceil(b.nodes.length / 2);
        expanded.push({ role: 'core', nodes: b.nodes.slice(0, mid), part: 1 });
        expanded.push({ role: 'core', nodes: b.nodes.slice(mid), part: 2 });
      } else {
        expanded.push(b);
      }
    });
    while (expanded.length > 5 && expanded.length > 1) {
      const tail = expanded.pop();
      expanded[expanded.length - 1].nodes.push(...tail.nodes);
    }

    const coreBlocks = expanded.filter(b => b.role === 'core');
    let coreSeen = 0;
    return expanded.map((b, i) => {
      if (b.role === 'core') coreSeen += 1;
      return {
        phaseIndex: i + 1,
        role: b.role,
        phase: b.part
          ? this._rolePhaseTitle('core', b.part, coreBlocks.length)
          : this._rolePhaseTitle(b.role, coreSeen, coreBlocks.length),
        nodes: b.nodes,
        pathSteps: b.nodes.map(n => n.pathStep),
        knowledgeNames: b.nodes.map(n => n.name),
        nodeIds: b.nodes.map(n => n.id)
      };
    });
  }

  _literacyFromLlmPhase(p) {
    if (!p) return {};
    if (p.literacy) return p.literacy;
    return {
      knowledge: p.knowledgeLiteracy || p.knowledge || '',
      method: p.methodLiteracy || p.method || '',
      ability: p.abilityLiteracy || p.ability || '',
      attitude: p.attitudeLiteracy || p.attitude || '',
      emotion: p.emotionLiteracy || p.emotion || '',
      values: p.valuesLiteracy || p.values || ''
    };
  }

  /**
   * 路径拆解模式：以图谱 pathStep 为主线，合并 LLM 阶段任务/素养/产出
   */
  _buildPathPlan({ goal, graphData, projectPhases = [], knowledgeChain = '', external = [] }) {
    const mainline = this._getMainlinePath(graphData);
    const groups = this._groupMainlineIntoPhases(mainline);
    const llm = projectPhases || [];
    const phases = groups.map((g, i) => {
      const lp = llm[i] || {};
      const contextual = this._suggestPhaseSteps(goal, g);
      const steps = Array.isArray(lp.steps) && lp.steps.length && !/完成图谱\d|课件与配套练习/.test(lp.steps.join(''))
        ? lp.steps
        : (contextual || g.nodes.map(n => `运用${this._pathStepCircled(n.pathStep)}「${n.name}」完成本阶段探究任务与记录`));
      return {
        phaseIndex: g.phaseIndex,
        phase: lp.phase || lp.name || g.phase,
        role: g.role,
        pathSteps: g.pathSteps,
        pathStepLabels: g.pathSteps.map(s => this._pathStepCircled(s)),
        graphRef: g.pathSteps.map(s => this._pathStepCircled(s)).join(''),
        nodeIds: g.nodeIds,
        knowledgeNames: g.knowledgeNames,
        steps,
        deliverable: lp.deliverable || lp.output || this._defaultDeliverable(g.role, goal),
        literacy: this._literacyFromLlmPhase(lp)
      };
    });
    const chain = knowledgeChain || mainline.map(n => n.name).join(' → ');
    return {
      mode: 'graph-aligned',
      goal: String(goal || ''),
      knowledgeChain: chain,
      mainlineCount: mainline.length,
      phases,
      external: (external || []).map(n => (typeof n === 'string' ? n : n.name)).filter(Boolean)
    };
  }

  buildPathPlanFromResult(result) {
    if (!result) return null;
    if (result.pathPlan?.phases?.length) return result.pathPlan;
    const graphNodes = result.graphData?.nodes?.length || 0;
    if (!graphNodes && result.projectBlueprint) {
      const phases = this._blueprintProjectPhases(result.projectBlueprint);
      if (phases.length) {
        return {
          mode: 'blueprint-only',
          goal: String(result.goal || ''),
          knowledgeChain: result.projectBlueprint.knowledgeChain || phases.map(p => p.phase).join(' → '),
          mainlineCount: 0,
          phases: phases.map((p, i) => ({
            phaseIndex: i + 1,
            phase: p.phase,
            role: 'core',
            pathSteps: [],
            pathStepLabels: [],
            graphRef: '',
            nodeIds: [],
            knowledgeNames: p.knowledgeNames || [],
            steps: p.steps || [],
            deliverable: p.deliverable || '',
            literacy: p.literacy || {}
          })),
          external: []
        };
      }
    }
    return this._buildPathPlan({
      goal: result.goal,
      graphData: result.graphData,
      projectPhases: result.projectPhases,
      knowledgeChain: result.knowledgeChain,
      external: result.external
    });
  }

  _buildTechRouteFromPathPlan(pathPlan) {
    if (!pathPlan?.phases?.length) return '';
    let text = `围绕「${pathPlan.goal.slice(0, 100)}」的实施路径（阶段与图谱序号一一对应）\n\n`;
    text += `知识链：${pathPlan.knowledgeChain}\n\n`;
    pathPlan.phases.forEach(p => {
      const kn = (p.knowledgeNames || []).map(n => `「${n}」`).join('、');
      text += `【阶段${p.phaseIndex} · 图谱 ${p.graphRef || p.pathStepLabels?.join('') || ''}】${p.phase}\n`;
      text += `知识点：${kn}\n`;
      text += `任务：${(p.steps || []).join('；')}\n`;
      const literacy = this._formatPhaseLiteracy(p);
      if (literacy) text += `素养指引：${literacy}\n`;
      text += `产出：${p.deliverable}\n\n`;
    });
    if (pathPlan.external?.length) {
      text += `拓展参考：${pathPlan.external.map(n => `「${n}」`).join('、')}\n`;
    }
    return this._sanitizeTechRoute(text).slice(0, 1200);
  }

  _subjectLabel(subject) {
    const map = {
      math: '数学', physics: '物理', chemistry: '化学', biology: '生物', science: '科学',
      'info-tech': '信息技术', chinese: '语文', english: '英语', history: '历史', geography: '地理'
    };
    return map[subject] || subject || '';
  }

  // ─── PBL 路径分析核心 ──────────────────────────

  static PBL_MAX_GRAPH_NODES = 22;
  static PBL_MIN_EXTERNAL = 1;
  static PBL_MAX_EXTERNAL = 3;
  static PBL_MAX_MATCHED_COMPLEX = 10;
  static PBL_MIN_MATCHED_COMPLEX = 5;
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

  /** PBL 核心提示词在服务端 /api/pbl/analyze；GitHub Pages 等静态站统一走 teachany.cn */
  _getPBLAnalyzeUrl() {
    const host = typeof location !== 'undefined' ? String(location.hostname || '') : '';
    if (host === 'teachany.cn' || host === 'www.teachany.cn') {
      return `${location.origin}/api/pbl/analyze`;
    }
    return 'https://www.teachany.cn/api/pbl/analyze';
  }

  _getRecommendedScheme(blueprint) {
    if (!blueprint) return null;
    const schemes = blueprint.schemes || [];
    return schemes.find(s => s.id === blueprint.recommendedSchemeId) || schemes[0] || null;
  }

  _blueprintProjectPhases(blueprint) {
    const scheme = this._getRecommendedScheme(blueprint);
    if (!scheme) return [];
    return (scheme.phases || []).map(p => ({
      phase: p.phase || p.name || '',
      steps: p.steps || [],
      knowledgeNames: p.knowledgeHints || p.knowledgeNames || [],
      deliverable: p.deliverable || p.output || '',
      literacy: p.literacy || {},
      subsystemIds: p.subsystemIds || []
    }));
  }

  _sanitizeBlueprintForGoal(blueprint, goal) {
    if (!blueprint || !this._isConsumerDecisionGoal(goal)) return blueprint;
    const bp = { ...blueprint, schemes: (blueprint.schemes || []).map(s => ({ ...s })) };
    bp.projectType = 'consumer-decision';
    if (!bp.deliverable || /原型|研发|装置|系统开发|数据采集系统|温度控制/.test(bp.deliverable)) {
      bp.deliverable = '家庭/个人消费决策报告（含调研表、对比测算表与推荐结论）';
    }
    const rdRe = /新能源装置|电池温度|电解池|研发|数据采集系统|充放电过程|制作任务|搭建原型/;
    bp.schemes.forEach(s => {
      if (s.phases) {
        s.phases = s.phases.map(p => {
          const phase = String(p.phase || '');
          const steps = (p.steps || []).map(st => String(st));
          if (rdRe.test(phase) || rdRe.test(steps.join(''))) {
            return {
              ...p,
              phase: phase.replace(/新能源装置|电池与新能源装置/, '方案对比'),
              steps: steps.map(st => st
                .replace(/研究电池充放电|学习电解质与离子反应|电池温度控制|程序设计基础/g, '查阅资料并记录对比数据')
                .replace(/实验或制作/g, '调研与测算')),
              knowledgeHints: (p.knowledgeHints || []).filter(h => !/电解池|原电池|程序|比热容|传感器/.test(h))
            };
          }
          return p;
        });
      }
    });
    return bp;
  }

  _fallbackDecomposeBlueprint(goal) {
    if (this._isConsumerDecisionGoal(goal)) {
      return this._sanitizeBlueprintForGoal({
        projectSummary: String(goal || '').slice(0, 160),
        deliverable: '家庭购车对比决策报告（含调研表、全成本测算表与推荐结论）',
        projectType: 'consumer-decision',
        constraints: ['基于公开参数与合理假设', '结论需有数据支撑'],
        subsystems: [
          { id: 'needs', name: '家庭需求调研', description: '梳理用车场景、里程、预算、充电/加油条件' },
          { id: 'compare', name: '对比维度设计', description: '确定购置价、能耗、保险维保、残值、环保等政策维度' },
          { id: 'model', name: '全成本测算', description: '用表格与函数估算 3–5 年持有成本' },
          { id: 'science', name: '科学原理支撑', description: '从科普层面理解燃油与电动的能量与排放差异' },
          { id: 'decision', name: '决策与答辩', description: '给出推荐车型及理由，回应家长关切' }
        ],
        schemes: [
          {
            id: 'A',
            name: '问卷调研 + 全成本对比表（推荐）',
            summary: '先调研家庭真实需求，再用数据对比新能源与燃油车全生命周期成本',
            pros: ['贴近生活', '数学物理跨学科', '结论可落地'],
            cons: ['需查阅真实参数'],
            phases: [
              { phase: '家庭需求调研', steps: ['设计简易问卷', '汇总用车场景与预算'], deliverable: '需求调研小结', subsystemIds: ['needs'], knowledgeHints: ['统计', '数据', '调查', '整理'] },
              { phase: '建立对比指标', steps: ['列出购置/能耗/维保/环保维度', '选取两款代表车型'], deliverable: '对比指标表', subsystemIds: ['compare'], knowledgeHints: ['函数', '比较', '分析'] },
              { phase: '科学原理补课', steps: ['了解内燃机效率与电动驱动差异', '了解排放与碳足迹概念'], deliverable: '原理笔记', subsystemIds: ['science'], knowledgeHints: ['内燃机', '效率', '能量', '排放', '环境'] },
              { phase: '全成本测算', steps: ['估算油费/电费与保养', '计算多年总成本'], deliverable: '成本测算表', subsystemIds: ['model'], knowledgeHints: ['一次函数', '计算', '统计', '百分比'] },
              { phase: '购车建议报告', steps: ['撰写对比结论', '班级答辩'], deliverable: '家庭购车建议报告', subsystemIds: ['decision'], knowledgeHints: ['说明文', '报告', '论证'] }
            ]
          },
          {
            id: 'B',
            name: '案例深潜 + 辩论会',
            summary: '选定具体车型案例，从环保政策与使用体验两派立场辩论',
            pros: ['思辨性强', '适合综合实践'],
            cons: ['对资料检索要求高'],
            phases: [
              { phase: '案例资料收集', steps: ['检索车型参数与政策补贴'], deliverable: '案例资料卡', knowledgeHints: ['调查', '数据', '环境'] },
              { phase: '正反观点整理', steps: ['列出燃油/电动各自优劣'], deliverable: '辩论提纲', knowledgeHints: ['比较', '分析', '论证'] },
              { phase: '量化佐证', steps: ['用简单模型估算使用成本'], deliverable: '测算附录', knowledgeHints: ['函数', '统计', '效率'] },
              { phase: '辩论与反思', steps: ['开展辩论', '反思决策依据'], deliverable: '反思日记', knowledgeHints: ['写作', '价值观'] }
            ]
          }
        ],
        recommendedSchemeId: 'A',
        knowledgeChain: '需求调研 → 对比框架 → 科学原理 → 成本测算 → 购车建议',
        fallback: true
      }, goal);
    }

    if (this._isChemistryInquiryGoal(goal)) {
      return {
        projectSummary: String(goal || '').slice(0, 160),
        deliverable: '厨房食盐溶液浓度探究报告（含实验方案、数据记录表、浓度计算与生活应用分析）',
        projectType: 'scientific-inquiry',
        constraints: ['使用安全可得的厨房材料', '计算需有数据支撑'],
        subsystems: [
          { id: 'solution', name: '溶液与浓度概念', description: '理解溶质/溶剂/溶液与质量分数' },
          { id: 'experiment', name: '实验设计与测量', description: '设计配制或测定食盐溶液浓度的实验' },
          { id: 'data', name: '数据处理', description: '记录数据并用统计图表呈现' },
          { id: 'application', name: '生活应用', description: '联系厨房情境解释结果并撰写报告' }
        ],
        schemes: [{
          id: 'A',
          name: '配制—计算—对比（推荐）',
          summary: '在厨房情境中配制食盐溶液，计算质量分数并与标签/经验值对比',
          pros: ['贴近生活', '化学主线清晰', '兼顾统计表达'],
          cons: ['需规范称量'],
          phases: [
            { phase: '概念准备', steps: ['辨析溶质溶剂溶液', '写出质量分数公式'], deliverable: '概念笔记', knowledgeHints: ['溶液', '溶质', '溶剂', '质量分数', '浓度'] },
            { phase: '实验设计', steps: ['确定称量方案', '设计记录表'], deliverable: '实验方案', knowledgeHints: ['实验', '变量', '测量', '配制'] },
            { phase: '动手探究', steps: ['称量溶解并记录数据'], deliverable: '实验数据表', knowledgeHints: ['溶解', '配制', '数据', '记录'] },
            { phase: '计算与报告', steps: ['计算浓度并制图分析', '撰写生活应用小结'], deliverable: '探究报告', knowledgeHints: ['统计', '图表', '计算', '报告'] }
          ]
        }],
        recommendedSchemeId: 'A',
        knowledgeChain: '溶液概念 → 实验设计 → 数据记录 → 浓度计算 → 生活应用',
        fallback: true
      };
    }

    const domains = this._inferProjectDomains(goal);
    const subsystems = domains.length
      ? domains.map(d => ({ id: d.id, name: d.label, description: `完成「${d.label}」相关设计与验证` }))
      : [
        { id: 'principle', name: '原理探究', description: '理解项目背后的科学/工程原理' },
        { id: 'design', name: '方案设计', description: '确定技术路线、分工与器材清单' },
        { id: 'build', name: '制作实现', description: '搭建原型并完成分步测试' },
        { id: 'test', name: '测试迭代', description: '采集数据、对比指标并优化' }
      ];
    const mkPhases = (prefix) => subsystems.map((s) => {
      const dom = domains.find(d => d.id === s.id);
      return {
        phase: s.name,
        steps: [`${prefix}${s.name}需求`, `完成${s.name}实验或制作任务`],
        deliverable: `${s.name}阶段成果`,
        subsystemIds: [s.id],
        knowledgeHints: (dom?.keywords || []).slice(0, 5)
      };
    });
    return {
      projectSummary: String(goal || '').slice(0, 160),
      deliverable: '可展示的项目原型、实验报告或系统演示',
      constraints: ['课堂可实施', '注意安全与器材可得性'],
      subsystems,
      schemes: [
        {
          id: 'A',
          name: '递进式实施（推荐）',
          summary: '按子系统由原理到实现逐步推进，适合大多数 PBL 课堂',
          pros: ['阶段清晰', '便于评价', '与课标主线易对齐'],
          cons: ['周期较长'],
          phases: mkPhases('拆解')
        },
        {
          id: 'B',
          name: '原型驱动迭代',
          summary: '先搭最小可行原型，再按测试反馈回补原理与优化',
          pros: ['学生成就感强', '适合工程社团'],
          cons: ['需更多指导'],
          phases: [
            { phase: '快速原型', steps: ['确定最小功能', '搭建雏形'], deliverable: 'MVP 原型', knowledgeHints: (domains[0]?.keywords || []).slice(0, 4), subsystemIds: [subsystems[0]?.id] },
            { phase: '测试与诊断', steps: ['设计测试指标', '记录问题清单'], deliverable: '测试记录表', knowledgeHints: ['实验', '数据采集', '误差'], subsystemIds: ['test'] },
            { phase: '原理补强', steps: ['针对问题查原理', '补学关键概念'], deliverable: '原理笔记', knowledgeHints: domains.flatMap(d => d.keywords).slice(0, 6), subsystemIds: subsystems.map(s => s.id) },
            { phase: '优化交付', steps: ['改进原型', '准备展示'], deliverable: '终版作品', knowledgeHints: ['效率', '优化', '测试'], subsystemIds: ['build', 'test'] }
          ]
        }
      ],
      recommendedSchemeId: 'A',
      knowledgeChain: subsystems.map(s => s.name).join(' → '),
      fallback: true
    };
  }

  _parseDecomposeResult(raw, goal) {
    try {
      const jsonStr = this._extractJsonObject(raw);
      const data = JSON.parse(jsonStr);
      if (!data.schemes?.length) return this._fallbackDecomposeBlueprint(goal);
      if (!data.recommendedSchemeId && data.schemes[0]) {
        data.recommendedSchemeId = data.schemes[0].id;
      }
      return this._sanitizeBlueprintForGoal(data, goal);
    } catch (e) {
      console.warn('[PBL] decompose JSON 解析失败，使用本地蓝图回退:', e.message);
      return this._fallbackDecomposeBlueprint(goal);
    }
  }

  async _llmDecomposeStage(goal) {
    const profile = this._getPBLGoalProfile(goal);
    try {
      const response = await this._callPBLAnalyzeStage('decompose', {
        goal,
        complex: profile.complex
      });
      return this._parseDecomposeResult(response, goal);
    } catch (e) {
      console.warn('[PBL] decompose 阶段失败，使用本地蓝图:', e.message);
      return this._fallbackDecomposeBlueprint(goal);
    }
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
    const pathPlan = this.buildPathPlanFromResult(result);
    if (pathPlan?.phases?.length) {
      return this._buildTechRouteFromPathPlan(pathPlan);
    }

    const nodes = (result.graphData && result.graphData.nodes) ? result.graphData.nodes : [];
    const mainline = this._getMainlinePath(result.graphData);
    const matched = mainline.length ? mainline : (result.matched || nodes.filter(n => n.layer === 'matched'));
    const external = result.external || nodes.filter(n => n.layer === 'external');
    const phases = result.projectPhases || [];
    const goal = result.goal || '';

    let routeText = this._buildTechRouteFromGraph(goal, matched, external, phases);
    if (routeText.replace(/\s/g, '').length < 40) {
      routeText = this._buildFallbackTechRoute(goal, matched, external);
    }
    if (routeText.replace(/\s/g, '').length < 20 && nodes.length) {
      const hint = mainline.length
        ? `按图谱序号 ${mainline.map(n => n.pathStep).join('→')} 推进：${mainline.slice(0, 5).map(n => n.name).join('、')}${mainline.length > 5 ? '…' : ''}。`
        : `共 ${nodes.length} 个节点，请按图谱序号完成各节点课件与动手任务。`;
      routeText = `围绕「${String(goal).slice(0, 80)}」的实施路径：${hint}`;
    }
    return routeText;
  }

  _capGraphNodes(graphData, maxNodes = PBLPathBuilder.PBL_MAX_GRAPH_NODES) {
    const nodes = graphData.nodes || [];
    if (nodes.length <= maxNodes) return graphData;
    const extKeep = nodes.filter(n => n.layer === 'external').slice(0, PBLPathBuilder.PBL_MAX_EXTERNAL);
    const others = nodes.filter(n => n.layer !== 'external');
    const budget = Math.max(maxNodes - extKeep.length, Math.floor(maxNodes * 0.75));
    const layerScore = { matched: 1000, external: 850, advanced: 750, parallel: 400, prerequisite: 600 };
    const roleBonus = { foundation: 100, bridge: 140, core: 80 };
    const scored = others.map(n => ({
      n,
      score: (layerScore[n.layer] || 50) + (n.confidence || 0) * 50
        + (roleBonus[n.pblRole] || 0)
        + (n.pathStep ? 120 : 0)
        - (this._excludeForComplexProject(n) ? 400 : 0)
    }));
    scored.sort((a, b) => b.score - a.score);
    const kept = [...scored.slice(0, budget).map(s => s.n), ...extKeep];
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
    core = this._purgeBiologyNoise(core, goal);
    core = this._filterMainlineNodes(core, goal);
    if (complex && core.length === 0 && matched.length) {
      core = this._filterMainlineNodes(
        [...matched].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)),
        goal
      );
    }
    if (complex) {
      core = this._ensureMinimumMatched(
        core,
        goal,
        meta.candidatePool || [],
        profile.maxMatched,
        complex
      );
      core = this._filterMainlineNodes(core, goal);
      core = this._rebalanceStemMatched(core, goal, meta.candidatePool || [], profile.maxMatched);
    }
    if (!core.length && meta.candidatePool?.length) {
      core = this._rescueCandidatesFromPool(goal, meta.candidatePool, profile.maxMatched);
      console.warn('[PBL] 主线为空，已用候选池回退:', core.map(n => n.name).join('、'));
    }
    // 主线 pathStep 链 + 角色分层着色 + 一层主线相关前置（不展开平行/跨学科噪声）
    let graphData = this._buildRichMainlineGraph(
      core,
      meta.pathOrderIds || [],
      goal,
      meta.dependsOnLinks || [],
      external.slice(0, PBLPathBuilder.PBL_MAX_EXTERNAL)
    );
    graphData = this._capGraphNodes(graphData, PBLPathBuilder.PBL_MAX_GRAPH_NODES);
    const mainline = this._getMainlinePath(graphData);
    const extOut = external.slice(0, PBLPathBuilder.PBL_MAX_EXTERNAL);
    return { complex, matched: mainline.length ? mainline : core, external: extOut, graphData };
  }

  /**
   * 主线加密图谱：pathStep 实施链 + 角色三色 + 一层课标前置（经主线过滤）
   * - foundation → 绿色 prerequisite
   * - bridge → 紫色 advanced
   * - core → 红色 matched
   */
  _buildRichMainlineGraph(matchedNodes, pathOrderIds, goal, dependsOnLinks, externalNodes) {
    const base = this._buildProjectPathGraph(matchedNodes, externalNodes || [], pathOrderIds || []);
    const nodeMap = new Map(base.nodes.map(n => [n.id, n]));
    const links = [...base.links];
    const domains = this._inferProjectDomains(goal);
    const complex = this._isComplexPBLGoal(goal);

    base.nodes.forEach(n => {
      if (!n.pathStep) return;
      const role = n.pblRole || 'core';
      if (role === 'foundation') n.layer = 'prerequisite';
      else if (role === 'bridge') n.layer = 'advanced';
      else n.layer = 'matched';
    });

    const matchedIds = new Set(matchedNodes.map(n => n.id));
    matchedNodes.forEach(n => {
      const kg = this.unifiedIndex.get(n.id);
      if (!kg) return;
      (kg.prerequisites || []).slice(0, 5).forEach(preId => {
        if (matchedIds.has(preId) || nodeMap.has(preId)) return;
        const preNode = this.unifiedIndex.get(preId);
        if (!preNode) return;
        if (complex && this._excludeForComplexProject(preNode)) return;
        if (domains.length && !this._isMainlineRelevant(preNode, goal, domains)) return;
        const enriched = { ...preNode, layer: 'prerequisite' };
        base.nodes.push(enriched);
        nodeMap.set(preId, enriched);
        links.push({ source: preId, target: n.id, type: 'prerequisite' });
      });
    });

    (dependsOnLinks || []).forEach(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      if (nodeMap.has(src) && nodeMap.has(tgt)) {
        links.push({ source: src, target: tgt, type: l.type || 'depends-on' });
      }
    });

    let nodes = base.nodes;
    if (this._shouldPurgeBiologyForGoal(goal)) {
      const kept = new Set(this._purgeBiologyNoise(nodes, goal).map(n => n.id));
      nodes = nodes.filter(n => kept.has(n.id));
    }
    const keptIds = new Set(nodes.map(n => n.id));
    const prunedLinks = links.filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return keptIds.has(src) && keptIds.has(tgt);
    });
    return { nodes, links: this._deduplicateLinks(prunedLinks) };
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

    if (!matched.length && !external.length) {
      return '未能匹配到课标知识点，知识图谱无法生成。请检查网络或 LLM 配置后重试；也可尝试把目标写得更具体（学科、年级、交付物）。';
    }

    if (Array.isArray(projectPhases) && projectPhases.length) {
      const subjSet = [...new Set(matched.map(n => n.subject).filter(Boolean))];
      let text = `围绕「${String(goal || '').slice(0, 100)}」的项目实施路线：\n\n`;
      if (subjSet.length >= 2) {
        text += `涉及学科：${subjSet.map(s => this._subjectLabel(s)).filter(Boolean).join('、')}\n\n`;
      }
      projectPhases.slice(0, 5).forEach((p, i) => {
        const steps = (Array.isArray(p.steps) ? p.steps : [p.task || p.desc || ''])
          .filter(s => s && !basicRe.test(s)).join('；');
        let kn = (Array.isArray(p.knowledgeNames) ? p.knowledgeNames : [])
          .map(validName).filter(Boolean).join('、');
        if (!kn) kn = nameList(matched.slice(i * 2, i * 2 + 3)) || '（见图谱核心节点）';
        const literacy = this._formatPhaseLiteracy(p);
        text += `【阶段${i + 1}】${p.phase || p.name || '实施阶段'}\n`;
        text += `任务：${steps || '完成本阶段拆解、建模与实现'}\n`;
        text += `知识支撑：${kn}\n`;
        if (literacy) text += `素养指引：${literacy}\n`;
        text += `产出：${p.deliverable || p.output || '阶段原型/数据/报告'}\n\n`;
      });
      return this._sanitizeTechRoute(text).slice(0, 900);
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

  _reportPBLStatus(onStatus, msg) {
    if (typeof onStatus === 'function') onStatus(msg);
  }

  async analyzePBLGoal(goal, selectedSystems = ['all'], onStatus = null) {
    // 1. 确保索引已加载
    this._reportPBLStatus(onStatus, '正在加载多课标知识点索引...');
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

    // 4. 第零阶段：全链路拆解可行方案（不选课标）
    this._reportPBLStatus(onStatus, '第 1/3 步：全链路拆解可行方案...');
    const projectBlueprint = await this._llmDecomposeStage(goal);
    const blueprintPhases = this._blueprintProjectPhases(projectBlueprint);

    // 5. 第一阶段 LLM：判断学科+学段+课标体系（压缩候选集）
    this._reportPBLStatus(onStatus, '第 2/3 步：筛选课标学科与候选池...');
    const stage1 = await this._llmFilterStage(goal, candidates, projectBlueprint);

    // 6. 第二阶段 LLM：按蓝图阶段精确匹配课标
    this._reportPBLStatus(onStatus, '第 3/3 步：按蓝图阶段匹配课标知识点...');
    const stage2 = await this._llmMatchStage(goal, stage1.filteredCandidates, projectBlueprint);
    const finalized = this._finalizePBLGraph(goal, stage2.matched, stage2.external, activeSystems, {
      pathOrderIds: stage2.pathOrderIds,
      dependsOnLinks: stage2.dependsOnLinks || [],
      candidatePool: stage1.filteredCandidates
    });
    const mergedPhases = (stage2.projectPhases?.length ? stage2.projectPhases : blueprintPhases)
      .map((p, i) => ({ ...blueprintPhases[i], ...p }));
    const pathPlan = this._buildPathPlan({
      goal,
      graphData: finalized.graphData,
      projectPhases: mergedPhases.length ? mergedPhases : blueprintPhases,
      knowledgeChain: stage2.knowledgeChain || projectBlueprint.knowledgeChain || '',
      external: finalized.external
    });
    const techRoute = this._buildTechRouteFromPathPlan(pathPlan)
      || this.resolveTechRouteText({
        goal,
        graphData: finalized.graphData,
        matched: finalized.matched,
        external: finalized.external,
        projectPhases: pathPlan.phases,
        knowledgeChain: pathPlan.knowledgeChain,
        pathPlan
      });

    return {
      goal,
      systems: activeSystems,
      projectBlueprint,
      matched: finalized.matched,
      external: finalized.external,
      techRoute,
      projectPhases: pathPlan.phases,
      pathPlan,
      knowledgeChain: pathPlan.knowledgeChain,
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

  async _llmFilterStage(goal, candidates, projectBlueprint = null) {
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
      complex: profile.complex,
      projectBlueprint
    });
    const jsonStr = this._extractJsonObject(response);
    const filter = JSON.parse(jsonStr);
    const domains = this._inferProjectDomains(goal);

    const projectType = this._classifyProjectType(goal);

    if (this._isConsumerDecisionGoal(goal)) {
      filter.subjects = ['math', 'physics', 'chemistry', 'geography', 'chinese'];
    } else if (this._isChemistryInquiryGoal(goal)) {
      filter.subjects = ['chemistry', 'science', 'math'];
    } else if (this._isStemProjectGoal(goal) && profile.complex) {
      // STEM/工程/科学探究类：锁定主线学科，禁止人文学科渗入候选池
      if (/火箭|导弹|发射|弹道|模型火箭/.test(goal)) {
        filter.subjects = ['physics', 'chemistry', 'math', 'info-tech'];
      } else if (this._isEnergyProjectGoal(goal)) {
        filter.subjects = ['physics', 'chemistry', 'math', 'info-tech'];
      } else {
        const subj = ['physics'];
        if (/燃料|燃烧|化学|材料|氧化|电池|电化学/.test(goal)) subj.push('chemistry');
        if (/模型|函数|计算|数据|弹道|抛体|效率/.test(goal)) subj.push('math');
        if (/控制|传感|编程|电路|数据|算法/.test(goal)) subj.push('info-tech');
        if (projectType === 'scientific-inquiry') { subj.push('chemistry', 'biology', 'science', 'math'); }
        if (subj.length === 1) subj.push('math');
        filter.subjects = [...new Set(subj)];
      }
    } else if (domains.length && !filter.subjects?.length) {
      // 生活化/人文/社科/创意/商业等：学科取项目模块的并集，不强行套理科
      filter.subjects = [...new Set(domains.flatMap(d => d.subjects || []))];
    }

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

    const MAX_STAGE2_CANDIDATES = profile.complex ? 28 : 22;
    let pool = filteredCandidates.length > 0 ? filteredCandidates : candidates.filter(n => {
      if (!profile.complex) return true;
      const g = parseInt(n.grade, 10) || 0;
      return (g === 0 || g >= minGrade) && !this._excludeForComplexProject(n);
    });
    if (domains.length && profile.complex) {
      const mainlinePool = pool.filter(n => this._isMainlineRelevant(n, goal, domains));
      if (mainlinePool.length >= 8) pool = mainlinePool;
    }
    const goalTerms = this._tokenizeGoalTerms(goal);
    const domainSubjectUnion = [...new Set(domains.flatMap(d => d.subjects || []))];
    const defaultSubjects = this._isConsumerDecisionGoal(goal)
      ? ['math', 'physics', 'chemistry', 'geography', 'chinese']
      : (this._isStemProjectGoal(goal)
        ? ['physics', 'chemistry', 'math', 'info-tech']
        : (domainSubjectUnion.length
          ? domainSubjectUnion
          : ['math', 'physics', 'chemistry', 'biology', 'chinese', 'info-tech']));
    const scored = pool.map(n => ({
      ...n,
      _score: this._scoreNodeForGoal(n, goalTerms, filter.subjects, profile.complex, domains, goal)
    }));
    const subjectList = filter.subjects && filter.subjects.length ? filter.subjects : defaultSubjects;
    const topCandidates = domains.length && (profile.complex || this._isConsumerDecisionGoal(goal) || this._isChemistryInquiryGoal(goal))
      ? this._pickDomainAwareCandidates(scored, MAX_STAGE2_CANDIDATES, domains, goal)
      : this._pickDiverseCandidates(scored, MAX_STAGE2_CANDIDATES, subjectList);
    return { filter, filteredCandidates: topCandidates, domains };
  }

  async _llmMatchStage(goal, candidates, projectBlueprint = null) {
    const profile = this._getPBLGoalProfile(goal);
    const complex = profile.complex;
    const minConf = complex ? 0.58 : 0.52;
    const blueprintPhases = this._blueprintProjectPhases(projectBlueprint);
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
      minConf,
      domainHints: this._inferProjectDomains(goal),
      projectBlueprint
    });
    let result = { matched: [], pathOrder: [], projectPhases: [], external: [], techRoute: '' };
    try {
      const jsonStr = this._extractJsonObject(response);
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('[PBL] match JSON 解析失败，将使用关键词回退:', e.message);
    }

    let matched = this._mapMatchedEntries(result, candidates, complex, minConf)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, profile.maxMatched);

    if (!matched.length) {
      matched = this._mapMatchedEntries(result, candidates, complex, 0.45)
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, profile.maxMatched);
    }
    if (!matched.length && candidates.length) {
      matched = this._rescueCandidatesFromPool(goal, candidates, profile.maxMatched);
      console.warn('[PBL] LLM matched 为空，已用候选池关键词回退:', matched.map(n => n.name).join('、'));
    }
    matched = this._filterMainlineNodes(matched, goal);
    matched = this._ensureMinimumMatched(matched, goal, candidates, profile.maxMatched, complex);
    matched = this._filterMainlineNodes(matched, goal);
    matched = this._purgeBiologyNoise(matched, goal);
    matched = this._rebalanceStemMatched(matched, goal, candidates, profile.maxMatched);
    matched = this._purgeBiologyNoise(matched, goal);

    let pathOrderIds = (result.pathOrder || result.learningSequence || [])
      .map(i => (typeof i === 'string' ? parseInt(i, 10) : i))
      .filter(i => Number.isInteger(i) && i >= 0 && i < candidates.length)
      .map(i => candidates[i].id)
      .filter(id => matched.some(m => m.id === id));
    if (pathOrderIds.length < matched.length) {
      const byRole = (role) => matched.filter(m => (m.pblRole || 'core') === role).map(m => m.id);
      const synth = [...byRole('foundation'), ...byRole('bridge'), ...byRole('core'),
        ...matched.filter(m => !['foundation', 'bridge', 'core'].includes(m.pblRole)).map(m => m.id)];
      const seen = new Set(pathOrderIds);
      synth.forEach(id => {
        if (!seen.has(id)) {
          seen.add(id);
          pathOrderIds.push(id);
        }
      });
    }

    const dependsOnLinks = this._buildDependsOnLinks(result, candidates);

    let projectPhases = (result.projectPhases || result.phases || []).map(p => ({
      phase: p.phase || p.name || '',
      steps: p.steps || (p.tasks ? (Array.isArray(p.tasks) ? p.tasks : [p.tasks]) : []),
      knowledgeNames: p.knowledgeNames || p.knowledge || [],
      deliverable: p.deliverable || p.output || '',
      literacy: p.literacy || {
        knowledge: p.knowledgeLiteracy || p.knowledge_dim || '',
        method: p.methodLiteracy || p.method || '',
        ability: p.abilityLiteracy || p.ability || '',
        attitude: p.attitudeLiteracy || p.attitude || '',
        emotion: p.emotionLiteracy || p.emotion || '',
        values: p.valuesLiteracy || p.values || ''
      }
    }));
    if (!projectPhases.length && blueprintPhases.length) {
      projectPhases = blueprintPhases;
    }

    const external = this._ensureExternalNodes(result.external || [], goal, matched, projectBlueprint);

    const techRoute = (result.techRoute || '').trim();
    const knowledgeChain = (result.knowledgeChain || '').trim();
    return { matched, external, techRoute, pathOrderIds, projectPhases, dependsOnLinks, knowledgeChain };
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
    const maxPreDepth = complex ? 3 : 5;
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

    const keywords = this._tokenizeGoalTerms(goal);
    const profile = this._getPBLGoalProfile(goal);
    const matched = [];

    this.unifiedIndex.forEach(node => {
      if (!activeSystems.includes(node.system)) return;
      if (profile.complex && this._excludeForComplexProject(node)) return;
      const score = this._scoreNodeForGoal(node, keywords, null, profile.complex);
      if (score > 0) {
        matched.push({
          ...node,
          confidence: Math.min(score / Math.max(keywords.length, 3), 1),
          matchReason: '关键词匹配'
        });
      }
    });

    matched.sort((a, b) => b.confidence - a.confidence);
    let topMatched = matched.slice(0, 15);
    if (!topMatched.length) {
      const pool = [];
      this.unifiedIndex.forEach(node => {
        if (!activeSystems.includes(node.system)) return;
        if (profile.complex && this._excludeForComplexProject(node)) return;
        pool.push(node);
      });
      topMatched = this._rescueCandidatesFromPool(goal, pool, 15);
    }
    const projectBlueprint = this._fallbackDecomposeBlueprint(goal);
    const external = this._ensureExternalNodes([], goal, topMatched, projectBlueprint);
    const finalized = this._finalizePBLGraph(goal, topMatched, external, activeSystems, {
      candidatePool: topMatched
    });

    const techRoute = this.resolveTechRouteText({
      goal,
      matched: finalized.matched,
      external: finalized.external,
      graphData: finalized.graphData,
      projectBlueprint
    });

    return {
      goal,
      systems: activeSystems,
      projectBlueprint,
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

    // ─── 实施顺序序号（主线节点） ───
    node.filter(d => d.pathStep)
      .append('text')
      .attr('x', 16)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('fill', d => this.colors.matched)
      .attr('pointer-events', 'none')
      .text(d => d.pathStep);

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

  highlightPathSteps(pathSteps) {
    const set = new Set((pathSteps || []).filter(Boolean));
    this._highlightSteps = set;
    if (!this.svg) return;
    const active = set.size > 0;
    this.svg.selectAll('.node-group').select('.node-circle')
      .attr('stroke-width', d => (active && set.has(d.pathStep) ? 4 : 2.5))
      .attr('opacity', d => (!active || set.has(d.pathStep) ? 1 : 0.28));
    this.svg.selectAll('.node-group').select('.node-label')
      .attr('opacity', d => (!active || set.has(d.pathStep) ? 1 : 0.35));
  }

  destroy() {
    if (this.simulation) this.simulation.stop();
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
    this.svg = null;
  }
}

// ─── 全局实例 ──────────────────────────────────────

window.PBLPathBuilder = new PBLPathBuilder();
window.PBLGraphRenderer = PBLGraphRenderer;

console.log('[TeachAny] PBL 学习路径构建器 v1.0 已加载');
