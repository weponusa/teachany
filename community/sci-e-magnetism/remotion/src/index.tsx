import React from "react";
import { Composition, registerRoot } from "remotion";
import { MagnetismVideo } from "./MagnetismVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MagnetismVideo"
      component={MagnetismVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
