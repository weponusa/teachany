#!/usr/bin/env python3
"""
TeachAny 挂树 Skill 入口 — 无需事先 clone courseware。

子命令：
  register   在课标树注册 placeholder 节点（GitHub API 直写）
  rebuild    触发远端 rebuild-index（workflow_dispatch）或本地/浅克隆执行
  publish    转调 teachany-publish.sh（有 GH_TOKEN 则浅克隆+挂树；否则 Worker PR）

示例：
  export GH_TOKEN=ghp_...
  python3 hang_tree.py register --node-id phy-m-demo --subject physics --stage middle --name "演示"
  TEACHANY_UPLOAD_CONFIRMED=1 python3 hang_tree.py publish my-course --course-dir ./community/my-course
  python3 hang_tree.py rebuild --dispatch
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def cmd_register(args: argparse.Namespace) -> int:
    from repo_paths import fetch_remote_json
    from github_courseware import get_file_content, put_file_content

    curriculum = args.curriculum or "cn"
    rel = f"data/trees/{curriculum}/{args.stage}/{args.subject}.json"
    try:
        tree, sha = get_file_content(rel)
    except SystemExit:
        tree = fetch_remote_json(rel.replace("data/", ""))
        sha = ""
        if not isinstance(tree, dict):
            raise SystemExit(f"❌ 无法加载 {rel}")

    if args.node_id in {
        n.get("id")
        for d in tree.get("domains", [])
        for n in d.get("nodes", [])
    }:
        print(f"ℹ️  {args.node_id} 已存在于 {rel}")
        return 0

    grade = args.grade or {"elementary": 3, "middle": 8, "high": 11}[args.stage]
    domain = next((d for d in tree["domains"] if d.get("id") == args.domain), None)
    if not domain:
        domain = {
            "id": args.domain,
            "name": args.domain.replace("-", " ").title(),
            "description": f"{args.domain} (auto)",
            "nodes": [],
        }
        tree["domains"].append(domain)

    domain["nodes"].append({
        "id": args.node_id,
        "name": args.name or args.node_id,
        "grade": grade,
        "status": "placeholder",
        "courses": [],
        "description": f"{args.name or args.node_id}（placeholder）",
    })

    put_file_content(
        rel,
        tree,
        f"feat(tree): register node {args.node_id}",
        sha=sha or None,
    )
    print(f"✅ 已挂树注册 → {rel} · {args.node_id}")
    print("   下一步：TEACHANY_UPLOAD_CONFIRMED=1 hang_tree.py publish <course-id>")
    return 0


def cmd_rebuild(args: argparse.Namespace) -> int:
    if args.dispatch:
        from github_courseware import dispatch_rebuild_index_workflow
        dispatch_rebuild_index_workflow()
        return 0

    from github_courseware import default_courseware_dir, ensure_shallow_clone

    repo = ensure_shallow_clone(default_courseware_dir())
    os.environ["TEACHANY_COURSEWARE_REPO"] = str(repo)
    r = subprocess.run([sys.executable, str(repo / "scripts" / "rebuild-index.py")], cwd=str(repo))
    if r.returncode != 0:
        return r.returncode
    if args.push:
        subprocess.run(["git", "add", "registry.json", "data/trees", "data/node-index.json",
                        "data/nodes-metadata.json", "data/nodes-selector.json"], cwd=str(repo), check=False)
        subprocess.run(
            ["git", "commit", "-m", "chore: rebuild-index via hang_tree.py"],
            cwd=str(repo),
            check=False,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=str(repo), check=True)
        print("✅ 已 push rebuild-index 结果")
    return 0


def cmd_publish(args: argparse.Namespace) -> int:
    if os.environ.get("TEACHANY_UPLOAD_CONFIRMED") != "1":
        print("❌ 请先 TEACHANY_UPLOAD_CONFIRMED=1（Phase 3.5b 用户同意上传）", file=sys.stderr)
        return 3
    publish_sh = SCRIPT_DIR / "teachany-publish.sh"
    cmd = ["bash", str(publish_sh), args.course_id]
    if args.course_dir:
        cmd.extend(["--course-dir", args.course_dir])
    return subprocess.call(cmd)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    reg = sub.add_parser("register", help="注册课标树节点（GitHub API）")
    reg.add_argument("--node-id", required=True)
    reg.add_argument("--subject", required=True)
    reg.add_argument("--stage", required=True, choices=["elementary", "middle", "high"])
    reg.add_argument("--curriculum", default="cn")
    reg.add_argument("--domain", default="general")
    reg.add_argument("--name", default="")
    reg.add_argument("--grade", type=int, default=0)

    reb = sub.add_parser("rebuild", help="重建索引并挂树")
    reb.add_argument("--dispatch", action="store_true", help="仅触发 GitHub Actions workflow")
    reb.add_argument("--push", action="store_true", help="本地 rebuild 后 push（需浅克隆）")

    pub = sub.add_parser("publish", help="发布课件并挂树（teachany-publish）")
    pub.add_argument("course_id")
    pub.add_argument("--course-dir", default="")

    args = ap.parse_args()
    if args.cmd == "register":
        return cmd_register(args)
    if args.cmd == "rebuild":
        return cmd_rebuild(args)
    if args.cmd == "publish":
        return cmd_publish(args)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
