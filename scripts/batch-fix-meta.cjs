#!/usr/bin/env node
/**
 * 批量补充官方课件的缺失meta标签
 * 根据 courseware-registry.json 中的信息，为 index.html 补充 teachany-* meta 标签
 * 只做补充，不删除任何原有内容
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'courseware-registry.json');

// 读取注册表
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('❌ 找不到 courseware-registry.json');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  // courseware-registry.json 结构是 { version, courses: [...] }
  return data.courses || data;
}

// 获取所有官方课件目录
function getOfficialCoursewares() {
  const examplesDir = path.join(ROOT_DIR, 'examples');
  return fs.readdirSync(examplesDir)
    .filter(name => {
      const fullPath = path.join(examplesDir, name);
      return fs.statSync(fullPath).isDirectory() && name !== '_template';
    })
    .sort();
}

// 从注册表中查找课件信息
function findCoursewareInfo(registry, dirName) {
  // 尝试多种匹配方式
  const patterns = [
    dirName,
    dirName.replace(/-/g, '-'), // 保持原样
    dirName.replace(/-\w/g, m => m[0] + m[1].toUpperCase()) // 驼峰
  ];
  
  for (const id of patterns) {
    const found = registry.find(c => c.id === id || c.node_id === id);
    if (found) return found;
  }
  
  return null;
}

// 检查HTML中是否已存在某个meta标签
function hasMetaTag(html, name) {
  const regex = new RegExp(`<meta\\s+name=["']${name}["']`, 'i');
  return regex.test(html);
}

// 补充缺失的meta标签
function supplementMetaTags(html, info) {
  const metaTags = [];
  
  // 必需标签
  const requiredMetas = [
    { name: 'teachany-node', content: info.node_id || info.id },
    { name: 'teachany-subject', content: info.subject },
    { name: 'teachany-grade', content: info.grade?.toString() },
    { name: 'teachany-version', content: info.version },
  ];
  
  // 推荐标签
  const recommendedMetas = [
    { name: 'teachany-domain', content: info.domain },
    { name: 'teachany-prerequisites', content: info.prerequisites?.join(',') || '' },
    { name: 'teachany-difficulty', content: info.difficulty?.toString() },
    { name: 'teachany-author', content: info.author || 'weponusa' },
    { name: 'teachany-emoji', content: info.emoji || '' },
  ];
  
  // 检查并收集缺失的必需标签
  for (const meta of requiredMetas) {
    if (meta.content && !hasMetaTag(html, meta.name)) {
      metaTags.push(`  <meta name="${meta.name}" content="${meta.content}">`);
    }
  }
  
  // 检查并收集缺失的推荐标签
  for (const meta of recommendedMetas) {
    if (meta.content && !hasMetaTag(html, meta.name)) {
      metaTags.push(`  <meta name="${meta.name}" content="${meta.content}">`);
    }
  }
  
  if (metaTags.length === 0) {
    return { html, added: [] };
  }
  
  // 在 </head> 前插入meta标签
  const headCloseIndex = html.indexOf('</head>');
  if (headCloseIndex === -1) {
    console.warn('  ⚠️ 找不到 </head> 标签');
    return { html, added: [] };
  }
  
  const indent = '  '; // 2空格缩进
  const metaBlock = metaTags.join('\n' + indent);
  const newHtml = html.slice(0, headCloseIndex) + 
                 indent + metaBlock + '\n' + 
                 html.slice(headCloseIndex);
  
  return { html: newHtml, added: metaTags.map(m => m.match(/name="([^"]+)"/)[1]) };
}

// 主函数
function main() {
  console.log('🔧 批量补充官方课件的meta标签\n');
  console.log('='.repeat(80));
  
  const registry = loadRegistry();
  const coursewares = getOfficialCoursewares();
  
  console.log(`📚 找到 ${coursewares.length} 个官方课件\n`);
  
  let totalFixed = 0;
  const fixReport = [];
  
  for (const dirName of coursewares) {
    process.stdout.write(`检查 ${dirName}...`);
    
    const info = findCoursewareInfo(registry, dirName);
    if (!info) {
      console.log(' ⚠️ 注册表中找不到信息');
      continue;
    }
    
    const indexPath = path.join(ROOT_DIR, 'examples', dirName, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log(' ❌ 找不到 index.html');
      continue;
    }
    
    const html = fs.readFileSync(indexPath, 'utf8');
    const { html: newHtml, added } = supplementMetaTags(html, info);
    
    if (added.length === 0) {
      console.log(' ✅ meta标签完整');
    } else {
      // 备份原文件
      const backupPath = indexPath + '.bak';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(indexPath, backupPath);
      }
      
      // 写入新文件
      fs.writeFileSync(indexPath, newHtml, 'utf8');
      
      console.log(` ✅ 补充了 ${added.length} 个meta标签`);
      totalFixed++;
      fixReport.push({ dir: dirName, added });
    }
  }
  
  // 输出汇总报告
  console.log('\n' + '='.repeat(80));
  console.log(`📊 汇总报告: ${totalFixed}/${coursewares.length} 个课件需要补充\n`);
  
  if (fixReport.length > 0) {
    console.log('详细修复报告:');
    console.log('-'.repeat(80));
    for (const report of fixReport) {
      console.log(`${report.dir}:`);
      for (const meta of report.added) {
        console.log(`  + ${meta}`);
      }
      console.log('');
    }
  }
  
  console.log('='.repeat(80));
  console.log('✅ 批量修复完成！');
  console.log('💾 原文件已备份为 index.html.bak');
  console.log('🔍 请运行 validate-courseware.cjs 验证修复效果\n');
}

main();
