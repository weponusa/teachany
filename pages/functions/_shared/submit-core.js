/**
 * TeachAny Community Submit · 共享核心业务（Pages Functions 版）
 * =================================================
 * 从 worker/submit-api.js 迁移过来，逻辑完全一致。
 * Pages Functions 和 Workers 共享 runtime（Workers API），
 * 唯一差异是 handler 入口形式。
 */

export const REPO_OWNER = "weponusa";
export const REPO_NAME = "teachany-courseware";
export const REPO = `${REPO_OWNER}/${REPO_NAME}`;
export const BASE_BRANCH = "main";
export const MAX_PACKAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const RATE_LIMIT_PER_IP_PER_DAY = 10;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// ===================================================================
// GitHub Git Data API：建分支 + 上传文件 + 开 PR
// ===================================================================

export async function createPR(env, payload) {
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN secret 未配置");

  const courseId = buildCourseId(payload);
  const branch = `community/${courseId}`;

  const mainRef = await ghGet(token, `/repos/${REPO}/git/refs/heads/${BASE_BRANCH}`);
  const mainSha = mainRef.object.sha;

  const mainCommit = await ghGet(token, `/repos/${REPO}/git/commits/${mainSha}`);
  const baseTreeSha = mainCommit.tree.sha;

  const metaJson = JSON.stringify(buildMetaJson(payload, courseId), null, 2);

  const [teachanyBlob, jsonBlob] = await Promise.all([
    ghPost(token, `/repos/${REPO}/git/blobs`, {
      content: payload.packageBase64,
      encoding: "base64",
    }),
    ghPost(token, `/repos/${REPO}/git/blobs`, {
      content: metaJson,
      encoding: "utf-8",
    }),
  ]);

  const newTree = await ghPost(token, `/repos/${REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: [
      { path: `community/pending/${courseId}.teachany`, mode: "100644", type: "blob", sha: teachanyBlob.sha },
      { path: `community/pending/${courseId}.json`,     mode: "100644", type: "blob", sha: jsonBlob.sha },
    ],
  });

  const newCommit = await ghPost(token, `/repos/${REPO}/git/commits`, {
    message: `[Community] Submit courseware: ${payload.name}`,
    tree: newTree.sha,
    parents: [mainSha],
    author: {
      name: "TeachAny Community Bot",
      email: "teachany-bot@users.noreply.github.com",
    },
  });

  await ghPost(token, `/repos/${REPO}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: newCommit.sha,
  });

  const pr = await ghPost(token, `/repos/${REPO}/pulls`, {
    title: `[Community] 📚 ${payload.name} (${payload.node_id})`,
    head: branch,
    base: BASE_BRANCH,
    body: buildPRBody(payload, courseId),
  });

  try {
    await ghPost(token, `/repos/${REPO}/issues/${pr.number}/labels`, {
      labels: ["community-courseware", "needs-review"],
    });
  } catch (e) {
    console.warn("Add label failed (non-fatal):", e.message);
  }

  return { courseId, prUrl: pr.html_url, prNumber: pr.number };
}

function buildCourseId(payload) {
  const ts = Math.floor(Date.now() / 1000).toString(16);
  return `${payload.subject}-${payload.node_id}-${ts}`;
}

function buildMetaJson(payload, courseId) {
  const extra = payload.extra || {};
  return {
    id: courseId,
    node_id: payload.node_id,
    name: payload.name,
    name_en: extra.name_en || "",
    subject: payload.subject,
    grade: payload.grade,
    author: payload.author || "匿名用户",
    description: payload.description || "",
    version: extra.version || "1.0.0",
    submitted_at: new Date().toISOString(),
    file_count: extra.file_count || 0,
    tags: extra.tags || [],
    user_message: extra.user_message || "",
    teachany_version: extra.teachany_version || "",
    curriculum: extra.curriculum || "cn-national",
    compress_stats: extra.compress_stats || {},
    submit_channel: "pages-functions-v1",
  };
}

function buildPRBody(payload, courseId) {
  const extra = payload.extra || {};
  const fileCount = extra.file_count || "?";
  const compress = extra.compress_stats || {};
  let compressLine = "";
  if (compress.images_compressed) {
    const beforeMB = (compress.bytes_before / 1024 / 1024).toFixed(1);
    const afterMB = (compress.bytes_after / 1024 / 1024).toFixed(1);
    const ratio = (compress.bytes_before / Math.max(compress.bytes_after, 1)).toFixed(1);
    compressLine = `\n- **WebP 压缩**: ${compress.images_compressed} 张图 ${beforeMB} → ${afterMB} MB（${ratio}x）`;
  }
  return `## Community Courseware Submission

- **Name**: ${payload.name}
- **Subject**: ${payload.subject}
- **Grade**: ${payload.grade}
- **Node ID**: \`${payload.node_id}\`
- **Author**: ${payload.author || "匿名用户"}
- **Files**: ${fileCount}${compressLine}

### Files in this PR:
- \`community/pending/${courseId}.json\` — 课件元数据
- \`community/pending/${courseId}.teachany\` — 课件 ZIP 包

### User Message
${extra.user_message || "（无留言）"}

---
*Submitted via TeachAny Pages Functions v1 · 2026-04-23*`;
}

// GitHub API Helpers
async function ghGet(token, path) {
  const resp = await fetch(`https://api.github.com${path}`, { headers: ghHeaders(token) });
  if (!resp.ok) throw new Error(`GET ${path} → ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function ghPost(token, path, body) {
  const resp = await fetch(`https://api.github.com${path}`, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`POST ${path} → ${resp.status} ${await resp.text()}`);
  return resp.json();
}

function ghHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "TeachAny-CommunityPages/1.0",
  };
}

// Rate Limiting
export async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMIT_KV) return { ok: true, count: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${today}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= RATE_LIMIT_PER_IP_PER_DAY) return { ok: false, count };
  return { ok: true, count };
}

export async function incrementRateLimit(env, ip) {
  if (!env.RATE_LIMIT_KV) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${today}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 172800 });
}

export function containsSuspiciousContent(payload) {
  const blacklist = ["<script>alert", "eval(atob(", "document.cookie", "onerror=", "javascript:"];
  const textFields = [
    payload.name,
    payload.description,
    payload.author,
    payload.user_message,
    (payload.extra && payload.extra.tags ? payload.extra.tags : []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blacklist.some((kw) => textFields.includes(kw.toLowerCase()));
}
