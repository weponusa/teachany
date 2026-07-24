# POC 验证记录：function-lab@v1 + 一次函数课件

2026-07-24 实测通过。POC 为独立沙盒目录（镜像 courseware 仓库结构：assets/engines + community）。

## 验证目标

证明"共享引擎 + JSON 配置"模式在 TeachAny 静态托管模型下成立：
1. 引擎单文件、无依赖、中央放置
2. 课件 = 瘦壳 index.html + courseware.config.json（不写交互代码）
3. 同引擎零修改驱动 4 种函数
4. 交互与生命周期达标

## 验证环境

- 本地服务：`python3 -m http.server 8474`（根目录 = engine-poc）
- 浏览器自动化实测（Playwright），非目测推断

## 实测结果

### 资源加载
| 资源 | 状态 |
|:---|:---|
| community/math-m-linear-function-lab/ | 200 |
| engines/function-lab/v1/engine.js | 200 |
| courseware.config.json | 200 |

### 挂载与配置驱动
```json
{ "engineRegistered": true, "instanceAlive": true,
  "state": { "params": { "k": 1, "b": 2 } },
  "sliderCount": 2, "formula": "y = 1x + 2",
  "teachingPoints": 3, "challenges": 3 }
```
默认值来自 config（k=1, b=2）✓；教学点/挑战由 config 渲染 ✓

### 交互数学正确性
- k 滑块拖到 −2 → 公式实时变 `y = -2x + 2` ✓
- 点击画布追踪 → `P(7.5, -13)`；验算 −2×7.5+2 = −13 ✓
- 截距标注：y 轴 (0, 2)、x 轴 (1, 0) ✓（−2x+2=0 → x=1）
- 对照曲线开关、参数动画按钮生效 ✓

### 同引擎多函数（零修改）
| functionType | 公式显示 | 滑块数 | 关键标记 |
|:---|:---|:---|:---|
| quadratic | `y = 0.5(x − 1)² − 2` | 3（a/h/k） | 顶点 (1,−2) + 对称轴虚线 ✓ |
| inverse | `y = 6 / x` | 1（k） | x=0 间断 + 渐近线 ✓ |
| linear | `y = 1x + 2` | 2（k/b） | 双截距 ✓ |

### 生命周期
- destroy() 后容器 DOM 为空 ✓
- 同容器连续 mount/destroy 4 种函数后 `innerHTML === ''` ✓
- 修复记录：初版 `setPointerCapture` 在合成事件下抛错 → 已加 try/catch 防护

## 截图证据

- 一次函数完整页：`verification/ta-function-lab-poc.png`（engine-poc 内）
- 二次函数引擎区：`verification/ta-function-lab-quadratic.png`（engine-poc 内）

## 结论

模式成立。一个 4KB 配置 + 5KB 壳页面即产出完整交互课件；引擎升级一处，全部课件受益。下一步：按需扩展 comic-lab（绘本）/particle-lab（粒子）等引擎，并把该模式写进 TeachAny 课件制作流程。

---

# POC 第二轮：物理/化学课件引擎升级（2026-07-24）

对两个**已有正式课件**做引擎升级验证：phy-m-ohms-law（欧姆定律 G9）、chem-h-chemical-equilibrium（化学平衡 G11）。升级版在 POC 沙盒 `community/phy-m-ohms-law-lab`、`community/chem-h-chemical-equilibrium-lab`。

## circuit-lab@v1（欧姆定律）

新增引擎能力：电路示意图（电源/开关/电流表/定值电阻/电压表/电子流动画，流速∝I）、I-U 与 I-R 双探究模式（控制变量法）、记录数据点叠加理论线、开关闭合/断开。

实测数据：
| 操作 | 结果 | 验算 |
|:---|:---|:---|
| 初始 U=6V R=10Ω | I=0.6A | 6/10 ✓ |
| U→10V | I=1A | 10/10 ✓ |
| 切 r-mode 记录 R=10Ω | 点 (10, 1) | 10/10 ✓ |
| 记录 R=5Ω | 点 (5, 2)，与理论反比曲线重合 | 10/5 ✓ |

截图：`verification/ta-circuit-lab-poc.png`（engine-poc 内）

## equilibrium-lab@v1（化学平衡）

新增引擎能力：A⇌B 一级可逆反应随机模拟（60 分子）、浓度-时间滚动曲线、v正/v逆 速率条、加入 A/移除 B 扰动、K 实时与理论值对比。

实测数据（勒夏特列全流程）：
| 阶段 | A | B | K 实测 | K 理论 |
|:---|:---|:---|:---|:---|
| k正=k逆=6 平衡 | 32 | 28 | 0.875 | 1 ✓ |
| 改 k正=9/k逆=3 | 18 | 42 | 2.33→ | 3（收敛中）|
| 加入 20 个 A 瞬间 | 38 | 42 | 1.11 | —（被打破）|
| 10s 后再平衡 | 19 | 61 | **3.21** | **3 ✓ 回归** |

扰动后 K 回归理论值——平衡移动但 K 不变，教学核心命题成立。截图：`verification/ta-equilibrium-lab-poc.png`（engine-poc 内）

## 升级方法学（已有课件 → 引擎版）

1. 保留原课件知识节点（node_id 不变，manifest 加 `upgrade_of` 溯源）
2. 实验区整体替换为引擎挂载点；知识内容（教学点/挑战）从原课件提炼进 config
3. 原课件的 TTS/知识图谱/AI 学伴可继续在壳页面挂载（POC 未接入，属壳层装配，与引擎无关）
4. 引擎按交互范式沉淀：circuit-lab 后续可承载串并联/电功率；equilibrium-lab 可承载反应速率专题
