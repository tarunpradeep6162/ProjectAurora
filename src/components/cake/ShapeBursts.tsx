"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { keyframes } from "./cakeMotion";
import type { CakeMotion } from "./cakeMotion";
import {
  SHAPE_BURSTS,
  shapeParticlePositions,
  type ShapeBurst,
} from "./celebrationData";

/** Points per burst. */
const COUNT = 90;

/**
 * How long after the wish each burst starts (staggered), and how long each
 * stays lit before the cycle repeats — the original's pacing (slower on
 * reduced motion), so the sky keeps a gentle procession of shapes going for
 * as long as the visitor lingers rather than firing once and stopping.
 */
function burstReveal(elapsed: number, index: number, count: number, reduced: boolean): number | null {
  const stagger = reduced ? 3.4 : 1.5;
  const start = 2.4 + index * stagger * 0.6;
  if (elapsed < start) return null;
  const period = stagger * count;
  const rise = 1.6;
  const local = (elapsed - start) % period;
  if (local > rise) return null;
  return Math.min(1, Math.max(0, local / rise));
}

/** Fade envelope over a burst's own local reveal (rises, holds briefly, fades). */
function burstAlpha(reveal: number, reduced: boolean): number {
  const value = keyframes(reveal, [[0, 0], [0.12, 1], [0.45, 0.55], [1, 0]]);
  return reduced ? value * 0.45 : value;
}

const VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aTwinkleSpeed;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.6 + 0.4 * sin(uTime * aTwinkleSpeed + aPhase * 6.2831853);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * vTwinkle * uPixelRatio * (60.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * uAlpha;
    gl_FragColor = vec4(vColor * min(1.0, vTwinkle + 0.3), alpha);
  }
`;

function buildBurstGeometry(burst: ShapeBurst) {
  const positions = shapeParticlePositions(burst.shape, COUNT);
  const phases = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  const colors = new Float32Array(COUNT * 3);
  const color = new THREE.Color(burst.color);
  const warm = new THREE.Color("#fff6e8");
  const mixed = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    phases[i] = Math.random();
    speeds[i] = 1 + Math.random() * 2;
    sizes[i] = 2.2 + Math.random() * 2.4;
    mixed.copy(color).lerp(warm, Math.random() * 0.5);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aTwinkleSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function Burst({
  burst,
  index,
  count,
  motion,
  reduced,
}: {
  burst: ShapeBurst;
  index: number;
  count: number;
  motion: RefObject<CakeMotion>;
  reduced: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => buildBurstGeometry(burst), [burst]);

  useFrame((state) => {
    const points = pointsRef.current;
    const mat = matRef.current;
    if (!points || !mat) return;
    const elapsed = motion.current.elapsed;
    const reveal = elapsed === null ? null : burstReveal(elapsed, index, count, reduced);
    if (reveal === null) {
      points.visible = false;
      return;
    }
    points.visible = true;
    // How settled into the darkness/reveal the scene currently is — hearts
    // and butterflies stay faint during the held dark, then come up with the
    // sky rather than fighting it.
    const worldDim = Math.min(1, motion.current.dim / 0.36);
    mat.uniforms.uAlpha.value = burstAlpha(reveal, reduced) * worldDim;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    const scale = burst.scale * reveal ** 0.45;
    points.scale.setScalar(Math.max(1e-4, scale));
    points.position.y = burst.position[1] - reveal * reveal * 0.6;
  });

  return (
    <points
      ref={pointsRef}
      position={burst.position}
      visible={false}
      frustumCulled={false}
      geometry={geometry}
    >
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uAlpha: { value: 0 }, uPixelRatio: { value: 1 } }}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </points>
  );
}

/**
 * The heart/infinity/butterfly star-shapes that drift up around the cake
 * after the wish — the original's post-blow-out celebration, absent from
 * this site until now. Three bursts on phones, six on desktop, each a small
 * point-cloud traced along the shape's outline.
 */
export default function ShapeBursts({
  motion,
  reduced,
  compact,
}: {
  motion: RefObject<CakeMotion>;
  reduced: boolean;
  compact: boolean;
}) {
  const bursts = compact ? SHAPE_BURSTS.slice(0, 3) : SHAPE_BURSTS;
  return (
    <>
      {bursts.map((burst, i) => (
        <Burst
          key={i}
          burst={burst}
          index={i}
          count={bursts.length}
          motion={motion}
          reduced={reduced}
        />
      ))}
    </>
  );
}
