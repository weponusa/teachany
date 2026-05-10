import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#061a2e",
  bg2: "#0a2540",
  text: "#f0f9ff",
  muted: "#94a3b8",
  water: "#0ea5e9",
  primary: "#38bdf8",
  secondary: "#34d399",
  accent: "#fbbf24",
  danger: "#f87171",
  purple: "#a78bfa",
  salt: "#e2e8f0",
  sugar: "#fde68a",
  sand: "#d97706",
};

// ─── 粒子工具 ──────────────────────────────────────────
interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number;
  alpha: number; color: string;
}

function getSaltParticles(frame: number, fps: number, count = 28): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const delay = i * 4;
    const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 20 } });
    const t = Math.max(0, frame - delay) / fps;
    // 初始在杯中央上部，逐渐扩散
    const angle = (i / count) * Math.PI * 2 + t * 0.3;
    const radius = Math.min(prog * 100, 100);
    const dissolveAlpha = Math.max(0, 1 - Math.max(0, frame - delay - 60) / 80);
    return {
      x: 960 + Math.cos(angle) * radius,
      y: 480 + Math.sin(angle) * radius * 0.6,
      r: Math.max(1, 8 - prog * 5),
      vx: 0, vy: 0,
      alpha: Math.min(prog, dissolveAlpha),
      color: C.salt,
    };
  });
}

// ─── 场景1：标题 ───────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });

  // 水滴背景粒子
  const bgParticles = Array.from({ length: 20 }, (_, i) => {
    const t = (frame * 0.5 + i * 30) % 300;
    const x = (i * 97 + 80) % 1920;
    const y = (t * 2 + i * 50) % 1080;
    return { x, y, r: 3 + (i % 4) * 2, alpha: 0.15 + (i % 3) * 0.1 };
  });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 65% 30%, rgba(14,165,233,.25) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* 背景水滴 */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {bgParticles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r}
            fill={C.water} opacity={p.alpha} />
        ))}
      </svg>

      {/* 主emoji */}
      <div style={{
        fontSize: 110,
        transform: `scale(${spring({ frame: frame - 5, fps, config: { stiffness: 100, damping: 14 } })})`,
        marginBottom: 36, filter: "drop-shadow(0 0 30px rgba(14,165,233,.6))",
      }}>🧂💧🫙</div>

      {/* 标题 */}
      <div style={{
        fontSize: 104, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        color: "#fff",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#38bdf8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>溶解现象</div>

      {/* 副标题 */}
      <div style={{
        marginTop: 20, fontSize: 38, color: C.muted,
        opacity: subOp, fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G4 · 物质科学</div>

      {/* 标签徽章 */}
      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: badgeOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🔬 溶解定义", "⚡ 影响因素", "🌊 溶液特征", "🔁 蒸发回收"].map((t, i) => (
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

// ─── 场景2：溶解粒子动画 ──────────────────────────────
const DissolveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const cupOp = interpolate(frame, [8, 25], [0, 1], { extrapolateRight: "clamp" });

  // 盐粒子：从杯中央开始扩散并淡出（溶解效果）
  const particleCount = 32;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const seed = i * 137.5;
    const delay = i * 3;
    const elapsed = Math.max(0, frame - delay);
    const prog = spring({ frame: elapsed, fps, config: { stiffness: 60, damping: 22 } });

    // 扩散角度
    const angle = (seed % 360) * (Math.PI / 180);
    // 溶解：粒子从中心扩散，然后淡出
    const spreadDist = prog * 160;
    const px = 960 + Math.cos(angle) * spreadDist;
    const py = 490 + Math.sin(angle) * spreadDist * 0.5;
    // 溶解后淡出
    const dissolveStart = delay + 50;
    const alpha = Math.max(0, 1 - Math.max(0, frame - dissolveStart) / 60);
    const particleR = Math.max(1.5, 9 - prog * 6);

    return { px, py, alpha, r: particleR, prog };
  });

  // 水分子（小蓝点，背景）
  const waterMols = Array.from({ length: 50 }, (_, i) => {
    const t = (frame * 0.8 + i * 23) / fps;
    const wx = 650 + (i % 8) * 80 + Math.sin(t + i) * 15;
    const wy = 320 + Math.floor(i / 8) * 60 + Math.cos(t * 0.7 + i * 0.5) * 10;
    return { wx, wy, a: 0.2 + (i % 3) * 0.1 };
  });

  // 文字说明淡入
  const captionOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🔬 微观溶解过程</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>食盐粒子如何消失在水中？</div>
      </div>

      {/* 烧杯SVG */}
      <svg style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 500, opacity: cupOp,
      }} viewBox="0 0 600 500">
        {/* 杯体 */}
        <path d="M100,60 L80,430 L520,430 L500,60" fill="none"
          stroke="rgba(56,189,248,0.7)" strokeWidth="4" />
        {/* 水 */}
        <rect x="83" y="100" width="434" height="325"
          fill="rgba(14,165,233,0.22)" rx="2" />
        {/* 水面高光 */}
        <ellipse cx="300" cy="100" rx="215" ry="8"
          fill="rgba(56,189,248,0.3)" />

        {/* 水分子 */}
        {waterMols.map((m, i) => (
          <circle key={i} cx={m.wx - 660} cy={m.wy - 280}
            r="5" fill={C.water} opacity={m.a} />
        ))}

        {/* 盐粒子 */}
        {particles.map((p, i) => (
          <g key={i} opacity={p.alpha}>
            <rect
              x={p.px - 660 - p.r} y={p.py - 280 - p.r}
              width={p.r * 2} height={p.r * 2}
              rx={p.r * 0.3}
              fill={C.salt}
            />
          </g>
        ))}

        {/* 溶解后的离子效果（小蓝点扩散） */}
        {frame > 80 && Array.from({ length: 20 }, (_, i) => {
          const t2 = (frame - 80) / 60;
          const a2 = (i * 131) % 360 * Math.PI / 180;
          const r2 = Math.min(t2 * 180, 180);
          const xi = 300 + Math.cos(a2) * r2;
          const yi = 260 + Math.sin(a2) * r2 * 0.5;
          const a3 = Math.max(0, 1 - (frame - 80) / 120) * 0.7;
          if (xi < 85 || xi > 515 || yi < 100 || yi > 425) return null;
          return <circle key={i} cx={xi} cy={yi} r={3} fill={C.primary} opacity={a3} />;
        })}

        {/* 杯口刻度 */}
        {[200, 300, 400].map((y, i) => (
          <g key={i}>
            <line x1="84" y1={y} x2="100" y2={y} stroke={C.muted} strokeWidth="2" opacity="0.5" />
            <text x="60" y={y + 5} fill={C.muted} fontSize="18" fontFamily="'PingFang SC',sans-serif" opacity="0.5">
              {300 - i * 100}ml
            </text>
          </g>
        ))}
      </svg>

      {/* 文字说明 */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        textAlign: "center", opacity: captionOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 32, color: C.primary, fontWeight: 700 }}>
          食盐粒子分散成极小的离子，均匀融入水中
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>
          💡 溶解≠消失 · 盐还在水里 · 只是眼睛看不见了
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景3：三种加速因素 ─────────────────────────────
const FactorsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const factors = [
    {
      icon: "🌡️", name: "温度", color: "#f87171",
      desc: "热水分子运动更快\n与溶质碰撞更频繁",
      detail: "热水 > 冷水",
      delay: 20,
    },
    {
      icon: "🔄", name: "搅拌", color: "#38bdf8",
      desc: "搅拌增大接触机会\n新鲜溶剂不断补充",
      detail: "搅拌 > 静置",
      delay: 45,
    },
    {
      icon: "🔨", name: "研碎", color: "#34d399",
      desc: "颗粒越小接触面积越大\n溶解速度越快",
      detail: "粉末 > 整块",
      delay: 70,
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>⚡ 三种加快溶解的方法</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>控制变量实验 · 一次只改变一个因素</div>
      </div>

      <div style={{
        position: "absolute", top: 175, left: 80, right: 80,
        display: "flex", gap: 48, alignItems: "stretch",
      }}>
        {factors.map((f, i) => {
          const prog = spring({ frame: frame - f.delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.6 + 0.4 * Math.min(prog, 1);

          return (
            <div key={f.name} style={{
              flex: 1,
              background: `${f.color}0f`,
              border: `2px solid ${f.color}66`,
              borderRadius: 24,
              padding: "36px 28px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
            }}>
              <div style={{ fontSize: 90, marginBottom: 20 }}>{f.icon}</div>
              <div style={{
                fontSize: 46, fontWeight: 900, color: f.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 16,
              }}>{f.name}</div>
              <div style={{
                fontSize: 26, color: "#e2e8f0", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6,
                whiteSpace: "pre-line", marginBottom: 20,
              }}>{f.desc}</div>
              <div style={{
                padding: "10px 22px", borderRadius: 99,
                background: `${f.color}20`, border: `1px solid ${f.color}44`,
                color: f.color, fontSize: 24, fontWeight: 700,
                fontFamily: "'PingFang SC',sans-serif",
              }}>{f.detail}</div>
            </div>
          );
        })}
      </div>

      {/* 底部对照实验提示 */}
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-flex", gap: 16, padding: "14px 32px",
          background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.3)",
          borderRadius: 12,
        }}>
          <span style={{ color: C.accent, fontSize: 28, fontWeight: 700 }}>🧪 控制变量法：</span>
          <span style={{ color: "#e2e8f0", fontSize: 26 }}>每次只改变一个因素，其余保持不变</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景4：溶液特征 ────────────────────────────────
const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const features = [
    {
      icon: "⚖️", name: "均匀", color: C.primary,
      desc: "各处浓度完全相同\n上下左右一样咸",
      delay: 15,
    },
    {
      icon: "🏛️", name: "稳定", color: C.secondary,
      desc: "静置很久不会分层\n不会出现沉淀",
      delay: 40,
    },
    {
      icon: "🔍", name: "透明", color: C.accent,
      desc: "能看穿（可透光）\n不一定是无色的",
      delay: 65,
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌊 溶液的三大特征</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>记住"均稳透"——溶液三字诀！</div>
      </div>

      {/* 三大特征卡片 */}
      <div style={{
        position: "absolute", top: 175, left: 80, right: 80,
        display: "flex", gap: 48,
      }}>
        {features.map((f) => {
          const prog = spring({ frame: frame - f.delay, fps, config: { stiffness: 85, damping: 18 } });
          return (
            <div key={f.name} style={{
              flex: 1, background: `${f.color}0f`,
              border: `2px solid ${f.color}55`,
              borderRadius: 24, padding: "36px 28px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: Math.min(prog, 1),
              transform: `translateY(${(1 - Math.min(prog, 1)) * 30}px)`,
            }}>
              <div style={{ fontSize: 90, marginBottom: 20 }}>{f.icon}</div>
              <div style={{
                fontSize: 52, fontWeight: 900, color: f.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 16,
              }}>{f.name}</div>
              <div style={{
                fontSize: 26, color: "#e2e8f0", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.65,
                whiteSpace: "pre-line",
              }}>{f.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 对比：溶液 vs 悬浊液 */}
      <div style={{
        position: "absolute", bottom: 50, left: 80, right: 80,
        display: "flex", gap: 32,
        opacity: interpolate(frame, [100, 118], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          flex: 1, background: "rgba(52,211,153,.1)",
          border: "1px solid rgba(52,211,153,.3)", borderRadius: 14,
          padding: "16px 22px",
        }}>
          <span style={{ color: C.secondary, fontWeight: 700, fontSize: 28 }}>✅ 溶液：</span>
          <span style={{ color: "#cbd5e1", fontSize: 26 }}>盐水、糖水（均匀透明）</span>
        </div>
        <div style={{
          flex: 1, background: "rgba(248,113,113,.1)",
          border: "1px solid rgba(248,113,113,.3)", borderRadius: 14,
          padding: "16px 22px",
        }}>
          <span style={{ color: C.danger, fontWeight: 700, fontSize: 28 }}>❌ 浊液：</span>
          <span style={{ color: "#cbd5e1", fontSize: 26 }}>沙水、泥水（浑浊沉淀）</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 场景5：蒸发回收 ────────────────────────────────
const EvaporateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 水蒸发粒子
  const steamParticles = Array.from({ length: 25 }, (_, i) => {
    const t = (frame * 1.2 + i * 24) % 180;
    const x = 880 + (i % 5) * 70 - 140 + Math.sin(t * 0.05 + i) * 20;
    const y = 580 - t * 2;
    const a = Math.sin(t / 180 * Math.PI) * 0.6;
    return { x, y, a };
  });

  // 盐晶体生长
  const saltGrowProg = interpolate(frame, [40, 120], [0, 1], { extrapolateRight: "clamp" });

  // 步骤
  const steps = [
    { icon: "🧂", label: "食盐水", color: C.primary, delay: 15 },
    { icon: "🔥", label: "加热蒸发", color: "#f87171", delay: 35 },
    { icon: "💨", label: "水分蒸发", color: C.muted, delay: 55 },
    { icon: "🧂", label: "盐晶留下", color: C.accent, delay: 75 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🔁 蒸发——把盐取回来！</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>溶质分离原理 · 海边盐田的秘密</div>
      </div>

      {/* 步骤流程 */}
      <div style={{
        position: "absolute", top: 170, left: 80, right: 80,
        display: "flex", alignItems: "center", justifyContent: "space-around",
      }}>
        {steps.map((s, i) => {
          const prog = spring({ frame: frame - s.delay, fps, config: { stiffness: 90, damping: 18 } });
          return (
            <React.Fragment key={s.label}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                opacity: Math.min(prog, 1),
                transform: `scale(${0.6 + 0.4 * Math.min(prog, 1)})`,
              }}>
                <div style={{
                  width: 150, height: 150, borderRadius: 24,
                  background: `${s.color}15`,
                  border: `3px solid ${s.color}66`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 72, marginBottom: 18,
                  boxShadow: `0 0 30px ${s.color}33`,
                }}>{s.icon}</div>
                <div style={{
                  fontSize: 28, fontWeight: 700, color: s.color,
                  fontFamily: "'PingFang SC',sans-serif",
                }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  fontSize: 44, color: C.muted,
                  opacity: interpolate(frame, [s.delay + 20, s.delay + 35], [0, 1], { extrapolateRight: "clamp" }),
                  marginBottom: 50,
                }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 蒸发动画 */}
      <svg style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-30%)", width: 400, height: 300 }} viewBox="0 0 400 300">
        {/* 蒸发盘 */}
        <ellipse cx="200" cy="230" rx="150" ry="25" fill="rgba(56,189,248,.2)" stroke="rgba(56,189,248,.5)" strokeWidth="2" />
        {/* 盐水 */}
        <ellipse cx="200" cy="225"
          rx={150 - saltGrowProg * 30}
          ry={15 + saltGrowProg * 5}
          fill={`rgba(14,165,233,${0.35 - saltGrowProg * 0.25})`} />
        {/* 盐晶 */}
        {saltGrowProg > 0.3 && Array.from({ length: 12 }, (_, i) => {
          const cx2 = 120 + (i % 4) * 40 + Math.sin(i) * 10;
          const cy2 = 200 + Math.floor(i / 4) * 12;
          const sz = 6 * saltGrowProg;
          return <rect key={i} x={cx2 - sz} y={cy2 - sz} width={sz * 2} height={sz * 2}
            fill={C.salt} opacity={saltGrowProg * 0.9} />;
        })}
        {/* 水蒸气 */}
        {steamParticles.map((p, i) => (
          p.y > 0 && p.y < 250 ? (
            <circle key={i} cx={p.x - 760} cy={p.y - 300} r="6"
              fill={C.water} opacity={p.a} />
          ) : null
        ))}
        {/* 火焰 */}
        {frame > 20 && (
          <>
            <ellipse cx="200" cy="258" rx="30" ry="8" fill="#f97316" opacity="0.7" />
            <ellipse cx="200" cy="248" rx="18" ry="6" fill="#fbbf24" opacity="0.9" />
          </>
        )}
      </svg>

      {/* 盐田科普 */}
      <div style={{
        position: "absolute", bottom: 48, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: C.accent, fontWeight: 700 }}>
          🌊 海边盐田 = 大自然的蒸发实验室！
        </div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
          阳光 + 风 → 海水蒸发 → 留下食盐
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 主 Composition ───────────────────────────────────
export const DissolvingVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      {/* 场景1：标题 0-120 */}
      <Sequence from={0} durationInFrames={120}>
        <TitleScene />
      </Sequence>
      {/* 场景2：溶解粒子动画 120-270 */}
      <Sequence from={120} durationInFrames={150}>
        <DissolveScene />
      </Sequence>
      {/* 场景3：三种影响因素 270-420 */}
      <Sequence from={270} durationInFrames={150}>
        <FactorsScene />
      </Sequence>
      {/* 场景4：溶液特征 420-540 */}
      <Sequence from={420} durationInFrames={120}>
        <SolutionScene />
      </Sequence>
      {/* 场景5：蒸发回收 540-660 */}
      <Sequence from={540} durationInFrames={120}>
        <EvaporateScene />
      </Sequence>
    </AbsoluteFill>
  );
};
