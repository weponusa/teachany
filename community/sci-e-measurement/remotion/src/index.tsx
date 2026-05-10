import React from "react";
import { Composition, registerRoot } from "remotion";
import { MeasurementVideo } from "./MeasurementVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MeasurementVideo"
      component={MeasurementVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
