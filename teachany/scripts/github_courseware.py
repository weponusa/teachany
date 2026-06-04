#!/usr/bin/env python3
"""GitHub API helpers for teachany-courseware — 挂树/注册节点无需事先 clone。"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

REPO_OWNER = "weponusa"
REPO_NAME = "teachany-courseware"
DEFAULT_BRANCH = "main"
API_ROOT = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"


def get_token() -> str:
    tok = (os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or "").strip()
    if not tok:
        raise SystemExit(
            "❌ 挂树写入需要 GH_TOKEN（或 GITHUB_TOKEN），对 weponusa/teachany-courseware 有 write 权限。\n"
            "   只读查询无需 token；发布课件也可用 publish_course.sh（Worker PR，无需 token）。"
        )
    return tok


def _request(method: str, path: str, body: dict | None = None, timeout: int = 120) -> Any:
    url = path if path.startswith("http") else f"{API_ROOT}{path}"
    data = None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {get_token()}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "TeachAny-Skill-HangTree",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:800]
        raise SystemExit(f"❌ GitHub API {method} {path}: HTTP {e.code}\n{detail}") from e


def default_courseware_dir() -> Path:
    env = os.environ.get("TEACHANY_COURSEWARE_REPO", "").strip()
    if env:
        return Path(env).expanduser()
    cache = Path.home() / ".cache" / "teachany-courseware"
    return cache


def ensure_shallow_clone(target: Path | None = None) -> Path:
    """无本地仓时浅克隆到缓存目录，供 rebuild-index / auto-publish 使用。"""
    repo = (target or default_courseware_dir()).resolve()
    if (repo / ".git").is_dir() and (repo / "scripts" / "rebuild-index.py").is_file():
        return repo
    token = get_token()
    if repo.exists():
        import shutil
        shutil.rmtree(repo, ignore_errors=True)
    repo.parent.mkdir(parents=True, exist_ok=True)
    clone_url = f"https://x-access-token:{token}@github.com/{REPO_OWNER}/{REPO_NAME}.git"
    print(f"📥 浅克隆 {REPO_OWNER}/{REPO_NAME} → {repo}", flush=True)
    subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", DEFAULT_BRANCH, clone_url, str(repo)],
        check=True,
    )
    return repo


def get_file_content(repo_path: str, ref: str = DEFAULT_BRANCH) -> tuple[dict | list, str]:
    """返回 (解析后的 JSON/文本对象, blob_sha)。"""
    q = urllib.parse.quote(repo_path.strip("/"), safe="/")
    data = _request("GET", f"/contents/{q}?ref={ref}")
    if not isinstance(data, dict) or "content" not in data:
        raise SystemExit(f"❌ 无法读取 {repo_path}")
    sha = data.get("sha") or ""
    raw = base64.b64decode(data["content"]).decode("utf-8")
    try:
        return json.loads(raw), sha
    except json.JSONDecodeError:
        return raw, sha


def put_file_content(
    repo_path: str,
    content_obj: dict | list,
    message: str,
    sha: str | None = None,
    branch: str = DEFAULT_BRANCH,
) -> dict:
    """通过 Contents API 更新单个文件（挂树 JSON / registry 片段）。"""
    body: dict[str, Any] = {
        "message": message,
        "content": base64.b64encode(
            json.dumps(content_obj, ensure_ascii=False, indent=2).encode("utf-8") + b"\n"
        ).decode("ascii"),
        "branch": branch,
    }
    if sha:
        body["sha"] = sha
    q = urllib.parse.quote(repo_path.strip("/"), safe="/")
    return _request("PUT", f"/contents/{q}", body)


def dispatch_rebuild_index_workflow(ref: str = DEFAULT_BRANCH) -> None:
    """触发 courseware 仓库 rebuild-index workflow（无需本地执行 rebuild-index）。"""
    workflow = os.environ.get("TEACHANY_REBUILD_WORKFLOW", "rebuild-index.yml")
    path = f"/actions/workflows/{urllib.parse.quote(workflow)}/dispatches"
    _request("POST", path, {"ref": ref})
    print(f"✅ 已触发 GitHub Actions: {workflow} @ {ref}")
    print(f"   https://github.com/{REPO_OWNER}/{REPO_NAME}/actions")
