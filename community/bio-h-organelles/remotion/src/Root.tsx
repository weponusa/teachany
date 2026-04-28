import React from 'react';
import {Composition} from 'remotion';
import {OrganelleCooperation} from './compositions/OrganelleCooperation';

export const Root: React.FC = () => {
  return (
    <Composition
      id="OrganelleCooperation"
      component={OrganelleCooperation}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
