import React from "react";
import { Composition, registerRoot } from "remotion";
import { PlantLifeCycleVideo } from "./PlantLifeCycleVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PlantLifeCycleVideo"
      component={PlantLifeCycleVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
