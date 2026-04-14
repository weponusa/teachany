# Biology Textbook Supplements - 生物学教材补充数据

## 📚 数据来源

本目录包含从 **OpenStax Biology 2e** (1487页,47章) 提取的高质量教学资源,用于增强TeachAny平台的生物学课件生成质量。

**教材信息**:
- 书名: Biology 2e
- 作者: Mary Ann Clark, Jung Choi, Matthew Douglas (OpenStax)
- 出版年: 2018
- ISBN: 978-1-947172-52-4
- 页数: 1487页
- 章节: 8个单元,47章
- 许可: CC BY 4.0 (Creative Commons Attribution)

---

## 📊 已完成数据文件

### 1. teaching_methods.json (8条)

提取Biology 2e的8种特色教学方法:

| ID | 方法名称 | 描述 | 布鲁姆层级 |
|:---|:---|:---|:---|
| `visual-connection-questions` | Visual Connection可视化思考题 | 配合概念图设计引导性问题,促进图像推理 | L4-分析 |
| `career-connection-features` | Career Connection职业联结 | 介绍生物学相关职业(法医/药物化学家/细胞技术专家等) | L2-理解 |
| `evolution-connection` | Evolution Connection演化视角 | 从演化论角度重新审视生物学现象 | L5-评价 |
| `scientific-method-connection` | Scientific Method科学方法实践 | 通过实验案例体验科学探究完整流程 | L6-创造 |
| `link-to-learning` | Link to Learning互动资源链接 | 提供高质量在线动画/虚拟实验室/科普视频 | L3-应用 |
| `art-connection` | Art Connection艺术联结 | 展示生物学与艺术的交叉点 | L5-评价 |
| `everyday-connection` | Everyday Connection日常联结 | 将生物学概念与学生日常生活经验连接 | L2-理解 |
| `worked-example-four-part` | 四部分工作例题 | 情景→策略→解答→讨论的结构化例题 | L3-应用 |

**覆盖知识节点**: 细胞结构、DNA复制、光合作用、细胞呼吸、有丝分裂、生态学、演化机制、神经系统、免疫系统、遗传概率等。

---

### 2. ecological_cases.json (12条)

提取Unit 8 (Ecology)和跨章节的12个生态学经典案例:

| ID | 案例名称 | 核心概念 | 教学价值 |
|:---|:---|:---|:---|
| `chesapeake-bay-eutrophication` | 切萨皮克湾富营养化 | 富营养化、死区、生态系统服务 | 展示人类活动如何影响生态系统 |
| `hydrothermal-vent-ecosystem` | 深海热液喷口生态系统 | 化能自养、无光合作用生命 | 挑战"所有生命依赖光合作用"的认知 |
| `cyanobacteria-oxygen-revolution` | 蓝藻与大氧化事件 | 生命改变大气、共同演化 | 展示生命如何塑造地球环境 |
| `endosymbiosis-mitochondria` | 内共生理论 | 线粒体/叶绿体起源、互利共生 | 解释复杂细胞器的演化起源 |
| `cytochrome-c-evolution` | 细胞色素c的演化保守性 | 分子钟、系统发育分析 | 连接分子生物学与演化生物学 |
| `metabolic-pathways-evolution` | 代谢途径的演化 | 厌氧→需氧、演化修补 | 展示代谢是演化的产物 |
| `virus-host-coevolution` | 病毒-宿主共同演化 | 军备竞赛、宿主特异性 | 解释为什么病毒有宿主特异性 |
| `mitotic-spindle-evolution` | 有丝分裂纺锤体演化 | 基因复制与分化、蛋白同源性 | 展示复杂结构如何从简单结构演化 |
| `red-queen-hypothesis` | 红皇后假说 | 性生殖的演化优势、遗传变异 | 解释为什么性生殖如此普遍 |
| `meiosis-evolution-mystery` | 减数分裂的演化之谜 | 基因征用、复杂性起源 | 展示前沿科学问题 |
| `quorum-sensing-biofilm` | 群体感应与生物膜 | 细菌社会行为、密度依赖 | 颠覆"细菌是孤立个体"的刻板印象 |
| `carl-woese-three-domains` | 三域系统的发现 | 分子系统学、范式转变 | 展示新技术如何引发科学革命 |

**适用场景**: 生态学、演化生物学、细胞生物学、微生物学课程。

---

### 3. real_world_scenarios.json (10条)

提取Career Connection和Everyday Connection中的10个真实世界应用案例:

| ID | 场景名称 | 职业/应用 | 社会价值 |
|:---|:---|:---|:---|
| `forensic-dna-fingerprinting` | 法医DNA指纹鉴定 | 法医学家、刑事侦查 | 帮助警察破案、确认身份 |
| `pharmaceutical-drug-development` | 药物化学家 | 新药开发、天然产物筛选 | 治疗疾病、改善生活质量 |
| `cytotechnologist-pap-smear` | Pap涂片与宫颈癌筛查 | 细胞技术专家、癌症预防 | 早期发现癌前病变,挽救生命 |
| `microbiologist-handwashing` | 洗手预防传染病 | 微生物学家、公共卫生 | 降低传染病传播 |
| `cardiologist-heart-disease` | 心脏病学家 | 心血管疾病诊治 | 预防和治疗头号死因 |
| `geneticist-lowe-disease` | 遗传学家与洛氏综合征 | 遗传病诊断、基因治疗 | 帮助患者家庭理解遗传病 |
| `immunologist-vaccines` | 免疫学家与疫苗 | 疫苗研发、传染病控制 | 征服天花、脊髓灰质炎等疾病 |
| `mitochondrial-disease-physician` | 线粒体疾病医生 | 代谢疾病诊治 | 治疗罕见遗传代谢病 |
| `cancer-biologist-signaling` | 癌症生物学家 | 靶向治疗开发 | 将癌症从"必死之症"变为"慢性病" |
| `clinical-trial-coordinator` | 临床试验协调员 | 新药临床试验管理 | 确保新药安全有效上市 |

**教学功能**: 增强学生学习动机,展示"学习这个知识点能做什么工作",培养STEM职业兴趣。

---

## 🎯 数据使用指南

### 在TeachAny课件生成中的调用

当用户请求生成生物学相关课件时,AI将:

1. **识别知识节点**: 从用户输入提取 `node_id` (如 `cell-structure`, `dna-replication`)
2. **查询教材补充数据**: 加载 `biology/` 目录下相关JSON文件
3. **筛选适用内容**: 根据 `applicable_node_ids` 字段匹配
4. **优先使用教材数据**: 教材数据 > 知识树数据 > 联网搜索 > 模型知识

### 示例:生成"细胞结构"课件

```python
# 伪代码
node_id = "cell-structure"
subject = "biology"

# 加载教学方法
teaching_methods = load_json(f"data/textbook-supplements/{subject}/teaching_methods.json")
applicable_methods = [m for m in teaching_methods["items"] if node_id in m["applicable_node_ids"]]
# → 找到: Visual Connection, Career Connection (Cytotechnologist), Link to Learning

# 加载真实场景
real_world = load_json(f"data/textbook-supplements/{subject}/real_world_scenarios.json")
applicable_scenarios = [s for s in real_world["items"] if node_id in s["applicable_node_ids"]]
# → 找到: Pap涂片筛查案例 (细胞技术专家)

# 生成课件时优先使用上述数据
```

---

## 🔬 数据质量保证

### 提取标准

每条数据必须包含:

✅ **source_evidence**: 原书章节/页码  
✅ **applicable_node_ids**: 至少1个有效节点ID  
✅ **bloom_level**: 布鲁姆认知层级 (L1-L6)  
✅ **description**: 清晰的使用场景描述  
✅ **teaching_value/real_world_application**: 教学价值说明  

### 验证通过

- ✅ JSON格式验证通过 (`python -m json.tool`)
- ✅ 所有字段符合 `schema.md` 定义
- ✅ 知识节点ID存在于 `data/trees/biology.json`
- ✅ 来源可追溯到原教材具体章节/页码

---

## 📈 统计数据

| 文件 | 条目数 | 总字数 | 覆盖节点数 |
|:---|:---:|:---:|:---:|
| teaching_methods.json | 8 | ~5,000 | 35+ |
| ecological_cases.json | 12 | ~12,000 | 40+ |
| real_world_scenarios.json | 10 | ~10,000 | 30+ |
| **总计** | **30** | **~27,000** | **60+** |

---

## 🚀 后续待补充

### 待创建文件 (按优先级)

1. ⏳ **visual_strategies.json** (目标:10-15条)
   - 细胞结构图解标注策略
   - 代谢途径流程图可视化
   - 演化树构建方法
   - 四象限生物组织层级图

2. ⏳ **analogies.json** (目标:8-10条)
   - DNA=食谱、细胞=厨房
   - 酶=锁和钥匙
   - ATP=能量货币
   - 免疫系统=军队

3. ⏳ **experiment_designs.json** (目标:5-8条)
   - 孟德尔豌豆杂交实验设计
   - PCR原理与操作流程
   - 细胞周期时长测定实验
   - 光合作用色素分离实验

4. ⏳ **image_library.json** (目标:20-30条)
   - 高质量细胞器电镜照片
   - 组织切片显微照片
   - 生态系统景观照片
   - 生物多样性物种图库

---

## 📝 贡献指南

### 添加新内容

1. **确认内容来源**: 必须来自OpenStax Biology 2e或其他权威教材
2. **填写完整字段**: 按照 `schema.md` 定义填写所有必需字段
3. **关联知识节点**: 确保 `applicable_node_ids` 中的ID存在于 `data/trees/biology.json`
4. **验证JSON格式**: 使用 `python -m json.tool xxx.json` 验证
5. **提交Pull Request**: 说明新增内容的教学价值和来源

### 数据维护

- 📅 每季度审查一次,确保内容时效性
- 🔗 检查外部链接(Link to Learning)是否失效
- 📚 随OpenStax教材更新同步更新数据
- 💬 收集TeachAny用户反馈,优化内容质量

---

## 📖 相关文档

- **数据格式规范**: `../schema.md`
- **教材映射表**: `../BOOK_NODE_MAPPING.json`
- **通用教学原则**: `../universal_teaching_principles.json`
- **生物学知识树**: `../../trees/biology.json`

---

## 👥 贡献者

- 初始数据提取: CodeBuddy AI (2026-04-14)
- 数据来源: OpenStax Biology 2e (CC BY 4.0)
- 维护者: TeachAny Project Team

---

## 📜 许可证

本数据集基于 OpenStax Biology 2e (CC BY 4.0) 衍生,同样采用 **CC BY 4.0** 许可证。

使用时请注明:
> 数据来源于 OpenStax Biology 2e (https://openstax.org/details/books/biology-2e), 由TeachAny项目团队提取和结构化。

---

**最后更新**: 2026-04-14  
**版本**: v1.0  
**状态**: ✅ 生物学核心数据完成,待补充可视化和实验设计数据
