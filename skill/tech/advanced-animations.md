# ✨ 高级动画卫星文档（TeachAny · v7.9.5）

> **触发时机**：课件需要**滚动驱动动画、预制 Lottie 动画、复杂 Canvas 交互**时加载。
> **定位**：补充常规 CSS transition / Remotion 之外的三类高级前端动画工具。
> **渐进披露**：本文档约 700 tokens，按需加载。

---

## 一、工具矩阵

| 工具 | 专长 | 调用方式 | 体积 | 版权 |
|:---|:---|:---|:---:|:---|
| **GSAP** | 时间线驱动 / 滚动触发 / SVG morph | CDN + JS | ~50KB | Standard License（商用免费） |
| **Lottie-web** | AE 导出的矢量动画 | CDN + JSON | ~250KB | MIT |
| **Konva** | 复杂 Canvas 交互（拖拽/分组/变换） | CDN + JS | ~200KB | MIT |

**选型原则**：
- 需要**滚动到某段触发动画**（如展开公式推导）→ GSAP ScrollTrigger
- 需要**加载现成的装饰动画**（粒子、火箭发射）→ Lottie
- 需要**学生可拖拽/缩放图形**（几何教具）→ Konva
- 简单 CSS transition 能做到的 → **不要**引入这三个库

---

## 二、GSAP 滚动驱动（最常用）

### 2.1 模板：滚动触发知识卡片展开

```html
<section class="gsap-reveal-section">
  <div class="card reveal-item" data-reveal-order="1">
    <h3>概念 1</h3><p>...</p>
  </div>
  <div class="card reveal-item" data-reveal-order="2">
    <h3>概念 2</h3><p>...</p>
  </div>
  <div class="card reveal-item" data-reveal-order="3">
    <h3>概念 3</h3><p>...</p>
  </div>
</section>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.reveal-item').forEach((el, i) => {
    gsap.from(el, {
      y: 60, opacity: 0, duration: 0.8, delay: i * 0.1,
      scrollTrigger: { trigger: el, start: 'top 80%', once: true }
    });
  });
</script>
```

### 2.2 模板：公式逐步推导（时间线）

```javascript
const tl = gsap.timeline({ scrollTrigger: { trigger: '#formula-section', start: 'top 60%', end: 'bottom 20%', scrub: true }});
tl.from('#step-1', { opacity: 0, x: -50 })
  .from('#step-2', { opacity: 0, x: -50 }, '+=0.2')
  .from('#result', { opacity: 0, scale: 0.8, color: '#dc2626' }, '+=0.3');
```

### 2.3 适用场景

- 知识卡片依次飞入
- 公式推导逐步展开
- SVG 路径绘制（配合 `DrawSVGPlugin`）
- 数字从 0 滚动到目标值（`gsap.to(obj, { val: 100, onUpdate: ... })`）

⚠️ **慎用**：过度使用会让学生注意力分散。**每页滚动动画 ≤ 5 处**，且必须服务教学（不是纯装饰）。

---

## 三、Lottie 矢量动画

### 3.1 嵌入模板

```html
<div id="lottie-rocket" style="width:300px;height:300px;margin:0 auto"></div>
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>
<script>
  lottie.loadAnimation({
    container: document.getElementById('lottie-rocket'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: './assets/lottie/rocket.json'  // 或用 LottieFiles CDN
  });
</script>
```

### 3.2 动画来源

1. **LottieFiles**（`https://lottiefiles.com/`）：免费下载数千个 JSON，搜索"science / physics / math / china / history"等
2. **自制**：Adobe After Effects + Bodymovin 插件导出 JSON

### 3.3 适用场景

- 页面 hero 区装饰性动画（火箭、粒子）
- 概念引入的视觉比喻（DNA 解旋动画）
- 成就反馈（答对时的✓动画）

⚠️ **不能替代基线 ②**：Lottie 是装饰，不是教学视频。基线 ② 要求 Remotion 真实讲解过程。

---

## 四、Konva Canvas 交互（数学/物理教具）

### 4.1 模板：可拖拽几何教具

```html
<div id="konva-stage"></div>
<script src="https://cdn.jsdelivr.net/npm/konva@9.3.0/konva.min.js"></script>
<script>
  const stage = new Konva.Stage({ container: 'konva-stage', width: 800, height: 500 });
  const layer = new Konva.Layer(); stage.add(layer);
  // 三角形三顶点 + 连线
  const pts = [{x:200,y:400},{x:600,y:400},{x:400,y:150}];
  const line = new Konva.Line({ points: pts.flatMap(p=>[p.x,p.y]), closed: true, stroke: '#3b82f6', strokeWidth: 3, fill: 'rgba(59,130,246,0.1)'});
  layer.add(line);
  pts.forEach((p, i) => {
    const dot = new Konva.Circle({ x: p.x, y: p.y, radius: 12, fill: '#ef4444', draggable: true });
    dot.on('dragmove', () => {
      pts[i] = { x: dot.x(), y: dot.y() };
      line.points(pts.flatMap(q => [q.x, q.y]));
      updateAngleDisplay();  // 自定义函数实时计算三个角
    });
    layer.add(dot);
  });
  layer.draw();
</script>
```

### 4.2 适用场景

- 学生拖动顶点观察"三角形内角和 = 180°"
- 拖动圆心改变位置，观察两圆相交 / 相切 / 相离
- 分组 + 变换（旋转、缩放）演示"全等变换"
- 可撤销 / 重做的绘图板

⚠️ **简单几何**（一次绘制无交互）用 SVG 或 p5.js 即可，**不必**引入 Konva。

---

## 五、性能与使用边界

| 场景 | 建议工具 | 慎用 |
|:---|:---|:---|
| 1-3 个元素淡入 | CSS `@keyframes` | GSAP / Lottie |
| 滚动触发 5+ 元素 | GSAP ScrollTrigger | CSS scroll |
| 复杂多步动画 | GSAP Timeline | 手写 setTimeout |
| 学生可拖拽 | Konva / Matter.js | 手写 mousedown |
| 装饰动画 | Lottie | 自建 SVG |

**加载策略**：
- GSAP：全局引入即可，副作用很少
- Lottie：**懒加载**（IntersectionObserver 进入视口再加载 JSON）
- Konva：仅在含拖拽交互的模块引入

---

## 六、与 TeachAny 基线能力的配合

| 基线 | 关系 |
|:---|:---|
| ② Remotion 视频 | **互补**：Remotion 做 mp4 预渲染；GSAP/Lottie 做页面内实时动画 |
| ③ Canvas 互动组件 | Konva 拖拽几何教具**算合规** |
| ⑤ Hero 知识结构主图 | Lottie 可作为 hero 区**次要**装饰，但主图仍须是静态信息图 |
| ⑫ 情境感知气泡 | GSAP 可用于气泡淡入淡出自定义效果（但标准模块已处理，无需重复） |

---

## 七、自检清单

- [ ] 每引入一个库都有明确教学意图，不是"看起来酷"？
- [ ] 滚动动画 ≤ 5 处 / 页？
- [ ] Lottie JSON 文件 ≤ 500KB？（大于 500KB 说明动画过于复杂，改用 mp4）
- [ ] Konva 交互有配套的文字说明（"💡 拖动顶点观察..."）？
- [ ] 在性能较差的移动端测试过（iPhone SE / 低端 Android）？

---

## 八、版本
- v7.9.5 · 2026-05-09 · 首次发布
- 主文 SKILL_CN.md 的"技术实现延伸"表新增一行 → `tech/advanced-animations.md`
