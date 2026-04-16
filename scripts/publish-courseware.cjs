#!/usr/bin/env node
/**
 * TeachAny Courseware Publisher
 * Packs and uploads .teachany to GitHub Releases, updates registry.
 * Usage: node scripts/publish-courseware.cjs <course-dir> [--tag <tag>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

function log(msg, type = 'info') {
  const icons = { info: '📦', success: '✅', error: '❌', warn: '⚠️', upload: '⬆️' };
  console.log(`${icons[type] || '📋'} ${msg}`);
}

const args = process.argv.slice(2);
const courseDirIdx = args.findIndex(a => !a.startsWith('--'));
if (courseDirIdx === -1) {
  console.error('Usage: node publish-courseware.cjs <course-dir> [--tag tag] [--dry-run]');
  process.exit(1);
}
const courseDir = path.resolve(args[courseDirIdx]);
const tagArg = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : `courseware-v${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;
const dryRun = args.includes('--dry-run');

// Validate
const indexPath = path.join(courseDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  log(`Missing index.html`, 'error'); process.exit(1);
}

const courseId = path.basename(courseDir);

// Extract meta
const htmlContent = fs.readFileSync(indexPath, 'utf-8');
const getMeta = name => {
  const m = htmlContent.match(new RegExp(`<meta\\s+name="${name}"[^>]*content="([^"]*)"`, 'i'));
  return m ? m[1] : '';
};

log(`Publishing: ${courseId} (node=${getMeta('teachany-node')}, version=${getMeta('teachany-version')})`);
if (dryRun) { log('DRY RUN — skipping actual upload', 'warn'); }

// Step 1: Pack (call pack script)
const packScript = path.join(__dirname, 'pack-courseware.cjs');
const distDir = path.join(process.cwd(), 'dist');
try {
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  // Inline pack logic
  const { execSync } = require('child_process');
  const zipPath = path.join(distDir, `${courseId}.teachany`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  
  const manifestPath = path.join(courseDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const manifest = {
      name: courseId, subject: getMeta('teachany-subject'), grade: parseInt(getMeta('teachany-grade')) || 0,
      author: getMeta('teachany-author') || 'weponusa', version: getMeta('teachany-version') || '1.0',
      node_id: getMeta('teachany-node') || courseId, domain: getMeta('teachany-domain') || '',
      prerequisites: (getMeta('teachany-prerequisites')||'').split(',').filter(Boolean),
      description: '', license: 'MIT', teachany_spec: '1.0'
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
  
  execSync(`cd "${courseDir}" && zip -r "${zipPath}" . -x "*.DS_Store" "node_modules/*" ".git/*"`, { stdio: 'pipe' });
  log(`Packed: ${zipPath} (${Math.round(fs.statSync(zipPath).size/1024)} KB)`, 'success');
} catch(e) { log(`Pack failed: ${e.message}`, 'error'); process.exit(1); }

// Step 2: Upload to GitHub Releases
const token = process.env.GITHUB_TOKEN;
if (!token && !dryRun) {
  log('GITHUB_TOKEN not set — skipping Release upload', 'warn');
  log('Set with: export GITHUB_TOKEN=ghp_xxx', 'warn');
} else if (!dryRun) {
  const https = require('https');
  const repoOwner = 'weponusa';
  const repoName = 'teachany';
  
  function ghApi(method, apiPath, data) {
    return new Promise((resolve, reject) => {
      const body = data ? JSON.stringify(data) : undefined;
      const url = `https://api.github.com${apiPath}`;
      const u = new URL(url);
      const opts = {
        hostname: u.hostname, path: u.pathname + u.search,
        method, headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'TeachAny-Publisher',
          ...(body ? {'Content-Type': 'application/json'} : {})
        }
      };
      const req = https.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, data: d }); }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  (async () => {
    try {
      // Get or create release
      let release;
      try {
        const r = await ghApi('GET', `/repos/${repoOwner}/${repoName}/releases/tags/${tagArg}`);
        release = r.data;
        log(`Found existing release: ${tagArg}`, 'info');
      } catch {
        log(`Creating new release: ${tagArg}`, 'upload');
        const r = await ghApi('POST', `/repos/${repoOwner}/${repoName}/releases`, {
          tag_name: tagArg, name: `TeachAny Courseware — ${tagArg}`,
          body: `Official TeachAny courseware package.\n\n**${courseId}** uploaded on ${new Date().toISOString()}`,
          draft: false, prerelease: false
        });
        release = r.data;
      }

      // Delete old asset if exists
      const assets = release.assets || [];
      for (const a of assets) {
        if (a.name === `${courseId}.teachany`) {
          await ghApi('DELETE', a.url);
          log(`Removed old asset: ${a.name}`, 'info');
        }
      }

      // Upload
      const zipBuffer = fs.readFileSync(path.join(distDir, `${courseId}.teachany`));
      
      // Use GitHub API for uploads
      const uploadUrl = release.upload_url.replace('{?name,label}','') + `?name=${courseId}.teachany`;
      await new Promise((resolve, reject) => {
        const u = new URL(uploadUrl);
        const req = https.request({
          hostname: u.hostname, path: u.pathname + u.search,
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': zipBuffer.length,
            'User-Agent': 'TeachAny-Publisher'
          }
        }, res => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              log(`Uploaded to GitHub Releases ✅`, 'success');
              log(`Download: ${release.html_url}`, 'info');
              resolve();
            } else { reject(new Error(`Upload failed: ${res.status} ${d}`)); }
          });
        });
        req.on('error', reject);
        req.write(zipBuffer);
        req.end();
      });

      // Update registry download_url
      const regPath = './courseware-registry.json';
      if (fs.existsSync(regPath)) {
        const reg = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
        const course = reg.courses.find(c => c.id === courseId);
        if (course) {
          course.download_url = `https://github.com/${repoOwner}/${repoName}/releases/download/${tagArg}/${courseId}.teachany`;
          course.release_tag = tagArg;
          course.updated = new Date().toISOString().slice(0, 10);
          fs.writeFileSync(regPath, JSON.stringify(reg, null, 2));
          log('Registry updated with download_url ✅', 'success');
        }
      }
    } catch(err) {
      log(`Publish error: ${err.message}`, 'error');
    }
  })();
} else {
  log('(dry run: would have published)', 'info');
}

console.log('\n✅ Publish complete!');
