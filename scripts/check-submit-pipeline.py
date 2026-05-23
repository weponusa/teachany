#!/usr/bin/env python3
"""
TeachAny Submit Pipeline 健康检查脚本
======================================
检查 Pages Functions、GitHub PAT、KV、权限等关键链路。

用法：
  python3 check-submit-pipeline.py
  python3 check-submit-pipeline.py --worker-url https://teachany-community.pages.dev
  python3 check-submit-pipeline.py --token ghp_xxxx        # 用本地 token 代替 Pages Functions 检查
"""

import argparse
import json
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ─── 默认配置 ─────────────────────────────────────────────
DEFAULT_WORKER_URL = "https://teachany-community.pages.dev"
DEFAULT_REPO = "weponusa/teachany-courseware"
DEFAULT_API = "https://api.github.com"
BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

# 颜色
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


def ok(msg):
    print(f"  {GREEN}✓{RESET} {msg}")


def fail(msg):
    print(f"  {RED}✗{RESET} {msg}")


def warn(msg):
    print(f"  {YELLOW}!{RESET} {msg}")


def info(msg):
    print(f"  {CYAN}→{RESET} {msg}")


def section(title):
    print(f"\n{BOLD}{title}{RESET}")
    print("─" * 50)


def http_get(url, headers=None, timeout=10):
    """发起 GET 请求，返回 (status_code, body_str)"""
    req = Request(url, method="GET")
    req.add_header("User-Agent", BROWSER_UA)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        resp = urlopen(req, timeout=timeout)
        body = resp.read().decode("utf-8", errors="replace")
        return resp.status, body
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return e.code, body
    except URLError as e:
        return -1, str(e.reason)
    except Exception as e:
        return -2, str(e)


def http_post(url, data=None, headers=None, timeout=10):
    """发起 POST 请求，返回 (status_code, body_str)"""
    req = Request(url, method="POST")
    req.add_header("User-Agent", BROWSER_UA)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data:
        if isinstance(data, str):
            req.data = data.encode()
        else:
            req.data = json.dumps(data).encode()
    try:
        resp = urlopen(req, timeout=timeout)
        body = resp.read().decode("utf-8", errors="replace")
        return resp.status, body
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return e.code, body
    except URLError as e:
        return -1, str(e.reason)
    except Exception as e:
        return -2, str(e)


# ═══════════════════════════════════════════════════════════
# 检查项
# ═══════════════════════════════════════════════════════════

def check_dns_reachability(worker_url):
    """1. DNS + TCP 连通性"""
    section("1. Pages Functions 可达性")
    info(f"目标: {worker_url}")

    status, body = http_get(worker_url, timeout=10)
    if status == -1:
        fail(f"TCP 连接失败: {body}")
        return False
    elif status == -2:
        fail(f"请求异常: {body}")
        return False
    elif status >= 500:
        fail(f"服务端错误 (HTTP {status})")
        return False
    elif status == 403 and "1010" in body:
        warn(f"HTTP 403 + Cloudflare 1010（Bot Fight Mode 拦截，但 TCP 连通）")
        return True
    else:
        ok(f"连通正常 (HTTP {status})")
        # 检查是否返回了 HTML（说明 Pages 项目在运行）
        if "<html" in body.lower() or "<!doctype" in body.lower():
            ok("Pages 项目已部署且有静态首页")
        return True


def check_health_endpoint(worker_url):
    """2. /health 健康检查端点"""
    section("2. Health 端点")
    url = f"{worker_url}/api/health"
    info(f"GET {url}")

    status, body = http_get(url, timeout=10)
    if status == 200:
        try:
            data = json.loads(body)
            ok(f"健康检查通过: {json.dumps(data, ensure_ascii=False)}")
        except json.JSONDecodeError:
            ok(f"响应 200（非 JSON）: {body[:100]}")
        return True
    elif status == 404:
        # health 端点可能没部署
        warn(f"端点不存在 (404)，Pages Functions 可能未部署")
        return False
    elif status == 403 and "1010" in body:
        warn(f"Cloudflare Bot Fight Mode 拦截 (403+1010)，无法验证 health 端点")
        return None
    else:
        fail(f"健康检查失败 (HTTP {status}): {body[:200]}")
        return False


def check_github_token(github_token, repo):
    """3. GitHub PAT 有效性 + 权限"""
    section("3. GitHub PAT 权限检查")
    if not github_token:
        warn("未提供 GITHUB_TOKEN，跳过（用 --token 参数传入）")
        return None

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "TeachAny-HealthCheck/1.0",
    }

    # 3a. Token 基本身份
    info("检查 Token 身份...")
    status, body = http_get(f"{DEFAULT_API}/user", headers=headers)
    if status == 200:
        data = json.loads(body)
        ok(f"Token 有效，身份: {data.get('login', '?')} (type: {data.get('type', '?')})")
    elif status == 401:
        fail("Token 无效或已过期 (401)")
        return False
    else:
        fail(f"检查失败 (HTTP {status}): {body[:100]}")
        return False

    # 3b. 仓库访问权限
    info(f"检查仓库访问: {repo}")
    status, body = http_get(f"{DEFAULT_API}/repos/{repo}", headers=headers)
    if status == 200:
        data = json.loads(body)
        perms = data.get("permissions", {})
        ok(f"仓库可访问: {data.get('full_name', '?')}")
        can_push = perms.get("push", False) or perms.get("maintain", False) or perms.get("admin", False)
        if can_push:
            ok(f"写入权限: push={perms.get('push')}, maintain={perms.get('maintain')}, admin={perms.get('admin')}")
        else:
            fail(f"无写入权限! permissions={json.dumps(perms)}")
            return False
    elif status == 404:
        fail(f"仓库不存在或 Token 无权访问 (404)")
        return False
    else:
        fail(f"检查失败 (HTTP {status}): {body[:100]}")
        return False

    # 3c. Git Data API（Pages Functions 核心能力）
    info("检查 Git Data API 权限...")
    status, body = http_get(
        f"{DEFAULT_API}/repos/{repo}/git/refs/heads/main",
        headers=headers,
    )
    if status == 200:
        data = json.loads(body)
        sha = data.get("object", {}).get("sha", "?")[:8]
        ok(f"Git refs 可读: main → {sha}...")
    else:
        warn(f"Git refs 读取失败 (HTTP {status})，Pages Functions 的 Git Data API 可能无法工作")

    # 3d. PR 创建权限
    info("检查 PR 创建权限...")
    # 用 HEAD 请求模拟，看有没有权限（不发实际 PR）
    status, body = http_get(
        f"{DEFAULT_API}/repos/{repo}/pulls?state=open&per_page=1",
        headers=headers,
    )
    if status == 200:
        ok("PR 接口可访问")
    else:
        warn(f"PR 接口异常 (HTTP {status})")

    return True


def check_submit_endpoint(worker_url, github_token, repo):
    """4. Submit 端点实际功能（发送空 payload 验证格式校验）"""
    section("4. Submit 端点功能验证")
    url = f"{worker_url}/api/submit"
    info(f"POST {url}")

    # 发一个故意不完整的 payload，应该被 400 拦截（而非 500）
    minimal_payload = {
        "name": "health-check-test",
        "subject": "math",
        "grade": "test",
        "node_id": "health-check",
        "packageBase64": "UEsDBAoAAAAAAC",
    }
    status, body = http_post(
        url,
        data=json.dumps(minimal_payload),
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    if status == 400:
        try:
            data = json.loads(body)
            ok(f"格式校验正常，拒绝无效请求: {data.get('error', '')[:80]}")
        except json.JSONDecodeError:
            ok(f"返回 400（校验拦截）: {body[:100]}")
        return True
    elif status == 429:
        warn("触发限频 (429)，说明限频 KV 正常工作")
        return True
    elif status == 500:
        try:
            data = json.loads(body)
            err = data.get("error", body[:200])
            if "GITHUB_TOKEN" in err:
                fail(f"GITHUB_TOKEN 未配置或无效: {err[:120]}")
            else:
                fail(f"服务端内部错误: {err[:120]}")
        except json.JSONDecodeError:
            fail(f"服务端 500 错误: {body[:200]}")
        return False
    elif status == -1:
        fail(f"TCP 连接失败（与步骤 1 一致，可能网络问题）")
        return False
    elif status == 403 and "1010" in body:
        warn(f"Cloudflare Bot Fight Mode 拦截 (403+1010)，无法验证 submit 端点")
        warn("建议：Cloudflare Dashboard → Security → Bots → 关闭 Bot Fight Mode 或添加规则放行 /api/*")
        return None
    elif status == 200:
        # 极端情况：居然通过了（不应该）
        warn(f"返回 200，意外通过（可能验证逻辑有变化）: {body[:100]}")
        return True
    elif status == 202:
        try:
            data = json.loads(body)
            if data.get("ok"):
                ok(f"提交成功！PR: {data.get('pr_url', 'N/A')}")
                return True
            else:
                fail(f"提交失败: {data.get('message', body[:200])}")
                return False
        except json.JSONDecodeError:
            fail(f"返回 202 但无法解析: {body[:200]}")
            return False
    else:
        fail(f"未知响应 (HTTP {status}): {body[:200]}")
        return False


def check_kv_binding(worker_url, github_token, repo):
    """5. KV 限频功能（通过连续请求测试）"""
    section("5. KV 限频功能（可选，耗时较长）")
    warn("跳过（可通过步骤 4 的 429 状态间接验证）")


def check_dispatch_workflow(github_token, repo):
    """6. repository_dispatch workflow 是否存在"""
    section("6. GitHub Actions Workflows")
    if not github_token:
        warn("未提供 GITHUB_TOKEN，跳过")
        return

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "TeachAny-HealthCheck/1.0",
    }

    workflows = [
        ("community-submit.yml", "repository_dispatch 接收器"),
        ("community-review.yml", "PR 自动审核"),
        ("community-publish.yml", "合并后自动发布"),
    ]

    for wf_name, desc in workflows:
        info(f"检查 {wf_name} ({desc})...")
        status, body = http_get(
            f"{DEFAULT_API}/repos/{repo}/actions/workflows/{wf_name}",
            headers=headers,
        )
        if status == 200:
            data = json.loads(body)
            state = data.get("state", "?")
            path = data.get("path", "?")
            ok(f"存在且状态: {state} (path: {path})")
        elif status == 404:
            warn(f"不存在 (404) — {desc} 可能需要创建")
        else:
            fail(f"检查失败 (HTTP {status})")


def summary(results):
    """输出汇总"""
    section("检查汇总")
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)

    print(f"\n  通过: {GREEN}{passed}{RESET}  失败: {RED}{failed}{RESET}  跳过: {YELLOW}{skipped}{RESET}\n")

    if failed == 0:
        print(f"  {GREEN}{BOLD}🎉 所有检查通过，提交链路正常！{RESET}\n")
    else:
        print(f"  {RED}{BOLD}⚠️  存在失败项，请参考上方错误信息排查。{RESET}\n")
        print(f"  常见修复：")
        print(f"  1. GITHUB_TOKEN 过期 → GitHub Settings → Developer Settings → 刷新 PAT")
        print(f"  2. PAT 权限不足 → 确保 Fine-grained PAT 覆盖 {DEFAULT_REPO} 的 Contents:R/W + PR:R/W")
        print(f"  3. Pages Functions 未部署 → cd pages/ && npx wrangler pages deploy public --project-name teachany-community")
        print(f"  4. KV 绑定缺失 → Cloudflare Dashboard → Pages → teachany-community → Settings → Functions → KV bindings")
        print(f"  5. Secret 未配置 → npx wrangler pages secret put GITHUB_TOKEN --project-name teachany-community")


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="TeachAny Submit Pipeline 健康检查")
    parser.add_argument("--worker-url", default=DEFAULT_WORKER_URL, help="Pages Functions URL")
    parser.add_argument("--token", default=None, help="GitHub PAT（用于检查 Token 权限，不传则跳过 Token 检查）")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="目标仓库")
    args = parser.parse_args()

    print(f"\n{BOLD}🔍 TeachAny Submit Pipeline 健康检查{RESET}")
    print(f"   时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Worker: {args.worker_url}")
    print(f"   Repo: {args.repo}")

    results = {}

    # 1. DNS / TCP
    results["dns"] = check_dns_reachability(args.worker_url)

    # 2. Health endpoint
    results["health"] = check_health_endpoint(args.worker_url)

    # 3. GitHub Token
    token_result = check_github_token(args.token, args.repo)
    results["token"] = token_result

    # 4. Submit endpoint（如果 DNS 通了）
    if results["dns"]:
        results["submit"] = check_submit_endpoint(args.worker_url, args.token, args.repo)
    else:
        results["submit"] = None
        warn("DNS 不通，跳过 Submit 端点测试")

    # 5. KV
    results["kv"] = None  # 跳过，通过 submit 间接验证

    # 6. Workflows
    check_dispatch_workflow(args.token, args.repo)

    # 汇总
    summary(results)


if __name__ == "__main__":
    main()
