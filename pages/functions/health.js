/**
 * /health  健康检查端点
 * 供 test-worker.yml 等 CI 调用
 */
import { jsonResponse, REPO } from "./_shared/submit-core.js";

export const onRequest = ({ env }) => {
  const hasToken = !!env.GITHUB_TOKEN;
  const hasKV = !!env.RATE_LIMIT_KV;
  return jsonResponse({
    ok: true,
    service: "TeachAny Community Submit API",
    version: "3.0.0",
    channel: "pages-functions",
    repo: REPO,
    bindings: {
      GITHUB_TOKEN: hasToken ? "configured" : "missing",
      RATE_LIMIT_KV: hasKV ? "bound" : "missing",
    },
    timestamp: new Date().toISOString(),
  });
};
