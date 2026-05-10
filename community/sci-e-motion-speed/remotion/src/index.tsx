import React from "react";
import { Composition, registerRoot } from "remotion";
import { MotionSpeedVideo } from "./MotionSpeedVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MotionSpeedVideo"
      component={MotionSpeedVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
