# community/drafts/ — 本地草稿区

> **v5.34.8 引入**：AI 生成的课件默认落地在这里，**不会**被自动推送到 GitHub，也**不会**进入官方 Gallery（`registry.json`）。AI 必须先询问你想怎么处理，再执行下一步。

## 为什么有这个目录？

早期版本 TeachAny SKILL 有一个严重漏洞：AI 生成课件后，会**默认自动**执行 `git push`，把你在本地临时生成的课件直接推到官方仓库的 `examples/` 目录。结果 `registry.json` 里堆积了大量未经审核的内容。

自 v5.34.8 起的双轨制修复：
- AI 生成的课件一律**先**落地到 `community/drafts/<course-id>/`
- 本目录被 `.gitignore` 忽略，**不会**进入 git
- AI 然后**强制询问**你的意向，你明确回复后才执行下一步

## 三条后续路径

AI 应该向你弹出这样的询问：

```
课件已做好，保存在 community/drafts/<course-id>/。请问接下来：
① 仅本地自用，不提交（默认）
② 提交到 TeachAny 社区仓库（自动创建 PR，等管理员审核）
③ 我是仓库管理员，直接升格为官方课件（需 .teachany-admin）
```

### ① 仅本地使用

什么都不用做，直接用浏览器打开 `community/drafts/<course-id>/index.html` 就能看课件。适合：
- 给自家孩子做一份专属课件
- 只想自己用，不打算公开

### ② 提交到社区（推荐：自动提 PR）

**一键命令**：
```bash
python3 scripts/submit-to-community.py <course-id> \
    --author "你的名字" \
    --message "欢迎审阅"
```

脚本会自动：
1. 校验 `manifest.json` 必填字段
2. 打包成 `.teachany`（ZIP）
3. 通过 `repository_dispatch` 事件触发 GitHub Actions
4. Actions 自动创建分支 + 开 PR 到 `community/pending/`
5. 管理员审阅后打标签：
   - `approved` → 进入社区 Gallery（与官方课件并列展示）
   - `promote-to-official` → 升级为官方课件
   - `revision-needed` → 需要你修改

**首次使用需配置 token**（一次配好终身有效）：

1. 访问 https://github.com/settings/personal-access-tokens/new
2. 选择 **Fine-grained token**
3. **Repository access** → Only select repositories → `weponusa/teachany`
4. **Permissions** → 只勾：
   - Contents: Read-only
   - Metadata: Read-only
5. 生成后保存到仓库根目录：
   ```bash
   echo '你的token' > .teachany-token
   ```
   `.teachany-token` 已被 `.gitignore` 拦住，不会被提交。

> ℹ️ 为什么只需要 Read-only？实际创建分支、提交文件、开 PR 的是 GitHub Actions（用它自己的 token）。你的 token 只用来发一个 `repository_dispatch` 事件，触发 workflow。所以 Read-only 就够了，零安全风险。

### ③ 管理员直推（仅限仓库 owner）

如果你是仓库 owner，且对这份课件的质量完全负责，可以跳过社区 PR 直接升格为官方：

需同时满足三重条件（缺一不可）：
- 根目录存在 `.teachany-admin` 标记文件（`touch .teachany-admin` 创建）
- 对话中有明确的"升格为官方"指令
- 已向 AI 复核课件定位

之后：
```bash
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
└── <course-id>/         ← AI 生成的课件（被 .gitignore 忽略，不入库）
    ├── index.html
    ├── manifest.json
    ├── tts/
    └── assets/
```

## 常见问题

**Q1：我选 ② 但没有 GitHub 账号怎么办？**  
A：`.teachany-token` 需要 GitHub 账号。没账号可以先走 ① 本地自用，等以后想分享时再注册账号配 token。

**Q2：我能反悔吗？**  
A：能。① → ② 随时可以：`python3 scripts/submit-to-community.py <course-id>`。② → 撤回 PR：在 GitHub 网页端 Close 掉 PR 即可，草稿还在本地 `community/drafts/`。

**Q3：社区 PR 审核要多久？**  
A：取决于管理员响应速度。通常 1-7 天。你可以在 `community/README.md` 里看完整的 PR 标签体系和审批路径。

**Q4：为什么 AI 不能默认帮我提交 ②？**  
A：因为"把课件公开到社区"是有隐私和版权含义的动作。你可能在里面放了家庭照片、自家孩子的习题作为案例——这类内容必须由你明确授权才能公开。AI 默认沉默，你明确说"提交到社区"才会调脚本。

---
*最后更新：2026-04-19（v5.34.8 双轨制）*
