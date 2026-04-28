import React from 'react';
import {Composition} from 'remotion';
import {SugarLipidClassify} from './compositions/SugarLipidClassify';

export const Root: React.FC = () => {
  return (
    <Composition
      id="SugarLipidClassify"
      component={SugarLipidClassify}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
