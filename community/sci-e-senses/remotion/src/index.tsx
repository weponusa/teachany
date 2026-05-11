import React from "react";
import { Composition, registerRoot } from "remotion";
import { SensesVideo } from "./SensesVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SensesVideo"
      component={SensesVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
