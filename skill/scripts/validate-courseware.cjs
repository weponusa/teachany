#!/usr/bin/env node
/**
 * TeachAny courseware validator v7.12.1
 *
 * Usage:
 *   node scripts/validate-courseware.cjs <course-dir>
 *   node scripts/validate-courseware.cjs <course-dir> --phase2
 *
 * Scope:
 *   - --phase2: generation-time structural checks after HTML is filled, before media production/publish.
 *   - default: same checks for now; publish-time deep media checks remain in check_baseline.sh / courseware repo validators.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const courseDirArg = args.find((arg) => !arg.startsWith('--')) || '.';
const courseDir = path.resolve(courseDirArg);
const phase2 = args.includes('--phase2');
const htmlPath = path.join(courseDir, 'index.html');
const manifestPath = path.join(courseDir, 'manifest.json');

const errors = [];
const warnings = [];
const passes = [];

function pass(message) { passes.push(message); }
function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function count(re, text) { return (text.match(re) || []).length; }
function has(re, text) { return re.test(text); }
function meta(html, name) {
  const direct = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  if (direct) return direct[1].trim();
  const reverse = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i').exec(html);
  return reverse ? reverse[1].trim() : '';
}
function loadManifest() {
  if (!fs.existsSync(manifestPath)) return null;
  try { return JSON.parse(read(manifestPath)); }
  catch (err) { fail(`manifest.json is not valid JSON: ${err.message}`); return null; }
}
function checkRequiredHtml(html) {
  const requiredMeta = ['course-id', 'course-title', 'course-subject', 'course-grade', 'course-version', 'teachany-version', 'teachany-node', 'teachany-subject', 'teachany-grade', 'teachany-lesson-type'];
  for (const name of requiredMeta) {
    const value = meta(html, name);
    if (value && !/^\{\{.*\}\}$/.test(value)) pass(`meta ${name}`);
    else fail(`missing or unfilled meta: ${name}`);
  }

  const viewport = meta(html, 'viewport') || (/viewport-fit=cover/.test(html) ? 'viewport-fit=cover' : '');
  if (viewport.includes('viewport-fit=cover')) pass('mobile viewport-fit=cover');
  else fail('viewport must include viewport-fit=cover');

  const requiredFragments = [
    ['brand bar', /class=["'][^"']*teachany-brand-bar/],
    ['problem anchor', /id=["']problem-anchor["']/],
    ['audio playlist', /data-teachany-audio-playlist/],
    ['AI tutor card', /data-teachany-tutor-card/],
    ['knowledge graph API', /data-teachany-kg=["'][^"']+/],
    ['hero infographic section', /id=["']hero-infographic["']/],
    ['objectives section', /id=["']objectives["']/],
  ];
  for (const [label, re] of requiredFragments) {
    if (has(re, html)) pass(label);
    else fail(`missing ${label}`);
  }

  const standardCss = ['ai-tutor.css', 'teachany-tutor-card.css', 'teachany-tts-narrator.css', 'teachany-section-hints.css', 'teachany-knowledge-graph.css', 'teachany-audio-player.css'];
  const standardJs = ['ai-tutor.js', 'teachany-tutor-card.js', 'teachany-tts-narrator.js', 'teachany-section-hints.js', 'teachany-knowledge-graph.js', 'teachany-audio-player.js'];
  for (const file of standardCss) html.includes(file) ? pass(`css ${file}`) : fail(`missing standard css: ${file}`);
  for (const file of standardJs) html.includes(file) ? pass(`js ${file}`) : fail(`missing standard js: ${file}`);

  const sectionCount = count(/<section\b/gi, html);
  if (sectionCount >= 8) pass(`section count ${sectionCount}`);
  else fail(`too few sections: ${sectionCount}; expected >= 8`);

  const contentRequired = [
    ['pretest', /id=["']pretest["']|前测|Pretest/i],
    ['posttest', /id=["']posttest["']|后测|Posttest/i],
    ['interactive element', /<canvas\b|type=["']range["']|draggable|data-conceptest|data-branch=/i],
    ['diagnostic feedback', /data-diagnosis=|错因|常见错误|诊断|diagnosis/i],
    ['Bloom marker', /data-bloom-level=|Bloom|记忆|理解|应用|分析|评价|创造/i],
  ];
  for (const [label, re] of contentRequired) {
    if (has(re, html)) pass(label);
    else fail(`missing content requirement: ${label}`);
  }

  const forbidden = [
    ['browser Web Speech API in course HTML', /speechSynthesis|SpeechSynthesisUtterance/],
    ['legacy AI assistant button', /id=["']ai-assistant["']/],
    ['legacy TTS controller', /id=["']tts-controller["']/],
    ['hand-written legacy knowledge map', /knowledge-map-section|km-grid|km-node/],
    ['hand-written knowledgeGraphData object', /knowledgeGraphData\s*=/],
    ['placeholder text', /TODO|TBD|lorem ipsum|占位待填/iu],
  ];
  for (const [label, re] of forbidden) {
    if (has(re, html)) fail(`forbidden pattern: ${label}`);
    else pass(`no ${label}`);
  }

  const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  if (/\{\{[A-Z0-9_\-]+\}\}/.test(htmlWithoutComments)) fail('unfilled {{PLACEHOLDER}} remains in index.html');
  else pass('no unfilled placeholders in HTML body/head');
}
function checkManifest(html, manifest) {
  if (!manifest) { fail('manifest.json missing'); return; }
  const required = ['id', 'course_id', 'node_id', 'name', 'subject', 'grade', 'stage', 'lesson_type', 'version', 'teachany_version'];
  for (const key of required) {
    const value = manifest[key];
    if (value !== undefined && value !== null && String(value).trim() && !/^\{\{.*\}\}$/.test(String(value))) pass(`manifest ${key}`);
    else fail(`missing or unfilled manifest field: ${key}`);
  }

  const lessonTypes = new Set(['new-concept', 'review', 'experiment', 'special-topic', 'inquiry-project']);
  if (lessonTypes.has(manifest.lesson_type)) pass(`lesson_type ${manifest.lesson_type}`);
  else fail(`invalid lesson_type: ${manifest.lesson_type}`);

  const htmlCourseId = meta(html, 'course-id');
  if (htmlCourseId && manifest.course_id && htmlCourseId === manifest.course_id) pass('course-id matches manifest.course_id');
  else fail(`course-id mismatch: html=${htmlCourseId || '(missing)'} manifest=${manifest.course_id || '(missing)'}`);

  const htmlNode = meta(html, 'teachany-node');
  if (htmlNode && manifest.node_id && htmlNode === manifest.node_id) pass('teachany-node matches manifest.node_id');
  else fail(`node_id mismatch: html=${htmlNode || '(missing)'} manifest=${manifest.node_id || '(missing)'}`);

  if (Array.isArray(manifest.learning_objectives) && manifest.learning_objectives.length >= 3) pass('manifest learning_objectives >= 3');
  else warn('manifest learning_objectives should contain at least 3 items');
}

if (!fs.existsSync(courseDir)) {
  console.error(`Fatal: course directory not found: ${courseDir}`);
  process.exit(2);
}
if (!fs.existsSync(htmlPath)) {
  console.error(`Fatal: index.html not found: ${htmlPath}`);
  process.exit(2);
}

const html = read(htmlPath);
const manifest = loadManifest();
checkRequiredHtml(html);
checkManifest(html, manifest);

console.log(`TeachAny validator ${phase2 ? '--phase2' : ''}`.trim());
console.log(`Course: ${courseDir}`);
console.log(`PASS: ${passes.length}`);
for (const item of passes) console.log(`  PASS ${item}`);
if (warnings.length) {
  console.log(`WARN: ${warnings.length}`);
  for (const item of warnings) console.log(`  WARN ${item}`);
}
if (errors.length) {
  console.log(`FAIL: ${errors.length}`);
  for (const item of errors) console.log(`  FAIL ${item}`);
  process.exit(1);
}
console.log('OK: standard structure checks passed');
process.exit(0);
