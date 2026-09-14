"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import IslandObjects from "./IslandObjects";
import { ISLAND_RADIUS, WORLD_SCALE, type IslandScene, type WeatherKind } from "./islandData";

/** Per-island activation, written every frame by `IslandField`. */
export type IslandMotion = {
  /** 0-1: how in-focus this island currently is. */
  opacity: number;
};

// Reused every frame to write instance matrices; never read back.
const scratch = new THREE.Object3D();

/** Deterministic scatter across a disc — the original's golden-angle placement. */
function scatterDisc(count: number, radius: number, seed: number) {
  const points: { x: number; z: number; scale: number; phase: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963 + seed;
    const r = radius * Math.sqrt(((i * 0.618034 + seed * 0.31) % 1));
    points.push({
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      scale: 0.5 + ((i * 0.37 + seed) % 1) * 0.7,
      phase: (i * 0.53 + seed) % (Math.PI * 2),
    });
  }
  return points;
}

/** Weather particle box size, per kind — the original's [width, height] pairs. */
function weatherBoxSize(kind: WeatherKind): [number, number] {
  if (kind === "rain") return [0.02, 0.34];
  if (kind === "spray") return [0.05, 0.05];
  if (kind === "lanterns") return [0.11, 0.11];
  return [0.07, 0.07];
}

/** Sets `material.opacity` on every mesh under `root` — the original's approach to fading a whole object group as one. */
function setGroupOpacity(root: THREE.Object3D, opacity: number) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      for (const m of materials) {
        if (m && "opacity" in m && (m as THREE.Material).transparent) {
          (m as THREE.Material & { opacity: number }).opacity = opacity;
        }
      }
    }
  });
}

/**
 * One of the five little scenes behind Chapter 03's timeline: a terrain
 * patch, themed vegetation and weather, a signature object, and two-point
 * lighting — all shrunk from the original's scale (see `WORLD_SCALE`) to sit
 * as a quiet vignette in this project's cosmic backdrop rather than a
 * landscape competing with it.
 */
export default function Island({
  scene,
  motion,
  compact,
  reduced,
  seed,
}: {
  scene: IslandScene;
  motion: RefObject<IslandMotion>;
  compact: boolean;
  reduced: boolean;
  /** Any stable number distinct per island, for deterministic particle scatter. */
  seed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const terrainMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rimMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const vegetationRef = useRef<THREE.InstancedMesh>(null);
  const weatherRef = useRef<THREE.InstancedMesh>(null);
  const objectsRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const crystalMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const crystalLightRef = useRef<THREE.PointLight>(null);

  const vegetationCount = Math.round(scene.vegetation.count * (compact ? 0.5 : 1));
  const weatherCount = Math.round(scene.weather.count * (compact ? 0.45 : 1));
  const vegetationScatter = useMemo(
    () => scatterDisc(vegetationCount, ISLAND_RADIUS * 0.82, seed),
    [vegetationCount, seed]
  );
  const weatherScatter = useMemo(
    () => scatterDisc(weatherCount, ISLAND_RADIUS * 1.15, seed + 7),
    [weatherCount, seed]
  );
  const [weatherW, weatherH] = weatherBoxSize(scene.weather.kind);
  const falls = scene.weather.kind === "rain" || scene.weather.kind === "petals";
  const segments = compact ? 24 : 48;

  useFrame((state) => {
    const opacity = motion.current.opacity;
    const group = groupRef.current;
    if (!group) return;
    group.visible = opacity > 0.01;
    if (!group.visible) return;

    const t = state.clock.elapsedTime;
    if (terrainMatRef.current) terrainMatRef.current.opacity = opacity;
    if (rimMatRef.current) rimMatRef.current.opacity = opacity;
    if (objectsRef.current) setGroupOpacity(objectsRef.current, opacity);
    if (keyLightRef.current) keyLightRef.current.intensity = scene.light.intensity * opacity * WORLD_SCALE;
    if (rimLightRef.current) rimLightRef.current.intensity = scene.light.intensity * 0.5 * opacity * WORLD_SCALE;
    if (crystalMatRef.current) crystalMatRef.current.opacity = opacity;
    if (crystalRef.current && !reduced) {
      crystalRef.current.rotation.y = t * 0.5;
      crystalRef.current.position.y = ISLAND_RADIUS * 0.5 + Math.sin(t * 0.8) * ISLAND_RADIUS * 0.03;
    }
    if (crystalLightRef.current) crystalLightRef.current.intensity = opacity * WORLD_SCALE * 6;

    const vegetation = vegetationRef.current;
    if (vegetation) {
      vegetationScatter.forEach((p, i) => {
        const bob = reduced ? 0 : Math.sin(t * 1.1 + p.phase) * 0.14 * WORLD_SCALE;
        scratch.position.set(p.x, bob, p.z);
        scratch.rotation.set(bob, p.phase, bob * 0.5);
        scratch.scale.setScalar(Math.max(1e-4, p.scale * WORLD_SCALE * opacity));
        scratch.updateMatrix();
        vegetation.setMatrixAt(i, scratch.matrix);
      });
      vegetation.instanceMatrix.needsUpdate = true;
    }

    const weather = weatherRef.current;
    if (weather) {
      const span = ISLAND_RADIUS * 1.4;
      weatherScatter.forEach((p, i) => {
        const rate = reduced ? 0 : t * (falls ? 2.2 : 0.35);
        const y = falls
          ? span - ((rate + p.phase * 2) % (span * 1.4))
          : ISLAND_RADIUS * 0.28 + Math.sin(t * 0.6 + p.phase) * 0.7 * WORLD_SCALE + p.scale * WORLD_SCALE;
        const x = p.x + (falls ? 0 : Math.sin(t * 0.3 + p.phase) * 0.4 * WORLD_SCALE);
        scratch.position.set(x, y, p.z);
        scratch.rotation.set(0, p.phase, falls ? 0 : rate * 0.4);
        scratch.scale.setScalar(Math.max(1e-4, p.scale * WORLD_SCALE * opacity));
        scratch.updateMatrix();
        weather.setMatrixAt(i, scratch.matrix);
      });
      weather.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh position={[0, -ISLAND_RADIUS * 0.18, 0]}>
        <coneGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS * 0.68, segments]} />
        <meshStandardMaterial
          ref={terrainMatRef}
          color={scene.terrain}
          roughness={0.82}
          metalness={0.05}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh position={[0, ISLAND_RADIUS * 0.144, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ISLAND_RADIUS * 0.99, segments]} />
        <meshStandardMaterial
          ref={rimMatRef}
          color={scene.terrain}
          emissive={scene.light.rim}
          emissiveIntensity={0.35}
          roughness={0.7}
          transparent
          opacity={0}
        />
      </mesh>

      <instancedMesh ref={vegetationRef} args={[undefined, undefined, Math.max(1, vegetationCount)]}>
        {scene.vegetation.kind === "blossom" ? (
          <icosahedronGeometry args={[0.34 * WORLD_SCALE, 0]} />
        ) : (
          <coneGeometry args={[0.12 * WORLD_SCALE, 1.1 * WORLD_SCALE, 5]} />
        )}
        <meshStandardMaterial
          color={scene.vegetation.color}
          emissive={scene.vegetation.color}
          emissiveIntensity={0.5}
          roughness={0.5}
          transparent
          opacity={0}
        />
      </instancedMesh>

      <instancedMesh ref={weatherRef} args={[undefined, undefined, Math.max(1, weatherCount)]}>
        <boxGeometry args={[weatherW * WORLD_SCALE, weatherH * WORLD_SCALE, weatherW * WORLD_SCALE]} />
        <meshStandardMaterial
          color={scene.weather.color}
          emissive={scene.weather.color}
          emissiveIntensity={scene.weather.kind === "lanterns" ? 3.5 : 1.4}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>

      <group ref={objectsRef}>
        <IslandObjects objects={scene.objects} scene={scene} />
      </group>

      {/* A small glowing accent in place of the original's particle-swarm crystal halo. */}
      <mesh ref={crystalRef} position={[0, ISLAND_RADIUS * 0.5, 0]}>
        <octahedronGeometry args={[0.62 * WORLD_SCALE, 0]} />
        <meshPhysicalMaterial
          ref={crystalMatRef}
          color={scene.crystal}
          emissive={scene.crystal}
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.05}
          transmission={0.75}
          thickness={1.1}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0}
        />
      </mesh>
      <pointLight ref={crystalLightRef} color={scene.crystal} intensity={0} distance={ISLAND_RADIUS * 2.2} position={[0, ISLAND_RADIUS * 0.5, 0]} />

      <pointLight
        ref={keyLightRef}
        color={scene.light.key}
        intensity={0}
        distance={16 * WORLD_SCALE}
        position={[0, 3.4 * WORLD_SCALE, 2 * WORLD_SCALE]}
      />
      <pointLight
        ref={rimLightRef}
        color={scene.light.rim}
        intensity={0}
        distance={14 * WORLD_SCALE}
        position={[-2.5 * WORLD_SCALE, 1.6 * WORLD_SCALE, -3 * WORLD_SCALE]}
      />
    </group>
  );
}
