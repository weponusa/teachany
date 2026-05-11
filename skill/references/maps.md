# Maps (Geography & History)

⛔ **Hard rule**: TeachAny courseware MUST use **local map assets** (no XYZ tile services like CartoDB/Esri/OSM). External tiles fail under firewalls and break offline use.

⛔ **Library-first principle**: ALWAYS query the bundled map library before generating new resources. The skill ships with 207 maps (104 MB) covering common cases.

---

## 📚 The bundled map library

Location: `~/.codebuddy/skills/teachany/assets/maps/`

| Category | Count | What's inside |
|:---|:---:|:---|
| `physical/hillshade/` | 6 | Global terrain shading (2K + 4K, color + grayscale variants) |
| `physical/coastline/` | 2 | World + China coastlines (Natural Earth 10m) |
| `physical/rivers/`, `lakes/` | 4 | World + China rivers and lakes |
| `physical/terrain-tiles/` | 147 | Pre-rendered terrain tiles (zoom 4-6) |
| `political/world/` | 1 | World country borders (modern) |
| `political/china-modern/` | 4 | China provinces + Beijing/Shanghai |
| `political/admin-boundaries/` | 3 | Detailed admin boundaries |
| `chrono-cn/` | 19 | Every Chinese dynasty (Qin → Qing, with year ranges) |
| `chrono-world/` | 21 | World maps from BCE 3000 to CE 2000 |

**Index file**: `MANIFEST.json` (machine-readable, with metadata: year ranges, Chinese names, descriptions).

---

## 🔍 Library lookup tool: `find-map.py`

```bash
# Show library overview
python3 ~/.codebuddy/skills/teachany/skill/scripts/find-map.py

# Search by keyword (Chinese aliases supported)
find-map.py 文艺复兴       # → ce-1492-age-of-discovery.geojson
find-map.py 唐             # → 010-tang-dynasty.geojson
find-map.py renaissance

# Search by historical era
find-map.py --era 1500     # → 1300, 1492, 1600 maps

# Search by dynasty
find-map.py --dynasty tang
find-map.py --dynasty ming

# Search base layers
find-map.py --base hillshade        # → 6 hillshade variants
find-map.py --base coastline        # → coastline JSONs
find-map.py --base terrain-tiles    # → 147 tiles

# Search administrative boundaries
find-map.py --boundary country      # → world country borders
find-map.py --boundary province     # → China province borders

# Copy a resource into courseware (no token cost, takes seconds)
find-map.py --copy global-hillshade-4k.jpg ./community/<course-id>/assets/maps/
find-map.py --copy 014-ce-1492-age-of-discovery.geojson ./community/<course-id>/assets/maps/

# List entire library
find-map.py --list-all
```

---

## 🛠️ Bundle helper: `bundle_map_assets.sh`

After writing the courseware HTML with `<img src="./assets/maps/xxx.geojson">` references, run:

```bash
bash ~/.codebuddy/skills/teachany/skill/scripts/bundle_map_assets.sh ./community/<course-id>
```

This script:
1. Scans `index.html` for all `.geojson` references and `data-map="..."` attributes
2. Looks them up in the library (precise + fuzzy match: `xxx.geojson` ↔ `NNN-xxx.geojson`)
3. Copies matched resources into `./assets/maps/`
4. Auto-handles hillshade if HTML mentions `hillshade` or `basemap`

After bundling, the courseware is fully self-contained.

---

## Standard map asset structure (in courseware)

```
community/<course-id>/assets/maps/
├── hillshade.jpg              # ← from library (or external if no match)
├── boundaries.geojson         # ← from library (era-specific from chrono-world/ or chrono-cn/)
├── places.geojson             # ← manually curated (4-8 cities)
└── overlays/                  # ← optional event overlays
    ├── <era1>.geojson
    └── <era2>.geojson
```

⛔ History/geography courseware without a map = violation of hard rule #62.
⛔ Plain-color background instead of `hillshade.jpg` = violation. Hillshade is required for terrain context.
⛔ Hand-drawn SVG outline without terrain shading = violation of baseline ⑯.

---

## Map selection workflow (library-first)

1. **Identify the spatial scope** — country / region / city / site
2. **Identify the temporal scope** — present-day / specific era / time-lapse
3. **Run `find-map.py`** to query the library:
   - For history → search by era/dynasty
   - For modern geography → search by `--boundary` and `--base`
4. **If library hits** → `find-map.py --copy <file> <dst>`. Done.
5. **If library misses** → external sources (in this order):
   - Natural Earth (`naturalearthdata.com`)
   - CShapes (`cshapes.sgendata.com`) for 19th-21st century historical borders
   - historical-basemaps (`github.com/aourednik/historical-basemaps`) for ancient/medieval
   - SRTM DEM + `gdaldem hillshade` (last resort; afterwards contribute to library)
6. **Manually curate `places.geojson`** with the courseware-specific cities (the library doesn't pre-store places; this is where YOU add value)
7. **Bind to narrative** — every map appearance must have an exposition section pointing to specific regions (Anti-Shortcut Rule 7)

---

## ⛔ Common anti-patterns

- ❌ Calling `image_gen` to "generate Europe terrain" without first running `find-map.py --base hillshade`
- ❌ Hand-drawing GeoJSON polygons for country borders instead of `find-map.py --boundary country`
- ❌ Using a different hillshade for every history courseware → visual inconsistency
- ❌ Online XYZ tile services (CartoDB/Esri/OSM) — fails offline and under firewalls
- ❌ Stylized SVG shape with colored dots called "the map" — that's decoration, not geography

---

## See also
- `baseline-rules.md` § ⑯ — Full library-first decision flow
- `../historical-maps.md` — Full historical map reference
- `../historical-maps-quickref.md` — Quick lookup by era
- `../terrain-3d-integration.md` — 3D terrain integration
- `MANIFEST.json` (in `assets/maps/`) — Machine-readable library index
