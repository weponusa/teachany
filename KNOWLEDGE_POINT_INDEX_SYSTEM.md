# TeachAny 统一知识点编号索引体系（Knowledge Point Index System）

## 🎯 设计目标

建立**唯一、一致、可追溯**的知识点编号体系，确保：
1. 每个知识点有**全局唯一ID**（kp-id）
2. ID在 manifest、知识树、registry、skill文档中**完全一致**
3. 新增知识点有明确的**编号规则和审核流程**
4. 避免重复、冲突、丢失

---

## 📋 编号规则（Numbering Rules）

### 1. 知识点ID格式

```
kp-{subject}-{stage}-{domain}-{concept}
```

| 组成部分 | 说明 | 示例 | 必填 |
|:---|:---|:---|:---|
| `kp` | Knowledge Point前缀 | kp | ✅ |
| `subject` | 学科代码（2-3字母） | math, phy, chem, bio, chn, eng, geo, hist | ✅ |
| `stage` | 学段代码（1-2字母） | e(小学), m(初中), h(高中) | ✅ |
| `domain` | 知识领域（短词） | algebra, geometry, mechanics | ✅ |
| `concept` | 具体概念（短词） | linear-func, quadratic-eq | ✅ |

**示例**：
- `kp-math-m-algebra-linear-func` → 数学·初中·代数·一次函数
- `kp-phy-h-mechanics-newton-laws` → 物理·高中·力学·牛顿定律
- `kp-chem-m-reaction-oxidation` → 化学·初中·反应·氧化还原
- `kp-bio-m-ecology-photosynthesis` → 生物·初中·生态·光合作用
- `kp-chn-e-pinyin-compound-vowel` → 语文·小学·拼音·复韵母

---

## 🗂️ 学科代码表（Subject Codes）

| 学科 | 代码 | 英文 |
|:---|:---|:---|
| 数学 | `math` | Mathematics |
| 物理 | `phy` | Physics |
| 化学 | `chem` | Chemistry |
| 生物 | `bio` | Biology |
| 语文 | `chn` | Chinese |
| 英语 | `eng` | English |
| 地理 | `geo` | Geography |
| 历史 | `hist` | History |

---

## 🎓 学段代码表（Stage Codes）

| 学段 | 代码 | 年级范围 |
|:---|:---|:---|
| 小学 | `e` | Elementary (1-6) |
| 初中 | `m` | Middle (7-9) |
| 高中 | `h` | High (10-12) |

---

## 📊 统一索引文件（Master Index）

创建 `data/knowledge-points/index.json` 作为**唯一信源**：

```json
{
  "version": "1.0",
  "total": 804,
  "updated": "2026-04-14",
  "points": [
    {
      "kp_id": "kp-math-m-algebra-linear-func",
      "name_zh": "一次函数",
      "name_en": "Linear Function",
      "subject": "math",
      "stage": "m",
      "grade": 8,
      "domain": "algebra",
      "prerequisites": ["kp-math-m-algebra-variable"],
      "related": ["kp-math-m-algebra-slope"],
      "courses": ["math-linear-function"],
      "status": "active",
      "created": "2026-04-10",
      "description": "一次函数的图像和性质"
    }
  ]
}
```

---

## 🔄 四层同步机制（4-Layer Sync）

### 1️⃣ 主索引（Master Index）
**位置**：`data/knowledge-points/index.json`
**作用**：唯一信源，所有知识点的权威定义
**字段**：
```json
{
  "kp_id": "kp-math-m-algebra-linear-func",
  "name_zh": "一次函数",
  "name_en": "Linear Function",
  "subject": "math",
  "stage": "m",
  "grade": 8,
  "domain": "algebra",
  "courses": ["math-linear-function"],
  "status": "active"
}
```

### 2️⃣ 课件清单（Courseware Manifest）
**位置**：`examples/{course-id}/manifest.json`
**引用方式**：
```json
{
  "id": "math-linear-function",
  "kp_id": "kp-math-m-algebra-linear-func",  // ← 统一引用
  "name": "一次函数",
  "subject": "math",
  "grade": 8
}
```

**废弃字段**：`node_id`（历史遗留，将逐步迁移到 `kp_id`）

### 3️⃣ 知识树（Knowledge Tree）
**位置**：`data/trees/{subject}-{stage}.json`
**节点格式**：
```json
{
  "id": "kp-math-m-algebra-linear-func",  // ← 使用统一kp_id
  "name": "一次函数",
  "grade": 8,
  "courses": ["math-linear-function"],
  "status": "active"
}
```

**规则**：节点 `id` 必须等于主索引的 `kp_id`

### 4️⃣ 注册表（Registry）
**位置**：`registry.json`
**字段**：
```json
{
  "id": "math-linear-function",
  "kp_id": "kp-math-m-algebra-linear-func",  // ← 关联知识点
  "name": "一次函数",
  "subject": "math",
  "grade": 8
}
```

---

## ➕ 新增知识点流程（Adding New Knowledge Points）

### Step 1: 生成ID
使用脚本生成符合规范的ID：
```bash
python3 scripts/generate-kp-id.py --subject math --stage m --domain algebra --concept "linear-func"
# 输出: kp-math-m-algebra-linear-func
```

### Step 2: 注册到主索引
编辑 `data/knowledge-points/index.json`，按**字母顺序插入**：
```json
{
  "kp_id": "kp-math-m-algebra-linear-func",
  "name_zh": "一次函数",
  "name_en": "Linear Function",
  "subject": "math",
  "stage": "m",
  "grade": 8,
  "domain": "algebra",
  "courses": [],
  "status": "gap",  // 暂无课件
  "created": "2026-04-14"
}
```

### Step 3: 验证唯一性
```bash
python3 scripts/validate-kp-index.py
# 检查：
# - kp_id 是否已存在
# - 格式是否符合规范
# - 是否按字母顺序排列
```

### Step 4: 同步到知识树
```bash
python3 scripts/sync-kp-to-trees.py
# 自动将主索引同步到对应的知识树文件
```

---

## 🛠️ 工具脚本（Utility Scripts）

### 1. 生成知识点ID
**文件**：`scripts/generate-kp-id.py`
```python
#!/usr/bin/env python3
import sys
import argparse

def generate_kp_id(subject, stage, domain, concept):
    """生成符合规范的知识点ID"""
    return f"kp-{subject}-{stage}-{domain}-{concept}"

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--subject', required=True)
    parser.add_argument('--stage', required=True)
    parser.add_argument('--domain', required=True)
    parser.add_argument('--concept', required=True)
    args = parser.parse_args()
    print(generate_kp_id(args.subject, args.stage, args.domain, args.concept))
```

### 2. 验证主索引
**文件**：`scripts/validate-kp-index.py`
- 检查 `kp_id` 格式
- 检查重复ID
- 检查排序
- 验证关联关系（prerequisites, courses）

### 3. 同步到知识树
**文件**：`scripts/sync-kp-to-trees.py`
- 读取主索引
- 更新对应知识树的节点ID
- 检查孤立节点（树中有但索引中没有）

### 4. 迁移旧ID
**文件**：`scripts/migrate-old-node-ids.py`
- 扫描所有 `manifest.json` 的 `node_id`
- 生成迁移映射 `old_node_id → kp_id`
- 批量更新知识树和注册表

---

## 📐 排序规则（Sorting Rules）

主索引按 `kp_id` **字典序排序**：
```
kp-bio-m-cell-division
kp-bio-m-cell-structure
kp-bio-m-ecology-photosynthesis
kp-chem-m-reaction-oxidation
kp-chn-e-pinyin-compound-vowel
kp-math-m-algebra-linear-func
kp-phy-h-mechanics-newton-laws
```

---

## 🔍 查询API（Query API）

提供命令行工具查询知识点：
```bash
# 按ID查询
python3 scripts/query-kp.py --id kp-math-m-algebra-linear-func

# 按学科查询
python3 scripts/query-kp.py --subject math --stage m

# 查找某课件关联的知识点
python3 scripts/query-kp.py --course math-linear-function

# 查找某知识点的所有课件
python3 scripts/query-kp.py --id kp-math-m-algebra-linear-func --show-courses
```

---

## ⚠️ 历史遗留处理（Legacy Migration）

### 旧ID体系（已废弃）
- `node_id`：知识树节点ID（不含学科前缀）
- `course_id`：课件ID（含学科前缀）

### 迁移策略
1. **保留字段**：`manifest.json` 保留 `node_id` 字段，新增 `kp_id` 字段
2. **向后兼容**：工具脚本同时支持 `node_id` 和 `kp_id`
3. **逐步迁移**：
   - Phase 1: 生成主索引，建立映射关系
   - Phase 2: 所有新课件使用 `kp_id`
   - Phase 3: 批量更新旧课件
   - Phase 4: 废弃 `node_id`

---

## 📝 示例对照表（Examples）

| 旧node_id | 新kp_id | 名称 | 学科 | 学段 |
|:---|:---|:---|:---|:---|
| `linear-function` | `kp-math-m-algebra-linear-func` | 一次函数 | 数学 | 初中 |
| `compound-vowel` | `kp-chn-e-pinyin-compound-vowel` | 复韵母 | 语文 | 小学 |
| `periodic-table` | `kp-chem-m-element-periodic-table` | 元素周期表 | 化学 | 初中 |
| `photosynthesis` | `kp-bio-m-ecology-photosynthesis` | 光合作用 | 生物 | 初中 |
| `newton-laws` | `kp-phy-h-mechanics-newton-laws` | 牛顿运动定律 | 物理 | 高中 |

---

## ✅ 检查清单（Checklist）

新增知识点时必须：
- [ ] ID符合 `kp-{subject}-{stage}-{domain}-{concept}` 格式
- [ ] 在主索引中唯一
- [ ] 按字母顺序插入主索引
- [ ] 运行 `validate-kp-index.py` 通过
- [ ] 同步到对应知识树
- [ ] 更新相关课件的 `manifest.json`
- [ ] 运行 `rebuild-index.py` 更新注册表

---

## 🚀 下一步行动（Next Steps）

1. **生成主索引**：扫描现有知识树，提取所有知识点，生成 `data/knowledge-points/index.json`
2. **实现工具脚本**：
   - `generate-kp-id.py`
   - `validate-kp-index.py`
   - `sync-kp-to-trees.py`
   - `migrate-old-node-ids.py`
   - `query-kp.py`
3. **迁移现有数据**：批量更新 131 个课件的 `manifest.json`，添加 `kp_id` 字段
4. **更新文档**：SKILL_CN.md、README_CN.md 中更新知识点引用规范

---

## 📖 相关文档

- [SKILL_CN.md](skill/SKILL_CN.md) - TeachAny 课件制作技能
- [ARCHITECTURE_REFACTOR_PLAN.md](ARCHITECTURE_REFACTOR_PLAN.md) - 架构重构计划
- [README_CN.md](README_CN.md) - 项目文档
