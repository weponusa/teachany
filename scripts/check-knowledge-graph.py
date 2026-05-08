#!/usr/bin/env python3
"""
check-knowledge-graph.py — TeachAny 知识图谱合规检查（v7.9.13 新增）

背景：v7.9.10-11 的 bio-h-nervous-regulation 课件在「知识图谱」区块
手写了 60 多行硬编码 SVG（`<rect>/<text>/<line>`），完全绕过标准公共模块
`scripts/teachany-knowledge-graph.js`。这是 subagent 不读 SKILL.md 的典型症状。

本脚本检查单课件或批量扫描 community/ + examples/，验证：
  1. `<section id="knowledge-graph">` 存在
  2. 区块内使用 `data-teachany-kg="<node_id>"` 挂载点（公共模块入口）
  3. `<head>` 引入 `teachany-knowledge-graph.css`
  4. body 末尾引入 `teachany-knowledge-graph.js`
  5. 节点 ID 已在 `teachany-kg-manifest.json` 中注册

违规类型：
  - hardcoded-svg: 区块内出现 `<svg>` 含 `<rect>/<text>/<line>` 手写节点（非 canvas fallback）
  - missing-module-script: 缺 teachany-knowledge-graph.js 引用
  - missing-module-css:    缺 teachany-knowledge-graph.css 引用
  - missing-data-attr:     区块内无 `data-teachany-kg` 挂载点
  - missing-section:       课件完全没有 `<section id="knowledge-graph">`
  - node-not-in-manifest:  data-teachany-kg 的 node_id 不在 kg-manifest.json

退出码：
  0 = 全部合规
  1 = 至少一个课件违规
  2 = 脚本本身错误（manifest 丢失等）

用法：
  python3 scripts/check-knowledge-graph.py <课件目录>
  python3 scripts/check-knowledge-graph.py --batch [community_root]
  python3 scripts/check-knowledge-graph.py --json <课件目录>
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KG_MANIFEST = ROOT / "scripts" / "teachany-kg-manifest.json"

# 允许的 fallback canvas 标签（模块官方占位符）
FALLBACK_CANVAS_RE = re.compile(r'<canvas[^>]*class=["\'][^"\']*tkg-fallback-canvas', re.IGNORECASE)

# 硬编码 SVG 特征：<svg> 内有多个 <rect> 或 <line> 手写节点（≥2 个即判违规）
SVG_BLOCK_RE = re.compile(r'<svg\b[^>]*>(.*?)</svg>', re.IGNORECASE | re.DOTALL)
RECT_RE = re.compile(r'<rect\b', re.IGNORECASE)
LINE_RE = re.compile(r'<line\b', re.IGNORECASE)
TEXT_RE = re.compile(r'<text\b', re.IGNORECASE)

# 知识图谱区块识别
KG_SECTION_RE = re.compile(
    r'<section[^>]*id=["\']knowledge-graph["\'][^>]*>(.*?)</section>',
    re.IGNORECASE | re.DOTALL,
)

# 公共模块引用（支持 ../../scripts/、./、../scripts/ 等多种路径）
MODULE_JS_RE = re.compile(
    r'<script[^>]*src=["\'][^"\']*teachany-knowledge-graph\.js["\']',
    re.IGNORECASE,
)
MODULE_CSS_RE = re.compile(
    r'<link[^>]*href=["\'][^"\']*teachany-knowledge-graph\.css["\']',
    re.IGNORECASE,
)
DATA_ATTR_RE = re.compile(
    r'data-teachany-kg=["\']([^"\']+)["\']',
    re.IGNORECASE,
)


def load_manifest_nodes():
    """加载 kg-manifest 中所有合法 node_id"""
    if not KG_MANIFEST.exists():
        return None
    try:
        data = json.loads(KG_MANIFEST.read_text(encoding='utf-8'))
        nodes = data.get('nodes', {})
        return set(nodes.keys())
    except Exception:
        return None


def check_courseware(course_dir: Path, known_nodes=None):
    """检查单个课件的知识图谱合规性

    对 examples/ 下的课件采用宽松模式（只查硬编码 SVG，允许自定义实现）。
    对 community/ 下的课件采用严格模式（必须用公共模块）。
    """
    idx = course_dir / "index.html"
    # examples/ 是早期示例，允许使用自定义 D3/自包含实现
    is_example = 'examples' in course_dir.parts
    result = {
        'course': course_dir.name,
        'path': str(course_dir),
        'status': 'ok',
        'mode': 'lenient' if is_example else 'strict',
        'issues': [],
        'warnings': [],
    }

    if not idx.exists():
        result['status'] = 'skip'
        result['warnings'].append('no index.html')
        return result

    html = idx.read_text(encoding='utf-8', errors='replace')

    # 1. 必须有 knowledge-graph section（community 必须；examples 建议）
    kg_section_match = KG_SECTION_RE.search(html)
    if not kg_section_match:
        if is_example:
            result['status'] = 'skip'
            result['warnings'].append('no knowledge-graph section (examples 放行)')
            return result
        # _template 目录放行
        if course_dir.name.startswith('_') or course_dir.name.startswith('ext-'):
            result['status'] = 'skip'
            result['warnings'].append(f'{course_dir.name} 为模板/扩展目录，放行')
            return result
        result['status'] = 'fail'
        result['issues'].append({
            'type': 'missing-section',
            'msg': '缺少 <section id="knowledge-graph"> 区块（五件套基线 ⑦ 违规）',
        })
        return result

    kg_block = kg_section_match.group(1)

    # 2. 区块内必须有 data-teachany-kg 挂载点（community 严格）
    data_attr_match = DATA_ATTR_RE.search(kg_block)
    if not data_attr_match:
        if is_example:
            # examples 允许自定义实现，但下面仍会查硬编码 SVG
            result['warnings'].append('examples 使用自定义图谱实现（允许，非推荐）')
        else:
            result['status'] = 'fail'
            result['issues'].append({
                'type': 'missing-data-attr',
                'msg': '知识图谱区块内缺少 <div data-teachany-kg="<node_id>">（必须使用公共模块挂载点）',
            })
    else:
        node_id = data_attr_match.group(1).strip()
        result['node_id'] = node_id
        # 5. node_id 必须在 kg-manifest
        if known_nodes is not None and node_id not in known_nodes:
            result['status'] = 'fail'
            result['issues'].append({
                'type': 'node-not-in-manifest',
                'msg': f'data-teachany-kg="{node_id}" 未在 teachany-kg-manifest.json 注册（模块将渲染为空）',
                'hint': '请先在 scripts/teachany-kg-manifest.json 的 nodes 字段添加该节点，或使用 rebuild-index.py 重建索引',
            })

    # 3. 检查硬编码 SVG（v7.9.13 核心检查：防止 subagent 自造图谱，community 和 examples 都严查）
    svg_blocks = SVG_BLOCK_RE.findall(kg_block)
    for svg_body in svg_blocks:
        rect_count = len(RECT_RE.findall(svg_body))
        line_count = len(LINE_RE.findall(svg_body))
        text_count = len(TEXT_RE.findall(svg_body))
        # 判定：含 ≥2 个 rect（节点框）或 ≥2 个 line（连线）或 ≥4 个 text → 手写图谱
        if rect_count >= 2 or line_count >= 2 or text_count >= 4:
            result['status'] = 'fail'
            result['issues'].append({
                'type': 'hardcoded-svg',
                'msg': f'知识图谱区块内检测到手写 SVG（rect={rect_count} line={line_count} text={text_count}）—— 必须删除并改用公共模块',
                'hint': '标准写法：<div data-teachany-kg="<node_id>"><canvas class="tkg-fallback-canvas" width="720" height="120"></canvas></div>',
            })
            break

    # 4. 检查公共模块 JS/CSS 引用（community 严格，examples 放行）
    if not is_example:
        if not MODULE_JS_RE.search(html):
            result['status'] = 'fail'
            result['issues'].append({
                'type': 'missing-module-script',
                'msg': '未引入 <script src="../../scripts/teachany-knowledge-graph.js" defer>',
            })
        if not MODULE_CSS_RE.search(html):
            # CSS 缺失降级为 warning（模块本体即使无 CSS 也能跑，只是样式简陋）
            result['warnings'].append({
                'type': 'missing-module-css',
                'msg': '建议引入 <link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">',
            })

    return result


def find_courseware_dirs(root: Path):
    """找出 community/ 和 examples/ 下所有课件目录"""
    dirs = []
    for subdir in ('community', 'examples'):
        base = root / subdir
        if not base.exists():
            continue
        for d in sorted(base.iterdir()):
            if not d.is_dir():
                continue
            if d.name in ('archive', 'pending', 'node_modules', '_archive'):
                continue
            if (d / 'index.html').exists():
                dirs.append(d)
    return dirs


def main():
    parser = argparse.ArgumentParser(description='TeachAny 知识图谱合规检查（v7.9.13）')
    parser.add_argument('path', nargs='?', help='课件目录；留空=扫全仓')
    parser.add_argument('--batch', action='store_true', help='批量模式（默认=单课件）')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    parser.add_argument('--strict', action='store_true', help='把 warning 也视作失败')
    args = parser.parse_args()

    known_nodes = load_manifest_nodes()
    if known_nodes is None:
        print(f'❌ 无法加载 {KG_MANIFEST}', file=sys.stderr)
        sys.exit(2)

    # 决定扫描范围
    if args.batch or not args.path:
        targets = find_courseware_dirs(ROOT)
    else:
        p = Path(args.path).resolve()
        if not p.exists():
            print(f'❌ 路径不存在: {p}', file=sys.stderr)
            sys.exit(2)
        # 如果是 community/ 或 examples/ 父目录，仍批量
        if p.name in ('community', 'examples') or (p / 'community').exists():
            targets = find_courseware_dirs(p if (p / 'community').exists() else p.parent)
        elif (p / 'index.html').exists():
            targets = [p]
        else:
            print(f'❌ 非法路径（需是课件目录或 community/examples 目录）: {p}', file=sys.stderr)
            sys.exit(2)

    results = []
    for d in targets:
        results.append(check_courseware(d, known_nodes))

    # 统计
    total = len(results)
    failed = [r for r in results if r['status'] == 'fail']
    warned = [r for r in results if r['status'] != 'fail' and r.get('warnings')]

    if args.json:
        print(json.dumps({
            'total': total,
            'failed': len(failed),
            'results': results,
        }, ensure_ascii=False, indent=2))
    else:
        print(f'\n═══ 知识图谱合规检查（v7.9.13 规则 #69）═══')
        print(f'扫描 {total} 个课件')
        print(f'❌ 违规: {len(failed)}')
        print(f'⚠️  警告: {len(warned)}')
        print()

        for r in failed:
            print(f'❌ {r["course"]}')
            for iss in r['issues']:
                print(f'   [{iss["type"]}] {iss["msg"]}')
                if iss.get('hint'):
                    print(f'   💡 {iss["hint"]}')
            print()

        if warned and not failed:
            for r in warned:
                print(f'⚠️  {r["course"]}')
                for w in r['warnings']:
                    if isinstance(w, dict):
                        print(f'   [{w["type"]}] {w["msg"]}')
                    else:
                        print(f'   {w}')

        if not failed:
            print('✅ 所有课件知识图谱模块合规')

    if failed or (args.strict and warned):
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
