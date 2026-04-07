# 📐 Knowledge Layer Schema | 数据格式规范

## 1. 知识图谱 `_graph.json`

```jsonc
{
  "subject": "math",              // 学科
  "domain": "functions",          // 领域
  "version": "1.0",
  "curriculum": "人教版",          // 教材版本
  "nodes": [
    {
      "id": "linear-function",           // 唯一 ID，kebab-case
      "name": "一次函数",                 // 中文名
      "name_en": "Linear Function",      // 英文名
      "grade": "8",                       // 适用年级
      "semester": "上",                   // 学期
      "unit": "第11章 一次函数",           // 教材单元
      "definition": "形如 y=kx+b（k≠0）的函数",  // 一句话定义
      "key_concepts": [                   // 核心概念（不超过5个）
        "斜率 k 决定倾斜方向和程度",
        "截距 b 是与 y 轴的交点",
        "k>0 时从左到右上升，k<0 时下降"
      ],
      "prerequisites": [                  // 前置知识 ID
        "proportional-function",
        "coordinate-system"
      ],
      "leads_to": [                       // 后续知识 ID
        "quadratic-function",
        "linear-inequality"
      ],
      "real_world": [                     // 真实场景（用于 ABT 引入）
        "手机话费 = 月租 + 通话分钟 × 单价",
        "出租车费 = 起步价 + 里程 × 单价",
        "温度随海拔变化"
      ],
      "memory_anchors": [                 // 记忆锚点（口诀/类比/图像）
        "k 是坡度，b 是起点",
        "y=kx+b 就像爬山：k 决定坡有多陡，b 决定从哪个高度出发"
      ],
      "bloom_verbs": {                    // 按 Bloom 层级的行为动词
        "remember": "写出一次函数的一般形式",
        "understand": "解释 k 的正负对图像方向的影响",
        "apply": "根据两点坐标求一次函数解析式",
        "analyze": "判断一次函数图像经过哪些象限",
        "evaluate": "判断给定函数是否为一次函数并说明理由",
        "create": "设计一个满足指定条件的一次函数"
      }
    }
    // ... 更多节点
  ],
  "edges": [                              // 知识点间的关系
    {
      "from": "proportional-function",
      "to": "linear-function",
      "type": "prerequisite",             // prerequisite | extends | parallel
      "note": "正比例函数是一次函数 b=0 的特殊情况"
    }
  ]
}
```

## 2. 易错点库 `_errors.json`

```jsonc
{
  "subject": "math",
  "domain": "functions",
  "version": "1.0",
  "errors": [
    {
      "id": "err-slope-sign",
      "node_id": "linear-function",       // 关联的知识点
      "grade": "8",
      "type": "conceptual",               // conceptual | procedural | careless
      "description": "斜率 k 正负与图像升降搞反",
      "wrong_answer": "k=-2 的图像从左到右上升",
      "correct_answer": "k=-2 的图像从左到右下降",
      "diagnosis": "k 的正负决定方向：k>0 上升，k<0 下降。你可以把 k 想象成「坡度」——正数是上坡，负数是下坡。",
      "frequency": "high",                // high | medium | low
      "trigger": "学生混淆 k 的值和 b 的值的作用"
    }
  ]
}
```

## 3. 题库 `_exercises.json`

```jsonc
{
  "subject": "math",
  "domain": "functions",
  "version": "1.0",
  "exercises": [
    {
      "id": "ex-linear-001",
      "node_id": "linear-function",
      "bloom_level": "remember",          // remember | understand | apply | analyze | evaluate | create
      "difficulty": 1,                     // 1-5
      "type": "single_choice",            // single_choice | multi_choice | fill_blank | open_ended | drag_sort | matching
      "stem": "下面哪个是一次函数？",
      "options": [
        { "label": "A", "text": "y = 2x + 3", "correct": true },
        { "label": "B", "text": "y = x²", "correct": false, "error_id": "err-confuse-quadratic" },
        { "label": "C", "text": "y = 3/x", "correct": false, "error_id": "err-confuse-inverse" },
        { "label": "D", "text": "y = 5", "correct": false, "error_id": "err-constant-not-linear" }
      ],
      "feedback_correct": "对！y=2x+3 中 k=2≠0，是一次函数。",
      "feedback_wrong": {
        "B": "y=x² 是二次函数，自变量 x 的指数是 2，不是 1。",
        "C": "y=3/x 是反比例函数，x 在分母上。",
        "D": "y=5 是常数函数，没有含 x 的项，相当于 k=0。"
      },
      "source": "原创",
      "tags": ["一次函数", "判断"]
    }
  ]
}
```

## 4. 文件命名约定

| 文件 | 命名 | 说明 |
|:---|:---|:---|
| 知识图谱 | `_graph.json` | 以 `_` 开头表示元数据文件 |
| 易错点库 | `_errors.json` | |
| 题库 | `_exercises.json` | |
| 子领域 | 用目录分隔 | 如 `math/functions/`、`math/geometry/` |

## 5. ID 命名规范

- 知识点 ID：`kebab-case`，如 `linear-function`、`compound-vowel`
- 错误 ID：`err-` 前缀，如 `err-slope-sign`
- 题目 ID：`ex-` 前缀 + 知识点缩写 + 序号，如 `ex-linear-001`
- 全局唯一，跨文件可引用
