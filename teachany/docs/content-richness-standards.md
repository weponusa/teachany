# 内容丰富度标准（Content Richness）

与 `phases/workflow.md` Phase 0.5 配套。课件生成 Agent **必须**遵守。

## 知识上下文包（KCP）

- 文件：`community/<course-id>/knowledge-context.json`
- 生成：`python3 scripts/knowledge_layer.py lookup --node-id <id> --emit-kcp ...`
- 字段说明见 `docs/CONTENT_RICHNESS_PLAN.md` §6

## 最低内容量（每个 leaf `node_id`）

| 维度 | 最低要求 | KCP 字段 | 不足时 |
|------|----------|----------|--------|
| 课标依据 | ≥ 2 条可引用原文 | `curriculum_excerpts` | web_search 课标 + 标注 fallback |
| 例题/测验 | ≥ 1 道含解析要点 | `exercises` | 由课标摘录改写；或 web_search |
| 易错点 | ≥ 1 条 | `common_errors` | 从课标/教材提炼；或 web_search |
| 习题讲解页 | 完整步骤，引用 `q-*` 或 `ex-*` | HTML `worked-example` | 禁止空讲 |
| 学生可见正文 | 不得出现 `[待补充]` | — | 阻断发布 |

## PLAN.md 必填小节

```markdown
## 知识层引用

| 用途 | KCP ID | 来源 |
|------|--------|------|
| 课标导入 | cp-1 | kp-json#curriculum_points |
| 例题讲解 | ex-7518b66b7126 | kp-json#excerpts |
| 前测题干 | cp-2 | kp-json |
```

## 基线编号（与 baseline-rules 对齐）

- **B-20**：存在 `knowledge-context.json`
- **B-21**：课标摘录 ≥ 2 条（或合计 ≥ 300 字）
- **B-22**：例题用于测验或习题讲解 ≥ 1 道
- **B-23**：易错点出现在互动反馈或易错提示 ≥ 1 条
- **B-24**：学生正文无 `[待补充]`

当前 `check_baseline.sh` 对 B-20～B-22 为 **WARN**（存量课件兼容）；新课件建议视为 FAIL。
