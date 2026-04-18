#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P0 批量清污脚本（v5.24）
针对 data/trees/*.json 中 AI 自动扩展引入的系统性污染：

1. 清污染 prerequisites：被 ≥4 个同级节点单一依赖的"吸星"前置 → 清空这些异常节点的 prerequisites
2. 去重节点：同一棵树中 name 近义 + 同 domain 的重复节点（保留 id 更规范的一个）
3. grade 规范化：字符串 "1"/"2"/"3" 转数字 1/2/3；区间如 "4-6" 保留字符串
4. 英文域名中文化：domain.name 若为纯英文则自动翻译为对应中文
5. 按 grade 自动补前置：被清空的节点，按其 grade 向前找同 domain 最近的合法节点作为默认前置

用法：
    python3 scripts/clean-tree-pollution.py            # 干跑（dry-run），只报告
    python3 scripts/clean-tree-pollution.py --apply    # 实际写入
备份：
    原文件会先备份到 data/trees/_backup_YYYYMMDD/
"""

import json
import re
import sys
import os
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict

TREES_DIR = Path(__file__).resolve().parent.parent / "data" / "trees"

# -------- 配置：英文域名 → 中文 --------
DOMAIN_EN2CN = {
    # 通用
    "Grammar": "语法",
    "Reading": "阅读",
    "Writing": "写作",
    "Reading Writing": "读写",
    "Classical Chinese": "古诗文",
    "Junior Biology": "生物基础",
    "Genetics Evolution": "遗传与进化",
    "Chemical Reactions": "化学反应",
    "Matter Structure": "物质结构",
    "Solution Metals": "溶液与金属",
    "Mechanics": "力学",
    "Thermodynamics": "热学",
    "Optics": "光学",
    "Algorithms": "算法",
    "Network Security": "网络安全",
    "Programming": "程序设计",
    "Physical Geography": "自然地理",
    "Regional Geography": "区域地理",
    "Map Skills": "地图技能",
    "Ancient China": "中国古代史",
    "Thematic History": "专题史",
    "World History": "世界史",
    "Elementary English": "基础英语",
    "Numbers Operations": "数与运算",
    "Geometry Primary": "图形与几何",
    "Statistics Probability Primary": "统计与概率",
    "Algebra": "代数",
    "Functions": "函数",
    "High School": "高中",
}

# -------- 污染检测阈值 --------
POLLUTION_THRESHOLD = 4   # 同一个前置被 ≥4 个节点单一依赖即为"吸星"

def is_ascii_only(s):
    return bool(s) and all(ord(c) < 128 for c in s)

def normalize_grade(g):
    """字符串数字 → int；区间保留字符串；None/其他 原样"""
    if isinstance(g, int):
        return g
    if isinstance(g, str):
        s = g.strip()
        if re.fullmatch(r"\d+", s):
            return int(s)
        # 区间如 "4-6" / "3-9"，保持字符串
        return s
    return g

def detect_pollutants(tree):
    """返回集中被单一依赖的"吸星"节点 id 集合"""
    counter = Counter()
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            p = n.get("prerequisites", [])
            if len(p) == 1:
                counter[p[0]] += 1
    return {k for k, v in counter.items() if v >= POLLUTION_THRESHOLD}

def find_default_prereq(node, domain_nodes, all_nodes_by_id):
    """为被清空 prerequisites 的节点找合理默认前置：
       同 domain 内，grade 严格小于本节点（int 对 int 比较），且不是本节点自己的
       取 grade 最接近的一个节点 id；若找不到则返回 []"""
    my_grade = node.get("grade")
    if not isinstance(my_grade, int):
        return []
    candidates = []
    for n in domain_nodes:
        if n["id"] == node["id"]:
            continue
        g = n.get("grade")
        if isinstance(g, int) and g < my_grade:
            candidates.append((g, n["id"]))
    if not candidates:
        return []
    candidates.sort(key=lambda x: -x[0])  # grade 最大（最接近本节点）的先
    return [candidates[0][1]]

def dedupe_nodes(tree):
    """去除同一棵树中的重复节点：按 (domain_id, normalized_name) 聚类
       规范化 name 去除常见后缀/括号内容，id 更短/更规范的优先保留"""
    removed = []
    for d in tree.get("domains", []):
        seen = {}  # key -> kept_node
        kept = []
        for n in d.get("nodes", []):
            # 规范化 name：去括号内容 + 去空白
            name_key = re.sub(r"[（(].*?[)）]", "", n.get("name", "")).strip()
            name_key = re.sub(r"\s+", "", name_key)
            # 一些专项同义词归并
            synonym_map = {
                "笔画笔顺": "笔画与笔顺",
                "汉字结构": "汉字结构",
                "偏旁部首": "偏旁部首",
            }
            name_key = synonym_map.get(name_key, name_key)
            if not name_key:
                kept.append(n)
                continue
            if name_key in seen:
                existing = seen[name_key]
                # id 更短或更规范（不带后缀数字、不带 -recognition 等）的优先
                def score(x):
                    xid = x["id"]
                    s = 0
                    # 节点关联了课件 → 强保留
                    if x.get("courses"):
                        s += 1000
                    # prerequisites 更合理（非空 + 非污染）→ 加分
                    if x.get("prerequisites"):
                        s += 10
                    # id 更短 → 加分
                    s += max(0, 30 - len(xid))
                    return s
                if score(n) > score(existing):
                    removed.append(existing["id"])
                    seen[name_key] = n
                    # 替换 kept 中的 existing
                    kept = [k for k in kept if k["id"] != existing["id"]]
                    kept.append(n)
                else:
                    removed.append(n["id"])
            else:
                seen[name_key] = n
                kept.append(n)
        d["nodes"] = kept
    return removed

def fix_references_after_dedupe(tree, removed_ids):
    """删除其他节点的 prerequisites/extends/parallel 中指向已删节点的引用"""
    if not removed_ids:
        return
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            for key in ("prerequisites", "extends", "parallel"):
                if key in n:
                    n[key] = [x for x in n[key] if x not in removed_ids]

def translate_domain_names(tree):
    """英文域名 → 中文"""
    changed = []
    for d in tree.get("domains", []):
        nm = d.get("name", "")
        if is_ascii_only(nm) and nm in DOMAIN_EN2CN:
            old = nm
            d["name"] = DOMAIN_EN2CN[nm]
            changed.append((old, d["name"]))
        elif is_ascii_only(nm):
            # 纯英文但不在词典里，打印警告
            changed.append((nm, f"[!未翻译] {nm}"))
    return changed

def normalize_grades(tree):
    """grade 字符串数字转 int"""
    cnt = 0
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            g = n.get("grade")
            new_g = normalize_grade(g)
            if new_g != g:
                n["grade"] = new_g
                cnt += 1
    return cnt

def clean_pollutants(tree, pollutants):
    """被污染的节点：清空 prerequisites 并尝试补合理默认前置"""
    cleaned = []
    all_by_id = {}
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            all_by_id[n["id"]] = n
    for d in tree.get("domains", []):
        domain_nodes = d.get("nodes", [])
        for n in domain_nodes:
            p = n.get("prerequisites", [])
            if len(p) == 1 and p[0] in pollutants:
                # 不是污染节点自己才清
                if n["id"] != p[0]:
                    old = list(p)
                    # 尝试补默认前置
                    new_p = find_default_prereq(n, domain_nodes, all_by_id)
                    n["prerequisites"] = new_p
                    cleaned.append((n["id"], old, new_p))
    return cleaned

def remove_self_loops(tree):
    """移除 prerequisites 里指向自己的自环"""
    cnt = 0
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            for key in ("prerequisites", "extends", "parallel"):
                if key in n:
                    original = n[key]
                    new_v = [x for x in original if x != n["id"]]
                    if new_v != original:
                        n[key] = new_v
                        cnt += len(original) - len(new_v)
    return cnt

def validate_references(tree):
    """校验引用完整性：prerequisites/extends/parallel 所指 id 必须存在"""
    all_ids = set()
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            all_ids.add(n["id"])
    orphans = []
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            for key in ("prerequisites", "extends", "parallel"):
                for ref in n.get(key, []):
                    if ref not in all_ids:
                        orphans.append((n["id"], key, ref))
    return orphans

def fix_orphans(tree, orphans):
    """清除所有指向不存在节点的引用"""
    broken_refs = {(oid, key, ref) for oid, key, ref in orphans}
    for d in tree.get("domains", []):
        for n in d.get("nodes", []):
            for key in ("prerequisites", "extends", "parallel"):
                if key in n:
                    n[key] = [x for x in n[key] if (n["id"], key, x) not in broken_refs]

def process_tree(path, apply=False):
    tree = json.load(open(path, encoding="utf-8"))
    report = {"file": path.name, "before_nodes": sum(len(d["nodes"]) for d in tree.get("domains", []))}

    # 1. 翻译域名
    report["domain_translations"] = translate_domain_names(tree)

    # 2. 规范化 grade
    report["grades_normalized"] = normalize_grades(tree)

    # 3. 检测并清污染前置
    pollutants = detect_pollutants(tree)
    report["pollutants"] = list(pollutants)
    report["cleaned_nodes"] = clean_pollutants(tree, pollutants)

    # 4. 去重节点
    removed = dedupe_nodes(tree)
    report["deduped_nodes"] = removed
    fix_references_after_dedupe(tree, set(removed))

    # 5. 移除自环
    report["self_loops_removed"] = remove_self_loops(tree)

    # 6. 校验 & 修复孤儿引用
    orphans = validate_references(tree)
    if orphans:
        fix_orphans(tree, orphans)
    report["orphan_refs_fixed"] = orphans

    report["after_nodes"] = sum(len(d["nodes"]) for d in tree.get("domains", []))

    if apply:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(tree, f, ensure_ascii=False, indent=2)
    return report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="真写入（否则 dry-run）")
    args = ap.parse_args()

    files = sorted(TREES_DIR.glob("*.json"))
    if args.apply:
        bk_dir = TREES_DIR / f"_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        bk_dir.mkdir(exist_ok=True)
        for f in files:
            shutil.copy2(f, bk_dir / f.name)
        print(f"✅ 已备份到 {bk_dir}\n")

    total_report = []
    for f in files:
        rpt = process_tree(f, apply=args.apply)
        total_report.append(rpt)

    print("=" * 78)
    print(f"{'文件':<28} {'节点':>5} {'污染前置':>8} {'清净数':>6} {'去重':>5} {'域名译':>6}")
    print("-" * 78)
    for r in total_report:
        delta = r["after_nodes"] - r["before_nodes"]
        delta_s = f"{r['before_nodes']}→{r['after_nodes']}"
        print(f"{r['file']:<28} {delta_s:>5} {len(r['pollutants']):>8} {len(r['cleaned_nodes']):>6} {len(r['deduped_nodes']):>5} {len([x for x in r['domain_translations'] if '!' not in x[1]]):>6}")
    print("=" * 78)

    # 详细报告（污染清理明细）
    print("\n【污染前置清理详情】")
    for r in total_report:
        if r["cleaned_nodes"]:
            print(f"\n── {r['file']} ── 污染前置: {r['pollutants']}")
            for nid, old, new in r["cleaned_nodes"][:5]:
                print(f"   {nid}: {old} → {new}")
            if len(r["cleaned_nodes"]) > 5:
                print(f"   ... 以及 {len(r['cleaned_nodes'])-5} 条")

    # 未翻译的英文域名
    untranslated = []
    for r in total_report:
        for old, new in r["domain_translations"]:
            if "!" in new:
                untranslated.append((r["file"], old))
    if untranslated:
        print("\n【⚠ 未自动翻译的英文域名】")
        for f, nm in untranslated:
            print(f"   {f}: {nm}")

    # 孤儿引用报告
    total_orphans = sum(len(r["orphan_refs_fixed"]) for r in total_report)
    print(f"\n孤儿引用修复总数: {total_orphans}")

    if not args.apply:
        print("\n💡 以上是 dry-run 报告。确认无误后用 --apply 真写入。")

if __name__ == "__main__":
    main()
