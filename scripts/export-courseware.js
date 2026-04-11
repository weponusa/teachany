/**
 * TeachAny 课件导出模块
 * 将课件及其所有依赖（HTML/CSS/JS/音频/图片等）打包为 .zip 文件
 */

/* ─── 动态加载 JSZip ─────────────────────────── */
let jszipLoaded = false;

async function ensureJSZip() {
  if (typeof JSZip !== 'undefined') {
    jszipLoaded = true;
    return;
  }
  
  if (jszipLoaded) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    script.onload = () => {
      jszipLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* ─── 从 URL 获取课件 HTML ───────────────────── */
async function fetchCoursewareHTML(url) {
  try {
    // 如果是相对路径，转换为绝对路径
    const absoluteUrl = url.startsWith('http') ? url : new URL(url, window.location.href).href;
    const response = await fetch(absoluteUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (err) {
    throw new Error(`获取课件失败: ${err.message}`);
  }
}

/* ─── 解析 HTML 中的资源依赖 ────────────────── */
function extractDependencies(html, baseUrl) {
  const deps = [];
  
  // 1. 音频文件 <audio src="...">
  const audioMatches = html.matchAll(/<audio[^>]*src=["']([^"']+)["']/gi);
  for (const match of audioMatches) {
    deps.push({ type: 'audio', path: match[1] });
  }
  
  // 2. 图片文件 <img src="...">
  const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi);
  for (const match of imgMatches) {
    deps.push({ type: 'image', path: match[1] });
  }
  
  // 3. CSS 文件 <link rel="stylesheet" href="...">
  const cssMatches = html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi);
  for (const match of cssMatches) {
    deps.push({ type: 'css', path: match[1] });
  }
  
  // 4. JS 文件 <script src="...">
  const jsMatches = html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi);
  for (const match of jsMatches) {
    deps.push({ type: 'js', path: match[1] });
  }
  
  // 5. 视频文件 <video><source src="...">
  const videoMatches = html.matchAll(/<source[^>]*src=["']([^"']+)["']/gi);
  for (const match of videoMatches) {
    deps.push({ type: 'video', path: match[1] });
  }
  
  // 过滤掉外部 CDN 资源（不打包）
  return deps.filter(dep => {
    const path = dep.path;
    return !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('//');
  });
}

/* ─── 下载依赖文件 ──────────────────────────── */
async function fetchDependency(depPath, baseUrl) {
  try {
    const absoluteUrl = new URL(depPath, baseUrl).href;
    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      console.warn(`[TeachAny Export] 依赖下载失败: ${depPath} (${response.status})`);
      return null;
    }
    return await response.blob();
  } catch (err) {
    console.warn(`[TeachAny Export] 依赖下载错误: ${depPath}`, err.message);
    return null;
  }
}

/* ─── 导出课件为 ZIP ────────────────────────── */
async function exportCourseware(options) {
  const { url, courseName, onProgress } = options;
  
  try {
    // 1. 加载 JSZip
    if (onProgress) onProgress('loading', '正在加载打包工具...');
    await ensureJSZip();
    
    // 2. 获取课件 HTML
    if (onProgress) onProgress('fetching', '正在获取课件内容...');
    const html = await fetchCoursewareHTML(url);
    
    // 3. 解析依赖
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const deps = extractDependencies(html, baseUrl);
    
    if (onProgress) onProgress('parsing', `发现 ${deps.length} 个依赖文件...`);
    
    // 4. 创建 ZIP
    const zip = new JSZip();
    zip.file('index.html', html);
    
    // 5. 下载并打包依赖
    let successCount = 0;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      if (onProgress) onProgress('downloading', `下载依赖 (${i + 1}/${deps.length}): ${dep.path}`);
      
      const blob = await fetchDependency(dep.path, baseUrl);
      if (blob) {
        zip.file(dep.path, blob);
        successCount++;
      }
    }
    
    // 6. 生成 manifest.json
    const manifest = {
      name: courseName || 'TeachAny Courseware',
      exported_at: new Date().toISOString(),
      html_file: 'index.html',
      dependencies: deps.map(d => d.path),
      dependencies_downloaded: successCount,
      note: '本课件包由 TeachAny 导出，可离线使用。打开 index.html 即可开始学习。'
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    
    // 7. 生成 ZIP 文件
    if (onProgress) onProgress('generating', '正在生成 ZIP 文件...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // 8. 触发下载
    const fileName = `${courseName || 'courseware'}.zip`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    
    if (onProgress) onProgress('complete', '导出完成！');
    
    return {
      success: true,
      fileName,
      size: zipBlob.size,
      dependencies: deps.length,
      downloaded: successCount
    };
    
  } catch (err) {
    console.error('[TeachAny Export] 导出失败:', err);
    if (onProgress) onProgress('error', `导出失败: ${err.message}`);
    throw err;
  }
}

/* ─── 创建导出按钮（用于卡片） ─────────────── */
function createExportButton(courseId, courseName, courseUrl) {
  const btn = document.createElement('button');
  btn.className = 'ta-export-btn';
  btn.innerHTML = '📦 导出课件';
  btn.title = '导出为离线课件包（ZIP）';
  btn.dataset.courseId = courseId;
  btn.dataset.courseName = courseName;
  btn.dataset.courseUrl = courseUrl;
  
  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    
    try {
      await exportCourseware({
        url: courseUrl,
        courseName: courseName,
        onProgress: (stage, msg) => {
          btn.innerHTML = `⏳ ${msg}`;
        }
      });
      
      btn.innerHTML = '✅ 导出成功';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
      
    } catch (err) {
      btn.innerHTML = '❌ 导出失败';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    }
  };
  
  return btn;
}

/* ─── 注入样式 ──────────────────────────────── */
function injectExportStyles() {
  if (document.getElementById('teachany-export-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'teachany-export-styles';
  style.textContent = `
    .ta-export-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgba(16,185,129,0.12);
      color: #34d399;
      border: 1px solid rgba(16,185,129,0.2);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .ta-export-btn:hover {
      background: rgba(16,185,129,0.2);
      border-color: rgba(16,185,129,0.4);
      transform: translateY(-1px);
    }
    .ta-export-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;
  document.head.appendChild(style);
}

// 自动注入样式
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectExportStyles);
} else {
  injectExportStyles();
}

/* ─── 导出 ───────────────────────────────────── */
window.TeachAnyExport = {
  exportCourseware,
  createExportButton,
  ensureJSZip,
  fetchCoursewareHTML,
  extractDependencies
};
