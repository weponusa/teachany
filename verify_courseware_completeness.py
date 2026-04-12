#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
课件完整性验证脚本
检查原来 89 个课件是否都还在（官方 7 个 + 社区 82 个）
"""

import json
from pathlib import Path

def load_json(filepath):
    """加载 JSON 文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def verify_completeness():
    """验证课件完整性"""
    
    # 加载文件
    backup_file = Path('courseware-registry-backup-20260412.json')
    official_file = Path('courseware-registry.json')
    community_file = Path('community/index.json')
    
    print("=" * 80)
    print("TeachAny 课件完整性验证报告")
    print("=" * 80)
    print()
    
    # 1. 读取备份注册表（原始 89 个课件）
    backup_data = load_json(backup_file)
    backup_courses = {c['id']: c for c in backup_data['courses']}
    print(f"📦 备份注册表（v1.0）：{len(backup_courses)} 个课件")
    
    # 2. 读取当前官方注册表（保留的 7 个课件）
    official_data = load_json(official_file)
    official_courses = {c['id']: c for c in official_data['courses']}
    print(f"✅ 官方注册表（v2.1）：{len(official_courses)} 个课件")
    
    # 3. 读取社区课件索引（降级的 82 个课件）
    community_data = load_json(community_file)
    community_courses = {c['id']: c for c in community_data['courses']}
    print(f"🌐 社区课件索引（v1.0）：{len(community_courses)} 个课件")
    
    print()
    print("-" * 80)
    print("数学验证")
    print("-" * 80)
    print(f"原始课件总数：{len(backup_courses)}")
    print(f"官方保留课件：{len(official_courses)}")
    print(f"社区降级课件：{len(community_courses)}")
    print(f"当前总课件数：{len(official_courses) + len(community_courses)}")
    print()
    
    # 验证算术
    expected_community = len(backup_courses) - len(official_courses)
    if len(community_courses) == expected_community:
        print(f"✅ 算术验证通过：{len(backup_courses)} - {len(official_courses)} = {len(community_courses)}")
    else:
        print(f"❌ 算术验证失败：期望社区课件 {expected_community} 个，实际 {len(community_courses)} 个")
    
    print()
    print("-" * 80)
    print("课件完整性检查")
    print("-" * 80)
    
    # 4. 检查每个原课件是否还在
    missing_courses = []
    duplicate_courses = []
    
    for course_id, course in backup_courses.items():
        in_official = course_id in official_courses
        in_community = course_id in community_courses
        
        if not in_official and not in_community:
            missing_courses.append(course)
            print(f"❌ 丢失：{course_id} - {course.get('name', 'Unknown')}")
        
        if in_official and in_community:
            duplicate_courses.append(course)
            print(f"⚠️  重复：{course_id} 同时存在于官方和社区")
    
    if not missing_courses and not duplicate_courses:
        print("✅ 所有课件都正确归档，无丢失，无重复")
    
    print()
    print("-" * 80)
    print("保留的官方课件（7 个）")
    print("-" * 80)
    
    retained_courses = [
        "math-quadratic-function",      # 一元二次函数
        "math-linear-function",         # 一次函数
        "bio-photosynthesis",           # 光合作用
        "imperial-unification",         # 秦汉统一多民族国家
        "teachany-phy-mid-pressure",    # 压强
        "geo-monsoon",                  # 全球季风系统
        "chem-periodic-table"           # 元素周期表
    ]
    
    for idx, course_id in enumerate(retained_courses, 1):
        if course_id in official_courses:
            course = official_courses[course_id]
            print(f"{idx}. ✅ {course.get('name', course_id)} ({course.get('subject', '?')} Grade {course.get('grade', '?')})")
        else:
            print(f"{idx}. ❌ {course_id} 不在官方注册表中")
    
    print()
    print("-" * 80)
    print("节点规范性检查（可能被排除的课件）")
    print("-" * 80)
    
    # 检查哪些课件可能因为节点问题被排除
    courses_without_node = []
    for course_id, course in backup_courses.items():
        if not course.get('node_id'):
            courses_without_node.append(course)
    
    if courses_without_node:
        print(f"⚠️  发现 {len(courses_without_node)} 个课件没有 node_id：")
        for course in courses_without_node:
            print(f"   - {course['id']}: {course.get('name', 'Unknown')}")
    else:
        print("✅ 所有课件都有有效的 node_id")
    
    print()
    print("-" * 80)
    print("社区课件分布统计")
    print("-" * 80)
    
    # 统计社区课件学科分布
    subject_count = {}
    for course in community_courses.values():
        subject = course.get('subject', 'unknown')
        subject_count[subject] = subject_count.get(subject, 0) + 1
    
    subject_names = {
        'math': '数学 Math',
        'biology': '生物 Biology',
        'physics': '物理 Physics',
        'chemistry': '化学 Chemistry',
        'geography': '地理 Geography',
        'history': '历史 History'
    }
    
    for subject, count in sorted(subject_count.items(), key=lambda x: -x[1]):
        name = subject_names.get(subject, subject)
        percentage = (count / len(community_courses)) * 100
        print(f"{name}: {count} 个 ({percentage:.1f}%)")
    
    print()
    print("=" * 80)
    print("验证总结")
    print("=" * 80)
    
    if missing_courses:
        print(f"❌ 发现 {len(missing_courses)} 个课件丢失")
        return False
    
    if duplicate_courses:
        print(f"⚠️  发现 {len(duplicate_courses)} 个课件重复")
        return False
    
    if len(community_courses) != expected_community:
        print(f"❌ 社区课件数量不符：期望 {expected_community}，实际 {len(community_courses)}")
        return False
    
    print("✅ 验证通过！所有课件完整，无丢失，无重复")
    print(f"✅ 官方课件：{len(official_courses)} 个")
    print(f"✅ 社区课件：{len(community_courses)} 个")
    print(f"✅ 总计：{len(official_courses) + len(community_courses)} 个")
    
    return True

if __name__ == '__main__':
    try:
        success = verify_completeness()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ 验证过程出错：{str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
