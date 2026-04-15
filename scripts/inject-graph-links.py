#!/usr/bin/env python3
"""
为所有生物课件的知识图谱节点注入点击跳转功能。

策略：
1. 从 registry.json 构建 node_id → path 映射
2. 从 biology-middle.json 构建 node_id → 中文名 映射
3. 在每个课件 HTML 的 </body> 前注入一段 JS：
   - COURSEWARE_MAP: 中文名(模糊匹配) → 相对URL
   - 为所有 .kg-node 绑定 click 事件
"""

import json
import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 1. 从 registry.json 构建 node_id → path ──
with open(os.path.join(ROOT, 'registry.json'), 'r', encoding='utf-8') as f:
    reg = json.load(f)

node_to_path = {}
for c in reg['courses']:
    if c.get('subject') == 'biology':
        nid = c['node_id']
        path = c['path']  # e.g. "examples/bio-food-chain"
        node_to_path[nid] = path

# ── 2. 从 biology-middle.json 构建 node_id → 中文名 ──
with open(os.path.join(ROOT, 'data/trees/biology-middle.json'), 'r', encoding='utf-8') as f:
    tree = json.load(f)

node_to_name = {}
for domain in tree['domains']:
    for node in domain.get('nodes', []):
        node_to_name[node['id']] = node['name']

# ── 3. 构建 中文名 → 相对URL 的映射 ──
# 由于图谱节点的文字可能是简写（如"🌍 生物圈"匹配"生物圈是最大的生态系统"），
# 需要同时支持精确匹配和包含匹配
name_to_url = {}
for nid, path in node_to_path.items():
    name = node_to_name.get(nid, '')
    if name:
        # 完整名称作为key
        name_to_url[name] = path
        # 去掉后缀描述的简短名也记录
        # 如 "食物链与食物网" → 也匹配 "食物链"

# ── 4. 生成要注入的 JS 代码 ──
# 使用相对路径（课件在 examples/xxx/ 下，跳转到 ../yyy/index.html）
js_map_entries = []
for nid, path in node_to_path.items():
    name = node_to_name.get(nid, '')
    if name:
        # path: "examples/bio-food-chain" -> folder name: "bio-food-chain"
        folder = path.split('/')[-1]
        js_map_entries.append(f'    "{name}": "../{folder}/index.html"')

js_map_str = ',\n'.join(sorted(js_map_entries, key=lambda x: x))

INJECT_SCRIPT = '\n<!-- ===== GRAPH NODE LINKS (auto-injected) ===== -->\n<script>\n(function(){\n  const COURSEWARE_MAP = {\n' + js_map_str + '\n  };\n' + r'''  const names = Object.keys(COURSEWARE_MAP);
  function findUrl(text) {
    // 清理 emoji 和空格
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '').trim();
    // 1. 精确匹配
    if (COURSEWARE_MAP[text]) return COURSEWARE_MAP[text];
    // 2. 文本包含名称（如"细胞分裂"匹配"细胞分裂与分化"）
    for (const n of names) {
      if (n.includes(text) || text.includes(n)) return COURSEWARE_MAP[n];
    }
    // 3. 部分关键词匹配（取前2-4个字）
    const key = text.replace(/[·、与和的是]/g, '').slice(0, 4);
    for (const n of names) {
      if (n.includes(key)) return COURSEWARE_MAP[n];
    }
    return null;
  }
  document.querySelectorAll('.kg-node').forEach(node => {
    // 跳过当前节点
    if (node.classList.contains('current')) return;
    const titleEl = node.querySelector('.node-title');
    const text = (titleEl ? titleEl.textContent : node.textContent).trim();
    const url = findUrl(text);
    if (url) {
      node.style.cursor = 'pointer';
      node.title = '点击跳转到该课件';
      // 移除旧的onclick
      node.removeAttribute('onclick');
      node.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = url;
      });
      // 添加链接图标
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
})();
</script>
'''

# ── 5. 批量注入到所有生物课件 ──
MARKER = '<!-- ===== GRAPH NODE LINKS (auto-injected) ===== -->'
bio_dirs = glob.glob(os.path.join(ROOT, 'examples/bio-*/index.html'))
count = 0

for html_path in sorted(bio_dirs):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 如果已有注入，先删除旧版本
    if MARKER in content:
        # 删除从 MARKER 到对应 </script> 的整个块
        pattern = re.compile(
            r'\n?' + re.escape(MARKER) + r'.*?</script>\s*',
            re.DOTALL
        )
        content = pattern.sub('', content)
    
    # 在 </body> 前注入
    if '</body>' in content:
        content = content.replace('</body>', INJECT_SCRIPT + '\n</body>')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f'✅ {os.path.basename(os.path.dirname(html_path))}')
    else:
        print(f'⚠️  No </body> found: {html_path}')

print(f'\n共注入 {count} 个课件')
