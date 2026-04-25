# TeachAny Skill

> 让 AI 懂教学设计的开源 Agent Skill · 适用于 Claude Code / CodeBuddy / Cursor / Codex CLI 等 AI 编程助手

这是 [TeachAny 主仓](https://github.com/weponusa/teachany) 里的 skill 子目录，
让 AI 能按**教学设计 + 课件工程**的完整规范为 K-12 学生生成互动课件。

## 🚀 一键安装

先克隆整个 TeachAny 主仓（课件站点 + skill + 知识树数据一并拿到）：

```bash
git clone https://github.com/weponusa/teachany.git
cd teachany
```

然后把 `skill/` 软链到你 AI Agent 的 skills 目录：

### CodeBuddy

```bash
mkdir -p ~/.codebuddy/skills
ln -sf "$PWD/skill" ~/.codebuddy/skills/teachany
```

### Claude Code / Cursor / Codex CLI

```bash
mkdir -p ~/.agents/skills
ln -sf "$PWD/skill" ~/.agents/skills/teachany
```

### Windows（PowerShell，管理员）

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.codebuddy\skills\teachany" -Target "$PWD\skill"
```

## ✅ 验证安装

```bash
ls ~/.codebuddy/skills/teachany/scripts/publish_course.sh    # 应该存在
head -5 ~/.codebuddy/skills/teachany/scripts/publish_course.sh | grep "v6"  # 应该显示 v6.x
```

三条都有输出 = skill 就绪。

## 💡 为什么要克隆整个主仓？

因为 skill 做课件时会用到主仓的 **知识树数据**（`data/trees/*.json`）、**官方样板**（`examples/`）、
**发布链路脚本**。只装 skill 不克隆主仓会丢失这些依赖。

用户 clone 后可以：

- ✅ 用 skill 让 AI 做课件
- ✅ 本地预览 TeachAny 站点（打开 `index.html`）
- ✅ 参考 `examples/` 里 17 份官方样板
- ❌ 不会自动下载 `community/`（304 份社区课件）——那是在线访问的，不进本地

## 📖 使用

对 AI 说：

> "用 TeachAny 给我做一节《一次函数的图像》的八年级数学课"

AI 会按 skill 规范：找节点 → 搭骨架 → 生成 TTS → 自检 → 可选发布到社区。

详见主仓根目录的 [README.md](../README.md) 和 [SKILL_CN.md](./SKILL_CN.md)。

## 🔄 升级

```bash
cd /your/teachany/clone
git pull
# skill 软链指向 skill/，pull 后自动是最新
```

## 📜 License

- **代码与文档**：MIT License（与主仓一致）
- **assets/** 中的历史地图数据基于 CHGIS（CC-BY 4.0）、Natural Earth（Public Domain）等开源数据集加工而成，使用时请保留原始数据集署名
