#!/usr/bin/env python3
"""扫描所有 trees，检查每个知识点是否已填充课标内容。

课标内容来源（按优先级）：
1. tree 节点的 curriculum_points 字段（inline 存储）
2. excerpts 文件中匹配该 node_id 的条目
"""
import json
from pathlib import Path

BASE = Path(__file__).parent / "data"
TREES = BASE / "trees"
EXCERPTS = BASE / "excerpts"


def iter_nodes(tree):
    """从 tree 的各种结构中迭代所有节点（含 id 的字典）"""
    def walk(node):
        if isinstance(node, dict):
            if "id" in node and ("name" in node or "name_en" in node):
                yield node
            for k, v in node.items():
                if k in ("prerequisites", "extends", "parallel", "courses"):
                    continue
                yield from walk(v)
        elif isinstance(node, list):
            for item in node:
                yield from walk(item)

    yield from walk(tree)


def load_excerpts_keys(path):
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return set()
    items = data if isinstance(data, list) else data.get("excerpts", [])
    covered = set()
    for ex in items:
        if not isinstance(ex, dict):
            continue
        if ex.get("node_id"):
            covered.add(ex["node_id"])
        if isinstance(ex.get("node_ids"), list):
            covered.update(ex["node_ids"])
        kp_id = ex.get("kp_id")
        if isinstance(kp_id, str):
            covered.add(kp_id)
            if kp_id.startswith("kp-"):
                covered.add(kp_id[3:])
        if isinstance(ex.get("kp_ids"), list):
            for k in ex["kp_ids"]:
                if isinstance(k, str):
                    covered.add(k)
                    if k.startswith("kp-"):
                        covered.add(k[3:])
    return covered


def is_in_excerpts(node_id, covered_set):
    if not covered_set:
        return False
    if node_id in covered_set:
        return True
    for c in covered_set:
        if c == node_id or c.endswith("-" + node_id) or c.endswith(node_id):
            return True
    return False


def main():
    results = []
    total_kp = 0
    total_cov = 0
    missing_detail = {}

    for sys_dir in sorted(TREES.iterdir()):
        if not sys_dir.is_dir():
            continue
        for tree_file in sorted(sys_dir.rglob("*.json")):
            rel = tree_file.relative_to(TREES)
            try:
                tree = json.loads(tree_file.read_text(encoding="utf-8"))
            except Exception as e:
                results.append((str(rel), 0, 0, 0, 0, f"err:{e}"))
                continue

            covered_ex = load_excerpts_keys(EXCERPTS / rel)

            kp_total = 0
            kp_inline = 0      # 靠 curriculum_points 覆盖
            kp_external = 0    # 靠 excerpts 文件覆盖
            kp_missing = []

            for node in iter_nodes(tree):
                nid = node.get("id")
                # 排除顶层/domain 节点（通常没 grade / status 字段）
                # 但为保险起见，以是否存在 curriculum_points / status / grade 判断是否为知识点
                is_kp = (
                    "curriculum_points" in node
                    or "status" in node
                    or "grade" in node
                    or "prerequisites" in node
                )
                if not is_kp:
                    continue
                kp_total += 1
                cps = node.get("curriculum_points") or []
                if isinstance(cps, list) and len(cps) > 0 and any(
                    isinstance(x, str) and x.strip() for x in cps
                ):
                    kp_inline += 1
                elif is_in_excerpts(nid, covered_ex):
                    kp_external += 1
                else:
                    kp_missing.append(nid)

            cov_cnt = kp_inline + kp_external
            results.append((str(rel), kp_total, kp_inline, kp_external, cov_cnt,
                            "ok" if kp_total else "EMPTY"))
            total_kp += kp_total
            total_cov += cov_cnt
            if kp_missing:
                missing_detail[str(rel)] = kp_missing

    # 汇总
    print(f"{'File':55s} {'KP':>4s} {'inl':>4s} {'ext':>4s} {'Cov':>4s} {'Rate':>7s}")
    print("-" * 90)
    for rel, kp, inl, ext, cov, st in results:
        rate = f"{cov*100/kp:.1f}%" if kp else "-"
        mark = "" if (kp and cov == kp) else ("  ⚠" if kp else "  [EMPTY]")
        print(f"{rel:55s} {kp:>4d} {inl:>4d} {ext:>4d} {cov:>4d} {rate:>7s}{mark}")
    print("-" * 90)
    rate_total = total_cov * 100 / total_kp if total_kp else 0
    print(f"{'TOTAL':55s} {total_kp:>4d} {' ':>4s} {' ':>4s} {total_cov:>4d} {rate_total:>6.2f}%")

    # 缺失细节
    if missing_detail:
        print("\n\n===== 缺失知识点详情（无 curriculum_points 也无 excerpts）=====")
        for rel in sorted(missing_detail.keys()):
            miss = missing_detail[rel]
            print(f"\n## {rel}  (缺失 {len(miss)})")
            for m in miss[:30]:
                print(f"  - {m}")
            if len(miss) > 30:
                print(f"  ... 还有 {len(miss) - 30} 项")
    else:
        print("\n✅ 所有知识点都有课标内容！")

    out = BASE.parent / "coverage_report.json"
    out.write_text(json.dumps({
        "total_kp": total_kp,
        "total_covered": total_cov,
        "coverage_rate": rate_total,
        "per_file": [
            {"file": r[0], "kp": r[1], "inline": r[2], "external": r[3], "cov": r[4], "status": r[5]}
            for r in results
        ],
        "missing": missing_detail
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n报告: {out}")


if __name__ == "__main__":
    main()
