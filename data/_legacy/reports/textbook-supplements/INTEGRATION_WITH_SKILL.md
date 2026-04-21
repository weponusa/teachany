# 🔗 教材补充数据与 SKILL 集成说明

## 集成目标

让 AI 在生成课件时，能自动引用教材中的优质素材，提升课件的：
- **真实性**：使用教材中的真实案例，而非 AI 编造
- **教学性**：借鉴教材的教学方法和切入方式
- **可视化**：参考教材的图表设计

---

## 集成方式：在 Phase 0.5 中增加"教材补充数据查阅"步骤

### 当前 Phase 0.5 流程（v5.10）

```
Phase 0.5: 知识层查阅 ⛔ MANDATORY
├── 步骤 1: 定位 Skill 数据目录
├── 步骤 2: 执行知识层检索（优先 knowledge_layer.py）
├── 步骤 3: 提取关键数据（_graph.json, _errors.json, _exercises.json）
├── 步骤 4: 补充读取（仅在摘要不够时）
└── 步骤 5: 处理未命中情况（降级到 Web 搜索或模型知识）
```

### 新增：步骤 3.5 - 查阅教材补充数据（可选增强）

在步骤 3（提取关键数据）和步骤 4（补充读取）之间，新增一个**可选步骤**：

```
步骤 3.5: 查阅教材补充数据（Textbook Supplements）

条件：当 _graph.json 已获取，且希望提升课件质量时

操作：
1. 检查是否有教材补充数据：
   data/textbook-supplements/{subject}/

2. 根据当前节点 ID，查阅相关素材：
   - teaching_methods.json → 教学方法
   - real_world_scenarios.json 或 phenomena_library.json → 真实场景
   - analogies.json → 类比/记忆锚点
   - visual_strategies.json → 可视化策略
   - experiment_designs.json → 实验设计（理科）
   - ecological_cases.json → 生态案例（生物）

3. 筛选匹配当前节点的数据：
   filter_by_node_id(data, current_node_id)

4. 优先使用教材素材：
   - ABT 引入：优先使用教材中的真实场景
   - 记忆锚点：优先使用教材中的类比
   - 实验设计：优先使用教材中的实验步骤
   - 图像参考：参考教材中的可视化策略

输出：
- 如果命中教材素材：标注"已引用教材补充数据（X条）"
- 如果未命中：继续使用 _graph.json 的数据
```

### 降级规则（优先级）

| 优先级 | 数据来源 | 适用场景 |
|:---|:---|:---|
| 1️⃣ | 教材补充数据（textbook-supplements） | 命中且质量高 |
| 2️⃣ | 知识图谱数据（_graph.json） | 教材数据未命中 |
| 3️⃣ | Web 搜索 | 知识图谱也未命中 |
| 4️⃣ | 模型知识 | 所有数据源都不充分 |

**关键原则**：
- 优先使用教材中的真实素材（避免 AI 编造）
- 教材素材仅用于**补充和增强**，不替代核心知识图谱
- 如果教材数据与图谱数据冲突，以图谱数据为准

---

## 使用示例

### 示例 1：数学 - 一次函数课件

```python
# Phase 0.5: 知识层查阅
node_id = "linear-function"
subject = "math"

# 步骤 1-3: 获取知识图谱数据
graph_data = read_json("data/math/functions/_graph.json")
node = find_node(graph_data, node_id)

# 步骤 3.5: 查阅教材补充数据
textbook_scenarios = read_json("data/textbook-supplements/math/real_world_scenarios.json")
relevant_scenarios = [s for s in textbook_scenarios['scenarios'] if node_id in s.get('node_id', [])]

if relevant_scenarios:
    # 优先使用教材中的真实场景
    abt_scenario = relevant_scenarios[0]
    print(f"✅ 使用教材场景: {abt_scenario['title']}")
    print(f"   来源: {abt_scenario['page_reference']}")
else:
    # 降级到图谱数据
    abt_scenario = node['real_world'][0]
    print(f"⚠️  使用图谱数据: {abt_scenario}")

# Phase 1: ABT 引入设计
abt_introduction = f"""
【And】你已经学过正比例函数 y=kx。
【But】现实中很多问题不是从 0 开始的，比如：
  {abt_scenario['context']}
【Therefore】所以需要学习更通用的模型——一次函数 y=kx+b。
"""
```

### 示例 2：物理 - 压强课件

```python
# Phase 0.5: 知识层查阅
node_id = "pressure"
subject = "physics"

# 步骤 1-3: 获取知识图谱数据
graph_data = read_json("data/physics/mechanics/_graph.json")
node = find_node(graph_data, node_id)

# 步骤 3.5: 查阅教材补充数据
phenomena_lib = read_json("data/textbook-supplements/physics/phenomena_library.json")
relevant_phenomena = [p for p in phenomena_lib['phenomena'] if node_id in p.get('node_id', [])]

if relevant_phenomena:
    # 使用教材中的日常现象
    phenom = relevant_phenomena[0]
    print(f"✅ 使用教材现象: {phenom['title']}")
    abt_scenario = phenom['observation']
    cognitive_conflict = phenom['cognitive_conflict']
else:
    # 降级到图谱数据
    abt_scenario = node['real_world'][0]

# Phase 1: ABT 引入 + 认知冲突设计
abt_introduction = f"""
【And】你知道冰面会承受人的重量。
【But】为什么{cognitive_conflict}
【Therefore】今天我们要学习一个新的物理量——压强。
"""
```

### 示例 3：生物 - 光合作用课件

```python
# Phase 0.5: 知识层查阅
node_id = "photosynthesis"
subject = "biology"

# 步骤 3.5: 查阅教材补充数据
eco_cases = read_json("data/textbook-supplements/biology/ecological_cases.json")
relevant_cases = [c for c in eco_cases['cases'] if node_id in c.get('node_id', [])]

if relevant_cases:
    # 使用教材中的生态案例
    case = relevant_cases[0]
    print(f"✅ 使用教材案例: {case['title']}")
    print(f"   数据点: {case['data_point']}")
    
    # ABT 引入
    abt_scenario = f"""
    【And】你知道植物能制造养分。
    【But】亚马逊雨林的树木不仅养活自己，还{case['data_point']}。
    【Therefore】今天我们要揭秘光合作用的秘密。
    """
else:
    # 降级到图谱数据
    abt_scenario = node['real_world'][0]
```

---

## 在 SKILL_CN.md 中的修改建议

### 位置：Phase 0.5 - 步骤 3 和步骤 4 之间

在 **Line 2001** 之后，**Line 2002** 之前插入：

```markdown
#### 步骤 3.5：查阅教材补充数据（可选增强）

> **目的**：优先使用教材中的真实素材，避免 AI 编造案例。

如果步骤 3 已成功获取 `_graph.json` 数据，可进一步查阅教材补充数据以提升课件质量：

```bash
# 检查是否有教材补充数据
ls data/textbook-supplements/{subject}/
```

**查阅顺序**：

1. **教学方法**：`data/textbook-supplements/{subject}/teaching_methods.json`
   - 筛选 `applicable_nodes` 包含当前节点 ID 的条目
   - 用于 ABT 引入、情境设计、记忆锚点

2. **真实场景**：
   - 数学：`real_world_scenarios.json`
   - 物理：`phenomena_library.json`
   - 生物：`ecological_cases.json`
   - 筛选 `node_id` 匹配的条目
   - 用于 ABT 引入、问题驱动设计

3. **类比集合**：`analogies.json`
   - 筛选 `node_id` 匹配的条目
   - 用于"五镜头法"中的"解释"和"比较"环节

4. **可视化策略**：`visual_strategies.json`
   - 筛选 `node_id` 匹配的条目
   - 用于图表设计参考、Mayer 原则应用

5. **实验设计**（理科）：`experiment_designs.json`
   - 筛选 `node_id` 匹配的条目
   - 用于交互实验设计、Canvas 实验

**使用原则**：

- ✅ **优先使用教材素材**：如果教材中有匹配的案例，优先使用（标注出处页码）
- ✅ **教材数据 > 图谱数据 > Web 搜索 > 模型知识**
- ✅ **标注来源**：在课件中注明"参考自《XX教材》第XX页"
- ❌ **不强制要求**：如果教材数据未覆盖该节点，直接使用图谱数据即可
- ❌ **不替代核心图谱**：教材数据仅用于**补充和增强**，不能替代 `_graph.json` 的核心数据

**输出示例**：

```
✅ 已查阅教材补充数据:
  - teaching_methods.json: 命中 2 条
  - real_world_scenarios.json: 命中 1 条
  - analogies.json: 未命中
  → 将优先使用教材中的真实场景和教学方法
```

或

```
⚠️  教材补充数据未覆盖该节点，使用图谱数据
```
```

---

## 当前状态与后续工作

### ✅ 已完成

1. 创建 `textbook-supplements/` 数据架构
2. 定义 8 种数据格式（schema.md）
3. 创建各学科的模板文件
4. 编写提取脚本和使用指南

### 🔄 进行中

- 从三本教材中提取实际内容（待执行）

### ⏳ 待执行

1. **修改 SKILL_CN.md**：在 Phase 0.5 中插入"步骤 3.5"
2. **提取教材内容**：运行 `batch_extract_textbooks.sh`
3. **人工审核**：补充和完善提取的数据
4. **测试集成**：生成几个测试课件，验证 AI 是否能正确引用教材素材

---

## 注意事项

1. **版权合规**：教材内容仅用于教育目的，遵守 Fair Use 原则
2. **数据质量**：提取的内容需人工审核，确保准确性
3. **优先级平衡**：教材数据是**增强层**，不能替代核心知识图谱
4. **可追溯性**：所有教材素材必须标注来源页码

---

## FAQ

**Q: 教材补充数据是否必须？**

A: 不是。这是**可选增强**步骤。如果教材数据未覆盖某个节点，直接使用 `_graph.json` 即可。

**Q: 如何处理教材数据与图谱数据冲突？**

A: 以 `_graph.json` 为准。教材数据仅用于补充真实案例和教学方法，不能覆盖核心知识定义。

**Q: 教材数据的优先级如何？**

A: **教材补充数据 > 图谱数据 > Web 搜索 > 模型知识**（仅针对真实场景、教学方法等非核心知识）

**Q: 如何验证 AI 是否使用了教材数据？**

A: 在生成的课件中查找：
- ABT 引入是否引用了教材中的真实场景
- 记忆锚点是否使用了教材中的类比
- 是否标注了"参考自《XX教材》第XX页"
