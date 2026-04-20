/**
 * TeachAny Community Submit Worker (v2 · 直接建 PR · 突破 64KB 限制)
 * =================================
 *
 * v1（旧版）走 GitHub repository_dispatch，client_payload 硬上限 64KB，
 * 压缩后的课件包仍会超限。
 *
 * v2（本版）改为：Worker 用 Bot Token 直接走 Git Data API 建分支 + commit
 * 文件 + 开 PR，突破 64KB 限制（单文件上限 100 MB，但我们仍限 5 MB 避免滥用）。
 *
 * 请求格式（POST /api/submit）：
 * {
 *   "node_id":       "hist-m-industrial-revolution",
 *   "name":          "工业革命",
 *   "subject":       "history",
 *   "grade":         9,
 *   "author":        "张老师",
 *   "description":   "...",
 *   "extra":         { "name_en": "...", "version": "1.0.0", ... },
 *   "packageBase64": "<base64-encoded .teachany zip>"
 * }
 */

const REPO_OWNER = "weponusa";
const REPO_NAME = "teachany";
const REPO = `${REPO_OWNER}/${REPO_NAME}`;
const BASE_BRANCH = "main";
const MAX_PACKAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const RATE_LIMIT_PER_IP_PER_DAY = 10;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "TeachAny Community Submit API",
        version: "2.0.0",
        repo: REPO,
        mode: "direct-pr",
      });
    }

    if (url.pathname !== "/api/submit") {
      return jsonResponse({ ok: false, code: "NOT_FOUND", message: "Unknown endpoint" }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST" }, 405);
    }

    // 1. 限频
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rlCheck = await checkRateLimit(env, ip);
    if (!rlCheck.ok) {
      return jsonResponse(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: `今日已提交 ${rlCheck.count}/${RATE_LIMIT_PER_IP_PER_DAY} 份课件，请明天再来。`,
        },
        429
      );
    }

    // 2. 解析 payload
    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ ok: false, code: "INVALID_JSON", message: "请求体不是合法 JSON" }, 400);
    }

    const required = ["node_id", "name", "subject", "grade", "packageBase64"];
    const missing = required.filter((k) => !payload[k]);
    if (missing.length) {
      return jsonResponse(
        { ok: false, code: "MISSING_FIELDS", message: `缺少必填字段：${missing.join(", ")}` },
        400
      );
    }

    // 3. 包大小校验
    const pkgBytes = Math.floor((payload.packageBase64.length * 3) / 4);
    if (pkgBytes > MAX_PACKAGE_BYTES) {
      return jsonResponse(
        {
          ok: false,
          code: "PACKAGE_TOO_LARGE",
          message: `课件包 ${(pkgBytes / 1024 / 1024).toFixed(1)} MB 超过 ${MAX_PACKAGE_BYTES / 1024 / 1024} MB 限制`,
        },
        413
      );
    }

    // 4. 恶意内容粗筛
    if (containsSuspiciousContent(payload)) {
      return jsonResponse(
        { ok: false, code: "CONTENT_REJECTED", message: "提交内容含有可疑信息，已拒绝" },
        400
      );
    }

    // 5. 直接走 Git Data API 建分支 + 上传文件 + 开 PR
    try {
      const result = await createPR(env, payload);
      await incrementRateLimit(env, ip);
      return jsonResponse(
        {
          ok: true,
          submission_id: result.courseId,
          pr_url: result.prUrl,
          pr_number: result.prNumber,
          message: "课件已成功提交！validate.yml 将在几秒后自动运行质检。",
          actions_url: `https://github.com/${REPO}/actions`,
        },
        202
      );
    } catch (err) {
      console.error("createPR failed:", err);
      return jsonResponse(
        {
          ok: false,
          code: "GITHUB_API_ERROR",
          message: `GitHub API 错误：${err.message}`,
          detail: String(err).slice(0, 500),
        },
        502
      );
    }
  },
};

// ===================================================================
// GitHub Git Data API：建分支 + 上传文件 + 开 PR
// ===================================================================

async function createPR(env, payload) {
  const token = env.GITHUB_TOKEN;
  const courseId = buildCourseId(payload);
  const branch = `community/${courseId}`;

  // 5.1 拿到 main 分支的 commit SHA
  const mainRef = await ghGet(
    token,
    `/repos/${REPO}/git/refs/heads/${BASE_BRANCH}`
  );
  const mainSha = mainRef.object.sha;

  // 5.2 拿到 main commit 对应的 tree SHA
  const mainCommit = await ghGet(token, `/repos/${REPO}/git/commits/${mainSha}`);
  const baseTreeSha = mainCommit.tree.sha;

  // 5.3 创建 blobs
  //   - community/pending/<course-id>.teachany  (课件 zip 包)
  //   - community/pending/<course-id>.json      (元数据)
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

  // 5.4 创建 tree（在 main 之上追加这两个文件）
  const newTree = await ghPost(token, `/repos/${REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: [
      {
        path: `community/pending/${courseId}.teachany`,
        mode: "100644",
        type: "blob",
        sha: teachanyBlob.sha,
      },
      {
        path: `community/pending/${courseId}.json`,
        mode: "100644",
        type: "blob",
        sha: jsonBlob.sha,
      },
    ],
  });

  // 5.5 创建 commit
  const newCommit = await ghPost(token, `/repos/${REPO}/git/commits`, {
    message: `[Community] Submit courseware: ${payload.name}`,
    tree: newTree.sha,
    parents: [mainSha],
    author: {
      name: "TeachAny Community Bot",
      email: "teachany-bot@users.noreply.github.com",
    },
  });

  // 5.6 创建分支 ref
  await ghPost(token, `/repos/${REPO}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: newCommit.sha,
  });

  // 5.7 开 PR
  const author = payload.author || "匿名用户";
  const prBody = buildPRBody(payload, courseId);
  const pr = await ghPost(token, `/repos/${REPO}/pulls`, {
    title: `[Community] 📚 ${payload.name} (${payload.node_id})`,
    head: branch,
    base: BASE_BRANCH,
    body: prBody,
  });

  // 5.8 给 PR 打标签（community-courseware + needs-review）
  try {
    await ghPost(token, `/repos/${REPO}/issues/${pr.number}/labels`, {
      labels: ["community-courseware", "needs-review"],
    });
  } catch (e) {
    // 标签可能不存在，忽略
    console.warn("Add label failed (non-fatal):", e.message);
  }

  return {
    courseId,
    prUrl: pr.html_url,
    prNumber: pr.number,
  };
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
*Submitted via TeachAny Community Submit Worker v2 · 2026-04-20*`;
}

// ===================================================================
// GitHub API Helpers
// ===================================================================

async function ghGet(token, path) {
  const resp = await fetch(`https://api.github.com${path}`, {
    headers: ghHeaders(token),
  });
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
    "User-Agent": "TeachAny-CommunityWorker/2.0",
  };
}

// ===================================================================
// Helpers
// ===================================================================

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMIT_KV) return { ok: true, count: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${today}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= RATE_LIMIT_PER_IP_PER_DAY) {
    return { ok: false, count };
  }
  return { ok: true, count };
}

async function incrementRateLimit(env, ip) {
  if (!env.RATE_LIMIT_KV) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${today}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 172800 });
}

function containsSuspiciousContent(payload) {
  const blacklist = [
    "<script>alert",
    "eval(atob(",
    "document.cookie",
    "onerror=",
    "javascript:",
  ];
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
