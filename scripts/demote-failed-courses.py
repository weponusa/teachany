#!/usr/bin/env python3
"""
将质检不合格的课件从 registry 降级到 community
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

def main():
    script_dir = Path(__file__).parent.parent
    registry_path = script_dir / 'courseware-registry.json'
    community_path = script_dir / 'community' / 'index.json'
    report_path = script_dir / 'quality-check-report.json'
    
    # 读取质检报告
    with open(report_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    failed_ids = [r['id'] for r in report['results'] if not r['passed']]
    
    if not failed_ids:
        print("✅ 所有课件均合格，无需降级")
        return 0
    
    print(f"准备降级 {len(failed_ids)} 个不合格课件到社区...")
    print("=" * 80)
    
    # 读取 registry
    with open(registry_path, 'r', encoding='utf-8') as f:
        registry = json.load(f)
    
    # 读取 community index
    if community_path.exists():
        with open(community_path, 'r', encoding='utf-8') as f:
            community = json.load(f)
    else:
        community = {'version': '1.0', 'updated_at': '', 'courses': []}
    
    demoted = []
    kept = []
    
    for course in registry['courses']:
        if course['id'] in failed_ids:
            # 降级到社区
            print(f"⬇️  降级: {course['id']} - {course['name']}")
            
            # 转换为社区课件格式
            community_course = {
                'id': course['id'],
                'node_id': course.get('node_id', ''),
                'name': course['name'],
                'name_en': course.get('name_en', ''),
                'subject': course['subject'],
                'grade': course['grade'],
                'author': course.get('author', 'TeachAny'),
                'description': course.get('description', ''),
                'tags': course.get('tags', []),
                'likes': 0,
                'downloads': 0,
                'approved_at': datetime.now(timezone.utc).isoformat(),
                'download_url': course.get('download_url', ''),
                'version': course.get('version', '1.0'),
                'status': 'demoted',  # 标记为降级
                'demote_reason': '缺少必要的 meta 标签或结构不完整',
                'original_registry': True
            }
            
            # 避免重复添加
            if not any(c['id'] == course['id'] for c in community['courses']):
                community['courses'].append(community_course)
                demoted.append(course['id'])
        else:
            kept.append(course)
    
    # 更新 registry（移除不合格课件）
    registry['courses'] = kept
    registry['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    with open(registry_path, 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
    
    # 更新 community index
    community['updated_at'] = datetime.now(timezone.utc).isoformat()
    community['courses'].sort(key=lambda c: (c.get('likes', 0), c.get('downloads', 0)), reverse=True)
    
    community_path.parent.mkdir(parents=True, exist_ok=True)
    with open(community_path, 'w', encoding='utf-8') as f:
        json.dump(community, f, indent=2, ensure_ascii=False)
    
    print("=" * 80)
    print(f"✅ 降级完成:")
    print(f"   - Registry: {len(registry['courses'])} 个课件（保留）")
    print(f"   - Community: {len(community['courses'])} 个课件（含 {len(demoted)} 个降级）")
    print(f"\n降级课件列表:")
    for cid in demoted:
        print(f"   - {cid}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
