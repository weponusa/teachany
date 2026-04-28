import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0b1a2e';
const ATP_COLOR = '#ff6b35';
const ADP_COLOR = '#5ec4b0';
const ENZYME = '#ffd166';
const ENERGY = '#ef476f';
const TEXT = '#fffaf0';

/* 能量粒子 */
const EnergyParticle: React.FC<{x: number; y: number; opacity: number; size: number}> = ({x, y, opacity, size}) => (
  <circle cx={x} cy={y} r={size} fill={ENERGY} opacity={opacity}>
    <animate attributeName="r" from={size} to={size * 1.4} dur="0.5s" repeatCount="indefinite" />
  </circle>
);

export const EnergyMetabolism: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;

  /* 阶段: 0-8s ATP结构 | 8-16s ATP水解 | 16-24s ATP合成循环 */
  const scene = t < 8 ? 0 : t < 16 ? 1 : 2;

  const cx = width / 2;
  const cy = height / 2;

  /* ATP 分子位置 */
  const atpX = cx - 200;
  const atpY = cy;

  /* ADP 分子位置 */
  const adpX = cx + 200;
  const adpY = cy;

  /* ─── 场景 0: ATP结构展示 ─── */
  const structReveal = interpolate(frame, [0, 120], [0, 1], {extrapolateRight: 'clamp'});

  /* ─── 场景 1: ATP水解 ─── */
  const hydrolysis = interpolate(frame, [240, 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bondBreak = interpolate(frame, [300, 340], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  /* ─── 场景 2: 循环 ─── */
  const cycleAngle = interpolate(frame, [480, 720], [0, Math.PI * 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const titles = ['ATP 的分子结构', 'ATP 水解释放能量', 'ATP 与 ADP 的相互转化'];
  const subtitles = [
    'A（腺苷）— P ~ P ~ P（3个磷酸基团，~ 为高能磷酸键）',
    'ATP → ADP + Pi + 能量（酶催化断裂远离A的高能磷酸键）',
    'ATP ⇌ ADP + Pi（可逆反应，细胞内动态平衡）',
  ];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#162340" strokeWidth="0.8" />
          </pattern>
          <radialGradient id="atpGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ATP_COLOR} stopOpacity="0.5" />
            <stop offset="100%" stopColor={ATP_COLOR} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* 标题 */}
        <text x={cx} y={68} fill={TEXT} fontSize={46} fontWeight="900" textAnchor="middle">
          细胞的能量货币：ATP
        </text>

        {/* ── 场景 0: ATP 结构 ── */}
        {scene === 0 && (
          <g opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}>
            {/* 腺苷 A */}
            <rect x={atpX - 60} y={atpY - 35} width={80} height={70} rx={12} fill="#2a6f97" opacity={structReveal} />
            <text x={atpX - 20} y={atpY + 5} fill={TEXT} fontSize={28} fontWeight="bold" textAnchor="middle">A</text>
            <text x={atpX - 20} y={atpY + 30} fill="#8ecae6" fontSize={14} textAnchor="middle">腺苷</text>

            {/* 3 个磷酸基团 */}
            {[0, 1, 2].map((i) => {
              const px = atpX + 60 + i * 100;
              const delay = i * 0.2;
              const reveal = interpolate(structReveal, [delay, delay + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const isHighEnergy = i > 0;
              return (
                <g key={i} opacity={reveal}>
                  {/* 连接线 */}
                  {i === 0 && <line x1={atpX + 20} y1={atpY} x2={px - 25} y2={atpY} stroke="#aaa" strokeWidth={3} />}
                  {i > 0 && (
                    <g>
                      <line x1={px - 100 + 25} y1={atpY} x2={px - 25} y2={atpY} stroke={ATP_COLOR} strokeWidth={4} strokeDasharray="8,4" />
                      <text x={px - 50} y={atpY - 12} fill={ATP_COLOR} fontSize={18} textAnchor="middle" fontWeight="bold">~</text>
                    </g>
                  )}
                  {/* 磷酸基 */}
                  <circle cx={px} cy={atpY} r={25} fill={isHighEnergy ? ATP_COLOR : '#6c8fa8'} opacity={0.9} />
                  <text x={px} y={atpY + 6} fill={TEXT} fontSize={22} fontWeight="bold" textAnchor="middle">P</text>
                </g>
              );
            })}

            {/* 标注 */}
            <text x={atpX + 160} y={atpY + 70} fill={ATP_COLOR} fontSize={20} textAnchor="middle">高能磷酸键（~）</text>
          </g>
        )}

        {/* ── 场景 1: ATP 水解 ── */}
        {scene === 1 && (
          <g opacity={interpolate(frame, [240, 270], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 酶 */}
            <ellipse cx={cx} cy={cy - 120} rx={60} ry={30} fill={ENZYME} opacity={0.85} />
            <text x={cx} y={cy - 115} fill={BG} fontSize={18} fontWeight="bold" textAnchor="middle">ATP水解酶</text>

            {/* ATP → ADP + Pi */}
            {/* ADP 部分 */}
            <g transform={`translate(${interpolate(bondBreak, [0, 1], [0, -80])}, 0)`}>
              <rect x={cx - 250} y={cy - 30} width={60} height={60} rx={10} fill="#2a6f97" />
              <text x={cx - 220} y={cy + 5} fill={TEXT} fontSize={24} fontWeight="bold" textAnchor="middle">A</text>
              <circle cx={cx - 155} cy={cy} r={22} fill="#6c8fa8" />
              <text x={cx - 155} y={cy + 6} fill={TEXT} fontSize={20} fontWeight="bold" textAnchor="middle">P</text>
              <circle cx={cx - 95} cy={cy} r={22} fill={ATP_COLOR} />
              <text x={cx - 95} y={cy + 6} fill={TEXT} fontSize={20} fontWeight="bold" textAnchor="middle">P</text>
              <text x={cx - 160} y={cy + 55} fill={ADP_COLOR} fontSize={22} fontWeight="bold" textAnchor="middle">ADP</text>
            </g>

            {/* Pi 飞出 */}
            <g transform={`translate(${interpolate(bondBreak, [0, 1], [0, 120])}, ${interpolate(bondBreak, [0, 1], [0, 50])})`}>
              <circle cx={cx + 80} cy={cy} r={22} fill={ATP_COLOR} />
              <text x={cx + 80} y={cy + 6} fill={TEXT} fontSize={20} fontWeight="bold" textAnchor="middle">Pi</text>
            </g>

            {/* 能量爆发粒子 */}
            {bondBreak > 0.3 && Array.from({length: 8}).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const dist = interpolate(bondBreak, [0.3, 1], [0, 120], {extrapolateLeft: 'clamp'});
              const px = cx + Math.cos(angle) * dist;
              const py = cy + Math.sin(angle) * dist;
              return <EnergyParticle key={i} x={px} y={py} opacity={1 - bondBreak} size={6} />;
            })}

            {/* 能量文字 */}
            <text x={cx} y={cy + 110} fill={ENERGY} fontSize={28} fontWeight="bold" textAnchor="middle" opacity={bondBreak}>
              释放能量！
            </text>
          </g>
        )}

        {/* ── 场景 2: ATP⇌ADP循环 ── */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [480, 510], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 循环圆环 */}
            <circle cx={cx} cy={cy} r={180} fill="none" stroke="#2a3f5f" strokeWidth={3} strokeDasharray="12,6" />

            {/* ATP 在圆环上运动 */}
            <g transform={`translate(${cx + Math.cos(cycleAngle) * 180}, ${cy + Math.sin(cycleAngle) * 180})`}>
              <circle r={30} fill={ATP_COLOR} opacity={0.9} />
              <text y={6} fill={TEXT} fontSize={18} fontWeight="bold" textAnchor="middle">ATP</text>
            </g>

            {/* ADP 对称位置 */}
            <g transform={`translate(${cx + Math.cos(cycleAngle + Math.PI) * 180}, ${cy + Math.sin(cycleAngle + Math.PI) * 180})`}>
              <circle r={30} fill={ADP_COLOR} opacity={0.9} />
              <text y={6} fill={TEXT} fontSize={18} fontWeight="bold" textAnchor="middle">ADP</text>
            </g>

            {/* 上方：合成 */}
            <text x={cx} y={cy - 200} fill={ADP_COLOR} fontSize={22} fontWeight="bold" textAnchor="middle">合成（光合/呼吸提供能量）</text>
            {/* 下方：水解 */}
            <text x={cx} y={cy + 230} fill={ATP_COLOR} fontSize={22} fontWeight="bold" textAnchor="middle">水解（细胞生命活动利用能量）</text>

            {/* 箭头 */}
            <path d={`M${cx - 30} ${cy - 185} A180 180 0 0 1 ${cx + 30} ${cy - 185}`} fill="none" stroke={ADP_COLOR} strokeWidth={3} markerEnd="url(#arrG)" />
            <path d={`M${cx + 30} ${cy + 215} A180 180 0 0 1 ${cx - 30} ${cy + 215}`} fill="none" stroke={ATP_COLOR} strokeWidth={3} markerEnd="url(#arrO)" />
            <defs>
              <marker id="arrG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={ADP_COLOR} /></marker>
              <marker id="arrO" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={ATP_COLOR} /></marker>
            </defs>
          </g>
        )}

        {/* 底部信息栏 */}
        <rect x={60} y={height - 120} width={width - 120} height={80} rx={16} fill="rgba(255,107,53,0.12)" stroke={ATP_COLOR} strokeWidth={1.5} />
        <text x={cx} y={height - 85} fill={ATP_COLOR} fontSize={32} fontWeight="900" textAnchor="middle">{titles[scene]}</text>
        <text x={cx} y={height - 52} fill="#bfe6e0" fontSize={20} textAnchor="middle">{subtitles[scene]}</text>
      </svg>
    </AbsoluteFill>
  );
};
