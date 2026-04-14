#!/usr/bin/env python3
"""
课件诊断工具
检查课件的完整性、注册一致性、知识树链接等
"""
import json
from pathlib import Path
from collections import defaultdict

def load_registry():
    """加载注册表"""
    with open('registry.json', encoding='utf-8') as f:
        return json.load(f)

def load_trees():
    """加载所有知识树"""
    trees = {}
    for tree_file in Path('data/trees').glob('*.json'):
        with open(tree_file, encoding='utf-8') as f:
            trees[tree_file.stem] = json.load(f)
    return trees

def extract_tree_courses(tree_data):
    """递归提取知识树中的所有课件 ID"""
    courses = []
    
    def extract(node):
        if 'courses' in node and node['courses']:
            courses.extend(node['courses'])
        for key in ['children', 'nodes', 'domains']:
            if key in node:
                for child in node[key]:
                    extract(child)
    
    # 从根节点开始提取
    extract(tree_data)
    
    return courses

def check_course_files(course_id):
    """检查课件文件完整性"""
    course_dir = Path('examples') / course_id
    
    if not course_dir.exists():
        return {'exists': False, 'errors': [f'目录不存在: {course_dir}']}
    
    errors = []
    warnings = []
    
    # 必需文件
    required_files = {
        'manifest.json': '课件元数据',
        'index.html': '课件主页面'
    }
    
    for filename, desc in required_files.items():
        file_path = course_dir / filename
        if not file_path.exists():
            errors.append(f'缺少{desc}: {filename}')
        elif file_path.stat().st_size == 0:
            errors.append(f'{desc}为空: {filename}')
    
    # 检查 manifest.json 格式
    manifest_path = course_dir / 'manifest.json'
    if manifest_path.exists():
        try:
            with open(manifest_path, encoding='utf-8') as f:
                manifest = json.load(f)
            
            # 检查必需字段
            required_fields = ['name', 'subject', 'grade', 'node_id']
            for field in required_fields:
                if field not in manifest:
                    errors.append(f'manifest.json 缺少必需字段: {field}')
            
            # 检查 node_id 是否匹配
            if 'node_id' in manifest:
                # 从课件 ID 推断 node_id
                expected_node_id = course_id.replace(f"{manifest.get('subject', '')[:3]}-", '')
                if manifest['node_id'] != expected_node_id:
                    warnings.append(f'node_id 不匹配: manifest={manifest["node_id"]}, 预期={expected_node_id}')
        
        except json.JSONDecodeError as e:
            errors.append(f'manifest.json 格式错误: {e}')
    
    # 检查 index.html 基本结构
    index_path = course_dir / 'index.html'
    if index_path.exists():
        try:
            content = index_path.read_text(encoding='utf-8')
            if '<html' not in content.lower():
                errors.append('index.html 缺少 <html> 标签')
            if '<body' not in content.lower():
                errors.append('index.html 缺少 <body> 标签')
        except Exception as e:
            errors.append(f'index.html 读取失败: {e}')
    
    return {
        'exists': True,
        'errors': errors,
        'warnings': warnings
    }

def main():
    print("🔍 TeachAny 课件诊断工具\n")
    
    # 加载数据
    print("📦 加载数据...")
    registry = load_registry()
    trees = load_trees()
    
    # 提取所有课件 ID
    registry_courses = {c['id'] for c in registry['courses']}
    tree_courses = set()
    for tree_name, tree_data in trees.items():
        tree_courses.update(extract_tree_courses(tree_data))
    
    existing_courses = set()
    for course_dir in Path('examples').iterdir():
        if course_dir.is_dir() and (course_dir / 'manifest.json').exists():
            existing_courses.add(course_dir.name)
    
    print(f"  注册表课件数: {len(registry_courses)}")
    print(f"  知识树引用数: {len(tree_courses)}")
    print(f"  实际存在数: {len(existing_courses)}")
    print()
    
    # 检查一致性
    print("🔎 检查一致性...")
    
    # 1. 知识树中引用但不在注册表
    not_in_registry = tree_courses - registry_courses
    if not_in_registry:
        print(f"\n❌ 知识树中引用但未注册的课件 ({len(not_in_registry)} 个):")
        for course_id in sorted(not_in_registry):
            print(f"  - {course_id}")
    
    # 2. 注册表中但不在知识树
    not_in_tree = registry_courses - tree_courses
    if not_in_tree:
        print(f"\n⚠️  注册但未被知识树引用的课件 ({len(not_in_tree)} 个):")
        for course_id in sorted(list(not_in_tree)[:10]):
            print(f"  - {course_id}")
        if len(not_in_tree) > 10:
            print(f"  ... 还有 {len(not_in_tree) - 10} 个")
    
    # 3. 引用但文件不存在
    missing_files = (registry_courses | tree_courses) - existing_courses
    if missing_files:
        print(f"\n❌ 引用但文件不存在的课件 ({len(missing_files)} 个):")
        for course_id in sorted(missing_files):
            print(f"  - {course_id}")
    
    # 4. 文件存在但未注册
    unregistered = existing_courses - registry_courses
    if unregistered:
        print(f"\n⚠️  文件存在但未注册的课件 ({len(unregistered)} 个):")
        for course_id in sorted(list(unregistered)[:10]):
            print(f"  - {course_id}")
        if len(unregistered) > 10:
            print(f"  ... 还有 {len(unregistered) - 10} 个")
    
    # 检查特定课件
    print("\n\n🎯 检查问题课件...")
    
    problem_courses = [
        'chn-compound-vowel',  # 复韵母
        'chem-oxidation-reduction',  # 氧化还原
    ]
    
    for course_id in problem_courses:
        print(f"\n{'='*60}")
        print(f"课件: {course_id}")
        print('='*60)
        
        # 检查注册表
        in_registry = course_id in registry_courses
        print(f"✓ 注册表: {'✅ 已注册' if in_registry else '❌ 未注册'}")
        
        # 检查知识树
        in_tree = course_id in tree_courses
        print(f"✓ 知识树: {'✅ 已引用' if in_tree else '❌ 未引用'}")
        
        # 查找在哪些知识树中
        if in_tree:
            for tree_name, tree_data in trees.items():
                courses = extract_tree_courses(tree_data)
                if course_id in courses:
                    print(f"  └─ {tree_name}.json")
        
        # 检查文件
        check_result = check_course_files(course_id)
        print(f"✓ 文件存在: {'✅ 是' if check_result['exists'] else '❌ 否'}")
        
        if check_result['exists']:
            if check_result['errors']:
                print("  ❌ 错误:")
                for error in check_result['errors']:
                    print(f"    - {error}")
            else:
                print("  ✅ 文件完整")
            
            if check_result['warnings']:
                print("  ⚠️  警告:")
                for warning in check_result['warnings']:
                    print(f"    - {warning}")
        
        # 读取 manifest
        manifest_path = Path('examples') / course_id / 'manifest.json'
        if manifest_path.exists():
            with open(manifest_path, encoding='utf-8') as f:
                manifest = json.load(f)
            print(f"✓ 课件名称: {manifest.get('name', '未设置')}")
            print(f"✓ 学科: {manifest.get('subject', '未设置')}")
            print(f"✓ 年级: {manifest.get('grade', '未设置')}")
            print(f"✓ node_id: {manifest.get('node_id', '未设置')}")
    
    print("\n\n✅ 诊断完成！")

if __name__ == '__main__':
    main()
