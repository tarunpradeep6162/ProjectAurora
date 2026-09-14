"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fitModelToHeight } from "./fitModel";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";

// Expected drop-in location for the externally generated couple figure —
// see public/models/ (created empty on purpose): place the real, generated
// model at `public/models/couple.glb`. Nothing in this file requires that
// file to exist; every path below resolves to "render nothing" rather than
// crash if it's missing.
const MODEL_URL = "/models/couple.glb";

// The couple figure surfaces specifically in "The journey between us"
// (content.ts chapter id "journey") — its hidden message, "a glowing path
// of memories, growth and choosing each other," is exactly what a couple
// drifting through the cosmic backdrop is meant to visualize.
const COUPLE_CHAPTER_ID = "journey";

// Starting points for staging, deliberately expressed as named constants so
// they can be corrected in one line each once a real file exists to look at.
// TARGET_HEIGHT is in the scene's world units, which this project treats as
// roughly metres (the camera sits 8 units back with a 50° FOV), so ~1.7 reads
// as believable human scale rather than a figurine or a giant beside the moon.
const TARGET_HEIGHT = 1.7;
// Placed off-centre and below the horizon line: rule-of-thirds composition,
// small against a large cosmic environment, per the brief's staging notes.
const PLACEMENT = new THREE.Vector3(1.1, -1.15, -4.2);
// `null` = trust the bounding-box heuristic in fitModel.ts. Set to a number
// (radians) to override it outright once the real model can be inspected.
const ORIENTATION_OVERRIDE: number | null = null;

/**
 * Module-level cache keyed by URL. The loader is shared across mounts so
 * scrolling away from the Journey chapter and back never re-fetches or
 * re-parses the model, and a failure is remembered rather than retried in a
 * loop. Holding the promise (not just the result) also collapses two mounts
 * racing during a fast-refresh into a single network request.
 */
const modelCache = new Map<string, Promise<GLTF>>();

function loadModel(url: string): Promise<GLTF> {
  const cached = modelCache.get(url);
  if (cached) return cached;
  const promise = new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().load(url, resolve, undefined, reject);
  });
  modelCache.set(url, promise);
  return promise;
}

type LoadState = { status: "error" } | { status: "loaded"; gltf: GLTF };

/**
 * Waits until the Journey chapter is *approaching* before fetching, so a
 * multi-megabyte model can never compete with the opening portal for
 * bandwidth or become LCP-critical. An IntersectionObserver with a generous
 * root margin gives roughly two viewports of runway — enough that the model
 * is normally decoded before it is ever needed, without a spinner if it
 * isn't (the cosmic scene simply carries on and the figure fades in late).
 *
 * One observer, no extra scroll listener: the shared `useSceneProgress` ref
 * intentionally never triggers React renders, so it cannot start a load on
 * its own, and adding a second scroll listener to work around that would
 * undercut the point of the shared tracker.
 *
 * The timer is a deliberate fallback, not belt-and-braces padding. This
 * project has already been bitten twice by host environments where a
 * callback-scheduling API silently never fires — `requestAnimationFrame`
 * (which produced the invisible-hero bug) and `ResizeObserver` (which left
 * the canvas stuck at 300x150, hence `useResizeObserverFallback` in
 * CosmicScene) — and `IntersectionObserver` was measured to be inert in that
 * same environment: present, observing a clearly-intersecting element, and
 * never invoking its callback once. Gating an asset purely on an observer
 * that may never speak would mean the figure simply never appears, with no
 * error to explain why. The asymmetry decides it: a needlessly early fetch
 * costs one request for an optional asset, a missed one costs the feature
 * entirely. The delay is long enough to stay clear of LCP and the opening
 * portal, so in any browser where the observer does work it always wins first.
 */
const NEAR_FALLBACK_MS = 6000;

function useNearChapter(chapterId: string, rootMargin: string): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = document.getElementById(chapterId);
    let observer: IntersectionObserver | undefined;

    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setNear(true);
        },
        { rootMargin }
      );
      observer.observe(el);
    }

    const fallback = window.setTimeout(() => setNear(true), NEAR_FALLBACK_MS);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, [chapterId, rootMargin]);

  return near;
}

function useCoupleGLTF(url: string, enabled: boolean): LoadState | null {
  // `null` means "nothing resolved yet" — there is deliberately no explicit
  // "loading" state to set synchronously inside the effect: the component
  // renders nothing while pending either way, and a visible loading state is
  // exactly what this integration must never produce.
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    loadModel(url).then(
      (gltf) => {
        if (!cancelled) setState({ status: "loaded", gltf });
      },
      () => {
        // Expected until the real file is placed at public/models/couple.glb
        // — deliberately not logged: a missing optional enhancement asset is
        // normal here, not a bug worth flagging on every reload.
        if (!cancelled) setState({ status: "error" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return state;
}

/**
 * Picks the clip most likely to be an ambient idle instead of assuming index
 * 0 — exporters order clips arbitrarily, and clip 0 is just as often a wave,
 * a walk cycle or a one-shot gesture, which would read as a conspicuous loop.
 * Name match first (the reliable signal when the rig is authored sensibly),
 * then longest duration as a proxy for "ambient rather than gesture", then
 * index 0 only as a last resort.
 */
function pickIdleClip(clips: THREE.AnimationClip[]): THREE.AnimationClip | null {
  if (clips.length === 0) return null;
  const byName = clips.find((c) => /idle|breath|stand|loop|ambient/i.test(c.name));
  if (byName) return byName;
  return clips.reduce((longest, c) => (c.duration > longest.duration ? c : longest));
}

/**
 * Staging curve for the Journey chapter, returning how *present* the figures
 * are (opacity) and how *lit* they are (silhouette → rim → warm), driven by
 * progress through that chapter alone. They emerge as shapes, resolve into
 * two recognisable people at the emotional peak, then recede to silhouette
 * before the chapter hands off — so the reveal is a moment rather than a
 * model that is simply switched on.
 */
function stageJourney(p: number): { presence: number; illumination: number } {
  const presence =
    THREE.MathUtils.smoothstep(p, 0.08, 0.28) *
    (1 - THREE.MathUtils.smoothstep(p, 0.86, 1));
  const illumination =
    THREE.MathUtils.smoothstep(p, 0.24, 0.66) *
    (1 - THREE.MathUtils.smoothstep(p, 0.8, 0.96));
  return { presence, illumination };
}

/**
 * Soft elliptical contact shadow — a single unlit plane with a radial falloff
 * in the fragment shader, not a shadow map. It exists only to stop the
 * figures reading as pasted onto the starfield; a real-time shadow pass would
 * cost far more and look harsher than this against an environment that has no
 * literal ground plane to receive it.
 */
function ContactShadow({ opacityRef }: { opacityRef: RefObject<number> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacityRef.current * 0.5;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[2.6, 1.6]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float falloff = 1.0 - smoothstep(0.0, 1.0, d);
            gl_FragColor = vec4(0.0, 0.0, 0.0, falloff * falloff * uOpacity);
          }
        `}
      />
    </mesh>
  );
}

function LoadedCoupleModel({
  gltf,
  progressRef,
}: {
  gltf: GLTF;
  progressRef: RefObject<SceneProgressRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  // Materials collected once at load; walking the whole scene graph every
  // frame purely to write an opacity would be wasted work on every frame the
  // figure is on screen.
  const materialsRef = useRef<THREE.Material[]>([]);
  const presenceRef = useRef(0);
  const [fit] = useState(() => fitModelToHeight(gltf.scene, TARGET_HEIGHT));

  useEffect(() => {
    const materials: THREE.Material[] = [];
    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        list.forEach((m) => {
          // `transparent` up front so the figure can fade as one continuous
          // opacity rather than popping in solid at the chapter boundary.
          m.transparent = true;
          m.opacity = 0;
          materials.push(m);
        });
      }
    });
    materialsRef.current = materials;
  }, [gltf]);

  useEffect(() => {
    const clip = pickIdleClip(gltf.animations);
    if (!clip) return undefined;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    // Real human motion, not sped-up motion.
    action.timeScale = 1;
    action.fadeIn(1.2).play();
    mixerRef.current = mixer;
    return () => {
      action.stop();
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      mixerRef.current = null;
    };
  }, [gltf]);

  // NOTE ON DISPOSAL: the GLTF itself is deliberately *not* disposed here.
  // It lives in the module-level cache and may be reused by a later mount, so
  // freeing its geometries/materials/textures on unmount would be exactly the
  // "disposing shared resources still in use" failure mode to avoid. The only
  // GPU resources this component owns outright are the contact shadow's
  // geometry/material, which R3F disposes with the element that declares them.

  useFrame((state, delta) => {
    // A hidden tab should not keep advancing a skeletal animation; resuming
    // from where it paused also avoids the figure snapping to a new pose when
    // the visitor comes back.
    if (typeof document !== "undefined" && document.hidden) return;

    const progress = progressRef.current;
    const active = isChapterActive(progress, COUPLE_CHAPTER_ID);
    const { presence, illumination } = active
      ? stageJourney(progress.chapterProgress)
      : { presence: 0, illumination: 0 };

    presenceRef.current += (presence - presenceRef.current) * Math.min(1, delta * 1.5);
    const shown = presenceRef.current > 0.01;

    if (groupRef.current) groupRef.current.visible = shown;
    if (!shown) return;

    mixerRef.current?.update(delta);

    if (!mixerRef.current && innerRef.current) {
      // No usable clip on the asset (a static or unrigged mesh) — a breath,
      // not a bob: a slow ~6s cycle at a few millimetres of travel, well
      // inside the brief's ceiling. Deliberately no continuous rotation; a
      // turntable spin would read as a 3D viewer rather than a memory.
      const t = state.clock.elapsedTime;
      innerRef.current.position.y = Math.sin(t * ((Math.PI * 2) / 6)) * 0.012;
      innerRef.current.rotation.y = fit.yaw + Math.sin(t * ((Math.PI * 2) / 9)) * 0.006;
    }

    const materials = materialsRef.current;
    for (let i = 0; i < materials.length; i++) {
      materials[i].opacity = presenceRef.current;
    }

    // Light story: silhouette first, warm gold edge rising through the
    // chapter, cool night fill lifting the shadow side just enough to keep
    // faces readable without looking stage-lit.
    if (keyLightRef.current) keyLightRef.current.intensity = illumination * 6;
    if (fillLightRef.current) fillLightRef.current.intensity = illumination * 1.6;
    if (rimLightRef.current) {
      rimLightRef.current.intensity = (0.25 + illumination * 0.75) * 4;
    }
  });

  return (
    <group ref={groupRef} position={PLACEMENT} visible={false}>
      {/* Warm rose-gold key/rim, the site's Aurora accent — distance-limited
          so it lights the figures without spilling onto the moons or nebula. */}
      <pointLight
        ref={keyLightRef}
        position={[1.6, 1.9, 1.4]}
        color="#b6738f"
        intensity={0}
        distance={9}
        decay={2}
      />
      {/* Cool night fill: desaturated violet, never a saturated colour wash. */}
      <pointLight
        ref={fillLightRef}
        position={[-1.8, 1.1, 1.2]}
        color="#5c5470"
        intensity={0}
        distance={8}
        decay={2}
      />
      {/* Celestial backlight, separating shoulders from the starfield. */}
      <pointLight
        ref={rimLightRef}
        position={[-0.6, 1.7, -2.2]}
        color="#b6a4ca"
        intensity={0}
        distance={7}
        decay={2}
      />
      <ContactShadow opacityRef={presenceRef} />
      <group
        ref={innerRef}
        position={fit.offset}
        scale={fit.scale}
        rotation={[0, ORIENTATION_OVERRIDE ?? fit.yaw, 0]}
      >
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}

/**
 * Integration point for the externally generated couple figure — Tarun
 * supplies `public/models/couple.glb` separately from a real-photo reference
 * pipeline; nothing here generates or approximates it, and nothing here
 * restyles the people it contains. Scale, ground offset and orientation are
 * derived from the asset's own bounding box (see fitModel.ts) rather than
 * hand-tuned constants, so the scene adapts to the model instead of the model
 * being distorted to fit the scene.
 *
 * Renders `null` for every state except a successful load, so a missing or
 * broken file is completely inert: no thrown error, no permanent loading
 * state, no spinner, no visible gap in the rest of the cosmic scene.
 */
export default function CoupleModel({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const near = useNearChapter(COUPLE_CHAPTER_ID, "200% 0px");
  const state = useCoupleGLTF(MODEL_URL, near);
  if (state?.status !== "loaded") return null;
  return <LoadedCoupleModel gltf={state.gltf} progressRef={progressRef} />;
}
