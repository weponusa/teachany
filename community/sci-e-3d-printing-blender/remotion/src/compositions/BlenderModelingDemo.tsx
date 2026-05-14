import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
} from "remotion";

// Blender建模流程演示动画
// 共 8 个 beat：
// 1. 标题出现（0-60帧）
// 2. 空白3D空间（60-120帧）
// 3. 添加立方体（120-180帧）
// 4. G移动操作（180-240帧）
// 5. S缩放操作（240-300帧）
// 6. R旋转操作（300-360帧）
// 7. 多个物体组合（360-450帧）
// 8. 导出STL结语（450-540帧）

const fps = 30;

// 3D立方体投影绘制辅助
function Cube3D({
  x, y, size, color, opacity, rotation = 0
}: {
  x: number; y: number; size: number; color: string; opacity: number; rotation?: number;
}) {
  const s = size;
  const d = s * 0.35; // 等轴侧深度偏移
  // 前面
  const front = `M${x},${y} L${x + s},${y} L${x + s},${y + s} L${x},${y + s} Z`;
  // 上面
  const top = `M${x},${y} L${x + d},${y - d} L${x + s + d},${y - d} L${x + s},${y} Z`;
  // 右面
  const right = `M${x + s},${y} L${x + s + d},${y - d} L${x + s + d},${y - d + s} L${x + s},${y + s} Z`;
  return (
    <g opacity={opacity} style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${x + s / 2}px ${y + s / 2}px` }}>
      <path d={top} fill={color} stroke="white" strokeWidth="1.5" opacity={0.7} />
      <path d={right} fill={color} stroke="white" strokeWidth="1.5" opacity={0.5} />
      <path d={front} fill={color} stroke="white" strokeWidth="1.5" opacity={0.9} />
    </g>
  );
}

// 操作标签
function OperationLabel({ x, y, label, key_name, color, opacity }: {
  x: number; y: number; label: string; key_name: string; color: string; opacity: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - 5} y={y - 28} width={90} height={36} rx={8} fill={color} />
      <text x={x + 40} y={y - 6} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Noto Sans SC, sans-serif">{key_name}</text>
      <text x={x + 40} y={y + 10} textAnchor="middle" fill="white" fontSize="11" fontFamily="Noto Sans SC, sans-serif">{label}</text>
    </g>
  );
}

export const BlenderModelingDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // 进度条
  const progress = frame / 540;

  // === BEAT 1: 标题（0-60） ===
  const titleOpacity = interpolate(frame, [0, 20, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 2: 3D空间网格（60-120） ===
  const gridOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 3: 立方体出现（120-180） ===
  const cubeScale = frame >= 120 ? spring({ fps, frame: frame - 120, config: { damping: 14, stiffness: 200 }, durationInFrames: 40 }) : 0;
  const cubeOpacity = interpolate(frame, [120, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const addLabel = interpolate(frame, [130, 150, 165, 175], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 4: G移动（180-240） ===
  const moveX = frame >= 180 ? interpolate(frame, [180, 220, 240], [0, 80, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const moveLabel = interpolate(frame, [185, 200, 230, 240], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 5: S缩放（240-300） ===
  const scaleVal = frame >= 240 ? interpolate(frame, [240, 270, 300], [1, 1.6, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const scaleLabel = interpolate(frame, [245, 260, 290, 300], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 6: R旋转（300-360） ===
  const rotation = frame >= 300 ? interpolate(frame, [300, 360], [0, 45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const rotateLabel = interpolate(frame, [305, 320, 350, 360], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 7: 多物体（360-450） ===
  const obj2Opacity = interpolate(frame, [380, 400], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const obj3Opacity = interpolate(frame, [410, 430], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const combineLabel = interpolate(frame, [365, 380, 440, 450], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // === BEAT 8: 结语（450-540） ===
  const endOpacity = interpolate(frame, [455, 475, 525, 540], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cubeSize = 90 * cubeScale * scaleVal;
  const cubeX = width / 2 - cubeSize / 2 + moveX;
  const cubeY = height / 2 - cubeSize / 2 - 30;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      {/* TTS 语音 */}
      <Audio src={staticFile("audio/blender-demo-narration.mp3")} />

      {/* 进度条 */}
      <rect x={0} y={0} width={width * progress} height={5} fill="#7c3aed" />

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* 进度条 */}
        <rect x={0} y={0} width={width * progress} height={5} fill="#7c3aed" />

        {/* BEAT 1: 标题 */}
        <g opacity={titleOpacity}>
          <text x={width / 2} y={height / 2 - 20} textAnchor="middle" fill="#a78bfa" fontSize="52" fontWeight="bold" fontFamily="Noto Sans SC, sans-serif">Blender 3D 建模流程</text>
          <text x={width / 2} y={height / 2 + 40} textAnchor="middle" fill="#e2e8f0" fontSize="28" fontFamily="Noto Sans SC, sans-serif">从零开始，搭出你的第一个模型！</text>
        </g>

        {/* BEAT 2: 3D网格底面 */}
        <g opacity={gridOpacity}>
          {/* 网格线 */}
          {[-4,-3,-2,-1,0,1,2,3,4].map(i => (
            <line key={`h${i}`}
              x1={width/2 - 400 + i * 100} y1={height * 0.3}
              x2={width/2 - 400 + i * 100 + 280} y2={height * 0.3 + 280}
              stroke="#334155" strokeWidth={i === 0 ? 1.5 : 0.5}
            />
          ))}
          {[-4,-3,-2,-1,0,1,2,3,4].map(i => (
            <line key={`v${i}`}
              x1={width/2 + i * 100} y1={height * 0.3 - 100}
              x2={width/2 + i * 100 - 280} y2={height * 0.3 + 180}
              stroke="#334155" strokeWidth={i === 0 ? 1.5 : 0.5}
            />
          ))}
          {/* 坐标轴标注 */}
          <text x={width / 2 + 440} y={height * 0.45} fill="#ef4444" fontSize="22" fontWeight="bold" fontFamily="sans-serif">X</text>
          <text x={width / 2 + 10} y={height * 0.15} fill="#22c55e" fontSize="22" fontWeight="bold" fontFamily="sans-serif">Y</text>
          <text x={width / 2 - 330} y={height * 0.65} fill="#3b82f6" fontSize="22" fontWeight="bold" fontFamily="sans-serif">Z</text>
          <text x={width / 2} y={height * 0.88} textAnchor="middle" fill="#94a3b8" fontSize="20" fontFamily="Noto Sans SC, sans-serif">3D世界坐标系：X轴（红）· Y轴（绿）· Z轴（蓝）</text>
        </g>

        {/* BEAT 3-6: 主立方体 */}
        {cubeScale > 0 && (
          <Cube3D
            x={cubeX} y={cubeY}
            size={cubeSize}
            color="#7c3aed"
            opacity={cubeOpacity}
            rotation={rotation}
          />
        )}

        {/* BEAT 3: 添加标签 */}
        <g opacity={addLabel}>
          <rect x={width / 2 - 100} y={cubeY + cubeSize + 20} width={200} height={40} rx={10} fill="#059669" />
          <text x={width / 2} y={cubeY + cubeSize + 46} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Noto Sans SC, sans-serif">➕ Shift+A 添加立方体</text>
        </g>

        {/* BEAT 4: 移动标签 */}
        <OperationLabel x={width / 2 + moveX + cubeSize + 10} y={cubeY + cubeSize / 2} label="移动物体" key_name="G 键" color="#dc2626" opacity={moveLabel} />
        {moveLabel > 0.1 && (
          <path d={`M ${width/2 + cubeSize/2} ${cubeY + cubeSize/2} L ${width/2 + cubeSize/2 + moveX} ${cubeY + cubeSize/2}`}
            stroke="#fbbf24" strokeWidth="2" strokeDasharray="8 4"
            markerEnd="url(#arrowhead)" opacity={moveLabel}
          />
        )}

        {/* BEAT 5: 缩放标签 */}
        <OperationLabel x={cubeX + cubeSize + 10} y={cubeY - 20} label="缩放大小" key_name="S 键" color="#d97706" opacity={scaleLabel} />

        {/* BEAT 6: 旋转标签 */}
        <OperationLabel x={cubeX + cubeSize + 10} y={cubeY + 20} label="旋转角度" key_name="R 键" color="#7c3aed" opacity={rotateLabel} />

        {/* BEAT 7: 多物体 */}
        <Cube3D x={width / 2 - 240} y={height / 2 - 60} size={70} color="#0891b2" opacity={obj2Opacity} />
        <Cube3D x={width / 2 + 140} y={height / 2 - 40} size={55} color="#16a34a" opacity={obj3Opacity} />
        <g opacity={combineLabel}>
          <rect x={width / 2 - 150} y={height * 0.78} width={300} height={44} rx={10} fill="#1e40af" />
          <text x={width / 2} y={height * 0.78 + 28} textAnchor="middle" fill="white" fontSize="19" fontWeight="bold" fontFamily="Noto Sans SC, sans-serif">🧱 像积木一样组合多个物体！</text>
        </g>

        {/* BEAT 8: 结语 */}
        <g opacity={endOpacity}>
          <rect x={width / 2 - 380} y={height / 2 - 100} width={760} height={200} rx={20} fill="rgba(124,58,237,0.85)" />
          <text x={width / 2} y={height / 2 - 40} textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="Noto Sans SC, sans-serif">✅ 模型完成！</text>
          <text x={width / 2} y={height / 2 + 20} textAnchor="middle" fill="#e2e8f0" fontSize="24" fontFamily="Noto Sans SC, sans-serif">文件 → 导出 → STL</text>
          <text x={width / 2} y={height / 2 + 60} textAnchor="middle" fill="#c4b5fd" fontSize="20" fontFamily="Noto Sans SC, sans-serif">就可以发送给3D打印机啦！🎉</text>
        </g>

        {/* 箭头定义 */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
          </marker>
        </defs>

        {/* 底部步骤导航 */}
        {[
          { label: "认识3D空间", start: 60 },
          { label: "添加物体", start: 120 },
          { label: "G移动", start: 180 },
          { label: "S缩放", start: 240 },
          { label: "R旋转", start: 300 },
          { label: "组合建模", start: 360 },
          { label: "导出STL", start: 450 },
        ].map((step, i) => {
          const active = frame >= step.start && (i < 6 ? frame < [60, 120, 180, 240, 300, 360, 450, 540][i + 1] : frame < 540);
          return (
            <g key={i}>
              <circle cx={200 + i * 230} cy={height - 45} r={16} fill={active ? "#7c3aed" : "#334155"} />
              <text x={200 + i * 230} y={height - 40} textAnchor="middle" fill="white" fontSize="12" fontFamily="sans-serif">{i + 1}</text>
              <text x={200 + i * 230} y={height - 15} textAnchor="middle" fill={active ? "#c4b5fd" : "#64748b"} fontSize="13" fontFamily="Noto Sans SC, sans-serif">{step.label}</text>
              {i < 6 && <line x1={216 + i * 230} y1={height - 45} x2={384 + i * 230} y2={height - 45} stroke="#334155" strokeWidth="2" />}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
