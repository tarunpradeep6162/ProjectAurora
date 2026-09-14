"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { theatreTulipGarden } from "@/theatre/auroraProject";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * Project Aurora's hero signature world, replacing the Aurora Relic: a
 * dark, cinematic 3D tulip garden the visitor stands inside of, rather
 * than a single sculptural object in front of them. Entirely procedural —
 * no photograph, no downloaded asset. Three shared geometries (stem, leaf,
 * flower bulb), each reused across every instance via `InstancedMesh`, so
 * total draw calls stay at 3 regardless of how many flowers are in the
 * field.
 *
 * Flower bulb geometry: a `THREE.LatheGeometry` revolved from a tulip-bulb
 * profile curve (narrow base, bulging belly, a pinch, a small flared rim)
 * — deliberately given only 6 radial segments rather than a smooth many-
 * sided revolve, so the facets themselves read as petals. Not six separate
 * petal meshes (that would multiply the instance count sixfold for a
 * marginal silhouette gain); this was the efficient version of the same
 * idea.
 */

const SEED = 20251125; // 25 November — this project's own recurring seed.
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Camera-safe gap: portal camera sits at world z=9, the starfield's dust
// shell near edge is at z≈6 (see CosmicScene.tsx) — the garden lives
// entirely inside that gap, same constraint the Relic was tuned against.
// Pulled back from the Relic's own near-camera distance: an object 0.4
// world units from the camera reads as an extreme, abstract close-up
// (confirmed live — the first pass here produced unreadable colour blobs,
// not a field of flowers), so even the "foreground" band now sits at
// least a full unit away.
const NEAR_Z = 8.0;
const FAR_Z = 6.2;

const DESKTOP_COUNT = 90;
const MOBILE_COUNT = 34;

// Mostly pink/rose/peach/cream/yellow, less red/orange, rare magenta —
// weighted by repetition rather than a separate probability table, so the
// mix stays readable as "a natural garden," not a rainbow.
const PALETTE: THREE.Color[] = [
  new THREE.Color("#e8879e"),
  new THREE.Color("#e8879e"),
  new THREE.Color("#c1476b"),
  new THREE.Color("#c1476b"),
  new THREE.Color("#e8a26b"),
  new THREE.Color("#e8a26b"),
  new THREE.Color("#f0e4c8"),
  new THREE.Color("#f0e4c8"),
  new THREE.Color("#e8d17a"),
  new THREE.Color("#b8394a"),
  new THREE.Color("#d97a3d"),
  new THREE.Color("#c14a8a"), // rare magenta
];

const LEAF_GREEN = new THREE.Color("#1c3320");
const STEM_GREEN = new THREE.Color("#233d27");
const DISTANCE_FOG = new THREE.Color("#0a0b14"); // far instances mix toward this, not just dimming

type FlowerDatum = {
  base: THREE.Vector3;
  height: number;
  lean: number;
  scale: number;
  colorMix: THREE.Color;
  bulbRotationY: number;
  depthFactor: number; // 0 far .. 1 near
  phase: number;
  swaySpeed: number;
  leafCount: 1 | 2;
  leafRotations: number[];
  leafTilts: number[];
};

function buildTulipProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.045, 0.015),
    new THREE.Vector2(0.1, 0.09),
    new THREE.Vector2(0.135, 0.22),
    new THREE.Vector2(0.14, 0.32), // the bulb's widest belly
    new THREE.Vector2(0.095, 0.4), // the tulip's characteristic pinch
    new THREE.Vector2(0.115, 0.46), // petals flare very slightly at the rim
  ];
}

function buildLeafShape(): THREE.Shape {
  // A long blade tapering to a point — not a plain rectangle, not a
  // rounded almond. Asymmetric on purpose (a real leaf isn't a mirror).
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.05, 0.15, 0.045, 0.4);
  shape.quadraticCurveTo(0.04, 0.65, 0.01, 0.86);
  shape.lineTo(0, 0.92);
  shape.quadraticCurveTo(-0.03, 0.62, -0.045, 0.38);
  shape.quadraticCurveTo(-0.045, 0.14, 0, 0);
  return shape;
}

function buildLayout(count: number, mobileTier: boolean): FlowerDatum[] {
  const rand = seededRandom(SEED + count);
  const flowers: FlowerDatum[] = [];

  // Cluster centers, not a grid — a handful of denser patches with open
  // space between them. Biased right/center on desktop so the left side
  // stays clear for "FOR DHEEPIKA / PROJECT AURORA"; a narrower spread on
  // mobile, the same lesson the Relic's own x-offset already taught this
  // project (a desktop-tuned horizontal offset sits entirely outside a
  // portrait phone's much tighter horizontal FOV).
  const clusterCount = 5;
  const clusters: { x: number; y: number; z: number; r: number }[] = [];
  for (let c = 0; c < clusterCount; c++) {
    const xBase = mobileTier ? 0.15 : 0.55;
    const xSpread = mobileTier ? 0.55 : 1.1;
    clusters.push({
      x: xBase + (rand() - 0.35) * xSpread,
      y: -0.55 + (rand() - 0.5) * 0.7,
      z: FAR_Z + rand() * (NEAR_Z - FAR_Z),
      r: 0.45 + rand() * 0.55,
    });
  }

  for (let i = 0; i < count; i++) {
    const cluster = clusters[Math.floor(rand() * clusters.length)];
    const angle = rand() * Math.PI * 2;
    const radius = Math.pow(rand(), 0.6) * cluster.r; // denser toward the cluster center
    const x = cluster.x + Math.cos(angle) * radius;
    const z = THREE.MathUtils.clamp(cluster.z + (rand() - 0.5) * 0.5, FAR_Z, NEAR_Z);
    const depthFactor = (z - FAR_Z) / (NEAR_Z - FAR_Z);
    // A handful of near instances get a real foreground boost — "3-6
    // larger foreground elements, some partially outside the viewport".
    const foreground = depthFactor > 0.82 && rand() < 0.3;

    // Calibrated against the project's own human-scale convention
    // (TarunRunner/CoupleModel target 1.7 units = a person's height) — a
    // real tulip is roughly a third of that, so a whole plant (stem +
    // bulb) lands around 0.35-0.55 units at scale 1, not the ~1-unit
    // figures the first pass used.
    const baseHeight = 0.32 + rand() * 0.18;
    const height = foreground ? baseHeight * 1.3 : baseHeight;
    const y = cluster.y + Math.sin(angle) * radius * 0.3 + (rand() - 0.5) * 0.15;

    const scaleJitter = 0.8 + rand() * 0.5;
    const scale = (foreground ? 1.15 : 0.45 + depthFactor * 0.55) * scaleJitter;

    const color = PALETTE[Math.floor(rand() * PALETTE.length)].clone();
    // Far flowers desaturate and darken into the atmosphere rather than
    // just becoming smaller — real depth, not just scale.
    const fogAmount = (1 - depthFactor) * 0.55;
    color.lerp(DISTANCE_FOG, fogAmount);

    const leafCount: 1 | 2 = rand() < 0.35 ? 1 : 2;
    const leafRotations = [rand() * Math.PI * 2, rand() * Math.PI * 2];
    const leafTilts = [0.5 + rand() * 0.5, 0.5 + rand() * 0.5];

    flowers.push({
      base: new THREE.Vector3(x, y, z),
      height,
      lean: (rand() - 0.5) * 0.22,
      scale,
      colorMix: color,
      bulbRotationY: rand() * Math.PI * 2,
      depthFactor,
      phase: rand() * Math.PI * 2,
      swaySpeed: 0.5 + rand() * 0.4,
      leafCount,
      leafRotations,
      leafTilts,
    });
  }

  return flowers;
}

function GardenMeshes({
  progressRef,
  flowers,
}: {
  progressRef: RefObject<SceneProgressRef>;
  flowers: FlowerDatum[];
}) {
  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.006, 0.012, 1, 6, 1), []);
  const leafGeo = useMemo(() => new THREE.ShapeGeometry(buildLeafShape(), 8), []);
  const bulbGeo = useMemo(
    () => new THREE.LatheGeometry(buildTulipProfile(), 6),
    []
  );

  useEffect(() => {
    return () => {
      stemGeo.dispose();
      leafGeo.dispose();
      bulbGeo.dispose();
    };
  }, [stemGeo, leafGeo, bulbGeo]);

  const stemRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  const presenceRef = useRef(0);
  const timeRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  const leafInstanceCount = useMemo(
    () => flowers.reduce((sum, f) => sum + f.leafCount, 0),
    [flowers]
  );

  useEffect(() => {
    const bulb = bulbRef.current;
    if (!bulb) return;
    const color = new THREE.Color();
    for (let i = 0; i < flowers.length; i++) {
      color.copy(flowers[i].colorMix);
      bulb.setColorAt(i, color);
    }
    if (bulb.instanceColor) bulb.instanceColor.needsUpdate = true;
  }, [flowers]);

  useEffect(() => {
    // Fine-pointer only, same device split every other pointer-reactive
    // scene object in this directory already uses.
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = pointerRef.current;
      p.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      p.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    const stem = stemRef.current;
    const leaf = leafRef.current;
    const bulb = bulbRef.current;
    if (!group || !stem || !leaf || !bulb) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "portal");
    // Same envelope the Relic used: full presence through most of the
    // chapter, fading out before the story proper begins.
    const targetPresence = active
      ? 1 - THREE.MathUtils.smoothstep(progress.chapterProgress, 0.82, 1)
      : 0;
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

    const correction = theatreTulipGarden.value;
    const reveal = presence * correction.reveal;
    const wind = correction.windStrength;

    let leafIndex = 0;
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];
      // Near flowers sway more from the pointer than far ones — the same
      // depth-scaled parallax MemoryBlocks already established.
      const parallax = 0.05 * f.depthFactor;
      const windSway = Math.sin(t * f.swaySpeed + f.phase) * 0.06 * wind;
      const windLean = Math.cos(t * f.swaySpeed * 0.7 + f.phase) * 0.04 * wind;

      const bx = f.base.x + p.sx * parallax;
      const by = f.base.y;
      const bz = f.base.z;

      // Stem: a thin tapered cylinder, pivoted from its base by leaning it
      // slightly rather than translating it — a real stem bends, it
      // doesn't slide sideways.
      const stemLean = f.lean + windSway;
      position.set(bx, by + (f.height * f.scale) / 2, bz);
      euler.set(stemLean, 0, windLean * 0.6);
      quaternion.setFromEuler(euler);
      scaleVec.set(f.scale, f.height * f.scale, f.scale);
      matrix.compose(position, quaternion, scaleVec);
      stem.setMatrixAt(i, matrix);

      // Bulb: sits at the stem's tip, same lean carried through so the
      // flower head reads as attached to its own stem, not floating.
      const tipOffset = new THREE.Vector3(
        Math.sin(stemLean) * f.height * f.scale,
        Math.cos(stemLean) * f.height * f.scale,
        0
      );
      position.set(bx + tipOffset.x, by + tipOffset.y, bz + tipOffset.z);
      euler.set(stemLean * 0.6, f.bulbRotationY + windSway * 0.5, windLean);
      quaternion.setFromEuler(euler);
      scaleVec.setScalar(f.scale * (1.35 + f.depthFactor * 0.2));
      matrix.compose(position, quaternion, scaleVec);
      bulb.setMatrixAt(i, matrix);

      // Leaves: attached lower on the stem, each with its own rotation
      // and tilt so no two look cloned.
      for (let l = 0; l < f.leafCount; l++) {
        const leafHeightFrac = 0.15 + l * 0.2;
        const lx = bx + Math.sin(stemLean) * f.height * f.scale * leafHeightFrac;
        const ly = by + Math.cos(stemLean) * f.height * f.scale * leafHeightFrac;
        position.set(lx, ly, bz);
        euler.set(
          f.leafTilts[l] + windSway * 0.8,
          f.leafRotations[l] + windSway * 0.4,
          stemLean * 0.5
        );
        quaternion.setFromEuler(euler);
        scaleVec.setScalar(f.scale * (1.1 + f.depthFactor * 0.25));
        matrix.compose(position, quaternion, scaleVec);
        leaf.setMatrixAt(leafIndex, matrix);
        leafIndex++;
      }
    }

    stem.instanceMatrix.needsUpdate = true;
    leaf.instanceMatrix.needsUpdate = true;
    bulb.instanceMatrix.needsUpdate = true;

    const stemMat = stem.material as THREE.MeshStandardMaterial;
    const leafMat = leaf.material as THREE.MeshStandardMaterial;
    const bulbMat = bulb.material as THREE.MeshPhysicalMaterial;
    stemMat.opacity = reveal;
    leafMat.opacity = reveal;
    bulbMat.opacity = reveal;

    if (keyRef.current) keyRef.current.intensity = correction.keyIntensity * reveal;
    if (rimRef.current) rimRef.current.intensity = correction.rimIntensity * reveal;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Warm key, close and low — candle-adjacent warmth, not a flat
          overhead studio light. */}
      <pointLight ref={keyRef} position={[1.6, 0.4, 8.2]} color="#f0dcb0" intensity={0} distance={5} decay={2} />
      {/* Violet rim, behind the garden, separating petals from the near-
          black background with an edge highlight rather than lighting the
          whole field evenly. */}
      <pointLight ref={rimRef} position={[-0.8, 0.9, 6.6]} color="#8d76b8" intensity={0} distance={6} decay={2} />

      <instancedMesh ref={stemRef} args={[stemGeo, undefined, flowers.length]} frustumCulled={false}>
        <meshStandardMaterial color={STEM_GREEN} roughness={0.55} metalness={0} transparent opacity={0} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[leafGeo, undefined, leafInstanceCount]} frustumCulled={false}>
        <meshStandardMaterial
          color={LEAF_GREEN}
          roughness={0.5}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
        />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[bulbGeo, undefined, flowers.length]} frustumCulled={false}>
        <meshPhysicalMaterial
          roughness={0.4}
          metalness={0}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
          sheen={0.6}
          sheenColor={new THREE.Color("#fff4e0")}
          transparent
          opacity={0}
        />
      </instancedMesh>
    </group>
  );
}

export default function TulipGarden({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const mobileTier = coarsePointer || narrow;
  const count = mobileTier ? MOBILE_COUNT : DESKTOP_COUNT;
  const flowers = useMemo(() => buildLayout(count, mobileTier), [count, mobileTier]);

  return <GardenMeshes progressRef={progressRef} flowers={flowers} />;
}
