import { Composition } from 'remotion';
import { RussianRevolutionVideo } from './RussianRevolution';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RussianRevolutionMain"
        component={RussianRevolutionVideo}
        durationInFrames={1440}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

import React from 'react';
import { registerRoot } from 'remotion';
registerRoot(RemotionRoot);
