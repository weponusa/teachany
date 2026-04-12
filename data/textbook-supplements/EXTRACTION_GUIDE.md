# 📖 教材内容提取使用指南

## 背景

TeachAny 需要从三本优质教材中提取教学方法、真实场景、类比、图像等素材，以提升课件生成质量：

| 教材 | 文件大小 | 状态 |
|:---|:---|:---|
| Mathematics All Around | 117.81 MB | 🔄 待提取 |
| Physics: Everyday Phenomena | 66.90 MB | 🔄 待提取 |
| Biology: Life on Earth | 48.72 MB | 🔄 待提取 |

由于文件过大，无法直接处理，需要**分批提取**。

---

## 提取策略

### Phase 1: 自动化提取框架（已完成 ✅）

1. ✅ 创建数据架构：`textbook-supplements/` 目录
2. ✅ 定义数据格式：`schema.md`
3. ✅ 创建模板文件：`teaching_methods.json`、`real_world_scenarios.json` 等
4. ✅ 编写自动化脚本：
   - `extract_textbook_content.py`（Python 提取脚本）
   - `batch_extract_textbooks.sh`（批量处理脚本）

### Phase 2: 分批提取内容（进行中 🔄）

由于 PDF 文件过大，采用**分章节提取**策略：

#### 数学教材提取计划

| 章节 | 页码范围 | 对应知识点 | 优先级 |
|:---|:---|:---|:---|
| Functions | 200-300 | linear-function, quadratic-function | P0 |
| Geometry | 400-500 | geometric-shapes, coordinate-system | P1 |
| Statistics | 600-700 | statistics, probability | P2 |

#### 物理教材提取计划

| 章节 | 页码范围 | 对应知识点 | 优先级 |
|:---|:---|:---|:---|
| Mechanics | 100-200 | pressure, buoyancy, force | P0 |
| Optics | 300-400 | refraction, reflection, lenses | P1 |
| Electricity | 500-600 | current, voltage, circuits | P1 |

#### 生物教材提取计划

| 章节 | 页码范围 | 对应知识点 | 优先级 |
|:---|:---|:---|:---|
| Cells | 50-150 | cell-structure, cell-function | P0 |
| Ecology | 300-400 | photosynthesis, carbon-cycle | P0 |
| Genetics | 200-300 | heredity, DNA | P1 |

### Phase 3: 内容整合（待执行 ⏳）

提取完成后，需要：
1. 将内容映射到 `_graph.json` 的节点 ID
2. 审核和补充提取的数据
3. 提取图像并单独存储
4. 更新 SKILL.md，让 AI 知道如何使用这些数据

---

## 使用方法

### 方案 A：使用自动化脚本（推荐）

```bash
# 1. 设置 MinerU API Token
export MINERU_TOKEN="eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ..."

# 2. 运行批量提取脚本
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource/scripts
./batch_extract_textbooks.sh
```

**说明**：
- 脚本会自动拆分 PDF（使用 qpdf 或 pdftk）
- 逐章节调用 MinerU API 解析
- 将结果保存到 `data/textbook-supplements/{subject}/`

**依赖**：
- `qpdf` 或 `pdftk`（用于拆分 PDF）
- MinerU API Token

### 方案 B：手动提取单个章节

```bash
# 1. 手动拆分 PDF（以数学教材的函数章节为例）
qpdf --pages 01_mathematics_all_around.pdf 200-300 -- \
     --empty --pages 01_mathematics_all_around.pdf 200-300 -- \
     math_functions.pdf

# 2. 调用 Python 脚本解析
python3 scripts/extract_textbook_content.py \
    --pdf math_functions.pdf \
    --subject math \
    --domain functions \
    --output-dir data/textbook-supplements/math/
```

### 方案 C：使用 AI 辅助提取（当前采用）

由于文件过大，可以：

1. **分页截图**：将关键页面截图，用 AI 识别
2. **OCR 提取**：使用 OCR 工具提取文字
3. **手动摘录**：将教材中的典型案例手动录入 JSON

---

## 当前进度

### ✅ 已完成

- [x] 创建 `textbook-supplements/` 目录结构
- [x] 定义 8 种数据格式（teaching_methods、real_world_scenarios 等）
- [x] 创建数学/物理/生物的模板文件
- [x] 编写自动化提取脚本

### 🔄 进行中

- [ ] 数学教材 - Functions 章节提取
- [ ] 物理教材 - Mechanics 章节提取
- [ ] 生物教材 - Cells 章节提取

### ⏳ 待执行

- [ ] 将提取内容映射到 `_graph.json` 节点
- [ ] 提取教材图像并存储
- [ ] 更新 SKILL.md，说明如何使用补充数据
- [ ] 测试 AI 生成课件时是否能正确引用教材素材

---

## AI 如何使用这些数据？

### 1. 在 SKILL.md 中添加引用规则

在 `skill/SKILL_CN.md` 的 "知识图谱查阅" 部分添加：

```markdown
### 查阅教材补充素材（优先）

在读取 `_graph.json` 后，AI 应进一步查阅教材补充数据：

1. **教学方法**：`data/textbook-supplements/{subject}/teaching_methods.json`
   - 获取该学科的典型引入方式、类比策略
   - 优先使用教材中的真实教学方法

2. **真实场景**：`real_world_scenarios.json` 或 `phenomena_library.json`
   - 为 ABT 叙事提供真实案例
   - 避免 AI 编造虚假案例

3. **图像素材**：`image_library.json`
   - 参考教材中的高质量示意图
   - 使用 image_gen 生成类似风格的图像
```

### 2. 示例查询流程

```python
# AI 生成"一次函数"课件时的查询流程

# Step 1: 查阅知识图谱
graph = read_json("data/math/functions/_graph.json")
node = find_node(graph, "linear-function")

# Step 2: 查阅教材补充数据
teaching_methods = read_json("data/textbook-supplements/math/teaching_methods.json")
scenarios = read_json("data/textbook-supplements/math/real_world_scenarios.json")

# Step 3: 筛选相关数据
relevant_methods = filter_by_node(teaching_methods, "linear-function")
relevant_scenarios = filter_by_node(scenarios, "linear-function")

# Step 4: 组装课件
courseware = generate_courseware(
    node=node,
    methods=relevant_methods,
    scenarios=relevant_scenarios
)
```

---

## 注意事项

### 1. 版权和引用

- 教材内容仅用于教育目的
- 所有数据必须标注来源页码
- 图像使用需遵守 Fair Use 原则

### 2. 数据质量

- 提取的内容需人工审核
- 数学公式需验证准确性
- 图像需保持原有清晰度

### 3. 知识图谱映射

- 每条数据必须关联到 `_graph.json` 的节点 ID
- 如果节点不存在，需先在 `_graph.json` 中创建
- 避免创建重复节点

---

## FAQ

**Q: 为什么不直接让 AI 读取整本 PDF？**

A: 文件过大（50-118MB），超出工具处理能力。需要分章节提取。

**Q: MinerU API 是什么？**

A: 一个专业的文档解析服务，支持 PDF、HTML 等格式。用户已有 Token。

**Q: 提取内容如何与现有 `_graph.json` 关联？**

A: 每条提取数据都有 `node_id` 字段，指向 `_graph.json` 中的知识点 ID。

**Q: 图像如何处理？**

A: 图像单独存储在 `images/{subject}/` 目录，JSON 中只存储索引和描述。

**Q: 提取完成后如何使用？**

A: 在 SKILL.md 中添加引用规则，让 AI 知道优先查阅教材补充数据。

---

## 下一步行动

1. **立即可执行**：
   - 使用 `batch_extract_textbooks.sh` 提取数学教材的 Functions 章节
   - 或手动摘录几个典型案例到 JSON 模板中

2. **需要时间**：
   - 完整提取三本教材（预计 2-3 天）
   - 人工审核和补充（预计 1-2 天）
   - 图像提取和存储（预计 1 天）

3. **最终目标**：
   - AI 生成课件时，能自动引用教材中的真实案例和教学方法
   - 课件质量显著提升，更贴近优质教材的教学风格
