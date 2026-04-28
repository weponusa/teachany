import React from 'react';
import {Composition} from 'remotion';
import {CellComparison} from './compositions/CellComparison';

export const Root: React.FC = () => {
  return (
    <Composition
      id="CellComparison"
      component={CellComparison}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
