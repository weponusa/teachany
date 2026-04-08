/**
 * TeachAny 课件导入器（纯前端）
 *
 * 升级点：
 * 1. 统一支持 .teachany / .zip / .html
 * 2. localStorage 仅保存元数据索引，完整课件包存入 IndexedDB
 * 3. 支持多文件课件包（含 assets/）
 * 4. 通过受控 viewer 页打开用户课件，避免直接 data URL 打开
 */

/* ─── 常量 ───────────────────────────────────── */
const STORAGE_KEY = 'teachany_user_courses_index';
const LEGACY_STORAGE_KEY = 'teachany_user_courses';
const LIKES_STORAGE_KEY = 'teachany_course_likes';
const DB_NAME = 'teachany-courseware-db';
const DB_VERSION = 1;
const STORE_NAME = 'coursewares';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VIEWER_PAGE = 'imported-course.html';
const MAX_COURSES_PER_NODE = 5;

const SUBJECT_META = {
  math: { name: '数学', emoji: '📐', tagColor: 'blue' },
  physics: { name: '物理', emoji: '⚡', tagColor: 'yellow' },
  chemistry: { name: '化学', emoji: '🧪', tagColor: 'green' },
  biology: { name: '生物', emoji: '🧬', tagColor: 'pink' },
  geography: { name: '地理', emoji: '🌍', tagColor: 'cyan' },
  history: { name: '历史', emoji: '📜', tagColor: 'yellow' },
  chinese: { name: '语文', emoji: '📖', tagColor: 'pink' },
  english: { name: '英语', emoji: '🌐', tagColor: 'blue' },
  it: { name: '信息技术', emoji: '💻', tagColor: 'green' },
  'info-tech': { name: '信息技术', emoji: '💻', tagColor: 'green' },
};

/* ─── JSZip 加载器 ───────────────────────────── */
let jsZipLoaded = false;
let dbOpenPromise = null;

function ensureJSZip() {
  return new Promise((resolve, reject) => {
    if (jsZipLoaded || typeof JSZip !== 'undefined') {
      jsZipLoaded = true;
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.onload = () => {
      jsZipLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error('JSZip 加载失败'));
    document.head.appendChild(s);
  });
}

/* ─── 通用工具 ───────────────────────────────── */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'course';
}

function normalizePath(path) {
  return String(path || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

function getDirname(path) {
  const normalized = normalizePath(path);
  const idx = normalized.lastIndexOf('/');
  return idx === -1 ? '' : normalized.slice(0, idx);
}

function joinPathSegments(segments) {
  return normalizePath(segments.filter(Boolean).join('/'));
}

function resolveRelativePath(basePath, relativePath) {
  const clean = normalizePath(relativePath);
  if (!clean) return '';
  // 绝对路径或协议路径直接返回
  if (/^[a-z]+:/i.test(clean)) return clean;
  // 所有相对路径（包括不带 ./ 前缀的）都基于 basePath 目录解析
  const parts = getDirname(basePath).split('/').filter(Boolean);
  clean.split('/').forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  });
  return joinPathSegments(parts);
}

function stripQueryAndHash(value) {
  return String(value || '').split('#')[0].split('?')[0];
}

function isExternalUrl(url) {
  return /^(?:[a-z]+:)?\/\//i.test(url) || /^(?:data|blob|mailto|tel|javascript):/i.test(url);
}

function isHashUrl(url) {
  return String(url || '').startsWith('#');
}

function isHtmlFileName(name) {
  return /\.html?$/i.test(name || '');
}

function blobToDataUrl(blob, mimeType) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // FileReader.readAsDataURL 生成的结果自带正确的 data:mime;base64, 前缀
      // 但如果 blob.type 为空，可能得到 data:application/octet-stream;base64,...
      // 为确保 MIME 正确，必要时手动替换前缀
      let result = reader.result;
      if (mimeType && result) {
        const prefix = result.split(',')[0];
        const expectedPrefix = `data:${mimeType};base64`;
        if (prefix !== expectedPrefix) {
          result = expectedPrefix + ',' + result.split(',')[1];
        }
      }
      resolve(result);
    };
    reader.onerror = () => reject(reader.error || new Error('Blob 转 data URL 失败'));
    reader.readAsDataURL(blob);
  });
}

function guessMimeType(path) {
  const ext = normalizePath(path).split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'application/javascript';
    case 'json': return 'application/json';
    case 'svg': return 'image/svg+xml';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'ogg': return 'audio/ogg';
    case 'woff': return 'font/woff';
    case 'woff2': return 'font/woff2';
    case 'ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
}

function getSubjectInfo(subject) {
  return SUBJECT_META[subject] || { name: subject || '未知学科', emoji: '📚', tagColor: 'blue' };
}

function buildCourseId(manifest, fileName, forceUnique = false) {
  const subject = slugify(manifest?.subject || 'course');
  const nodeId = slugify(manifest?.node_id || '');
  const name = slugify(manifest?.name || fileName || 'course');
  const base = nodeId ? `${subject}-${nodeId}` : `${subject}-${name}`;
  if (forceUnique) {
    // 追加时间戳短码确保唯一性（允许同 node_id 多课件共存）
    const ts = Date.now().toString(36);
    return `${base}-${ts}`;
  }
  return base;
}

function buildCourseKey(course) {
  return course?.manifest?.node_id || course?.id || course?.manifest?.name || course?.fileName;
}

function buildViewerUrl(id) {
  return `${VIEWER_PAGE}?id=${encodeURIComponent(id)}`;
}

function getLegacyCourses() {
  try {
    const value = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.map((item) => ({
          ...item,
          id: item.id || buildCourseId(item.manifest || {}, item.fileName),
          storage: item.storage || 'legacy',
        }))
      : [];
  } catch {
    return [];
  }
}

/* ─── localStorage 索引 CRUD ─────────────────── */
function readCourseIndex() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item) => ({
        ...item,
        id: item.id || buildCourseId(item.manifest || {}, item.fileName),
        storage: item.storage || 'idb',
      }));
    }
  } catch {
    // ignore
  }
  return getLegacyCourses();
}

function saveCourseIndex(courses) {
  const lightweight = courses.map((course) => ({
    id: course.id,
    manifest: course.manifest,
    importedAt: course.importedAt,
    fileName: course.fileName,
    storage: course.storage || 'idb',
    viewerUrl: course.viewerUrl || buildViewerUrl(course.id),
    packageType: course.packageType || 'package',
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
}

function getUserCourses() {
  const all = readCourseIndex();
  // 同一 node_id 只保留最新一份（按 importedAt 倒序，取第一个）
  const seen = new Set();
  const deduped = [];
  // 先按时间倒序排列，确保最新的在前
  all.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));
  for (const course of all) {
    const nodeId = course.manifest?.node_id;
    if (nodeId) {
      if (seen.has(nodeId)) continue; // 同 node_id 已有更新的，跳过
      seen.add(nodeId);
    }
    deduped.push(course);
  }
  return deduped;
}

/* ─── IndexedDB ──────────────────────────────── */
function openCourseDb() {
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('当前浏览器不支持 IndexedDB，无法保存完整课件包'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
  });

  return dbOpenPromise;
}

async function withStore(mode, runner) {
  const db = await openCourseDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = runner(store);

    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error || request?.error || new Error('IndexedDB 事务失败'));
    tx.onabort = () => reject(tx.error || request?.error || new Error('IndexedDB 事务中止'));
  });
}

async function putCoursePayload(payload) {
  return withStore('readwrite', (store) => store.put(payload));
}

async function getCoursePayload(id) {
  const db = await openCourseDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('读取课件失败'));
  });
}

async function deleteCoursePayload(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

/* ─── 课件包解析 ─────────────────────────────── */
function validateManifest(manifest) {
  const errors = [];
  if (!manifest?.name) errors.push('缺少 name');
  if (!manifest?.subject) errors.push('缺少 subject');
  if (manifest?.grade === undefined || manifest?.grade === null || manifest?.grade === '') errors.push('缺少 grade');
  if (errors.length) {
    throw new Error(`manifest.json 验证失败：${errors.join('，')}`);
  }
}

function extractMetaFromHtmlText(text, fallbackName = '未命名课件') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const getMeta = (name) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';
  const titleText = doc.querySelector('title')?.textContent?.trim() || fallbackName;
  const title = titleText.split('·')[0].trim() || fallbackName;
  const subject = getMeta('teachany-subject') || 'math';
  const gradeValue = getMeta('teachany-grade');
  const grade = Number.parseInt(gradeValue, 10);

  return {
    name: title,
    name_en: getMeta('teachany-name-en') || '',
    subject,
    grade: Number.isFinite(grade) ? grade : 8,
    author: getMeta('teachany-author') || 'unknown',
    version: getMeta('teachany-version') || '1.0.0',
    node_id: getMeta('teachany-node') || '',
    domain: getMeta('teachany-domain') || '',
    prerequisites: (getMeta('teachany-prerequisites') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    emoji: getMeta('teachany-emoji') || getSubjectInfo(subject).emoji || '📚',
    difficulty: Number.parseInt(getMeta('teachany-difficulty') || '3', 10) || 3,
    description: getMeta('description') || '',
    tags: [getSubjectInfo(subject).name || subject, `Grade ${Number.isFinite(grade) ? grade : '?'}`],
    teachany_spec: getMeta('teachany-spec') || '1.0',
  };
}

async function parseSingleHTML(file) {
  const text = await file.text();
  const manifest = extractMetaFromHtmlText(text, file.name.replace(/\.html?$/i, ''));
  validateManifest(manifest);

  return {
    id: buildCourseId(manifest, file.name),
    manifest,
    files: [{ path: 'index.html', blob: new Blob([text], { type: 'text/html' }) }],
    fileName: file.name,
    importedAt: new Date().toISOString(),
    packageType: 'single-html',
  };
}

async function parseZipPackage(file) {
  await ensureJSZip();

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const files = [];

  for (const [rawPath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const path = normalizePath(rawPath);
    const blob = await entry.async('blob');
    files.push({
      path,
      blob: blob.type ? blob : new Blob([blob], { type: guessMimeType(path) }),
    });
  }

  const manifestEntry = files.find((item) => normalizePath(item.path) === 'manifest.json');
  const indexEntry = files.find((item) => normalizePath(item.path) === 'index.html');

  if (!indexEntry) {
    throw new Error('课件包中缺少 index.html');
  }

  const indexText = await indexEntry.blob.text();
  let manifest;

  if (manifestEntry) {
    try {
      manifest = JSON.parse(await manifestEntry.blob.text());
    } catch {
      throw new Error('manifest.json 格式错误');
    }
  } else {
    manifest = extractMetaFromHtmlText(indexText, file.name.replace(/\.(teachany|zip)$/i, ''));
  }

  validateManifest(manifest);

  return {
    id: buildCourseId(manifest, file.name),
    manifest,
    files,
    fileName: file.name,
    importedAt: new Date().toISOString(),
    packageType: 'archive',
  };
}

/**
 * 解析课件文件
 * @param {File} file
 * @returns {Promise<{id:string, manifest:Object, files:Array<{path:string, blob:Blob}>, fileName:string, importedAt:string, packageType:string}>}
 */
async function parseTeachanyPackage(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大支持 50MB`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'html' || ext === 'htm') {
    return parseSingleHTML(file);
  }
  if (ext !== 'teachany' && ext !== 'zip') {
    throw new Error('请上传 .teachany、.zip 或 .html 格式的课件');
  }

  return parseZipPackage(file);
}

/* ─── 文件夹课件解析 ──────────────────────────── */

/**
 * 从文件夹的 FileList 中解析课件包（index.html + 所有资源文件）
 * @param {FileList|Array<File>} fileList - 来自 input[webkitdirectory] 或拖拽的文件列表
 * @returns {Promise<Object>} 解析后的课件对象
 */
async function parseFolderFiles(fileList) {
  const filesArray = Array.from(fileList);
  if (!filesArray.length) throw new Error('文件夹为空');

  // 找到共同的根目录前缀（去掉顶层文件夹名）
  const firstRelPath = filesArray[0].webkitRelativePath || filesArray[0].name;
  const rootPrefix = firstRelPath.split('/')[0]; // 顶层文件夹名

  const files = [];
  let indexFile = null;
  let manifestFile = null;
  let totalSize = 0;

  for (const file of filesArray) {
    const rawPath = file.webkitRelativePath || file.name;
    // 去掉顶层文件夹前缀，得到相对路径
    let relativePath = rawPath;
    if (rootPrefix && rawPath.startsWith(rootPrefix + '/')) {
      relativePath = rawPath.slice(rootPrefix.length + 1);
    }
    relativePath = normalizePath(relativePath);
    if (!relativePath) continue;

    // 跳过隐藏文件和常见无用文件
    if (relativePath.startsWith('.') || relativePath.includes('/.') ||
        relativePath === 'Thumbs.db' || relativePath === '.DS_Store' ||
        relativePath.startsWith('__MACOSX')) continue;

    totalSize += file.size;
    if (totalSize > MAX_FILE_SIZE) {
      throw new Error(`文件夹总大小超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 限制`);
    }

    const blob = new Blob([file], { type: file.type || guessMimeType(relativePath) });
    files.push({ path: relativePath, blob });

    if (relativePath === 'index.html' || relativePath === 'index.htm') {
      indexFile = { path: relativePath, blob, file };
    }
    if (relativePath === 'manifest.json') {
      manifestFile = { path: relativePath, blob, file };
    }
  }

  if (!indexFile) {
    throw new Error('文件夹中缺少 index.html，请确认选择了正确的课件文件夹');
  }

  // 解析 manifest
  let manifest;
  if (manifestFile) {
    try {
      const text = await manifestFile.file.text();
      manifest = JSON.parse(text);
    } catch {
      throw new Error('manifest.json 格式错误');
    }
  } else {
    const htmlText = await indexFile.file.text();
    manifest = extractMetaFromHtmlText(htmlText, rootPrefix || '课件');
  }

  validateManifest(manifest);

  // 统计资源类型
  const mediaFiles = files.filter(f =>
    /\.(mp3|mp4|wav|ogg|webm|m4a|aac|flac|avi|mov)$/i.test(f.path)
  );
  const imageFiles = files.filter(f =>
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(f.path)
  );

  console.log(`[TeachAny] 文件夹解析完成: ${files.length} 个文件 (${mediaFiles.length} 个音视频, ${imageFiles.length} 个图片)`);

  return {
    id: buildCourseId(manifest, rootPrefix),
    manifest,
    files,
    fileName: rootPrefix || 'folder-course',
    importedAt: new Date().toISOString(),
    packageType: 'folder',
  };
}

/**
 * 从拖拽的 DataTransferItemList 中递归读取文件夹所有文件
 * @param {DataTransferItemList} items
 * @returns {Promise<File[]>}
 */
async function readDroppedFolder(items) {
  const files = [];

  async function readEntry(entry, parentPath) {
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      // 给 file 附上相对路径（模拟 webkitRelativePath）
      Object.defineProperty(file, 'webkitRelativePath', {
        value: parentPath ? parentPath + '/' + file.name : file.name,
        writable: false,
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await new Promise((resolve, reject) => {
        const allEntries = [];
        function readBatch() {
          dirReader.readEntries((batch) => {
            if (batch.length === 0) { resolve(allEntries); return; }
            allEntries.push(...batch);
            readBatch(); // 递归读取直到空（Chrome 每次最多 100 个）
          }, reject);
        }
        readBatch();
      });
      const dirPath = parentPath ? parentPath + '/' + entry.name : entry.name;
      for (const child of entries) {
        await readEntry(child, dirPath);
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.() || items[i].getAsEntry?.();
    if (entry) {
      await readEntry(entry, '');
    }
  }

  return files;
}

/* ─── 数据持久化 API ─────────────────────────── */
async function addUserCourse(course) {
  const courses = getUserCourses();
  // 始终生成唯一 ID（时间戳确保唯一）
  const id = buildCourseId(course.manifest, course.fileName, true);

  const payload = {
    id,
    manifest: course.manifest,
    importedAt: course.importedAt,
    fileName: course.fileName,
    packageType: course.packageType || 'archive',
    files: (course.files || []).map((item) => ({
      path: normalizePath(item.path),
      blob: item.blob instanceof Blob ? item.blob : new Blob([item.blob], { type: guessMimeType(item.path) }),
    })),
  };

  await putCoursePayload(payload);

  const entry = {
    id,
    manifest: course.manifest,
    importedAt: course.importedAt,
    fileName: course.fileName,
    storage: 'idb',
    viewerUrl: buildViewerUrl(id),
    packageType: course.packageType || 'archive',
    likes: 0,
  };

  // 同一 node_id 只保留最新一份：删除旧课件（索引 + IndexedDB + 点赞数据）
  const nodeId = course.manifest?.node_id;
  let removedIds = [];
  if (nodeId) {
    const oldCourses = courses.filter((item) => item.manifest?.node_id === nodeId);
    for (const old of oldCourses) {
      removedIds.push(old.id);
      try { await deleteCoursePayload(old.id); } catch { /* ignore */ }
      const likes = readLikes();
      delete likes[old.id];
      saveLikes(likes);
    }
  }

  // 去除旧的同 node_id 课件 + 当前 id 的旧记录（防止重复 import 同一包）
  const nextCourses = courses.filter(
    (item) => item.id !== id && !removedIds.includes(item.id)
  );
  nextCourses.push(entry);
  nextCourses.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));
  saveCourseIndex(nextCourses);

  // 初始化点赞数为 0
  const likes = readLikes();
  if (likes[id] === undefined) {
    likes[id] = 0;
    saveLikes(likes);
  }

  return entry;
}

async function getUserCourseRecord(id) {
  const payload = await getCoursePayload(id);
  if (payload) return payload;

  const legacy = getLegacyCourses().find((item) => item.id === id || buildCourseKey(item) === id);
  if (!legacy) return null;

  if (legacy.htmlDataUrl) {
    const response = await fetch(legacy.htmlDataUrl);
    const blob = await response.blob();
    return {
      id: legacy.id,
      manifest: legacy.manifest,
      importedAt: legacy.importedAt,
      fileName: legacy.fileName,
      packageType: 'legacy-html',
      files: [{ path: 'index.html', blob }],
    };
  }

  return null;
}

async function removeUserCourse(id) {
  const courses = getUserCourses();
  const target = courses.find((item) => item.id === id || buildCourseKey(item) === id);
  const normalizedId = target?.id || id;

  const nextCourses = courses.filter((item) => item.id !== normalizedId && buildCourseKey(item) !== id);
  saveCourseIndex(nextCourses.filter((item) => item.storage !== 'legacy'));

  const legacy = getLegacyCourses().filter((item) => item.id !== normalizedId && buildCourseKey(item) !== id);
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy));

  if (target?.storage === 'idb' || !target) {
    try {
      await deleteCoursePayload(normalizedId);
    } catch {
      // ignore
    }
  }

  // 清理点赞数据
  const likes = readLikes();
  delete likes[normalizedId];
  saveLikes(likes);

  return getUserCourses();
}

function getCourseLaunchUrl(course) {
  if (!course) return '#';
  if (course.storage === 'legacy' && course.htmlDataUrl) return course.htmlDataUrl;
  if (course.viewerUrl) return course.viewerUrl;
  if (course.id) return buildViewerUrl(course.id);
  return '#';
}

function findUserCourseByNodeId(nodeId) {
  // 向后兼容：返回该节点点赞最高的课件（如有多个）
  const all = findUserCoursesByNodeId(nodeId);
  return all.length > 0 ? all[0] : null;
}

function findUserCoursesByNodeId(nodeId) {
  if (!nodeId) return [];
  const courses = getUserCourses().filter((item) => item.manifest?.node_id === nodeId);
  // 按导入时间倒序排列（最新在前）
  courses.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));
  return courses;
}

function getTopCoursesByNodeId(nodeId, limit) {
  const max = typeof limit === 'number' ? limit : MAX_COURSES_PER_NODE;
  return findUserCoursesByNodeId(nodeId).slice(0, max);
}

/* ─── 点赞系统（纯前端 localStorage）─────────── */
function readLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLikes(likes) {
  localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
}

function getCourseLikes(courseId) {
  return readLikes()[courseId] || 0;
}

function likeCourse(courseId) {
  const likes = readLikes();
  likes[courseId] = (likes[courseId] || 0) + 1;
  saveLikes(likes);
  return likes[courseId];
}

function unlikeCourse(courseId) {
  const likes = readLikes();
  likes[courseId] = Math.max(0, (likes[courseId] || 0) - 1);
  saveLikes(likes);
  return likes[courseId];
}

function toggleLike(courseId) {
  // 简易切换：使用 sessionStorage 记录本次会话已赞的课件
  const likedKey = `teachany_liked_${courseId}`;
  const alreadyLiked = sessionStorage.getItem(likedKey) === '1';
  if (alreadyLiked) {
    sessionStorage.removeItem(likedKey);
    return { liked: false, count: unlikeCourse(courseId) };
  }
  sessionStorage.setItem(likedKey, '1');
  return { liked: true, count: likeCourse(courseId) };
}

function isLikedInSession(courseId) {
  return sessionStorage.getItem(`teachany_liked_${courseId}`) === '1';
}

/* ─── Viewer：把完整课件包渲染到 iframe ───────── */
function resolveMappedPath(basePath, targetPath, fileMap) {
  if (!targetPath || isExternalUrl(targetPath) || isHashUrl(targetPath)) return null;

  const stripped = stripQueryAndHash(targetPath);
  const candidates = [
    normalizePath(stripped),
    resolveRelativePath(basePath, stripped),
  ].filter(Boolean);

  return candidates.find((candidate) => fileMap.has(candidate)) || null;
}

function rewriteCssUrls(cssText, basePath, fileMap) {
  return String(cssText || '').replace(/url\(([^)]+)\)/gi, (match, rawValue) => {
    const value = String(rawValue || '').trim().replace(/^['"]|['"]$/g, '');
    if (!value || isExternalUrl(value) || isHashUrl(value)) return match;
    const mappedPath = resolveMappedPath(basePath, value, fileMap);
    if (!mappedPath) return match;
    return `url("${fileMap.get(mappedPath).url}")`;
  });
}

function rewriteInlineStyleAttributes(root, basePath, fileMap) {
  root.querySelectorAll('[style]').forEach((node) => {
    const styleValue = node.getAttribute('style');
    if (!styleValue) return;
    node.setAttribute('style', rewriteCssUrls(styleValue, basePath, fileMap));
  });
}

async function inlineLinkedStyles(doc, htmlPath, fileMap) {
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
  for (const link of links) {
    const href = link.getAttribute('href');
    const mappedPath = resolveMappedPath(htmlPath, href, fileMap);
    if (!mappedPath) continue;
    const entry = fileMap.get(mappedPath);
    const cssText = await entry.blob.text();
    const style = doc.createElement('style');
    style.textContent = rewriteCssUrls(cssText, mappedPath, fileMap);
    link.replaceWith(style);
  }
}

function rewriteUrlAttributes(doc, htmlPath, fileMap) {
  const attrSelectors = [
    ['img[src]', 'src'],
    ['audio[src]', 'src'],
    ['video[src]', 'src'],
    ['video[poster]', 'poster'],
    ['source[src]', 'src'],
    ['script[src]', 'src'],
    ['a[href]', 'href'],
    ['iframe[src]', 'src'],
  ];

  attrSelectors.forEach(([selector, attr]) => {
    doc.querySelectorAll(selector).forEach((node) => {
      const value = node.getAttribute(attr);
      if (!value || isExternalUrl(value) || isHashUrl(value)) return;
      const mappedPath = resolveMappedPath(htmlPath, value, fileMap);
      if (mappedPath) {
        node.setAttribute(attr, fileMap.get(mappedPath).url);
      }
    });
  });
}

function rewriteStyleTags(doc, htmlPath, fileMap) {
  doc.querySelectorAll('style').forEach((styleNode) => {
    styleNode.textContent = rewriteCssUrls(styleNode.textContent, htmlPath, fileMap);
  });
}

function injectViewerGuard(doc, manifest) {
  const head = doc.head || doc.documentElement;

  if (!doc.querySelector('meta[charset]')) {
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'UTF-8');
    head.prepend(charset);
  }

  const marker = doc.createElement('meta');
  marker.name = 'teachany-imported-viewer';
  marker.content = manifest?.name || 'TeachAny';
  head.appendChild(marker);
}

async function buildRenderableCourseHtml(courseRecord) {
  const files = (courseRecord?.files || []).map((item) => ({
    path: normalizePath(item.path),
    blob: item.blob instanceof Blob ? item.blob : new Blob([item.blob], { type: guessMimeType(item.path) }),
  }));

  if (!files.length) {
    throw new Error('课件包内容为空');
  }

  // 将所有资源文件转为 data URL（base64），避免 ObjectURL 在 srcdoc 中不可访问
  // 以及避免 blob URL 被浏览器当作下载
  const fileMap = new Map();

  for (const item of files) {
    const normalizedPath = normalizePath(item.path);
    const blob = item.blob;
    const dataUrl = await blobToDataUrl(blob, guessMimeType(normalizedPath));
    fileMap.set(normalizedPath, { path: normalizedPath, blob, url: dataUrl });
  }

  const htmlEntry =
    fileMap.get('index.html') ||
    Array.from(fileMap.values()).find((item) => isHtmlFileName(item.path));

  if (!htmlEntry) {
    throw new Error('课件包中缺少可打开的 HTML 文件');
  }

  const htmlText = await htmlEntry.blob.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  await inlineLinkedStyles(doc, htmlEntry.path, fileMap);
  rewriteStyleTags(doc, htmlEntry.path, fileMap);
  rewriteInlineStyleAttributes(doc, htmlEntry.path, fileMap);
  rewriteUrlAttributes(doc, htmlEntry.path, fileMap);
  injectViewerGuard(doc, courseRecord.manifest);

  const html = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  return { html };
}

async function mountImportedCourseViewer(container, options = {}) {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id');
  if (!courseId) {
    throw new Error('缺少课程 ID');
  }

  const record = await getUserCourseRecord(courseId);
  if (!record) {
    throw new Error('未找到该课件，可能已被删除');
  }

  const titleEl = options.titleEl || null;
  const metaEl = options.metaEl || null;
  const loadingEl = options.loadingEl || null;

  if (loadingEl) loadingEl.textContent = '正在重建课件资源...';
  if (titleEl) titleEl.textContent = record.manifest?.name || '我的课件';
  if (metaEl) {
    const subjectInfo = getSubjectInfo(record.manifest?.subject);
    const metaText = [subjectInfo.name, record.manifest?.grade ? `${record.manifest.grade}年级` : '', record.fileName || '']
      .filter(Boolean)
      .join(' · ');
    metaEl.textContent = metaText;
  }
  document.title = `${record.manifest?.name || '我的课件'} · TeachAny`;

  const { html } = await buildRenderableCourseHtml(record);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '14px';
  iframe.style.background = '#fff';
  // 使用 srcdoc 加载：所有资源已内联为 data URL，无跨 origin 问题
  iframe.srcdoc = html;

  container.innerHTML = '';
  container.appendChild(iframe);

  iframe.addEventListener('load', () => {
    if (loadingEl) loadingEl.textContent = '';
  }, { once: true });

  return { iframe, record };
}

/* ─── UI 组件：导入弹窗 ─────────────────────── */
function injectImporterStyles() {
  if (document.getElementById('teachany-importer-styles')) return;
  const style = document.createElement('style');
  style.id = 'teachany-importer-styles';
  style.textContent = `
    .ta-import-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.25s;
      pointer-events: none;
    }
    .ta-import-overlay.visible { opacity: 1; pointer-events: auto; }

    .ta-import-dialog {
      background: #1e293b; border: 1px solid rgba(148,163,184,0.2);
      border-radius: 20px; padding: 32px; max-width: 520px; width: 90%;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      transform: translateY(20px); transition: transform 0.25s;
    }
    .ta-import-overlay.visible .ta-import-dialog { transform: translateY(0); }

    .ta-import-dialog h2 {
      font-size: 22px; font-weight: 700; margin-bottom: 8px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .ta-import-dialog .subtitle {
      font-size: 14px; color: #94a3b8; margin-bottom: 24px;
    }

    .ta-dropzone {
      border: 2px dashed rgba(59,130,246,0.4); border-radius: 16px;
      padding: 48px 24px; text-align: center; cursor: pointer;
      transition: all 0.25s; background: rgba(59,130,246,0.04);
    }
    .ta-dropzone:hover, .ta-dropzone.dragover {
      border-color: #3b82f6; background: rgba(59,130,246,0.1);
    }
    .ta-dropzone .icon { font-size: 48px; margin-bottom: 12px; }
    .ta-dropzone .label { font-size: 15px; color: #f8fafc; font-weight: 600; }
    .ta-dropzone .hint { font-size: 13px; color: #64748b; margin-top: 8px; }

    .ta-import-status {
      margin-top: 20px; padding: 12px 16px; border-radius: 10px;
      font-size: 14px; display: none;
    }
    .ta-import-status.success {
      display: block; background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3); color: #34d399;
    }
    .ta-import-status.error {
      display: block; background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3); color: #f87171;
    }
    .ta-import-status.loading {
      display: block; background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.3); color: #60a5fa;
    }

    .ta-import-actions {
      display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;
    }
    .ta-btn {
      padding: 8px 20px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    }
    .ta-btn-secondary { background: rgba(148,163,184,0.15); color: #94a3b8; }
    .ta-btn-secondary:hover { background: rgba(148,163,184,0.25); color: #f8fafc; }
    .ta-btn-primary { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; }
    .ta-btn-primary:hover { filter: brightness(1.1); transform: scale(1.02); }
    .ta-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .ta-preview-card {
      margin-top: 16px; padding: 16px; border-radius: 12px;
      background: rgba(30,41,59,0.7); border: 1px solid rgba(148,163,184,0.15);
    }
    .ta-preview-card h3 { font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 6px; }
    .ta-preview-card .meta { font-size: 13px; color: #94a3b8; }
    .ta-preview-card .meta span { margin-right: 12px; }

    .course-card-add {
      background: transparent !important;
      border: 2px dashed rgba(59,130,246,0.3) !important;
      display: flex !important; align-items: center; justify-content: center;
      min-height: 220px; cursor: pointer; transition: all 0.3s;
    }
    .course-card-add:hover {
      border-color: #3b82f6 !important;
      background: rgba(59,130,246,0.05) !important;
      transform: translateY(-4px);
    }
    .course-card-add .add-content {
      text-align: center; padding: 24px;
    }
    .course-card-add .add-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
    .course-card-add .add-label { font-size: 16px; font-weight: 600; color: #3b82f6; }
    .course-card-add .add-hint { font-size: 13px; color: #64748b; margin-top: 8px; }

    .user-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 600;
      background: rgba(245,158,11,0.15); color: #fbbf24;
      margin-left: 8px;
    }

    .card-delete-btn {
      position: absolute; top: 12px; right: 12px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(239,68,68,0.15); color: #f87171;
      border: none; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
      z-index: 2;
    }
    .course-card:hover .card-delete-btn { opacity: 1; }
    .card-delete-btn:hover { background: rgba(239,68,68,0.3); }

    .ta-like-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 16px;
      background: rgba(148,163,184,0.1); color: #94a3b8;
      border: 1px solid rgba(148,163,184,0.15);
      cursor: pointer; font-size: 13px;
      transition: all 0.2s; white-space: nowrap;
    }
    .ta-like-btn:hover {
      background: rgba(239,68,68,0.12);
      border-color: rgba(239,68,68,0.3);
      color: #fca5a5;
    }
    .ta-like-btn.liked {
      background: rgba(239,68,68,0.15);
      border-color: rgba(239,68,68,0.3);
      color: #f87171;
    }
    .ta-like-btn .like-icon { font-size: 14px; }
    .ta-like-btn .like-count { font-weight: 600; font-size: 12px; }

    .ta-community-list {
      margin-top: 10px; display: flex; flex-direction: column; gap: 6px;
    }
    .ta-community-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 10px; border-radius: 8px;
      background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1);
      transition: all 0.2s; cursor: pointer;
      text-decoration: none; color: inherit;
      pointer-events: auto;
    }
    .ta-community-item:hover {
      border-color: rgba(59,130,246,0.3);
      background: rgba(59,130,246,0.08);
    }
    .ta-community-item .item-name {
      font-size: 12px; font-weight: 600; color: #f8fafc;
      flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ta-community-item .item-likes {
      font-size: 11px; color: #fca5a5; margin-left: 8px; white-space: nowrap;
    }
    .ta-community-item .item-rank {
      font-size: 11px; color: #64748b; margin-right: 6px; font-weight: 700; min-width: 16px;
    }
    .ta-community-title {
      font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 10px; margin-bottom: 4px;
    }
  `;
  document.head.appendChild(style);
}

function createImportDialog(options = {}) {
  injectImporterStyles();

  const overlay = document.createElement('div');
  overlay.className = 'ta-import-overlay';
  overlay.innerHTML = `
    <div class="ta-import-dialog">
      <h2>📦 导入课件</h2>
      <p class="subtitle">
        ${options.targetNodeId
          ? `为「${escapeHtml(options.targetNodeName || options.targetNodeId)}」节点上传课件`
          : '上传课件包或课件文件夹（含音视频等资源）'}
      </p>
      <div class="ta-dropzone" id="taDropzone">
        <div class="icon">📂</div>
        <div class="label">拖入文件/文件夹，或点击下方按钮选择</div>
        <div class="hint">支持 .teachany、.zip、.html，或整个课件文件夹（含音视频资源）</div>
        <input type="file" accept=".teachany,.zip,.html,.htm" style="display:none" id="taFileInput">
        <input type="file" webkitdirectory style="display:none" id="taFolderInput">
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="ta-btn ta-btn-secondary" id="taPickFile" style="flex:1;">📄 选择文件</button>
        <button class="ta-btn ta-btn-primary" id="taPickFolder" style="flex:1;background:linear-gradient(135deg,#10b981,#06b6d4);">📁 选择文件夹（推荐）</button>
      </div>
      <div class="ta-import-status" id="taStatus"></div>
      <div id="taPreview"></div>
      <div class="ta-import-actions">
        <button class="ta-btn ta-btn-secondary" id="taCancelBtn">取消</button>
        <button class="ta-btn ta-btn-primary" id="taConfirmBtn" disabled>确认导入</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  const dropzone = overlay.querySelector('#taDropzone');
  const fileInput = overlay.querySelector('#taFileInput');
  const folderInput = overlay.querySelector('#taFolderInput');
  const status = overlay.querySelector('#taStatus');
  const preview = overlay.querySelector('#taPreview');
  const cancelBtn = overlay.querySelector('#taCancelBtn');
  const confirmBtn = overlay.querySelector('#taConfirmBtn');
  const pickFileBtn = overlay.querySelector('#taPickFile');
  const pickFolderBtn = overlay.querySelector('#taPickFolder');

  let parsedCourse = null;

  function close() {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }

  function renderPreview(course) {
    const manifest = course.manifest;
    const subjectInfo = getSubjectInfo(manifest.subject);
    const allFiles = course.files || [];
    const mediaFiles = allFiles.filter(f => /\.(mp3|mp4|wav|ogg|webm|m4a|aac|mov)$/i.test(f.path));
    const imageFiles = allFiles.filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.path));
    const totalSize = allFiles.reduce((sum, f) => sum + (f.blob?.size || 0), 0);

    preview.innerHTML = `
      <div class="ta-preview-card">
        <h3>${escapeHtml(manifest.emoji || subjectInfo.emoji)} ${escapeHtml(manifest.name)}</h3>
        <div class="meta">
          <span>📚 ${escapeHtml(subjectInfo.name)}</span>
          <span>🎓 ${escapeHtml(manifest.grade)}年级</span>
          ${manifest.node_id ? `<span>🌳 ${escapeHtml(manifest.node_id)}</span>` : ''}
          <span>📦 ${allFiles.length} 个文件</span>
          ${mediaFiles.length ? `<span>🎬 ${mediaFiles.length} 个音视频</span>` : ''}
          ${imageFiles.length ? `<span>🖼️ ${imageFiles.length} 个图片</span>` : ''}
          <span>💾 ${formatFileSize(totalSize)}</span>
        </div>
        ${course.packageType === 'single-html' && !mediaFiles.length ? `
          <div style="margin-top:8px;padding:6px 10px;border-radius:6px;background:rgba(245,158,11,0.1);font-size:12px;color:#fbbf24;">
            ⚠️ 单 HTML 文件不包含音视频资源。如需保留音视频，请用「选择文件夹」上传整个课件目录。
          </div>
        ` : ''}
      </div>
    `;
  }

  async function handleFile(file) {
    status.className = 'ta-import-status loading';
    status.textContent = '⏳ 正在解析课件...';
    preview.innerHTML = '';
    confirmBtn.disabled = true;

    try {
      parsedCourse = await parseTeachanyPackage(file);
      if (options.targetNodeId) {
        parsedCourse.manifest.node_id = options.targetNodeId;
        parsedCourse.id = buildCourseId(parsedCourse.manifest, parsedCourse.fileName);
      }
      status.className = 'ta-import-status success';
      status.textContent = '✅ 课件解析成功';
      renderPreview(parsedCourse);
      confirmBtn.disabled = false;
    } catch (err) {
      parsedCourse = null;
      status.className = 'ta-import-status error';
      status.textContent = `❌ ${err.message}`;
    }
  }

  async function handleFolder(fileList) {
    status.className = 'ta-import-status loading';
    status.textContent = '⏳ 正在扫描文件夹...';
    preview.innerHTML = '';
    confirmBtn.disabled = true;

    try {
      parsedCourse = await parseFolderFiles(fileList);
      if (options.targetNodeId) {
        parsedCourse.manifest.node_id = options.targetNodeId;
        parsedCourse.id = buildCourseId(parsedCourse.manifest, parsedCourse.fileName);
      }
      status.className = 'ta-import-status success';
      status.textContent = `✅ 课件解析成功（共 ${parsedCourse.files.length} 个文件）`;
      renderPreview(parsedCourse);
      confirmBtn.disabled = false;
    } catch (err) {
      parsedCourse = null;
      status.className = 'ta-import-status error';
      status.textContent = `❌ ${err.message}`;
    }
  }

  cancelBtn.onclick = close;
  overlay.onclick = (event) => {
    if (event.target === overlay) close();
  };

  // 拖拽支持（文件 + 文件夹）
  dropzone.ondragover = (event) => {
    event.preventDefault();
    dropzone.classList.add('dragover');
  };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop = async (event) => {
    event.preventDefault();
    dropzone.classList.remove('dragover');

    // 检查是否拖入了文件夹
    const items = event.dataTransfer.items;
    if (items && items.length > 0) {
      const firstEntry = items[0].webkitGetAsEntry?.() || items[0].getAsEntry?.();
      if (firstEntry && firstEntry.isDirectory) {
        // 拖入的是文件夹：递归读取所有文件
        status.className = 'ta-import-status loading';
        status.textContent = '⏳ 正在读取文件夹...';
        try {
          const files = await readDroppedFolder(items);
          await handleFolder(files);
        } catch (err) {
          status.className = 'ta-import-status error';
          status.textContent = `❌ 读取文件夹失败: ${err.message}`;
        }
        return;
      }
    }

    // 普通文件拖入
    const file = event.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  // 点击拖拽区域不再直接打开文件选择器（有两个按钮了）
  dropzone.onclick = () => {};

  // 选择文件按钮
  pickFileBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
  fileInput.onchange = async () => {
    if (fileInput.files?.[0]) await handleFile(fileInput.files[0]);
  };

  // 选择文件夹按钮
  pickFolderBtn.onclick = (e) => { e.stopPropagation(); folderInput.click(); };
  folderInput.onchange = async () => {
    if (folderInput.files?.length) await handleFolder(folderInput.files);
  };

  confirmBtn.onclick = async () => {
    if (!parsedCourse) return;

    confirmBtn.disabled = true;
    status.className = 'ta-import-status loading';
    status.textContent = '💾 正在保存课件包...';

    try {
      const courseEntry = await addUserCourse(parsedCourse);
      status.className = 'ta-import-status success';
      status.textContent = '🎉 导入成功！现在就可以在 Gallery、知识树和学习路径中打开。';

      if (options.onImported) {
        options.onImported(courseEntry);
      }

      setTimeout(close, 1200);
    } catch (err) {
      status.className = 'ta-import-status error';
      status.textContent = `❌ ${err.message}`;
      confirmBtn.disabled = false;
    }
  };

  return { close };
}

/* ─── Gallery 集成 ───────────────────────────── */
function initGalleryImporter(gridSelector) {
  injectImporterStyles();
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  if (!grid.querySelector('.course-card-add')) {
    const addCard = document.createElement('div');
    addCard.className = 'course-card course-card-add';
    addCard.innerHTML = `
      <div class="add-content">
        <div class="add-icon">➕</div>
        <div class="add-label">添加我的课件</div>
        <div class="add-hint">导入 .teachany、.zip 或 HTML 文件</div>
      </div>
    `;
    addCard.onclick = () => {
      createImportDialog({
        onImported: () => renderUserCourses(grid),
      });
    };
    grid.appendChild(addCard);
  }

  renderUserCourses(grid);
}

function renderUserCourses(grid) {
  grid.querySelectorAll('.user-course-card').forEach((el) => el.remove());

  const courses = getUserCourses();
  const addCard = grid.querySelector('.course-card-add');
  const likes = readLikes();

  courses.forEach((course) => {
    const manifest = course.manifest || {};
    const subjectInfo = getSubjectInfo(manifest.subject);
    const tags = manifest.tags || [subjectInfo.name, `Grade ${manifest.grade || '?'}`];
    const likeCount = likes[course.id] || 0;
    const isLiked = isLikedInSession(course.id);

    const card = document.createElement('a');
    card.className = 'course-card user-course-card';
    card.href = getCourseLaunchUrl(course);
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.dataset.subject = manifest.subject || 'custom';
    card.style.position = 'relative';

    const colors = ['tag-blue', 'tag-purple', 'tag-green', 'tag-yellow', 'tag-pink', 'tag-cyan'];
    const tagsHtml = tags
      .map((tag, index) => `<span class="tag ${colors[index % colors.length]}">${escapeHtml(tag)}</span>`)
      .join('');

    card.innerHTML = `
      <button class="card-delete-btn" title="删除课件">✕</button>
      <div class="card-header">
        <div class="card-emoji">${escapeHtml(manifest.emoji || subjectInfo.emoji)}</div>
        <h3 class="card-title">${escapeHtml(manifest.name || '未命名课件')} <span class="user-badge">我的课件</span></h3>
        <p class="card-desc">${escapeHtml(manifest.description || manifest.name_en || '用户导入课件')}</p>
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          ${manifest.duration ? `<span>⏱️ ~${escapeHtml(manifest.duration)}</span>` : ''}
          <span>📅 ${escapeHtml((course.importedAt || '').slice(0, 10))}</span>
          <span>🗂️ ${escapeHtml(course.packageType === 'single-html' ? 'HTML' : '完整包')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="ta-like-btn${isLiked ? ' liked' : ''}" data-course-id="${escapeHtml(course.id)}" title="点赞">
            <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
            <span class="like-count">${likeCount}</span>
          </button>
          <button class="ta-export-btn" data-course-id="${escapeHtml(course.id)}" title="导出为 .teachany 文件（包含所有资源）" style="
            display:inline-flex;align-items:center;gap:3px;
            padding:4px 8px;border-radius:16px;
            background:rgba(59,130,246,0.1);color:#60a5fa;
            border:1px solid rgba(59,130,246,0.15);
            cursor:pointer;font-size:12px;font-weight:600;
            transition:all 0.2s;white-space:nowrap;
          ">📦 导出</button>
          <button class="ta-share-community-btn" data-course-id="${escapeHtml(course.id)}" title="分享到社区" style="
            display:inline-flex;align-items:center;gap:3px;
            padding:4px 8px;border-radius:16px;
            background:rgba(16,185,129,0.1);color:#34d399;
            border:1px solid rgba(16,185,129,0.15);
            cursor:pointer;font-size:12px;font-weight:600;
            transition:all 0.2s;white-space:nowrap;
          ">🌐 分享</button>
          <span class="card-action">体验 →</span>
        </div>
      </div>
    `;

    const deleteBtn = card.querySelector('.card-delete-btn');
    deleteBtn.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!confirm(`确定删除「${manifest.name || '未命名课件'}」吗？`)) return;
      await removeUserCourse(course.id || buildCourseKey(course));
      renderUserCourses(grid);
    };

    const likeBtn = card.querySelector('.ta-like-btn');
    likeBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const result = toggleLike(course.id);
      likeBtn.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
      likeBtn.querySelector('.like-count').textContent = result.count;
      likeBtn.classList.toggle('liked', result.liked);
    };

    const shareBtn = card.querySelector('.ta-share-community-btn');
    if (shareBtn) {
      shareBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        // 获取完整课件记录（含 files）
        const fullRecord = await getUserCourseRecord(course.id);
        if (!fullRecord) {
          alert('无法加载课件数据，请重试');
          return;
        }
        if (window.TeachAnyCommunity) {
          TeachAnyCommunity.createShareDialog({ course: fullRecord });
        } else {
          alert('社区共享模块未加载，请刷新页面重试');
        }
      };
    }

    const exportBtn = card.querySelector('.ta-export-btn');
    if (exportBtn) {
      exportBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const originalText = exportBtn.textContent;
        try {
          exportBtn.textContent = '⏳ 打包中...';
          exportBtn.disabled = true;

          await exportCourseAsTeachany(course.id);

          exportBtn.textContent = '✅ 已导出';
          setTimeout(() => { exportBtn.textContent = originalText; }, 2000);
        } catch (err) {
          exportBtn.textContent = '❌ 失败';
          console.error('[TeachAny] 导出失败:', err);
          setTimeout(() => { exportBtn.textContent = originalText; }, 2000);
        }
      };
    }

    if (addCard) {
      grid.insertBefore(card, addCard);
    } else {
      grid.appendChild(card);
    }
  });
}

/* ─── 知识树集成 ──────────────────────────────── */
function addTreeUploadButton(nodeData, tooltipEl) {
  const nodeId = nodeData.id;
  const topCourses = getTopCoursesByNodeId(nodeId);
  const hasUserCourses = topCourses.length > 0;

  // 展示我的课件摘要（仅显示最新一条，不逐一列举）
  if (hasUserCourses) {
    const summaryEl = document.createElement('div');
    summaryEl.className = 'ta-community-title';
    const latest = topCourses[0];
    const manifest = latest?.manifest || {};
    const launchUrl = getCourseLaunchUrl(latest);
    const importedDate = (latest?.importedAt || '').slice(0, 10);

    summaryEl.innerHTML = `
      📂 已有 ${topCourses.length} 个课件
      <span style="color:#64748b;font-weight:normal;margin-left:4px;">
        · 最新：<a href="${escapeHtml(launchUrl)}" target="_blank" rel="noopener noreferrer"
          style="color:#60a5fa;text-decoration:none;" data-ta-stop-prop>${escapeHtml(manifest.name || '未命名')}</a>
        <span style="color:#475569;">(${importedDate})</span>
      </span>
    `;
    // 阻止冒泡
    const stopLinks = summaryEl.querySelectorAll('[data-ta-stop-prop]');
    stopLinks.forEach((link) => {
      link.onclick = (event) => { event.stopPropagation(); };
    });
    tooltipEl.appendChild(summaryEl);
  }

  // 上传按钮始终显示（即使已有课件，用户仍可继续上传新版本）
  const uploadBtn = document.createElement('button');
  uploadBtn.style.cssText = `
    display: block; width: 100%; margin-top: 10px; padding: 8px 12px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    pointer-events: auto; transition: all 0.2s;
  `;
  uploadBtn.textContent = hasUserCourses ? '➕ 上传新课件' : '📦 上传课件';
  uploadBtn.onmouseenter = () => { uploadBtn.style.filter = 'brightness(1.15)'; };
  uploadBtn.onmouseleave = () => { uploadBtn.style.filter = ''; };
  uploadBtn.onclick = (event) => {
    event.stopPropagation();
    createImportDialog({
      targetNodeId: nodeData.id,
      targetNodeName: nodeData.name,
      onImported: () => {
        if (typeof window.teachanyOnCourseImported === 'function') {
          window.teachanyOnCourseImported(nodeData.id);
        }
      },
    });
  };

  tooltipEl.appendChild(uploadBtn);
}

/* ─── 导出为 .teachany（ZIP 打包下载）───────── */

/**
 * 将本地课件从 IndexedDB 重新打包为 .teachany 文件并触发浏览器下载
 * @param {string} courseId - 课件 ID
 * @returns {Promise<void>}
 */
async function exportCourseAsTeachany(courseId) {
  // 确保 JSZip 已加载
  await ensureJSZip();

  const record = await getUserCourseRecord(courseId);
  if (!record || !record.files || !record.files.length) {
    throw new Error('未找到该课件的完整数据，可能已被删除');
  }

  const manifest = record.manifest || {};
  const zip = new JSZip();

  // 将每个文件写入 ZIP
  for (const file of record.files) {
    const filePath = normalizePath(file.path);
    if (!filePath) continue;
    const blob = file.blob instanceof Blob ? file.blob : new Blob([file.blob], { type: guessMimeType(filePath) });
    zip.file(filePath, blob);
  }

  // 写入/更新 manifest.json
  const existingManifest = record.files.find((f) => normalizePath(f.path) === 'manifest.json');
  if (!existingManifest) {
    zip.file(
      'manifest.json',
      JSON.stringify(manifest, null, 2),
      { type: 'application/json' }
    );
  }

  // 生成 ZIP blob 并触发下载
  const name = slugify(manifest.name || courseId) + '.teachany';
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, name);
}

/**
 * 触发浏览器文件下载
 */
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

/**
 * 获取课件完整大小估算（用于显示）
 * @param {string} courseId
 * @returns {Promise<number>} 大小（字节）
 */
async function getCourseFileSize(courseId) {
  try {
    const record = await getCoursePayload(courseId);
    if (!record?.files) return 0;
    let total = 0;
    for (const f of record.files || []) {
      total += f.blob?.size || 0;
    }
    return total;
  } catch {
    return 0;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

window.TeachAnyImporter = {
  parseTeachanyPackage,
  parseFolderFiles,
  readDroppedFolder,
  getUserCourses,
  addUserCourse,
  removeUserCourse,
  createImportDialog,
  initGalleryImporter,
  addTreeUploadButton,
  getCourseLaunchUrl,
  getUserCourseRecord,
  findUserCourseByNodeId,
  findUserCoursesByNodeId,
  getTopCoursesByNodeId,
  getCourseLikes,
  likeCourse,
  unlikeCourse,
  toggleLike,
  isLikedInSession,
  mountImportedCourseViewer,

  // 导出功能
  exportCourseAsTeachany,
  getCourseFileSize,
  formatFileSize,
  downloadBlob,

  SUBJECT_META,
  MAX_COURSES_PER_NODE,
};
