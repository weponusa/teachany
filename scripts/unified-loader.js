/**
 * TeachAny 统一课件加载器 v3.1
 *
 * 功能：
 * 1. 从 registry.json 读取所有课件（官方+社区）
 * 2. 统一渲染到 Gallery，按 status 分组
 * 3. 支持筛选、搜索、点赞功能
 * 4. 本地缓存（localStorage + 过期机制）
 *
 * v3.1 修复：
 * - 卡片添加 data-course-name / data-course-desc 以支持搜索
 * - initGallery 加载完成后主动触发 applyFilters 解决异步时序问题
 * - 清除旧缓存避免首次加载空白
 */

/* ─── 常量 ───────────────────────────────────── */
const REGISTRY_URL = './registry.json';
const CACHE_KEY = 'teachany_registry_v3_1'; // v3.1 支持 status=course
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
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    // 校验：缓存里必须有课件
    if (!data || !data.courses || data.courses.length === 0) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
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
const USER_LIKES_KEY = 'teachany_user_likes'; // 用户点赞记录 {courseId: true/false}

function readUserLikes() {
  try {
    return JSON.parse(localStorage.getItem(USER_LIKES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUserLikes(userLikes) {
  try {
    localStorage.setItem(USER_LIKES_KEY, JSON.stringify(userLikes));
  } catch {}
}

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

function hasUserLiked(courseId) {
  return readUserLikes()[courseId] === true;
}

function toggleLike(courseId) {
  const userLikes = readUserLikes();
  const likes = readLikes();
  
  if (userLikes[courseId]) {
    // 已点赞,取消点赞
    userLikes[courseId] = false;
    likes[courseId] = Math.max((likes[courseId] || 1) - 1, 0);
  } else {
    // 未点赞,添加点赞
    userLikes[courseId] = true;
    likes[courseId] = (likes[courseId] || 0) + 1;
  }
  
  saveUserLikes(userLikes);
  saveLikes(likes);
  
  return {
    liked: userLikes[courseId],
    count: likes[courseId]
  };
}

window._toggleLike = function(button) {
  const courseId = button.dataset.like;
  const result = toggleLike(courseId);
  
  button.querySelector('.like-count').textContent = result.count;
  
  if (result.liked) {
    button.classList.add('liked');
    button.querySelector('.like-icon').textContent = '❤️';
  } else {
    button.classList.remove('liked');
    button.querySelector('.like-icon').textContent = '🤍';
  }
};

/* ─── 加载注册表 ─────────────────────────────── */
async function loadRegistry() {
  // 1. 尝试缓存
  const cached = getCachedRegistry();
  if (cached) {
    console.log('[TeachAny] 使用缓存的注册表:', cached.courses.length, '个课件');
    return cached;
  }

  // 2. 从服务器加载
  console.log('[TeachAny] 从服务器加载 registry.json...');
  const response = await fetch(REGISTRY_URL + '?t=' + Date.now()); // 加时间戳防缓存
  if (!response.ok) throw new Error(`Failed to load registry: ${response.status}`);
  
  const registry = await response.json();
  console.log('[TeachAny] 加载成功:', registry.courses.length, '个课件');
  setCachedRegistry(registry);
  return registry;
}

/* ─── 渲染课件卡片 ───────────────────────────── */
function renderCourseCard(course) {
  const url = course.url || `./${course.path}/index.html`;
  const level = gradeToLevel(course.grade);
  const isOfficial = course.status === 'official';
  const courseName = course.name || '';
  const courseDesc = course.description_zh || course.description || '';
  
  // 学科中文名映射
  const subjectNames = {
    'math': '数学',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物',
    'geography': '地理',
    'history': '历史',
    'chinese': '语文',
    'english': '英语'
  };
  
  // 统一生成标签: 学科 + 年级
  const tags = [];
  
  // 1. 学科标签 (统一中文)
  if (course.subject) {
    const subjectCN = subjectNames[course.subject] || course.subject;
    tags.push(`<span class="tag tag-blue">${escapeHtml(subjectCN)}</span>`);
  }
  
  // 2. 年级标签 (统一中文格式)
  if (course.grade) {
    const grade = parseInt(course.grade);
    const gradeLabel = `${grade}年级`;
    tags.push(`<span class="tag tag-purple">${gradeLabel}</span>`);
  }
  
  // 3. 难度标签 (可选)
  if (course.difficulty) {
    const diffStars = '★'.repeat(course.difficulty) + '☆'.repeat(5 - course.difficulty);
    tags.push(`<span class="tag tag-yellow">${diffStars}</span>`);
  }

  // 附加功能标签
  const extraBadges = [];
  if (course.has_tts) extraBadges.push('<span class="tag tag-green">🔊 TTS</span>');
  if (course.has_video) extraBadges.push('<span class="tag tag-cyan">🎬 Video</span>');
  if (course.has_en) extraBadges.push('<span class="tag tag-pink">🌐 EN</span>');
  if (isOfficial) extraBadges.push('<span class="tag tag-red">⭐ 官方</span>');
  // TeachAny 版本徽章（v5.27 新增：显示课件制作时使用的 TeachAny SKILL 版本）
  if (course.teachany_version) {
    extraBadges.push(`<span class="tag tag-teachany" title="制作时使用的 TeachAny 版本">⚡ TeachAny v${escapeHtml(course.teachany_version)}</span>`);
  }

  // Meta 信息
  const metaParts = [];
  if (course.duration) metaParts.push(`<span>⏱️ ${escapeHtml(course.duration)}</span>`);
  if (course.author && course.author !== 'weponusa') {
    metaParts.push(`<span>👤 ${escapeHtml(course.author)}</span>`);
  }

  // 点赞
  const likeCount = getLikeCount(course.id);
  const userLiked = hasUserLiked(course.id);
  const likedClass = userLiked ? 'liked' : '';
  const likeIcon = userLiked ? '❤️' : '🤍';
  const likeHtml = `<button class="ta-like-btn ${likedClass}" data-like="${escapeHtml(course.id)}" onclick="event.preventDefault();event.stopPropagation();window._toggleLike(this)" title="${userLiked ? '取消点赞' : '点赞'}">
    <span class="like-icon">${likeIcon}</span>
    <span class="like-count">${likeCount}</span>
  </button>`;

  // 导出按钮
  const exportBtn = window.TeachAnyExport 
    ? `<button class="ta-export-btn" onclick="event.preventDefault();event.stopPropagation();window.TeachAnyExport.exportCourseware({url:'${escapeHtml(url)}',courseName:'${escapeHtml(courseName)}',onProgress:(s,m)=>console.log(m)})" title="导出离线课件包">📦 导出</button>`
    : '';

  return `<a href="${escapeHtml(url)}" class="course-card" data-subject="${escapeHtml(course.subject)}" data-course-id="${escapeHtml(course.id)}" data-grade="${course.grade || ''}" data-level="${level}" data-status="${course.status || 'community'}" data-course-name="${escapeHtml(courseName)}" data-course-desc="${escapeHtml(courseDesc)}">
      <div class="card-header">
        <div class="card-emoji">${escapeHtml(course.emoji || '📚')}</div>
        <h3 class="card-title">${escapeHtml(courseName)}</h3>
        <p class="card-desc">${escapeHtml(courseDesc)}</p>
        <div class="card-tags">
          ${tags.join('\n          ')}
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
    const courses = registry.courses.filter(c => c.status === 'course');

    console.log(`[TeachAny] 官方: ${official.length}, 社区: ${community.length}, 课程: ${courses.length}`);

    // 渲染官方课件
    const officialGrid = document.getElementById('officialGrid');
    if (officialGrid) {
      renderCourses(officialGrid, official);
      console.log(`[TeachAny] ✓ 渲染 ${official.length} 个官方课件`);
    }

    // 渲染社区课件
    const communityGrid = document.getElementById('communityGrid');
    if (communityGrid) {
      const addCard = communityGrid.querySelector('.course-card-add');
      renderCourses(communityGrid, community, addCard);
      console.log(`[TeachAny] ✓ 渲染 ${community.length} 个社区课件`);
    }

    // 渲染其他课程（多章节系统课程）
    const otherCoursesGrid = document.getElementById('otherCoursesGrid');
    if (otherCoursesGrid) {
      renderCourses(otherCoursesGrid, courses);
      console.log(`[TeachAny] ✓ 渲染 ${courses.length} 个其他课程`);
    }
    const otherCoursesCount = document.getElementById('otherCoursesCount');
    if (otherCoursesCount) otherCoursesCount.textContent = `${courses.length} 个课程`;
    const otherCoursesEmpty = document.getElementById('otherCoursesEmpty');
    if (otherCoursesEmpty) otherCoursesEmpty.style.display = courses.length ? 'none' : 'block';

    // 更新统计数字
    updateStats({
      total: registry.courses.length,
      official: official.length,
      community: community.length
    });

    // ★ 关键修复：渲染完成后，主动触发一次筛选以更新计数和空状态
    if (typeof applyFilters === 'function') {
      applyFilters();
      console.log('[TeachAny] ✓ 已触发 applyFilters');
    }

  } catch (error) {
    console.error('[TeachAny] Failed to load coursewares:', error);
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

// 启动时清除可能的坏缓存
(function() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      if (!data || !data.courses || data.courses.length === 0) {
        localStorage.removeItem(CACHE_KEY);
        console.log('[TeachAny] 清除了空的缓存');
      }
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
})();

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
