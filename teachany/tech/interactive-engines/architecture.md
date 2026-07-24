# 架构详解：引擎 + 配置 模式

## 1. 要解决的问题

TeachAny 课件的现状：每个课件是一个全量自包含 `index.html`（典型 60–80KB），交互代码逐课件复制。后果：

- **修复无法扩散**：一个 canvas 交互 bug 要在 300+ 课件里逐一改（`ai-tutor.js` 批量同步就是先例）
- **质量不一致**：不同课件的触控、DPR、移动端处理参差不齐
- **制作门槛高**：做新课件 = 写整个页面 + 全部交互

## 2. 模式定义

把"交互能力"与"知识内容"分离：

```
引擎（engines/<id>/v<N>/engine.js）
  = 交互能力：渲染管线、参数控件、拖拽缩放、动画、生命周期
  = 不认识任何具体知识点，只认 config 声明
  = 中央维护一份，全仓库课件共享

课件（community/<course-id>/）
  = 知识内容：标题、公式、参数范围、教学点、挑战
  = courseware.config.json（全部内容）+ 瘦壳 index.html（装配逻辑）
```

GitHub Pages 纯静态托管天然支持：引擎 JS 与课件 HTML 同源，相对路径 `../../assets/engines/<id>/v<N>/engine.js` 即可加载，生产环境也可用绝对地址。

## 3. 为什么引擎放中央仓库而不是课件内嵌

| 方案 | 修复扩散 | 课件体积 | 版本风险 |
|:---|:---|:---|:---|
| 引擎内嵌每个课件 | ❌ 改 N 处 | 大 | 各课件版本漂移 |
| **中央引擎 + 版本目录** | ✅ 改 1 处 | 小（壳+JSON） | v1/v2 目录共存，老课件钉住旧版本 |
| npm CDN | ✅ | 小 | 违背 TeachAny 静态自托管原则 |

版本化规则：`engines/<id>/v1/`、`v2/` 目录并存；破坏性变更（mount 签名、config 字段语义）必须升 v；老课件引用旧路径不受影响。

## 4. 与 TeachAny 现有体系的接口

| 现有部件 | 对接方式 |
|:---|:---|
| `manifest.json` | 增加 `engine: {id, version, entry, config}` 字段，其余字段不变 |
| registry / 知识树 | 不变；node_id 仍指向知识节点 |
| ai-tutor | 引擎实例暴露 `getState()/setParam()`，tutor 可读场景状态、驱动演示（"你看，当 k 变大时…"） |
| tts/ | 不变；讲解音频照常放课件目录 |
| Admin 发布流 | 校验清单增加引擎条目（见 acceptance-checklist） |

## 5. 引擎实例契约（详）

```js
// 注册（引擎文件执行时）
window.TeachAnyEngines['function-lab'] = { version: '1', mount(container, config) {} };

// 挂载（课件页面）
const instance = engine.mount(hostEl, config);

// 实例方法
instance.destroy();        // 必须：清理全部副作用
instance.getState();       // 必须：{ params, view, ... } 供调试/tutor
instance.setParam(k, v);   // 可选：外部设参（tutor 演示、挑战判定）
```

生命周期边界：**引擎管 `#engine-host` 容器内的一切，容器外（hero、教学点、挑战卡）归课件页面**。引擎样式注入用全局唯一 id 的 `<style>`，class 加 `.ta-<engine>-` 前缀。

## 6. 失败处理约定

课件壳必须优雅降级：
- config fetch 失败 → 容器内显示 `.load-fail` 错误卡（不白屏）
- 引擎未注册 → 提示引擎 id
- 版本不匹配 → console.warn，仍尝试挂载（同主版本内向后兼容）

## 7. 何时写新引擎 vs 复用

- 同一交互范式、不同知识点 → **复用引擎**（只写 config）
- 新交互范式（如从"函数图像"到"电路连接"）→ **新引擎**
- 现有引擎缺小能力 → 在引擎内加 `features` 开关 + config 字段（向后兼容，不升 v）
- 现有引擎要大改 → 升 v2 目录，老课件不动
