#!/usr/bin/env python3
"""
TeachAny 课件索引重建工具

原则：以实际存在的课件文件为唯一信源（single source of truth）
1. 扫描 examples/ 下所有课件
2. 读取每个课件的 manifest.json
3. 根据 manifest 中的 subject + node_id 反查知识树
4. 修复知识树中的 courses 数组和 status
5. 清理重复节点
6. 重建 registry.json
"""
import json
from pathlib import Path
from collections import defaultdict
import copy

def scan_courses():
    """扫描所有实际存在的课件"""
    courses = {}
    for d in Path('examples').iterdir():
        if not d.is_dir() or d.name.startswith('_'):
            continue
        manifest_path = d / 'manifest.json'
        index_path = d / 'index.html'
        if manifest_path.exists() and index_path.exists():
            try:
                with open(manifest_path, encoding='utf-8') as f:
                    manifest = json.load(f)
                courses[d.name] = manifest
            except json.JSONDecodeError:
                print(f"  ⚠️  {d.name}: manifest.json 格式错误，跳过")
    return courses


def load_tree(tree_file):
    """加载知识树"""
    with open(tree_file, encoding='utf-8') as f:
        return json.load(f)


def save_tree(tree_file, tree_data):
    """保存知识树"""
    with open(tree_file, 'w', encoding='utf-8') as f:
        json.dump(tree_data, f, ensure_ascii=False, indent=2)
    f.close()
    # 确保结尾换行
    with open(tree_file, 'a') as f:
        f.write('\n')


def deduplicate_nodes(nodes_list):
    """去重节点列表（按 id 去重，保留最完整的那个）"""
    seen = {}
    for node in nodes_list:
        nid = node.get('id', '')
        if nid not in seen:
            seen[nid] = node
        else:
            # 保留有 courses 的版本
            existing = seen[nid]
            if not existing.get('courses') and node.get('courses'):
                seen[nid] = node
            elif existing.get('courses') and node.get('courses'):
                # 合并 courses
                merged = list(set(existing['courses'] + node['courses']))
                seen[nid]['courses'] = merged
    return list(seen.values())


def subject_to_tree_prefix(subject):
    """从学科名映射到知识树文件前缀"""
    mapping = {
        'math': ['math-elementary', 'math-middle', 'math-high'],
        'physics': ['physics-middle', 'physics-high'],
        'chemistry': ['chemistry-middle', 'chemistry-high'],
        'biology': ['biology-middle', 'biology-high'],
        'chinese': ['chinese-elementary', 'chinese-middle', 'chinese-high'],
        'english': ['english-elementary', 'english-middle', 'english-high'],
        'geography': ['geography-high'],
        'earth_science': ['earth-science-middle'],
    }
    return mapping.get(subject, [])


def grade_to_stage(grade):
    """从年级推断学段"""
    if grade <= 6:
        return 'elementary'
    elif grade <= 9:
        return 'middle'
    else:
        return 'high'


def main():
    print('='*70)
    print('TeachAny 课件索引重建工具')
    print('='*70)

    # 1. 扫描课件
    print('\n📦 步骤1: 扫描课件文件...')
    courses = scan_courses()
    print(f'   找到 {len(courses)} 个完整课件')

    # 2. 建立课件→知识节点的映射
    print('\n🔗 步骤2: 建立课件→知识节点映射...')
    # 按 (subject, node_id) 分组
    node_courses = defaultdict(list)  # (subject, node_id) -> [course_id]
    for course_id, manifest in courses.items():
        subject = manifest.get('subject', '')
        node_id = manifest.get('node_id', '')
        if subject and node_id:
            node_courses[(subject, node_id)].append(course_id)
        else:
            print(f'  ⚠️  {course_id}: 缺少 subject 或 node_id')

    print(f'   {len(node_courses)} 个知识节点有课件')

    # 3. 修复知识树
    print('\n🌳 步骤3: 修复知识树...')
    tree_files = list(Path('data/trees').glob('*.json'))

    for tree_file in tree_files:
        tree_data = load_tree(tree_file)
        tree_subject = tree_data.get('subject', '')
        tree_name = tree_file.stem
        modified = False

        # 递归处理所有 domain 和 node
        def fix_domain(domain):
            nonlocal modified
            if 'nodes' in domain:
                # 去重节点
                original_count = len(domain['nodes'])
                domain['nodes'] = deduplicate_nodes(domain['nodes'])
                if len(domain['nodes']) < original_count:
                    removed = original_count - len(domain['nodes'])
                    print(f'  🔧 {tree_name}/{domain["id"]}: 去除 {removed} 个重复节点')
                    modified = True

                # 修复每个节点的 courses
                for node in domain['nodes']:
                    fix_node(node, tree_subject)

        def fix_node(node, subject):
            nonlocal modified
            node_id = node.get('id', '')

            # 查找该节点应该有的课件
            expected_courses = node_courses.get((subject, node_id), [])

            # 当前节点的 courses
            current_courses = node.get('courses', [])

            # 过滤掉不存在的课件引用
            valid_current = [c for c in current_courses if c in courses]
            invalid_current = [c for c in current_courses if c not in courses]

            if invalid_current:
                print(f'  🗑️  {tree_name}/{node_id}: 移除无效引用 {invalid_current}')
                modified = True

            # 合并：保留有效的 + 添加预期的
            all_courses = list(set(valid_current + expected_courses))

            if set(all_courses) != set(current_courses):
                node['courses'] = sorted(all_courses)
                if all_courses:
                    node['status'] = 'active'
                    if not current_courses:
                        print(f'  ✅ {tree_name}/{node_id}: 添加课件 {all_courses}')
                else:
                    node['status'] = 'gap'
                modified = True
            elif all_courses and node.get('status') != 'active':
                node['status'] = 'active'
                modified = True

            # 递归处理子节点
            for key in ['children', 'nodes', 'domains']:
                if key in node:
                    for child in node[key]:
                        fix_node(child, subject)

        # 处理所有 domain
        if 'domains' in tree_data:
            for domain in tree_data['domains']:
                fix_domain(domain)

        if modified:
            save_tree(tree_file, tree_data)
            print(f'  💾 保存: {tree_name}.json')
        else:
            print(f'  ✓ {tree_name}.json: 无需修改')

    # 4. 重建注册表
    print('\n📋 步骤4: 重建注册表...')
    
    # 加载旧注册表以保留 status 等手动设置的字段
    old_registry = {}
    try:
        with open('registry.json', encoding='utf-8') as f:
            old_data = json.load(f)
            for c in old_data.get('courses', []):
                old_registry[c['id']] = c
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    
    registry_courses = []
    official_count = 0
    community_count = 0
    course_count = 0
    for course_id, manifest in sorted(courses.items()):
        # 保留旧注册表中的 status（official/community/course），默认 community
        old_entry = old_registry.get(course_id, {})
        status = old_entry.get('status', 'community')
        # 若 manifest 指明 category=course 也视为多章节课程
        if manifest.get('category') == 'course' and status not in ('official',):
            status = 'course'
        
        entry = {
            'id': course_id,
            'name': manifest.get('name', ''),
            'name_en': manifest.get('name_en', ''),
            'subject': manifest.get('subject', ''),
            'grade': manifest.get('grade', 0),
            'node_id': manifest.get('node_id', ''),
            'domain': manifest.get('domain', ''),
            'description': manifest.get('description', ''),
            'description_zh': manifest.get('description_zh', ''),
            'emoji': manifest.get('emoji', '📚'),
            'tags': manifest.get('tags', []),
            'difficulty': manifest.get('difficulty', 1),
            'duration': manifest.get('duration', ''),
            'lines': manifest.get('lines', ''),
            'created': manifest.get('created', ''),
            'version': manifest.get('version', '1.0'),
            'license': manifest.get('license', 'MIT'),
            'status': status,
            'path': f'examples/{course_id}',
            'has_tts': manifest.get('has_tts', False),
            'has_video': manifest.get('has_video', False),
            'has_en': manifest.get('has_en', False),
            'author': manifest.get('author', ''),
            'teachany_version': manifest.get('teachany_version', ''),
            'curriculum': manifest.get('curriculum', 'cn-national'),
        }
        registry_courses.append(entry)
        if status == 'official':
            official_count += 1
        elif status == 'course':
            course_count += 1
        else:
            community_count += 1

    registry = {
        'version': '1.0',
        'total': len(registry_courses),
        'updated': '2026-04-17',
        'courses': registry_courses
    }

    with open('registry.json', 'w', encoding='utf-8') as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)

    print(f'   注册表已重建: {len(registry_courses)} 个课件 (官方={official_count}, 社区={community_count}, 课程={course_count})')

    # 5. 最终验证
    print('\n' + '='*70)
    print('📊 最终验证')
    print('='*70)

    # 重新扫描
    tree_courses = set()
    for tf in Path('data/trees').glob('*.json'):
        td = load_tree(tf)
        def collect(n):
            if 'courses' in n and n['courses']:
                tree_courses.update(n['courses'])
            for k in ['children', 'nodes', 'domains']:
                if k in n:
                    for c in n[k]:
                        collect(c)
        collect(td)

    reg_set = set(c['id'] for c in registry_courses)
    file_set = set(courses.keys())

    print(f'\n  文件存在:   {len(file_set)}')
    print(f'  已注册:     {len(reg_set)}')
    print(f'  树引用:     {len(tree_courses)}')

    # 不一致检查
    tree_not_exist = tree_courses - file_set
    if tree_not_exist:
        print(f'\n  ❌ 知识树引用但文件不存在: {len(tree_not_exist)}')
        for x in sorted(tree_not_exist):
            print(f'     - {x}')
    else:
        print(f'\n  ✅ 知识树引用全部有效')

    reg_not_exist = reg_set - file_set
    if reg_not_exist:
        print(f'  ❌ 注册表但文件不存在: {len(reg_not_exist)}')
    else:
        print(f'  ✅ 注册表全部有效')

    file_not_in_tree = file_set - tree_courses
    if file_not_in_tree:
        print(f'  ⚠️  文件存在但知识树未引用: {len(file_not_in_tree)}')
        for x in sorted(file_not_in_tree):
            print(f'     - {x}')
    else:
        print(f'  ✅ 所有课件都被知识树引用')

    print(f'\n  三者完全一致: {len(file_set & reg_set & tree_courses)}')
    print('\n✅ 重建完成！')


if __name__ == '__main__':
    main()
