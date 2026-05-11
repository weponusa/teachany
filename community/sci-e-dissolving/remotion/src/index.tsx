import React from "react";
import { Composition, registerRoot } from "remotion";
import { DissolvingVideo } from "./DissolvingVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DissolvingVideo"
      component={DissolvingVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
