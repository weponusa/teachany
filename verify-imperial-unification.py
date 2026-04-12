#!/usr/bin/env python3
"""
秦汉统一多民族国家课件发布验证脚本
自动检查所有关键数据和文件是否正确配置
"""

import json
import os
from pathlib import Path

def print_status(passed, message):
    """打印带颜色的状态信息"""
    icon = "✅" if passed else "❌"
    print(f"{icon} {message}")
    return passed

def check_file_exists(filepath, description):
    """检查文件是否存在"""
    exists = os.path.exists(filepath)
    size = os.path.getsize(filepath) if exists else 0
    size_kb = size / 1024
    msg = f"{description}: {filepath}"
    if exists:
        msg += f" ({size_kb:.1f} KB)"
    return print_status(exists, msg)

def main():
    print("=" * 60)
    print("🔍 秦汉统一多民族国家课件发布验证")
    print("=" * 60)
    print()
    
    base_dir = Path(__file__).parent
    all_passed = True
    
    # 1. 检查课件文件
    print("📁 课件文件检查")
    print("-" * 60)
    courseware_dir = base_dir / "examples" / "imperial-unification"
    all_passed &= check_file_exists(
        courseware_dir / "index.html",
        "课件主页"
    )
    all_passed &= check_file_exists(
        courseware_dir / "manifest.json",
        "元数据文件"
    )
    
    # 检查 TTS 文件
    tts_dir = courseware_dir / "tts"
    if tts_dir.exists():
        tts_files = list(tts_dir.glob("*.mp3"))
        all_passed &= print_status(
            len(tts_files) == 5,
            f"TTS 语音文件: {len(tts_files)}/5"
        )
        total_size = sum(f.stat().st_size for f in tts_files)
        print(f"   总大小: {total_size / 1024 / 1024:.1f} MB")
    else:
        all_passed &= print_status(False, "TTS 目录不存在")
    print()
    
    # 2. 检查 registry
    print("📋 Registry 注册表检查")
    print("-" * 60)
    registry_path = base_dir / "courseware-registry.json"
    if check_file_exists(registry_path, "注册表文件"):
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        
        # 查找课件条目 (支持 'coursewares' 或 'courses' 键名)
        courses_key = 'coursewares' if 'coursewares' in registry else 'courses'
        courseware = next(
            (c for c in registry.get(courses_key, []) 
             if c.get('id') == 'imperial-unification'),
            None
        )
        
        if courseware:
            print_status(True, "找到课件条目")
            
            # 检查关键字段
            checks = [
                (courseware.get('node_id') == 'imperial-unification', 
                 f"node_id: {courseware.get('node_id')}"),
                (courseware.get('subject') == 'history',
                 f"学科: {courseware.get('subject')}"),
                (courseware.get('grade') == 7,
                 f"年级: {courseware.get('grade')}"),
                (courseware.get('local_path') == 'examples/imperial-unification',
                 f"路径: {courseware.get('local_path')}"),
                (courseware.get('status') == 'active',
                 f"状态: {courseware.get('status')}")
            ]
            
            for passed, msg in checks:
                all_passed &= print_status(passed, msg)
        else:
            all_passed &= print_status(False, "未找到课件条目")
    print()
    
    # 3. 检查知识树
    print("🗺️ 知识树检查")
    print("-" * 60)
    tree_path = base_dir / "data" / "trees" / "history-middle.json"
    if check_file_exists(tree_path, "知识树文件"):
        with open(tree_path, 'r', encoding='utf-8') as f:
            tree = json.load(f)
        
        # 查找节点
        node = None
        for domain in tree.get('domains', []):
            for n in domain.get('nodes', []):
                if n.get('id') == 'imperial-unification':
                    node = n
                    break
            if node:
                break
        
        if node:
            print_status(True, f"找到节点: {node.get('name')}")
            
            checks = [
                (node.get('status') == 'active',
                 f"状态: {node.get('status')}"),
                (node.get('grade') == 7,
                 f"年级: {node.get('grade')}"),
                ('courses' in node and len(node['courses']) > 0,
                 f"课件数组: {node.get('courses', [])}"),
            ]
            
            for passed, msg in checks:
                all_passed &= print_status(passed, msg)
        else:
            all_passed &= print_status(False, "未找到节点")
    print()
    
    # 4. 检查知识层数据
    print("🧠 知识层数据检查")
    print("-" * 60)
    knowledge_base = base_dir / "data" / "history" / "ancient-china"
    
    graph_path = knowledge_base / "_graph.json"
    if check_file_exists(graph_path, "知识图谱"):
        with open(graph_path, 'r', encoding='utf-8') as f:
            graph = json.load(f)
        
        node_exists = any(
            n.get('id') == 'imperial-unification' 
            for n in graph.get('nodes', [])
        )
        print_status(node_exists, "图谱中存在节点")
    
    errors_path = knowledge_base / "_errors.json"
    if check_file_exists(errors_path, "易错点库"):
        with open(errors_path, 'r', encoding='utf-8') as f:
            errors = json.load(f)
        
        # 处理可能是数组或对象的情况
        errors_list = errors if isinstance(errors, list) else errors.get('errors', [])
        error_count = sum(
            1 for e in errors_list
            if e.get('node_id') == 'imperial-unification'
        )
        print_status(error_count > 0, f"易错点数量: {error_count}")
    
    exercises_path = knowledge_base / "_exercises.json"
    if check_file_exists(exercises_path, "练习题库"):
        with open(exercises_path, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        
        # 处理可能是数组或对象的情况
        exercises_list = exercises if isinstance(exercises, list) else exercises.get('exercises', [])
        exercise_count = sum(
            1 for e in exercises_list
            if e.get('node_id') == 'imperial-unification'
        )
        print_status(exercise_count > 0, f"练习题数量: {exercise_count}")
    print()
    
    # 5. 检查错误位置（应该不存在）
    print("🚫 冲突检查")
    print("-" * 60)
    wrong_path = base_dir.parent / "imperial-unification"
    exists = wrong_path.exists()
    print_status(
        not exists,
        f"根目录错误副本{'存在' if exists else '不存在'}: {wrong_path}"
    )
    print()
    
    # 最终结果
    print("=" * 60)
    if all_passed:
        print("🎉 所有检查通过！课件已正确配置。")
        print()
        print("下一步：")
        print("1. 在浏览器中打开 http://localhost:8321/teachany-opensource/index.html")
        print("2. 点击 🏛️ 历史 筛选按钮")
        print("3. 找到 '秦汉统一多民族国家' 课件卡片")
        print("4. 如果看不到，按 Cmd+Shift+R 清除缓存")
    else:
        print("❌ 部分检查未通过，请查看上方错误信息。")
    print("=" * 60)

if __name__ == '__main__':
    main()
