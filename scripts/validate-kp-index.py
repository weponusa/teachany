#!/usr/bin/env python3
"""
TeachAny 知识点索引验证工具

验证内容：
1. kp_id 格式是否正确
2. 是否有重复ID
3. 是否按字母顺序排列
4. 关联关系是否有效（prerequisites, courses）
"""
import json
import re
from pathlib import Path

def validate_kp_id_format(kp_id):
    """验证 kp_id 格式"""
    pattern = r'^kp-[a-z0-9-]{2,10}-[emhu]-[a-z0-9-]+-[a-z0-9-]+$'
    return bool(re.match(pattern, kp_id))

def main():
    print('='*70)
    print('TeachAny 知识点索引验证工具')
    print('='*70)
    
    # 加载主索引
    index_file = Path('data/knowledge-points/index.json')
    if not index_file.exists():
        print('\n❌ 主索引文件不存在: data/knowledge-points/index.json')
        print('   请先运行: python3 scripts/build-kp-index.py')
        return 1
    
    with open(index_file, encoding='utf-8') as f:
        index_data = json.load(f)
    
    points = index_data.get('points', [])
    print(f'\n📋 加载主索引: {len(points)} 个知识点')
    
    errors = []
    warnings = []
    
    # 1. 验证格式
    print('\n🔍 验证格式...')
    invalid_format = []
    for i, point in enumerate(points):
        kp_id = point.get('kp_id', '')
        if not validate_kp_id_format(kp_id):
            invalid_format.append((i, kp_id))
    
    if invalid_format:
        print(f'   ❌ {len(invalid_format)} 个知识点ID格式错误:')
        for idx, kp_id in invalid_format[:10]:
            print(f'      [{idx}] {kp_id}')
        errors.append(f'格式错误: {len(invalid_format)} 个')
    else:
        print('   ✅ 所有知识点ID格式正确')
    
    # 2. 检查重复
    print('\n🔍 检查重复...')
    kp_ids = [p.get('kp_id', '') for p in points]
    duplicates = [kp_id for kp_id in set(kp_ids) if kp_ids.count(kp_id) > 1]
    
    if duplicates:
        print(f'   ❌ {len(duplicates)} 个重复ID:')
        for kp_id in duplicates[:10]:
            indices = [i for i, p in enumerate(points) if p.get('kp_id') == kp_id]
            print(f'      {kp_id} (位置: {indices})')
        errors.append(f'重复ID: {len(duplicates)} 个')
    else:
        print('   ✅ 无重复ID')
    
    # 3. 检查排序
    print('\n🔍 检查排序...')
    sorted_ids = sorted(kp_ids)
    unsorted = []
    for i, (actual, expected) in enumerate(zip(kp_ids, sorted_ids)):
        if actual != expected:
            unsorted.append((i, actual, expected))
    
    if unsorted:
        print(f'   ⚠️  {len(unsorted)} 个知识点排序错误:')
        for idx, actual, expected in unsorted[:5]:
            print(f'      [{idx}] 实际: {actual}, 应该: {expected}')
        warnings.append(f'排序错误: {len(unsorted)} 个')
    else:
        print('   ✅ 排序正确')
    
    # 4. 验证关联关系
    print('\n🔍 验证关联关系...')
    node_id_set = {p.get('old_node_id', '') for p in points if p.get('old_node_id')}
    invalid_relations = []
    invalid_courses = []
    relation_fields = ['prerequisites', 'extends', 'parallel']
    
    # 加载课件列表
    course_ids = set()
    for d in Path('examples').iterdir():
        if d.is_dir() and (d / 'manifest.json').exists():
            course_ids.add(d.name)
    
    for point in points:
        kp_id = point.get('kp_id', '')
        
        for field in relation_fields:
            for related in point.get(field, []):
                if related not in node_id_set:
                    invalid_relations.append((kp_id, field, related))
        
        # 检查 courses
        for course in point.get('courses', []):
            if course not in course_ids:
                invalid_courses.append((kp_id, course))
    
    if invalid_relations:
        print(f'   ⚠️  {len(invalid_relations)} 个无效节点关系:')
        for kp_id, field, related in invalid_relations[:5]:
            print(f'      {kp_id} [{field}] → {related} (不存在)')
        warnings.append(f'无效节点关系: {len(invalid_relations)} 个')
    else:
        print('   ✅ 所有节点关系有效')
    
    if invalid_courses:
        print(f'   ⚠️  {len(invalid_courses)} 个无效课件引用:')
        for kp_id, course in invalid_courses[:5]:
            print(f'      {kp_id} → {course} (不存在)')
        warnings.append(f'无效课件: {len(invalid_courses)} 个')
    else:
        print('   ✅ 所有课件引用有效')
    
    # 5. 检查必填字段
    print('\n🔍 检查必填字段...')
    missing_fields = []
    required = ['kp_id', 'name_zh', 'subject', 'stage', 'status']
    
    for i, point in enumerate(points):
        for field in required:
            if not point.get(field):
                missing_fields.append((i, point.get('kp_id', f'[{i}]'), field))
    
    if missing_fields:
        print(f'   ⚠️  {len(missing_fields)} 个字段缺失:')
        for idx, kp_id, field in missing_fields[:5]:
            print(f'      {kp_id}: 缺少 {field}')
        warnings.append(f'缺失字段: {len(missing_fields)} 个')
    else:
        print('   ✅ 所有必填字段完整')
    
    # 总结
    print('\n' + '='*70)
    print('📊 验证结果')
    print('='*70)
    
    if errors:
        print('\n❌ 发现严重错误:')
        for err in errors:
            print(f'   - {err}')
    
    if warnings:
        print('\n⚠️  发现警告:')
        for warn in warnings:
            print(f'   - {warn}')
    
    if not errors and not warnings:
        print('\n✅ 验证通过！主索引完全正确。')
        return 0
    elif not errors:
        print('\n⚠️  验证通过（有警告）')
        return 0
    else:
        print('\n❌ 验证失败，请修复上述错误')
        return 1

if __name__ == '__main__':
    exit(main())
