import React from 'react';
import {Composition} from 'remotion';
import {DNAPackaging} from './compositions/DNAPackaging';

export const Root: React.FC = () => {
  return (
    <Composition
      id="DNAPackaging"
      component={DNAPackaging}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
