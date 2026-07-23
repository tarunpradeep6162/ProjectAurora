import FloatingParticles from "../effects/FloatingParticles";
import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import EnvironmentController from "./controllers/EnvironmentController";
import CinematicLightingRig from "./lighting/CinematicLightingRig";
import LightingController from "./lighting/LightingController";
import VolumetricHaze from "./lighting/VolumetricHaze";
import AtmosphericDepth from "./objects/AtmosphericDepth";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";
import Effects from "./postprocessing/Effects";

function CinematicScene({
  quality,
}) {
  return (
    <EnvironmentController
      motionEnabled={
        quality.motionEnabled
      }
    >
      <LightingController
        enabled={true}
        qualityLevel={
          quality.level
        }
        isMobile={
          quality.isMobile
        }
      >
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

        <VolumetricHaze
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
          motionEnabled={
            quality.motionEnabled
          }
        />

        <CinematicLightingRig
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
          motionEnabled={
            quality.motionEnabled
          }
        />

        <AtmosphericDepth
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
          motionEnabled={
            quality.motionEnabled
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
          qualityLevel={
            quality.level
          }
          motionEnabled={
            quality.motionEnabled
          }
        />

        <FloatingParticles
          count={
            quality.particleCount
          }
          qualityLevel={
            quality.level
          }
          motionEnabled={
            quality.motionEnabled
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
      </LightingController>
    </EnvironmentController>
  );
}

export default CinematicScene;
