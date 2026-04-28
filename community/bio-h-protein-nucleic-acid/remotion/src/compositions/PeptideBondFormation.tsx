import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0b1a2e';
const AMINO = '#118ab2';
const CARBOXYL = '#ef476f';
const PEPTIDE = '#ffd166';
const R_GROUP = '#6a4c93';
const WATER = '#90e0ef';
const TEXT = '#fffaf0';

/* 氨基酸结构 */
const AminoAcid: React.FC<{x: number; y: number; label: string; rColor: string; scale?: number}> = ({x, y, label, rColor, scale = 1}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* 氨基 -NH₂ */}
    <circle cx={-50} cy={0} r={20} fill={AMINO} opacity={0.85} />
    <text x={-50} y={5} fill={TEXT} fontSize={12} fontWeight="bold" textAnchor="middle">NH₂</text>
    {/* 中心碳 */}
    <circle cx={0} cy={0} r={16} fill="#555" />
    <text x={0} y={5} fill={TEXT} fontSize={14} fontWeight="bold" textAnchor="middle">C</text>
    {/* 羧基 -COOH */}
    <circle cx={50} cy={0} r={22} fill={CARBOXYL} opacity={0.85} />
    <text x={50} y={5} fill={TEXT} fontSize={11} fontWeight="bold" textAnchor="middle">COOH</text>
    {/* R 基 */}
    <circle cx={0} cy={-40} r={16} fill={rColor} opacity={0.8} />
    <text x={0} y={-36} fill={TEXT} fontSize={10} fontWeight="bold" textAnchor="middle">R</text>
    {/* 连接线 */}
    <line x1={-30} y1={0} x2={-16} y2={0} stroke="#888" strokeWidth={2} />
    <line x1={16} y1={0} x2={28} y2={0} stroke="#888" strokeWidth={2} />
    <line x1={0} y1={-16} x2={0} y2={-24} stroke="#888" strokeWidth={2} />
    {/* H */}
    <circle cx={0} cy={35} r={10} fill="#adb5bd" />
    <text x={0} y={39} fill={BG} fontSize={10} fontWeight="bold" textAnchor="middle">H</text>
    <line x1={0} y1={16} x2={0} y2={25} stroke="#888" strokeWidth={2} />
    {/* 标签 */}
    <text x={0} y={65} fill="#888" fontSize={13} textAnchor="middle">{label}</text>
  </g>
);

export const PeptideBondFormation: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  /* 4阶段: 0-6s 氨基酸结构 | 6-12s 脱水缩合 | 12-18s 多肽链 | 18-24s 蛋白质折叠 */
  const scene = t < 6 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;

  /* 脱水缩合进度 */
  const condProgress = interpolate(frame, [180, 330], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const titles = ['氨基酸的结构通式', '脱水缩合反应形成肽键', '多肽链（氨基酸数-1 = 肽键数）', '蛋白质的四级结构'];
  const subtitles = [
    '氨基（-NH₂）+ 羧基（-COOH）+ R基 + H 连接在同一个碳原子上',
    '一个氨基酸的羧基（-COOH）与另一个氨基酸的氨基（-NH₂）脱去一分子水',
    'n 个氨基酸脱水缩合形成 (n-1) 个肽键，脱去 (n-1) 个水分子',
    '一级→二级→三级→四级：肽链折叠形成具有特定功能的蛋白质',
  ];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#162340" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <text x={cx} y={60} fill={TEXT} fontSize={44} fontWeight="900" textAnchor="middle">
          蛋白质的合成：脱水缩合反应
        </text>

        {/* ── 场景 0: 氨基酸结构 ── */}
        {scene === 0 && (
          <g opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}>
            <AminoAcid x={cx} y={cy} label="氨基酸通式" rColor={R_GROUP} scale={1.8} />
            {/* 标注 */}
            <text x={cx - 200} y={cy + 160} fill={AMINO} fontSize={20} fontWeight="bold">氨基（-NH₂）</text>
            <text x={cx + 100} y={cy + 160} fill={CARBOXYL} fontSize={20} fontWeight="bold">羧基（-COOH）</text>
            <text x={cx} y={cy - 150} fill={R_GROUP} fontSize={20} fontWeight="bold" textAnchor="middle">R基（侧链，决定种类）</text>
          </g>
        )}

        {/* ── 场景 1: 脱水缩合 ── */}
        {scene === 1 && (
          <g opacity={interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 两个氨基酸靠近 */}
            <g transform={`translate(${interpolate(condProgress, [0, 0.4], [0, 60], {extrapolateRight: 'clamp'})}, 0)`}>
              <AminoAcid x={cx - 250} y={cy - 30} label="氨基酸 ①" rColor="#6a4c93" />
            </g>
            <g transform={`translate(${interpolate(condProgress, [0, 0.4], [0, -60], {extrapolateRight: 'clamp'})}, 0)`}>
              <AminoAcid x={cx + 250} y={cy - 30} label="氨基酸 ②" rColor="#bc6c25" />
            </g>

            {/* 脱水反应 */}
            {condProgress > 0.4 && (
              <g>
                {/* 肽键形成 */}
                <rect x={cx - 30} y={cy - 40} width={60} height={30} rx={6} fill={PEPTIDE} opacity={interpolate(condProgress, [0.4, 0.7], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
                <text x={cx} y={cy - 20} fill={BG} fontSize={13} fontWeight="bold" textAnchor="middle">C-N</text>
                <text x={cx} y={cy + 10} fill={PEPTIDE} fontSize={16} fontWeight="bold" textAnchor="middle">肽键</text>
              </g>
            )}

            {/* 水分子飞出 */}
            {condProgress > 0.5 && (() => {
              const waterY = interpolate(condProgress, [0.5, 1], [cy, cy + 180], {extrapolateLeft: 'clamp'});
              const waterOpacity = interpolate(condProgress, [0.5, 0.7, 1], [0, 1, 0.3], {extrapolateLeft: 'clamp'});
              return (
                <g opacity={waterOpacity}>
                  <circle cx={cx} cy={waterY} r={22} fill={WATER} opacity={0.8} />
                  <text x={cx} y={waterY + 5} fill={BG} fontSize={14} fontWeight="bold" textAnchor="middle">H₂O</text>
                  <text x={cx + 40} y={waterY + 5} fill={WATER} fontSize={16} fontWeight="bold">← 脱去一分子水</text>
                </g>
              );
            })()}

            {/* 反应方程式 */}
            <text x={cx} y={cy + 250} fill="#888" fontSize={18} textAnchor="middle">
              -COOH + H₂N- → -CO-NH- + H₂O
            </text>
          </g>
        )}

        {/* ── 场景 2: 多肽链 ── */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [360, 390], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 串联的氨基酸 */}
            {Array.from({length: 8}).map((_, i) => {
              const ax = 200 + i * 190;
              const ay = cy - 20 + Math.sin(i * 0.6 + t) * 15;
              const reveal = interpolate(frame - 360, [i * 12, i * 12 + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <circle cx={ax} cy={ay} r={22} fill={i % 2 ? '#6a4c93' : '#bc6c25'} opacity={0.8} />
                  <text x={ax} y={ay + 5} fill={TEXT} fontSize={11} fontWeight="bold" textAnchor="middle">AA{i + 1}</text>
                  {/* 肽键连接 */}
                  {i < 7 && <rect x={ax + 22} y={ay - 5} width={190 - 44} height={10} rx={5} fill={PEPTIDE} opacity={0.6} />}
                  {i < 7 && <text x={ax + 95} y={ay + 4} fill={BG} fontSize={9} fontWeight="bold" textAnchor="middle">肽键</text>}
                </g>
              );
            })}
            {/* 公式 */}
            <text x={cx} y={cy + 120} fill="#ffd166" fontSize={24} fontWeight="bold" textAnchor="middle">
              8 个氨基酸 → 7 个肽键 + 7 个 H₂O
            </text>
            <text x={cx} y={cy + 160} fill="#888" fontSize={18} textAnchor="middle">
              分子量减少 = 脱水数 × 18
            </text>
          </g>
        )}

        {/* ── 场景 3: 蛋白质折叠 ── */}
        {scene === 3 && (
          <g opacity={interpolate(frame, [540, 570], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 四级结构依次展示 */}
            {[
              {name: '一级结构', desc: '氨基酸序列', x: 250, color: '#118ab2'},
              {name: '二级结构', desc: 'α-螺旋、β-折叠', x: 600, color: '#2a9d8f'},
              {name: '三级结构', desc: '空间构象', x: 950, color: '#e76f51'},
              {name: '四级结构', desc: '多亚基组装', x: 1300, color: '#ef476f'},
            ].map((lvl, i) => {
              const reveal = interpolate(frame - 540, [i * 30, i * 30 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={lvl.x - 80} y={cy - 80} width={160} height={160} rx={16} fill={lvl.color} opacity={0.12} stroke={lvl.color} strokeWidth={2} />
                  {/* 简化图形 */}
                  {i === 0 && <line x1={lvl.x - 50} y1={cy} x2={lvl.x + 50} y2={cy} stroke={lvl.color} strokeWidth={4} />}
                  {i === 1 && <path d={`M${lvl.x - 40} ${cy - 20} C${lvl.x - 20} ${cy + 20} ${lvl.x + 20} ${cy - 20} ${lvl.x + 40} ${cy + 20}`} fill="none" stroke={lvl.color} strokeWidth={4} />}
                  {i === 2 && <ellipse cx={lvl.x} cy={cy} rx={40} ry={30} fill="none" stroke={lvl.color} strokeWidth={4} />}
                  {i === 3 && (
                    <>
                      <circle cx={lvl.x - 20} cy={cy - 15} r={20} fill="none" stroke={lvl.color} strokeWidth={3} />
                      <circle cx={lvl.x + 20} cy={cy + 15} r={20} fill="none" stroke={lvl.color} strokeWidth={3} />
                    </>
                  )}
                  <text x={lvl.x} y={cy + 100} fill={lvl.color} fontSize={18} fontWeight="bold" textAnchor="middle">{lvl.name}</text>
                  <text x={lvl.x} y={cy + 125} fill="#888" fontSize={14} textAnchor="middle">{lvl.desc}</text>
                  {/* 箭头 */}
                  {i < 3 && <line x1={lvl.x + 85} y1={cy} x2={[600, 950, 1300][i] - 85} y2={cy} stroke="#555" strokeWidth={2} markerEnd="url(#arr)" />}
                </g>
              );
            })}
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#555" /></marker>
            </defs>
          </g>
        )}

        {/* 底部 */}
        <rect x={60} y={height - 120} width={width - 120} height={80} rx={16} fill="rgba(17,138,178,0.1)" stroke={AMINO} strokeWidth={1.5} />
        <text x={cx} y={height - 88} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>
        <text x={cx} y={height - 56} fill="#bfe6e0" fontSize={18} textAnchor="middle">{subtitles[scene]}</text>

        <rect x={60} y={height - 28} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 28} width={(width - 120) * (frame / 720)} height={6} rx={3} fill={AMINO} />
      </svg>
    </AbsoluteFill>
  );
};
