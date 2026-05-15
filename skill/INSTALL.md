# 安装指南 · TeachAny Skill

这是一个为 AI Agent（Claude Code、CodeBuddy、Cursor、Codex CLI 等）设计的开源 Agent Skill，
让 AI 能按 **教学设计 + 课件工程** 的完整规范为 K-12 学生生成互动课件。

## 一、先决条件

- macOS / Linux（Windows 需配合 WSL2）
- Python 3.9+
- Bash 4+
- Git
- 可选：`gh`（GitHub CLI，用于课件发布到 TeachAny 社区）

## 二、安装到你的 AI Agent

### 2.1 安装到 CodeBuddy

```bash
# 克隆到 CodeBuddy 的 skills 目录
mkdir -p ~/.codebuddy/skills
cd ~/.codebuddy/skills
git clone https://github.com/weponusa/teachany.git teachany-src
ln -s "$PWD/teachany-src/skill" teachany
```

### 2.2 安装到 Claude Code（~/.agents/skills）

```bash
mkdir -p ~/.agents/skills
cd ~/.agents/skills
git clone https://github.com/weponusa/teachany.git teachany-src
ln -s "$PWD/teachany-src/skill" teachany
```

### 2.3 通用路径（自选）

Skill 文件结构固定，**目录名必须叫 `teachany`**，因为脚本里以 `~/.codebuddy/skills/teachany`
或 `~/.agents/skills/teachany` 作为自定位根。

```bash
git clone https://github.com/weponusa/teachany.git <work-dir>/teachany-src
ln -s <work-dir>/teachany-src/skill <your-skill-dir>/teachany
```

## 三、首次配置（一次性）

安装完成后运行 setup.sh，配置 GitHub 推送凭据。**只需做一次，之后发布课件全程自动。**

```bash
bash ~/.codebuddy/skills/teachany/scripts/setup.sh
# 或
bash ~/.agents/skills/teachany/scripts/setup.sh
```

脚本会引导你：
1. 检测 SSH 是否已配置（本地 Mac 通常已有，可跳过 token）
2. 粘贴 GitHub Fine-grained Token（仅需 `Contents: Read & write` 权限）
3. 确认本地仓库路径

配置写入 `~/.teachany/config`，之后 `auto-publish.sh` 自动读取，无需每次手动 `export GH_TOKEN`。

> 创建 Token：https://github.com/settings/tokens/new → Fine-grained → Repository: weponusa/teachany → Contents: Read and write

## 四、首次验证

```bash
# 在任意目录跑以下命令，确认 skill 可用
ls ~/.codebuddy/skills/teachany/scripts/publish_course.sh  # 或 ~/.agents/...
grep -n "TeachAny v7.12" ~/.codebuddy/skills/teachany/templates/course-skeleton.html | head -1
test -f ~/.codebuddy/skills/teachany/templates/manifest-template.json && echo "manifest template OK"
```

若以上命令全部有输出，skill 就绪。

> **注**：图片和地图资源不再捆绑在 skill 中，按需从仓库地图库或远端资源下载。
> Skill 本体约 482KB；首次制作历史/地理课件时会自动获取所需地图资源。

## 五、如何使用

对 AI 说：

> "用 TeachAny 给我做一节《函数与图像》的小学五年级数学互动课件"

AI 会自动：

1. 读取 `SKILL.md` / `SKILL_CN.md` 里的教学设计规范
2. 跑 `scripts/find_nodes.py` 找知识树节点
3. 按 `templates/course-skeleton.html` + `templates/manifest-template.json` 搭建课件
4. 从 `templates/content-section-templates.html` 选择主体内容片段填充 `{{CONTENT_SECTIONS}}`
5. 跑 `node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR" --phase2` 和 `$TEACHANY_SKILL/scripts/check_baseline.sh` 自检
6. （如配置 TeachAny 社区账号）`$TEACHANY_SKILL/scripts/publish_course.sh` 发布

详见：

- 英文文档 [SKILL.md](./SKILL.md)
- 中文文档 [SKILL_CN.md](./SKILL_CN.md)
- 地图 / 3D / PPTX 主题 [topics/maps-and-3d.md](./topics/maps-and-3d.md)

## 六、升级

```bash
cd ~/.codebuddy/skills/teachany && git pull
# 或
cd ~/.agents/skills/teachany && git pull
```

## 七、卸载

```bash
rm -rf ~/.codebuddy/skills/teachany
rm -rf ~/.agents/skills/teachany
```

## 八、仓库说明

课件与 Skill 现已统一到单仓库：

| 仓库 | 用途 |
| :--- | :--- |
| **weponusa/teachany** | Skill 主仓、Gallery、知识树、Registry、脚本、**全部课件** |
| ~~weponusa/teachany-courseware~~ | ~~已废弃，仅保留历史数据~~ |

做课件 → 放到 `weponusa/teachany` 的 `community/<course-id>/`；发布课件 → 运行 `bash "$TEACHANY_SKILL/scripts/auto-publish.sh" <course-id>`，一键注册+挂树+推送。

## 九、普通用户如何提交课件

普通用户无需 GitHub 写权限。推荐把完成的课件目录打包发给维护者，或在 `weponusa/teachany` 发起 PR，PR 合并后自动挂树。

如果你在完整 TeachAny 仓库中安装了可选提交脚本，可按完整仓库根的可选提交脚本 的说明执行；轻量 skill 包默认不包含该在线提交链路。

## 十、手机与小程序适配

从 v7.12 起，新课件默认要求通过手机视口与小程序 `web-view` readiness：

- 课件需包含 `viewport-fit=cover`、safe-area 处理、移动端单列布局、44px 以上触屏按钮；
- 小程序嵌入使用 `weponusa/teachany/miniprogram/（如有）` 模板；
- 小程序后台需将 `weponusa.github.io`（或自有 CNAME 域名）配置为业务域名；
- 个人类型小程序不支持 `web-view`。

示例小程序页面：

```text
/pages/courseware/courseware?id=hist-m-renaissance
```

对应 H5：

```text
https://weponusa.github.io/teachany/community/hist-m-renaissance/
```

## 十一、常见问题

**Q: 安装后 AI 还是不按 skill 做课件怎么办？**
A: 确认你的 AI Agent 已识别 skills 目录。可手动 `cat ~/.codebuddy/skills/teachany/SKILL_CN.md | head` 检查。

**Q: 想用自己的私有课件仓怎么办？**
A: 编辑 `$TEACHANY_SKILL/scripts/publish_course.sh` 开头的 `REPO_URL`，改为你的仓库地址。

**Q: skill 下载体积多大？**
A: skill 本体约 482KB（文档 + 脚本 + 模板）。图片和地图资源按需下载，无需提前安装。如需离线使用历史/地理课件，可运行 `bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh` 预下载地图资源。

---

MIT License · © 2026 weponusa
