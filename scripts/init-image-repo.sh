#!/bin/bash
# ============================================================
# init-image-repo.sh — 初始化 TeachAny 远程图片仓库
# 
# 功能：将 skill/assets/image-vault/ 下的图片迁移到独立仓库
#       weponusa/teachany-images，通过 jsDelivr CDN 分发
#
# 前置条件：
#   1. 已在 GitHub 创建空仓库 weponusa/teachany-images
#   2. 已配置 SSH 或 HTTPS 推送权限
#
# 用法：bash scripts/init-image-repo.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_VAULT="${PROJECT_ROOT}/skill/assets/image-vault"
TARGET_DIR="${PROJECT_ROOT}/../teachany-images"
REMOTE_REPO="git@github.com:weponusa/teachany-images.git"
GITEE_REPO="git@gitee.com:weponusa/teachany-images.git"

echo "🖼️  TeachAny Image Vault → 远程仓库迁移工具"
echo "============================================"

# 检查源目录
if [ ! -d "$IMAGE_VAULT" ]; then
  echo "❌ 未找到 image-vault 目录: $IMAGE_VAULT"
  exit 1
fi

# 统计图片
FILE_COUNT=$(find "$IMAGE_VAULT" -type f -name "*.png" | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$IMAGE_VAULT" | awk '{print $1}')
echo "📊 发现 ${FILE_COUNT} 张图片，总计 ${TOTAL_SIZE}"

# 创建目标目录
if [ -d "$TARGET_DIR" ]; then
  echo "⚠️  目标目录已存在: $TARGET_DIR"
  echo "   跳过初始化，直接同步文件..."
else
  echo "📁 创建目标仓库目录: $TARGET_DIR"
  mkdir -p "$TARGET_DIR"
  cd "$TARGET_DIR"
  git init
  git remote add origin "$REMOTE_REPO"
  git remote add gitee "$GITEE_REPO" 2>/dev/null || true
fi

cd "$TARGET_DIR"

# 复制图片（保持学科目录结构，去掉 image-vault/ 前缀）
echo "📋 复制图片到目标仓库..."
for subject_dir in "$IMAGE_VAULT"/*/; do
  subject=$(basename "$subject_dir")
  mkdir -p "$TARGET_DIR/$subject"
  cp -v "$subject_dir"*.png "$TARGET_DIR/$subject/" 2>/dev/null || true
done

# 生成 README
cat > "$TARGET_DIR/README.md" << 'EOF'
# TeachAny Image Vault 📚🖼️

TeachAny 教学课件预制图片库。

## 架构说明

本仓库为 [TeachAny](https://github.com/weponusa/teachany) 项目的**图片资源独立仓库**，
通过 jsDelivr CDN 全球加速分发：

```
https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/{subject}/{filename}
```

### 为什么独立存储？

- **Skill 体积最小化**：TeachAny Skill 只携带 `image-registry.json` 索引文件（~50KB），
  不捆绑图片二进制文件，用户安装 Skill 时无需下载数 GB 的图片
- **CDN 加速**：jsDelivr 提供全球边缘节点缓存，任何地区用户秒级获取
- **统一质量管控**：项目维护者集中生成和管理图片，确保风格一致

### 目录结构

```
├── math/          # 数学
├── physics/       # 物理
├── biology/       # 生物
├── chemistry/     # 化学
├── history/       # 历史
├── geography/     # 地理
├── chinese/       # 语文
├── english/       # 英语
└── science/       # 科学
```

### 图片类型

| Slot | 说明 |
|:---|:---|
| `*-hero.png` | 知识结构信息图（Hero 主图） |
| `*-scene.png` | 情境/生活应用场景图 |
| `*-experiment.png` | 实验/观察场景图 |
| `*-concept.png` | 核心概念可视化图 |
| `*-abt-intro.png` | ABT 叙事框架引入图 |

## 使用方式

图片索引维护在 TeachAny 主仓库：
`skill/assets/image-registry.json`

AI 制作课件时按索引从 CDN 按需下载，不需要预先下载整个仓库。

## License

MIT
EOF

# 统计结果
COPIED_COUNT=$(find "$TARGET_DIR" -type f -name "*.png" | wc -l | tr -d ' ')
echo ""
echo "✅ 迁移完成！"
echo "   已复制 ${COPIED_COUNT} 张图片到 ${TARGET_DIR}"
echo ""
echo "📌 下一步操作："
echo "   cd ${TARGET_DIR}"
echo "   git add -A"
echo "   git commit -m 'feat: 初始化 TeachAny 图片仓库（${COPIED_COUNT} 张预制教学插图）'"
echo "   git push -u origin main"
echo "   git push gitee main  # 可选：推送到 Gitee 镜像"
echo ""
echo "🌐 CDN 地址验证（推送后等 1-2 分钟生效）："
echo "   https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/math/quadratic-hero.png"
