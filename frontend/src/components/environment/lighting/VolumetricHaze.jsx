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

function getQualityConfiguration(
  qualityLevel,
  isMobile
) {
  if (qualityLevel === "low") {
    return {
      layerCount: 1,
      opacityMultiplier: 0.52,
      motionMultiplier: 0.42,
      detailMultiplier: 0.7,
    };
  }

  if (qualityLevel === "medium") {
    return {
      layerCount: isMobile ? 1 : 2,
      opacityMultiplier: 0.76,
      motionMultiplier: 0.68,
      detailMultiplier: 0.84,
    };
  }

  return {
    layerCount: isMobile ? 2 : 3,
    opacityMultiplier: isMobile ? 0.82 : 1,
    motionMultiplier: isMobile ? 0.72 : 1,
    detailMultiplier: isMobile ? 0.88 : 1,
  };
}

function createHazeMaterial({
  seed,
  baseOpacity,
  motionEnabled,
}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,

    uniforms: {
      uTime: {
        value: 0,
      },

      uSeed: {
        value: seed,
      },

      uOpacity: {
        value: baseOpacity,
      },

      uHazeIntensity: {
        value: 0.18,
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

      uScrollEnergy: {
        value: 0,
      },

      uEndingFade: {
        value: 0,
      },

      uMotionStrength: {
        value: motionEnabled ? 1 : 0,
      },

      uDetailMultiplier: {
        value: 1,
      },

      uVioletColor: {
        value: new THREE.Color("#43256f"),
      },

      uRoseColor: {
        value: new THREE.Color("#8f315f"),
      },

      uCoolColor: {
        value: new THREE.Color("#263767"),
      },
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;

        vec4 worldPosition =
          modelMatrix *
          vec4(position, 1.0);

        vWorldPosition =
          worldPosition.xyz;

        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uSeed;
      uniform float uOpacity;
      uniform float uHazeIntensity;
      uniform float uWarmth;
      uniform float uDepth;
      uniform float uCalmness;
      uniform float uScrollEnergy;
      uniform float uEndingFade;
      uniform float uMotionStrength;
      uniform float uDetailMultiplier;

      uniform vec3 uVioletColor;
      uniform vec3 uRoseColor;
      uniform vec3 uCoolColor;

      varying vec2 vUv;
      varying vec3 vWorldPosition;

      float hash21(vec2 point) {
        point = fract(
          point *
          vec2(
            123.34,
            456.21
          )
        );

        point += dot(
          point,
          point + 45.32
        );

        return fract(
          point.x *
          point.y
        );
      }

      float valueNoise(
        vec2 point
      ) {
        vec2 integerPart =
          floor(point);

        vec2 fractionalPart =
          fract(point);

        fractionalPart =
          fractionalPart *
          fractionalPart *
          (
            3.0 -
            2.0 *
            fractionalPart
          );

        float a =
          hash21(
            integerPart
          );

        float b =
          hash21(
            integerPart +
            vec2(1.0, 0.0)
          );

        float c =
          hash21(
            integerPart +
            vec2(0.0, 1.0)
          );

        float d =
          hash21(
            integerPart +
            vec2(1.0, 1.0)
          );

        return mix(
          mix(
            a,
            b,
            fractionalPart.x
          ),
          mix(
            c,
            d,
            fractionalPart.x
          ),
          fractionalPart.y
        );
      }

      float fractalNoise(
        vec2 point
      ) {
        float value = 0.0;
        float amplitude = 0.52;

        mat2 rotation =
          mat2(
            0.82,
            -0.57,
            0.57,
            0.82
          );

        for (
          int octave = 0;
          octave < 4;
          octave++
        ) {
          value +=
            valueNoise(point) *
            amplitude;

          point =
            rotation *
            point *
            2.03 +
            17.7;

          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 centeredUv =
          vUv -
          vec2(0.5);

        float aspectStretch =
          mix(
            1.18,
            1.46,
            uDepth
          );

        centeredUv.x *=
          aspectStretch;

        float calmSpeed =
          mix(
            1.15,
            0.72,
            uCalmness
          );

        float time =
          uTime *
          0.018 *
          calmSpeed *
          uMotionStrength;

        float velocityMotion =
          min(
            uScrollEnergy *
            0.18,
            0.08
          );

        vec2 firstFlow =
          vec2(
            time +
              uSeed *
              2.4,
            -time * 0.72 +
              uSeed
          );

        vec2 secondFlow =
          vec2(
            -time * 0.54,
            time * 0.46
          );

        vec2 firstSamplePosition =
          centeredUv *
          mix(
            2.2,
            3.15,
            uDetailMultiplier
          ) +
          firstFlow;

        vec2 secondSamplePosition =
          centeredUv *
          mix(
            4.0,
            5.4,
            uDetailMultiplier
          ) +
          secondFlow +
          vec2(
            uSeed * 3.7
          );

        firstSamplePosition.y +=
          velocityMotion;

        secondSamplePosition.x -=
          velocityMotion * 0.6;

        float broadNoise =
          fractalNoise(
            firstSamplePosition
          );

        float detailNoise =
          fractalNoise(
            secondSamplePosition
          );

        float combinedNoise =
          broadNoise * 0.72 +
          detailNoise * 0.28;

        float radialDistance =
          length(
            centeredUv *
            vec2(0.84, 1.18)
          );

        float radialMask =
          1.0 -
          smoothstep(
            0.15,
            0.78,
            radialDistance
          );

        float verticalMask =
          smoothstep(
            -0.5,
            0.15,
            centeredUv.y +
            combinedNoise * 0.2
          );

        verticalMask *=
          1.0 -
          smoothstep(
            0.12,
            0.58,
            centeredUv.y
          );

        float cloudShape =
          smoothstep(
            0.34,
            0.82,
            combinedNoise +
            radialMask * 0.26
          );

        float hazeShape =
          cloudShape *
          radialMask *
          mix(
            0.7,
            1.0,
            verticalMask
          );

        float depthBoost =
          mix(
            0.74,
            1.22,
            uDepth
          );

        float endingReduction =
          mix(
            1.0,
            0.58,
            uEndingFade
          );

        float finalAlpha =
          hazeShape *
          uOpacity *
          uHazeIntensity *
          depthBoost *
          endingReduction;

        finalAlpha *=
          mix(
            0.84,
            1.08,
            uCalmness
          );

        vec3 coolViolet =
          mix(
            uCoolColor,
            uVioletColor,
            0.72 +
            uDepth * 0.18
          );

        vec3 romanticColor =
          mix(
            coolViolet,
            uRoseColor,
            uWarmth * 0.68
          );

        float colorVariation =
          smoothstep(
            0.28,
            0.78,
            detailNoise
          );

        vec3 finalColor =
          mix(
            coolViolet,
            romanticColor,
            colorVariation *
            (
              0.46 +
              uWarmth * 0.42
            )
          );

        finalColor *=
          0.72 +
          cloudShape * 0.42;

        gl_FragColor =
          vec4(
            finalColor,
            clamp(
              finalAlpha,
              0.0,
              0.34
            )
          );
      }
    `,
  });
}

function VolumetricHaze({
  qualityLevel = "high",
  isMobile = false,
  motionEnabled = true,
}) {
  const groupRef =
    useRef(null);

  const layerRefs =
    useRef([]);

  const {
    lightingStateRef,
  } =
    useLightingController();

  const qualityConfiguration =
    useMemo(
      () =>
        getQualityConfiguration(
          qualityLevel,
          isMobile
        ),
      [
        qualityLevel,
        isMobile,
      ]
    );

  const layers =
    useMemo(() => {
      const layerDefinitions = [
        {
          seed: 0.17,
          position: [
            -2.5,
            0.4,
            -20,
          ],
          scale: [
            34,
            18,
            1,
          ],
          rotation: 0.04,
          opacity: 0.34,
          renderOrder: -8,
        },

        {
          seed: 0.53,
          position: [
            4.2,
            -1.6,
            -25,
          ],
          scale: [
            42,
            21,
            1,
          ],
          rotation: -0.07,
          opacity: 0.25,
          renderOrder: -9,
        },

        {
          seed: 0.81,
          position: [
            0,
            3,
            -31,
          ],
          scale: [
            50,
            25,
            1,
          ],
          rotation: 0.1,
          opacity: 0.18,
          renderOrder: -10,
        },
      ];

      return layerDefinitions
        .slice(
          0,
          qualityConfiguration.layerCount
        )
        .map(
          (
            definition,
            index
          ) => {
            const material =
              createHazeMaterial({
                seed:
                  definition.seed,
                baseOpacity:
                  definition.opacity *
                  qualityConfiguration
                    .opacityMultiplier,
                motionEnabled,
              });

            material.uniforms
              .uDetailMultiplier
              .value =
              qualityConfiguration
                .detailMultiplier;

            return {
              ...definition,
              index,
              material,
            };
          }
        );
    }, [
      motionEnabled,
      qualityConfiguration,
    ]);

  useFrame(
    (state, delta) => {
      const lighting =
        lightingStateRef.current;

      const elapsedTime =
        state.clock.elapsedTime;

      layers.forEach(
        (
          layer,
          index
        ) => {
          const material =
            layer.material;

          material.uniforms
            .uTime
            .value =
            elapsedTime;

          material.uniforms
            .uHazeIntensity
            .value =
            lighting.hazeIntensity;

          material.uniforms
            .uWarmth
            .value =
            lighting.warmth;

          material.uniforms
            .uDepth
            .value =
            lighting.depth;

          material.uniforms
            .uCalmness
            .value =
            lighting.calmness;

          material.uniforms
            .uScrollEnergy
            .value =
            lighting.scrollEnergy;

          material.uniforms
            .uEndingFade
            .value =
            lighting.endingFade;

          material.uniforms
            .uMotionStrength
            .value =
            motionEnabled
              ? 1
              : 0;

          material.uniforms
            .uVioletColor
            .value.copy(
              lighting.hazeColor
            );

          const layerMesh =
            layerRefs.current[
              index
            ];

          if (
            !layerMesh ||
            !motionEnabled
          ) {
            return;
          }

          const layerSpeed =
            (
              0.004 +
              index * 0.0015
            ) *
            qualityConfiguration
              .motionMultiplier;

          const direction =
            index % 2 === 0
              ? 1
              : -1;

          layerMesh.rotation.z =
            layer.rotation +
            Math.sin(
              elapsedTime *
              layerSpeed *
              2.4 +
              layer.seed
            ) *
              0.018 *
              direction;

          layerMesh.position.x =
            layer.position[0] +
            Math.sin(
              elapsedTime *
              layerSpeed +
              layer.seed * 4
            ) *
              (
                0.34 +
                lighting.depth *
                  0.26
              );

          layerMesh.position.y =
            layer.position[1] +
            Math.cos(
              elapsedTime *
              layerSpeed *
              0.78 +
              layer.seed * 3
            ) *
              (
                0.18 +
                lighting.warmth *
                  0.16
              );
        }
      );

      if (
        groupRef.current &&
        motionEnabled
      ) {
        const targetScale =
          1 +
          lighting.depth *
            0.018 +
          Math.sin(
            elapsedTime *
            0.045
          ) *
            0.005 *
            lighting.calmness;

        const damping =
          1 -
          Math.exp(
            -Math.min(
              delta,
              0.05
            ) *
              2.8
          );

        const currentScale =
          groupRef.current
            .scale.x;

        const nextScale =
          THREE.MathUtils.lerp(
            currentScale,
            targetScale,
            damping
          );

        groupRef.current
          .scale
          .setScalar(
            nextScale
          );
      }
    }
  );

  useEffect(() => {
    return () => {
      layers.forEach(
        (layer) => {
          layer.material.dispose();
        }
      );
    };
  }, [layers]);

  return (
    <group ref={groupRef}>
      {layers.map(
        (layer, index) => (
          <mesh
            key={layer.seed}
            ref={(mesh) => {
              layerRefs.current[
                index
              ] = mesh;
            }}
            position={
              layer.position
            }
            rotation={[
              0,
              0,
              layer.rotation,
            ]}
            scale={
              layer.scale
            }
            material={
              layer.material
            }
            renderOrder={
              layer.renderOrder
            }
            frustumCulled={false}
          >
            <planeGeometry
              args={[1, 1, 1, 1]}
            />
          </mesh>
        )
      )}
    </group>
  );
}

export default VolumetricHaze;
