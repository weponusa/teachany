/**
 * TeachAny 实时统计计算器 (v5.35 rewrite)
 * 
 * 全部指标从真实数据源动态计算：
 *   - registry.json       → 课件总数 / 官方 / 社区 / 学科分布 / 课标体系分布
 *   - data/curricula.json → 课标体系数 + 知识树清单
 *   - data/trees/*.json (递归含 international/) → 真实节点数 + 图谱数
 * 
 * 不再硬编码任何统计数字。
 */

class StatsCalculator {
  constructor() {
    this.registry = null;
    this.curricula = null;
    this.trees = [];          // [{ file, standard, subject, curriculum, nodeCount, domainCount }]
    this.stats = {
      totalCourses: 0,
      officialCourses: 0,
      communityCourses: 0,
      subjects: 0,
      subjectsUnique: 0,
      totalNodes: 0,
      graphFiles: 0,
      curriculumCount: 0,
      subjectDistribution: {},
      gradeDistribution: {},
      curriculumDistribution: {},
      nodesCovered: 0,
      coverageRate: 0,
    };
  }

  /* ─── Load registry ─── */
  async loadRegistry() {
    try {
      const res = await fetch('./registry.json?t=' + Date.now());
      this.registry = await res.json();
      return this.registry;
    } catch (e) {
      console.error('[Stats] registry.json load failed:', e);
      return null;
    }
  }

  /* ─── Load curricula + all trees ─── */
  async loadAllTrees() {
    try {
      const res = await fetch('./data/curricula.json?t=' + Date.now());
      this.curricula = await res.json();
    } catch (e) {
      console.warn('[Stats] curricula.json load failed, using fallback:', e);
      this.curricula = { curricula: [] };
    }

    const treeFiles = [];
    for (const c of (this.curricula.curricula || [])) {
      for (const t of (c.trees || [])) {
        treeFiles.push({ file: t.file, curriculum: c.id, label: t.label_zh || t.label_en || t.file });
      }
    }

    let totalNodes = 0;
    const loadPromises = treeFiles.map(async (meta) => {
      try {
        const res = await fetch('./' + meta.file + '?t=' + Date.now());
        if (!res.ok) return null;
        const tree = await res.json();
        let nodeCount = 0;
        for (const d of (tree.domains || [])) {
          nodeCount += (d.nodes || []).length;
        }
        return {
          file: meta.file,
          curriculum: meta.curriculum,
          subject: tree.subject || '',
          domainCount: (tree.domains || []).length,
          nodeCount,
        };
      } catch (e) {
        console.warn('[Stats] tree load failed:', meta.file, e);
        return null;
      }
    });

    const results = (await Promise.all(loadPromises)).filter(Boolean);
    this.trees = results;
    results.forEach(t => { totalNodes += t.nodeCount; });

    this.stats.totalNodes = totalNodes;
    this.stats.graphFiles = results.length;
    this.stats.curriculumCount = (this.curricula.curricula || []).length;
    return results;
  }

  /* ─── Course stats from registry ─── */
  calculateCourseStats() {
    if (!this.registry || !this.registry.courses) return null;
    const courses = this.registry.courses;

    this.stats.totalCourses = courses.length;
    this.stats.officialCourses = courses.filter(c => c.status === 'official').length;
    this.stats.communityCourses = courses.filter(c => c.status === 'community').length;

    // Subject distribution — derived from courses + trees (union)
    const subjectNames = {
      math: '数学', biology: '生物', physics: '物理', chemistry: '化学',
      geography: '地理', history: '历史', chinese: '语文', english: '英语',
      science: '科学', info_tech: '信息技术', economics: '经济学',
      cs: '计算机', arts: '艺术', design: '设计', pe: '体育',
    };
    const subjectsFromCourses = new Set(courses.map(c => c.subject).filter(Boolean));
    const subjectsFromTrees = new Set(this.trees.map(t => t.subject).filter(Boolean));
    const allSubjects = new Set([...subjectsFromCourses, ...subjectsFromTrees]);

    const distribution = {};
    courses.forEach(c => {
      const name = subjectNames[c.subject] || c.subject || 'other';
      distribution[name] = (distribution[name] || 0) + 1;
    });
    this.stats.subjectDistribution = distribution;
    this.stats.subjects = allSubjects.size;  // union count
    this.stats.subjectsUnique = subjectsFromCourses.size; // courses-only count

    // Grade distribution
    const grades = {};
    courses.forEach(c => {
      const g = parseInt(c.grade);
      if (!g) return;
      const lvl = g <= 6 ? '小学' : g <= 9 ? '初中' : '高中';
      grades[lvl] = (grades[lvl] || 0) + 1;
    });
    this.stats.gradeDistribution = grades;

    // Curriculum distribution
    const currDist = {};
    courses.forEach(c => {
      const cr = c.curriculum || 'cn-national';
      currDist[cr] = (currDist[cr] || 0) + 1;
    });
    this.stats.curriculumDistribution = currDist;

    // Coverage
    const uniqueNodes = new Set(courses.map(c => c.node_id).filter(Boolean));
    this.stats.nodesCovered = uniqueNodes.size;
    this.stats.coverageRate = this.stats.totalNodes > 0
      ? (uniqueNodes.size / this.stats.totalNodes * 100).toFixed(2)
      : '0';

    return this.stats;
  }

  async getFullStats() {
    // Parallel load for speed
    await Promise.all([this.loadRegistry(), this.loadAllTrees()]);
    this.calculateCourseStats();
    return {
      ...this.stats,
      timestamp: new Date().toISOString(),
      version: this.registry?.version || 'unknown',
    };
  }

  /* ─── Update page DOM ─── */
  async updatePageStats() {
    const stats = await this.getFullStats();

    const updates = {
      'stat-total': stats.totalCourses,
      'totalCountStat': stats.totalCourses,
      'stat-official': stats.officialCourses,
      'officialCountStat': stats.officialCourses,
      'stat-community': stats.communityCourses,
      'communityCountStat': stats.communityCourses,
      'subjectsCountStat': stats.subjects,
      'nodesCountStat': stats.totalNodes,
      'graphsCountStat': stats.graphFiles,
      'curriculumCountStat': stats.curriculumCount,  // v5.35 新增
    };

    Object.entries(updates).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transition = 'all 0.3s ease';
      el.textContent = value;
      el.style.transform = 'scale(1.1)';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    });

    console.log('[TeachAny Stats] 实时统计数据:', {
      '总课件': stats.totalCourses,
      '官方': stats.officialCourses,
      '社区': stats.communityCourses,
      '学科': stats.subjects,
      '知识节点': stats.totalNodes,
      '知识图谱': stats.graphFiles,
      '课标体系': stats.curriculumCount,
      '节点覆盖': `${stats.nodesCovered}/${stats.totalNodes} (${stats.coverageRate}%)`,
      '学科分布': stats.subjectDistribution,
      '学段分布': stats.gradeDistribution,
      '课标分布': stats.curriculumDistribution,
    });

    return stats;
  }
}

window.TeachAnyStats = new StatsCalculator();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TeachAnyStats.updatePageStats();
  });
} else {
  window.TeachAnyStats.updatePageStats();
}
