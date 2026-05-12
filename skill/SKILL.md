---
name: TeachAny
description: "K-12 (elementary/middle/high school, ages 6–18, 小学初中高中) lesson and courseware creation. Use this skill whenever the user — including parents, teachers, or students — wants to build, design, or improve a teaching/learning artifact for a school-age student studying a specific subject topic. Concrete trigger scenarios: (1) creating an interactive web page that explains a school concept (math, physics, chemistry, biology, geography, history, Chinese 语文, English, IT); (2) designing a lesson plan or 一节课, 备课; (3) turning a static PPT or notes into an interactive page; (4) helping a parent/teacher whose specific student (儿子/女儿/学生) can't grasp a topic ('我儿子初二搞不懂浮力'); (5) making educational animations, 教学动画, micro-lectures, or 微课视频; (6) adding TTS narration / hero infographic / AI tutor (AI 学伴) / knowledge graph / 互动地图 to existing lesson content; (7) batch-maintaining a TeachAny courseware repository, debugging modules like TeachAnyTutor/TeachAnyAdaptive/TTSNarrator, working with course IDs (phy-light-refraction, hist-m-tang-dynasty, math-quadratic-vertex-form), publishing to TeachAny gallery, registering nodes, free_mode courseware, ext-* learning paths; (8) **publishing/registering/pushing an existing courseware to the gallery / knowledge graph / git remote** (发布课件, 注册到知识图谱, 上传到 gallery, 推送到 git, auto-publish, register-and-push, 三仓发布, rebuild-index). Trigger keywords (any one helps): 课件, 互动课件, 教学动画, 教学设计, 给学生上课, 备课, 一节课, 讲一节, 这一课, AI 学伴, 知识图谱, hero 图, TTS 朗读, 互动地图, 历史地图, hillshade, 课标, IB, A-Level, AP, K-12, K12, lesson, courseware, micro-lecture, instructional design, **发布课件, 注册课件, 上传课件, 推送课件, rebuild-index, 自动注册, 自动推送, auto-publish, 三仓发布**. Trigger even without explicit keywords when the request is fundamentally about helping a school-age student learn a specific topic — examples that all qualify: '我儿子初二搞不懂浮力，做个能玩的页面', '下周二讲细胞分裂这节课怎么上', '把这份讲二元一次方程组的 PPT 改造成可互动的', '做一节关于丝绸之路的初中历史课', '把这个课件发布到 gallery', '没有自动注册上传'. Do NOT trigger for: corporate/employee training (企业培训, 员工培训, 销售培训, 产品培训), adult skill education (成人编程教学, 30 岁学 Rust), tutoring chatbots / Q&A 客服 (AI 答疑客服, 24 小时辅导客服), student management systems (选课系统, 排课, 成绩数据分析), generic web/app development unrelated to teaching content, PPT-only document conversion (会议纪要转 PPT), or museum/exhibition pages targeting general visitors rather than K-12 students."
---

# TeachAny: K-12 Interactive Courseware Development

A skill for designing K-12 lessons as **interactive learning experiences** — not "knowledge dumped onto a page", but courseware with motivation, rhythm, interaction, and assessment loop.

**Default principle**: Learning loop first, visual polish second. Student comprehension first, page aesthetics second.

This skill assumes you have access to standard tools (file edit, web fetch, image generation, shell). It walks you through a 4-phase workflow and points to deeper references only when you actually need them.

---

## When to use this skill

Activate when the user asks to:
- "Make/create/build a courseware on [topic] for [grade]" — including any K-12 subject
- "Design a lesson / explain [concept] interactively / turn this into an interactive page"
- "Add exercises / interactions / AI tutor / TTS / hero image / knowledge graph to a courseware"
- "Publish/release/upload a courseware to TeachAny gallery"
- "Fix / batch-update / migrate / audit existing TeachAny courseware"

When the work involves both instructional design AND production (HTML/animation/audio/video), this skill leads. Combine with PPTX/Word skills only when export to those formats is the explicit final goal.

For Chinese-speaking users or detailed Chinese explanations, also load `references/SKILL_CN.md`.

---

## The 4-phase workflow (memorize this)

```
Phase 0: Define & Lookup → who/what/why, find node_id in knowledge tree
Phase 1: Skeleton        → ABT narrative, lesson type, scaffolding plan
Phase 2: Build           → HTML + 16-item baseline (see below)
Phase 3: Verify & Ship   → quality gate, package, publish
```

For full Phase-by-Phase instructions, read `references/workflow.md`.

---

## 17-item baseline (every courseware MUST have these)

A "complete" TeachAny courseware is not just an HTML file. It must ship with all 17 items below — these are non-negotiable because they together create the learning loop **and the publishing loop**. Skipping any one of them produces a courseware that looks finished but doesn't teach OR doesn't reach students (orphaned local files don't count as published).

> **Chinese aliases for triggering**: 17 项基线 / 17 件套 · TTS 旁白 · Remotion 视频 · Canvas 互动 · AI 插画 · Hero 图 · 音频播放器模块 · 知识图谱 · AI 学伴 / AI 导师卡片 · 五件套 · 顶部品牌栏 · 提及即配图 · 库优先地图 · 自动注册推送 / auto-register-and-push

| # | Item | Chinese alias | Why it matters |
|:-:|:---|:---|:---|
| ① | TTS narration audio (`tts/s01.mp3` ~ `s0N.mp3`) + `data-tts` attributes. **Quality gate: must use edge-tts (L0) or macOS `say` (L2) — NEVER pyttsx3 (L3) or silent (L4)** | TTS 旁白 / 朗读 | Multimodal learning; helps non-readers and keeps attention. Silent/robotic voice defeats the purpose. |
| ② | Remotion-rendered MP4 (≥1, with audio track) for the core dynamic concept | Remotion 视频 / 动画 | Process-oriented concepts need motion, not static infographics |
| ③ | Canvas/SVG interactivity with real computation logic (not decorative) | Canvas 互动 / 真实计算 | Active learning > passive viewing |
| ④ | AI-generated illustrations (≥2, subject-specific, not generic). **Mention-means-image rule: every specific artwork/figure/scene named in the text must have its own image** (e.g., text mentions "拉斐尔《椅中圣母》" → must embed that image). Use `image_gen` OR web search for public-domain references. | AI 插画 / 学科插图 / 提及即配图 | Concrete imagery anchors abstract concepts. Saying "look at this painting" without showing it breaks the learning chain. |
| ⑤ | Hero knowledge-structure infographic (top of page) | Hero 图 / 知识结构图 / 信息图 | Gives students the mental map before details |
| ⑥ | Audio player module with track playlist | 音频播放器模块 / 旁白播放器 | Lets students re-listen at their own pace |
| ⑦ | Knowledge graph section **using standard module API**: `<div data-teachany-kg="<node_id>"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>`. **Do NOT hand-write `<h2>/<p>/.kg-container/.kg-row` HTML** — `teachany-knowledge-graph.js` reads `teachany-kg-manifest.json` and renders the graph automatically (visual style aligned with `tree.html`). Hand-written HTML produces inconsistent visual style and breaks future module updates. | 知识图谱区块 / 标准模块 / data-teachany-kg | Connects this lesson to prerequisites and next steps via the SAME visual language as the global knowledge map. Hand-writing breaks consistency. |
| ⑧ | AI tutor card **using standard module API**: `<div data-teachany-tutor-card></div>`. **Do NOT hand-write the card content** — `teachany-tutor-card.js` auto-renders the icon/title/description/buttons/suggested questions, all 主题感知 from `<title>` and `course-subject`. | AI 学伴 / AI 导师卡片 / 标准模块 / data-teachany-tutor-card | The whole point of standard modules is consistent UX across all coursewares; hand-writing cards re-introduces fragmentation. |
| ⑨ | Section hints (`teachany-section-hints.js`) | 段落提示 | Reduces cognitive load, signals what each section is for |
| ⑩ | TTS narrator overlay (`teachany-tts-narrator.js`) | 朗读叠加层 / 同步高亮 | Synced narration playback |
| ⑪ | AI tutor JS (`ai-tutor.js`) | AI 学伴后端逻辑 | Backend logic for tutor card |
| ⑫ | Knowledge graph JS (`teachany-knowledge-graph.js`) | 知识图谱 JS | Renders the graph from registry data |
| ⑬ | All 5 modules (`ai-tutor` + `tutor-card` + `tts-narrator` + `section-hints` + `knowledge-graph`) loaded in `<head>` and `<body>` | 五件套 / Five-piece suite | They work as a system, not as separate widgets |
| ⑭ | `manifest.json` with valid `node_id` (must exist in `data/trees/*.json`) | manifest 元信息 / node_id 入树 | Wiring into the global knowledge tree |
| ⑮ | **Top brand bar with DUAL version**: TeachAny logo + Gallery link (`https://weponusa.github.io/teachany/`) + **course version** (`<meta name="course-version">`, e.g. `v1.0.0`) + **skill version** (`<meta name="teachany-version">`, e.g. `·skill v7.10.1`) — both versions must be visible in the bar. Pinned at top of the page. | 顶部品牌栏 / 顶栏 / 双版本 / skill 版本 | Students need to know what platform this is, navigate to other lessons, and see BOTH which courseware version (for content updates) and which skill version (for capability/format updates) they're using. Showing only one version hides half the truth. |
| ⑯ | **Real map base for history/geography courseware** — **library-first principle**: ALWAYS check the skill's bundled `assets/maps/` library FIRST (207 files, 104MB), only generate new if no library match. Output: `hillshade.jpg` + `boundaries.geojson` + `places.geojson` via Leaflet/D3. **⛔ Projection-alignment rule**: library hillshade is global 4096×2048 Plate Carrée — `L.imageOverlay` bounds MUST be `[[-90,-180],[90,180]]` (global), then use `map.fitBounds(<region-bounds>)` to zoom. Setting bounds directly to a region (e.g. `[[35,-10],[60,30]]` for Europe) stretches the global image into that frame and offsets every coordinate. | 地图底图 / 库优先 / 投影对齐 / Plate Carrée | Real terrain + borders for spatial intuition. Wrong bounds = terrain-and-border mismatch (mountains in wrong country, cities floating in sea). |
| ⑰ | **Auto-register and push** (DEFAULT, not optional) — after finishing/modifying ANY courseware, automatically execute the 3-repo publishing chain: (a) commit + push **courseware repo** (full HTML/TTS/assets/videos to `weponusa/teachany-courseware`); (b) generate 11-line redirect + copy `manifest.json` into **opensource repo**, run `python3 scripts/rebuild-index.py` to update registry + knowledge tree, commit + push to `weponusa/teachany`; (c) if skill itself was modified, push **skill repo** changes too. **Skip ONLY when user explicitly says "不要发布/不要上传/只做不推/don't publish/just local"**. | 自动注册推送 / auto-register-and-push / 三仓发布 | A courseware that exists only on your local disk doesn't reach students. The publishing loop is part of "completion", not an afterthought. The whole point of TeachAny is shared coursewareware. |

**Key tooling**:
- Hero image lookup: `python3 scripts/find-hero.py <course-id>` (CDN-first, image_gen fallback)
- **Map library lookup (USE THIS FIRST for ⑯)**: `python3 scripts/find-map.py <keyword>` — searches bundled library of 207 maps before any generation. Examples: `find-map.py 唐` (Tang dynasty), `find-map.py --era 1500` (world map ~1500 CE), `find-map.py --base hillshade` (terrain base), `find-map.py --boundary country` (national borders). Use `--copy <file> <dst>` to copy from library into courseware.
- Map bundle into courseware: `bash scripts/bundle_map_assets.sh <course-dir>` (auto-scans HTML for `.geojson` references and copies from library)
- TTS generation: `python3 scripts/tts-engine.py <text> <output.mp3>` — **set `TEACHANY_TTS_MIN_QUALITY=L2` env var to fail-fast if engine degrades to pyttsx3 or silent**
- Five-piece batch injection: `python3 scripts/apply-standard-modules.py [--only <path>]`
- Quality gate: `node scripts/validate-courseware.cjs ./community/<course-id>`
- **Image sourcing decision tree for items ④⑯**: (a) Check `assets/image-registry.json` / `assets/maps/MANIFEST.json` / CDN first; (b) if no match and image is a **specific historical artwork** (e.g., Mona Lisa, David sculpture), search web for a public-domain scan — Wikimedia Commons is the canonical source; (c) if no match and image is an **educational concept illustration**, use `image_gen` with subject-specific prompt; (d) never fake "see this image" without an actual image.
- **Map sourcing decision tree for ⑯**: (a) `find-map.py <keyword>` to query bundled library; (b) if hit → `--copy` into courseware (seconds, no token cost); (c) only if library has zero match → check `naturalearthdata.com` / `cshapes.sgendata.com` / `historical-basemaps`; (d) only as last resort → generate hillshade with `gdaldem hillshade` from SRTM DEM. **Generating before searching the library is a violation of the library-first principle.**

For details on each baseline item (CDN naming, fallback chain, validation scripts, audio-quality gate, map-base requirements, knowledge-graph data schema, brand bar template), read `references/baseline-rules.md`.

---

## Required `<head>` meta tags (cross-courseware routing)

In addition to the 14 baseline items, every courseware MUST declare 6 meta tags in `<head>`. These wire the courseware into the cross-courseware routing system (TeachAnyRouter), prerequisite warnings, and "next lesson" recommendations. Missing any of them = the courseware can't be reached from other courseware and won't appear in the recommended-next sidebar.

```html
<meta name="course-id"       content="phy-light-refraction">      <!-- Must equal manifest.course_id -->
<meta name="course-title"    content="光的折射">
<meta name="course-subject"  content="physics">
<meta name="course-grade"    content="middle-8">                  <!-- Format: <stage>-<grade> -->
<meta name="course-prereqs"  content="phy-light-reflection,phy-light-propagation">  <!-- Comma-separated -->
<meta name="course-next"     content="phy-lens-imaging">          <!-- Optional, single ID -->
```

For the runtime system that consumes these tags (`TeachAnyAdaptive`, `TeachAnyProgress`, `TeachAnySR`, `TeachAnyAchievements`, `TeachAnyRouter`, PWA), read `references/frontend-runtime.md`.

---

## Five red lines (rigor discipline) · 严谨度铁律

These prevent the most common failure modes when an AI builds courseware. Apply them throughout, not just at the end.

> **Chinese aliases**: 五条红线 / 严谨度铁律 · 闭环验证 · 事实驱动 · 穷尽一切 · 失败 2 次必换方案 · 一类问题端到端解决 / 同类问题扫除

1. **Closed-loop verification (闭环验证)** — Before claiming "done/fixed/should work" (说"修好了 / 完成了 / 应该可以了"), run the actual command and paste the output. No output = no completion. Use `validate-courseware.cjs` for course-level claims.
2. **Evidence-driven attribution (事实驱动)** — Before saying "the bug is probably X" (说"可能是 X 问题 / 也许是 Y 原因"), verify with a tool (curl/grep/read_file/console.log/ffprobe). Untested guesses waste user time.
3. **Exhaust before giving up (穷尽一切)** — Before saying "I can't fix this" (说"无法解决 / 建议你手动处理"), complete: (a) list everything you've tried, (b) read official docs + reverse the assumption, (c) check if you're going in circles, (d) try a fundamentally different approach.
4. **2 failures → switch approach (失败 2 次必换"本质不同"的方案)** — If two attempts on the same parameter/header/model fail, stop tweaking. Switch from API client → server, streaming → non-streaming, guess → docs.
5. **Sweep sibling issues (修一类问题)** — Fix one bug → check for the same pattern across all related files. **One issue in, one class of issues out (一个问题进来，一类问题出去)**. Example: fix one courseware's `ai-tutor.js` → batch-check all coursewares.

For full red-line + 8 anti-shortcut rules + adaptive 4-branch hard rules and examples, read `references/baseline-rules.md`.

---

## Repository layout (critical: avoid stale `examples/` references)

The TeachAny project has **two repos**:

| Repo | Role | What goes here |
|:---|:---|:---|
| `weponusa/teachany-courseware` | **Courseware repo** — actual HTML, TTS audio, images served via GitHub Pages | Full courseware: `community/<course-id>/index.html` (full HTML) + `manifest.json` + `tts/` + `assets/` |
| `weponusa/teachany` (a.k.a. `teachany-opensource`) | **Skill repo** — registry, knowledge trees, gallery site, scripts | `community/<course-id>/index.html` is **only an 11-line redirect page** pointing to the courseware repo |

⛔ **Do NOT use `examples/` as a directory**. As of v7.9.15, `examples/` is a deprecated path label that still appears in some legacy `registry.path` fields. **Never write new files into `examples/<course-id>/`** — always use `community/<course-id>/`. The `manifest.json` `status` field (`"official"` vs `"community"`) is what distinguishes tier, not the directory.

⛔ **Do NOT put complete (>2KB) HTML into the skill repo**. The skill repo (`teachany-opensource`) only stores redirects. Full courseware lives in the courseware repo.

For dual-repo publishing flow + redirect page template + `rebuild-index.py` behavior, read `references/packaging.md`.

---

## Non-curriculum coursewares (the "Other Knowledge" tree)

Not every courseware fits a national curriculum (CN/IB/A-Level/AP). For folk math, thinking methods, cross-disciplinary topics, or general-public lessons, TeachAny has an "Other Knowledge" virtual tree. Use it correctly:

| Situation | What to do |
|:---|:---|
| Topic doesn't match any curriculum node | (1) First try `python3 scripts/find_nodes.py "<topic>"` — many nodes exist that you didn't realize; (2) If truly novel, use `python3 scripts/register_node.py` to register a new official node; (3) Only if no curriculum mapping is possible: set `"free_mode": true` in `manifest.json` |
| Learning-path recommended courseware | Use `course-id` prefix `ext-` (e.g., `ext-thinking-101`). No `manifest.json` required — meta extracted from HTML `<meta name="course-*">` 6-pack |

**Hard rules for free_mode / ext-***:
- ⛔ Don't delete `node_id` just because it can't be found in the tree — try lookup → register → free_mode in that order
- ⛔ Don't manually edit `domains[0].nodes[]` in `data/trees/other/user-generated.json` (auto-overwritten by `rebuild-index.py`)
- ⛔ Don't mark `free_mode: true` if there IS a matching official node (creates orphans in the knowledge graph)
- ⛔ Don't bypass `ext-*` quality gates (course-id starts with `ext-`, HTML ≥ 10KB, has `course-subject` + `course-title`, ≥ 5 `<section>` blocks)

For full free_mode + ext-* mechanics, read `references/workflow.md` (Phase 0.5 section).

---

## Documentation map (progressive disclosure)

Read SKILL.md (this file) for triggering, baseline, and red lines. When you're working on a specific aspect, load the matching reference:

### Workflow & process
- `references/workflow.md` — Full Phase 0 → Phase 3 instructions, Phase 0.5 knowledge lookup, validation gates

### Standards & rules
- `references/baseline-rules.md` — All 14 baseline items in detail, 5 red lines, 8 anti-shortcut rules, **adaptive 4-branch hard rules**, 57 hard rules
- `references/SKILL_CN.md` — Chinese reference version (read when user writes in Chinese or asks for Chinese explanations)
- `RULES.md` — The full hard-rule list with violation examples

### Instructional design
- `references/instructional-design.md` — ABT narrative, Bloom's taxonomy, cognitive load theory, scaffolding, **adaptive (4-branch) and inquiry-based (4-level) design**
- `references/subject-adapters.md` — Per-subject adaptation matrix + **5-lens method**, **ConcepTest design**, peer-instruction patterns
- `guides/project-based.md`, `guides/interaction-patterns.md`, `guides/assessment.md`, `guides/prerequisites.md`, `guides/examples.md` — Detailed teaching design patterns

### Technical implementation
- `references/tech-stack.md` — Recommended stack, page structure, design system per grade level
- `references/frontend-runtime.md` — **Frontend learning-loop runtime** (TeachAnyAdaptive · TeachAnyProgress · TeachAnySR · TeachAnyAchievements · TeachAnyRouter · PWA · 6 required `<meta>` tags). Read when implementing adaptive branching, progress tracking, spaced-repetition review, or cross-courseware navigation.
- `tech/page-structure.md` (42KB) — Full HTML standard structure with `data-tsh`/`data-tts` attributes
- `tech/design-system.md` — Visual design specs (elementary/middle/high)
- `tech/ai-multimodal.md` — AI multimodal interaction zones
- `tech/math-animations.md`, `tech/science-simulations.md`, `tech/advanced-animations.md` — Subject-specific animation patterns

### Media production
- `references/media-pipeline.md` — Hero infographic resolution chain, Remotion video setup, TTS engine, audio module
- `phases/video-audio.md` — Full video/audio production pipeline (Remotion + ffmpeg + TTS)

### Maps (geography & history)
- `references/maps.md` — Local map assets (no XYZ tiles), hillshade base, GeoJSON administrative boundaries
- `historical-maps.md` + `historical-maps-quickref.md` — Historical map assets and usage
- `terrain-3d-integration.md` — 3D terrain integration

### Packaging & publishing
- `references/packaging.md` — Dual-repo publishing flow, redirect page generation, `rebuild-index.py`, `git push origin + gitee`
- `phases/packaging.md` — Full L4 packaging workflow with `submit-to-community.py`

### Theory & cost
- `references/theory.md` — Theoretical foundations (cognitive science, learning sciences research)
- `phases/token-cost.md` — Token consumption per phase, cost estimation
- `phases/deliverables.md` — L2/L3 trigger mechanism

### Other
- `CHANGELOG.md` — Version history
- `curriculum-standards.md` — Curriculum mapping (CN/IB/A-Level/AP)
- `pptx-design-guide.md` — PPTX export guide

---

## Standard quick-start

When the user asks for a new courseware, in your first reply:

1. **Acknowledge & clarify** — Confirm subject + grade + topic. If any is missing, ask in one batch (don't drip questions).
2. **Read `references/workflow.md`** — Internalize the 4-phase flow.
3. **Run Phase 0.5 lookup** — Locate the `node_id` in `data/trees/<curriculum>/<subject>.json`. If not found, decide between (a) registering a new node, or (b) `free_mode: true` for "Other Knowledge" tree.
4. **Show the user a 1-screen plan** — Lesson type, ABT narrative, baseline items you'll include. Get a "go" before building.
5. **Build → verify → publish** — Phase 1-3 per `references/workflow.md`, gate with `validate-courseware.cjs`, publish per `references/packaging.md`.

For tasks that are NOT new-courseware (e.g., batch update, migration, debugging), skip to the relevant reference directly. The 4-phase flow is for greenfield work; for maintenance work the red lines and dual-repo layout above are what you need.

---

## Anti-patterns (immediate red flags)

Stop and reconsider if you find yourself doing any of these:

- ❌ Outputting an "Environment Constraints" checklist with ❌ marks for Remotion/TTS/image_gen and "skipping" them. Tools unavailable = stop and install (`bash scripts/preflight-check.py`), not skip. The 16 baseline items are factory-required, not optional checkboxes.
- ❌ Writing into `examples/<course-id>/` (deprecated since v7.9.15 — use `community/`)
- ❌ Putting full HTML into the skill repo `teachany-opensource` (only 11-line redirects belong there)
- ❌ Replacing Canvas with static SVG "for simplicity" (violates ③)
- ❌ "This humanities subject doesn't need Remotion video" (violates ② — poetry/classical Chinese have animation use cases)
- ❌ Using SVG+CSS animation as an "equivalent" for Remotion MP4 (it's not — Remotion is real video rendering)
- ❌ Remotion video without audio track (silent video violates ②, must have TTS + ambient audio)
- ❌ "Hero image filling 100% of frame for 4 minutes" video (violates ② — video means motion, not audio-with-still-image)
- ❌ Online XYZ tile services (CartoDB/Esri/OSM) for map base (violates ③ — use local `assets/maps/` only)
- ❌ History/geography courseware without a map (violates hard rule #62)
- ❌ Using "lorem ipsum"/"placeholder"/"TBD" anywhere in published courseware (must replace before publishing)
- ❌ Generic AI art that doesn't show subject content (violates ④ — every illustration must teach)
- ❌ **Text says "look at this painting" but no image is embedded** (violates ④ mention-means-image rule) — if you reference a specific artwork by name (e.g., 拉斐尔《椅中圣母》, Mona Lisa, Michelangelo's David), you MUST embed that image. Use `image_gen` for reconstruction OR web-search for public-domain reference (Wikimedia Commons is canonical).
- ❌ **Empty `<section id="knowledge-graph">` with nothing inside and no data passed to the JS** (violates ⑦) — the graph JS needs prerequisites + next-courses data, either via `window.TeachAnyKnowledgeGraph.render({prereqs, current, next})` OR inline `<div data-kg-node="...">` markup.
- ❌ **Accepting TTS engine degradation silently** — if `tts-engine.py` falls back to pyttsx3 (robotic) or silent.mp3, stop the build and report. Students should not hear machine-stuttery voice or total silence. Quality floor: edge-tts (L0) or macOS `say` (L2) is acceptable; below that is unacceptable.
- ❌ **No top brand bar** (violates ⑮) — every courseware needs a pinned top row with TeachAny logo, Gallery link, and the course version visible. Without it, students have no way back to the gallery or to tell which version they're on.
- ❌ **Hand-drawn SVG map outline as the "map"** (violates ⑯) — history/geography courseware needs `hillshade.jpg` terrain + real GeoJSON boundaries. A stylized shape with colored dots does not give students spatial intuition; it's decoration, not geography. Use `scripts/make-historical-map.py` or Leaflet + local tiles.
- ❌ **Hand-writing knowledge-graph HTML instead of using `<div data-teachany-kg="<node_id>">`** (violates ⑦) — every hand-written `.kg-container/.kg-row/.kg-node` is a maintenance time bomb: it doesn't pick up upstream visual updates from `teachany-knowledge-graph.js`, doesn't sync with `teachany-kg-manifest.json` data changes, and produces inconsistent UX across coursewares. Use the standard module API: `<div data-teachany-kg="hist-m-renaissance"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>`.
- ❌ **Hand-writing AI tutor card content instead of using `<div data-teachany-tutor-card></div>`** (violates ⑧) — same as above. The standard module already auto-fills 主题/icon/buttons/suggestions based on `<title>` + `course-subject`. Manually writing HTML breaks subject awareness.
- ❌ **Brand bar showing only course version** (violates ⑮) — must show BOTH course version AND skill version. Course version tells students "is this content updated?", skill version tells students "is this courseware using the latest TeachAny capabilities?". Both pieces of info matter.
- ❌ **Setting Leaflet `imageOverlay` bounds to a region (Europe / China / etc.) when the source hillshade is global Plate Carrée** (violates ⑯ projection-alignment rule) — bounds tells Leaflet "this image spans these lat/lng coordinates"; if you tell it the global 4096×2048 image spans only Europe `[[35,-10],[60,30]]`, Leaflet will stretch the whole world into that frame, producing terrain-borders mismatch (Alps appear in Africa, Madrid floats in the Atlantic). Correct pattern: `L.imageOverlay(url, [[-90,-180],[90,180]])` + `map.fitBounds(regionBounds)`.
- ❌ **Generating new hillshade/boundaries without first querying the library** (violates ⑯ library-first principle) — the skill ships with 207 maps in `assets/maps/` covering 19 Chinese dynasties, 21 world eras, and 6 hillshade variants. Always run `python3 scripts/find-map.py <keyword>` BEFORE invoking `image_gen` or `gdaldem`. Generating duplicates wastes tokens and produces visual inconsistency across coursewares.
- ❌ **Finishing a courseware locally without auto-pushing to all 3 repos** (violates ⑰ auto-publish) — saying "课件做完了" while the files are only on local disk is incomplete. Run the 3-step Auto-publish flow (courseware → opensource redirect + rebuild-index → skill) immediately after every modification. The user should not have to ask "did you push?". Skip ONLY when user explicitly said "不要发布/不要上传/只做不推/don't publish/just local".
- ❌ **Modifying a courseware (fix bug, add image, swap map) without re-pushing** — even single-file edits trigger ⑰. A courseware that's 2 commits behind production is broken for users. Fix-and-forget is a violation.
- ❌ **Pushing courseware repo but skipping `rebuild-index.py`** — without rebuild, registry.json and knowledge tree don't pick up the new/changed courseware, so it won't appear in Gallery or knowledge graph even though Pages serves it. ⑦/⑭/⑰ all violated.
- ❌ **Claiming "publish complete" while only verifying HTML URL=200** — a courseware whose 5-piece JS modules return 404 is broken at runtime: no AI tutor, no knowledge graph, no TTS narrator. Always run the 4-check verify (HTML + 5 JS + 5 CSS + knowledge tree) — see "Verifying the publish" section. The user-visible page might say "loading..." forever or render only static HTML; you'd never know unless you actually fetch every JS URL.
- ❌ **Trusting `peaceiris/actions-gh-pages` exclude_assets glob to handle `scripts/` selectively** — the action's glob implementation has known issues with `scripts/*.py` patterns that end up excluding the entire `scripts/` directory. Either don't use exclude_assets at all, or use the `_publish/` staging-directory pattern (see `deploy-pages.yml` v4), or manually push gh-pages.
- ❌ **Skipping `git push gitee` because origin succeeded** — dual remote (GitHub + Gitee) is for Mainland China users. If gitee push fails due to DNS/network, log the failure and continue, but don't silently drop it. Re-attempt later.
- ❌ **Bypassing pre-commit hook silently** — `TEACHANY_SKIP_PRECOMMIT=1` is acceptable ONLY for known false-positives (e.g., hook treating opensource-repo redirect as full courseware). For real failures (incomplete courseware, missing knowledge graph data), fix the courseware first.

---

## Output requirements & Auto-publish flow (baseline ⑰)

A delivered courseware lives across **three repos** and must be pushed to all three before the work is "complete":

```
weponusa/teachany-courseware/community/<course-id>/   # Full courseware (HTML + TTS + assets + videos)
├── index.html                               # complete HTML with five-piece suite + 17 baselines
├── manifest.json                            # node_id, status, has_tts, has_video, etc.
├── README.md                                # description, learning objectives
├── tts/s01.mp3 ~ s0N.mp3                    # one per data-tts paragraph
├── assets/<course-id>-hero.png + ...        # illustrations, maps, etc.
├── videos/                                  # Remotion-rendered (≥1 MP4 with audio)
└── (optional) src-remotion/                 # Remotion source if regenerable

weponusa/teachany/community/<course-id>/     # Skill-repo redirect (11 lines)
├── index.html                               # 11-line redirect to courseware repo
└── manifest.json                            # copy of courseware-repo manifest

# (changes also automatically reflected in:)
weponusa/teachany/registry.json
weponusa/teachany/data/trees/<curriculum>/<subject>.json   # courses array updated
```

### ⛔ Auto-publish flow (DEFAULT, run after EVERY courseware modification)

After **finishing or modifying** any courseware (creation, content change, asset update, even a single bug fix), automatically run this 3-step chain. Do NOT ask the user "should I publish now?" — just publish, unless the user explicitly told you not to.

```bash
# ──────────────────────────────────────────────────────
# Step 1: Push the courseware repo (full HTML + assets)
# ──────────────────────────────────────────────────────
cd ~/CodeBuddy/一次函数/teachany-courseware    # OR wherever the courseware repo is
git add community/<course-id>/
git commit -m "feat: <action> <course-id>（<topic>）

- 16 项基线满足
- <key changes>"
git push origin main
git push gitee main 2>&1 || echo "  ℹ️  gitee 推送失败（DNS/网络），origin 已成功"

# ──────────────────────────────────────────────────────
# Step 2: Sync redirect + register in opensource repo
# ──────────────────────────────────────────────────────
cd ~/CodeBuddy/一次函数/teachany-opensource

# 2a. Build 11-line redirect
mkdir -p community/<course-id>
cat > community/<course-id>/index.html <<EOF
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=https://weponusa.github.io/teachany-courseware/community/<course-id>/">
<title>Redirecting...</title>
</head><body>
<p>Redirecting to <a href="https://weponusa.github.io/teachany-courseware/community/<course-id>/">课件页</a></p>
</body></html>
EOF

# 2b. Copy manifest (rebuild-index.py needs it)
cp ~/CodeBuddy/一次函数/teachany-courseware/community/<course-id>/manifest.json \
   community/<course-id>/manifest.json

# 2c. Rebuild registry + knowledge tree references
python3 scripts/rebuild-index.py
# This updates: registry.json, data/trees/*/*.json, nodes-selector.json, kg-manifest.json, community/index.json

# 2d. Commit + push
git add -A
# pre-commit hook may flag the redirect-only directory as "incomplete courseware";
# in this case bypass with TEACHANY_SKIP_PRECOMMIT=1 (see anti-pattern below for justification)
TEACHANY_SKIP_PRECOMMIT=1 git commit -m "feat: 注册 <course-id> 到知识图谱"
git push origin main
git push gitee main 2>&1 || echo "  ℹ️  gitee 推送失败（DNS/网络），origin 已成功"

# ──────────────────────────────────────────────────────
# Step 3: If skill itself was modified, push skill repo
# ──────────────────────────────────────────────────────
cd ~/.codebuddy/skills/teachany
if [ -n "$(git status --short)" ]; then
  git add skill/  # or specific files
  git pull origin main --rebase 2>/dev/null
  git commit -m "feat(skill): <change description>"
  git push origin main
fi
```

### Verifying the publish (⛔ MANDATORY — not optional)

**HTML URL=200 is NOT enough**. A page that loads but whose 5-piece JS modules 404 looks "deployed" but is broken (no AI tutor, no knowledge graph, no TTS narrator, no section hints). The page silently fails at runtime.

After every publish, run all 4 checks below. If ANY check fails, the publish is incomplete:

```bash
# Check 1: Courseware HTML reachable
COURSE_ID=hist-m-renaissance
URL="https://weponusa.github.io/teachany-courseware/community/$COURSE_ID/"
HTML_CODE=$(curl -sI "$URL?_=$(date +%s)" | head -1 | grep -oE "[0-9]{3}")
echo "Courseware HTML: $HTML_CODE"  # Expected: 200

# Check 2: ⛔ All 5 standard module JS files reachable (五件套 JS)
echo "─── 五件套 JS 验证（任何一个 404 都意味着标准模块在学生浏览器里不工作）───"
for f in ai-tutor.js teachany-tutor-card.js teachany-knowledge-graph.js \
         teachany-tts-narrator.js teachany-section-hints.js; do
  code=$(curl -sI "https://weponusa.github.io/teachany-courseware/scripts/$f?_=$(date +%s)" | head -1 | grep -oE "[0-9]{3}")
  size=$(curl -sI "https://weponusa.github.io/teachany-courseware/scripts/$f?_=$(date +%s)" | grep -i content-length | awk '{print $2}' | tr -d '\r')
  echo "  $f: HTTP $code ($size bytes)"
done
# Expected: ALL 5 = HTTP 200, sizes ~3K-60K
# If ANY = 404 → scripts/ not deployed to gh-pages → fix workflow OR manually push gh-pages

# Check 3: Corresponding CSS files reachable
for f in ai-tutor.css teachany-tutor-card.css teachany-knowledge-graph.css \
         teachany-tts-narrator.css teachany-section-hints.css; do
  code=$(curl -sI "https://weponusa.github.io/teachany-courseware/scripts/$f?_=$(date +%s)" | head -1 | grep -oE "[0-9]{3}")
  echo "  $f: HTTP $code"
done
# Expected: ALL 5 = HTTP 200

# Check 4: Knowledge tree picked it up
python3 -c "
import json
t = json.load(open('$HOME/CodeBuddy/一次函数/teachany-opensource/data/trees/<curriculum>/<subject>.json'))
def walk(n):
    if isinstance(n, dict):
        if n.get('node_id') == '$COURSE_ID':
            print('挂载状态:', n.get('courses', []), '/ status:', n.get('status'))
            return True
        return any(walk(v) for v in n.values())
    if isinstance(n, list):
        return any(walk(x) for x in n)
walk(t)"
# Expected: 挂载状态: ['<course-id>'] / status: active
```

**If 五件套 JS/CSS 404** (Check 2 or 3 fails):
1. The `scripts/` directory is missing from `gh-pages` branch
2. Inspect courseware repo's `.github/workflows/deploy-pages.yml` — check `exclude_assets` is NOT excluding scripts
3. **Quickest fix**: manually push scripts/ to gh-pages branch:
   ```bash
   cd <courseware-repo>
   git worktree add -B gh-pages /tmp/ghp-wt origin/gh-pages
   cd /tmp/ghp-wt
   mkdir -p scripts
   cp <main-repo>/scripts/*.js scripts/
   cp <main-repo>/scripts/*.css scripts/
   cp <main-repo>/scripts/*.json scripts/
   git add scripts/
   git commit -m "manual: inject scripts/ to gh-pages"
   git push origin gh-pages
   cd <main-repo> && git worktree remove /tmp/ghp-wt --force
   ```
4. Wait 90 seconds for `pages-build-deployment` to run, then re-run Check 2.

For full publishing details (drafts vs direct push, PR flow via Cloudflare Worker, examples/ deprecation), read `references/packaging.md`.

---

## When in doubt

- **Don't know which subject adapter applies?** → `references/subject-adapters.md`
- **Tool unavailable / TTS/Remotion fails?** → `phases/video-audio.md` for fallback chains
- **node_id can't be found in tree?** → `references/workflow.md` Phase 0.5
- **Quality gate fails?** → `references/baseline-rules.md` for which item failed and how to fix
- **Publishing problems / git push fails?** → `references/packaging.md`
- **Chinese-language conversation or detail needed?** → `references/SKILL_CN.md`

---

**Version**: v7.10.3 · **Last update**: 2026-05-12 · See `CHANGELOG.md` for history.

**v7.10.3 changes** (real-URL verification — HTML 200 ≠ deployed):
- ⑰ Verify-publish 升级为 4 步硬检查：HTML 200 + 5 个 JS URL=200 + 5 个 CSS URL=200 + 知识树挂载
- 新增急救方案：scripts/ 没部署到 gh-pages 时用 `git worktree` 手动 push
- auto-publish.sh 加 Step 4 自动跑五件套真实 URL 验证（任何一个 404 退出码 20）
- 新增 anti-pattern：声称完成但 JS 404；信任 peaceiris exclude_assets glob 选择性排除 scripts
- 根因记录：peaceiris/actions-gh-pages 的 exclude_assets 处理 'scripts/*.py' 这类带斜杠 glob 时把整个 scripts/ 排除（5 月 12 日实测）

**v7.10.2 changes** (standard-module discipline + projection alignment):
- ⑦ Knowledge graph MUST use standard module API `<div data-teachany-kg="<node_id>">`, NOT hand-written HTML
- ⑧ AI tutor card MUST use `<div data-teachany-tutor-card></div>`
- ⑮ Brand bar MUST show DUAL VERSION: course version + skill version
- ⑯ Projection-alignment hard rule: library hillshade is global Plate Carrée — `imageOverlay` bounds MUST be `[[-90,-180],[90,180]]`

**v7.10.1 changes** (auto-publish as baseline ⑰):
- Baseline expanded from 16 → 17 items: ⑰ "Auto-register and push" is now a hard requirement
- After ANY courseware creation/modification, must auto-push to 3 repos
- Added "Output requirements & Auto-publish flow" section
- New anti-patterns: "finishing without auto-push", "fix-and-forget", "push without rebuild-index"

**v7.10.0 changes** (library-first map sourcing):
- ⑯ Map baseline now requires querying the bundled library (`assets/maps/`, 207 files, 104 MB) before generating new resources
- New tool: `scripts/find-map.py` — keyword/era/dynasty/base-layer search with `--copy` to inject into courseware
- Updated `scripts/bundle_map_assets.sh` to scan new library paths (`chrono-cn/`, `chrono-world/`, `physical/hillshade/`, `political/`)
- New anti-pattern: "generating new hillshade/boundaries without first running `find-map.py`"
- Decision tree added to ⑯: library → Natural Earth / CShapes → SRTM DEM (last resort)
