# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
