# 新引擎开发规范

以 `templates/engines/function-lab/v1/engine.js` 为参照实现。骨架可复制 `templates/engine-template.js`。

## 1. 文件结构

```js
(function () {
  'use strict';
  var ENGINE_ID = 'xxx-lab';
  var ENGINE_VERSION = '1';
  var THEME = { /* 与 TeachAny 浅色体系一致 */ };

  function createScene(container, config) {
    // 状态 → DOM → 控件 → 渲染 → 交互 → 动画帧 → 返回实例
  }

  window.TeachAnyEngines = window.TeachAnyEngines || {};
  window.TeachAnyEngines[ENGINE_ID] = {
    version: ENGINE_VERSION,
    mount: function (container, config) { return createScene(container, config); }
  };
})();
```

## 2. 必须实现

| 项 | 要求 |
|:---|:---|
| config 归一化 | `normalizeConfig`：缺省补齐、非法值回退（`Number(v)` + `isFinite` 防护） |
| DPR 适配 | `canvas.width = cssWidth * devicePixelRatio`，`ctx.setTransform(dpr,...)` |
| 样式隔离 | `<style id="ta-<id>-style">` 单例注入；class 前缀 `.ta-<id>-` |
| 控件驱动 | 由 config.params/features 生成控件，不写死 |
| 事件登记 | 统一 `on(el,type,fn,opts)` 收集到 listeners 数组 |
| destroy | RAF、定时器、ResizeObserver、listeners、container.innerHTML 全清 |
| getState | 返回 `{params, view}` 快照 |
| 触控 | canvas `touch-action:none`；滑块 `accent-color`；横纵滑区分（竖滑>10px 放行页面滚动） |
| 数学正确 | 关键点坐标由解析式计算，不目测 |

## 3. 渲染性能

- 单帧 <16ms（60fps）
- 静态底纹（网格）与高频元素（粒子/曲线）分层；必要时离屏 canvas 缓存
- 粒子/精灵用预渲染位图，禁每帧渐变
- 动画帧里只做必要绘制；参数未变且非动画时可跳帧

## 4. 移动端

- 画布高 `min(62vw,460px)`、min-height 300px；窄屏控件降列数
- 字号 ≥11px；按钮 ≥32px 触控目标
- 竖屏不丢关键信息：公式读数浮于画布左上，缩放按钮右上

## 5. 引擎与课件的分工边界

| 引擎负责（容器内） | 课件负责（容器外） |
|:---|:---|
| 场景渲染、参数控件、追踪点、动画、缩放 | hero、教学点、挑战卡、tts、ai-tutor |
| 读 config 的 params/features/hint | 读 config 的 knowledge/teachingPoints/challenges |
| getState/setParam 供外部联动 | 调 setParam 做挑战判定/演示 |

## 6. 升版规则

- 改 bug、加 features 开关（向后兼容）→ 原位改 v1，通知相关课件回归
- mount 签名变化、config 字段改名/语义变化 → 建 `v2/` 目录，v1 保留不动
- 引擎文件头部注释写明契约与版本
