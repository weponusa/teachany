import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0d1b2a",
  bg2: "#1a2f4a",
  text: "#f0fdf4",
  muted: "#94a3b8",
  living: "#22c55e",
  nonliving: "#64748b",
  accent: "#facc15",
  highlight: "#38bdf8",
  danger: "#f87171",
  coral: "#fb923c",
  purple: "#a78bfa",
};

// ─── Scene 1: Title ─────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgesOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });

  const leafScale = spring({ frame: frame - 8, fps, config: { stiffness: 100, damping: 12 } });
  const rockScale = spring({ frame: frame - 20, fps, config: { stiffness: 100, damping: 12 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 40% 30%, rgba(34,197,94,.18) 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 70%, rgba(56,189,248,.12) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Floating icons */}
      <div style={{
        position: "absolute", top: 80, left: 120,
        fontSize: 90, transform: `scale(${Math.min(leafScale, 1)})`,
        filter: "drop-shadow(0 0 20px rgba(34,197,94,.5))",
      }}>🌿</div>
      <div style={{
        position: "absolute", top: 100, right: 100,
        fontSize: 80, transform: `scale(${Math.min(rockScale, 1)})`,
        filter: "drop-shadow(0 0 15px rgba(100,116,139,.4))",
      }}>🪨</div>
      <div style={{
        position: "absolute", bottom: 100, left: 150,
        fontSize: 75, opacity: subOp,
      }}>🐦</div>
      <div style={{
        position: "absolute", bottom: 120, right: 130,
        fontSize: 70, opacity: badgesOp,
      }}>💧</div>

      {/* Main title */}
      <div style={{
        fontSize: 100, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg, #fff 30%, ${C.living} 70%, ${C.highlight} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        lineHeight: 1.1,
      }}>生物与非生物</div>

      <div style={{
        marginTop: 28, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G1 · 生命科学</div>

      {/* Badges */}
      <div style={{
        marginTop: 48, display: "flex", gap: 24, opacity: badgesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🌱 有生命的秘密", "🔬 5大生物特征", "🎮 12项分类挑战"].map((t, i) => (
          <div key={i} style={{
            padding: "14px 32px", borderRadius: 99,
            background: i === 0
              ? "rgba(34,197,94,.2)" : i === 1
              ? "rgba(56,189,248,.15)" : "rgba(250,204,21,.15)",
            border: `1px solid ${i === 0 ? "rgba(34,197,94,.5)" : i === 1 ? "rgba(56,189,248,.4)" : "rgba(250,204,21,.4)"}`,
            color: i === 0 ? C.living : i === 1 ? C.highlight : C.accent,
            fontSize: 28,
          }}>{t}</div>
        ))}
      </div>

      {/* Bottom tagline */}
      <div style={{
        marginTop: 56, fontSize: 26, color: C.muted, opacity: badgesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>认识有生命 vs 无生命 · 探索自然界的奥秘</div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Living Things & 5 Traits ──────────────────
const LivingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const traits = [
    { icon: "🌱", label: "能生长", desc: "小种子→大树", color: C.living },
    { icon: "🫁", label: "能呼吸", desc: "吸气呼气", color: C.highlight },
    { icon: "🍎", label: "需要营养", desc: "吃食物/晒太阳", color: C.accent },
    { icon: "👶", label: "能繁殖", desc: "生小宝宝", color: C.coral },
    { icon: "👀", label: "对刺激有反应", desc: "动物感知危险", color: C.purple },
  ];

  const examples = [
    { icon: "🌳", name: "树" },
    { icon: "🌸", name: "花" },
    { icon: "🐕", name: "狗" },
    { icon: "🐦", name: "鸟" },
    { icon: "🐟", name: "鱼" },
    { icon: "🌿", name: "草" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* BG accent */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(34,197,94,.07) 0%, transparent 60%)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>
          <span style={{ color: C.living }}>生物</span>——有生命的东西！
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>生物具备以下5个特征 · 缺少任何一项就不是生物</div>
      </div>

      {/* 5 Traits */}
      <div style={{
        position: "absolute", top: 155, left: 60, right: 60,
        display: "flex", gap: 20,
      }}>
        {traits.map((t, i) => {
          const delay = 18 + i * 16;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const y = interpolate(Math.min(prog, 1), [0, 1], [20, 0]);

          return (
            <div key={t.label} style={{
              flex: 1,
              background: `${t.color}10`,
              border: `2px solid ${t.color}50`,
              borderRadius: 18, padding: "22px 16px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{t.icon}</div>
              <div style={{
                fontSize: 26, fontWeight: 800, color: t.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8, textAlign: "center",
              }}>{t.label}</div>
              <div style={{
                fontSize: 20, color: "#cbd5e1",
                fontFamily: "'PingFang SC',sans-serif", textAlign: "center",
              }}>{t.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Example organisms */}
      <div style={{
        position: "absolute", bottom: 32, left: 60, right: 60,
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{
          fontSize: 24, color: C.living, fontWeight: 700, marginBottom: 12,
          fontFamily: "'PingFang SC',sans-serif",
        }}>🌍 常见生物举例：</div>
        <div style={{ display: "flex", gap: 16 }}>
          {examples.map((e, i) => (
            <div key={e.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: "rgba(34,197,94,.08)", borderRadius: 14, padding: "12px 20px",
              border: "1px solid rgba(34,197,94,.3)",
              opacity: interpolate(frame, [103 + i * 6, 118 + i * 6], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <div style={{ fontSize: 44 }}>{e.icon}</div>
              <div style={{ fontSize: 22, color: "#a7f3d0", fontFamily: "'PingFang SC',sans-serif", marginTop: 6 }}>{e.name}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Non-Living Things ──────────────────────────
const NonLivingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const items = [
    { icon: "🪨", name: "石头", note: "不会生长" },
    { icon: "💧", name: "水", note: "不需要食物" },
    { icon: "🌬️", name: "空气", note: "不能繁殖" },
    { icon: "🌍", name: "土壤", note: "无生命反应" },
    { icon: "✏️", name: "铅笔", note: "人造物品" },
    { icon: "🧸", name: "玩具", note: "不能呼吸" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 70% 30%, rgba(100,116,139,.08) 0%, transparent 55%)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>
          <span style={{ color: "#94a3b8" }}>非生物</span>——没有生命的东西
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          不能生长 · 不需要食物 · 不会繁殖 · 没有生命特征
        </div>
      </div>

      {/* Grid of non-living items */}
      <div style={{
        position: "absolute", top: 158, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {items.map((item, i) => {
          const delay = 20 + i * 14;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 85, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.6 + 0.4 * Math.min(prog, 1);

          return (
            <div key={item.name} style={{
              background: "rgba(30,41,59,.8)",
              border: "2px solid rgba(100,116,139,.4)",
              borderRadius: 20, padding: "28px 24px",
              display: "flex", alignItems: "center", gap: 20,
              opacity: op, transform: `scale(${sc})`,
            }}>
              <div style={{ fontSize: 60, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{
                  fontSize: 34, fontWeight: 800, color: "#cbd5e1",
                  fontFamily: "'PingFang SC',sans-serif",
                }}>{item.name}</div>
                <div style={{
                  fontSize: 22, color: C.muted, marginTop: 6,
                  fontFamily: "'PingFang SC',sans-serif",
                }}>❌ {item.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [105, 125], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: "#94a3b8",
      }}>
        💡 非生物虽然没有生命，但对生物的生存非常重要！（水、空气、土壤）
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Tricky Cases ───────────────────────────────
const TrickyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const cases = [
    {
      icon: "🔥", name: "火",
      verdict: "❌ 非生物", color: C.danger,
      reason: "会动，但不能繁殖、不会生长、没有细胞",
      tricky: "容易误判",
    },
    {
      icon: "🪸", name: "珊瑚",
      verdict: "✅ 生物！", color: C.living,
      reason: "看起来像石头，但珊瑚虫是动物，能生长繁殖",
      tricky: "容易误判",
    },
    {
      icon: "🦠", name: "病毒",
      verdict: "❓ 科学争论中", color: C.accent,
      reason: "不能独立代谢，但有遗传物质……科学家们还在研究！",
      tricky: "进阶知识",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 10%, rgba(250,204,21,.06) 0%, transparent 50%)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>
          🤔 易混淆的案例
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>这些东西是生物还是非生物？动脑筋！</div>
      </div>

      {/* Three cases */}
      <div style={{
        position: "absolute", top: 160, left: 60, right: 60,
        display: "flex", gap: 36,
      }}>
        {cases.map((c, i) => {
          const delay = 22 + i * 22;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 18 } });
          const op = Math.min(prog, 1);
          const y = interpolate(Math.min(prog, 1), [0, 1], [30, 0]);

          return (
            <div key={c.name} style={{
              flex: 1,
              background: `${c.color}0d`,
              border: `2px solid ${c.color}50`,
              borderRadius: 22, padding: "36px 28px",
              opacity: op, transform: `translateY(${y}px)`,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              {/* Tricky badge */}
              <div style={{
                background: `${c.color}22`, border: `1px solid ${c.color}50`,
                borderRadius: 99, padding: "4px 14px",
                fontSize: 18, color: c.color, marginBottom: 16,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.tricky}</div>

              <div style={{ fontSize: 90, marginBottom: 20 }}>{c.icon}</div>
              <div style={{
                fontSize: 42, fontWeight: 900, color: "#fff", marginBottom: 16,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.name}</div>

              {/* Verdict */}
              <div style={{
                fontSize: 32, fontWeight: 800, color: c.color, marginBottom: 18,
                background: `${c.color}1a`, borderRadius: 10, padding: "8px 20px",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.verdict}</div>

              <div style={{
                fontSize: 22, color: "#94a3b8", textAlign: "center", lineHeight: 1.6,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{c.reason}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom summary */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 26, color: "#94a3b8",
      }}>
        💡 判断生物的关键：是否同时具备<span style={{ color: C.living, fontWeight: 700 }}>多项</span>生命特征！
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Summary ───────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "🌱", color: C.living, title: "什么是生物",
      text: "有生命的东西\n动物·植物·微生物",
    },
    {
      icon: "🔬", color: C.highlight, title: "5大特征",
      text: "生长·呼吸·营养\n繁殖·对刺激反应",
    },
    {
      icon: "🪨", color: C.nonliving, title: "什么是非生物",
      text: "没有生命的东西\n石头·水·空气等",
    },
    {
      icon: "🤔", color: C.accent, title: "易错点记忆",
      text: "火≠生物（会动≠生命）\n珊瑚=生物！",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(34,197,94,.07) 0%, transparent 70%)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🎯 今天的大发现！</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>生物与非生物 · 核心知识总结</div>
      </div>

      {/* 4 summary cards */}
      <div style={{
        position: "absolute", top: 165, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 26,
      }}>
        {points.map((p, i) => {
          const delay = 18 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              background: "rgba(15,28,50,.85)",
              border: `2px solid ${p.color}40`,
              borderRadius: 22, padding: "28px 28px",
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
                  fontSize: 26, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 28, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [88, 105], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 26, color: C.muted,
      }}>
        🌟 记住：<span style={{ color: C.living }}>生物</span> 有生命，<span style={{ color: "#94a3b8" }}>非生物</span> 没有生命——但两者都是大自然的一部分！
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────
export const LivingNonlivingVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={100}><TitleScene /></Sequence>
      <Sequence from={100} durationInFrames={150}><LivingScene /></Sequence>
      <Sequence from={250} durationInFrames={140}><NonLivingScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><TrickyScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
