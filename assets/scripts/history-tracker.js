/**
 * TeachAny History Tracker v1.0
 * ──────────────────────────────────────────────────────────
 * 统一的本地学习行为上报 SDK，把课件浏览/答题/AI 学伴/PBL 等
 * 行为标准化采集到 localStorage 的 5 个 bucket，可由 my.html
 * 集中展示与导出/导入。
 *
 * 设计要点：
 *  - 全局命名空间 window.TeachAnyHistory（幂等加载）
 *  - 5 个独立 bucket：views / quizzes / tutor_chats / pbl_runs / created
 *  - 自动监听：<meta name="teachany-courseware-id"> 触发 recordView
 *    + 停留心跳累计时长 + [data-quiz-id] 事件代理
 *  - 5MB 防爆：单 bucket 上限 500 条，超 100KB 单条直接拒写，
 *    QuotaExceededError 时自动清理最旧 bucket 重试一次
 *  - 完全 NOOP 容错：localStorage 不可用时退化为内存态，不抛错
 * ──────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // 已加载则跳过（避免多脚本注入造成重复 listener）
  if (typeof window !== 'undefined' && window.TeachAnyHistory && window.TeachAnyHistory.__loaded) {
    return;
  }

  /* ── 常量 ─────────────────────────────────────────────── */
  const VERSION = 1;
  const KEY_PREFIX = 'teachany_history_v1_';
  const BUCKETS = ['views', 'quizzes', 'tutor_chats', 'pbl_runs', 'created'];
  const MAX_ITEMS_PER_BUCKET = 500;
  const MAX_BYTES_PER_ITEM = 100 * 1024;     // 100KB
  const HEARTBEAT_INTERVAL_MS = 10 * 1000;   // 10s 心跳
  const PROGRESS_THROTTLE_MS = 5 * 1000;     // 5s 节流

  /* ── 工具：localStorage 安全读写 ─────────────────────── */
  const memoryFallback = {};

  function lsAvailable() {
    try {
      const k = '__teachany_ls_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  const HAS_LS = lsAvailable();

  function bucketKey(bucket) {
    return KEY_PREFIX + bucket;
  }

  function readBucket(bucket) {
    if (!BUCKETS.includes(bucket)) return [];
    if (!HAS_LS) return memoryFallback[bucket] || [];
    try {
      const raw = localStorage.getItem(bucketKey(bucket));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('[TeachAnyHistory] readBucket failed:', bucket, e.message);
      return [];
    }
  }

  function writeBucket(bucket, list) {
    if (!BUCKETS.includes(bucket)) return false;
    if (!Array.isArray(list)) list = [];

    // 上限淘汰：按 ts 升序丢弃最旧
    if (list.length > MAX_ITEMS_PER_BUCKET) {
      list.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      list = list.slice(list.length - MAX_ITEMS_PER_BUCKET);
    }

    if (!HAS_LS) {
      memoryFallback[bucket] = list;
      return true;
    }

    try {
      localStorage.setItem(bucketKey(bucket), JSON.stringify(list));
      return true;
    } catch (e) {
      // QuotaExceededError：清理最旧 bucket 重试一次
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        try {
          // 清理"最旧的 bucket"：选每个 bucket 最早一条记录的 ts，最早者整个 bucket 减半
          let oldestBucket = null;
          let oldestTs = Infinity;
          BUCKETS.forEach(b => {
            const arr = readBucket(b);
            if (arr.length > 0) {
              const ts = arr.reduce((m, x) => Math.min(m, x.ts || Infinity), Infinity);
              if (ts < oldestTs) {
                oldestTs = ts;
                oldestBucket = b;
              }
            }
          });
          if (oldestBucket) {
            const arr = readBucket(oldestBucket);
            arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
            const half = arr.slice(0, Math.floor(arr.length / 2));
            localStorage.setItem(bucketKey(oldestBucket), JSON.stringify(half));
          }
          localStorage.setItem(bucketKey(bucket), JSON.stringify(list));
          return true;
        } catch (e2) {
          console.warn('[TeachAnyHistory] Quota exceeded, fallback to memory:', e2.message);
          memoryFallback[bucket] = list;
          return false;
        }
      }
      console.warn('[TeachAnyHistory] writeBucket failed:', bucket, e.message);
      return false;
    }
  }

  function appendItem(bucket, item) {
    if (!item || typeof item !== 'object') return false;
    // 单条体积守门
    let size = 0;
    try { size = JSON.stringify(item).length; } catch { size = MAX_BYTES_PER_ITEM + 1; }
    if (size > MAX_BYTES_PER_ITEM) {
      console.warn('[TeachAnyHistory] item too large, refused:', bucket, size);
      return false;
    }
    const list = readBucket(bucket);
    list.push(item);
    return writeBucket(bucket, list);
  }

  function upsertByMatch(bucket, predicate, mutator) {
    const list = readBucket(bucket);
    const idx = list.findIndex(predicate);
    if (idx >= 0) {
      list[idx] = mutator(list[idx]);
    } else {
      list.push(mutator(null));
    }
    return writeBucket(bucket, list);
  }

  function shortId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function now() {
    return Date.now();
  }

  function safeText(s, max) {
    if (s == null) return '';
    const str = String(s);
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  /* ── 自动监听：恢复 meta 信息 ──────────────────────── */
  function getCoursewareMeta() {
    if (typeof document === 'undefined') return null;
    const id = (document.querySelector('meta[name="teachany-courseware-id"]') || {}).content;
    if (!id) return null;
    return {
      id: id.trim(),
      name: (document.querySelector('meta[name="teachany-courseware-name"]') || {}).content
            || document.title || id,
      subject: (document.querySelector('meta[name="teachany-subject"]') || {}).content || '',
      grade: (document.querySelector('meta[name="teachany-grade"]') || {}).content || '',
      stage: (document.querySelector('meta[name="teachany-stage"]') || {}).content || '',
      node: (document.querySelector('meta[name="teachany-node"]') || {}).content || '',
      author: (document.querySelector('meta[name="teachany-author"]') || {}).content || '',
      version: (document.querySelector('meta[name="teachany-version"]') || {}).content || '',
      url: location.href
    };
  }

  /* ── Public API ──────────────────────────────────────── */
  const api = {
    __loaded: true,
    version: VERSION,

    /* ── 读取 ────────────────────────────────────────── */
    getAll(bucket) {
      if (bucket) return readBucket(bucket);
      const out = {};
      BUCKETS.forEach(b => { out[b] = readBucket(b); });
      return out;
    },

    /* ── 1. 学习记录 ─────────────────────────────────── */
    recordView(courseId, meta) {
      if (!courseId) return false;
      meta = meta || {};
      const t = now();
      return upsertByMatch('views', x => x.courseId === courseId, prev => {
        if (prev) {
          return {
            ...prev,
            ...meta,
            courseId,
            lastVisitedAt: t,
            visitCount: (prev.visitCount || 0) + 1,
            ts: t
          };
        }
        return {
          id: shortId(),
          courseId,
          name: meta.name || '',
          subject: meta.subject || '',
          grade: meta.grade || '',
          node: meta.node || '',
          url: meta.url || '',
          firstVisitedAt: t,
          lastVisitedAt: t,
          visitCount: 1,
          dwellMs: 0,
          progress: 0,
          ts: t
        };
      });
    },

    recordProgress(courseId, percent, dwellDelta) {
      if (!courseId) return false;
      const t = now();
      const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
      return upsertByMatch('views', x => x.courseId === courseId, prev => {
        if (!prev) {
          return {
            id: shortId(),
            courseId,
            firstVisitedAt: t,
            lastVisitedAt: t,
            visitCount: 1,
            dwellMs: dwellDelta || 0,
            progress: p,
            ts: t
          };
        }
        return {
          ...prev,
          lastVisitedAt: t,
          progress: Math.max(prev.progress || 0, p),
          dwellMs: (prev.dwellMs || 0) + (dwellDelta || 0),
          ts: t
        };
      });
    },

    /* ── 2. 答题记录 ─────────────────────────────────── */
    recordQuiz(courseId, quizId, correct, payload) {
      if (!courseId || !quizId) return false;
      payload = payload || {};
      const t = now();
      return appendItem('quizzes', {
        id: shortId(),
        courseId,
        quizId: String(quizId),
        correct: !!correct,
        userAnswer: safeText(payload.userAnswer, 500),
        expected: safeText(payload.expected, 500),
        question: safeText(payload.question, 500),
        score: typeof payload.score === 'number' ? payload.score : null,
        ts: t
      });
    },

    /* ── 3. AI 学伴对话 ─────────────────────────────── */
    recordTutorChat(courseId, role, text, extra) {
      if (!courseId || !text) return false;
      const t = now();
      return appendItem('tutor_chats', {
        id: shortId(),
        courseId,
        role: role === 'user' ? 'user' : 'assistant',
        text: safeText(text, 600),
        provider: extra && extra.provider ? String(extra.provider) : '',
        model: extra && extra.model ? String(extra.model) : '',
        ts: t
      });
    },

    /* ── 4. PBL 路径分析 ─────────────────────────────── */
    recordPBL(goal, graphData, providers) {
      if (!goal || !graphData) return false;
      const techRoute = graphData.techRoute ? safeText(graphData.techRoute, 2000) : '';
      const nodes = (graphData.nodes || []).map(n => ({
        id: n.id,
        name: n.name,
        layer: n.layer,
        system: n.system,
        systemTag: n.systemTag,
        confidence: n.confidence || null,
        isExternal: !!n.isExternal
      }));
      const links = (graphData.links || []).map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        type: l.type
      }));
      const item = {
        id: shortId(),
        goal: safeText(goal, 1000),
        techRoute,
        systems: graphData.systems || [],
        nodeCount: nodes.length,
        linkCount: links.length,
        matchedCount: nodes.filter(n => n.layer === 'matched').length,
        externalCount: nodes.filter(n => n.layer === 'external').length,
        nodes,
        links,
        graphData: { nodes, links },
        provider: providers && providers.providerName ? providers.providerName : '',
        model: providers && providers.model ? providers.model : '',
        ts: now()
      };
      // 单条 PBL 可能很大，超 100KB 时砍掉 nodes/links 的细节再写
      try {
        const size = JSON.stringify(item).length;
        if (size > MAX_BYTES_PER_ITEM) {
          item.nodes = item.nodes.slice(0, 60);
          item.links = item.links.slice(0, 120);
          item.graphData = { nodes: item.nodes, links: item.links };
          item.truncated = true;
        }
        while (JSON.stringify(item).length > MAX_BYTES_PER_ITEM && item.nodes.length > 20) {
          item.nodes = item.nodes.slice(0, Math.floor(item.nodes.length * 0.75));
          item.links = item.links.filter(l => item.nodes.some(n => n.id === l.source) && item.nodes.some(n => n.id === l.target)).slice(0, Math.max(30, Math.floor(item.links.length * 0.75)));
          item.graphData = { nodes: item.nodes, links: item.links };
          item.truncated = true;
        }
      } catch {}
      return appendItem('pbl_runs', item);
    },

    /* ── 5. 制作课件 ─────────────────────────────────── */
    recordCreated(courseId, meta) {
      if (!courseId) return false;
      meta = meta || {};
      const t = now();
      const stableNode = meta.node || meta.node_id || (meta.manifest && meta.manifest.node_id) || '';
      const stableSource = meta.source || 'unknown';
      return upsertByMatch('created', x => {
        if (x.courseId === courseId) return true;
        return !!stableNode && x.node === stableNode && (x.source || 'unknown') === stableSource;
      }, prev => {
        if (prev) {
          return {
            ...prev,
            ...meta,
            courseId,
            node: stableNode || meta.node || prev.node || '',
            source: stableSource,
            createdAt: prev.createdAt || prev.ts || t,
            updatedAt: t,
            ts: t
          };
        }
        return {
          id: shortId(),
          courseId,
          name: meta.name || courseId,
          source: stableSource, // skill / pbl / import / manual
          subject: meta.subject || '',
          grade: meta.grade || '',
          node: stableNode || meta.node || '',
          url: meta.url || '',
          createdAt: t,
          updatedAt: t,
          ts: t
        };
      });
    },

    /* ── 清空 ────────────────────────────────────────── */
    clear(bucket) {
      if (bucket && BUCKETS.includes(bucket)) {
        if (HAS_LS) localStorage.removeItem(bucketKey(bucket));
        delete memoryFallback[bucket];
        return true;
      }
      if (!bucket) {
        BUCKETS.forEach(b => {
          if (HAS_LS) localStorage.removeItem(bucketKey(b));
          delete memoryFallback[b];
        });
        return true;
      }
      return false;
    },

    /* ── 导出 / 导入 ─────────────────────────────────── */
    exportAll() {
      const buckets = {};
      BUCKETS.forEach(b => { buckets[b] = readBucket(b); });
      return {
        app: 'TeachAny',
        kind: 'history-backup',
        version: VERSION,
        exportedAt: now(),
        userAgent: navigator.userAgent || '',
        buckets
      };
    },

    importAll(data, mode) {
      // mode: 'merge'（默认） | 'replace'
      mode = mode === 'replace' ? 'replace' : 'merge';
      if (!data || typeof data !== 'object' || !data.buckets) {
        throw new Error('备份格式无效：缺少 buckets 字段');
      }
      const incoming = data.buckets;
      const stats = { merge: 0, skip: 0, replace: 0 };
      BUCKETS.forEach(b => {
        const arrIn = Array.isArray(incoming[b]) ? incoming[b] : [];
        if (mode === 'replace') {
          writeBucket(b, arrIn);
          stats.replace += arrIn.length;
          return;
        }
        const cur = readBucket(b);
        const seen = new Set(cur.map(x => x.id).filter(Boolean));
        let added = 0;
        arrIn.forEach(item => {
          if (!item || !item.id) {
            cur.push({ ...item, id: shortId() });
            added++;
            return;
          }
          if (!seen.has(item.id)) {
            cur.push(item);
            seen.add(item.id);
            added++;
          } else {
            stats.skip++;
          }
        });
        writeBucket(b, cur);
        stats.merge += added;
      });
      return stats;
    },

    /* ── 统计聚合（供 my.html 直接使用） ──────────────── */
    getSummary() {
      const all = this.getAll();
      const views = all.views || [];
      const quizzes = all.quizzes || [];
      const totalQuiz = quizzes.length;
      const correct = quizzes.filter(q => q.correct).length;
      const accuracy = totalQuiz > 0 ? correct / totalQuiz : 0;

    // 连续学习天数（使用本地时区日期，避免 UTC 偏移导致 0 天）
    const toLocalYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };
    const days = new Set();
    views.forEach(v => {
      if (v.lastVisitedAt) {
        days.add(toLocalYMD(new Date(v.lastVisitedAt)));
      }
    });
    let streak = 0;
    if (days.size > 0) {
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      // 允许"今天没学但昨天学过"不算断（给 1 天缓冲），但从学过的那天开始累计
      let buffer = 1;
      while (true) {
        const d = toLocalYMD(cursor);
        if (days.has(d)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else if (buffer > 0 && streak === 0) {
          // 今日未学，允许跳过一次继续往前找
          buffer--;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

      // 本周学习时长
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartTs = weekStart.getTime();
      const weekDwell = views
        .filter(v => (v.lastVisitedAt || 0) >= weekStartTs)
        .reduce((s, v) => s + (v.dwellMs || 0), 0);

      return {
        viewedCount: views.length,
        createdCount: (all.created || []).length,
        quizCount: totalQuiz,
        correctCount: correct,
        accuracy,
        streakDays: streak,
        weekDwellMs: weekDwell,
        tutorChatCount: (all.tutor_chats || []).length,
        pblRunCount: (all.pbl_runs || []).length
      };
    }
  };

  /* ── 自动监听 ────────────────────────────────────────── */
  function bootAutoListeners() {
    if (typeof document === 'undefined') return;

    const meta = getCoursewareMeta();
    if (!meta || !meta.id) return; // 非课件页面，不启动课件级自动监听

    // 1) 进入即记录访问
    api.recordView(meta.id, meta);

    // 2) 心跳累计停留时长（仅在页面可见时）
    let lastBeat = Date.now();
    const beat = () => {
      if (document.hidden) {
        lastBeat = Date.now();
        return;
      }
      const delta = Date.now() - lastBeat;
      lastBeat = Date.now();
      if (delta > 0 && delta < HEARTBEAT_INTERVAL_MS * 3) {
        api.recordProgress(meta.id, undefined, delta);
      }
    };
    setInterval(beat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) lastBeat = Date.now();
    });
    window.addEventListener('beforeunload', beat);

    // 3) 进度估算：滚动百分比 + section 可见度（取最大值）
    let lastProgressTs = 0;
    const updateProgress = () => {
      const t = Date.now();
      if (t - lastProgressTs < PROGRESS_THROTTLE_MS) return;
      lastProgressTs = t;

      const docEl = document.documentElement;
      const total = docEl.scrollHeight - docEl.clientHeight;
      const scrolled = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;

      // section 可见度（如果课件用了 .section 或 .module-section 结构）
      const sections = document.querySelectorAll('.section, .module-section, section[data-section]');
      let visibleRatio = 0;
      if (sections.length > 0) {
        let visited = 0;
        sections.forEach(s => {
          const rect = s.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.8) visited++;
        });
        visibleRatio = Math.min(100, (visited / sections.length) * 100);
      }
      const p = Math.max(scrolled, visibleRatio);
      api.recordProgress(meta.id, p, 0);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    setTimeout(updateProgress, 1500);

    // 4) 答题事件代理：监听 [data-quiz-id] 元素的 click
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      const optEl = target.closest('[data-quiz-id]');
      if (!optEl) return;
      const quizId = optEl.getAttribute('data-quiz-id');
      const correct = optEl.getAttribute('data-correct');
      if (!quizId) return;
      // 自动模式：data-correct="true"/"false" 直接记
      if (correct === 'true' || correct === 'false') {
        api.recordQuiz(meta.id, quizId, correct === 'true', {
          userAnswer: optEl.getAttribute('data-user-answer') || optEl.textContent || '',
          expected: optEl.getAttribute('data-expected') || '',
          question: optEl.getAttribute('data-question') || ''
        });
      }
    }, true);
  }

  /* ── 暴露 ────────────────────────────────────────────── */
  if (typeof window !== 'undefined') {
    window.TeachAnyHistory = api;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootAutoListeners);
    } else {
      bootAutoListeners();
    }
  }

  console.log('[TeachAnyHistory] SDK v' + VERSION + ' loaded'
    + (HAS_LS ? '' : ' (memory fallback)'));
})();
