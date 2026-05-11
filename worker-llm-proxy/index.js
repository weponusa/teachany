/**
 * TeachAny LLM Proxy Worker
 * ========================
 * 将客户端 AI 学伴请求代理到 Pollinations 免 Key API，
 * 避免浏览器直接请求 Pollinations 时收到弃用通知。
 *
 * 路由：
 *   POST /v1/chat/completions  → 代理到 text.pollinations.ai/openai
 *   GET  /health               → 健康检查
 *
 * 部署：
 *   cd worker-llm-proxy
 *   npm install -g wrangler
 *   wrangler login
 *   wrangler deploy
 *
 * 部署后得到 URL，如 https://teachany-llm.<you>.workers.dev
 * 将其设为 AI 学伴默认 baseUrl。
 */

const UPSTREAM = 'https://text.pollinations.ai/openai';
const MAX_TOKENS_LIMIT = 4096;
const RATE_LIMIT_PER_IP_PER_MINUTE = 10;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResp({ ok: true, service: 'TeachAny LLM Proxy', version: '1.0.0' });
    }

    if (url.pathname !== '/v1/chat/completions') {
      return jsonResp({ ok: false, error: 'Not found. Use POST /v1/chat/completions' }, 404);
    }

    if (request.method !== 'POST') {
      return jsonResp({ ok: false, error: 'Use POST' }, 405);
    }

    // Rate limit (简单 KV 计数，可选拓展)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_LIMIT_KV) {
      const rl = await checkRate(env, ip);
      if (!rl.ok) {
        return jsonResp({ ok: false, error: 'Rate limited. Please wait a moment.', retry_after: 60 }, 429);
      }
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ ok: false, error: 'Invalid JSON' }, 400);
    }

    // 安全：限制 max_tokens
    if (body.max_tokens && body.max_tokens > MAX_TOKENS_LIMIT) {
      body.max_tokens = MAX_TOKENS_LIMIT;
    }

    // 强制使用 free model
    body.model = body.model || 'openai';

    // 确定是否流式
    const isStream = !!body.stream;

    // 转发到 Pollinations
    try {
      const upstreamResp = await fetch(UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!upstreamResp.ok) {
        const errText = await upstreamResp.text();
        return jsonResp({ ok: false, error: `Upstream ${upstreamResp.status}: ${errText.slice(0, 300)}` }, upstreamResp.status);
      }

      // 计数
      if (env.RATE_LIMIT_KV) {
        await incrementRate(env, ip);
      }

      // 流式转发
      if (isStream) {
        return new Response(upstreamResp.body, {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // 非流式
      const respText = await upstreamResp.text();
      return new Response(respText, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return jsonResp({ ok: false, error: `Proxy error: ${err.message}` }, 502);
    }
  },
};

function jsonResp(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function checkRate(env, ip) {
  const minute = new Date().toISOString().slice(0, 16);
  const key = `rl:${minute}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  return count < RATE_LIMIT_PER_IP_PER_MINUTE ? { ok: true, count } : { ok: false, count };
}

async function incrementRate(env, ip) {
  const minute = new Date().toISOString().slice(0, 16);
  const key = `rl:${minute}:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 120 });
}
