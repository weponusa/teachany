/**
 * TeachAny 统一课件加载器 v3.4
 *
 * 功能：
 * 1. 从 registry.json 读取所有课件（官方+社区）
 * 2. 统一渲染到 Gallery，按 status 分组
 * 3. 支持筛选、搜索、点赞功能
 * 4. 本地缓存（localStorage + 过期机制）
 *
 * v3.4 修复：
 * - 启动时暴力清除所有 teachany_registry* 缓存，彻底解决浏览器缓存导致中文标题不显示的问题
 * - 每次从服务器加载 registry.json（带时间戳防 HTTP 缓存）
 */

// ── 启动时立即清除所有 teachany 注册表缓存 ──
// 这段代码必须在最前面执行，确保不管旧版 JS 怎么缓存，新版一定能清干净
(function _purgeAllRegistryCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('teachany_registry')) keys.push(k);
    }
    keys.forEach(k => {
      localStorage.removeItem(k);
      console.log('[TeachAny v3.4] 清除注册表缓存:', k);
    });
  } catch(e) { /* ignore */ }
})();

/* ─── 常量 ───────────────────────────────────── */
const REGISTRY_URL = './registry.json';
const COURSEWARE_BASE_URL = 'https://weponusa.github.io/teachany-courseware'; // 真实课件实体统一在课件仓库
const SELF_BASE_URL = 'https://weponusa.github.io/teachany';                  // 主站入口与 hero fallback
const CACHE_KEY = 'teachany_registry_v3_13'; // v3.13: course links direct to courseware repo

function resolveCoursewareUrl(path) {
  if (!path) return COURSEWARE_BASE_URL + '/';
  if (/^https?:\/\//i.test(path)) return path;
  return COURSEWARE_BASE_URL + '/' + String(path).replace(/^\/+/, '');
}

// hero 图优先从 teachany（新仓库）读取，fallback courseware
function resolveHeroUrl(course, heroImage) {
  if (!heroImage) return '';
  if (heroImage.startsWith('cdn:')) return heroImage.slice(4);
  if (/^(https?:|data:)/i.test(heroImage)) return heroImage;
  if (course && course.path) {
    const rel = course.path.replace(/\/$/, '') + '/' + heroImage;
    // 优先尝试 teachany（新仓库，放有 SVG）
    return SELF_BASE_URL + '/' + rel.replace(/^\/+/, '');
  }
  return SELF_BASE_URL + '/' + heroImage.replace(/^\/+/, '');
}

// 课件点击链接：统一直指 teachany-courseware 实体仓库，主仓库只做轻量入口/索引
function resolveCourseUrl(course) {
  if (course && course.url) return course.url;
  if (course && course.path) {
    const path = course.path.replace(/\/$/, '') + '/index.html';
    return COURSEWARE_BASE_URL + '/' + path.replace(/^\/+/, '');
  }
  return COURSEWARE_BASE_URL + '/';
}
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
  const response = await fetch(REGISTRY_URL + '?t=' + Date.now(), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
  });
  if (!response.ok) throw new Error(`Failed to load registry: ${response.status}`);
  
  const registry = await response.json();
  console.log('[TeachAny] 加载成功:', registry.courses.length, '个课件');
  setCachedRegistry(registry);
  return registry;
}

/* ─── 渲染课件卡片 ───────────────────────────── */
function renderCourseCard(course) {
  const url = resolveCourseUrl(course);
  const level = gradeToLevel(course.grade);
  const isOfficial = course.status === 'official';
  const courseName = course.name || '';
  const courseNameEn = course.name_en || '';
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
    // 边界保护：clamp 到 [1, 5]，防止异常数据触发 RangeError: Invalid count value
    const diff = Math.max(1, Math.min(5, parseInt(course.difficulty) || 1));
    const diffStars = '★'.repeat(diff) + '☆'.repeat(5 - diff);
    tags.push(`<span class="tag tag-yellow">${diffStars}</span>`);
  }

  // 附加功能标签
  const extraBadges = [];
  // 课标徽章（v5.32 新增：显示课件遵循的课程体系，中英双语）
  const curriculumLabels = {
    'cn-national':  { zh: '中国课标', en: 'CN National', flag: '🇨🇳' },
    'ib-dp':        { zh: 'IB DP', en: 'IB Diploma', flag: '🎓' },
    'cambridge-al': { zh: 'A-Level', en: 'Cambridge A-Level', flag: '🇬🇧' },
    'ap':           { zh: 'AP', en: 'Advanced Placement', flag: '🇺🇸' },
  };
  const currKey = course.curriculum || 'cn-national';
  const currInfo = curriculumLabels[currKey];
  if (currInfo) {
    extraBadges.push(`<span class="tag tag-curriculum" title="${escapeHtml(currInfo.en)}">${currInfo.flag} ${escapeHtml(currInfo.zh)} · ${escapeHtml(currInfo.en)}</span>`);
  }
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

  // Hero 图（从 hero_image 字段读取，支持 cdn: 前缀）
  let heroCover = '';
  if (course.hero_image) {
    const heroUrl = resolveHeroUrl(course, course.hero_image);
    heroCover = `<img class="card-cover" src="${escapeHtml(heroUrl)}" alt="${escapeHtml(courseName)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-cover-emoji" style="display:none">${escapeHtml(course.emoji || '📚')}</div>`;
  } else {
    heroCover = `<div class="card-cover-emoji">${escapeHtml(course.emoji || '📚')}</div>`;
  }

  return `<a href="${escapeHtml(url)}" class="course-card" data-subject="${escapeHtml(course.subject)}" data-course-id="${escapeHtml(course.id)}" data-grade="${course.grade || ''}" data-level="${level}" data-status="${course.status || 'community'}" data-curriculum="${escapeHtml(course.curriculum || 'cn-national')}" data-course-name="${escapeHtml(courseName)}" data-course-desc="${escapeHtml(courseDesc)}">
      ${heroCover}
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(courseName)}</h3>
        ${courseNameEn ? `<h4 class="card-title-en">${escapeHtml(courseNameEn)}</h4>` : ''}
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
    try {
      const cardHtml = renderCourseCard(course);
      const temp = document.createElement('div');
      temp.innerHTML = cardHtml;
      const card = temp.firstElementChild;

      if (addCard) {
        grid.insertBefore(card, addCard);
      } else {
        grid.appendChild(card);
      }
    } catch (err) {
      // 单个课件渲染失败不应拖垮整组
      console.error(`[TeachAny] 课件 ${course?.id || '?'} 渲染失败，跳过:`, err);
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

// 注：缓存清理已在文件顶部的 _purgeAllRegistryCache() 中完成

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
