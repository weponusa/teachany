# 📚 Textbook Supplements | 教材补充素材库

## 目的

从优质教材中提取教学方法、真实场景、类比、图像等素材，补充到 TeachAny Knowledge Layer，提升课件生成质量。

## 数据来源

| 教材 | 学科 | 文件 | 提取重点 |
|:---|:---|:---|:---|
| Mathematics All Around | 数学 | 01_mathematics_all_around.pdf (118MB) | • 真实场景案例<br>• 数学建模方法<br>• 可视化策略 |
| Physics: Everyday Phenomena | 物理 | 02_physics_everyday_phenomena.pdf (67MB) | • 日常现象切入<br>• 实验设计思路<br>• 概念图/示意图 |
| Biology: Life on Earth | 生物 | 04_biology_life_on_earth.pdf (49MB) | • 生态案例<br>• 科学探究流程<br>• 图表/照片素材 |

## 数据结构

```
textbook-supplements/
├── README.md                          # 本文件
├── schema.md                          # 补充数据格式规范
│
├── math/
│   ├── teaching_methods.json         # 教学方法提取
│   ├── real_world_scenarios.json     # 真实场景案例库
│   ├── analogies.json                # 类比/比喻集合
│   ├── visual_strategies.json        # 可视化策略
│   └── extracted_exercises.json      # 教材习题（含图）
│
├── physics/
│   ├── teaching_methods.json
│   ├── phenomena_library.json        # 日常现象库
│   ├── experiment_designs.json       # 实验设计模板
│   ├── concept_diagrams.json         # 概念图/示意图
│   └── extracted_exercises.json
│
└── biology/
    ├── teaching_methods.json
    ├── ecological_cases.json         # 生态案例库
    ├── inquiry_processes.json        # 科学探究流程
    ├── image_library.json            # 图表/照片索引
    └── extracted_exercises.json
```

## 数据使用方式

AI 在生成课件时，除了查阅 `data/{subject}/{domain}/_graph.json`，还可以：

1. **查阅教学方法**：`textbook-supplements/{subject}/teaching_methods.json`
   - 获取该学科的典型教学切入方式
   - 参考情境设计模式

2. **查阅真实场景**：`real_world_scenarios.json` 或 `phenomena_library.json`
   - 为 ABT 叙事提供真实案例
   - 为问题驱动提供情境素材

3. **查阅类比/图像**：`analogies.json` 或 `visual_strategies.json`
   - 为"五镜头法"提供类比素材
   - 为记忆锚点提供口诀/图像

4. **查阅图表**：`image_library.json`
   - 获取教材中的高质量示意图
   - 参考可视化设计

## 提取原则

1. **不重复造轮子**：优先提取教材中已有的优质素材，而不是让 AI 重新创造
2. **保留出处**：每条数据标注来自哪本书的哪一页
3. **适配知识图谱**：每条素材关联到 `_graph.json` 的具体节点 ID
4. **分离图文**：图像单独存储（PNG/SVG），JSON 中存储索引和描述

## 当前状态

- ✅ 数据架构已建立
- 🔄 正在提取：数学教材 (01_mathematics_all_around.pdf)
- ⏳ 待提取：物理教材、生物教材
- ⏳ 待整合：提取内容映射到知识图谱节点

## 贡献指南

如果你要添加新的教材素材：

1. 在对应学科目录下创建 JSON 文件
2. 按 `schema.md` 的格式编写
3. 确保每条数据有 `node_id`（关联到 `_graph.json`）
4. 图像文件放在 `images/{subject}/` 目录
5. PR 时附上教材来源信息
