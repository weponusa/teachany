import React from "react";
import { Composition, registerRoot } from "remotion";
import { WorldRegionsVideo } from "./WorldRegionsVideo";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WorldRegionsVideo"
        component={WorldRegionsVideo}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
