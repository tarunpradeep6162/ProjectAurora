import FloatingParticles from "../effects/FloatingParticles";
import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import EnvironmentController from "./controllers/EnvironmentController";
import CinematicLightingRig from "./lighting/CinematicLightingRig";
import LightingController from "./lighting/LightingController";
import AtmosphericDepth from "./objects/AtmosphericDepth";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";
import AdaptiveQualityController, {
  useAdaptiveQuality,
} from "./performance/AdaptiveQualityController";
import PerformanceMonitor from "./performance/PerformanceMonitor";
import Effects from "./postprocessing/Effects";
import EffectsController from "./postprocessing/controllers/EffectsController";
import VolumetricHaze from "./lighting/VolumetricHaze";

function AdaptiveCinematicContent() {
  const {
    quality,
  } = useAdaptiveQuality();

  return (
    <EnvironmentController
      motionEnabled={
        quality.motionEnabled
      }
    >
      <LightingController
        enabled={
          quality.lightingEnabled
        }
        qualityLevel={
          quality.level
        }
        isMobile={
          quality.isMobile
        }
      >
        <EffectsController
          enabled={
            quality
              .postprocessingEnabled
          }
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
        >
          <AdaptiveQuality
            quality={quality}
          />

          <CameraRig
            enabled={
              quality.motionEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            motionMultiplier={
              quality
                .cameraMotionMultiplier
            }
          />

          <CinematicLightingRig
            enabled={
              quality.lightingEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            intensityMultiplier={
              quality
                .lightingMultiplier
            }
          />

          <VolumetricHaze
            enabled={
              quality.hazeEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            densityMultiplier={
              quality
                .hazeMultiplier
            }
          />

          <AtmosphericDepth
            enabled={
              quality
                .atmosphereEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
          />

          <Nebula
            enabled={
              quality.nebulaEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            motionEnabled={
              quality.motionEnabled
            }
            densityMultiplier={
              quality
                .nebulaMultiplier
            }
          />

          <StarField
            enabled={
              quality.starsEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            motionEnabled={
              quality.motionEnabled
            }
            densityMultiplier={
              quality
                .starMultiplier
            }
          />

          <FloatingParticles
            enabled={
              quality
                .particlesEnabled
            }
            qualityLevel={
              quality.level
            }
            isMobile={
              quality.isMobile
            }
            motionEnabled={
              quality.motionEnabled
            }
            densityMultiplier={
              quality
                .particleMultiplier
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
              bloomEnabled={
                quality.bloomEnabled
              }
              colorGradingEnabled={
                quality
                  .colorGradingEnabled
              }
              chromaticAberrationEnabled={
                quality
                  .chromaticAberrationEnabled
              }
              noiseEnabled={
                quality.noiseEnabled
              }
              vignetteEnabled={
                quality
                  .vignetteEnabled
              }
              bloomMultiplier={
                quality
                  .bloomMultiplier
              }
            />
          )}
        </EffectsController>
      </LightingController>
    </EnvironmentController>
  );
}

function CinematicScene({
  quality,
}) {
  return (
    <PerformanceMonitor>
      <AdaptiveQualityController
        quality={quality}
      >
        <AdaptiveCinematicContent />
      </AdaptiveQualityController>
    </PerformanceMonitor>
  );
}

export default CinematicScene;
