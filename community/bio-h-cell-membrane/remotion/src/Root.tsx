import React from 'react';
import {Composition} from 'remotion';
import {MembraneTransport} from './compositions/MembraneTransport';

export const Root: React.FC = () => {
  return (
    <Composition
      id="MembraneTransport"
      component={MembraneTransport}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
