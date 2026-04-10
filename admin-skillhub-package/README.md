# TeachAny Admin（教我学·管理员版）

> TeachAny 课件管理员技能——生成、校验、打包、发布一条龙

## 简介

TeachAny Admin 是面向项目管理员的专用技能。它在 TeachAny 基础课件生成能力之上，集成了课件质量校验、打包分发、GitHub Releases 发布、Registry 注册表更新和 Git 推送的完整管理流水线。

**核心定位**：管理员说一句"帮我制作并推送一个【XX学科·XX知识点】的示范课件"，AI 即可自动完成从课件生成到上线 Gallery 的全部操作。

## 与 TeachAny（基础版）的关系

| 维度 | TeachAny（基础版） | TeachAny Admin（管理员版） |
|:-----|:-----|:-----|
| **使用者** | 所有用户 | 项目管理员 |
| **核心能力** | 课件教学设计与 HTML 生成 | 课件生成 + 校验 + 打包 + 发布 + 推送 |
| **发布能力** | ❌ 不涉及 | ✅ 自动发布到 GitHub Releases |
| **Registry 更新** | ❌ 不涉及 | ✅ 自动更新 courseware-registry.json |
| **Git 操作** | ❌ 不涉及 | ✅ 自动 commit + push |
| **质量校验** | 可选（Phase 4） | ✅ 强制过 Completeness Gate |
| **前置要求** | 无 | GITHUB_TOKEN 环境变量 |

## 核心能力

| 阶段 | 说明 |
|:-----|:-----|
| **P1 课件生成** | 调用 TeachAny 核心教学设计能力生成互动 HTML 课件 |
| **P2 质量校验** | 自动执行 `validate-courseware.cjs`，18 项 Completeness Gate |
| **P3 打包** | 执行 `pack-courseware.cjs` 生成 .teachany 包 |
| **P4 注册** | 更新 `courseware-registry.json` 添加新课件条目 |
| **P5 发布** | 执行 `publish-courseware.cjs` 上传到 GitHub Releases |
| **P6 推送** | Git add + commit + push 推送所有变更 |

## 使用示例

```
帮我制作一个"勾股定理"（八年级数学）的示范课件并推送到官方 Gallery
```

```
把 examples/ 下所有课件重新打包发布到 GitHub Releases
```

```
校验 examples/bio-photosynthesis 课件质量
```

## 前置要求

- **GITHUB_TOKEN**：GitHub Personal Access Token（需要 `repo` 权限），用于发布 Release
  ```bash
  export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
  ```

## 版本

- 技能版本：v1.0
- 更新日期：2026-04-10
- 依赖 TeachAny 基础版：v5.8+
