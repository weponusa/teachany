#!/usr/bin/env python3
# Generate IB Periodic Table courseware HTML

html = open('index.html', 'w', encoding='utf-8')

head = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Periodic Table and Periodic Trends · IB DP Chemistry</title>
  <!-- ⭐ v5.34 强制：AI 学伴样式（公共资源，打包时随 .teachany 分发） -->
  <link rel="stylesheet" href="./ai-tutor.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--surface:#161b22;--surface2:#21262d;--border:#30363d;--text:#e6edf3;--text2:#8b949e;--accent:#58a6ff;--accent2:#3fb950;--hl:#f0883e;--hl2:#a371f7;--danger:#f85149;--r1:rgba(88,166,255,.15);--r2:rgba(63,185,80,.15);--r3:rgba(240,136,62,.15);--r4:rgba(163,113,247,.15)}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
sub,sup{font-size:.7em}
.slide{display:none;min-height:100vh;padding:2rem;max-width:1100px;margin:0 auto}
.slide.active{display:block;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.slide-num{font-size:.75rem;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.25rem}
h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;line-height:1.15;letter-spacing:-.03em;margin-bottom:.75rem}
h2{font-size:clamp(1.3rem,2.5vw,1.7rem);font-weight:700;letter-spacing:-.02em;margin-bottom:.5rem}
h3{font-size:1.1rem;font-weight:600;margin-bottom:.4rem;color:var(--accent)}
.lead{font-size:1.15rem;color:var(--text2);max-width:68ch;margin-bottom:1.5rem}
.phase-tag{display:inline-block;font-size:.7rem;padding:.2rem .6rem;border-radius:99px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:.75rem}
.ph1{background:rgba(88,166,255,.18);color:var(--accent)}.ph2{background:rgba(63,185,80,.18);color:var(--accent2)}.ph3{background:rgba(240,136,62,.18);color:var(--hl)}.ph4{background:rgba(163,113,247,.18);color:var(--hl2)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;margin-bottom:1rem}
.card h3{margin-top:0}
.tag{display:inline-block;font-size:.7rem;padding:.15rem .5rem;border-radius:6px;background:var(--surface2);border:1px solid var(--border);margin:2px}
.tag.hl{background:var(--r3);border-color:var(--hl);color:var(--hl)}.tag.ok{background:var(--r2);border-color:var(--accent2);color:var(--accent2)}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
.pt-wrap{overflow-x:auto;padding:1rem 0}
.pt{display:grid;grid-template-columns:repeat(18,minmax(36px,1fr));gap:2px;width:100%;min-width:750px;font-size:.62rem}
.pt-cell{aspect-ratio:1;min-width:36px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;position:relative;padding:1px}
.pt-cell:hover{transform:scale(1.25);z-index:10;border-color:var(--accent);box-shadow:0 4px 16px rgba(0,0,0,.5)}
.pt-cell.active{border-color:var(--hl);background:rgba(240,136,62,.2)}
.pt-cell .num{font-size:.5rem;color:var(--text2);position:absolute;top:1px;right:2px}
.pt-cell .sym{font-size:.85rem;font-weight:700}
.pt-cell .name{font-size:.45rem;color:var(--text2);text-align:center;line-height:1.1;margin-top:1px}
.pt-cell.empty{background:transparent;border-color:transparent;cursor:default}.pt-cell.empty:hover{transform:none;box-shadow:none}
#tt{position:fixed;pointer-events:none;z-index:999;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem;min-width:160px;display:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}
#tt.vis{display:block}#tt h4{font-size:1rem;margin-bottom:.25rem}
#tt .tt-row{display:flex;justify-content:space-between;font-size:.78rem;padding:.1rem 0;color:var(--text2)}
#tt .tt-row span:last-child{color:var(--text);font-weight:500}
.trend-arrow{display:inline-flex;align-items:center;gap:.3rem;font-size:.82rem;padding:.25rem .6rem;border-radius:6px;margin:.15rem}
.trend-arrow.up{background:var(--r2);color:var(--accent2)}
.trend-arrow.down{background:var(--r3);color:var(--hl)}
.trend-arrow.flat{background:var(--surface2);color:var(--text2)}
.mod-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;cursor:pointer;transition:all .2s}
.mod-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 4px 16px rgba(88,166,255,.1)}
.mod-card h3{color:var(--accent)}
.mod-badge{font-size:.7rem;padding:.15rem .5rem;border-radius:99px;display:inline-block;margin-bottom:.5rem}
.mb1{background:var(--r1);color:var(--accent)}.mb2{background:var(--r2);color:var(--accent2)}.mb3{background:var(--r3);color:var(--hl)}.mb4{background:var(--r4);color:var(--hl2)}
.ctable{width:100%;border-collapse:collapse;font-size:.82rem;margin:1rem 0}
.ctable th,.ctable td{padding:.55rem .75rem;border:1px solid var(--border);text-align:center}
.ctable th{background:var(--surface2);font-weight:600;font-size:.75rem;color:var(--accent)}
.ctable tr:hover td{background:rgba(88,166,255,.05)}
.mcq{margin-bottom:1rem}
.mcq-q{font-size:.95rem;font-weight:600;margin-bottom:.75rem;padding:.75rem;background:var(--surface2);border-radius:8px}
.mcq-opts{display:grid;gap:.4rem}
.mcq-opt{padding:.6rem .75rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all .15s;font-size:.88rem}
.mcq-opt:hover{border-color:var(--accent);background:rgba(88,166,255,.05)}
.mcq-opt.correct{border-color:var(--accent2);background:var(--r2);color:var(--accent2)}
.mcq-opt.wrong{border-color:var(--danger);background:rgba(248,81,73,.12);color:var(--danger)}
.mcq-opttxt{display:grid;grid-template-columns:28px 1fr;gap:.4rem;align-items:center}
.mcq-letter{width:28px;height:28px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem;flex-shrink:0}
.essay-box{background:var(--surface2);border-left:3px solid var(--hl);border-radius:0 8px 8px 0;padding:1rem 1.25rem;font-size:.88rem}
.essay-box h4{color:var(--hl);margin-bottom:.4rem;font-size:.9rem}
.essay-box .ib-marks{font-size:.75rem;color:var(--text2);margin-bottom:.6rem}
.cflow{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin:.75rem 0;font-size:.85rem}
.cflow-node{padding:.35rem .75rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px}
.cflow-arrow{color:var(--text2);font-size:.9rem}
.zeff-viz{position:relative;height:120px;background:linear-gradient(90deg,var(--surface2),var(--surface));border-radius:10px;overflow:hidden;margin:1rem 0;display:flex;align-items:center;justify-content:center}
.zeff-viz .nucleus{width:40px;height:40px;background:radial-gradient(circle,var(--danger) 30%,var(--hl) 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.7rem;box-shadow:0 0 20px rgba(248,81,73,.5);position:relative;z-index:2}
.zeff-viz .e-ring{position:absolute;border:1.5px solid var(--accent);border-radius:50%;opacity:.4}
.zeff-viz .e-ring.r1{width:80px;height:80px}.zeff-viz .e-ring.r2{width:120px;height:120px}.zeff-viz .e-ring.r3{width:170px;height:170px}
.zeff-viz .shield{position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(88,166,255,.03);border:1px dashed rgba(88,166,255,.15)}
.iaq{padding:1rem;background:var(--surface2);border-radius:10px;margin:1rem 0}
.iaq .iaq-prompt{font-size:.92rem;margin-bottom:.75rem;padding:.6rem;background:rgba(88,166,255,.08);border-radius:6px}
.iaq textarea{width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:.6rem;font-size:.85rem;resize:vertical;font-family:inherit}
.iaq textarea:focus{outline:none;border-color:var(--accent)}
.zbox{background:rgba(240,136,62,.1);border:1px solid var(--hl);border-radius:8px;padding:.75rem 1.25rem;display:inline-block;font-family:'Courier New',monospace;font-size:1.05rem;margin:.5rem 0}
.varZ{color:var(--hl);font-weight:700}.varS{color:var(--accent);font-weight:700}
.abt-card{background:linear-gradient(135deg,rgba(88,166,255,.08),rgba(163,113,247,.08));border:1px solid var(--border);border-radius:14px;padding:1.5rem;margin:1.5rem 0;font-size:1.05rem;line-height:1.75}
.abt-but{background:var(--text);color:var(--bg);border:none;padding:.5rem 1.25rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:.88rem;margin-top:.75rem}
.hint-panel{background:rgba(163,113,247,.08);border:1px solid var(--hl2);border-radius:8px;padding:1rem;margin:.75rem 0;font-size:.88rem}
.hint-panel h4{color:var(--hl2);margin-bottom:.4rem;font-size:.85rem}
.lo-card{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:0 8px 8px 0;padding:.75rem 1rem;margin:.5rem 0;font-size:.88rem;display:flex;align-items:flex-start;gap:.6rem}
.lo-card .lo-num{background:var(--r1);color:var(--accent);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0}
/* AI Tutor styles moved to ./ai-tutor.css */
.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--border);z-index:100}
.nav-logo{font-weight:800;font-size:1rem;letter-spacing:-.02em}
.nav-meta{font-size:.75rem;color:var(--text2)}
.nav-btn{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:.4rem 1rem;border-radius:7px;cursor:pointer;font-size:.82rem;font-weight:600}
.nav-btn:hover{border-color:var(--accent);color:var(--accent)}
.nav-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.nav-btn:disabled{opacity:.35;cursor:not-allowed}
.prog-dots{display:flex;gap:.35rem;justify-content:center;margin:1rem 0}
.prog-dot{width:7px;height:7px;border-radius:50%;background:var(--border);transition:all .2s}
.prog-dot.done{background:var(--accent2)}.prog-dot.active{background:var(--accent);width:20px;border-radius:4px}
.rule{height:1px;background:var(--border);margin:1.5rem 0}
.f-center{text-align:center}.mt1{margin-top:1rem}.mt15{margin-top:1.5rem}.mb1{margin-bottom:1rem}
.flex{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
.badge-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.bd1{background:var(--accent)}.bd2{background:var(--accent2)}.bd3{background:var(--hl)}.bd4{background:var(--hl2)}
.text-sm{font-size:.82rem;color:var(--text2)}
</style>
</head>
<body>
<nav class="nav">
  <div><span class="nav-logo">TeachAny</span><span style="color:var(--text2);font-size:.75rem;margin-left:.5rem">IB DP Chemistry · Structure 3</span></div>
  <div class="nav-meta">Periodic Table &amp; Trends · Grade 11-12 SL/HL</div>
  <button class="nav-btn primary" id="nextBtn" onclick="nextSlide()">Next →</button>
</nav>
"""

slides = []

# SLIDE 0: HOOK
slides.append("""
<div class="slide active" id="s0">
  <div class="slide-num">Opening Hook</div>
  <h1>Periodic Table &amp; Periodic Trends</h1>
  <p class="lead">Why does fluorine (F) steal electrons while francium (Fr) gives them away — even though both sit on opposite edges of the same table?</p>
  <div class="abt-card">
    <p>Chemists spent centuries arranging elements by weight, until someone noticed a pattern buried in the numbers. <strong>And then everything clicked.</strong> This unit unlocks the logic inside the periodic table — so you can <em>predict</em> chemical behaviour instead of memorizing it.</p>
    <button class="abt-but" onclick="nextSlide()">Begin the Journey →</button>
  </div>
  <div class="grid3 mt15">
    <div class="card"><h3>What You'll Master</h3>
      <ul style="font-size:.85rem;list-style:none;margin-top:.5rem">
        <li>✓ Explain 5 periodic trends using electron structure</li>
        <li>✓ Predict chemical properties from position</li>
        <li>✓ Distinguish IE₁ from successive ionization energies</li>
        <li>✓ Connect Z_eff theory to real element behaviour</li>
      </ul>
    </div>
    <div class="card"><h3>IB Curriculum</h3>
      <div class="text-sm" style="margin-top:.4rem">
        <div><span class="badge-dot bd1"></span>&nbsp;Structure 3.1 — Periodic Table</div>
        <div><span class="badge-dot bd2"></span>&nbsp;Structure 3.2 — Periodic Trends</div>
        <div><span class="badge-dot bd3"></span>&nbsp;Structure 3.3 — Period 3 oxides</div>
        <div style="margin-top:.5rem;font-size:.75rem;color:var(--text2)">IB DP Chemistry SL/HL · Grade 11-12</div>
      </div>
    </div>
    <div class="card"><h3>Assessment Preview</h3>
      <div class="text-sm" style="margin-top:.4rem">
        <div>📝 Paper 1 &amp; 2 Short Response</div>
        <div>📝 Data-Based Questions (DBQ)</div>
        <div>✍️ 6-mark explain-predict questions</div>
        <div style="margin-top:.5rem;font-size:.75rem;color:var(--text2)">Criteria A &amp; C practice</div>
      </div>
    </div>
  </div>
  <div class="prog-dots"><div class="prog-dot active"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 1: INTERACTIVE PERIODIC TABLE
slides.append("""
<div class="slide" id="s1">
  <div class="slide-num">Phase 1 · Explore</div>
  <span class="phase-tag ph1">Phenomenon First</span>
  <h2>The Periodic Table — Your Navigation Map</h2>
  <p class="lead">Hover over any element. Click to lock it. Then explore the patterns yourself.</p>
  <div class="pt-wrap"><div class="pt" id="ptGrid"></div></div>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem;font-size:.72rem;color:var(--text2)">
    <span class="tag">alkali metal</span>
    <span class="tag" style="background:rgba(63,185,80,.15);border-color:var(--accent2);color:var(--accent2)">alkaline earth</span>
    <span class="tag" style="background:rgba(88,166,255,.15);border-color:var(--accent);color:var(--accent)">transition metal</span>
    <span class="tag" style="background:rgba(240,136,62,.15);border-color:var(--hl);color:var(--hl)">halogen</span>
    <span class="tag" style="background:rgba(248,81,73,.15);border-color:var(--danger);color:var(--danger)">noble gas</span>
    <span class="tag" style="background:rgba(163,113,247,.15);border-color:var(--hl2);color:var(--hl2)">lanthanide/actinide</span>
    <span class="tag" style="background:rgba(210,180,140,.1);border-color:#d4a017;color:#d4a017">metalloid</span>
  </div>
  <div class="rule"></div>
  <h3>🧭 Your Exploration Tasks</h3>
  <div class="grid2">
    <div class="iaq">
      <div class="iaq-prompt">Task A: Locate Na (group 1, period 3) and Mg (group 2, period 3). Which has a larger atomic radius? Why?</div>
      <textarea placeholder="Write your hypothesis here..." id="iaq1"></textarea>
    </div>
    <div class="iaq">
      <div class="iaq-prompt">Task B: Find F (group 17) and Cl (group 17). Which has higher electronegativity? What does this tell you about electron pull?</div>
      <textarea placeholder="Write your hypothesis here..." id="iaq2"></textarea>
    </div>
  </div>
  <div class="hint-panel">
    <h4>💡 Need a starting point?</h4>
    <p>Think about two competing forces: the <strong>positive pull</strong> of the nucleus and the <strong>shielding effect</strong> of inner electrons. How do these change across a period? Down a group?</p>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot active"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 2: Z_eFF THEORY
slides.append("""
<div class="slide" id="s2">
  <div class="slide-num">Phase 2 · Explain</div>
  <span class="phase-tag ph2">Causal Mechanism</span>
  <h2>The Invisible Force: Effective Nuclear Charge (Z<sub>eff</sub>)</h2>
  <div class="grid2">
    <div>
      <p class="lead">Across a period, electrons fill the same outer shell while the nucleus gains protons. Result: <strong>Z<sub>eff</sub> increases</strong> — outer electrons feel stronger net positive pull.</p>
      <div class="card" style="margin-top:1rem">
        <h3>The Shielding Problem</h3>
        <p style="font-size:.88rem;margin-top:.4rem">Inner electrons partially <em>shield</em> outer electrons from nuclear charge. That's why Z<sub>eff</sub> ≠ Z (actual protons).</p>
        <div class="zbox">
          Z<sub>eff</sub> = <span class="varZ">Z</span> − <span class="varS">S</span>
        </div>
        <p class="text-sm" style="margin-top:.5rem"><span class="varZ">Z</span> = nuclear charge (protons)<br><span class="varS">S</span> = shielding constant (inner electrons)</p>
      </div>
      <div class="card">
        <h3>Z<sub>eff</sub> Trends</h3>
        <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem">
          <div class="trend-arrow up">Across a period (L→R): <strong>Z<sub>eff</sub> ↑</strong> — same shell, more protons</div>
          <div class="trend-arrow down">Down a group (top→bottom): <strong>Z<sub>eff</sub> ↓</strong> — new shell adds shielding</div>
        </div>
      </div>
    </div>
    <div>
      <div class="zeff-viz">
        <div class="shield"></div>
        <div class="e-ring r1"></div>
        <div class="e-ring r2"></div>
        <div class="e-ring r3"></div>
        <div class="nucleus" id="nucleus">+Z</div>
      </div>
      <p class="text-sm" style="text-align:center;margin-top:.5rem">Nuclear charge increases left → right. Shielding from inner shells stays roughly constant across a period.</p>
      <div class="card" style="margin-top:1rem">
        <h3>Check Your Understanding</h3>
        <div class="mcq" data-correct="1">
          <div class="mcq-q">Why does Z<sub>eff</sub> increase across Period 3 (Na → Cl)?</div>
          <div class="mcq-opts">
            <div class="mcq-opt" onclick="checkMCQ(this,0)"><div class="mcq-opttxt"><span class="mcq-letter">A</span><span>Number of electron shells increases</span></div></div>
            <div class="mcq-opt" onclick="checkMCQ(this,1)"><div class="mcq-opttxt"><span class="mcq-letter">B</span><span>Nuclear charge increases while shielding stays roughly constant</span></div></div>
            <div class="mcq-opt" onclick="checkMCQ(this,2)"><div class="mcq-opttxt"><span class="mcq-letter">C</span><span>Electronegativity decreases</span></div></div>
            <div class="mcq-opt" onclick="checkMCQ(this,3)"><div class="mcq-opttxt"><span class="mcq-letter">D</span><span>Atomic radius increases</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot active"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 3: TREND 1 — ATOMIC RADIUS
slides.append("""
<div class="slide" id="s3">
  <div class="slide-num">Phase 2 · Trend 1</div>
  <span class="phase-tag ph2">Periodic Trend</span>
  <h2>Trend 1: Atomic Radius</h2>
  <div class="grid2">
    <div>
      <div class="card"><h3>Definition</h3>
        <p style="font-size:.9rem"><strong>Atomic radius</strong> = half the distance between two identical nuclei in a bonded diatomic molecule (covalent radius). For metals, use metallic radius.</p>
      </div>
      <div class="card"><h3>Trends</h3>
        <table class="ctable">
          <thead><tr><th></th><th>Direction</th><th>Primary Reason</th></tr></thead>
          <tbody>
            <tr><th>Across Period (L→R)</th><td><span class="trend-arrow down">decreases</span></td><td>Z<sub>eff</sub> ↑, electrons pulled closer</td></tr>
            <tr><th>Down Group (top→bottom)</th><td><span class="trend-arrow up">increases</span></td><td>New electron shell added</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card"><h3>Data Reference — Period 3 (pm)</h3>
        <table class="ctable" style="font-size:.78rem">
          <thead><tr><th>Na</th><th>Mg</th><th>Al</th><th>Si</th><th>P</th><th>S</th><th>Cl</th><th>Ar*</th></tr></thead>
          <tbody><tr><td>186</td><td>160</td><td>143</td><td>117</td><td>110</td><td>104</td><td>99</td><td>71</td></tr></tbody>
        </table>
        <p class="text-sm" style="margin-top:.3rem">*Ar is a noble gas — different measurement method</p>
      </div>
    </div>
    <div>
      <div class="card" style="background:var(--r2)"><h3 style="color:var(--accent2)">✓ The Covalent Radius Pattern</h3>
        <p style="font-size:.88rem;margin-top:.4rem">When two Cl atoms bond, each "claims" half the bond distance. So atomic radius ≈ half the bond length.</p>
        <div class="cflow mt1">
          <span class="cflow-node">Na (186 pm)</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Mg (160 pm)</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Al (143 pm)</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Si (117 pm)</span>
        </div>
        <p class="text-sm" style="margin-top:.4rem">Z<sub>eff</sub> on outer electrons: 2.50 → 3.00 → 3.50 → 4.05 → ... → 6.50</p>
      </div>
      <div class="card"><h3>Exceptional Case — Group 13 (Ga anomaly)</h3>
        <p style="font-size:.85rem;margin-top:.4rem">Ga (Period 4) breaks the smooth trend. Why? The 3d orbital is filled between Al and Ga — poor shielding from d-electrons means Z<sub>eff</sub> on 4p electrons is slightly higher than expected.</p>
      </div>
      <div class="essay-box">
        <h4>✍️ IB Short-Answer Practice</h4>
        <div class="ib-marks">Question 1 · 2 marks · IB Chemistry SL/HL</div>
        <p style="font-size:.85rem">Explain why the atomic radius of potassium (K) is larger than that of sodium (Na).</p>
        <div class="hint-panel">
          <h4>💡 Hint</h4>
          <p style="font-size:.82rem">Consider: shells added? Z<sub>eff</sub> on outer electrons? Which factor dominates when going <em>down</em> a group?</p>
        </div>
      </div>
    </div>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot active"></div><div class="prog-dot"></div><div class="prog-dot"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 4: TREND 2 — IONIZATION ENERGY
slides.append("""
<div class="slide" id="s4">
  <div class="slide-num">Phase 2 · Trend 2</div>
  <span class="phase-tag ph2">Periodic Trend</span>
  <h2>Trend 2: Ionization Energy (IE)</h2>
  <div class="grid2">
    <div>
      <div class="card"><h3>Definition</h3>
        <p style="font-size:.9rem"><strong>First ionization energy (IE₁)</strong> = energy required to remove one mole of electrons from one mole of gaseous atoms:</p>
        <div class="zbox" style="font-size:.9rem;margin-top:.5rem;display:block;text-align:center">
          Na(g) → Na<sup>+</sup>(g) + e<sup>−</sup> ΔH = +496 kJ mol<sup>−1</sup>
        </div>
        <p class="text-sm" style="margin-top:.4rem"><strong>Second ionization energy (IE₂)</strong> = energy to remove a <em>second</em> electron from the ion. IE₂ &gt; IE₁ always.</p>
      </div>
      <div class="card"><h3>Trends</h3>
        <table class="ctable">
          <thead><tr><th></th><th>Direction</th><th>Reason</th></tr></thead>
          <tbody>
            <tr><th>Across Period</th><td><span class="trend-arrow up">increases</span></td><td>Z<sub>eff</sub> ↑, electrons harder to remove</td></tr>
            <tr><th>Down Group</th><td><span class="trend-arrow down">decreases</span></td><td>New shell ↑, Z<sub>eff</sub> on outer e⁻ ↓</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card"><h3>Key Data — Period 3 (kJ mol⁻¹)</h3>
        <table class="ctable" style="font-size:.78rem">
          <thead><tr><th>Na</th><th>Mg</th><th>Al</th><th>Si</th><th>P</th><th>S</th><th>Cl</th><th>Br</th><th>Kr*</th></tr></thead>
          <tbody><tr><td>496</td><td>738</td><td>578</td><td>786</td><td>1012</td><td>1005</td><td>1251</td><td>1140</td><td>1351</td></tr></tbody>
        </table>
        <p class="text-sm" style="margin-top:.3rem">Small dips at Al (3p¹ vs 3s²) and S (3p⁴ vs 3p³): e⁻-e⁻ repulsion in same subshell slightly lowers IE.</p>
      </div>
    </div>
    <div>
      <div class="card" style="border-left:3px solid var(--hl)"><h3 style="color:var(--hl)">⚡ The Al / P Anomaly Explained</h3>
        <p style="font-size:.85rem;margin-top:.4rem">Al (Group 13): IE₁ = <strong>578</strong> kJ mol⁻¹<br>Mg (Group 2): IE₁ = <strong>738</strong> kJ mol⁻¹</p>
        <p style="font-size:.85rem;margin-top:.5rem">Why is Al <em>easier</em> to ionize than Mg?</p>
        <div class="cflow mt1" style="font-size:.78rem">
          <span class="cflow-node">Mg: 1s²2s²2p⁶3s²<br><small>Full s-subshell — very stable</small></span>
        </div>
        <div class="cflow" style="font-size:.78rem">
          <span class="cflow-node">Al: 1s²2s²2p⁶3s²3p¹<br><small>3p¹ electron — further from nucleus, less tightly held</small></span>
        </div>
      </div>
      <div class="card" style="border-left:3px solid var(--hl2)"><h3 style="color:var(--hl2)">🎯 IB Command Term: "Explain"</h3>
        <p style="font-size:.85rem;margin-top:.4rem">When IB asks you to <strong>explain</strong> a trend, you must give:</p>
        <ol style="font-size:.83rem;margin-left:1.2rem;margin-top:.4rem">
          <li>✓ The <em>direction</em> of the trend</li>
          <li>✓ The <em>underlying cause</em> (Z<sub>eff</sub> or shielding)</li>
          <li>✓ Reference to <em>specific data</em> values</li>
        </ol>
      </div>
      <div class="mcq" data-correct="2">
        <div class="mcq-q">Which element has the HIGHEST first ionization energy in Period 3?</div>
        <div class="mcq-opts">
          <div class="mcq-opt" onclick="checkMCQ(this,0)"><div class="mcq-opttxt"><span class="mcq-letter">A</span><span>Mg</span></div></div>
          <div class="mcq-opt" onclick="checkMCQ(this,1)"><div class="mcq-opttxt"><span class="mcq-letter">B</span><span>S</span></div></div>
          <div class="mcq-opt" onclick="checkMCQ(this,2)"><div class="mcq-opttxt"><span class="mcq-letter">C</span><span>Cl</span></div></div>
          <div class="mcq-opt" onclick="checkMCQ(this,3)"><div class="mcq-opttxt"><span class="mcq-letter">D</span><span>Na</span></div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot active"></div><div class="prog-dot"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 5: TRENDS 3-5 (EN, EA, IONIC)
slides.append("""
<div class="slide" id="s5">
  <div class="slide-num">Phase 2 · Trends 3-5</div>
  <span class="phase-tag ph2">Periodic Trends</span>
  <h2>Trends 3–5: Electronegativity, Electron Affinity &amp; Ionic Radius</h2>
  <div class="grid3">
    <div class="card"><h3>3. Electronegativity (χ)</h3>
      <p style="font-size:.82rem;margin:.4rem 0"><strong>Definition:</strong> A measure of the tendency of an atom to attract a bonding pair of electrons. Uses the Pauling scale (F = 4.0 max).</p>
      <table class="ctable" style="font-size:.75rem">
        <thead><tr><th>Trend</th><th>Direction</th></tr></thead>
        <tbody>
          <tr><th>Across Period</th><td><span class="trend-arrow up">↑</span></td></tr>
          <tr><th>Down Group</th><td><span class="trend-arrow down">↓</span></td></tr>
        </tbody>
      </table>
      <p class="text-sm" style="margin-top:.5rem">Fluorine is most electronegative (4.0). Francium is least (0.7). Noble gases are not assigned values.</p>
    </div>
    <div class="card"><h3>4. Electron Affinity (EA)</h3>
      <p style="font-size:.82rem;margin:.4rem 0"><strong>Definition:</strong> Energy change when a neutral atom gains an electron: X(g) + e⁻ → X⁻(g). More negative = more favorable.</p>
      <table class="ctable" style="font-size:.75rem">
        <thead><tr><th>Trend</th><th>Direction</th></tr></thead>
        <tbody>
          <tr><th>Across Period</th><td><span class="trend-arrow up">↑ generally</span></td></tr>
          <tr><th>Down Group</th><td><span class="trend-arrow down">↓ generally</span></td></tr>
        </tbody>
      </table>
      <p class="text-sm" style="margin-top:.5rem">Chlorine has the most negative EA (−349 kJ mol⁻¹) in Period 3 — even more than fluorine!</p>
    </div>
    <div class="card"><h3>5. Ionic Radius</h3>
      <p style="font-size:.82rem;margin:.4rem 0"><strong>Definition:</strong> Radius of an ion. Cations are smaller than parent atoms (fewer electrons, same nuclear charge). Anions are larger (same nuclear charge, more electrons).</p>
      <table class="ctable" style="font-size:.75rem">
        <thead><tr><th>Trend</th><th>Direction</th></tr></thead>
        <tbody>
          <tr><th>Cations</th><td>Smaller than neutral atom</td></tr>
          <tr><th>Anions</th><td>Larger than neutral atom</td></tr>
          <tr><th>Isoelectronic series</th><td>Radius ↓ as nuclear charge ↑</td></tr>
        </tbody>
      </table>
      <p class="text-sm" style="margin-top:.5rem">Isoelectronic: N³⁻ > O²⁻ > F⁻ > Na⁺ > Mg²⁺ (same 10 electrons, different protons)</p>
    </div>
  </div>
  <div class="rule"></div>
  <h3>Summary: All 5 Trends at a Glance</h3>
  <div class="card">
    <table class="ctable">
      <thead><tr><th>Property</th><th>Across Period (L→R)</th><th>Down Group (top→bottom)</th><th>Key Cause</th></tr></thead>
      <tbody>
        <tr><th>Atomic Radius</th><td>↓ decreases</td><td>↑ increases</td><td>Z_eff ↑ / new shell</td></tr>
        <tr><th>Ionization Energy</th><td>↑ increases</td><td>↓ decreases</td><td>Z_eff ↑ / shielding ↑</td></tr>
        <tr><th>Electronegativity</th><td>↑ increases</td><td>↓ decreases</td><td>Z_eff ↑ / shell distance</td></tr>
        <tr><th>Electron Affinity</th><td>↑ generally</td><td>↓ generally</td><td>Z_eff ↑ / e⁻-e⁻ repulsion</td></tr>
        <tr><th>Ionic Radius (cations)</th><td>↓ decreases</td><td>↑ increases</td><td>fewer e⁻, same Z</td></tr>
      </tbody>
    </table>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot active"></div><div class="prog-dot"></div></div>
</div>
""")

# SLIDE 6: APPLY + IB QUESTIONS
slides.append("""
<div class="slide" id="s6">
  <div class="slide-num">Phase 3 · Apply</div>
  <span class="phase-tag ph3">Transfer &amp; Predict</span>
  <h2>Predicting Chemical Behaviour from Position</h2>
  <p class="lead">The periodic table is not just a table of facts — it is a <strong>prediction engine</strong>. Master this section and you'll answer IB questions before your peers even find their calculators.</p>
  <div class="grid2">
    <div>
      <div class="card"><h3>Example 1: Na vs K — Which is more reactive with water?</h3>
        <p style="font-size:.88rem;margin-top:.4rem">Both are Group 1. K is <em>lower</em>, meaning:</p>
        <div class="cflow mt1">
          <span class="cflow-node">K has more electron shells</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Greater shielding</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Lower Z_eff on outer e⁻</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Outer e⁻ easier to lose</span>
        </div>
        <p style="font-size:.85rem;margin-top:.6rem;color:var(--hl2);font-weight:600">Answer: K is MORE reactive than Na with water.</p>
      </div>
      <div class="card"><h3>Example 2: F₂ vs Cl₂ — Which is a stronger oxidizing agent?</h3>
        <p style="font-size:.88rem;margin-top:.4rem">Both are Group 17. F is at the <em>top</em> of the group:</p>
        <div class="cflow mt1">
          <span class="cflow-node">F has fewer shells</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Less shielding</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Higher Z_eff on outer shell</span>
          <span class="cflow-arrow">→</span>
          <span class="cflow-node">Stronger pull on bonding e⁻</span>
        </div>
        <p style="font-size:.85rem;margin-top:.6rem;color:var(--hl2);font-weight:600">Answer: F₂ is a STRONGER oxidizing agent than Cl₂.</p>
      </div>
    </div>
    <div>
      <div class="essay-box"><h4>✍️ IB Exam Question — 6 Marks</h4>
        <div class="ib-marks">May 2023 Chemistry SL Paper 2, Q3 · 6 marks</div>
        <p style="font-size:.85rem;margin-top:.5rem">(a) Define first ionization energy. [2]</p>
        <p style="font-size:.85rem;margin-top:.4rem">(b) Explain why the first ionization energy of aluminium is lower than that of magnesium. [2]</p>
        <p style="font-size:.85rem;margin-top:.4rem">(c) Predict whether the first ionization energy of silicon will be higher or lower than aluminium. Justify your answer. [2]</p>
        <div class="hint-panel mt1">
          <h4>💡 Mark Scheme Hints</h4>
          <p style="font-size:.8rem">Part (b): Al electron config → subshell detail needed<br>Part (c): Z_eff argument + atomic radius trend</p>
        </div>
      </div>
      <div class="lo-card"><div class="lo-num">LO</div>
        <div><strong>IB Learner Profile: Inquirers &amp; Knowledgeable</strong><br>
        <span class="text-sm">Use Z_eff theory to <em>predict</em> before consulting data. The periodic table rewards those who understand cause, not just recall effect.</span></div>
      </div>
    </div>
  </div>
  <div class="prog-dots"><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot done"></div><div class="prog-dot active"></div></div>
</div>
""")

# SLIDE 7: SYNTHESIS / CLOSURE
slides.append("""
<div class="slide" id="s7">
  <div class="slide-num">Synthesis</div>
  <span class="phase-tag ph4">Big Picture</span>
  <h2>The One Principle Behind Every Trend</h2>
  <div class="abt-card" style="text-align:center">
    <p style="font-size:1.15rem;max-width:60ch;margin:0 auto">Every periodic trend — atomic radius, IE, electronegativity, EA — is a <strong>direct consequence</strong> of the tug-of-war between two variables:</p>
    <div style="display:flex;gap:1.5rem;justify-content:center;margin:1.25rem 0;flex-wrap:wrap">
      <div style="background:rgba(240,136,62,.15);border:1px solid var(--hl);border-radius:10px;padding:1rem 1.5rem;min-width:160px">
        <div style="font-size:1.5rem;margin-bottom:.3rem">🔵 Z<sub>eff</sub></div>
        <div style="font-size:.85rem">Effective nuclear charge<br><strong>pulls electrons in</strong></div>
      </div>
      <div style="font-size:2rem;color:var(--text2);display:flex;align-items:center">vs</div>
      <div style="background:rgba(163,113,247,.15);border:1px solid var(--hl2);border-radius:10px;padding:1rem 1.5rem;min-width:160px">
        <div style="font-size:1.5rem;margin-bottom:.3rem">🟣 Shielding</div>
        <div style="font-size:.85rem">Inner electron shells<br><strong>push electrons out</strong></div>
      </div>
    </div>
    <p style="font-size:.95rem;color:var(--text2)">Across a period: Z<sub>eff</sub> wins → electrons pulled closer<br>Down a group: Shielding wins → atomic size increases</p>
  </div>
  <div class="grid2 mt15">
    <div class="card"><h3>Learning Objectives — Self-Check</h3>
      <div class="lo-card"><div class="lo-num">✓</div><div style="font-size:.85rem">Explain the trends in atomic radius, ionization energy, electronegativity, and ionic radius across periods and down groups</div></div>
      <div class="lo-card"><div class="lo-num">✓</div><div style="font-size:.85rem">Use electron configuration and effective nuclear charge (Z_eff) to account for these trends</div></div>
      <div class="lo-card"><div class="lo-num">✓</div><div style="font-size:.85rem">Predict the chemical properties of an element based on its position in the periodic table</div></div>
      <div class="lo-card"><div class="lo-num">✓</div><div style="font-size:.85rem">Distinguish between first ionization energy and subsequent ionization energies</div></div>
    </div>
    <div class="card"><h3>Next Steps</h3>
      <div class="grid2 mt1">
        <div class="mod-card" onclick="alert('Coming soon: Ionic Bonding courseware')">
          <span class="mod-badge mb1">Leads To</span>
          <h3>3.2 Ionic Bonding</h3>
          <p class="text-sm">Why Na gives Cl its electron — and what holds the resulting ions together.</p>
        </div>
        <div class="mod-card" onclick="alert('Coming soon: Covalent Bonding courseware')">
          <span class="mod-badge mb2">Leads To</span>
          <h3>3.3 Covalent Bonding</h3>
          <p class="text-sm">Electronegativity differences predict bond type: pure covalent, polar covalent, ionic.</p>
        </div>
      </div>
      <div class="lo-card mt1"><div class="lo-num">📖</div>
        <div style="font-size:.83rem"><strong>IB Chemistry Guide 2023</strong><br><span class="text-sm">Structure 3.1–3.3 · Oxford IB Chemistry Course Companion · Chapter 3</span></div>
      </div>
    </div>
  </div>
</div>
""")

# AI Tutor: no inline HTML needed — ai-tutor.js auto-injects FAB + panel
slides.append("")


# Write head first
html.write(head)

# Write all slides
for s in slides:
    html.write(s)

# Write JS
js = """
<script>
// Periodic Table data
const elements = [
  {z:1,sym:"H",name:"Hydrogen",m:1,g:1,r:53,cat:"nm"},
  {z:2,sym:"He",name:"Helium",m:1,g:18,r:31,cat:"ng"},
  {z:3,sym:"Li",name:"Lithium",m:2,g:1,r:167,cat:"am"},
  {z:4,sym:"Be",name:"Beryllium",m:2,g:2,r:112,cat:"aem"},
  {z:5,sym:"B",name:"Boron",m:2,g:13,r:87,cat:"mt"},
  {z:6,sym:"C",name:"Carbon",m:2,g:14,r:67,cat:"nm"},
  {z:7,sym:"N",name:"Nitrogen",m:2,g:15,r:56,cat:"nm"},
  {z:8,sym:"O",name:"Oxygen",m:2,g:16,r:48,cat:"nm"},
  {z:9,sym:"F",name:"Fluorine",m:2,g:17,r:42,cat:"hl"},
  {z:10,sym:"Ne",name:"Neon",m:2,g:18,r:38,cat:"ng"},
  {z:11,sym:"Na",name:"Sodium",m:3,g:1,r:190,cat:"am"},
  {z:12,sym:"Mg",name:"Magnesium",m:3,g:2,r:145,cat:"aem"},
  {z:13,sym:"Al",name:"Aluminium",m:3,g:13,r:118,cat:"pmet"},
  {z:14,sym:"Si",name:"Silicon",m:3,g:14,r:111,cat:"mt"},
  {z:15,sym:"P",name:"Phosphorus",m:3,g:15,r:98,cat:"nm"},
  {z:16,sym:"S",name:"Sulfur",m:3,g:16,r:88,cat:"nm"},
  {z:17,sym:"Cl",name:"Chlorine",m:3,g:17,r:79,cat:"hl"},
  {z:18,sym:"Ar",name:"Argon",m:3,g:18,r:71,cat:"ng"},
  {z:19,sym:"K",name:"Potassium",m:4,g:1,r:243,cat:"am"},
  {z:20,sym:"Ca",name:"Calcium",m:4,g:2,r:194,cat:"aem"},
  {z:21,sym:"Sc",name:"Scandium",m:4,g:3,r:184,cat:"tm"},
  {z:22,sym:"Ti",name:"Titanium",m:4,g:4,r:176,cat:"tm"},
  {z:23,sym:"V",name:"Vanadium",m:4,g:5,r:171,cat:"tm"},
  {z:24,sym:"Cr",name:"Chromium",m:4,g:6,r:166,cat:"tm"},
  {z:25,sym:"Mn",name:"Manganese",m:4,g:7,r:161,cat:"tm"},
  {z:26,sym:"Fe",name:"Iron",m:4,g:8,r:156,cat:"tm"},
  {z:27,sym:"Co",name:"Cobalt",m:4,g:9,r:152,cat:"tm"},
  {z:28,sym:"Ni",name:"Nickel",m:4,g:10,r:149,cat:"tm"},
  {z:29,sym:"Cu",name:"Copper",m:4,g:11,r:145,cat:"tm"},
  {z:30,sym:"Zn",name:"Zinc",m:4,g:12,r:142,cat:"tm"},
  {z:31,sym:"Ga",name:"Gallium",m:4,g:13,r:136,cat:"pmet"},
  {z:32,sym:"Ge",name:"Germanium",m:4,g:14,r:125,cat:"mt"},
  {z:33,sym:"As",name:"Arsenic",m:4,g:15,r:114,cat:"mt"},
  {z:34,sym:"Se",name:"Selenium",m:4,g:16,r:103,cat:"nm"},
  {z:35,sym:"Br",name:"Bromine",m:4,g:17,r:94,cat:"hl"},
  {z:36,sym:"Kr",name:"Krypton",m:4,g:18,r:88,cat:"ng"},
  {z:37,sym:"Rb",name:"Rubidium",m:5,g:1,r:265,cat:"am"},
  {z:38,sym:"Sr",name:"Strontium",m:5,g:2,r:219,cat:"aem"},
  {z:39,sym:"Y",name:"Yttrium",m:5,g:3,r:212,cat:"tm"},
  {z:40,sym:"Zr",name:"Zirconium",m:5,g:4,r:206,cat:"tm"},
  {z:41,sym:"Nb",name:"Niobium",m:5,g:5,r:198,cat:"tm"},
  {z:42,sym:"Mo",name:"Molybdenum",m:5,g:6,r:190,cat:"tm"},
  {z:43,sym:"Tc",name:"Technetium",m:5,g:7,r:183,cat:"tm"},
  {z:44,sym:"Ru",name:"Ruthenium",m:5,g:8,r:178,cat:"tm"},
  {z:45,sym:"Rh",name:"Rhodium",m:5,g:9,r:173,cat:"tm"},
  {z:46,sym:"Pd",name:"Palladium",m:5,g:10,r:169,cat:"tm"},
  {z:47,sym:"Ag",name:"Silver",m:5,g:11,r:165,cat:"tm"},
  {z:48,sym:"Cd",name:"Cadmium",m:5,g:12,r:161,cat:"tm"},
  {z:49,sym:"In",name:"Indium",m:5,g:13,r:156,cat:"pmet"},
  {z:50,sym:"Sn",name:"Tin",m:5,g:14,r:145,cat:"pmet"},
  {z:51,sym:"Sb",name:"Antimony",m:5,g:15,r:133,cat:"mt"},
  {z:52,sym:"Te",name:"Tellurium",m:5,g:16,r:123,cat:"mt"},
  {z:53,sym:"I",name:"Iodine",m:5,g:17,r:115,cat:"hl"},
  {z:54,sym:"Xe",name:"Xenon",m:5,g:18,r:108,cat:"ng"},
  {z:55,sym:"Cs",name:"Cesium",m:6,g:1,r:298,cat:"am"},
  {z:56,sym:"Ba",name:"Barium",m:6,g:2,r:253,cat:"aem"},
  {z:57,sym:"La",name:"Lanthanum",m:6,g:3,r:195,cat:"la"},
];

const catColor = {
  nm:"var(--surface2)",
  ng:"rgba(248,81,73,.15)",
  am:"rgba(255,102,102,.15)",
  aem:"rgba(63,185,80,.15)",
  tm:"rgba(88,166,255,.15)",
  mt:"rgba(210,180,140,.15)",
  hl:"rgba(240,136,62,.15)",
  la:"rgba(163,113,247,.15)",
  pmet:"rgba(163,113,247,.08)",
};

const catBorder = {
  nm:"var(--border)",
  ng:"var(--danger)",
  am:"#ff6666",
  aem:"var(--accent2)",
  tm:"var(--accent)",
  mt:"#d4a017",
  hl:"var(--hl)",
  la:"var(--hl2)",
  pmet:"var(--hl2)",
};

const catName = {
  nm:"non-metal",ng:"noble gas",am:"alkali metal",aem:"alkaline earth",
  tm:"transition metal",mt:"metalloid",hl:"halogen",la:"lanthanide",pmet:"poor metal"
};

// Build periodic table grid
const grid = document.getElementById('ptGrid');
let selected = null;

elements.forEach(el => {
  const cell = document.createElement('div');
  cell.className = 'pt-cell';
  cell.style.background = catColor[el.cat] || 'var(--surface2)';
  cell.style.borderColor = catBorder[el.cat] || 'var(--border)';
  cell.dataset.z = el.z;
  cell.innerHTML = '<span class="num">'+el.z+'</span><span class="sym">'+el.sym+'</span><span class="name">'+el.name+'</span>';
  cell.addEventListener('mouseenter', e => showTooltip(e, el));
  cell.addEventListener('mouseleave', hideTooltip);
  cell.addEventListener('click', () => toggleSelect(cell, el));
  grid.appendChild(cell);
});

function showTooltip(e, el) {
  const tt = document.getElementById('tt');
  if(!tt) return;
  tt.innerHTML = '<h4>'+el.name+' ('+el.sym+')</h4>'+
    '<div class="tt-row"><span>Atomic Number</span><span>'+el.z+'</span></div>'+
    '<div class="tt-row"><span>Period</span><span>'+el.m+'</span></div>'+
    '<div class="tt-row"><span>Group</span><span>'+el.g+'</span></div>'+
    '<div class="tt-row"><span>Radius</span><span>'+el.r+' pm</span></div>'+
    '<div class="tt-row"><span>Category</span><span>'+catName[el.cat]+'</span></div>';
  tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 200) + 'px';
  tt.style.top = (e.clientY - 10) + 'px';
  tt.classList.add('vis');
}
function hideTooltip() {
  const tt = document.getElementById('tt');
  if(tt) tt.classList.remove('vis');
}
function toggleSelect(cell, el) {
  if(selected) selected.classList.remove('active');
  if(selected === cell) { selected = null; return; }
  selected = cell;
  cell.classList.add('active');
}

// Slide navigation
const TOTAL = 7;
let current = 0;
function goTo(n) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  const slide = document.getElementById('s'+n);
  if(slide) slide.classList.add('active');
  current = n;
  document.getElementById('nextBtn').disabled = (n >= TOTAL);
}
function nextSlide() { if(current < TOTAL) goTo(current+1); }
function prevSlide() { if(current > 0) goTo(current-1); }

// MCQ check
function checkMCQ(el, idx) {
  const parent = el.closest('.mcq');
  const correct = parseInt(parent.dataset.correct);
  parent.querySelectorAll('.mcq-opt').forEach(o => o.classList.remove('correct','wrong'));
  if(idx === correct) {
    el.classList.add('correct');
  } else {
    el.classList.add('wrong');
    parent.querySelectorAll('.mcq-opt')[correct].classList.add('correct');
  }
}

// keyboard nav
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
  if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
});
</script>
  <!-- ⭐ v5.34 强制：AI 学伴配置（必须在 ai-tutor.js 加载前定义） -->
  <script>
  window.__TEACHANY_TUTOR_CONFIG__ = {
    courseTitle: 'Periodic Table and Periodic Trends',
    subject: 'chem',         // chn/math/eng/phy/chem/bio/hist/geo/it
    grade: 11,
    learningObjectives: [
      'Explain the trends in atomic radius, ionization energy, electronegativity, and ionic radius across periods and down groups',
      'Use electron configuration and effective nuclear charge (Z_eff) to account for these trends',
      'Predict the chemical properties of an element based on its position in the periodic table',
      'Distinguish between first ionization energy and subsequent ionization energies'
    ],
    getContext: function() {
      var active = document.querySelector('.slide.active');
      if (active && active.innerText) return active.innerText.slice(0, 3000);
      return '';
    }
  };
  </script>
  <!-- ⭐ v5.34 强制：AI 学伴脚本（必须放在 </body> 前，defer 保证 DOM 已就绪） -->
  <script src="./ai-tutor.js" defer></script>
</body>
</html>
"""

html.write(js)
html.close()
print('index.html generated successfully')
