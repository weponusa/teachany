# 内容丰富度改进计划（独立维度）

> **与「分页 PPT / v2 幻灯片」正交**：分页解决**呈现结构**；本计划解决**内容从哪来、是否可验证**。  
> 状态：**P0 已落地**（workflow + lookup/KCP + B-20～B24 WARN）· 2026-06-01

---

## 1. 问题陈述（共识）

TeachAny 已具备较完整的**知识基础设施**，但课件生成主流程（`phases/workflow.md` 精简版）**未硬性消费**这些数据，导致：

| 资产 | 规模 / 状态 | 生成流程是否接入 |
|------|-------------|------------------|
| `data/node-index.json` + kp-md 卫星 MD | 2394 节点，约 1537 有 MD | ⚠️ `knowledge_layer.py lookup` 可读，**workflow 未强制** |
| `data/kp/**/*.json` 卫星（课标原文、例题、易错点、`curriculum_md_raw`） | 大量已注入 | ⚠️ v1 lookup 走 legacy bundles；**Agent 常不调用** |
| 课标 OCR Markdown（`books/课标/md/` 等） | 17 学科量级 | ❌ 未在 Phase 1 引用 |
| 课标整理版（`curriculum-standards/`，供 LLM 检索） | 240+ 文件 | ❌ 未在 Phase 1 引用 |
| OpenStax 等教材 Markdown（`books/science/` 等） | 10+ 本，20MB+ | ❌ 仅在部分 JSON 的 `textbook_summary` 里**写路径**，生成时不读正文 |
| `kp-md-pipeline` Stage 1–6 | 离线产出 MD / 填 `[待补充]` | ⚠️ 与线上 skill **未闭环** |

**现状**：课件正文多依赖模型自带知识；外部课标/教材与节点卫星数据**未成为 Phase 1 的必选输入**。

---

## 2. 目标

1. **每条新课件**在 Phase 1 产出教学骨架前，必须有一份可审计的「知识层上下文包」（KCP）。
2. KCP 中至少包含：**课标原文节选、预置例题（含答案要点）、易错点、前置/后续节点**；有则禁止用空泛套话替代。
3. Phase 2 写 HTML 时，例题讲解页、前测/后测、互动题干**须能追溯到 KCP 中的条目**（PLAN.md 标注来源）。
4. 卫星文件中 `[待补充]` 字段按学科分批灌满（离线 pipeline），而非在生成时临时编造。

**非目标（本计划不做）**：替换 v2 分页模板、改动地图/KG 模块、实时向量库建设（第三条腿仅 fallback）。

---

## 3. 三条腿与优先级（采纳你的方案）

### 腿 1 — 高优：接通已有知识层（「水管」）

**做法**

- 在 **Phase 0/1** 增加**硬性步骤**（见 §4），禁止跳过。
- 统一入口：`python3 scripts/knowledge_layer.py lookup --topic "<主题>" --subject <学科> --node-id <id> --json`
- 扩展 lookup 输出（需开发）：
  - 合并 **v2**（`node-index` → kp-md）与 **v1**（`data/kp/{subject}/*.json` 的 `excerpts` / `exercises` / `errors` / `supplements.curriculum_md_raw` 摘要）
  - 输出结构化 KCP 字段（见 §5），写入课件目录 `PLAN.md` 的「知识层引用」小节

**现状缺口（须在腿 1 修复）**

- `phases/workflow.md` **无** Phase 0.5；详细说明在 `references/workflow-development.md`，与主 workflow **脱节**。
- `lookup_v2` 仅节选 MD 内「课标原文」约 500 字，**不含** JSON 卫星里的 6 道例题 / 3 个易错点。
- 本地 `skill/data/kp-md/` 在 courseware 仓可能**未同步**（`node-index` 指向 `skill/data/kp-md/kp-*.md` 但文件缺失时 lookup 退化）。

### 腿 2 — 中优：灌满卫星文件（离线）

**做法**

- 续跑 `kp-md-pipeline` Stage 6 + 新建 **Stage 7：教材注入**
  - 从 OpenStax MD **按章节关键词**抽取「核心概念」「典型例题」写入 kp-md / JSON 卫星
  - 从 `curriculum-standards/**/*.md` 抽取「教学提示 / 学业要求」写入 `teaching_methods` 或 MD 对应小节
- 目标：将 MD 中 `[待补充]` 比例压到 **<10%**（按 `md_status=ready` 节点统计）

### 腿 3 — 低优：生成时 RAG fallback

**触发条件**：lookup 返回 `match_count=0` 或 KCP 必填字段为空。

**做法**：`web_search` 检索「课标 + 知识点 + 教学设计」，结果写入 KCP 并标注 `source: web_fallback`；禁止静默当作课标原文。

---

## 4. 规范与脚本改动清单

| 序号 | 文件 | 改动 |
|------|------|------|
| 4.1 | `teachany/phases/workflow.md` | Phase 0 末尾 + Phase 1 开头：增加 **「0.5 / 1.0 知识层注入（强制）」** 步骤与失败处理 |
| 4.2 | `teachany/docs/content-richness-standards.md` | **新建**：每知识点最低内容量（课标句数、例题数、易错点数、习题讲解页最低字数） |
| 4.3 | `teachany/references/baseline-rules.md` | 新增 **B-20～B-24** 内容丰富度基线（见 §5） |
| 4.4 | `teachany/scripts/check_baseline.sh` 或 `validate-courseware.cjs` | 检测 PLAN.md 是否含 KCP 引用；检测 `index.html` 是否含至少 N 条可追溯题干 |
| 4.5 | `teachany/scripts/knowledge_layer.py` | `lookup --node-id`；合并 v1 JSON + v2 MD；`--emit-kcp plan.json` |
| 4.6 | `teachany/RULES.md` / `SKILL_CN.md` | 索引上述文档；生成课件前必读 content-richness |
| 4.7 | `kp-md-pipeline/stage7_textbook_inject.py` | ✅ 已建（腿 2；history/cn 试点） |
| 4.8 | `teachany-courseware` 发布 | 同步 `data/node-index.json`、`skill/data/kp-md/`（或改为 `data/kp-md/` 单一路径） |

### Phase 0/1 硬性步骤（写入 workflow 的草案条文）

```text
Phase 0.5 — 知识层检索（阻断项）
1. 已确认 node_id（find_nodes.py）。
2. 执行 knowledge_layer.py lookup（带 --node-id 与 --subject）。
3. 将 JSON 结果保存为 community/<course-id>/knowledge-context.json。
4. 在 PLAN.md 填写「知识层引用」表：课标条目 ID、例题编号、易错点编号。
5. 若 KCP 课标原文 < 2 条 且 例题 < 1 道 → 触发腿 3 web_search，仍不足则中止并报告缺口。

Phase 1 — 教学骨架
- ABT / 互动 / 测验题干须标注对应 KCP 字段（如 excerpt-2, exercise-1）。
- 禁止出现与 KCP 课标原文明显矛盾的表述。
```

---

## 5. 内容丰富度基线（B-20～B-24 草案）

| 编号 | 要求 | 验证方式 |
|------|------|----------|
| **B-20** | 存在 `knowledge-context.json` 或 PLAN 内嵌 KCP | 文件 / PLAN 章节检测 |
| **B-21** | 课标原文引用 ≥ 2 条（或 `curriculum_md_excerpt` ≥ 300 字） | lookup / PLAN |
| **B-22** | 预置例题用于习题讲解或测验 ≥ 1 道（含解析要点） | HTML + PLAN 对照 |
| **B-23** | 易错点 ≥ 1 条出现在互动反馈或「易错提示」 | section 文案 grep |
| **B-24** | 无未标注的 `[待补充]` 出现在面向学生的正文 | HTML 禁止占位符 |

与现有 19 项基线**叠加**，不替换 TTS/视频/KG 等项。

---

## 6. KCP 数据结构（`knowledge-context.json`）

```json
{
  "node_id": "hist-h-ancient-civ",
  "lookup_at": "2026-06-01T12:00:00Z",
  "sources": ["node-index-v2", "kp-json", "curriculum-standards"],
  "curriculum_excerpts": [{"id": "ex-1", "text": "...", "source": "kp-md#课标原文"}],
  "exercises": [{"id": "q-1", "stem": "...", "answer": "...", "source": "kp-json"}],
  "common_errors": [{"id": "err-1", "text": "...", "source": "kp-json"}],
  "prerequisites": ["..."],
  "extends": ["..."],
  "textbook_refs": [{"book": "OpenStax_Biology", "chapter": "...", "path": "books/..."}],
  "gaps": [],
  "fallback_used": false
}
```

---

## 7. 实施阶段与工期（建议）

| 阶段 | 内容 | 产出 | 建议工期 |
|------|------|------|----------|
| **P0** | 腿 1：扩展 `lookup` + workflow/RULES 硬性步骤 + `content-richness-standards.md` | Agent 必调知识层；历史三课 retro 填 KCP 样板 | 2–3 天 |
| **P1** | B-20～B-24 写入 baseline + `check_baseline` 检测 | CI/本地可拦「空泛课件」 | 1–2 天 |
| **P2** | 腿 2：pipeline Stage 7 + 批量灌 `[待补充]`（先 math/phy/bio/hist） | `md_status=ready` 比例 ↑ | 1–2 周（可并行） |
| **P3** | 腿 3：lookup 空结果 fallback 模板 | 冷门 node 不裸奔 | 2–3 天 |
| **P4** | courseware 仓 `kp-md` 路径统一 + teachany.cn 部署校验 | lookup 线上可用 | 1 天 |

**与分页 PPT 关系**：可并行；建议 **先 P0（接通水管）**，再批量重制历史课/缺口课，避免「12 页幻灯片但每页仍空」。

---

## 8. 验收指标

| 指标 | 当前（估） | P0 后 | P2 后 |
|------|------------|-------|-------|
| 新课件含 `knowledge-context.json` | ~0% | 100% | 100% |
| Agent 跑 lookup 可追溯（PLAN 引用） | 低 | 100% | 100% |
| 课标原文来自卫星而非纯 LLM | 低 | ≥80% 节点 | ≥95% |
| kp-md `[待补充]` 占比 | 高（待统计） | 不变 | <10% ready 节点 |

统计命令（待实现）：

```bash
python3 scripts/knowledge_layer.py audit --md-placeholders
python3 scripts/audit-kcp-coverage.py community/
```

---

## 9. 决策记录

- **采纳**：两条腿走路（先接通 lookup + 卫星，再离线灌教材）；实时 RAG 仅 fallback。
- **不采纳**：本阶段不上向量数据库；不把 OpenStax 全库每次生成时全量读入（仅节点级摘录）。
- **待你确认**：是否在下一轮直接 **落地 P0**（改 workflow + 扩展 lookup），还是先评审本文档再开发。

---

## 10. 参考路径

| 资源 | 路径 |
|------|------|
| 主 workflow（缺知识层） | `teachany/phases/workflow.md` |
| 开发 workflow（含 Phase 0.5 草案） | `references/workflow-development.md` |
| 知识层 CLI | `teachany/scripts/knowledge_layer.py` |
| 节点索引 | `teachany-courseware/data/node-index.json` |
| JSON 卫星示例 | `teachany-courseware/data/kp/` |
| 课标 OCR | `books/课标/md/` |
| Pipeline | `kp-md-pipeline/` |
| 摘录覆盖率报告 | `teachany-courseware/data/textbook-supplements/FULL_COVERAGE_REPORT.md` |
