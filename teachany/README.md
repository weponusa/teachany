# TeachAny Skill

TeachAny 是面向 K12 互动课件的 AI Agent skill。当前唯一主入口是 `weponusa/teachany` 仓库中的 `skill/` 子目录；不再要求用户使用独立 `teachany-skill` 仓库。

## Quick Install

```bash
# CodeBuddy
mkdir -p ~/.codebuddy/skills && cd ~/.codebuddy/skills
git clone https://github.com/weponusa/teachany.git teachany-src
ln -s "$PWD/teachany-src/skill" teachany

# Claude Code / 其他 Agent
mkdir -p ~/.agents/skills && cd ~/.agents/skills
git clone https://github.com/weponusa/teachany.git teachany-src
ln -s "$PWD/teachany-src/skill" teachany
```

安装后让 AI 读取 `~/.codebuddy/skills/teachany/SKILL.md` 或 `~/.agents/skills/teachany/SKILL.md`。

## What's inside

```text
teachany-src/
└── skill/
    ├── SKILL.md                 # 轻量执行摘要（v7.12.1）
    ├── SKILL_CN.md              # 中文兼容入口
    ├── RULES.md                 # 合并后的硬规则
    ├── scripts/                 # find_nodes / validate / TTS / map 等工具
    ├── templates/               # 课件骨架与 manifest 模板
    ├── phases/                  # workflow / packaging / video-audio
    ├── references/              # baseline 规则
    ├── guides/                  # PBL、评估、互动示例
    ├── tech/                    # 页面结构、设计、数学/科学仿真
    └── topics/maps-and-3d.md    # 地图、3D、PPTX 派生
```

## Core workflow

1. 先定位学生、学段、知识点与 `node_id`。
2. 从 `templates/course-skeleton.html` 和 `manifest-template.json` 起步。
3. 用问题锚点、真实互动、即时反馈构成学习闭环。
4. 按需要启用 TTS、Hero、知识图谱、AI 学伴、地图等标准模块。
5. 正式发布前运行验证脚本，并确认线上 URL 可访问。

## 常用命令

```bash
export TEACHANY_SKILL=~/.codebuddy/skills/teachany
export COURSE_DIR=/path/to/teachany/community/<course-id>

python3 "$TEACHANY_SKILL/scripts/find_nodes.py" "一次函数"
python3 "$TEACHANY_SKILL/scripts/find-map.py" 唐
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

## 仓库分工

| 仓库 | 用途 |
| :--- | :--- |
| `weponusa/teachany` | Skill 主仓、Gallery、知识树、Registry、脚本 |
| `weponusa/teachany` | Skill 包 + 完整课件内容与 GitHub Pages 站点（唯一主仓库） |

## 关键规则

完整规则见 [`RULES.md`](./RULES.md)。

- 不编造 `node_id`。
- 不手写平台标准模块的重复实现。
- 不把完整课件 HTML 放到 opensource 仓库。
- 说“完成/修复”前必须给验证输出。

## 体积

当前 skill 包约 482KB。图片、地图等大资源不随 skill 打包，按需从 `weponusa/teachany` 的资源目录或远端地址获取。
