#!/usr/bin/env node
/**
 * TeachAny 课件发布工具
 *
 * 功能：
 *   1. 调用 pack-courseware.cjs 打包课件为 .teachany 文件
 *   2. 通过 GitHub API 创建/更新 Release
 *   3. 上传 .teachany 文件作为 Release asset
 *   4. 自动更新 courseware-registry.json 中的 download_url
 *
 * 用法：
 *   node scripts/publish-courseware.cjs <课件目录> [--tag <release-tag>] [--token <github-token>]
 *   node scripts/publish-courseware.cjs ./examples/math-linear-function
 *   node scripts/publish-courseware.cjs ./examples/math-linear-function --tag v1.0.0
 *   node scripts/publish-courseware.cjs --all   # 发布所有课件
 *
 * 环境变量：
 *   GITHUB_TOKEN - GitHub Personal Access Token（需要 repo 权限）
 *
 * 注意：
 *   - 首次使用前需要设置 GITHUB_TOKEN
 *   - Release tag 格式：courseware-v{date}（如 courseware-v20260410）
 *   - 每个课件作为 Release 的一个 asset
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// ── 常量 ─────────────────────────────────────
const REPO_OWNER = 'weponusa';
const REPO_NAME = 'teachany';
const REGISTRY_PATH = path.resolve(__dirname, '..', 'courseware-registry.json');
const PACK_SCRIPT = path.resolve(__dirname, 'pack-courseware.cjs');
const EXAMPLES_DIR = path.resolve(__dirname, '..', 'examples');
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// ── GitHub API 请求 ──────────────────────────
function githubRequest(method, endpoint, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TeachAny-Publisher',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API ${res.statusCode}: ${parsed.message || data}`));
          }
        } catch {
          reject(new Error(`GitHub API 响应解析失败: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── 上传 Release Asset ──────────────────────
function uploadAsset(uploadUrl, filePath, token) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    // uploadUrl 格式：https://uploads.github.com/repos/.../assets{?name,label}
    const cleanUrl = uploadUrl.replace(/{.*}/, '') + `?name=${encodeURIComponent(fileName)}`;
    const urlObj = new URL(cleanUrl);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TeachAny-Publisher',
        'Content-Type': 'application/zip',
        'Content-Length': fileSize,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`上传失败 ${res.statusCode}: ${parsed.message || data.slice(0, 200)}`));
          }
        } catch {
          reject(new Error(`上传响应解析失败: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

// ── 获取或创建 Release ──────────────────────
async function getOrCreateRelease(tag, token) {
  // 尝试获取已有 release
  try {
    const release = await githubRequest('GET', `/releases/tags/${tag}`, token);
    console.log(`  📌 使用已有 Release: ${tag}`);
    return release;
  } catch {
    // 不存在，创建新的
  }

  console.log(`  📌 创建新 Release: ${tag}`);
  const release = await githubRequest('POST', '/releases', token, {
    tag_name: tag,
    name: `TeachAny Courseware ${tag}`,
    body: [
      '## TeachAny 课件包发布',
      '',
      '此 Release 包含 TeachAny 互动课件的 `.teachany` 打包文件。',
      '',
      '### 使用方式',
      '1. 下载 `.teachany` 文件',
      '2. 在 [TeachAny Gallery](https://weponusa.github.io/teachany/) 点击"添加我的课件"',
      '3. 选择下载的文件即可导入',
      '',
      '---',
      '*由 publish-courseware.cjs 自动发布*',
    ].join('\n'),
    draft: false,
    prerelease: false,
  });

  return release;
}

// ── 删除同名 asset（更新时使用）─────────────
async function deleteExistingAsset(releaseId, assetName, token) {
  try {
    const assets = await githubRequest('GET', `/releases/${releaseId}/assets`, token);
    const existing = assets.find((a) => a.name === assetName);
    if (existing) {
      await githubRequest('DELETE', `/releases/assets/${existing.id}`, token);
      console.log(`  🗑️  已删除旧版 asset: ${assetName}`);
    }
  } catch {
    // 忽略
  }
}

// ── 更新 Registry ────────────────────────────
function updateRegistry(courseId, downloadUrl, releaseTag) {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('❌ courseware-registry.json 不存在');
    return false;
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  const course = registry.courses.find((c) => c.id === courseId);

  if (!course) {
    console.warn(`  ⚠️  Registry 中未找到课件 ${courseId}，跳过更新`);
    return false;
  }

  course.download_url = downloadUrl;
  course.release_tag = releaseTag;
  course.source = 'releases'; // 标记来源为 GitHub Releases
  registry.updated_at = new Date().toISOString();

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  console.log(`  ✅ Registry 已更新: ${courseId} → ${releaseTag}`);
  return true;
}

// ── 打包单个课件 ─────────────────────────────
function packCourseware(courseDir) {
  // 确保 dist 目录存在
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  try {
    execSync(`node "${PACK_SCRIPT}" "${courseDir}" "${DIST_DIR}"`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (err) {
    throw new Error(`打包失败: ${err.stderr || err.message}`);
  }

  const dirName = path.basename(courseDir);
  const outputPath = path.join(DIST_DIR, `${dirName}.teachany`);

  if (!fs.existsSync(outputPath)) {
    throw new Error(`打包文件未生成: ${outputPath}`);
  }

  return outputPath;
}

// ── 发布单个课件 ─────────────────────────────
async function publishOne(courseDir, tag, token) {
  const courseId = path.basename(courseDir);
  console.log(`\n📦 发布课件: ${courseId}`);

  // Step 1: 打包
  console.log('  📦 打包中...');
  const packagePath = packCourseware(courseDir);
  const fileSize = fs.statSync(packagePath).size;
  const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
  console.log(`  📏 大小: ${sizeMB} MB`);

  // 检查大小限制（GitHub Releases 单文件限制 2GB，但建议 < 100MB）
  if (fileSize > 100 * 1024 * 1024) {
    console.warn(`  ⚠️  文件大小 ${sizeMB}MB 超过 100MB，上传可能较慢`);
  }

  // Step 2: 获取或创建 Release
  const release = await getOrCreateRelease(tag, token);

  // Step 3: 删除旧的同名 asset
  const assetName = `${courseId}.teachany`;
  await deleteExistingAsset(release.id, assetName, token);

  // Step 4: 上传
  console.log(`  ⬆️  上传中...`);
  const asset = await uploadAsset(release.upload_url, packagePath, token);
  const downloadUrl = asset.browser_download_url;
  console.log(`  ✅ 上传成功: ${downloadUrl}`);

  // Step 5: 更新 Registry
  updateRegistry(courseId, downloadUrl, tag);

  return { courseId, downloadUrl, sizeMB };
}

// ── 列出所有课件目录 ─────────────────────────
function listAllCourses() {
  if (!fs.existsSync(EXAMPLES_DIR)) return [];

  return fs
    .readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => path.join(EXAMPLES_DIR, d.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'index.html')));
}

// ── 解析命令行参数 ───────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dirs: [],
    tag: '',
    token: process.env.GITHUB_TOKEN || '',
    all: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tag':
        opts.tag = args[++i];
        break;
      case '--token':
        opts.token = args[++i];
        break;
      case '--all':
        opts.all = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        if (!args[i].startsWith('-')) {
          opts.dirs.push(path.resolve(args[i]));
        }
    }
  }

  // 默认 tag
  if (!opts.tag) {
    const d = new Date();
    const dateStr =
      d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0');
    opts.tag = `courseware-v${dateStr}`;
  }

  return opts;
}

// ── 主流程 ─────────────────────────────────
async function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log(`
📦 TeachAny 课件发布工具

用法：
  node scripts/publish-courseware.cjs <课件目录> [选项]
  node scripts/publish-courseware.cjs --all [选项]

选项：
  --all           发布 examples/ 下所有课件
  --tag <tag>     Release tag（默认：courseware-vYYYYMMDD）
  --token <token> GitHub Token（也可通过 GITHUB_TOKEN 环境变量设置）
  --dry-run       仅打包，不上传
  -h, --help      显示帮助

示例：
  # 发布单个课件
  node scripts/publish-courseware.cjs ./examples/math-linear-function

  # 发布所有课件
  node scripts/publish-courseware.cjs --all

  # 仅打包不上传
  node scripts/publish-courseware.cjs --all --dry-run

环境变量：
  GITHUB_TOKEN    GitHub Personal Access Token（需要 repo 权限）
    `);
    process.exit(0);
  }

  // 确定要发布的课件目录
  let dirs = [];
  if (opts.all) {
    dirs = listAllCourses();
    console.log(`🔍 发现 ${dirs.length} 个课件`);
  } else if (opts.dirs.length > 0) {
    dirs = opts.dirs;
  } else {
    console.error('❌ 请指定课件目录或使用 --all');
    process.exit(1);
  }

  // 检查 token
  if (!opts.dryRun && !opts.token) {
    console.error('❌ 需要 GITHUB_TOKEN。请设置环境变量或使用 --token 参数');
    console.log('   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  console.log(`📋 Release Tag: ${opts.tag}`);
  console.log(`📂 课件数量: ${dirs.length}`);
  if (opts.dryRun) console.log('🏃 Dry Run 模式（仅打包）');
  console.log('─'.repeat(50));

  const results = [];

  for (const dir of dirs) {
    try {
      if (opts.dryRun) {
        // 仅打包
        const courseId = path.basename(dir);
        console.log(`\n📦 打包课件: ${courseId}`);
        const packagePath = packCourseware(dir);
        const sizeMB = (fs.statSync(packagePath).size / 1024 / 1024).toFixed(2);
        console.log(`  ✅ ${packagePath} (${sizeMB} MB)`);
        results.push({ courseId, sizeMB, status: 'packed' });
      } else {
        const result = await publishOne(dir, opts.tag, opts.token);
        results.push({ ...result, status: 'published' });
      }
    } catch (err) {
      const courseId = path.basename(dir);
      console.error(`  ❌ ${courseId} 失败: ${err.message}`);
      results.push({ courseId, status: 'failed', error: err.message });
    }
  }

  // 汇总
  console.log('\n' + '═'.repeat(50));
  console.log('📊 发布汇总');
  console.log('═'.repeat(50));

  const succeeded = results.filter((r) => r.status !== 'failed');
  const failed = results.filter((r) => r.status === 'failed');

  succeeded.forEach((r) => {
    console.log(`  ✅ ${r.courseId} (${r.sizeMB} MB)${r.downloadUrl ? ' → ' + r.downloadUrl : ''}`);
  });
  failed.forEach((r) => {
    console.log(`  ❌ ${r.courseId}: ${r.error}`);
  });

  console.log(`\n总计: ${succeeded.length} 成功, ${failed.length} 失败`);

  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ 发布失败:', err.message);
  process.exit(1);
});
