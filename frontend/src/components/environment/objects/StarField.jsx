import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function seededRandom(seed) {
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
  count = 6000,
  motionEnabled = true,
}) {
  const pointsRef = useRef(null);

  const geometry = useMemo(() => {
    const random = seededRandom(92741);

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const radius = 9 + random() * 28;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      const positionIndex = index * 3;

      positions[positionIndex] =
        radius * Math.sin(phi) * Math.cos(theta);

      positions[positionIndex + 1] =
        radius * Math.sin(phi) * Math.sin(theta);

      positions[positionIndex + 2] =
        radius * Math.cos(phi) - 8;

      sizes[index] = 1.2 + random() * 3.8;
      brightness[index] = 0.35 + random() * 0.65;
      phases[index] = random() * Math.PI * 2;
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

    bufferGeometry.setAttribute(
      "aPhase",
      new THREE.BufferAttribute(phases, 1)
    );

    bufferGeometry.computeBoundingSphere();

    return bufferGeometry;
  }, [count]);

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
          value: Math.min(window.devicePixelRatio, 2),
        },
      },

      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;

        attribute float aSize;
        attribute float aBrightness;
        attribute float aPhase;

        varying float vBrightness;

        void main() {
          vec4 modelPosition =
            modelMatrix * vec4(position, 1.0);

          vec4 viewPosition =
            viewMatrix * modelPosition;

          vec4 projectedPosition =
            projectionMatrix * viewPosition;

          gl_Position = projectedPosition;

          float twinkle =
            0.78 +
            sin(uTime * 1.35 + aPhase) * 0.22;

          gl_PointSize =
            aSize *
            twinkle *
            uPixelRatio *
            (18.0 / max(1.0, -viewPosition.z));

          vBrightness =
            aBrightness * twinkle;
        }
      `,

      fragmentShader: `
        varying float vBrightness;

        void main() {
          vec2 centered =
            gl_PointCoord - vec2(0.5);

          float distanceFromCenter =
            length(centered);

          if (distanceFromCenter > 0.5) {
            discard;
          }

          float core =
            smoothstep(
              0.18,
              0.0,
              distanceFromCenter
            );

          float glow =
            smoothstep(
              0.5,
              0.0,
              distanceFromCenter
            );

          vec3 coolWhite =
            vec3(0.77, 0.84, 1.0);

          vec3 warmWhite =
            vec3(1.0, 0.88, 0.78);

          vec3 starColor =
            mix(
              coolWhite,
              warmWhite,
              vBrightness * 0.28
            );

          float alpha =
            (core * 0.85 + glow * 0.28) *
            vBrightness;

          gl_FragColor =
            vec4(starColor, alpha);
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    material.uniforms.uTime.value =
      state.clock.elapsedTime;

    if (
      motionEnabled &&
      pointsRef.current
    ) {
      pointsRef.current.rotation.y +=
        delta * 0.003;

      pointsRef.current.rotation.x =
        Math.sin(
          state.clock.elapsedTime * 0.035
        ) * 0.018;
    }
  });

  useEffect(() => {
    const updatePixelRatio = () => {
      material.uniforms.uPixelRatio.value =
        Math.min(window.devicePixelRatio, 2);
    };

    window.addEventListener(
      "resize",
      updatePixelRatio
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePixelRatio
      );
    };
  }, [material]);

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
      renderOrder={2}
    />
  );
}

export default StarField;
