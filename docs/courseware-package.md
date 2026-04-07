# 📦 TeachAny 课件包格式规范（Courseware Package Spec）

## 概述

`.teachany` 课件包是一个标准 ZIP 压缩文件（扩展名为 `.teachany`），用于在 TeachAny 平台中导入、分发和管理用户自制课件。

## 文件结构

```
my-course.teachany          ← ZIP 压缩，扩展名 .teachany
├── manifest.json           ← 必须：课件元信息
├── index.html              ← 必须：主课件文件
├── index_en.html           ← 可选：英文版课件
├── README.md               ← 可选：课件说明
├── thumbnail.png           ← 可选：缩略图（推荐 600×400）
└── assets/                 ← 可选：音视频等资源
    ├── *.mp3
    ├── *.mp4
    └── *.wav
```

## manifest.json Schema

```jsonc
{
  // === 必填字段 ===
  "name": "一次函数与正比例函数",         // 课件中文名
  "name_en": "Linear Functions",          // 课件英文名
  "subject": "math",                       // 学科 ID（见下方枚举）
  "grade": 8,                              // 适用年级（1-12）
  "author": "weponusa",                    // 作者 ID 或名称
  "version": "1.0.0",                      // 语义化版本号

  // === 知识图谱关联（可选但推荐）===
  "node_id": "linear-function",            // 对应知识树节点 ID
  "domain": "function",                    // 所属领域 ID
  "prerequisites": [                        // 前置知识节点 ID
    "proportional-function",
    "coordinate-system"
  ],

  // === 展示信息 ===
  "description": "从正比例函数到一次函数的完整教学...",  // 简介（150字内）
  "description_en": "Complete interactive courseware...",
  "emoji": "📏",                            // 展示用 emoji
  "tags": ["Math", "Grade 8", "Sliders"],  // 标签列表
  "difficulty": 3,                          // 难度 1-5
  "duration": "35 min",                     // 预计学习时长
  "lines": "1100+",                         // 代码行数（展示用）

  // === 教学设计元信息（可选）===
  "theories": [                             // 使用的教学理论
    "ABT Narrative",
    "Bloom's Taxonomy",
    "Cognitive Load Theory"
  ],
  "interactions": [                         // 互动类型
    "Canvas",
    "Sliders",
    "Quiz"
  ],

  // === 课件包元信息 ===
  "created": "2026-04-07",                  // 创建日期
  "license": "MIT",                         // 许可证
  "teachany_spec": "1.0"                    // 课件包规范版本
}
```

## 学科 ID 枚举

| ID | 中文名 | Emoji |
|:---|:---|:---|
| `math` | 数学 | 📐 |
| `physics` | 物理 | ⚡ |
| `chemistry` | 化学 | 🧪 |
| `biology` | 生物 | 🧬 |
| `geography` | 地理 | 🌍 |
| `history` | 历史 | 📜 |
| `chinese` | 语文 | 📖 |
| `english` | 英语 | 🌐 |
| `it` | 信息技术 | 💻 |

## 打包方式

### 方式一：使用打包脚本（推荐）

```bash
# 在课件目录下运行
node scripts/pack-courseware.cjs ./examples/math-linear-function

# 输出：math-linear-function.teachany
```

### 方式二：手动打包

```bash
cd examples/math-linear-function
zip -r ../../math-linear-function.teachany manifest.json index.html index_en.html README.md
```

### 方式三：AI 生成时自动打包

在 TeachAny Skill 中，AI 完成课件生成后，自动执行打包命令。详见 Skill 文档「课件打包」章节。

## 从 HTML meta 标签自动生成 manifest.json

TeachAny 的 `index.html` 已包含标准 meta 标签：

```html
<meta name="teachany-node" content="linear-function">
<meta name="teachany-subject" content="math">
<meta name="teachany-domain" content="function">
<meta name="teachany-grade" content="8">
<meta name="teachany-prerequisites" content="proportional-function">
<meta name="teachany-difficulty" content="3">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">
```

打包脚本会自动读取这些 meta 标签并生成 `manifest.json`。

## 导入验证规则

导入 `.teachany` 包时，平台会执行以下验证：

1. ✅ 必须包含 `manifest.json`
2. ✅ 必须包含 `index.html`
3. ✅ `manifest.json` 中 `name`、`subject`、`grade` 必填
4. ✅ `subject` 必须是合法的学科 ID
5. ✅ `grade` 必须在 1-12 范围
6. ✅ 单个包总大小不超过 50MB
7. ⚠️ 若指定 `node_id`，校验是否与已有知识树节点匹配

## 版本信息

- 规范版本：1.0
- 创建日期：2026-04-07
