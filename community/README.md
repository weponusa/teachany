# TeachAny Community Courseware | 社区课件共享

[English](#english) | [中文](#中文)

---

## English

### Overview

TeachAny Community Courseware allows anyone to share their interactive coursewares with all TeachAny users. Shared coursewares appear directly in the Knowledge Tree, Learning Path, and Gallery — alongside official courses.

### How It Works

```
You create a courseware
        ↓
Upload via "Share to Community" button (auto-creates a GitHub PR)
        ↓
PR lands in community/pending/ for review
        ↓
Maintainer reviews & merges the PR
        ↓
GitHub Actions uploads .teachany package to Releases
        ↓
community/index.json is updated
        ↓
All users can see & download the courseware 🎉
```

### Submission Guidelines

1. **Quality Requirements**
   - Single-file HTML or `.teachany` package
   - Must include: learning objectives, at least 1 knowledge module, at least 1 assessment
   - Must follow [TeachAny Design System](../docs/design-system.md)
   - Must declare `<meta name="teachany-node">` matching a knowledge tree node ID

2. **Metadata Requirements**
   Your courseware must include these HTML meta tags:
   ```html
   <meta name="teachany-subject" content="math">
   <meta name="teachany-grade" content="8">
   <meta name="teachany-node" content="linear-function">
   <meta name="teachany-author" content="your-github-username">
   <meta name="teachany-version" content="1.0.0">
   ```

3. **File Size Limit**
   - Single HTML: ≤ 5 MB
   - `.teachany` package: ≤ 50 MB

4. **Content Policy**
   - Must be original or properly licensed
   - No copyrighted images/videos without permission
   - Educational content appropriate for K-12 students
   - No advertisements or external tracking

### Review Criteria

Maintainers will check:
- [ ] Courseware opens correctly in browser
- [ ] Required meta tags present and valid
- [ ] `node_id` matches an existing knowledge tree node
- [ ] Contains learning objectives and assessment
- [ ] No broken links or missing assets
- [ ] Follows TeachAny design system colors
- [ ] Content is educationally appropriate

### Multiple Coursewares Per Node

Multiple users can submit coursewares for the same knowledge node. All approved coursewares coexist and are ranked by community likes. The top 5 per node are displayed in the Knowledge Tree tooltip.

---

## 中文

### 概述

TeachAny 社区课件共享允许任何人将自己制作的互动课件分享给所有 TeachAny 用户。共享的课件会直接出现在知识树、学习路径和 Gallery 中，与官方课件并列展示。

### 工作流程

```
你创建了一个课件
        ↓
通过"分享到社区"按钮上传（自动创建 GitHub PR）
        ↓
PR 进入 community/pending/ 等待审核
        ↓
维护者审核并合并 PR
        ↓
GitHub Actions 自动将 .teachany 包上传到 Releases
        ↓
community/index.json 自动更新
        ↓
所有用户都能看到并下载该课件 🎉
```

### 提交规范

1. **质量要求**
   - 单文件 HTML 或 `.teachany` 课件包
   - 必须包含：学习目标、至少 1 个知识模块、至少 1 个测评
   - 必须遵循 [TeachAny 设计系统](../docs/design-system.md)
   - 必须声明 `<meta name="teachany-node">` 并匹配知识树节点 ID

2. **元数据要求**
   课件中必须包含以下 HTML meta 标签：
   ```html
   <meta name="teachany-subject" content="math">
   <meta name="teachany-grade" content="8">
   <meta name="teachany-node" content="linear-function">
   <meta name="teachany-author" content="你的-GitHub-用户名">
   <meta name="teachany-version" content="1.0.0">
   ```

3. **文件大小限制**
   - 单个 HTML：≤ 5 MB
   - `.teachany` 课件包：≤ 50 MB

4. **内容政策**
   - 必须是原创或有合法授权
   - 不可包含未授权的图片/视频
   - 内容适合 K-12 学生
   - 不得包含广告或外部追踪

### 审核标准

维护者将检查：
- [ ] 课件在浏览器中正常打开
- [ ] 必需的 meta 标签存在且有效
- [ ] `node_id` 匹配已有的知识树节点
- [ ] 包含学习目标和测评
- [ ] 无损坏的链接或缺失的资源
- [ ] 遵循 TeachAny 设计系统配色
- [ ] 内容在教育上是适当的

### 同节点多课件

多个用户可以为同一个知识节点提交课件。所有通过审核的课件共存，并按社区点赞数排名。知识树弹窗中显示每个节点前 5 名的课件。

---

## Directory Structure

```
community/
├── index.json          # Registry of approved community coursewares
├── pending/            # Staging area for PR submissions
│   └── .gitkeep
└── README.md           # This file
```

### index.json Schema

```json
{
  "version": "1.0",
  "updated_at": "2026-04-08T13:00:00Z",
  "repo": "weponusa/teachany",
  "courses": [
    {
      "id": "math-linear-function-abc123",
      "node_id": "linear-function",
      "name": "一次函数互动课件",
      "subject": "math",
      "grade": 8,
      "author": "contributor_name",
      "author_url": "https://github.com/contributor_name",
      "description": "覆盖斜率、截距、图像变换的完整互动课件",
      "download_url": "https://github.com/weponusa/teachany/releases/download/community-v1/math-linear-function-abc123.teachany",
      "approved_at": "2026-04-08",
      "version": "1.0.0",
      "file_size": 1234567,
      "likes": 0
    }
  ]
}
```
