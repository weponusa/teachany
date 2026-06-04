/**
 * TeachAny static-site data loader: local ./data → teachany.cn → teachany-courseware CDN.
 * GitHub Pages (weponusa.github.io/teachany) 不含 data/trees，依赖本模块回退。
 */
(function () {
  const DATA_BASES = [
    () => new URL('./data/', location.href).href,
    'https://www.teachany.cn/data/',
    'https://cdn.jsdelivr.net/gh/weponusa/teachany-courseware@main/data/',
    'https://raw.githubusercontent.com/weponusa/teachany-courseware/main/data/'
  ];

  const SITE_BASES = [
    () => new URL('./', location.href).href,
    'https://www.teachany.cn/',
    'https://cdn.jsdelivr.net/gh/weponusa/teachany-courseware@main/',
    'https://raw.githubusercontent.com/weponusa/teachany-courseware/main/'
  ];

  function withCacheBust(url) {
    return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
  }

  async function tryFetchJson(url) {
    try {
      const resp = await fetch(withCacheBust(url), { cache: 'no-store' });
      if (resp.ok) return await resp.json();
    } catch (_e) { /* try next base */ }
    return null;
  }

  function normalizeDataRel(path) {
    return String(path).replace(/^\.\/data\//, '').replace(/^data\//, '');
  }

  function normalizeSiteRel(path) {
    return String(path).replace(/^\.\//, '');
  }

  async function fetchDataJson(relativePath) {
    const rel = normalizeDataRel(relativePath);
    for (const base of DATA_BASES) {
      const root = typeof base === 'function' ? base() : base;
      const url = root.endsWith('/') ? root + rel : root + '/' + rel;
      const data = await tryFetchJson(url);
      if (data != null) {
        console.log('[TeachAnyData] loaded data/' + rel + ' from ' + root);
        return data;
      }
    }
    throw new Error('[TeachAnyData] 无法加载 data/' + rel + '（本地与 CDN 均失败）');
  }

  async function fetchSiteJson(relativePath) {
    const rel = normalizeSiteRel(relativePath);
    for (const base of SITE_BASES) {
      const root = typeof base === 'function' ? base() : base;
      const url = root.endsWith('/') ? root + rel : root + '/' + rel;
      const data = await tryFetchJson(url);
      if (data != null) {
        console.log('[TeachAnyData] loaded ' + rel + ' from ' + root);
        return data;
      }
    }
    throw new Error('[TeachAnyData] 无法加载 ' + rel);
  }

  /** Resolve tree JSON path like ./data/trees/cn/middle/math.json */
  async function fetchTreeJson(treePath) {
    const rel = normalizeDataRel(treePath);
    return fetchDataJson(rel);
  }

  window.TeachAnyDataFetch = {
    fetchDataJson,
    fetchSiteJson,
    fetchTreeJson,
    DATA_BASES,
    SITE_BASES
  };
})();
