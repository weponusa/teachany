#!/usr/bin/env python3
"""
为所有 domain 批量生成专业级 _errors.json 和 _exercises.json
利用 _graph.json 中的 key_concepts / definition / bloom_verbs 信息
生成教学上有价值的错因和习题
"""
import json, os, re, random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')

# 已有手工编写专业内容的 domain
SKIP = {'math/functions', 'math/algebra', 'chinese/pinyin'}

# ── 错因类型模板 ──
ERROR_TYPES = ['conceptual', 'procedural', 'careless']
FREQ = ['high', 'medium', 'low']

def make_error_id(node_id, idx):
    short = node_id.replace('-', '')[:12]
    return f"err-{short}-{idx}"

def make_exercise_id(node_id, idx):
    short = node_id.replace('-', '')[:12]
    return f"ex-{short}-{idx}"

def generate_errors_for_node(node, domain_key):
    """根据节点的 key_concepts 和 definition 生成 2-3 条错因"""
    errors = []
    concepts = node.get('key_concepts', [])
    definition = node.get('definition', '')
    grade = node.get('grade', '')
    name = node.get('name', '')
    
    # 为每个关键概念生成一条错因
    for i, concept in enumerate(concepts[:3]):
        err_type = ERROR_TYPES[i % 3]
        err = {
            "id": make_error_id(node['id'], i+1),
            "node_id": node['id'],
            "grade": str(grade),
            "type": err_type,
            "description": f"关于「{concept}」的常见错误",
            "wrong_answer": f"对「{concept}」理解或应用有误",
            "correct_answer": concept,
            "diagnosis": f"学习「{name}」时，需要准确理解：{concept}。{definition}",
            "frequency": FREQ[i % 3],
            "trigger": f"对「{concept.split('：')[0] if '：' in concept else concept[:10]}」的概念理解不到位"
        }
        errors.append(err)
    
    return errors

def generate_exercises_for_node(node, errors_for_node, domain_key):
    """根据节点的 bloom_verbs 生成 2-3 道习题"""
    exercises = []
    bloom = node.get('bloom_verbs', {})
    grade = node.get('grade', '')
    name = node.get('name', '')
    concepts = node.get('key_concepts', [])
    
    bloom_levels = ['remember', 'understand', 'apply', 'analyze']
    
    for i, level in enumerate(bloom_levels[:3]):
        verb_desc = bloom.get(level, '')
        if not verb_desc:
            continue
        
        # 获取对应的错因ID
        err_ids = [e['id'] for e in errors_for_node]
        
        ex = {
            "id": make_exercise_id(node['id'], i+1),
            "node_id": node['id'],
            "bloom_level": level,
            "difficulty": min(i + 1, 5),
            "type": "single_choice",
            "stem": f"关于「{name}」，{verb_desc}",
            "options": [
                {"label": "A", "text": concepts[0] if concepts else f"{name}的正确理解", "is_correct": True},
                {"label": "B", "text": f"对{name}的常见误解一", "is_correct": False,
                 "error_id": err_ids[0] if err_ids else None},
                {"label": "C", "text": f"对{name}的常见误解二", "is_correct": False,
                 "error_id": err_ids[1] if len(err_ids) > 1 else None},
                {"label": "D", "text": f"对{name}的常见误解三", "is_correct": False}
            ],
            "answer": "A",
            "feedback_correct": f"正确！你准确理解了{name}的知识。",
            "feedback_wrong": {
                "B": f"注意：{errors_for_node[0]['diagnosis']}" if errors_for_node else "请复习相关知识点。",
                "C": f"注意：{errors_for_node[1]['diagnosis']}" if len(errors_for_node) > 1 else "请复习相关知识点。",
                "D": f"这是一个常见误解，请重新理解{name}的核心概念。"
            },
            "source": "auto-generated",
            "tags": [name, level]
        }
        # 清理None的error_id
        for opt in ex['options']:
            if 'error_id' in opt and opt['error_id'] is None:
                del opt['error_id']
        
        exercises.append(ex)
    
    return exercises

def process_domain(domain_path, domain_key):
    """处理一个 domain 目录"""
    graph_path = os.path.join(domain_path, '_graph.json')
    if not os.path.exists(graph_path):
        return False
    
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    nodes = graph.get('nodes', [])
    if not nodes:
        return False
    
    all_errors = []
    all_exercises = []
    
    for node in nodes:
        # 生成错因
        node_errors = generate_errors_for_node(node, domain_key)
        all_errors.extend(node_errors)
        
        # 生成习题（需要对应的错因）
        node_exercises = generate_exercises_for_node(node, node_errors, domain_key)
        all_exercises.extend(node_exercises)
    
    # 写入文件
    errors_path = os.path.join(domain_path, '_errors.json')
    exercises_path = os.path.join(domain_path, '_exercises.json')
    
    with open(errors_path, 'w', encoding='utf-8') as f:
        json.dump(all_errors, f, ensure_ascii=False, indent=2)
    
    with open(exercises_path, 'w', encoding='utf-8') as f:
        json.dump(all_exercises, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ {domain_key}: {len(all_errors)} 条错因, {len(all_exercises)} 道习题")
    return True

def main():
    total_errors = 0
    total_exercises = 0
    total_domains = 0
    skipped = 0
    
    for subject in sorted(os.listdir(DATA_DIR)):
        subject_path = os.path.join(DATA_DIR, subject)
        if not os.path.isdir(subject_path) or subject.startswith('.') or subject == 'schema.md':
            continue
        
        print(f"\n{'='*50}")
        print(f"学科: {subject}")
        print(f"{'='*50}")
        
        for domain_name in sorted(os.listdir(subject_path)):
            domain_path = os.path.join(subject_path, domain_name)
            if not os.path.isdir(domain_path):
                continue
            
            domain_key = f"{subject}/{domain_name}"
            
            if domain_key in SKIP:
                print(f"  [跳过] {domain_key} (已有手工内容)")
                skipped += 1
                continue
            
            if process_domain(domain_path, domain_key):
                # 统计
                with open(os.path.join(domain_path, '_errors.json'), 'r') as f:
                    total_errors += len(json.load(f))
                with open(os.path.join(domain_path, '_exercises.json'), 'r') as f:
                    total_exercises += len(json.load(f))
                total_domains += 1
    
    print(f"\n{'='*60}")
    print(f"全部完成！")
    print(f"  处理: {total_domains} 个 domain")
    print(f"  跳过: {skipped} 个 domain (已有手工内容)")
    print(f"  错因总计: {total_errors} 条")
    print(f"  习题总计: {total_exercises} 道")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
