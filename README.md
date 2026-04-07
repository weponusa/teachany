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
  <a href="#-live-gallery"><img src="https://img.shields.io/badge/Live_Gallery-5_courses-blue?style=flat-square" alt="Gallery"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License"></a>
  <a href="README_CN.md"><img src="https://img.shields.io/badge/中文文档-点击查看-red?style=flat-square" alt="Chinese README"></a>
</p>

<p align="center">
  <a href="https://github.com/wepon/teachany/blob/main/README_CN.md">简体中文</a> ·
  <a href="#-live-gallery">Live Gallery</a> ·
  <a href="docs/getting-started.md">Getting Started</a> ·
  <a href="docs/methodology.md">Methodology</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

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

Click any course below to experience it live:

| Course | Subject | Grade | Interactions | Lines |
|:-------|:--------|:------|:-------------|:------|
| [📐 Quadratic Functions](examples/math-quadratic-function/) | Math | Grade 9 | Canvas graphing, vertex dragging, step-by-step derivation | 1,300+ |
| [📏 Linear Functions](examples/math-linear-function/) | Math | Grade 8 | Slope/intercept sliders, real-time graph | 1,100+ |
| [🧬 Meiosis & Fertilization](examples/bio-meiosis/) | Biology | Grade 10 | Cell division simulation, chromosome drag-and-drop | 1,400+ |
| [🌍 Global Monsoon Systems](examples/geo-monsoon/) | Geography | Grade 10 | Leaflet map, wind pattern visualization, region comparison | 1,200+ |
| [💧 Liquid Pressure & Buoyancy](examples/phy-pressure-buoyancy/) | Physics | Grade 8 | Experiment simulation, parameter adjustment | 1,000+ |

> All courses are **single-file HTML** — no build step, no dependencies. Open in any browser.

---

## 🚀 Quick Start

### Option 1: Use as an AI Skill (Recommended)

TeachAny works as a **Skill** for AI coding assistants (CodeBuddy, Cursor, Windsurf, Claude, etc.):

1. Copy `skill/SKILL.md` (English) or `skill/SKILL_CN.md` (Chinese) to your AI assistant's skill directory
2. Start a conversation:
   ```
   Create an interactive courseware for "Photosynthesis" (Grade 7 Biology)
   ```
3. The AI will follow TeachAny's methodology to produce a complete, interactive HTML courseware

### Option 2: Start from the Template

```bash
cp -r examples/_template my-new-course
# Edit my-new-course/index.html with your content
open my-new-course/index.html
```

### Option 3: Browse and Remix

1. Clone this repo
2. Open any `examples/*/index.html` in your browser
3. Modify the content for your own lesson

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

---

## 🏗️ Project Structure

```
teachany/
├── README.md                    # English README (this file)
├── README_CN.md                 # Chinese README
├── LICENSE                      # MIT License
├── CONTRIBUTING.md              # Contribution guide (bilingual)
├── CHANGELOG.md                 # Version history
│
├── skill/
│   ├── SKILL.md                 # English Skill definition
│   └── SKILL_CN.md              # Chinese Skill definition
│
├── data/                        # 📚 Knowledge Layer
│   ├── README.md                # Architecture document
│   ├── schema.md                # JSON schema specification
│   ├── chinese/                 # Chinese Language
│   │   └── pinyin/              # Pinyin (graph, errors, exercises)
│   └── math/                    # Mathematics
│       └── functions/           # Functions (graph, errors, exercises)
│
├── docs/
│   ├── methodology.md           # Deep dive into learning theories
│   ├── getting-started.md       # Step-by-step guide
│   ├── design-system.md         # Visual design specification
│   └── subject-guides/          # Per-subject usage guides
│       ├── math.md
│       ├── physics.md
│       ├── biology.md
│       ├── geography.md
│       └── ...
│
├── examples/                    # Live courseware examples
│   ├── math-quadratic-function/ # Quadratic functions (Math, Grade 9)
│   ├── math-linear-function/    # Linear functions (Math, Grade 8)
│   ├── bio-meiosis/             # Meiosis (Biology, Grade 10)
│   ├── geo-monsoon/             # Monsoon systems (Geography, Grade 10)
│   ├── phy-pressure-buoyancy/   # Pressure & buoyancy (Physics, Grade 8)
│   └── _template/               # Starter templates (elementary/middle/high)
│
├── gallery/                     # GitHub Pages gallery site
│   └── index.html
│
└── .github/
    ├── ISSUE_TEMPLATE/
    │   ├── new-course.md        # Request a new course
    │   └── bug-report.md        # Report an issue
    └── workflows/
        └── validate.yml         # HTML validation CI
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
| **Five-Lens Method** | A 5-perspective approach (See It → Break It → Explain It → Compare It → Transfer It) for teaching difficult concepts |
| **Subject Adaptation Matrix** | 9 subject-specific teaching frameworks with tailored interaction types and assessment styles |
| **6-Question Pre-Design Framework** | A structured pre-design checklist that ensures pedagogical completeness before any code is written |
| **Lesson Type Classification** | Systematic categorization (new concept / review / practice / thematic / lab) with corresponding structural templates |
| **Phase 4 Review Checklist** | A quality assurance protocol covering pedagogy, interaction, accessibility, and visual design |
| **Visual Design System** | A cohesive dark-theme glassmorphism design language optimized for educational content |

> The TeachAny Skill prompt and all associated documentation are released under MIT License. You may use, modify, and redistribute them freely.

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

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for teachers and students everywhere.</strong><br>
  <sub>If TeachAny helps you create better learning experiences, give us a ⭐</sub>
</p>
