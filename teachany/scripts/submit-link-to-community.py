#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
submit-link-to-community.py — 把已发布的在线课件链接投稿给 TeachAny 社区
======================================================================

适用对象：**没有仓库写权限的普通用户**。
管理员/维护者（有 GH_TOKEN 或 SSH）请直接走 `hang_tree.py publish`，不要用本脚本。

流程：WorkBuddy 里做完课件 → 「发布为应用」拿到在线链接 → 本脚本提交 → 服务端开 PR 送审。
服务端只收元数据 JSON，不存课件文件。

用法
----
    # 手动填字段
    python3 submit-link-to-community.py \
        --url https://xxx.pages.dev/my-course \
        --name "细胞的有丝分裂" --node-id bio-h-cell-division --subject bio --grade 10

    # 从课件目录的 manifest.json 自动带出元信息（推荐，做完课件直接跑）
    python3 submit-link-to-community.py \
        --course-dir ~/CodeBuddy/一次函数/teachany-courseware/community/<course-id> \
        --url https://xxx.pages.dev/my-course

    # 只看将要提交什么，不发请求
    python3 submit-link-to-community.py --course-dir <dir> --url <url> --dry-run

环境变量
--------
    TEACHANY_SUBMIT_API   投稿接口地址，默认 https://teachany-community.pages.dev/api/submit-link

退出码
------
    0 提交成功（返回 PR 链接）  1 失败  2 参数不足
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_API = "https://teachany-community.pages.dev/api/submit-link"
TIMEOUT = 60

SUBJECT_ALIASES = {
    "math": "math", "数学": "math", "chn": "chn", "语文": "chn", "中文": "chn",
    "eng": "eng", "英语": "eng", "phy": "phy", "物理": "phy",
    "chem": "chem", "化学": "chem", "bio": "bio", "生物": "bio",
    "hist": "hist", "历史": "hist", "geo": "geo", "地理": "geo",
    "pol": "pol", "政治": "pol", "it": "it", "信息科技": "it", "信息技术": "it",
    # manifest 里常见的英文全称
    "biology": "bio", "chemistry": "chem", "physics": "phy",
    "chinese": "chn", "english": "eng", "history": "hist",
    "geography": "geo", "politics": "pol", "mathematics": "math",
}


def die(msg, code=1):
    print(f"❌ {msg}", file=sys.stderr)
    sys.exit(code)


def load_manifest(course_dir):
    path = os.path.join(os.path.expanduser(course_dir), "manifest.json")
    if not os.path.isfile(path):
        die(f"manifest.json 不存在：{path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def norm_subject(raw):
    if not raw:
        return ""
    raw = str(raw).strip()
    return SUBJECT_ALIASES.get(raw, SUBJECT_ALIASES.get(raw.lower(), raw))


def build_payload(args):
    payload = {
        "url": args.url,
        "name": args.name or "",
        "node_id": args.node_id or "",
        "subject": norm_subject(args.subject),
        "grade": args.grade,
        "author": args.author or "",
        "description": args.description or "",
        "tags": [t.strip() for t in (args.tags or "").replace("，", ",").split(",") if t.strip()],
        "user_message": args.message or "",
    }

    if args.course_dir:
        m = load_manifest(args.course_dir)
        payload["name"] = payload["name"] or m.get("name") or m.get("title") or ""
        payload["node_id"] = payload["node_id"] or m.get("node_id") or m.get("nodeId") or ""
        payload["subject"] = payload["subject"] or norm_subject(m.get("subject") or "")
        if not payload["grade"]:
            payload["grade"] = m.get("grade") or 0
        payload["author"] = payload["author"] or m.get("author") or ""
        payload["description"] = payload["description"] or m.get("description") or ""
        if not payload["tags"]:
            tags = m.get("tags") or []
            payload["tags"] = [t for t in tags if t]

    missing = [k for k in ("url", "name", "node_id", "subject") if not payload[k]]
    return payload, missing


def main():
    p = argparse.ArgumentParser(description="投稿在线课件链接到 TeachAny 社区")
    p.add_argument("--url", help="课件在线链接（http/https，公网可访问）")
    p.add_argument("--course-dir", help="课件目录，自动读取 manifest.json 补齐元信息")
    p.add_argument("--name", help="课件名称")
    p.add_argument("--node-id", dest="node_id", help="知识点 ID，如 bio-h-cell-division")
    p.add_argument("--subject", help="学科：math/chn/eng/phy/chem/bio/hist/geo/pol/it")
    p.add_argument("--grade", type=int, default=0, help="年级 1-12，0 表示不限")
    p.add_argument("--author", help="作者署名")
    p.add_argument("--description", help="一句话简介")
    p.add_argument("--tags", help="标签，英文逗号分隔")
    p.add_argument("--message", help="给审核的留言")
    p.add_argument("--api", default=os.environ.get("TEACHANY_SUBMIT_API", DEFAULT_API))
    p.add_argument("--dry-run", action="store_true", help="只打印将要提交的内容，不发送请求")
    args = p.parse_args()

    if not args.url and not args.course_dir:
        die("至少提供 --url；或用 --course-dir 指定课件目录", 2)

    # Phase 3.5b 闸门：必须先问过用户是否投稿，禁止静默提交
    if os.environ.get("TEACHANY_UPLOAD_CONFIRMED") != "1":
        die(
            "未确认投稿（Phase 3.5b）。先问用户「是否投稿到社区」，同意后：\n"
            "  export TEACHANY_UPLOAD_CONFIRMED=1\n"
            "再重跑本脚本。",
            3,
        )

    payload, missing = build_payload(args)

    if args.dry_run:
        print("将要提交：")
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        if missing:
            print(f"\n⚠️ 缺少必填字段：{', '.join(missing)}")
        sys.exit(0 if not missing else 2)

    if missing:
        die(f"缺少必填字段：{', '.join(missing)}（可用 --course-dir 从 manifest 自动补齐）", 2)

    req = urllib.request.Request(
        args.api,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "TeachAny-Skill/1.0"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        try:
            data = json.loads(body)
        except Exception:
            die(f"接口返回 HTTP {e.code}：{body[:300]}")
        print(f"❌ 投稿失败：{data.get('message', body[:300])}（code={data.get('code')}）", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        die(f"无法连接投稿接口：{e}")

    if not data.get("ok"):
        die(data.get("message", "投稿失败"))

    lc = data.get("linkCheck") or {}
    print("✅ 投稿成功")
    print(f"   课件链接：{data.get('shareUrl')}")
    print(f"   送审编号：{data.get('courseId')}")
    print(f"   审核 PR ：{data.get('prUrl')}")
    if lc.get("reachable"):
        print(f"   连通性  ：✅ HTTP {lc.get('status')}" + (f" · {lc['title']}" if lc.get("title") else ""))
    else:
        print(f"   连通性  ：⚠️ {lc.get('note') or lc.get('status')}（人工审核时会再次确认）")
    print("\n审核通过后会挂上社区课件库，链接即上面这个地址。")


if __name__ == "__main__":
    main()
