#!/usr/bin/env node
/**
 * TeachAny 课件安全扫描脚本 v1.0
 *
 * 对 examples/ 下的所有课件 HTML 进行静态安全分析：
 * 1. 检测外部资源加载（非白名单 CDN）
 * 2. 检测动态代码执行（eval、new Function、innerHTML 赋值等）
 * 3. 检测数据外泄（fetch、XHR、WebSocket、sendBeacon）
 * 4. 检测 Cookie/Storage 敏感访问
 * 5. 检测跟踪代码（Google Analytics、百度统计等）
 * 6. 检测加密货币挖矿脚本
 * 7. 检测外部页面跳转（非 TeachAny 内部链接）
 *
 * 用法：
 *   node security-scan.cjs                    # 扫描所有课件
 *   node security-scan.cjs --dir bio-cell-structure  # 扫描指定课件
 *   node security-scan.cjs --strict           # 严格模式（MEDIUM 也报错）
 *   node security-scan.cjs --fix              # 自动修复（注入 CSP meta 标签）
 */

const fs = require('fs');
const path = require('path');

/* ─── 配置 ──────────────────────────────────── */

const EXAMPLES_DIR = path.join(__dirname, 'examples');

// 允许的 CDN 白名单（正则）
const CDN_WHITELIST = [
  /^https:\/\/cdn\.jsdelivr\.net\//,
  /^https:\/\/cdnjs\.cloudflare\.com\//,
  /^https:\/\/unpkg\.com\//,
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/cdn\.bootcdn\.net\//,
  /^https:\/\/cdn\.staticfile\.org\//,
  /^https:\/\/cdn\.tailwindcss\.com\//,
  // TeachAny 自有资源
  /^https:\/\/raw\.githubusercontent\.com\/weponusa\/teachany\//,
  /^https:\/\/github\.com\/weponusa\/teachany\//,
  /^https:\/\/weponusa\.github\.io\/teachany\//,
];

// TeachAny 内部链接白名单（正则）
const INTERNAL_LINK_WHITELIST = [
  /^\.\.?\//,                        // 相对路径 ./ 或 ../
  /^#/,                              // 锚点链接
  /^javascript:void/,               // 无操作链接
  /^data:/,                          // data URL（内联资源）
  /^blob:/,                          // blob URL
  /^mailto:/,                        // 邮件链接（允许）
  /^https?:\/\/weponusa\.github\.io\/teachany\//,  // TeachAny GitHub Pages
  /^https?:\/\/github\.com\/weponusa\/teachany/,   // TeachAny GitHub 仓库
];

// 严重等级
const SEVERITY = {
  CRITICAL: 'CRITICAL',  // 必须修复：数据外泄、挖矿
  HIGH: 'HIGH',          // 应该修复：动态代码执行、外部资源
  MEDIUM: 'MEDIUM',      // 建议修复：跟踪代码、非必要外部链接
  INFO: 'INFO',          // 信息提示
};

const SEVERITY_EMOJI = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  INFO: '🔵',
};

/* ─── 危险模式定义 ────────────────────────────── */

const DANGEROUS_PATTERNS = [
  // ── 1. 数据外泄（CRITICAL） ──
  {
    id: 'DATA_EXFIL_FETCH',
    pattern: /\bfetch\s*\(/g,
    severity: SEVERITY.CRITICAL,
    category: '数据外泄',
    description: '检测到 fetch() 调用，可能向外部发送数据',
    exclude: /\/\/.*fetch|\/\*[\s\S]*?fetch[\s\S]*?\*\//,  // 排除注释
  },
  {
    id: 'DATA_EXFIL_XHR',
    pattern: /new\s+XMLHttpRequest|\.open\s*\(\s*['"](?:GET|POST|PUT|DELETE)/gi,
    severity: SEVERITY.CRITICAL,
    category: '数据外泄',
    description: '检测到 XMLHttpRequest，可能向外部发送数据',
  },
  {
    id: 'DATA_EXFIL_WEBSOCKET',
    pattern: /new\s+WebSocket\s*\(/g,
    severity: SEVERITY.CRITICAL,
    category: '数据外泄',
    description: '检测到 WebSocket 连接，可能建立持久外部通信',
  },
  {
    id: 'DATA_EXFIL_BEACON',
    pattern: /navigator\.sendBeacon\s*\(/g,
    severity: SEVERITY.CRITICAL,
    category: '数据外泄',
    description: '检测到 sendBeacon()，可能在页面关闭时发送数据',
  },
  {
    id: 'DATA_EXFIL_EVENTSOURCE',
    pattern: /new\s+EventSource\s*\(/g,
    severity: SEVERITY.CRITICAL,
    category: '数据外泄',
    description: '检测到 EventSource (SSE)，可能接收外部数据流',
  },

  // ── 2. 动态代码执行（HIGH） ──
  {
    id: 'EXEC_EVAL',
    pattern: /\beval\s*\(/g,
    severity: SEVERITY.HIGH,
    category: '动态代码执行',
    description: '检测到 eval()，可执行任意代码',
  },
  {
    id: 'EXEC_FUNCTION',
    pattern: /new\s+Function\s*\(/g,
    severity: SEVERITY.HIGH,
    category: '动态代码执行',
    description: '检测到 new Function()，可动态生成代码',
  },
  {
    id: 'EXEC_SETTIMEOUT_STRING',
    pattern: /setTimeout\s*\(\s*['"`]/g,
    severity: SEVERITY.HIGH,
    category: '动态代码执行',
    description: '检测到 setTimeout 传入字符串参数（等同 eval）',
  },
  {
    id: 'EXEC_SETINTERVAL_STRING',
    pattern: /setInterval\s*\(\s*['"`]/g,
    severity: SEVERITY.HIGH,
    category: '动态代码执行',
    description: '检测到 setInterval 传入字符串参数（等同 eval）',
  },
  {
    id: 'EXEC_DOCUMENT_WRITE',
    pattern: /document\.write\s*\(/g,
    severity: SEVERITY.HIGH,
    category: '动态代码执行',
    description: '检测到 document.write()，可能注入恶意内容',
  },

  // ── 3. 敏感数据访问（HIGH） ──
  {
    id: 'SENSITIVE_COOKIE',
    pattern: /document\.cookie/g,
    severity: SEVERITY.HIGH,
    category: '敏感数据访问',
    description: '检测到 document.cookie 访问',
  },
  {
    id: 'SENSITIVE_LOCALSTORAGE',
    pattern: /localStorage\s*\.\s*(?:getItem|setItem|removeItem|clear)/g,
    severity: SEVERITY.MEDIUM,
    category: '敏感数据访问',
    description: '检测到 localStorage 操作（课件通常不需要本地存储）',
    note: '如果是保存学习进度等合理用途，可以豁免',
  },

  // ── 4. 挖矿脚本（CRITICAL） ──
  {
    id: 'CRYPTO_MINER',
    pattern: /coinhive|cryptoloot|coin-?hive|minero|jsecoin|webminer|cryptonight/gi,
    severity: SEVERITY.CRITICAL,
    category: '加密货币挖矿',
    description: '检测到疑似挖矿脚本关键词',
  },
  {
    id: 'CRYPTO_WASM_MINER',
    pattern: /WebAssembly\.instantiate.*(?:mining|hash|crypto)/gi,
    severity: SEVERITY.CRITICAL,
    category: '加密货币挖矿',
    description: '检测到疑似 WASM 挖矿模块',
  },

  // ── 5. 跟踪代码（MEDIUM） ──
  {
    id: 'TRACKING_GA',
    pattern: /google-analytics\.com|googletagmanager\.com|gtag\s*\(/g,
    severity: SEVERITY.MEDIUM,
    category: '跟踪代码',
    description: '检测到 Google Analytics 跟踪代码',
  },
  {
    id: 'TRACKING_BAIDU',
    pattern: /hm\.baidu\.com|百度统计/g,
    severity: SEVERITY.MEDIUM,
    category: '跟踪代码',
    description: '检测到百度统计跟踪代码',
  },
  {
    id: 'TRACKING_PIXEL',
    pattern: /facebook\.com\/tr|pixel\.facebook|connect\.facebook\.net/g,
    severity: SEVERITY.MEDIUM,
    category: '跟踪代码',
    description: '检测到 Facebook 像素跟踪',
  },

  // ── 6. 外部脚本/样式注入（HIGH） ──
  {
    id: 'INJECT_SCRIPT_SRC',
    pattern: /createElement\s*\(\s*['"]script['"]\s*\)/g,
    severity: SEVERITY.HIGH,
    category: '脚本注入',
    description: '检测到动态创建 <script> 标签',
  },
  {
    id: 'INJECT_IFRAME',
    pattern: /createElement\s*\(\s*['"]iframe['"]\s*\)/g,
    severity: SEVERITY.HIGH,
    category: '脚本注入',
    description: '检测到动态创建 <iframe>（可能加载外部页面）',
  },

  // ── 7. 表单数据采集（HIGH） ──
  {
    id: 'FORM_ACTION_EXTERNAL',
    pattern: /<form[^>]+action\s*=\s*['"]https?:\/\//gi,
    severity: SEVERITY.HIGH,
    category: '表单外泄',
    description: '检测到表单提交到外部 URL',
  },
];

/* ─── 外部链接检测 ────────────────────────────── */

function checkExternalLinks(content, filePath) {
  const issues = [];

  // 检测 <a href="..."> 中的外部链接
  const hrefPattern = /<a\s[^>]*href\s*=\s*['"]([^'"]+)['"]/gi;
  let match;
  while ((match = hrefPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (!url) continue;

    // 检查是否为外部链接
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = INTERNAL_LINK_WHITELIST.some(re => re.test(url));
      const isCDN = CDN_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted && !isCDN) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_LINK',
          severity: SEVERITY.MEDIUM,
          category: '外部跳转',
          description: `<a> 链接指向外部网站: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 100),
        });
      }
    }
  }

  // 检测 window.open()
  const openPattern = /window\.open\s*\(\s*['"]([^'"]+)['"]/g;
  while ((match = openPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = INTERNAL_LINK_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_WINDOW_OPEN',
          severity: SEVERITY.HIGH,
          category: '外部跳转',
          description: `window.open() 打开外部网站: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 100),
        });
      }
    }
  }

  // 检测 location.href / location.replace / location.assign
  const locationPattern = /(?:window\.)?location\s*(?:\.\s*(?:href|replace|assign)\s*=|\.\s*(?:replace|assign)\s*\()\s*['"]([^'"]+)['"]/g;
  while ((match = locationPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = INTERNAL_LINK_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_REDIRECT',
          severity: SEVERITY.CRITICAL,
          category: '外部跳转',
          description: `页面重定向到外部网站: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 100),
        });
      }
    }
  }

  return issues;
}

/* ─── 外部资源检测 ────────────────────────────── */

function checkExternalResources(content, filePath) {
  const issues = [];

  // 检测 <script src="...">
  const scriptPattern = /<script[^>]+src\s*=\s*['"]([^'"]+)['"]/gi;
  let match;
  while ((match = scriptPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = CDN_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_SCRIPT',
          severity: SEVERITY.HIGH,
          category: '外部资源',
          description: `加载非白名单外部脚本: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 120),
        });
      }
    }
  }

  // 检测 <link rel="stylesheet" href="...">
  const linkPattern = /<link[^>]+href\s*=\s*['"]([^'"]+)['"]/gi;
  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = CDN_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_STYLESHEET',
          severity: SEVERITY.MEDIUM,
          category: '外部资源',
          description: `加载非白名单外部样式表: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 120),
        });
      }
    }
  }

  // 检测 <img src="..."> 指向非白名单外部图片
  const imgPattern = /<img[^>]+src\s*=\s*['"]([^'"]+)['"]/gi;
  while ((match = imgPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) {
      const isWhitelisted = CDN_WHITELIST.some(re => re.test(url));
      if (!isWhitelisted) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          id: 'EXTERNAL_IMAGE',
          severity: SEVERITY.INFO,
          category: '外部资源',
          description: `加载外部图片: ${url}`,
          file: filePath,
          line,
          match: match[0].substring(0, 120),
        });
      }
    }
  }

  return issues;
}

/* ─── CSP meta 标签注入 ──────────────────────── */

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; frame-src 'none'; object-src 'none';">`;

function injectCSP(content) {
  // 检查是否已有 CSP meta
  if (/Content-Security-Policy/i.test(content)) {
    return { content, injected: false, reason: '已存在 CSP' };
  }

  // 在 <head> 后插入
  const headMatch = content.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertPos = headMatch.index + headMatch[0].length;
    const newContent = content.slice(0, insertPos) + '\n' + CSP_META + content.slice(insertPos);
    return { content: newContent, injected: true };
  }

  // 没有 <head> 标签，在 <!DOCTYPE> 或文件开头插入
  const doctypeMatch = content.match(/<!DOCTYPE[^>]*>/i);
  if (doctypeMatch) {
    const insertPos = doctypeMatch.index + doctypeMatch[0].length;
    const newContent = content.slice(0, insertPos) + '\n<head>\n' + CSP_META + '\n</head>' + content.slice(insertPos);
    return { content: newContent, injected: true };
  }

  return { content: CSP_META + '\n' + content, injected: true };
}

/* ─── 单文件扫描 ─────────────────────────────── */

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(__dirname, filePath);
  const issues = [];

  // 1. 模式匹配
  for (const rule of DANGEROUS_PATTERNS) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // 排除注释中的匹配
      if (rule.exclude) {
        const surroundingStart = Math.max(0, match.index - 200);
        const surroundingEnd = Math.min(content.length, match.index + match[0].length + 200);
        const surrounding = content.substring(surroundingStart, surroundingEnd);
        if (rule.exclude.test(surrounding)) continue;
      }

      const line = content.substring(0, match.index).split('\n').length;
      issues.push({
        id: rule.id,
        severity: rule.severity,
        category: rule.category,
        description: rule.description,
        file: relativePath,
        line,
        match: match[0].substring(0, 80),
        note: rule.note || '',
      });
    }
  }

  // 2. 外部资源检测
  issues.push(...checkExternalResources(content, relativePath));

  // 3. 外部链接检测
  issues.push(...checkExternalLinks(content, relativePath));

  return { filePath, relativePath, content, issues };
}

/* ─── 目录扫描 ──────────────────────────────── */

function scanDirectory(dirPath) {
  const results = [];

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === '_template') continue;

    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (/\.html?$/i.test(entry)) {
      results.push(scanFile(fullPath));
    }
  }

  return results;
}

/* ─── 报告生成 ──────────────────────────────── */

function generateReport(results, strict = false) {
  const allIssues = results.flatMap(r => r.issues);
  const criticals = allIssues.filter(i => i.severity === SEVERITY.CRITICAL);
  const highs = allIssues.filter(i => i.severity === SEVERITY.HIGH);
  const mediums = allIssues.filter(i => i.severity === SEVERITY.MEDIUM);
  const infos = allIssues.filter(i => i.severity === SEVERITY.INFO);

  const filesWithIssues = results.filter(r => r.issues.length > 0);
  const cleanFiles = results.filter(r => r.issues.length === 0);

  console.log('\n' + '═'.repeat(70));
  console.log('🔒 TeachAny 课件安全扫描报告');
  console.log('═'.repeat(70));
  console.log(`扫描时间：${new Date().toLocaleString('zh-CN')}`);
  console.log(`扫描文件：${results.length} 个 HTML 文件`);
  console.log(`安全文件：${cleanFiles.length} 个`);
  console.log(`有问题文件：${filesWithIssues.length} 个`);
  console.log('─'.repeat(70));
  console.log(`${SEVERITY_EMOJI.CRITICAL} CRITICAL：${criticals.length}`);
  console.log(`${SEVERITY_EMOJI.HIGH} HIGH：${highs.length}`);
  console.log(`${SEVERITY_EMOJI.MEDIUM} MEDIUM：${mediums.length}`);
  console.log(`${SEVERITY_EMOJI.INFO} INFO：${infos.length}`);
  console.log('─'.repeat(70));

  // 按文件分组输出详情
  for (const result of filesWithIssues) {
    const fileIssues = result.issues.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
      return (order[a.severity] || 9) - (order[b.severity] || 9);
    });

    console.log(`\n📄 ${result.relativePath} （${fileIssues.length} 个问题）`);
    for (const issue of fileIssues) {
      const emoji = SEVERITY_EMOJI[issue.severity] || '⚪';
      console.log(`  ${emoji} [${issue.severity}] ${issue.category}: ${issue.description}`);
      console.log(`     行 ${issue.line}: ${issue.match}`);
      if (issue.note) console.log(`     💡 ${issue.note}`);
    }
  }

  // 汇总
  console.log('\n' + '═'.repeat(70));

  if (cleanFiles.length > 0 && cleanFiles.length <= 10) {
    console.log(`\n✅ 安全通过的文件（${cleanFiles.length} 个）：`);
    for (const r of cleanFiles) {
      console.log(`  ✅ ${r.relativePath}`);
    }
  } else if (cleanFiles.length > 10) {
    console.log(`\n✅ ${cleanFiles.length} 个文件安全通过`);
  }

  // 退出码
  const failThreshold = strict ? mediums.length : 0;
  const hasBlockingIssues = criticals.length > 0 || highs.length > 0 || failThreshold > 0;

  if (hasBlockingIssues) {
    console.log(`\n⛔ 扫描未通过 — 发现 ${criticals.length} 个 CRITICAL + ${highs.length} 个 HIGH 问题`);
    if (strict && mediums.length > 0) {
      console.log(`   严格模式下 ${mediums.length} 个 MEDIUM 问题也需要修复`);
    }
  } else {
    console.log('\n🎉 扫描通过 — 未发现高危安全问题！');
    if (mediums.length > 0) {
      console.log(`   建议关注 ${mediums.length} 个 MEDIUM 级别问题`);
    }
  }

  return { criticals: criticals.length, highs: highs.length, mediums: mediums.length, infos: infos.length, hasBlockingIssues };
}

/* ─── CLI 入口 ──────────────────────────────── */

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const fix = args.includes('--fix');
  const dirIdx = args.indexOf('--dir');
  const targetDir = dirIdx !== -1 ? args[dirIdx + 1] : null;

  let scanPath;
  if (targetDir) {
    scanPath = path.join(EXAMPLES_DIR, targetDir);
    if (!fs.existsSync(scanPath)) {
      console.error(`❌ 目录不存在: ${scanPath}`);
      process.exit(1);
    }
  } else {
    scanPath = EXAMPLES_DIR;
  }

  console.log(`🔍 开始扫描: ${path.relative(__dirname, scanPath) || '.'}`);
  if (strict) console.log('⚠️  严格模式开启');
  if (fix) console.log('🔧 自动修复模式开启（将注入 CSP meta 标签）');

  const results = scanDirectory(scanPath);

  // 自动修复：注入 CSP
  if (fix) {
    let fixed = 0;
    for (const result of results) {
      const { content: newContent, injected, reason } = injectCSP(result.content);
      if (injected) {
        fs.writeFileSync(result.filePath, newContent, 'utf8');
        fixed++;
        console.log(`  🔧 已注入 CSP: ${result.relativePath}`);
      } else if (reason) {
        console.log(`  ⏭️  跳过 CSP: ${result.relativePath}（${reason}）`);
      }
    }
    console.log(`\n🔧 CSP 注入完成：${fixed} 个文件已更新`);
  }

  const report = generateReport(results, strict);

  if (report.hasBlockingIssues) {
    process.exit(1);
  }
}

main();
