#!/usr/bin/env python3
"""
TeachAny 社区课件自动提交工具（v5.34.9 · 零配置版）

核心变化（相比 v5.34.8）：
- ❌ 不再需要 `.teachany-token` 或 GitHub 账号
- ❌ 不再直接调用 GitHub API
- ✅ 改为 POST 到 TeachAny 官方 Cloudflare Worker
- ✅ Worker 用官方 Bot Token 代为开 PR
- ✅ 零配置：用户做完课件 → AI 跑一条命令 → 自动提交完成

使用方式：
    python3 scripts/submit-to-community.py <course-id>
    python3 scripts/submit-to-community.py <course-id> --author "张老师" --message "欢迎审阅"

进阶（高级用户）：
    # 使用自己的 Fine-grained token 直连 GitHub（绕过 Worker）
    TEACHANY_DIRECT_TOKEN=ghp_xxx python3 scripts/submit-to-community.py <course-id>

    # 指向自建的 Worker 实例
    TEACHANY_WORKER_URL=https://my-worker.example.workers.dev python3 scripts/submit-to-community.py <course-id>

退出码：
    0 = 提交成功
    1 = 用户输入错误
    2 = 课件校验未通过
    3 = Worker 或 GitHub 拒绝（限频 / 权限问题）
    4 = 网络错误
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path


# TeachAny 官方公共提交端点（Cloudflare Worker）
# v5.34.9 部署完成，2026-04-19
DEFAULT_WORKER_URL = "https://teachany-submit.weponusa.workers.dev/api/submit"

REPO = "weponusa/teachany"
DISPATCH_URL_DIRECT = f"https://api.github.com/repos/{REPO}/dispatches"
EVENT_TYPE = "community-submit"
MAX_PACKAGE_MB = 5


def get_worker_url() -> str:
    """允许用户通过环境变量覆盖 Worker URL（方便本地调试或自建）"""
    return os.environ.get("TEACHANY_WORKER_URL", DEFAULT_WORKER_URL).strip()


def get_direct_token() -> str:
    """高级用户可用自己的 fine-grained token 直连 GitHub"""
    return (
        os.environ.get("TEACHANY_DIRECT_TOKEN")
        or os.environ.get("TEACHANY_TOKEN")
        or ""
    ).strip()


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


def pack_to_base64(course_dir: Path) -> tuple:
    """把课件目录打包成 .teachany（ZIP），返回 base64 字符串和原始字节数"""
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in course_dir.rglob("*"):
            if path.is_file():
                # 跳过 macOS 元数据文件 + 常见无关文件
                if path.name in (".DS_Store",) or path.name.startswith("._"):
                    continue
                if path.suffix in (".pyc", ".pyo"):
                    continue
                zf.write(path, path.relative_to(course_dir))
    raw = buffer.getvalue()
    size_mb = len(raw) / 1024 / 1024
    if size_mb > MAX_PACKAGE_MB:
        print(f"⛔ 课件包 {size_mb:.1f} MB 超出 {MAX_PACKAGE_MB} MB 限制。")
        print("   建议：删减 tts/ 目录里的冗余 mp3，或压缩 assets/ 里的大图。")
        sys.exit(2)
    return base64.b64encode(raw).decode("ascii"), len(raw)


def submit_via_worker(worker_url: str, payload: dict):
    """通过 Cloudflare Worker 提交（零配置路径）"""
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        worker_url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "TeachAny-CommunitySubmit/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return resp.status, data
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode("utf-8"))
        except Exception:
            data = {"ok": False, "message": f"HTTP {e.code}"}
        return e.code, data
    except urllib.error.URLError as e:
        print(f"⛔ 无法连接到 Worker：{e}")
        print(f"   Worker URL：{worker_url}")
        print(f"   可能原因：Worker 未部署 / 网络不通 / URL 错误")
        print(f"   （高级用户可用 TEACHANY_DIRECT_TOKEN 直连 GitHub 绕过）")
        sys.exit(4)


def submit_via_direct_token(token: str, payload: dict):
    """高级用户用自己的 PAT 直接调 GitHub（绕过 Worker）"""
    body = json.dumps({
        "event_type": EVENT_TYPE,
        "client_payload": payload,
    }).encode("utf-8")
    req = urllib.request.Request(
        DISPATCH_URL_DIRECT,
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
            return resp.status, {"ok": True, "message": "已通过 direct token 提交"}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")[:500]
        return e.code, {"ok": False, "message": body_text}
    except urllib.error.URLError as e:
        print(f"⛔ 网络错误：{e}")
        sys.exit(4)


def main():
    parser = argparse.ArgumentParser(
        description="把 community/drafts/<course-id>/ 或 examples/<course-id>/ 下的课件提交到 TeachAny 社区",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("course_id", help="课件目录名")
    parser.add_argument("--author", default="", help="作者名（可选，默认读 manifest.json.author）")
    parser.add_argument("--message", default="", help="给审核者的一句话留言（可选）")
    parser.add_argument("--dry-run", action="store_true", help="仅校验与打包，不真的发请求")
    parser.add_argument(
        "--from",
        dest="from_dir",
        default="auto",
        choices=["auto", "drafts", "examples"],
        help="课件所在根目录：auto=自动探测（默认），drafts=community/drafts，examples=examples",
    )
    args = parser.parse_args()

    # 1. 定位课件目录
    candidates = []
    if args.from_dir in ("auto", "drafts"):
        candidates.append(Path("community") / "drafts" / args.course_id)
    if args.from_dir in ("auto", "examples"):
        candidates.append(Path("examples") / args.course_id)
    course_dir = next((p for p in candidates if p.is_dir()), None)
    if not course_dir:
        print(f"⛔ 在以下位置都找不到课件目录：")
        for p in candidates:
            print(f"   - {p}")
        sys.exit(1)

    print(f"📦 课件目录：{course_dir}")

    # 2. 校验
    manifest = validate_courseware(course_dir)
    print(f"✅ 校验通过：{manifest.get('name')} ({manifest.get('subject')}-G{manifest.get('grade')})")

    # 3. 打包
    print(f"🗜️  打包中...")
    package_b64, raw_size = pack_to_base64(course_dir)
    print(f"✅ 打包完成：{raw_size / 1024:.1f} KB")

    # 4. 组装 payload
    author = args.author or manifest.get("author", "") or "匿名用户"
    payload = {
        "node_id": manifest["node_id"],
        "name": manifest["name"],
        "name_en": manifest.get("name_en", ""),
        "subject": manifest["subject"],
        "grade": manifest["grade"],
        "author": author,
        "description": manifest.get("description") or manifest.get("description_zh", ""),
        "version": manifest.get("version", "1.0.0"),
        "file_count": sum(1 for _ in course_dir.rglob("*") if _.is_file()),
        "tags": manifest.get("tags", []),
        "user_message": args.message,
        "teachany_version": manifest.get("teachany_version", ""),
        "curriculum": manifest.get("curriculum", "cn-national"),
        "packageBase64": package_b64,
    }

    if args.dry_run:
        print("🔍 --dry-run：仅演示，未发起真实 API 调用。Payload 概要：")
        preview = {k: v for k, v in payload.items() if k != "packageBase64"}
        preview["packageBase64"] = f"<{raw_size} bytes, base64 {len(package_b64)} chars omitted>"
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        return

    # 5. 选择提交路径
    direct_token = get_direct_token()
    if direct_token:
        print("🔑 检测到 TEACHANY_DIRECT_TOKEN，直连 GitHub（绕过 Worker）...")
        status, data = submit_via_direct_token(direct_token, payload)
    else:
        worker_url = get_worker_url()
        print(f"🚀 通过 TeachAny 官方 API 提交（{worker_url}）...")
        status, data = submit_via_worker(worker_url, payload)

    # 6. 处理响应
    ok = data.get("ok", status in (200, 202, 204))

    if ok:
        print()
        print("✅ 已成功提交！GitHub Actions 正在处理。")
        if data.get("submission_id"):
            print(f"   提交 ID：{data['submission_id']}")
        if data.get("pulls_url"):
            print(f"   查看 PR：{data['pulls_url']}")
        if data.get("actions_url"):
            print(f"   查看构建：{data['actions_url']}")
        print()
        print("后续流程（全自动）：")
        print("   1. GitHub Actions 自动创建分支 + 开 PR（1-2 分钟）")
        print("   2. validate.yml 自动跑质检")
        print("   3. 质检通过 → 自动合并 → 课件上线到 Gallery（5-10 分钟）")
        print("   4. 用户首页刷新即可看到（按心标数排序）")
        sys.exit(0)
    else:
        code = data.get("code", "UNKNOWN_ERROR")
        msg = data.get("message", "未知错误")
        print(f"⛔ 提交失败 [{status} / {code}]：{msg}")
        if code == "RATE_LIMITED":
            print("   ℹ️  你已达到今日提交上限（默认 10 份/天）。请明天再试。")
        elif code == "PACKAGE_TOO_LARGE":
            print("   ℹ️  课件包太大。请删减 tts/ 冗余 mp3，或压缩大图。")
        elif code == "MISSING_FIELDS":
            print("   ℹ️  manifest.json 缺必填字段。请检查 node_id/name/subject/grade。")
        elif code == "GITHUB_API_ERROR":
            print("   ℹ️  GitHub 侧临时异常。请稍后重试，或联系管理员。")
        sys.exit(3)


if __name__ == "__main__":
    main()
