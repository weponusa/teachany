# TeachAny 分层互动动画工具规范

> 适用：所有需要“教学动画 / 互动动画 / 视频化讲解 / 过程演示”的 K12 课件。  
> 原则：**先选对表达工具，再生成资源**。不要把所有动画都交给 Remotion，也不要用 `ffmpeg testsrc`、色块运动、纯标题飞入等占位动画交付。

## 1. 决策总表

| 层级 | 教学目标 | 首选工具 | 产物 | 典型场景 |
| --- | --- | --- | --- | --- |
| L1 页面内实时互动 | 学生拖动、点击、试错、即时反馈 | 原生 Canvas / SVG / p5.js | HTML 内交互组件 | 二分查找、递归树、参数滑块、拖拽分类 |
| L2 算法/流程教学动画 | 展示程序执行、状态转移、调用栈、排序过程 | **Motion Canvas** | `assets/video/*.mp4` + `assets/animation-source/*.ts(x)` | 递归、分治、图算法、协议流程、状态机 |
| L3 数学/几何/公式推导 | 严谨公式、坐标、几何构造、函数图像 | **Manim Community** | `assets/video/*.mp4` + `assets/animation-source/*.py` | 函数变换、导数、几何证明、概率分布 |
| L4 科学仿真/实验探究 | 自由调参、实验模拟、真实科学模型 | PhET / GeoGebra / Desmos / 3Dmol / Matter.js | iframe / Canvas / 外部工具嵌入 | 物理实验、化学分子、函数图像、生物过程 |
| L5 轻量装饰动效 | 氛围、图标、微交互，不承载核心教学 | CSS / Lottie / Rive | CSS/JSON/wasm/canvas | 封面动效、状态反馈、按钮过渡 |
| L6 3D/复杂空间动画 | 立体结构、器件装配、复杂视角 | Blender / Three.js | MP4 / glTF / WebGL | 分子结构、机械结构、天体/地形 |
| L7 React 视频合成 | 需要把 React 页面/组件剪成视频 | Remotion | MP4 + React source | 页面级宣传片、多镜头合成、已有 React 组件复用 |

## 2. 强制选择规则

### 算法与信息科技

- 调用栈、递归、二分查找、归并排序、图遍历、状态机：**首选 Motion Canvas**。
- 如果只是课件内实时操作：用原生 Canvas/SVG，并保留学生可操作控件。
- Remotion 仅在需要 React 视频合成时使用，不再作为算法动画默认选项。

### 数学

- 公式推导、坐标系、函数曲线、几何构造：**首选 Manim**。
- 可互动图像优先 GeoGebra / Desmos。
- 页面内参数探索可用 Canvas，但不得替代成熟数学工具。

### 物理 / 化学 / 生物

- 自由实验探究优先 PhET / 3Dmol / Matter.js。
- 固定过程解释可用 Motion Canvas 或 Manim。
- 分子/器件空间结构可用 3Dmol / Blender / Three.js。

### 语文 / 英语

- 对话场景、句式拆解、文本结构高亮：Canvas/SVG 或 Motion Canvas。
- 古诗文意境动画可用 CSS/Lottie/Canvas，但必须服务文本理解，不得只有装饰。

### 地理

- 地图/区域：先用标准地图模块与 GeoJSON，不手写 Leaflet。
- 自然过程（气候、水循环、地貌）：Motion Canvas / Canvas / OER 视频片段。

## 3. 交付物规范

### 若生成 MP4

必须同时交付：

```text
assets/video/<course-id>-main.mp4
assets/animation-source/<tool>/<source-file>
tts/*.mp3 或音频轨
```

MP4 必须满足：

- 有 video stream。
- 有 audio stream。
- 不是 `testsrc` / 色条 / 纯噪音 / 静态图缩放。
- 核心场景不少于 3 个，且至少 40% 时长用于核心知识过程。
- `ffprobe` 验证音视频流。

### 若是页面内交互

必须满足：

- 有学生可操作控件：`button/input/select/drag/pointer` 至少一种。
- 操作后有可见状态变化和文字反馈。
- 不能只点击弹窗；不能伪装互动。
- 必须移动端可用。

## 4. 工具选择优先级

```text
先问教学目的：
1. 学生需要亲手试错？ → Canvas/SVG/p5.js/PhET/GeoGebra
2. 需要展示算法执行过程？ → Motion Canvas
3. 需要展示数学推导？ → Manim
4. 需要真实科学实验？ → PhET/3Dmol/Matter.js
5. 只是氛围动效？ → CSS/Lottie/Rive
6. 复杂 3D？ → Blender/Three.js
7. 需要 React 组件转视频？ → Remotion
```

## 5. 禁止项

- 禁止用 `ffmpeg testsrc`、纯色块、随机几何运动冒充教学动画。
- 禁止“mp4 有音轨但内容无教学意义”。
- 禁止所有学科一律 Remotion。
- 禁止只做视频、不做页面内互动；视频不能替代学生操作。
- 禁止只放静态图然后标题写“互动”。

## 6. 验证命令

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name -of json assets/video/<file>.mp4
python3 scripts/validate-courseware.py <course-id>
python3 scripts/validate-teaching-quality.py community/<course-id> --json
```

## 7. 推荐目录结构

```text
community/<course-id>/
  index.html
  manifest.json
  PLAN.md
  knowledge-context.json
  assets/
    hero-infographic.svg
    video/<course-id>-main.mp4
    animation-source/
      motion-canvas/scene.tsx
      manim/scene.py
  tts/
    intro.mp3
    core.mp3
    summary.mp3
```

## 8. 当前推荐默认值

| 学科/课型 | 默认工具 |
| --- | --- |
| 信息科技算法课 | Motion Canvas + 页面 Canvas 互动 |
| 数学函数/几何 | Manim + GeoGebra/Desmos |
| 物理实验 | PhET 或 Matter.js + Motion Canvas 过程讲解 |
| 化学分子/反应 | 3Dmol.js + Motion Canvas/Manim |
| 生物过程 | Canvas/Motion Canvas + 图示动画 |
| 地理地图课 | 标准地图模块 + Canvas/Motion Canvas 过程图 |
| 语文/英语语言结构 | SVG/Canvas 高亮 + Motion Canvas 场景 |
