#!/usr/bin/env node
/**
 * TeachAny batch renderer for Remotion compositions.
 *
 * Assumptions:
 * - Composition id 与 src/compositions/*.tsx 文件名一致
 * - 入口默认为 src/index.tsx
 * - 输出目录默认为 out/
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'compositions');
const ENTRY = process.env.TEACHANY_REMOTION_ENTRY || path.join(ROOT, 'src', 'index.tsx');
const OUT_DIR = process.env.TEACHANY_RENDER_OUT || path.join(ROOT, 'out');

function ensureExists(target, label) {
  if (!fs.existsSync(target)) {
    console.error(`❌ 缺少 ${label}: ${path.relative(ROOT, target)}`);
    process.exit(2);
  }
}

function listCompositionIds() {
  return fs.readdirSync(SRC_DIR)
    .filter((name) => /\.(tsx|jsx)$/.test(name))
    .map((name) => path.basename(name, path.extname(name)))
    .filter((name) => !name.startsWith('_'))
    .sort();
}

function renderComposition(id) {
  const outputFile = path.join(OUT_DIR, `${id}.mp4`);
  console.log(`\n🎬 渲染 ${id} -> ${path.relative(ROOT, outputFile)}`);
  const result = spawnSync('npx', ['remotion', 'render', ENTRY, id, outputFile], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`❌ 渲染失败：${id}`);
    process.exit(result.status || 1);
  }
}

function main() {
  ensureExists(SRC_DIR, 'src/compositions');
  ensureExists(ENTRY, 'Remotion 入口文件');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ids = listCompositionIds();
  if (!ids.length) {
    console.error('❌ 未找到任何 Composition 文件');
    process.exit(2);
  }

  console.log(`📦 共发现 ${ids.length} 个 Composition`);
  ids.forEach(renderComposition);
  console.log('\n🎉 全部渲染完成');
}

main();
