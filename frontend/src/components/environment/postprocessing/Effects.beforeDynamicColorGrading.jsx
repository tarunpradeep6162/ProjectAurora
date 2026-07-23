import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import {
  useMemo,
  useRef,
} from "react";
import {
  BlendFunction,
} from "postprocessing";
import { Vector2 } from "three";
import {
  useEffectsController,
} from "./controllers/EffectsController";

function Effects({
  qualityLevel = "high",
  isMobile = false,
}) {
  const bloomRef =
    useRef(null);

  const {
    effectsStateRef,
  } =
    useEffectsController();

  const isReduced =
    qualityLevel === "reduced";

  const isLow =
    qualityLevel === "low";

  const isMedium =
    qualityLevel === "medium";

  const initialBloomIntensity =
    isReduced
      ? 0.28
      : isLow
        ? 0.32
        : isMedium
          ? 0.42
          : isMobile
            ? 0.48
            : 0.56;

  const initialBloomThreshold =
    isMobile
      ? 0.22
      : 0.18;

  const initialBloomSmoothing =
    isMobile
      ? 0.78
      : 0.9;

  const noiseOpacity =
    isReduced
      ? 0
      : isMobile
        ? 0.006
        : 0.011;

  const vignetteDarkness =
    isMobile
      ? 0.68
      : 0.76;

  const enableChromaticAberration =
    !isMobile &&
    !isReduced &&
    !isLow;

  const enableColorGrading =
    !isReduced;

  const chromaticOffset =
    useMemo(
      () =>
        new Vector2(
          0.00018,
          0.0001
        ),
      []
    );

  useFrame(() => {
    const bloomEffect =
      bloomRef.current;

    if (!bloomEffect) {
      return;
    }

    const effects =
      effectsStateRef.current;

    bloomEffect.intensity =
      effects.bloomIntensity;

    const luminanceMaterial =
      bloomEffect
        .luminancePass
        ?.fullscreenMaterial ??
      bloomEffect
        .luminanceMaterial;

    if (!luminanceMaterial) {
      return;
    }

    if (
      "threshold" in
      luminanceMaterial
    ) {
      luminanceMaterial.threshold =
        effects.bloomThreshold;
    }

    if (
      "smoothing" in
      luminanceMaterial
    ) {
      luminanceMaterial.smoothing =
        effects.bloomSmoothing;
    }
  });

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
        ref={bloomRef}
        intensity={
          initialBloomIntensity
        }
        luminanceThreshold={
          initialBloomThreshold
        }
        luminanceSmoothing={
          initialBloomSmoothing
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
            chromaticOffset
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
