# 📦 TeachAny 按需下载预设

4 档下载配置，按你的需求选一个，把仓库体积降到合适大小。

## 一键命令

```bash
# 1. 先 clone（加 --filter 跳过大文件 blob）
git clone --filter=blob:none --sparse https://github.com/weponusa/teachany.git
cd teachany

# 2. 选一个档位
git sparse-checkout set --from-file .sparse-checkout-presets/minimal.txt      # 最小 ~20MB
git sparse-checkout set --from-file .sparse-checkout-presets/standard.txt     # 标准 ~40MB ⭐ 推荐
git sparse-checkout set --from-file .sparse-checkout-presets/full-maps.txt    # 含全部地图 ~140MB
git sparse-checkout disable                                                    # 完整仓库 ~690MB
```

## 档位对照

| 档位 | 体积 | 含什么 | 做什么课合适 |
|---|---|---|---|
| **minimal** | ~20MB | 制作器+知识树+skill 文档 | 语文/数学/物理/化学等非地图课 |
| **standard** ⭐ | ~40MB | + 世界史地图 + 现代政区 | 绝大多数课件（含地理历史） |
| **full-maps** | ~140MB | + 中国通史地图 + 自然地理 | 中国史/地形/自然地理高阶课 |
| **full** | ~690MB | 含 305 个成品课件 + 示例 | 审阅 / 研究 / 学课件制作 |

## 成品课件怎么看

所有成品课件都发布在 GitHub Pages 网站：

🌐 **https://weponusa.github.io/teachany/**

点击 Gallery 里的任一卡片直接在浏览器看，无需本地下载 `community/` 目录。

## 按需下载单个地图

即使 sparse-checkout 排除了 `assets/maps/chrono-cn/`，你也可以**按需下载单个文件**：

```bash
# 只下载某个朝代的地图
git sparse-checkout add assets/maps/chrono-cn/010-tang-dynasty.geojson
git checkout

# 或直接从 CDN/raw 下载（无需改 sparse-checkout）
curl -O https://raw.githubusercontent.com/weponusa/teachany/main/assets/maps/chrono-cn/010-tang-dynasty.geojson
```

## 换档位

随时可以换：

```bash
# 从 standard 升级到 full-maps
git sparse-checkout set --from-file .sparse-checkout-presets/full-maps.txt
git checkout   # 同步文件

# 从 full 降到 minimal
git sparse-checkout set --from-file .sparse-checkout-presets/minimal.txt
git checkout
```
