import React from 'react';
import {Composition} from 'remotion';
import {ElementsCompounds} from './compositions/ElementsCompounds';

export const Root: React.FC = () => {
  return (
    <Composition
      id="ElementsCompounds"
      component={ElementsCompounds}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
