import React from "react";
import { Composition, registerRoot } from "remotion";
import { PushPullVideo } from "./PushPullVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PushPullVideo"
      component={PushPullVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
