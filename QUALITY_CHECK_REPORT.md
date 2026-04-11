# TeachAny 课件质检报告

**检测日期**: 2026-04-11  
**检测工具**: TeachAny Skill 质检规则 v1.0  
**检测范围**: 全部 177 个官方课件

---

## 检测结果总览

| 指标 | 数值 | 说明 |
|:---|:---:|:---|
| **总课件数** | 177 | 检测前 registry 中的全部课件 |
| **合格课件** | 158 (89.3%) | 保留在官方 registry |
| **不合格课件** | 19 (10.7%) | 降级到社区课件区 |

---

## 质检规则

### ✅ 必须项（不通过则降级）

1. **teachany-node 元数据**  
   必须有 `<meta name="teachany-node" content="xxx">` 标签用于关联知识树节点

2. **完整的 body 内容**  
   `<body>` 标签必须存在且内容不少于 100 字符

3. **教学内容结构**  
   必须有 module/lesson/chapter/canvas 等教学区域标记

4. **无错误页面标记**  
   不能包含 "404" 或 "Page Not Found" 等错误信息

5. **交互元素**  
   必须有按钮/输入框/Canvas/事件监听等交互功能

### ⚠️ 警告项（建议改进，不影响合格）

- TTS 音频声明与实际不一致
- 外部依赖过多（>15 个 CDN 引用）
- 文件过大（>800 KB）
- 包含 `eval()` 危险代码
- 缺少 viewport meta 标签

---

## 不合格课件清单（19 个）

所有不合格课件均因 **缺少 `<meta name="teachany-node">` 标签** 而被降级。

### 物理课件（16 个）

| ID | 名称 | 年级 | 降级原因 |
|:---|:---|:---:|:---|
| phy-ohms-law | 欧姆定律 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-noise-control | 噪声的危害和控制 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-phase-change | 物态变化 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-plane-mirror | 平面镜成像 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-pressure | 压强 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-resistance | 电阻 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-series-parallel | 串联和并联 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-simple-machines | 简单机械（杠杆、滑轮） | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-sound-generation | 声音的产生与传播 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-sound-properties | 声音的特性 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-specific-heat | 比热容 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-spherical-mirror | 球面镜（凸面镜、凹面镜） | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-static-electricity | 电荷与静电 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-thermometer | 温度与温度计 | 8 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-voltage | 电压 | 9 | 缺少 teachany-node meta 标签 |
| teachany-phy-mid-work-energy | 功与功率 | 9 | 缺少 teachany-node meta 标签 |

### 生物课件（3 个）

| ID | 名称 | 年级 | 降级原因 |
|:---|:---|:---:|:---|
| bio-cell-life | 细胞的生活与能量 | 7 | 缺少 teachany-node meta 标签 |
| bio-cell-division | 细胞分裂与分化 | 7 | 缺少 teachany-node meta 标签 |
| bio-tissue-types | 组织·器官·系统 | 7 | 缺少 teachany-node meta 标签 |

---

## 降级处理

### 操作内容

1. **从 registry 移除**  
   这 19 个课件已从 `courseware-registry.json` 中移除

2. **加入 community index**  
   已添加到 `community/index.json`，标记为 `status: "demoted"`

3. **Gallery 显示**  
   - 官方课件区：不再显示这些课件
   - 社区课件区：显示为社区贡献课件，可下载体验

### 后续整改

这些课件质量本身良好，只需补充 `<meta name="teachany-node">` 标签即可重新升级到官方 registry。

整改步骤：
1. 在课件的 `<head>` 中添加 `<meta name="teachany-node" content="对应知识树节点ID">`
2. 重新运行质检脚本验证通过
3. 提交 PR 申请重新加入 registry

---

## 合格课件分布

| 学科 | 合格数 | 占比 |
|:---|:---:|:---:|
| 数学 (math) | 38 / 38 | 100% |
| 物理 (physics) | 7 / 23 | 30.4% |
| 生物 (biology) | 36 / 39 | 92.3% |
| 化学 (chemistry) | 28 / 28 | 100% |
| 地理 (geography) | 31 / 31 | 100% |
| 语文 (chinese) | 18 / 18 | 100% |
| **总计** | **158 / 177** | **89.3%** |

**结论**: 物理学科课件需要重点整改（30.4% 合格率），其他学科质量优秀。

---

## 质检工具

检测脚本: `scripts/batch-quality-check.py`  
降级脚本: `scripts/demote-failed-courses.py`  
检测报告: `quality-check-report.json`

运行方式:
```bash
# 全量检测
python3 scripts/batch-quality-check.py

# 检测指定课件
python3 scripts/batch-quality-check.py "course-id-1,course-id-2"

# 执行降级
python3 scripts/demote-failed-courses.py
```

---

**生成时间**: 2026-04-11 12:02:00 UTC  
**审核人**: TeachAny Skill (Automated)
