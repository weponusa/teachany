# TeachAny Community Submit · Cloudflare Pages Functions

> 从 `worker/` 迁移而来。**原因**：中国大陆网络对 `*.workers.dev` SNI 级阻断，
> 但 `*.pages.dev` 可正常访问。Pages Functions 和 Workers 共享 runtime，代码几乎不变。

## 目录结构

```
pages/
├── wrangler.toml              # Cloudflare Pages 部署配置
├── public/                    # 静态资源（必需，至少一个文件）
│   ├── index.html             # 服务说明页
│   └── _headers               # CORS 头（/api/* 路径）
└── functions/                 # Pages Functions（路径 = 文件路径）
    ├── health.js              # GET /health
    ├── api/
    │   └── submit.js          # POST /api/submit（和 OPTIONS 预检）
    └── _shared/
        └── submit-core.js     # 业务逻辑（createPR / KV 限频 / GitHub API）
```

## 部署

### 前置（一次性）

已有 Cloudflare 账号 + wrangler CLI ≥ 3。

```bash
cd pages/
wrangler login    # 弹浏览器授权
```

### 正式部署

```bash
cd pages/

# 1. 部署（首次会提示创建 project，选 teachany-community）
wrangler pages deploy public --project-name teachany-community

# 2. 绑定 secret（一次性）
wrangler pages secret put GITHUB_TOKEN --project-name teachany-community
# 提示粘贴 fine-grained PAT（见原 Worker 部署文档 Step 2）

# 3. KV binding 在 Cloudflare Dashboard 里绑定（wrangler.toml 已写配置，
#    Dashboard → Pages → teachany-community → Settings → Functions
#    → KV namespace bindings → 确认 RATE_LIMIT_KV 已绑）
```

### 验证

```bash
curl https://teachany-community.pages.dev/health
# 应返回：
# {
#   "ok": true,
#   "service": "TeachAny Community Submit API",
#   "version": "3.0.0",
#   "channel": "pages-functions",
#   "bindings": {
#     "GITHUB_TOKEN": "configured",
#     "RATE_LIMIT_KV": "bound"
#   }
# }
```

## 迁移对照

| 旧 Worker | 新 Pages Functions |
|:---|:---|
| `worker/submit-api.js` | `pages/functions/api/submit.js` + `_shared/submit-core.js` |
| `worker/wrangler.toml` | `pages/wrangler.toml` |
| `https://teachany-submit.weponusa.workers.dev/api/submit` | `https://teachany-community.pages.dev/api/submit` |
| `export default { fetch }` | `export const onRequestPost = (ctx) => ...` |

## 迁移后清理（确认 Pages 可用之后）

旧 Worker 可以保留（不花钱）也可以删除：

```bash
# 保留但 undeploy：
wrangler delete teachany-submit

# 或在 Dashboard 手动删除
```

原仓库的 `worker/` 目录可作为历史记录保留，或打 tag 后删除。

## 为什么不用 GitHub Actions workflow_dispatch？

workflow_dispatch 需要客户端拿 PAT 调 GitHub API → 本质等同于让用户持有写权限 token，
**和 Pages Functions（token 放服务端 secret）相比缺少客户端零凭证的安全优势**。
