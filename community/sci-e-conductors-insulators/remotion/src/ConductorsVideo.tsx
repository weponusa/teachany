import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628",
  bg2: "#0f2040",
  text: "#f0f9ff",
  muted: "#94a3b8",
  primary: "#38bdf8",    // electric blue
  conductor: "#fbbf24",  // gold/yellow - conductors
  insulator: "#f87171",  // red/orange - insulators
  semi: "#a78bfa",       // purple - semiconductor
  safe: "#34d399",       // green - safety
  white: "#ffffff",
};

// ─── Particle type ───────────────────────────────────────
interface Particle {
  id: number;
  startX: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

// ─── 场景1：标题 ──────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgesOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });
  const boltScale = spring({ frame: frame - 30, fps, config: { stiffness: 130, damping: 12 } });

  // Animated background electricity lines
  const lineAnim = (frame % 30) / 30;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(56,189,248,.18) 0%, transparent 55%),
                   radial-gradient(ellipse at 20% 80%, rgba(251,191,36,.12) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Background circuit lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
        <line x1="0" y1="200" x2="1920" y2="200" stroke={C.primary} strokeWidth="2" strokeDasharray="20,15" />
        <line x1="0" y1="880" x2="1920" y2="880" stroke={C.conductor} strokeWidth="2" strokeDasharray="20,15" />
        <line x1="200" y1="0" x2="200" y2="1080" stroke={C.primary} strokeWidth="1.5" strokeDasharray="10,20" />
        <line x1="1720" y1="0" x2="1720" y2="1080" stroke={C.conductor} strokeWidth="1.5" strokeDasharray="10,20" />
        {/* Circuit nodes */}
        {[300,600,900,1200,1500].map((x, i) => (
          <circle key={i} cx={x} cy={200} r="6" fill={C.primary} opacity="0.6" />
        ))}
        {[400,800,1100].map((x, i) => (
          <circle key={i} cx={x} cy={880} r="6" fill={C.conductor} opacity="0.6" />
        ))}
      </svg>

      <div style={{ fontSize: 100, transform: `scale(${Math.min(boltScale, 1)})`, marginBottom: 36, lineHeight: 1 }}>⚡</div>
      <div style={{
        fontSize: 96, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg,#fff 30%,${C.primary} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        marginBottom: 16,
      }}>导体与绝缘体</div>
      <div style={{
        fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        marginBottom: 52,
      }}>小学科学 G4 · 物质科学</div>
      <div style={{
        display: "flex", gap: 28, opacity: badgesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { icon: "🔩", label: "导体", color: C.conductor },
          { icon: "🛡️", label: "绝缘体", color: C.insulator },
          { icon: "💎", label: "半导体", color: C.semi },
          { icon: "⚠️", label: "安全用电", color: C.safe },
        ].map((b) => (
          <div key={b.label} style={{
            padding: "14px 32px", borderRadius: 99,
            background: b.color + "22", border: `1.5px solid ${b.color}66`,
            color: b.color, fontSize: 30, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>{b.icon}</span><span>{b.label}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── 导体：电流粒子流过金属 ─────────────────────────────
const ConductorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const wireOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const cardsOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  // Particle positions along wire (animated)
  const numParticles = 12;
  const particles = Array.from({ length: numParticles }, (_, i) => ({
    id: i,
    offset: (i / numParticles),
  }));

  // Wire path: x from 80 to 1840, y center = 540
  const wireY = 540;
  const wireX1 = 200;
  const wireX2 = 1720;
  const wireLen = wireX2 - wireX1;

  const conductors = [
    { icon: "🔩", name: "铜", desc: "最佳导体\n电线核心" },
    { icon: "⚙️", name: "铁", desc: "常用金属\n钉子钢轨" },
    { icon: "🧊", name: "铝", desc: "轻质导体\n高压电线" },
    { icon: "💧", name: "水", desc: "液体导体\n小心触电" },
    { icon: "🧑", name: "人体", desc: "导体！\n注意安全" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.conductor }}>
          ⚡ 导体 — 电流的高速公路
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          容易让电流通过的材料
        </div>
      </div>

      {/* Animated wire with particles */}
      <svg style={{
        position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
        opacity: wireOp,
      }}>
        {/* Battery symbol left */}
        <rect x={wireX1 - 80} y={wireY - 40} width={60} height={80} rx={8}
          fill="none" stroke={C.conductor} strokeWidth="3" />
        <text x={wireX1 - 50} y={wireY + 6} textAnchor="middle" fill={C.conductor} fontSize="28" fontFamily="sans-serif">🔋</text>

        {/* Bulb symbol right */}
        <circle cx={wireX2 + 60} cy={wireY} r={38}
          fill={frame > 40 ? "rgba(251,191,36,0.3)" : "rgba(251,191,36,0.05)"}
          stroke={C.conductor} strokeWidth="3" />
        <text x={wireX2 + 60} y={wireY + 10} textAnchor="middle" fill={C.conductor} fontSize="36">💡</text>

        {/* Wire top */}
        <line x1={wireX1 - 20} y1={wireY - 20} x2={wireX2 + 22} y2={wireY - 20}
          stroke={C.conductor} strokeWidth="12" strokeLinecap="round" opacity="0.9" />
        {/* Wire bottom */}
        <line x1={wireX1 - 20} y1={wireY + 20} x2={wireX2 + 22} y2={wireY + 20}
          stroke={C.conductor} strokeWidth="12" strokeLinecap="round" opacity="0.9" />

        {/* Metal bar (conductor) in center */}
        <rect x={wireX1 + 100} y={wireY - 28} width={wireLen - 200} height={56} rx={8}
          fill="rgba(251,191,36,0.15)" stroke={C.conductor} strokeWidth="3" />
        <text x={(wireX1 + wireX2) / 2} y={wireY + 8} textAnchor="middle"
          fill={C.conductor} fontSize="26" fontFamily="'PingFang SC',sans-serif" fontWeight="700">
          铜导线 — 电流畅通无阻
        </text>

        {/* Animated particles flowing through wire */}
        {particles.map((p) => {
          const pos = ((p.offset + frame * 0.018) % 1);
          const px = wireX1 + 100 + pos * (wireLen - 200);
          const py = wireY;
          const opacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
          return (
            <g key={p.id} opacity={opacity}>
              <circle cx={px} cy={py} r={10} fill={C.conductor} opacity={0.9} />
              <circle cx={px} cy={py} r={18} fill={C.conductor} opacity={0.2} />
              {/* Spark trail */}
              <circle cx={px - 20} cy={py} r={6} fill={C.conductor} opacity={0.4} />
              <circle cx={px - 38} cy={py} r={3} fill={C.conductor} opacity={0.2} />
            </g>
          );
        })}

        {/* Arrows showing current direction */}
        {[wireX1 + 150, wireX1 + 400, wireX1 + 650, wireX1 + 900].map((x, i) => (
          <text key={i} x={x} y={wireY - 50} fill={C.conductor} fontSize="28" opacity={wireOp}>→</text>
        ))}
      </svg>

      {/* Conductor cards */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60,
        display: "flex", gap: 24, opacity: cardsOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {conductors.map((c, i) => {
          const delay = 45 + i * 12;
          const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={c.name} style={{
              flex: 1,
              background: "rgba(251,191,36,0.1)",
              border: `2px solid rgba(251,191,36,0.45)`,
              borderRadius: 16, padding: "22px 20px",
              textAlign: "center", opacity: op,
            }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.conductor, marginBottom: 8 }}>{c.name}</div>
              <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 绝缘体：电流被阻挡 ─────────────────────────────────
const InsulatorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const wireOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const cardsOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  const wireX1 = 200;
  const wireX2 = 1720;
  const wireY = 520;
  const wireLen = wireX2 - wireX1;
  const blockStart = wireX1 + 280;
  const blockEnd = wireX2 - 280;

  // Blocked particles: pile up at blockStart
  const blockedParticles = Array.from({ length: 8 }, (_, i) => {
    const pos = Math.min(i * 0.1, ((i * 0.07 + frame * 0.012) % 1));
    const px = wireX1 + 100 + Math.min(pos * (wireLen - 200), blockStart - wireX1 - 100 - 30);
    return { id: i, px };
  });

  const insulators = [
    { icon: "🔴", name: "橡胶", desc: "电线外皮\n防护第一" },
    { icon: "⬜", name: "塑料", desc: "插头外壳\n随处可见" },
    { icon: "🪵", name: "干木头", desc: "注意：\n湿木头导电！" },
    { icon: "🫙", name: "玻璃", desc: "高温制成\n绝缘良好" },
    { icon: "🏺", name: "陶瓷", desc: "瓷瓶绝缘\n高压线用" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.insulator }}>
          🛡️ 绝缘体 — 电流的拦路虎
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          不容易让电流通过的材料
        </div>
      </div>

      {/* Wire with blocked current */}
      <svg style={{
        position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
        opacity: wireOp,
      }}>
        {/* Battery */}
        <text x={wireX1 - 50} y={wireY + 10} textAnchor="middle" fill={C.primary} fontSize="40">🔋</text>

        {/* Bulb (dim - no current reaches it) */}
        <circle cx={wireX2 + 60} cy={wireY} r={38}
          fill="rgba(200,200,200,0.05)" stroke="#64748b" strokeWidth="3" />
        <text x={wireX2 + 60} y={wireY + 10} textAnchor="middle" fill="#64748b" fontSize="36">💡</text>
        <text x={wireX2 + 60} y={wireY + 62} textAnchor="middle" fill="#64748b" fontSize="22"
          fontFamily="'PingFang SC',sans-serif">不亮</text>

        {/* Wire left of block */}
        <line x1={wireX1 - 20} y1={wireY} x2={blockStart} y2={wireY}
          stroke={C.primary} strokeWidth="10" strokeLinecap="round" opacity="0.8" />

        {/* Insulator block */}
        <rect x={blockStart} y={wireY - 40} width={blockEnd - blockStart} height={80} rx={12}
          fill="rgba(248,113,113,0.2)" stroke={C.insulator} strokeWidth="4"
          strokeDasharray="12,8" />
        <text x={(blockStart + blockEnd) / 2} y={wireY + 8} textAnchor="middle"
          fill={C.insulator} fontSize="28" fontFamily="'PingFang SC',sans-serif" fontWeight="700">
          橡胶绝缘层 — 电流被阻断！
        </text>
        {/* X marks */}
        {[blockStart + 80, (blockStart + blockEnd) / 2, blockEnd - 80].map((x, i) => (
          <text key={i} x={x} y={wireY - 55} textAnchor="middle"
            fill={C.insulator} fontSize="32">✕</text>
        ))}

        {/* Wire right of block (dim) */}
        <line x1={blockEnd} y1={wireY} x2={wireX2 + 22} y2={wireY}
          stroke="#334155" strokeWidth="10" strokeLinecap="round" opacity="0.6" />

        {/* Blocked particles piling up */}
        {blockedParticles.map((p) => {
          const clampedX = Math.min(p.px, blockStart - 25 - (p.id % 4) * 28);
          const jitter = Math.sin(frame * 0.3 + p.id) * 6;
          return (
            <g key={p.id}>
              <circle cx={clampedX} cy={wireY + jitter} r={10}
                fill={C.primary} opacity={0.85} />
              <circle cx={clampedX} cy={wireY + jitter} r={18}
                fill={C.primary} opacity={0.15} />
            </g>
          );
        })}
        {/* Warning arrow at block */}
        <text x={blockStart - 60} y={wireY - 60} fill={C.insulator} fontSize="36">⚠️</text>
      </svg>

      {/* Insulator cards */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60,
        display: "flex", gap: 24, opacity: cardsOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {insulators.map((ins, i) => {
          const delay = 50 + i * 12;
          const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={ins.name} style={{
              flex: 1,
              background: "rgba(248,113,113,0.1)",
              border: `2px solid rgba(248,113,113,0.45)`,
              borderRadius: 16, padding: "22px 20px",
              textAlign: "center", opacity: op,
            }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>{ins.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.insulator, marginBottom: 8 }}>{ins.name}</div>
              <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.5, whiteSpace: "pre-line" }}>{ins.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 导体绝缘体配合 ──────────────────────────────────────
const ComboScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const items = [
    {
      icon: "🔌",
      title: "插头",
      conductor: "铜片（导体）",
      conductorDesc: "内部金属触点传导电流",
      insulator: "塑料壳（绝缘体）",
      insulatorDesc: "外壳保护手不触电",
    },
    {
      icon: "💡",
      title: "电灯泡",
      conductor: "钨丝（导体）",
      conductorDesc: "通电发热发光",
      insulator: "玻璃壳（绝缘体）",
      insulatorDesc: "保护灯丝，防氧化",
    },
    {
      icon: "🔋",
      title: "电线",
      conductor: "铜芯（导体）",
      conductorDesc: "输送电流到用电器",
      insulator: "橡胶皮（绝缘体）",
      insulatorDesc: "防止漏电触电",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Subtle glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,.07) 0%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.white }}>
          🤝 导体与绝缘体的搭档关系
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          缺一不可 · 共同保障安全用电
        </div>
      </div>

      <div style={{
        position: "absolute", top: 170, left: 60, right: 60, bottom: 60,
        display: "flex", gap: 36,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {items.map((item, i) => {
          const delay = 20 + i * 22;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [24, 0], { extrapolateRight: "clamp" });

          return (
            <div key={item.title} style={{
              flex: 1,
              background: "rgba(15,32,64,0.9)",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: 20,
              padding: "32px 28px",
              opacity: op, transform: `translateY(${y}px)`,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 72, textAlign: "center", marginBottom: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.white,
                textAlign: "center", marginBottom: 28 }}>{item.title}</div>

              {/* Conductor part */}
              <div style={{
                background: "rgba(251,191,36,0.12)",
                border: "1.5px solid rgba(251,191,36,0.5)",
                borderRadius: 12, padding: "16px 18px",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.conductor,
                  marginBottom: 8 }}>⚡ {item.conductor}</div>
                <div style={{ fontSize: 22, color: "#cbd5e1" }}>{item.conductorDesc}</div>
              </div>

              {/* Insulator part */}
              <div style={{
                background: "rgba(248,113,113,0.12)",
                border: "1.5px solid rgba(248,113,113,0.5)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.insulator,
                  marginBottom: 8 }}>🛡️ {item.insulator}</div>
                <div style={{ fontSize: 22, color: "#cbd5e1" }}>{item.insulatorDesc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景5：总结 ────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "⚡", color: C.conductor, title: "导体",
      text: "铜、铁、铝\n水、人体\n容易导电",
    },
    {
      icon: "🛡️", color: C.insulator, title: "绝缘体",
      text: "橡胶、塑料\n干木头、玻璃\n不导电",
    },
    {
      icon: "💎", color: C.semi, title: "半导体",
      text: "硅、锗\n手机芯片材料\n介于两者之间",
    },
    {
      icon: "⚠️", color: C.safe, title: "安全用电",
      text: "湿木头会导电！\n远离水边电器\n绝缘保护很重要",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,.08) 0%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🎯 核心知识总结</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          导体与绝缘体 · 物质科学 G4
        </div>
      </div>

      <div style={{
        position: "absolute", top: 170, left: 60, right: 60, bottom: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,0.9)", borderRadius: 20, padding: "28px 30px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 24, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              fontFamily: "'PingFang SC',sans-serif",
            }}>
              <div style={{ fontSize: 72, flexShrink: 0, lineHeight: 1 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 38, fontWeight: 800, color: p.color, marginBottom: 12 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#e2e8f0", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── 主 Composition ────────────────────────────────────
export const ConductorsVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><ConductorScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><InsulatorScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><ComboScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
