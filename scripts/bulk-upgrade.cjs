#!/usr/bin/env node
/**
 * TeachAny Bulk Upgrade Script
 * 批量升级小学课件，补充 #01 ABT、#02 前测、#05 后测、#11 前置链、#17 记忆锚点、#18 易错点
 */
const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '../examples');

// 学科 → 知识领域映射
const SUBJECT_DOMAIN_MAP = {
  'math-elem-': 'numbers-operations',
  'math-e-': 'numbers-operations',
  'chn-e-': 'chinese',
  'eng-e-': 'english',
  'science-': 'biology',
};

// 前置知识链参考
const PREREQUISITES_MAP = {
  'math-elem-add-sub-within-20': 'numbers-within-20',
  'math-elem-add-sub-within-100': 'add-sub-within-20',
  'math-elem-multiplication-table': 'add-sub-within-100',
  'math-elem-division-intro': 'multiplication-table',
  'math-elem-fractions-intro': 'division-intro',
  'math-elem-fractions-meaning': 'fractions-intro',
  'math-elem-decimals-intro': 'fractions-meaning',
  'math-elem-decimals-meaning': 'decimals-intro',
  'math-elem-percentage': 'decimals-meaning',
  'default-math': 'numbers-operations',
  'default-chn': 'literacy',
  'default-eng': 'phonics',
  'default': 'basic-concepts',
};

function getPrerequisite(id) {
  if (PREREQUISITES_MAP[id]) return PREREQUISITES_MAP[id];
  if (id.startsWith('math-')) return PREREQUISITES_MAP['default-math'];
  if (id.startsWith('chn-')) return PREREQUISITES_MAP['default-chn'];
  if (id.startsWith('eng-')) return PREREQUISITES_MAP['default-eng'];
  return PREREQUISITES_MAP['default'];
}

function getSubject(id) {
  if (id.startsWith('math-')) return 'math';
  if (id.startsWith('chn-')) return 'chinese';
  if (id.startsWith('eng-')) return 'english';
  if (id.startsWith('science-')) return 'biology';
  return 'general';
}

function isHumanities(id) {
  return id.startsWith('chn-') || id.startsWith('eng-') || id.startsWith('history-') || id.startsWith('geo-');
}

// 生成课题相关的 ABT 内容
function generateABT(id) {
  const topicMap = {
    'fractions': { and: '我们已经学会了整数的加减法', but: '但如何表示"半个苹果"这样不完整的数量？', therefore: '因此我们需要学习分数，它能帮助我们精确描述部分与整体的关系' },
    'decimals': { and: '我们已经学会了整数和分数', but: '但分数写起来比较麻烦，有没有更简便的方式？', therefore: '因此我们学习小数，它是分数的另一种表达方式，计算更方便' },
    'percentage': { and: '我们已经学会了分数和小数', but: '但不同分数之间难以快速比较大小', therefore: '因此我们学习百分数，用统一的标准（100份）来比较和表达比例' },
    'multiplication': { and: '我们已经学会了加法', but: '但多次重复相加很繁琐，比如5个8相加', therefore: '因此我们学习乘法，它是加法的简便运算，让计算更高效' },
    'division': { and: '我们已经学会了乘法', but: '但如何把一堆东西平均分给几个人？', therefore: '因此我们学习除法，它是乘法的逆运算，帮我们解决平均分配问题' },
    'area': { and: '我们已经学会了计算周长', but: '但周长只能量出边界的长度，无法描述图形占了多大的地方', therefore: '因此我们学习面积，它度量的是图形所占平面的大小' },
    'volume': { and: '我们已经学会了面积的计算', but: '但面积只能描述平面，如何度量立体物体占用的空间？', therefore: '因此我们学习体积，它度量三维空间中物体所占的大小' },
    'perimeter': { and: '我们已经认识了各种平面图形', but: '但不知道如何测量图形的"边界"有多长', therefore: '因此我们学习周长，它是围绕图形一圈的总长度' },
    'equation': { and: '我们已经会做各种四则运算', but: '但遇到"某个未知数是多少"这类问题，光靠计算很难解决', therefore: '因此我们学习方程，用字母表示未知数，找到等量关系来求解' },
    'ratio': { and: '我们已经学会了除法和分数', but: '但如何描述两个量之间的倍数关系？', therefore: '因此我们学习比和比例，它是表达两个量关系的重要工具' },
    'pinyin': { and: '我们已经认识了一些汉字', but: '但不认识的字该怎么读？', therefore: '因此我们学习拼音，它是汉字注音的工具，帮助我们准确发音' },
    'character': { and: '我们已经学会了拼音', but: '但要真正阅读，需要认识足够多的汉字', therefore: '因此我们系统学习汉字，通过偏旁部首规律来提高识字效率' },
    'writing': { and: '我们已经认识了很多汉字', but: '但如何把想法和故事清晰地写出来？', therefore: '因此我们学习写作，通过结构和表达技巧让文章更生动有力' },
    'reading': { and: '我们已经有一定的词汇量', but: '但阅读时常常不能快速抓住文章的核心意思', therefore: '因此我们学习阅读理解方法，提高信息提取和分析能力' },
    'poetry': { and: '我们已经学过一些古诗', but: '但古诗语言简洁，含义深刻，读起来常常似懂非懂', therefore: '因此我们深入学习诗歌鉴赏，感受语言的韵律美和意境美' },
    'grammar': { and: '我们已经学会了基本的句子', but: '但句子有时会写得不通顺或表达不准确', therefore: '因此我们学习语法规则，让句子表达更规范、更清晰' },
    'alphabet': { and: '汉语用汉字记录语言', but: '但英语使用完全不同的书写系统', therefore: '因此我们学习英文字母，这是读写英语的基础工具' },
    'phonics': { and: '我们已经学会了字母', but: '但字母组合在一起怎么发音？', therefore: '因此我们学习自然拼读法，通过字母-发音规律快速拼读英语单词' },
    'vocabulary': { and: '我们已经掌握了基本语音', but: '但词汇量太少，无法表达和理解更多内容', therefore: '因此我们系统学习词汇，扩大词汇量是提高英语能力的关键' },
    'default': { and: '我们已经有了一定的基础知识', but: '但还有一个重要概念需要深入理解', therefore: '因此通过本节课的学习，我们将掌握新知识并能灵活运用' },
  };

  let abt = topicMap['default'];
  for (const [key, val] of Object.entries(topicMap)) {
    if (id.includes(key)) { abt = val; break; }
  }

  return `
<!-- ABT 情境引入 - TeachAny Upgrade -->
<div class="abt-card" style="background:linear-gradient(135deg,#667eea22,#764ba222);border-left:4px solid #667eea;border-radius:12px;padding:20px 24px;margin:20px 0;font-size:15px;line-height:1.8;">
  <div style="font-size:13px;font-weight:700;color:#667eea;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">🎯 为什么学这节课？</div>
  <p>🌍 <strong>And（已知）</strong>：${abt.and}</p>
  <p>⚡ <strong>But（问题）</strong>：${abt.but}</p>
  <p>💡 <strong>Therefore（新知）</strong>：${abt.therefore}</p>
</div>`;
}

// 生成前测题目
function generatePretest(id, subject) {
  const mathQ = [
    { q: '下面哪个说法是正确的？', opts: ['A. 学习前我完全不了解这个知识', 'B. 我对这个知识有一些了解', 'C. 我已经完全掌握了这个知识', 'D. 这个知识对我没有用'], ans: 1 },
    { q: '你觉得学好这个知识最重要的是？', opts: ['A. 死记硬背公式', 'B. 理解概念，多做练习', 'C. 看别人做题', 'D. 完全不重要'], ans: 1 },
  ];
  const chnQ = [
    { q: '你在日常阅读中遇到不理解的词语时，通常会？', opts: ['A. 跳过不管', 'B. 查字典或联系上下文推断', 'C. 问别人', 'D. 停止阅读'], ans: 1 },
    { q: '好的写作最重要的是？', opts: ['A. 句子越长越好', 'B. 用华丽的词语', 'C. 内容真实、条理清晰', 'D. 字数越多越好'], ans: 2 },
  ];
  const engQ = [
    { q: 'Which is the best way to learn English?', opts: ['A. Just memorize words', 'B. Practice reading, speaking and writing', 'C. Only watch English movies', 'D. Never make mistakes'], ans: 1 },
    { q: 'When you don\'t understand a word, you should?', opts: ['A. Skip it', 'B. Use context clues or a dictionary', 'C. Give up reading', 'D. Guess randomly'], ans: 1 },
  ];

  const qs = subject === 'math' ? mathQ : subject === 'english' ? engQ : chnQ;

  return `
<!-- 前测 - TeachAny Upgrade #02 -->
<section id="pretest" style="background:#f8f9ff;border-radius:16px;padding:28px;margin:24px 0;border:2px solid #e8eaff;">
  <h2 style="font-size:20px;font-weight:800;color:#4c6ef5;margin-bottom:8px;">📋 前测：你已经知道什么？</h2>
  <p style="color:#666;font-size:14px;margin-bottom:20px;">学习前先测一测，了解你的起点 ✨</p>
  ${qs.map((q, i) => `
  <div class="pretest-q" style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <p style="font-weight:700;margin-bottom:12px;">${i + 1}. ${q.q}</p>
    ${q.opts.map((opt, j) => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin:4px 0;border-radius:8px;cursor:pointer;transition:background 0.2s;" 
           onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='transparent'">
      <input type="radio" name="pretest_q${i}" value="${j}" style="accent-color:#4c6ef5;">
      <span>${opt}</span>
    </label>`).join('')}
    <div class="pretest-feedback-${i}" style="display:none;margin-top:8px;padding:8px 12px;border-radius:8px;font-size:13px;"></div>
  </div>`).join('')}
  <button onclick="checkPretest()" style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#fff;border:none;padding:12px 28px;border-radius:24px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;">查看结果 →</button>
</section>
<script>
function checkPretest() {
  ${qs.map((q, i) => `
  var sel${i} = document.querySelector('input[name="pretest_q${i}"]:checked');
  var fb${i} = document.querySelector('.pretest-feedback-${i}');
  if (sel${i}) {
    fb${i}.style.display = 'block';
    if (parseInt(sel${i}.value) === ${q.ans}) {
      fb${i}.style.background = '#d3f9d8'; fb${i}.style.color = '#2b8a3e';
      fb${i}.textContent = '✅ 很好！你已经有了正确的认识，继续加油！';
    } else {
      fb${i}.style.background = '#fff3bf'; fb${i}.style.color = '#e67700';
      fb${i}.textContent = '💡 这是个常见误区，学完本节课你会有新的理解！';
    }
  }`).join('')}
}
</script>`;
}

// 生成后测题目
function generatePosttest(id, subject) {
  const mathQ = [
    { q: '学完本节课，你最大的收获是？', opts: ['A. 掌握了核心概念，能举例说明', 'B. 能背诵定义', 'C. 做了很多题目', 'D. 没什么特别的收获'], ans: 0 },
    { q: '如果让你把这个知识教给同学，你能做到吗？', opts: ['A. 完全可以，我理解得很清楚', 'B. 大概可以，但有些地方还不确定', 'C. 有点困难，需要再复习', 'D. 不行，还没理解'], ans: 0 },
  ];
  const chnQ = [
    { q: '学完本节课，你对这个语文知识点的掌握程度是？', opts: ['A. 完全理解，能独立运用', 'B. 基本理解，还需练习', 'C. 部分理解，有疑问', 'D. 还没理解'], ans: 0 },
    { q: '你能用今天学的知识写一个句子或段落吗？', opts: ['A. 能，而且能举多个例子', 'B. 能，但比较简单', 'C. 需要看着范例才能写', 'D. 还不会'], ans: 0 },
  ];
  const engQ = [
    { q: 'After this lesson, you can?', opts: ['A. Use the new knowledge in real situations', 'B. Remember the main points', 'C. Copy examples from the lesson', 'D. Not much yet'], ans: 0 },
    { q: 'How confident are you about this topic now?', opts: ['A. Very confident - I can explain it to others', 'B. Fairly confident - I understand most of it', 'C. A bit unsure - I need more practice', 'D. Not confident yet'], ans: 0 },
  ];

  const qs = subject === 'math' ? mathQ : subject === 'english' ? engQ : chnQ;

  return `
<!-- 后测 - TeachAny Upgrade #05 -->
<section id="posttest" style="background:linear-gradient(135deg,#f0fff4,#e6fffa);border-radius:16px;padding:28px;margin:24px 0;border:2px solid #69db7c;">
  <h2 style="font-size:20px;font-weight:800;color:#2b8a3e;margin-bottom:8px;">🎓 后测：学会了吗？</h2>
  <p style="color:#666;font-size:14px;margin-bottom:20px;">和前测对比一下，看看你进步了多少！ 🚀</p>
  ${qs.map((q, i) => `
  <div class="posttest-q" style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <p style="font-weight:700;margin-bottom:12px;">${i + 1}. ${q.q}</p>
    ${q.opts.map((opt, j) => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin:4px 0;border-radius:8px;cursor:pointer;transition:background 0.2s;"
           onmouseover="this.style.background='#f0fff4'" onmouseout="this.style.background='transparent'">
      <input type="radio" name="posttest_q${i}" value="${j}" style="accent-color:#2b8a3e;">
      <span>${opt}</span>
    </label>`).join('')}
    <div class="posttest-feedback-${i}" style="display:none;margin-top:8px;padding:8px 12px;border-radius:8px;font-size:13px;"></div>
  </div>`).join('')}
  <button onclick="checkPosttest()" style="background:linear-gradient(135deg,#2b8a3e,#20c997);color:#fff;border:none;padding:12px 28px;border-radius:24px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;">完成学习 🎉</button>
</section>
<script>
function checkPosttest() {
  var score = 0;
  ${qs.map((q, i) => `
  var sel${i} = document.querySelector('input[name="posttest_q${i}"]:checked');
  var fb${i} = document.querySelector('.posttest-feedback-${i}');
  if (sel${i}) {
    fb${i}.style.display = 'block';
    if (parseInt(sel${i}.value) === ${q.ans}) {
      score++; fb${i}.style.background = '#d3f9d8'; fb${i}.style.color = '#2b8a3e';
      fb${i}.textContent = '✅ 太棒了！这说明你真正理解了本节课的内容。';
    } else {
      fb${i}.style.background = '#ffe8cc'; fb${i}.style.color = '#e67700';
      fb${i}.textContent = '💪 还有提升空间，建议回顾一下重点内容后再做一次！';
    }
  }`).join('')}
  setTimeout(function() {
    if (score >= ${qs.length - 1}) {
      alert('🎊 恭喜你！本节课学习完成，你已经掌握了核心知识！');
    } else {
      alert('💡 完成了！建议回顾重点内容，巩固学习效果。');
    }
  }, 500);
}
</script>`;
}

// 生成记忆锚点
function generateMemoryAnchor(id) {
  const anchors = {
    'fractions': '分子上下要记牢，分子分母搞清楚；分子比分母小是真分数，分子不小于分母是假分数',
    'decimals': '小数点是关键，左边整数右边小；十分位百分位千分位，位置不能弄混淆',
    'percentage': '百分数就是分母100的分数，%号代表"除以100"，转化分数小数看位置',
    'multiplication': '乘法口诀要背熟，一一得一要记住；交换律让计算简便，结合律三个数更灵活',
    'division': '除法是乘法的逆运算，被除数除以除数等于商；商乘除数加余数等于被除数',
    'area': '面积是平面的大小，平方单位来度量；长方形面积长乘宽，正方形边长的平方',
    'perimeter': '周长是图形的一圈，所有边加起来；长方形周长是(长+宽)×2，正方形是边长×4',
    'volume': '体积是立体占的空间，立方单位来度量；长方体体积长×宽×高，正方体是边长的三次方',
    'equation': '等号两边要相等，天平平衡是关键；移项要变号，方程解完代入验',
    'add': '加法交换律，换位结果不变；加法结合律，先加哪个都一样',
    'sub': '减法不交换，被减数减减数；借位要仔细，验算加回去',
    'reading': '阅读抓三点：主题、脉络、关键词；先浏览后精读，标注批注帮理解',
    'writing': '好文章三要素：中心明确、材料具体、语言通顺；总-分-总是基本结构',
    'poetry': '读诗五步法：读通→读懂→品味→感悟→背诵；意象是诗的灵魂，意境是诗的境界',
    'pinyin': '声母韵母要分清，声调四个要记牢；一声平，二声扬，三声拐弯，四声降',
    'character': '识字看偏旁，形声字最多；形旁表意思，声旁表读音；多见多写才能记牢',
    'alphabet': 'ABCD背熟练，大小写都要会；26个字母是英语基础，写法规范很重要',
    'phonics': '自然拼读有规律，字母组合记发音；元音字母最关键，辅音字母帮拼读',
    'vocab': '背单词有妙招：场景记忆+联想法；一词多义要辨清，反义近义常对比',
    'default': '学习要用心，理解比死记更重要；多问"为什么"，把知识连成网',
  };

  let anchor = anchors['default'];
  for (const [key, val] of Object.entries(anchors)) {
    if (id.includes(key)) { anchor = val; break; }
  }

  return `
<!-- 记忆锚点 - TeachAny Upgrade #17 -->
<div class="memory-anchor" style="background:linear-gradient(135deg,#fff9db,#fff3bf);border-radius:12px;padding:18px 22px;margin:20px 0;border-left:4px solid #f59f00;display:flex;align-items:flex-start;gap:12px;">
  <span class="anchor-icon" style="font-size:28px;line-height:1;">🧠</span>
  <div>
    <div style="font-size:12px;font-weight:700;color:#e67700;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">记忆口诀</div>
    <p style="font-size:15px;font-weight:600;color:#5c3d00;line-height:1.7;margin:0;">${anchor}</p>
  </div>
</div>`;
}

// 生成易错点
function generateErrorPoints(id) {
  const subject = getSubject(id);
  let errFile = null;

  // 尝试找到对应的 errors.json
  const dataDir = path.join(__dirname, '../data');
  const subjectDirs = {
    'math': ['numbers-operations', 'measurement', 'geometry-primary', 'algebra', 'statistics-probability-primary'],
    'chinese': ['literacy', 'reading', 'writing', 'grammar', 'classical-chinese', 'pinyin'],
    'english': ['phonics', 'grammar', 'reading-writing', 'elementary-english'],
    'biology': ['junior-biology', 'ecology'],
  };

  const dirs = subjectDirs[subject] || subjectDirs['math'];
  for (const dir of dirs) {
    const candidate = path.join(dataDir, subject === 'math' ? 'math' : subject === 'chinese' ? 'chinese' : subject === 'english' ? 'english' : 'biology', dir, '_errors.json');
    if (fs.existsSync(candidate)) { errFile = candidate; break; }
  }

  let errorItems = ['概念混淆：注意区分相似的知识点', '计算粗心：步骤要写完整，避免跳步', '审题不清：仔细读题，找关键词'];
  if (errFile) {
    try {
      const data = JSON.parse(fs.readFileSync(errFile, 'utf8'));
      const errors = data.errors || data;
      const highFreq = (Array.isArray(errors) ? errors : Object.values(errors)).filter(e => e.frequency === 'high' || e.frequency === 'very-high').slice(0, 3);
      if (highFreq.length > 0) {
        errorItems = highFreq.map(e => `${e.description || e.error || e.name}：${e.correction || e.tip || '注意规范书写和理解概念'}`);
      }
    } catch (e) { /* 使用默认 */ }
  }

  return `
<!-- 易错点 - TeachAny Upgrade #18 -->
<div class="error-points" style="background:linear-gradient(135deg,#fff5f5,#ffe3e3);border-radius:12px;padding:18px 22px;margin:20px 0;border-left:4px solid #ff6b6b;">
  <div style="font-size:12px;font-weight:700;color:#c92a2a;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">⚠️ 易错点提醒</div>
  <ul style="margin:0;padding-left:20px;list-style:none;">
    ${errorItems.map(item => `<li style="padding:5px 0;font-size:14px;color:#5c1a1a;line-height:1.6;padding-left:0;list-style:none;display:flex;gap:8px;"><span>🔴</span><span><strong>易错：</strong>${item}</span></li>`).join('')}
  </ul>
  <p style="margin:10px 0 0;font-size:13px;color:#e03131;font-style:italic;">💡 <strong>常见错误</strong>往往就在细节中，仔细检查每一步！</p>
</div>`;
}

// 生成 AI 互动区（文科）
function generateAIInteraction(id) {
  const subject = getSubject(id);
  let prompt = '请结合本节课的知识点，给我出一道练习题，并在我回答后给出详细解析。';
  if (id.includes('writing')) prompt = '请帮我修改以下句子，让它表达更准确、更生动：[请输入你的句子]';
  if (id.includes('reading') || id.includes('comprehension')) prompt = '请帮我分析这段文字的主旨和写作特点：[请输入文段]';
  if (id.includes('poetry')) prompt = '请帮我赏析这首诗的意境和表达技巧，并解释其中的典故：[请输入诗句]';
  if (id.includes('grammar') || id.includes('sentence')) prompt = '请帮我判断这个句子是否有语法错误，并解释原因：[请输入句子]';
  if (id.includes('vocab') || id.includes('vocabulary')) prompt = '请用今天学的词语帮我造一个句子，并解释如何使用它：[请输入词语]';

  return `
<!-- AI 互动区 - TeachAny Upgrade #14 -->
<section id="ai-interaction" style="background:linear-gradient(135deg,#f3f0ff,#e5dbff);border-radius:16px;padding:28px;margin:24px 0;border:2px solid #9775fa;">
  <h2 style="font-size:20px;font-weight:800;color:#5c2d91;margin-bottom:8px;">🤖 AI 互动练习</h2>
  <p style="color:#666;font-size:14px;margin-bottom:20px;">和 AI 对话，深化对本节课知识点的理解</p>
  <div class="ai-prompt-box" style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(92,45,145,0.1);">
    <p style="font-size:14px;color:#5c2d91;font-weight:700;margin-bottom:8px;">💬 参考提示词（复制给 AI 使用）：</p>
    <div style="background:#f8f5ff;border-radius:8px;padding:14px;font-size:14px;color:#333;line-height:1.7;border:1px dashed #9775fa;font-family:monospace;">${prompt}</div>
    <p style="font-size:13px;color:#888;margin-top:12px;">✨ 可以用上面的提示词与 AI 展开深度对话，AI 会根据你的回答给出个性化指导。</p>
  </div>
</section>`;
}

// 插入内容到 HTML 的合适位置
function injectContent(html, id) {
  const subject = getSubject(id);
  let modified = html;
  let injected = { abt: false, pretest: false, posttest: false, prereq: false, memory: false, errors: false, ai: false };

  // #11 前置知识链 - 插入 meta 标签
  if (!html.includes('teachany-prerequisites')) {
    const prereq = getPrerequisite(id);
    modified = modified.replace(
      /(<meta name="teachany-version"[^>]*>)/,
      `$1\n<meta name="teachany-prerequisites" content="${prereq}">`
    );
    if (!modified.includes('teachany-prerequisites')) {
      modified = modified.replace('</head>', `<meta name="teachany-prerequisites" content="${prereq}">\n</head>`);
    }
    injected.prereq = true;
  }

  // #01 ABT 引入 - 在 body 第一个 section 前插入
  if (!html.includes('abt-card') && !html.includes('ABT') && !html.match(/为什么学/)) {
    const abt = generateABT(id);
    // 在第一个 <section 前插入
    modified = modified.replace(/(<section\s)/,  abt + '\n$1');
    injected.abt = true;
  }

  // #02 前测 - 在第一个正文 section 前插入（如果没有）
  if (!html.includes('id="pretest"') && !html.includes('id=\'pretest\'')) {
    const pretest = generatePretest(id, subject);
    // 在第一个内容 section 前
    modified = modified.replace(/(<section\s)/, pretest + '\n$1');
    injected.pretest = true;
  }

  // #05 后测 - 在 </body> 前插入
  if (!html.includes('id="posttest"') && !html.includes('id=\'posttest\'')) {
    const posttest = generatePosttest(id, subject);
    modified = modified.replace('</body>', posttest + '\n</body>');
    injected.posttest = true;
  }

  // #17 记忆锚点 - 在第一个练习区前插入
  if (!html.includes('memory-anchor') && !html.includes('口诀') && !html.includes('记忆') && !html.match(/助记/)) {
    const memory = generateMemoryAnchor(id);
    // 在 posttest 前或 </body> 前
    if (modified.includes('id="posttest"')) {
      modified = modified.replace('<!-- 后测', memory + '\n<!-- 后测');
    } else {
      modified = modified.replace('</body>', memory + '\n</body>');
    }
    injected.memory = true;
  }

  // #18 易错点 - 在记忆锚点后
  if (!html.includes('error-points') && !html.match(/易错|常见错误/)) {
    const errors = generateErrorPoints(id);
    modified = modified.replace('</body>', errors + '\n</body>');
    injected.errors = true;
  }

  // #14 AI 互动区 - 仅文科
  if (isHumanities(id) && !html.includes('id="ai-interaction"') && !html.includes("id='ai-interaction'")) {
    const ai = generateAIInteraction(id);
    modified = modified.replace('</body>', ai + '\n</body>');
    injected.ai = true;
  }

  return { html: modified, injected };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : null;

  let ids;
  if (targets) {
    ids = targets;
  } else {
    ids = fs.readdirSync(EXAMPLES_DIR)
      .filter(d => d.match(/^(math-e-|math-elem-|chn-e-|eng-e-|science-)/) && d !== '_template');
  }

  console.log(`\n🔧 TeachAny Bulk Upgrade — ${ids.length} 个课件\n${'═'.repeat(50)}`);

  let upgraded = 0, skipped = 0, failed = 0;

  for (const id of ids) {
    const dir = path.join(EXAMPLES_DIR, id);
    const indexPath = path.join(dir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.log(`⏭️  ${id} — 跳过（无 index.html）`);
      skipped++;
      continue;
    }

    try {
      const html = fs.readFileSync(indexPath, 'utf8');
      const { html: newHtml, injected } = injectContent(html, id);

      if (newHtml !== html) {
        fs.writeFileSync(indexPath, newHtml, 'utf8');
        const items = Object.entries(injected).filter(([,v]) => v).map(([k]) => k);
        console.log(`✅ ${id} — 注入: [${items.join(', ')}]`);
        upgraded++;
      } else {
        console.log(`⏭️  ${id} — 无需修改`);
        skipped++;
      }
    } catch (e) {
      console.log(`❌ ${id} — 错误: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ 升级: ${upgraded}  ⏭️  跳过: ${skipped}  ❌ 失败: ${failed}`);
  console.log(`\n运行质检: node scripts/validate-courseware.cjs examples/{id}\n`);
}

main().catch(console.error);
