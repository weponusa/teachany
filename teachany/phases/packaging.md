# TeachAny Packaging & Publishing（精简版）

## 仓库说明

`weponusa/teachany` 是轻量主站与 Skill 仓库；真实课件统一放入 `weponusa/teachany-courseware`（本地路径：`~/CodeBuddy/一次函数/teachany-courseware`）。

- 课件目录：`community/<course-id>/index.html`、`manifest.json`、`PLAN.md`、`assets/`
- **线上主域名**：`https://www.teachany.cn/community/<course-id>/`
- GitHub Pages 镜像：`https://weponusa.github.io/teachany-courseware/community/<course-id>/`

## 发布前检查

```bash
python3 "$COURSEWARE_REPO/scripts/validate-courseware.py" <course-id>
# 或
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

## Agent Phase 4 铁律

1. 课件制作完成且验证通过后，**必须执行发布脚本**，不得只留本地文件。
2. **默认入口**：`teachany-publish.sh <course-id>`（自动检测凭据）。
3. **禁止**在未跑 `rebuild-index.py` 的情况下 `git add -A && git push`（会导致线上不挂树）。
4. **禁止**单课发布时用 `git add -A` 把无关未跟踪 KCP/报告一并推上去；用 `auto-publish.sh` 默认的限定暂存。
5. 声称「已上线」前必须：`curl -sI https://www.teachany.cn/community/<course-id>/` 返回 **200**，且知识树节点 **status=active**、**courses 含该 id**。

## 发布路径（编排器自动选择）

### 入口（推荐）

```bash
export TEACHANY_COURSEWARE_REPO=~/CodeBuddy/一次函数/teachany-courseware
bash "$TEACHANY_SKILL/scripts/teachany-publish.sh" <course-id>
```

### ① 维护者直推（本地 Mac + SSH / GH_TOKEN）

```bash
bash "$TEACHANY_SKILL/scripts/auto-publish.sh" <course-id>
```

`auto-publish.sh` v3 流程：

| 步骤 | 动作 |
|------|------|
| 1 | 确认 `community/<course-id>/` 存在 |
| 2 | `validate-courseware.py` |
| 3 | 缺则 `knowledge_layer.py --emit-kcp` |
| 4 | **`rebuild-index.py`**（registry + 树 status/courses + kg-manifest + **sync-node-index-courses**） |
| 5 | `check-courseware-links.py --id <course-id>` |
| 6 | **限定 `git add`**：`community/<id>` + 索引文件 + `data/trees` 变更（非 `-A`） |
| 7 | `git push origin main`（失败则 pull --rebase） |
| 8 | 验证 teachany.cn HTTP 200 + 远端树节点 active |

可选：`--all-changes` 全量暂存；`--dry-run` 只跑检查不 push；`--no-verify` 跳过 URL 轮询。

### ② 无 push 权限（Agent / CI / 社区用户）

```bash
bash "$TEACHANY_SKILL/scripts/publish_course.sh" "$COURSE_DIR" <course-id>
```

走 Cloudflare Worker → PR → 合并后部署。**禁止**在无凭据环境调用 `auto-publish.sh`。

## 凭据检测

```bash
ssh -T git@github.com -o BatchMode=yes -o ConnectTimeout=8 2>&1 | grep -qi successfully && echo "✅ 用 auto-publish" || echo "❌ 用 publish_course"
# 或
[ -n "$GH_TOKEN" ] && echo "✅ 用 auto-publish（HTTPS）"
```

## 挂树验收（线上）

```bash
# 1. 课件可访问
curl -sI "https://www.teachany.cn/community/<course-id>/" | head -1

# 2. 本地树文件（push 后应与线上一致）
python3 -c "
import json
from pathlib import Path
nid='<node_id>'
for p in Path('data/trees').rglob('*.json'):
    d=json.loads(p.read_text())
    for dom in d.get('domains',[]):
        for n in dom.get('nodes',[]):
            if n.get('id')==nid:
                print(p, n.get('status'), n.get('courses'))
"

# 3. node-index（path 用）
python3 scripts/sync-node-index-courses.py --dry-run
```

浏览器：打开 `https://www.teachany.cn/tree.html` → 中国课标 → 对应学科 → 节点 **✅**。

## Gitee

默认不推 Gitee；仅 GitHub `origin main` → teachany.cn。
