# TeachAny Packaging & Publishing（精简版）

## 仓库分工

| 仓库 | 内容 |
|---|---|
| `teachany-courseware` | 完整课件：`community/<course-id>/index.html`、`manifest.json`、`assets/`、`tts/`、视频等 |
| `teachany` / `teachany-opensource` | Gallery、知识树、registry、脚本；`community/<course-id>/index.html` 只放 redirect |

禁止把完整 HTML 放进 opensource 仓库。

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

### 1. Courseware 仓库

```bash
cd teachany-courseware
git add community/<course-id>
git commit -m "feat: add <course-id> courseware"
git push origin main
```

### 2. Opensource 仓库

创建 redirect：

```html
<!doctype html>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=https://weponusa.github.io/teachany-courseware/community/<course-id>/">
<link rel="canonical" href="https://weponusa.github.io/teachany-courseware/community/<course-id>/">
<title>Redirecting...</title>
<a href="https://weponusa.github.io/teachany-courseware/community/<course-id>/">Open courseware</a>
```

复制/同步 manifest 后运行：

```bash
python3 scripts/rebuild-index.py
git add community/<course-id> registry.json community/index.json data generated teachany-kg-manifest.json
git commit -m "feat: register <course-id>"
git push origin main
```

### 3. 验证线上

```bash
curl -I https://weponusa.github.io/teachany-courseware/community/<course-id>/
curl -I https://weponusa.github.io/teachany/community/<course-id>/
```

## 环境与权限

首次使用或新用户环境必须先检测远端权限。没有 `weponusa/*` 写权限时，提供三选一：
1. 本地交付；
2. 引导 fork；
3. 生成发布补丁/PR。

## Gitee 同步

若 SSH 443 被关闭，可临时用：

```bash
GIT_SSH_COMMAND='ssh -p 22 -o BatchMode=yes -o ConnectTimeout=20' git push gitee main
```

不要修改全局 git/ssh 配置。
