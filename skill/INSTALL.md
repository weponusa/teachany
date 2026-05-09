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
git clone https://github.com/weponusa/teachany-skill.git teachany
```

### 2.2 安装到 Claude Code（~/.agents/skills）

```bash
mkdir -p ~/.agents/skills
cd ~/.agents/skills
git clone https://github.com/weponusa/teachany-skill.git teachany
```

### 2.3 通用路径（自选）

Skill 文件结构固定，**目录名必须叫 `teachany`**，因为脚本里以 `~/.codebuddy/skills/teachany`
或 `~/.agents/skills/teachany` 作为自定位根。

```bash
git clone https://github.com/weponusa/teachany-skill.git <your-skill-dir>/teachany
```

## 三、首次验证

```bash
# 在任意目录跑这三条命令，确认 skill 可用
ls ~/.codebuddy/skills/teachany/scripts/publish_course.sh  # 或 ~/.agents/...
head -5 ~/.codebuddy/skills/teachany/scripts/publish_course.sh | grep "v6"
cat ~/.codebuddy/skills/teachany/assets/image-registry.json | head -3  # CDN 索引已到位
```

若 3 条全部有输出，skill 就绪。

> **注**：v5.37 起，图片和地图资源（~43MB）不再捆绑在 skill 中，
> 而是通过 jsDelivr CDN 按需下载（来源：`weponusa/teachany-images` 仓库）。
> Skill 本体仅 ~1.4MB，首次制作历史/地理课件时会自动下载所需地图资源。

## 四、如何使用

对 AI 说：

> "用 TeachAny 给我做一节《函数与图像》的小学五年级数学互动课件"

AI 会自动：

1. 读取 `SKILL.md` / `SKILL_CN.md` 里的教学设计规范
2. 跑 `scripts/find_nodes.py` 找知识树节点
3. 按 `templates/course-skeleton.html` 搭建课件
4. 跑 `scripts/check_baseline.sh` 自检
5. （如配置 TeachAny 社区账号）`scripts/publish_course.sh` 发布

详见：
- 英文文档 [SKILL.md](./SKILL.md)
- 中文文档 [SKILL_CN.md](./SKILL_CN.md)
- 地图资源使用 [map-resources-guide.md](./map-resources-guide.md)
- 历史课件专题 [historical-maps.md](./historical-maps.md)
- 3D 地形 [terrain-3d-integration.md](./terrain-3d-integration.md)

## 五、升级

```bash
cd ~/.codebuddy/skills/teachany && git pull
# 或
cd ~/.agents/skills/teachany && git pull
```

## 六、卸载

```bash
rm -rf ~/.codebuddy/skills/teachany
rm -rf ~/.agents/skills/teachany
```

## 七、本仓与 TeachAny 课件仓的关系

| 仓库 | 用途 |
|:---|:---|
| **weponusa/teachany-skill**（本仓） | AI Agent 读取的 skill 规范、工具脚本、模板、资源 |
| [weponusa/teachany-courseware](https://github.com/weponusa/teachany-courseware) | TeachAny 课件站点 + 官方样板课件 + 社区课件库 |

做课件 → 用本仓 skill；发布课件 → 推到课件仓 `community/`。两者通过 `scripts/publish_course.sh` 自动衔接。

## 八、常见问题

**Q: 安装后 AI 还是不按 skill 做课件怎么办？**
A: 确认你的 AI Agent 已识别 skills 目录。可手动 `cat ~/.codebuddy/skills/teachany/SKILL_CN.md | head` 检查。

**Q: 想用自己的私有课件仓怎么办？**
A: 编辑 `scripts/publish_course.sh` 开头的 `REPO_URL`，改为你的仓库地址。

**Q: skill 下载体积多大？**
A: v5.37 起 skill 本体仅 ~1.4MB（文档 + 脚本 + CDN 索引）。图片和地图资源通过 jsDelivr CDN 按需下载，无需提前安装。如需离线使用历史/地理课件，可运行 `bash ~/.codebuddy/skills/teachany/scripts/install_map_resources.sh` 预下载全部地图资源（~43MB）。

---

MIT License · © 2026 weponusa
