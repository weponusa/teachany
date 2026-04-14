# 📜 历史学科教材补充数据

## 数据来源

1. **OpenStax U.S. History** (CC BY 4.0, 975页)
   - 美国历史通史教材，涵盖殖民时期至现代
   - 提供世界史对照视角（工业革命、世界大战、冷战等）

2. **部编版初中历史教材**（七至九年级）
   - 中国古代史、近现代史
   - 世界古代史、近现代史

3. **2022版历史课程标准**
   - 核心素养：唯物史观、时空观念、史料实证、历史解释、家国情怀

## 已提取数据

### teaching_methods.json (8条)

| ID | 方法名称 | 方法类型 | 适用节点数 | Bloom等级 |
|:---|:---|:---|:---:|:---:|
| history-method-001 | 时间轴构建法 | timeline_construction | 13 | L3 |
| history-method-002 | 史料阅读分析 | primary_source_analysis | 14 | L4 |
| history-method-003 | 对比表格法 | comparison_table | 16 | L4 |
| history-method-004 | 角色扮演共情 | role_play_empathy | 9 | L3 |
| history-method-005 | 因果链条分析 | cause_effect_chain | 15 | L5 |
| history-method-006 | 地图与历史结合 | map_based_learning | 11 | L3 |
| history-method-007 | 主题式综合 | thematic_synthesis | 12 | L5 |
| history-method-008 | 古今对照法 | connecting_past_present | 18 | L4 |

**核心特征**：
- 强调**史料实证**（史料阅读、因果链条）
- 培养**时空观念**（时间轴、地图结合）
- 发展**历史解释**能力（对比分析、主题综合）
- 增强**家国情怀**（古今对照、角色共情）

### real_world_scenarios.json (8条)

| ID | 场景标题 | 对应现实应用 | Bloom等级 |
|:---|:---|:---|:---:|
| silk-road-global-trade | 丝绸之路与今日全球化贸易 | 一带一路倡议、全球供应链 | L4 |
| province-system-today | 郡县制与今日地方行政 | 省市县三级制、中央地方关系 | L3 |
| keju-to-gaokao | 科举制度与今日高考 | 教育选拔机制、社会流动 | L4 |
| opium-war-lesson | 鸦片战争的现代启示 | 国家安全、禁毒政策 | L5 |
| four-inventions-world-impact | 四大发明对世界的影响 | 科技传播、文明交流 | L4 |
| athens-democracy-modern | 雅典民主与现代民主制度 | 民主政治、公民参与 | L5 |
| industrial-revolution-daily-life | 工业革命改变日常生活 | 现代化生活方式 | L3 |
| reform-success-failure | 历史上的改革成败 | 改革开放、政策调整 | L5 |

**核心特征**：
- 每个场景都包含**古今对照**
- 强调历史对**现实的启示意义**
- 对齐18个历史知识节点

## 知识节点覆盖

### 中国古代史 (5节点)
- `early-civilizations`：早期文明起源
- `imperial-unification`：帝国统一时期
- `tang-song-prosperity`：唐宋繁荣期
- `ming-qing-decline`：明清衰落期
- `ancient-culture`：古代文化成就

### 中国近现代史 (4节点)
- `opium-war-era`：鸦片战争时期
- `reform-revolution`：改良与革命
- `new-democratic-revolution`：新民主主义革命
- `modern-china-development`：现代中国发展

### 主题史 (4节点)
- `political-system-evolution`：政治制度演变
- `economic-history`：经济发展史
- `cultural-thought-history`：文化思想史
- `reform-comparison`：改革对比研究

### 世界史 (5节点)
- `ancient-civilizations`：世界古代文明
- `modern-world-formation`：近代世界形成
- `industrial-revolution-modernization`：工业革命与现代化
- `world-wars-cold-war`：世界大战与冷战
- `globalization`：全球化进程

## 使用建议

1. **生成历史课件时**：
   - 优先查阅 `teaching_methods.json` 选择适合的教学方法
   - 根据知识节点从 `real_world_scenarios.json` 匹配真实案例

2. **五镜头法应用**：
   - **镜头1（提问）**：使用古今对照场景引入问题
   - **镜头2（定义）**：结合史料分析法呈现核心概念
   - **镜头3（拆解）**：使用时间轴或因果链条展开分析
   - **镜头4（类比）**：使用对比表格法类比不同时代
   - **镜头5（应用）**：回到现实场景，总结历史启示

3. **ABT叙事框架**：
   - **AND（背景）**：使用史料或时间轴呈现历史背景
   - **BUT（冲突）**：指出历史转折点或矛盾
   - **THEREFORE（结论）**：用古今对照揭示历史意义

## 版权声明

- OpenStax教材采用 **CC BY 4.0** 协议，可自由使用
- 部编版教材素材仅供教育用途
- 教学方法设计基于2022版历史课标，属公共领域知识

## 更新记录

- **2026-04-14**：首次提取历史学科数据（8条教学方法 + 8条真实场景）
