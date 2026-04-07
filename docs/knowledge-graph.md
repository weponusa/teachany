# TeachAny Knowledge Graph — Design Document

> **Principle: Zero backend, zero cost. Everything runs on GitHub Pages + GitHub native features.**

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   GitHub Repo                    │
│                                                  │
│  data/trees/*.json   ← Knowledge tree registry  │
│  examples/*/         ← Official courses          │
│  community/*/        ← Community courses (PR)    │
│  index.html          ← Gallery view              │
│  tree.html           ← Knowledge tree viz (D3)   │
│  path.html           ← Learning path planner     │
│                                                  │
│  GitHub Discussions   ← Rating & reviews         │
│  GitHub Actions       ← CI validation            │
│  GitHub Pages         ← Free hosting             │
│  localStorage         ← Student progress         │
└─────────────────────────────────────────────────┘
```

**Zero external services required.**

---

## 2. Knowledge Tree Structure

### 2.1 Three-Layer Hierarchy

```
Subject (学科)
  └── Domain (知识域)
       └── Node (知识节点) ← each course maps to one node
```

### 2.2 Node Relationships

| Relationship | Meaning | Example |
|:---|:---|:---|
| `prerequisites` | Must learn before | linear-function → quadratic-function |
| `parallel` | Compare / contrast | mitosis ↔ meiosis |
| `extends` | Deeper exploration | congruent-triangles → similar-triangles |

### 2.3 Tree Registry File

Each subject has a JSON file in `data/trees/`:

```json
{
  "subject": "math",
  "name": "初中数学",
  "grade_range": [7, 9],
  "domains": [
    {
      "id": "function",
      "name": "函数",
      "color": "#3b82f6",
      "nodes": [
        {
          "id": "linear-function",
          "name": "一次函数",
          "grade": 8,
          "prerequisites": ["proportional-function", "coordinate-system"],
          "extends": ["quadratic-function"],
          "parallel": [],
          "courses": ["examples/math-linear-function"]
        }
      ]
    }
  ]
}
```

---

## 3. Course Metadata (HTML meta tags)

Every course declares its position in the knowledge graph via `<meta>` tags:

```html
<!-- TeachAny Knowledge Graph Metadata -->
<meta name="teachany-node" content="quadratic-function">
<meta name="teachany-subject" content="math">
<meta name="teachany-domain" content="function">
<meta name="teachany-grade" content="9">
<meta name="teachany-prerequisites" content="linear-function,coordinate-system">
<meta name="teachany-difficulty" content="3">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">
```

These meta tags serve two purposes:
1. **CI validation** — GitHub Actions checks completeness on PR
2. **Runtime discovery** — JavaScript reads them for tree rendering

---

## 4. Rating System (GitHub Discussions, zero backend)

### 4.1 How It Works

- Each course has a **GitHub Discussion** (category: "Course Reviews")
- Users rate by **adding emoji reactions** to the main post:
  - ❤️ = Excellent (5 stars)
  - 🚀 = Great (4 stars)
  - 👍 = Good (3 stars)
  - 👀 = Average (2 stars)
  - 😕 = Needs work (1 star)
- Users write detailed reviews as **comments**

### 4.2 Rating Aggregation

A GitHub Action runs nightly (or on-demand) to:
1. Fetch all Discussions via GitHub GraphQL API
2. Count reactions → compute weighted average
3. Write results to `data/ratings.json`
4. Commit & push → GitHub Pages auto-deploys

```json
// data/ratings.json (auto-generated)
{
  "math-quadratic-function": {
    "rating": 4.7,
    "votes": 128,
    "badge": "featured",
    "discussion_url": "https://github.com/weponusa/teachany/discussions/12"
  },
  "math-linear-function": {
    "rating": 4.3,
    "votes": 65,
    "badge": "community"
  }
}
```

### 4.3 Badge Levels

| Badge | Condition | Display |
|:---|:---|:---|
| 🌱 `seed` | Just submitted, < 5 votes | Gray border |
| 🌿 `community` | rating ≥ 3.0, votes ≥ 10 | Green border |
| ⭐ `featured` | rating ≥ 4.0, votes ≥ 50 | Gold border, homepage featured |
| 🏆 `gold` | rating ≥ 4.5, votes ≥ 200 | Gold glow, author highlight |

---

## 5. Learning Path Engine (client-side)

### 5.1 Algorithm

1. User selects a **target node** (e.g., "二次函数")
2. JavaScript loads `data/trees/math.json`
3. Recursively resolve `prerequisites` (topological sort)
4. Filter out nodes already completed (from localStorage)
5. Display ordered learning path

### 5.2 Progress Tracking (localStorage)

```json
{
  "teachany_progress": {
    "linear-function": {
      "completed": true,
      "post_test_score": 85,
      "date": "2026-04-07",
      "course_path": "examples/math-linear-function"
    }
  }
}
```

When a student completes a post-test in any course, the course writes to localStorage:
```javascript
// At end of post-test
const progress = JSON.parse(localStorage.getItem('teachany_progress') || '{}');
progress['linear-function'] = {
  completed: true,
  post_test_score: score,
  date: new Date().toISOString().slice(0, 10),
  course_path: location.pathname
};
localStorage.setItem('teachany_progress', JSON.stringify(progress));
```

---

## 6. Community Contribution Workflow

```
Author creates course with TeachAny Skill
  ↓
Adds meta tags in <head>
  ↓
Forks repo → adds course to community/ folder
  ↓
Opens Pull Request
  ↓
GitHub Actions CI checks:
  ✓ All required meta tags present
  ✓ Node ID exists in knowledge-tree.json
  ✓ Prerequisites are valid node IDs
  ✓ Single HTML file, < 500KB (excl. media)
  ✓ No external JS dependencies (CDN allowed)
  ↓
Maintainer reviews & merges
  ↓
Auto-deployed to GitHub Pages
  ↓
Discussion auto-created for ratings
```

---

## 7. Knowledge Gap Discovery

Nodes in the tree with `courses: []` are **gaps**.

The tree visualization shows them as:
- **Dashed border** nodes
- Tooltip: "This topic needs a course! Click to contribute."
- Links to a pre-filled issue template

---

## 8. Three Views for Homepage

| View | URL | Function |
|:---|:---|:---|
| 📋 Gallery | `index.html` | Card grid, filter by subject/grade |
| 🌳 Tree | `tree.html` | D3.js force-directed graph |
| 🛤️ Path | `path.html` | Select goal → auto-plan route |

Navigation bar switches between views.

---

## 9. File Structure

```
teachany-opensource/
├── data/
│   ├── trees/
│   │   ├── math-middle.json        ← Grades 7-9 math
│   │   ├── physics-middle.json     ← Grades 8-9 physics
│   │   ├── biology-high.json       ← Grades 10-12 biology
│   │   ├── geography-high.json     ← Grades 10-12 geography
│   │   └── chinese-elementary.json ← Grades 1-6 Chinese
│   └── ratings.json                ← Auto-generated by GH Action
├── examples/          ← Official courses (maintainer)
├── community/         ← Community courses (via PR)
├── index.html         ← Gallery view
├── tree.html          ← Knowledge tree visualization
├── path.html          ← Learning path planner
└── .github/
    └── workflows/
        ├── validate-course.yml  ← PR validation
        └── update-ratings.yml   ← Nightly rating sync
```

---

## 10. Implementation Phases

| Phase | Content | Effort |
|:---|:---|:---|
| **Phase 1** ✅ | Meta tag spec + math tree JSON + tag existing courses | Now |
| **Phase 2** | tree.html (D3.js knowledge tree visualization) | 1 session |
| **Phase 3** | path.html (learning path planner + localStorage) | 1 session |
| **Phase 4** | GitHub Actions: validate-course.yml (PR CI) | 1 session |
| **Phase 5** | GitHub Actions: update-ratings.yml (Discussion → ratings.json) | 1 session |

---

## Cost Analysis

| Component | Service | Cost |
|:---|:---|:---|
| Hosting | GitHub Pages | **Free** |
| CI/CD | GitHub Actions | **Free** (2000 min/month) |
| Rating storage | GitHub Discussions + JSON | **Free** |
| User auth | GitHub OAuth (for rating) | **Free** |
| Student progress | localStorage | **Free** |
| Domain (optional) | Custom domain | ~$10/year |

**Total: $0/month**
