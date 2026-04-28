import React from 'react';
import {Composition} from 'remotion';
import {EnergyMetabolism} from './compositions/EnergyMetabolism';

export const Root: React.FC = () => {
  return (
    <Composition
      id="EnergyMetabolism"
      component={EnergyMetabolism}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
