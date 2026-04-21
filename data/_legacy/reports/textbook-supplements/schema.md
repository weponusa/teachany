# 📐 Textbook Supplements Schema | 教材补充数据格式规范

## 1. 教学方法 `teaching_methods.json`

记录教材中体现的教学方法和风格特征。

```jsonc
{
  "source": {
    "textbook": "Mathematics All Around",
    "edition": "7th Edition",
    "authors": ["Tom Pirnot"],
    "file": "01_mathematics_all_around.pdf"
  },
  "extraction_date": "2026-04-11",
  "methods": [
    {
      "id": "math-method-001",
      "type": "abt_narrative",              // 教学方法类型
      "name": "从账单到函数",                 // 方法名称
      "description": "从手机账单引入一次函数", // 详细描述
      "example": "你的手机套餐是这样的：月租30元，超出后每分钟0.2元。这个月你通话了150分钟，费用是多少？",
      "applicable_nodes": [                  // 适用的知识点
        "linear-function",
        "proportional-function"
      ],
      "bloom_level": "apply",
      "page_reference": "p. 234"             // 教材页码
    },
    {
      "id": "math-method-002",
      "type": "visual_analogy",
      "name": "函数图像类比爬山",
      "description": "用爬山类比理解斜率和截距",
      "example": "y=kx+b 就像爬山：k（斜率）决定坡有多陡，b（截距）决定你从哪个高度出发",
      "applicable_nodes": ["linear-function"],
      "memory_anchor": true,                 // 是否为记忆锚点
      "page_reference": "p. 236"
    }
  ]
}
```

## 2. 真实场景案例 `real_world_scenarios.json`

教材中的真实应用场景，用于 ABT 叙事和情境设计。

```jsonc
{
  "source": { /* 同上 */ },
  "scenarios": [
    {
      "id": "math-scenario-001",
      "node_id": "linear-function",          // 关联知识点
      "title": "出租车计价",
      "context": "城市出租车收费标准：起步价10元（3公里内），超出后每公里2元",
      "question": "如果行驶了x公里（x>3），费用y是多少？",
      "solution_hint": "y = 10 + 2(x-3) = 2x + 4",
      "real_world_relevance": "high",        // high | medium | low
      "grade_level": "8",
      "tags": ["交通", "计费", "分段函数"],
      "page_reference": "p. 240",
      "has_image": true,
      "image_path": "images/math/taxi_fare_diagram.png"
    }
  ]
}
```

## 3. 类比集合 `analogies.json`

教材中使用的类比、比喻、口诀。

```jsonc
{
  "source": { /* 同上 */ },
  "analogies": [
    {
      "id": "math-analogy-001",
      "node_id": "slope",
      "concept": "斜率",
      "analogy_type": "metaphor",            // metaphor | simile | mnemonic
      "source_domain": "爬山",               // 类比源
      "target_domain": "函数图像",           // 类比目标
      "mapping": {
        "坡度": "斜率 k",
        "上坡/下坡": "k 的正负",
        "坡越陡": "k 的绝对值越大"
      },
      "example": "想象你在爬山：坡越陡（k 越大），爬升越快（y 变化越快）",
      "effectiveness": "high",               // 类比有效性
      "page_reference": "p. 236"
    }
  ]
}
```

## 4. 可视化策略 `visual_strategies.json`

教材中使用的图像、图表、示意图的设计策略。

```jsonc
{
  "source": { /* 同上 */ },
  "visual_patterns": [
    {
      "id": "math-visual-001",
      "node_id": "linear-function",
      "pattern_type": "comparison_table",    // 可视化类型
      "title": "一次函数 vs 正比例函数对比",
      "description": "用对比表格展示两者的异同",
      "table_structure": {
        "headers": ["特征", "一次函数 y=kx+b", "正比例函数 y=kx"],
        "rows": [
          ["形式", "y=kx+b (k≠0)", "y=kx (k≠0)"],
          ["图像", "直线（可不过原点）", "直线（必过原点）"],
          ["b的作用", "决定截距", "b=0"]
        ]
      },
      "mayer_principle": "contiguity",       // Mayer 多媒体原则
      "page_reference": "p. 238",
      "image_path": "images/math/function_comparison.png"
    },
    {
      "id": "math-visual-002",
      "pattern_type": "step_by_step_diagram",
      "title": "求一次函数解析式的步骤图",
      "steps": [
        "① 设一次函数 y=kx+b",
        "② 将两个点坐标代入",
        "③ 得到关于 k、b 的方程组",
        "④ 解方程组",
        "⑤ 写出解析式"
      ],
      "visual_cues": [
        "每步用不同颜色标注",
        "箭头连接步骤",
        "关键公式加粗"
      ],
      "page_reference": "p. 242"
    }
  ]
}
```

## 5. 日常现象库 `phenomena_library.json` (物理专用)

物理教材中的日常现象案例。

```jsonc
{
  "source": {
    "textbook": "Physics: Everyday Phenomena",
    "file": "02_physics_everyday_phenomena.pdf"
  },
  "phenomena": [
    {
      "id": "physics-phenom-001",
      "node_id": "pressure",
      "title": "为什么冰面救援要躺着？",
      "observation": "冬天冰面救援时，救援人员会趴着或躺着匍匐前进，而不是站着走",
      "question": "为什么站着容易压碎冰面，躺着就安全？",
      "scientific_explanation": "人的重量（压力）不变，但躺着时接触面积增大，压强减小，冰面不易破裂",
      "concepts": ["压强", "压力", "受力面积"],
      "cognitive_conflict": "同样的人，为什么改变姿势就安全了？",
      "grade_level": "8",
      "page_reference": "p. 156",
      "has_image": true,
      "image_path": "images/physics/ice_rescue.jpg"
    }
  ]
}
```

## 6. 实验设计 `experiment_designs.json` (物理/化学/生物)

教材中的实验设计思路和步骤。

```jsonc
{
  "source": { /* 同上 */ },
  "experiments": [
    {
      "id": "physics-exp-001",
      "node_id": "pressure",
      "title": "探究压力作用效果与受力面积的关系",
      "type": "探究实验",                     // 演示实验 | 探究实验 | 验证实验
      "materials": [
        "海绵",
        "小木块",
        "砝码"
      ],
      "procedure": [
        "① 将小木块平放在海绵上，观察海绵凹陷程度",
        "② 将小木块竖放在海绵上，观察凹陷程度",
        "③ 对比两次实验，得出结论"
      ],
      "variables": {
        "independent": "受力面积",           // 自变量
        "dependent": "海绵凹陷程度",         // 因变量
        "controlled": ["压力大小", "海绵材质"] // 控制变量
      },
      "expected_result": "压力相同时，受力面积越小，压力作用效果越明显",
      "safety_notes": [],
      "page_reference": "p. 158",
      "diagram_path": "images/physics/pressure_experiment.svg"
    }
  ]
}
```

## 7. 生态案例库 `ecological_cases.json` (生物专用)

生物教材中的生态系统案例。

```jsonc
{
  "source": {
    "textbook": "Biology: Life on Earth",
    "file": "04_biology_life_on_earth.pdf"
  },
  "cases": [
    {
      "id": "bio-case-001",
      "node_id": "photosynthesis",
      "title": "热带雨林的碳循环",
      "ecosystem": "热带雨林",
      "description": "热带雨林被称为'地球之肺'，通过光合作用吸收大量CO₂并释放O₂",
      "organisms_involved": [
        { "name": "树木", "role": "生产者" },
        { "name": "昆虫", "role": "消费者" },
        { "name": "细菌", "role": "分解者" }
      ],
      "key_processes": ["光合作用", "呼吸作用", "分解作用"],
      "data_point": "1公顷热带雨林每天可吸收约1吨CO₂",
      "conservation_relevance": "high",
      "page_reference": "p. 89",
      "image_path": "images/biology/rainforest_carbon.jpg"
    }
  ]
}
```

## 8. 图像库索引 `image_library.json`

教材中提取的高质量图像索引。

```jsonc
{
  "source": { /* 同上 */ },
  "images": [
    {
      "id": "img-math-001",
      "node_id": "linear-function",
      "type": "diagram",                     // diagram | photo | chart | graph | illustration
      "title": "一次函数图像的平移变换",
      "description": "展示改变 k 和 b 如何影响图像位置",
      "file_path": "images/math/linear_transformation.png",
      "file_format": "PNG",
      "resolution": "1200x800",
      "color_mode": "RGB",
      "has_text": true,                      // 图像中是否有文字
      "text_language": "zh",
      "license": "educational_use",          // 使用许可
      "page_reference": "p. 237",
      "tags": ["函数图像", "平移", "变换"]
    }
  ]
}
```

## 数据质量要求

1. **准确性**：
   - 所有数据必须对照教材原文
   - 图像必须保留出处页码
   - 数学公式必须准确

2. **可追溯性**：
   - 每条数据必须有 `page_reference`
   - 图像必须标注来源教材

3. **关联性**：
   - 每条数据必须关联到 `_graph.json` 的节点 ID
   - 如果节点不存在，需先在 `_graph.json` 中创建

4. **适用性**：
   - 标注适用年级 `grade_level`
   - 标注 Bloom 认知层级（如适用）

## ID 命名规范

- 教学方法 ID：`{subject}-method-{序号}`，如 `math-method-001`
- 场景 ID：`{subject}-scenario-{序号}`，如 `physics-scenario-001`
- 类比 ID：`{subject}-analogy-{序号}`，如 `bio-analogy-001`
- 实验 ID：`{subject}-exp-{序号}`，如 `physics-exp-001`
- 图像 ID：`img-{subject}-{序号}`，如 `img-math-001`
