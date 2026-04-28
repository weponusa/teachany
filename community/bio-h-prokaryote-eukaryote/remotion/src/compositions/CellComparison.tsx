import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0a1628';
const PROKA = '#e76f51';
const EUKA = '#2a9d8f';
const TEXT = '#fffaf0';
const LABEL = '#6c8fa8';

export const CellComparison: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const half = width / 2;

  /* 4阶段: 0-6s 外形 | 6-12s DNA区域 | 12-18s 细胞器 | 18-24s 总结 */
  const scene = t < 6 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;

  /* 原核中心 */
  const pX = half / 2 + 60;
  const pY = height / 2;
  /* 真核中心 */
  const eX = half + half / 2 - 60;
  const eY = height / 2;

  const titles = ['细胞外形与大小', 'DNA 存在形式', '细胞器差异', '原核 vs 真核——总结对比'];

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="#162340" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* 标题 */}
        <text x={width / 2} y={60} fill={TEXT} fontSize={44} fontWeight="900" textAnchor="middle">
          原核细胞 vs 真核细胞
        </text>

        {/* 分割线 */}
        <line x1={half} y1={100} x2={half} y2={height - 130} stroke="#2a3f5f" strokeWidth={2} strokeDasharray="10,6" />

        {/* 左标题 */}
        <text x={pX} y={130} fill={PROKA} fontSize={28} fontWeight="bold" textAnchor="middle">原核细胞</text>
        <text x={pX} y={158} fill={LABEL} fontSize={16} textAnchor="middle">如：大肠杆菌、蓝藻</text>
        {/* 右标题 */}
        <text x={eX} y={130} fill={EUKA} fontSize={28} fontWeight="bold" textAnchor="middle">真核细胞</text>
        <text x={eX} y={158} fill={LABEL} fontSize={16} textAnchor="middle">如：动物细胞、植物细胞</text>

        {/* ── 场景 0: 外形 ── */}
        {scene >= 0 && (
          <g opacity={interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}>
            {/* 原核——小、杆状 */}
            <ellipse cx={pX} cy={pY} rx={100} ry={60} fill="none" stroke={PROKA} strokeWidth={3} />
            <text x={pX} y={pY + 85} fill={PROKA} fontSize={16} textAnchor="middle">较小（1-10μm）</text>
            {/* 细胞壁 */}
            <ellipse cx={pX} cy={pY} rx={108} ry={68} fill="none" stroke="#bc6c25" strokeWidth={2} strokeDasharray="4,3" />
            {scene === 0 && <text x={pX + 120} y={pY - 40} fill="#bc6c25" fontSize={14}>细胞壁</text>}

            {/* 真核——大、圆 */}
            <circle cx={eX} cy={eY} r={130} fill="none" stroke={EUKA} strokeWidth={3} />
            <text x={eX} y={eY + 155} fill={EUKA} fontSize={16} textAnchor="middle">较大（10-100μm）</text>
          </g>
        )}

        {/* ── 场景 1: DNA ── */}
        {scene >= 1 && (
          <g opacity={interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 原核——拟核（无核膜包被） */}
            <ellipse cx={pX} cy={pY} rx={35} ry={25} fill="none" stroke="#ffd166" strokeWidth={2} strokeDasharray="4,2" />
            <path d={`M${pX - 20} ${pY} Q${pX} ${pY - 15} ${pX + 20} ${pY} T${pX + 10} ${pY + 10}`} fill="none" stroke="#ef476f" strokeWidth={2.5} />
            <text x={pX} y={pY + 45} fill="#ffd166" fontSize={14} textAnchor="middle">拟核（无核膜）</text>
            {scene === 1 && <text x={pX} y={pY + 65} fill="#888" fontSize={12} textAnchor="middle">裸露环状DNA</text>}

            {/* 真核——有核膜包被的细胞核 */}
            <circle cx={eX - 30} cy={eY - 10} r={45} fill="#264653" stroke="#e9c46a" strokeWidth={3} />
            <text x={eX - 30} y={eY - 5} fill="#e9c46a" fontSize={14} fontWeight="bold" textAnchor="middle">细胞核</text>
            {scene === 1 && (
              <>
                <text x={eX - 30} y={eY + 15} fill="#bbb" fontSize={11} textAnchor="middle">核膜包被</text>
                <text x={eX - 30} y={eY + 55} fill="#888" fontSize={12} textAnchor="middle">线性DNA + 组蛋白</text>
              </>
            )}
          </g>
        )}

        {/* ── 场景 2: 细胞器 ── */}
        {scene >= 2 && (
          <g opacity={interpolate(frame, [360, 390], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 原核——只有核糖体 */}
            {[0, 1, 2, 3, 4].map((i) => {
              const rx = pX - 60 + i * 30;
              const ry = pY + 20 + (i % 2) * 15;
              return <circle key={i} cx={rx} cy={ry} r={5} fill="#a7c957" opacity={0.7} />;
            })}
            {scene === 2 && (
              <>
                <text x={pX} y={pY - 75} fill="#a7c957" fontSize={15} textAnchor="middle">仅有核糖体</text>
                <text x={pX} y={pY - 55} fill="#888" fontSize={12} textAnchor="middle">无其他有膜细胞器</text>
              </>
            )}

            {/* 真核——多种细胞器 */}
            <ellipse cx={eX + 50} cy={eY - 40} rx={25} ry={12} fill="#ef476f" opacity={0.7} />
            <text x={eX + 50} y={eY - 36} fill={TEXT} fontSize={9} textAnchor="middle">线粒体</text>
            <ellipse cx={eX + 80} cy={eY + 40} rx={22} ry={10} fill="#2a9d8f" opacity={0.7} />
            <text x={eX + 80} y={eY + 44} fill={TEXT} fontSize={9} textAnchor="middle">叶绿体</text>
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={eX - 80 + i * 20} cy={eY + 50 + i * 8} rx={30} ry={4} fill="#e76f51" opacity={0.5} />
            ))}
            <text x={eX - 60} y={eY + 90} fill="#e76f51" fontSize={11} textAnchor="middle">内质网</text>
            {scene === 2 && (
              <text x={eX} y={eY - 80} fill={EUKA} fontSize={15} textAnchor="middle">丰富的膜系统和多种细胞器</text>
            )}
          </g>
        )}

        {/* ── 场景 3: 总结对比表 ── */}
        {scene === 3 && (
          <g opacity={interpolate(frame, [540, 570], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 对比项 */}
            {[
              {feature: '细胞大小', pro: '较小（1-10μm）', euk: '较大（10-100μm）'},
              {feature: '核膜', pro: '无（拟核）', euk: '有（真正的细胞核）'},
              {feature: 'DNA 形态', pro: '裸露环状', euk: '线性 + 组蛋白'},
              {feature: '细胞器', pro: '仅核糖体', euk: '多种有膜细胞器'},
              {feature: '共同点', pro: '都有 DNA、核糖体、细胞膜', euk: ''},
            ].map((row, i) => {
              const ry = 600 + i * 55;
              const reveal = interpolate(frame - 540, [i * 15, i * 15 + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={200} y={ry - 22} width={width - 400} height={45} rx={8} fill={i === 4 ? 'rgba(255,209,102,0.08)' : 'rgba(255,255,255,0.03)'} stroke={i === 4 ? '#ffd166' : '#2a3f5f'} strokeWidth={1} />
                  <text x={width / 2} y={ry + 5} fill={i === 4 ? '#ffd166' : LABEL} fontSize={16} fontWeight="bold" textAnchor="middle">{row.feature}</text>
                  <text x={400} y={ry + 5} fill={PROKA} fontSize={15} textAnchor="middle">{row.pro}</text>
                  {row.euk && <text x={width - 400} y={ry + 5} fill={EUKA} fontSize={15} textAnchor="middle">{row.euk}</text>}
                </g>
              );
            })}
          </g>
        )}

        {/* 底部 */}
        <rect x={60} y={height - 110} width={width - 120} height={70} rx={14} fill="rgba(231,111,81,0.1)" stroke={PROKA} strokeWidth={1.5} />
        <text x={width / 2} y={height - 72} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>

        <rect x={60} y={height - 28} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 28} width={(width - 120) * (frame / 720)} height={6} rx={3} fill={PROKA} />
      </svg>
    </AbsoluteFill>
  );
};
