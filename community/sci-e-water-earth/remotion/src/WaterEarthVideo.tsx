import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#061225",
  bg2: "#0a1e35",
  text: "#f0f9ff",
  muted: "#94a3b8",
  ocean: "#0ea5e9",
  fresh: "#34d399",
  glacier: "#a5f3fc",
  ground: "#a78bfa",
  warn: "#f87171",
  gold: "#fbbf24",
  green: "#4ade80",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const dropScale = spring({ frame: frame - 5, fps, config: { stiffness: 100, damping: 12 } });
  const tagOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, rgba(14,165,233,.25) 0%, transparent 65%),
                   radial-gradient(ellipse at 20% 80%, rgba(52,211,153,.12) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* animated water drop */}
      <div style={{
        fontSize: 120,
        transform: `scale(${Math.min(dropScale, 1)})`,
        marginBottom: 36,
        filter: "drop-shadow(0 0 40px rgba(14,165,233,0.6))",
      }}>💧</div>

      <div style={{
        fontSize: 96, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 20%,#38bdf8 60%,#34d399 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        lineHeight: 1.1,
        padding: "0 60px",
      }}>地球上的水资源</div>

      <div style={{
        marginTop: 24, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G3 · 地球与宇宙科学</div>

      <div style={{
        marginTop: 48, display: "flex", gap: 24, opacity: tagOp,
        fontFamily: "'PingFang SC',sans-serif",
        flexWrap: "wrap", justifyContent: "center", padding: "0 80px",
      }}>
        {["🌊 水的分布", "🧊 淡水稀缺", "⚠️ 水资源问题", "💚 节水行动"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 28px", borderRadius: 99,
            background: "rgba(14,165,233,.15)", border: "1px solid rgba(14,165,233,.4)",
            color: C.ocean, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：地球水分布饼图动画 ─────────────────────────
const PieChartScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  // pie animation: 0→1 from frame 20 to 80
  const pieProgress = interpolate(frame, [20, 80], [0, 1], { extrapolateRight: "clamp" });

  // SVG pie chart: 97.5% ocean (blue), 2.5% fresh (green)
  const cx = 960, cy = 540, r = 320;
  const oceanAngle = 360 * 0.975 * pieProgress;
  const freshAngle = 360 * 0.025 * pieProgress;

  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const arc = (startDeg: number, endDeg: number, radius: number) => {
    const start = toRad(startDeg);
    const end = toRad(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const oceanEndAngle = oceanAngle;
  const freshEndAngle = oceanEndAngle + freshAngle;

  // labels
  const labelOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const statsOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌍 地球上的水是怎么分布的？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>地球有 14 亿立方千米的水，却大部分是咸水</div>
      </div>

      {/* pie chart SVG */}
      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
        viewBox="0 0 1920 1080">
        {/* background circle */}
        <circle cx={cx} cy={cy} r={r + 10} fill="rgba(14,165,233,0.05)" stroke="rgba(14,165,233,0.2)" strokeWidth={2} />

        {/* ocean slice */}
        {oceanAngle > 0 && (
          <path d={arc(0, Math.min(oceanEndAngle, 359.99))} fill="#0ea5e9" opacity={0.85} />
        )}
        {/* fresh slice */}
        {freshAngle > 0 && (
          <path d={arc(oceanAngle, Math.min(freshEndAngle, oceanAngle + 359.99 * 0.025))} fill="#34d399" opacity={0.9} />
        )}

        {/* center hole */}
        <circle cx={cx} cy={cy} r={r * 0.52} fill={C.bg} />
        {/* center text */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#fff"
          fontSize={52} fontWeight="900" fontFamily="'PingFang SC',sans-serif">地球的水</text>
        <text x={cx} y={cy + 40} textAnchor="middle" fill={C.muted}
          fontSize={30} fontFamily="'PingFang SC',sans-serif">14 亿 km³</text>

        {/* ocean label */}
        <text x={cx - 260} y={cy + 80} textAnchor="middle" fill="#38bdf8"
          fontSize={36} fontWeight="700" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>🌊 咸水</text>
        <text x={cx - 260} y={cy + 130} textAnchor="middle" fill="#38bdf8"
          fontSize={52} fontWeight="900" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>97.5%</text>

        {/* fresh label */}
        <text x={cx + 290} y={cy - 60} textAnchor="middle" fill="#34d399"
          fontSize={36} fontWeight="700" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>💧 淡水</text>
        <text x={cx + 290} y={cy - 10} textAnchor="middle" fill="#34d399"
          fontSize={52} fontWeight="900" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>2.5%</text>

        {/* connecting lines */}
        <line x1={cx - 100} y1={cy + 60} x2={cx - 200} y2={cy + 90}
          stroke="#38bdf8" strokeWidth={2} opacity={labelOp} strokeDasharray="6,4" />
        <line x1={cx + 120} y1={cy - 100} x2={cx + 230} y2={cy - 50}
          stroke="#34d399" strokeWidth={2} opacity={labelOp} strokeDasharray="6,4" />
      </svg>

      {/* bottom stats */}
      <div style={{
        position: "absolute", bottom: 40, left: 60, right: 60,
        display: "flex", gap: 20, opacity: statsOp,
        fontFamily: "'PingFang SC',sans-serif",
        justifyContent: "center",
      }}>
        {[
          { icon: "🌊", label: "海洋咸水", value: "97.5%", color: C.ocean },
          { icon: "🧊", label: "冰川淡水", value: "1.75%", color: C.glacier },
          { icon: "🪨", label: "地下水", value: "0.75%", color: C.ground },
          { icon: "🚿", label: "可用淡水", value: "<0.025%", color: C.fresh },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1, background: "rgba(15,32,64,.8)",
            border: `1px solid ${item.color}44`, borderRadius: 16,
            padding: "16px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 42 }}>{item.icon}</div>
            <div style={{ fontSize: 24, color: item.color, fontWeight: 700, marginTop: 6 }}>{item.label}</div>
            <div style={{ fontSize: 32, color: "#fff", fontWeight: 900, marginTop: 4 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：淡水稀缺性 ─────────────────────────────────
const FreshwaterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const bars = [
    { label: "冰川", pct: 70, color: C.glacier, icon: "🧊" },
    { label: "地下水", pct: 30, color: C.ground, icon: "🪨" },
    { label: "可利用淡水", pct: 1, color: C.fresh, icon: "🚿" },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 30% 50%, rgba(165,243,252,.06) 0%, transparent 60%), ${C.bg}`,
    }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🧊 淡水在哪里？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          地球 2.5% 的淡水里，真正能用的不到 <span style={{ color: C.fresh, fontWeight: 700 }}>1%</span>！
        </div>
      </div>

      {/* big comparison visual */}
      <div style={{
        position: "absolute", top: 180, left: 100, right: 100,
        display: "flex", gap: 40, alignItems: "flex-end",
      }}>
        {bars.map((b, i) => {
          const delay = 20 + i * 25;
          const barProg = interpolate(frame, [delay, delay + 40], [0, 1], { extrapolateRight: "clamp" });
          const barHeight = Math.max(4, 500 * (b.pct / 100) * barProg);
          const textOp = interpolate(frame, [delay + 30, delay + 50], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={b.label} style={{
              flex: b.pct === 1 ? 0.3 : 1,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{
                opacity: textOp,
                fontSize: 36, fontWeight: 900, color: b.color,
                fontFamily: "'PingFang SC',sans-serif",
                marginBottom: 10,
              }}>{b.pct}%</div>
              <div style={{
                width: "100%", maxWidth: 280,
                height: barHeight,
                background: `linear-gradient(180deg, ${b.color}cc 0%, ${b.color}44 100%)`,
                border: `2px solid ${b.color}`,
                borderRadius: "12px 12px 0 0",
                position: "relative",
                boxShadow: `0 0 30px ${b.color}44`,
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                paddingTop: 8,
              }}>
                <span style={{ fontSize: 36, opacity: textOp }}>{b.icon}</span>
              </div>
              <div style={{
                marginTop: 16, fontSize: 28, color: "#fff",
                fontFamily: "'PingFang SC',sans-serif",
                fontWeight: 700, opacity: textOp, textAlign: "center",
              }}>{b.label}</div>
            </div>
          );
        })}
      </div>

      {/* callout */}
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(52,211,153,.12)", border: "2px solid rgba(52,211,153,.4)",
          borderRadius: 20, padding: "20px 48px", fontSize: 30, color: "#fff",
        }}>
          💡 想象地球上的水是 <span style={{ color: C.ocean, fontWeight: 700 }}>1000桶</span>，
          淡水只有 <span style={{ color: C.fresh, fontWeight: 700 }}>25桶</span>，
          能直接用的只有 <span style={{ color: C.gold, fontWeight: 700 }}>不到1杯</span>！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：水资源问题 ─────────────────────────────────
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const problems = [
    { icon: "📍", title: "分布不均", desc: "亚洲人口占全球60%\n但淡水仅占36%\n非洲许多地区严重缺水", color: C.gold },
    { icon: "🏭", title: "水污染", desc: "工厂废水、农业化肥\n流入河流湖泊\n使淡水变脏无法饮用", color: C.warn },
    { icon: "💸", title: "过度使用", desc: "大量灌溉农田、工业用水\n地下水越抽越少\n水位持续下降", color: "#f472b6" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>⚠️ 水资源面临的危机</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>三大问题威胁着我们的淡水资源</div>
      </div>

      <div style={{
        position: "absolute", top: 170, left: 70, right: 70,
        display: "flex", gap: 40,
      }}>
        {problems.map((p, i) => {
          const delay = 20 + i * 25;
          const op = interpolate(frame, [delay, delay + 25], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 25], [30, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              flex: 1,
              background: `${p.color}0d`,
              border: `2px solid ${p.color}55`,
              borderRadius: 24, padding: "40px 32px",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>{p.icon}</div>
              <div style={{
                fontSize: 40, fontWeight: 800, color: p.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 20,
              }}>{p.title}</div>
              <div style={{
                fontSize: 26, color: "#e2e8f0", lineHeight: 1.8,
                fontFamily: "'PingFang SC',sans-serif", whiteSpace: "pre-line",
              }}>{p.desc}</div>
            </div>
          );
        })}
      </div>

      {/* alarm */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: C.warn,
        fontWeight: 700,
      }}>
        🚨 全球超过 20 亿人生活在水资源紧张地区！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：节水行动 ────────────────────────────────────
const SaveWaterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const actions = [
    { icon: "🥬→🌸", title: "一水多用", desc: "洗菜水浇花，\n洗手水冲马桶", color: C.fresh },
    { icon: "🔧", title: "修复漏水", desc: "发现水龙头滴水\n立刻报告大人修理", color: C.ocean },
    { icon: "🚿", title: "节水器具", desc: "节水马桶、\n低流量淋浴头", color: C.ground },
    { icon: "🚫🗑️", title: "不污染水源", desc: "不往河里\n扔垃圾和废物", color: C.gold },
    { icon: "🖐️💧", title: "随手关水", desc: "刷牙洗手时\n关掉水龙头", color: "#f472b6" },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(52,211,153,.12) 0%, transparent 60%), ${C.bg}`,
    }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>💚 我们能做什么？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>节水行动，从我做起！</div>
      </div>

      <div style={{
        position: "absolute", top: 180, left: 60, right: 60,
        display: "flex", gap: 28, flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {actions.map((a, i) => {
          const delay = 15 + i * 18;
          const progSpring = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
          const op = Math.min(progSpring, 1);
          const sc = 0.7 + 0.3 * Math.min(progSpring, 1);

          return (
            <div key={a.title} style={{
              width: 300,
              background: `${a.color}0f`,
              border: `2px solid ${a.color}55`,
              borderRadius: 20, padding: "28px 24px",
              textAlign: "center",
              opacity: op, transform: `scale(${sc})`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{a.icon}</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: a.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
              }}>{a.title}</div>
              <div style={{
                fontSize: 22, color: "#cbd5e1",
                fontFamily: "'PingFang SC',sans-serif",
                lineHeight: 1.6, whiteSpace: "pre-line",
              }}>{a.desc}</div>
            </div>
          );
        })}
      </div>

      {/* final message */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [105, 125], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, rgba(52,211,153,.2) 0%, rgba(14,165,233,.2) 100%)",
          border: "2px solid rgba(52,211,153,.4)",
          borderRadius: 20, padding: "16px 48px",
          fontSize: 32, fontWeight: 700, color: C.fresh,
        }}>
          💧 水是生命之源，节约每一滴水！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const WaterEarthVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={100}><TitleScene /></Sequence>
      <Sequence from={100} durationInFrames={150}><PieChartScene /></Sequence>
      <Sequence from={250} durationInFrames={140}><FreshwaterScene /></Sequence>
      <Sequence from={390} durationInFrames={140}><ProblemScene /></Sequence>
      <Sequence from={530} durationInFrames={130}><SaveWaterScene /></Sequence>
    </AbsoluteFill>
  );
};
