import {
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import {
  useEnvironmentController,
} from "../environment/controllers/EnvironmentController";

function createSeededRandom(
  seed = 48391
) {
  let value =
    seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value =
      (value * 16807) %
      2147483647;

    return (
      (value - 1) /
      2147483646
    );
  };
}

function getAdaptiveCount(
  requestedCount,
  qualityLevel,
  isMobile
) {
  if (qualityLevel === "low") {
    return Math.min(
      requestedCount,
      700
    );
  }

  if (
    qualityLevel === "medium"
  ) {
    return Math.min(
      requestedCount,
      1200
    );
  }

  if (isMobile) {
    return Math.min(
      requestedCount,
      1600
    );
  }

  return requestedCount;
}

function getBaseOpacity(
  qualityLevel
) {
  if (qualityLevel === "low") {
    return 0.62;
  }

  if (
    qualityLevel === "medium"
  ) {
    return 0.76;
  }

  return 0.88;
}

function FloatingParticles({
  count = 2500,
  qualityLevel = "high",
  motionEnabled = true,
}) {
  const pointsRef =
    useRef(null);

  const {
    stateRef,
  } =
    useEnvironmentController();

  const gl =
    useThree(
      (state) => state.gl
    );

  const isMobile =
    useMemo(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return false;
      }

      return window.matchMedia(
        "(max-width: 768px), (pointer: coarse)"
      ).matches;
    }, []);

  const effectiveCount =
    useMemo(
      () =>
        getAdaptiveCount(
          count,
          qualityLevel,
          isMobile
        ),
      [
        count,
        qualityLevel,
        isMobile,
      ]
    );

  const baseOpacity =
    useMemo(
      () =>
        getBaseOpacity(
          qualityLevel
        ),
      [qualityLevel]
    );

  const geometry =
    useMemo(() => {
      const random =
        createSeededRandom(
          48391
        );

      const positions =
        new Float32Array(
          effectiveCount * 3
        );

      const colors =
        new Float32Array(
          effectiveCount * 3
        );

      const sizes =
        new Float32Array(
          effectiveCount
        );

      const brightness =
        new Float32Array(
          effectiveCount
        );

      const phases =
        new Float32Array(
          effectiveCount
        );

      const speeds =
        new Float32Array(
          effectiveCount
        );

      const driftStrengths =
        new Float32Array(
          effectiveCount
        );

      const depthFactors =
        new Float32Array(
          effectiveCount
        );

      const colorPalette = [
        new THREE.Color(
          "#ffffff"
        ),
        new THREE.Color(
          "#e6ecff"
        ),
        new THREE.Color(
          "#ffd5e5"
        ),
        new THREE.Color(
          "#ff9ac6"
        ),
        new THREE.Color(
          "#d8b8ff"
        ),
      ];

      for (
        let index = 0;
        index <
        effectiveCount;
        index += 1
      ) {
        const positionIndex =
          index * 3;

        const theta =
          random() *
          Math.PI *
          2;

        const phi =
          Math.acos(
            2 * random() - 1
          );

        const radius =
          12 +
          Math.cbrt(
            random()
          ) *
            55;

        const horizontalStretch =
          1.1 +
          random() * 0.35;

        const verticalCompression =
          0.72 +
          random() * 0.2;

        const x =
          radius *
          Math.sin(phi) *
          Math.cos(theta) *
          horizontalStretch;

        const y =
          radius *
          Math.sin(phi) *
          Math.sin(theta) *
          verticalCompression;

        const z =
          radius *
          Math.cos(phi);

        positions[
          positionIndex
        ] = x;

        positions[
          positionIndex + 1
        ] = y;

        positions[
          positionIndex + 2
        ] = z;

        const paletteIndex =
          Math.floor(
            random() *
              colorPalette.length
          );

        const selectedColor =
          colorPalette[
            paletteIndex
          ].clone();

        const colorVariation =
          0.88 +
          random() * 0.18;

        selectedColor.multiplyScalar(
          colorVariation
        );

        colors[
          positionIndex
        ] = selectedColor.r;

        colors[
          positionIndex + 1
        ] = selectedColor.g;

        colors[
          positionIndex + 2
        ] = selectedColor.b;

        const sizeRoll =
          random();

        sizes[index] =
          sizeRoll > 0.965
            ? 3.2 +
              random() * 2.8
            : sizeRoll > 0.82
              ? 1.8 +
                random() * 1.8
              : 0.75 +
                random() * 1.35;

        brightness[index] =
          0.56 +
          random() * 0.5;

        phases[index] =
          random() *
          Math.PI *
          2;

        speeds[index] =
          0.035 +
          random() * 0.085;

        driftStrengths[index] =
          0.6 +
          random() * 0.8;

        depthFactors[index] =
          THREE.MathUtils.clamp(
            (
              z + 55
            ) / 110,
            0,
            1
          );
      }

      const nextGeometry =
        new THREE.BufferGeometry();

      nextGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          positions,
          3
        )
      );

      nextGeometry.setAttribute(
        "aColor",
        new THREE.BufferAttribute(
          colors,
          3
        )
      );

      nextGeometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(
          sizes,
          1
        )
      );

      nextGeometry.setAttribute(
        "aBrightness",
        new THREE.BufferAttribute(
          brightness,
          1
        )
      );

      nextGeometry.setAttribute(
        "aPhase",
        new THREE.BufferAttribute(
          phases,
          1
        )
      );

      nextGeometry.setAttribute(
        "aSpeed",
        new THREE.BufferAttribute(
          speeds,
          1
        )
      );

      nextGeometry.setAttribute(
        "aDriftStrength",
        new THREE.BufferAttribute(
          driftStrengths,
          1
        )
      );

      nextGeometry.setAttribute(
        "aDepthFactor",
        new THREE.BufferAttribute(
          depthFactors,
          1
        )
      );

      nextGeometry.computeBoundingSphere();

      return nextGeometry;
    }, [effectiveCount]);

  const material =
    useMemo(() => {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending:
          THREE.AdditiveBlending,
        toneMapped: false,

        uniforms: {
          uTime: {
            value: 0,
          },

          uPixelRatio: {
            value: 1,
          },

          uMotionStrength: {
            value:
              motionEnabled
                ? 1
                : 0,
          },

          uBaseOpacity: {
            value:
              baseOpacity,
          },

          uCinematicIntensity: {
            value: 0.72,
          },

          uWarmth: {
            value: 0,
          },

          uDepth: {
            value: 0.18,
          },

          uCalmness: {
            value: 1,
          },

          uScrollVelocity: {
            value: 0,
          },
        },

        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
          uniform float uMotionStrength;
          uniform float uCinematicIntensity;
          uniform float uWarmth;
          uniform float uDepth;
          uniform float uCalmness;
          uniform float uScrollVelocity;

          attribute vec3 aColor;
          attribute float aSize;
          attribute float aBrightness;
          attribute float aPhase;
          attribute float aSpeed;
          attribute float aDriftStrength;
          attribute float aDepthFactor;

          varying vec3 vColor;
          varying float vBrightness;
          varying float vDepthFade;
          varying float vWarmth;
          varying float vGlowEnergy;

          void main() {
            vec3 animatedPosition =
              position;

            float velocityEnergy =
              min(
                abs(
                  uScrollVelocity
                ) * 0.06,
                0.18
              );

            float depthEnergy =
              mix(
                0.72,
                1.28,
                uDepth
              );

            float calmMotion =
              mix(
                0.72,
                1.0,
                uCalmness
              );

            float motionEnergy =
              depthEnergy *
              calmMotion +
              velocityEnergy;

            float primaryTime =
              uTime *
              aSpeed *
              mix(
                0.84,
                1.18,
                uDepth
              );

            float floatingMotion =
              sin(
                primaryTime +
                aPhase
              ) *
              0.16 *
              aDriftStrength *
              motionEnergy;

            float secondaryMotion =
              cos(
                primaryTime *
                0.57 +
                aPhase * 1.7
              ) *
              0.09 *
              aDriftStrength *
              motionEnergy;

            float depthMotion =
              sin(
                primaryTime *
                0.42 +
                aPhase * 2.3
              ) *
              0.075 *
              mix(
                0.4,
                1.0,
                uDepth
              ) *
              aDriftStrength;

            animatedPosition.y +=
              floatingMotion *
              uMotionStrength;

            animatedPosition.x +=
              secondaryMotion *
              uMotionStrength;

            animatedPosition.z +=
              depthMotion *
              uMotionStrength;

            float scrollLift =
              clamp(
                uScrollVelocity *
                0.022,
                -0.09,
                0.09
              );

            animatedPosition.y +=
              scrollLift *
              mix(
                0.35,
                1.0,
                aDepthFactor
              ) *
              uMotionStrength;

            vec4 modelPosition =
              modelMatrix *
              vec4(
                animatedPosition,
                1.0
              );

            vec4 viewPosition =
              viewMatrix *
              modelPosition;

            gl_Position =
              projectionMatrix *
              viewPosition;

            float distanceFromCamera =
              length(
                viewPosition.xyz
              );

            float perspectiveSize =
              44.0 /
              max(
                4.0,
                -viewPosition.z
              );

            float pulse =
              0.82 +
              sin(
                uTime *
                aSpeed *
                mix(
                  1.1,
                  1.65,
                  uDepth
                ) +
                aPhase
              ) *
              mix(
                0.12,
                0.22,
                uCinematicIntensity
              );

            float reactiveSize =
              mix(
                0.9,
                1.12,
                uDepth
              );

            reactiveSize *=
              mix(
                1.0,
                1.06,
                uWarmth
              );

            reactiveSize +=
              velocityEnergy *
              0.16;

            gl_PointSize =
              clamp(
                aSize *
                pulse *
                reactiveSize *
                uPixelRatio *
                perspectiveSize,
                1.0,
                16.5
              );

            float brightnessEnergy =
              mix(
                0.84,
                1.18,
                uCinematicIntensity
              );

            brightnessEnergy *=
              mix(
                0.94,
                1.07,
                uDepth
              );

            brightnessEnergy *=
              mix(
                0.94,
                1.04,
                uWarmth
              );

            vColor =
              aColor;

            vBrightness =
              aBrightness *
              pulse *
              brightnessEnergy;

            vDepthFade =
              1.0 -
              smoothstep(
                30.0,
                72.0,
                distanceFromCamera
              );

            vWarmth =
              uWarmth;

            vGlowEnergy =
              clamp(
                uCinematicIntensity *
                0.72 +
                uDepth * 0.24 +
                velocityEnergy,
                0.55,
                1.35
              );
          }
        `,

        fragmentShader: `
          uniform float uBaseOpacity;
          uniform float uCinematicIntensity;
          uniform float uWarmth;
          uniform float uDepth;
          uniform float uCalmness;

          varying vec3 vColor;
          varying float vBrightness;
          varying float vDepthFade;
          varying float vWarmth;
          varying float vGlowEnergy;

          void main() {
            vec2 centered =
              gl_PointCoord -
              vec2(0.5);

            float radialDistance =
              length(centered);

            if (
              radialDistance >
              0.5
            ) {
              discard;
            }

            float core =
              1.0 -
              smoothstep(
                0.0,
                0.115,
                radialDistance
              );

            float innerGlow =
              1.0 -
              smoothstep(
                0.04,
                0.29,
                radialDistance
              );

            float outerGlow =
              1.0 -
              smoothstep(
                0.18,
                0.5,
                radialDistance
              );

            float edgeSoftness =
              1.0 -
              smoothstep(
                0.38,
                0.5,
                radialDistance
              );

            float reactiveOpacity =
              uBaseOpacity *
              mix(
                0.82,
                1.12,
                uCinematicIntensity
              );

            reactiveOpacity *=
              mix(
                0.94,
                1.06,
                uDepth
              );

            reactiveOpacity *=
              mix(
                0.9,
                1.0,
                uCalmness
              );

            float alpha =
              (
                core * 0.84 +
                innerGlow * 0.4 +
                outerGlow * 0.17
              ) *
              vBrightness *
              vDepthFade *
              reactiveOpacity *
              edgeSoftness;

            vec3 romanticTint =
              vec3(
                1.0,
                0.72,
                0.87
              );

            vec3 violetTint =
              vec3(
                0.83,
                0.72,
                1.0
              );

            vec3 reactiveColor =
              mix(
                vColor,
                vColor *
                romanticTint,
                vWarmth * 0.24
              );

            reactiveColor =
              mix(
                reactiveColor,
                reactiveColor *
                violetTint,
                uDepth * 0.09
              );

            vec3 finalColor =
              reactiveColor *
              (
                0.78 +
                core * 0.72 +
                innerGlow * 0.16
              ) *
              vGlowEnergy;

            gl_FragColor =
              vec4(
                finalColor,
                clamp(
                  alpha,
                  0.0,
                  1.0
                )
              );
          }
        `,
      });
    }, []);

  useEffect(() => {
    material.uniforms
      .uMotionStrength
      .value =
        motionEnabled
          ? 1
          : 0;
  }, [
    material,
    motionEnabled,
  ]);

  useEffect(() => {
    material.uniforms
      .uBaseOpacity
      .value =
        baseOpacity;
  }, [
    material,
    baseOpacity,
  ]);

  useFrame(
    (state, delta) => {
      const environment =
        stateRef.current;

      material.uniforms
        .uTime
        .value =
          state.clock
            .elapsedTime;

      material.uniforms
        .uPixelRatio
        .value =
          Math.min(
            gl.getPixelRatio(),
            isMobile
              ? 1.5
              : 2
          );

      material.uniforms
        .uCinematicIntensity
        .value =
          environment
            .cinematicIntensity;

      material.uniforms
        .uWarmth
        .value =
          environment.warmth;

      material.uniforms
        .uDepth
        .value =
          environment.depth;

      material.uniforms
        .uCalmness
        .value =
          environment.calmness;

      material.uniforms
        .uScrollVelocity
        .value =
          environment.velocity;

      if (
        !pointsRef.current ||
        !motionEnabled
      ) {
        return;
      }

      const velocityEnergy =
        Math.min(
          Math.abs(
            environment.velocity
          ) * 0.0012,
          0.0024
        );

      const baseRotationSpeed =
        isMobile
          ? 0.0032
          : 0.0048;

      const depthRotation =
        environment.depth *
        (
          isMobile
            ? 0.001
            : 0.0016
        );

      const calmRotation =
        THREE.MathUtils.lerp(
          0.72,
          1,
          environment.calmness
        );

      const rotationSpeed =
        (
          baseRotationSpeed +
          depthRotation +
          velocityEnergy
        ) *
        calmRotation;

      pointsRef.current
        .rotation.y +=
          delta *
          rotationSpeed;

      const rotationAmplitude =
        THREE.MathUtils.lerp(
          0.72,
          1.12,
          environment.depth
        ) *
        THREE.MathUtils.lerp(
          0.82,
          1,
          environment.calmness
        );

      pointsRef.current
        .rotation.x =
          Math.sin(
            state.clock
              .elapsedTime *
              0.024
          ) *
          0.012 *
          rotationAmplitude;

      pointsRef.current
        .rotation.z =
          Math.cos(
            state.clock
              .elapsedTime *
              0.019
          ) *
          0.007 *
          rotationAmplitude;

      const breathingScale =
        1 +
        Math.sin(
          state.clock
            .elapsedTime *
            0.085
        ) *
        0.004 *
        environment.depth *
        environment.calmness;

      pointsRef.current
        .scale
        .setScalar(
          breathingScale
        );
    }
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [
    geometry,
    material,
  ]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}

export default FloatingParticles;
