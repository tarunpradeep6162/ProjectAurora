import {
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useLightingController,
} from "../../lighting/LightingController";

const EffectsContext =
  createContext(null);

function clamp(
  value,
  minimum = 0,
  maximum = 1
) {
  return THREE.MathUtils.clamp(
    value,
    minimum,
    maximum
  );
}

function getQualitySettings(
  qualityLevel,
  isMobile
) {
  if (
    qualityLevel === "reduced"
  ) {
    return {
      bloomMultiplier: 0.52,
      gradingMultiplier: 0,
      noiseMultiplier: 0,
      chromaticMultiplier: 0,
      vignetteMultiplier: 0.82,
    };
  }

  if (
    qualityLevel === "low"
  ) {
    return {
      bloomMultiplier: 0.68,
      gradingMultiplier: 0.62,
      noiseMultiplier: 0,
      chromaticMultiplier: 0,
      vignetteMultiplier: 0.88,
    };
  }

  if (
    qualityLevel === "medium"
  ) {
    return {
      bloomMultiplier: 0.84,
      gradingMultiplier: 0.82,
      noiseMultiplier: isMobile
        ? 0.42
        : 0.72,
      chromaticMultiplier: 0,
      vignetteMultiplier: 0.94,
    };
  }

  return {
    bloomMultiplier: isMobile
      ? 0.9
      : 1,

    gradingMultiplier: isMobile
      ? 0.88
      : 1,

    noiseMultiplier: isMobile
      ? 0.62
      : 1,

    chromaticMultiplier: isMobile
      ? 0
      : 1,

    vignetteMultiplier: 1,
  };
}

function EffectsController({
  children,
  enabled = true,
  qualityLevel = "high",
  isMobile = false,
}) {
  const {
    lightingStateRef,
  } =
    useLightingController();

  const qualitySettings =
    useMemo(
      () =>
        getQualitySettings(
          qualityLevel,
          isMobile
        ),
      [
        qualityLevel,
        isMobile,
      ]
    );

  const effectsStateRef =
    useRef({
      enabled,

      bloomIntensity: 0.56,
      bloomThreshold: 0.18,
      bloomSmoothing: 0.9,

      exposure: 1,
      brightness: 0.012,
      contrast: 0.065,

      hue: -0.008,
      saturation: 0.1,

      noiseOpacity: 0.011,

      vignetteOffset: 0.18,
      vignetteDarkness: 0.76,

      chromaticOffsetX: 0.00018,
      chromaticOffsetY: 0.0001,
      chromaticModulation: 0.72,

      warmth: 0,
      depth: 0.18,
      calmness: 1,
      scrollEnergy: 0,
      endingFade: 0,
      cinematicIntensity: 0.72,
    });

  useFrame((_, delta) => {
    const lighting =
      lightingStateRef.current;

    const effects =
      effectsStateRef.current;

    effects.enabled =
      enabled;

    const safeDelta =
      Math.min(
        delta,
        0.05
      );

    const damping =
      1 -
      Math.exp(
        -safeDelta * 5.2
      );

    if (!enabled) {
      effects.bloomIntensity =
        THREE.MathUtils.lerp(
          effects.bloomIntensity,
          0,
          damping
        );

      effects.brightness =
        THREE.MathUtils.lerp(
          effects.brightness,
          0,
          damping
        );

      effects.contrast =
        THREE.MathUtils.lerp(
          effects.contrast,
          0,
          damping
        );

      effects.saturation =
        THREE.MathUtils.lerp(
          effects.saturation,
          0,
          damping
        );

      effects.noiseOpacity =
        THREE.MathUtils.lerp(
          effects.noiseOpacity,
          0,
          damping
        );

      effects.chromaticOffsetX =
        THREE.MathUtils.lerp(
          effects.chromaticOffsetX,
          0,
          damping
        );

      effects.chromaticOffsetY =
        THREE.MathUtils.lerp(
          effects.chromaticOffsetY,
          0,
          damping
        );

      return;
    }

    const bloomMultiplier =
      qualitySettings
        .bloomMultiplier;

    const gradingMultiplier =
      qualitySettings
        .gradingMultiplier;

    const noiseMultiplier =
      qualitySettings
        .noiseMultiplier;

    const chromaticMultiplier =
      qualitySettings
        .chromaticMultiplier;

    const vignetteMultiplier =
      qualitySettings
        .vignetteMultiplier;

    const warmth =
      clamp(
        lighting.warmth
      );

    const depth =
      clamp(
        lighting.depth
      );

    const calmness =
      clamp(
        lighting.calmness
      );

    const scrollEnergy =
      clamp(
        lighting.scrollEnergy,
        0,
        0.3
      );

    const endingFade =
      clamp(
        lighting.endingFade
      );

    const cinematicIntensity =
      clamp(
        lighting.bloomIntensity /
          1.08,
        0,
        1.2
      );

    const targetBloomIntensity =
      clamp(
        (
          0.34 +
          lighting
            .bloomIntensity *
            0.46 +
          warmth * 0.12 +
          depth * 0.09 +
          scrollEnergy * 0.12 -
          endingFade * 0.18
        ) *
          bloomMultiplier,
        0.22,
        0.94
      );

    const targetBloomThreshold =
      clamp(
        (
          isMobile
            ? 0.24
            : 0.19
        ) -
          warmth * 0.025 -
          depth * 0.018 +
          endingFade * 0.025,
        0.12,
        0.29
      );

    const targetBloomSmoothing =
      clamp(
        (
          isMobile
            ? 0.78
            : 0.9
        ) +
          calmness * 0.035 -
          scrollEnergy * 0.04,
        0.7,
        0.96
      );

    const targetExposure =
      clamp(
        lighting.exposure +
          warmth * 0.025 +
          scrollEnergy * 0.025 -
          endingFade * 0.06,
        0.82,
        1.1
      );

    const targetBrightness =
      clamp(
        (
          (
            isMobile
              ? 0.004
              : 0.01
          ) +
          warmth * 0.012 +
          cinematicIntensity *
            0.006 -
          endingFade * 0.01
        ) *
          gradingMultiplier,
        -0.01,
        0.032
      );

    const targetContrast =
      clamp(
        (
          (
            isMobile
              ? 0.038
              : 0.058
          ) +
          depth * 0.035 +
          cinematicIntensity *
            0.018 -
          endingFade * 0.015
        ) *
          gradingMultiplier,
        0,
        0.12
      );

    const targetHue =
      clamp(
        -0.012 +
          warmth * 0.018 -
          depth * 0.004,
        -0.018,
        0.012
      );

    const targetSaturation =
      clamp(
        (
          (
            isMobile
              ? 0.055
              : 0.085
          ) +
          warmth * 0.075 +
          depth * 0.022 -
          endingFade * 0.025
        ) *
          gradingMultiplier,
        0,
        0.18
      );

    const targetNoiseOpacity =
      clamp(
        (
          (
            isMobile
              ? 0.005
              : 0.009
          ) +
          depth * 0.003 +
          warmth * 0.002
        ) *
          noiseMultiplier *
          (
            1 -
            endingFade * 0.5
          ),
        0,
        0.016
      );

    const targetVignetteOffset =
      clamp(
        (
          isMobile
            ? 0.22
            : 0.18
        ) -
          depth * 0.018 +
          endingFade * 0.015,
        0.13,
        0.25
      );

    const targetVignetteDarkness =
      clamp(
        (
          (
            isMobile
              ? 0.66
              : 0.74
          ) +
          depth * 0.1 -
          warmth * 0.035 -
          endingFade * 0.08
        ) *
          vignetteMultiplier,
        0.48,
        0.86
      );

    const targetChromaticOffsetX =
      clamp(
        (
          0.00012 +
          depth * 0.00005 +
          scrollEnergy *
            0.00018
        ) *
          chromaticMultiplier *
          (
            1 -
            endingFade * 0.6
          ),
        0,
        0.00032
      );

    const targetChromaticOffsetY =
      clamp(
        (
          0.00007 +
          depth * 0.00003 +
          scrollEnergy *
            0.0001
        ) *
          chromaticMultiplier *
          (
            1 -
            endingFade * 0.6
          ),
        0,
        0.0002
      );

    const targetChromaticModulation =
      clamp(
        0.68 +
          depth * 0.1 -
          calmness * 0.035,
        0.62,
        0.82
      );

    effects.bloomIntensity =
      THREE.MathUtils.lerp(
        effects.bloomIntensity,
        targetBloomIntensity,
        damping
      );

    effects.bloomThreshold =
      THREE.MathUtils.lerp(
        effects.bloomThreshold,
        targetBloomThreshold,
        damping
      );

    effects.bloomSmoothing =
      THREE.MathUtils.lerp(
        effects.bloomSmoothing,
        targetBloomSmoothing,
        damping
      );

    effects.exposure =
      THREE.MathUtils.lerp(
        effects.exposure,
        targetExposure,
        damping
      );

    effects.brightness =
      THREE.MathUtils.lerp(
        effects.brightness,
        targetBrightness,
        damping
      );

    effects.contrast =
      THREE.MathUtils.lerp(
        effects.contrast,
        targetContrast,
        damping
      );

    effects.hue =
      THREE.MathUtils.lerp(
        effects.hue,
        targetHue,
        damping
      );

    effects.saturation =
      THREE.MathUtils.lerp(
        effects.saturation,
        targetSaturation,
        damping
      );

    effects.noiseOpacity =
      THREE.MathUtils.lerp(
        effects.noiseOpacity,
        targetNoiseOpacity,
        damping
      );

    effects.vignetteOffset =
      THREE.MathUtils.lerp(
        effects.vignetteOffset,
        targetVignetteOffset,
        damping
      );

    effects.vignetteDarkness =
      THREE.MathUtils.lerp(
        effects.vignetteDarkness,
        targetVignetteDarkness,
        damping
      );

    effects.chromaticOffsetX =
      THREE.MathUtils.lerp(
        effects.chromaticOffsetX,
        targetChromaticOffsetX,
        damping
      );

    effects.chromaticOffsetY =
      THREE.MathUtils.lerp(
        effects.chromaticOffsetY,
        targetChromaticOffsetY,
        damping
      );

    effects.chromaticModulation =
      THREE.MathUtils.lerp(
        effects.chromaticModulation,
        targetChromaticModulation,
        damping
      );

    effects.warmth =
      warmth;

    effects.depth =
      depth;

    effects.calmness =
      calmness;

    effects.scrollEnergy =
      scrollEnergy;

    effects.endingFade =
      endingFade;

    effects.cinematicIntensity =
      cinematicIntensity;
  });

  const contextValue =
    useMemo(
      () => ({
        effectsStateRef,
      }),
      []
    );

  return (
    <EffectsContext.Provider
      value={contextValue}
    >
      {children}
    </EffectsContext.Provider>
  );
}

function useEffectsController() {
  const context =
    useContext(
      EffectsContext
    );

  if (!context) {
    throw new Error(
      "useEffectsController must be used inside EffectsController."
    );
  }

  return context;
}

export {
  EffectsController,
  useEffectsController,
};

export default EffectsController;
