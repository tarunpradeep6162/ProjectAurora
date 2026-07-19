import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function NebulaParticles() {
  const points = useRef();

  const { positions, colors } = useMemo(() => {
    const particleCount = 3000;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color("#7c3aed");
    const color2 = new THREE.Color("#3b82f6");
    const color3 = new THREE.Color("#ec4899");

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;

      const random = Math.random();

      let color;

      if (random < 0.33) {
        color = color1;
      } else if (random < 0.66) {
        color = color2;
      } else {
        color = color3;
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return {
      positions,
      colors,
    };
  }, []);

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y += 0.0003;
      points.current.rotation.x += 0.00005;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />

        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}

export default NebulaParticles;
