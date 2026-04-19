---
name: TeachAny
description: "K-12 interactive courseware development skill. Triggered when users need to create teaching courseware, interactive lessons, educational animations, or mention K-12, courseware, instructional design, topic explanation, 历史地图, 地形底图, hillshade, 古典文明, 交互地图, interactive map, AI学伴, AI tutor, PPTX导出, 课标, IB, A-Level, AP, 知识图谱, knowledge graph. Covers Math, Physics, Chemistry, Biology, Geography, History, Chinese Language, English, and IT. Integrates Cognitive Load Theory, ABT Narrative, Bloom's Taxonomy, Peer Instruction, and more."
---

# TeachAny: K-12 Interactive Courseware Development Skill

A skill for developing interactive courseware across all K-12 subjects. The goal is not to "dump knowledge onto a page" but to design a lesson as **a learning experience with motivation, rhythm, interaction, and an assessment loop**.

This skill is applicable to:
- Math, Physics, Chemistry, Biology, Geography, History, Chinese Language, English, IT, and more
- Static web courseware, interactive web pages, classroom presentations, teaching animations, micro-lectures, post-class exercises
- From "a single concept" to "a complete lesson" — instructional design and implementation

**Default Principle**: Learning loop first, visual polish second. Student comprehension first, page aesthetics second.

---

## 1. When to Use

Use this skill when the user requests:
- "Create a courseware for middle school / high school XX"
- "Help me design a lesson on XX"
- "Turn this concept into an interactive web page / animation"
- "Help me explain why XX works / how to understand XX"
- "Add exercises, interactions, or instructional design to this courseware"

When the task clearly belongs to a single tool (e.g., converting to Word, exporting PPT), combine with other skills; but whenever the core problem is **instructional design and courseware experience**, `TeachAny` should lead.

---

## 2. Universal Instructional Design Foundation

The following methods apply to virtually all subjects — they form the "operating system" of this skill.

### 2.1 Answer 6 Questions Before Development

Before writing any code, answer these 6 questions:

| # | Question | Purpose |
|:-:|:---------|:--------|
| 1 | **Who are the students?** Grade, baseline, common state | Determines difficulty, pacing, and language |
| 2 | **What are the prerequisites?** | Determines if scaffolding or pre-test is needed |
| 3 | **What should they be able to DO after?** | Turns "knowing" into observable tasks |
| 4 | **What is the real-world scenario?** | Provides learning motivation |
| 5 | **Where do they most commonly get stuck?** | Drives "deep understanding" and error diagnosis design |
| 6 | **How do we verify they learned?** | Determines exercise and assessment approach |

**Output Requirement**: These 6 questions must be translated into actual courseware structures, not left as planning notes.

### 2.2 ABT Narrative Structure: And-But-Therefore

Every new module defaults to a three-part introduction:

```text
[And]  What students already know
[But]  What problem their existing knowledge can't solve
[Therefore]  What new tool/perspective this lesson provides
```

**Examples**:
- Math: You can already plot lines (And), but some trajectories are curved (But), so we need quadratic functions (Therefore)
- History: You know the sequence of events (And), but not why they happened (But), so we'll analyze causal chains and primary sources (Therefore)
- English: You know the vocabulary (And), but can't use it in real conversation (But), so we'll practice situational expression (Therefore)
- Biology: You know plant and animal cells look different (And), but not how one cell becomes two (But), so we'll learn meiosis (Therefore)

### 2.3 Content Audit: Essential / Helpful / Decorative

Classify all content before layout:

| Level | Definition | Treatment |
|:-----:|:-----------|:----------|
| 🔴 Essential | Can't learn without it | Must appear on the main path |
| 🟡 Helpful | Deepens understanding | Place in "deep dive", "expand" cards, or supplementary sections |
| ⚪ Decorative | Minimal impact on learning outcomes | Remove if possible — avoid information noise |

**Hard Rule**: Decorative content must never outweigh essential content on any page.

### 2.4 Cognitive Load Management (Sweller)

| Load Type | Common Manifestation | Design Countermeasure |
|:----------|:---------------------|:---------------------|
| **Intrinsic** | Concept is inherently complex | Break into steps, layer, example-first-then-abstract |
| **Extraneous** | Too much text, chaotic animations, too many colors | Limit word count, limit effects, unified visual rules |
| **Germane** | Student actively organizing knowledge | Design prediction, comparison, classification, transfer tasks |

**Recommended Metrics**:
- Core information per card: ~**75 words**
- One module = **1 core question**
- After a new concept, immediately provide 1 example or 1 interaction
- Never sacrifice readability for aesthetics

### 2.5 Mayer's Multimedia Learning Principles

When designing text-image layout and animation-narration coordination:

| Principle | Meaning | Courseware Application |
|:----------|:--------|:---------------------|
| **Contiguity** | Related text and images together | Formula explanation right next to formula |
| **Redundancy** | Don't simultaneously present text + voice saying the same thing | When animation has narration, screen shows only keywords |
| **Signaling** | Use visual cues to guide attention | Highlight, arrows, bold for key steps |
| **Segmenting** | Present long content in segments | Break complex processes into "click next" or scenes |
| **Pre-training** | Explain key terms before using them | One-sentence definition when a term first appears |

### 2.6 Scaffolding Strategy

For tasks requiring student output (write, speak, build, draw), use "provide scaffolds, then gradually remove":

```text
Level 1 (Full scaffold):  Template/fill-in/half-finished → student completes
Level 2 (Partial scaffold): Structure hints/keywords → student organizes
Level 3 (No scaffold):    Only task requirements → student works independently
```

**Applications**:
- Chinese writing: Sentence template → Paragraph structure hints → Free writing
- English speaking: Dialogue script → Key phrase prompts → Free conversation
- Math problem solving: Step-by-step guidance → Strategy hints → Independent solving
- History essay: Argument + evidence framework → Argument prompts → Free argumentation

### 2.6.1 Adaptive Learning Design ⛔ MUST READ

Adaptive learning is not just a code engine (`TeachAnyAdaptive`, see Section 17.2) — it is the **underlying logic of courseware content design**. When designing courseware, the AI must plan **differentiated learning paths and content** for students at different mastery levels.

#### Four-Branch Content Design

`decideBranch()` returns four paths. Each path **must have corresponding differentiated content** — not just the `normal` path:

| Branch | Trigger | Required Content | Forbidden |
|:---|:---|:---|:---|
| **review-prereq** | Prerequisites mastery < 0.5 | ① 1-2 diagnostic questions on prerequisites ② Link card to prerequisite courseware ③ "Continue anyway" button (never block) | ❌ Must not be just "Please learn XX first" |
| **scaffold** | Current node mastery < 0.3 | ① Extra worked example (step-by-step) ② Lower Bloom-level exercises ③ More visual aids and analogies | ❌ Must not be identical to normal path |
| **normal** | Mastery 0.3–0.8 | Standard teaching flow (ABT → explain → practice → feedback) | — |
| **challenge** | Mastery ≥ 0.8 | ① Skip basic explanation, go to synthesis ② Higher Bloom tasks (Analyze/Evaluate/Create) ③ Cross-topic problems or open inquiry | ❌ Must not be just "more of the same" |

#### Phase 1 Adaptive Design Requirements

During Phase 1 (building the instructional skeleton), complete these adaptive planning items:

```text
Adaptive Design Checklist (Phase 1 required):
1. Prerequisite chain (from _graph.json prerequisites)
   → Where might students get stuck?
   → What does the review-prereq path show?

2. Scaffold path design
   → What are the 1-2 hardest concepts in this lesson?
   → What extra help is provided for "never seen this" students?

3. Challenge path design
   → What extension is provided for "already mastered" students?
   → E.g.: cross-chapter synthesis, open inquiry, variant problems

4. Branch trigger points
   → Where in the courseware does decideBranch() get called? (minimum 2)
   → Typically: after pre-test + after core practice
```

#### Standard Branch Trigger Positions

```text
Adaptive trigger points in courseware structure:
┌── Pre-test ──────┐
│ High score → challenge (skip basics)
│ Mid score  → normal
│ Low score  → scaffold (add prerequisite review)
└──────────────────┘
     ↓
┌── Core Practice ──┐
│ All correct  → challenge extensions
│ Some correct → normal consolidation
│ Many errors  → scaffold extra worked examples + retry
└───────────────────┘
     ↓
┌── Synthesis Task ──┐
│ High mastery → open inquiry / creative task
│ Mid mastery  → standard synthesis
│ Low mastery  → simplified version with hints
└────────────────────┘
```

#### Hard Rules

- **Every courseware must have at least 2 adaptive trigger points** (after pre-test + after core practice)
- **Scaffold path must have substantively different content** (not just the same content + hints)
- **Challenge path must provide higher Bloom-level tasks** (not just more problems)
- **Review-prereq path must provide actionable review resources** (links or embedded mini-review)
- **Never block the student** — all branches provide a "skip/continue" option

### 2.6.2 Inquiry-Based Learning ⛔ MUST READ

Inquiry-based learning is not just "let students do experiments." It is a **question-driven, evidence-oriented, student-led** teaching strategy that spans science experiments, humanities argumentation, math modeling, and more.

#### When Inquiry Is Required

| Scenario | Inquiry Required? | Notes |
|:---|:---|:---|
| `curriculum_standards` contains "探究" (inquiry) keyword | ⛔ Required | Standards-mandated inquiry cannot be converted to lecture |
| `bloom_verbs` contain `create`/`evaluate` | ⛔ Strongly recommended | Higher-order goals naturally suit inquiry |
| Lab/Practical lesson type | ⛔ Required | Activity-driven + inquiry structure |
| Thematic lesson type | ⛔ Recommended | Topic inquiry + multi-angle analysis |
| Pure concept + young learners | Optional | Use "guided inquiry" (more scaffolding) |
| Pure calculation/skill drill | Not needed | Step-by-step scaffolding suffices |

#### Four-Level Inquiry Depth Model

| Level | Name | Teacher Control | Grade Band | Courseware Implementation |
|:---|:---|:---|:---|:---|
| **L1 Structured** | Teacher gives question + method + steps | High (80%) | Elementary, early middle | Step-by-step cards + "Next" button + instant feedback |
| **L2 Guided** | Teacher gives question + direction | Medium (50%) | Middle school | Question cards → student chooses method → execute → compare |
| **L3 Open** | Teacher gives question only | Low (20%) | High school | Learning record sheet (project planner) + rubric |
| **L4 Self-directed** | Student poses own question | Very low (10%) | Advanced HS / competition | Open task + presentation + peer review |

**Selection Rules**:
- Elementary: default L1, max L2
- Middle school: default L2, may use L3
- High school: default L2-L3, advanced students L4
- **A single courseware can mix levels** (L1 warm-up → L2/L3 main inquiry)

#### Standard Inquiry Module Structure

When the lesson type requires inquiry, use this 6-step structure:

```text
Standard Inquiry Structure (6 steps):
1. Situational Question — Present a real phenomenon/contradiction to spark curiosity
   → Courseware: ABT intro + phenomenon image/video/animation
   → Output: Student's initial prediction (fillable prediction card)

2. Form Hypothesis — Guide students to formulate a testable hypothesis
   → L1: Give 2-3 hypothesis options for selection
   → L2/L3: Students write their own hypothesis (learning record sheet)

3. Design Verification — Determine the experiment/investigation plan
   → L1: Give complete steps, student confirms understanding
   → L2: Give key steps, student fills in missing parts
   → L3: Student designs independently, courseware provides rubric
   → ⚠️ Science must specify controlled variable + control group

4. Collect Evidence — Execute experiment/observation/data collection
   → Science: Parameter sliders + real-time data charts
   → Humanities: Source reading + evidence annotation
   → Math: Dynamic geometry manipulation + data recording

5. Analyze & Conclude — Analyze data, draw conclusions, answer the initial question
   → Key: Compare initial prediction vs actual result (cognitive conflict moment)
   → L1-L2: Select conclusion → explain why
   → L3: Write conclusion + cite evidence

6. Reflect & Extend — Reflect on the inquiry process, transfer to new contexts
   → "What if we changed XX condition?"
   → "Where else does this principle apply in daily life?"
```

#### Hard Rules for Inquiry

1. **Standards-mandated inquiry experiments must not be converted to lecture** — if `curriculum_standards` says "探究 XX", the courseware must include the full 6-step inquiry structure
2. **Every inquiry activity must have a learning record sheet** — using the 4 types defined in Section 2.6
3. **Inquiry must have a "cognitive conflict moment"** — where the student's initial guess contradicts the actual result
4. **Science inquiry must specify controlled variables** — "What changes? What stays the same? What do we measure?"
5. **Inquiry depth must match grade band** — elementary ≠ L4, high school ≠ all L1
6. **Humanities can be inquiry too** — history source analysis, literary text comparison, geographic regional surveys are all forms of inquiry

### 2.7 Learning Loop First, Visual Polish Second

Priority order:

```text
Clear learning objectives > Effective task design > Error-correcting feedback > Good-looking pages > Cool animations
```

If time is limited, prioritize:
- A real problem introduction
- A completable task
- Targeted feedback
- A summary that connects beginning and end

---

## 3. Lesson Types: Different Structures for Different Types

Not all lessons are "new concept" lessons. First determine the lesson type, then select the structure template.

| Lesson Type | Core Goal | Recommended Structure |
|:------------|:----------|:---------------------|
| **New Concept** | Build new concepts/methods | ABT intro → New knowledge → Deep understanding → Immediate practice → Summary |
| **Review** | Organize and connect existing knowledge | Knowledge map → Common error analysis → Comprehensive practice → Gap filling |
| **Practice** | Improve problem-solving ability | Typical examples → Variations → Error classification → Generalization |
| **Thematic** | Deep exploration around a topic | Theme intro → Multi-material analysis → Comprehensive output task → Reflection |
| **Lab/Practical** | Hands-on operation and observation | Goal prediction → Steps → Record observations → Conclusions & discussion |

**Decision Logic**: User says "teach a new concept" → New Concept; "create a practice set" → Practice; "help students review" → Review; "thematic exploration" → Thematic.

---

## 4. From "Universal" to "Subject-Specific"

This skill does NOT default to teaching all subjects the same way. Build the universal foundation first, then switch to subject-specific mode.

### 4.1 Subject Adaptation Matrix

| Subject | Primary Learning Objects | Best Teaching Approach | Best Interaction Type | Best Assessment Style |
|:--------|:----------------------|:----------------------|:---------------------|:---------------------|
| **Math** | Concepts, relationships, operations, proofs | Visual intuition + algebraic reasoning + generalization | Graphing, dragging, step-by-step derivation, error diagnosis | Standard + explanation questions |
| **Physics** | Phenomena, models, formulas, predictions | Observation + modeling + quantitative analysis | Parameter sliders, experiment prediction, graph reading | Prediction + calculation + explanation |
| **Chemistry** | Phenomena, micro-mechanisms, symbolic expression | Macro phenomenon + micro particles + chemical language | Experiment flow, condition judgment, equation balancing | Experiment explanation + structured response |
| **Biology** | Structures, processes, functions, regulation | Structure diagrams + process chains + functional connections | Labeling, sorting, flowchart puzzles, case judgment | Diagram questions + process explanation |
| **Geography** | Spatial distribution, causes, regional differences | Map observation + causal chains + regional comparison | Map location, chart reading, causal chain dragging | Material analysis + regional comparison |
| **History** | Chronology, causation, evidence, perspectives | Timeline + primary sources + multi-perspective interpretation | Sorting, source comparison, stance analysis | Source-based + essay questions |
| **Chinese Language** | Text, language, emotion, expression | Close reading + expression techniques + theme transfer | Annotation, rewriting, reading tips, imitation writing | Annotation + expression tasks + rubric |
| **English** | Vocabulary, grammar, discourse, communication | Input comprehension + scaffolded output + contextual application | Shadowing, matching, fill-in, dialogue scripts, role-play | Integrated skills assessment |
| **IT** | Tools, processes, structures, implementation | Task-driven + step-by-step demo + debugging feedback | Click operations, flowcharts, code execution, error troubleshooting | Task completion + process check |

### 4.2 Subject-Specific "Deep Understanding" Frameworks

Don't turn every subject into "formula derivation class." Switch explanation frameworks by subject:

| Subject | Deep Understanding Priority Framework |
|:--------|:--------------------------------------|
| **Math** | Visual intuition → Algebraic process → Generalization |
| **Physics** | Observation → Model hypothesis → Predictive law |
| **Chemistry** | Macro phenomenon → Micro explanation → Symbolic expression |
| **Biology** | Structural features → Process mechanism → Functional outcome |
| **Geography** | Spatial distribution → Formation cause → Regional comparison |
| **History** | Chronological thread → Causal chain → Source evidence / multi-perspective |
| **Chinese Language** | Language detail → Expression effect → Theme / emotion / transfer |
| **English** | Language input → Structure scaffold → Contextual output |
| **IT** | Task goal → Operation flow → Debugging & optimization |

### 4.3 Universal Difficulty-Busting: The Five-Lens Method

When students ask "why?", "how to distinguish?", or "why do I always get it wrong?", select 2-3 of these 5 lenses:

| Lens | Meaning | Best for |
|:-----|:--------|:---------|
| 1. **See It** | Observe phenomena, examples, texts, images, data | Science experiments, geography charts, literature texts |
| 2. **Break It** | Decompose structure, steps, components | Math derivation, chemical reactions, grammar, IT processes |
| 3. **Explain It** | Clarify cause, mechanism, rules, expression effects | Physics principles, biological processes, historical causation |
| 4. **Compare It** | Contrast with similar concepts, opposite cases, incorrect examples | Easily confused concepts, common errors, synonym disambiguation |
| 5. **Transfer It** | Apply to new contexts to test true understanding | All subjects' "did they really learn it?" check |

**Selection Guide**:
- Student says "I don't get it" → Prioritize **See + Break**
- Student says "I can't tell them apart" → Prioritize **Compare + Explain**
- Student says "I can't do it" → Prioritize **Break + Transfer**
- Student says "I don't know why" → Prioritize **Explain + See**

**Examples**:
- Math "Why does completing the square reveal the vertex?": **See** graph → **Break** the process → **Transfer** to general form
- History "Why did the reform fail?": **See** timeline → **Compare** different forces → **Explain** causal chain
- Chinese "Why is this sentence powerful?": **See** original text → **Break** expression technique → **Transfer** to imitation writing
- English "What vs. which — how to choose?": **Compare** contexts → **Explain** rule → **Transfer** to new examples

---

## 5. Project-Based & Task-Driven Learning

Prioritize "question/task-driven" over "concept-listing-driven."

### 5.1 Recommended Introduction Sequence

```text
Real task / phenomenon / problem → Student attempts → Expose gaps → Introduce new knowledge → Immediate application
```

### 5.2 Subject-Specific Task Introduction Examples

- **Math**: How do you design a parabola so a basketball lands exactly in the hoop?
- **Physics**: Why do a paper ball and a flat sheet fall differently with the same force?
- **Chemistry**: Why do different acids produce different experimental results?
- **Biology**: Why does breathing speed up after intense exercise?
- **Geography**: Why do places at the same latitude have very different climates?
- **History**: Why do different historical sources describe the same event differently?
- **Chinese**: Why does this passage create such vivid imagery? Would a different writing style work?
- **English**: If you're at a restaurant abroad, how do you complete the entire ordering process in English?
- **IT**: How do you build a tool that automatically calculates totals and ranks them?

---

## 6. Interaction & Page Component Library

Courseware should not only have "lecture cards + multiple choice." Switch interaction forms by subject.

### 6.1 Universal Interactive Components

| Component | Purpose | Applicable Subjects |
|:----------|:--------|:-------------------|
| **Pre-test / Post-test** | Verify learning loop completion | All |
| **ConcepTest** | Check true understanding, not just memorization | All |
| **Drag-and-drop sorting** | Build chronological, procedural, structural relationships | History, Biology, Chemistry, IT |
| **Classification matching** | Distinguish concepts, meanings, phenomena, evidence | Chinese, English, Biology, Geography |
| **Image/map annotation** | Strengthen visual recognition and spatial understanding | Math, Geography, Biology |
| **Text annotation** | Focus on language detail and evidence location | Chinese, English, History |
| **Parameter slider** | Observe how variable changes affect results | Math, Physics |
| **Step-by-step derivation** | Help students build complete process awareness | Math, Chemistry, IT |
| **Situational dialogue cards** | Train expression and output | English, Chinese |
| **Experiment prediction cards** | Predict first, then verify | Physics, Chemistry, Biology |
| **Scaffolded writing frame** | Provide structure hints to support output | Chinese, English, History |
| **Timeline / flowchart** | Build linear sequence awareness | History, Biology, Chemistry |
| **Comparison columns** | Side-by-side display of two viewpoints/versions/approaches | History, Chinese, Geography |

### 6.2 Recommended Module Structure

A typical module contains these 6 blocks:

```text
1. Introduction question (ABT or task-driven)
2. Core explanation (text/image/animation/steps)
3. Deep understanding (select 2-3 Five-Lens approaches)
4. Immediate practice (with instant feedback)
5. Error diagnosis feedback (targeted)
6. Summary & transfer (one-sentence summary + one transfer question)
```

If content is difficult, split into two sub-modules; never cram multiple major difficulties into one module.

### 6.3 The 18-Minute Attention Rule

Design an "attention reset point" approximately every 15-18 minutes:
- Switch from "watching" to "doing"
- Switch from "listening to explanations" to "making judgments"
- Switch from "input" to "output"
- Switch from "abstract" to "real-world case"

**Common Reset Methods**:
- A concept judgment question (ConcepTest)
- An error analysis example
- A mini experiment / observation
- A one-minute retelling task
- A role-switch / dialogue task

---

## 7. Assessment System

### 7.1 Bloom's Cognitive Level Reference Table

Design exercises referencing this table — ensure you don't stop at "Remember":

| Level | Key Verbs | STEM Question Example | Humanities Question Example |
|:------|:----------|:---------------------|:---------------------------|
| **Remember** | Identify, list, state | Write the general form of a quadratic function | List the chronological order of events |
| **Understand** | Explain, compare, describe | Explain the difference between a>0 and a<0 graphs | Summarize the main idea in your own words |
| **Apply** | Calculate, solve, use | Find the vertex using completing the square | Complete a dialogue using the target sentence pattern |
| **Analyze** | Derive, distinguish, categorize | Analyze why h=-b/(2a) is the axis of symmetry | Analyze the author's intent in using a specific rhetorical device |
| **Evaluate** | Judge, verify, assess | Judge whether "vertex at (-2,3)" is correct and explain | Evaluate which of two sources is more credible and why |
| **Create** | Design, construct, propose | Design a parabola equation meeting given conditions | Write a descriptive paragraph using metaphor |

### 7.2 Three-Level Progressive Exercises

| Level | Goal | Characteristics |
|:-----:|:-----|:---------------|
| **Level 1 Foundation** | Remember, identify, understand | Single-point, clear, quick feedback |
| **Level 2 Application** | Apply, analyze | Requires method selection, step organization |
| **Level 3 Transfer Challenge** | Evaluate, create | New context, comprehensive task, open expression |

### 7.3 Three Question Types Must Be Combined

| Type | Purpose | Applications |
|:-----|:--------|:-------------|
| **Objective** | Quick error detection | Multiple choice, true/false, matching, drag-and-drop |
| **Explanation** | Check true understanding | "Why?", "What's the evidence?", "Which step went wrong?" |
| **Production** | Check transfer and expression ability | Write a paragraph, draw a diagram, solve a problem, complete a task |

**Ratio Suggestions**:
- STEM: Objective 50% + Explanation 30% + Production 20%
- Humanities: Objective 30% + Explanation 30% + Production 40%

### 7.4 Common Error Tracking

For every key question, supplement with:
- **Common errors**: Where students most often go wrong
- **Error causes**: Concept confusion, step omission, or expression confusion
- **Feedback method**: Tell students "what went wrong, why, and how to fix it"

**Note**:
- Math/Physics/Chemistry: Best suited for "error diagnosis" (e.g., "You flipped the sign of h")
- Chinese/English/History: Best suited for "quality feedback" (e.g., "Your evidence is insufficient — try quoting from paragraph X")

### 7.5 Rubric Evaluation for Open Tasks

When answers aren't unique, use rubrics instead of forcing right/wrong judgments.

**Universal Four-Dimension Rubric** (adjust weights by subject):

| Dimension | Description | STEM Emphasis | Humanities Emphasis |
|:----------|:------------|:-------------|:-------------------|
| **Content Accuracy** | Is information correct and on-topic? | Calculation correct, principles correct | Facts correct, viewpoint valid |
| **Evidence Sufficiency** | Is there supporting evidence? | Complete derivation, data citation | Text citation, materials, details |
| **Structural Clarity** | Is expression organized? | Ordered steps | Logical paragraphs |
| **Expression Quality** | Is language accurate and appropriate? | Correct symbols and units | Accurate vocabulary and register |

### 7.6 ConcepTest & Peer Discussion

- Present a concept question first
- Students answer independently
- If accuracy is **30%-70%**, it's ideal for peer discussion
- After discussion, answer again, then provide explanation

Applicable subjects:
- Math, Physics: Concept disambiguation
- History: Viewpoint and evidence matching
- Chinese, English: Expression effect and context judgment

---

## 8. Prerequisite Chains & Grade-Level Differences

### 8.1 Establish Prerequisite Knowledge Chains

Every courseware must clearly answer:
- What must students know before this lesson?
- Which errors actually stem from unmastered prerequisites?
- Which content can be skipped after a pre-test?

### 8.2 Recommended Module Organization Sequence

```text
Scope → Objectives → Structure → Content → Assessments
```

Applied to courseware pages:

```text
Learning objectives → Pre-test → Module 1 → Module 2 → Module 3 → Comprehensive task → Post-test → Extension
```

### 8.3 Elementary, Middle School, and High School Differences

| Level | Design Focus | Pacing | Text Density | Interaction Style |
|:------|:------------|:-------|:-------------|:-----------------|
| **Elementary** | Story-driven, context-rich, highly visual | 5-8 min per mini-module | Low — more images, less text | Click, drag, color, simple choices |
| **Middle School** | Concrete examples to abstract concepts, error diagnosis | 10-15 min per module | Medium | Step-by-step, matching, drawing, annotation |
| **High School** | Model-building, comparative analysis, abstract transfer | 15-20 min per module | Can be higher | Derivation, argumentation, design, multi-source analysis |

---

## 9. Three Complete Micro-Examples

These examples show the full path from "6 Questions to courseware structure" for different subjects.

### Example A: Math (STEM Representative) — "Vertex Form of Quadratic Functions"

**6 Questions**:
1. Grade 9 students, already learned linear functions and general form
2. Prerequisites: Square operations, perfect square formula
3. After learning: Use completing the square to convert general form to vertex form, directly read the vertex
4. Real-world scenario: Highest point of a basketball trajectory
5. Common errors: Flipping the sign of h, forgetting to multiply by coefficient a
6. Success criteria: Can independently complete the square for y=2x²-8x+3 and write the vertex

**Courseware Structure**:
- ABT intro: "You can plot y=ax²+bx+c (And), but plotting points every time is too slow (But), completing the square lets you see the vertex instantly (Therefore)"
- Deep understanding: **See** (y=x² translation animation) → **Break** (specific example of completing the square) → **Transfer** (general formula derivation h=-b/2a)
- Interaction: Canvas board where dragging the vertex changes the equation
- Exercises: Level 1 read the vertex → Level 2 complete the square to find vertex → Level 3 design a parabola through specified points
- Error diagnosis: "(-3, 2)" → "There's a minus sign before h: x-3 corresponds to h=3, not -3"

### Example B: History (Humanities Representative) — "Why Did Shang Yang's Reform Succeed?"

**6 Questions**:
1. Grade 10 students, already learned Spring and Autumn / Warring States background
2. Prerequisites: Collapse of the feudal system, basic context of interstate rivalry
3. After learning: Use the "background-measures-resistance-outcome" framework to analyze a reform
4. Real-world scenario: Why do some reforms succeed and others fail?
5. Common errors: Confusing "reform content" with "reasons for reform success"
6. Success criteria: Can write a 200-word analysis of key factors in Shang Yang's success, citing sources

**Courseware Structure**:
- ABT intro: "You know the Warring States were competing for dominance (And), but why did Qin ultimately win (But), the key turning point was Shang Yang's reform (Therefore)"
- Deep understanding: **See** (timeline + before/after comparison data) → **Compare** (Shang Yang vs. Wu Qi's reforms) → **Explain** (key conditions for success)
- Interaction: Source comparison (two sources from different perspectives), drag-and-drop sorting (causal chain of reform measures)
- Exercises: Level 1 categorize reform measures → Level 2 "Which measure was most critical for military power?" → Level 3 "200-word essay, cite at least one source"
- Rubric feedback: Content accuracy / Evidence sufficiency / Structural clarity / Expression quality

### Example C: English (Language Representative) — "Restaurant Ordering Dialogue"

**6 Questions**:
1. Grade 8 students, already learned basic sentence patterns and food vocabulary
2. Prerequisites: can/could patterns, 30+ food vocabulary words
3. After learning: Complete a 6-8 turn ordering dialogue (inquiry, ordering, special requests, payment)
4. Real-world scenario: Eating at a restaurant abroad
5. Common errors: Direct translation from Chinese word order, inability to express "without..."
6. Success criteria: Can complete an ordering dialogue without template support

**Courseware Structure**:
- ABT intro: "You know words like hamburger and salad (And), but at a real restaurant you can't form complete sentences (But), so we'll learn the complete ordering dialogue flow (Therefore)"
- Deep understanding: **See** (real ordering dialogue text) → **Break** (dialogue split into 4 stages: seating → menu → ordering → payment) → **Compare** (correct vs. common Chinglish errors)
- Interaction: Situational dialogue cards (choose appropriate response each turn), fill-in exercises (key patterns), role-play (switch customer/server)
- Exercises: Level 1 matching (sentences to scenarios) → Level 2 fill-in-the-blank dialogue → Level 3 write a complete 8-turn dialogue
- Scaffolding: Level 1 full template → Level 2 only turn-opening words → Level 3 only scenario requirements
- Feedback: Not "right/wrong" but "would a server understand this in a real restaurant?"

---

## 10. Technical Implementation

### 10.1 Recommended Technology Stack

| Output | Recommended Tech | Use Case |
|:-------|:----------------|:---------|
| **Interactive Web Courseware** | HTML / CSS / JS / Canvas | Primary form for most courseware |
| **Programmatic Teaching Animation** | Remotion + React + TypeScript | When process demonstration or dynamic transformation is needed |
| **Hybrid Mode** | Web courseware + embedded Remotion video | Most recommended — balances interaction and presentation |
| **Coordinate Graphs & Physics Sims** | Canvas 2D API (zero-dependency) | Function plots, data charts, experiment animations (Section 18.2) |
| **Geometry & Labeled Diagrams** | Inline SVG + JS interactivity | Triangles, circles, biology diagrams, concept maps (Section 18.2) |
| **Interactive Geographic Maps** | Leaflet.js + China-friendly tiles | Pan/zoom maps for geography, monsoons, climate zones (Section 18.3) |
| **Schematic / Historical Maps** | Inline SVG (zero-dependency) | Simplified maps, dynasty territories, trade routes (Section 18.3) |

### 10.2 Interactive Web Standard Structure

```text
Hero area (lesson title + subject/grade/type tags)
Navigation (anchor links)
Learning objectives
Pre-test
Knowledge module × N
  - ABT introduction
  - Core explanation
  - Deep understanding (Five-Lens)
  - Immediate practice
  - Error feedback
Comprehensive task (with scaffolding levels)
Post-test
Extension resources
```

### 10.3 Visual Design Specification (Grade-Level Templates)

Three visual themes are provided, matched to student age groups. **Always determine the grade level first, then select the corresponding template.**

| Level | Template File | Style Keywords | Background | Palette |
|:---|:---|:---|:---|:---|
| **Elementary** (Grades 1-6) | `elementary.html` | Bright, playful, candy-colored, large rounded corners | Warm white `#fffbf0` | Coral + Mint + Lemon |
| **Middle School** (Grades 7-9) | `middle-school.html` | Fresh, clean, blue-teal gradient, moderately lively | Light gray `#f8fafc` | Sky blue + Teal + Amber |
| **High School** (Grades 10-12) | `high-school.html` | Professional, dark theme, academic feel | Deep navy `#0f172a` | Light blue + Lavender + Gold |

#### Elementary Template (`elementary.html`)
```css
:root {
  --bg: #fffbf0;       /* Warm white background */
  --primary: #ff6b6b;  /* Coral red */
  --secondary: #4ecdc4;/* Mint green */
  --accent: #ffe66d;   /* Lemon yellow */
  --card: #ffffff;     /* Pure white cards */
}
```
- Border-radius 20px, soft card shadows
- Rainbow gradient animated title text, `bounce` icon animation
- Encouraging feedback: 🎉 "Great job!" for correct, 💪 "Don't worry!" for incorrect
- Game-style practice levels ("Level 1: Basics Star" → "Level 2: Skills Pro" → "Level 3: Challenge Master")
- Nav emoji: 🌈

#### Middle School Template (`middle-school.html`)
```css
:root {
  --bg: #f8fafc;       /* Light gray-white */
  --primary: #3b82f6;  /* Sky blue */
  --secondary: #06b6d4;/* Teal */
  --accent: #f59e0b;   /* Amber */
  --card: #ffffff;     /* White cards */
}
```
- Border-radius 14px, subtle elevation shadows
- Colored top-border on objective cards (different color per card)
- Gradient left-border on section titles
- Standard Level 1/2/3 practice structure
- Nav emoji: 🎓

#### High School Template (`high-school.html`)
```css
:root {
  --bg: #0f172a;       /* Deep navy background */
  --primary: #60a5fa;  /* Light blue */
  --secondary: #a78bfa;/* Lavender */
  --accent: #fbbf24;   /* Gold */
  --card: rgba(30, 41, 59, 0.65); /* Glassmorphism */
}
```
- Border-radius 12px, `backdrop-filter: blur(10px)` glassmorphism
- Unique components: **Formula box** (`.formula-box`, gold accent, serif font), **Derivation steps** (`.derivation`, numbered step indicators)
- Restrained hover effects (background-color only, no translate)
- Nav brand uses `<strong>` tags instead of large emoji

**Shared Typography** (all three templates):
- Body: 15-16px, line-height 1.75-1.85
- Formulas/code: `Times New Roman` or monospace
- Responsive grid: `grid-template-columns: repeat(auto-fit, minmax(260-340px, 1fr))`
- Spacing: Between modules `margin: 40-46px 0`, between cards `margin-bottom: 16-20px`
- Full mobile responsive (`@media max-width: 600px`)

**Remotion Animation Specification** (if needed):
- Resolution 1920×1080, 30fps
- Single Composition 600-900 frames (20-30 seconds)
- 3-5 scenes per Composition
- Animation style: `interpolate` + `spring`, ease-in-out
- Color scheme unified with HTML courseware

---

## 11. Courseware Development Standard Workflow

### Phase 0: Define Target and Objectives
- Answer the 6 Questions
- Determine subject, grade level, lesson type (new concept / review / thematic / practice / lab)
- Decide whether pre-test, animation, or open tasks are needed

### Phase 0.5: Knowledge Layer Lookup

> Before building content, check whether the Knowledge Layer already has reusable data for the topic. **Default to graph-first + on-demand retrieval**. Do not read the whole `data/` tree up front.

#### Preferred order

1. **Start with the lightweight lookup script**:
   - Run: `python3 scripts/knowledge_layer.py lookup --topic "TOPIC" --subject SUBJECT --top 3 --errors 3 --exercises 3`
   - Examples:
     - `python3 scripts/knowledge_layer.py lookup --topic "linear function" --subject math`
     - `python3 scripts/knowledge_layer.py lookup --topic "photosynthesis" --subject biology`
   - Goal: get a **compact topic summary** first so you only load the matching `subject/domain/node`, minimizing token usage.

2. **Only read raw JSON if the compact summary is insufficient**:
   - Read `data/{subject}/{domain}/_graph.json` only after lookup identifies the best match
   - Read `_errors.json` and `_exercises.json` only when you actually need them
   - **Do not** broadly scan multiple domains without a match.

3. **When reading `_graph.json`**, prioritize these fields:
   - `definition`
   - `prerequisites`
   - `leads_to`
   - `grade`, `semester`, `unit`
   - `real_world`
   - `memory_anchors`
   - `bloom_verbs`

4. **When reading `_errors.json`**, only extract entries tied to the current node:
   - Focus on `description`, `diagnosis`, `trigger`, `frequency`
   - Use them for distractors and targeted feedback

5. **When reading `_exercises.json`**, only extract the Bloom levels you actually need:
   - Reuse the closest existing exercises instead of regenerating everything
   - Do not dump the entire exercise bank into context

6. **If no matching directory exists**:
   - Fall back to model knowledge
   - But explicitly note that the topic is **not covered by the Knowledge Layer**, so accuracy and stability may be lower

#### Hard rules

- **Lookup first, then read**
- **Node first, then domain**
- **Summary first, then source**
- **Reuse graph definitions, prerequisite chains, real-world anchors, errors, and exercises whenever available**
- **If the graph already covers the topic, derive courseware structure from it rather than inventing a parallel knowledge structure**

### Phase 1: Build the Instructional Skeleton
- Write ABT introduction for each module
- List knowledge points and perform content audit (Essential / Helpful / Decorative)
- Establish prerequisite knowledge chain
- Determine core question for each module
- **Adaptive design** (⛔ required): Plan scaffold, challenge, and review-prereq path content; identify at least 2 branch trigger points (see Section 2.6.1)
- **Inquiry design** (when curriculum standards require it): Determine inquiry depth level (L1-L4); design the 6-step inquiry structure; identify the cognitive conflict moment (see Section 2.6.2)

### Phase 2: Select Subject Mode
- Consult the Subject Adaptation Matrix (4.1) — choose teaching approach, interaction components, assessment types
- Mark concepts needing "deep understanding," select Five-Lens combinations
- Decide scaffolding strategy (which tasks need leveled support)
- Verify adaptive branch content is substantively different across scaffold/normal/challenge paths

### Phase 3: Build Content
- Write web page structure and card content
- Implement interactive exercises and feedback
- Add Remotion animations if needed
- Write narration scripts and generate TTS audio if voice is requested
- Generate bilingual subtitle data aligned to animation frames
- Ensure every module has an "apply immediately" task
- Follow Mayer's principles for text-image layout

### Phase 4: Instructional Review Checklist
- [ ] Does the ABT introduction effectively answer "why learn this?"
- [ ] Is every difficult point unpacked? (Five-Lens coverage)
- [ ] Is there at least one genuine output task? (production question or open task)
- [ ] Is there targeted error-correcting feedback? (not just "correct/incorrect")
- [ ] Can the post-test show learning effect?
- [ ] Does Bloom's coverage reach at least 3 levels?
- [ ] Are attention reset intervals reasonable?
- [ ] Does scaffolding have levels? (full → partial → none)
- [ ] Is core text per card controlled to ~75 words?
- [ ] Are related text and images placed adjacent? (Mayer contiguity principle)
- [ ] Does the courseware include `<meta name="course-id">`? (Progress tracking)
- [ ] Are quiz results calling `TeachAnyAdaptive.updateMastery()`? (Mastery tracking)
- [ ] Are completed modules auto-enrolled in spaced repetition? (`TeachAnySR.addToReview()`)
- [ ] Is `TeachAnyAchievements.checkAndAward()` called on module completion? (Gamification)
- [ ] Is scroll position auto-saved and restored? (`TeachAnyProgress`)
- [ ] Does adaptive branching check prerequisites before advancing? (If prerequisites exist)
- [ ] Do all Canvas/SVG graphics work on `file://` protocol? (No external image deps)
- [ ] Do external CDNs use China-friendly fallback chain? (BootCDN → npmmirror → unpkg)
- [ ] Are map tile providers China-accessible? (GaoDe/TianDiTu first, CARTO/OSM fallback)
- [ ] Do draggable SVG elements use `pointer` events? (Touch device compatibility)
- [ ] Is Canvas set up for HiDPI/Retina displays? (`devicePixelRatio` scaling)
- [ ] Does the courseware have at least 2 `decideBranch()` trigger points? Do scaffold and challenge paths have substantively different content? (Adaptive branching, Section 2.6.1)
- [ ] For standards-mandated inquiry: Does the courseware use the full 6-step inquiry structure? Is inquiry depth appropriate for grade band (L1-L2 elementary, L2-L3 middle, L2-L4 high)? (Inquiry design, Section 2.6.2)
- [ ] Does inquiry include a "cognitive conflict moment" where initial prediction differs from actual result? Do science inquiries specify controlled variable triad (change/constant/measure)? (N/A if no inquiry required)

---

## 12. Output Requirements

Depending on task scope, deliver some or all of the following:

**L1 — Interactive Courseware** (Always):
- `index.html`: Complete interactive web courseware (Chinese)
- `index_en.html`: Complete interactive web courseware (English, if bilingual)
- Exercise questions and feedback design
- Open task rubrics
- Pre-test / Post-test question sets
- Modular teaching content

**L2 — Teaching Animations** (When video is requested):
- `src/compositions/*.tsx`: Teaching animation components
- `src/Root.tsx`: Remotion composition registration
- `src/SfxPlayer.tsx`: Sound effects player component
- `src/SubtitleTrack.tsx`: Bilingual subtitle overlay component
- `generate-sfx.js`: Sound effects generator
- `package.json` / `tsconfig.json` / `remotion.config.ts`: Project configuration

**L3 — AI Voice Narration** (When audio is requested):
- `scripts/narration_zh.json`: Chinese narration script with frame timestamps
- `scripts/narration_en.json`: English narration script with frame timestamps
- `scripts/generate-tts.py`: Edge TTS generation script
- `scripts/generate-srt.py`: SRT subtitle export script
- `tts/*.mp3`: Generated voice audio files
- `tts/*.srt`: Generated subtitle files

---

## 13. Explicit Requirements When Using This Skill

When using this skill, proactively:
- **First determine the lesson type** (new concept / review / practice / thematic / lab), then select structure
- **First determine the subject**, then select teaching framework and interaction components — don't default to math mode
- **Don't default to "formula derivation" for every concept**
- **Don't create lecture-only courseware without exercises and feedback**
- **Don't only create multiple-choice questions** — add explanation and production questions
- **Don't prioritize visual aesthetics over the learning loop**
- **Don't pile on unnecessary animations and decorations**
- **Humanities tasks must include scaffolding levels and rubric evaluation**
- **Every worked example and exercise that involves spatial/geometric/graphical reasoning MUST include an accompanying diagram** — use inline SVG for geometry (triangles, circles, angles, parallel lines), Canvas for coordinate graphs, or labeled illustrations for science experiments. A text-only geometry proof without a figure is pedagogically incomplete. See Section 18.8 for implementation guidelines.

---

## 14. Theoretical Foundations

TeachAny's instructional design framework synthesizes the following peer-reviewed learning science research:

| Theory | Original Work | Application in TeachAny |
|:-------|:-------------|:------------------------|
| ABT Narrative | Olson, R. (2015). *Houston, We Have a Narrative*. University of Chicago Press. | Module opening narrative structure |
| Cognitive Load Theory | Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257-285. | Card word limits, information chunking |
| Multimedia Learning | Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press. | Layout decisions, text-image integration |
| ConcepTest / Peer Instruction | Mazur, E. (1997). *Peer Instruction: A User's Manual*. Prentice Hall. | Concept-check question design |
| Bloom's Taxonomy | Anderson, L.W. & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. | Exercise cognitive level design |
| Scaffolding | Vygotsky, L.S. (1978). *Mind in Society*; Wood, D., Bruner, J.S., & Ross, G. (1976). | Three-level progressive difficulty |
| Understanding by Design | Wiggins, G. & McTighe, J. (2005). *Understanding by Design*. | Objective-backward course structure |
| Evidence-Based Training | Clark, R.C. (2019). *Evidence-Based Training Methods*. | Content audit and effectiveness evaluation |

**Original contributions by TeachAny**: The Five-Lens Method, Subject Adaptation Matrix, 6-Question Pre-Design Framework, Lesson Type Classification System, and Phase 4 Review Checklist are original creations of this project.

---

## 15. Video & Audio Production Pipeline

TeachAny supports an optional **video + AI narration** layer on top of the interactive HTML courseware. This section specifies the full pipeline for automated setup, voice generation, and bilingual subtitle rendering.

### 15.1 Architecture Layers

| Layer | Output | Dependencies | Required? |
|:------|:-------|:-------------|:----------|
| **L1 — Interactive Courseware** | `index.html` | None (zero-dependency) | ✅ Always |
| **L2 — Teaching Animations** | `out/*.mp4` via Remotion | Node.js ≥ 18, npm, ffmpeg | Optional |
| **L3 — AI Voice Narration** | `tts/*.mp3` + `tts/*.srt` | Python 3.8+, edge-tts | Optional |

**Key Principle**: L1 always works standalone. L2 and L3 are progressive enhancements.

### 15.2 Automated Remotion Setup

When the user requests video animations, execute the following setup sequence:

#### Step 1: Environment Detection

```bash
# Check Node.js
node -v  # Requires >= 18.0.0

# Check ffmpeg (required for Remotion rendering)
ffmpeg -version
# If missing on macOS: brew install ffmpeg
# If missing on Ubuntu: sudo apt install ffmpeg
# If missing on Windows: choco install ffmpeg
```

#### Step 2: Initialize Project

```bash
# Create package.json with Remotion dependencies
npm init -y
npm install remotion @remotion/cli @remotion/bundler react react-dom typescript @types/react
```

#### Step 3: Standard package.json

```json
{
  "name": "teachany-course",
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render src/index.tsx",
    "build:all": "node scripts/render-all.js",
    "generate-sfx": "node generate-sfx.js",
    "generate-tts": "python3 scripts/generate-tts.py"
  },
  "dependencies": {
    "remotion": "^4.0.409",
    "@remotion/cli": "^4.0.409",
    "@remotion/bundler": "^4.0.409",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0"
  }
}
```

#### Step 4: Generate Sound Effects

```bash
node generate-sfx.js
# Creates sfx/{pop,step,highlight,success,whoosh,ding,error}.wav
```

The `generate-sfx.js` script is a pure Node.js WAV encoder with zero dependencies, generating 7 sound effect types used by the `SfxPlayer` component.

#### Step 5: Create Config Files

`remotion.config.ts`:
```typescript
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### 15.3 Remotion Composition Standard

Each teaching animation follows this structure:

```text
src/
├── index.tsx          # Remotion entry point
├── Root.tsx           # Composition registration
├── SfxPlayer.tsx      # Sound effects player component
├── compositions/
│   ├── Episode01.tsx  # One composition per episode
│   ├── Episode02.tsx
│   └── ...
└── SubtitleTrack.tsx  # Bilingual subtitle overlay
```

**Composition Registration** (`Root.tsx`):
```tsx
<Composition
  id="Episode01"
  component={Episode01}
  durationInFrames={600}  // 20 seconds at 30fps
  fps={30}
  width={1920}
  height={1080}
/>
```

**Animation Specification**:
- Resolution: 1920×1080, 30fps
- Single Composition: 480-720 frames (16-24 seconds)
- 3-5 scenes per Composition
- Animation style: `interpolate` + `spring`, ease-in-out
- Color palette unified with HTML courseware CSS variables
- Sound effects via `SfxPlayer` component with frame-based cue lists

### 15.4 Edge TTS Integration

#### Installation

```bash
pip install edge-tts
# or
pip3 install edge-tts
```

#### Voice Selection

| Language | Voice ID | Name | Style |
|:---------|:---------|:-----|:------|
| **Chinese (Female)** | `zh-CN-XiaoxiaoNeural` | Xiaoxiao | Warm, clear, recommended for K-12 |
| **Chinese (Male)** | `zh-CN-YunxiNeural` | Yunxi | Young male, energetic |
| **English (Female)** | `en-US-JennyNeural` | Jenny | Clear, standard American |
| **English (Male)** | `en-US-GuyNeural` | Guy | Professional, mature |

#### TTS Script Format

Create narration scripts as JSON with frame-aligned timestamps:

`scripts/narration_zh.json`:
```json
[
  {
    "episode": "Episode01",
    "segments": [
      {
        "id": "seg01",
        "text": "大家好，今天我们来学习二次函数的概念。",
        "startFrame": 0,
        "endFrame": 90
      },
      {
        "id": "seg02",
        "text": "先从一个简单的例子开始：正方形的面积。",
        "startFrame": 100,
        "endFrame": 180
      }
    ]
  }
]
```

#### TTS Generation Script

`scripts/generate-tts.py`:
```python
#!/usr/bin/env python3
"""Generate TTS audio and SRT subtitles using Edge TTS."""
import asyncio
import json
import os
import edge_tts

VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-JennyNeural",
}

async def generate_episode(episode_data, lang, output_dir):
    voice = VOICE_MAP[lang]
    os.makedirs(output_dir, exist_ok=True)
    
    for seg in episode_data["segments"]:
        mp3_path = os.path.join(output_dir, f"{seg['id']}_{lang}.mp3")
        communicate = edge_tts.Communicate(seg["text"], voice)
        await communicate.save(mp3_path)
        print(f"✅ {mp3_path}")

async def main():
    import sys
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    script_file = f"scripts/narration_{lang}.json"
    
    with open(script_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)
    
    for ep in episodes:
        output_dir = f"tts/{ep['episode']}"
        await generate_episode(ep, lang, output_dir)
    
    print(f"\n🎤 All {lang} narration generated!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run:
```bash
python3 scripts/generate-tts.py zh   # Generate Chinese narration
python3 scripts/generate-tts.py en   # Generate English narration
```

### 15.5 Bilingual Subtitle System

#### SubtitleTrack Component

`src/SubtitleTrack.tsx`:
```tsx
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SubtitleEntry {
  startFrame: number;
  endFrame: number;
  zh: string;
  en: string;
}

interface Props {
  subtitles: SubtitleEntry[];
  showZh?: boolean;  // default: true
  showEn?: boolean;  // default: true
}

export const SubtitleTrack: React.FC<Props> = ({
  subtitles, showZh = true, showEn = true
}) => {
  const frame = useCurrentFrame();
  const current = subtitles.find(
    s => frame >= s.startFrame && frame <= s.endFrame
  );
  if (!current) return null;

  const fadeIn = interpolate(
    frame, [current.startFrame, current.startFrame + 5], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{
      position: "absolute", bottom: 60, left: 0, right: 0,
      textAlign: "center", opacity: fadeIn,
    }}>
      {showZh && (
        <div style={{
          fontSize: 36, color: "#f8fafc", fontWeight: 600,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}>
          {current.zh}
        </div>
      )}
      {showEn && (
        <div style={{
          fontSize: 28, color: "#94a3b8", marginTop: 4,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}>
          {current.en}
        </div>
      )}
    </div>
  );
};
```

#### Subtitle Data Format

```tsx
const subtitles: SubtitleEntry[] = [
  {
    startFrame: 0, endFrame: 90,
    zh: "大家好，今天我们来学习二次函数的概念",
    en: "Hello everyone, today we'll learn about quadratic functions"
  },
  {
    startFrame: 100, endFrame: 180,
    zh: "先从一个简单的例子开始：正方形的面积",
    en: "Let's start with a simple example: the area of a square"
  },
];
```

#### SRT Export Script

`scripts/generate-srt.py`:
```python
#!/usr/bin/env python3
"""Generate SRT subtitle files from narration JSON."""
import json
import sys

def frames_to_timecode(frame, fps=30):
    total_seconds = frame / fps
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    milliseconds = int((total_seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def generate_srt(narration_file, lang, output_path):
    with open(narration_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)
    
    idx = 1
    lines = []
    for ep in episodes:
        for seg in ep["segments"]:
            start = frames_to_timecode(seg["startFrame"])
            end = frames_to_timecode(seg["endFrame"])
            lines.append(f"{idx}")
            lines.append(f"{start} --> {end}")
            lines.append(seg["text"])
            lines.append("")
            idx += 1
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ {output_path}")

if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    generate_srt(f"scripts/narration_{lang}.json", lang, f"tts/subtitles_{lang}.srt")
```

### 15.6 Language Configuration

When executing TeachAny, the user can specify language preferences:

| Parameter | Options | Default | Affects |
|:----------|:--------|:--------|:--------|
| **Courseware Language** | `zh` / `en` | `zh` | HTML content language |
| **Voice Language** | `zh` / `en` / `none` | `zh` | TTS narration language |
| **Subtitle Mode** | `zh-only` / `en-only` / `bilingual` / `none` | `bilingual` | Subtitle display in Remotion |

**Example user prompts**:
- "Create a math courseware in Chinese with Chinese voice and bilingual subtitles" → Default
- "Create an English biology courseware with English narration, English subtitles only" → `en` / `en` / `en-only`
- "Create a Chinese courseware with no video" → L1 only, skip L2/L3

### 15.7 Complete Project File Structure

```text
{course-id}/                            # Course root directory
├── index.html                          # L1: Interactive courseware (Chinese)
├── index_en.html                       # L1: Interactive courseware (English, if bilingual)
├── manifest.json                       # Courseware metadata (required)
├── tts/                                # L3: TTS audio & subtitles
│   ├── seg01_zh.mp3
│   ├── seg02_zh.mp3
│   ├── ...
│   ├── subtitles_zh.srt
│   └── subtitles_en.srt               # (if bilingual)
├── assets/                             # Illustrations/images (as needed)
│   └── *.png
├── sfx/                                # Sound effects (if L2 is used)
│   ├── pop.wav
│   ├── step.wav
│   └── ...
├── scripts/                            # TTS/animation generation scripts
│   ├── generate-tts.py                 # Edge TTS generator
│   ├── generate-srt.py                 # SRT subtitle exporter
│   ├── narration_zh.json               # Chinese narration script
│   └── narration_en.json               # English narration script
├── src/                                # L2: Remotion animation source (as needed)
│   ├── index.tsx
│   ├── Root.tsx
│   └── compositions/
│       └── *.tsx
└── out/                                # L2: Rendered videos (as needed)
    └── *.mp4
```

> **⚠️ Important**: Courseware files do **NOT** use a `public/` subdirectory. `index.html`, `tts/`, `assets/`, etc. go directly in the course root. This ensures GitHub Pages can serve all files correctly when pushed to the repository.
>
> **⚠️ Do NOT create separate GitHub repositories for individual coursewares**. All coursewares must be stored under `teachany-opensource/examples/{course-id}/` and deployed via the main site's `deploy-pages.yml`. Do not create `gallery.html`, `knowledge-map.html`, or other site-level pages inside individual courseware directories — Gallery and Knowledge Map are provided by the main site. Courseware directories should only contain `index.html` + `tts/` + `assets/` and other teaching content files.
>
> **Deployment to main site** (when the user has write access to the teachany-opensource repo):
> 1. Copy courseware to `teachany-opensource/examples/{course-id}/`
> 2. **MUST** add entry to **ALL THREE** registry files (not just output a snippet):
>    - `registry.json` — add course entry to `courses[]` array, increment `total`
>    - `courseware-registry.json` — add full entry with interactions/theories/tags to `courses[]` array
>    - `data/trees/{curriculum}/{subject-tree}.json` — set node `status: "active"`, add `"examples/{course-id}"` to node's `courses[]` array
> 3. `git add -A && git commit && git push origin main` — `deploy-pages.yml` auto-deploys
> 4. Also push to Gitee: `git push gitee main`
> 5. Final URL: `https://weponusa.github.io/teachany/examples/{course-id}/`
>
> **⚠️ Registry registration is NOT optional**. A courseware without registry entries is invisible in the Gallery. AI MUST write entries to all three files AND push — not just output a JSON snippet for "manual merge".
    ├── Episode01.mp4
    ├── Episode02.mp4
    └── ...
```

### 15.8 Quick Start Commands

```bash
# Full setup (one-time)
npm install                             # Install Remotion
pip3 install edge-tts                   # Install Edge TTS
node generate-sfx.js                    # Generate sound effects

# Development
npm run start                           # Open Remotion Studio (preview)

# Production
python3 scripts/generate-tts.py zh      # Generate Chinese narration
python3 scripts/generate-tts.py en      # Generate English narration
python3 scripts/generate-srt.py zh      # Export Chinese SRT
python3 scripts/generate-srt.py en      # Export English SRT
npm run build:all                       # Render all episodes to MP4
```

---

## 16. Token Consumption & Cost Estimation

### 16.1 Per-Courseware Token Breakdown

| Component | Output Size | Estimated Tokens | Notes |
|:----------|:-----------|:----------------|:------|
| **L1: HTML Courseware (zh)** | ~1,500 lines | 30K-40K output | Full interactive page with quiz engine |
| **L1: HTML Courseware (en)** | ~1,500 lines | 30K-40K output | English translation |
| **L2: Remotion Compositions** | 6-8 episodes × ~200 lines | 25K-35K output | Animation code with SfxPlayer |
| **L2: Root.tsx + SfxPlayer** | ~120 lines | 2K-3K output | Boilerplate |
| **L2: generate-sfx.js** | ~180 lines | 3K-4K output | One-time, reusable across projects |
| **L3: Narration Scripts (zh)** | ~3K characters | 2K-3K output | JSON with frame timestamps |
| **L3: Narration Scripts (en)** | ~2K characters | 2K-3K output | English translation |
| **L3: TTS/SRT Scripts** | ~100 lines each | 1K-2K output | One-time, reusable |
| **Input Context** | Skill + instructions | 15K-25K input | Skill definition + user requirements |

### 16.2 Total Estimation Per Complete Courseware

| Scenario | Input Tokens | Output Tokens | Total Tokens |
|:---------|:------------|:-------------|:-------------|
| **L1 Only** (HTML zh) | ~20K | ~35K | ~55K |
| **L1 Bilingual** (HTML zh+en) | ~25K | ~70K | ~95K |
| **L1+L2** (HTML + Remotion) | ~30K | ~100K | ~130K |
| **L1+L2+L3 Full** (HTML + Video + TTS + Subtitles, bilingual) | ~35K | ~120K | ~155K |

### 16.3 Cost Estimation by Model

| Model | Input Cost | Output Cost | L1 Only | L1+L2+L3 Full |
|:------|:----------|:-----------|:--------|:---------------|
| **Claude Sonnet 4** | $3/1M | $15/1M | ~$0.59 | ~$1.91 |
| **Claude Opus 4** | $15/1M | $75/1M | ~$2.93 | ~$9.53 |
| **GPT-4o** | $2.5/1M | $10/1M | ~$0.40 | ~$1.29 |
| **DeepSeek-V3** | ¥1/1M | ¥2/1M | ~¥0.09 | ~¥0.28 |

**Note**: Edge TTS is **completely free** — Microsoft provides it at no cost. Sound effects are generated locally with zero API cost. The only cost is the AI token consumption for code generation.

### 16.4 Time Estimation

| Step | Estimated Time |
|:-----|:--------------|
| AI generates HTML courseware | 2-4 minutes |
| AI generates Remotion code | 3-5 minutes |
| AI generates narration scripts | 1-2 minutes |
| `npm install` | 1-2 minutes (first time) |
| `node generate-sfx.js` | < 1 second |
| `pip install edge-tts` | < 30 seconds |
| `python3 generate-tts.py` | 1-3 minutes (network) |
| `npm run build:all` (8 episodes) | 5-15 minutes (CPU-dependent) |
| **Total (L1+L2+L3)** | **15-30 minutes** |

---

## 17. Frontend Learning Loop System (Zero-Backend)

TeachAny's core philosophy is **zero-dependency single-file HTML**. This section specifies how to build a complete learning loop — adaptive branching, progress persistence, spaced repetition, achievement gamification, and offline PWA — **entirely in the browser with no backend required**.

**Key Principle**: Every feature in this section runs on `localStorage` + vanilla JS. No user accounts, no servers, no databases. The courseware HTML file remains self-contained.

### 17.1 Architecture Overview

```text
┌─────────────────────────────────────────────────────┐
│                  TeachAny HTML Courseware             │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Adaptive  │  │  Progress  │  │ Spaced Repetition│  │
│  │ Branching │←→│  Tracker   │←→│    Engine        │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
│       ↑              ↑               ↑               │
│       └──────────────┼───────────────┘               │
│                      ↓                               │
│              ┌──────────────┐                        │
│              │ localStorage │ ← Single persistence   │
│              │  + IndexedDB │   layer for all data   │
│              └──────────────┘                        │
│                      ↓                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │Achievement│  │   PWA      │  │  Review Cards    │  │
│  │  System   │  │  Offline   │  │  Generator       │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

All five subsystems share a single `localStorage` namespace: `teachany_`.

### 17.2 Adaptive Learning Branching

Use the Knowledge Layer's `prerequisites` and `leads_to` relationships to dynamically route students through content based on their demonstrated mastery.

#### 17.2.1 Mastery State Model

Each knowledge node has a mastery level between 0.0 and 1.0:

| Mastery Range | State | Action |
|:---|:---|:---|
| **0.0 – 0.3** | Not mastered | Redirect to prerequisite review |
| **0.3 – 0.6** | Partial | Show additional scaffolding, more examples |
| **0.6 – 0.8** | Proficient | Normal progression |
| **0.8 – 1.0** | Mastered | Allow skip, offer challenge extension |

#### 17.2.2 Implementation Standard

Every courseware HTML **must** include this mastery engine in a `<script>` block:

```javascript
/**
 * TeachAny Adaptive Engine (v1.0)
 * Zero-dependency mastery tracker using localStorage.
 */
const TeachAnyAdaptive = (() => {
  const STORAGE_KEY = 'teachany_mastery';

  function getMastery() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  }

  function saveMastery(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Get mastery level for a knowledge node.
   * @param {string} nodeId - e.g. "quadratic-vertex-form"
   * @returns {number} 0.0 to 1.0
   */
  function getNodeMastery(nodeId) {
    return getMastery()[nodeId]?.level || 0;
  }

  /**
   * Update mastery based on exercise result.
   * Uses exponential moving average: new = old * 0.7 + result * 0.3
   * @param {string} nodeId
   * @param {boolean} correct - whether the answer was correct
   * @param {number} bloomLevel - 1-6 (Remember to Create)
   */
  function updateMastery(nodeId, correct, bloomLevel = 1) {
    const data = getMastery();
    const prev = data[nodeId]?.level || 0;
    const weight = 0.1 + (bloomLevel - 1) * 0.04; // Higher Bloom → bigger impact
    const score = correct ? 1 : 0;
    const newLevel = Math.min(1, Math.max(0, prev * (1 - weight) + score * weight));

    data[nodeId] = {
      level: Math.round(newLevel * 1000) / 1000,
      attempts: (data[nodeId]?.attempts || 0) + 1,
      lastCorrect: correct,
      lastAttempt: Date.now(),
      bloomMax: Math.max(data[nodeId]?.bloomMax || 0, correct ? bloomLevel : 0)
    };
    saveMastery(data);
    return data[nodeId];
  }

  /**
   * Check if prerequisites are met for a node.
   * @param {string[]} prereqIds - array of prerequisite node IDs
   * @param {number} threshold - minimum mastery (default 0.5)
   * @returns {{ met: boolean, gaps: string[] }}
   */
  function checkPrerequisites(prereqIds, threshold = 0.5) {
    const gaps = prereqIds.filter(id => getNodeMastery(id) < threshold);
    return { met: gaps.length === 0, gaps };
  }

  /**
   * Decide what content to show based on mastery.
   * @param {string} nodeId - current node
   * @param {string[]} prereqIds - prerequisite nodes
   * @returns {'review-prereq' | 'scaffold' | 'normal' | 'challenge'}
   */
  function decideBranch(nodeId, prereqIds = []) {
    const prereqCheck = checkPrerequisites(prereqIds);
    if (!prereqCheck.met) return 'review-prereq';

    const mastery = getNodeMastery(nodeId);
    if (mastery < 0.3) return 'scaffold';
    if (mastery >= 0.8) return 'challenge';
    return 'normal';
  }

  return {
    getNodeMastery, updateMastery,
    checkPrerequisites, decideBranch, getMastery
  };
})();
```

#### 17.2.3 Courseware Integration Pattern

In the HTML courseware, use `decideBranch()` at key transition points:

```javascript
// At the start of Module 2 (e.g., "Completing the Square")
const branch = TeachAnyAdaptive.decideBranch('completing-the-square', ['perfect-square-formula', 'square-operations']);

switch (branch) {
  case 'review-prereq':
    showSection('prereq-review');   // Show a mini-review of prerequisites
    hideSection('main-content');
    break;
  case 'scaffold':
    showSection('main-content');
    showSection('extra-scaffolding'); // Show additional worked examples
    break;
  case 'challenge':
    showSection('main-content');
    showSection('challenge-extension'); // Show advanced problems
    hideSection('basic-practice');
    break;
  default: // 'normal'
    showSection('main-content');
    break;
}
```

#### 17.2.4 Prerequisite Review Module

When `decideBranch` returns `'review-prereq'`, the courseware should show a **Prerequisite Review Card**:

```html
<div id="prereq-review" class="prereq-card" style="display:none">
  <h3>📋 Before we begin…</h3>
  <p>This lesson builds on concepts you might want to review first:</p>
  <div id="prereq-list"></div>
  <button onclick="dismissPrereqReview()">I'm ready, continue →</button>
</div>
```

```javascript
function showPrereqReview(gaps) {
  const container = document.getElementById('prereq-list');
  container.innerHTML = gaps.map(g =>
    `<div class="prereq-item">
       <span class="prereq-name">${getNodeDisplayName(g)}</span>
       <span class="prereq-mastery">${Math.round(TeachAnyAdaptive.getNodeMastery(g) * 100)}%</span>
       <a href="${getNodeCoursewareUrl(g)}">Review →</a>
     </div>`
  ).join('');
  document.getElementById('prereq-review').style.display = 'block';
}
```

**Hard Rule**: Never _block_ the student. The prerequisite review is a **recommendation**, not a gate. Always provide a "Continue anyway" button.

### 17.3 Learning Progress Persistence

#### 17.3.1 What to Persist

| Data | Storage Key | Purpose |
|:---|:---|:---|
| Module completion | `teachany_progress_{courseId}` | Resume where left off |
| Scroll position | `teachany_scroll_{courseId}` | Restore exact viewport |
| Quiz answers | `teachany_answers_{courseId}` | Don't re-ask answered questions |
| Time spent | `teachany_time_{courseId}` | Display in achievement system |
| Mastery state | `teachany_mastery` | Shared across all coursewares |
| Achievement data | `teachany_achievements` | Cross-courseware badges |
| Review schedule | `teachany_review` | Spaced repetition queue |
| Global stats | `teachany_stats` | Total sessions, streak, etc. |

#### 17.3.2 Progress Tracker Implementation

```javascript
/**
 * TeachAny Progress Tracker (v1.0)
 * Persists learning state to localStorage.
 */
const TeachAnyProgress = (() => {
  function getKey(courseId) { return `teachany_progress_${courseId}`; }

  function getProgress(courseId) {
    try { return JSON.parse(localStorage.getItem(getKey(courseId)) || '{}'); }
    catch { return {}; }
  }

  function saveProgress(courseId, data) {
    const existing = getProgress(courseId);
    const merged = { ...existing, ...data, lastUpdated: Date.now() };
    localStorage.setItem(getKey(courseId), JSON.stringify(merged));
  }

  /**
   * Mark a module as completed.
   * @param {string} courseId - unique course identifier
   * @param {string} moduleId - e.g. "module-2-completing-square"
   * @param {object} result - { score, totalQuestions, bloomLevel }
   */
  function completeModule(courseId, moduleId, result = {}) {
    const progress = getProgress(courseId);
    if (!progress.modules) progress.modules = {};
    progress.modules[moduleId] = {
      completed: true,
      completedAt: Date.now(),
      score: result.score || 0,
      total: result.totalQuestions || 0,
      bloom: result.bloomLevel || 1
    };
    // Calculate overall completion percentage
    const totalModules = document.querySelectorAll('[data-module-id]').length;
    const completedCount = Object.values(progress.modules).filter(m => m.completed).length;
    progress.completionPercent = Math.round((completedCount / totalModules) * 100);
    saveProgress(courseId, progress);
  }

  /**
   * Auto-save scroll position (call on scroll with debounce).
   */
  function saveScrollPosition(courseId) {
    localStorage.setItem(`teachany_scroll_${courseId}`, String(window.scrollY));
  }

  /**
   * Restore scroll position on page load.
   */
  function restoreScrollPosition(courseId) {
    const pos = localStorage.getItem(`teachany_scroll_${courseId}`);
    if (pos) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(pos)));
    }
  }

  /**
   * Record time spent (call via setInterval every 30s).
   */
  function recordTime(courseId, seconds = 30) {
    const progress = getProgress(courseId);
    progress.timeSpent = (progress.timeSpent || 0) + seconds;
    saveProgress(courseId, progress);
  }

  /**
   * Get overall learning stats across all courses.
   */
  function getGlobalStats() {
    try { return JSON.parse(localStorage.getItem('teachany_stats') || '{}'); }
    catch { return {}; }
  }

  function updateGlobalStats() {
    const stats = getGlobalStats();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Update streak
    const lastDate = stats.lastActiveDate;
    if (lastDate === today) {
      // Already active today, no change
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastDate === yesterday) {
        stats.streak = (stats.streak || 0) + 1;
      } else {
        stats.streak = 1; // Reset streak
      }
      stats.lastActiveDate = today;
    }

    stats.totalSessions = (stats.totalSessions || 0) + 1;
    stats.maxStreak = Math.max(stats.maxStreak || 0, stats.streak);
    localStorage.setItem('teachany_stats', JSON.stringify(stats));
    return stats;
  }

  return {
    getProgress, saveProgress, completeModule,
    saveScrollPosition, restoreScrollPosition, recordTime,
    getGlobalStats, updateGlobalStats
  };
})();
```

#### 17.3.3 Auto-Initialization Template

Add this to every courseware HTML at the bottom of `<body>`:

```javascript
// Auto-init progress tracking
(function initProgress() {
  const COURSE_ID = document.querySelector('meta[name="course-id"]')?.content || 'unknown';

  // Restore scroll position
  TeachAnyProgress.restoreScrollPosition(COURSE_ID);

  // Save scroll position (debounced)
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => TeachAnyProgress.saveScrollPosition(COURSE_ID), 500);
  });

  // Track time spent (every 30 seconds)
  setInterval(() => TeachAnyProgress.recordTime(COURSE_ID, 30), 30000);

  // Update global stats (once per session)
  TeachAnyProgress.updateGlobalStats();

  // Show resume banner if returning
  const progress = TeachAnyProgress.getProgress(COURSE_ID);
  if (progress.completionPercent > 0 && progress.completionPercent < 100) {
    showResumeBanner(progress);
  }
})();
```

Add this `<meta>` tag in every courseware `<head>`:

```html
<meta name="course-id" content="math-quadratic-vertex-form">
```

#### 17.3.4 Resume Banner UI

When a student returns to a partially-completed courseware, show:

```html
<div id="resume-banner" style="display:none">
  <div class="resume-content">
    <span>📚 Welcome back! You've completed <strong id="resume-pct">0</strong>% of this lesson.</span>
    <button onclick="scrollToLastModule()">Continue where you left off →</button>
    <button onclick="dismissResume()" class="btn-secondary">Start from beginning</button>
  </div>
</div>
```

### 17.4 Spaced Repetition Engine

Implement a simplified SM-2 algorithm for scheduling review of knowledge nodes.

#### 17.4.1 Algorithm Specification

```text
Initial state:
  interval = 1 day
  easeFactor = 2.5
  repetitions = 0

After each review:
  if (quality >= 3):  // 0-5 scale, 3+ = recalled
    if (repetitions == 0): interval = 1
    else if (repetitions == 1): interval = 3
    else: interval = Math.round(interval * easeFactor)
    repetitions += 1
  else:
    repetitions = 0
    interval = 1

  easeFactor = max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  nextReview = now + interval days
```

#### 17.4.2 Implementation

```javascript
/**
 * TeachAny Spaced Repetition Engine (v1.0)
 * SM-2 algorithm, pure localStorage.
 */
const TeachAnySR = (() => {
  const STORAGE_KEY = 'teachany_review';

  function getData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Add a node to the review queue.
   * Call this when a student completes a module.
   * @param {string} nodeId
   * @param {string} nodeName - display name
   * @param {string} courseUrl - URL to the review material
   */
  function addToReview(nodeId, nodeName, courseUrl) {
    const data = getData();
    if (!data[nodeId]) {
      data[nodeId] = {
        name: nodeName,
        url: courseUrl,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: Date.now() + 86400000, // tomorrow
        lastReview: Date.now(),
        quality: null
      };
      saveData(data);
    }
  }

  /**
   * Record a review result and update schedule.
   * @param {string} nodeId
   * @param {number} quality - 0-5 (0=forgot, 3=hard recall, 5=easy)
   */
  function recordReview(nodeId, quality) {
    const data = getData();
    const card = data[nodeId];
    if (!card) return;

    if (quality >= 3) {
      if (card.repetitions === 0) card.interval = 1;
      else if (card.repetitions === 1) card.interval = 3;
      else card.interval = Math.round(card.interval * card.easeFactor);
      card.repetitions += 1;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    card.easeFactor = Math.max(1.3,
      card.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    card.nextReview = Date.now() + card.interval * 86400000;
    card.lastReview = Date.now();
    card.quality = quality;

    saveData(data);
    return card;
  }

  /**
   * Get all nodes due for review today.
   * @returns {Array<{nodeId, name, url, daysPast}>}
   */
  function getDueReviews() {
    const data = getData();
    const now = Date.now();
    return Object.entries(data)
      .filter(([_, card]) => card.nextReview <= now)
      .map(([nodeId, card]) => ({
        nodeId,
        name: card.name,
        url: card.url,
        daysPast: Math.floor((now - card.nextReview) / 86400000)
      }))
      .sort((a, b) => b.daysPast - a.daysPast); // Most overdue first
  }

  /**
   * Get review stats for display.
   */
  function getReviewStats() {
    const data = getData();
    const entries = Object.values(data);
    return {
      totalCards: entries.length,
      dueToday: entries.filter(c => c.nextReview <= Date.now()).length,
      mastered: entries.filter(c => c.interval >= 21).length, // 21+ day interval = mastered
      avgEase: entries.length
        ? Math.round(entries.reduce((s, c) => s + c.easeFactor, 0) / entries.length * 100) / 100
        : 0
    };
  }

  return { addToReview, recordReview, getDueReviews, getReviewStats, getData };
})();
```

#### 17.4.3 Review Card UI Template

Add a "Review Center" section at the top of every courseware (or as a standalone `review.html`):

```html
<div id="review-center" style="display:none">
  <h3>🔄 Review Due Today</h3>
  <div id="review-cards"></div>
</div>

<script>
function renderReviewCenter() {
  const due = TeachAnySR.getDueReviews();
  if (due.length === 0) return;

  document.getElementById('review-center').style.display = 'block';
  document.getElementById('review-cards').innerHTML = due.map(item => `
    <div class="review-card">
      <strong>${item.name}</strong>
      ${item.daysPast > 0 ? `<span class="overdue">${item.daysPast} days overdue</span>` : ''}
      <div class="review-actions">
        <button onclick="handleReview('${item.nodeId}', 1)">😵 Forgot</button>
        <button onclick="handleReview('${item.nodeId}', 3)">🤔 Hard</button>
        <button onclick="handleReview('${item.nodeId}', 4)">😊 Good</button>
        <button onclick="handleReview('${item.nodeId}', 5)">😎 Easy</button>
      </div>
    </div>
  `).join('');
}

function handleReview(nodeId, quality) {
  TeachAnySR.recordReview(nodeId, quality);
  renderReviewCenter(); // Re-render
}

// Auto-render on page load
renderReviewCenter();
</script>
```

#### 17.4.4 Auto-Enroll After Module Completion

When `completeModule()` is called, also enroll the node in spaced repetition:

```javascript
// In the quiz completion handler:
function onModuleComplete(courseId, moduleId, nodeId, nodeName, score, total) {
  TeachAnyProgress.completeModule(courseId, moduleId, { score, totalQuestions: total });
  TeachAnyAdaptive.updateMastery(nodeId, score >= total * 0.6, 3);

  // Auto-enroll in spaced repetition
  TeachAnySR.addToReview(nodeId, nodeName, window.location.href + '#' + moduleId);

  // Check achievements
  TeachAnyAchievements.checkAndAward(courseId, nodeId);
}
```

### 17.5 Achievement & Gamification System

A lightweight badge and streak system to motivate continued learning.

#### 17.5.1 Achievement Definitions

| ID | Name | Icon | Condition | Category |
|:---|:---|:---|:---|:---|
| `first-lesson` | First Step | 🌱 | Complete 1 module | Milestone |
| `five-lessons` | Getting Started | 📖 | Complete 5 modules (any course) | Milestone |
| `twenty-lessons` | Knowledge Explorer | 🗺️ | Complete 20 modules | Milestone |
| `perfect-score` | Perfect Score | ⭐ | 100% on any quiz | Performance |
| `streak-3` | On a Roll | 🔥 | 3-day learning streak | Streak |
| `streak-7` | Weekly Warrior | 💪 | 7-day streak | Streak |
| `streak-30` | Monthly Master | 🏆 | 30-day streak | Streak |
| `bloom-5` | Deep Thinker | 🧠 | Answer a Bloom Level 5 (Evaluate) question correctly | Cognitive |
| `bloom-6` | Creator | 🎨 | Complete a Bloom Level 6 (Create) task | Cognitive |
| `review-10` | Memory Keeper | 🔄 | Complete 10 spaced repetition reviews | Review |
| `multi-subject` | Renaissance | 🌈 | Complete modules in 3+ different subjects | Breadth |

#### 17.5.2 Implementation

```javascript
/**
 * TeachAny Achievement System (v1.0)
 * Badge tracking with toast notifications.
 */
const TeachAnyAchievements = (() => {
  const STORAGE_KEY = 'teachany_achievements';

  const DEFINITIONS = {
    'first-lesson':   { name: 'First Step',          icon: '🌱', desc: 'Complete your first module' },
    'five-lessons':   { name: 'Getting Started',     icon: '📖', desc: 'Complete 5 modules' },
    'twenty-lessons': { name: 'Knowledge Explorer',  icon: '🗺️', desc: 'Complete 20 modules' },
    'perfect-score':  { name: 'Perfect Score',       icon: '⭐', desc: 'Score 100% on a quiz' },
    'streak-3':       { name: 'On a Roll',           icon: '🔥', desc: '3-day learning streak' },
    'streak-7':       { name: 'Weekly Warrior',      icon: '💪', desc: '7-day learning streak' },
    'streak-30':      { name: 'Monthly Master',      icon: '🏆', desc: '30-day learning streak' },
    'bloom-5':        { name: 'Deep Thinker',        icon: '🧠', desc: 'Answer a Bloom Level 5 question' },
    'bloom-6':        { name: 'Creator',             icon: '🎨', desc: 'Complete a Bloom Level 6 task' },
    'review-10':      { name: 'Memory Keeper',       icon: '🔄', desc: 'Complete 10 reviews' },
    'multi-subject':  { name: 'Renaissance',         icon: '🌈', desc: 'Study 3+ subjects' }
  };

  function getAchievements() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveAchievements(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Award a badge if not already earned.
   * @returns {boolean} true if newly awarded
   */
  function award(badgeId) {
    const data = getAchievements();
    if (data[badgeId]) return false; // Already earned
    data[badgeId] = { earnedAt: Date.now() };
    saveAchievements(data);
    showBadgeToast(badgeId);
    return true;
  }

  /**
   * Check all achievement conditions and award any newly earned.
   */
  function checkAndAward(courseId, nodeId) {
    const stats = TeachAnyProgress.getGlobalStats();
    const mastery = TeachAnyAdaptive.getMastery();
    const totalCompleted = countTotalCompleted();

    // Milestone checks
    if (totalCompleted >= 1) award('first-lesson');
    if (totalCompleted >= 5) award('five-lessons');
    if (totalCompleted >= 20) award('twenty-lessons');

    // Streak checks
    if (stats.streak >= 3) award('streak-3');
    if (stats.streak >= 7) award('streak-7');
    if (stats.streak >= 30) award('streak-30');

    // Bloom level checks
    const nodeData = mastery[nodeId];
    if (nodeData?.bloomMax >= 5) award('bloom-5');
    if (nodeData?.bloomMax >= 6) award('bloom-6');

    // Review check
    const reviewData = TeachAnySR.getData();
    const totalReviews = Object.values(reviewData)
      .reduce((sum, c) => sum + c.repetitions, 0);
    if (totalReviews >= 10) award('review-10');

    // Multi-subject check
    const subjects = new Set();
    Object.keys(mastery).forEach(id => {
      // Extract subject from node ID convention: "subject-domain-topic"
      const parts = id.split('-');
      if (parts.length >= 2) subjects.add(parts[0]);
    });
    if (subjects.size >= 3) award('multi-subject');
  }

  function countTotalCompleted() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('teachany_progress_')) {
        try {
          const prog = JSON.parse(localStorage.getItem(key));
          total += Object.values(prog.modules || {}).filter(m => m.completed).length;
        } catch {}
      }
    }
    return total;
  }

  /**
   * Show a celebratory toast when a badge is earned.
   */
  function showBadgeToast(badgeId) {
    const def = DEFINITIONS[badgeId];
    if (!def) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${def.icon}</div>
      <div class="toast-content">
        <strong>🎉 Achievement Unlocked!</strong>
        <span>${def.name}</span>
        <small>${def.desc}</small>
      </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Render an achievement gallery panel.
   * @param {HTMLElement} container
   */
  function renderGallery(container) {
    const earned = getAchievements();
    container.innerHTML = Object.entries(DEFINITIONS).map(([id, def]) => {
      const isEarned = !!earned[id];
      return `
        <div class="badge ${isEarned ? 'earned' : 'locked'}">
          <span class="badge-icon">${isEarned ? def.icon : '🔒'}</span>
          <span class="badge-name">${def.name}</span>
          ${isEarned
            ? `<small>Earned ${new Date(earned[id].earnedAt).toLocaleDateString()}</small>`
            : `<small>${def.desc}</small>`
          }
        </div>
      `;
    }).join('');
  }

  return { award, checkAndAward, renderGallery, getAchievements, DEFINITIONS };
})();
```

#### 17.5.3 Achievement Toast CSS

Include in every courseware `<style>`:

```css
.achievement-toast {
  position: fixed; top: 20px; right: -400px; z-index: 10000;
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px; border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1a1a2e; box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4);
  transition: right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: system-ui, sans-serif;
}
.achievement-toast.show { right: 20px; }
.toast-icon { font-size: 36px; }
.toast-content { display: flex; flex-direction: column; }
.toast-content strong { font-size: 13px; opacity: 0.8; }
.toast-content span { font-size: 18px; font-weight: 700; }
.toast-content small { font-size: 12px; opacity: 0.7; margin-top: 2px; }
```

#### 17.5.4 Streak Display Component

Show the current streak in the courseware header:

```html
<div id="streak-display" class="streak-badge">
  <span class="streak-flame">🔥</span>
  <span id="streak-count">0</span>
  <span class="streak-label">day streak</span>
</div>

<script>
(function renderStreak() {
  const stats = TeachAnyProgress.getGlobalStats();
  const count = stats.streak || 0;
  document.getElementById('streak-count').textContent = count;
  if (count === 0) {
    document.getElementById('streak-display').style.display = 'none';
  }
})();
</script>
```

### 17.6 PWA & Offline Support

Make every courseware installable as a Progressive Web App.

#### 17.6.1 manifest.json Template

```json
{
  "name": "TeachAny Courseware",
  "short_name": "TeachAny",
  "description": "Interactive K-12 learning courseware",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 17.6.2 Service Worker Template

`sw.js` — cache the single HTML file and any embedded resources:

```javascript
const CACHE_NAME = 'teachany-v1';
const ASSETS = [
  './',
  './index.html'
  // Add other assets if courseware loads external files
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

#### 17.6.3 Registration in HTML

Add to every courseware `<head>`:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#3b82f6">
```

Add to every courseware, before `</body>`:

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
</script>
```

**Note**: PWA works best when the courseware is served from a web server (even `python -m http.server`). When opened as a local `file://`, Service Worker registration will silently fail — this is expected and the courseware still works normally.

#### 17.6.4 Offline Indicator

Show a subtle indicator when the user is offline:

```javascript
window.addEventListener('online', () => {
  document.getElementById('offline-bar')?.remove();
});

window.addEventListener('offline', () => {
  if (document.getElementById('offline-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'offline-bar';
  bar.textContent = '📴 Offline mode — your progress is saved locally';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:8px;text-align:center;background:#fef3c7;color:#92400e;font-size:13px;z-index:9999;';
  document.body.appendChild(bar);
});
```

### 17.7 Integration Checklist

When building courseware, include these frontend loop features according to the following priority:

| Priority | Feature | Required? | Implementation |
|:---|:---|:---|:---|
| **P0** | Progress persistence (scroll + module completion) | ✅ Always | `TeachAnyProgress` |
| **P0** | Mastery tracking (quiz results → mastery score) | ✅ Always | `TeachAnyAdaptive.updateMastery()` |
| **P1** | Adaptive branching (prereq check + scaffold/challenge) | ✅ When prerequisites exist | `TeachAnyAdaptive.decideBranch()` |
| **P1** | Spaced repetition enrollment | ✅ When module has quiz | `TeachAnySR.addToReview()` |
| **P1** | Achievement checking | ✅ Always | `TeachAnyAchievements.checkAndAward()` |
| **P1** | Cross-courseware routing metadata | ✅ Always | `<meta name="course-id">` + 5 more meta tags |
| **P1** | Registry entry output | ✅ Always | JSON snippet for `course-registry.json` — AND must write to `registry.json`, `courseware-registry.json`, and knowledge tree file, then git push |
| **P2** | Cross-courseware nav bar | When registry file exists | `TeachAnyRouter.renderNavBar()` |
| **P2** | Prerequisite warning modal | When prereqs defined | `TeachAnyRouter.checkAndWarnPrereqs()` |
| **P2** | Review center UI | When standalone review page exists | `TeachAnySR.getDueReviews()` |
| **P2** | Achievement gallery UI | When dashboard page exists | `TeachAnyAchievements.renderGallery()` |
| **P2** | PWA manifest + Service Worker | When web-served | `manifest.json` + `sw.js` |
| **P2** | Streak display | When header area available | `TeachAnyProgress.getGlobalStats()` |

### 17.8 localStorage Schema Reference

All keys use the `teachany_` prefix to avoid collisions:

```text
teachany_mastery           → { [nodeId]: { level, attempts, lastCorrect, lastAttempt, bloomMax } }
teachany_progress_{id}     → { modules: { [moduleId]: { completed, completedAt, score, total } }, completionPercent, timeSpent, lastUpdated }
teachany_scroll_{id}       → number (px)
teachany_review            → { [nodeId]: { name, url, interval, easeFactor, repetitions, nextReview, lastReview, quality } }
teachany_achievements      → { [badgeId]: { earnedAt: timestamp } }
teachany_stats             → { streak, maxStreak, lastActiveDate, totalSessions }
teachany_registry          → { version, courses[], _cachedAt } (auto-cached from course-registry.json, TTL: 1 hour)
```

**Storage Budget**: A typical student with 50 courses and 200 review cards uses ~100KB of localStorage — well within the 5MB limit of all modern browsers.

### 17.9 Cross-Courseware Routing Protocol

> **Core Problem**: Each courseware is a self-contained single-file HTML (40–90KB). There is no built-in mechanism for one courseware to know about or navigate to another. The knowledge graph JSON files (`_graph.json`) define prerequisite chains, but they are only consumed at AI generation time — not at runtime.

> **Design Principle**: Keep each courseware zero-dependency and self-contained. Cross-courseware routing is achieved through a **lightweight registry file** + **embedded metadata** + **a new `TeachAnyRouter` runtime module**. No server required.

#### 17.9.1 Two-Layer Adaptive Model

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Intra-Courseware (within one HTML)             │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐             │
│  │Module│──▶│Module│──▶│Module│──▶│Module│             │
│  │  A   │   │  B   │   │  C   │   │  D   │             │
│  └──────┘   └──────┘   └──────┘   └──────┘             │
│      ▲  decideBranch() routes between modules           │
│      │  based on quiz scores (Section 17.2)             │
└──────┼──────────────────────────────────────────────────┘
       │
       │  onCourseComplete() triggers Layer 2
       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Inter-Courseware (between HTML files)          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │ Linear   │──▶│Quadratic │──▶│Quadratic │            │
│  │ Function │   │ Function │   │ Equation │            │
│  └──────────┘   └──────────┘   └──────────┘            │
│      TeachAnyRouter reads course-registry.json          │
│      + checks mastery via TeachAnyAdaptive              │
│      + renders navigation bar with recommendations      │
└─────────────────────────────────────────────────────────┘
```

#### 17.9.2 Courseware Metadata Standard

Every generated courseware HTML **must** include these `<meta>` tags inside `<head>`:

```html
<!-- === TeachAny Routing Metadata === -->
<meta name="course-id" content="math-linear-function">
<meta name="course-node" content="linear-function">
<meta name="course-subject" content="math">
<meta name="course-title" content="一次函数">
<meta name="course-prereqs" content="proportional-function,coordinate-system">
<meta name="course-next" content="math-quadratic-function">
```

| Meta Tag | Required | Description |
|:---|:---|:---|
| `course-id` | ✅ | Unique courseware identifier, format: `{subject}-{topic-slug}` |
| `course-node` | ✅ | Corresponding knowledge graph node ID (from `_graph.json`) |
| `course-subject` | ✅ | Subject code: `math`, `physics`, `chemistry`, `biology`, `geography`, etc. |
| `course-title` | ✅ | Human-readable Chinese title |
| `course-prereqs` | ✅ | Comma-separated list of prerequisite `course-id`s (empty string if none) |
| `course-next` | Optional | Comma-separated list of recommended next `course-id`s |

**Naming Convention**: `course-id` is derived from the knowledge node ID prefixed by subject: `math-linear-function`, `physics-pressure-buoyancy`, `biology-meiosis`.

#### 17.9.3 Course Registry (`course-registry.json`)

A single JSON file placed alongside the gallery page (or at a known relative path). Every courseware loads this file at runtime to discover available courses.

**File Location**: `./course-registry.json` (relative to courseware, or configurable via `<meta name="registry-url">`)

**Schema**:

```json
{
  "version": 1,
  "generated": "2026-04-07T14:00:00Z",
  "courses": [
    {
      "id": "math-linear-function",
      "node": "linear-function",
      "subject": "math",
      "title": "一次函数",
      "url": "./examples/math-linear-function/index.html",
      "prereqs": ["math-proportional-function", "math-coordinate-system"],
      "next": ["math-quadratic-function"],
      "difficulty": 3,
      "estimatedMinutes": 25
    },
    {
      "id": "math-quadratic-function",
      "node": "quadratic-function",
      "subject": "math",
      "title": "二次函数",
      "url": "./examples/math-quadratic-function/index.html",
      "prereqs": ["math-linear-function"],
      "next": ["math-quadratic-equation-graph"],
      "difficulty": 4,
      "estimatedMinutes": 35
    }
  ]
}
```

**Field Descriptions**:

| Field | Type | Description |
|:---|:---|:---|
| `id` | string | Must match courseware's `<meta name="course-id">` |
| `node` | string | Knowledge graph node ID |
| `subject` | string | Subject code |
| `title` | string | Chinese display title |
| `url` | string | Relative URL from registry location to courseware HTML |
| `prereqs` | string[] | List of prerequisite `course-id`s |
| `next` | string[] | Recommended next courses |
| `difficulty` | number | 1–5 scale, maps to Bloom level |
| `estimatedMinutes` | number | Estimated completion time |

**Registry Generation Rule**: When AI generates a new courseware, it MUST NOT just output a registry entry snippet for "manual merge". It MUST directly write entries to all three registry files (`registry.json`, `courseware-registry.json`, and the corresponding knowledge tree JSON under `data/trees/`), set the tree node's `status` to `"active"` and add the course path to its `courses[]`, then commit and push to both GitHub and Gitee. A courseware without registry entries is invisible in the Gallery.

#### 17.9.4 `TeachAnyRouter` Runtime Module

A self-contained IIFE module that reads the registry + courseware metadata + mastery data, then renders cross-courseware navigation UI.

```javascript
// === TeachAnyRouter — Cross-Courseware Navigation ===
const TeachAnyRouter = (function() {
  'use strict';

  let registry = null;
  let currentCourse = null;

  // Read <meta> tags from current page
  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute('content') : '';
  }

  function getCurrentCourseInfo() {
    return {
      id: getMeta('course-id'),
      node: getMeta('course-node'),
      subject: getMeta('course-subject'),
      title: getMeta('course-title'),
      prereqs: getMeta('course-prereqs').split(',').filter(Boolean),
      next: getMeta('course-next').split(',').filter(Boolean)
    };
  }

  // Load registry JSON (with cache)
  async function loadRegistry() {
    // Check localStorage cache first (TTL: 1 hour)
    const cacheKey = 'teachany_registry';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Date.now() - data._cachedAt < 3600000) {
          registry = data;
          return registry;
        }
      } catch(e) { /* cache invalid, reload */ }
    }

    // Try loading from configured or default path
    const registryUrl = getMeta('registry-url') || './course-registry.json';
    try {
      const res = await fetch(registryUrl);
      if (!res.ok) throw new Error('Registry not found');
      registry = await res.json();
      registry._cachedAt = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify(registry));
      return registry;
    } catch(e) {
      console.warn('[TeachAnyRouter] Registry unavailable:', e.message);
      return null;
    }
  }

  // Find a course by ID in registry
  function findCourse(courseId) {
    if (!registry || !registry.courses) return null;
    return registry.courses.find(c => c.id === courseId) || null;
  }

  // Check mastery level for a knowledge node (via TeachAnyAdaptive)
  function getNodeMastery(nodeId) {
    if (typeof TeachAnyAdaptive !== 'undefined') {
      return TeachAnyAdaptive.getMastery(nodeId);
    }
    // Fallback: read directly from localStorage
    try {
      const data = JSON.parse(localStorage.getItem('teachany_mastery') || '{}');
      return data[nodeId] || { level: 0, attempts: 0 };
    } catch(e) { return { level: 0, attempts: 0 }; }
  }

  // Determine prereq status: 'ready' | 'weak' | 'unstarted'
  function checkPrereqStatus(prereqCourseId) {
    const course = findCourse(prereqCourseId);
    if (!course) return 'unstarted';
    const mastery = getNodeMastery(course.node);
    if (mastery.level >= 3) return 'ready';      // Mastered
    if (mastery.level >= 1) return 'weak';        // Started but not mastered
    return 'unstarted';                           // Never attempted
  }

  // Generate smart recommendations
  function getRecommendations() {
    if (!registry || !currentCourse) return { prereqs: [], next: [], remediation: [] };

    const prereqs = currentCourse.prereqs.map(pid => {
      const course = findCourse(pid);
      const status = checkPrereqStatus(pid);
      return course ? { ...course, status } : null;
    }).filter(Boolean);

    const next = currentCourse.next.map(nid => {
      const course = findCourse(nid);
      return course || null;
    }).filter(Boolean);

    // Find remediation courses: prerequisites that are 'weak' or 'unstarted'
    const remediation = prereqs.filter(p => p.status !== 'ready');

    return { prereqs, next, remediation };
  }

  // Render navigation bar at bottom of courseware
  function renderNavBar() {
    const { prereqs, next, remediation } = getRecommendations();
    if (prereqs.length === 0 && next.length === 0) return; // No routing info

    const nav = document.createElement('div');
    nav.id = 'teachany-course-nav';
    nav.innerHTML = `
      <style>
        #teachany-course-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(15,23,42,0.95); backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 12px 20px; display: flex; justify-content: space-between;
          align-items: center; z-index: 9998; font-family: system-ui, sans-serif;
        }
        #teachany-course-nav .nav-section { display: flex; gap: 8px; align-items: center; }
        #teachany-course-nav a {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 14px; border-radius: 8px; text-decoration: none;
          font-size: 13px; font-weight: 500; transition: all 0.2s;
        }
        #teachany-course-nav .nav-prev {
          background: rgba(100,116,139,0.3); color: #94a3b8;
        }
        #teachany-course-nav .nav-prev:hover { background: rgba(100,116,139,0.5); }
        #teachany-course-nav .nav-next {
          background: rgba(59,130,246,0.2); color: #60a5fa;
        }
        #teachany-course-nav .nav-next:hover { background: rgba(59,130,246,0.4); }
        #teachany-course-nav .nav-warn {
          background: rgba(245,158,11,0.2); color: #fbbf24;
        }
        #teachany-course-nav .nav-warn:hover { background: rgba(245,158,11,0.4); }
        #teachany-course-nav .nav-center {
          color: #64748b; font-size: 12px;
        }
        #teachany-course-nav .mastery-dot {
          width: 8px; height: 8px; border-radius: 50%; display: inline-block;
        }
        .mastery-ready { background: #22c55e; }
        .mastery-weak { background: #f59e0b; }
        .mastery-unstarted { background: #64748b; }
      </style>
      <div class="nav-section">
        ${prereqs.map(p => `
          <a href="${p.url}" class="${p.status === 'ready' ? 'nav-prev' : 'nav-warn'}"
             title="${p.status === 'ready' ? '已掌握' : p.status === 'weak' ? '建议复习' : '尚未学习'}">
            <span class="mastery-dot mastery-${p.status}"></span>
            ← ${p.title}
          </a>
        `).join('')}
      </div>
      <div class="nav-center">
        ${remediation.length > 0
          ? `⚠️ ${remediation.length} 个前置知识点需要复习`
          : `✅ 前置知识已就绪`}
      </div>
      <div class="nav-section">
        ${next.map(n => `
          <a href="${n.url}" class="nav-next">
            ${n.title} →
          </a>
        `).join('')}
      </div>
    `;
    document.body.appendChild(nav);

    // Add bottom padding to body so nav doesn't overlap content
    document.body.style.paddingBottom = '60px';
  }

  // Render prerequisite warning modal (when user starts a course with unmet prereqs)
  function checkAndWarnPrereqs() {
    const { remediation } = getRecommendations();
    if (remediation.length === 0) return; // All prereqs met

    const modal = document.createElement('div');
    modal.id = 'teachany-prereq-modal';
    modal.innerHTML = `
      <style>
        #teachany-prereq-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; font-family: system-ui, sans-serif;
        }
        .prereq-card {
          background: #1e293b; border-radius: 16px; padding: 32px;
          max-width: 480px; width: 90%; color: #e2e8f0;
        }
        .prereq-card h3 { margin: 0 0 12px 0; font-size: 18px; color: #fbbf24; }
        .prereq-card p { margin: 0 0 16px 0; font-size: 14px; color: #94a3b8; line-height: 1.6; }
        .prereq-list { margin: 0 0 20px 0; padding: 0; list-style: none; }
        .prereq-list li {
          padding: 10px 14px; margin-bottom: 8px; border-radius: 8px;
          background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b;
        }
        .prereq-list a { color: #60a5fa; text-decoration: none; font-weight: 500; }
        .prereq-list a:hover { text-decoration: underline; }
        .prereq-list .status { font-size: 12px; color: #94a3b8; }
        .prereq-actions { display: flex; gap: 12px; }
        .prereq-actions button {
          flex: 1; padding: 10px; border: none; border-radius: 8px;
          cursor: pointer; font-size: 14px; font-weight: 600;
        }
        .btn-review { background: #f59e0b; color: #1e293b; }
        .btn-continue { background: rgba(100,116,139,0.3); color: #94a3b8; }
      </style>
      <div class="prereq-card">
        <h3>⚠️ 前置知识检查</h3>
        <p>本课件有 ${remediation.length} 个前置知识点尚未掌握，建议先完成复习再继续学习：</p>
        <ul class="prereq-list">
          ${remediation.map(r => `
            <li>
              <a href="${r.url}">${r.title}</a>
              <span class="status"> — ${r.status === 'weak' ? '已学习但未掌握' : '尚未开始'}</span>
            </li>
          `).join('')}
        </ul>
        <div class="prereq-actions">
          <button class="btn-review" onclick="window.location.href='${remediation[0].url}'">
            去复习: ${remediation[0].title}
          </button>
          <button class="btn-continue" onclick="this.closest('#teachany-prereq-modal').remove()">
            我已了解，继续学习
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Main initialization
  async function init() {
    currentCourse = getCurrentCourseInfo();
    if (!currentCourse.id) {
      console.warn('[TeachAnyRouter] No course-id meta tag found, skipping routing.');
      return;
    }

    await loadRegistry();
    if (registry) {
      renderNavBar();
      checkAndWarnPrereqs();
    }
  }

  // Public API
  return {
    init,
    loadRegistry,
    findCourse,
    getRecommendations,
    getCurrentCourseInfo,
    checkPrereqStatus
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TeachAnyRouter.init());
} else {
  TeachAnyRouter.init();
}
```

**Integration in Courseware**: Add this `<script>` block **after** the `TeachAnyAdaptive` script (since Router depends on mastery data):

```html
<!-- Cross-Courseware Navigation (load after TeachAnyAdaptive) -->
<script>
// [Paste TeachAnyRouter IIFE here]
</script>
```

#### 17.9.5 Course Completion Trigger

When a student completes all modules in a courseware, call the cross-courseware routing:

```javascript
function onCourseComplete(courseId, nodeId) {
  // Update mastery to "mastered" level
  if (typeof TeachAnyAdaptive !== 'undefined') {
    TeachAnyAdaptive.updateMastery(nodeId, true, 5);
  }

  // Show completion + next course recommendation
  const recs = TeachAnyRouter.getRecommendations();
  if (recs.next.length > 0) {
    showNextCourseCard(recs.next[0]);
  } else {
    showCompletionCelebration();
  }
}

function showNextCourseCard(nextCourse) {
  const card = document.createElement('div');
  card.className = 'completion-card';
  card.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;
         justify-content:center;z-index:10001;font-family:system-ui,sans-serif;">
      <div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:20px;padding:40px;
           max-width:500px;width:90%;text-align:center;color:#e2e8f0;">
        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
        <h2 style="margin:0 0 8px 0;font-size:24px;">恭喜完成！</h2>
        <p style="margin:0 0 24px 0;color:#94a3b8;font-size:14px;">
          你已掌握本课知识点，建议继续学习：
        </p>
        <a href="${nextCourse.url}" style="display:inline-block;padding:14px 32px;background:#3b82f6;
           color:white;border-radius:12px;text-decoration:none;font-size:16px;font-weight:600;">
          继续学习: ${nextCourse.title} →
        </a>
        <p style="margin:16px 0 0 0;color:#64748b;font-size:12px;">
          预计 ${nextCourse.estimatedMinutes || '?'} 分钟 · 难度 ${'⭐'.repeat(nextCourse.difficulty || 3)}
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(card);
}
```

#### 17.9.6 Graceful Degradation

The routing system is designed to degrade gracefully in all scenarios:

| Scenario | Behavior |
|:---|:---|
| No `course-registry.json` found | Router silently skips, no nav bar rendered |
| `file://` protocol (local file) | `fetch()` may fail, Router skips gracefully |
| No `<meta name="course-id">` tag | Router detects missing metadata and exits |
| `TeachAnyAdaptive` not loaded | Router uses direct `localStorage` fallback for mastery |
| Registry cached but stale | Refreshes after 1-hour TTL; uses stale cache if fetch fails |
| Single isolated courseware | Works fine — just no cross-courseware navigation appears |

#### 17.9.7 Registry Generation Rules for AI

When generating a new courseware, the AI **must** also output:

1. **The `<meta>` tags** (Section 17.9.2) inside the courseware HTML `<head>`
2. **A registry entry snippet** for the user to merge into `course-registry.json`:

```json
// Add this to course-registry.json → courses[]
{
  "id": "math-linear-function",
  "node": "linear-function",
  "subject": "math",
  "title": "一次函数",
  "url": "./examples/math-linear-function/index.html",
  "prereqs": ["math-proportional-function", "math-coordinate-system"],
  "next": ["math-quadratic-function"],
  "difficulty": 3,
  "estimatedMinutes": 25
}
```

3. **The `TeachAnyRouter` script** embedded in the courseware (or linked from a shared `teachany-router.js` file)

---

## 18. Graphics & Map Technical Specification

> **Core Problem**: K-12 courseware relies heavily on visual teaching — geometry construction, physics experiment diagrams, coordinate graphs, and geographic/historical maps. Current coursewares use hand-coded Canvas for math/physics and Leaflet + CARTO tiles for geography. This works, but: (1) geometry/physics diagrams are tedious to hand-code from scratch every time; (2) map tile CDNs (`unpkg.com`, `basemaps.cartocdn.com`) are unreliable or blocked in mainland China networks; (3) there's no standardized approach for historical maps.

> **Design Principle**: Maintain zero-dependency self-containment as much as possible. Use **Canvas 2D for precision diagrams** (math/physics), **inline SVG for static illustrations**, and **Leaflet + China-friendly tile providers** for interactive maps. Provide fallback strategies for every external dependency.

### 18.1 Graphics Technology Selection Matrix

| Scenario | Recommended Tech | Why | External Dependency |
|:---|:---|:---|:---|
| **Coordinate graphs** (functions, data plots) | Canvas 2D API | Pixel-level control, slider interactivity, real-time redraw | ❌ None |
| **Geometric constructions** (triangles, circles, transformations) | SVG (inline) | Declarative, scalable, draggable via JS, CSS-animatable | ❌ None |
| **Solid geometry** (cubes, pyramids, cross-sections, spatial vectors) | Three.js (WebGL) | True 3D rotation, depth-based hidden edges, transparent faces, cross-section clipping | ✅ Three.js (~150KB) |
| **Physics experiment animations** (U-tubes, lenses, circuits) | Canvas 2D API | Frame-by-frame animation, parameter sliders | ❌ None |
| **Biology diagrams** (cell structures, process flows) | SVG (inline) | Labeled parts, hover tooltips, step-by-step reveal | ❌ None |
| **Knowledge graph / concept map** | SVG (inline) | Node-edge layout, hover highlight, click navigation | ❌ None |
| **Interactive geographic maps** (monsoon, plate tectonics, climate zones) | Leaflet.js + tile provider | Pan/zoom, polygon overlays, popups, markers | ✅ Leaflet + tiles |
| **Historical maps** (dynasties, trade routes, battles) | SVG/Canvas static map + overlay | Period-accurate base, no modern roads needed | ❌ None (or ✅ tiles) |
| **Simple schematic maps** (plate boundaries, river systems) | SVG (inline) | No need for real geography — simplified diagram suffices | ❌ None |

### 18.2 Canvas 2D Toolkit: Precision Diagrams for Math & Physics

#### 18.2.1 Coordinate System Helper

Every math courseware drawing coordinate graphs should use this reusable helper:

```javascript
// === TeachAnyCanvas: Coordinate System Helper ===
function drawCoordinateSystem(ctx, options = {}) {
  const {
    width, height,        // canvas dimensions
    originX, originY,     // pixel position of origin (default: center)
    scale = 40,           // pixels per unit
    gridColor = '#1e293b',
    axisColor = '#64748b',
    labelColor = '#64748b',
    labelFont = '12px serif',
    xRange = [-10, 10],   // visible x range in units
    yRange = [-10, 10],   // visible y range in units
    showGrid = true,
    showLabels = true,
    showArrows = true
  } = options;

  const cx = originX ?? width / 2;
  const cy = originY ?? height / 2;

  // Grid
  if (showGrid) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = xRange[0]; i <= xRange[1]; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * scale, 0);
      ctx.lineTo(cx + i * scale, height);
      ctx.stroke();
    }
    for (let i = yRange[0]; i <= yRange[1]; i++) {
      ctx.beginPath();
      ctx.moveTo(0, cy - i * scale);
      ctx.lineTo(width, cy - i * scale);
      ctx.stroke();
    }
  }

  // Axes
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();

  // Arrows
  if (showArrows) {
    ctx.fillStyle = axisColor;
    // x-axis arrow
    ctx.beginPath();
    ctx.moveTo(width - 2, cy);
    ctx.lineTo(width - 12, cy - 5);
    ctx.lineTo(width - 12, cy + 5);
    ctx.fill();
    // y-axis arrow
    ctx.beginPath();
    ctx.moveTo(cx, 2);
    ctx.lineTo(cx - 5, 12);
    ctx.lineTo(cx + 5, 12);
    ctx.fill();
    // Labels
    ctx.font = '14px serif';
    ctx.fillText('x', width - 16, cy + 18);
    ctx.fillText('y', cx + 10, 16);
  }

  // Tick labels
  if (showLabels) {
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    ctx.textAlign = 'center';
    for (let i = xRange[0]; i <= xRange[1]; i++) {
      if (i === 0) continue;
      ctx.fillText(i, cx + i * scale, cy + 16);
    }
    ctx.textAlign = 'right';
    for (let i = yRange[0]; i <= yRange[1]; i++) {
      if (i === 0) continue;
      ctx.fillText(i, cx - 6, cy - i * scale + 4);
    }
    ctx.textAlign = 'center';
    ctx.fillText('O', cx - 12, cy + 16);
  }

  // Return coordinate converter for plotting
  return {
    toPixel: (x, y) => [cx + x * scale, cy - y * scale],
    toUnit: (px, py) => [(px - cx) / scale, (cy - py) / scale],
    cx, cy, scale
  };
}
```

**Usage in courseware**:
```javascript
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const coord = drawCoordinateSystem(ctx, {
  width: canvas.width, height: canvas.height, scale: 40
});

// Plot y = 2x + 1
ctx.strokeStyle = '#3b82f6';
ctx.lineWidth = 3;
ctx.beginPath();
const [x1, y1] = coord.toPixel(-10, -19);
const [x2, y2] = coord.toPixel(10, 21);
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
```

#### 18.2.2 Geometry Construction Primitives (SVG)

For geometry (triangles, circles, angle marks, construction lines), use **inline SVG** with JS interactivity:

```html
<svg id="geometry-canvas" viewBox="0 0 600 500" width="100%"
     style="max-width:600px;background:#0f172a;border-radius:12px;">

  <!-- Grid (optional) -->
  <defs>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="600" height="500" fill="url(#grid)"/>

  <!-- Triangle ABC -->
  <polygon id="triangle" points="150,400 450,400 300,120"
           fill="rgba(59,130,246,0.1)" stroke="#3b82f6" stroke-width="2"/>

  <!-- Vertices (draggable) -->
  <circle class="vertex" cx="150" cy="400" r="8" fill="#f59e0b" data-vertex="A"/>
  <circle class="vertex" cx="450" cy="400" r="8" fill="#f59e0b" data-vertex="B"/>
  <circle class="vertex" cx="300" cy="120" r="8" fill="#f59e0b" data-vertex="C"/>

  <!-- Labels -->
  <text x="140" y="430" fill="#f59e0b" font-size="16" font-weight="bold">A</text>
  <text x="455" y="430" fill="#f59e0b" font-size="16" font-weight="bold">B</text>
  <text x="295" y="108" fill="#f59e0b" font-size="16" font-weight="bold">C</text>

  <!-- Angle mark (arc) -->
  <path id="angle-A" d="" fill="none" stroke="#10b981" stroke-width="1.5"/>
</svg>
```

**Draggable vertex JS pattern**:
```javascript
function makeDraggable(svgEl) {
  const svg = document.getElementById('geometry-canvas');
  let dragging = null, offset = { x: 0, y: 0 };

  svg.querySelectorAll('.vertex').forEach(v => {
    v.style.cursor = 'grab';
    v.addEventListener('pointerdown', e => {
      dragging = v;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
      offset.x = svgPt.x - parseFloat(v.getAttribute('cx'));
      offset.y = svgPt.y - parseFloat(v.getAttribute('cy'));
      v.style.cursor = 'grabbing';
      e.preventDefault();
    });
  });

  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    dragging.setAttribute('cx', svgPt.x - offset.x);
    dragging.setAttribute('cy', svgPt.y - offset.y);
    updateGeometry(); // Recalculate triangle, angles, etc.
  });

  svg.addEventListener('pointerup', () => {
    if (dragging) dragging.style.cursor = 'grab';
    dragging = null;
  });
}
```

#### 18.2.3 Physics Experiment Animation Pattern

For physics (U-tubes, lenses, projectile motion, circuits):

```javascript
// Standard physics animation loop
function createPhysicsAnimation(canvasId, drawFn, sliders) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  function render() {
    const params = {};
    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      params[s.name] = parseFloat(el.value);
      const display = document.getElementById(s.displayId);
      if (display) display.textContent = params[s.name].toFixed(s.decimals || 1);
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFn(ctx, canvas.width, canvas.height, params);
  }

  sliders.forEach(s => {
    document.getElementById(s.id).addEventListener('input', render);
  });
  render(); // Initial draw
}

// Usage:
createPhysicsAnimation('uTubeCanvas', drawUTube, [
  { id: 'depthSlider', name: 'depth', displayId: 'depthVal', decimals: 1 },
  { id: 'densSlider',  name: 'density', displayId: 'densVal', decimals: 1 }
]);
```

#### 18.2.4 When to Use Canvas vs SVG

| Criterion | Canvas 2D | SVG (inline) |
|:---|:---|:---|
| **Best for** | Pixel-level graphs, animations, particle systems | Geometric shapes, labeled diagrams, concept maps |
| **Interactivity** | Mouse-hit-testing requires manual code | Native DOM events on every element |
| **Dragging** | Complex (manual hit detection) | Easy (pointer events on SVG elements) |
| **Text labels** | Blurry on HiDPI unless manually scaled | Crisp at any zoom |
| **Animation** | `requestAnimationFrame` loop | CSS transitions / SMIL / JS |
| **File size impact** | Minimal (JS code only) | Can bloat with complex paths |
| **Accessibility** | Poor (no DOM) | Good (`<title>`, `<desc>`, aria) |

**Rule of Thumb**: 
- **Function graphs, data plots, physics simulations** → Canvas
- **Geometry figures, biology diagrams, concept maps, labeled illustrations** → SVG
- **Both in one courseware** → Perfectly fine, mix as needed

### 18.3 Interactive Map System for Geography & History

#### 18.3.1 Three-Tier Map Strategy

TeachAny uses a **three-tier** approach for maps, from most lightweight to most capable:

| Tier | Technology | Use Case | External Deps | China-Friendly |
|:---|:---|:---|:---|:---|
| **Tier 1: SVG Map** | Inline SVG + GeoJSON path data | Simple schematic maps, plate tectonics, river systems, climate zones | ❌ None | ✅ Perfect |
| **Tier 2: Leaflet + China Tiles** | Leaflet.js + domestic tile provider | Interactive geography maps, monsoon systems, population density | ✅ Leaflet + tiles | ✅ With correct provider |
| **Tier 3: Leaflet + Offline Fallback** | Leaflet.js + embedded GeoJSON | Full-featured map when online, simplified SVG when offline | ✅ Leaflet (optional) | ✅ Graceful degradation |

**Selection Rule**:
- **If the map only needs to show outlines, regions, arrows, labels** → Tier 1 (SVG)
- **If the map needs pan/zoom on real geography** → Tier 2 (Leaflet)
- **If the map must work offline / in classroom without internet** → Tier 3 (Leaflet + fallback)

#### 18.3.2 Tier 1: SVG Schematic Maps (Zero Dependency)

For simplified geographic illustrations — no need for real roads/rivers/terrain:

```html
<!-- Simplified China map with highlighted provinces -->
<svg viewBox="0 0 800 700" width="100%" style="max-width:800px">
  <!-- Province paths from simplified GeoJSON (pre-converted to SVG paths) -->
  <path id="guangdong" d="M520,580 L540,575 L555,590..."
        fill="rgba(59,130,246,0.2)" stroke="#3b82f6" stroke-width="1.5"
        class="province" data-name="广东" data-info="华南地区，亚热带季风气候"/>
  <path id="sichuan" d="M350,420 L380,410..."
        fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="1.5"
        class="province" data-name="四川" data-info="西南地区，盆地气候"/>
  <!-- ... more provinces ... -->

  <!-- Labels -->
  <text x="535" y="595" fill="#60a5fa" font-size="12" text-anchor="middle">广东</text>
  <text x="365" y="440" fill="#fbbf24" font-size="12" text-anchor="middle">四川</text>

  <!-- Arrows (monsoon direction, trade routes, etc.) -->
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10Z" fill="#ef4444"/>
    </marker>
  </defs>
  <line x1="600" y1="650" x2="500" y2="500" stroke="#ef4444"
        stroke-width="2" marker-end="url(#arrow)"/>
</svg>

<script>
// Hover tooltip for SVG schematic map
document.querySelectorAll('.province').forEach(p => {
  p.addEventListener('mouseenter', e => {
    const name = e.target.dataset.name;
    const info = e.target.dataset.info;
    showTooltip(e, `${name}: ${info}`);
    e.target.style.fill = 'rgba(59,130,246,0.4)';
  });
  p.addEventListener('mouseleave', e => {
    hideTooltip();
    e.target.style.fill = '';
  });
});
</script>
```

**Common SVG map data sources** (for AI to embed at generation time):
- **China provinces**: Simplified from `geojson.cn` dataset, ~50KB for all provinces
- **World continents**: Simplified natural earth data, ~30KB for 7 continents
- **Plate boundaries**: Manually traced paths, ~5KB
- **Major river systems**: Simplified paths, ~10KB per region

**Rule**: The AI should generate simplified SVG paths directly in the courseware HTML. Do NOT reference external GeoJSON files — keep everything inline for zero-dependency.

#### 18.3.3 Tier 2: Leaflet + China-Friendly Tile Providers

When interactive pan/zoom maps are needed, use Leaflet with **China-accessible** tile sources:

**CDN for Leaflet (China-friendly)**:

```html
<!-- Option A: BootCDN (Recommended for China) -->
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>

<!-- Option B: npmmirror (Alibaba CDN) -->
<link rel="stylesheet" href="https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.css"/>
<script src="https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.js"></script>

<!-- Option C: unpkg (International, less reliable in China) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

**Tile provider priority list** (ordered by China reliability):

| Priority | Provider | URL Template | Style | Free? | Key Required | China Speed |
|:---|:---|:---|:---|:---|:---|:---|
| **1st** | 天地图 (TianDiTu) | `https://t{s}.tianditu.gov.cn/vec_w/wmts?...&tk={key}` | Vector / Satellite | ✅ Free (requires registration) | ✅ Yes (tk=) | ⭐⭐⭐⭐⭐ |
| **2nd** | 高德 (Amap) | `https://webrd0{s}.is.autonavi.com/appmaptile?...` | Road / Satellite | ✅ Free (personal use) | ❌ No | ⭐⭐⭐⭐⭐ |
| **3rd** | CARTO (Dark theme) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` | Dark | ✅ Free | ❌ No | ⭐⭐⭐ (variable) |
| **4th** | OpenStreetMap | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Standard | ✅ Free | ❌ No | ⭐⭐ (slow) |

**Recommended implementation with auto-fallback**:

```javascript
// === TeachAnyMap: China-friendly Leaflet setup ===
function initTeachAnyMap(containerId, options = {}) {
  const {
    center = [35, 105],  // Default: China center
    zoom = 4,
    style = 'dark',      // 'dark' | 'light' | 'satellite'
    tiandituKey = '',     // Optional: user's TianDiTu key
  } = options;

  const map = L.map(containerId, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView(center, zoom);

  // Tile provider chain — try each in order
  const tileProviders = {
    dark: [
      // 1st: GaoDe dark-ish (closest to dark theme)
      {
        url: 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8&ltype=11',
        options: { subdomains: '1234', maxZoom: 18, attribution: '© 高德地图' }
      },
      // 2nd: CARTO dark (international)
      {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: { subdomains: 'abcd', maxZoom: 18, attribution: '© CARTO © OSM' }
      },
    ],
    light: [
      // 1st: GaoDe standard
      {
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        options: { subdomains: '1234', maxZoom: 18, attribution: '© 高德地图' }
      },
      // 2nd: TianDiTu (if key provided)
      ...(tiandituKey ? [{
        url: `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk=${tiandituKey}`,
        options: { subdomains: '01234567', maxZoom: 18, attribution: '© 天地图' }
      }] : []),
      // 3rd: OSM
      {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 19, attribution: '© OpenStreetMap' }
      },
    ],
    satellite: [
      // 1st: GaoDe satellite
      {
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        options: { subdomains: '1234', maxZoom: 18, attribution: '© 高德地图' }
      },
    ]
  };

  const providers = tileProviders[style] || tileProviders.dark;
  let currentTileIndex = 0;

  function loadTile(index) {
    if (index >= providers.length) {
      console.warn('[TeachAnyMap] All tile providers failed. Showing blank map.');
      return;
    }
    const provider = providers[index];
    const layer = L.tileLayer(provider.url, {
      ...provider.options,
      errorTileUrl: '' // Suppress error tile images
    });

    // If tiles fail to load, try next provider
    let errorCount = 0;
    layer.on('tileerror', () => {
      errorCount++;
      if (errorCount > 3 && index < providers.length - 1) {
        console.warn(`[TeachAnyMap] Provider ${index} failing, switching to next...`);
        map.removeLayer(layer);
        loadTile(index + 1);
      }
    });

    layer.addTo(map);
  }

  loadTile(0);
  return map;
}
```

**Usage in courseware**:
```javascript
const map = initTeachAnyMap('monsoonMap', {
  center: [18, 85],
  zoom: 3,
  style: 'dark'
});

// Add overlays (polygons, markers, etc.) same as before
L.polygon(eastAsiaCoords, { color: '#ef4444', fillOpacity: 0.15 }).addTo(map);
```

#### 18.3.4 Tier 3: Offline Fallback with Embedded GeoJSON

For coursewares that must work without internet (classroom scenarios, `file://` protocol):

```javascript
// === Offline Map Fallback ===
function initMapWithFallback(containerId, geojsonData, options = {}) {
  // Try Leaflet first
  if (typeof L !== 'undefined') {
    try {
      const map = initTeachAnyMap(containerId, options);
      // Also add GeoJSON overlay for region highlighting
      if (geojsonData) {
        L.geoJSON(geojsonData, {
          style: feature => ({
            color: feature.properties.color || '#3b82f6',
            fillOpacity: 0.15, weight: 1.5
          }),
          onEachFeature: (feature, layer) => {
            if (feature.properties.name) {
              layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.info || ''}`);
            }
          }
        }).addTo(map);
      }
      return { type: 'leaflet', map };
    } catch(e) {
      console.warn('[TeachAnyMap] Leaflet failed, falling back to SVG.');
    }
  }

  // Fallback: render simplified SVG map
  const container = document.getElementById(containerId);
  container.innerHTML = renderSVGFallback(geojsonData, options);
  return { type: 'svg', container };
}

function renderSVGFallback(geojsonData, options) {
  // Convert GeoJSON to simplified SVG paths
  // This is a minimal implementation for teaching purposes
  return `
    <svg viewBox="0 0 800 500" width="100%" style="background:#0f172a;border-radius:12px;">
      <text x="400" y="30" fill="#94a3b8" font-size="14" text-anchor="middle">
        📴 离线模式 — 简化地图
      </text>
      <!-- Simplified geography rendered from embedded data -->
      ${geojsonData ? renderGeoJSONtoSVG(geojsonData) : ''}
    </svg>
  `;
}
```

**Leaflet CDN loading with fallback**:
```html
<!-- Try loading Leaflet from multiple CDNs -->
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      onerror="this.href='https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.css'"/>
<script src="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        onerror="loadFallbackScript()"></script>
<script>
function loadFallbackScript() {
  const s = document.createElement('script');
  s.src = 'https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.js';
  s.onerror = () => {
    // Final fallback: load from unpkg
    const s2 = document.createElement('script');
    s2.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s2.onerror = () => console.warn('All Leaflet CDNs failed. Using SVG fallback.');
    document.head.appendChild(s2);
  };
  document.head.appendChild(s);
}
</script>
```

#### 18.3.5 Historical Maps

Historical coursewares (dynasty territories, trade routes, battle maps) need **period-accurate** maps without modern roads. Two approaches:

**Approach A: SVG Historical Map (Preferred for K-12)**

The AI generates a **stylized SVG map** directly in the HTML, with:
- Simplified coastlines and major rivers from embedded path data
- Dynasty/kingdom territory polygons with semi-transparent fills
- City dots with labels (ancient names + modern equivalents)
- Trade routes / military campaigns as animated dashed paths
- Timeline slider to show territorial changes

```html
<!-- Historical map: Tang Dynasty territory -->
<svg viewBox="0 0 900 600" width="100%" style="max-width:900px;background:#1a1a2e;">
  <!-- Simplified coastline -->
  <path d="M680,50 L700,80 L720,90..." fill="none" stroke="#334155" stroke-width="1"/>

  <!-- Territory fill -->
  <path id="tang-territory" d="M200,100 L400,80..."
        fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="2"/>

  <!-- Major cities -->
  <circle cx="380" cy="250" r="6" fill="#ef4444"/>
  <text x="380" y="270" fill="#f87171" font-size="12" text-anchor="middle">
    长安 (今西安)
  </text>

  <!-- Silk Road route (animated) -->
  <path d="M380,250 L300,220 L200,200 L100,180"
        fill="none" stroke="#f59e0b" stroke-width="2"
        stroke-dasharray="8,4">
    <animate attributeName="stroke-dashoffset" from="24" to="0"
             dur="2s" repeatCount="indefinite"/>
  </path>

  <!-- Legend -->
  <rect x="20" y="520" width="200" height="60" rx="8"
        fill="rgba(30,41,59,0.8)" stroke="#334155"/>
  <text x="30" y="545" fill="#f59e0b" font-size="12">█ 唐朝疆域 (755年)</text>
  <text x="30" y="565" fill="#ef4444" font-size="12">● 重要城市</text>
</svg>
```

**Approach B: Leaflet + Historical Tile Layer (Advanced)**

For advanced use cases, use historical map tiles (rare, but available):
- DataV.GeoAtlas: `https://geo.datav.aliyun.com/areas_v3/bound/...` — Alibaba open geographic boundaries
- Use modern base tiles (satellite/terrain) with opacity reduction, then overlay historical data

**Recommendation for K-12**: Approach A (SVG) is **strongly preferred** because:
1. Zero external dependencies
2. AI can generate period-accurate maps inline
3. Students don't need internet
4. Teacher can use it in classroom offline
5. Historical accuracy is controlled by the AI, not by tile providers

### 18.4 China CDN Fallback Configuration

#### 18.4.1 CDN Priority Chain

For **any** external library the courseware might need:

| Priority | CDN Provider | Domain | China Speed | HTTPS | Notes |
|:---|:---|:---|:---|:---|:---|
| **1st** | BootCDN | `cdn.bootcdn.net` | ⭐⭐⭐⭐⭐ | ✅ | 极兔云/Bootstrap中国 |
| **2nd** | npmmirror (Alibaba) | `registry.npmmirror.com` | ⭐⭐⭐⭐⭐ | ✅ | 淘宝NPM镜像 |
| **3rd** | 字节 StaticFile | `cdn.staticfile.net` | ⭐⭐⭐⭐ | ✅ | 七牛/字节合作 |
| **4th** | jsdelivr | `cdn.jsdelivr.net` | ⭐⭐⭐ | ✅ | 有时被墙/慢 |
| **5th** | unpkg | `unpkg.com` | ⭐⭐ | ✅ | Cloudflare，不稳定 |

#### 18.4.2 Multi-CDN Loading Pattern

When any courseware needs an external library, use this pattern:

```html
<!-- CSS: onerror fallback chain -->
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      onerror="this.href='https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.css'"/>

<!-- JS: sequential fallback -->
<script>
(function loadLib(urls, idx) {
  if (idx >= urls.length) { console.warn('All CDNs failed for library'); return; }
  const s = document.createElement('script');
  s.src = urls[idx];
  s.onload = () => console.log('Loaded from', urls[idx]);
  s.onerror = () => loadLib(urls, idx + 1);
  document.head.appendChild(s);
})([
  'https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://registry.npmmirror.com/leaflet/1.9.4/files/dist/leaflet.js',
  'https://cdn.staticfile.net/leaflet/1.9.4/leaflet.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
], 0);
</script>
```

#### 18.4.3 Google Fonts Replacement

For coursewares using Google Fonts (e.g., `fonts.googleapis.com`):

```html
<!-- Replace Google Fonts with China mirror -->
<!-- ❌ AVOID: -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900" rel="stylesheet">

<!-- ✅ USE: system font stack (zero dependency, recommended) -->
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei',
               'Noto Sans SC', 'Helvetica Neue', sans-serif;
}
</style>

<!-- ✅ OR USE: Google Fonts China mirror (if web font needed) -->
<link href="https://fonts.googleapis.cn/css2?family=Noto+Sans+SC:wght@400;700;900" rel="stylesheet">
```

**Rule**: System font stacks are **strongly preferred** over web fonts. They're faster, work offline, and avoid CDN issues entirely. Use web fonts only for the Elementary template where playful typography is essential.

### 18.5 Subject-Specific Graphics Guidelines

| Subject | Graphics Needs | Recommended Approach |
|:---|:---|:---|
| **Math (Algebra)** | Coordinate graphs, function curves | Canvas + `drawCoordinateSystem()` helper |
| **Math (Geometry)** | Triangles, circles, angles, transformations | SVG with draggable vertices |
| **Math (Solid Geometry)** | Cubes, tetrahedra, cross-sections, dihedral angles, spatial vectors | Three.js (WebGL) — see §18.9 |
| **Math (Statistics)** | Bar charts, histograms, scatter plots | Canvas (or SVG for simple charts) |
| **Physics (Mechanics)** | Force diagrams, projectile paths, springs | Canvas animation + slider parameters |
| **Physics (Optics)** | Lens diagrams, reflection/refraction | SVG (ray paths) or Canvas |
| **Physics (Circuits)** | Circuit diagrams, current flow | SVG (components + flow animation) |
| **Chemistry** | Molecular structures, reaction diagrams | SVG (atom-bond models) |
| **Biology** | Cell structures, organ systems, processes | SVG (labeled diagrams with step reveal) |
| **Geography** | Climate zones, monsoons, plate tectonics | Tier 1 (SVG schematic) or Tier 2 (Leaflet) |
| **Geography** | Population density, GDP maps | Tier 2 (Leaflet + choropleth) |
| **History** | Dynasty territories, trade routes, battles | SVG historical map (Approach A) |
| **History** | Timeline events, cause-effect | SVG timeline or HTML/CSS timeline |

### 18.6 Graphics Integration Checklist

When building courseware with graphics, verify:

| Check | Required? | Details |
|:---|:---|:---|
| All Canvas/SVG graphics work on `file://` protocol? | ✅ Always | No external image/font/tile dependencies |
| External CDNs use China-friendly fallback chain? | ✅ When libs used | BootCDN → npmmirror → jsdelivr → unpkg |
| Map tile provider is China-accessible? | ✅ When maps used | GaoDe/TianDiTu first, CARTO/OSM as fallback |
| SVG elements have `viewBox` for responsive scaling? | ✅ Always | Never use fixed `width/height` without `viewBox` |
| Canvas handles HiDPI (Retina) displays? | ✅ Recommended | Scale canvas by `devicePixelRatio` |
| Draggable elements work on touch devices? | ✅ Always | Use `pointer` events, not `mouse` events |
| Color choices are accessible (contrast ratio ≥ 4.5:1)? | ✅ Always | Especially for graph labels and axis text |
| Graphics degrade gracefully without JS? | 🟡 Nice-to-have | Show static image or `<noscript>` message |

### 18.7 Canvas HiDPI (Retina) Setup

Always include this when using Canvas:

```javascript
function setupHiDPICanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // Set CSS size to maintain layout
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  return ctx;
}
```

### 18.8 Worked Example & Exercise Diagram Requirements

**Hard Rule**: Every worked example (`example-card`) and exercise that involves geometric figures, spatial reasoning, coordinate graphs, circuit diagrams, force diagrams, or any visual construct **MUST** include an inline diagram directly above or beside the problem statement. A text-only worked example for a geometry proof is pedagogically incomplete — students cannot follow "AB=CD, BC=DA, prove △ABC≌△CDA" without seeing the figure.

#### 18.8.1 When Is a Diagram Required?

| Subject | Requires Diagram | Diagram Type |
|:--------|:----------------|:-------------|
| **Math (Geometry)** | ✅ Always — triangles, quadrilaterals, circles, angles, parallel lines | Inline SVG |
| **Math (Algebra)** | ✅ When the problem involves a coordinate graph or geometric context | Canvas or SVG |
| **Physics** | ✅ Force diagrams, circuits, optics, experiment setups | SVG or Canvas |
| **Chemistry** | ✅ Molecular structures, experiment apparatus | SVG |
| **Biology** | ✅ Cell diagrams, organ systems, process flows | SVG |
| **Geography** | 🟡 Only when spatial reasoning is involved | SVG map or Leaflet |
| **History/Chinese/English** | ❌ Usually not needed (unless map or timeline) | — |

#### 18.8.2 SVG Geometry Diagram Template for Worked Examples

For geometry proofs and exercises, use this inline SVG pattern:

```html
<div class="example-card">
  <h3>【例1】SSS：AB=CD，BC=DA，求证△ABC≌△CDA</h3>
  
  <!-- Geometry figure — REQUIRED for any geometry example -->
  <svg viewBox="0 0 400 220" class="example-figure" 
       style="width:100%;max-width:400px;display:block;margin:0.8em auto;">
    <!-- Quadrilateral ABCD -->
    <polygon points="60,180 340,180 280,40 120,40" 
             fill="none" stroke="var(--text-secondary, #999)" stroke-width="1.5"/>
    <!-- Diagonal AC -->
    <line x1="60" y1="180" x2="280" y2="40" 
          stroke="var(--accent, #64b5f6)" stroke-width="2" stroke-dasharray="6,3"/>
    <!-- △ABC highlight -->
    <polygon points="60,180 340,180 280,40" 
             fill="rgba(100,181,246,0.1)" stroke="var(--accent, #64b5f6)" stroke-width="2"/>
    <!-- △CDA highlight -->
    <polygon points="280,40 120,40 60,180" 
             fill="rgba(129,199,132,0.1)" stroke="var(--success, #81c784)" stroke-width="2"/>
    <!-- Vertex labels -->
    <text x="40" y="195" fill="var(--text, #eee)" font-size="16" font-weight="bold">A</text>
    <text x="345" y="195" fill="var(--text, #eee)" font-size="16" font-weight="bold">B</text>
    <text x="285" y="35" fill="var(--text, #eee)" font-size="16" font-weight="bold">C</text>
    <text x="100" y="35" fill="var(--text, #eee)" font-size="16" font-weight="bold">D</text>
    <!-- Equal marks on sides -->
    <text x="190" y="200" fill="var(--accent, #64b5f6)" font-size="11" text-anchor="middle">AB = CD</text>
    <text x="160" y="100" fill="var(--success, #81c784)" font-size="11" text-anchor="middle">AC (公共边)</text>
  </svg>
  
  <button class="toggle-btn" onclick="toggleSolution(this)">显示解答 ▼</button>
  <div class="solution"><!-- proof table --></div>
</div>
```

#### 18.8.3 Design Rules for Example Diagrams

1. **Position**: The SVG goes **inside** the `.example-card`, between the `<h3>` title and the solution toggle button.
2. **Size**: Use `viewBox` for responsiveness, `max-width: 400px` for geometry, `max-width: 500px` for coordinate graphs.
3. **Colors**: Use CSS custom properties (`var(--accent)`, `var(--success)`, `var(--text)`) to match the courseware theme. Use semi-transparent fills to highlight regions.
4. **Labels**: Vertex labels in **bold 16px**, side/angle annotations in **11-12px**. Use `text-anchor="middle"` for centered labels.
5. **Equal marks**: Show equal sides with tick marks (short perpendicular lines) or color-coded annotations. Show equal angles with matching arc marks.
6. **Multiple triangles**: Use different colors (blue for △1, green for △2) with semi-transparent fills so overlapping regions are visible.
7. **Accessibility**: All SVG `<text>` elements should use `fill="var(--text)"` for theme compatibility. Add `role="img"` and `aria-label` to the root `<svg>`.

#### 18.8.4 Common Geometry Patterns

| Pattern | Key Elements to Draw | SVG Components |
|:--------|:--------------------|:---------------|
| **Two triangles sharing a diagonal** | Quadrilateral + diagonal + two colored triangles | `<polygon>` × 3 + `<line>` + `<text>` labels |
| **Midpoint with perpendiculars** | Line segment + midpoint mark + two perpendicular lines + two triangles | `<line>` + `<circle r="3">` (midpoint) + right-angle marks |
| **Parallel lines with transversal** | Two horizontal lines + transversal + angle arcs + two triangles | `<line>` × 3 + `<path>` arcs for angles + parallel arrows |
| **Right triangle (HL)** | Right triangle + hypotenuse label + right-angle box | `<polygon>` + `<rect>` (right angle) + `<text>` labels |
| **Isosceles triangle** | Triangle + altitude/median + tick marks on equal sides | `<polygon>` + `<line>` (altitude) + tick marks |

#### 18.8.5 Exercise Diagram Guidelines

For scaffolded exercises (Level 1/2/3), apply the same rule:
- **Level 1 (full scaffold)**: Diagram is fully labeled with all given conditions marked
- **Level 2 (partial scaffold)**: Diagram shows the figure but only partial labels — student must identify the rest
- **Level 3 (no scaffold)**: Diagram shows only the basic figure — student must add labels and reasoning

### 18.9 Solid Geometry 3D Graphics (Three.js)

> **Why a new approach?** Sections 18.2–18.8 cover 2D graphics (Canvas/SVG) which work well for plane geometry. However, solid geometry (空间几何体) coursewares — cubes, prisms, pyramids, cross-sections, dihedral angles, spatial vectors — require true 3D rendering with camera rotation, depth-based hidden-edge rendering, and transparent faces. Hand-coding 3D→2D projection in SVG is fragile (every vertex change cascades to all projected coordinates) and cannot support interactive rotation. **Three.js (WebGL)** is the recommended solution.

#### 18.9.1 Technology Selection: Solid Geometry

| Approach | Pros | Cons | Verdict |
|:---|:---|:---|:---|
| **Hand-coded SVG** (oblique projection) | Zero dependencies, small file size | Manual projection math, no rotation, hidden-edge logic tedious, one viewpoint only | ❌ Avoid for anything beyond a single static diagram |
| **Canvas 2D + projection function** | No WebGL needed, moderate maintainability | Still 2D — no real rotation, manual z-ordering | 🟡 Acceptable for simple static solids |
| **CSS 3D Transform** | Lightweight, no library | Only flat faces, poor wireframe/edge rendering, no cross-section slicing | 🟡 Suitable only for rotating a single box |
| **Three.js (WebGL)** | True 3D, camera orbit, transparent faces, hidden edges auto, cross-section clipping | ~150KB CDN dependency | ✅ **Recommended** for all solid geometry coursewares |
| **GeoGebra embed** | Mature math tool, built-in solid geometry | iframe dependency, loses single-file purity, limited theme control | 🟡 Alternative if Three.js is overkill |

#### 18.9.2 Three.js CDN Setup (China-Friendly)

Follow the same CDN fallback chain as §18.4:

```html
<!-- Three.js r175 — China-friendly CDN chain -->
<script>
(function loadThree(urls, idx) {
  if (idx >= urls.length) { console.warn('[TeachAny3D] All Three.js CDNs failed'); return; }
  const s = document.createElement('script');
  s.src = urls[idx];
  s.onload = () => { console.log('[TeachAny3D] Loaded from', urls[idx]); initScene(); };
  s.onerror = () => loadThree(urls, idx + 1);
  document.head.appendChild(s);
})([
  'https://cdn.bootcdn.net/ajax/libs/three.js/r175/three.min.js',
  'https://registry.npmmirror.com/three@0.175.0/files/build/three.min.js',
  'https://cdn.staticfile.net/three.js/r175/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.175.0/build/three.min.js',
  'https://unpkg.com/three@0.175.0/build/three.min.js'
], 0);
</script>
```

For OrbitControls (drag-rotate), use the ES module version or a bundled CDN:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.bootcdn.net/ajax/libs/three.js/r175/three.module.min.js",
    "three/addons/": "https://cdn.bootcdn.net/ajax/libs/three.js/r175/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// ...scene setup
</script>
```

> **Note**: If ES module `importmap` is unavailable in the target browser, use the UMD build and include `OrbitControls` separately, or implement a minimal drag-rotate handler (see §18.9.4).

#### 18.9.3 Solid Geometry Scene Template

A complete, single-file-friendly template for drawing a labeled cube with hidden edges, transparent faces, and orbit controls:

```html
<div id="solid-geo-container" style="width:100%;max-width:560px;aspect-ratio:4/3;
     margin:16px auto;border-radius:14px;overflow:hidden;background:#0f172a;
     border:1px solid rgba(148,163,184,0.15);">
</div>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function initSolidGeo() {
  const container = document.getElementById('solid-geo-container');
  const w = container.clientWidth, h = container.clientHeight;

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0f172a);
  container.appendChild(renderer.domElement);

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(3, 2.5, 3);
  camera.lookAt(0, 0, 0);

  // --- Orbit Controls (drag to rotate) ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  // --- Cube edges (visible wireframe) ---
  const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x64b5f6, linewidth: 1 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeo), edgeMat);
  scene.add(edges);

  // --- Transparent faces ---
  const faceMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6, transparent: true, opacity: 0.06,
    side: THREE.DoubleSide, depthWrite: false
  });
  const faceMesh = new THREE.Mesh(cubeGeo, faceMat);
  scene.add(faceMesh);

  // --- Vertex labels (CSS2DRenderer alternative: sprite labels) ---
  const vertices = [
    { pos: [-1,-1,-1], label: 'A' },
    { pos: [ 1,-1,-1], label: 'B' },
    { pos: [ 1,-1, 1], label: 'C' },
    { pos: [-1,-1, 1], label: 'D' },
    { pos: [-1, 1,-1], label: "A'" },
    { pos: [ 1, 1,-1], label: "B'" },
    { pos: [ 1, 1, 1], label: "C'" },
    { pos: [-1, 1, 1], label: "D'" },
  ];
  vertices.forEach(v => {
    const sprite = makeTextSprite(v.label, { fontSize: 28, color: '#f59e0b' });
    sprite.position.set(v.pos[0] * 1.15, v.pos[1] * 1.15, v.pos[2] * 1.15);
    scene.add(sprite);
  });

  // --- Vertex dots ---
  const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  vertices.forEach(v => {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(...v.pos);
    scene.add(dot);
  });

  // --- Ambient light (for MeshBasicMaterial not strictly needed) ---
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // --- Render loop ---
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // --- Resize ---
  const ro = new ResizeObserver(() => {
    const w2 = container.clientWidth, h2 = container.clientHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });
  ro.observe(container);
}

// --- Sprite Text Helper ---
function makeTextSprite(text, { fontSize = 24, color = '#f59e0b', bg = 'transparent' } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 128; canvas.height = 64;
  ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 128, 64);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.5, 0.25, 1);
  return sprite;
}

initSolidGeo();
</script>
```

#### 18.9.4 Minimal Orbit Controls (No-Import Fallback)

When ES module imports are unavailable, use this minimal drag-rotate handler (~30 lines):

```javascript
function addMinimalOrbit(camera, domElement) {
  let isDragging = false, prev = { x: 0, y: 0 };
  let theta = Math.PI / 4, phi = Math.PI / 3, radius = 5;

  function updateCamera() {
    camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
  }

  domElement.addEventListener('pointerdown', e => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; });
  domElement.addEventListener('pointermove', e => {
    if (!isDragging) return;
    theta -= (e.clientX - prev.x) * 0.008;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - (e.clientY - prev.y) * 0.008));
    prev = { x: e.clientX, y: e.clientY };
    updateCamera();
  });
  domElement.addEventListener('pointerup', () => isDragging = false);
  domElement.addEventListener('wheel', e => {
    radius = Math.max(2, Math.min(10, radius + e.deltaY * 0.01));
    updateCamera();
    e.preventDefault();
  }, { passive: false });

  updateCamera();
}
```

#### 18.9.5 Common Solid Geometry Patterns

| Pattern | 3D Elements | Three.js Implementation |
|:--------|:-----------|:----------------------|
| **Cube ABCD-A'B'C'D'** | 8 vertices, 12 edges, 6 transparent faces | `BoxGeometry` + `EdgesGeometry` + sprite labels |
| **Triangular prism** | 6 vertices, 9 edges, 5 faces | `BufferGeometry` (manual vertices) + `EdgesGeometry` |
| **Tetrahedron / pyramid** | 4-5 vertices, 6-8 edges | `TetrahedronGeometry` or manual `BufferGeometry` |
| **Cross-section of a cube** | Cube + slicing plane + intersection polygon | `THREE.Plane` + compute intersection points + `Shape` → `ShapeGeometry` |
| **Dihedral angle** | Two half-planes meeting at an edge + angle arc in 3D | Two `PlaneGeometry` + arc via `TubeGeometry` or `Line` |
| **Spatial vector** | Arrow from point A to point B | `ArrowHelper` or custom cylinder + cone |
| **Point-to-plane distance** | Point + plane + perpendicular foot + dashed line | `Mesh` (plane) + `Line` (dashed) + sprite label for distance |
| **Rotation body** (cylinder, cone, sphere) | Revolution surface | `CylinderGeometry`, `ConeGeometry`, `SphereGeometry` |

#### 18.9.6 Cross-Section Visualization (Advanced)

Cross-sections (截面) are a high-frequency exam topic. Use a clipping plane or manual intersection:

```javascript
// Method: Compute intersection polygon of a plane with a cube
function computeCrossSection(cubeVertices, cubeEdges, planeNormal, planeD) {
  const intersections = [];
  cubeEdges.forEach(([i, j]) => {
    const a = cubeVertices[i], b = cubeVertices[j];
    const dA = planeNormal.dot(a) + planeD;
    const dB = planeNormal.dot(b) + planeD;
    if (dA * dB < 0) { // Edge crosses plane
      const t = dA / (dA - dB);
      intersections.push(new THREE.Vector3().lerpVectors(a, b, t));
    }
  });
  // Sort intersection points by angle around centroid to form polygon
  if (intersections.length >= 3) {
    const centroid = intersections.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(intersections.length);
    const refDir = new THREE.Vector3().subVectors(intersections[0], centroid).normalize();
    const up = planeNormal.clone().normalize();
    intersections.sort((a, b) => {
      const da = new THREE.Vector3().subVectors(a, centroid);
      const db = new THREE.Vector3().subVectors(b, centroid);
      return Math.atan2(da.dot(up.clone().cross(refDir)), da.dot(refDir))
           - Math.atan2(db.dot(up.clone().cross(refDir)), db.dot(refDir));
    });
  }
  return intersections;
}

// Render the cross-section as a colored polygon
function renderCrossSection(scene, points) {
  const shape = new THREE.Shape();
  // Project to 2D, create shape, then position in 3D
  const geo = new THREE.BufferGeometry().setFromPoints([...points, points[0]]);
  const line = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 }));
  scene.add(line);
  // Optional: filled polygon
  const fillGeo = new THREE.ShapeGeometry(/* ... */);
  // ...
}
```

#### 18.9.7 Interactive Slider for Solid Geometry

Solid geometry coursewares should support parameter sliders (same pattern as §18.2.3):

| Parameter | Use Case | Example |
|:---|:---|:---|
| **Cross-section position** | Slide a cutting plane through a cube | `planeD` from -1 to +1 |
| **Rotation angle** | Rotate a face to visualize dihedral angle | `angle` from 0° to 180° |
| **Camera angle presets** | Switch between front/top/side/isometric views | Button group, not slider |
| **Vector components** | Adjust spatial vector (x, y, z) | Three sliders for components |
| **Opacity** | Show/hide specific faces | Slider or toggle |

**Camera preset buttons** are strongly recommended for solid geometry to help students who struggle with free rotation:

```javascript
const presets = {
  front:     { pos: [0, 0, 5],   label: '正视' },
  top:       { pos: [0, 5, 0.01],label: '俯视' },
  side:      { pos: [5, 0, 0],   label: '侧视' },
  isometric: { pos: [3, 2.5, 3], label: '斜视' },
};
Object.entries(presets).forEach(([key, { pos, label }]) => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = 'tab-btn';
  btn.onclick = () => {
    camera.position.set(...pos);
    camera.lookAt(0, 0, 0);
    controls.update();
  };
  document.getElementById('view-buttons').appendChild(btn);
});
```

#### 18.9.8 When to Use Three.js vs SVG for Geometry

| Criterion | SVG (2D) | Three.js (3D) |
|:---|:---|:---|
| **Best for** | Plane geometry — triangles, circles, parallel lines, coordinate graphs | Solid geometry — cubes, prisms, pyramids, cross-sections |
| **Rotation** | ❌ Not applicable (2D) | ✅ Free orbit rotation, preset views |
| **Hidden edges** | Manual (draw dashed lines) | ✅ Automatic (depth buffer) |
| **Transparency** | Manual (fill-opacity) | ✅ Native alpha blending, per-face control |
| **Cross-sections** | ❌ Very difficult to compute manually | ✅ Clipping planes or intersection algorithm |
| **File size impact** | ~0 KB (inline) | ~150KB (Three.js CDN) |
| **Offline support** | ✅ Perfect (inline SVG) | 🟡 Needs CDN or bundled library |
| **Touch/mobile** | ✅ Native pointer events | ✅ OrbitControls supports touch |
| **Accessibility** | ✅ SVG `<text>`, `aria-label` | 🟡 Canvas-based, needs aria on container |

**Rule of Thumb**:
- **Plane geometry** (全等三角形、相似、圆) → **SVG** (§18.2.2, §18.8)
- **Solid geometry** (正方体、截面、二面角、空间向量) → **Three.js** (§18.9)
- **Mixed** (coordinate geometry with 3D context) → Use SVG for the 2D part, Three.js for the 3D visualization

#### 18.9.9 Solid Geometry Integration Checklist

When building a solid geometry courseware, verify:

| Check | Required? | Details |
|:---|:---|:---|
| Three.js loaded with China-friendly CDN fallback chain? | ✅ Always | BootCDN → npmmirror → staticfile → jsdelivr → unpkg |
| OrbitControls or minimal orbit handler included? | ✅ Always | Students must be able to rotate the view |
| Camera preset buttons (正视/俯视/侧视/斜视) provided? | ✅ Recommended | Helps students who can't navigate free rotation |
| All vertex labels use sprite text (not CSS overlay)? | ✅ Recommended | Sprites rotate with the scene, always face camera |
| Transparent faces use `depthWrite: false`? | ✅ Always | Prevents z-fighting with edges and other transparent faces |
| Edges use `EdgesGeometry` (not wireframe)? | ✅ Recommended | `EdgesGeometry` shows only geometric edges, not triangulation diagonals |
| Cross-section polygon sorted by angle? | ✅ When used | Unsorted points produce self-intersecting polygons |
| Resize handler uses `ResizeObserver`? | ✅ Always | Maintains correct aspect ratio in responsive layout |
| WebGL availability checked with fallback message? | ✅ Nice-to-have | Show a static SVG diagram if WebGL is unsupported |

---

**Storage Budget**: A typical student with 50 courses and 200 review cards uses ~100KB of localStorage — well within the 5MB limit of all modern browsers.

---

**Skill Version**: v5.4
**Updated**: 2026-04-07
**Changelog**:
- v1.0: Math/science courseware edition
- v2.0: Split into universal foundation + subject adaptation layer
- v3.0: Added complete Bloom table, lesson type classification, scaffolding strategy, Mayer principles, Five-Lens selection guide, 3-subject complete examples, visual design specifications, Phase 4 review checklist
- v4.0: Added Video & Audio Production Pipeline (Remotion auto-setup, Edge TTS integration, bilingual subtitle system, language configuration), Token & Cost Estimation
- v5.0: Added Frontend Learning Loop System — Adaptive Branching, Progress Persistence, Spaced Repetition Engine, Achievement & Gamification System, PWA & Offline Support. Updated Phase 4 Review Checklist.
- v5.1: Added Cross-Courseware Routing Protocol (Section 17.9) — Two-Layer Adaptive Model, Courseware Metadata Standard (`<meta>` tags), Course Registry (`course-registry.json`), `TeachAnyRouter` runtime module with nav bar + prerequisite warning modal, course completion trigger with next-course recommendation, graceful degradation rules, AI registry generation rules. Updated Integration Checklist and localStorage Schema.
- v5.2: Added Graphics & Map Technical Specification (Section 18) — Canvas 2D coordinate system helper + physics animation pattern, SVG geometry construction with draggable vertices, Three-Tier map strategy (SVG schematic → Leaflet + China tiles → offline fallback), China-friendly CDN fallback chain (BootCDN → npmmirror → staticfile → jsdelivr → unpkg), TeachAnyMap auto-fallback tile loader (GaoDe/TianDiTu/CARTO/OSM), historical SVG map approach for dynasty coursewares, Google Fonts replacement with system font stacks, HiDPI Canvas setup, subject-specific graphics guidelines. Updated Section 10.1 tech stack table and Phase 4 Review Checklist with graphics/map checks.
- v5.3: Added Worked Example & Exercise Diagram Requirements (Section 18.8) — mandatory diagram rule for geometry/spatial/graphical examples, SVG geometry template with theme-aware colors, common geometry patterns table, exercise diagram guidelines with scaffold levels. Updated Section 13 with hard rule: "Every worked example involving spatial/geometric reasoning MUST include a diagram."
- v5.4: Added Solid Geometry 3D Graphics specification (Section 18.9) — Three.js as recommended approach for solid geometry (cubes, prisms, pyramids, cross-sections, dihedral angles, spatial vectors), China-friendly CDN setup with fallback chain, complete scene template with orbit controls + vertex sprite labels + transparent faces + edge rendering, minimal orbit fallback (~30 lines, no import needed), common solid geometry patterns table, cross-section intersection algorithm, interactive slider & camera preset patterns, SVG vs Three.js decision matrix, integration checklist. Updated Section 18.1 technology selection matrix and Section 18.5 subject-specific guidelines with solid geometry entries.
