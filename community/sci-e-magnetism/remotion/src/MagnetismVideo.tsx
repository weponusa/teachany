import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#050d1a",
  bg2: "#0a1628",
  card: "rgba(10,22,40,0.95)",
  text: "#f0f9ff",
  muted: "#94a3b8",
  north: "#ef4444",    // N极红色
  south: "#3b82f6",    // S极蓝色
  gold: "#fbbf24",
  green: "#34d399",
  cyan: "#22d3ee",
  purple: "#a78bfa",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const magScale = spring({ frame: frame - 10, fps, config: { stiffness: 100, damping: 14 } });
  const glowPulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(239,68,68,.18) 0%, transparent 40%),
                   radial-gradient(ellipse at 30% 70%, rgba(59,130,246,.18) 0%, transparent 40%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 磁铁图标 */}
      <div style={{
        transform: `scale(${Math.min(magScale, 1)})`,
        marginBottom: 36,
        display: "flex", gap: 0,
      }}>
        <div style={{
          width: 80, height: 120, borderRadius: "40px 0 0 40px",
          background: "linear-gradient(180deg, #ef4444 50%, #3b82f6 50%)",
          border: "4px solid rgba(255,255,255,0.3)",
          display: "flex", flexDirection: "column",
          boxShadow: `0 0 ${40 * glowPulse}px rgba(239,68,68,.5), 0 0 ${40 * glowPulse}px rgba(59,130,246,.5)`,
        }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>N</div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>S</div>
        </div>
        <div style={{
          width: 80, height: 120, borderRadius: "0 40px 40px 0",
          background: "linear-gradient(180deg, #ef4444 50%, #3b82f6 50%)",
          border: "4px solid rgba(255,255,255,0.3)",
          display: "flex", flexDirection: "column",
          boxShadow: `0 0 ${40 * glowPulse}px rgba(239,68,68,.5), 0 0 ${40 * glowPulse}px rgba(59,130,246,.5)`,
        }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>N</div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>S</div>
        </div>
      </div>

      <div style={{
        fontSize: 96, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg, #fff 20%, #ef4444 50%, #3b82f6 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>磁铁与磁现象</div>

      <div style={{
        marginTop: 20, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G2 · 物质科学</div>

      <div style={{
        marginTop: 44, display: "flex", gap: 28, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🧲 磁力吸引", "↕ 同斥异吸", "🧭 指南针"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 30px", borderRadius: 99,
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)",
            color: "#fff", fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：磁铁吸引金属 ────────────────────────────────
const AttractScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 磁铁向右移动，靠近铁钉
  const magnetX = interpolate(frame, [20, 60], [-200, 0], { extrapolateRight: "clamp" });
  const magnetOp = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  // 铁钉被吸引向磁铁移动
  const nailMoveX = interpolate(frame, [50, 90], [0, -80], { extrapolateRight: "clamp" });
  const nailOp = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });

  // 不能被吸引的物品（不动）
  const itemsOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const labelOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const attracted = [
    { emoji: "🔩", label: "铁钉", color: C.green },
    { emoji: "📎", label: "回形针", color: C.green },
    { emoji: "⚙️", label: "齿轮(铁)", color: C.green },
  ];
  const notAttracted = [
    { emoji: "🥄", label: "铝勺", color: C.muted },
    { emoji: "🪙", label: "铜钱", color: C.muted },
    { emoji: "🪵", label: "木头", color: C.muted },
    { emoji: "🧴", label: "塑料", color: C.muted },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🧲 磁铁能吸引什么？</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>铁、镍、钴 → 能吸；铜、铝、木头、塑料 → 不能吸</div>
      </div>

      {/* 动画区：磁铁 + 铁钉 */}
      <div style={{
        position: "absolute", top: 170, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 0,
      }}>
        {/* 磁铁 */}
        <div style={{
          transform: `translateX(${magnetX}px)`,
          opacity: magnetOp,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            width: 120, height: 200,
            background: "linear-gradient(180deg, #ef4444 50%, #3b82f6 50%)",
            borderRadius: 12, border: "3px solid rgba(255,255,255,.3)",
            display: "flex", flexDirection: "column",
            boxShadow: "0 0 40px rgba(239,68,68,.4), 0 0 40px rgba(59,130,246,.4)",
          }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:40, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>N</div>
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:40, fontWeight:900, color:"#fff", fontFamily:"Arial,sans-serif" }}>S</div>
          </div>
          <div style={{ marginTop:12, fontSize:24, color: C.muted,
            fontFamily:"'PingFang SC',sans-serif" }}>磁铁</div>
        </div>

        {/* 磁力线箭头 */}
        <div style={{
          opacity: interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 60, color: C.gold, marginLeft: 10, marginRight: 10,
        }}>←←←</div>

        {/* 铁钉 */}
        <div style={{
          transform: `translateX(${nailMoveX}px)`,
          opacity: nailOp,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          {attracted.map((item, i) => (
            <div key={i} style={{
              background: "rgba(52,211,153,.12)",
              border: "2px solid rgba(52,211,153,.5)",
              borderRadius: 12, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 10,
              opacity: interpolate(frame, [30 + i*10, 50 + i*10], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <span style={{ fontSize: 36 }}>{item.emoji}</span>
              <span style={{ fontSize: 24, color: item.color,
                fontFamily:"'PingFang SC',sans-serif", fontWeight:700 }}>{item.label}</span>
              <span style={{ fontSize: 20, color: C.green }}>✅ 能吸</span>
            </div>
          ))}
        </div>
      </div>

      {/* 不能被吸的物品 */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60,
        opacity: itemsOp,
      }}>
        <div style={{ fontSize: 26, color: C.muted, marginBottom: 14,
          fontFamily:"'PingFang SC',sans-serif", textAlign:"center" }}>🚫 以下物品不被磁铁吸引：</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
          {notAttracted.map((item, i) => (
            <div key={i} style={{
              background: "rgba(148,163,184,.08)",
              border: "1px solid rgba(148,163,184,.3)",
              borderRadius: 12, padding: "12px 20px",
              display: "flex", alignItems: "center", gap: 8,
              opacity: interpolate(frame, [60 + i*8, 75 + i*8], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <span style={{ fontSize: 32 }}>{item.emoji}</span>
              <span style={{ fontSize: 22, color: item.color,
                fontFamily:"'PingFang SC',sans-serif" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center",
        opacity: labelOp, fontFamily:"'PingFang SC',sans-serif",
        fontSize: 26, color: C.gold,
      }}>
        💡 能被磁铁吸引的三种金属：铁（Fe）· 镍（Ni）· 钴（Co）
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：N/S极同斥异吸 ─────────────────────────────
const PolesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 同极相斥动画：frame 20-80
  const repelOffset = interpolate(frame, [20, 60], [0, 120], { extrapolateRight: "clamp" });
  const repelOp = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  // 异极相吸动画：frame 90-140
  const attractOffset = interpolate(frame, [90, 130], [120, 20], { extrapolateRight: "clamp" });
  const attractOp = interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" });

  const MagnetBar = ({ label, color, side }: { label: string; color: string; side: "left" | "right" }) => (
    <div style={{
      width: 100, height: 180,
      background: color,
      borderRadius: side === "left" ? "12px 0 0 12px" : "0 12px 12px 0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 42, fontWeight: 900, color: "#fff",
      fontFamily: "Arial, sans-serif",
      border: "3px solid rgba(255,255,255,.3)",
      boxShadow: `0 0 30px ${color}80`,
    }}>{label}</div>
  );

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>⚡ 磁极的秘密</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          <span style={{ color: C.north }}>N极</span> 和 <span style={{ color: C.south }}>S极</span> · 同极相斥 · 异极相吸
        </div>
      </div>

      {/* 同极相斥 */}
      <div style={{
        position: "absolute", top: 170, left: 60, right: 60,
        opacity: repelOp,
      }}>
        <div style={{ fontSize: 30, color: C.gold, fontWeight: 700, marginBottom: 20,
          fontFamily:"'PingFang SC',sans-serif", textAlign:"center" }}>
          🚫 同极相斥（N·N 或 S·S）
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {/* 左磁铁（向左推）*/}
          <div style={{ transform: `translateX(${-repelOffset}px)`, display: "flex" }}>
            <MagnetBar label="S" color={C.south} side="left" />
            <MagnetBar label="N" color={C.north} side="right" />
          </div>
          {/* 排斥箭头 */}
          <div style={{
            fontSize: 48, color: "#f87171", margin: "0 20px",
            opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }),
          }}>↔</div>
          {/* 右磁铁（向右推）*/}
          <div style={{ transform: `translateX(${repelOffset}px)`, display: "flex" }}>
            <MagnetBar label="N" color={C.north} side="left" />
            <MagnetBar label="S" color={C.south} side="right" />
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:16, fontSize:26, color:"#f87171",
          fontFamily:"'PingFang SC',sans-serif" }}>
          互相推开！💨
        </div>
      </div>

      {/* 异极相吸 */}
      <div style={{
        position: "absolute", top: 520, left: 60, right: 60,
        opacity: attractOp,
      }}>
        <div style={{ fontSize: 30, color: C.green, fontWeight: 700, marginBottom: 20,
          fontFamily:"'PingFang SC',sans-serif", textAlign:"center" }}>
          ✅ 异极相吸（N·S 相对）
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {/* 左磁铁 */}
          <div style={{ transform: `translateX(${attractOffset}px)`, display: "flex" }}>
            <MagnetBar label="S" color={C.south} side="left" />
            <MagnetBar label="N" color={C.north} side="right" />
          </div>
          {/* 吸引箭头 */}
          <div style={{
            fontSize: 48, color: C.green, margin: "0 20px",
            opacity: interpolate(frame, [110, 125], [0, 1], { extrapolateRight: "clamp" }),
          }}>⟷</div>
          {/* 右磁铁 */}
          <div style={{ transform: `translateX(${-attractOffset}px)`, display: "flex" }}>
            <MagnetBar label="S" color={C.south} side="left" />
            <MagnetBar label="N" color={C.north} side="right" />
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:16, fontSize:26, color:C.green,
          fontFamily:"'PingFang SC',sans-serif" }}>
          紧紧吸在一起！🤝
        </div>
      </div>

      {/* 口诀 */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0, textAlign:"center",
        opacity: interpolate(frame, [130, 145], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily:"'PingFang SC',sans-serif",
        fontSize: 34, fontWeight:800,
        background: "linear-gradient(135deg, #ef4444, #3b82f6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        口诀：同极相斥，异极相吸 🧲
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：磁力线动画 ──────────────────────────────────
const FieldScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 磁力线绘制进度
  const drawProgress = interpolate(frame, [20, 100], [0, 1], { extrapolateRight: "clamp" });
  const labelOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });
  const compassOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });

  // 生成磁力线路径（贝塞尔曲线 SVG）
  const fieldLines = [
    // 外弧线（从N到S，不同弯曲度）
    { d: "M 760 290 C 960 120, 1160 120, 1160 540", dash: 200 },
    { d: "M 760 330 C 920 180, 1100 180, 1160 490", dash: 160 },
    { d: "M 760 360 C 900 250, 1020 250, 1160 450", dash: 120 },
    { d: "M 760 400 C 860 340, 1060 340, 1160 420", dash: 100 },
    // 下半部分（镜像）
    { d: "M 760 440 C 860 490, 1060 490, 1160 440", dash: 100 },
    { d: "M 760 480 C 900 520, 1020 520, 1160 500", dash: 120 },
    { d: "M 760 520 C 920 580, 1100 580, 1160 550", dash: 160 },
    { d: "M 760 560 C 960 660, 1160 660, 1160 590", dash: 200 },
  ];

  const totalLength = 300;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🌊 磁场与磁力线</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>磁力线从N极出发，到S极结束</div>
      </div>

      {/* SVG 磁力线图 */}
      <svg
        width="1920" height="800"
        viewBox="0 0 1920 800"
        style={{ position: "absolute", top: 140 }}
      >
        {/* 磁铁左（N极端向右）*/}
        <rect x="580" y="250" width="180" height="340" rx="12"
          fill="#ef4444" stroke="rgba(255,255,255,0.3)" strokeWidth="4"
          style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.6))" }}
        />
        <text x="670" y="445" textAnchor="middle" fontSize="60" fontWeight="900"
          fill="white" fontFamily="Arial,sans-serif">N</text>

        {/* 磁铁右（S极端向左）*/}
        <rect x="1160" y="250" width="180" height="340" rx="12"
          fill="#3b82f6" stroke="rgba(255,255,255,0.3)" strokeWidth="4"
          style={{ filter: "drop-shadow(0 0 20px rgba(59,130,246,0.6))" }}
        />
        <text x="1250" y="445" textAnchor="middle" fontSize="60" fontWeight="900"
          fill="white" fontFamily="Arial,sans-serif">S</text>

        {/* 磁力线 */}
        {fieldLines.map((line, i) => {
          const lineProgress = interpolate(drawProgress, [i / fieldLines.length, (i + 0.8) / fieldLines.length], [0, 1], { extrapolateRight: "clamp" });
          const strokeDash = `${lineProgress * totalLength} ${totalLength * 2}`;
          return (
            <g key={i}>
              <path
                d={line.d}
                fill="none"
                stroke="rgba(251,191,36,0.7)"
                strokeWidth="3"
                strokeDasharray={strokeDash}
                strokeDashoffset="0"
              />
              {/* 箭头提示方向 */}
              {lineProgress > 0.7 && (
                <text
                  x={parseFloat(line.d.split("C")[0].split(" ")[1]) + 200 + i * 5}
                  y={parseFloat(line.d.split("C")[0].split(" ")[2]) + 50}
                  fontSize="20" fill="rgba(251,191,36,0.8)"
                >→</text>
              )}
            </g>
          );
        })}

        {/* 标注 */}
        <text x="670" y="640" textAnchor="middle" fontSize="28"
          fill="#ef4444" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>N极（起点）</text>
        <text x="1250" y="640" textAnchor="middle" fontSize="28"
          fill="#3b82f6" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>S极（终点）</text>
        <text x="960" y="80" textAnchor="middle" fontSize="30"
          fill="rgba(251,191,36,0.9)" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>↑ 磁力线（从N到S）</text>
      </svg>

      {/* 指南针说明 */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        textAlign: "center", opacity: compassOp,
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: C.cyan,
      }}>
        🧭 地球是大磁铁 → 指南针 N 极指向地球北方
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const points = [
    { icon: "🧲", color: C.green, title: "发现一", text: "磁铁能吸引铁、镍、钴\n铜铝木头塑料不能吸" },
    { icon: "⚡", color: C.north, title: "发现二", text: "同极相斥，异极相吸\nN极×N极→推开" },
    { icon: "🌊", color: C.gold, title: "发现三", text: "磁场与磁力线\n从N极到S极" },
    { icon: "🧭", color: C.cyan, title: "发现四", text: "指南针原理\n地球磁场→N极指北" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,.06) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🎯 今天的四大发现</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>磁铁与磁现象 · 核心要点</div>
      </div>

      <div style={{
        position: "absolute", top: 175, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 20;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: C.card, borderRadius: 20, padding: "28px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 20, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              boxShadow: `0 4px 24px ${p.color}18`,
            }}>
              <div style={{ fontSize: 70, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: C.muted,
      }}>
        ✨ 磁铁在生活中的应用：冰箱门封、扬声器、电动机、磁悬浮列车...
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const MagnetismVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={120}><TitleScene /></Sequence>
      <Sequence from={120} durationInFrames={150}><AttractScene /></Sequence>
      <Sequence from={270} durationInFrames={160}><PolesScene /></Sequence>
      <Sequence from={430} durationInFrames={150}><FieldScene /></Sequence>
      <Sequence from={580} durationInFrames={80}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
