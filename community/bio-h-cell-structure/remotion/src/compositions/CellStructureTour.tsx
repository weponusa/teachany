import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#081420';
const WALL = '#6a994e';
const MEMBRANE = '#3a8f7a';
const CYTOPLASM = 'rgba(144,224,239,0.12)';
const NUCLEUS = '#264653';
const NUCLEUS_BORDER = '#e9c46a';
const MITO = '#ef476f';
const CHLORO = '#2a9d8f';
const ER = '#e76f51';
const GOLGI = '#f4a261';
const TEXT = '#fffaf0';

interface Organelle {
  name: string;
  x: number;
  y: number;
  color: string;
  rx: number;
  ry: number;
  desc: string;
}

export const CellStructureTour: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;

  const cx = width / 2;
  const cy = height / 2 + 20;

  /* 阶段: 0-6s 细胞壁+膜 | 6-12s 细胞质+液泡 | 12-18s 细胞器 | 18-24s 细胞核 */
  const scene = t < 6 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;

  /* 脉动效果 */
  const pulse = Math.sin(t * 1.2) * 4;

  /* 细胞器列表 */
  const organelles: Organelle[] = [
    {name: '线粒体', x: cx - 220, y: cy - 80, color: MITO, rx: 40, ry: 20, desc: '有氧呼吸主要场所'},
    {name: '叶绿体', x: cx + 200, y: cy - 100, color: CHLORO, rx: 45, ry: 22, desc: '光合作用场所'},
    {name: '内质网', x: cx - 150, y: cy + 120, color: ER, rx: 55, ry: 15, desc: '蛋白质加工转运'},
    {name: '高尔基体', x: cx + 120, y: cy + 100, color: GOLGI, rx: 35, ry: 18, desc: '分泌蛋白加工分拣'},
    {name: '核糖体', x: cx - 60, y: cy + 60, color: '#a7c957', rx: 8, ry: 8, desc: '蛋白质合成场所'},
  ];

  const titles = ['细胞壁与细胞膜', '细胞质基质与液泡', '细胞器家族', '细胞核——控制中心'];
  const subtitles = [
    '植物细胞特有细胞壁（支持保护）+ 所有细胞共有细胞膜（选择透过性）',
    '细胞质基质含大量水、离子和有机分子 · 液泡维持细胞渗透压',
    '线粒体（呼吸）· 叶绿体（光合）· 内质网 · 高尔基体 · 核糖体',
    '核膜双层膜（核孔）· 染色质（DNA + 蛋白质）· 核仁',
  ];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#0f2030" strokeWidth="0.6" />
          </pattern>
          <radialGradient id="cytoGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#90e0ef" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#90e0ef" stopOpacity="0.02" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <text x={cx} y={60} fill={TEXT} fontSize={44} fontWeight="900" textAnchor="middle">
          植物细胞的结构层次
        </text>

        {/* ── 细胞壁 ── */}
        <ellipse cx={cx} cy={cy} rx={380 + pulse} ry={280 + pulse} fill="none" stroke={WALL} strokeWidth={scene >= 0 ? 8 : 0} strokeDasharray={scene === 0 ? 'none' : '12,4'} opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})} />
        {scene === 0 && <text x={cx + 390} y={cy - 20} fill={WALL} fontSize={20} fontWeight="bold">细胞壁</text>}

        {/* ── 细胞膜 ── */}
        <ellipse cx={cx} cy={cy} rx={365 + pulse} ry={265 + pulse} fill="none" stroke={MEMBRANE} strokeWidth={scene >= 0 ? 4 : 2} opacity={interpolate(frame, [30, 60], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        {scene === 0 && <text x={cx + 375} y={cy + 20} fill={MEMBRANE} fontSize={18} fontWeight="bold">细胞膜</text>}

        {/* ── 细胞质基质 ── */}
        <ellipse cx={cx} cy={cy} rx={358} ry={258} fill="url(#cytoGrad)" opacity={scene >= 1 ? 1 : 0.3} />

        {/* ── 液泡（场景 1） ── */}
        {scene >= 1 && (
          <g opacity={interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <ellipse cx={cx + 40} cy={cy + 10} rx={160} ry={120} fill="rgba(168,218,220,0.2)" stroke="#a8dadc" strokeWidth={2} />
            <text x={cx + 40} y={cy + 15} fill="#a8dadc" fontSize={22} fontWeight="bold" textAnchor="middle">液泡</text>
            <text x={cx + 40} y={cy + 42} fill="#76c2c5" fontSize={14} textAnchor="middle">含有机酸、花青素等</text>
          </g>
        )}

        {/* ── 细胞器（场景 2） ── */}
        {scene >= 2 && organelles.map((org, i) => {
          const delay = i * 0.12;
          const reveal = interpolate(frame - 360, [delay * fps, (delay + 0.4) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={reveal}>
              <ellipse cx={org.x} cy={org.y} rx={org.rx} ry={org.ry} fill={org.color} opacity={0.85} />
              <text x={org.x} y={org.y + 4} fill={TEXT} fontSize={org.rx > 20 ? 14 : 10} fontWeight="bold" textAnchor="middle">{org.name}</text>
              {scene === 2 && (
                <text x={org.x} y={org.y + org.ry + 18} fill={org.color} fontSize={13} textAnchor="middle">{org.desc}</text>
              )}
            </g>
          );
        })}

        {/* ── 细胞核（场景 3） ── */}
        {scene >= 1 && (
          <g opacity={interpolate(frame, [scene === 3 ? 540 : 120, scene === 3 ? 570 : 180], [scene === 3 ? 0.4 : 0, scene === 3 ? 1 : 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <circle cx={cx - 80} cy={cy - 30} r={75 + (scene === 3 ? pulse : 0)} fill={NUCLEUS} stroke={NUCLEUS_BORDER} strokeWidth={scene === 3 ? 4 : 2} />
            <text x={cx - 80} y={cy - 35} fill={NUCLEUS_BORDER} fontSize={20} fontWeight="bold" textAnchor="middle">细胞核</text>
            {scene === 3 && (
              <>
                {/* 核仁 */}
                <circle cx={cx - 95} cy={cy - 50} r={18} fill="#e9c46a" opacity={0.6} />
                <text x={cx - 95} y={cy - 46} fill={BG} fontSize={12} fontWeight="bold" textAnchor="middle">核仁</text>
                {/* 核孔 */}
                {[0, 1, 2, 3].map((j) => {
                  const angle = (j / 4) * Math.PI * 2 + t * 0.3;
                  const px = cx - 80 + Math.cos(angle) * 75;
                  const py = cy - 30 + Math.sin(angle) * 75;
                  return <circle key={j} cx={px} cy={py} r={5} fill={TEXT} opacity={0.7} />;
                })}
                <text x={cx - 80} y={cy - 5} fill="#bbb" fontSize={13} textAnchor="middle">核孔（物质进出通道）</text>
                {/* 染色质 */}
                <path d={`M${cx - 110} ${cy - 20} Q${cx - 90} ${cy - 10} ${cx - 70} ${cy - 25} T${cx - 50} ${cy - 15}`} fill="none" stroke="#e76f51" strokeWidth={2.5} opacity={0.7} />
                <text x={cx - 50} y={cy - 5} fill="#e76f51" fontSize={12}>染色质</text>
              </>
            )}
          </g>
        )}

        {/* 底部信息栏 */}
        <rect x={60} y={height - 120} width={width - 120} height={80} rx={16} fill="rgba(106,153,78,0.12)" stroke={WALL} strokeWidth={1.5} />
        <text x={cx} y={height - 85} fill={WALL} fontSize={30} fontWeight="900" textAnchor="middle">{titles[scene]}</text>
        <text x={cx} y={height - 52} fill="#bfe6e0" fontSize={19} textAnchor="middle">{subtitles[scene]}</text>
      </svg>
    </AbsoluteFill>
  );
};
