import React from "react";
import { Composition, registerRoot } from "remotion";
import { ObjectPropertiesVideo } from "./ObjectPropertiesVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ObjectPropertiesVideo"
      component={ObjectPropertiesVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
