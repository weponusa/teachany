# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - SKILL v5.34.12 - 2026-04-20

### 🎨 Changed — PPTX 导出改为"图文美观版"

`scripts/export-pptx.py` 完全重写，摆脱 v5.34.0 的"顶部大蓝块 + 左文右小图"
办公风，走现代图文排版：

**6 种自适应版式**

1. **封面页**：左 45% 文字（大字号标题 + kicker 标签 + 品牌色装饰条）+
   右 55% hero 大图；底部徽章条。无 hero 图时用品牌色色块 + 装饰圆点。
2. **节首图卡**（v5.34.12 新增）：每进入"模块一/二/三/四"等新 kicker 时
   自动插入，超大字号模块标题 + 卡片式配图 + 底部进度条。
3. **内容页（有图）**：左文 60% + 右图 40%；图带浅色卡片底 + 圆角。
4. **内容页（双栏）**：bullet ≥ 4 条且无图时自动切双栏，每栏 3-4 条，
   数字徽章 + 浅色卡片底。
5. **内容页（高亮）**：bullet ≤ 3 条且无图时放大字号到 22pt，加大引号
   装饰，避免留白。
6. **题目卡片页**：每 section 的练习题被独立识别、以 2-3 个卡片并排展示，
   琥珀色题号徽章。
7. **互动占位页**：Canvas / 知识图谱 / 视频等 section 降级为全屏卡片 + 大
   emoji 图标 + "回 HTML 体验"入口。
8. **结尾页**：品牌主色全屏 + 装饰圆 + "谢谢观看" 收束。

**设计 Token**

- 配色：浅色主题（白底 + 品牌紫 `#6366F1` + 琥珀点缀 `#F59E0B` + slate 文字阶）
- 字体：中文 Microsoft YaHei、英文 Inter；每个 run 通过 XML 写入双字体，
  避免中文字符回退到 Cambria 等宋体破坏视觉统一。
- 留白 / 内边距 / 装饰条尺寸见 `skill/pptx-design-guide.md`

### 🆕 Added — `skill/pptx-design-guide.md`

独立的 PPTX 设计规范文档，说明：

- 6 种版式何时使用、视觉特征
- 浅色主题的 Design Token（颜色 / 字体 / 字号）
- 排版原则（图片使用、留白、层级、装饰节制）
- **对 AI 的强制约束**：生图只能走宿主 IDE 原生 `image_gen`
- 导出后自查清单（大小 / slide 数 / 图比例）

### 🔒 Security — 生图来源铁律

强化"生图来源"的约束，防止 AI 在生成课件或导出 PPTX 时偷偷调用用户私人
API 消耗配额：

- **SKILL_CN Section 10.4.1** 顶部新增"生图来源铁律"段：只允许走宿主 IDE
  原生提供的 `image_gen` 工具；严禁直连 OpenAI / Gemini / Replicate /
  nano-banana / Tripo / Hunyuan；严禁读取 `.env` / memory 中用户 API Key
  做隐式生图；除非用户在**当前对话中明确要求**用其 key，否则一律不用。
- **硬规则 #34 扩写**：把"生图来源铁律"纳入硬规则；脚本中出现
  `requests → api.openai.com` 等第三方生图调用 → Gate 直接不通过。
- **硬规则 #46 扩写**：明令 `scripts/export-pptx.py` 严禁任何生图调用；
  PPTX 只消费 HTML 已有的 `assets/` 图，不单独生图。

### 🧪 Tested

- `python3 scripts/export-pptx.py examples/history-industrial-revolution`：
  产出 15 slides / 3 图 / 6.7 MB，validator 0 error。
- 逐 slide 打印标题确认：封面 + 3 节首图卡（模块一/二/三）+ 内容页 +
  题目卡片 + 结尾页，版式切换正确。
- `python3 scripts/export-pptx.py examples/bio-asexual-repro`（无图课件）：
  产出 7 slides / 0 图 / 40 KB，validator 正确报出"PPTX 缺图"警告——
  形成"HTML 先补图 → 再导 PPTX"的闭环。

### 📌 对 AI 的工作流约束

导出 PPTX 前，AI 必须：

1. 数一下 HTML 中 `<img src="./assets/">` 的引用数
2. 若 < `max(3, slide_count * 0.3)` → 先用宿主 `image_gen` 补图 + 改 HTML
3. 再跑 `python3 scripts/export-pptx.py`
4. 跑 `python3 scripts/validate-courseware.py` 确认 0 error

---

## [Unreleased] - SKILL v5.34.11 - 2026-04-20

### 🧰 Added — 工具链自检 + 自愈 + 跨模型质量保证

**核心痛点**：国产模型（DeepSeek / Qwen / GLM / Kimi 等）在跑 TeachAny
skill 时，经常在 L2 Remotion / L3 TTS / image_gen 生图 / Leaflet 地图等
"重工具"环节**静默跳过**，导致课件沦为"只有文字卡片"。本版本通过
**事前 preflight + 事后 validator** 双向施压，确保基本质量。

#### `scripts/preflight-check.py`（新增）
Phase 0 强制自检脚本：

- 检测 Python / Node / npm / ffmpeg / cwebp / 中文字体 / pip 包（edge-tts、
  python-pptx、Pillow、BeautifulSoup4、requests）等全套工具链。
- **缺什么自动装什么**：pip 包走 `pip install --user`，系统工具走 brew/apt。
- 输出结构化 JSON 报告 `.teachany-preflight.json`，内含：
  - `capabilities`：8 个能力位（L1_html / L2_remotion / L3_tts / L4_pack /
    L5_pptx / image_gen / webp_compress / map_rendering）
  - `checks`：每项工具的状态（ok / installed_now / fail）+ 一行修复提示
  - `exit_code`：0=就位 / 10=自愈过 / 20=核心缺失必须停止 / 30=image_gen 不可用
- **image_gen 探针**：由 AI 在 Phase 0.5 完成后调用 `image_gen` 生成最小
  测试图并写入 `.teachany-image-gen-probe.json`，preflight 读取其时间戳判定
  24h 有效期。
- **地图 CDN 连通性**：向 cartodb / arcgis / jsdelivr 发 HEAD 请求，≥2 通
  才判定地图能力可用——事前就能发现"用户梯子问题"。
- **Git hook 自安装**：发现 `.git/hooks/pre-push` 未软链到 `scripts/pre-push.sh`
  时自动补装，避免"禁直推"护栏被意外绕过。

#### `scripts/bootstrap-tools.sh`（新增）
跨平台（macOS / Debian / Windows Git-Bash）一键装齐系统工具链：

- 按 OS 自动分派 `brew install` / `apt install` / 打印 `winget` 命令。
- 末尾自动调用 `preflight-check.py --dry-run` 做最终能力评估。
- 支持 `--dry-run` / `--python-only` 两种模式。

### ✏️ Changed — `scripts/validate-courseware.py` 增强 5 项校验

补齐此前 SKILL 写明为"基线强制"但 validator 未覆盖的硬规则：

1. **Canvas 原生使用校验**（硬规则 #33）：HTML 无 `<canvas>` 标签 → error，
   纯文言字词课（chinese + classical/character/pinyin 关键词）可豁免。
2. **Remotion mp4 校验**（硬规则 #32）：缺 `assets/*.mp4` 或 `videos/*.mp4`
   → warn；HTML 引用了 mp4 但文件不存在 → error（死链）。先 warn 不 error
   以便国产模型环境下用户能渐进补齐。
3. **知识图谱校验**（硬规则 #24）：HTML 缺 `id="knowledge-graph"` section
   或 `knowledgeGraphData` 变量 → warn。
4. **地图基线校验**（硬规则 #35/#36）：历史 / 地理课件强制检测——
   - `L.imageOverlay` 全球铺图 `[-90, -180]..[90, 180]` → **error**（硬规则
     严禁的必错位反模式）
   - ECharts `graphic: [{type: 'image'}]` 铺底图 → **error**（同上）
   - 无 `L.tileLayer` XYZ 瓦片调用 → warn
   - 有 tileLayer 但无 `fitBounds` / `setView` → warn（违反硬规则 #36）
5. **视频标签规范**（硬规则 #25）：`<video>` 缺 `controls` 属性 → warn；
   检测到 `createElement('video')` 动态注入 → warn。

### ✏️ Changed — `skill/SKILL_CN.md`

- 硬规则从 49 条扩充至 **50 条**。
- 新增 **硬规则 #50**：Phase 0 必须先跑 `preflight-check.py`，工具不齐禁止
  进入 Phase 1；明确 AI 绝对禁止的 5 条静默跳过行为；定义 image_gen 探针
  协议；与 validator 校验形成闭环。

### 🧪 Tested

- `preflight-check.py --dry-run`：本机 8 项能力均报告正确（image_gen 待探针）。
- `bootstrap-tools.sh --dry-run`：6 个 Python 包检测 + 系统工具检测全部正常。
- `validate-courseware.py history-industrial-revolution`：精准识别该课件
  "缺 Remotion mp4 / 缺知识图谱 / 缺 XYZ 瓦片底图" 3 项短板，不误报已有
  Canvas/TTS/生图 3 项能力。
- `validate-courseware.py bio-asexual-repro`：6 个既存 error 全部来自
  v5.34 之前的规则（AI 学伴 / 生图 / 音频 UI），新加的 Canvas/Remotion/地图
  规则全部以 warn 形式正确报告。

### 📌 对国产模型的特别约束

本次更新后，AI（尤其是国产模型）在 Phase 0 阶段**必须**：

1. 第一步：`python3 scripts/preflight-check.py --json`，把能力报告
   结构化读进上下文。
2. 若 `exit_code in {20, 30}`：**立即停止**，不得进入 Phase 1；把缺失清单
   和修复命令原样转给用户。
3. 若 `exit_code == 10`：在对话中**明示**"本次自动安装了 X/Y/Z"。
4. Phase 0.5 结束前：调用 `image_gen` 生成最小探针并写 probe 文件；
   连续 3 次失败才可按硬规则 #34 降级。
5. **严禁**的静默跳过：
   - 看到 edge-tts 不可用 → 跳 L3
   - 看到 Node 不可用 → 用 Canvas 冒充 Remotion
   - 看到 image_gen 失败 → 全换 emoji
   - 把 preflight 的 error 私自降为 warn 继续跑

---

## [Unreleased] - SKILL v5.34.10 - 2026-04-20

### 🔒 Security — `examples/` 禁止任何形式的直推

彻底关闭"管理员直推官方课件"通道。自本版本起，`examples/<id>/` 下的任何创建/
修改/删除操作只允许通过以下两条合法通道产生：

1. **用户 skill 上传**（99% 默认路径）：`python3 scripts/submit-to-community.py <id>`
   → Cloudflare Worker → PR → auto-merge，由 `github-actions[bot]` 完成最终 commit。
2. **管理员升级通道**（独立命令，后续实现）：升级命令须在 commit message 末尾追加
   Git trailer `TeachAny-Promote: <course-id>`，pre-push hook 与 CI workflow 识别
   该 trailer 后放行。**本仓库刻意不内置升级脚本**，以避免与用户 skill 上传通道混用。

**双层护栏**：

- **本地**：`scripts/pre-push.sh` 升级为 v5.34.10——对本次 push 涉及 `examples/` 的
  每个 commit 做白名单校验（bot commit / merge commit / 带 `TeachAny-Promote:`
  trailer），命中直推立即 exit 1 拒绝 push。
- **服务端**：新增 `.github/workflows/block-direct-push.yml`——push 到 main 后独立
  再校验一次，发现直推即打红叉 + 自动开一条 `direct-push-violation` 标签的 issue
  提醒回滚。

**紧急绕过**（仅 owner、仅非课件 hotfix）：`TEACHANY_ADMIN_BYPASS=1 git push`
只免除本地 hook，服务端 workflow 仍会独立校验——若该 push 仍动到 `examples/`
则照样打红叉。

### ✏️ Changed

- **`scripts/pre-push.sh`**：从"仅校验 validator"升级为"直推拦截 + validator"双阶段。
  新增 `TEACHANY_ADMIN_BYPASS=1` 超级绕过开关与 `TeachAny-Promote:` trailer 识别。
- **`skill/SKILL_CN.md`**：硬规则从 47 条扩充至 49 条；
  - 修订硬规则 #48：删除旧的"AI 三重门条件 A/B/C 可把课件从 drafts 搬到 examples"
    条款（与 #49 冲突），补充"新课件 registry.json status=official 由 #49 规定的
    管理员独立升级命令唯一写入"。
  - 新增硬规则 #49：`examples/` 禁止任何形式的直推；明确双层护栏、紧急绕过的
    严格边界、AI 绝对禁止行为（教用户绕过 hook / 伪造 trailer / 卸载 hook /
    给 workflow 加 paths-ignore 等）；声明 `TeachAny-Promote:` trailer 为公开的
    管理员升级协议。
- **`ADMIN_REVIEW.md`**：新增零节《课件入库通道》，明确两条合法路径、双层护栏与
  紧急绕过边界；修订文档定位为"升级复核 + 违规回滚决策"。

### 🆕 Added

- **`.github/workflows/block-direct-push.yml`**：服务端禁直推 workflow，对 push
  到 `main` 分支的 `examples/**` 变更做白名单校验，违规时自动开 issue 报警。

### 🧪 Tested

- `scripts/pre-push.sh` 本地干跑：bot commit / merge commit / 带 `TeachAny-Promote:`
  trailer 的 commit 均放行；普通 owner commit 直接被拒绝。
- workflow YAML 语法本地解析通过。

### 📌 Note

- 本版本**不提供**任何"把社区课件升级为官方课件"的脚本——该能力将由未来独立的
  管理员 CLI / slash command 实现，以保持"上传"与"升级"两条通道彻底分离。
- 现有 `.github/workflows/admin-promote.yml` 依然保留（它本就是通过 PR label
  触发、由 `github-actions[bot]` 提交，天然满足 #49 的白名单）。

---

## [Unreleased] - SKILL v5.34 - 2026-04-19

### ✨ Added — AI 学伴悬浮球（强制基线）+ PPTX 导出（可选）

- **`scripts/ai-tutor.css` / `scripts/ai-tutor.js`**：新增 AI 学伴公共资源——右下角 FAB 悬浮球 + OpenAI 兼容 API Key 配置 Modal + 360×520 对话面板。首次点击弹出 Key 配置（baseUrl/apiKey/model 三字段，默认 `https://api.openai.com/v1` + `gpt-4o-mini`）；Key 仅保存在 localStorage；支持 SSE 流式答复。
- **学段感知答复**：按 `window.__TEACHANY_TUTOR_CONFIG__.grade` 动态构造 system prompt——小学 2-3 句口语化 / 初中 3-5 句结构化 / 高中 5-8 句可含公式。
- **上下文自动抓取**：从可见 `<section>` / `:target` / IntersectionObserver 命中段提取最多 3000 字作为课件上下文，AI 回答聚焦当前学习内容。
- **`scripts/export-pptx.py`**：新增 HTML → PPTX 导出工具（python-pptx + BeautifulSoup）。按 section 切分幻灯片、提取 `<img>` 作为主图、提取选择题 `handleQuiz` 正确答案、互动组件降级为"扫码/URL 回链"占位页。仅在用户 `output_formats` 包含 `"pptx"` 时触发。
- **`scripts/pack-courseware.cjs`**：打包时自动把 `ai-tutor.css` + `ai-tutor.js` 复制到课件目录（基于 mtime 新旧对比），确保 `.teachany` 包自带学伴资源。
- **`scripts/validate-courseware.py`**：新增 4 项 AI 学伴校验——① HTML 必须引 `ai-tutor.css`；② HTML 必须引 `ai-tutor.js`；③ HTML 必须含 `__TEACHANY_TUTOR_CONFIG__`；④ 严禁硬编码 `'sk-xxx'` 明文 Key。

### ✏️ Changed — SKILL_CN.md

- **Section 10.1**：技术组合表追加 PPTX 行，标注"可选派生件、用户触发"。
- **Section 10.2.1 HTML 骨架模板**：`<head>` 新增 `<link rel="stylesheet" href="./ai-tutor.css">`；`<script>` 最前面注入 `window.__TEACHANY_TUTOR_CONFIG__`；`</body>` 前引入 `<script src="./ai-tutor.js" defer>`。
- **新增 Section 10.2.6**：AI 学伴悬浮球规范（完整架构图 + 配置格式 + 运行时行为 + 安全红线 + 降级策略 + 禁止项）。
- **Phase 0 新增第 8 步**：输出格式选择（默认 `["html"]`，命中 PPTX 关键词或用户显式要求时加 `"pptx"`）。
- **Phase 3 新增 3.7 L5 PPTX 导出 + 3.8 通用能力注入**。
- **Section 12 输出层级表**：从 3 层（L1-L3）扩充至 5 层（L1 互动课件 / L2 Remotion / L3 TTS / L4 打包 / L5 PPTX）。
- **Completeness Gate**：从 27 项扩充至 29 项（+ #28 AI 学伴悬浮球 + #29 PPTX 导出）。
- **硬规则**：从 44 条扩充至 46 条（+ #45 AI 学伴基线 + #46 PPTX 导出基线）；Section 十三标题同步改为 "46 条硬规则"。

### 🔒 Security

- AI 学伴的 API Key **严禁**以任何形式硬编码到课件代码中。
- API Key 仅保存在用户当前浏览器的 localStorage，关闭页面或清浏览器数据后失效。
- 课件不向任何后端或第三方分析服务发送 API Key。
- 配置面板强制显示隐私提示条："Key 仅保存在本浏览器"。

### 🧪 Tested

- `python3 scripts/export-pptx.py examples/bio-asexual-repro` 生成 10 页 40KB 的 pptx，封面/结尾/section 切分全部正确。
- AI 学伴烟雾测试页验证：FAB 渲染、Key 配置弹窗、对话面板、流式答复接口调用路径完整。
- `python3 scripts/validate-courseware.py` 语法校验通过；新增的 4 项学伴校验在 HTML 缺项时正确报错。

---

## [1.4.0] - 2026-04-10 *(superseded by v6.0)*

### ⚠️ Deprecated & Removed in v6.0

- **TeachAny Admin Skill** (`admin-skillhub-package/`): The standalone admin skill that bundled
  generate / validate / pack / publish / push into a 6-phase pipeline has been **removed**.
  Its capabilities are now fully merged into the base TeachAny skill (see v6.0 in
  `skill/SKILL_CN.md`), which no longer requires `GITHUB_TOKEN` or maintainer privileges.
  The original 1.4.0 feature notes are kept as historical context only; the directory
  `admin-skillhub-package/` and the "Option 1b" quick-start entry have been deleted from
  the repository and documentation.

### 🔄 Changed
- TeachAny base skill updated to v5.8 (WorkBuddy multi-agent + layout consistency + AI image/video generation)

## [1.3.0] - 2026-04-08

### ✨ Added — Community Courseware Sharing & Review

- **Community directory structure**: `community/index.json` (approved courseware registry), `community/pending/` (staging area for PR submissions), `community/README.md` (contribution guide & review criteria)
- **Community loader module** (`scripts/community-loader.js`):
  - `fetchCommunityIndex()` — fetch & cache `community/index.json` from GitHub (30-min TTL, offline fallback)
  - `getCommunityCoursesByNodeId(nodeId)` / `getTopCommunityCourses(nodeId, limit)` — query community coursewares by node
  - `downloadAndImportCommunity(course)` — download `.teachany` package from GitHub Releases and import locally
  - `submitToCommunity({token, course})` — auto-create Fork + Branch + PR via GitHub API, uploads complete `.teachany` package (with audio/video) alongside metadata JSON
  - `createShareDialog({course})` — "Share to Community" modal with GitHub Token input and progress feedback
  - `renderCommunityCoursesInTooltip(nodeId, el)` — render community courseware list in Knowledge Map tooltip
  - `renderCommunityGalleryCards(grid)` — render community courseware cards in Gallery
- **Export as .teachany** (`courseware-importer.js`):
  - `exportCourseAsTeachany(id)` — re-package local IndexedDB courseware into a downloadable .teachany ZIP file (includes ALL assets: audio, video, images)
  - Gallery user courseware cards now have a **📦 Export** button for downloading the complete package
- **Knowledge Map integration**: tooltip now shows both local user coursewares and community shared coursewares (🌐 icon), with download buttons for community courses
- **Gallery integration**: community coursewares appear as dedicated cards with 🌐 badge, download button, and author info; each user courseware card now has a "🌐 Share" button and a "📦 Export" button
- **Learning Path integration**: steps now show community shared courseware count alongside local count
- **GitHub Actions CI/CD**:
  - `community-review.yml` — validates PR submissions (JSON schema, required fields, node_id existence, subject validation), auto-adds labels
  - `community-publish.yml` — on merge, auto-updates `community/index.json` and commits via bot
- **Legend update**: Knowledge Map legend now includes "社区共享" (Community Shared) indicator

### 🔄 Changed
- All three pages (`index.html`, `tree.html`, `path.html`) now load `community-loader.js` and pre-fetch community index on page load
- Gallery `filterCourses()` now also applies to community courseware cards
- `courseware-importer.js` — user courseware cards now include a "🌐 Share" button and a "📦 Export" button
- `submitToCommunity()` now packages and uploads the full `.teachany` file (including all media) with the PR; files < 8MB go via Contents API, larger ones via Release draft + local download fallback that opens the community share dialog

## [1.2.0] - 2026-04-08

### ✨ Added — Community Courseware & Likes
- **Multi-courseware per node**: The same knowledge node can now have multiple user-uploaded coursewares (removed node_id deduplication, each import generates a unique ID with timestamp suffix)
- **Like system** (`localStorage` + `sessionStorage`):
  - `likeCourse(id)` / `unlikeCourse(id)` / `toggleLike(id)` — increment/decrement/toggle likes
  - `getCourseLikes(id)` — read like count
  - `isLikedInSession(id)` — check if liked in current session
  - Likes stored in `teachany_course_likes` key, session state in `sessionStorage`
- **Sorted community courseware list**: `findUserCoursesByNodeId(nodeId)` returns all coursewares for a node sorted by likes descending; `getTopCoursesByNodeId(nodeId, limit=5)` returns top N
- **Knowledge map tooltip**: Shows ranked community courseware list (up to 5) with inline like buttons and direct launch links per course
- **Learning path**: Displays community courseware count and like info for each step; always opens the highest-liked courseware
- **Gallery cards**: Each user courseware card now shows a ❤️ like button with live count

### 🔄 Changed
- `addUserCourse()` no longer deduplicates by `node_id` — multiple coursewares for the same node coexist
- `buildCourseId()` accepts optional `forceUnique` flag to append timestamp-based suffix
- `findUserCourseByNodeId()` now returns the highest-liked courseware (backward-compatible)
- `addTreeUploadButton()` rewritten: shows ranked courseware list + upload button regardless of node status
- `removeUserCourse()` now also cleans up associated like data
- Expanded `window.TeachAnyImporter` exports with 7 new APIs

## [1.1.0] - 2026-04-08

### ✨ Added
- Added standard `.teachany` courseware packaging spec in `docs/courseware-package.md`
- Added browser-side importer in `scripts/courseware-importer.js` with support for `.teachany`, `.zip`, and single-file `.html`
- Added `imported-course.html` viewer for opening imported courseware through a controlled iframe flow
- Added courseware packaging script `scripts/pack-courseware.cjs`
- Added missing media pipeline utilities promised by the TeachAny skill:
  - `scripts/generate-tts.py`
  - `scripts/generate-srt.py`
  - `scripts/render-all.js`
  - `generate-sfx.js`

### 🔄 Changed
- Upgraded imported course storage from `localStorage + htmlDataUrl` to `localStorage` index + `IndexedDB` payloads
- Updated `tree.html` to open imported courseware through the new viewer page
- Updated `path.html` to recognize:
  - official courseware
  - user-imported courseware
  - legacy node-level progress (`teachany_progress`)
  - per-course progress (`teachany_progress_{courseId}`)
- Unified knowledge-layer tooling so `scripts/knowledge_layer.py` and `audit.cjs` both accept:
  - top-level array `_errors.json` / `_exercises.json`
  - legacy wrapped `{ "errors": [...] }` / `{ "exercises": [...] }`
- Updated `data/schema.md` to document array-top-level as the canonical format
- Unified repository links to `weponusa/teachany`
- Redirected `gallery/index.html` to the root `index.html` to avoid page drift
- Updated README badges and course lists from 5 to 7 sample courses

### 🐛 Fixed
- Fixed ZIP import fallback so missing `manifest.json` no longer incorrectly treats the ZIP itself as HTML text
- Fixed imported course opening flow so multi-file packages can be restored instead of storing only `index.html`
- Fixed skill doc/code drift by adding the missing scripts that had already been documented

## [1.0.0] - 2026-04-06

### 🎉 Initial Release

#### Skill Definition
- Complete TeachAny (教我学) Skill in English (`skill/SKILL.md`) and Chinese (`skill/SKILL_CN.md`)
- 6+ learning science theories integrated: ABT Narrative, Bloom's Taxonomy, ConcepTest, Cognitive Load Theory, Mayer's Multimedia Principles, Scaffolding Strategy
- 9 subject-specific frameworks: Math, Physics, Chemistry, Biology, Geography, History, Chinese Language, English, IT
- Five-Lens Method for difficulty decomposition
- 4-Phase development workflow with Phase 4 review checklist

#### Example Courses (5 courses across 4 subjects)
- 📐 **Quadratic Functions** (Math, Grade 9) — Canvas graphing, vertex dragging, step-by-step derivation
- 📏 **Linear Functions** (Math, Grade 8) — Slope/intercept sliders, real-time graphing
- 🧬 **Meiosis & Fertilization** (Biology, Grade 10) — Cell division simulation, chromosome drag-and-drop
- 🌍 **Global Monsoon Systems** (Geography, Grade 10) — Leaflet map, wind pattern visualization
- 💧 **Liquid Pressure & Buoyancy** (Physics, Grade 8) — Experiment simulation, parameter adjustment

#### Documentation
- Bilingual README (English + Chinese)
- Methodology deep dive with academic references
- Getting started guide
- Design system specification
- Contribution guidelines

#### Project Infrastructure
- MIT License
- GitHub Issue templates
- HTML validation CI workflow
- Online Gallery (GitHub Pages)

---

### Skill Version History

| Version | Date | Changes |
|:--------|:-----|:--------|
| v5.4 | 2026-04-07 | Added `.teachany` courseware packaging, browser import flow, and Gallery/knowledge-map upload entry |
| v4.0 | 2026-04-06 | Added Remotion / Edge TTS / subtitle pipeline specification and cost estimation |
| v3.0 | 2026-04-06 | Added Bloom table, lesson types, scaffolding, Mayer principles, Five-Lens guide, 3-subject examples, design specs, Phase 4 checklist |
| v2.0 | 2026-03 | Split into universal foundation + subject adaptation layer |
| v1.0 | 2026-02 | Initial math/science courseware edition |
