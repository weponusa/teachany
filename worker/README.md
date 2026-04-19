# TeachAny Community Submit Worker

这是一个 Cloudflare Worker，作为用户（`submit-to-community.py`）和 GitHub API 之间的安全中转。

## 为什么需要它？

### 问题
普通用户做课件时，不可能要求他们：
- 注册 GitHub 账号
- 创建 Fine-grained token
- 配置 `.teachany-token` 文件

### 解决方案
- 把 **TeachAny 官方的 GitHub Bot Token** 存在 Cloudflare Worker 的 secret 里（私密）
- 用户的 `submit-to-community.py` 只需要 POST 到 `https://teachany-submit.<你>.workers.dev/api/submit`
- Worker 收到后用 Bot Token 代为调用 GitHub API 开 PR
- 限频 + 格式校验 + 恶意内容过滤都在 Worker 层完成

### 结果
- 用户 **零配置**
- Token **永不泄漏**（不在任何 public 代码里）
- 滥用 **有限频兜底**（每 IP 每天 10 份）

## 架构图

```
用户本地                                     Cloudflare Worker                    GitHub
┌────────────────────────┐                   ┌────────────────────┐              ┌────────────┐
│ AI 做完课件            │   POST JSON       │ /api/submit        │              │            │
│   ↓                    │ ────────────────> │  - 限频            │              │ dispatches │
│ submit-to-community.py │                   │  - 字段校验         │ ───────────> │  event     │
│   ↓                    │                   │  - 恶意内容过滤     │              │            │
│ (本地打包 + base64)     │ <──────────────── │  - 调 Github API   │ <─────────── │ 200 OK     │
└────────────────────────┘   202 Accepted    └────────────────────┘              └────────────┘
                                                       │
                                                       │ secret: GITHUB_TOKEN
                                                       ▼
                                              ┌────────────────────┐
                                              │ KV: RATE_LIMIT_KV  │
                                              │ (每 IP 每天计数)    │
                                              └────────────────────┘
```

## 部署步骤

详见 [`../docs/COMMUNITY_SUBMIT_SETUP.md`](../docs/COMMUNITY_SUBMIT_SETUP.md)。

## 本地开发

```bash
cd worker
npx wrangler dev
# 本地运行在 http://localhost:8787
```

测试健康检查：
```bash
curl http://localhost:8787/health
```

## 文件说明

| 文件 | 说明 |
|:---|:---|
| `submit-api.js` | Worker 主脚本 |
| `wrangler.toml` | 部署配置 |
| `README.md` | 本文件 |
