import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";
import Effects from "./postprocessing/Effects";

function CinematicScene({ quality }) {
  return (
    <>
      <CameraRig
        motionEnabled={
          quality.motionEnabled
        }
        qualityLevel={
          quality.level
        }
      />

      <AdaptiveQuality
        maximumDpr={
          quality.maxDpr
        }
        minimumDpr={
          quality.minimumDpr
        }
        initialDpr={
          quality.initialDpr
        }
        isMobile={
          quality.isMobile
        }
      />

      <Nebula
        motionEnabled={
          quality.motionEnabled
        }
        qualityLevel={
          quality.level
        }
      />

      <StarField
        count={
          quality.starCount
        }
        motionEnabled={
          quality.motionEnabled
        }
        qualityLevel={
          quality.level
        }
      />

      {quality.postprocessingEnabled && (
        <Effects
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
        />
      )}
    </>
  );
}

export default CinematicScene;
