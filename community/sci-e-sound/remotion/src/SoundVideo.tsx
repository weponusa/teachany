import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#060c1a",
  bg2: "#0a1628",
  card: "rgba(10,22,40,0.92)",
  text: "#f0f9ff",
  muted: "#94a3b8",
  primary: "#38bdf8",
  secondary: "#34d399",
  accent: "#fbbf24",
  purple: "#a78bfa",
  pink: "#f472b6",
  wave: "#38bdf8",
};

// ── Ripple component used across scenes ─────────────────
const Ripple: React.FC<{
  cx: number; cy: number; frame: number; delay: number;
  color: string; maxR: number; count?: number;
}> = ({ cx, cy, frame, delay, color, maxR, count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const f = frame - delay - i * 18;
        const progress = Math.max(0, Math.min(1, f / 60));
        const r = progress * maxR;
        const opacity = (1 - progress) * 0.6;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={3}
            opacity={opacity}
          />
        );
      })}
    </>
  );
};

// ── Waveform line ─────────────────────────────────────
const Waveform: React.FC<{
  frame: number; width: number; height: number;
  color: string; amplitude: number; frequency: number; phase: number;
}> = ({ frame, width, height, color, amplitude, frequency, phase }) => {
  const points: string[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = (i / steps) * Math.PI * 2 * frequency + frame * 0.1 + phase;
    const y = height / 2 + Math.sin(t) * amplitude;
    points.push(`${x},${y}`);
  }
  return (
    <polyline
      points={points.join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={3}
      opacity={0.85}
    />
  );
};

// ════════════════════════════════════════════════════════
// 场景1: 标题 (frames 0–89)
// ════════════════════════════════════════════════════════
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 22], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagsOp = interpolate(frame, [40, 58], [0, 1], { extrapolateRight: "clamp" });
  const iconScale = spring({ frame: frame - 5, fps, config: { stiffness: 110, damping: 13 } });

  const W = 1920, H = 1080;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.18) 0%, transparent 65%), ${C.bg}`,
      overflow: "hidden",
    }}>
      {/* Background wave rings */}
      <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
        <Ripple cx={W/2} cy={H/2} frame={frame} delay={0} color={C.wave} maxR={600} count={6} />
        <Ripple cx={W/2} cy={H/2} frame={frame} delay={10} color="#a78bfa" maxR={400} count={4} />
      </svg>

      {/* Speaker icon */}
      <div style={{
        position: "absolute", top: 170, left: "50%",
        transform: `translateX(-50%) scale(${Math.min(iconScale, 1)})`,
        fontSize: 110,
        filter: "drop-shadow(0 0 30px rgba(56,189,248,0.7))",
      }}>🔊</div>

      {/* Title */}
      <div style={{
        position: "absolute", top: 320, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        fontSize: 100, fontWeight: 900,
        background: "linear-gradient(135deg,#fff 0%,#38bdf8 60%,#a78bfa 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>声音的产生与传播</div>

      {/* Subtitle */}
      <div style={{
        position: "absolute", top: 450, left: 0, right: 0, textAlign: "center",
        opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 38, color: C.muted,
      }}>小学科学 G4 · 物质科学</div>

      {/* Tags */}
      <div style={{
        position: "absolute", top: 540, left: 0, right: 0, opacity: tagsOp,
        display: "flex", justifyContent: "center", gap: 28,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🎵 振动产生声音", "🌊 传播介质对比", "🎚️ 三要素探索", "🔄 回声与应用"].map((t, i) => {
          const tagOp = interpolate(frame, [40 + i * 8, 58 + i * 8], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "14px 30px", borderRadius: 99,
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.38)",
              color: C.primary, fontSize: 28, opacity: tagOp,
            }}>{t}</div>
          );
        })}
      </div>

      {/* Animated waveform at bottom */}
      <svg style={{ position: "absolute", bottom: 60, left: 0, right: 0 }} width={W} height={80}>
        <Waveform frame={frame} width={W} height={80} color={C.primary} amplitude={22} frequency={6} phase={0} />
        <Waveform frame={frame} width={W} height={80} color="#a78bfa" amplitude={14} frequency={9} phase={2} />
      </svg>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════
// 场景2: 振动产生声音 (frames 90–239)
// ════════════════════════════════════════════════════════
const VibrationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const W = 1920, H = 1080;

  // Tuning fork vibration: oscillates
  const forkVib = Math.sin(frame * 0.35) * 18;
  const forkScale = 1 + Math.abs(Math.sin(frame * 0.35)) * 0.06;

  // Ripples from fork center
  const rippleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  // Text labels
  const label1Op = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const label2Op = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const label3Op = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  // Drum animation
  const drumOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const drumVib = Math.abs(Math.sin(frame * 0.28)) * 16;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 40% 50%, rgba(56,189,248,0.12) 0%, transparent 55%), ${C.bg}`,
    }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🎵 振动产生声音</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 10 }}>物体振动→声音 · 停止振动→消音</div>
      </div>

      {/* Left: Tuning fork + ripples */}
      <svg style={{ position: "absolute", top: 130, left: 60, opacity: rippleOp }}
        width={780} height={750}>
        {/* Ripple rings from fork tip */}
        {Array.from({ length: 7 }).map((_, i) => {
          const f = frame - i * 14;
          const prog = Math.max(0, Math.min(1, f / 55));
          const r = 40 + prog * 260;
          const op = (1 - prog) * 0.55;
          return (
            <ellipse key={i} cx={400} cy={360} rx={r} ry={r * 0.45}
              fill="none" stroke={C.primary} strokeWidth={2.5} opacity={op} />
          );
        })}

        {/* Fork body */}
        <g transform={`translate(${400 + forkVib * 0.3},200) scale(${forkScale})`}>
          {/* U shape */}
          <rect x={-8} y={0} width={16} height={140} rx={4} fill="#94a3b8" />
          <rect x={40} y={0} width={16} height={140} rx={4} fill="#94a3b8" />
          <rect x={-8} y={-32} width={64} height={40} rx={20} fill="#94a3b8" />
          {/* Handle */}
          <rect x={12} y={140} width={24} height={80} rx={6} fill="#64748b" />
          {/* Vibration arrows */}
          <g opacity={Math.abs(Math.sin(frame * 0.35)) * 0.9 + 0.1}>
            <polygon points="-32,40 -14,40 -14,60 -32,60" fill={C.primary} opacity={0.8}
              transform={`translate(${-forkVib * 0.5},0)`} />
            <polygon points="70,40 52,40 52,60 70,60" fill={C.primary} opacity={0.8}
              transform={`translate(${forkVib * 0.5},0)`} />
            <text x={-58} y={57} fill={C.primary} fontSize={24} fontFamily="sans-serif">◀▶</text>
          </g>
        </g>

        {/* Label */}
        <text x={390} y={460} textAnchor="middle" fill={C.primary} fontSize={28}
          fontFamily="'PingFang SC',sans-serif" opacity={label1Op}>音叉振动 → 空气振动 → 声音</text>
        {/* Particle dots showing air compression */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const dist = 130 + Math.sin(frame * 0.3 + i * 0.5) * 20;
          const px = 400 + Math.cos(angle) * dist;
          const py = 360 + Math.sin(angle) * dist * 0.45;
          return <circle key={i} cx={px} cy={py} r={5} fill={C.primary} opacity={0.7} />;
        })}
      </svg>

      {/* Right: Drum */}
      <div style={{
        position: "absolute", top: 200, right: 80, width: 500,
        opacity: drumOp, textAlign: "center",
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 100, transform: `scaleY(${1 + drumVib / 80})` }}>🥁</div>
        <div style={{ fontSize: 30, color: C.secondary, marginTop: 16, fontWeight: 700 }}>
          鼓面振动
        </div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          敲击→鼓膜振动→声音
        </div>
        {/* Vibration indicator bar */}
        <div style={{
          marginTop: 24, height: 8, borderRadius: 4,
          background: `linear-gradient(90deg, ${C.secondary}, transparent)`,
          width: `${40 + Math.abs(Math.sin(frame * 0.28)) * 60}%`,
          transition: "width 0.1s",
        }} />
      </div>

      {/* Bottom: Key concept boxes */}
      <div style={{
        position: "absolute", bottom: 44, left: 60, right: 60,
        display: "flex", gap: 32, fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { icon: "✅", text: "振动→声音产生", color: C.secondary, op: label1Op },
          { icon: "⏹️", text: "停止振动→声音消失", color: C.accent, op: label2Op },
          { icon: "🤚", text: "手摸发声物体感受振动", color: C.primary, op: label3Op },
        ].map((b, i) => (
          <div key={i} style={{
            flex: 1, background: C.card, borderRadius: 16, padding: "20px 24px",
            border: `1.5px solid ${b.color}44`, opacity: b.op,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 40 }}>{b.icon}</span>
            <span style={{ fontSize: 26, color: "#e2e8f0" }}>{b.text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════
// 场景3: 声音三要素 (frames 240–389)
// ════════════════════════════════════════════════════════
const ThreeElementsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const W = 1920, H = 1080;

  // Each element appears with delay
  const el1Op = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const el2Op = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const el3Op = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" });

  // Animated waveforms for each property
  // High pitch = high frequency
  const highFreqAmpl = 18;
  const highFreqFreq = 12;
  // Low pitch = low frequency
  const lowFreqAmpl = 18;
  const lowFreqFreq = 4;
  // Loud = large amplitude
  const loudAmpl = 40;
  // Quiet = small amplitude
  const quietAmpl = 10;

  const svgW = 460, svgH = 120;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(167,139,250,0.12) 0%, transparent 55%), ${C.bg}`,
    }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🎚️ 声音的三要素</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>音调 · 响度 · 音色</div>
      </div>

      {/* Three cards side by side */}
      <div style={{
        position: "absolute", top: 148, left: 60, right: 60,
        display: "flex", gap: 36,
      }}>

        {/* 1. 音调 Pitch */}
        <div style={{
          flex: 1, background: C.card, borderRadius: 22,
          border: `2px solid ${C.primary}55`,
          padding: "28px 24px", opacity: el1Op,
          fontFamily: "'PingFang SC',sans-serif",
        }}>
          <div style={{ fontSize: 52, marginBottom: 12, textAlign: "center" }}>🎵</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.primary, textAlign: "center", marginBottom: 8 }}>
            音调
          </div>
          <div style={{ fontSize: 22, color: C.muted, textAlign: "center", marginBottom: 18 }}>
            声音的高低 · 由频率决定
          </div>
          {/* High freq wave */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: C.accent }}>高音（高频）：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.accent} amplitude={highFreqAmpl} frequency={highFreqFreq} phase={0} />
              <line x1={0} y1={svgH/2} x2={svgW} y2={svgH/2} stroke="#ffffff22" strokeWidth={1} />
            </svg>
          </div>
          {/* Low freq wave */}
          <div>
            <span style={{ fontSize: 18, color: "#a5f3fc" }}>低音（低频）：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color="#a5f3fc" amplitude={lowFreqAmpl} frequency={lowFreqFreq} phase={1} />
              <line x1={0} y1={svgH/2} x2={svgW} y2={svgH/2} stroke="#ffffff22" strokeWidth={1} />
            </svg>
          </div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#cbd5e1", textAlign: "center" }}>
            振动越快 → 频率越高 → 音调越高
          </div>
        </div>

        {/* 2. 响度 Loudness */}
        <div style={{
          flex: 1, background: C.card, borderRadius: 22,
          border: `2px solid ${C.secondary}55`,
          padding: "28px 24px", opacity: el2Op,
          fontFamily: "'PingFang SC',sans-serif",
        }}>
          <div style={{ fontSize: 52, marginBottom: 12, textAlign: "center" }}>🔊</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.secondary, textAlign: "center", marginBottom: 8 }}>
            响度
          </div>
          <div style={{ fontSize: 22, color: C.muted, textAlign: "center", marginBottom: 18 }}>
            声音的大小 · 由振幅决定
          </div>
          {/* Loud wave */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: C.secondary }}>响（大振幅）：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.secondary} amplitude={loudAmpl} frequency={6} phase={0.5} />
              <line x1={0} y1={svgH/2} x2={svgW} y2={svgH/2} stroke="#ffffff22" strokeWidth={1} />
            </svg>
          </div>
          {/* Quiet wave */}
          <div>
            <span style={{ fontSize: 18, color: "#86efac" }}>轻（小振幅）：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color="#86efac" amplitude={quietAmpl} frequency={6} phase={0.5} />
              <line x1={0} y1={svgH/2} x2={svgW} y2={svgH/2} stroke="#ffffff22" strokeWidth={1} />
            </svg>
          </div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#cbd5e1", textAlign: "center" }}>
            振幅越大 → 响度越大 → 声音越响
          </div>
        </div>

        {/* 3. 音色 Timbre */}
        <div style={{
          flex: 1, background: C.card, borderRadius: 22,
          border: `2px solid ${C.purple}55`,
          padding: "28px 24px", opacity: el3Op,
          fontFamily: "'PingFang SC',sans-serif",
        }}>
          <div style={{ fontSize: 52, marginBottom: 12, textAlign: "center" }}>🎹</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.purple, textAlign: "center", marginBottom: 8 }}>
            音色
          </div>
          <div style={{ fontSize: 22, color: C.muted, textAlign: "center", marginBottom: 18 }}>
            声音的质感 · 由波形特征决定
          </div>
          {/* Different waveforms */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: C.purple }}>钢琴：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.purple} amplitude={22} frequency={7} phase={0} />
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.purple} amplitude={8} frequency={14} phase={1} />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 18, color: C.pink }}>小提琴：</span>
            <svg width={svgW} height={svgH} style={{ display: "block" }}>
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.pink} amplitude={20} frequency={7} phase={0.3} />
              <Waveform frame={frame} width={svgW} height={svgH}
                color={C.pink} amplitude={12} frequency={21} phase={0.8} />
            </svg>
          </div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#cbd5e1", textAlign: "center" }}>
            音色是声音的"指纹" · 乐器各不同
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif", fontSize: 28, color: C.accent,
      }}>
        💡 三要素记忆口诀：音调看频率，响度看振幅，音色看波形！
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════
// 场景4: 传播介质对比 (frames 390–539)
// ════════════════════════════════════════════════════════
const MediumScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const media = [
    {
      name: "固体",
      icon: "🪨",
      color: C.accent,
      example: "贴耳铁轨听声音",
      speed: "约5000 m/s",
      detail: "传声最快",
      barWidth: 95,
      delay: 15,
    },
    {
      name: "液体",
      icon: "💧",
      color: C.primary,
      example: "水中能听到声音",
      speed: "约1500 m/s",
      detail: "传声较快",
      barWidth: 60,
      delay: 50,
    },
    {
      name: "气体",
      icon: "💨",
      color: C.secondary,
      example: "空气中传播声音",
      speed: "约340 m/s",
      detail: "传声较慢",
      barWidth: 25,
      delay: 85,
    },
    {
      name: "真空",
      icon: "🚀",
      color: "#f87171",
      example: "太空中无法传声",
      speed: "0 m/s",
      detail: "不能传声",
      barWidth: 0,
      delay: 120,
    },
  ];

  const vacuumOp = interpolate(frame, [100, 125], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 30% 60%, rgba(34,211,153,0.1) 0%, transparent 55%), ${C.bg}`,
    }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🌊 声音的传播介质</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>固体 · 液体 · 气体 · 真空</div>
      </div>

      {/* Medium cards */}
      <div style={{
        position: "absolute", top: 150, left: 80, right: 80,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 36,
      }}>
        {media.map((m, i) => {
          const cardOp = interpolate(frame, [m.delay, m.delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const cardY = interpolate(frame, [m.delay, m.delay + 22], [20, 0], { extrapolateRight: "clamp" });
          const barW = interpolate(frame, [m.delay + 10, m.delay + 40], [0, m.barWidth], { extrapolateRight: "clamp" });
          const isVacuum = m.name === "真空";

          return (
            <div key={m.name} style={{
              background: isVacuum ? "rgba(248,113,113,0.06)" : C.card,
              borderRadius: 22, padding: "24px 28px",
              border: `2px solid ${m.color}44`,
              opacity: cardOp, transform: `translateY(${cardY}px)`,
              fontFamily: "'PingFang SC',sans-serif",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
                <span style={{ fontSize: 50 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: m.color }}>{m.name}</div>
                  <div style={{ fontSize: 22, color: C.muted }}>{m.detail}</div>
                </div>
                <div style={{
                  marginLeft: "auto", fontSize: 26, fontWeight: 700,
                  color: m.color, padding: "6px 14px",
                  background: `${m.color}18`, borderRadius: 12,
                }}>{m.speed}</div>
              </div>

              {/* Speed bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  height: 10, borderRadius: 5,
                  background: "#ffffff12",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${barW}%`, height: "100%",
                    background: isVacuum
                      ? "repeating-linear-gradient(45deg,#f8717188,#f8717100 6px)"
                      : `linear-gradient(90deg, ${m.color}, ${m.color}88)`,
                    borderRadius: 5,
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 24, color: "#e2e8f0" }}>
                {isVacuum ? (
                  <span style={{ color: "#f87171" }}>❌ {m.example}</span>
                ) : (
                  <span>✅ {m.example}</span>
                )}
              </div>

              {/* Animated wave for non-vacuum */}
              {!isVacuum && (
                <svg width="100%" height={40} style={{ marginTop: 8 }}>
                  <Waveform frame={frame + i * 20} width={440} height={40}
                    color={m.color} amplitude={10} frequency={5 - i * 1.2} phase={i * 0.8} />
                </svg>
              )}
              {isVacuum && (
                <div style={{
                  marginTop: 8, padding: "8px 16px", borderRadius: 10,
                  background: "rgba(248,113,113,0.1)", border: "1px solid #f8717144",
                  fontSize: 22, color: "#fca5a5", textAlign: "center",
                }}>
                  真空中没有介质 → 声音无法传播
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom conclusion */}
      <div style={{
        position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif", fontSize: 28, color: C.accent,
        padding: "12px 0",
        background: "rgba(10,22,40,0.85)",
      }}>
        🏆 传声速度：<span style={{ color: C.accent }}>固体</span> &gt;{" "}
        <span style={{ color: C.primary }}>液体</span> &gt;{" "}
        <span style={{ color: C.secondary }}>气体</span> &gt;{" "}
        <span style={{ color: "#f87171" }}>真空（不传声）</span>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════
// 场景5: 总结 (frames 540–659)
// ════════════════════════════════════════════════════════
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const W = 1920;

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "🎵",
      color: C.primary,
      title: "声音的产生",
      text: "物体振动产生声音\n停止振动→声音消失",
    },
    {
      icon: "🎚️",
      color: C.purple,
      title: "三要素",
      text: "音调（频率）\n响度（振幅）· 音色（波形）",
    },
    {
      icon: "🌊",
      color: C.secondary,
      title: "传播介质",
      text: "固体>液体>气体\n真空不传声",
    },
    {
      icon: "🔄",
      color: C.accent,
      title: "回声与应用",
      text: "反射形成回声\n蝙蝠超声波 · 海豚声呐",
    },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.1) 0%, transparent 65%), ${C.bg}`,
    }}>
      {/* Background waves */}
      <svg style={{ position: "absolute", bottom: 0, left: 0 }} width={W} height={120}>
        <Waveform frame={frame} width={W} height={120} color={C.primary} amplitude={20} frequency={5} phase={0} />
        <Waveform frame={frame} width={W} height={120} color={C.purple} amplitude={12} frequency={8} phase={2} />
      </svg>

      {/* Title */}
      <div style={{
        position: "absolute", top: 42, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🎯 课堂总结</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>声音的产生与传播 · 核心要点</div>
      </div>

      {/* Summary cards */}
      <div style={{
        position: "absolute", top: 160, left: 80, right: 80,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 32,
      }}>
        {points.map((p, i) => {
          const delay = 18 + i * 20;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              background: C.card, borderRadius: 22,
              border: `2px solid ${p.color}44`,
              padding: "30px 28px",
              display: "flex", gap: 24, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              fontFamily: "'PingFang SC',sans-serif",
            }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: `${p.color}1a`,
                border: `3px solid ${p.color}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 50, flexShrink: 0,
              }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 36, fontWeight: 800, color: p.color, marginBottom: 10,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 26, color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom motivational */}
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 32, color: C.accent,
        textShadow: `0 0 20px ${C.accent}66`,
      }}>
        🏅 恭喜你完成"声音的产生与传播"探索！继续加油！
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════
// 主 Composition
// ════════════════════════════════════════════════════════
export const SoundVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90} durationInFrames={150}><VibrationScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><ThreeElementsScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><MediumScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
