#!/usr/bin/env python3
"""
批量生成 _errors.json 和 _exercises.json
读取每个 domain 的 _graph.json，根据节点信息生成对应的错因库和题库。
"""

import json
import os
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# ============================================================
# 学科专业数据：每个 domain 的每个节点的错因和习题
# 由于数据量巨大，这里采用"模板 + 知识点元数据"的方式自动生成
# ============================================================

def load_graph(domain_path: Path) -> dict:
    graph_file = domain_path / "_graph.json"
    if not graph_file.exists():
        return None
    with open(graph_file, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {path.name}")


def generate_errors_for_node(node: dict, subject: str, domain: str) -> list:
    """为单个节点生成 2-4 条易错点"""
    nid = node["id"]
    name = node["name"]
    grade = node.get("grade", "")
    key_concepts = node.get("key_concepts", [])
    definition = node.get("definition", "")
    
    errors = []
    
    # 基于 key_concepts 生成概念混淆型错误
    if len(key_concepts) >= 2:
        errors.append({
            "id": f"err-{nid}-concept-1",
            "node_id": nid,
            "grade": str(grade),
            "type": "conceptual",
            "description": f"混淆{name}的核心概念",
            "wrong_answer": f"对{name}的定义理解有误，将「{key_concepts[0][:15]}」与「{key_concepts[1][:15]}」混淆",
            "correct_answer": f"{definition[:60]}",
            "diagnosis": f"需要区分清楚：{key_concepts[0]}；{key_concepts[1]}。两者含义不同，不能混为一谈。",
            "frequency": "high",
            "trigger": f"学生对{name}的多个概念未做区分"
        })
    
    # 基于 definition 生成定义理解错误
    if definition:
        errors.append({
            "id": f"err-{nid}-def",
            "node_id": nid,
            "grade": str(grade),
            "type": "conceptual",
            "description": f"对{name}的定义理解不准确",
            "wrong_answer": f"不能准确表述{name}的定义",
            "correct_answer": definition[:80],
            "diagnosis": f"请牢记：{definition[:100]}。建议用自己的话复述一遍，确保理解而非死记硬背。",
            "frequency": "medium",
            "trigger": f"学生对{name}的定义记忆模糊"
        })
    
    # 生成操作/计算型错误
    bloom = node.get("bloom_verbs", {})
    apply_verb = bloom.get("apply", "")
    if apply_verb:
        errors.append({
            "id": f"err-{nid}-proc",
            "node_id": nid,
            "grade": str(grade),
            "type": "procedural",
            "description": f"在应用{name}时步骤出错",
            "wrong_answer": f"操作步骤遗漏或顺序颠倒",
            "correct_answer": f"正确做法：{apply_verb[:60]}",
            "diagnosis": f"解题时应按步骤进行：先明确条件，再逐步推导。常见失误是跳步或遗漏关键条件。",
            "frequency": "medium",
            "trigger": f"解题时不按规范步骤进行"
        })
    
    return errors


def generate_exercises_for_node(node: dict, subject: str, domain: str, 
                                 error_ids: list, start_idx: int) -> list:
    """为单个节点生成 2-3 道题"""
    nid = node["id"]
    name = node["name"]
    grade = node.get("grade", "")
    key_concepts = node.get("key_concepts", [])
    definition = node.get("definition", "")
    bloom = node.get("bloom_verbs", {})
    
    exercises = []
    idx = start_idx
    
    # 缩写生成
    abbr = nid.replace("-", "")[:8]
    
    # 识记题
    remember_q = bloom.get("remember", f"说出{name}的基本概念")
    exercises.append({
        "id": f"ex-{abbr}-{idx:03d}",
        "node_id": nid,
        "bloom_level": "remember",
        "difficulty": 1,
        "type": "single_choice",
        "stem": f"关于{name}，以下哪个说法是正确的？",
        "options": [
            {"label": "A", "text": definition[:50] if definition else f"{name}的标准定义", "correct": True},
            {"label": "B", "text": f"与{name}完全无关的说法", "correct": False},
            {"label": "C", "text": f"对{name}的常见误解", "correct": False},
            {"label": "D", "text": f"与其他概念的混淆", "correct": False}
        ],
        "feedback_correct": f"正确！{definition[:60]}" if definition else f"正确！这就是{name}的核心内容。",
        "feedback_wrong": {
            "B": f"这个说法与{name}无关，请重新审题。",
            "C": f"这是一个常见误解。正确的理解是：{definition[:40]}",
            "D": f"注意不要将{name}与其他概念混淆。"
        },
        "source": "原创",
        "tags": [name, "识记"]
    })
    idx += 1
    
    # 理解题
    understand_q = bloom.get("understand", f"解释{name}的含义")
    if len(key_concepts) >= 2:
        exercises.append({
            "id": f"ex-{abbr}-{idx:03d}",
            "node_id": nid,
            "bloom_level": "understand",
            "difficulty": 2,
            "type": "single_choice",
            "stem": f"关于{name}，以下理解正确的是？",
            "options": [
                {"label": "A", "text": key_concepts[0][:50], "correct": True},
                {"label": "B", "text": f"对{key_concepts[0][:20]}的错误理解", "correct": False,
                 "error_id": error_ids[0] if error_ids else None},
                {"label": "C", "text": f"将{name}与其他知识混淆", "correct": False},
                {"label": "D", "text": f"以上都不对", "correct": False}
            ],
            "feedback_correct": f"没错！{key_concepts[0]}",
            "feedback_wrong": {
                "B": f"这个理解有误。正确的说法是：{key_concepts[0][:40]}",
                "C": f"注意区分不同的知识点。",
                "D": f"A选项是正确的，请仔细对照。"
            },
            "source": "原创",
            "tags": [name, "理解"]
        })
        # 清理 None 的 error_id
        for opt in exercises[-1]["options"]:
            if "error_id" in opt and opt["error_id"] is None:
                del opt["error_id"]
        idx += 1
    
    # 应用题
    apply_q = bloom.get("apply", "")
    if apply_q:
        exercises.append({
            "id": f"ex-{abbr}-{idx:03d}",
            "node_id": nid,
            "bloom_level": "apply",
            "difficulty": 3,
            "type": "single_choice",
            "stem": f"请完成以下任务：{apply_q[:60]}",
            "options": [
                {"label": "A", "text": "正确的操作/答案", "correct": True},
                {"label": "B", "text": "步骤遗漏的错误答案", "correct": False},
                {"label": "C", "text": "概念混淆的错误答案", "correct": False},
                {"label": "D", "text": "计算/推理错误的答案", "correct": False}
            ],
            "feedback_correct": f"很好！你正确完成了{name}的应用。",
            "feedback_wrong": {
                "B": "注意检查步骤是否完整。",
                "C": f"请重新回顾{name}的定义。",
                "D": "计算或推理过程中出现了错误，请仔细检查。"
            },
            "source": "原创",
            "tags": [name, "应用"]
        })
        idx += 1
    
    return exercises, idx


def process_domain(domain_path: Path, skip_existing: bool = True):
    """处理单个 domain"""
    errors_file = domain_path / "_errors.json"
    exercises_file = domain_path / "_exercises.json"
    
    if skip_existing and errors_file.exists() and exercises_file.exists():
        print(f"  ⏭️  已存在，跳过")
        return
    
    graph = load_graph(domain_path)
    if not graph:
        print(f"  ❌ 无 _graph.json")
        return
    
    subject = graph.get("subject", "")
    domain = graph.get("domain", "")
    nodes = graph.get("nodes", [])
    
    # 生成 errors
    all_errors = []
    for node in nodes:
        errs = generate_errors_for_node(node, subject, domain)
        all_errors.extend(errs)
    
    errors_data = {
        "subject": subject,
        "domain": domain,
        "version": "1.0",
        "errors": all_errors
    }
    
    # 生成 exercises
    all_exercises = []
    ex_idx = 1
    for node in nodes:
        error_ids = [e["id"] for e in all_errors if e["node_id"] == node["id"]]
        exs, ex_idx = generate_exercises_for_node(node, subject, domain, error_ids, ex_idx)
        all_exercises.extend(exs)
    
    exercises_data = {
        "subject": subject,
        "domain": domain,
        "version": "1.0",
        "exercises": all_exercises
    }
    
    # 保存
    if not errors_file.exists():
        save_json(errors_file, errors_data)
    if not exercises_file.exists():
        save_json(exercises_file, exercises_data)


def main():
    """遍历所有 domain 目录"""
    print("🚀 批量生成 _errors.json 和 _exercises.json\n")
    
    count = 0
    for subject_dir in sorted(DATA_DIR.iterdir()):
        if not subject_dir.is_dir() or subject_dir.name.startswith("."):
            continue
        for domain_dir in sorted(subject_dir.iterdir()):
            if not domain_dir.is_dir() or domain_dir.name.startswith("."):
                continue
            graph_file = domain_dir / "_graph.json"
            if not graph_file.exists():
                continue
            
            rel = domain_dir.relative_to(DATA_DIR)
            print(f"📂 {rel}")
            process_domain(domain_dir)
            count += 1
    
    print(f"\n✅ 共处理 {count} 个 domain")


if __name__ == "__main__":
    main()
