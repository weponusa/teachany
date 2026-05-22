# TeachAny Phase Workflow（精简版）

所有课件统一走完整流程（Phase 0→4），不存在"快速模式"。

## Phase 0：定义与检索

目标：明确用户、主题、学段、课型。

最少确认：
1. 学生年级/学段；
2. 知识点或问题；
3. 是否需要 TTS、视频、PBL、地图等增强项（默认全部启用）。

操作：
- 查 `node_id`：`python3 scripts/find_nodes.py "主题"`。
- 若主题不在课标：先找相近节点，再注册；确实无法归类才 `free_mode`。
- 跑 `python3 scripts/preflight-check.py` 检查 Python/Git/Node/ffmpeg/TTS。

## Phase 1：教学骨架

输出一个可执行教学计划：
- 课型：`new-concept` / `review` / `experiment` / `special-topic` / `inquiry-project`。
- 问题锚点：学生一进入页面先选择/输入要解决的问题。
- ABT 叙事：And（已有经验）→ But（冲突/困惑）→ Therefore（本课任务）。
- 互动设计：至少一个真实操作组件。
- 评估设计：前测/即时反馈/迁移题。

PBL 课用：问题 → 假设 → 尝试 → 暴露知识缺口 → 学习 → 再尝试 → 反思。

## Phase 2：构建

### 模板选择

**新课件默认使用 v2 分页模板**：

```bash
cp templates/course-skeleton-v2.html community/<course-id>/index.html
cp templates/manifest-template.json community/<course-id>/manifest.json
```

v2 模板特性：
- 每个教学模块占一整屏（slide-page）
- **最少 12 页**（Baseline B-1 强制），推荐 12-18 页
- **必须包含习题讲解页**（worked example：完整解题思路展示）
- 默认连续滚动浏览，可切换为逐页播放模式
- 底部播放控制栏 + 侧边胶囊段式导航（页码计数器 + 条形指示器）
- 每页对应独立音频，支持自动播放翻页
- 不同页型有不同视觉渐变装饰

**v2 必需页面清单（≥12 页）**：
1. 封面（cover）
2. 引入/问题锚点（interactive）
3. 学习目标（objectives）
4. 前测（quiz）
5. 核心概念 × 2-3 页（concept）
6. **习题讲解**（concept）—— 含完整解题步骤、思路分析、易错提示
7. 互动探究（interactive）
8. 概念测试（quiz）
9. 后测（quiz）
10. 总结（summary）
11. 知识图谱（summary）
12. AI 导师（summary）

仅在维护/修复旧课件时使用 v1（`course-skeleton.html`）。

### v2 内容区块模板

使用 `templates/content-section-templates-v2.html` 中的片段填充 `{{CONTENT_SECTIONS}}`。每个片段已包含 `<section class="slide-page">` 容器，无需额外包裹。

注意：每个 slide-page 必须有 `data-page-index` 属性（从 0 开始递增），并设置合适的 `data-page-type`。

### 构建步骤

1. 复制 v2 模板到课件目录。
2. **删除模板头部注释块**：`<head>` 内 `<meta charset>` 之后的 `<!-- ... -->` 注释（占位符文档）必须删除，不得保留在最终课件中。
3. 填 `course-id`、`node_id`、学科、年级、先修/后续知识。
4. 保留标准模块挂载，不重复手写平台代码。
5. 从 v2 内容区块模板选择片段，填充主体教学页面（≥12 页）。
6. **必须有一页完整的习题讲解**（解题步骤+思路+关键技巧）。
7. 确保 `{{SLIDE_COUNT}}` 设为实际总页数。
8. 补齐 Hero（`gen-hero-svg.py`）、TTS（`tts-engine.py`）、视频/地图等资源。

## Phase 3：验证

```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/check_node_id.py" <node_id>
```

浏览器验证：AI 学伴可打开、知识图谱 tooltip 可点击、音频/视频可播放、移动端布局不崩。

19 项基线全部通过后才进入 Phase 4。

## Phase 4：发布

19 项基线全部通过后执行发布。课件不发布不算完成。

**双仓库架构（v7.14+）**：`weponusa/teachany` 保持轻量，真实课件统一放 `weponusa/teachany-courseware` 的 `community/<course-id>/`。

### ⚠️ 发布铁律

**严禁直接 `git add && git commit && git push` 跳过 `rebuild-index.py`。** 跳过会导致：
- ❌ 课件不挂知识树（knowledge tree 节点 status 仍为 gap/placeholder）
- ❌ registry.json 不更新（Gallery 不显示新课件）
- ❌ nodes-metadata.json 断链（学习路径系统找不到新课件）
- ❌ community/index.json 不更新（前端搜索缺失）

必须使用以下两种发布路径之一：

### ① 普通用户 / 社区投稿（默认，零配置）

**不需要 GitHub 账号或 token**，走 Cloudflare Worker 自动 PR 流程：

```bash
bash "$TEACHANY_SKILL/scripts/publish_course.sh" "$COURSE_DIR" <course-id>
```

脚本完成：打包课件 → 提交到 Worker → Worker 发起 PR → 合并后自动部署。
约 2-10 分钟后可访问：`https://weponusa.github.io/teachany-courseware/community/<course-id>/`

### ② 仓库维护者直推（需要 SSH 或 GH_TOKEN）

```bash
bash "$TEACHANY_SKILL/scripts/auto-publish.sh" <course-id>
```

脚本自动完成：验证目录 → `rebuild-index.py`（注册+挂树+更新 nodes-metadata） → `git commit/push` → 验证线上 URL。

如果不用脚本手动发布，**必须**按此顺序：

```bash
python3 scripts/rebuild-index.py   # ← 绝不可省略！
git add -A
git commit -m "feat: 新增课件 <course-id>"
git push origin main
```

**注意**：直推会立即出现在主分支，跳过 PR 质检流程，仅限维护者使用。

### 发布后验证（两条路径均需执行）

```bash
curl -sI "https://weponusa.github.io/teachany-courseware/community/<course-id>/" | head -1
# 预期：HTTP/2 200
```

URL 未返回 200 时，不得声称"发布完成"。

### 知识树挂载验证

发布后应确认课件已挂树：
```bash
python3 -c "import json; t=json.load(open('data/trees/cn/middle/<subject>.json')); [print(n['id'],n['status'],n['courses']) for d in t['domains'] for n in d['nodes'] if '<node_id>' in n['id']]"
```

节点 `status` 应为 `active`，`courses` 数组应包含新课件 ID。

## Gate 输出格式

交付时给出：
- 模式：完整 / 维护；
- 关键文件；
- 验证命令与输出；
- 发布 URL（如有）；
- 知识树挂载确认（node_id + status=active）；
- 未启用或降级项（如有）。
