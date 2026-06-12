#!/usr/bin/env python3
"""
TeachAny · Agnes 课件生图（服务端中转，用户无感）

无需用户配置 API Key，走 TeachAny 官方中转：
  POST https://www.teachany.cn/api/images/agnes

每课件默认最多 3 张（hero + 章节插图合计）。

用法：
  # 查剩余额度
  python3 agnes-image-gen.py --course-id math-linear-function --quota

  # 单张生图并下载到课件 assets/
  python3 agnes-image-gen.py \\
    --course-id math-linear-function \\
    --prompt "coordinate plane with linear function, slope triangle, flat educational style" \\
    --out community/math-linear-function/assets/hero.png \\
    --slot hero

  # 批量（JSON 内每项可有 name/prompt/size/slot）
  python3 agnes-image-gen.py \\
    --course-id math-linear-function \\
    --batch prompts.json \\
    --out-dir community/math-linear-function/assets/

环境变量（可选）：
  TEACHANY_API_BASE  默认 https://www.teachany.cn
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_API_BASE = 'https://www.teachany.cn'
DEFAULT_SIZE = '1280x768'
MIN_BYTES = 20 * 1024  # 与 validate-courseware 占位图阈值一致


def api_base() -> str:
    return os.environ.get('TEACHANY_API_BASE', DEFAULT_API_BASE).rstrip('/')


def http_json(method: str, path: str, body: dict | None = None, timeout: int = 130) -> dict:
    url = f'{api_base()}{path}'
    data = None
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'TeachAny-agnes-image-gen/1.0',
        'X-TeachAny-Client': 'skill',
    }
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', errors='replace')
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {'ok': False, 'message': raw[:500]}
        payload['_http_status'] = e.code
        return payload
    except urllib.error.URLError as e:
        raise RuntimeError(f'无法连接 {url}: {e.reason}') from e
    return json.loads(raw)


def fetch_quota(course_id: str) -> dict:
    q = urllib.parse.quote(course_id)
    return http_json('GET', f'/api/images/quota?course_id={q}', timeout=20)


def generate_remote(course_id: str, prompt: str, *, size: str = DEFAULT_SIZE, slot: str = '') -> dict:
    body = {'course_id': course_id, 'prompt': prompt, 'size': size}
    if slot:
        body['slot'] = slot
    return http_json('POST', '/api/images/agnes', body)


def download_image(url: str, out_path: Path, timeout: int = 120) -> int:
    req = urllib.request.Request(url, headers={'User-Agent': 'TeachAny/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    if len(data) < MIN_BYTES:
        raise RuntimeError(f'下载文件过小 ({len(data)} B)，可能无效')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(data)
    return len(data)


def gen_with_retry(course_id: str, prompt: str, **kwargs) -> dict:
    last = None
    for attempt in range(1, 4):
        result = generate_remote(course_id, prompt, **kwargs)
        if result.get('ok') and result.get('url'):
            return result
        last = result
        err = result.get('error') or result.get('message') or result
        if result.get('error') == 'COURSE_QUOTA_EXCEEDED':
            break
        if result.get('_http_status') == 429 and attempt < 3:
            wait = 15 * attempt
            print(f'  ⚠️  429 限流，{wait}s 后重试…')
            time.sleep(wait)
            continue
        if attempt < 3:
            time.sleep(5 * attempt)
    raise RuntimeError(f'生图失败: {last}')


def write_probe(out_dir: Path | None = None):
    probe = {
        'last_success_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'last_success_unix': int(time.time()),
        'source': 'teachany-agnes-proxy',
    }
    target = (out_dir or Path('.')) / '.teachany-image-gen-probe.json'
    target.write_text(json.dumps(probe, ensure_ascii=False, indent=2), encoding='utf-8')
    return target


def main():
    ap = argparse.ArgumentParser(description='TeachAny Agnes 课件生图（服务端中转）')
    ap.add_argument('--course-id', required=True, help='课件 ID（manifest id / 目录名）')
    ap.add_argument('--prompt', help='插图场景描述（英文或中文均可）')
    ap.add_argument('--size', default=DEFAULT_SIZE, help='512x512 / 1024x1024 / 1280x768 等')
    ap.add_argument('--slot', default='', help='hero / section1 / section2 …（仅日志）')
    ap.add_argument('--out', help='单张模式输出路径')
    ap.add_argument('--batch', help='批量 JSON 文件')
    ap.add_argument('--out-dir', help='批量输出目录')
    ap.add_argument('--quota', action='store_true', help='仅查询本课件剩余额度')
    ap.add_argument('--api-base', default='', help='覆盖 TEACHANY_API_BASE（调试用）')
    args = ap.parse_args()

    if args.api_base:
        os.environ['TEACHANY_API_BASE'] = args.api_base.rstrip('/')

    course_id = args.course_id.strip().lower()

    if args.quota:
        status = http_json('GET', '/api/images/quota', timeout=20)
        quota = fetch_quota(course_id)
        print(json.dumps({'service': status, 'course': quota}, ensure_ascii=False, indent=2))
        if not quota.get('ok'):
            sys.exit(1)
        return

    if args.prompt and args.out:
        print(f'🎨 TeachAny 中转生图 · {course_id} · {args.size}')
        print(f'   prompt: {args.prompt[:100]}{"…" if len(args.prompt) > 100 else ""}')
        t0 = time.time()
        result = gen_with_retry(course_id, args.prompt, size=args.size, slot=args.slot)
        dt = time.time() - t0
        out_path = Path(args.out)
        size_b = download_image(result['url'], out_path)
        probe = write_probe(out_path.parent)
        print(f'   ✅ {out_path} ({size_b // 1024} KB, {dt:.1f}s)')
        print(f'   额度: {result.get("used")}/{result.get("limit")}，剩余 {result.get("remaining")}')
        print(f'   探针: {probe}')
        return

    if args.batch and args.out_dir:
        batch_file = Path(args.batch)
        if not batch_file.exists():
            print(f'❌ 批量文件不存在: {batch_file}')
            sys.exit(1)
        tasks = json.loads(batch_file.read_text(encoding='utf-8'))
        out_dir = Path(args.out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f'🎨 批量生图 · {course_id} · {len(tasks)} 张')
        ok = 0
        failed = []
        for i, task in enumerate(tasks, 1):
            name = task.get('name', f'img_{i:03d}')
            prompt = task['prompt']
            size = task.get('size', args.size)
            slot = task.get('slot', name)
            print(f'[{i}/{len(tasks)}] {name}')
            try:
                result = gen_with_retry(course_id, prompt, size=size, slot=slot)
                out_path = out_dir / f'{name}.png'
                download_image(result['url'], out_path)
                print(f'   ✅ {out_path.name} · 剩余额度 {result.get("remaining")}')
                ok += 1
            except Exception as e:
                print(f'   ❌ {e}')
                failed.append({'name': name, 'error': str(e)})
        if ok:
            write_probe(out_dir)
        print(f'完成 {ok}/{len(tasks)}')
        if failed:
            for f in failed:
                print(f'  - {f["name"]}: {f["error"]}')
            sys.exit(1 if ok == 0 else 0)
        return

    ap.print_help()
    sys.exit(1)


if __name__ == '__main__':
    main()
