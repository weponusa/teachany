const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

async function main() {
  const entryPoint = path.resolve(__dirname, 'src/index.tsx');
  const outDir = path.resolve(__dirname, '../assets/video');
  const outFile = path.resolve(outDir, 'russian-revolution-main.mp4');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('📦 Bundling Remotion project...');
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log('🎬 Selecting composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'RussianRevolutionMain',
    inputProps: {},
  });

  console.log(`🚀 Rendering ${composition.durationInFrames} frames @ ${composition.fps}fps...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outFile,
    inputProps: {},
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 10 === 0) process.stdout.write(`\r  ⏳ ${pct}%`);
    },
  });

  const stat = fs.statSync(outFile);
  console.log(`\n✅ 渲染完成: ${outFile} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(e => { console.error('❌ 渲染失败:', e.message); process.exit(1); });
