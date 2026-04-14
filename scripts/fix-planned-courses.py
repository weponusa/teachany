#!/usr/bin/env python3
"""将规划中但未实现的课件标记为 gap"""
import json
from pathlib import Path

def fix_planned_courses():
    """将 bio-grade7-* 和 phy-mid-* 课件标记为 gap"""
    
    problem_patterns = [
        ('biology-middle.json', 'bio-grade7-'),
        ('physics-middle.json', 'phy-mid-')
    ]
    
    total_fixed = 0
    
    for tree_file, prefix in problem_patterns:
        tree_path = Path(f'data/trees/{tree_file}')
        
        if not tree_path.exists():
            print(f"⚠️  跳过: {tree_file}（文件不存在）")
            continue
        
        with open(tree_path, encoding='utf-8') as f:
            tree_data = json.load(f)
        
        fixed_count = 0
        
        def fix_node(node):
            nonlocal fixed_count
            
            if 'courses' in node and node['courses']:
                # 检查是否包含规划课件
                problem_courses = [c for c in node['courses'] if c.startswith(prefix)]
                
                if problem_courses:
                    # 清空 courses 并标记为 gap
                    for course_id in problem_courses:
                        print(f"  ✓ 修复: {course_id} → gap")
                        fixed_count += 1
                    
                    node['courses'] = []
                    node['status'] = 'gap'
            
            # 递归处理子节点
            for key in ['children', 'nodes', 'domains']:
                if key in node:
                    for child in node[key]:
                        fix_node(child)
        
        fix_node(tree_data)
        
        if fixed_count > 0:
            # 保存
            with open(tree_path, 'w', encoding='utf-8') as f:
                json.dump(tree_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ {tree_file}: 修复 {fixed_count} 个节点\n")
            total_fixed += fixed_count
        else:
            print(f"✓ {tree_file}: 无需修复\n")
    
    print(f"{'='*60}")
    print(f"总计修复: {total_fixed} 个规划课件节点")
    print(f"{'='*60}")

if __name__ == '__main__':
    print("🔧 开始修复规划课件...\n")
    fix_planned_courses()
    print("\n✅ 修复完成！")
