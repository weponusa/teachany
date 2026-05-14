import React from "react";
import { Composition, registerRoot } from "remotion";
import { BlenderModelingDemo } from "./compositions/BlenderModelingDemo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BlenderModelingDemo"
      component={BlenderModelingDemo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
