"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fitModelToHeight } from "./fitModel";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { useNearChapter, useOptionalGLTF } from "./useOptionalGLTF";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

// See TARUN_RUNNER_IMPLEMENTATION.md for the full design notes. Expected
// drop-in location for a future identity-accurate model — nothing below
// requires this file to exist; every path resolves to "render nothing"
// rather than crash if it's missing, exactly like CoupleModel.tsx's
// couple.glb integration this was modeled on.
const MODEL_URL = "/models/tarun-runner.glb";
const JOURNEY_CHAPTER_ID = "journey";

// ~1.75 world units reads as human scale against this scene's camera (see
// CoupleModel.tsx's own TARGET_HEIGHT note — the same camera geometry
// applies here since both figures share the Journey chapter).
const TARGET_HEIGHT = 1.75;
// Lower-third, off-centre, closer to camera than the couple figure's staging
// depth so he reads as the foreground protagonist rather than another
// background element.
const PLACEMENT = new THREE.Vector3(-0.55, -1.35, -3.1);
// `null` would trust fitModel's bounding-box heuristic, but a roughly
// symmetric humanoid in a neutral pose doesn't reliably expose which way is
// forward from its box alone — this is a documented best guess (running away
// from camera, into the scene), not a measurement. Correct in one line once
// an identity-accurate model can actually be looked at.
const ORIENTATION_OVERRIDE: number | null = Math.PI;

type ClipName = "idle" | "walk" | "run";
// Physically-believable playback-rate ranges per clip, per the brief — scroll
// velocity picks a point inside these, never outside them.
const RATE_RANGE: Record<ClipName, [number, number]> = {
  idle: [0.85, 1.05],
  walk: [0.65, 0.9],
  run: [0.9, 1.25],
};
const CROSSFADE_SECONDS = 0.35;

function findClip(clips: THREE.AnimationClip[], patterns: RegExp[]): THREE.AnimationClip | null {
  for (const pattern of patterns) {
    const match = clips.find((c) => pattern.test(c.name));
    if (match) return match;
  }
  return null;
}

/**
 * Name-based discovery, never `animations[0]` — exporters order clips
 * arbitrarily. Falls back gracefully (see `resolveState`) when a name isn't
 * found rather than assuming every state exists.
 */
function discoverClips(
  clips: THREE.AnimationClip[]
): Partial<Record<ClipName, THREE.AnimationClip>> {
  const idle = findClip(clips, [/^idle$/i, /idle/i, /breath/i, /^stand$/i]);
  const walk = findClip(clips, [/^walk$/i, /walk/i, /jog/i]);
  const run = findClip(clips, [/^run$/i, /run/i, /sprint/i]);
  return {
    idle: idle ?? undefined,
    walk: walk ?? undefined,
    run: run ?? undefined,
  };
}

/**
 * If the desired state's clip doesn't exist, fall back to the closest one
 * that does, rather than freezing or throwing — "if only RUN exists, use it
 * gracefully" from the brief, generalized to any missing state.
 */
function resolveState(
  desired: ClipName,
  available: Partial<Record<ClipName, THREE.AnimationClip>>
): ClipName | null {
  const order: ClipName[] =
    desired === "run" ? ["run", "walk", "idle"] : desired === "walk" ? ["walk", "run", "idle"] : ["idle", "walk", "run"];
  for (const name of order) {
    if (available[name]) return name;
  }
  return null;
}

/**
 * Strips horizontal (X/Z) root translation from any position track in place,
 * leaving vertical bob untouched. The current placeholder is documented as
 * pure in-place locomotion already, so this is a no-op on it today — it
 * exists so a future real model with baked forward root motion can't
 * silently make Tarun drift through world space; the camera, path and
 * environment are what carry the sensation of travel (brief section 10).
 */
function neutralizeRootMotion(clip: THREE.AnimationClip) {
  for (const track of clip.tracks) {
    if (!track.name.toLowerCase().endsWith(".position")) continue;
    const values = track.values;
    for (let i = 0; i < values.length; i += 3) {
      values[i] = 0;
      values[i + 2] = 0;
    }
  }
}

/**
 * Journey progress (0-1 through the chapter) -> target animation state and a
 * base rate-range position within it. The exact breakpoints are the brief's
 * own suggested phase map, tuned visually rather than treated as exact:
 * distant/idle, walk in, steady run, strongest run, decelerate, stop.
 */
function journeyPhase(p: number): { state: ClipName; base: number } {
  if (p < 0.12) return { state: "idle", base: 0.2 };
  if (p < 0.25) return { state: "walk", base: (p - 0.12) / 0.13 };
  if (p < 0.6) return { state: "run", base: 0.4 };
  if (p < 0.78) return { state: "run", base: 0.4 + ((p - 0.6) / 0.18) * 0.6 };
  if (p < 0.9) return { state: "walk", base: 1 - (p - 0.78) / 0.12 };
  return { state: "idle", base: 0.15 };
}

/** Presence (opacity) curve — emerges early in the chapter, gone by its end, well clear of the Letter that follows. */
function stagePresence(p: number): number {
  return (
    THREE.MathUtils.smoothstep(p, 0.04, 0.14) *
    (1 - THREE.MathUtils.smoothstep(p, 0.88, 1))
  );
}

/**
 * Small, restrained trailing dust — not per-footstep accurate (the brief
 * explicitly allows skipping that complexity), just a believable drift that
 * responds to how fast he's moving. Geometry is built imperatively inside an
 * effect rather than a declarative buffer computed at render time, matching
 * StarField.tsx's own established pattern: seeding positions needs
 * `Math.random`, which the render-purity rule disallows calling during
 * render (including inside `useMemo`).
 */
function RunnerDust({ intensityRef, count }: { intensityRef: RefObject<number>; count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const seedsRef = useRef<Float32Array | null>(null);
  const phaseRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const seeds = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (Math.random() - 0.5) * 0.5;
      seeds[i * 3 + 1] = Math.random() * 0.35;
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 0.4 - 0.2;
      phase[i] = Math.random() * Math.PI * 2;
    }
    seedsRef.current = seeds;
    phaseRef.current = phase;
    const geometry = pointsRef.current?.geometry;
    if (geometry) {
      geometry.setAttribute("position", new THREE.BufferAttribute(seeds.slice(), 3));
    }
  }, [count]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    const seeds = seedsRef.current;
    const phase = phaseRef.current;
    if (!points || !seeds || !phase) return;
    const intensity = intensityRef.current;
    const mat = points.material as THREE.PointsMaterial;
    mat.opacity = intensity * 0.35;
    if (intensity < 0.01) return;
    const pos = points.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!pos) return;
    for (let i = 0; i < count; i++) {
      phase[i] += delta * (0.8 + intensity * 1.4);
      const y = seeds[i * 3 + 1] + Math.sin(phase[i]) * 0.05 + intensity * delta * 0.4;
      pos.setY(i, y > 0.5 ? 0 : y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, 0.02, 0.3]}>
      <bufferGeometry />
      <pointsMaterial
        size={0.02}
        color="#d7b97a"
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function LoadedTarunRunner({
  gltf,
  progressRef,
}: {
  gltf: GLTF;
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const dustCount = narrow || coarsePointer ? 0 : 36;

  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const materialsRef = useRef<THREE.Material[]>([]);
  const presenceRef = useRef(0);
  const intensityRef = useRef(0);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Partial<Record<ClipName, THREE.AnimationAction>>>({});
  const currentStateRef = useRef<ClipName | null>(null);
  const lastProgressRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  // Discovered once at load, not per frame — clip names never change for a
  // given asset, and re-running the regex scan every tick would be pure
  // waste inside useFrame.
  const clipsRef = useRef<Partial<Record<ClipName, THREE.AnimationClip>>>({});

  const [fit] = useState(() => fitModelToHeight(gltf.scene, TARGET_HEIGHT));

  useEffect(() => {
    const materials: THREE.Material[] = [];
    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        list.forEach((m) => {
          m.transparent = true;
          m.opacity = 0;
          materials.push(m);
        });
      }
    });
    materialsRef.current = materials;
  }, [gltf]);

  useEffect(() => {
    const clips = discoverClips(gltf.animations);
    clipsRef.current = clips;
    const foundNames = (Object.keys(clips) as ClipName[]).filter((k) => clips[k]);
    if (foundNames.length === 0) {
      mixerRef.current = null;
      return undefined;
    }

    const mixer = new THREE.AnimationMixer(gltf.scene);
    const actions: Partial<Record<ClipName, THREE.AnimationAction>> = {};
    for (const name of foundNames) {
      const clip = clips[name]!;
      neutralizeRootMotion(clip);
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      actions[name] = action;
    }
    mixerRef.current = mixer;
    actionsRef.current = actions;

    const initial = resolveState("idle", clips);
    if (initial && actions[initial]) {
      actions[initial]!.play();
      currentStateRef.current = initial;
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      mixerRef.current = null;
      actionsRef.current = {};
      currentStateRef.current = null;
    };
    // Only re-run if the underlying asset changes; clip discovery is a pure
    // function of gltf.animations.
  }, [gltf]);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;

    const progress = progressRef.current;
    const active = isChapterActive(progress, JOURNEY_CHAPTER_ID);
    const p = active ? progress.chapterProgress : lastProgressRef.current ?? 0;
    const presence = active ? stagePresence(p) : 0;

    presenceRef.current += (presence - presenceRef.current) * Math.min(1, delta * 1.5);
    const shown = presenceRef.current > 0.01;
    if (groupRef.current) groupRef.current.visible = shown;

    // Damped scroll velocity, derived from the existing shared progress ref
    // rather than a new listener — |dp/dt|, smoothed, clamped. Only computed
    // while active so leaving the chapter doesn't leave a stale spike.
    if (active && lastProgressRef.current !== null && delta > 0) {
      const raw = Math.min(1, Math.abs(p - lastProgressRef.current) / delta / 1.2);
      velocityRef.current += (raw - velocityRef.current) * Math.min(1, delta * 4);
    } else {
      velocityRef.current += (0 - velocityRef.current) * Math.min(1, delta * 2);
    }
    lastProgressRef.current = active ? p : lastProgressRef.current;

    if (!shown) {
      intensityRef.current = 0;
      return;
    }

    const { state: desiredState, base } = journeyPhase(p);
    const resolved = resolveState(desiredState, clipsRef.current);
    intensityRef.current = resolved === "run" ? Math.min(1, base + velocityRef.current * 0.3) : base;

    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    if (mixer && resolved && actions[resolved]) {
      if (currentStateRef.current !== resolved) {
        const from = currentStateRef.current ? actions[currentStateRef.current] : undefined;
        const to = actions[resolved]!;
        to.reset().play();
        if (from && from !== to) {
          from.crossFadeTo(to, CROSSFADE_SECONDS, false);
        } else {
          to.fadeIn(CROSSFADE_SECONDS);
        }
        currentStateRef.current = resolved;
      }

      const action = actions[resolved]!;
      const [lo, hi] = RATE_RANGE[resolved];
      const velocityBoost = resolved === "run" ? velocityRef.current * 0.35 : velocityRef.current * 0.15;
      action.timeScale = THREE.MathUtils.clamp(lo + (hi - lo) * base + velocityBoost, lo, hi + 0.1);

      mixer.update(delta);
    } else if (innerRef.current) {
      // No usable clip on the asset at all — a slow breath, matching
      // CoupleModel's own static-asset fallback, never a spin.
      const t = state.clock.elapsedTime;
      innerRef.current.position.y = Math.sin(t * ((Math.PI * 2) / 6)) * 0.012;
    }

    const materials = materialsRef.current;
    for (let i = 0; i < materials.length; i++) materials[i].opacity = presenceRef.current;

    const litness = presenceRef.current * (0.35 + intensityRef.current * 0.65);
    if (rimLightRef.current) rimLightRef.current.intensity = litness * 3.2;
    if (fillLightRef.current) fillLightRef.current.intensity = litness * 1.1;
  });

  return (
    <group ref={groupRef} position={PLACEMENT} visible={false}>
      {/* Cool violet rim, separating his silhouette from the starfield behind him. */}
      <pointLight ref={rimLightRef} position={[-0.5, 1.6, -1.6]} color="#6a5f86" intensity={0} distance={6} decay={2} />
      {/* Faint warm fill toward the direction he's running — never bright enough to read as "Dheepika as a glowing object". */}
      <pointLight ref={fillLightRef} position={[0.3, 0.8, -3.5]} color="#c99a6b" intensity={0} distance={9} decay={2} />
      {dustCount > 0 && <RunnerDust intensityRef={intensityRef} count={dustCount} />}
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
 * Tarun as Project Aurora's own moving protagonist through Chapter 04 — the
 * site's translation of Utsubo's "a moving figure carries the viewer through
 * the world" principle into this project's actual story (see
 * AURORA_THREE_SITE_FUSION_AUDIT.md and TARUN_RUNNER_IMPLEMENTATION.md).
 * Not a likeness: until an identity-accurate model is supplied at
 * `public/models/tarun-runner.glb`, this renders whatever silhouette
 * placeholder is there and never claims to be an accurate likeness of Tarun.
 *
 * Renders `null` for every state except a successful load — a missing or
 * broken file is completely inert, exactly like CoupleModel.tsx.
 */
export default function TarunRunner({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const near = useNearChapter(JOURNEY_CHAPTER_ID, "200% 0px");
  const state = useOptionalGLTF(MODEL_URL, near);
  if (state?.status !== "loaded") return null;
  return <LoadedTarunRunner gltf={state.gltf} progressRef={progressRef} />;
}
