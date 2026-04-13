/**
 * TeachAny 学习路径系统
 * 打通各学段知识点，构建完整知识图谱网络
 */

class LearningPathSystem {
  constructor() {
    this.graphs = new Map(); // 存储所有知识图谱
    this.nodeIndex = new Map(); // node_id -> 完整节点信息的索引
    this.courseIndex = new Map(); // node_id -> 课件列表的索引
    this.pathCache = new Map(); // 路径缓存
    this.initialized = false;
  }

  /**
   * 初始化系统：加载所有图谱和课件
   */
  async initialize() {
    if (this.initialized) return;

    console.log('[LearningPath] 开始初始化学习路径系统...');
    
    try {
      // 1. 加载课件注册表
      await this.loadCourseRegistry();
      
      // 2. 加载知识图谱元数据
      await this.loadGraphMetadata();
      
      // 3. 构建索引
      this.buildIndices();
      
      this.initialized = true;
      console.log('[LearningPath] 初始化完成');
      console.log(`  - 知识节点: ${this.nodeIndex.size} 个`);
      console.log(`  - 覆盖课件: ${this.courseIndex.size} 个知识点`);
    } catch (error) {
      console.error('[LearningPath] 初始化失败:', error);
    }
  }

  /**
   * 加载课件注册表
   */
  async loadCourseRegistry() {
    const response = await fetch('./registry.json?t=' + Date.now());
    const registry = await response.json();
    
    // 按 node_id 分组课件
    registry.courses.forEach(course => {
      if (course.node_id) {
        if (!this.courseIndex.has(course.node_id)) {
          this.courseIndex.set(course.node_id, []);
        }
        this.courseIndex.get(course.node_id).push(course);
      }
    });
  }

  /**
   * 加载知识图谱元数据（硬编码版本，实际可从API获取）
   */
  async loadGraphMetadata() {
    // 这里使用硬编码的图谱结构
    // 实际部署时应从后端API或构建时生成的metadata.json加载
    
    // 示例：数学-数与运算图谱的部分节点
    const sampleNodes = {
      // 小学数学
      'counting-1-10': {
        id: 'counting-1-10',
        name: '10以内数的认识',
        subject: 'math',
        grade: 1,
        prerequisites: [],
        nextSteps: ['counting-20', 'addition-subtraction-within-10'],
        domain: 'numbers-operations',
        graph: 'math/numbers-operations/_graph.json'
      },
      'addition-subtraction-within-10': {
        id: 'addition-subtraction-within-10',
        name: '10以内加减法',
        subject: 'math',
        grade: 1,
        prerequisites: ['counting-1-10'],
        nextSteps: ['counting-20', 'addition-subtraction-within-20'],
        domain: 'numbers-operations',
        graph: 'math/numbers-operations/_graph.json'
      },
      'addition-subtraction-within-20': {
        id: 'addition-subtraction-within-20',
        name: '20以内加减法',
        subject: 'math',
        grade: 1,
        prerequisites: ['addition-subtraction-within-10', 'counting-20'],
        nextSteps: ['multiplication-division-concept', 'addition-subtraction-within-100'],
        domain: 'numbers-operations',
        graph: 'math/numbers-operations/_graph.json'
      },
      
      // 初中数学
      'rational-numbers': {
        id: 'rational-numbers',
        name: '有理数',
        subject: 'math',
        grade: 7,
        prerequisites: ['fractions-operations', 'integers'],
        nextSteps: ['real-numbers', 'algebraic-expressions'],
        domain: 'algebra',
        graph: 'math/algebra/_graph.json'
      },
      
      // 高中数学
      'sets-logic': {
        id: 'sets-logic',
        name: '集合与逻辑',
        subject: 'math',
        grade: 10,
        prerequisites: ['rational-numbers', 'real-numbers'],
        nextSteps: ['functions-advanced', 'inequalities'],
        domain: 'high-school',
        graph: 'math/high-school/_graph.json'
      },
      'functions-advanced': {
        id: 'functions-advanced',
        name: '函数与性质',
        subject: 'math',
        grade: 10,
        prerequisites: ['sets-logic', 'linear-functions', 'quadratic-functions'],
        nextSteps: ['derivatives', 'exponential-logarithm'],
        domain: 'high-school',
        graph: 'math/high-school/_graph.json'
      }
    };

    // 将样本节点加入索引
    Object.values(sampleNodes).forEach(node => {
      this.nodeIndex.set(node.id, node);
    });

    console.log('[LearningPath] 加载了', Object.keys(sampleNodes).length, '个样本节点');
  }

  /**
   * 构建索引
   */
  buildIndices() {
    // 反向索引：从后继节点找到所有前置节点
    this.nodeIndex.forEach((node, nodeId) => {
      node.nextSteps?.forEach(nextId => {
        const nextNode = this.nodeIndex.get(nextId);
        if (nextNode) {
          if (!nextNode.prerequisites) nextNode.prerequisites = [];
          if (!nextNode.prerequisites.includes(nodeId)) {
            nextNode.prerequisites.push(nodeId);
          }
        }
      });
    });
  }

  /**
   * 获取知识点的完整学习路径
   */
  getLearningPath(nodeId) {
    const node = this.nodeIndex.get(nodeId);
    if (!node) {
      console.warn(`[LearningPath] 未找到节点: ${nodeId}`);
      return null;
    }

    // 1. 获取前置路径（从最基础到当前节点）
    const prerequisites = this.getPrerequisitePath(nodeId);
    
    // 2. 获取后续路径（当前节点之后的学习方向）
    const nextSteps = this.getNextStepsPath(nodeId);
    
    // 3. 获取平行知识点（同年级同学科）
    const parallel = this.getParallelNodes(nodeId);
    
    // 4. 获取关联课件
    const coursewares = this.courseIndex.get(nodeId) || [];

    return {
      current: node,
      prerequisites: prerequisites,
      nextSteps: nextSteps,
      parallel: parallel,
      coursewares: coursewares,
      pathSummary: {
        depth: prerequisites.length,
        breadth: nextSteps.length,
        alternatives: parallel.length,
        resources: coursewares.length
      }
    };
  }

  /**
   * 递归获取所有前置节点（深度优先）
   */
  getPrerequisitePath(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = this.nodeIndex.get(nodeId);
    if (!node || !node.prerequisites || node.prerequisites.length === 0) {
      return [];
    }

    const path = [];
    node.prerequisites.forEach(preId => {
      const preNode = this.nodeIndex.get(preId);
      if (preNode) {
        // 递归获取更深层的前置
        const deeperPath = this.getPrerequisitePath(preId, visited);
        path.push(...deeperPath);
        path.push({
          ...preNode,
          coursewares: this.courseIndex.get(preId) || []
        });
      }
    });

    return path;
  }

  /**
   * 获取后续学习路径
   */
  getNextStepsPath(nodeId, depth = 2, visited = new Set()) {
    if (depth === 0 || visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = this.nodeIndex.get(nodeId);
    if (!node || !node.nextSteps || node.nextSteps.length === 0) {
      return [];
    }

    const path = [];
    node.nextSteps.forEach(nextId => {
      const nextNode = this.nodeIndex.get(nextId);
      if (nextNode) {
        path.push({
          ...nextNode,
          coursewares: this.courseIndex.get(nextId) || [],
          children: depth > 1 ? this.getNextStepsPath(nextId, depth - 1, visited) : []
        });
      }
    });

    return path;
  }

  /**
   * 获取平行知识点（同年级、同学科）
   */
  getParallelNodes(nodeId) {
    const node = this.nodeIndex.get(nodeId);
    if (!node) return [];

    const parallel = [];
    this.nodeIndex.forEach((otherNode, otherId) => {
      if (otherId !== nodeId &&
          otherNode.subject === node.subject &&
          otherNode.grade === node.grade &&
          otherNode.domain === node.domain) {
        parallel.push({
          ...otherNode,
          coursewares: this.courseIndex.get(otherId) || []
        });
      }
    });

    return parallel;
  }

  /**
   * 获取跨学段知识链
   */
  getCrossGradePath(nodeId) {
    const path = this.getLearningPath(nodeId);
    if (!path) return null;

    // 按年级分组
    const byGrade = {
      elementary: [],
      middle: [],
      high: []
    };

    const classifyNode = (node) => {
      const grade = parseInt(node.grade);
      if (grade <= 6) return 'elementary';
      if (grade <= 9) return 'middle';
      return 'high';
    };

    // 分类前置节点
    path.prerequisites.forEach(node => {
      const level = classifyNode(node);
      byGrade[level].push(node);
    });

    // 当前节点
    const currentLevel = classifyNode(path.current);
    byGrade[currentLevel].push(path.current);

    // 分类后续节点
    const flattenNextSteps = (nodes) => {
      let result = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children) {
          result = result.concat(flattenNextSteps(node.children));
        }
      });
      return result;
    };

    flattenNextSteps(path.nextSteps).forEach(node => {
      const level = classifyNode(node);
      byGrade[level].push(node);
    });

    return {
      nodeId: nodeId,
      nodeName: path.current.name,
      elementary: byGrade.elementary,
      middle: byGrade.middle,
      high: byGrade.high,
      summary: {
        '小学': byGrade.elementary.length,
        '初中': byGrade.middle.length,
        '高中': byGrade.high.length
      }
    };
  }

  /**
   * 渲染学习路径可视化
   */
  renderPathVisualization(nodeId, containerId) {
    const path = this.getLearningPath(nodeId);
    if (!path) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="learning-path-viz">
        <!-- 前置路径 -->
        <div class="path-section prerequisites">
          <h3>📚 前置知识 (${path.prerequisites.length})</h3>
          <div class="node-list">
            ${path.prerequisites.map(node => `
              <div class="path-node" data-node-id="${node.id}">
                <div class="node-grade">年级: ${node.grade}</div>
                <div class="node-name">${node.name}</div>
                <div class="node-courses">${node.coursewares.length} 个课件</div>
              </div>
            `).join('<div class="arrow">→</div>')}
          </div>
        </div>

        <!-- 当前节点 -->
        <div class="path-section current">
          <h3>🎯 当前知识点</h3>
          <div class="current-node">
            <h2>${path.current.name}</h2>
            <p>年级: ${path.current.grade} | 学科: ${path.current.subject}</p>
            <p>可用课件: ${path.coursewares.length} 个</p>
            ${path.coursewares.map(c => `
              <a href="${c.url || c.path}" class="courseware-link">
                ${c.emoji || '📖'} ${c.name}
              </a>
            `).join('')}
          </div>
        </div>

        <!-- 后续路径 -->
        <div class="path-section next-steps">
          <h3>🚀 后续方向 (${path.nextSteps.length})</h3>
          <div class="node-tree">
            ${this.renderNextStepsTree(path.nextSteps)}
          </div>
        </div>

        <!-- 平行知识点 -->
        ${path.parallel.length > 0 ? `
          <div class="path-section parallel">
            <h3>🔄 同级知识点 (${path.parallel.length})</h3>
            <div class="node-grid">
              ${path.parallel.map(node => `
                <div class="parallel-node" data-node-id="${node.id}">
                  <div class="node-name">${node.name}</div>
                  <div class="node-courses">${node.coursewares.length} 课件</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    // 添加交互事件
    this.attachPathEvents(container);
  }

  /**
   * 渲染后续节点树
   */
  renderNextStepsTree(nodes, level = 0) {
    return nodes.map(node => `
      <div class="tree-node level-${level}" data-node-id="${node.id}">
        <div class="node-content">
          <div class="node-grade">年级: ${node.grade}</div>
          <div class="node-name">${node.name}</div>
          <div class="node-courses">${node.coursewares.length} 个课件</div>
        </div>
        ${node.children && node.children.length > 0 ? `
          <div class="node-children">
            ${this.renderNextStepsTree(node.children, level + 1)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * 附加交互事件
   */
  attachPathEvents(container) {
    const nodes = container.querySelectorAll('[data-node-id]');
    nodes.forEach(el => {
      el.addEventListener('click', (e) => {
        const nodeId = el.dataset.nodeId;
        this.renderPathVisualization(nodeId, container.id);
      });
    });
  }

  /**
   * 生成跨学段学习地图
   */
  generateCrossGradeMap(subject) {
    const subjectNodes = [];
    this.nodeIndex.forEach((node, nodeId) => {
      if (node.subject === subject) {
        subjectNodes.push(node);
      }
    });

    // 按年级排序
    subjectNodes.sort((a, b) => a.grade - b.grade);

    return {
      subject: subject,
      totalNodes: subjectNodes.length,
      gradeDistribution: this.groupByGrade(subjectNodes),
      continuityChains: this.findContinuityChains(subjectNodes)
    };
  }

  /**
   * 按年级分组
   */
  groupByGrade(nodes) {
    const groups = {};
    nodes.forEach(node => {
      const grade = `年级${node.grade}`;
      if (!groups[grade]) groups[grade] = [];
      groups[grade].push(node);
    });
    return groups;
  }

  /**
   * 查找连续性链条
   */
  findContinuityChains(nodes) {
    // 找出所有跨越小学-初中-高中的知识链
    const chains = [];
    
    nodes.forEach(node => {
      if (node.grade <= 6) { // 从小学节点开始
        const chain = this.traceContinuityChain(node.id);
        if (chain.crossesGrades) {
          chains.push(chain);
        }
      }
    });

    return chains;
  }

  /**
   * 追踪连续性链条
   */
  traceContinuityChain(startNodeId) {
    const chain = {
      start: startNodeId,
      nodes: [],
      crossesGrades: false
    };

    let current = this.nodeIndex.get(startNodeId);
    const visited = new Set();
    const grades = new Set();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.nodes.push(current);
      grades.add(Math.floor(current.grade / 3)); // 0=小学, 1-2=初中, 3+=高中

      if (current.nextSteps && current.nextSteps.length > 0) {
        current = this.nodeIndex.get(current.nextSteps[0]);
      } else {
        break;
      }
    }

    chain.crossesGrades = grades.size > 1;
    return chain;
  }
}

// 创建全局实例
window.TeachAnyLearningPath = new LearningPathSystem();

// 导出API
window.TeachAnyLearningPath.api = {
  /**
   * 显示知识点的学习路径
   */
  showPath: async (nodeId, containerId = 'learning-path-container') => {
    await window.TeachAnyLearningPath.initialize();
    window.TeachAnyLearningPath.renderPathVisualization(nodeId, containerId);
  },
  
  /**
   * 获取跨学段路径数据
   */
  getCrossGradePath: async (nodeId) => {
    await window.TeachAnyLearningPath.initialize();
    return window.TeachAnyLearningPath.getCrossGradePath(nodeId);
  },
  
  /**
   * 生成学科学习地图
   */
  generateSubjectMap: async (subject) => {
    await window.TeachAnyLearningPath.initialize();
    return window.TeachAnyLearningPath.generateCrossGradeMap(subject);
  }
};

console.log('[TeachAny] 学习路径系统已加载');
console.log('使用方法:');
console.log('  - TeachAnyLearningPath.api.showPath("node-id") - 显示学习路径');
console.log('  - TeachAnyLearningPath.api.getCrossGradePath("node-id") - 获取跨学段路径');
console.log('  - TeachAnyLearningPath.api.generateSubjectMap("math") - 生成学科地图');
