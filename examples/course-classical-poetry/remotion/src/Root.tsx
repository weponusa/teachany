import React from 'react';
import {Composition} from 'remotion';
import {ChunxiaoQCH} from './compositions/ChunxiaoQCH';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ChunxiaoQCH"
        component={ChunxiaoQCH}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
