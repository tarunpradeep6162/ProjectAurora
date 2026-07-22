import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function getStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 192, 203, 0.6)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

function FloatingParticles() {
  const points = useRef();

  const [positions, colors, texture] = useMemo(() => {
    const pos = [];
    const col = [];
    const colorChoices = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#ffd1dc"),
      new THREE.Color("#ff69b4"),
    ];

    for (let i = 0; i < 2500; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 20 + Math.cbrt(Math.random()) * 60;

      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      col.push(color.r, color.g, color.b);
    }

    return [new Float32Array(pos), new Float32Array(col), getStarTexture()];
  }, []);

  useFrame(({ clock }) => {
    if (points.current) {
      const elapsedTime = clock.getElapsedTime();
      points.current.rotation.y = elapsedTime * 0.02;
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
        size={0.8}
        vertexColors
        map={texture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default FloatingParticles;
