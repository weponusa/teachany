/*! TeachAny Standard AI Tutor Card · v1.0
 * --------------------------------------------------
 * 用法：
 *   <link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">
 *   <div data-teachany-tutor-card></div>
 *   <script src="../../scripts/teachany-tutor-card.js" defer></script>
 *
 * 作用：在课件中显式嵌入一张「AI 学伴」入口卡片，
 *      点击卡片任意位置都会唤起 ai-tutor.js 创建的 FAB 面板。
 *      避免学生看不到左下角悬浮球的情况。
 */
(function () {
  "use strict";
  if (window.__TeachAnyTutorCardInit) return;
  window.__TeachAnyTutorCardInit = true;

  function buildCard(el) {
    var subjectName = (window.__TEACHANY_TUTOR_CONFIG__ && window.__TEACHANY_TUTOR_CONFIG__.title) ||
      document.title.split("·")[0].trim() || "本课";

    el.classList.add("ttc-root");
    el.innerHTML =
      '<div class="ttc-card">' +
        '<div class="ttc-icon">💡</div>' +
        '<div class="ttc-body">' +
          '<h3 class="ttc-title">AI 学伴 · 关于「' + subjectName + '」随时问</h3>' +
          '<p class="ttc-desc">点击下方按钮唤起 AI 学伴对话面板。' +
            '它已加载本课的课标、核心知识点、易错点，能针对你的具体困惑给定制化解释。' +
            '免费模型一键切换，也支持你自己的 API Key。</p>' +
          '<div class="ttc-actions">' +
            '<button class="ttc-btn-primary" type="button">💬 立即提问</button>' +
            '<button class="ttc-btn-ghost" type="button" data-action="config">⚙ 配置 API</button>' +
            '<span class="ttc-hint">FAB 入口：左下角 💡</span>' +
          '</div>' +
          '<ul class="ttc-suggest">' +
            '<li>这节课最关键的一句话是什么？</li>' +
            '<li>我做错了课件中的练习，能帮我看看吗？</li>' +
            '<li>这个知识点和上一节的关系是什么？</li>' +
            '<li>用一个生活例子解释一下。</li>' +
          '</ul>' +
        '</div>' +
      '</div>';

    function openTutor(prefill) {
      var fab = document.querySelector(".ai-tutor-fab");
      if (fab) {
        fab.click();
        if (prefill) {
          setTimeout(function () {
            var input = document.querySelector(".ai-tutor-panel textarea");
            if (input) {
              input.value = prefill;
              input.focus();
            }
          }, 350);
        }
      } else {
        // 兜底：滚到 footer 提示
        alert("AI 学伴脚本未加载，请确认课件引用了 ../../scripts/ai-tutor.js");
      }
    }

    el.querySelector(".ttc-btn-primary").addEventListener("click", function () { openTutor(); });
    el.querySelector("[data-action=config]").addEventListener("click", function () {
      // 触发 ai-tutor 的配置弹窗：先点 FAB 再点齿轮
      openTutor();
      setTimeout(function () {
        var cfgBtn = document.querySelector(".ai-tutor-panel .btn-config");
        if (cfgBtn) cfgBtn.click();
      }, 400);
    });
    el.querySelectorAll(".ttc-suggest li").forEach(function (li) {
      li.addEventListener("click", function () { openTutor(li.textContent); });
    });
  }

  function init() {
    document.querySelectorAll("[data-teachany-tutor-card]").forEach(buildCard);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
