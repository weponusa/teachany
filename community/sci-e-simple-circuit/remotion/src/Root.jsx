import { Composition, Series, AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from 'remotion';
import React from 'react';
import { CircuitScene } from './CircuitAnimation';

// 完整视频：三段场景串联
function CircuitVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0-5s: 元件介绍
  // 5-10s: 断路
  // 10-18s: 通路+粒子
  const totalFrames = 18 * fps;
  const phase = frame < 5 * fps ? 0 : frame < 10 * fps ? 1 : 2;

  return (
    <AbsoluteFill>
      <CircuitScene phase={phase} />
    </AbsoluteFill>
  );
}

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CircuitVideo"
        component={CircuitVideo}
        durationInFrames={18 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
