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

    // 全科图谱增强：跨学科边关系图
    this.graphEdges = [];              // [{source, target}] 全科图谱边
    this.graphNeighbors = new Map();   // nodeId -> { parents: Set, children: Set }
    this.graphLoaded = false;

    // Tooltip 延迟隐藏：允许鼠标从节点移动到弹窗内点击课程链接
    this._tooltipHideTimer = null;
    this._tooltipHovered = false;

    // LLM 服务商：服务端预设 + 可选模型；custom 走客户端自带 Key
    this.providers = [
      {
        id: 'preset',
        name: 'TeachAny 默认（DeepSeek-V4-Flash）',
        serverPreset: true,
        model: '',
        models: ['', 'deepseek-ai/DeepSeek-V4-Flash', 'GLM-4-Flash', 'qwen/qwen3-next-80b-a3b-instruct:free'],
      },
      {
        id: 'siliconflow',
        name: '硅基流动',
        serverBacked: true,
        model: 'deepseek-ai/DeepSeek-V4-Flash',
        models: ['deepseek-ai/DeepSeek-V4-Flash', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B', 'THUDM/GLM-4-9B-0414', '__custom__'],
      },
      {
        id: 'paratera',
        name: '并行超算',
        serverBacked: true,
        model: 'GLM-4-Flash',
        models: ['GLM-4-Flash', 'DeepSeek-V3.2', 'DeepSeek-R1', 'GLM-4.7', 'GLM-5', '__custom__'],
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        serverBacked: true,
        model: 'qwen/qwen3-next-80b-a3b-instruct:free',
        models: ['qwen/qwen3-next-80b-a3b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free', 'anthropic/claude-3.5-sonnet', '__custom__'],
      },
      {
        id: 'custom',
        name: '自定义 API（自带 Key）',
        clientLlm: true,
        baseUrl: '',
        model: '',
        models: [],
      },
    ];
    this._loadLLMConfig();

    this._archetypeEngine = null;
    this._resolvedArchetype = null;
  }

  _loadLLMConfig() {
    try {
      const saved = localStorage.getItem('teachany_pbl_config');
      if (saved) {
        const cfg = JSON.parse(saved);
        if (this.providers.some(p => p.id === cfg.providerId)) {
          this._llmConfig = cfg;
          return;
        }
      }
    } catch (e) { /* ignore */ }
    this._llmConfig = {
      providerId: 'preset',
      model: '',
      apiKey: '',
      baseUrl: '',
      customModel: '',
    };
  }

  _saveLLMConfig() {
    try {
      localStorage.setItem('teachany_pbl_config', JSON.stringify(this._llmConfig));
    } catch (e) { /* ignore */ }
  }

  getLLMConfig() {
    const provider = this.providers.find(p => p.id === this._llmConfig.providerId) || this.providers[0];
    let model = this._llmConfig.model ?? provider.model ?? '';
    if (model === '__custom__') {
      model = String(this._llmConfig.customModel || '').trim();
    }
    return {
      providerId: provider.id,
      providerName: provider.name,
      model,
      apiKey: this._llmConfig.apiKey || '',
      baseUrl: this._llmConfig.baseUrl || provider.baseUrl || '',
      serverBacked: !!provider.serverBacked,
      serverPreset: !!provider.serverPreset,
      clientLlm: !!provider.clientLlm,
    };
  }

  setLLMConfig(cfg) {
    Object.assign(this._llmConfig, cfg);
    this._saveLLMConfig();
  }

  _llmStageOptions(stage) {
    const map = {
      decompose: { maxTokens: 4500, temperature: 0.35 },
      filter: { maxTokens: 1200, temperature: 0.25 },
      match: { maxTokens: 8000, temperature: 0.15 },
      'verify-deps': { maxTokens: 2500, temperature: 0.08 },
    };
    return map[stage] || { maxTokens: 4000, temperature: 0.2 };
  }

  async callLLM(messages, options = {}) {
    const cfg = this.getLLMConfig();
    if (!cfg.baseUrl) throw new Error('请先配置 Base URL（点击右上角 ⚙️ 设置）');
    if (!cfg.apiKey) throw new Error('请先配置 API Key（点击右上角 ⚙️ 设置）');
    if (!cfg.model) throw new Error('请先配置模型名称');

    const cleanBaseUrl = String(cfg.baseUrl).replace(/\/$/, '');
    const endpoint = /\/chat\/completions/i.test(cleanBaseUrl)
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    };
    if (cleanBaseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = location.origin || 'https://www.teachany.cn';
      headers['X-Title'] = 'TeachAny PBL';
    }

    const body = {
      model: cfg.model,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4000,
    };

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 90000);
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: ac.signal,
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      if (!resp.ok) {
        let errMsg = text.slice(0, 300);
        try { errMsg = JSON.parse(text)?.error?.message || errMsg; } catch (_e) { /* ignore */ }
        throw new Error(`API ${resp.status}: ${errMsg}`);
      }
      const data = JSON.parse(text);
      const message = data.choices?.[0]?.message || {};
      return message.content || message.reasoning || message.reasoning_content || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  async _fetchPBLMessages(stage, payload) {
    const body = { stage, ...payload, messagesOnly: true };
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 60000);
    try {
      const resp = await fetch(this._getPBLAnalyzeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `PBL API ${resp.status}`);
      if (!Array.isArray(data.messages)) throw new Error('PBL API 未返回 messages');
      return data.messages;
    } finally {
      clearTimeout(timeout);
    }
  }

  async _ensureArchetypeData() {
    if (typeof PBLArchetypeEngine === 'undefined') return null;
    if (!this._archetypeEngine) this._archetypeEngine = new PBLArchetypeEngine();
    try {
      await this._archetypeEngine.load('./data/pbl/');
    } catch (e) {
      console.warn('[PBL] 原型层数据加载失败，将使用规则回退:', e.message);
    }
    return this._archetypeEngine;
  }

  _resolveArchetype(goal, blueprint) {
    if (!this._archetypeEngine?.archetypeData) return null;
    const a = this._archetypeEngine.resolve(
      goal,
      blueprint,
      g => this._classifyProjectType(g),
      g => this._getChemistryAnalysisProfile(g)
    );
    this._resolvedArchetype = a;
    return a;
  }

  _isArchetypeBanned(node, archetype) {
    if (!archetype || !this._archetypeEngine) return false;
    if (this._archetypeEngine.isBanned(node, archetype)) return true;
    if (this._isGenericTransversalNode(node.name, '')) return true;
    return false;
  }

  _meetsArchetypeGrade(node, archetype) {
    if (!archetype || !this._archetypeEngine) return true;
    if (!this._archetypeEngine.meetsGrade(node, archetype)) return false;
    if (archetype.minGrade >= 7 && this._excludeForComplexProject(node)) return false;
    return true;
  }

  _applyArchetypePoolRules(pool, archetype, activeSystems) {
    if (!archetype) return pool;
    let out = pool.filter(n => this._meetsArchetypeGrade(n, archetype));
    out = out.filter(n => !this._isArchetypeBanned(n, archetype));
    if (this._archetypeEngine) {
      out = this._archetypeEngine.applySystemLock(out, archetype, activeSystems);
    }
    if (archetype.subjects?.length) {
      const subjFiltered = out.filter(n => archetype.subjects.includes(n.subject));
      if (subjFiltered.length >= Math.min(6, out.length * 0.4)) out = subjFiltered;
    }
    return out;
  }

  _alignBlueprintModules(blueprint, archetype) {
    if (!blueprint || !archetype?.modules?.length) return blueprint;
    const mods = archetype.modules;
    const schemes = (blueprint.schemes || []).map(s => ({
      ...s,
      phases: (s.phases || []).map((p, i) => {
        const hasIds = (p.subsystemIds || []).length;
        const mod = mods[i % mods.length];
        return hasIds ? p : { ...p, subsystemIds: [mod.id] };
      }),
    }));
    return { ...blueprint, schemes, knowledgeChain: blueprint.knowledgeChain || this._archetypeEngine?.moduleChain(archetype, blueprint) };
  }

  _validateBlueprint(blueprint, goal, archetype) {
    if (this._archetypeEngine?.validateBlueprint) {
      return this._archetypeEngine.validateBlueprint(blueprint, archetype);
    }
    const issues = [];
    if (!blueprint?.schemes?.length) issues.push('缺少可行方案');
    if (!blueprint?.deliverable) issues.push('缺少交付物');
    return { valid: issues.length === 0, issues };
  }

  computeQualityScore(payload = {}) {
    const {
      goal = '', matched = [], external = [], projectBlueprint = null,
      archetype = null, graphData = null, pathPlan = null,
    } = payload;
    let score = 100;
    const breakdown = [];

    const minM = archetype?.minMatched || 4;
    if (matched.length < minM) {
      const pen = Math.min(25, (minM - matched.length) * 6);
      score -= pen;
      breakdown.push({ key: 'matched', label: '课标匹配不足', delta: -pen });
    }

    const banned = matched.filter(n => this._isGenericTransversalNode(n.name, goal));
    if (banned.length) {
      const pen = Math.min(15, banned.length * 5);
      score -= pen;
      breakdown.push({ key: 'ban', label: '泛素养节点', delta: -pen });
    }

    const phases = pathPlan?.phases || projectBlueprint?.schemes?.find(s => s.id === projectBlueprint?.recommendedSchemeId)?.phases || [];
    let hollow = 0;
    phases.forEach(p => {
      (p.steps || []).forEach(st => { if (this._isHollowStep(st)) hollow++; });
    });
    if (hollow >= 2) {
      const pen = Math.min(20, hollow * 4);
      score -= pen;
      breakdown.push({ key: 'hollow', label: '空话步骤', delta: -pen });
    }

    const bpVal = this._validateBlueprint(projectBlueprint, goal, archetype);
    if (!bpVal.valid) {
      const pen = Math.min(12, bpVal.issues.length * 4);
      score -= pen;
      breakdown.push({ key: 'blueprint', label: '蓝图待完善', delta: -pen });
    }

    if (archetype?.modules?.length) {
      const covered = new Set(matched.map(n => n._moduleId).filter(Boolean));
      const ratio = covered.size / archetype.modules.length;
      if (ratio < 0.5) {
        const pen = Math.round((0.5 - ratio) * 20);
        score -= pen;
        breakdown.push({ key: 'modules', label: '模块覆盖偏低', delta: -pen });
      }
    }

    const extWithTask = (external || []).filter(e => e.taskSnippet || e.matchReason?.includes('任务：'));
    if (!extWithTask.length && external?.length) {
      score -= 5;
      breakdown.push({ key: 'ext', label: '课外缺任务片段', delta: -5 });
    }

    const nodes = graphData?.nodes || [];
    if (nodes.length && matched.length) {
      const mainline = nodes.filter(n => n.pathStep);
      if (mainline.length < Math.min(3, matched.length)) {
        score -= 8;
        breakdown.push({ key: 'path', label: '实施链不完整', delta: -8 });
      }
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
      breakdown,
      blueprintValid: bpVal.valid,
      blueprintIssues: bpVal.issues || [],
    };
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
          // 异步加载全科图谱（即使走缓存也需要）
          this._loadKnowledgeGraph();
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

    // 异步加载全科图谱边数据（不阻塞主流程）
    this._loadKnowledgeGraph();

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

  // ─── 全科图谱增强：加载跨学科边数据 ──────────────────────────

  async _loadKnowledgeGraph() {
    if (this.graphLoaded) return;
    try {
      const t0 = performance.now();
      const resp = await fetch('./data/knowledge-map-data.json?t=' + Date.now());
      const data = await resp.json();

      // 构建邻接表（双向索引）
      const neighbors = this.graphNeighbors;
      (data.edges || []).forEach(e => {
        const src = e.source, tgt = e.target;
        if (!neighbors.has(src)) neighbors.set(src, { parents: new Set(), children: new Set() });
        if (!neighbors.has(tgt)) neighbors.set(tgt, { parents: new Set(), children: new Set() });
        neighbors.get(src).children.add(tgt);
        neighbors.get(tgt).parents.add(src);
      });

      // 补充 unifiedIndex 中缺失的大学节点（grade=0）
      let uniAdded = 0;
      (data.nodes || []).forEach(n => {
        if (n.grade === 0 && !this.unifiedIndex.has(n.id)) {
          this.unifiedIndex.set(n.id, {
            id: n.id,
            name: n.name || n.id,
            name_en: n.name_en || '',
            subject: n.subject || '',
            domain: n.domain || '',
            domainColor: '#6366f1',
            grade: 0,
            difficulty: 0,
            definition: n.definition || '',
            key_concepts: [],
            prerequisites: [],
            extends: [],
            parallel: [],
            status: 'active',
            courses: [],
            curriculum_points: [],
            system: 'cn',
            systemTag: 'CN',
            systemLabel: '大学',
            curriculumLabel: '大学课程',
            stageLabel: '大学',
            gradeLabel: '大学',
            treePath: '',
            isExternal: false,
            isUniversity: true
          });
          uniAdded++;
        }
      });

      this.graphEdges = data.edges || [];
      this.graphLoaded = true;
      const elapsed = (performance.now() - t0).toFixed(0);
      console.log(`[PBL] 🧬 全科图谱就绪: ${this.graphEdges.length} 条边, ${neighbors.size} 节点邻接, ${uniAdded} 大学节点补充, ${elapsed}ms`);
    } catch (e) {
      console.warn('[PBL] 全科图谱加载失败（降级为无跨学科增强）:', e.message);
    }
  }

  /**
   * 获取节点的图谱邻居（跨学科前置+后续）
   * @param {string} nodeId
   * @param {number} depth - 遍历深度（1=直接邻居, 2=两层）
   * @returns {{ parents: string[], children: string[], crossSubject: string[] }}
   */
  getGraphNeighbors(nodeId, depth = 1) {
    if (!this.graphLoaded) return { parents: [], children: [], crossSubject: [] };
    const visited = new Set([nodeId]);
    let currentLayer = [nodeId];
    const allParents = new Set();
    const allChildren = new Set();

    for (let d = 0; d < depth; d++) {
      const nextLayer = [];
      currentLayer.forEach(id => {
        const nb = this.graphNeighbors.get(id);
        if (!nb) return;
        nb.parents.forEach(p => { if (!visited.has(p)) { allParents.add(p); nextLayer.push(p); visited.add(p); } });
        nb.children.forEach(c => { if (!visited.has(c)) { allChildren.add(c); nextLayer.push(c); visited.add(c); } });
      });
      currentLayer = nextLayer;
    }

    // 识别跨学科邻居
    const selfNode = this.unifiedIndex.get(nodeId);
    const selfSubject = selfNode ? selfNode.subject : '';
    const crossSubject = [];
    [...allParents, ...allChildren].forEach(id => {
      const n = this.unifiedIndex.get(id);
      if (n && n.subject && n.subject !== selfSubject) crossSubject.push(id);
    });

    return { parents: [...allParents], children: [...allChildren], crossSubject };
  }

  /**
   * 查找 K12 终端节点到大学节点的桥接路径
   * @param {string} k12NodeId - K12 节点 ID
   * @returns {string[]} 可达的大学节点 ID 列表
   */
  getUniversityBridges(k12NodeId) {
    if (!this.graphLoaded) return [];
    const nb = this.graphNeighbors.get(k12NodeId);
    if (!nb) return [];
    const bridges = [];
    nb.children.forEach(childId => {
      const child = this.unifiedIndex.get(childId);
      if (child && (child.grade === 0 || child.isUniversity)) bridges.push(childId);
    });
    return bridges;
  }

  // ─── 原有方法 ──────────────────────────

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
    return /浓度|溶液|溶解度|溶质|溶剂|饱和溶液|质量分数|体积分数|物质的溶解|配制溶液|混合溶液/.test(g)
      || /食盐|盐水|醋酸|苏打|洁厕|电解水|酸碱|中和|化学变化|物质的变化|离子反应/.test(g)
      || /滴定|硝酸银|电导率|莫尔法|沉淀滴定|标准溶液|物质的量浓度/.test(g)
      || /食堂|菜汤|汤水|汤汁|汤品|卤水/.test(g)
      || (/厨房|餐桌|调味|烹饪|汤/.test(g) && /盐|酸|碱|醋|化学|浓度|溶液|溶解|测|含量/.test(g));
  }

  /**
   * 混合溶液/真实样品浓度测定：无法直接称量分离溶质 → 滴定法或电导率法等间接测定
   */
  _getChemistryAnalysisProfile(goal) {
    const g = String(goal || '');
    const mixed = /混合溶液|食堂|菜汤|汤水|汤汁|汤品|卤水|景区水|河水|废水|不能直接|无法.*分离|不能.*称量|不能.*称重/.test(g)
      || (/汤/.test(g) && /食堂|餐厅|厨房|测定|检测|含量|浓度|盐/.test(g))
      || /滴定|硝酸银|电导率|间接测定/.test(g);
    const wantsTitration = /滴定|硝酸银|AgNO|莫尔|沉淀滴定|氯离子|Cl⁻|Cl-/.test(g);
    const wantsConductivity = /电导率|电导|导电率|电解质.*导电/.test(g);
    const methods = [];
    if (wantsTitration) methods.push('titration');
    if (wantsConductivity) methods.push('conductivity');
    if (mixed && !methods.length) methods.push('titration', 'conductivity');
    return {
      mixed,
      methods,
      primary: methods[0] || (mixed ? 'titration' : 'direct'),
      sampleLabel: /食堂|菜汤|汤水/.test(g) ? '食堂汤水' : (/混合溶液/.test(g) ? '混合溶液' : '样品溶液')
    };
  }

  _mixedSolutionChemistryDomains() {
    return [
      {
        id: 'constraint', label: '测定约束与方案选型',
        keywords: ['混合溶液', '无法分离', '间接测定', '取样', '稀释', '方案', '比较', '滴定', '电导率'],
        subjects: ['chemistry']
      },
      {
        id: 'titration', label: '硝酸银滴定法',
        keywords: ['滴定', '硝酸银', '沉淀', '氯离子', '银离子', '物质的量浓度', '标准溶液', '终点'],
        subjects: ['chemistry']
      },
      {
        id: 'conductivity', label: '电导率法',
        keywords: ['电导率', '电解质', '导电', '离子浓度', '标准曲线', '溶液'],
        subjects: ['chemistry', 'physics']
      },
      {
        id: 'calc', label: '数据处理与换算',
        keywords: ['物质的量', '浓度', '计算', '误差', '统计', '平行', '换算', '摩尔'],
        subjects: ['math', 'chemistry']
      },
      {
        id: 'report', label: '结论与应用',
        keywords: ['报告', '分析', '比较', '结论', '安全', '标准', '含量'],
        subjects: ['chemistry', 'chinese', 'math']
      }
    ];
  }

  _directSolutionChemistryDomains() {
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

  /** 消费决策类应排除的研发/装置课节点 */
  _isRdEngineeringNodeName(name, goal) {
    const n = String(name || '');
    if (!this._isConsumerDecisionGoal(goal)) return false;
    return /电解池|原电池|程序控制|电磁感应|电池温度|传感器|数据采集|算法概念|模块化|物联网|闭环控制|电解(?!质)|逆变|并网装置/.test(n);
  }

  _parseGoalSubject(goal) {
    const g = String(goal || '').trim();
    let subject = g;
    const m = g.match(/^(?:设计|制作|开发|建造|完成|策划|撰写|探究|调查|分析|探寻|探索|研究|调研|重塑|改造|优化|重建|更新|升级|整治|组织|开展|修复|翻新)(?:一个|一款|一份|一组|一次)?\s*(.+)$/);
    if (m) subject = m[1].trim();
    subject = subject.replace(/^(?:关于|围绕|有关)\s*/, '').replace(/[，。；].*$/, '').slice(0, 36);
    return subject || g.slice(0, 36);
  }

  _inferTopicKind(goal, subject) {
    const g = String(goal || '');
    if (/低空经济|低空飞行|低空空域|空域管理|通航产业|城市空中交通|eVTOL|低空物流|通用航空/.test(g)) return 'industry-innovation';
    if (/太空馆|天文馆|航天馆|科技馆|博物馆|展厅|展陈|太空.*馆|天文.*馆/.test(g) || (/馆|展厅|展览/.test(g + subject) && /重塑|改造|整治|升级|策展|布展|失控|翻新|重建|优化/.test(g))) return 'exhibition-redesign';
    if (/探寻|探索|研究|调研/.test(g) && /创新|产业|经济|行业/.test(g)) return 'industry-innovation';
    if (/种植|栽培|养花|月季|花卉|玫瑰|蔬菜|种菜|盆栽|园艺|养殖|养蚕|花坛|绿化|阳台种/.test(g)) return 'planting-cultivation';
    return 'subject-anchored';
  }

  _plantingCropLabel(goal) {
    const g = String(goal || '');
    const m = g.match(/月季|玫瑰|番茄|黄瓜|辣椒|白菜|菠菜|多肉|薰衣草|向日葵|郁金香|菊花|荷花|草莓|葡萄|玉米|小麦|蚕|百合|牡丹/);
    return m ? m[0] : '植物';
  }

  _plantingCultivationDomains(goal) {
    const crop = this._plantingCropLabel(goal);
    const subject = this._parseGoalSubject(goal);
    return [
      { id: 'taxonomy', label: '植物识别与分类', keywords: [crop, subject, '植物', '分类', '特征', '结构', '器官', '绿色'], subjects: ['science', 'biology'] },
      { id: 'growth', label: '生长与环境条件', keywords: [crop, '生长', '光合', '呼吸', '种子', '萌发', '根', '蒸腾', '环境', '水分'], subjects: ['science', 'biology'] },
      { id: 'cultivate', label: '栽培实操', keywords: [crop, '种植', '栽培', '土壤', '浇水', '施肥', '扦插', '移栽', '步骤', '养护'], subjects: ['science', 'biology'] },
      { id: 'observe', label: '生长观察记录', keywords: [crop, '观察', '记录', '测量', '数据', '图表', '变化', '高度', '叶片'], subjects: ['science', 'math', 'biology'] },
      { id: 'share', label: '种植日记与分享', keywords: [crop, '日记', '报告', '总结', '分享', '说明', '写作'], subjects: ['chinese'] },
    ];
  }

  _isPlantingCultivationGoal(goal) {
    return this._inferTopicKind(String(goal || ''), this._parseGoalSubject(goal)) === 'planting-cultivation';
  }

  _buildTopicKeywords(goal, subject, kind) {
    const g = String(goal || '');
    const base = [subject];
    if (/太空|天文|航天|行星|月球|宇宙/.test(g + subject)) base.push('太阳系', '天文', '太空', '月球', '科学');
    if (/馆|展厅|展览|展陈/.test(g + subject)) base.push('展览', '展陈', '科普', '布局', '设计');
    if (/低空|空域|通航|无人机/.test(g + subject)) base.push('低空经济', '空域', '无人机', '飞行');
    if (kind === 'exhibition-redesign') base.push('调查', '方案', '说明', '统计', '设计', '展示');
    if (kind === 'industry-innovation') base.push('产业', '创新', '调研', '政策', '可行性');
    if (kind === 'planting-cultivation' || /种植|栽培|月季|花卉|蔬菜|盆栽|园艺|养殖|养蚕/.test(g + subject)) {
      base.push('植物', '分类', '生长', '光合', '种子', '萌发', '栽培', '根系', '蒸腾', '观察', '记录');
    }
    for (let i = 0; i < subject.length - 1; i++) {
      const w = subject.slice(i, i + 2);
      if (w.length === 2 && !/[的与及了在]$/.test(w)) base.push(w);
    }
    return [...new Set(base)].slice(0, 12);
  }

  _inferDeliverableHint(goal, subject, kind) {
    if (kind === 'exhibition-redesign') return `「${subject}」改造方案册（现状诊断表+展陈设计图+整改实施清单+开放验收表）`;
    if (kind === 'industry-innovation') return `「${subject}」创新方案报告（场景调研+政策要点+可行性论证）`;
    if (kind === 'planting-cultivation') return `「${subject}」种植观察日记（植物分类笔记+栽培记录表+生长数据图表+总结）`;
    if (/报告|调查|论文|倡议|方案/.test(goal)) return `「${subject}」专题报告（含调研数据与可检查结论）`;
    if (/设计|制作|开发|建造/.test(goal)) return `可展示的「${subject}」作品+过程记录+说明文档`;
    return `「${subject}」项目成果包（可展示交付物+过程记录+说明）`;
  }

  /** 从用户目标提取核心主题（与服务端 extractTopicProfile 对齐，任何题目都必须锚定） */
  _extractTopicProfile(goal) {
    const g = String(goal || '').trim();
    const presets = [
      {
        test: /低空经济|低空飞行|低空空域|空域管理|通航产业|城市空中交通|UAM|eVTOL|低空物流|通用航空/,
        coreTopic: '低空经济',
        definition: '指在约1000–3000米低空空域内，以无人机物流配送、低空出行、应急救援、农业植保、巡检等飞行活动带动的新兴产业',
        keywords: ['低空经济', '低空', '空域', '通航', '无人机', '低空物流', '飞行', '航空', '交通', '应急救援', '植保', '政策', '法规', '安全', '产业'],
        banInSteps: ['现代物流管理', '智慧城市', '工程设计思维', '环境搭建', '硬件组件', '一般物流', '原型驱动迭代', 'MVP'],
        deliverableHint: '低空经济创新方案报告（场景调研+政策/空域要点+技术可行性+试点建议）',
        kind: 'industry-innovation',
      },
    ];
    for (const p of presets) {
      if (p.test.test(g)) return { ...p, rawGoal: g, matched: true };
    }
    const subject = this._parseGoalSubject(g);
    const kind = this._inferTopicKind(g, subject);
    const banCommon = ['原型驱动迭代', 'MVP', '快速原型', '递进式实施', '浸润式场景', '硬件准备', '环境搭建', '工程设计思维', '招生简章', '现代物流管理', '智慧城市'];
    if (kind === 'industry-innovation') {
      const core = /低空经济/.test(g) ? '低空经济' : (g.match(/(?:.+?经济|.+?产业|.+?行业)/)?.[0]?.slice(0, 24) || subject);
      return {
        rawGoal: g, matched: true, coreTopic: core, kind,
        definition: `围绕「${core}」开展创新探究，须结合真实产业场景、政策或技术应用`,
        keywords: this._buildTopicKeywords(g, core, kind),
        banInSteps: [...banCommon, '硬件组件', '一般物流'],
        deliverableHint: this._inferDeliverableHint(g, core, kind),
      };
    }
    if (kind === 'exhibition-redesign') {
      return {
        rawGoal: g, matched: true, coreTopic: subject, kind,
        definition: `对「${subject}」进行现状诊断、主题策划、展陈设计与整改实施，交付可验收的改造方案`,
        keywords: this._buildTopicKeywords(g, subject, kind),
        banInSteps: [...banCommon, '程序设计', '电解池', '搭建原型'],
        deliverableHint: this._inferDeliverableHint(g, subject, kind),
      };
    }
    if (kind === 'planting-cultivation') {
      const crop = this._plantingCropLabel(g);
      return {
        rawGoal: g, matched: true, coreTopic: subject, kind, crop,
        definition: `围绕「${subject}」学习植物分类与生长原理，完成${crop}栽培并持续观察记录`,
        keywords: this._buildTopicKeywords(g, subject, kind),
        banInSteps: [...banCommon, '程序设计', '牛顿', '化学方程式', '电解池'],
        deliverableHint: this._inferDeliverableHint(g, subject, kind),
      };
    }
    return {
      rawGoal: g, matched: true, coreTopic: subject, kind: 'subject-anchored',
      definition: `本项目必须围绕「${subject}」展开，不得替换为其他主题`,
      keywords: this._buildTopicKeywords(g, subject, kind),
      banInSteps: banCommon,
      deliverableHint: this._inferDeliverableHint(g, subject, kind),
    };
  }

  _isIndustryInnovationGoal(goal) {
    return this._extractTopicProfile(goal).kind === 'industry-innovation';
  }

  _isExhibitionRedesignGoal(goal) {
    return this._extractTopicProfile(goal).kind === 'exhibition-redesign';
  }

  _industryInnovationDomains(goal) {
    const t = this._extractTopicProfile(goal);
    const topic = t.coreTopic || '产业创新';
    return [
      { id: 'background', label: `${topic}背景与政策`, keywords: [topic, '产业', '政策', '法规', '空域', '发展', '规划', '经济'], subjects: ['geography', 'history', 'chinese'] },
      { id: 'scenarios', label: '应用场景调研', keywords: [topic, '物流', '出行', '应急', '植保', '巡检', '配送', '应用', '场景', '需求'], subjects: ['geography', 'chinese', 'math'] },
      { id: 'tech', label: '技术原理支撑', keywords: ['飞行', '航空', '无人机', '导航', '通信', '动力', '电池', '抛体', '牛顿', '安全'], subjects: ['physics', 'info-tech', 'science'] },
      { id: 'analysis', label: '数据与可行性分析', keywords: ['统计', '数据', '调查', '成本', '效益', '比较', '分析', '图表', '百分比'], subjects: ['math', 'chinese'] },
      { id: 'proposal', label: '创新方案与报告', keywords: ['方案', '创新', '建议', '报告', '论证', '说明', '可行性', '试点'], subjects: ['chinese', 'geography'] },
    ];
  }

  /** 项目类型分类（与服务端 classifyProjectType 对齐） */
  _classifyProjectType(goal) {
    const g = String(goal || '');
    if (this._isConsumerDecisionGoal(g)) return 'consumer-decision';
    if (/海报|短视频|微电影|动画|漫画|插画|绘画|展览|策展|广告|品牌|视觉|游戏设计|作曲|音乐创作|手工艺|表演|舞台|摄影|logo|标志设计|文创|周边设计/.test(g)) return 'creative-media';
    if (/诗歌|诗集|现代诗|诗词|写诗|小说|剧本|散文|绘本|故事集|演讲|辩论|文学|翻译|双语|新闻稿|采访稿|写一[篇组]|作文|征文|朗诵|文集|杂志|读后感|书评|话剧|文章/.test(g)) return 'humanities-literary';
    if (/创业|商业计划|营销|市场推广|运营|理财|零花钱|压岁钱|市场调研|义卖|跳蚤市场|店铺|定价|商业模式|经济效益|盈利|众筹|招商|品牌策划/.test(g)) return 'business-economics';
    if (/健康|营养|饮食|食谱|减脂|减肥|健身|锻炼|运动会?|近视|视力|护眼|睡眠|作息|心理|情绪|压力|安全|急救|防溺水|防火|防疫|卫生|疾病|人体|体重|身高/.test(g)) return 'health-life';
    if (this._isPlantingCultivationGoal(g)) return 'planting-cultivation';
    if (/烹饪|烘焙|美食|菜谱|料理|手工|编织|缝纫|收纳|整理|维修|清洁|打扫|劳动/.test(g)) return 'labor-practice';
    if (/活动策划|策划.{0,6}(活动|晚会|联欢|运动会|典礼|节|比赛)|联欢会|晚会|文艺汇演|毕业典礼|生日会|出游|旅行|研学|游学|路线规划|时间管理|班级布置|布置教室|嘉年华|游园/.test(g)) return 'life-planning';
    if (/田野|问卷|访谈|社区|民俗|传统文化|非遗|人口|城乡|社会现象|调研报告|公众.{0,4}认知|居民|乡土|口述史/.test(g)) return 'social-inquiry';
    if (this._isExhibitionRedesignGoal(g)) return 'exhibition-redesign';
    if (this._isIndustryInnovationGoal(g)) return 'industry-innovation';
    if (/工坊|鲁班|榫卯|古典.*风格|木结构|建筑模型|微缩|传统建筑|斗拱|飞檐/.test(g)) return 'maker-workshop';
    if (/火箭|导弹|发射|机器人|物流机器人|医院.*机器人|电路|机械|硬件|装置|App|应用程序|小程序|网站|系统开发|3D打印|传感|智能|温控|储能|光伏|发电|搭建|制作|工程|发明|物联网|编程实现/.test(g)) return 'engineering';
    if (/无人机|原型/.test(g) && /设计|制作|研发|装置|系统|搭建|开发/.test(g)) return 'engineering';
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
      'planting-cultivation': [
        { id: 'taxonomy', label: '植物识别与分类', keywords: ['植物', '分类', '特征', '结构', '器官', '绿色'], subjects: ['science', 'biology'] },
        { id: 'growth', label: '生长与环境', keywords: ['生长', '光合', '呼吸', '种子', '萌发', '根', '蒸腾'], subjects: ['science', 'biology'] },
        { id: 'cultivate', label: '栽培实操', keywords: ['种植', '栽培', '土壤', '浇水', '施肥', '移栽', '养护'], subjects: ['science', 'biology'] },
        { id: 'observe', label: '观察记录', keywords: ['观察', '记录', '测量', '数据', '图表', '变化'], subjects: ['science', 'math', 'biology'] },
        { id: 'share', label: '种植日记', keywords: ['日记', '报告', '总结', '分享', '说明'], subjects: ['chinese'] },
      ],
      'labor-practice': [
        { id: 'prepare', label: '认识与准备', keywords: ['认识', '准备', '材料', '工具', '原理', '步骤'], subjects: ['science', 'biology', 'chinese'] },
        { id: 'practice', label: '操作实践', keywords: ['操作', '制作', '种植', '养护', '烹饪', '步骤', '工艺'], subjects: ['science', 'biology'] },
        { id: 'record', label: '观察与记录', keywords: ['观察', '记录', '测量', '数据', '变化', '统计'], subjects: ['science', 'math', 'biology'] },
        { id: 'share', label: '成果与分享', keywords: ['成果', '分享', '展示', '总结', '报告', '改进'], subjects: ['chinese'] },
      ],
      'exhibition-redesign': [
        { id: 'diagnose', label: '现状诊断', keywords: ['问题', '调查', '记录', '失控', '隐患', '现状'], subjects: ['chinese', 'math'] },
        { id: 'theme', label: '主题策划', keywords: ['主题', '天文', '太阳系', '月球', '太空', '科普', '内容'], subjects: ['science', 'chinese'] },
        { id: 'design', label: '展陈设计', keywords: ['布局', '动线', '展板', '设计', '模型', '互动', '展陈'], subjects: ['info-tech', 'chinese', 'math'] },
        { id: 'implement', label: '实施整改', keywords: ['整改', '布置', '预算', '分工', '安全', '清单', '实施'], subjects: ['math', 'chinese'] },
        { id: 'launch', label: '开放验收', keywords: ['验收', '讲解', '宣传', '说明', '展示', '反馈', '开放'], subjects: ['chinese', 'science'] },
      ],
      'industry-innovation': [
        { id: 'background', label: '产业背景与政策', keywords: ['产业', '政策', '法规', '空域', '经济', '交通', '区域', '发展'], subjects: ['geography', 'history', 'chinese'] },
        { id: 'scenarios', label: '应用场景调研', keywords: ['调查', '统计', '数据', '问卷', '场景', '应用', '需求', '物流', '应急'], subjects: ['math', 'chinese', 'geography'] },
        { id: 'tech', label: '技术原理支撑', keywords: ['飞行', '航空', '无人机', '抛体', '牛顿', '运动', '安全'], subjects: ['physics', 'science'] },
        { id: 'analysis', label: '数据可行性分析', keywords: ['统计', '图表', '比较', '分析', '成本', '效益', '数据'], subjects: ['math'] },
        { id: 'proposal', label: '创新方案报告', keywords: ['方案', '创新', '报告', '论证', '说明', '建议'], subjects: ['chinese', 'geography'] },
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
      return this._getChemistryAnalysisProfile(g).mixed
        ? this._mixedSolutionChemistryDomains()
        : this._directSolutionChemistryDomains();
    }
    if (this._isPlantingCultivationGoal(g)) {
      return this._plantingCultivationDomains(g);
    }
    if (this._isExhibitionRedesignGoal(g)) {
      const subject = this._parseGoalSubject(g);
      return [
        { id: 'diagnose', label: '现状诊断', keywords: [subject, '问题', '调查', '记录', '失控', '隐患', '现状'], subjects: ['chinese', 'math'] },
        { id: 'theme', label: '主题策划', keywords: [subject, '主题', '天文', '太阳系', '月球', '太空', '科普', '内容'], subjects: ['science', 'chinese'] },
        { id: 'design', label: '展陈设计', keywords: [subject, '布局', '动线', '展板', '设计', '模型', '互动', '展陈'], subjects: ['info-tech', 'chinese', 'math'] },
        { id: 'implement', label: '实施整改', keywords: [subject, '整改', '布置', '预算', '分工', '安全', '清单', '实施'], subjects: ['math', 'chinese'] },
        { id: 'launch', label: '开放验收', keywords: [subject, '验收', '讲解', '宣传', '说明', '展示', '反馈', '开放'], subjects: ['chinese', 'science'] },
      ];
    }
    if (this._isIndustryInnovationGoal(g)) {
      return this._industryInnovationDomains(g);
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
    if (/工坊|鲁班|榫卯|古典.*风格|木结构|建筑模型|微缩|传统建筑|斗拱|飞檐/.test(g)) {
      return [
        { id: 'survey', label: '调研与风格定义', keywords: ['调研', '风格', '古典', '建筑', '参考', '测量', '场地'], subjects: ['history', 'chinese', 'art'] },
        { id: 'design', label: '方案与图纸', keywords: ['设计', '草图', '立面', '平面', '尺寸', '比例', 'BOM'], subjects: ['math', 'info-tech', 'art'] },
        { id: 'material', label: '材料与工艺', keywords: ['材料', '木材', '榫卯', '胶合', '工具', '安全', '工艺'], subjects: ['science', 'physics'] },
        { id: 'build', label: '搭建与装饰', keywords: ['搭建', '组装', '切割', '打磨', '装饰', '斗拱', '结构'], subjects: ['science', 'physics'] },
        { id: 'accept', label: '验收与展示', keywords: ['验收', '测试', '展示', '报告', '量规', '改进'], subjects: ['chinese', 'math'] },
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

  /** 跨学科泛素养节点（批判性思维、团队协作等），除非题目明确要求 */
  _isGenericTransversalNode(name, goal) {
    const n = String(name || '').trim();
    if (!n || !PBLPathBuilder.GENERIC_TRANSVERSAL_RE.test(n)) return false;
    const g = String(goal || '');
    if (/团队|协作|合作|分工|沟通|管理|领导|批判|创新思维|问题解决|生涯|素养培养/.test(g)) return false;
    return true;
  }

  _isHollowStep(step) {
    const s = String(step || '').trim();
    if (!s || s.length < 12) return true;
    if (PBLPathBuilder.HOLLOW_STEP_RE.test(s)) return true;
    if (/^运用[①②③④⑤⑥⑦⑧⑨⑩\d]+「/.test(s) && /完成本阶段|探究任务/.test(s)) return true;
    if (/^(选择|确定|调研|了解|学习|掌握|认识|编写基础|配置|安装).{0,12}(组件|框架|逻辑|特点|风格|方案|软件|环境)$/.test(s)) return true;
    if (/进行.{0,6}(测试|调研|研究|探究|活动)$/.test(s)) return true;
    if (this._stepActionabilityScore(s) < 3) return true;
    return false;
  }

  _stepActionabilityScore(step) {
    const s = String(step || '');
    if (!s || s.length < 8) return 0;
    let score = 0;
    if (/\d+(\.\d+)?\s*(cm|mm|m|ml|g|kg|℃|°|分钟|小时|天|次|人|题|页|张|帧|行|列)/.test(s)) score += 3;
    if (/\d+[\-–~至]\d+/.test(s)) score += 2;
    if (/≥|≤|不少于|不超过|精确到|至少|至多/.test(s)) score += 2;
    if (/表格|清单|记录表|草图|立面|平面|BOM|问卷|提纲|甘特|量规|检查表|数据表|照片|截图|附录/.test(s)) score += 2;
    if (/填写|绘制|称量|测量|焊接|切割|打磨|组装|编程|调试|访谈|统计|撰写|标注|拍照|导出|打印/.test(s)) score += 1;
    if (PBLPathBuilder.HOLLOW_STEP_RE.test(s)) score -= 4;
    if (/^(选择|确定|了解|学习|掌握|认识|编写基础)/.test(s)) score -= 2;
    return score;
  }

  _areHollowSteps(steps) {
    if (!Array.isArray(steps) || !steps.length) return true;
    const hollow = steps.filter(s => this._isHollowStep(s)).length;
    if (hollow >= Math.ceil(steps.length * 0.5)) return true;
    const avg = steps.reduce((a, s) => a + this._stepActionabilityScore(s), 0) / steps.length;
    return avg < 2.5;
  }

  _pickConcreteSteps(llmSteps, bpSteps, contextual) {
    const normalize = (steps) => {
      if (!Array.isArray(steps) || !steps.length) return null;
      const good = steps.filter(s => !this._isHollowStep(s));
      if (!good.length) return null;
      const score = good.reduce((a, s) => a + this._stepActionabilityScore(s), 0);
      return { steps: good.slice(0, 4), score };
    };
    const ranked = [
      { ...normalize(contextual), w: 4, src: contextual },
      { ...normalize(bpSteps), w: 3 },
      { ...normalize(llmSteps), w: 2 },
    ].filter(x => x.steps?.length);
    if (ranked.length) {
      ranked.sort((a, b) => (b.score + b.w * 2) - (a.score + a.w * 2));
      return ranked[0].steps;
    }
    if (contextual?.length) return contextual.slice(0, 4);
    if (bpSteps?.length) return bpSteps.slice(0, 4);
    return (llmSteps || []).slice(0, 4);
  }

  /** 从用户输入提取交付物锚点 — 一切任务步骤必须围绕此展开，禁止套其他项目模板 */
  _goalProfile(goal, blueprint = null) {
    const g = String(goal || '').trim();
    let artifact = g;
    const lead = g.match(/^(?:设计|制作|开发|建造|完成|策划|撰写|探究|调查|分析|探寻|探索|研究|调研|重塑|改造|优化|重建|更新|升级|整治)(?:一个|一款|一份|一组|一次)?\s*(.+)$/);
    if (lead) artifact = lead[1].trim();
    artifact = artifact.replace(/[，。；].*$/, '').slice(0, 72);

    const topic = this._extractTopicProfile(g);
    const domains = {
      woodwork: /工坊|鲁班|榫卯|木结构|古典|斗拱|飞檐|建筑模型|微缩|木作/.test(g),
      robot: (/机器人|物流机器人|循迹|机械臂|自动驾驶/.test(g) || (/无人机/.test(g) && /设计|制作|研发|搭建|开发|装置/.test(g))) && !topic.matched,
      software: /App|程序|软件|系统开发|小程序|网站|编程|算法/.test(g),
      writing: /作文|倡议|报告|诗|文章|演讲|说明文|创新/.test(g),
      survey: /调查|问卷|访谈|统计|探寻|探索|调研/.test(g),
      lowAltitude: topic.kind === 'industry-innovation' && topic.coreTopic === '低空经济',
      industry: topic.kind === 'industry-innovation',
      exhibition: topic.kind === 'exhibition-redesign',
      planting: topic.kind === 'planting-cultivation',
    };

    const mismatchRes = [];
    if (domains.lowAltitude || domains.industry) {
      mismatchRes.push(/现代物流管理|智慧城市|工程设计思维|环境搭建|硬件组件|编写.*控制|榫卯|斗拱|焊接|搭建原型|MVP|快速原型|程序设计|电解池/);
    }
    if (domains.exhibition) {
      mismatchRes.push(/原型驱动迭代|快速原型|MVP|环境搭建|程序设计|电解池|招生简章|现代物流|智慧城市|工程设计思维/);
    }
    if (domains.planting) {
      mismatchRes.push(/原型驱动迭代|浸润式场景|快速原型|MVP|硬件准备|程序设计|牛顿定律|化学方程式|电解池|机械玩具|机器人/);
    }
    if (topic.matched) {
      mismatchRes.push(/递进式实施|原型驱动迭代|可展示的项目原型/);
    }
    if (domains.woodwork && !domains.robot && !domains.software) {
      mismatchRes.push(/硬件组件|环境搭建|编写.*控制逻辑|基础控制|配置.*框架|安装.*软件|电机驱动|传感器模块|接口协议|部署上线/);
    }
    if (domains.robot && !domains.woodwork) {
      mismatchRes.push(/斗拱|飞檐|榫卯|木工锯|刨子|古典建筑纹样/);
    }
    if (domains.writing && !domains.robot && !domains.software) {
      mismatchRes.push(/焊接|电路|传感器|电机|BOM表|下料/);
    }

    return {
      raw: g,
      artifact,
      domains,
      mismatchRes,
      topic,
      blueprintDeliverable: blueprint?.deliverable || '',
    };
  }

  _stepDomainMismatch(step, profile) {
    const s = String(step || '');
    if (!s || !profile?.mismatchRes?.length) return false;
    return profile.mismatchRes.some(re => re.test(s));
  }

  _goalTokens(artifact) {
    const t = String(artifact || '').replace(/\s/g, '');
    const tokens = [];
    if (t.length >= 4) tokens.push(t.slice(0, 4));
    for (let i = 0; i < t.length - 1; i++) {
      const w = t.slice(i, i + 2);
      if (w.length === 2 && !/[的与及了在]$/.test(w)) tokens.push(w);
    }
    return [...new Set(tokens)].slice(0, 8);
  }

  _stepAnchoredToGoal(step, profile) {
    const s = String(step || '');
    if (!s) return false;
    if (s.includes(profile.artifact)) return true;
    const tokens = this._goalTokens(profile.artifact);
    return tokens.some(t => t.length >= 2 && s.includes(t));
  }

  _phaseContext(phase, blueprint) {
    const subIds = phase?.subsystemIds || [];
    const subs = (blueprint?.subsystems || []).filter(s => subIds.includes(s.id));
    return {
      phaseName: String(phase?.phase || phase?.name || '').trim(),
      deliverable: String(phase?.deliverable || '').trim(),
      hints: (phase?.knowledgeHints || []).slice(0, 4),
      subsystems: subs.map(s => s.name).filter(Boolean),
      subDesc: subs.map(s => s.description).filter(Boolean).join('；'),
    };
  }

  _expandStepAnchoredToGoal(rawStep, goal, phase, profile, ctx, stepIdx) {
    const artifact = profile.artifact;
    const hints = ctx.hints.join('、') || '本阶段相关知识';
    const phaseName = ctx.phaseName || `阶段${stepIdx + 1}`;
    const outName = ctx.deliverable || `${artifact}·${phaseName}产出`;
    const verbs = ['记录', '完成', '制作', '撰写', '测量', '绘制'];
    const verb = verbs[stepIdx % verbs.length];
    const blob = `${phaseName} ${ctx.subsystems.join(' ')} ${rawStep || ''}`;

    if (profile.domains.planting || /植物|种植|栽培|园艺|光合|萌发|月季|花卉/.test(blob)) {
      const crop = profile.topic?.crop || this._plantingCropLabel(goal);
      if (/分类|识别|特征|结构|器官/.test(blob)) {
        return `辨认「${artifact}」中的${crop}：绘制植物结构简图并标注根/茎/叶/花，填写分类特征表（≥4项可观察特征）`;
      }
      if (/生长|光合|萌发|环境|水分|根|蒸腾/.test(blob)) {
        return `学习${crop}生长原理：查阅资料说明光合/根系吸收/萌发条件，制作「${artifact}」生长条件对照表（光照/水分/温度各1列）`;
      }
      if (/栽培|种植|土壤|浇水|施肥|移栽|扦插|养护/.test(blob)) {
        return `完成「${artifact}」${crop}栽培实操：按步骤记录挖穴→定植→浇透水，填写栽培日志（日期/操作/天气/问题各1条）`;
      }
      if (/观察|记录|测量|数据|图表|变化/.test(blob)) {
        return `每周2次测量「${artifact}」${crop}株高/叶片数，录入表格并绘制折线图（至少4个数据点）`;
      }
      if (/日记|报告|总结|分享/.test(blob)) {
        return `撰写「${artifact}」种植观察日记（≥300字）：含分类认识、栽培过程、生长变化与1条改进建议`;
      }
      return `围绕「${artifact}」完成${phaseName}：结合 ${hints} 整理${crop}种植资料并填写可核查记录表`;
    }
    if (profile.domains.exhibition || /馆|展厅|展陈|太空|天文|科普/.test(blob)) {
      if (/诊断|现状|问题|失控|隐患/.test(blob)) {
        return `走访「${artifact}」并填写现状诊断表：拍摄≥5张问题点位照片，列出≥8条失控/安全隐患（附整改优先级）`;
      }
      if (/主题|策划|内容|天文|太空/.test(blob)) {
        return `为「${artifact}」策划展陈主题：确定1条主线+3个分区主题，各写100字科普文案并标注对应课标知识点`;
      }
      if (/设计|布局|动线|展板|展陈/.test(blob)) {
        return `绘制「${artifact}」展陈平面图（A3）：标注参观动线、3处互动点位尺寸与材料，附展板草图2张`;
      }
      if (/整改|实施|布置|预算/.test(blob)) {
        return `编制「${artifact}」整改实施清单：列10项任务（负责人/工期/预算/安全注意），合计经费并附物资表`;
      }
      if (/验收|开放|讲解|宣传|展示/.test(blob)) {
        return `完成「${artifact}」开放验收：按检查表逐项打勾，录制3分钟讲解视频或撰写300字宣传稿`;
      }
      return `围绕「${artifact}」完成${phaseName}：结合 ${hints} 整理展陈资料并产出可核查记录表`;
    }
    if (profile.domains.lowAltitude || profile.domains.industry || /产业|政策|空域|低空|场景/.test(blob)) {
      if (/政策|背景|产业|空域|法规/.test(blob)) {
        return `围绕「${artifact}」梳理${phaseName}：检索≥3条权威政策/行业资料并摘录要点，制成对照表（来源/日期/与项目关系各1列）`;
      }
      if (/场景|调研|问卷|需求|应用/.test(blob)) {
        return `围绕「${artifact}」开展${phaseName}：选定1个低空应用场景并设计10题问卷，回收≥20份有效答卷并制成统计图表`;
      }
      if (/技术|飞行|安全|原理|参数/.test(blob)) {
        return `为「${artifact}」整理${phaseName}：查阅飞行高度/载重/续航三类参数并制对比表，附起降安全距离估算示意图1张`;
      }
      if (/方案|创新|可行|论证|报告/.test(blob)) {
        return `撰写「${artifact}」${phaseName}：提出1个创新点子（200字场景描述）+成本效益简表+2条落地障碍与对策`;
      }
      return `围绕「${artifact}」完成${phaseName}：结合 ${hints} 整理产业资料并产出可核查记录表（≥5条要点+来源标注）`;
    }
    if (/调研|勘测|现场|需求|资料/.test(blob)) {
      return `围绕「${artifact}」开展${phaseName}：列出 5 条可验证需求并制成优先级表，附 3 张现场/参考照片（文件命名 P${stepIdx + 1}-01~03）`;
    }
    if (/设计|方案|草图|图纸|规划|风格|定义/.test(blob)) {
      return `为「${artifact}」绘制${phaseName}草图（A3 或 CAD 均可），标注 ≥5 处关键尺寸，并结合 ${hints} 写 150 字方案说明`;
    }
    if (/材料|采购|物料|预算|成本|BOM/.test(blob)) {
      return `编制「${artifact}」${phaseName}物料清单（名称/规格/数量/单价/小计），合计预算并注明 2 条安全注意事项`;
    }
    if (/搭建|制作|组装|加工|实施|原型|开发|结构|装饰|修缮/.test(blob)) {
      return `${verb}「${artifact}」${phaseName}核心工序：按方案操作并填写过程记录表（时间、工具、问题各 ≥1 条），拍照 ≥3 张`;
    }
    if (/软件|编程|控制|算法|电路|调试/.test(blob)) {
      return `实现「${artifact}」${phaseName}功能点 1 个，附测试用例 3 条（输入/预期/实测），保存调试日志截图`;
    }
    if (/测试|验收|交付|展示|复盘|答辩/.test(blob)) {
      return `按检查表验收「${artifact}」${phaseName}成果：逐项打勾，整理交付包（${outName} + 过程记录 + 300 字说明）`;
    }
    if (ctx.subDesc) {
      return `${verb}「${artifact}」${phaseName}：${ctx.subDesc.slice(0, 80)}，产出「${outName}」并附可核查记录`;
    }
    return `${verb}「${artifact}」${phaseName}任务（结合 ${hints}），交付「${outName}」并附 1 份签字确认的过程记录表`;
  }

  _concretizePhaseSteps(goal, phase, phaseIndex, totalPhases, archetype, blueprint) {
    const profile = this._goalProfile(goal, blueprint);
    const ctx = this._phaseContext(phase, blueprint);
    const raw = Array.isArray(phase?.steps) ? phase.steps : [];
    const seen = new Set();
    const steps = [];

    raw.forEach((st, i) => {
      const s = String(st || '').trim();
      if (!s) return;
      let out = s;
      const needsRewrite = this._isHollowStep(s) || this._stepDomainMismatch(s, profile)
        || (!this._stepAnchoredToGoal(s, profile) && this._stepActionabilityScore(s) < 4);
      if (needsRewrite) {
        out = this._expandStepAnchoredToGoal(s, goal, phase, profile, ctx, i);
      }
      if (!seen.has(out)) {
        seen.add(out);
        steps.push(out);
      }
    });

    let idx = steps.length;
    while (steps.length < 2) {
      const filler = this._expandStepAnchoredToGoal('', goal, phase, profile, ctx, idx++);
      if (!seen.has(filler)) {
        seen.add(filler);
        steps.push(filler);
      } else break;
    }
    return steps.slice(0, 4);
  }

  _concretizeDeliverable(goal, phaseName, role, fallback, blueprint) {
    const profile = this._goalProfile(goal, blueprint);
    const phase = String(phaseName || '');
    const art = profile.artifact;
    if (fallback && fallback.length >= 8 && !/阶段成果|探究任务|素养|能力/.test(fallback)) return fallback;
    if (/调研|勘测|现场|需求/.test(phase)) return `「${art}」调研记录表（需求清单+照片编号）`;
    if (/设计|方案|草图|图纸|风格/.test(phase)) return `「${art}」${phase}图册（标注尺寸的方案稿）`;
    if (/材料|采购|物料|预算/.test(phase)) return `「${art}」材料/经费清单（含规格与合计）`;
    if (/测试|验收|交付|展示/.test(phase)) return `「${art}」验收检查表 + 展示说明（可现场核查）`;
    if (/搭建|制作|组装|原型|装饰|实施/.test(phase)) return `「${art}」${phase}实物/模型 + 过程照片（≥3 张）`;
    return profile.blueprintDeliverable || `「${art}」阶段成果（可展示、可打分）`;
  }

  _concretizeBlueprint(goal, blueprint, archetype = null) {
    if (!blueprint?.schemes?.length) return blueprint;
    const profile = this._goalProfile(goal, blueprint);
    const bp = JSON.parse(JSON.stringify(blueprint));

    if (!bp.deliverable || /素养|能力|精神|阶段成果$/.test(bp.deliverable) || bp.deliverable.length < 8) {
      bp.deliverable = profile.blueprintDeliverable || `可交付的「${profile.artifact}」成果包（作品+记录+说明）`;
    }

    bp.schemes = bp.schemes.map(scheme => ({
      ...scheme,
      phases: (scheme.phases || []).map((p, i, arr) => {
        const role = i === 0 ? 'foundation' : (i < arr.length - 1 ? 'bridge' : 'core');
        const steps = this._concretizePhaseSteps(goal, p, i, arr.length, archetype, bp);
        const deliverable = this._concretizeDeliverable(goal, p.phase, role, p.deliverable, bp);
        const tools = p.tools || this._inferPhaseTools(goal, p.phase, profile);
        const acceptance = steps.map((st, j) => `□ ${String(st).slice(0, 48)}${String(st).length > 48 ? '…' : ''}（有记录/照片/签字）`);
        return { ...p, steps, deliverable, tools, acceptance };
      }),
    }));
    return bp;
  }

  _inferPhaseTools(goal, phaseName, profileOrType) {
    const phase = String(phaseName || '');
    const profile = profileOrType?.artifact ? profileOrType : this._goalProfile(goal);
    const g = profile.raw || goal;
    if (/调研|勘测/.test(phase)) return ['记录表模板', '相机/手机', profile.domains.woodwork ? '卷尺' : '数据来源清单'];
    if (/设计|草图|图纸|风格/.test(phase)) {
      return profile.domains.software ? ['绘图/CAD 或设计工具', '尺寸标注规范'] : ['A3纸或绘图纸', '铅笔尺规', '标注笔'];
    }
    if (/材料|采购|预算/.test(phase)) return ['物料清单模板', '计算器', '询价记录表'];
    if (/搭建|制作|组装|结构|装饰/.test(phase)) {
      if (profile.domains.robot) return ['螺丝刀/扳手', '万用表', '调试线', '安全防护'];
      if (profile.domains.woodwork) return ['手锯/砂纸', '木工胶', '角尺', '护目镜'];
      return ['分工表', '过程记录表', '相机'];
    }
    if (/软件|编程|控制|电路/.test(phase) || profile.domains.software) return ['开发环境', '版本记录', '测试用例表'];
    if (/测试|验收|展示/.test(phase)) return ['验收量规', '展示稿模板', '相机'];
    if (/撰写|报告|作文|倡议/.test(phase) || profile.domains.writing) return ['文稿模板', '修改痕迹记录', '格式规范'];
    return ['过程记录表', '相机'];
  }

  _pickConcreteDeliverable(lp, bp, role, goal) {
    const vague = d => !d || /素养|能力|精神|品格|阶段成果物?$|阶段原型|探究任务/.test(String(d)) || String(d).length < 6;
    const lpD = lp?.deliverable || lp?.output || '';
    const bpD = bp?.deliverable || '';
    if (!vague(lpD)) return lpD;
    if (!vague(bpD)) return bpD;
    return this._defaultDeliverable(role || 'core', goal);
  }

  /** 主线相关性：STEM/工程项目宁缺毋滥，拒绝语文/地理/无关生物等 */
  _isMainlineRelevant(node, goal, domains) {
    if (!node) return false;
    const g = String(goal || '');
    const domainList = domains && domains.length ? domains : this._inferProjectDomains(g);
    const name = String(node.name || '');
    if (this._isGenericTransversalNode(name, g)) return false;
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
      if (this._getChemistryAnalysisProfile(g).mixed) {
        if (/^(数据收集|数据的描述|统计图的认识)$/.test(name)) return false;
        if (/质量分数|配制溶液/.test(name) && !/滴定|物质的量|离子|摩尔|电导/.test(text)) return false;
      }
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

  _filterMainlineNodes(matched, goal, archetype = null) {
    const domains = this._inferProjectDomains(goal);
    let pool = matched;
    if (archetype) {
      pool = matched.filter(n => !this._isArchetypeBanned(n, archetype));
    }
    if (domains.length || this._isStemProjectGoal(goal)) {
      pool = pool.filter(n => this._isMainlineRelevant(n, goal, domains));
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
      const cap = this._getChemistryAnalysisProfile(goal);
      if (node.subject === 'chemistry') score += 8;
      if (cap.mixed) {
        if (/滴定|硝酸银|沉淀|离子反应|物质的量|摩尔|化学方程式|电解质|电离|氯离子/.test(node.name || '')) score += 9;
        if (/电导|导电|电阻率|电解质溶液/.test(node.name || '')) score += 7;
        if (/质量分数|配制溶液|称量溶解/.test(node.name || '') && !/滴定|物质的量|离子/.test(node.name || '')) score -= 10;
      } else {
        if (/溶液|浓度|溶解|溶质|溶剂|质量分数|配制|氯化钠/.test(node.name || '')) score += 6;
      }
      if (node.subject === 'math' && /数据|统计|图表|百分比|计算/.test(node.name || '')) score += 3;
      if (node.subject === 'physics' && cap.mixed && /电导|导电|电解质/.test(node.name || '')) score += 5;
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

  _mapMatchedEntries(result, candidates, complex, minConf, goal = '', archetype = null) {
    const out = [];
    (result.matched || []).forEach(m => {
      const idx = this._parseMatchIndex(m, candidates.length);
      if (idx < 0) return;
      if ((m.confidence || 0) < minConf) return;
      const node = candidates[idx];
      if (complex && this._excludeForComplexProject(node)) return;
      if (this._isGenericTransversalNode(node.name, goal)) return;
      if (archetype && this._isArchetypeBanned(node, archetype)) return;
      if (archetype && !this._meetsArchetypeGrade(node, archetype)) return;
      out.push({
        ...node,
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
      if (this._getChemistryAnalysisProfile(goal).mixed) {
        return [
          { name: '滴定管/移液管读数与润洗规范', reason: '定量滴定操作的器皿使用细节，课标实验较少展开' },
          { name: '硝酸银标准溶液的配制与保存', reason: '沉淀滴定实验的关键试剂准备，需课外实验指导' },
          { name: '电导率仪温度补偿与校准', reason: '电导率法测定须控制温度影响，仪器操作超出课本' },
          { name: '食堂/汤水取样卫生与代表性', reason: '真实样品取样规范，食品安全与数据代表性需额外说明' },
        ];
      }
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

  /** 课标外知识点：优先工程注册表按模块绑定，禁止通用套话兜底 */
  _ensureExternalNodes(external, goal, matched, projectBlueprint, archetype = null) {
    const max = PBLPathBuilder.PBL_MAX_EXTERNAL;
    let list = this._mapExternalEntries(external);
    const seen = new Set(list.map(e => String(e.name).toLowerCase()));
    const matchedNames = matched.map(n => n.name);

    const addItem = (item) => {
      if (list.length >= max || !item) return;
      const name = String(item.name || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      const mapped = this._mapExternalEntries([{
        name: item.name,
        reason: item.reason || item.definition || '',
        prerequisites: item.prerequisites || [],
        moduleId: item.moduleId,
        taskSnippet: item.taskSnippet,
      }]);
      if (!mapped.length) return;
      const node = mapped[0];
      if (item.moduleId) {
        node.moduleId = item.moduleId;
        node.matchReason = `模块：${item.moduleId}。${item.reason || ''}${item.taskSnippet ? `；任务：${item.taskSnippet}` : ''}`;
      }
      list.push(node);
      seen.add(name.toLowerCase());
    };

    if (archetype && this._archetypeEngine) {
      this._archetypeEngine.getRegistryExternals(archetype, projectBlueprint, matchedNames, max)
        .forEach(addItem);
    }

    if (!list.length) {
      this._fallbackExternalPool(goal).forEach(addItem);
    }

    return list.slice(0, max);
  }

  _rescueCandidatesFromPool(goal, candidates, limit, archetype = null, blueprint = null) {
    const goalTerms = this._tokenizeGoalTerms(goal);
    const complex = this._isComplexPBLGoal(goal);
    const domains = this._inferProjectDomains(goal);
    if (archetype && this._archetypeEngine) {
      const pool = candidates.filter(n => this._isMainlineRelevant(n, goal, domains));
      const picked = this._archetypeEngine.pickCandidates(
        pool, archetype, blueprint, Math.min(limit, archetype.maxMatched || limit), goalTerms,
        {
          isBanned: n => this._isArchetypeBanned(n, archetype),
          meetsGrade: n => this._meetsArchetypeGrade(n, archetype),
          scoreForModule: (n, m) => this._archetypeEngine.scoreForModule(n, m, goalTerms),
        }
      );
      if (picked.length >= Math.min(3, archetype.minMatched || 3)) {
        return picked.map((n, i) => ({
          ...n,
          confidence: Math.max(0.58, 0.85 - i * 0.04),
          matchReason: n._moduleLabel ? `模块：${n._moduleLabel}。原型层检索匹配` : '原型层模块检索',
          pblRole: i < 1 ? 'foundation' : (i < 3 ? 'bridge' : 'core'),
        }));
      }
    }
    const minScore = archetype ? 8 : 4;
    const withScore = candidates
      .filter(n => this._isMainlineRelevant(n, goal, domains))
      .filter(n => !archetype || !this._isArchetypeBanned(n, archetype))
      .map(n => ({
        ...n,
        _score: this._scoreNodeForGoal(n, goalTerms, null, complex, domains, goal)
      }))
      .filter(n => n._score >= minScore);
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

  _resolvePrerequisiteNames(node) {
    return (node.prerequisites || []).map(pid => {
      const pre = this.unifiedIndex.get(pid);
      return pre?.name || pid;
    }).filter(Boolean);
  }

  _enrichCandidateForMatch(node) {
    return {
      name: node.name,
      grade: node.grade,
      gradeLabel: node.gradeLabel,
      subject: node.subject,
      systemTag: node.systemTag,
      definition: node.definition || (node.curriculum_points || []).join(' ').slice(0, 120),
      prerequisiteNames: this._resolvePrerequisiteNames(node),
    };
  }

  _inferBloomProfile(projectBlueprint) {
    if (typeof PBLBloom !== 'undefined' && PBLBloom.inferBloomFromBlueprint) {
      return PBLBloom.inferBloomFromBlueprint(projectBlueprint);
    }
    return { ceiling: 3, ceilingLabel: 'apply', evidence: [], actionVerbs: [] };
  }

  _isNodeAboveBloomCeiling(node, ceiling) {
    if (typeof PBLBloom !== 'undefined' && PBLBloom.isNodeAboveBloomCeiling) {
      return PBLBloom.isNodeAboveBloomCeiling(node, ceiling);
    }
    return false;
  }

  _mergeBloomProfile(ruleBloom, llmFilter) {
    const ceiling = Math.min(
      ruleBloom?.ceiling || 6,
      parseInt(llmFilter?.bloomCeiling, 10) || ruleBloom?.ceiling || 6
    );
    return {
      ceiling,
      ceilingLabel: ruleBloom?.ceilingLabel || 'apply',
      evidence: [...(ruleBloom?.evidence || []), ...(llmFilter?.bloomEvidence || [])].slice(0, 4),
      actionVerbs: [...new Set([...(ruleBloom?.actionVerbs || []), ...(llmFilter?.actionVerbs || [])])].slice(0, 8),
    };
  }

  _ruleCheckDepEdge(source, target) {
    const srcRole = source.role || source.pblRole || '';
    const tgtRole = target.role || target.pblRole || '';
    if (source.index === target.index) return 'invalid';
    if (tgtRole === 'foundation' && (srcRole === 'core' || srcRole === 'bridge')) return 'reversed';
    if (srcRole === 'core' && tgtRole === 'foundation') return 'invalid';
    const tgtOfficial = target.officialPrereqs || [];
    const srcOfficial = source.officialPrereqs || [];
    if (tgtOfficial.includes(source.name)) return 'valid';
    if (srcOfficial.includes(target.name)) return 'reversed';
    return null;
  }

  _buildDepEdgesForVerify(matchResult, candidates, matched) {
    const idToMatched = new Map();
    matched.forEach((n, i) => idToMatched.set(n.id, { ...n, matchIndex: i }));
    const indexToCandidate = new Map(candidates.map((n, i) => [i, n]));
    const edges = [];
    (matchResult.matched || []).forEach(m => {
      const tgtIdx = this._parseMatchIndex(m, candidates.length);
      if (tgtIdx < 0) return;
      const tgtNode = candidates[tgtIdx];
      const tgtMatched = idToMatched.get(tgtNode.id);
      if (!tgtMatched) return;
      (m.dependsOn || []).forEach(dep => {
        const srcIdx = typeof dep === 'string' ? parseInt(dep, 10) : dep;
        if (!Number.isInteger(srcIdx) || srcIdx < 0 || srcIdx >= candidates.length) return;
        const srcNode = indexToCandidate.get(srcIdx);
        if (!srcNode) return;
        const edgeId = `e${srcIdx}-${tgtIdx}`;
        const srcMatched = matched.find(x => x.id === srcNode.id);
        edges.push({
          id: edgeId,
          sourceIndex: srcIdx,
          targetIndex: tgtIdx,
          sourceName: srcNode.name,
          sourceRole: srcMatched?.pblRole || 'node',
          targetName: tgtNode.name,
          targetRole: m.role || tgtMatched.pblRole || 'node',
          officialPrereqs: this._resolvePrerequisiteNames(tgtNode),
          sourceOfficialPrereqs: this._resolvePrerequisiteNames(srcNode),
        });
      });
    });
    return edges;
  }

  _applyDepVerification(matchResult, verification, candidates) {
    const verdictMap = new Map((verification?.edges || []).map(e => [e.id, e]));
    const patched = (matchResult.matched || []).map(m => ({
      ...m,
      dependsOn: [...(m.dependsOn || [])],
    }));
    patched.forEach(m => {
      const tgtIdx = this._parseMatchIndex(m, candidates.length);
      if (tgtIdx < 0) return;
      const kept = [];
      (m.dependsOn || []).forEach(dep => {
        const srcIdx = typeof dep === 'string' ? parseInt(dep, 10) : dep;
        if (!Number.isInteger(srcIdx)) return;
        const edgeId = `e${srcIdx}-${tgtIdx}`;
        const v = verdictMap.get(edgeId);
        if (!v || v.verdict === 'valid') {
          kept.push(srcIdx);
        } else if (v.verdict === 'reversed') {
          const srcMatch = patched.find(x => this._parseMatchIndex(x, candidates.length) === srcIdx);
          if (srcMatch && !srcMatch.dependsOn.includes(tgtIdx)) {
            srcMatch.dependsOn.push(tgtIdx);
          }
        }
      });
      m.dependsOn = [...new Set(kept)];
    });
    return { ...matchResult, matched: patched };
  }

  async _llmVerifyDepsStage(goal, matchResult, candidates, matched) {
    const edges = this._buildDepEdgesForVerify(matchResult, candidates, matched);
    if (!edges.length) return matchResult;

    const ruleResolved = edges.map(e => {
      const rule = this._ruleCheckDepEdge(
        { name: e.sourceName, role: e.sourceRole, index: e.sourceIndex, officialPrereqs: e.sourceOfficialPrereqs },
        { name: e.targetName, role: e.targetRole, index: e.targetIndex, officialPrereqs: e.officialPrereqs }
      );
      return { ...e, ruleVerdict: rule };
    });
    const needLlm = ruleResolved.filter(e => !e.ruleVerdict);
    let llmVerdicts = { edges: [] };

    if (needLlm.length) {
      try {
        const response = await this._callPBLAnalyzeStage('verify-deps', {
          goal,
          edges: needLlm.map(({ id, sourceName, sourceRole, targetName, targetRole, officialPrereqs }) => ({
            id, sourceName, sourceRole, targetName, targetRole, officialPrereqs,
          })),
        });
        const jsonStr = this._extractJsonObject(response);
        llmVerdicts = JSON.parse(jsonStr);
      } catch (e) {
        console.warn('[PBL] verify-deps 失败，保留规则校验结果:', e.message);
      }
    }

    const allVerdicts = [
      ...ruleResolved.filter(e => e.ruleVerdict).map(e => ({
        id: e.id, verdict: e.ruleVerdict, reason: '规则校验',
      })),
      ...(llmVerdicts.edges || []),
    ];
    return this._applyDepVerification(matchResult, { edges: allVerdicts }, candidates);
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
      const cap = this._getChemistryAnalysisProfile(goal);
      if (cap.mixed) {
        return ({
          foundation: '混合溶液测定约束分析 / 滴定法与电导率法方案比选表',
          bridge: '取样预处理方案 + 硝酸银滴定或电导率标定实验记录表',
          core: '浓度换算结果、平行测定误差分析与结论报告'
        })[role] || '间接测定阶段成果';
      }
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

  _suggestPhaseSteps(goal, group, blueprintPhase = null) {
    if (blueprintPhase?.steps?.length && !this._areHollowSteps(blueprintPhase.steps)) {
      return blueprintPhase.steps.slice(0, 4);
    }
    const nodes = group.nodes || [];
    const kn = nodes.map(n => n.name).filter(Boolean);
    const knRef = kn.map(n => `「${n}」`).join('、') || '本阶段课标知识点';
    const shortGoal = String(goal || '').slice(0, 48);
    const role = group.role || 'core';
    const type = this._classifyProjectType(goal);
    const mk = arr => arr.slice(0, 4);

    if (type === 'social-inquiry') {
      const map = {
        foundation: [
          `围绕「${shortGoal}」写出 1 句可验证的调查问题，确定调查对象与样本量（如本班抽样 20 人）`,
          `设计 8–10 题问卷或访谈提纲（3 道选择题 + 2 道开放题），注明发放渠道与回收截止日`,
        ],
        bridge: [
          `回收问卷并整理为统计表，标注缺失值与 2 份异常答卷的处理方式`,
          `用 ${knRef} 绘制至少 2 种统计图，写出 3 条基于数据的发现（附图表编号）`,
        ],
        core: [
          `归纳 2–3 条结论，每条对应 1 张图表或 1 组原始数据`,
          `撰写 800 字调查报告（摘要/方法/发现/建议），准备 3 分钟答辩要点清单`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'humanities-literary') {
      const map = {
        foundation: [
          `确定作品主题与读者对象，列出 3 篇参考文本并各写 50 字摘抄+批注`,
          `用 ${knRef} 完成立意提纲：中心句、3 个分论点、2 个生活/阅读例证`,
        ],
        bridge: [
          `完成初稿（不少于 600 字或 12 节诗），标注待改的段落编号`,
          `按结构/语言/修辞三项自评表修改 1 轮，记录修改前后对照`,
        ],
        core: [
          `定稿并排版（标题、作者、目录/分节），附 200 字创作说明`,
          `准备朗诵/展示稿与 2 个听众可能提问的回答要点`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'consumer-decision') {
      const map = {
        foundation: [
          `列出家庭用车 5 条真实需求（预算、里程、充电/加油便利性等），制成需求优先级表`,
          `确定 3 个对比维度（5 年总成本、使用场景、环保排放），用 ${knRef} 说明各维度数据来源`,
        ],
        bridge: [
          `收集 2 款候选车型参数，制作 5 年用车成本测算表（购置+能耗+保养）`,
          `用统计图对比两车在目标场景下的关键指标，标注假设条件`,
        ],
        core: [
          `撰写决策报告：推荐车型 + 3 条证据 + 1 条风险与备选方案`,
          `制作 1 页对比海报或答辩幻灯（含图表与结论句）`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'business-economics') {
      const map = {
        foundation: [
          `描述目标用户与 3 个痛点，完成 10 人迷你访谈或问卷并汇总`,
          `用 ${knRef} 列出产品/服务核心功能与竞品差异表`,
        ],
        bridge: [
          `制作成本表（材料/人工/推广），用百分比或函数估算盈亏平衡点`,
          `设计 1 页商业计划摘要：定价、渠道、首月运营动作`,
        ],
        core: [
          `模拟运营 1 周并记录收支，更新测算表与改进点`,
          `撰写复盘报告：数据、问题、下一步 3 条行动`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'life-planning') {
      const map = {
        foundation: [
          `明确活动目标、参与人数、日期与场地约束，写成 1 页需求说明`,
          `用 ${knRef} 列出任务分工表（角色/负责人/截止日）`,
        ],
        bridge: [
          `制作日程甘特图或流程表，含物料清单与预算明细`,
          `完成关键物料准备（通知、路线、安全预案）并勾选检查表`,
        ],
        core: [
          `按方案执行并拍照/签到记录，当天填写执行日志`,
          `撰写 500 字总结：亮点、问题、费用决算与改进建议`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'creative-media') {
      const map = {
        foundation: [
          `确定作品主题、受众与风格参考（2 个范例），写 100 字创意简报`,
          `用 ${knRef} 完成分镜/草图 3 帧，标注尺寸与配色方案`,
        ],
        bridge: [
          `制作半成品并收集 3 人反馈，记录修改清单`,
          `按反馈迭代 1 轮，导出可展示版本（图片/视频/海报）`,
        ],
        core: [
          `完成终稿并附制作说明（工具、素材来源、时长/尺寸）`,
          `布置展示位或线上发布，准备 1 分钟作品介绍词`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'engineering') {
      const map = {
        foundation: [
          `画出系统框图，标注输入/输出/关键部件、电源与信号走向`,
          `用 ${knRef} 列出器材清单（型号/数量）、安全注意事项与 3 项测试指标`,
        ],
        bridge: [
          `完成核心模块接线/结构组装，通电前填写线路复查表并签字`,
          `首次功能测试记录日志（时间/现象/故障点），修改 1 处并附对比照片`,
        ],
        core: [
          `稳定性测试 ≥3 次，记录成功率与误差，计算平均值`,
          `撰写工程报告：原理、结构、测试数据表、改进计划（各 1 页）`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (type === 'general') {
      const map = {
        foundation: [
          `收集「${shortGoal}」相关 3 条背景资料（各 50 字摘要+来源）`,
          `用 ${knRef} 明确 1 个可检查交付物与 3 条验收标准（谁检查、看什么）`,
        ],
        bridge: [
          `绘制实施流程图：步骤、负责人、工具、中间产出文件`,
          `完成 1 次小范围试做/预调查，记录问题清单与修订计划`,
        ],
        core: [
          `按方案执行并每日更新过程记录（数据/照片/草稿）`,
          `整理最终成果并逐条对照验收标准自评打勾`,
        ],
      };
      return mk(map[role] || map.core);
    }
    if (this._isChemistryInquiryGoal(goal)) {
      const cap = this._getChemistryAnalysisProfile(goal);
      if (cap.mixed) {
        const sample = cap.sampleLabel;
        const byRole = {
          foundation: [
            `说明${sample}为何属于混合溶液、无法直接称量分离溶质，比较硝酸银滴定法与电导率法的适用条件`,
            `结合 ${knRef} 理解：沉淀滴定（Ag⁺+Cl⁻→AgCl↓）或电解质导电与离子浓度的关系`,
          ],
          bridge: [
            `设计${sample}取样与预处理（澄清、定容稀释、平行样）方案`,
            cap.methods.includes('titration')
              ? '准备滴定装置：硝酸银标准溶液、滴定管/移液管，确定终点判断方式并设计记录表'
              : '配制系列标准盐溶液，测定电导率并绘制标准曲线',
          ],
          core: [
            cap.methods.includes('titration')
              ? '实施硝酸银滴定，记录消耗体积，换算样品中 Cl⁻/NaCl 含量'
              : '测定样品电导率并由标准曲线读出等效浓度',
            '进行平行测定，计算平均值与相对误差，与另一方法或参考标准对比讨论',
          ],
        };
        return (byRole[group.role] || [`围绕 ${knRef} 完成${sample}间接测定与数据分析`]).slice(0, 3);
      }
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
  _buildPathPlan({ goal, graphData, projectPhases = [], knowledgeChain = '', external = [], blueprintPhases = [] }) {
    const mainline = this._getMainlinePath(graphData);
    const groups = this._groupMainlineIntoPhases(mainline);
    const llm = projectPhases || [];
    const phases = groups.map((g, i) => {
      const lp = llm[i] || {};
      const bp = blueprintPhases[i] || {};
      const contextual = this._suggestPhaseSteps(goal, g, bp);
      const steps = this._pickConcreteSteps(lp.steps, bp.steps, contextual)
        || contextual
        || g.nodes.map(n => {
          const circ = this._pathStepCircled(n.pathStep);
          return `阅读${circ}「${n.name}」要点，完成 1 份与本阶段产出相关的记录或计算（附数据/例证）`;
        });
      return {
        phaseIndex: g.phaseIndex,
        phase: lp.phase || bp.phase || lp.name || g.phase,
        role: g.role,
        pathSteps: g.pathSteps,
        pathStepLabels: g.pathSteps.map(s => this._pathStepCircled(s)),
        graphRef: g.pathSteps.map(s => this._pathStepCircled(s)).join(''),
        nodeIds: g.nodeIds,
        knowledgeNames: g.knowledgeNames,
        steps,
        deliverable: this._pickConcreteDeliverable(lp, bp, g.role, goal),
        tools: bp.tools || lp.tools || this._inferPhaseTools(goal, lp.phase || bp.phase || g.phase, this._classifyProjectType(goal)),
        acceptance: bp.acceptance || lp.acceptance || [],
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
      blueprintPhases: result.projectBlueprint ? this._blueprintProjectPhases(result.projectBlueprint) : [],
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

  static GENERIC_TRANSVERSAL_RE = /批判性思维|创新思维|创新能力|团队协作|团队合作|项目管理|项目管理能力|沟通能力|沟通表达|问题解决|解决问题能力|时间管理|领导力|学习能力|核心素养|综合素养|信息素养|媒体素养|科学精神|人文素养|劳动素养|审辨性思维|审辨思维|元认知|学会学习|责任担当|社会责任|公民素养|国际理解/;
  static HOLLOW_STEP_RE = /^(完成|进行|开展|落实|实施|贯彻|培养|提升|增强|锻炼|学习|掌握|了解|认识|运用|选择|确定|调研|编写|配置|安装).{0,10}(探究|调研|学习|任务|活动|阶段|工作|研究|分析|讨论|探索|实践|制作|设计|总结|反思|课件|练习|组件|框架|逻辑|特点|风格|方案|软件|环境)$|完成本阶段|进行调研|开展研究|完成探究|运用.*完成本阶段|培养.*素养|提升.*能力|环境搭建|编写基础/;
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

  _buildMixedSolutionChemistryBlueprint(goal) {
    const cap = this._getChemistryAnalysisProfile(goal);
    const sample = cap.sampleLabel;
    return {
      projectSummary: String(goal || '').slice(0, 160),
      deliverable: `${sample}盐/电解质含量测定报告（硝酸银滴定法与电导率法对比分析）`,
      projectType: 'scientific-inquiry',
      constraints: [
        '样品为混合溶液，无法直接称量分离溶质',
        '须说明取样、澄清、稀释与平行测定方案',
        '滴定/电导率操作注意安全与器皿洁净'
      ],
      subsystems: [
        { id: 'constraint', name: '测定约束与方案选型', description: '分析混合溶液为何不能直接测质量分数' },
        { id: 'titration', name: '硝酸银滴定法', description: '利用 Ag⁺ 与 Cl⁻ 沉淀反应间接测定盐含量' },
        { id: 'conductivity', name: '电导率法', description: '通过电导率与离子浓度关系建立标准曲线' },
        { id: 'calc', name: '数据处理', description: '由滴定体积或电导率换算浓度并评估误差' }
      ],
      schemes: [
        {
          id: 'A',
          name: '硝酸银滴定法（推荐）',
          summary: `取样澄清后，用硝酸银标准溶液滴定氯离子，换算${sample}盐分含量`,
          pros: ['化学原理清晰', '适合测 Cl⁻/食盐', '高中实验可操作'],
          cons: ['需配制或标定 AgNO₃ 溶液', '终点判断需练习'],
          phases: [
            { phase: '问题与方案选型', steps: ['说明混合溶液不能直接称量的原因', '比较滴定法与电导率法优劣', '确定取样与稀释方案'], deliverable: '方案论证小结', subsystemIds: ['constraint'], knowledgeHints: ['溶液', '离子', '氯离子', '物质的量浓度', '滴定'] },
            { phase: '滴定原理与准备', steps: ['复习 AgNO₃ 与 Cl⁻ 沉淀反应', '准备滴定管、锥形瓶与终点判断方法'], deliverable: '原理笔记与器材清单', subsystemIds: ['titration'], knowledgeHints: ['硝酸银', '沉淀反应', '离子反应', '化学方程式'] },
            { phase: '取样与滴定', steps: ['取样澄清、定容稀释', '平行滴定并记录读数'], deliverable: '滴定原始记录表', subsystemIds: ['titration'], knowledgeHints: ['滴定', '实验', '测量', '记录'] },
            { phase: '计算与结论', steps: ['由消耗 AgNO₃ 体积换算 n(Cl⁻) 及 c(NaCl)', '与标准或另一方法对比并讨论误差'], deliverable: '测定报告', subsystemIds: ['calc'], knowledgeHints: ['物质的量', '计算', '浓度', '误差', '统计'] }
          ]
        },
        {
          id: 'B',
          name: '电导率法',
          summary: '配制标准盐溶液测电导率建立曲线，再测样品电导率反推浓度',
          pros: ['测定快速', '适合批量筛查'],
          cons: ['受温度与杂质离子干扰', '需标定曲线'],
          phases: [
            { phase: '原理与标定设计', steps: ['理解电解质导电与离子浓度关系', '设计标准溶液系列'], deliverable: '标定方案', subsystemIds: ['conductivity'], knowledgeHints: ['电解质', '电导率', '离子', '溶液'] },
            { phase: '建立标准曲线', steps: ['测定标准溶液电导率并绘图'], deliverable: '标准曲线图', subsystemIds: ['conductivity'], knowledgeHints: ['数据', '图表', '浓度', '函数'] },
            { phase: '样品测定', steps: ['测样品电导率', '由曲线读出等效浓度'], deliverable: '样品数据表', subsystemIds: ['conductivity'], knowledgeHints: ['测量', '电导', '换算'] },
            { phase: '对比分析', steps: ['与滴定结果或参考值对比', '讨论误差来源'], deliverable: '对比分析报告', subsystemIds: ['calc'], knowledgeHints: ['分析', '误差', '报告'] }
          ]
        }
      ],
      recommendedSchemeId: 'A',
      knowledgeChain: '测定约束 → 滴定/电导率原理 → 取样测定 → 浓度换算 → 结论',
      fallback: true
    };
  }

  _sanitizeBlueprintForGoal(blueprint, goal) {
    let bp = blueprint;
    if (bp?.schemes?.length) {
      const profile = this._goalProfile(goal, bp);
      bp = JSON.parse(JSON.stringify(bp));
      bp.schemes.forEach(s => {
        s.phases = (s.phases || []).map(p => ({
          ...p,
          steps: (p.steps || []).filter(st => !this._stepDomainMismatch(st, profile)),
        }));
      });
    }
    if (bp && this._isChemistryInquiryGoal(goal) && this._getChemistryAnalysisProfile(goal).mixed) {
      const cap = this._getChemistryAnalysisProfile(goal);
      const bp = { ...blueprint, schemes: (blueprint.schemes || []).map(s => ({ ...s, phases: (s.phases || []).map(p => ({ ...p })) })) };
      const naiveRe = /称量溶解|直接称量|质量分数.*配制|配制.*盐水|称量.*溶解/;
      if (!bp.deliverable || naiveRe.test(bp.deliverable)) {
        bp.deliverable = `${cap.sampleLabel}盐含量测定报告（硝酸银滴定法/电导率法）`;
      }
      bp.schemes.forEach(s => {
        (s.phases || []).forEach((p, idx) => {
          const blob = [p.phase, ...(p.steps || []), ...(p.knowledgeHints || [])].join(' ');
          if (naiveRe.test(blob) && !/滴定|硝酸银|电导率|间接|AgNO|氯离子/.test(blob)) {
            s.phases[idx] = {
              ...p,
              steps: [
                `说明${cap.sampleLabel}为混合溶液，须间接测定而非直接称量`,
                '比较硝酸银滴定法与电导率法并确定本阶段操作要点',
                ...(p.steps || []).map(st => String(st).replace(/称量溶解|直接称量配制/g, '取样澄清后滴定或测电导率'))
              ].slice(0, 4),
              knowledgeHints: [...new Set([...(p.knowledgeHints || []), '滴定', '硝酸银', '离子反应', '物质的量浓度', '电导率'])].slice(0, 6)
            };
          }
        });
      });
      return this._concretizeBlueprint(goal, bp, this._resolvedArchetype);
    }
    if (this._isPlantingCultivationGoal(goal)) {
      let pbp = bp ? JSON.parse(JSON.stringify(bp)) : null;
      if (!pbp?.schemes?.length) pbp = this._buildPlantingCultivationBlueprint(goal);
      pbp.projectType = 'planting-cultivation';
      const topic = this._extractTopicProfile(goal);
      const badRe = /原型驱动迭代|浸润式场景|快速原型|MVP|硬件准备|递进式实施|可展示的项目原型/;
      if (!pbp.deliverable || badRe.test(pbp.deliverable)) pbp.deliverable = topic.deliverableHint;
      if (!pbp.projectSummary || pbp.projectSummary.length < 12) {
        pbp.projectSummary = `围绕「${topic.coreTopic}」开展植物分类学习、${topic.crop || '植物'}栽培与生长观察`;
      }
      pbp.schemes = (pbp.schemes || []).slice(0, 1).map(s => ({
        ...s,
        name: String(s.name || '').replace(/浸润式场景|原型驱动迭代|递进式实施/, `「${topic.coreTopic}」种植`),
        phases: (s.phases || []).map(p => ({
          ...p,
          steps: (p.steps || []).filter(st => !badRe.test(String(st))),
          knowledgeHints: [...new Set([...(p.knowledgeHints || []), '植物', '分类', '光合', '种子', '萌发', '栽培', '生长', topic.crop || '月季'].filter(Boolean))].slice(0, 6),
        })).filter(p => (p.steps || []).length > 0),
      }));
      return this._concretizeBlueprint(goal, pbp, this._resolvedArchetype);
    }
    if (this._isExhibitionRedesignGoal(goal)) {
      let ebp = bp ? JSON.parse(JSON.stringify(bp)) : null;
      if (!ebp?.schemes?.length) ebp = this._buildExhibitionRedesignBlueprint(goal);
      ebp.projectType = 'exhibition-redesign';
      const topic = this._extractTopicProfile(goal);
      const engRe = /原型驱动迭代|快速原型|MVP|环境搭建|程序设计|招生简章|递进式实施|可展示的项目原型/;
      if (!ebp.deliverable || engRe.test(ebp.deliverable)) ebp.deliverable = topic.deliverableHint;
      if (!ebp.projectSummary || ebp.projectSummary.length < 12) {
        ebp.projectSummary = `围绕「${topic.coreTopic}」开展展陈空间诊断、主题策划与整改实施`;
      }
      ebp.schemes.forEach(s => {
        s.name = String(s.name || '').replace(/递进式实施|原型驱动迭代/, `「${topic.coreTopic}」改造`);
        s.phases = (s.phases || []).map(p => ({
          ...p,
          steps: (p.steps || []).filter(st => !engRe.test(String(st))),
        })).filter(p => (p.steps || []).length > 0);
      });
      return this._concretizeBlueprint(goal, ebp, this._resolvedArchetype);
    }
    if (this._isIndustryInnovationGoal(goal)) {
      let ibp = bp ? JSON.parse(JSON.stringify(bp)) : null;
      if (!ibp?.schemes?.length) ibp = this._buildIndustryInnovationBlueprint(goal);
      ibp.projectType = 'industry-innovation';
      const topic = this._extractTopicProfile(goal);
      const topicName = topic.coreTopic || '低空经济';
      const engRe = /工程设计思维|环境搭建|硬件组件|现代物流管理|智慧城市|搭建原型|MVP|程序设计|电解池|制作实现|快速原型/;
      if (!ibp.deliverable || engRe.test(ibp.deliverable) || /原型|装置|系统开发/.test(ibp.deliverable)) {
        ibp.deliverable = topic.deliverableHint || `${topicName}创新方案报告（场景调研+政策要点+可行性论证）`;
      }
      if (!ibp.projectSummary || ibp.projectSummary.length < 12) {
        ibp.projectSummary = `围绕「${topicName}」开展产业场景调研与创新方案设计：${String(goal).slice(0, 80)}`;
      }
      ibp.schemes.forEach(s => {
        s.phases = (s.phases || []).map(p => {
          const blob = [p.phase, ...(p.steps || []), ...(p.knowledgeHints || [])].join(' ');
          if (engRe.test(blob)) {
            const phase = String(p.phase || '').replace(/工程设计|制作实现|快速原型|搭建/, '创新方案');
            return {
              ...p,
              phase,
              steps: (p.steps || []).filter(st => !engRe.test(String(st))),
              knowledgeHints: [...new Set([...(p.knowledgeHints || []), topicName, '空域', '无人机', '政策', '统计', '说明文'])].slice(0, 6),
            };
          }
          return p;
        }).filter(p => (p.steps || []).length > 0 || (p.phase && !engRe.test(p.phase)));
      });
      return this._concretizeBlueprint(goal, ibp, this._resolvedArchetype);
    }
    if (!bp || !this._isConsumerDecisionGoal(goal)) {
      return this._concretizeBlueprint(goal, bp || blueprint, this._resolvedArchetype);
    }
    bp = { ...bp, schemes: (bp.schemes || []).map(s => ({ ...s })) };
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
    return this._concretizeBlueprint(goal, bp, this._resolvedArchetype);
  }

  _blueprintAnchoredToGoal(blueprint, goal) {
    if (!blueprint?.schemes?.length) return false;
    const topic = this._extractTopicProfile(goal);
    const tokens = this._goalTokens(topic.coreTopic || this._parseGoalSubject(goal));
    const blob = [
      blueprint.projectSummary,
      blueprint.deliverable,
      ...(blueprint.schemes || []).flatMap(s => [
        s.name, s.summary,
        ...(s.phases || []).flatMap(p => [p.phase, ...(p.steps || []), p.deliverable, ...(p.knowledgeHints || [])]),
      ]),
    ].join(' ');
    const genericRe = /递进式实施|原型驱动迭代|浸润式场景|可展示的项目原型|MVP\s*原型|快速原型|硬件准备/;
    if (genericRe.test(blob)) return false;
    const hit = tokens.filter(t => t.length >= 2 && blob.includes(t)).length;
    return hit >= Math.min(2, tokens.length) || blob.includes(topic.coreTopic);
  }

  _buildSubjectAnchoredBlueprint(goal, schemeName) {
    const topic = this._extractTopicProfile(goal);
    const subject = topic.coreTopic;
    const domains = this._inferProjectDomains(goal);
    const subsystems = domains.map(d => ({
      id: d.id,
      name: d.label,
      description: `围绕「${subject}」完成${d.label}`,
    }));
    const mkPhase = (dom, i) => {
      const stub = { phase: dom.label, knowledgeHints: dom.keywords.slice(0, 5), subsystemIds: [dom.id] };
      const bpStub = { subsystems, deliverable: topic.deliverableHint || '' };
      return {
        phase: dom.label,
        steps: this._concretizePhaseSteps(goal, stub, i, domains.length, this._resolvedArchetype, bpStub),
        deliverable: this._concretizeDeliverable(goal, dom.label, i === domains.length - 1 ? 'core' : 'bridge', '', bpStub),
        subsystemIds: [dom.id],
        knowledgeHints: dom.keywords.slice(0, 5),
      };
    };
    return {
      projectSummary: `围绕「${subject}」：${String(goal).slice(0, 100)}`,
      deliverable: topic.deliverableHint,
      projectType: this._classifyProjectType(goal),
      constraints: ['紧扣题目关键词', '每阶段产出可检查', '禁止套用无关模板'],
      subsystems,
      schemes: [{
        id: 'A',
        name: schemeName || `「${subject}」主题实施方案`,
        summary: `按模块推进「${subject}」项目，阶段名与任务均锚定题目`,
        pros: ['贴合题目', '阶段可评价'],
        cons: ['需按实际条件微调'],
        phases: domains.map((d, i) => mkPhase(d, i)),
      }],
      recommendedSchemeId: 'A',
      knowledgeChain: domains.map(d => d.label).join(' → '),
      fallback: true,
    };
  }

  _buildExhibitionRedesignBlueprint(goal) {
    return this._buildSubjectAnchoredBlueprint(goal, `「${this._parseGoalSubject(goal)}」展陈改造方案`);
  }

  _buildPlantingCultivationBlueprint(goal) {
    const topic = this._extractTopicProfile(goal);
    const crop = topic.crop || this._plantingCropLabel(goal);
    return this._buildSubjectAnchoredBlueprint(goal, `「${topic.coreTopic}」${crop}种植实施方案`);
  }

  _buildIndustryInnovationBlueprint(goal) {
    const topic = this._extractTopicProfile(goal);
    const topicName = topic.coreTopic || '低空经济';
    const domains = this._industryInnovationDomains(goal);
    const subsystems = domains.map(d => ({
      id: d.id,
      name: d.label,
      description: `完成「${topicName}」${d.label}相关调研与分析`,
    }));
    const mkPhase = (dom, i) => {
      const stub = { phase: dom.label, knowledgeHints: dom.keywords.slice(0, 5), subsystemIds: [dom.id] };
      const bpStub = { subsystems, deliverable: topic.deliverableHint || '' };
      return {
        phase: dom.label,
        steps: this._concretizePhaseSteps(goal, stub, i, domains.length, this._resolvedArchetype, bpStub),
        deliverable: this._concretizeDeliverable(goal, dom.label, i === domains.length - 1 ? 'core' : 'bridge', '', bpStub),
        subsystemIds: [dom.id],
        knowledgeHints: dom.keywords.slice(0, 5),
      };
    };
    return {
      projectSummary: `围绕「${topicName}」开展产业场景调研与创新方案设计`,
      deliverable: topic.deliverableHint || `${topicName}创新方案报告`,
      projectType: 'industry-innovation',
      constraints: ['资料须标注权威来源', '方案须考虑空域安全与合规', '禁止虚构政策条文'],
      subsystems,
      schemes: [{
        id: 'A',
        name: '政策—场景—原理—方案（推荐）',
        summary: `从${topicName}政策背景入手，调研应用场景，补足技术原理，提出创新方案`,
        pros: ['贴合新兴产业议题', '跨地理/物理/语文/数学', '交付物为可答辩报告'],
        cons: ['需检索行业资料'],
        phases: domains.map((d, i) => mkPhase(d, i)),
      }],
      recommendedSchemeId: 'A',
      knowledgeChain: `${topicName}政策背景 → 应用场景调研 → 技术原理支撑 → 数据可行性 → 创新方案报告`,
      fallback: true,
    };
  }

  _fallbackDecomposeBlueprint(goal) {
    if (this._isPlantingCultivationGoal(goal)) {
      return this._sanitizeBlueprintForGoal(this._buildPlantingCultivationBlueprint(goal), goal);
    }
    if (this._isExhibitionRedesignGoal(goal)) {
      return this._sanitizeBlueprintForGoal(this._buildExhibitionRedesignBlueprint(goal), goal);
    }
    if (this._isIndustryInnovationGoal(goal)) {
      return this._sanitizeBlueprintForGoal(this._buildIndustryInnovationBlueprint(goal), goal);
    }
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
      if (this._getChemistryAnalysisProfile(goal).mixed) {
        return this._buildMixedSolutionChemistryBlueprint(goal);
      }
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

    const topic = this._extractTopicProfile(goal);
    const subject = topic.coreTopic;
    const isEng = this._classifyProjectType(goal) === 'engineering' || this._isEnergyProjectGoal(goal);
    if (!isEng) {
      return this._sanitizeBlueprintForGoal(
        this._buildSubjectAnchoredBlueprint(goal, `「${subject}」主题实施方案`),
        goal
      );
    }
    const domains = this._inferProjectDomains(goal);
    const subsystems = domains.map(d => ({ id: d.id, name: d.label, description: `完成「${subject}」${d.label}` }));
    const bp = this._buildSubjectAnchoredBlueprint(goal, `「${subject}」工程实施方案`);
    bp.deliverable = `可展示的「${subject}」工程作品+测试数据+说明文档`;
    return this._sanitizeBlueprintForGoal(bp, goal);
  }

  _parseDecomposeResult(raw, goal) {
    try {
      const jsonStr = this._extractJsonObject(raw);
      const data = JSON.parse(jsonStr);
      if (!data.schemes?.length) return this._fallbackDecomposeBlueprint(goal);
      if (!data.recommendedSchemeId && data.schemes[0]) {
        data.recommendedSchemeId = data.schemes[0].id;
      }
      if (!this._blueprintAnchoredToGoal(data, goal)) {
        console.warn('[PBL] LLM 蓝图未锚定题目，使用主题蓝图回退');
        return this._fallbackDecomposeBlueprint(goal);
      }
      const sanitized = this._sanitizeBlueprintForGoal(data, goal);
      return this._concretizeBlueprint(goal, sanitized, this._resolvedArchetype);
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
    const llmOpts = this._llmStageOptions(stage);

    if (cfg.clientLlm) {
      const messages = await this._fetchPBLMessages(stage, payload);
      return this.callLLM(messages, llmOpts);
    }

    const body = { stage, ...payload };
    if (cfg.model) body.model = cfg.model;

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 90000);
    try {
      const resp = await fetch(this._getPBLAnalyzeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify(body),
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
    const archetype = meta.archetype || null;
    let core = complex ? this._filterMatchedForComplexProject(matched) : matched;
    core = this._purgeBiologyNoise(core, goal);
    core = this._filterMainlineNodes(core, goal, archetype);
    if (complex && core.length === 0 && matched.length) {
      core = this._filterMainlineNodes(
        [...matched].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)),
        goal,
        archetype
      );
    }
    if (archetype && this._archetypeEngine) {
      core = this._archetypeEngine.tagMatchedModules(
        core, archetype, meta.projectBlueprint,
        (n, m) => this._archetypeEngine.scoreForModule(n, m, this._tokenizeGoalTerms(goal))
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
      core = this._filterMainlineNodes(core, goal, archetype);
      core = this._rebalanceStemMatched(core, goal, meta.candidatePool || [], profile.maxMatched);
    }
    if (!core.length && meta.candidatePool?.length) {
      core = this._rescueCandidatesFromPool(goal, meta.candidatePool, profile.maxMatched, meta.archetype, meta.projectBlueprint);
      console.warn('[PBL] 主线为空，已用原型层回退:', core.map(n => n.name).join('、'));
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
      // 原有：展开课标内 prerequisites
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

      // 全科图谱增强：展开跨学科前置和大学延伸节点
      if (this.graphLoaded) {
        const graphNb = this.graphNeighbors.get(n.id);
        if (graphNb) {
          // 跨学科前置（来自图谱边的 parents，且不在 prerequisites 中）
          const existingPrereqs = new Set(kg.prerequisites || []);
          let crossAdded = 0;
          graphNb.parents.forEach(parentId => {
            if (crossAdded >= 3) return; // 每节点最多 3 个跨学科前置
            if (existingPrereqs.has(parentId) || matchedIds.has(parentId) || nodeMap.has(parentId)) return;
            const parentNode = this.unifiedIndex.get(parentId);
            if (!parentNode) return;
            if (parentNode.subject === kg.subject) return; // 同学科跳过（已由 prerequisites 覆盖）
            if (complex && this._excludeForComplexProject(parentNode)) return;
            const enriched = { ...parentNode, layer: 'prerequisite', crossSubject: true };
            base.nodes.push(enriched);
            nodeMap.set(parentId, enriched);
            links.push({ source: parentId, target: n.id, type: 'cross-prerequisite' });
            crossAdded++;
          });

          // 大学延伸节点（来自图谱边的 children 中 grade=0 的大学节点）
          let uniAdded = 0;
          graphNb.children.forEach(childId => {
            if (uniAdded >= 2) return; // 每节点最多 2 个大学延伸
            if (matchedIds.has(childId) || nodeMap.has(childId)) return;
            const childNode = this.unifiedIndex.get(childId);
            if (!childNode || childNode.grade !== 0) return;
            const enriched = { ...childNode, layer: 'advanced', isUniversity: true };
            base.nodes.push(enriched);
            nodeMap.set(childId, enriched);
            links.push({ source: n.id, target: childId, type: 'university-bridge' });
            uniAdded++;
          });
        }
      }
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
    await this._ensureArchetypeData();

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
    this._reportPBLStatus(onStatus, '第 1/4 步：全链路拆解可行方案...');
    let projectBlueprint = await this._llmDecomposeStage(goal);
    let archetype = this._resolveArchetype(goal, projectBlueprint);
    if (archetype) projectBlueprint = this._alignBlueprintModules(projectBlueprint, archetype);
    projectBlueprint = this._concretizeBlueprint(goal, projectBlueprint, archetype);
    const blueprintPhases = this._blueprintProjectPhases(projectBlueprint);
    const bloomProfile = this._inferBloomProfile(projectBlueprint);

    // 5. 第一阶段 LLM：判断学科+学段+课标体系（压缩候选集）
    this._reportPBLStatus(onStatus, archetype
      ? `第 2/4 步：按原型「${archetype.label}」分模块检索候选...`
      : '第 2/4 步：筛选课标学科与候选池（Bloom 层级）...');
    const stage1 = await this._llmFilterStage(goal, candidates, projectBlueprint, bloomProfile, archetype, activeSystems);

    // 6. 第二阶段 LLM：按蓝图阶段精确匹配课标
    this._reportPBLStatus(onStatus, '第 3/4 步：按蓝图阶段匹配课标知识点...');
    let stage2 = await this._llmMatchStage(goal, stage1.filteredCandidates, projectBlueprint, stage1.bloomProfile, archetype);

    // 7. 第三阶段：dependsOn 方向性验证
    this._reportPBLStatus(onStatus, '第 4/4 步：校验知识依赖方向...');
    const verifiedResult = await this._llmVerifyDepsStage(goal, stage2.rawMatchResult, stage1.filteredCandidates, stage2.matched);
    stage2.dependsOnLinks = this._buildDependsOnLinks(verifiedResult, stage1.filteredCandidates);

    const finalized = this._finalizePBLGraph(goal, stage2.matched, stage2.external, activeSystems, {
      pathOrderIds: stage2.pathOrderIds,
      dependsOnLinks: stage2.dependsOnLinks || [],
      candidatePool: stage1.filteredCandidates,
      archetype,
      projectBlueprint,
    });
    const llmPhases = stage2.projectPhases || [];
    const phaseLen = Math.max(blueprintPhases.length, llmPhases.length);
    const mergedPhases = phaseLen ? Array.from({ length: phaseLen }, (_, i) => {
      const bp = blueprintPhases[i] || {};
      const lp = llmPhases[i] || {};
      const stubGroup = { role: bp.role || 'core', nodes: [] };
      return {
        phase: lp.phase || bp.phase || `阶段 ${i + 1}`,
        steps: this._pickConcreteSteps(lp.steps, bp.steps, this._suggestPhaseSteps(goal, stubGroup, bp)),
        knowledgeNames: lp.knowledgeNames?.length ? lp.knowledgeNames : bp.knowledgeNames,
        deliverable: this._pickConcreteDeliverable(lp, bp, bp.role, goal),
        literacy: lp.literacy || bp.literacy,
      };
    }) : blueprintPhases;
    const moduleChainPre = archetype && this._archetypeEngine
      ? this._archetypeEngine.moduleChain(archetype, projectBlueprint)
      : '';
    const pathPlan = this._buildPathPlan({
      goal,
      graphData: finalized.graphData,
      projectPhases: mergedPhases.length ? mergedPhases : blueprintPhases,
      blueprintPhases,
      knowledgeChain: moduleChainPre || stage2.knowledgeChain || projectBlueprint.knowledgeChain || '',
      external: finalized.external
    });
    const moduleChain = moduleChainPre;
    const techRoute = this._buildTechRouteFromPathPlan(pathPlan)
      || this.resolveTechRouteText({
        goal,
        graphData: finalized.graphData,
        matched: finalized.matched,
        external: finalized.external,
        projectPhases: pathPlan.phases,
        knowledgeChain: moduleChain || pathPlan.knowledgeChain,
        pathPlan
      });
    const quality = this.computeQualityScore({
      goal,
      matched: finalized.matched,
      external: finalized.external,
      projectBlueprint,
      archetype,
      graphData: finalized.graphData,
      pathPlan,
    });

    return {
      goal,
      systems: activeSystems,
      archetype: archetype ? { id: archetype.id, label: archetype.label } : null,
      moduleChain,
      projectBlueprint,
      matched: finalized.matched,
      external: finalized.external,
      techRoute,
      projectPhases: pathPlan.phases,
      pathPlan,
      knowledgeChain: moduleChain || pathPlan.knowledgeChain,
      graphData: finalized.graphData,
      complexProject: finalized.complex,
      quality,
      stats: {
        totalCandidates: candidates.length,
        filteredCandidates: stage1.filteredCandidates.length,
        matchedCount: finalized.matched.length,
        externalCount: finalized.external.length,
        graphNodes: finalized.graphData.nodes.length,
        graphLinks: finalized.graphData.links.length,
        qualityScore: quality.score,
        qualityGrade: quality.grade,
      }
    };
  }

  async _llmFilterStage(goal, candidates, projectBlueprint = null, bloomProfile = null, archetype = null, activeSystems = []) {
    const profile = this._getPBLGoalProfile(goal);
    const ruleBloom = bloomProfile || this._inferBloomProfile(projectBlueprint);
    if (archetype) {
      profile.maxMatched = archetype.maxMatched || profile.maxMatched;
      if (archetype.minGrade >= 7) profile.complex = true;
    }

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
      projectBlueprint,
      bloomProfile: ruleBloom,
    });
    const jsonStr = this._extractJsonObject(response);
    const filter = JSON.parse(jsonStr);
    const mergedBloom = this._mergeBloomProfile(ruleBloom, filter);
    filter.bloomCeiling = mergedBloom.ceiling;
    filter.bloomEvidence = mergedBloom.evidence;
    filter.actionVerbs = mergedBloom.actionVerbs;
    const domains = this._inferProjectDomains(goal);

    const projectType = this._classifyProjectType(goal);

    if (archetype?.subjects?.length) {
      filter.subjects = archetype.subjects;
      if (archetype.primarySystem) filter.systems = [archetype.primarySystem, ...(archetype.extensionSystems || [])];
    } else if (this._isConsumerDecisionGoal(goal)) {
      filter.subjects = ['math', 'physics', 'chemistry', 'geography', 'chinese'];
    } else if (this._isChemistryInquiryGoal(goal)) {
      filter.subjects = this._getChemistryAnalysisProfile(goal).mixed
        ? ['chemistry', 'physics', 'math']
        : ['chemistry', 'science', 'math'];
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
    const bloomCeiling = mergedBloom.ceiling || 3;
    const minGradeArchetype = archetype?.minGrade || (profile.complex ? PBLPathBuilder.PBL_MIN_GRADE_COMPLEX : 1);
    const filteredCandidates = candidates.filter(n => {
      const subjectMatch = !filter.subjects || filter.subjects.length === 0 || filter.subjects.includes(n.subject);
      const systemMatch = !filter.systems || filter.systems.length === 0 || filter.systems.includes(n.system);
      const grade = parseInt(n.grade, 10) || 0;
      const gradeMatch = !filter.grades || filter.grades.length === 0
        || filter.grades.some(g => Math.abs(grade - g) <= 2);
      const notElementary = grade === 0 || grade >= Math.max(minGrade, minGradeArchetype);
      if ((profile.complex || archetype) && this._excludeForComplexProject(n)) return false;
      if (archetype && this._isArchetypeBanned(n, archetype)) return false;
      if (this._isNodeAboveBloomCeiling(n, bloomCeiling)) return false;
      return subjectMatch && systemMatch && gradeMatch && notElementary;
    });

    const MAX_STAGE2_CANDIDATES = archetype ? 24 : (profile.complex ? 28 : 22);
    let pool = filteredCandidates.length > 0 ? filteredCandidates : candidates.filter(n => {
      const g = parseInt(n.grade, 10) || 0;
      if (archetype || profile.complex) {
        return (g === 0 || g >= minGradeArchetype) && !this._excludeForComplexProject(n);
      }
      return true;
    });
    pool = this._applyArchetypePoolRules(pool, archetype, activeSystems);
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
    let topCandidates;
    if (archetype && this._archetypeEngine) {
      topCandidates = this._archetypeEngine.pickCandidates(
        scored, archetype, projectBlueprint, MAX_STAGE2_CANDIDATES, goalTerms,
        {
          isBanned: n => this._isArchetypeBanned(n, archetype),
          meetsGrade: n => this._meetsArchetypeGrade(n, archetype),
          scoreForModule: (n, m) => this._archetypeEngine.scoreForModule(n, m, goalTerms),
        }
      );
    } else if (domains.length && (profile.complex || this._isConsumerDecisionGoal(goal) || this._isChemistryInquiryGoal(goal))) {
      topCandidates = this._pickDomainAwareCandidates(scored, MAX_STAGE2_CANDIDATES, domains, goal);
    } else {
      topCandidates = [...scored].sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, MAX_STAGE2_CANDIDATES);
    }
    return { filter, filteredCandidates: topCandidates, domains, bloomProfile: mergedBloom, archetype };
  }

  async _llmMatchStage(goal, candidates, projectBlueprint = null, bloomProfile = null, archetype = null) {
    const profile = this._getPBLGoalProfile(goal);
    const complex = profile.complex || !!archetype;
    const minConf = archetype ? 0.55 : (complex ? 0.58 : 0.52);
    if (archetype) profile.maxMatched = archetype.maxMatched || profile.maxMatched;
    const blueprintPhases = this._blueprintProjectPhases(projectBlueprint);
    const candidatesLite = candidates.map(n => this._enrichCandidateForMatch(n));

    const response = await this._callPBLAnalyzeStage('match', {
      goal,
      candidates: candidatesLite,
      complex,
      maxMatched: profile.maxMatched,
      minConf,
      domainHints: this._inferProjectDomains(goal),
      projectBlueprint,
      bloomProfile: bloomProfile || this._inferBloomProfile(projectBlueprint),
      archetypeId: archetype?.id || null,
    });
    let result = { matched: [], pathOrder: [], projectPhases: [], external: [], techRoute: '' };
    try {
      const jsonStr = this._extractJsonObject(response);
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('[PBL] match JSON 解析失败，将使用关键词回退:', e.message);
    }

    let matched = this._mapMatchedEntries(result, candidates, complex, minConf, goal, archetype)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, profile.maxMatched);

    if (!matched.length) {
      matched = this._mapMatchedEntries(result, candidates, complex, 0.48, goal, archetype)
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, profile.maxMatched);
    }
    if (matched.length < (archetype?.minMatched || 3) && candidates.length) {
      const rescued = this._rescueCandidatesFromPool(goal, candidates, profile.maxMatched, archetype, projectBlueprint);
      const seen = new Set(matched.map(n => n.id));
      rescued.forEach(n => {
        if (matched.length >= profile.maxMatched || seen.has(n.id)) return;
        seen.add(n.id);
        matched.push(n);
      });
      if (rescued.length) console.warn('[PBL] 原型层模块检索补齐:', rescued.map(n => n.name).join('、'));
    }
    matched = this._filterMainlineNodes(matched, goal, archetype);
    if (archetype && this._archetypeEngine) {
      matched = this._archetypeEngine.tagMatchedModules(
        matched, archetype, projectBlueprint,
        (n, m) => this._archetypeEngine.scoreForModule(n, m, this._tokenizeGoalTerms(goal))
      );
    }
    matched = this._ensureMinimumMatched(matched, goal, candidates, profile.maxMatched, complex);
    matched = this._filterMainlineNodes(matched, goal, archetype);
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

    const external = this._ensureExternalNodes(result.external || [], goal, matched, projectBlueprint, archetype);

    const techRoute = (result.techRoute || '').trim();
    const knowledgeChain = (result.knowledgeChain || '').trim();
    return {
      matched,
      external,
      techRoute,
      pathOrderIds,
      projectPhases,
      dependsOnLinks,
      knowledgeChain,
      rawMatchResult: result,
    };
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
    await this._ensureArchetypeData();

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
      external: '#eab308',      // 黄色 - 外部补充
      university: '#6366f1'     // 靛蓝 - 大学延伸
    };

    this.layerLabels = {
      prerequisite: '基础前置',
      matched: '核心必需',
      advanced: '扩展高级',
      parallel: '平行关联',
      external: '外部补充',
      university: '大学延伸'
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
    const nodes = graphData.nodes.map(n => {
      const enriched = enrichNode(n);
      // 大学延伸节点用独立 layer 颜色
      if (enriched.isUniversity || enriched.grade === 0) enriched.layer = 'university';
      // 跨学科前置节点加标记
      if (enriched.crossSubject) enriched.layerSuffix = '(跨学科)';
      return enriched;
    });
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
      .attr('stroke', d => {
        if (d.type === 'path-step') return this.colors.matched;
        if (d.type === 'university-bridge') return this.colors.university;
        if (d.type === 'cross-prerequisite') return '#f59e0b'; // 琥珀色-跨学科
        if (d.type.includes('external')) return this.colors.external;
        if (d.type === 'extends') return this.colors.advanced;
        if (d.type === 'parallel') return this.colors.parallel;
        return 'rgba(148,163,184,0.3)';
      })
      .attr('stroke-opacity', d => d.type === 'path-step' ? 0.85 : 0.5)
      .attr('stroke-width', d => d.type === 'path-step' ? 2.5 : d.type === 'prerequisite' ? 2 : d.type === 'cross-prerequisite' ? 2 : d.type === 'university-bridge' ? 2 : 1.5)
      .attr('stroke-dasharray', d => {
        if (d.type === 'university-bridge') return '4 2 1 2'; // 点划线
        if (d.type === 'cross-prerequisite') return '8 4'; // 长虚线
        if (d.type.includes('external')) return '6 3';
        if (d.type === 'parallel') return '3 3';
        if (d.type === 'extends') return '6 3';
        return 'none';
      })
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
      { label: '外部补充', color: this.colors.external, dash: true, icon: '💡' },
      { label: '跨学科', color: '#f59e0b', dash: true, icon: '🔗' },
      { label: '大学延伸', color: this.colors.university, dash: true, icon: '🎓' }
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
