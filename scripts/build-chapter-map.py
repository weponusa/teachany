#!/usr/bin/env python3
"""
生成 data/node-chapter-map.json：
  以 node_id → {chapter, semester, grade, subject, stage, status} 的快速查询表。

  status = "mapped" | "pending"（等 Phase 3 补齐）
"""
import json
import glob
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
TREE_GLOB = str(ROOT / "data/trees/cn/**/*.json")
OUTPUT = ROOT / "data/node-chapter-map.json"


def main():
    mapping = {}
    stats = {
        "total": 0,
        "mapped": 0,
        "pending": 0,
        "by_subject": {},
        "by_stage": {},
    }

    for f in sorted(glob.glob(TREE_GLOB, recursive=True)):
        rel = f.replace(str(ROOT) + "/", "")
        # 从路径推出 stage + subject
        parts = rel.split("/")
        # data/trees/cn/middle/math.json → stage=middle, subject=math
        stage = parts[-2]
        subject = parts[-1].replace(".json", "")

        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                nid = n["id"]
                has_chapter = "textbook_chapter" in n
                entry = {
                    "subject": subject,
                    "stage": stage,
                    "grade": n.get("grade"),
                    "name": n.get("name"),
                    "status": "mapped" if has_chapter else "pending",
                }
                if has_chapter:
                    entry["chapter"] = n["textbook_chapter"]
                    entry["semester"] = n.get("textbook_semester")
                    entry["source"] = n.get("chapter_source", "legacy_graph")
                mapping[nid] = entry

                stats["total"] += 1
                if has_chapter:
                    stats["mapped"] += 1
                else:
                    stats["pending"] += 1
                stats["by_subject"][subject] = stats["by_subject"].get(subject, 0) + 1
                stats["by_stage"][stage] = stats["by_stage"].get(stage, 0) + 1

    output = {
        "_meta": {
            "version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "description": "中国国家课标节点 → 教材章节编号映射表。AI 用 find_nodes.py 查出 node_id 后，可在此表查章节。status=pending 表示尚未录入，需 AI 用 web_fetch ChinaTextbook 自行研究。",
            "schema": {
                "chapter": "教材章节，如「必修一 第3章」或「第5单元 化学方程式」",
                "semester": "上 / 下",
                "grade": "年级数字 1-12",
                "source": "legacy_graph (来自 _graph.json 迁移) | manual (人工录入) | ai_research (AI 研究得出)",
            },
            "stats": stats,
        },
        "mapping": mapping,
    }

    with open(OUTPUT, "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ 已生成 {OUTPUT}")
    print(f"   - 总节点数: {stats['total']}")
    print(f"   - 已映射: {stats['mapped']} ({stats['mapped'] / stats['total'] * 100:.1f}%)")
    print(f"   - 待补齐: {stats['pending']}")
    print()
    print(f"按学段:")
    for k, v in stats["by_stage"].items():
        print(f"   - {k}: {v}")


if __name__ == "__main__":
    main()
