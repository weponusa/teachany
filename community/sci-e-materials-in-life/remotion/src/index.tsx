import React from "react";
import { Composition, registerRoot } from "remotion";
import { MaterialsVideo } from "./MaterialsVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MaterialsVideo"
      component={MaterialsVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
