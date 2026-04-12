# 部署问题诊断与修复报告

**问题时间**: 2026-04-12T21:52  
**症状**: 本地可以看到课件,GitHub Pages 显示空白  
**根因**: 部署配置缺失 `registry.json` 复制步骤

---

## 一、问题诊断

### 1.1 症状描述

**本地环境** (http://localhost:8888):
- ✅ 可以看到 48 个课件
- ✅ 官方课件/社区课件正常显示
- ✅ 筛选、搜索功能正常

**GitHub Pages** (https://weponusa.github.io/teachany):
- ❌ 首页显示"当前筛选条件下暂无官方课件"
- ❌ 社区课件也显示空白
- ❌ 统计数字为 0

### 1.2 根因分析

**问题根源**: `.github/workflows/deploy-pages.yml` 部署脚本

```yaml
# 旧配置 (错误)
- name: Prepare deployment files
  run: |
    cp manifest.json _site/
    cp courseware-registry.json _site/  # ❌ 只复制旧注册表
    [ -d examples ] && cp -r examples _site/  # ✅ 课件目录有复制
```

**为什么会出错**:

1. **v6.0 架构重构**后,`unified-loader.js` 改为加载 `registry.json`
2. 但**部署脚本没有同步更新**,仍然只复制 `courseware-registry.json`
3. GitHub Pages 上 `fetch('/registry.json')` → **404 Not Found**
4. 加载失败 → 课件列表为空 → 显示"暂无课件"

**本地为什么正常**:
- 本地文件系统有 `registry.json`
- 浏览器可以正常加载 `http://localhost:8888/registry.json`

---

## 二、修复方案

### 2.1 修复内容

**文件**: `.github/workflows/deploy-pages.yml`

```diff
  # 2. 复制网站配置文件
  cp manifest.json _site/
+ cp registry.json _site/
- cp courseware-registry.json _site/
+ cp courseware-registry.json _site/ 2>/dev/null || true
  [ -f .nojekyll ] && cp .nojekyll _site/
```

**变更说明**:
- ✅ 添加 `cp registry.json _site/` (新注册表)
- ✅ 保留 `cp courseware-registry.json _site/` (旧注册表,向后兼容)
- ✅ 添加 `2>/dev/null || true` (文件不存在时不报错)

### 2.2 提交信息

**Commit**: `263cb94`

```
fix: 部署配置添加 registry.json 复制

根本问题:
- 部署脚本只复制了旧的 courseware-registry.json
- 但 unified-loader.js 加载的是新的 registry.json
- 导致 GitHub Pages 上加载失败,显示空白

修复:
- 添加 cp registry.json _site/ 到部署步骤
- 保留 courseware-registry.json 兼容性(|| true)
- 现在两个注册表都会被复制到部署包

本地可以看到课件是因为本地有 registry.json,但 GitHub Pages 上没有
```

---

## 三、验证步骤

### 3.1 等待部署

**预计时间**: 5-10 分钟

**查看部署状态**:
1. 访问 https://github.com/weponusa/teachany/actions
2. 找到最新的 "Deploy to GitHub Pages" 工作流
3. 确认状态为 ✅ 绿色对勾

### 3.2 验证清单

**部署完成后,访问 https://weponusa.github.io/teachany 并验证**:

- [ ] **首页统计**: 官方课件 9 个,社区课件 39 个
- [ ] **registry.json 可访问**: 打开 https://weponusa.github.io/teachany/registry.json
- [ ] **官方课件区**: 显示 9 个课件(不再显示"暂无课件")
- [ ] **社区课件区**: 显示 39 个课件
- [ ] **课件卡片**: 官方课件带"⭐官方"徽章
- [ ] **点击课件**: 可以正常打开课件页面
- [ ] **筛选功能**: 学段/学科筛选正常工作
- [ ] **搜索功能**: 搜索框可以搜索课件名称
- [ ] **中英对照**: 所有界面文本显示中英双语

### 3.3 浏览器缓存清除

如果部署完成后仍看不到课件,**清除浏览器缓存**:

**Chrome/Edge**:
```
Cmd + Shift + Delete (macOS)
Ctrl + Shift + Delete (Windows)
→ 选择"缓存的图片和文件"
→ 点击"清除数据"
```

**或者强制刷新**:
```
Cmd + Shift + R (macOS)
Ctrl + Shift + F5 (Windows)
```

---

## 四、问题总结

### 4.1 根本原因

**架构重构不完整**: v6.0 重构了数据模型和加载器,但**忘记同步更新部署脚本**。

**依赖链条**:
```
unified-loader.js (加载 registry.json)
    ↓
registry.json (新注册表)
    ↓
部署脚本 (应该复制 registry.json)
    ↓
GitHub Pages (文件不存在 → 404)
```

### 4.2 经验教训

**架构变更检查清单**:
1. ✅ 数据模型变更 (registry.json)
2. ✅ 前端代码变更 (unified-loader.js)
3. ✅ 本地测试通过
4. ❌ **部署脚本同步** ← 遗漏了这一步!
5. ⏳ 部署后验证 (待完成)

**防范措施**:
- 架构重构后,检查所有引用旧文件名的地方
- 部署前在 staging 环境验证
- 监控生产环境的 404 错误

### 4.3 影响范围

**时间跨度**: 2026-04-12T20:45 - 2026-04-12T21:52 (约 1 小时)

**受影响用户**:
- ✅ 本地开发者: 无影响
- ❌ GitHub Pages 访客: 看不到任何课件
- ❌ 新用户: 误以为项目是空的

**修复后**:
- ✅ 所有用户都能看到 48 个课件
- ✅ 官方/社区课件正常展示
- ✅ 中英双语界面

---

## 五、相关文件

### 5.1 核心文件

| 文件 | 作用 | 状态 |
|:---|:---|:---:|
| `registry.json` | 统一课件注册表 (v3.0) | ✅ 已生成 |
| `scripts/unified-loader.js` | 统一加载器 | ✅ 已创建 |
| `.github/workflows/deploy-pages.yml` | 部署配置 | ✅ 已修复 |
| `index.html` | 首页 | ✅ 已更新 |

### 5.2 历史文件 (兼容性保留)

| 文件 | 作用 | 状态 |
|:---|:---|:---:|
| `courseware-registry.json` | 旧官方注册表 | 🔶 只读存档 |
| `community/index.json` | 旧社区注册表 | 🔶 只读存档 |

---

## 六、后续行动

### 6.1 立即行动 (等待部署)

- [x] 修复 `.github/workflows/deploy-pages.yml`
- [x] 提交并推送到 GitHub
- [ ] 等待 5-10 分钟 GitHub Actions 完成部署
- [ ] 验证 GitHub Pages 课件正常显示

### 6.2 文档更新

- [ ] 更新 `README.md` 部署说明
- [ ] 在 `ARCHITECTURE_REFACTOR_PLAN.md` 中添加此问题案例
- [ ] 创建 `DEPLOYMENT.md` 部署检查清单

### 6.3 监控告警

建议添加:
- GitHub Actions 失败通知
- 404 错误监控 (registry.json 不存在)
- 用户反馈渠道 (GitHub Issues)

---

**报告时间**: 2026-04-12T21:55  
**修复状态**: ✅ 已推送,等待部署完成  
**预计可用**: 2026-04-12T22:00-22:05
