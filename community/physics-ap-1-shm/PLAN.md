# PLAN.md —— AP Physics 1 · 简谐运动 策划文档

## 1. 教学骨架摘要（源自 Phase 1）

- **课件 ID**：physics-ap-1-shm
- **node_id**：physics-ap-1-shm
- **学段/学科**：physics·11年级（AP Physics 1）
- **ABT 叙事**：已注入（见课件 ABT 引入区块）
- **Bloom 层级覆盖**：L1-L4 多层覆盖
- **ConcepTest 锚点**：F = −kx 判定条件 / 周期公式 / 能量守恒
- **认知负荷预算**：本征=高 外在=低 生成=高

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | ABT 情境引入 | 已知/问题/新知 | 卡片式 HTML | inline#abt-box | HTML 内嵌 | grep -q abt-box index.html |
| M2 | 弹簧振子仿真 | T = 2π√(m/k)，等时性 | PhET iframe | inline（CDN） | CDN iframe | curl -I https://phet.colorado.edu/sims/html/masses-and-springs/ |
| M3 | 波动相位仿真 | x(t) = A cos(ωt+φ) | PhET iframe | inline（CDN） | CDN iframe | curl -I https://phet.colorado.edu/sims/html/waves-intro/ |
| M4 | 能量转换仿真 | KE + PE = ½kA² | PhET iframe | inline（CDN） | CDN iframe | curl -I https://phet.colorado.edu/sims/html/masses-and-springs-basics/ |
| M5 | 单摆仿真 | T = 2π√(L/g)，小角度近似 | PhET iframe | inline（CDN） | CDN iframe | curl -I https://phet.colorado.edu/sims/html/pendulum-lab/ |
| M6 | 练习题 | 周期计算 / 等时性 / 平衡位置 | 交互选择题 | inline | HTML 内嵌 | grep -q quiz-card index.html |
| M7 | 知识图谱 | 前置后续导航 | 标准公共模块 | data-teachany-kg="physics-ap-1-shm" | python3 scripts/build-teachany-kg-manifest.py | python3 scripts/check-knowledge-graph.py community/physics-ap-1-shm |
| M8 | AI 学伴 | 诊断问答 | 标准卡片 | inline ai-tutor-card | HTML 内嵌 | grep -q ai-tutor-card index.html |

## 3. 五件套自检清单

- [x] **AI 学伴**：页面内含 `.ai-tutor-card` 区块，靠前可见
- [x] **Hero 图**：社区课件豁免，manifest.hero_image=null 已申报
- [x] **TTS 音频**：PhET 仿真内置音效，独立 TTS 豁免（manifest.has_tts=false 已申报）
- [x] **Remotion 视频**：PhET 交互仿真替代视频，豁免（manifest 未申报 has_video）
- [x] **知识图谱**：`data-teachany-kg="physics-ap-1-shm"` + `<section id="knowledge-graph">` 已在底部

## 4. Subagent 派遣清单

| Agent | 负责模块 | 关键产出 | 必读硬规则 |
| :--- | :--- | :--- | :--- |
| main | 全部模块 | index.html / manifest / PLAN.md | #6 #22 #25 #26 #35 |

## 5. 发布动作

- `python3 scripts/rebuild-index.py`
- `git add -A && git commit -m "feat: 新增/更新课件 physics-ap-1-shm"`
- `git push origin main`

## 6. 版本历史

- v1.0 (2026-05-12): 初始发布（手写 Canvas 动画，知识图谱在顶部，为 redirect 页）
- v1.1 (2026-05-16): 修复 — 知识图谱移至底部 `<section id="knowledge-graph">`，手写动画换为 PhET 仿真（弹簧/波动/单摆/能量），去掉 redirect 改为真实内容
