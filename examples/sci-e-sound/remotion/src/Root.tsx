import React from 'react';
import {Composition} from 'remotion';
import {SoundWave} from './compositions/SoundWave';

export const Root: React.FC = () => {
  return (
    <Composition
      id="SoundWave"
      component={SoundWave}
      durationInFrames={144}
      fps={24}
      width={1280}
      height={720}
    />
  );
};
