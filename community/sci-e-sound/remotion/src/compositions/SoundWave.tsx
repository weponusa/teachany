import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const deep = '#073b4c';
const cyan = '#2ec4b6';
const yellow = '#ffd166';
const red = '#ef476f';
const paper = '#fffaf0';

export const SoundWave: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const phase = frame / fps * Math.PI * 2;
  const pulse = interpolate(frame % 48, [0, 48], [0, 680]);

  return (
    <AbsoluteFill style={{background: deep, overflow: 'hidden', fontFamily: 'Hiragino Sans GB, PingFang SC, Noto Sans SC, sans-serif'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" fill="none" stroke="#0d4e61" strokeWidth="1" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={yellow} stopOpacity="0.85" />
            <stop offset="100%" stopColor={yellow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
        <circle cx="180" cy="360" r="145" fill="url(#glow)" opacity="0.45" />
        <text x="80" y="92" fill={paper} fontSize="48" fontWeight="900">声波传播：一挤一松的接力</text>
        <text x="80" y="140" fill="#bfe6e0" fontSize="28" fontWeight="700">声源附近的介质先振动，再把振动传给旁边的介质</text>
        <circle cx="170" cy="360" r="52" fill={red} />
        <text x="122" y="448" fill={paper} fontSize="28" fontWeight="900">声源</text>
        {[0, 1, 2, 3, 4].map((k) => {
          const r = (pulse + k * 145) % 820;
          return <circle key={k} cx="170" cy="360" r={r} fill="none" stroke={yellow} strokeWidth="5" opacity={0.56 - k * 0.09} />;
        })}
        {Array.from({length: 24}).map((_, i) => {
          const x = 300 + i * 36;
          const y = 360 + Math.sin(i * 0.75 - phase) * 38;
          const r = 13 + 7 * (1 + Math.sin(i * 0.75 - phase)) / 2;
          return <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? cyan : yellow} />;
        })}
        <path d="M1088 316 C1142 338 1142 382 1088 404" fill="none" stroke={paper} strokeWidth="9" strokeLinecap="round" />
        <text x="1058" y="448" fill={paper} fontSize="28" fontWeight="900">耳朵</text>
        <rect x="80" y="600" width="1120" height="58" rx="29" fill="rgba(255,209,102,0.16)" stroke={yellow} strokeWidth="2" />
        <text x="112" y="638" fill={yellow} fontSize="30" fontWeight="900">注意：介质颗粒只在原位置附近振动，传递出去的是能量。</text>
      </svg>
    </AbsoluteFill>
  );
};
