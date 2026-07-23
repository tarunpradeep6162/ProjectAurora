import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function createSeededRandom(seed = 48391) {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function getAdaptiveCount(
  requestedCount,
  qualityLevel,
  isMobile
) {
  if (qualityLevel === "low") {
    return Math.min(requestedCount, 700);
  }

  if (qualityLevel === "medium") {
    return Math.min(requestedCount, 1200);
  }

  if (isMobile) {
    return Math.min(requestedCount, 1600);
  }

  return requestedCount;
}

function FloatingParticles({
  count = 2500,
  qualityLevel = "high",
  motionEnabled = true,
}) {
  const pointsRef = useRef(null);

  const gl = useThree((state) => state.gl);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(
      "(max-width: 768px), (pointer: coarse)"
    ).matches;
  }, []);

  const effectiveCount = useMemo(
    () =>
      getAdaptiveCount(
        count,
        qualityLevel,
        isMobile
      ),
    [count, qualityLevel, isMobile]
  );

  const geometry = useMemo(() => {
    const random =
      createSeededRandom(48391);

    const positions =
      new Float32Array(effectiveCount * 3);

    const colors =
      new Float32Array(effectiveCount * 3);

    const sizes =
      new Float32Array(effectiveCount);

    const brightness =
      new Float32Array(effectiveCount);

    const phases =
      new Float32Array(effectiveCount);

    const speeds =
      new Float32Array(effectiveCount);

    const colorPalette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#e6ecff"),
      new THREE.Color("#ffd5e5"),
      new THREE.Color("#ff9ac6"),
      new THREE.Color("#d8b8ff"),
    ];

    for (
      let index = 0;
      index < effectiveCount;
      index += 1
    ) {
      const positionIndex =
        index * 3;

      const theta =
        random() * Math.PI * 2;

      const phi =
        Math.acos(
          2 * random() - 1
        );

      const radius =
        12 +
        Math.cbrt(random()) * 55;

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

      positions[positionIndex] = x;
      positions[positionIndex + 1] = y;
      positions[positionIndex + 2] = z;

      const color =
        colorPalette[
          Math.floor(
            random() *
            colorPalette.length
          )
        ];

      const colorIntensity =
        0.72 +
        random() * 0.38;

      colors[positionIndex] =
        color.r * colorIntensity;

      colors[positionIndex + 1] =
        color.g * colorIntensity;

      colors[positionIndex + 2] =
        color.b * colorIntensity;

      const rareParticle =
        random() > 0.975;

      sizes[index] =
        rareParticle
          ? 3.5 + random() * 3.2
          : 1.2 + random() * 2.8;

      brightness[index] =
        rareParticle
          ? 0.88 + random() * 0.2
          : 0.28 + random() * 0.55;

      phases[index] =
        random() *
        Math.PI *
        2;

      speeds[index] =
        0.25 +
        random() * 0.75;
    }

    const bufferGeometry =
      new THREE.BufferGeometry();

    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    bufferGeometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(
        colors,
        3
      )
    );

    bufferGeometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(
        sizes,
        1
      )
    );

    bufferGeometry.setAttribute(
      "aBrightness",
      new THREE.BufferAttribute(
        brightness,
        1
      )
    );

    bufferGeometry.setAttribute(
      "aPhase",
      new THREE.BufferAttribute(
        phases,
        1
      )
    );

    bufferGeometry.setAttribute(
      "aSpeed",
      new THREE.BufferAttribute(
        speeds,
        1
      )
    );

    bufferGeometry.computeBoundingSphere();

    return bufferGeometry;
  }, [effectiveCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,

      uniforms: {
        uTime: {
          value: 0,
        },

        uPixelRatio: {
          value: 1,
        },

        uMotionStrength: {
          value: motionEnabled
            ? 1
            : 0,
        },

        uOpacity: {
          value:
            qualityLevel === "low"
              ? 0.62
              : qualityLevel === "medium"
                ? 0.76
                : 0.88,
        },
      },

      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uMotionStrength;

        attribute vec3 aColor;
        attribute float aSize;
        attribute float aBrightness;
        attribute float aPhase;
        attribute float aSpeed;

        varying vec3 vColor;
        varying float vBrightness;
        varying float vDepthFade;

        void main() {
          vec3 animatedPosition =
            position;

          float floatingMotion =
            sin(
              uTime * aSpeed +
              aPhase
            ) * 0.16;

          float secondaryMotion =
            cos(
              uTime *
              aSpeed *
              0.57 +
              aPhase * 1.7
            ) * 0.09;

          animatedPosition.y +=
            floatingMotion *
            uMotionStrength;

          animatedPosition.x +=
            secondaryMotion *
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

          gl_PointSize =
            clamp(
              aSize *
              uPixelRatio *
              perspectiveSize,
              1.0,
              15.0
            );

          float pulse =
            0.82 +
            sin(
              uTime *
              aSpeed *
              1.4 +
              aPhase
            ) * 0.18;

          vColor = aColor;

          vBrightness =
            aBrightness *
            pulse;

          vDepthFade =
            1.0 -
            smoothstep(
              30.0,
              72.0,
              distanceFromCamera
            );
        }
      `,

      fragmentShader: `
        uniform float uOpacity;

        varying vec3 vColor;
        varying float vBrightness;
        varying float vDepthFade;

        void main() {
          vec2 centered =
            gl_PointCoord -
            vec2(0.5);

          float radialDistance =
            length(centered);

          if (
            radialDistance > 0.5
          ) {
            discard;
          }

          float core =
            1.0 -
            smoothstep(
              0.0,
              0.12,
              radialDistance
            );

          float innerGlow =
            1.0 -
            smoothstep(
              0.06,
              0.28,
              radialDistance
            );

          float outerGlow =
            1.0 -
            smoothstep(
              0.18,
              0.5,
              radialDistance
            );

          float alpha =
            (
              core * 0.82 +
              innerGlow * 0.38 +
              outerGlow * 0.18
            ) *
            vBrightness *
            vDepthFade *
            uOpacity;

          vec3 finalColor =
            vColor *
            (
              0.82 +
              core * 0.65
            );

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
    material.uniforms.uMotionStrength.value =
      motionEnabled ? 1 : 0;
  }, [material, motionEnabled]);

  useEffect(() => {
    material.uniforms.uOpacity.value =
      qualityLevel === "low"
        ? 0.62
        : qualityLevel === "medium"
          ? 0.76
          : 0.88;
  }, [material, qualityLevel]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value =
      state.clock.elapsedTime;

    material.uniforms.uPixelRatio.value =
      Math.min(
        gl.getPixelRatio(),
        isMobile ? 1.5 : 2
      );

    if (
      !pointsRef.current ||
      !motionEnabled
    ) {
      return;
    }

    pointsRef.current.rotation.y +=
      delta *
      (isMobile
        ? 0.004
        : 0.006);

    pointsRef.current.rotation.x =
      Math.sin(
        state.clock.elapsedTime *
        0.024
      ) * 0.012;

    pointsRef.current.rotation.z =
      Math.cos(
        state.clock.elapsedTime *
        0.019
      ) * 0.007;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

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
