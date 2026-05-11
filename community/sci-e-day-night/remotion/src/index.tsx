import React from "react";
import { Composition, registerRoot } from "remotion";
import { DayNightVideo } from "./DayNightVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DayNightVideo"
      component={DayNightVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
