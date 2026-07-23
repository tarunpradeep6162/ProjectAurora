import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import {
  useLightingController,
} from "./LightingController";

function getQualitySettings(
  qualityLevel,
  isMobile
) {
  if (qualityLevel === "low") {
    return {
      lightMultiplier: 0.62,
      movementMultiplier: 0.45,
      enableRimLight: false,
    };
  }

  if (qualityLevel === "medium") {
    return {
      lightMultiplier: 0.82,
      movementMultiplier: 0.72,
      enableRimLight: !isMobile,
    };
  }

  return {
    lightMultiplier:
      isMobile ? 0.88 : 1,
    movementMultiplier:
      isMobile ? 0.78 : 1,
    enableRimLight: true,
  };
}

function CinematicLightingRig({
  qualityLevel = "high",
  isMobile = false,
  motionEnabled = true,
}) {
  const moonLightRef =
    useRef(null);

  const romanticLightRef =
    useRef(null);

  const rimLightRef =
    useRef(null);

  const ambientLightRef =
    useRef(null);

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

  const temporaryMoonColor =
    useMemo(
      () =>
        new THREE.Color(
          "#8ea7ff"
        ),
      []
    );

  const temporaryRomanticColor =
    useMemo(
      () =>
        new THREE.Color(
          "#ff5b9a"
        ),
      []
    );

  const temporaryAmbientColor =
    useMemo(
      () =>
        new THREE.Color(
          "#281548"
        ),
      []
    );

  const temporaryRimColor =
    useMemo(
      () =>
        new THREE.Color(
          "#b89cff"
        ),
      []
    );

  useEffect(() => {
    return () => {
      temporaryMoonColor.set(
        "#000000"
      );

      temporaryRomanticColor.set(
        "#000000"
      );

      temporaryAmbientColor.set(
        "#000000"
      );

      temporaryRimColor.set(
        "#000000"
      );
    };
  }, [
    temporaryMoonColor,
    temporaryRomanticColor,
    temporaryAmbientColor,
    temporaryRimColor,
  ]);

  useFrame(
    (state, delta) => {
      const lighting =
        lightingStateRef.current;

      const safeDelta =
        Math.min(
          delta,
          0.05
        );

      const damping =
        1 -
        Math.exp(
          -safeDelta * 5.4
        );

      const lightMultiplier =
        qualitySettings
          .lightMultiplier;

      const movementMultiplier =
        qualitySettings
          .movementMultiplier;

      if (
        ambientLightRef.current
      ) {
        const targetAmbientIntensity =
          lighting.enabled
            ? lighting
                .ambientIntensity *
              lightMultiplier
            : 0;

        ambientLightRef.current
          .intensity =
          THREE.MathUtils.lerp(
            ambientLightRef.current
              .intensity,
            targetAmbientIntensity,
            damping
          );

        temporaryAmbientColor.copy(
          lighting.ambientColor
        );

        ambientLightRef.current
          .color.lerp(
            temporaryAmbientColor,
            damping
          );
      }

      if (
        moonLightRef.current
      ) {
        const targetMoonIntensity =
          lighting.enabled
            ? lighting
                .moonlightIntensity *
              lightMultiplier
            : 0;

        moonLightRef.current
          .intensity =
          THREE.MathUtils.lerp(
            moonLightRef.current
              .intensity,
            targetMoonIntensity,
            damping
          );

        temporaryMoonColor.copy(
          lighting.moonlightColor
        );

        moonLightRef.current
          .color.lerp(
            temporaryMoonColor,
            damping
          );

        if (motionEnabled) {
          const time =
            state.clock.elapsedTime;

          const targetX =
            4.8 +
            Math.sin(
              time * 0.08
            ) *
              0.45 *
              movementMultiplier;

          const targetY =
            5.5 +
            Math.cos(
              time * 0.065
            ) *
              0.35 *
              movementMultiplier;

          const targetZ =
            4.2 +
            lighting.depth *
              1.4;

          moonLightRef.current
            .position.x =
            THREE.MathUtils.lerp(
              moonLightRef.current
                .position.x,
              targetX,
              damping
            );

          moonLightRef.current
            .position.y =
            THREE.MathUtils.lerp(
              moonLightRef.current
                .position.y,
              targetY,
              damping
            );

          moonLightRef.current
            .position.z =
            THREE.MathUtils.lerp(
              moonLightRef.current
                .position.z,
              targetZ,
              damping
            );
        }
      }

      if (
        romanticLightRef.current
      ) {
        const targetRomanticIntensity =
          lighting.enabled
            ? lighting
                .romanticIntensity *
              1.15 *
              lightMultiplier
            : 0;

        romanticLightRef.current
          .intensity =
          THREE.MathUtils.lerp(
            romanticLightRef.current
              .intensity,
            targetRomanticIntensity,
            damping
          );

        temporaryRomanticColor.copy(
          lighting.romanticColor
        );

        romanticLightRef.current
          .color.lerp(
            temporaryRomanticColor,
            damping
          );

        if (motionEnabled) {
          const time =
            state.clock.elapsedTime;

          const targetX =
            -3.7 +
            Math.cos(
              time * 0.075
            ) *
              0.55 *
              movementMultiplier;

          const targetY =
            1.8 +
            Math.sin(
              time * 0.095
            ) *
              0.42 *
              movementMultiplier;

          const targetZ =
            3.2 +
            lighting.warmth *
              1.1;

          romanticLightRef.current
            .position.x =
            THREE.MathUtils.lerp(
              romanticLightRef.current
                .position.x,
              targetX,
              damping
            );

          romanticLightRef.current
            .position.y =
            THREE.MathUtils.lerp(
              romanticLightRef.current
                .position.y,
              targetY,
              damping
            );

          romanticLightRef.current
            .position.z =
            THREE.MathUtils.lerp(
              romanticLightRef.current
                .position.z,
              targetZ,
              damping
            );
        }
      }

      if (
        rimLightRef.current
      ) {
        const rimEnabled =
          lighting.enabled &&
          qualitySettings
            .enableRimLight;

        const targetRimIntensity =
          rimEnabled
            ? (
                0.22 +
                lighting.depth *
                  0.26 +
                lighting.scrollEnergy *
                  0.18
              ) *
              lightMultiplier *
              (
                1 -
                lighting.endingFade *
                  0.35
              )
            : 0;

        rimLightRef.current
          .intensity =
          THREE.MathUtils.lerp(
            rimLightRef.current
              .intensity,
            targetRimIntensity,
            damping
          );

        temporaryRimColor
          .set("#b89cff")
          .lerp(
            lighting.romanticColor,
            lighting.warmth *
              0.28
          );

        rimLightRef.current
          .color.lerp(
            temporaryRimColor,
            damping
          );

        if (motionEnabled) {
          const time =
            state.clock.elapsedTime;

          rimLightRef.current
            .position.x =
            -1.8 +
            Math.sin(
              time * 0.055
            ) *
              0.32 *
              movementMultiplier;

          rimLightRef.current
            .position.y =
            4.6 +
            Math.cos(
              time * 0.045
            ) *
              0.28 *
              movementMultiplier;
        }
      }
    }
  );

  return (
    <group>
      <ambientLight
        ref={ambientLightRef}
        color="#281548"
        intensity={0.24}
      />

      <directionalLight
        ref={moonLightRef}
        color="#8ea7ff"
        intensity={0.72}
        position={[
          4.8,
          5.5,
          4.2,
        ]}
        target-position={[
          0,
          0,
          -4,
        ]}
      />

      <pointLight
        ref={romanticLightRef}
        color="#ff5b9a"
        intensity={0}
        position={[
          -3.7,
          1.8,
          3.2,
        ]}
        distance={28}
        decay={2}
      />

      <pointLight
        ref={rimLightRef}
        color="#b89cff"
        intensity={0.24}
        position={[
          -1.8,
          4.6,
          -2.8,
        ]}
        distance={34}
        decay={2}
      />
    </group>
  );
}

export default CinematicLightingRig;
