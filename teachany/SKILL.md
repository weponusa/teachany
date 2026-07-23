---
name: TeachAny
version: 7.18.0
description: "K-12 interactive courseware creation. Use for school-subject lesson pages, animations, AI tutor, TTS, knowledge graph, PBL learning paths, or TeachAny publishing."
description_zh: "K12 互动课件开发技能：用于制作或优化学科课件、教学动画、AI 学伴、TTS、知识图谱、PBL 学习路径与 TeachAny 发布。"
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# TeachAny：K12 互动课件执行摘要

TeachAny 的目标不是把知识堆进页面，而是把一节课做成**有问题锚点、有互动、有讲解、有评估、有发布闭环**的学习体验。主文件只保留决策骨架；细节按需读取卫星文档。

## 何时使用

使用本技能：

- 用户要制作、改造、调试或发布 K12 学科课件、互动网页、微课、教学动画、PBL 探究课。
- 用户提到：`课件`、`教学设计`、`AI 学伴`、`TTS`、`知识图谱`、`课标`、`PBL`、`学习路径`、`发布到 Gallery`、`rebuild-index`。
- 用户是家长/教师/学生，目标是帮助中小学生理解一个具体知识点。

不要使用：企业培训、成人职业技能课、通用网站/App、纯 PPT/Word 格式转换、非 K12 展览页。

## 知识图谱 / 课标数据在哪？（必读，避免 404）

| 仓库 | GitHub | 含 `data/trees/` | 用途 |
| --- | --- | --- | --- |
| **teachany-courseware** | [weponusa/teachany-courseware](https://github.com/weponusa/teachany-courseware) | ✅ 权威 | 知识树、`node-index.json`、`nodes-metadata.json`、`rebuild-index.py` |
| **teachany**（本仓库） | [weponusa/teachany](https://github.com/weponusa/teachany) | ❌ 轻量 | 仅 Skill 安装包（`teachany/`）；**无**门户页与完整课标 JSON |
| ~~teachany-opensource~~ | **不存在此独立仓库** | — | 勿 clone；会 404 |

### 只读 vs 写入（能否不 clone？）

| 能力 | 不 clone，能访问公网即可？ | 数据/API 来源 |
| --- | --- | --- |
| **学习路径图谱** | ✅ | [www.teachany.cn/path.html](https://www.teachany.cn/path.html) |
| **知识地图** | ✅ | [www.teachany.cn/knowledge-map.html](https://www.teachany.cn/knowledge-map.html) |
| **PBL 匹配** | ✅ | [www.teachany.cn/pbl.html](https://www.teachany.cn/pbl.html) + `POST /api/pbl/analyze` |
| **查 node_id** `find_nodes.py` | ✅ | 远程 `data/trees/...`（`repo_paths.fetch_remote_json`） |
| **校验 node_id** `check_node_id.py` | ✅ | 远程 `node-index.json` |
| **课件内知识图谱模块** | ✅ | `assets/scripts/teachany-knowledge-graph.js`（轻量仓已同步；manifest 走 teachany.cn CDN） |
| **Gallery 首页** | ✅ | [www.teachany.cn](https://www.teachany.cn/) |
| **挂树 / 发布** | ✅ 见下方 `hang_tree.py` | `GH_TOKEN` 或 Worker PR；**不必**事先 clone |

### 网站入口（避免误判）

| 入口 | 用途 |
| --- | --- |
| [www.teachany.cn](https://www.teachany.cn/) | **唯一主站**：Gallery、PBL、知识地图、API、`data/` |
| [weponusa/teachany](https://github.com/weponusa/teachany) | **仅 Skill 安装**；`github.io/teachany` 仅跳转到主站 |
| [weponusa/teachany-courseware](https://github.com/weponusa/teachany-courseware) | 网站源码仓（部署到 Cloudflare Pages） |

裸域 `teachany.cn` 若 TLS 失败，请用 **`www.teachany.cn`**。

### 挂树与发布（Skill 一站式，无需事先 clone）

| 步骤 | 命令 | 凭据 |
| --- | --- | --- |
| 注册课标节点 | `python3 hang_tree.py register --node-id ... --subject ... --stage ...` | `GH_TOKEN`（写 courseware） |
| 发布课件+挂树 | `TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish <course-id> --course-dir <path>` | 有 token → 浅克隆+`auto-publish`；无 token → `publish_course` Worker PR |
| 全量重建索引 | `python3 hang_tree.py rebuild --dispatch` | `GH_TOKEN` 触发 [rebuild-index workflow](https://github.com/weponusa/teachany-courseware/actions) |
| 本地重建并 push | `python3 hang_tree.py rebuild --push` | `GH_TOKEN`（自动浅克隆到 `~/.cache/teachany-courseware`） |

`register_node.py` 在无本地仓时会自动转调 `hang_tree.py register`。`auto-publish.sh` 在无本地仓时会 **浅克隆** courseware 再执行 `rebuild-index.py`。

无 `GH_TOKEN` 时仍可 `teachany-publish.sh` → Worker 开 PR → 合并后 CI 自动 `rebuild-index` 挂树。

只读示例（**无需** token / clone）：

```bash
python3 "$TEACHANY_SKILL/scripts/find_nodes.py" --stage middle --subject physics --keyword "浮力"
python3 "$TEACHANY_SKILL/scripts/check_node_id.py" --node-id phy-m-liquid-pressure-buoyancy
```

门户与 `data/trees` 均在 **teachany-courseware / www.teachany.cn**；**不能**只在 `weponusa/teachany` 仓内找课标 JSON。

## Quick Start

用户：`我儿子初二搞不懂浮力，做个能玩的页面。`

标准输出路径：

1. 查 `node_id`：`python3 scripts/find_nodes.py --stage middle --subject physics --keyword "浮力"`（远程课标，无需 clone）。
2. 复制 `templates/course-skeleton-v2.html` 和 `templates/manifest-template.json`。
3. 用"为什么沉浮不同？"做问题锚点，加入拖拽物体/液体密度的 Canvas 互动。
4. 按 `tech/animation-toolchain.md` 选择动画工具：算法/流程优先 Motion Canvas，数学推导优先 Manim，实验探究优先 PhET/GeoGebra/3Dmol/Matter.js，页面实时操作用 Canvas/SVG。
5. 接入五件套：AI 学伴、TTS、section hints、知识图谱、导师卡片。
6. **学段视觉（强制）**：Phase 2 前读 `tech/visual-stage-modes.md`；`body` 用 `teachany-elementary` / `teachany-middle` / `teachany-high`，配色与练习气质不得混用（**禁止**把初中深色壳套到小学课）。
7. **Hero（Agnes 生图，禁止 SVG 画图）**：先 `find-hero.py "$COURSE_DIR" --cdn`；L1/L2 命中则引用 CDN，并**本地落盘** `assets/*-hero.webp` 作回退。未命中 → **必须**用 `agnes-image-gen.py`（Agnes / 服务端中转，用户无 Key）生成知识结构 Hero，prompt 要求**中文标注**知识点卡片/公式/流程（如「玻意耳定律」「pV=nRT」）。**禁止**用 `gen-hero-svg.py` / 手写 SVG 充当 Hero；额度用尽或中转失败时在交付说明中注明，不得用 SVG 伪图顶替。
8. **TTS（强制）**：`tts-engine.py`（Edge Neural）生成 ≥3 个 `tts/*.mp3`（每个 ≥5KB）；`data-teachany-audio-playlist` 每条带 `section` 映射 `data-tts`；`teachany-tts-narrator.js` v8 播放预录 mp3，**禁止** Web Speech 金属音、`data-tts-disabled` 或 `data-tts-mode="webspeech"` 交付。
9. **悬浮坞（强制）**：五件套 CSS 后加载 `teachany-floating-dock.css`；**禁止**课件内 `position:fixed` 右下角自定义学伴/气泡（与 TTS、播放模式 FAB、学习反馈抢位）。学伴只用 `ai-tutor.js`。
10. **定稿（强制收尾）**：`python3 scripts/finalize-courseware.py "$COURSE_DIR"` — 自动补齐 AI 学伴（卡片+config）、知识图谱、连续音频播放器，并为每个 `data-tts` 段落生成真实分段 mp3。即便前面漏写，此步也会补全；漏装 tts 引擎才会报错。
11. 本地验证通过后走发布流程（`preflight-publish.py` 会再跑一次 finalize 并对三模块硬校验）。

## 模式说明

TeachAny **只有一种模式**：完整模式。没有"快速模式"，没有"先做个简版"。

所有课件必须完整包含 19 项基线（见 `references/baseline-rules.md`），包括：manifest、五件套模块、Hero 图、TTS、知识图谱挂树、发布闭环。

**唯一允许豁免的情形**：某项依赖外部资源，在**当前网络环境下反复尝试（≥2 次，每次间隔 ≥30 秒）确实无法连接**，且无本地替代方案时，该单项可临时跳过并在交付说明中明确注明：
- 豁免原因（具体报错或 HTTP 状态码）
- 已尝试次数和方式
- 后续补齐的操作步骤

**不构成豁免理由的情形**：
- "用户只是想先看看效果"
- "先做简版，之后再补"
- "这个功能感觉用不上"
- 任何主观判断或时间压力

### 基础设施模式（维护 TeachAny 本身）

适用：修 `scripts/`、模板、Gallery、知识树、PBL、发布链路。

- 直接定位问题、修复、验证。
- 不套用课件制作的全流程，但必须遵守闭环验证。
- **课件发布仍须走正规路径**：批量修复/升级课件后，不要 `git commit && git push`——必须先检测凭据，无 GitHub 权限则逐门跑 `publish_course.sh`（见规则 #25a）。

## 4-Phase 流程

```text
Phase 0  定义与检索：学生/学段/主题/课型，定位 node_id
Phase 1  教学骨架：问题锚点 + ABT 叙事 + 互动/评估设计（必须完整，不可跳过）
Phase 2  构建页面：复制模板，填内容，接入标准模块与资源
Phase 3  验证交付：运行质量检查，浏览器/命令闭环验证
Phase 3.5a 反馈密码：**必须询问**教师并写入 manifest（`set-feedback-password.py`）；见 `phases/phase3-5-gates.md`
Phase 3.5b 询问上传：**必须询问**是否发布；同意则 `TEACHANY_UPLOAD_CONFIRMED=1` 再进 Phase 4
Phase 4  发布注册：**必须**走 `hang_tree.py publish`（或等价的 `teachany-publish.sh`），验证 **teachany.cn** 200 + 知识树挂树
```

完整细节见 `phases/workflow.md`；发布细节见 `phases/packaging.md`。

## 核心规则（最终有效版）

1. **模板优先**：新课件先复制 `templates/course-skeleton-v2.html`（分页模板）与 `templates/manifest-template.json`，不要从空白页手写平台接线。旧课件维护用 `course-skeleton.html`（v1 连续滚动）。**复制后必须删除 `<head>` 内的占位符文档注释块**（`<!-- TeachAny v2 分页课件骨架 ... -->`），不得保留在最终课件产物中。
2. **学习闭环优先**：每课必须有问题锚点、互动尝试、即时反馈、总结迁移；视觉炫技不能替代学习设计。
3. **标准模块优先**：AI 学伴、导师卡片、TTS narrator、section hints、知识图谱优先用标准模块 API，不重复手写。
4. **真实互动**：标题写"互动/实验/探究/地图/画布"就必须可操作；静态图不能伪装互动。
5. **知识图谱入树**：优先匹配官方课标 `node_id` 并挂到对应学科树；PBL 路径拆解产生的**课标外**知识点使用 `ext-{8位hex}`（与 `pbl-path.js` 一致），`manifest.node_id` 与 `<meta name="teachany-node">` 必须同为该 ext id，课件进入 `data/trees/other/user-generated.json`（Gallery「其他知识」）。探究课/常规 K12 课**不得**占用「其他知识」；`free_mode` 不能代替 ext 挂树。
6. **地图库优先 + 双平台资源 + 投影对齐**：历史/地理先用 `scripts/find-map.py` 查 bundled map library，再考虑外部数据或生成。
   - **制作地图前必读** `topics/historical-maps-projection.md`：底图仅 Web Mercator XYZ 瓦片；**禁止** `hillshade` JPG + `imageOverlay`（与 GeoJSON 错位）；`fitBounds` / `cities` 坐标格式见该文。
   - 无需全量下载地图包：`scripts/apply-historical-maps.py` 把图层引用统一写成相对 manifest 路径，
     运行时 `teachany-historical-map.js` 按 **本地 → teachany.cn → GitHub** 顺序回退获取。
   - teachany.cn（Cloudflare）国内外均可访问，作为首选远程源；GitHub（jsDelivr/raw）为备份，互为冗余。
   - 模式开关：`TEACHANY_MAP_SOURCE=auto|local|remote`；首选源可用 `TEACHANY_MAP_REMOTE_BASE` 覆盖。
7. **分层动画工具优先**：制作任何教学动画/互动动画前，必须先读 `tech/animation-toolchain.md` 并按教学目标选工具；算法/流程优先 Motion Canvas，数学推导优先 Manim，实验探究优先 PhET/GeoGebra/3Dmol/Matter.js，页面实时互动用 Canvas/SVG。Remotion 只在需要 React 视频合成时作为选项，不再一刀切默认。
8. **数理化必须加载仿真工具文档**：制作**数学/物理/化学/生物**课件时，**在 Phase 2 开始前必须先读** `tech/iframe-resources.md`，按学科-工具快查表选择并嵌入至少 1 个外部交互工具（PhET / GeoGebra / Desmos / 3Dmol.js 等）。不得用纯静态图或简单 Canvas 代替已有成熟工具的场景。
9. **发布先检测环境**：没有目标仓库、权限或远端不可达时，不要假设 `weponusa/*` 可写；先提示 fork/跳过发布/本地交付。
10. **依赖豁免须有证据**：某项外部资源无法连接，必须给出具体报错（curl 输出或 HTTP 状态码）、已重试次数，才允许该单项豁免；不得以"可能慢"或"先跳过"为由省略。
11. **闭环验证**：说"完成/修复/可用"前必须跑命令或浏览器验证，并给出关键输出。URL 未返回 200 不得声称发布完成。
12. **一类问题一起扫**：修一个模块或模式后，检查同类文件、模板、courseware/opensource 双仓是否同步。
13. **学段视觉必须匹配**：小学/初中/高中三套模式见 `tech/visual-stage-modes.md`；`teachany-stage` meta、`body` class、`:root` 配色三者一致。
14. **图片资产必须真实**：禁止在 hero/header 后面堆叠裸 `<img>` 标签；禁止 assets/ 下放 <5KB 的占位图（webp/png/jpg）。概念图、示意图必须嵌入对应教学 section 内部。如果图片资源暂未生成，不引用、不放文件——宁缺勿占。
15. **TTS 不得静默禁用**：交付课件须有可播放的 `tts/*.mp3`；不得以「后续再录」为由在 HTML 写 `data-tts-disabled`。
16. **Phase 3.5 双闸门（强制）**：① **必须询问**反馈密码并写入 manifest（`set-feedback-password.py`，见 `phases/phase3-5-gates.md`）；② **必须询问**是否上传。禁止未询问就 `hang_tree publish` / `teachany-publish` / `auto-publish` / `git push`。上传须 `TEACHANY_UPLOAD_CONFIRMED=1`（用户同意或任务已写明「制作并发布」）。
17. **资源引用禁止 `/assets/` 绝对路径（Pages 404 · 2026-07 全站修复）**：课件 HTML 引用共享脚本/样式/图片，必须用相对路径 `../../assets/...`（`community/<id>/` → 仓库根 `assets/`），**禁止** `src="/assets/..."` / `href="/assets/..."` 绝对路径；`drafts/`（3 级）用 `../../../assets/`。根因：GitHub Pages 项目站点根为 `/teachany-courseware/`，`/assets/` 被解析到域名根 `weponusa.github.io/assets/` 全部 404，导致知识图谱/AI 学伴/音频/TTS/section-hints 等标准模块静默失效；本地服务器根=仓库根时 `/assets/` 恰好可用，故本地测不出、线上才暴露。`validate-courseware.py` 已加硬校验（8b2 节），生成/批处理脚本产出若含 `/assets/` 绝对路径将被质检拦截为错误。

完整硬规则、基线清单与反模式：按需读 `references/baseline-rules.md`、`RULES.md`。

## 文档路由（按需加载）

| 场景 | 读取 |
| --- | --- |
| 完整 Phase 细节 | `phases/workflow.md` |
| 打包、Registry、Gallery、Git 发布 | `phases/packaging.md` |
| Phase 3.5 反馈密码 + 上传确认 | `phases/phase3-5-gates.md` |
| 学生反馈密码字段说明 | 课件仓 `FEEDBACK_SETUP.md` |
| 动画工具分层选择 | `tech/animation-toolchain.md` |
| TTS、视频音频 | `phases/video-audio.md` |
| 19 项基线与反模式 | `references/baseline-rules.md` |
| Phase 1 问卷 | `references/phase1-checklist.md` |
| 互动形态 | `guides/interaction-patterns.md` |
| PBL/探究课 | `guides/project-based.md` |
| **知识数据 / 双仓边界** | 上文「知识图谱 / 课标数据在哪」；`scripts/repo_paths.py` |
| **挂树 / 发布** | `scripts/hang_tree.py`、`scripts/github_courseware.py` |
| 练习评估 | `guides/assessment.md` |
| 页面结构与 CSS | `tech/page-structure.md`, `tech/design-system.md` |
| **学段视觉模式（小初高 · 必读）** | `tech/visual-stage-modes.md` |
| v2 分页模板 | `templates/course-skeleton-v2.html`, `templates/content-section-templates-v2.html` |
| 数学/科学仿真 | `tech/math-animations.md`（数学课件**必读**）, `tech/science-simulations.md`（物理/化学/生物课件**必读**） |
| 教学动画/互动动画选型 | `tech/animation-toolchain.md`（**动画类任务必读**） |
| **可嵌入 iframe 资源总目录** | `tech/iframe-resources.md`（**数理化必读**，PhET/GeoGebra/Desmos/3Dmol/LearningApps 等完整清单） |
| 地图 / 3D / PPTX | `topics/maps-and-3d.md` |
| **历史地图投影与对齐（必读）** | `topics/historical-maps-projection.md` |
| 示例 | `guides/examples.md` |

## 常用脚本

假设 `TEACHANY_SKILL` 指向 skill 安装目录，`COURSE_DIR` 指向课件目录：

```bash
export TEACHANY_SKILL=/path/to/teachany/skill
export COURSE_DIR=./community/<course-id>   # 任意路径均可，不必在 courseware 仓内
python3 "$TEACHANY_SKILL/scripts/preflight-check.py"
python3 "$TEACHANY_SKILL/scripts/preflight-publish.py" "$COURSE_DIR"   # Phase 4 前（publish 会自动跑）
python3 "$TEACHANY_SKILL/scripts/find_nodes.py" --stage middle --subject math --keyword "一次函数"
python3 "$TEACHANY_SKILL/scripts/find-hero.py" "$COURSE_DIR" --cdn   # L1 image-registry → L2 CDN 命名；命中则用返回 url
python3 "$TEACHANY_SKILL/scripts/agnes-image-gen.py" --course-id <id> --quota   # 查生图额度（每课件 3 张）
python3 "$TEACHANY_SKILL/scripts/agnes-image-gen.py" --course-id <id> --prompt "教育信息图，深色背景，中文标注：…" --out "$COURSE_DIR/assets/hero-infographic.webp" --slot hero
# 禁止：gen-hero-svg.py / 手绘 SVG 充当 Hero（用户明确要求 Agnes 生图 + 中文标注）
# 维护者：teachany-courseware 仓内 python3 scripts/build-image-registry.py --write-opensource
python3 "$TEACHANY_SKILL/scripts/tts-engine.py" --text "讲解文本" --voice zh-CN-XiaoyiNeural --rate "-8%" --output "$COURSE_DIR/tts/s01.mp3"
python3 "$TEACHANY_SKILL/scripts/finalize-courseware.py" "$COURSE_DIR"   # Phase 3 收尾：强制补 AI 学伴/音频/知识图谱 + 生成分段 TTS
python3 "$TEACHANY_SKILL/scripts/apply-standard-modules.py" --only "$COURSE_DIR/index.html"
python3 "$TEACHANY_SKILL/scripts/find-map.py" 唐
python3 "$TEACHANY_SKILL/scripts/apply-historical-maps.py"
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
```

**挂树 / 发布（Agent Phase 4 默认入口）**：

```bash
# Phase 3.5a：反馈密码 → set-feedback-password.py
# Phase 3.5c：发布前闸门 → preflight-publish.py（hang_tree publish 内已自动调用）
# Phase 3.5b：用户同意上传后：
export TEACHANY_UPLOAD_CONFIRMED=1
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" publish <course-id> --course-dir <任意路径>/community/<course-id>

# 课标树尚无节点时（需 GH_TOKEN；ext-* 禁止 register，直接 publish）：
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" register --node-id <id> --subject <学科> --stage middle --name "<名>"

# 仅重建全站索引（需 GH_TOKEN）：
python3 "$TEACHANY_SKILL/scripts/hang_tree.py" rebuild --dispatch
```

编排逻辑（**不必事先 clone courseware**）：
- **有 `GH_TOKEN`/SSH** → 自动浅克隆 `~/.cache/teachany-courseware` → `auto-publish.sh`（`rebuild-index` 挂树 + push）
- **无凭据** → `publish_course.sh` → Worker PR → 合并后 CI `rebuild-index` 挂树

兼容入口：`bash "$TEACHANY_SKILL/scripts/teachany-publish.sh" <course-id> --course-dir <path>`（行为与 `hang_tree publish` 相同）。

**线上验收以 teachany.cn 为准**（`https://www.teachany.cn/community/<course-id>/`）。

**认证说明（`auto-publish.sh` 专用，普通用户忽略）**：
- SSH 已配置（本地 Mac 默认走 SSH，无需额外操作）
- CI / Agent 环境：`export GH_TOKEN=<github_pat>` 后再跑脚本，脚本会自动配置 HTTPS remote
- 也可运行一次 `bash "$TEACHANY_SKILL/scripts/setup.sh"` 永久配置

如果脚本不存在，先在仓库根 `scripts/` 与 `skill/scripts/` 中搜索；不要引用不存在的脚本名。

## 交付标准

**制作交付**（Phase 0–3，含用户拒绝上传时）：

- **已跑 `finalize-courseware.py`**：AI 学伴（卡片+`__TEACHANY_TUTOR_CONFIG__`）、连续音频播放器（`data-teachany-audio-playlist` + ≥3 真实 mp3）、知识图谱（`data-teachany-kg`）三模块齐全
- 通过 `validate-courseware.cjs` 质检
- 关键资源存在：index.html、manifest.json、PLAN.md、assets/、tts/（或豁免记录）
- 控制台无错误，核心互动可用，移动端不崩
- 交付摘要中说明：用户是否同意上传；若拒绝，给出本地路径与 `node_id`

**发布交付**（仅 Phase 4 执行后）：

- Registry/Gallery 可访问，线上 URL 返回 HTTP 200
- 知识树已挂（课标节点或 `other/user-generated.json` 中的 `ext-*`）

## 版本说明

当前执行摘要版本：`7.20.0`。v7.20：新增 `finalize-courseware.py` 课件定稿器——发布前强制补齐 AI 学伴（卡片+`__TEACHANY_TUTOR_CONFIG__`）、连续音频播放器、知识图谱，并为每个 `data-tts` 段落自动生成真实分段 mp3；`preflight-publish.py` 启动即调用 finalize 并对三模块硬校验；`apply-standard-modules.py` 补 `teachany-audio-player.js` + tutor-config + audio-config 注入；修复 course-skeleton-v2 模板 CSS bug。v7.19：新增 `preflight-publish.py` 发布前闸门（反馈密码/node_id 一致性/ext 挂树规则/validate 预检）；`hang_tree register` 禁止 ext-*。
