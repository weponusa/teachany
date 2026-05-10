import React from "react";
import { Composition, registerRoot } from "remotion";
import { MoonPhasesVideo } from "./MoonPhasesVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MoonPhasesVideo"
      component={MoonPhasesVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
