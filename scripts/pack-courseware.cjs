#!/usr/bin/env node
/**
 * TeachAny Courseware Packer
 * Packs a courseware directory into .teachany (ZIP) format.
 * Usage: node scripts/pack-courseware.cjs <course-dir> [output-dir]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg, type = 'info') {
  const icons = { info: '📦', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type] || '📋'} ${msg}`);
}

// Parse args
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node pack-courseware.cjs <course-dir> [output-dir]');
  process.exit(1);
}

const courseDir = path.resolve(args[0]);
const outputDir = args[1] ? path.resolve(args[1]) : path.join(process.cwd(), 'dist');

// Validate course directory
if (!fs.existsSync(courseDir)) {
  log(`Course directory not found: ${courseDir}`, 'error');
  process.exit(1);
}

const indexPath = path.join(courseDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  log(`Missing index.html in ${courseDir}`, 'error');
  process.exit(1);
}
log(`Found: index.html`);

// Extract meta tags for manifest
const htmlContent = fs.readFileSync(indexPath, 'utf-8');
const metaMap = {};
const metaNames = ['teachany-node', 'teachany-subject', 'teachany-grade', 'teachany-version',
  'teachany-author', 'teachany-domain', 'teachany-difficulty', 'teachany-prerequisites'];
metaNames.forEach(name => {
  const re = new RegExp(`<meta\\s+name="${name}"[^>]*content="([^"]*)"`, 'i');
  const m = htmlContent.match(re);
  if (m) metaMap[name] = m[1];
});

log(`Metadata extracted: node=${metaMap['teachany-node'] || '?'}, subject=${metaMap['teachany-subject'] || '?'}, grade=${metaMap['teachany-grade'] || '?'}`);

// Build or read manifest.json
const manifestPath = path.join(courseDir, 'manifest.json');
let manifest;
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  log('Using existing manifest.json');
} else {
  const courseId = path.basename(courseDir);
  manifest = {
    name: courseId,
    name_en: '',
    subject: metaMap['teachany-subject'] || 'unknown',
    grade: parseInt(metaMap['teachany-grade']) || 0,
    author: metaMap['teachany-author'] || 'weponusa',
    version: metaMap['teachany-version'] || '1.0.0',
    node_id: metaMap['teachany-node'] || courseId,
    domain: metaMap['teachany-domain'] || '',
    prerequisites: (metaMap['teachany-prerequisites'] || '').split(',').filter(Boolean),
    description: '',
    emoji: '',
    tags: [],
    difficulty: parseInt(metaMap['teachany-difficulty']) || 1,
    duration: '',
    lines: '',
    theories: [],
    interactions: [],
    created: new Date().toISOString().slice(0, 10),
    license: 'MIT',
    teachany_spec: '1.0'
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log('Generated manifest.json');
}

// Ensure output dir exists
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Pack with zip
const courseId = path.basename(courseDir);
const zipPath = path.join(outputDir, `${courseId}.teachany`);

try {
  // Remove old file if exists
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Use system zip command
  execSync(`cd "${courseDir}" && zip -r "${zipPath}" . -x "*.DS_Store" "node_modules/*" ".git/*"`, {
    stdio: 'pipe'
  });

  const sizeKB = Math.round(fs.statSync(zipPath).size / 1024);
  if (sizeKB > 50 * 1024) {
    log(`Package is large: ${(sizeKB / 1024).toFixed(1)}MB`, 'warn');
  }

  log(`${courseId}.teachany packed (${sizeKB} KB) → ${zipPath}`, 'success');
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Packing complete!`);
  console.log(`   File: ${zipPath}`);
  console.log(`   Size: ${sizeKB} KB`);
  console.log(`   Version: ${manifest.version}`);
} catch (err) {
  log(`Packing failed: ${err.message}`, 'error');
  process.exit(1);
}
