"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { CAKE_TOP } from "./Cake";
import { candleLit, flicker, type CakeMotion } from "./cakeMotion";

/** Ring the candles stand on, and the height their flames burn at. */
const RING_RADIUS = 0.52;
const FLAME_Y = 1.13;
const SMOKE_BASE_Y = 1.18;
const SMOKE_PER_CANDLE = 6;

// Reused every frame to write instance matrices; never read back.
const scratch = new THREE.Object3D();

/** Small deterministic PRNG: the same smoke every render, and render-safe. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function candleLayout(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return { x: Math.cos(a) * RING_RADIUS, z: Math.sin(a) * RING_RADIUS, phase: (i * 0.618) % 1 };
  });
}

function buildSmoke(candles: ReturnType<typeof candleLayout>) {
  const random = seeded(7);
  const n = candles.length * SMOKE_PER_CANDLE;
  const positions = new Float32Array(n * 3);
  const phases = new Float32Array(n);
  const speeds = new Float32Array(n);
  const sizes = new Float32Array(n);
  const colors = new Float32Array(n * 3);
  const grey = new THREE.Color("#cfc6bd");
  for (let i = 0; i < n; i++) {
    const c = candles[i % candles.length];
    positions[i * 3] = c.x + (random() - 0.5) * 0.1;
    positions[i * 3 + 1] = SMOKE_BASE_Y + random() * 1.5;
    positions[i * 3 + 2] = c.z + (random() - 0.5) * 0.1;
    phases[i] = random();
    speeds[i] = 0.4 + random() * 0.6;
    sizes[i] = 2 + random() * 3;
    colors[i * 3] = grey.r;
    colors[i * 3 + 1] = grey.g;
    colors[i * 3 + 2] = grey.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aTwinkleSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function buildHalo(candles: ReturnType<typeof candleLayout>) {
  const positions = new Float32Array(candles.length * 3);
  candles.forEach((c, i) => {
    positions[i * 3] = c.x;
    positions[i * 3 + 1] = FLAME_Y;
    positions[i * 3 + 2] = c.z;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(candles.length), 1));
  return geometry;
}

/** The original scene's shared point shader, reduced to what the smoke uses. */
const SMOKE_VERTEX = /* glsl */ `
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
    gl_PointSize = aSize * vTwinkle * uPixelRatio * (90.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const SMOKE_FRAGMENT = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * uAlpha;
    gl_FragColor = vec4(vColor * min(vTwinkle, 0.55), alpha);
  }
`;

/**
 * A soft warm halo per flame. The original scene ran a bloom pass over the
 * whole frame; this canvas has no post-processing, so each flame carries its
 * own glow instead, scaled by how brightly that candle is burning.
 */
const HALO_VERTEX = /* glsl */ `
  attribute float aGlow;
  uniform float uPixelRatio;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 420.0 * uPixelRatio * (0.6 + aGlow * 0.4) / -mv.z;
    vGlow = aGlow;
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 2.2);
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.42), falloff * vGlow * 0.55);
  }
`;

export default function CakeCandles({
  motion,
  reduced,
  count,
}: {
  motion: RefObject<CakeMotion>;
  reduced: boolean;
  /** Seven candles; five on phones, as the original did. */
  count: number;
}) {
  const candlesRef = useRef<THREE.InstancedMesh>(null);
  const waxRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const flamesRef = useRef<THREE.InstancedMesh>(null);
  const flameMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Points>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);
  const smokeRef = useRef<THREE.Points>(null);
  const smokeMatRef = useRef<THREE.ShaderMaterial>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  const candles = useMemo(() => candleLayout(count), [count]);
  const smoke = useMemo(() => buildSmoke(candles), [candles]);
  const halo = useMemo(() => buildHalo(candles), [candles]);

  const smokeUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAlpha: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const haloUniforms = useMemo(() => ({ uPixelRatio: { value: 1 } }), []);

  useEffect(
    () => () => {
      smoke.dispose();
      halo.dispose();
    },
    [smoke, halo]
  );

  // The candles themselves never move within the cake.
  useEffect(() => {
    const mesh = candlesRef.current;
    if (!mesh) return;
    candles.forEach((c, i) => {
      scratch.position.set(c.x, CAKE_TOP, c.z);
      scratch.rotation.set(0, 0, 0);
      scratch.scale.set(1, 1, 1);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [candles]);

  useFrame((state, delta) => {
    const m = motion.current;
    const time = state.clock.elapsedTime;
    const light = flicker(time, reduced);
    // Point sprites are sized in pixels; scaling by the canvas height keeps
    // the glow and smoke the same size relative to the cake at any stage size
    // (sizes below were tuned on a 480px stage).
    const pixelRatio = state.gl.getPixelRatio() * (state.size.height / 480);
    // Flames lean gently toward the pointer, and burn a touch brighter when
    // it is near the middle of the cake.
    const { x: px, y: py } = state.pointer;
    const near = reduced ? 0 : Math.max(0, 1 - Math.hypot(px, py));

    const flames = flamesRef.current;
    const haloPoints = haloRef.current;
    const glow = haloPoints?.geometry.getAttribute("aGlow") as THREE.BufferAttribute | undefined;
    let total = 0;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const lit = candleLit(m.progress, i, candles.length, reduced) * m.flame;
      total += lit;
      if (glow) glow.setX(i, lit);
      if (!flames) continue;
      const sway = reduced ? 1 : light + Math.sin(time * 9 + c.phase * 6.28) * 0.05;
      const s = Math.max(1e-4, lit * sway);
      scratch.position.set(c.x, FLAME_Y, c.z);
      scratch.rotation.set(
        py * near * 0.2,
        0,
        -px * near * 0.28 + Math.sin(time * 5 + c.phase * 6.28) * 0.07
      );
      scratch.scale.set(0.05 * s, 0.13 * s, 0.05 * s);
      scratch.updateMatrix();
      flames.setMatrixAt(i, scratch.matrix);
    }

    if (flames) flames.instanceMatrix.needsUpdate = true;
    if (flameMatRef.current) {
      flameMatRef.current.emissiveIntensity = 6 * light * (1 + near * 0.4);
      flameMatRef.current.opacity = Math.min(1, total);
    }
    if (glow) glow.needsUpdate = true;
    if (haloMatRef.current) haloMatRef.current.uniforms.uPixelRatio.value = pixelRatio;

    if (waxRef.current) waxRef.current.emissiveIntensity = 0.25 * m.dim;

    const mean = candles.length > 0 ? total / candles.length : 0;
    if (keyLightRef.current) keyLightRef.current.intensity = 14 * light * mean;
    if (fillLightRef.current) fillLightRef.current.intensity = 9 * light * mean;

    const plume = smokeRef.current;
    const smokeMat = smokeMatRef.current;
    if (plume && smokeMat) {
      plume.visible = m.smoke > 0.01;
      if (plume.visible) {
        const u = smokeMat.uniforms;
        if (!reduced) u.uTime.value += delta;
        u.uAlpha.value = m.smoke * 0.5;
        u.uPixelRatio.value = pixelRatio;
        plume.position.y = (1 - m.smoke) * 1.4;
      }
    }
  });

  return (
    <group>
      <instancedMesh ref={candlesRef} args={[undefined, undefined, candles.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.032, 0.036, 0.34, 8]} />
        <meshPhysicalMaterial
          ref={waxRef}
          color="#fdf6ec"
          emissive="#e8c98f"
          emissiveIntensity={0.25}
          roughness={0.6}
          clearcoat={0.4}
        />
      </instancedMesh>

      <instancedMesh ref={flamesRef} args={[undefined, undefined, candles.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial
          ref={flameMatRef}
          color="#fff2c8"
          emissive="#ff9a3c"
          emissiveIntensity={6}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>

      <points ref={haloRef} geometry={halo} frustumCulled={false}>
        <shaderMaterial
          ref={haloMatRef}
          uniforms={haloUniforms}
          vertexShader={HALO_VERTEX}
          fragmentShader={HALO_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <points ref={smokeRef} geometry={smoke} visible={false} frustumCulled={false}>
        <shaderMaterial
          ref={smokeMatRef}
          uniforms={smokeUniforms}
          vertexShader={SMOKE_VERTEX}
          fragmentShader={SMOKE_FRAGMENT}
          transparent
          depthWrite={false}
        />
      </points>

      <pointLight ref={keyLightRef} color="#ffb877" intensity={0} distance={12} position={[0, 1.4, 0.8]} />
      <pointLight ref={fillLightRef} color="#ffd4a8" intensity={0} distance={10} position={[0.6, 1.1, -0.6]} />
    </group>
  );
}
