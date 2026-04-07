# 📚 TeachAny Knowledge Layer | 知识层

## 设计理念

TeachAny 的 Skill 提供**"怎么做课件"**的方法论，Knowledge Layer 提供**"做什么内容"**的知识底座。

两者的关系：

```
┌─────────────────────────────────────────────────────┐
│  Skill（方法论层）                                    │
│  · ABT 叙事结构                                      │
│  · 五镜头法 / Bloom 认知分类                          │
│  · 脚手架策略 / 认知负荷管理                          │
│  · 学科适配 / 课型分类                                │
└────────────────────┬────────────────────────────────┘
                     │ 查阅
┌────────────────────▼────────────────────────────────┐
│  Knowledge Layer（知识层）   ← 你现在在这里           │
│  · 知识图谱：知识点 + 前置关系 + 学段定位              │
│  · 易错点库：每个知识点的常见错误 + 诊断反馈           │
│  · 题库：按 Bloom 层级分级的练习题                    │
│  · 教学锚点：真实场景、类比、口诀                      │
└─────────────────────────────────────────────────────┘
```

## 为什么需要知识层？

| 问题 | 没有知识层时 | 有知识层时 |
|:---|:---|:---|
| **知识准确性** | 依赖模型内置知识，可能编错 | 直接从图谱读取，保证准确 |
| **前置知识链** | 模型猜测，可能遗漏 | 图谱中有明确的 `prerequisites` |
| **易错点** | 模型凭经验生成，可能不典型 | 从教学一线积累的真实错因库 |
| **练习题** | 模型现编，质量波动大 | 审核过的题库，带标准答案和诊断 |
| **课程标准对齐** | 模型不确定是几年级的内容 | 每个知识点有 `grade` 和 `curriculum` 标注 |

## 目录结构

```
data/
├── README.md                    # 本文件
├── schema.md                    # 数据格式规范
│
├── chinese/                     # 语文
│   ├── pinyin/                  # 拼音
│   │   ├── _graph.json          # 知识图谱
│   │   ├── _errors.json         # 易错点库
│   │   └── _exercises.json      # 题库
│   ├── reading/                 # 阅读理解
│   └── writing/                 # 写作
│
├── math/                        # 数学
│   ├── functions/               # 函数
│   │   ├── _graph.json          
│   │   ├── _errors.json         
│   │   └── _exercises.json      
│   ├── geometry/                # 几何
│   ├── algebra/                 # 代数
│   └── statistics/              # 统计
│
├── physics/                     # 物理
├── chemistry/                   # 化学
├── biology/                     # 生物
├── geography/                   # 地理
├── history/                     # 历史
├── english/                     # 英语
└── info-tech/                   # 信息技术
```

## AI 如何使用知识层

在 SKILL 中，AI 按以下流程使用知识层：

```
1. 用户说"做一个复韵母课件"
2. AI 先执行轻量检索：python3 scripts/knowledge_layer.py lookup --topic "复韵母" --subject chinese
3. AI 根据命中的 subject/domain/node，再决定是否回读原始 JSON
4. AI 优先读取该知识点的：
   - 定义、前置知识、后续知识
   - 真实场景、记忆锚点（口诀/类比）
   - 课程标准定位（几年级、哪个单元）
5. AI 按需读取 _errors.json：该知识点的典型错误和诊断反馈
6. AI 按需读取 _exercises.json：现成的分级练习题
7. AI 用 Skill 的方法论组装成课件
```

### 推荐命令

#### 1）完整性审计

```bash
python3 scripts/knowledge_layer.py audit
python3 scripts/knowledge_layer.py audit --subject math
python3 scripts/knowledge_layer.py audit --json
```

#### 2）主题按需检索（推荐）

```bash
python3 scripts/knowledge_layer.py lookup --topic "一次函数" --subject math
python3 scripts/knowledge_layer.py lookup --topic "光合作用" --subject biology --top 2 --errors 2 --exercises 2
python3 scripts/knowledge_layer.py lookup --topic "季风" --subject geography --json
```

### 为什么这样更省模型消耗？

- **先输出紧凑摘要**，避免整份 `_graph.json` 直接进上下文
- **只命中一个或少数几个 node**，而不是通读整学科目录
- **错误库和题库按需截取**，避免把大量暂时用不到的题塞给模型
- **让 Skill 先复用已有知识层内容，再做补充生成**

## 贡献指南

### 添加新学科/新知识点

1. 在对应学科目录下创建子目录
2. 按 `schema.md` 的格式编写 `_graph.json`、`_errors.json`、`_exercises.json`
3. 确保 `prerequisites` 中引用的知识点 ID 在图谱中存在
4. PR 时附上知识来源（教材版本、页码）

### 数据质量要求

- **知识准确**：必须对照课程标准和教材
- **学段正确**：标明适用年级
- **易错点真实**：来自教学实践，不是臆测
- **题目有来源**：标注是原创还是改编
