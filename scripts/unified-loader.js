/**
 * TeachAny 统一课件加载器 v3.0
 *
 * 功能：
 * 1. 从 registry.json 读取所有课件（官方+社区）
 * 2. 统一渲染到 Gallery，按 status 分组
 * 3. 支持筛选、搜索、点赞功能
 * 4. 本地缓存（localStorage + 过期机制）
 */

/* ─── 常量 ───────────────────────────────────── */
const REGISTRY_URL = './registry.json';
const CACHE_KEY = 'teachany_registry_v3';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟缓存
const LIKES_KEY = 'teachany_likes';

/* ─── 辅助工具 ──────────────────────────────── */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gradeToLevel(grade) {
  const g = parseInt(grade);
  if (g >= 1 && g <= 6) return 'elementary';
  if (g >= 7 && g <= 9) return 'middle';
  if (g >= 10 && g <= 12) return 'high';
  return 'other';
}

/* ─── 缓存管理 ──────────────────────────────── */
function getCachedRegistry() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedRegistry(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {}
}

/* ─── 点赞系统 ──────────────────────────────── */
function readLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLikes(likes) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  } catch {}
}

function getLikeCount(courseId) {
  return readLikes()[courseId] || 0;
}

function toggleLike(courseId) {
  const likes = readLikes();
  likes[courseId] = (likes[courseId] || 0) + 1;
  saveLikes(likes);
  return likes[courseId];
}

window._toggleLike = function(button) {
  const courseId = button.dataset.like;
  const newCount = toggleLike(courseId);
  button.querySelector('.like-count').textContent = newCount;
  button.classList.add('liked');
  button.querySelector('.like-icon').textContent = '❤️';
};

/* ─── 加载注册表 ─────────────────────────────── */
async function loadRegistry() {
  // 1. 尝试缓存
  const cached = getCachedRegistry();
  if (cached) return cached;

  // 2. 从服务器加载
  const response = await fetch(REGISTRY_URL);
  if (!response.ok) throw new Error(`Failed to load registry: ${response.status}`);
  
  const registry = await response.json();
  setCachedRegistry(registry);
  return registry;
}

/* ─── 渲染课件卡片 ───────────────────────────── */
function renderCourseCard(course) {
  const url = course.url || `${course.path}/index.html`;
  const level = gradeToLevel(course.grade);
  const isOfficial = course.status === 'official';
  
  // 标签
  const maxTags = 3;
  const tags = (course.tags || [])
    .slice(0, maxTags)
    .map((tag, i) => {
      const colors = ['tag-blue', 'tag-purple', 'tag-green', 'tag-yellow', 'tag-pink', 'tag-cyan'];
      const colorClass = colors[i % colors.length];
      return `<span class="tag ${colorClass}">${escapeHtml(tag)}</span>`;
    })
    .join('\n          ');

  // 附加标签
  const extraBadges = [];
  if (course.has_tts) extraBadges.push('<span class="tag tag-yellow">🔊 TTS</span>');
  if (course.has_video) extraBadges.push('<span class="tag tag-cyan">🎬 Video</span>');
  if (course.has_en) extraBadges.push('<span class="tag tag-green">🌐 EN</span>');
  if (isOfficial) extraBadges.push('<span class="tag tag-red">⭐ 官方</span>');

  // Meta 信息
  const metaParts = [];
  if (course.duration) metaParts.push(`<span>⏱️ ${escapeHtml(course.duration)}</span>`);
  if (course.author && course.author !== 'weponusa') {
    metaParts.push(`<span>👤 ${escapeHtml(course.author)}</span>`);
  }

  // 点赞
  const likeCount = getLikeCount(course.id);
  const likeHtml = `<button class="ta-like-btn" data-like="${escapeHtml(course.id)}" onclick="event.preventDefault();event.stopPropagation();window._toggleLike(this)" title="点赞">
    <span class="like-icon">🤍</span>
    <span class="like-count">${likeCount}</span>
  </button>`;

  // 导出按钮
  const exportBtn = window.TeachAnyExport 
    ? `<button class="ta-export-btn" onclick="event.preventDefault();event.stopPropagation();window.TeachAnyExport.exportCourseware({url:'${escapeHtml(url)}',courseName:'${escapeHtml(course.name)}',onProgress:(s,m)=>console.log(m)})" title="导出离线课件包">📦 导出</button>`
    : '';

  return `<a href="${escapeHtml(url)}" class="course-card" data-subject="${escapeHtml(course.subject)}" data-course-id="${escapeHtml(course.id)}" data-grade="${course.grade || ''}" data-level="${level}" data-status="${course.status || 'community'}">
      <div class="card-header">
        <div class="card-emoji">${escapeHtml(course.emoji || '📚')}</div>
        <h3 class="card-title">${escapeHtml(course.name)}</h3>
        <p class="card-desc">${escapeHtml(course.description || course.description_zh || '')}</p>
        <div class="card-tags">
          ${tags}
          ${extraBadges.join('\n          ')}
        </div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          ${metaParts.join('\n          ')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${likeHtml}
          ${exportBtn}
        </div>
      </div>
    </a>`;
}

/* ─── 渲染课件列表 ───────────────────────────── */
function renderCourses(grid, courses, addCard = null) {
  if (!grid || !courses.length) return;

  courses.forEach(course => {
    const cardHtml = renderCourseCard(course);
    const temp = document.createElement('div');
    temp.innerHTML = cardHtml;
    const card = temp.firstElementChild;

    if (addCard) {
      grid.insertBefore(card, addCard);
    } else {
      grid.appendChild(card);
    }
  });
}

/* ─── 初始化 Gallery ────────────────────────── */
async function initGallery() {
  try {
    const registry = await loadRegistry();
    
    // 按 status 分组
    const official = registry.courses.filter(c => c.status === 'official');
    const community = registry.courses.filter(c => c.status === 'community');

    // 渲染官方课件
    const officialGrid = document.getElementById('officialGrid');
    if (officialGrid) {
      renderCourses(officialGrid, official);
      console.log(`✓ Loaded ${official.length} official coursewares`);
    }

    // 渲染社区课件
    const communityGrid = document.getElementById('communityGrid');
    if (communityGrid) {
      const addCard = communityGrid.querySelector('.course-card-add');
      renderCourses(communityGrid, community, addCard);
      console.log(`✓ Loaded ${community.length} community coursewares`);
    }

    // 更新统计数字
    updateStats({
      total: registry.courses.length,
      official: official.length,
      community: community.length
    });

  } catch (error) {
    console.error('Failed to load coursewares:', error);
  }
}

/* ─── 更新统计信息 ───────────────────────────── */
function updateStats(stats) {
  const statElements = {
    'stat-total': stats.total,
    'stat-official': stats.official,
    'stat-community': stats.community
  };

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

/* ─── 导出 API ──────────────────────────────── */
window.TeachAnyUnifiedLoader = {
  loadRegistry,
  initGallery,
  renderCourseCard,
  toggleLike,
  clearCache: () => localStorage.removeItem(CACHE_KEY)
};

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
