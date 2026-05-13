# community/drafts/ — 本地草稿区

AI 生成课件时可以先落在这里做本地预览；确认无误后，统一以当前用户身份发布到 `community/<course-id>/`，再重建索引并提交到 Git。

## 推荐流程

```bash
# 1. 本地预览
open community/drafts/<course-id>/index.html

# 2. 发布为社区课件
mv community/drafts/<course-id> community/<course-id>

# 3. 自动注册到 Gallery / 知识树
python3 scripts/rebuild-index.py

# 4. 以当前用户 Git 身份提交上传
git add -A
git commit -m "feat: 新增课件 <course-id>"
git push origin main
git push gitee main
```

## 规则

- 不需要额外的本地权限标记文件。
- 不走额外审核流程。
- 课件制作完成后，默认进入 `community/`，通过 `rebuild-index.py` 自动注册。
- `examples/` 仅保留存量官方示例，新增用户课件一律放在 `community/`。

## 目录结构

```text
community/drafts/
├── README.md
├── .gitkeep
└── <course-id>/
    ├── index.html
    ├── manifest.json
    ├── tts/
    └── assets/
```
