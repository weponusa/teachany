# data/kp/ — 知识点卫星文件库

> 每个知识点一个独立 JSON 文件，承载该知识点的全部个性化信息。
> 知识树主文件（`data/trees/**/*.json`）只保留前端渲染所需的轻量索引；
> 课件制作、教材原文、教辅、易错点、题库等"庞大但只在制作时按需读取"的信息全部存放于此。

## 目录结构

```
data/kp/
├── _index.json                  # 全局索引：kp_id → 卫星文件相对路径
├── _unmatched_excerpts.json     # 历史 excerpts 中无法映射到 node_id 的条目（备查）
├── math/                        # 按学科分组（subject 字段）
│   ├── math-m-linear-function.json
│   ├── math-m-quadratic-function.json
│   └── ...
├── physics/
├── chemistry/
├── biology/
├── chinese/
├── english/
├── history/
├── geography/
└── ...
```

## 卫星文件 schema (v1.0)

```json
{
  "kp_id": "math-m-linear-function",
  "name": "一次函数",
  "name_en": "Linear Function",
  "subject": "math",
  "subject_name": "初中数学",
  "curriculum": "cn",
  "stage": "middle",
  "grade": 8,
  "domain_id": "number-algebra",
  "domain_name": "数与代数",
  "tree_file": "data/trees/cn/middle/math.json",

  "curriculum_points": ["..."],          // 课标精炼要求（3-5 条）
  "excerpts": [                          // 课标/教材原文段落
    {"text": "...", "source": "内容要求", "type": "curriculum_point", ...}
  ],
  "textbook_chapter": "第11章 一次函数",
  "textbook_semester": "上",

  "interactive_resources": [],           // 互动工具配置（GeoGebra / Desmos / PhET 等）
  "textbook_content": {},                // 多版本教材原文（人教 / 北师大 / 苏科 ...）
  "supplements": {},                     // 教辅信息（典中点 / 五三 / 真题索引 ...）
  "errors": [],                          // 易错点库
  "exercises": [],                       // 题库（按 Bloom 分级）
  "memory_anchors": [],                  // 记忆锚点
  "real_world": [],                      // 真实世界实例
  "bloom_verbs": {},                     // Bloom 动词建议
  "notes": [],                           // 备注

  "_meta": {
    "schema_version": "1.0",
    "generated_at": "...",
    "sources": ["tree", "excerpts_legacy"],
    "excerpt_count": 3
  }
}
```

## 与知识树主文件的关系

```
┌──────────────────────────────────────────────────────────────────┐
│  data/trees/cn/middle/math.json   (前端 tree.html 加载)          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  {                                                         │  │
│  │    "id": "math-m-linear-function",                         │  │
│  │    "name": "一次函数",                                      │  │
│  │    "grade": 8,                                             │  │
│  │    "prerequisites": [...],                                 │  │
│  │    "courses": [...],                                       │  │
│  │    "kp_file": "data/kp/math/math-m-linear-function.json"   │ ─┐│
│  │  }                                                         │  ││
│  └────────────────────────────────────────────────────────────┘  ││
└──────────────────────────────────────────────────────────────────┘ │
                                                                     │
                            (制作课件时按需 read_file)                │
                                                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  data/kp/math/math-m-linear-function.json                        │
│  ─ curriculum_points / excerpts / textbook_content                │
│  ─ interactive_resources / supplements / errors / exercises       │
│  ─ memory_anchors / real_world / bloom_verbs / notes              │
└──────────────────────────────────────────────────────────────────┘
```

## 维护脚本

| 脚本 | 用途 |
|:---|:---|
| `scripts/build_kp_satellites.py` | 全量重建卫星文件（合并 trees + 归档 excerpts） |
| `scripts/slim_tree_jsons.py` | 知识树主文件瘦身（迁出已搬迁的字段） |
| `scripts/scan_kp_sources.py` | 数据源字段统计 |

## SKILL 调用流程

详见 `teachany-opensource/skill/SKILL_CN.md` § 0.2 第 2.1 项「Phase 0.5 知识点卫星文件查询」。

简要流程：
```
1. 定位 node_id
2. 读 data/trees/.../<subject>.json，找到 kp_file 字段
3. read_file <repo>/teachany-courseware/<kp_file>
4. 按需取用 curriculum_points / excerpts / interactive_resources / ...
5. 制作过程中新发现的资源 → 回写卫星文件
```

## 历史

- **v1.0（2026-05-10）**：从知识树主文件 + `_archive_20260508/_excerpts_backup_20260508/` 全量重建。
  - 生成 2394 个卫星文件（覆盖 1442 个含历史 excerpts 的节点）
  - 主文件瘦身：3.0 MB → 1.3 MB（-57%）
  - 共回迁 16973 条 excerpts
