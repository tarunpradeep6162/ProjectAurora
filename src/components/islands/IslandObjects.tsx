"use client";

import type { ReactElement } from "react";
import * as THREE from "three";
import type { IslandObjectName } from "./islandData";
import { OBJECT_OFFSETS, WORLD_SCALE } from "./islandData";

const SHARED_MATERIAL_PROPS = { transparent: true, opacity: 0 } as const;

function Chair({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.56, 0.07, 0.56]} />
        <meshStandardMaterial color={color} roughness={0.7} {...SHARED_MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0.78, -0.25]}>
        <boxGeometry args={[0.56, 0.66, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.7} {...SHARED_MATERIAL_PROPS} />
      </mesh>
      {[[-0.23, -0.23], [0.23, -0.23], [-0.23, 0.23], [0.23, 0.23]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.7} {...SHARED_MATERIAL_PROPS} />
        </mesh>
      ))}
    </group>
  );
}

function PaperBoat({ color }: { color: string }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.42, 0.34, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.6}
          flatShading
          side={THREE.DoubleSide}
          {...SHARED_MATERIAL_PROPS}
        />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.3, 0.62, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.6}
          flatShading
          side={THREE.DoubleSide}
          {...SHARED_MATERIAL_PROPS}
        />
      </mesh>
    </group>
  );
}

function MusicBox({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.72, 0.48, 0.52]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} {...SHARED_MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0.52, -0.2]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.72, 0.06, 0.52]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} {...SHARED_MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0.68, 0.04]}>
        <coneGeometry args={[0.1, 0.34, 6]} />
        <meshStandardMaterial
          color="#fff3d6"
          emissive="#ffd79a"
          emissiveIntensity={2.4}
          {...SHARED_MATERIAL_PROPS}
        />
      </mesh>
    </group>
  );
}

const BLOSSOM_CLUSTERS: [number, number, number, number][] = [
  [0, 1.85, 0, 0.78],
  [0.42, 1.55, 0.16, 0.5],
  [-0.38, 1.62, -0.2, 0.46],
  [0.1, 2.2, -0.3, 0.4],
];

function BlossomTree({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.09, 0.15, 1.6, 6]} />
        <meshStandardMaterial color="#4a3348" roughness={0.85} {...SHARED_MATERIAL_PROPS} />
      </mesh>
      {BLOSSOM_CLUSTERS.map(([x, y, z, radius], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[radius, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.55}
            roughness={0.6}
            flatShading
            {...SHARED_MATERIAL_PROPS}
          />
        </mesh>
      ))}
    </group>
  );
}

function Lantern({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.22, 0.22, 0.44, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.2}
        {...SHARED_MATERIAL_PROPS}
      />
    </mesh>
  );
}

function Waterfall({ color }: { color: string }) {
  return (
    <mesh position={[0, -0.6, 0]}>
      <planeGeometry args={[1.5, 3.4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.1}
        side={THREE.DoubleSide}
        depthWrite={false}
        {...SHARED_MATERIAL_PROPS}
      />
    </mesh>
  );
}

const CRYSTAL_CLUSTER: { position: [number, number, number]; scale: number }[] = [
  { position: [0, 0.4, 1], scale: 1 },
  { position: [0.5, 0.12, 0.66], scale: 0.66 },
  { position: [-0.42, 0.14, 0.78], scale: 0.62 },
];

function HealingCrystals({ color }: { color: string }) {
  return (
    <group>
      {CRYSTAL_CLUSTER.map(({ position, scale }, i) => (
        <mesh key={i} position={position} scale={scale} rotation={[0.1, i, 0.08]}>
          <octahedronGeometry args={[0.42, 0]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            roughness={0.08}
            transmission={0.7}
            thickness={0.8}
            ior={1.5}
            {...SHARED_MATERIAL_PROPS}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The original's "first meeting" object was a small rigged figure; this is a
 * simplified stand-in — two soft silhouettes close together, lit from
 * warm above rather than an animated character.
 */
function FirstMeetingFigures() {
  return (
    <group>
      <pointLight color="#ffb27a" intensity={2.4} distance={2.4} decay={2} position={[0, 0.9, 0]} />
      {[-0.14, 0.14].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.46, 0]}>
            <capsuleGeometry args={[0.17, 0.5, 4, 8]} />
            <meshStandardMaterial color="#3a2a3a" roughness={0.85} {...SHARED_MATERIAL_PROPS} />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color="#4a3548" roughness={0.85} {...SHARED_MATERIAL_PROPS} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const OBJECT_COMPONENTS: Record<
  IslandObjectName,
  (props: { color: string }) => ReactElement
> = {
  chair: Chair,
  paperBoat: PaperBoat,
  musicBox: MusicBox,
  blossomTree: BlossomTree,
  lantern: Lantern,
  waterfall: Waterfall,
  healingCrystals: HealingCrystals,
  firstMeeting: FirstMeetingFigures,
};

/**
 * The colour each object reads from — the original's per-object choice, a
 * mix of the island's vegetation, weather and crystal tints.
 */
function objectColor(
  name: IslandObjectName,
  scene: { vegetation: { color: string }; weather: { color: string }; light: { key: string }; crystal: string }
): string {
  switch (name) {
    case "chair":
      return scene.vegetation.color;
    case "paperBoat":
    case "lantern":
    case "waterfall":
      return scene.weather.color;
    case "musicBox":
      return scene.light.key;
    case "blossomTree":
      return scene.vegetation.color;
    case "healingCrystals":
      return scene.crystal;
    case "firstMeeting":
      return scene.light.key;
  }
}

/**
 * Renders this island's 1-2 signature objects at their authored offsets,
 * shrunk to fit the island's smaller scale.
 */
export default function IslandObjects({
  objects,
  scene,
}: {
  objects: IslandObjectName[];
  scene: {
    vegetation: { color: string };
    weather: { color: string };
    light: { key: string };
    crystal: string;
  };
}) {
  return (
    <group scale={WORLD_SCALE}>
      {objects.map((name) => {
        const Component = OBJECT_COMPONENTS[name];
        return (
          <group key={name} position={OBJECT_OFFSETS[name]}>
            <Component color={objectColor(name, scene)} />
          </group>
        );
      })}
    </group>
  );
}
