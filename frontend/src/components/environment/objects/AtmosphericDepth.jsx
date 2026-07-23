import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uMotionStrength;
  uniform float uNoiseScale;
  uniform float uEdgeSoftness;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uDrift;

  varying vec2 vUv;

  float random(vec2 position) {
    return fract(
      sin(
        dot(
          position,
          vec2(12.9898, 78.233)
        )
      ) * 43758.5453
    );
  }

  float noise(vec2 position) {
    vec2 integerPosition =
      floor(position);

    vec2 fractionalPosition =
      fract(position);

    fractionalPosition =
      fractionalPosition *
      fractionalPosition *
      (
        3.0 -
        2.0 *
        fractionalPosition
      );

    float a =
      random(integerPosition);

    float b =
      random(
        integerPosition +
        vec2(1.0, 0.0)
      );

    float c =
      random(
        integerPosition +
        vec2(0.0, 1.0)
      );

    float d =
      random(
        integerPosition +
        vec2(1.0, 1.0)
      );

    return mix(
      mix(a, b, fractionalPosition.x),
      mix(c, d, fractionalPosition.x),
      fractionalPosition.y
    );
  }

  float fbm(vec2 position) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int octave = 0; octave < 4; octave++) {
      value +=
        amplitude *
        noise(position);

      position =
        position *
        2.03 +
        vec2(11.7, 7.3);

      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 centeredUv =
      vUv -
      vec2(0.5);

    float time =
      uTime *
      uMotionStrength;

    vec2 animatedUv =
      vUv *
      uNoiseScale;

    animatedUv +=
      uDrift *
      time;

    float primaryNoise =
      fbm(animatedUv);

    float secondaryNoise =
      fbm(
        animatedUv *
        1.7 -
        vec2(
          time * 0.018,
          time * 0.012
        )
      );

    float cloud =
      primaryNoise *
      0.68 +
      secondaryNoise *
      0.32;

    float radialDistance =
      length(
        centeredUv *
        vec2(1.15, 0.9)
      );

    float radialMask =
      1.0 -
      smoothstep(
        0.05,
        uEdgeSoftness,
        radialDistance
      );

    float verticalMask =
      smoothstep(
        0.0,
        0.24,
        vUv.y
      ) *
      (
        1.0 -
        smoothstep(
          0.76,
          1.0,
          vUv.y
        )
      );

    float density =
      smoothstep(
        0.28,
        0.82,
        cloud
      );

    density *=
      radialMask *
      verticalMask;

    vec3 finalColor =
      mix(
        uColorA,
        uColorB,
        cloud
      );

    float alpha =
      density *
      uOpacity;

    gl_FragColor =
      vec4(
        finalColor,
        alpha
      );
  }
`;

function AtmosphericLayer({
  position,
  scale,
  colorA,
  colorB,
  opacity,
  noiseScale,
  edgeSoftness,
  drift,
  motionEnabled,
  renderOrder,
}) {
  const meshRef = useRef(null);

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

        uOpacity: {
          value: opacity,
        },

        uMotionStrength: {
          value: motionEnabled
            ? 1
            : 0,
        },

        uNoiseScale: {
          value: noiseScale,
        },

        uEdgeSoftness: {
          value: edgeSoftness,
        },

        uColorA: {
          value:
            new THREE.Color(colorA),
        },

        uColorB: {
          value:
            new THREE.Color(colorB),
        },

        uDrift: {
          value:
            new THREE.Vector2(
              drift[0],
              drift[1]
            ),
        },
      },

      vertexShader,
      fragmentShader,
    });
  }, [
    colorA,
    colorB,
    drift,
    edgeSoftness,
    noiseScale,
    opacity,
  ]);

  useEffect(() => {
    material.uniforms.uMotionStrength.value =
      motionEnabled ? 1 : 0;
  }, [material, motionEnabled]);

  useFrame((state) => {
    material.uniforms.uTime.value =
      state.clock.elapsedTime;

    if (
      !meshRef.current ||
      !motionEnabled
    ) {
      return;
    }

    const elapsed =
      state.clock.elapsedTime;

    meshRef.current.rotation.z =
      Math.sin(
        elapsed * 0.018 +
        renderOrder
      ) * 0.014;

    meshRef.current.position.x =
      position[0] +
      Math.sin(
        elapsed * 0.026 +
        renderOrder
      ) * 0.16;

    meshRef.current.position.y =
      position[1] +
      Math.cos(
        elapsed * 0.021 +
        renderOrder
      ) * 0.1;
  });

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      material={material}
      renderOrder={renderOrder}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
    </mesh>
  );
}

function AtmosphericDepth({
  qualityLevel = "high",
  isMobile = false,
  motionEnabled = true,
}) {
  const isReduced =
    qualityLevel === "reduced";

  const isLow =
    qualityLevel === "low";

  const farOpacity = isReduced
    ? 0.055
    : isLow
      ? 0.07
      : isMobile
        ? 0.085
        : 0.11;

  const middleOpacity = isReduced
    ? 0.04
    : isLow
      ? 0.052
      : isMobile
        ? 0.065
        : 0.085;

  const foregroundOpacity = isReduced
    ? 0.018
    : isMobile
      ? 0.026
      : 0.038;

  return (
    <group>
      <AtmosphericLayer
        position={[0, 0.4, -24]}
        scale={[44, 26, 1]}
        colorA="#15112f"
        colorB="#49318a"
        opacity={farOpacity}
        noiseScale={
          isMobile ? 2.4 : 3.2
        }
        edgeSoftness={0.78}
        drift={[0.007, 0.004]}
        motionEnabled={motionEnabled}
        renderOrder={0}
      />

      <AtmosphericLayer
        position={[-0.8, -0.1, -10]}
        scale={[29, 18, 1]}
        colorA="#39152f"
        colorB="#9c376f"
        opacity={middleOpacity}
        noiseScale={
          isMobile ? 2.8 : 3.8
        }
        edgeSoftness={0.72}
        drift={[-0.008, 0.005]}
        motionEnabled={motionEnabled}
        renderOrder={2}
      />

      {!isLow && (
        <AtmosphericLayer
          position={[0.9, -0.6, 2.4]}
          scale={[17, 11, 1]}
          colorA="#29152e"
          colorB="#b1457f"
          opacity={foregroundOpacity}
          noiseScale={
            isMobile ? 3.1 : 4.4
          }
          edgeSoftness={0.68}
          drift={[0.006, -0.004]}
          motionEnabled={motionEnabled}
          renderOrder={4}
        />
      )}
    </group>
  );
}

export default AtmosphericDepth;
