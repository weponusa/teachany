# Phase 3.5 交付闸门（强制 · Agent 必读）

Phase 3 质检通过后、**任何发布命令之前**，必须完成本节两步。跳过即违反 RULES #24a / #24b。

## 3.5a 反馈密码（必须询问）

**必须先问授课教师**（不要替用户编造或默认空密码）：

> 本课将在 `feedback.html` 收集学生学习反馈。请设置一个**课堂反馈密码**（学生提交时需填写），并可选一句**提示语**（如「开学第一周口令」）。  
> 若本课暂不启用反馈密码，请明确回复 **不启用反馈**。

| 教师回复 | Agent 动作 |
|----------|------------|
| 提供口令（+ 可选提示） | 运行 `set-feedback-password.py` 写入 manifest |
| 明确不启用 | `--decline` 写入 manifest，交付说明中注明 |
| 未回答 | **不得**进入 Phase 4；再次询问 |

```bash
python3 "$TEACHANY_SKILL/scripts/set-feedback-password.py" \
  "$COURSE_DIR/manifest.json" --password '<教师提供的口令>' --hint '<提示>'

# 或
python3 "$TEACHANY_SKILL/scripts/set-feedback-password.py" \
  "$COURSE_DIR/manifest.json" --decline
```

校验：

```bash
python3 "$TEACHANY_SKILL/scripts/set-feedback-password.py" --check "$COURSE_DIR/manifest.json"
```

详见课件仓 `FEEDBACK_SETUP.md`（D1、API、哈希格式）。

## 3.5b 是否上传（必须询问）

**必须先问**（不要默认 push、不要因「维护者环境有 SSH」就自动上传）：

> 课件已在本地制作并通过质检，目录：`community/<course-id>/`。  
> 是否上传到 TeachAny 社区并挂入知识树（Gallery + teachany.cn）？  
> - 回复 **上传** / **发布** / **是** → 进入 Phase 4  
> - 回复 **不上传** / **仅本地** → 结束，**不**跑发布脚本

用户明确同意后再执行：

```bash
export TEACHANY_UPLOAD_CONFIRMED=1
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" publish <course-id> --course-dir "$COURSE_DIR"
```

| 用户回复 | Agent 行为 |
|----------|------------|
| 同意上传 | `TEACHANY_UPLOAD_CONFIRMED=1` + 发布脚本 + 验证 URL |
| 拒绝 | 交付标「仅本地，未上传」，**禁止** publish / auto-publish |
| 任务原文已含「制作并发布」 | 可视为已同意，须在交付中写明依据 |

## 交付摘要模板（Phase 3 结束时）

在询问 3.5a/3.5b 之前，可先给出本地验收摘要；**不得**在摘要末尾写「已上线」除非已完成 3.5b 同意且 Phase 4 验证通过。

```text
✅ 本地质检通过：community/<course-id>/
⏳ 待确认：① 反馈密码  ② 是否上传
```
