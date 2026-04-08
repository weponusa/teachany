# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2026-04-08

### ✨ Added — Community Courseware & Likes
- **Multi-courseware per node**: The same knowledge node can now have multiple user-uploaded coursewares (removed node_id deduplication, each import generates a unique ID with timestamp suffix)
- **Like system** (`localStorage` + `sessionStorage`):
  - `likeCourse(id)` / `unlikeCourse(id)` / `toggleLike(id)` — increment/decrement/toggle likes
  - `getCourseLikes(id)` — read like count
  - `isLikedInSession(id)` — check if liked in current session
  - Likes stored in `teachany_course_likes` key, session state in `sessionStorage`
- **Sorted community courseware list**: `findUserCoursesByNodeId(nodeId)` returns all coursewares for a node sorted by likes descending; `getTopCoursesByNodeId(nodeId, limit=5)` returns top N
- **Knowledge tree tooltip**: Shows ranked community courseware list (up to 5) with inline like buttons and direct launch links per course
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
| v5.4 | 2026-04-07 | Added `.teachany` courseware packaging, browser import flow, and Gallery/knowledge-tree upload entry |
| v4.0 | 2026-04-06 | Added Remotion / Edge TTS / subtitle pipeline specification and cost estimation |
| v3.0 | 2026-04-06 | Added Bloom table, lesson types, scaffolding, Mayer principles, Five-Lens guide, 3-subject examples, design specs, Phase 4 checklist |
| v2.0 | 2026-03 | Split into universal foundation + subject adaptation layer |
| v1.0 | 2026-02 | Initial math/science courseware edition |
