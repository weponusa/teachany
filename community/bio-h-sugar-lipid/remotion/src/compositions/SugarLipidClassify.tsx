import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = '#0b1a2e';
const MONO = '#ef476f';
const DI = '#f4a261';
const POLY = '#2a9d8f';
const FAT = '#e9c46a';
const PHOSPHO = '#118ab2';
const STEROL = '#6a4c93';
const TEXT = '#fffaf0';

export const SugarLipidClassify: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  /* 4阶段: 0-6s 糖类分类 | 6-12s 脂质分类 | 12-18s 磷脂双分子层 | 18-24s 总结 */
  const scene = t < 6 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;

  const titles = ['糖类的分类', '脂质的分类', '磷脂双分子层的自组装', '糖类与脂质——总结'];

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
          糖类和脂质
        </text>

        {/* ── 场景 0: 糖类分类树 ── */}
        {scene === 0 && (
          <g>
            {/* 根节点 */}
            <rect x={cx - 60} y={140} width={120} height={45} rx={10} fill="#264653" stroke={TEXT} strokeWidth={2} />
            <text x={cx} y={168} fill={TEXT} fontSize={20} fontWeight="bold" textAnchor="middle">糖类</text>

            {/* 三个分支 */}
            {[
              {name: '单糖', x: 350, color: MONO, items: ['葡萄糖（能量来源）', '果糖', '核糖/脱氧核糖'], note: '不能水解'},
              {name: '二糖', x: cx, color: DI, items: ['蔗糖（植物）', '麦芽糖（植物）', '乳糖（动物）'], note: '水解为 2 个单糖'},
              {name: '多糖', x: width - 350, color: POLY, items: ['淀粉（植物储能）', '糖原（动物储能）', '纤维素（植物细胞壁）'], note: '水解为多个单糖'},
            ].map((branch, bi) => {
              const by = 250;
              const branchReveal = interpolate(frame, [bi * 30 + 20, bi * 30 + 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={bi} opacity={branchReveal}>
                  {/* 连线 */}
                  <line x1={cx} y1={185} x2={branch.x} y2={by} stroke="#555" strokeWidth={2} />
                  {/* 分支框 */}
                  <rect x={branch.x - 75} y={by - 22} width={150} height={44} rx={8} fill={branch.color} opacity={0.2} stroke={branch.color} strokeWidth={2} />
                  <text x={branch.x} y={by + 5} fill={branch.color} fontSize={20} fontWeight="bold" textAnchor="middle">{branch.name}</text>
                  {/* 子项 */}
                  {branch.items.map((item, ii) => {
                    const iy = by + 70 + ii * 45;
                    const itemReveal = interpolate(frame, [bi * 30 + 60 + ii * 15, bi * 30 + 90 + ii * 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                    return (
                      <g key={ii} opacity={itemReveal}>
                        <line x1={branch.x} y1={by + 22} x2={branch.x} y2={iy - 15} stroke="#444" strokeWidth={1} />
                        <rect x={branch.x - 110} y={iy - 15} width={220} height={30} rx={6} fill="rgba(255,255,255,0.04)" stroke="#333" strokeWidth={1} />
                        <text x={branch.x} y={iy + 5} fill="#bbb" fontSize={14} textAnchor="middle">{item}</text>
                      </g>
                    );
                  })}
                  {/* 注释 */}
                  <text x={branch.x} y={by + 220} fill={branch.color} fontSize={13} textAnchor="middle">{branch.note}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── 场景 1: 脂质分类 ── */}
        {scene === 1 && (
          <g opacity={interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {[
              {name: '脂肪', color: FAT, desc: '储能物质 · 保温隔热 · 缓冲保护', x: 350, formula: '甘油 + 3脂肪酸'},
              {name: '磷脂', color: PHOSPHO, desc: '细胞膜的主要成分', x: cx, formula: '甘油 + 2脂肪酸 + 磷酸'},
              {name: '固醇', color: STEROL, desc: '胆固醇(膜) · 性激素 · 维生素D', x: width - 350, formula: '多环结构'},
            ].map((lipid, i) => {
              const ly = 280;
              const reveal = interpolate(frame - 180, [i * 25, i * 25 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={lipid.x - 120} y={ly - 40} width={240} height={240} rx={16} fill={lipid.color} opacity={0.08} stroke={lipid.color} strokeWidth={2} />
                  <text x={lipid.x} y={ly} fill={lipid.color} fontSize={26} fontWeight="bold" textAnchor="middle">{lipid.name}</text>
                  <text x={lipid.x} y={ly + 40} fill="#bbb" fontSize={15} textAnchor="middle">{lipid.desc}</text>
                  <text x={lipid.x} y={ly + 80} fill="#888" fontSize={14} textAnchor="middle">{lipid.formula}</text>
                  {/* 简化图标 */}
                  {i === 0 && <ellipse cx={lipid.x} cy={ly + 140} rx={40} ry={25} fill={FAT} opacity={0.5} />}
                  {i === 1 && (
                    <g>
                      <circle cx={lipid.x} cy={ly + 125} r={12} fill={PHOSPHO} opacity={0.8} />
                      <line x1={lipid.x - 5} y1={ly + 137} x2={lipid.x - 5} y2={ly + 170} stroke={FAT} strokeWidth={2.5} />
                      <line x1={lipid.x + 5} y1={ly + 137} x2={lipid.x + 5} y2={ly + 170} stroke={FAT} strokeWidth={2.5} />
                    </g>
                  )}
                  {i === 2 && (
                    <g>
                      <polygon points={`${lipid.x},${ly + 110} ${lipid.x - 25},${ly + 140} ${lipid.x - 15},${ly + 170} ${lipid.x + 15},${ly + 170} ${lipid.x + 25},${ly + 140}`} fill="none" stroke={STEROL} strokeWidth={2} />
                    </g>
                  )}
                </g>
              );
            })}
            {/* 根标题 */}
            <rect x={cx - 50} y={160} width={100} height={40} rx={8} fill="#264653" stroke={TEXT} strokeWidth={2} />
            <text x={cx} y={185} fill={TEXT} fontSize={20} fontWeight="bold" textAnchor="middle">脂质</text>
          </g>
        )}

        {/* ── 场景 2: 磷脂双分子层自组装 ── */}
        {scene === 2 && (
          <g opacity={interpolate(frame, [360, 390], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <text x={cx} y={150} fill={PHOSPHO} fontSize={26} fontWeight="bold" textAnchor="middle">
              磷脂分子在水中自动形成双分子层
            </text>
            <text x={cx} y={185} fill="#888" fontSize={18} textAnchor="middle">
              亲水头朝外（接触水）· 疏水尾朝内（远离水）
            </text>

            {/* 水环境标注 */}
            <text x={120} y={cy - 150} fill={PHOSPHO} fontSize={20}>水环境</text>
            <text x={120} y={cy + 180} fill={PHOSPHO} fontSize={20}>水环境</text>

            {/* 磷脂双分子层 */}
            {Array.from({length: 24}).map((_, i) => {
              const lx = 250 + i * 60;
              const wobble = Math.sin(t * 2 + i * 0.5) * 3;
              return (
                <g key={i}>
                  {/* 上层：头朝上 */}
                  <circle cx={lx} cy={cy - 50 + wobble} r={8} fill={PHOSPHO} opacity={0.85} />
                  <line x1={lx - 3} y1={cy - 42 + wobble} x2={lx - 3} y2={cy - 15 + wobble} stroke={FAT} strokeWidth={2} />
                  <line x1={lx + 3} y1={cy - 42 + wobble} x2={lx + 3} y2={cy - 15 + wobble} stroke={FAT} strokeWidth={2} />
                  {/* 下层：头朝下 */}
                  <circle cx={lx} cy={cy + 50 - wobble} r={8} fill={PHOSPHO} opacity={0.85} />
                  <line x1={lx - 3} y1={cy + 42 - wobble} x2={lx - 3} y2={cy + 15 - wobble} stroke={FAT} strokeWidth={2} />
                  <line x1={lx + 3} y1={cy + 42 - wobble} x2={lx + 3} y2={cy + 15 - wobble} stroke={FAT} strokeWidth={2} />
                </g>
              );
            })}

            {/* 标注 */}
            <g>
              <line x1={1650} y1={cy - 50} x2={1720} y2={cy - 80} stroke="#888" strokeWidth={1} />
              <text x={1725} y={cy - 75} fill={PHOSPHO} fontSize={15}>亲水头（磷酸基团）</text>
              <line x1={1650} y1={cy - 25} x2={1720} y2={cy - 10} stroke="#888" strokeWidth={1} />
              <text x={1725} y={cy - 5} fill={FAT} fontSize={15}>疏水尾（脂肪酸链）</text>
            </g>
          </g>
        )}

        {/* ── 场景 3: 总结 ── */}
        {scene === 3 && (
          <g opacity={interpolate(frame, [540, 570], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* 对比表 */}
            {[
              {cat: '糖类', sub: '单糖·二糖·多糖', func: '生命的主要能源物质', elem: 'C、H、O', color: MONO},
              {cat: '脂肪', sub: '甘油+脂肪酸', func: '储能·保温·缓冲', elem: 'C、H、O', color: FAT},
              {cat: '磷脂', sub: '甘油+脂肪酸+磷酸', func: '细胞膜主要成分', elem: 'C、H、O、N、P', color: PHOSPHO},
              {cat: '固醇', sub: '胆固醇/性激素/VD', func: '构成膜·调节代谢', elem: 'C、H、O', color: STEROL},
            ].map((row, i) => {
              const ry = 250 + i * 110;
              const reveal = interpolate(frame - 540, [i * 20, i * 20 + 35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={reveal}>
                  <rect x={200} y={ry - 30} width={width - 400} height={85} rx={12} fill={row.color} opacity={0.06} stroke={row.color} strokeWidth={1.5} />
                  <text x={350} y={ry + 5} fill={row.color} fontSize={24} fontWeight="bold" textAnchor="middle">{row.cat}</text>
                  <text x={650} y={ry + 5} fill="#bbb" fontSize={16} textAnchor="middle">{row.sub}</text>
                  <text x={1050} y={ry + 5} fill="#bbb" fontSize={16} textAnchor="middle">{row.func}</text>
                  <text x={1450} y={ry + 5} fill="#888" fontSize={14} textAnchor="middle">{row.elem}</text>
                  {/* 表头 */}
                  {i === 0 && (
                    <>
                      <text x={350} y={ry - 55} fill={TEXT} fontSize={16} fontWeight="bold" textAnchor="middle">类别</text>
                      <text x={650} y={ry - 55} fill={TEXT} fontSize={16} fontWeight="bold" textAnchor="middle">组成</text>
                      <text x={1050} y={ry - 55} fill={TEXT} fontSize={16} fontWeight="bold" textAnchor="middle">功能</text>
                      <text x={1450} y={ry - 55} fill={TEXT} fontSize={16} fontWeight="bold" textAnchor="middle">元素</text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 底部 */}
        <rect x={60} y={height - 110} width={width - 120} height={70} rx={14} fill="rgba(239,71,111,0.1)" stroke={MONO} strokeWidth={1.5} />
        <text x={cx} y={height - 72} fill={TEXT} fontSize={28} fontWeight="900" textAnchor="middle">{titles[scene]}</text>

        <rect x={60} y={height - 28} width={width - 120} height={6} rx={3} fill="#1a2a40" />
        <rect x={60} y={height - 28} width={(width - 120) * (frame / 720)} height={6} rx={3} fill={MONO} />
      </svg>
    </AbsoluteFill>
  );
};
