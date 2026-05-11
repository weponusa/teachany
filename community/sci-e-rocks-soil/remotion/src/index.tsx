import React from "react";
import { Composition, registerRoot } from "remotion";
import { RocksSoilVideo } from "./RocksSoilVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="RocksSoilVideo"
      component={RocksSoilVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
