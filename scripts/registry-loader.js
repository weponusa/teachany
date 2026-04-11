/**
 * TeachAny Registry Loader
 *
 * 从 courseware-registry.json 动态加载课件列表并渲染 Gallery 卡片。
 * 替代 index.html 中硬编码的 <a class="course-card"> 标签。
 *
 * 加载策略：
 *   1. 优先从本地 ./courseware-registry.json 加载（开发/本地预览）
 *   2. 回退到 GitHub raw 地址（GitHub Pages 部署）
 *   3. 30 分钟 localStorage 缓存
 *
 * 课件链接策略：
 *   - source === "examples"：链接到 ./examples/{local_path}/index.html
 *   - source === "releases"  且 download_url 存在：提供下载按钮
 *   - 两者都有时：优先本地预览
 */

/* ─── 常量 ───────────────────────────────────── */
const REGISTRY_LOCAL_URL = './courseware-registry.json';
const REGISTRY_REMOTE_URL = 'https://raw.githubusercontent.com/weponusa/teachany/main/courseware-registry.json';
const REGISTRY_CACHE_KEY = 'teachany_registry_cache';
const REGISTRY_CACHE_TTL = 5 * 60 * 1000; // 5 分钟（发布后快速生效）

/* ─── 年级 → 学段映射 ───────────────────────── */
function gradeToLevelRegistry(grade) {
  const g = parseInt(grade);
  if (g >= 1 && g <= 6) return 'elementary';
  if (g >= 7 && g <= 9) return 'middle';
  if (g >= 10 && g <= 12) return 'high';
  return 'other';
}

/* ─── 缓存 ───────────────────────────────────── */
function readRegistryCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(REGISTRY_CACHE_KEY) || 'null');
    if (!raw || !raw.data || !raw.timestamp) return null;
    if (Date.now() - raw.timestamp > REGISTRY_CACHE_TTL) return null;
    return raw.data;
  } catch {
    return null;
  }
}

function saveRegistryCache(data) {
  try {
    localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // storage full, ignore
  }
}

/* ─── 加载 Registry ──────────────────────────── */
async function fetchRegistry(forceRefresh = false) {
  // 缓存优先
  if (!forceRefresh) {
    const cached = readRegistryCache();
    if (cached) return cached;
  }

  // 先尝试本地文件
  try {
    const resp = await fetch(REGISTRY_LOCAL_URL + '?v=' + Date.now(), { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      saveRegistryCache(data);
      return data;
    }
  } catch {
    // 本地加载失败，尝试远程
  }

  // 回退到 GitHub raw
  try {
    const resp = await fetch(REGISTRY_REMOTE_URL + '?v=' + Date.now(), { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      saveRegistryCache(data);
      return data;
    }
  } catch {
    // 远程也失败
  }

  // 完全离线：回退到过期缓存
  try {
    const raw = JSON.parse(localStorage.getItem(REGISTRY_CACHE_KEY) || 'null');
    if (raw?.data) return raw.data;
  } catch {}

  console.warn('[TeachAny Registry] 无法加载课件注册表');
  return { version: '1.0', courses: [], _offline: true };
}

/* ─── HTML 安全转义 ──────────────────────────── */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── 生成课件链接 ───────────────────────────── */
function getCourseUrl(course, basePath) {
  // 优先本地 examples 路径
  if (course.local_path) {
    const base = basePath || './examples';
    return `${base}/${course.local_path}/index.html`;
  }
  // 如果有下载地址，返回 null（在 card 中用下载按钮替代）
  return null;
}

/* ─── 点赞系统（官方课件，纯前端 localStorage）─── */
const REGISTRY_LIKES_KEY = 'teachany_registry_likes';

function readRegistryLikes() {
  try { return JSON.parse(localStorage.getItem(REGISTRY_LIKES_KEY) || '{}'); }
  catch { return {}; }
}
function saveRegistryLikes(likes) {
  try { localStorage.setItem(REGISTRY_LIKES_KEY, JSON.stringify(likes)); } catch {}
}
function getRegistryLikeCount(courseId) {
  return readRegistryLikes()[courseId] || 0;
}
function toggleRegistryLike(courseId) {
  const sessionKey = `teachany_reg_liked_${courseId}`;
  const alreadyLiked = sessionStorage.getItem(sessionKey) === '1';
  const likes = readRegistryLikes();
  if (alreadyLiked) {
    sessionStorage.removeItem(sessionKey);
    likes[courseId] = Math.max(0, (likes[courseId] || 0) - 1);
  } else {
    sessionStorage.setItem(sessionKey, '1');
    likes[courseId] = (likes[courseId] || 0) + 1;
  }
  saveRegistryLikes(likes);
  return { liked: !alreadyLiked, count: likes[courseId] };
}
function isRegistryLikedInSession(courseId) {
  return sessionStorage.getItem(`teachany_reg_liked_${courseId}`) === '1';
}

/* ─── 社区课件数量查询（兼容 community-loader.js）─── */
function getCommunityCountForNode(nodeId) {
  if (!window.TeachAnyCommunity) return 0;
  try {
    const courses = TeachAnyCommunity.getCommunityCoursesByNodeId
      ? TeachAnyCommunity.getCommunityCoursesByNodeId(nodeId)
      : (TeachAnyCommunity.getTopCommunityCourses
        ? TeachAnyCommunity.getTopCommunityCourses(nodeId, 999)
        : []);
    return courses ? courses.length : 0;
  } catch { return 0; }
}

/* ─── 渲染单个卡片 ───────────────────────────── */
function renderCourseCard(course, basePath) {
  const url = getCourseUrl(course, basePath);
  const isLink = !!url;

  // 标签：只保留前 3 个 + 附加标签，简化卡片
  const maxTags = 3;
  const tags = (course.tags || [])
    .slice(0, maxTags)
    .map((tag, i) => {
      const colorClass = (course.tag_colors || [])[i] || 'tag-blue';
      return `<span class="tag ${colorClass}">${escapeHtml(tag)}</span>`;
    })
    .join('\n          ');

  // 附加标签（TTS/Video/EN 等）
  const extraBadges = [];
  if (course.has_tts) extraBadges.push('<span class="tag tag-yellow">🔊 TTS</span>');
  if (course.has_video) extraBadges.push('<span class="tag tag-cyan">🎬 Video</span>');
  if (course.has_en) extraBadges.push('<span class="tag tag-green">🌐 EN</span>');

  // meta 信息（简化：只保留时长）
  const metaParts = [];
  if (course.duration) metaParts.push(`<span>⏱️ ${escapeHtml(course.duration)}</span>`);

  // 社区课件数量
  const communityCount = getCommunityCountForNode(course.node_id);
  if (communityCount > 0) {
    metaParts.push(`<span>🌐 社区 ×${communityCount}</span>`);
  }

  // 爱心点赞
  const likeCount = getRegistryLikeCount(course.id);
  const isLiked = isRegistryLikedInSession(course.id);
  const likeHtml = `<button class="ta-like-btn${isLiked ? ' liked' : ''}" data-registry-like="${escapeHtml(course.id)}" onclick="event.preventDefault();event.stopPropagation();window._toggleRegistryLike(this)" title="点赞">
    <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
    <span class="like-count">${likeCount}</span>
  </button>`;

  // 操作按钮：只保留导出按钮（卡片本身可点击）
  let actionHtml = '';
  if (isLink) {
    const exportBtn = `<button class="ta-export-btn" onclick="event.preventDefault();event.stopPropagation();window.TeachAnyExport.exportCourseware({url:'${escapeHtml(url)}',courseName:'${escapeHtml(course.name)}',onProgress:(s,m)=>console.log(m)})" title="导出离线课件包 Export">📦 导出</button>`;
    actionHtml = exportBtn;
  } else if (course.download_url) {
    actionHtml = `<a class="ta-export-btn" href="${escapeHtml(course.download_url)}" onclick="event.stopPropagation()" style="text-decoration:none" title="导出离线课件包 Export">📦 导出</a>`;
  }

  // 卡片容器
  const tagName = isLink ? 'a' : 'div';
  const hrefAttr = isLink ? ` href="${escapeHtml(url)}"` : '';
  const level = gradeToLevelRegistry(course.grade);

  return `<${tagName}${hrefAttr} class="course-card" data-subject="${escapeHtml(course.subject)}" data-course-id="${escapeHtml(course.id)}" data-grade="${course.grade || ''}" data-level="${level}">
      <div class="card-header">
        <div class="card-emoji">${escapeHtml(course.emoji || '📚')}</div>
        <h3 class="card-title">${escapeHtml(course.name)}</h3>
        <p class="card-desc">${escapeHtml(course.description)}</p>
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
          ${actionHtml}
        </div>
      </div>
    </${tagName}>`;
}

/* ─── 渲染所有课件到 Grid ────────────────────── */
function renderRegistryCourses(grid, registry) {
  if (!grid || !registry?.courses?.length) return;

  const basePath = registry.examples_base || './examples';

  // 移除旧的 registry 卡片（保留社区卡片和用户卡片）
  grid.querySelectorAll('.course-card[data-course-id]').forEach((el) => el.remove());

  // 按 subject 分组渲染，保持学科聚合
  const courses = registry.courses || [];

  // 在 grid 的最前面插入（在社区卡片和用户"添加"按钮之前）
  const addCard = grid.querySelector('.course-card-add');
  const firstCommunityCard = grid.querySelector('.community-course-card');
  const insertBefore = firstCommunityCard || addCard || null;

  courses.forEach((course) => {
    const cardHtml = renderCourseCard(course, basePath);
    const temp = document.createElement('div');
    temp.innerHTML = cardHtml.trim();
    const cardEl = temp.firstChild;

    if (insertBefore) {
      grid.insertBefore(cardEl, insertBefore);
    } else {
      grid.appendChild(cardEl);
    }
  });

  // 更新统计数字
  updateStats(registry);
}

/* ─── 更新 Hero 统计数据 ─────────────────────── */
function updateStats(registry) {
  const courses = registry?.courses || [];
  const courseCount = courses.length;

  // 学科去重
  const subjects = new Set(courses.map((c) => c.subject));

  // 更新页面上的统计数字
  const statNums = document.querySelectorAll('.stat-num');
  statNums.forEach((el) => {
    const label = el.closest('.stat')?.querySelector('.stat-label')?.textContent?.toLowerCase() || '';
    if (label.includes('course')) {
      el.textContent = courseCount;
    }
  });
}

/* ─── 增强筛选：兼容新的双维度筛选系统 ─────── */
function enhanceFilter() {
  // 覆盖全局 filterCourses 函数以兼容旧调用
  window.filterCourses = function (subject) {
    if (typeof window.filterGallery === 'function') {
      filterGallery('subject', subject, event && event.target);
    } else {
      // 回退到基础筛选
      const cards = document.querySelectorAll('.course-card');
      cards.forEach((card) => {
        const cardSubject = card.dataset.subject;
        if (subject === 'all' || cardSubject === subject) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  };
}

/* ─── 初始化 ─────────────────────────────────── */
async function initRegistryLoader(gridSelector) {
  const grid = document.querySelector(gridSelector || '#courseGrid');
  if (!grid) {
    console.warn('[TeachAny Registry] 未找到课件 Grid 容器');
    return;
  }

  try {
    const registry = await fetchRegistry();

    if (registry.courses && registry.courses.length > 0) {
      // 清除硬编码的示例卡片（它们没有 data-course-id）
      grid.querySelectorAll('.course-card:not([data-course-id]):not(.community-course-card)').forEach((el) => {
        el.remove();
      });

      // 从 registry 渲染
      renderRegistryCourses(grid, registry);

      // 增强筛选
      enhanceFilter();

      console.log(`[TeachAny Registry] ✅ 加载 ${registry.courses.length} 个课件`);
    } else {
      console.log('[TeachAny Registry] Registry 为空，保留硬编码卡片');
    }
  } catch (err) {
    console.warn('[TeachAny Registry] 加载失败，保留硬编码卡片:', err.message);
  }
}

/* ─── 全局点赞事件处理 ────────────────────────── */
window._toggleRegistryLike = function(btn) {
  const courseId = btn.getAttribute('data-registry-like');
  if (!courseId) return;
  const result = toggleRegistryLike(courseId);
  btn.classList.toggle('liked', result.liked);
  btn.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
  btn.querySelector('.like-count').textContent = result.count;
};

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyRegistry = {
  fetchRegistry,
  renderRegistryCourses,
  renderCourseCard,
  initRegistryLoader,
  getCourseUrl,
  getRegistryLikeCount,
  toggleRegistryLike,
  isRegistryLikedInSession,
  getCommunityCountForNode,
  gradeToLevelRegistry,
  REGISTRY_LOCAL_URL,
  REGISTRY_REMOTE_URL,
};
