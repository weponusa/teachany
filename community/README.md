# TeachAny Community Courseware | 社区课件共享

TeachAny 社区课件允许任何用户把自己制作的互动课件上传到 `community/`，并通过统一索引重建流程自动出现在 Knowledge Map、Learning Path 和 Gallery 中。

## 发布流程

```text
制作课件
  ↓
保存到 community/<course-id>/
  ↓
运行 scripts/rebuild-index.py 自动注册
  ↓
以当前用户 Git 身份 commit + push
  ↓
GitHub Pages 更新后在 Gallery 可见
```

## 用户身份上传

新增课件统一走用户身份上传，不需要额外的本地权限标记文件。

```bash
python3 scripts/rebuild-index.py
git add -A
git commit -m "feat: 新增课件 <course-id>"
git push origin main
git push gitee main
```

## 提交规范

1. **质量要求**
   - 单文件 HTML 或 `.teachany` 课件包均可。
   - 必须包含学习目标、知识模块和测评。
   - 必须遵循 TeachAny 设计系统。
   - 必须声明 `<meta name="teachany-node">` 并匹配知识地图节点 ID。

2. **元数据要求**

   ```html
   <meta name="teachany-subject" content="math">
   <meta name="teachany-grade" content="8">
   <meta name="teachany-node" content="linear-function">
   <meta name="teachany-author" content="your-name">
   <meta name="teachany-version" content="1.0.0">
   ```

3. **文件大小建议**
   - 单个 HTML：≤ 5 MB
   - `.teachany` 包：≤ 50 MB

4. **内容要求**
   - 原创或有合法授权。
   - 不包含未授权图片、视频、广告或外部追踪。
   - 内容适合 K-12 学生。

## 同节点多课件

同一个知识节点可以挂载多份社区课件。`rebuild-index.py` 会基于 `manifest.json` 的 `node_id`、`author`、`variant`、`version` 自动整理 Registry 和知识树引用。

## 目录结构

```text
community/
├── <course-id>/         # 已发布社区课件
│   ├── index.html
│   ├── manifest.json
│   └── assets/
├── drafts/              # 本地草稿，可预览后再发布
├── archive/             # 历史归档
└── README.md
```
