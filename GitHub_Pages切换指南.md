# GitHub Pages 部署方式切换指南

## 当前状态

- ✅ GitHub Actions workflow 文件已创建 (`.github/workflows/deploy-pages.yml`)
- ✅ `.nojekyll` 文件已添加
- ⏳ **需要手动切换部署源**

## 为什么需要切换?

从 v2.1 版本开始,所有部署都失败了,原因是 GitHub 的 legacy Jekyll 构建器无法处理新的文件结构。切换到 GitHub Actions 可以解决这个问题。

## 切换步骤

### 方法1: 通过网页界面 (推荐)

1. 打开仓库设置页面:
   ```
   https://github.com/weponusa/teachany/settings/pages
   ```

2. 找到 **Source** 下拉菜单

3. **当前值**: `Deploy from a branch`

4. **改为**: `GitHub Actions`

5. 点击页面上的 **Save** 按钮(如果有)

### 方法2: 通过仓库主页

1. 访问: https://github.com/weponusa/teachany

2. 点击右上角的 **Settings** 标签

3. 左侧菜单找到 **Pages**

4. 在 **Build and deployment** 区域:
   - **Source**: 从下拉菜单选择 `GitHub Actions`

5. 保存更改

## 验证切换成功

切换后,以下任一情况表示成功:

### 验证1: 通过 API 检查
```bash
gh api repos/weponusa/teachany/pages --jq '.build_type'
```
**期望输出**: `workflow`

### 验证2: 查看 Actions 运行
访问: https://github.com/weponusa/teachany/actions

应该看到新的 "Deploy to GitHub Pages" workflow 自动触发并成功完成(绿色✓)

### 验证3: 检查部署历史
在 Pages 设置页面下方,应该看到:
- **Latest deployment**: 来自 GitHub Actions
- **状态**: Success (绿色✓)

## 常见问题

### Q: 切换后为什么还是失败?

A: 可能需要手动触发一次部署:
```bash
# 创建一个空提交触发 Actions
git commit --allow-empty -m "Trigger GitHub Actions deployment"
git push origin main
```

### Q: 看不到 "GitHub Actions" 选项?

A: 需要确保:
1. 仓库中存在 `.github/workflows/deploy-pages.yml` 文件 ✅
2. 文件已推送到 main 分支 ✅
3. 刷新页面,等待几秒钟让 GitHub 识别 workflow

### Q: 如何确认 workflow 文件正确?

A: 检查文件内容:
```bash
cat .github/workflows/deploy-pages.yml
```

应包含:
- `name: Deploy to GitHub Pages`
- `permissions: pages: write`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`

## 预期结果

切换成功后:
- ✅ 网站会在 1-2 分钟内自动更新
- ✅ 统计数字显示为 "8 官方课件 + 82 社区课件"
- ✅ 复韵母课件出现在官方课件区域
- ✅ 未来每次 push 都会自动部署

## 当前已知状态

```
最后一次 push: 2026-04-12 11:20 (Commit: 85f2532)
部署状态: errored (仍在使用 branch 模式)
API 返回: {"source":{"branch":"main","path":"/"}}
需要改为: {"build_type":"workflow"}
```

---

**下一步行动**: 请访问 Settings → Pages,将 Source 从 "Deploy from a branch" 改为 "GitHub Actions"
