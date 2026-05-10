import React from "react";
import { Composition, registerRoot } from "remotion";
import { PlantPartsVideo } from "./PlantPartsVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PlantPartsVideo"
      component={PlantPartsVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
