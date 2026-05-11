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
  primary: "#38bdf8",
  secondary: "#34d399",
  accent: "#fbbf24",
  purple: "#a78bfa",
  pink: "#f472b6",
  danger: "#f87171",
};

// ── 场景1：标题 ──────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [40, 58], [0, 1], { extrapolateRight: "clamp" });

  const emojiScale = spring({ frame: frame - 10, fps, config: { stiffness: 110, damping: 12 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 65% 25%, rgba(56,189,248,.18) 0%, transparent 60%),
                   radial-gradient(ellipse at 25% 75%, rgba(52,211,153,.1) 0%, transparent 55%),
                   ${C.bg}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Floating emojis */}
      <div style={{
        fontSize: 90,
        transform: `scale(${Math.min(emojiScale, 1)})`,
        marginBottom: 28,
        display: "flex",
        gap: 20,
      }}>
        <span>🌿</span><span>🐟</span><span>🦁</span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 96,
        fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg, #fff 30%, #38bdf8 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        生物的分类
      </div>

      {/* Sub */}
      <div style={{
        marginTop: 24,
        fontSize: 36,
        color: C.muted,
        opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        小学科学 G4 · 生命科学
      </div>

      {/* Tags */}
      <div style={{
        marginTop: 44,
        display: "flex",
        gap: 24,
        opacity: tagOp,
        fontFamily: "'PingFang SC',sans-serif",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {["🔬 林奈双名法", "📊 七个分类层级", "🌐 五界系统", "🐸 脊椎动物5类"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 28px",
            borderRadius: 99,
            background: "rgba(56,189,248,.12)",
            border: "1px solid rgba(56,189,248,.35)",
            color: C.primary,
            fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：七层分类金字塔 ──────────────────────────────
const PyramidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const levels = [
    { name: "界 Kingdom", example: "动物界", color: "#f87171", emoji: "🌍", width: 800 },
    { name: "门 Phylum",  example: "脊索动物门", color: "#fb923c", emoji: "🔑", width: 700 },
    { name: "纲 Class",   example: "哺乳纲", color: "#fbbf24", emoji: "📚", width: 600 },
    { name: "目 Order",   example: "灵长目", color: "#4ade80", emoji: "🎯", width: 500 },
    { name: "科 Family",  example: "人科", color: "#34d399", emoji: "👪", width: 400 },
    { name: "属 Genus",   example: "人属 Homo", color: "#38bdf8", emoji: "🧬", width: 300 },
    { name: "种 Species", example: "智人 H. sapiens", color: "#a78bfa", emoji: "👤", width: 220 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 50, fontWeight: 800, color: "#fff" }}>📊 七层分类层级</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          口诀：<span style={{ color: C.accent, fontWeight: 700 }}>鸡蛋糕目科属种</span>
          &nbsp;（界→门→纲→目→科→属→种，越往下越相似）
        </div>
      </div>

      {/* Pyramid */}
      <div style={{
        position: "absolute", top: 140, left: 0, right: 0, bottom: 20,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 6,
      }}>
        {levels.map((lv, i) => {
          const delay = 18 + i * 14;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
          const op = Math.min(prog, 1);
          const scaleX = Math.min(prog, 1);

          return (
            <div key={lv.name} style={{
              width: lv.width,
              height: 72,
              borderRadius: 10,
              background: `${lv.color}22`,
              border: `2px solid ${lv.color}88`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
              opacity: op,
              transform: `scaleX(${scaleX})`,
              transformOrigin: "center",
              boxShadow: `0 0 20px ${lv.color}22`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 30 }}>{lv.emoji}</span>
                <span style={{
                  fontSize: 26, fontWeight: 700, color: lv.color,
                  fontFamily: "'PingFang SC',sans-serif",
                }}>{lv.name}</span>
              </div>
              <span style={{
                fontSize: 21, color: "#cbd5e1",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{lv.example}</span>
            </div>
          );
        })}
      </div>

      {/* Arrow annotation */}
      <div style={{
        position: "absolute", right: 120, top: 160, bottom: 30,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ color: C.muted, fontSize: 20, marginBottom: 8, writingMode: "vertical-rl" }}>
          ↑ 范围越大
        </div>
        <div style={{ width: 2, flex: 1, background: "linear-gradient(to bottom, #38bdf8, #a78bfa)", borderRadius: 2 }} />
        <div style={{ color: C.muted, fontSize: 20, marginTop: 8, writingMode: "vertical-rl" }}>
          ↓ 越相似
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：五界展示 ────────────────────────────────────
const FiveKingdomsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const kingdoms = [
    {
      name: "动物界",
      emoji: "🦁",
      color: "#f87171",
      desc: "能运动\n多细胞\n有细胞核",
      examples: "狮子、鱼、鸟",
    },
    {
      name: "植物界",
      emoji: "🌿",
      color: "#4ade80",
      desc: "光合作用\n多细胞\n有细胞核",
      examples: "玫瑰、松树、藻",
    },
    {
      name: "真菌界",
      emoji: "🍄",
      color: "#fbbf24",
      desc: "分解有机物\n有细胞核\n孢子繁殖",
      examples: "蘑菇、酵母菌",
    },
    {
      name: "原生生物界",
      emoji: "🔬",
      color: "#38bdf8",
      desc: "单细胞\n有细胞核\n简单结构",
      examples: "草履虫、变形虫",
    },
    {
      name: "原核生物界",
      emoji: "🦠",
      color: "#a78bfa",
      desc: "无细胞核\n最原始\n细菌等",
      examples: "大肠杆菌、蓝藻",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 50, fontWeight: 800, color: "#fff" }}>🌐 五界系统</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          生物界的五大类群 · 有无细胞核是关键区分
        </div>
      </div>

      <div style={{
        position: "absolute", top: 145, left: 60, right: 60, bottom: 30,
        display: "flex", gap: 24, alignItems: "stretch",
      }}>
        {kingdoms.map((k, i) => {
          const delay = 20 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const y = interpolate(frame, [delay, delay + 20], [30, 0], { extrapolateRight: "clamp" });

          return (
            <div key={k.name} style={{
              flex: 1,
              background: `${k.color}0f`,
              border: `2px solid ${k.color}55`,
              borderRadius: 18,
              padding: "24px 18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              opacity: op,
              transform: `translateY(${y}px)`,
              boxShadow: `0 4px 24px ${k.color}22`,
            }}>
              <div style={{ fontSize: 64, marginBottom: 14 }}>{k.emoji}</div>
              <div style={{
                fontSize: 28, fontWeight: 800, color: k.color, marginBottom: 12,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{k.name}</div>
              <div style={{
                fontSize: 20, color: "#cbd5e1", lineHeight: 1.6, whiteSpace: "pre-line",
                fontFamily: "'PingFang SC',sans-serif", flex: 1,
              }}>{k.desc}</div>
              <div style={{
                marginTop: 14,
                fontSize: 18, color: C.muted,
                fontFamily: "'PingFang SC',sans-serif",
                borderTop: `1px solid ${k.color}33`,
                paddingTop: 10, width: "100%",
              }}>
                例：{k.examples}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key note */}
      <div style={{
        position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [105, 120], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 22, color: C.accent,
      }}>
        💡 原核生物界（细菌）无细胞核 ← 与其余四界的根本区别
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：脊椎动物5类 ────────────────────────────────
const VertebratesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const groups = [
    {
      name: "鱼类",
      emoji: "🐟",
      color: "#38bdf8",
      features: ["鳃呼吸", "卵生", "水中生活", "变温"],
      examples: "鲫鱼、鲨鱼、金鱼",
    },
    {
      name: "两栖类",
      emoji: "🐸",
      color: "#4ade80",
      features: ["幼年水中", "成年陆地", "肺+皮肤呼吸", "变温"],
      examples: "青蛙、蟾蜍、蝾螈",
    },
    {
      name: "爬行类",
      emoji: "🦎",
      color: "#fbbf24",
      features: ["鳞片", "肺呼吸", "卵生", "变温"],
      examples: "蜥蜴、蛇、鳄鱼",
    },
    {
      name: "鸟类",
      emoji: "🦅",
      color: "#fb923c",
      features: ["羽毛", "翅膀", "恒温", "卵生"],
      examples: "麻雀、老鹰、企鹅",
    },
    {
      name: "哺乳类",
      emoji: "🦁",
      color: "#f472b6",
      features: ["毛发", "哺乳", "恒温", "胎生"],
      examples: "狮子、鲸鱼、人类",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 50, fontWeight: 800, color: "#fff" }}>🦴 脊椎动物5大类</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          都有脊椎骨 · 从水生到陆生的演化历程
        </div>
      </div>

      <div style={{
        position: "absolute", top: 132, left: 50, right: 50, bottom: 18,
        display: "flex", gap: 20, alignItems: "stretch",
      }}>
        {groups.map((g, i) => {
          const delay = 18 + i * 16;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 95, damping: 17 } });
          const op = Math.min(prog, 1);

          return (
            <div key={g.name} style={{
              flex: 1,
              background: `${g.color}0e`,
              border: `2px solid ${g.color}55`,
              borderRadius: 18,
              padding: "20px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              opacity: op,
            }}>
              <div style={{ fontSize: 60, marginBottom: 10 }}>{g.emoji}</div>
              <div style={{
                fontSize: 28, fontWeight: 800, color: g.color, marginBottom: 12,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{g.name}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {g.features.map((f, fi) => (
                  <div key={fi} style={{
                    padding: "4px 12px", borderRadius: 99,
                    background: `${g.color}1a`, border: `1px solid ${g.color}44`,
                    color: "#e2e8f0", fontSize: 18,
                    fontFamily: "'PingFang SC',sans-serif",
                  }}>{f}</div>
                ))}
              </div>
              <div style={{
                fontSize: 16, color: C.muted, borderTop: `1px solid ${g.color}33`,
                paddingTop: 8, width: "100%",
                fontFamily: "'PingFang SC',sans-serif",
              }}>{g.examples}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结分类树 ──────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "📊", color: C.danger,
      title: "七层分类",
      text: "界→门→纲→目→科→属→种\n口诀：鸡蛋糕目科属种",
    },
    {
      icon: "🔬", color: C.accent,
      title: "林奈双名法",
      text: "属名 + 种名\n例：Homo sapiens（智人）",
    },
    {
      icon: "🌐", color: C.secondary,
      title: "五界系统",
      text: "动物·植物·真菌\n原生生物·原核生物",
    },
    {
      icon: "🦴", color: C.pink,
      title: "脊椎动物5类",
      text: "鱼→两栖→爬行→鸟→哺乳\n从水生到陆生",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,.08) 0%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🎯 今天的四大收获</div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          生物的分类 · 核心要点总结
        </div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 60, right: 60, bottom: 40,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 24,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 20;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)",
              borderRadius: 20,
              padding: "28px 26px",
              border: `2px solid ${p.color}44`,
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              opacity: op,
              transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 64, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 30, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 24, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ──────────────────────────────────────
export const ClassificationVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={165}><PyramidScene /></Sequence>
      <Sequence from={255} durationInFrames={150}><FiveKingdomsScene /></Sequence>
      <Sequence from={405} durationInFrames={150}><VertebratesScene /></Sequence>
      <Sequence from={555} durationInFrames={105}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
