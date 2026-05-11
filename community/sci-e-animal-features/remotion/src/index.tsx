import React from "react";
import { Composition, registerRoot } from "remotion";
import { AnimalFeaturesVideo } from "./AnimalFeaturesVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AnimalFeaturesVideo"
      component={AnimalFeaturesVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
