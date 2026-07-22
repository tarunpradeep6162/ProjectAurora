import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Helper to generate a soft glowing circular particle texture programmatically
function getSoftParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(255, 105, 180, 0.8)");
  gradient.addColorStop(0.7, "rgba(168, 85, 247, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

function NebulaParticles() {
  const pointsRef = useRef();

  const [positions, colors, texture] = useMemo(() => {
    const pos = [];
    const col = [];

    const colorPalette = [
      new THREE.Color("#ff69b4"), // Hot Pink
      new THREE.Color("#ff1493"), // Deep Pink
      new THREE.Color("#da70d6"), // Orchid
      new THREE.Color("#ffb6c1"), // Light Pink
    ];

    for (let i = 0; i < 1200; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 10 + Math.random() * 25;

      const x = r * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 8;
      const y = r * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 8;
      const z = r * Math.cos(phi) + (Math.random() - 0.5) * 8;

      pos.push(x, y, z);

      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col.push(randomColor.r, randomColor.g, randomColor.b);
    }

    return [
      new Float32Array(pos), 
      new Float32Array(col), 
      getSoftParticleTexture()
    ];
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const elapsedTime = clock.getElapsedTime();
      pointsRef.current.rotation.y = elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
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
        size={2.5}
        vertexColors
        map={texture}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default NebulaParticles;
