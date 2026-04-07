#!/usr/bin/env node
/**
 * TeachAny 课件打包工具
 * 将课件目录打包为 .teachany 文件（标准 ZIP 格式）
 *
 * 用法：
 *   node scripts/pack-courseware.js <课件目录路径> [输出目录]
 *
 * 示例：
 *   node scripts/pack-courseware.js ./examples/math-linear-function
 *   node scripts/pack-courseware.js ./examples/math-linear-function ./dist
 *
 * 功能：
 *   1. 若目录中无 manifest.json，自动从 index.html 的 <meta> 标签提取元信息生成
 *   2. 将目录内容打包为 .teachany（ZIP）文件
 *   3. 验证必填字段和文件完整性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 学科映射表 ─────────────────────────────
const SUBJECT_MAP = {
  math: { name: '数学', emoji: '📐' },
  physics: { name: '物理', emoji: '⚡' },
  chemistry: { name: '化学', emoji: '🧪' },
  biology: { name: '生物', emoji: '🧬' },
  geography: { name: '地理', emoji: '🌍' },
  history: { name: '历史', emoji: '📜' },
  chinese: { name: '语文', emoji: '📖' },
  english: { name: '英语', emoji: '🌐' },
  it: { name: '信息技术', emoji: '💻' },
};

// ── 从 HTML 提取 meta 标签 ──────────────────
function extractMeta(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const meta = {};

  // 提取 teachany-* meta 标签
  const metaRegex = /<meta\s+name="teachany-([^"]+)"\s+content="([^"]*)"/gi;
  let m;
  while ((m = metaRegex.exec(html)) !== null) {
    meta[m[1]] = m[2];
  }

  // 提取 title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    // 取 · 前面的部分作为课件名
    meta.title = titleMatch[1].split('·')[0].trim();
  }

  // 提取 course-* meta 标签（向后兼容）
  const courseRegex = /<meta\s+name="course-([^"]+)"\s+content="([^"]*)"/gi;
  while ((m = courseRegex.exec(html)) !== null) {
    if (!meta[m[1]]) meta[m[1]] = m[2];
  }

  return meta;
}

// ── 生成 manifest.json ─────────────────────
function generateManifest(dir, meta) {
  const subject = meta.subject || 'math';
  const subjectInfo = SUBJECT_MAP[subject] || { name: subject, emoji: '📚' };

  const manifest = {
    name: meta.title || meta.node || path.basename(dir),
    name_en: '',
    subject: subject,
    grade: parseInt(meta.grade) || 8,
    author: meta.author || 'unknown',
    version: meta.version || '1.0.0',

    node_id: meta.node || '',
    domain: meta.domain || '',
    prerequisites: meta.prerequisites ? meta.prerequisites.split(',').map(s => s.trim()) : [],

    description: '',
    description_en: '',
    emoji: subjectInfo.emoji,
    tags: [subjectInfo.name, `Grade ${meta.grade || '?'}`],
    difficulty: parseInt(meta.difficulty) || 3,
    duration: '',
    lines: '',

    theories: [],
    interactions: [],

    created: new Date().toISOString().slice(0, 10),
    license: 'MIT',
    teachany_spec: '1.0',
  };

  // 尝试从 README.md 提取描述
  const readmePath = path.join(dir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    // 取第一段非标题文本
    const lines = readme.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length > 0) {
      manifest.description = lines[0].trim().slice(0, 200);
    }
  }

  // 尝试统计行数
  const indexPath = path.join(dir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const lineCount = fs.readFileSync(indexPath, 'utf-8').split('\n').length;
    manifest.lines = (Math.floor(lineCount / 100) * 100) + '+';
  }

  return manifest;
}

// ── 验证 manifest ──────────────────────────
function validateManifest(manifest) {
  const errors = [];
  if (!manifest.name) errors.push('缺少 name（课件名称）');
  if (!manifest.subject) errors.push('缺少 subject（学科）');
  if (!SUBJECT_MAP[manifest.subject]) errors.push(`未知学科 ID: ${manifest.subject}`);
  if (!manifest.grade || manifest.grade < 1 || manifest.grade > 12) {
    errors.push('grade 必须在 1-12 范围');
  }
  return errors;
}

// ── 主流程 ─────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
📦 TeachAny 课件打包工具

用法：
  node scripts/pack-courseware.js <课件目录> [输出目录]

示例：
  node scripts/pack-courseware.js ./examples/math-linear-function
  node scripts/pack-courseware.js ./examples/math-linear-function ./dist
    `);
    process.exit(0);
  }

  const inputDir = path.resolve(args[0]);
  const outputDir = args[1] ? path.resolve(args[1]) : path.dirname(inputDir);

  // 检查输入目录
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ 目录不存在: ${inputDir}`);
    process.exit(1);
  }

  // 检查 index.html
  const indexPath = path.join(inputDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ 缺少 index.html，不是有效的课件目录');
    process.exit(1);
  }

  console.log(`📂 课件目录: ${inputDir}`);

  // 处理 manifest.json
  let manifestPath = path.join(inputDir, 'manifest.json');
  let manifest;
  let manifestGenerated = false;

  if (fs.existsSync(manifestPath)) {
    console.log('✅ 发现 manifest.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } else {
    console.log('⚠️  未发现 manifest.json，从 index.html meta 标签自动生成...');
    const meta = extractMeta(indexPath);
    manifest = generateManifest(inputDir, meta);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('✅ 已生成 manifest.json');
    manifestGenerated = true;
  }

  // 验证
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    console.error('❌ manifest.json 验证失败:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  // 确定输出文件名
  const dirName = path.basename(inputDir);
  const outputPath = path.join(outputDir, `${dirName}.teachany`);

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 打包为 ZIP
  console.log(`📦 打包中...`);

  // 收集要打包的文件
  const filesToPack = [];
  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  for (const entry of entries) {
    // 跳过隐藏文件和 node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    filesToPack.push(entry.name);
  }

  // 使用系统 zip 命令
  try {
    // 删除旧文件
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    const fileList = filesToPack.join(' ');
    execSync(`cd "${inputDir}" && zip -r "${outputPath}" ${fileList}`, {
      stdio: 'pipe',
    });

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    // 检查大小限制
    if (stats.size > 50 * 1024 * 1024) {
      console.warn(`⚠️  包体积 ${sizeMB}MB 超过 50MB 限制，部分平台可能拒绝导入`);
    }

    console.log('');
    console.log(`✅ 打包完成!`);
    console.log(`   📦 ${outputPath}`);
    console.log(`   📏 大小: ${sizeMB} MB`);
    console.log(`   📝 课件: ${manifest.name}`);
    console.log(`   📚 学科: ${SUBJECT_MAP[manifest.subject]?.name || manifest.subject}`);
    console.log(`   🎓 年级: ${manifest.grade}`);
    if (manifest.node_id) {
      console.log(`   🌳 节点: ${manifest.node_id}`);
    }
  } catch (err) {
    console.error('❌ 打包失败:', err.message);
    console.log('\n提示: 确保系统已安装 zip 命令');
    console.log('  macOS: 默认已安装');
    console.log('  Ubuntu: sudo apt install zip');
    console.log('  Windows: 请使用 WSL 或安装 zip');
    process.exit(1);
  }

  // 如果是自动生成的 manifest，提示用户补充信息
  if (manifestGenerated) {
    console.log('');
    console.log('💡 manifest.json 已自动生成，建议补充以下信息:');
    console.log('   - name_en（英文名）');
    console.log('   - description / description_en（描述）');
    console.log('   - duration（预计时长）');
    console.log('   - theories（教学理论）');
    console.log('   - interactions（互动类型）');
  }
}

main();
