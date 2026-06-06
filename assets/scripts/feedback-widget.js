(function(){
  if (window.TEACHANY_FEEDBACK_WIDGET_LOADED) return;
  window.TEACHANY_FEEDBACK_WIDGET_LOADED = true;
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function getMeta(name){ var el = document.querySelector('meta[name="'+name+'"]'); return el ? el.getAttribute('content') || '' : ''; }
  function encode(v){ return encodeURIComponent(v || ''); }
  function ensureViewportRoom(){
    var current = parseInt(document.body.style.paddingBottom || '0', 10) || 0;
    if (current < 76) document.body.style.paddingBottom = '76px';
  }
  ready(function(){
    if (document.querySelector('[data-teachany-feedback-widget]')) return;
    var cfg = window.TEACHANY_FEEDBACK || {};
    var courseId = cfg.course_id || cfg.courseId || getMeta('course-id') || getMeta('teachany-course-id') || getMeta('teachany-id') || location.pathname.split('/').filter(Boolean).slice(-1)[0] || '';
    var courseName = cfg.course_name || cfg.courseName || getMeta('course-title') || getMeta('teachany-title') || document.title || '';
    var nodeId = cfg.node_id || cfg.nodeId || getMeta('node-id') || getMeta('course-node-id') || getMeta('teachany-node') || '';
    var subject = cfg.subject || getMeta('course-subject') || getMeta('teachany-subject') || '';
    var grade = cfg.grade || getMeta('course-grade') || getMeta('teachany-grade') || '';
    var url = '/feedback.html?course_id=' + encode(courseId) + '&course_name=' + encode(courseName) + '&node_id=' + encode(nodeId) + '&subject=' + encode(subject) + '&grade=' + encode(grade);

    var box = document.createElement('section');
    box.setAttribute('data-teachany-feedback-widget','true');
    box.style.cssText = 'max-width:980px;margin:32px auto 28px;padding:18px 20px;border-radius:18px;border:1px solid rgba(37,99,235,.22);background:linear-gradient(135deg,#eff6ff,#ffffff);box-shadow:0 10px 30px rgba(15,23,42,.08);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#0f172a;position:relative;z-index:1;';
    box.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap"><div><div style="font-weight:900;font-size:18px">学完了吗？给老师 1 分钟反馈</div><div style="font-size:14px;color:#64748b;margin-top:4px">提交最难点、前后测得分和一句反思，帮助老师改进下一节课。</div></div><a href="'+url+'" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:800;padding:11px 18px">提交学习反馈</a></div>';
    document.body.appendChild(box);

    var floating = document.createElement('a');
    floating.setAttribute('data-teachany-feedback-float','true');
    floating.href = url;
    floating.textContent = '学习反馈';
    floating.className = 'ta-feedback-float';
    floating.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:96px;height:44px;padding:0 16px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:900;font-size:14px;box-shadow:0 12px 30px rgba(37,99,235,.35);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;position:fixed;';
    floating.setAttribute('aria-label','提交 TeachAny 学习反馈');
    document.body.appendChild(floating);
    ensureViewportRoom();
  });
})();
