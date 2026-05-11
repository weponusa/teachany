#!/usr/bin/env node
/**
 * TeachAny Phase-2 Upgrade: 修复 meta标签、manifest、Bloom层级、五镜头
 */
const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '../examples');

// 从课件ID推断 meta 信息
function inferMeta(id) {
  let subject = 'math', grade = 3, domain = 'numbers-operations', node = id, difficulty = 2;

  if (id.startsWith('math-e-') || id.startsWith('math-elem-')) {
    subject = 'math';
    if (id.includes('elem')) {
      // 根据题目推断年级
      if (id.includes('within-20') || id.includes('within-10') || id.includes('number-recognition')) grade = 1;
      else if (id.includes('within-100') || id.includes('add-sub') || id.includes('plane-shapes')) grade = 2;
      else if (id.includes('multiplication') || id.includes('division') || id.includes('fractions-intro')) grade = 3;
      else if (id.includes('decimals') || id.includes('area') || id.includes('fractions-meaning')) grade = 4;
      else if (id.includes('fraction-operations') || id.includes('volume') || id.includes('percentage')) grade = 5;
      else if (id.includes('ratio') || id.includes('cylinder') || id.includes('negative')) grade = 6;
      else grade = 4;
    } else grade = 5;
    domain = id.includes('area') || id.includes('perimeter') || id.includes('volume') ? 'geometry-primary'
           : id.includes('fraction') || id.includes('decimal') || id.includes('percentage') ? 'numbers-operations'
           : id.includes('statistics') || id.includes('pictograph') || id.includes('line-graph') ? 'statistics-probability-primary'
           : 'numbers-operations';
    node = id.replace(/^math-e-|^math-elem-/, '');
  } else if (id.startsWith('chn-e-')) {
    subject = 'chinese'; grade = Math.ceil(Math.random() * 3) + 1; // 1-4年级
    domain = id.includes('pinyin') || id.includes('vowel') || id.includes('initials') || id.includes('tone') ? 'pinyin'
           : id.includes('char') || id.includes('radical') || id.includes('stroke') || id.includes('word') ? 'literacy'
           : id.includes('poetry') || id.includes('classical') || id.includes('tang') ? 'classical-chinese'
           : id.includes('writing') || id.includes('essay') || id.includes('narrative') || id.includes('paragraph') ? 'writing'
           : 'reading';
    node = id.replace(/^chn-e-/, '');
    grade = id.includes('pinyin') || id.includes('stroke') || id.includes('char-writing') ? 1
           : id.includes('nursery') || id.includes('simple-vowels') || id.includes('initials') ? 1
           : 3;
  } else if (id.startsWith('eng-e-')) {
    subject = 'english';
    domain = id.includes('phonics') || id.includes('alphabet') || id.includes('vowel') || id.includes('consonant') ? 'phonics'
           : id.includes('grammar') || id.includes('tense') || id.includes('noun') || id.includes('verb') || id.includes('pronoun') ? 'grammar'
           : id.includes('vocab') || id.includes('word') || id.includes('reading') ? 'reading-writing'
           : 'elementary-english';
    node = id.replace(/^eng-e-/, '');
    grade = id.includes('alphabet') || id.includes('phonics') || id.includes('greetings') || id.includes('numbers-colors') ? 3
           : id.includes('present') || id.includes('past') || id.includes('future') ? 5
           : 4;
  } else if (id.startsWith('science-')) {
    subject = 'biology'; domain = 'junior-biology'; grade = 7;
    node = id.replace(/^science-/, '');
  }

  difficulty = grade <= 2 ? 1 : grade <= 4 ? 2 : grade <= 6 ? 3 : 4;
  return { subject, grade, domain, node, difficulty };
}

// 生成 Bloom 多层级练习块
function generateBloomExercises(id, subject) {
  const isEng = id.startsWith('eng-');
  const isChn = id.startsWith('chn-');

  if (isEng) {
    return `
<!-- Bloom层级覆盖 - TeachAny Upgrade #06 -->
<div class="bloom-exercises" style="background:#f8f9ff;border-radius:16px;padding:24px;margin:20px 0;border:2px solid #748ffc;">
  <div style="font-size:12px;font-weight:700;color:#4c6ef5;margin-bottom:16px;letter-spacing:1px;">📚 BLOOM'S TAXONOMY EXERCISES</div>
  <div style="display:grid;gap:12px;">
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #51cf66;">
      <span style="font-size:11px;color:#2b8a3e;font-weight:700;">REMEMBER</span>
      <p style="margin-top:6px;font-size:14px;">Can you recall the key words or rules from this lesson?</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #339af0;">
      <span style="font-size:11px;color:#1971c2;font-weight:700;">UNDERSTAND</span>
      <p style="margin-top:6px;font-size:14px;">Explain in your own words what you learned today.</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #f59f00;">
      <span style="font-size:11px;color:#e67700;font-weight:700;">APPLY</span>
      <p style="margin-top:6px;font-size:14px;">Use today's knowledge to make a new sentence or example.</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #cc5de8;">
      <span style="font-size:11px;color:#862e9c;font-weight:700;">ANALYZE → CREATE</span>
      <p style="margin-top:6px;font-size:14px;">Compare this to something you already know. How are they similar or different? Can you create your own example?</p>
    </div>
  </div>
</div>`;
  }

  return `
<!-- Bloom层级覆盖 - TeachAny Upgrade #06 -->
<div class="bloom-exercises" style="background:#f8f9ff;border-radius:16px;padding:24px;margin:20px 0;border:2px solid #748ffc;">
  <div style="font-size:12px;font-weight:700;color:#4c6ef5;margin-bottom:16px;letter-spacing:1px;">📚 BLOOM 认知层级练习</div>
  <div style="display:grid;gap:12px;">
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #51cf66;">
      <span style="font-size:11px;color:#2b8a3e;font-weight:700;">记忆层</span>
      <p style="margin-top:6px;font-size:14px;">回忆：今天学了哪些关键词和规则？试着说出来。</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #339af0;">
      <span style="font-size:11px;color:#1971c2;font-weight:700;">理解层</span>
      <p style="margin-top:6px;font-size:14px;">用自己的话解释今天学的核心概念，不看书能说清楚吗？</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #f59f00;">
      <span style="font-size:11px;color:#e67700;font-weight:700;">应用层</span>
      <p style="margin-top:6px;font-size:14px;">用今天的知识解决一个实际问题，或写一个新例子。</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:14px;border-left:3px solid #cc5de8;">
      <span style="font-size:11px;color:#862e9c;font-weight:700;">分析→创造层</span>
      <p style="margin-top:6px;font-size:14px;">把今天的知识与已有知识联系起来：有什么共同点？有什么区别？能不能自己创造一道新题？</p>
    </div>
  </div>
</div>`;
}

// 生成五镜头深层理解
function generateFiveLens(id) {
  const isEng = id.startsWith('eng-');
  if (isEng) {
    return `
<!-- 五镜头深层理解 - TeachAny Upgrade #08 -->
<div class="five-lens insight-box" style="background:linear-gradient(135deg,#f3f0ff,#e5dbff);border-radius:16px;padding:24px;margin:20px 0;border:2px solid #9775fa;">
  <div style="font-size:12px;font-weight:700;color:#5c2d91;margin-bottom:16px;letter-spacing:1px;">🔭 FIVE LENS — DEEP UNDERSTANDING</div>
  <div style="display:grid;gap:10px;">
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🎯 Why important?</strong> <span style="color:#666;font-size:14px;">How will this help you in real life?</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🔗 Connections:</strong> <span style="color:#666;font-size:14px;">How does this connect to other things you know?</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🌍 Real world:</strong> <span style="color:#666;font-size:14px;">Where do you see this used in daily life?</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>❓ Questions:</strong> <span style="color:#666;font-size:14px;">What are you still curious about?</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>💡 Insight:</strong> <span style="color:#666;font-size:14px;">What's the most surprising thing you learned?</span></div>
  </div>
</div>`;
  }
  return `
<!-- 五镜头深层理解 - TeachAny Upgrade #08 -->
<div class="five-lens insight-box" style="background:linear-gradient(135deg,#f3f0ff,#e5dbff);border-radius:16px;padding:24px;margin:20px 0;border:2px solid #9775fa;">
  <div style="font-size:12px;font-weight:700;color:#5c2d91;margin-bottom:16px;letter-spacing:1px;">🔭 五镜头 · 深层理解</div>
  <div style="display:grid;gap:10px;">
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🎯 本质：</strong><span style="color:#666;font-size:14px;">这个知识的核心是什么？用一句话概括。</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🔗 联系：</strong><span style="color:#666;font-size:14px;">它和你已知的哪些知识有关联？</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>🌍 应用：</strong><span style="color:#666;font-size:14px;">在生活中，你在哪里见过这个知识？</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>❓ 疑问：</strong><span style="color:#666;font-size:14px;">学完之后，你还有什么不明白的地方？</span></div>
    <div style="background:#fff;border-radius:10px;padding:12px 16px;"><strong>💡 洞见：</strong><span style="color:#666;font-size:14px;">学完后，你觉得最有意思或最让你惊讶的是什么？</span></div>
  </div>
</div>`;
}

function injectPhase2(html, id) {
  const { subject, grade, domain, node, difficulty } = inferMeta(id);
  let modified = html;
  let injected = [];

  // 修复 meta 标签 - 如果 teachany-node 缺失
  if (!html.includes('teachany-node')) {
    const metaBlock = `<meta name="teachany-node" content="${node}">
<meta name="teachany-subject" content="${subject}">
<meta name="teachany-domain" content="${domain}">
<meta name="teachany-grade" content="${grade}">
<meta name="teachany-difficulty" content="${difficulty}">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">`;
    modified = modified.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + metaBlock);
    injected.push('meta');
  }

  // 补全缺失的 teachany-domain
  if (html.includes('teachany-node') && !html.includes('teachany-domain')) {
    modified = modified.replace(
      /(<meta name="teachany-node"[^>]*>)/,
      `$1\n<meta name="teachany-domain" content="${domain}">`
    );
    injected.push('domain');
  }

  // #06 Bloom 层级
  if (!html.includes('bloom-exercises') && !html.includes('Bloom') && !html.match(/分析.*创造|apply.*analyze|remember.*understand/i)) {
    const bloom = generateBloomExercises(id, subject);
    modified = modified.replace('</body>', bloom + '\n</body>');
    injected.push('bloom');
  }

  // #08 五镜头
  if (!html.includes('five-lens') && !html.includes('insight-box') && !html.match(/深层理解|五镜头|FIVE.LENS/i)) {
    const lens = generateFiveLens(id);
    modified = modified.replace('</body>', lens + '\n</body>');
    injected.push('five-lens');
  }

  // 生成 manifest.json 如果缺失
  const dir = path.join(EXAMPLES_DIR, id);
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const manifest = {
      name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      subject, grade, domain, node_id: node,
      author: 'weponusa', version: '2.0',
      difficulty, teachany_spec: '1.0',
      created: '2026-04-17', license: 'MIT'
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    injected.push('manifest');
  }

  return { html: modified, injected };
}

async function main() {
  const args = process.argv.slice(2);
  const ids = args.length > 0 ? args
    : fs.readdirSync(EXAMPLES_DIR).filter(d => d.match(/^(math-e-|math-elem-|chn-e-|eng-e-|science-)/) && d !== '_template');

  console.log(`\n🔧 TeachAny Phase-2 Upgrade — ${ids.length} 个课件\n${'═'.repeat(50)}`);
  let upgraded = 0, skipped = 0;

  for (const id of ids) {
    const indexPath = path.join(EXAMPLES_DIR, id, 'index.html');
    if (!fs.existsSync(indexPath)) { skipped++; continue; }

    const html = fs.readFileSync(indexPath, 'utf8');
    const { html: newHtml, injected } = injectPhase2(html, id);

    if (newHtml !== html || injected.includes('manifest')) {
      if (newHtml !== html) fs.writeFileSync(indexPath, newHtml, 'utf8');
      console.log(`✅ ${id} — [${injected.join(', ')}]`);
      upgraded++;
    } else {
      skipped++;
    }
  }

  console.log(`\n${'═'.repeat(50)}\n✅ 升级: ${upgraded}  ⏭️  跳过: ${skipped}\n`);
}

main().catch(console.error);
