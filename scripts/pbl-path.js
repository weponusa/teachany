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
    this.providers = [
      { id: 'pollinations', name: 'Pollinations（免费免 Key · 默认）', baseUrl: 'https://text.pollinations.ai/openai?referrer=teachany', model: 'openai', noAuth: true, models: [
        'openai',
        'gpt-oss-20b'
      ] },
      { id: 'openrouter-free', name: 'OpenRouter（免费模型 · 需 Key）', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-oss-120b:free', models: [
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'z-ai/glm-4.5-air:free',
        'google/gemma-3-27b-it:free',
        'deepseek/deepseek-chat-v3.1:free',
        'tencent/hy3-preview:free'
      ] },
      { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', models: ['deepseek-chat','deepseek-reasoner'] },
      { id: 'moonshot', name: '月之暗面 Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', models: ['moonshot-v1-8k','moonshot-v1-32k','moonshot-v1-128k','kimi-latest'] },
      { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', models: ['qwen-plus','qwen-turbo','qwen-max','qwen-long','qwq-32b'] },
      { id: 'zhipu', name: '智谱 AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', models: ['glm-4-flash','glm-4-air','glm-4-plus','glm-4-long','glm-4v-plus','glm-4v'] },
      { id: 'openrouter', name: 'OpenRouter（付费模型）', baseUrl: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet', models: ['anthropic/claude-3.5-sonnet','openai/gpt-4o','google/gemini-2.5-flash-preview','deepseek/deepseek-chat-v3-0324','meta-llama/llama-4-maverick','qwen/qwen3-235b-a22b'] },
      { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', models: ['gpt-4o-mini','gpt-4o','gpt-4.1-mini','gpt-4.1'] },
      { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', models: ['gemini-2.0-flash','gemini-2.5-flash-preview','gemini-2.5-pro-preview'] },
      { id: 'siliconflow', name: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', models: ['Qwen/Qwen2.5-7B-Instruct','Qwen/Qwen2.5-72B-Instruct','deepseek-ai/DeepSeek-V3','Pro/deepseek-ai/DeepSeek-R1','THUDM/GLM-4-9B-0414','Qwen/Qwen3-235B-A22B'] },
      { id: 'paratera', name: '并行超算', baseUrl: 'https://llmapi.paratera.com/v1', model: 'DeepSeek-V3.2', models: ['DeepSeek-V3.2','DeepSeek-R1','Qwen3-235B-A22B-Instruct-2507','GLM-4.7','GLM-5','Kimi-K2','ERNIE-5.0-Thinking-Preview'] },
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

    // v7.11.3：缓存 key 升级，补全 curriculumLabel/stageLabel/gradeLabel，修复课标与学段显示混乱
    const CACHE_KEY = 'teachany_pbl_unified_index_v4';
    const CACHE_TTL = 1800000;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, entries } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          entries.forEach(([k, v]) => this.unifiedIndex.set(k, v));
          this.loaded = true;
          console.log(`[PBL] ✅ 从缓存恢复: ${this.unifiedIndex.size} 节点`);
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
      const CACHE_KEY = 'teachany_pbl_unified_index_v4';
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

  // 默认 Pollinations 免费模型（免 Key，OpenAI 兼容接口）
  static BUILTIN_KEY = '';
  static BUILTIN_MODEL = 'openai';
  static BUILTIN_BASE_URL = 'https://text.pollinations.ai/openai?referrer=teachany';

  _loadLLMConfig() {
    try {
      const saved = localStorage.getItem('teachany_pbl_config');
      if (saved) {
        const cfg = JSON.parse(saved);
        const savedProvider = this.providers.find(p => p.id === cfg.providerId || p.baseUrl === cfg.baseUrl);
        if (cfg.apiKey && (String(cfg.apiKey).startsWith('sk-or-v1-a4d900') || String(cfg.apiKey).startsWith('sk-or-v1-1dd402'))) {
          localStorage.removeItem('teachany_pbl_config');
        } else if (!cfg.apiKey && !(savedProvider && savedProvider.noAuth)) {
          localStorage.removeItem('teachany_pbl_config');
        } else {
          this._llmConfig = cfg;
          return;
        }
      }
    } catch (e) { /* ignore */ }
    // 默认配置：Pollinations 免费免 Key，开箱即用
    this._llmConfig = {
      providerId: 'pollinations',
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

  async callLLM(messages, options = {}) {
    const cfg = this.getLLMConfig();
    if (!cfg.noAuth && !cfg.apiKey) throw new Error('请先配置 API Key（点击右上角 ⚙️ 设置）');

    const cleanBaseUrl = String(cfg.baseUrl || '').replace(/\/$/, '');
    const endpoint = /\/(openai|chat\/completions)(?:\?.*)?$/i.test(cleanBaseUrl)
      ? cleanBaseUrl
      : cleanBaseUrl + '/chat/completions';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (!cfg.noAuth && cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;

    // OpenRouter 专属 header
    if (cleanBaseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = location.origin || 'https://teachany.app';
      const safeTitle = 'TeachAny PBL Path Builder';
      headers['X-Title'] = safeTitle;
    }

    const body = {
      model: cfg.model,
      messages,
      stream: false,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 4000
    };

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 60000); // 60s 超时

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: ac.signal,
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
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

    // 6. 构建路径图
    const graphData = this._buildPathGraph(stage2.matched, stage2.external, activeSystems);

    return {
      goal,
      systems: activeSystems,
      matched: stage2.matched,
      external: stage2.external,
      graphData,
      stats: {
        totalCandidates: candidates.length,
        filteredCandidates: stage1.filteredCandidates.length,
        matchedCount: stage2.matched.length,
        externalCount: stage2.external.length,
        graphNodes: graphData.nodes.length,
        graphLinks: graphData.links.length
      }
    };
  }

  async _llmFilterStage(goal, candidates) {
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

    const messages = [
      {
        role: 'system',
        content: `你是一个教育知识图谱专家。你需要根据PBL项目目标，判断该项目涉及的学科领域和课标体系。只返回JSON，不要其他内容。`
      },
      {
        role: 'user',
        content: `PBL项目目标：${goal}

可用的知识体系：
${summaryList}

请判断该项目最可能涉及的学科和课标体系，返回JSON格式：
{
  "subjects": ["math", "physics"],
  "systems": ["cn", "ap"],
  "grades": [8, 9, 10],
  "reasoning": "简要说明判断理由"
}

注意：
- subjects 用英文标识（math/physics/chemistry/biology/chinese/english/history/geography/info-tech）
- systems 用英文标识（cn/ap/cambridge/ib/us）
- grades 是建议的年级范围
- 最多选3个学科和3个课标体系`
      }
    ];

    const response = await this.callLLM(messages);
    const jsonStr = this._extractJsonObject(response);
    const filter = JSON.parse(jsonStr);

    // 根据筛选条件过滤候选集
    const filteredCandidates = candidates.filter(n => {
      const subjectMatch = !filter.subjects || filter.subjects.length === 0 || filter.subjects.includes(n.subject);
      const systemMatch = !filter.systems || filter.systems.length === 0 || filter.systems.includes(n.system);
      const gradeMatch = !filter.grades || filter.grades.length === 0 || filter.grades.some(g => Math.abs(n.grade - g) <= 2);
      return subjectMatch && systemMatch && gradeMatch;
    });

    return { filter, filteredCandidates: filteredCandidates.length > 0 ? filteredCandidates : candidates.slice(0, 120) };
  }

  async _llmMatchStage(goal, candidates) {
    // 构建知识点候选列表文本（压缩表示）
    const candidateList = candidates.map((n, i) => {
      const prefix = n.systemTag;
      const gradeStr = n.gradeLabel || (n.grade ? `G${n.grade}` : '');
      const curriculum = n.curriculumLabel || n.systemLabel || prefix;
      const stage = n.stageLabel || '';
      return `[${i}] ${n.id} | ${n.name} | ${gradeStr} | ${prefix}/${curriculum}${stage ? '/' + stage : ''}`;
    }).join('\n');

    const messages = [
      {
        role: 'system',
        content: `你是一个教育知识图谱专家。你需要从给定的知识点候选列表中，找出完成PBL项目所需掌握的知识点。只返回JSON，不要其他内容。`
      },
      {
        role: 'user',
        content: `PBL项目目标：${goal}

候选知识点列表：
${candidateList}

请找出完成该项目需要掌握的知识点，返回JSON格式：
{
  "matched": [
    {"index": 0, "confidence": 0.9, "reason": "核心概念"},
    {"index": 5, "confidence": 0.8, "reason": "基础前置"}
  ],
  "external": [
    {"name": "PID控制算法", "reason": "温控系统核心算法", "prerequisites": ["数学微积分基础", "反馈控制概念"]}
  ]
}

要求：
- matched 中的 index 对应候选列表中的序号
- confidence 范围 0-1，0.8以上为核心必需，0.5-0.8为相关参考
- 只选 confidence >= 0.5 的知识点
- external 为候选列表中没有但对项目有用的外部知识点，最多3个
- 每个外部知识点需给出 name、reason、prerequisites（前置知识名称列表）`
      }
    ];

    const response = await this.callLLM(messages, { maxTokens: 4000, temperature: 0.2 });
    const jsonStr = this._extractJsonObject(response);
    const result = JSON.parse(jsonStr);

    // 解析匹配结果
    const matched = (result.matched || [])
      .filter(m => m.confidence >= 0.5 && m.index >= 0 && m.index < candidates.length)
      .map(m => ({
        ...candidates[m.index],
        confidence: m.confidence,
        matchReason: m.reason
      }));

    // 解析外部知识点
    const external = (result.external || []).map((ext, i) => ({
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

    return { matched, external };
  }

  // ─── 路径图构建 ─────────────────────────────────

  _buildPathGraph(matchedNodes, externalNodes, activeSystems) {
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
      this._tracePrerequisites(n.id, nodes, links, 0, 5);
    });

    // 4. 对每个匹配节点，沿 extends 前探（紫色 = 扩展高级）
    matchedNodes.forEach(n => {
      this._traceExtends(n.id, nodes, links, 0, 2);
    });

    // 5. 沿 parallel 关联
    matchedNodes.forEach(n => {
      this._traceParallel(n.id, nodes, links);
    });

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

    return {
      nodes: Array.from(nodes.values()),
      links: this._deduplicateLinks(links)
    };
  }

  _tracePrerequisites(nodeId, nodes, links, depth, maxDepth) {
    if (depth >= maxDepth) return;
    const node = this.unifiedIndex.get(nodeId);
    if (!node) return;

    (node.prerequisites || []).forEach(preId => {
      const preNode = this.unifiedIndex.get(preId);
      if (!preNode) return;

      if (!nodes.has(preId)) {
        nodes.set(preId, { ...preNode, layer: 'prerequisite' });
      }

      links.push({ source: preId, target: nodeId, type: 'prerequisite' });
      this._tracePrerequisites(preId, nodes, links, depth + 1, maxDepth);
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

    const graphData = this._buildPathGraph(topMatched, [], activeSystems);

    return {
      goal,
      systems: activeSystems,
      matched: topMatched,
      external: [],
      graphData,
      stats: {
        totalCandidates: this.unifiedIndex.size,
        filteredCandidates: this.unifiedIndex.size,
        matchedCount: topMatched.length,
        externalCount: 0,
        graphNodes: graphData.nodes.length,
        graphLinks: graphData.links.length
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
      .attr('stroke', d => d.type.includes('external') ? this.colors.external : d.type === 'extends' ? this.colors.advanced : d.type === 'parallel' ? this.colors.parallel : 'rgba(148,163,184,0.3)')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => d.type === 'prerequisite' ? 2 : 1.5)
      .attr('stroke-dasharray', d => d.type.includes('external') ? '6 3' : d.type === 'parallel' ? '3 3' : d.type === 'extends' ? '6 3' : 'none')
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
            const base = 'https://weponusa.github.io/teachany-courseware';
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
    if (d.isExternal) return false;
    if (d.status === 'active' && d.courses && d.courses.length) return true;
    // 检查 Hub
    if (window.TeachAnyHub && typeof TeachAnyHub.getAllCoursesForNode === 'function') {
      const hubCourses = TeachAnyHub.getAllCoursesForNode(d.id);
      if (hubCourses.length > 0) return true;
    }
    // 检查用户课件
    if (window.TeachAnyImporter && typeof TeachAnyImporter.getTopCoursesForTreeNode === 'function') {
      const userCourses = TeachAnyImporter.getTopCoursesForTreeNode(d.id);
      if (userCourses.length > 0) return true;
    }
    return false;
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
