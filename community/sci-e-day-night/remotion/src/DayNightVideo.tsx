import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#030b1a",
  bg2: "#071428",
  text: "#f0f9ff",
  muted: "#94a3b8",
  sky: "#38bdf8",
  sun: "#fbbf24",
  sunGlow: "#f59e0b",
  night: "#1e3a5f",
  day: "#fed7aa",
  earth: "#22c55e",
  earthDark: "#166534",
  shadow: "#0f172a",
  accent: "#a78bfa",
  timezone: "#34d399",
};

// ── 工具: 绘制地球（带光影）─────────────────────────────
const EarthGlobe: React.FC<{
  cx: number; cy: number; r: number;
  rotationAngle: number; // 0~360度，控制昼夜分界
  showAxis?: boolean;
  showArrow?: boolean;
}> = ({ cx, cy, r, rotationAngle, showAxis = false, showArrow = false }) => {
  // terminator x offset: +r = full day, -r = full night
  const terminatorX = cx + Math.cos((rotationAngle * Math.PI) / 180) * r;
  const isLeftDay = rotationAngle < 90 || rotationAngle > 270;

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}
      viewBox={`0 0 1920 1080`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`earthGrad_${cx}`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </radialGradient>
        <radialGradient id={`dayGrad_${cx}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(254,215,170,0.5)" />
          <stop offset="100%" stopColor="rgba(254,215,170,0)" />
        </radialGradient>
        <radialGradient id={`nightGrad_${cx}`} cx="70%" cy="65%" r="70%">
          <stop offset="0%" stopColor="rgba(15,23,42,0.85)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
        <clipPath id={`clip_${cx}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <linearGradient id={`termGrad_${cx}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(15,23,42,0.0)" />
          <stop offset="45%" stopColor="rgba(15,23,42,0.0)" />
          <stop offset="50%" stopColor="rgba(15,23,42,0.75)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.75)" />
        </linearGradient>
        <radialGradient id={`gloss_${cx}`} cx="38%" cy="28%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* 地球底色 */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#earthGrad_${cx})`} />

      {/* 大陆轮廓 (简化) */}
      <g clipPath={`url(#clip_${cx})`} transform={`rotate(${rotationAngle}, ${cx}, ${cy})`}>
        {/* 亚欧大陆 */}
        <ellipse cx={cx + r * 0.1} cy={cy - r * 0.2} rx={r * 0.35} ry={r * 0.2} fill="#16a34a" opacity="0.7" />
        {/* 北美 */}
        <ellipse cx={cx - r * 0.45} cy={cy - r * 0.15} rx={r * 0.22} ry={r * 0.25} fill="#16a34a" opacity="0.7" />
        {/* 南美 */}
        <ellipse cx={cx - r * 0.38} cy={cy + r * 0.3} rx={r * 0.14} ry={r * 0.22} fill="#16a34a" opacity="0.65" />
        {/* 非洲 */}
        <ellipse cx={cx + r * 0.05} cy={cy + r * 0.25} rx={r * 0.16} ry={r * 0.28} fill="#16a34a" opacity="0.7" />
        {/* 澳洲 */}
        <ellipse cx={cx + r * 0.42} cy={cy + r * 0.3} rx={r * 0.13} ry={r * 0.1} fill="#16a34a" opacity="0.65" />
        {/* 南极 */}
        <ellipse cx={cx} cy={cy + r * 0.82} rx={r * 0.35} ry={r * 0.12} fill="#e2e8f0" opacity="0.6" />
        {/* 北极 */}
        <ellipse cx={cx} cy={cy - r * 0.85} rx={r * 0.3} ry={r * 0.1} fill="#e2e8f0" opacity="0.5" />
      </g>

      {/* 夜面遮罩（terminator） */}
      <g clipPath={`url(#clip_${cx})`}>
        <rect
          x={cx}
          y={cy - r}
          width={r}
          height={r * 2}
          fill="rgba(7,20,40,0.80)"
          transform={`rotate(${rotationAngle}, ${cx}, ${cy})`}
        />
        {/* 渐变终结带 */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={r * 0.08}
          ry={r}
          fill="rgba(7,20,40,0.0)"
          style={{ filter: "blur(18px)" }}
          transform={`rotate(${rotationAngle}, ${cx}, ${cy})`}
        />
      </g>

      {/* 大气光晕（白天侧） */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#dayGrad_${cx})`} clipPath={`url(#clip_${cx})`} />

      {/* 镜面光泽 */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#gloss_${cx})`} />

      {/* 大气层 */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r + 18} fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="10" />

      {/* 夜晚星星 */}
      {[
        [cx + r * 1.3, cy - r * 0.6],
        [cx + r * 1.5, cy + r * 0.2],
        [cx + r * 1.2, cy + r * 0.7],
        [cx - r * 1.4, cy - r * 0.5],
        [cx - r * 1.6, cy + r * 0.1],
        [cx - r * 1.2, cy + r * 0.65],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={3} fill="white" opacity={0.7 + (i % 3) * 0.1} />
      ))}

      {/* 地轴 */}
      {showAxis && (
        <>
          <line
            x1={cx - 15} y1={cy - r - 40}
            x2={cx + 15} y2={cy + r + 40}
            stroke="rgba(248,250,252,0.6)" strokeWidth="2" strokeDasharray="8,6"
          />
          <text x={cx + 20} y={cy - r - 35} fill="#cbd5e1" fontSize="22"
            fontFamily="'PingFang SC',sans-serif">地轴</text>
        </>
      )}

      {/* 自转方向箭头 */}
      {showArrow && (
        <g>
          <path
            d={`M ${cx + r + 20},${cy - 60} A ${r + 20},${r + 20} 0 0,1 ${cx + r + 20},${cy + 60}`}
            fill="none" stroke={C.sky} strokeWidth="4" strokeDasharray="none"
            markerEnd="url(#arrowBlue)"
          />
          <defs>
            <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,0 L0,10 L10,5 z" fill={C.sky} />
            </marker>
          </defs>
          <text x={cx + r + 35} y={cy + 90} fill={C.sky} fontSize="24"
            fontFamily="'PingFang SC',sans-serif">自西向东</text>
        </g>
      )}
    </svg>
  );
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 22], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const earthRot = interpolate(frame, [0, 90], [0, 45], { extrapolateRight: "clamp" });
  const sunScale = spring({ frame: frame - 5, fps, config: { stiffness: 100, damping: 16 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 65% 30%, rgba(251,191,36,.18) 0%, transparent 55%),
                   radial-gradient(ellipse at 20% 75%, rgba(56,189,248,.12) 0%, transparent 50%),
                   ${C.bg}`,
      overflow: "hidden",
    }}>
      {/* 太阳 */}
      <div style={{
        position: "absolute", right: 200, top: 120,
        width: 160, height: 160,
        background: "radial-gradient(circle, #fde68a 30%, #f59e0b 70%, rgba(245,158,11,0) 100%)",
        borderRadius: "50%",
        transform: `scale(${Math.min(sunScale, 1)})`,
        boxShadow: "0 0 80px 30px rgba(251,191,36,0.3)",
      }} />

      {/* 地球 */}
      <EarthGlobe cx={1450} cy={540} r={280} rotationAngle={earthRot} showAxis />

      {/* 文字区 */}
      <div style={{
        position: "absolute", left: 100, top: "50%",
        transform: `translateY(calc(-50% + ${titleY}px))`,
        opacity: titleOp,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
      }}>
        <div style={{
          fontSize: 96, fontWeight: 900, color: "#fff",
          background: "linear-gradient(135deg,#fff 20%,#38bdf8 80%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.15,
        }}>昼夜变化</div>
        <div style={{
          fontSize: 96, fontWeight: 900, color: "#fff",
          background: "linear-gradient(135deg,#38bdf8 20%,#fbbf24 80%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.15,
        }}>与地球自转</div>
        <div style={{ marginTop: 24, fontSize: 38, color: C.muted, opacity: subOp }}>
          小学科学 G3 · 地球与宇宙科学
        </div>
        <div style={{
          marginTop: 36, display: "flex", gap: 20, opacity: tagOp,
        }}>
          {["🌍 地球自转", "☀️ 昼夜成因", "🕐 时区换算"].map((t, i) => (
            <div key={i} style={{
              padding: "12px 28px", borderRadius: 99,
              background: "rgba(56,189,248,.15)",
              border: "1px solid rgba(56,189,248,.4)",
              color: C.sky, fontSize: 28,
            }}>{t}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：地球自转动画 ─────────────────────────────────
const RotationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  // 地球持续自转，150帧转2圈
  const earthRot = interpolate(frame, [0, 150], [0, 720], { extrapolateRight: "clamp" });

  const info1Op = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const info2Op = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const info3Op = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const info4Op = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });

  // 陀螺跳动
  const topScale = spring({ frame: frame - 25, fps, config: { stiffness: 120, damping: 14 } });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>🌍 地球自转</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>绕地轴从西向东旋转 · 24小时一圈</div>
      </div>

      {/* 地球在中间 */}
      <EarthGlobe cx={960} cy={580} r={260} rotationAngle={earthRot % 360} showAxis showArrow />

      {/* 信息卡片：左侧 */}
      <div style={{
        position: "absolute", left: 60, top: 160,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {[
          { op: info1Op, icon: "🔄", title: "旋转方向", desc: "从西向东\n（逆时针）", color: C.sky },
          { op: info2Op, icon: "⏱️", title: "旋转周期", desc: "24小时\n= 1天", color: C.sun },
        ].map((item, i) => (
          <div key={i} style={{
            opacity: item.op,
            background: "rgba(15,28,56,0.85)",
            border: `2px solid ${item.color}44`,
            borderRadius: 16, padding: "20px 24px",
            width: 260,
            fontFamily: "'PingFang SC',sans-serif",
          }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: item.color }}>{item.title}</div>
            <div style={{ fontSize: 26, color: "#e2e8f0", marginTop: 8, lineHeight: 1.5, whiteSpace: "pre-line" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 信息卡片：右侧 */}
      <div style={{
        position: "absolute", right: 60, top: 160,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {[
          { op: info3Op, icon: "🌏", title: "旋转轴", desc: "地轴（北极→南极）\n略微倾斜", color: C.accent },
          { op: info4Op, icon: "🌡️", title: "速度", desc: "赤道约1670 km/h\n我们感觉不到！", color: C.timezone },
        ].map((item, i) => (
          <div key={i} style={{
            opacity: item.op,
            background: "rgba(15,28,56,0.85)",
            border: `2px solid ${item.color}44`,
            borderRadius: 16, padding: "20px 24px",
            width: 280,
            fontFamily: "'PingFang SC',sans-serif",
          }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: item.color }}>{item.title}</div>
            <div style={{ fontSize: 26, color: "#e2e8f0", marginTop: 8, lineHeight: 1.5, whiteSpace: "pre-line" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 底部陀螺类比 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [120, 145], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 30, color: "#a5f3fc" }}>
          💡 地球像一个陀螺，绕地轴不停旋转，才产生了昼夜交替！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：昼夜形成原理 ─────────────────────────────────
const DayNightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  // 地球缓慢旋转，展示昼夜交替
  const earthRot = interpolate(frame, [0, 150], [30, 390], { extrapolateRight: "clamp" });

  const step1Op = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const step2Op = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const step3Op = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });

  // 太阳光线脉动
  const rayPulse = 0.85 + 0.15 * Math.sin((frame / 15) * Math.PI);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 46, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>☀️ 昼夜形成原理</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>地球是不透明球体 · 太阳只能照亮一半</div>
      </div>

      {/* SVG：太阳 + 光线 + 地球 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
        <defs>
          <radialGradient id="sunRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="rgba(245,158,11,0)" />
          </radialGradient>
          <radialGradient id="rayGrad" cx="0%" cy="50%" r="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.5)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
        </defs>
        {/* 太阳 */}
        <circle cx={260} cy={540} r={110} fill="url(#sunRadial)"
          style={{ filter: `brightness(${rayPulse})` }} />
        <circle cx={260} cy={540} r={145} fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="14" />
        <circle cx={260} cy={540} r={175} fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="20" />

        {/* 太阳标签 */}
        <text x={260} y={695} textAnchor="middle" fill="#fbbf24"
          fontSize="30" fontFamily="'PingFang SC',sans-serif" fontWeight="700">☀️ 太阳</text>
        <text x={260} y={730} textAnchor="middle" fill="#94a3b8"
          fontSize="22" fontFamily="'PingFang SC',sans-serif">恒星·光源</text>

        {/* 光线 */}
        {[-120, -60, 0, 60, 120].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 380, y1 = 540 + Math.tan(rad) * 120;
          return (
            <line key={i}
              x1={x1} y1={y1}
              x2={1020} y2={540 + Math.tan(rad) * (1020 - x1)}
              stroke="rgba(251,191,36,0.35)" strokeWidth="3"
              opacity={rayPulse}
            />
          );
        })}

        {/* 光锥填充 */}
        <path
          d={`M 380,400 L 1050,280 L 1050,800 L 380,680 Z`}
          fill="rgba(251,191,36,0.06)"
        />
      </svg>

      {/* 地球 */}
      <EarthGlobe cx={1100} cy={540} r={270} rotationAngle={earthRot % 360} showAxis />

      {/* 文字标注 */}
      <div style={{
        position: "absolute", right: 60, top: 160,
        display: "flex", flexDirection: "column", gap: 18,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { op: step1Op, icon: "☀️", label: "白天（昼）", desc: "朝向太阳的一面\n受到阳光照射", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
          { op: step2Op, icon: "🌙", label: "夜晚（夜）", desc: "背对太阳的一面\n照不到光，所以黑暗", color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
          { op: step3Op, icon: "🔄", label: "昼夜交替", desc: "地球自转→\n昼夜不断交替出现", color: C.timezone, bg: "rgba(52,211,153,0.1)" },
        ].map((item, i) => (
          <div key={i} style={{
            opacity: item.op,
            background: item.bg,
            border: `2px solid ${item.color}55`,
            borderRadius: 14, padding: "16px 22px",
            width: 300,
          }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: 24, color: "#e2e8f0", marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-line" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 底部结论 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [120, 145], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block", padding: "14px 40px",
          background: "rgba(56,189,248,0.15)", borderRadius: 12,
          border: "1px solid rgba(56,189,248,0.4)",
          fontSize: 30, color: C.sky,
        }}>
          💡 昼夜成因 = 地球不透明 + 地球自转
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：太阳东升西落 ─────────────────────────────────
const SunriseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 太阳路径动画：从左(东)到右(西)弧形运动
  const sunProgress = interpolate(frame, [20, 130], [0, 1], { extrapolateRight: "clamp" });
  const sunX = interpolate(sunProgress, [0, 1], [260, 1660]);
  const sunY = 680 - Math.sin(sunProgress * Math.PI) * 480;
  const sunOp = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  const info1Op = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const info2Op = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const info3Op = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  const trainOp = interpolate(frame, [105, 125], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 天空渐变 */}
      <div style={{
        position: "absolute", inset: 0,
        background: sunProgress < 0.5
          ? `linear-gradient(to bottom, rgba(30,58,95,${sunProgress}) 0%, rgba(7,20,40,1) 100%)`
          : `linear-gradient(to bottom, rgba(56,189,248,${0.3 * (1 - sunProgress * 1.5)}) 0%, rgba(7,20,40,1) 100%)`,
      }} />

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 46, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌅 太阳东升西落</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>其实是地球自西向东转造成的视觉效果</div>
      </div>

      {/* 太阳 */}
      <div style={{
        position: "absolute",
        left: sunX - 55,
        top: sunY - 55,
        width: 110, height: 110,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fde68a 30%, #f59e0b 80%, rgba(245,158,11,0) 100%)",
        boxShadow: "0 0 60px 20px rgba(251,191,36,0.4)",
        opacity: sunOp,
      }} />

      {/* 太阳轨迹虚线 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
        <path
          d={`M 260,680 Q 960,${680 - 480} 1660,680`}
          fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="3" strokeDasharray="12,10"
          opacity={sunOp}
        />
        {/* 地平线 */}
        <line x1={80} y1={680} x2={1840} y2={680}
          stroke="rgba(56,189,248,0.3)" strokeWidth="2" />

        {/* 东 标签 */}
        <text x={220} y={720} fill="#34d399" fontSize="32"
          fontFamily="'PingFang SC',sans-serif" fontWeight="700">东 East</text>
        <text x={220} y={756} fill="#94a3b8" fontSize="22"
          fontFamily="'PingFang SC',sans-serif">日出方向</text>

        {/* 西 标签 */}
        <text x={1570} y={720} fill="#f472b6" fontSize="32"
          fontFamily="'PingFang SC',sans-serif" fontWeight="700">西 West</text>
        <text x={1570} y={756} fill="#94a3b8" fontSize="22"
          fontFamily="'PingFang SC',sans-serif">日落方向</text>

        {/* 地球旋转方向箭头 */}
        <text x={860} y={820} fill="#38bdf8" fontSize="28"
          fontFamily="'PingFang SC',sans-serif"
          opacity={interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" })}>
          🌍 地球自西→东旋转，所以我们"看到"太阳东升西落
        </text>
      </svg>

      {/* 信息卡 */}
      <div style={{
        position: "absolute", left: 60, top: 160,
        display: "flex", flexDirection: "column", gap: 18,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {[
          { op: info1Op, title: "①  地球自西向东转", desc: "地轴旋转方向确定", color: C.sky },
          { op: info2Op, title: "②  我们站在地球上", desc: "相对参照系产生偏差", color: C.sun },
          { op: info3Op, title: "③  感觉太阳在移动", desc: "其实是我们在转！", color: C.timezone },
        ].map((item, i) => (
          <div key={i} style={{
            opacity: item.op,
            background: "rgba(15,28,56,0.88)",
            border: `2px solid ${item.color}44`,
            borderRadius: 14, padding: "16px 22px",
            width: 340,
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 23, color: "#e2e8f0" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 类比：火车 */}
      <div style={{
        position: "absolute", right: 60, bottom: 80,
        opacity: trainOp, fontFamily: "'PingFang SC',sans-serif",
        background: "rgba(167,139,250,0.1)", border: "2px solid rgba(167,139,250,0.4)",
        borderRadius: 16, padding: "20px 28px", width: 480,
      }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.accent, marginBottom: 10 }}>🚆 火车类比</div>
        <div style={{ fontSize: 24, color: "#e2e8f0", lineHeight: 1.6 }}>
          坐在向前开的火车上<br />
          窗外的树看起来往后走<br />
          <span style={{ color: C.accent, fontWeight: 700 }}>→ 参照物！地球自转=火车前进</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：时区地图 ─────────────────────────────────────
const TimezoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const mapOp = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });

  // 时区卡片动画
  const zones = [
    { name: "东八区\n北京时间", emoji: "🏯", utc: "UTC+8", city: "北京 12:00", color: "#f59e0b", delay: 40 },
    { name: "零时区\n格林威治", emoji: "🗼", utc: "UTC+0", city: "伦敦 04:00", color: "#38bdf8", delay: 60 },
    { name: "西五区\n美国东部", emoji: "🗽", utc: "UTC-5", city: "纽约 23:00", color: "#f472b6", delay: 80 },
  ];

  const earthRot = interpolate(frame, [20, 120], [0, 120], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 46, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🕐 时区与时间换算</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>地球分24个时区 · 相邻差1小时</div>
      </div>

      {/* 简化时区带 */}
      <svg style={{ position: "absolute", inset: 0, opacity: mapOp }} viewBox="0 0 1920 1080">
        {/* 时区条带背景 */}
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i}
            x={80 + i * 73.5}
            y={150}
            width={73}
            height={500}
            fill={i % 2 === 0 ? "rgba(56,189,248,0.06)" : "rgba(167,139,250,0.04)"}
            stroke="rgba(56,189,248,0.12)"
            strokeWidth={0.5}
          />
        ))}

        {/* 时区标注 */}
        {[-12, -8, -5, 0, 5, 8, 12].map((utc, i) => {
          const x = 80 + (utc + 12) * 73.5 + 36;
          return (
            <text key={i} x={x} y={148} textAnchor="middle"
              fill="rgba(148,163,184,0.8)" fontSize="18"
              fontFamily="'PingFang SC',sans-serif">
              {utc >= 0 ? `+${utc}` : utc}
            </text>
          );
        })}

        {/* 高亮：北京 UTC+8 */}
        <rect x={80 + 20 * 73.5} y={150} width={73} height={500}
          fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth="2" rx="4" />
        <text x={80 + 20 * 73.5 + 36} y={200} textAnchor="middle"
          fill="#f59e0b" fontSize="22" fontFamily="'PingFang SC',sans-serif" fontWeight="700">北京</text>
        <text x={80 + 20 * 73.5 + 36} y={228} textAnchor="middle"
          fill="#f59e0b" fontSize="18" fontFamily="'PingFang SC',sans-serif">UTC+8</text>

        {/* 高亮：伦敦 UTC+0 */}
        <rect x={80 + 12 * 73.5} y={150} width={73} height={500}
          fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="2" rx="4" />
        <text x={80 + 12 * 73.5 + 36} y={200} textAnchor="middle"
          fill="#38bdf8" fontSize="22" fontFamily="'PingFang SC',sans-serif" fontWeight="700">伦敦</text>
        <text x={80 + 12 * 73.5 + 36} y={228} textAnchor="middle"
          fill="#38bdf8" fontSize="18" fontFamily="'PingFang SC',sans-serif">UTC+0</text>

        {/* 高亮：纽约 UTC-5 */}
        <rect x={80 + 7 * 73.5} y={150} width={73} height={500}
          fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="2" rx="4" />
        <text x={80 + 7 * 73.5 + 36} y={200} textAnchor="middle"
          fill="#f472b6" fontSize="22" fontFamily="'PingFang SC',sans-serif" fontWeight="700">纽约</text>
        <text x={80 + 7 * 73.5 + 36} y={228} textAnchor="middle"
          fill="#f472b6" fontSize="18" fontFamily="'PingFang SC',sans-serif">UTC-5</text>

        {/* 差值标注 */}
        <path d={`M ${80 + 12 * 73.5 + 36},680 L ${80 + 20 * 73.5 + 36},680`}
          stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arr)" />
        <text x={80 + 16 * 73.5} y={708} textAnchor="middle"
          fill="#fbbf24" fontSize="24" fontFamily="'PingFang SC',sans-serif" fontWeight="700">
          北京比伦敦快8小时
        </text>
      </svg>

      {/* 时区卡片 */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 32,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {zones.map((z, i) => {
          const op = interpolate(frame, [z.delay, z.delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [z.delay, z.delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              opacity: op, transform: `translateY(${y}px)`,
              background: `rgba(15,28,56,0.92)`,
              border: `2px solid ${z.color}55`,
              borderRadius: 18, padding: "20px 28px",
              minWidth: 240, textAlign: "center",
            }}>
              <div style={{ fontSize: 48 }}>{z.emoji}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: z.color, whiteSpace: "pre-line", marginTop: 8 }}>{z.name}</div>
              <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 4 }}>{z.utc}</div>
              <div style={{ fontSize: 28, color: "#f0f9ff", marginTop: 8, fontWeight: 700 }}>{z.city}</div>
            </div>
          );
        })}
      </div>

      {/* 结论 */}
      <div style={{
        position: "absolute", bottom: 20, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 27, color: C.timezone,
      }}>
        🌏 当中国是正午12点，美国纽约是前一天晚上23点 · 跨洋电话要注意时差！
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const DayNightVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      {/* 5场景：90+120+150+150+150=660帧 */}
      <Sequence from={0} durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90} durationInFrames={120}><RotationScene /></Sequence>
      <Sequence from={210} durationInFrames={150}><DayNightScene /></Sequence>
      <Sequence from={360} durationInFrames={150}><SunriseScene /></Sequence>
      <Sequence from={510} durationInFrames={150}><TimezoneScene /></Sequence>
    </AbsoluteFill>
  );
};
