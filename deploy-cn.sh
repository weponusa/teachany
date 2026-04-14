#!/bin/bash
# TeachAny 国内分发自动化脚本
# 用途：同步到 Gitee 镜像

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  TeachAny 国内分发脚本 v1.1"
echo "=========================================="

# 配置项
GITEE_REMOTE="gitee"
GITEE_URL="https://gitee.com/weponusa/teachany.git"
VERSION=$(date +%Y.%m.%d)

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1：检查 Git 状态
echo -e "${YELLOW}[1/4] 检查 Git 状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}错误：工作区有未提交的更改，请先提交或储藏${NC}"
    git status --short
    exit 1
fi
echo -e "${GREEN}✓ Git 工作区干净${NC}"

# 步骤2：添加 Gitee 远程仓库（如果不存在）
echo -e "${YELLOW}[2/4] 配置 Gitee 远程仓库...${NC}"
if ! git remote | grep -q "^${GITEE_REMOTE}$"; then
    echo "添加 Gitee 远程仓库..."
    git remote add ${GITEE_REMOTE} ${GITEE_URL}
    echo -e "${GREEN}✓ Gitee 远程仓库已添加${NC}"
else
    echo -e "${GREEN}✓ Gitee 远程仓库已存在${NC}"
fi

# 步骤3：推送到 GitHub（主仓库）
echo -e "${YELLOW}[3/4] 推送到 GitHub...${NC}"
git push origin main --tags
echo -e "${GREEN}✓ 已推送到 GitHub${NC}"

# 步骤4：同步到 Gitee（国内镜像）
echo -e "${YELLOW}[4/4] 同步到 Gitee 镜像...${NC}"
git push ${GITEE_REMOTE} main --tags --force
echo -e "${GREEN}✓ 已同步到 Gitee（国内可访问）${NC}"

# 部署完成报告
echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "📦 分发渠道："
echo "  1. GitHub（国际）："
echo "     https://github.com/wepon/teachany-opensource"
echo ""
echo "  2. Gitee（国内镜像，推荐）："
echo "     https://gitee.com/weponusa/teachany"
echo ""
echo "📝 一键安装命令："
echo "  国内用户："
echo "  /install-skill https://gitee.com/weponusa/teachany"
echo ""
echo "  国际用户："
echo "  /install-skill https://github.com/wepon/teachany-opensource"
echo ""
echo "📣 分享到："
echo "  - 微信群/QQ群"
echo "  - 朋友圈"
echo "  - 教师论坛"
echo ""
echo "🎉 版本：${VERSION}"
echo "=========================================="

