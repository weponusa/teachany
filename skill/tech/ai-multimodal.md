# AI 多模态互动区（可选功能）

> **所属**：TeachAny 技能 · 卫星文档
> **触发时机**：做多模态互动时
> **主文档**：[../SKILL_CN.md](../SKILL_CN.md)
>
> 本文件从 SKILL_CN.md 主文拆出，按需加载以避免上下文爆炸。

---

### 10.4 AI 多模态互动区（可选功能，不做硬性要求）

> ⚠️ **v5.37 变更**：多模态互动区从"默认插入"降级为**可选功能**。由于运行时 API 调用、`generateMedia()` 统一实现等技术依赖较重，当前阶段**不做硬性要求**。AI 生成课件时**不必自动插入**互动区，仅在用户明确要求时添加。

对于适合**视觉化表达**的学科内容，课件中**可以**生成"AI 多模态互动区"——预留的交互式占位区域，教师或学生可通过 AI API 生成图片/视频内容填充。

#### 使用场景（用户明确要求时）

| 场景 | 说明 | 示例 |
|:---|:---|:---|
| **教师备课时插入** | 教师使用自己的多模态 API 生成图片/视频，嵌入课件 | 历史课：生成"丝绸之路商队"插图 |
| **学生课中创作** | 学生撰写提示词，课件调用 API 生成作为作品 | 语文课：根据诗句意境写提示词，AI 生成意境画 |
| **课后拓展任务** | 作为创新挑战题，学生用 AI 辅助完成创作 | 地理课：生成"板块运动示意动画" |

#### HTML 实现规范（参考）

在课件中使用以下 HTML 结构标记多模态互动区：

```html
<!-- AI 多模态互动区（可选） -->
<div class="teachany-media-zone" 
     data-zone-type="image"
     data-suggested-prompt="一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画，远处有雪山和古城"
     data-context="历史·丝绸之路·情境导入">
  <div class="media-zone-placeholder">
    <div class="zone-icon">🎨</div>
    <div class="zone-title">AI 图片创作区</div>
    <div class="zone-desc">在此输入提示词，使用 AI 生成与课程相关的图片</div>
    <textarea class="prompt-input" placeholder="描述你想要生成的图片..."></textarea>
    <div class="zone-actions">
      <button class="btn-generate" onclick="generateMedia(this)" disabled>
        🖼️ 生成图片（需配置 API）
      </button>
      <button class="btn-upload" onclick="uploadMedia(this)">
        📁 上传本地图片
      </button>
    </div>
    <div class="media-result"></div>
    <div class="zone-hint">
      💡 参考提示词：<em>一幅描绘唐代丝绸之路上驼队穿越沙漠的水彩画</em>
    </div>
  </div>
</div>
```

#### 属性说明

| 属性 | 必填 | 说明 |
|:---|:---|:---|
| `data-zone-type` | ✅ | `image` / `video` / `audio` |
| `data-suggested-prompt` | ✅ | AI 建议的提示词（中文），帮助教师/学生快速生成 |
| `data-context` | ✅ | 学科·主题·用途，便于管理和理解 |

#### 交互逻辑

1. **默认状态**：显示占位区 + 建议提示词 + "上传本地图片"按钮（始终可用）
2. **教师配置 API 后**：激活"生成"按钮，可通过 API 直接生成
3. **学生模式**：学生填写自己的提示词 → 点击生成 → 作品展示在互动区（作为学习产出）
4. **降级方案**：如无 API，教师可直接上传本地图片/视频

#### 何时添加互动区

AI **仅在以下情况添加** AI 多模态互动区：

| 条件 | 插入位置 |
|:---|:---|
| 用户明确要求"加入 AI 创作环节" | 用户指定位置 |
| 用户要求"增加互动区 / 多模态区" | 适合的模块位置 |

#### 10.4.1 AI 主动生图规范（课件生成阶段）

> ⚠️ **这不是用户运行时的 API 调用**，而是 **AI 在生成课件代码时主动调用 `image_gen` 工具**，生成插图并直接嵌入 HTML。
>
> 🔒 **生图来源铁律（v5.34.12 新增）**：本项目**只使用**宿主 IDE（WorkBuddy / CodeBuddy）原生提供的 `image_gen` 工具。
>
> - ✅ 允许：调用运行环境里注册的 `image_gen` 工具（由宿主 IDE 透明代理到其内部图像服务）
> - ❌ 严禁：在任何脚本里直接 `requests.post('https://api.openai.com/...')` / 调用 Gemini Vision / 调用 Replicate / 调用 nano-banana / 调用 Tripo / 调用 Hunyuan 等"用户私人 API"
> - ❌ 严禁：读取 `.env` / memory 中用户 API Key 用于生图
> - ❌ 严禁：把"用户曾告诉 AI 的某个 OpenAI/Gemini Key"写进脚本或 CI workflow
>
> **除非用户在当前对话中明确说"用我的 XX key 生图"**，AI 都必须走宿主 `image_gen` 工具。
> 即便用户曾在以往会话中提供过 key，本次若未重新明确要求，也**不得**使用。
>
> 本规则的目的：保证课件生产链路的**可移植性**（换一个宿主 IDE 跑，只要它提供 `image_gen` 工具就能开箱跑通）和**安全性**（不把用户 API 配额消耗在隐式调用上）。

**核心原则**：文科课件（语文、历史、地理、美术）和情境导入强化型理科课件中，AI **必须在生成课件的同时主动生成配图**，不能只留占位符。

**🌐 Prompt 语言规则（v5.36 新增）**：

> ⚠️ **铁律**：中国课标课程（除英语课外），图片生成 prompt **必须以中文为主**。图片中出现的文字标注、公式说明、知识结构文字等**一律使用中文**。
>
> **理由**：AI 生图工具会根据 prompt 语言决定图中文字的语言。中文课件配英文插图会造成认知割裂，学生看不懂图中标注。

| 课件类型 | prompt 语言 | 图中文字 | 示例 |
|:---|:---|:---|:---|
| **中国课标课程（语/数/英以外）** | **中文** | **中文** | "一次函数知识结构图，展示 y=kx+b 的定义、性质、图像特征及应用，教育信息图风格" |
| **中国课标·语文课** | **中文** | **中文** | "《静夜思》意境图，中国水墨风，月光洒在窗前" |
| **中国课标·数学课** | **中文为主，公式用数学符号** | **中文+数学符号** | "二次函数知识结构信息图，中心写 y=ax²+bx+c，分支展示顶点式、交点式、开口方向、对称轴，清晰教育信息图风格" |
| **中国课标·英语课** | **英文** | **英文** | "A colorful mind map of 'There be' sentence pattern..." |
| **IB/AP/国际课程** | **英文** | **英文** | "IB Chemistry periodic table concept map..." |
| **其他语言课程** | **该课程教学语言** | **对应语言** | 按实际教学语言 |

> 📌 **简记**：**课件用什么语言教学，图片 prompt 就用什么语言**。中国课标除英语课外 = 中文 prompt + 中文图注。

**🗺️ Hero 图定义（v5.36 重新定义）**：

> ⚠️ **铁律**：Hero 图**不是**普通场景插图/氛围图，而是**本课知识点的完整知识结构信息图（Knowledge Structure Infographic）**。
>
> Hero 图应包含：本课所有核心知识点、它们之间的层级/并列/因果关系、关键公式或术语、学习路径。视觉呈现为**思维导图 / 概念图 / 信息图**风格，让学生一眼看到本课的知识全貌。

> ⚠️ **一一对应铁律（v6.9 重写）**：Hero 图与课件 `node_id` 是**严格一一对应**关系。
>
> **命名规则（写死，不可更改）**：
> - **文件名**：`{node_id}-hero.png`（node_id 中的分隔符保持原样）或 `{关键词}-hero.png`（批量生成时使用）
> - **存放目录**：课件根目录下的 `assets/hero/` 文件夹（v6.9 分目录结构）；**v7.2 兼容**：`assets/` 根目录也可接受（批量注入脚本和历史课件使用此模式）
> - **HTML 引用**：`<img src="./assets/hero/{filename}" class="hero-img">` 或 `<img src="assets/{filename}" class="hero-cover-img">`
>
> **示例**：
> | node_id | Hero 图文件名 | HTML 引用 |
> |:---|:---|:---|
> | `math-m-linear-function` | `math-m-linear-function-hero.png` | `<img src="./assets/hero/math-m-linear-function-hero.png" class="hero-img">` |
> | `hist-m-english-revolution` | `hist-m-english-revolution-hero.png` | `<img src="./assets/hero/hist-m-english-revolution-hero.png" class="hero-img">` |
> | `bio-photosynthesis` | `bio-photosynthesis-hero.png` | `<img src="./assets/hero/bio-photosynthesis-hero.png" class="hero-img">` |
>
> **查找规则（v7.3 简化版，方案 Y+）**：
> 1. **唯一入口**：在 `skill/assets/image-registry.json` 的 `images[]` 中查找 `match_nodes` 包含当前 `node_id` 且 `slot=hero` 的条目
> 2. **命中** → 拼接 CDN URL：`https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{file}`，下载到 `assets/hero/{node_id}-hero.png`
> 3. **未命中** → **留空**（Hero 区 `<img>` 标签的 `src` 设为空字符串或不插入 `<img>` 标签），在 Completeness Gate 中标注"Hero 图未命中，需人工补充"
> 4. **有且仅有精确匹配**：不接受部分匹配、模糊匹配、同学科替代
> 5. ⛔ **绝对禁止**：使用其他课件的 Hero 图、模糊匹配其他课件的 Hero 图、从任何数据源中选一个"看起来像"的 Hero 图凑数
>
> **附加元信息**：知识点的中文名、学科、学段、学制、领域、是否含教材摘录等元数据可参考 `skill/data/kp-md-manifest.json` 的 `entries[]` 字段（`kp_id, node_id, name_zh, subject, stage, curriculum, grade, domain_id, md_file, has_excerpts`）。
>
> **为什么课件生成阶段不用 image_gen 自动生成？**
> Hero 图是**知识结构信息图**，包含完整的知识点层级和关键术语。AI 实时生成的图片无法保证知识结构的准确性和一致性。
> **课件生成阶段**（Phase 3）中，Hero 图只能从预制图库精确匹配下载，未命中则留空。
> 如果某个 node_id 还没有预制 Hero 图，就留空等待后续补充，**不要自动生成凑数**。
>
> **⭐ 维护者补充 Hero 图的 SOP（v7.1 新增）**：
> 当课件发布时发现 Hero 图留空（Phase 3.6 步骤⑤自动检测），**维护者（非普通课件制作者）** 应执行以下流程：
> 1. 使用 `image_gen` 工具生成 Hero 知识结构信息图，prompt 参照本 Section 的 prompt 策略表
> 2. 将生成的图片上传到 `weponusa/teachany-images` 仓库的 `{subject}/` 目录下
> 3. 运行 `python3 scripts/image_resolver.py register --node-id {node_id} --slot hero --subject {subject} --file {cdn_path}` 注册到 `image-registry.json`
> 4. 将图片下载到课件目录 `assets/hero/{node_id}-hero.png`，并在 `index.html` 的 `<section class="hero">` 中插入 `<img>` 标签
> 5. 重新 commit + push
>
> **区分**：课件生成阶段（AI Skill 自动化）严禁 image_gen 生成 Hero 图；维护者补充阶段（人工/半自动）允许 image_gen 生成后审核注册。

> ⚠️ **HTML 引用铁律（v6.3 新增，v7.2 扩展）**：当 Hero 图精确命中时，**必须以 `<img>` 标签嵌入**。支持两种嵌入方式：
>
> - **方式 A**（推荐新建课件）：放在 `<section class="hero">` 内部，`<h1>` 之前，class 为 `hero-img`
> - **方式 B**（批量注入兼容）：放在 hero 容器闭合标签之后，class 为 `hero-cover-img`，用 `<!-- hero-cover -->` 标记
>
> ```html
> <!-- ✅ 方式 A：hero 图在容器内部 -->
> <section class="hero" id="hero">
>   <img src="./assets/hero/math-m-linear-function-hero.png" class="hero-img" alt="一次函数知识结构图">
>   <h1>一次函数</h1>
>   ...
> </section>
>
> <!-- ✅ 方式 B：hero 图在容器外部（批量注入脚本使用） -->
> <section class="hero" id="hero">
>   <h1>一次函数</h1>
>   ...
> </section>
> <!-- hero-cover --><img class="hero-cover-img" src="assets/xxx-hero.png" alt="hero" loading="lazy"><!-- /hero-cover -->
>
> <!-- ✅ 正确：hero 图未命中，不插入 img 标签，留空等待补充 -->
> <section class="hero" id="hero">
>   <h1>一次函数</h1>
>   <!-- hero 图待补充：node_id=math-m-linear-function -->
>   ...
> </section>
>
> <!-- ❌ 错误：使用了别的课件的 hero 图 -->
> <section class="hero" id="hero">
>   <img src="./assets/hero/math-m-quadratic-function-hero.png" class="hero-img">
>   <h1>一次函数</h1>
> </section>
> ```

| 图片类型 | 定义 | prompt 策略 | 示例 |
|:---|:---|:---|:---|
| **Hero 图（知识结构信息图）** | 展示本课完整知识结构的信息图/概念图/思维导图 | "【课题名】知识结构信息图，中心主题为【核心概念】，分支包括【要点1】【要点2】【要点3】，清晰教育信息图风格，配色明快" | 数学课："一次函数知识结构信息图，中心主题 y=kx+b，分支展示：定义与表达式、k和b的意义、图像特征（过原点/不过原点）、实际应用，配色明快清晰的教育信息图" |
| **Scene 图（情境/应用图）** | 知识点对应的生活场景、实验情境、历史场景 | "【具体场景】的教育插画，【风格描述】" | "出租车计价器显示随距离线性增长的费用，窗外是城市街道，教育插画风格" |
| **Experiment 图（实验图）** | 实验装置、实验过程、观察场景 | "【实验名称】实验装置/场景，科学教育风格" | "植物光合作用实验，水草在烧杯中释放气泡，学生用放大镜观察" |
| **Concept 图（概念可视化）** | 单个核心概念的可视化解释 | "【概念名称】可视化图，标注清晰" | "压强概念可视化：同一人穿雪鞋vs不穿雪鞋的受力面积对比" |

**触发条件与生图位置**：

| 条件 | 生图位置 | prompt 策略 | 示例 |
|:---|:---|:---|:---|
| **所有课件的 Hero 区** | Hero 区（`<section class="hero">`）内部 | "【课题名】知识结构信息图，中心主题为【核心概念】，分支包括【N个要点】，清晰教育信息图风格" | 物理课："压强知识结构信息图，中心主题 p=F/S，分支展示：定义、公式推导、增大减小压强的方法、液体压强、大气压强，教育信息图风格" |
| **文科 ABT 情境导入** | 模块导入卡片（非 Hero 区） | "一幅描绘【场景】的【风格】插画，教育类，清晰明亮" | 历史课："一幅描绘丝绸之路商队穿越沙漠的水彩插画，远处有雪山和古城，教育风格" |
| **语文诗词/散文意境** | 课文赏析模块 | "【诗词名】意境图，中国水墨风格，【具体意象】" | "静夜思意境图，中国水墨风，月光洒在窗前，游子独坐思乡" |
| **历史场景还原** | 时间线节点 / 史料对读区 | "【历史事件】场景插画，历史教育风格" | "商鞅变法场景，秦国城门立木取信，围观百姓，教育插画风格" |
| **地理地貌/气候** | 地图标注区 / 成因分析模块 | "【地理现象】示意图，科学教育风格" | "板块碰撞形成喜马拉雅山脉的示意图，剖面图风格，标注关键构造" |
| **生物结构/过程** | 结构讲解区 | "【生物结构/过程】科学插图，标注清晰" | "植物细胞结构图，标注细胞壁、叶绿体、液泡，教育风格" |
| **角色任务型情境** | 角色介绍卡 | "一个【角色身份】的卡通形象，友好亲切" | "一个穿着探险服的中学生卡通形象，手持放大镜" |

**🖼️ Image Vault — 远程预制图片库（v7.3 简化架构）**：

> 📌 **核心原则**：TeachAny 为每个知识点预生成 **1 张 Hero 知识结构主图 + 3-4 张插图**（scene / experiment / concept / abt-intro），由项目维护者统一生成并存储在**独立的远程图片仓库**中，通过 jsDelivr CDN 全球加速分发。
>
> **v7.3 架构（方案 Y+）**：图片元信息**统一存储于 `skill/assets/image-registry.json`**，通过 `match_nodes` 字段反查与 `node_id` 的关联，不再额外维护 `data/knowledge-points/` 镜像 JSON。知识点的中文名/学科/学段等元信息改用 `skill/data/kp-md-manifest.json`，避免重复与冲突。
>
> ```json
> // image-registry.json 中的单条样本
> {
>   "id": "math-quadratic-function-hero",
>   "file": "math/quadratic-function-hero.png",
>   "url": "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/quadratic-function-hero.png",
>   "subject": "math",
>   "slot": "hero",
>   "match_nodes": ["math-m-quadratic-function", "math-h-quadratic-function"],
>   "prompt": "...",
>   "generator": "image_gen"
> }
> ```
>
> **数据源（唯一）**：
> 1. **`skill/assets/image-registry.json`** — Hero / 插图统一查询入口
> 2. **`skill/data/kp-md-manifest.json`** — 知识点元数据与本地 MD 路径（不参与图片查找，仅供制作时查询知识点信息）
>
> **好处**：
> - 🎯 单一数据源，去重、避免冲突
> - 🚀 AI 直接 grep `match_nodes` 命中，无需多入口降级
> - 💰 节省用户 `image_gen` 积分（已有预制图无需重新生成）
> - 🌍 全球 CDN 边缘节点加速，任何地区用户秒级获取

**远程存储架构**：
```
┌─────────────────────────────────────────────────────────────┐
│  GitHub 仓库: weponusa/teachany-images（独立仓库）          │
│  ├── math/quadratic-function-hero.png                       │
│  ├── math/quadratic-scene.png                               │
│  ├── math/linear-function-hero.png                          │
│  ├── biology/photosynthesis-hero.png                        │
│  ├── ...（按学科/知识点组织，预计 1500+ 图片）               │
│  └── README.md（图片清单与生成记录）                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ jsDelivr CDN 加速
                       ▼
  https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/
  例：.../math/quadratic-function-hero.png
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TeachAny Skill（用户安装的部分）                            │
│  └── assets/image-registry.json  ← 轻量索引（~50KB）        │
│       每条记录包含 url 字段指向 CDN 地址                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ AI 制作课件时按需 fetch
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  课件目录（v6.9 分目录结构）                                 │
│  ├── assets/hero/{node_id}-hero.png  ← Hero 图专用          │
│  ├── assets/illustrations/*.png      ← 插图专用              │
│  └── index.html  ← <img src="./assets/hero/...">           │
└─────────────────────────────────────────────────────────────┘
```

**CDN URL 构成规则**：
```
https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{filename}
```
| 变量 | 说明 | 示例 |
|:---|:---|:---|
| `{subject}` | 学科目录名 | `math`, `biology`, `history` |
| `{filename}` | 图片文件名 | `quadratic-hero.png`, `photosynthesis-experiment.png` |

> 📌 **备用 CDN**（jsDelivr 不可用时自动切换）：
> - `https://raw.githubusercontent.com/weponusa/teachany-images/main/{subject}/{filename}`
> - `https://ghfast.top/https://raw.githubusercontent.com/weponusa/teachany-images/main/{subject}/{filename}`（中国大陆加速）

**image-registry.json 关键字段（v7.0 角色：全局索引/备查，非第一入口）**：
| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `id` | 图片唯一标识 | `"math-quadratic-hero"` |
| `url` | **CDN 完整地址（v5.37 新增，首选）** | `"https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/quadratic-hero.png"` |
| `file` | 远程仓库内相对路径（用于构建 URL） | `"math/quadratic-hero.png"` |
| `match_nodes` | 匹配的课件 node_id 列表 | `["math-m-quadratic-function"]` |
| `slot` | 图片用途位置 | `"hero"` / `"scene"` / `"experiment"` / `"concept"` / `"abt-intro"` |
| `tags` | 模糊匹配标签 | `["quadratic-function", "parabola"]` |
| `prompt` | 生成时使用的 prompt | 中国课标课程用中文 prompt，国际课程用英文 prompt（见 Prompt 语言规则） |

**生图执行流程（v7.0 重构 — 知识点 JSON 优先）**：
```text
1. AI 在编写 HTML 课件时识别需要图片的位置和 slot 类型

2. 【Hero 图（slot=hero）—— 严格一一对应，不降级】
   第一入口：读取知识点 JSON 的 images.hero 字段
   → images.hero 非 null：拼接 CDN URL 下载到课件 assets/hero/{node_id}-hero.png
   → images.hero 为 null：备查 image-registry.json（slot=hero + match_nodes 精确匹配）
   → 两处均未命中：**留空**，不生成、不模糊匹配、不用别的课件的 hero 图
   → HTML 中不插入 <img>，在注释中标注"hero 图待补充"
   → Completeness Gate 中标注"Hero 图未命中，需人工补充"
   ⛔ Hero 图绝对不走 image_gen 生成、不走 SVG 降级、不走模糊匹配

3. 【插图（slot=scene/experiment/concept/abt-intro）—— 完整降级链】
   3a. 【第一级：知识点 JSON 预制插图】
       读取知识点 JSON 的 images.illustrations 数组
       → 有匹配 slot 的记录：拼接 CDN URL 下载到课件 assets/illustrations/{知识点ID}-{slot}.png
       → 无匹配：进入 3b

   3b. 【第二级：image-registry.json 备查】
       读取 image-registry.json，按 match_nodes + slot 精确匹配
       → 命中：从 CDN url 字段下载到课件 assets/illustrations/{知识点ID}-{slot}.png
       → 若精确未命中，按 subject + tags 模糊匹配
       → 命中：同上下载 + 嵌入（在注释中标注"模糊匹配，建议人工确认"）
       → 若 CDN 主域不可达，自动切换备用域（见上方备用 CDN 列表）

   3c. 【第三级：image_gen 实时生成】
       若知识点 JSON 和 Image Vault 均未命中，调用 image_gen 工具实时生成
       → prompt 遵循上方 Prompt 语言规则
       → 图片保存到课件 assets/illustrations/{知识点ID}-{slot}.png
       → 每张插图必须明确绑定到课件中的具体知识点

   3d. 【第四级：代码生成 SVG 信息图】
       若以上三级均不可用（离线环境 / 积分耗尽 / 工具不存在），
       AI 必须用 HTML 内联代码生成静态信息图（SVG / Canvas / CSS）

4. 在 HTML 中以 <img src="./assets/hero/{node_id}-hero.png"> 嵌入 Hero 图
   以 <img src="./assets/illustrations/{知识点ID}-{slot}.png"> 嵌入插图
   或以 <svg>...</svg> 内联嵌入（第四级）
```

**第三级 SVG 信息图生成规范**：
```html
<!-- 第三级降级：代码生成的 SVG 知识结构图 -->
<div class="teachany-svg-infographic" data-node-id="math-m-linear-function">
  <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" 
       style="width:100%;max-width:800px;margin:0 auto;display:block;">
    <!-- 中心主题节点 -->
    <rect x="300" y="250" width="200" height="60" rx="12" fill="#4A90D9" />
    <text x="400" y="285" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">y = kx + b</text>
    <!-- 分支节点（至少4个核心知识点） -->
    <!-- 连接线 -->
    <!-- 关键公式/术语标注 -->
  </svg>
</div>
```

| SVG 规范 | 要求 |
|:---|:---|
| **最少节点数** | 中心主题 1 个 + 分支节点 ≥ 4 个 |
| **必含元素** | 核心概念、层级关系连线、关键公式/术语 |
| **配色** | 与课件 `--primary-color` 一致，渐变色区分层级 |
| **字体** | `font-family: system-ui, -apple-system, sans-serif` |
| **尺寸** | `viewBox="0 0 800 600"`，`width: 100%; max-width: 800px` |
| **适用场景** | Hero 区知识结构图、概念关系图、流程图 |

**Image Vault 统一图片发现（v6.3 重构 — 与 `knowledge_layer.py` 同构）**：

> 📌 **核心变更**：伪代码已实现为可执行脚本 `scripts/image_resolver.py`，与 `knowledge_layer.py` 采用相同的多评分匹配 + 别名支持 + 降级链设计。详细规范见 `docs/IMAGE-DISCOVERY-SPEC.md`。

**AI 制作课件时的图片发现流程（Phase 0.5 必做，v7.3 简化版）**：

```text
1. 读取课件 manifest.json → 获取 node_id, subject, grade, curriculum, stage
2. 【唯一入口】读取 skill/assets/image-registry.json 的 images[]
   → 在 match_nodes 中反查 node_id
3. 分两类处理图片需求：

   ┌─────────────────────────────────────────────────────────────────┐
   │ A. Hero 图（slot=hero）—— 严格一一对应，不降级                  │
   ├─────────────────────────────────────────────────────────────────┤
   │ registry 中 slot=hero + match_nodes 精确匹配                     │
   │ 命中 → 拼 CDN URL 下载到 assets/hero/{node_id}-hero.png          │
   │ 未命中 → 留空，不生成、不模糊匹配                                │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │ B. 插图（slot≠hero）—— 完整降级链                               │
   ├──────────┬──────────────────────────────────────┬───────┐       │
   │ 优先级   │ 匹配条件                              │ 来源  │       │
   ├──────────┼──────────────────────────────────────┼───────┤       │
   │ 第一级   │ image-registry 精确匹配（node+slot）  │ 注册  │       │
   │ 第二级   │ image-registry 模糊匹配（subject+tags）│ 注册  │       │
   │ 第三级   │ image_gen 实时生成                     │ 生成  │       │
   │ 第四级   │ SVG 代码内联                           │ 降级  │       │
   └──────────┴──────────────────────────────────────┴───────┘       │
   └─────────────────────────────────────────────────────────────────┘

4. 每张插图必须绑定到课件中的具体知识点，文件名格式：
   {知识点ID}-{slot}.png（如 taxi-meter-scene.png、photosynthesis-experiment.png）

5. 在 HTML 中：
   Hero 图 → <img src="./assets/hero/{node_id}-hero.png" class="hero-img">
   插图 → <img src="./assets/illustrations/{知识点ID}-{slot}.png" alt="描述">
   SVG → <svg>...</svg> 内联嵌入

6. ⚠️ 新生成的插图（第三级）通过 image_resolver.py register 反哺 image-registry.json
   → 下次同 node_id 课件不再重复生成
```

**脚本工具链**（与 `knowledge_layer.py` 同级）：
```bash
# 查找匹配图片（核心）
python3 scripts/image_resolver.py resolve --node-id {node_id} --slot hero --subject {subject} --json

# 注册新生成的图片（反哺 registry）
python3 scripts/image_resolver.py register --node-id {node_id} --slot hero --subject {subject} --file {cdn_path}

# 审计 registry 覆盖率
python3 scripts/image_resolver.py audit

# 迁移旧格式图片
python3 scripts/image_resolver.py migrate [--execute]
```

**CDN 下载到课件目录的方法（v6.9 分目录）**：
```bash
# Hero 图下载到 assets/hero/（推荐）
mkdir -p assets/hero assets/illustrations
curl -fsSL "{url}" -o "assets/hero/{node_id}-hero.png"

# 插图下载到 assets/illustrations/
curl -fsSL "{url}" -o "assets/illustrations/{知识点ID}-{slot}.png"

# 备用 CDN（jsDelivr 不可用时自动切换）
# 1. https://raw.githubusercontent.com/weponusa/teachany-images/main/{subject}/{filename}
# 2. https://ghfast.top/https://raw.githubusercontent.com/weponusa/teachany-images/main/{subject}/{filename}
```

**生图质量参数**（Level 2 `image_gen` 实时生成时使用）：
| 参数 | 推荐值 | 说明 |
|:---|:---|:---|
| `size` | `1024x1024` | 正方形插图 |
| `quality` | `medium` | 平衡质量与速度 |
| `style` | `natural` | 教育场景优先自然风格 |

**降级策略总结**：
- **Level 1（首选）**：Image Vault 远程预制图 — 从 CDN 按需下载，零积分消耗
- **Level 2（次选）**：`image_gen` 实时生成 — 消耗用户积分，但保证 AI 级图片质量；**生成后自动反哺 registry**
- **Level 3（保底）**：代码生成 SVG 信息图 — 零网络依赖、零积分消耗，课件开箱即有信息量
- ⚠️ **绝不因为图片不可用而省略整个视觉区域** — Level 3 确保任何环境下课件都有可用的知识可视化内容
- ⚠️ **绝不使用空白占位符 + "此处建议插入..."的被动模式** — 这是 v5.37 废弃的旧行为
- ⚠️ **禁止在 HTML 中硬编码不存在的图片路径** — 必须先通过 registry 发现或 image_gen 生成

#### 10.4.2 AI 主动生视频规范（课件生成阶段）

> 当课件内容涉及**过程性变化**（理科实验、地理变化、历史演变、生物过程），AI 应评估是否适合生成短视频。

**适用场景**：

| 场景类型 | 示例 | 视频类型 | 推荐时长 |
|:---|:---|:---|:---|
| **理科实验过程** | 电解水、酸碱中和 | 实验步骤动画 | 10-20 秒 |
| **地理变化过程** | 板块漂移、冰川消融、四季更替 | 地球科学动画 | 15-30 秒 |
| **生物生命过程** | 细胞分裂、种子萌发、心脏跳动 | 生物过程动画 | 10-20 秒 |
| **历史演变** | 领土变迁、城市发展 | 时间推移动画 | 15-30 秒 |
| **数学动态变化** | 函数图像变化、几何变换 | 参数动画 | 10-15 秒 |

**执行策略**：
1. **🥇 首选 CSS/JS/Canvas/SVG 交互动画**：对于参数可调的过程（函数图像变化、简单物理模拟、几何变换等），直接在 HTML 课件中用交互组件实现，学生可拖拽参数、点击触发、实时观察变化
2. **🥈 次选 Remotion 生成视频（L2）**：如果 Generation Gate 标注 L2="需要"，且内容为多步骤连续过程（如细胞分裂全过程），通过 Remotion 生成教学动画
3. **🥉 保底 `<video>` 嵌入**：真实实验录像、外部视频素材等交互无法覆盖的内容，使用 `<video>` 标签嵌入

**视频嵌入规范**（⚠️ 硬规则，详见 10.2.4）：

> 视频**必须嵌入到对应知识模块的 section 内部**。**优先使用 CSS/JS/Canvas/SVG 交互动画**演示过程性变化；仅当交互无法覆盖时，使用 `<video controls preload="metadata" playsinline>` + `<source>` 标签静态嵌入，外包 `.video-player` 容器。**禁止**仅用 JS 动态创建视频元素。

```html
<!-- AI 生成的教学短视频 — 必须嵌入到对应知识模块的 section 内部 -->
<!-- ⚠️ 优先用 CSS/JS/Canvas/SVG 交互动画代替静态视频 -->
<div class="video-player" data-context="物理·电解水·实验过程">
  <video controls preload="metadata" playsinline width="100%">
    <source src="./assets/video/experiment-demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</div>
<p class="video-caption">🎬 电解水实验过程演示</p>
```

#### 10.4.3 Pillow 本地生图字体规范（v6.1 新增）

> ⚠️ **本节仅适用于 AI 使用 Python Pillow 库在本地生成教学配图的场景**（如 Hero 图、反应对比图、概念可视化图等）。`image_gen` 工具生图不受此规则约束。

**问题背景**：部分中文字体（如 Hiragino Sans GB、STHeiti）不包含 Unicode 上下标字符（₂₃⁺⁻↑↓等），Pillow 渲染时会产生 `.notdef` 方框（⊠），导致化学公式、数学公式在图片中显示为乱码。

**字体选择铁律**：

| 优先级 | 字体 | 路径（macOS） | Unicode 上下标 | 中文支持 | 适用场景 |
|:---:|:---|:---|:---:|:---:|:---|
| 🥇 | **Arial Unicode MS** | `/Library/Fonts/Arial Unicode.ttf` | ✅ 完美 | ✅ | **理科课件首选**（化学/物理/数学公式） |
| 🥈 | **Noto Sans CJK SC** | 系统安装或 `fonts-noto-cjk` | ✅ | ✅ | Linux 环境首选 |
| 🥉 | **PingFang SC** | `/System/Library/Fonts/PingFang.ttc` | ⚠️ 部分 | ✅ | 文科课件（无公式符号时可用） |
| ❌ | ~~Hiragino Sans GB~~ | — | ❌ 方框 | ✅ | **禁用于含公式的图片** |
| ❌ | ~~STHeiti~~ | — | ❌ 方框 | ✅ | **禁用于含公式的图片** |

**禁用字体清单**（含公式/下标符号时 ⛔ 禁用）：
- `Hiragino Sans GB`（U+2082 ₂、U+2083 ₃、U+207A ⁺、U+207B ⁻ 等全部渲染为 ⊠）
- `STHeiti Light` / `STHeiti Medium`（同上）
- `Heiti SC`（同上）

**字体降级链（跨平台）**：

```python
# TeachAny Pillow 字体降级链 —— 理科课件（含化学/数学公式符号）
FONT_FALLBACK_CHAIN_STEM = [
    "/Library/Fonts/Arial Unicode.ttf",           # macOS 首选
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",  # macOS 备选
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",  # Ubuntu/Debian
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",       # Fedora/Arch
    "/System/Library/Fonts/PingFang.ttc",          # macOS 保底（文科）
]

def get_pillow_font(size=36):
    """按降级链查找第一个可用字体"""
    from PIL import ImageFont
    for path in FONT_FALLBACK_CHAIN_STEM:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    raise RuntimeError("未找到支持 Unicode 上下标的中文字体，请安装 Arial Unicode 或 Noto Sans CJK")
```

**四场景字体对照表**：

| 场景 | 推荐字体 | 备注 |
|:---|:---|:---|
| **HTML 课件** | CSS `font-family` 降级链：`'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif` | 浏览器自动处理 Unicode 字符，无需额外关注 |
| **Pillow 本地生图** | Arial Unicode MS → Noto Sans CJK → PingFang SC | ⚠️ **本节重点**：含公式时必须用 Arial Unicode |
| **Remotion 渲染** | `fontFamily: "'Noto Sans SC', 'Noto Sans CJK SC', 'PingFang SC', sans-serif"` | Linux CI 需预装 `fonts-noto-cjk` |
| **PPTX 导出** | `python-pptx` 默认用系统字体，中文指定"宋体"或"微软雅黑" | 导出脚本不生图，只消费 assets/ |

