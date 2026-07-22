import { Canvas } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import FloatingParticles from "./FloatingParticles";
import CameraController from "./CameraController";
import NebulaParticles from "./NebulaParticles";

import Planet from "../space/Planet";
import Moon from "../space/Moon";

function GalaxyBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Background */}
        <color attach="background" args={["#030308"]} />

        {/* HDR Environment */}
        <Environment
          files="/textures/hdr/night_sky.exr"
          background={false}
          environmentIntensity={1.2}
        />

        {/* Lighting */}
        <ambientLight intensity={0.18} />

        <directionalLight
          position={[15, 12, 10]}
          intensity={2.6}
          color="#eef6ff"
        />

        <pointLight
          position={[8, 4, -18]}
          intensity={2.0}
          distance={80}
          color="#dbeafe"
        />

        {/* Camera */}
        <CameraController />

        {/* Effects */}
        <NebulaParticles />

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

        <Planet />

        <Moon />

        {/* Bloom */}
        <EffectComposer>
          <Bloom
            intensity={0.75}
            luminanceThreshold={0.25}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Romantic Pink Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(244,63,94,0.15) 0%, transparent 65%)",
        }}
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none" />
    </div>
  );
}

export default GalaxyBackground;
