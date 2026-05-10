import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  solid: "#38bdf8",   // ice blue
  liquid: "#34d399",  // water green
  gas: "#fbbf24",     // steam gold
  accent: "#f472b6",  // pink accent
  purple: "#a78bfa",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 30, fps, config: { stiffness: 110, damping: 16 } });

  const badges = ["🧊 固态", "💧 液态", "💨 气态"];
  const badgeColors = [C.solid, C.liquid, C.gas];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(56,189,248,.2) 0%, transparent 60%),
                   radial-gradient(ellipse at 20% 70%, rgba(52,211,153,.12) 0%, transparent 50%), ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Molecule animation hint */}
      <div style={{ fontSize: 90, transform: `scale(${Math.min(emojiScale, 1)})`, marginBottom: 28 }}>🌡️</div>

      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg, #fff 30%, #38bdf8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>物质的三态与变化</div>

      <div style={{
        marginTop: 22, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G3 · 物质科学</div>

      <div style={{
        marginTop: 40, display: "flex", gap: 28, opacity: badgeOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {badges.map((b, i) => (
          <div key={i} style={{
            padding: "12px 32px", borderRadius: 99,
            background: badgeColors[i] + "22",
            border: `1px solid ${badgeColors[i]}55`,
            color: badgeColors[i], fontSize: 30,
          }}>{b}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Molecule component ──────────────────────────────────
interface MoleculeProps {
  x: number; y: number; r: number; color: string; opacity: number; vx?: number; vy?: number;
}
const Molecule: React.FC<MoleculeProps> = ({ x, y, r, color, opacity }) => (
  <circle cx={x} cy={y} r={r} fill={color} opacity={opacity} />
);

// ── 场景2：固态展示 ─────────────────────────────────────
const SolidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const contentOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // Tightly packed molecules in a grid - solid state
  const cols = 8; const rows = 6;
  const spacing = 42;
  const startX = 80; const startY = 80;
  const molecules = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Tiny vibration animation
      const vibX = Math.sin(frame * 0.3 + r * 1.1 + c * 0.7) * 2;
      const vibY = Math.cos(frame * 0.25 + r * 0.9 + c * 1.3) * 2;
      molecules.push({
        x: startX + c * spacing + vibX,
        y: startY + r * spacing + vibY,
        r: 14, color: C.solid, opacity: 0.85,
      });
    }
  }

  const solidFacts = ["形状固定，不会流动", "体积固定，不会变化", "分子排列紧密有序", "例：冰块、石头、木头"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🧊 固态 — 紧密排列</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>分子手拉手，形状固定不改变</div>
      </div>

      {/* Left: molecule visualization */}
      <div style={{
        position: "absolute", top: 140, left: 60, width: 420, height: 320,
        background: "rgba(56,189,248,.06)", border: "2px solid rgba(56,189,248,.3)",
        borderRadius: 20, overflow: "hidden", opacity: contentOp,
      }}>
        <svg width="420" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
          {molecules.map((m, i) => (
            <Molecule key={i} {...m} />
          ))}
          {/* Bond lines */}
          {molecules.map((m, i) => {
            if (i % cols < cols - 1) {
              const next = molecules[i + 1];
              return <line key={`h${i}`} x1={m.x} y1={m.y} x2={next.x} y2={next.y}
                stroke={C.solid} strokeWidth={1} opacity={0.3} />;
            }
            return null;
          })}
        </svg>
        <div style={{
          position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center",
          fontSize: 18, color: C.solid, fontFamily: "'PingFang SC',sans-serif",
        }}>🔬 固体分子模型（每个小球=一个分子）</div>
      </div>

      {/* Right: facts */}
      <div style={{
        position: "absolute", top: 145, right: 60, width: 380,
        opacity: contentOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(56,189,248,.08)", border: "2px solid rgba(56,189,248,.35)",
          borderRadius: 20, padding: "28px 24px",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🧊</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.solid, marginBottom: 16 }}>固态</div>
          {solidFacts.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
              opacity: interpolate(frame, [30 + i * 12, 45 + i * 12], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.solid, flexShrink: 0 }} />
              <span style={{ fontSize: 24, color: "#e2e8f0" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom examples */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: C.muted }}>
          ✨ 生活中的固体：
          <span style={{ color: C.solid }}> 🧊冰块 · 🪨石头 · 🪵木头 · ✏️铅笔 · 📚书本</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：液态展示 ─────────────────────────────────────
const LiquidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const contentOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // Liquid molecules - more spread out, flowing
  const liquidMolecules = [];
  const positions = [
    [60,60],[110,50],[160,65],[210,55],[270,60],[320,52],[370,62],
    [80,110],[130,120],[185,108],[240,115],[295,105],[350,118],[400,110],
    [55,165],[115,158],[170,168],[225,160],[280,162],[335,155],[385,165],
    [75,215],[130,208],[190,218],[245,210],[300,205],[355,215],[408,208],
    [60,265],[120,258],[175,268],[230,260],[285,255],[340,265],[395,258],
  ];

  positions.forEach(([bx, by], i) => {
    const flow = Math.sin(frame * 0.12 + i * 0.6) * 5;
    const flowY = Math.cos(frame * 0.09 + i * 0.8) * 4;
    liquidMolecules.push({ x: bx + flow, y: by + flowY, r: 12, color: C.liquid, opacity: 0.8 });
  });

  const liquidFacts = ["形状随容器改变", "体积固定不变", "分子间有间隙，可流动", "例：水、牛奶、橙汁"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>💧 液态 — 可以流动</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>分子能移动，体积固定但形状随容器变</div>
      </div>

      {/* Left: molecule visualization */}
      <div style={{
        position: "absolute", top: 140, left: 60, width: 480, height: 320,
        background: "rgba(52,211,153,.06)", border: "2px solid rgba(52,211,153,.3)",
        borderRadius: 20, overflow: "hidden", opacity: contentOp,
      }}>
        <svg width="480" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
          {liquidMolecules.map((m, i) => (
            <Molecule key={i} {...m} />
          ))}
        </svg>
        <div style={{
          position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center",
          fontSize: 18, color: C.liquid, fontFamily: "'PingFang SC',sans-serif",
        }}>🔬 液体分子模型（分子间有间距，可流动）</div>
      </div>

      {/* Right: facts */}
      <div style={{
        position: "absolute", top: 145, right: 60, width: 360,
        opacity: contentOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(52,211,153,.08)", border: "2px solid rgba(52,211,153,.35)",
          borderRadius: 20, padding: "28px 24px",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💧</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.liquid, marginBottom: 16 }}>液态</div>
          {liquidFacts.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
              opacity: interpolate(frame, [30 + i * 12, 45 + i * 12], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.liquid, flexShrink: 0 }} />
              <span style={{ fontSize: 24, color: "#e2e8f0" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: C.muted }}>
          ✨ 生活中的液体：
          <span style={{ color: C.liquid }}> 💧水 · 🥛牛奶 · 🧃橙汁 · 🍵茶水 · 🫗油</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：气态展示 ─────────────────────────────────────
const GasScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const contentOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // Gas molecules - scattered, fast-moving
  const gasMolecules = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + frame * (0.03 + i * 0.002);
    const radius = 100 + (i % 5) * 30 + Math.sin(frame * 0.07 + i) * 20;
    return {
      x: 240 + Math.cos(angle) * radius,
      y: 160 + Math.sin(angle) * radius * 0.7,
      r: 10, color: C.gas,
      opacity: 0.55 + Math.sin(frame * 0.08 + i * 0.5) * 0.25,
    };
  });

  const gasFacts = ["形状随容器充满改变", "体积随容器改变", "分子间隙很大，自由飞散", "例：空气、水蒸气"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>💨 气态 — 自由飞散</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>分子高速飞散，充满整个容器</div>
      </div>

      {/* Left: molecule visualization */}
      <div style={{
        position: "absolute", top: 140, left: 60, width: 480, height: 320,
        background: "rgba(251,191,36,.04)", border: "2px solid rgba(251,191,36,.25)",
        borderRadius: 20, overflow: "hidden", opacity: contentOp,
      }}>
        <svg width="480" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
          {gasMolecules.map((m, i) => (
            <Molecule key={i} {...m} />
          ))}
        </svg>
        <div style={{
          position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center",
          fontSize: 18, color: C.gas, fontFamily: "'PingFang SC',sans-serif",
        }}>🔬 气体分子模型（分子间距很大，乱序飞散）</div>
      </div>

      {/* Right: facts */}
      <div style={{
        position: "absolute", top: 145, right: 60, width: 360,
        opacity: contentOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(251,191,36,.08)", border: "2px solid rgba(251,191,36,.35)",
          borderRadius: 20, padding: "28px 24px",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💨</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.gas, marginBottom: 16 }}>气态</div>
          {gasFacts.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
              opacity: interpolate(frame, [30 + i * 12, 45 + i * 12], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gas, flexShrink: 0 }} />
              <span style={{ fontSize: 24, color: "#e2e8f0" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: C.muted }}>
          ✨ 生活中的气体：
          <span style={{ color: C.gas }}> 💨空气 · 💧水蒸气 · 🌬️风 · 🎈氦气 · 🔥烟雾</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：六种变化总结 ───────────────────────────────────
const ChangesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const changes = [
    { from: "固", to: "液", name: "熔化", icon: "🔥", color: "#f87171", desc: "加热↑",  delay: 15 },
    { from: "液", to: "固", name: "凝固", icon: "❄️", color: C.solid,   desc: "冷却↓",  delay: 28 },
    { from: "液", to: "气", name: "汽化", icon: "♨️", color: C.gas,     desc: "加热↑",  delay: 41 },
    { from: "气", to: "液", name: "液化", icon: "🌧️", color: C.liquid,  desc: "冷却↓",  delay: 54 },
    { from: "固", to: "气", name: "升华", icon: "⭐", color: C.purple,  desc: "加热↑",  delay: 67 },
    { from: "气", to: "固", name: "凝华", icon: "✨", color: "#a5f3fc", desc: "冷却↓",  delay: 80 },
  ];

  // State circles
  const stateCircles = [
    { label: "固", emoji: "🧊", x: 300, y: 260, color: C.solid },
    { label: "液", emoji: "💧", x: 960, y: 260, color: C.liquid },
    { label: "气", emoji: "💨", x: 1620, y: 260, color: C.gas },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 45, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🔄 六种状态变化</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>温度变化驱动物质在三态之间转变</div>
      </div>

      {/* State Circles */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
           viewBox="0 0 1920 1080">
        {stateCircles.map((s, i) => {
          const prog = spring({ frame: frame - 10 - i * 8, fps, config: { stiffness: 80, damping: 18 } });
          const op = Math.min(prog, 1);
          return (
            <g key={s.label} opacity={op}>
              <circle cx={s.x} cy={s.y} r={100} fill={s.color + "1a"} stroke={s.color} strokeWidth={3} />
              <text x={s.x} y={s.y - 10} textAnchor="middle" fontSize={52} fontFamily="serif">{s.emoji}</text>
              <text x={s.x} y={s.y + 50} textAnchor="middle" fontSize={38} fontWeight="bold"
                fill={s.color} fontFamily="'PingFang SC',sans-serif">{s.label}态</text>
            </g>
          );
        })}

        {/* Change arrows */}
        {changes.map((c, i) => {
          const op = interpolate(frame, [c.delay, c.delay + 18], [0, 1], { extrapolateRight: "clamp" });
          const stateX = { "固": 300, "液": 960, "气": 1620 };
          const fromX = stateX[c.from as keyof typeof stateX];
          const toX = stateX[c.to as keyof typeof stateX];
          const isUpward = i % 2 === 0; // alternate top/bottom arrows for bidirectional
          const arcY = isUpward ? 120 : 400;
          const mx = (fromX + toX) / 2;
          const arrowDir = toX > fromX ? 1 : -1;

          // Arrow path
          const d = `M ${fromX + 110 * arrowDir} ${260} Q ${mx} ${arcY} ${toX - 110 * arrowDir} ${260}`;

          return (
            <g key={c.name} opacity={op}>
              <path d={d} fill="none" stroke={c.color} strokeWidth={3} strokeDasharray="8,4" />
              {/* Label box */}
              <rect x={mx - 70} y={arcY - 40} width={140} height={36} rx={8}
                fill={c.color + "22"} stroke={c.color} strokeWidth={1.5} />
              <text x={mx} y={arcY - 16} textAnchor="middle"
                fontSize={24} fill={c.color} fontWeight="bold"
                fontFamily="'PingFang SC',sans-serif">{c.icon} {c.name}</text>
              <text x={mx} y={arcY + 10} textAnchor="middle"
                fontSize={20} fill={C.muted}
                fontFamily="'PingFang SC',sans-serif">{c.desc}</text>
            </g>
          );
        })}
      </svg>

      {/* Bottom summary */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: "#a5f3fc" }}>
          💡 记忆口诀：<span style={{ color: C.gas }}>加热升温→物质变稀散；冷却降温→物质变紧密</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const SolidLiquidGasVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><SolidScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><LiquidScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><GasScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><ChangesScene /></Sequence>
    </AbsoluteFill>
  );
};
