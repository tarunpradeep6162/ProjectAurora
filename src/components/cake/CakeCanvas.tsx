"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import Cake from "./Cake";
import CakeCandles from "./CakeCandles";
import Confetti from "./Confetti";
import ShapeBursts from "./ShapeBursts";
import {
  blowOut,
  createCakeMotion,
  ENTRANCE_SECONDS,
  FULLY_LIT_PROGRESS,
  keyframes,
  stageCake,
  type CakeMotion,
} from "./cakeMotion";
import { installChimeUnlock, updateChime } from "./birthdayChime";
import { isSiteAudioOn } from "@/lib/audioPreference";

export type CakePhase = "lit" | "out" | "dark" | "stars" | "universe" | "revealed";

/**
 * How bright the cake stays through the chapter's choreography: fully lit
 * while the candles burn and go out, a faint ghost in the held darkness, then
 * some of it back once the sky returns. The frosting is near-white, so it
 * takes a much lower level than the CSS candle's wax to read as "almost dark".
 */
const DIM: Record<CakePhase, number> = {
  lit: 1,
  out: 1,
  dark: 0.06,
  stars: 0.06,
  universe: 0.36,
  revealed: 0.36,
};

/** Reflections for the gold plate, ribbon and plaque; metals read black without them. */
const ENVIRONMENT_INTENSITY = 0.3;
/**
 * Measured, not guessed: at 1.0 the frosting sat at a median luminance of
 * 222/255 with 14% of it near white, flat and glaring on a near-black page.
 * At 0.65 the median is 170 and the tiers keep their shape, with only the
 * highlights under the flames still reaching white.
 */
const EXPOSURE = 0.65;
const AMBIENT_INTENSITY = 0.25;

/**
 * The chime's "sparkle" tier (see birthdayChime.ts): silent until the flames
 * are out and smoke is rising, then rises to carry through the held
 * darkness, holds through the return of the sky, and only much later (a
 * visitor who lingers well past the finale) recedes.
 */
const CHIME_SPARKLE: readonly (readonly [number, number])[] = [
  [0, 0],
  [1.2, 0],
  [3, 1],
  [20, 1],
  [35, 0.3],
];

/** Framed so the whole cake sits inside the square with headroom for the smoke. */
const CAMERA_POSITION: [number, number, number] = [0, 1.9, 6.6];
const CAMERA_TARGET = new THREE.Vector3(0, -0.55, 0);
const CAMERA_FOV = 38;

/** Soft room reflections and a cool night fill, both following the chapter's dimming. */
function Studio({ motion }: { motion: RefObject<CakeMotion> }) {
  const get = useThree((s) => s.get);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = environment;
    scene.environmentIntensity = ENVIRONMENT_INTENSITY;
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [get]);

  useFrame((state) => {
    const dim = motion.current.dim;
    state.scene.environmentIntensity = ENVIRONMENT_INTENSITY * dim;
    if (ambientRef.current) ambientRef.current.intensity = AMBIENT_INTENSITY * dim;
  });

  return <ambientLight ref={ambientRef} color="#8f9bb3" intensity={AMBIENT_INTENSITY} />;
}

/** Everything inside the canvas: usable with any `<Canvas>`. */
export function CakeWorld({
  phase,
  reduced,
  compact,
  name,
}: {
  phase: CakePhase;
  reduced: boolean;
  compact: boolean;
  name: string;
}) {
  // Written only here; everything below reads it.
  const motion = useRef<CakeMotion>(createCakeMotion());
  const dimTarget = useRef(DIM[phase]);

  useEffect(() => {
    dimTarget.current = DIM[phase];
    const m = motion.current;
    if (phase !== "lit" && m.elapsed === null) {
      // Blown out before the entrance finished: bring the cake up with every
      // candle lit, so the wish always has flames to put out.
      m.progress = Math.max(m.progress, FULLY_LIT_PROGRESS);
      m.elapsed = 0;
    }
  }, [phase]);

  // A passive, page-level "start the chime on the first real gesture"
  // listener (see birthdayChime.ts) — installed once the cake is actually
  // relevant rather than from the moment the page loads.
  useEffect(() => {
    installChimeUnlock();
  }, []);

  // Priority -1 runs this before anything that reads the motion this frame.
  useFrame((_, rawDelta) => {
    // A frame arriving after the canvas was paused off screen must not jump
    // the entrance forward.
    const delta = Math.min(rawDelta, 0.05);
    const m = motion.current;
    if (m.progress < 1) m.progress = Math.min(1, m.progress + delta / ENTRANCE_SECONDS);
    stageCake(m.progress, reduced, m);
    if (m.elapsed !== null) m.elapsed += delta;
    blowOut(m.elapsed, reduced, m);
    m.dim += (dimTarget.current - m.dim) * Math.min(1, delta * 1.6);

    if (!reduced) {
      const deep = Math.min(1, Math.max(0, (m.progress - 0.5) / 0.25));
      const celebrate = m.elapsed === null ? 0 : keyframes(m.elapsed, CHIME_SPARKLE);
      updateChime(
        {
          approach: m.present,
          deep,
          celebrate,
          brightness: m.dim,
          audible: isSiteAudioOn(),
        },
        delta
      );
    }
  }, -1);

  return (
    <>
      <Studio motion={motion} />
      <Cake motion={motion} reduced={reduced} name={name}>
        <CakeCandles motion={motion} reduced={reduced} count={compact ? 5 : 7} />
      </Cake>
      {/* The post-wish celebration: absent until the candles have actually
          been blown out (`elapsed` stays null until then), so it never
          appears while the candles are still lit. */}
      <ShapeBursts motion={motion} reduced={reduced} compact={compact} />
      <Confetti motion={motion} reduced={reduced} compact={compact} />
    </>
  );
}

/** Same fallback as the cosmic canvas: re-measure without trusting ResizeObserver. */
function useResizeObserverFallback() {
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    fire();
    const id = window.setTimeout(fire, 400);
    return () => window.clearTimeout(id);
  }, []);
}

/**
 * The birthday cake from the original Project Aurora, in its own small canvas
 * inside the candle chapter. Rendering stops entirely while the chapter is off
 * screen. The accessible control is the button laid over it, which is also
 * the pointer source the flames lean toward.
 */
export default function CakeCanvas({
  phase,
  visible,
  reduced,
  compact,
  name,
  eventSource,
  onContextLost,
}: {
  phase: CakePhase;
  visible: boolean;
  reduced: boolean;
  compact: boolean;
  name: string;
  eventSource: RefObject<HTMLElement | null>;
  onContextLost: () => void;
}) {
  useResizeObserverFallback();

  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={compact ? [1, 1.25] : [1, 1.5]}
      style={{ pointerEvents: "none" }}
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="offset"
      onCreated={({ gl, camera }) => {
        camera.lookAt(CAMERA_TARGET);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = EXPOSURE;
        gl.setClearAlpha(0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onContextLost();
          },
          { once: true }
        );
      }}
    >
      <CakeWorld phase={phase} reduced={reduced} compact={compact} name={name} />
    </Canvas>
  );
}
