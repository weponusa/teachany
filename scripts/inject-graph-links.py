#!/usr/bin/env python3
"""
通用知识图谱跳转注入脚本 v2.0

为所有课件的知识图谱节点注入/更新点击跳转功能。
支持两种图谱实现：
  A. DIV 布局（.kg-node HTML 元素）— 注入 COURSEWARE_MAP + click 事件
  B. SVG 布局（knowledgeGraphData JS 对象）— 更新 hasCourseware / url 字段

数据源：
  - registry.json: courseware_id → { node_id, path, subject }
  - data/trees/*.json: node_id → 中文名（用于 DIV 布局模糊匹配）

用法：
  python3 scripts/inject-graph-links.py          # 处理所有课件
  python3 scripts/inject-graph-links.py --dry-run # 仅预览，不写文件
"""

import json
import os
import re
import glob
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY_RUN = '--dry-run' in sys.argv

# ════════════════════════════════════════════════════════════════
# 1. 构建全局映射表
# ════════════════════════════════════════════════════════════════

# 1a. registry.json → node_id → [{path, id, subject}]
with open(os.path.join(ROOT, 'registry.json'), 'r', encoding='utf-8') as f:
    reg = json.load(f)

# node_id 可能重复（多个课件对应同一 node_id），取第一个
node_to_info = {}       # node_id → {path, id, subject}
id_to_info = {}         # courseware_id → {path, node_id, subject}
path_to_id = {}         # path → courseware_id

for c in reg['courses']:
    nid = c.get('node_id', '')
    cid = c['id']
    path = c['path']  # e.g. "examples/bio-food-chain"
    subject = c.get('subject', '')
    info = {'path': path, 'id': cid, 'subject': subject, 'node_id': nid}
    id_to_info[cid] = info
    path_to_id[path] = cid
    if nid and nid not in node_to_info:
        node_to_info[nid] = info

# 1b. 所有知识树 JSON → node_id → 中文名
tree_dir = os.path.join(ROOT, 'data', 'trees')
node_to_name = {}   # node_id → 中文名

for tree_file in sorted(glob.glob(os.path.join(tree_dir, '*.json'))):
    with open(tree_file, 'r', encoding='utf-8') as f:
        tree = json.load(f)
    for domain in tree.get('domains', []):
        for node in domain.get('nodes', []):
            nid = node.get('id', '')
            name = node.get('name', '')
            if nid and name and nid not in node_to_name:
                node_to_name[nid] = name

# 1c. 构建 中文名 → 相对 URL 的映射（用于 DIV 布局注入）
#     以及 node_id → folder（用于 SVG 布局）
node_to_folder = {}  # node_id → folder name (e.g. "bio-food-chain")
name_to_url = {}     # 中文名 → "../folder/index.html"

for nid, info in node_to_info.items():
    folder = info['path'].split('/')[-1]
    node_to_folder[nid] = folder
    name = node_to_name.get(nid, '')
    if name:
        name_to_url[name] = f'../{folder}/index.html'

print(f'📊 注册表: {len(reg["courses"])} 课件, {len(node_to_info)} 唯一 node_id')
print(f'📊 知识树: {len(node_to_name)} 节点名, {len(name_to_url)} 名称→URL 映射')

# ════════════════════════════════════════════════════════════════
# 2. DIV 布局注入：COURSEWARE_MAP + click 事件
# ════════════════════════════════════════════════════════════════

# 生成全学科的 JS 映射表
js_map_entries = []
for name, url in sorted(name_to_url.items()):
    js_map_entries.append(f'    "{name}": "{url}"')
js_map_str = ',\n'.join(js_map_entries)

INJECT_SCRIPT = '\n<!-- ===== GRAPH NODE LINKS (auto-injected) ===== -->\n<script>\n(function(){\n  const COURSEWARE_MAP = {\n' + js_map_str + '\n  };\n' + r'''  const names = Object.keys(COURSEWARE_MAP);
  function findUrl(text) {
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '').trim();
    if (COURSEWARE_MAP[text]) return COURSEWARE_MAP[text];
    for (const n of names) {
      if (n.includes(text) || text.includes(n)) return COURSEWARE_MAP[n];
    }
    const key = text.replace(/[·、与和的是]/g, '').slice(0, 4);
    for (const n of names) {
      if (n.includes(key)) return COURSEWARE_MAP[n];
    }
    return null;
  }
  function bindNodes(selector, currentClass) {
    document.querySelectorAll(selector).forEach(node => {
      if (node.classList.contains(currentClass)) return;
      const titleEl = node.querySelector('.kn-title') || node.querySelector('.node-title');
      const text = (titleEl ? titleEl.textContent : node.textContent).trim();
      const url = findUrl(text);
      if (url) {
        node.style.cursor = 'pointer';
        node.title = '点击跳转到该课件';
        node.removeAttribute('onclick');
        node.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = url;
        });
        const linkIcon = document.createElement('span');
        linkIcon.textContent = ' ↗';
        linkIcon.style.cssText = 'font-size:.7em;opacity:.5;';
        (titleEl || node).appendChild(linkIcon);
      } else {
        node.style.cursor = 'default';
        node.style.opacity = '0.6';
        node.title = '暂无对应课件';
      }
    });
  }
  // 延迟执行以等待动态渲染的图谱节点
  setTimeout(function() {
    bindNodes('.kg-node', 'current');
    bindNodes('.graph-node', 'current');
    bindNodes('.graph-node', 'node-cur');
  }, 200);
})();
</script>
'''

MARKER = '<!-- ===== GRAPH NODE LINKS (auto-injected) ===== -->'

def inject_div_links(html_path):
    """为含 .kg-node 或 .graph-node 的 HTML 注入 COURSEWARE_MAP 跳转脚本"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 检测是否含有 DIV 图谱（.kg-node 或 .graph-node）
    has_kg_node = ('class="kg-node' in content or "class='kg-node" in content)
    has_graph_node = ('.graph-node' in content or 'graph-node' in content)
    if not has_kg_node and not has_graph_node:
        return False

    # 删除旧的注入块
    if MARKER in content:
        pattern = re.compile(
            r'\n?' + re.escape(MARKER) + r'.*?</script>\s*',
            re.DOTALL
        )
        content = pattern.sub('', content)

    # 在 </body> 前注入
    if '</body>' in content:
        content = content.replace('</body>', INJECT_SCRIPT + '\n</body>')
        if not DRY_RUN:
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
        return True
    return False


# ════════════════════════════════════════════════════════════════
# 3. SVG 布局更新：修改 knowledgeGraphData 中的跳转信息
# ════════════════════════════════════════════════════════════════

def update_svg_graph_data(html_path):
    """更新 knowledgeGraphData 中 prerequisites/nextTopics 的 hasCourseware/url"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'knowledgeGraphData' not in content:
        return False, 0

    changes = 0

    # 策略：用正则逐个匹配 prerequisites 和 nextTopics 中的节点块，
    # 检查其 id 字段，如果在 node_to_folder 中有对应课件，则更新 hasCourseware 和 url

    # 获取当前课件的 folder（用于避免自链接）
    folder = os.path.basename(os.path.dirname(html_path))

    def update_node_entry(match):
        """处理单个节点块，如 { id: "xxx", label: "xxx", hasCourseware: false, url: "", ... }"""
        nonlocal changes
        block = match.group(0)

        # 提取 id 字段值
        id_match = re.search(r'''(?:['"]id['"]|id)\s*:\s*['"]([^'"]+)['"]''', block)
        if not id_match:
            return block

        node_id = id_match.group(1)

        # 查找对应课件
        target_folder = node_to_folder.get(node_id)
        if not target_folder or target_folder == folder:
            return block  # 无对应课件，或是自身，不改

        target_url = f'../{target_folder}/index.html'

        # 检查当前 hasCourseware 值
        hcw_match = re.search(r'hasCourseware\s*:\s*(true|false)', block)
        url_match = re.search(r'''url\s*:\s*['"]([^'"]*)['"]''', block)

        if not hcw_match or not url_match:
            return block  # 格式不符，不动

        current_hcw = hcw_match.group(1)
        current_url = url_match.group(1)

        # 如果已经正确，跳过
        if current_hcw == 'true' and current_url == target_url:
            return block

        # 更新 hasCourseware
        new_block = block
        if current_hcw == 'false':
            new_block = new_block.replace(
                f'hasCourseware: false',
                f'hasCourseware: true',
                1
            ).replace(
                f'hasCourseware:false',
                f'hasCourseware:true',
                1
            )

        # 更新 url
        if current_url != target_url:
            # 处理两种格式：url: "" 和 url: "xxx"
            new_block = re.sub(
                r'''(url\s*:\s*)(['"])([^'"]*)\2''',
                lambda m: f'{m.group(1)}"{target_url}"',
                new_block,
                count=1
            )

        if new_block != block:
            changes += 1

        return new_block

    # 匹配 prerequisites 和 nextTopics 数组中的每个对象
    # 支持两种格式：多行展开（math-high-ellipse）和单行压缩（teachany-phy-mid-pressure）
    # 使用贪心策略匹配 { ... } 对象块

    # 首先找到 prerequisites 和 nextTopics 数组的位置区域
    for array_key in ['prerequisites', 'nextTopics']:
        # 匹配数组起始：prerequisites: [ 或 prerequisites:[
        array_start_pattern = re.compile(
            rf'{array_key}\s*:\s*\[',
            re.DOTALL
        )
        pos = 0
        while True:
            m = array_start_pattern.search(content, pos)
            if not m:
                break

            # 从数组开始位置找到对应的 ]
            bracket_start = m.end() - 1  # 指向 [
            depth = 1
            idx = bracket_start + 1
            while idx < len(content) and depth > 0:
                if content[idx] == '[':
                    depth += 1
                elif content[idx] == ']':
                    depth -= 1
                idx += 1
            bracket_end = idx  # ] 后面一位

            # 在这个数组区域内，匹配每个 { ... } 对象
            array_content = content[bracket_start:bracket_end]

            # 逐个匹配含 id 和 hasCourseware 的对象块
            obj_pattern = re.compile(
                r'\{[^{}]*?(?:id\s*:\s*[\'"][^\'"]+[\'"])[^{}]*?(?:hasCourseware\s*:\s*(?:true|false))[^{}]*?\}',
                re.DOTALL
            )
            new_array = obj_pattern.sub(update_node_entry, array_content)

            if new_array != array_content:
                content = content[:bracket_start] + new_array + content[bracket_end:]

            pos = bracket_start + len(new_array)

    if changes > 0 and not DRY_RUN:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

    return changes > 0, changes


# ════════════════════════════════════════════════════════════════
# 4. 批量处理所有课件
# ════════════════════════════════════════════════════════════════

examples_dir = os.path.join(ROOT, 'examples')
all_html = sorted(glob.glob(os.path.join(examples_dir, '*/index.html')))

div_count = 0
svg_count = 0
svg_links = 0
skip_count = 0

print(f'\n{"=" * 60}')
print(f'处理 {len(all_html)} 个课件...')
print(f'{"=" * 60}\n')

for html_path in all_html:
    folder = os.path.basename(os.path.dirname(html_path))

    # 跳过模板
    if folder == '_template':
        continue

    did_div = False
    did_svg = False
    svg_n = 0

    # 尝试 DIV 布局注入
    did_div = inject_div_links(html_path)

    # 尝试 SVG 布局更新
    did_svg, svg_n = update_svg_graph_data(html_path)

    if did_div or did_svg:
        markers = []
        if did_div:
            markers.append('DIV')
            div_count += 1
        if did_svg:
            markers.append(f'SVG({svg_n})')
            svg_count += 1
            svg_links += svg_n
        print(f'  ✅ {folder:45s} [{", ".join(markers)}]')
    else:
        skip_count += 1

# ════════════════════════════════════════════════════════════════
# 5. 报告
# ════════════════════════════════════════════════════════════════

print(f'\n{"=" * 60}')
print(f'📊 注入结果汇总')
print(f'{"=" * 60}')
print(f'  DIV 布局注入:    {div_count} 个课件')
print(f'  SVG 跳转更新:    {svg_count} 个课件, {svg_links} 个链接')
print(f'  跳过（无图谱）:  {skip_count} 个课件')
print(f'  总计处理:        {div_count + svg_count + skip_count} 个课件')
if DRY_RUN:
    print(f'\n  ⚠️  DRY RUN 模式，未实际写入文件')
print()
