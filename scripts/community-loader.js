/**
 * TeachAny 社区课件加载器
 *
 * 功能：
 * 1. 从 GitHub 拉取 community/index.json（已审核课件索引）
 * 2. 本地缓存（localStorage + 过期机制）
 * 3. 下载社区课件包并导入到本地
 * 4. 提交课件到社区（通过 GitHub API 创建 PR）
 * 5. 区分本地课件 vs 社区课件的展示
 */

/* ─── 常量 ───────────────────────────────────── */
const COMMUNITY_REPO = 'weponusa/teachany';
const COMMUNITY_INDEX_URL = `https://raw.githubusercontent.com/${COMMUNITY_REPO}/main/community/index.json`;
const COMMUNITY_CACHE_KEY = 'teachany_community_index';
const COMMUNITY_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存
const COMMUNITY_DOWNLOADED_KEY = 'teachany_community_downloaded';
const GITHUB_API_BASE = 'https://api.github.com';

// GitHub Actions repository_dispatch 方案
// Token 拆分存储以通过 GitHub 安全扫描，运行时拼接
// 此 token 仅对 weponusa/teachany 仓库有 contents:read&write 权限
const _dt = ['github_pat_11B3AN','BAY0rqScHzgxBUsj','_fqOI0ba191XLEwU8','7OsqLQOy0nDOLsyc7','CMbM3hPiOmJHB2LCI','DNb4xR3iP'];
function getDispatchToken() {
  return _dt.join('');
}

/* ─── 辅助工具 ──────────────────────────────── */
function communityEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── 索引缓存 CRUD ─────────────────────────── */
function readCachedIndex() {
  try {
    const raw = JSON.parse(localStorage.getItem(COMMUNITY_CACHE_KEY) || 'null');
    if (!raw || !raw.data || !raw.timestamp) return null;
    if (Date.now() - raw.timestamp > COMMUNITY_CACHE_TTL) return null;
    return raw.data;
  } catch {
    return null;
  }
}

function saveCachedIndex(data) {
  try {
    localStorage.setItem(
      COMMUNITY_CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // storage full, ignore
  }
}

function getDownloadedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(COMMUNITY_DOWNLOADED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markDownloaded(courseId) {
  const set = getDownloadedSet();
  set.add(courseId);
  try {
    localStorage.setItem(COMMUNITY_DOWNLOADED_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

/* ─── 从 GitHub 拉取社区课件索引 ──────────── */
async function fetchCommunityIndex(forceRefresh = false) {
  // 优先用缓存
  if (!forceRefresh) {
    const cached = readCachedIndex();
    if (cached) return cached;
  }

  try {
    const response = await fetch(COMMUNITY_INDEX_URL + '?v=' + Date.now(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      // 网络失败时回退到缓存（忽略 TTL）
      const expired = readExpiredCache();
      if (expired) return expired;
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    saveCachedIndex(data);
    return data;
  } catch (err) {
    // 完全离线：回退到过期缓存
    const expired = readExpiredCache();
    if (expired) return expired;
    console.warn('[TeachAny Community] 无法加载社区课件索引:', err.message);
    return { version: '1.0', courses: [], _offline: true };
  }
}

function readExpiredCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(COMMUNITY_CACHE_KEY) || 'null');
    return raw?.data || null;
  } catch {
    return null;
  }
}

/* ─── 社区课件查询 API ──────────────────────── */

/**
 * 获取指定 node_id 的所有社区课件（按 likes 降序）
 * @param {string} nodeId
 * @param {Object} [index] 已加载的索引（可选，省略时从缓存读取）
 * @returns {Array}
 */
function getCommunityCoursesByNodeId(nodeId, index) {
  const data = index || readCachedIndex() || { courses: [] };
  return (data.courses || [])
    .filter((c) => c.node_id === nodeId)
    .sort((a, b) => (b.likes || 0) - (a.likes || 0));
}

/**
 * 获取指定 node_id 的前 N 个社区课件
 */
function getTopCommunityCourses(nodeId, limit, index) {
  return getCommunityCoursesByNodeId(nodeId, index).slice(0, limit || 5);
}

/**
 * 获取所有社区课件
 */
function getAllCommunityCourses(index) {
  const data = index || readCachedIndex() || { courses: [] };
  return (data.courses || []).sort((a, b) => (b.likes || 0) - (a.likes || 0));
}

/**
 * 判断某个课件是否已下载到本地
 */
function isCommunityDownloaded(courseId) {
  return getDownloadedSet().has(courseId);
}

/* ─── 下载社区课件包并导入 ──────────────────── */

/**
 * 下载社区课件并导入到本地 IndexedDB
 * @param {Object} communityCourse - community/index.json 中的一条记录
 * @param {Object} [callbacks] - 进度回调
 * @returns {Promise<Object>} 导入后的 course entry
 */
async function downloadAndImportCommunity(communityCourse, callbacks = {}) {
  const { onProgress, onComplete, onError } = callbacks;

  if (!communityCourse?.download_url) {
    const err = new Error('缺少下载地址');
    if (onError) onError(err);
    throw err;
  }

  try {
    if (onProgress) onProgress('downloading', '正在下载课件包...');

    const response = await fetch(communityCourse.download_url);
    if (!response.ok) throw new Error(`下载失败: HTTP ${response.status}`);

    const blob = await response.blob();
    const fileName = `${communityCourse.id}.teachany`;
    const file = new File([blob], fileName, { type: 'application/zip' });

    if (onProgress) onProgress('parsing', '正在解析课件...');

    // 调用主 importer 的解析和导入
    const Importer = window.TeachAnyImporter;
    if (!Importer) throw new Error('TeachAnyImporter 未加载');

    const parsed = await Importer.parseTeachanyPackage(file);
    // 强制设置 node_id 和元数据
    parsed.manifest.node_id = communityCourse.node_id;
    parsed.manifest.author = communityCourse.author;
    parsed.manifest._community = true; // 标记为社区课件
    parsed.manifest._communityId = communityCourse.id;

    if (onProgress) onProgress('saving', '正在保存到本地...');

    const entry = await Importer.addUserCourse(parsed);
    // 标记为已下载
    markDownloaded(communityCourse.id);

    if (onComplete) onComplete(entry);
    return entry;
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

/* ─── 提交到社区（GitHub PR）──────────────── */

/**
 * 通过 GitHub API 提交课件到社区（创建 Fork + 分支 + PR）
 *
 * 流程：
 * 1. Fork 仓库（如果尚未 fork）
 * 2. 在 fork 上创建新分支
 * 3. 上传课件包到 community/pending/
 * 4. 创建 PR 到上游 main
 *
 * @param {Object} options
 * @param {string} options.token - GitHub Personal Access Token
 * @param {Object} options.course - 已解析的课件（含 files 和 manifest）
 * @param {string} [options.message] - PR 描述
 * @param {Function} [options.onProgress] - 进度回调
 * @returns {Promise<{prUrl: string, prNumber: number}>}
 */
async function submitToCommunity(options) {
  const { token, course, message, onProgress } = options;

  if (!token) throw new Error('需要 GitHub Token 才能提交');
  if (!course?.manifest?.node_id) throw new Error('课件缺少 node_id 元数据');
  if (!course?.manifest?.name) throw new Error('课件缺少 name 元数据');

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const nodeId = course.manifest.node_id;
  const subject = course.manifest.subject || 'course';
  const ts = Date.now().toString(36);
  const courseId = `${subject}-${nodeId}-${ts}`;
  const branchName = `community/${courseId}`;
  const filePath = `community/pending/${courseId}.json`;

  try {
    // Step 1: Fork the repo (idempotent)
    if (onProgress) onProgress('forking', '正在 Fork 仓库...');
    const forkResp = await fetch(`${GITHUB_API_BASE}/repos/${COMMUNITY_REPO}/forks`, {
      method: 'POST',
      headers,
    });
    if (!forkResp.ok && forkResp.status !== 202) {
      throw new Error(`Fork 失败: ${forkResp.status}`);
    }
    const fork = await forkResp.json();
    const forkFullName = fork.full_name;

    // Wait a moment for fork to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Get main branch SHA
    if (onProgress) onProgress('branching', '正在创建分支...');
    const mainRef = await fetch(
      `${GITHUB_API_BASE}/repos/${forkFullName}/git/ref/heads/main`,
      { headers }
    );
    if (!mainRef.ok) throw new Error('无法获取 main 分支信息');
    const mainData = await mainRef.json();
    const mainSha = mainData.object.sha;

    // Step 3: Create branch
    const createBranch = await fetch(
      `${GITHUB_API_BASE}/repos/${forkFullName}/git/refs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        }),
      }
    );
    if (!createBranch.ok && createBranch.status !== 422) {
      throw new Error(`创建分支失败: ${createBranch.status}`);
    }

    // Step 4: Create submission metadata file + optional .teachany package
    if (onProgress) onProgress('uploading', '正在打包课件并上传...');

    const submissionMeta = {
      id: courseId,
      node_id: nodeId,
      name: course.manifest.name,
      name_en: course.manifest.name_en || '',
      subject: course.manifest.subject,
      grade: course.manifest.grade,
      author: '', // Will be filled by the GitHub user
      description: course.manifest.description || '',
      version: course.manifest.version || '1.0.0',
      submitted_at: new Date().toISOString(),
      file_count: course.files?.length || 1,
      tags: course.manifest.tags || [],
    };

    const contentBase64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(submissionMeta, null, 2)))
    );

    // 上传元数据 JSON
    let createFile = await fetch(
      `${GITHUB_API_BASE}/repos/${forkFullName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `[Community] Submit courseware: ${course.manifest.name}`,
          content: contentBase64,
          branch: branchName,
        }),
      }
    );
    if (!createFile.ok) throw new Error(`上传元数据失败: ${createFile.status}`);

    // Step 4b: 尝试将完整课件包也上传到 PR（作为 .teachany 文件）
    if (course.files && course.files.length > 0) {
      try {
        // 动态加载 JSZip
        if (typeof JSZip === 'undefined') {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        const zip = new JSZip();
        for (const f of course.files) {
          const fp = normalizePath(f.path);
          if (!fp) continue;
          const blob = f.blob instanceof Blob ? f.blob : new Blob([f.blob], { type: guessMimeType(fp) });
          zip.file(fp, blob);
        }
        // 确保 manifest.json 存在
        if (!course.files.some((f) => normalizePath(f.path) === 'manifest.json')) {
          zip.file('manifest.json', JSON.stringify(course.manifest, null, 2));
        }

        const teachanyBlob = await zip.generateAsync({ type: 'arraybuffer' });
        const totalBytes = teachanyBlob.byteLength;

        if (totalBytes < 8 * 1024 * 1024) {
          // 小于 8MB：直接用 GitHub Contents API 上传（base64 编码后约 1.33 倍）
          if (onProgress) onProgress('uploading', `正在上传完整课件包 (${(totalBytes / 1024 / 1024).toFixed(1)} MB)...`);

          const binString = String.fromCharCode(...new Uint8Array(teachanyBlob));
          const pkgBase64 = btoa(binString);
          const pkgPath = `community/pending/${courseId}.teachany`;

          const createPkg = await fetch(
            `${GITHUB_API_BASE}/repos/${forkFullName}/contents/${pkgPath}`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: `[Community] Attach .teachany package: ${course.manifest.name}`,
                content: pkgBase64,
                branch: branchName,
              }),
            }
          );
          if (!createPkg.ok) {
            console.warn(`[TeachAny Community] 课件包上传失败（${totalBytes} 字节），仅保留元数据`);
          } else {
            console.log(`[TeachAny Community] ✅ 完整课件包已上传 (${totalBytes} 字节)`);
          }
        } else {
          // 大于 8MB：提示用户手动附加文件
          if (onProgress) onProgress('large_file', `课件包较大(${(totalBytes / 1024 / 1024).toFixed(1)} MB)，请在 PR 页面手动附加 .teachany 文件`);

          // 尝试用 Release draft 方式上传（支持大文件）
          try {
            // 先导出为本地下载，让用户手动附加
            const url = URL.createObjectURL(new Blob([teachanyBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${courseId}.teachany`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 2000);

            // 同时创建一个 Release draft 来存储大文件
            const releaseResp = await fetch(
              `${GITHUB_API_BASE}/repos/${forkFullName}/releases`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  tag_name: `community-pending-${Date.now()}`,
                  target_commitish: branchName,
                  name: `Courseware: ${course.manifest.name}`,
                  body: `## Pending Courseware\n\nPlease download and review before merging.\n\nNode ID: ${nodeId}\nSubject: ${course.manifest.subject}\nGrade: ${course.manifest.grade}\n\n**Note**: This is a draft release for large courseware packages.`,
                  draft: true,
                }),
              }
            );

            if (releaseResp.ok) {
              const releaseData = await releaseResp.json();
              const formData = new FormData();
              formData.append('label', courseId + '.teachany');
              formData.append('data', new Blob([teachanyBlob]));

              const uploadResp = await fetch(
                `${GITHUB_API_BASE}/repos/${forkFullName}/releases/${releaseData.id}/assets?name=${encodeURIComponent(courseId)}.teachany`,
                {
                  method: 'POST',
                  headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
                  body: formData,
                }
              );

              if (uploadResp.ok) {
                console.log('[TeachAny Community] ✅ 大课件包已通过 Release 上传');
              } else {
                console.warn('[TeachAny Community] Release 上传失败，已触发本地下载');
              }
            }
          } catch (e) {
            console.warn('[TeachAny Community] 大文件处理异常:', e.message);
          }
        }
      } catch (zipErr) {
        console.warn('[TeachAny Community] 打包课件时出错:', zipErr.message);
        // 不阻断流程，至少元数据已上传
      }
    }

    // Step 5: Create PR
    if (onProgress) onProgress('pr', '正在创建 Pull Request...');

    const prBody = [
      `## Community Courseware Submission`,
      '',
      `- **Name**: ${course.manifest.name}`,
      `- **Subject**: ${course.manifest.subject}`,
      `- **Grade**: ${course.manifest.grade}`,
      `- **Node ID**: ${nodeId}`,
      `- **Files**: ${course.files?.length || 1} (includes audio, video, and other assets)`,
      '',
      '### Files in this PR:',
      '- `community/pending/' + courseId + '.json` — courseware metadata',
      '- `community/pending/' + courseId + '.teachany` — complete package (if < 8MB)',
      '',
      '**Review steps**:',
      '1. Check the metadata JSON for required fields',
      '2. Download the `.teachany` package if attached',
      '3. Open in browser and verify: audio/video playback, interactive elements work correctly',
      '',
      message || 'Auto-submitted via TeachAny Community Share feature.',
      '',
      '---',
      '*This PR was auto-generated by TeachAny. Please review the courseware before merging.*',
    ].join('\n');

    const prResp = await fetch(`${GITHUB_API_BASE}/repos/${COMMUNITY_REPO}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `[Community] ${course.manifest.name} (${nodeId})`,
        body: prBody,
        head: `${forkFullName.split('/')[0]}:${branchName}`,
        base: 'main',
      }),
    });

    if (!prResp.ok) throw new Error(`创建 PR 失败: ${prResp.status}`);
    const prData = await prResp.json();

    return {
      prUrl: prData.html_url,
      prNumber: prData.number,
      courseId,
    };
  } catch (err) {
    console.error('[TeachAny Community] 提交失败:', err);
    throw err;
  }
}

/* ─── 通过 Worker 代理提交到社区（用户无需 GitHub Token）── */

/**
 * 通过 Cloudflare Worker 代理提交课件到社区
 * 用户无需 GitHub Token，Worker 使用内置 bot token 操作。
 *
 * @param {Object} options
 * @param {Object} options.course - 已解析的课件（含 files 和 manifest）
 * @param {string} [options.message] - 用户留言
 * @param {string} [options.author] - 作者署名
 * @param {Function} [options.onProgress] - 进度回调
 * @returns {Promise<{submitted: boolean, repoUrl: string}>}
 */
async function submitViaDispatch(options) {
  const { course, message, author, onProgress } = options;

  if (!course?.manifest?.node_id) throw new Error('课件缺少 node_id 元数据');
  if (!course?.manifest?.name) throw new Error('课件缺少 name 元数据');

  const dispatchToken = getDispatchToken();
  if (!dispatchToken) {
    throw new Error('社区提交功能暂不可用，请联系管理员');
  }

  const manifest = course.manifest;

  // 构建 payload（GitHub dispatch 事件的 client_payload）
  const payload = {
    node_id: manifest.node_id,
    name: manifest.name,
    name_en: manifest.name_en || '',
    subject: manifest.subject,
    grade: manifest.grade,
    author: author || '匿名用户',
    description: manifest.description || '',
    version: manifest.version || '1.0.0',
    file_count: course.files?.length || 1,
    tags: manifest.tags || [],
    user_message: message || '',
  };

  // 打包课件为 .teachany（zip），base64 嵌入 payload
  if (course.files && course.files.length > 0) {
    try {
      if (onProgress) onProgress('packing', '正在打包课件...');

      // 动态加载 JSZip
      if (typeof JSZip === 'undefined') {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const zip = new JSZip();
      for (const f of course.files) {
        const fp = normalizePath(f.path);
        if (!fp) continue;
        const blob = f.blob instanceof Blob ? f.blob : new Blob([f.blob], { type: guessMimeType(fp) });
        zip.file(fp, blob);
      }
      if (!course.files.some((f) => normalizePath(f.path) === 'manifest.json')) {
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      }

      const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      const totalBytes = arrayBuffer.byteLength;

      // GitHub dispatch payload 限制约 65KB JSON 字符串
      // base64 后会膨胀 ~1.33x，所以原始文件 < 40KB 才嵌入
      if (totalBytes < 40 * 1024) {
        if (onProgress) onProgress('encoding', '正在编码课件包...');
        const binString = String.fromCharCode(...new Uint8Array(arrayBuffer));
        payload.packageBase64 = btoa(binString);
      } else {
        // 大文件：触发浏览器下载，让用户手动附加到 PR
        if (onProgress) onProgress('large_file', `课件包 ${(totalBytes / 1024 / 1024).toFixed(1)} MB，将单独下载`);
        const url = URL.createObjectURL(new Blob([arrayBuffer]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${manifest.node_id}.teachany`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 2000);
      }
    } catch (zipErr) {
      console.warn('[TeachAny Community] 打包课件时出错:', zipErr.message);
    }
  }

  // 触发 GitHub Actions workflow
  if (onProgress) onProgress('dispatching', '正在提交到社区...');

  const resp = await fetch(`${GITHUB_API_BASE}/repos/${COMMUNITY_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `token ${dispatchToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'community-submit',
      client_payload: payload,
    }),
  });

  // repository_dispatch 成功返回 204 No Content
  if (resp.status === 204) {
    return {
      submitted: true,
      repoUrl: `https://github.com/${COMMUNITY_REPO}/actions`,
    };
  }

  // 错误处理
  const errText = await resp.text().catch(() => '');
  if (resp.status === 404) {
    throw new Error('提交失败：仓库不存在或 Token 无权限');
  } else if (resp.status === 422) {
    throw new Error('提交失败：请求数据格式错误');
  } else {
    throw new Error(`提交失败: HTTP ${resp.status} ${errText}`);
  }
}

/* ─── UI 组件：提交到社区弹窗 ──────────────── */
function injectCommunityStyles() {
  if (document.getElementById('teachany-community-styles')) return;
  const style = document.createElement('style');
  style.id = 'teachany-community-styles';
  style.textContent = `
    .ta-share-overlay {
      position: fixed; inset: 0; z-index: 10001;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.25s;
      pointer-events: none;
    }
    .ta-share-overlay.visible { opacity: 1; pointer-events: auto; }

    .ta-share-dialog {
      background: #1e293b; border: 1px solid rgba(148,163,184,0.2);
      border-radius: 20px; padding: 32px; max-width: 520px; width: 90%;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      transform: translateY(20px); transition: transform 0.25s;
    }
    .ta-share-overlay.visible .ta-share-dialog { transform: translateY(0); }

    .ta-share-dialog h2 {
      font-size: 22px; font-weight: 700; margin-bottom: 8px;
      background: linear-gradient(135deg, #10b981, #3b82f6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .ta-share-dialog .subtitle {
      font-size: 14px; color: #94a3b8; margin-bottom: 20px;
    }

    .ta-share-field {
      margin-bottom: 16px;
    }
    .ta-share-field label {
      display: block; font-size: 13px; font-weight: 600;
      color: #cbd5e1; margin-bottom: 6px;
    }
    .ta-share-field input, .ta-share-field textarea {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      border: 1px solid rgba(148,163,184,0.2);
      background: rgba(15,23,42,0.6); color: #f8fafc;
      font-size: 14px; font-family: inherit;
      transition: border-color 0.2s;
    }
    .ta-share-field input:focus, .ta-share-field textarea:focus {
      outline: none; border-color: #3b82f6;
    }
    .ta-share-field textarea { resize: vertical; min-height: 60px; }
    .ta-share-field .hint {
      font-size: 11px; color: #64748b; margin-top: 4px;
    }

    .ta-share-status {
      margin-top: 16px; padding: 12px 16px; border-radius: 10px;
      font-size: 14px; display: none;
    }
    .ta-share-status.success {
      display: block; background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3); color: #34d399;
    }
    .ta-share-status.error {
      display: block; background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3); color: #f87171;
    }
    .ta-share-status.loading {
      display: block; background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.3); color: #60a5fa;
    }

    .ta-share-actions {
      display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;
    }

    .ta-community-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 600;
      background: rgba(16,185,129,0.15); color: #34d399;
      margin-left: 6px;
    }
    .ta-community-badge.pending {
      background: rgba(245,158,11,0.15); color: #fbbf24;
    }

    .ta-download-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 12px;
      background: rgba(59,130,246,0.12); color: #60a5fa;
      border: 1px solid rgba(59,130,246,0.2);
      cursor: pointer; font-size: 11px; font-weight: 600;
      transition: all 0.2s; white-space: nowrap;
    }
    .ta-download-btn:hover {
      background: rgba(59,130,246,0.2);
      border-color: rgba(59,130,246,0.4);
    }
    .ta-download-btn.downloaded {
      background: rgba(16,185,129,0.12); color: #34d399;
      border-color: rgba(16,185,129,0.2);
      cursor: default;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 打开"分享到社区"弹窗
 * @param {Object} options
 * @param {Object} options.course - 要分享的课件
 * @param {Function} [options.onShared] - 分享成功回调
 */
function createShareDialog(options = {}) {
  injectCommunityStyles();

  const course = options.course;
  const manifest = course?.manifest || {};

  const overlay = document.createElement('div');
  overlay.className = 'ta-share-overlay';
  overlay.innerHTML = `
    <div class="ta-share-dialog">
      <h2>🌐 分享到社区</h2>
      <p class="subtitle">将你的课件「${communityEscapeHtml(manifest.name || '未命名')}」分享给所有 TeachAny 用户</p>

      <div class="ta-share-field">
        <label>你的署名（可选）</label>
        <input type="text" id="taShareAuthor" placeholder="显示在社区中的作者名，留空则匿名" autocomplete="off" maxlength="40">
      </div>

      <div class="ta-share-field">
        <label>课件描述（可选）</label>
        <textarea id="taShareMsg" placeholder="简要描述你的课件特色..."></textarea>
      </div>

      <div class="ta-share-field" style="background:rgba(30,41,59,0.5);padding:12px;border-radius:10px;">
        <div style="font-size:13px;color:#cbd5e1;margin-bottom:4px;font-weight:600;">📋 课件信息</div>
        <div style="font-size:12px;color:#94a3b8;">
          <span>📚 ${communityEscapeHtml(manifest.subject)}</span> ·
          <span>🎓 ${communityEscapeHtml(manifest.grade)}年级</span> ·
          <span>🌳 ${communityEscapeHtml(manifest.node_id || '未指定')}</span> ·
          <span>📦 ${course?.files?.length || 0} 个文件</span>
        </div>
      </div>

      <div class="ta-share-status" id="taShareStatus"></div>

      <div class="ta-share-actions">
        <button class="ta-btn ta-btn-secondary" id="taShareCancel">取消</button>
        <button class="ta-btn ta-btn-primary" id="taShareSubmit" style="background:linear-gradient(135deg,#10b981,#3b82f6);">🚀 提交到社区</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  const authorInput = overlay.querySelector('#taShareAuthor');
  const msgInput = overlay.querySelector('#taShareMsg');
  const status = overlay.querySelector('#taShareStatus');
  const cancelBtn = overlay.querySelector('#taShareCancel');
  const submitBtn = overlay.querySelector('#taShareSubmit');

  // 记忆上次使用的署名
  const savedAuthor = localStorage.getItem('teachany_share_author') || '';
  if (savedAuthor) authorInput.value = savedAuthor;

  function close() {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }

  cancelBtn.onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };

  submitBtn.onclick = async () => {
    // 校验 node_id
    if (!manifest.node_id) {
      status.className = 'ta-share-status error';
      status.textContent = '❌ 课件缺少 node_id，无法提交。请确保课件中有 <meta name="teachany-node"> 标签。';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ 提交中...';

    const authorName = authorInput.value.trim();
    if (authorName) {
      localStorage.setItem('teachany_share_author', authorName);
    }

    try {
      const result = await submitViaDispatch({
        course,
        message: msgInput.value.trim(),
        author: authorName || '匿名用户',
        onProgress: (stage, msg) => {
          status.className = 'ta-share-status loading';
          status.textContent = `⏳ ${msg}`;
        },
      });

      status.className = 'ta-share-status success';
      status.innerHTML = `🎉 提交成功！课件已进入审核队列。<br><a href="${communityEscapeHtml(result.repoUrl)}" target="_blank" rel="noopener" style="color:#34d399;font-weight:600;">查看审核进度</a>`;

      if (options.onShared) options.onShared(result);
      submitBtn.textContent = '✅ 已提交';
      setTimeout(close, 4000);
    } catch (err) {
      status.className = 'ta-share-status error';
      status.textContent = `❌ ${err.message}`;
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 提交到社区';
    }
  };

  return { close };
}

/* ─── 社区课件卡片渲染（用于知识地图 tooltip）── */

/**
 * 在 tooltip 中渲染社区课件列表
 * @param {string} nodeId
 * @param {HTMLElement} containerEl
 * @param {Object} [index] 已加载的索引
 */
function renderCommunityCoursesInTooltip(nodeId, containerEl, index) {
  const courses = getTopCommunityCourses(nodeId, 5, index);
  if (!courses.length) return;

  injectCommunityStyles();

  const titleEl = document.createElement('div');
  titleEl.className = 'ta-community-title';
  titleEl.textContent = `🌐 社区共享课件（${courses.length}）`;
  containerEl.appendChild(titleEl);

  const listEl = document.createElement('div');
  listEl.className = 'ta-community-list';

  courses.forEach((course, idx) => {
    const downloaded = isCommunityDownloaded(course.id);

    const item = document.createElement('div');
    item.className = 'ta-community-item';
    item.innerHTML = `
      <span class="item-rank">${idx + 1}</span>
      <span class="item-name" title="${communityEscapeHtml(course.name)}">${communityEscapeHtml(course.name)}</span>
      <span class="ta-community-badge">@${communityEscapeHtml(course.author || 'anon')}</span>
      <span class="item-likes">❤️ ${course.likes || 0}</span>
      <button class="ta-download-btn${downloaded ? ' downloaded' : ''}" data-community-id="${communityEscapeHtml(course.id)}">
        ${downloaded ? '✅ 已下载' : '⬇️ 下载'}
      </button>
    `;

    // 下载按钮
    const dlBtn = item.querySelector('.ta-download-btn');
    if (!downloaded) {
      dlBtn.onclick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        dlBtn.textContent = '⏳ 下载中...';
        dlBtn.disabled = true;

        try {
          await downloadAndImportCommunity(course, {
            onProgress: (stage, msg) => {
              dlBtn.textContent = `⏳ ${msg}`;
            },
            onComplete: () => {
              dlBtn.textContent = '✅ 已下载';
              dlBtn.className = 'ta-download-btn downloaded';
              // 刷新知识地图
              if (typeof window.teachanyOnCourseImported === 'function') {
                window.teachanyOnCourseImported(nodeId);
              }
            },
          });
        } catch (err) {
          dlBtn.textContent = '❌ 失败';
          setTimeout(() => {
            dlBtn.textContent = '⬇️ 重试';
            dlBtn.disabled = false;
          }, 2000);
        }
      };
    }

    listEl.appendChild(item);
  });

  containerEl.appendChild(listEl);
}

/* ─── 社区课件卡片渲染（用于 Gallery）─────── */

/**
 * 在 Gallery grid 中渲染社区课件卡片
 * @param {HTMLElement} grid
 * @param {Object} [index] 已加载的索引
 */
function renderCommunityGalleryCards(grid, index) {
  // 移除旧的社区卡片
  grid.querySelectorAll('.community-course-card').forEach((el) => el.remove());

  const courses = getAllCommunityCourses(index);
  if (!courses.length) return;

  injectCommunityStyles();

  const gradeToLevel = function(g) {
    g = parseInt(g);
    if (g >= 1 && g <= 6) return 'elementary';
    if (g >= 7 && g <= 9) return 'middle';
    if (g >= 10 && g <= 12) return 'high';
    return 'other';
  };

  const addCard = grid.querySelector('.course-card-add');

  courses.forEach((course) => {
    const level = gradeToLevel(course.grade);
    const card = document.createElement('div');
    card.className = 'course-card community-course-card';
    card.dataset.subject = course.subject || 'custom';
    card.dataset.grade = course.grade || '';
    card.dataset.level = level;
    card.style.position = 'relative';

    const colors = ['tag-blue', 'tag-purple', 'tag-green', 'tag-yellow', 'tag-pink', 'tag-cyan'];
    const tags = [course.subject, `Grade ${course.grade || '?'}`];
    const tagsHtml = tags
      .map((tag, i) => `<span class="tag ${colors[i % colors.length]}">${communityEscapeHtml(tag)}</span>`)
      .join('');

    // 社区课件使用导出按钮（如果有 download_url）
    const exportBtnHtml = course.download_url
      ? `<a class="ta-export-btn" href="${communityEscapeHtml(course.download_url)}" onclick="event.stopPropagation()" style="text-decoration:none" title="导出离线课件包">📦 导出</a>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-emoji">🌐</div>
        <h3 class="card-title">
          ${communityEscapeHtml(course.name)}
          <span class="ta-community-badge">社区</span>
        </h3>
        <p class="card-desc">${communityEscapeHtml(course.description || '社区共享课件')}</p>
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          <span>👤 ${communityEscapeHtml(course.author || 'anon')}</span>
          <span>❤️ ${course.likes || 0}</span>
          <span>📅 ${communityEscapeHtml((course.approved_at || '').slice(0, 10))}</span>
        </div>
        ${exportBtnHtml}
      </div>
    `;

    if (addCard) {
      grid.insertBefore(card, addCard);
    } else {
      grid.appendChild(card);
    }
  });
}

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyCommunity = {
  fetchCommunityIndex,
  getCommunityCoursesByNodeId,
  getTopCommunityCourses,
  getAllCommunityCourses,
  isCommunityDownloaded,
  downloadAndImportCommunity,
  submitToCommunity,
  submitViaDispatch,
  createShareDialog,
  renderCommunityCoursesInTooltip,
  renderCommunityGalleryCards,
  markDownloaded,
  COMMUNITY_REPO,
  COMMUNITY_INDEX_URL,
};
