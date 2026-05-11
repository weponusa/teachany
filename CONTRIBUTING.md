# Contributing to TeachAny | 参与贡献 TeachAny（教我学）

[English](#english) | [中文](#中文)

---

## English

Thank you for your interest in contributing to TeachAny! We welcome contributions from educators, developers, designers, and anyone passionate about improving education.

### Ways to Contribute

#### 🎓 Create a New Course
1. Pick any K-12 topic
2. Follow the [Getting Started Guide](docs/getting-started.md)
3. Use the TeachAny Skill to generate an interactive courseware
4. Submit a PR with your course in the `examples/` directory

**Or share via the Community system:**
1. Import your courseware in the Gallery (click ➕)
2. Click the 🌐 **Share** button on your courseware card
3. Enter your GitHub Token — a PR is auto-created
4. Maintainer reviews and merges → your courseware becomes available to everyone!

See [community/README.md](community/README.md) for full submission guidelines and review criteria.

**Course Submission Checklist:**
- [ ] Single-file HTML, works in any browser
- [ ] Follows the [Design System](docs/design-system.md) color scheme
- [ ] Includes learning objectives, pre-test, at least 2 knowledge modules, and post-test
- [ ] Has interactive exercises with error-specific feedback
- [ ] Covers at least 3 levels of Bloom's Taxonomy
- [ ] Add a brief `README.md` in your course folder

#### 🌐 Translate
- Translate the Skill definition (`skill/SKILL.md`) to a new language
- Translate documentation in `docs/`
- Name files with language suffix: `SKILL_JP.md`, `SKILL_KR.md`, etc.

#### 🐛 Report Issues
- Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug-report.md)
- For pedagogical issues (incorrect content, poor instructional design), mention the specific course and section

#### 📝 Improve Documentation
- Better examples, clearer explanations
- New subject-specific guides in `docs/subject-guides/`
- Corrections to academic references

#### 🎨 Design Components
- Reusable interactive widgets (quiz engines, graph components, etc.)
- Visual improvements to existing courses
- New CSS themes or design tokens

### Development Workflow

1. **Fork** this repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** following our coding standards
4. **Test** by opening your HTML file in a browser
5. **Submit a PR** with a clear description

### Coding Standards

- **HTML**: Single-file, self-contained, no external dependencies (except CDN libraries like Leaflet, D3, etc.)
- **CSS**: Use CSS custom properties from the [Design System](docs/design-system.md)
- **JavaScript**: Vanilla JS preferred; keep it readable
- **Content**: Follow TeachAny's instructional design methodology

### Code of Conduct

- Be respectful and inclusive
- Pedagogical accuracy matters — cite sources for educational claims
- Focus on student learning outcomes, not technical showmanship

---

## 中文

感谢你对 TeachAny 项目的关注！我们欢迎教育工作者、开发者、设计师，以及所有热爱改善教育体验的人参与贡献。

### 贡献方式

#### 🎓 创建新课件
1. 选择任意 K12 知识点
2. 参考 [快速上手指南](docs/getting-started.md)
3. 使用 TeachAny Skill 生成互动课件
4. 将课件提交到 `examples/` 目录的 PR

**或通过社区共享系统分享：**
1. 在 Gallery 中导入你的课件（点击 ➕）
2. 点击课件卡片上的 🌐 **分享** 按钮
3. 输入 GitHub Token — 系统会自动创建 PR
4. 维护者审核合并后，你的课件将对所有用户可见！

详见 [community/README.md](community/README.md) 了解完整的提交规范和审核标准。

**课件提交清单：**
- [ ] 单文件 HTML，任何浏览器可用
- [ ] 遵循[设计系统](docs/design-system.md)配色方案
- [ ] 包含学习目标、前测、至少 2 个知识模块、后测
- [ ] 有互动练习和针对性错误反馈
- [ ] 覆盖至少 3 个 Bloom 认知层级
- [ ] 在课件文件夹中添加简要 `README.md`

#### 🌐 翻译
- 将 Skill 定义（`skill/SKILL.md`）翻译成其他语言
- 翻译 `docs/` 中的文档
- 文件命名加语言后缀：`SKILL_JP.md`、`SKILL_KR.md` 等

#### 🐛 报告问题
- 使用 [Bug Report 模板](.github/ISSUE_TEMPLATE/bug-report.md)
- 教学内容问题（内容错误、设计不当），请指明具体课件和章节

#### 📝 完善文档
- 更好的例子、更清晰的说明
- 新增学科指南到 `docs/subject-guides/`
- 修正学术引用

#### 🎨 设计组件
- 可复用的互动组件（测验引擎、图表组件等）
- 改进现有课件的视觉效果
- 新的 CSS 主题或设计令牌

### 开发流程

1. **Fork** 本仓库
2. **创建分支**：`git checkout -b feature/your-feature`
3. **修改代码**，遵循编码规范
4. **测试**：在浏览器中打开 HTML 文件确认效果
5. **提交 PR**，附上清晰的描述

### 编码规范

- **HTML**：单文件、自包含，无外部依赖（CDN 库除外，如 Leaflet、D3 等）
- **CSS**：使用 [设计系统](docs/design-system.md) 中的 CSS 自定义属性
- **JavaScript**：优先使用原生 JS，保持可读性
- **内容**：遵循 TeachAny 的教学设计方法论

### 行为准则

- 尊重和包容他人
- 教学准确性很重要——教育相关的声明请引用来源
- 聚焦学生学习效果，而非技术炫技
