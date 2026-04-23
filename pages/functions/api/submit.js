/**
 * /api/submit (Cloudflare Pages Function)
 * =========================================
 * POST  课件提交入口
 * OPTIONS CORS 预检
 *
 * 部署后路径：
 *   https://teachany-community.pages.dev/api/submit
 *
 * 绑定要求（在 Pages 项目 Settings 里设置）：
 *   - Environment variable: （无）
 *   - Secret:              GITHUB_TOKEN (Fine-grained PAT, 只给 teachany 仓库 RW)
 *   - KV binding:          RATE_LIMIT_KV → 绑到已有的 KV namespace
 */
import {
  jsonResponse,
  CORS_HEADERS,
  MAX_PACKAGE_BYTES,
  RATE_LIMIT_PER_IP_PER_DAY,
  checkRateLimit,
  incrementRateLimit,
  containsSuspiciousContent,
  createPR,
} from "../_shared/submit-core.js";

// OPTIONS 预检
export const onRequestOptions = () =>
  new Response(null, { headers: CORS_HEADERS });

// POST 提交
export async function onRequestPost({ request, env }) {
  // 1. 限频
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await checkRateLimit(env, ip);
  if (!rl.ok) {
    return jsonResponse(
      {
        ok: false,
        code: "RATE_LIMITED",
        message: `今日已提交 ${rl.count}/${RATE_LIMIT_PER_IP_PER_DAY} 份课件，请明天再来。`,
      },
      429
    );
  }

  // 2. 解析
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

  // 3. 包大小
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

  // 4. 内容粗筛
  if (containsSuspiciousContent(payload)) {
    return jsonResponse(
      { ok: false, code: "CONTENT_REJECTED", message: "提交内容含有可疑信息，已拒绝" },
      400
    );
  }

  // 5. 建分支 + 开 PR
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
        actions_url: `https://github.com/weponusa/teachany/actions`,
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
}

// 兜底：其他 method
export const onRequest = ({ request }) =>
  jsonResponse(
    { ok: false, code: "METHOD_NOT_ALLOWED", message: `Use POST, got ${request.method}` },
    405
  );
