# TeachAny Packaging & Publishing（精简版）

## 仓库说明

`weponusa/teachany` 是轻量主站与 Skill 仓库；真实课件统一放入 `weponusa/teachany-courseware`（线上数据）。**Agent 不必事先 full clone**——发布时自动浅克隆到 `~/.cache/teachany-courseware`，或走 Worker PR。

- 课件目录：`community/<course-id>/index.html`、`manifest.json`、`PLAN.md`、`assets/`
- **线上主域名**：`https://www.teachany.cn/community/<course-id>/`
- GitHub Pages 镜像：`https://weponusa.github.io/teachany-courseware/community/<course-id>/`

## 发布前检查

```bash
python3 "$COURSEWARE_REPO/scripts/validate-courseware.py" <course-id>
# 或
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

## Phase 3.5 闸门（先于 Phase 4 · 强制）

发布脚本**不会**代替 Agent 询问用户。必须先完成：

1. **3.5a 反馈密码**：问教师口令 → `set-feedback-password.py` 写入 manifest → `--check` 通过。详见 `phases/phase3-5-gates.md`。
2. **3.5b 是否上传**：问用户是否上传；仅同意后 `export TEACHANY_UPLOAD_CONFIRMED=1`。

未设置 `TEACHANY_UPLOAD_CONFIRMED=1` 时，`hang_tree.py publish` / `teachany-publish.sh` / `auto-publish.sh` **将拒绝执行**。

## Agent Phase 4 铁律

1. **仅当 3.5a + 3.5b 完成后**才执行发布；不得只留本地却声称已上线。
2. **默认入口**：`TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish <course-id> --course-dir <path>`（课件可在任意目录）。
3. **禁止**在未跑 `rebuild-index.py`（或 PR 合并触发的 CI rebuild）的情况下裸 `git push`（会导致不挂树）。
4. **禁止**单课发布 `git add -A` 夹带无关文件；用 `auto-publish.sh` 限定暂存。
5. 声称「已上线」前：`curl -sI https://www.teachany.cn/community/<course-id>/` 为 **200**，节点 **active** 且 **courses** 含该 id。

## 发布路径（编排器自动选择）

### 入口（推荐 · 无需事先 clone）

```bash
export TEACHANY_UPLOAD_CONFIRMED=1
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" publish <course-id> --course-dir ./community/<course-id>
# 等价：bash "$TEACHANY_SKILL/scripts/teachany-publish.sh" <course-id> --course-dir ./community/<course-id>
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
