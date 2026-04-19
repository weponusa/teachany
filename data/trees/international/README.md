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

截至 v5.30，国际课标树为**配置预留**状态，文件列表见 `data/curricula.json`。欢迎国际学校老师提交第一棵实际知识树。
