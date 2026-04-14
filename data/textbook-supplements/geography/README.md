# 🌍 地理学科教材补充数据

## 数据来源

1. **气象学与生活（第12版）** (Pearson, Ahrens & Henson, 394页)
   - 大气科学经典教材
   - 涵盖大气组成、天气系统、气候类型等

2. **部编版初中/高中地理教材**
   - 自然地理：地球、大气、水文、地貌
   - 人文地理：人口、农业、工业、交通
   - 区域地理：中国地理、世界地理

3. **2022版地理课程标准**
   - 核心素养：人地协调观、综合思维、区域认知、地理实践力

## 已提取数据

### teaching_methods.json (8条)

| ID | 方法名称 | 方法类型 | 适用节点数 | Bloom等级 |
|:---|:---|:---|:---:|:---:|
| geography-method-001 | 地图技能训练 | map_skills_training | 5 | L2 |
| geography-method-002 | 气象数据解读 | weather_data_interpretation | 3 | L3 |
| geography-method-003 | 野外观察记录 | field_observation | 6 | L3 |
| geography-method-004 | 区域对比分析 | region_comparison | 8 | L4 |
| geography-method-005 | 过程模拟演示 | process_simulation | 4 | L3 |
| geography-method-006 | 人地关系案例研究 | human_land_case_study | 9 | L5 |
| geography-method-007 | 剖面图绘制 | cross_section_drawing | 5 | L3 |
| geography-method-008 | 地理问题探究 | geographic_inquiry | 12 | L5 |

**核心特征**：
- 强调**地理实践力**（野外观察、剖面绘制）
- 培养**区域认知**（区域对比、案例研究）
- 发展**综合思维**（过程模拟、问题探究）
- 增强**人地协调观**（人地关系案例）

### real_world_scenarios.json (8条)

| ID | 场景标题 | 对应现实应用 | Bloom等级 |
|:---|:---|:---|:---:|
| gps-navigation-coordinates | GPS导航与经纬度坐标 | 手机导航、位置服务 | L2 |
| weather-forecast-fronts | 天气预报中的锋面系统 | 气象预报、出行决策 | L3 |
| time-zone-jet-lag | 时区差异与跨国时差 | 国际旅行、远程会议 | L2 |
| urban-heat-island | 城市热岛效应 | 城市规划、环境治理 | L4 |
| three-gorges-dam-impacts | 三峡大坝的地理影响 | 水利工程、生态保护 | L5 |
| silk-road-belt-and-road | 丝绸之路与一带一路 | 国际贸易、区域合作 | L4 |
| south-north-water-transfer | 南水北调工程 | 资源调配、区域发展 | L5 |
| loess-plateau-soil-erosion | 黄土高原水土流失治理 | 生态修复、可持续发展 | L4 |

**核心特征**：
- 每个场景都对应**日常生活应用**
- 强调地理知识的**实用价值**
- 涵盖自然地理和人文地理两大领域

### visual_strategies.json (10条)

| ID | 策略名称 | 模式类型 | Mayer多媒体学习原则 |
|:---|:---|:---|:---|
| geography-visual-001 | 比例尺对比可视化 | scale_comparison | 对比原则 |
| geography-visual-002 | 等高线立体解读 | contour_line_interpretation | 空间邻近原则 |
| geography-visual-003 | 地理过程流程图 | process_diagram | 时间邻近原则 |
| geography-visual-004 | 天气符号系统 | weather_map_symbols | 一致性原则 |
| geography-visual-005 | 气候统计图表 | climate_graph | 多重表征原则 |
| geography-visual-006 | 水循环示意图 | cycle_diagram | 信号原则 |
| geography-visual-007 | 地形剖面图 | cross_section | 空间邻近原则 |
| geography-visual-008 | 阶梯式地势图 | stepped_elevation_map | 分段原则 |
| geography-visual-009 | 对比地图组合 | comparison_table_map | 对比原则 |
| geography-visual-010 | 地理要素关系概念图 | concept_map | 多重表征原则 |

**核心特征**：
- 每个策略对齐**Mayer多媒体学习原则**
- 提供具体的**绘制步骤和教学提示**
- 涵盖地图、图表、示意图等多种可视化形式

## 知识节点覆盖

### 地图技能 (3节点)
- `earth-basics`：地球基础知识
- `map-reading`：地图阅读技能
- `earth-motion`：地球运动规律

### 自然地理 (4节点)
- `climate-basics`：气候基础
- `atmosphere`：大气圈
- `hydrosphere`：水圈
- `landforms`：地貌

### 人文地理 (4节点)
- `population-urbanization`：人口与城市化
- `agriculture`：农业地理
- `industry-services`：工业与服务业
- `transportation-communication`：交通运输

### 区域地理 (4节点)
- `china-overview`：中国地理概况
- `china-regions`：中国区域地理
- `world-regions`：世界区域地理
- `sustainable-development`：可持续发展

## 使用建议

1. **生成地理课件时**：
   - 优先查阅 `visual_strategies.json` 选择适合的可视化策略
   - 根据知识节点从 `real_world_scenarios.json` 匹配真实案例
   - 使用 `teaching_methods.json` 设计教学活动

2. **五镜头法应用**：
   - **镜头1（提问）**：使用真实场景引入问题（如GPS导航、天气预报）
   - **镜头2（定义）**：使用地图或示意图呈现核心概念
   - **镜头3（拆解）**：使用过程流程图或剖面图展开分析
   - **镜头4（类比）**：使用对比地图或气候图表类比不同区域
   - **镜头5（应用）**：回到现实案例（如城市规划、生态治理）

3. **地理实践力培养**：
   - 结合野外观察法设计实地考察活动
   - 使用地图技能训练法提升空间认知
   - 通过案例研究法分析人地关系

## 版权声明

- 气象学与生活教材（Pearson）素材仅供教育用途
- 部编版地理教材素材仅供教育用途
- 教学方法设计基于2022版地理课标，属公共领域知识

## 更新记录

- **2026-04-14**：首次提取地理学科数据（8条教学方法 + 8条真实场景 + 10条可视化策略）
