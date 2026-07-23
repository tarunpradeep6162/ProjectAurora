import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function getQualitySettings(qualityLevel) {
  switch (qualityLevel) {
    case "low":
      return {
        detail: 0.55,
        brightness: 0.82,
        motionSpeed: 0.72,
      };

    case "medium":
      return {
        detail: 0.78,
        brightness: 0.92,
        motionSpeed: 0.86,
      };

    case "high":
    default:
      return {
        detail: 1,
        brightness: 1,
        motionSpeed: 1,
      };
  }
}

function Nebula({
  motionEnabled = true,
  qualityLevel = "high",
}) {
  const meshRef = useRef(null);

  const settings = useMemo(
    () => getQualitySettings(qualityLevel),
    [qualityLevel]
  );

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(2, 2),
    []
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      toneMapped: false,

      uniforms: {
        uTime: {
          value: 0,
        },

        uResolution: {
          value: new THREE.Vector2(
            window.innerWidth,
            window.innerHeight
          ),
        },

        uDetail: {
          value: settings.detail,
        },

        uBrightness: {
          value: settings.brightness,
        },

        uMotionStrength: {
          value: motionEnabled ? 1 : 0,
        },

        uMotionSpeed: {
          value: settings.motionSpeed,
        },
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uDetail;
        uniform float uBrightness;
        uniform float uMotionStrength;
        uniform float uMotionSpeed;

        varying vec2 vUv;

        float hash21(vec2 point) {
          point = fract(
            point *
            vec2(123.34, 456.21)
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

        float valueNoise(vec2 point) {
          vec2 cell = floor(point);
          vec2 local = fract(point);

          local =
            local *
            local *
            (
              3.0 -
              2.0 *
              local
            );

          float bottomLeft =
            hash21(cell);

          float bottomRight =
            hash21(
              cell +
              vec2(1.0, 0.0)
            );

          float topLeft =
            hash21(
              cell +
              vec2(0.0, 1.0)
            );

          float topRight =
            hash21(
              cell +
              vec2(1.0, 1.0)
            );

          return mix(
            mix(
              bottomLeft,
              bottomRight,
              local.x
            ),
            mix(
              topLeft,
              topRight,
              local.x
            ),
            local.y
          );
        }

        mat2 rotate2D(float angle) {
          float sine = sin(angle);
          float cosine = cos(angle);

          return mat2(
            cosine,
            -sine,
            sine,
            cosine
          );
        }

        float fbmLow(vec2 point) {
          float result = 0.0;
          float amplitude = 0.5;

          for (
            int octave = 0;
            octave < 4;
            octave += 1
          ) {
            result +=
              amplitude *
              valueNoise(point);

            point =
              rotate2D(0.42) *
              point *
              2.03 +
              vec2(8.3, 3.7);

            amplitude *= 0.5;
          }

          return result;
        }

        float fbmHigh(vec2 point) {
          float result = 0.0;
          float amplitude = 0.5;

          for (
            int octave = 0;
            octave < 6;
            octave += 1
          ) {
            result +=
              amplitude *
              valueNoise(point);

            point =
              rotate2D(0.48) *
              point *
              2.01 +
              vec2(6.8, 4.2);

            amplitude *= 0.5;
          }

          return result;
        }

        float softCircle(
          vec2 point,
          vec2 center,
          float radius,
          float softness
        ) {
          float distanceFromCenter =
            length(
              point -
              center
            );

          return 1.0 -
            smoothstep(
              radius,
              radius + softness,
              distanceFromCenter
            );
        }

        void main() {
          vec2 uv =
            vUv -
            vec2(0.5);

          float aspect =
            uResolution.x /
            max(
              uResolution.y,
              1.0
            );

          uv.x *= aspect;

          float time =
            uTime *
            uMotionSpeed *
            uMotionStrength;

          vec2 slowDrift =
            vec2(
              time * 0.006,
              time * 0.0035
            );

          vec2 warpedUv =
            uv *
            rotate2D(
              sin(
                time * 0.025
              ) * 0.04
            );

          float largeCloud =
            fbmLow(
              warpedUv * 1.65 +
              slowDrift
            );

          vec2 distortion =
            vec2(
              fbmLow(
                warpedUv * 2.15 +
                vec2(
                  4.3,
                  time * 0.004
                )
              ),
              fbmLow(
                warpedUv * 2.05 +
                vec2(
                  -3.1,
                  -time * 0.003
                )
              )
            );

          distortion =
            distortion *
            2.0 -
            1.0;

          vec2 cloudUv =
            warpedUv +
            distortion * 0.18;

          float mediumCloud =
            fbmHigh(
              cloudUv * 2.4 +
              slowDrift * 1.7
            );

          float fineCloud =
            fbmHigh(
              cloudUv * 4.8 -
              slowDrift * 0.8
            );

          float detailCloud =
            mix(
              mediumCloud,
              fineCloud,
              0.34 * uDetail
            );

          float nebulaShape =
            smoothstep(
              0.28,
              0.82,
              largeCloud * 0.64 +
              detailCloud * 0.62
            );

          float centralBand =
            exp(
              -abs(
                uv.y +
                sin(
                  uv.x * 2.1 +
                  time * 0.012
                ) * 0.12
              ) * 2.1
            );

          centralBand *=
            smoothstep(
              1.4,
              0.15,
              abs(uv.x)
            );

          float leftCloud =
            softCircle(
              uv,
              vec2(-0.55, 0.12),
              0.72,
              0.58
            );

          float rightCloud =
            softCircle(
              uv,
              vec2(0.62, -0.16),
              0.78,
              0.62
            );

          float upperGlow =
            softCircle(
              uv,
              vec2(0.08, 0.58),
              0.55,
              0.72
            );

          float cloudMask =
            nebulaShape *
            (
              leftCloud * 0.84 +
              rightCloud * 0.78 +
              upperGlow * 0.42 +
              centralBand * 0.52
            );

          vec3 deepSpace =
            vec3(
              0.006,
              0.004,
              0.020
            );

          vec3 midnightBlue =
            vec3(
              0.025,
              0.030,
              0.120
            );

          vec3 violet =
            vec3(
              0.200,
              0.055,
              0.410
            );

          vec3 romanticRose =
            vec3(
              0.620,
              0.090,
              0.360
            );

          vec3 softMagenta =
            vec3(
              0.850,
              0.180,
              0.540
            );

          vec3 warmHighlight =
            vec3(
              1.000,
              0.510,
              0.640
            );

          vec3 color =
            mix(
              deepSpace,
              midnightBlue,
              largeCloud
            );

          color =
            mix(
              color,
              violet,
              smoothstep(
                0.34,
                0.72,
                mediumCloud
              )
            );

          color =
            mix(
              color,
              romanticRose,
              smoothstep(
                0.48,
                0.84,
                detailCloud
              ) *
              leftCloud
            );

          color =
            mix(
              color,
              softMagenta,
              pow(
                max(
                  fineCloud - 0.43,
                  0.0
                ),
                1.55
              ) *
              rightCloud *
              1.32
            );

          float highlight =
            pow(
              max(
                detailCloud - 0.62,
                0.0
              ),
              2.2
            ) *
            centralBand;

          color +=
            warmHighlight *
            highlight *
            0.72;

          float darkDust =
            fbmHigh(
              cloudUv * 3.3 +
              vec2(
                11.4,
                -7.2
              )
            );

          darkDust =
            smoothstep(
              0.48,
              0.71,
              darkDust
            );

          color *=
            1.0 -
            darkDust *
            0.34 *
            cloudMask;

          float edgeDistance =
            length(
              uv *
              vec2(
                0.72,
                0.92
              )
            );

          float vignette =
            1.0 -
            smoothstep(
              0.42,
              1.28,
              edgeDistance
            );

          float alpha =
            cloudMask *
            (
              0.16 +
              centralBand * 0.11 +
              highlight * 0.18
            );

          alpha *=
            mix(
              0.78,
              1.0,
              vignette
            );

          alpha *=
            uBrightness;

          color *=
            uBrightness;

          color +=
            midnightBlue *
            vignette *
            0.028;

          gl_FragColor =
            vec4(
              color,
              clamp(
                alpha,
                0.0,
                0.48
              )
            );
        }
      `,
    });
  }, []);

  useEffect(() => {
    material.uniforms.uDetail.value =
      settings.detail;

    material.uniforms.uBrightness.value =
      settings.brightness;

    material.uniforms.uMotionSpeed.value =
      settings.motionSpeed;
  }, [material, settings]);

  useEffect(() => {
    material.uniforms.uMotionStrength.value =
      motionEnabled ? 1 : 0;
  }, [material, motionEnabled]);

  useEffect(() => {
    const updateResolution = () => {
      material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    };

    updateResolution();

    window.addEventListener(
      "resize",
      updateResolution,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateResolution
      );
    };
  }, [material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value =
      clock.elapsedTime;

    if (
      motionEnabled &&
      meshRef.current
    ) {
      meshRef.current.rotation.z =
        Math.sin(
          clock.elapsedTime * 0.018
        ) * 0.012;

      const breathingScale =
        25 +
        Math.sin(
          clock.elapsedTime * 0.022
        ) * 0.18;

      meshRef.current.scale.setScalar(
        breathingScale
      );
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, -15]}
      scale={25}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}

export default Nebula;
