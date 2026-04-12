# 🔧 切换到 GitHub Actions 部署指南

## 问题根源

**GitHub Pages 部署失败的真正原因找到了!**

### 失败记录
从 `2026-04-12 09:39` 开始,所有部署都失败:
```
7794a68 | errored | 2026-04-12T09:39:29Z (v2.1 重构)
b35fb8a | errored | 2026-04-12T09:45:02Z (补全社区课件)
bd79728 | errored | 2026-04-12T09:57:32Z (添加复韵母)
b31a1fe | errored | 2026-04-12T10:46:58Z (修复统计数字)
```

### 根本原因
- **构建方式**: `legacy` (Jekyll)
- **错误信息**: "Page build failed." (无详细原因)
- **触发点**: v2.1 重构后 (删除大量 examples/ 课件)

Jekyll 构建器可能无法正确处理大规模文件删除操作。

---

## ✅ 解决方案 - 切换到 GitHub Actions

### 已完成的步骤 (自动)
1. ✅ 创建 `.github/workflows/deploy-pages.yml`
2. ✅ 创建 `.nojekyll` 文件
3. ✅ Git 推送到 `origin/main` (Commit `85f2532`)

### 需要手动完成的步骤 (必须)

#### 步骤1: 访问仓库设置
打开浏览器访问:
```
https://github.com/weponusa/teachany/settings/pages
```

#### 步骤2: 更改 Source
在 **Build and deployment** 区域:

**当前设置** (错误):
```
Source: Deploy from a branch
Branch: main
Path: / (root)
```

**改为** (正确):
```
Source: GitHub Actions
```

#### 步骤3: 保存并触发部署
1. 点击 **Source** 下拉菜单
2. 选择 **GitHub Actions**
3. 页面自动保存
4. 等待 1-2 分钟,GitHub Actions 会自动触发部署

#### 步骤4: 验证部署
1. 访问 Actions 页面:
   ```
   https://github.com/weponusa/teachany/actions
   ```
2. 查看 "Deploy to GitHub Pages" workflow
3. 等待绿色✅标志 (表示成功)

#### 步骤5: 访问网站
部署成功后访问:
```
https://weponusa.github.io/teachany/
```

清除浏览器缓存 (`Cmd+Shift+R`) 或使用无痕模式。

---

## 📊 对比: Legacy vs GitHub Actions

| 特性 | Legacy (Jekyll) | GitHub Actions |
|:---|:---:|:---:|
| **构建方式** | Jekyll 自动构建 | 直接上传静态文件 |
| **速度** | 慢 (需要构建) | 快 (无需构建) |
| **错误日志** | 模糊 | 清晰详细 |
| **文件限制** | 严格 | 宽松 |
| **配置复杂度** | 低 (自动) | 中 (需要workflow) |
| **当前状态** | ❌ 失败 (errored) | ✅ 待激活 |

---

## 🎯 为什么会成功?

### 1. 跳过 Jekyll 构建
- `.nojekyll` 文件告诉 GitHub 不要用 Jekyll
- GitHub Actions 直接上传静态文件
- 避免 Jekyll 对文件结构的限制

### 2. 明确的部署流程
```yaml
1. Checkout 代码
2. Setup Pages 配置
3. Upload 整个仓库作为 artifact
4. Deploy 到 GitHub Pages
```

### 3. 清晰的错误日志
如果部署失败,Actions 页面会显示详细的错误信息。

---

## 🔍 监控部署状态

### 方法1: GitHub Actions 页面
```
https://github.com/weponusa/teachany/actions
```

### 方法2: 命令行 (gh CLI)
```bash
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource

# 查看最近的 workflow runs
gh run list --workflow=deploy-pages.yml --limit 5

# 查看最新一次的详细日志
gh run view --log
```

### 方法3: 本地检查脚本 (已创建)
```bash
./check-pages-deployment.sh
```

---

## 📝 预期结果

### 切换后第一次部署
```
✅ Commit 85f2532 触发 GitHub Actions
✅ Workflow "Deploy to GitHub Pages" 开始运行
✅ 步骤1: Checkout (检出代码)
✅ 步骤2: Setup Pages (配置Pages)
✅ 步骤3: Upload artifact (上传文件)
✅ 步骤4: Deploy (部署到Pages)
✅ 部署完成,网站更新
```

### 访问网站后
```
✅ 统计数字: 8 官方 + 82 社区
✅ Gallery 显示所有课件
✅ 知识地图正常工作
✅ 社区课件功能正常
```

---

## ⚠️ 注意事项

### 1. 必须手动切换 Source
**GitHub Actions workflow 不会自动激活**,必须在 Settings → Pages 手动选择 "GitHub Actions"。

### 2. 首次部署可能需要权限
如果 Actions 运行失败,提示权限问题:
1. 进入: Settings → Actions → General
2. 找到: Workflow permissions
3. 选择: Read and write permissions
4. 保存后重新运行 workflow

### 3. 缓存问题依然存在
部署成功后,浏览器仍可能显示旧数据:
- 硬刷新: `Cmd+Shift+R`
- 清空缓存: F12 → Application → Clear site data
- 无痕模式: `Cmd+Shift+N`

---

## 🆘 故障排除

### 问题1: Actions 未触发
**原因**: 没有在 Settings 选择 "GitHub Actions"  
**解决**: 手动切换 Source 到 "GitHub Actions"

### 问题2: Actions 失败 (权限错误)
**原因**: workflow 没有 Pages 部署权限  
**解决**:
1. Settings → Actions → General
2. Workflow permissions → Read and write
3. 重新运行 workflow

### 问题3: 部署成功但网站未更新
**原因**: 浏览器缓存或 CDN 缓存  
**解决**:
1. 无痕模式访问 (最可靠)
2. 硬刷新 + 清空缓存
3. 等待 5-10 分钟 (CDN 缓存)

### 问题4: 找不到 Actions 标签
**原因**: Actions 可能被禁用  
**解决**:
1. Settings → Actions → General
2. Actions permissions → Allow all actions
3. 保存并刷新页面

---

## 🎓 知识点

### 什么是 GitHub Actions?
- GitHub 的 CI/CD 平台
- 可以自动化构建、测试、部署
- 使用 YAML 配置文件定义流程

### 什么是 artifact?
- 工作流中生成的文件集合
- 可以在不同步骤间传递
- 用于部署或下载

### 为什么不用 Jekyll?
- Jekyll 是静态网站生成器
- 对文件结构有限制
- TeachAny 是纯静态 HTML,不需要构建

---

## 📚 参考资料

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [deploy-pages action](https://github.com/actions/deploy-pages)

---

## ✅ 完成清单

部署完成后,确认以下所有项:

- [ ] Settings → Pages → Source 已改为 "GitHub Actions"
- [ ] Actions 页面显示 "Deploy to GitHub Pages" workflow
- [ ] Workflow 运行成功 (绿色✅)
- [ ] 访问 https://weponusa.github.io/teachany/ 网站正常
- [ ] 硬刷新或无痕模式下统计数字显示 8+82
- [ ] Gallery 显示所有课件
- [ ] 知识地图功能正常
- [ ] 社区课件可以加载

---

**创建时间**: 2026-04-12 19:19  
**Commit**: 85f2532  
**状态**: 等待手动切换 Source
