# TeachAny 可视化技术方案推荐

> 两套优化的技术流程组合：**几何演示动画与题目矢量图** + **历史地理地图动画**

---

## 一、平面几何与立体几何演示动画 + 题目矢量图

### 1.1 问题诊断

当前 TeachAny 几何课件（如 `math-elem-angles`、`math-high-space-figures`、`math-high-dihedral-angle` 等）主要使用 **HTML5 Canvas** 做交互动画。Canvas 适合动态交互，但存在以下短板：

| 痛点 | 表现 |
|:---|:---|
| **题目配图模糊** | Canvas 位图缩放失真，高分辨率屏幕下不够清晰 |
| **静态图不可选取** | Canvas 绘制的几何图形无法被屏幕阅读器识别、无法复制 |
| **标注排版困难** | Canvas 中文本对齐、公式渲染需要大量手工计算 |
| **立体图形透视** | 纯 2D Canvas 画立体图需要手动计算投影，容易出错 |
| **动画与静态图代码混杂** | 同一套 Canvas 代码既画静态题图又做动画演示，维护困难 |

### 1.2 推荐技术组合

```
┌─────────────────────────────────────────────────────┐
│                几何可视化技术分层                       │
├─────────────┬───────────────────────────────────────┤
│  层次        │  技术选择                               │
├─────────────┼───────────────────────────────────────┤
│  题目矢量图  │  ✅ 原生 SVG (DOM API)                 │
│  (静态/半静态)│  标注用 <text>/<foreignObject>         │
│             │  公式用 KaTeX inline                    │
├─────────────┼───────────────────────────────────────┤
│  平面几何动画 │  ✅ SVG + CSS/JS 动画                  │
│  (2D 交互)   │  拖拽用 pointer events                 │
│             │  轨迹用 <path> + dashoffset 动画        │
├─────────────┼───────────────────────────────────────┤
│  立体几何动画 │  ✅ CSS 3D Transforms                  │
│  (轻量 3D)   │  正交/等轴测投影的旋转、展开             │
│             │  不需要 WebGL，纯 CSS perspective        │
├─────────────┼───────────────────────────────────────┤
│  立体几何动画 │  ✅ Three.js (轻量引入)                 │
│  (真 3D 交互) │  透视旋转、截面切割、体积计算可视化       │
│             │  OrbitControls 自由旋转                  │
├─────────────┼───────────────────────────────────────┤
│  教学过程视频 │  ✅ Remotion + React (L2)              │
│  (程序化动画) │  分步推导、证明过程、动态作图             │
└─────────────┴───────────────────────────────────────┘
```

### 1.3 决策树：选哪个？

```
用户需求
  │
  ├── 题目配图（静态矢量图）？
  │     └── ✅ SVG（清晰、可缩放、可无障碍访问）
  │
  ├── 平面几何交互（拖点、画线、测角）？
  │     └── ✅ SVG + JS pointer events
  │
  ├── 立体图形展示（旋转观察、无复杂交互）？
  │     └── ✅ CSS 3D Transforms（零依赖、性能好）
  │
  ├── 立体图形深度交互（截面、展开、体积）？
  │     └── ✅ Three.js（轻量引入，OrbitControls）
  │
  └── 证明/推导过程视频？
        └── ✅ Remotion（程序化生成 mp4）
```

### 1.4 各技术实现规范

#### A. SVG 题目矢量图（★ 最高优先级优化项）

**适用**：所有涉及空间/几何/图形推理的例题和练习配图

```html
<!-- 标准三角形题目配图 -->
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="三角形ABC，角A=60°，AB=5cm，AC=8cm">
  <style>
    .geo-line { stroke: #1e293b; stroke-width: 2; fill: none; }
    .geo-point { fill: #3b82f6; r: 4; }
    .geo-label { font: 600 14px 'PingFang SC', sans-serif; fill: #1e293b; }
    .geo-angle { stroke: #ef4444; stroke-width: 1.5; fill: rgba(239,68,68,0.1); }
    .geo-dim { font: 400 12px 'PingFang SC', sans-serif; fill: #64748b; }
  </style>

  <!-- 三角形 -->
  <polygon points="50,250 350,250 200,50" class="geo-line"/>

  <!-- 顶点标注 -->
  <circle cx="50" cy="250" class="geo-point"/><text x="30" y="270" class="geo-label">A</text>
  <circle cx="350" cy="250" class="geo-point"/><text x="360" y="270" class="geo-label">B</text>
  <circle cx="200" cy="50" class="geo-point"/><text x="200" y="35" class="geo-label" text-anchor="middle">C</text>

  <!-- 角度弧线 -->
  <path d="M70,250 A20,20 0 0,0 58,235" class="geo-angle"/>
  <text x="80" y="238" class="geo-dim">60°</text>

  <!-- 边长标注 -->
  <text x="120" y="160" class="geo-dim" transform="rotate(-53,120,160)">5cm</text>
  <text x="280" y="160" class="geo-dim" transform="rotate(53,280,160)">8cm</text>
</svg>
```

**关键规范**：

| 规则 | 说明 |
|:---|:---|
| 必须用 `viewBox` | 保证任意尺寸缩放不失真 |
| 必须加 `role="img"` + `aria-label` | 无障碍访问，屏幕阅读器可读 |
| 标注字体用 `<text>` | 不用 Canvas `fillText`，可被选取、可搜索 |
| 公式用 `<foreignObject>` + KaTeX | SVG 内嵌 HTML 渲染数学公式 |
| 颜色语义化 | 线条 `#1e293b`、重点 `#3b82f6`、角度 `#ef4444`、辅助 `#64748b` |
| 虚线用 `stroke-dasharray` | 辅助线、隐藏棱用虚线区分 |

#### B. SVG + JS 平面几何交互动画

**适用**：全等三角形、圆的性质、函数图像、坐标几何

```javascript
// 可拖拽几何点的标准实现
class DraggablePoint {
  constructor(svg, x, y, label, constraints = {}) {
    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.circle.setAttribute('r', '8');
    this.circle.setAttribute('fill', '#3b82f6');
    this.circle.setAttribute('cursor', 'grab');
    this.circle.style.transition = 'r 0.15s';

    // Pointer events (触屏+鼠标统一)
    this.circle.addEventListener('pointerdown', (e) => this.startDrag(e));
    // ... 拖拽逻辑，约束在 constraints 范围内
  }

  updatePosition(x, y) {
    this.circle.setAttribute('cx', x);
    this.circle.setAttribute('cy', y);
    this.onMove?.(x, y); // 回调：重绘关联图形
  }
}

// 使用示例：拖动顶点观察三角形面积变化
const svgEl = document.getElementById('geo-svg');
const pointA = new DraggablePoint(svgEl, 50, 250, 'A');
const pointB = new DraggablePoint(svgEl, 350, 250, 'B', { yFixed: 250 });
const pointC = new DraggablePoint(svgEl, 200, 50, 'C');

function redrawTriangle() {
  // 重绘三角形 + 实时计算面积/角度
  const area = computeTriangleArea(pointA, pointB, pointC);
  document.getElementById('area-display').textContent = `面积 = ${area.toFixed(1)} cm²`;
}

[pointA, pointB, pointC].forEach(p => { p.onMove = redrawTriangle; });
```

**核心优势**：
- SVG 元素天然支持 `pointer events`，无需 Canvas hit-testing
- 每个几何元素都是 DOM 节点，可单独设置 `transition`、`class`
- 拖拽时图形实时重绘，且始终矢量清晰

#### C. CSS 3D Transforms 立体几何展示

**适用**：正方体、长方体、棱锥、圆柱的旋转观察（无需 WebGL）

```html
<style>
  .scene-3d {
    width: 300px; height: 300px;
    perspective: 800px;
    perspective-origin: 50% 40%;
  }
  .cube {
    width: 150px; height: 150px;
    position: relative;
    transform-style: preserve-3d;
    transform: rotateX(-25deg) rotateY(35deg);
    transition: transform 0.5s ease;
    margin: 75px auto;
  }
  .face {
    position: absolute; width: 150px; height: 150px;
    border: 2px solid #1e293b;
    background: rgba(59,130,246,0.08);
    display: flex; align-items: center; justify-content: center;
    font: 600 14px sans-serif; color: #3b82f6;
    backface-visibility: visible;
  }
  .front  { transform: translateZ(75px); }
  .back   { transform: rotateY(180deg) translateZ(75px); }
  .right  { transform: rotateY(90deg)  translateZ(75px); }
  .left   { transform: rotateY(-90deg) translateZ(75px); }
  .top    { transform: rotateX(90deg)  translateZ(75px); }
  .bottom { transform: rotateX(-90deg) translateZ(75px); }

  /* 高亮截面 */
  .face.highlight {
    background: rgba(239,68,68,0.2);
    border-color: #ef4444;
  }
</style>

<div class="scene-3d">
  <div class="cube" id="cube">
    <div class="face front">前</div>
    <div class="face back">后</div>
    <div class="face right">右</div>
    <div class="face left">左</div>
    <div class="face top">上</div>
    <div class="face bottom">下</div>
  </div>
</div>

<!-- 旋转控制 -->
<input type="range" id="rotateX" min="-90" max="90" value="-25">
<input type="range" id="rotateY" min="0" max="360" value="35">

<script>
  const cube = document.getElementById('cube');
  document.getElementById('rotateX').oninput = (e) => {
    cube.style.transform = `rotateX(${e.target.value}deg) rotateY(${document.getElementById('rotateY').value}deg)`;
  };
  document.getElementById('rotateY').oninput = (e) => {
    cube.style.transform = `rotateX(${document.getElementById('rotateX').value}deg) rotateY(${e.target.value}deg)`;
  };
</script>
```

**适用场景 & 限制**：

| ✅ 适合 | ❌ 不适合 |
|:---|:---|
| 正方体/长方体旋转观察 | 任意曲面（球、圆锥侧面） |
| 展开图折叠动画 | 截面切割的实时计算 |
| 面与面关系（二面角直观感受） | 需要精确3D测量的交互 |
| 对称性展示 | 大量三维物体同屏 |

#### D. Three.js 真 3D 交互（高中立体几何进阶）

**适用**：空间向量、二面角、截面切割、三视图

```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js",
               "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170/examples/jsm/" } }
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8fafc);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(4, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(500, 500);
document.getElementById('3d-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 创建棱锥
const geometry = new THREE.ConeGeometry(2, 3, 4); // 四棱锥
const wireframe = new THREE.WireframeGeometry(geometry);
const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x1e293b }));
scene.add(line);

// 半透明面
const solidMat = new THREE.MeshBasicMaterial({
  color: 0x3b82f6, transparent: true, opacity: 0.1, side: THREE.DoubleSide
});
scene.add(new THREE.Mesh(geometry, solidMat));

// 截面平面（可拖拽高度）
const planeGeo = new THREE.PlaneGeometry(6, 6);
const planeMat = new THREE.MeshBasicMaterial({
  color: 0xef4444, transparent: true, opacity: 0.3, side: THREE.DoubleSide
});
const sectionPlane = new THREE.Mesh(planeGeo, planeMat);
sectionPlane.rotation.x = Math.PI / 2;
sectionPlane.position.y = 1; // 初始高度
scene.add(sectionPlane);

// 网格辅助
scene.add(new THREE.GridHelper(8, 8, 0xe2e8f0, 0xe2e8f0));

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
```

**引入策略**：通过 `importmap` 从 CDN 加载，无需构建工具，单文件课件即可运行。

### 1.5 流程总结

```
几何课件开发流程
━━━━━━━━━━━━━━━

Step 1: 判断题型
  ├── 纯题目配图 → SVG 矢量图
  ├── 平面交互 → SVG + JS
  ├── 立体展示 → CSS 3D / Three.js
  └── 过程视频 → Remotion

Step 2: 编写 SVG/3D 组件
  • 静态图: viewBox + 语义化标注 + aria-label
  • 交互图: pointer events + 实时计算 + 反馈动画
  • 3D 图: OrbitControls + 线框 + 半透明面

Step 3: 嵌入课件骨架
  • SVG 内联到 section HTML
  • Three.js 用 importmap 加载
  • 与知识模块一一对应

Step 4: 响应式适配
  • SVG 用 viewBox 自适应
  • Three.js 监听 resize
  • 触屏支持 touch events
```

---

## 二、历史地理地图动画演示

### 2.1 问题诊断

当前项目存在**三套并存的技术方案**，导致不一致：

| 课件 | 技术栈 | 问题 |
|:---|:---|:---|
| `geo-monsoon` | Leaflet + GeoJSON | ✅ 运行良好，但仅瓦片底图，无地形 |
| `imperial-unification` | D3.js + MapLibre GL | 混用两套库，代码复杂，CDN 加载有时失败 |
| `templates/historical-map.html` | ECharts | ✅ 简洁但功能简陋，无地形、无动画 |

核心问题：
1. **MapLibre GL 的 AWS Terrain Tiles 在国内加载不稳定**（S3 访问超时）
2. **D3.js + MapLibre 混用导致坐标系对齐困难**
3. **GeoJSON 文件体量大**（单朝代 ~1MB），首屏加载慢
4. **缺少统一的地图动画模板**，每个课件从零开始

### 2.2 推荐技术组合：分场景选型

```
┌──────────────────────────────────────────────────────┐
│              历史地理地图技术分层                        │
├──────────────┬───────────────────────────────────────┤
│  场景          │  推荐方案                              │
├──────────────┼───────────────────────────────────────┤
│  疆域演变      │  ✅ ECharts 5 + Timeline              │
│  (朝代切换)    │  本地 GeoJSON，零依赖，性能最佳          │
│              │  散点+路线叠加，自动播放+手动切换          │
├──────────────┼───────────────────────────────────────┤
│  战役复盘      │  ✅ ECharts 5 + Lines + EffectScatter  │
│  (态势动画)    │  进攻路线动画+战役地点标记               │
│              │  Timeline 组件控制时间进度               │
├──────────────┼───────────────────────────────────────┤
│  地形分析      │  ⭐ 本地 Hillshade 图片（默认首选）      │
│  (地形底图)    │  data/geography/hillshade/*.jpg          │
│              │  升级：MapLibre GL + AWS Terrain（3D）   │
│              │  降级：ECharts GL geo3D 伪3D            │
├──────────────┼───────────────────────────────────────┤
│  实景地图      │  ✅ Leaflet + OpenStreetMap            │
│  (街道/卫星)   │  免费瓦片，适合现代地理                  │
├──────────────┼───────────────────────────────────────┤
│  全球气候/洋流 │  ✅ ECharts + 世界 GeoJSON              │
│              │  区域填充+箭头动画                       │
└──────────────┴───────────────────────────────────────┘
```

### 2.3 决策树

```
需要地图的课件
  │
  ├── 需要3D地形？
  │     ├── 是 + 联网环境 → MapLibre GL + AWS Terrain
  │     ├── 是 + 离线/国内 → MapLibre GL + 本地 terrain-tiles/
  │     └── 否 → ⭐ 本地 Hillshade 图片（data/geography/hillshade/*.jpg）
  │
  ├── 需要实景底图（街道/卫星）？
  │     ├── 是 → Leaflet + OpenStreetMap
  │     └── 否 → 下一步
  │
  └── 纯疆域/数据可视化？
        └── ✅ ECharts 5（推荐默认方案）
```

### 2.4 标准方案：ECharts 5 历史疆域动画模板

**这是 80% 历史地理课件的标准方案**，完全本地化、零 API Key、国内 CDN 可靠。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>历史疆域演变 - TeachAny 课件</title>
<script src="https://cdn.bootcdn.net/ajax/libs/echarts/5.5.1/echarts.min.js"></script>
<style>
  * { margin: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'PingFang SC', sans-serif; background: #0f172a; }
  #map { width: 100vw; height: 80vh; }
  .controls { padding: 16px; text-align: center; }
  .dynasty-btn {
    padding: 8px 20px; margin: 4px; border: none; border-radius: 20px;
    background: rgba(255,255,255,0.1); color: #e2e8f0; cursor: pointer;
    transition: all 0.3s;
  }
  .dynasty-btn.active { background: #d97706; color: #fff; font-weight: 700; }
</style>
</head>
<body>
<div id="map"></div>
<div class="controls" id="dynasty-controls"></div>

<script>
const chart = echarts.init(document.getElementById('map'), 'dark');

// ═══ 朝代配置 ═══
const DYNASTIES = [
  { id: 'qin',      name: '秦朝',  period: '前221-前206', color: '#6a1b9a', capital: [108.9, 34.3], capitalName: '咸阳' },
  { id: 'west-han', name: '西汉',  period: '前202-8',     color: '#1565c0', capital: [108.9, 34.3], capitalName: '长安' },
  { id: 'east-han', name: '东汉',  period: '25-220',      color: '#2e7d32', capital: [112.4, 34.6], capitalName: '洛阳' },
  { id: 'tang',     name: '唐朝',  period: '618-907',     color: '#e65100', capital: [108.9, 34.3], capitalName: '长安' },
  { id: 'yuan',     name: '元朝',  period: '1271-1368',   color: '#37474f', capital: [116.4, 39.9], capitalName: '大都' },
  { id: 'ming',     name: '明朝',  period: '1368-1644',   color: '#b71c1c', capital: [116.4, 39.9], capitalName: '北京' },
  { id: 'qing',     name: '清朝',  period: '1644-1912',   color: '#f9a825', capital: [116.4, 39.9], capitalName: '北京' },
];

// ═══ 生成按钮 ═══
const controlsEl = document.getElementById('dynasty-controls');
DYNASTIES.forEach((d, i) => {
  const btn = document.createElement('button');
  btn.className = 'dynasty-btn' + (i === 0 ? ' active' : '');
  btn.textContent = `${d.name}（${d.period}）`;
  btn.onclick = () => loadDynasty(d, btn);
  controlsEl.appendChild(btn);
});

// ═══ 加载朝代地图 ═══
async function loadDynasty(dynasty, btn) {
  // 更新按钮状态
  document.querySelectorAll('.dynasty-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // 优先尝试 inline JSON（小体积、快速加载）
  const inlinePath = `../../data/history/dynasties/${dynasty.id}-inline.json`;
  const geojsonPath = `../../data/geography/historical-china/${dynasty.id}-dynasty.geojson`;

  let geoJson;
  try {
    const res = await fetch(inlinePath);
    if (res.ok) { geoJson = await res.json(); }
    else { throw new Error('inline not found'); }
  } catch {
    const res = await fetch(geojsonPath);
    geoJson = await res.json();
  }

  const mapName = `dynasty-${dynasty.id}`;
  echarts.registerMap(mapName, geoJson);

  chart.setOption({
    title: {
      text: `${dynasty.name}疆域`,
      subtext: dynasty.period,
      left: 'center', top: 20,
      textStyle: { color: '#f8fafc', fontSize: 24 },
      subtextStyle: { color: '#94a3b8', fontSize: 14 }
    },
    tooltip: { trigger: 'item', formatter: '{b}' },
    geo: {
      map: mapName,
      roam: true,
      center: [108, 34],
      zoom: 1.2,
      label: { show: true, color: '#e2e8f0', fontSize: 11 },
      itemStyle: {
        areaColor: dynasty.color + '40', // 40% 透明度
        borderColor: dynasty.color,
        borderWidth: 2
      },
      emphasis: {
        itemStyle: { areaColor: dynasty.color + '80' },
        label: { color: '#fff', fontWeight: 'bold' }
      }
    },
    series: [{
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: [{ name: dynasty.capitalName, value: [...dynasty.capital, 100] }],
      symbolSize: 16,
      rippleEffect: { brushType: 'stroke', scale: 4 },
      itemStyle: { color: '#fbbf24' },
      label: { show: true, formatter: '{b}', position: 'right', color: '#fbbf24' }
    }],
    animationDurationUpdate: 800,
    animationEasingUpdate: 'cubicInOut'
  }, { notMerge: true }); // notMerge 清除上一朝代数据
}

// 默认加载第一个
loadDynasty(DYNASTIES[0], document.querySelector('.dynasty-btn'));

// 响应式
window.addEventListener('resize', () => chart.resize());
</script>
</body>
</html>
```

### 2.5 进阶方案：战役态势动画

```javascript
// 秦统一六国战役时间轴
const CAMPAIGNS = [
  { year: -230, target: '韩', from: [108.9,34.3], to: [113.7,34.2], result: '灭韩' },
  { year: -228, target: '赵', from: [108.9,34.3], to: [114.5,37.1], result: '灭赵' },
  { year: -225, target: '魏', from: [108.9,34.3], to: [114.3,34.8], result: '灭魏' },
  { year: -223, target: '楚', from: [108.9,34.3], to: [114.3,30.6], result: '灭楚' },
  { year: -222, target: '燕', from: [114.5,37.1], to: [116.4,39.9], result: '灭燕' },
  { year: -221, target: '齐', from: [108.9,34.3], to: [118.0,36.7], result: '灭齐' },
];

// 生成 timeline options
const timelineData = CAMPAIGNS.map(c => `公元${Math.abs(c.year)}年 灭${c.target}`);
const timelineOptions = CAMPAIGNS.map((c, i) => ({
  title: { text: `秦灭${c.target}（公元前${Math.abs(c.year)}年）` },
  series: [
    // 已征服区域（累积）
    { type: 'effectScatter', coordinateSystem: 'geo',
      data: CAMPAIGNS.slice(0, i + 1).map(p => ({
        name: p.target, value: [...p.to, 80],
        itemStyle: { color: '#ef4444' }
      })),
      symbolSize: 12, rippleEffect: { scale: 3 }
    },
    // 进军路线
    { type: 'lines', coordinateSystem: 'geo',
      effect: { show: true, trailLength: 0.4, symbol: 'arrow', symbolSize: 8, color: '#fbbf24' },
      lineStyle: { width: 2, color: '#fbbf24', curveness: 0.2 },
      data: [{ coords: [c.from, c.to] }]
    }
  ]
}));

chart.setOption({
  timeline: {
    axisType: 'category',
    data: timelineData,
    autoPlay: true,
    playInterval: 3000,
    controlStyle: { showPlayBtn: true },
    lineStyle: { color: '#94a3b8' },
    itemStyle: { color: '#fbbf24' },
    label: { color: '#e2e8f0' }
  },
  options: timelineOptions
});
```

### 2.6 3D 地形方案（鲁棒性优化）

针对 MapLibre GL + AWS Terrain Tiles 在国内不稳定的问题，推荐**三级降级策略**：

```javascript
// 三级降级地形加载
async function initTerrainMap(containerId) {
  const map = new maplibregl.Map({
    container: containerId,
    style: {
      version: 8,
      sources: {
        'osm': { type: 'raster', tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ], tileSize: 256 }
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#e8dcc7' } },
        { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.3 } }
      ]
    },
    center: [108, 34], zoom: 5, pitch: 50
  });

  await new Promise(resolve => map.on('load', resolve));

  // ═══ Level 1: 本地预缓存瓦片 (最可靠) ═══
  try {
    const testRes = await fetch('../../data/terrain-tiles/6/50/24.png', { method: 'HEAD' });
    if (testRes.ok) {
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['../../data/terrain-tiles/{z}/{x}/{y}.png'],
        encoding: 'terrarium', tileSize: 256, maxzoom: 7
      });
      map.setTerrain({ source: 'terrain', exaggeration: 2.5 });
      console.log('✅ 地形加载: 本地瓦片');
      return map;
    }
  } catch {}

  // ═══ Level 2: AWS Terrain Tiles (全球30m) ═══
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5秒超时
    const testRes = await fetch(
      'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/6/50/24.png',
      { method: 'HEAD', signal: controller.signal }
    );
    clearTimeout(timeout);

    if (testRes.ok) {
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium', tileSize: 256, maxzoom: 15
      });
      map.setTerrain({ source: 'terrain', exaggeration: 2.5 });
      addHillshade(map);
      console.log('✅ 地形加载: AWS Terrain Tiles');
      return map;
    }
  } catch {}

  // ═══ Level 3: 纯 2D 降级 (保证可用) ═══
  console.warn('⚠️ 3D 地形不可用，降级为 2D 地图');
  map.setPitch(0);
  return map;
}

function addHillshade(map) {
  map.addLayer({
    id: 'hillshade', type: 'hillshade', source: 'terrain',
    paint: {
      'hillshade-exaggeration': 0.8,
      'hillshade-shadow-color': '#5a3d2b',
      'hillshade-highlight-color': '#f5e6d3',
      'hillshade-illumination-direction': 135
    }
  });
}
```

### 2.7 GeoJSON 加载优化

解决大文件（1MB+ GeoJSON）首屏加载慢的问题：

```javascript
// ═══ 策略 1: 精简版优先 ═══
// data/geography/modern-china/provinces-ultra-lite.json (27KB)
// 用于首屏快速渲染，交互时按需加载完整版

// ═══ 策略 2: inline JSON 缓存 ═══
// data/history/dynasties/qin-inline.json (188KB, vs qin-dynasty.geojson 926KB)
// 预处理过的精简版，去除冗余坐标精度

// ═══ 策略 3: 并行预加载 ═══
async function preloadDynasties(dynastyIds) {
  const cache = new Map();
  const promises = dynastyIds.map(async id => {
    const paths = [
      `../../data/history/dynasties/${id}-inline.json`,
      `../../data/geography/historical-china/${id}-dynasty.geojson`
    ];
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (res.ok) { cache.set(id, await res.json()); return; }
      } catch {}
    }
  });
  await Promise.all(promises);
  return cache;
}

// 页面加载时预取所有朝代数据
const geoCache = preloadDynasties(['qin','west-han','east-han','tang','yuan','ming','qing']);
```

### 2.8 历史地理地图开发流程

```
历史/地理课件地图开发流程
━━━━━━━━━━━━━━━━━━━━━

Step 1: 确定场景类型
  ├── 疆域演变 → ECharts + Timeline
  ├── 战役复盘 → ECharts + Lines + EffectScatter
  ├── 地形分析 → MapLibre GL + DEM（三级降级）
  └── 实景地图 → Leaflet + OpenStreetMap

Step 2: 选择数据源
  ├── 疆域 → data/geography/historical-china/*.geojson
  │         data/history/dynasties/*-inline.json (优先)
  ├── 战役 → data/history/battles/major-battles.geojson
  ├── 城市 → data/history/cities/ancient-capitals.geojson
  ├── 地形 → data/geography/hillshade/*.jpg (本地，推荐) 或 terrain-tiles/ (3D)
  └── 时间线 → data/history/timelines/dynasties-detailed.json

Step 3: 从模板开始
  ├── 疆域 → data/geography/templates/historical-map.html
  ├── 中国底图 → data/geography/templates/china-base-map.html
  └── 3D 地形 → data/geography/templates/terrain-3d-examples.html

Step 4: CDN 策略（国内优先）
  ├── ECharts → cdn.bootcdn.net (主) / cdn.staticfile.net (备)
  ├── Leaflet → cdn.bootcdn.net (主) / npmmirror.com (备)
  ├── MapLibre → unpkg.com (主) / jsdelivr.net (备)
  └── 所有 CDN 加 SRI 校验 + onerror 回退

Step 5: 性能与降级
  ├── GeoJSON 预处理（mapshaper 简化精度）
  ├── inline JSON 缓存（<200KB 优先）
  ├── 3D 地形三级降级（本地→AWS→2D）
  └── 响应式：移动端自动切换 2D 模式
```

---

## 三、技术方案对照总结

| 维度 | 几何可视化 | 历史地理地图 |
|:---|:---|:---|
| **首选技术** | SVG (题图) + CSS 3D (立体) | ECharts 5 (疆域/战役) |
| **进阶技术** | Three.js (真3D交互) | MapLibre GL (3D地形) |
| **过程视频** | Remotion | Remotion |
| **数据格式** | 坐标数组 (inline JS) | GeoJSON + inline JSON |
| **离线能力** | ✅ 完全离线 | ✅ 完全离线 (本地瓦片+GeoJSON) |
| **API 依赖** | ❌ 无 | ❌ 无 |
| **移动端适配** | SVG viewBox 自适应 | ECharts resize / 2D 降级 |
| **鲁棒性策略** | CSS 3D → SVG 2D 投影 | 本地瓦片 → AWS → 2D |

---

## 四、SKILL 文件更新建议

建议将以上方案整理为 SKILL_CN.md 的新 section（如 "Section 19: 几何可视化规范"），核心规则：

1. **例题配图必须用 SVG**，禁止用 Canvas 位图或截图
2. **SVG 必须包含 `viewBox` + `role="img"` + `aria-label`**
3. **立体几何首选 CSS 3D Transforms**，仅复杂截面/向量运算时升级 Three.js
4. **历史地理地图默认用本地 Hillshade 图片底图**（`data/geography/hillshade/global-color-hillshade-4k.jpg`），仅需3D交互时升级 MapLibre GL
5. **所有地图数据必须使用 `data/` 预置资源**，禁止外部 API
6. **3D 地形必须实现三级降级**（本地 Hillshade→本地瓦片→AWS→纯2D）

---

*文档版本：v1.0 | 创建日期：2026-04-14 | 基于 TeachAny v5.12 技术栈分析*
