/* AI Tutor — Medieval Europe Courseware
   Context-aware hints & quick questions
   No external API calls; all logic is local */

(function() {
  'use strict';

  const QUICK_QUESTIONS = [
    { q: '为什么中世纪不是"黑暗时代"？', a: '因为中世纪有三大进步：①农业革命让粮食产量翻倍；②城市兴起催生了商业和市民阶层；③大学诞生让知识走出修道院。文艺复兴就建立在这千年的积累之上。' },
    { q: '封君封臣和中国郡县制有什么区别？', a: '最本质的区别：封君封臣的权力是世袭且分散的，国王很难收回封地；郡县制的官员由皇帝任命，不可世袭，随时可以撤换。所以欧洲四分五裂，中国大多统一。' },
    { q: '教会为什么权力那么大？', a: '三个支柱：①精神权威——教皇可以开除国王教籍（卡诺莎之辱）；②知识垄断——修道院是唯一有书的地方；③经济实力——什一税让教会成为最大的地主之一。' },
    { q: '拜占庭对欧洲有什么贡献？', a: '两大遗产：①《查士丁尼法典》系统整理了罗马法，成为欧洲大陆法系的基础；②保存了大量古希腊罗马文化典籍，西欧文化衰落时拜占庭是文化桥梁。1453年灭亡后，大量学者西迁，推动了文艺复兴。' },
    { q: '城市兴起为什么重要？', a: '城市改变了社会结构：①农奴在城里住满一年零一天就成为自由人，动摇了封建基础；②城市用金钱换取自治，"谁有钱谁说了算"取代"谁有地谁说了算"；③大学诞生让知识不再被教会独占。' },
    { q: '中世纪什么时候结束？', a: '1453年奥斯曼帝国攻陷君士坦丁堡，拜占庭帝国灭亡，这一年被普遍视为中世纪正式结束的标志。同年也是百年战争结束之年，欧洲即将进入文艺复兴和大航海时代。' }
  ];

  const panelBody = document.getElementById('aiPanelBody');
  if (!panelBody) return;

  // Render quick questions
  function renderQuickQuestions() {
    const wrapper = document.createElement('div');
    wrapper.style.marginTop = '10px';
    wrapper.innerHTML = '<div style="font-size:12px;color:#64748b;margin-bottom:6px;">快速提问：</div>';
    QUICK_QUESTIONS.forEach((item, i) => {
      const btn = document.createElement('span');
      btn.className = 'quick-q';
      btn.textContent = item.q.length > 16 ? item.q.slice(0, 16) + '...' : item.q;
      btn.title = item.q;
      btn.addEventListener('click', () => showAnswer(item.q, item.a));
      wrapper.appendChild(btn);
    });
    panelBody.appendChild(wrapper);
  }

  function showAnswer(question, answer) {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-bubble';
    qDiv.textContent = '❓ ' + question;
    panelBody.appendChild(qDiv);

    const aDiv = document.createElement('div');
    aDiv.className = 'answer-bubble';
    aDiv.textContent = '💡 ' + answer;
    panelBody.appendChild(aDiv);

    panelBody.scrollTop = panelBody.scrollHeight;
  }

  // Initialize after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderQuickQuestions);
  } else {
    renderQuickQuestions();
  }
})();
