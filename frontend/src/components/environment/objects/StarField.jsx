import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function createSeededRandom(seed) {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function StarField({
  count = 1000,
  radius = 18,
  depth = 28,
  motionEnabled = true,
}) {
  const pointsRef = useRef(null);

  const geometry = useMemo(() => {
    const random = createSeededRandom(92741);

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const distance = radius * Math.cbrt(random());

      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = -random() * depth + 4;

      const positionIndex = index * 3;

      positions[positionIndex] = x;
      positions[positionIndex + 1] = y;
      positions[positionIndex + 2] = z;

      sizes[index] = 1.2 + random() * 2.8;
      brightness[index] = 0.3 + random() * 0.7;
    }

    const bufferGeometry = new THREE.BufferGeometry();

    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    bufferGeometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(sizes, 1)
    );

    bufferGeometry.setAttribute(
      "aBrightness",
      new THREE.BufferAttribute(brightness, 1)
    );

    return bufferGeometry;
  }, [count, depth, radius]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      uniforms: {
        uTime: {
          value: 0,
        },
        uPixelRatio: {
          value: Math.min(
            typeof window !== "undefined"
              ? window.devicePixelRatio
              : 1,
            1.5
          ),
        },
      },

      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;

        attribute float aSize;
        attribute float aBrightness;

        varying float vBrightness;
        varying float vTwinkle;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);

          float twinkle =
            sin(
              uTime * 0.65 +
              position.x * 2.1 +
              position.y * 1.7 +
              position.z * 0.9
            ) * 0.5 + 0.5;

          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;

          float perspectiveScale =
            120.0 / max(1.0, -viewPosition.z);

          gl_PointSize =
            aSize *
            uPixelRatio *
            perspectiveScale;

          gl_PointSize = clamp(gl_PointSize, 1.0, 6.0);

          vBrightness = aBrightness;
          vTwinkle = mix(0.5, 1.0, twinkle);
        }
      `,

      fragmentShader: `
        varying float vBrightness;
        varying float vTwinkle;

        void main() {
          vec2 centeredUv = gl_PointCoord - vec2(0.5);

          float distanceFromCenter = length(centeredUv);

          float core = 1.0 - smoothstep(
            0.0,
            0.5,
            distanceFromCenter
          );

          float glow = 1.0 - smoothstep(
            0.1,
            0.5,
            distanceFromCenter
          );

          float alpha =
            core *
            glow *
            vBrightness *
            vTwinkle;

          vec3 warmWhite = vec3(
            1.0,
            0.94,
            0.9
          );

          gl_FragColor = vec4(
            warmWhite,
            alpha
          );
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !motionEnabled) {
      return;
    }

    material.uniforms.uTime.value =
      state.clock.elapsedTime;

    pointsRef.current.rotation.y += delta * 0.003;
    pointsRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.04) * 0.015;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

export default StarField;
