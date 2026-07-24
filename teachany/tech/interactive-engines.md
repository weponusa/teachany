# TeachAny 互动引擎（引擎化实验区）

> **所属**：TeachAny 技能 · 卫星文档
> **触发时机**：Phase 1 设计互动实验区、Phase 2 构建页面前
> **深度参考**：本目录下 `interactive-engines/`（架构/契约/schema/验收/POC 记录）；模板在 `templates/engines/` 与 `templates/engine-*`

本文件解决一个问题：**实验探究类互动，什么时候用 TeachAny 自研引擎，怎么用。**

## 1. 为什么有引擎层

课件基线 #3 要求"Canvas/SVG/iframe 真实互动"。历史做法是每个课件手写一份 Canvas 交互——结果是同一交互 bug 要在 300+ 课件里逐个修（`ai-tutor.js` 批量同步的教训）。

**引擎化 = 交互能力中央沉淀，课件只写知识内容**：

```text
courseware 仓库
├── assets/engines/<engine-id>/v<N>/engine.js   ← 引擎唯一一份（与 assets/scripts/ 同层，
│                                                   课件用 ../../assets/engines/ 相对路径引用，符合规则 #31a）
└── community/<course-id>/
    ├── index.html                ← 瘦壳：hero + 引擎挂载点 + 知识区块（五件套照接）
    ├── courseware.config.json    ← 课件全部内容：参数范围/教学点/挑战
    └── manifest.json             ← 含 engine 字段（id/version/entry/config）
```

## 2. 引擎选型（Phase 1 决策）

**实验探究类互动的优先级**：

| 优先级 | 方案 | 何时用 |
|:---|:---|:---|
| 1 | **TeachAny 引擎** | 知识点已被引擎覆盖（见下表）。自研、无外链、可配置、修一处全站受益 |
| 2 | PhET / GeoGebra / Desmos iframe | 引擎未覆盖但外部仿真成熟（`tech/iframe-resources.md`） |
| 3 | 手写 Canvas/SVG | 交互形态独特，无引擎也无成熟外部仿真（写完评估是否值得沉淀为新引擎） |

**已验证引擎**（截至 2026-07-24，均通过浏览器实测）：

| 引擎 | 覆盖知识点 | 关键交互 |
|:---|:---|:---|
| `function-lab` v1 | 一次/正比例/二次/反比例函数 | 参数滑块、追踪点读坐标、截距/顶点标注、对照曲线、参数动画、拖拽缩放 |
| `circuit-lab` v1 | 欧姆定律探究（可扩展串并联/电功率/焦耳定律） | 电路示意图、电子流动画（流速∝I）、控制变量双模式、记录数据叠加理论线 |
| `equilibrium-lab` v1 | 化学平衡/可逆反应/勒夏特列（可扩展反应速率） | 分子随机模拟、浓度-时间曲线、v正/v逆速率条、加料扰动、K 实测vs理论 |

新引擎需求（几何变换、粒子运动、绘本翻页、数轴等）按 `tech/interactive-engines/creating-engines.md` 开发。

## 3. 用法（Phase 2 装配）

1. **确认覆盖**：查引擎清单；`courseware.config.json` 选 `engine`/`engineVersion`/参数范围
2. **套壳**：复制 `templates/engine-courseware-shell.html`，改 meta/hero/学段 class
3. **写配置**：知识点 + `params` + `features` + `teachingPoints` + `challenges`（示例：`templates/engine-config.{math,physics,chemistry}.example.json`）
4. **manifest 加 engine 字段**：

```json
"engine": {
  "id": "circuit-lab",
  "version": "1",
  "entry": "../../assets/engines/circuit-lab/v1/engine.js",
  "config": "./courseware.config.json"
}
```

5. **五件套照常**：引擎实验区只占"互动实验台"卡片位；AI 学伴（可通过 `window.__courseEngine.getState()/setParam()` 读场景、驱动演示）、TTS、知识图谱、section hints 在壳层照接
6. **验收**：除常规基线外，过 `tech/interactive-engines/acceptance-checklist.md`（引擎注册/契约/生命周期/数学正确性）

## 4. 硬规则（与 RULES.md 衔接）

- 引擎实验区**计入基线 #3**（真实互动）；仍须满足其余 18 项基线（五件套/TTS/Hero/学段视觉等照常）
- **禁止**把引擎代码复制进课件目录改：一律引用 `assets/engines/` 中央版本；引擎 bug 修中央、课件零改动
- 引擎 id/版本/mount 契约变更必须升 `v<N>` 目录共存，老课件钉旧版（详见创建规范）
- 知识点未被覆盖时**不得**强行套引擎凑数——回到选型表第 2/3 优先级
