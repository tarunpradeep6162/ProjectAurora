"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";

/**
 * Chapter 02's own dense, vivid nebula — real WebGL, not the CSS gradient
 * approximation this replaced. Matched directly against a reference photo
 * (saturated teal/cyan and magenta cloud, visible stars scattered through
 * it, "11:11" over the top) after that CSS version was checked live and
 * found flat and starless next to it: a solid-ish gradient necessarily
 * either shows nothing behind it or occludes the persistent starfield the
 * same way the old background photo did.
 *
 * Built as a second camera-centred sky dome, the same technique as the
 * site's shared `Nebula.tsx` (3D value noise, fbm, one domain warp pass)
 * but deliberately not a modification of that file: `Nebula.tsx` is
 * mounted once for the *whole* site and tuned very low-contrast on
 * purpose so it stays quiet behind every other chapter too (see its own
 * doc comment). This dome carries its own much richer cyan/magenta
 * palette and higher density, and only fades in while chapter "miracle"
 * actually owns the viewport — the same presence-envelope pattern
 * `TulipGarden.tsx` uses for chapter "portal".
 *
 * Genuinely transparent, not a near-opaque backdrop: alpha comes straight
 * from cloud density, so gaps in the noise let the shared starfield behind
 * it show through. That alone wasn't enough, though — checked live and a
 * nebula dense enough to read as "cloud" (matching the reference) leaves
 * too little transparent gap for the sparse, randomly-placed global
 * starfield to read as visibly dense here, the way the reference's tightly
 * scattered stars do. So this also draws its own dedicated star layer
 * (`buildStars` below) — real geometry, not a texture — sized and counted
 * to guarantee the reference's star density specifically for this chapter,
 * the same "don't rely on a shared system to happen to look right locally,
 * add a dedicated one" reasoning `TulipGarden.tsx` already used for its
 * own flowers rather than the shared starfield's incidental dust.
 */
const STAR_RADIUS = 128;

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildStars(count: number, seed: number): Float32Array {
  const rand = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform distribution on a sphere shell, not lat/long sampling — the
    // latter clumps visibly at the poles.
    const u = rand();
    const v = rand();
    const theta = Math.acos(2 * u - 1);
    const phi = 2 * Math.PI * v;
    const r = STAR_RADIUS * (0.94 + rand() * 0.06);
    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = r * Math.cos(theta);
  }
  return positions;
}
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGain;
  varying vec3 vDir;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i);
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float norm = 0.0;
    for (int i = 0; i < 4; i++) {
      sum += amp * vnoise(p);
      norm += amp;
      p = p * 2.05 + vec3(2.3, 7.1, 4.6);
      amp *= 0.52;
    }
    return sum / norm;
  }

  void main() {
    vec3 d = normalize(vDir);

    float t = uTime * 0.012;
    vec3 p = d * 1.6 + vec3(t * 0.4, -t * 0.25, t * 0.18);

    // One domain warp pass — turns layered noise into something that reads
    // as billowing volume rather than flat static, same trick Nebula.tsx
    // uses for the site's restrained galaxy.
    vec3 q = p * 0.6;
    vec3 warp = vec3(
      vnoise(q + vec3(0.0, t, 3.0)),
      vnoise(q + vec3(4.1, 1.3, -t)),
      vnoise(q + vec3(t, 6.7, 2.4))
    );
    p += (warp - 0.5) * 1.35;

    float cloud = fbm(p);
    float density = smoothstep(0.24, 0.8, cloud);

    // Cyan lower-left, magenta upper-right — the same broad framing as the
    // reference photo — blended by noise-driven density rather than a
    // clean CSS gradient, so the split wanders instead of reading as flat.
    float mixX = clamp(d.x * 0.85 - d.y * 0.35 + (cloud - 0.5) * 0.6, -1.0, 1.0);
    float side = smoothstep(-0.55, 0.55, mixX);

    vec3 cyan = vec3(0.08, 0.82, 0.74);
    vec3 magenta = vec3(0.86, 0.12, 0.52);
    vec3 violet = vec3(0.30, 0.10, 0.46);

    vec3 col = mix(cyan, magenta, side);
    // Violet threads through the seam between the two colour masses, the
    // same way the reference photo's cloud isn't a hard two-colour split.
    col = mix(col, violet, (1.0 - abs(mixX)) * 0.5);

    vec3 emission = col * density * uGain;
    float alpha = density * uGain;

    float dither = (hash13(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
    emission = max(emission + dither, 0.0);

    gl_FragColor = vec4(emission, clamp(alpha, 0.0, 1.0));
  }
`;

const DOME_RADIUS = 140;

export default function MiracleNebula({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>>(null);
  const starsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const brightStarsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const timeRef = useRef(0);
  const presenceRef = useRef(0);

  const geometry = useMemo(() => new THREE.SphereGeometry(DOME_RADIUS, 32, 16), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uGain: { value: 0 },
        },
        side: THREE.BackSide,
        transparent: true,
        premultipliedAlpha: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        fog: false,
      }),
    []
  );

  // Two layers, the same "mostly small and dim, a few genuinely bright"
  // split real starfields read as — a single uniform size/opacity reads as
  // a flat dust pattern, not stars.
  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(buildStars(420, 110525), 3));
    return geo;
  }, []);
  const starMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#eef3ff",
        size: 2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const brightStarGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(buildStars(32, 20251111), 3));
    return geo;
  }, []);
  const brightStarMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#fffdf6",
        size: 3.6,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      starGeo.dispose();
      starMat.dispose();
      brightStarGeo.dispose();
      brightStarMat.dispose();
    };
  }, [geometry, material, starGeo, starMat, brightStarGeo, brightStarMat]);

  useFrame((_state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "miracle");
    // Fades in across the chapter's first 15%, full through the middle,
    // fades out across the last 15% — so the handoff from chapter 01's
    // portal and into chapter 03's story never has a hard cut.
    const targetPresence = active
      ? THREE.MathUtils.smoothstep(progress.chapterProgress, 0, 0.15) *
        (1 - THREE.MathUtils.smoothstep(progress.chapterProgress, 0.85, 1))
      : 0;
    presenceRef.current += (targetPresence - presenceRef.current) * Math.min(1, dt * 2.2);
    const presence = presenceRef.current;

    const shown = presence > 0.01;
    group.visible = shown;
    if (!shown) return;

    timeRef.current += dt;
    mesh.material.uniforms.uTime.value = timeRef.current;
    mesh.material.uniforms.uGain.value = presence;

    // At infinity, camera-centred — never parallaxes or reveals an edge.
    mesh.position.copy(camera.position);
    if (starsRef.current) {
      starsRef.current.position.copy(camera.position);
      starsRef.current.material.opacity = presence * 0.85;
    }
    if (brightStarsRef.current) {
      brightStarsRef.current.position.copy(camera.position);
      brightStarsRef.current.material.opacity = presence;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Stars drawn *after* the nebula (higher renderOrder), additive —
          so they read as bright points sitting on top of the cloud
          everywhere, the way the reference photo's stars do, rather than
          being dimmed out wherever the cloud's own alpha is high. */}
      <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1} frustumCulled={false} />
      <points ref={starsRef} geometry={starGeo} material={starMat} renderOrder={2} frustumCulled={false} />
      <points
        ref={brightStarsRef}
        geometry={brightStarGeo}
        material={brightStarMat}
        renderOrder={2}
        frustumCulled={false}
      />
    </group>
  );
}
