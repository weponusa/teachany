#!/usr/bin/env python3
"""
构建宋辽夏金对峙地图。

问题：CHGIS V6 只含宋朝本身的府级 polygon（因为其编制以中原王朝为主），
      辽、西夏、金的政区 polygon 在 CHGIS 中几乎空白。
策略：
  1. CHGIS 的宋府级数据 → "北宋" / "南宋" 的内部政区（精细）
  2. 手工勾绘辽、西夏、金、蒙古的疆域轮廓（参考谭其骧《中国历史地图集》第 6 册）
     作为单一大 polygon feature，与 CHGIS 府级合并
  3. 输出 north-song-dynasty.geojson（1100 年左右格局）
     和 south-song-dynasty.geojson（1200 年左右格局）
"""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "data" / "_legacy" / "resources" / "geography" / "historical-china"

# ─── 辽、西夏、金、蒙古疆域轮廓 ──────────────────────────────
# 参考谭其骧《中国历史地图集》第六册、《剑桥中国史》宋辽金元卷
# 坐标大致点（经度, 纬度）

# 辽朝疆域（1100 年前后）：东至日本海、北至贝加尔湖、西至阿尔泰山、南至河北雁门关
LIAO_1100 = [
    [95.0, 47.0],   # 西北阿尔泰
    [105.0, 47.5],  # 北部戈壁
    [115.0, 50.0],  # 贝加尔湖南
    [125.0, 52.0],
    [135.0, 50.0],  # 外兴安岭东段
    [135.5, 46.0],  # 日本海沿岸
    [132.0, 43.0],  # 东滨图们江
    [126.0, 40.5],  # 东南鸭绿江入海口附近
    [122.5, 40.0],  # 辽东湾
    [119.5, 39.8],  # 榆关（山海关）
    [116.5, 39.8],  # 幽州（北京）南
    [114.0, 39.2],  # 代州（朔州、大同一带）
    [112.0, 39.0],  # 雁门（太原以北）
    [108.0, 39.5],  # 河套东缘
    [103.5, 40.5],  # 阴山北
    [98.0, 42.5],   # 额济纳
    [95.0, 47.0],
]

# 西夏疆域（1100 年前后）：含银川平原、河西走廊、河套西部、陇右北部
XIXIA_1100 = [
    [100.8, 41.5],  # 黑水城
    [106.0, 41.8],  # 河套
    [108.5, 40.0],  # 东南缘（与北宋交界）
    [109.0, 37.5],  # 延州以北
    [106.0, 36.8],  # 萧关
    [104.0, 35.5],  # 兰州以南
    [101.5, 36.5],  # 西宁（青唐）
    [99.5, 38.5],   # 凉州
    [96.5, 39.5],   # 甘州
    [94.0, 40.3],   # 肃州
    [92.0, 41.2],   # 瓜州、沙州
    [94.0, 41.8],
    [100.8, 41.5],
]

# 金朝疆域（1200 年前后）：辽朝东半部 + 黄河以北宋地
JIN_1200 = [
    # 北边
    [95.0, 47.0],
    [110.0, 50.0],
    [125.0, 53.0],
    [135.0, 52.0],
    [135.5, 46.0],  # 东北尽头
    [132.0, 43.0],
    [126.0, 40.5],  # 鸭绿江口
    # 南界（1142 年绍兴和议线：大散关—淮河）
    [122.5, 34.5],  # 淮河入海口
    [118.5, 33.0],
    [115.0, 33.0],
    [112.0, 33.2],  # 唐、邓二州北
    [108.5, 34.0],  # 商州
    [106.8, 34.2],  # 秦岭—大散关
    # 西界（与西夏交界，河西走廊不属金）
    [105.0, 36.0],
    [103.5, 37.8],
    [104.5, 40.0],
    [107.0, 41.5],
    [105.0, 42.5],
    [101.5, 43.5],
    [97.0, 45.0],
    [95.0, 47.0],
]

# 西夏疆域（1200 年前后，基本同 1100）
XIXIA_1200 = XIXIA_1100

# 大理国（1100/1200 年，云南）
DALI = [
    [97.5, 28.5],
    [101.5, 28.5],
    [104.3, 27.8],
    [105.0, 25.0],
    [104.5, 22.5],
    [102.0, 21.5],
    [100.0, 21.2],
    [98.0, 22.0],
    [97.3, 24.5],
    [97.5, 28.5],
]

# 吐蕃诸部（1100/1200 年，青藏高原，松散部落）
TIBET = [
    [78.0, 35.5],
    [87.0, 36.5],
    [94.0, 36.5],
    [100.0, 35.0],
    [102.0, 33.0],
    [100.5, 30.0],
    [99.0, 28.5],
    [97.0, 28.0],
    [94.0, 27.8],
    [88.0, 27.5],
    [82.0, 29.0],
    [78.0, 32.0],
    [78.0, 35.5],
]

# 蒙古帝国（1210 年前后，南宋后期，以蒙古高原+华北）
MONGOL_1210 = [
    [80.0, 48.0],
    [100.0, 52.5],
    [120.0, 54.0],
    [135.0, 52.0],
    [132.0, 45.0],
    [128.0, 42.5],
    [125.0, 40.0],
    [120.0, 38.5],
    [116.0, 36.0],   # 华北
    [112.0, 36.0],
    [108.0, 37.0],
    [104.0, 39.0],   # 灭西夏部分
    [100.0, 42.0],
    [95.0, 45.0],
    [85.0, 46.0],
    [80.0, 48.0],
]


def make_country_feature(name, name_en, coords, color):
    """造一个 country-level polygon feature"""
    # 确保闭合
    if coords[0] != coords[-1]:
        coords = coords + [coords[0]]
    return {
        "type": "Feature",
        "properties": {
            "NAME_CH": name,
            "NAME_PY": name_en,
            "POWER": name,
            "LEVEL": "country",
            "color": color,
            "note": "疆域轮廓示意，参考谭其骧《中国历史地图集》第六册",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords],
        },
    }


def load_chgis_song():
    """从之前 CHGIS 生成的 north/south-song 读取宋的府，这里去除 POWER 错误标签"""
    north_path = BASE / "north-song-dynasty.geojson"
    south_path = BASE / "south-song-dynasty.geojson"
    north = json.loads(north_path.read_text(encoding="utf-8"))
    south = json.loads(south_path.read_text(encoding="utf-8"))
    return north, south


def filter_for_song_proper(features, is_north=True):
    """
    CHGIS 数据里虽然标的是北/南宋，但含了辽/金地盘内的府（经纬度偏北/偏西的部分）。
    按 centroid 过滤：
      - 北宋 (1100)：保留 lat < 40 且（非西夏区）
      - 南宋 (1200)：保留 lat < 33（淮河以南）
    """
    def centroid(feat):
        pts = []
        def collect(c):
            if isinstance(c, (int, float)):
                return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c:
                        collect(x)
        collect(feat.get("geometry", {}).get("coordinates", []))
        if not pts:
            return None, None
        return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)

    def in_xixia(lng, lat):
        # 西夏矩形粗判
        return 98.0 <= lng <= 109.0 and 35.5 <= lat <= 42.0

    def in_dali(lng, lat):
        return 97.5 <= lng <= 105.5 and 21.5 <= lat <= 28.5

    result = []
    for f in features:
        lng, lat = centroid(f)
        if lng is None:
            continue
        if in_xixia(lng, lat):
            continue
        if in_dali(lng, lat):
            continue
        if is_north:
            # 北宋：淮河以南 + 黄河流域但不含燕云
            if lat >= 40:
                continue
        else:
            # 南宋：淮河以南
            if lat >= 33.0:
                continue
        # 强制将 POWER 设为"北宋"或"南宋"
        p = dict(f["properties"])
        p["POWER"] = "北宋" if is_north else "南宋"
        p["LEVEL"] = "prefecture"
        result.append({"type": "Feature", "properties": p, "geometry": f["geometry"]})
    return result


def build_north_song():
    north_raw, _ = load_chgis_song()
    song_prefs = filter_for_song_proper(north_raw["features"], is_north=True)

    features = [
        make_country_feature("辽", "Liao", LIAO_1100, "#8B4513"),
        make_country_feature("西夏", "Xixia", XIXIA_1100, "#D2691E"),
        make_country_feature("大理", "Dali", DALI, "#FF6B6B"),
        make_country_feature("吐蕃诸部", "Tibet", TIBET, "#A0A0A0"),
    ] + song_prefs

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "dynasty": "北宋时期（约 1100 年）",
            "period": "960-1127",
            "powers": ["北宋", "辽", "西夏", "大理", "吐蕃"],
            "dataSource": "宋朝府级来自 CHGIS V6（Harvard+复旦），辽/西夏/大理/吐蕃疆域轮廓参考谭其骧《中国历史地图集》第 6 册手工勾绘",
        },
        "features": features,
    }
    return out


def build_south_song():
    _, south_raw = load_chgis_song()
    song_prefs = filter_for_song_proper(south_raw["features"], is_north=False)

    features = [
        make_country_feature("金", "Jin", JIN_1200, "#4A4A4A"),
        make_country_feature("西夏", "Xixia", XIXIA_1200, "#D2691E"),
        make_country_feature("大理", "Dali", DALI, "#FF6B6B"),
        make_country_feature("吐蕃诸部", "Tibet", TIBET, "#A0A0A0"),
    ] + song_prefs

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "dynasty": "南宋时期（约 1200 年）",
            "period": "1127-1279",
            "powers": ["南宋", "金", "西夏", "大理", "吐蕃"],
            "dataSource": "宋朝府级来自 CHGIS V6（Harvard+复旦），金/西夏/大理/吐蕃疆域轮廓参考谭其骧《中国历史地图集》第 6 册手工勾绘",
        },
        "features": features,
    }
    return out


def main():
    ns = build_north_song()
    ss = build_south_song()

    (BASE / "north-song-dynasty.geojson").write_text(
        json.dumps(ns, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    (BASE / "south-song-dynasty.geojson").write_text(
        json.dumps(ss, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )

    # 合并版
    merged = {
        "type": "FeatureCollection",
        "metadata": {
            "dynasty": "宋朝（含辽/西夏/金/大理对峙）",
            "period": "960-1279",
            "dataSource": "CHGIS V6 + 谭其骧《中国历史地图集》辅助",
        },
        "features": ns["features"] + ss["features"],
    }
    (BASE / "song-dynasty.geojson").write_text(
        json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )

    from collections import Counter
    for name, d in [("north-song", ns), ("south-song", ss), ("song", merged)]:
        ct = Counter(f["properties"].get("POWER", "-") for f in d["features"])
        print(f"{name}: {len(d['features'])} feats  {dict(ct)}")


if __name__ == "__main__":
    main()
