import React from "react";
import { Composition, registerRoot } from "remotion";
import { AnimalLifeCycleVideo } from "./AnimalLifeCycleVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AnimalLifeCycleVideo"
      component={AnimalLifeCycleVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
