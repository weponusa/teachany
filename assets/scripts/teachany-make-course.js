/**
 * TeachAny 制作课件模块（与 PBL 项目共用）
 * tree.html / pbl.html / pbl-path.js 统一调用 TeachAnyMakeCourse.open()
 */
(function (global) {
  'use strict';

  var STYLE_ID = 'teachany-make-course-styles';

  function buildPrompt(nodeId, nodeName) {
    var name = nodeName || nodeId || '该知识点';
    var id = nodeId || '';
    return '帮我生成「' + name + '」的课件，知识点 ID 为 ' + id + '。请按照 TeachAny 技能规范，生成完整的交互式课件 HTML。';
  }

  function recordIntent(nodeId, nodeName, prompt, source, meta) {
    meta = meta || {};
    try {
      if (global.TeachAnyHistory && typeof global.TeachAnyHistory.recordCreated === 'function') {
        global.TeachAnyHistory.recordCreated((source || 'make-course') + '-intent-' + nodeId, {
          source: source || 'make-course',
          name: (nodeName || nodeId) + '（制作课件意图）',
          subject: meta.subject || '',
          grade: meta.grade != null ? String(meta.grade) : (meta.gradeLabel || ''),
          node: nodeId,
          url: '',
          prompt: prompt,
          status: 'draft'
        });
      }
    } catch (_e) { /* ignore */ }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.tmc-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.62);z-index:3000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s ease;}',
      '.tmc-overlay.visible{opacity:1;pointer-events:auto;}',
      '.tmc-panel{max-width:520px;width:100%;max-height:85vh;overflow:auto;background:#1e293b;border:1px solid rgba(148,163,184,0.2);border-radius:14px;padding:20px 22px;color:#f8fafc;box-shadow:0 12px 40px rgba(0,0,0,0.45);}',
      '.tmc-panel h3{margin:0 0 6px;font-size:18px;}',
      '.tmc-panel .tmc-meta{font-size:12px;color:#94a3b8;margin-bottom:14px;}',
      '.tmc-hint{font-size:12px;color:#94a3b8;line-height:1.7;margin-bottom:10px;}',
      '.tmc-prompt{background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;}',
      '.tmc-actions{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap;}',
      '.tmc-copy{padding:8px 16px;border-radius:6px;background:#f59e0b;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;}',
      '.tmc-copy:hover{filter:brightness(1.08);}',
      '.tmc-pbl-link{font-size:12px;color:#3b82f6;text-decoration:none;}',
      '.tmc-pbl-link:hover{text-decoration:underline;}',
      '.tmc-close{float:right;background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;padding:0 4px;}',
      '.tmc-feedback{font-size:12px;color:#10b981;opacity:0;transition:opacity .3s;}',
      '.tmc-feedback.visible{opacity:1;}',
      '.tree-make-course-btn,.generate-cw-btn{display:block;width:100%;margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:13px;font-weight:700;cursor:pointer;pointer-events:auto;text-align:center;}',
      '.tree-make-course-btn:hover,.generate-cw-btn:hover{filter:brightness(1.08);}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyles();
    var overlay = document.getElementById('teachany-make-course-modal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'teachany-make-course-modal';
    overlay.className = 'tmc-overlay';
    overlay.innerHTML = [
      '<div class="tmc-panel" role="dialog" aria-labelledby="tmc-title">',
      '  <button type="button" class="tmc-close" aria-label="关闭">&times;</button>',
      '  <h3 id="tmc-title">✨ 制作课件</h3>',
      '  <div class="tmc-meta" id="tmc-meta"></div>',
      '  <div class="tmc-hint">推荐在 <b>WorkBuddy</b> 中加载 <b>TeachAny Skill</b>；也兼容 <b>CodeBuddy</b>、<b>Cursor</b>、<b>Claude Code</b> 等 AI 助手。复制下方提示词即可生成课件。</div>',
      '  <div class="tmc-prompt" id="tmc-prompt"></div>',
      '  <div class="tmc-actions">',
      '    <button type="button" class="tmc-copy" id="tmc-copy-btn">📋 复制提示词</button>',
      '    <span class="tmc-feedback" id="tmc-feedback">已复制!</span>',
      '    <a class="tmc-pbl-link" id="tmc-pbl-link" href="./pbl.html" target="_blank" rel="noopener">在 PBL 页面打开 →</a>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closeModal();
    });
    overlay.querySelector('.tmc-close').addEventListener('click', closeModal);
    overlay.querySelector('#tmc-copy-btn').addEventListener('click', copyPrompt);
    return overlay;
  }

  var currentPrompt = '';

  function copyPrompt() {
    if (!currentPrompt) return;
    var feedback = document.getElementById('tmc-feedback');
    var done = function () {
      if (feedback) {
        feedback.classList.add('visible');
        setTimeout(function () { feedback.classList.remove('visible'); }, 2000);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentPrompt).then(done).catch(done);
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = currentPrompt;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_e) { /* ignore */ }
    document.body.removeChild(ta);
    done();
  }

  function closeModal() {
    var overlay = document.getElementById('teachany-make-course-modal');
    if (overlay) overlay.classList.remove('visible');
  }

  function showModal(nodeId, nodeName, prompt) {
    var overlay = ensureOverlay();
    currentPrompt = prompt;
    var title = overlay.querySelector('#tmc-title');
    var meta = overlay.querySelector('#tmc-meta');
    var promptEl = overlay.querySelector('#tmc-prompt');
    var pblLink = overlay.querySelector('#tmc-pbl-link');
    if (title) title.textContent = '✨ 制作课件 · ' + (nodeName || nodeId);
    if (meta) meta.textContent = '知识点 ID：' + nodeId;
    if (promptEl) promptEl.textContent = prompt;
    if (pblLink) {
      pblLink.href = './pbl.html?make=' + encodeURIComponent(nodeId) + '&name=' + encodeURIComponent(nodeName || nodeId);
    }
    overlay.classList.add('visible');
  }

  function open(opts) {
    opts = opts || {};
    var nodeId = opts.nodeId || opts.id || '';
    var nodeName = opts.nodeName || opts.name || nodeId;
    if (!nodeId) return;
    var prompt = opts.prompt || buildPrompt(nodeId, nodeName);
    recordIntent(nodeId, nodeName, prompt, opts.source || 'make-course', opts.meta || opts);
    showModal(nodeId, nodeName, prompt);
  }

  global.TeachAnyMakeCourse = {
    buildPrompt: buildPrompt,
    open: open,
    close: closeModal,
    recordIntent: recordIntent
  };

  global.generateCourseware = function (nodeId, nodeName) {
    var meta = {};
    try {
      var node = global.PBLPathBuilder && global.PBLPathBuilder.unifiedIndex
        ? global.PBLPathBuilder.unifiedIndex.get(nodeId) : null;
      if (node) {
        meta.subject = node.subject || '';
        meta.grade = node.gradeLabel != null ? node.gradeLabel : node.grade;
      }
    } catch (_e) { /* ignore */ }
    open({ nodeId: nodeId, nodeName: nodeName, source: 'pbl', meta: meta });
  };
})(window);
