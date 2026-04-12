#!/usr/bin/env python3
"""
从 Natural Earth 全球数据中提取中国区域的河流、湖泊等地理要素
"""

import json
from pathlib import Path

# 中国边界框（粗略）
CHINA_BBOX = {
    "min_lon": 73.0,   # 西部边界（新疆）
    "max_lon": 135.0,  # 东部边界（黑龙江）
    "min_lat": 18.0,   # 南部边界（南海诸岛）
    "max_lat": 54.0    # 北部边界（黑龙江）
}

def is_in_china(coords):
    """判断坐标是否在中国范围内"""
    lon, lat = coords[0], coords[1]
    return (CHINA_BBOX["min_lon"] <= lon <= CHINA_BBOX["max_lon"] and
            CHINA_BBOX["min_lat"] <= lat <= CHINA_BBOX["max_lat"])

def filter_china_features(input_file, output_file, geometry_type="LineString"):
    """从全球 GeoJSON 中过滤中国区域要素"""
    print(f"处理文件: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    china_features = []
    for feature in data.get('features', []):
        geom = feature.get('geometry')
        if not geom:  # 跳过没有 geometry 的要素
            continue
            
        geom_type = geom.get('type')
        coords = geom.get('coordinates', [])
        
        # 根据几何类型判断
        if geom_type == "LineString":
            # 河流：检查线的任意一个点是否在中国
            if coords and any(is_in_china(c) for c in coords):
                china_features.append(feature)
        
        elif geom_type == "MultiLineString":
            # 多段线：检查任意段是否在中国
            has_china_segment = False
            for line in coords:
                if line and any(is_in_china(c) for c in line):
                    has_china_segment = True
                    break
            if has_china_segment:
                china_features.append(feature)
        
        elif geom_type == "Polygon":
            # 湖泊/多边形：检查外环的任意点
            if coords and len(coords) > 0 and any(is_in_china(c) for c in coords[0]):
                china_features.append(feature)
        
        elif geom_type == "MultiPolygon":
            # 多多边形
            has_china_polygon = False
            for polygon in coords:
                if polygon and len(polygon) > 0 and any(is_in_china(c) for c in polygon[0]):
                    has_china_polygon = True
                    break
            if has_china_polygon:
                china_features.append(feature)
    
    # 创建新的 GeoJSON
    china_data = {
        "type": "FeatureCollection",
        "metadata": {
            "title": f"中国区域 {Path(input_file).stem}",
            "dataSource": "Natural Earth v5.0.0",
            "sourceUrl": "https://github.com/martynafford/natural-earth-geojson",
            "filterBbox": CHINA_BBOX,
            "processedBy": "TeachAny Data Processor",
            "processedDate": "2026-04-12",
            "originalFeatures": len(data.get('features', [])),
            "chinaFeatures": len(china_features)
        },
        "features": china_features
    }
    
    # 保存
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(china_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 提取完成: {len(china_features)}/{len(data.get('features', []))} 个要素")
    print(f"   输出文件: {output_file}")
    
    # 计算文件大小
    size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"   文件大小: {size_mb:.2f} MB\n")
    
    return len(china_features)

def main():
    base_dir = Path(__file__).parent
    
    print("=" * 60)
    print("提取中国区域地理数据")
    print("=" * 60 + "\n")
    
    # 1. 提取河流
    filter_china_features(
        base_dir / "geography/rivers/ne_10m_rivers_lake_centerlines.json",
        base_dir / "geography/rivers/ne_10m_rivers_china.json"
    )
    
    # 2. 提取湖泊
    filter_china_features(
        base_dir / "geography/lakes/ne_10m_lakes.json",
        base_dir / "geography/lakes/ne_10m_lakes_china.json"
    )
    
    # 3. 提取海岸线
    filter_china_features(
        base_dir / "geography/coastline/ne_10m_coastline.json",
        base_dir / "geography/coastline/ne_10m_coastline_china.json"
    )
    
    print("=" * 60)
    print("✅ 全部完成!")
    print("=" * 60)

if __name__ == "__main__":
    main()
