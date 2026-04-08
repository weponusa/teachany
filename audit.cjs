#!/usr/bin/env node
/**
 * TeachAny 数据完整性审计脚本
 * 检查所有 domain 的 _graph.json, _errors.json, _exercises.json
 * 验证：文件存在性、JSON格式、ID唯一性、引用一致性
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

/**
 * 归一化列表数据：兼容数组顶层 [...] 和对象包裹 { key: [...] } 两种格式
 */
function normalizeItems(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload[key])) {
    return payload[key];
  }
  return null;
}

let totalErrors = 0;
let totalWarnings = 0;
let domainCount = 0;
let totalNodes = 0;
let totalErrorItems = 0;
let totalExercises = 0;

const subjects = fs.readdirSync(DATA_DIR).filter(f => {
  const fp = path.join(DATA_DIR, f);
  return fs.statSync(fp).isDirectory() && !f.startsWith('.');
});

for (const subject of subjects) {
  const subjectDir = path.join(DATA_DIR, subject);
  const domains = fs.readdirSync(subjectDir).filter(f => {
    const fp = path.join(subjectDir, f);
    return fs.statSync(fp).isDirectory() && !f.startsWith('.');
  });

  for (const domain of domains) {
    domainCount++;
    const domainDir = path.join(subjectDir, domain);
    const domainLabel = `${subject}/${domain}`;

    // 1. Check _graph.json
    const graphFile = path.join(domainDir, '_graph.json');
    if (!fs.existsSync(graphFile)) {
      console.error(`❌ [${domainLabel}] 缺少 _graph.json`);
      totalErrors++;
      continue;
    }

    let graph;
    try {
      graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
    } catch (e) {
      console.error(`❌ [${domainLabel}] _graph.json JSON格式错误: ${e.message}`);
      totalErrors++;
      continue;
    }

    const nodeIds = new Set();
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
      console.error(`❌ [${domainLabel}] _graph.json 缺少 nodes 数组`);
      totalErrors++;
      continue;
    }
    for (const node of graph.nodes) {
      if (!node.id) {
        console.error(`❌ [${domainLabel}] _graph.json 节点缺少 id`);
        totalErrors++;
      } else {
        nodeIds.add(node.id);
      }
    }
    totalNodes += nodeIds.size;

    // 2. Check _errors.json
    const errorsFile = path.join(domainDir, '_errors.json');
    if (!fs.existsSync(errorsFile)) {
      console.error(`❌ [${domainLabel}] 缺少 _errors.json`);
      totalErrors++;
      continue;
    }

    let errors;
    try {
      errors = JSON.parse(fs.readFileSync(errorsFile, 'utf8'));
    } catch (e) {
      console.error(`❌ [${domainLabel}] _errors.json JSON格式错误: ${e.message}`);
      totalErrors++;
      continue;
    }

    errors = normalizeItems(errors, 'errors');
    if (!errors) {
      console.error(`❌ [${domainLabel}] _errors.json 应为数组，或包含 errors 数组字段`);
      totalErrors++;
      continue;
    }

    const errorIds = new Set();
    const errorNodeCoverage = new Set();
    for (const err of errors) {
      if (!err.id) {
        console.error(`❌ [${domainLabel}] _errors.json 条目缺少 id`);
        totalErrors++;
      } else if (errorIds.has(err.id)) {
        console.error(`❌ [${domainLabel}] _errors.json 重复 id: ${err.id}`);
        totalErrors++;
      } else {
        errorIds.add(err.id);
      }

      if (!err.node_id) {
        console.error(`❌ [${domainLabel}] _errors.json 条目 ${err.id} 缺少 node_id`);
        totalErrors++;
      } else if (!nodeIds.has(err.node_id)) {
        console.error(`❌ [${domainLabel}] _errors.json 条目 ${err.id} 引用了不存在的 node_id: ${err.node_id}`);
        totalErrors++;
      } else {
        errorNodeCoverage.add(err.node_id);
      }

      // Check required fields
      const requiredFields = ['type', 'description', 'wrong_answer', 'correct_answer', 'diagnosis', 'frequency', 'trigger'];
      for (const field of requiredFields) {
        if (!err[field]) {
          console.warn(`⚠️  [${domainLabel}] _errors.json 条目 ${err.id} 缺少字段: ${field}`);
          totalWarnings++;
        }
      }
    }
    totalErrorItems += errors.length;

    // 3. Check _exercises.json
    const exercisesFile = path.join(domainDir, '_exercises.json');
    if (!fs.existsSync(exercisesFile)) {
      console.error(`❌ [${domainLabel}] 缺少 _exercises.json`);
      totalErrors++;
      continue;
    }

    let exercises;
    try {
      exercises = JSON.parse(fs.readFileSync(exercisesFile, 'utf8'));
    } catch (e) {
      console.error(`❌ [${domainLabel}] _exercises.json JSON格式错误: ${e.message}`);
      totalErrors++;
      continue;
    }

    exercises = normalizeItems(exercises, 'exercises');
    if (!exercises) {
      console.error(`❌ [${domainLabel}] _exercises.json 应为数组，或包含 exercises 数组字段`);
      totalErrors++;
      continue;
    }

    const exerciseIds = new Set();
    const exerciseNodeCoverage = new Set();
    for (const ex of exercises) {
      if (!ex.id) {
        console.error(`❌ [${domainLabel}] _exercises.json 条目缺少 id`);
        totalErrors++;
      } else if (exerciseIds.has(ex.id)) {
        console.error(`❌ [${domainLabel}] _exercises.json 重复 id: ${ex.id}`);
        totalErrors++;
      } else {
        exerciseIds.add(ex.id);
      }

      if (!ex.node_id) {
        console.error(`❌ [${domainLabel}] _exercises.json 条目 ${ex.id} 缺少 node_id`);
        totalErrors++;
      } else if (!nodeIds.has(ex.node_id)) {
        console.error(`❌ [${domainLabel}] _exercises.json 条目 ${ex.id} 引用了不存在的 node_id: ${ex.node_id}`);
        totalErrors++;
      } else {
        exerciseNodeCoverage.add(ex.node_id);
      }

      // Check error_id references in options
      if (ex.options && Array.isArray(ex.options)) {
        for (const opt of ex.options) {
          if (opt.error_id && !errorIds.has(opt.error_id)) {
            console.error(`❌ [${domainLabel}] _exercises.json 条目 ${ex.id} 选项 ${opt.label} 引用了不存在的 error_id: ${opt.error_id}`);
            totalErrors++;
          }
        }
      }

      // Check required fields
      const requiredFields = ['bloom_level', 'difficulty', 'type', 'stem', 'options', 'feedback_correct'];
      for (const field of requiredFields) {
        if (!ex[field]) {
          console.warn(`⚠️  [${domainLabel}] _exercises.json 条目 ${ex.id} 缺少字段: ${field}`);
          totalWarnings++;
        }
      }
    }
    totalExercises += exercises.length;

    // 4. Node coverage check
    const uncoveredByErrors = [...nodeIds].filter(n => !errorNodeCoverage.has(n));
    if (uncoveredByErrors.length > 0) {
      console.warn(`⚠️  [${domainLabel}] 以下节点没有对应的错因条目: ${uncoveredByErrors.join(', ')}`);
      totalWarnings++;
    }

    const uncoveredByExercises = [...nodeIds].filter(n => !exerciseNodeCoverage.has(n));
    if (uncoveredByExercises.length > 0) {
      console.warn(`⚠️  [${domainLabel}] 以下节点没有对应的习题: ${uncoveredByExercises.join(', ')}`);
      totalWarnings++;
    }

    // Domain passed
    if (uncoveredByErrors.length === 0 && uncoveredByExercises.length === 0) {
      console.log(`✅ [${domainLabel}] 通过 — ${nodeIds.size}节点, ${errors.length}错因, ${exercises.length}习题`);
    } else {
      console.log(`🟡 [${domainLabel}] 部分覆盖 — ${nodeIds.size}节点, ${errors.length}错因, ${exercises.length}习题`);
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 审计汇总');
console.log('='.repeat(60));
console.log(`Domain 总数: ${domainCount}`);
console.log(`知识节点总数: ${totalNodes}`);
console.log(`错因条目总数: ${totalErrorItems}`);
console.log(`习题条目总数: ${totalExercises}`);
console.log(`错误数: ${totalErrors}`);
console.log(`警告数: ${totalWarnings}`);
console.log('='.repeat(60));

if (totalErrors === 0) {
  console.log('🎉 全部通过！所有文件结构完整，引用关系一致。');
} else {
  console.log(`⛔ 发现 ${totalErrors} 个错误，请修复后重新验证。`);
  process.exit(1);
}
