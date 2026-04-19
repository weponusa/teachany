/**
 * TeachAny Community Submit Worker
 * =================================
 *
 * Cloudflare Worker 脚本，作为 submit-to-community.py 和 GitHub API 之间的中转。
 *
 * 设计目标：
 * 1. 用户零配置：submit-to-community.py 直接 POST 到此 Worker，不需要 GitHub token
 * 2. Token 隔离：GitHub Bot Token 存在 Worker secret 里，用户看不到
 * 3. 限频防刷：同一 IP 每天最多提交 10 份课件
 * 4. 基础校验：payload 字段完整性 + 包大小上限 + manifest 必填字段
 *
 * 请求格式（POST /api/submit）：
 * {
 *   "node_id":       "hist-m-industrial-revolution",
 *   "name":          "工业革命",
 *   "subject":       "history",
 *   "grade":         9,
 *   "author":        "张老师",
 *   "description":   "初中历史...",
 *   "version":       "1.0.0",
 *   "file_count":    12,
 *   "tags":          ["历史", "工业革命"],
 *   "user_message":  "欢迎审阅",
 *   "packageBase64": "<base64-encoded .teachany zip>"
 * }
 *
 * 响应格式：
 * { "ok": true,  "pr_url": "https://...", "message": "..." }
 * { "ok": false, "code": "RATE_LIMITED", "message": "..." }
 *
 * 环境变量（wrangler.toml 或 secret）：
 * - GITHUB_TOKEN: Fine-grained PAT，权限 Contents+PR+Metadata
 * - GITHUB_REPO:  "weponusa/teachany"
 * - RATE_LIMIT_KV: KV namespace binding（用于限频计数）
 */

const REPO = "weponusa/teachany";
const EVENT_TYPE = "community-submit";
const MAX_PACKAGE_BYTES = 5 * 1024 * 1024; // 5MB
const RATE_LIMIT_PER_IP_PER_DAY = 10;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "TeachAny Community Submit API",
        version: "1.0.0",
        repo: REPO,
      });
    }

    if (url.pathname !== "/api/submit") {
      return jsonResponse({ ok: false, code: "NOT_FOUND", message: "Unknown endpoint" }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST" }, 405);
    }

    // 1. 限频检查
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

    // 2. 解析 + 基础校验
    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(
        { ok: false, code: "INVALID_JSON", message: "请求体不是合法 JSON" },
        400
      );
    }

    const required = ["node_id", "name", "subject", "grade", "packageBase64"];
    const missing = required.filter((k) => !payload[k]);
    if (missing.length) {
      return jsonResponse(
        {
          ok: false,
          code: "MISSING_FIELDS",
          message: `缺少必填字段：${missing.join(", ")}`,
        },
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
          message: `课件包 ${(pkgBytes / 1024 / 1024).toFixed(1)} MB 超过 5 MB 限制`,
        },
        413
      );
    }

    // 4. 内容安全粗筛（可扩展）
    if (containsSuspiciousContent(payload)) {
      return jsonResponse(
        {
          ok: false,
          code: "CONTENT_REJECTED",
          message: "提交内容含有可疑信息，已拒绝",
        },
        400
      );
    }

    // 5. 调用 GitHub repository_dispatch 触发 workflow
    const githubResp = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "TeachAny-CommunityWorker/1.0",
      },
      body: JSON.stringify({
        event_type: EVENT_TYPE,
        client_payload: payload,
      }),
    });

    if (!githubResp.ok) {
      const errBody = await githubResp.text();
      console.error(`GitHub API error ${githubResp.status}: ${errBody}`);
      return jsonResponse(
        {
          ok: false,
          code: "GITHUB_API_ERROR",
          message: `GitHub 返回 ${githubResp.status}，请联系管理员。`,
          detail: errBody.slice(0, 300),
        },
        502
      );
    }

    // 6. 记录限频 + 返回成功
    await incrementRateLimit(env, ip);
    const submissionId = generateSubmissionId(payload);

    return jsonResponse(
      {
        ok: true,
        submission_id: submissionId,
        message: "课件已成功提交！GitHub Actions 正在处理，约 1-2 分钟后 PR 会自动创建。",
        actions_url: `https://github.com/${REPO}/actions`,
        pulls_url: `https://github.com/${REPO}/pulls`,
      },
      202
    );
  },
};

// ========================================================================
// Helpers
// ========================================================================

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
  // 48h TTL（覆盖跨时区）
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 172800 });
}

function containsSuspiciousContent(payload) {
  // 超级保守的关键词黑名单。命中即拒绝。
  const blacklist = [
    "<script>alert",
    "eval(atob(",
    "document.cookie",
    "onerror=",
    "javascript:",
  ];
  // 注意：packageBase64 不扫（base64 无意义），扫文本字段
  const textFields = [
    payload.name,
    payload.description,
    payload.author,
    payload.user_message,
    (payload.tags || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blacklist.some((kw) => textFields.includes(kw.toLowerCase()));
}

function generateSubmissionId(payload) {
  const ts = Date.now().toString(36);
  const hash = simpleHash(`${payload.node_id}${payload.name}${ts}`);
  return `${payload.subject}-${hash}`;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).padStart(6, "0");
}
