#!/usr/bin/env node
/**
 * PBL 原型层自测 — 本地候选检索 + 可选线上 match 校验
 * Usage: node scripts/pbl-self-test.mjs [--live]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LIVE = process.argv.includes('--live');
const API = 'https://www.teachany.cn/api/pbl/analyze';

const CASES = [
  {
    id: 'water-rocket',
    goal: '设计一款水火箭',
    archetypeId: 'water-rocket',
    forbidNames: [/100以内|人物描写|诗词|电解池|原电池|细胞|电流的测量|电学实验/],
    requireSubjects: ['physics'],
    minGrade: 7,
  },
  {
    id: 'canteen-soup',
    goal: '食堂菜汤的盐含量测定',
    archetypeId: 'mixed-solution-chemistry',
    forbidNames: [/100以内|20以内|认识图形|分数的初步|数据的描述|百分数$|电解池|气体摩尔体积/],
    requireSubjects: ['chemistry'],
    minGrade: 8,
  },
  {
    id: 'car-cost',
    goal: '探究新能源汽车与传统燃油汽车的成本效益分析',
    archetypeId: 'consumer-decision',
    forbidNames: [/人物描写|性格分析|诗词|文言|记叙|电解池|原电池|细胞|光合作用/],
    requireAnyName: [/说明|统计|函数|内燃|热机|环境|排放|百分|图表|调查/],
    minGrade: 7,
  },
];

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function walkTrees(dir, system, nodes) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTrees(full, system, nodes);
    else if (ent.name.endsWith('.json') && ent.name !== '_template.json') {
      try {
        const tree = loadJson(full);
        const subject = tree.subject || 'unknown';
        for (const domain of tree.domains || []) {
          for (const n of domain.nodes || []) {
            nodes.push({
              id: n.id,
              name: n.name,
              subject,
              system,
              grade: n.grade || 0,
              definition: (n.curriculum_points || []).join(' ').slice(0, 200),
              prerequisites: n.prerequisites || [],
            });
          }
        }
      } catch (e) { /* skip */ }
    }
  }
}

function buildCnIndex() {
  const nodes = [];
  walkTrees(path.join(ROOT, 'data/trees/cn'), 'cn', nodes);
  return nodes;
}

function resolveArchetype(goal, archetypeData) {
  const g = goal.trim();
  for (const a of archetypeData.archetypes) {
    if ((a.matchPatterns || []).some(p => new RegExp(p, 'i').test(g))) return a;
  }
  return null;
}

function isBanned(node, archetype) {
  const t = `${node.name} ${node.definition || ''}`;
  for (const p of archetype.banNamePatterns || []) {
    try {
      if (new RegExp(p).test(node.name) || new RegExp(p).test(t)) return true;
    } catch {
      if (node.name.includes(p)) return true;
    }
  }
  if (node.subject === 'chinese' && archetype.chineseBanPatterns?.length) {
    if (archetype.chineseBanPatterns.some(p => t.includes(p))) return true;
    if (archetype.chineseAllowPatterns?.length) {
      return !archetype.chineseAllowPatterns.some(p => t.includes(p));
    }
  }
  return false;
}

function moduleNodeOk(archetype, mod, node) {
  const t = `${node.name} ${node.definition || ''}`;
  if (archetype.id === 'mixed-solution-chemistry') {
    if (mod.id === 'conductivity' && node.subject === 'physics') return false;
    if (mod.id === 'titration' && node.subject === 'chemistry' && !/滴定|硝酸银|沉淀|物质的量|离子|摩尔/.test(t)) return false;
  }
  if (archetype.id === 'water-rocket' && mod.id === 'test' && node.subject === 'info-tech') return false;
  return true;
}

function scoreModule(node, mod, goal, archetype) {
  let s = 0;
  const t = `${node.name} ${node.definition || ''}`.toLowerCase();
  const name = node.name.toLowerCase();
  for (const h of mod.hints || []) {
    const k = h.toLowerCase();
    if (name.includes(k)) s += 8;
    else if (t.includes(k)) s += 4;
  }
  if ((mod.subjects || []).includes(node.subject)) s += 3;
  if (goal.includes('成本') && /成本|费用|统计|百分|函数/.test(t)) s += 3;
  for (const p of archetype.preferNamePatterns || []) {
    if (node.name.includes(p)) s += 6;
  }
  return s;
}

function pickByArchetype(pool, archetype, goal, max = 24) {
  const picked = [];
  const seen = new Set();
  for (const mod of archetype.modules || []) {
    const ranked = pool
      .filter(n => !seen.has(n.id))
      .filter(n => !isBanned(n, archetype))
      .filter(n => (parseInt(n.grade, 10) || 0) >= (archetype.minGrade || 1) || !n.grade)
      .filter(n => !mod.subjects?.length || mod.subjects.includes(n.subject))
      .filter(n => moduleNodeOk(archetype, mod, n))
      .map(n => ({ n, s: scoreModule(n, mod, goal, archetype) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    ranked.slice(0, mod.topK || 2).forEach(x => {
      seen.add(x.n.id);
      picked.push({ ...x.n, _module: mod.id, _score: x.s });
    });
  }
  return picked.slice(0, max);
}

async function callApi(stage, body) {
  const resp = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`HTTP ${resp.status}: ${text.slice(0, 120)}`); }
  if (!resp.ok) throw new Error(data.error || String(resp.status));
  return data.content;
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no json');
  return JSON.parse(m[0]);
}

function evaluate(caseDef, picked, archetype) {
  const issues = [];
  const names = picked.map(n => n.name);
  for (const re of caseDef.forbidNames || []) {
    const hit = names.filter(n => re.test(n));
    if (hit.length) issues.push(`禁止节点命中: ${hit.join('、')}`);
  }
  if (caseDef.requireSubjects) {
    const subs = new Set(picked.map(n => n.subject));
    for (const s of caseDef.requireSubjects) {
      if (!subs.has(s)) issues.push(`缺少学科: ${s}`);
    }
  }
  if (caseDef.requireAnyName) {
    const ok = names.some(n => caseDef.requireAnyName.some(re => re.test(n)));
    if (!ok) issues.push('缺少预期关键词节点');
  }
  const lowGrade = picked.filter(n => (parseInt(n.grade, 10) || 0) > 0 && (parseInt(n.grade, 10) || 0) < caseDef.minGrade);
  if (lowGrade.length) issues.push(`学段过低: ${lowGrade.map(n => n.name).join('、')}`);
  if (picked.length < (archetype.minMatched || 4)) issues.push(`节点过少: ${picked.length}`);
  return issues;
}

async function liveMatch(caseDef, candidates, archetype) {
  const candidateList = candidates.map((n, i) =>
    `[${i}] ${n.name} | G${n.grade || '?'} | ${n.subject} | cn`
  ).join('\n');
  const content = await callApi('match', {
    goal: caseDef.goal,
    candidates: candidates.map(n => ({
      name: n.name, grade: n.grade, subject: n.subject, systemTag: 'CN',
      definition: n.definition, prerequisiteNames: [],
    })),
    complex: true,
    maxMatched: archetype.maxMatched || 12,
    minConf: 0.55,
    archetypeId: archetype.id,
    projectBlueprint: {
      deliverable: '测试交付物',
      schemes: [{ id: 'A', name: 'A', phases: archetype.modules.map(m => ({
        phase: m.label, subsystemIds: [m.id], knowledgeHints: m.hints,
        steps: [`完成${m.label}任务`], deliverable: m.label,
      })) }],
      recommendedSchemeId: 'A',
    },
  });
  const result = extractJson(content);
  const matched = (result.matched || []).map(m => {
    const idx = m.index ?? m.nodeIndex;
    return candidates[idx];
  }).filter(Boolean);
  return matched.map(n => n.name);
}

async function main() {
  const archetypeData = loadJson(path.join(ROOT, 'data/pbl/archetypes.json'));
  const registry = loadJson(path.join(ROOT, 'data/pbl/engineering-registry.json'));
  const allNodes = buildCnIndex();
  console.log(`CN 索引: ${allNodes.length} 节点\n`);

  let failCount = 0;
  for (const c of CASES) {
    const archetype = resolveArchetype(c.goal, archetypeData);
    if (!archetype || archetype.id !== c.archetypeId) {
      console.log(`❌ ${c.id}: 原型解析错误 got ${archetype?.id}`);
      failCount++;
      continue;
    }
    const pool = allNodes.filter(n => {
      if (archetype.subjects?.length && !archetype.subjects.includes(n.subject)) return false;
      if ((parseInt(n.grade, 10) || 0) > 0 && (parseInt(n.grade, 10) || 0) < archetype.minGrade) return false;
      return !isBanned(n, archetype);
    });
    const picked = pickByArchetype(pool, archetype, c.goal);
    const issues = evaluate(c, picked, archetype);
    const ext = (registry.entries || []).filter(e => e.archetypes?.includes(archetype.id));

    console.log(`── ${c.id} ──`);
    console.log(`  原型: ${archetype.label}`);
    console.log(`  本地检索: ${picked.map(n => `${n.name}(${n.subject},G${n.grade})`).join(' | ')}`);
    console.log(`  课外: ${ext.slice(0, 3).map(e => e.name).join(' | ')}`);

    if (LIVE && picked.length >= 4) {
      try {
        console.log('  (线上 match 请求中，约 60–120s…)');
        const liveNames = await liveMatch(c, picked, archetype);
        console.log(`  线上match: ${liveNames.join(' | ')}`);
        for (const re of c.forbidNames || []) {
          const hit = liveNames.filter(n => re.test(n));
          if (hit.length) issues.push(`线上禁止命中: ${hit.join('、')}`);
        }
      } catch (e) {
        issues.push(`线上match失败: ${e.message}`);
      }
    }

    if (issues.length) {
      console.log(`  ❌ ${issues.join('; ')}`);
      failCount++;
    } else {
      console.log('  ✅ 通过');
    }
    console.log('');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
