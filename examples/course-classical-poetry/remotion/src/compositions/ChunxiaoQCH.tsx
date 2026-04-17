import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing, Sequence} from 'remotion';

/**
 * 孟浩然《春晓》起承转合四幕动画
 * 24 秒 @ 30fps = 720 帧
 * 起 0-180 帧 (0-6s)：蓝夜初醒 · "春眠不觉晓"
 * 承 180-360 帧 (6-12s)：晨光飞鸟 · "处处闻啼鸟"
 * 转 360-540 帧 (12-18s)：风雨突至 · "夜来风雨声"
 * 合 540-720 帧 (18-24s)：落英满地 · "花落知多少"
 */

const SCENE_FRAMES = 180;
const ACTS = [
  {label: '起', verse: '春 眠 不 觉 晓', start: 0, color: '#1e3a8a', moodFrom: '#2a3a52', moodTo: '#3d4f6b'},
  {label: '承', verse: '处 处 闻 啼 鸟', start: 180, color: '#d97706', moodFrom: '#fff4d6', moodTo: '#f5b874'},
  {label: '转', verse: '夜 来 风 雨 声', start: 360, color: '#7c2d12', moodFrom: '#3c2340', moodTo: '#7a3843'},
  {label: '合', verse: '花 落 知 多 少', start: 540, color: '#991b1b', moodFrom: '#d8b78c', moodTo: '#8a6a55'},
];

// ── 背景：按四幕切换 ──
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const actIdx = Math.min(3, Math.floor(f / SCENE_FRAMES));
  const localF = f - actIdx * SCENE_FRAMES;
  const act = ACTS[actIdx];
  const fade = interpolate(localF, [0, 30, SCENE_FRAMES - 30, SCENE_FRAMES], [0.3, 1, 1, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${act.moodFrom} 0%, ${act.moodTo} 100%)`,
        opacity: fade,
      }}
    />
  );
};

// ── 起：蓝夜月亮 ──
const Scene1Qi: React.FC = () => {
  const f = useCurrentFrame();
  const localF = f;
  const moonY = interpolate(localF, [0, 180], [100, 140], {easing: Easing.inOut(Easing.ease)});
  const moonOpacity = interpolate(localF, [0, 30, 150, 180], [0, 0.9, 0.9, 0.5]);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', right: 240, top: moonY, fontSize: 160, opacity: moonOpacity, filter: 'drop-shadow(0 0 40px #fde68a)'}}>🌙</div>
      {[...Array(30)].map((_, i) => {
        const x = (i * 137) % 1920;
        const y = (i * 71) % 600;
        const twinkle = interpolate((localF + i * 7) % 60, [0, 30, 60], [0.3, 1, 0.3]);
        return <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 10, color: '#fff', opacity: twinkle}}>✦</div>;
      })}
    </AbsoluteFill>
  );
};

// ── 承：晨光飞鸟 ──
const Scene2Cheng: React.FC = () => {
  const f = useCurrentFrame() - 180;
  if (f < 0 || f > 180) return null;
  const sunY = interpolate(f, [0, 60, 180], [900, 260, 200], {easing: Easing.out(Easing.ease)});
  const sunGlow = interpolate(f, [0, 60, 180], [0, 1, 1]);
  const bird1X = interpolate(f, [20, 160], [-200, 2100], {extrapolateRight: 'clamp'});
  const bird2X = interpolate(f, [50, 170], [-200, 2100], {extrapolateRight: 'clamp'});
  const bird3X = interpolate(f, [80, 180], [-200, 2100], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 1500, top: sunY, fontSize: 180, opacity: sunGlow, filter: 'drop-shadow(0 0 80px #fbbf24)'}}>☀️</div>
      <div style={{position: 'absolute', left: bird1X, top: 360, fontSize: 64}}>🕊️</div>
      <div style={{position: 'absolute', left: bird2X, top: 480, fontSize: 52}}>🐦</div>
      <div style={{position: 'absolute', left: bird3X, top: 420, fontSize: 56}}>🕊️</div>
    </AbsoluteFill>
  );
};

// ── 转：风雨突至 ──
const Scene3Zhuan: React.FC = () => {
  const f = useCurrentFrame() - 360;
  if (f < 0 || f > 180) return null;
  const rainOpacity = interpolate(f, [0, 30, 150, 180], [0, 0.8, 0.85, 0.4]);
  const flashOpacity = f > 60 && f < 70 ? 1 : f > 120 && f < 128 ? 0.9 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.85)', opacity: flashOpacity}} />
      {[...Array(80)].map((_, i) => {
        const col = (i * 31) % 1920;
        const offsetY = ((f * 18 + i * 47) % 1200) - 100;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: col,
              top: offsetY,
              width: 2,
              height: 50,
              background: 'linear-gradient(180deg, transparent, rgba(200,220,255,0.9))',
              transform: 'rotate(15deg)',
              opacity: rainOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── 合：落花飘零 ──
const Scene4He: React.FC = () => {
  const f = useCurrentFrame() - 540;
  if (f < 0 || f > 180) return null;
  return (
    <AbsoluteFill>
      {[...Array(24)].map((_, i) => {
        const startDelay = i * 6;
        const localF = f - startDelay;
        if (localF < 0) return null;
        const x = ((i * 173) % 1920);
        const y = interpolate(localF, [0, 120], [-80, 1100], {extrapolateRight: 'clamp'});
        const rotate = interpolate(localF, [0, 120], [0, 480]);
        const opacity = interpolate(localF, [0, 10, 100, 120], [0, 1, 1, 0]);
        const petals = ['✿', '❀', '✾', '❁'];
        const colors = ['#f8c3c3', '#fbb6ce', '#f9a8d4', '#f472b6'];
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 36, color: colors[i % 4], opacity, transform: `rotate(${rotate}deg)`}}>
            {petals[i % 4]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── 诗句字幕 ──
const Verse: React.FC<{actIdx: number}> = ({actIdx}) => {
  const f = useCurrentFrame();
  const actStart = ACTS[actIdx].start;
  const localF = f - actStart;
  if (localF < 0 || localF > SCENE_FRAMES) return null;
  const opacity = interpolate(localF, [0, 20, SCENE_FRAMES - 20, SCENE_FRAMES], [0, 1, 1, 0]);
  const scale = interpolate(localF, [0, 30], [0.88, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.ease)});
  const y = interpolate(localF, [0, 30], [-30, 0], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '48%',
        transform: `translate(-50%, -50%) translateY(${y}px) scale(${scale})`,
        fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
        fontSize: 96,
        letterSpacing: '0.35em',
        color: actIdx === 0 || actIdx === 2 ? '#fff' : '#1f2937',
        textShadow: actIdx === 0 || actIdx === 2 ? '0 4px 24px rgba(0,0,0,.6)' : '0 4px 24px rgba(255,255,255,.7)',
        fontWeight: 500,
        opacity,
        whiteSpace: 'nowrap',
      }}
    >
      {ACTS[actIdx].verse}
    </div>
  );
};

// ── 四大字（起承转合）── 
const ActLabel: React.FC<{actIdx: number}> = ({actIdx}) => {
  const f = useCurrentFrame();
  return (
    <>
      {ACTS.map((a, i) => {
        const isActive = i === actIdx;
        const localF = f - a.start;
        const scale = isActive ? interpolate(localF, [0, 20], [1, 1.3], {extrapolateRight: 'clamp'}) : 1;
        const opacity = isActive ? 1 : 0.15;
        const color = isActive ? '#fbbf24' : '#fde68a';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${10 + i * 25}%`,
              top: 60,
              fontSize: 80,
              fontFamily: '"Noto Serif SC", "STKaiti", serif',
              fontWeight: 700,
              color,
              opacity,
              transform: `scale(${scale})`,
              textShadow: '0 4px 20px rgba(0,0,0,.4)',
              transition: 'transform 0.5s',
            }}
          >
            {a.label}
          </div>
        );
      })}
    </>
  );
};

// ── 进度条 ──
const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 60, height: 14, display: 'flex', gap: 8}}>
      {[0, 1, 2, 3].map((i) => {
        const localF = f - i * SCENE_FRAMES;
        const fill = interpolate(localF, [0, SCENE_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={i} style={{flex: 1, background: 'rgba(0,0,0,.35)', borderRadius: 7, overflow: 'hidden', position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #fbbf24, #dc2626)', transformOrigin: 'left', transform: `scaleX(${fill})`}} />
          </div>
        );
      })}
    </div>
  );
};

// ── 诗题 ──
const Title: React.FC = () => (
  <div style={{position: 'absolute', right: 60, top: 60, textAlign: 'right', fontFamily: '"Noto Serif SC", "STKaiti", serif', color: 'rgba(255,255,255,0.7)'}}>
    <div style={{fontSize: 28, letterSpacing: '0.2em'}}>孟 浩 然</div>
    <div style={{fontSize: 44, letterSpacing: '0.15em', marginTop: 8, fontWeight: 500}}>《 春 晓 》</div>
    <div style={{fontSize: 20, marginTop: 8, opacity: 0.75}}>起 · 承 · 转 · 合</div>
  </div>
);

export const ChunxiaoQCH: React.FC = () => {
  const f = useCurrentFrame();
  const actIdx = Math.min(3, Math.floor(f / SCENE_FRAMES));
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={180}>
        <Scene1Qi />
      </Sequence>
      <Sequence from={180} durationInFrames={180}>
        <Scene2Cheng />
      </Sequence>
      <Sequence from={360} durationInFrames={180}>
        <Scene3Zhuan />
      </Sequence>
      <Sequence from={540} durationInFrames={180}>
        <Scene4He />
      </Sequence>
      <ActLabel actIdx={actIdx} />
      <Verse actIdx={actIdx} />
      <Progress />
      <Title />
    </AbsoluteFill>
  );
};
