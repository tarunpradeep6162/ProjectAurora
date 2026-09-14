"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import CosmicMoon from "./Moon";
import CosmicNebula from "./Nebula";
import CosmicStarField from "./StarField";
import CoupleModel from "./CoupleModel";
import TarunRunner from "./TarunRunner";
import { useSceneProgress, type SceneProgressRef } from "./sceneProgress";
import { chapterAnchor, createGradeSample, sampleGrade } from "./grade";
import { chapters } from "@/lib/content";

/* ------------------------------------------------------------------------
   Quality tiers
   ------------------------------------------------------------------------ */

/**
 * Chosen by CosmicBackdrop from viewport + input + device signals. Devices
 * too weak for any of these never mount the canvas at all — the CSS sky in
 * CosmicAtmosphere is the fourth, low-power tier.
 */
export type CosmicTier = "high" | "medium" | "low";

type Quality = {
  /** [min, max] device-pixel-ratio clamp handed to R3F. */
  dpr: [number, number];
  stars: number;
  nebulaOctaves: number;
  nebulaWarp: boolean;
  moonSegments: number;
  antialias: boolean;
};

const QUALITY: Record<CosmicTier, Quality> = {
  // Desktop.
  high: {
    dpr: [1, 1.5],
    stars: 2100,
    nebulaOctaves: 5,
    nebulaWarp: true,
    moonSegments: 48,
    antialias: true,
  },
  // Tablet.
  medium: {
    dpr: [1, 1.35],
    stars: 1400,
    nebulaOctaves: 4,
    nebulaWarp: false,
    moonSegments: 32,
    antialias: true,
  },
  // Phone: roughly 40% of the desktop star budget and the cheapest nebula,
  // on a DPR cap that keeps a 3x screen from filling 9x the pixels.
  low: {
    dpr: [1, 1.25],
    stars: 850,
    nebulaOctaves: 3,
    nebulaWarp: false,
    moonSegments: 24,
    antialias: false,
  },
};

/**
 * Runtime fallback ladder, applied one step at a time only if frames stay
 * over budget: DPR first, then nebula complexity, then star count — the
 * order the brief sets. (StarField's foreground bokeh is not separately
 * controllable from outside that component, so that rung is folded into the
 * star-count step.) Photographs are DOM images and are never touched.
 */
const MAX_DEGRADE = 3;

function effectiveQuality(tier: CosmicTier, degrade: number): Quality {
  const q = QUALITY[tier];
  return {
    ...q,
    dpr: degrade >= 1 ? [1, 1] : q.dpr,
    nebulaOctaves: degrade >= 2 ? Math.max(2, q.nebulaOctaves - 1) : q.nebulaOctaves,
    nebulaWarp: degrade >= 2 ? false : q.nebulaWarp,
    stars: degrade >= 3 ? Math.round(q.stars * 0.65) : q.stars,
  };
}

/* ------------------------------------------------------------------------
   Camera arc
   ------------------------------------------------------------------------ */

type CameraKey = {
  chapter: string;
  /** Position. The starfield is centred on (0, 0, -20); its dust shell's near edge is at z ≈ 6. */
  x: number;
  y: number;
  z: number;
  /** Degrees. Positive yaw turns toward -X (the galactic core side); positive pitch looks up. */
  yaw: number;
  pitch: number;
  /** Vertical field of view, degrees. */
  fov: number;
  /** 0-1 amplitude of idle float and pointer parallax — how "alive" the camera is. */
  drift: number;
};

/**
 * The whole site's camera, as one authored table. Each key is held at the
 * moment its chapter's content is centred (`chapterAnchor`, the same anchor
 * the colour grade uses) and the camera moves between keys on a monotone
 * cubic curve — continuous velocity, and no overshoot, so travel never
 * reverses between two keys that both move forward.
 *
 * Z only ever decreases: the visitor is always travelling inward. Total
 * travel is ~6.4 units across a ~14,000px page, X never leaves ±0.35, Y
 * rises ~1.2, rotation stays within a few degrees, and there is no roll.
 */
const CAMERA_KEYS: CameraKey[] = [
  // Floating at the galaxy's edge, just outside the dust shell.
  { chapter: "portal", x: 0, y: 0, z: 9, yaw: 0, pitch: 0.6, fov: 50, drift: 1 },
  // Moving inward through the early memories.
  { chapter: "miracle", x: 0.18, y: 0.12, z: 8, yaw: 0.8, pitch: 0.8, fov: 50, drift: 0.85 },
  // Denser: crossing into the dust shell through the timeline.
  { chapter: "story", x: 0.32, y: 0.28, z: 6.8, yaw: 1.6, pitch: 1, fov: 49, drift: 0.75 },
  // The deepest forward travel of the arc. (Kept far enough back that the
  // couple figure's staging, tuned for a camera ~8 units out, still reads
  // as small against the sky.)
  { chapter: "journey", x: 0.3, y: 0.4, z: 5.2, yaw: 1, pitch: 0.4, fov: 50, drift: 0.7 },
  // Settling among the remembered stars while the photographs play.
  { chapter: "memories", x: 0.12, y: 0.52, z: 4.2, yaw: 0.4, pitch: 0.6, fov: 49, drift: 0.4 },
  // Motion nearly stopped for the letter.
  { chapter: "letter", x: -0.02, y: 0.58, z: 3.8, yaw: 0.2, pitch: 0.5, fov: 47.5, drift: 0.12 },
  // The cosmos almost gone around the flame (brightness via grade.ts `quiet`).
  { chapter: "birthday", x: -0.04, y: 0.6, z: 3.6, yaw: 0, pitch: 0.3, fov: 47, drift: 0.08 },
  // Opening wider than ever: a lift, a slight turn toward the core, a wider lens.
  { chapter: "finale", x: 0, y: 1.2, z: 2.6, yaw: 2.2, pitch: 3.5, fov: 54, drift: 0.6 },
];

const CHANNELS = ["x", "y", "z", "yaw", "pitch", "fov", "drift"] as const;
type Channel = (typeof CHANNELS)[number];
type Pose = Record<Channel, number>;

const RESOLVED_KEYS = CAMERA_KEYS.map((key) => ({
  key,
  index: chapters.findIndex((c) => c.id === key.chapter),
}))
  .filter((k) => k.index !== -1)
  .map((k) => ({ key: k.key, at: chapterAnchor(k.index) }))
  .sort((a, b) => a.at - b.at);

const KEY_T = RESOLVED_KEYS.map((k) => k.at);

/** Fritsch–Carlson monotone cubic tangents, with flat ends so the arc eases in and out. */
function monotoneTangents(ts: number[], vs: number[]): number[] {
  const n = ts.length;
  const m = new Array<number>(n).fill(0);
  if (n < 2) return m;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / Math.max(1e-9, ts[i + 1] - ts[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }
  return m;
}

const SPLINES = CHANNELS.map((ch) => {
  const values = RESOLVED_KEYS.map((k) => k.key[ch]);
  return { values, tangents: monotoneTangents(KEY_T, values) };
});

/** Evaluate every channel of the arc at a story position into `out`. Allocation-free. */
function sampleCameraArc(position: number, out: Pose) {
  const n = KEY_T.length;
  if (n === 0) return;
  const t = Math.min(KEY_T[n - 1], Math.max(KEY_T[0], position));
  let i = 0;
  while (i < n - 2 && t > KEY_T[i + 1]) i++;
  const j = Math.min(n - 1, i + 1);
  const h = Math.max(1e-9, KEY_T[j] - KEY_T[i]);
  const s = i === j ? 0 : Math.min(1, Math.max(0, (t - KEY_T[i]) / h));
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  for (let c = 0; c < CHANNELS.length; c++) {
    const { values, tangents } = SPLINES[c];
    out[CHANNELS[c]] =
      h00 * values[i] + h10 * h * tangents[i] + h01 * values[j] + h11 * h * tangents[j];
  }
}

const DEG = Math.PI / 180;

/**
 * Moves the camera along the authored arc. The arc gives a *target*; the
 * camera approaches it with exponential, frame-rate-independent damping
 * (position ~0.9s, orientation and lens ~1.2s), so a chapter-nav jump or a
 * fast fling of the scroll wheel becomes a glide rather than a cut.
 *
 * On top of that, a very small idle float and (mouse only) pointer parallax,
 * both scaled by the key's `drift` so they fade to almost nothing for the
 * letter and the candle. Both are pure translation — the look direction is
 * offset with the camera — so neither ever rotates the view.
 *
 * R3F's own `pointer` is not used: the canvas is `pointer-events: none`, so
 * it never receives pointer events and that value never changes.
 */
function CameraRig({
  progressRef,
  pointerParallax,
}: {
  progressRef: RefObject<SceneProgressRef>;
  pointerParallax: boolean;
}) {
  const targetRef = useRef<Pose | null>(null);
  const currentRef = useRef<(Pose & { ready: boolean }) | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const timeRef = useRef(0);
  if (targetRef.current === null) {
    targetRef.current = { x: 0, y: 0, z: 9, yaw: 0, pitch: 0, fov: 50, drift: 1 };
  }
  if (currentRef.current === null) {
    currentRef.current = { x: 0, y: 0, z: 9, yaw: 0, pitch: 0, fov: 50, drift: 1, ready: false };
  }

  useEffect(() => {
    if (!pointerParallax) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = pointerRef.current;
      p.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      p.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointerParallax]);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const target = targetRef.current;
    const cur = currentRef.current;
    if (!target || !cur) return;
    const camera = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(delta, 0.1);

    sampleCameraArc(progressRef.current.storyPosition, target);

    if (!cur.ready) {
      for (const ch of CHANNELS) cur[ch] = target[ch];
      cur.ready = true;
    } else {
      const kPos = 1 - Math.exp(-dt / 0.9);
      const kRot = 1 - Math.exp(-dt / 1.2);
      cur.x += (target.x - cur.x) * kPos;
      cur.y += (target.y - cur.y) * kPos;
      cur.z += (target.z - cur.z) * kPos;
      cur.yaw += (target.yaw - cur.yaw) * kRot;
      cur.pitch += (target.pitch - cur.pitch) * kRot;
      cur.fov += (target.fov - cur.fov) * kRot;
      cur.drift += (target.drift - cur.drift) * kRot;
    }

    const p = pointerRef.current;
    const kPointer = 1 - Math.exp(-dt / 0.6);
    p.sx += (p.x - p.sx) * kPointer;
    p.sy += (p.y - p.sy) * kPointer;

    timeRef.current += dt;
    const t = timeRef.current;
    const drift = cur.drift;
    // Idle float: incommensurate ~31s / ~23s periods, a few centimetres.
    const ox = (Math.sin(t * 0.2027) * 0.06 + p.sx * 0.18) * drift;
    const oy = (Math.sin(t * 0.2732 + 1.3) * 0.045 + p.sy * 0.1) * drift;

    const px = cur.x + ox;
    const py = cur.y + oy;
    const pz = cur.z;
    camera.position.set(px, py, pz);

    const yaw = cur.yaw * DEG;
    const pitch = cur.pitch * DEG;
    const cosPitch = Math.cos(pitch);
    camera.lookAt(
      px - Math.sin(yaw) * cosPitch * 20,
      py + Math.sin(pitch) * 20,
      pz - Math.cos(yaw) * cosPitch * 20
    );

    if (camera.isPerspectiveCamera && Math.abs(camera.fov - cur.fov) > 1e-3) {
      camera.fov = cur.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/* ------------------------------------------------------------------------
   Atmosphere + frame budget
   ------------------------------------------------------------------------ */

/**
 * The scene's depth fog, tinted from the *same* per-chapter grading table
 * that drives the CSS sky (grade.ts). Sharing one source of truth is the
 * point: the canvas and the CSS layer behind it are always the same colour
 * as each other, so the WebGL layer reads as depth inside the sky rather
 * than as a separate tinted pane floating over it — and the transition from
 * one to the other on context loss is invisible.
 *
 * One damped colour per frame, sampled without allocating.
 */
function DepthAtmosphere({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const fogRef = useRef<THREE.Fog>(null);
  const target = useRef<THREE.Color | null>(null);
  const sample = useRef<ReturnType<typeof createGradeSample> | null>(null);
  if (target.current === null) target.current = new THREE.Color();
  if (sample.current === null) sample.current = createGradeSample();

  useFrame((_, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const fog = fogRef.current;
    const mixed = target.current;
    const g = sample.current;
    if (!fog || !mixed || !g) return;
    sampleGrade(progressRef.current.storyPosition, g);
    mixed.setRGB(g.baseR / 255, g.baseG / 255, g.baseB / 255, THREE.SRGBColorSpace);
    // Damped rather than assigned, so even a sudden scroll jump (a chapter
    // nav jump, an anchor link) arrives at the new grade over about half a
    // second instead of cutting to it — at any frame rate.
    fog.color.lerp(mixed, 1 - Math.exp(-Math.min(delta, 0.1) * 2.4));
  });

  return <fog ref={fogRef} attach="fog" args={["#050406", 18, 60]} />;
}

/**
 * Watches steady-state frame time and asks for one step down the quality
 * ladder when it stays over budget. Ignores the first seconds (shader
 * compilation, model decode), single long stalls (tab switches, GC), and
 * hidden tabs; waits between steps so each one can take effect. The
 * threshold sits just below 30fps so a display or battery mode that caps at
 * a clean 30Hz is not mistaken for a struggling GPU.
 */
function FrameBudget({ onOverBudget }: { onOverBudget: () => void }) {
  const acc = useRef({ warm: 0, time: 0, frames: 0, cooldown: 0 });

  useFrame((_, delta) => {
    const a = acc.current;
    if ((typeof document !== "undefined" && document.hidden) || delta > 0.25) {
      a.time = 0;
      a.frames = 0;
      return;
    }
    if (a.warm < 4) {
      a.warm += delta;
      return;
    }
    if (a.cooldown > 0) {
      a.cooldown -= delta;
      return;
    }
    a.time += delta;
    a.frames += 1;
    if (a.time >= 2.5) {
      const average = a.time / a.frames;
      a.time = 0;
      a.frames = 0;
      if (average > 1 / 29) {
        a.cooldown = 3;
        onOverBudget();
      }
    }
  });

  return null;
}

/**
 * Mirrors the effective quality onto the canvas element as data attributes
 * (`data-tier`, `data-dpr`, `data-stars`, `data-nebula`, `data-degrade`) so
 * tiering and the fallback ladder can be checked from devtools on a real
 * device. Re-renders only when the resolved DPR or the quality inputs change.
 */
function QualityStamp({
  tier,
  quality,
  degrade,
}: {
  tier: CosmicTier;
  quality: Quality;
  degrade: number;
}) {
  const get = useThree((s) => s.get);
  const dpr = useThree((s) => s.viewport.dpr);
  const { stars, nebulaOctaves, nebulaWarp } = quality;
  const [dprMin, dprMax] = quality.dpr;

  useEffect(() => {
    const canvas = get().gl.domElement;
    canvas.setAttribute("data-tier", tier);
    canvas.setAttribute("data-dpr", `${dpr} (cap ${dprMin}-${dprMax})`);
    canvas.setAttribute("data-stars", String(stars));
    canvas.setAttribute("data-nebula", `${nebulaOctaves}${nebulaWarp ? "+warp" : ""}`);
    canvas.setAttribute("data-degrade", String(degrade));
  }, [get, tier, dpr, dprMin, dprMax, stars, nebulaOctaves, nebulaWarp, degrade]);

  return null;
}

/* ------------------------------------------------------------------------
   Scene
   ------------------------------------------------------------------------ */

function Universe({
  progressRef,
  tier,
  quality,
  degrade,
  pointerParallax,
  onOverBudget,
}: {
  progressRef: RefObject<SceneProgressRef>;
  tier: CosmicTier;
  quality: Quality;
  degrade: number;
  pointerParallax: boolean;
  onOverBudget: () => void;
}) {
  return (
    <>
      <QualityStamp tier={tier} quality={quality} degrade={degrade} />
      {/* Scene lights now only affect the couple figure — the moons and the
          nebula are self-shaded — so these are staged for people, not for
          the sky. */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[6, 8, 4]} intensity={0.55} color="#e8dce4" />
      <pointLight position={[-8, -2, -6]} intensity={6} color="#8c526e" distance={30} />
      <DepthAtmosphere progressRef={progressRef} />
      <CosmicStarField count={quality.stars} progressRef={progressRef} />
      <CosmicNebula
        progressRef={progressRef}
        octaves={quality.nebulaOctaves}
        warp={quality.nebulaWarp}
      />
      <CosmicMoon progressRef={progressRef} segments={quality.moonSegments} />
      <CosmicMoon
        variant="secondary"
        progressRef={progressRef}
        segments={Math.max(16, Math.round(quality.moonSegments * 0.66))}
      />
      <CoupleModel progressRef={progressRef} />
      <TarunRunner progressRef={progressRef} />
      <CameraRig progressRef={progressRef} pointerParallax={pointerParallax} />
      <FrameBudget onOverBudget={onOverBudget} />
    </>
  );
}

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

/**
 * The actual R3F canvas contents — only ever mounted client-side (via
 * `next/dynamic(..., { ssr: false })` from CosmicBackdrop) since WebGL has
 * no server-side equivalent. Kept dependency-light on purpose: no
 * `@react-three/postprocessing` bloom/vignette pass — the project's existing
 * CSS `.vignette` / `.film-grain` overlays already provide that finish for
 * a fraction of the GPU cost, and with no bloom pass nothing on the page
 * (text, photographs, UI — all DOM above the canvas) can ever bloom.
 */
export default function CosmicScene({
  tier = "high",
  pointerParallax = true,
  onReady,
  onContextLost,
}: {
  tier?: CosmicTier;
  /** Mouse parallax; off for touch-primary devices. */
  pointerParallax?: boolean;
  onReady?: () => void;
  onContextLost?: () => void;
}) {
  useResizeObserverFallback();
  const progressRef = useSceneProgress();
  // Changes at most MAX_DEGRADE times per visit — never per frame.
  const [degrade, setDegrade] = useState(0);
  const onOverBudget = useCallback(() => {
    setDegrade((level) => Math.min(MAX_DEGRADE, level + 1));
  }, []);
  const quality = effectiveQuality(tier, degrade);
  const first = CAMERA_KEYS[0];

  return (
    <Canvas
      dpr={quality.dpr}
      // The wrapper is already `pointer-events: none`, but that is not
      // enough on its own: `pointer-events` is inherited-through rather
      // than enforced, and a descendant setting `auto` still receives
      // events. React Three Fiber's canvas does exactly that, which left
      // this full-viewport element sitting over every heading, paragraph
      // and link on the site and swallowing text selection. Setting it
      // explicitly on the canvas itself is what actually makes the backdrop
      // non-interactive.
      style={{ pointerEvents: "none" }}
      camera={{ position: [first.x, first.y, first.z], fov: first.fov, near: 0.1, far: 200 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: tier === "low" ? "default" : "high-performance",
      }}
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
        <Universe
          progressRef={progressRef}
          tier={tier}
          quality={quality}
          degrade={degrade}
          pointerParallax={pointerParallax}
          onOverBudget={onOverBudget}
        />
      </Suspense>
    </Canvas>
  );
}
