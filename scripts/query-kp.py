#!/usr/bin/env python3
"""
TeachAny 知识点查询工具

用法:
  python3 scripts/query-kp.py --id kp-math-m-algebra-linear-func
  python3 scripts/query-kp.py --subject math --stage m
  python3 scripts/query-kp.py --course math-linear-function
  python3 scripts/query-kp.py --old-id linear-function
"""
import json
import argparse
from pathlib import Path

def load_index():
    """加载主索引"""
    index_file = Path('data/knowledge-points/index.json')
    if not index_file.exists():
        print('❌ 主索引不存在: data/knowledge-points/index.json')
        print('   请先运行: python3 scripts/build-kp-index.py')
        exit(1)
    
    with open(index_file, encoding='utf-8') as f:
        return json.load(f)['points']

def query_by_id(points, kp_id):
    """按ID查询"""
    for point in points:
        if point['kp_id'] == kp_id:
            return [point]
    return []

def query_by_old_id(points, old_id):
    """按旧ID查询"""
    results = []
    for point in points:
        if point.get('old_node_id') == old_id:
            results.append(point)
    return results

def query_by_subject_stage(points, subject, stage):
    """按学科+学段查询"""
    results = []
    for point in points:
        if (not subject or point['subject'] == subject) and \
           (not stage or point['stage'] == stage):
            results.append(point)
    return results

def query_by_course(points, course_id):
    """查找包含指定课件的知识点"""
    results = []
    for point in points:
        if course_id in point.get('courses', []):
            results.append(point)
    return results

def query_by_name(points, keyword):
    """按名称关键词查询"""
    results = []
    keyword = keyword.lower()
    for point in points:
        name_zh = point.get('name_zh', '').lower()
        name_en = point.get('name_en', '').lower()
        if keyword in name_zh or keyword in name_en:
            results.append(point)
    return results

def print_point(point, verbose=False):
    """打印知识点信息"""
    print(f"\n{'='*70}")
    print(f"ID: {point['kp_id']}")
    print(f"名称: {point['name_zh']}")
    if point.get('name_en'):
        print(f"英文: {point['name_en']}")
    
    stage_name = {'e': '小学', 'm': '初中', 'h': '高中', 'u': '未知'}[point['stage']]
    print(f"学科: {point['subject']} | 学段: {stage_name} | 年级: {point.get('grade', '未知')}")
    print(f"领域: {point.get('domain', '未知')}")
    print(f"状态: {point['status']}")
    
    if verbose:
        print(f"\n旧ID: {point.get('old_node_id', '无')}")
        print(f"来源: {point.get('tree_file', '未知')}")
        
        if point.get('description'):
            print(f"描述: {point['description']}")
        
        if point.get('prerequisites'):
            print(f"\n前置知识点:")
            for prereq in point['prerequisites']:
                print(f"  - {prereq}")
        
        if point.get('extends'):
            print(f"\n扩展知识点:")
            for ext in point['extends']:
                print(f"  - {ext}")
        
        if point.get('courses'):
            print(f"\n课件列表:")
            for course in point['courses']:
                print(f"  - {course}")
    else:
        courses_count = len(point.get('courses', []))
        print(f"课件数: {courses_count}")

def main():
    parser = argparse.ArgumentParser(description='TeachAny 知识点查询工具')
    parser.add_argument('--id', help='知识点ID (kp-xxx)')
    parser.add_argument('--old-id', help='旧节点ID')
    parser.add_argument('--subject', help='学科代码 (math, phy, chem, bio, chn, eng, geo, hist)')
    parser.add_argument('--stage', help='学段代码 (e=小学, m=初中, h=高中)')
    parser.add_argument('--course', help='课件ID')
    parser.add_argument('--name', help='名称关键词')
    parser.add_argument('--verbose', '-v', action='store_true', help='显示详细信息')
    parser.add_argument('--count', type=int, default=20, help='最大结果数（默认20）')
    
    args = parser.parse_args()
    
    # 加载索引
    points = load_index()
    print(f'📚 已加载 {len(points)} 个知识点')
    
    # 查询
    results = []
    
    if args.id:
        results = query_by_id(points, args.id)
    elif args.old_id:
        results = query_by_old_id(points, args.old_id)
    elif args.course:
        results = query_by_course(points, args.course)
    elif args.name:
        results = query_by_name(points, args.name)
    elif args.subject or args.stage:
        results = query_by_subject_stage(points, args.subject, args.stage)
    else:
        print('\n请指定查询条件，使用 --help 查看帮助')
        return 1
    
    # 输出结果
    print(f'\n🔍 找到 {len(results)} 个结果')
    
    if results:
        for i, point in enumerate(results[:args.count]):
            print_point(point, args.verbose)
        
        if len(results) > args.count:
            print(f"\n... 还有 {len(results) - args.count} 个结果未显示")
            print(f"使用 --count {len(results)} 显示全部")
    else:
        print('😅 未找到匹配的知识点')
    
    return 0

if __name__ == '__main__':
    exit(main())
