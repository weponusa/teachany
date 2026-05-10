import React from "react";
import { Composition, registerRoot } from "remotion";
import { LivingNonlivingVideo } from "./LivingNonlivingVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LivingNonlivingVideo"
      component={LivingNonlivingVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
