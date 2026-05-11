import React from "react";
import { Composition, registerRoot } from "remotion";
import { GravityVideo } from "./GravityVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="GravityVideo"
      component={GravityVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
