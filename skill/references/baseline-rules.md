# Baseline Capabilities & Red Lines (Detailed)

The 14 baseline items, 5 red lines, and 8 anti-shortcut rules — these are non-negotiable for every TeachAny courseware.

---

## The 14 baseline items (detailed)

### ① TTS narration audio

**What**: One MP3 file per `data-tts` paragraph in the HTML, named `tts/s01.mp3`, `tts/s02.mp3`, etc.

**How**:
```bash
python3 scripts/tts-engine.py "narration text" tts/s01.mp3
# Multi-engine fallback: edge-tts (L0) → proxy (L1) → macOS say (L2) → pyttsx3 (L3) → silent (L4)
```

**Quality gate — HARD RULE**: Only L0 (`edge-tts`) or L2 (`macOS say`) are acceptable for published courseware. L3 (`pyttsx3`) sounds robotic/stuttery and L4 (silent) gives students zero audio — both defeat the purpose of multimodal learning.

Enforce by setting `TEACHANY_TTS_MIN_QUALITY=L2` before generation:
```bash
export TEACHANY_TTS_MIN_QUALITY=L2
python3 scripts/tts-engine.py --text "..." --output tts/s01.mp3
# Script exits non-zero if engine degrades below L2 — stop the build and fix the network/proxy
```

If `edge-tts` is blocked (common in Mainland China without proxy), the script falls through to macOS `say`. Acceptable quality. But if you're on Linux/Windows with no `say` available and `pyttsx3` is the only option, **do NOT ship** — investigate proxy setup or generate on another machine.

**Symptom of silent degradation (must catch)**: MP3 file is 0 bytes or ~10 KB (silent placeholder). Always check file sizes after generation:
```bash
for f in tts/*.mp3; do
  size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  [ "$size" -lt 50000 ] && echo "⚠️  $f is only $size bytes — likely degraded"
done
```

Real edge-tts Chinese narration at ~40s should be ~150-200 KB.

**HTML pattern**:
```html
<p data-tts="s01">Narration text shown to students.</p>
```

**Audit**: Check `tts/` has the same number of MP3 files as `data-tts` attributes in HTML, and each MP3 is ≥50 KB.

### ② Remotion-rendered MP4

**What**: ≥1 video rendered by Remotion (real MP4, not CSS animation), with audio track (TTS + ambient/SFX).

**Why**: Process-oriented concepts (cell division, light refraction, river erosion, dynasty timeline) need motion. Static infographics ≠ video. CSS animations ≠ Remotion.

**Audit**:
```bash
ffprobe -show_entries stream=codec_type videos/main.mp4
# Must show: codec_type=video AND codec_type=audio
```

⛔ Do NOT pass off "hero image filling 4 minutes + audio track" as a video. Frame-level SSIM > 0.99 = static fake video. Each Remotion video must have ≥3 visual beats with new information units every ~15 seconds.

### ③ Canvas/SVG with real computation

**What**: Interactive Canvas or SVG with actual logic (drag triggers calculation, slider updates a curve, click runs an experiment).

⛔ Decorative Canvas (just animated decoration with no learning value) violates this rule. Every interactive element must teach something the student couldn't learn from reading alone.

### ④ AI-generated illustrations (≥2) + Mention-Means-Image Rule

**What**: Subject-specific images embedded in `<figure>` blocks with caption.

**Mention-Means-Image (硬规则)**: Every time the text names a specific artwork, figure, building, scene, or visual object — the courseware MUST embed an actual image of it. Violates if:
- Text says "看下面这两幅圣母像" but no image below
- Text says "拉斐尔的《椅中圣母》" without showing the painting
- Text says "米开朗基罗的《大卫》" without the sculpture
- Text says "西斯廷教堂天顶画" without the fresco

**Why**: Reading "look at this painting" without the painting breaks the comprehension chain. Students are forced to imagine or google — both defeat the purpose.

**Image sourcing decision tree**:

| The image is... | Source |
|:---|:---|
| Concept illustration (e.g., "a chopstick refracting in water", "a knight in armor") | **`image_gen`** — generate with subject-specific prompt |
| Specific famous artwork (Mona Lisa, David, Sistine Chapel ceiling, etc.) | **Web search for public-domain scan** — Wikimedia Commons is canonical. E.g., `https://upload.wikimedia.org/wikipedia/commons/thumb/...`. Cite source in `<figcaption>`. |
| Specific historical photograph | **Web search for public-domain or Creative Commons** — Wikimedia, Library of Congress, national archives |
| Knowledge-structure diagram / concept map | **`image_gen`** with knowledge-structure infographic prompt style |
| Scene reconstruction (e.g., "Luther nailing the 95 theses") | **`image_gen`** — we can generate a stylized reconstruction |

**HTML pattern for mentioned artwork** (Wikimedia reference):
```html
<figure class="inline-artwork">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/.../Raphael_Madonna.jpg/800px-Raphael_Madonna.jpg"
       loading="lazy"
       alt="拉斐尔《椅中圣母》">
  <figcaption>拉斐尔《椅中圣母》· c.1514 · 佛罗伦萨皮蒂宫 · 图源 Wikimedia Commons（公有领域）</figcaption>
</figure>
```

**Fallback for flaky networks**: Download to `assets/artwork-<slug>.jpg` at build time, keep the Wikimedia URL as onerror fallback.

**Audit**:
```bash
# Find "see" / "look at" mentions without adjacent <figure>
grep -nE "(看.*[（【]|下面这|这幅|这张|这副|这座|这尊|以下这|上面这)" index.html
# Each match should have a <figure> or <img> within 10 lines
```

⛔ Generic AI art (vague nature scene, abstract patterns) violates this. Each illustration must visually convey a specific concept.
⛔ Saying "look at this" without showing it = same magnitude violation as missing baseline ④ entirely.

### ⑤ Hero infographic (top of page)

**What**: A knowledge-structure infographic placed at top of HTML, showing the lesson's key concepts and their relationships.

**CDN-first lookup**:
```bash
python3 scripts/find-hero.py <course-id>
# L1: image-registry.json index
# L2: CDN naming convention probe (https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/<subject>/<keyword>-hero.png)
# L3: Generate via image_gen (fallback)
```

**HTML pattern** (CDN-first, onerror local fallback):
```html
<figure class="hero">
  <img src="https://cdn.jsdelivr.net/gh/weponusa/teachany-images@main/phy/light-refraction-hero.png"
       onerror="this.src='assets/light-refraction-hero.png'"
       alt="Light refraction knowledge structure">
  <figcaption>Light refraction: from index of refraction to total internal reflection</figcaption>
</figure>
```

### ⑥ Audio player module

**What**: A `<section id="audio-player">` with playlist of all TTS tracks, allowing students to re-listen at their own pace.

### ⑦ Knowledge graph section (with real data)

**What**: `<section id="knowledge-graph">` placed near the bottom, rendered by `teachany-knowledge-graph.js`. Shows prerequisites + current course + next courses as a connected graph.

**HARD RULE**: The section must contain **real data** — an empty placeholder `<section id="knowledge-graph"></section>` with nothing inside and no JS call is a violation. The graph JS needs data from one of two sources:

**Option A — Inline HTML nodes (simplest)**:
```html
<section id="knowledge-graph" data-tsh="知识图谱 - 本课在历史脉络中的位置">
  <h2>🌐 知识图谱：本课的位置</h2>
  <div class="kg-container">
    <!-- 前置 -->
    <div class="kg-row kg-prereqs">
      <span class="kg-label">前置：</span>
      <a href="../hist-m-medieval-europe/" class="kg-node kg-prereq" data-kg-node="hist-m-medieval-europe">中世纪欧洲</a>
    </div>
    <!-- 当前 -->
    <div class="kg-row kg-current">
      <span class="kg-label">本课：</span>
      <span class="kg-node kg-self" data-kg-node="hist-m-renaissance">文艺复兴与宗教改革</span>
    </div>
    <!-- 后续 -->
    <div class="kg-row kg-next">
      <span class="kg-label">后续：</span>
      <a href="../hist-m-scientific-revolution/" class="kg-node kg-next" data-kg-node="hist-m-scientific-revolution">科学革命</a>
      <a href="../hist-m-english-revolution/" class="kg-node kg-next" data-kg-node="hist-m-english-revolution">英国资产阶级革命</a>
    </div>
  </div>
</section>
```

**Option B — JS API (auto-renders from meta tags + course-registry.json)**:
```html
<section id="knowledge-graph" data-tsh="..."></section>
<script>
window.addEventListener('load', () => {
  if (window.TeachAnyKnowledgeGraph) {
    window.TeachAnyKnowledgeGraph.render({
      container: '#knowledge-graph',
      current: 'hist-m-renaissance',
      prereqs: ['hist-m-medieval-europe'],
      next: ['hist-m-scientific-revolution', 'hist-m-english-revolution'],
    });
  }
});
</script>
```

**Verify**: After page load, the section must have non-empty innerHTML. In console:
```js
const kg = document.getElementById('knowledge-graph');
console.assert(kg && kg.children.length > 1, '❌ knowledge-graph section is empty');
```

⛔ Placing `<section id="knowledge-graph"></section>` and trusting the JS to "figure it out from `<meta name="course-prereqs">`" is fragile — many courses have the JS not shipped yet. Always provide Option A inline HTML as fallback.

### ⑧–⑫ Five-piece suite (the Big Five)

All 5 modules must be loaded:

```html
<!-- in <head> -->
<link rel="stylesheet" href="../../scripts/ai-tutor.css">
<link rel="stylesheet" href="../../scripts/teachany-tutor-card.css">
<link rel="stylesheet" href="../../scripts/teachany-tts-narrator.css">
<link rel="stylesheet" href="../../scripts/teachany-section-hints.css">
<link rel="stylesheet" href="../../scripts/teachany-knowledge-graph.css">

<!-- before </body> -->
<script src="../../scripts/ai-tutor.js"></script>
<script src="../../scripts/teachany-tutor-card.js"></script>
<script src="../../scripts/teachany-tts-narrator.js"></script>
<script src="../../scripts/teachany-section-hints.js"></script>
<script src="../../scripts/teachany-knowledge-graph.js"></script>
```

Plus required HTML scaffolds:
- `<section id="ai-tutor-card">` placeholder
- `<section id="knowledge-graph">` placeholder
- `data-tsh` attributes on each main `<section>` (for section-hints)
- `data-tts` attributes on key paragraphs (for tts-narrator)

Use `python3 scripts/apply-standard-modules.py --only community/<course-id>` to batch-inject these.

**Verify in browser**:
```js
// Open courseware in browser, check console:
typeof window.TeachAnyTutor      // → "object"
typeof window.TTSNarrator         // → "object"
typeof window.SectionHints        // → "object"
typeof window.TeachAnyKnowledgeGraph  // → "object"
```

### ⑬ All 5 mounted simultaneously

⛔ Cannot mount 4 of 5 and call it "done". They work as a system — `tutor-card` references `ai-tutor` for backend logic, `tts-narrator` references `section-hints` for highlighting, etc.

### ⑭ Valid `manifest.json` with `node_id`

```json
{
  "node_id": "phy-m-light-refraction",
  "title": "...",
  "course_id": "phy-light-refraction",
  "subject": "physics",
  "grade": 8,
  "stage": "middle",
  "curriculum": "cn",
  "teachany_version": "7.9.13",
  "status": "community",
  "description": "...",
  "learning_objectives": ["...", "..."],
  "prerequisites": ["phy-m-light-propagation"],
  "leads_to": ["phy-m-lens-imaging"],
  "duration_min": 45,
  "topics": [...],
  "key_figures": [...]
}
```

⛔ `node_id` must exist in `data/trees/<curriculum>/<subject>.json`. Verify with `grep -r "phy-m-light-refraction" data/trees/`.

### ⑮ Top brand bar (TeachAny logo + Gallery link + version)

**What**: A pinned top row above or at top of the hero section, containing TeachAny identity + navigation + version.

**Why**: Students landing on a courseware URL need three things immediately — (a) what platform this is, (b) how to navigate to other lessons, (c) what version they're using (for bug reports / teacher coordination). A courseware without brand identity looks like a random web page, not a coordinated learning system.

**HTML pattern** (put BEFORE the hero `<section>`):
```html
<div class="teachany-brand-bar">
  <div class="brand-left">
    <a href="https://weponusa.github.io/teachany/" class="brand-logo" title="返回 TeachAny Gallery">
      <span class="brand-icon">🎓</span>
      <span class="brand-name">TeachAny</span>
    </a>
  </div>
  <div class="brand-right">
    <a href="https://weponusa.github.io/teachany/" class="brand-link">📚 Gallery</a>
    <span class="brand-version">v<span id="course-version-display">1.0.0</span></span>
  </div>
</div>
<style>
.teachany-brand-bar {
  position: sticky; top: 0; z-index: 1000;
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 20px;
  background: linear-gradient(90deg, #1A237E 0%, #4A148C 100%);
  color: white;
  font-size: 0.85em; font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.brand-logo { display: flex; align-items: center; gap: 6px; color: #fbbf24; text-decoration: none; font-weight: 700; }
.brand-logo:hover { color: white; }
.brand-icon { font-size: 1.2em; }
.brand-right { display: flex; gap: 16px; align-items: center; }
.brand-link { color: #ffcc80; text-decoration: none; }
.brand-link:hover { color: white; text-decoration: underline; }
.brand-version { color: #d1c4a3; font-family: monospace; font-size: 0.85em; }
</style>
<script>
// Auto-sync version from <meta name="course-version">
document.addEventListener('DOMContentLoaded', () => {
  const v = document.querySelector('meta[name="course-version"]')?.content;
  if (v) document.getElementById('course-version-display').textContent = v;
});
</script>
```

**Audit**:
```bash
grep -c 'teachany-brand-bar\|brand-logo' index.html  # Must be ≥ 1
```

### ⑯ Real map base for history/geography courseware

**What**: History and geography courseware need **real terrain + real borders**, not a stylized hand-drawn outline. Required assets:

```
assets/maps/
├── hillshade.jpg              # Terrain shading base layer (~300-800 KB)
├── boundaries.geojson         # Administrative borders (country/province-level)
├── places.geojson             # Cities, sites, named locations
└── overlays/                  # Optional event/era overlays
    ├── <era1>.geojson
    └── <era2>.geojson
```

**Why**: A hand-drawn SVG shape with colored dots looks like decoration, not geography. Students can't:
- See the terrain that shaped the history (mountains, rivers, coastlines)
- Scale/zoom to understand distance
- Overlay their own notes or time-layers

**HARD RULE**: If the courseware is hist-* or geo-*, the map section MUST use real base data. A decorative SVG map is insufficient — it violates baseline ⑯.

---

#### 📚 LIBRARY-FIRST PRINCIPLE (库优先原则)

**The skill ships with a complete map asset library at `~/.codebuddy/skills/teachany/assets/maps/`** — 207 files, 104 MB total:

| Category | Count | Coverage | Examples |
|:---|:---:|:---|:---|
| `physical/hillshade/` | 6 | Global terrain shading at 2K/4K (color + grayscale) | `global-color-hillshade-4k.jpg` |
| `physical/coastline/` | 2 | World + China coastlines | `ne_10m_coastline.json` |
| `physical/rivers/`, `lakes/` | 4 | World + China rivers and lakes | `ne_10m_rivers_china.json` |
| `physical/terrain-tiles/` | 147 | Pre-rendered terrain tiles (zoom 4-6) | `4/12/5.png` ... |
| `political/world/`, `china-modern/`, `admin-boundaries/` | 8 | Modern country/province/city boundaries | `countries.geojson`, `china-provinces.json` |
| `chrono-cn/` | 19 | Every Chinese dynasty (Qin → Qing, with year ranges) | `010-tang-dynasty.geojson`, `018-ming-dynasty.geojson` |
| `chrono-world/` | 21 | World maps from BCE 3000 to CE 2000 (key historical moments) | `014-ce-1492-age-of-discovery.geojson` |

**ALWAYS query the library FIRST** before generating new resources. Tooling:

```bash
# Default: show stats and library overview
python3 scripts/find-map.py

# Search by keyword (Chinese or English aliases supported)
python3 scripts/find-map.py 文艺复兴       # → ce-1492-age-of-discovery.geojson
python3 scripts/find-map.py 唐             # → 010-tang-dynasty.geojson
python3 scripts/find-map.py renaissance

# Search by historical era (returns map at year + neighbors)
python3 scripts/find-map.py --era 1500     # → 1300, 1492, 1600 maps

# Search by dynasty
python3 scripts/find-map.py --dynasty tang
python3 scripts/find-map.py --dynasty ming

# Search base layers
python3 scripts/find-map.py --base hillshade        # → 6 hillshade variants
python3 scripts/find-map.py --base coastline        # → coastline JSONs
python3 scripts/find-map.py --base terrain-tiles    # → 147 tiles

# Search administrative boundaries
python3 scripts/find-map.py --boundary country      # → world country borders
python3 scripts/find-map.py --boundary province     # → China province borders

# Copy a resource into courseware (no token cost, takes seconds)
python3 scripts/find-map.py --copy global-hillshade-4k.jpg ./community/<course-id>/assets/maps/
python3 scripts/find-map.py --copy 014-ce-1492-age-of-discovery.geojson ./community/<course-id>/assets/maps/

# List entire library
python3 scripts/find-map.py --list-all
```

**Decision flow**:

```
Need a map for the courseware
       ↓
[Step 1] python3 scripts/find-map.py <keyword>
       ↓
   ┌───┴────────┐
   │ Library hit?│
   └───┬────────┘
       │
   ┌───┴───┐                    ┌───────────┐
   │ YES   │                    │   NO      │
   ├───────┤                    ├───────────┤
   │ --copy│                    │ Try external sources:
   │ into  │                    │ • naturalearthdata.com
   │ course│                    │ • cshapes.sgendata.com
   │ ware  │                    │ • aourednik/historical-basemaps
   │       │                    │ Last resort: gdaldem hillshade
   │ DONE  │                    │ (and contribute back to library)
   └───────┘                    └───────────┘
```

⛔ **Anti-patterns** (immediate violation of ⑯):
- Calling `image_gen` to "generate a Europe terrain map" without first running `find-map.py --base hillshade` (the library has 6 variants ready)
- Hand-drawing GeoJSON polygons for a country boundary instead of `find-map.py --boundary country`
- Using a different hillshade for every history courseware → visual inconsistency across the gallery
- Deleting `~/.codebuddy/skills/teachany/assets/maps/` to "save space" → breaks 60+ downstream coursewares

✅ **Library-first benefits**:
- 0 token cost for terrain/boundary data (vs ~200K tokens for image_gen call)
- Visual consistency across all hist-*/geo-* coursewares
- Faster build (seconds to copy vs minutes to generate)
- Verified data quality (Natural Earth + CHGIS sources)

---

**Recommended implementation** (Leaflet + local tiles):

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<div id="map" style="height: 480px; border-radius: 12px;"></div>

<script>
const map = L.map('map').setView([46, 10], 5);  // Europe center

// Layer 1: Hillshade terrain (local, copied from library via find-map.py --copy)
L.imageOverlay('./assets/maps/hillshade.jpg', [[35, -10], [60, 30]]).addTo(map);

// Layer 2: Administrative boundaries (from chrono-world/ era map)
fetch('./assets/maps/boundaries.geojson').then(r => r.json()).then(geo => {
  L.geoJSON(geo, {
    style: { color: '#8B6F47', weight: 1.5, fillOpacity: 0.1 }
  }).addTo(map);
});

// Layer 3: City points with popups (manually curated places.geojson)
fetch('./assets/maps/places.geojson').then(r => r.json()).then(geo => {
  L.geoJSON(geo, {
    pointToLayer: (feat, latlng) => L.circleMarker(latlng, {
      radius: 8, fillColor: feat.properties.color || '#C62828',
      color: 'white', weight: 2, fillOpacity: 0.9
    }).bindPopup(`<h4>${feat.properties.name}</h4><p>${feat.properties.desc}</p>`)
  }).addTo(map);
});
</script>
```

**Sourcing — order of preference**:
1. **Library first** (`find-map.py`) — covers 90%+ of common cases
2. **Natural Earth** (`naturalearthdata.com`) — for modern administrative boundaries not yet in library
3. **CShapes** (`cshapes.sgendata.com`) — 19th-21st century historical borders
4. **historical-basemaps** (`github.com/aourednik/historical-basemaps`) — ancient/medieval
5. **Generate from SRTM DEM** (`gdaldem hillshade`) — only if all above fail; afterwards contribute to library

**Cities (`places.geojson`)** are usually courseware-specific, so manually curate (4-8 cities is enough for most history lessons). The library does not pre-store places.

**Minimum viable map for a history lesson** (e.g., Renaissance):
- `hillshade.jpg` (800 KB Europe 35°N-60°N terrain) — `find-map.py --copy global-color-hillshade-4k.jpg ./assets/maps/`
- `boundaries.geojson` with countries from that era — `find-map.py --copy 014-ce-1492-age-of-discovery.geojson ./assets/maps/boundaries.geojson`
- `places.geojson` with 4-8 key cities — manually write

**Audit**:
```bash
# Check the three required files exist
ls assets/maps/hillshade.jpg assets/maps/boundaries.geojson assets/maps/places.geojson 2>&1
# All three must exist. 0 outputs or "No such file" = baseline ⑯ violation.

# Check Leaflet is loaded (vs pure <svg>)
grep -c 'leaflet' index.html  # Must be ≥ 1 for hist-*/geo-*

# Check files came from library (not generated): file size should match library
ls -lh assets/maps/hillshade.jpg
# global-color-hillshade-4k.jpg from library ≈ 836 KB
# global-hillshade-4k.jpg from library ≈ 586 KB
# Anything wildly different → suspect re-generation
```

⛔ **Hand-drawn SVG outline without terrain** = violation of ⑯, regardless of how pretty it looks. Decoration ≠ geography. This rule is strict because students' spatial reasoning depends on seeing real topography.

⛔ **Bypassing `find-map.py` and generating fresh hillshade/boundaries** = violation of the library-first principle. The library exists for reuse.

---

## 🚨 The 5 Red Lines (Rigor Discipline)

These prevent the most common AI failure modes. Apply throughout the work, not just at the end.

### Red Line 1 · Closed-loop verification

Before claiming "done/fixed/should work", **run the actual command and paste the output**. No output = no completion.

| ❌ Bad | ✅ Good |
|:---|:---|
| "I've added the TTS files, should be working now." | "Generated `s01.mp3` ~ `s09.mp3`. `ls tts/` shows: ..." |
| "The hero image is fixed." | `python3 scripts/find-hero.py phy-light-refraction` → output: `✅ CDN: https://cdn...png` |

### Red Line 2 · Evidence-driven attribution

Before saying "the bug is probably X", **verify with a tool** (curl/grep/read_file/console.log/ffprobe). Untested guesses waste user time.

❌ "It's probably a CORS issue" (without curl)  
✅ "`curl -I https://...` returned `Access-Control-Allow-Origin: *`, so CORS is fine — the issue must be elsewhere."

### Red Line 3 · Exhaust before giving up

Before saying "I can't fix this", complete all 5 steps:

1. **Sniff** — list every approach you've tried, find the common pattern
2. **Pull hair** — search official docs, read source code context, reverse the assumption
3. **Mirror** — am I going in circles?
4. **Fundamentally different approach** — switch from API → server, streaming → non-streaming, header → body
5. **Post-mortem** — what would I do differently?

### Red Line 4 · 2 failures → switch fundamentally

If two attempts on the **same parameter/header/model** fail, stop tweaking that one. Switch to a different approach.

❌ Tweak `reasoning.max_tokens` from 32k → 64k → 128k (still failing)  
✅ Read OpenRouter docs → discover the model needs a different `model` ID, not a tokens setting.

### Red Line 5 · Sweep sibling issues

Fix one bug → check for the same pattern across all related files. **One issue in, one class of issues out.**

| Found | Sweep |
|:---|:---|
| Header `X-OpenRouter-Title` Chinese-character bug | Audit all headers, API keys, URLs |
| One courseware's `ai-tutor.js` broken | Batch-check all 313 courseware |
| SSE parsing bug in streaming branch | Verify the non-streaming branch too |

---

## 🔨 The 8 Anti-Shortcut Rules (Anti-Hollow-Implementation)

### Rule 1 · Frame-level information density (Anti-Blob)

Every Remotion video frame must answer: "What subject information is the student seeing?"

```bash
# Sample 10 frames, check each has visible text/labels/diagrams
for i in {1..10}; do ffmpeg -i video.mp4 -ss $i -vframes 1 frame_$i.png; done
```

### Rule 2 · Audio module must self-explain

The audio player section must show what each track teaches, not just "Track 1, Track 2".

### Rule 3 · No-static-canvas

Canvas with no real computation (just animation loop) violates this. Every Canvas must compute something a student can vary.

### Rule 4 · No-generic-art

Every AI image must show subject content. Generic landscapes, abstract patterns, or corporate stock-photo styles fail.

### Rule 5 · Anti-Lorem (no placeholders in published)

```bash
grep -riE "(lorem ipsum|placeholder|TODO|FIXME|示例文本|待替换|xxx|TBD)" community/<course-id>/index.html
# Output must be empty before publishing
```

### Rule 6 · "Cover the code" UI test

Cover all source code, look only at the rendered courseware. Can a student answer "what is this lesson teaching me?" within 5 seconds? If not, the courseware is decorative, not educational.

### Rule 7 · Map-exposition spatial binding

History/geography exposition must reference specific map regions. "The Han Dynasty unified China" without a map is wrong; "Han controlled all 13 commanderies highlighted in red" is right.

### Rule 8 · Single-narrative-line

A 45-min lesson has ONE story. Branching into "but also" / "by the way" / "additionally" creates cognitive overload. Save tangents for "deep dive" cards.

---

## 🌳 Adaptive Learning — 4-Branch Hard Rules

Every courseware MUST support 4 differentiated learning paths through `TeachAnyAdaptive.decideBranch()`. This is **not optional decoration** — adaptive learning is the core mechanism that lets one courseware serve students with vastly different prerequisite mastery.

### The 4 branches

| Branch | Trigger condition | Required content (NOT just a toast) |
|:---|:---|:---|
| `review-prereq` | `prereq_mastery < 0.5` | Embed ≤60s prerequisite review card + link to prereq courseware. **Always** include a "continue learning" button — never lock the student out. |
| `scaffold` | `current_mastery < 0.3` | Insert worked-example walkthrough + lower-Bloom (remember/understand) fill-in-the-blank exercises. Different content from `normal`. |
| `normal` | default | Standard sections, normal pace, 3-level exercises |
| `challenge` | `current_mastery ≥ 0.8` | Skip basic explanation, jump to extension cards (analyze/evaluate Bloom levels). Often unlocks a higher-grade preview. |

### Hard rules

- ⛔ **Writing only `normal` branch is failure**. The other 3 must have actual differentiated content. Toast messages alone don't count.
- ⛔ **`decideBranch()` must be called at ≥2 trigger points** in the courseware (e.g., after pre-test, after mid-lesson check). Single trigger = adaptive design failure.
- ⛔ **Branch content must be substantively different** — same exercises with different intro text doesn't count. `scaffold` should add worked examples; `challenge` should remove basic walkthroughs.
- ⛔ Never lock a student out (`review-prereq` must always offer a "skip and continue" button)

For the runtime API (how to call decideBranch / updateMastery / branch lifecycle), read `frontend-runtime.md`.

---

## 🔬 Inquiry-Based Learning Hard Rules

When the lesson topic involves "discovery", "model-building", or "experimentation" (most science topics, many humanities ones), use inquiry structure. The 6-step pattern below is mandatory:

1. **Situated question** — pose a real-world problem; have students fill a "prediction card" before starting
2. **Form hypotheses** — give 2-3 candidate hypotheses to choose from (or have students propose)
3. **Design verification** — explicit control-variable trio: variable / constant / measurement
4. **Collect evidence** — interactive simulation (PhET embed or self-built Canvas) + data table for student input
5. **Analyze conclusions** — compare prediction vs measured. **Cognitive conflict moment is required** — students must encounter their own misprediction; this is where learning sticks.
6. **Reflect & transfer** — pose extension question ("what if [X]?"), connect to next courseware

Hard rules:
- ⛔ Skipping the prediction card = no cognitive conflict = no real inquiry
- ⛔ Using PhET online tile services as the only fallback (must have local offline package in `assets/phet/`)
- ⛔ Inquiry without a Canvas/iframe interactive — pure narration is not inquiry

---

## 📋 Adaptive + Inquiry Verification (in browser console)

```js
// 1. decideBranch trigger points — must be ≥2
console.log('decideBranch calls:', document.body.innerHTML.match(/decideBranch/g)?.length || 0);

// 2. All 4 branch contents exist (search for branch markers in source)
['review-prereq', 'scaffold', 'normal', 'challenge'].forEach(b => {
  const found = document.body.innerHTML.includes(`branch="${b}"`) ||
                document.body.innerHTML.includes(`data-branch="${b}"`);
  console.log(`Branch "${b}":`, found ? '✅' : '❌ MISSING');
});

// 3. Inquiry prediction card (if applicable)
const hasPrediction = document.querySelector('[data-inquiry="prediction"]');
console.log('Prediction card:', hasPrediction ? '✅' : '⚠️ none (OK if non-inquiry lesson)');
```

---

## 🇨🇳 Chinese Term Glossary (中英术语对照)

For Chinese-speaking AI sessions, here are the canonical term mappings used throughout TeachAny:

| 英文 (English) | 中文 (Chinese) | Where to find |
|:---|:---|:---|
| 14-item baseline | 14 项基线 / 14 件套 | This file (above) |
| Five-piece suite | 五件套 | This file, items ⑧–⑫ |
| Five red lines | 五条红线 / 严谨度铁律 | `SKILL.md` § "Five red lines" |
| Closed-loop verification | 闭环验证 | Red Line 1 |
| Evidence-driven | 事实驱动 | Red Line 2 |
| Exhaust before giving up | 穷尽一切 | Red Line 3 |
| 2 failures → switch | 失败 2 次必换方案 | Red Line 4 |
| Sweep sibling issues | 修一类问题 / 一个问题进来一类问题出去 | Red Line 5 |
| Anti-shortcut rules | 反偷懒铁律 / 八条硬杠 | Above Anti-Shortcut Rules section |
| Anti-Blob rule | 视频帧级信息密度 | Rule 1 |
| Anti-Lorem rule | 占位词清查 / 不留 TODO | Rule 5 |
| Cover the code test | 遮住代码只看 UI 测试法 | Rule 6 |
| Map-exposition binding | 地图与讲解空间锚定 | Rule 7 |
| Single-narrative-line | 单线叙事 / 一节课一个故事 | Rule 8 |
| 4 branches (adaptive) | 4 路分支 / 自适应四路 | Adaptive section above |
| `review-prereq` | 复习前置 | Adaptive section |
| `scaffold` | 脚手架支架 | Adaptive section |
| `challenge` | 挑战路径 | Adaptive section |
| Hero infographic | Hero 图 / 知识结构信息图 | `media-pipeline.md` |
| TTS narration | TTS 旁白 / 朗读音频 | Item ① |
| Remotion video | Remotion 视频 / 动画 | Item ② |
| AI tutor card | AI 学伴 / AI 导师卡片 | Item ⑧ |
| Knowledge graph | 知识图谱 | Item ⑦ |
| Section hints | 段落提示 | Item ⑨ |
| AI illustrations | AI 插画 / 学科插图 | Item ④ |
| Quality gate | 质量门 / 完整性门 | `validate-courseware.cjs` |
| Inquiry 6-step | 探究 6 步 | Inquiry section above |
| Cognitive conflict | 认知冲突时刻 | Inquiry step 5 |
| Other Knowledge tree | 其他知识树 / free_mode | `workflow.md` Phase 0.5 |
| ext-* courseware | 学习路径推荐课件 | `workflow.md` Phase 0.5 |
| Five-lens method | 五镜法 (See / Break / Compare / Transfer / Evaluate) | `subject-adapters.md` |
| ConcepTest | 概念检测题 / 同伴讨论触发器 | `instructional-design.md` |
| Peer instruction | 同伴教学法 / 同伴讨论 | `instructional-design.md` |
| ABT narrative | ABT 叙事 (And-But-Therefore) | `instructional-design.md` |

---

## See also
- `../RULES.md` — Full 57 hard rules with violation examples
- `workflow.md` — Phase-by-phase application of these rules
- `media-pipeline.md` — Hero / TTS / Remotion specifics
- `frontend-runtime.md` — Runtime API for adaptive branching
- `instructional-design.md` — Theory behind 4 branches and inquiry 6-step
