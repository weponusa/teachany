import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#050e1f",
  bg2: "#0a1628",
  text: "#f0f9ff",
  muted: "#94a3b8",
  primary: "#38bdf8",
  secondary: "#34d399",
  accent: "#fbbf24",
  danger: "#f87171",
  purple: "#a78bfa",
  pink: "#f472b6",
  earth: "#22c55e",
  moon: "#94a3b8",
  jupiter: "#f97316",
};

const font = "'PingFang SC','Microsoft YaHei',Helvetica,sans-serif";

// ── 场景1：标题 + 苹果落下动画 ──────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });

  // 苹果位置：从上方 y=-80 落到 y=0（树枝位置），然后继续落到 y=400（地面）
  const applePhase = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }); // hang
  const appleFall = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const appleY = interpolate(appleFall, [0, 1], [0, 340], { easing: (t) => t * t }); // gravity curve
  const appleOp = interpolate(frame, [65, 72], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // 箭头出现
  const arrowOp = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp" });
  const arrowScale = spring({ frame: frame - 75, fps, config: { stiffness: 150, damping: 12 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 25%, rgba(56,189,248,.22) 0%, transparent 55%), ${C.bg}`,
      overflow: "hidden",
    }}>
      {/* 星空背景粒子 */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 37 + 13) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0.2 + (i % 5) * 0.1,
        }} />
      ))}

      {/* 主标题 */}
      <div style={{
        position: "absolute", top: 200, left: 0, right: 0,
        textAlign: "center",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        fontFamily: font,
      }}>
        <div style={{
          fontSize: 110, fontWeight: 900,
          background: "linear-gradient(135deg, #fff 30%, #38bdf8 80%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>重力与重量</div>
        <div style={{ fontSize: 42, color: C.muted, marginTop: 16, opacity: subOp }}>
          小学科学 G4 · 物质科学
        </div>
      </div>

      {/* 苹果动画区域 */}
      <div style={{
        position: "absolute", right: 280, top: 160,
        opacity: Math.max(0, appleOp),
        transform: `translateY(${appleY}px)`,
      }}>
        <div style={{ fontSize: 90 }}>🍎</div>
      </div>

      {/* 树枝 */}
      <div style={{
        position: "absolute", right: 200, top: 155,
        fontSize: 60, opacity: 0.9,
      }}>🌿</div>

      {/* 重力箭头提示 */}
      <div style={{
        position: "absolute", right: 320, top: 520,
        opacity: arrowOp,
        transform: `scale(${Math.min(arrowScale, 1)})`,
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: font,
      }}>
        <div style={{ fontSize: 42, color: C.accent, fontWeight: 700 }}>重力方向 ↓</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>竖直向下</div>
      </div>

      {/* 知识点徽章 */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 28,
        opacity: badgeOp, fontFamily: font,
      }}>
        {["🌍 重力定义", "⚖️ 质量 vs 重量", "🌙 各星球重力", "🪂 自由落体"].map((t, i) => (
          <div key={i} style={{
            padding: "14px 28px", borderRadius: 99,
            background: "rgba(56,189,248,.15)",
            border: "1px solid rgba(56,189,248,.4)",
            color: C.primary, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：重力方向示意 ──────────────────────────────────────
const GravityDirectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const earthOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const arrowsOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const formulaOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const earthScale = spring({ frame: frame - 15, fps, config: { stiffness: 80, damping: 18 } });

  // 8 个方向的箭头（指向地球中心）
  const arrows = [
    { angle: 0, label: "向下" },
    { angle: 45, label: "↙" },
    { angle: 90, label: "向左" },
    { angle: 135, label: "↖" },
    { angle: 180, label: "向上（地球另侧）" },
    { angle: 225, label: "" },
    { angle: 270, label: "向右" },
    { angle: 315, label: "" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: font,
      }}>
        <div style={{ fontSize: 62, fontWeight: 800, color: "#fff" }}>🌍 重力的方向</div>
        <div style={{ fontSize: 32, color: C.muted, marginTop: 12 }}>
          地球对物体的引力 · 始终指向地球中心
        </div>
      </div>

      {/* 地球 */}
      <div style={{
        position: "absolute", left: "50%", top: "48%",
        transform: `translate(-50%, -50%) scale(${Math.min(earthScale, 1)})`,
        opacity: earthOp,
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #4ade80, #16a34a, #052e16)",
          border: "4px solid rgba(74,222,128,.5)",
          boxShadow: "0 0 60px rgba(34,197,94,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 70,
        }}>🌍</div>
      </div>

      {/* 围绕地球的物体和箭头 */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const r = 280;
        const cx = 960, cy = 530;
        const ox = cx + r * Math.cos(rad);
        const oy = cy + r * Math.sin(rad);
        const delay = 35 + i * 5;
        const aOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
        const items = ["🏠", "🌊", "🌲", "🏔️", "🦅", "👤"];

        return (
          <div key={i} style={{
            position: "absolute",
            left: ox - 30, top: oy - 30,
            opacity: arrowsOp * aOp,
          }}>
            <div style={{ fontSize: 42, textAlign: "center" }}>{items[i]}</div>
            {/* 箭头指向地心 */}
            <div style={{
              position: "absolute",
              left: "50%", top: "50%",
              transformOrigin: "0 0",
              transform: `rotate(${deg + 90}deg) translateX(-50%)`,
              width: 60, height: 4,
              background: `linear-gradient(90deg, transparent, ${C.accent})`,
            }}>
              <div style={{
                position: "absolute", right: -8, top: -6,
                width: 0, height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: `14px solid ${C.accent}`,
                transform: "rotate(-90deg) translateY(-7px)",
              }} />
            </div>
          </div>
        );
      })}

      {/* 公式 */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        textAlign: "center", opacity: formulaOp, fontFamily: font,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(56,189,248,.12)",
          border: "2px solid rgba(56,189,248,.4)",
          borderRadius: 16, padding: "20px 48px",
        }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.primary }}>
            G = m × g
          </div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>
            重力(N) = 质量(kg) × 重力加速度(≈10 N/kg)
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：质量 vs 重量 ──────────────────────────────────────
const MassWeightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [15, 38], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [38, 60], [0, 1], { extrapolateRight: "clamp" });
  const tableOp = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });

  const leftScale = spring({ frame: frame - 15, fps, config: { stiffness: 90, damping: 16 } });
  const rightScale = spring({ frame: frame - 38, fps, config: { stiffness: 90, damping: 16 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp, fontFamily: font,
      }}>
        <div style={{ fontSize: 62, fontWeight: 800, color: "#fff" }}>⚖️ 质量 vs 重量</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>两个容易混淆的概念，其实差很多！</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 60, right: 60,
        display: "flex", gap: 40,
      }}>
        {/* 质量 */}
        <div style={{
          flex: 1,
          background: "rgba(52,211,153,.08)",
          border: "3px solid rgba(52,211,153,.5)",
          borderRadius: 24, padding: "36px 32px",
          opacity: leftOp,
          transform: `scale(${Math.min(leftScale, 1)})`,
          transformOrigin: "left center",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚙️</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: C.secondary, marginBottom: 16, fontFamily: font }}>
            质量（Mass）
          </div>
          <div style={{ fontSize: 28, color: "#fff", lineHeight: 1.8, fontFamily: font }}>
            • 物体所含物质的多少<br/>
            • 单位：<span style={{ color: C.secondary, fontWeight: 700 }}>千克（kg）</span><br/>
            • 在任何星球都<span style={{ color: C.accent, fontWeight: 700 }}>不变</span><br/>
            • 用天平测量
          </div>
          <div style={{
            marginTop: 24, padding: "16px 20px",
            background: "rgba(52,211,153,.12)", borderRadius: 12,
            fontFamily: font, fontSize: 26, color: C.muted,
          }}>
            例：你的质量 = <span style={{ color: C.secondary, fontWeight: 700 }}>50 kg</span><br/>
            在月球上质量 = <span style={{ color: C.secondary, fontWeight: 700 }}>仍然 50 kg</span>
          </div>
        </div>

        {/* 重量 */}
        <div style={{
          flex: 1,
          background: "rgba(251,191,36,.08)",
          border: "3px solid rgba(251,191,36,.5)",
          borderRadius: 24, padding: "36px 32px",
          opacity: rightOp,
          transform: `scale(${Math.min(rightScale, 1)})`,
          transformOrigin: "right center",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔩</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: C.accent, marginBottom: 16, fontFamily: font }}>
            重量（Weight）
          </div>
          <div style={{ fontSize: 28, color: "#fff", lineHeight: 1.8, fontFamily: font }}>
            • 重力的大小<br/>
            • 单位：<span style={{ color: C.accent, fontWeight: 700 }}>牛顿（N）</span><br/>
            • 在不同星球<span style={{ color: C.danger, fontWeight: 700 }}>不同</span><br/>
            • 用弹簧秤测量
          </div>
          <div style={{
            marginTop: 24, padding: "16px 20px",
            background: "rgba(251,191,36,.12)", borderRadius: 12,
            fontFamily: font, fontSize: 26, color: C.muted,
          }}>
            例：你在地球的重量 ≈ <span style={{ color: C.accent, fontWeight: 700 }}>500 N</span><br/>
            在月球的重量 ≈ <span style={{ color: C.danger, fontWeight: 700 }}>83 N</span>
          </div>
        </div>
      </div>

      {/* 关键提示 */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", opacity: tableOp, fontFamily: font,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(248,113,113,.12)",
          border: "2px solid rgba(248,113,113,.4)",
          borderRadius: 16, padding: "18px 48px",
          fontSize: 34, color: C.danger, fontWeight: 700,
        }}>
          ⚠️ 记住：质量不变，重量随星球重力变化！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：各星球重力对比柱状图 ─────────────────────────────────
const PlanetsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const planets = [
    { name: "月球", emoji: "🌙", g: 1.6, ratio: 0.165, color: C.moon, label: "1/6 地球" },
    { name: "火星", emoji: "🔴", g: 3.7, ratio: 0.38, color: "#ef4444", label: "0.38× 地球" },
    { name: "地球", emoji: "🌍", g: 9.8, ratio: 1.0, color: C.earth, label: "基准" },
    { name: "土星", emoji: "🪐", g: 10.4, ratio: 1.07, color: "#fbbf24", label: "1.07× 地球" },
    { name: "木星", emoji: "🟠", g: 24.8, ratio: 2.53, color: C.jupiter, label: "2.53× 地球" },
    { name: "太阳", emoji: "☀️", g: 274, ratio: 28, color: "#facc15", label: "28× 地球" },
  ];

  const maxBarH = 480;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp, fontFamily: font,
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🪐 各星球重力对比</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>
          同一个 50 kg 的人，在不同星球的重量（N）
        </div>
      </div>

      {/* 柱状图 */}
      <div style={{
        position: "absolute", bottom: 100, left: 80, right: 80,
        display: "flex", alignItems: "flex-end", justifyContent: "space-around",
        height: maxBarH,
      }}>
        {planets.map((p, i) => {
          const delay = 20 + i * 12;
          const barProg = spring({ frame: frame - delay, fps, config: { stiffness: 60, damping: 20 } });
          // cap ratio for display (sun too tall)
          const displayRatio = Math.min(p.ratio, 3) / 3;
          const barH = displayRatio * maxBarH * Math.min(barProg, 1);
          const labelOp = interpolate(frame, [delay + 10, delay + 25], [0, 1], { extrapolateRight: "clamp" });

          const weightOn50kg = (50 * p.g).toFixed(0);

          return (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              width: 130,
            }}>
              {/* 数值标签 */}
              <div style={{
                marginBottom: 8, opacity: labelOp, fontFamily: font,
                fontSize: 22, color: p.color, fontWeight: 700, textAlign: "center",
              }}>
                {p.ratio >= 28 ? "≈13720" : weightOn50kg} N
              </div>
              {/* 柱体 */}
              <div style={{
                width: "100%", height: barH,
                background: `linear-gradient(180deg, ${p.color}dd, ${p.color}66)`,
                borderRadius: "10px 10px 0 0",
                border: `2px solid ${p.color}`,
                boxShadow: `0 0 20px ${p.color}44`,
                position: "relative",
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                paddingTop: 8,
              }}>
                <div style={{ fontSize: 28 }}>{p.emoji}</div>
              </div>
              {/* 星球名 */}
              <div style={{ marginTop: 10, textAlign: "center", fontFamily: font }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: 18, color: C.muted }}>{p.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 基准线 */}
      <div style={{
        position: "absolute", bottom: 260, left: 80, right: 80,
        height: 2, background: "rgba(34,197,94,.5)",
        opacity: interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{
          position: "absolute", right: 0, top: -16,
          fontSize: 18, color: C.earth, fontFamily: font,
        }}>← 地球基准</div>
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", fontFamily: font }}>
        <div style={{ fontSize: 24, color: C.muted, opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }) }}>
          💡 太阳重力是地球的 28 倍——柱体已截断显示
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：自由落体 ───────────────────────────────────────────
const FreefallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const textOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  // 两个物体下落（同时开始，同时落地）
  const fallProg = interpolate(frame, [30, 95], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fallY = fallProg * fallProg * 380; // quadratic = realistic gravity

  // 速度表盘
  const speed = (fallProg * 10 * 6.5).toFixed(1); // approx 65m/s max

  const conclusionOp = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp, fontFamily: font,
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🪂 自由落体实验</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>
          伽利略：质量不同的物体，下落速度相同！
        </div>
      </div>

      {/* 说明文字 */}
      <div style={{
        position: "absolute", top: 155, left: 80, right: 80,
        display: "flex", gap: 32, opacity: textOp, fontFamily: font,
      }}>
        <div style={{
          flex: 1,
          background: "rgba(167,139,250,.1)", border: "2px solid rgba(167,139,250,.4)",
          borderRadius: 16, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 26, color: C.purple, fontWeight: 700, marginBottom: 10 }}>
            ❌ 旧观点（亚里士多德）
          </div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.7 }}>
            重的物体落得更快<br/>
            铁球比羽毛先落地是因为更重
          </div>
        </div>
        <div style={{
          flex: 1,
          background: "rgba(52,211,153,.1)", border: "2px solid rgba(52,211,153,.4)",
          borderRadius: 16, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 26, color: C.secondary, fontWeight: 700, marginBottom: 10 }}>
            ✅ 正确（伽利略实验）
          </div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.7 }}>
            忽略空气阻力时<br/>
            所有物体下落加速度 = 9.8 m/s²
          </div>
        </div>
      </div>

      {/* 下落动画：铁球 和 羽毛 */}
      <div style={{
        position: "absolute", left: "50%", top: 310,
        transform: "translateX(-50%)",
        display: "flex", gap: 120, alignItems: "flex-start",
      }}>
        {/* 铁球 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: C.muted, fontFamily: font, marginBottom: 8 }}>铁球 (5 kg)</div>
          <div style={{
            width: 72, height: 72,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #94a3b8, #1e293b)",
            border: "3px solid #94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `translateY(${fallY}px)`,
            boxShadow: "0 4px 20px rgba(0,0,0,.5)",
          }}>
            <div style={{ fontSize: 28 }}>🔩</div>
          </div>
        </div>

        {/* 羽毛 (in vacuum) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: C.muted, fontFamily: font, marginBottom: 8 }}>羽毛 (真空)</div>
          <div style={{
            fontSize: 64,
            transform: `translateY(${fallY}px)`,
          }}>🪶</div>
        </div>
      </div>

      {/* 速度计 */}
      <div style={{
        position: "absolute", right: 80, top: 320,
        width: 200,
        background: "rgba(56,189,248,.08)", border: "2px solid rgba(56,189,248,.3)",
        borderRadius: 16, padding: "20px",
        textAlign: "center", fontFamily: font,
        opacity: textOp,
      }}>
        <div style={{ fontSize: 20, color: C.muted, marginBottom: 8 }}>当前速度</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: C.primary }}>
          {speed}
        </div>
        <div style={{ fontSize: 18, color: C.muted }}>m/s</div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 8 }}>加速度 ≈ 10 m/s²</div>
      </div>

      {/* 地面线 */}
      <div style={{
        position: "absolute", bottom: 135, left: 200, right: 200,
        height: 4, background: `linear-gradient(90deg, transparent, ${C.secondary}, transparent)`,
        borderRadius: 2,
      }} />
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0,
        textAlign: "center", fontFamily: font, fontSize: 22, color: C.secondary,
      }}>──── 地面 ────</div>

      {/* 结论 */}
      <div style={{
        position: "absolute", bottom: 30, left: 0, right: 0,
        textAlign: "center", opacity: conclusionOp, fontFamily: font,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(52,211,153,.12)",
          border: "2px solid rgba(52,211,153,.4)",
          borderRadius: 16, padding: "16px 48px",
          fontSize: 30, color: C.secondary, fontWeight: 700,
        }}>
          🎯 质量不影响下落速度！羽毛和铁锤在真空中同时落地！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主合成 ──────────────────────────────────────────────────
export const GravityVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* 背景音频 */}
      <Audio src={staticFile("audio/narration.mp3")} />

      {/* 场景1：标题 0-131 帧 */}
      <Sequence from={0} durationInFrames={132}>
        <TitleScene />
      </Sequence>

      {/* 场景2：重力方向 132-263 帧 */}
      <Sequence from={132} durationInFrames={132}>
        <GravityDirectionScene />
      </Sequence>

      {/* 场景3：质量 vs 重量 264-395 帧 */}
      <Sequence from={264} durationInFrames={132}>
        <MassWeightScene />
      </Sequence>

      {/* 场景4：各星球重力 396-527 帧 */}
      <Sequence from={396} durationInFrames={132}>
        <PlanetsScene />
      </Sequence>

      {/* 场景5：自由落体 528-659 帧 */}
      <Sequence from={528} durationInFrames={132}>
        <FreefallScene />
      </Sequence>
    </AbsoluteFill>
  );
};
