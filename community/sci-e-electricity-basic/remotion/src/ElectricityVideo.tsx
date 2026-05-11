import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1420",
  bg2: "#0f1e30",
  text: "#f0f9ff",
  muted: "#94a3b8",
  yellow: "#fbbf24",
  blue: "#38bdf8",
  green: "#34d399",
  red: "#f87171",
  purple: "#a78bfa",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 100, damping: 14 } });

  const tags = ["🔋 电源", "〰️ 导线", "💡 灯泡", "🔌 开关"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(251,191,36,.18) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Animated lightning bolts background */}
      {[...Array(8)].map((_, i) => {
        const x = 100 + i * 220;
        const y = 60 + (i % 2) * 900;
        const op = interpolate(Math.sin((frame / 20 + i * 0.8) * 2), [-1, 1], [0.03, 0.12]);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            fontSize: 60, opacity: op,
            transform: `rotate(${i * 45}deg)`,
          }}>⚡</div>
        );
      })}

      <div style={{ fontSize: 120, transform: `scale(${Math.min(emojiScale, 1)})`, marginBottom: 20 }}>⚡</div>
      <div style={{
        fontSize: 96, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg,#fff 30%,${C.yellow} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>简单电路</div>
      <div style={{
        marginTop: 20, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G4 · 物质科学</div>
      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {tags.map((t, i) => {
          const tagOp = interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "12px 28px", borderRadius: 99,
              background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.35)",
              color: C.yellow, fontSize: 30, opacity: tagOp,
            }}>{t}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：四大元件展示 ───────────────────────────────
const ComponentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const components = [
    { icon: "🔋", name: "电源", sub: "提供电能", desc: "从电池正极流出电流\n为整个电路提供动力", color: C.yellow },
    { icon: "〰️", name: "导线", sub: "传导电流", desc: "铜芯导线\n连接各元件的通道", color: C.blue },
    { icon: "💡", name: "用电器", sub: "消耗电能", desc: "灯泡将电能转为光能\n是最常见的用电器", color: C.green },
    { icon: "🔌", name: "开关", sub: "控制通断", desc: "闭合时接通电路\n断开时切断电路", color: C.purple },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>⚡ 电路的四大组成部分</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>缺少任何一个，电路都无法正常工作！</div>
      </div>

      <div style={{
        position: "absolute", top: 185, left: 80, right: 80,
        display: "flex", gap: 36, alignItems: "flex-start",
      }}>
        {components.map((c, i) => {
          const delay = 20 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 16 } });
          const op = Math.min(prog, 1);
          const y = interpolate(prog, [0, 1], [40, 0]);

          return (
            <div key={c.name} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{
                width: 170, height: 170, borderRadius: "50%",
                background: c.color + "18", border: `4px solid ${c.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 90, marginBottom: 20,
                boxShadow: `0 0 40px ${c.color}33`,
              }}>{c.icon}</div>
              <div style={{
                fontSize: 36, fontWeight: 800, color: c.color, marginBottom: 8,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.name}</div>
              <div style={{
                fontSize: 24, color: C.muted, marginBottom: 10,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.sub}</div>
              <div style={{
                fontSize: 22, color: "#cbd5e1", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif",
                lineHeight: 1.6, whiteSpace: "pre-line",
                background: c.color + "0a",
                border: `1px solid ${c.color}30`,
                borderRadius: 12, padding: "10px 14px",
              }}>{c.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: C.yellow,
        fontWeight: 700,
      }}>
        💡 记忆口诀：电源·导线·用电器·开关 — 四件套，缺一不可！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：通路/断路对比 + 电流粒子 ──────────────────
const CircuitScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  // Particle positions along circuit path (normalized 0-1)
  const numParticles = 6;
  const particles = [...Array(numParticles)].map((_, i) => {
    const basePos = (i / numParticles + frame / 60) % 1;
    return basePos;
  });

  // Circuit path points (left circuit - closed/通路)
  const leftCX = 480;   // center X for left circuit
  const pathPoints = {
    // Rectangle: battery bottom-left → top → bulb top → right → switch right → bottom
    left: { x: leftCX - 260, y: 380 },
    topLeft: { x: leftCX - 260, y: 200 },
    top: { x: leftCX, y: 200 },     // bulb position
    topRight: { x: leftCX + 260, y: 200 },
    right: { x: leftCX + 260, y: 380 },
    bottom: { x: leftCX, y: 580 },  // battery position
  };

  // Interpolate position along circuit
  function getParticlePos(t: number) {
    // Path: left → topLeft → top → topRight → right → bottom → left
    const segments = [
      { from: pathPoints.left, to: pathPoints.topLeft },
      { from: pathPoints.topLeft, to: pathPoints.top },
      { from: pathPoints.top, to: pathPoints.topRight },
      { from: pathPoints.topRight, to: pathPoints.right },
      { from: pathPoints.right, to: pathPoints.bottom },
      { from: pathPoints.bottom, to: pathPoints.left },
    ];
    const totalSegs = segments.length;
    const segIdx = Math.floor(t * totalSegs);
    const segT = (t * totalSegs) % 1;
    const seg = segments[Math.min(segIdx, totalSegs - 1)];
    return {
      x: seg.from.x + (seg.to.x - seg.from.x) * segT,
      y: seg.from.y + (seg.to.y - seg.from.y) * segT,
    };
  }

  const showParticles = frame > 30;
  const bulbGlow = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>💡 通路 vs 断路</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>观察电流在通路中是如何流动的</div>
      </div>

      {/* Left panel: 通路 (Closed circuit with particles) */}
      <div style={{
        position: "absolute", left: 60, top: 130, width: 820, bottom: 60,
        opacity: leftOp,
      }}>
        <div style={{
          background: "rgba(52,211,153,.06)", border: `2px solid ${C.green}`,
          borderRadius: 20, padding: "28px", height: "calc(100% - 0px)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            fontSize: 36, fontWeight: 800, color: C.green, marginBottom: 16,
            fontFamily: "'PingFang SC',sans-serif", textAlign: "center",
          }}>✅ 通路（电路接通）</div>

          {/* SVG Circuit Diagram with particles */}
          <svg width="100%" viewBox="0 0 760 480" style={{ display: "block", margin: "0 auto" }}>
            {/* Circuit wires */}
            <polyline
              points="100,400 100,120 380,120 640,120 640,400 380,400 100,400"
              fill="none"
              stroke={C.green}
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Battery (bottom left) */}
            <rect x="50" y="350" width="100" height="70" rx="10" fill={C.yellow + "20"} stroke={C.yellow} strokeWidth="2"/>
            <text x="100" y="392" textAnchor="middle" fontSize="36" fontFamily="sans-serif">🔋</text>
            <text x="100" y="418" textAnchor="middle" fontSize="14" fill={C.yellow} fontFamily="sans-serif" fontWeight="bold">电源</text>
            <text x="148" y="368" textAnchor="middle" fontSize="16" fill="#f87171" fontFamily="sans-serif" fontWeight="bold">+</text>
            <text x="52" y="368" textAnchor="middle" fontSize="16" fill="#94a3b8" fontFamily="sans-serif">-</text>

            {/* Bulb (top middle) - with glow when lit */}
            {bulbGlow > 0.3 && (
              <circle cx="380" cy="120" r={60 + bulbGlow * 30} fill={C.yellow + "18"} />
            )}
            <rect x="330" y="88" width="100" height="60" rx="10" fill={bulbGlow > 0.5 ? C.yellow + "40" : C.blue + "20"} stroke={bulbGlow > 0.5 ? C.yellow : C.blue} strokeWidth="2"/>
            <text x="380" y="123" textAnchor="middle" fontSize="36" fontFamily="sans-serif">💡</text>
            <text x="380" y="170" textAnchor="middle" fontSize="14" fill={C.blue} fontFamily="sans-serif" fontWeight="bold">灯泡（亮！）</text>

            {/* Switch (right side, closed) */}
            <rect x="590" y="350" width="100" height="60" rx="10" fill={C.green + "15"} stroke={C.green} strokeWidth="2"/>
            <text x="640" y="385" textAnchor="middle" fontSize="32" fontFamily="sans-serif">🔒</text>
            <text x="640" y="415" textAnchor="middle" fontSize="14" fill={C.green} fontFamily="sans-serif" fontWeight="bold">开关（闭合）</text>

            {/* Arrow showing current direction */}
            <text x="100" y="250" textAnchor="middle" fontSize="20" fill={C.green + "cc"} fontFamily="sans-serif">↑</text>
            <text x="380" y="100" textAnchor="middle" fontSize="20" fill={C.green + "cc"} fontFamily="sans-serif">→</text>
            <text x="640" y="250" textAnchor="middle" fontSize="20" fill={C.green + "cc"} fontFamily="sans-serif">↓</text>

            {/* Current particles */}
            {showParticles && particles.map((t, i) => {
              const pos = getParticlePos(t);
              // Scale from SVG coordinates (circuit is 100-640 x 120-400)
              const svgX = ((pos.x - (leftCX - 260)) / 520) * 540 + 100;
              const svgY = ((pos.y - 200) / 380) * 280 + 120;
              return (
                <circle
                  key={i}
                  cx={svgX}
                  cy={svgY}
                  r="8"
                  fill={C.yellow}
                  opacity={0.9}
                >
                  <animate
                    attributeName="r"
                    values="6;10;6"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })}

            {/* Labels */}
            <text x="380" y="470" textAnchor="middle" fontSize="18" fill={C.green} fontFamily="sans-serif" fontWeight="bold">
              电流路径：正极 → 导线 → 灯泡 → 开关 → 负极 → 循环！
            </text>
          </svg>
        </div>
      </div>

      {/* Right panel info */}
      <div style={{
        position: "absolute", right: 60, top: 200, width: 280,
        opacity: rightOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ background: "rgba(248,113,113,.08)", border: `1px solid ${C.red}40`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.red, marginBottom: 12 }}>❌ 断路时</div>
          <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.7 }}>
            回路某处断开<br/>
            电流无法流通<br/>
            灯泡不亮<br/><br/>
            常见原因：<br/>
            · 开关断开<br/>
            · 导线断裂<br/>
            · 灯丝断了
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：短路警告 ───────────────────────────────────
const ShortCircuitScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const warningPulse = 0.85 + 0.15 * Math.sin(frame / 8);
  const fireScale = 0.9 + 0.1 * Math.sin(frame / 5);
  const diagOp = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const rulesOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const dangers = [
    { icon: "🔥", text: "导线迅速发热" },
    { icon: "💥", text: "电池可能爆炸" },
    { icon: "🌡️", text: "温度急剧升高" },
    { icon: "⚡", text: "电流极大无限制" },
  ];

  const rules = [
    "✅ 连接电路前先断开开关",
    "✅ 电路必须经过用电器",
    "✅ 不要让导线直连电源两极",
    "✅ 发现异常立刻断开电源",
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Flashing danger overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(248,113,113,${warningPulse * 0.04})`,
        pointerEvents: "none",
      }}/>

      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          fontSize: 60, fontWeight: 900, color: C.red,
          opacity: warningPulse,
        }}>⚠️ 短路——非常危险！</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>导线直接连接电源两极，不经过任何用电器</div>
      </div>

      <div style={{
        position: "absolute", top: 180, left: 80, right: 80,
        display: "flex", gap: 40, opacity: diagOp,
      }}>
        {/* Short circuit diagram */}
        <div style={{ flex: 1, background: "rgba(248,113,113,.08)", border: `2px solid ${C.red}`, borderRadius: 20, padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.red, marginBottom: 20, fontFamily: "'PingFang SC',sans-serif" }}>⚡ 短路示意图</div>
          <svg width="100%" viewBox="0 0 360 280">
            {/* Short circuit path */}
            <polyline
              points="70,200 70,80 290,80 290,200 180,200"
              fill="none" stroke={C.red} strokeWidth="6"
              strokeLinejoin="round" strokeDasharray="0"
            />
            {/* Battery */}
            <rect x="30" y="170" width="80" height="60" rx="8" fill={C.yellow + "20"} stroke={C.yellow} strokeWidth="2"/>
            <text x="70" y="205" textAnchor="middle" fontSize="28" fontFamily="sans-serif">🔋</text>

            {/* Fire at short point */}
            <text x="180" y="130" textAnchor="middle" fontSize="52" fontFamily="sans-serif"
              transform={`scale(${fireScale}) translate(${(1 - fireScale) * 180 / fireScale},${(1 - fireScale) * 80 / fireScale})`}>
              🔥
            </text>

            {/* Current arrows - many and fast */}
            {[0.15, 0.35, 0.55, 0.75].map((t, i) => {
              const pos = frame / 15 + t;
              const x = 70 + (290 - 70) * ((pos % 1));
              return (
                <circle key={i} cx={x < 290 ? x : 290 - (x - 290)} cy={80} r="6" fill={C.red} opacity={0.8}/>
              );
            })}

            <text x="180" y="260" textAnchor="middle" fontSize="16" fill={C.red} fontFamily="sans-serif" fontWeight="bold">
              无用电器！电流超大 → 发热危险！
            </text>
          </svg>
        </div>

        {/* Dangers list */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 20, fontFamily: "'PingFang SC',sans-serif" }}>🔥 短路的危险</div>
          {dangers.map((d, i) => {
            const dOp = interpolate(frame, [35 + i * 10, 50 + i * 10], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                marginBottom: 20, opacity: dOp,
                background: "rgba(248,113,113,.08)", borderRadius: 12, padding: "14px 18px",
                border: "1px solid rgba(248,113,113,.2)",
              }}>
                <div style={{ fontSize: 36 }}>{d.icon}</div>
                <div style={{ fontSize: 26, color: "#fca5a5", fontFamily: "'PingFang SC',sans-serif", fontWeight: 600 }}>{d.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety rules */}
      <div style={{
        position: "absolute", bottom: 44, left: 80, right: 80,
        opacity: rulesOp, fontFamily: "'PingFang SC',sans-serif",
        background: "rgba(52,211,153,.06)", border: `1px solid ${C.green}40`,
        borderRadius: 16, padding: "20px 28px",
        display: "flex", flexWrap: "wrap", gap: "10px 40px",
      }}>
        {rules.map((r, i) => (
          <div key={i} style={{ fontSize: 24, color: C.green, flex: "0 0 45%" }}>{r}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：串联与并联对比 ──────────────────────────────
const SeriesParallelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const summaryOp = interpolate(frame, [90, 108], [0, 1], { extrapolateRight: "clamp" });

  // Particle along series circuit
  const seriesT = ((frame * 1.5) % 360) / 360;
  // Particles along parallel circuit (two branches)
  const paraT1 = ((frame * 1.5) % 360) / 360;
  const paraT2 = ((frame * 1.5 + 180) % 360) / 360;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🔗 串联 vs ⚡ 并联</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>两种连接方式，效果大不同！</div>
      </div>

      {/* Left: Series */}
      <div style={{
        position: "absolute", left: 60, top: 130, width: 860, bottom: 120,
        display: "flex", gap: 40,
      }}>
        <div style={{
          flex: 1, background: "rgba(167,139,250,.06)", border: `2px solid ${C.purple}`,
          borderRadius: 20, padding: "22px", opacity: leftOp,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.purple, marginBottom: 12, textAlign: "center", fontFamily: "'PingFang SC',sans-serif" }}>🔗 串联</div>
          <svg width="100%" viewBox="0 0 380 280">
            {/* Series path */}
            <polyline points="30,200 30,80 190,80 350,80 350,200 190,200 30,200" fill="none" stroke={C.purple} strokeWidth="5" strokeLinejoin="round"/>

            {/* Battery */}
            <rect x="5" y="170" width="50" height="50" rx="8" fill={C.yellow + "20"} stroke={C.yellow} strokeWidth="2"/>
            <text x="30" y="200" textAnchor="middle" fontSize="24" fontFamily="sans-serif">🔋</text>

            {/* Bulb 1 */}
            <rect x="160" y="62" width="60" height="40" rx="8" fill={C.blue + "20"} stroke={C.blue} strokeWidth="2"/>
            <text x="190" y="88" textAnchor="middle" fontSize="24" fontFamily="sans-serif">💡</text>
            <text x="190" y="116" textAnchor="middle" fontSize="12" fill={C.blue} fontFamily="sans-serif">灯1</text>

            {/* Bulb 2 */}
            <rect x="320" y="172" width="60" height="40" rx="8" fill={C.blue + "20"} stroke={C.blue} strokeWidth="2"/>
            <text x="350" y="198" textAnchor="middle" fontSize="24" fontFamily="sans-serif">💡</text>
            <text x="350" y="226" textAnchor="middle" fontSize="12" fill={C.blue} fontFamily="sans-serif">灯2</text>

            {/* Particle */}
            {(() => {
              const points = [[30,200],[30,80],[190,80],[350,80],[350,200],[190,200]];
              let totalLen = 0;
              const segs: {x1:number,y1:number,x2:number,y2:number,len:number}[] = [];
              for (let i = 0; i < points.length - 1; i++) {
                const len = Math.hypot(points[i+1][0]-points[i][0], points[i+1][1]-points[i][1]);
                segs.push({ x1:points[i][0], y1:points[i][1], x2:points[i+1][0], y2:points[i+1][1], len });
                totalLen += len;
              }
              const d = seriesT * totalLen;
              let acc = 0;
              let px = points[0][0], py = points[0][1];
              for (const seg of segs) {
                if (acc + seg.len >= d) {
                  const t2 = (d - acc) / seg.len;
                  px = seg.x1 + (seg.x2 - seg.x1) * t2;
                  py = seg.y1 + (seg.y2 - seg.y1) * t2;
                  break;
                }
                acc += seg.len;
              }
              return <circle cx={px} cy={py} r="7" fill={C.yellow} opacity={0.9}/>;
            })()}

            <text x="190" y="265" textAnchor="middle" fontSize="14" fill="#fca5a5" fontFamily="sans-serif" fontWeight="bold">一个灯坏 → 全灭！</text>
          </svg>

          <div style={{ fontFamily: "'PingFang SC',sans-serif", fontSize: 20, color: "#e2e8f0", lineHeight: 1.8, marginTop: 8 }}>
            <div>• 首尾相连，只有一条回路</div>
            <div>• 一个灯坏了，<span style={{ color: C.red, fontWeight: 700 }}>所有灯都熄灭</span></div>
            <div>• 电压分担，灯泡会变暗</div>
            <div>• 旧式圣诞彩灯是串联</div>
          </div>
        </div>

        {/* Right: Parallel */}
        <div style={{
          flex: 1, background: "rgba(52,211,153,.06)", border: `2px solid ${C.green}`,
          borderRadius: 20, padding: "22px", opacity: rightOp,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green, marginBottom: 12, textAlign: "center", fontFamily: "'PingFang SC',sans-serif" }}>⚡ 并联</div>
          <svg width="100%" viewBox="0 0 380 280">
            {/* Parallel paths */}
            <line x1="30" y1="60" x2="30" y2="220" stroke={C.green} strokeWidth="5"/>
            <line x1="350" y1="60" x2="350" y2="220" stroke={C.green} strokeWidth="5"/>
            <line x1="30" y1="60" x2="350" y2="60" stroke={C.green} strokeWidth="5"/>
            <line x1="30" y1="220" x2="350" y2="220" stroke={C.green} strokeWidth="5"/>
            <line x1="30" y1="120" x2="350" y2="120" stroke={C.green} strokeWidth="5"/>
            <line x1="30" y1="160" x2="350" y2="160" stroke={C.green} strokeWidth="5"/>

            {/* Battery */}
            <rect x="5" y="190" width="50" height="50" rx="8" fill={C.yellow + "20"} stroke={C.yellow} strokeWidth="2"/>
            <text x="30" y="220" textAnchor="middle" fontSize="24" fontFamily="sans-serif">🔋</text>

            {/* Bulb 1 - top branch */}
            <rect x="150" y="46" width="60" height="40" rx="8" fill={C.blue + "20"} stroke={C.blue} strokeWidth="2"/>
            <text x="180" y="72" textAnchor="middle" fontSize="24" fontFamily="sans-serif">💡</text>
            <text x="180" y="100" textAnchor="middle" fontSize="12" fill={C.blue} fontFamily="sans-serif">灯1</text>

            {/* Bulb 2 - middle branch */}
            <rect x="150" y="110" width="60" height="40" rx="8" fill={C.blue + "20"} stroke={C.blue} strokeWidth="2"/>
            <text x="180" y="136" textAnchor="middle" fontSize="24" fontFamily="sans-serif">💡</text>
            <text x="180" y="162" textAnchor="middle" fontSize="12" fill={C.blue} fontFamily="sans-serif">灯2</text>

            {/* Particles in both branches */}
            <circle cx={30 + (350-30) * paraT1} cy="60" r="6" fill={C.yellow} opacity={0.9}/>
            <circle cx={30 + (350-30) * paraT2} cy="120" r="6" fill={C.yellow} opacity={0.9}/>

            <text x="190" y="268" textAnchor="middle" fontSize="14" fill={C.green} fontFamily="sans-serif" fontWeight="bold">一个灯坏 → 其他灯还亮！</text>
          </svg>

          <div style={{ fontFamily: "'PingFang SC',sans-serif", fontSize: 20, color: "#e2e8f0", lineHeight: 1.8, marginTop: 8 }}>
            <div>• 并排连接，多条独立回路</div>
            <div>• 一个灯坏了，<span style={{ color: C.green, fontWeight: 700 }}>其他灯正常亮</span></div>
            <div>• 每个灯得到完整电压</div>
            <div>• 家里电灯都是并联！</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0,
        textAlign: "center", opacity: summaryOp,
        fontFamily: "'PingFang SC',sans-serif", fontSize: 28, fontWeight: 700,
        color: C.yellow,
      }}>
        🏠 你家里的每盏灯都有独立开关，正是因为它们是并联连接的！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const ElectricityVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={110}><TitleScene /></Sequence>
      <Sequence from={110} durationInFrames={140}><ComponentsScene /></Sequence>
      <Sequence from={250} durationInFrames={150}><CircuitScene /></Sequence>
      <Sequence from={400} durationInFrames={130}><ShortCircuitScene /></Sequence>
      <Sequence from={530} durationInFrames={130}><SeriesParallelScene /></Sequence>
    </AbsoluteFill>
  );
};
