import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0a1628';
const RIBOSOME = '#a7c957';
const ER_COLOR = '#e76f51';
const GOLGI_COLOR = '#f4a261';
const VESICLE = '#ffd166';
const MEMBRANE_C = '#3a8f7a';
const TEXT = '#fffaf0';

/* 囊泡 */
const Vesicle: React.FC<{x: number; y: number; r: number; color: string; label?: string}> = ({x, y, r, color, label}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} stroke={color} strokeWidth={1.5} />
    {label && <text x={x} y={y + 4} fill="#000" fontSize={r > 12 ? 11 : 9} fontWeight="bold" textAnchor="middle">{label}</text>}
  </g>
);

export const SecretoryPathway: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  /* 5个阶段:
     0-5s 核糖体合成
     5-10s 内质网加工
     10-15s 出芽运输
     15-20s 高尔基体加工
     20-24s 分泌出细胞 */
  const scene = t < 5 ? 0 : t < 10 ? 1 : t < 15 ? 2 : t < 20 ? 3 : 4;

  /* 各细胞器位置 */
  const riboX = 300, riboY = cy - 40;
  const erX = 580, erY = cy;
  const golgiX = 960, golgiY = cy;
  const memX = 1400, memY = cy;

  /* 路径进度 */
  const vesicle1Progress = interpolate(frame, [300, 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vesicle2Progress = interpolate(frame, [600, 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const titles = [
    '① 核糖体合成多肽链',
    '② 内质网初步加工折叠',
    '③ 转运囊泡出芽运输',
    '④ 高尔基体进一步加工分拣',
    '⑤ 分泌囊泡与细胞膜融合分泌'
  ];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#162340" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <text x={cx} y={64} fill={TEXT} fontSize={44} fontWeight="900" textAnchor="middle">
          分泌蛋白的合成和运输
        </text>
        <text x={cx} y={100} fill="#6c8fa8" fontSize={22} textAnchor="middle">
          核糖体 → 内质网 → 高尔基体 → 细胞膜（生物膜系统协作）
        </text>

        {/* ── 连接线（流程箭头） ── */}
        <line x1={riboX + 40} y1={cy} x2={erX - 80} y2={cy} stroke="#333" strokeWidth={2} strokeDasharray="8,4" />
        <line x1={erX + 120} y1={cy} x2={golgiX - 80} y2={cy} stroke="#333" strokeWidth={2} strokeDasharray="8,4" />
        <line x1={golgiX + 100} y1={cy} x2={memX - 40} y2={cy} stroke="#333" strokeWidth={2} strokeDasharray="8,4" />

        {/* ── 核糖体 ── */}
        <g opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}>
          <circle cx={riboX} cy={riboY - 12} r={18} fill={RIBOSOME} opacity={0.9} />
          <circle cx={riboX} cy={riboY + 14} r={22} fill={RIBOSOME} opacity={0.7} />
          <text x={riboX} y={riboY + 60} fill={RIBOSOME} fontSize={18} fontWeight="bold" textAnchor="middle">核糖体</text>
          {/* 合成多肽链 */}
          {scene === 0 && (() => {
            const chainLen = interpolate(frame, [30, 150], [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return Array.from({length: Math.floor(chainLen)}).map((_, i) => (
              <circle key={i} cx={riboX + 30 + i * 16} cy={riboY + Math.sin(i * 0.8) * 8} r={6} fill="#ef476f" opacity={0.8} />
            ));
          })()}
        </g>

        {/* ── 内质网 ── */}
        <g opacity={interpolate(frame, [60, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          {/* 弯曲管道 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${erX - 60} ${erY - 60 + i * 30} Q${erX} ${erY - 50 + i * 30 + (i % 2 ? 15 : -15)} ${erX + 100} ${erY - 60 + i * 30}`} fill="none" stroke={ER_COLOR} strokeWidth={3} opacity={0.7} />
          ))}
          {/* 表面核糖体小点 */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={erX - 40 + i * 30} cy={erY - 55 + (i % 3) * 30} r={4} fill={RIBOSOME} opacity={0.6} />
          ))}
          <text x={erX + 20} y={erY + 80} fill={ER_COLOR} fontSize={18} fontWeight="bold" textAnchor="middle">内质网</text>
          {scene === 1 && <text x={erX + 20} y={erY + 105} fill="#888" fontSize={14} textAnchor="middle">折叠 + 加糖基</text>}
        </g>

        {/* ── 转运囊泡（场景 2） ── */}
        {scene >= 2 && (
          <Vesicle
            x={interpolate(vesicle1Progress, [0, 1], [erX + 120, golgiX - 80])}
            y={interpolate(vesicle1Progress, [0, 0.5, 1], [cy, cy - 50, cy])}
            r={16}
            color={VESICLE}
            label="蛋白"
          />
        )}

        {/* ── 高尔基体 ── */}
        <g opacity={interpolate(frame, [90, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={golgiX} cy={golgiY - 30 + i * 20} rx={70 - i * 5} ry={6} fill={GOLGI_COLOR} opacity={0.6 + i * 0.1} />
          ))}
          <text x={golgiX} y={golgiY + 70} fill={GOLGI_COLOR} fontSize={18} fontWeight="bold" textAnchor="middle">高尔基体</text>
          {scene === 3 && <text x={golgiX} y={golgiY + 95} fill="#888" fontSize={14} textAnchor="middle">加工分拣 + 打包</text>}
        </g>

        {/* ── 分泌囊泡（场景 4） ── */}
        {scene >= 4 && (
          <Vesicle
            x={interpolate(vesicle2Progress, [0, 1], [golgiX + 100, memX - 20])}
            y={interpolate(vesicle2Progress, [0, 0.5, 1], [cy, cy - 40, cy])}
            r={18}
            color={VESICLE}
            label="分泌"
          />
        )}

        {/* ── 细胞膜 ── */}
        <g opacity={interpolate(frame, [120, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <rect x={memX - 15} y={cy - 200} width={30} height={400} rx={15} fill={MEMBRANE_C} opacity={0.3} />
          <text x={memX} y={cy + 230} fill={MEMBRANE_C} fontSize={18} fontWeight="bold" textAnchor="middle">细胞膜</text>
          {/* 融合效果 */}
          {scene === 4 && vesicle2Progress > 0.8 && (
            <g>
              <circle cx={memX} cy={cy} r={interpolate(vesicle2Progress, [0.8, 1], [18, 40])} fill={VESICLE} opacity={interpolate(vesicle2Progress, [0.8, 1], [0.8, 0])} />
              <text x={memX + 50} y={cy} fill={TEXT} fontSize={20} fontWeight="bold">胞吐!</text>
            </g>
          )}
        </g>

        {/* ── 高亮当前阶段 ── */}
        {scene === 0 && <rect x={riboX - 50} y={riboY - 60} width={180} height={140} rx={12} fill="none" stroke={RIBOSOME} strokeWidth={2.5} strokeDasharray="6,3" />}
        {scene === 1 && <rect x={erX - 70} y={erY - 75} width={200} height={150} rx={12} fill="none" stroke={ER_COLOR} strokeWidth={2.5} strokeDasharray="6,3" />}
        {scene === 3 && <rect x={golgiX - 85} y={golgiY - 50} width={170} height={120} rx={12} fill="none" stroke={GOLGI_COLOR} strokeWidth={2.5} strokeDasharray="6,3" />}
        {scene === 4 && <rect x={memX - 40} y={cy - 210} width={80} height={420} rx={12} fill="none" stroke={MEMBRANE_C} strokeWidth={2.5} strokeDasharray="6,3" />}

        {/* 底部信息栏 */}
        <rect x={60} y={height - 110} width={width - 120} height={70} rx={14} fill="rgba(231,111,81,0.12)" stroke={ER_COLOR} strokeWidth={1.5} />
        <text x={cx} y={height - 72} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>

        {/* 进度条 */}
        <rect x={60} y={height - 30} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 30} width={(width - 120) * (frame / 720)} height={6} rx={3} fill={ER_COLOR} />
      </svg>
    </AbsoluteFill>
  );
};
