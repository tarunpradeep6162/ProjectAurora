"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SceneProgressRef } from "./sceneProgress";
import { quietAt } from "./grade";

/**
 * Galactic geometry, shared with StarField.tsx's core layer (layer 4), which
 * scatters its haze around `CORE_DIR * ~59` with Y flattened by 0.62 and the
 * whole field offset 20 units down -Z. The nebula is a sky dome (effectively
 * at infinity), so its densest region is placed along the direction in which
 * that star cloud actually *appears* from the middle of the camera's travel —
 * not the raw vector — so the two read as one galaxy rather than a haze and
 * a star cluster a few degrees apart.
 *
 * NOTE: StarField's vertex shader currently spins every layer about world Y
 * (the core layer fastest). The nebula deliberately does not follow that
 * spin; see the report accompanying this change.
 */
const STARFIELD_CORE_DIR = new THREE.Vector3(-0.62, 0.26, -0.74).normalize();
const STARFIELD_CORE_RADIUS = 59;
const CAMERA_TRAVEL_MIDPOINT = new THREE.Vector3(0, 0.6, 4);

const CORE_VIEW_DIR = new THREE.Vector3(
  STARFIELD_CORE_DIR.x * STARFIELD_CORE_RADIUS,
  STARFIELD_CORE_DIR.y * STARFIELD_CORE_RADIUS * 0.62,
  STARFIELD_CORE_DIR.z * STARFIELD_CORE_RADIUS - 20
)
  .sub(CAMERA_TRAVEL_MIDPOINT)
  .normalize();

/**
 * The galactic plane: the great circle through the core and a point low on
 * the right of the default view, so the band crosses the frame as a shallow
 * diagonal (upper-left core, falling away to the lower right) instead of a
 * horizontal stripe behind the headings.
 */
const BAND_NORMAL = new THREE.Vector3()
  .crossVectors(CORE_VIEW_DIR, new THREE.Vector3(0.78, -0.28, -0.56).normalize())
  .normalize();

const DOME_RADIUS = 150; // inside the camera's far plane (200)

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    // The dome is only ever translated (to follow the camera), never rotated
    // or scaled, so object-space position is already the world direction.
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGain;
  uniform float uDepth;
  uniform vec3 uCoreDir;
  uniform vec3 uBandNormal;
  varying vec3 vDir;

  // Sin-free hashes: stable across GPUs and precisions, no banding patterns.
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
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

  // Sampled on the unit sphere in 3D, so there is no UV seam and no pinching
  // at the poles. Normalised by the octave weights so a lower quality tier
  // (fewer octaves) loses fine detail, not overall brightness.
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float norm = 0.0;
    for (int i = 0; i < NEBULA_OCTAVES; i++) {
      sum += amp * vnoise(p);
      norm += amp;
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      amp *= 0.5;
    }
    return sum / norm;
  }

  void main() {
    vec3 d = normalize(vDir);

    // Extremely slow evolution: the broadest structure takes on the order of
    // ten minutes to drift one feature width, the finest about a minute.
    float t = uTime * 0.0015;
    vec3 p = d * 2.2 + vec3(t, -0.6 * t, 0.4 * t);

    #ifdef NEBULA_WARP
      // A low-frequency domain warp folds the smoke into itself, which is
      // what turns layered noise into something that reads as volume.
      vec3 q = p * 0.55;
      vec3 warp = vec3(
        vnoise(q + vec3(0.0, t, 4.1)),
        vnoise(q + vec3(5.3, 1.7, -t)),
        vnoise(q + vec3(t, 8.4, 2.2))
      );
      p += (warp - 0.5) * 1.1;
    #endif

    float cloud = fbm(p);
    float smoke = smoothstep(0.36, 0.74, cloud);

    // Galactic structure.
    float coreCos = dot(d, uCoreDir);
    float towardCore = coreCos * 0.5 + 0.5;
    float off = dot(d, uBandNormal); // ~angular distance from the plane

    // The band: a gaussian off the plane whose width breathes with the smoke
    // so its edge is never a clean stripe, strongest toward the core.
    float width = 0.11 + 0.09 * smoke;
    float band = exp(-(off * off) / (width * width));
    band *= 0.4 + 0.6 * towardCore * towardCore;

    // The bulge (tight) and a broad halo biasing the whole sky toward it.
    float bulge = pow(max(coreCos, 0.0), 9.0);
    float halo = pow(towardCore, 5.0);

    // A dark dust lane along the plane: its centre line wanders with the
    // smoke and its width breathes, so it reads as dust rather than a stroke,
    // and it thins out away from the core.
    float laneT = (off - 0.02 - (cloud - 0.5) * 0.09) / (0.045 + 0.035 * smoke);
    float lane = exp(-laneT * laneT)
      * smoothstep(0.4, 0.64, cloud)
      * (0.3 + 0.7 * towardCore * towardCore);

    float density =
      band * (0.35 + 0.65 * smoke) +
      bulge * (0.6 + 0.4 * smoke) +
      halo * smoke * 0.22 +
      smoke * 0.06;
    density = clamp(density * (1.0 - lane * 0.5), 0.0, 1.0);

    // Palette: indigo-black lifting into smoky blue-grey, with warm gold
    // only in the innermost bulge. Emission is capped near 0.05 so a bright
    // star drawn under the densest cloud can never be pushed into clipping.
    vec3 indigo = vec3(0.010, 0.011, 0.020);
    vec3 smoky = vec3(0.036, 0.040, 0.048);
    vec3 gold = vec3(0.058, 0.046, 0.030);
    vec3 col = mix(indigo, smoky, smoothstep(0.15, 0.85, density));
    col = mix(col, gold, clamp(bulge * smoke, 0.0, 1.0) * 0.45);

    // Travelling deeper reads a touch colder through the journey and the
    // photographs, returning to neutral for the letter and finale.
    float cold = smoothstep(0.2, 0.55, uDepth) * (1.0 - smoothstep(0.66, 0.86, uDepth));
    col *= mix(vec3(1.0), vec3(0.9, 0.96, 1.1), cold);

    vec3 emission = col * density * uGain;
    // Premultiplied output: rgb is light added, alpha is how much of what is
    // behind (distant stars, the CSS sky) the dust lane absorbs.
    float occlusion = lane * band * 0.24 * uGain;

    // Static ordered-ish dither: these gradients live in the bottom dozen
    // 8-bit code values and would band visibly without it.
    float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
    emission = max(emission + dither, 0.0);

    gl_FragColor = vec4(emission, occlusion);
  }
`;

function buildNebulaMesh(octaves: number, warp: boolean) {
  const defines: Record<string, string | number> = {
    NEBULA_OCTAVES: Math.max(1, Math.round(octaves)),
  };
  if (warp) defines.NEBULA_WARP = "";

  const material = new THREE.ShaderMaterial({
    defines,
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uGain: { value: 0 },
      uDepth: { value: 0 },
      uCoreDir: { value: CORE_VIEW_DIR.clone() },
      uBandNormal: { value: BAND_NORMAL.clone() },
    },
    side: THREE.BackSide,
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    // Depth-tested against the moons (which write depth) so the galaxy stays
    // behind them; it never writes depth itself.
    depthTest: true,
    toneMapped: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(DOME_RADIUS, 32, 16),
    material
  );
  // Drawn after the starfield (renderOrder 0) so the dust lanes can absorb a
  // little of the distant starlight behind them, as real ones do.
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  return mesh;
}

function smoothstep01(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/**
 * The galaxy's diffuse light: a camera-centred sky dome whose fragment shader
 * builds a galactic band, a core bulge, a dark dust lane and slow layered
 * smoke from 3D noise sampled on the view direction. Very low contrast by
 * design — indigo-black to smoky blue-grey, a restrained gold only at the
 * core — so it is felt as depth in the dark before it is seen as a cloud.
 *
 * Brightness comes from the shared `quiet` grade (grade.ts): when a
 * photograph, the letter or the candle owns the screen, the nebula steps back
 * with every other cosmic layer. Detail scales with the quality tier through
 * compile-time defines (`octaves`, `warp`), never with brightness.
 *
 * Built imperatively (see StarField.tsx for why) and only touched from
 * `useFrame` afterwards; uniforms are mutated in place, nothing allocates
 * per frame, and work pauses while the document is hidden.
 */
export default function CosmicNebula({
  progressRef,
  octaves = 5,
  warp = true,
}: {
  progressRef?: RefObject<SceneProgressRef>;
  /** fbm octaves: 5 desktop, 4 tablet, 3 mobile. */
  octaves?: number;
  /** Domain warp — the most expensive part; desktop only. */
  warp?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null>(null);
  const timeRef = useRef(0);
  const gainRef = useRef(0);

  useEffect(() => {
    const group = groupRef.current;
    const mesh = buildNebulaMesh(octaves, warp);
    // Carry evolution time and brightness across a quality-tier rebuild so a
    // tier change never visibly resets the smoke or re-fades it in.
    mesh.material.uniforms.uTime.value = timeRef.current;
    mesh.material.uniforms.uGain.value = gainRef.current;
    meshRef.current = mesh;
    group?.add(mesh);
    return () => {
      group?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      if (meshRef.current === mesh) meshRef.current = null;
    };
  }, [octaves, warp]);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.1);
    timeRef.current += dt;

    const story = progressRef?.current.storyPosition ?? 0;
    // Thinner at the galaxy's edge (the portal), full once inside it, and a
    // final lift as the finale opens the sky back up — all multiplied down
    // by the shared quiet grade.
    const presence =
      0.7 +
      0.3 * smoothstep01((story - 0.04) / 0.36) +
      0.1 * smoothstep01((story - 0.93) / 0.07);
    const target = presence * (1 - 0.82 * quietAt(story));
    gainRef.current += (target - gainRef.current) * (1 - Math.exp(-1.5 * dt));

    const u = mesh.material.uniforms;
    u.uTime.value = timeRef.current;
    u.uGain.value = gainRef.current;
    u.uDepth.value = story;

    // Keep the dome centred on the camera: the galaxy is at infinity, so
    // camera travel must never parallax it or reveal its edge.
    mesh.position.copy(state.camera.position);
  });

  return <group ref={groupRef} />;
}
