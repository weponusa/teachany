# TeachAny 版本变更日志

**当前版本**：v7.2（持续演进中）  
**更新日期**：2026-04-30

---

## 版本摘要

- **v1.0**：数理课件版
- **v2.0**：拆成通用底座+学科适配层
- **v3.0**：补 Bloom 完整表、课型分类、脚手架策略、Mayer 原则、五镜头选择指引、3 学科完整示例、视觉设计细则、Phase 4 审查清单
- **v4.0**：TTS 引擎切换为 Edge TTS；新增视频与音频制作流水线（Remotion 自动安装、Edge TTS 集成、双语字幕系统、语言配置）、Token 与成本估算
- **v5.0**：知识图谱集成、社区课件机制
- **v6.0**：简化发布流程（移除 Admin skill 依赖、内置质检、本地打包优先、去中心化分享、零权限要求）
- **v6.1**：Pillow 本地生图字体规范 + 基线检查增强
- **v7.1**：Hero 图补充机制 — 修复新知识点课件永远没有 Hero 图的架构缺陷
- **v7.2**：Hero 图批量修复 + 质检强化 — 全量 312 课件 hero 图覆盖率从 34% 提升至 100%

---

## 详细变更记录

### v7.6
⭐ 标准知识图谱模块 · 视觉/布局对齐知识地图
- 模块整体样式完全对齐 `tree.html`：深色底、域色渐变节点、实线/虚线边、悬停放大 + drop-shadow、tooltip 浮窗。
- 节点根据真实课件存在性区分：有课件实心 + 点击可直接打开课件；无课件虚线框、不可点。
- manifest 构建时对 `courses[].path` 做真实性校验，只保留 `examples/` 或 `community/` 下实际有 `index.html` 的课件。
- 所有官方课件的图谱模块统一放到**最底部**（footer 之前），作为收尾。

### v7.5
⭐ 标准知识图谱模块
- 新增 `scripts/teachany-knowledge-graph.{js,css}` + `scripts/teachany-kg-manifest.json`（由 `scripts/build-teachany-kg-manifest.py` 从 `data/trees` + `data/knowledge-points` 生成），提供稳定、可搜索、可筛选、可跳转的标准图谱模块。
- 课件接入只需：`<div data-teachany-kg="node_id"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>` + 引入模块 `css/js`。
- 新增硬规则 #59：禁止再手写图谱，主题样式只能通过 CSS 变量继承。
- 17 个官方课件 `#knowledge-graph` 已批量切到标准模块，发布校验 0 错误。

### v7.4
⭐ 真实交互与连续音频基线
- 新增硬规则 #58：禁止用静态图片、SVG 截图或 data:image 信息图伪装“互动/探究/实验/地图”模块。
- 语音、拼音、英语、朗读类课件必须提供独立连续音频播放器，`audioPlaylist` 需覆盖导学与关键发音/段落，不能只靠单个“点我听”或视频音轨。
- 发布前必须浏览器实测至少一个交互控件和连续音频播放，Console 0 error 后才能声称完成。

### v7.2
⭐ Hero 图批量修复 + SKILL 规范强化
- **问题诊断**：对全量 312 个 community 课件进行质量审计，发现 207 个课件的 hero 区域缺少 `<img>` 标签引用 hero 图片（尽管 206 个已有图片文件在 `assets/` 中）
- **根因分析**：
  1. 批量课件生成流程未调用 hero 图注入脚本
  2. 课件模板中 hero 区域未自动插入 `<img>` 标签
  3. Hero 图文件存放位置不统一（`assets/hero/` vs `assets/` 根目录），导致检测逻辑不一致
- **修复执行**：
  - 编写 `batch_inject_hero_img.py` 批量注入脚本，为 206 个有图片但缺标签的课件注入 `<img class="hero-cover-img">` 标签
  - 从 `teachany-images/` 复制 2 个缺失的图片到对应课件 `assets/`
  - 为 1 个完全无图片的课件（`hist-h-song-yuan-ming-qing-h`）使用 `image_gen` 生成 hero 图
  - **最终结果：312/312 课件全部有 hero 图片覆盖**
- **SKILL 规范变更**：
  - CSS 模板新增 `.hero-cover-img` 样式定义（宽度 100%、最大高度 320px、object-fit cover）
  - Hero 图命名规则兼容 `assets/` 根目录放置（批量注入脚本和历史课件使用此模式）
  - HTML 引用铁律新增"方式 B"：hero 图可放在 hero 容器闭合标签之后，用 `<!-- hero-cover -->` 标记
  - Completeness Gate 第 30 项强化：同时检查 `hero-img` 和 `hero-cover-img` 两种 class
  - 质检清单新增"Hero 图"检查项

### v7.1
⭐ Hero 图空缺检测与维护者补充 SOP（修复架构缺陷）
- **问题**：课件生成阶段（Phase 3）严禁 image_gen 生成 Hero 图，查找链（知识点 JSON → image-registry 精确匹配）未命中则留空。但对于新增知识点（图库中无预制 hero 图），课件将**永远没有 Hero 图**，没有后续补充流程。
- **修复**：
  - Section 10.4.1 新增"维护者补充 Hero 图的 SOP"：区分课件生成阶段（禁止 image_gen）和维护者补充阶段（允许 image_gen + 审核注册）
  - Phase 3.6 发布四件套新增第⑤步"Hero 图空缺检测与补充"：发布时自动检测 hero 图是否存在，缺失时提示维护者执行补充 SOP
- **区分**：课件制作者（AI Skill）仍严禁 image_gen 生成 Hero 图；维护者（管理员）可以在发布阶段生成后审核注册

### v6.1
- **新增 Section 10.4.3**：Pillow 本地生图字体规范——定义字体选择铁律、禁用字体清单（Hiragino Sans GB / STHeiti 对 Unicode 上下标渲染为方框 ⊠）、跨平台字体降级链、HTML/Pillow/Remotion/PPTX 四场景字体对照表
- **新增硬规则 #51**：Pillow 生图字体基线——含化学/数学公式符号的本地生图必须使用 Arial Unicode MS 或 Noto Sans CJK，字体降级链全部失败必须报错终止
- **check_baseline.sh 新增 B-3a+**：PNG 图片文字完整性抽检——用 Pillow 检测 assets/ 下图片是否存在 .notdef 方框特征
- **背景**：铝课件（chem-h-aluminum-compounds）使用 Hiragino Sans GB 字体生成配图，所有化学下标（₂₃⁺⁻）显示为方框 ⊠

### v6.0
- **移除 Admin skill 依赖**：不再需要管理员权限和外部脚本
- **内置质检功能**：AI 直接检查 meta 标签、ABT 叙事、互动元素等核心项
- **本地打包优先**：生成 .teachany 文件保存到本地，用户拖入 Gallery 即可使用
- **去中心化分享**：支持 GitHub PR、邮件提交、网盘分享等多种社区贡献方式
- **零权限要求**：普通用户无需 GITHUB_TOKEN 即可制作和使用课件

### v5.34.9.2
封堵"直推 examples/ 绕过质检"漏洞 · validator 严格化 · pre-push hook 双重护栏

### v5.34.9
⭐ 社区自动提交 · 零配置 + 质检自动合并 · Cloudflare Worker 中转

### v5.34.8
⭐ 发布权分离 · 双轨制：本地 drafts + 自动社区 PR · 新增硬规则 #48

### v5.34.7
⭐ L3/L4/PPTX 强制机器校验 · 新增硬规则 #47 PPTX 含图基线

### v5.34.6
⭐ 注入课标基本要求 · 新增小学科学 · SKILL 课标速查表

### v5.34
⭐ 新增 PPTX 导出层 L5 + 所有课件强制内置右下角 AI 学伴悬浮球

### v5.31
11 棵国际课标树全部构建完成 · IB DP × 4 + A-Level × 3 + AP × 4

### v5.30
多课标体系支持 · 国际学校可用（IB/A-Level/AP）

### v5.29
清理废弃 admin skill + 删除重复课件 + 新增硬规则 #44 节点挂载基线（v5.29.1 修订：community 允许多份）

### v5.28
统一课件 title 规范 + 强制 teachany_version + Gallery 版本徽章

### v5.27
修复课件学段错挂——建立 manifest vs node_id 前缀强制校验 + 新增硬规则 #42

### v5.25
⭐⭐⭐ 全部 20 棵知识树按新课标系统性重构——从"骨架"升级到"课标级结构"

### v5.24
⭐⭐ 根治知识树系统性污染——新增清污脚本 + 硬规则 #41

### v5.23
修复选择题致命 bug——`handleQuiz` onclick 第 4 参 `selectedVal` 被硬编码为固定值

### v5.22
⭐⭐ 根治地图对不齐——弃用 `L.imageOverlay` 全球底图，改用 XYZ 瓦片

### v5.21
⭐ 再次纠正——GitHub Pages 不部署 `data/geography/` 下的大型二进制

### v5.20
⭐ 纠正 v5.19 错误结论——`tree.html` 只读 `data/trees/*.json`，不读 `_graph.json`

### v5.19
⭐ 发布成功率保障（rebuild-index 三件套必跑 + node_id 必须真实校验 + 双推降级策略）

### v5.18
⭐ 地图底图必须与缩放同步 + 初始视图必须聚焦教学核心区域

### v5.17
⭐ Remotion mp4 必须三轨合一（画面 + 音效/配乐 + 语音）+ 视频必须配专属 poster 封面

### v5.16
⭐ Remotion 基线从"可降级"升级为"真强制"

### v5.15
⭐ K12 教材版本注册表 + 中国教材内容自动注入

### v5.14
⭐ Skill 运行时强制检测 Git 最新版本并按需更新

### v5.13
⭐ 时空资产完整目录纳入 Skill 知识库

### v5.12
⭐ 强制使用开源数据源，禁止手工标注 + 基线能力强制化

### v5.11
历史/地理课件DEM地形+态势动画强制规范

### v5.10
音频滚动自动播放 + 视频优先交互演示 + 默认仅中文

### v5.9
知识图谱可视化 + 视频/音频播放器强制规范 + Remotion 中文字体修复

### v5.8
WorkBuddy 多 Agent 协作 + 版式一致性 + AI 主动生图/生视频

### v5.7
全面升级"按需调用"为"默认执行"，保证课件基本质量

### v5.6
L3 语音讲解从"显式触发"升级为"默认必选"

### v5.5
融入项目驱动教学方法论

### v5.4
新增课件打包与分发（Section 17）

### v5.3
新增例题配图硬性规范（Section 13）

---

> 💡 完整的每个版本详细变更说明（含代码差异、根因分析、修复动作描述），请参阅 `SKILL_CN.md` 中对应版本号的历史记录。
