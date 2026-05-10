import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#071a2e", bg2: "#0a2540", text: "#e0f4ff", muted: "#7bafc8",
  water: "#38bdf8", steam: "#a5f3fc", cloud: "#e0f2fe",
  rain: "#60a5fa", river: "#0ea5e9", sun: "#fbbf24",
  evap: "#34d399", cond: "#818cf8", cycle: "#f472b6",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const sunScale = spring({ frame: frame - 10, fps, config: { stiffness: 80, damping: 14 } });
  const sunRot = interpolate(frame, [0, 660], [0, 60], { extrapolateRight: "clamp" });

  // Animated water drops
  const drops = [0, 1, 2, 3, 4, 5];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 30% 20%, rgba(251,191,36,.18) 0%, transparent 50%),
                   radial-gradient(ellipse at 70% 80%, rgba(56,189,248,.15) 0%, transparent 50%),
                   ${C.bg}`,
      overflow: "hidden",
    }}>
      {/* Animated background particles */}
      {drops.map(i => {
        const x = 150 + i * 280;
        const baseY = 200 + (i % 2) * 300;
        const y = ((baseY + frame * (0.8 + i * 0.15)) % 900) + 100;
        const op = interpolate(y % 900, [0, 200, 700, 900], [0, 0.15, 0.15, 0]);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            fontSize: 28, opacity: op,
            transform: `rotate(${i * 60}deg)`,
          }}>💧</div>
        );
      })}

      {/* Sun */}
      <div style={{
        position: "absolute", top: 80, right: 160,
        fontSize: 120,
        transform: `scale(${Math.min(sunScale, 1.05)}) rotate(${sunRot}deg)`,
        filter: "drop-shadow(0 0 40px rgba(251,191,36,.6))",
        opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
      }}>☀️</div>

      {/* Title */}
      <div style={{
        position: "absolute", top: 280, left: 0, right: 0,
        textAlign: "center",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        <div style={{
          fontSize: 96, fontWeight: 900,
          fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
          background: "linear-gradient(135deg, #fff 20%, #38bdf8 60%, #a5f3fc 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>水的蒸发、凝结与循环</div>
      </div>

      <div style={{
        position: "absolute", top: 420, left: 0, right: 0,
        textAlign: "center", opacity: subOp,
        fontSize: 40, color: C.muted,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G3 · 物质科学</div>

      {/* Badges */}
      <div style={{
        position: "absolute", top: 520, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 32, opacity: badgeOp,
      }}>
        {["💧 蒸发", "❄️ 凝结", "🔄 水循环"].map((t, i) => (
          <div key={i} style={{
            padding: "14px 32px", borderRadius: 99,
            background: "rgba(56,189,248,.15)", border: "1px solid rgba(56,189,248,.4)",
            color: C.water, fontSize: 32,
            fontFamily: "'PingFang SC',sans-serif",
          }}>{t}</div>
        ))}
      </div>

      {/* Water wave bottom */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 120, opacity: badgeOp }}
        viewBox="0 0 1920 120" preserveAspectRatio="none">
        <path d={`M0,60 C320,${20 + Math.sin(frame * 0.05) * 20},640,${100 - Math.sin(frame * 0.05) * 20},960,60
                  C1280,${20 + Math.sin(frame * 0.05 + 1) * 20},1600,${100 - Math.sin(frame * 0.05) * 20},1920,60 L1920,120 L0,120 Z`}
          fill="rgba(56,189,248,.12)" />
      </svg>
    </AbsoluteFill>
  );
};

// ── 场景2：蒸发 ───────────────────────────────────────
const EvaporationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  // Particle animation: water molecules rising
  const particles = Array.from({ length: 18 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* Rising steam particles */}
      {particles.map(i => {
        const startX = 200 + (i % 6) * 60 + Math.sin(i) * 20;
        const speed = 0.8 + (i % 3) * 0.4;
        const delay = i * 8;
        const cycleLen = 120 / speed;
        const t = ((frame - delay + cycleLen * 2) % cycleLen) / cycleLen;
        const y = 780 - t * 400;
        const x = startX + Math.sin(t * Math.PI * 2 + i) * 25;
        const opacity = interpolate(t, [0, 0.1, 0.7, 1.0], [0, 0.7, 0.5, 0]);
        const sz = 14 + t * 16;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            fontSize: sz, opacity, color: C.steam,
            fontFamily: "monospace",
          }}>●</div>
        );
      })}

      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif" }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>💧→💨 蒸发</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 10 }}>液态水 → 水蒸气：能量驱动的相变</div>
      </div>

      {/* Left: water surface animation */}
      <div style={{
        position: "absolute", top: 150, left: 60, width: 460,
        opacity: leftOp,
      }}>
        {/* Water body */}
        <svg width="460" height="300" viewBox="0 0 460 300">
          {/* Sun */}
          <text x="380" y="60" fontSize="60" style={{ filter: "drop-shadow(0 0 12px rgba(251,191,36,.8))" }}>☀️</text>
          {/* Water */}
          <path d={`M10,${180 + Math.sin(frame * 0.1) * 5} C80,${170 + Math.sin(frame*0.1+1)*5},160,${190+Math.sin(frame*0.1+2)*5},
                    230,${178+Math.sin(frame*0.1)*5} C300,${170+Math.sin(frame*0.1+1)*5},380,${185+Math.sin(frame*0.1+2)*5},450,178 L450,290 L10,290 Z`}
                fill="rgba(56,189,248,.45)" />
          {/* Sun rays to water */}
          {[0,1,2,3,4].map(i => (
            <line key={i} x1={390 + Math.cos(i*0.6)*10} y1={70 + Math.sin(i*0.6)*10}
                  x2={80 + i*50} y2={175}
                  stroke="rgba(251,191,36,.3)" strokeWidth="2" strokeDasharray="6,4" />
          ))}
          {/* Arrows up = steam */}
          {[80,140,200,260,320].map((x, i) => {
            const t = ((frame + i * 20) % 70) / 70;
            const yArrow = 170 - t * 100;
            const arrowOp = interpolate(t, [0, 0.1, 0.8, 1], [0, 0.9, 0.7, 0]);
            return (
              <text key={i} x={x} y={yArrow} fontSize="22" opacity={arrowOp} fill={C.steam}>↑</text>
            );
          })}
          <text x="100" y="250" fontSize="18" fill={C.water} fontFamily="sans-serif">液态水（H₂O）</text>
          <text x="100" y="135" fontSize="16" fill={C.steam} fontFamily="sans-serif">水蒸气上升</text>
        </svg>
        <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 8, fontFamily: "'PingFang SC',sans-serif" }}>
          加热后水分子获得能量，变成水蒸气飞走
        </div>
      </div>

      {/* Right: factors */}
      <div style={{
        position: "absolute", top: 150, right: 60, width: 520,
        opacity: rightOp,
      }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", marginBottom: 20,
          fontFamily: "'PingFang SC',sans-serif" }}>🚀 加速蒸发的三个因素</div>
        {[
          { icon: "☀️", title: "温度高", desc: "夏天水洼比冬天干得快！", color: C.sun },
          { icon: "💨", title: "风速大", desc: "风把水蒸气带走，加速蒸发", color: C.steam },
          { icon: "📐", title: "面积大", desc: "晾衣服展开比揉成团干得快", color: C.evap },
        ].map((f, i) => {
          const delay = 50 + i * 18;
          const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 18], [15, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", gap: 20, alignItems: "center",
              background: "rgba(255,255,255,.05)", borderRadius: 16,
              padding: "20px 24px", marginBottom: 16,
              border: `1px solid ${f.color}44`,
              opacity: op, transform: `translateY(${y}px)`,
              fontFamily: "'PingFang SC',sans-serif",
            }}>
              <div style={{ fontSize: 50 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700, color: f.color }}>{f.title}</div>
                <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 6 }}>{f.desc}</div>
              </div>
            </div>
          );
        })}
        <div style={{
          background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.3)",
          borderRadius: 12, padding: "16px 20px", marginTop: 8,
          fontSize: 26, color: "#6ee7b7",
          fontFamily: "'PingFang SC',sans-serif",
          opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          💡 生活例子：晾衣服变干、水洼消失、锅里的水蒸发
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：凝结 ──────────────────────────────────────
const CondensationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const droplets = Array.from({ length: 20 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif" }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>❄️→💧 凝结</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 10 }}>水蒸气 → 液态水：遇冷变回水珠</div>
      </div>

      {/* Left: glass cup with condensation */}
      <div style={{
        position: "absolute", top: 160, left: 80,
        opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <svg width="380" height="420" viewBox="0 0 380 420">
          {/* Cup outline */}
          <path d="M80,60 L60,360 L320,360 L300,60 Z" fill="rgba(56,189,248,.08)" stroke="rgba(56,189,248,.6)" strokeWidth="3" />
          {/* Ice in cup */}
          <rect x="100" y="100" width="60" height="40" rx="6" fill="rgba(165,243,252,.4)" stroke="rgba(165,243,252,.7)" strokeWidth="1.5" />
          <rect x="170" y="90" width="50" height="35" rx="5" fill="rgba(165,243,252,.35)" stroke="rgba(165,243,252,.6)" strokeWidth="1.5" />
          <rect x="220" y="108" width="55" height="38" rx="6" fill="rgba(165,243,252,.4)" stroke="rgba(165,243,252,.7)" strokeWidth="1.5" />
          <text x="155" y="160" fontSize="16" fill={C.steam} fontFamily="sans-serif">🧊 冰块</text>
          {/* Liquid in cup */}
          <path d="M68,200 C100,195,180,205,232,200 C280,195,308,198,312,200 L312,360 L68,360 Z" fill="rgba(56,189,248,.3)" />
          {/* Water droplets on outside */}
          {droplets.map(i => {
            const side = i % 2 === 0 ? 1 : -1;
            const baseX = i % 2 === 0 ? 55 : 310;
            const bx = baseX + side * (i % 3) * 4;
            const by = 120 + (i % 10) * 24;
            const progress = ((frame - i * 5) % 80) / 80;
            const dropY = by + progress * 60;
            const dropOp = interpolate(progress, [0, 0.05, 0.8, 1], [0, 1, 0.8, 0]);
            const dropR = 5 + (i % 3) * 2;
            return (
              <ellipse key={i} cx={bx} cy={dropY} rx={dropR * 0.7} ry={dropR}
                fill={`rgba(56,189,248,${0.7 * dropOp})`} opacity={dropOp} />
            );
          })}
          {/* Steam arrows coming down */}
          {[100,160,220,270].map((x, i) => {
            const t = ((frame + i * 15) % 60) / 60;
            const yArrow = 60 - t * 80;
            const op = interpolate(t, [0, 0.1, 0.7, 1], [0, 0.6, 0.5, 0]);
            return (
              <text key={i} x={x} y={yArrow} fontSize="20" opacity={op} fill={C.steam}>↓</text>
            );
          })}
          <text x="100" y="390" fontSize="18" fill={C.water} fontFamily="sans-serif">冰冷饮料杯</text>
          <text x="28" y="260" fontSize="15" fill={C.water} fontFamily="sans-serif" transform="rotate(-90,28,260)">外壁水珠</text>
        </svg>
        <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 4, fontFamily: "'PingFang SC',sans-serif", maxWidth: 380 }}>
          空气中的水蒸气遇到冷杯壁 → 凝结成水珠
        </div>
      </div>

      {/* Right: examples and explanation */}
      <div style={{
        position: "absolute", top: 160, right: 60, width: 540,
        opacity: interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", marginBottom: 20,
          fontFamily: "'PingFang SC',sans-serif" }}>🌡️ 凝结的生活例子</div>
        {[
          { icon: "🌫️", title: "冬天呼出白气", desc: "呼出的热水蒸气遇冷空气凝结成小水滴", color: C.cond },
          { icon: "🥤", title: "饮料杯外壁水珠", desc: "空气中水蒸气遇冷杯壁凝结", color: C.water },
          { icon: "🪟", title: "冬天玻璃起雾", desc: "室内暖湿气体遇冷玻璃凝结", color: C.steam },
          { icon: "🌫️", title: "清晨草叶上的露水", desc: "夜间降温，空气中水蒸气凝结成露", color: C.evap },
        ].map((ex, i) => {
          const delay = 45 + i * 16;
          const op = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", gap: 18, alignItems: "center",
              background: "rgba(255,255,255,.04)", borderRadius: 14,
              padding: "16px 20px", marginBottom: 14,
              border: `1px solid ${ex.color}44`,
              opacity: op,
              fontFamily: "'PingFang SC',sans-serif",
            }}>
              <div style={{ fontSize: 44 }}>{ex.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: ex.color }}>{ex.title}</div>
                <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 4 }}>{ex.desc}</div>
              </div>
            </div>
          );
        })}
        <div style={{
          background: "rgba(129,140,248,.08)", border: "1px solid rgba(129,140,248,.3)",
          borderRadius: 12, padding: "16px 20px",
          fontSize: 26, color: "#a5b4fc",
          fontFamily: "'PingFang SC',sans-serif",
          opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          🔑 凝结 = 蒸发的<span style={{ color: "#f472b6", fontWeight: 700 }}>逆过程</span>：气→液，需要<span style={{ color: C.cond, fontWeight: 700 }}>遇冷</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：完整水循环 ───────────────────────────────────
const WaterCycleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const diagramOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  // Arrow progress for cycle
  const arrowProgress = interpolate(frame, [20, 110], [0, 1], { extrapolateRight: "clamp" });
  const step2Op = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const step3Op = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });
  const step4Op = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const step5Op = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" });

  // Rain animation
  const rainDrops = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif" }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🔄 完整水循环</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>地球上的水永不消失，只是不断旅行</div>
      </div>

      {/* Main cycle diagram */}
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, opacity: diagramOp }}>
        <svg width="1920" height="860" viewBox="0 0 1920 860">
          {/* Sky background */}
          <rect x="0" y="0" width="1920" height="500" fill="rgba(10,37,64,.5)" />
          {/* Water / ocean */}
          <path d={`M0,580 C200,${555+Math.sin(frame*0.08)*12},400,${595+Math.sin(frame*0.08+1)*12},600,580
                    C800,${560+Math.sin(frame*0.08+2)*10},1000,${595+Math.sin(frame*0.08)*10},1200,580
                    C1400,${560+Math.sin(frame*0.08+1)*12},1600,${595+Math.sin(frame*0.08+2)*10},1920,580
                    L1920,860 L0,860 Z`}
                fill="rgba(56,189,248,.35)" />
          {/* Land / mountain */}
          <path d="M1200,580 L1350,340 L1500,580 Z" fill="rgba(74,155,100,.6)" />
          <path d="M1350,340 L1420,420 L1350,380 L1280,420 Z" fill="rgba(220,220,240,.7)" />
          <path d="M1450,580 L1600,400 L1750,580 Z" fill="rgba(74,155,100,.5)" />

          {/* River flowing down mountain */}
          <path d={`M1350,440 C1340,500,1310,530,1270,560 C1240,575,1220,580,1200,582`}
                fill="none" stroke={C.river} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${Math.min(arrowProgress * 300, 300)},1000`} />

          {/* Step 1: Sun → Evaporation arrows */}
          <text x="200" y="100" fontSize="90"
                style={{ filter: "drop-shadow(0 0 20px rgba(251,191,36,.7))" }}>☀️</text>
          {[300,420,540,660,780,900].map((x, i) => {
            const t = ((frame - i * 12) % 90) / 90;
            const baseY = 570;
            const y = baseY - t * 200;
            const op = interpolate(t, [0, 0.05, 0.7, 1], [0, 0.8, 0.6, 0]);
            return (
              <g key={i} opacity={op}>
                <circle cx={x} cy={y} r={8 + t * 6} fill={C.steam} opacity={0.6} />
              </g>
            );
          })}

          {/* Step 2: Cloud formation */}
          <g opacity={step2Op}>
            {/* Cloud */}
            <ellipse cx="680" cy="180" rx="120" ry="55" fill="rgba(224,242,254,.7)" />
            <ellipse cx="760" cy="160" rx="80" ry="45" fill="rgba(224,242,254,.8)" />
            <ellipse cx="600" cy="195" rx="70" ry="40" fill="rgba(224,242,254,.6)" />
            <text x="580" y="275" fontSize="22" fill={C.cloud} fontFamily="'PingFang SC',sans-serif">💧 凝结成云</text>
          </g>

          {/* Step 3: Rain */}
          <g opacity={step3Op}>
            {rainDrops.map(i => {
              const x = 540 + (i % 4) * 55;
              const t = ((frame - i * 8) % 70) / 70;
              const y = 240 + t * 300;
              const op = interpolate(t, [0, 0.05, 0.8, 1], [0, 0.9, 0.7, 0]);
              return (
                <ellipse key={i} cx={x} cy={y} rx={5} ry={10} fill={C.rain} opacity={op} />
              );
            })}
            <text x="500" y="460" fontSize="22" fill={C.rain} fontFamily="'PingFang SC',sans-serif">🌧️ 降水</text>
          </g>

          {/* Step 4: Rivers */}
          <g opacity={step4Op}>
            <text x="1000" y="560" fontSize="22" fill={C.river} fontFamily="'PingFang SC',sans-serif">🏞️ 汇入河流湖泊</text>
          </g>

          {/* Step 5: Back to ocean */}
          <g opacity={step5Op}>
            <text x="200" y="650" fontSize="24" fill={C.water} fontFamily="'PingFang SC',sans-serif">🌊 流入大海</text>
            <text x="200" y="685" fontSize="22" fill={C.evap} fontFamily="'PingFang SC',sans-serif">→ 再次蒸发，循环不止！</text>
          </g>

          {/* Curved arrows showing cycle */}
          {/* Arrow from water to cloud */}
          <path d={`M350,550 Q300,300 580,220`}
                fill="none" stroke={C.steam} strokeWidth="3" strokeDasharray="12,6"
                strokeDashoffset={-frame * 2}
                opacity={0.7} markerEnd="url(#arrow1)" />
          {/* Arrow from cloud to rain/river */}
          <path d={`M760,220 Q900,300 1000,520`}
                fill="none" stroke={C.rain} strokeWidth="3" strokeDasharray="12,6"
                strokeDashoffset={-frame * 2}
                opacity={step3Op * 0.7} />
          {/* Arrow from mountain river back to sea */}
          <path d={`M1200,590 Q900,600 400,595`}
                fill="none" stroke={C.river} strokeWidth="3" strokeDasharray="12,6"
                strokeDashoffset={-frame * 2}
                opacity={step4Op * 0.7} />

          {/* Step labels */}
          <g fontFamily="'PingFang SC',sans-serif" fontSize="20">
            <text x="120" y="430" fill={C.evap} opacity={0.9}>① 蒸发</text>
            <text x="420" y="150" fill={C.steam} opacity={step2Op}>② 上升·凝结</text>
            <text x="770" y="340" fill={C.rain} opacity={step3Op}>③ 降水</text>
            <text x="1050" y="500" fill={C.river} opacity={step4Op}>④ 汇流</text>
            <text x="300" y="745" fill={C.water} opacity={step5Op}>⑤ 入海再蒸发</text>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    { icon: "💧", color: C.water,  title: "蒸发 Evaporation", text: "液态水 → 水蒸气\n温度高、风大、面积大 = 加速" },
    { icon: "❄️", color: C.cond,  title: "凝结 Condensation", text: "水蒸气 → 液态水\n遇冷表面发生，冷饮杯外壁" },
    { icon: "🔄", color: C.cycle, title: "水循环 Water Cycle", text: "蒸发→上升→云→降水→汇流→入海\n地球水总量不变，永不停止！" },
    { icon: "🌍", color: C.evap,  title: "生命的生命线", text: "水循环把淡水输送到各地\n支撑地球上所有生命！" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(56,189,248,.1) 0%, transparent 65%)",
      }} />
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🎯 今天的三大发现</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>水的蒸发、凝结与循环 · 核心要点</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(10,37,64,.9)", borderRadius: 22, padding: "30px 28px",
              border: `2px solid ${p.color}55`,
              display: "flex", gap: 24, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 70, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 10 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#cbd5e1",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.65, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom message */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 30, color: "#a5f3fc", fontStyle: "italic" }}>
          "地球上的水总量不变，只是一直在循环旅行！" 🌏💧
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const WaterCycleVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><EvaporationScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><CondensationScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><WaterCycleScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
