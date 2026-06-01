#!/usr/bin/env python3
"""
v7.11.0 批量为历史/地理课件注入 Leaflet 历史地图模块（双平台资源：teachany.cn + GitHub）。

设计要点：
  - 地图图层引用统一写成「相对 manifest 路径」（如 chrono-cn/010-tang-dynasty.geojson），
    运行时 teachany-historical-map.js 会按 本地 → teachany.cn → GitHub 顺序回退获取，
    国内用户也能加载（teachany.cn 走 Cloudflare，全球可访问）。
  - 本地有地图资源（courseware 仓库）时复制到 <course>/assets/maps/<相对路径>，课件自包含；
    本地没有（精简 skill 安装）时只写相对路径，靠运行时远程双平台获取，无需全量下载。

环境变量：
  TEACHANY_MAP_SOURCE=auto|local|remote   默认 auto（本地优先，缺失走远程相对路径）
  TEACHANY_MAP_REMOTE_BASE                覆盖默认远程 MANIFEST 基址

幂等：检测 data-teachany-map 已存在则跳过 HTML 注入；本地文件一致则跳过复制。
"""
import json
import os
import re
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts/historical-maps-manifest.json"

# 本地地图库（courseware 仓库存在；精简 skill 安装可能不存在）
LOCAL_MAPS_DIR = ROOT / "assets" / "maps"
LOCAL_MANIFEST = LOCAL_MAPS_DIR / "MANIFEST.json"
# 历史兼容：旧 skill 资产目录（裸名）
LEGACY_CHINA = ROOT / "skill/assets/historical-china"
LEGACY_WORLD = ROOT / "skill/assets/historical-world"
LEGACY_DETAILS = ROOT / "skill/assets/historical-china/details"

MAP_SOURCE_MODE = os.environ.get("TEACHANY_MAP_SOURCE", "auto").strip().lower()

# 双平台远程基址：teachany.cn 优先（国内外均可访问），GitHub 作为备份
REMOTE_BASES = [
    os.environ.get("TEACHANY_MAP_REMOTE_BASE", "").rstrip("/") or "https://www.teachany.cn/assets/maps",
    "https://cdn.jsdelivr.net/gh/weponusa/teachany@main/assets/maps",
    "https://raw.githubusercontent.com/weponusa/teachany/main/assets/maps",
]

LEAFLET_CSS = '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">'
LEAFLET_JS = '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>'
MODULE_CSS = '<link rel="stylesheet" href="../../assets/scripts/teachany-historical-map.css">'
MODULE_JS = '<script src="../../assets/scripts/teachany-historical-map.js" defer></script>'

HILLSHADE_RELPATH = "physical/hillshade/global-color-hillshade-2k.jpg"

DRY_RUN = False
_MANIFEST_INDEX = None


def _use_local():
    return MAP_SOURCE_MODE in ("auto", "local")


def _use_remote():
    return MAP_SOURCE_MODE in ("auto", "remote")


def _basename(p):
    return p.split("/")[-1]


def _load_map_manifest():
    """加载地图 MANIFEST：本地优先，否则按双平台远程依次尝试。返回 {basename/key: relpath}。"""
    global _MANIFEST_INDEX
    if _MANIFEST_INDEX is not None:
        return _MANIFEST_INDEX
    data = None
    if LOCAL_MANIFEST.exists():
        try:
            data = json.loads(LOCAL_MANIFEST.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  ⚠ 本地 MANIFEST 解析失败：{e}")
    if data is None and _use_remote():
        for base in REMOTE_BASES:
            try:
                with urllib.request.urlopen(base + "/MANIFEST.json", timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                break
            except Exception:
                continue
    index = {}
    if isinstance(data, dict):
        for f in data.get("files", []):
            path = f.get("path")
            if not path:
                continue
            index[_basename(path)] = path
            key = f.get("key")
            if key:
                index[key] = path
                index[key + ".geojson"] = path
    _MANIFEST_INDEX = index
    return index


def resolve_relpath(file_name):
    """裸名/key → manifest 相对路径（chrono-cn/010-xxx.geojson）。找不到返回 None。"""
    if file_name.startswith("http") or file_name.startswith("/") or file_name.startswith("./"):
        return file_name
    idx = _load_map_manifest()
    if file_name in idx:
        return idx[file_name]
    key = file_name.replace(".geojson", "")
    if key in idx:
        return idx[key]
    return None


def _copy_local_if_present(relpath, course_dir):
    """若本地（assets/maps 或旧 skill 目录）存在该资源，复制到课件 assets/maps/<relpath>。返回是否复制。"""
    if not _use_local():
        return False
    target = course_dir / "assets" / "maps" / relpath
    candidates = [LOCAL_MAPS_DIR / relpath]
    fname = _basename(relpath)
    candidates += [LEGACY_CHINA / fname, LEGACY_WORLD / fname]
    for src in candidates:
        if src.exists():
            if target.exists() and target.stat().st_size == src.stat().st_size:
                return False
            target.parent.mkdir(parents=True, exist_ok=True)
            if not DRY_RUN:
                shutil.copy2(src, target)
            return True
    return False


def copy_geojson_files(course_dir, scope, eras):
    copied = 0
    for era in eras:
        fname = era.get("file")
        if not fname or fname.startswith("http"):
            continue
        relpath = resolve_relpath(fname)
        if not relpath:
            print(f"  ⚠ 未能解析 geojson：{fname}（保留原引用）")
            continue
        if _copy_local_if_present(relpath, course_dir):
            copied += 1
        # 统一写相对路径，运行时按 本地→teachany.cn→GitHub 回退
        era["file"] = relpath
    return copied


def copy_overlay_files(course_dir, overlays):
    if not overlays:
        return 0
    copied = 0
    for ov in overlays:
        raw = ov.get("file")
        if not raw or raw.startswith("http"):
            continue
        fname = _basename(raw)
        relpath = resolve_relpath(fname)
        if relpath:
            if _copy_local_if_present(relpath, course_dir):
                copied += 1
            ov["file"] = relpath
            continue
        # MANIFEST 无此 overlay：尝试旧 skill details 目录，复制到课件 details/
        legacy = LEGACY_DETAILS / fname
        if _use_local() and legacy.exists():
            target = course_dir / "assets" / "maps" / "details" / fname
            target.parent.mkdir(parents=True, exist_ok=True)
            if not (target.exists() and target.stat().st_size == legacy.stat().st_size):
                if not DRY_RUN:
                    shutil.copy2(legacy, target)
                copied += 1
            ov["file"] = "details/" + fname
            continue
        print(f"  ⚠ overlay 未解析：{fname}（保留原引用，运行时将自动跳过加载失败项）")
    return copied


def set_hillshade(course_dir, cfg):
    """hillshade 统一写相对路径；本地有则复制，运行时按 本地→teachany.cn→GitHub 回退。"""
    _copy_local_if_present(HILLSHADE_RELPATH, course_dir)
    cfg["hillshade"] = HILLSHADE_RELPATH


def inject_head(html):
    if "teachany-historical-map.js" in html:
        return html
    addition = ""
    if "leaflet.css" not in html:
        addition += "  " + LEAFLET_CSS + "\n"
    if "leaflet.js" not in html:
        addition += "  " + LEAFLET_JS + "\n"
    if "teachany-historical-map.css" not in html:
        addition += "  " + MODULE_CSS + "\n"
    if not addition:
        return html
    return html.replace("</head>", addition + "</head>", 1)


def inject_script_bottom(html):
    if MODULE_JS in html:
        return html
    for kg_marker in (
        '<script src="../../assets/scripts/teachany-knowledge-graph.js"',
        '<script src="../../scripts/teachany-knowledge-graph.js"',
    ):
        if kg_marker in html:
            return html.replace(kg_marker, MODULE_JS + "\n" + kg_marker, 1)
    return html.replace("</body>", MODULE_JS + "\n</body>", 1)


def build_section(course_id, cfg):
    config_dict = {
        "eras": cfg["eras"],
        "center": cfg.get("center", [34, 108]),
        "zoom": cfg.get("zoom", 4),
        "fitBounds": cfg.get("fitBounds"),
        "minZoom": cfg.get("minZoom", 2),
        "maxZoom": cfg.get("maxZoom", 8),
    }
    if cfg.get("overlays"):
        config_dict["overlays"] = cfg["overlays"]
    if cfg.get("hillshade"):
        config_dict["hillshade"] = cfg["hillshade"]
    config_json = json.dumps(config_dict, ensure_ascii=False, indent=2)
    map_id = "thm-" + re.sub(r"[^a-z0-9-]+", "-", course_id.lower())[:40]
    return f'''
<!-- ⭐ 标准 Leaflet 历史地图模块（双平台资源：teachany.cn + GitHub）-->
<section class="ta-standard-section" id="teachany-historical-map">
  <h2 style="text-align:center;margin-bottom:16px;">🗺️ {cfg["title"]}</h2>
  <p style="text-align:center;color:#64748b;margin-bottom:18px;">点击时代按钮切换疆域版图；悬停高亮边界；点击红色城市标记查看详情。</p>
  <div data-teachany-map="{map_id}"
       data-teachany-map-scope="{cfg.get('scope', 'china')}"
       data-teachany-map-title="{cfg['title']}">
    <script type="application/json" data-teachany-map-config>
{config_json}
    </script>
  </div>
</section>
'''


def inject_section(html, block):
    if 'data-teachany-map=' in html:
        return html, False
    for sec_id in ["module1", "module-1", "intro", "objectives", "pretest"]:
        pattern = r'<section[^>]*id=["\']' + sec_id + r'["\'][^>]*>'
        sm = re.search(pattern, html)
        if not sm:
            pattern = r'<div[^>]*class="section"[^>]*id=["\']' + sec_id + r'["\'][^>]*>'
            sm = re.search(pattern, html)
        if not sm:
            continue
        start = sm.end()
        depth = 1
        i = start
        open_tag = "<section" if sm.group(0).startswith("<section") else "<div"
        close_tag = "</section>" if open_tag == "<section" else "</div>"
        while i < len(html) and depth > 0:
            om = re.search(open_tag + r'[\s>]', html[i:])
            cm = re.search(close_tag, html[i:])
            if not cm:
                break
            if om and om.start() < cm.start():
                depth += 1
                i += om.end()
            else:
                depth -= 1
                i += cm.end()
        if depth == 0:
            return html[:i] + block + html[i:], True
    if 'id="teachany-ai-tutor-card"' in html:
        pat = re.search(r'<section[^>]*id="teachany-ai-tutor-card"[^>]*>[\s\S]*?</section>', html)
        if pat:
            return html[:pat.end()] + block + html[pat.end():], True
    return html, False


def process(course_rel_path, cfg):
    if cfg.get("skip"):
        return "skipped: " + cfg.get("reason", "")
    course_dir = ROOT / course_rel_path
    idx = course_dir / "index.html"
    if not idx.exists():
        return "no-index"

    html = idx.read_text(encoding="utf-8")
    orig = html

    # 幂等保护：已有地图模块的课件保持其原有引用（可能是已绑定的裸名本地资源），
    # 不重复复制到新相对路径，避免与既有 HTML config 不一致。
    if 'data-teachany-map=' in html:
        return "no-change"

    cfg_runtime = json.loads(json.dumps(cfg))  # 可写副本，避免污染 manifest
    copied = copy_geojson_files(course_dir, cfg_runtime.get("scope", "china"), cfg_runtime["eras"])
    set_hillshade(course_dir, cfg_runtime)
    overlay_copied = copy_overlay_files(course_dir, cfg_runtime.get("overlays", []))
    html = inject_head(html)
    html = inject_script_bottom(html)
    html, inj_section = inject_section(html, build_section(course_rel_path, cfg_runtime))

    if html != orig:
        if DRY_RUN:
            print(f"    [dry-run] write {idx.relative_to(ROOT)} ({len(html)} chars)")
        else:
            idx.write_text(html, encoding="utf-8")
        return f"applied (geojson={copied}, overlays={overlay_copied}, section={inj_section})"
    if copied > 0 or overlay_copied > 0:
        return f"assets-only (geojson={copied}, overlays={overlay_copied})"
    return "no-change"


def main():
    import sys
    global DRY_RUN
    if "--dry-run" in sys.argv:
        DRY_RUN = True
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    print(f"处理 {len(manifest)} 个课件{' [DRY-RUN]' if DRY_RUN else ''}（地图源模式={MAP_SOURCE_MODE}）：\n")
    stats = {"applied": 0, "skipped": 0, "no-index": 0, "no-change": 0, "assets-only": 0}
    for course, cfg in manifest.items():
        result = process(course, cfg)
        if result.startswith("applied"):
            stats["applied"] += 1
        elif result.startswith("assets-only"):
            stats["assets-only"] += 1
        elif result.startswith("skipped"):
            stats["skipped"] += 1
        elif result == "no-index":
            stats["no-index"] += 1
        else:
            stats["no-change"] += 1
        print(f"  {course}: {result}")
    print(f"\n汇总：{stats}")


if __name__ == "__main__":
    main()
