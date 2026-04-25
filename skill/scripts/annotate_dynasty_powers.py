#!/usr/bin/env python3
"""
给 CHGIS 切片生成的 GeoJSON 添加 POWER 字段（政权归属），
以便前端按政权着色区分（北宋 vs 辽 vs 西夏）
"""
import json
from pathlib import Path

BASE = Path(__file__).parent.parent / "data/_legacy/resources/geography/historical-china"


def annotate_by_coords(geojson_path: Path, rules):
    """rules: list of (name, lambda(lng,lat)->bool, power_name)
    按每个 feature 的 centroid 判断归属
    """
    data = json.loads(geojson_path.read_text(encoding="utf-8"))
    for f in data.get("features", []):
        # 计算 bbox centroid 作为代表点
        geom = f.get("geometry") or {}
        coords = geom.get("coordinates", [])
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

        collect(coords)
        if not pts:
            continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        props = f["properties"]
        name = props.get("NAME_CH", "")
        assigned = "未知"
        for rule_fn, power in rules:
            if rule_fn(lng, lat, name):
                assigned = power
                break
        props["POWER"] = assigned
    geojson_path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_song_north(f):
    """
    北宋（1111）：辽在北，西夏在西北，宋在南/东
    辽: 纬度 >= 40（今北京以北 / 河北北部以北 / 辽东）
    西夏: 纬度 35-42 且经度 98-108（河西走廊、银川平原）
    宋: 其余
    """
    rules = [
        (lambda lng, lat, n: lat >= 40 and lng <= 125, "辽"),
        (lambda lng, lat, n: lat >= 36 and lng <= 108 and lng >= 98, "西夏"),
        (lambda lng, lat, n: lat >= 42 and lng >= 125, "辽东（辽）"),
        (lambda lng, lat, n: True, "北宋"),
    ]
    return annotate_by_coords(f, rules)


def split_song_south(f):
    """
    南宋（1210）：金在北，西夏在西北，宋在南（长江以南）
    金: 纬度 >= 34（长江以北）
    西夏: 同上
    南宋: 纬度 < 34
    """
    rules = [
        (lambda lng, lat, n: lat >= 36 and lng <= 108 and lng >= 98, "西夏"),
        (lambda lng, lat, n: lat >= 34 and lng >= 108, "金"),
        (lambda lng, lat, n: lat >= 38, "金"),
        (lambda lng, lat, n: True, "南宋"),
    ]
    return annotate_by_coords(f, rules)


def annotate_single_power(path: Path, power_name: str):
    """整个文件都标为同一政权（用于秦、唐、明、清等单一王朝）"""
    rules = [(lambda lng, lat, n: True, power_name)]
    return annotate_by_coords(path, rules)


def split_three_kingdoms(f):
    """
    三国 262 年：
    - 魏: 北方（淮河以北、秦岭以北，纬度 >= 33 且不属于蜀）
    - 蜀: 益州（四川盆地 + 汉中 + 云贵），经度 95-109 且纬度 22-34（西南）
    - 吴: 长江中下游及以南（纬度 < 33 且经度 >= 108）
    """
    def classify(lng, lat, name):
        # 蜀：益州管辖（含四川、云贵、汉中）
        if 95 <= lng <= 109 and 22 <= lat <= 34:
            return "蜀"
        # 魏：北方
        if lat >= 33:
            return "魏"
        # 吴：其余南方
        return "吴"
    rules = [(classify, None)]
    # 特殊处理：直接用 classify 函数
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_north_south(f):
    """
    南北朝 497 年（齐/北魏对峙）：
    - 北魏: 黄河流域，纬度 >= 33
    - 南齐: 淮河/长江以南，纬度 < 33
    """
    def classify(lng, lat, name):
        return "北魏" if lat >= 33 else "南齐"
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_jin_east(f):
    """
    东晋 317~420：北方十六国 + 南方东晋
    - 东晋: 长江以南（纬度 < 33，或长江流域）
    - 北方诸国（前秦/后赵/北魏等，统称"北方十六国"）: 纬度 >= 33
    """
    def classify(lng, lat, name):
        return "北方十六国" if lat >= 33 else "东晋"
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_song_north(f):
    """
    北宋 960-1127 对应时期的政权：
    - 辽（含燕云十六州、东北、内蒙古）: 纬度 >= 40，或东北（经度 >= 120 且纬度 >= 38）
    - 西夏（银川、河西走廊）: 经度 98-108 且纬度 35-42
    - 北宋: 其余中原及南方
    """
    def classify(lng, lat, name):
        # 西夏
        if 98 <= lng <= 109 and 35 <= lat <= 42:
            return "西夏"
        # 辽
        if lat >= 40 or (lng >= 120 and lat >= 38):
            return "辽"
        # 北宋
        return "北宋"
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_song_south(f):
    """
    南宋 1127-1279：
    - 金: 北方（纬度 >= 33）
    - 西夏: 西北
    - 南宋: 长江以南
    """
    def classify(lng, lat, name):
        if 98 <= lng <= 109 and 35 <= lat <= 42:
            return "西夏"
        if lat >= 33:
            return "金"
        return "南宋"
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def split_five_dynasties(f):
    """
    五代十国 907-960（950 前后）：
    中原五代: 后梁/后唐/后晋/后汉/后周（北方）
    - 后蜀: 四川（经度 95-109, 纬度 26-34）
    - 吴/南唐: 江淮（经度 115-122, 纬度 27-34）
    - 吴越: 浙江（经度 118-122, 纬度 27-31）
    - 闽: 福建（经度 116-121, 纬度 23-28）
    - 南汉: 岭南（经度 105-117, 纬度 <25）
    - 楚: 湖南（经度 108-115, 纬度 24-30）
    - 荆南: 湖北江陵一带（经度 110-115, 纬度 29-31）
    - 北汉: 山西（经度 110-114, 纬度 35-40）
    - 辽（契丹）: 燕云及东北（纬度 >= 40）
    """
    def classify(lng, lat, name):
        if lat >= 40:
            return "辽（契丹）"
        if 95 <= lng <= 109 and 26 <= lat <= 34:
            return "后蜀"
        if 110 <= lng <= 114 and 35 <= lat <= 40:
            return "北汉"
        if 105 <= lng <= 117 and lat < 25:
            return "南汉"
        if 116 <= lng <= 121 and 23 <= lat < 28:
            return "闽"
        if 118 <= lng <= 122 and 27 <= lat < 31:
            return "吴越"
        if 115 <= lng <= 122 and 28 <= lat < 34:
            return "南唐"
        if 108 <= lng <= 115 and 24 <= lat < 30:
            return "楚"
        if 110 <= lng <= 115 and 29 <= lat < 32:
            return "荆南"
        # 默认中原五代
        return "中原五代"
    data = json.loads(f.read_text(encoding="utf-8"))
    for feat in data.get("features", []):
        geom = feat.get("geometry") or {}
        pts = []
        def collect(c):
            if isinstance(c, (int, float)): return
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)) and len(c) >= 2:
                    pts.append((c[0], c[1]))
                else:
                    for x in c: collect(x)
        collect(geom.get("coordinates", []))
        if not pts: continue
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        feat["properties"]["POWER"] = classify(lng, lat, feat["properties"].get("NAME_CH", ""))
    f.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    return data


def main():
    configs = [
        ("qin-dynasty.geojson", lambda p: annotate_single_power(p, "秦")),
        ("west-han-dynasty.geojson", lambda p: annotate_single_power(p, "西汉")),
        ("east-han-dynasty.geojson", lambda p: annotate_single_power(p, "东汉")),
        ("han-dynasty.geojson", lambda p: annotate_single_power(p, "汉")),
        ("three-kingdoms.geojson", split_three_kingdoms),
        ("jin-west-dynasty.geojson", lambda p: annotate_single_power(p, "西晋")),
        ("jin-east-dynasty.geojson", split_jin_east),
        ("northern-southern.geojson", split_north_south),
        ("sui-dynasty.geojson", lambda p: annotate_single_power(p, "隋")),
        ("tang-dynasty.geojson", lambda p: annotate_single_power(p, "唐")),
        ("five-dynasties.geojson", split_five_dynasties),
        ("north-song-dynasty.geojson", split_song_north),
        ("south-song-dynasty.geojson", split_song_south),
        ("liao-dynasty.geojson", split_song_north),  # 同 1111 切片
        ("jin-jurchen.geojson", split_song_south),  # 同 1190/1210 切片
        ("yuan-dynasty.geojson", lambda p: annotate_single_power(p, "元")),
        ("ming-dynasty.geojson", lambda p: annotate_single_power(p, "明")),
        ("qing-dynasty.geojson", lambda p: annotate_single_power(p, "清")),
    ]
    for fname, fn in configs:
        p = BASE / fname
        if not p.exists():
            print(f"  ⚠️ 跳过 {fname}: 不存在")
            continue
        data = fn(p)
        # 统计 POWER 分布
        from collections import Counter
        ct = Counter(f["properties"].get("POWER", "未知") for f in data.get("features", []))
        print(f"  ✅ {fname}: {dict(ct)}")


if __name__ == "__main__":
    main()
