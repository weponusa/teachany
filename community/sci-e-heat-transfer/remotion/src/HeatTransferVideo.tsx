import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a0f1e",
  bg2: "#0f1e3a",
  text: "#f0f9ff",
  muted: "#94a3b8",
  conduction: "#f97316",   // 橙：传导
  convection: "#22d3ee",   // 青：对流
  radiation: "#a855f7",    // 紫：辐射
  accent: "#fbbf24",       // 黄：强调
  green: "#4ade80",
};

// ── 粒子动画工具 ────────────────────────────────────────
const useParticle = (frame: number, index: number, total: number, startFrame: number, duration: number) => {
  const progress = Math.max(0, Math.min(1, (frame - startFrame - index * (duration / total)) / duration));
  return progress;
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagScale = spring({ frame: frame - 45, fps, config: { stiffness: 100, damping: 15 } });

  const tags = [
    { icon: "🔥", label: "热传导", color: C.conduction },
    { icon: "🌊", label: "热对流", color: C.convection },
    { icon: "☀️", label: "热辐射", color: C.radiation },
  ];

  // 背景粒子
  const bgParticles = Array.from({ length: 12 }, (_, i) => {
    const x = (i * 163 + 50) % 1920;
    const baseY = (i * 97 + 80) % 1080;
    const y = baseY + Math.sin((frame + i * 30) * 0.03) * 20;
    const op = 0.15 + Math.sin((frame + i * 20) * 0.05) * 0.1;
    return { x, y, op, size: 6 + (i % 4) * 4 };
  });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, rgba(249,115,22,.15) 0%, rgba(168,85,247,.1) 40%, ${C.bg} 70%)`,
      overflow: "hidden",
    }}>
      {/* 背景粒子 */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {bgParticles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.size} fill={i % 3 === 0 ? C.conduction : i % 3 === 1 ? C.convection : C.radiation} opacity={p.op} />
        ))}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 32 }}>
        {/* 标题 */}
        <div style={{
          fontSize: 100, fontWeight: 900,
          fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          background: `linear-gradient(135deg, ${C.conduction} 0%, ${C.accent} 50%, ${C.radiation} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textAlign: "center",
        }}>热的传递方式</div>

        {/* 副标题 */}
        <div style={{
          fontSize: 38, color: C.muted, opacity: subOp,
          fontFamily: "'PingFang SC',sans-serif",
        }}>小学科学 G5 · 物质科学</div>

        {/* 三种传热标签 */}
        <div style={{ display: "flex", gap: 32, transform: `scale(${Math.min(tagScale, 1)})`, opacity: Math.min(tagScale, 1) }}>
          {tags.map((t, i) => (
            <div key={i} style={{
              padding: "16px 36px", borderRadius: 99,
              background: `${t.color}22`, border: `2px solid ${t.color}66`,
              color: t.color, fontSize: 34, fontWeight: 700,
              fontFamily: "'PingFang SC',sans-serif",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* 底部问题引入 */}
        <div style={{
          opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 26, color: "#94a3b8", textAlign: "center",
          fontFamily: "'PingFang SC',sans-serif",
          padding: "0 200px", lineHeight: 1.8,
        }}>
          金属勺为什么会变热？水为什么会翻滚？太阳的热量怎么来的？
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：热传导粒子动画 ──────────────────────────────
const ConductionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 金属棒上粒子振动模拟 - 热量从左向右传导
  const rodLeft = 200;
  const rodRight = 1720;
  const rodY = 480;
  const rodWidth = rodRight - rodLeft;
  const numParticles = 18;

  const heatProgress = interpolate(frame, [20, 130], [0, 1], { extrapolateRight: "clamp" });
  const heatX = rodLeft + heatProgress * rodWidth;

  // 粒子振幅：热区振幅大，冷区小
  const particles = Array.from({ length: numParticles }, (_, i) => {
    const baseX = rodLeft + (i + 0.5) * (rodWidth / numParticles);
    const isHot = baseX < heatX;
    const hotRatio = Math.max(0, Math.min(1, (heatX - baseX) / (rodWidth * 0.2)));
    const amplitude = isHot ? 18 + hotRatio * 22 : 4;
    const vibration = Math.sin((frame * 0.35 + i * 0.8) * (isHot ? 1.5 : 0.8)) * amplitude;
    const tempColor = isHot
      ? `rgb(${Math.round(249 * hotRatio + 56 * (1 - hotRatio))},${Math.round(115 * (1 - hotRatio) + 189 * (1 - hotRatio))},${22 * hotRatio})`
      : "#1e40af";
    return { baseX, y: rodY + vibration, isHot, hotRatio, color: isHot ? `hsl(${20 + hotRatio * 10},90%,${55 - hotRatio * 15}%)` : "#3b82f6", amplitude };
  });

  // 温度渐变色
  const gradientStop = (Math.max(0, heatProgress) * 100).toFixed(1);

  // 热量传导显示的标注
  const labelOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const arrowProgress = interpolate(frame, [25, 110], [0, 1], { extrapolateRight: "clamp" });

  // 底部导体对比出现
  const compareOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: C.conduction }}>🔥 热传导</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>热量在固体中传递 · 高温→低温 · 粒子振动传递能量</div>
      </div>

      {/* SVG 动画区域 */}
      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        {/* 金属棒渐变 */}
        <defs>
          <linearGradient id="rodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
            <stop offset={`${gradientStop}%`} stopColor="#f97316" stopOpacity="0.6" />
            <stop offset={`${Math.min(parseFloat(gradientStop) + 5, 100)}%`} stopColor="#1e3a8a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* 金属棒 */}
        <rect x={rodLeft} y={rodY - 30} width={rodWidth} height={60} rx={30}
          fill="url(#rodGrad)" stroke="#ffffff22" strokeWidth={2} />

        {/* 粒子振动 */}
        {particles.map((p, i) => (
          <g key={i}>
            <circle cx={p.baseX} cy={p.y} r={12 + p.hotRatio * 6} fill={p.color}
              opacity={0.85 + p.hotRatio * 0.15} />
            {/* 振动轨迹提示 */}
            {p.isHot && p.hotRatio > 0.3 && (
              <line x1={p.baseX} y1={rodY - 50} x2={p.baseX} y2={rodY + 50}
                stroke={p.color} strokeWidth={1} strokeDasharray="3,4" opacity={0.3} />
            )}
          </g>
        ))}

        {/* 热量传导箭头 */}
        <line
          x1={rodLeft + 30} y1={rodY - 80}
          x2={rodLeft + 30 + arrowProgress * (rodWidth - 60)} y2={rodY - 80}
          stroke={C.accent} strokeWidth={4} strokeLinecap="round"
        />
        {arrowProgress > 0.05 && (
          <polygon
            points={`${rodLeft + 30 + arrowProgress * (rodWidth - 60)},${rodY - 80} ${rodLeft + 30 + arrowProgress * (rodWidth - 60) - 20},${rodY - 93} ${rodLeft + 30 + arrowProgress * (rodWidth - 60) - 20},${rodY - 67}`}
            fill={C.accent}
          />
        )}
        <text x={rodLeft + 30 + arrowProgress * (rodWidth - 60) / 2} y={rodY - 95}
          fill={C.accent} fontSize={26} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>热量传递方向</text>

        {/* 左侧热源标注 */}
        <text x={rodLeft + 20} y={rodY + 90} fill={C.conduction} fontSize={28} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" fontWeight={700} opacity={labelOp}>高温端🔥</text>
        <text x={rodRight - 20} y={rodY + 90} fill="#3b82f6" fontSize={28} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" fontWeight={700} opacity={labelOp}>低温端❄️</text>

        {/* 火焰图标 */}
        <text x={rodLeft - 60} y={rodY + 15} fontSize={70} textAnchor="middle" opacity={0.9}>🔥</text>

        {/* 粒子振幅说明 */}
        <text x={960} y={rodY + 140} fill={C.muted} fontSize={24} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif"
          opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" })}>
          高温端粒子振动剧烈 → 碰撞邻近粒子 → 能量逐步向低温端传递
        </text>
      </svg>

      {/* 导体对比 */}
      <div style={{
        position: "absolute", bottom: 50, left: 80, right: 80,
        opacity: compareOp,
        display: "flex", gap: 30,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          flex: 1, background: `${C.conduction}15`, border: `2px solid ${C.conduction}55`,
          borderRadius: 16, padding: "20px 28px",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.conduction, marginBottom: 10 }}>⚡ 热的良导体</div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.6 }}>
            导热快 · 铁、铜、铝等金属<br/>
            🥄 金属锅柄很快变热
          </div>
        </div>
        <div style={{
          flex: 1, background: "rgba(148,163,184,.08)", border: "2px solid rgba(148,163,184,.3)",
          borderRadius: 16, padding: "20px 28px",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.muted, marginBottom: 10 }}>🛡️ 热的不良导体</div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.6 }}>
            导热慢 · 木头、空气、陶瓷<br/>
            🥄 木质锅铲握着不烫手
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：热对流循环动画 ──────────────────────────────
const ConvectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 对流粒子循环（环形路径）
  const containerLeft = 300;
  const containerTop = 200;
  const containerWidth = 700;
  const containerHeight = 600;
  const cx = containerLeft + containerWidth / 2;
  const cy = containerTop + containerHeight / 2;

  const numConvParticles = 16;
  const convParticles = Array.from({ length: numConvParticles }, (_, i) => {
    // 椭圆循环路径：热流体上升，冷流体下降
    const phase = ((i / numConvParticles) + (frame * 0.004)) % 1;
    const angle = phase * Math.PI * 2;
    // 上半循环 = 热流体（向上），下半循环 = 冷流体（向下）
    const isHot = Math.sin(angle) < 0; // 向上时是热流体
    const px = cx + Math.cos(angle) * (containerWidth * 0.35);
    const py = cy + Math.sin(angle) * (containerHeight * 0.38);
    const color = isHot ? `hsl(${20 + Math.abs(Math.sin(angle)) * 20},90%,55%)` : "#38bdf8";
    return { px, py, isHot, color, phase };
  });

  // 箭头和说明出现
  const explainOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const rightPanelOp = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: C.convection }}>🌊 热对流</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>热量在液体·气体中传递 · 热流体上升·冷流体下沉</div>
      </div>

      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        {/* 水容器 */}
        <rect x={containerLeft} y={containerTop} width={containerWidth} height={containerHeight}
          fill="rgba(22,78,99,0.4)" stroke="#22d3ee55" strokeWidth={3} rx={16} />

        {/* 底部火焰热源 */}
        <text x={cx} y={containerTop + containerHeight + 70} fontSize={60} textAnchor="middle">🔥</text>
        <rect x={containerLeft + 50} y={containerTop + containerHeight - 10} width={containerWidth - 100} height={10} rx={5}
          fill={C.conduction} opacity={0.6} />

        {/* 对流粒子 */}
        {convParticles.map((p, i) => (
          <g key={i}>
            <circle cx={p.px} cy={p.py} r={16} fill={p.color} opacity={0.85} />
          </g>
        ))}

        {/* 上升箭头 */}
        <line x1={cx - 200} y1={containerTop + containerHeight - 60} x2={cx - 200} y2={containerTop + 80}
          stroke={C.conduction} strokeWidth={3} strokeDasharray="8,6"
          opacity={interpolate(frame, [25, 45], [0, 0.8], { extrapolateRight: "clamp" })} />
        <polygon points={`${cx - 200},${containerTop + 60} ${cx - 214},${containerTop + 90} ${cx - 186},${containerTop + 90}`}
          fill={C.conduction}
          opacity={interpolate(frame, [25, 45], [0, 0.8], { extrapolateRight: "clamp" })} />

        {/* 下沉箭头 */}
        <line x1={cx + 200} y1={containerTop + 60} x2={cx + 200} y2={containerTop + containerHeight - 60}
          stroke="#38bdf8" strokeWidth={3} strokeDasharray="8,6"
          opacity={interpolate(frame, [25, 45], [0, 0.8], { extrapolateRight: "clamp" })} />
        <polygon points={`${cx + 200},${containerTop + containerHeight - 40} ${cx + 186},${containerTop + containerHeight - 80} ${cx + 214},${containerTop + containerHeight - 80}`}
          fill="#38bdf8"
          opacity={interpolate(frame, [25, 45], [0, 0.8], { extrapolateRight: "clamp" })} />

        {/* 标注 */}
        <text x={cx - 270} y={containerTop + containerHeight / 2} fill={C.conduction} fontSize={24} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" fontWeight={700} opacity={explainOp}
          transform={`rotate(-90, ${cx - 270}, ${containerTop + containerHeight / 2})`}>热流体上升</text>
        <text x={cx + 270} y={containerTop + containerHeight / 2} fill="#38bdf8" fontSize={24} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" fontWeight={700} opacity={explainOp}
          transform={`rotate(90, ${cx + 270}, ${containerTop + containerHeight / 2})`}>冷流体下沉</text>

        {/* 温度标注 */}
        <text x={cx} y={containerTop + containerHeight - 30} fill={C.conduction} fontSize={22} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" opacity={explainOp}>🌡️ 热区（底部）密度小↑</text>
        <text x={cx} y={containerTop + 55} fill="#38bdf8" fontSize={22} textAnchor="middle"
          fontFamily="'PingFang SC',sans-serif" opacity={explainOp}>❄️ 冷区（顶部）密度大↓</text>
      </svg>

      {/* 右侧生活实例 */}
      <div style={{
        position: "absolute", right: 80, top: 180, width: 420,
        opacity: rightPanelOp,
        fontFamily: "'PingFang SC',sans-serif",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{
          background: `${C.convection}12`, border: `2px solid ${C.convection}44`,
          borderRadius: 16, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🫖 烧开水</div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.6 }}>
            底部水受热上升<br/>顶部冷水下沉循环<br/>水面翻滚就是对流
          </div>
        </div>
        <div style={{
          background: `${C.convection}12`, border: `2px solid ${C.convection}44`,
          borderRadius: 16, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏠 暖气取暖</div>
          <div style={{ fontSize: 22, color: "#e2e8f0", lineHeight: 1.6 }}>
            暖气放在房间下方<br/>热空气上升带暖全室<br/>冷空气补充循环
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：热辐射波动画 ────────────────────────────────
const RadiationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 太阳位置
  const sunX = 280;
  const sunY = 540;
  const earthX = 1640;
  const earthY = 540;

  // 辐射波纹（从太阳向外扩散）
  const numWaves = 8;
  const waves = Array.from({ length: numWaves }, (_, i) => {
    const phase = ((frame * 0.02) + i / numWaves) % 1;
    const r = 80 + phase * 600;
    const opacity = (1 - phase) * 0.6;
    return { r, opacity };
  });

  // 电磁波（从太阳到地球的波形线）
  const wavePoints = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    const x = sunX + 120 + t * (earthX - sunX - 240);
    const waveProgress = interpolate(frame, [20, 100], [0, 1], { extrapolateRight: "clamp" });
    const visible = t <= waveProgress;
    const y = sunY + (visible ? Math.sin(t * Math.PI * 8 - frame * 0.2) * 30 : 0);
    return { x, y, visible };
  });

  const wavePath = wavePoints.filter(p => p.visible).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // 地球接收能量动画
  const earthGlow = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: "clamp" });

  // 标注出现
  const labelOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const bottomOp = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#050b14" }}>
      {/* 星空背景 */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {Array.from({ length: 60 }, (_, i) => {
          const sx = (i * 337 + 100) % 1920;
          const sy = (i * 197 + 50) % 1080;
          const twinkle = 0.3 + Math.sin((frame + i * 17) * 0.08) * 0.3;
          return <circle key={i} cx={sx} cy={sy} r={1.5 + (i % 3)} fill="white" opacity={twinkle} />;
        })}
      </svg>

      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: C.radiation }}>☀️ 热辐射</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>无需介质 · 电磁波传热 · 穿越真空宇宙</div>
      </div>

      <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        {/* 太阳光晕 */}
        {waves.map((w, i) => (
          <circle key={i} cx={sunX} cy={sunY} r={w.r} fill="none"
            stroke="#fbbf24" strokeWidth={2} opacity={w.opacity} />
        ))}

        {/* 太阳 */}
        <circle cx={sunX} cy={sunY} r={90}
          fill={`radial-gradient(circle, #fde68a, #f59e0b)`}
          stroke="#fbbf24" strokeWidth={4} />
        <text x={sunX} y={sunY + 15} fontSize={80} textAnchor="middle">☀️</text>

        {/* 电磁波线 */}
        {wavePath && (
          <path d={wavePath} fill="none" stroke="#c084fc" strokeWidth={4} opacity={0.9}
            strokeLinecap="round" />
        )}

        {/* 地球光晕（接收热量） */}
        {earthGlow > 0 && (
          <circle cx={earthX} cy={earthY} r={85 + earthGlow * 30}
            fill="none" stroke="#fbbf24" strokeWidth={3} opacity={earthGlow * 0.5} />
        )}

        {/* 地球 */}
        <text x={earthX} y={earthY + 20} fontSize={110} textAnchor="middle">🌍</text>

        {/* "真空"标注 */}
        <text x={(sunX + earthX) / 2} y={sunY - 80} fill="#94a3b8" fontSize={26}
          textAnchor="middle" fontFamily="'PingFang SC',sans-serif"
          opacity={labelOp}>— 真空宇宙（无任何介质）—</text>

        {/* 电磁波标签 */}
        <text x={(sunX + earthX) / 2} y={sunY + 80} fill={C.radiation} fontSize={24}
          textAnchor="middle" fontFamily="'PingFang SC',sans-serif" fontWeight={700}
          opacity={labelOp}>⚡ 电磁波（光速传播）</text>

        {/* 太阳标签 */}
        <text x={sunX} y={sunY + 160} fill="#fbbf24" fontSize={28}
          textAnchor="middle" fontFamily="'PingFang SC',sans-serif" fontWeight={700}
          opacity={labelOp}>🌞 热源（太阳）</text>

        {/* 地球标签 */}
        <text x={earthX} y={earthY + 160} fill={C.green} fontSize={28}
          textAnchor="middle" fontFamily="'PingFang SC',sans-serif" fontWeight={700}
          opacity={labelOp}>🌍 地球（接收方）</text>
      </svg>

      {/* 底部烤火示例 */}
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0,
        textAlign: "center", opacity: bottomOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          display: "inline-block",
          background: `${C.radiation}15`, border: `2px solid ${C.radiation}44`,
          borderRadius: 16, padding: "16px 60px",
        }}>
          <div style={{ fontSize: 28, color: C.radiation, fontWeight: 700, marginBottom: 8 }}>
            💡 辐射不需要传播介质
          </div>
          <div style={{ fontSize: 24, color: "#e2e8f0" }}>
            🔥 烤火 · 太阳照射 · 暖炉取暖 — 都是辐射传热
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结对比 ────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const cards = [
    {
      icon: "🔥", title: "热传导", color: C.conduction,
      medium: "固体", key: "接触传热",
      how: "粒子振动传递能量", examples: "金属棒、锅柄变热",
      delay: 20,
    },
    {
      icon: "🌊", title: "热对流", color: C.convection,
      medium: "液体·气体", key: "循环传热",
      how: "热流体上升，冷流体下沉", examples: "烧开水、暖气取暖",
      delay: 40,
    },
    {
      icon: "☀️", title: "热辐射", color: C.radiation,
      medium: "不需要介质", key: "电磁波传热",
      how: "电磁波（光速）传播", examples: "太阳→地球、烤火取暖",
      delay: 60,
    },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 20%, rgba(251,191,36,.08) 0%, ${C.bg} 60%)`,
    }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#fff" }}>🎯 三种传热方式对比总结</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 12 }}>传导 · 对流 · 辐射 · 一表看清</div>
      </div>

      {/* 三栏卡片 */}
      <div style={{
        position: "absolute", top: 175, left: 60, right: 60,
        display: "flex", gap: 36,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {cards.map((c) => {
          const op = interpolate(frame, [c.delay, c.delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [c.delay, c.delay + 20], [30, 0], { extrapolateRight: "clamp" });
          return (
            <div key={c.title} style={{
              flex: 1,
              background: `${c.color}10`,
              border: `2px solid ${c.color}55`,
              borderRadius: 20, padding: "28px 24px",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 70, textAlign: "center", marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: c.color, textAlign: "center", marginBottom: 16 }}>{c.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: `${c.color}18`, borderRadius: 10, padding: "10px 16px" }}>
                  <span style={{ color: C.muted, fontSize: 22 }}>传播介质：</span>
                  <span style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{c.medium}</span>
                </div>
                <div style={{ background: `${c.color}18`, borderRadius: 10, padding: "10px 16px" }}>
                  <span style={{ color: C.muted, fontSize: 22 }}>传热方式：</span>
                  <span style={{ color: c.color, fontSize: 24, fontWeight: 700 }}>{c.key}</span>
                </div>
                <div style={{ fontSize: 22, color: "#cbd5e1", lineHeight: 1.6, marginTop: 8 }}>
                  📖 {c.how}
                </div>
                <div style={{
                  background: "rgba(255,255,255,.05)", borderRadius: 10, padding: "10px 16px",
                  fontSize: 21, color: "#94a3b8", lineHeight: 1.5,
                }}>
                  💡 {c.examples}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部保温小结 */}
      <div style={{
        position: "absolute", bottom: 45, left: 60, right: 60,
        opacity: interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" }),
        background: "rgba(251,191,36,.08)", border: "2px solid rgba(251,191,36,.35)",
        borderRadius: 16, padding: "18px 36px", textAlign: "center",
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <span style={{ fontSize: 26, color: C.accent, fontWeight: 700 }}>🧥 保温原理：</span>
        <span style={{ fontSize: 24, color: "#e2e8f0" }}>
          减少三种传热 · 羽绒服→困住空气隔热 · 真空保温杯→真空阻断传导+对流
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const HeatTransferVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><ConductionScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><ConvectionScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><RadiationScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
