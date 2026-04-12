#!/usr/bin/env python3
"""
显示 TeachAny 地理历史数据统计信息
"""

import json
from pathlib import Path
from datetime import datetime

def format_size(bytes_size):
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.2f} TB"

def analyze_geojson(file_path):
    """分析 GeoJSON 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        features = data.get('features', [])
        metadata = data.get('metadata', {})
        
        # 统计几何类型
        geom_types = {}
        for feature in features:
            geom = feature.get('geometry', {})
            geom_type = geom.get('type', 'Unknown')
            geom_types[geom_type] = geom_types.get(geom_type, 0) + 1
        
        return {
            'features': len(features),
            'geometry_types': geom_types,
            'metadata': metadata,
            'size': file_path.stat().st_size
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    base_dir = Path(__file__).parent
    
    print("\n" + "=" * 80)
    print(" " * 20 + "TeachAny 地理历史数据统计")
    print("=" * 80 + "\n")
    
    total_size = 0
    file_count = 0
    
    # 遍历所有 JSON 文件
    categories = [
        ('geography/rivers', '河流数据'),
        ('geography/lakes', '湖泊数据'),
        ('geography/coastline', '海岸线数据'),
        ('geography/admin-boundaries', '行政边界数据'),
    ]
    
    for subdir, title in categories:
        dir_path = base_dir / subdir
        if not dir_path.exists():
            continue
        
        print(f"\n📂 {title}")
        print("-" * 80)
        
        json_files = sorted(dir_path.glob('*.json'))
        if not json_files:
            print("   (暂无数据)")
            continue
        
        for file_path in json_files:
            info = analyze_geojson(file_path)
            file_count += 1
            total_size += info.get('size', 0)
            
            print(f"\n📄 {file_path.name}")
            print(f"   大小: {format_size(info.get('size', 0))}")
            
            if 'error' in info:
                print(f"   ❌ 错误: {info['error']}")
                continue
            
            print(f"   要素数: {info['features']}")
            
            # 显示几何类型分布
            geom_types = info['geometry_types']
            if geom_types:
                print(f"   几何类型: ", end="")
                print(", ".join([f"{k}({v})" for k, v in geom_types.items()]))
            
            # 显示 metadata
            metadata = info.get('metadata', {})
            if metadata:
                if 'dataSource' in metadata:
                    print(f"   数据来源: {metadata['dataSource']}")
                if 'chinaFeatures' in metadata:
                    original = metadata.get('originalFeatures', 0)
                    china = metadata['chinaFeatures']
                    ratio = (china / original * 100) if original > 0 else 0
                    print(f"   中国要素: {china}/{original} ({ratio:.1f}%)")
    
    print("\n" + "=" * 80)
    print(f"📊 统计汇总")
    print("=" * 80)
    print(f"   文件总数: {file_count}")
    print(f"   数据总大小: {format_size(total_size)}")
    print(f"   生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
