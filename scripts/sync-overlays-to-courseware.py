#!/usr/bin/env python3
"""v7.9.5 一次性工具：把 opensource 的 manifest overlays 配置 + CHGIS details geojson
同步到 teachany-courseware 仓库的实体课件里。

做三件事：
  1. 复制 skill/assets/historical-china/details/*.geojson → <courseware>/<course>/assets/maps/details/
  2. 对于已经有 data-teachany-map-config 的课件：把 overlays 字段插入已有 config JSON
  3. 对于没有地图 section 的课件（丝路）：在 intro 后插入完整地图 section

幂等：重复跑不会重复注入。
"""
import json, re, shutil
from pathlib import Path

OPEN = Path(__file__).resolve().parent.parent
CW = OPEN.parent / "teachany-courseware"

MANIFEST = OPEN / "scripts/historical-maps-manifest.json"
DETAILS_SRC = OPEN / "skill/assets/historical-china/details"

def copy_details(course_dir: Path, overlays: list) -> int:
    if not overlays:
        return 0
    target = course_dir / "assets" / "maps" / "details"
    target.mkdir(parents=True, exist_ok=True)
    copied = 0
    for ov in overlays:
        fn = ov.get("file", "").split("/")[-1]
        if not fn:
            continue
        src = DETAILS_SRC / fn
        if not src.exists():
            print(f"    ⚠ 缺失源文件: {src.relative_to(OPEN)}")
            continue
        dst = target / fn
        if dst.exists() and dst.stat().st_size == src.stat().st_size:
            continue
        shutil.copy2(src, dst)
        copied += 1
    return copied

def inject_overlays_into_config(html: str, overlays: list) -> tuple:
    """把 overlays 字段插入到已有 data-teachany-map-config 的 JSON 里。
    幂等：如果已经有 "overlays"，先替换再写；没有就追加到 JSON 末尾。"""
    # 定位 <script type="application/json" data-teachany-map-config>...</script>
    pattern = re.compile(
        r'(<script\s+type="application/json"\s+data-teachany-map-config[^>]*>)([\s\S]*?)(</script>)',
        re.IGNORECASE
    )
    m = pattern.search(html)
    if not m:
        return html, False, "no-config"
    start_tag, body, end_tag = m.group(1), m.group(2), m.group(3)
    try:
        cfg = json.loads(body.strip())
    except Exception as e:
        return html, False, f"json-parse-err: {e}"
    # 比较 overlays 是否已是目标值（幂等）
    if cfg.get("overlays") == overlays:
        return html, False, "already-matched"
    cfg["overlays"] = overlays
    new_body = json.dumps(cfg, ensure_ascii=False, indent=2)
    new_html = html[:m.start()] + start_tag + "\n" + new_body + "\n" + end_tag + html[m.end():]
    return new_html, True, "overlays-injected"

def build_full_map_section(course_rel: str, cfg: dict) -> str:
    """从头造一个地图 section（给没有地图模块的课件用）"""
    config_json = json.dumps({
        "eras": cfg["eras"],
        "center": cfg.get("center", [34, 108]),
        "zoom": cfg.get("zoom", 4),
        "fitBounds": cfg.get("fitBounds"),
        "minZoom": cfg.get("minZoom", 2),
        "maxZoom": cfg.get("maxZoom", 8),
        "overlays": cfg.get("overlays", [])
    }, ensure_ascii=False, indent=2)
    map_id = "thm-" + re.sub(r"[^a-z0-9-]+", "-", course_rel.lower())[:40]
    return f'''
<!-- ⭐ v7.9.5 标准 Leaflet 历史地图模块（CHGIS overlays 可用）-->
<section class="ta-standard-section" id="historical-map">
  <h2 style="text-align:center;margin-bottom:16px;">🗺️ {cfg["title"]}</h2>
  <p style="text-align:center;color:#64748b;margin-bottom:18px;">点击时代按钮切换疆域版图；点击地图下方"细节图层"按钮可显示/隐藏 关隘/河流/古都/丝路。</p>
  <div data-teachany-map="{map_id}"
       data-teachany-map-scope="{cfg.get('scope', 'china')}"
       data-teachany-map-title="{cfg['title']}">
    <script type="application/json" data-teachany-map-config>
{config_json}
    </script>
  </div>
</section>
'''

def inject_section_after_intro(html: str, block: str) -> tuple:
    if 'data-teachany-map=' in html:
        return html, False, "already-has-map"
    # 插到 intro/module-1/hero 之后
    for sec_id in ["intro", "module-1", "module1", "hero"]:
        pat = re.compile(r'<section[^>]*id=["\']' + sec_id + r'["\'][^>]*>[\s\S]*?</section>', re.IGNORECASE)
        m = pat.search(html)
        if m:
            return html[:m.end()] + block + html[m.end():], True, f"inserted-after-{sec_id}"
    # 兜底：插到 main 开始处
    m = re.search(r'<main[^>]*>', html)
    if m:
        return html[:m.end()] + block + html[m.end():], True, "inserted-after-main"
    return html, False, "no-insertion-point"

def process_course(course_rel: str, cfg: dict):
    course_dir = CW / course_rel
    idx = course_dir / "index.html"
    if not idx.exists():
        return f"  {course_rel}: no-index in courseware"
    overlays = cfg.get("overlays")
    if not overlays:
        return f"  {course_rel}: no-overlays-in-manifest"

    # 1. 复制 details geojson
    copied = copy_details(course_dir, overlays)

    # 2. 修改 HTML
    html = idx.read_text(encoding="utf-8")
    orig = html
    html, changed, note = inject_overlays_into_config(html, overlays)
    if not changed and note == "no-config":
        # 没有地图 section，创建完整的
        block = build_full_map_section(course_rel, cfg)
        html, inj, note2 = inject_section_after_intro(html, block)
        if inj:
            changed = True
            note = f"full-section-created ({note2})"

    if changed:
        idx.write_text(html, encoding="utf-8")
    return f"  {course_rel}: details_copied={copied}, html_changed={changed}, note={note}"

def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    targets = [(k, v) for k, v in manifest.items() if v.get("overlays")]
    print(f"\n对 {len(targets)} 个含 overlays 的课件同步到 courseware：\n")
    for course, cfg in targets:
        print(process_course(course, cfg))
    print("\n完成。请在浏览器中打开任一课件的 index.html 验证 overlays 按钮是否出现在地图下方。")

if __name__ == "__main__":
    main()
