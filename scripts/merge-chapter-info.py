#!/usr/bin/env python3
"""
把老 data/_legacy/resources/**/_graph.json 里的 unit/semester/chapter 信息
按中文名匹配合并到新 data/trees/cn/**/*.json 每个节点。

为每个节点新增 3 个字段：
  - textbook_chapter: 教材章节编号（如 "必修一 第3章" / "第5单元 化学方程式"）
  - textbook_semester: 学期（"上" / "下"）
  - chapter_source: 数据来源标记（"legacy_graph" / "manual" / "ai_research"）

只写有匹配结果的节点，没匹配到的节点保持原样（字段不存在 = 尚未录入）。
"""
import json
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEGACY_GLOB = str(ROOT / "data/_legacy/resources/**/_graph.json")
TREE_GLOB = str(ROOT / "data/trees/cn/**/*.json")


def load_legacy_by_name():
    """老 _graph.json 按 name 索引"""
    by_name = {}
    for f in glob.glob(LEGACY_GLOB, recursive=True):
        try:
            d = json.load(open(f))
            for n in d.get("nodes", []):
                name = n.get("name")
                if not name:
                    continue
                # 只存第一次遇到的（避免重复覆盖）
                if name not in by_name:
                    by_name[name] = {
                        "legacy_id": n.get("id"),
                        "unit": n.get("unit"),
                        "semester": n.get("semester"),
                        "grade": n.get("grade"),
                        "source_file": f.replace(str(ROOT) + "/", ""),
                    }
        except Exception as e:
            print(f"⚠️  读老文件失败 {f}: {e}")
    return by_name


def merge_into_tree(tree_file, legacy_by_name):
    """把章节信息合并进一棵树。返回 (匹配数, 总节点数)"""
    d = json.load(open(tree_file))
    matched = 0
    total = 0
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            total += 1
            name = n.get("name", "")
            if name in legacy_by_name:
                legacy = legacy_by_name[name]
                if legacy.get("unit"):
                    n["textbook_chapter"] = legacy["unit"]
                    n["textbook_semester"] = legacy.get("semester")
                    n["chapter_source"] = "legacy_graph"
                    matched += 1
    # 写回
    with open(tree_file, "w") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    return matched, total


def main():
    legacy = load_legacy_by_name()
    print(f"📖 从老 _graph.json 载入 {len(legacy)} 个按中文名索引的节点")
    print()

    grand_matched = 0
    grand_total = 0
    for f in sorted(glob.glob(TREE_GLOB, recursive=True)):
        matched, total = merge_into_tree(f, legacy)
        rel = f.replace(str(ROOT) + "/", "")
        pct = (matched / total * 100) if total else 0
        print(f"  {rel}: {matched}/{total} ({pct:.1f}%)")
        grand_matched += matched
        grand_total += total

    print()
    print(f"═══════════════════════════════════════")
    print(f"  总计: {grand_matched}/{grand_total} ({grand_matched / grand_total * 100:.1f}%)")
    print(f"═══════════════════════════════════════")
    print()
    print(f"待补齐: {grand_total - grand_matched} 个节点（需 Phase 3 手动/AI 研究补全）")


if __name__ == "__main__":
    main()
