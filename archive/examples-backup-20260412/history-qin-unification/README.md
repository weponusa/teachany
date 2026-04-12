# 秦灭六国与帝国疆域 — TeachAny 历史课件

**课程主题**：秦灭六国统一中国的历史进程、地理因素与制度遗产  
**适用年级**：初中七年级（历史）  
**课件类型**：TeachAny Phase 3 完整课件（L1 HTML + L3 语音讲解）  
**课件版本**：v3.0  
**制作日期**：2026-04-12

---

## 📁 文件结构

```
history-qin-unification/
├── index.html                    # 主课件文件（HTML5 + CSS3 + JavaScript）
├── audio/                        # 语音讲解文件夹
│   ├── section1.mp3              # Section 1 语音：统一进程
│   ├── section2.mp3              # Section 2 语音：地形军事
│   ├── section3.mp3              # Section 3 语音:疆域范围
│   ├── section4.mp3              # Section 4 语音：制度遗产
│   └── section5.mp3              # Section 5 语音：课后练习
├── audio-playlist.json           # 语音播放列表配置
├── narration-scripts.json        # 语音讲解原始文本
├── generate_audio.py             # 语音生成脚本（edge-tts）
├── venv/                         # Python 虚拟环境（本地）
└── README.md                     # 本文件
```

---

## ✨ 核心特性

### 1. 零 API 依赖设计
- **Leaflet.js + OpenStreetMap**：实景地图，首次联网后可离线缓存
- **ECharts + 内置 GeoJSON**：疆域可视化，完全本地运行
- **edge-tts 生成语音**：本地生成，无需在线 API

### 2. 交互式学习体验
| 交互类型 | 实现技术 | 教学效果 |
|:---|:---|:---|
| **知识图谱** | SVG + 点击跳转 | 可视化知识结构，快速定位章节 |
| **动画时间轴** | CSS Keyframes | 渐进式显示历史事件（0.2s-1.2s 延迟） |
| **翻转卡片** | CSS 3D Transform | 悬停查看知识点详情 |
| **制度对比滑块** | CSS Clip-path | 直观对比分封制与郡县制 |
| **地图场景跳转** | Leaflet flyTo API | 动画飞行至函谷关、长平等历史现场 |
| **疆域数据可视化** | ECharts 散点图 + 特效散点 + 攻击路线 | 动态展示 19 郡分布与统一战争路径 |
| **学习记录单** | 实时校验 + 颜色反馈 | 答对变绿，强化记忆 |
| **随堂测试** | 即时反馈机制 | 错题自动显示正确答案 |
| **语音讲解** | HTML5 Audio API | 点击播放，随章节自动切换 |

### 3. TeachAny 标准结构
✅ Sticky 导航栏（顶部固定）  
✅ 知识图谱（课件入口）  
✅ 5 节内容模块（渐进式学习）  
✅ 底部导航栏（进度条 + 上下步按钮）  
✅ 语音讲解按钮（顶部导航 + 自动播放）  
✅ Meta 标签（支持知识图谱集成）

---

## 🎬 使用方法

### 方法一：本地 HTTP 服务器（推荐）
```bash
# 1. 进入课件目录
cd history-qin-unification

# 2. 启动本地服务器
python3 -m http.server 8901

# 3. 打开浏览器访问
http://localhost:8901/index.html
```

### 方法二：直接双击打开
⚠️ 部分浏览器安全策略可能阻止语音文件加载，推荐使用方法一。

### 方法三：在线部署
将整个文件夹上传至 Web 服务器（如 GitHub Pages, Vercel, Netlify）即可访问。

---

## 🎮 交互操作指南

### 顶部导航栏
- **🔊 语音讲解** — 点击开启/关闭自动语音播放
- **① ② ③ ④ ⑤** — 快速跳转到对应章节

### 知识图谱
- 点击实心圆节点 → 跳转到对应课件章节
- 虚线圆节点 → 前置知识（战国七雄）或后续知识（楚汉争霸）

### Section 1：统一进程
- 动画时间轴会自动渐进显示 6 国灭亡顺序
- 学习记录单：填写空白处，失焦时自动校验答案

### Section 2：地形军事
- **地图操作**：
  - 鼠标滚轮缩放 / 双指捏合缩放
  - 拖拽地图平移
  - 点击标记查看弹窗说明
- **场景快速跳转**：
  - 点击右上角按钮（🗺️ 全景 / 🏛️ 咸阳 / 🏯 函谷关 等）
  - 地图会自动飞行至目标位置并显示详情
- **翻转卡片**：悬停或点击查看背面详情

### Section 3：帝国疆域
- ECharts 地图支持：
  - 鼠标悬停查看郡名
  - 滚轮缩放/拖拽平移
  - 观察动画攻击路线（从咸阳出发的 6 条路径）

### Section 4：制度遗产
- **对比滑块**：视觉化对比分封制与郡县制的区别
- **翻转卡片**：悬停查看皇帝制度、三公九卿、郡县制、统一标准的详情

### Section 5：练习测试
- 点击选项即时提交
- 答对显示绿色 ✅，答错显示红色 ❌ 并高亮正确答案
- 每题只能作答一次

### 底部导航栏
- **进度条**：实时显示当前学习进度（20% / 40% / 60% / 80% / 100%）
- **上一步 / 下一步**：线性导航章节

---

## 🎵 语音讲解说明

### 语音生成技术
- **TTS 引擎**：Microsoft Edge TTS（edge-tts）
- **语音模型**：`zh-CN-YunxiNeural`（男声）
- **语速 / 音调**：+0% / +0Hz（标准语速，自然音调）

### 语音内容
| Section | 时长预估 | 内容概要 |
|:---:|:---:|:---|
| Section 1 | ~120 秒 | 公元前 230-221 年统一进程，灭国顺序与战略路线 |
| Section 2 | ~100 秒 | 关中地理优势，函谷关、郑国渠、军功爵制 |
| Section 3 | ~110 秒 | 秦朝疆域 340 万平方公里，36 郡制度，驰道网络 |
| Section 4 | ~130 秒 | 郡县制与分封制对比，中央集权体制建立 |
| Section 5 | ~30 秒 | 课后练习引导 |

### 播放方式
1. **手动播放**：点击顶部 "🔊 语音讲解" 按钮开启
2. **自动切换**：开启后切换章节会自动播放对应音频
3. **重复播放**：同一章节切换会从头播放
4. **停止播放**：再次点击按钮关闭语音

⚠️ **注意**：首次播放需浏览器允许自动播放权限（部分浏览器可能需要用户手动交互后才能播放）。

---

## 🔧 技术实现细节

### 前端技术栈
- **HTML5** — 语义化标签，无框架依赖
- **CSS3** — 渐变、动画、3D 变换、响应式布局
- **JavaScript（ES6）** — 原生 DOM 操作，无 jQuery

### 外部依赖（CDN）
```html
<!-- ECharts 地图库 -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>

<!-- Leaflet 地图库 -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### 关键动画实现
```css
/* 时间轴渐进式动画 */
@keyframes itemSlideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
.timeline-item:nth-child(1) { animation-delay: 0.2s; }
.timeline-item:nth-child(2) { animation-delay: 0.4s; }
/* ... */
```

```javascript
// Leaflet 标记逐个弹出效果
locations.forEach((loc, index) => {
  setTimeout(() => {
    L.marker([loc.lat, loc.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${loc.name}</b>`);
  }, index * 100); // 每个标记延迟 100ms
});
```

---

## 📚 教学建议

### 课前准备
1. 检查音频文件是否完整（`audio/` 文件夹）
2. 确保网络连接（首次加载 Leaflet 地图瓦片）
3. 推荐使用 Chrome / Edge / Firefox 浏览器

### 课堂使用
1. **导入阶段**（5 分钟）
   - 展示知识图谱，介绍课程结构
   - 播放 Section 1 语音，配合动画时间轴

2. **探究阶段**（15 分钟）
   - Section 2：操作地图，讨论地形对战争的影响
   - Section 3：观察 ECharts 动画，理解统一路线
   - Section 4：翻转卡片，对比制度差异

3. **巩固阶段**（10 分钟）
   - Section 5：学生完成练习题
   - 填写学习记录单，教师巡视指导

### 课后拓展
- 建议学生回家重听语音讲解
- 鼓励探索知识图谱中的"前置知识"与"后续知识"
- 阅读《过秦论》原文，理解"仁义不施而攻守之势异也"

---

## 🛠️ 开发与维护

### 重新生成语音
```bash
cd history-qin-unification
source venv/bin/activate
python3 generate_audio.py
```

### 修改语音文本
编辑 `narration-scripts.json`，然后重新运行上述脚本。

### 更换语音模型
编辑 `generate_audio.py` 中的 `VOICE` 变量：
```python
VOICE = "zh-CN-XiaoxiaoNeural"  # 女声
VOICE = "zh-CN-YunxiNeural"     # 男声（当前）
VOICE = "zh-CN-YunyangNeural"   # 男声（新闻播报风格）
```

### 添加新章节
1. 在 `index.html` 中复制 `<section>` 模板
2. 修改 `audioPlaylist` 数组添加音频配置
3. 更新 `totalSections` 变量
4. 在 `narration-scripts.json` 添加新章节文本

---

## 📊 课件数据统计

| 指标 | 数值 |
|:---|:---|
| HTML 文件大小 | ~52 KB |
| 音频文件总大小 | ~1.2 MB（5 个 MP3） |
| 代码总行数 | 1500+ 行 |
| 交互元素数量 | 30+ 个 |
| 动画效果数量 | 15+ 种 |
| 支持浏览器 | Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ |
| 移动端适配 | ✅ 响应式布局 |

---

## 🎓 符合标准

✅ **TeachAny Skill v5.6+ 规范**  
✅ **教育部《历史课程标准（2022 年版）》**  
✅ **无障碍设计（WCAG 2.1 AA 级）** — 键盘导航、语义化标签  
✅ **跨浏览器兼容** — 不使用实验性 API  
✅ **离线可用** — 除首次加载地图瓦片外，其余资源可离线访问

---

## 📝 版本历史

### v3.0（2026-04-12）
- ✅ 完成 Phase 3.1（L1 HTML 课件）
- ✅ 完成 Phase 3.3（L3 语音讲解）
- ✅ 零 API 依赖设计（Leaflet + ECharts + edge-tts）
- ✅ 30+ 交互元素（知识图谱、时间轴、翻转卡片、地图、ECharts）
- ✅ 自动语音播放功能
- ✅ 响应式移动端适配

### v2.0（已废弃）
- 使用 Mapbox API（需 Token，已移除）

---

## 🤝 贡献者

**制作**：weponusa  
**技能框架**：TeachAny v5.6  
**语音技术**：Microsoft Edge TTS  
**地图数据**：OpenStreetMap  

---

## 📄 许可证

本课件遵循 **CC BY-NC-SA 4.0** 许可协议：
- ✅ 允许非商业用途分享与改编
- ✅ 需署名原作者
- ✅ 相同方式共享
- ❌ 禁止商业使用

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [weponusa/teachany](https://github.com/weponusa/teachany/issues)
- Email: 课件制作者邮箱（如有）

---

**祝教学愉快！🎉**
