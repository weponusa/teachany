# 📡 TeachAny 国内镜像站

> **核心原则**：使用 WorkBuddy 一键安装，无需手动下载

---

## 🚀 推荐安装方式（一键安装）

### Gitee 镜像（推荐）⭐⭐⭐⭐⭐

**安装命令**：
```bash
/install-skill https://gitee.com/wepon/teachany-opensource
```

**特点**：
- ✅ 国内高速访问（CDN 加速）
- ✅ 实时同步 GitHub 主仓库
- ✅ 无需翻墙
- ✅ 支持一键安装
- ✅ 支持 Git 克隆和下载

**访问地址**：https://gitee.com/wepon/teachany-opensource

**同步频率**：每次 GitHub 主仓库更新后自动同步（通过 GitHub Actions）

---

## 🌐 备选方案

### GitHub 官方仓库

**安装命令**：
```bash
/install-skill https://github.com/wepon/teachany-opensource
```

**特点**：
- ✅ 官方主仓库
- ✅ 支持一键安装
- ⚠️ 国内需要翻墙

**访问地址**：https://github.com/wepon/teachany-opensource

---

## 📊 镜像对比

| 镜像站 | 推荐指数 | 访问速度 | 需要翻墙 | 更新频率 | 支持一键安装 |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Gitee** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ 快 | ❌ 否 | 实时同步 | ✅ 是 |
| GitHub | ⭐⭐⭐ | 🐌 慢 | ✅ 是 | - | ✅ 是 |

---

## 🔄 手动下载（备选）

如果无法使用 WorkBuddy 一键安装，可以手动下载：

### 从 Gitee 下载
```bash
# 克隆仓库
git clone https://gitee.com/wepon/teachany-opensource.git

# 或下载 ZIP
curl -L https://gitee.com/wepon/teachany-opensource/repository/archive/main.zip -o teachany.zip
```

### 从 GitHub 下载（需要翻墙）
```bash
# 克隆仓库
git clone https://github.com/wepon/teachany-opensource.git

# 或下载 ZIP
curl -L https://github.com/wepon/teachany-opensource/archive/refs/heads/main.zip -o teachany.zip
```

---

## 📋 版本历史

| 版本 | 发布日期 | 更新内容 | 文件大小 |
|:---|:---:|:---|:---:|
| **v1.1** | 2026-04-14 | 新增人文学科数据（历史、地理、语文） | ~50MB |
| v1.0 | 2026-04-13 | 初始版本（数学、物理、化学、生物） | ~30MB |

---

## 🆘 常见问题

### Q1: Gitee 镜像与 GitHub 主仓库的内容一致吗？

✅ **一致**。Gitee 镜像通过 GitHub Actions 自动同步，确保内容实时一致。

### Q2: 如何验证 Gitee 镜像是否是最新版本？

访问 Gitee 仓库页面，查看最后提交时间：
- Gitee: https://gitee.com/wepon/teachany-opensource/commits/main
- GitHub: https://github.com/wepon/teachany-opensource/commits/main

两者的最新提交应该是同一个。

### Q3: 如何切换镜像源？

WorkBuddy 一键安装会自动选择最快的源，无需手动切换。

如果需要手动切换：
```bash
# 卸载旧版本
/uninstall-skill teachany

# 安装新镜像版本
/install-skill https://gitee.com/wepon/teachany-opensource
```

### Q4: 如何获取更新？

重新运行安装命令即可：
```bash
/install-skill https://gitee.com/wepon/teachany-opensource
```

WorkBuddy 会自动检测到已安装，并更新到最新版本。

---

## 📞 技术支持

### 反馈渠道
- **Gitee Issues**：https://gitee.com/wepon/teachany-opensource/issues
- **GitHub Issues**：https://github.com/wepon/teachany-opensource/issues
- **微信交流群**：[扫码加入]
- **QQ群**：待创建

### 镜像问题反馈
如果发现 Gitee 镜像同步延迟或内容不一致，请：
1. 提交 Issue 到 Gitee 仓库
2. 或发送邮件至：support@teachany.cn

---

## 🔐 安全性说明

### 镜像可信度
- ✅ Gitee 镜像由官方维护，通过 GitHub Actions 自动同步
- ✅ 所有提交都有 GPG 签名验证
- ✅ 代码开源，可审计

### 数据隐私
- ✅ TeachAny 不收集任何用户数据
- ✅ 所有教学数据本地存储
- ✅ 不依赖云端服务

---

## 🌟 贡献镜像站

如果您愿意提供镜像服务（如阿里云 OSS、腾讯云 COS 等），欢迎联系我们：
- 邮箱：mirrors@teachany.cn
- GitHub PR：https://github.com/wepon/teachany-opensource/pulls

---

**最后更新**：2026-04-14  
**当前版本**：v1.1（含人文学科数据）
