# community/drafts/ — 本地草稿区

> **v5.34.9 引入**：AI 生成的课件默认落地在这里，不会被自动推送。AI 会先询问你想怎么处理，再执行下一步。

## 三条后续路径

AI 做完课件后会弹出：

```
课件已做好，保存在 community/drafts/<course-id>/。请问接下来：
① 仅本地自用，不提交（默认）
② 提交到 TeachAny 社区（零配置自动上传）
③ 我是仓库管理员，直接升格为官方课件（需 .teachany-admin）
```

### ① 仅本地使用
浏览器打开 `community/drafts/<course-id>/index.html` 就能用。适合：
- 给自家孩子做一份专属课件
- 只想自己用，不打算公开

### ② 提交到社区（零配置自动上传，v5.34.9 新版）

**只需要一条命令，不需要 GitHub 账号、不需要 token、不需要任何配置**：

```bash
python3 scripts/submit-to-community.py <course-id> \
    --author "你的名字" \
    --message "欢迎审阅"
```

幕后自动发生的事：
1. 脚本校验 manifest.json 必填字段
2. 打包成 `.teachany`（ZIP）
3. POST 到 TeachAny 官方 Cloudflare Worker
4. Worker 用官方 Bot Token 在 GitHub 创建 PR
5. GitHub Actions 自动跑 `validate-courseware.py` 质检
6. **质检通过 → 自动合并 → 课件注册到 Gallery**
7. 5-10 分钟后刷新首页即可看到

质检失败会在 PR 评论里列出具体问题（比如"缺 2 张插图"、"node_id 不存在"），修完重新提交即可。

> ℹ️ **为什么不需要 token？** TeachAny 搭建了官方中转服务（Cloudflare Worker），把 GitHub Bot Token 存在服务端，用户零配置。限频：每 IP 每天最多 10 份课件。

### ③ 管理员直推（仅限仓库 owner）

需同时满足三重条件：
- 根目录存在 `.teachany-admin` 标记文件（`touch .teachany-admin` 创建）
- 对话中有"升格为官方"指令
- 已向 AI 复核课件定位

然后：
```bash
mv community/drafts/<course-id> examples/<course-id>
# 手工改 registry.json，把这条的 status 改成 official
python3 scripts/rebuild-index.py
git add -A && git commit -m "feat: 新增官方课件 <course-id>"
git push origin main && git push gitee main
```

## 社区心标 = 排序权威

v5.34.9 起取消人工审核，改用**心标驱动**：

- 同一知识点下允许多份社区课件共存
- 按 localStorage 记录的心标数降序排列
- 官方课件（`status=official`）永远在社区课件之前
- 垃圾课件不会被点心标，自然沉底

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

**Q1：我选 ② 后多久能看到课件？**  
A：约 5-10 分钟（GitHub Actions 质检 + 合并 + Pages 部署）。

**Q2：提交失败怎么办？**  
A：脚本会给出具体错误码：
- `RATE_LIMITED` - 今日提交已达 10 份上限，明天再来
- `PACKAGE_TOO_LARGE` - 课件超过 5 MB，减少 tts/ 或压缩图片
- `MISSING_FIELDS` - manifest.json 缺字段
- PR 评论里 validate-courseware.py 的输出会详细列出"缺音频"、"缺图"、"node_id 错"等具体问题

**Q3：我可以反悔吗？**  
A：① → ② 随时可以重新跑脚本。② → 撤回：在 GitHub 网页 close 掉 PR 即可。

**Q4：为什么 AI 不能默认帮我提交 ②？**  
A：因为"把课件公开到社区"是有隐私和版权含义的动作。你可能在里面放了家庭照片、孩子的作业作为案例——这类内容必须由你明确授权才能公开。AI 默认沉默，你明确说"提交到社区"才会调脚本。

---
*最后更新：2026-04-19（v5.34.9 零配置自动提交）*
