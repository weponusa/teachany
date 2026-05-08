#!/usr/bin/env python3
"""构建 TeachAny 标准知识图谱模块的节点索引。

产出 scripts/teachany-kg-manifest.json，包含：
{
  "generated": "2026-05-05",
  "nodes": {
    "<node_id>": {
      "id": "chn-e-compound-vowel",
      "name": "复韵母",
      "name_en": "Compound Finals",
      "subject": "chinese",
      "stage": "elementary",
      "grade": 1,
      "domain": "拼音",
      "domain_color": "#f43f5e",
      "curriculum_points": [...],
      "prerequisites": ["chn-e-simple-vowels"],
      "extends": [],
      "parallel": [],
      "siblings": ["chn-e-simple-vowels", ...],   # 同 domain 其他节点，截断 6 个
      "next": ["chn-e-..."],                       # 谁把我列为 prerequisite
      "courses": [{"id": "...", "name": "...", "path": "...", "source": "..."}],
      "hero_image": "chinese/compound-vowel-hero.png"
    },
    ...
  }
}
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TREES_DIR = ROOT / "data" / "trees"
# v5.38（方案 Y+）：废弃 data/knowledge-points/*.json，
# v2026-05: 进一步删除 skill/data/kp-md/ 目录（1537 个 md 文件合并回 data/trees/**/*.json），
#   不再依赖 kp-md-manifest.json 的 description / md_file 字段（仅保留做节点索引）。
# Hero 图改用 skill/assets/image-registry.json 的 match_nodes 反查。
KP_MD_MANIFEST = ROOT / "skill" / "data" / "kp-md-manifest.json"
IMAGE_REGISTRY = ROOT / "skill" / "assets" / "image-registry.json"
OUT = ROOT / "scripts" / "teachany-kg-manifest.json"

def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None

def collect_trees():
    all_nodes = {}
    domain_index = {}
    for path in sorted(TREES_DIR.rglob("*.json")):
        if path.name.startswith("_"):
            continue
        data = load_json(path)
        if not data:
            continue
        rel_parts = path.relative_to(TREES_DIR).parts
        curriculum = rel_parts[0] if len(rel_parts) >= 2 else data.get("curriculum") or ""
        stage = rel_parts[1] if len(rel_parts) >= 3 else data.get("stage") or ""
        subject = data.get("subject") or path.stem
        for domain in data.get("domains") or []:
            dname = domain.get("name") or domain.get("id") or ""
            dcolor = domain.get("color") or "#3b82f6"
            for node in domain.get("nodes") or []:
                node_id = node.get("id")
                if not node_id:
                    continue
                record = {
                    "id": node_id,
                    "name": node.get("name"),
                    "name_en": node.get("name_en") or "",
                    "grade": node.get("grade"),
                    "subject": subject,
                    "stage": stage or "",
                    "curriculum": curriculum or "",
                    "domain": dname,
                    "domain_color": dcolor,
                    "prerequisites": list(node.get("prerequisites") or []),
                    "extends": list(node.get("extends") or []),
                    "parallel": list(node.get("parallel") or []),
                    "curriculum_points": list(node.get("curriculum_points") or []),
                    "textbook_chapter": node.get("textbook_chapter") or "",
                    "status": node.get("status") or "",
                    "courses_ids": list(node.get("courses") or []),
                }
                all_nodes[node_id] = record
                domain_index.setdefault((curriculum, stage, subject, dname), []).append(node_id)
    return all_nodes, domain_index

def enrich_kp(all_nodes):
    """从 skill/assets/image-registry.json 的 match_nodes 反查 hero_image。
    v2026-05: skill/data/kp-md/ 目录已删除，所有课标内容统一在 data/trees/**/*.json 的 curriculum_points 字段。
    """
    # hero_image：image-registry → match_nodes 反向索引
    reg = load_json(IMAGE_REGISTRY) or {}
    images = reg.get("images") if isinstance(reg, dict) else None
    if isinstance(images, list):
        # 同一个 node 可能命中多张，优先 slot=hero
        node_to_img = {}
        for img in images:
            slot = img.get("slot") or ""
            file_ = img.get("file") or ""
            for nid in img.get("match_nodes") or []:
                # 优先级：slot=hero > 其它
                cur = node_to_img.get(nid)
                if cur is None:
                    node_to_img[nid] = (slot, file_)
                else:
                    if cur[0] != "hero" and slot == "hero":
                        node_to_img[nid] = (slot, file_)
        for nid, (slot, file_) in node_to_img.items():
            if nid in all_nodes and file_:
                all_nodes[nid]["hero_image"] = file_

def build_next_index(all_nodes):
    rev = {}
    for nid, node in all_nodes.items():
        for pre in node.get("prerequisites") or []:
            rev.setdefault(pre, []).append(nid)
    for nid, node in all_nodes.items():
        node["next"] = rev.get(nid, [])

def attach_siblings(all_nodes, domain_index):
    for (cur, stage, subject, dname), ids in domain_index.items():
        for nid in ids:
            siblings = [x for x in ids if x != nid]
            all_nodes[nid]["siblings"] = siblings[:8]

def attach_courses(all_nodes):
    # 以 registry.json 为准：rebuild-index.py 会扫描 examples/ + community/ 并写入所有实际存在课件。
    # 不再依赖旧 courseware-registry.json，否则社区上传课件会在标准图谱中显示为“无课件”。
    registry = load_json(ROOT / "registry.json") or {}
    node_courses = {}
    def walk(obj):
        if isinstance(obj, list):
            for x in obj:
                walk(x)
        elif isinstance(obj, dict):
            if obj.get("node_id") and obj.get("id"):
                node_courses.setdefault(obj["node_id"], []).append({
                    "id": obj["id"],
                    "name": obj.get("name") or obj.get("name_zh") or obj["id"],
                    "path": obj.get("path"),
                    "source": obj.get("source") or "",
                })
            for v in obj.values():
                walk(v)
    walk(registry)
    for nid, node in all_nodes.items():
        courses = node_courses.get(nid) or []
        # 只保留 examples/ 或 community/ 下实际有 index.html 的课件
        real_courses = []
        for c in courses:
            pth = c.get("path")
            if not pth:
                continue
            index_path = ROOT / pth / "index.html"
            if index_path.exists():
                real_courses.append(c)
        seen = set()
        final = []
        def rank(c):
            src = c.get("source") or ""
            return 0 if src == "examples" else 1
        for c in sorted(real_courses, key=rank):
            k = c.get("id")
            if k in seen:
                continue
            seen.add(k)
            final.append(c)
        node["courses"] = final

def main():
    all_nodes, domain_index = collect_trees()
    enrich_kp(all_nodes)
    build_next_index(all_nodes)
    attach_siblings(all_nodes, domain_index)
    attach_courses(all_nodes)
    # 清理冗余字段
    for node in all_nodes.values():
        node.pop("courses_ids", None)
    OUT.write_text(json.dumps({
        "version": "1.0",
        "generated_by": "build-teachany-kg-manifest.py",
        "node_count": len(all_nodes),
        "nodes": all_nodes,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ 生成 {OUT} （{len(all_nodes)} 个节点）")

if __name__ == "__main__":
    main()
