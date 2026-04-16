#!/usr/bin/env python3
"""
TeachAny 知识点主索引生成工具

功能：
1. 扫描所有知识树文件
2. 提取所有知识点节点
3. 生成统一的 kp_id
4. 建立主索引 data/knowledge-points/index.json
"""
import json
from datetime import date
from pathlib import Path
from collections import defaultdict
import re

def normalize_id(raw_id):
    """规范化ID：去除特殊字符，转小写，用-连接"""
    return re.sub(r'[^a-z0-9-]', '', raw_id.lower().replace('_', '-'))

def generate_kp_id(subject, stage, domain, concept_id):
    """生成知识点ID"""
    # 规范化各部分
    subj = normalize_id(subject)
    stg = normalize_id(stage)
    dom = normalize_id(domain) if domain else 'general'
    cpt = normalize_id(concept_id)
    
    return f"kp-{subj}-{stg}-{dom}-{cpt}"

def extract_stage_from_tree_name(tree_name):
    """从知识树文件名提取学段"""
    if 'elementary' in tree_name:
        return 'e'
    elif 'middle' in tree_name:
        return 'm'
    elif 'high' in tree_name:
        return 'h'
    return 'u'  # unknown

def extract_subject_from_tree(tree_data, tree_name):
    """从知识树提取学科，统一转为缩写"""
    # 学科代码映射（全称→缩写）
    subject_map = {
        'mathematics': 'math',
        'math': 'math',
        'physics': 'phy',
        'phy': 'phy',
        'chemistry': 'chem',
        'chem': 'chem',
        'biology': 'bio',
        'bio': 'bio',
        'chinese': 'chn',
        'chn': 'chn',
        'english': 'eng',
        'eng': 'eng',
        'geography': 'geo',
        'geo': 'geo',
        'history': 'hist',
        'hist': 'hist',
        'earth-science': 'geo',
        'earth_science': 'geo'
    }
    
    # 优先从树数据的 subject 字段
    if 'subject' in tree_data:
        raw_subject = tree_data['subject'].lower()
        return subject_map.get(raw_subject, raw_subject)
    
    # 从文件名推断
    tree_name_lower = tree_name.lower()
    for key, code in subject_map.items():
        if key in tree_name_lower:
            return code
    
    return 'unknown'

def scan_tree_nodes(tree_data, tree_file, subject, stage):
    """递归扫描知识树节点"""
    nodes = []
    
    def scan(node, domain_path=None):
        node_id = node.get('id', '')
        if not node_id:
            return
        
        # 推断domain（取路径的第一层）
        current_domain = domain_path or node_id.split('-')[0] if '-' in node_id else 'general'
        
        # 生成 kp_id
        kp_id = generate_kp_id(subject, stage, current_domain, node_id)
        
        point = {
            'kp_id': kp_id,
            'old_node_id': node_id,  # 保留旧ID用于迁移
            'name_zh': node.get('name', ''),
            'name_en': node.get('name_en', ''),
            'subject': subject,
            'stage': stage,
            'grade': node.get('grade', 0),
            'domain': current_domain,
            'prerequisites': node.get('prerequisites', []),
            'extends': node.get('extends', []),
            'parallel': node.get('parallel', []),
            'courses': node.get('courses', []),
            'status': node.get('status', 'gap'),
            'tree_file': tree_file,
            'description': node.get('description', '')
        }
        nodes.append(point)
        
        # 递归子节点
        for key in ['children', 'nodes']:
            if key in node:
                for child in node[key]:
                    scan(child, current_domain)
    
    # 处理顶层
    if 'domains' in tree_data:
        for domain in tree_data['domains']:
            domain_id = domain.get('id', 'general')
            if 'nodes' in domain:
                for node in domain['nodes']:
                    scan(node, domain_id)
    
    return nodes

def main():
    print('='*70)
    print('TeachAny 知识点主索引生成工具')
    print('='*70)
    
    # 1. 扫描所有知识树
    print('\n📂 扫描知识树文件...')
    tree_files = list(Path('data/trees').glob('*.json'))
    print(f'   找到 {len(tree_files)} 个知识树文件')
    
    all_points = []
    tree_stats = {}
    
    for tree_file in tree_files:
        tree_name = tree_file.stem
        try:
            with open(tree_file, encoding='utf-8') as f:
                tree_data = json.load(f)
            
            subject = extract_subject_from_tree(tree_data, tree_name)
            stage = extract_stage_from_tree_name(tree_name)
            
            points = scan_tree_nodes(tree_data, tree_name, subject, stage)
            all_points.extend(points)
            tree_stats[tree_name] = len(points)
            
            print(f'   ✓ {tree_name}: {len(points)} 个知识点')
        except Exception as e:
            print(f'   ❌ {tree_name}: {e}')
    
    print(f'\n   总计: {len(all_points)} 个知识点')
    
    # 2. 去重（按 kp_id）
    print('\n🔍 检查重复...')
    kp_map = {}
    duplicates = []
    
    for point in all_points:
        kp_id = point['kp_id']
        if kp_id in kp_map:
            duplicates.append({
                'kp_id': kp_id,
                'old1': kp_map[kp_id]['old_node_id'],
                'old2': point['old_node_id'],
                'tree1': kp_map[kp_id]['tree_file'],
                'tree2': point['tree_file']
            })
            # 合并 courses
            kp_map[kp_id]['courses'] = list(set(
                kp_map[kp_id]['courses'] + point['courses']
            ))
        else:
            kp_map[kp_id] = point
    
    if duplicates:
        print(f'   ⚠️  发现 {len(duplicates)} 个重复ID:')
        for dup in duplicates[:10]:
            print(f'      - {dup["kp_id"]}')
            print(f'        来自: {dup["tree1"]}:{dup["old1"]} 和 {dup["tree2"]}:{dup["old2"]}')
    else:
        print(f'   ✅ 无重复ID')
    
    # 3. 按字母顺序排序
    print('\n📊 排序...')
    sorted_points = sorted(kp_map.values(), key=lambda x: x['kp_id'])
    
    # 4. 生成主索引
    print('\n💾 生成主索引...')
    index = {
        'version': '1.0',
        'total': len(sorted_points),
        'updated': date.today().isoformat(),
        'description': '统一知识点索引',
        'points': sorted_points
    }
    
    # 确保目录存在
    Path('data/knowledge-points').mkdir(parents=True, exist_ok=True)
    
    with open('data/knowledge-points/index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f'   ✅ 已生成: data/knowledge-points/index.json')
    print(f'   包含 {len(sorted_points)} 个知识点')
    
    # 5. 统计报告
    print('\n' + '='*70)
    print('📈 统计报告')
    print('='*70)
    
    # 按学科统计
    subject_stats = defaultdict(int)
    stage_stats = defaultdict(int)
    status_stats = defaultdict(int)
    
    for point in sorted_points:
        subject_stats[point['subject']] += 1
        stage_stats[point['stage']] += 1
        status_stats[point['status']] += 1
    
    print('\n按学科:')
    for subj, count in sorted(subject_stats.items(), key=lambda x: -x[1]):
        print(f'  {subj}: {count}')
    
    print('\n按学段:')
    for stage, count in sorted(stage_stats.items()):
        stage_name = {'e': '小学', 'm': '初中', 'h': '高中', 'u': '未知'}[stage]
        print(f'  {stage_name} ({stage}): {count}')
    
    print('\n按状态:')
    for status, count in sorted(status_stats.items()):
        print(f'  {status}: {count}')
    
    # 6. 生成映射表（old_node_id → kp_id）
    print('\n🗺️  生成迁移映射表...')
    mapping = {
        point['old_node_id']: point['kp_id']
        for point in sorted_points
    }

    legacy_aliases = {
        'present-simple-m': 'tenses-present',
        'present-continuous-m': 'tenses-present',
        'past-simple-m': 'tenses-past',
        'past-continuous': 'tenses-past',
        'future-simple-m': 'tenses-future',
        'past-future': 'tenses-future',
        'present-perfect': 'tenses-perfect',
        'present-perfect-continuous': 'tenses-perfect',
        'sentence-structure': 'sentence-patterns',
        'compound-sentence-en': 'sentence-patterns',
        'reading-factual': 'reading-strategies',
        'reading-inference': 'reading-strategies',
        'reading-main-idea': 'reading-strategies',
        'reading-comprehensive': 'text-types',
        'writing-sentence-en': 'basic-writing',
        'writing-paragraph-en': 'basic-writing',
        'writing-essay-en': 'basic-writing',
        'vocab-1600': 'curriculum-vocabulary'
    }

    for legacy_id, target_node_id in legacy_aliases.items():
        target_kp_id = mapping.get(target_node_id)
        if target_kp_id:
            mapping[legacy_id] = target_kp_id
    
    with open('data/knowledge-points/migration-map.json', 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    
    print(f'   ✅ 已生成: data/knowledge-points/migration-map.json')
    print(f'   包含 {len(mapping)} 个映射关系')
    
    print('\n✅ 主索引生成完成！')

if __name__ == '__main__':
    main()
