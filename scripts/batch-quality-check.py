#!/usr/bin/env python3
"""
TeachAny 课件批量质检脚本
根据 TeachAny SKILL 第 4 阶段规则检测课件质量
"""

import json
import sys
import os
from pathlib import Path
import re

def check_courseware(html_path):
    """检查单个课件，返回 (passed, errors, warnings)"""
    if not html_path.exists():
        return False, [f"文件不存在: {html_path}"], []
    
    try:
        content = html_path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        return False, [f"无法读取文件: {e}"], []
    
    errors = []  # 致命错误，导致不合格
    warnings = []  # 警告，不影响合格
    
    # === 必须项检查（不通过则不合格）===
    
    # 1. 必须有 teachany-node meta 标签
    if not re.search(r'<meta\s+name=["\']teachany-node["\']', content):
        errors.append("❌ 缺少 <meta name='teachany-node'> 标签（必须项）")
    
    # 2. 必须有 <body> 标签且内容不为空
    body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL | re.I)
    if not body_match:
        errors.append("❌ 缺少 <body> 标签")
    elif len(body_match.group(1).strip()) < 100:
        errors.append("❌ <body> 内容过少（疑似空白页面）")
    
    # 3. 必须有基本的教学内容结构（任一即可）
    has_content_structure = bool(
        # 方法1：TeachAny 标准结构（module/lesson/chapter/section）
        re.search(r'<(div|section)[^>]*(id|class)[^>]*["\']?(module|lesson|chapter|section|pretest|posttest|quiz)', content, re.I) or
        # 方法2：通用教学结构
        re.search(r'<(div|section)[^>]*(id|class)[^>]*["\']?(content|main|learning|exercise|practice|interaction)', content, re.I) or
        # 方法3：Canvas 交互区域
        re.search(r'<canvas[^>]*(id|class)[^>]*["\']?(canvas|graph|chart|plot|simulation)', content, re.I)
    )
    if not has_content_structure:
        errors.append("❌ 缺少教学内容区域结构（未检测到 module/lesson/canvas 等标记）")
    
    # 4. 不能有明显的错误页面标记
    if re.search(r'(File not found|Page Not Found|404)', content, re.I):
        errors.append("❌ 页面显示 404 或错误信息")
    
    # 5. 必须有交互元素（教学课件的核心要求）
    has_interaction = bool(
        re.search(r'<(button|input|canvas|select|textarea)', content, re.I) or
        re.search(r'(addEventListener|onclick|onchange|onsubmit)', content)
    )
    if not has_interaction:
        errors.append("❌ 未检测到任何交互元素（按钮/输入框/Canvas/事件监听）")
    
    # === 警告项检查（建议改进，但不影响合格）===
    
    # 6. TTS 音频一致性检查
    has_tts_meta = bool(re.search(r'<meta[^>]*teachany-tts', content, re.I))
    audio_refs = re.findall(r'<audio[^>]*src=["\']([^"\']+)["\']', content)
    if has_tts_meta and not audio_refs:
        warnings.append("⚠️ 声称有 TTS 但未找到 <audio> 标签")
    
    # 7. 检查外部依赖（过多可能不稳定）
    cdn_refs = re.findall(r'https?://[^\s"\'<>]+\.(js|css)', content)
    if len(cdn_refs) > 15:
        warnings.append(f"⚠️ 外部依赖较多 ({len(cdn_refs)} 个)，建议减少以提高稳定性")
    
    # 8. 文件大小检查
    size_kb = html_path.stat().st_size / 1024
    if size_kb > 800:
        warnings.append(f"⚠️ 文件较大 ({size_kb:.0f} KB)，可能影响加载速度")
    
    # 9. 危险代码检查
    if re.search(r'\beval\s*\(', content):
        warnings.append("⚠️ 包含 eval() 代码，存在安全风险")
    
    # 10. 响应式设计检查
    if not re.search(r'<meta[^>]*viewport', content, re.I):
        warnings.append("⚠️ 缺少 viewport meta 标签，移动端可能显示不正常")
    
    return len(errors) == 0, errors, warnings

def main():
    script_dir = Path(__file__).parent.parent
    registry_path = script_dir / 'courseware-registry.json'
    
    if len(sys.argv) > 1:
        # 指定课件 ID 列表
        course_ids = sys.argv[1].split(',')
    else:
        # 检测所有课件
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        course_ids = [c['id'] for c in registry['courses'] if c.get('local_path')]
    
    results = []
    passed_count = 0
    failed_count = 0
    
    print(f"开始检测 {len(course_ids)} 个课件...")
    print("=" * 80)
    
    for course_id in course_ids:
        # 查找课件路径
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        course = next((c for c in registry['courses'] if c['id'] == course_id), None)
        
        if not course:
            print(f"❌ {course_id}: 未在 registry 中找到")
            failed_count += 1
            results.append({'id': course_id, 'passed': False, 'errors': ['未在 registry 中找到']})
            continue
        
        local_path = course.get('local_path')
        if not local_path:
            print(f"❌ {course_id}: 无 local_path")
            failed_count += 1
            results.append({'id': course_id, 'passed': False, 'errors': ['无 local_path']})
            continue
        
        html_path = script_dir / 'examples' / local_path / 'index.html'
        passed, errors, warnings = check_courseware(html_path)
        
        if passed:
            status_icon = "✅"
            if warnings:
                status_icon = "⚠️"  # 有警告但仍合格
            print(f"{status_icon} {course_id} ({course['subject']}, Grade {course['grade']})")
            if warnings:
                for warn in warnings:
                    print(f"   {warn}")
            passed_count += 1
        else:
            print(f"❌ {course_id} ({course['subject']}, Grade {course['grade']})")
            for err in errors:
                print(f"   {err}")
            if warnings:
                for warn in warnings:
                    print(f"   {warn}")
            failed_count += 1
        
        results.append({
            'id': course_id,
            'name': course['name'],
            'subject': course['subject'],
            'grade': course['grade'],
            'passed': passed,
            'errors': errors,
            'warnings': warnings
        })
    
    print("=" * 80)
    print(f"检测完成: {passed_count} 个合格, {failed_count} 个不合格")
    print(f"合格率: {passed_count / len(course_ids) * 100:.1f}%")
    
    # 输出不合格课件清单
    if failed_count > 0:
        print("\n不合格课件清单:")
        for r in results:
            if not r['passed']:
                print(f"  - {r['id']}: {', '.join(r['errors'])}")
    
    # 输出 JSON 结果
    output_path = script_dir / 'quality-check-report.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(course_ids),
            'passed': passed_count,
            'failed': failed_count,
            'pass_rate': passed_count / len(course_ids),
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n详细报告已保存到: {output_path}")
    
    return 0 if failed_count == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
