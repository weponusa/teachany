import React from "react";
import { Composition, registerRoot } from "remotion";
import { LightVideo } from "./LightVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LightVideo"
      component={LightVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
