# TeachAny 统一图片资源发现规范 v1.0

> 本文档是 TeachAny 课件图片资源发现的**唯一权威标准**。  
> 所有 AI Skill、脚本工具、批量生成流程均须遵守。  
> 设计原则：**与 `knowledge_layer.py` 的知识发现机制同构**。

---

## 一、设计哲学

### 1.1 核心问题

旧体系存在 **5 层碎片化**的图片系统：

| 层 | 数据源 | 问题 |
|:---|:---|:---|
| `image-registry.json` | CDN 索引 | 仅覆盖 11/326 课件 |
| `image-vault/` | 本地备份 | 与 CDN 索引脱节，无匹配逻辑 |
| `registry.json` hero_image 字段 | `rebuild-index.py` 自动检测 | 只检测文件名，不知道匹配哪个 node |
| 课件 `assets/` 目录 | 课件本地图片 | 命名不统一 |
| `hero-review/` | 批量生成暂存区 | 命名错误，位置错误 |

**结果**：AI 制作课件时无法可靠地找到预制图片，只能硬编码 `<img src="assets/xxx.png">`。

### 1.2 统一方案：与知识层同构

| 知识层（已实现） | 图片层（本规范） |
|:---|:---|
| `_graph.json` — 知识图谱数据 | `image-registry.json` — 图片索引数据 |
| `knowledge_layer.py find-node` — 多评分匹配 | `image_resolver.py resolve` — 多评分匹配 |
| `node_id` + `subject` + `name` + `grade` 匹配 | `node_id` + `slot` + `subject` + `tags` 匹配 |
| `NODE_ID_ALIASES` 别名支持 | `NODE_ID_ALIASES` 复用同一套别名 |
| `find_tree_node()` 返回带分数的匹配列表 | `resolve_image()` 返回带分数的匹配列表 |
| 降级链：精确→模糊→交叉→年级加分 | 降级链：精确→模糊→image_gen→SVG |

---

## 二、数据架构

### 2.1 image-registry.json（图片层的"_graph.json"）

这是图片资源发现的**单一数据源**（Single Source of Truth），与 `_graph.json` 在知识层的角色完全对应。

```
skill/assets/image-registry.json
```

**数据结构**：

```jsonc
{
  "version": "3.0",           // v3.0：统一发现机制
  "updated": "2026-04-29",
  "cdn_base": "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main",
  "cdn_fallbacks": [...],
  "slots": { "hero": "...", "scene": "...", ... },
  "images": [
    {
      "id": "math-linear-hero",          // 唯一标识
      "file": "math/linear-hero.png",    // CDN 相对路径
      "url": "https://cdn.../linear..",  // CDN 完整 URL
      "subject": "math",                 // 学科（用于模糊匹配）
      "tags": ["linear-function", ...],  // 标签（用于模糊匹配）
      "slot": "hero",                    // 图片类型（精确匹配条件之一）
      "match_nodes": ["math-m-linear-function"],  // node_id 列表（精确匹配条件之一）
      "prompt": "...",                   // 生成时的 prompt
      "local_path": null                 // 批量生成后自动填充的本地路径
    }
  ]
}
```

### 2.2 课件本地 assets/（图片层的"课件目录"）

每个课件的 `assets/` 目录是图片的**最终落地点**：

```
<course-dir>/
├── index.html
├── manifest.json
└── assets/
    ├── <abbrev>-hero.png     # 由 resolver 从 CDN 下载或 image_gen 生成
    ├── <abbrev>-scene.png
    └── <abbrev>-ext.png
```

命名规范遵循 `IMAGE-NAMING-SPEC.md`。

### 2.3 hero-review/（批量生成暂存区 → 废弃）

`hero-review/` 目录的命名 `math_grade7_xxx.png` 不符合规范。  
本规范实施后，批量生成脚本应直接输出到：
1. **CDN 仓库的正确路径**：`teachany-images/{subject}/{abbrev}-{slot}.png`
2. 同时更新 `image-registry.json`

---

## 三、匹配算法（与 `find_tree_node()` 同构）

### 3.1 评分规则

```python
def resolve_image(node_id, slot, subject=None, tags=None, grade=None):
    """
    与 knowledge_layer.py 的 find_tree_node() 采用相同的多评分匹配策略。
    返回按分数降序排列的匹配结果列表。
    """
    matches = []
    
    for img in registry["images"]:
        score = 0
        
        # ── 第一梯队：精确匹配（与 find_tree_node 的 node_id 精确匹配对应）──
        
        # 1. node_id + slot 精确匹配 → 500 分
        if node_id in img["match_nodes"] and img["slot"] == slot:
            score += 500
        
        # 2. node_id 精确但 slot 不匹配（同知识点不同位置的图也可降级使用）→ 300 分
        elif node_id in img["match_nodes"]:
            score += 300
        
        # ── 第二梯队：别名匹配（与 find_tree_node 的 NODE_ID_ALIASES 对应）──
        
        # 3. node_id 别名匹配 + slot 匹配 → 480 分
        if node_id in NODE_ID_ALIASES:
            for alias in NODE_ID_ALIASES[node_id]:
                if alias in img["match_nodes"] and img["slot"] == slot:
                    score += 480
        
        # ── 第三梯队：模糊匹配（与 find_tree_node 的名称模糊匹配对应）──
        
        # 4. subject + slot + tags 交集 → 200 + tag重叠数×50
        if subject and img["subject"] == subject and img["slot"] == slot:
            if tags:
                overlap = len(set(tags) & set(img.get("tags", [])))
                if overlap > 0:
                    score += 200 + overlap * 50
        
        # 5. subject + slot 匹配（无 tag 信息时）→ 100 分
        if subject and img["subject"] == subject and img["slot"] == slot:
            if score == 0:  # 前面都没命中
                score += 100
        
        # ── 第四梯队：node_id 交叉匹配（与 find_tree_node 的名称交叉匹配对应）──
        
        # 6. node_id 包含在 img 的 tags 中 → 80 分
        if node_id:
            node_parts = node_id.replace("-", " ").split()
            for part in node_parts:
                if len(part) >= 3 and part in " ".join(img.get("tags", [])):
                    score += 40
        
        # ── 加分项 ──
        
        # 7. grade 匹配（如果 registry 中记录了 grade 信息）→ 30 分
        if grade and img.get("grade") == grade:
            score += 30
        
        if score > 0:
            matches.append({"image": img, "score": score})
    
    matches.sort(key=lambda m: -m["score"])
    return matches
```

### 3.2 评分对照表

| 分数 | 条件 | 对标知识层 |
|:---:|:---|:---|
| 500 | `node_id + slot` 精确匹配 | `find_tree_node`: node_id 精确匹配 (500) |
| 480 | 别名匹配 + slot | `find_tree_node`: 别名反向匹配 (480) |
| 300 | `node_id` 精确但 slot 不同 | `find_tree_node`: 名称精确匹配 (300) |
| 200-400 | `subject + slot + tags` 模糊 | `find_tree_node`: 名称模糊匹配 (200/150) |
| 100 | `subject + slot` 仅学科匹配 | `find_tree_node`: 交叉匹配 (100) |
| 40-80 | node_id 部分词在 tags 中 | `find_tree_node`: 名称关键词交叉 (50) |
| 30 | grade 匹配 | `find_tree_node`: 年级匹配 (30) |

### 3.3 三级降级链

```
┌─────────────────────────────────────────────────┐
│  Level 1：image-registry.json CDN 预制图        │
│  resolve_image() score ≥ 500 → 精确命中          │
│  score ≥ 200 → 模糊命中（提示 AI 确认是否合适）  │
│  → 从 CDN 下载到课件 assets/ 目录               │
├─────────────────────────────────────────────────┤
│  Level 2：image_gen 实时生成                     │
│  registry 完全未命中 → 调用 image_gen             │
│  → 图片保存到课件 assets/ 目录                   │
│  → 生成后自动注册到 image-registry.json          │ ← 新增
├─────────────────────────────────────────────────┤
│  Level 3：SVG 代码内联生成                       │
│  image_gen 不可用 → 直接写 SVG 代码              │
│  → 内联到 HTML 中                                │
└─────────────────────────────────────────────────┘
```

**关键改进**：Level 2 生成后**自动反哺** `image-registry.json`，下次同一 node_id 的课件不再重复生成。这与知识层的 `link_courseware_to_tree()` 将课件关联到树节点后更新 status 的逻辑一致。

---

## 四、AI Skill 调用规范（替代硬编码）

### 4.1 旧方式（❌ 硬编码）

```html
<!-- 课件模板中硬编码图片路径 -->
<img src="assets/linear-hero.png" alt="一次函数">
```

**问题**：AI 必须"猜"文件名，如果文件不存在就是裂图。

### 4.2 新方式（✅ 发现式）

AI 制作课件时按以下流程操作：

```
Phase 0.5 必做检查点（与知识层一致）：

1. 读取 manifest.json → 获取 node_id, subject, grade
2. 调用 image_resolver.py resolve --node-id {node_id} --slot hero --subject {subject}
3. 根据返回结果：
   a. score ≥ 500：下载 CDN 图片 → <img src="assets/{filename}">
   b. score ≥ 200：下载但在注释中标注"模糊匹配，可能需替换"
   c. 无匹配：调用 image_gen → 保存到 assets/ → 自动注册
   d. image_gen 不可用：生成 SVG 代码内联
```

### 4.3 SKILL_CN.md 中的指令格式

```markdown
## 图片资源发现（Phase 0.5 必做）

在编写课件 HTML 之前，AI 必须执行以下图片发现流程：

1. **读取** `skill/assets/image-registry.json`
2. **匹配**：用课件的 `node_id` + `slot`(hero/scene/...) 在 registry 中查找
   - 精确匹配（node_id 在 match_nodes 中 + slot 相同）→ 直接使用
   - 模糊匹配（同学科 + 相关 tags）→ 确认后使用
3. **获取**：从 CDN URL 下载到课件 `assets/` 目录
4. **降级**：未命中 → image_gen 生成 → SVG 代码
5. **反哺**：新生成的图片信息追加到 image-registry.json

⚠️ 禁止在 HTML 中硬编码不存在的图片路径
⚠️ 禁止跳过图片发现直接调用 image_gen
```

---

## 五、脚本工具链

### 5.1 image_resolver.py（新建，与 knowledge_layer.py 同级）

```
scripts/image_resolver.py

子命令：
  resolve    -- 查找匹配图片（核心功能）
  register   -- 注册新图片到 registry
  audit      -- 审计 registry 覆盖率
  migrate    -- 迁移旧格式图片（hero-review/ → 正确位置）
```

**使用示例**：

```bash
# 查找一次函数的 hero 图
python scripts/image_resolver.py resolve \
  --node-id math-m-linear-function \
  --slot hero \
  --subject math

# 输出（JSON）：
{
  "matches": [
    {
      "score": 500,
      "image_id": "math-linear-hero",
      "url": "https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/linear-hero.png",
      "local_filename": "linear-hero.png",
      "slot": "hero"
    }
  ],
  "action": "download",
  "download_url": "https://cdn.../math/linear-hero.png"
}

# 注册新生成的图片
python scripts/image_resolver.py register \
  --node-id eng-e-daily-expressions \
  --slot hero \
  --subject english \
  --file english/daily-expressions-hero.png \
  --prompt "..."

# 审计覆盖率
python scripts/image_resolver.py audit
# 输出：
# Total courses: 326
# With hero image:  33 (10.1%)
# In CDN registry:  22 ( 6.7%)
# Missing hero:    293 (89.9%)
```

### 5.2 rebuild-index.py 集成

`detect_images()` 增加一步：**检查 image-registry.json 是否有匹配**。

```python
# 旧逻辑：只看本地文件
hero, scene = detect_images(course_dir)

# 新逻辑：先查 registry，再查本地
def detect_images_unified(course_dir, manifest):
    node_id = manifest.get("node_id", "")
    subject = manifest.get("subject", "")
    
    # 1. 先查 image-registry.json（CDN 预制图）
    registry_match = resolve_image(node_id, "hero", subject)
    if registry_match and registry_match[0]["score"] >= 500:
        hero_url = registry_match[0]["image"]["url"]
        # 记录 CDN URL 而不是本地路径
        hero = f"cdn:{hero_url}"
    else:
        # 2. 降级：查本地 assets/
        hero, _ = detect_images(course_dir)
    
    return hero, scene
```

### 5.3 batch-hero-openrouter.py 改造

改造批量生成脚本，使其：
1. 输出到 `teachany-images/{subject}/` 而不是 `hero-review/`
2. 命名遵循 `{abbrev}-hero.png` 而不是 `{subject}_{grade}_{node_id}.png`
3. 生成后自动调用 `image_resolver.py register` 注册到 registry

---

## 六、迁移计划

### 6.1 hero-review/ → 正确位置

24 张已生成的图片需要迁移：

```python
# image_resolver.py migrate 子命令将执行：
# 1. 解析旧文件名：math_grade7_math-mid-linear-function.png
#    → node_id: math-mid-linear-function → 查 registry.json 获取 course_id
#    → subject: math
#    → abbrev: 从 course_id 提取核心词（如 linear-function → linear）
# 2. 重命名：linear-hero.png
# 3. 复制到：teachany-images/math/linear-hero.png（CDN 仓库）
# 4. 复制到：examples/<course-dir>/assets/linear-hero.png（课件本地）
# 5. 注册到 image-registry.json
```

### 6.2 实施步骤

```
Step 1: 创建 image_resolver.py 脚本 ← 本次实施
Step 2: 执行 migrate 子命令迁移 hero-review/
Step 3: 更新 SKILL_CN.md 中的伪代码 → 引用 image_resolver.py
Step 4: 改造 batch-hero-openrouter.py 输出到正确位置
Step 5: rebuild-index.py 集成 detect_images_unified()
Step 6: 批量生成剩余 ~300 张 hero 图
```

---

## 七、与知识层的完整对照表

| 维度 | 知识层 | 图片层 |
|:---|:---|:---|
| **数据源** | `data/{subject}/{domain}/_graph.json` | `skill/assets/image-registry.json` |
| **索引脚本** | `knowledge_layer.py` | `image_resolver.py` |
| **核心函数** | `find_tree_node()` | `resolve_image()` |
| **注册函数** | `link_courseware_to_tree()` | `register_image()` |
| **审计函数** | `knowledge_layer.py audit` | `image_resolver.py audit` |
| **匹配依据** | node_id + subject + name + grade | node_id + slot + subject + tags |
| **评分范围** | 30-500 | 30-500（同一量级） |
| **别名支持** | `NODE_ID_ALIASES` | 复用同一套 `NODE_ID_ALIASES` |
| **降级链** | 脚本执行→JSON读取→web搜索→模型知识 | CDN预制→image_gen→SVG代码 |
| **反哺机制** | `link()` 更新树节点 status=active | `register()` 追加 registry 条目 |
| **调用时机** | Phase 0.5 必做检查点 | Phase 0.5 必做检查点（同阶段） |

---

## 版本信息

- 适用项目：TeachAny v6.x
- 规范版本：v1.0
- 创建日期：2026-04-29
- 前置文档：`IMAGE-NAMING-SPEC.md`（命名规范）、`SKILL_CN.md`（Skill 总规范）
