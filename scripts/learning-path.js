/**
 * TeachAny 学习路径系统 v2.0
 * 加载全部275个知识节点，预计算完整图谱网络
 * 选择知识点后可即时显示学习路径
 */

class LearningPathSystem {
  constructor() {
    this.nodeIndex = new Map();       // node_id -> 完整节点信息
    this.courseIndex = new Map();      // node_id -> 课件列表
    this.reverseIndex = new Map();    // node_id -> 哪些节点以它为前置
    this.pathCache = new Map();       // 路径缓存（nodeId -> 完整路径数据）
    this.subjectMap = new Map();      // subject -> [nodeIds]
    this.gradeMap = new Map();        // grade -> [nodeIds]
    this.domainMap = new Map();       // domain -> [nodeIds]
    this.initialized = false;
    this.initializing = false;
    this._initPromise = null;
    this.stats = null;
  }

  /**
   * 初始化系统：加载全部数据并预计算
   */
  async initialize() {
    if (this.initialized) return;
    if (this.initializing) return this._initPromise;

    this.initializing = true;
    this._initPromise = this._doInitialize();
    return this._initPromise;
  }

  async _doInitialize() {
    const t0 = performance.now();
    console.log('[LearningPath] 开始初始化...');

    try {
      // 1. 并行加载节点元数据和课件注册表
      const [nodesData, registryData] = await Promise.all([
        this._fetchJSON('./data/nodes-metadata.json'),
        this._fetchJSON('./registry.json')
      ]);

      // 2. 构建节点索引
      this._buildNodeIndex(nodesData);
      this.stats = nodesData.stats;

      // 3. 构建课件索引
      this._buildCourseIndex(registryData);

      // 4. 构建反向索引（后继 → 前置）
      this._buildReverseIndex();

      // 5. 构建分类索引
      this._buildCategoryIndices();

      // 6. 预计算所有路径
      this._precomputeAllPaths();

      this.initialized = true;
      this.initializing = false;

      const elapsed = (performance.now() - t0).toFixed(0);
      console.log(`[LearningPath] ✅ 初始化完成 (${elapsed}ms)`);
      console.log(`  节点: ${this.nodeIndex.size}`);
      console.log(`  课件覆盖: ${this.courseIndex.size} 个节点`);
      console.log(`  路径缓存: ${this.pathCache.size} 条`);
    } catch (error) {
      this.initializing = false;
      console.error('[LearningPath] ❌ 初始化失败:', error);
      throw error;
    }
  }

  // ─── 数据加载 ─────────────────────────────────

  async _fetchJSON(url) {
    const response = await fetch(url + '?t=' + Date.now());
    if (!response.ok) throw new Error(`Fetch ${url}: HTTP ${response.status}`);
    return response.json();
  }

  _buildNodeIndex(nodesData) {
    const nodes = nodesData.nodes || [];
    nodes.forEach(node => {
      // 统一字段名
      const normalized = {
        id: node.id,
        name: node.name,
        subject: node.subject,
        domain: node.domain,
        grade: parseInt(node.grade) || 0,
        graph_path: node.graph_path || '',
        definition: node.definition || '',
        key_concepts: node.key_concepts || [],
        difficulty: node.difficulty || 0,
        // 关系字段
        prerequisites: node.prerequisites || [],
        nextSteps: node.next_steps || [],
        relatedNodes: node.related_nodes || []
      };
      this.nodeIndex.set(node.id, normalized);
    });
    console.log(`[LearningPath] 加载 ${this.nodeIndex.size} 个节点`);
  }

  _buildCourseIndex(registryData) {
    const courses = registryData.courses || [];
    courses.forEach(course => {
      const nodeId = course.node_id;
      if (nodeId) {
        if (!this.courseIndex.has(nodeId)) {
          this.courseIndex.set(nodeId, []);
        }
        this.courseIndex.get(nodeId).push(course);
      }
    });
    console.log(`[LearningPath] 课件覆盖 ${this.courseIndex.size} 个节点`);
  }

  // ─── 索引构建 ─────────────────────────────────

  _buildReverseIndex() {
    // 反向索引：nextSteps[child] → parent
    this.nodeIndex.forEach((node, nodeId) => {
      // 从 nextSteps 建立反向（谁的后续是我 → 它是我的前置）
      if (node.nextSteps) {
        node.nextSteps.forEach(nextId => {
          if (!this.reverseIndex.has(nextId)) {
            this.reverseIndex.set(nextId, new Set());
          }
          this.reverseIndex.get(nextId).add(nodeId);
        });
      }

      // 从 prerequisites 建立正向补充（如果图谱中明确声明了前置）
      if (node.prerequisites) {
        node.prerequisites.forEach(preId => {
          if (!this.reverseIndex.has(nodeId)) {
            this.reverseIndex.set(nodeId, new Set());
          }
          this.reverseIndex.get(nodeId).add(preId);

          // 同时补充前置节点的 nextSteps
          const preNode = this.nodeIndex.get(preId);
          if (preNode && !preNode.nextSteps.includes(nodeId)) {
            preNode.nextSteps.push(nodeId);
          }
        });
      }
    });

    // 合并反向索引到节点的 prerequisites
    this.reverseIndex.forEach((parentIds, nodeId) => {
      const node = this.nodeIndex.get(nodeId);
      if (node) {
        parentIds.forEach(pid => {
          if (!node.prerequisites.includes(pid)) {
            node.prerequisites.push(pid);
          }
        });
      }
    });

    console.log(`[LearningPath] 反向索引: ${this.reverseIndex.size} 个节点有前置`);
  }

  _buildCategoryIndices() {
    this.nodeIndex.forEach((node, nodeId) => {
      // 按学科
      if (!this.subjectMap.has(node.subject)) {
        this.subjectMap.set(node.subject, []);
      }
      this.subjectMap.get(node.subject).push(nodeId);

      // 按年级
      const grade = node.grade;
      if (!this.gradeMap.has(grade)) {
        this.gradeMap.set(grade, []);
      }
      this.gradeMap.get(grade).push(nodeId);

      // 按领域
      if (!this.domainMap.has(node.domain)) {
        this.domainMap.set(node.domain, []);
      }
      this.domainMap.get(node.domain).push(nodeId);
    });
  }

  // ─── 预计算路径 ─────────────────────────────────

  _precomputeAllPaths() {
    const t0 = performance.now();
    
    this.nodeIndex.forEach((node, nodeId) => {
      const path = this._computePath(nodeId);
      this.pathCache.set(nodeId, path);
    });

    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[LearningPath] 预计算 ${this.pathCache.size} 条路径 (${elapsed}ms)`);
  }

  _computePath(nodeId) {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return null;

    // 1. 前置知识路径（递归向上，带去重）
    const prerequisites = this._getPrerequisites(nodeId, new Set());

    // 2. 后续学习方向（递归向下，深度3层）
    const nextSteps = this._getNextSteps(nodeId, 3, new Set());

    // 3. 平行知识点（同领域同年级）
    const parallel = this._getParallelNodes(nodeId);

    // 4. 跨学段链（跨越小学→初中→高中的知识链）
    const crossGrade = this._getCrossGradeInfo(prerequisites, node, nextSteps);

    // 5. 可用课件
    const coursewares = this.courseIndex.get(nodeId) || [];

    return {
      current: {
        ...node,
        coursewares
      },
      prerequisites,
      nextSteps,
      parallel,
      crossGrade,
      summary: {
        prerequisiteCount: prerequisites.length,
        nextStepCount: this._countNextSteps(nextSteps),
        parallelCount: parallel.length,
        coursewareCount: coursewares.length,
        hasPrerequisites: prerequisites.length > 0,
        hasNextSteps: nextSteps.length > 0
      }
    };
  }

  _getPrerequisites(nodeId, visited) {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = this.nodeIndex.get(nodeId);
    if (!node || node.prerequisites.length === 0) return [];

    const result = [];
    for (const preId of node.prerequisites) {
      const preNode = this.nodeIndex.get(preId);
      if (!preNode || visited.has(preId)) continue;

      // 递归获取更深层前置
      const deeper = this._getPrerequisites(preId, visited);
      result.push(...deeper);

      result.push({
        id: preNode.id,
        name: preNode.name,
        subject: preNode.subject,
        domain: preNode.domain,
        grade: preNode.grade,
        definition: preNode.definition,
        hasCourseware: this.courseIndex.has(preId),
        coursewareCount: (this.courseIndex.get(preId) || []).length
      });
    }
    return result;
  }

  _getNextSteps(nodeId, depth, visited) {
    if (depth <= 0 || visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = this.nodeIndex.get(nodeId);
    if (!node || node.nextSteps.length === 0) return [];

    const result = [];
    for (const nextId of node.nextSteps) {
      const nextNode = this.nodeIndex.get(nextId);
      if (!nextNode || visited.has(nextId)) continue;

      result.push({
        id: nextNode.id,
        name: nextNode.name,
        subject: nextNode.subject,
        domain: nextNode.domain,
        grade: nextNode.grade,
        definition: nextNode.definition,
        hasCourseware: this.courseIndex.has(nextId),
        coursewareCount: (this.courseIndex.get(nextId) || []).length,
        children: this._getNextSteps(nextId, depth - 1, new Set(visited))
      });
    }
    return result;
  }

  _getParallelNodes(nodeId) {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return [];

    const result = [];
    const domainNodes = this.domainMap.get(node.domain) || [];

    for (const otherId of domainNodes) {
      if (otherId === nodeId) continue;
      const otherNode = this.nodeIndex.get(otherId);
      if (!otherNode) continue;
      // 同领域即为平行，不限制同年级
      result.push({
        id: otherNode.id,
        name: otherNode.name,
        grade: otherNode.grade,
        definition: otherNode.definition,
        hasCourseware: this.courseIndex.has(otherId),
        coursewareCount: (this.courseIndex.get(otherId) || []).length
      });
    }

    // 按年级排序
    result.sort((a, b) => a.grade - b.grade);
    return result;
  }

  _getCrossGradeInfo(prerequisites, currentNode, nextSteps) {
    const elementary = []; // 小学 1-6
    const middle = [];     // 初中 7-9
    const high = [];       // 高中 10-12

    const classify = (node) => {
      const g = node.grade;
      if (g >= 1 && g <= 6) elementary.push(node);
      else if (g >= 7 && g <= 9) middle.push(node);
      else if (g >= 10) high.push(node);
    };

    prerequisites.forEach(classify);
    classify(currentNode);

    const flattenNext = (nodes) => {
      nodes.forEach(n => {
        classify(n);
        if (n.children) flattenNext(n.children);
      });
    };
    flattenNext(nextSteps);

    const spans = (elementary.length > 0 ? 1 : 0) + (middle.length > 0 ? 1 : 0) + (high.length > 0 ? 1 : 0);

    return {
      elementary,
      middle,
      high,
      crossesGrades: spans >= 2,
      spanCount: spans
    };
  }

  _countNextSteps(nodes) {
    let count = 0;
    nodes.forEach(n => {
      count++;
      if (n.children) count += this._countNextSteps(n.children);
    });
    return count;
  }

  // ─── 公共API ──────────────────────────────────

  /**
   * 获取知识点学习路径（从缓存，即时返回）
   */
  getLearningPath(nodeId) {
    return this.pathCache.get(nodeId) || null;
  }

  /**
   * 获取节点信息
   */
  getNode(nodeId) {
    return this.nodeIndex.get(nodeId) || null;
  }

  /**
   * 获取学科所有节点
   */
  getSubjectNodes(subject) {
    const ids = this.subjectMap.get(subject) || [];
    return ids.map(id => this.nodeIndex.get(id)).filter(Boolean);
  }

  /**
   * 搜索节点
   */
  searchNodes(query) {
    const q = query.toLowerCase();
    const results = [];
    this.nodeIndex.forEach((node, id) => {
      if (node.name.toLowerCase().includes(q) ||
          id.toLowerCase().includes(q) ||
          (node.definition && node.definition.toLowerCase().includes(q))) {
        results.push(node);
      }
    });
    return results;
  }

  // ─── 渲染 ─────────────────────────────────────

  renderPathVisualization(nodeId, containerId) {
    const path = this.getLearningPath(nodeId);
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!path) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h2>未找到知识点</h2>
          <p>节点 "${nodeId}" 不在知识图谱中</p>
        </div>`;
      return;
    }

    const subjectNames = {
      math: '📐 数学', biology: '🧬 生物', physics: '⚡ 物理',
      chemistry: '🧪 化学', geography: '🌍 地理', history: '🏛️ 历史',
      chinese: '📖 语文', english: '🔤 英语', 'info-tech': '💻 信息技术'
    };

    const gradeLabel = (g) => {
      if (!g || g === 0) return '通识';
      if (g <= 6) return `小学${g}年级`;
      if (g <= 9) return `初中${g - 6}年级`;
      return `高中${g - 9}年级`;
    };

    const coursewareBadge = (node) => {
      if (node.hasCourseware || node.coursewareCount > 0) {
        return `<span class="badge badge-green">📖 ${node.coursewareCount || '有'}课件</span>`;
      }
      return `<span class="badge badge-gray">暂无课件</span>`;
    };

    const renderNodeCard = (node, clickable = true) => {
      const cls = clickable ? 'path-node clickable' : 'path-node';
      return `
        <div class="${cls}" data-node-id="${node.id}" title="${node.definition || node.name}">
          <div class="node-grade-tag">${gradeLabel(node.grade)}</div>
          <div class="node-name">${node.name}</div>
          ${coursewareBadge(node)}
        </div>`;
    };

    const c = path.current;
    const cw = path.current.coursewares || [];

    // 构建HTML
    let html = '<div class="learning-path-viz">';

    // ===== 当前节点 =====
    html += `
      <div class="path-section current-section">
        <div class="section-header"><span class="section-icon">🎯</span> 当前知识点</div>
        <div class="current-node-card">
          <div class="current-info">
            <h2>${c.name}</h2>
            <div class="current-meta">
              <span>${subjectNames[c.subject] || c.subject}</span>
              <span>${gradeLabel(c.grade)}</span>
              <span>📂 ${c.domain}</span>
            </div>
            ${c.definition ? `<p class="current-def">${c.definition}</p>` : ''}
            ${c.key_concepts && c.key_concepts.length > 0 ? `
              <div class="key-concepts">
                <strong>关键概念：</strong>
                ${c.key_concepts.map(k => `<span class="concept-tag">${k}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="current-stats">
            <div class="stat-item"><span class="stat-val">${path.summary.prerequisiteCount}</span><span class="stat-lbl">前置知识</span></div>
            <div class="stat-item"><span class="stat-val">${path.summary.nextStepCount}</span><span class="stat-lbl">后续方向</span></div>
            <div class="stat-item"><span class="stat-val">${path.summary.parallelCount}</span><span class="stat-lbl">平行知识</span></div>
            <div class="stat-item"><span class="stat-val">${path.summary.coursewareCount}</span><span class="stat-lbl">可用课件</span></div>
          </div>
        </div>
        ${cw.length > 0 ? `
          <div class="courseware-list">
            <div class="cw-title">📖 可用课件</div>
            ${cw.map(course => `
              <a href="${course.url || ('./' + course.path + '/index.html')}" class="cw-link" target="_blank">
                ${course.name || course.id}
                ${course.status === 'official' ? '<span class="badge badge-red">⭐ 官方</span>' : ''}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>`;

    // ===== 前置知识 =====
    html += `
      <div class="path-section prereq-section">
        <div class="section-header"><span class="section-icon">📚</span> 前置知识路径 <span class="count">${path.prerequisites.length}</span></div>`;

    if (path.prerequisites.length > 0) {
      html += '<div class="prereq-chain">';
      path.prerequisites.forEach((node, i) => {
        html += renderNodeCard(node);
        if (i < path.prerequisites.length - 1) {
          html += '<div class="chain-arrow">→</div>';
        }
      });
      html += `<div class="chain-arrow">→</div>
        <div class="path-node current-marker">
          <div class="node-name">🎯 ${c.name}</div>
        </div>`;
      html += '</div>';
    } else {
      html += '<div class="empty-hint">💡 这是该领域的起始知识点，没有前置依赖</div>';
    }
    html += '</div>';

    // ===== 后续方向 =====
    html += `
      <div class="path-section next-section">
        <div class="section-header"><span class="section-icon">🚀</span> 后续学习方向 <span class="count">${path.summary.nextStepCount}</span></div>`;

    if (path.nextSteps.length > 0) {
      html += '<div class="next-tree">';
      html += this._renderNextTree(path.nextSteps, 0, gradeLabel, coursewareBadge);
      html += '</div>';
    } else {
      html += '<div class="empty-hint">🏆 这是该领域的终极知识点，已到达知识链顶端</div>';
    }
    html += '</div>';

    // ===== 平行知识 =====
    if (path.parallel.length > 0) {
      html += `
        <div class="path-section parallel-section">
          <div class="section-header"><span class="section-icon">🔄</span> 同领域知识点 <span class="count">${path.parallel.length}</span></div>
          <div class="parallel-grid">
            ${path.parallel.map(node => renderNodeCard(node)).join('')}
          </div>
        </div>`;
    }

    // ===== 跨学段分析 =====
    if (path.crossGrade.crossesGrades) {
      html += `
        <div class="path-section cross-section">
          <div class="section-header"><span class="section-icon">🎓</span> 跨学段知识链 <span class="count">跨${path.crossGrade.spanCount}个学段</span></div>
          <div class="cross-grade-viz">
            ${path.crossGrade.elementary.length > 0 ? `
              <div class="grade-group">
                <div class="grade-label">🏫 小学</div>
                <div class="grade-nodes">${path.crossGrade.elementary.map(n =>
                  `<span class="grade-node" data-node-id="${n.id}" title="${n.definition || ''}">${n.name}</span>`
                ).join('<span class="mini-arrow">→</span>')}</div>
              </div>
              <div class="grade-connector">⬇</div>
            ` : ''}
            ${path.crossGrade.middle.length > 0 ? `
              <div class="grade-group">
                <div class="grade-label">📘 初中</div>
                <div class="grade-nodes">${path.crossGrade.middle.map(n =>
                  `<span class="grade-node" data-node-id="${n.id}" title="${n.definition || ''}">${n.name}</span>`
                ).join('<span class="mini-arrow">→</span>')}</div>
              </div>
              ${path.crossGrade.high.length > 0 ? '<div class="grade-connector">⬇</div>' : ''}
            ` : ''}
            ${path.crossGrade.high.length > 0 ? `
              <div class="grade-group">
                <div class="grade-label">🎓 高中</div>
                <div class="grade-nodes">${path.crossGrade.high.map(n =>
                  `<span class="grade-node" data-node-id="${n.id}" title="${n.definition || ''}">${n.name}</span>`
                ).join('<span class="mini-arrow">→</span>')}</div>
              </div>
            ` : ''}
          </div>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // 绑定点击事件：点击任意节点可跳转
    container.querySelectorAll('.clickable[data-node-id]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const id = el.dataset.nodeId;
        // 更新选择器
        const sel = document.getElementById('nodeSelect');
        if (sel) sel.value = id;
        // 更新URL
        history.pushState(null, '', `?node=${id}`);
        // 渲染新路径
        this.renderPathVisualization(id, containerId);
        // 滚动到顶部
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    container.querySelectorAll('.grade-node[data-node-id]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const id = el.dataset.nodeId;
        const sel = document.getElementById('nodeSelect');
        if (sel) sel.value = id;
        history.pushState(null, '', `?node=${id}`);
        this.renderPathVisualization(id, containerId);
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  _renderNextTree(nodes, level, gradeLabel, coursewareBadge) {
    return nodes.map(node => {
      const indent = level * 24;
      const hasChildren = node.children && node.children.length > 0;
      return `
        <div class="next-node level-${level}" style="margin-left:${indent}px">
          <div class="next-node-card clickable" data-node-id="${node.id}" title="${node.definition || node.name}">
            <span class="tree-prefix">${level === 0 ? '├─' : '└─'}</span>
            <span class="node-grade-tag">${gradeLabel(node.grade)}</span>
            <span class="node-name">${node.name}</span>
            ${coursewareBadge(node)}
          </div>
          ${hasChildren ? this._renderNextTree(node.children, level + 1, gradeLabel, coursewareBadge) : ''}
        </div>`;
    }).join('');
  }
}

// ─── 全局实例 ────────────────────────────────────

window.TeachAnyLearningPath = new LearningPathSystem();

// ─── 公共API ─────────────────────────────────────

window.TeachAnyLearningPath.api = {
  /** 显示知识点学习路径（即时，从缓存） */
  showPath: async (nodeId, containerId = 'learning-path-container') => {
    const sys = window.TeachAnyLearningPath;
    await sys.initialize();
    sys.renderPathVisualization(nodeId, containerId);
  },

  /** 获取路径数据（即时，从缓存） */
  getPath: async (nodeId) => {
    const sys = window.TeachAnyLearningPath;
    await sys.initialize();
    return sys.getLearningPath(nodeId);
  },

  /** 获取跨学段路径 */
  getCrossGradePath: async (nodeId) => {
    const sys = window.TeachAnyLearningPath;
    await sys.initialize();
    const path = sys.getLearningPath(nodeId);
    return path ? path.crossGrade : null;
  },

  /** 搜索知识点 */
  searchNodes: async (query) => {
    const sys = window.TeachAnyLearningPath;
    await sys.initialize();
    return sys.searchNodes(query);
  },

  /** 获取全局统计 */
  getStats: async () => {
    const sys = window.TeachAnyLearningPath;
    await sys.initialize();
    return {
      totalNodes: sys.nodeIndex.size,
      coursewareCoverage: sys.courseIndex.size,
      cachedPaths: sys.pathCache.size,
      subjects: Array.from(sys.subjectMap.keys()),
      grades: Array.from(sys.gradeMap.keys()).sort((a, b) => a - b),
      rawStats: sys.stats
    };
  }
};

console.log('[TeachAny] 学习路径系统 v2.0 已加载');
