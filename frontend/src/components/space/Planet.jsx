import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Planet() {
  const planet = useRef();
  const moonPivot = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (planet.current) {
      planet.current.rotation.y += 0.002;
      planet.current.rotation.x += 0.0004;
    }

    if (moonPivot.current) {
      moonPivot.current.rotation.y = time * 0.4;
    }
  });

  return (
    <>
      {/* Purple Planet */}
      <Sphere
        ref={planet}
        args={[1.3, 64, 64]}
        position={[5, 2, -8]}
      >
        <meshStandardMaterial
          color="#6a5acd"
          roughness={0.8}
          metalness={0.15}
        />
      </Sphere>

      {/* Planet Glow */}
      <pointLight
        position={[5, 2, -6]}
        intensity={4}
        color="#9f7aea"
      />

      {/* Moon Orbit */}
      <group ref={moonPivot} position={[5, 2, -8]}>

        <Sphere
          args={[0.28, 32, 32]}
          position={[2.4, 0, 0]}
        >
          <meshStandardMaterial
            color="#dddddd"
            roughness={1}
          />
        </Sphere>

      </group>

      <ambientLight intensity={0.8} />
    </>
  );
}

export default Planet;
