/**
 * TeachAny 课件中枢（Courseware Hub）v1.0
 *
 * 通用课件接口标准：聚合所有来源的课件，为知识图谱提供统一查询。
 *
 * 数据源：
 *   1. registry.json — 官方/社区课件（status: official / community）
 *   2. community/index.json — 社区共享课件（含 likes 字段）
 *   3. localStorage — 用户本地导入的课件（TeachAnyImporter）
 *
 * 核心逻辑：
 *   - 按 node_id 聚合所有课件
 *   - 多个课件时，按心标（likes）降序排列
 *   - 心标相同时，官方课件优先
 *
 * API：
 *   TeachAnyHub.getAllCoursesForNode(nodeId) → Array<UnifiedCourse>
 *   TeachAnyHub.getBestCourseForNode(nodeId) → UnifiedCourse | null
 *   TeachAnyHub.getNodeCourseCount(nodeId) → number
 *   TeachAnyHub.hasAnyCourseware(nodeId) → boolean
 *   TeachAnyHub.init() → Promise<void>
 */

/* ─── 常量 ────────────────────────────────────── */
const HUB_REGISTRY_URL = './registry.json';
const HUB_COMMUNITY_URL = './community/index.json';
const HUB_CACHE_KEY = 'teachany_hub_cache_v1';
const HUB_CACHE_TTL = 15 * 60 * 1000; // 15 分钟

/* ─── 内部状态 ────────────────────────────────── */
let _registryCourses = [];  // { id, node_id, name, subject, grade, likes, source, url, ... }
let _communityCourses = []; // 同上
let _initialized = false;
let _initPromise = null;

// node_id → UnifiedCourse[] 的索引
const _nodeIndex = new Map();

/* ─── 课件源类型 ──────────────────────────────── */
const SOURCE = {
  OFFICIAL: 'official',      // registry.json status=official
  COMMUNITY_REG: 'community_registry',  // registry.json status=community
  COMMUNITY_SHARED: 'community_shared', // community/index.json
  USER: 'user',              // localStorage 用户导入
};

const SOURCE_PRIORITY = {
  [SOURCE.OFFICIAL]: 0,
  [SOURCE.COMMUNITY_REG]: 1,
  [SOURCE.COMMUNITY_SHARED]: 2,
  [SOURCE.USER]: 3,
};

/* ─── 缓存 ────────────────────────────────────── */
function getHubCache() {
  try {
    const cached = localStorage.getItem(HUB_CACHE_KEY);
    if (!cached) return null;
    const { registry, community, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > HUB_CACHE_TTL) {
      localStorage.removeItem(HUB_CACHE_KEY);
      return null;
    }
    if (!registry || !community) return null;
    return { registry, community };
  } catch {
    localStorage.removeItem(HUB_CACHE_KEY);
    return null;
  }
}

function setHubCache(registry, community) {
  try {
    localStorage.setItem(HUB_CACHE_KEY, JSON.stringify({
      registry, community, timestamp: Date.now()
    }));
  } catch {}
}

/* ─── JSON 加载 ───────────────────────────────── */
async function fetchJSON(url) {
  const resp = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

/* ─── 初始化 ──────────────────────────────────── */
async function init() {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = _doInit();
  return _initPromise;
}

async function _doInit() {
  try {
    // 1. 尝试缓存
    const cached = getHubCache();
    let registryData, communityData;

    if (cached) {
      registryData = cached.registry;
      communityData = cached.community;
      console.log('[CoursewareHub] ✅ 使用缓存数据');
    } else {
      // 2. 并行加载两个数据源
      const [regResult, comResult] = await Promise.allSettled([
        fetchJSON(HUB_REGISTRY_URL),
        fetchJSON(HUB_COMMUNITY_URL),
      ]);

      registryData = regResult.status === 'fulfilled' ? regResult.value : { courses: [] };
      communityData = comResult.status === 'fulfilled' ? comResult.value : { courses: [] };

      // 写入缓存
      setHubCache(registryData, communityData);
      console.log('[CoursewareHub] ✅ 从服务器加载数据');
    }

    // 3. 标准化 registry 课件
    _registryCourses = (registryData.courses || []).map(c => ({
      id: c.id,
      node_id: c.node_id || '',
      name: c.name || c.id,
      subject: c.subject || '',
      grade: c.grade || 0,
      emoji: c.emoji || '📚',
      likes: 0,  // registry 本身无 likes 字段，从 localStorage 或 community 合并
      source: c.status === 'official' ? SOURCE.OFFICIAL : SOURCE.COMMUNITY_REG,
      url: `./${c.path}/index.html`,
      path: c.path || '',
      has_tts: c.has_tts || false,
      has_video: c.has_video || false,
      author: c.author || '',
      download_url: '',
    }));

    // 4. 标准化 community 课件
    _communityCourses = (communityData.courses || []).map(c => ({
      id: c.id,
      node_id: c.node_id || '',
      name: c.name || c.id,
      subject: c.subject || '',
      grade: c.grade || 0,
      emoji: '🌐',
      likes: c.likes || 0,
      source: SOURCE.COMMUNITY_SHARED,
      url: c.download_url || '',
      path: '',
      has_tts: false,
      has_video: false,
      author: c.author || '',
      download_url: c.download_url || '',
    }));

    // 5. 合并 likes：community likes 覆盖 registry 同 ID 课件
    const communityLikesMap = new Map();
    _communityCourses.forEach(c => {
      if (c.id && c.likes > 0) communityLikesMap.set(c.id, c.likes);
    });
    _registryCourses.forEach(c => {
      if (communityLikesMap.has(c.id)) {
        c.likes = communityLikesMap.get(c.id);
      }
    });

    // 6. 合并本地 likes (来自 localStorage)
    try {
      const localLikes = JSON.parse(localStorage.getItem('teachany_likes') || '{}');
      _registryCourses.forEach(c => {
        if (localLikes[c.id]) c.likes += localLikes[c.id];
      });
      _communityCourses.forEach(c => {
        if (localLikes[c.id]) c.likes += localLikes[c.id];
      });
    } catch {}

    // 7. 构建 node_id 索引
    _buildNodeIndex();

    _initialized = true;
    console.log(`[CoursewareHub] 索引完成: ${_nodeIndex.size} 个节点有课件, ` +
      `registry=${_registryCourses.length}, community=${_communityCourses.length}`);

  } catch (err) {
    console.error('[CoursewareHub] 初始化失败:', err);
    _initialized = true; // 标记为已初始化，避免反复重试
  }
}

/* ─── 构建索引 ────────────────────────────────── */
function _buildNodeIndex() {
  _nodeIndex.clear();

  // 合并所有课件
  const allCourses = [..._registryCourses, ..._communityCourses];

  // 去重：同一 id 只保留一个（优先保留 source 优先级高的）
  const seen = new Map(); // id → course
  for (const c of allCourses) {
    if (!c.node_id) continue;
    const existing = seen.get(c.id);
    if (!existing || (SOURCE_PRIORITY[c.source] || 9) < (SOURCE_PRIORITY[existing.source] || 9)) {
      seen.set(c.id, c);
    }
  }

  // 按 node_id 归类
  for (const c of seen.values()) {
    if (!c.node_id) continue;
    if (!_nodeIndex.has(c.node_id)) {
      _nodeIndex.set(c.node_id, []);
    }
    _nodeIndex.get(c.node_id).push(c);
  }

  // 添加用户导入课件
  _addUserCoursesToIndex();

  // 排序：每个 node_id 下的课件按 likes 降序 + 源优先级
  for (const [, courses] of _nodeIndex) {
    courses.sort((a, b) => {
      // 1. likes 降序
      if (b.likes !== a.likes) return b.likes - a.likes;
      // 2. 源优先级升序（official > community_registry > community_shared > user）
      return (SOURCE_PRIORITY[a.source] || 9) - (SOURCE_PRIORITY[b.source] || 9);
    });
  }
}

function _addUserCoursesToIndex() {
  if (!window.TeachAnyImporter) return;

  const userCourses = window.TeachAnyImporter.getUserCourses();
  for (const uc of userCourses) {
    const nodeId = uc.manifest?.node_id;
    if (!nodeId) continue;

    const userLikes = window.TeachAnyImporter.getCourseLikes(uc.id) || 0;
    const unified = {
      id: uc.id,
      node_id: nodeId,
      name: uc.manifest?.name || '用户课件',
      subject: uc.manifest?.subject || '',
      grade: uc.manifest?.grade || 0,
      emoji: uc.manifest?.emoji || '📂',
      likes: userLikes,
      source: SOURCE.USER,
      url: window.TeachAnyImporter.getCourseLaunchUrl(uc),
      path: '',
      has_tts: false,
      has_video: false,
      author: uc.manifest?.author || 'user',
      download_url: '',
    };

    // 别名映射：用户课件的 node_id 可能与树节点不一致
    const nodeIds = [nodeId];
    if (window.TeachAnyImporter.NODE_ID_ALIASES) {
      // 正向：manifest node_id → tree node id
      const forward = window.TeachAnyImporter.NODE_ID_ALIASES[nodeId];
      if (forward) nodeIds.push(...forward);
      // 反向：tree node id → manifest node_id
      for (const [mId, tIds] of Object.entries(window.TeachAnyImporter.NODE_ID_ALIASES)) {
        if (tIds.includes(nodeId)) nodeIds.push(mId);
      }
    }

    for (const nid of new Set(nodeIds)) {
      if (!_nodeIndex.has(nid)) {
        _nodeIndex.set(nid, []);
      }
      // 避免重复
      const existing = _nodeIndex.get(nid);
      if (!existing.some(c => c.id === unified.id)) {
        existing.push(unified);
      }
    }
  }
}

/* ─── 公共 API ────────────────────────────────── */

/**
 * 获取某节点的所有课件（已按 likes 降序排列）
 * @param {string} nodeId
 * @returns {Array<UnifiedCourse>}
 */
function getAllCoursesForNode(nodeId) {
  if (!nodeId) return [];
  return _nodeIndex.get(nodeId) || [];
}

/**
 * 获取某节点心标最高的课件
 * @param {string} nodeId
 * @returns {UnifiedCourse|null}
 */
function getBestCourseForNode(nodeId) {
  const courses = getAllCoursesForNode(nodeId);
  return courses.length > 0 ? courses[0] : null;
}

/**
 * 获取某节点的课件数量
 * @param {string} nodeId
 * @returns {number}
 */
function getNodeCourseCount(nodeId) {
  return getAllCoursesForNode(nodeId).length;
}

/**
 * 判断某节点是否有任何课件
 * @param {string} nodeId
 * @returns {boolean}
 */
function hasAnyCourseware(nodeId) {
  return getNodeCourseCount(nodeId) > 0;
}

/**
 * 手动刷新索引（用户导入新课件后调用）
 */
function refreshIndex() {
  _buildNodeIndex();
}

/**
 * 获取所有有课件的节点 ID 列表
 * @returns {string[]}
 */
function getAllCoveredNodeIds() {
  return Array.from(_nodeIndex.keys());
}

/**
 * 获取统计信息
 */
function getStats() {
  let totalCourses = 0;
  let nodesWithMultiple = 0;
  for (const [, courses] of _nodeIndex) {
    totalCourses += courses.length;
    if (courses.length > 1) nodesWithMultiple++;
  }
  return {
    coveredNodes: _nodeIndex.size,
    totalCourses,
    nodesWithMultiple,
    registryCourses: _registryCourses.length,
    communityCourses: _communityCourses.length,
  };
}

/* ─── 导出 ────────────────────────────────────── */
window.TeachAnyHub = {
  init,
  getAllCoursesForNode,
  getBestCourseForNode,
  getNodeCourseCount,
  hasAnyCourseware,
  refreshIndex,
  getAllCoveredNodeIds,
  getStats,
  SOURCE,
};
