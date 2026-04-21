# 国际课标知识树（International Curriculum Trees）

本目录存放 TeachAny 支持的国际课程体系（IB / Cambridge / AP 等）的知识树，与中国国家课标树 `data/trees/*.json` 并列。

## 目录结构

```
data/trees/
├── *-elementary.json   # 中国课标 · 小学
├── *-middle.json       # 中国课标 · 初中
├── *-high.json         # 中国课标 · 高中
└── international/
    ├── ib-dp-*.json    # IB Diploma Programme
    ├── cam-al-*.json   # Cambridge A-Level / IGCSE
    └── ap-*.json       # AP (Advanced Placement)
```

## 命名约定

- **文件名**：`<curriculum>-<subject>.json`（如 `ib-dp-physics.json` / `cam-al-math.json`）
- **节点 id**：`<subject>-<curriculum_stage>-<topic>`（如 `phy-ib-dp-projectile-motion` / `math-cam-al-differentiation`）
- **JSON 顶层字段**：
  - `subject`：学科英文键（与中国课标共用，如 `physics` / `chemistry`）
  - `curriculum`：本体系 id（如 `ib-dp` / `cambridge-al` / `ap`）
  - `stage`：学段 key（如 `dp` / `al` / `ap`）
  - `domains[].nodes[]`：节点列表，结构与中国课标树一致

## 课标文档参考

| 体系 | 官方文档入口 |
|:---|:---|
| IB DP | https://www.ibo.org/programmes/diploma-programme/curriculum/ |
| Cambridge A-Level | https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-advanced/ |
| AP | https://apcentral.collegeboard.org/courses |

## 贡献说明

1. 本目录的知识树按**需要**生长，不必一次性全建
2. 每棵树应忠实映射该体系的官方 Subject Guide / Syllabus / CED 文档
3. 新建树时复制 `_template.json`（见本目录），按结构填充
4. 课件的 `manifest.curriculum` 字段必须与树文件匹配
5. 制作完成后跑 `python3 scripts/validate-courseware.py` 校验

## 当前状态

截至 v5.31，**11 棵国际课标树已全部构建完毕**（47 个域 / 202 个节点），数据来源于各体系官方 Subject Guide / Syllabus / CED 最新版本：

| 课标 | 学科 | 文件 | 节点数 | 来源 |
|:---|:---|:---|:-:|:---|
| IB DP | 数学 AA | `ib-dp-math-aa.json` | 29 | IB 2021 首考大纲 |
| IB DP | 物理 | `ib-dp-physics.json` | 21 | IB 2025 首考新大纲 |
| IB DP | 化学 | `ib-dp-chemistry.json` | 19 | IB 2025 Structure & Reactivity |
| IB DP | 生物 | `ib-dp-biology.json` | 23 | IB 2025 四主题框架 |
| A-Level | 数学 | `cam-al-math.json` | 28 | Cambridge 9709 (2025-27) |
| A-Level | 物理 | `cam-al-physics.json` | 22 | Cambridge 9702 (2025-27) |
| A-Level | 化学 | `cam-al-chemistry.json` | 25 | Cambridge 9701 (2025-27) |
| AP | Calculus BC | `ap-calculus.json` | 10 | College Board CED |
| AP | Physics 1 | `ap-physics-1.json` | 8 | AP Physics 1 (2025 修订) |
| AP | Chemistry | `ap-chemistry.json` | 9 | College Board CED |
| AP | Biology | `ap-biology.json` | 8 | College Board CED |

**全部节点当前 `status=placeholder`、`courses=[]`**——等待国际学校老师提交首批课件来"点亮"这些节点。欢迎通过 PR 贡献课件或修订节点结构。
