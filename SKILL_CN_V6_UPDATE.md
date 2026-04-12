# TeachAny Skill CN v6.0 重大更新说明

## 🎯 核心改动:废弃 .teachany 打包机制

**日期**:2026-04-12  
**版本**:v5.12 → v6.0

---

## 一、变更概述

### 1.1 移除内容

**完全删除以下章节**:
- ❌ Section 17《课件打包与分发》
- ❌ Phase 3.5 打包步骤
- ❌ 所有 `.teachany` 包相关描述

**删除脚本**:
- ❌ `scripts/pack-courseware.cjs`
- ❌ `scripts/publish-courseware.cjs`
- ❌ `scripts/registry-loader.js`
- ❌ `scripts/community-loader.js`
- ❌ `scripts/featured-loader.js`
- ❌ `scripts/stats-updater.js`

**新增脚本**:
- ✅ `scripts/unified-loader.js` (替代上述所有加载器)

### 1.2 新工作流

**旧流程(v5.12)**:
```
生成课件 → 生成 manifest.json → pack-courseware.cjs 打包成 .teachany → publish-courseware.cjs 发布到 GitHub Releases → 更新 community/index.json → 用户下载包导入
```

**新流程(v6.0)**:
```
生成课件 → 直接推送到 examples/ 目录 → Git commit & push → 更新 registry.json → 自动部署到 GitHub Pages
```

### 1.3 数据模型变更

**旧模型(双注册表)**:
- `courseware-registry.json` (官方课件)
- `community/index.json` (社区课件,含 `download_url`)

**新模型(单注册表)**:
- `registry.json` (统一注册表)
- 字段变化:
  - ❌ 删除: `source`, `download_url`, `local_path`, `release_tag`
  - ✅ 新增: `status` ("official" | "community"), `path`, `url`

---

## 二、需要更新的文档内容

### 2.1 删除 Section 17 全部内容

**文件**: `skill/SKILL_CN.md`  
**行数**: 2996-3088 (共93行)

包含:
- 17.1 课件包结构
- 17.2 manifest.json 必填字段
- 17.3 打包命令
- 17.4 AI 生成课件后的标准流程
- 17.5 HTML meta 标签
- 17.6 导入方式

**替换为**:
```markdown
## 十七、课件发布与部署

TeachAny 采用 GitHub Pages + Git 的标准部署流程,所有课件直接推送到 `examples/` 目录。

### 17.1 课件生成后的标准流程

Phase 3 完成后,执行以下步骤:

**Step 1: 确认课件完整性**
- `index.html` 包含完整 teachany-* meta 标签
- `manifest.json` 已生成并包含正确字段
- 音频文件(如有)位于 `tts/` 子目录
- 动画视频(如有)位于 `out/` 子目录

**Step 2: 推送到仓库**
```bash
cd teachany-opensource
git add examples/<courseware-id>
git commit -m "feat: 新增课件 <课件名称>"
git push origin main
```

**Step 3: 更新注册表**
运行注册表生成脚本:
```bash
node scripts/upgrade-registry-v3.cjs
```

该脚本会自动:
- 扫描 `examples/` 目录下所有课件
- 读取每个课件的 `manifest.json`
- 生成统一的 `registry.json`

**Step 4: 推送注册表**
```bash
git add registry.json
git commit -m "chore: 更新课件注册表"
git push origin main
```

**Step 5: 自动部署**
GitHub Actions 会自动:
- 触发部署工作流
- 将课件部署到 GitHub Pages
- 5-10分钟后可在 https://<username>.github.io/teachany-opensource 访问

### 17.2 manifest.json 必填字段

```jsonc
{
  "name": "一次函数与正比例函数",
  "subject": "math",
  "grade": 8,
  "author": "weponusa",
  "version": "1.0.0",
  "node_id": "linear-function",
  "domain": "function",
  "prerequisites": ["proportional-function"],
  "emoji": "📏",
  "difficulty": 3,
  "teachany_spec": "1.0"
}
```

### 17.3 HTML meta 标签规范

每个课件的 `index.html` **必须**包含以下 meta 标签:

```html
<meta name="teachany-node" content="linear-function">
<meta name="teachany-subject" content="math">
<meta name="teachany-domain" content="function">
<meta name="teachany-grade" content="8">
<meta name="teachany-prerequisites" content="proportional-function">
<meta name="teachany-difficulty" content="3">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">
```

这些标签用于:
- 知识地图关联
- 自动生成 `manifest.json`
- 注册表索引
```

### 2.2 更新变更日志

**位置**: Section 最后的版本历史

**修改**:
```markdown
- v5.12：⭐ 强制使用开源数据源，禁止手工标注——(详细内容保持不变)
- v6.0：**废弃 .teachany 打包机制，统一存储架构**——(1) 删除 Section 17《课件打包与分发》；(2) 删除 Phase 3.5 打包步骤；(3) 删除 6 个过时脚本(pack-courseware/publish-courseware/registry-loader/community-loader/featured-loader/stats-updater)；(4) 新增 `scripts/unified-loader.js` 统一加载器；(5) 课件发布流程从"生成→打包→Releases"改为"生成→Git推送→自动部署"；(6) 数据模型从双注册表(`courseware-registry.json` + `community/index.json`)统一为单注册表(`registry.json`)；(7) 注册表字段从 `source/download_url/local_path/release_tag` 改为 `status/path/url`；(8) 所有课件统一存储在 `examples/` 目录(40个,含9个官方+31个社区)；(9) `index.html` 从加载5个脚本简化为加载1个 `unified-loader.js`；(10) 删除所有 `.teachany` 包生成和下载相关功能。
```

### 2.3 更新 Completeness Gate

**位置**: Section 3.4 Completeness Gate 检查清单

**修改 #16 项**:
```markdown
# 旧版(v5.12)
□ 16. 课件打包：是否生成了 manifest.json 并完成 .teachany 打包？
     → ✅/❌ ___

# 新版(v6.0)
□ 16. 课件元信息：是否生成了 manifest.json 并包含完整字段？
     → ✅/❌ ___
```

### 2.4 更新硬规则

**位置**: Section 5 系统硬规则

**修改 #18 条**:
```markdown
# 旧版(v5.12)
| 18 | **课件打包默认执行**。L1 课件完成后必须生成 manifest.json 并执行打包(Phase 3.5)。打包脚本不可用时至少生成 manifest.json。 | 无打包 → 课件无法被 Gallery 导入 |

# 新版(v6.0)
| 18 | **课件元信息必须完整**。L1 课件完成后必须生成 manifest.json 并包含所有必填字段(name/subject/grade/author/node_id/emoji/difficulty/teachany_spec)。 | 元信息不完整 → 课件无法被注册表索引 |
```

### 2.5 更新架构分层表

**位置**: Section 16 架构分层

**修改 L4 行**:
```markdown
# 旧版(v5.12)
| **L4 — 课件打包** | `*.teachany` 包 | Node.js(pack-courseware.cjs) | ✅ AI 自动执行 | ✅ **默认必选** |

# 新版(v6.0)
| **L4 — 课件发布** | Git commit & push | Git | ✅ AI 自动执行 | ✅ **默认必选** |
```

### 2.6 删除所有提到打包的段落

**全局搜索并删除/修改**:
- "打包"
- "pack-courseware"
- "publish-courseware"
- ".teachany"
- "Phase 3.5"
- "manifest.json 并执行打包"

**替换为**:
- "生成 manifest.json"
- "推送到仓库"
- "更新注册表"

---

## 三、升级指南(给用户)

### 3.1 现有课件迁移

如果你有已打包的 `.teachany` 文件,需要:

1. **解压课件包**:
```bash
unzip my-course.teachany -d examples/my-course
```

2. **确认文件完整**:
```
examples/my-course/
├── index.html
├── manifest.json
└── (其他资源)
```

3. **推送到仓库**:
```bash
git add examples/my-course
git commit -m "feat: 迁移课件 my-course"
git push origin main
```

4. **更新注册表**:
```bash
node scripts/upgrade-registry-v3.cjs
git add registry.json
git commit -m "chore: 更新注册表"
git push origin main
```

### 3.2 新课件发布流程

**不再需要**:
- ❌ 执行 `node scripts/pack-courseware.cjs`
- ❌ 执行 `node scripts/publish-courseware.cjs`
- ❌ 上传 `.teachany` 到 GitHub Releases
- ❌ 手动编辑 `community/index.json`

**新流程**:
1. ✅ AI 生成课件到 `examples/<courseware-id>/`
2. ✅ 确认 `manifest.json` 已生成
3. ✅ `git add examples/<courseware-id> && git commit && git push`
4. ✅ 运行 `node scripts/upgrade-registry-v3.cjs`
5. ✅ `git add registry.json && git commit && git push`
6. ✅ 等待 GitHub Actions 自动部署

---

## 四、待办事项

### 4.1 文档更新

- [ ] 更新 `skill/SKILL_CN.md` Section 17
- [ ] 更新 `skill/SKILL.md` (英文版) 对应章节
- [ ] 更新 `README_CN.md` 中的发布流程
- [ ] 更新 `README.md` (英文版)
- [ ] 更新 `CONTRIBUTING.md` 贡献指南

### 4.2 代码清理

- [x] 删除 `scripts/pack-courseware.cjs`
- [x] 删除 `scripts/publish-courseware.cjs`
- [x] 删除 `scripts/registry-loader.js`
- [x] 删除 `scripts/community-loader.js`
- [x] 删除 `scripts/featured-loader.js`
- [x] 删除 `scripts/stats-updater.js`
- [x] 创建 `scripts/unified-loader.js`
- [x] 更新 `index.html` 脚本引用

### 4.3 部署验证

- [ ] 推送所有更改到 GitHub
- [ ] 验证 GitHub Actions 部署成功
- [ ] 验证 Gallery 页面课件正常显示
- [ ] 验证知识地图页面课件正常关联
- [ ] 验证音频播放器正常工作

---

**结束时间**:2026-04-12T20:45:00Z
