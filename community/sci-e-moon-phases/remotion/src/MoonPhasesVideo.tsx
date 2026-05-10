import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#060d1a",
  bg2: "#0a1628",
  card: "rgba(10,22,40,0.85)",
  text: "#f0f9ff",
  muted: "#94a3b8",
  primary: "#38bdf8",
  accent: "#fbbf24",
  moon: "#e2d9c8",
  moonGlow: "#fde68a",
  earth: "#34d399",
  sun: "#fbbf24",
  newMoon: "#1e293b",
  fullMoon: "#fde68a",
};

// ── Stars background ───────────────────────────────────
const Stars: React.FC<{ count?: number }> = ({ count = 120 }) => {
  const stars = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (((i * 137.508 + 11) % 1920)),
        y: (((i * 73.1 + 7) % 1080)),
        r: 0.5 + ((i * 31) % 10) / 10 * 1.5,
        op: 0.3 + ((i * 17) % 10) / 10 * 0.7,
      });
    }
    return arr;
  }, [count]);

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op} />
      ))}
    </svg>
  );
};

// ── Moon phase shape renderer ──────────────────────────
// angle: 0=new, 90=first quarter, 180=full, 270=last quarter
const MoonPhaseShape: React.FC<{
  size: number;
  angle: number; // degrees 0–360
  style?: React.CSSProperties;
}> = ({ size, angle, style }) => {
  const r = size / 2;
  // Compute illuminated fraction and direction
  // angle=0: new moon (dark), 90: waxing crescent→first quarter, 180: full moon, 270: last quarter
  const rad = (angle * Math.PI) / 180;
  // terminator x position (cos of phase angle)
  const tx = Math.cos(rad) * r;
  const isWaxing = angle >= 0 && angle <= 180;

  // Build SVG clip path for moon phase
  const cx = r;
  const cy = r;

  // Full moon circle path
  const moonPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;

  // The lit portion:
  // - Right half always visible for waxing (0-180)
  // - Left half always visible for waning (180-360)
  // - terminator is an ellipse with semi-axis |cos(angle)| * r

  const absX = Math.abs(tx);
  const ellipseRx = absX < 0.5 ? 0.5 : absX;

  // For new moon (angle ≈ 0 or 360): dark circle
  // For full moon (angle ≈ 180): bright circle
  if (angle <= 5 || angle >= 355) {
    // New moon - nearly dark
    return (
      <div style={{ width: size, height: size, position: "relative", ...style }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r - 1} fill={C.newMoon} />
          <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
        </svg>
      </div>
    );
  }
  if (angle >= 175 && angle <= 185) {
    // Full moon
    return (
      <div style={{ width: size, height: size, position: "relative", ...style }}>
        <svg width={size} height={size}>
          <defs>
            <radialGradient id="fullmoonGrad" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="60%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d4a017" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r - 1} fill="url(#fullmoonGrad)" />
          <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(253,230,138,0.6)" strokeWidth={2} />
        </svg>
      </div>
    );
  }

  // Waxing (0-180): right side lit
  // Waning (180-360): left side lit
  const sweepDir = isWaxing ? (angle < 90 ? 1 : 0) : (angle < 270 ? 1 : 0);

  // Build lit area as SVG path
  // The lit side is always a semicircle on one side, with terminator curve on the other
  let litPath: string;
  if (isWaxing) {
    // Right side lit, terminator on left of center going right
    // Right semicircle: from top to bottom along right side
    // Terminator: ellipse from bottom to top
    const rx = ellipseRx;
    if (angle < 90) {
      // Crescent: small lit area on right
      litPath = `M ${cx} ${cy - r}
        A ${r} ${r} 0 0 1 ${cx} ${cy + r}
        A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else {
      // Gibbous: large lit area, terminator cuts left
      litPath = `M ${cx} ${cy - r}
        A ${r} ${r} 0 0 1 ${cx} ${cy + r}
        A ${rx} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    }
  } else {
    // Left side lit, terminator on right
    const rx = ellipseRx;
    if (angle < 270) {
      // Waning gibbous
      litPath = `M ${cx} ${cy - r}
        A ${r} ${r} 0 0 0 ${cx} ${cy + r}
        A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else {
      // Waning crescent
      litPath = `M ${cx} ${cy - r}
        A ${r} ${r} 0 0 0 ${cx} ${cy + r}
        A ${rx} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    }
  }

  return (
    <div style={{ width: size, height: size, position: "relative", ...style }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id={`moonGrad${Math.round(angle)}`} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <clipPath id={`moonClip${Math.round(angle)}`}>
            <circle cx={cx} cy={cy} r={r - 1} />
          </clipPath>
        </defs>
        {/* Dark base */}
        <circle cx={cx} cy={cy} r={r - 1} fill={C.newMoon} />
        {/* Lit portion */}
        <path
          d={litPath}
          fill={`url(#moonGrad${Math.round(angle)})`}
          clipPath={`url(#moonClip${Math.round(angle)})`}
        />
        {/* Outline */}
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      </svg>
    </div>
  );
};

// ── Scene 1: Title ──────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });

  // Animated moon phases row
  const moonPhases = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stars count={150} />
      {/* Subtle nebula glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.08) 0%, transparent 60%)",
      }} />

      {/* Moon phases row at top */}
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 20,
        opacity: tagOp,
      }}>
        {moonPhases.map((angle, i) => (
          <MoonPhaseShape key={i} size={60} angle={angle} />
        ))}
      </div>

      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        {/* Badge */}
        <div style={{
          opacity: tagOp,
          background: "rgba(56,189,248,0.12)",
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 99, padding: "8px 24px",
          color: C.primary, fontSize: 28, marginBottom: 32,
          fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        }}>🌙 小学科学 G4 · 地球与宇宙科学</div>

        {/* Title */}
        <div style={{
          fontSize: 110, fontWeight: 900,
          background: "linear-gradient(135deg, #fff 20%, #fde68a 60%, #38bdf8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          textAlign: "center", lineHeight: 1.1,
          marginBottom: 28,
        }}>月相变化</div>

        {/* Subtitle */}
        <div style={{
          fontSize: 38, color: C.muted, opacity: subOp,
          fontFamily: "'PingFang SC',sans-serif",
          marginBottom: 48,
        }}>探索月亮为何变换形状的奥秘</div>

        {/* Key points */}
        <div style={{
          display: "flex", gap: 24, opacity: subOp,
          fontFamily: "'PingFang SC',sans-serif",
        }}>
          {["🌑 新月", "🌓 上弦月", "🌕 满月", "🌗 下弦月"].map((t, i) => (
            <div key={i} style={{
              padding: "14px 32px", borderRadius: 99,
              background: "rgba(253,230,138,0.1)", border: "1px solid rgba(253,230,138,0.3)",
              color: C.moonGlow, fontSize: 30,
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", opacity: subOp,
        color: C.muted, fontSize: 26,
        fontFamily: "'PingFang SC',sans-serif",
      }}>月相周期约 29.5 天 · 农历初一新月 · 十五满月</div>
    </AbsoluteFill>
  );
};

// ── Scene 2: Cause - Orbital Diagram ───────────────────
const CauseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const orbitOp = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });
  const textOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  // Animate moon orbit (top-view)
  const moonAngle = interpolate(frame, [0, 120], [0, 360], { extrapolateRight: "clamp" });
  const moonRad = (moonAngle * Math.PI) / 180;

  const cx = 960; // center x
  const cy = 580; // center y
  const orbitR = 260;
  const moonX = cx + Math.sin(moonRad) * orbitR;
  const moonY = cy - Math.cos(moonRad) * orbitR;

  // Sun is far to the left
  const sunX = 180;
  const sunY = cy;

  // Compute phase angle from sun perspective
  // Moon phase depends on elongation from sun
  const phaseAngle = moonAngle; // 0=new (between earth and sun), 180=full

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stars count={100} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🌙 月相成因：俯视图</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>月球绕地球公转 · 被照亮的部分不同</div>
      </div>

      {/* Sun rays */}
      <svg style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}>
        {[...Array(8)].map((_, i) => {
          const rayAngle = (i * 45) * Math.PI / 180;
          const x2 = sunX + Math.cos(rayAngle) * 1800;
          const y2 = sunY + Math.sin(rayAngle) * 1800;
          return (
            <line key={i}
              x1={sunX} y1={sunY} x2={x2} y2={y2}
              stroke="rgba(251,191,36,0.06)" strokeWidth={2}
            />
          );
        })}
        {/* Light beam toward earth */}
        <rect
          x={sunX + 60} y={cy - 40}
          width={cx - sunX - 80} height={80}
          fill="rgba(251,191,36,0.04)"
        />

        {/* Orbit ring */}
        <circle cx={cx} cy={cy} r={orbitR}
          fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth={2}
          strokeDasharray="12 8" opacity={orbitOp}
        />

        {/* Earth orbit glow */}
        <circle cx={cx} cy={cy} r={4}
          fill="rgba(52,211,153,0.3)"
        />

        {/* Moon position indicator line */}
        <line
          x1={cx} y1={cy}
          x2={moonX} y2={moonY}
          stroke="rgba(253,230,138,0.2)" strokeWidth={1.5}
          strokeDasharray="6 4" opacity={orbitOp}
        />
      </svg>

      {/* Sun */}
      <div style={{
        position: "absolute",
        left: sunX - 55, top: cy - 55,
        opacity: orbitOp,
      }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "radial-gradient(circle, #fff7c0 0%, #fbbf24 50%, #d97706 100%)",
          boxShadow: "0 0 60px 20px rgba(251,191,36,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48,
        }}>☀️</div>
        <div style={{
          textAlign: "center", color: C.accent, fontSize: 22, marginTop: 8,
          fontFamily: "'PingFang SC',sans-serif",
        }}>太阳</div>
      </div>

      {/* Earth */}
      <div style={{
        position: "absolute",
        left: cx - 40, top: cy - 40,
        opacity: orbitOp,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #60a5fa 0%, #1d4ed8 50%, #0f172a 100%)",
          boxShadow: "0 0 30px 8px rgba(52,211,153,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 38,
        }}>🌍</div>
        <div style={{
          textAlign: "center", color: C.earth, fontSize: 20, marginTop: 6,
          fontFamily: "'PingFang SC',sans-serif",
        }}>地球</div>
      </div>

      {/* Animated Moon */}
      <div style={{
        position: "absolute",
        left: moonX - 28, top: moonY - 28,
        opacity: orbitOp,
      }}>
        <MoonPhaseShape size={56} angle={phaseAngle} />
      </div>

      {/* Sunlight label */}
      <div style={{
        position: "absolute",
        left: (sunX + cx) / 2 - 80, top: cy - 80,
        opacity: orbitOp,
        background: "rgba(251,191,36,0.1)",
        border: "1px solid rgba(251,191,36,0.3)",
        borderRadius: 8, padding: "6px 16px",
        color: C.accent, fontSize: 20,
        fontFamily: "'PingFang SC',sans-serif",
      }}>☀️ 太阳光</div>

      {/* Right panel: explanation */}
      <div style={{
        position: "absolute",
        right: 60, top: 200,
        width: 420, opacity: textOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(10,22,40,0.9)", border: "1px solid rgba(56,189,248,0.25)",
          borderRadius: 16, padding: "24px 28px",
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>月相成因</div>
          {[
            { icon: "🔄", text: "月球绕地球公转，周期约29.5天" },
            { icon: "💡", text: "月球本身不发光，反射太阳光" },
            { icon: "👁️", text: "地球上看到被照亮的部分不同" },
            { icon: "🌙", text: "形成8种不同的月相形态" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              marginBottom: 14, fontSize: 22, color: "#cbd5e1",
              lineHeight: 1.5,
            }}>
              <span style={{ fontSize: 26 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: 8 Moon Phases ─────────────────────────────
const PhasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const phases = [
    { name: "新月", emoji: "🌑", angle: 0, lunar: "初一", desc: "月亮看不见" },
    { name: "娥眉月", emoji: "🌒", angle: 45, lunar: "初三", desc: "细细弯月牙" },
    { name: "上弦月", emoji: "🌓", angle: 90, lunar: "初七", desc: "右半圆，像D" },
    { name: "盈凸月", emoji: "🌔", angle: 135, lunar: "十一", desc: "大半圆（右）" },
    { name: "满月", emoji: "🌕", angle: 180, lunar: "十五", desc: "圆圆的月亮" },
    { name: "亏凸月", emoji: "🌖", angle: 225, lunar: "十八", desc: "大半圆（左）" },
    { name: "下弦月", emoji: "🌗", angle: 270, lunar: "二十三", desc: "左半圆，像C" },
    { name: "残月", emoji: "🌘", angle: 315, lunar: "二十七", desc: "细月牙（左）" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stars count={80} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>8个主要月相</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>月相周期约 29.5 天</div>
      </div>

      {/* Phases grid - 2 rows of 4 */}
      <div style={{
        position: "absolute", top: 170, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
      }}>
        {phases.map((p, i) => {
          const delay = 15 + i * 12;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.7 + 0.3 * Math.min(prog, 1);

          const isHighlight = p.angle === 0 || p.angle === 90 || p.angle === 180 || p.angle === 270;

          return (
            <div key={p.name} style={{
              opacity: op, transform: `scale(${sc})`,
              background: isHighlight ? "rgba(56,189,248,0.08)" : "rgba(10,22,40,0.7)",
              border: `1px solid ${isHighlight ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 16, padding: "20px 16px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 8,
            }}>
              {/* Moon SVG shape */}
              <MoonPhaseShape size={80} angle={p.angle} />
              {/* Name */}
              <div style={{
                fontSize: 24, fontWeight: 700, color: isHighlight ? C.primary : "#fff",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{p.name}</div>
              {/* Lunar date */}
              <div style={{
                fontSize: 18, color: C.accent,
                fontFamily: "'PingFang SC',sans-serif",
              }}>农历{p.lunar}</div>
              {/* Desc */}
              <div style={{
                fontSize: 16, color: C.muted, textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{p.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Cycle arrow at bottom */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        color: C.muted, fontSize: 24,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        🔄 新月 → 娥眉月 → 上弦月 → 盈凸月 → 满月 → 亏凸月 → 下弦月 → 残月 → 新月
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Lunar Calendar ────────────────────────────
const LunarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const lunarData = [
    { day: "初一", angle: 0, name: "新月", emoji: "🌑", desc: "月亮几乎不可见" },
    { day: "初七", angle: 90, name: "上弦月", emoji: "🌓", desc: "右半圆，像字母D" },
    { day: "十五", angle: 180, name: "满月", emoji: "🌕", desc: "完整圆月" },
    { day: "二十三", angle: 270, name: "下弦月", emoji: "🌗", desc: "左半圆，像字母C" },
  ];

  const festivals = [
    { icon: "🏮", name: "元宵节", date: "正月十五", phase: "满月" },
    { icon: "🥮", name: "中秋节", date: "八月十五", phase: "满月" },
    { icon: "🎇", name: "除夕", date: "腊月三十", phase: "新月后" },
    { icon: "🐉", name: "端午节", date: "五月初五", phase: "峨眉月" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stars count={80} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🗓️ 农历与月相</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>中国传统历法与月相的关系</div>
      </div>

      {/* Lunar day → phase mapping */}
      <div style={{
        position: "absolute", top: 180, left: 60, right: 60,
        display: "flex", gap: 24, justifyContent: "center",
        opacity: interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        {lunarData.map((item, i) => {
          const delay = 25 + i * 15;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 16 } });
          return (
            <div key={item.day} style={{
              opacity: Math.min(prog, 1),
              transform: `scale(${0.7 + 0.3 * Math.min(prog, 1)})`,
              background: "rgba(10,22,40,0.85)",
              border: "1px solid rgba(253,230,138,0.3)",
              borderRadius: 16, padding: "24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, flex: 1,
            }}>
              <div style={{
                fontSize: 36, fontWeight: 900, color: C.accent,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{item.day}</div>
              <MoonPhaseShape size={72} angle={item.angle} />
              <div style={{
                fontSize: 24, fontWeight: 700, color: "#fff",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{item.name}</div>
              <div style={{
                fontSize: 18, color: C.muted, textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{item.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Festivals */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60,
        opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{
          textAlign: "center", color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 16,
          fontFamily: "'PingFang SC',sans-serif",
        }}>🏮 中国传统节日与月相</div>
        <div style={{ display: "flex", gap: 20 }}>
          {festivals.map((f, i) => (
            <div key={i} style={{
              flex: 1, background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 12, padding: "16px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <div style={{ fontSize: 40 }}>{f.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, fontFamily: "'PingFang SC',sans-serif" }}>{f.name}</div>
              <div style={{ fontSize: 18, color: C.muted, fontFamily: "'PingFang SC',sans-serif" }}>{f.date}</div>
              <div style={{
                fontSize: 16, color: C.primary, background: "rgba(56,189,248,0.1)",
                borderRadius: 99, padding: "3px 12px",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{f.phase}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: Summary ───────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const cardsOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const mnemonicOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const summaryItems = [
    { icon: "🔄", title: "周期", text: "约29.5天一个循环\n农历一个月" },
    { icon: "💡", title: "成因", text: "月球公转位置不同\n被照亮部分各异" },
    { icon: "🌙", title: "8月相", text: "新月→上弦→满月\n→下弦→新月" },
    { icon: "🗓️", title: "农历", text: "初一新月\n十五满月" },
  ];

  // Animated 8 moons in arc at bottom
  const moonAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stars count={120} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: "#fff" }}>🎉 今日大收获！</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>月相变化的三大秘密</div>
      </div>

      {/* Summary cards */}
      <div style={{
        position: "absolute", top: 200, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
        opacity: cardsOp,
      }}>
        {summaryItems.map((item, i) => {
          const prog = spring({ frame: frame - 20 - i * 12, fps, config: { stiffness: 90, damping: 16 } });
          return (
            <div key={i} style={{
              opacity: Math.min(prog, 1),
              transform: `translateY(${interpolate(Math.min(prog, 1), [0, 1], [30, 0])}px)`,
              background: "rgba(10,22,40,0.9)",
              border: "1px solid rgba(56,189,248,0.25)",
              borderRadius: 16, padding: "24px 20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{item.icon}</div>
              <div style={{
                fontSize: 28, fontWeight: 700, color: C.primary, marginBottom: 10,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{item.title}</div>
              <div style={{
                fontSize: 22, color: "#cbd5e1", lineHeight: 1.6, whiteSpace: "pre-line",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{item.text}</div>
            </div>
          );
        })}
      </div>

      {/* Mnemonic */}
      <div style={{
        position: "absolute", bottom: 120, left: 120, right: 120,
        opacity: mnemonicOp,
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.3)",
        borderRadius: 16, padding: "24px 32px",
        textAlign: "center",
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 26, color: C.accent, fontWeight: 700, marginBottom: 10 }}>💡 记忆口诀</div>
        <div style={{ fontSize: 30, color: "#fff", lineHeight: 1.6 }}>
          上弦月像字母 <span style={{ color: C.primary, fontWeight: 900, fontSize: 36 }}>D</span>
          ，在傍晚西边天空出现 🌃<br />
          下弦月像字母 <span style={{ color: C.accent, fontWeight: 900, fontSize: 36 }}>C</span>
          ，在后半夜东边天空出现 🌅
        </div>
      </div>

      {/* 8 Moon phase row at bottom */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 16,
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        {moonAngles.map((angle, i) => (
          <MoonPhaseShape key={i} size={56} angle={angle} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Main composition ───────────────────────────────────
export const MoonPhasesVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  // 660 frames @ 30fps = 22s
  // Scene durations: 132, 132, 132, 132, 132 frames (5 × 132 = 660)
  const sceneDur = 132;

  return (
    <AbsoluteFill>
      {/* Background audio */}
      <Audio src={staticFile("audio/narration.mp3")} volume={0.7} />

      <Sequence from={0} durationInFrames={sceneDur}>
        <TitleScene />
      </Sequence>
      <Sequence from={sceneDur} durationInFrames={sceneDur}>
        <CauseScene />
      </Sequence>
      <Sequence from={sceneDur * 2} durationInFrames={sceneDur}>
        <PhasesScene />
      </Sequence>
      <Sequence from={sceneDur * 3} durationInFrames={sceneDur}>
        <LunarScene />
      </Sequence>
      <Sequence from={sceneDur * 4} durationInFrames={sceneDur}>
        <SummaryScene />
      </Sequence>
    </AbsoluteFill>
  );
};
