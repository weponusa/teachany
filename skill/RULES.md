# TeachAny 硬规则（合并最终版）

本文件只保留最终有效规则。版本补丁、案例考古和重复条款已移除；需要历史请查 Git history。

## A. 执行纪律

- **#1** **闭环验证**：声称完成/修复前必须运行实际命令或浏览器验证，并给出关键输出。
- **#2** **事实驱动**：定位原因前先 grep/read/curl/console/测试验证，不做无证据归因。
- **#3** **失败两次换方案**：同一方向连续失败 2 次，切换本质不同路径。
- **#4** **一类问题一起扫**：修一个模块后检查模板、脚本、courseware/opensource 双仓同类问题。
- **#5** **不绕过质量闸门**：除非用户明确要求紧急跳过，否则不得使用 skip hook/skip validation。

## B. 课件结构

- **#6** 新课件必须从 `templates/course-skeleton.html` 与 `manifest-template.json` 开始。
- **#7** 每课必须有问题锚点：从学生真实问题进入，不以知识堆叠开场。
- **#8** 页面必须有清晰学习闭环：导入 → 探究/解释 → 练习反馈 → 总结迁移。
- **#9** 互动必须真实可操作；静态图片/截图不能伪装交互。
- **#10** 移动端必须可用：375×667 / 390×844，无 hover-only 核心交互。

## C. 标准模块

- **#11** 五件套优先使用标准模块：`ai-tutor`、`teachany-tutor-card`、`teachany-tts-narrator`、`teachany-section-hints`、`teachany-knowledge-graph`。
- **#12** 禁止手写知识图谱、AI 学伴卡片、TTS 控制器、section hints 的重复实现。
- **#13** 知识图谱使用 `<div data-teachany-kg="<node_id>">`，由公共模块和 manifest 渲染。
- **#14** AI 学伴入口卡片必须在正文靠前位置可见，不只依赖 FAB。
- **#15** 课件声明的模块必须肉眼可见、鼠标/触控可达。

## D. 媒体与资源

- **#16** 所有课件必须包含 TTS、Hero 知识结构图、真实互动；Remotion/视频按课型和用户要求补齐。没有"快速模式"，不允许以任何理由跳过基线项并声称"后续升级"。
- **#18** TTS 走 `scripts/tts-engine.py` 或标准 narrator；不要在课件内手写 Web Speech 控制器。
- **#19** Hero 图必须是知识结构图，不是纯装饰图；无生图能力时用 `gen-hero-svg.py` 兜底。
- **#20** 历史/地理地图先查 `find-map.py`，优先复用仓库/远端地图库。
- **#21** 地图使用标准模块和本地/远端资源；禁止在线瓦片硬依赖和自造投影逻辑。

## E. 知识树与发布

- **#22** `manifest.json.course_id`、`node_id`、HTML meta 必须一致。
- **#23** 优先匹配官方 `node_id`；没有则注册；确实不在课标内再用 `free_mode` 或 `ext-*`。
- **#24** 不手改 `registry.json`、`community/index.json`、`teachany-kg-manifest.json`；由 `rebuild-index.py` 生成。
- **#25** 发布必须走 `auto-publish.sh`（维护者）或 `publish_course.sh`（社区）。**严禁直接 `git add && git commit && git push` 跳过 `rebuild-index.py`**——这会导致课件不挂知识树、registry 不更新、nodes-metadata 断链。如果手动发布，必须先 `python3 scripts/rebuild-index.py` 再 commit。
- **#25a** **发布路径自动选择（强制）**：在执行发布前，**必须先运行凭据检测**（`ssh -T git@github.com` 或检查 `GH_TOKEN` 环境变量）。若无 GitHub 推送权限 → **只能用 `publish_course.sh`**（走 Worker API，零凭据）；禁止 `git commit` 后发现推不上去再告诉用户"需要 token"。批量升级多门课件后同样适用此规则——逐门跑 `publish_course.sh`，不要试图一次 git push 全部。
- **#26** full HTML 放 `weponusa/teachany-courseware` 仓库的 `community/<course-id>/`；`weponusa/teachany` 只保留主站、Skill 和轻量索引。
- **#27** 自动发布前先检测远端、权限、分支和用户是否要求跳过。

## F. 质量检查

- **#28** 正式课件至少运行：`node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"`。
- **#29** 关键资源存在性需验证：HTML、manifest、assets、TTS/视频、Hero、知识图谱节点。
- **#30** 浏览器验证至少检查：控制台无错误、核心互动可用、AI 学伴入口可见、知识图谱 tooltip 可点击。
- **#31** 线上发布后用 `curl` 或 raw/GitHub Pages URL 验证可访问。

## G. 用户体验

- **#32** 普通家长/教师同样走完整流程，减少多轮确认但不跳过基线项；所有课件必须完成上传注册。
- **#33** 技术维护/批量任务直接走维护模式，不套课件制作长流程。
- **#34** 输出要说明"已做什么、如何验证、还有什么增强项"。
- **#35** 不要把内部历史补丁、失败考古、长表格暴露给用户。
