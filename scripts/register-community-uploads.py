#!/usr/bin/env python3
"""规范化并注册 community/ 下新上传课件。

解决场景：用户上传的 manifest 只写了中文 subject/grade，或缺 node_id，
导致 rebuild-index 能扫描到文件，但无法挂到 data/trees，因此知识地图不显示。

当前覆盖：初中历史 hist-m-* 课件。
- subject: "历史" → "history"
- grade: "初一/初二/初三/初中七年级..." → 7/8/9
- node_id 缺失 → 使用目录名（若目录名为 hist-m-*）
- data/trees/cn/middle/history.json 缺节点 → 按 node_id/name 自动加入合适 domain
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMUNITY = ROOT / "community"
HISTORY_TREE = ROOT / "data" / "trees" / "cn" / "middle" / "history.json"
SKIP = {"pending", "drafts", "archive", "approved", "rejected"}

GRADE_MAP = {
    "初一": 7, "初中七年级": 7, "七年级": 7, "初中7年级": 7, "初中一年级": 7,
    "初二": 8, "初中八年级": 8, "八年级": 8, "初中8年级": 8, "初中二年级": 8,
    "初三": 9, "初中九年级": 9, "九年级": 9, "初中9年级": 9, "初中三年级": 9,
}

DOMAIN_RULES = [
    ("中国古代史", ["ming-qing", "mongol", "silk-road", "song-technology", "sui-tang"]),
    ("中国近代史", ["reform-opening", "anti-japan", "liberation", "may-fourth"]),
    ("世界近现代史", ["decolonization", "scientific-revolution", "united-nations", "ww2", "industrial", "english-revolution"]),
]

NAME_BY_ID = {
    "hist-m-china-reform-opening": "改革开放与中国特色社会主义",
    "hist-m-decolonization": "亚非拉民族解放运动",
    "hist-m-ming-qing-economy": "明清经济发展与对外关系",
    "hist-m-mongol-empire": "蒙古崛起与元朝统一",
    "hist-m-scientific-revolution": "欧洲科学革命与启蒙运动",
    "hist-m-silk-road": "丝绸之路与东西方交流",
    "hist-m-song-technology": "宋代科技与社会生活",
    "hist-m-sui-tang-ruling": "隋唐制度与盛世",
    "hist-m-united-nations": "联合国与战后国际秩序",
    "hist-m-ww2-asia-pacific": "第二次世界大战（亚太战场）",
}

CURRICULUM_POINTS = [
    "能够在具体时空背景中理解历史事件、制度与社会变迁。",
    "能够运用史料、地图、时间轴等材料解释历史现象之间的因果关系。",
]

def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default

def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def normalize_subject(v):
    if v in ("历史", "hist", "History"):
        return "history"
    return v or ""

def normalize_grade(v):
    if isinstance(v, int):
        return v
    s = str(v or "").strip()
    if s.isdigit():
        return int(s)
    return GRADE_MAP.get(s, v)

def infer_name(course_dir: Path, manifest: dict):
    if manifest.get("name"):
        return manifest["name"]
    title = manifest.get("title") or manifest.get("title_zh")
    if title:
        return title
    html = course_dir / "index.html"
    if html.exists():
        text = html.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r'<meta\s+name=["\']course-title["\']\s+content=["\']([^"\']+)["\']', text)
        if m: return m.group(1)
        m = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S)
        if m: return re.sub(r'<[^>]+>', '', m.group(1)).strip()
    return NAME_BY_ID.get(course_dir.name, course_dir.name)

def choose_domain(node_id: str):
    for domain, keys in DOMAIN_RULES:
        if any(k in node_id for k in keys):
            return domain
    return "世界近现代史" if node_id.startswith("hist-m-") else "中国近代史"

def tree_node_ids(tree):
    ids = set()
    for domain in tree.get("domains", []):
        for node in domain.get("nodes", []):
            if node.get("id"):
                ids.add(node["id"])
    return ids

def ensure_history_node(tree, node_id: str, name: str, grade: int, course_id: str):
    ids = tree_node_ids(tree)
    if node_id in ids:
        # ensure course id is present
        for domain in tree.get("domains", []):
            for node in domain.get("nodes", []):
                if node.get("id") == node_id:
                    courses = node.setdefault("courses", [])
                    if course_id not in courses:
                        courses.append(course_id)
                    node["status"] = "active"
                    return False
    domain_name = choose_domain(node_id)
    domains = tree.setdefault("domains", [])
    target = None
    for d in domains:
        if d.get("name") == domain_name:
            target = d
            break
    if target is None:
        target = {"name": domain_name, "color": "#b45309", "nodes": []}
        domains.append(target)
    target.setdefault("nodes", []).append({
        "id": node_id,
        "name": name,
        "name_en": "",
        "grade": grade,
        "prerequisites": [],
        "extends": [],
        "parallel": [],
        "courses": [course_id],
        "status": "active",
        "curriculum_points": CURRICULUM_POINTS,
        "textbook_chapter": "社区上传补充节点",
        "chapter_source": "community_upload_auto_register",
    })
    return True

def main():
    tree = load_json(HISTORY_TREE, {"domains": []})
    changed_manifest = 0
    added_nodes = 0
    ensured_nodes = 0
    for d in sorted(COMMUNITY.iterdir()):
        if not d.is_dir() or d.name.startswith(".") or d.name in SKIP:
            continue
        if not (d / "index.html").exists():
            continue
        mf = d / "manifest.json"
        if not mf.exists():
            continue
        manifest = load_json(mf, {})
        original = json.dumps(manifest, ensure_ascii=False, sort_keys=True)
        subject = normalize_subject(manifest.get("subject"))
        node_id = manifest.get("node_id") or (d.name if d.name.startswith("hist-m-") else "")
        grade = normalize_grade(manifest.get("grade"))
        name = infer_name(d, manifest)
        # 目前仅自动处理初中历史
        is_middle_history = subject == "history" and isinstance(grade, int) and 7 <= grade <= 9 and node_id.startswith("hist-m-")
        if not is_middle_history:
            continue
        manifest["id"] = manifest.get("id") or d.name
        manifest["course_id"] = manifest.get("course_id") or manifest["id"]
        manifest["name"] = name
        manifest["subject"] = "history"
        manifest["grade"] = grade
        manifest["node_id"] = node_id
        manifest["curriculum"] = manifest.get("curriculum") or "cn-national"
        manifest["domain"] = manifest.get("domain") or choose_domain(node_id)
        manifest["teachany_version"] = manifest.get("teachany_version") or manifest.get("version") or "7.7"
        manifest.setdefault("tags", ["初中", "历史", name])
        if json.dumps(manifest, ensure_ascii=False, sort_keys=True) != original:
            save_json(mf, manifest)
            changed_manifest += 1
        added = ensure_history_node(tree, node_id, name, grade, manifest["id"])
        added_nodes += 1 if added else 0
        ensured_nodes += 1
    if ensured_nodes:
        save_json(HISTORY_TREE, tree)
    print(f"✅ 社区上传注册规范化完成：manifest 修正 {changed_manifest} 个，确保历史节点 {ensured_nodes} 个，新增节点 {added_nodes} 个")

if __name__ == "__main__":
    main()
