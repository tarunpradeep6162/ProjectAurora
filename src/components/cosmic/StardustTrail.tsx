"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneProgressRef } from "./sceneProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * "The pointer must feel like touching the universe" — a short-lived trail
 * of tiny stardust that follows real pointer/touch motion, disturbed by
 * velocity rather than position alone. One BufferGeometry, one shader
 * material, a fixed-size ring buffer of particles reused forever: no React
 * node per point, no per-frame `setState`, matching PhotoDissolve.tsx's
 * established pattern in this same directory.
 *
 * Deliberately NOT raycast against real scene geometry — particles are
 * placed along the ray from the camera through the pointer's NDC position,
 * at a fixed depth in front of the camera, so the trail reads as "hovering
 * near the cursor in the 3D scene" without needing a hit-test against
 * whatever happens to be behind it at any given moment.
 */

const MAX_PARTICLES_DESKTOP = 420;
const MAX_PARTICLES_MOBILE = 140;
/** World units in front of the camera the trail plane sits at. */
const TRAIL_DEPTH = 2.4;
/** Seconds. "0.5-1.5s perceived" per the brief — varied per-particle within this range. */
const LIFETIME_MIN = 0.55;
const LIFETIME_MAX = 1.25;
/** Emission strength below this smoothed pointer speed spawns nothing. */
const SPEED_FLOOR = 0.06;
/** Emission strength saturates at this smoothed pointer speed — "clamp aggressively". */
const SPEED_CEIL = 1.6;
const MAX_SPAWN_PER_FRAME_DESKTOP = 3;
const MAX_SPAWN_PER_FRAME_MOBILE = 2;

/**
 * Per-chapter emission multiplier. "During photographs: pointer trail
 * intensity decreases. During Letter: disable trail. During Birthday dark
 * hold: disable entirely. During Finale: extremely subtle or off." The
 * whole Birthday chapter is treated as the dark-hold case rather than
 * trying to detect the wish/candle sub-phase specifically — the safer,
 * conservative reading rather than a guess at internal timing this
 * component has no visibility into.
 */
const CHAPTER_INTENSITY: Record<string, number> = {
  letter: 0,
  birthday: 0,
  memories: 0.4,
  finale: 0.15,
};
const DEFAULT_INTENSITY = 1;

function chapterIntensity(chapterId: string): number {
  return chapterId in CHAPTER_INTENSITY ? CHAPTER_INTENSITY[chapterId] : DEFAULT_INTENSITY;
}

// Warm ivory/champagne dominant, rare muted rose/lavender — never rainbow.
const PALETTE: THREE.Color[] = [
  new THREE.Color("#efe0c0"),
  new THREE.Color("#efe0c0"),
  new THREE.Color("#efe0c0"),
  new THREE.Color("#e8cf9e"),
  new THREE.Color("#c98fa0"), // rare rose
  new THREE.Color("#a79bc4"), // rare lavender
];

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPointSize;
  attribute float aBirth;
  attribute float aLifetime;
  attribute vec3 aVelocity;
  attribute vec3 aColor;
  varying float vAge01;
  varying vec3 vColor;
  void main() {
    float age = uTime - aBirth;
    float t = clamp(age / aLifetime, 0.0, 1.0);
    vAge01 = t;
    vColor = aColor;
    vec3 pos = position + aVelocity * min(age, aLifetime);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = uPointSize * (1.0 - t * t);
    gl_PointSize = size * (220.0 / max(0.001, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  varying float vAge01;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.1, d);
    float fade = 1.0 - smoothstep(0.7, 1.0, vAge01);
    if (vAge01 >= 1.0) discard;
    gl_FragColor = vec4(vColor, edge * fade * uOpacity);
  }
`;

/** Reads the pointer's own screen-space velocity — pointermove + touchmove on `window`, since the canvas is `pointer-events: none` (see CosmicScene.tsx). */
function usePointerSample() {
  const ndcRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);

  useEffect(() => {
    const toNdc = (clientX: number, clientY: number) => {
      ndcRef.current.x = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      ndcRef.current.y = -((clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      activeRef.current = true;
    };
    const onPointerMove = (e: PointerEvent) => toNdc(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) toNdc(t.clientX, t.clientY);
    };
    const onLeave = () => {
      activeRef.current = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return { ndcRef, activeRef };
}

function StardustPoints({
  progressRef,
  maxParticles,
  maxSpawnPerFrame,
}: {
  progressRef: RefObject<SceneProgressRef>;
  maxParticles: number;
  maxSpawnPerFrame: number;
}) {
  const { camera } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const { ndcRef, activeRef } = usePointerSample();

  const cursorRef = useRef({ ready: false, x: 0, y: 0 });
  const lastNdcRef = useRef({ x: 0, y: 0 });
  const smoothedSpeedRef = useRef(0);
  const nextIndexRef = useRef(0);
  const intensityRef = useRef(1);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const births = new Float32Array(maxParticles).fill(-9999);
    const lifetimes = new Float32Array(maxParticles).fill(1);
    const colors = new Float32Array(maxParticles * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("aBirth", new THREE.BufferAttribute(births, 1));
    geometry.setAttribute("aLifetime", new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  }, [maxParticles]);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const material = materialRef.current;
    const geometry = geometryRef.current;
    if (!material || !geometry) return;

    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;

    const progress = progressRef.current;
    const targetIntensity = chapterIntensity(progress.chapterId);
    intensityRef.current += (targetIntensity - intensityRef.current) * Math.min(1, dt * 3);
    material.uniforms.uOpacity.value = Math.max(0, intensityRef.current);

    // Smoothed NDC-space speed, in NDC units/sec — a screen-relative measure
    // deliberately, so "fast" means the same thing on any viewport size.
    const ndc = ndcRef.current;
    const last = lastNdcRef.current;
    const rawSpeed = activeRef.current
      ? Math.hypot(ndc.x - last.x, ndc.y - last.y) / Math.max(1 / 120, dt)
      : 0;
    last.x = ndc.x;
    last.y = ndc.y;
    smoothedSpeedRef.current += (rawSpeed - smoothedSpeedRef.current) * Math.min(1, dt * 8);

    // Project the pointer's NDC position onto a plane a fixed distance in
    // front of the camera — see the module doc comment for why this is a
    // deliberate choice over raycasting real geometry.
    const cursor = cursorRef.current;
    if (activeRef.current) {
      const unprojected = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera);
      const dir = unprojected.sub(camera.position).normalize();
      const world = camera.position.clone().add(dir.multiplyScalar(TRAIL_DEPTH));
      cursor.x = world.x;
      cursor.y = world.y;
      cursor.ready = true;
    }

    const emission = intensityRef.current <= 0.02
      ? 0
      : THREE.MathUtils.smoothstep(smoothedSpeedRef.current, SPEED_FLOOR, SPEED_CEIL);
    const spawnCount = cursor.ready && activeRef.current
      ? Math.round(emission * maxSpawnPerFrame)
      : 0;

    if (spawnCount > 0) {
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const velocities = geometry.attributes.aVelocity as THREE.BufferAttribute;
      const births = geometry.attributes.aBirth as THREE.BufferAttribute;
      const lifetimes = geometry.attributes.aLifetime as THREE.BufferAttribute;
      const colors = geometry.attributes.aColor as THREE.BufferAttribute;

      for (let n = 0; n < spawnCount; n++) {
        const i = nextIndexRef.current;
        nextIndexRef.current = (i + 1) % maxParticles;

        const jitter = 0.06;
        positions.setXYZ(
          i,
          cursor.x + (Math.random() - 0.5) * jitter,
          cursor.y + (Math.random() - 0.5) * jitter,
          -TRAIL_DEPTH * 0.5 + (Math.random() - 0.5) * jitter
        );

        // Gentle outward+upward drift, scaled by how fast the pointer is
        // moving right now — "fast movement: somewhat stronger emission",
        // clamped hard so this never reads as fireworks.
        const speedFactor = Math.min(1, smoothedSpeedRef.current / SPEED_CEIL);
        const angle = Math.random() * Math.PI * 2;
        const radial = 0.04 + speedFactor * 0.1;
        velocities.setXYZ(
          i,
          Math.cos(angle) * radial,
          0.05 + Math.random() * 0.08 + speedFactor * 0.06,
          Math.sin(angle) * radial
        );

        births.setX(i, t);
        lifetimes.setX(i, LIFETIME_MIN + Math.random() * (LIFETIME_MAX - LIFETIME_MIN));

        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        colors.setXYZ(i, color.r, color.g, color.b);
      }

      positions.needsUpdate = true;
      velocities.needsUpdate = true;
      births.needsUpdate = true;
      lifetimes.needsUpdate = true;
      colors.needsUpdate = true;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPointSize: { value: 3.2 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Disabled entirely under reduced motion ("no pointer trail" per the
 * brief's reduced-motion list) — mounts nothing, not even the geometry
 * setup, so there is no cost and no motion of any kind to gate further.
 */
export default function StardustTrail({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const reduced = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  if (reduced) return null;

  const mobileTier = coarsePointer || narrow;
  return (
    <StardustPoints
      progressRef={progressRef}
      maxParticles={mobileTier ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP}
      maxSpawnPerFrame={mobileTier ? MAX_SPAWN_PER_FRAME_MOBILE : MAX_SPAWN_PER_FRAME_DESKTOP}
    />
  );
}
