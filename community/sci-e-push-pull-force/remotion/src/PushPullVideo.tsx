import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628",
  bg2: "#0f2040",
  text: "#f0f9ff",
  muted: "#94a3b8",
  push: "#f59e0b",    // amber – push force
  pull: "#34d399",    // emerald – pull force
  effect: "#a78bfa",  // violet – effects
  size: "#38bdf8",    // sky – force size
  white: "#ffffff",
};

// ── 场景1：标题 (0–90 frames) ─────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const arrowScale = spring({ frame: frame - 45, fps, config: { stiffness: 100, damping: 14 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 35%, rgba(245,158,11,.18) 0%, rgba(52,211,153,.12) 50%, transparent 80%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Big emoji arrows */}
      <div style={{
        display: "flex", gap: 40, marginBottom: 28,
        transform: `scale(${Math.min(arrowScale, 1)})`,
        opacity: Math.min(arrowScale, 1),
      }}>
        <span style={{ fontSize: 90 }}>⬅️</span>
        <span style={{ fontSize: 90 }}>🧲</span>
        <span style={{ fontSize: 90 }}>➡️</span>
      </div>

      {/* Main title */}
      <div style={{
        fontSize: 96, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        background: "linear-gradient(135deg, #fff 20%, #f59e0b 60%, #34d399 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        textAlign: "center",
      }}>推和拉的力</div>

      <div style={{
        marginTop: 20, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G2 · 物质科学</div>

      {/* Badge row */}
      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: badgeOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { icon: "👉", text: "推力：离开自己", color: C.push },
          { icon: "🤏", text: "拉力：靠近自己", color: C.pull },
          { icon: "💥", text: "力的神奇效果", color: C.effect },
        ].map((b, i) => (
          <div key={i} style={{
            padding: "14px 30px", borderRadius: 99,
            background: b.color + "1a", border: `2px solid ${b.color}66`,
            color: b.color, fontSize: 28,
          }}>{b.icon} {b.text}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：推力展示 (90–240 frames) ──────────────────
const PushScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Arrow animation: grows from center outward
  const arrowW = interpolate(frame, [20, 60], [0, 380], { extrapolateRight: "clamp" });
  const cartX = interpolate(frame, [20, 70], [0, 220], { extrapolateRight: "clamp" });
  const handOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  const examplesOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const defOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  const examples = [
    { icon: "🚪", text: "推开门" },
    { icon: "🛒", text: "推小车" },
    { icon: "⚽", text: "推球" },
    { icon: "📦", text: "推箱子" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 900, color: C.push }}>👉 推力</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>用力把物体推离自己</div>
      </div>

      {/* Animation: hand → arrow → cart */}
      <div style={{
        position: "absolute", top: 180, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
      }}>
        {/* Hand */}
        <div style={{ fontSize: 100, opacity: handOp, marginRight: 10 }}>🤜</div>

        {/* Arrow extending right */}
        <div style={{
          height: 16, width: arrowW, borderRadius: 8,
          background: `linear-gradient(90deg, ${C.push}, #fff)`,
          boxShadow: `0 0 20px ${C.push}88`,
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Arrow head */}
          <div style={{
            position: "absolute", right: -22, top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "20px solid transparent",
            borderBottom: "20px solid transparent",
            borderLeft: `28px solid ${C.push}`,
          }} />
        </div>

        {/* Cart moving right */}
        <div style={{
          fontSize: 90,
          transform: `translateX(${cartX}px)`,
          marginLeft: 16,
        }}>🚗</div>
      </div>

      {/* Direction label */}
      <div style={{
        position: "absolute", top: 370, left: 0, right: 0,
        textAlign: "center", opacity: defOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          padding: "12px 36px", borderRadius: 14,
          background: C.push + "22", border: `2px solid ${C.push}66`,
          fontSize: 32, color: C.push, fontWeight: 700,
        }}>
          力的方向 → 物体向<span style={{ color: "#fff" }}>推的方向</span>运动，力越大动得越快 💨
        </div>
      </div>

      {/* Example cards */}
      <div style={{
        position: "absolute", bottom: 70, left: 80, right: 80,
        display: "flex", gap: 24, opacity: examplesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {examples.map((e, i) => {
          const delay = 80 + i * 12;
          const op2 = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y2 = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              flex: 1, background: C.push + "15",
              border: `2px solid ${C.push}44`, borderRadius: 18,
              padding: "24px 0", textAlign: "center",
              opacity: op2, transform: `translateY(${y2}px)`,
            }}>
              <div style={{ fontSize: 64 }}>{e.icon}</div>
              <div style={{ fontSize: 28, color: C.push, marginTop: 10 }}>{e.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：拉力展示 (240–390 frames) ─────────────────
const PullScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Arrow goes leftward (pull direction)
  const arrowW = interpolate(frame, [20, 60], [0, 360], { extrapolateRight: "clamp" });
  const cartX = interpolate(frame, [20, 70], [0, -200], { extrapolateRight: "clamp" });
  const handOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const defOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const examplesOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const examples = [
    { icon: "🗄️", text: "拉开抽屉" },
    { icon: "🪢", text: "拉绳子" },
    { icon: "🪁", text: "拉风筝" },
    { icon: "🌾", text: "拔草" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 900, color: C.pull }}>🤏 拉力</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>用力把物体拉向自己</div>
      </div>

      {/* Animation: cart ← arrow ← hand */}
      <div style={{
        position: "absolute", top: 180, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Cart moving left */}
        <div style={{
          fontSize: 90,
          transform: `translateX(${cartX}px)`,
          marginRight: 16,
        }}>🚗</div>

        {/* Arrow extending left from hand */}
        <div style={{
          height: 16, width: arrowW, borderRadius: 8,
          background: `linear-gradient(270deg, ${C.pull}, #fff)`,
          boxShadow: `0 0 20px ${C.pull}88`,
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Arrow head pointing LEFT */}
          <div style={{
            position: "absolute", left: -22, top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "20px solid transparent",
            borderBottom: "20px solid transparent",
            borderRight: `28px solid ${C.pull}`,
          }} />
        </div>

        {/* Hand pulling */}
        <div style={{ fontSize: 100, opacity: handOp, marginLeft: 10 }}>🤛</div>
      </div>

      {/* Direction label */}
      <div style={{
        position: "absolute", top: 370, left: 0, right: 0,
        textAlign: "center", opacity: defOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          padding: "12px 36px", borderRadius: 14,
          background: C.pull + "22", border: `2px solid ${C.pull}66`,
          fontSize: 32, color: C.pull, fontWeight: 700,
        }}>
          力的方向 ← 物体向<span style={{ color: "#fff" }}>拉的方向</span>运动，力越大效果越明显 🧲
        </div>
      </div>

      {/* Example cards */}
      <div style={{
        position: "absolute", bottom: 70, left: 80, right: 80,
        display: "flex", gap: 24, opacity: examplesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {examples.map((e, i) => {
          const delay = 80 + i * 12;
          const op2 = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y2 = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              flex: 1, background: C.pull + "15",
              border: `2px solid ${C.pull}44`, borderRadius: 18,
              padding: "24px 0", textAlign: "center",
              opacity: op2, transform: `translateY(${y2}px)`,
            }}>
              <div style={{ fontSize: 64 }}>{e.icon}</div>
              <div style={{ fontSize: 28, color: C.pull, marginTop: 10 }}>{e.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：力的效果对比 (390–540 frames) ──────────────
const EffectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Effect 1: motion change
  const ballX = interpolate(frame, [30, 80], [0, 280], { extrapolateRight: "clamp" });
  const ballOp = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });

  // Effect 2: shape change — clay squish
  const clayH = interpolate(frame, [80, 120], [80, 30], { extrapolateRight: "clamp" });
  const clayW = interpolate(frame, [80, 120], [80, 150], { extrapolateRight: "clamp" });
  const clayOp = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp" });

  const e1Op = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const e2Op = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const summaryOp = interpolate(frame, [125, 145], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: C.effect }}>💥 力的神奇效果</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>力能改变运动状态 · 力能改变形状</div>
      </div>

      {/* Effect 1: 改变运动状态 */}
      <div style={{
        position: "absolute", top: 160, left: 60, width: 820,
        opacity: e1Op, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          fontSize: 34, fontWeight: 800, color: C.effect, marginBottom: 20,
        }}>效果一：改变运动状态 🏃</div>
        <div style={{
          background: "rgba(167,139,250,.08)", border: "2px solid rgba(167,139,250,.3)",
          borderRadius: 20, padding: "28px", height: 220,
          display: "flex", alignItems: "center", overflow: "hidden",
        }}>
          {/* Static ball then motion */}
          <div style={{
            fontSize: 70,
            transform: `translateX(${ballX}px)`,
            opacity: ballOp,
            transition: "none",
          }}>⚽</div>
          {/* Force arrow */}
          <div style={{
            position: "absolute", left: 88, top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center", gap: 8,
            opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            <div style={{ fontSize: 30, color: C.push }}>👉 推！</div>
          </div>
          {/* speed lines */}
          {[0,1,2].map(i => (
            <div key={i} style={{
              position: "absolute",
              left: 100 + ballX * 0.6 + i * 18,
              top: "46%", width: 40 + i * 15, height: 3,
              background: C.push + "66", borderRadius: 3,
              opacity: interpolate(frame, [50, 70], [0, 0.8], { extrapolateRight: "clamp" }),
            }} />
          ))}
          <div style={{
            marginLeft: 24, fontSize: 26, color: "#e2e8f0", lineHeight: 1.7,
          }}>
            静止的球 → <span style={{ color: C.push, fontWeight: 700 }}>推一下</span> → 球动起来了！<br />
            运动的球 → <span style={{ color: C.pull, fontWeight: 700 }}>挡一下</span> → 球停下来了！
          </div>
        </div>
      </div>

      {/* Effect 2: 改变形状 */}
      <div style={{
        position: "absolute", top: 160, right: 60, width: 820,
        opacity: e2Op, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          fontSize: 34, fontWeight: 800, color: "#fb923c", marginBottom: 20,
        }}>效果二：改变物体形状 🏺</div>
        <div style={{
          background: "rgba(251,146,60,.08)", border: "2px solid rgba(251,146,60,.3)",
          borderRadius: 20, padding: "28px", height: 220,
          display: "flex", alignItems: "center", gap: 40,
        }}>
          {/* Clay blob deforming */}
          <div style={{
            width: clayW, height: clayH,
            background: "linear-gradient(135deg, #f97316, #fb923c)",
            borderRadius: 20, opacity: clayOp,
            boxShadow: "0 4px 20px rgba(249,115,22,.4)",
          }} />
          <div style={{ fontSize: 26, color: "#e2e8f0", lineHeight: 1.7 }}>
            <span style={{ color: "#fb923c", fontWeight: 700 }}>捏橡皮泥</span> → 形状变了！<br />
            <span style={{ color: "#fb923c", fontWeight: 700 }}>压弹簧</span> → 弹簧变短了！<br />
            <span style={{ color: "#fb923c", fontWeight: 700 }}>拉橡皮筋</span> → 橡皮筋变长了！
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        position: "absolute", bottom: 50, left: 60, right: 60,
        opacity: summaryOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(56,189,248,.08)", border: "2px solid rgba(56,189,248,.3)",
          borderRadius: 16, padding: "20px 40px", textAlign: "center",
          fontSize: 32, color: "#a5f3fc",
        }}>
          💡 推力和拉力都能改变物体的<span style={{ color: C.push, fontWeight: 700 }}>运动状态</span>
          ，也都能改变物体的<span style={{ color: "#fb923c", fontWeight: 700 }}>形状</span>！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 (540–660 frames) ──────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    { icon: "👉", color: C.push, title: "推力", text: "用力将物体推离\n向推的方向运动" },
    { icon: "🤏", color: C.pull, title: "拉力", text: "用力将物体拉近\n向拉的方向靠拢" },
    { icon: "💥", color: C.effect, title: "力的效果", text: "改变运动状态\n改变物体形状" },
    { icon: "📏", color: C.size, title: "力的大小", text: "力越大 → 效果越明显\n轻→重，小力→大力" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(245,158,11,.07) 0%, transparent 65%)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>🎯 今天学到了什么？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>推和拉的力 · 核心要点</div>
      </div>

      {/* Grid of 4 cards */}
      <div style={{
        position: "absolute", top: 165, left: 60, right: 60,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 18 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 22, padding: "30px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 22, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 70, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 34, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 26, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.65,
                  whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: "#a5f3fc",
      }}>
        🔬 观察生活中的推和拉，你还能找到哪些例子？
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const PushPullVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><PushScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><PullScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><EffectScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
