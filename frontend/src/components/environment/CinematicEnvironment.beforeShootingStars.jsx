import {
  Canvas,
} from "@react-three/fiber";
import {
  useEffect,
  useState,
} from "react";
import * as THREE from "three";
import CinematicScene from "./CinematicScene";
import useDeviceQuality from "./hooks/useDeviceQuality";

function CinematicEnvironment() {
  const quality =
    useDeviceQuality();

  const [isVisible, setIsVisible] =
    useState(() => {
      if (typeof document === "undefined") {
        return true;
      }

      return !document.hidden;
    });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(
        !document.hidden
      );
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      data-quality-profile={
        quality.profile
      }
    >
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        dpr={[
          quality.minimumDpr,
          quality.maxDpr,
        ]}
        frameloop={
          isVisible
            ? "always"
            : "never"
        }
        camera={{
          position: [0, 0, 6],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: false,
          antialias:
            quality.antialiasEnabled,
          powerPreference:
            "high-performance",
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({
          gl,
          camera,
        }) => {
          gl.outputColorSpace =
            THREE.SRGBColorSpace;

          gl.toneMapping =
            THREE.ACESFilmicToneMapping;

          gl.toneMappingExposure =
            quality.isMobile
              ? 1.02
              : 1.08;

          gl.setClearColor(
            "#05040a",
            1
          );

          camera.updateProjectionMatrix();
        }}
      >
        <color
          attach="background"
          args={["#05040a"]}
        />

        <CinematicScene
          quality={quality}
        />
      </Canvas>
    </div>
  );
}

export default CinematicEnvironment;
