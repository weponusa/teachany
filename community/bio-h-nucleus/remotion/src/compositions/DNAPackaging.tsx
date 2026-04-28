import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#080e1c';
const DNA_A = '#ef476f';
const DNA_B = '#118ab2';
const HISTONE = '#ffd166';
const CHROMATIN = '#6a4c93';
const CHROMOSOME = '#e63946';
const TEXT = '#fffaf0';

export const DNAPackaging: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  /* 5阶段: DNA双螺旋→核小体→螺线管→染色质→染色体 */
  const scene = t < 5 ? 0 : t < 10 ? 1 : t < 15 ? 2 : t < 20 ? 3 : 4;

  const titles = [
    'DNA 双螺旋结构',
    '核小体（DNA + 组蛋白八聚体）',
    '螺线管结构（每圈 6 个核小体）',
    '染色质纤维（30nm）',
    '染色体（高度螺旋化）'
  ];
  const scales = ['2nm', '11nm', '30nm', '300nm', '1400nm'];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#111a30" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <text x={cx} y={60} fill={TEXT} fontSize={44} fontWeight="900" textAnchor="middle">
          DNA 的包装层级
        </text>
        <text x={cx} y={95} fill="#6c8fa8" fontSize={20} textAnchor="middle">
          从 2nm 的双螺旋到 1400nm 的染色体——压缩约 10000 倍
        </text>

        {/* ── 场景 0: DNA 双螺旋 ── */}
        {scene === 0 && (
          <g opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}>
            {Array.from({length: 40}).map((_, i) => {
              const y = 160 + i * 20;
              const phase = i * 0.5 + t * 2;
              const x1 = cx - 80 + Math.sin(phase) * 60;
              const x2 = cx + 80 + Math.sin(phase + Math.PI) * 60;
              return (
                <g key={i}>
                  <circle cx={x1} cy={y} r={6} fill={DNA_A} opacity={0.85} />
                  <circle cx={x2} cy={y} r={6} fill={DNA_B} opacity={0.85} />
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="#555" strokeWidth={1.5} opacity={0.4} />
                </g>
              );
            })}
            <text x={cx - 180} y={cy} fill={DNA_A} fontSize={18} fontWeight="bold">磷酸-脱氧核糖骨架</text>
            <text x={cx + 100} y={cy} fill={DNA_B} fontSize={18} fontWeight="bold">碱基对（A-T, G-C）</text>
          </g>
        )}

        {/* ── 场景 1: 核小体 ── */}
        {scene === 1 && (
          <g opacity={interpolate(frame, [150, 180], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {[0, 1, 2, 3, 4].map((i) => {
              const nx = 300 + i * 280;
              const ny = cy;
              const reveal = interpolate(frame - 150, [i * 15, i * 15 + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  {/* 组蛋白八聚体 */}
                  <circle cx={nx} cy={ny} r={35} fill={HISTONE} opacity={0.8} />
                  <text x={nx} y={ny - 5} fill={BG} fontSize={12} fontWeight="bold" textAnchor="middle">组蛋白</text>
                  <text x={nx} y={ny + 10} fill={BG} fontSize={10} textAnchor="middle">八聚体</text>
                  {/* DNA缠绕 1.75圈 */}
                  <path d={`M${nx - 50} ${ny - 10} A35 35 0 1 1 ${nx - 50} ${ny + 10}`} fill="none" stroke={DNA_A} strokeWidth={3} />
                  <path d={`M${nx - 48} ${ny + 12} A37 37 0 1 1 ${nx + 50} ${ny + 5}`} fill="none" stroke={DNA_A} strokeWidth={3} opacity={0.6} />
                  {/* 连接线 */}
                  {i < 4 && <line x1={nx + 50} y1={ny} x2={nx + 230} y2={ny} stroke={DNA_A} strokeWidth={2} strokeDasharray="6,4" />}
                </g>
              );
            })}
            <text x={cx} y={cy + 100} fill="#888" fontSize={18} textAnchor="middle">DNA 缠绕组蛋白 1.75 圈 → 核小体（"串珠"结构）</text>
          </g>
        )}

        {/* ── 场景 2: 螺线管 ── */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [300, 330], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {Array.from({length: 12}).map((_, i) => {
              const angle = i * 0.52 + t * 0.5;
              const sx = cx + Math.cos(angle) * 80;
              const sy = 200 + i * 55;
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={22} fill={HISTONE} opacity={0.7} />
                  <circle cx={sx} cy={sy} r={28} fill="none" stroke={CHROMATIN} strokeWidth={3} opacity={0.5} />
                </g>
              );
            })}
            <text x={cx + 200} y={cy} fill={CHROMATIN} fontSize={22} fontWeight="bold">螺线管</text>
            <text x={cx + 200} y={cy + 30} fill="#888" fontSize={16}>每圈 6 个核小体</text>
            <text x={cx + 200} y={cy + 55} fill="#888" fontSize={16}>直径 ~30nm</text>
          </g>
        )}

        {/* ── 场景 3: 染色质 ── */}
        {scene === 3 && (
          <g opacity={interpolate(frame, [450, 480], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 不规则的染色质团 */}
            {Array.from({length: 30}).map((_, i) => {
              const angle = (i / 30) * Math.PI * 6;
              const r = 120 + Math.sin(i * 2.1) * 50;
              const px = cx + Math.cos(angle) * r * 0.8;
              const py = cy + Math.sin(angle) * r * 0.5;
              return <circle key={i} cx={px} cy={py} r={8 + Math.sin(i) * 3} fill={CHROMATIN} opacity={0.5 + Math.sin(i * 0.7) * 0.3} />;
            })}
            <text x={cx} y={cy} fill={TEXT} fontSize={24} fontWeight="bold" textAnchor="middle">染色质</text>
            <text x={cx} y={cy + 35} fill="#bbb" fontSize={16} textAnchor="middle">间期——松散状态</text>
          </g>
        )}

        {/* ── 场景 4: 染色体 ── */}
        {scene === 4 && (
          <g opacity={interpolate(frame, [600, 630], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* X 型染色体 */}
            <g transform={`translate(${cx}, ${cy})`}>
              {/* 左上臂 */}
              <rect x={-50} y={-180} width={35} height={170} rx={12} fill={CHROMOSOME} opacity={0.9} />
              {/* 右上臂 */}
              <rect x={15} y={-180} width={35} height={170} rx={12} fill={CHROMOSOME} opacity={0.85} />
              {/* 左下臂 */}
              <rect x={-50} y={15} width={35} height={170} rx={12} fill={CHROMOSOME} opacity={0.9} />
              {/* 右下臂 */}
              <rect x={15} y={15} width={35} height={170} rx={12} fill={CHROMOSOME} opacity={0.85} />
              {/* 着丝粒 */}
              <ellipse cx={0} cy={0} rx={55} ry={18} fill={HISTONE} opacity={0.7} />
              <text x={0} y={5} fill={BG} fontSize={12} fontWeight="bold" textAnchor="middle">着丝粒</text>
              {/* 标注 */}
              <text x={60} y={-100} fill={TEXT} fontSize={16}>姐妹染色单体</text>
              <line x1={50} y1={-95} x2={38} y2={-80} stroke="#888" strokeWidth={1} />
            </g>
            <text x={cx} y={cy + 230} fill={CHROMOSOME} fontSize={20} fontWeight="bold" textAnchor="middle">分裂期——高度螺旋化为染色体</text>
          </g>
        )}

        {/* ── 底部信息栏 ── */}
        <rect x={60} y={height - 120} width={width - 120} height={80} rx={16} fill="rgba(106,76,147,0.12)" stroke={CHROMATIN} strokeWidth={1.5} />
        <text x={cx} y={height - 88} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>
        <text x={cx} y={height - 55} fill={HISTONE} fontSize={22} textAnchor="middle">直径: {scales[scene]}</text>

        {/* 进度条 */}
        <rect x={60} y={height - 28} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 28} width={(width - 120) * (frame / 720)} height={6} rx={3} fill={CHROMATIN} />
      </svg>
    </AbsoluteFill>
  );
};
