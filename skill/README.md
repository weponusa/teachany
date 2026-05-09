<h1 align="center">🎓 TeachAny Skill</h1>

<p align="center">
  <strong>An open-source Agent Skill that turns AI into a K-12 courseware designer.</strong><br>
  把 AI 变成懂教学设计的 K-12 互动课件生成器。
</p>

<p align="center">
  <a href="#-quick-install"><img src="https://img.shields.io/badge/Install-30s-brightgreen?style=flat-square" alt="Quick Install"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Size-43MB-orange?style=flat-square" alt="Size">
  <img src="https://img.shields.io/badge/Scripts-15-purple?style=flat-square" alt="Scripts">
  <a href="SKILL_CN.md"><img src="https://img.shields.io/badge/中文文档-点击查看-red?style=flat-square" alt="Chinese Doc"></a>
</p>

<p align="center">
  <a href="#-what-is-it">What is it</a> ·
  <a href="#-quick-install">Quick Install</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-design-principles">Design Principles</a> ·
  <a href="INSTALL.md">Full Install Guide</a> ·
  <a href="SKILL_CN.md">中文完整文档</a>
</p>

---

## 🌟 What is it

**TeachAny Skill** is an [Agent Skill](https://docs.anthropic.com/en/docs/build-with-claude/agents-and-tools/tool-use/overview)
designed for AI coding assistants (Claude Code, CodeBuddy, Cursor, Codex CLI, etc.).
It teaches your AI how to design and build **pedagogically-sound, interactive K-12 courseware** —
not just "a page full of knowledge", but a complete learning experience with motivation,
pacing, interaction, and assessment loops.

**TeachAny Skill** 是一个开源 Agent Skill，适用于各类 AI 编程助手
（Claude Code、CodeBuddy、Cursor、Codex CLI 等）。它让 AI 学会按 **教学设计**
而不是"堆知识点"的方式，为 K-12 学生生成**有动机、有节奏、有互动、有评估闭环**的互动课件。

## 🚀 Quick Install

```bash
# CodeBuddy
git clone https://github.com/weponusa/teachany-skill.git ~/.codebuddy/skills/teachany

# Claude Code
git clone https://github.com/weponusa/teachany-skill.git ~/.agents/skills/teachany
```

Then talk to your AI:

> "用 TeachAny 给我做一节《一次函数的图像》的八年级数学课"
>
> "Use TeachAny to build an interactive lesson on photosynthesis for Grade 7 biology"

详细安装与首次验证：[INSTALL.md](./INSTALL.md)

## 📦 What's inside

```
teachany-skill/
├── SKILL.md              🧠 AI 读的英文规范（171KB, ~4500 行）
├── SKILL_CN.md           🧠 AI 读的中文规范（405KB, 完整版）
├── scripts/              🔧 15 个工具脚本
│   ├── find_nodes.py        # 按 stage+subject+keyword 查知识树节点
│   ├── check_baseline.sh    # 课件基线自检（TTS/图/章节/文件）
│   ├── check_images.sh      # 图片资源完整性
│   ├── publish_course.sh    # 一键发布到 TeachAny 社区（v7.9.4）
│   ├── generate-tts.py      # TTS 语音合成
│   ├── check_map_resources.sh / install_map_resources.sh
│   ├── build_chgis_dynasty_maps_v2.sh / rebuild_china_maps.py
│   │                        # 历史朝代地图生成
│   └── ...
├── templates/            📋 3 套 HTML 课件骨架
│   ├── course-skeleton.html     # 标准课件模板
│   ├── example-tang-dynasty.html # 历史课件样板
│   └── map-section-template.html # 地图章节模板
├── assets/               🗺️ 43MB 教学资源
│   ├── historical-china/ # 中国历代疆域 GeoJSON（基于 CHGIS）
│   ├── historical-world/ # 世界历史分期 GeoJSON
│   ├── hillshade/        # 3D 地形底图
│   └── timelines/        # 历史时间线数据
└── *.md                  📚 专题指南
    ├── historical-maps.md         # 历史课件做法
    ├── map-resources-guide.md     # 地图资源使用
    ├── terrain-3d-integration.md  # 3D 地形集成
    └── pptx-design-guide.md       # PPT 设计风格迁移
```

## ✨ Features

### 🎯 教学设计优先（不是技术优先）

SKILL 不教 AI 写漂亮页面，而是教 AI 想清楚：

- **这节课学生要学什么？** → 挂载到真实知识树节点（2500+ K-12 节点库）
- **学生的认知负荷怎么管理？** → 8 个标准 section 覆盖 ≥5
- **怎么判断学生学会了？** → 必须有交互评估，不只是读文字
- **前置知识衔接了吗？** → 课件末尾必须给前置/后续章节

### 🛡️ 硬质量门槛（防劣质课件）

每次发布前强制自检：

| 指标 | 门槛 |
|:---|:---|
| TTS 语音段数 | ≥ 5 |
| 配图数量 | ≥ 3 |
| 章节数 | ≥ 5 |
| 资源文件总数 | ≥ 8 |
| 节点 ID 有效性 | 必须在知识树中存在（不许编） |

### 🌍 学科覆盖

- **数学** · 一次函数、二次函数、几何、概率……
- **物理** · 欧姆定律、压强、运动学……
- **化学** · 反应原理、物质分类、元素周期……
- **生物** · 遗传变异、细胞、生态系统……
- **历史** · 中国朝代 + 世界史（配套 42MB 历史地图）
- **地理** · 地形、气候、人文（配 3D 地形）
- **语文 / 英语** · 古诗、文言文、拼音、语法……
- **信息技术 / 科学** · 算法、数据、物理探究……

### 🔗 一键社区发布（可选）

配套 TeachAny 社区 (`github.com/weponusa/teachany`) 发布链路：
`本地 baseline PASS → Worker API → PR 自动合并 → Pages 部署 → URL 200 自检`

完全零配置：用户不需要 GitHub Token，token 在服务端。

## 🧭 Design Principles（给 AI 看的硬规则）

SKILL 文档里对 AI 设置了 40+ 条硬规则，最关键的几条：

1. **做课前先找节点**，不许编 node_id（`find_nodes.py` 强制先查）
2. **HTML title 必须含学段学科版本**：`《课件名》· 小学语文 G1 · TeachAny v6.8`
3. **manifest.grade 与 node_id 前缀必须一致**，否则挂错树
4. **同一节点最多 1 份官方课件**（社区课件可多份并按点赞排序）
5. **发布后 URL 必须 200 才算完成**，不许用"缓存延迟"糊弄（18 条禁止话术）

完整规则见 [SKILL_CN.md](./SKILL_CN.md) Section 5 · 硬规则清单。

## 📊 Stats

- **源文件**：74 个
- **脚本**：15 个（bash + python）
- **模板**：3 套 HTML 骨架
- **教学资源**：43MB（含 CHGIS 历史地图、Natural Earth 地理数据）
- **文档体量**：SKILL.md 171KB + SKILL_CN.md 405KB，合计约 15 万字

## 🤝 Contributing

欢迎：

- 提 Issue 报告 AI 按 skill 做课件时的问题
- 提 PR 补充新学科的规范细节
- 贡献新模板（templates/）
- 补充资源数据集（assets/）

目前维护重点：K-12 全学科覆盖、跨 AI Agent 兼容性、零配置发布链路。

## 📜 License

- **代码与文档**：MIT License
- **教学资源**：基于 CHGIS（CC-BY 4.0）、Natural Earth（Public Domain）等开源数据集加工，使用时请保留原始数据集署名。详见 [LICENSE](./LICENSE) 第二部分。

## 🔗 Related Projects

- **[weponusa/teachany](https://github.com/weponusa/teachany)** — TeachAny Skill 制作器核心
- **[weponusa/teachany-courseware](https://github.com/weponusa/teachany-courseware)** — TeachAny 课件站点 + 社区课件库
- **Live Gallery** — [weponusa.github.io/teachany-courseware](https://weponusa.github.io/teachany-courseware/)

---

<p align="center">
  <sub>Made with ☕ by weponusa · Every teacher, every parent — your own AI teaching assistant.</sub>
</p>
