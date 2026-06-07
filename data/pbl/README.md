# PBL 原型层数据 — 开箱即用说明

本目录是 TeachAny PBL 拆解引擎的**结构化知识层**，与 `assets/scripts/pbl-archetypes.js` 同步。无需改 LLM 提示词即可约束课标匹配质量。

## 文件一览

| 文件 | 作用 |
|------|------|
| `archetypes.json` | 14 个项目原型：工程、化学、消费决策、社会调查、人文写作、应用文、研学、商业、健康、劳动、创意媒体、通用兜底 |
| `engineering-registry.json` | 课外工程/实践知识点，按 `archetype + moduleId` 绑定，含可执行 `taskSnippet` |
| `node-pbl-tags.json` | 全局 ban 名单、语文写作子类型规则、小学节点 ban、能力锚点 |
| `benchmark-seed.json` | 12 条黄金评测用例，供本地/线上自测 |

## 流水线（4 步）

```
decompose → filter（Bloom + 原型分模块检索）→ match → verify-deps → finalize
```

- **原型解析**：`goal` 正则 → 化学混合溶液特例 → `projectType` 回退 → `general-practice`
- **分模块检索**：每个 `module` 按 `hints/subjects/topK` 独立打分选课标节点
- **课外补充**：优先 `engineering-registry`，禁止「批判性思维」等空话兜底

## 本地自测

```bash
# 全量 12 用例（仅本地检索，约 5s）
node scripts/pbl-self-test.mjs

# 单用例
node scripts/pbl-self-test.mjs --id=water-rocket

# 含线上 match（慢，每组约 60–120s）
node scripts/pbl-self-test.mjs --live
```

通过标准：无禁止节点、学段达标、节点数 ≥ `minMatched`、（可选）线上 match 无脏命中。

## 新增原型 checklist

1. 在 `archetypes.json` 增加条目：`matchPatterns`、`modules[]`、`banNamePatterns`、`subjects`
2. 在 `typeFallback` 映射 `projectType`
3. 在 `engineering-registry.json` 为关键模块补 1–2 条 `taskSnippet`
4. 在 `benchmark-seed.json` 增加黄金用例
5. 运行 `node scripts/pbl-self-test.mjs` 直至全绿
6. 同步 `assets/scripts/pbl-archetypes.js` 与 `teachany-opensource/data/pbl/`

## 前端展示

- `pbl.html` 示范项目 chips 覆盖主要原型
- 拆解结果展示：项目原型、模块主线、质量分（A–D）、课外任务片段
- 图谱节点挂 `_moduleLabel` 用于双层展示（模块主线 + 课标支撑）

## 版本

脚本缓存 key：`teachany_pbl_archetypes_v2`（含 node-pbl-tags）。改 JSON 后 bump `pbl.html` 中 `?v=` 参数并硬刷新。
