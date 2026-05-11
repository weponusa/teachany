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
  wood: "#d97706",
  metal: "#64748b",
  plastic: "#ec4899",
  glass: "#38bdf8",
  cloth: "#a78bfa",
  paper: "#34d399",
  primary: "#fbbf24",
  secondary: "#34d399",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagsOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const iconScale = spring({ frame: frame - 10, fps, config: { stiffness: 100, damping: 14 } });

  const materials = [
    { icon: "🪵", label: "木头" },
    { icon: "⚙️", label: "金属" },
    { icon: "🧴", label: "塑料" },
    { icon: "🪟", label: "玻璃" },
    { icon: "🧵", label: "布料" },
    { icon: "📄", label: "纸张" },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(251,191,36,.18) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 顶部图标行 */}
      <div style={{
        display: "flex", gap: 32, marginBottom: 40,
        transform: `scale(${Math.min(iconScale, 1)})`,
        opacity: Math.min(iconScale, 1),
      }}>
        {materials.map((m) => (
          <div key={m.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{ fontSize: 64 }}>{m.icon}</div>
            <div style={{
              fontSize: 22, color: C.primary, fontWeight: 700,
              fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
            }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* 主标题 */}
      <div style={{
        fontSize: 96, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: `linear-gradient(135deg, #fff 30%, ${C.primary} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>生活中常见的材料</div>

      <div style={{
        marginTop: 20, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G2 · 物质科学</div>

      {/* 标签 */}
      <div style={{
        marginTop: 36, display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center",
        opacity: tagsOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🔍 认识六种材料", "⚖️ 对比材料特性", "🏠 探索生活用途"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 28px", borderRadius: 99,
            background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.4)",
            color: C.primary, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：六种材料展示 ────────────────────────────────
const MaterialsShowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const materials = [
    { icon: "🪵", name: "木头", color: C.wood, props: "轻巧·坚硬·可塑", examples: "桌椅·地板·铅笔" },
    { icon: "⚙️", name: "金属", color: C.metal, props: "坚硬·导热·导电", examples: "锅·剪刀·电线" },
    { icon: "🧴", name: "塑料", color: C.plastic, props: "轻便·防水·不耐热", examples: "水杯·书包·玩具" },
    { icon: "🪟", name: "玻璃", color: C.glass, props: "透明·光滑·易碎", examples: "窗户·镜子·杯子" },
    { icon: "🧵", name: "布料", color: C.cloth, props: "柔软·保暖·透气", examples: "衣服·被子·窗帘" },
    { icon: "📄", name: "纸张", color: C.paper, props: "轻薄·可折·怕水", examples: "课本·卫生纸·礼盒" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>六种常见材料大集合</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>每种材料都有自己的特点和用途</div>
      </div>

      {/* 材料网格 */}
      <div style={{
        position: "absolute", top: 150, left: 50, right: 50,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 24,
      }}>
        {materials.map((m, i) => {
          const delay = 20 + i * 15;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.7 + 0.3 * Math.min(prog, 1);

          return (
            <div key={m.name} style={{
              background: `rgba(15,32,64,.9)`,
              border: `2px solid ${m.color}55`,
              borderRadius: 20, padding: "24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
              boxShadow: `0 0 20px ${m.color}22`,
            }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{m.icon}</div>
              <div style={{
                fontSize: 38, fontWeight: 900, color: m.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>{m.name}</div>
              <div style={{
                fontSize: 22, color: "#94a3b8",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>{m.props}</div>
              <div style={{
                fontSize: 20, color: "#fff", background: `${m.color}22`,
                padding: "6px 14px", borderRadius: 8,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{m.examples}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：材料特性对比 ────────────────────────────────
const PropertiesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const properties = [
    {
      label: "硬度", icon: "💪",
      items: [
        { name: "金属", level: 5, color: C.metal },
        { name: "玻璃", level: 4, color: C.glass },
        { name: "木头", level: 3, color: C.wood },
        { name: "塑料", level: 2, color: C.plastic },
        { name: "纸张", level: 1, color: C.paper },
        { name: "布料", level: 1, color: C.cloth },
      ],
    },
    {
      label: "防水性", icon: "💧",
      items: [
        { name: "玻璃", level: 5, color: C.glass },
        { name: "金属", level: 4, color: C.metal },
        { name: "塑料", level: 5, color: C.plastic },
        { name: "木头", level: 2, color: C.wood },
        { name: "布料", level: 2, color: C.cloth },
        { name: "纸张", level: 1, color: C.paper },
      ],
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>材料特性大比拼</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>不同材料的硬度与防水性对比</div>
      </div>

      <div style={{
        position: "absolute", top: 150, left: 60, right: 60,
        display: "flex", gap: 40,
      }}>
        {properties.map((prop, pi) => {
          const groupDelay = 15 + pi * 60;
          const titleProgLocal = interpolate(frame, [groupDelay, groupDelay + 20], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={prop.label} style={{
              flex: 1,
              background: "rgba(15,32,64,.7)", borderRadius: 20, padding: "28px 24px",
              border: "1px solid rgba(251,191,36,.2)",
            }}>
              {/* 属性标题 */}
              <div style={{
                fontSize: 40, fontWeight: 800, color: C.primary,
                fontFamily: "'PingFang SC',sans-serif",
                marginBottom: 24, opacity: titleProgLocal,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span>{prop.icon}</span><span>{prop.label}</span>
              </div>

              {/* 材料条形图 */}
              {prop.items.map((item, ii) => {
                const barDelay = groupDelay + 25 + ii * 15;
                const barProg = interpolate(frame, [barDelay, barDelay + 25], [0, 1], { extrapolateRight: "clamp" });
                const labelOp = interpolate(frame, [barDelay, barDelay + 15], [0, 1], { extrapolateRight: "clamp" });

                return (
                  <div key={item.name} style={{
                    marginBottom: 18, opacity: labelOp,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", marginBottom: 6,
                      fontFamily: "'PingFang SC',sans-serif",
                    }}>
                      <span style={{ fontSize: 24, color: item.color, fontWeight: 700 }}>{item.name}</span>
                      <span style={{ fontSize: 22, color: C.muted }}>
                        {"★".repeat(item.level)}{"☆".repeat(5 - item.level)}
                      </span>
                    </div>
                    <div style={{
                      height: 16, borderRadius: 8,
                      background: "rgba(255,255,255,.1)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 8,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                        width: `${barProg * item.level * 20}%`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: "#a5f3fc",
      }}>
        💡 选材料要看：用途 → 需要什么特性 → 找合适的材料！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：用途匹配 ────────────────────────────────────
const UsageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const matches = [
    { object: "🪟 窗户", material: "玻璃", reason: "透明·能看到外面", matColor: C.glass },
    { object: "🍳 锅", material: "金属", reason: "耐热·能导热炒菜", matColor: C.metal },
    { object: "👕 衣服", material: "布料", reason: "柔软·舒适·保暖", matColor: C.cloth },
    { object: "📚 课本", material: "纸张", reason: "轻薄·可以印刷文字", matColor: C.paper },
    { object: "🧸 玩具", material: "塑料", reason: "轻便·安全·好造型", matColor: C.plastic },
    { object: "🚪 门框", material: "木头", reason: "坚固·好加工·美观", matColor: C.wood },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>物品与材料的完美搭配</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>为什么要选这种材料？</div>
      </div>

      <div style={{
        position: "absolute", top: 150, left: 50, right: 50,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 22,
      }}>
        {matches.map((m, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const x = i % 2 === 0
            ? interpolate(frame, [delay, delay + 20], [-30, 0], { extrapolateRight: "clamp" })
            : interpolate(frame, [delay, delay + 20], [30, 0], { extrapolateRight: "clamp" });

          return (
            <div key={m.object} style={{
              background: "rgba(15,32,64,.9)",
              border: `2px solid ${m.matColor}44`,
              borderRadius: 16, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 20,
              opacity: op, transform: `translateX(${x}px)`,
            }}>
              <div style={{ fontSize: 48, flexShrink: 0 }}>{m.object.split(" ")[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 24, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 4,
                }}>{m.object.split(" ")[1]}</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 22, color: "#94a3b8", fontFamily: "'PingFang SC',sans-serif" }}>用</span>
                  <span style={{
                    fontSize: 28, fontWeight: 800, color: m.matColor,
                    fontFamily: "'PingFang SC',sans-serif",
                    background: `${m.matColor}22`, padding: "2px 10px", borderRadius: 6,
                  }}>{m.material}</span>
                  <span style={{ fontSize: 22, color: "#94a3b8", fontFamily: "'PingFang SC',sans-serif" }}>做</span>
                </div>
                <div style={{
                  fontSize: 20, color: "#64748b",
                  fontFamily: "'PingFang SC',sans-serif", marginTop: 4,
                }}>原因：{m.reason}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const summary = [
    { icon: "🪵", color: C.wood,    title: "木头", text: "来自树木\n坚硬可塑" },
    { icon: "⚙️", color: C.metal,   title: "金属", text: "来自矿石\n导热导电" },
    { icon: "🧴", color: C.plastic, title: "塑料", text: "人工制造\n防水轻便" },
    { icon: "🪟", color: C.glass,   title: "玻璃", text: "透明光滑\n小心易碎" },
    { icon: "🧵", color: C.cloth,   title: "布料", text: "柔软保暖\n透气舒适" },
    { icon: "📄", color: C.paper,   title: "纸张", text: "轻薄可折\n纸怕水哦" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(251,191,36,.08) 0%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>🎯 今日学习总结</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>生活中常见的六种材料 · 全记住了吗？</div>
      </div>

      <div style={{
        position: "absolute", top: 165, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {summary.map((s, i) => {
          const delay = 20 + i * 15;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });

          return (
            <div key={s.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 20, padding: "24px 20px",
              border: `2px solid ${s.color}44`,
              display: "flex", gap: 20, alignItems: "center",
              opacity: op, transform: `translateY(${y}px)`,
              boxShadow: `0 0 16px ${s.color}22`,
            }}>
              <div style={{ fontSize: 60, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{
                  fontSize: 34, fontWeight: 800, color: s.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6,
                }}>{s.title}</div>
                <div style={{
                  fontSize: 22, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{s.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部鼓励语 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: C.primary, fontWeight: 700,
      }}>
        🌟 做个生活中的小科学家！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const MaterialsVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><MaterialsShowScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><PropertiesScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><UsageScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
