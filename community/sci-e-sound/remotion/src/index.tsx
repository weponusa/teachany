import React from "react";
import { Composition, registerRoot } from "remotion";
import { SoundVideo } from "./SoundVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SoundVideo"
      component={SoundVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
