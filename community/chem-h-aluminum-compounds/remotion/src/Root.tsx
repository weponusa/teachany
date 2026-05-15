import { Composition } from "remotion";
import { ThermiteReaction } from "./compositions/ThermiteReaction";

export const Root: React.FC = () => {
  return (
    <Composition
      id="ThermiteReaction"
      component={ThermiteReaction}
      durationInFrames={150}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{}}
    />
  );
};
