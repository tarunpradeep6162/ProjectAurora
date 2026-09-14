"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * Chapter 03's centrepiece: a real WebGL living-wall of plants, straight
 * ahead of the camera and vertically centred, that the story's five
 * timeline entries slowly turn past as the visitor scrolls — the
 * persistent-3D-object-anchoring-a-scrolling-narrative feel of a site like
 * Active Theory's, reinterpreted here as this project's own image (a
 * vertical garden, matched against a reference photo of one) rather than
 * anything copied from theirs.
 *
 * Positioned dynamically every frame from the live camera (`camera.
 * getWorldDirection` + `camera.position`), not a hand-picked static world
 * coordinate: the site's camera arc (CAMERA_KEYS in CosmicScene.tsx) is a
 * continuously-evaluated spline, not a fixed pose per chapter, so "centre
 * straight ahead of camera" has to be computed live to actually stay
 * centred and straight rather than only being correct at one scroll
 * position. `group.lookAt(camera.position)` every frame keeps its flat
 * face turned toward the viewer the same way.
 *
 * "Rolling with each story": chapterProgress (0-1 across the whole pinned
 * chapter, the same value ChapterTimeline.tsx's own ScrollTrigger scrubs
 * its five captions with) drives a slow continuous turn on top of a very
 * small idle spin — so the wall visibly turns further with every story
 * beat the visitor scrolls through, scrub-tied rather than snapping per
 * entry, matching this project's own GSAP-scrub convention elsewhere.
 *
 * Built from the same primitives as the rest of this scene: two
 * `InstancedMesh` leaf shapes (a slender fern blade and a rounder broad
 * leaf, both the curved-`ShapeGeometry` technique `TulipGarden.tsx`
 * established for foliage) plus a sparse third layer of small pale
 * blossoms — a quiet, deliberate romantic touch, not the reference photo's
 * literal content — over a simple warm-wood planter box.
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
const DISTANCE_AHEAD = 3.1;

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
};

function buildLeaves(count: number): LeafDatum[] {
  const rand = seededRandom(SEED + count);
  const leaves: LeafDatum[] = [];
  const halfW = WALL_WIDTH / 2;
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * WALL_WIDTH * 1.02;
    // Denser toward the bottom (where the planter feeds it) and a soft
    // taper at the very top edge, rather than a hard-edged rectangle of
    // foliage.
    const yRaw = rand();
    const y = (yRaw - 0.5) * WALL_HEIGHT;
    const edgeFade = 1 - Math.pow(Math.abs(x) / halfW, 3) * 0.4;
    if (rand() > edgeFade) continue;
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
    });
  }
  return leaves;
}

type BlossomDatum = { x: number; y: number; z: number; scale: number };
function buildBlossoms(count: number): BlossomDatum[] {
  const rand = seededRandom(SEED + count + 7);
  const blossoms: BlossomDatum[] = [];
  for (let i = 0; i < count; i++) {
    blossoms.push({
      x: (rand() - 0.5) * WALL_WIDTH * 0.9,
      y: (rand() - 0.5) * WALL_HEIGHT * 0.85,
      z: (rand() - 0.5) * 0.1 + 0.09,
      scale: 0.5 + rand() * 0.5,
    });
  }
  return blossoms;
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

  const leaves = useMemo(() => buildLeaves(leafCount), [leafCount]);
  const blossoms = useMemo(() => buildBlossoms(blossomCount), [blossomCount]);

  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const fernRef = useRef<THREE.InstancedMesh>(null);
  const broadRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  const presenceRef = useRef(0);
  const timeRef = useRef(0);
  const spinRef = useRef(0);

  const fernGeo = useMemo(() => buildLeafGeometry(buildFernShape(), 0.05), []);
  const broadGeo = useMemo(() => buildLeafGeometry(buildBroadShape(), 0.07), []);
  const blossomGeo = useMemo(() => new THREE.SphereGeometry(0.028, 6, 5), []);
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
      boxGeo.dispose();
    };
  }, [fernGeo, broadGeo, blossomGeo, boxGeo]);

  useEffect(() => {
    const fern = fernRef.current;
    const broad = broadRef.current;
    const blossom = blossomRef.current;
    if (!fern || !broad || !blossom) return;
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
  }, [leaves, blossoms]);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const fern = fernRef.current;
    const broad = broadRef.current;
    if (!fern || !broad) return;
    let fi = 0;
    let bi = 0;
    for (const leaf of leaves) {
      position.set(leaf.x, leaf.y, leaf.z);
      euler.set(leaf.tiltX, leaf.rotY, leaf.tiltZ);
      quaternion.setFromEuler(euler);
      scaleVec.setScalar(leaf.scale * (leaf.kind === 0 ? 1.4 : 1));
      matrix.compose(position, quaternion, scaleVec);
      if (leaf.kind === 0) fern.setMatrixAt(fi++, matrix);
      else broad.setMatrixAt(bi++, matrix);
    }
    fern.instanceMatrix.needsUpdate = true;
    broad.instanceMatrix.needsUpdate = true;

    const blossom = blossomRef.current;
    if (blossom) {
      let idx = 0;
      for (const b of blossoms) {
        position.set(b.x, b.y, b.z);
        quaternion.identity();
        scaleVec.setScalar(b.scale);
        matrix.compose(position, quaternion, scaleVec);
        blossom.setMatrixAt(idx++, matrix);
      }
      blossom.instanceMatrix.needsUpdate = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves, blossoms]);

  useFrame((_state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    const fern = fernRef.current;
    const broad = broadRef.current;
    const blossom = blossomRef.current;
    const box = boxRef.current;
    if (!group || !fern || !broad || !blossom || !box) return;
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

    camera.getWorldDirection(forward);
    anchor.copy(camera.position).addScaledVector(forward, DISTANCE_AHEAD);
    group.position.copy(anchor);
    lookTarget.copy(camera.position);
    group.lookAt(lookTarget);
    group.rotateY(idleSpin + scrollSpin);

    if (keyRef.current) {
      keyRef.current.position.copy(camera.position).addScaledVector(forward, DISTANCE_AHEAD * 0.55);
      keyRef.current.position.y += 0.8;
      keyRef.current.intensity = 2.6 * presence;
    }
    if (rimRef.current) {
      rimRef.current.position.copy(anchor);
      rimRef.current.position.y += 0.6;
      rimRef.current.intensity = 1.4 * presence;
    }

    (fern.material as THREE.MeshStandardMaterial).opacity = presence;
    (broad.material as THREE.MeshStandardMaterial).opacity = presence;
    (blossom.material as THREE.MeshStandardMaterial).opacity = presence;
    (box.material as THREE.MeshStandardMaterial).opacity = presence;
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight ref={keyRef} color="#fbead0" intensity={0} distance={5} decay={2} />
      <pointLight ref={rimRef} color="#8fd0a8" intensity={0} distance={4.5} decay={2} />

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
    </group>
  );
}
