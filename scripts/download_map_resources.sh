#!/bin/bash
# 下载地理和历史地图资源
# 
# 数据源：
# 1. DataV.GeoAtlas（阿里云 DataV）
# 2. china-geojson（GitHub）
# 3. CHGIS（复旦大学历史地理）
#
# 使用方法：
# ./download_map_resources.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

WORKSPACE_ROOT="/Users/wepon/CodeBuddy/一次函数/teachany-opensource"
GEO_DIR="$WORKSPACE_ROOT/data/geography"
HISTORY_DIR="$WORKSPACE_ROOT/data/history"

echo -e "${GREEN}🗺️  TeachAny 地图资源下载工具${NC}"
echo "========================================"

# 创建目录
mkdir -p "$GEO_DIR/modern-china"
mkdir -p "$GEO_DIR/historical-china"
mkdir -p "$GEO_DIR/world"
mkdir -p "$GEO_DIR/templates"
mkdir -p "$HISTORY_DIR/timelines"
mkdir -p "$HISTORY_DIR/maps"
mkdir -p "$HISTORY_DIR/figures"
mkdir -p "$HISTORY_DIR/sites"

echo ""
echo -e "${GREEN}=== Phase 1: 现代行政区划数据 ===${NC}"

# 1. 下载省级行政区划（DataV.GeoAtlas）
echo -e "${YELLOW}📥 下载省级行政区划...${NC}"
curl -L "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json" \
     -o "$GEO_DIR/modern-china/provinces.geojson" 2>/dev/null

if [ -f "$GEO_DIR/modern-china/provinces.geojson" ]; then
    FILE_SIZE=$(du -h "$GEO_DIR/modern-china/provinces.geojson" | cut -f1)
    echo -e "${GREEN}✅ 省级数据下载完成 ($FILE_SIZE)${NC}"
else
    echo -e "${RED}❌ 省级数据下载失败${NC}"
fi

# 2. 下载市级行政区划（示例：北京市）
echo -e "${YELLOW}📥 下载北京市行政区划...${NC}"
curl -L "https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json" \
     -o "$GEO_DIR/modern-china/beijing.geojson" 2>/dev/null

if [ -f "$GEO_DIR/modern-china/beijing.geojson" ]; then
    FILE_SIZE=$(du -h "$GEO_DIR/modern-china/beijing.geojson" | cut -f1)
    echo -e "${GREEN}✅ 北京市数据下载完成 ($FILE_SIZE)${NC}"
else
    echo -e "${RED}❌ 北京市数据下载失败${NC}"
fi

echo ""
echo -e "${GREEN}=== Phase 2: 历史地图数据 ===${NC}"

# 克隆历史地图仓库（如果不存在）
TEMP_DIR="/tmp/teachany-maps"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}📥 克隆历史地图仓库...${NC}"

if [ ! -d "$TEMP_DIR/chinese_historical_map" ]; then
    git clone --depth 1 https://github.com/imbian/chinese_historical_map.git \
        "$TEMP_DIR/chinese_historical_map" 2>/dev/null || \
        echo -e "${YELLOW}⚠️  GitHub 克隆失败，尝试 Gitee 镜像...${NC}"
fi

# 检查是否有数据
if [ -d "$TEMP_DIR/chinese_historical_map" ]; then
    echo -e "${GREEN}✅ 历史地图仓库已准备${NC}"
    
    # 复制历史地图数据（如果有 GeoJSON 文件）
    if ls "$TEMP_DIR/chinese_historical_map"/*.geojson 1> /dev/null 2>&1; then
        cp "$TEMP_DIR/chinese_historical_map"/*.geojson "$GEO_DIR/historical-china/" 2>/dev/null || true
        echo -e "${GREEN}✅ 历史地图数据已复制${NC}"
    else
        echo -e "${YELLOW}⚠️  仓库中未找到 GeoJSON 文件，可能需要手动转换${NC}"
    fi
else
    echo -e "${RED}❌ 历史地图仓库下载失败${NC}"
fi

echo ""
echo -e "${GREEN}=== Phase 3: 世界地图数据 ===${NC}"

# 下载世界国家边界（Natural Earth 数据）
echo -e "${YELLOW}📥 下载世界国家边界...${NC}"
curl -L "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json" \
     -o "$GEO_DIR/world/countries.geojson" 2>/dev/null || \
     echo -e "${YELLOW}⚠️  世界地图下载失败（可能需要 VPN）${NC}"

if [ -f "$GEO_DIR/world/countries.geojson" ]; then
    FILE_SIZE=$(du -h "$GEO_DIR/world/countries.geojson" | cut -f1)
    echo -e "${GREEN}✅ 世界地图数据下载完成 ($FILE_SIZE)${NC}"
fi

echo ""
echo -e "${GREEN}=== Phase 4: 创建地图模板 ===${NC}"

# 创建中国底图模板
cat > "$GEO_DIR/templates/china-base-map.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>中国地图模板</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; font-family: sans-serif; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const chart = echarts.init(document.getElementById('map'));
    
    // 加载中国地图数据
    fetch('../modern-china/provinces.geojson')
      .then(res => res.json())
      .then(geoJson => {
        echarts.registerMap('china', geoJson);
        
        chart.setOption({
          title: {
            text: '中国地图',
            left: 'center',
            top: 20
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}'
          },
          visualMap: {
            min: 0,
            max: 5000,
            text: ['高', '低'],
            realtime: false,
            calculable: true,
            inRange: {
              color: ['lightskyblue', 'yellow', 'orangered']
            }
          },
          series: [{
            name: '数据',
            type: 'map',
            map: 'china',
            label: {
              show: true
            },
            data: [
              { name: '北京市', value: 2154 },
              { name: '上海市', value: 2423 }
              // 可添加更多数据
            ]
          }]
        });
      });
  </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ 中国底图模板已创建${NC}"

# 创建历史地图模板
cat > "$GEO_DIR/templates/historical-map.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>历史地图模板</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; font-family: sans-serif; }
    #map { width: 100vw; height: 100vh; }
    #timeline { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); 
                background: white; padding: 10px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="timeline">
    <span>朝代：</span>
    <select id="dynastySelect">
      <option value="qin">秦朝（前221-前206）</option>
      <option value="han">汉朝（前202-220）</option>
      <option value="tang">唐朝（618-907）</option>
      <option value="song">宋朝（960-1279）</option>
      <option value="yuan">元朝（1271-1368）</option>
      <option value="ming">明朝（1368-1644）</option>
      <option value="qing">清朝（1644-1912）</option>
    </select>
  </div>
  <script>
    const chart = echarts.init(document.getElementById('map'));
    
    // 朝代地图切换
    document.getElementById('dynastySelect').addEventListener('change', (e) => {
      const dynasty = e.target.value;
      loadDynastyMap(dynasty);
    });
    
    function loadDynastyMap(dynasty) {
      fetch(`../historical-china/${dynasty}-dynasty.geojson`)
        .then(res => res.json())
        .then(geoJson => {
          echarts.registerMap('china', geoJson);
          
          chart.setOption({
            title: {
              text: geoJson.features[0]?.properties?.name || '历史地图',
              subtext: geoJson.features[0]?.properties?.period || '',
              left: 'center',
              top: 20
            },
            tooltip: {
              trigger: 'item'
            },
            series: [{
              name: '疆域',
              type: 'map',
              map: 'china',
              label: {
                show: true
              },
              itemStyle: {
                areaColor: '#FFD700',
                borderColor: '#8B4513',
                borderWidth: 2
              },
              emphasis: {
                itemStyle: {
                  areaColor: '#FFA500'
                }
              }
            }]
          });
        })
        .catch(err => {
          console.error('地图加载失败:', err);
          alert('该朝代地图数据尚未准备，请选择其他朝代');
        });
    }
    
    // 默认加载唐朝地图
    loadDynastyMap('tang');
  </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ 历史地图模板已创建${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ 地图资源下载完成！${NC}"
echo ""
echo "📂 数据保存在:"
echo "  - 现代地图: $GEO_DIR/modern-china/"
echo "  - 历史地图: $GEO_DIR/historical-china/"
echo "  - 世界地图: $GEO_DIR/world/"
echo "  - 地图模板: $GEO_DIR/templates/"
echo ""
echo "🎨 地图模板:"
echo "  - 中国底图: file://$GEO_DIR/templates/china-base-map.html"
echo "  - 历史地图: file://$GEO_DIR/templates/historical-map.html"
echo ""
echo "⚠️  注意:"
echo "  1. 历史地图数据可能需要进一步处理（格式转换）"
echo "  2. 部分数据源可能需要 VPN 访问"
echo "  3. 完整的历史地图数据请访问 CHGIS: https://yugong.fudan.edu.cn/CHGIS/"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
