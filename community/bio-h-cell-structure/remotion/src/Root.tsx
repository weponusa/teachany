import React from 'react';
import {Composition} from 'remotion';
import {CellStructureTour} from './compositions/CellStructureTour';

export const Root: React.FC = () => {
  return (
    <Composition
      id="CellStructureTour"
      component={CellStructureTour}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
