# courseware.config.json 配置 Schema

课件内容唯一载体。分**公共层**（所有引擎通用）与**引擎层**（各引擎自定义）。

## 公共层（必填）

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `engine` | string | 引擎 id，须已注册（如 `function-lab`） |
| `engineVersion` | string | 引擎主版本（如 `"1"`）；与注册版本不一致时页面 console.warn |
| `knowledge.nodeId` | string | 知识节点 id（与 manifest.node_id 一致） |
| `knowledge.title` | string | 课件标题 |
| `knowledge.formula` | string | 核心公式（hero 标签展示） |
| `knowledge.grade` | number | 年级 |
| `knowledge.subject` | string | 学科（math/physics/…） |
| `knowledge.subtitle` | string | hero 副标题（可选） |
| `hint` | string | 操作提示（渲染在控制区下方，可选） |
| `teachingPoints` | array | `[{title, body}]` 教学要点，页面自动渲染（可选） |
| `challenges` | array | `[{id, task, check}]` 挑战任务，check 为判定说明（可选） |

## 引擎层：function-lab@v1

| 字段 | 类型 | 默认 | 说明 |
|:---|:---|:---|:---|
| `functionType` | enum | `linear` | `linear` 一次 / `proportional` 正比例 / `quadratic` 二次（顶点式）/ `inverse` 反比例 |
| `params.<key>` | object | — | 覆盖参数定义：`{label, min, max, step, default}`；key 集由 functionType 决定 |
| `features.keyPoints` | bool | true | 标记关键点（截距/顶点） |
| `features.trace` | bool | true | 追踪点 P（悬停/点击读坐标） |
| `features.compare` | bool | true | 显示"对照曲线"按钮（橙色虚线快照） |
| `features.animate` | bool | true | 显示"参数动画"按钮（首个参数往返扫描；双击参数标签动画该参数） |
| `features.gridRange` | number | 10 | 初始视野半径（单位长度） |

### 各 functionType 的参数 key

| type | 参数 | 公式形态 |
|:---|:---|:---|
| `linear` | `k`（斜率）、`b`（截距） | y = kx + b |
| `proportional` | `k` | y = kx |
| `quadratic` | `a`（开口）、`h`（对称轴）、`k`（顶点纵坐标） | y = a(x−h)²+k |
| `inverse` | `k` | y = k/x（自动处理 x=0 间断与渐近线） |

## 引擎层：circuit-lab@v1（物理·电学）

| 字段 | 类型 | 默认 | 说明 |
|:---|:---|:---|:---|
| `params.U` | object | `{label:'电压 U (V)', min:0, max:12, step:0.5, def:6}` | 电源电压 |
| `params.R` | object | `{label:'电阻 R (Ω)', min:1, max:20, step:1, def:10}` | 定值电阻 |
| `features.recordData` | bool | true | "记录数据/清空数据"按钮（数据点叠加理论线） |
| `features.electronFlow` | bool | true | 电子流动画（流速∝I） |
| `features.modeSwitch` | bool | true | 双探究模式 tab：I∝U（R定）/ I∝1/R（U定） |

实例状态（getState）：`{mode, U, R, I, closed, records}`；setParam 支持 `U/R/closed`。

## 引擎层：equilibrium-lab@v1（化学·平衡）

| 字段 | 类型 | 默认 | 说明 |
|:---|:---|:---|:---|
| `params.kf` | object | `{label:'正反应速率常数 k正', min:1, max:10, step:0.5, def:6}` | 正反应速率常数 |
| `params.kr` | object | `{label:'逆反应速率常数 k逆', ...}` | 逆反应速率常数 |
| `features.disturb` | bool | true | "加入 A / 移除一半 B"扰动按钮 |
| `features.particles` | bool | true | 分子容器视图 |
| `totalMolecules` | number | 60 | 模拟分子总数 |

实例状态（getState）：`{kf, kr, countA, countB, K, rates{f,r}, time, playing}`；setParam 支持 `kf/kr/playing`。

### 完整示例

- `templates/engine-config.math.example.json`（数学·一次函数）
- `templates/engine-config.physics.example.json`（物理·欧姆定律）
- `templates/engine-config.chemistry.example.json`（化学·化学平衡）

### 二次函数示例片段

```json
{
  "engine": "function-lab", "engineVersion": "1",
  "knowledge": { "nodeId": "math-m-quadratic-function", "title": "二次函数的图像", "formula": "y = a(x−h)²+k", "grade": 9, "subject": "math" },
  "functionType": "quadratic",
  "params": {
    "a": { "default": 1 }, "h": { "default": 0 }, "k": { "default": 0 }
  },
  "features": { "compare": true, "gridRange": 12 }
}
```

## manifest.json 的 engine 字段

```json
"engine": {
  "id": "function-lab",
  "version": "1",
  "entry": "../../assets/engines/function-lab/v1/engine.js",
  "config": "./courseware.config.json"
}
```
