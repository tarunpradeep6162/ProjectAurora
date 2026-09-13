"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import CosmicMoon from "./Moon";
import CosmicNebula from "./Nebula";
import CosmicStarField from "./StarField";
import CoupleModel from "./CoupleModel";
import { useSceneProgress, type SceneProgressRef } from "./sceneProgress";
import { gradeAt } from "./grade";

/**
 * The camera's forward drift through the scene, driven by the shared
 * `useSceneProgress` ref (see sceneProgress.ts) rather than its own scroll
 * listener now that the backdrop spans the whole site: `overall` is already
 * a whole-document scroll fraction, so this keeps working unchanged now
 * that the canvas persists behind every chapter instead of only the portal.
 */
function CameraDrift({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const { camera, pointer } = useThree();
  // Lazily-initialized ref, not `useMemo` — its components are reassigned
  // every frame in `useFrame` below, and a `useMemo` value is treated as
  // immutable by this project's stricter hooks lint.
  const targetRef = useRef<THREE.Vector3 | null>(null);
  if (targetRef.current === null) {
    targetRef.current = new THREE.Vector3();
  }

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;
    const p = THREE.MathUtils.clamp(progressRef.current.overall, 0, 1);
    // One slow arc across the whole page rather than the four full
    // oscillations this used to make. At four the camera visibly swung back
    // and forth several times between chapters, which read as the scene
    // being busy rather than as travel; a single half-cycle just leans the
    // view gently across and never returns to where it started.
    target.set(
      pointer.x * 0.6 + Math.sin(p * Math.PI) * 0.55,
      pointer.y * 0.3 + p * 1.4,
      8 - p * 6
    );
    camera.position.lerp(target, 1 - Math.pow(0.0015, delta));
    camera.lookAt(0, p * 1.2, -10);
  });
  return null;
}

/**
 * The scene's depth fog, tinted from the *same* per-chapter grading table
 * that drives the CSS sky (grade.ts). Sharing one source of truth is the
 * point: the canvas and the CSS layer behind it are always the same colour
 * as each other, so the WebGL layer reads as depth inside the sky rather
 * than as a separate tinted pane floating over it — and the transition from
 * one to the other on context loss is invisible.
 *
 * Still one colour lerp per frame, no extra draw calls, and no
 * postprocessing pass, per the brief's performance guardrail.
 */
function DepthAtmosphere({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const fogRef = useRef<THREE.Fog>(null);
  const target = useRef<THREE.Color | null>(null);
  if (target.current === null) target.current = new THREE.Color();

  useFrame(() => {
    const fog = fogRef.current;
    const mixed = target.current;
    if (!fog || !mixed) return;
    const [r, g, b] = gradeAt(progressRef.current.storyPosition).baseRgb;
    mixed.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
    // Lerped rather than assigned, so even a sudden scroll jump (a chapter
    // nav jump, an anchor link) arrives at the new grade over about half a
    // second instead of cutting to it.
    fog.color.lerp(mixed, 0.04);
  });

  return <fog ref={fogRef} attach="fog" args={["#050506", 18, 60]} />;
}

function Universe({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  return (
    <>
      {/* Lighting pulled back across the board. At the previous levels the
          primary moon read as a bright white sphere and started competing
          with the photographs and headings in front of it; the moon is
          meant to be something you notice second, not first. */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[6, 8, 4]} intensity={0.55} color="#efe7d8" />
      <pointLight position={[-8, -2, -6]} intensity={6} color="#d7b97a" distance={30} />
      <DepthAtmosphere progressRef={progressRef} />
      <CosmicStarField progressRef={progressRef} />
      <CosmicNebula progressRef={progressRef} />
      <CosmicMoon />
      <CosmicMoon variant="secondary" progressRef={progressRef} />
      <CoupleModel progressRef={progressRef} />
      <CameraDrift progressRef={progressRef} />
    </>
  );
}

/**
 * The actual R3F canvas contents — only ever mounted client-side (via
 * `next/dynamic(..., { ssr: false })` from CosmicBackdrop) since WebGL has
 * no server-side equivalent. Kept dependency-light on purpose: no
 * `@react-three/postprocessing` bloom/vignette pass — the project's existing
 * CSS `.vignette` / `.film-grain` overlays already provide that finish for
 * a fraction of the GPU cost.
 */
/**
 * `@react-three/fiber`'s auto-resize relies on `ResizeObserver` to measure
 * the parent container. In at least one sandboxed preview environment we
 * tested in, `ResizeObserver` callbacks never fire at all, leaving the
 * canvas stuck at the browser's intrinsic 300x150 default forever — a
 * plain `window.resize` event is enough to make Fiber re-measure and
 * recover. Dispatching one on mount (and once more after the first paint,
 * in case layout — e.g. web fonts — shifts afterward) costs nothing in a
 * browser where ResizeObserver works correctly, and is a real fix, not a
 * workaround, anywhere it doesn't.
 */
function useResizeObserverFallback() {
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    fire();
    const id = window.setTimeout(fire, 400);
    return () => window.clearTimeout(id);
  }, []);
}

export default function CosmicScene({
  onReady,
  onContextLost,
}: {
  onReady?: () => void;
  onContextLost?: () => void;
}) {
  useResizeObserverFallback();
  const progressRef = useSceneProgress();
  return (
    <Canvas
      dpr={[1, 1.5]}
      // The wrapper is already `pointer-events: none`, but that is not
      // enough on its own: `pointer-events` is inherited-through rather
      // than enforced, and a descendant setting `auto` still receives
      // events. React Three Fiber's canvas does exactly that, which left
      // this full-viewport element sitting over every heading, paragraph
      // and link on the site and swallowing text selection. Setting it
      // explicitly on the canvas itself is what actually makes the backdrop
      // non-interactive.
      style={{ pointerEvents: "none" }}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
        gl.setClearAlpha(0);

        // Losing the GL context is not an error the visitor should ever be
        // told about. `preventDefault()` marks the loss as handled (so the
        // browser does not tear the canvas down as fatal), and the callback
        // hands the sky back to the CSS layer underneath. Nothing about the
        // story stops being readable.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onContextLost?.();
          },
          { once: true }
        );

        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <Universe progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
}
