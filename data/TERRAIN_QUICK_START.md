# DEM 地形数据快速启动指南

**时间**: 15-30 分钟 | **难度**: ⭐⭐ 简单 | **优先级**: 🔥🔥🔥🔥🔥 极高

---

## ⚡ 快速开始（3 步完成）

### 第 1 步：安装 Python 依赖
```bash
pip install requests mercantile tqdm
```

### 第 2 步：运行下载脚本
```bash
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data
python3 download_terrain_tiles.py
```

**预计时间**: 15-30 分钟  
**下载量**: 约 1.28 GB（中国区域，缩放级别 4-8）

### 第 3 步：启动本地服务
```bash
# 在新终端窗口运行
cd /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data
python3 -m http.server 8000
```

**访问地址**: http://localhost:8000/terrain-tiles/

---

## ✅ 验证是否成功

### 测试瓦片是否可访问
在浏览器中打开：
```
http://localhost:8000/terrain-tiles/4/12/6.png
```

如果显示一张 256×256 的 PNG 图片（看起来像灰度地形图），说明成功！

---

## 🎨 更新课件地图配置

### 修改前（在线）
```javascript
map.addSource('terrain', {
  type: 'raster-dem',
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256
});
```

### 修改后（离线）✅
```javascript
map.addSource('terrain', {
  type: 'raster-dem',
  tiles: ['http://localhost:8000/terrain-tiles/{z}/{x}/{y}.png'],  // ← 改这里
  encoding: 'terrarium',
  tileSize: 256,
  minzoom: 4,  // ← 添加最小缩放限制
  maxzoom: 8   // ← 添加最大缩放限制
});
```

---

## 📊 下载进度示例

```
================================================================================
AWS Terrain Tiles 下载工具（Terrarium 格式）
================================================================================

📥 下载缩放级别 4...
   瓦片数量: 30
   Z4: 100%|████████████████████████████████| 30/30 [00:15<00:00,  1.98it/s]
   ✅ 成功: 30 | ⏭️ 跳过: 0 | ❌ 失败: 0

📥 下载缩放级别 5...
   瓦片数量: 100
   Z5: 100%|███████████████████████████████| 100/100 [00:45<00:00,  2.22it/s]
   ✅ 成功: 100 | ⏭️ 跳过: 0 | ❌ 失败: 0

📥 下载缩放级别 6...
   瓦片数量: 400
   Z6: 100%|███████████████████████████████| 400/400 [03:20<00:00,  2.00it/s]
   ✅ 成功: 400 | ⏭️ 跳过: 0 | ❌ 失败: 0

📥 下载缩放级别 7...
   瓦片数量: 1600
   Z7: 100%|█████████████████████████████| 1600/1600 [12:30<00:00,  2.13it/s]
   ✅ 成功: 1600 | ⏭️ 跳过: 0 | ❌ 失败: 0

📥 下载缩放级别 8...
   瓦片数量: 6400
   Z8: 100%|█████████████████████████████| 6400/6400 [45:00<00:00,  2.37it/s]
   ✅ 成功: 6400 | ⏭️ 跳过: 0 | ❌ 失败: 0

================================================================================
📊 下载完成
================================================================================
   总瓦片数: 8530
   数据大小: 1280.45 MB
   输出目录: /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/terrain-tiles
   配置文件已生成: /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data/TERRAIN_TILES_CONFIG.md
```

---

## 🎯 分阶段下载建议

### 阶段 1：基础版（推荐先下载）⭐
```python
# 编辑 download_terrain_tiles.py，修改这一行：
ZOOM_LEVELS = [4, 5, 6, 7]  # 只下载到 Z7
```

**优点**:
- 下载时间：10-15 分钟
- 数据量：约 320 MB
- 满足 90% 教学场景

### 阶段 2：完整版（有时间再下载）
```python
ZOOM_LEVELS = [4, 5, 6, 7, 8]  # 完整下载到 Z8
```

**优点**:
- 支持放大查看局部地形
- 适用于战役态势详细分析

---

## ⚠️ 常见问题

### Q1: 下载中断了怎么办？
**A**: 重新运行脚本即可，已下载的瓦片会自动跳过（显示 "⏭️ 跳过"）。

### Q2: 网络慢怎么办？
**A**: 可以减少并发线程数：
```python
# 编辑 download_terrain_tiles.py
MAX_WORKERS = 5  # 从 10 改为 5（更稳定但更慢）
```

### Q3: 磁盘空间不够怎么办？
**A**: 
- 方案 1：只下载 Z4-Z7（320 MB）
- 方案 2：清理其他不必要的文件
- 方案 3：使用外置硬盘

### Q4: 下载失败率高怎么办？
**A**: 
1. 检查网络连接
2. 尝试使用 VPN（如果 AWS S3 访问受限）
3. 增加超时时间：
```python
response = requests.get(url, timeout=30)  # 从 10 改为 30 秒
```

### Q5: 如何验证数据完整性？
**A**: 检查目录结构：
```bash
cd terrain-tiles
ls -R | grep ".png" | wc -l  # 应该接近 8530
```

---

## 🚀 后续优化

### 1. 配置为系统服务（可选）
创建 systemd 服务自动启动：
```bash
sudo nano /etc/systemd/system/terrain-tiles.service
```

```ini
[Unit]
Description=Terrain Tiles HTTP Server
After=network.target

[Service]
Type=simple
User=wepon
WorkingDirectory=/Users/wepon/CodeBuddy/一次函数/teachany-opensource/data
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable terrain-tiles
sudo systemctl start terrain-tiles
```

### 2. 使用 Nginx 代替 Python HTTP Server（可选）
Nginx 性能更好，适合生产环境：
```nginx
server {
    listen 8000;
    server_name localhost;
    
    location /terrain-tiles/ {
        root /Users/wepon/CodeBuddy/一次函数/teachany-opensource/data;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

---

## 📝 完成后检查清单

- [ ] Python 依赖已安装（requests, mercantile, tqdm）
- [ ] 下载脚本成功运行
- [ ] terrain-tiles 目录存在且包含 4/5/6/7/8 子目录
- [ ] 本地 HTTP 服务已启动（http://localhost:8000）
- [ ] 测试瓦片可以访问（http://localhost:8000/terrain-tiles/4/12/6.png）
- [ ] 课件地图配置已更新为本地 URL

---

## 🎉 成功标志

当您看到以下效果时，说明 DEM 数据已成功离线化：

1. ✅ 断开网络连接
2. ✅ 打开历史地理课件
3. ✅ 地图仍然显示 3D 地形和阴影效果
4. ✅ 可以缩放、旋转、倾斜地图

**恭喜！您已完成 TeachAny 数据库的最后一块拼图！** 🎊

---

**下一步**: 开始制作历史地理课件 → 参考 `QUICK_REFERENCE.md`

---

**最后更新**: 2026-04-12  
**维护者**: TeachAny Team
