#!/usr/bin/env python3
"""
批量为所有 domain 生成专业内容的 _errors.json 和 _exercises.json
分学科加载内容模块，直接写入文件
"""
import json, os, sys, importlib.util

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
CONTENT_DIR = os.path.join(SCRIPT_DIR, 'content')

# 已有专业内容的 domain，跳过
SKIP_DOMAINS = {'math/functions', 'math/algebra', 'chinese/pinyin'}

def load_content_module(subject):
    """加载学科内容模块"""
    mod_path = os.path.join(CONTENT_DIR, f'{subject}.py')
    if not os.path.exists(mod_path):
        return None
    spec = importlib.util.spec_from_file_location(f'content_{subject}', mod_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def write_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  写入: {os.path.basename(filepath)} ({len(data)} 条)")

def process_domain(subject, domain_name, domain_path, content_mod):
    """处理单个 domain"""
    key = f"{subject}/{domain_name}"
    if key in SKIP_DOMAINS:
        print(f"  [跳过] {key} (已有专业内容)")
        return
    
    graph_path = os.path.join(domain_path, '_graph.json')
    if not os.path.exists(graph_path):
        return
    
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    # 从内容模块获取数据
    errors_data = content_mod.get_errors(domain_name, graph) if hasattr(content_mod, 'get_errors') else None
    exercises_data = content_mod.get_exercises(domain_name, graph) if hasattr(content_mod, 'get_exercises') else None
    
    if errors_data:
        write_json(os.path.join(domain_path, '_errors.json'), errors_data)
    if exercises_data:
        write_json(os.path.join(domain_path, '_exercises.json'), exercises_data)

def main():
    stats = {'processed': 0, 'skipped': 0, 'no_module': 0}
    
    for subject in sorted(os.listdir(DATA_DIR)):
        subject_path = os.path.join(DATA_DIR, subject)
        if not os.path.isdir(subject_path) or subject.startswith('.'):
            continue
        
        content_mod = load_content_module(subject)
        if not content_mod:
            print(f"\n[!] 学科 {subject} 无内容模块，跳过")
            # 列出需要处理的domains
            for d in sorted(os.listdir(subject_path)):
                dp = os.path.join(subject_path, d)
                if os.path.isdir(dp) and os.path.exists(os.path.join(dp, '_graph.json')):
                    stats['no_module'] += 1
            continue
        
        print(f"\n=== 处理学科: {subject} ===")
        for domain_name in sorted(os.listdir(subject_path)):
            domain_path = os.path.join(subject_path, domain_name)
            if not os.path.isdir(domain_path):
                continue
            if not os.path.exists(os.path.join(domain_path, '_graph.json')):
                continue
            
            key = f"{subject}/{domain_name}"
            if key in SKIP_DOMAINS:
                stats['skipped'] += 1
                print(f"  [跳过] {domain_name}")
                continue
            
            print(f"  处理: {domain_name}")
            process_domain(subject, domain_name, domain_path, content_mod)
            stats['processed'] += 1
    
    print(f"\n{'='*50}")
    print(f"处理完成: {stats['processed']} 个 domain")
    print(f"跳过(已有): {stats['skipped']} 个")
    if stats['no_module'] > 0:
        print(f"缺少模块: {stats['no_module']} 个 domain")

if __name__ == '__main__':
    main()
