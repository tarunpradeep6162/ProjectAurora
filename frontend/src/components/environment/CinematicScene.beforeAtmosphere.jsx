import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";
import Effects from "./postprocessing/Effects";

import FloatingParticles from "../effects/FloatingParticles";

function CinematicScene({ quality }) {
  return (
    <>
      <CameraRig
        motionEnabled={quality.motionEnabled}
        qualityLevel={quality.level}
      />

      <AdaptiveQuality
        maximumDpr={quality.maxDpr}
        minimumDpr={quality.minimumDpr}
        initialDpr={quality.initialDpr}
        isMobile={quality.isMobile}
      />

      <Nebula
        motionEnabled={quality.motionEnabled}
        qualityLevel={quality.level}
      />

      <StarField
        count={quality.starCount}
        qualityLevel={quality.level}
        motionEnabled={quality.motionEnabled}
      />

      <FloatingParticles
        count={quality.particleCount}
        qualityLevel={quality.level}
        motionEnabled={quality.motionEnabled}
      />

      {quality.postprocessingEnabled && (
        <Effects
          qualityLevel={quality.level}
          isMobile={quality.isMobile}
        />
      )}
    </>
  );
}

export default CinematicScene;
