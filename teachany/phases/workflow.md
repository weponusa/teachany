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
- 若主题不在课标：先找相近官方 `node_id`；仅 PBL 路径拆解出的课标外知识点使用 `ext-{8位hex}`（见 `scripts/pbl-path.js`），并写入 manifest / `teachany-node`。
- **禁止**把 K12 常规课、探究课（`inquiry-project`）挂进「其他知识」；探究课应挂到已存在的课标 `node_id`（如 `math-m-linear-function`）。
- 跑 `python3 scripts/preflight-check.py` 检查 Python/Git/Node/ffmpeg/TTS。

## Phase 0.5：知识层注入（强制 · P0）

目标：课件内容必须来自可审计的知识层数据，而不是仅凭模型记忆。

在 Phase 1 之前**必须**完成：

```bash
# 在 teachany-courseware 根目录执行（已确认 node_id 后）
python3 scripts/knowledge_layer.py lookup \
  --node-id <node_id> \
  --subject <history|math|physics|...> \
  --emit-kcp community/<course-id>/knowledge-context.json
```

1. 将输出的 `knowledge-context.json` 保存到课件目录。
2. 在 `PLAN.md` 增加 **「知识层引用」** 表：列出使用的 `cp-*` / `ex-*` / `q-*` / `err-*` 编号。
3. Phase 1 教学骨架中的**前测/例题讲解/后测题干**须能对应 KCP 中的条目 ID。
4. 若 `gaps` 含 `exercises<1` 或 `common_errors<1`：  
   - 优先从 KCP 课标摘录设计题干；  
   - 仍不足时 **必须** `web_search` 补充，并在 PLAN 标注 `source: web_fallback`；  
   - 禁止把 `[待补充]` 写进面向学生的正文。

详细标准见 `teachany/docs/content-richness-standards.md`。

## Phase 1：教学骨架

输出一个可执行教学计划（**须引用 Phase 0.5 的 KCP**）：
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
8. 补齐 Hero（`gen-hero-svg.py`）、TTS（`tts-engine.py`）、视频/地图等资源。若涉及教学动画/互动动画，先按 `tech/animation-toolchain.md` 选型：算法/流程用 Motion Canvas，数学推导用 Manim，实验探究用 PhET/GeoGebra/3Dmol/Matter.js，页面实时操作用 Canvas/SVG；不得用占位视频冒充教学动画。

## Phase 3：验证

```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/check_node_id.py" <node_id>
```

浏览器验证：AI 学伴可打开、知识图谱 tooltip 可点击、音频/视频可播放、移动端布局不崩。

19 项基线全部通过后才进入 Phase 3.5。

## Phase 3.5：交付闸门（强制 · 两步缺一不可）

Phase 3 验证通过后、**任何发布脚本之前**，必须完成 **3.5a 反馈密码** 与 **3.5b 是否上传**。完整话术与命令见 **`phases/phase3-5-gates.md`**。

**Agent 禁止行为**：
- 禁止课件做完后直接 `git push`；须 `hang_tree publish` / `teachany-publish`（内含 rebuild-index 挂树）
- 禁止未询问就替教师设置或留空反馈密码
- 禁止在用户未同意上传时声称「已上线」「已发布」

### 3.5a 反馈密码（必须先问教师）

询问教师设置课堂反馈口令（及可选提示），写入 `manifest.json`：

```bash
python3 "$TEACHANY_SKILL/scripts/set-feedback-password.py" \
  "$COURSE_DIR/manifest.json" --password '<口令>' --hint '<提示>'
# 教师明确不要：--decline
python3 "$TEACHANY_SKILL/scripts/set-feedback-password.py" --check "$COURSE_DIR/manifest.json"
```

### 3.5b 是否上传（必须先问用户）

用户同意上传后：

```bash
export TEACHANY_UPLOAD_CONFIRMED=1
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" publish <course-id> --course-dir "$COURSE_DIR"
```

| 用户回复 | Agent 行为 |
|----------|------------|
| 明确同意上传 | `TEACHANY_UPLOAD_CONFIRMED=1` → Phase 4 → 验证 URL + 挂树 |
| 明确拒绝 / 仅本地 | **不**调用任何发布脚本；交付标「仅本地，未上传」 |
| 未表态就要求「完成」 | 给出本地验收摘要，**再次询问** 3.5a + 3.5b |
| 上下文已明确「制作并发布」 | 可视为已同意上传（交付中注明依据）；**仍须完成 3.5a 反馈密码询问** |

**本地制作完成 ≠ 发布完成**：拒绝上传时，课件算「制作交付完成」，不算「线上发布完成」。

## Phase 4：发布（仅用户同意后）

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

### ② 仓库维护者直推（需要 SSH 或 GH_TOKEN，无事先 clone）

```bash
TEACHANY_UPLOAD_CONFIRMED=1 python3 "$TEACHANY_SKILL/scripts/hang_tree.py" publish <course-id> --course-dir "$COURSE_DIR"
# 或：bash "$TEACHANY_SKILL/scripts/auto-publish.sh" <course-id> --course-dir "$COURSE_DIR"
```

无本地 courseware 时会浅克隆到 `~/.cache/teachany-courseware`，再 `rebuild-index.py` 挂树 → push → 验证 teachany.cn。

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

- **课标内 `node_id`**：检查 `data/trees/cn/**` 等正式树中该节点的 `courses`。
- **`ext-{8位hex}`**：检查 `data/trees/other/user-generated.json`（「其他知识」），**不应**出现在正式 K12 树。

### teachany.cn 与挂树时机

社区路径（`publish_course.sh`）合并后，由 **`community-publish.yml`** 在远端执行 `rebuild-index.py` 并部署 `gh-pages`；`www.teachany.cn` 课件地址与 registry 更新依赖该 workflow 成功。

维护者直推（`auto-publish.sh`）在本地先 `rebuild-index.py` 再 push，挂树立即写入 `main`。

## 发布链路已知问题（排查用）

| 问题 | 影响 | 处理 |
|------|------|------|
| `check_node_id.py` 曾只读 `teachany-opensource/data/trees` | 与线上权威源不一致 | 已改为优先读 `teachany-courseware/data/trees` |
| `teachany-free-mode` 会清空 `node_id` | PBL `ext-*` 被误删，无法进「其他知识」 | `publish_course.sh` 对 `ext-*` 保留 node_id |
| Worker 不可达 | 只落到 `drafts/`，未进 Git | 重跑 `publish_course.sh` 或设 `TEACHANY_DIRECT_TOKEN` |
| 脚本轮询验 `github.io`，非 `teachany.cn` | 主站 CDN 可能晚几分钟 | 合并后再 `curl -I https://www.teachany.cn/community/<id>/` |
| 跳过 `rebuild-index` 直 push | Gallery/树/registry 不同步 | 禁止；社区路径靠 CI，维护者必须跑脚本 |
| `node_id` 不在树且非 `ext-*` | 发布前被拦或上线不可见 | Phase 0 用 `find_nodes.py` 对齐课标或 PBL ext |

## Gate 输出格式

交付时给出：
- 模式：完整 / 维护；
- 关键文件；
- 验证命令与输出；
- **上传确认**：用户是否同意上传；若拒绝，写明「仅本地交付」；
- 发布 URL（仅已上传时）；
- 知识树挂载确认（node_id + 树文件 + status=active）；
- 未启用或降级项（如有）。
