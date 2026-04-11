/**
 * TeachAny Featured Loader（星标推荐加载器）
 *
 * 功能：
 * 1. 从 data/featured.json 加载星标推荐课件列表
 * 2. 与 courseware-registry.json 联合查询课件详情
 * 3. 在 Gallery 中渲染 ⭐ 星标推荐区（Featured Section）
 * 4. 在知识地图 tooltip 中显示星标课件
 * 5. 支持管理员审核状态：starred → approved → 知识地图可见
 *
 * 数据流：
 *   TeachAny SKILL 生成课件 → 推送到 featured.json（starred）
 *   → Gallery 显示星标推荐区
 *   → 管理员审核 → approved → 知识地图显示
 */

/* ─── 常量 ───────────────────────────────────── */
const FEATURED_LOCAL_URL = './data/featured.json';
const FEATURED_REMOTE_URL = 'https://raw.githubusercontent.com/weponusa/teachany/main/data/featured.json';
const FEATURED_CACHE_KEY = 'teachany_featured_cache';
const FEATURED_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

/* ─── 缓存 ───────────────────────────────────── */
function readFeaturedCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(FEATURED_CACHE_KEY) || 'null');
    if (!raw || !raw.data || !raw.timestamp) return null;
    if (Date.now() - raw.timestamp > FEATURED_CACHE_TTL) return null;
    return raw.data;
  } catch {
    return null;
  }
}

function saveFeaturedCache(data) {
  try {
    localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

/* ─── 加载 Featured 数据 ─────────────────────── */
async function fetchFeatured(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = readFeaturedCache();
    if (cached) return cached;
  }

  // 先尝试本地文件
  try {
    const resp = await fetch(FEATURED_LOCAL_URL + '?v=' + Date.now(), { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      saveFeaturedCache(data);
      return data;
    }
  } catch {}

  // 回退到 GitHub raw
  try {
    const resp = await fetch(FEATURED_REMOTE_URL + '?v=' + Date.now(), { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      saveFeaturedCache(data);
      return data;
    }
  } catch {}

  // 完全离线：回退到过期缓存
  try {
    const raw = JSON.parse(localStorage.getItem(FEATURED_CACHE_KEY) || 'null');
    if (raw?.data) return raw.data;
  } catch {}

  console.warn('[TeachAny Featured] 无法加载星标推荐数据');
  return { version: '1.0', featured: [], _offline: true };
}

/* ─── HTML 安全转义 ──────────────────────────── */
function featuredEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── 查询 API ───────────────────────────────── */

/**
 * 获取所有星标课件（starred + approved）
 */
function getAllFeatured(featuredData) {
  const data = featuredData || readFeaturedCache() || { featured: [] };
  return (data.featured || []).filter(f => f.status === 'starred' || f.status === 'approved');
}

/**
 * 获取已通过审核的课件（approved），可显示在知识地图
 */
function getApprovedFeatured(featuredData) {
  const data = featuredData || readFeaturedCache() || { featured: [] };
  return (data.featured || []).filter(f => f.status === 'approved');
}

/**
 * 获取指定 node_id 对应的星标课件
 * 需要联合 registry 查询 node_id
 */
function getFeaturedByNodeId(nodeId, featuredData, registryCourses) {
  const featured = getAllFeatured(featuredData);
  const featuredIds = new Set(featured.map(f => f.id));

  if (!registryCourses) {
    // 尝试从全局获取 registry
    try {
      const cached = JSON.parse(localStorage.getItem('teachany_registry_cache') || 'null');
      registryCourses = cached?.data?.courses || [];
    } catch {
      registryCourses = [];
    }
  }

  return registryCourses.filter(c => c.node_id === nodeId && featuredIds.has(c.id));
}

/**
 * 获取指定 node_id 的已审核星标课件数量
 */
function getApprovedCountForNode(nodeId, featuredData, registryCourses) {
  const approved = getApprovedFeatured(featuredData);
  const approvedIds = new Set(approved.map(f => f.id));

  if (!registryCourses) {
    try {
      const cached = JSON.parse(localStorage.getItem('teachany_registry_cache') || 'null');
      registryCourses = cached?.data?.courses || [];
    } catch {
      registryCourses = [];
    }
  }

  return registryCourses.filter(c => c.node_id === nodeId && approvedIds.has(c.id)).length;
}

/**
 * 判断课件是否为星标推荐
 */
function isFeatured(courseId, featuredData) {
  const featured = getAllFeatured(featuredData);
  return featured.some(f => f.id === courseId);
}

/**
 * 获取课件的推荐状态
 */
function getFeaturedStatus(courseId, featuredData) {
  const data = featuredData || readFeaturedCache() || { featured: [] };
  const item = (data.featured || []).find(f => f.id === courseId);
  return item ? item.status : null;
}

/* ─── 渲染星标推荐卡片到官方区 Grid ─────────── */

/**
 * 在指定 Grid 中渲染 Featured 课件卡片（不再创建独立 Section）
 * Featured 课件直接混入官方区 Grid，带 ⭐ 标记
 * @param {HTMLElement} grid - 目标 grid（通常是 #officialGrid）
 * @param {Object} featuredData - featured.json 数据
 * @param {Array} registryCourses - registry 课件列表
 */
function renderFeaturedCards(grid, featuredData, registryCourses) {
  // 移除旧的 featured 卡片
  grid.querySelectorAll('.featured-card').forEach(el => el.remove());

  // 同时移除旧的独立 featured section（如果还残留）
  const oldSection = document.getElementById('featuredSection');
  if (oldSection) oldSection.remove();

  const featured = getAllFeatured(featuredData);
  if (!featured.length || !registryCourses?.length) return;

  // 构建 featured ID → status 映射
  const statusMap = {};
  featured.forEach(f => { statusMap[f.id] = f; });

  // 从 registry 中获取 featured 课件的完整信息
  const featuredCourses = registryCourses.filter(c => statusMap[c.id]);
  if (!featuredCourses.length) return;

  // 排除已经在 registry 中渲染的卡片（避免重复）
  const existingIds = new Set();
  grid.querySelectorAll('.course-card[data-course-id]').forEach(el => {
    existingIds.add(el.dataset.courseId);
  });

  // 学科 emoji 映射
  const subjectEmoji = {
    math: '📐', physics: '⚡', biology: '🧬', chemistry: '🧪',
    geography: '🌍', history: '📜', chinese: '📖', english: '🔤',
    'info-tech': '💻'
  };

  const gradeToLevel = window.TeachAnyRegistry?.gradeToLevelRegistry || function(g) {
    g = parseInt(g);
    if (g >= 1 && g <= 6) return 'elementary';
    if (g >= 7 && g <= 9) return 'middle';
    if (g >= 10 && g <= 12) return 'high';
    return 'other';
  };

  // 为已存在的 registry 卡片添加 featured badge
  featuredCourses.forEach(course => {
    const status = statusMap[course.id];
    const isApproved = status?.status === 'approved';

    if (existingIds.has(course.id)) {
      // 卡片已存在：只添加 featured badge
      const existingCard = grid.querySelector(`.course-card[data-course-id="${course.id}"]`);
      if (existingCard) {
        existingCard.classList.add('featured-card');
        if (isApproved) existingCard.classList.add('approved');
        // 在标题后插入 badge（如果还没有）
        const titleEl = existingCard.querySelector('.card-title');
        if (titleEl && !titleEl.querySelector('.featured-badge')) {
          const badge = isApproved
            ? '<span class="featured-badge approved">✅ 已审核</span>'
            : '<span class="featured-badge starred">⭐ 星标推荐</span>';
          titleEl.insertAdjacentHTML('beforeend', badge);
        }
      }
      return;
    }

    // 新卡片：创建并插入到 grid 中
    const emoji = subjectEmoji[course.subject] || '📚';
    const url = course.local_path ? `./examples/${course.local_path}/index.html` : null;
    const level = gradeToLevel(course.grade);

    const badge = isApproved
      ? '<span class="featured-badge approved">✅ 已审核</span>'
      : '<span class="featured-badge starred">⭐ 星标推荐</span>';

    // 爱心点赞
    let likeCount = 0, isLiked = false;
    if (window.TeachAnyRegistry) {
      likeCount = TeachAnyRegistry.getRegistryLikeCount(course.id);
      isLiked = TeachAnyRegistry.isRegistryLikedInSession(course.id);
    }
    const likeHtml = `<button class="ta-like-btn${isLiked ? ' liked' : ''}" data-registry-like="${featuredEscapeHtml(course.id)}" onclick="event.preventDefault();event.stopPropagation();window._toggleRegistryLike(this)" title="点赞">
      <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
      <span class="like-count">${likeCount}</span>
    </button>`;

    // 导出按钮（如果有 local_path）
    const exportBtnHtml = url
      ? `<button class="ta-export-btn" onclick="event.preventDefault();event.stopPropagation();window.TeachAnyExport.exportCourseware({url:'${featuredEscapeHtml(url)}',courseName:'${featuredEscapeHtml(course.name)}',onProgress:(s,m)=>console.log(m)})" title="导出离线课件包">📦 导出</button>`
      : '';

    const tagName = url ? 'a' : 'div';
    const card = document.createElement(tagName);
    if (url) card.setAttribute('href', url);
    card.className = `course-card featured-card${isApproved ? ' approved' : ''}`;
    card.dataset.subject = course.subject || '';
    card.dataset.courseId = course.id;
    card.dataset.grade = course.grade || '';
    card.dataset.level = level;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-emoji">${emoji}</div>
        <h3 class="card-title">
          ${featuredEscapeHtml(course.name)}
          ${badge}
        </h3>
        <p class="card-desc">${featuredEscapeHtml(course.description_zh || course.description || '')}</p>
        <div class="card-tags">
          <span class="tag tag-blue">${featuredEscapeHtml(course.subject)}</span>
          <span class="tag tag-purple">Grade ${course.grade || '?'}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          ${course.duration ? `<span>⏱️ ${featuredEscapeHtml(course.duration)}</span>` : ''}
          <span>📅 ${featuredEscapeHtml(status?.pushed_at || '')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${likeHtml}
          ${exportBtnHtml}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  console.log(`[TeachAny Featured] ✅ 渲染 ${featuredCourses.length} 个星标课件到官方区`);
}

/* ─── 知识地图增强：星标课件计数 ────────────── */

/**
 * 获取某节点的星标推荐课件统计（用于 tree.html tooltip）
 * @param {string} nodeId
 * @param {Object} featuredData
 * @param {Array} registryCourses
 * @returns {{ total: number, approved: number, starred: number }}
 */
function getFeaturedStatsForNode(nodeId, featuredData, registryCourses) {
  const data = featuredData || readFeaturedCache() || { featured: [] };
  const allFeatured = data.featured || [];

  if (!registryCourses) {
    try {
      const cached = JSON.parse(localStorage.getItem('teachany_registry_cache') || 'null');
      registryCourses = cached?.data?.courses || [];
    } catch {
      registryCourses = [];
    }
  }

  // 获取该节点对应的 registry 课件 ID 列表
  const nodeCoursesIds = new Set(
    registryCourses.filter(c => c.node_id === nodeId).map(c => c.id)
  );

  const nodeFeatured = allFeatured.filter(f =>
    nodeCoursesIds.has(f.id) && (f.status === 'starred' || f.status === 'approved')
  );

  return {
    total: nodeFeatured.length,
    approved: nodeFeatured.filter(f => f.status === 'approved').length,
    starred: nodeFeatured.filter(f => f.status === 'starred').length,
  };
}

/* ─── 初始化 ─────────────────────────────────── */
async function initFeaturedLoader(gridSelector) {
  try {
    const [featuredData, registry] = await Promise.all([
      fetchFeatured(),
      window.TeachAnyRegistry ? TeachAnyRegistry.fetchRegistry() : null,
    ]);

    if (!featuredData?.featured?.length) {
      console.log('[TeachAny Featured] 暂无星标推荐课件');
      return;
    }

    const grid = document.querySelector(gridSelector || '#officialGrid');
    if (!grid) {
      console.warn('[TeachAny Featured] 未找到目标 Grid');
      return;
    }

    const registryCourses = registry?.courses || [];
    renderFeaturedCards(grid, featuredData, registryCourses);

    console.log(`[TeachAny Featured] ✅ 加载 ${featuredData.featured.length} 个星标推荐课件`);
  } catch (err) {
    console.warn('[TeachAny Featured] 加载失败:', err.message);
  }
}

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyFeatured = {
  fetchFeatured,
  getAllFeatured,
  getApprovedFeatured,
  getFeaturedByNodeId,
  getApprovedCountForNode,
  isFeatured,
  getFeaturedStatus,
  renderFeaturedCards,
  getFeaturedStatsForNode,
  initFeaturedLoader,
  FEATURED_LOCAL_URL,
  FEATURED_REMOTE_URL,
};
