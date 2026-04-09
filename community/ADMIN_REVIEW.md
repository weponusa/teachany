# TeachAny 社区课件审核机制设计

[English](#english) | [中文](#中文)

---

## 中文

### 一、整体架构

```
用户提交课件（"分享到社区"按钮）
        ↓
自动创建 PR → community/pending/{id}.json + {id}.teachany
        ↓
┌──────────────────────────────────────────────────┐
│  GitHub Actions: community-review.yml            │
│  · 校验 JSON 必填字段                              │
│  · 校验 node_id 是否存在于知识树                     │
│  · 自动打标签: community-courseware + needs-review  │
└──────────────────────────────────────────────────┘
        ↓
管理员人工审核 PR（查看课件质量、内容合规性）
        ↓
┌─────────────────── 三条路径 ───────────────────┐
│                                                 │
│  路径 A: 社区课件通过                              │
│  管理员打标签: approved                           │
│  → 直接 Merge PR                                │
│  → community-publish.yml 自动触发               │
│  → 更新 community/index.json                    │
│  → 课件出现在 Gallery 社区区 + 知识树弹窗          │
│                                                 │
│  路径 B: 提升为官方课件                            │
│  管理员打标签: promote-to-official               │
│  → Merge PR 后 admin-promote.yml 自动触发       │
│  → .teachany 解包 → examples/{subject}-{name}/  │
│  → 更新 data/trees/*.json（courses + status）    │
│  → 更新 data/ratings.json                       │
│  → 更新 index.html Gallery 卡片                  │
│  → 清理 community/pending/{id}.*                │
│                                                 │
│  路径 C: 替换已有官方课件                           │
│  管理员打标签: replace-official                    │
│  PR 描述中注明: replaces: examples/{old-id}      │
│  → Merge 后 admin-promote.yml 触发              │
│  → 备份旧课件 → 替换为新课件                       │
│  → 更新所有引用                                   │
│                                                 │
│  拒绝: 管理员关闭 PR 并说明理由                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 二、标签体系

| 标签 | 颜色 | 含义 | 触发动作 |
|:---|:---|:---|:---|
| `community-courseware` | 🔵 蓝色 | 社区课件提交 | 自动打标（review.yml） |
| `needs-review` | 🟡 黄色 | 等待管理员审核 | 自动打标（review.yml） |
| `approved` | 🟢 绿色 | 审核通过，加入社区索引 | 管理员手动打标 |
| `promote-to-official` | 🟣 紫色 | 提升为官方课件 | 管理员手动打标 |
| `replace-official` | 🔴 红色 | 替换已有官方课件 | 管理员手动打标 |
| `revision-needed` | 🟠 橙色 | 需要作者修改后重新提交 | 管理员手动打标 |

### 三、管理员审核清单

管理员在审核 PR 时应逐项检查：

- [ ] 课件在浏览器中正常打开
- [ ] meta 标签完整且有效（subject、grade、node_id、author、version）
- [ ] node_id 匹配已有知识树节点
- [ ] 包含学习目标和至少 1 个测评
- [ ] 音频/视频资源可正常播放
- [ ] 互动元素功能正常
- [ ] 遵循 TeachAny 设计系统配色
- [ ] 内容适合 K-12 学生
- [ ] 无外部追踪代码或广告
- [ ] 文件大小符合限制（HTML ≤ 5MB，.teachany ≤ 50MB）

### 四、PR 元数据格式

用户提交的 PR 自动包含以下信息：

```markdown
## Community Courseware Submission

- **Name**: 一次函数互动课件
- **Subject**: math
- **Grade**: 8
- **Node ID**: linear-function
- **Files**: 15 (includes audio, video, and other assets)

### Review Action (管理员填写)

action: approve | promote | replace
replaces: examples/math-old-course  (仅 replace 时填写)
```

管理员通过 **打标签** 而非修改 PR 描述来决定审批路径，更加简洁可靠。

### 五、各 Workflow 职责

#### 5.1 community-review.yml（已有，升级）

**触发**：PR → `community/pending/**`

**功能**：
1. 校验 JSON 必填字段（id, node_id, name, subject, grade）
2. 校验 node_id 是否存在于 `data/trees/` 目录下的知识树 JSON 中
3. 校验学科名称是否合法
4. 若 .teachany 文件存在，检查文件大小
5. 自动打标签：`community-courseware` + `needs-review`
6. 输出审核摘要到 PR 评论

#### 5.2 community-publish.yml（已有，升级）

**触发**：push 到 main 且包含 `community/pending/**` 变更

**功能**：
1. 检测新增的 `community/pending/*.json` 文件
2. 读取 JSON 元数据，构建索引条目
3. 更新 `community/index.json`
4. 提交变更

#### 5.3 admin-promote.yml（新增）

**触发**：PR 被合并到 main 且带有 `promote-to-official` 或 `replace-official` 标签

**功能**：
1. 读取 `community/pending/{id}.json` 获取课件元数据
2. 如果有 `.teachany` 包，解包提取文件到 `examples/{subject}-{name}/`
3. 扫描 `data/trees/` 找到匹配的 node_id，更新：
   - `courses` 数组添加 `"examples/{subject}-{name}"`
   - `status` 从 `"gap"` 改为 `"active"`（如果是新节点首个课件）
4. 在 `data/ratings.json` 中添加新条目
5. 如果是 `replace-official`，备份并替换旧课件
6. 清理 `community/pending/{id}.*` 文件
7. 提交所有变更

### 六、数据流转图

```
community/pending/{id}.json    ← 用户 PR 提交
community/pending/{id}.teachany ← 课件包（可选）
         ↓ (管理员 merge)
community/index.json            ← 路径 A：社区课件（自动更新）
         ↓ (管理员打 promote 标签)
examples/{subject}-{name}/      ← 路径 B：官方课件（自动解包）
data/trees/{subject}-{level}.json ← 知识树节点自动更新
data/ratings.json                ← 评分记录自动添加
index.html                      ← Gallery 卡片（需手动或后续自动化）
```

### 七、安全考虑

1. **Workflow 权限**：所有写操作使用 `contents: write`，仅限 bot 账号
2. **标签权限**：只有仓库 collaborator 及以上权限才能打标签
3. **文件校验**：.teachany 包解压前检查文件类型白名单（html, js, css, mp3, mp4, json, png, jpg, svg, srt）
4. **路径注入防护**：课件 ID 严格限制为 `[a-z0-9-]` 字符
5. **大文件处理**：超过 GitHub 上传限制（100MB）的文件通过 Release Assets 管理

---

## English

### Overview

The TeachAny Community Courseware Review Mechanism provides three approval paths for admin review of user-submitted coursewares via GitHub Pull Requests:

| Path | Label | Result |
|:---|:---|:---|
| **A. Approve as Community** | `approved` | Added to `community/index.json`, visible in Gallery community section |
| **B. Promote to Official** | `promote-to-official` | Extracted to `examples/`, knowledge tree + ratings updated |
| **C. Replace Official** | `replace-official` | Replaces existing official courseware with the new submission |

### Workflow Summary

1. **User** clicks "Share to Community" → auto-creates a GitHub PR with metadata JSON + .teachany package
2. **community-review.yml** validates the submission and adds labels
3. **Admin** reviews the PR, tests the courseware, and applies the appropriate label
4. **Admin** merges the PR
5. **community-publish.yml** updates `community/index.json` (Path A)
6. **admin-promote.yml** extracts to `examples/`, updates knowledge tree, ratings (Path B/C)

### Label Reference

| Label | Purpose | Applied By |
|:---|:---|:---|
| `community-courseware` | Identifies community submissions | Auto (review.yml) |
| `needs-review` | Awaiting admin review | Auto (review.yml) |
| `approved` | Approved for community index | Admin |
| `promote-to-official` | Promote to official courseware | Admin |
| `replace-official` | Replace existing official courseware | Admin |
| `revision-needed` | Needs author revision | Admin |

---

## Version

- v1.0 · 2026-04-09
