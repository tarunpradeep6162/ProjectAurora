import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import FloatingParticles from "./FloatingParticles";
import CameraController from "./CameraController";

function GalaxyBackground() {
  return (
    <div className="absolute inset-0 -z-0">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
        }}
      >
        {/* Background */}
        <color attach="background" args={["#000000"]} />

        {/* Soft Light */}
        <ambientLight intensity={0.5} />
        <CameraController />

        {/* Animated Stars */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      <FloatingParticles />
      </Canvas>
    </div>
  );
}

export default GalaxyBackground;
