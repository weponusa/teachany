import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  spring: "#34d399",
  summer: "#fbbf24",
  autumn: "#f97316",
  winter: "#38bdf8",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 120, damping: 14 } });

  const seasons = [
    { emoji: "🌸", label: "春", color: C.spring },
    { emoji: "☀️", label: "夏", color: C.summer },
    { emoji: "🍂", label: "秋", color: C.autumn },
    { emoji: "❄️", label: "冬", color: C.winter },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(52,211,153,.2) 0%, transparent 55%),
                   radial-gradient(ellipse at 20% 80%, rgba(56,189,248,.15) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 四季图标行 */}
      <div style={{
        display: "flex", gap: 40, marginBottom: 48,
        transform: `scale(${Math.min(emojiScale, 1)})`,
        opacity: Math.min(emojiScale, 1),
      }}>
        {seasons.map((s, i) => (
          <div key={s.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              background: s.color + "22",
              border: `3px solid ${s.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 60,
              boxShadow: `0 0 30px ${s.color}44`,
            }}>{s.emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color,
              fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 92, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 20%,#34d399 60%,#38bdf8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        marginBottom: 24,
      }}>四季变化</div>

      <div style={{
        fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        marginBottom: 36,
      }}>小学科学 G2 · 地球与宇宙科学</div>

      <div style={{
        display: "flex", gap: 24, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🌡️ 气温变化", "🌧️ 降水规律", "🌞 四季成因"].map((t, i) => (
          <div key={i} style={{
            padding: "14px 30px", borderRadius: 99,
            background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.35)",
            color: C.spring, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：春夏展示 ────────────────────────────────────
const SpringSummerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 树木生长动画（春：嫩绿小树 → 夏：茂盛大树）
  const treeSpring = spring({ frame: frame - 10, fps, config: { stiffness: 60, damping: 20 } });
  const treeSummer = spring({ frame: frame - 55, fps, config: { stiffness: 50, damping: 22 } });

  const springFeatures = ["🌸 百花开放", "🐦 动物苏醒", "🌱 植物发芽", "🌡️ 气温回暖"];
  const summerFeatures = ["☀️ 炎热多雨", "🌿 绿叶茂盛", "🦟 昆虫活跃", "⛈️ 频繁雷雨"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🌸 春天与夏天</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>温暖 → 炎热，生命在这里苏醒、茁壮</div>
      </div>

      <div style={{ position: "absolute", top: 155, left: 50, right: 50, display: "flex", gap: 40 }}>
        {/* 春天 */}
        <div style={{
          flex: 1, background: "rgba(52,211,153,.08)",
          border: "2px solid rgba(52,211,153,.5)", borderRadius: 24,
          padding: "28px 32px",
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          {/* 春天树动画 */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              fontSize: 80,
              transform: `scale(${0.6 + 0.4 * Math.min(treeSpring, 1)})`,
              display: "inline-block",
            }}>🌳</div>
            <div style={{
              fontSize: 40,
              opacity: Math.min(treeSpring, 1),
              display: "inline-block",
              marginLeft: 8,
            }}>🌸🌸</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.spring, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif" }}>🌸 春天</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginBottom: 8,
            fontFamily: "'PingFang SC',sans-serif" }}>气温：5°C ~ 20°C</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {springFeatures.map((f, i) => (
              <div key={i} style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)",
                color: "#6ee7b7", fontSize: 24,
                fontFamily: "'PingFang SC',sans-serif",
                opacity: interpolate(frame, [20 + i * 8, 35 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
              }}>{f}</div>
            ))}
          </div>
        </div>

        {/* 夏天 */}
        <div style={{
          flex: 1, background: "rgba(251,191,36,.08)",
          border: "2px solid rgba(251,191,36,.5)", borderRadius: 24,
          padding: "28px 32px",
          opacity: interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          {/* 夏天树动画 */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              fontSize: 100,
              transform: `scale(${0.7 + 0.3 * Math.min(treeSummer, 1)})`,
              display: "inline-block",
            }}>🌳</div>
            <div style={{
              fontSize: 40,
              opacity: Math.min(treeSummer, 1),
              display: "inline-block",
              marginLeft: 8,
            }}>☀️</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.summer, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif" }}>☀️ 夏天</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginBottom: 8,
            fontFamily: "'PingFang SC',sans-serif" }}>气温：25°C ~ 38°C</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {summerFeatures.map((f, i) => (
              <div key={i} style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.3)",
                color: "#fde68a", fontSize: 24,
                fontFamily: "'PingFang SC',sans-serif",
                opacity: interpolate(frame, [65 + i * 8, 80 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：秋冬展示 ────────────────────────────────────
const AutumnWinterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 落叶动画
  const leafFall = interpolate(frame, [20, 80], [0, 200], { extrapolateRight: "clamp" });
  const leafOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // 雪花动画
  const snowFall = interpolate(frame, [70, 130], [0, 180], { extrapolateRight: "clamp" });
  const snowOp = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });

  const autumnFeatures = ["🍂 落叶缤纷", "🍎 果实成熟", "🌡️ 气温降低", "🌾 农民收获"];
  const winterFeatures = ["❄️ 寒冷干燥", "🐻 动物冬眠", "⛄ 白雪皑皑", "🧥 厚衣保暖"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🍂 秋天与冬天</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>凉爽 → 寒冷，万物进入休养</div>
      </div>

      {/* 落叶动画 */}
      {["🍂", "🍁", "🍃"].map((leaf, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${25 + i * 12}%`,
          top: leafFall + i * 30,
          fontSize: 36,
          opacity: leafOp,
          transform: `rotate(${frame * (i + 1) * 3}deg)`,
          pointerEvents: "none",
        }}>{leaf}</div>
      ))}

      {/* 雪花动画 */}
      {["❄️", "⭐", "❅"].map((snow, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${60 + i * 10}%`,
          top: snowFall + i * 20,
          fontSize: 28,
          opacity: snowOp,
          transform: `rotate(${frame * (i + 1) * 4}deg)`,
          pointerEvents: "none",
        }}>{snow}</div>
      ))}

      <div style={{ position: "absolute", top: 155, left: 50, right: 50, display: "flex", gap: 40 }}>
        {/* 秋天 */}
        <div style={{
          flex: 1, background: "rgba(249,115,22,.08)",
          border: "2px solid rgba(249,115,22,.5)", borderRadius: 24,
          padding: "28px 32px",
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ textAlign: "center", marginBottom: 24, fontSize: 90 }}>🍂</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.autumn, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif" }}>🍂 秋天</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginBottom: 8,
            fontFamily: "'PingFang SC',sans-serif" }}>气温：10°C ~ 22°C</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {autumnFeatures.map((f, i) => (
              <div key={i} style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.3)",
                color: "#fed7aa", fontSize: 24,
                fontFamily: "'PingFang SC',sans-serif",
                opacity: interpolate(frame, [20 + i * 8, 35 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
              }}>{f}</div>
            ))}
          </div>
        </div>

        {/* 冬天 */}
        <div style={{
          flex: 1, background: "rgba(56,189,248,.08)",
          border: "2px solid rgba(56,189,248,.5)", borderRadius: 24,
          padding: "28px 32px",
          opacity: interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ textAlign: "center", marginBottom: 24, fontSize: 90 }}>❄️</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.winter, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif" }}>❄️ 冬天</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginBottom: 8,
            fontFamily: "'PingFang SC',sans-serif" }}>气温：-5°C ~ 8°C</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {winterFeatures.map((f, i) => (
              <div key={i} style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(56,189,248,.1)", border: "1px solid rgba(56,189,248,.3)",
                color: "#bae6fd", fontSize: 24,
                fontFamily: "'PingFang SC',sans-serif",
                opacity: interpolate(frame, [65 + i * 8, 80 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：四季成因（地球公转轨道动画） ─────────────────
const ReasonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 地球公转角度 —— 绕太阳一圈
  const orbitAngle = interpolate(frame, [15, 145], [0, Math.PI * 2], { extrapolateRight: "clamp" });

  const CX = 960, CY = 560; // 太阳位置（中心偏右）
  const RX = 340, RY = 200; // 轨道半径
  const earthX = CX + RX * Math.cos(orbitAngle - Math.PI / 2);
  const earthY = CY + RY * Math.sin(orbitAngle - Math.PI / 2);

  // 四季位置
  const seasonPositions = [
    { angle: 0,              label: "春", color: C.spring, emoji: "🌸" },
    { angle: Math.PI / 2,    label: "夏", color: C.summer, emoji: "☀️" },
    { angle: Math.PI,        label: "秋", color: C.autumn, emoji: "🍂" },
    { angle: Math.PI * 1.5,  label: "冬", color: C.winter, emoji: "❄️" },
  ];

  const explanationOp = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🌍 为什么有四季？</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>地球公转 + 地轴倾斜 = 四季形成</div>
      </div>

      {/* SVG 轨道图 */}
      <svg style={{ position: "absolute", inset: 0 }} width="1920" height="1080" viewBox="0 0 1920 1080">
        {/* 轨道椭圆 */}
        <ellipse
          cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="2" strokeDasharray="12 8"
        />

        {/* 太阳光晕 */}
        <circle cx={CX} cy={CY} r={80} fill="rgba(251,191,36,0.15)" />
        <circle cx={CX} cy={CY} r={55} fill="rgba(251,191,36,0.3)" />

        {/* 四季标注点 */}
        {seasonPositions.map((s) => {
          const sx = CX + RX * Math.cos(s.angle - Math.PI / 2);
          const sy = CY + RY * Math.sin(s.angle - Math.PI / 2);
          return (
            <g key={s.label}>
              <circle cx={sx} cy={sy} r={8} fill={s.color} opacity={0.8} />
              <text x={sx + (sx > CX ? 18 : -18)} y={sy + 6}
                fill={s.color} fontSize="24" fontWeight="800"
                fontFamily="'PingFang SC',sans-serif"
                textAnchor={sx > CX ? "start" : "end"}>{s.emoji} {s.label}</text>
            </g>
          );
        })}

        {/* 地球运动轨迹（已走过的弧线） */}
        {orbitAngle > 0.1 && (
          <path
            d={`M ${CX} ${CY - RY} A ${RX} ${RY} 0 ${orbitAngle > Math.PI ? 1 : 0} 1 ${earthX} ${earthY}`}
            fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="3"
          />
        )}

        {/* 地球 */}
        <circle cx={earthX} cy={earthY} r={28} fill="rgba(56,189,248,0.2)" stroke={C.winter} strokeWidth="3" />
        <text x={earthX} y={earthY + 12} fontSize="36" textAnchor="middle">🌍</text>

        {/* 地轴倾斜线 */}
        <line
          x1={earthX - 15} y1={earthY - 38}
          x2={earthX + 15} y2={earthY + 38}
          stroke="rgba(248,113,113,0.7)" strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* 太阳 emoji */}
      <div style={{
        position: "absolute",
        left: CX - 40, top: CY - 44,
        fontSize: 80, textAlign: "center",
      }}>☀️</div>

      {/* 解释文字 */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60,
        display: "flex", gap: 24, opacity: explanationOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ flex: 1, background: "rgba(52,211,153,.1)", borderRadius: 14,
          padding: "16px 20px", border: "1px solid rgba(52,211,153,.3)" }}>
          <span style={{ color: C.spring, fontWeight: 700, fontSize: 26 }}>① 地球公转：</span>
          <span style={{ color: "#cbd5e1", fontSize: 24 }}>地球绕太阳转一圈约365天，走遍春夏秋冬</span>
        </div>
        <div style={{ flex: 1, background: "rgba(248,113,113,.1)", borderRadius: 14,
          padding: "16px 20px", border: "1px solid rgba(248,113,113,.3)" }}>
          <span style={{ color: "#f87171", fontWeight: 700, fontSize: 26 }}>② 地轴倾斜：</span>
          <span style={{ color: "#cbd5e1", fontSize: 24 }}>地轴倾斜23.5°，导致不同季节阳光角度不同</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    { emoji: "🌸", color: C.spring,  title: "春天", text: "气温回暖\n百花开放·动物苏醒" },
    { emoji: "☀️", color: C.summer,  title: "夏天", text: "炎热多雨\n绿叶茂盛·昆虫活跃" },
    { emoji: "🍂", color: C.autumn,  title: "秋天", text: "气温降低\n落叶飘飞·果实成熟" },
    { emoji: "❄️", color: C.winter,  title: "冬天", text: "寒冷干燥\n动物冬眠·白雪皑皑" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(52,211,153,.08) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🎯 四季变化 · 今天的发现</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>春暖花开 · 夏热多雨 · 秋爽丰收 · 冬寒降雪</div>
      </div>

      <div style={{
        position: "absolute", top: 170, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {points.map((p, i) => {
          const delay = 18 + i * 16;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 22, padding: "28px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 22, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: p.color + "1a", border: `3px solid ${p.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 50, flexShrink: 0,
              }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.65, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 成因提示 */}
      <div style={{
        position: "absolute", bottom: 44, left: 60, right: 60,
        textAlign: "center",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: "#93c5fd",
        background: "rgba(56,189,248,.07)",
        border: "1px solid rgba(56,189,248,.2)",
        borderRadius: 12, padding: "16px 24px",
      }}>
        🌍 四季成因：地球公转（365天/圈）+ 地轴倾斜（23.5°）→ 四季循环往复！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const SeasonsVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={100}><TitleScene /></Sequence>
      <Sequence from={100} durationInFrames={150}><SpringSummerScene /></Sequence>
      <Sequence from={250} durationInFrames={150}><AutumnWinterScene /></Sequence>
      <Sequence from={400} durationInFrames={160}><ReasonScene /></Sequence>
      <Sequence from={560} durationInFrames={100}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
