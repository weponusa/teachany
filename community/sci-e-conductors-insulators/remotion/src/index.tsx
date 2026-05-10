import React from "react";
import { Composition, registerRoot } from "remotion";
import { ConductorsVideo } from "./ConductorsVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ConductorsVideo"
      component={ConductorsVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
