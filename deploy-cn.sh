#!/bin/bash
# TeachAny 国内分发自动化脚本
# 用途：同步到 Gitee + 生成压缩包 + 上传到 CDN

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  TeachAny 国内分发脚本 v1.0"
echo "=========================================="

# 配置项
GITEE_REMOTE="gitee"
GITEE_URL="https://gitee.com/wepon/teachany-opensource.git"
VERSION=$(date +%Y.%m.%d)
PACKAGE_NAME="TeachAny-完整版-${VERSION}.zip"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1：检查 Git 状态
echo -e "${YELLOW}[1/5] 检查 Git 状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}错误：工作区有未提交的更改，请先提交或储藏${NC}"
    git status --short
    exit 1
fi
echo -e "${GREEN}✓ Git 工作区干净${NC}"

# 步骤2：添加 Gitee 远程仓库（如果不存在）
echo -e "${YELLOW}[2/5] 配置 Gitee 远程仓库...${NC}"
if ! git remote | grep -q "^${GITEE_REMOTE}$"; then
    echo "添加 Gitee 远程仓库..."
    git remote add ${GITEE_REMOTE} ${GITEE_URL}
    echo -e "${GREEN}✓ Gitee 远程仓库已添加${NC}"
else
    echo -e "${GREEN}✓ Gitee 远程仓库已存在${NC}"
fi

# 步骤3：推送到 GitHub（主仓库）
echo -e "${YELLOW}[3/5] 推送到 GitHub...${NC}"
git push origin main --tags
echo -e "${GREEN}✓ 已推送到 GitHub${NC}"

# 步骤4：同步到 Gitee（国内镜像）
echo -e "${YELLOW}[4/5] 同步到 Gitee 镜像...${NC}"
git push ${GITEE_REMOTE} main --tags --force
echo -e "${GREEN}✓ 已同步到 Gitee（国内可访问）${NC}"

# 步骤5：生成压缩包（用于百度网盘分发）
echo -e "${YELLOW}[5/5] 生成压缩包...${NC}"

# 创建临时目录
TEMP_DIR="teachany-opensource"
if [ -d "${TEMP_DIR}" ]; then
    rm -rf "${TEMP_DIR}"
fi

# 导出干净的代码（不包含 .git）
git archive --format=tar HEAD | tar -x -C .
mv teachany-opensource "${TEMP_DIR}" 2>/dev/null || true

# 打包（排除不必要的文件）
zip -r "${PACKAGE_NAME}" "${TEMP_DIR}" \
    -x "${TEMP_DIR}/.git/*" \
    -x "${TEMP_DIR}/.github/*" \
    -x "${TEMP_DIR}/node_modules/*" \
    -x "${TEMP_DIR}/.DS_Store" \
    -x "${TEMP_DIR}/*.log"

# 清理临时目录
rm -rf "${TEMP_DIR}"

# 显示压缩包信息
PACKAGE_SIZE=$(du -h "${PACKAGE_NAME}" | cut -f1)
echo -e "${GREEN}✓ 压缩包生成成功${NC}"
echo "  - 文件名：${PACKAGE_NAME}"
echo "  - 大小：${PACKAGE_SIZE}"
echo "  - 位置：$(pwd)/${PACKAGE_NAME}"

# 步骤6：生成部署报告
echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "📦 分发渠道："
echo "  1. GitHub（国际）："
echo "     https://github.com/wepon/teachany-opensource"
echo ""
echo "  2. Gitee（国内）："
echo "     https://gitee.com/wepon/teachany-opensource"
echo ""
echo "  3. 压缩包（百度网盘）："
echo "     ${PACKAGE_NAME} (${PACKAGE_SIZE})"
echo "     请手动上传到百度网盘"
echo ""
echo "📝 下一步："
echo "  1. 将 ${PACKAGE_NAME} 上传到百度网盘"
echo "  2. 更新 INSTALL_CN.md 中的下载链接和提取码"
echo "  3. 在微信群/QQ群通知更新"
echo ""
echo "🎉 版本：${VERSION}"
echo "=========================================="
