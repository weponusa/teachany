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

- **#16** 所有课件必须包含 TTS、Hero 知识结构图、真实互动；教学动画/视频按课型和用户要求补齐。没有"快速模式"，不允许以任何理由跳过基线项并声称"后续升级"。
- **#16a** 动画工具必须分层选择：算法/流程优先 Motion Canvas，数学推导优先 Manim，科学实验优先 PhET/GeoGebra/3Dmol/Matter.js，页面实时互动用 Canvas/SVG，装饰动效用 CSS/Lottie/Rive，复杂 3D 用 Blender/Three.js；Remotion 只在需要 React 视频合成时使用。制作动画前必须查 `tech/animation-toolchain.md`。
- **#16b** 禁止用 `ffmpeg testsrc`、纯色块、随机几何运动、静态图缩放或纯标题飞入冒充教学动画；MP4 必须有明确教学过程和 audio stream。
- **#18** TTS 走 `scripts/tts-engine.py`（Edge Neural，唯一合格来源）+ `teachany-tts-narrator.js` v8（播放预录 mp3）；**禁止**课件内手写 Web Speech / `speechSynthesis`；**禁止** macOS say / pyttsx3 / 浏览器金属音兜底。
- **#19** Hero 图必须是知识结构图，不是纯装饰图；**先** `find-hero.py "$COURSE_DIR" --cdn`（L1 `image-registry.json` / L2 CDN），未命中再用 `gen-hero-svg.py` 兜底。
- **#19a** **学段视觉三分法（强制）**：小学 `teachany-elementary`（暖白糖果色）、初中 `teachany-middle`（浅灰天蓝）、高中 `teachany-high`（深色学术）。详见 `tech/visual-stage-modes.md`；禁止跨学段套壳。
- **#19b** TTS 必须可播放：`tts/*.mp3` ≥3 且 ≥5KB（`tts-engine.py`）；playlist 每条须带 `section` 映射 `data-tts`；**禁止** `data-tts-disabled="true"` 或 `data-tts-mode="webspeech"` 交付。
- **#19c** **音色规范**：小学默认 `zh-CN-XiaoyiNeural`（语速 `-8%`），初中 `zh-CN-XiaoxiaoNeural`，高中 `zh-CN-YunxiNeural`；朗读器与底部音频条共用同一批 mp3。
- **#19d** **悬浮坞**：必须加载 `teachany-floating-dock.css`；禁止课件内右下角自定义 fixed 学伴/气泡；左下=学伴+反馈，右下=TTS+播放模式 FAB（见 `tech/visual-stage-modes.md`）。
- **#20** 历史/地理地图先查 `find-map.py`，优先复用仓库/远端地图库。
- **#21** 历史/地理地图必须用 `data-teachany-map` + `teachany-historical-map.js`；投影与对齐以 `topics/historical-maps-projection.md` 为准：**EPSG:3857 Web Mercator + `L.tileLayer` XYZ 底图**；**禁止** `config.hillshade` 与 `L.imageOverlay` 全球等距圆柱 JPG；疆域 GeoJSON 为 WGS84 `[lng,lat]`，城市 `cities` 为 `[lat,lng,…]`，`fitBounds` 为 `[[南纬,西经],[北纬,东经]]`；禁止课件内手写 Leaflet/ECharts graphic 铺底。

## E. 知识树与发布

- **#22** `manifest.json.course_id`、`node_id`、HTML meta 必须一致。
- **#23** 优先匹配官方课标 `node_id`；PBL 课标外知识点仅用 `ext-{8位hex}`（`manifest` + `teachany-node` 一致），由 `rebuild-index.py` 写入 `data/trees/other/user-generated.json`。K12/探究课不得进入「其他知识」；勿用 `free_mode` 代替 ext 挂树。
- **#24** 不手改 `registry.json`、`community/index.json`、`teachany-kg-manifest.json`；由 `rebuild-index.py` 生成。
- **#24a** Phase 3.5b **必须询问**是否上传；Agent **禁止**未询问即调用 `hang_tree.py publish` / `teachany-publish.sh` / `auto-publish.sh` / `publish_course.sh` 或裸 `git push`。用户同意后设 `TEACHANY_UPLOAD_CONFIRMED=1` 再发布；拒绝则不得发布。
- **#24b** Phase 3.5a **必须询问**授课教师设置学生反馈密码并写入 `manifest.feedback`（`set-feedback-password.py`）；禁止未询问就发布。教师明确不启用时用 `--decline` 记录；禁止明文密码入库（仅 `password_sha256`）。
- **#25** Phase 4 必须走 `hang_tree.py publish`（或等价 `teachany-publish.sh`）。**严禁**跳过 `rebuild-index.py` 直接 push。挂树/发布不必事先 full clone（`GH_TOKEN` 浅克隆或 Worker PR→CI rebuild）。单课发布**严禁** `git add -A`；用 `auto-publish.sh` 限定暂存。有 SSH/`GH_TOKEN` 时 Agent **必须**尝试发布挂树。
- **#25a** **发布路径自动选择（强制）**：在执行发布前，**必须先运行凭据检测**（`ssh -T git@github.com` 或检查 `GH_TOKEN` 环境变量）。若无 GitHub 推送权限 → **只能用 `publish_course.sh`**（走 Worker API，零凭据）；禁止 `git commit` 后发现推不上去再告诉用户"需要 token"。批量升级多门课件后同样适用此规则——逐门跑 `publish_course.sh`，不要试图一次 git push 全部。
- **#26** full HTML 放 `weponusa/teachany-courseware` 仓库的 `community/<course-id>/`；`weponusa/teachany` 只保留主站、Skill 和轻量索引。
- **#27** 自动发布前先检测远端、权限、分支和用户是否要求跳过。

## F. 质量检查

- **#28** 正式课件至少运行：`node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"`。
- **#29** 关键资源存在性需验证：HTML、manifest、assets、TTS/视频、Hero、知识图谱节点。
- **#30** 浏览器验证至少检查：控制台无错误、核心互动可用、AI 学伴入口可见、知识图谱 tooltip 可点击。
- **#31** 线上发布后用 `curl` 或 raw/GitHub Pages URL 验证可访问。
- **#31a** **资源引用禁止 `/assets/` 绝对路径（Pages 404 · 2026-07 全站修复）**：课件 HTML 引用共享脚本/样式/图片，必须用 `../../assets/...` 相对路径（`community/<id>/` → 仓库根 `assets/`；`drafts/` 用 `../../../assets/`）；**禁止** `src="/assets/..."` / `href="/assets/..."`。根因：GitHub Pages 项目站点根为 `/teachany-courseware/`，`/assets/` 解析到域名根 `weponusa.github.io/assets/` 全部 404，导致知识图谱/AI 学伴/音频/TTS/section-hints 静默失效；本地服务器根=仓库根时恰好可用、线上才暴露。发布前跑 `validate-courseware.py`（8b2 硬校验）确认无 `/assets/` 残留；生成/批处理脚本产出含 `/assets/` 绝对路径即判错误。

## G. 用户体验

- **#32** 普通家长/教师同样走完整流程；**不得**为省事跳过 Phase 3.5（反馈密码 + 上传确认）；上传仅在用户同意后执行。
- **#33** 技术维护/批量任务直接走维护模式，不套课件制作长流程。
- **#34** 输出要说明"已做什么、如何验证、还有什么增强项"。
- **#35** 不要把内部历史补丁、失败考古、长表格暴露给用户。
