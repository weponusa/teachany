# 📜 History Data | 历史数据资源库

## 目的

为历史课件提供预制资源，包括：
- 历史地图（朝代疆域、重要战役）
- 历史事件时间线
- 历史人物数据
- 文物与遗址位置

## 数据来源

| 数据源 | 内容 | 来源 |
|:---|:---|:---|
| 中国历史地理信息系统（CHGIS） | 历史行政区划 | 复旦大学 |
| 《中国历史地图集》 | 朝代疆域 | 谭其骧主编 |
| 左图右史 | 历史地图可视化 | OSGeo |

## 目录结构

```
history/
├── README.md                       # 本文件
├── timelines/                      # 历史时间线
│   ├── chinese-dynasties.json      # 中国朝代时间线
│   ├── world-history.json          # 世界历史时间线
│   └── major-events.json           # 重大历史事件
│
├── maps/                           # 历史地图（链接到 geography/historical-china/）
│   └── README.md                   # 说明：地图数据存储在 ../geography/historical-china/
│
├── figures/                        # 历史人物
│   ├── emperors.json               # 帝王列表
│   ├── scholars.json               # 历史学者
│   └── generals.json               # 军事将领
│
└── sites/                          # 历史遗址
    ├── world-heritage.json         # 世界文化遗产
    ├── ancient-cities.json         # 古代城市遗址
    └── battlefields.json           # 重要战役地点
```

## 使用方法

### 1. 历史时间线课件

```javascript
// 展示中国朝代时间线
fetch('data/history/timelines/chinese-dynasties.json')
  .then(response => response.json())
  .then(data => {
    // 使用 ECharts Timeline 组件
    drawTimeline(data);
  });
```

### 2. 历史地图课件

```javascript
// 展示秦朝疆域
fetch('data/geography/historical-china/qin-dynasty.geojson')
  .then(response => response.json())
  .then(qinData => {
    // 展示秦朝版图
    drawMap(qinData, {
      title: '秦朝统一六国（前221年）',
      events: [
        { year: -221, event: '秦始皇统一中国' },
        { year: -213, event: '焚书坑儒' }
      ]
    });
  });
```

### 3. 历史人物课件

```javascript
// 展示唐朝帝王
fetch('data/history/figures/emperors.json')
  .then(response => response.json())
  .then(data => {
    const tangEmperors = data.filter(e => e.dynasty === '唐朝');
    renderEmperorsList(tangEmperors);
  });
```

## 数据格式规范

### 朝代时间线格式

```json
{
  "dynasties": [
    {
      "name": "秦朝",
      "name_en": "Qin Dynasty",
      "start_year": -221,
      "end_year": -206,
      "capital": "咸阳",
      "founder": "秦始皇",
      "major_events": [
        { "year": -221, "event": "统一六国" },
        { "year": -213, "event": "焚书坑儒" }
      ],
      "map_file": "../geography/historical-china/qin-dynasty.geojson"
    }
  ]
}
```

### 历史人物格式

```json
{
  "figures": [
    {
      "name": "秦始皇",
      "name_en": "Qin Shi Huang",
      "birth_year": -259,
      "death_year": -210,
      "dynasty": "秦朝",
      "role": "帝王",
      "achievements": [
        "统一六国",
        "统一文字、货币、度量衡",
        "修建长城"
      ],
      "related_sites": ["兵马俑", "长城"]
    }
  ]
}
```

## 集成到 SKILL

在 `skill/SKILL_CN.md` 的**历史学科适配**部分，添加地图资源引用：

```markdown
### 4.7 历史（History）

#### 讲解框架
- 时空定位：用地图和时间线确定事件位置
- 史料对读：结合地图展示不同史料的记载
- 因果分析：用地图展示地理因素对历史的影响

#### 互动组件
- 历史地图（必选）：从 `data/geography/historical-china/` 调用
- 时间线（必选）：从 `data/history/timelines/` 调用
- 史料对比：展示不同史料的地图标注
- 虚拟实地考察：结合地图和遗址照片

#### 评估题型
- 地图判读：根据地图判断朝代或事件
- 时序排列：排列历史事件的先后顺序
- 因果分析：分析地理因素对历史事件的影响
```

## 当前状态

- ✅ 目录结构已创建
- 🔄 正在下载：现代行政区划数据
- 🔄 正在下载：历史地图数据（CHGIS）
- ⏳ 待创建：时间线数据
- ⏳ 待创建：历史人物数据

## 版权说明

- 历史地图数据基于《中国历史地图集》（谭其骧主编）
- 仅用于教育目的，不得商业使用
