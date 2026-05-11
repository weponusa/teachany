# Cloudflare Pages 一键部署指南（推荐 Git 集成，3 分钟）

## 为什么选 Git 集成而不是 wrangler CLI？

| 方式 | 优点 | 缺点 |
|:---|:---|:---|
| Git 集成（推荐） | 一次设置，每次 push 自动部署；无需本地安装 wrangler；不用 `wrangler login` 开浏览器 | 需要先把 `pages/` 目录 push 到 GitHub |
| wrangler CLI | 本地控制强 | 每个开发者都要 `wrangler login`，且中国开梯困难 |

## 三分钟 Git 集成部署

### Step 1 · Push `pages/` 到 GitHub（30 秒）

```bash
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource
git add pages/
git commit -m "feat(pages): 迁移 community submit 到 Cloudflare Pages Functions"
git push origin main
```

注意：**pre-push hook 只拦截 `examples/` 下的直推，pages/ 路径不受限**，可直接推。

### Step 2 · 在 Cloudflare Dashboard 创建 Pages 项目（1 分钟）

1. 打开 https://dash.cloudflare.com → **Workers & Pages** → **Create application**
2. 选 **Pages** → **Connect to Git**
3. 授权 GitHub，选择 `weponusa/teachany` 仓库
4. 项目配置：
   - **Project name**: `teachany-community`
   - **Production branch**: `main`
   - **Build command**: （留空）
   - **Build output directory**: `pages/public`
   - **Root directory**: 留默认（即仓库根）
5. 点 **Save and Deploy**

构建几秒钟后会得到：
```
https://teachany-community.pages.dev
```

### Step 3 · 绑定 KV + Secret（1 分钟）

#### KV Namespace
在 Cloudflare Dashboard：
- **Workers & Pages** → **KV** → 确认已存在 `RATE_LIMIT_KV`（原 Worker 用的那个，id=`b3e581ff5304472887147e5e436e02db`）
- 回到 Pages 项目 `teachany-community` → **Settings** → **Functions** → **KV namespace bindings**
- Variable name: `RATE_LIMIT_KV` · KV namespace: 选上面那个
- Save

#### GITHUB_TOKEN Secret
- 同页面 → **Environment variables** → **Production**
- Add variable：
  - Variable name: `GITHUB_TOKEN`
  - Value: `github_pat_xxx...` （原 Worker 用的那个 Fine-grained PAT，未过期就能直接复用）
  - **勾选 "Encrypt"**（存为 secret，不在界面显示明文）
- Save

### Step 4 · 触发重新部署（5 秒）

Dashboard 顶部 → **Deployments** → 右上 **Retry deployment**（让 Functions 读到新 secret）。

### Step 5 · 验证（10 秒）

```bash
curl https://teachany-community.pages.dev/health
```

期望输出：
```json
{
  "ok": true,
  "service": "TeachAny Community Submit API",
  "version": "3.0.0",
  "channel": "pages-functions",
  "bindings": {
    "GITHUB_TOKEN": "configured",
    "RATE_LIMIT_KV": "bound"
  }
}
```

如果 `bindings` 显示 `missing`，重新回 Step 3 检查。

## 部署后验证提交流程

```bash
# skill publish_course.sh 默认已指向新 URL
bash ~/.codebuddy/skills/teachany/scripts/publish_course.sh \
  /Users/wepon/WorkBuddy/20260423164213/history-ww2 history-ww2
```

预期看到 `HTTP 202` + PR URL。

## 回滚

如果新 Pages Functions 出现任何问题，暂时改回旧 Worker URL：
```python
# scripts/submit-to-community.py
DEFAULT_WORKER_URL = LEGACY_WORKER_URL  # 或直接写回旧地址
```
