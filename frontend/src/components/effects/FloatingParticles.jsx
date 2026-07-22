import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

function FloatingParticles() {
  const points = useRef();

  const particles = useMemo(() => {
    const positions = [];

    for (let i = 0; i < 2000; i++) {
      positions.push(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
    }

    return new Float32Array(positions);
  }, []);

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y += 0.0008;
      points.current.rotation.x += 0.0002;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#ffffff"
        size={0.08}
        sizeAttenuation
      />
    </points>
  );
}

export default FloatingParticles;
