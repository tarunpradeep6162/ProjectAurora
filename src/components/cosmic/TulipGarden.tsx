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
 * petal), each reused across every instance via `InstancedMesh`, so total
 * draw calls stay at 3 regardless of how many flowers are in the field.
 *
 * Flower head, corrected during this pass: the first version used one
 * `LatheGeometry` per flower (a revolved tulip-bulb profile, 6 radial
 * segments standing in for petals). Verified live and rejected — a
 * rotationally-symmetric revolve reads as a faceted abstract solid, not a
 * flower, no matter how the profile curve is tuned, because real tulip
 * petals aren't rotationally symmetric around a shared axis; they're six
 * individually curved, overlapping shapes. Replaced with six actual petal
 * instances per flower (`buildPetalGeometry`, below): each a curved lune
 * cut from a sphere (a cheap, stock way to get a naturally cupped,
 * tapering surface with no custom vertex math), arranged around the
 * flower's own tip with alternating outer/inner tilt so they visually
 * overlap the way real tulip petals do, plus a baked vertex-colour
 * gradient (darker/recessed near the base, full colour at the tip) for a
 * shaded, non-flat read. One `InstancedMesh` still covers every petal on
 * every flower — six times the instance count, the same one draw call.
 */
const PETALS_PER_FLOWER = 6;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

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

// Raised from 90/34 — confirmed live the garden read as sparse rather
// than "covering the page." Instancing keeps this cheap regardless (one
// draw call per mesh type no matter the count): 130 flowers is still only
// 130 stems + up to 260 leaves + 780 petals.
const DESKTOP_COUNT = 130;
const MOBILE_COUNT = 46;

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

/**
 * A single tulip petal: a lune (a narrow wedge) cut from a unit sphere,
 * spanning from the pole (which becomes the petal's rounded tip) down to
 * a chosen latitude (the petal's open base). A sphere's own curvature
 * gives the petal a natural cupped, slightly bowl-shaped surface for free
 * — no custom vertex displacement needed. The geometry is then translated
 * so its local origin sits at the *base* ring's centre rather than the
 * sphere's true centre, so instancing it with `position = flower tip` and
 * `rotation = outward tilt` places the base at the flower and the tip
 * pointing away from it, exactly like a real petal's attachment.
 *
 * A vertex-colour gradient is baked in at the same time — shaded/recessed
 * near the base, full brightness at the tip — multiplied against each
 * instance's own colour at render time (`vertexColors` + `instanceColor`
 * both apply on `MeshPhysicalMaterial` without conflicting).
 */
function buildPetalGeometry(): THREE.BufferGeometry {
  const radius = 1;
  const thetaLength = Math.PI * 0.5; // pole to equator: half the sphere's height
  const geo = new THREE.SphereGeometry(
    radius,
    8,
    7,
    -Math.PI * 0.2,
    Math.PI * 0.4, // phiLength: wide enough for a rounded petal cross-section, not a full band around the sphere
    0,
    thetaLength
  );

  const baseY = radius * Math.cos(thetaLength); // 0 here (thetaLength = π/2), kept general
  geo.translate(0, -baseY, 0);

  const pos = geo.attributes.position;
  const tipY = radius - baseY;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp(pos.getY(i) / Math.max(1e-6, tipY), 0, 1);
    const shade = THREE.MathUtils.lerp(0.55, 1.0, t);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return geo;
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

/**
 * `buildLeafShape()` on its own produces a perfectly flat `ShapeGeometry`
 * — every vertex shares one normal. Confirmed live and rejected: next to
 * the garden's own point lights, a flat plane like that catches specular
 * reflection uniformly across its whole surface and reads as one blown-out
 * bright shape (the "folded gold paper" the user flagged), not a green
 * leaf with any natural shading. Bends the geometry out of plane once here
 * — more curl toward the tip, a slight channel across the width, like a
 * real blade — then recomputes normals so lighting actually varies across
 * the surface the way it does on the (already-curved) petals.
 */
function buildLeafGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ShapeGeometry(buildLeafShape(), 8);
  const pos = geo.attributes.position;
  let maxY = 0;
  for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, y / Math.max(1e-6, maxY));
    const bend = 0.05 * Math.pow(t, 1.6);
    const channel = -0.16 * x * x;
    pos.setZ(i, bend + channel);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildLayout(count: number, mobileTier: boolean): FlowerDatum[] {
  const rand = seededRandom(SEED + count);
  const flowers: FlowerDatum[] = [];

  // Cluster centers, not a grid — denser patches with open space between
  // them, not empty rows. Widened and made denser from an earlier pass —
  // confirmed live the garden read as sparse, concentrated on the right
  // edge rather than filling the frame. Still a little lighter toward the
  // far left (the hero's typography still needs its own space), but no
  // longer excludes most of the page — a narrower spread on mobile, the
  // same lesson the Relic's own x-offset already taught this project (a
  // desktop-tuned horizontal offset sits entirely outside a portrait
  // phone's much tighter horizontal FOV).
  const clusterCount = 8;
  const clusters: { x: number; y: number; z: number; r: number }[] = [];
  for (let c = 0; c < clusterCount; c++) {
    const xBase = mobileTier ? 0.1 : 0.32;
    const xSpread = mobileTier ? 0.85 : 1.65;
    clusters.push({
      x: xBase + (rand() - 0.4) * xSpread,
      y: -0.55 + (rand() - 0.5) * 0.7,
      z: FAR_Z + rand() * (NEAR_Z - FAR_Z),
      r: 0.5 + rand() * 0.6,
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
    // larger foreground elements, some partially outside the viewport" —
    // but gated to the right/center, never far left: widening the cluster
    // spread for fuller page coverage meant a large foreground bloom could
    // land directly over "FOR DHEEPIKA / PROJECT AURORA", confirmed live.
    // The far-left band stays populated (for coverage) but with smaller,
    // calmer flowers only.
    const foreground = depthFactor > 0.82 && rand() < 0.3 && x > 0.25;
    const textSafeDamping = x < 0.05 ? 0.55 : 1;

    // Calibrated against the project's own human-scale convention
    // (TarunRunner/CoupleModel target 1.7 units = a person's height) — a
    // real tulip is roughly a third of that, so a whole plant (stem +
    // bulb) lands around 0.35-0.55 units at scale 1, not the ~1-unit
    // figures the first pass used.
    const baseHeight = 0.32 + rand() * 0.18;
    const height = foreground ? baseHeight * 1.3 : baseHeight;
    const y = cluster.y + Math.sin(angle) * radius * 0.3 + (rand() - 0.5) * 0.15;

    const scaleJitter = 0.8 + rand() * 0.5;
    const scale = (foreground ? 1.15 : 0.45 + depthFactor * 0.55) * scaleJitter * textSafeDamping;

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
  const leafGeo = useMemo(() => buildLeafGeometry(), []);
  const petalGeo = useMemo(() => buildPetalGeometry(), []);

  useEffect(() => {
    return () => {
      stemGeo.dispose();
      leafGeo.dispose();
      petalGeo.dispose();
    };
  }, [stemGeo, leafGeo, petalGeo]);

  const stemRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const petalRef = useRef<THREE.InstancedMesh>(null);
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
  const petalInstanceCount = useMemo(
    () => flowers.length * PETALS_PER_FLOWER,
    [flowers]
  );

  useEffect(() => {
    const petal = petalRef.current;
    if (!petal) return;
    const color = new THREE.Color();
    let idx = 0;
    for (let i = 0; i < flowers.length; i++) {
      color.copy(flowers[i].colorMix);
      // All six petals of one flower share its assigned hue — the
      // per-vertex shading gradient baked into the geometry is what gives
      // each petal its own tonal variation, not a different colour per petal.
      for (let j = 0; j < PETALS_PER_FLOWER; j++) petal.setColorAt(idx++, color);
    }
    if (petal.instanceColor) petal.instanceColor.needsUpdate = true;
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
  const flowerQuat = useMemo(() => new THREE.Quaternion(), []);
  const ringQuat = useMemo(() => new THREE.Quaternion(), []);
  const tiltQuat = useMemo(() => new THREE.Quaternion(), []);
  const tipOffset = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    const stem = stemRef.current;
    const leaf = leafRef.current;
    const petal = petalRef.current;
    if (!group || !stem || !leaf || !petal) return;
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
    let petalIndex = 0;
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

      // Flower head: six petals fanned around the stem's tip. All six
      // share the same base position and the same "flower head" carrier
      // orientation (the stem's own lean, carried through, plus the
      // flower's individual rotation) — same reasoning as the old bulb had
      // for reading as attached rather than floating — and each petal then
      // adds its own ring position (spread around the stem) and outward
      // tilt (splaying open) on top of that shared base.
      tipOffset.set(
        Math.sin(stemLean) * f.height * f.scale,
        Math.cos(stemLean) * f.height * f.scale,
        0
      );
      position.set(bx + tipOffset.x, by + tipOffset.y, bz + tipOffset.z);
      euler.set(stemLean * 0.6, f.bulbRotationY + windSway * 0.5, windLean);
      flowerQuat.setFromEuler(euler);

      // Widened from an earlier pass's 0.14 — at that ratio (length ~2.4x
      // width) petals read as thin blade shards, not rounded petals,
      // confirmed live. Real tulip petals run closer to 1.3-1.6x longer
      // than wide.
      const petalLength = f.scale * (0.3 + f.depthFactor * 0.05);
      const petalWidth = f.scale * 0.21;
      const petalThickness = f.scale * 0.1;

      for (let j = 0; j < PETALS_PER_FLOWER; j++) {
        // Deterministic per-petal variation from the flower's own seed and
        // the petal index — real variety between petals without storing
        // extra per-flower arrays.
        const petalSeed = f.phase + j * 1.79;
        const ringAngle = (j / PETALS_PER_FLOWER) * Math.PI * 2 + Math.sin(petalSeed) * 0.12;
        // Alternating outer/inner tilt is what makes six evenly-spaced
        // petals actually read as layered and overlapping rather than a
        // single flat ring — the same "3 outer + 3 inner" structure a real
        // tulip has.
        const outer = j % 2 === 0;
        const tilt = (outer ? 0.6 : 0.42) + Math.cos(petalSeed * 1.3) * 0.07;
        const petalScaleJ = 0.92 + Math.sin(petalSeed * 2.1) * 0.08;

        ringQuat.setFromAxisAngle(Y_AXIS, ringAngle);
        tiltQuat.setFromAxisAngle(X_AXIS, tilt);
        // Tilt first (in the petal's own un-rotated frame), then spread
        // around the ring — quaternion multiplication applies the
        // right-hand operand first.
        ringQuat.multiply(tiltQuat);
        quaternion.copy(flowerQuat).multiply(ringQuat);

        scaleVec.set(
          petalWidth * petalScaleJ,
          petalLength * petalScaleJ,
          petalThickness * petalScaleJ
        );
        matrix.compose(position, quaternion, scaleVec);
        petal.setMatrixAt(petalIndex, matrix);
        petalIndex++;
      }

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
        // Halved from an earlier pass — leaves were reading as large as or
        // larger than the flowers themselves, overpowering them. Leaves
        // are a supporting element here, not the visual focus.
        scaleVec.setScalar(f.scale * (0.55 + f.depthFactor * 0.12));
        matrix.compose(position, quaternion, scaleVec);
        leaf.setMatrixAt(leafIndex, matrix);
        leafIndex++;
      }
    }

    stem.instanceMatrix.needsUpdate = true;
    leaf.instanceMatrix.needsUpdate = true;
    petal.instanceMatrix.needsUpdate = true;

    const stemMat = stem.material as THREE.MeshStandardMaterial;
    const leafMat = leaf.material as THREE.MeshStandardMaterial;
    const petalMat = petal.material as THREE.MeshPhysicalMaterial;
    stemMat.opacity = reveal;
    // Leaves recede behind the flowers rather than competing with them —
    // never fully opaque even at full reveal.
    leafMat.opacity = reveal * 0.6;
    petalMat.opacity = reveal;

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
        {/* Roughness raised from 0.5 — even with the geometry itself now
            curved (see buildLeafGeometry), a lower roughness still let
            the point lights catch a hard, unnaturally uniform highlight
            across a thin blade at close range. */}
        <meshStandardMaterial
          color={LEAF_GREEN}
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
        />
      </instancedMesh>
      <instancedMesh
        ref={petalRef}
        args={[petalGeo, undefined, petalInstanceCount]}
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          vertexColors
          roughness={0.32}
          metalness={0}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
          sheen={0.7}
          sheenColor={new THREE.Color("#fff4e0")}
          side={THREE.DoubleSide}
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
