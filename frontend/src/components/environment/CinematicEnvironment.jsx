import { Canvas } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import ShootingStars from "../effects/ShootingStars";
import CinematicScene from "./CinematicScene";
import useDeviceQuality from "./hooks/useDeviceQuality";

const INTERACTION_PAUSE_MS = 220;

function CinematicEnvironment() {
  const quality = useDeviceQuality();

  const interactionTimeoutRef =
    useRef(null);

  const [isVisible, setIsVisible] =
    useState(() => {
      if (
        typeof document ===
        "undefined"
      ) {
        return true;
      }

      return !document.hidden;
    });

  const [
    isInteracting,
    setIsInteracting,
  ] = useState(false);

  /*
   * Pause optional DOM effects briefly while
   * the user is interacting.
   *
   * The Three.js canvas remains mounted, so
   * there is no expensive WebGL remount.
   */
  const beginInteraction =
    useCallback(() => {
      setIsInteracting(true);

      if (
        interactionTimeoutRef.current
      ) {
        window.clearTimeout(
          interactionTimeoutRef.current,
        );
      }

      interactionTimeoutRef.current =
        window.setTimeout(() => {
          setIsInteracting(false);

          interactionTimeoutRef.current =
            null;
        }, INTERACTION_PAUSE_MS);
    }, []);

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        setIsVisible(
          !document.hidden,
        );
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  useEffect(() => {
    /*
     * Keyboard input is not passive, so no
     * passive option is added to this listener.
     */
    window.addEventListener(
      "keydown",
      beginInteraction,
    );

    window.addEventListener(
      "pointerdown",
      beginInteraction,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "touchstart",
      beginInteraction,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "wheel",
      beginInteraction,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "scroll",
      beginInteraction,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "keydown",
        beginInteraction,
      );

      window.removeEventListener(
        "pointerdown",
        beginInteraction,
      );

      window.removeEventListener(
        "touchstart",
        beginInteraction,
      );

      window.removeEventListener(
        "wheel",
        beginInteraction,
      );

      window.removeEventListener(
        "scroll",
        beginInteraction,
      );

      if (
        interactionTimeoutRef.current
      ) {
        window.clearTimeout(
          interactionTimeoutRef.current,
        );

        interactionTimeoutRef.current =
          null;
      }
    };
  }, [beginInteraction]);

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-0
          pointer-events-none
        "
        aria-hidden="true"
        data-quality-profile={
          quality.profile
        }
        data-interacting={
          isInteracting
            ? "true"
            : "false"
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
            failIfMajorPerformanceCaveat:
              false,
          }}
          performance={{
            min: 0.5,
            max: 1,
            debounce: 250,
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
              1,
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

      {isVisible &&
        !isInteracting &&
        quality.motionEnabled && (
          <ShootingStars
            isMobile={
              quality.isMobile
            }
            qualityLevel={
              quality.level
            }
            motionEnabled={
              quality.motionEnabled
            }
          />
        )}
    </>
  );
}

export default CinematicEnvironment;
