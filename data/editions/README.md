# 📚 教材版本注册表（editions）

## 概述

本目录包含中国 K12 教材版本注册表，数据来源于开源项目 [ChinaTextbook](https://github.com/TapXWorld/ChinaTextbook)（⭐ 69.6k）。

## 核心文件

| 文件 | 说明 |
|:---|:---|
| `registry.json` | 教材版本注册表，包含小学/初中/高中三个学段所有学科的出版社版本列表及 GitHub URL 映射 |

## 设计原理

### 统编 vs 多版本

中国 K12 教材分两种模式：

- **全国统编学科**（`unified: true`）：语文、历史、道德与法治/思想政治 —— 全国统一使用人教版，**无需询问用户版本**
- **多版本学科**（`unified: false`）：数学、物理、化学、生物学、英语、地理等 —— 各地使用不同版本，**运行时需询问用户**

### URL 拼接规则

```
浏览地址: https://github.com/TapXWorld/ChinaTextbook/tree/master/{学段}/{学科}/{版本}
原始文件: https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/{学段}/{学科}/{版本}/{年级}/{文件名}
```

### 大文件处理

仓库中超过 50MB 的 PDF 被拆分为 `.pdf.1`、`.pdf.2` 等多个文件，需使用 `cat` 命令合并：

```bash
cat 文件名.pdf.1 文件名.pdf.2 > 文件名.pdf
```

## 数据统计

| 学段 | 学科数 | 多版本学科数 |
|:---|:---:|:---:|
| 小学 | 10 | 8 |
| 初中 | 18 | 15 |
| 高中 | 18 | 15 |

## 运行时流程

1. Phase 0 确定学段和学科后，读取 `registry.json`
2. 检查该学科是否为统编（`unified: true`）
3. 若为统编 → 自动使用人教版，无需询问
4. 若为多版本 → 列出可选版本，询问用户使用哪个版本
5. 拼接 ChinaTextbook 仓库 URL，用 `web_fetch` 获取教材目录
6. 按需下载对应册次的 PDF，用 MinerU API 解析为文本
7. 将教材内容注入课件制作流程

## 版本信息

- 数据来源版本：ChinaTextbook master 分支（2026-04-16 采集）
- 注册表版本：1.0.0
