/**
 * TeachAny 统计数字更新模块
 * 
 * 功能:
 * 1. 监听官方课件和社区课件加载完成
 * 2. 自动更新首页 Hero 区域的统计数字
 * 3. 计算学科数量(去重)
 * 
 * 依赖:
 * - registry-loader.js (官方课件)
 * - community-loader.js (社区课件)
 */

/* ─── 全局状态 ─────────────────────────────── */
window.TeachAnyStats = window.TeachAnyStats || {
  officialCount: 0,
  communityCount: 0,
  subjects: new Set(),
  nodesCount: 646 // 暂时硬编码,待从知识树文件动态加载
};

/* ─── 更新统计数字 ─────────────────────────── */
function updateStatsDisplay() {
  const stats = window.TeachAnyStats;
  
  // 官方课件数
  const officialEl = document.getElementById('officialCountStat');
  if (officialEl) {
    officialEl.textContent = stats.officialCount;
  }
  
  // 社区课件数
  const communityEl = document.getElementById('communityCountStat');
  if (communityEl) {
    communityEl.textContent = stats.communityCount;
  }
  
  // 学科数
  const subjectsEl = document.getElementById('subjectsCountStat');
  if (subjectsEl) {
    subjectsEl.textContent = stats.subjects.size;
  }
  
  // 知识节点数(暂时不动态更新)
  const nodesEl = document.getElementById('nodesCountStat');
  if (nodesEl && stats.nodesCount > 0) {
    nodesEl.textContent = stats.nodesCount;
  }
  
  console.log('📊 Stats updated:', {
    official: stats.officialCount,
    community: stats.communityCount,
    subjects: stats.subjects.size,
    nodes: stats.nodesCount
  });
}

/* ─── 注册官方课件数据 ─────────────────────── */
window.TeachAnyStats.registerOfficial = function(registry) {
  if (!registry || !registry.courses) return;
  
  const stats = window.TeachAnyStats;
  stats.officialCount = registry.courses.length;
  
  // 收集学科
  registry.courses.forEach(course => {
    if (course.subject) {
      stats.subjects.add(course.subject);
    }
  });
  
  updateStatsDisplay();
};

/* ─── 注册社区课件数据 ─────────────────────── */
window.TeachAnyStats.registerCommunity = function(index) {
  if (!index || !index.courses) return;
  
  const stats = window.TeachAnyStats;
  stats.communityCount = index.courses.length;
  
  // 收集学科
  index.courses.forEach(course => {
    if (course.subject) {
      stats.subjects.add(course.subject);
    }
  });
  
  updateStatsDisplay();
};

/* ─── 初始化:DOMContentLoaded 后立即更新 ──── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateStatsDisplay);
} else {
  updateStatsDisplay();
}

console.log('✅ TeachAny Stats Updater loaded');
