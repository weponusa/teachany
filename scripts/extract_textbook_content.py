#!/usr/bin/env python3
"""
从教材 PDF 中提取教学素材，整合到 TeachAny Knowledge Layer

目标：
1. 提取教材的教学方法、风格特点
2. 提取真实场景案例、类比、图像
3. 提取例题、练习题
4. 按知识点分类并映射到现有 _graph.json 节点
5. 生成补充数据文件（不覆盖现有数据）

使用方法：
python3 extract_textbook_content.py --pdf /path/to/textbook.pdf --subject math --output-dir ../data/math/

依赖：
- pdf2image (pip install pdf2image)
- PyPDF2 或 pdfplumber (pip install pdfplumber)
- 或者调用 MinerU API
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any
import subprocess
import tempfile

# MinerU API Token（从环境变量读取）
MINERU_TOKEN = os.getenv("MINERU_TOKEN", "")

def parse_pdf_with_mineru(pdf_path: str, output_dir: str) -> Dict[str, Any]:
    """使用 MinerU API 解析 PDF"""
    print(f"📄 正在使用 MinerU 解析: {pdf_path}")
    
    if not MINERU_TOKEN:
        print("❌ 未找到 MINERU_TOKEN 环境变量")
        print("请设置: export MINERU_TOKEN='your_token'")
        sys.exit(1)
    
    # 调用 MinerU API
    cmd = [
        "python3",
        str(Path(__file__).parent.parent / "mineru-extract" / "scripts" / "mineru_parse_documents.py"),
        "--file-sources", pdf_path,
        "--model-version", "MinerU-Pro",
        "--emit-markdown", "--max-chars", "50000",
        "--output-dir", output_dir
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            output_data = json.loads(result.stdout)
            print(f"✅ MinerU 解析完成")
            return output_data
        else:
            print(f"❌ MinerU 解析失败: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ 调用 MinerU 出错: {e}")
        return None


def extract_teaching_methods(markdown_content: str, subject: str) -> Dict[str, List[str]]:
    """
    从 Markdown 内容中提取教学方法特征
    
    返回：
    {
        "abt_examples": [...],  # ABT 叙事案例
        "analogies": [...],     # 类比/比喻
        "real_world": [...],    # 真实场景
        "visual_cues": [...],   # 图像提示
        "memory_anchors": [...] # 记忆锚点
    }
    """
    methods = {
        "abt_examples": [],
        "analogies": [],
        "real_world": [],
        "visual_cues": [],
        "memory_anchors": []
    }
    
    # TODO: 使用 LLM 或规则提取教学方法
    # 这里需要实现具体的提取逻辑
    
    return methods


def map_to_knowledge_nodes(content: str, subject: str, domain: str) -> List[str]:
    """
    将提取的内容映射到现有知识图谱节点
    
    返回节点 ID 列表
    """
    # 读取现有 _graph.json
    graph_path = Path(__file__).parent.parent / "data" / subject / domain / "_graph.json"
    
    if not graph_path.exists():
        print(f"⚠️  未找到知识图谱: {graph_path}")
        return []
    
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    # 提取所有节点 ID 和名称
    nodes = [(n['id'], n['name']) for n in graph.get('nodes', [])]
    
    # TODO: 使用 LLM 匹配内容到节点
    # 简单实现：关键词匹配
    matched_nodes = []
    for node_id, node_name in nodes:
        if node_name in content:
            matched_nodes.append(node_id)
    
    return matched_nodes


def generate_supplementary_data(
    textbook_data: Dict[str, Any],
    subject: str,
    output_dir: Path
) -> None:
    """
    生成补充数据文件（不覆盖现有文件）
    
    生成文件：
    - {domain}_textbook_methods.json     # 教学方法
    - {domain}_textbook_scenarios.json   # 真实场景案例
    - {domain}_textbook_analogies.json   # 类比集合
    - {domain}_textbook_exercises.json   # 教材习题
    """
    
    print(f"📝 生成补充数据到: {output_dir}")
    
    # 确保输出目录存在
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成教学方法文件
    methods_file = output_dir / f"{subject}_textbook_methods.json"
    if not methods_file.exists():
        methods_data = {
            "source": textbook_data.get("source_file", ""),
            "extraction_date": "2026-04-11",
            "teaching_styles": [],
            "pedagogy_patterns": []
        }
        with open(methods_file, 'w', encoding='utf-8') as f:
            json.dump(methods_data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {methods_file.name}")
    
    # 生成真实场景案例文件
    scenarios_file = output_dir / f"{subject}_textbook_scenarios.json"
    if not scenarios_file.exists():
        scenarios_data = {
            "source": textbook_data.get("source_file", ""),
            "scenarios": []
        }
        with open(scenarios_file, 'w', encoding='utf-8') as f:
            json.dump(scenarios_data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {scenarios_file.name}")
    
    print("✅ 补充数据文件已生成（待填充内容）")


def main():
    parser = argparse.ArgumentParser(description="从教材 PDF 提取教学素材")
    parser.add_argument("--pdf", required=True, help="教材 PDF 路径")
    parser.add_argument("--subject", required=True, choices=[
        "math", "physics", "biology", "chemistry", 
        "geography", "history", "chinese", "english", "info-tech"
    ], help="学科")
    parser.add_argument("--domain", help="领域（如 functions, mechanics 等）")
    parser.add_argument("--output-dir", help="输出目录（默认为 data/{subject}/）")
    
    args = parser.parse_args()
    
    # 确定输出目录
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = Path(__file__).parent.parent / "data" / args.subject
    
    # 创建临时目录存放 MinerU 输出
    with tempfile.TemporaryDirectory() as tmpdir:
        # 解析 PDF
        mineru_output = parse_pdf_with_mineru(args.pdf, tmpdir)
        
        if mineru_output is None:
            print("❌ PDF 解析失败，退出")
            sys.exit(1)
        
        # 提取教学方法
        markdown_content = mineru_output.get("markdown", "")
        teaching_methods = extract_teaching_methods(markdown_content, args.subject)
        
        # 生成补充数据
        textbook_data = {
            "source_file": os.path.basename(args.pdf),
            "subject": args.subject,
            "domain": args.domain,
            "markdown_length": len(markdown_content),
            "teaching_methods": teaching_methods
        }
        
        generate_supplementary_data(textbook_data, args.subject, output_dir)
    
    print(f"\n🎉 教材内容提取完成！")
    print(f"📂 数据保存在: {output_dir}")
    print(f"\n⚠️  注意：当前生成的是数据框架，具体内容需要人工审核和补充")


if __name__ == "__main__":
    main()
