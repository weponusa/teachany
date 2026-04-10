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
const REGISTRY_CACHE_TTL = 30 * 60 * 1000; // 30 分钟

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
    const resp = await fetch(REGISTRY_LOCAL_URL, { cache: 'no-cache' });
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
    const resp = await fetch(REGISTRY_REMOTE_URL, { cache: 'no-cache' });
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

/* ─── 渲染单个卡片 ───────────────────────────── */
function renderCourseCard(course, basePath) {
  const url = getCourseUrl(course, basePath);
  const isLink = !!url;

  // 标签
  const tags = (course.tags || [])
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

  // meta 信息
  const metaParts = [];
  if (course.lines) metaParts.push(`<span>📝 ${escapeHtml(course.lines)} lines</span>`);
  if (course.duration) metaParts.push(`<span>⏱️ ${escapeHtml(course.duration)}</span>`);

  // 操作按钮
  let actionHtml = '';
  if (isLink) {
    actionHtml = '<span class="card-action">Experience →</span>';
  } else if (course.download_url) {
    actionHtml = `<a class="card-action" href="${escapeHtml(course.download_url)}" onclick="event.stopPropagation()" style="text-decoration:none">⬇️ Download</a>`;
  }

  // 卡片容器
  const tagName = isLink ? 'a' : 'div';
  const hrefAttr = isLink ? ` href="${escapeHtml(url)}"` : '';

  return `<${tagName}${hrefAttr} class="course-card" data-subject="${escapeHtml(course.subject)}" data-course-id="${escapeHtml(course.id)}">
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
        ${actionHtml}
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

/* ─── 增强筛选：支持 registry 加载的卡片 ─────── */
function enhanceFilter() {
  // 覆盖全局 filterCourses 函数以支持动态加载的卡片
  window.filterCourses = function (subject) {
    const cards = document.querySelectorAll('.course-card');
    const btns = document.querySelectorAll('.filter-btn');

    btns.forEach((btn) => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    cards.forEach((card) => {
      const cardSubject = card.dataset.subject;
      if (subject === 'all' || cardSubject === subject) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
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

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyRegistry = {
  fetchRegistry,
  renderRegistryCourses,
  renderCourseCard,
  initRegistryLoader,
  getCourseUrl,
  REGISTRY_LOCAL_URL,
  REGISTRY_REMOTE_URL,
};
