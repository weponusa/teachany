/**
 * TeachAny 课件导入器（纯前端）
 * 
 * 功能：
 *   1. 解析 .teachany 课件包（ZIP 格式，含 manifest.json + index.html）
 *   2. 使用 localStorage 持久化用户导入的课件列表
 *   3. 提供拖拽上传 UI 组件
 *   4. 支持从 Gallery 和知识树两个入口导入
 * 
 * 依赖：
 *   - 使用浏览器原生 API（File, FileReader, Blob）
 *   - 使用 JSZip（通过 CDN 动态加载）解压 ZIP
 *   - 零后端依赖，全部运行在浏览器端
 */

/* ─── 常量 ───────────────────────────────────── */
const STORAGE_KEY = 'teachany_user_courses';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const SUBJECT_META = {
  math:      { name: '数学', emoji: '📐', tagColor: 'blue' },
  physics:   { name: '物理', emoji: '⚡', tagColor: 'yellow' },
  chemistry: { name: '化学', emoji: '🧪', tagColor: 'green' },
  biology:   { name: '生物', emoji: '🧬', tagColor: 'pink' },
  geography: { name: '地理', emoji: '🌍', tagColor: 'cyan' },
  history:   { name: '历史', emoji: '📜', tagColor: 'yellow' },
  chinese:   { name: '语文', emoji: '📖', tagColor: 'pink' },
  english:   { name: '英语', emoji: '🌐', tagColor: 'blue' },
  it:        { name: '信息技术', emoji: '💻', tagColor: 'green' },
};

/* ─── JSZip 加载器 ───────────────────────────── */
let jsZipLoaded = false;

function ensureJSZip() {
  return new Promise((resolve, reject) => {
    if (jsZipLoaded || typeof JSZip !== 'undefined') {
      jsZipLoaded = true;
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.onload = () => { jsZipLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('JSZip 加载失败'));
    document.head.appendChild(s);
  });
}

/* ─── localStorage CRUD ──────────────────────── */
function getUserCourses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveUserCourses(courses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function addUserCourse(course) {
  const courses = getUserCourses();
  // 去重（按 manifest.node_id 或 name）
  const key = course.manifest.node_id || course.manifest.name;
  const idx = courses.findIndex(c => (c.manifest.node_id || c.manifest.name) === key);
  if (idx >= 0) {
    courses[idx] = course; // 更新
  } else {
    courses.push(course);
  }
  saveUserCourses(courses);
  return courses;
}

function removeUserCourse(id) {
  const courses = getUserCourses().filter(c => (c.manifest.node_id || c.manifest.name) !== id);
  saveUserCourses(courses);
  return courses;
}

/* ─── 课件包解析 ─────────────────────────────── */

/**
 * 解析 .teachany 文件
 * @param {File} file - 用户选择的文件
 * @returns {Promise<{manifest: Object, htmlBlob: Blob, htmlUrl: string}>}
 */
async function parseTeachanyPackage(file) {
  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大支持 50MB`);
  }

  // 验证扩展名
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'teachany' && ext !== 'zip') {
    throw new Error('请上传 .teachany 或 .zip 格式的课件包');
  }

  await ensureJSZip();

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 检查 manifest.json
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    // 尝试直接解析为 HTML（兼容直接上传 index.html 的情况）
    return await parseSingleHTML(file);
  }

  const manifestText = await manifestFile.async('string');
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error('manifest.json 格式错误');
  }

  // 验证必填字段
  const errors = [];
  if (!manifest.name) errors.push('缺少 name');
  if (!manifest.subject) errors.push('缺少 subject');
  if (!manifest.grade) errors.push('缺少 grade');
  if (errors.length > 0) {
    throw new Error(`manifest.json 验证失败: ${errors.join(', ')}`);
  }

  // 提取 index.html
  const indexFile = zip.file('index.html');
  if (!indexFile) {
    throw new Error('课件包中缺少 index.html');
  }

  const htmlBlob = await indexFile.async('blob');
  const htmlUrl = URL.createObjectURL(new Blob([htmlBlob], { type: 'text/html' }));

  return {
    manifest,
    htmlBlob,
    htmlUrl,
    fileName: file.name,
    importedAt: new Date().toISOString(),
  };
}

/**
 * 解析单个 HTML 文件（兼容模式）
 */
async function parseSingleHTML(file) {
  const text = await file.text();

  // 从 meta 标签提取信息
  const getMeta = (name) => {
    const m = text.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i'));
    return m ? m[1] : '';
  };

  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].split('·')[0].trim() : file.name.replace('.html', '');

  const subject = getMeta('teachany-subject') || 'math';
  const manifest = {
    name: title,
    name_en: '',
    subject: subject,
    grade: parseInt(getMeta('teachany-grade')) || 8,
    author: getMeta('teachany-author') || 'unknown',
    version: getMeta('teachany-version') || '1.0.0',
    node_id: getMeta('teachany-node') || '',
    domain: getMeta('teachany-domain') || '',
    prerequisites: getMeta('teachany-prerequisites') ? getMeta('teachany-prerequisites').split(',').map(s => s.trim()) : [],
    emoji: SUBJECT_META[subject]?.emoji || '📚',
    difficulty: parseInt(getMeta('teachany-difficulty')) || 3,
    tags: [SUBJECT_META[subject]?.name || subject, `Grade ${getMeta('teachany-grade') || '?'}`],
    teachany_spec: '1.0',
  };

  const htmlBlob = new Blob([text], { type: 'text/html' });
  const htmlUrl = URL.createObjectURL(htmlBlob);

  return {
    manifest,
    htmlBlob,
    htmlUrl,
    fileName: file.name,
    importedAt: new Date().toISOString(),
  };
}

/* ─── UI 组件：导入弹窗 ─────────────────────── */

/**
 * 注入导入弹窗 CSS
 */
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
    .ta-btn { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .ta-btn-secondary { background: rgba(148,163,184,0.15); color: #94a3b8; }
    .ta-btn-secondary:hover { background: rgba(148,163,184,0.25); color: #f8fafc; }
    .ta-btn-primary { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; }
    .ta-btn-primary:hover { filter: brightness(1.1); transform: scale(1.02); }
    .ta-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    /* 导入成功后的课件预览卡片 */
    .ta-preview-card {
      margin-top: 16px; padding: 16px; border-radius: 12px;
      background: rgba(30,41,59,0.7); border: 1px solid rgba(148,163,184,0.15);
    }
    .ta-preview-card h3 { font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 6px; }
    .ta-preview-card .meta { font-size: 13px; color: #94a3b8; }
    .ta-preview-card .meta span { margin-right: 12px; }

    /* Gallery 页面的「添加课件」卡片 */
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

    /* 用户课件卡片标识 */
    .user-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 600;
      background: rgba(245,158,11,0.15); color: #fbbf24;
      margin-left: 8px;
    }

    /* 删除按钮 */
    .card-delete-btn {
      position: absolute; top: 12px; right: 12px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(239,68,68,0.15); color: #f87171;
      border: none; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
    }
    .course-card:hover .card-delete-btn { opacity: 1; }
    .card-delete-btn:hover { background: rgba(239,68,68,0.3); }
  `;
  document.head.appendChild(style);
}

/**
 * 创建导入弹窗
 * @param {Object} options
 * @param {string} options.targetNodeId - 知识树目标节点 ID（从知识树导入时使用）
 * @param {Function} options.onImported - 导入成功回调
 */
function createImportDialog(options = {}) {
  injectImporterStyles();

  const overlay = document.createElement('div');
  overlay.className = 'ta-import-overlay';
  overlay.innerHTML = `
    <div class="ta-import-dialog">
      <h2>📦 导入课件</h2>
      <p class="subtitle">
        ${options.targetNodeId
          ? `为「${options.targetNodeName || options.targetNodeId}」节点上传课件`
          : '拖入 .teachany 课件包或单个 index.html 文件'}
      </p>
      <div class="ta-dropzone" id="taDropzone">
        <div class="icon">📂</div>
        <div class="label">拖入文件或点击选择</div>
        <div class="hint">支持 .teachany 包 或 .html 单文件</div>
        <input type="file" accept=".teachany,.zip,.html" style="display:none" id="taFileInput">
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
  const status = overlay.querySelector('#taStatus');
  const preview = overlay.querySelector('#taPreview');
  const cancelBtn = overlay.querySelector('#taCancelBtn');
  const confirmBtn = overlay.querySelector('#taConfirmBtn');

  let parsedCourse = null;

  // 关闭弹窗
  function close() {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }

  cancelBtn.onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };

  // 拖拽
  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop = async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  // 点击选择
  dropzone.onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    if (fileInput.files[0]) await handleFile(fileInput.files[0]);
  };

  // 处理文件
  async function handleFile(file) {
    status.className = 'ta-import-status loading';
    status.textContent = '⏳ 正在解析课件包...';
    preview.innerHTML = '';
    confirmBtn.disabled = true;

    try {
      parsedCourse = await parseTeachanyPackage(file);

      // 如果从知识树导入，自动关联节点
      if (options.targetNodeId) {
        parsedCourse.manifest.node_id = options.targetNodeId;
      }

      const m = parsedCourse.manifest;
      const subjectInfo = SUBJECT_META[m.subject] || { name: m.subject, emoji: '📚' };

      status.className = 'ta-import-status success';
      status.textContent = '✅ 课件解析成功';

      preview.innerHTML = `
        <div class="ta-preview-card">
          <h3>${m.emoji || subjectInfo.emoji} ${m.name}</h3>
          <div class="meta">
            <span>📚 ${subjectInfo.name}</span>
            <span>🎓 ${m.grade}年级</span>
            ${m.node_id ? `<span>🌳 ${m.node_id}</span>` : ''}
            ${m.difficulty ? `<span>⭐ 难度 ${m.difficulty}</span>` : ''}
          </div>
        </div>
      `;

      confirmBtn.disabled = false;

    } catch (err) {
      status.className = 'ta-import-status error';
      status.textContent = `❌ ${err.message}`;
      parsedCourse = null;
    }
  }

  // 确认导入
  confirmBtn.onclick = () => {
    if (!parsedCourse) return;

    // 保存课件 HTML 到 localStorage（Base64 编码）
    const reader = new FileReader();
    reader.onload = () => {
      const courseEntry = {
        manifest: parsedCourse.manifest,
        htmlDataUrl: reader.result,
        importedAt: parsedCourse.importedAt,
        fileName: parsedCourse.fileName,
      };

      addUserCourse(courseEntry);

      status.className = 'ta-import-status success';
      status.textContent = '🎉 导入成功！刷新页面即可看到新课件。';
      confirmBtn.disabled = true;

      if (options.onImported) {
        options.onImported(courseEntry);
      }

      // 1.5 秒后关闭
      setTimeout(close, 1500);
    };
    reader.readAsDataURL(parsedCourse.htmlBlob);
  };

  return { close };
}

/* ─── Gallery 集成 ───────────────────────────── */

/**
 * 在 Gallery 课件网格中插入「添加课件」卡片和用户课件卡片
 * @param {string} gridSelector - 课件网格的 CSS 选择器
 */
function initGalleryImporter(gridSelector) {
  injectImporterStyles();
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  // 1. 插入「添加课件」卡片
  const addCard = document.createElement('div');
  addCard.className = 'course-card course-card-add';
  addCard.innerHTML = `
    <div class="add-content">
      <div class="add-icon">➕</div>
      <div class="add-label">添加我的课件</div>
      <div class="add-hint">导入 .teachany 包或 HTML 文件</div>
    </div>
  `;
  addCard.onclick = () => {
    createImportDialog({
      onImported: () => {
        renderUserCourses(grid);
      },
    });
  };
  grid.appendChild(addCard);

  // 2. 渲染已有的用户课件
  renderUserCourses(grid);
}

/**
 * 渲染用户课件卡片
 */
function renderUserCourses(grid) {
  // 移除旧的用户课件卡片
  grid.querySelectorAll('.user-course-card').forEach(el => el.remove());

  const courses = getUserCourses();
  const addCard = grid.querySelector('.course-card-add');

  courses.forEach(course => {
    const m = course.manifest;
    const subjectInfo = SUBJECT_META[m.subject] || { name: m.subject, emoji: '📚' };
    const tags = m.tags || [subjectInfo.name, `Grade ${m.grade}`];

    const card = document.createElement('a');
    card.className = 'course-card user-course-card';
    card.href = course.htmlDataUrl || '#';
    card.target = '_blank';
    card.dataset.subject = m.subject;
    card.style.position = 'relative';

    card.innerHTML = `
      <button class="card-delete-btn" title="删除课件">✕</button>
      <div class="card-header">
        <div class="card-emoji">${m.emoji || subjectInfo.emoji}</div>
        <h3 class="card-title">${m.name} <span class="user-badge">我的课件</span></h3>
        <p class="card-desc">${m.description || m.name_en || ''}</p>
        <div class="card-tags">
          ${tags.map((t, i) => {
            const colors = ['tag-blue', 'tag-purple', 'tag-green', 'tag-yellow', 'tag-pink', 'tag-cyan'];
            return `<span class="tag ${colors[i % colors.length]}">${t}</span>`;
          }).join('')}
        </div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          ${m.lines ? `<span>📝 ${m.lines} lines</span>` : ''}
          ${m.duration ? `<span>⏱️ ~${m.duration}</span>` : ''}
          <span>📅 ${course.importedAt ? course.importedAt.slice(0, 10) : ''}</span>
        </div>
        <span class="card-action">体验 →</span>
      </div>
    `;

    // 删除按钮
    card.querySelector('.card-delete-btn').onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`确定删除「${m.name}」吗？`)) {
        removeUserCourse(m.node_id || m.name);
        renderUserCourses(grid);
      }
    };

    // 插入到「添加」卡片之前
    if (addCard) {
      grid.insertBefore(card, addCard);
    } else {
      grid.appendChild(card);
    }
  });
}

/* ─── 知识树集成 ──────────────────────────────── */

/**
 * 为知识树的 tooltip 添加上传按钮
 * @param {Object} nodeData - 知识树节点数据
 * @param {HTMLElement} tooltipEl - tooltip DOM 元素
 */
function addTreeUploadButton(nodeData, tooltipEl) {
  if (nodeData.status !== 'gap') return;

  // 检查用户是否已上传该节点的课件
  const courses = getUserCourses();
  const existing = courses.find(c => c.manifest.node_id === nodeData.id);

  if (existing) {
    // 已有用户课件，显示打开链接
    const link = document.createElement('a');
    link.className = 'course-link';
    link.href = existing.htmlDataUrl || '#';
    link.target = '_blank';
    link.textContent = '📂 打开我的课件';
    link.style.pointerEvents = 'auto';
    link.style.marginTop = '8px';
    link.style.display = 'block';
    tooltipEl.appendChild(link);

    return;
  }

  // 添加上传按钮
  const uploadBtn = document.createElement('button');
  uploadBtn.style.cssText = `
    display: block; width: 100%; margin-top: 10px; padding: 8px 12px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    pointer-events: auto; transition: all 0.2s;
  `;
  uploadBtn.textContent = '📦 上传课件';
  uploadBtn.onmouseenter = () => { uploadBtn.style.filter = 'brightness(1.15)'; };
  uploadBtn.onmouseleave = () => { uploadBtn.style.filter = ''; };
  uploadBtn.onclick = (e) => {
    e.stopPropagation();
    createImportDialog({
      targetNodeId: nodeData.id,
      targetNodeName: nodeData.name,
      onImported: () => {
        // 导入后可以触发知识树重新渲染
        if (typeof window.teachanyOnCourseImported === 'function') {
          window.teachanyOnCourseImported(nodeData.id);
        }
      },
    });
  };

  tooltipEl.appendChild(uploadBtn);
}

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyImporter = {
  // 核心 API
  parseTeachanyPackage,
  getUserCourses,
  addUserCourse,
  removeUserCourse,

  // UI 组件
  createImportDialog,
  initGalleryImporter,
  addTreeUploadButton,

  // 常量
  SUBJECT_META,
};
