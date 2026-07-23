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

function updateBloomEffect(
  bloomEffect,
  effects
) {
  if (!bloomEffect) {
    return;
  }

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
}

function updateHueSaturationEffect(
  colorEffect,
  effects
) {
  if (!colorEffect) {
    return;
  }

  if (
    "hue" in
    colorEffect
  ) {
    colorEffect.hue =
      effects.hue;
  }

  if (
    "saturation" in
    colorEffect
  ) {
    colorEffect.saturation =
      effects.saturation;
  }
}

function updateBrightnessContrastEffect(
  brightnessContrastEffect,
  effects
) {
  if (!brightnessContrastEffect) {
    return;
  }

  if (
    "brightness" in
    brightnessContrastEffect
  ) {
    brightnessContrastEffect.brightness =
      effects.brightness;
  }

  if (
    "contrast" in
    brightnessContrastEffect
  ) {
    brightnessContrastEffect.contrast =
      effects.contrast;
  }
}

function Effects({
  qualityLevel = "high",
  isMobile = false,
}) {
  const bloomRef =
    useRef(null);

  const hueSaturationRef =
    useRef(null);

  const brightnessContrastRef =
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

  const initialHue =
    -0.008;

  const initialSaturation =
    isMobile
      ? 0.07
      : 0.1;

  const initialBrightness =
    isMobile
      ? 0.005
      : 0.012;

  const initialContrast =
    isMobile
      ? 0.045
      : 0.065;

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
    const effects =
      effectsStateRef.current;

    updateBloomEffect(
      bloomRef.current,
      effects
    );

    if (
      enableColorGrading
    ) {
      updateHueSaturationEffect(
        hueSaturationRef.current,
        effects
      );

      updateBrightnessContrastEffect(
        brightnessContrastRef.current,
        effects
      );
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
          ref={
            hueSaturationRef
          }
          blendFunction={
            BlendFunction.NORMAL
          }
          hue={
            initialHue
          }
          saturation={
            initialSaturation
          }
        />
      )}

      {enableColorGrading && (
        <BrightnessContrast
          ref={
            brightnessContrastRef
          }
          blendFunction={
            BlendFunction.NORMAL
          }
          brightness={
            initialBrightness
          }
          contrast={
            initialContrast
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
          opacity={
            noiseOpacity
          }
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
