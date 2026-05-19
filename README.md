<p align="center">
  <img src="docs/assets/logo.svg" width="120" alt="TeachAny Logo">
</p>

<h1 align="center">🎓 TeachAny</h1>

<p align="center">
  <strong>Every school, every teacher, every parent — build your own Khan Academy for every child, at zero cost.</strong><br>
  Turn any K-12 topic into an interactive, evidence-based learning experience — in minutes, with AI.
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-30s-brightgreen?style=flat-square" alt="Quick Start"></a>
  <a href="#-live-gallery"><img src="https://img.shields.io/badge/Live_Gallery-420+_courses-blue?style=flat-square" alt="Gallery"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0%20%2B%20Commercial-blue?style=flat-square" alt="Dual License"></a>
  <a href="docs/TRADEMARK.md"><img src="https://img.shields.io/badge/TeachAny-trademark%20protected-orange?style=flat-square" alt="Trademark Policy"></a>
  <a href="README_CN.md"><img src="https://img.shields.io/badge/中文文档-点击查看-red?style=flat-square" alt="Chinese README"></a>
</p>

<p align="center">
  <a href="https://github.com/weponusa/teachany/blob/main/README_CN.md">简体中文</a> ·
  <a href="#-live-gallery">Live Gallery</a> ·
  <a href="docs/getting-started.md">Getting Started</a> ·
  <a href="docs/methodology.md">Methodology</a> ·
  <a href="docs/TRADEMARK.md">Trademark</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

> ⚖️ **Trademark Notice**: **TeachAny™** and **教我学™** are trademarks of the TeachAny project author, in continuous public use since 2026-04-07. These marks are **unregistered** but actively asserted under prior-use rights. Forks must rename; see [TRADEMARK.md](docs/TRADEMARK.md) for full policy.

---

## 🚀 One-Click Install

### ⚡ Recommended · Sparse Clone (Standard Preset)

The standard preset includes the Skill core, all knowledge trees, curriculum-aligned KP data, and geography/history map assets (~110 MB working directory):

```bash
git clone --filter=blob:none --sparse https://github.com/weponusa/teachany.git
cd teachany
git sparse-checkout set --from-file .sparse-checkout-presets/standard.txt

# Link skill to your AI tool
ln -sfn "$PWD/skill" ~/.codebuddy/skills/teachany   # CodeBuddy
ln -sfn "$PWD/skill" ~/.agents/skills/teachany      # Claude Code / Cursor / Codex CLI
```

> 💡 **Why sparse clone?** The full repo is ~1.6 GB (including 420+ community courseware with audio/video assets). The standard preset gives you everything needed for courseware creation without downloading community courseware.

### Alternative · Full Clone (for contributors)

```bash
git clone https://github.com/weponusa/teachany.git
cd teachany
ln -sfn "$PWD/skill" ~/.codebuddy/skills/teachany
```

> 🌐 **Browse without cloning**: All 420+ community courses are live on GitHub Pages — browse them directly at **https://weponusa.github.io/teachany/**. No local clone needed.

> 🧠 **AI users** see: [skill/README.md](./skill/README.md) — the Skill is modular: `skill/SKILL.md` (157 lines) is the entry point; heavy chapters load from `skill/references/`, `skill/guides/`, `skill/phases/` on demand.

### For Chinese Users 🇨🇳 (Gitee Mirror)
**国内用户请使用 Gitee 镜像（无需翻墙，高速访问）：**
```bash
git clone https://gitee.com/weponusa/teachany.git
```

**详细安装指南**：
- 🌐 国际用户：See [Getting Started](docs/getting-started.md)
- 🇨🇳 国内用户：查看 [一键安装指南](INSTALL_CN_SIMPLE.md)（推荐）

> **What's included**: 14 subjects (Math, Physics, Chemistry, Biology, History, Geography, Chinese, English, Science, Info-Tech, Economics, CS, Humanities, Inquiry), 420+ courseware aligned with multiple curriculum standards.

---

## 🤔 The Problem

Most AI-generated educational content looks like this:

```
📝 Here are 5 key points about quadratic functions...
📋 Quiz: What is the vertex of y = x² + 2x + 1?
   A) (1, 0)   B) (-1, 0)   C) (0, 1)   D) (-1, 1)
```

**Flat. Lifeless. No pedagogy.** Students get a wall of text with a multiple-choice quiz slapped on the end. No motivation, no scaffolding, no error diagnosis, no learning loop.

## ✨ The TeachAny Approach

TeachAny is not a prompt template — it's a **complete instructional design system** that embeds 6+ learning science theories into AI-generated courseware:

| Dimension | Generic AI | TeachAny |
|:----------|:-----------|:---------|
| **Lesson Structure** | Random bullet points | ABT Narrative (And-But-Therefore) |
| **Assessment** | "Correct ✓ / Wrong ✗" | Per-option error diagnosis ("You flipped the sign of h") |
| **Difficulty** | One-size-fits-all | 3-level scaffolding (full → partial → none) |
| **Subject Adaptation** | Same template for everything | 9 subject-specific frameworks |
| **Theoretical Foundation** | None | 6+ learning science theories |
| **Interaction** | Click next → read more | Canvas simulations, drag-and-drop, concept tests |
| **PBL Decomposition** | "Here's a project idea, good luck" | Auto-decompose any PBL project into a systematic knowledge network mapped to curriculum standards |

### 🧠 Built on Learning Science

<table>
<tr>
<td width="33%">

**ABT Narrative Structure**
Every module opens with *And* (what you know) → *But* (the gap) → *Therefore* (why this lesson matters).

</td>
<td width="33%">

**Bloom's Taxonomy**
Exercises span all 6 cognitive levels: Remember → Understand → Apply → Analyze → Evaluate → Create.

</td>
<td width="33%">

**ConcepTest (Mazur)**
Concept-check questions designed for 30-70% accuracy — the sweet spot for peer discussion.

</td>
</tr>
<tr>
<td>

**Cognitive Load Theory (Sweller)**
~75 words per card. One core question per module. New concept → immediate example.

</td>
<td>

**Mayer's Multimedia Principles**
Contiguity, signaling, segmenting, pre-training — applied to every layout decision.

</td>
<td>

**Scaffolding Strategy**
Level 1: template/fill-in → Level 2: hints only → Level 3: independent work.

</td>
</tr>
</table>

---

## 🖼️ Live Gallery

Browse and experience all courseware live at **[TeachAny Gallery](https://weponusa.github.io/teachany/)**.

Featured official courseware:

| Course | Subject | Grade | Highlights |
|:-------|:--------|:------|:-----------|
| [📐 Quadratic Functions](community/math-quadratic-function/) | Math | Grade 9 | Canvas graphing, vertex dragging, step-by-step derivation |
| [📏 Linear Functions](community/math-linear-function/) | Math | Grade 8 | Slope/intercept sliders, real-time graph |
| [📚 Congruent Triangles](community/math-congruent-triangles/) | Math | Grade 8 | SVG geometry, theorem comparison, proof scaffolding |
| [🧬 Bio: Photosynthesis](community/bio-photosynthesis/) | Biology | Grade 7 | Canvas animation, drag-and-drop equation, TTS narration |
| [⚡ Ohm's Law](community/phy-ohms-law/) | Physics | Grade 9 | Virtual circuit lab, V-I graphing, formula derivation |
| [🌍 Global Monsoon](community/geo-monsoon/) | Geography | Grade 10 | Leaflet map, wind pattern visualization |
| [🔬 Chem: Daily Life](community/chem-daily-life/) | Chemistry | Grade 9 | PhET simulation, Canvas animation, resource links |
| [📖 Classical Poetry](community/course-classical-poetry/) | Chinese | Grade 7 | Close reading, annotation, writing scaffolding |
| [🏛️ Industrial Revolution](community/hist-m-industrial-revolution/) | History | Grade 9 | Source analysis, timeline, multi-perspective comparison |

> **420+ courseware** across 14 subjects, 33 official + 390+ community. All are **single-file HTML** — no build step, no dependencies. Open in any browser.

---

## 🚀 Quick Start

### Option 1: Use as an AI Skill (Recommended)

TeachAny works as a **Skill** for AI coding assistants (CodeBuddy recommended; also works with Cursor, Windsurf, Claude Code, etc.):

1. Install TeachAny via sparse clone (see above) and symlink `skill/` to your AI tool's skill directory
2. Start a conversation:
   ```
   Create an interactive courseware for "Photosynthesis" (Grade 7 Biology)
   ```
3. The AI will follow TeachAny's methodology to produce a complete, interactive HTML courseware

> **Note**: The skill only needs `skill/` + `data/`. Community coursewares are on the [TeachAny Gallery](https://weponusa.github.io/teachany/) — they are NOT bundled with the skill install.

> **Note**: Since v6.0, TeachAny ships with built-in validation, packing, and community-sharing workflows inside the base skill. A separate "admin" skill and `GITHUB_TOKEN` are no longer required.

### Option 2: Browse and Remix

1. Visit the [Live Gallery](https://weponusa.github.io/teachany/)
2. Open any courseware you like
3. View source or clone the repo to modify for your own lesson

---

## 📖 How It Works

TeachAny follows a structured 4-phase workflow:

```
Phase 0: Define          Phase 1: Design          Phase 2: Adapt          Phase 3: Build
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│ Answer the   │    │ ABT narrative    │    │ Subject-specific │    │ HTML/CSS/JS    │
│ 6 Questions  │───▶│ Content audit    │───▶│ framework        │───▶│ Interactive    │
│ (who, what,  │    │ Prerequisite     │    │ Five-lens method │    │ courseware     │
│  why, how)   │    │ chain            │    │ Scaffolding      │    │ + Assessment   │
└─────────────┘    └──────────────────┘    └──────────────────┘    └────────────────┘
```

### The 6 Pre-Design Questions

Before any code is written, TeachAny requires answering:

| # | Question | Purpose |
|:-:|:---------|:--------|
| 1 | **Who are the students?** | Determines difficulty and language |
| 2 | **What prerequisites?** | Decides if pre-test is needed |
| 3 | **What should they be able to DO?** | Turns "knowing" into observable tasks |
| 4 | **What real-world scenario?** | Provides learning motivation |
| 5 | **Where do students get stuck?** | Drives error diagnosis design |
| 6 | **How to verify they learned?** | Determines assessment strategy |

### Subject-Specific Frameworks

TeachAny doesn't use one-size-fits-all. Each subject has its own:

| Subject | Teaching Approach | Interaction Type | Assessment Style |
|:--------|:-----------------|:-----------------|:-----------------|
| **Math** | Visual intuition + algebraic reasoning + generalization | Graphing, dragging, step-by-step derivation | Standard + explanation questions |
| **Physics** | Observation + modeling + quantitative analysis | Parameter sliders, experiment prediction | Prediction + calculation + explanation |
| **Biology** | Structure → process → function | Labeling, sorting, flowchart puzzles | Diagram + process explanation |
| **Geography** | Spatial distribution → cause → regional comparison | Map interaction, chart reading, causal chains | Material analysis + comparison |
| **History** | Timeline → causation → evidence → multiple perspectives | Sorting, source comparison, stance analysis | Source-based + essay questions |
| **Chinese** | Close reading → expression techniques → theme transfer | Annotation, rewriting, imitation writing | Annotation + writing tasks + rubric |
| **English** | Input → scaffolded output → contextual application | Dialogue cards, fill-in, role-play | Integrated skills assessment |
| **Chemistry** | Macro phenomenon → micro explanation → symbolic representation | Experiment flow, equation balancing | Experiment explanation + structured response |
| **IT** | Task-driven + step-by-step demo + debugging | Click operations, flowcharts, code execution | Task completion + process check |

### The Five-Lens Method

For any difficult concept, select 2-3 lenses:

```
👁️ See It      → Observe phenomena, examples, data
🔧 Break It    → Decompose structure, steps, components
💡 Explain It  → Clarify cause, mechanism, rules
⚖️ Compare It  → Contrast with similar/opposite/wrong examples
🎯 Transfer It → Apply to new contexts to verify understanding
```

### 🧩 PBL Project Decomposition

TeachAny can automatically decompose any **Project-Based Learning** goal into a systematic knowledge network:

- Input: a project description (e.g., "Design a smart greenhouse", "Build a weather App")
- Output: a complete learning path mapped to curriculum standards (CN / AP / Cambridge / IB / US CCSS)
- Philosophy: **PBL becomes the teaching subject** — not a supplement to disciplinary learning, but the core vehicle that drives knowledge acquisition

This makes it possible to start from a real-world project and work backward to identify exactly which knowledge nodes students need, in what order, across which subjects.

---

## 🏗️ Project Structure

```
teachany/
├── README.md                    # English README (this file)
├── README_CN.md                 # Chinese README
├── LICENSE                      # Dual License (AGPL-3.0 + Commercial)
├── CONTRIBUTING.md              # Contribution guide (bilingual)
├── CHANGELOG.md                 # Version history
├── index.html                   # Gallery homepage (dynamically loads courseware)
├── path.html                    # Learning Path system (D3.js knowledge graph)
├── tree.html                    # Knowledge tree browser
├── courseware-registry.json     # 📋 Courseware registry (metadata index)
│
├── skill/                       # 🧠 TeachAny Skill (AI Prompt System)
│   ├── SKILL.md                 # Entry point (157 lines, loads modules on demand)
│   ├── README.md                # Skill installation guide
│   ├── RULES.md                 # Quality rules and constraints
│   ├── INSTALL.md               # Detailed install instructions
│   ├── guides/                  # Subject-specific guides
│   ├── phases/                  # 4-phase workflow definitions
│   ├── references/              # Heavy reference chapters (loaded on demand)
│   ├── scripts/                 # Skill-internal scripts (validate, pack, TTS, etc.)
│   ├── templates/               # Courseware starter templates
│   └── tech/                    # Technical implementation specs
│
├── data/                        # 📚 Knowledge Layer (~53 MB)
│   ├── trees/                   # Knowledge trees (5 curriculum systems × 48 subjects = 98 JSON files)
│   │   ├── cn/                  # 中国课标 (elementary / middle / high)
│   │   ├── ap/                  # AP (US Advanced Placement)
│   │   ├── cambridge/           # Cambridge IGCSE / A-Level
│   │   ├── ib/                  # IB (MYP / DP)
│   │   └── us/                  # US CCSS + NGSS
│   ├── kp/                      # 2,399 knowledge-point detail files (curriculum_points, difficulty, resources)
│   ├── geography/               # Geography map assets (world/China/terrain)
│   ├── history/                 # Historical dynasty map overlays
│   ├── curricula.json           # Curriculum system registry (v1.4)
│   ├── nodes-metadata.json      # Node metadata index
│   ├── node-index.json          # Fast node lookup index
│   └── source-mapping.json      # KP ↔ textbook page mapping
│
├── community/                   # 🌐 Community courseware (412 courses, ~238 MB)
│   └── <course-id>/            # Each course: index.html + manifest.json [+ audio/video]
│
├── scripts/                     # 🔧 Build & maintenance scripts
│   ├── validate-courseware.cjs  # 18-point quality validator
│   ├── validate-courseware.py   # Python validator (media checks)
│   ├── pack-courseware.cjs      # Courseware packaging
│   ├── publish-courseware.cjs   # Publish to registry
│   ├── batch-validate.cjs      # Batch validation runner
│   ├── knowledge_layer.py      # Knowledge layer audit CLI
│   ├── learning-path.js        # Path system runtime
│   ├── pbl-path.js             # PBL decomposition runtime
│   └── ...                     # 130+ utility scripts
│
├── references/                  # 📖 Modular documentation chapters
│   ├── media-pipeline.md
│   ├── packaging-distribution.md
│   ├── technical-implementation.md
│   └── workflow-development.md
│
├── docs/
│   ├── methodology.md           # Deep dive into learning theories
│   ├── getting-started.md       # Step-by-step guide
│   ├── design-system.md         # Visual design specification
│   └── subject-guides/          # Per-subject usage guides
│
├── assets/                      # Logo, icons, shared assets
├── styles/                      # Shared CSS
├── gallery/                     # Gallery sub-page
├── pages/                       # Cloudflare Pages deployment config
│
├── .sparse-checkout-presets/    # Sparse checkout presets (standard / full)
│
└── .github/
    ├── ISSUE_TEMPLATE/
    └── workflows/
```

---

## 🎨 Design System

All TeachAny courseware shares a consistent visual language:

```css
/* Core color tokens */
--bg: #0f172a;           /* Primary background */
--card: rgba(30,41,59,0.7);  /* Glassmorphism cards */
--primary: #3b82f6;      /* Blue: main accent */
--secondary: #8b5cf6;    /* Purple: secondary accent */
--accent: #f59e0b;       /* Yellow: highlights */
--success: #10b981;      /* Green: correct */
--danger: #ef4444;       /* Red: incorrect */
```

- **Typography**: 16px body, 1.7-1.8 line-height
- **Cards**: Semi-transparent glassmorphism (`backdrop-filter: blur(10px)`), 16px border-radius
- **Grid**: `repeat(auto-fit, minmax(300px, 1fr))` responsive grid
- **Formulas**: Times New Roman, accent color

---

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| [Getting Started](docs/getting-started.md) | Create your first course in 5 minutes |
| [Methodology](docs/methodology.md) | Deep dive into all 6+ learning science theories |
| [Design System](docs/design-system.md) | Visual specification and CSS variables |
| [Subject Guides](docs/subject-guides/) | Per-subject best practices |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🎓 **Create a new course** — Pick any K-12 topic and build an interactive courseware
- 📚 **Expand the Knowledge Layer** — Add knowledge graphs, error databases, and exercise banks for any subject (see `data/schema.md`)
- 🌐 **Translate** — Help translate the Skill or documentation to your language
- 🐛 **Report issues** — Found a pedagogical error or UI bug? Let us know
- 📝 **Improve docs** — Better examples, clearer explanations, more subject guides
- 🎨 **Design components** — Reusable quiz engines, interactive widgets, visualizations

---

## 💡 Original Contributions

The following frameworks and methods are **original creations** of the TeachAny project:

| Contribution | Description |
|:-------------|:------------|
| **PBL Project Decomposition Engine** | Automatically breaks down any PBL project goal into a systematic knowledge network mapped to curriculum standards (CN / AP / Cambridge / IB / CCSS), making PBL the teaching *subject* rather than a supplement to disciplinary learning |
| **Five-Lens Method** | A 5-perspective approach (See It → Break It → Explain It → Compare It → Transfer It) for teaching difficult concepts |
| **Subject Adaptation Matrix** | 9 subject-specific teaching frameworks with tailored interaction types and assessment styles |
| **6-Question Pre-Design Framework** | A structured pre-design checklist that ensures pedagogical completeness before any code is written |
| **Lesson Type Classification** | Systematic categorization (new concept / review / practice / thematic / lab) with corresponding structural templates |
| **Phase 4 Review Checklist** | A quality assurance protocol covering pedagogy, interaction, accessibility, and visual design |
| **Visual Design System** | A cohesive dark-theme glassmorphism design language optimized for educational content |

> The TeachAny Skill prompt and all associated documentation are released under a **dual license**: AGPL-3.0 for non-commercial use (personal, academic, non-profit education), and a Commercial License for commercial deployment. See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

---

## 📄 Academic References

TeachAny's methodology is grounded in peer-reviewed learning science:

| Theory | Original Work |
|:-------|:-------------|
| ABT Narrative | Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press. |
| Cognitive Load Theory | Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285. |
| Multimedia Learning | Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. |
| ConcepTest / Peer Instruction | Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall. |
| Bloom's Taxonomy | Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. |
| Scaffolding | Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100. |

---

## 📜 License & Trademark

**Dual License**:
- 🟢 **Non-commercial use** (personal, public schools, academic research, open-source forks): free under [AGPL-3.0](LICENSE) — see [license.html](license.html) for an illustrated summary.
- 💰 **Commercial use** (SaaS, paid courses, enterprise training): requires a commercial license — see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md) or [commercial-license.html](commercial-license.html).

**Trademark**: **TeachAny™** and **教我学™** are unregistered but actively-asserted trademarks under prior-use rights. Forks must rename; see [docs/TRADEMARK.md](docs/TRADEMARK.md) for the full policy.

Contact: **weponusa@gmail.com** (prefix subject with `[TeachAny Commercial]` or `[TeachAny Trademark]`).

---

<p align="center">
  <strong>Built with ❤️ for teachers and students everywhere.</strong><br>
  <sub>If TeachAny helps you create better learning experiences, give us a ⭐</sub>
</p>
