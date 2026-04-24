import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile, Sequence } from 'remotion';
import React from 'react';

const W = 1920, H = 1080;

// 颜色主题
const C = {
  bg: '#FFF8E7',
  wire: '#555',
  wireOn: '#FF6B35',
  battery: '#4CAF50',
  bulb: '#FFD700',
  bulbOff: '#ccc',
  bulbGlow: 'rgba(255,220,0,0.6)',
  switch: '#2196F3',
  label: '#333',
  particle: '#FF6B35',
};

// 电路路径坐标（矩形回路）
const PATH = {
  battery: { x: 200, y: 540, w: 80, h: 140 },    // 左侧电源
  switchEl: { x: 960, y: 270, w: 120, h: 40 },    // 顶部开关
  bulb: { x: 1650, y: 490, r: 80 },               // 右侧灯泡
  // 导线折点
  wires: [
    // 从电源正极(顶) → 开关左 → 灯泡顶 → 灯泡底 → 开关右(没有) → 电源负极(底)
    [240, 400],   // 电源顶
    [960, 400],   // 顶部左
    [1020, 270],  // 开关入口
    [1080, 270],  // 开关出口
    [1650, 400],  // 灯泡顶
    [1650, 570],  // 灯泡底
    [240, 680],   // 电源底
  ]
};

function Battery({ x, y, w, h }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={C.battery} />
      {/* 正极 */}
      <rect x={x + 20} y={y - 18} width={w - 40} height={18} rx={4} fill={C.battery} />
      <text x={x + w / 2} y={y - 4} textAnchor="middle" fill="white" fontSize={20} fontWeight="bold">+</text>
      {/* 负极 */}
      <text x={x + w / 2} y={y + h + 18} textAnchor="middle" fill={C.battery} fontSize={20} fontWeight="bold">−</text>
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold">电源</text>
    </g>
  );
}

function SwitchEl({ x, y, w, h, closed }) {
  const handleX = closed ? x + w : x + w - 14;
  const handleY = closed ? y + h / 2 : y - 8;
  return (
    <g>
      <line x1={x} y1={y + h / 2} x2={x + 20} y2={y + h / 2} stroke={closed ? C.wireOn : C.wire} strokeWidth={5} />
      <circle cx={x + 20} cy={y + h / 2} r={8} fill={C.switch} />
      <line x1={x + 20} y1={y + h / 2} x2={handleX} y2={handleY} stroke={C.switch} strokeWidth={5} strokeLinecap="round" />
      <circle cx={handleX} cy={handleY} r={8} fill={C.switch} />
      <line x1={x + w - 14} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={closed ? C.wireOn : C.wire} strokeWidth={5} />
      <circle cx={x + w - 14} cy={y + h / 2} r={8} fill={C.switch} />
      <text x={x + w / 2} y={y + h + 28} textAnchor="middle" fill={C.label} fontSize={18} fontWeight="bold">开关</text>
    </g>
  );
}

function Bulb({ cx, cy, r, on }) {
  return (
    <g>
      {on && <circle cx={cx} cy={cy} r={r * 1.8} fill={C.bulbGlow} />}
      {on && <circle cx={cx} cy={cy} r={r * 1.4} fill="rgba(255,220,0,0.3)" />}
      <circle cx={cx} cy={cy} r={r} fill={on ? C.bulb : C.bulbOff} stroke="#888" strokeWidth={4} />
      {/* 灯丝 */}
      <path d={`M${cx - 20},${cy + 10} Q${cx},${cy - 20} ${cx + 20},${cy + 10}`}
        stroke={on ? '#FF6B00' : '#999'} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* 灯座 */}
      <rect x={cx - 25} y={cy + r - 10} width={50} height={22} rx={4} fill="#888" />
      <text x={cx} y={cy + r + 40} textAnchor="middle" fill={C.label} fontSize={18} fontWeight="bold">灯泡</text>
    </g>
  );
}

// 电流粒子
function Particles({ progress, on }) {
  if (!on) return null;
  const count = 12;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const t = ((progress + i / count) % 1);
        // 沿矩形路径插值
        const pts = [
          [240, 400], [960, 400], [1080, 270], [1650, 400], [1650, 570], [240, 680]
        ];
        const totalSeg = pts.length - 1;
        const segIdx = Math.floor(t * totalSeg);
        const segT = (t * totalSeg) - segIdx;
        const [ax, ay] = pts[Math.min(segIdx, totalSeg - 1)];
        const [bx, by] = pts[Math.min(segIdx + 1, totalSeg - 1)];
        const px = ax + (bx - ax) * segT;
        const py = ay + (by - ay) * segT;
        return (
          <circle key={i} cx={px} cy={py} r={7} fill={C.particle} opacity={0.85} />
        );
      })}
    </>
  );
}

// 主场景：Circuit 动画
export function CircuitScene({ phase }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // phase: 0=intro label, 1=switch open, 2=switch close + particles
  const isClosed = phase === 2;
  const particleProgress = (frame % (fps * 2)) / (fps * 2);

  // 导线颜色
  const wc = isClosed ? C.wireOn : C.wire;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* 标题 */}
        <text x={W / 2} y={70} textAnchor="middle" fill="#333" fontSize={44} fontWeight="bold">
          {phase === 0 ? '认识简单电路的四个元件' : phase === 1 ? '断路 — 开关断开，灯泡不亮' : '通路 — 开关闭合，灯泡亮了！'}
        </text>

        {/* 导线（矩形）*/}
        {/* 顶边：电源 → 开关入口 */}
        <line x1={240} y1={400} x2={960} y2={400} stroke={wc} strokeWidth={8} />
        {/* 开关左 → 开关（这段由开关组件自身画） */}
        {/* 顶边：开关出口 → 灯泡顶 */}
        <line x1={1080} y1={270} x2={1650} y2={400} stroke={wc} strokeWidth={8} />
        {/* 右边：灯泡顶 → 灯泡底 */}
        <line x1={1650} y1={400} x2={1650} y2={490} stroke={wc} strokeWidth={8} />
        <line x1={1650} y1={570} x2={1650} y2={680} stroke={wc} strokeWidth={8} />
        {/* 底边：灯泡 → 电源负极 */}
        <line x1={240} y1={680} x2={1650} y2={680} stroke={wc} strokeWidth={8} />
        {/* 左边：负极 → 正极 */}
        <line x1={240} y1={400} x2={240} y2={540} stroke={wc} strokeWidth={8} />
        <line x1={240} y1={680} x2={240} y2={680} stroke={wc} strokeWidth={8} />

        {/* 开关竖线到顶部导线 */}
        <line x1={960} y1={400} x2={960} y2={270} stroke={wc} strokeWidth={8} />
        <line x1={1080} y1={270} x2={1080} y2={270} stroke={wc} strokeWidth={8} />

        {/* 电流粒子 */}
        <Particles progress={particleProgress} on={isClosed} />

        {/* 元件 */}
        <Battery x={200} y={540} w={80} h={140} />
        <SwitchEl x={960} y={250} w={120} h={40} closed={isClosed} />
        <Bulb cx={1650} cy={530} r={80} on={isClosed} />

        {/* 标签卡 */}
        {phase === 0 && (
          <g>
            <rect x={80} y={760} width={200} height={60} rx={10} fill="#4CAF50" opacity={0.9} />
            <text x={180} y={797} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">① 电源</text>
            <rect x={880} y={200} width={200} height={60} rx={10} fill="#2196F3" opacity={0.9} />
            <text x={980} y={237} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">③ 开关</text>
            <rect x={1550} y={760} width={200} height={60} rx={10} fill="#FF9800" opacity={0.9} />
            <text x={1650} y={797} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">④ 用电器</text>
            <rect x={700} y={630} width={200} height={60} rx={10} fill="#9C27B0" opacity={0.9} />
            <text x={800} y={667} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">② 导线</text>
          </g>
        )}

        {/* 断路/通路说明 */}
        {phase === 1 && (
          <g>
            <rect x={600} y={800} width={720} height={80} rx={16} fill="#FF5252" opacity={0.92} />
            <text x={960} y={850} textAnchor="middle" fill="white" fontSize={30} fontWeight="bold">⚡ 断路：电路不完整，电流无法流通</text>
          </g>
        )}
        {phase === 2 && (
          <g>
            <rect x={600} y={800} width={720} height={80} rx={16} fill="#4CAF50" opacity={0.92} />
            <text x={960} y={850} textAnchor="middle" fill="white" fontSize={30} fontWeight="bold">⚡ 通路：电路完整，电流流动，灯亮！</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
}
