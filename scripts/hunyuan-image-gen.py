#!/usr/bin/env python3
"""
TeachAny · 腾讯混元生图 API 客户端

用法 A（单张测试）：
  python3 hunyuan-image-gen.py --prompt "水墨画风格，小儿撑船采莲" --out /tmp/test.png

用法 B（批量 · 课件配图）：
  python3 hunyuan-image-gen.py --batch prompts.json --out-dir community/xxx/images/

prompts.json 格式：
  [
    {"name": "hero", "prompt": "...", "size": "1280x768"},
    {"name": "poem1", "prompt": "...", "size": "1024x1024"}
  ]

环境变量：
  HUNYUAN_API_KEY  API Key（也可用 --api-key 传入）
  HUNYUAN_API_BASE 默认 http://hunyuanapi.woa.com（内网）
"""
import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

API_BASE = os.environ.get('HUNYUAN_API_BASE', 'http://hunyuanapi.woa.com')
DEFAULT_MODEL = 'hunyuan-image'
DEFAULT_SIZE = '1024x1024'
DEFAULT_FOOTNOTE = 'AI 生成'  # 合规水印


def gen_image(api_key: str, prompt: str, *,
              size: str = DEFAULT_SIZE,
              model: str = DEFAULT_MODEL,
              version: str = 'v1.9',
              style: str = None,
              negative_prompt: str = None,
              footnote: str = DEFAULT_FOOTNOTE,
              revise: bool = True,
              seed: int = None,
              timeout: int = 60) -> dict:
    """调用混元生图，返回 {url, revised_prompt} 或抛异常"""
    url = f'{API_BASE}/openapi/v1/images/generations'
    body = {
        'model': model,
        'version': version,
        'prompt': prompt,
        'size': size,
        'n': 1,
        'revise': revise,
        'footnote': footnote,
    }
    if style:
        body['style'] = style
    if negative_prompt:
        body['negative_prompt'] = negative_prompt
    if seed is not None:
        body['seed'] = seed

    req = urllib.request.Request(
        url,
        data=json.dumps(body, ensure_ascii=False).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'HTTP {e.code}: {err[:500]}')
    except urllib.error.URLError as e:
        raise RuntimeError(f'网络错误: {e.reason}')

    if 'error' in data and data['error']:
        raise RuntimeError(f'API 返回错误: {data["error"]}')

    if 'data' not in data or not data['data']:
        raise RuntimeError(f'API 返回缺 data: {data}')

    return {
        'url': data['data'][0]['url'],
        'revised_prompt': data['data'][0].get('revised_prompt', prompt),
        'id': data.get('id', ''),
    }


def download_image(url: str, out_path: Path, timeout: int = 60) -> int:
    """下载图片到本地，返回文件大小（字节）"""
    req = urllib.request.Request(url, headers={'User-Agent': 'TeachAny/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(data)
    return len(data)


def gen_with_retry(api_key: str, prompt: str, *,
                   max_retries: int = 3,
                   retry_delay: float = 3.0,
                   **kwargs) -> dict:
    """带重试的生图"""
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            return gen_image(api_key, prompt, **kwargs)
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                print(f'  ⚠️  第 {attempt} 次失败: {e}，{retry_delay}s 后重试...')
                time.sleep(retry_delay)
    raise RuntimeError(f'共重试 {max_retries} 次仍失败，最后错误: {last_err}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--api-key', default=os.environ.get('HUNYUAN_API_KEY'),
                    help='API Key（也可通过 HUNYUAN_API_KEY 环境变量传入）')
    ap.add_argument('--prompt', help='单张生图的文本描述')
    ap.add_argument('--size', default=DEFAULT_SIZE,
                    help='图片尺寸 (1024x1024 / 1024x768 / 1280x768 / 768x1280)')
    ap.add_argument('--style', help='风格（仅 v1.9）')
    ap.add_argument('--negative-prompt', help='负向提示词（仅 v1.9）')
    ap.add_argument('--footnote', default=DEFAULT_FOOTNOTE, help='水印内容（右下角）')
    ap.add_argument('--no-revise', action='store_true', help='关闭 prompt 自动改写')
    ap.add_argument('--out', help='单张生图输出路径')
    ap.add_argument('--batch', help='批量生图 JSON 文件路径')
    ap.add_argument('--out-dir', help='批量生图输出目录')
    ap.add_argument('--seed', type=int, help='随机种子')
    args = ap.parse_args()

    if not args.api_key:
        print('❌ 缺 API Key，请通过 --api-key 或 HUNYUAN_API_KEY 环境变量传入')
        sys.exit(1)

    common = dict(
        size=args.size,
        style=args.style,
        negative_prompt=args.negative_prompt,
        footnote=args.footnote,
        revise=not args.no_revise,
        seed=args.seed,
    )

    # 单张模式
    if args.prompt and args.out:
        print(f'🎨 单张生图 · size={args.size} · footnote={args.footnote}')
        print(f'   prompt: {args.prompt[:80]}{"..." if len(args.prompt) > 80 else ""}')
        t0 = time.time()
        result = gen_with_retry(args.api_key, args.prompt, **common)
        dt = time.time() - t0
        print(f'   ✅ 生成耗时: {dt:.1f}s')
        print(f'   改写后: {result["revised_prompt"][:80]}...')
        out_path = Path(args.out)
        size_bytes = download_image(result['url'], out_path)
        print(f'   📥 已下载: {out_path} ({size_bytes // 1024} KB)')
        return

    # 批量模式
    if args.batch and args.out_dir:
        batch_file = Path(args.batch)
        if not batch_file.exists():
            print(f'❌ 批量文件不存在: {batch_file}')
            sys.exit(1)
        tasks = json.loads(batch_file.read_text(encoding='utf-8'))
        out_dir = Path(args.out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        print(f'🎨 批量生图 · {len(tasks)} 张 · 输出目录 {out_dir}')
        print()

        success = 0
        failed = []
        t_start = time.time()
        for i, task in enumerate(tasks, 1):
            name = task.get('name', f'img_{i:03d}')
            prompt = task['prompt']
            size = task.get('size', DEFAULT_SIZE)
            print(f'[{i}/{len(tasks)}] {name} ({size})')
            print(f'   📝 {prompt[:100]}{"..." if len(prompt) > 100 else ""}')
            try:
                t0 = time.time()
                result = gen_with_retry(
                    args.api_key, prompt,
                    size=size,
                    style=task.get('style') or args.style,
                    negative_prompt=task.get('negative_prompt') or args.negative_prompt,
                    footnote=task.get('footnote') or args.footnote,
                    revise=not args.no_revise,
                    seed=task.get('seed') or args.seed,
                )
                out_path = out_dir / f'{name}.png'
                size_bytes = download_image(result['url'], out_path)
                dt = time.time() - t0
                print(f'   ✅ {out_path.name} ({size_bytes // 1024} KB, {dt:.1f}s)')
                success += 1
            except Exception as e:
                print(f'   ❌ 失败: {e}')
                failed.append({'name': name, 'error': str(e)})

        total = time.time() - t_start
        print()
        print('=' * 60)
        print(f'✅ 成功: {success}/{len(tasks)} · 总耗时: {total:.1f}s · 平均: {total/len(tasks):.1f}s/张')
        if failed:
            print(f'❌ 失败 {len(failed)} 张:')
            for f in failed:
                print(f'   - {f["name"]}: {f["error"]}')
        print('=' * 60)
        return

    ap.print_help()
    sys.exit(1)


if __name__ == '__main__':
    main()
