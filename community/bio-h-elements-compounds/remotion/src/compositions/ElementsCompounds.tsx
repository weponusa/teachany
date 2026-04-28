import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0c1426';
const MAJOR = '#2a9d8f';
const TRACE = '#e9c46a';
const INORGANIC = '#118ab2';
const ORGANIC = '#ef476f';
const TEXT = '#fffaf0';

interface Element {
  symbol: string;
  name: string;
  percent?: string;
  color: string;
}

export const ElementsCompounds: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;

  /* 阶段: 0-8s 元素分类 | 8-16s 化合物分类 | 16-24s 元素→化合物关系 */
  const scene = t < 8 ? 0 : t < 16 ? 1 : 2;

  /* ── 大量元素 ── */
  const majorElements: Element[] = [
    {symbol: 'C', name: '碳', percent: '最基本', color: '#555'},
    {symbol: 'H', name: '氢', percent: '含量最多', color: '#3b9dff'},
    {symbol: 'O', name: '氧', percent: '含量第二', color: '#e63946'},
    {symbol: 'N', name: '氮', percent: '', color: '#457b9d'},
    {symbol: 'P', name: '磷', percent: '', color: '#f4a261'},
    {symbol: 'S', name: '硫', percent: '', color: '#e9c46a'},
    {symbol: 'K', name: '钾', percent: '', color: '#6a4c93'},
    {symbol: 'Ca', name: '钙', percent: '', color: '#adb5bd'},
    {symbol: 'Mg', name: '镁', percent: '', color: '#2a9d8f'},
  ];

  /* ── 微量元素 ── */
  const traceElements: Element[] = [
    {symbol: 'Fe', name: '铁', color: '#d4a373'},
    {symbol: 'Mn', name: '锰', color: '#bc6c25'},
    {symbol: 'Zn', name: '锌', color: '#606c38'},
    {symbol: 'Cu', name: '铜', color: '#dda15e'},
    {symbol: 'B', name: '硼', color: '#283618'},
    {symbol: 'Mo', name: '钼', color: '#495057'},
  ];

  /* ── 化合物分类 ── */
  const compounds = [
    {name: '水', type: 'inorganic', desc: '自由水参与代谢，结合水组成细胞结构', color: INORGANIC},
    {name: '无机盐', type: 'inorganic', desc: '离子形式维持酸碱平衡和渗透压', color: INORGANIC},
    {name: '糖类', type: 'organic', desc: '单糖、二糖、多糖——生命的燃料', color: ORGANIC},
    {name: '脂质', type: 'organic', desc: '脂肪(储能) · 磷脂(膜) · 固醇(调节)', color: ORGANIC},
    {name: '蛋白质', type: 'organic', desc: '生命活动的主要承担者', color: ORGANIC},
    {name: '核酸', type: 'organic', desc: 'DNA + RNA——遗传信息的携带者', color: ORGANIC},
  ];

  const titles = ['组成细胞的元素', '组成细胞的化合物', '元素 → 化合物的层级关系'];

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
          组成细胞的元素和化合物
        </text>

        {/* ── 场景 0: 元素分类 ── */}
        {scene === 0 && (
          <g>
            {/* 大量元素标题 */}
            <text x={200} y={160} fill={MAJOR} fontSize={28} fontWeight="bold">大量元素（占比 ≥ 0.01%）</text>
            {majorElements.map((el, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const ex = 180 + col * 160;
              const ey = 220 + row * 130;
              const reveal = interpolate(frame, [i * 8, i * 8 + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={ex - 40} y={ey - 40} width={80} height={80} rx={10} fill={el.color} opacity={0.85} />
                  <text x={ex} y={ey + 5} fill={TEXT} fontSize={32} fontWeight="bold" textAnchor="middle">{el.symbol}</text>
                  <text x={ex} y={ey + 55} fill="#bbb" fontSize={14} textAnchor="middle">{el.name}</text>
                  {el.percent && <text x={ex} y={ey + 72} fill={MAJOR} fontSize={11} textAnchor="middle">{el.percent}</text>}
                </g>
              );
            })}
            {/* 微量元素 */}
            <text x={200} y={520} fill={TRACE} fontSize={28} fontWeight="bold">微量元素（含量极少但不可缺少）</text>
            <text x={200} y={555} fill="#888" fontSize={18}>口诀：铁 锰 锌 铜 硼 钼</text>
            {traceElements.map((el, i) => {
              const ex = 180 + i * 140;
              const ey = 620;
              const reveal = interpolate(frame, [100 + i * 10, 130 + i * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={ex - 30} y={ey - 30} width={60} height={60} rx={8} fill={el.color} opacity={0.75} stroke={TRACE} strokeWidth={2} />
                  <text x={ex} y={ey + 5} fill={TEXT} fontSize={26} fontWeight="bold" textAnchor="middle">{el.symbol}</text>
                  <text x={ex} y={ey + 42} fill="#bbb" fontSize={13} textAnchor="middle">{el.name}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── 场景 1: 化合物分类 ── */}
        {scene === 1 && (
          <g>
            <text x={200} y={160} fill={INORGANIC} fontSize={26} fontWeight="bold">无机物</text>
            <text x={cx + 200} y={160} fill={ORGANIC} fontSize={26} fontWeight="bold">有机物</text>
            {compounds.map((c, i) => {
              const isOrg = c.type === 'organic';
              const baseX = isOrg ? cx + 200 : 200;
              const idx = isOrg ? i - 2 : i;
              const cy2 = 210 + idx * 120;
              const reveal = interpolate(frame - 240, [i * 20, i * 20 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={baseX - 20} y={cy2 - 25} width={500} height={90} rx={12} fill={c.color} opacity={0.12} stroke={c.color} strokeWidth={1.5} />
                  <text x={baseX + 10} y={cy2 + 5} fill={c.color} fontSize={26} fontWeight="bold">{c.name}</text>
                  <text x={baseX + 10} y={cy2 + 35} fill="#bfe6e0" fontSize={16}>{c.desc}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── 场景 2: 元素→化合物关系 ── */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [480, 520], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 层级树 */}
            <text x={cx} y={180} fill={TEXT} fontSize={30} fontWeight="bold" textAnchor="middle">元素 → 化合物的构成层级</text>
            {/* 元素层 */}
            <rect x={cx - 200} y={220} width={400} height={50} rx={10} fill={MAJOR} opacity={0.2} stroke={MAJOR} strokeWidth={2} />
            <text x={cx} y={252} fill={MAJOR} fontSize={22} fontWeight="bold" textAnchor="middle">C · H · O · N · P · S ··· 元素</text>
            {/* 箭头 */}
            <line x1={cx} y1={275} x2={cx} y2={310} stroke="#666" strokeWidth={2} />
            <polygon points={`${cx - 6},310 ${cx + 6},310 ${cx},320`} fill="#666" />
            {/* 小分子 */}
            <rect x={cx - 250} y={325} width={500} height={50} rx={10} fill="#457b9d" opacity={0.2} stroke="#457b9d" strokeWidth={2} />
            <text x={cx} y={357} fill="#457b9d" fontSize={22} fontWeight="bold" textAnchor="middle">氨基酸 · 葡萄糖 · 核苷酸 · 脂肪酸 ··· 小分子</text>
            {/* 箭头 */}
            <line x1={cx} y1={380} x2={cx} y2={415} stroke="#666" strokeWidth={2} />
            <polygon points={`${cx - 6},415 ${cx + 6},415 ${cx},425`} fill="#666" />
            {/* 生物大分子 */}
            <rect x={cx - 300} y={430} width={600} height={50} rx={10} fill={ORGANIC} opacity={0.2} stroke={ORGANIC} strokeWidth={2} />
            <text x={cx} y={462} fill={ORGANIC} fontSize={22} fontWeight="bold" textAnchor="middle">蛋白质 · 多糖 · 核酸 · 脂质 ··· 生物大分子</text>
            {/* 箭头 */}
            <line x1={cx} y1={485} x2={cx} y2={520} stroke="#666" strokeWidth={2} />
            <polygon points={`${cx - 6},520 ${cx + 6},520 ${cx},530`} fill="#666" />
            {/* 细胞 */}
            <rect x={cx - 150} y={535} width={300} height={50} rx={10} fill="#e9c46a" opacity={0.2} stroke="#e9c46a" strokeWidth={2} />
            <text x={cx} y={567} fill="#e9c46a" fontSize={22} fontWeight="bold" textAnchor="middle">细胞（生命的基本单位）</text>

            {/* 关键标注 */}
            <text x={cx + 320} y={350} fill="#888" fontSize={16}>脱水缩合</text>
            <text x={cx + 320} y={370} fill="#888" fontSize={16}>反应连接</text>
          </g>
        )}

        {/* 底部信息栏 */}
        <rect x={60} y={height - 110} width={width - 120} height={70} rx={14} fill="rgba(42,157,143,0.12)" stroke={MAJOR} strokeWidth={1.5} />
        <text x={cx} y={height - 78} fill={MAJOR} fontSize={30} fontWeight="900" textAnchor="middle">{titles[scene]}</text>
      </svg>
    </AbsoluteFill>
  );
};
