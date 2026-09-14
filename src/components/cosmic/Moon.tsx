"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { hasReachedChapter, type SceneProgressRef } from "./sceneProgress";
import { quietAt } from "./grade";

type MoonVariant = "primary" | "secondary";

type MoonConfig = {
  position: [number, number, number];
  radius: number;
  /** Display-space albedo. */
  albedo: [number, number, number];
  /** 1 = full contrast; lower collapses toward `haze`, reading as further away. */
  contrast: number;
  haze: [number, number, number];
  /** Resting opacity once visible. */
  opacity: number;
  /** How strongly the shared `quiet` grade dims this moon (0-1). */
  quietDim: number;
};

/**
 * Two depth planes, deliberately far apart.
 *
 * The primary sits ~36 units from the opening camera and ~29 from the finale
 * camera: small (about 6-8% of frame height across the whole camera arc),
 * high in the right third, a gibbous disc rather than a lit ball. Its job is
 * to give the sky a sense of scale, not to be looked at.
 *
 * The companion sits roughly twice as deep, at under half the primary's
 * apparent size and with its contrast collapsed toward the sky. As the
 * camera travels forward the primary grows noticeably more than the
 * companion does, which is what quietly sells "travelling deeper" — two
 * spheres on the same plane would just read as a pair.
 */
const VARIANTS: Record<MoonVariant, MoonConfig> = {
  primary: {
    position: [9.2, 4.6, -27],
    radius: 1.05,
    albedo: [0.5, 0.47, 0.43],
    contrast: 1,
    haze: [0.03, 0.03, 0.035],
    opacity: 1,
    quietDim: 0.85,
  },
  secondary: {
    position: [-12.5, -3.6, -52],
    radius: 0.42,
    albedo: [0.44, 0.455, 0.48],
    contrast: 0.55,
    haze: [0.028, 0.031, 0.04],
    opacity: 0.7,
    quietDim: 0.85,
  },
};

/**
 * One light for both moons, from the galactic-core side of the sky and a
 * little toward the viewer, so each shows a soft-terminated gibbous phase —
 * and, because it is the same sun, their phases differ slightly with their
 * positions the way two real bodies' would.
 */
const SUN_DIR = new THREE.Vector3(-0.8, 0.22, 0.55).normalize();

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vObj;
  varying vec3 vViewDirW;
  void main() {
    vObj = normal;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Uniform scale only, so mat3(modelMatrix) is a valid normal transform.
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDirW = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uAlbedo;
  uniform vec3 uSunDir;
  uniform vec3 uHaze;
  uniform float uContrast;
  uniform float uGain;
  uniform float uOpacity;
  varying vec3 vNormalW;
  varying vec3 vObj;
  varying vec3 vViewDirW;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x),
        u.y
      ),
      mix(
        mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x),
        u.y
      ),
      u.z
    );
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewDirW);
    vec3 o = normalize(vObj);

    // Low-contrast maria: two smooth octaves on the sphere, never craters.
    float m = vnoise(o * 2.6) * 0.65 + vnoise(o * 6.1 + 3.7) * 0.35;
    vec3 albedo = uAlbedo * (1.0 - 0.2 * smoothstep(0.42, 0.7, m));

    // Soft terminator rather than a hard line, and limb darkening so the
    // disc has form without a specular highlight.
    float lit = smoothstep(-0.12, 0.45, dot(n, uSunDir));
    float limb = 0.55 + 0.45 * pow(max(dot(n, v), 0.0), 0.6);
    vec3 col = albedo * (lit * limb + 0.025);

    col = mix(uHaze, col, uContrast) * uGain;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

function smoothstep01(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/**
 * A quiet, procedurally shaded moon (no texture download): soft terminator,
 * faint maria, limb darkening, lit by one fixed sun direction. Unlit by the
 * scene's lights on purpose, so staging light for the couple figure can never
 * brighten it.
 *
 * Brightness follows the shared `quiet` grade (grade.ts), so the moons step
 * back with the rest of the sky whenever a photograph, the letter or the
 * candle owns the screen. On narrow/portrait viewports the moons are pulled
 * in toward the centre so they stay in frame instead of vanishing off the
 * sides.
 *
 * `variant="secondary"` renders the companion: invisible until the visitor
 * reaches the Journey chapter, then fades in and — via a component-local
 * latch, not a live chapter check — stays, echoing that chapter's "choosing
 * each other" throughline as a quiet permanence rather than something that
 * reverses if the visitor scrolls back up.
 */
export default function CosmicMoon({
  variant = "primary",
  progressRef,
  segments = 48,
}: {
  variant?: MoonVariant;
  progressRef?: RefObject<SceneProgressRef>;
  /** Sphere width segments: 48 desktop, 32 tablet, 24 mobile. */
  segments?: number;
}) {
  const config = VARIANTS[variant];
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const opacityRef = useRef(0);
  const gainRef = useRef(0);
  const everReachedRef = useRef(false);

  // Stable identity for the component's lifetime (so a re-render never
  // resets values mid-fade); only ever mutated through `materialRef` from
  // `useFrame`, the same pattern as CoupleModel's contact shadow.
  const [uniforms] = useState(() => ({
    uAlbedo: { value: new THREE.Vector3(...config.albedo) },
    uSunDir: { value: SUN_DIR.clone() },
    uHaze: { value: new THREE.Vector3(...config.haze) },
    uContrast: { value: config.contrast },
    uGain: { value: 0 },
    uOpacity: { value: variant === "secondary" ? 0 : config.opacity },
  }));

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const dt = Math.min(delta, 0.1);

    // Barely perceptible turn of the surface; the terminator stays fixed.
    mesh.rotation.y += dt * 0.004;

    // Portrait / narrow framing: pull toward centre and lift slightly.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const inward = Math.min(1, Math.max(0.45, aspect / 1.6));
    mesh.position.set(
      config.position[0] * inward,
      config.position[1] + (1 - inward) * 3,
      config.position[2]
    );

    const story = progressRef?.current.storyPosition ?? 0;
    const target = 1 - config.quietDim * quietAt(story);
    gainRef.current += (target - gainRef.current) * (1 - Math.exp(-1.5 * dt));

    const u = material.uniforms;
    u.uGain.value = gainRef.current;

    if (variant === "secondary") {
      // "journey" was its own chapter when this latch was written; chapters
      // 03-05 are one merged "story" chapter now (see content.ts), so this
      // reads the merged chapter's arrival instead — a chapter earlier than
      // before, since "story" now begins where the old chapter 03 did.
      if (progressRef && hasReachedChapter(progressRef.current, "story")) {
        everReachedRef.current = true;
      }
      const goal = everReachedRef.current ? config.opacity : 0;
      opacityRef.current += (goal - opacityRef.current) * (1 - Math.exp(-0.8 * dt));
      // Eased so the fade-in lingers near zero before the disc resolves.
      u.uOpacity.value = smoothstep01(opacityRef.current / config.opacity) * config.opacity;
      // Hidden outright while invisible: a depth-writing, fully transparent
      // sphere would otherwise punch a hole in the nebula drawn after it.
      mesh.visible = opacityRef.current > 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={config.position}
      scale={config.radius}
      visible={variant !== "secondary"}
    >
      <sphereGeometry args={[1, segments, Math.max(12, Math.round(segments * 0.75))]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={variant === "secondary"}
        depthWrite
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}
