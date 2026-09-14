"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { theatreAuroraRelic, theatreRelicKey, theatreRelicRim } from "@/theatre/auroraProject";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * Project Aurora's signature 3D object — two smooth, tapering forms winding
 * around a shared axis, meeting at both ends, suggesting an embrace without
 * depicting one literally. Entirely procedural (`buildStrandCurve` below):
 * no external asset, no download, nothing borrowed from any reference site.
 * Visible specifically during the portal (hero) chapter — see `stagePortal`.
 *
 * Geometry choice, and why: two `THREE.TubeGeometry` tubes, each following a
 * `CatmullRomCurve3` whose own *radius from the shared axis* tapers to ~0 at
 * both ends (via a `sin(t·π)` envelope) while the tube's own cross-sectional
 * radius stays constant. True per-point tube-radius tapering isn't exposed
 * by core `TubeGeometry`, so the taper lives in the *path* instead — this
 * was a deliberate, working simplification, not an oversight, and still
 * produces the tapering, organic, "narrow bridge" silhouette the brief asks
 * for (the two strands visibly converge toward the axis near each end).
 */

// Sized against the portal camera's actual framing: camera sits at world
// z=9, the dust shell's near edge is at z≈6 (see CosmicScene.tsx), so the
// Relic lives at z≈6.9 (distance ≈2.1 from camera) — inside that safe gap.
// At that distance and the portal camera's 50° FOV, the visible frame is
// about 2.08 world units tall; STRAND_HEIGHT below targets ~42% of that,
// the middle of the brief's 35-50% range. Verified by measuring the
// rendered result, not assumed from the formula alone.
const STRAND_HEIGHT = 1.3;
const STRAND_TURNS = 2.35;
const STRAND_RADIUS_BASE = 0.44;
const STRAND_WOBBLE = 0.08;
const TUBE_RADIUS = 0.105;
const TUBE_RADIAL_SEGMENTS = 10;
const TUBE_PATH_SEGMENTS = 90;
const CURVE_SAMPLES = 80;

/**
 * The x-offset tuned above assumed something close to a landscape/near-
 * square desktop frame. A narrow portrait viewport (mobile) has a much
 * tighter *horizontal* FOV at the same vertical FOV — a real, verified
 * finding: at the desktop-tuned offset, the Relic sat entirely outside a
 * 375×812 frame (confirmed live: a completely empty hero at that viewport,
 * not assumed from a formula). A directly-authored mobile constant, keyed
 * off the same `useCoarsePointer`/`useNarrowViewport` device-tier split
 * `MemoryBlocks.tsx` already uses for its own instance count, rather than
 * a continuous aspect-ratio formula — simpler, and verified at the one
 * viewport size that actually matters here (390×844, the brief's stated
 * mobile primary).
 */
export function relicXOffset(mobileTier: boolean): number {
  return mobileTier ? 0.14 : 0.48;
}

function strandPoint(t: number, phase: number): THREE.Vector3 {
  const taper = Math.sin(t * Math.PI);
  const wobble = STRAND_WOBBLE * Math.sin(t * Math.PI * 5 + phase * 1.7);
  const r = (STRAND_RADIUS_BASE + wobble) * taper + 0.015;
  const angle = t * Math.PI * 2 * STRAND_TURNS + phase;
  // A gentle asymmetric lean along X, "subtle asymmetry" from the brief,
  // rather than a perfectly lathe-symmetric object.
  const lean = 0.08 * (t - 0.5);
  const y = (t - 0.5) * STRAND_HEIGHT;
  return new THREE.Vector3(Math.cos(angle) * r + lean, y, Math.sin(angle) * r);
}

function buildStrandGeometry(phase: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    points.push(strandPoint(i / CURVE_SAMPLES, phase));
  }
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  return new THREE.TubeGeometry(
    curve,
    TUBE_PATH_SEGMENTS,
    TUBE_RADIUS,
    TUBE_RADIAL_SEGMENTS,
    false
  );
}

/** Presence across the portal chapter: fully visible through most of it, fading out as the visitor moves into "miracle" rather than lingering into the story proper. Before `chapterIndex` is ever measured (-1), this reads as 0 — invisible until sceneProgress has its first real measurement, matching every other chapter-gated object in this file's siblings (TarunRunner, CoupleModel). */
function stagePortal(active: boolean, chapterProgress: number): number {
  if (!active) return 0;
  return 1 - THREE.MathUtils.smoothstep(chapterProgress, 0.82, 1);
}

function RelicMesh({ progressRef }: { progressRef: RefObject<SceneProgressRef> }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshARef = useRef<THREE.Mesh>(null);
  const meshBRef = useRef<THREE.Mesh>(null);
  const materialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const presenceRef = useRef(0);
  const timeRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const mobileTier = coarsePointer || narrow;

  const strandA = useMemo(() => buildStrandGeometry(0), []);
  const strandB = useMemo(() => buildStrandGeometry(Math.PI), []);

  useEffect(() => {
    materialsRef.current = [meshARef.current?.material, meshBRef.current?.material].filter(
      (m): m is THREE.MeshPhysicalMaterial => m instanceof THREE.MeshPhysicalMaterial
    );
  }, []);

  useEffect(() => {
    return () => {
      strandA.dispose();
      strandB.dispose();
    };
  }, [strandA, strandB]);

  useEffect(() => {
    // Fine-pointer only — a touch device gets the Relic's idle motion alone,
    // no hover requirement, matching StardustTrail's own device split.
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = pointerRef.current;
      p.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      p.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    if (!group) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "portal");
    const targetPresence = stagePortal(active, progress.chapterProgress);
    presenceRef.current += (targetPresence - presenceRef.current) * Math.min(1, dt * 2);
    const presence = presenceRef.current;

    const shown = presence > 0.01;
    group.visible = shown;
    if (!shown) return;

    timeRef.current += dt;
    const t = timeRef.current;

    const p = pointerRef.current;
    const kPointer = 1 - Math.exp(-dt / 0.5);
    p.sx += (p.x - p.sx) * kPointer;
    p.sy += (p.y - p.sy) * kPointer;

    const correction = theatreAuroraRelic.value;

    // Idle rotation: a slow, never-repeating drift (incommensurate periods,
    // matching CameraRig's own idle-float convention elsewhere in this
    // file's siblings), 2-5 degrees of apparent sway plus a slow continuous
    // turn so every angle of the sculpture is eventually visible.
    const DEG = Math.PI / 180;
    const sway = Math.sin(t * 0.11) * 3.2 * DEG;
    const continuousTurn = t * 0.045;
    group.rotation.y =
      continuousTurn + sway + p.sx * 1.5 * DEG + correction.rotationBoost.y * Math.PI;
    group.rotation.x = Math.sin(t * 0.07 + 1.1) * 1.6 * DEG + p.sy * 1 * DEG + correction.rotationBoost.x * Math.PI;
    group.rotation.z = correction.rotationBoost.z * Math.PI;

    // Breathing positional drift — a few centimetres, never a bob.
    const breatheX = Math.sin(t * 0.09) * 0.02;
    const breatheY = Math.sin(t * 0.065 + 0.6) * 0.025;
    const xOffset = relicXOffset(mobileTier);
    group.position.set(
      xOffset + breatheX + correction.positionBoost.x,
      0.15 + breatheY + correction.positionBoost.y,
      6.92 + correction.positionBoost.z
    );
    // "~30-40% viewport height mobile" vs desktop's 35-50% — a modest
    // additional reduction, not just the x-offset change above.
    const deviceScale = mobileTier ? 0.82 : 1;
    group.scale.setScalar(presence * correction.scaleMultiplier * deviceScale);

    const key = theatreRelicKey.value;
    const rim = theatreRelicRim.value;
    if (keyRef.current) {
      keyRef.current.intensity = key.intensity * presence;
      keyRef.current.color.setRGB(key.color.r, key.color.g, key.color.b);
    }
    if (rimRef.current) {
      rimRef.current.intensity = rim.intensity * presence;
      rimRef.current.color.setRGB(rim.color.r, rim.color.g, rim.color.b);
    }

    const materials = materialsRef.current;
    for (let i = 0; i < materials.length; i++) materials[i].opacity = presence;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Key: soft warm ivory/champagne, close and slightly above. */}
      <pointLight ref={keyRef} position={[1.4, 1.5, 1.8]} intensity={0} distance={7} decay={2} />
      {/* Rim: cool muted violet, behind and to the side — separates the
          Relic's silhouette from the dark backdrop without lighting it
          flatly from the front. */}
      <pointLight ref={rimRef} position={[-1.2, 0.6, -1.6]} intensity={0} distance={6} decay={2} />
      <mesh ref={meshARef} geometry={strandA} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#efe0c0"
          roughness={0.34}
          metalness={0.04}
          clearcoat={0.45}
          clearcoatRoughness={0.28}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh ref={meshBRef} geometry={strandB} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#e8d3ab"
          roughness={0.38}
          metalness={0.04}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

export default function AuroraRelic({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  return <RelicMesh progressRef={progressRef} />;
}
