#!/usr/bin/env python3
"""
重建中国历代地图，解决"地图看起来像世界地图"的问题。

核心问题：CHGIS V6 的 prefecture polygon 图层对早期朝代（秦、汉、唐）的北方/西北/东北
采集极不完整（陇西郡、朔方郡、辽东郡、河西走廊、安西四镇等几乎都没有多边形），
导致渲染时只画出南方部分，视觉上像"世界地图里中国沿海一小块"。

解决方案：
  1. 每个朝代地图里，添加一个 **疆域外轮廓** 作为底层 feature（取自 historical-basemaps 同期切片）
     - 让整张地图无论 CHGIS 府级采集多不均，都有完整疆域底色
     - LEVEL=country，POWER=朝代名
  2. CHGIS 的府级多边形作为上层细节（LEVEL=prefecture）
  3. metadata 里添加 recommended_bbox，锁定东亚视野
     （lng 70~145, lat 15~55）

朝代 → historical-basemaps 切片对应：
  秦(前221~前206)   ← bce-200  (Qin/Han)
  西汉(前202~公元8)  ← bce-1    (Han)
  东汉(25~220)       ← ce-200   (Han)
  三国(220~280)      ← ce-200
  西晋(265~316)      ← ce-500 之前
  东晋(317~420)      ← ce-500
  南北朝(420~589)    ← ce-500
  隋(581~618)        ← ce-800 之前（近似用 ce-800 的 Tang 轮廓的祖先）
  唐(618~907)        ← ce-800
  五代十国(907~960)  ← ce-1000 (Song Empire 前身)
  北宋(960~1127)     ← ce-1000 + Liao/Xixia/Tibet/Korea
  南宋(1127~1279)    ← ce-1200 + 调整 Jin
  元(1271~1368)      ← ce-1300
  明(1368~1644)      ← ce-1492 前身
  清(1644~1912)      ← ce-1700 / ce-1815
"""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "data" / "_legacy" / "resources" / "geography"
HIST_CHINA = BASE / "historical-china"
HIST_WORLD = BASE / "historical-world"

# 东亚视野
EAST_ASIA_BBOX = [70, 15, 145, 55]  # [minLng, minLat, maxLng, maxLat]

# CHGIS 府级切片（保留现状）在 historical-china/ 下已存在
# 我们要：从 historical-world/<year>.geojson 中提取中国及周边政权的 feature，
# 合并为"疆域轮廓层"，塞到 historical-china/<dynasty>.geojson 的 features 前面（作为底层）

# 朝代 → 世界切片 + 要提取的政权名
DYNASTY_WORLD_MAP = {
    "qin-dynasty": {
        "world_file": "bce-200.geojson",
        "names": ["Han Empire"],
        "name_zh_map": {"Han Empire": "秦（疆域轮廓用同期汉帝国近似）"},
        "power_name": "秦",
        "meta_period": "前221~前206",
    },
    "west-han-dynasty": {
        "world_file": "bce-1.geojson",
        "names": ["Han"],
        "name_zh_map": {"Han": "西汉"},
        "power_name": "西汉",
        "meta_period": "前202~公元8",
    },
    "east-han-dynasty": {
        "world_file": "ce-200.geojson",
        "names": ["Han", "Southern Xiongnu"],
        "name_zh_map": {"Han": "东汉", "Southern Xiongnu": "南匈奴"},
        "power_name": "东汉",
        "meta_period": "25~220",
    },
    "han-dynasty": {
        "world_file": "bce-1.geojson",
        "names": ["Han"],
        "name_zh_map": {"Han": "汉"},
        "power_name": "汉",
        "meta_period": "前202~公元220",
    },
    "three-kingdoms": {
        "world_file": "ce-200.geojson",
        "names": ["Han"],
        "name_zh_map": {"Han": "三国（疆域沿用汉末轮廓）"},
        "power_name": None,
        "meta_period": "220~280",
        "split_by_region": False,
    },
    "jin-west-dynasty": {
        "world_file": "ce-500.geojson",
        "names": ["Jin Empire"],
        "name_zh_map": {"Jin Empire": "西晋"},
        "power_name": "西晋",
        "meta_period": "265~316",
    },
    "jin-east-dynasty": {
        "world_file": "ce-500.geojson",
        "names": ["Jin Empire", "Toba Wei"],
        "name_zh_map": {"Jin Empire": "东晋", "Toba Wei": "北魏（拓跋）"},
        "power_name": None,
        "meta_period": "317~420",
    },
    "northern-southern": {
        "world_file": "ce-500.geojson",
        "names": ["Toba Wei", "Jin Empire"],
        "name_zh_map": {"Toba Wei": "北魏", "Jin Empire": "南朝"},
        "power_name": None,
        "meta_period": "420~589",
    },
    "sui-dynasty": {
        "world_file": "ce-800-caliphate-carolingian.geojson",
        "names": ["Tang Empire"],
        "name_zh_map": {"Tang Empire": "隋（疆域轮廓用同期唐近似）"},
        "power_name": "隋",
        "meta_period": "581~618",
    },
    "tang-dynasty": {
        "world_file": "ce-800-caliphate-carolingian.geojson",
        "names": ["Tang Empire"],
        "name_zh_map": {"Tang Empire": "唐"},
        "power_name": "唐",
        "meta_period": "618~907",
    },
    "five-dynasties": {
        "world_file": "ce-1000.geojson",
        "names": ["Song Empire", "Liao"],
        "name_zh_map": {"Song Empire": "中原五代前身（近似）", "Liao": "辽"},
        "power_name": None,
        "meta_period": "907~960",
    },
    "north-song-dynasty": {
        "world_file": "ce-1000.geojson",
        "names": ["Song Empire", "Liao", "Xixia", "Tibet", "Korea", "Imperial Japan (Fujiwara)"],
        "name_zh_map": {
            "Song Empire": "北宋", "Liao": "辽", "Xixia": "西夏",
            "Tibet": "吐蕃", "Korea": "高丽", "Imperial Japan (Fujiwara)": "日本",
        },
        "meta_period": "960~1127",
    },
    "south-song-dynasty": {
        "world_file": "ce-1200-mongol-rise.geojson",
        "names": ["Song Empire", "Liao", "Xixia", "Tibet", "Mongol Empire", "Goryeo", "Imperial Japan (Fujiwara)"],
        "name_zh_map": {
            "Song Empire": "南宋", "Liao": "金（沿辽地）", "Xixia": "西夏",
            "Tibet": "吐蕃", "Mongol Empire": "蒙古", "Goryeo": "高丽",
            "Imperial Japan (Fujiwara)": "日本",
        },
        "meta_period": "1127~1279",
    },
    "song-dynasty": {  # 合并版
        "world_file": "ce-1000.geojson",
        "names": ["Song Empire", "Liao", "Xixia", "Tibet", "Korea", "Imperial Japan (Fujiwara)"],
        "name_zh_map": {
            "Song Empire": "宋", "Liao": "辽", "Xixia": "西夏",
            "Tibet": "吐蕃", "Korea": "高丽", "Imperial Japan (Fujiwara)": "日本",
        },
        "meta_period": "960~1279",
    },
    "yuan-dynasty": {
        "world_file": "ce-1300-mongol-peak.geojson",
        "names": ["Great Khanate", "Tibet"],
        "name_zh_map": {"Great Khanate": "元", "Tibet": "吐蕃（宣政院辖地）"},
        "power_name": "元",
        "meta_period": "1271~1368",
    },
    "ming-dynasty": {
        "world_file": "ce-1492-age-of-discovery.geojson",
        "names": ["Ming Empire"],
        "name_zh_map": {"Ming Empire": "明"},
        "power_name": "明",
        "meta_period": "1368~1644",
    },
    "qing-dynasty": {
        "world_file": "ce-1700.geojson",
        "names": ["Manchu Empire"],
        "name_zh_map": {"Manchu Empire": "清"},
        "power_name": "清",
        "meta_period": "1644~1912",
    },
}


def centroid(feat):
    geom = feat.get("geometry") or {}
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
    collect(geom.get("coordinates", []))
    if not pts:
        return None, None
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def in_east_asia(lng, lat):
    return EAST_ASIA_BBOX[0] <= lng <= EAST_ASIA_BBOX[2] and EAST_ASIA_BBOX[1] <= lat <= EAST_ASIA_BBOX[3]


def extract_world_features(world_file, names, name_zh_map=None):
    """从 world geojson 中按 NAME 提取政权 feature，返回 feature list"""
    p = HIST_WORLD / world_file
    if not p.exists():
        print(f"  ⚠️ 缺失世界切片: {world_file}")
        return []
    d = json.loads(p.read_text(encoding="utf-8"))
    feats = []
    for f in d.get("features", []):
        name = (f["properties"].get("NAME") or "").strip()
        if not name:
            continue
        # 匹配任一 name
        matched = None
        for n in names:
            if n.lower() == name.lower() or n.lower() in name.lower():
                matched = n
                break
        if not matched:
            continue
        # 过滤：centroid 必须在东亚（避免把 Japan 等岛国拉扯视野过大也 OK）
        cl, ca = centroid(f)
        if cl is None or not in_east_asia(cl, ca):
            continue
        # 构造新的 feature（保留原坐标）
        zh = (name_zh_map or {}).get(name) or (name_zh_map or {}).get(matched) or matched
        new_f = {
            "type": "Feature",
            "properties": {
                "NAME_CH": zh,
                "NAME_EN": name,
                "POWER": zh,
                "LEVEL": "country",
                "source": "historical-basemaps",
            },
            "geometry": f["geometry"],
        }
        feats.append(new_f)
    return feats


def classify_three_kingdoms(feats):
    """给三国时期的 country feature 按区域分配魏/蜀/吴"""
    for f in feats:
        cl, ca = centroid(f)
        if cl is None:
            continue
        # 蜀：益州（四川盆地+汉中+云贵）
        if 95 <= cl <= 109 and 22 <= ca <= 34:
            f["properties"]["POWER"] = "蜀"
            f["properties"]["NAME_CH"] = "蜀"
        elif ca >= 33:
            f["properties"]["POWER"] = "魏"
            f["properties"]["NAME_CH"] = "魏"
        else:
            f["properties"]["POWER"] = "吴"
            f["properties"]["NAME_CH"] = "吴"


def drop_old_country_features(features):
    """删除旧的手绘 country polygon"""
    return [f for f in features if f["properties"].get("LEVEL") != "country"]


def clip_outside_east_asia(features):
    """
    严格过滤：删除 centroid 在东亚以外的 feature。
    CHGIS 府级数据本就全在东亚，不会真的删掉；这是兜底。
    """
    result = []
    dropped = 0
    for f in features:
        cl, ca = centroid(f)
        if cl is None:
            continue
        if not in_east_asia(cl, ca):
            dropped += 1
            continue
        result.append(f)
    return result, dropped


def rebuild_one(dynasty_id, spec):
    src = HIST_CHINA / f"{dynasty_id}.geojson"
    if not src.exists():
        print(f"  ❌ 源文件不存在: {src.name}")
        return
    data = json.loads(src.read_text(encoding="utf-8"))
    old_feats = data.get("features", [])

    # 1. 去除旧的 country 轮廓
    clean_feats = drop_old_country_features(old_feats)

    # 2. 裁剪不在东亚的 feature
    clean_feats, dropped = clip_outside_east_asia(clean_feats)

    # 3. 对 CHGIS 府级 feature，如果没 POWER，补上朝代名
    default_power = spec.get("power_name")
    if default_power:
        for f in clean_feats:
            if not f["properties"].get("POWER"):
                f["properties"]["POWER"] = default_power
            if not f["properties"].get("LEVEL"):
                f["properties"]["LEVEL"] = "prefecture"

    # 4. 从 historical-world 中提取对应政权的精细轮廓
    world_feats = extract_world_features(
        spec["world_file"], spec["names"], spec.get("name_zh_map")
    )

    # 5. 三国特殊处理
    if spec.get("split_by_region") and not spec.get("name_zh_map"):
        classify_three_kingdoms(world_feats)

    # 6. 合并：country 轮廓放在 features 最前（底层渲染）
    new_feats = world_feats + clean_feats

    # 7. metadata
    new_data = {
        "type": "FeatureCollection",
        "metadata": {
            "dynasty_id": dynasty_id,
            "period": spec.get("meta_period", ""),
            "recommended_bbox": EAST_ASIA_BBOX,
            "recommended_center": [104, 34],
            "sources": {
                "country_outline": f"historical-basemaps ({spec['world_file']})",
                "prefecture_detail": "CHGIS V6 (Harvard + Fudan)",
            },
            "note": "features 首部为国家级疆域轮廓（LEVEL=country），后续为 CHGIS 府级政区（LEVEL=prefecture）。渲染时建议按 LEVEL 分层，country 在底、prefecture 在面。",
            "feature_count_country": len(world_feats),
            "feature_count_prefecture": len(clean_feats),
        },
        "features": new_feats,
    }

    # 保存（压缩）
    src.write_text(
        json.dumps(new_data, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )

    from collections import Counter
    ct = Counter(f["properties"].get("POWER", "-") for f in new_feats)
    lv = Counter(f["properties"].get("LEVEL", "-") for f in new_feats)
    drop_note = f"（裁剪 {dropped} 东亚外 feature）" if dropped else ""
    print(f"  ✅ {dynasty_id}: country={len(world_feats)} prefecture={len(clean_feats)} {drop_note}")
    print(f"     POWER: {dict(ct)}")
    print(f"     LEVEL: {dict(lv)}")


def main():
    print(f"重建中国历代地图（补充国家级疆域轮廓 + 锁定东亚视野）")
    print(f"底层数据源：historical-basemaps (同期切片)")
    print(f"细节数据源：CHGIS V6 prefecture polygon")
    print(f"视野 bbox: {EAST_ASIA_BBOX}\n")

    for dy_id, spec in DYNASTY_WORLD_MAP.items():
        rebuild_one(dy_id, spec)


if __name__ == "__main__":
    main()
