#!/usr/bin/env python3
"""
下载 AWS Terrain Tiles（Terrarium 格式）到本地
专注于中国区域，缩放级别 4-8（覆盖历史地理教学需求）
"""

import os
import requests
from pathlib import Path
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import mercantile

# 配置
CHINA_BBOX = {
    "min_lon": 73.0,   # 西部边界（新疆）
    "max_lon": 135.0,  # 东部边界（黑龙江）
    "min_lat": 18.0,   # 南部边界（南海诸岛）
    "max_lat": 54.0    # 北部边界（黑龙江）
}

ZOOM_LEVELS = [4, 5, 6]  # 缩放级别（推荐：Z4-Z6，约32MB，满足90%教学需求）
# 可选配置：
# - 极简版：[4, 5] → 20MB，基础教学
# - 标准版：[4, 5, 6] → 32MB，90%教学需求（推荐）⭐
# - 增强版：[4, 5, 6, 7] → 80MB，高级分析
# - 完整版：[4, 5, 6, 7, 8] → 1.28GB，不推荐❌
OUTPUT_DIR = Path(__file__).parent / 'terrain-tiles'
TILE_URL_TEMPLATE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
MAX_WORKERS = 10  # 并发下载线程数

def get_tiles_for_bbox(bbox, zoom):
    """获取边界框内所有瓦片的坐标"""
    tiles = mercantile.tiles(
        bbox['min_lon'], 
        bbox['min_lat'], 
        bbox['max_lon'], 
        bbox['max_lat'], 
        zooms=zoom
    )
    return list(tiles)

def download_tile(tile, output_dir):
    """下载单个瓦片"""
    z, x, y = tile.z, tile.x, tile.y
    
    # 构建输出路径
    tile_dir = output_dir / str(z) / str(x)
    tile_dir.mkdir(parents=True, exist_ok=True)
    tile_path = tile_dir / f'{y}.png'
    
    # 如果已存在则跳过
    if tile_path.exists():
        return {'status': 'skip', 'tile': tile}
    
    # 下载瓦片
    url = TILE_URL_TEMPLATE.format(z=z, x=x, y=y)
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(tile_path, 'wb') as f:
                f.write(response.content)
            return {'status': 'success', 'tile': tile, 'size': len(response.content)}
        else:
            return {'status': 'error', 'tile': tile, 'error': f'HTTP {response.status_code}'}
    except Exception as e:
        return {'status': 'error', 'tile': tile, 'error': str(e)}

def main():
    print("=" * 80)
    print("AWS Terrain Tiles 下载工具（Terrarium 格式）")
    print("=" * 80)
    print()
    
    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 统计信息
    total_tiles = 0
    total_size = 0
    
    for zoom in ZOOM_LEVELS:
        print(f"\n📥 下载缩放级别 {zoom}...")
        
        # 获取所有瓦片坐标
        tiles = get_tiles_for_bbox(CHINA_BBOX, zoom)
        print(f"   瓦片数量: {len(tiles)}")
        
        # 并发下载
        success_count = 0
        skip_count = 0
        error_count = 0
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(download_tile, tile, OUTPUT_DIR) for tile in tiles]
            
            with tqdm(total=len(tiles), desc=f"   Z{zoom}") as pbar:
                for future in as_completed(futures):
                    result = future.result()
                    
                    if result['status'] == 'success':
                        success_count += 1
                        total_size += result['size']
                    elif result['status'] == 'skip':
                        skip_count += 1
                    else:
                        error_count += 1
                    
                    pbar.update(1)
        
        total_tiles += len(tiles)
        print(f"   ✅ 成功: {success_count} | ⏭️ 跳过: {skip_count} | ❌ 失败: {error_count}")
    
    print()
    print("=" * 80)
    print("📊 下载完成")
    print("=" * 80)
    print(f"   总瓦片数: {total_tiles}")
    print(f"   数据大小: {total_size / 1024 / 1024:.2f} MB")
    print(f"   输出目录: {OUTPUT_DIR}")
    print()
    
    # 生成 MapLibre 样式配置
    generate_local_style_config(OUTPUT_DIR)

def generate_local_style_config(output_dir):
    """生成本地瓦片服务器配置"""
    config = f"""
# 本地 Terrain Tiles 配置

## 1. 启动简单 HTTP 服务器（Python）

```bash
cd {output_dir.parent}
python3 -m http.server 8000
```

## 2. MapLibre GL 配置

```javascript
map.addSource('terrain', {{
  type: 'raster-dem',
  tiles: ['http://localhost:8000/terrain-tiles/{{z}}/{{x}}/{{y}}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  minzoom: 4,
  maxzoom: 8
}});

map.setTerrain({{ source: 'terrain', exaggeration: 2.5 }});

map.addLayer({{
  id: 'hillshade',
  type: 'hillshade',
  source: 'terrain',
  paint: {{
    'hillshade-exaggeration': 0.5,
    'hillshade-shadow-color': '#473B24'
  }}
}});
```

## 3. 数据覆盖范围

- **地理范围**: 中国全境（73°E-135°E, 18°N-54°N）
- **缩放级别**: 4-8（适合历史地理课件）
- **数据格式**: Terrarium（RGB 编码高程）
- **高程精度**: 30m 分辨率，0.1m 高程精度

## 4. 高程解码公式

```javascript
// Terrarium 格式：RGB 三个通道编码高程
height = (red * 256 + green + blue / 256) - 32768  // 单位：米
```
"""
    
    config_path = output_dir.parent / 'TERRAIN_TILES_CONFIG.md'
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(config)
    
    print(f"   配置文件已生成: {config_path}")

if __name__ == '__main__':
    main()
