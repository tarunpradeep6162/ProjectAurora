import FloatingParticles from "../effects/FloatingParticles";
import AdaptiveQuality from "./AdaptiveQuality";
import CameraRig from "./CameraRig";
import PerformanceMonitor from "./performance/PerformanceMonitor";
import EnvironmentController from "./controllers/EnvironmentController";
import CinematicLightingRig from "./lighting/CinematicLightingRig";
import LightingController from "./lighting/LightingController";
import VolumetricHaze from "./lighting/VolumetricHaze";
import AtmosphericDepth from "./objects/AtmosphericDepth";
import Nebula from "./objects/Nebula";
import StarField from "./objects/StarField";
import Effects from "./postprocessing/Effects";
import EffectsController from "./postprocessing/controllers/EffectsController";

function CinematicScene({
  quality,
}) {
  /*
   * CinematicScene must already be rendered inside the React Three
   * Fiber <Canvas>.
   *
   * PerformanceMonitor uses useFrame() and useThree(), so it must
   * remain inside Canvas and outside all cinematic controllers.
   */
  return (
    <PerformanceMonitor>
      <EnvironmentController
        motionEnabled={
          quality.motionEnabled
        }
      >
        <LightingController
          enabled
          qualityLevel={
            quality.level
          }
          isMobile={
            quality.isMobile
          }
        >
          <EffectsController
            enabled={
              quality.postprocessingEnabled
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
            />

            <CinematicLightingRig
              enabled
              qualityLevel={
                quality.level
              }
              isMobile={
                quality.isMobile
              }
            />

            <VolumetricHaze
              enabled={
                quality.atmosphereEnabled
              }
              qualityLevel={
                quality.level
              }
              isMobile={
                quality.isMobile
              }
            />

            <AtmosphericDepth
              enabled={
                quality.atmosphereEnabled
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
            />

            <FloatingParticles
              enabled={
                quality.particlesEnabled
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
          </EffectsController>
        </LightingController>
      </EnvironmentController>
    </PerformanceMonitor>
  );
}

export default CinematicScene;
