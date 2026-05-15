# TeachAny Packaging & Publishing（精简版）

## 仓库说明

课件统一放入 `weponusa/teachany` 仓库（即 `teachany-opensource`），不再使用 `teachany-courseware`。

- 完整课件：`community/<course-id>/index.html`、`manifest.json`、`assets/`、`tts/` 等
- 知识树、registry、脚本均在同一仓库

## 发布前检查

```bash
git status --short
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/find_nodes.py" "知识点"
```

检查：
- `manifest.json.course_id` = 目录名；
- `manifest.node_id` 存在或 `free_mode=true`；
- HTML meta：`course-id`、`course-title`、`course-subject`、`course-grade`；
- Hero、知识图谱、AI 学伴入口、移动端布局可用。

## 发布步骤

```bash
cd teachany-opensource   # 即 weponusa/teachany 本地克隆
python3 scripts/rebuild-index.py
git add community/<course-id> registry.json community/index.json data/ scripts/teachany-kg-manifest.json
git commit -m "feat: 新增课件 <course-id>"
git push origin main
```

GitHub Actions 自动部署到 `weponusa.github.io/teachany`。

## 验证线上

```bash
curl -I https://weponusa.github.io/teachany/community/<course-id>/
```

## Gitee 同步

若 SSH 443 被关闭，可临时用：

```bash
GIT_SSH_COMMAND='ssh -p 22 -o BatchMode=yes -o ConnectTimeout=20' git push gitee main
```

不要修改全局 git/ssh 配置。
