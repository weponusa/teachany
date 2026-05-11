import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1a0f",
  bg2: "#0f2818",
  text: "#f0fff4",
  muted: "#86a89a",
  igneous: "#ef4444",    // 火成岩 - 红色
  sediment: "#f59e0b",   // 沉积岩 - 黄色
  metamorph: "#8b5cf6",  // 变质岩 - 紫色
  mineral: "#06b6d4",    // 矿物 - 青色
  soil: "#92400e",       // 土壤 - 棕色
  accent: "#34d399",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 120, damping: 14 } });
  const tagOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 40% 30%, rgba(239,68,68,.2) 0%, transparent 45%),
                   radial-gradient(ellipse at 75% 70%, rgba(139,92,246,.15) 0%, transparent 45%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 岩石 + 土壤 emoji */}
      <div style={{
        fontSize: 110,
        transform: `scale(${Math.min(emojiScale, 1)})`,
        marginBottom: 30,
        filter: "drop-shadow(0 0 24px rgba(239,68,68,0.5))",
      }}>🪨</div>

      <div style={{
        fontSize: 92, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#34d399 70%,#06b6d4 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>岩石与土壤</div>

      <div style={{
        marginTop: 24, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G4 · 地球与宇宙科学</div>

      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: tagOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { e: "🌋", t: "三类岩石", c: C.igneous },
          { e: "💎", t: "矿物组成", c: C.mineral },
          { e: "🌱", t: "土壤成分", c: C.accent },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "14px 30px", borderRadius: 99,
            background: `${item.c}22`, border: `1px solid ${item.c}55`,
            color: item.c, fontSize: 30, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>{item.e}</span><span>{item.t}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：三类岩石动画 ────────────────────────────────
const RocksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 火山动画
  const lavaY = interpolate(frame, [20, 60], [80, 0], { extrapolateRight: "clamp" });
  const lavaOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });

  // 沉积层动画
  const sedOp1 = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });
  const sedOp2 = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp" });
  const sedOp3 = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp" });

  // 变质岩动画
  const metaOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });
  const metaPulse = Math.sin(frame * 0.15) * 0.05 + 1;

  const rocks = [
    {
      icon: "🌋", name: "火成岩", eng: "Igneous Rock",
      color: C.igneous, example: "花岗岩",
      desc: "岩浆冷却凝固",
      detail: "地球内部岩浆喷出或侵入地壳，冷却后形成",
    },
    {
      icon: "🏔", name: "沉积岩", eng: "Sedimentary Rock",
      color: C.sediment, example: "砂岩 · 石灰岩",
      desc: "沉积物压实",
      detail: "沙子、泥土等沉积物逐层堆积，压实胶结而成",
    },
    {
      icon: "💎", name: "变质岩", eng: "Metamorphic Rock",
      color: C.metamorph, example: "大理石",
      desc: "高温高压变质",
      detail: "原有岩石在高温高压下发生矿物重结晶而成",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>岩石的三大类</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>按形成方式分类 · 各有不同的故事</div>
      </div>

      {/* 三类岩石卡片 */}
      <div style={{
        position: "absolute", top: 155, left: 50, right: 50,
        display: "flex", gap: 36, alignItems: "stretch",
      }}>
        {rocks.map((rock, i) => {
          const delay = 20 + i * 40;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.6 + 0.4 * Math.min(prog, 1);

          return (
            <div key={rock.name} style={{
              flex: 1,
              background: `linear-gradient(160deg, ${rock.color}14 0%, rgba(10,26,15,0.95) 100%)`,
              border: `2px solid ${rock.color}50`,
              borderRadius: 24, padding: "32px 28px",
              opacity: op, transform: `scale(${sc})`,
              display: "flex", flexDirection: "column",
              boxShadow: `0 0 40px ${rock.color}25`,
            }}>
              {/* 大 emoji */}
              <div style={{ fontSize: 80, marginBottom: 16, textAlign: "center" }}>{rock.icon}</div>
              {/* 名称 */}
              <div style={{
                fontSize: 40, fontWeight: 900, color: rock.color, textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6,
              }}>{rock.name}</div>
              <div style={{ fontSize: 20, color: C.muted, textAlign: "center",
                fontFamily: "sans-serif", marginBottom: 16 }}>{rock.eng}</div>

              {/* 形成过程 */}
              <div style={{
                background: `${rock.color}18`, borderRadius: 12, padding: "14px 18px",
                border: `1px solid ${rock.color}30`, marginBottom: 14,
              }}>
                <div style={{ fontSize: 22, color: rock.color, fontWeight: 700,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>⚙️ 形成过程</div>
                <div style={{ fontSize: 22, color: "#e2f5ea",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6 }}>{rock.detail}</div>
              </div>

              {/* 代表岩石 */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: `${rock.color}22`, borderRadius: 99,
                padding: "8px 18px", alignSelf: "center",
                border: `1px solid ${rock.color}40`,
              }}>
                <span style={{ fontSize: 18, color: C.muted, fontFamily: "'PingFang SC',sans-serif" }}>代表：</span>
                <span style={{ fontSize: 22, color: rock.color, fontWeight: 700,
                  fontFamily: "'PingFang SC',sans-serif" }}>{rock.example}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [120, 145], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: "#a7f3d0",
      }}>
        💡 地球上的岩石循环变化，从不停歇——这叫做「岩石循环」
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：矿物组成展示 ────────────────────────────────
const MineralsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const minerals = [
    { icon: "⬜", name: "石英", color: "#e2e8f0", hardness: "7", shine: "玻璃光泽", desc: "最常见的矿物，透明或白色" },
    { icon: "🟪", name: "长石", color: "#c4b5fd", hardness: "6", shine: "珍珠光泽", desc: "花岗岩的主要成分，粉白色" },
    { icon: "✨", name: "云母", color: "#fcd34d", hardness: "2-3", shine: "珍珠光泽", desc: "薄片状，会闪闪发亮" },
    { icon: "🟤", name: "方解石", color: "#fb923c", hardness: "3", shine: "玻璃光泽", desc: "石灰岩的主要矿物" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>💎 矿物：岩石的组成单元</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>岩石 = 矿物的集合 · 矿物有固定化学成分</div>
      </div>

      {/* 花岗岩组成示意 */}
      <div style={{
        position: "absolute", top: 155, left: 50, width: 380,
        opacity: interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{
          background: "rgba(6,182,212,.08)", border: "2px solid rgba(6,182,212,.3)",
          borderRadius: 20, padding: "24px 28px",
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.mineral, marginBottom: 12,
            fontFamily: "'PingFang SC',sans-serif" }}>🪨 花岗岩的组成</div>
          {[
            { name: "长石", pct: 60, color: "#c4b5fd" },
            { name: "石英", pct: 30, color: "#e2e8f0" },
            { name: "云母", pct: 10, color: "#fcd34d" },
          ].map((m, i) => {
            const barW = interpolate(frame, [30 + i * 15, 60 + i * 15], [0, m.pct], { extrapolateRight: "clamp" });
            return (
              <div key={m.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: 22, fontFamily: "'PingFang SC',sans-serif",
                  color: m.color, marginBottom: 5 }}>
                  <span>{m.name}</span><span>{m.pct}%</span>
                </div>
                <div style={{ height: 14, background: "rgba(255,255,255,.08)", borderRadius: 7 }}>
                  <div style={{ height: "100%", width: `${barW}%`, background: m.color,
                    borderRadius: 7, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 矿物特征卡 */}
      <div style={{
        position: "absolute", top: 155, left: 460, right: 50,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
      }}>
        {minerals.map((m, i) => {
          const delay = 25 + i * 22;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 85, damping: 18 } });
          const op = Math.min(prog, 1);
          return (
            <div key={m.name} style={{
              background: `${m.color}10`, border: `1.5px solid ${m.color}35`,
              borderRadius: 16, padding: "20px 22px",
              opacity: op,
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: m.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontSize: 20, color: "#cbd5e1",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6 }}>{m.desc}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <div style={{
                  background: `${m.color}20`, borderRadius: 8, padding: "4px 12px",
                  fontSize: 18, color: m.color, fontFamily: "'PingFang SC',sans-serif",
                }}>硬度 {m.hardness}</div>
                <div style={{
                  background: `${m.color}15`, borderRadius: 8, padding: "4px 12px",
                  fontSize: 18, color: m.color, fontFamily: "'PingFang SC',sans-serif",
                }}>{m.shine}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部知识点 */}
      <div style={{
        position: "absolute", bottom: 36, left: 50, right: 50,
        display: "flex", gap: 20,
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { icon: "🔍", text: "矿物有固定的颜色、光泽、硬度等特征" },
          { icon: "🔬", text: "莫氏硬度 1-10，金刚石硬度最高（10）" },
          { icon: "🧲", text: "有些矿物有磁性（磁铁矿）或有荧光" },
        ].map((tip, i) => (
          <div key={i} style={{
            flex: 1, background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.2)",
            borderRadius: 12, padding: "14px 18px",
            fontSize: 22, color: "#a5f3fc",
          }}>{tip.icon} {tip.text}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：土壤分层剖面 ────────────────────────────────
const SoilScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const layers = [
    { name: "有机层", color: "#1a3a1a", textColor: "#4ade80", depth: 60, desc: "腐烂植物和动物", icon: "🍃" },
    { name: "表土层", color: "#2d4a1e", textColor: "#86efac", depth: 100, desc: "富含有机质和矿物质", icon: "🌱" },
    { name: "心土层", color: "#78350f", textColor: "#fbbf24", depth: 90, desc: "矿物质为主", icon: "🏔" },
    { name: "母质层", color: "#92400e", textColor: "#fdba74", depth: 80, desc: "部分风化的岩石", icon: "🪨" },
    { name: "基岩", color: "#374151", textColor: "#9ca3af", depth: 70, desc: "未风化的固体岩石", icon: "⛰️" },
  ];

  const soilComps = [
    { name: "矿物质", pct: 45, color: "#f59e0b" },
    { name: "空气", pct: 25, color: "#60a5fa" },
    { name: "水", pct: 25, color: "#06b6d4" },
    { name: "有机质", pct: 5, color: "#4ade80" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>🌍 土壤的成分与分层</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>土壤不只是"泥" · 岩石风化需要数千年</div>
      </div>

      {/* 土壤剖面 */}
      <div style={{ position: "absolute", top: 155, left: 50, width: 360 }}>
        <div style={{ fontSize: 24, color: C.muted, marginBottom: 10,
          fontFamily: "'PingFang SC',sans-serif" }}>土壤剖面示意图</div>
        {layers.map((layer, i) => {
          const delay = 15 + i * 18;
          const w = interpolate(frame, [delay, delay + 25], [0, 360], { extrapolateRight: "clamp" });
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={layer.name} style={{
              height: layer.depth, background: layer.color,
              width: w, marginBottom: 2, borderRadius: i === 0 ? "8px 8px 0 0" : i === layers.length - 1 ? "0 0 8px 8px" : 0,
              display: "flex", alignItems: "center", paddingLeft: 16,
              opacity: op, overflow: "hidden",
              border: `1px solid ${layer.textColor}25`,
            }}>
              <span style={{ fontSize: 26, marginRight: 10 }}>{layer.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: layer.textColor,
                  fontFamily: "'PingFang SC',sans-serif" }}>{layer.name}</div>
                <div style={{ fontSize: 18, color: layer.textColor + "cc",
                  fontFamily: "'PingFang SC',sans-serif" }}>{layer.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 土壤成分饼图（柱状展示） */}
      <div style={{
        position: "absolute", top: 155, left: 440, right: 50,
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 20,
          fontFamily: "'PingFang SC',sans-serif" }}>土壤四大成分</div>
        {soilComps.map((comp, i) => {
          const barW = interpolate(frame, [65 + i * 12, 95 + i * 12], [0, comp.pct * 4.5], { extrapolateRight: "clamp" });
          return (
            <div key={comp.name} style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6,
              }}>
                <span style={{ fontSize: 26, color: comp.color, fontWeight: 600 }}>{comp.name}</span>
                <span style={{ fontSize: 28, color: comp.color, fontWeight: 800 }}>{comp.pct}%</span>
              </div>
              <div style={{ height: 24, background: "rgba(255,255,255,.07)", borderRadius: 12 }}>
                <div style={{
                  height: "100%", width: `${barW}px`, maxWidth: "100%",
                  background: `linear-gradient(90deg, ${comp.color} 0%, ${comp.color}88 100%)`,
                  borderRadius: 12,
                }} />
              </div>
            </div>
          );
        })}

        {/* 三类土壤 */}
        <div style={{
          marginTop: 28,
          opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 14,
            fontFamily: "'PingFang SC',sans-serif" }}>三种土壤类型</div>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { name: "沙土", color: "#fcd34d", desc: "排水快\n保水差" },
              { name: "黏土", color: "#f87171", desc: "保水好\n透气差" },
              { name: "壤土⭐", color: "#4ade80", desc: "最适合\n植物生长" },
            ].map((type, i) => (
              <div key={type.name} style={{
                flex: 1, background: `${type.color}12`,
                border: `2px solid ${type.color}40`,
                borderRadius: 14, padding: "16px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: type.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>{type.name}</div>
                <div style={{ fontSize: 20, color: "#cbd5e1",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.6, whiteSpace: "pre-line" }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    {
      icon: "🌋", color: C.igneous,
      title: "发现一：火成岩",
      text: "岩浆冷却凝固形成\n代表：花岗岩",
    },
    {
      icon: "🏔", color: C.sediment,
      title: "发现二：沉积岩",
      text: "沉积物压实胶结\n代表：砂岩、石灰岩",
    },
    {
      icon: "💎", color: C.metamorph,
      title: "发现三：变质岩",
      text: "高温高压下变质\n代表：大理石",
    },
    {
      icon: "🌱", color: C.accent,
      title: "发现四：土壤的奥秘",
      text: "矿物质+有机质+水+空气\n壤土最适合植物生长",
    },
  ];

  // 星星动画
  const starOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const starScale = spring({ frame: frame - 65, fps, config: { stiffness: 100, damping: 12 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(52,211,153,.07) 0%, transparent 65%)",
      }} />

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>🎯 今天的四大发现</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>岩石与土壤 · 核心要点</div>
      </div>

      {/* 四格卡片 */}
      <div style={{
        position: "absolute", top: 165, left: 55, right: 55,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [18, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,40,24,.9)", borderRadius: 22, padding: "28px 26px",
              border: `2px solid ${p.color}40`,
              display: "flex", gap: 20, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              boxShadow: `0 4px 24px ${p.color}18`,
            }}>
              <div style={{ fontSize: 64, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#e2f5ea",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部激励 */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        textAlign: "center", opacity: starOp,
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 32, color: C.accent,
        transform: `scale(${Math.min(starScale, 1)})`,
      }}>
        🌟 珍惜土地，保护土壤，爱护我们共同的家园！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const RocksSoilVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90} durationInFrames={150}><RocksScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><MineralsScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><SoilScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
