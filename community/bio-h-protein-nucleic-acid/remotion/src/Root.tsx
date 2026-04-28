import React from 'react';
import {Composition} from 'remotion';
import {PeptideBondFormation} from './compositions/PeptideBondFormation';

export const Root: React.FC = () => {
  return (
    <Composition
      id="PeptideBondFormation"
      component={PeptideBondFormation}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
