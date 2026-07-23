import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function createSeededRandom(seed = 92741) {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomGaussian(random) {
  const first = Math.max(random(), 0.000001);
  const second = Math.max(random(), 0.000001);

  return (
    Math.sqrt(-2 * Math.log(first)) *
    Math.cos(2 * Math.PI * second)
  );
}

function getStarColor(random, brightness) {
  const temperatureRoll = random();

  let color;

  if (temperatureRoll < 0.12) {
    color = new THREE.Color("#9fbfff");
  } else if (temperatureRoll < 0.36) {
    color = new THREE.Color("#d9e5ff");
  } else if (temperatureRoll < 0.73) {
    color = new THREE.Color("#fff7e8");
  } else if (temperatureRoll < 0.92) {
    color = new THREE.Color("#ffd8a8");
  } else {
    color = new THREE.Color("#ffb38a");
  }

  const intensity =
    0.72 + brightness * 0.45;

  color.multiplyScalar(intensity);

  return color;
}

function StarField({
  count = 6000,
  motionEnabled = true,
  qualityLevel = "high",
}) {
  const pointsRef = useRef(null);
  const materialRef = useRef(null);

  const gl = useThree((state) => state.gl);

  const effectiveCount = useMemo(() => {
    if (qualityLevel === "low") {
      return Math.min(count, 2800);
    }

    if (qualityLevel === "medium") {
      return Math.min(count, 4500);
    }

    return count;
  }, [count, qualityLevel]);

  const geometry = useMemo(() => {
    const random = createSeededRandom(92741);

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

    const twinkleSpeeds =
      new Float32Array(effectiveCount);

    const depthFade =
      new Float32Array(effectiveCount);

    for (
      let index = 0;
      index < effectiveCount;
      index += 1
    ) {
      const positionIndex = index * 3;

      const galaxyStar =
        random() < 0.62;

      let x;
      let y;
      let z;

      if (galaxyStar) {
        const radius =
          7 + Math.pow(random(), 0.72) * 31;

        const arm =
          Math.floor(random() * 3);

        const armOffset =
          arm * ((Math.PI * 2) / 3);

        const spiral =
          radius * 0.13;

        const angle =
          armOffset +
          spiral +
          randomGaussian(random) * 0.24;

        const verticalSpread =
          0.5 + radius * 0.035;

        x =
          Math.cos(angle) * radius +
          randomGaussian(random) * 0.8;

        y =
          randomGaussian(random) *
          verticalSpread;

        z =
          Math.sin(angle) * radius +
          randomGaussian(random) * 0.8;

        const tilt = 0.28;

        const rotatedY =
          y * Math.cos(tilt) -
          z * Math.sin(tilt);

        const rotatedZ =
          y * Math.sin(tilt) +
          z * Math.cos(tilt);

        y = rotatedY;
        z = rotatedZ;
      } else {
        const radius =
          10 + Math.cbrt(random()) * 34;

        const theta =
          random() * Math.PI * 2;

        const phi =
          Math.acos(2 * random() - 1);

        x =
          radius *
          Math.sin(phi) *
          Math.cos(theta);

        y =
          radius *
          Math.sin(phi) *
          Math.sin(theta);

        z =
          radius *
          Math.cos(phi);
      }

      positions[positionIndex] = x;
      positions[positionIndex + 1] = y;
      positions[positionIndex + 2] = z;

      const rareBrightStar =
        random() > 0.965;

      const starBrightness =
        rareBrightStar
          ? 0.92 + random() * 0.25
          : 0.28 + Math.pow(random(), 1.8) * 0.68;

      const starSize =
        rareBrightStar
          ? 3.2 + random() * 3.5
          : 0.9 + Math.pow(random(), 2.3) * 3.2;

      const starColor =
        getStarColor(
          random,
          starBrightness
        );

      colors[positionIndex] =
        starColor.r;

      colors[positionIndex + 1] =
        starColor.g;

      colors[positionIndex + 2] =
        starColor.b;

      sizes[index] = starSize;

      brightness[index] =
        starBrightness;

      phases[index] =
        random() * Math.PI * 2;

      twinkleSpeeds[index] =
        0.45 + random() * 1.15;

      const distance =
        Math.sqrt(
          x * x +
          y * y +
          z * z
        );

      depthFade[index] =
        THREE.MathUtils.clamp(
          1.18 - distance / 52,
          0.35,
          1
        );
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
      "aTwinkleSpeed",
      new THREE.BufferAttribute(
        twinkleSpeeds,
        1
      )
    );

    bufferGeometry.setAttribute(
      "aDepthFade",
      new THREE.BufferAttribute(
        depthFade,
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

        uGlobalOpacity: {
          value: 1,
        },

        uMotionStrength: {
          value: motionEnabled ? 1 : 0,
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
        attribute float aTwinkleSpeed;
        attribute float aDepthFade;

        varying vec3 vColor;
        varying float vBrightness;
        varying float vTwinkle;
        varying float vDistanceFade;

        void main() {
          vec3 animatedPosition = position;

          float subtleWave =
            sin(
              uTime * 0.055 +
              position.x * 0.045 +
              aPhase
            ) * 0.025 * uMotionStrength;

          animatedPosition.y += subtleWave;

          vec4 modelPosition =
            modelMatrix *
            vec4(animatedPosition, 1.0);

          vec4 viewPosition =
            viewMatrix *
            modelPosition;

          gl_Position =
            projectionMatrix *
            viewPosition;

          float primaryTwinkle =
            sin(
              uTime *
              aTwinkleSpeed +
              aPhase
            );

          float secondaryTwinkle =
            sin(
              uTime *
              aTwinkleSpeed *
              0.37 +
              aPhase * 2.17
            );

          float twinkle =
            0.82 +
            primaryTwinkle * 0.12 +
            secondaryTwinkle * 0.06;

          float perspectiveScale =
            46.0 /
            max(3.0, -viewPosition.z);

          gl_PointSize =
            clamp(
              aSize *
              twinkle *
              uPixelRatio *
              perspectiveScale,
              1.0,
              18.0
            );

          float cameraDistance =
            length(viewPosition.xyz);

          float distanceFade =
            1.0 -
            smoothstep(
              24.0,
              52.0,
              cameraDistance
            );

          vColor = aColor;

          vBrightness =
            aBrightness *
            twinkle;

          vTwinkle =
            clamp(twinkle, 0.65, 1.15);

          vDistanceFade =
            max(
              distanceFade,
              0.2
            ) *
            aDepthFade;
        }
      `,

      fragmentShader: `
        uniform float uGlobalOpacity;

        varying vec3 vColor;
        varying float vBrightness;
        varying float vTwinkle;
        varying float vDistanceFade;

        void main() {
          vec2 centered =
            gl_PointCoord -
            vec2(0.5);

          float radialDistance =
            length(centered);

          if (radialDistance > 0.5) {
            discard;
          }

          float core =
            1.0 -
            smoothstep(
              0.0,
              0.16,
              radialDistance
            );

          float innerGlow =
            1.0 -
            smoothstep(
              0.05,
              0.30,
              radialDistance
            );

          float outerGlow =
            1.0 -
            smoothstep(
              0.16,
              0.5,
              radialDistance
            );

          float horizontalRay =
            exp(
              -abs(centered.y) * 62.0
            ) *
            exp(
              -abs(centered.x) * 8.0
            );

          float verticalRay =
            exp(
              -abs(centered.x) * 62.0
            ) *
            exp(
              -abs(centered.y) * 8.0
            );

          float rayStrength =
            smoothstep(
              0.72,
              1.05,
              vBrightness
            );

          float rays =
            (
              horizontalRay +
              verticalRay
            ) *
            rayStrength *
            0.18;

          float alpha =
            (
              core * 0.92 +
              innerGlow * 0.38 +
              outerGlow * 0.16 +
              rays
            ) *
            vBrightness *
            vDistanceFade *
            uGlobalOpacity;

          vec3 finalColor =
            vColor *
            (
              0.82 +
              core * 0.72 +
              vTwinkle * 0.12
            );

          gl_FragColor =
            vec4(
              finalColor,
              clamp(alpha, 0.0, 1.0)
            );
        }
      `,
    });
  }, []);

  useEffect(() => {
    material.uniforms.uMotionStrength.value =
      motionEnabled ? 1 : 0;
  }, [material, motionEnabled]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value =
      state.clock.elapsedTime;

    material.uniforms.uPixelRatio.value =
      Math.min(
        gl.getPixelRatio(),
        2
      );

    if (!pointsRef.current) {
      return;
    }

    if (motionEnabled) {
      pointsRef.current.rotation.y +=
        delta * 0.0022;

      pointsRef.current.rotation.x =
        Math.sin(
          state.clock.elapsedTime *
          0.028
        ) * 0.012;

      pointsRef.current.rotation.z =
        Math.cos(
          state.clock.elapsedTime *
          0.021
        ) * 0.006;
    }
  });

  useEffect(() => {
    materialRef.current = material;

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
      renderOrder={2}
    />
  );
}

export default StarField;
