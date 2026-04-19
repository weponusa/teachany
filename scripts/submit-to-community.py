#!/usr/bin/env python3
"""
TeachAny 社区课件自动提交工具（v5.34.8 新增）

作用：把本地 community/drafts/<course-id>/ 里的课件一键提交到 GitHub，
      自动创建社区分支 + PR，走标准的社区审批流程（community-submit.yml）。

使用方式：
    python3 scripts/submit-to-community.py <course-id>
    python3 scripts/submit-to-community.py <course-id> --author "张三" --message "欢迎审阅"

Token 获取（一次性，首次运行时会提示）：
    1. 访问 https://github.com/settings/personal-access-tokens/new
    2. 选择 Fine-grained token，Repository access 选 "Only select repositories" → weponusa/teachany
    3. 权限只勾 "Contents: Read-only" 和 "Metadata: Read-only"
       （真实分支/PR 由 GitHub Actions 用自己的 token 创建，用户的 token 只用来发 dispatch 事件）
    4. 生成后复制 token，保存到仓库根目录 `.teachany-token`（被 .gitignore）

退出码：
    0 = 提交成功（PR 已开）
    1 = 用户输入错误
    2 = 课件校验未通过
    3 = token 缺失或无效
    4 = 网络/API 失败
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path


REPO = "weponusa/teachany"
DISPATCH_URL = f"https://api.github.com/repos/{REPO}/dispatches"
EVENT_TYPE = "community-submit"
MAX_PACKAGE_MB = 5  # 单次通过 dispatch 上传的课件包上限（避免超出 payload 限制）


def read_token() -> str:
    """按优先级读取 GitHub Fine-grained token"""
    # 1) 环境变量
    token = os.environ.get("TEACHANY_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        return token.strip()
    # 2) 本地文件 .teachany-token
    token_file = Path(".teachany-token")
    if token_file.exists():
        return token_file.read_text(encoding="utf-8").strip()
    return ""


def ensure_token_hint():
    print("⛔ 未找到 GitHub token。请在仓库根目录创建 `.teachany-token` 文件：")
    print()
    print("   1. 访问 https://github.com/settings/personal-access-tokens/new")
    print("   2. Fine-grained token → Repository access → Only select repositories → weponusa/teachany")
    print("   3. 只需勾选 Contents: Read-only + Metadata: Read-only")
    print("   4. 生成后：echo '你的token' > .teachany-token")
    print()
    print("   .teachany-token 已被 .gitignore 拦住，不会被提交。")
    print()
    print("   也可以临时用环境变量：TEACHANY_TOKEN=ghp_xxx python3 scripts/submit-to-community.py ...")


def validate_courseware(course_dir: Path) -> dict:
    """最小校验：必须有 index.html + manifest.json 且 manifest 字段完整"""
    if not course_dir.is_dir():
        print(f"⛔ 课件目录不存在：{course_dir}")
        sys.exit(1)

    index = course_dir / "index.html"
    manifest_path = course_dir / "manifest.json"
    if not index.exists():
        print(f"⛔ 缺少 index.html：{index}")
        sys.exit(2)
    if not manifest_path.exists():
        print(f"⛔ 缺少 manifest.json：{manifest_path}")
        sys.exit(2)

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"⛔ manifest.json 解析失败：{e}")
        sys.exit(2)

    required = ["name", "subject", "grade", "node_id"]
    missing = [k for k in required if not manifest.get(k)]
    if missing:
        print(f"⛔ manifest.json 缺少必填字段：{missing}")
        print("   这些字段用于在社区仓的知识树上挂载课件，缺一不可。")
        sys.exit(2)

    return manifest


def pack_to_base64(course_dir: Path) -> tuple[str, int]:
    """把课件目录打包成 .teachany（ZIP），返回 base64 字符串和原始字节数"""
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in course_dir.rglob("*"):
            if path.is_file():
                # 跳过 macOS 元数据文件
                if path.name in (".DS_Store",) or path.name.startswith("._"):
                    continue
                zf.write(path, path.relative_to(course_dir))
    raw = buffer.getvalue()
    size_mb = len(raw) / 1024 / 1024
    if size_mb > MAX_PACKAGE_MB:
        print(f"⛔ 课件包 {size_mb:.1f} MB 超出 {MAX_PACKAGE_MB} MB 限制。")
        print("   建议：删减 tts/ 目录里的冗余 mp3，或用 GitHub Release 另行上传大文件包。")
        sys.exit(2)
    return base64.b64encode(raw).decode("ascii"), len(raw)


def dispatch(token: str, payload: dict):
    """向 GitHub 发 repository_dispatch 事件"""
    body = json.dumps({
        "event_type": EVENT_TYPE,
        "client_payload": payload,
    }).encode("utf-8")

    req = urllib.request.Request(
        DISPATCH_URL,
        data=body,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "TeachAny-CommunitySubmit/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 204:
                return
            print(f"⚠️ GitHub 返回非预期状态码 {resp.status}，但 dispatch 已发出。")
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")[:500]
        print(f"⛔ GitHub API 返回 {e.code}：{body_text}")
        if e.code == 401:
            print("   → token 无效或过期，请重新生成并更新 .teachany-token")
            sys.exit(3)
        if e.code == 403:
            print("   → token 权限不足。Fine-grained token 必须授予 weponusa/teachany 仓库，")
            print("     Permissions 勾选 Contents: Read-only + Metadata: Read-only。")
            sys.exit(3)
        sys.exit(4)
    except urllib.error.URLError as e:
        print(f"⛔ 网络错误：{e}")
        sys.exit(4)


def main():
    parser = argparse.ArgumentParser(
        description="把 community/drafts/<course-id>/ 下的课件提交到 TeachAny 社区",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("course_id", help="课件目录名，位于 community/drafts/<course_id>/")
    parser.add_argument("--author", default="", help="作者名（可选，默认读 manifest.json.author）")
    parser.add_argument("--message", default="", help="给审核者的一句话留言（可选）")
    parser.add_argument("--dry-run", action="store_true", help="仅校验与打包，不真的发 dispatch")
    args = parser.parse_args()

    course_dir = Path("community") / "drafts" / args.course_id
    print(f"📦 课件目录：{course_dir}")

    # 1. 校验
    manifest = validate_courseware(course_dir)
    print(f"✅ 校验通过：{manifest.get('name')} ({manifest.get('subject')}-G{manifest.get('grade')})")

    # 2. 打包
    print(f"🗜️  打包中...")
    package_b64, raw_size = pack_to_base64(course_dir)
    print(f"✅ 打包完成：{raw_size / 1024:.1f} KB")

    # 3. 组装 payload
    author = args.author or manifest.get("author", "") or "匿名用户"
    payload = {
        "node_id": manifest["node_id"],
        "name": manifest["name"],
        "name_en": manifest.get("name_en", ""),
        "subject": manifest["subject"],
        "grade": manifest["grade"],
        "author": author,
        "description": manifest.get("description", ""),
        "version": manifest.get("version", "1.0.0"),
        "file_count": sum(1 for _ in course_dir.rglob("*") if _.is_file()),
        "tags": manifest.get("tags", []),
        "user_message": args.message,
        "packageBase64": package_b64,
    }

    if args.dry_run:
        print("🔍 --dry-run：仅演示，未发起真实 API 调用。Payload 概要：")
        preview = {k: v for k, v in payload.items() if k != "packageBase64"}
        preview["packageBase64"] = f"<{raw_size} bytes, base64 {len(package_b64)} chars omitted>"
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        return

    # 4. 读取 token
    token = read_token()
    if not token:
        ensure_token_hint()
        sys.exit(3)

    # 5. 发送 dispatch
    print(f"🚀 提交到 GitHub 社区仓（{REPO}）...")
    dispatch(token, payload)
    print()
    print("✅ 已提交！GitHub Actions 正在为你创建分支 + 开 PR。")
    print(f"   查看状态：https://github.com/{REPO}/actions")
    print(f"   查看 PR：https://github.com/{REPO}/pulls")
    print()
    print("后续流程：")
    print("   1. PR 会被机器人打上 `community-courseware` + `needs-review` 标签")
    print("   2. 管理员审阅你的课件（可能打 approved / revision-needed）")
    print("   3. approved 合并后 → 自动进入社区 Gallery")
    print("   4. promote-to-official 合并后 → 升级为官方课件")


if __name__ == "__main__":
    main()
