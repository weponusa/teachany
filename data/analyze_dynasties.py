#!/usr/bin/env python3
"""
分析历朝疆域 GeoJSON 数据
"""

import json
from pathlib import Path

def format_size(bytes_size):
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.2f} TB"

def analyze_dynasty(file_path):
    """分析朝代疆域数据"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        features = data.get('features', [])
        metadata = data.get('metadata', {})
        
        # 统计几何类型
        geom_types = {}
        for feature in features:
            geom = feature.get('geometry', {})
            if geom:
                geom_type = geom.get('type', 'Unknown')
                geom_types[geom_type] = geom_types.get(geom_type, 0) + 1
        
        # 获取第一个 feature 的属性（了解数据结构）
        sample_props = None
        if features:
            sample_props = features[0].get('properties', {})
        
        return {
            'features': len(features),
            'geometry_types': geom_types,
            'metadata': metadata,
            'sample_properties': sample_props,
            'size': file_path.stat().st_size
        }
    except Exception as e:
        return {'error': str(e), 'size': file_path.stat().st_size}

def main():
    base_dir = Path(__file__).parent / 'history' / 'dynasties'
    
    print("\n" + "=" * 80)
    print(" " * 25 + "中国历朝疆域数据分析")
    print("=" * 80 + "\n")
    
    dynasty_files = sorted(base_dir.glob('*.geojson'))
    
    if not dynasty_files:
        print("❌ 未找到朝代疆域数据文件")
        return
    
    total_size = 0
    dynasty_info = []
    
    for file_path in dynasty_files:
        info = analyze_dynasty(file_path)
        total_size += info.get('size', 0)
        
        # 提取朝代名称
        dynasty_name = file_path.stem.replace('-dynasty', '').replace('-', ' ').title()
        
        dynasty_info.append({
            'name': dynasty_name,
            'file': file_path.name,
            'info': info
        })
    
    # 按朝代顺序排序（秦汉唐宋元明清）
    dynasty_order = {
        'Qin': 1,
        'West Han': 2,
        'East Han': 3,
        'Tang': 4,
        'Song': 5,
        'Yuan': 6,
        'Ming': 7,
        'Qing': 8
    }
    
    dynasty_info.sort(key=lambda x: dynasty_order.get(x['name'], 99))
    
    # 显示详细信息
    for item in dynasty_info:
        name = item['name']
        file_name = item['file']
        info = item['info']
        
        print(f"📜 {name} 朝")
        print("-" * 80)
        print(f"   文件: {file_name}")
        print(f"   大小: {format_size(info.get('size', 0))}")
        
        if 'error' in info:
            print(f"   ❌ 错误: {info['error']}\n")
            continue
        
        print(f"   要素数: {info['features']}")
        
        geom_types = info.get('geometry_types', {})
        if geom_types:
            print(f"   几何类型: " + ", ".join([f"{k}({v})" for k, v in geom_types.items()]))
        
        # 显示 metadata
        metadata = info.get('metadata', {})
        if metadata:
            if 'dynasty' in metadata:
                print(f"   朝代标识: {metadata['dynasty']}")
            if 'year' in metadata:
                print(f"   年份: {metadata['year']}")
            if 'capital' in metadata:
                capital = metadata['capital']
                if isinstance(capital, str):
                    print(f"   首都: {capital}")
                elif isinstance(capital, list) and len(capital) == 2:
                    print(f"   首都坐标: [{capital[0]:.2f}, {capital[1]:.2f}]")
                else:
                    print(f"   首都: {capital}")
        
        # 显示示例属性
        sample_props = info.get('sample_properties', {})
        if sample_props:
            print(f"   属性字段: " + ", ".join(sample_props.keys()))
        
        print()
    
    print("=" * 80)
    print(f"📊 统计汇总")
    print("=" * 80)
    print(f"   朝代总数: {len(dynasty_info)}")
    print(f"   数据总大小: {format_size(total_size)}")
    print("=" * 80 + "\n")
    
    # 生成数据清单 Markdown
    catalog_md = generate_catalog_markdown(dynasty_info)
    catalog_path = Path(__file__).parent / 'history' / 'DYNASTIES_CATALOG.md'
    with open(catalog_path, 'w', encoding='utf-8') as f:
        f.write(catalog_md)
    print(f"✅ 已生成数据清单: {catalog_path}\n")

def generate_catalog_markdown(dynasty_info):
    """生成历朝疆域数据清单 Markdown"""
    md = """# 中国历朝疆域数据清单

**数据来源**: 中国历史地理信息系统（CHGIS）/ 历史地图集  
**数据格式**: GeoJSON  
**坐标系统**: WGS84 (EPSG:4326)  
**更新日期**: 2026-04-12

---

## 📚 已收录朝代

| 朝代 | 文件名 | 大小 | 要素数 | 几何类型 | 时期 |
|:---|:---|:---:|:---:|:---|:---|
"""
    
    for item in dynasty_info:
        name = item['name']
        file_name = item['file']
        info = item['info']
        
        size = format_size(info.get('size', 0))
        features = info.get('features', 0)
        geom = ', '.join([f"{k}({v})" for k, v in info.get('geometry_types', {}).items()])
        
        # 推断时期
        year_ranges = {
            'Qin': '前221-前206',
            'West Han': '前206-公元8',
            'East Han': '25-220',
            'Tang': '618-907',
            'Song': '960-1279',
            'Yuan': '1271-1368',
            'Ming': '1368-1644',
            'Qing': '1644-1911'
        }
        year = year_ranges.get(name, '-')
        
        md += f"| {name} | `{file_name}` | {size} | {features} | {geom} | {year} |\n"
    
    md += """
---

## 📖 数据说明

### 数据结构

所有朝代疆域文件采用标准 GeoJSON 格式:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "dynasty": "qin",
    "year": -221,
    "capital": [108.9, 34.3]
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "关中郡",
        "type": "prefecture"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

### 属性字段

各朝代数据可能包含以下属性字段:
- `name`: 行政区划名称
- `type`: 类型（prefecture/county/commandery）
- `capital`: 首都坐标
- `dynasty`: 朝代标识
- `year`: 年份

---

## 🎓 K12 课程应用场景

### 初中历史（7-9 年级）
- ✅ 秦统一六国（前221年）
- ✅ 汉朝疆域演变（西汉、东汉）
- ✅ 唐朝全盛时期疆域（贞观之治）

### 高中历史（10-12 年级）
- ✅ 宋辽金夏对峙格局
- ✅ 元朝疆域（中国历史上最大版图）
- ✅ 明清疆域对比
- ✅ 清朝最大疆域（康乾盛世）

---

## 💻 使用示例

### 在 MapLibre GL 中显示秦朝疆域

```javascript
fetch('/data/history/dynasties/qin-dynasty.geojson')
  .then(res => res.json())
  .then(data => {
    map.addSource('qin-boundary', {
      type: 'geojson',
      data: data
    });
    
    map.addLayer({
      id: 'qin-territory',
      type: 'fill',
      source: 'qin-boundary',
      paint: {
        'fill-color': '#6a1b9a',
        'fill-opacity': 0.3
      }
    });
    
    map.addLayer({
      id: 'qin-border',
      type: 'line',
      source: 'qin-boundary',
      paint: {
        'line-color': '#6a1b9a',
        'line-width': 2
      }
    });
  });
```

### 朝代疆域对比（左右分屏）

```javascript
// 左侧地图: 秦朝
const map1 = new maplibregl.Map({
  container: 'map-qin',
  center: [110, 35],
  zoom: 4
});

// 右侧地图: 清朝
const map2 = new maplibregl.Map({
  container: 'map-qing',
  center: [110, 35],
  zoom: 4
});

// 同步加载两个朝代疆域
Promise.all([
  fetch('/data/history/dynasties/qin-dynasty.geojson').then(r => r.json()),
  fetch('/data/history/dynasties/qing-dynasty.geojson').then(r => r.json())
]).then(([qinData, qingData]) => {
  // 添加到对应地图
  map1.addSource('territory', { type: 'geojson', data: qinData });
  map2.addSource('territory', { type: 'geojson', data: qingData });
  
  // 相同的样式配置
  [map1, map2].forEach(map => {
    map.addLayer({
      id: 'fill',
      type: 'fill',
      source: 'territory',
      paint: { 'fill-color': '#6a1b9a', 'fill-opacity': 0.3 }
    });
  });
});
```

---

## 🔗 相关资源

- **CHGIS 官网**: https://chgis.fas.harvard.edu/
- **中国历史地图集**: 谭其骧主编
- **复旦大学历史地理研究中心**: https://yugong.fudan.edu.cn/

---

**维护**: TeachAny Team  
**最后更新**: 2026-04-12
"""
    
    return md

if __name__ == "__main__":
    main()
