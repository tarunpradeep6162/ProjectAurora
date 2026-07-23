import { Canvas } from "@react-three/fiber";
import CinematicScene from "./CinematicScene";
import useDeviceQuality from "./hooks/useDeviceQuality";

function CinematicEnvironment() {
  const quality = useDeviceQuality();

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000",
      }}
    >
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        dpr={1}
        camera={{
          position: [0, 0, 6],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, camera, size }) => {
          console.log("WEBGL CANVAS CREATED", {
            width: size.width,
            height: size.height,
            camera: camera.position.toArray(),
            renderer: gl.info,
          });
        }}
      >
        <color attach="background" args={["#000000"]} />

        {/* Temporary direct Canvas diagnostic */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 2.5, 2.5]} />
          <meshNormalMaterial />
        </mesh>

        {/* Existing professional environment remains untouched */}
        <CinematicScene quality={quality} />
      </Canvas>
    </div>
  );
}

export default CinematicEnvironment;
