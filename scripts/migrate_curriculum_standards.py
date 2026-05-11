#!/usr/bin/env python3
"""
迁移脚本：将 _graph.json 中散落在各字段的课标引用
统一迁移到新增的 curriculum_standards 数组字段。

规则：
1. 扫描每个 node 的以下字段：
   - real_world (数组)：提取含"课标"的条目，从原数组移除
   - key_concepts (数组)：提取含"课标"或"【2022课标"的条目，从原数组移除
   - memory_anchors (数组)：提取含"课标"的条目，从原数组移除
   - definition (字符串)：如果含"课标"，提取课标相关部分作为标准，原文保留
   - bloom_verbs (对象)：如果 value 含"课标"，提取为标准，value 保留（不改动）
   - unit (字符串)：如果含"课标"，提取为标准，原值保留（不改动）

2. 提取的课标引用放入 node["curriculum_standards"] 数组

3. 同时处理 edges 中 note 字段含"课标"的：提取为 edge 级标准（附加到关联节点）

策略说明：
- real_world / key_concepts / memory_anchors 中的课标条目是"错放"的，迁移后从原位移除
- definition / unit / bloom_verbs 中嵌入的课标信息是语义上有价值的上下文，保留原文不动，
  只是在 curriculum_standards 中增加一份结构化副本
- edges.note 保留不动，只提取副本
"""

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# 匹配课标引用的模式
CURRICULUM_PATTERN = re.compile(r"课标|2022版课标|2022课标|新课标")


def is_curriculum_ref(text: str) -> bool:
    """判断一段文本是否为课标引用"""
    return bool(CURRICULUM_PATTERN.search(text))


def extract_from_array(arr: list) -> tuple[list, list]:
    """从数组中提取课标引用条目，返回 (保留条目, 提取出的课标条目)"""
    keep = []
    extracted = []
    for item in arr:
        if isinstance(item, str) and is_curriculum_ref(item):
            extracted.append(item)
        else:
            keep.append(item)
    return keep, extracted


def categorize_standard(text: str) -> str:
    """根据内容自动分类课标引用的类型"""
    if any(kw in text for kw in ["核心素养", "素养"]):
        return "core_competency"
    if any(kw in text for kw in ["必做实验", "实验"]):
        return "required_experiment"
    if any(kw in text for kw in ["任务群"]):
        return "learning_task_group"
    if any(kw in text for kw in ["逻辑主线", "主线"]):
        return "content_thread"
    if any(kw in text for kw in ["跨学科", "实践"]):
        return "cross_disciplinary"
    if any(kw in text for kw in ["调整", "删除", "新增", "移入", "回归", "强化", "重组"]):
        return "curriculum_change"
    if any(kw in text for kw in ["主题一", "主题二", "主题三", "主题四", "主题五",
                                  "主题六", "主题七", "主题八", "主题九"]):
        return "content_theme"
    if any(kw in text for kw in ["要求", "强调", "规定"]):
        return "teaching_requirement"
    return "general"


def process_node(node: dict) -> tuple[list, int]:
    """处理单个节点，返回 (curriculum_standards 列表, 修改计数)"""
    standards = []
    changes = 0

    # 1. real_world：提取并移除
    if "real_world" in node:
        keep, extracted = extract_from_array(node["real_world"])
        if extracted:
            node["real_world"] = keep
            for text in extracted:
                standards.append({
                    "source_field": "real_world",
                    "category": categorize_standard(text),
                    "content": text
                })
            changes += len(extracted)

    # 2. key_concepts：提取并移除
    if "key_concepts" in node:
        keep, extracted = extract_from_array(node["key_concepts"])
        if extracted:
            node["key_concepts"] = keep
            for text in extracted:
                standards.append({
                    "source_field": "key_concepts",
                    "category": categorize_standard(text),
                    "content": text
                })
            changes += len(extracted)

    # 3. memory_anchors：提取并移除
    if "memory_anchors" in node:
        keep, extracted = extract_from_array(node["memory_anchors"])
        if extracted:
            node["memory_anchors"] = keep
            for text in extracted:
                standards.append({
                    "source_field": "memory_anchors",
                    "category": categorize_standard(text),
                    "content": text
                })
            changes += len(extracted)

    # 4. definition：仅提取副本，不改动原文
    if "definition" in node and isinstance(node["definition"], str):
        if is_curriculum_ref(node["definition"]):
            standards.append({
                "source_field": "definition",
                "category": categorize_standard(node["definition"]),
                "content": node["definition"]
            })
            # 不修改 definition 原文
            changes += 1

    # 5. unit：仅提取副本，不改动原值
    if "unit" in node and isinstance(node["unit"], str):
        if is_curriculum_ref(node["unit"]):
            standards.append({
                "source_field": "unit",
                "category": categorize_standard(node["unit"]),
                "content": f"课标定位：{node['unit']}"
            })
            # 不修改 unit 原值
            changes += 1

    # 6. bloom_verbs：仅提取副本，不改动
    if "bloom_verbs" in node and isinstance(node["bloom_verbs"], dict):
        for level, verb_text in node["bloom_verbs"].items():
            if isinstance(verb_text, str) and is_curriculum_ref(verb_text):
                standards.append({
                    "source_field": f"bloom_verbs.{level}",
                    "category": "teaching_requirement",
                    "content": verb_text
                })
                changes += 1

    return standards, changes


def process_edges(edges: list, node_standards_map: dict) -> int:
    """处理 edges 中的课标引用，附加到关联节点的 standards 中"""
    changes = 0
    for edge in edges:
        note = edge.get("note", "")
        if isinstance(note, str) and is_curriculum_ref(note):
            # 附加到 from 节点
            from_id = edge.get("from", "")
            if from_id not in node_standards_map:
                node_standards_map[from_id] = []
            node_standards_map[from_id].append({
                "source_field": "edge_note",
                "category": categorize_standard(note),
                "content": f"[边→{edge.get('to', '?')}] {note}"
            })
            changes += 1
    return changes


def process_file(filepath: Path, dry_run: bool = False) -> dict:
    """处理单个 _graph.json 文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_changes = 0
    total_standards = 0
    node_edge_standards = {}  # node_id -> edge standards

    # 先处理 edges
    if "edges" in data:
        total_changes += process_edges(data["edges"], node_edge_standards)

    # 处理每个 node
    for node in data.get("nodes", []):
        node_id = node.get("id", "")
        standards, changes = process_node(node)

        # 合并 edge 提取的标准
        if node_id in node_edge_standards:
            standards.extend(node_edge_standards.pop(node_id))

        if standards:
            # 去重
            seen = set()
            unique_standards = []
            for s in standards:
                key = s["content"]
                if key not in seen:
                    seen.add(key)
                    unique_standards.append(s)

            node["curriculum_standards"] = unique_standards
            total_standards += len(unique_standards)
            total_changes += changes

    # 处理 edge 中引用了不存在于 nodes 中的 node_id 的情况（不太可能，但安全起见）
    # 这些标准无法归属，跳过

    if not dry_run and total_changes > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    return {
        "file": str(filepath.relative_to(DATA_DIR)),
        "changes": total_changes,
        "standards_added": total_standards,
    }


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("=== DRY RUN MODE (不写入文件) ===\n")

    results = []
    total_files_changed = 0
    total_standards = 0

    for subject_dir in sorted(DATA_DIR.iterdir()):
        if not subject_dir.is_dir():
            continue
        for domain_dir in sorted(subject_dir.iterdir()):
            if not domain_dir.is_dir():
                continue
            graph_file = domain_dir / "_graph.json"
            if not graph_file.exists():
                continue

            result = process_file(graph_file, dry_run=dry_run)
            if result["changes"] > 0:
                results.append(result)
                total_files_changed += 1
                total_standards += result["standards_added"]
                print(f"  {'[DRY]' if dry_run else '[OK]'} {result['file']}: "
                      f"{result['standards_added']} standards extracted, "
                      f"{result['changes']} field changes")

    print(f"\n{'='*60}")
    print(f"总计：{total_files_changed} 个文件受影响，"
          f"{total_standards} 条课标引用已{'检测到' if dry_run else '迁移完成'}")

    if dry_run:
        print("\n运行不带 --dry-run 参数以实际执行迁移。")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
