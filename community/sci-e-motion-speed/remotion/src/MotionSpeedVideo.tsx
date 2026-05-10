import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Color palette ───────────────────────────────────────
const C = {
  bg: "#060d1a",
  bg2: "#0a1628",
  card: "rgba(10,22,40,0.92)",
  text: "#f0f9ff",
  muted: "#94a3b8",
  primary: "#38bdf8",
  secondary: "#34d399",
  accent: "#fbbf24",
  orange: "#fb923c",
  purple: "#a78bfa",
  pink: "#f472b6",
  danger: "#f87171",
};

const font = "'PingFang SC','Microsoft YaHei',sans-serif";

// ── 场景1：标题（0–90帧） ──────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 22], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagsOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });
  const iconScale = spring({ frame: frame - 10, fps, config: { stiffness: 100, damping: 14 } });
  const glowPulse = 0.5 + 0.5 * Math.sin((frame / 30) * Math.PI);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 60% 30%, rgba(56,189,248,0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 20% 70%, rgba(52,211,153,0.12) 0%, transparent 50%),
          ${C.bg}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Animated background particles */}
      {[...Array(8)].map((_, i) => {
        const x = (i * 240 + 80) % 1920;
        const y = ((i * 137 + 200) % 800) + 100;
        const drift = interpolate(frame, [0, 90], [0, i % 2 === 0 ? -20 : 20], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + drift,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i % 3 === 0 ? C.primary : i % 3 === 1 ? C.secondary : C.accent,
              opacity: 0.3 + 0.2 * Math.sin((frame / 20 + i) * 1.5),
            }}
          />
        );
      })}

      {/* Speed icon cluster */}
      <div
        style={{
          fontSize: 110,
          transform: `scale(${Math.min(iconScale, 1)})`,
          marginBottom: 36,
          filter: `drop-shadow(0 0 ${20 + 10 * glowPulse}px rgba(56,189,248,0.6))`,
        }}
      >
        🚀
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          fontFamily: font,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          background: "linear-gradient(135deg, #fff 20%, #38bdf8 60%, #34d399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "0.04em",
        }}
      >
        运动与速度
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 24,
          fontSize: 38,
          color: C.muted,
          fontFamily: font,
          opacity: subOp,
        }}
      >
        小学科学 G4 · 物质科学
      </div>

      {/* Tag pills */}
      <div
        style={{
          marginTop: 48,
          display: "flex",
          gap: 28,
          opacity: tagsOp,
          fontFamily: font,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {["🏃 运动与参照物", "📐 v = s ÷ t", "⚡ 速度比一比", "🔄 四种运动方式"].map((tag, i) => (
          <div
            key={i}
            style={{
              padding: "14px 32px",
              borderRadius: 99,
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.35)",
              color: C.primary,
              fontSize: 30,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：参照物动画（火车/树木，90–225帧） ─────────────
const ReferenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const defOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });

  // Train moving right across screen
  const trainX = interpolate(frame, [0, 135], [-300, 2200], { extrapolateRight: "clamp" });
  // Trees move left (relative motion from train perspective)
  const tree1X = interpolate(frame, [0, 135], [400, -600], { extrapolateRight: "clamp" });
  const tree2X = interpolate(frame, [0, 135], [900, -100], { extrapolateRight: "clamp" });
  const tree3X = interpolate(frame, [0, 135], [1400, 400], { extrapolateRight: "clamp" });
  const tree4X = interpolate(frame, [0, 135], [1800, 800], { extrapolateRight: "clamp" });

  // Annotation bubbles
  const bubble1Op = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const bubble2Op = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });
  const bubble3Op = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Sky gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0a1f3d 0%, #0f2a50 40%, #1a3a2a 75%, #0d2010 100%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 55,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOp,
          fontFamily: font,
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🚂 参照物——判断运动的基准</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>
          选择不同的参照物，结论可能截然相反！
        </div>
      </div>

      {/* Ground */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          height: 6,
          background: "rgba(52,211,153,0.4)",
          boxShadow: "0 0 20px rgba(52,211,153,0.3)",
        }}
      />
      {/* Rail tracks */}
      <div
        style={{
          position: "absolute",
          bottom: 165,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(148,163,184,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 185,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(148,163,184,0.3)",
        }}
      />

      {/* Trees */}
      {[
        { x: tree1X, h: 200 },
        { x: tree2X, h: 170 },
        { x: tree3X, h: 220 },
        { x: tree4X, h: 185 },
      ].map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 185,
            left: t.x,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: t.h * 0.6, lineHeight: 1 }}>🌳</div>
        </div>
      ))}

      {/* Train */}
      <div
        style={{
          position: "absolute",
          bottom: 190,
          left: trainX,
          fontSize: 180,
          filter: "drop-shadow(0 8px 24px rgba(56,189,248,0.5))",
        }}
      >
        🚂
      </div>

      {/* Person inside train indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 270,
          left: trainX + 60,
          fontSize: 60,
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        👤
      </div>

      {/* Annotation bubbles */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          fontFamily: font,
        }}
      >
        <div
          style={{
            background: "rgba(56,189,248,0.12)",
            border: "2px solid rgba(56,189,248,0.45)",
            borderRadius: 16,
            padding: "22px 32px",
            opacity: bubble1Op,
            fontSize: 32,
            color: "#e2e8f0",
          }}
        >
          <span style={{ color: C.primary, fontWeight: 800 }}>参照物：</span>
          判断运动时选定的"不动"的标准物体
        </div>

        <div
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "2px solid rgba(251,191,36,0.4)",
            borderRadius: 16,
            padding: "22px 32px",
            opacity: bubble2Op,
            fontSize: 30,
            color: "#e2e8f0",
          }}
        >
          <span style={{ color: C.accent, fontWeight: 800 }}>以窗外的树🌳为参照物：</span>
          车里的人在{" "}
          <span style={{ color: "#f87171", fontWeight: 700 }}>运动</span>（向右移动）
        </div>

        <div
          style={{
            background: "rgba(52,211,153,0.1)",
            border: "2px solid rgba(52,211,153,0.4)",
            borderRadius: 16,
            padding: "22px 32px",
            opacity: bubble3Op,
            fontSize: 30,
            color: "#e2e8f0",
          }}
        >
          <span style={{ color: C.secondary, fontWeight: 800 }}>以车厢座位🪑为参照物：</span>
          车里的人{" "}
          <span style={{ color: "#34d399", fontWeight: 700 }}>静止</span>（没有移动）
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：速度公式推导（225–390帧） ─────────────────────
const FormulaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  // Formula reveal
  const step1Op = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const step2Op = interpolate(frame, [45, 62], [0, 1], { extrapolateRight: "clamp" });
  const step3Op = interpolate(frame, [68, 85], [0, 1], { extrapolateRight: "clamp" });
  const exampleOp = interpolate(frame, [95, 112], [0, 1], { extrapolateRight: "clamp" });
  const resultScale = spring({ frame: frame - 110, fps, config: { stiffness: 130, damping: 12 } });

  // Runner animation
  const runnerX = interpolate(frame, [20, 120], [120, 900], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 20%, rgba(167,139,250,0.1) 0%, transparent 60%)" }} />

      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", opacity: titleOp, fontFamily: font }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>📐 速度公式推导</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>从生活问题到数学公式</div>
      </div>

      {/* Runner track */}
      <div style={{ position: "absolute", top: 200, left: 80, right: 80 }}>
        {/* Track */}
        <div style={{
          height: 4, background: "rgba(148,163,184,0.3)",
          borderRadius: 2, marginBottom: 12, position: "relative",
          opacity: step1Op,
        }}>
          {/* Distance markers */}
          {[0, 10, 20, 30, 40, 50].map((m, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${i * 20}%`,
              top: -26,
              color: C.muted,
              fontSize: 22,
              fontFamily: font,
            }}>{m}m</div>
          ))}
        </div>

        {/* Runner */}
        <div style={{
          position: "absolute",
          top: -80,
          left: runnerX,
          fontSize: 80,
          opacity: step1Op,
          transition: "left 0.1s linear",
        }}>🏃</div>

        {/* Time display */}
        <div style={{
          position: "absolute",
          top: 30,
          left: 0,
          fontSize: 30,
          color: C.accent,
          fontFamily: font,
          opacity: step1Op,
        }}>
          ⏱ {Math.round(interpolate(frame, [20, 120], [0, 10], { extrapolateRight: "clamp" }))}秒
        </div>
        <div style={{
          position: "absolute",
          top: 30,
          right: 0,
          fontSize: 30,
          color: C.secondary,
          fontFamily: font,
          opacity: step1Op,
        }}>
          📏 {Math.round(interpolate(frame, [20, 120], [0, 50], { extrapolateRight: "clamp" }))}米
        </div>
      </div>

      {/* Formula steps */}
      <div style={{
        position: "absolute",
        top: 350,
        left: 80, right: 80,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        fontFamily: font,
      }}>
        {/* Step 1 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          opacity: step1Op,
        }}>
          <div style={{
            background: "rgba(56,189,248,0.15)",
            border: "2px solid rgba(56,189,248,0.4)",
            borderRadius: 12, padding: "16px 28px",
            fontSize: 34, color: "#e2e8f0",
          }}>
            <span style={{ color: C.secondary, fontWeight: 800 }}>问题：</span>
            跑50米用了10秒，跑得有多快？
          </div>
        </div>

        {/* Step 2 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          opacity: step2Op,
        }}>
          <div style={{
            background: "rgba(251,191,36,0.1)",
            border: "2px solid rgba(251,191,36,0.4)",
            borderRadius: 12, padding: "16px 28px",
            fontSize: 34, color: "#e2e8f0",
          }}>
            <span style={{ color: C.accent, fontWeight: 800 }}>想法：</span>
            "每秒走多少米" → 距离 ÷ 时间
          </div>
        </div>

        {/* Step 3 - Formula */}
        <div style={{ opacity: step3Op }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(56,189,248,0.15))",
            border: "3px solid rgba(167,139,250,0.6)",
            borderRadius: 20, padding: "28px 40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 48,
            boxShadow: "0 0 40px rgba(167,139,250,0.2)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, color: C.muted, fontFamily: font, marginBottom: 6 }}>速度</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: C.purple, fontFamily: font }}>v</div>
            </div>
            <div style={{ fontSize: 64, color: C.muted }}>=</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, color: C.muted, fontFamily: font, marginBottom: 6 }}>距离</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: C.secondary, fontFamily: font }}>s</div>
            </div>
            <div style={{ fontSize: 64, color: C.muted }}>÷</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, color: C.muted, fontFamily: font, marginBottom: 6 }}>时间</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: C.accent, fontFamily: font }}>t</div>
            </div>
            <div style={{ fontSize: 48, color: C.muted, margin: "0 12px" }}>→</div>
            <div style={{ fontSize: 58, fontWeight: 900, color: "#fff", fontFamily: font }}>
              v = s ÷ t
            </div>
          </div>
        </div>

        {/* Example calculation */}
        <div style={{
          opacity: exampleOp,
          background: "rgba(52,211,153,0.1)",
          border: "2px solid rgba(52,211,153,0.4)",
          borderRadius: 16, padding: "20px 32px",
          display: "flex", alignItems: "center", gap: 32,
          fontSize: 32, fontFamily: font, color: "#e2e8f0",
        }}>
          <span>✅ 代入计算：</span>
          <span style={{ color: C.secondary, fontWeight: 700 }}>v = 50m ÷ 10s</span>
          <span>=</span>
          <div style={{
            fontSize: 44, fontWeight: 900, color: "#fff",
            transform: `scale(${Math.min(resultScale, 1)})`,
            display: "inline-block",
            background: "linear-gradient(135deg,#34d399,#38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            5 m/s
          </div>
          <span style={{ fontSize: 26, color: C.muted }}>（每秒跑5米）</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：速度对比条形图（390–540帧） ────────────────────
const SpeedCompareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  // Speed data — using LOG scale for visualization
  const speeds = [
    { name: "🐌 蜗牛",   value: 0.05,   log: 0,    color: "#94a3b8", unit: "0.05 m/s" },
    { name: "🚶 步行",   value: 1.5,    log: 1.48, color: "#34d399", unit: "1.5 m/s" },
    { name: "🚲 自行车", value: 5,      log: 2.30, color: "#38bdf8", unit: "5 m/s" },
    { name: "🚗 汽车",   value: 30,     log: 3.40, color: "#fb923c", unit: "30 m/s" },
    { name: "🚄 高铁",   value: 80,     log: 4.08, color: "#a78bfa", unit: "80 m/s" },
    { name: "🔊 声音",   value: 340,    log: 5.83, color: "#fbbf24", unit: "340 m/s" },
    { name: "💡 光",     value: 3e8,    log: 10,   color: "#f472b6", unit: "3×10⁸ m/s" },
  ];

  // Max log for normalization
  const maxLog = 10;
  const chartWidth = 1600;
  const barHeight = 64;
  const barGap = 18;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 10%, rgba(251,191,36,0.08) 0%, transparent 50%)",
      }} />

      <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", opacity: titleOp, fontFamily: font }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>⚡ 各种速度大比拼（对数坐标）</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          用对数刻度展示——从蜗牛到光速的巨大差距
        </div>
      </div>

      {/* Bars */}
      <div style={{
        position: "absolute",
        top: 155,
        left: 140,
        right: 60,
      }}>
        {speeds.map((s, i) => {
          const delay = 15 + i * 14;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 22 } });
          const barW = (s.log / maxLog) * chartWidth * Math.min(prog, 1);
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={s.name} style={{
              display: "flex", alignItems: "center", gap: 20,
              marginBottom: barGap, opacity,
            }}>
              {/* Label */}
              <div style={{
                width: 160, textAlign: "right",
                fontSize: 28, color: "#e2e8f0", fontFamily: font,
                flexShrink: 0,
              }}>
                {s.name}
              </div>

              {/* Bar */}
              <div style={{ position: "relative", height: barHeight, flex: 1 }}>
                {/* Background track */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                }} />
                {/* Filled bar */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0, left: 0,
                  width: barW,
                  background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                  borderRadius: 8,
                  boxShadow: `0 0 16px ${s.color}44`,
                  display: "flex", alignItems: "center", paddingLeft: 14,
                  overflow: "hidden",
                }}>
                  {barW > 80 && (
                    <span style={{
                      fontSize: 24, fontWeight: 700, color: "#fff",
                      fontFamily: font, whiteSpace: "nowrap",
                    }}>
                      {s.unit}
                    </span>
                  )}
                </div>
                {/* Value label outside if bar too short */}
                {barW <= 80 && (
                  <div style={{
                    position: "absolute",
                    top: "50%", left: barW + 8,
                    transform: "translateY(-50%)",
                    fontSize: 22, color: s.color, fontFamily: font,
                    fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    {s.unit}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key insight */}
      <div style={{
        position: "absolute", bottom: 40, left: 80, right: 80,
        background: "rgba(244,114,182,0.1)",
        border: "2px solid rgba(244,114,182,0.4)",
        borderRadius: 16, padding: "20px 32px",
        textAlign: "center",
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: font,
      }}>
        <span style={{ fontSize: 30, color: "#e2e8f0" }}>
          💡 光速是蜗牛的
          <span style={{ color: C.pink, fontWeight: 800, fontSize: 36 }}>60亿倍</span>
          ！每秒绕地球
          <span style={{ color: C.accent, fontWeight: 800 }}>7.5圈</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结（540–660帧） ──────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "🏃",
      color: C.secondary,
      title: "运动的本质",
      text: "物体位置随时间变化\n判断运动需要参照物",
    },
    {
      icon: "📐",
      color: C.purple,
      title: "速度公式",
      text: "v = s ÷ t\n速度 = 距离 ÷ 时间",
    },
    {
      icon: "⚡",
      color: C.accent,
      title: "速度对比",
      text: "蜗牛→步行→自行车→汽车\n→高铁→声音→光（最快）",
    },
    {
      icon: "🔄",
      color: C.primary,
      title: "四种运动方式",
      text: "直线·曲线·往复·转动\n匀速 vs 变速",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.1) 0%, transparent 65%)",
      }} />

      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", opacity: titleOp, fontFamily: font }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🎯 今天的四大收获</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>运动与速度 · G4 物质科学</div>
      </div>

      <div style={{
        position: "absolute", top: 180, left: 80, right: 80,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 22 + i * 20;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [20, 0], { extrapolateRight: "clamp" });
          const sc = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 18 } });

          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,0.9)",
              borderRadius: 20,
              padding: "32px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 24, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px) scale(${Math.min(sc, 1)})`,
              boxShadow: `0 0 24px ${p.color}18`,
            }}>
              <div style={{ fontSize: 80, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: p.color, fontFamily: font, marginBottom: 10 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 28, color: "#e2e8f0", fontFamily: font, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {p.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom message */}
      <div style={{
        position: "absolute", bottom: 46, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [96, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: font,
      }}>
        <div style={{ fontSize: 32, color: "#a5f3fc" }}>
          🌟 速度是科学描述运动快慢的精确语言——用数字说话！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ──────────────────────────────────────
export const MotionSpeedVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      {/* 场景1: 标题 0-90 */}
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>
      {/* 场景2: 参照物 90-225 */}
      <Sequence from={90} durationInFrames={135}>
        <ReferenceScene />
      </Sequence>
      {/* 场景3: 速度公式 225-390 */}
      <Sequence from={225} durationInFrames={165}>
        <FormulaScene />
      </Sequence>
      {/* 场景4: 速度对比 390-540 */}
      <Sequence from={390} durationInFrames={150}>
        <SpeedCompareScene />
      </Sequence>
      {/* 场景5: 总结 540-660 */}
      <Sequence from={540} durationInFrames={120}>
        <SummaryScene />
      </Sequence>
    </AbsoluteFill>
  );
};
