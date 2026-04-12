#!/usr/bin/env python3
"""
课件完整整合脚本
- 解压所有 dist/*.teachany 包到 examples/
- 扫描 examples/ 目录生成完整 registry.json
- 统一所有课件(本地 + Git + .teachany包)
"""

import json
import os
import zipfile
from pathlib import Path
from datetime import datetime

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / 'dist'
EXAMPLES_DIR = ROOT_DIR / 'examples'
REGISTRY_FILE = ROOT_DIR / 'registry.json'
OLD_REGISTRY = ROOT_DIR / 'courseware-registry.json'
COMMUNITY_INDEX = ROOT_DIR / 'community' / 'index.json'

print("=" * 60)
print("课件完整整合脚本")
print("=" * 60)

# Step 1: 解压所有 .teachany 包
print("\n[Step 1] 解压 dist/*.teachany 包到 examples/")
print("-" * 60)

teachany_files = list(DIST_DIR.glob('*.teachany'))
print(f"找到 {len(teachany_files)} 个 .teachany 包")

extracted_count = 0
skipped_count = 0
failed_count = 0

for teachany_file in sorted(teachany_files):
    course_id = teachany_file.stem
    target_dir = EXAMPLES_DIR / course_id
    
    # 如果目录已存在,跳过
    if target_dir.exists():
        print(f"  ⏭️  {course_id} (已存在)")
        skipped_count += 1
        continue
    
    # 解压
    try:
        with zipfile.ZipFile(teachany_file, 'r') as zip_ref:
            zip_ref.extractall(target_dir)
        print(f"  ✅ {course_id}")
        extracted_count += 1
    except zipfile.BadZipFile:
        print(f"  ❌ {course_id} (Zip文件损坏)")
        failed_count += 1
    except Exception as e:
        print(f"  ❌ {course_id} (错误: {e})")
        failed_count += 1

print(f"\n解压统计: ✅ {extracted_count} 个新解压, ⏭️  {skipped_count} 个已存在, ❌ {failed_count} 个失败")

# Step 2: 扫描 examples/ 目录
print("\n[Step 2] 扫描 examples/ 目录")
print("-" * 60)

all_courses = []
template_dirs = ['_template', 'courseware-template']

for course_dir in sorted(EXAMPLES_DIR.iterdir()):
    if not course_dir.is_dir():
        continue
    
    # 跳过模板目录
    if course_dir.name in template_dirs:
        print(f"  ⏭️  {course_dir.name} (模板目录,跳过)")
        continue
    
    manifest_file = course_dir / 'manifest.json'
    index_file = course_dir / 'index.html'
    
    # 必须有 index.html
    if not index_file.exists():
        print(f"  ⚠️  {course_dir.name} (缺少 index.html,跳过)")
        continue
    
    # 读取 manifest.json (如果存在)
    if manifest_file.exists():
        try:
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # 添加必要字段
            course_id = course_dir.name
            manifest['id'] = course_id
            manifest['path'] = f"examples/{course_id}"
            manifest['url'] = f"./examples/{course_id}/index.html"
            
            # 如果没有 status 字段,默认为 community
            if 'status' not in manifest:
                manifest['status'] = 'community'
            
            all_courses.append(manifest)
            print(f"  ✅ {course_id} ({manifest.get('status', 'community')})")
        except json.JSONDecodeError:
            print(f"  ❌ {course_dir.name} (manifest.json 格式错误)")
        except Exception as e:
            print(f"  ❌ {course_dir.name} (错误: {e})")
    else:
        print(f"  ⚠️  {course_dir.name} (缺少 manifest.json,跳过)")

print(f"\n扫描结果: 找到 {len(all_courses)} 个有效课件")

# 统计状态
official_count = sum(1 for c in all_courses if c.get('status') == 'official')
community_count = sum(1 for c in all_courses if c.get('status') == 'community')
print(f"  - 官方课件: {official_count} 个")
print(f"  - 社区课件: {community_count} 个")

# Step 3: 读取旧注册表,补充 status 字段
print("\n[Step 3] 补充课件状态信息")
print("-" * 60)

official_ids = set()

# 从旧的 courseware-registry.json 读取官方课件列表
if OLD_REGISTRY.exists():
    with open(OLD_REGISTRY, 'r', encoding='utf-8') as f:
        old_data = json.load(f)
        for course in old_data.get('courses', []):
            official_ids.add(course['id'])
    print(f"从 courseware-registry.json 读取 {len(official_ids)} 个官方课件ID")

# 更新 status 字段
updated_count = 0
for course in all_courses:
    if course['id'] in official_ids and course.get('status') != 'official':
        course['status'] = 'official'
        updated_count += 1
        print(f"  ✏️  {course['id']} → official")

if updated_count > 0:
    print(f"\n更新了 {updated_count} 个课件的状态")
else:
    print("\n所有课件状态已正确")

# Step 4: 生成 registry.json
print("\n[Step 4] 生成 registry.json")
print("-" * 60)

registry = {
    "version": "3.0",
    "updated_at": datetime.now().isoformat() + 'Z',
    "description": "Unified courseware registry for all TeachAny coursewares",
    "courses": all_courses
}

# 备份旧的 registry.json
if REGISTRY_FILE.exists():
    backup_file = ROOT_DIR / f'registry-backup-{datetime.now().strftime("%Y%m%d%H%M%S")}.json'
    REGISTRY_FILE.rename(backup_file)
    print(f"备份旧注册表: {backup_file.name}")

# 写入新的 registry.json
with open(REGISTRY_FILE, 'w', encoding='utf-8') as f:
    json.dump(registry, f, ensure_ascii=False, indent=2)

print(f"✅ 生成 registry.json: {len(all_courses)} 个课件")

# Step 5: 生成报告
print("\n" + "=" * 60)
print("整合完成报告")
print("=" * 60)
print(f"\n📦 .teachany 包解压:")
print(f"  - 新解压: {extracted_count} 个")
print(f"  - 已存在: {skipped_count} 个")
print(f"  - 失败: {failed_count} 个")

print(f"\n📚 课件总数: {len(all_courses)} 个")
print(f"  - 官方课件: {official_count} 个")
print(f"  - 社区课件: {community_count} 个")

print(f"\n📁 存储位置: examples/")
print(f"📄 注册表: registry.json (v3.0)")

print("\n✅ 所有课件已统一整合到 examples/ 目录")
print("=" * 60)
