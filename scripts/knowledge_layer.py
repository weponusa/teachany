#!/usr/bin/env python3
"""TeachAny Knowledge Layer utilities.

Subcommands:
- audit: inspect completeness/readiness of the knowledge layer
- lookup: return compact graph-first topic context for courseware generation

No third-party dependencies.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


@dataclass
class DomainBundle:
    subject: str
    domain: str
    graph_path: Path
    graph: Dict[str, Any]
    errors_path: Optional[Path]
    errors: Optional[Dict[str, Any]]
    exercises_path: Optional[Path]
    exercises: Optional[Dict[str, Any]]


REQUIRED_NODE_FIELDS = [
    "id",
    "name",
    "name_en",
    "grade",
    "semester",
    "unit",
    "definition",
    "key_concepts",
    "prerequisites",
    "leads_to",
    "real_world",
    "memory_anchors",
    "bloom_verbs",
]


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def coerce_item_list(payload: Optional[Any], key: str) -> List[Dict[str, Any]]:
    if payload is None:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        value = payload.get(key, [])
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def iter_domain_dirs(data_dir: Path) -> Iterable[Tuple[str, Path]]:
    for subject_dir in sorted(p for p in data_dir.iterdir() if p.is_dir()):
        for domain_dir in sorted(p for p in subject_dir.iterdir() if p.is_dir()):
            yield subject_dir.name, domain_dir


def load_bundles(data_dir: Path = DATA_DIR) -> List[DomainBundle]:
    bundles: List[DomainBundle] = []
    for subject, domain_dir in iter_domain_dirs(data_dir):
        graph_path = domain_dir / "_graph.json"
        if not graph_path.exists():
            continue
        errors_path = domain_dir / "_errors.json"
        exercises_path = domain_dir / "_exercises.json"
        graph = load_json(graph_path)
        errors = load_json(errors_path) if errors_path.exists() else None
        exercises = load_json(exercises_path) if exercises_path.exists() else None
        bundles.append(
            DomainBundle(
                subject=subject,
                domain=domain_dir.name,
                graph_path=graph_path,
                graph=graph,
                errors_path=errors_path if errors_path.exists() else None,
                errors=errors,
                exercises_path=exercises_path if exercises_path.exists() else None,
                exercises=exercises,
            )
        )
    return bundles


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "", text)
    return text


def subject_alias_map() -> Dict[str, str]:
    aliases = {
        "math": ["math", "数学"],
        "chinese": ["chinese", "语文", "中文"],
        "english": ["english", "英语"],
        "physics": ["physics", "物理"],
        "chemistry": ["chemistry", "化学"],
        "biology": ["biology", "生物"],
        "geography": ["geography", "地理"],
        "history": ["history", "历史"],
        "info-tech": ["info-tech", "信息技术", "信息", "编程", "ai"],
    }
    result: Dict[str, str] = {}
    for canonical, names in aliases.items():
        for name in names:
            result[normalize_text(name)] = canonical
    return result


def resolve_subject(subject: Optional[str]) -> Optional[str]:
    if not subject:
        return None
    return subject_alias_map().get(normalize_text(subject), subject)


def build_global_indices(bundles: List[DomainBundle]) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Tuple[str, str]]]:
    node_index: Dict[str, Dict[str, Any]] = {}
    node_home: Dict[str, Tuple[str, str]] = {}
    for bundle in bundles:
        for node in bundle.graph.get("nodes", []):
            node_id = node.get("id")
            if not node_id:
                continue
            node_index[node_id] = node
            node_home[node_id] = (bundle.subject, bundle.domain)
    return node_index, node_home


def compute_node_score(topic: str, bundle: DomainBundle, node: Dict[str, Any]) -> int:
    topic_n = normalize_text(topic)
    name = normalize_text(str(node.get("name", "")))
    name_en = normalize_text(str(node.get("name_en", "")))
    node_id = normalize_text(str(node.get("id", "")))
    domain = normalize_text(bundle.domain)
    score = 0
    if topic_n == name or topic_n == name_en or topic_n == node_id:
        score += 200
    if topic_n and topic_n in name:
        score += 120
    if topic_n and topic_n in name_en:
        score += 110
    if topic_n and topic_n in node_id:
        score += 100
    if topic_n and topic_n in domain:
        score += 60
    for concept in node.get("key_concepts", []):
        concept_n = normalize_text(str(concept))
        if topic_n and topic_n in concept_n:
            score += 15
    for text in node.get("real_world", []):
        text_n = normalize_text(str(text))
        if topic_n and topic_n in text_n:
            score += 10
    return score


def find_matches(bundles: List[DomainBundle], topic: str, subject: Optional[str] = None) -> List[Tuple[int, DomainBundle, Dict[str, Any]]]:
    subject = resolve_subject(subject)
    matches: List[Tuple[int, DomainBundle, Dict[str, Any]]] = []
    for bundle in bundles:
        if subject and bundle.subject != subject:
            continue
        for node in bundle.graph.get("nodes", []):
            score = compute_node_score(topic, bundle, node)
            if score > 0:
                matches.append((score, bundle, node))
    matches.sort(key=lambda item: (-item[0], item[1].subject, item[1].domain, item[2].get("name", "")))
    return matches


def summarize_refs(node_ids: List[str], node_index: Dict[str, Dict[str, Any]], node_home: Dict[str, Tuple[str, str]]) -> List[Dict[str, Any]]:
    output = []
    for node_id in node_ids:
        node = node_index.get(node_id)
        home = node_home.get(node_id)
        if node and home:
            output.append(
                {
                    "id": node_id,
                    "name": node.get("name"),
                    "subject": home[0],
                    "domain": home[1],
                    "grade": node.get("grade"),
                }
            )
        else:
            output.append({"id": node_id, "name": None, "subject": None, "domain": None, "grade": None})
    return output


def compact_node_summary(
    bundle: DomainBundle,
    node: Dict[str, Any],
    node_index: Dict[str, Dict[str, Any]],
    node_home: Dict[str, Tuple[str, str]],
    max_errors: int,
    max_exercises: int,
) -> Dict[str, Any]:
    node_id = node.get("id")
    error_items = []
    for item in coerce_item_list(bundle.errors, "errors"):
        if item.get("node_id") == node_id:
            error_items.append(
                {
                    "id": item.get("id"),
                    "type": item.get("type"),
                    "description": item.get("description"),
                    "diagnosis": item.get("diagnosis"),
                    "trigger": item.get("trigger"),
                    "frequency": item.get("frequency"),
                }
            )
    exercise_items = []
    for item in coerce_item_list(bundle.exercises, "exercises"):
        if item.get("node_id") == node_id:
            exercise_items.append(
                {
                    "id": item.get("id"),
                    "bloom_level": item.get("bloom_level"),
                    "difficulty": item.get("difficulty"),
                    "type": item.get("type"),
                    "stem": item.get("stem"),
                }
            )
    return {
        "subject": bundle.subject,
        "domain": bundle.domain,
        "curriculum": bundle.graph.get("curriculum"),
        "node": {
            "id": node.get("id"),
            "name": node.get("name"),
            "name_en": node.get("name_en"),
            "grade": node.get("grade"),
            "semester": node.get("semester"),
            "unit": node.get("unit"),
            "definition": node.get("definition"),
            "key_concepts": node.get("key_concepts", []),
            "prerequisites": summarize_refs(node.get("prerequisites", []), node_index, node_home),
            "leads_to": summarize_refs(node.get("leads_to", []), node_index, node_home),
            "real_world": node.get("real_world", []),
            "memory_anchors": node.get("memory_anchors", []),
            "bloom_verbs": node.get("bloom_verbs", {}),
        },
        "error_count": len(error_items),
        "exercise_count": len(exercise_items),
        "errors": error_items[:max_errors],
        "exercises": exercise_items[:max_exercises],
        "source_files": {
            "graph": str(bundle.graph_path.relative_to(ROOT)),
            "errors": str(bundle.errors_path.relative_to(ROOT)) if bundle.errors_path else None,
            "exercises": str(bundle.exercises_path.relative_to(ROOT)) if bundle.exercises_path else None,
        },
    }


def domain_readiness_label(has_graph: bool, has_errors: bool, has_exercises: bool) -> str:
    if has_graph and has_errors and has_exercises:
        return "full"
    if has_graph and (has_errors or has_exercises):
        return "partial+"
    if has_graph:
        return "graph-only"
    return "missing"


def audit_bundles(bundles: List[DomainBundle], subject: Optional[str] = None) -> Dict[str, Any]:
    subject = resolve_subject(subject)
    filtered = [b for b in bundles if not subject or b.subject == subject]
    node_index, node_home = build_global_indices(filtered)
    issues: List[Dict[str, Any]] = []
    subject_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "domains": 0,
        "graph_domains": 0,
        "error_domains": 0,
        "exercise_domains": 0,
        "nodes": 0,
        "edges": 0,
    })
    global_node_counter: Counter[str] = Counter()

    for bundle in filtered:
        graph_nodes = bundle.graph.get("nodes", [])
        graph_edges = bundle.graph.get("edges", [])
        has_graph = True
        has_errors = bundle.errors is not None
        has_exercises = bundle.exercises is not None

        s = subject_stats[bundle.subject]
        s["domains"] += 1
        s["graph_domains"] += 1 if has_graph else 0
        s["error_domains"] += 1 if has_errors else 0
        s["exercise_domains"] += 1 if has_exercises else 0
        s["nodes"] += len(graph_nodes)
        s["edges"] += len(graph_edges)

        if not has_errors:
            issues.append({
                "severity": "medium",
                "subject": bundle.subject,
                "domain": bundle.domain,
                "type": "missing_errors",
                "message": "缺少 _errors.json，错因诊断与干扰项支持不足",
            })
        if not has_exercises:
            issues.append({
                "severity": "medium",
                "subject": bundle.subject,
                "domain": bundle.domain,
                "type": "missing_exercises",
                "message": "缺少 _exercises.json，分层练习与题库复用不足",
            })

        local_ids = set()
        for node in graph_nodes:
            node_id = node.get("id")
            if not node_id:
                issues.append({
                    "severity": "high",
                    "subject": bundle.subject,
                    "domain": bundle.domain,
                    "type": "missing_node_id",
                    "message": "存在缺少 id 的知识点节点",
                })
                continue
            global_node_counter[node_id] += 1
            if node_id in local_ids:
                issues.append({
                    "severity": "high",
                    "subject": bundle.subject,
                    "domain": bundle.domain,
                    "type": "duplicate_node_id_in_domain",
                    "message": f"节点 ID 重复：{node_id}",
                })
            local_ids.add(node_id)
            missing_fields = [field for field in REQUIRED_NODE_FIELDS if field not in node]
            if missing_fields:
                issues.append({
                    "severity": "high",
                    "subject": bundle.subject,
                    "domain": bundle.domain,
                    "type": "missing_required_fields",
                    "message": f"节点 {node_id} 缺少字段：{', '.join(missing_fields)}",
                })

        for node in graph_nodes:
            node_id = node.get("id", "<unknown>")
            for rel_field in ("prerequisites", "leads_to"):
                for ref in node.get(rel_field, []):
                    if ref not in node_index:
                        issues.append({
                            "severity": "high",
                            "subject": bundle.subject,
                            "domain": bundle.domain,
                            "type": "dangling_node_ref",
                            "message": f"节点 {node_id} 的 {rel_field} 引用了不存在的 ID：{ref}",
                        })

        for edge in graph_edges:
            frm = edge.get("from")
            to = edge.get("to")
            if frm not in node_index or to not in node_index:
                issues.append({
                    "severity": "high",
                    "subject": bundle.subject,
                    "domain": bundle.domain,
                    "type": "dangling_edge_ref",
                    "message": f"边 {frm} -> {to} 引用了不存在的节点",
                })

        if has_errors:
            for item in coerce_item_list(bundle.errors, "errors"):
                node_id = item.get("node_id")
                if node_id not in node_index:
                    issues.append({
                        "severity": "high",
                        "subject": bundle.subject,
                        "domain": bundle.domain,
                        "type": "error_node_missing",
                        "message": f"错误项 {item.get('id')} 引用了不存在的 node_id：{node_id}",
                    })

        if has_exercises:
            local_error_ids = {item.get("id") for item in coerce_item_list(bundle.errors, "errors")}
            for item in coerce_item_list(bundle.exercises, "exercises"):
                node_id = item.get("node_id")
                if node_id not in node_index:
                    issues.append({
                        "severity": "high",
                        "subject": bundle.subject,
                        "domain": bundle.domain,
                        "type": "exercise_node_missing",
                        "message": f"题目 {item.get('id')} 引用了不存在的 node_id：{node_id}",
                    })
                for option in item.get("options", []):
                    error_id = option.get("error_id")
                    if error_id and error_id not in local_error_ids:
                        issues.append({
                            "severity": "high",
                            "subject": bundle.subject,
                            "domain": bundle.domain,
                            "type": "exercise_error_missing",
                            "message": f"题目 {item.get('id')} 引用了不存在的 error_id：{error_id}",
                        })

    duplicates = [node_id for node_id, count in global_node_counter.items() if count > 1]
    for node_id in duplicates:
        issues.append({
            "severity": "high",
            "subject": None,
            "domain": None,
            "type": "duplicate_node_id_global",
            "message": f"全局节点 ID 重复：{node_id}",
        })

    total_domains = len(filtered)
    total_nodes = sum(len(bundle.graph.get("nodes", [])) for bundle in filtered)
    graph_domains = total_domains
    error_domains = sum(1 for bundle in filtered if bundle.errors is not None)
    exercise_domains = sum(1 for bundle in filtered if bundle.exercises is not None)
    full_domains = sum(1 for bundle in filtered if bundle.errors is not None and bundle.exercises is not None)
    partial_domains = sum(1 for bundle in filtered if (bundle.errors is not None) ^ (bundle.exercises is not None))

    graph_coverage = 1.0 if total_domains else 0.0
    assessment_coverage = full_domains / total_domains if total_domains else 0.0
    metadata_issues = sum(1 for item in issues if item["type"] in {"missing_required_fields", "missing_node_id", "duplicate_node_id_in_domain", "duplicate_node_id_global", "dangling_node_ref", "dangling_edge_ref"})
    consistency_score = max(0.0, 1.0 - (metadata_issues / max(1, total_nodes)))
    courseware_readiness_score = 0.5 * graph_coverage + 0.35 * assessment_coverage + 0.15 * consistency_score

    if courseware_readiness_score >= 0.85:
        readiness = "ready"
        readiness_desc = "可以直接作为课程制作主知识底座"
    elif courseware_readiness_score >= 0.65:
        readiness = "mostly-ready"
        readiness_desc = "图谱足以支撑大部分课程制作，但练习/错因层仍需补强"
    else:
        readiness = "partial"
        readiness_desc = "只能作为部分知识底座，尚不足以稳定支撑课程生成闭环"

    return {
        "scope": subject or "all",
        "summary": {
            "domains": total_domains,
            "nodes": total_nodes,
            "graph_domains": graph_domains,
            "error_domains": error_domains,
            "exercise_domains": exercise_domains,
            "full_domains": full_domains,
            "partial_domains": partial_domains,
            "graph_coverage_ratio": round(graph_coverage, 4),
            "assessment_coverage_ratio": round(assessment_coverage, 4),
            "consistency_score": round(consistency_score, 4),
            "courseware_readiness_score": round(courseware_readiness_score, 4),
            "courseware_readiness": readiness,
            "courseware_readiness_desc": readiness_desc,
        },
        "by_subject": dict(subject_stats),
        "issues": issues,
    }


def print_audit_human(report: Dict[str, Any]) -> None:
    summary = report["summary"]
    print("# TeachAny Knowledge Layer Audit")
    print(f"Scope: {report['scope']}")
    print()
    print("## Summary")
    print(f"- Domains: {summary['domains']}")
    print(f"- Nodes: {summary['nodes']}")
    print(f"- Graph coverage: {summary['graph_domains']}/{summary['domains']} ({summary['graph_coverage_ratio']:.0%})")
    print(f"- Error DB coverage: {summary['error_domains']}/{summary['domains']}")
    print(f"- Exercise DB coverage: {summary['exercise_domains']}/{summary['domains']}")
    print(f"- Full teaching bundles (_graph + _errors + _exercises): {summary['full_domains']}/{summary['domains']}")
    print(f"- Consistency score: {summary['consistency_score']:.0%}")
    print(f"- Courseware readiness: {summary['courseware_readiness']} ({summary['courseware_readiness_score']:.0%})")
    print(f"- Conclusion: {summary['courseware_readiness_desc']}")
    print()
    print("## By Subject")
    for subject, stats in sorted(report["by_subject"].items()):
        print(
            f"- {subject}: domains={stats['domains']}, nodes={stats['nodes']}, "
            f"errors={stats['error_domains']}, exercises={stats['exercise_domains']}"
        )
    high = [item for item in report["issues"] if item["severity"] == "high"]
    medium = [item for item in report["issues"] if item["severity"] == "medium"]
    print()
    print("## Issues")
    print(f"- High severity: {len(high)}")
    print(f"- Medium severity: {len(medium)}")
    preview = high[:10] + medium[:10]
    for item in preview:
        scope = f"{item['subject']}/{item['domain']}" if item["subject"] and item["domain"] else "global"
        print(f"  - [{item['severity']}] {scope}: {item['message']}")
    if len(report["issues"]) > len(preview):
        print(f"  - ... {len(report['issues']) - len(preview)} more issue(s)")


def print_lookup_human(matches: List[Dict[str, Any]], topic: str) -> None:
    print(f"# Knowledge Layer Lookup: {topic}")
    if not matches:
        print("No matches found.")
        return
    for idx, item in enumerate(matches, 1):
        node = item["node"]
        print()
        print(f"## Match {idx}: {node['name']} ({item['subject']}/{item['domain']})")
        print(f"- Grade/Semester: {node['grade']} / {node['semester']}")
        print(f"- Unit: {node['unit']}")
        print(f"- Definition: {node['definition']}")
        print(f"- Key concepts: {'；'.join(node['key_concepts'])}")
        if node["prerequisites"]:
            print("- Prerequisites: " + "；".join(
                ref["name"] or ref["id"] for ref in node["prerequisites"]
            ))
        if node["leads_to"]:
            print("- Leads to: " + "；".join(
                ref["name"] or ref["id"] for ref in node["leads_to"]
            ))
        if node["real_world"]:
            print("- Real-world anchors: " + "；".join(node["real_world"]))
        if node["memory_anchors"]:
            print("- Memory anchors: " + "；".join(node["memory_anchors"]))
        print(f"- Errors available: {item['error_count']}")
        print(f"- Exercises available: {item['exercise_count']}")
        if item["errors"]:
            print("- Error preview:")
            for err in item["errors"]:
                print(f"  - {err['description']}｜{err['diagnosis']}")
        if item["exercises"]:
            print("- Exercise preview:")
            for ex in item["exercises"]:
                print(f"  - [{ex['bloom_level']}] {ex['stem']}")
        print("- Source files:")
        print(f"  - graph: {item['source_files']['graph']}")
        if item['source_files']['errors']:
            print(f"  - errors: {item['source_files']['errors']}")
        if item['source_files']['exercises']:
            print(f"  - exercises: {item['source_files']['exercises']}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="TeachAny Knowledge Layer utilities")
    sub = parser.add_subparsers(dest="command", required=True)

    audit = sub.add_parser("audit", help="Audit completeness/readiness of the knowledge layer")
    audit.add_argument("--subject", help="Restrict to one subject, e.g. math / 数学")
    audit.add_argument("--json", action="store_true", help="Print JSON report")

    lookup = sub.add_parser("lookup", help="Lookup compact topic context from the knowledge layer")
    lookup.add_argument("--topic", required=True, help="Topic keyword, e.g. 一次函数 / photosynthesis")
    lookup.add_argument("--subject", help="Optional subject filter")
    lookup.add_argument("--top", type=int, default=3, help="Maximum number of matches to return")
    lookup.add_argument("--errors", type=int, default=3, help="Max error items per node")
    lookup.add_argument("--exercises", type=int, default=3, help="Max exercise items per node")
    lookup.add_argument("--json", action="store_true", help="Print JSON result")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    bundles = load_bundles(DATA_DIR)

    if args.command == "audit":
        report = audit_bundles(bundles, subject=args.subject)
        if args.json:
            print(json.dumps(report, ensure_ascii=False, indent=2))
        else:
            print_audit_human(report)
        return 0

    if args.command == "lookup":
        matches = find_matches(bundles, topic=args.topic, subject=args.subject)
        node_index, node_home = build_global_indices(bundles)
        compact = [
            compact_node_summary(bundle, node, node_index, node_home, args.errors, args.exercises)
            for _, bundle, node in matches[: args.top]
        ]
        payload = {
            "topic": args.topic,
            "subject": resolve_subject(args.subject) if args.subject else None,
            "match_count": len(matches),
            "matches": compact,
        }
        if args.json:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
        else:
            print_lookup_human(compact, args.topic)
        return 0

    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
