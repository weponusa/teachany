---
name: TeachAny-Admin
description: "TeachAny 课件管理员技能。当管理员需要生成示范课件并推送到官方 Gallery、批量打包发布课件、校验课件质量、更新课件注册表时触发。适用于 TeachAny 开源项目的课件全生命周期管理：生成 → 校验 → 打包 → 发布 → 推送。"
---

# TeachAny Admin（教我学·管理员版）：课件生成与发布管理技能

面向 TeachAny 开源项目管理员的一站式课件管理技能。核心能力：**一句话指令，从课件生成到上线 Gallery 全自动完成**。

本技能适用于：
- 生成新的示范课件并推送到官方仓库
- 批量打包、校验、发布已有课件
- 更新 courseware-registry.json 注册表
- 管理 GitHub Releases 和 .teachany 分发包
- 课件质量审查与修复

**核心原则**：先保证课件教学质量（调用 TeachAny 基础版），再确保工程质量（校验+打包+发布），最后一键推送上线。

---

## 一、何时使用

当管理员提出以下需求时应优先使用本技能：
- "帮我制作一个 XX 的示范课件并推送"
- "打包/发布 examples 下的课件到 GitHub"
- "校验一下 XX 课件的质量"
- "更新课件注册表"
- "把新课件添加到 Gallery"
- "批量重新打包所有课件"

**与 TeachAny 基础版的分工**：
- 课件**教学设计与 HTML 生成**能力，完全继承 TeachAny 基础版（v5.10+）
- 本技能专注于**生成后的工程链路**：校验 → 打包 → 注册 → 发布 → 推送

---

## 二、项目结构速查

管理员必须了解的核心文件和目录：

```
teachany-opensource/
├── examples/                          # 官方示范课件目录
│   ├── math-linear-function/          #   ├─ 一次函数
│   ├── math-quadratic-function/       #   ├─ 二次函数
│   ├── math-congruent-triangles/      #   ├─ 全等三角形
│   ├── bio-photosynthesis/            #   ├─ 光合作用
│   ├── bio-meiosis/                   #   ├─ 减数分裂
│   ├── geo-monsoon/                   #   ├─ 全球季风
│   ├── phy-pressure-buoyancy/         #   ├─ 液体压强与浮力
│   ├── phy-ohms-law/                  #   ├─ 欧姆定律
│   ├── chn-compound-vowel/            #   ├─ 复韵母乐园
│   └── _template/                     #   └─ 课件 HTML 模板
├── dist/                              # .teachany 打包输出目录
├── scripts/
│   ├── bootstrap-courseware.cjs        # 知识层启动器（Phase 0.5）
│   ├── validate-courseware.cjs         # 课件完整性校验器（18 项）
│   ├── pack-courseware.cjs             # 课件打包工具（→ .teachany）
│   ├── publish-courseware.cjs          # GitHub Releases 发布工具
│   └── registry-loader.js             # Gallery 动态加载器
├── courseware-registry.json            # 课件注册表（Gallery 数据源）
├── skillhub-package/
│   ├── SKILL.md                        # TeachAny 基础版技能定义
│   └── references/data/               # 知识层数据（9 学科）
├── admin-skillhub-package/
│   ├── SKILL.md                        # 本文件（管理员版技能定义）
│   └── README.md
├── .github/workflows/
│   ├── admin-promote.yml               # 社区课件提升为官方
│   ├── community-publish.yml           # 社区课件发布
│   ├── community-submit.yml            # 社区课件提交
│   └── validate.yml                    # 自动校验
└── index.html                          # Gallery 页面
```

---

## 三、课件 ID 命名规范

每个示范课件的目录名即为课件 ID，必须遵循以下命名规则：

| 规则 | 格式 | 示例 |
|:---|:---|:---|
| 学科前缀 | `{subject}-` | `math-`, `phy-`, `bio-`, `geo-`, `chn-`, `eng-`, `his-`, `chem-`, `it-` |
| 知识点简称 | 英文小写，连字符分隔 | `linear-function`, `ohms-law`, `photosynthesis` |
| 完整格式 | `{subject}-{topic}` | `math-linear-function`, `phy-ohms-law` |

**学科前缀映射表**：

| 学科 | 前缀 | 学科 | 前缀 |
|:---|:---|:---|:---|
| 数学 | `math-` | 物理 | `phy-` |
| 化学 | `chem-` | 生物 | `bio-` |
| 地理 | `geo-` | 历史 | `his-` |
| 语文 | `chn-` | 英语 | `eng-` |
| 信息技术 | `it-` | | |

---

## 四、完整管理流水线（6 阶段）

管理员从"一句话"到"课件上线"的完整流程：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TeachAny Admin 管理流水线                         │
│                                                                     │
│  P0 准备 ──→ P1 生成 ──→ P2 校验 ──→ P3 打包 ──→ P4 注册 ──→ P5 发布 ──→ P6 推送  │
│  环境检查     课件HTML     质量门禁     .teachany    Registry    Releases   Git Push │
│                                                                     │
│  可选入口：                                                          │
│  • 从 P0 开始：完整流程（生成新课件）                                   │
│  • 从 P2 开始：对已有课件重新校验/打包/发布                              │
│  • 从 P3 开始：仅打包/发布（跳过校验）                                  │
│  • 从 P5 开始：仅发布到 GitHub Releases                               │
│  • 单独 P2：仅校验                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.0 P0：环境准备

在开始任何操作前，检查以下前置条件：

```
AI 自检清单：
□ 1. 确认工作目录：cd 到 teachany-opensource 根目录
□ 2. 确认 Node.js 可用：node --version
□ 3. 确认 GITHUB_TOKEN（发布时需要）：echo $GITHUB_TOKEN | head -c 4
□ 4. 确认 Git 状态干净或可接受：git status
□ 5. 确认目标课件 ID 不与已有课件冲突
```

**环境变量要求**：

| 变量 | 用途 | 何时必需 |
|:---|:---|:---|
| `GITHUB_TOKEN` | GitHub API 认证，创建 Release 和上传 Asset | P5 发布阶段 |

**如果 GITHUB_TOKEN 不存在**：
- P0~P4（生成、校验、打包、注册）可以正常执行
- P5 发布会失败，提示管理员设置 Token
- P6 推送（git push）仍可执行，代码变更会推送但 Release 不会创建

---

### 4.1 P1：课件生成

**调用 TeachAny 基础版技能**生成课件。管理员版不重新定义课件生成逻辑，而是直接引用基础版的全部教学设计能力。

#### 4.1.1 完整生成流程

```
Step 1: 运行知识层启动器
  $ node scripts/bootstrap-courseware.cjs --topic "知识点" --subject 学科 --grade 年级
  → 输出 output/_context.json

Step 2: 读取上下文
  → read_file output/_context.json

Step 3: 调用 TeachAny 基础版生成课件
  → 按照 TeachAny SKILL.md 的 Phase 1~3 流程生成 HTML 课件
  → 输出目标目录：examples/{course-id}/

Step 4: 生成双语版本（用户要求时）
  → index.html（中文版）；用户要求双语时加 index_en.html（英文版）

Step 5: 生成 README.md
  → 课件说明文件，包含学科、年级、知识点、互动类型等信息
```

#### 4.1.2 课件目录结构要求

生成完成后，课件目录应包含：

```
examples/{course-id}/
├── index.html          # 中文版课件（必需）
├── index_en.html       # 英文版课件（用户要求双语时生成）
├── manifest.json       # 课件元信息（打包时自动生成）
├── README.md           # 课件说明
├── *.mp3               # TTS 语音文件（如有）
├── *.mp4               # 视频文件（如有）
└── *.png / *.jpg       # 图片资源（如有）
```

#### 4.1.3 HTML Meta 标签要求

课件 `index.html` 的 `<head>` 中必须包含以下 meta 标签：

```html
<meta name="teachany-node" content="知识点ID">
<meta name="teachany-subject" content="学科">
<meta name="teachany-domain" content="领域">
<meta name="teachany-grade" content="年级">
<meta name="teachany-prerequisites" content="前置知识ID1,前置知识ID2">
<meta name="teachany-difficulty" content="1-5">
<meta name="teachany-version" content="1.0">
<meta name="teachany-author" content="weponusa">
```

---

### 4.2 P2：质量校验

使用 `validate-courseware.cjs` 对课件进行 22 项 Completeness Gate 自动化校验。

#### 4.2.1 执行校验

```bash
# 校验单个课件
node scripts/validate-courseware.cjs ./examples/{course-id}

# 带修复建议的校验
node scripts/validate-courseware.cjs ./examples/{course-id} --fix-hints

# 输出 JSON 格式（程序可读）
node scripts/validate-courseware.cjs ./examples/{course-id} --json
```

#### 4.2.2 校验项清单（22 项）

| ID | 校验项 | 说明 | 通过标准 |
|:---|:---|:---|:---|
| #01 | ABT + 情境引入 | 每个模块有"为什么学"叙事 | 检测到 ABT 关键词 |
| #02 | 前测存在 | 有前置知识检测题 | 检测到 pretest 模块 |
| #03 | 互动练习 | 每个知识点配互动练习 | ≥3 组互动元素 |
| #04 | 诊断性反馈 | 错误反馈含具体错因 | 检测到错因诊断内容 |
| #05 | 后测与学习闭环 | 前后测形成闭环 | 检测到 posttest 模块 |
| #06 | Bloom 层级覆盖 | 练习覆盖 ≥3 个 Bloom 层级 | ≥3 层 |
| #07 | 知识图谱溯源 | 核心内容可追溯 | teachany-node + teachany-subject |
| #08 | 五镜头深层理解 | 有深层理解模块 | 检测到深层理解内容 |
| #09 | 卡片文字密度 | 单卡片 ≤200 字 | 无超长卡片 |
| #10 | 三段式作业分层 | 有分层练习设计 | 检测到分层标记 |
| #11 | 前置知识链 | meta 声明 prerequisites | 有 teachany-prerequisites |
| #12 | 真实场景应用 | 有生活化情境 | 检测到真实场景词汇 |
| #13 | Meta 标签完整性 | 必需 meta 标签齐全 | 4 个必需标签全部存在 |
| #14 | AI 多模态互动区 | 文科课题含 AI 互动区 | 文科有/理科跳过 |
| #15 | 双语版本 | 用户要求时有 index_en.html | 文件存在（用户未要求时可 N/A） |
| #16 | 课件打包 | 有 manifest.json | 文件存在 |
| #17 | 记忆锚点 | 有口诀/类比/助记 | 检测到记忆辅助内容 |
| #18 | 易错点覆盖 | 融入高频易错点 | 检测到易错点内容 |
| #19 | 知识图谱可视化 | 有 `#knowledge-graph` section + `knowledgeGraphData` | 检测到图谱 section 和数据注入 |
| #20 | 视频嵌入规范 | 所有视频使用 `<video>` 标签 | 无仅用 JS 创建的视频；有视频时必有 `.video-player` 容器 |
| #21 | 音频播放器 UI | L3 音频有底部控制条+滚动自动播放 | 检测到 `audioPlaylist`（含 `sectionId`）注入和 `.audio-bar` |
| #22 | 版式一致性 | 使用标准 HTML 骨架模板 | Sticky 导航 + 进度条 + 必选 section 齐全 |

#### 4.2.3 质量门禁策略

| 通过率 | 管理员操作 |
|:---|:---|
| **22/22** | ✅ 直接进入 P3 打包 |
| **18-21/22** | ⚠️ 查看 --fix-hints，修复关键项后重新校验 |
| **< 18/22** | ❌ 必须修复至 ≥18 项通过才能继续 |

**强制通过项**（不通过则阻断）：
- #07 知识图谱溯源（Meta 标签）
- #13 Meta 标签完整性
- #19 知识图谱可视化
- 课件必须能正常在浏览器中打开

---

### 4.3 P3：打包

使用 `pack-courseware.cjs` 将课件目录打包为 `.teachany` 文件。

#### 4.3.1 执行打包

```bash
# 打包单个课件
node scripts/pack-courseware.cjs ./examples/{course-id} ./dist

# 打包后检查
ls -la ./dist/{course-id}.teachany
```

#### 4.3.2 打包做了什么

1. 检查 `index.html` 存在
2. 检查或自动生成 `manifest.json`（从 HTML meta 标签提取）
3. 验证 manifest 必填字段（name, subject, grade）
4. 使用系统 `zip` 命令打包目录为 `.teachany` 文件
5. 检查文件大小（警告 > 50MB）

#### 4.3.3 manifest.json 格式

如果目录中没有 `manifest.json`，打包脚本会自动从 `index.html` 的 meta 标签生成。格式如下：

```json
{
  "name": "课件名称",
  "name_en": "",
  "subject": "math",
  "grade": 8,
  "author": "weponusa",
  "version": "1.0.0",
  "node_id": "知识点ID",
  "domain": "领域",
  "prerequisites": ["前置知识ID"],
  "description": "课件描述",
  "emoji": "📐",
  "tags": ["Math", "Grade 8"],
  "difficulty": 3,
  "duration": "",
  "lines": "1,000+",
  "theories": [],
  "interactions": [],
  "created": "2026-04-10",
  "license": "MIT",
  "teachany_spec": "1.0"
}
```

---

### 4.4 P4：注册

更新 `courseware-registry.json`，添加新课件条目。

#### 4.4.1 Registry 结构

```json
{
  "version": "1.0",
  "updated_at": "2026-04-10T12:00:00.000Z",
  "repo": "weponusa/teachany",
  "releases_base": "https://github.com/weponusa/teachany/releases/download",
  "examples_base": "./examples",
  "courses": [
    {
      "id": "课件ID",
      "node_id": "知识点ID",
      "name": "课件名称",
      "name_en": "English Name",
      "subject": "学科",
      "grade": 8,
      "domain": "领域",
      "emoji": "📐",
      "description": "English description",
      "description_zh": "中文描述",
      "author": "weponusa",
      "version": "1.0",
      "difficulty": 3,
      "tags": ["Math", "Grade 8", "Canvas"],
      "tag_colors": ["tag-blue", "tag-purple", "tag-green"],
      "lines": "1,000+",
      "duration": "~35 min",
      "prerequisites": ["前置知识ID"],
      "theories": ["ABT Narrative", "Bloom's Taxonomy"],
      "interactions": ["Canvas", "Slider", "Quiz"],
      "has_tts": false,
      "has_video": false,
      "has_en": false,
      "file_count": 10,
      "source": "releases",
      "local_path": "课件ID",
      "download_url": "",
      "release_tag": "",
      "created": "2026-04-10",
      "updated": "2026-04-10"
    }
  ]
}
```

#### 4.4.2 手动注册流程

当需要手动更新 Registry 时（而非通过 publish-courseware.cjs 自动更新），AI 应：

1. `read_file` 读取 `courseware-registry.json`
2. 在 `courses` 数组末尾添加新课件条目
3. 更新 `updated_at` 为当前时间
4. 写回文件

**字段计算规则**：

| 字段 | 计算方式 |
|:---|:---|
| `id` | 课件目录名（如 `math-linear-function`） |
| `node_id` | 从 `<meta name="teachany-node">` 提取 |
| `file_count` | 课件目录下的文件数量 |
| `lines` | `index.html` 行数向下取整百 + "+" |
| `has_tts` | 目录中是否有 .mp3 文件 |
| `has_video` | 目录中是否有 .mp4 文件 |
| `has_en` | 目录中是否有 index_en.html |
| `tag_colors` | 固定映射：Math→tag-blue, Physics→tag-yellow, Biology→tag-green/tag-pink, Geography→tag-cyan, Chinese→tag-pink, English→tag-blue, History→tag-orange, Chemistry→tag-red, IT→tag-purple |

---

### 4.5 P5：发布到 GitHub Releases

使用 `publish-courseware.cjs` 将 `.teachany` 文件上传到 GitHub Releases。

#### 4.5.1 执行发布

```bash
# 发布单个课件
node scripts/publish-courseware.cjs ./examples/{course-id}

# 发布所有课件
node scripts/publish-courseware.cjs --all

# 指定 Release tag
node scripts/publish-courseware.cjs --all --tag courseware-v20260410

# 仅打包不上传（Dry Run）
node scripts/publish-courseware.cjs --all --dry-run

# 使用指定 Token
node scripts/publish-courseware.cjs --all --token ghp_xxxxxxxxxxxx
```

#### 4.5.2 发布做了什么

1. 调用 `pack-courseware.cjs` 打包课件
2. 通过 GitHub API 获取或创建 Release
3. 删除同名旧 Asset（如果存在）
4. 上传 `.teachany` 文件作为 Release Asset
5. 自动更新 `courseware-registry.json` 中的 `download_url` 和 `release_tag`

#### 4.5.3 默认 Tag 格式

如果不指定 `--tag`，默认生成格式为：`courseware-vYYYYMMDD`（如 `courseware-v20260410`）

#### 4.5.4 发布失败处理

| 错误 | 原因 | 解决方案 |
|:---|:---|:---|
| 401 Unauthorized | Token 无效或过期 | 重新生成 GITHUB_TOKEN |
| 403 Forbidden | Token 权限不足 | 确保 Token 有 `repo` 权限 |
| 422 Validation Failed | Release tag 已存在冲突 | 使用 `--tag` 指定新 tag |
| 上传超时 | 文件过大 | 检查课件资源，压缩 mp3/mp4 |

---

### 4.6 P6：Git 推送

将所有变更推送到 GitHub 远程仓库。

#### 4.6.1 标准推送流程

```bash
# 进入仓库目录
cd /path/to/teachany-opensource

# 查看变更
git status
git diff --stat

# 添加所有变更
git add -A

# 提交（使用标准化 commit message）
git commit -m "[admin] Add {course-name} courseware

- Generated interactive HTML courseware for {subject} grade {grade}
- Passed {n}/22 Completeness Gate checks
- Packed to dist/{course-id}.teachany
- Updated courseware-registry.json
- Published to GitHub Releases ({release-tag})"

# 推送
git push origin main
```

#### 4.6.2 Commit Message 模板

根据操作类型使用不同的 commit message：

| 操作 | 模板 |
|:---|:---|
| 新增课件 | `[admin] Add {课件名} courseware` |
| 更新课件 | `[admin] Update {课件名} to v{版本}` |
| 批量发布 | `[admin] Publish {n} coursewares to Releases ({tag})` |
| 仅更新 Registry | `[admin] Update courseware-registry.json` |
| 修复课件 | `[admin] Fix {课件名}: {修复内容}` |

---

## 五、快捷指令表

管理员常用指令与对应操作的映射：

| 管理员说 | AI 执行阶段 | 关键命令 |
|:---|:---|:---|
| "制作并推送 XX 课件" | P0→P1→P2→P3→P4→P5→P6 | 全流程 |
| "制作 XX 课件"（不推送） | P0→P1 | bootstrap + 生成 HTML |
| "校验 XX 课件" | P2 | `validate-courseware.cjs` |
| "打包 XX 课件" | P3 | `pack-courseware.cjs` |
| "发布所有课件" | P3→P5 | `publish-courseware.cjs --all` |
| "更新注册表" | P4 | 编辑 `courseware-registry.json` |
| "推送到 GitHub" | P6 | `git add -A && git commit && git push` |
| "重新打包发布 XX" | P3→P5 | pack + publish 单个 |
| "查看 Gallery 状态" | - | 读取 `courseware-registry.json` |
| "查看已有课件列表" | - | 读取 `courseware-registry.json` 的 courses 数组 |

---

## 六、批量操作

### 6.1 批量打包所有课件

```bash
# 使用 publish 脚本的 dry-run 模式（仅打包不上传）
node scripts/publish-courseware.cjs --all --dry-run
```

### 6.2 批量发布所有课件

```bash
# 发布 examples/ 下所有课件到 GitHub Releases
node scripts/publish-courseware.cjs --all --tag courseware-v$(date +%Y%m%d)
```

### 6.3 批量校验所有课件

AI 应遍历 `examples/` 下所有子目录（排除 `_template`），逐一执行校验：

```bash
for dir in examples/*/; do
  if [ -f "$dir/index.html" ] && [ "$(basename $dir)" != "_template" ]; then
    echo "========== $(basename $dir) =========="
    node scripts/validate-courseware.cjs "$dir" --fix-hints
    echo ""
  fi
done
```

### 6.4 批量更新 Registry

当需要根据 `examples/` 目录内容重新生成完整的 `courseware-registry.json` 时，AI 应：

1. 遍历 `examples/` 下所有课件目录
2. 读取每个课件的 `manifest.json` 或 `index.html` meta 标签
3. 构建 courses 数组
4. 写入 `courseware-registry.json`

---

## 七、已有课件库（当前 9 个示范课件）

| 课件 ID | 名称 | 学科 | 年级 | TTS | 视频 | 英文版 |
|:---|:---|:---|:---|:---:|:---:|:---:|
| `math-quadratic-function` | 二次函数 | 数学 | 九年级 | ✅ | ✅ | ❌ |
| `math-linear-function` | 一次函数 | 数学 | 八年级 | ❌ | ✅ | ✅ |
| `math-congruent-triangles` | 全等三角形 | 数学 | 八年级 | ✅ | ❌ | ❌ |
| `bio-photosynthesis` | 光合作用 | 生物 | 七年级 | ✅ | ❌ | ❌ |
| `bio-meiosis` | 减数分裂 | 生物 | 高一 | ❌ | ✅ | ✅ |
| `geo-monsoon` | 全球季风 | 地理 | 高一 | ✅ | ❌ | ❌ |
| `phy-pressure-buoyancy` | 液体压强与浮力 | 物理 | 八年级 | ❌ | ❌ | ❌ |
| `phy-ohms-law` | 欧姆定律 | 物理 | 九年级 | ✅ | ❌ | ❌ |
| `chn-compound-vowel` | 复韵母乐园 | 语文 | 一年级 | ❌ | ❌ | ❌ |

---

## 八、高级操作

### 8.1 课件替换（更新旧版本）

当需要用新版本替换已有课件时：

1. 在 `examples/{course-id}/` 中生成新版课件，覆盖旧文件
2. 更新 `index.html` 中的 `teachany-version` meta 标签
3. 更新 `manifest.json` 中的 version 字段
4. 执行 P2→P3→P5→P6（校验→打包→发布→推送）
5. Registry 中的 `download_url` 会被 publish 脚本自动更新

### 8.2 课件删除

```bash
# 1. 删除课件目录
rm -rf examples/{course-id}

# 2. 删除打包文件
rm -f dist/{course-id}.teachany

# 3. 从 courseware-registry.json 中删除对应条目
#    AI 编辑 JSON 文件，移除 courses 数组中 id 匹配的条目

# 4. 提交推送
git add -A
git commit -m "[admin] Remove {课件名} courseware"
git push origin main
```

### 8.3 从知识层生成新课件

完整命令链：

```bash
# Step 1: 启动知识层
node scripts/bootstrap-courseware.cjs --topic "勾股定理" --subject math --grade 8

# Step 2: AI 读取上下文并生成课件
# → read_file output/_context.json
# → 按 TeachAny SKILL.md 生成 examples/math-pythagorean-theorem/index.html

# Step 3: 校验
node scripts/validate-courseware.cjs ./examples/math-pythagorean-theorem --fix-hints

# Step 4: 打包 + 发布
node scripts/publish-courseware.cjs ./examples/math-pythagorean-theorem

# Step 5: Git 推送
git add -A
git commit -m "[admin] Add 勾股定理 courseware"
git push origin main
```

### 8.4 社区课件提升为官方

社区课件通过 GitHub Actions workflow (`admin-promote.yml`) 自动提升。管理员只需：

1. 在社区提交的 PR 上添加 `promote-to-official` 标签
2. 合并 PR
3. GitHub Actions 自动执行：
   - 解压 .teachany 到 `examples/`
   - 更新知识树
   - 更新 ratings.json
   - 清理 `community/pending/`
   - 提交并推送

---

## 九、工具脚本速查

### 9.1 bootstrap-courseware.cjs

```
用途：知识层数据提取，生成 _context.json
命令：node scripts/bootstrap-courseware.cjs --topic "主题" --subject 学科 --grade 年级
输出：./output/_context.json
```

### 9.2 validate-courseware.cjs

```
用途：课件完整性校验（22 项 Completeness Gate）
命令：node scripts/validate-courseware.cjs <课件目录> [--fix-hints] [--json]
返回：0=全部通过, 1=有未通过, 2=致命错误
```

### 9.3 pack-courseware.cjs

```
用途：课件打包为 .teachany 文件（ZIP 格式）
命令：node scripts/pack-courseware.cjs <课件目录> [输出目录]
输出：{输出目录}/{课件ID}.teachany
```

### 9.4 publish-courseware.cjs

```
用途：打包 + 上传到 GitHub Releases + 更新 Registry
命令：node scripts/publish-courseware.cjs <课件目录> [--tag <tag>] [--token <token>]
      node scripts/publish-courseware.cjs --all [--dry-run]
环境：GITHUB_TOKEN 必需
```

### 9.5 registry-loader.js

```
用途：Gallery 页面动态加载课件列表（前端 JS）
说明：读取 courseware-registry.json，渲染课件卡片
无需管理员手动调用
```

---

## 十、硬规则

以下规则在任何操作中均不可违反：

1. **课件 ID 不可重复**：新课件的目录名/ID 不得与 `courseware-registry.json` 中已有的 ID 冲突。
2. **Meta 标签完整**：所有课件的 `index.html` 必须包含 `teachany-node`、`teachany-subject`、`teachany-grade`、`teachany-version` 四个必需 meta 标签。
3. **校验优先**：在打包（P3）前必须至少执行一次校验（P2），除非管理员明确跳过。
4. **Token 安全**：永远不在 commit message、日志输出或文件中暴露 GITHUB_TOKEN 的完整值。
5. **先 commit 再 push**：不允许未 commit 就 push，不允许 force push。
6. **Registry 一致性**：`courseware-registry.json` 中的 courses 条目必须与 `examples/` 目录下的实际课件一一对应。如发现不一致，应主动提示管理员。
7. **打包前清理**：打包前检查课件目录中是否有 `node_modules`、`.DS_Store`、`__pycache__` 等不应打包的文件，如有则跳过（pack 脚本已处理隐藏文件）。
8. **版本号递增**：更新已有课件时，`teachany-version` 和 manifest 中的 version 必须递增，不得回退。
9. **单一来源**：课件注册信息以 `courseware-registry.json` 为唯一权威数据源。Gallery、知识树、Release 页面均从此文件派生。
10. **Git 仓库隔离**：`teachany-opensource` 是独立 Git 仓库（有自己的 `.git`），所有 Git 操作必须在此仓库内执行，不要在外层仓库操作。

---

## 十一、故障排查

### 11.1 常见问题

| 问题 | 可能原因 | 解决方案 |
|:---|:---|:---|
| `zip: command not found` | 系统未安装 zip | macOS 默认有；Linux: `sudo apt install zip` |
| `GITHUB_TOKEN 未设置` | 环境变量缺失 | `export GITHUB_TOKEN=ghp_xxx` |
| `publish 上传失败 413` | 文件过大 | 压缩音视频资源，检查 mp3/mp4 码率 |
| `Registry 中找不到课件` | ID 不在 courses 数组中 | 手动添加条目或重新 publish |
| `validate 全部失败` | index.html 路径错误 | 确认课件目录路径正确 |
| `git push rejected` | 远程有新提交 | `git pull --rebase` 后重新 push |
| `pack 失败: 缺少 index.html` | 目录结构不正确 | 确认课件根目录有 index.html |

### 11.2 日志查看

所有脚本的输出都包含 emoji 前缀的结构化日志：

| 前缀 | 含义 |
|:---|:---|
| ✅ | 成功 |
| ❌ | 失败/错误 |
| ⚠️ | 警告 |
| 📦 | 打包操作 |
| ⬆️ | 上传操作 |
| 🔍 | 搜索/查找 |
| 📌 | Release 操作 |

---

## 十二、完整操作示例

### 示例 A：创建并推送新课件

管理员："帮我制作一个勾股定理（八年级数学）的示范课件并推送到官方 Gallery"

AI 执行流程：

```
1. [P0] 确认环境
   $ cd /path/to/teachany-opensource
   $ node --version → v20.x
   $ echo $GITHUB_TOKEN | head -c 4 → ghp_

2. [P1] 生成课件
   $ node scripts/bootstrap-courseware.cjs --topic "勾股定理" --subject math --grade 8
   → 读取 output/_context.json
   → 生成 examples/math-pythagorean-theorem/index.html
   → 生成 examples/math-pythagorean-theorem/index_en.html
   → 生成 examples/math-pythagorean-theorem/README.md

3. [P2] 校验
   $ node scripts/validate-courseware.cjs ./examples/math-pythagorean-theorem --fix-hints
   → 18/18 通过 ✅

4. [P3+P5] 打包+发布
   $ node scripts/publish-courseware.cjs ./examples/math-pythagorean-theorem
   → 打包为 dist/math-pythagorean-theorem.teachany
   → 上传到 GitHub Releases
   → 更新 courseware-registry.json

5. [P6] 推送
   $ git add -A
   $ git commit -m "[admin] Add 勾股定理 courseware"
   $ git push origin main
```

### 示例 B：批量重新发布

管理员："把所有课件重新打包发布"

```
1. [P0] 确认环境
2. [P3+P5] 批量发布
   $ node scripts/publish-courseware.cjs --all --tag courseware-v20260410
   → 发现 9 个课件
   → 逐一打包、上传、更新 Registry
3. [P6] 推送
   $ git add -A
   $ git commit -m "[admin] Publish 9 coursewares to Releases (courseware-v20260410)"
   $ git push origin main
```

### 示例 C：仅校验

管理员："校验一下光合作用课件"

```
$ node scripts/validate-courseware.cjs ./examples/bio-photosynthesis --fix-hints
→ 显示 18 项校验结果 + 修复建议
```

---

**技能版本**：v1.2  
**更新日期**：2026-04-10  
**依赖**：TeachAny 基础版 v5.10+  
**变更摘要**：
- v1.0：初始版本。包含完整的 6 阶段管理流水线（P0 环境准备 → P1 课件生成 → P2 质量校验 → P3 打包 → P4 注册 → P5 发布 → P6 推送）、快捷指令表、批量操作、工具脚本速查、硬规则、故障排查。
- v1.1：**同步基础版 v5.9 升级**——(1) 校验项从 18 项扩充至 22 项（+知识图谱可视化+视频嵌入规范+音频播放器UI+版式一致性）；(2) 强制通过项新增 #19 知识图谱可视化；(3) 质量门禁阈值调整（22/22 全通过→直接打包，18-21/22→修复后重验，<18→阻断）；(4) 依赖基础版升级至 v5.9+。
- v1.2：**同步基础版 v5.10 升级**——(1) 音频校验项 #21 更新为"底部控制条+滚动自动播放"（检测 `.audio-bar` 和 `sectionId`）；(2) 双语校验项 #15 改为"用户要求时检查"（默认仅中文，用户未要求时可标 N/A）；(3) P1 课件生成双语描述从"默认双语"改为"用户要求时生成英文版"；(4) 依赖基础版升级至 v5.10+。
