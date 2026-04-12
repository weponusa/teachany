# TeachAny 架构重构方案 v3.0

## 一、重构目标

### 当前问题
1. **存储分裂**：官方课件在 `examples/`（解压），社区课件在 GitHub Releases（`.teachany` 包）
2. **UX复杂**：用户需要下载 → 导入 → 查看，而非直接打开
3. **维护成本高**：需要维护打包脚本、发布流程、导入器
4. **Skill 工作流繁琐**：生成课件 → 打包 → 发布 Release → 更新索引

### 新架构目标
1. **统一存储**：所有课件解压存储，直接可访问
2. **简化 Skill**：生成课件 → 推送到仓库（一步完成）
3. **管理后台**：Web UI 管理课件（添加/删除/提升为官方）
4. **即点即用**：点击卡片直接打开，无需下载导入

---

## 二、新目录结构

```
teachany/
├── coursewares/                    # 📦 所有课件统一存储（替代 examples/）
│   ├── official/                   # 官方精选课件
│   │   ├── math-quadratic-function/
│   │   │   ├── index.html
│   │   │   ├── assets/
│   │   │   └── manifest.json
│   │   ├── bio-photosynthesis/
│   │   └── ...
│   ├── community/                  # 社区贡献课件
│   │   ├── bio-human-overview/
│   │   ├── math-elem-numbers/
│   │   └── ...
│   └── _template/                  # 课件模板
│
├── admin/                          # 🔧 管理员后台（新增）
│   ├── index.html                  # 管理面板
│   ├── admin.js                    # 后台逻辑
│   └── api/                        # GitHub API 封装
│       ├── list-coursewares.js
│       ├── promote-to-official.js
│       ├── delete-courseware.js
│       └── sync-registry.js
│
├── registry.json                   # 🗂️ 统一课件注册表（合并 courseware-registry + community/index）
│   # 结构：{ official: [...], community: [...] }
│
├── scripts/
│   ├── registry-loader.js          # 读取 registry.json，渲染卡片
│   ├── admin-auth.js               # 管理员身份验证
│   └── (删除) pack-courseware.cjs
│   └── (删除) publish-courseware.cjs
│   └── (删除) courseware-importer.js
│
├── skill/
│   └── SKILL_CN.md                 # 更新工作流：生成 → 直接推送
│
└── .github/workflows/
    ├── deploy-pages.yml            # 部署所有 coursewares/
    └── (删除) publish.yml
```

---

## 三、数据模型变更

### 3.1 统一注册表 `registry.json`

```json
{
  "version": "3.0",
  "updated_at": "2026-04-12T20:30:00Z",
  "official": [
    {
      "id": "math-quadratic-function",
      "path": "coursewares/official/math-quadratic-function",
      "status": "official",
      "promoted_at": "2026-04-10",
      "...": "其他元数据"
    }
  ],
  "community": [
    {
      "id": "bio-human-overview",
      "path": "coursewares/community/bio-human-overview",
      "status": "community",
      "submitted_at": "2026-04-11",
      "submitted_by": "user123",
      "...": "其他元数据"
    }
  ]
}
```

**字段变更**：
- ❌ 删除：`source`、`download_url`、`release_tag`、`local_path`
- ✅ 新增：`path`（相对路径，直接指向课件目录）、`status`（official/community）

---

## 四、Skill 工作流重构

### 4.1 旧流程（v2.x）
```
1. AI 生成课件 HTML → 保存到 examples/
2. 运行 pack-courseware.cjs → 生成 .teachany
3. 运行 publish-courseware.cjs → 上传到 GitHub Releases
4. 更新 registry → git push
```

### 4.2 新流程（v3.0）
```
1. AI 生成课件 HTML → 保存到 coursewares/community/{id}/
2. 运行 sync-to-registry.js → 自动添加到 registry.json
3. git add + commit + push → 完成发布
```

**Python/Node 脚本**：
```bash
# 一键发布课件
node scripts/publish-direct.js coursewares/community/new-course --author "username"

# 内部逻辑：
# 1. 验证课件完整性（index.html, manifest.json）
# 2. 添加条目到 registry.json 的 community 数组
# 3. git add coursewares/community/new-course registry.json
# 4. git commit -m "feat: add community courseware new-course"
# 5. git push
```

---

## 五、管理员后台功能

### 5.1 页面布局 `admin/index.html`

```
┌─────────────────────────────────────────┐
│ 🔐 TeachAny 管理员后台                    │
│ [GitHub OAuth 登录]                      │
├─────────────────────────────────────────┤
│ 📊 统计                                   │
│ 官方课件: 8  |  社区课件: 82              │
├─────────────────────────────────────────┤
│ 📋 课件列表                               │
│ [筛选] Official | Community | All        │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ 🧬 光合作用 (bio-photosynthesis)  │   │
│ │ Status: Official | Grade: 7      │   │
│ │ [查看] [编辑] [删除] [降为社区]   │   │
│ └──────────────────────────────────┘   │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ 🌿 人体概述 (bio-human-overview)  │   │
│ │ Status: Community | Grade: 7     │   │
│ │ [查看] [提升为官方] [删除]        │   │
│ └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 5.2 核心功能

#### A. 提升为官方课件
```javascript
async function promoteToOfficial(courseId) {
  // 1. 从 registry.json 的 community 数组移除
  // 2. 添加到 official 数组
  // 3. 移动文件：coursewares/community/{id} → coursewares/official/{id}
  // 4. 更新 path 字段
  // 5. git mv + commit + push
}
```

#### B. 降为社区课件
```javascript
async function demoteToComm unity(courseId) {
  // 反向操作
}
```

#### C. 删除课件
```javascript
async function deleteCourseware(courseId) {
  // 1. 从 registry.json 移除条目
  // 2. 删除课件目录
  // 3. git rm + commit + push
}
```

### 5.3 权限控制

**方案1：GitHub OAuth（推荐）**
- 使用 GitHub App 认证
- 检查用户是否是仓库 Collaborator
- 只有 Admin/Maintainer 可以操作

**方案2：环境变量 Token**
- 管理员本地设置 `ADMIN_TOKEN`
- 后台验证 token 后才允许操作

---

## 六、迁移步骤

### Phase 1: 数据迁移（1-2小时）

```bash
# 1. 创建新目录结构
mkdir -p coursewares/official coursewares/community

# 2. 移动官方课件
for dir in examples/*/; do
  name=$(basename "$dir")
  if [ "$name" != "_template" ]; then
    mv "$dir" "coursewares/official/$name"
  fi
done

# 3. 解压社区课件（从 dist/ 或 GitHub Releases）
cd coursewares/community
for pkg in ../../dist/*.teachany; do
  id=$(basename "$pkg" .teachany)
  mkdir -p "$id"
  unzip -q "$pkg" -d "$id"
done

# 4. 生成新 registry.json
node scripts/migrate-registry.js
```

### Phase 2: 代码重构（2-3小时）

1. **更新 `scripts/registry-loader.js`**
   - 读取新的 `registry.json` 结构
   - 渲染官方和社区两个 section
   - 所有课件链接改为 `./coursewares/{official|community}/{id}/index.html`

2. **删除旧脚本**
   - `pack-courseware.cjs`
   - `publish-courseware.cjs`
   - `courseware-importer.js`

3. **创建新脚本**
   - `publish-direct.js` — 直接发布课件到仓库
   - `sync-registry.js` — 同步 registry.json

4. **更新 Skill**
   - `SKILL_CN.md` 中移除打包流程说明
   - 更新为"生成 → 推送"流程

### Phase 3: 管理后台开发（3-4小时）

1. **基础框架**
   ```html
   admin/index.html
   admin/admin.css
   admin/admin.js
   ```

2. **GitHub API 集成**
   - 使用 Octokit.js
   - 操作：读取文件、提交变更、创建 PR

3. **UI 组件**
   - 课件列表（表格/卡片）
   - 筛选器（官方/社区/全部）
   - 操作按钮（提升/降级/删除）
   - 确认对话框

### Phase 4: 测试与上线（1小时）

1. 本地测试所有课件可访问
2. 测试管理后台功能
3. 更新 README 和文档
4. Git push + 触发 GitHub Actions 部署

---

## 七、向后兼容

### 7.1 旧链接重定向

为保证用户书签和外部链接不失效：

```javascript
// scripts/legacy-redirect.js
// 在 index.html 中注入，检测 URL 中的 ?legacy=xxx
const params = new URLSearchParams(window.location.search);
const legacyId = params.get('legacy');
if (legacyId) {
  // 查找新路径
  const newPath = findNewPath(legacyId);
  if (newPath) {
    window.location.replace(newPath);
  }
}
```

### 7.2 保留 community/index.json（只读）

- 不再更新，仅作为归档
- registry-loader 优先读取 registry.json

---

## 八、收益分析

| 维度 | v2.x（当前） | v3.0（重构后） | 改进 |
|:---|:---|:---|:---|
| **存储统一** | ❌ 官方解压，社区打包 | ✅ 全部解压 | 简化架构 |
| **用户体验** | 下载 → 导入 → 查看 | 直接点击查看 | 减少3步操作 |
| **Skill 流程** | 4步（生成/打包/发布/推送） | 1步（生成 → 推送） | 提效75% |
| **维护成本** | 高（打包/Release/导入器） | 低（只管理目录） | 代码量-40% |
| **管理能力** | ❌ 无后台，手动编辑JSON | ✅ Web UI 可视化管理 | 提升管理效率 |

---

## 九、风险与对策

| 风险 | 影响 | 对策 |
|:---|:---|:---|
| **仓库体积暴涨** | 82个课件解压后>500MB | 使用 Git LFS 存储大文件（TTS音频等） |
| **GitHub Pages 限制** | 1GB 大小限制 | 选择性部署，或迁移到 Vercel/Cloudflare Pages |
| **迁移数据丢失** | 课件文件损坏 | 迁移前全量备份 dist/ 和 examples/ |
| **权限滥用** | 恶意删除课件 | 管理后台加审计日志，操作可回退 |

---

## 十、时间表

| 阶段 | 任务 | 预计时间 | 负责人 |
|:---|:---|:---|:---|
| Phase 1 | 数据迁移（移动文件/解压包/生成registry） | 2h | AI Agent |
| Phase 2 | 代码重构（loader/scripts/skill） | 3h | AI Agent |
| Phase 3 | 管理后台开发（HTML/JS/API） | 4h | AI Agent |
| Phase 4 | 测试与上线 | 1h | AI Agent + User |
| **总计** | | **10h** | |

---

## 十一、下一步行动

**立即开始**：
```bash
# 1. 创建新分支
git checkout -b refactor/unified-storage

# 2. 执行数据迁移
./scripts/migrate-to-v3.sh

# 3. 代码重构

# 4. 提交测试
git push origin refactor/unified-storage

# 5. 合并到 main
```

**用户确认后开始执行。**
