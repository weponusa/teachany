#!/usr/bin/env node
/**
 * 批量质检所有官方课件
 * 输出CSV格式汇总报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const CHECKS_COUNT = 18;

// 获取所有课件目录
function getCoursewareDirs() {
  const dirs = fs.readdirSync(EXAMPLES_DIR)
    .filter(name => {
      const fullPath = path.join(EXAMPLES_DIR, name);
      return fs.statSync(fullPath).isDirectory() && name !== '_template';
    })
    .sort();
  return dirs;
}

// 运行单个课件的质检
function validateCourseware(dirName) {
  const dirPath = path.join(EXAMPLES_DIR, dirName);
  const indexPath = path.join(dirPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    return { dir: dirName, exists: false, passed: 0, failed: 0, errors: ['index.html不存在'] };
  }
  
  try {
    const output = execSync(`node "${path.join(__dirname, 'validate-courseware.cjs')}" "${dirPath}"`, {
      encoding: 'utf8',
      timeout: 30000
    });
    
    // 解析输出
    const passedMatch = output.match(/总评：(\d+)\/(\d+)/);
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const total = passedMatch ? parseInt(passedMatch[2]) : CHECKS_COUNT;
    
    // 找出失败的项
    const failedItems = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const failMatch = line.match(/❌ #(\d+)\s+(.+?) —/);
      if (failMatch) {
        failedItems.push({
          id: parseInt(failMatch[1]),
          name: failMatch[2].trim()
        });
      }
    }
    
    return {
      dir: dirName,
      exists: true,
      passed,
      failed: total - passed,
      total,
      failedItems,
      hasManifest: fs.existsSync(path.join(dirPath, 'manifest.json')),
      hasEnVersion: fs.existsSync(path.join(dirPath, 'index_en.html'))
    };
  } catch (error) {
    return { dir: dirName, exists: true, passed: 0, failed: CHECKS_COUNT, errors: [error.message] };
  }
}

// 主函数
function main() {
  console.log('🔍 批量质检 TeachAny 官方课件\n');
  console.log('='.repeat(80));
  
  const dirs = getCoursewareDirs();
  console.log(`📚 找到 ${dirs.length} 个官方课件\n`);
  
  const results = [];
  for (const dir of dirs) {
    process.stdout.write(`检查 ${dir}...`);
    const result = validateCourseware(dir);
    results.push(result);
    
    if (!result.exists) {
      console.log(' ❌ index.html不存在');
    } else if (result.errors) {
      console.log(` ⚠️ 错误: ${result.errors[0]}`);
    } else {
      const passRate = Math.round(result.passed / result.total * 100);
      const icon = passRate >= 80 ? '✅' : passRate >= 60 ? '⚠️' : '❌';
      console.log(` ${icon} ${result.passed}/${result.total} (${passRate}%)`);
    }
  }
  
  // 输出汇总报告
  console.log('\n' + '='.repeat(80));
  console.log('📊 汇总报告\n');
  
  // 按通过率排序
  results.sort((a, b) => {
    if (!a.exists || a.errors) return 1;
    if (!b.exists || b.errors) return -1;
    return (b.passed / b.total) - (a.passed / a.total);
  });
  
  console.log('排名 | 课件 | 通过率 | 未通过项');
  console.log('-'.repeat(80));
  
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rank = `${i + 1}`.padStart(2);
    
    if (!r.exists) {
      console.log(`${rank}   | ${r.dir} | N/A | index.html不存在`);
      continue;
    }
    
    if (r.errors) {
      console.log(`${rank}   | ${r.dir} | ERROR | ${r.errors[0]}`);
      continue;
    }
    
    const passRate = Math.round(r.passed / r.total * 100);
    const failedNames = r.failedItems.map(item => `#${item.id}`).join(', ');
    const manifestIcon = r.hasManifest ? '📦' : '';
    const enIcon = r.hasEnVersion ? '🌐' : '';
    
    console.log(`${rank}   | ${r.dir} ${manifestIcon}${enIcon} | ${passRate}% (${r.passed}/${r.total}) | ${failedNames}`);
  }
  
  // 统计共性问题
  console.log('\n' + '='.repeat(80));
  console.log('📈 共性问题分析\n');
  
  const problemCount = {};
  for (const r of results) {
    if (r.failedItems) {
      for (const item of r.failedItems) {
        if (!problemCount[item.id]) {
          problemCount[item.id] = { name: item.name, count: 0, courses: [] };
        }
        problemCount[item.id].count++;
        problemCount[item.id].courses.push(r.dir);
      }
    }
  }
  
  const sortedProblems = Object.entries(problemCount)
    .sort((a, b) => b[1].count - a[1].count);
  
  console.log('问题ID | 问题名称 | 受影响课件数');
  console.log('-'.repeat(80));
  for (const [id, info] of sortedProblems) {
    console.log(`#${id.padStart(2, '0')} | ${info.name} | ${info.count}`);
  }
  
  // 输出JSON格式结果（方便程序读取）
  const jsonPath = path.join(__dirname, '..', 'validation-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 详细报告已保存至: ${jsonPath}`);
  
  // 统计
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalChecks = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const avgPassRate = totalChecks > 0 ? Math.round(totalPassed / totalChecks * 100) : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 总体统计: ${results.length} 个课件, 平均通过率 ${avgPassRate}%`);
  console.log('='.repeat(80) + '\n');
}

main();
