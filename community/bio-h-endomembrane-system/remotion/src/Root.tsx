import React from 'react';
import {Composition} from 'remotion';
import {SecretoryPathway} from './compositions/SecretoryPathway';

export const Root: React.FC = () => {
  return (
    <Composition
      id="SecretoryPathway"
      component={SecretoryPathway}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
