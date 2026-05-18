# PLAN.md —— 生态系统的组成 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：bio-m-ecosystem-junior
- **node_id**：bio-m-ecosystem-junior
- **学段/学科**：biology·8年级（初中生物）
- **ABT 叙事**：已知各种生物共存 → 但一种消失会波及其他 → 因此要理解食物链/食物网
- **Bloom 层级覆盖**：L1-L4 多层覆盖
- **ConcepTest 锚点**：生产者/消费者/分解者+食物链+食物网
- **认知负荷预算**：本征=中 外在=低 生成=高

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | Hero 知识结构图 | 生态系统组成结构 | Hero SVG | assets/hero-infographic.svg | 内嵌 SVG | test -f assets/hero-infographic.svg |
| M2 | ABT 情境引入 | 已知/问题/新知 | 卡片式 HTML | inline#why-learn | HTML 内嵌 | grep -q why-learn index.html |
| M3 | 核心内容模块 | 生产者/消费者/分解者+食物链+食物网 | 信息卡+互动 | inline | HTML 内嵌 | node scripts/validate-courseware.cjs <dir> |
| M4 | 互动仿真 | Canvas 食物链构建器 | Canvas 动画 | inline#canvas-sim | HTML 内嵌 | grep -q canvas index.html |
| M5 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="bio-m-ecosystem-junior" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py <dir> |
| M6 | AI 学伴 | 诊断问答 | 标准模块 | scripts/ai-tutor.js + data-teachany-tutor-card | 复用标准模块 | grep -q data-teachany-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：`scripts/ai-tutor.js` + `<div data-teachany-tutor-card>` 已列入 M6
- [x] **Hero 图**：SVG 知识结构图 `assets/hero-infographic.svg` 已列入 M1
- [x] **TTS 音频**：tts 目录已就位（has_tts 已在 manifest 申报）
- [x] **Remotion 视频**：Canvas 互动替代视频，已在 M4 申报
- [x] **知识图谱**：`data-teachany-kg="bio-m-ecosystem-junior"` 已列入 M5

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / assets / tts | #35 #57 #59 #60 #64 #69 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`

## 6. 豁免记录

- 社区用户通过网页端提交，PLAN.md 由系统自动补全
