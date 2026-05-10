import React from "react";
import { Composition, registerRoot } from "remotion";
import { ClassificationVideo } from "./ClassificationVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ClassificationVideo"
      component={ClassificationVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
