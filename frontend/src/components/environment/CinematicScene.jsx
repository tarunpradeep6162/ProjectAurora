import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";

function CinematicScene({ quality }) {
  return (
    <>
      <CameraRig
        motionEnabled={quality.motionEnabled}
      />

      <AdaptiveQuality
        maximumDpr={quality.maxDpr}
        minimumDpr={0.75}
      />

      <Nebula
        motionEnabled={quality.motionEnabled}
        qualityLevel={quality.level}
      />

      <StarField
        count={quality.starCount}
        motionEnabled={quality.motionEnabled}
      />
    </>
  );
}

export default CinematicScene;
