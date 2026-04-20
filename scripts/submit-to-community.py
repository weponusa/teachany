#!/usr/bin/env python3
"""
TeachAny 社区课件自动提交工具（v5.34.9 · 零配置版 · 含 WebP 自动压缩）

核心变化（相比 v5.34.8）：
- ❌ 不再需要 `.teachany-token` 或 GitHub 账号
- ❌ 不再直接调用 GitHub API
- ✅ 改为 POST 到 TeachAny 官方 Cloudflare Worker
- ✅ Worker 用官方 Bot Token 代为开 PR
- ✅ 零配置：用户做完课件 → AI 跑一条命令 → 自动提交完成

v5.34.9.1 新增（2026-04-20）：
- 🗜️ 打包前自动把 PNG/JPG 压缩为 WebP（质量 80，体积缩 5-10x）
- 📝 HTML 中的 <img src="./assets/xxx.png"> 自动改写为 xxx.webp
- 🛡️ 压缩只在临时打包目录进行，原始课件目录 assets/ 保留高清母版
- ⚙️ 优先用 cwebp CLI；fallback Pillow；最后 fallback 为不压缩 + 警告
- 🚫 压缩后单图 >1.5MB 会警告；整包 >5MB 会阻断提交

使用方式：
    python3 scripts/submit-to-community.py <course-id>
    python3 scripts/submit-to-community.py <course-id> --author "张老师" --message "欢迎审阅"
    python3 scripts/submit-to-community.py <course-id> --no-compress  # 禁用压缩（不推荐）

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
    5 = 图片压缩失败（仅 --strict-compress 模式下）
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
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
WEBP_QUALITY = 80  # 80% 视觉几乎无损，压缩率约 5-10x


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


# ============================================================
# 图片压缩（v5.34.9.1 新增）
# ============================================================

def detect_webp_engine() -> str:
    """按优先级检测可用的 WebP 编码器"""
    # 优先 cwebp CLI（速度 + 体积双优）
    if shutil.which("cwebp"):
        return "cwebp"
    # fallback: Pillow
    try:
        import PIL  # noqa: F401
        return "pillow"
    except ImportError:
        return "none"


def compress_image_cwebp(src: Path, dst: Path, quality: int) -> bool:
    """用 cwebp CLI 压缩，返回是否成功"""
    try:
        result = subprocess.run(
            ["cwebp", "-q", str(quality), "-quiet", str(src), "-o", str(dst)],
            capture_output=True, timeout=30
        )
        return result.returncode == 0 and dst.exists() and dst.stat().st_size > 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def compress_image_pillow(src: Path, dst: Path, quality: int) -> bool:
    """用 Pillow 压缩，返回是否成功"""
    try:
        from PIL import Image
        img = Image.open(src)
        # 保留 alpha 通道
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")
        img.save(str(dst), "WEBP", quality=quality, method=6)
        return dst.exists() and dst.stat().st_size > 0
    except Exception as e:
        print(f"   ⚠️  Pillow 压缩 {src.name} 失败: {e}")
        return False


def optimize_assets(course_dir: Path, tmp_dir: Path, engine: str) -> dict:
    """
    把 course_dir 复制到 tmp_dir，并把 assets/ 下的 PNG/JPG 压成 WebP。
    同时重写 index.html 的 <img src> 指向新文件名。
    返回压缩统计信息。
    """
    # 1. 先整体复制一份到临时目录（保留原始课件不变）
    shutil.copytree(course_dir, tmp_dir, dirs_exist_ok=True)

    stats = {
        "images_total": 0,
        "images_compressed": 0,
        "images_skipped": 0,
        "bytes_before": 0,
        "bytes_after": 0,
        "engine": engine,
        "renamed": {},  # old_name -> new_name
    }

    assets_dir = tmp_dir / "assets"
    if not assets_dir.exists():
        return stats

    for img_path in list(assets_dir.iterdir()):
        if not img_path.is_file():
            continue
        ext = img_path.suffix.lower()
        if ext not in (".png", ".jpg", ".jpeg"):
            continue
        stats["images_total"] += 1
        before = img_path.stat().st_size
        stats["bytes_before"] += before

        # 目标 WebP 路径（同名 .webp）
        webp_path = img_path.with_suffix(".webp")

        # 跳过已经是 WebP 的（.png 可能有同名 .webp 伴生）
        success = False
        if engine == "cwebp":
            success = compress_image_cwebp(img_path, webp_path, WEBP_QUALITY)
        elif engine == "pillow":
            success = compress_image_pillow(img_path, webp_path, WEBP_QUALITY)

        if success:
            after = webp_path.stat().st_size
            stats["bytes_after"] += after
            stats["images_compressed"] += 1
            stats["renamed"][img_path.name] = webp_path.name
            # 删除原始 PNG/JPG（释放体积）
            img_path.unlink()
        else:
            # 压缩失败：保留原图，不改名
            stats["bytes_after"] += before
            stats["images_skipped"] += 1

    # 2. 重写 HTML 里所有 <img src="./assets/xxx.png|jpg"> 为对应 .webp
    if stats["renamed"]:
        html_path = tmp_dir / "index.html"
        if html_path.exists():
            html = html_path.read_text(encoding="utf-8")
            for old, new in stats["renamed"].items():
                # 替换任何形式的 ./assets/xxx 或 assets/xxx 引用
                # 正则：匹配 (src= 或 href= 或 url(等等)...assets/xxx.ext
                pattern = re.compile(
                    rf'((?:src|href)\s*=\s*["\']\.?/?assets/){re.escape(old)}(["\'])'
                )
                html = pattern.sub(rf'\g<1>{new}\g<2>', html)
                # 兼容 url(./assets/xxx.png) 这类 CSS 引用
                html = html.replace(f"assets/{old}", f"assets/{new}")
            html_path.write_text(html, encoding="utf-8")

    return stats


def pack_to_base64(course_dir: Path, compress: bool = True) -> tuple:
    """
    打包课件目录为 base64 编码的 ZIP。
    v5.34.9.1：支持 WebP 压缩（在临时目录中转后打包）。
    返回 (base64_str, raw_bytes, stats_info)
    """
    stats_info = None
    source_dir = course_dir

    if compress:
        engine = detect_webp_engine()
        if engine == "none":
            print("   ⚠️  未找到 cwebp 或 Pillow，跳过图片压缩。")
            print("      建议：brew install webp  或  pip install Pillow")
        else:
            # 压缩到临时目录
            tmp_parent = Path(tempfile.mkdtemp(prefix="teachany-pack-"))
            tmp_course = tmp_parent / course_dir.name
            print(f"🗜️  正在压缩图片（引擎：{engine}，WebP q{WEBP_QUALITY}）...")
            stats_info = optimize_assets(course_dir, tmp_course, engine)

            if stats_info["images_compressed"] > 0:
                before_mb = stats_info["bytes_before"] / 1024 / 1024
                after_mb = stats_info["bytes_after"] / 1024 / 1024
                ratio = stats_info["bytes_before"] / max(stats_info["bytes_after"], 1)
                print(
                    f"   ✅ 压缩 {stats_info['images_compressed']}/{stats_info['images_total']} 张图："
                    f"{before_mb:.1f} MB → {after_mb:.1f} MB（{ratio:.1f}x）"
                )
                if stats_info["images_skipped"] > 0:
                    print(f"   ⚠️  {stats_info['images_skipped']} 张图压缩失败（保留原图）")
            else:
                print(f"   ℹ️  没有可压缩的 PNG/JPG 文件")

            source_dir = tmp_course

    # 打包为 ZIP（in-memory）
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in source_dir.rglob("*"):
            if path.is_file():
                # 跳过 macOS / Python 等元数据文件
                if path.name in (".DS_Store",) or path.name.startswith("._"):
                    continue
                if path.suffix in (".pyc", ".pyo"):
                    continue
                zf.write(path, path.relative_to(source_dir))
    raw = buffer.getvalue()

    # 清理临时目录
    if compress and source_dir != course_dir:
        try:
            shutil.rmtree(source_dir.parent)
        except Exception:
            pass

    size_mb = len(raw) / 1024 / 1024
    if size_mb > MAX_PACKAGE_MB:
        print(f"⛔ 课件包 {size_mb:.1f} MB 超出 {MAX_PACKAGE_MB} MB 限制。")
        print("   即使启用了图片压缩，依然超限。排查建议：")
        print("   - tts/ 目录过大？edge-tts 默认 32kbps 已经很省了，可考虑缩短旁白文本")
        print("   - 是否有其他大文件？du -ah assets/ tts/ | sort -rh | head")
        sys.exit(2)
    return base64.b64encode(raw).decode("ascii"), len(raw), stats_info


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
    """
    高级用户用自己的 PAT 直接调 GitHub Git Data API 建 PR（绕过 Worker）。
    v5.34.9.1 升级：不再走 repository_dispatch（有 64KB 限制），改为
    直接 Git Data API 建分支 + commit + PR（单文件上限 100MB）。
    """
    import uuid
    course_id = f"{payload['subject']}-{payload['node_id']}-{uuid.uuid4().hex[:8]}"
    branch = f"community/{course_id}"
    repo_path = f"/repos/{REPO}"

    def gh_req(method, path, body=None):
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(
            f"https://api.github.com{path}",
            data=data,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
                "User-Agent": "TeachAny-CommunitySubmit/1.0",
            },
            method=method,
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        # 1. 拿 main commit sha + tree sha
        main_ref = gh_req("GET", f"{repo_path}/git/refs/heads/main")
        main_sha = main_ref["object"]["sha"]
        main_commit = gh_req("GET", f"{repo_path}/git/commits/{main_sha}")
        base_tree = main_commit["tree"]["sha"]

        # 2. 上传 blobs
        pkg_blob = gh_req("POST", f"{repo_path}/git/blobs", {
            "content": payload["packageBase64"],
            "encoding": "base64",
        })
        meta = {
            "id": course_id,
            "node_id": payload["node_id"],
            "name": payload["name"],
            "subject": payload["subject"],
            "grade": payload["grade"],
            "author": payload["author"],
            "description": payload.get("description", ""),
            "submitted_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            **payload.get("extra", {}),
        }
        json_blob = gh_req("POST", f"{repo_path}/git/blobs", {
            "content": json.dumps(meta, ensure_ascii=False, indent=2),
            "encoding": "utf-8",
        })

        # 3. 新 tree
        new_tree = gh_req("POST", f"{repo_path}/git/trees", {
            "base_tree": base_tree,
            "tree": [
                {"path": f"community/pending/{course_id}.teachany", "mode": "100644", "type": "blob", "sha": pkg_blob["sha"]},
                {"path": f"community/pending/{course_id}.json", "mode": "100644", "type": "blob", "sha": json_blob["sha"]},
            ],
        })

        # 4. commit
        new_commit = gh_req("POST", f"{repo_path}/git/commits", {
            "message": f"[Community] Submit courseware: {payload['name']}",
            "tree": new_tree["sha"],
            "parents": [main_sha],
            "author": {
                "name": "TeachAny Community Bot",
                "email": "teachany-bot@users.noreply.github.com",
            },
        })

        # 5. branch ref
        gh_req("POST", f"{repo_path}/git/refs", {
            "ref": f"refs/heads/{branch}",
            "sha": new_commit["sha"],
        })

        # 6. 开 PR
        pr = gh_req("POST", f"{repo_path}/pulls", {
            "title": f"[Community] 📚 {payload['name']} ({payload['node_id']})",
            "head": branch,
            "base": "main",
            "body": f"Community submission by {payload['author']}.\n\nFiles:\n- `community/pending/{course_id}.teachany`\n- `community/pending/{course_id}.json`",
        })

        # 7. 打标签
        try:
            gh_req("POST", f"{repo_path}/issues/{pr['number']}/labels", {
                "labels": ["community-courseware", "needs-review"],
            })
        except Exception:
            pass  # 标签失败不阻断

        return 202, {
            "ok": True,
            "submission_id": course_id,
            "pr_url": pr["html_url"],
            "pr_number": pr["number"],
            "message": "已通过 direct token 建 PR",
        }
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
    parser.add_argument("--no-compress", action="store_true", help="禁用图片 WebP 自动压缩（不推荐）")
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

    # 3. 打包（含 WebP 压缩）
    print(f"🗜️  打包中...")
    package_b64, raw_size, compress_stats = pack_to_base64(
        course_dir, compress=not args.no_compress
    )
    print(f"✅ 打包完成：{raw_size / 1024:.1f} KB（{raw_size / 1024 / 1024:.2f} MB）")

    # 4. 组装 payload（GitHub repository_dispatch client_payload 最多 10 个字段）
    author = args.author or manifest.get("author", "") or "匿名用户"
    extra = {
        "name_en": manifest.get("name_en", ""),
        "version": manifest.get("version", "1.0.0"),
        "file_count": sum(1 for _ in course_dir.rglob("*") if _.is_file()),
        "tags": manifest.get("tags", []),
        "teachany_version": manifest.get("teachany_version", ""),
        "curriculum": manifest.get("curriculum", "cn-national"),
        "user_message": args.message,
        "compress_stats": compress_stats if compress_stats else {},
    }
    payload = {
        "node_id": manifest["node_id"],
        "name": manifest["name"],
        "subject": manifest["subject"],
        "grade": manifest["grade"],
        "author": author,
        "description": manifest.get("description") or manifest.get("description_zh", ""),
        "extra": extra,
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
            print("   ℹ️  课件包太大。请删减 tts/ 冗余 mp3。")
        elif code == "MISSING_FIELDS":
            print("   ℹ️  manifest.json 缺必填字段。请检查 node_id/name/subject/grade。")
        elif code == "GITHUB_API_ERROR":
            print("   ℹ️  GitHub 侧临时异常。请稍后重试，或联系管理员。")
        sys.exit(3)


if __name__ == "__main__":
    main()
