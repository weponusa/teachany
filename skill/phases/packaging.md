# TeachAny Packaging & Publishing（精简版）

## 仓库说明

课件统一放入 `weponusa/teachany` 仓库（本地路径：`~/CodeBuddy/一次函数/teachany-opensource`），`teachany-courseware` 仓库已废弃。

- 课件目录：`community/<course-id>/index.html`、`manifest.json`、`assets/`、`tts/`
- GitHub Pages 地址：`https://weponusa.github.io/teachany/community/<course-id>/`

## 发布前检查

```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

## 发布步骤

```bash
cd ~/CodeBuddy/一次函数/teachany-opensource
python3 scripts/rebuild-index.py
git add community/<course-id> registry.json community/index.json data/
git commit -m "feat: 新增课件 <course-id>"
git push origin main
```

GitHub Actions 自动部署，约 1-2 分钟后可访问：
`https://weponusa.github.io/teachany/community/<course-id>/`

## Gitee 同步（可选）

```bash
GIT_SSH_COMMAND='ssh -p 22 -o BatchMode=yes -o ConnectTimeout=20' git push gitee main
```
