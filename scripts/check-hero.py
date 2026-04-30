#!/usr/bin/env python3
"""
TeachAny Hero 图基线校验脚本 (v6.3)

对应硬规则 #57 / SKILL_CN Section 0.5：
每个课件必须有 hero 封面图，HTML 必须真实引用，文件必须真实存在。

用法:
    python3 scripts/check-hero.py <课件目录>          # 检查单个课件
    python3 scripts/check-hero.py community/          # 批量检查
    python3 scripts/check-hero.py community/ --json   # 输出 JSON 给其他脚本调用

退出码:
    0 - 全部通过
    1 - 有课件未通过（ERROR）
    2 - 调用错误（参数错等）
"""
import sys
import os
import re
import json
import hashlib
from pathlib import Path

# Hero 文件命名模式
HERO_FILE_PATTERN = re.compile(r'.*hero.*\.(png|jpg|jpeg|webp|svg)$', re.IGNORECASE)
# HTML 中 hero 图引用模式：匹配 src="..." 或 url(...) 中含 hero 的图片路径
HERO_REF_PATTERN = re.compile(
    r'''(?:src\s*=\s*['"]|url\(\s*['"]?)([^'")\s]*hero[^'")\s]*\.(?:png|jpg|jpeg|webp|svg))''',
    re.IGNORECASE
)

# 最小文件大小（避免 0 字节占位符）
MIN_FILE_SIZE = 10 * 1024  # 10 KB
# 推荐最小尺寸（仅 warn 不 error）
MIN_WIDTH = 1024


def find_hero_files(course_dir: Path):
    """递归查找课件目录下所有 hero 图文件"""
    heroes = []
    for f in course_dir.rglob('*'):
        if f.is_file() and HERO_FILE_PATTERN.match(f.name):
            heroes.append(f)
    return heroes


def find_hero_refs_in_html(html_path: Path):
    """从 HTML 中提取所有 hero 图引用路径"""
    if not html_path.exists():
        return []
    try:
        text = html_path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return []
    return HERO_REF_PATTERN.findall(text)


def check_courseware(course_dir: Path):
    """检查单个课件，返回 (status, errors, warns)
    status: 'pass' | 'fail' | 'warn'
    """
    errors = []
    warns = []

    html_path = course_dir / 'index.html'
    if not html_path.exists():
        # 无 index.html → 不是真课件，跳过
        return 'skip', [], []

    hero_files = find_hero_files(course_dir)
    hero_refs = find_hero_refs_in_html(html_path)

    # 检查 1: 必须有 hero 文件
    if not hero_files:
        errors.append(f'缺 hero 图文件（assets/ 下无任何 *hero*.png/jpg/webp/svg）')

    # 检查 2: 必须有 HTML 引用
    if not hero_refs:
        errors.append(f'HTML 未引用任何 hero 图（src/url 中无 *hero*.* 路径）')

    # 检查 3: HTML 引用的本地路径必须真实存在（外链 URL 不检查，由用户确保 CDN 可用）
    if hero_refs and hero_files:
        hero_filenames = {f.name for f in hero_files}
        broken_refs = []
        for ref in hero_refs:
            # 跳过外链 URL（http/https 开头）
            if re.match(r'^https?://', ref, re.IGNORECASE):
                continue
            ref_filename = os.path.basename(ref)
            if ref_filename not in hero_filenames:
                broken_refs.append(ref)
        if broken_refs:
            errors.append(f'HTML 引用了 {len(broken_refs)} 个不存在的本地 hero 路径: {broken_refs[:3]}')

    # 如果只有外链引用且没本地文件，warn（CDN 不可控，建议本地化）
    if hero_refs and not hero_files:
        external_only = all(re.match(r'^https?://', r, re.IGNORECASE) for r in hero_refs)
        if external_only:
            warns.append(f'HTML 仅用外链 hero 图（{len(hero_refs)} 处），建议下载到本地 assets/ 防止 CDN 失效')
        # 如果有本地引用但本地无文件，已在上面 errors 处理过

    # 检查 4: 文件大小不能太小（避免占位符）
    if hero_files:
        small_files = [f for f in hero_files if f.stat().st_size < MIN_FILE_SIZE]
        if small_files:
            errors.append(f'{len(small_files)} 张 hero 图文件过小（< 10KB，可能是占位符）: {[f.name for f in small_files[:3]]}')

    # 决定 status
    if errors:
        return 'fail', errors, warns
    if warns:
        return 'warn', errors, warns
    return 'pass', errors, warns


def check_duplicate_heroes(courseware_results: dict, root: Path):
    """跨课件检查：禁止多个课件共用同一张 hero 图（按 md5 hash 比对）"""
    md5_to_paths = {}
    for cdir, result in courseware_results.items():
        if result['status'] not in ('pass', 'warn'):
            continue
        course_path = Path(cdir)
        if not course_path.exists():
            course_path = root / cdir
        if not course_path.exists():
            continue
        for f in find_hero_files(course_path):
            try:
                md5 = hashlib.md5(f.read_bytes()).hexdigest()
                md5_to_paths.setdefault(md5, []).append(str(f.relative_to(root) if root in f.parents else f))
            except Exception:
                pass

    duplicates = {md5: paths for md5, paths in md5_to_paths.items() if len(paths) > 1}
    return duplicates


def main():
    args = sys.argv[1:]
    json_mode = '--json' in args
    args = [a for a in args if a != '--json']

    if not args:
        print('用法: python3 scripts/check-hero.py <课件目录或 community 根目录> [--json]', file=sys.stderr)
        sys.exit(2)

    target = Path(args[0]).resolve()
    if not target.exists():
        print(f'❌ 路径不存在: {target}', file=sys.stderr)
        sys.exit(2)

    # 收集要检查的课件目录
    if (target / 'index.html').exists():
        # 单个课件
        courseware_dirs = [target]
        root = target.parent
    else:
        # 批量：找所有含 index.html 的子目录
        courseware_dirs = sorted({p.parent for p in target.rglob('index.html')
                                  if 'node_modules' not in str(p)})
        root = target

    results = {}
    pass_count = 0
    fail_count = 0
    warn_count = 0
    skip_count = 0

    for cdir in courseware_dirs:
        status, errors, warns = check_courseware(cdir)
        rel = str(cdir.relative_to(root) if root in cdir.parents or cdir == root else cdir)
        results[rel] = {
            'status': status,
            'errors': errors,
            'warns': warns,
        }
        if status == 'pass':
            pass_count += 1
        elif status == 'fail':
            fail_count += 1
        elif status == 'warn':
            warn_count += 1
        else:
            skip_count += 1

    # 跨课件查重
    duplicates = check_duplicate_heroes(results, root) if len(courseware_dirs) > 1 else {}
    if duplicates:
        for md5, paths in duplicates.items():
            warn_count += 1
            print(f'⚠️  WARN: 同一张 hero 图被 {len(paths)} 个课件复用 (md5={md5[:8]}):')
            for p in paths[:5]:
                print(f'      - {p}')

    # 输出
    if json_mode:
        out = {
            'summary': {
                'total': len(courseware_dirs),
                'pass': pass_count,
                'fail': fail_count,
                'warn': warn_count,
                'skip': skip_count,
            },
            'results': results,
            'duplicates': {md5: paths for md5, paths in duplicates.items()},
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f'\n=== TeachAny Hero 图基线校验 ===')
        print(f'目标: {target}')
        print(f'检查课件总数: {len(courseware_dirs)}')
        print(f'  ✅ 通过: {pass_count}')
        print(f'  ❌ 失败: {fail_count}')
        if warn_count:
            print(f'  ⚠️  警告: {warn_count}')
        if skip_count:
            print(f'  ⏭️  跳过 (无 index.html): {skip_count}')

        if fail_count > 0:
            print(f'\n=== 失败课件清单 ===')
            for rel, r in results.items():
                if r['status'] == 'fail':
                    print(f'\n❌ {rel}')
                    for e in r['errors']:
                        print(f'    - {e}')
            print(f'\n💡 修复建议：')
            print(f'   1. 用 image_gen 生成主题专属 hero 图（参考 SKILL_CN Section 0.5 prompt 模板）')
            print(f'   2. 存为 <课件目录>/assets/<course-id>-hero.png')
            print(f'   3. 在 HTML Hero section 添加 <img class="hero-cover-img" src="./assets/...-hero.png" alt="...">')
            print(f'   4. 重新跑本脚本验证')

        if fail_count == 0:
            print(f'\n✅ PASS: 所有课件 hero 图基线校验通过')

    sys.exit(0 if fail_count == 0 else 1)


if __name__ == '__main__':
    main()
