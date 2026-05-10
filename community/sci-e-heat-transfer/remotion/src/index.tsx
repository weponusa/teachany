import React from "react";
import { Composition, registerRoot } from "remotion";
import { HeatTransferVideo } from "./HeatTransferVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HeatTransferVideo"
      component={HeatTransferVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
