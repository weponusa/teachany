# 地图资源指南（精简版）

地图库已从 skill 包内迁出，按需从仓库 `assets/maps/` 或远端 GitHub raw 读取。

常用命令：

```bash
python3 scripts/find-map.py --list-all
python3 scripts/find-map.py 唐
python3 scripts/find-map.py --era 1500
python3 scripts/find-map.py --base hillshade
python3 scripts/find-map.py --copy <file> community/<course-id>/assets/maps/
```

优先级：本地仓库 `assets/maps` → 远端 `weponusa/teachany/main/assets/maps` → 外部公开数据 → 生成。
