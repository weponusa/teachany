# TeachAny 统计与学习路径使用指南

## 📊 实时统计系统

### 自动更新
访问首页时，所有统计数字会自动从数据源实时计算并更新：

```
✅ 总课件: 131      (实时统计)
✅ 官方课件: 0       (registry过滤)
✅ 社区课件: 131     (registry过滤)
✅ 学科数: 8         (去重统计)
✅ 知识节点: 275     (图谱扫描)
✅ 知识图谱: 44      (文件计数)
```

### 手动刷新
浏览器控制台执行：
```javascript
await window.TeachAnyStats.updatePageStats()
```

### 获取详细数据
```javascript
const stats = await window.TeachAnyStats.getFullStats()
console.log(stats)
```

输出示例：
```javascript
{
  totalCourses: 131,
  officialCourses: 0,
  communityCourses: 131,
  subjects: 8,
  totalNodes: 275,
  nodesCovered: 131,
  coverageRate: "47.6",
  subjectDistribution: {
    "数学": 87,
    "生物": 31,
    "物理": 8,
    "化学": 5
  },
  gradeDistribution: {
    "小学": 45,
    "初中": 24,
    "高中": 62
  }
}
```

---

## 🛤️ 学习路径系统

### 查看路径的3种方式

#### 方式1：专用页面
1. 访问 `http://localhost:5173/path.html`
2. 输入知识点ID（如 `addition-subtraction-within-20`）
3. 点击"显示路径"

#### 方式2：URL直达
```
http://localhost:5173/path.html?node=addition-subtraction-within-20
```

#### 方式3：API调用
```javascript
await TeachAnyLearningPath.api.showPath('addition-subtraction-within-20')
```

### 路径包含的内容

每个知识点的学习路径包含4个部分：

#### 1. 📚 前置知识
- 按学习顺序排列
- 显示每个前置节点的课件数
- 递归显示所有依赖

#### 2. 🎯 当前知识点
- 显示所有可用课件
- 点击课件名直接打开
- 显示年级和学科信息

#### 3. 🚀 后续方向
- 树形展示多条学习路径
- 最多显示2层深度
- 每个节点显示课件数

#### 4. 🔄 平行知识点
- 同年级同学科的其他知识点
- 提供学习的多样化选择

### 跨学段分析

```javascript
const crossPath = await TeachAnyLearningPath.api.getCrossGradePath('functions-advanced')
console.log(crossPath)
```

输出示例：
```javascript
{
  nodeId: "functions-advanced",
  nodeName: "函数与性质",
  elementary: [],              // 小学阶段节点
  middle: [                    // 初中阶段节点
    { id: "rational-numbers", name: "有理数", grade: 7 },
    { id: "linear-functions", name: "一次函数", grade: 8 },
    { id: "quadratic-functions", name: "二次函数", grade: 9 }
  ],
  high: [                      // 高中阶段节点
    { id: "sets-logic", name: "集合与逻辑", grade: 10 },
    { id: "functions-advanced", name: "函数与性质", grade: 10 },
    { id: "derivatives", name: "导数", grade: 11 }
  ],
  summary: {
    "小学": 0,
    "初中": 3,
    "高中": 3
  }
}
```

### 生成学科地图

```javascript
const mathMap = await TeachAnyLearningPath.api.generateSubjectMap('math')
console.log(mathMap)
```

返回数学学科的完整知识体系：
- 90个节点按年级分组
- 识别跨学段连续性链条
- 展示知识演进路径

---

## 🎨 可视化界面

### 节点卡片样式
- **悬停效果**：卡片上浮 + 边框高亮
- **渐变标识**：前置(蓝色)、后续(绿色)、平行(紫色)
- **箭头动画**：脉冲效果指示学习方向

### 交互功能
- 点击任意节点卡片：跳转到该节点的学习路径
- 点击课件链接：直接打开课件学习
- 响应式布局：支持手机/平板/桌面

---

## 📐 数据来源

- **课件数据**：`registry.json` (131个课件)
- **知识图谱**：44个 `_graph.json` 文件 (275个节点)
- **更新频率**：页面加载时自动更新
- **缓存时间**：30分钟（可手动清除）

---

## 🔧 故障排查

### 统计数字不更新
```javascript
// 清除缓存后刷新
localStorage.removeItem('teachany_registry_v3')
location.reload(true)
```

### 学习路径显示"未找到"
1. 检查节点ID拼写（区分大小写）
2. 确认节点是否在知识图谱中：
```javascript
await TeachAnyLearningPath.initialize()
console.log(TeachAnyLearningPath.nodeIndex.keys())
```

### 控制台报错
1. 确保已加载相关脚本：
   - `scripts/stats-calculator.js`
   - `scripts/learning-path.js`
2. 检查浏览器控制台是否有网络错误
3. 确认 `registry.json` 格式正确

---

## 📚 常用节点ID参考

### 小学数学
- `counting-1-10` - 10以内数的认识
- `addition-subtraction-within-10` - 10以内加减法
- `addition-subtraction-within-20` - 20以内加减法
- `multiplication-division-concept` - 乘除法概念
- `fraction-concept` - 分数概念

### 初中数学
- `rational-numbers` - 有理数
- `algebraic-expressions` - 代数式
- `linear-functions` - 一次函数
- `quadratic-functions` - 二次函数
- `geometric-proof` - 几何证明

### 高中数学
- `sets-logic` - 集合与逻辑
- `functions-advanced` - 函数与性质
- `derivatives` - 导数
- `integrals` - 积分
- `space-geometry` - 立体几何

### 生物
- `cell-structure` - 细胞结构
- `plant-structure` - 植物结构
- `human-body-overview` - 人体系统
- `genetics-basics` - 遗传基础
- `evolution-theory` - 进化论

### 物理
- `mechanics-basic` - 力学基础
- `pressure-buoyancy` - 压强与浮力
- `light-optics` - 光学
- `electricity-magnetism` - 电磁学

### 化学
- `matter-classification` - 物质分类
- `chemical-reactions` - 化学反应
- `oxidation-reduction` - 氧化还原
- `acid-base-salt` - 酸碱盐
- `organic-chemistry-intro` - 有机化学入门

---

## 💡 使用技巧

1. **从头学习**：找到学科的最基础节点（如 `counting-1-10`），查看其后续路径
2. **查漏补缺**：查看当前节点的前置路径，识别薄弱知识点
3. **拓展学习**：查看平行节点，发现同级其他学习内容
4. **规划路径**：使用跨学段分析，了解知识从小学到高中的演进

---

## 📞 问题反馈

如有问题或建议，请：
- 提交 GitHub Issue
- 在控制台查看详细错误信息
- 检查实施报告中的"故障排查"部分
