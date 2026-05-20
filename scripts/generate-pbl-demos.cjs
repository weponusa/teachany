#!/usr/bin/env node
/**
 * generate-pbl-demos.js
 * 预生成 8 个 PBL 示范项目的分析结果 JSON，存入 data/pbl-demos/
 * 用户点击示范项目时直接加载，无需等待 LLM。
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-Ye5gTEaDbjlXaM2BlZGcjg';
const API_BASE = 'https://llmapi.paratera.com/v1/chat/completions';
const MODEL = 'GLM-4.5-Flash';

// ─── 8 个示范项目 ───────────────────────────────
const ALL_DEMOS = [
  { key: 'smart-home-temp', goal: '设计一个智能家居温度控制系统，利用传感器实时监测室温，自动调节空调或暖气，实现节能恒温' },
  { key: 'weather-app', goal: '制作一个天气预报App，从公开API获取气象数据，展示温度、湿度、风速，并用图表展示7天趋势' },
  { key: 'traffic-analysis', goal: '分析城市交通拥堵问题，收集高峰期车流量数据，建立拥堵模型，提出优化方案' },
  { key: 'auto-watering', goal: '设计一个自动浇花系统，通过土壤湿度传感器判断是否需要浇水，用微型水泵自动灌溉' },
  { key: 'word-memory', goal: '制作一个英文单词记忆游戏，利用间隔重复算法安排复习，追踪用户记忆曲线' },
  { key: 'water-quality', goal: '分析本地河流水质，采集pH值、溶解氧、浊度数据，评估污染程度并提出治理建议' },
  { key: 'encryption-tool', goal: '设计一个简易加密通信工具，实现凯撒密码和RSA加密，理解对称加密与非对称加密的原理' },
  { key: 'solar-system', goal: '构建一个太阳系模拟器，用物理引擎模拟行星轨道运动，展示开普勒定律和万有引力' }
];

// 只生成缺失的
const DEMOS = ALL_DEMOS.filter(d => {
  const outFile = path.join(__dirname, '..', 'data', 'pbl-demos', `${d.key}.json`);
  return !fs.existsSync(outFile);
});

// ─── 加载所有知识点索引 ─────────────────────────
function loadAllNodes() {
  const treesDir = path.join(__dirname, '..', 'data', 'trees');
  const systems = {
    cn: { label: '中国课标', tag: 'CN' },
    ap: { label: 'AP', tag: 'AP' },
    cambridge: { label: 'Cambridge', tag: 'CA' },
    ib: { label: 'IB', tag: 'IB' },
    us: { label: 'US CCSS', tag: 'US' }
  };

  const allNodes = []; // { id, name, name_en, subject, domain, grade, prerequisites, extends, parallel, system, systemTag, ... }

  for (const [sysId, sysInfo] of Object.entries(systems)) {
    const sysDir = path.join(treesDir, sysId);
    if (!fs.existsSync(sysDir)) continue;

    // 递归找所有 json
    const jsonFiles = findJsonFiles(sysDir);
    for (const jsonFile of jsonFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        const domains = data.domains || [];
        const treePath = path.relative(treesDir, jsonFile);

        domains.forEach(domain => {
          (domain.nodes || []).forEach(node => {
            allNodes.push({
              id: node.id,
              name: node.name || node.name_zh || '',
              name_en: node.name_en || '',
              subject: node.subject || data.subject || '',
              domain: domain.name || node.domain || '',
              grade: parseInt(node.grade) || 0,
              difficulty: node.difficulty || 0,
              definition: node.definition || '',
              key_concepts: node.key_concepts || [],
              prerequisites: node.prerequisites || [],
              extends: node.extends || [],
              parallel: node.parallel || [],
              curriculum_points: node.curriculum_points || [],
              system: sysId,
              systemTag: sysInfo.tag,
              systemLabel: sysInfo.label,
              treePath: sysId + '/' + path.relative(path.join(treesDir, sysId), jsonFile),
              gradeLabel: formatGradeLabel(parseInt(node.grade) || 0, sysId),
              isExternal: false
            });
          });
        });
      } catch (e) {
        console.warn(`  跳过 ${jsonFile}: ${e.message}`);
      }
    }
    console.log(`  ✅ ${sysInfo.label}: ${allNodes.filter(n => n.system === sysId).length} 节点`);
  }

  console.log(`\n📚 总计加载: ${allNodes.length} 个知识点\n`);
  return allNodes;
}

function findJsonFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (item.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function formatGradeLabel(grade, system) {
  if (!grade) return '';
  if (system === 'cn') {
    if (grade <= 6) return `小学${grade}年级`;
    if (grade <= 9) return `初中${grade - 6}年级`;
    if (grade <= 12) return `高中${grade - 9}年级`;
  }
  return `G${grade}`;
}

// ─── LLM 调用 ───────────────────────────────────
async function callLLM(messages, opts = {}) {
  const body = {
    model: MODEL,
    messages,
    max_tokens: opts.maxTokens || 4000,
    temperature: opts.temperature || 0.2
  };

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function extractJson(text) {
  // 尝试从 markdown code block 或直接 JSON 中提取
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlock) return codeBlock[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

// ─── PBL 分析逻辑（复制自 pbl-path.js 的两阶段策略） ───

async function analyzePBLGoal(goal, allNodes) {
  console.log(`  [Stage 1] 判断学科+课标...`);

  // Stage 1: 筛选学科和课标
  const subjectSummary = {};
  allNodes.forEach(n => {
    const key = `${n.system}|${n.subject}`;
    if (!subjectSummary[key]) {
      subjectSummary[key] = { system: n.system, subject: n.subject, count: 0, tag: n.systemTag };
    }
    subjectSummary[key].count++;
  });

  const summaryList = Object.values(subjectSummary)
    .sort((a, b) => b.count - a.count)
    .map(s => `${s.tag}/${s.subject}: ${s.count}个知识点`)
    .join('\n');

  const stage1Messages = [
    { role: 'system', content: '你是一个教育知识图谱专家。你需要根据PBL项目目标，判断该项目涉及的学科领域和课标体系。只返回JSON，不要其他内容。' },
    { role: 'user', content: `PBL项目目标：${goal}

可用的知识体系：
${summaryList}

请判断该项目最可能涉及的学科和课标体系，返回JSON格式：
{
  "subjects": ["math", "physics"],
  "systems": ["cn", "ap"],
  "grades": [8, 9, 10],
  "reasoning": "简要说明判断理由"
}

注意：
- subjects 用英文标识（math/physics/chemistry/biology/chinese/english/history/geography/info-tech/science）
- systems 用英文标识（cn/ap/cambridge/ib/us）
- grades 是建议的年级范围
- 最多选3个学科和3个课标体系` }
  ];

  const stage1Resp = await callLLM(stage1Messages);
  const filter = JSON.parse(extractJson(stage1Resp));
  console.log(`    学科: ${filter.subjects?.join(', ')} | 课标: ${filter.systems?.join(', ')} | 年级: ${filter.grades?.join(', ')}`);

  // 筛选候选
  const filteredCandidates = allNodes.filter(n => {
    const subjectMatch = !filter.subjects?.length || filter.subjects.includes(n.subject);
    const systemMatch = !filter.systems?.length || filter.systems.includes(n.system);
    const gradeMatch = !filter.grades?.length || filter.grades.some(g => Math.abs(n.grade - g) <= 2);
    return subjectMatch && systemMatch && gradeMatch;
  });

  const candidates = filteredCandidates.length > 0 ? filteredCandidates : allNodes.slice(0, 120);
  console.log(`    候选集: ${candidates.length} 个知识点`);

  // Stage 2: 精确匹配
  console.log(`  [Stage 2] 精确匹配知识点...`);
  const candidateList = candidates.map((n, i) => {
    return `[${i}] ${n.id} | ${n.name} | ${n.gradeLabel || 'G' + n.grade} | ${n.systemTag}/${n.subject}`;
  }).join('\n');

  const stage2Messages = [
    { role: 'system', content: '你是一个教育知识图谱专家。你需要从给定的知识点候选列表中，找出完成PBL项目所需掌握的知识点。只返回JSON，不要其他内容。' },
    { role: 'user', content: `PBL项目目标：${goal}

候选知识点列表：
${candidateList}

请找出完成该项目需要掌握的知识点，返回JSON格式：
{
  "matched": [
    {"index": 0, "confidence": 0.9, "reason": "核心概念"},
    {"index": 5, "confidence": 0.8, "reason": "基础前置"}
  ],
  "external": [
    {"name": "PID控制算法", "reason": "温控系统核心算法", "prerequisites": ["数学微积分基础", "反馈控制概念"]}
  ]
}

要求：
- matched 中的 index 对应候选列表中的序号
- confidence 范围 0-1，0.8以上为核心必需，0.5-0.8为相关参考
- 只选 confidence >= 0.5 的知识点，选 8-15 个最相关的
- external 为候选列表中没有但对项目有用的外部知识点，最多3个
- 每个外部知识点需给出 name、reason、prerequisites（前置知识名称列表）` }
  ];

  const stage2Resp = await callLLM(stage2Messages, { maxTokens: 4000, temperature: 0.2 });
  const matchResult = JSON.parse(extractJson(stage2Resp));

  // 解析匹配结果
  const matched = (matchResult.matched || [])
    .filter(m => m.confidence >= 0.5 && m.index >= 0 && m.index < candidates.length)
    .map(m => ({
      ...candidates[m.index],
      confidence: m.confidence,
      matchReason: m.reason,
      layer: 'matched'
    }));

  // 解析外部知识点
  const external = (matchResult.external || []).map((ext, i) => ({
    id: `ext-${hashStr(ext.name + i)}`,
    name: ext.name,
    name_en: '',
    subject: '',
    domain: '',
    grade: 0,
    difficulty: 0,
    definition: ext.reason,
    key_concepts: [],
    prerequisites: [],
    extends: [],
    parallel: [],
    system: 'external',
    systemTag: '💡',
    systemLabel: '外部补充',
    treePath: '',
    gradeLabel: '',
    isExternal: true,
    extPrerequisites: ext.prerequisites || [],
    confidence: 0.6,
    matchReason: ext.reason,
    layer: 'external'
  }));

  console.log(`    匹配: ${matched.length} 个 | 外部: ${external.length} 个`);

  // 构建路径图
  const graphData = buildPathGraph(matched, external, allNodes);
  console.log(`    图谱: ${graphData.nodes.length} 节点, ${graphData.links.length} 条边`);

  return {
    goal,
    systems: filter.systems || ['all'],
    matched,
    external,
    graphData,
    stats: {
      totalCandidates: allNodes.length,
      filteredCandidates: candidates.length,
      matchedCount: matched.length,
      externalCount: external.length,
      graphNodes: graphData.nodes.length,
      graphLinks: graphData.links.length
    }
  };
}

function buildPathGraph(matchedNodes, externalNodes, allNodes) {
  const nodeIndex = new Map();
  allNodes.forEach(n => nodeIndex.set(n.id, n));

  const nodes = new Map();
  const links = [];

  // 加入匹配节点
  matchedNodes.forEach(n => { nodes.set(n.id, { ...n, layer: 'matched' }); });

  // 加入外部节点
  externalNodes.forEach(n => { nodes.set(n.id, { ...n, layer: 'external' }); });

  // 追溯前置知识（2层深度）
  matchedNodes.forEach(n => {
    tracePrereqs(n.id, nodes, links, nodeIndex, 0, 3);
  });

  // 追溯扩展（1层）
  matchedNodes.forEach(n => {
    traceExtends(n.id, nodes, links, nodeIndex, 0, 1);
  });

  // 外部节点连接
  externalNodes.forEach(ext => {
    if (ext.extPrerequisites) {
      ext.extPrerequisites.forEach(preName => {
        const found = findNodeByName(preName, nodes, nodeIndex);
        if (found) {
          links.push({ source: found.id, target: ext.id, type: 'external-prereq' });
        }
      });
    }
    // 连接到最相关的匹配节点
    const related = findMostRelated(ext, matchedNodes);
    if (related) {
      links.push({ source: related.id, target: ext.id, type: 'external-related' });
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    links: deduplicateLinks(links)
  };
}

function tracePrereqs(nodeId, nodes, links, nodeIndex, depth, maxDepth) {
  if (depth >= maxDepth) return;
  const node = nodeIndex.get(nodeId);
  if (!node) return;
  (node.prerequisites || []).forEach(preId => {
    const preNode = nodeIndex.get(preId);
    if (!preNode) return;
    if (!nodes.has(preId)) {
      nodes.set(preId, { ...preNode, layer: 'prerequisite' });
    }
    links.push({ source: preId, target: nodeId, type: 'prerequisite' });
    tracePrereqs(preId, nodes, links, nodeIndex, depth + 1, maxDepth);
  });
}

function traceExtends(nodeId, nodes, links, nodeIndex, depth, maxDepth) {
  if (depth >= maxDepth) return;
  const node = nodeIndex.get(nodeId);
  if (!node) return;
  (node.extends || []).forEach(extId => {
    const extNode = nodeIndex.get(extId);
    if (!extNode) return;
    if (!nodes.has(extId)) {
      nodes.set(extId, { ...extNode, layer: 'advanced' });
    }
    links.push({ source: nodeId, target: extId, type: 'extends' });
  });
}

function findNodeByName(name, graphNodes, nodeIndex) {
  const lowerName = name.toLowerCase();
  for (const [id, node] of graphNodes) {
    if ((node.name || '').toLowerCase().includes(lowerName) || (node.name_en || '').toLowerCase().includes(lowerName)) {
      return node;
    }
  }
  for (const [id, node] of nodeIndex) {
    if ((node.name || '').toLowerCase().includes(lowerName)) {
      return node;
    }
  }
  return null;
}

function findMostRelated(extNode, matchedNodes) {
  if (!matchedNodes.length) return null;
  // 简单策略：返回置信度最高的匹配节点
  return matchedNodes.reduce((best, n) => (!best || (n.confidence || 0) > (best.confidence || 0)) ? n : best, null);
}

function deduplicateLinks(links) {
  const seen = new Set();
  return links.filter(l => {
    const key = `${l.source}→${l.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

// ─── 主流程 ─────────────────────────────────────
async function main() {
  console.log('🧩 PBL 示范项目预生成器\n');
  console.log('📂 加载知识点索引...');
  const allNodes = loadAllNodes();

  const outDir = path.join(__dirname, '..', 'data', 'pbl-demos');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (let i = 0; i < DEMOS.length; i++) {
    const demo = DEMOS[i];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`[${i + 1}/${DEMOS.length}] 🔍 ${demo.key}: ${demo.goal.slice(0, 30)}...`);

    try {
      const result = await analyzePBLGoal(demo.goal, allNodes);
      const outFile = path.join(outDir, `${demo.key}.json`);
      fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
      console.log(`  ✅ 已保存: ${outFile}`);
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
    }

    // 简单限速
    if (i < DEMOS.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log('🎉 全部完成！');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
