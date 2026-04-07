# TeachAny Methodology: A Deep Dive into Learning Science

TeachAny integrates 6+ evidence-based learning science theories into a unified instructional design system. This document explains each theory, its research foundation, and exactly how TeachAny applies it.

---

## 1. ABT Narrative Structure (And-But-Therefore)

### Research Foundation

Developed by Randy Olson, a marine biologist turned communication expert, the ABT framework distills the universal story structure into three words:

- **And** — Agreement / Context (what we already know)
- **But** — Contradiction / Problem (what doesn't work)
- **Therefore** — Consequence / Solution (what we need to learn)

> Olson, R. (2015). *Houston, We Have a Narrative: Why Science Needs Story*. University of Chicago Press.

### Why It Works for Education

Traditional teaching starts with "Today we'll learn about X." This tells students *what* but not *why*. The ABT framework creates a **knowledge gap** — the "But" creates tension that the lesson resolves.

Research shows that narrative structures improve retention by 22% compared to expository text (Graesser et al., 2002).

### How TeachAny Applies It

Every module opens with an ABT introduction:

```
[Math] You can plot y=ax²+bx+c (And), but point-by-point plotting is slow (But),
completing the square reveals the vertex instantly (Therefore)

[Biology] You know cells divide by mitosis (And), but that only makes identical
copies (But), sexual reproduction needs meiosis to halve chromosomes (Therefore)

[History] You know the Warring States were competing (And), but why did Qin
ultimately win (But), the key was Shang Yang's reform (Therefore)
```

---

## 2. Cognitive Load Theory (CLT)

### Research Foundation

John Sweller's CLT identifies three types of cognitive load that affect learning:

| Load Type | Description | Manageable? |
|:----------|:-----------|:------------|
| **Intrinsic** | Inherent difficulty of the material | Reduce by sequencing and segmenting |
| **Extraneous** | Caused by poor instructional design | Minimize through better design |
| **Germane** | Productive effort in schema construction | Maximize through active tasks |

> Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257-285.
>
> Sweller, J., Ayres, P., & Kalyuga, S. (2011). *Cognitive Load Theory*. Springer.

### Key Findings

- Working memory can hold approximately 4±1 chunks at a time (Cowan, 2001)
- Split attention between multiple sources increases extraneous load
- Redundant information (e.g., reading text aloud that's already on screen) hinders learning

### How TeachAny Applies It

| CLT Principle | TeachAny Implementation |
|:-------------|:----------------------|
| ~4 chunks in working memory | **~75 words per card**, one core question per module |
| Reduce split attention | Related text placed adjacent to visuals (Mayer's Contiguity) |
| Reduce redundancy | Animations use keywords on screen, not full text |
| Increase germane load | Active tasks: predict, compare, classify, explain, design |
| Sequencing | New concept → immediate example → immediate practice |

---

## 3. Mayer's Multimedia Learning Principles

### Research Foundation

Richard Mayer's research program has produced 15+ evidence-based principles for combining words and pictures in instruction:

> Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press.
>
> Mayer, R.E. (2021). *Multimedia Learning* (3rd ed.). Cambridge University Press.

### Principles Used in TeachAny

| Principle | Definition | Effect Size (d) | TeachAny Application |
|:----------|:----------|:---------------|:--------------------|
| **Contiguity** | Place related text and images near each other | 1.10 | Formula explanations directly next to formulas |
| **Signaling** | Use visual cues to highlight key information | 0.41 | Bold, highlight color, arrows for key steps |
| **Segmenting** | Break long content into learner-paced segments | 0.79 | "Click to reveal next step" interactions |
| **Pre-training** | Introduce key terms before the main lesson | 0.85 | New terms defined on first appearance |
| **Redundancy** | Don't present identical text and narration simultaneously | 0.86 | Animations show keywords, not full paragraphs |
| **Coherence** | Remove extraneous content | 0.86 | Content audit: Essential / Helpful / Decorative |

---

## 4. ConcepTest & Peer Instruction

### Research Foundation

Eric Mazur's Peer Instruction method, developed at Harvard for physics courses, uses "ConcepTests" — conceptual multiple-choice questions designed to:

1. Test understanding, not memorization
2. Target common misconceptions
3. Achieve 30-70% first-attempt accuracy (the "sweet spot")

> Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall.
>
> Crouch, C.H. & Mazur, E. (2001). Peer Instruction: Ten years of experience and results. *American Journal of Physics*, 69(9), 970-977.

### Why 30-70% Is the Sweet Spot

| First-attempt accuracy | Implication | Action |
|:----------------------|:-----------|:-------|
| < 30% | Most students don't understand | Re-teach before discussion |
| **30-70%** | **Productive disagreement** | **Peer discussion → re-vote → explanation** |
| > 70% | Most already understand | Move on, brief confirmation |

### How TeachAny Applies It

- Every module includes at least one ConcepTest-style question
- Questions target specific misconceptions, not surface recall
- Error feedback is **per-option** — each wrong answer gets a specific diagnosis
- Example: "You chose (-3, 2) → The minus sign before h means x-3 corresponds to h=3, not -3"

---

## 5. Bloom's Revised Taxonomy

### Research Foundation

The revised Bloom's Taxonomy (Anderson & Krathwohl, 2001) defines 6 levels of cognitive processes:

> Anderson, L.W. & Krathwohl, D.R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. Longman.

### The 6 Levels

```
Create    ← Design a parabola meeting constraints
Evaluate  ← Judge if "vertex at (-2,3)" is correct and why
Analyze   ← Derive why h=-b/(2a) is the axis of symmetry
Apply     ← Use completing the square to find the vertex
Understand← Explain the difference between a>0 and a<0
Remember  ← Write the general form of a quadratic function
```

### How TeachAny Applies It

TeachAny's **Three-Level Progressive Exercises** map directly to Bloom's:

| Exercise Level | Bloom's Levels | Characteristics |
|:--------------|:--------------|:---------------|
| Level 1 Foundation | Remember, Understand | Single-point, clear, quick feedback |
| Level 2 Application | Apply, Analyze | Requires method selection, multi-step |
| Level 3 Transfer | Evaluate, Create | New context, open-ended, comprehensive |

**Rule**: Every courseware must cover at least 3 Bloom levels. Most cover 5-6.

---

## 6. Scaffolding Theory

### Research Foundation

The concept of scaffolding originates from Vygotsky's Zone of Proximal Development and was formalized by Wood, Bruner, and Ross:

> Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100.
>
> Vygotsky, L.S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.

### The Principle

Scaffolding means providing temporary support that is gradually removed as the learner gains competence:

```
Full scaffold  →  Partial scaffold  →  No scaffold
(I do, we do)     (We do, you try)     (You do)
```

### How TeachAny Applies It

TeachAny implements three-level scaffolding for production tasks:

| Level | Support Provided | Example (Math) | Example (English) |
|:------|:----------------|:---------------|:-----------------|
| **Level 1** | Template / fill-in / half-finished | Step-by-step guided derivation | Complete dialogue script |
| **Level 2** | Structural hints / keywords | Strategy hints only | Key phrase prompts |
| **Level 3** | Task requirements only | Independent problem | Free conversation |

---

## 7. The Five-Lens Method (TeachAny Original)

### Design Rationale

Drawing from Wiggins & McTighe's "Understanding by Design" and Perkins' "Teaching for Understanding," TeachAny synthesizes 5 cognitive approaches for decomposing any difficult concept:

> Wiggins, G. & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.
>
> Perkins, D. (1998). *Smart Schools: Better Thinking and Learning for Every Child*. Free Press.

### The Five Lenses

| Lens | Cognitive Action | Primary Use |
|:-----|:----------------|:-----------|
| 👁️ **See It** | Perceive, observe, visualize | Making abstract concepts concrete |
| 🔧 **Break It** | Decompose, sequence, analyze structure | Understanding complex processes |
| 💡 **Explain It** | Identify causes, mechanisms, rules | Building causal understanding |
| ⚖️ **Compare It** | Contrast, differentiate, analogize | Disambiguating similar concepts |
| 🎯 **Transfer It** | Apply to new contexts | Verifying true understanding |

### Selection Heuristics

| Student Says | Recommended Lenses |
|:------------|:-------------------|
| "I don't get it" | See + Break |
| "I can't tell them apart" | Compare + Explain |
| "I can't do it" | Break + Transfer |
| "I don't know why" | Explain + See |

---

## 8. Additional Influences

### Content Audit (Essential / Helpful / Decorative)

Based on Ruth Clark's evidence-based training principles:

> Clark, R.C. (2019). *Evidence-Based Training Methods* (3rd ed.). ATD Press.

### 18-Minute Attention Rule

Based on research on attention span in learning contexts:

> Wilson, K. & Korn, J.H. (2007). Attention during lectures: Beyond ten minutes. *Teaching of Psychology*, 34(2), 85-89.

TeachAny inserts an "attention reset point" every 15-18 minutes, switching the learner from input mode to output mode.

### Three Question Types

Inspired by assessment design research:

> Pellegrino, J.W., Chudowsky, N., & Glaser, R. (2001). *Knowing What Students Know*. National Academies Press.

The three types (Objective, Explanation, Production) ensure assessment covers both recall and deep understanding.

---

## References (Complete)

1. Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman.
2. Clark, R.C. (2019). *Evidence-Based Training Methods* (3rd ed.). ATD Press.
3. Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1), 87-114.
4. Crouch, C.H. & Mazur, E. (2001). Peer Instruction: Ten years of experience and results. *American Journal of Physics*, 69(9), 970-977.
5. Graesser, A.C., Olde, B., & Klettke, B. (2002). How does the mind construct and represent stories? In M.C. Green, J.J. Strange, & T.C. Brock (Eds.), *Narrative Impact*. Lawrence Erlbaum.
6. Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press.
7. Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall.
8. Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press.
9. Pellegrino, J.W., Chudowsky, N., & Glaser, R. (2001). *Knowing What Students Know*. National Academies Press.
10. Perkins, D. (1998). *Smart Schools*. Free Press.
11. Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285.
12. Vygotsky, L.S. (1978). *Mind in Society*. Harvard University Press.
13. Wiggins, G. & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.
14. Wilson, K. & Korn, J.H. (2007). Attention during lectures: Beyond ten minutes. *Teaching of Psychology*, 34(2), 85-89.
15. Wood, D., Bruner, J.S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89-100.
