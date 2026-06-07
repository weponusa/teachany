/**
 * PBL 项目原型层 — 结构化拆解、分模块检索、课标外注册表
 * 与 data/pbl/archetypes.json + engineering-registry.json 同步
 */
(function (global) {
  const CACHE_KEY = 'teachany_pbl_archetypes_v1';

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
      this._loadPromise = null;
    }

    async load(basePath = './data/pbl/') {
      if (this.archetypeData && this.registryData) return this;
      if (this._loadPromise) return this._loadPromise;
      this._loadPromise = this._doLoad(basePath);
      return this._loadPromise;
    }

    async _doLoad(basePath) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, archetypes, registry } = JSON.parse(cached);
          if (Date.now() - ts < 3600000) {
            this.archetypeData = archetypes;
            this.registryData = registry;
            return this;
          }
        }
      } catch (e) { /* ignore */ }

      const [aRes, rRes] = await Promise.all([
        fetch(`${basePath}archetypes.json`),
        fetch(`${basePath}engineering-registry.json`),
      ]);
      if (!aRes.ok || !rRes.ok) throw new Error('PBL archetype data load failed');
      this.archetypeData = await aRes.json();
      this.registryData = await rRes.json();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(),
          archetypes: this.archetypeData,
          registry: this.registryData,
        }));
      } catch (e) { /* ignore */ }
      return this;
    }

    resolve(goal, blueprint, classifyFn, chemistryProfileFn) {
      const g = norm(goal);
      const list = this.archetypeData?.archetypes || [];
      for (const a of list) {
        if ((a.matchPatterns || []).some(p => new RegExp(p, 'i').test(g))) return a;
      }
      if (chemistryProfileFn && chemistryProfileFn(g)?.mixed) {
        return list.find(x => x.id === 'mixed-solution-chemistry') || null;
      }
      const type = classifyFn ? classifyFn(g) : 'general';
      const fb = this.archetypeData?.typeFallback?.[type];
      if (fb) return list.find(x => x.id === fb) || null;
      return null;
    }

    isBanned(node, archetype) {
      if (!archetype || !node) return false;
      const name = norm(node.name);
      const t = textOf(node);
      for (const p of archetype.banNamePatterns || []) {
        try {
          if (new RegExp(p).test(name) || new RegExp(p).test(t)) return true;
        } catch (e) {
          if (name.includes(p) || t.includes(p)) return true;
        }
      }
      if (node.subject === 'chinese') return !this._passesChinese(node, archetype);
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

    scoreForModule(node, mod, goalTerms) {
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
      return score;
    }

    pickCandidates(pool, archetype, blueprint, maxCount, goalTerms, opts = {}) {
      const { isBanned, meetsGrade, scoreForModule } = opts;
      const modules = this._modulesFor(archetype, blueprint);
      const picked = [];
      const seen = new Set();
      const prefer = archetype.preferNamePatterns || [];

      modules.forEach(mod => {
        const topK = mod.topK || 2;
        const ranked = pool
          .filter(n => !seen.has(n.id))
          .filter(n => !isBanned || !isBanned(n))
          .filter(n => !meetsGrade || meetsGrade(n))
          .filter(n => !mod.subjects?.length || mod.subjects.includes(n.subject))
          .map(n => {
            let s = scoreForModule(n, mod, goalTerms);
            prefer.forEach(p => { if (norm(n.name).includes(p)) s += 6; });
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
          .filter(x => !isBanned || !isBanned(x.n))
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
  }

  global.PBLArchetypeEngine = PBLArchetypeEngine;
})(typeof window !== 'undefined' ? window : globalThis);
