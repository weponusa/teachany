import React from "react";
import { Composition, registerRoot } from "remotion";
import { SolidLiquidGasVideo } from "./SolidLiquidGasVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SolidLiquidGasVideo"
      component={SolidLiquidGasVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
