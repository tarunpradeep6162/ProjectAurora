import { Canvas } from "@react-three/fiber";

function GalaxyBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
        }}
      >
        <color attach="background" args={["#000000"]} />

        <ambientLight intensity={0.4} />
      </Canvas>
    </div>
  );
}

export default GalaxyBackground;
