#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assets/maps/ 时空地图资产重组脚本

目标：
1. 将散落在 skill/assets/ 和 data/_legacy/resources/geography/ 的地图资产
   统一整理到 assets/maps/ 下，按「时空逻辑」组织
2. 历史地图按时序编号（001, 002, ...），一眼可读
3. 生成 MANIFEST.json 作为统一索引（含朝代起止、center、zoom、下载清单）
4. 去重（skill/assets/historical-world 与 _legacy 重复 16M）

产出：
  assets/maps/
    physical/    地理（底图、海岸、河湖、3D 瓦片）
    political/   政区（世界国界、中国省界、行政边界）
    chrono-cn/   中国通史（19 朝代，按时序编号）
    chrono-world/ 世界通史（21 时期，按时序编号）
    MANIFEST.json  统一时空索引
"""

import json
import shutil
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / "assets" / "maps"

# ──────────────────────────────────────────
# 1) 中国朝代时序表（key → 起止年 + 备注 + 源文件）
# ──────────────────────────────────────────
CHRONO_CN = [
    ("qin-dynasty",          "秦朝",       -221,  -207, "中国第一个统一王朝"),
    ("west-han-dynasty",     "西汉",       -202,    8,  "汉武帝开疆拓土，丝路开通"),
    ("east-han-dynasty",     "东汉",         25,   220, "刘秀光武中兴"),
    ("han-dynasty",          "汉朝（汇总）", -202,  220, "西汉+东汉合图"),
    ("three-kingdoms",       "三国",        220,   280, "魏蜀吴鼎立"),
    ("jin-west-dynasty",     "西晋",        265,   316, "短暂统一"),
    ("jin-east-dynasty",     "东晋",        317,   420, "衣冠南渡"),
    ("northern-southern",    "南北朝",      420,   589, "南北对峙"),
    ("sui-dynasty",          "隋朝",        581,   618, "再度统一，大运河"),
    ("tang-dynasty",         "唐朝",        618,   907, "贞观开元盛世"),
    ("five-dynasties",       "五代十国",    907,   960, "大分裂期"),
    ("liao-dynasty",         "辽",          916,  1125, "契丹北方政权"),
    ("north-song-dynasty",   "北宋",        960,  1127, "开封为都"),
    ("jin-jurchen",          "金（女真）", 1115,  1234, "女真崛起，灭北宋"),
    ("song-dynasty",         "宋朝（汇总）", 960, 1279, "北宋+南宋合图"),
    ("south-song-dynasty",   "南宋",       1127,  1279, "临安（杭州）为都"),
    ("yuan-dynasty",         "元朝",       1271,  1368, "蒙古帝国一统"),
    ("ming-dynasty",         "明朝",       1368,  1644, "郑和下西洋"),
    ("qing-dynasty",         "清朝",       1636,  1912, "最后一个封建王朝"),
]

# ──────────────────────────────────────────
# 2) 世界通史时序表
# ──────────────────────────────────────────
CHRONO_WORLD = [
    ("bce-3000",                    "公元前3000年",  -3000, "古文明发轫（苏美尔、古埃及、印度河）"),
    ("bce-1500",                    "公元前1500年",  -1500, "青铜时代（商、赫梯、米诺斯）"),
    ("bce-1000",                    "公元前1000年",  -1000, "铁器时代（周、亚述）"),
    ("bce-500",                     "公元前500年",    -500, "轴心时代（希腊城邦、波斯、孔子）"),
    ("bce-323-alexander",           "亚历山大帝国",   -323, "亚历山大猝死，帝国分裂"),
    ("bce-200",                     "公元前200年",    -200, "罗马崛起，秦汉帝国"),
    ("bce-1",                       "公元前1年",        -1, "公元纪年起点，罗马-汉帝国双雄"),
    ("ce-200",                      "公元200年",       200, "东汉末年，罗马危机"),
    ("ce-500",                      "公元500年",       500, "西罗马陷落，南北朝"),
    ("ce-800-caliphate-carolingian","公元800年",       800, "阿拔斯王朝 + 查理曼加冕"),
    ("ce-1000",                     "公元1000年",     1000, "维京、宋、拜占庭"),
    ("ce-1200-mongol-rise",         "蒙古崛起",       1200, "成吉思汗统一蒙古"),
    ("ce-1300-mongol-peak",         "蒙古帝国鼎盛",   1300, "忽必烈建元，帝国最大版图"),
    ("ce-1492-age-of-discovery",    "大航海开始",     1492, "哥伦布发现新大陆"),
    ("ce-1600",                     "公元1600年",     1600, "晚明，欧洲宗教战争"),
    ("ce-1700",                     "公元1700年",     1700, "康熙、路易十四"),
    ("ce-1815-vienna",              "维也纳体系",     1815, "拿破仑败，欧洲重塑"),
    ("ce-1880",                     "公元1880年",     1880, "殖民瓜分非洲"),
    ("ce-1914-wwi",                 "一战前夜",       1914, "萨拉热窝事件"),
    ("ce-1945-wwii",                "二战结束",       1945, "战后世界格局"),
    ("ce-2000",                     "公元2000年",     2000, "当代世界"),
]


def md5sum(path: Path) -> str:
    h = hashlib.md5()
    h.update(path.read_bytes())
    return h.hexdigest()


def copy_with_dedup(src: Path, dst: Path, manifest_entries: list, category: str, **extra):
    """拷贝文件，若目标已存在且内容一致则跳过（去重）"""
    if not src.exists():
        print(f"  ⚠️  源文件不存在: {src}")
        return
    if dst.exists() and md5sum(src) == md5sum(dst):
        print(f"  ⏭️  已一致: {dst.relative_to(ROOT)}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    size = dst.stat().st_size
    rel = dst.relative_to(MAPS)
    entry = {"path": str(rel).replace("\\", "/"), "size_bytes": size, "category": category, **extra}
    manifest_entries.append(entry)
    print(f"  ✅ {rel}  ({size/1024:.1f} KB)")


def reorganize():
    manifest = {
        "schema_version": "v1.0",
        "description": "TeachAny 地图资产统一时空索引",
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "categories": {
            "physical":     "自然地理（底图、海岸、河湖、3D 瓦片）",
            "political":    "政治地理（现代国界、行政区划）",
            "chrono-cn":    "中国通史地图（按朝代时序）",
            "chrono-world": "世界通史地图（按时期时序）",
        },
        "files": [],
    }

    # ─── 1. 中国通史（chrono-cn）─────────────────
    print("\n═══ [1/4] 中国通史 chrono-cn ═══")
    src_dir = ROOT / "skill" / "assets" / "historical-china"
    for idx, (key, name, start_year, end_year, note) in enumerate(CHRONO_CN, 1):
        src = src_dir / f"{key}.geojson"
        dst = MAPS / "chrono-cn" / f"{idx:03d}-{key}.geojson"
        copy_with_dedup(
            src, dst, manifest["files"],
            category="chrono-cn",
            order=idx, key=key, name_zh=name,
            year_start=start_year, year_end=end_year, note=note,
        )

    # ─── 2. 世界通史（chrono-world）──────────────
    print("\n═══ [2/4] 世界通史 chrono-world ═══")
    src_dir = ROOT / "skill" / "assets" / "historical-world"
    for idx, (key, name, year, note) in enumerate(CHRONO_WORLD, 1):
        src = src_dir / f"{key}.geojson"
        dst = MAPS / "chrono-world" / f"{idx:03d}-{key}.geojson"
        copy_with_dedup(
            src, dst, manifest["files"],
            category="chrono-world",
            order=idx, key=key, name_zh=name, year=year, note=note,
        )

    # ─── 3. 自然地理（physical）──────────────────
    print("\n═══ [3/4] 自然地理 physical ═══")
    # 3.1 hillshade（优先用 skill/assets 版，更小）
    for jpg in (ROOT / "skill" / "assets" / "hillshade").glob("*.jpg"):
        copy_with_dedup(
            jpg, MAPS / "physical" / "hillshade" / jpg.name,
            manifest["files"], category="physical",
            subtype="hillshade", note="全球地形晕渲底图",
        )

    # 3.2 coastline, rivers, lakes（来自 _legacy）
    for subtype, srcdir in [
        ("coastline", "coastline"),
        ("rivers", "rivers"),
        ("lakes", "lakes"),
    ]:
        src_dir = ROOT / "data" / "_legacy" / "resources" / "geography" / srcdir
        if not src_dir.exists():
            continue
        for f in src_dir.rglob("*"):
            if f.is_file() and f.suffix in (".geojson", ".json", ".topojson"):
                rel = f.relative_to(src_dir)
                dst = MAPS / "physical" / subtype / rel
                copy_with_dedup(f, dst, manifest["files"], category="physical", subtype=subtype)

    # 3.3 terrain-tiles（3D 瓦片 Z4-6）
    src_dir = ROOT / "data" / "terrain-tiles"
    if src_dir.exists():
        for f in src_dir.rglob("*.png"):
            rel = f.relative_to(src_dir)
            dst = MAPS / "physical" / "terrain-tiles" / rel
            copy_with_dedup(f, dst, manifest["files"], category="physical", subtype="terrain-tiles")

    # ─── 4. 政治地理（political）─────────────────
    print("\n═══ [4/4] 政治地理 political ═══")
    # 4.1 world/countries.geojson
    src = ROOT / "data" / "_legacy" / "resources" / "geography" / "world" / "countries.geojson"
    if src.exists():
        copy_with_dedup(
            src, MAPS / "political" / "world" / "countries.geojson",
            manifest["files"], category="political",
            subtype="world-countries", note="世界现代国界",
        )

    # 4.2 modern-china（省市）
    src_dir = ROOT / "data" / "_legacy" / "resources" / "geography" / "modern-china"
    if src_dir.exists():
        for f in src_dir.rglob("*"):
            if f.is_file() and f.suffix in (".geojson", ".json"):
                rel = f.relative_to(src_dir)
                dst = MAPS / "political" / "china-modern" / rel
                copy_with_dedup(f, dst, manifest["files"], category="political", subtype="china-modern")

    # 4.3 admin-boundaries（行政边界）
    src_dir = ROOT / "data" / "_legacy" / "resources" / "geography" / "admin-boundaries"
    if src_dir.exists():
        for f in src_dir.rglob("*"):
            if f.is_file() and f.suffix in (".geojson", ".json"):
                rel = f.relative_to(src_dir)
                dst = MAPS / "political" / "admin-boundaries" / rel
                copy_with_dedup(f, dst, manifest["files"], category="political", subtype="admin-boundaries")

    # ─── 5. 统计 + 写 MANIFEST ───────────────────
    total_size = sum(f["size_bytes"] for f in manifest["files"])
    manifest["stats"] = {
        "total_files": len(manifest["files"]),
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "by_category": {
            c: {
                "files": sum(1 for f in manifest["files"] if f["category"] == c),
                "size_mb": round(sum(f["size_bytes"] for f in manifest["files"] if f["category"] == c) / (1024 * 1024), 2),
            }
            for c in manifest["categories"]
        },
    }

    (MAPS / "MANIFEST.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\n═══ 完成 ═══")
    print(f"  总文件数: {manifest['stats']['total_files']}")
    print(f"  总大小:   {manifest['stats']['total_size_mb']} MB")
    print(f"  MANIFEST: {MAPS / 'MANIFEST.json'}")
    for c, s in manifest["stats"]["by_category"].items():
        print(f"    {c:15s}  {s['files']:4d} 个 · {s['size_mb']:6.2f} MB")


if __name__ == "__main__":
    reorganize()
