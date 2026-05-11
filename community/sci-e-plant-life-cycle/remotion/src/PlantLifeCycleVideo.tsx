import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0d1f0e",
  bg2: "#152917",
  text: "#f0fdf4",
  muted: "#86efac",
  seed: "#92400e",
  seedLight: "#fbbf24",
  root: "#a16207",
  stem: "#16a34a",
  leaf: "#22c55e",
  flower: "#f472b6",
  fruit: "#ef4444",
  sky: "#38bdf8",
  soil: "#92400e",
  soilLight: "#b45309",
};

// ── 工具函数 ─────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// ── 场景1：标题 ─────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const seedScale = spring({ frame: frame - 30, fps, config: { stiffness: 100, damping: 12 } });
  const tagsOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [45, 65], [20, 0], { extrapolateRight: "clamp" });

  const tags = ["🌱 种子萌发", "🌿 幼苗生长", "🌸 开花传粉", "🍎 结果传播"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 20%, rgba(34,197,94,.25) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 背景粒子 */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 83 + 7) % 100}%`,
          top: `${(i * 67 + 15) % 80}%`,
          width: 8, height: 8, borderRadius: "50%",
          background: C.leaf,
          opacity: 0.15 + (i % 3) * 0.1,
        }} />
      ))}

      <div style={{
        fontSize: 120,
        transform: `scale(${Math.min(seedScale, 1.2)})`,
        marginBottom: 24,
        filter: "drop-shadow(0 0 30px rgba(34,197,94,.5))",
      }}>🌱</div>

      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 20%,#4ade80 80%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        lineHeight: 1.1,
      }}>植物的一生</div>

      <div style={{
        marginTop: 16, fontSize: 38, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        letterSpacing: 2,
      }}>种子到果实 · 小学科学 G3 · 生命科学</div>

      <div style={{
        marginTop: 48, display: "flex", gap: 24,
        opacity: tagsOp, transform: `translateY(${tagY}px)`,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {tags.map((t, i) => (
          <div key={i} style={{
            padding: "14px 32px", borderRadius: 99,
            background: "rgba(34,197,94,.12)",
            border: "1.5px solid rgba(34,197,94,.4)",
            color: "#86efac", fontSize: 28, fontWeight: 600,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：种子萌发动画 ─────────────────────────────
const GerminationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 土壤和种子
  const soilY = 650;
  const seedVisible = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });

  // 根生长（向下）
  const rootLen = interpolate(frame, [25, 70], [0, 120], { extrapolateRight: "clamp" });
  const root2Len = interpolate(frame, [45, 85], [0, 70], { extrapolateRight: "clamp" });

  // 茎生长（向上）
  const stemLen = interpolate(frame, [55, 100], [0, 200], { extrapolateRight: "clamp" });
  const stemOp = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });

  // 子叶展开
  const leafSpread = interpolate(frame, [85, 115], [0, 1], { extrapolateRight: "clamp" });
  const leafOp = interpolate(frame, [85, 100], [0, 1], { extrapolateRight: "clamp" });

  // 三个条件标签
  const cond1Op = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const cond2Op = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const cond3Op = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  const warningOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const seedX = 960;
  const seedY = soilY - 20;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#fff" }}>🌱 种子萌发的条件</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>种子发芽需要三个必要条件</div>
      </div>

      {/* 土壤 */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: soilY, bottom: 0,
        background: `linear-gradient(180deg, ${C.soilLight} 0%, ${C.soil} 40%, #5c2d0a 100%)`,
        borderTop: "3px solid #d97706",
      }} />

      {/* 土壤纹理点 */}
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${10 + (i * 73) % 80}%`,
          top: soilY + 10 + (i * 31) % 60,
          width: 6, height: 4, borderRadius: 3,
          background: "rgba(0,0,0,.3)",
        }} />
      ))}

      {/* SVG 动画层 */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        {/* 种子 */}
        <ellipse
          cx={seedX} cy={seedY}
          rx={24} ry={16}
          fill={C.seedLight}
          opacity={seedVisible}
        />
        <ellipse
          cx={seedX} cy={seedY - 4}
          rx={14} ry={8}
          fill="#fef3c7"
          opacity={seedVisible * 0.6}
        />

        {/* 主根（向下） */}
        <line
          x1={seedX} y1={seedY + 10}
          x2={seedX} y2={seedY + 10 + rootLen}
          stroke={C.root}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* 侧根 */}
        <line
          x1={seedX} y1={seedY + 40}
          x2={seedX - root2Len * 0.6} y2={seedY + 40 + root2Len * 0.5}
          stroke={C.root}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={seedX} y1={seedY + 65}
          x2={seedX + root2Len * 0.5} y2={seedY + 65 + root2Len * 0.4}
          stroke={C.root}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* 茎（向上）*/}
        <line
          x1={seedX} y1={seedY - 10}
          x2={seedX} y2={seedY - 10 - stemLen}
          stroke={C.stem}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={stemOp}
        />

        {/* 子叶 */}
        <ellipse
          cx={seedX - 50 * leafSpread} cy={seedY - 10 - stemLen + 20}
          rx={40 * leafSpread} ry={22 * leafSpread}
          fill={C.leaf} opacity={leafOp}
          transform={`rotate(-25,${seedX - 50 * leafSpread},${seedY - 10 - stemLen + 20})`}
        />
        <ellipse
          cx={seedX + 50 * leafSpread} cy={seedY - 10 - stemLen + 20}
          rx={40 * leafSpread} ry={22 * leafSpread}
          fill={C.leaf} opacity={leafOp}
          transform={`rotate(25,${seedX + 50 * leafSpread},${seedY - 10 - stemLen + 20})`}
        />

        {/* 方向标注 */}
        {rootLen > 60 && (
          <>
            <text x={seedX + 20} y={seedY + rootLen * 0.5}
              fill={C.root} fontSize={26} fontFamily="PingFang SC,sans-serif"
              opacity={Math.min(1, (rootLen - 60) / 30)}>
              根 ↓ 向下生长
            </text>
          </>
        )}
        {stemLen > 80 && (
          <>
            <text x={seedX + 16} y={seedY - stemLen * 0.5}
              fill={C.stem} fontSize={26} fontFamily="PingFang SC,sans-serif"
              opacity={Math.min(1, (stemLen - 80) / 30)}>
              茎 ↑ 向上伸展
            </text>
          </>
        )}
      </svg>

      {/* 三个条件 */}
      <div style={{ position: "absolute", top: 160, left: 80, display: "flex", flexDirection: "column", gap: 20 }}>
        {[
          { icon: "💧", text: "水分", op: cond1Op, color: "#60a5fa" },
          { icon: "🌡️", text: "适宜温度", op: cond2Op, color: "#fb923c" },
          { icon: "💨", text: "空气", op: cond3Op, color: "#a3e635" },
        ].map(({ icon, text, op, color }) => (
          <div key={text} style={{
            display: "flex", alignItems: "center", gap: 16,
            opacity: op, fontFamily: "'PingFang SC',sans-serif",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `${color}22`, border: `2px solid ${color}88`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>{icon}</div>
            <div style={{ fontSize: 34, color: "#fff", fontWeight: 700 }}>{text}</div>
          </div>
        ))}
      </div>

      {/* 重要提示 */}
      <div style={{
        position: "absolute", bottom: 120, right: 80,
        background: "rgba(239,68,68,.15)", border: "2px solid #ef4444",
        borderRadius: 16, padding: "20px 32px",
        opacity: warningOp, fontFamily: "'PingFang SC',sans-serif",
        maxWidth: 400,
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fca5a5" }}>⚠️ 注意！</div>
        <div style={{ fontSize: 28, color: "#fff", marginTop: 8 }}>发芽不需要阳光！</div>
        <div style={{ fontSize: 22, color: "#fca5a5", marginTop: 6 }}>光合作用是幼苗阶段才需要的</div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：生长与开花 ────────────────────────────────
const GrowthScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 植物生长阶段动画
  const stage = interpolate(frame, [0, 100], [0, 5], { extrapolateRight: "clamp" });

  // 茎高度
  const stemH = interpolate(frame, [10, 80], [60, 380], { extrapolateRight: "clamp" });
  // 茎宽度
  const stemW = interpolate(frame, [30, 80], [6, 14], { extrapolateRight: "clamp" });
  // 叶子数量 & 大小
  const leaf1Op = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const leaf2Op = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });
  const leaf3Op = interpolate(frame, [50, 65], [0, 1], { extrapolateRight: "clamp" });
  const leaf4Op = interpolate(frame, [65, 80], [0, 1], { extrapolateRight: "clamp" });
  // 花开
  const flowerOp = interpolate(frame, [85, 100], [0, 1], { extrapolateRight: "clamp" });
  const flowerScale = spring({ frame: frame - 85, fps: 30, config: { stiffness: 120, damping: 10 } });
  // 太阳
  const sunOp = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" });
  // 阶段标签
  const stageLabOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const phsLabOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const groundY = 750;
  const stemBaseX = 960;
  const stemTopY = groundY - stemH;

  const sunPulse = 1 + 0.05 * Math.sin(frame * 0.1);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 天空渐变 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `linear-gradient(180deg, rgba(14,165,233,.15) 0%, transparent 50%)`,
      }} />

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌿 幼苗生长 → 开花</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>阳光 + 光合作用 → 积累能量 → 开花信号</div>
      </div>

      {/* 太阳 */}
      <div style={{
        position: "absolute", right: 120, top: 80,
        opacity: sunOp, transition: "opacity 0.5s",
      }}>
        <div style={{
          fontSize: 100,
          transform: `scale(${sunPulse})`,
          filter: "drop-shadow(0 0 30px #fbbf24)",
        }}>☀️</div>
        <div style={{
          textAlign: "center", color: "#fbbf24",
          fontSize: 24, fontFamily: "'PingFang SC',sans-serif", fontWeight: 700, marginTop: 8,
        }}>光合作用</div>
      </div>

      {/* 土壤 */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: groundY, bottom: 0,
        background: `linear-gradient(180deg, ${C.soilLight} 0%, ${C.soil} 100%)`,
        borderTop: "3px solid #d97706",
      }} />

      {/* SVG 植物 */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        {/* 茎 */}
        <line
          x1={stemBaseX} y1={groundY - 10}
          x2={stemBaseX} y2={stemTopY}
          stroke={C.stem}
          strokeWidth={stemW}
          strokeLinecap="round"
        />

        {/* 叶子1 - 左 */}
        <ellipse cx={stemBaseX - 70} cy={stemTopY + stemH * 0.75}
          rx={60 * leaf1Op} ry={28 * leaf1Op}
          fill={C.leaf} opacity={leaf1Op}
          transform={`rotate(-30,${stemBaseX - 70},${stemTopY + stemH * 0.75})`}
        />
        {/* 叶子2 - 右 */}
        <ellipse cx={stemBaseX + 70} cy={stemTopY + stemH * 0.55}
          rx={60 * leaf2Op} ry={28 * leaf2Op}
          fill={C.leaf} opacity={leaf2Op}
          transform={`rotate(30,${stemBaseX + 70},${stemTopY + stemH * 0.55})`}
        />
        {/* 叶子3 - 左大 */}
        <ellipse cx={stemBaseX - 90} cy={stemTopY + stemH * 0.35}
          rx={80 * leaf3Op} ry={36 * leaf3Op}
          fill="#15803d" opacity={leaf3Op}
          transform={`rotate(-20,${stemBaseX - 90},${stemTopY + stemH * 0.35})`}
        />
        {/* 叶子4 - 右大 */}
        <ellipse cx={stemBaseX + 90} cy={stemTopY + stemH * 0.2}
          rx={80 * leaf4Op} ry={36 * leaf4Op}
          fill="#15803d" opacity={leaf4Op}
          transform={`rotate(20,${stemBaseX + 90},${stemTopY + stemH * 0.2})`}
        />

        {/* 花朵 */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const petalR = 40 * Math.min(flowerScale, 1);
          return (
            <ellipse
              key={i}
              cx={stemBaseX + Math.cos(rad) * petalR}
              cy={stemTopY - 10 + Math.sin(rad) * petalR}
              rx={petalR * 0.8} ry={petalR * 0.4}
              fill={i % 2 === 0 ? "#f472b6" : "#fb923c"}
              opacity={flowerOp}
              transform={`rotate(${angle},${stemBaseX + Math.cos(rad) * petalR},${stemTopY - 10 + Math.sin(rad) * petalR})`}
            />
          );
        })}
        {/* 花心 */}
        <circle cx={stemBaseX} cy={stemTopY - 10}
          r={22 * Math.min(flowerScale, 1)}
          fill="#fbbf24" opacity={flowerOp}
        />
        <circle cx={stemBaseX} cy={stemTopY - 10}
          r={12 * Math.min(flowerScale, 1)}
          fill="#d97706" opacity={flowerOp}
        />
      </svg>

      {/* 阶段标签 */}
      <div style={{
        position: "absolute", left: 80, bottom: 200,
        opacity: stageLabOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 26, color: "#86efac", fontWeight: 700, marginBottom: 12 }}>幼苗生长需要：</div>
        {["☀️ 阳光（光合作用）", "💧 水分（运输养分）", "🌱 无机盐（根系吸收）"].map((t, i) => (
          <div key={i} style={{
            fontSize: 28, color: "#fff", padding: "8px 20px", marginBottom: 8,
            background: "rgba(34,197,94,.1)", borderRadius: 8, borderLeft: "3px solid #22c55e",
          }}>{t}</div>
        ))}
      </div>

      {/* 开花标签 */}
      <div style={{
        position: "absolute", right: 80, bottom: 220,
        opacity: phsLabOp, fontFamily: "'PingFang SC',sans-serif",
        background: "rgba(244,114,182,.12)", border: "2px solid #f472b6",
        borderRadius: 16, padding: "20px 28px",
      }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#f9a8d4" }}>🌸 开花信号</div>
        <div style={{ fontSize: 24, color: "#fff", marginTop: 8 }}>积累足够能量后<br/>进入生殖阶段</div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：传粉与结果 ────────────────────────────────
const PollinationScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 蜜蜂飞行
  const beeX = interpolate(frame, [10, 60], [200, 680], { extrapolateRight: "clamp" });
  const beeY = interpolate(frame, [10, 60], [400, 360], { extrapolateRight: "clamp" });
  const beeOp = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" });
  const beeWiggle = Math.sin(frame * 0.3) * 10;

  // 花粉传播
  const pollenOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const pollenX = interpolate(frame, [30, 60], [680, 900], { extrapolateRight: "clamp" });

  // 风媒箭头
  const windOp = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" });
  const windX = interpolate(frame, [5, 35], [-50, 200], { extrapolateRight: "clamp" });

  // 果实生长
  const fruitScale = interpolate(frame, [65, 100], [0, 1], { extrapolateRight: "clamp" });
  const fruitBounce = spring({ frame: frame - 65, fps: 30, config: { stiffness: 130, damping: 12 } });

  // 标签
  const lab1Op = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const lab2Op = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const lab3Op = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 渐变背景 */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 60%, rgba(244,114,182,.08) 0%, transparent 50%)",
      }} />

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌸 传粉方式 → 结果</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>传粉是开花植物繁殖的关键步骤</div>
      </div>

      {/* 土壤 */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 800, bottom: 0,
        background: `linear-gradient(180deg, ${C.soilLight} 0%, ${C.soil} 100%)`,
        borderTop: "3px solid #d97706",
      }} />

      {/* SVG 层 */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        {/* 虫媒花（左侧） */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse key={i}
              cx={680 + Math.cos(rad) * 45}
              cy={360 + Math.sin(rad) * 45}
              rx={45} ry={22}
              fill={i % 2 === 0 ? "#f472b6" : "#fb7185"}
              transform={`rotate(${angle},${680 + Math.cos(rad) * 45},${360 + Math.sin(rad) * 45})`}
            />
          );
        })}
        <circle cx={680} cy={360} r={26} fill="#fbbf24" />
        <circle cx={680} cy={360} r={14} fill="#d97706" />

        {/* 蜜蜂 */}
        <text x={beeX} y={beeY + beeWiggle}
          fontSize={60} opacity={beeOp}
          style={{ userSelect: "none" }}>🐝</text>

        {/* 花粉轨迹 */}
        {[0, 1, 2].map(i => (
          <circle key={i}
            cx={beeX - 30 + i * 30}
            cy={beeY + beeWiggle - 20 + i * 10}
            r={6 - i * 1.5}
            fill="#fbbf24"
            opacity={pollenOp * (0.8 - i * 0.2)}
          />
        ))}

        {/* 风媒花（右侧，小而不显眼） */}
        <line x1={1280} y1={320} x2={1280} y2={600}
          stroke={C.stem} strokeWidth={8} strokeLinecap="round" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse key={i}
              cx={1280 + Math.cos(rad) * 25}
              cy={320 + Math.sin(rad) * 25}
              rx={22} ry={10}
              fill="#a3e635" opacity={0.7}
              transform={`rotate(${angle},${1280 + Math.cos(rad) * 25},${320 + Math.sin(rad) * 25})`}
            />
          );
        })}
        <circle cx={1280} cy={320} r={14} fill="#65a30d" />

        {/* 风箭头 */}
        <text x={windX + 900} y={300}
          fontSize={50} opacity={windOp}>💨</text>
        <text x={windX + 980} y={300}
          fontSize={50} opacity={windOp * 0.7}>💨</text>

        {/* 果实 */}
        <circle cx={680} cy={360}
          r={50 * Math.min(fruitBounce, 1) * fruitScale}
          fill={C.fruit} opacity={fruitScale}
        />
        <circle cx={690} cy={348}
          r={15 * Math.min(fruitBounce, 1) * fruitScale}
          fill="#fca5a5" opacity={fruitScale * 0.7}
        />
        {fruitScale > 0.5 && (
          <text x={620} y={440} fontSize={24}
            fill="#fff" opacity={fruitScale}
            fontFamily="PingFang SC,sans-serif">🍎 果实形成！</text>
        )}
      </svg>

      {/* 标签面板 */}
      <div style={{
        position: "absolute", left: 60, top: 180,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          opacity: lab1Op,
          background: "rgba(244,114,182,.1)", border: "2px solid #f472b6",
          borderRadius: 16, padding: "16px 24px", marginBottom: 20, maxWidth: 350,
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f9a8d4" }}>🐝 虫媒花</div>
          <div style={{ fontSize: 22, color: "#fff", marginTop: 8 }}>
            颜色鲜艳、香味浓郁<br/>吸引蜜蜂、蝴蝶传粉
          </div>
        </div>
        <div style={{
          opacity: lab2Op,
          background: "rgba(163,230,53,.1)", border: "2px solid #a3e635",
          borderRadius: 16, padding: "16px 24px", marginBottom: 20, maxWidth: 350,
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#d9f99d" }}>💨 风媒花</div>
          <div style={{ fontSize: 22, color: "#fff", marginTop: 8 }}>
            花小、不显眼<br/>大量花粉随风传播
          </div>
        </div>
        <div style={{
          opacity: lab3Op,
          background: "rgba(239,68,68,.1)", border: "2px solid #ef4444",
          borderRadius: 16, padding: "16px 24px", maxWidth: 350,
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fca5a5" }}>🍎 传粉后结果</div>
          <div style={{ fontSize: 22, color: "#fff", marginTop: 8 }}>
            花粉到达雌蕊<br/>→ 受精 → 果实生长
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：种子传播与总结 ────────────────────────────
const DispersalScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 4种传播方式依次出现
  const d1Op = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const d2Op = interpolate(frame, [28, 48], [0, 1], { extrapolateRight: "clamp" });
  const d3Op = interpolate(frame, [46, 66], [0, 1], { extrapolateRight: "clamp" });
  const d4Op = interpolate(frame, [64, 84], [0, 1], { extrapolateRight: "clamp" });

  // 循环箭头
  const cycleOp = interpolate(frame, [88, 105], [0, 1], { extrapolateRight: "clamp" });

  // 蒲公英动画（风力）
  const dandX = interpolate(frame, [10, 50], [400, 700], { extrapolateRight: "clamp" });
  const dandY = 220 + Math.sin(frame * 0.15) * 30;

  // 椰子水流动画
  const coconutX = interpolate(frame, [46, 75], [900, 1100], { extrapolateRight: "clamp" });
  const waveY = 520 + Math.sin(frame * 0.2) * 8;

  const dispersalMethods = [
    { icon: "🌬️", title: "风力传播", example: "蒲公英、杨树", color: "#60a5fa", op: d1Op },
    { icon: "🐾", title: "动物传播", example: "苍耳、樱桃", color: "#f472b6", op: d2Op },
    { icon: "🌊", title: "水流传播", example: "椰子、莲蓬", color: "#34d399", op: d3Op },
    { icon: "💥", title: "弹射传播", example: "凤仙花、豌豆", color: "#fb923c", op: d4Op },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* 背景水波 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
        background: "linear-gradient(180deg, transparent, rgba(14,165,233,.15))",
      }} />

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🌍 种子的传播方式</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>种子走向新家园，开始新的生命循环</div>
      </div>

      {/* SVG 动画 */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        {/* 蒲公英飞行 */}
        <text x={dandX} y={dandY} fontSize={50} opacity={d1Op}>🌬️</text>
        <text x={dandX + 60} y={dandY - 20} fontSize={36} opacity={d1Op * 0.7}>🌻</text>

        {/* 苍耳黏动物 */}
        <text x={800} y={350} fontSize={50} opacity={d2Op}>🦊</text>
        <text x={860} y={340} fontSize={30} opacity={d2Op}>🌿🌿</text>

        {/* 椰子水流 */}
        <text x={coconutX} y={waveY} fontSize={50} opacity={d3Op}>🥥</text>
        {[0, 80, 160, 240].map(i => (
          <text key={i} x={900 + i} y={560} fontSize={24} opacity={d3Op * 0.5}>〜</text>
        ))}

        {/* 弹射 */}
        <text x={1200} y={240} fontSize={50} opacity={d4Op}>💥</text>
        {[0, 30, 60, 90].map((i, idx) => {
          const pX = 1250 + Math.cos(i * 0.1) * 80;
          const pY = 240 + Math.sin(i * 0.1) * 60;
          return <circle key={idx} cx={pX} cy={pY} r={8} fill={C.seedLight} opacity={d4Op} />;
        })}

        {/* 循环箭头 */}
        <text x={850} y={780} fontSize={60} opacity={cycleOp}>🔄</text>
        <text x={930} y={788} fontFamily="PingFang SC,sans-serif" fontSize={34}
          fill="#86efac" opacity={cycleOp}>
          生命的循环，周而复始
        </text>
      </svg>

      {/* 4种方式卡片 */}
      <div style={{
        position: "absolute", bottom: 120, left: 60, right: 60,
        display: "flex", gap: 24,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {dispersalMethods.map(({ icon, title, example, color, op }) => (
          <div key={title} style={{
            flex: 1, opacity: op,
            background: `${color}15`, border: `2px solid ${color}55`,
            borderRadius: 16, padding: "20px 16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 20, color: color }}>例：{example}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 主合成 ────────────────────────────────────────────
export const PlantLifeCycleVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />

      {/* 场景1：标题 0-120帧 */}
      <Sequence from={0} durationInFrames={120}>
        <TitleScene />
      </Sequence>

      {/* 场景2：种子萌发 120-270帧 */}
      <Sequence from={120} durationInFrames={150}>
        <GerminationScene />
      </Sequence>

      {/* 场景3：生长开花 270-420帧 */}
      <Sequence from={270} durationInFrames={150}>
        <GrowthScene />
      </Sequence>

      {/* 场景4：传粉结果 420-555帧 */}
      <Sequence from={420} durationInFrames={135}>
        <PollinationScene />
      </Sequence>

      {/* 场景5：种子传播 555-660帧 */}
      <Sequence from={555} durationInFrames={105}>
        <DispersalScene />
      </Sequence>
    </AbsoluteFill>
  );
};
