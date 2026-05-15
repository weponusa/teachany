# TeachAny Packaging & Publishing（精简版）

## 仓库说明

课件统一放入 `weponusa/teachany` 仓库（本地路径：`~/CodeBuddy/一次函数/teachany-opensource`），`teachany-courseware` 仓库已废弃。

- 课件目录：`community/<course-id>/index.html`、`manifest.json`、`PLAN.md`、`assets/`
- GitHub Pages 地址：`https://weponusa.github.io/teachany/community/<course-id>/`

## 发布前检查

```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

## 发布路径（二选一）

### ① 普通用户 / 社区投稿（推荐，零配置）

**不需要 GitHub 账号或 token**，走 Cloudflare Worker 自动 PR 流程：

```bash
bash "$TEACHANY_SKILL/scripts/publish_course.sh" "$COURSE_DIR" <course-id>
```

课件提交到 `teachany-community.pages.dev`，Worker 验证后自动合并到仓库并部署。

### ② 仓库维护者直推

需要 SSH 或 GH_TOKEN，一条命令完成注册 + 挂树 + 推送：

```bash
bash "$TEACHANY_SKILL/scripts/auto-publish.sh" <course-id>
```

等价手动步骤：
```bash
cd ~/CodeBuddy/一次函数/teachany-opensource
python3 scripts/rebuild-index.py
git add -A
git commit -m "feat: 新增课件 <course-id>"
git push origin main
```

GitHub Actions 自动部署，约 1-2 分钟后可访问：
`https://weponusa.github.io/teachany/community/<course-id>/`

## Gitee 同步（可选，维护者）

```bash
GIT_SSH_COMMAND='ssh -p 22 -o BatchMode=yes -o ConnectTimeout=20' git push gitee main
```
