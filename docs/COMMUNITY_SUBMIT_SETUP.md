# TeachAny 社区提交 Worker 部署指南

> **一次性部署，15 分钟完成。** 部署后所有 TeachAny 用户无需任何配置，就能把自己做的课件自动提交到社区，质检通过后自动合并并注册到 Gallery。

## 🎯 架构概览

```
用户做完课件
  ↓ AI 调 submit-to-community.py
  ↓ POST https://teachany-submit.<你>.workers.dev/api/submit
Cloudflare Worker
  ↓ 限频 + 校验
  ↓ 用 Bot Token 调 GitHub API
GitHub Actions
  ↓ community-submit.yml 创建 PR
  ↓ validate.yml 自动跑 validate-courseware.py
  ↓ 0 错误 → 打 passed-validation 标签
  ↓ auto-merge.yml 检测到标签 → 自动合并
  ↓ community-publish.yml 注册到 Gallery
```

---

## 📋 部署 Checklist（共 5 步，15 分钟）

### ✅ Step 1：注册 Cloudflare 免费账号（3 分钟）

1. 访问 https://dash.cloudflare.com/sign-up
2. 用邮箱注册（免费，永久额度：**每天 10 万请求**、**1 GB KV 存储**）
3. 登录后进入 **Workers & Pages** 面板

### ✅ Step 2：创建 GitHub Fine-grained Token（3 分钟）

1. 访问 https://github.com/settings/personal-access-tokens/new
2. **Token name**: `TeachAny Community Bot`
3. **Expiration**: 1 年（到期前自己提醒换新的，到期后只影响社区提交，不影响任何已发布课件）
4. **Repository access**: 
   - 选 `Only select repositories`
   - 勾选 `weponusa/teachany`
5. **Permissions**（Repository permissions 部分）：
   - `Contents` → **Read and write**
   - `Pull requests` → **Read and write**
   - `Metadata` → **Read-only**（必选）
   - 其他全部留 No access
6. 点 **Generate token**，复制 `github_pat_xxx...`（离开页面就看不到了）

### ✅ Step 3：本地安装 wrangler + 登录（2 分钟）

```bash
# 需要 Node.js ≥ 18
npm install -g wrangler

# 首次使用需登录 Cloudflare
wrangler login
# 会弹出浏览器，点 Allow 完成授权
```

### ✅ Step 4：部署 Worker（5 分钟）

```bash
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource/worker

# 1. 创建 KV namespace（用于限频计数）
wrangler kv namespace create RATE_LIMIT_KV
# 输出大概长这样：
# ✨ Success!
# Add the following to your configuration file in your kv_namespaces array:
# { binding = "RATE_LIMIT_KV", id = "abc123def456..." }

# 2. 把上一步输出的 id 填到 wrangler.toml
# 打开 wrangler.toml，把 REPLACE_WITH_YOUR_KV_ID_AFTER_CREATE 替换成真实 id

# 3. 把 GitHub Token 存到 Worker secret（不入库）
wrangler secret put GITHUB_TOKEN
# 会提示输入，粘贴 Step 2 拿到的 github_pat_xxx... 回车

# 4. 正式部署
wrangler deploy
# 输出大概：
# ✨ Success!
# https://teachany-submit.你的用户名.workers.dev
```

### ✅ Step 5：把 Worker URL 写入代码（2 分钟）

```bash
# 编辑 scripts/submit-to-community.py 第 44 行左右：
DEFAULT_WORKER_URL = "https://teachany-submit.你的用户名.workers.dev/api/submit"

# 然后 commit + push
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource
git add scripts/submit-to-community.py
git commit -m "chore: 更新 DEFAULT_WORKER_URL 为生产地址"
git push origin main
git push gitee main
```

---

## 🧪 端到端验证

### 1. Worker 自检（1 秒）

```bash
curl https://teachany-submit.你的用户名.workers.dev/health
# 应返回 {"ok":true,"service":"TeachAny Community Submit API",...}
```

### 2. 完整链路测试（2 分钟）

```bash
# 在仓库根目录执行
cd teachany-opensource

# 用已有的工业革命课件做提交测试（不会真的合并，只验证链路）
python3 scripts/submit-to-community.py history-industrial-revolution \
    --from examples --dry-run
# 应看到 ✅ 校验通过 + payload 概要（不真的发请求）

# 真实测试（会创建一个测试 PR）
# 建议用一个新的测试课件，别用真的重要课件
python3 scripts/submit-to-community.py some-test-course \
    --from drafts --author "部署自检"
# 应看到 ✅ 已成功提交
```

### 3. GitHub 侧验证

- 打开 `https://github.com/weponusa/teachany/actions` 应看到新建的 workflow run
- 打开 `https://github.com/weponusa/teachany/pulls` 应看到新建的 PR
- 1-2 分钟后 PR 会自动加 `passed-validation` 或 `needs-revision` 标签
- 如果加了 `passed-validation`，`auto-merge.yml` 会紧接着自动合并

---

## 🔧 运维

### 撤销发布权（紧急情况）

如果发现 Worker 被滥用：

```bash
# 方案 A：直接把 wrangler.toml 里的 workers_dev 改为 false，重新 deploy
# → URL 立即 404

# 方案 B：吊销 GitHub Token
# → 去 GitHub Settings → Personal access tokens → 找到 "TeachAny Community Bot" → Revoke
# → 即使 Worker 还活着，它也没法调 GitHub API 了

# 方案 C：关闭 Worker
wrangler delete teachany-submit
```

### 调整限频

编辑 `worker/submit-api.js` 第 22 行：

```javascript
const RATE_LIMIT_PER_IP_PER_DAY = 10; // 改为你想要的值
```

然后 `wrangler deploy`。

### 查看实时日志

```bash
cd worker
wrangler tail
# 会实时显示所有到达 Worker 的请求
```

### KV 用量查看

登录 Cloudflare Dashboard → Workers & Pages → KV → `RATE_LIMIT_KV`  
可以看到所有限频记录（格式 `rl:YYYY-MM-DD:IP`）。

---

## 🧯 常见问题

**Q1：Worker 部署失败，提示 `workers.dev subdomain not found`**  
A：Cloudflare 首次注册后需要在 Dashboard → Workers & Pages → 设置一个 subdomain。选一个 `<你的用户名>.workers.dev` 即可。

**Q2：`wrangler deploy` 报 `Authentication error`**  
A：重新跑 `wrangler login`，确认已授权。或用 `wrangler whoami` 看当前账号。

**Q3：提交时 Worker 返回 `GITHUB_API_ERROR`**  
A：检查 `GITHUB_TOKEN` 是否正确：
```bash
wrangler secret list  # 查看已设置的 secret 名单
wrangler secret put GITHUB_TOKEN  # 重新设置
```

**Q4：PR 创建了但没被自动合并**  
A：检查：
- PR 标签里是否有 `passed-validation`（如果没有，去 Actions 里看 validate.yml 是否跑过）
- PR 标签里是否有 `community-courseware`（auto-merge 要求同时有这两个标签）
- 是否有 `needs-revision` 或 `do-not-merge`（有则会阻止合并）

**Q5：质检一直失败，但用户课件看起来没问题**  
A：把 PR 链接给我，我看评论里 validate-courseware.py 的具体输出。常见是 node_id 在知识树中不存在（对应硬规则 #44）。

---

## 📊 成本

- **Cloudflare Workers 免费版**：每天 10 万请求，TeachAny 一年发 3 万份课件也绰绰有余
- **Cloudflare KV 免费版**：每天 10 万次读 + 1000 次写（限频用量很低）
- **GitHub Actions**：公开仓库完全免费
- **总月成本**：**¥0**

---

## 📚 相关文档

- [`worker/README.md`](../worker/README.md) - Worker 技术细节
- [`community/README.md`](../community/README.md) - 社区贡献规范
- [`skill/SKILL_CN.md`](../skill/SKILL_CN.md) - 第 48 条硬规则（发布权分离基线）

---

*v5.34.9 · 2026-04-19*
