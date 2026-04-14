#!/bin/bash
# TeachAny 一键自动安装脚本（国内版）
# 适用系统：macOS/Linux
# 用途：自动从 Gitee 下载并安装到 CodeBuddy

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置项
GITEE_URL="https://gitee.com/weponusa/teachany.git"
INSTALL_DIR="$HOME/.agents/skills/teachany-opensource"
TEMP_DIR="/tmp/teachany-install-$$"

# 打印带颜色的标题
print_header() {
    echo ""
    echo -e "${BLUE}=========================================="
    echo -e "  TeachAny 一键安装脚本（国内版）"
    echo -e "==========================================${NC}"
    echo ""
}

# 打印步骤
print_step() {
    echo -e "${YELLOW}[$1] $2...${NC}"
}

# 打印成功
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 打印错误
print_error() {
    echo -e "${RED}✗ 错误：$1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "未找到 $1 命令，请先安装"
        echo "  macOS: brew install $1"
        echo "  Ubuntu/Debian: sudo apt install $1"
        echo "  CentOS/RHEL: sudo yum install $1"
        exit 1
    fi
}

# 主函数
main() {
    print_header
    
    # 步骤1：检查依赖
    print_step "1/5" "检查系统依赖"
    check_command git
    check_command curl
    print_success "系统依赖检查通过"
    
    # 步骤2：创建临时目录
    print_step "2/5" "准备安装环境"
    mkdir -p "${TEMP_DIR}"
    print_success "临时目录已创建：${TEMP_DIR}"
    
    # 步骤3：从 Gitee 克隆代码
    print_step "3/5" "从 Gitee 下载代码（国内高速）"
    cd "${TEMP_DIR}"
    
    # 尝试浅克隆（更快）
    if git clone --depth 1 "${GITEE_URL}" teachany-opensource; then
        print_success "代码下载成功"
    else
        print_error "从 Gitee 下载失败"
        echo "正在尝试备用下载方式..."
        
        # 备用：直接下载 ZIP
        curl -L "https://gitee.com/weponusa/teachany/repository/archive/main.zip" -o teachany.zip
        unzip -q teachany.zip
        mv teachany-opensource-main teachany-opensource
        print_success "使用备用方式下载成功"
    fi
    
    # 步骤4：安装到 CodeBuddy
    print_step "4/5" "安装到 CodeBuddy Skills 目录"
    
    # 创建 Skills 目录（如果不存在）
    mkdir -p "$(dirname ${INSTALL_DIR})"
    
    # 如果已存在旧版本，备份
    if [ -d "${INSTALL_DIR}" ]; then
        BACKUP_DIR="${INSTALL_DIR}.backup.$(date +%Y%m%d%H%M%S)"
        mv "${INSTALL_DIR}" "${BACKUP_DIR}"
        print_success "已备份旧版本到：${BACKUP_DIR}"
    fi
    
    # 复制文件
    cp -r "${TEMP_DIR}/teachany-opensource" "${INSTALL_DIR}"
    print_success "已安装到：${INSTALL_DIR}"
    
    # 步骤5：清理临时文件
    print_step "5/5" "清理临时文件"
    rm -rf "${TEMP_DIR}"
    print_success "临时文件已清理"
    
    # 安装完成
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "  ✨ 安装完成！"
    echo -e "==========================================${NC}"
    echo ""
    echo "📂 安装位置：${INSTALL_DIR}"
    echo ""
    echo "📚 包含的教学数据："
    echo "  - 数学、物理、化学、生物（理科）"
    echo "  - 历史、地理、语文（人文学科）"
    echo "  - 共 178+ 条高质量教学素材"
    echo ""
    echo "🚀 下一步："
    echo "  1. 打开 CodeBuddy 应用"
    echo "  2. 在设置中刷新 Skills 列表"
    echo "  3. 输入 /teachany 开始使用"
    echo ""
    echo "📖 使用教程："
    echo "  ${INSTALL_DIR}/INSTALL_CN.md"
    echo ""
    echo "❓ 遇到问题？"
    echo "  - Gitee Issues: https://gitee.com/weponusa/teachany/issues"
    echo "  - 微信交流群：[扫码加入]"
    echo ""
}

# 执行主函数
main
