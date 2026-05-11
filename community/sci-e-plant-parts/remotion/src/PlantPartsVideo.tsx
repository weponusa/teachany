import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  green: "#34d399", pink: "#f472b6", yellow: "#fbbf24",
  blue: "#38bdf8", purple: "#a78bfa", orange: "#fb923c",
};

// ── 场景1：标题 ─────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 30, fps, config: { stiffness: 120, damping: 14 } });

  const parts = ["🌱 根", "🌿 茎", "🍃 叶", "🌸 花", "🍎 果实", "🌰 种子"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 55% 35%, rgba(52,211,153,.2) 0%, transparent 55%),
                   radial-gradient(ellipse at 20% 70%, rgba(244,114,182,.1) 0%, transparent 50%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 90, transform: `scale(${Math.min(emojiScale, 1)})`, marginBottom: 28 }}>🌻</div>
      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg, #fff 30%, ${C.green} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>植物的各部分</div>
      <div style={{
        marginTop: 20, fontSize: 34, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G1 · 生命科学</div>
      <div style={{
        marginTop: 44, display: "flex", gap: 22, flexWrap: "wrap",
        justifyContent: "center", opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {parts.map((t, i) => (
          <div key={i} style={{
            padding: "10px 26px", borderRadius: 99,
            background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.35)",
            color: C.green, fontSize: 26,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：种子发芽到完整植株（植物生长动画）──────────────
const GrowthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Growth progress 0→1 over frames 20→120
  const growProg = interpolate(frame, [20, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Stem height grows
  const stemH = growProg * 320;
  // Root depth grows
  const rootD = growProg * 80;
  // Leaf/flower appear
  const leafOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const flowerOp = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });
  const fruitOp = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: "clamp" });

  const labelOp = interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🌱 从种子到植株</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>植物的生长历程</div>
      </div>

      {/* Plant SVG */}
      <div style={{
        position: "absolute", top: 150, left: 0, right: 0,
        display: "flex", justifyContent: "center", alignItems: "flex-end",
      }}>
        <svg width="320" height="540" viewBox="0 0 320 540">
          {/* Soil line */}
          <rect x="0" y="360" width="320" height="180" fill="#3d2b1f" rx="8"/>
          <rect x="0" y="355" width="320" height="14" fill="#5a3e2b" rx="4"/>

          {/* Roots */}
          {rootD > 0 && <>
            <line x1="160" y1="370" x2="130" y2={370 + rootD * 0.9} stroke="#8B6914" strokeWidth="5" strokeLinecap="round" opacity={Math.min(rootD / 40, 1)}/>
            <line x1="160" y1="375" x2="190" y2={375 + rootD * 0.8} stroke="#8B6914" strokeWidth="5" strokeLinecap="round" opacity={Math.min(rootD / 40, 1)}/>
            <line x1="160" y1="380" x2="110" y2={380 + rootD * 0.6} stroke="#8B6914" strokeWidth="4" strokeLinecap="round" opacity={Math.min(rootD / 60, 1)}/>
            <line x1="160" y1="380" x2="210" y2={380 + rootD * 0.6} stroke="#8B6914" strokeWidth="4" strokeLinecap="round" opacity={Math.min(rootD / 60, 1)}/>
          </>}

          {/* Stem */}
          {stemH > 0 && (
            <rect x="153" y={360 - stemH} width="14" height={stemH} fill="#4ade80" rx="5"/>
          )}

          {/* Seed at bottom */}
          {growProg < 0.2 && (
            <ellipse cx="160" cy="380" rx="18" ry="12" fill="#fbbf24" opacity={1 - growProg * 5}/>
          )}

          {/* Leaves */}
          {leafOp > 0 && <>
            <ellipse cx="130" cy={360 - stemH * 0.55} rx="45" ry="24"
              fill="#22c55e" opacity={leafOp}
              transform={`rotate(-20, 130, ${360 - stemH * 0.55})`}/>
            <ellipse cx="192" cy={360 - stemH * 0.68} rx="45" ry="24"
              fill="#22c55e" opacity={leafOp}
              transform={`rotate(20, 192, ${360 - stemH * 0.68})`}/>
            <ellipse cx="118" cy={360 - stemH * 0.78} rx="38" ry="20"
              fill="#16a34a" opacity={leafOp}
              transform={`rotate(-25, 118, ${360 - stemH * 0.78})`}/>
          </>}

          {/* Flower */}
          {flowerOp > 0 && <>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i}
                cx={160 + 28 * Math.cos((angle * Math.PI) / 180)}
                cy={360 - stemH - 28 * Math.abs(Math.sin((angle * Math.PI) / 180))}
                rx="18" ry="12"
                fill="#f472b6" opacity={flowerOp}
                transform={`rotate(${angle}, ${160 + 28 * Math.cos((angle * Math.PI) / 180)}, ${360 - stemH - 28 * Math.abs(Math.sin((angle * Math.PI) / 180))})`}
              />
            ))}
            <circle cx="160" cy={360 - stemH} r="20" fill="#fbbf24" opacity={flowerOp}/>
          </>}

          {/* Fruit */}
          {fruitOp > 0 && (
            <circle cx="160" cy={360 - stemH + 10} r="30" fill="#ef4444" opacity={fruitOp}/>
          )}
        </svg>
      </div>

      {/* Labels */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 28,
        opacity: labelOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[["🌰", "种子"], ["🌱", "根"], ["🌿", "茎"], ["🍃", "叶"], ["🌸", "花"], ["🍎", "果实"]].map(([icon, name], i) => (
          <div key={i} style={{
            textAlign: "center",
            padding: "8px 18px", borderRadius: 12,
            background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.3)",
          }}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div style={{ fontSize: 22, color: C.green, fontWeight: 700 }}>{name}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：六部分逐一高亮介绍 ───────────────────────────
const PartsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const parts = [
    { icon: "🌱", name: "根", color: "#8B6914", colorLight: "#fbbf24", desc: "吸收水分与矿物质\n固定植物在土壤中" },
    { icon: "🌿", name: "茎", color: "#4ade80", colorLight: "#86efac", desc: "输送水分和养分\n支撑植物直立生长" },
    { icon: "🍃", name: "叶", color: "#22c55e", colorLight: "#4ade80", desc: "光合作用制造食物\n吸收阳光和CO₂" },
    { icon: "🌸", name: "花", color: C.pink, colorLight: "#f9a8d4", desc: "吸引传粉昆虫\n是植物的繁殖器官" },
    { icon: "🍎", name: "果实", color: "#ef4444", colorLight: "#fca5a5", desc: "包裹和保护种子\n由花发育而来" },
    { icon: "🌰", name: "种子", color: C.yellow, colorLight: "#fde68a", desc: "植物的下一代\n萌发成新的植物" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>植物的六个部分</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>每个部分都有重要任务</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {parts.map((p, i) => {
          const delay = 15 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.6 + 0.4 * Math.min(prog, 1);

          return (
            <div key={p.name} style={{
              background: `rgba(15,32,64,0.9)`,
              border: `2px solid ${p.color}44`,
              borderRadius: 20,
              padding: "24px 22px",
              display: "flex", gap: 18, alignItems: "flex-start",
              opacity: op, transform: `scale(${sc})`,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: p.color + "1a", border: `3px solid ${p.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, flexShrink: 0,
              }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 36, fontWeight: 800, color: p.colorLight,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
                }}>{p.name}</div>
                <div style={{
                  fontSize: 22, color: "#cbd5e1",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{p.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：功能对比展示 ─────────────────────────────────
const FunctionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const comparisons = [
    {
      title: "🌱 根的多样性",
      color: C.yellow,
      left: { label: "普通根", icon: "🌿", desc: "细细的须根\n吸水能力强" },
      right: { label: "胡萝卜根", icon: "🥕", desc: "粗大的主根\n储存营养物质" },
    },
    {
      title: "🌿 茎的多样性",
      color: C.green,
      left: { label: "普通茎", icon: "🌱", desc: "绿色细茎\n支撑叶片" },
      right: { label: "仙人掌茎", icon: "🌵", desc: "肥厚多汁\n储水抗旱" },
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🔍 同一部分，不同形态</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>植物因环境不同，同一部分也会有不同形态</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 60, right: 60,
        display: "flex", flexDirection: "column", gap: 36,
      }}>
        {comparisons.map((cmp, ci) => {
          const baseDelay = 20 + ci * 60;
          const titleOp2 = interpolate(frame, [baseDelay, baseDelay + 20], [0, 1], { extrapolateRight: "clamp" });
          const cardOp = interpolate(frame, [baseDelay + 20, baseDelay + 50], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={cmp.title} style={{ opacity: titleOp2 }}>
              <div style={{
                fontSize: 34, fontWeight: 800, color: cmp.color,
                fontFamily: "'PingFang SC',sans-serif",
                marginBottom: 16, textAlign: "center",
              }}>{cmp.title}</div>
              <div style={{ display: "flex", gap: 40, opacity: cardOp }}>
                {[cmp.left, cmp.right].map((side, si) => (
                  <div key={si} style={{
                    flex: 1,
                    background: `rgba(15,32,64,0.9)`,
                    border: `1px solid ${cmp.color}44`,
                    borderRadius: 18, padding: "28px 24px",
                    textAlign: "center",
                    fontFamily: "'PingFang SC',sans-serif",
                  }}>
                    <div style={{ fontSize: 72, marginBottom: 12 }}>{side.icon}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: cmp.color, marginBottom: 8 }}>{side.label}</div>
                    <div style={{ fontSize: 24, color: "#cbd5e1", lineHeight: 1.6, whiteSpace: "pre-line" }}>{side.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 26, color: "#a5f3fc",
      }}>
        💡 植物通过改变部分的形态来适应不同的生存环境！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const discoveries = [
    { icon: "🌱", color: C.yellow,  title: "根", text: "吸收水分矿物质\n固定植物在土壤" },
    { icon: "🌿", color: C.green,   title: "茎", text: "输送水分和营养\n支撑植物生长" },
    { icon: "🍃", color: "#22c55e", title: "叶", text: "光合作用\n制造食物" },
    { icon: "🌸", color: C.pink,    title: "花", text: "吸引传粉昆虫\n发育成果实" },
    { icon: "🍎", color: "#ef4444", title: "果实", text: "保护种子\n由花发育而来" },
    { icon: "🌰", color: C.yellow,  title: "种子", text: "繁殖后代\n萌发成新植物" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(52,211,153,.08) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🎯 植物六部分总结</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>每个部分各有职责，缺一不可！</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {discoveries.map((d, i) => {
          const delay = 18 + i * 15;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [18, 0], { extrapolateRight: "clamp" });
          return (
            <div key={d.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 18, padding: "24px 20px",
              border: `2px solid ${d.color}44`,
              display: "flex", gap: 18, alignItems: "center",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 58, flexShrink: 0 }}>{d.icon}</div>
              <div>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: d.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6,
                }}>{d.title}</div>
                <div style={{
                  fontSize: 22, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.5, whiteSpace: "pre-line",
                }}>{d.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const PlantPartsVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><GrowthScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><PartsScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><FunctionScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
