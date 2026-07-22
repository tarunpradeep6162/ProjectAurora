import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Planet() {
  const sunRef = useRef();
  const moonRef = useRef();
  const moonOrbitRef = useRef();
  const coronaRef = useRef();

  // Cinematic orbital and rotational mechanics
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate the Sun on its axis
    if (sunRef.current) {
      sunRef.current.rotation.y = elapsedTime * 0.04;
    }

    // Pulse the sun's outer corona / glow
    if (coronaRef.current) {
      const pulse = 1 + Math.sin(elapsedTime * 2) * 0.05;
      coronaRef.current.scale.set(pulse, pulse, pulse);
    }

    // Orbit the romantic Moon smoothly around the Sun
    if (moonOrbitRef.current) {
      moonOrbitRef.current.rotation.y = elapsedTime * 0.3;
    }

    // Rotate the Moon on its own axis
    if (moonRef.current) {
      moonRef.current.rotation.y = elapsedTime * 0.1;
    }
  });

  return (
    <group position={[2.2, -0.2, -1.5]}>
      
      {/* ================= SUN (THE RADIANT HEART) ================= */}
      <group ref={sunRef}>
        {/* Core Sun Mesh */}
        <mesh>
          <sphereGeometry args={[1.3, 64, 64]} />
          <meshBasicMaterial color="#ff4500" />
        </mesh>

        {/* Emissive Inner Sun Glow Layer */}
        <mesh>
          <sphereGeometry args={[1.32, 64, 64]} />
          <meshStandardMaterial
            color="#ff7700"
            emissive="#ff3300"
            emissiveIntensity={2.5}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Outer Atmospheric Sun Corona / Halo */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[1.6, 64, 64]} />
        <meshStandardMaterial
          color="#ffaa00"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Dynamic Point Light casting real warmth onto the scene */}
      <pointLight color="#ff6600" intensity={4.5} distance={12} decay={2} />


      {/* ================= MOON (ORBITING LOVER) ================= */}
      <group ref={moonOrbitRef}>
        <group position={[3.2, 0.4, 0]}>
          
          {/* Moon Mesh with Realistic Silver/Rose Shading */}
          <mesh ref={moonRef}>
            <sphereGeometry args={[0.45, 48, 48]} />
            <meshStandardMaterial
              color="#d1d5db"
              emissive="#374151"
              emissiveIntensity={0.2}
              roughness={0.8}
              metalness={0.4}
            />
          </mesh>

          {/* Soft Moonlight Glow Halo */}
          <mesh>
            <sphereGeometry args={[0.52, 32, 32]} />
            <meshStandardMaterial
              color="#93c5fd"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Delicate Moon Point Light */}
          <pointLight color="#93c5fd" intensity={1.2} distance={4} />

        </group>
      </group>

    </group>
  );
}

export default Planet;
