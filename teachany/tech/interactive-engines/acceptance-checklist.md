# 验收清单（引擎课件）

发布前逐项实测，禁止"应该没问题"。

## A. 加载链路

- [ ] `python3 -m http.server` 起在 courseware 根，课件页 200
- [ ] 引擎 JS 200（相对路径 `../../assets/engines/...` 正确）
- [ ] config JSON 200 且合法
- [ ] 浏览器控制台无 error（warn 需说明）
- [ ] 引擎注册表存在：`TeachAnyEngines['<id>'].version` 与 config.engineVersion 一致

## B. 交互正确

- [ ] 每个滑块拖动都实时改变场景与公式显示
- [ ] 追踪点坐标 = 解析式代入值（抽 3 组手算核对）
- [ ] 关键点标注（截距/顶点/渐近线）数学正确
- [ ] 拖拽平移、滚轮缩放、复位按钮生效
- [ ] 对照曲线/参数动画开关生效
- [ ] 触控：滑块可拖、画布可拖、页面竖滑不被画布拦截

## C. 生命周期

- [ ] `instance.destroy()` 后容器 DOM 为空
- [ ] 同容器反复 mount/destroy 10 次：无残留 DOM、无重复事件、公式正确
- [ ] 窗口 resize 后画面不模糊、不错位
- [ ] DPR=2（Mac）与 DPR=1 下线条锐利度一致

## D. 内容完整

- [ ] config 的 knowledge 与 manifest.json 字段一致（nodeId/title/grade/subject）
- [ ] teachingPoints 全部渲染、无空 body
- [ ] challenges 可完成（用引擎参数真能调出目标状态）
- [ ] manifest 含 `engine` 字段（id/version/entry/config）

## E. 风格一致

- [ ] TeachAny 浅色主题变量（--bg #f8fafc / --primary #3b82f6 / --secondary #06b6d4）
- [ ] 引擎样式不污染页面其他元素（前缀隔离）
- [ ] 中文无乱码，公式上下标正常（² ³ ₀ − √）
- [ ] 窄屏（375px）无横向滚动条
