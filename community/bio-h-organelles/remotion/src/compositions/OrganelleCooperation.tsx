import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0a1628';
const TEXT = '#fffaf0';

interface OrgData {
  name: string;
  x: number;
  y: number;
  color: string;
  membrane: string;
  func: string;
  shape: 'ellipse' | 'circle' | 'rect';
  rx: number;
  ry: number;
}

export const OrganelleCooperation: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  /* 阶段: 0-6s 单膜 | 6-12s 双膜 | 12-18s 无膜 | 18-24s 协作动画 */
  const scene = t < 6 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;

  const singleMembrane: OrgData[] = [
    {name: '内质网', x: 350, y: 320, color: '#e76f51', membrane: '单层膜', func: '蛋白质加工·脂质合成', shape: 'rect', rx: 90, ry: 30},
    {name: '高尔基体', x: 700, y: 320, color: '#f4a261', membrane: '单层膜', func: '加工分拣·分泌', shape: 'ellipse', rx: 60, ry: 25},
    {name: '溶酶体', x: 1050, y: 320, color: '#264653', membrane: '单层膜', func: '消化分解', shape: 'circle', rx: 30, ry: 30},
    {name: '液泡', x: 1400, y: 320, color: '#a8dadc', membrane: '单层膜', func: '渗透压·储藏', shape: 'ellipse', rx: 55, ry: 40},
  ];

  const doubleMembrane: OrgData[] = [
    {name: '线粒体', x: 450, y: 350, color: '#ef476f', membrane: '双层膜', func: '有氧呼吸主要场所', shape: 'ellipse', rx: 55, ry: 28},
    {name: '叶绿体', x: 900, y: 350, color: '#2a9d8f', membrane: '双层膜', func: '光合作用场所', shape: 'ellipse', rx: 60, ry: 30},
    {name: '细胞核', x: 1350, y: 350, color: '#e9c46a', membrane: '双层膜', func: '遗传信息库·代谢控制中心', shape: 'circle', rx: 50, ry: 50},
  ];

  const noMembrane: OrgData[] = [
    {name: '核糖体', x: 400, y: 340, color: '#a7c957', membrane: '无膜', func: '蛋白质合成', shape: 'circle', rx: 20, ry: 20},
    {name: '中心体', x: 800, y: 340, color: '#457b9d', membrane: '无膜', func: '有丝分裂·纺锤体', shape: 'circle', rx: 22, ry: 22},
    {name: '细胞骨架', x: 1200, y: 340, color: '#6c757d', membrane: '无膜', func: '支撑·运输·分裂', shape: 'rect', rx: 80, ry: 15},
  ];

  const titles = ['单层膜细胞器', '双层膜细胞器', '无膜细胞器', '细胞器的分工协作'];

  const renderOrganelle = (org: OrgData, idx: number, baseFrame: number) => {
    const reveal = interpolate(frame - baseFrame, [idx * 20, idx * 20 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g key={org.name} opacity={reveal}>
        {org.shape === 'ellipse' && <ellipse cx={org.x} cy={org.y} rx={org.rx} ry={org.ry} fill={org.color} opacity={0.8} stroke={org.color} strokeWidth={2} />}
        {org.shape === 'circle' && <circle cx={org.x} cy={org.y} r={org.rx} fill={org.color} opacity={0.8} stroke={org.color} strokeWidth={2} />}
        {org.shape === 'rect' && <rect x={org.x - org.rx} y={org.y - org.ry} width={org.rx * 2} height={org.ry * 2} rx={8} fill={org.color} opacity={0.8} stroke={org.color} strokeWidth={2} />}
        <text x={org.x} y={org.y + org.ry + 30} fill={org.color} fontSize={20} fontWeight="bold" textAnchor="middle">{org.name}</text>
        <text x={org.x} y={org.y + org.ry + 55} fill="#888" fontSize={14} textAnchor="middle">{org.func}</text>
        <text x={org.x} y={org.y - org.ry - 12} fill="#6c8fa8" fontSize={13} textAnchor="middle">{org.membrane}</text>
      </g>
    );
  };

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
          细胞器——系统内的分工合作
        </text>

        {/* 场景 0: 单层膜 */}
        {scene === 0 && (
          <g>
            <text x={cx} y={180} fill="#e76f51" fontSize={28} fontWeight="bold" textAnchor="middle">单层膜细胞器</text>
            {singleMembrane.map((o, i) => renderOrganelle(o, i, 0))}
          </g>
        )}

        {/* 场景 1: 双层膜 */}
        {scene === 1 && (
          <g opacity={interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <text x={cx} y={180} fill="#ef476f" fontSize={28} fontWeight="bold" textAnchor="middle">双层膜细胞器</text>
            {doubleMembrane.map((o, i) => renderOrganelle(o, i, 180))}
            {/* 标注：含自身DNA */}
            <text x={450} y={450} fill="#888" fontSize={14} textAnchor="middle">含少量DNA（半自主性细胞器）</text>
            <text x={900} y={450} fill="#888" fontSize={14} textAnchor="middle">含少量DNA（半自主性细胞器）</text>
          </g>
        )}

        {/* 场景 2: 无膜 */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [360, 390], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <text x={cx} y={180} fill="#a7c957" fontSize={28} fontWeight="bold" textAnchor="middle">无膜结构</text>
            {noMembrane.map((o, i) => renderOrganelle(o, i, 360))}
          </g>
        )}

        {/* 场景 3: 协作动画 */}
        {scene === 3 && (
          <g opacity={interpolate(frame, [540, 570], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <text x={cx} y={160} fill={TEXT} fontSize={26} fontWeight="bold" textAnchor="middle">
              分泌蛋白的合成与分泌——细胞器的分工协作
            </text>

            {/* 流程图 */}
            {[
              {name: '核糖体', x: 200, color: '#a7c957', desc: '合成多肽链'},
              {name: '内质网', x: 520, color: '#e76f51', desc: '初步加工'},
              {name: '高尔基体', x: 840, color: '#f4a261', desc: '进一步加工'},
              {name: '细胞膜', x: 1160, color: '#3a8f7a', desc: '胞吐分泌'},
              {name: '线粒体', x: 680, color: '#ef476f', desc: '提供能量 ATP'},
            ].map((item, i) => {
              const isBottom = item.name === '线粒体';
              const iy = isBottom ? cy + 140 : cy;
              const reveal2 = interpolate(frame - 540, [i * 25, i * 25 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal2}>
                  <rect x={item.x - 55} y={iy - 30} width={110} height={60} rx={12} fill={item.color} opacity={0.2} stroke={item.color} strokeWidth={2} />
                  <text x={item.x} y={iy - 2} fill={item.color} fontSize={18} fontWeight="bold" textAnchor="middle">{item.name}</text>
                  <text x={item.x} y={iy + 18} fill="#bbb" fontSize={12} textAnchor="middle">{item.desc}</text>
                  {!isBottom && i < 3 && (
                    <>
                      <line x1={item.x + 60} y1={iy} x2={[520, 840, 1160][i] - 60} y2={iy} stroke="#555" strokeWidth={2} />
                      <polygon points={`${[520, 840, 1160][i] - 60},${iy - 5} ${[520, 840, 1160][i] - 50},${iy} ${[520, 840, 1160][i] - 60},${iy + 5}`} fill="#555" />
                    </>
                  )}
                </g>
              );
            })}

            {/* 线粒体→各环节的能量箭头 */}
            {[520, 840, 1160].map((tx, i) => (
              <g key={i} opacity={interpolate(frame - 540, [130, 160], [0, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
                <line x1={680} y1={cy + 105} x2={tx} y2={cy + 35} stroke="#ef476f" strokeWidth={1.5} strokeDasharray="4,3" />
                <text x={(680 + tx) / 2} y={(cy + 105 + cy + 35) / 2 - 5} fill="#ef476f" fontSize={11} textAnchor="middle">ATP</text>
              </g>
            ))}

            {/* 囊泡运输动画 */}
            {(() => {
              const vp = interpolate(frame - 580, [0, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const vx = interpolate(vp, [0, 0.5, 1], [580, 780, 980]);
              const vy = interpolate(vp, [0, 0.25, 0.5, 0.75, 1], [cy, cy - 30, cy, cy - 30, cy]);
              return vp > 0 ? (
                <circle cx={vx} cy={vy} r={12} fill="#ffd166" opacity={0.85} />
              ) : null;
            })()}
          </g>
        )}

        {/* 底部信息栏 */}
        <rect x={60} y={height - 110} width={width - 120} height={70} rx={14} fill="rgba(42,157,143,0.12)" stroke="#2a9d8f" strokeWidth={1.5} />
        <text x={cx} y={height - 72} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>

        {/* 进度 */}
        <rect x={60} y={height - 28} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 28} width={(width - 120) * (frame / 720)} height={6} rx={3} fill="#2a9d8f" />
      </svg>
    </AbsoluteFill>
  );
};
