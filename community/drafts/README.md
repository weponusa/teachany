# community/drafts/ — 本地草稿区

> **v5.34.8 引入**：AI 生成的课件默认落地在这里，**不会**被自动推送到 GitHub，也**不会**进入官方 Gallery（`registry.json`）。

## 这个目录是做什么的？

早期版本 TeachAny SKILL 有一个严重漏洞：AI 生成课件后，会**默认自动**执行 `git push`，把用户在本地临时生成的课件直接推到官方仓库的 `examples/` 目录。结果 `registry.json` 被 124 份"伪官方"课件污染，`examples/` 里塞了大量没经过审核的内容。

自 v5.34.8 起修复方案是：
- AI 生成的课件一律先落地到 `community/drafts/<course-id>/`
- 本目录被 `.gitignore` 忽略，**不会**进入 git、**不会**被推送
- 用户可以自己决定下一步：本地用、走 PR 贡献到社区、或（管理员）手工升格为 official

## 三条后续路径

### ① 仅本地使用
什么都不用做，直接用浏览器打开 `community/drafts/<course-id>/index.html` 就能看课件。适合：
- 给自家孩子做一份专属课件
- 只想做出来自己用，不打算公开

### ② 贡献到社区
参考 `community/README.md` 走 PR 审批流程。简要步骤：
```bash
# 把课件从 drafts 移到 pending
mv community/drafts/<course-id> community/pending/<course-id>
# 创建 PR
git checkout -b feat/community-<course-id>
git add community/pending/<course-id>
git commit -m "feat(community): 新增社区课件 <course-id>"
git push origin feat/community-<course-id>
# 到 GitHub 上开 PR，等管理员打 approved 标签
```

### ③ 管理员升格为 official（仅限仓库 owner）
如果你是仓库 owner，且有三重条件：
- 根目录存在 `.teachany-admin` 标记文件
- 对话中有明确的"升格为官方"指令
- 已向用户复核课件定位

才可以：
```bash
# 人工复核无误后
mv community/drafts/<course-id> examples/<course-id>
# 手工编辑 registry.json，把这条的 status 改成 official
python3 scripts/rebuild-index.py
git add -A && git commit -m "feat: 新增官方课件 <course-id>"
git push origin main && git push gitee main
```

## 目录结构
```
community/drafts/
├── README.md            ← 你正在看的这个文档
├── .gitkeep             ← 让 git 识别此目录存在
└── <course-id>/         ← AI 生成的课件（被 .gitignore 忽略）
    ├── index.html
    ├── manifest.json
    ├── tts/
    └── assets/
```

---
*最后更新：2026-04-19（v5.34.8）*
