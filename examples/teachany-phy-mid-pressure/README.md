# 压强 · 固体压强与液体压强

> 教我学 TeachAny 标准课件 · 人教版2024 · 八年级下册 · 课标2022

## 📋 课件概述

本课件覆盖三大核心知识模块：

| 模块 | 核心公式 | Canvas 实验 |
|:---|:---|:---|
| 固体压强 | p = F/S | 冰面救人（站着 vs 趴着） |
| 液体压强 | p = ρgh | 深海压强探测器 |
| 连通器 | 液面等高 | 连通器演示（粗细管） |

## 🎯 TeachAny 标准特性

- **ABT 叙事结构**：每模块 And/But/Therefore 引入
- **ConcepTest + wrongDiag**：3 道即时检测，逐选项错因诊断
- **知识图谱 SVG**：三列布局（前序→核心→后续）+ Bezier 连线
- **Canvas HiDPI**：3 个交互实验，支持 Retina 屏幕
- **脚手架分级**：Level 1 基础填空 → Level 2 液体压强 → Level 3 迁移挑战
- **后测 8 题**：覆盖全部 3 模块，含逐选项 wrongDiag
- **Learning System v5.2**：进度追踪 + SM-2 间隔重复 + 成就系统
- **TTS 语音讲解**：4 段语音 + 字幕 + 自动翻页 + 播放器
- **深色主题**：全页面暗色 UI，CSS 变量驱动
- **响应式布局**：手机 / 平板 / 桌面自适应

## 📁 文件结构

```
teachany-phy-mid-pressure/
├── index.html          # 主课件（由 generate.py 组装）
├── manifest.json       # 课件元数据
├── README.md           # 本文件
├── generate.py         # 组装脚本（part1-8 → index.html）
├── part1.html          # Head + CSS + Nav + Hero + Engage
├── part2.html          # Objectives + Knowledge Graph + Precheck
├── part3.html          # Module 1: 固体压强
├── part4.html          # Module 2: 液体压强
├── part5.html          # Module 3: 连通器
├── part6.html          # Interactive Hub + Scaffold + Postcheck + Summary
├── part7.html          # JS: KG + ConcepTest + Pretest + Scaffold + Quiz
├── part8.html          # JS: Canvas + Learning + TTS + Nav + Init
├── ch0-intro.mp3       # TTS: 引言
├── ch1-solid-pressure.mp3  # TTS: 固体压强
├── ch2-liquid-pressure.mp3 # TTS: 液体压强
└── ch3-vessel.mp3      # TTS: 连通器
```

## 🔗 知识图谱节点

- **前序**：力的概念、密度 ρ=m/V、牛顿第一定律
- **核心**：固体压强 p=F/S、液体压强 p=ρgh、连通器原理
- **后续**：大气压强、流体压强与流速、帕斯卡定律

## 🛠️ 构建

```bash
python3 generate.py
# → 生成 index.html
```

## 📐 外部素材引用

本课件整合了以下外部教学素材：
- 压力≠重力辨析表（5 行对比）
- "冰面救人"实验概念（站/趴压强对比）
- 深海鱼形态变化（5 层海洋数据）
- 连通器 4 种生活应用（茶壶/船闸/水塔/液面计）
- 生活中的压强 6 例（图钉/菜刀/啄木鸟 vs 书包带/铁轨/滑雪板）
