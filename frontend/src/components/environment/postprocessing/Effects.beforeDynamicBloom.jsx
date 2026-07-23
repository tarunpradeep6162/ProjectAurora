import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

function Effects({
  qualityLevel = "high",
  isMobile = false,
}) {
  const isReduced =
    qualityLevel === "reduced";

  const isLow =
    qualityLevel === "low";

  const isMedium =
    qualityLevel === "medium";

  const bloomIntensity = isReduced
    ? 0.28
    : isLow
      ? 0.32
      : isMedium
        ? 0.42
        : isMobile
          ? 0.48
          : 0.56;

  const bloomThreshold = isMobile
    ? 0.22
    : 0.18;

  const bloomSmoothing = isMobile
    ? 0.78
    : 0.9;

  const noiseOpacity = isReduced
    ? 0
    : isMobile
      ? 0.006
      : 0.011;

  const vignetteDarkness = isMobile
    ? 0.68
    : 0.76;

  const enableChromaticAberration =
    !isMobile &&
    !isReduced &&
    !isLow;

  const enableColorGrading =
    !isReduced;

  return (
    <EffectComposer
      multisampling={
        isMobile || isLow
          ? 0
          : 4
      }
      enableNormalPass={false}
    >
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={
          bloomThreshold
        }
        luminanceSmoothing={
          bloomSmoothing
        }
        mipmapBlur
      />

      {enableColorGrading && (
        <HueSaturation
          blendFunction={
            BlendFunction.NORMAL
          }
          hue={-0.008}
          saturation={
            isMobile
              ? 0.07
              : 0.1
          }
        />
      )}

      {enableColorGrading && (
        <BrightnessContrast
          blendFunction={
            BlendFunction.NORMAL
          }
          brightness={
            isMobile
              ? 0.005
              : 0.012
          }
          contrast={
            isMobile
              ? 0.045
              : 0.065
          }
        />
      )}

      {enableChromaticAberration && (
        <ChromaticAberration
          blendFunction={
            BlendFunction.NORMAL
          }
          offset={
            new Vector2(
              0.00018,
              0.0001
            )
          }
          radialModulation
          modulationOffset={0.72}
        />
      )}

      {noiseOpacity > 0 && (
        <Noise
          blendFunction={
            BlendFunction.SOFT_LIGHT
          }
          opacity={noiseOpacity}
          premultiply
        />
      )}

      <Vignette
        eskil={false}
        offset={
          isMobile
            ? 0.22
            : 0.18
        }
        darkness={
          vignetteDarkness
        }
      />
    </EffectComposer>
  );
}

export default Effects;
