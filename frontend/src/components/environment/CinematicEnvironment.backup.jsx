import { Canvas } from "@react-three/fiber";
import CinematicScene from "./CinematicScene";
import useDeviceQuality from "./hooks/useDeviceQuality";

function CinematicEnvironment() {
  const quality = useDeviceQuality();

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        dpr={[0.75, quality.maxDpr]}
        camera={{
          position: [0, 0, 6],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: false,
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#05040a"]} />
        <CinematicScene quality={quality} />
      </Canvas>
    </div>
  );
}

export default CinematicEnvironment;
