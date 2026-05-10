import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#070d1a",
  bg2: "#0c1a30",
  text: "#f0f9ff",
  muted: "#94a3b8",
  sun: "#fbbf24",
  ray: "#fde68a",
  shadow: "#1e2a3a",
  shadowDark: "#0f172a",
  blue: "#38bdf8",
  green: "#34d399",
  purple: "#a78bfa",
  orange: "#fb923c",
};

// ─── helpers ────────────────────────────────────────────
function LightRay({
  x1, y1, x2, y2, opacity, color = C.ray, width = 3,
}: {
  x1: number; y1: number; x2: number; y2: number;
  opacity: number; color?: string; width?: number;
}) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={width} opacity={opacity}
      strokeLinecap="round"
    />
  );
}

// ─── Scene 1: Title ─────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagsOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const sunScale = spring({ frame: frame - 5, fps, config: { stiffness: 80, damping: 16 } });
  const rayOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  // Sun rays animation
  const rayAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const rayPulse = Math.sin((frame / 30) * Math.PI) * 0.2 + 0.8;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 20%, rgba(251,191,36,.18) 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 80%, rgba(56,189,248,.12) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Background SVG rays */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: rayOp }}>
        {rayAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const len = 500 + Math.sin((frame / 20 + i) * 0.8) * 40;
          return (
            <line key={i}
              x1={960} y1={180}
              x2={960 + Math.cos(rad) * len}
              y2={180 + Math.sin(rad) * len}
              stroke={C.ray} strokeWidth={2}
              opacity={0.15 * rayPulse}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Sun */}
      <div style={{
        fontSize: 110,
        transform: `scale(${Math.min(sunScale, 1)})`,
        marginBottom: 24,
        filter: "drop-shadow(0 0 40px rgba(251,191,36,0.6))",
      }}>☀️</div>

      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg, #fff 30%, ${C.sun} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>光的传播与影子</div>

      <div style={{
        marginTop: 20, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G3 · 物质科学</div>

      <div style={{
        marginTop: 36, display: "flex", gap: 24, opacity: tagsOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["☀️ 光的直线传播", "🌑 影子形成", "🕐 一天影子变化"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 28px", borderRadius: 99,
            background: "rgba(251,191,36,.15)",
            border: "1px solid rgba(251,191,36,.35)",
            color: C.sun, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Light Travels Straight ────────────────────
const StraightLightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  // Ray grows from left to right over 60 frames
  const rayProgress = interpolate(frame, [10, 70], [0, 1], { extrapolateRight: "clamp" });
  const boardOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const textOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const svgW = 1440;
  const svgH = 500;
  const srcX = 80, srcY = 250;
  const endX = 1380, endY = 250;
  const curX = srcX + (endX - srcX) * rayProgress;

  // Three boards with holes
  const boards = [
    { x: 400, aligned: true },
    { x: 750, aligned: true },
    { x: 1100, aligned: true },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>💡 光沿直线传播</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>三孔实验：孔对齐，光才能穿过！</div>
      </div>

      {/* SVG diagram */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ position: "absolute", top: 160, left: "50%", transform: "translateX(-50%)", width: "90%", opacity: boardOp }}
      >
        {/* Torch / light source */}
        <text x={srcX - 10} y={270} fontSize={60} textAnchor="middle">🔦</text>

        {/* Light ray beam */}
        <defs>
          <linearGradient id="rayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.sun} stopOpacity="1" />
            <stop offset="100%" stopColor={C.ray} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <line
          x1={srcX + 40} y1={srcY}
          x2={curX} y2={srcY}
          stroke="url(#rayGrad)"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.95}
        />
        {/* Glow */}
        <line
          x1={srcX + 40} y1={srcY}
          x2={curX} y2={srcY}
          stroke={C.sun}
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.2}
        />

        {/* End target (wall / screen) */}
        {rayProgress > 0.85 && (
          <circle cx={endX + 20} cy={endY} r={18} fill={C.sun} opacity={interpolate(rayProgress, [0.85, 1], [0, 1])} />
        )}
        <rect x={endX + 8} y={endY - 100} width={28} height={200} rx={4} fill="#334155" opacity={0.9} />

        {/* Three boards */}
        {boards.map((b, i) => (
          <g key={i} opacity={boardOp}>
            {/* Board body */}
            <rect x={b.x - 18} y={srcY - 110} width={36} height={220} rx={6} fill="#1e40af" opacity={0.85} />
            {/* Hole */}
            <circle cx={b.x} cy={srcY} r={12} fill={C.bg} />
            {/* Label */}
            <text x={b.x} y={srcY + 145} fontSize={22} fill={C.blue} textAnchor="middle"
              fontFamily="PingFang SC,sans-serif">板{i + 1}</text>
          </g>
        ))}

        {/* Dotted arrow showing straight line */}
        <line
          x1={srcX + 40} y1={srcY - 55}
          x2={endX + 8} y2={srcY - 55}
          stroke={C.green} strokeWidth={2} strokeDasharray="12,8" opacity={0.4}
        />
        <text x={960} y={srcY - 65} fontSize={22} fill={C.green} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif" opacity={0.6}>——光走直线——</text>
      </svg>

      {/* Bottom note */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        textAlign: "center", opacity: textOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(251,191,36,.12)",
          border: "1px solid rgba(251,191,36,.3)",
          borderRadius: 12, padding: "14px 36px",
          fontSize: 30, color: C.sun,
        }}>
          💡 光不会拐弯——它只能走直线！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Shadow Formation ───────────────────────────
const ShadowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const sceneOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const shadowGrow = interpolate(frame, [20, 80], [0, 1], { extrapolateRight: "clamp" });
  const labelOp = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" });

  const svgW = 1440;
  const svgH = 520;
  const lightX = 120, lightY = 200;
  const objX = 600, objY = 300, objR = 70;
  const wallX = 1380;
  const groundY = 460;

  // Shadow geometry: project from light through object edges
  // Top edge of object
  const topEdgeX = objX, topEdgeY = objY - objR;
  const botEdgeX = objX, botEdgeY = objY + objR;

  // Ray from light to top/bot edge, continue to wall
  const topSlopeToWall = ((topEdgeY - lightY) / (topEdgeX - lightX)) * (wallX - lightX) + lightY;
  const botSlopeToWall = ((botEdgeY - lightY) / (botEdgeX - lightX)) * (wallX - lightX) + lightY;

  // Shadow on wall (animated)
  const shadowTop = lightY + (topSlopeToWall - lightY) * shadowGrow;
  const shadowBot = lightY + (botSlopeToWall - lightY) * shadowGrow;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌑 影子是怎么形成的？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>光遇到不透明物体 → 背后形成影子</div>
      </div>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)", width: "92%", opacity: sceneOp }}
      >
        {/* Ground */}
        <rect x={0} y={groundY} width={svgW} height={60} rx={0} fill="#1e293b" opacity={0.6} />

        {/* Shadow on ground */}
        <ellipse
          cx={objX + 280 * shadowGrow} cy={groundY + 8}
          rx={160 * shadowGrow} ry={18}
          fill={C.shadowDark} opacity={0.75 * shadowGrow}
        />

        {/* Wall */}
        <rect x={wallX - 10} y={50} width={50} height={420} rx={6} fill="#334155" opacity={0.85} />
        {/* Shadow on wall */}
        <rect
          x={wallX - 4} y={shadowTop}
          width={32} height={(shadowBot - shadowTop) * shadowGrow}
          rx={4} fill={C.shadowDark} opacity={0.9 * shadowGrow}
        />

        {/* Light source glow */}
        <circle cx={lightX} cy={lightY} r={45} fill={C.sun} opacity={0.2} />
        <circle cx={lightX} cy={lightY} r={28} fill={C.sun} opacity={0.4} />
        <text x={lightX} y={lightY + 8} fontSize={44} textAnchor="middle">💡</text>

        {/* Light rays - top and bottom boundary */}
        <defs>
          <linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.sun} stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.sun} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Upper boundary ray */}
        <line x1={lightX + 28} y1={lightY}
          x2={lightX + 28 + (objX - lightX - 28 - objR) * 1} y2={topEdgeY}
          stroke="url(#rg2)" strokeWidth={3} opacity={0.8} strokeLinecap="round" />
        {/* Lower boundary ray */}
        <line x1={lightX + 28} y1={lightY}
          x2={lightX + 28 + (objX - lightX - 28 - objR) * 1} y2={botEdgeY}
          stroke="url(#rg2)" strokeWidth={3} opacity={0.8} strokeLinecap="round" />

        {/* Blocked region (dark zone) */}
        <polygon
          points={`${objX + objR},${topEdgeY} ${wallX},${topSlopeToWall} ${wallX},${botSlopeToWall} ${objX + objR},${botEdgeY}`}
          fill={C.shadowDark} opacity={0.5 * shadowGrow}
        />

        {/* Object (opaque circle) */}
        <circle cx={objX} cy={objY} r={objR} fill="#1e40af" stroke="#38bdf8" strokeWidth={3} />
        <text x={objX} y={objY + 8} fontSize={40} textAnchor="middle">🪨</text>
        <text x={objX} y={objY + 95} fontSize={22} fill={C.blue} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif">不透明物体</text>

        {/* Labels */}
        <text x={lightX} y={lightY - 50} fontSize={24} fill={C.sun} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif" opacity={labelOp}>光源</text>
        <text x={(objX + wallX) / 2} y={350} fontSize={24} fill={C.muted} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif" opacity={labelOp * shadowGrow}>影子区域</text>
        <text x={wallX + 10} y={groundY - 60} fontSize={24} fill={C.muted} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif" opacity={labelOp}>影子</text>
      </svg>

      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        textAlign: "center",
        opacity: labelOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(14,165,233,.12)",
          border: "1px solid rgba(56,189,248,.3)",
          borderRadius: 12, padding: "14px 36px",
          fontSize: 30, color: C.blue,
        }}>
          光被挡住 → 背后变暗 → 出现影子 ✓
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Shadow Changes Through the Day ─────────────
const DayShadowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Animate sun position across sky (morning → noon → evening)
  const sunProgress = interpolate(frame, [0, 130], [0, 1], { extrapolateRight: "clamp" });
  const sunX = interpolate(sunProgress, [0, 0.5, 1], [120, 960, 1800]);
  const sunY = interpolate(sunProgress, [0, 0.5, 1], [300, 100, 300]);

  const svgW = 1920;
  const svgH = 520;
  const personX = 960;
  const personY = 400;
  const personH = 120;
  const groundY = 450;

  // Shadow: extends opposite to sun, length depends on sun height
  const sunDx = personX - sunX;
  const sunDy = personY - sunY;
  const shadowLen = Math.min(Math.abs(sunDx / sunDy) * personH * 1.5, 600);
  const shadowDir = sunDx > 0 ? 1 : -1;

  const timeLabels = ["早晨", "中午", "傍晚"];
  const timeProgress = sunProgress * 2; // 0..2
  const currentTimeIdx = Math.min(Math.floor(timeProgress), 2);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🕐 一天中影子的变化</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>早晨长 → 中午短 → 傍晚长</div>
      </div>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ position: "absolute", top: 150, left: 0, width: "100%", height: "auto" }}
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1a30" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.sun} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.sun} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={svgW} height={svgH} fill="url(#skyGrad)" />

        {/* Ground */}
        <rect x={0} y={groundY} width={svgW} height={svgH - groundY}
          rx={0} fill="#1e293b" opacity={0.8} />

        {/* Sun glow */}
        <circle cx={sunX} cy={sunY} r={70} fill="url(#sunGlow)" opacity={0.6} />
        {/* Sun */}
        <circle cx={sunX} cy={sunY} r={36} fill={C.sun} opacity={0.95} />
        <text x={sunX} y={sunY + 12} fontSize={40} textAnchor="middle">☀️</text>

        {/* Sun path arc (dashed) */}
        <path
          d={`M 120 ${300} Q 960 ${50} 1800 ${300}`}
          fill="none" stroke={C.sun} strokeWidth={2} strokeDasharray="16,10" opacity={0.25}
        />

        {/* Shadow on ground */}
        <ellipse
          cx={personX + shadowDir * shadowLen * 0.5}
          cy={groundY + 5}
          rx={shadowLen * 0.45}
          ry={12}
          fill={C.shadowDark} opacity={0.75}
        />
        {/* Shadow ray */}
        <line
          x1={personX} y1={personY - 30}
          x2={personX + shadowDir * shadowLen}
          y2={groundY}
          stroke={C.shadowDark} strokeWidth={8} opacity={0.4} strokeLinecap="round"
        />

        {/* Person */}
        {/* Body */}
        <circle cx={personX} cy={personY - personH + 20} r={22} fill="#fbbf24" />
        <rect x={personX - 14} y={personY - personH + 42} width={28} height={55} rx={8} fill="#3b82f6" />
        <line x1={personX - 14} y1={personY - personH + 55} x2={personX - 35} y2={personY - personH + 90}
          stroke="#3b82f6" strokeWidth={8} strokeLinecap="round" />
        <line x1={personX + 14} y1={personY - personH + 55} x2={personX + 35} y2={personY - personH + 90}
          stroke="#3b82f6" strokeWidth={8} strokeLinecap="round" />
        <line x1={personX - 8} y1={personY - personH + 97} x2={personX - 8} y2={groundY}
          stroke="#1e40af" strokeWidth={10} strokeLinecap="round" />
        <line x1={personX + 8} y1={personY - personH + 97} x2={personX + 8} y2={groundY}
          stroke="#1e40af" strokeWidth={10} strokeLinecap="round" />

        {/* Sun ray to person */}
        <line
          x1={sunX} y1={sunY + 36}
          x2={personX} y2={personY - 100}
          stroke={C.sun} strokeWidth={3} strokeDasharray="10,6" opacity={0.35}
        />

        {/* Time label markers */}
        {[
          { x: 120, label: "早晨", sub: "影子朝西\n（长）", color: C.orange },
          { x: 960, label: "中午", sub: "影子最短", color: C.sun },
          { x: 1800, label: "傍晚", sub: "影子朝东\n（长）", color: C.orange },
        ].map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={315} r={8} fill={m.color} opacity={0.7} />
            <text x={m.x} y={350} fontSize={26} fill={m.color} textAnchor="middle"
              fontFamily="PingFang SC,sans-serif" fontWeight="bold">{m.label}</text>
            {m.sub.split("\n").map((line, j) => (
              <text key={j} x={m.x} y={380 + j * 26} fontSize={20} fill={C.muted} textAnchor="middle"
                fontFamily="PingFang SC,sans-serif">{line}</text>
            ))}
          </g>
        ))}

        {/* Current time indicator */}
        <text x={sunX} y={sunY - 50} fontSize={26} fill={C.sun} textAnchor="middle"
          fontFamily="PingFang SC,sans-serif"
          opacity={interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" })}>
          {timeLabels[Math.min(Math.floor(sunProgress * 2.99), 2)]}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Summary ────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "📏", color: C.sun, title: "发现一",
      text: "光沿直线传播\n手电筒的光笔直射出",
    },
    {
      icon: "🌑", color: C.blue, title: "发现二",
      text: "不透明物体挡光\n背后形成影子",
    },
    {
      icon: "🕐", color: C.green, title: "发现三",
      text: "早晚影子长\n中午影子最短",
    },
    {
      icon: "🪟", color: C.purple, title: "发现四",
      text: "透明/半透明/不透明\n透光程度不同",
    },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, rgba(251,191,36,.08) 0%, transparent 60%), ${C.bg}`,
    }}>
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🎯 今天的四大发现</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 12 }}>光的传播与影子 · 核心要点</div>
      </div>

      <div style={{
        position: "absolute", top: 190, left: 70, right: 70,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 18 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,25,48,.92)",
              borderRadius: 24, padding: "30px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 22, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 68, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 30, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 28, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.65, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────
export const LightVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><StraightLightScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><ShadowScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><DayShadowScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
