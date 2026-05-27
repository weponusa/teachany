# GitHub Pages ↔ CloudBase 双 CDN 同步

**真相源：** 两个仓库 `main` 分支上的最新代码 → 统一 build → 同时发布。

较新的一方永远是 **Git `main` 上刚构建的产物**；若 CloudBase 落后，用 GitHub 当前版本覆盖 CloudBase，不要用旧 CloudBase 回灌 Git。

## 架构

```text
teachany (main) ──────┐
                      ├── build-cloudbase-dist.sh → dist/cloudbase/
teachany-courseware ──┘         │                    ├── teachany/
                                │                    ├── teachany-courseware/
                                ▼                    └── DEPLOY_SHA.txt
                         GitHub Pages (各自 gh-pages)
                                +
                         CloudBase 静态托管 (合并目录)
```

## 本地命令

```bash
# 1. 构建（默认 sibling ../teachany-courseware）
bash scripts/build-cloudbase-dist.sh

# 2. 部署 CloudBase（需 tcb login 或 API 密钥）
tcb hosting deploy dist/cloudbase -e ai-native-d8g706ji7cd5f763c

# 3. 对账（GitHub hash 必须 == CloudBase hash）
bash scripts/sync-verify-dual-cdn.sh
```

自定义路径：

```bash
COURSEWARE_ROOT=/path/to/teachany-courseware \
OPEN_SOURCE_ROOT=/path/to/teachany-opensource \
DEPLOY_SHA=$(git rev-parse HEAD) \
bash scripts/build-cloudbase-dist.sh
```

## GitHub Actions

| Workflow | 仓库 | 作用 |
|----------|------|------|
| `deploy-pages.yml` | teachany / teachany-courseware | 发布 GitHub Pages |
| `deploy-cloudbase.yml` | teachany-opensource | 拉取两仓库 main → build → CloudBase → 对账 |

### 所需 Secrets（teachany-opensource 仓库）

| Secret | 说明 |
|--------|------|
| `TCB_SECRET_ID` | 腾讯云 API 密钥 ID |
| `TCB_SECRET_KEY` | 腾讯云 API 密钥 Key |

可选（课件仓库 push 后立即触发 CloudBase）：

| Secret | 仓库 | 说明 |
|--------|------|------|
| `CLOUD_BASE_SYNC_TOKEN` | teachany-courseware | PAT，`repo` 权限，可对 `weponusa/teachany` 发 `repository_dispatch` |

未配置密钥时 CloudBase job 会 **跳过部署并 warning**，不影响 GitHub Pages。

## 前端双 CDN

`scripts/unified-loader.js` 在 `*.tcloudbaseapp.com` 域名下自动使用：

- `/teachany-courseware` 作为课件基址
- `/teachany` 作为主站基址

## 一次性追平（CloudBase 落后时）

```bash
git -C ../teachany-courseware pull origin main
git pull origin main
bash scripts/build-cloudbase-dist.sh
tcb hosting deploy dist/cloudbase -e ai-native-d8g706ji7cd5f763c
bash scripts/sync-verify-dual-cdn.sh
```

对账通过即表示 **以较新的 GitHub/main 内容为准** 已完成同步。

## CloudBase 控制台

https://tcb.cloud.tencent.com/dev?envId=ai-native-d8g706ji7cd5f763c#/static-hosting

预览域名：`https://ai-native-d8g706ji7cd5f763c-1327165012.tcloudbaseapp.com/teachany/`
