/**
 * PBL 项目原型层 — 结构化拆解、分模块检索、课标外注册表
 * 与 data/pbl/archetypes.json + engineering-registry.json + node-pbl-tags.json 同步
 */
(function (global) {
  const CACHE_KEY = 'teachany_pbl_archetypes_v4';

  function norm(s) {
    return String(s || '').trim();
  }

  function textOf(node) {
    return `${node.name || ''} ${node.definition || node.description || ''} ${(node.key_concepts || []).join(' ')}`;
  }

  class PBLArchetypeEngine {
    constructor() {
      this.archetypeData = null;
      this.registryData = null;
      this.tagsData = null;
      this._loadPromise = null;
    }

    async load(basePath = './data/pbl/') {
      if (this.archetypeData && this.registryData && this.tagsData) return this;
      if (this._loadPromise) return this._loadPromise;
      this._loadPromise = this._doLoad(basePath);
      return this._loadPromise;
    }

    async _doLoad(basePath) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, archetypes, registry, tags } = JSON.parse(cached);
          if (Date.now() - ts < 3600000) {
            this.archetypeData = archetypes;
            this.registryData = registry;
            this.tagsData = tags;
            return this;
          }
        }
      } catch (e) { /* ignore */ }

      const [aRes, rRes, tRes] = await Promise.all([
        fetch(`${basePath}archetypes.json`),
        fetch(`${basePath}engineering-registry.json`),
        fetch(`${basePath}node-pbl-tags.json`),
      ]);
      if (!aRes.ok || !rRes.ok) throw new Error('PBL archetype data load failed');
      this.archetypeData = await aRes.json();
      this.registryData = await rRes.json();
      this.tagsData = tRes.ok ? await tRes.json() : { globalBanNames: [], writingRules: [], elementaryBanPatterns: [] };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(),
          archetypes: this.archetypeData,
          registry: this.registryData,
          tags: this.tagsData,
        }));
      } catch (e) { /* ignore */ }
      return this;
    }

    resolve(goal, blueprint, classifyFn, chemistryProfileFn) {
      const g = norm(goal);
      const list = this.archetypeData?.archetypes || [];
      for (const a of list) {
        if (a.id === 'general-practice') continue;
        if ((a.matchPatterns || []).some(p => new RegExp(p, 'i').test(g))) return a;
      }
      if (chemistryProfileFn && chemistryProfileFn(g)?.mixed) {
        return list.find(x => x.id === 'mixed-solution-chemistry') || null;
      }
      const type = classifyFn ? classifyFn(g) : 'general';
      const fb = this.archetypeData?.typeFallback?.[type];
      if (fb) return list.find(x => x.id === fb) || null;
      return list.find(x => x.id === 'general-practice') || null;
    }

    isGloballyBanned(node) {
      const name = norm(node?.name);
      if (!name || !this.tagsData) return false;
      for (const ban of this.tagsData.globalBanNames || []) {
        if (name.includes(ban)) return true;
      }
      return false;
    }

    isElementaryBanned(node, archetype) {
      const name = norm(node?.name);
      const t = textOf(node);
      const minG = archetype?.minGrade || (archetype?.gradeBand?.[0]) || 4;
      if (minG < 4) return false;
      for (const p of this.tagsData?.elementaryBanPatterns || []) {
        if (name.includes(p) || t.includes(p)) return true;
      }
      return false;
    }

    _writingRuleHit(node, archetype) {
      const name = norm(node?.name);
      const rules = this.tagsData?.writingRules || [];
      for (const rule of rules) {
        if (!name.includes(rule.match)) continue;
        if (rule.banArchetypes?.includes(archetype?.id)) return 'ban';
        if (rule.allowArchetypes?.length && !rule.allowArchetypes.includes(archetype?.id)) return 'ban';
        if (rule.allowArchetypes?.includes(archetype?.id)) return 'allow';
      }
      return null;
    }

    isBanned(node, archetype) {
      if (!node) return false;
      if (this.isGloballyBanned(node)) return true;
      if (archetype && this.isElementaryBanned(node, archetype)) return true;

      const name = norm(node.name);
      const t = textOf(node);

      if (archetype) {
        for (const p of archetype.banNamePatterns || []) {
          try {
            if (new RegExp(p).test(name) || new RegExp(p).test(t)) return true;
          } catch (e) {
            if (name.includes(p) || t.includes(p)) return true;
          }
        }
        if (node.subject === 'chinese') {
          const wr = this._writingRuleHit(node, archetype);
          if (wr === 'ban') return true;
          if (wr !== 'allow' && !this._passesChinese(node, archetype)) return true;
        }
      } else if (node.subject === 'chinese') {
        const wr = this._writingRuleHit(node, { id: 'general-practice' });
        if (wr === 'ban') return true;
      }

      return false;
    }

    _passesChinese(node, archetype) {
      const allow = archetype.chineseAllowPatterns || [];
      const ban = archetype.chineseBanPatterns || [];
      if (!allow.length && !ban.length) return true;
      const t = textOf(node);
      if (ban.some(p => t.includes(p))) return false;
      if (allow.length) return allow.some(p => t.includes(p));
      return true;
    }

    meetsGrade(node, archetype) {
      if (!archetype) return true;
      const minG = archetype.minGrade || (archetype.gradeBand?.[0]) || 1;
      const grade = parseInt(node.grade, 10) || 0;
      if (grade > 0 && grade < minG) return false;
      const band = archetype.gradeBand;
      if (band && grade > 0) {
        if (grade < band[0] - 1 || grade > band[1] + 1) return false;
      }
      return true;
    }

    scoreForModule(node, mod, goalTerms, archetype) {
      if (!mod) return 0;
      let score = 0;
      const t = textOf(node).toLowerCase();
      const name = norm(node.name).toLowerCase();
      (mod.hints || []).forEach(h => {
        const k = String(h).toLowerCase();
        if (name.includes(k)) score += 8;
        else if (t.includes(k)) score += 4;
      });
      (goalTerms || []).forEach(term => {
        if (term.length >= 2 && (name.includes(term) || t.includes(term))) score += 2;
      });
      if ((mod.subjects || []).includes(node.subject)) score += 3;
      (archetype?.preferNamePatterns || []).forEach(p => {
        if (name.includes(String(p).toLowerCase())) score += 6;
      });
      const anchors = this.tagsData?.competencyAnchors || {};
      Object.values(anchors).flat().forEach(anchor => {
        if (name.includes(anchor)) score += 2;
      });
      return score;
    }

    _moduleNodeOk(archetype, mod, node) {
      const t = textOf(node);
      const name = norm(node.name);
      if (archetype?.id === 'mixed-solution-chemistry') {
        if (mod.id === 'conductivity' && node.subject === 'physics') return false;
        if (mod.id === 'titration' && node.subject === 'chemistry' && !/滴定|硝酸银|沉淀|物质的量|离子|摩尔/.test(t)) return false;
      }
      if (archetype?.id === 'water-rocket' && mod.id === 'test' && node.subject === 'info-tech') return false;
      if (archetype?.id === 'consumer-decision' && node.subject === 'chinese' && !this._passesChinese(node, archetype)) return false;
      if (archetype?.id === 'water-rocket' && /程序|算法|物联网/.test(name)) return false;
      if (archetype?.id === 'mixed-solution-chemistry' && mod.id === 'calc' && !/统计|概率|误差|计算|数据|方程/.test(t)) return false;
      if (archetype?.id === 'consumer-decision' && /线性规划|空间向量|立体几何|三角恒等|恒等变换|排列组合|二项式/.test(name)) return false;
      if (archetype?.id === 'humanities-writing' && /应用文|说明文|调查报告/.test(name) && !/诗|散文|小说|文学/.test(t)) return false;
      if (archetype?.id === 'application-writing' && /诗词|文言|小说|戏剧|人物描写/.test(name)) return false;
      if (archetype?.id === 'labor-practice' && /朝花夕拾|整本书阅读|文言|外国文学|机械玩具|机器人|电学实验|线性规划|三角函数/.test(name)) return false;
      return true;
    }

    pickCandidates(pool, archetype, blueprint, maxCount, goalTerms, opts = {}) {
      const { isBanned, meetsGrade, scoreForModule } = opts;
      const modules = this._modulesFor(archetype, blueprint);
      const picked = [];
      const seen = new Set();
      const prefer = archetype.preferNamePatterns || [];
      const banFn = isBanned || (n => this.isBanned(n, archetype));

      modules.forEach(mod => {
        const topK = mod.topK || 2;
        const ranked = pool
          .filter(n => !seen.has(n.id))
          .filter(n => !banFn(n))
          .filter(n => !meetsGrade || meetsGrade(n))
          .filter(n => !mod.subjects?.length || mod.subjects.includes(n.subject))
          .filter(n => this._moduleNodeOk(archetype, mod, n))
          .map(n => {
            const s = (scoreForModule || ((a, b, c) => this.scoreForModule(a, b, c, archetype)))(n, mod, goalTerms);
            return { n, s };
          })
          .filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s);
        ranked.slice(0, topK).forEach(x => {
          if (seen.has(x.n.id)) return;
          seen.add(x.n.id);
          picked.push({ ...x.n, _moduleId: mod.id, _moduleLabel: mod.label, _score: x.s });
        });
      });

      if (picked.length < (archetype.minMatched || 4)) {
        pool
          .map(n => {
            let s = 0;
            modules.forEach(m => { s = Math.max(s, scoreForModule(n, m, goalTerms)); });
            prefer.forEach(p => { if (norm(n.name).includes(p)) s += 5; });
            return { n, s };
          })
          .filter(x => x.s >= 6)
          .filter(x => !banFn(x.n))
          .filter(x => !meetsGrade || meetsGrade(x.n))
          .sort((a, b) => b.s - a.s)
          .forEach(x => {
            if (picked.length >= maxCount || seen.has(x.n.id)) return;
            seen.add(x.n.id);
            picked.push({ ...x.n, _score: x.s });
          });
      }

      return picked.slice(0, maxCount);
    }

    _modulesFor(archetype, blueprint) {
      const scheme = (blueprint?.schemes || []).find(s => s.id === blueprint?.recommendedSchemeId)
        || (blueprint?.schemes || [])[0];
      const fromBlueprint = (scheme?.phases || [])
        .map(p => p.subsystemIds?.[0])
        .filter(Boolean);
      const mods = archetype.modules || [];
      if (!fromBlueprint.length) return mods;
      const ordered = [];
      fromBlueprint.forEach(id => {
        const m = mods.find(x => x.id === id);
        if (m && !ordered.find(o => o.id === m.id)) ordered.push(m);
      });
      mods.forEach(m => { if (!ordered.find(o => o.id === m.id)) ordered.push(m); });
      return ordered;
    }

    applySystemLock(candidates, archetype, activeSystems) {
      if (!archetype?.primarySystem) return candidates;
      const primary = archetype.primarySystem;
      const ext = archetype.extensionSystems || [];
      const allowed = new Set([primary, ...ext].filter(s => !activeSystems?.length || activeSystems.includes(s)));
      const primaryNodes = candidates.filter(n => n.system === primary);
      if (primaryNodes.length >= Math.min(6, candidates.length * 0.5)) {
        return candidates.filter(n => allowed.has(n.system));
      }
      return candidates;
    }

    getRegistryExternals(archetype, blueprint, matchedNames, limit = 3) {
      if (!archetype || !this.registryData?.entries) return [];
      const modules = this._modulesFor(archetype, blueprint).map(m => m.id);
      const names = new Set((matchedNames || []).map(n => norm(n).toLowerCase()));
      const out = [];
      for (const e of this.registryData.entries) {
        if (out.length >= limit) break;
        if (!(e.archetypes || []).includes(archetype.id)) continue;
        if (e.moduleId && modules.length && !modules.includes(e.moduleId)) continue;
        if (names.has(norm(e.name).toLowerCase())) continue;
        const prereqOk = !e.prerequisites?.length || e.prerequisites.some(p =>
          [...names].some(mn => mn.includes(String(p).toLowerCase()))
        );
        out.push({
          name: e.name,
          reason: e.reason,
          moduleId: e.moduleId,
          taskSnippet: e.taskSnippet || '',
          prerequisites: e.prerequisites || [],
          _registryId: e.id,
          _prereqSoft: !prereqOk,
        });
      }
      return out;
    }

    tagMatchedModules(matched, archetype, blueprint, scoreFn) {
      const modules = this._modulesFor(archetype, blueprint);
      return matched.map(n => {
        if (n._moduleId) return n;
        let best = null;
        let bestS = 0;
        modules.forEach(m => {
          const s = scoreFn(n, m);
          if (s > bestS) { bestS = s; best = m; }
        });
        return best ? { ...n, _moduleId: best.id, _moduleLabel: best.label } : n;
      });
    }

    moduleChain(archetype, blueprint) {
      return this._modulesFor(archetype, blueprint).map(m => m.label).join(' → ');
    }

    validateBlueprint(blueprint, archetype) {
      const issues = [];
      if (!blueprint) {
        issues.push('缺少项目蓝图');
        return { valid: false, issues };
      }
      if (!blueprint.deliverable || String(blueprint.deliverable).length < 6) {
        issues.push('交付物描述过短');
      }
      const schemes = blueprint.schemes || [];
      if (!schemes.length) issues.push('缺少可行方案');
      const rec = schemes.find(s => s.id === blueprint.recommendedSchemeId) || schemes[0];
      const phases = rec?.phases || [];
      if (!phases.length) issues.push('推荐方案缺少阶段');
      const hollowRe = /^(完成|进行|开展|落实|实施|培养|提升).{0,8}(探究|调研|任务|活动|阶段)$|完成本阶段|培养.*素养/;
      let hollowCount = 0;
      phases.forEach(p => {
        (p.steps || []).forEach(st => {
          if (!st || String(st).length < 10 || hollowRe.test(String(st))) hollowCount++;
        });
      });
      if (hollowCount >= Math.max(2, phases.length)) issues.push('阶段步骤空话过多');
      if (archetype && phases.length) {
        const modIds = new Set((archetype.modules || []).map(m => m.id));
        const linked = phases.filter(p => (p.subsystemIds || []).some(id => modIds.has(id)));
        if (!linked.length && modIds.size) issues.push('阶段未对齐原型模块');
      }
      return { valid: issues.length === 0, issues };
    }
  }

  global.PBLArchetypeEngine = PBLArchetypeEngine;
})(typeof window !== 'undefined' ? window : globalThis);
