import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0a1628';
const MEMBRANE = '#3a8f7a';
const PHOSPHO_HEAD = '#5ec4b0';
const PHOSPHO_TAIL = '#f0c040';
const MOLECULE_A = '#ef476f';
const MOLECULE_B = '#118ab2';
const CARRIER = '#ffd166';
const TEXT_COLOR = '#fffaf0';
const LABEL_BG = 'rgba(255,209,102,0.15)';

/* ─── 磷脂分子 ─── */
const Phospholipid: React.FC<{x: number; y: number; flip?: boolean; wobble: number}> = ({x, y, flip, wobble}) => {
  const dir = flip ? -1 : 1;
  const dy = Math.sin(wobble) * 3;
  return (
    <g transform={`translate(${x},${y + dy})`}>
      <circle r={7} fill={PHOSPHO_HEAD} />
      <line x1={-3} y1={0} x2={-3} y2={dir * 22} stroke={PHOSPHO_TAIL} strokeWidth={2.2} />
      <line x1={3} y1={0} x2={3} y2={dir * 22} stroke={PHOSPHO_TAIL} strokeWidth={2.2} />
    </g>
  );
};

/* ─── 小分子 ─── */
const SmallMolecule: React.FC<{x: number; y: number; color: string; label: string; r?: number}> = ({x, y, color, label, r = 12}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} opacity={0.92} />
    <text x={x} y={y + 4} fill="#fff" fontSize={10} textAnchor="middle" fontWeight="bold">{label}</text>
  </g>
);

export const MembraneTransport: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps; // seconds

  /* 阶段划分：0-8s 自由扩散 | 8-16s 协助扩散 | 16-24s 主动运输 */
  const scene = t < 8 ? 0 : t < 16 ? 1 : 2;

  /* 磷脂双分子层 Y 坐标 */
  const membraneY = height / 2;
  const lipidCount = 56;
  const lipidSpacing = (width - 200) / lipidCount;

  /* ─── 场景标题 ─── */
  const titles = ['自由扩散', '协助扩散（通道蛋白）', '主动运输（载体蛋白 + ATP）'];
  const subtitles = [
    '高浓度 → 低浓度 · 不需要能量 · 不需要载体',
    '高浓度 → 低浓度 · 不需要能量 · 需要通道蛋白',
    '低浓度 → 高浓度 · 需要能量（ATP）· 需要载体蛋白',
  ];

  /* ─── 自由扩散：O₂ 穿过膜 ─── */
  const diffusionProgress = interpolate(frame, [0, 240], [0, 1], {extrapolateRight: 'clamp'});
  const diffMolecules = [
    {startX: 300, startY: membraneY - 180, endX: 320, endY: membraneY + 160},
    {startX: 500, startY: membraneY - 140, endX: 480, endY: membraneY + 180},
    {startX: 700, startY: membraneY - 200, endX: 720, endY: membraneY + 140},
    {startX: 900, startY: membraneY - 160, endX: 880, endY: membraneY + 200},
  ];

  /* ─── 协助扩散：离子通过通道蛋白 ─── */
  const channelX = width / 2;
  const facilProgress = interpolate(frame, [240, 480], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  /* ─── 主动运输：分子逆浓度梯度 ─── */
  const activeProgress = interpolate(frame, [480, 720], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const carrierX = width / 2 + 200;

  /* ─── 标题淡入 ─── */
  const titleOpacity = (sceneIdx: number) => {
    const start = sceneIdx * 240;
    return interpolate(frame, [start, start + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  };

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* ─── 网格背景 ─── */}
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#162340" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* ─── 大标题 ─── */}
        <text x={width / 2} y={68} fill={TEXT_COLOR} fontSize={46} fontWeight="900" textAnchor="middle">
          细胞膜的物质运输方式
        </text>

        {/* ─── 浓度标注 ─── */}
        <text x={120} y={membraneY - 200} fill="#5ec4b0" fontSize={26} fontWeight="700">膜外（高浓度侧）</text>
        <text x={120} y={membraneY + 240} fill="#5ec4b0" fontSize={26} fontWeight="700">膜内（低浓度侧）</text>

        {/* ─── 磷脂双分子层 ─── */}
        {Array.from({length: lipidCount}).map((_, i) => {
          const lx = 100 + i * lipidSpacing;
          const wobble = t * 2.5 + i * 0.4;
          return (
            <React.Fragment key={i}>
              <Phospholipid x={lx} y={membraneY - 18} flip={false} wobble={wobble} />
              <Phospholipid x={lx} y={membraneY + 18} flip={true} wobble={wobble + 1} />
            </React.Fragment>
          );
        })}

        {/* ─── 膜背景色带 ─── */}
        <rect x={60} y={membraneY - 28} width={width - 120} height={56} fill={MEMBRANE} opacity={0.18} rx={6} />

        {/* ────────── 场景 0: 自由扩散 ────────── */}
        {scene === 0 && (
          <g opacity={titleOpacity(0)}>
            {diffMolecules.map((m, i) => {
              const delay = i * 0.15;
              const p = interpolate(diffusionProgress, [delay, delay + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const mx = interpolate(p, [0, 1], [m.startX, m.endX]);
              const my = interpolate(p, [0, 1], [m.startY, m.endY]);
              return <SmallMolecule key={i} x={mx} y={my} color={MOLECULE_A} label="O₂" />;
            })}
          </g>
        )}

        {/* ────────── 场景 1: 协助扩散 ────────── */}
        {scene === 1 && (
          <g opacity={titleOpacity(1)}>
            {/* 通道蛋白 */}
            <rect x={channelX - 18} y={membraneY - 40} width={36} height={80} rx={10} fill={CARRIER} opacity={0.85} />
            <text x={channelX} y={membraneY + 5} fill={BG} fontSize={12} textAnchor="middle" fontWeight="bold">通道</text>
            {/* 离子穿过通道 */}
            {[0, 1, 2].map((i) => {
              const delay = i * 0.25;
              const p = interpolate(facilProgress, [delay, delay + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const iy = interpolate(p, [0, 1], [membraneY - 160 - i * 30, membraneY + 140 + i * 30]);
              return <SmallMolecule key={i} x={channelX} y={iy} color={MOLECULE_B} label="Na⁺" r={10} />;
            })}
          </g>
        )}

        {/* ────────── 场景 2: 主动运输 ────────── */}
        {scene === 2 && (
          <g opacity={titleOpacity(2)}>
            {/* 载体蛋白 */}
            <ellipse cx={carrierX} cy={membraneY} rx={28} ry={38} fill={CARRIER} opacity={0.85} />
            <text x={carrierX} y={membraneY + 5} fill={BG} fontSize={11} textAnchor="middle" fontWeight="bold">载体</text>
            {/* ATP 能量爆发 */}
            {(() => {
              const atpBurst = interpolate(activeProgress, [0.2, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return atpBurst > 0 ? (
                <g>
                  <circle cx={carrierX + 50} cy={membraneY} r={interpolate(atpBurst, [0, 1], [5, 30])} fill="#ff6b35" opacity={1 - atpBurst} />
                  <text x={carrierX + 50} y={membraneY - 35} fill="#ff6b35" fontSize={18} fontWeight="bold" textAnchor="middle">ATP!</text>
                </g>
              ) : null;
            })()}
            {/* 分子逆浓度上升 */}
            {[0, 1].map((i) => {
              const delay = i * 0.3 + 0.3;
              const p = interpolate(activeProgress, [delay, delay + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const my = interpolate(p, [0, 1], [membraneY + 180 + i * 30, membraneY - 150 - i * 30]);
              return <SmallMolecule key={i} x={carrierX} y={my} color="#9b5de5" label="氨基酸" r={14} />;
            })}
            {/* 浓度箭头（逆方向） */}
            <line x1={carrierX - 60} y1={membraneY + 100} x2={carrierX - 60} y2={membraneY - 100} stroke="#ff6b35" strokeWidth={3} markerEnd="url(#arrowhead)" />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ff6b35" />
              </marker>
            </defs>
          </g>
        )}

        {/* ─── 底部信息栏 ─── */}
        <rect x={60} y={height - 120} width={width - 120} height={80} rx={16} fill={LABEL_BG} stroke={CARRIER} strokeWidth={1.5} />
        <text x={width / 2} y={height - 85} fill={CARRIER} fontSize={32} fontWeight="900" textAnchor="middle">
          {titles[scene]}
        </text>
        <text x={width / 2} y={height - 52} fill="#bfe6e0" fontSize={22} textAnchor="middle">
          {subtitles[scene]}
        </text>

        {/* ─── 阶段指示器 ─── */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={width / 2 - 30 + i * 30} cy={height - 20} r={6} fill={scene === i ? CARRIER : '#2a3f5f'} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
