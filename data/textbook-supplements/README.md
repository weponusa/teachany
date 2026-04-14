# 📚 Textbook Supplements | 教材补充素材库

## 目的

从优质教材中提取教学方法、真实场景、类比、图像等素材，补充到 TeachAny Knowledge Layer，提升课件生成质量。

## 数据来源

| 教材 | 学科 | 文件 | 提取重点 |
|:---|:---|:---|:---|
| **理科教材** ||||
| Mathematics All Around | 数学 | 01_mathematics_all_around.pdf (118MB) | • 真实场景案例<br>• 数学建模方法<br>• 可视化策略 |
| Physics: Everyday Phenomena | 物理 | 02_physics_everyday_phenomena.pdf (67MB) | • 日常现象切入<br>• 实验设计思路<br>• 概念图/示意图 |
| Biology: Life on Earth | 生物 | 04_biology_life_on_earth.pdf (49MB) | • 生态案例<br>• 科学探究流程<br>• 图表/照片素材 |
| Introductory Chemistry | 化学 | 03_introductory_chemistry.md | • 化学反应原理<br>• 实验方法<br>• 生活应用 |
| **人文学科教材** ||||
| U.S. History (OpenStax) | 历史 | OpenStax_US_History.md (975页) | • 历史分析方法<br>• 史料阅读策略<br>• 时代对比案例 |
| 部编版初中历史教材 | 历史 | 人教版教材 | • 中国古代史<br>• 近现代史<br>• 世界史 |
| 气象学与生活（第12版） | 地理 | 06_atmosphere_meteorology.md (394页) | • 地理现象解释<br>• 地图技能<br>• 区域对比 |
| 部编版初中/高中地理教材 | 地理 | 人教版/中图版 | • 自然地理<br>• 人文地理<br>• 区域地理 |
| Writing Guide (OpenStax) | 语文 | OpenStax_Writing_Guide_Handbook.md (756页) | • 写作过程<br>• 文体规范<br>• 修辞策略 |
| 部编版语文教材（1-12年级） | 语文 | 人教版统编教材 | • 拼音识字<br>• 古诗文<br>• 现代文阅读<br>• 写作训练 |

## 数据结构

```
textbook-supplements/
├── README.md                          # 本文件
├── schema.md                          # 补充数据格式规范
├── BOOK_NODE_MAPPING.json             # 教材章节→知识节点映射表
│
├── math/                              # 数学
│   ├── teaching_methods.json         # 教学方法提取
│   ├── real_world_scenarios.json     # 真实场景案例库
│   ├── analogies.json                # 类比/比喻集合
│   ├── visual_strategies.json        # 可视化策略
│   └── extracted_exercises.json      # 教材习题（含图）
│
├── physics/                           # 物理
│   ├── teaching_methods.json
│   ├── phenomena_library.json        # 日常现象库
│   ├── experiment_designs.json       # 实验设计模板
│   ├── concept_diagrams.json         # 概念图/示意图
│   └── extracted_exercises.json
│
├── biology/                           # 生物
│   ├── teaching_methods.json
│   ├── ecological_cases.json         # 生态案例库
│   ├── inquiry_processes.json        # 科学探究流程
│   ├── image_library.json            # 图表/照片索引
│   └── extracted_exercises.json
│
├── chemistry/                         # 化学
│   ├── teaching_methods.json
│   ├── real_world_scenarios.json
│   └── visual_strategies.json
│
├── history/                           # 历史 ✨ NEW
│   ├── teaching_methods.json         # 历史分析方法（8条）
│   └── real_world_scenarios.json     # 历史案例库（8条）
│
├── geography/                         # 地理 ✨ NEW
│   ├── teaching_methods.json         # 地理教学方法（8条）
│   ├── real_world_scenarios.json     # 地理应用案例（8条）
│   └── visual_strategies.json        # 地图与可视化策略（10条）
│
└── chinese/                           # 语文 ✨ NEW
    ├── teaching_methods.json         # 语文教学方法（8条）
    └── real_world_scenarios.json     # 语文应用场景（8条）
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

### 理科数据
- ✅ 数学：teaching_methods, real_world_scenarios, analogies, visual_strategies
- ✅ 物理：teaching_methods, phenomena_library, experiment_designs
- ✅ 化学：teaching_methods, real_world_scenarios, visual_strategies
- ✅ 生物：teaching_methods, ecological_cases, inquiry_processes

### 人文学科数据 ✨ NEW (2026-04-14)
- ✅ **历史**：8条教学方法 + 8条真实场景案例
  - 涵盖时间轴构建、史料分析、对比表、角色扮演、因果链等方法
  - 案例：丝绸之路全球贸易、郡县制到今、科举到高考、鸦片战争教训等
  - 对齐18个历史知识节点（古代中国史、近现代中国史、主题史、世界史）

- ✅ **地理**：8条教学方法 + 8条真实场景 + 10条可视化策略
  - 涵盖地图技能、天气数据解读、野外观察、区域对比、过程模拟等方法
  - 案例：GPS导航坐标、天气预报锋面、时区时差、城市热岛、三峡大坝影响等
  - 对齐15个地理知识节点（地图技能、自然地理、人文地理、区域地理）

- ✅ **语文**：8条教学方法 + 8条真实场景案例
  - 涵盖拼音情境学习、字源故事、部首家族、诗歌吟诵、意象解码、注释对话、写作工作坊、整本书阅读等
  - 案例：智能拼音输入、公共场所识字、古诗词现代应用、批判性阅读、语法沟通、实用写作、整本书阅读、跨学科表达
  - 对齐37个语文知识节点（拼音、识字、语法、阅读、古诗文、写作）
  - 所有方法对齐**2022版语文课标六大学习任务群**

### 数据统计
- **学科总数**：7门（数学、物理、化学、生物、历史、地理、语文）
- **教材来源**：12本权威教材（OpenStax系列 + Pearson系列 + 部编版教材）
- **数据条目**：理科约120条 + 人文学科58条 = **178+条**高质量教学素材

## 贡献指南

如果你要添加新的教材素材：

1. 在对应学科目录下创建 JSON 文件
2. 按 `schema.md` 的格式编写
3. 确保每条数据有 `node_id`（关联到 `_graph.json`）
4. 图像文件放在 `images/{subject}/` 目录
5. PR 时附上教材来源信息
