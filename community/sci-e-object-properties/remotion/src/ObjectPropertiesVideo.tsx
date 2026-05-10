import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040",
  text: "#f0f9ff", muted: "#94a3b8",
  primary: "#38bdf8",   // sky blue
  accent: "#34d399",    // emerald
  warm: "#fbbf24",      // amber
  pink: "#f472b6",      // pink
  purple: "#a78bfa",    // violet
};

// ── 场景1：标题 ──────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagsOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 130, damping: 12 } });

  const tags = ["👁️ 用眼睛看", "✋ 用手摸", "👃 用鼻闻", "👂 用耳听"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 55% 35%, rgba(56,189,248,.25) 0%, rgba(52,211,153,.1) 40%, transparent 70%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Floating emoji */}
      <div style={{
        fontSize: 110,
        transform: `scale(${Math.min(emojiScale, 1)}) rotate(${interpolate(frame, [35, 120], [-8, 8], {})  }deg)`,
        marginBottom: 28,
        filter: "drop-shadow(0 0 30px rgba(56,189,248,0.5))",
      }}>🔍</div>

      {/* Title */}
      <div style={{
        fontSize: 92, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg, #fff 30%, ${C.primary} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: 4,
      }}>观察物体的外部特征</div>

      {/* Subtitle */}
      <div style={{
        marginTop: 20, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G1 · 物质科学 · 用感官探索世界</div>

      {/* Tags */}
      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: tagsOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {tags.map((t, i) => {
          const tagDelay = 40 + i * 8;
          const op = interpolate(frame, [tagDelay, tagDelay + 15], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [tagDelay, tagDelay + 15], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "14px 32px", borderRadius: 99,
              background: "rgba(56,189,248,.15)", border: "1px solid rgba(56,189,248,.4)",
              color: C.primary, fontSize: 28, opacity: op, transform: `translateY(${y}px)`,
            }}>{t}</div>
          );
        })}
      </div>

      {/* Bottom line */}
      <div style={{
        marginTop: 50, fontSize: 26, color: C.accent,
        opacity: interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        letterSpacing: 2,
      }}>✨ 每个物体都有独特的外部特征，等你来发现！</div>
    </AbsoluteFill>
  );
};

// ── 场景2：五种感官 ──────────────────────────────────────
const SensesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const senses = [
    { icon: "👁️", name: "眼睛", desc: "看颜色\n和形状", color: C.primary, safe: true },
    { icon: "✋", name: "手", desc: "感觉软硬\n和粗糙", color: C.accent, safe: true },
    { icon: "👃", name: "鼻子", desc: "闻气味", color: C.warm, safe: true },
    { icon: "👂", name: "耳朵", desc: "听声音", color: C.purple, safe: true },
    { icon: "👅", name: "嘴巴", desc: "⚠️ 不能\n随便尝！", color: "#ef4444", safe: false },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>
          🌟 五种感官，观察世界
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 12 }}>
          我们用感官来发现物体的外部特征
        </div>
      </div>

      {/* Senses grid */}
      <div style={{
        position: "absolute", top: 165, left: 60, right: 60,
        display: "flex", gap: 30, justifyContent: "center",
      }}>
        {senses.map((s, i) => {
          const delay = 15 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
          const op = Math.min(prog, 1);
          const sc = 0.4 + 0.6 * Math.min(prog, 1);

          return (
            <div key={s.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
              flex: 1, maxWidth: 280,
            }}>
              <div style={{
                width: 170, height: 170, borderRadius: "50%",
                background: `${s.color}1a`,
                border: `4px solid ${s.safe ? s.color : "#ef4444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 86, marginBottom: 20,
                boxShadow: `0 0 40px ${s.color}44`,
                position: "relative",
              }}>
                {s.icon}
                {!s.safe && (
                  <div style={{
                    position: "absolute", top: -8, right: -8,
                    background: "#ef4444", borderRadius: "50%",
                    width: 44, height: 44, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 24, border: "3px solid #0a1628",
                  }}>⚠️</div>
                )}
              </div>
              <div style={{
                fontSize: 34, fontWeight: 800, color: s.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
              }}>{s.name}</div>
              <div style={{
                fontSize: 24, color: s.safe ? "#cbd5e1" : "#fca5a5",
                textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif",
                lineHeight: 1.6, whiteSpace: "pre-line",
              }}>{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Safety note */}
      <div style={{
        position: "absolute", bottom: 36, left: 60, right: 60,
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        background: "rgba(239,68,68,.1)", border: "2px solid rgba(239,68,68,.4)",
        borderRadius: 16, padding: "16px 28px",
        display: "flex", alignItems: "center", gap: 18,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>🛡️</div>
        <div style={{ fontSize: 26, color: "#fca5a5" }}>
          安全提示：嘴巴不能随便尝不认识的东西，其他4种感官都是安全的！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：形状与颜色 ────────────────────────────────────
const ShapeColorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const shapes = [
    { icon: "⚽", shape: "圆形", object: "球", color: "#38bdf8", note: "可以滚动" },
    { icon: "🧊", shape: "方形", object: "积木", color: "#34d399", note: "可以叠放" },
    { icon: "✏️", shape: "长形", object: "铅笔", color: "#fbbf24", note: "便于握持" },
    { icon: "📐", shape: "三角形", object: "三角尺", color: "#a78bfa", note: "画直角" },
  ];

  const colors = [
    { color: "#ef4444", name: "红色", example: "苹果🍎" },
    { color: "#3b82f6", name: "蓝色", example: "天空🌊" },
    { color: "#22c55e", name: "绿色", example: "叶子🍃" },
    { color: "#f59e0b", name: "黄色", example: "香蕉🍌" },
    { color: "#8b5cf6", name: "紫色", example: "葡萄🍇" },
    { color: "#ec4899", name: "粉色", example: "花朵🌸" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>
          🔷 形状与颜色
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>
          用眼睛观察物体的外形和颜色
        </div>
      </div>

      {/* Shapes row */}
      <div style={{
        position: "absolute", top: 135, left: 50, right: 50,
        display: "flex", gap: 24,
      }}>
        {shapes.map((s, i) => {
          const delay = 15 + i * 16;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [24, 0], { extrapolateRight: "clamp" });

          return (
            <div key={s.shape} style={{
              flex: 1, background: `${s.color}12`,
              border: `2px solid ${s.color}55`, borderRadius: 20,
              padding: "22px 16px", opacity: op, transform: `translateY(${y}px)`,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ fontSize: 72, marginBottom: 10 }}>{s.icon}</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: s.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6,
              }}>{s.shape}</div>
              <div style={{
                fontSize: 24, color: "#e2e8f0",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>如：{s.object}</div>
              <div style={{
                fontSize: 20, color: C.muted, textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif",
                background: `${s.color}20`, borderRadius: 8, padding: "4px 12px",
              }}>✓ {s.note}</div>
            </div>
          );
        })}
      </div>

      {/* Colors row */}
      <div style={{
        position: "absolute", bottom: 32, left: 50, right: 50,
      }}>
        <div style={{
          fontSize: 28, color: C.muted, marginBottom: 14,
          fontFamily: "'PingFang SC',sans-serif",
          opacity: interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" }),
        }}>🎨 常见颜色：</div>
        <div style={{ display: "flex", gap: 18 }}>
          {colors.map((c, i) => {
            const delay = 85 + i * 12;
            const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={c.name} style={{
                flex: 1, background: `${c.color}18`,
                border: `2px solid ${c.color}60`, borderRadius: 16,
                padding: "14px 10px", opacity: op,
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: c.color, marginBottom: 8,
                  boxShadow: `0 0 12px ${c.color}88`,
                }} />
                <div style={{
                  fontSize: 22, fontWeight: 700, color: "#fff",
                  fontFamily: "'PingFang SC',sans-serif",
                }}>{c.name}</div>
                <div style={{
                  fontSize: 18, color: C.muted,
                  fontFamily: "'PingFang SC',sans-serif",
                }}>{c.example}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：软硬与光滑粗糙 ───────────────────────────────
const TextureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const pairs = [
    {
      left: { icon: "🧸", label: "软", desc: "棉花、毛巾\n橡皮泥", color: C.accent },
      right: { icon: "🪨", label: "硬", desc: "石头、铁块\n木头", color: "#64748b" },
      title: "软 vs 硬",
      question: "用手按一下能凹陷的是软的，按不动的是硬的",
    },
    {
      left: { icon: "🔮", label: "光滑", desc: "玻璃球、镜子\n苹果皮", color: C.primary },
      right: { icon: "🧱", label: "粗糙", desc: "砖头、树皮\n砂纸", color: C.warm },
      title: "光滑 vs 粗糙",
      question: "用手指轻轻划过，感觉顺滑的是光滑，有阻力的是粗糙",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 44, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>
          ✋ 软硬 · 光滑与粗糙
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>
          用手摸可以感受物体的质感
        </div>
      </div>

      {/* Two contrast pairs */}
      <div style={{
        position: "absolute", top: 150, left: 50, right: 50,
        display: "flex", flexDirection: "column", gap: 30,
      }}>
        {pairs.map((pair, pi) => {
          const pairDelay = 18 + pi * 60;
          const pairOp = interpolate(frame, [pairDelay, pairDelay + 20], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={pair.title} style={{ opacity: pairOp }}>
              <div style={{
                fontSize: 30, fontWeight: 700, color: C.muted,
                fontFamily: "'PingFang SC',sans-serif",
                marginBottom: 12,
              }}>{pair.title}</div>
              <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
                {/* Left */}
                <div style={{
                  flex: 1, background: `${pair.left.color}12`,
                  border: `2px solid ${pair.left.color}55`, borderRadius: 18,
                  padding: "22px 24px", display: "flex", gap: 20, alignItems: "center",
                }}>
                  <div style={{ fontSize: 72 }}>{pair.left.icon}</div>
                  <div>
                    <div style={{
                      fontSize: 40, fontWeight: 800, color: pair.left.color,
                      fontFamily: "'PingFang SC',sans-serif",
                    }}>{pair.left.label}</div>
                    <div style={{
                      fontSize: 24, color: "#cbd5e1",
                      fontFamily: "'PingFang SC',sans-serif",
                      whiteSpace: "pre-line", lineHeight: 1.5,
                    }}>{pair.left.desc}</div>
                  </div>
                </div>

                {/* VS */}
                <div style={{
                  display: "flex", alignItems: "center",
                  fontSize: 36, fontWeight: 900, color: C.muted,
                  fontFamily: "'PingFang SC',sans-serif",
                }}>VS</div>

                {/* Right */}
                <div style={{
                  flex: 1, background: `${pair.right.color}12`,
                  border: `2px solid ${pair.right.color}55`, borderRadius: 18,
                  padding: "22px 24px", display: "flex", gap: 20, alignItems: "center",
                }}>
                  <div style={{ fontSize: 72 }}>{pair.right.icon}</div>
                  <div>
                    <div style={{
                      fontSize: 40, fontWeight: 800, color: pair.right.color,
                      fontFamily: "'PingFang SC',sans-serif",
                    }}>{pair.right.label}</div>
                    <div style={{
                      fontSize: 24, color: "#cbd5e1",
                      fontFamily: "'PingFang SC',sans-serif",
                      whiteSpace: "pre-line", lineHeight: 1.5,
                    }}>{pair.right.desc}</div>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div style={{
                marginTop: 10, fontSize: 22, color: C.accent,
                fontFamily: "'PingFang SC',sans-serif",
                opacity: interpolate(frame, [pairDelay + 30, pairDelay + 45], [0, 1], { extrapolateRight: "clamp" }),
              }}>💡 {pair.question}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ──────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    { icon: "👁️", color: C.primary, title: "发现一", text: "用眼睛看\n颜色和形状" },
    { icon: "✋", color: C.accent,  title: "发现二", text: "用手摸\n软硬和粗糙" },
    { icon: "👃", color: C.warm,   title: "发现三", text: "用鼻子闻\n气味特征" },
    { icon: "👂", color: C.purple, title: "发现四", text: "用耳朵听\n声音特征" },
    { icon: "🔍", color: "#f472b6", title: "发现五", text: "综合描述\n做小科学家！" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,.1) 0%, transparent 65%)",
      }} />

      {/* Header */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>
          🎯 今天的五大发现
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          观察物体的外部特征 · 做小小科学家
        </div>
      </div>

      {/* Grid */}
      <div style={{
        position: "absolute", top: 175, left: 55, right: 55,
        display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center",
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 16;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });

          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.95)", borderRadius: 22,
              padding: "26px 20px", border: `2px solid ${p.color}44`,
              display: "flex", gap: 18, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              width: "calc(33% - 20px)", minWidth: 320,
            }}>
              <div style={{ fontSize: 60, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 28, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
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

      {/* Call to action */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          fontSize: 30, color: C.primary,
          background: "rgba(56,189,248,.1)",
          border: "1px solid rgba(56,189,248,.35)",
          borderRadius: 99, padding: "12px 40px",
        }}>
          🌟 用感官观察，用语言描述，这就是科学！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ──────────────────────────────────────
export const ObjectPropertiesVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={120}><TitleScene /></Sequence>
      <Sequence from={120} durationInFrames={150}><SensesScene /></Sequence>
      <Sequence from={270} durationInFrames={140}><ShapeColorScene /></Sequence>
      <Sequence from={410} durationInFrames={130}><TextureScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
