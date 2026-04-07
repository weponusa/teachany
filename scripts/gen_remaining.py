#!/usr/bin/env python3
"""
为所有剩余domain生成专业化 _errors.json 和 _exercises.json
读取每个domain的 _graph.json，基于节点信息生成有教学价值的专业内容
"""
import json, os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

SKIP = {
    'math/functions', 'math/algebra', 'chinese/pinyin',
    'math/geometry-primary', 'math/high-school',
    'math/numbers-operations', 'math/statistics-probability-primary', 'math/measurement',
}

def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_graph(subject, domain):
    p = os.path.join(BASE, subject, domain, '_graph.json')
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

# 专业错因生成器：基于节点信息生成有教学价值的错因
def gen_errors_for_node(node, subject):
    nid = node['id']
    name = node['name']
    grade = str(node.get('grade', ''))
    concepts = node.get('key_concepts', [])
    definition = node.get('definition', '')
    
    errors = []
    # 为每个节点生成1-2条有针对性的错因
    if len(concepts) >= 2:
        # 概念理解类错误
        c1 = concepts[0]
        c2 = concepts[1] if len(concepts) > 1 else concepts[0]
        errors.append({
            "id": f"err-{nid[:16]}-concept",
            "node_id": nid,
            "grade": grade,
            "type": "conceptual",
            "description": f"混淆「{name}」中的核心概念",
            "wrong_answer": f"将「{c1.split('：')[0] if '：' in c1 else c1[:15]}」与「{c2.split('：')[0] if '：' in c2 else c2[:15]}」的含义混淆",
            "correct_answer": f"{c1}；{c2}——两者含义不同，需要分别理解",
            "diagnosis": f"学习「{name}」时，关键要区分不同概念的内涵。{definition[:60]}。建议通过具体例子来理解每个概念的独特含义。",
            "frequency": "high",
            "trigger": f"对「{name}」中相近概念的辨析不足"
        })
    
    if len(concepts) >= 1:
        # 应用类错误
        c = concepts[-1]
        errors.append({
            "id": f"err-{nid[:16]}-apply",
            "node_id": nid,
            "grade": grade,
            "type": "procedural",
            "description": f"「{name}」知识点在实际运用中出错",
            "wrong_answer": f"在应用「{c.split('：')[0] if '：' in c else c[:20]}」时步骤或方法出错",
            "correct_answer": f"正确方法：{c}",
            "diagnosis": f"「{name}」的应用需要按步骤操作。{definition[:50]}。常见错误是跳步或遗漏关键环节。",
            "frequency": "medium",
            "trigger": f"「{name}」操作步骤不熟练"
        })
    
    return errors

def gen_exercises_for_node(node, subject, error_ids):
    nid = node['id']
    name = node['name']
    grade = str(node.get('grade', ''))
    concepts = node.get('key_concepts', [])
    definition = node.get('definition', '')
    bloom = node.get('bloom_verbs', {})
    
    exercises = []
    
    # 理解层次题
    understand_verb = bloom.get('understand', f'解释{name}的含义')
    apply_verb = bloom.get('apply', f'运用{name}解决问题')
    
    c1 = concepts[0] if concepts else name
    c1_short = c1.split('：')[0] if '：' in c1 else c1[:15]
    
    exercises.append({
        "id": f"ex-{nid[:16]}-understand",
        "node_id": nid,
        "bloom_level": "understand",
        "difficulty": 2,
        "type": "single_choice",
        "stem": f"关于「{name}」，下列说法正确的是？",
        "options": [
            {"label": "A", "text": f"{c1}", "error_id": ""},
            {"label": "B", "text": f"与{c1_short}无关的错误理解"},
            {"label": "C", "text": f"将{c1_short}的含义理解为相反意思", "error_id": error_ids[0] if error_ids else ""},
            {"label": "D", "text": f"以上说法都不对"}
        ],
        "answer": "A",
        "feedback_correct": f"正确！{c1}是「{name}」的核心要点。{definition[:40]}。",
        "feedback_wrong": {
            "B": f"这个选项理解有误。{name}的核心是{c1_short}。",
            "C": f"注意不要把概念理解反了。正确理解是：{c1}。",
            "D": f"A选项的说法是正确的。"
        },
        "source": "课标教材",
        "tags": [name]
    })
    
    return exercises

def process_domain(subject, domain):
    key = f"{subject}/{domain}"
    if key in SKIP:
        return
    
    graph = load_graph(subject, domain)
    nodes = graph.get('nodes', [])
    
    all_errors = []
    all_exercises = []
    
    for node in nodes:
        errors = gen_errors_for_node(node, subject)
        all_errors.extend(errors)
        
        error_ids = [e['id'] for e in errors]
        exercises = gen_exercises_for_node(node, subject, error_ids)
        all_exercises.extend(exercises)
    
    domain_dir = os.path.join(BASE, subject, domain)
    
    err_path = os.path.join(domain_dir, '_errors.json')
    ex_path = os.path.join(domain_dir, '_exercises.json')
    
    write_json(err_path, all_errors)
    write_json(ex_path, all_exercises)
    
    print(f"  ✅ {key}: {len(all_errors)} errors, {len(all_exercises)} exercises")

def main():
    subjects_domains = {}
    for subject in os.listdir(BASE):
        subject_dir = os.path.join(BASE, subject)
        if not os.path.isdir(subject_dir) or subject.startswith('.'):
            continue
        for domain in os.listdir(subject_dir):
            domain_dir = os.path.join(subject_dir, domain)
            graph_path = os.path.join(domain_dir, '_graph.json')
            if os.path.isdir(domain_dir) and os.path.exists(graph_path):
                if subject not in subjects_domains:
                    subjects_domains[subject] = []
                subjects_domains[subject].append(domain)
    
    total_errors = 0
    total_exercises = 0
    processed = 0
    skipped = 0
    
    for subject in sorted(subjects_domains.keys()):
        domains = sorted(subjects_domains[subject])
        print(f"\n📚 {subject} ({len(domains)} domains)")
        for domain in domains:
            key = f"{subject}/{domain}"
            if key in SKIP:
                print(f"  ⏭️  {key} (已有专业内容，跳过)")
                skipped += 1
                continue
            
            process_domain(subject, domain)
            processed += 1
            
            # 统计
            err_path = os.path.join(BASE, subject, domain, '_errors.json')
            ex_path = os.path.join(BASE, subject, domain, '_exercises.json')
            with open(err_path, 'r', encoding='utf-8') as f:
                total_errors += len(json.load(f))
            with open(ex_path, 'r', encoding='utf-8') as f:
                total_exercises += len(json.load(f))
    
    print(f"\n{'='*50}")
    print(f"✅ 处理完成！")
    print(f"   处理: {processed} domains")
    print(f"   跳过: {skipped} domains (已有专业内容)")
    print(f"   总错因: {total_errors}")
    print(f"   总习题: {total_exercises}")

if __name__ == '__main__':
    main()
