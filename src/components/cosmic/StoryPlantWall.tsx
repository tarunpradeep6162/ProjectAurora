"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { getActiveCardIndex } from "./storyCarouselState";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { timeline } from "@/lib/content";

/**
 * "The Core": the merged story chapter's central 3D plant, fixed at world
 * origin `(0, 0, 0)` at all times — StoryCarousel.tsx's eleven real moments
 * orbit it at a fixed radius (see that file). Grows through five distinct
 * phases — one per timeline entry — as the visitor scrolls, and turns
 * slowly as it does. Checked directly against activetheory.net/work for
 * what to reinterpret: not their floating project-card gallery or its UI
 * chrome (a "WORK / CONTACT" nav, prev/next arrows, an AI search box
 * belong to their portfolio, not a love story), but the underlying
 * qualities — a persistent, lit 3D object the scroll narrative stages
 * itself around, softened depth behind it, and small drifting bloom-lit
 * particles giving the piece a lived-in, gallery-installation quality
 * rather than a static prop. Reinterpreted as this project's own image (a
 * vertical garden, matched against a reference photo of one), not copied
 * from theirs.
 *
 * "3, 4, 5 phases combined": every leaf and blossom is assigned one of the
 * five timeline entries (`phase`, 1-5) at build time. It stays scaled to
 * zero — ungrown — until `chapterProgress` reaches that phase's band of
 * the chapter, then grows in with a short smoothstep pop, staggered
 * slightly within the band (`phaseLocalOrder`) so a whole phase doesn't
 * snap in as one unit. The wall is sparse and small at "01 — First
 * meeting" and fully lush, blossoms included, by "05 — Celebration" — the
 * story and the garden growing together, not a decorative backdrop that
 * happens to also be there. Purely a function of scroll position (not
 * accumulated time), so scrolling back up ungrows it the same way it
 * grew, matching every other scrubbed animation on this site.
 *
 * Position: genuinely fixed at the origin, set once and never touched
 * again per frame — not the earlier camera-relative version, which
 * recomputed `camera.position + forward*distance` every frame to stay in
 * frame as the camera moved. A later spec asked for the plant to "remain
 * perfectly centred at world origin at all times" rather than chasing the
 * camera, which is a genuine behavioural difference: the camera now flies
 * past/around a truly stationary object instead of the object re-centring
 * itself under a moving camera. Rotation is still live — the slow idle
 * turn plus real scroll-scrubbed spin below — but position is not.
 *
 * Built from the same primitives as the rest of this scene: two
 * `InstancedMesh` leaf shapes (a slender fern blade and a rounder broad
 * leaf, both the curved-`ShapeGeometry` technique `TulipGarden.tsx`
 * established for foliage) plus a sparse third layer of small pale
 * blossoms (phases 4-5 only — the relationship, and the wall, blooming
 * together near the end) over a simple warm-wood planter box, and a small
 * drifting bokeh-particle layer (`buildSparkles`) for the gallery-lit
 * quality noted above.
 */
const SEED = 20251125; // this project's own recurring seed (25 November).
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Human-scale convention this project already uses (TarunRunner/CoupleModel
// target 1.7 units = a person's height): a shoulder-height garden wall
// reads right around this.
const WALL_WIDTH = 1.15;
const WALL_HEIGHT = 1.95;
const BOX_HEIGHT = 0.3;

function buildFernShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.028, 0.1, 0.022, 0.3);
  shape.quadraticCurveTo(0.016, 0.55, 0.005, 0.72);
  shape.lineTo(0, 0.78);
  shape.quadraticCurveTo(-0.014, 0.52, -0.024, 0.28);
  shape.quadraticCurveTo(-0.026, 0.1, 0, 0);
  return shape;
}

function buildBroadShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.11, 0.05, 0.13, 0.22);
  shape.quadraticCurveTo(0.1, 0.42, 0.03, 0.5);
  shape.quadraticCurveTo(0.01, 0.53, 0, 0.56);
  shape.quadraticCurveTo(-0.01, 0.53, -0.03, 0.5);
  shape.quadraticCurveTo(-0.1, 0.42, -0.13, 0.22);
  shape.quadraticCurveTo(-0.11, 0.05, 0, 0);
  return shape;
}

/**
 * Same lesson `TulipGarden.tsx`'s leaves already paid for: a flat
 * `ShapeGeometry` catches one uniform specular highlight and reads as a
 * blown-out paper cutout under a point light. Curve it out of plane once
 * here (a gentle lengthwise bend plus a cross-width channel) and recompute
 * normals so real shading varies across the blade.
 */
function buildLeafGeometry(shape: THREE.Shape, curl: number): THREE.BufferGeometry {
  const geo = new THREE.ShapeGeometry(shape, 6);
  const pos = geo.attributes.position;
  let maxY = 0;
  for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, y / Math.max(1e-6, maxY));
    const bend = curl * Math.pow(t, 1.5);
    const channel = -0.5 * x * x;
    pos.setZ(i, bend + channel);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

const LEAF_GREENS: THREE.Color[] = [
  new THREE.Color("#1d3a22"),
  new THREE.Color("#25502a"),
  new THREE.Color("#2f6636"),
  new THREE.Color("#3d7a3f"),
  new THREE.Color("#4f8a4a"),
  new THREE.Color("#5f8f4e"), // olive-lit accent
];
const BLOSSOM_COLOR = new THREE.Color("#f3e3d8");
const WOOD_COLOR = new THREE.Color("#8a6640");

// Five growth phases, one per timeline entry (ChapterTimeline.tsx's
// `timeline` array in content.ts is always length 5) — an equal-width band
// of chapterProgress per phase.
const PHASE_COUNT = 5;

// "Hard Days" gets its own mood, not just its own growth band: reduced
// light and quieter particles exactly while that memory is the carousel's
// actual front card (StoryCarousel.tsx / storyCarouselState.ts) — the
// real, observed card, not an assumed chapterProgress window. The two
// don't line up 1:1: this wall's own five growth phases are evenly spaced
// across the whole chapter (bandWidth 1/5 each), but the carousel has
// eleven cards spaced roughly 1/10 apart, so "phase 4" and "the Hard Days
// card is at the front" land at different points in the scroll. Reading
// the carousel's own state directly avoids that drift.
const HARD_DAYS_CARD_INDEX = timeline.findIndex((t) => t.title === "The Hard Days");

type LeafDatum = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  tiltX: number;
  tiltZ: number;
  scale: number;
  kind: 0 | 1;
  colorIdx: number;
  phase: number; // 1-5
  phaseLocalOrder: number; // 0-1, staggers pop-in within its phase band
};

function buildLeaves(count: number): LeafDatum[] {
  const rand = seededRandom(SEED + count);
  const leaves: LeafDatum[] = [];
  const halfW = WALL_WIDTH / 2;
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * WALL_WIDTH * 1.02;
    // Denser toward the bottom (where the planter feeds it) and a soft
    // taper at the very top edge, rather than a hard-edged rectangle of
    // foliage. Earlier phases are seeded lower on the wall (a young plant
    // starts near the planter), later phases fill in the upper reaches —
    // biasing phase by height, not assigning it independently of position,
    // so the wall visibly builds upward as it grows rather than sprouting
    // uniformly all over at once.
    const yRaw = rand();
    const y = (yRaw - 0.5) * WALL_HEIGHT;
    const edgeFade = 1 - Math.pow(Math.abs(x) / halfW, 3) * 0.4;
    if (rand() > edgeFade) continue;
    const heightBias = yRaw * 0.7 + rand() * 0.3;
    const phase = Math.min(PHASE_COUNT, 1 + Math.floor(heightBias * PHASE_COUNT));
    leaves.push({
      x,
      y,
      z: (rand() - 0.5) * 0.16 + 0.02,
      rotY: rand() * Math.PI * 2,
      tiltX: (rand() - 0.5) * 0.9,
      tiltZ: (rand() - 0.5) * 0.6,
      scale: 0.7 + rand() * 0.7,
      kind: rand() < 0.5 ? 0 : 1,
      colorIdx: Math.floor(rand() * LEAF_GREENS.length),
      phase,
      phaseLocalOrder: rand(),
    });
  }
  return leaves;
}

type BlossomDatum = {
  x: number;
  y: number;
  z: number;
  scale: number;
  phase: number;
  phaseLocalOrder: number;
};
function buildBlossoms(count: number): BlossomDatum[] {
  const rand = seededRandom(SEED + count + 7);
  const blossoms: BlossomDatum[] = [];
  for (let i = 0; i < count; i++) {
    blossoms.push({
      x: (rand() - 0.5) * WALL_WIDTH * 0.9,
      y: (rand() - 0.5) * WALL_HEIGHT * 0.85,
      z: (rand() - 0.5) * 0.1 + 0.09,
      scale: 0.5 + rand() * 0.5,
      // Blossoms only arrive in the last two phases — the relationship (and
      // the wall) blooming together near the end of the story, not present
      // from the very first meeting.
      phase: rand() < 0.5 ? 4 : 5,
      phaseLocalOrder: rand(),
    });
  }
  return blossoms;
}

type SparkleDatum = { x: number; y: number; z: number; phase: number };
const SPARKLE_COLORS: THREE.Color[] = [
  new THREE.Color("#e8879e"),
  new THREE.Color("#8fd0a8"),
  new THREE.Color("#e8d17a"),
  new THREE.Color("#a89be0"),
];
function buildSparkles(count: number): SparkleDatum[] {
  const rand = seededRandom(SEED + count + 41);
  const sparkles: SparkleDatum[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = WALL_WIDTH * (0.65 + rand() * 0.8);
    sparkles.push({
      x: Math.cos(angle) * r,
      y: (rand() - 0.5) * WALL_HEIGHT * 1.3,
      z: Math.sin(angle) * r * 0.5 + 0.1,
      phase: 1 + Math.floor(rand() * PHASE_COUNT),
    });
  }
  return sparkles;
}

export default function StoryPlantWall({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const mobileTier = coarsePointer || narrow;
  const leafCount = mobileTier ? 170 : 420;
  const blossomCount = mobileTier ? 8 : 20;
  const sparkleCount = mobileTier ? 14 : 34;

  const leaves = useMemo(() => buildLeaves(leafCount), [leafCount]);
  const blossoms = useMemo(() => buildBlossoms(blossomCount), [blossomCount]);
  const sparkles = useMemo(() => buildSparkles(sparkleCount), [sparkleCount]);

  const groupRef = useRef<THREE.Group>(null);
  const fernRef = useRef<THREE.InstancedMesh>(null);
  const broadRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const sparkleRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  const presenceRef = useRef(0);
  const timeRef = useRef(0);
  const spinRef = useRef(0);
  // Swells once when scroll first crosses into the final growth phase
  // ("05 — Celebration") — the culmination the other four phases build
  // toward — then eases back down; resets if the visitor scrolls back out
  // of that phase, so scrolling into it again re-triggers the same swell.
  const bloomPulseRef = useRef(0);
  const enteredFinalPhaseRef = useRef(false);
  // 0-1, smoothly tracks whether the Hard Days card is currently at the
  // carousel's front — dims light and quiets the sparkle burst while it
  // is, per the brief's "reduced light, reduced particles" mood for that
  // memory specifically.
  const hardDaysMoodRef = useRef(0);

  const fernGeo = useMemo(() => buildLeafGeometry(buildFernShape(), 0.05), []);
  const broadGeo = useMemo(() => buildLeafGeometry(buildBroadShape(), 0.07), []);
  const blossomGeo = useMemo(() => new THREE.SphereGeometry(0.028, 6, 5), []);
  const sparkleGeo = useMemo(() => new THREE.SphereGeometry(0.012, 5, 4), []);
  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(WALL_WIDTH * 1.08, BOX_HEIGHT, 0.24),
    []
  );

  const fernCount = useMemo(() => leaves.filter((l) => l.kind === 0).length, [leaves]);
  const broadCount = useMemo(() => leaves.filter((l) => l.kind === 1).length, [leaves]);

  useEffect(() => {
    return () => {
      fernGeo.dispose();
      broadGeo.dispose();
      blossomGeo.dispose();
      sparkleGeo.dispose();
      boxGeo.dispose();
    };
  }, [fernGeo, broadGeo, blossomGeo, sparkleGeo, boxGeo]);

  useEffect(() => {
    const fern = fernRef.current;
    const broad = broadRef.current;
    const blossom = blossomRef.current;
    const sparkle = sparkleRef.current;
    if (!fern || !broad || !blossom || !sparkle) return;
    const color = new THREE.Color();
    let fi = 0;
    let bi = 0;
    for (const leaf of leaves) {
      color.copy(LEAF_GREENS[leaf.colorIdx]);
      if (leaf.kind === 0) fern.setColorAt(fi++, color);
      else broad.setColorAt(bi++, color);
    }
    if (fern.instanceColor) fern.instanceColor.needsUpdate = true;
    if (broad.instanceColor) broad.instanceColor.needsUpdate = true;
    for (let i = 0; i < blossoms.length; i++) blossom.setColorAt(i, BLOSSOM_COLOR);
    if (blossom.instanceColor) blossom.instanceColor.needsUpdate = true;
    for (let i = 0; i < sparkles.length; i++) {
      sparkle.setColorAt(i, SPARKLE_COLORS[i % SPARKLE_COLORS.length]);
    }
    if (sparkle.instanceColor) sparkle.instanceColor.needsUpdate = true;
  }, [leaves, blossoms, sparkles]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);

  // How grown a single instance is, 0-1, purely a function of scroll
  // position: 0 until chapterProgress reaches this instance's phase band,
  // then a short smoothstep pop to full size, staggered within the band by
  // `phaseLocalOrder` so an entire phase doesn't scale in as one flat unit.
  const growthAt = (chapterProgress: number, phase: number, localOrder: number) => {
    const bandWidth = 1 / PHASE_COUNT;
    const phaseStart = (phase - 1) * bandWidth;
    const revealAt = phaseStart + localOrder * bandWidth * 0.6;
    return THREE.MathUtils.smoothstep(chapterProgress, revealAt, revealAt + 0.045);
  };

  useFrame((_state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    const fern = fernRef.current;
    const broad = broadRef.current;
    const blossom = blossomRef.current;
    const sparkle = sparkleRef.current;
    const box = boxRef.current;
    if (!group || !fern || !broad || !blossom || !sparkle || !box) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "story");
    const targetPresence = active
      ? THREE.MathUtils.smoothstep(progress.chapterProgress, 0, 0.1) *
        (1 - THREE.MathUtils.smoothstep(progress.chapterProgress, 0.9, 1))
      : 0;
    presenceRef.current += (targetPresence - presenceRef.current) * Math.min(1, dt * 2.2);
    const presence = presenceRef.current;

    const shown = presence > 0.01;
    group.visible = shown;
    if (!shown) return;

    timeRef.current += dt;
    // A slow idle turn, plus real scroll-scrubbed rotation across the whole
    // chapter — the wall visibly turns further with every story beat
    // scrolled past, not just idling on its own.
    const idleSpin = Math.sin(timeRef.current * 0.05) * 0.05;
    const scrollSpin = active
      ? THREE.MathUtils.degToRad(58) * progress.chapterProgress
      : spinRef.current;
    spinRef.current = scrollSpin;

    // Fixed at world origin, always — "The Core" per the spec. Only
    // rotation is live: idle drift plus real scroll-scrubbed spin, set
    // directly rather than composed with a camera-facing lookAt.
    group.position.set(0, 0, 0);
    group.rotation.set(0, idleSpin + scrollSpin, 0);

    // Grow each phase's leaves in as chapterProgress reaches its band —
    // this is what makes "5 phases combined" a real, continuous scroll
    // animation rather than 5 static snapshots.
    const cp = progress.chapterProgress;

    const finalPhaseStart = (PHASE_COUNT - 1) / PHASE_COUNT; // 0.8
    if (cp >= finalPhaseStart && !enteredFinalPhaseRef.current) {
      enteredFinalPhaseRef.current = true;
      bloomPulseRef.current = 1;
    } else if (cp < finalPhaseStart && enteredFinalPhaseRef.current) {
      enteredFinalPhaseRef.current = false;
    }
    // A slow swell (~0.7s), not a quick snap — this is the chapter's
    // culminating moment, not a per-card beat.
    bloomPulseRef.current *= Math.exp(-dt / 0.7);
    const bloomPulse = bloomPulseRef.current;

    // Hard Days mood: reads the carousel's real active card, not a
    // chapterProgress guess (see HARD_DAYS_CARD_INDEX's own comment).
    const isHardDays = active && getActiveCardIndex() === HARD_DAYS_CARD_INDEX;
    hardDaysMoodRef.current +=
      ((isHardDays ? 1 : 0) - hardDaysMoodRef.current) * Math.min(1, dt * 1.8);
    const hardDaysMood = hardDaysMoodRef.current;
    const moodDim = 1 - 0.45 * hardDaysMood;

    if (keyRef.current) keyRef.current.intensity = 2.6 * presence * (1 + 0.7 * bloomPulse) * moodDim;
    if (rimRef.current) rimRef.current.intensity = 1.4 * presence * (1 + 0.5 * bloomPulse) * moodDim;

    let fi = 0;
    let bi = 0;
    for (const leaf of leaves) {
      const growth = growthAt(cp, leaf.phase, leaf.phaseLocalOrder);
      position.set(leaf.x, leaf.y, leaf.z);
      euler.set(leaf.tiltX, leaf.rotY, leaf.tiltZ);
      quaternion.setFromEuler(euler);
      scaleVec.setScalar(leaf.scale * (leaf.kind === 0 ? 1.4 : 1) * growth);
      matrix.compose(position, quaternion, scaleVec);
      if (leaf.kind === 0) fern.setMatrixAt(fi++, matrix);
      else broad.setMatrixAt(bi++, matrix);
    }
    fern.instanceMatrix.needsUpdate = true;
    broad.instanceMatrix.needsUpdate = true;

    let blossomIdx = 0;
    for (const b of blossoms) {
      const growth = growthAt(cp, b.phase, b.phaseLocalOrder);
      position.set(b.x, b.y, b.z);
      quaternion.identity();
      scaleVec.setScalar(b.scale * growth);
      matrix.compose(position, quaternion, scaleVec);
      blossom.setMatrixAt(blossomIdx++, matrix);
    }
    blossom.instanceMatrix.needsUpdate = true;

    let sparkleIdx = 0;
    for (const s of sparkles) {
      const growth = growthAt(cp, s.phase, 0);
      const twinkle = 0.6 + 0.4 * Math.sin(timeRef.current * 1.6 + sparkleIdx * 2.1);
      // The same swell as the lights above, felt here as the sparkles
      // momentarily brightening/enlarging — a small burst timed to the
      // chapter's culminating phase rather than a constant twinkle. Quieted
      // by the same Hard Days mood the lights dim for — fewer, calmer
      // points of light while that memory holds the front.
      position.set(s.x, s.y, s.z);
      quaternion.identity();
      scaleVec.setScalar(growth * twinkle * (1 + 1.1 * bloomPulse) * moodDim);
      matrix.compose(position, quaternion, scaleVec);
      sparkle.setMatrixAt(sparkleIdx++, matrix);
    }
    sparkle.instanceMatrix.needsUpdate = true;

    (fern.material as THREE.MeshStandardMaterial).opacity = presence;
    (broad.material as THREE.MeshStandardMaterial).opacity = presence;
    (blossom.material as THREE.MeshStandardMaterial).opacity = presence;
    (sparkle.material as THREE.MeshBasicMaterial).opacity = presence * 0.85;
    (box.material as THREE.MeshStandardMaterial).opacity = presence;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Fixed positions now too, matching the plant's own fixed placement
          — offset from the origin for real key/rim directionality rather
          than sitting on top of the plant they're lighting. */}
      <pointLight ref={keyRef} position={[1.1, 1.2, 1.6]} color="#fbead0" intensity={0} distance={5} decay={2} />
      <pointLight ref={rimRef} position={[-0.9, 0.9, -1.4]} color="#8fd0a8" intensity={0} distance={4.5} decay={2} />

      <mesh
        ref={boxRef}
        geometry={boxGeo}
        position={[0, -WALL_HEIGHT / 2 - BOX_HEIGHT / 2, 0.05]}
      >
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} metalness={0} transparent opacity={0} />
      </mesh>

      <instancedMesh ref={fernRef} args={[fernGeo, undefined, Math.max(1, fernCount)]} frustumCulled={false}>
        <meshStandardMaterial
          roughness={0.6}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
        />
      </instancedMesh>
      <instancedMesh ref={broadRef} args={[broadGeo, undefined, Math.max(1, broadCount)]} frustumCulled={false}>
        <meshStandardMaterial
          roughness={0.5}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
        />
      </instancedMesh>
      <instancedMesh ref={blossomRef} args={[blossomGeo, undefined, Math.max(1, blossoms.length)]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.4} metalness={0} transparent opacity={0} />
      </instancedMesh>
      {/* Small drifting bloom-lit particles around the wall — the
          gallery-installation quality noted in this file's own doc
          comment, reinterpreted from activetheory.net/work rather than
          copied from it. Unlit + additive so they read as glowing points,
          not lit geometry. */}
      <instancedMesh ref={sparkleRef} args={[sparkleGeo, undefined, Math.max(1, sparkles.length)]} frustumCulled={false}>
        <meshBasicMaterial
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
