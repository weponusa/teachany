import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

export const ThermiteReaction: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const progress = Math.min(frame / (fps * 3), 1);
  const sparkCount = 60;
  const sparks = Array.from({ length: sparkCount }).map((_, i) => {
    const seed = i * 137.5;
    const angle = seed % (Math.PI * 2);
    const speed = 3 + (seed % 7);
    const spread = 120 + (seed % 200);
    const cx = width / 2;
    const cy = height / 2 + 40;
    const t = Math.max(0, (frame - 10 - (i % 15)) / 40);
    const r = t * spread;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r - t * t * 180;
    const alpha = t > 0 ? Math.max(0, 1 - t) : 0;
    const size = 3 + (seed % 5);
    const colors = ["#fbbf24", "#f87171", "#fb923c", "#ffd166"];
    const color = colors[i % colors.length];
    return { x, y, size, color, alpha };
  });

  const meltRadius = Math.max(0, (frame - 30) * 3.5);
  const textOpacity = frame > 80 ? Math.min(1, (frame - 80) / 30) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      <svg width={width} height={height}>
        {/* Background grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 36} x2={width} y2={i * 36} stroke="rgba(148,163,184,0.06)" strokeWidth={1} />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 43} y1={0} x2={i * 43} y2={height} stroke="rgba(148,163,184,0.06)" strokeWidth={1} />
        ))}

        {/* Reaction vessel */}
        <rect x={width / 2 - 160} y={height / 2 + 20} width={320} height={60} rx={8} fill="#1e293b" stroke="rgba(148,163,184,0.25)" strokeWidth={2} />
        <text x={width / 2} y={height / 2 + 55} textAnchor="middle" fill="#94a3b8" fontSize={16} fontFamily="sans-serif">铝粉 + 氧化铁</text>

        {/* Molten pool */}
        {meltRadius > 0 && (
          <ellipse cx={width / 2} cy={height / 2 + 110} rx={meltRadius} ry={meltRadius * 0.35} fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth={2} />
        )}

        {/* Sparks */}
        {sparks.map((s, i) => (
          s.alpha > 0 && (
            <circle key={i} cx={s.x} cy={s.y} r={s.size} fill={s.color} opacity={s.alpha} />
          )
        ))}

        {/* Glow */}
        <radialGradient id="glow">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15 * progress} />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
        </radialGradient>
        <circle cx={width / 2} cy={height / 2 + 50} r={200} fill="url(#glow)" />
      </svg>

      {/* Overlay text */}
      <div style={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: textOpacity,
        color: "#e2e8f0",
        fontFamily: "sans-serif",
      }}>
        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>铝热反应</div>
        <div style={{ fontSize: 20, color: "#fbbf24", fontFamily: "'Times New Roman', serif" }}>2Al + Fe₂O₃ —高温→ 2Fe + Al₂O₃ + 大量热</div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: textOpacity,
        color: "#94a3b8",
        fontSize: 16,
      }}>
        温度可达 2500°C 以上 · 用于焊接钢轨
      </div>
    </AbsoluteFill>
  );
};
