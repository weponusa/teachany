import React from "react";
import { Composition, registerRoot } from "remotion";
import { WeatherVideo } from "./WeatherVideo";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="WeatherVideo"
      component={WeatherVideo}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(RemotionRoot);
