#!/usr/bin/env python3
"""
批量修复知识树中的状态字段
将 "status": "has_course" 统一改为 "status": "active"
"""

import json
import os
from pathlib import Path

def fix_tree_status(tree_file):
    """修复单个树文件的状态字段"""
    print(f"处理: {tree_file.name}")
    
    with open(tree_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    
    # 遍历所有 domains
    for domain in data.get('domains', []):
        # 遍历所有 nodes
        for node in domain.get('nodes', []):
            if node.get('status') == 'has_course':
                node['status'] = 'active'
                fixed_count += 1
                print(f"  ✓ 修复节点: {node.get('id')} - {node.get('name')}")
    
    # 保存修改
    if fixed_count > 0:
        with open(tree_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ 已保存，共修复 {fixed_count} 个节点\n")
    else:
        print(f"  ⏭️  无需修复\n")
    
    return fixed_count

def main():
    # 获取 data/trees/ 目录
    trees_dir = Path(__file__).parent.parent / 'data' / 'trees'
    
    if not trees_dir.exists():
        print(f"❌ 错误：目录不存在 {trees_dir}")
        return
    
    # 处理所有 JSON 文件
    tree_files = list(trees_dir.glob('*.json'))
    
    print(f"🔍 找到 {len(tree_files)} 个知识树文件\n")
    print("=" * 60)
    
    total_fixed = 0
    for tree_file in tree_files:
        fixed = fix_tree_status(tree_file)
        total_fixed += fixed
    
    print("=" * 60)
    print(f"\n✅ 修复完成！")
    print(f"📊 总计修复节点数: {total_fixed}")
    print(f"📂 修复文件数: {len([f for f in tree_files if fix_tree_status(f) > 0])}")

if __name__ == '__main__':
    main()
