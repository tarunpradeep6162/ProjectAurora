"use client";

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { theatreMemoryBlocks } from "@/theatre/auroraProject";
import { relicXOffset } from "./AuroraRelic";

/**
 * Secondary story objects for the hero — originally staged around the
 * Aurora Relic; kept (subtler, fewer, biased deeper into the scene) after
 * the tulip garden replaced the Relic as the hero's primary visual, per
 * the brief's own instruction not to drop the block concept entirely, just
 * demote it. Three `InstancedMesh` groups, one per material family (dark
 * glass / champagne / rose), each reusing one shared `RoundedBoxGeometry`
 * — a real bevel, not a plain `BoxGeometry`. Deterministic seeded layout
 * (`seededRandom` below), never `Math.random()` — the same block occupies
 * the same place on every visit. `relicXOffset` (still imported from
 * `AuroraRelic.tsx`, which remains on disk unmounted) is reused verbatim
 * for its x-positioning logic rather than duplicated.
 *
 * Not implemented this pass: true per-instance opacity (would need a
 * custom shader or vertex-color channel; each material group instead fades
 * as one group, which reads correctly at this scale) and photographic
 * texture on individual blocks (the brief's "block → photo" transition
 * system) — see AURORA_V3_ARCHITECTURE.md for what's deferred and why.
 */

type MaterialGroup = "dark" | "champagne" | "rose";
type Shape = "slab" | "cuboid" | "monolith";

type BlockDatum = {
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  scale: THREE.Vector3;
  shape: Shape;
  group: MaterialGroup;
  depthFactor: number; // 0 (far) .. 1 (near) — how strongly this block parallaxes with the pointer
  phase: number; // desyncs idle drift between blocks
  driftSpeed: number;
};

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SHAPES: Shape[] = ["slab", "cuboid", "monolith"];
const SHAPE_DIMENSIONS: Record<Shape, [number, number, number]> = {
  slab: [0.62, 0.32, 0.06],
  cuboid: [0.14, 0.6, 0.14],
  monolith: [0.3, 0.42, 0.24],
};

/**
 * Relic's own resting position (AuroraRelic.tsx) — blocks scatter around
 * this point, not the world origin, so the two systems read as one
 * composition. X is intentionally 0 here: the Relic's own x is now
 * viewport-aspect-responsive (`relicXOffset`, so it stays framed on a
 * narrow mobile viewport instead of sitting entirely outside it — a real
 * issue found while testing at 375×812), and `InstancedGroup`'s own
 * `useFrame` adds that same live offset to every block's x at render time,
 * the same way it already adds idle drift and pointer parallax, rather
 * than baking one fixed offset into this stable, seeded layout.
 */
const RELIC_CENTER = new THREE.Vector3(0, 0.15, 6.92);

function buildBlocks(count: number): BlockDatum[] {
  const rand = seededRandom(20251125); // 25 November — this project's one recurring seed
  const blocks: BlockDatum[] = [];
  for (let i = 0; i < count; i++) {
    const shape = SHAPES[Math.floor(rand() * SHAPES.length)];
    const roll = rand();
    const group: MaterialGroup = roll < 0.62 ? "dark" : roll < 0.88 ? "champagne" : "rose";

    // Depth band, biased toward "far" now — "a few dark glass memory
    // monoliths deeper among the flowers", not sharing the tulip garden's
    // own near-camera foreground.
    const bandRoll = rand();
    const depthFactor = bandRoll < 0.15 ? 0.7 + rand() * 0.15 : bandRoll < 0.45 ? 0.3 + rand() * 0.25 : rand() * 0.25;
    const z = RELIC_CENTER.z - 2.6 + depthFactor * 3.6 + (rand() - 0.5) * 0.4;

    const angle = rand() * Math.PI * 2;
    const radius = 0.9 + rand() * 2.1;
    const x = RELIC_CENTER.x + Math.cos(angle) * radius * (0.5 + depthFactor * 0.5);
    const y = RELIC_CENTER.y + (rand() - 0.5) * 2.2;

    const [w, h, d] = SHAPE_DIMENSIONS[shape];
    const scaleJitter = 0.7 + rand() * 0.8;

    blocks.push({
      basePosition: new THREE.Vector3(x, y, z),
      baseRotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI * 0.3),
      scale: new THREE.Vector3(w * scaleJitter, h * scaleJitter, d * scaleJitter),
      shape,
      group,
      depthFactor,
      phase: rand() * Math.PI * 2,
      driftSpeed: 0.05 + rand() * 0.06,
    });
  }
  return blocks;
}

const MATERIAL_CONFIG: Record<
  MaterialGroup,
  { color: string; roughness: number; metalness: number; opacity: number }
> = {
  // Opacity lowered from the Relic era for the same "very subtle" reason
  // as the count above.
  dark: { color: "#0c0c10", roughness: 0.22, metalness: 0.35, opacity: 0.62 },
  champagne: { color: "#d9b98a", roughness: 0.3, metalness: 0.1, opacity: 0.38 },
  rose: { color: "#8a6270", roughness: 0.32, metalness: 0.12, opacity: 0.34 },
};

/** Presence across the portal chapter — later and subtler than the Relic's own reveal ("blocks remain mostly hidden" until late in the hero beat sequence), and never fully opaque even at peak. */
function stagePortal(active: boolean, chapterProgress: number): number {
  if (!active) return 0;
  const rise = THREE.MathUtils.smoothstep(chapterProgress, 0.5, 0.85);
  const fall = 1 - THREE.MathUtils.smoothstep(chapterProgress, 0.9, 1);
  return rise * fall;
}

function InstancedGroup({
  geometry,
  group,
  blocks,
  progressRef,
  pointerRef,
  mobileTier,
}: {
  geometry: THREE.BufferGeometry;
  group: MaterialGroup;
  blocks: BlockDatum[];
  progressRef: RefObject<SceneProgressRef>;
  pointerRef: RefObject<{ sx: number; sy: number }>;
  mobileTier: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const presenceRef = useRef(0);
  const timeRef = useRef(0);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const config = MATERIAL_CONFIG[group];

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material || blocks.length === 0) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const dt = Math.min(delta, 0.1);
    const xOffset = relicXOffset(mobileTier);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "portal");
    const target = stagePortal(active, progress.chapterProgress);
    presenceRef.current += (target - presenceRef.current) * Math.min(1, dt * 2);
    const presence = presenceRef.current;

    mesh.visible = presence > 0.01;
    if (!mesh.visible) return;

    timeRef.current += dt;
    const t = timeRef.current;
    const pointer = pointerRef.current;
    const assembly = theatreMemoryBlocks.value.assembly;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const drift = Math.sin(t * b.driftSpeed + b.phase) * 0.06;
      const driftY = Math.cos(t * b.driftSpeed * 0.8 + b.phase) * 0.05;
      // Parallax scales with depth — near blocks move more than far ones.
      const parallaxScale = 0.35 * b.depthFactor;

      const px =
        xOffset +
        b.basePosition.x * assembly +
        drift +
        (pointer?.sx ?? 0) * parallaxScale;
      const py = b.basePosition.y * assembly + driftY + (pointer?.sy ?? 0) * parallaxScale;
      const pz = b.basePosition.z;

      matrix.compose(
        new THREE.Vector3(px, py, pz),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            b.baseRotation.x + t * 0.02 * b.driftSpeed,
            b.baseRotation.y + t * 0.015 * b.driftSpeed,
            b.baseRotation.z
          )
        ),
        b.scale
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    material.opacity = config.opacity * presence;
  });

  if (blocks.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, blocks.length]} frustumCulled={false}>
      <meshPhysicalMaterial
        ref={materialRef}
        color={config.color}
        roughness={config.roughness}
        metalness={config.metalness}
        clearcoat={0.3}
        clearcoatRoughness={0.4}
        transparent
        opacity={0}
      />
    </instancedMesh>
  );
}

function BlockField({
  progressRef,
  count,
  mobileTier,
}: {
  progressRef: RefObject<SceneProgressRef>;
  count: number;
  mobileTier: boolean;
}) {
  const pointerRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  const geometries = useMemo(
    () => ({
      slab: new RoundedBoxGeometry(1, 1, 1, 2, 0.06),
      cuboid: new RoundedBoxGeometry(1, 1, 1, 2, 0.05),
      monolith: new RoundedBoxGeometry(1, 1, 1, 2, 0.07),
    }),
    []
  );

  useEffect(() => {
    return () => {
      geometries.slab.dispose();
      geometries.cuboid.dispose();
      geometries.monolith.dispose();
    };
  }, [geometries]);

  const blocks = useMemo(() => buildBlocks(count), [count]);
  const byShapeAndGroup = useMemo(() => {
    const map = new Map<Shape, Map<MaterialGroup, BlockDatum[]>>();
    for (const shape of SHAPES) map.set(shape, new Map());
    for (const b of blocks) {
      const shapeMap = map.get(b.shape)!;
      const list = shapeMap.get(b.group) ?? [];
      list.push(b);
      shapeMap.set(b.group, list);
    }
    return map;
  }, [blocks]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = pointerRef.current;
      p.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      p.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const p = pointerRef.current;
    const dt = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-dt / 0.5);
    p.sx += (p.x - p.sx) * k;
    p.sy += (p.y - p.sy) * k;
  });

  const groups: ReactNode[] = [];
  for (const shape of SHAPES) {
    const shapeMap = byShapeAndGroup.get(shape)!;
    for (const group of ["dark", "champagne", "rose"] as MaterialGroup[]) {
      const list = shapeMap.get(group);
      if (!list || list.length === 0) continue;
      groups.push(
        <InstancedGroup
          key={`${shape}-${group}`}
          geometry={geometries[shape]}
          group={group}
          blocks={list}
          progressRef={progressRef}
          pointerRef={pointerRef}
          mobileTier={mobileTier}
        />
      );
    }
  }

  return <>{groups}</>;
}

export default function MemoryBlocks({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const mobileTier = coarsePointer || narrow;
  // Reduced from the Relic-era count: the brief that replaced the Relic
  // with the tulip garden wants these "very subtle... deeper among the
  // flowers" now, secondary story objects rather than a competing field.
  const count = mobileTier ? 4 : 8;

  return <BlockField progressRef={progressRef} count={count} mobileTier={mobileTier} />;
}
