# Getting Started with TeachAny | 快速上手指南

[English](#english) | [中文](#中文)

---

## English

### Create Your First Course in 5 Minutes

#### Step 1: Choose Your Method

| Method | Best For | Setup Time |
|:-------|:---------|:-----------|
| **AI Skill** (Recommended) | Full courseware from scratch | 30 seconds |
| **Template** | Starting with structure, adding your content | 2 minutes |
| **Remix** | Modifying an existing course | 1 minute |

#### Step 2A: Using as an AI Skill

1. **Install the Skill**
   - For **CodeBuddy**: Copy `skill/SKILL.md` to your CodeBuddy skills directory
   - For **Cursor**: Add `skill/SKILL.md` as a custom instruction or rule
   - For **Claude**: Paste the skill content at the beginning of your conversation

2. **Start a Conversation**

   ```
   Create an interactive courseware for "Pythagorean Theorem" (Grade 8 Math, new concept lesson)
   ```

   Or be more specific:

   ```
   Create an interactive courseware:
   - Topic: Photosynthesis
   - Subject: Biology
   - Grade: 7
   - Lesson type: New concept
   - Focus: The light reactions vs. Calvin cycle
   - Include: Experiment simulation, drag-and-drop labeling
   ```

3. **The AI Will Follow TeachAny's Workflow**
   - Answer the 6 pre-design questions
   - Choose subject-specific framework
   - Build ABT narrative
   - Generate complete HTML courseware

#### Step 2B: Using the Template

```bash
# Clone the repository
git clone https://github.com/wepon/teachany.git
cd teachany

# Copy the template
cp -r examples/_template examples/my-new-course

# Open in your editor
code examples/my-new-course/index.html

# Preview in browser
open examples/my-new-course/index.html
```

Then replace all `【placeholder text】` with your content. The template includes:
- Pre-configured Design System (dark theme)
- Navigation bar with anchor links
- Learning objectives grid
- Pre-test with quiz engine
- Module structure (ABT → explanation → practice)
- Three-level exercises
- Post-test

#### Step 2C: Remixing an Existing Course

```bash
# Pick any course
cp -r examples/math-quadratic-function examples/my-math-course

# Modify the content
code examples/my-math-course/index.html
```

### Step 3: Follow the TeachAny Checklist

Before publishing, verify:

- [ ] ✅ ABT introduction effectively answers "why learn this?"
- [ ] ✅ Every difficult point uses the Five-Lens method
- [ ] ✅ At least one genuine output task (not just multiple choice)
- [ ] ✅ Error feedback is per-option, not just "correct/incorrect"
- [ ] ✅ Bloom's Taxonomy coverage: at least 3 levels
- [ ] ✅ Scaffolding has levels (full → partial → none)
- [ ] ✅ Core text per card: ~75 words
- [ ] ✅ Pre-test + Post-test for learning loop

### Tips for Better Courses

1. **Start with the 6 Questions** — Don't skip this. It shapes everything.
2. **Use Subject-Specific Frameworks** — Math ≠ History ≠ Biology. Check the [Subject Guides](subject-guides/).
3. **Error Diagnosis > "Wrong!"** — The #1 feature that makes TeachAny different.
4. **Test with a Student** — If possible, watch a student use it. You'll find the gaps.
5. **Keep Cards Short** — If you're writing paragraphs, you're writing too much.

---

## 中文

### 5 分钟创建你的第一个课件

#### 第一步：选择创建方式

| 方式 | 适合场景 | 准备时间 |
|:-----|:---------|:---------|
| **AI Skill**（推荐） | 从零开始生成完整课件 | 30 秒 |
| **模板** | 有结构，填入内容 | 2 分钟 |
| **改造** | 修改现有课件 | 1 分钟 |

#### 第二步A：使用 AI Skill

1. **安装 Skill**
   - **CodeBuddy**：将 `skill/SKILL_CN.md` 复制到 CodeBuddy 的 skills 目录
   - **Cursor**：将 `skill/SKILL_CN.md` 添加为自定义规则
   - **Claude**：将 Skill 内容粘贴到对话开头

2. **开始对话**

   ```
   帮我做一个"勾股定理"（八年级数学，新授课）的互动教学课件
   ```

   或更具体：

   ```
   帮我做一个互动课件：
   - 主题：光合作用
   - 学科：生物
   - 年级：初一
   - 课型：新授课
   - 重点：光反应和暗反应的区别
   - 要求：实验模拟、拖拽标注
   ```

3. **AI 将遵循 TeachAny 工作流**
   - 回答 6 个设计问题
   - 选择学科专属框架
   - 构建 ABT 叙事
   - 生成完整 HTML 课件

#### 第二步B：使用模板

```bash
# 克隆仓库
git clone https://github.com/wepon/teachany.git
cd teachany

# 复制模板
cp -r examples/_template examples/my-new-course

# 编辑内容
code examples/my-new-course/index.html

# 浏览器预览
open examples/my-new-course/index.html
```

替换所有 `【占位文字】`，模板已包含完整的设计系统和课件结构。

#### 第二步C：改造现有课件

```bash
cp -r examples/math-quadratic-function examples/my-course
code examples/my-course/index.html
```

### 第三步：使用 TeachAny 检查清单

发布前确认：

- [ ] ✅ ABT 引入有效回答了"为什么要学"
- [ ] ✅ 每个难点都用了五镜头法
- [ ] ✅ 至少有一个真正的输出任务
- [ ] ✅ 错误反馈是逐选项诊断的
- [ ] ✅ Bloom 层级覆盖至少 3 级
- [ ] ✅ 脚手架有分级
- [ ] ✅ 每张卡片核心文字约 75 字
- [ ] ✅ 有前测和后测形成学习闭环

### 做出更好课件的建议

1. **从 6 问开始** — 不要跳过，它决定了一切
2. **使用学科专属框架** — 数学≠历史≠生物，查看[学科指南](subject-guides/)
3. **错因诊断 > "答错了！"** — 这是 TeachAny 最大的差异化
4. **找学生测试** — 看一个学生用，你会发现所有的坑
5. **卡片要短** — 如果你在写大段文字，就写多了
