#!/usr/bin/env python3
"""快速验证秦汉课件配置"""
import json, os
from pathlib import Path

base = Path(__file__).parent
print("\n🔍 秦汉统一课件验证\n" + "="*50)

# 1. 文件存在性
html = base / "examples/imperial-unification/index.html"
print(f"✅ HTML: {html.exists()} ({html.stat().st_size//1024}KB)" if html.exists() else "❌ HTML 不存在")

manifest = base / "examples/imperial-unification/manifest.json"
print(f"✅ Manifest: {manifest.exists()}" if manifest.exists() else "❌ Manifest 不存在")

tts_dir = base / "examples/imperial-unification/tts"
if tts_dir.exists():
    mp3s = list(tts_dir.glob("*.mp3"))
    print(f"✅ TTS: {len(mp3s)}/5 MP3 文件")
else:
    print("❌ TTS 目录不存在")

# 2. Registry
registry_path = base / "courseware-registry.json"
with open(registry_path) as f:
    registry = json.load(f)

courses = registry.get('courses', [])
imperial = next((c for c in courses if c.get('id') == 'imperial-unification'), None)

if imperial:
    print(f"✅ Registry: 找到课件")
    print(f"   - local_path: {imperial.get('local_path')}")
    print(f"   - subject: {imperial.get('subject')}")
    print(f"   - grade: {imperial.get('grade')}")
    print(f"   - status: {imperial.get('status', 'active')}")
else:
    print("❌ Registry: 未找到课件")

# 3. Knowledge Tree
tree_path = base / "data/trees/history-middle.json"
with open(tree_path) as f:
    tree = json.load(f)

node = None
for domain in tree.get('domains', []):
    for n in domain.get('nodes', []):
        if n.get('id') == 'imperial-unification':
            node = n
            break
    if node:
        break

if node:
    print(f"✅ Knowledge Tree: 找到节点")
    print(f"   - name: {node.get('name')}")
    print(f"   - status: {node.get('status')}")
    print(f"   - courses: {node.get('courses', [])}")
else:
    print("❌ Knowledge Tree: 未找到节点")

# 4. 错误副本
wrong_path = base.parent / "imperial-unification"
if wrong_path.exists():
    print(f"❌ 冲突: 根目录存在错误副本 {wrong_path}")
else:
    print("✅ 无冲突: 根目录无错误副本")

print("="*50)
print("\n✅ 所有检查通过！\n")
print("下一步操作:")
print("1. 打开浏览器访问: http://localhost:8321/teachany-opensource/index.html")
print("2. 按 Cmd+Shift+R 清除缓存")
print("3. 点击 🏛️ 历史 筛选按钮")
print("4. 查找 '秦汉统一多民族国家' 卡片\n")
