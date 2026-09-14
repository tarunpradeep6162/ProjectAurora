"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { CakeMotion } from "./cakeMotion";

/** Bottom to top. Measurements are the original cake's, unchanged. */
const TIERS = [
  { y: -0.55, rTop: 1.5, rBottom: 1.62, h: 0.62 },
  { y: 0.12, rTop: 1.08, rBottom: 1.2, h: 0.58 },
  { y: 0.68, rTop: 0.72, rBottom: 0.84, h: 0.52 },
] as const;

const DOLLOPS = 22;
const DRIPS = 9;
const PEARLS = 14;

/** Top of the top tier, in cake space. The candles stand here. */
export const CAKE_TOP = TIERS[2].y + TIERS[2].h / 2;

const FROSTING = {
  roughness: 0.92,
  metalness: 0,
  clearcoat: 0,
  emissive: "#000000",
  emissiveIntensity: 0,
} as const;

/** Piped dollops round each tier's top edge and drips down its side, as one mesh per tier. */
function buildFrostingDetail(tierIndex: number): THREE.BufferGeometry {
  const tier = TIERS[tierIndex];
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < DOLLOPS; i++) {
    const a = (i / DOLLOPS) * Math.PI * 2;
    const g = new THREE.SphereGeometry(0.07, 10, 8);
    g.translate(Math.cos(a) * tier.rTop * 0.97, tier.h / 2, Math.sin(a) * tier.rTop * 0.97);
    parts.push(g);
  }
  for (let i = 0; i < DRIPS; i++) {
    const a = (i / DRIPS) * Math.PI * 2 + tierIndex;
    const length = 0.12 + ((i * 0.37 + tierIndex * 0.21) % 1) * 0.22;
    const g = new THREE.CapsuleGeometry(0.045, length, 4, 8);
    g.translate(
      Math.cos(a) * tier.rTop * 0.99,
      tier.h / 2 - length / 2,
      Math.sin(a) * tier.rTop * 0.99
    );
    parts.push(g);
  }
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Pearls round every tier's base. One material, so one mesh for the whole cake. */
function buildPearls(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const tier of TIERS) {
    for (let i = 0; i < PEARLS; i++) {
      const a = (i / PEARLS) * Math.PI * 2;
      const g = new THREE.SphereGeometry(0.035, 10, 8);
      g.translate(
        Math.cos(a) * tier.rBottom * 0.99,
        tier.y - tier.h / 2 + 0.09,
        Math.sin(a) * tier.rBottom * 0.99
      );
      parts.push(g);
    }
  }
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * The gold ribbon round each tier's base. The original placed each torus
 * without rotating it, which stands it upright as a hoop through the cake
 * rather than wrapping the tier; turned flat here so it sits as a band.
 */
function buildRibbons(): THREE.BufferGeometry {
  const parts = TIERS.map((tier) => {
    const g = new THREE.TorusGeometry(tier.rBottom * 0.99, 0.026, 10, 64);
    g.rotateX(Math.PI / 2);
    g.translate(0, tier.y - tier.h / 2 + 0.03, 0);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * The name on the gold plaque, drawn once to a texture. Unlit, dark brown
 * lettering, spaced a little open, the way the original rendered it.
 */
function buildNameTexture(name: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1100;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = "500 150px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3a2418";
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "12px";
    }
    ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function Cake({
  motion,
  reduced,
  name,
  children,
}: {
  motion: RefObject<CakeMotion>;
  reduced: boolean;
  name: string;
  /** The candles, which have to stand on the cake and move with it. */
  children?: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRefs = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const nameRef = useRef<THREE.MeshBasicMaterial>(null);
  const plaqueRef = useRef<THREE.MeshStandardMaterial>(null);
  const ribbonRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const frosting = useMemo(() => TIERS.map((_, i) => buildFrostingDetail(i)), []);
  const pearls = useMemo(() => buildPearls(), []);
  const ribbons = useMemo(() => buildRibbons(), []);
  const [nameTexture] = useState(() => buildNameTexture(name));

  useEffect(
    () => () => {
      frosting.forEach((g) => g.dispose());
      pearls.dispose();
      ribbons.dispose();
      nameTexture.dispose();
    },
    [frosting, pearls, ribbons, nameTexture]
  );

  useFrame((state) => {
    const group = groupRef.current;
    const m = motion.current;
    if (!group) return;

    group.visible = m.present > 0.01;
    if (!group.visible) return;

    const t = reduced ? 0 : state.clock.elapsedTime;
    group.position.y = -2.6 + m.lift * 2.2 + Math.sin(t * 0.35) * 0.04;
    group.scale.setScalar(0.6 + m.present * 0.4);
    if (!reduced) group.rotation.y = Math.sin(t * 0.12) * 0.09;

    const bodies = bodyRefs.current;
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      if (body) body.opacity = m.present;
    }
    if (nameRef.current) {
      nameRef.current.opacity = m.present;
      // Unlit lettering: darken it with the room, or it reads lighter than
      // its plaque once the lights go down.
      nameRef.current.color.setScalar(m.dim);
    }

    const pulse = pulseRef.current;
    if (pulse) {
      pulse.visible = m.pulse > 0.01;
      if (pulse.visible) {
        pulse.scale.setScalar(1 + m.pulse * 14);
        if (pulseMatRef.current) {
          pulseMatRef.current.opacity = Math.sin(m.pulse * Math.PI) * 0.5;
        }
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = (m.present * 12 + m.pulse * 40) * m.dim;
    }
    // Their own glow has to fall with the room, or the gold stays lit in the dark.
    if (plaqueRef.current) plaqueRef.current.emissiveIntensity = 0.8 * m.dim;
    if (ribbonRef.current) ribbonRef.current.emissiveIntensity = 0.12 * m.dim;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Cake plate and its stand. */}
      <mesh position={[0, -0.94, 0]}>
        <cylinderGeometry args={[1.85, 1.9, 0.06, 48]} />
        <meshStandardMaterial color="#d3b48a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[0.32, 0.5, 0.24, 24]} />
        <meshStandardMaterial color="#d3b48a" metalness={0.85} roughness={0.34} />
      </mesh>

      {TIERS.map((tier, i) => (
        <group key={i} position={[0, tier.y, 0]}>
          <mesh>
            <cylinderGeometry args={[tier.rTop, tier.rBottom, tier.h, 64]} />
            <meshPhysicalMaterial
              ref={(mat) => {
                bodyRefs.current[i] = mat;
              }}
              color={i % 2 ? "#f2ded0" : "#f8ece0"}
              {...FROSTING}
              transparent
              opacity={0}
            />
          </mesh>
          <mesh geometry={frosting[i]}>
            <meshPhysicalMaterial color={i % 2 ? "#f6e6da" : "#fdf3e9"} {...FROSTING} />
          </mesh>
        </group>
      ))}

      <mesh geometry={ribbons}>
        <meshStandardMaterial
          ref={ribbonRef}
          color="#cf9f78"
          emissive="#4a3020"
          emissiveIntensity={0.12}
          metalness={0.95}
          roughness={0.22}
        />
      </mesh>

      <mesh geometry={pearls}>
        <meshPhysicalMaterial
          color="#fdf6ee"
          roughness={0.12}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Gold nameplate on the middle tier. */}
      <group position={[0, 0.12, 1.21]}>
        <mesh>
          <planeGeometry args={[1.1, 0.32]} />
          <meshStandardMaterial
            ref={plaqueRef}
            color="#d7b98a"
            emissive="#8a5c3a"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[1.1, 0.32]} />
          <meshBasicMaterial
            ref={nameRef}
            map={nameTexture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* The warm bloom that washes out from the cake as it arrives. */}
      <mesh ref={pulseRef} visible={false} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.5, 20, 14]} />
        <meshBasicMaterial
          ref={pulseMatRef}
          color="#e8b896"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight ref={lightRef} color="#e8b896" intensity={0} distance={18} position={[0, 1.6, 0]} />

      {children}
    </group>
  );
}
