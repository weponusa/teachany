import React from "react";
import { Composition, registerRoot } from "remotion";
import { WaterEarthVideo } from "./WaterEarthVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="WaterEarthVideo"
      component={WaterEarthVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
