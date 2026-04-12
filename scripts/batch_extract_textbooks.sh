#!/bin/bash
# 分批提取教材 PDF 内容并整合到 TeachAny Knowledge Layer
# 
# 策略：将大型 PDF 拆分为小块，逐块提取，避免内存溢出
#
# 依赖：
# - pdftk 或 qpdf（用于拆分 PDF）
# - MinerU API Token（存储在环境变量 MINERU_TOKEN）
#
# 使用方法：
# export MINERU_TOKEN="your_token_here"
# ./batch_extract_textbooks.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
WORKSPACE_ROOT="/Users/wepon/CodeBuddy/一次函数"
TEXTBOOK_DIR="$WORKSPACE_ROOT"
OUTPUT_DIR="$WORKSPACE_ROOT/teachany-opensource/data/textbook-supplements"
TEMP_DIR="/tmp/teachany-textbook-extraction"

# 创建临时目录
mkdir -p "$TEMP_DIR"

echo -e "${GREEN}📚 TeachAny 教材内容提取工具${NC}"
echo "============================================"

# 检查 MinerU Token
if [ -z "$MINERU_TOKEN" ]; then
    echo -e "${RED}❌ 未设置 MINERU_TOKEN 环境变量${NC}"
    echo "请运行: export MINERU_TOKEN='your_token'"
    exit 1
fi

# 检查 PDF 拆分工具
if command -v qpdf &> /dev/null; then
    PDF_SPLIT_CMD="qpdf"
    echo -e "${GREEN}✅ 使用 qpdf 拆分 PDF${NC}"
elif command -v pdftk &> /dev/null; then
    PDF_SPLIT_CMD="pdftk"
    echo -e "${GREEN}✅ 使用 pdftk 拆分 PDF${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 PDF 拆分工具，将尝试直接处理${NC}"
    PDF_SPLIT_CMD="none"
fi

# 定义教材列表
declare -A TEXTBOOKS
TEXTBOOKS["math"]="01_mathematics_all_around.pdf"
TEXTBOOKS["physics"]="02_physics_everyday_phenomena.pdf"
TEXTBOOKS["biology"]="04_biology_life_on_earth.pdf"

# 定义每本书的关键章节范围（避免处理整本书）
declare -A MATH_RANGES
MATH_RANGES["functions"]="200-300"      # 函数章节
MATH_RANGES["geometry"]="400-500"       # 几何章节
MATH_RANGES["statistics"]="600-700"     # 统计章节

declare -A PHYSICS_RANGES
PHYSICS_RANGES["mechanics"]="100-200"   # 力学章节
PHYSICS_RANGES["optics"]="300-400"      # 光学章节
PHYSICS_RANGES["electricity"]="500-600" # 电学章节

declare -A BIOLOGY_RANGES
BIOLOGY_RANGES["cells"]="50-150"        # 细胞章节
BIOLOGY_RANGES["ecology"]="300-400"     # 生态章节
BIOLOGY_RANGES["genetics"]="200-300"    # 遗传章节

# 函数：拆分 PDF
split_pdf() {
    local input_pdf="$1"
    local start_page="$2"
    local end_page="$3"
    local output_pdf="$4"
    
    echo -e "${YELLOW}📄 正在提取 pages $start_page-$end_page...${NC}"
    
    if [ "$PDF_SPLIT_CMD" = "qpdf" ]; then
        qpdf --pages "$input_pdf" "$start_page-$end_page" -- --empty --pages "$input_pdf" "$start_page-$end_page" -- "$output_pdf"
    elif [ "$PDF_SPLIT_CMD" = "pdftk" ]; then
        pdftk "$input_pdf" cat "$start_page-$end_page" output "$output_pdf"
    else
        echo -e "${RED}❌ 无法拆分 PDF${NC}"
        return 1
    fi
}

# 函数：调用 MinerU 解析 PDF
parse_with_mineru() {
    local pdf_file="$1"
    local output_dir="$2"
    
    echo -e "${YELLOW}🔍 正在调用 MinerU 解析...${NC}"
    
    python3 "$WORKSPACE_ROOT/teachany-opensource/scripts/extract_textbook_content.py" \
        --pdf "$pdf_file" \
        --subject "${3:-math}" \
        --output-dir "$output_dir"
}

# 主流程
main() {
    echo ""
    echo -e "${GREEN}=== Phase 1: 数学教材 (Mathematics All Around) ===${NC}"
    
    MATH_PDF="$TEXTBOOK_DIR/${TEXTBOOKS[math]}"
    
    if [ ! -f "$MATH_PDF" ]; then
        echo -e "${RED}❌ 未找到文件: $MATH_PDF${NC}"
    else
        echo -e "${GREEN}✅ 找到数学教材 (117.81MB)${NC}"
        
        # 提取函数章节
        echo ""
        echo "🔸 提取函数章节 (pages 200-300)..."
        MATH_FUNCTIONS_PDF="$TEMP_DIR/math_functions.pdf"
        
        if split_pdf "$MATH_PDF" 200 300 "$MATH_FUNCTIONS_PDF"; then
            parse_with_mineru "$MATH_FUNCTIONS_PDF" "$OUTPUT_DIR/math" "math"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}=== Phase 2: 物理教材 (Physics: Everyday Phenomena) ===${NC}"
    
    PHYSICS_PDF="$TEXTBOOK_DIR/${TEXTBOOKS[physics]}"
    
    if [ ! -f "$PHYSICS_PDF" ]; then
        echo -e "${RED}❌ 未找到文件: $PHYSICS_PDF${NC}"
    else
        echo -e "${GREEN}✅ 找到物理教材 (66.90MB)${NC}"
        echo -e "${YELLOW}⏸️  暂时跳过（先完成数学教材）${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}=== Phase 3: 生物教材 (Biology: Life on Earth) ===${NC}"
    
    BIOLOGY_PDF="$TEXTBOOK_DIR/${TEXTBOOKS[biology]}"
    
    if [ ! -f "$BIOLOGY_PDF" ]; then
        echo -e "${RED}❌ 未找到文件: $BIOLOGY_PDF${NC}"
    else
        echo -e "${GREEN}✅ 找到生物教材 (48.72MB)${NC}"
        echo -e "${YELLOW}⏸️  暂时跳过（先完成数学教材）${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}✅ 批量提取完成${NC}"
    echo ""
    echo "📂 提取结果保存在: $OUTPUT_DIR"
    echo "🗑️  临时文件: $TEMP_DIR（可手动删除）"
    echo ""
    echo "⚠️  注意："
    echo "  1. 提取的内容需要人工审核和整理"
    echo "  2. 需要将内容映射到 _graph.json 的节点 ID"
    echo "  3. 图像需要单独提取并存储"
}

# 执行主流程
main

# 清理（可选）
# rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 Done!${NC}"
