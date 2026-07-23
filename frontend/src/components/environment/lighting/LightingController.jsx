import {
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  useEnvironmentController,
} from "../controllers/EnvironmentController";

const LightingContext =
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

function LightingController({
  children,
  enabled = true,
  qualityLevel = "high",
  isMobile = false,
}) {
  const {
    stateRef:
      environmentStateRef,
  } =
    useEnvironmentController();

  const lightingStateRef =
    useRef({
      enabled,

      moonlightIntensity:
        0.72,

      ambientIntensity:
        0.24,

      romanticIntensity:
        0,

      nebulaIllumination:
        0.38,

      hazeIntensity:
        0.18,

      bloomIntensity:
        0.72,

      exposure:
        1,

      contrast:
        1,

      saturation:
        1,

      warmth:
        0,

      depth:
        0.18,

      calmness:
        1,

      scrollEnergy:
        0,

      endingFade:
        0,

      colorTemperature:
        0,

      moonlightColor:
        new THREE.Color(
          "#8ea7ff"
        ),

      ambientColor:
        new THREE.Color(
          "#281548"
        ),

      romanticColor:
        new THREE.Color(
          "#ff4f91"
        ),

      hazeColor:
        new THREE.Color(
          "#4b2978"
        ),
    });

  const targetColors =
    useMemo(
      () => ({
        moonCool:
          new THREE.Color(
            "#7897ff"
          ),

        moonNeutral:
          new THREE.Color(
            "#a9baff"
          ),

        ambientDark:
          new THREE.Color(
            "#160b2d"
          ),

        ambientRich:
          new THREE.Color(
            "#3f1858"
          ),

        romanticSoft:
          new THREE.Color(
            "#ff6ba5"
          ),

        romanticDeep:
          new THREE.Color(
            "#d92d78"
          ),

        hazeViolet:
          new THREE.Color(
            "#3d2268"
          ),

        hazeRose:
          new THREE.Color(
            "#7c285c"
          ),
      }),
      []
    );

  useFrame((_, delta) => {
    const safeDelta =
      Math.min(
        delta,
        0.05
      );

    const environment =
      environmentStateRef.current;

    const lighting =
      lightingStateRef.current;

    lighting.enabled =
      enabled;

    if (!enabled) {
      lighting.moonlightIntensity =
        0;

      lighting.ambientIntensity =
        0;

      lighting.romanticIntensity =
        0;

      lighting.nebulaIllumination =
        0;

      lighting.hazeIntensity =
        0;

      lighting.bloomIntensity =
        0;

      return;
    }

    const damping =
      1 -
      Math.exp(
        -safeDelta * 4.8
      );

    const scrollEnergy =
      Math.min(
        Math.abs(
          environment.velocity
        ) * 0.08,
        0.2
      );

    const progress =
      environment.progress;

    const endingFade =
      THREE.MathUtils.smoothstep(
        progress,
        0.88,
        1
      );

    const qualityMultiplier =
      qualityLevel === "low"
        ? 0.72
        : qualityLevel ===
            "medium"
          ? 0.86
          : 1;

    const mobileMultiplier =
      isMobile
        ? 0.88
        : 1;

    const targetMoonlight =
      clamp(
        0.68 +
          environment.depth *
            0.18 -
          environment.warmth *
            0.08 -
          endingFade *
            0.16,
        0.42,
        0.96
      );

    const targetAmbient =
      clamp(
        0.2 +
          environment.depth *
            0.16 +
          environment.warmth *
            0.08,
        0.16,
        0.46
      );

    const targetRomantic =
      clamp(
        environment.warmth *
          0.86 +
          scrollEnergy *
            0.12,
        0,
        0.92
      );

    const targetNebulaLight =
      clamp(
        0.32 +
          environment
            .cinematicIntensity *
            0.22 +
          environment.depth *
            0.18 -
          endingFade *
            0.12,
        0.24,
        0.82
      );

    const targetHaze =
      clamp(
        0.12 +
          environment.depth *
            0.28 +
          environment.warmth *
            0.08 -
          endingFade *
            0.08,
        0.08,
        0.46
      );

    const targetBloom =
      clamp(
        0.58 +
          environment
            .cinematicIntensity *
            0.24 +
          environment.warmth *
            0.1 +
          scrollEnergy *
            0.08 -
          endingFade *
            0.14,
        0.48,
        1.08
      );

    const targetExposure =
      clamp(
        0.92 +
          environment
            .cinematicIntensity *
            0.1 +
          environment.warmth *
            0.04 -
          endingFade *
            0.08,
        0.84,
        1.08
      );

    const targetContrast =
      clamp(
        1.02 +
          environment.depth *
            0.08 -
          endingFade *
            0.03,
        1,
        1.12
      );

    const targetSaturation =
      clamp(
        0.96 +
          environment.warmth *
            0.12 +
          environment.depth *
            0.04,
        0.94,
        1.12
      );

    lighting.moonlightIntensity =
      THREE.MathUtils.lerp(
        lighting
          .moonlightIntensity,
        targetMoonlight *
          qualityMultiplier,
        damping
      );

    lighting.ambientIntensity =
      THREE.MathUtils.lerp(
        lighting
          .ambientIntensity,
        targetAmbient,
        damping
      );

    lighting.romanticIntensity =
      THREE.MathUtils.lerp(
        lighting
          .romanticIntensity,
        targetRomantic,
        damping
      );

    lighting.nebulaIllumination =
      THREE.MathUtils.lerp(
        lighting
          .nebulaIllumination,
        targetNebulaLight *
          qualityMultiplier,
        damping
      );

    lighting.hazeIntensity =
      THREE.MathUtils.lerp(
        lighting
          .hazeIntensity,
        targetHaze *
          qualityMultiplier *
          mobileMultiplier,
        damping
      );

    lighting.bloomIntensity =
      THREE.MathUtils.lerp(
        lighting
          .bloomIntensity,
        targetBloom *
          qualityMultiplier,
        damping
      );

    lighting.exposure =
      THREE.MathUtils.lerp(
        lighting.exposure,
        targetExposure,
        damping
      );

    lighting.contrast =
      THREE.MathUtils.lerp(
        lighting.contrast,
        targetContrast,
        damping
      );

    lighting.saturation =
      THREE.MathUtils.lerp(
        lighting.saturation,
        targetSaturation,
        damping
      );

    lighting.warmth =
      environment.warmth;

    lighting.depth =
      environment.depth;

    lighting.calmness =
      environment.calmness;

    lighting.scrollEnergy =
      scrollEnergy;

    lighting.endingFade =
      endingFade;

    lighting.colorTemperature =
      THREE.MathUtils.lerp(
        lighting
          .colorTemperature,
        environment.warmth,
        damping
      );

    lighting.moonlightColor
      .copy(
        targetColors.moonCool
      )
      .lerp(
        targetColors
          .moonNeutral,
        environment.warmth *
          0.32
      );

    lighting.ambientColor
      .copy(
        targetColors
          .ambientDark
      )
      .lerp(
        targetColors
          .ambientRich,
        environment.depth *
          0.72
      );

    lighting.romanticColor
      .copy(
        targetColors
          .romanticSoft
      )
      .lerp(
        targetColors
          .romanticDeep,
        environment.warmth *
          0.46
      );

    lighting.hazeColor
      .copy(
        targetColors
          .hazeViolet
      )
      .lerp(
        targetColors
          .hazeRose,
        environment.warmth *
          0.62
      );
  });

  const contextValue =
    useMemo(
      () => ({
        lightingStateRef,
      }),
      []
    );

  return (
    <LightingContext.Provider
      value={contextValue}
    >
      {children}
    </LightingContext.Provider>
  );
}

function useLightingController() {
  const context =
    useContext(
      LightingContext
    );

  if (!context) {
    throw new Error(
      "useLightingController must be used inside LightingController."
    );
  }

  return context;
}

export {
  LightingController,
  useLightingController,
};

export default LightingController;
