import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  land: "#34d399", water: "#38bdf8", sky: "#a78bfa",
  fur: "#fbbf24", feather: "#f472b6", scale: "#34d399", skin: "#22d3ee",
  white: "#fff",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 110, damping: 14 } });
  const badgeOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  const animals = ["🐕", "🦅", "🐟", "🐸", "🐍"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 65% 30%, rgba(167,139,250,.2) 0%, transparent 55%),
                   radial-gradient(ellipse at 25% 70%, rgba(52,211,153,.15) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 动物 emoji 行 */}
      <div style={{
        display: "flex", gap: 40, marginBottom: 40,
        transform: `scale(${Math.min(emojiScale, 1)})`,
        opacity: Math.min(emojiScale, 1),
      }}>
        {animals.map((a, i) => (
          <div key={i} style={{ fontSize: 90 }}>{a}</div>
        ))}
      </div>

      {/* 标题 */}
      <div style={{
        fontSize: 92, fontWeight: 900, color: C.white,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#a78bfa 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>动物的外形与特征</div>

      {/* 副标题 */}
      <div style={{
        marginTop: 24, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G2 · 生命科学</div>

      {/* 标签 */}
      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: badgeOp,
        fontFamily: "'PingFang SC',sans-serif",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {["🧥 体表覆盖物", "🏃 运动方式", "🏔️ 栖息地", "🌿 食性"].map((t, i) => (
          <div key={i} style={{
            padding: "14px 30px", borderRadius: 99,
            background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.4)",
            color: C.sky, fontSize: 30,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：体表覆盖物对比 ──────────────────────────────
const BodyCoverScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const covers = [
    { icon: "🐕", name: "毛发", type: "哺乳类", desc: "保暖、柔软\n触感舒适", color: C.fur, examples: "猫 狗 兔" },
    { icon: "🦅", name: "羽毛", type: "鸟类",   desc: "帮助飞翔\n防水保温", color: C.feather, examples: "鸡 鸭 鹰" },
    { icon: "🐟", name: "鳞片", type: "鱼类/爬行类", desc: "防水灵活\n反光保护", color: C.scale, examples: "鱼 蛇 鳄鱼" },
    { icon: "🐸", name: "光滑皮肤", type: "两栖类", desc: "皮肤呼吸\n保持湿润", color: C.skin, examples: "青蛙 蟾蜍" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: C.white }}>🧥 体表覆盖物的秘密</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>不同动物身体表面大不同</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 50, right: 50,
        display: "flex", gap: 30,
      }}>
        {covers.map((c, i) => {
          const delay = 20 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.6 + 0.4 * Math.min(prog, 1);

          return (
            <div key={c.name} style={{
              flex: 1,
              background: c.color + "10",
              border: `2px solid ${c.color}55`,
              borderRadius: 20, padding: "28px 20px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
            }}>
              <div style={{ fontSize: 80, marginBottom: 16 }}>{c.icon}</div>
              <div style={{
                fontSize: 38, fontWeight: 800, color: c.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>{c.name}</div>
              <div style={{
                fontSize: 22, color: "#94a3b8",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
              }}>{c.type}</div>
              <div style={{
                fontSize: 24, color: "#e2e8f0",
                fontFamily: "'PingFang SC',sans-serif",
                textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line",
                marginBottom: 14,
              }}>{c.desc}</div>
              <div style={{
                padding: "6px 16px", borderRadius: 99,
                background: c.color + "20", border: `1px solid ${c.color}44`,
                fontSize: 20, color: c.color,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.examples}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：运动方式动画 ────────────────────────────────
const MovementScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const movements = [
    { icon: "🐕", move: "行走/奔跑", body: "四肢", color: C.land, anim: "🏃" },
    { icon: "🦅", move: "飞翔",    body: "翅膀", color: C.sky,   anim: "✈️" },
    { icon: "🐟", move: "游泳",    body: "鳍",   color: C.water, anim: "🌊" },
    { icon: "🐍", move: "爬行",    body: "躯干", color: C.fur,   anim: "〰️" },
    { icon: "🐸", move: "跳跃",    body: "后腿", color: "#f472b6", anim: "⬆️" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: C.white }}>🏃 运动方式大比拼</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>身体结构决定运动方式</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 50, right: 50,
        display: "flex", gap: 24, alignItems: "stretch",
      }}>
        {movements.map((m, i) => {
          const delay = 18 + i * 16;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
          const op = Math.min(prog, 1);

          // 运动动画效果
          const bounce = Math.sin((frame - delay) * 0.18) * 10;

          return (
            <div key={m.icon} style={{
              flex: 1,
              background: m.color + "12",
              border: `2px solid ${m.color}50`,
              borderRadius: 20, padding: "24px 16px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op,
            }}>
              <div style={{
                fontSize: 72, marginBottom: 8,
                transform: `translateY(${prog > 0.9 ? bounce : 0}px)`,
              }}>{m.icon}</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: m.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>{m.move}</div>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{m.anim}</div>
              <div style={{
                fontSize: 22, color: "#94a3b8",
                fontFamily: "'PingFang SC',sans-serif",
              }}>靠 {m.body}</div>
            </div>
          );
        })}
      </div>

      {/* 底部规律提示 */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: "#a5f3fc",
      }}>
        💡 身体结构 → 决定运动方式 → 适应生活环境，这是自然的智慧！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：栖息地分布 ─────────────────────────────────
const HabitatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const habitats = [
    {
      zone: "🏔️ 陆地",
      color: C.land,
      bg: "rgba(52,211,153,.1)",
      border: "rgba(52,211,153,.5)",
      animals: ["🐕 狗", "🐯 老虎", "🐘 大象", "🐍 蛇"],
    },
    {
      zone: "🌊 水中",
      color: C.water,
      bg: "rgba(56,189,248,.1)",
      border: "rgba(56,189,248,.5)",
      animals: ["🐟 鱼", "🐬 海豚", "🐋 鲸鱼", "🦈 鲨鱼"],
    },
    {
      zone: "☁️ 空中",
      color: C.sky,
      bg: "rgba(167,139,250,.1)",
      border: "rgba(167,139,250,.5)",
      animals: ["🦅 老鹰", "🕊️ 鸽子", "🦇 蝙蝠", "🦜 鹦鹉"],
    },
    {
      zone: "🌿 两栖",
      color: "#f472b6",
      bg: "rgba(244,114,182,.1)",
      border: "rgba(244,114,182,.5)",
      animals: ["🐸 青蛙", "🦎 蜥蜴", "🐊 鳄鱼"],
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: C.white }}>🗺️ 动物栖息地分布</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>不同动物住在不同地方</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 50, right: 50,
        display: "flex", gap: 28,
      }}>
        {habitats.map((h, i) => {
          const delay = 20 + i * 20;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 85, damping: 18 } });
          const op = Math.min(prog, 1);
          const y = interpolate(prog, [0, 1], [30, 0]);

          return (
            <div key={h.zone} style={{
              flex: 1,
              background: h.bg,
              border: `2px solid ${h.border}`,
              borderRadius: 20, padding: "28px 20px",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{
                fontSize: 42, fontWeight: 800, color: h.color,
                fontFamily: "'PingFang SC',sans-serif",
                textAlign: "center", marginBottom: 20,
              }}>{h.zone}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {h.animals.map((a, j) => (
                  <div key={j} style={{
                    padding: "8px 16px", borderRadius: 10,
                    background: h.color + "15",
                    border: `1px solid ${h.color}30`,
                    fontSize: 26, color: "#e2e8f0",
                    fontFamily: "'PingFang SC',sans-serif",
                    textAlign: "center",
                  }}>{a}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 26, color: "#a5f3fc",
      }}>
        🐸 青蛙是两栖动物——既能在水里游，又能在陆地上生活！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const points = [
    { icon: "🧥", color: C.fur,     title: "体表覆盖物", text: "毛发 · 羽毛 · 鳞片 · 光滑皮肤\n各有作用，适应环境" },
    { icon: "🏃", color: C.land,    title: "运动方式",   text: "行走 · 飞翔 · 游泳\n爬行 · 跳跃" },
    { icon: "🗺️", color: C.water,  title: "栖息地",     text: "陆地 · 水中 · 空中 · 两栖\n动物住在适合自己的地方" },
    { icon: "🌿", color: "#f472b6", title: "食性",       text: "草食 · 肉食 · 杂食\n牙齿形状暗示食性！" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(167,139,250,.1) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: C.white }}>🎯 今天的四大发现</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>动物的外形与特征 · 核心要点</div>
      </div>

      <div style={{
        position: "absolute", top: 165, left: 50, right: 50,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 20, padding: "28px 24px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 20, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 64, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 30, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 24, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.7, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部鼓励语 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: "#a5f3fc",
        fontStyle: "italic",
      }}>
        ✨ 看外形就能猜出动物的生活方式——这就是科学的眼光！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const AnimalFeaturesVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={145}><BodyCoverScene /></Sequence>
      <Sequence from={235} durationInFrames={145}><MovementScene /></Sequence>
      <Sequence from={380} durationInFrames={150}><HabitatScene /></Sequence>
      <Sequence from={530} durationInFrames={130}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
