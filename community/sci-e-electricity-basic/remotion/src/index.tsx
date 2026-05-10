import React from "react";
import { Composition, registerRoot } from "remotion";
import { ElectricityVideo } from "./ElectricityVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ElectricityVideo"
      component={ElectricityVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
