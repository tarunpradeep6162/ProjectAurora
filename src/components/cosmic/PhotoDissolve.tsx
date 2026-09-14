"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { useNearChapter } from "./useOptionalGLTF";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * The real WebGL version of Journey's signature shot: the photograph Tarun
 * runs toward doesn't just fade (that DOM/CSS treatment — ChapterJourney.tsx
 * / .journey-ghost--signature — still exists and remains the fallback for
 * reduced motion, a low-power device, or WebGL being unavailable at all; see
 * `useWebGLActive`, which the two are coordinated through so exactly one of
 * them is ever visible). Here, on capable devices, it genuinely dissolves:
 * a grid of points sampling the photograph's own texture starts flat, on a
 * plane roughly where Tarun is running, then disperses outward into a
 * scattered target cloud as the chapter's scroll progress carries it there,
 * its color lerping from the photo's own tones toward warm ivory/champagne
 * as it goes — the photograph becoming light, not vanishing.
 *
 * Deliberately not built as "sample every source pixel" — a coarse grid
 * (targetting a few thousand points, not tens of thousands) carries the
 * photo's silhouette and dominant tones convincingly at the scale this
 * plays out on screen, at a fraction of the fill-rate and attribute-buffer
 * cost. No React node per particle: one BufferGeometry, populated once.
 */
const MODEL_CHAPTER_ID = "journey";
const SIGNATURE_SRC = "/images/memories/memory-5.jpg";
const SIGNATURE_ASPECT = 800 / 800; // memory-5's own width/height (see content.ts)

// Same phase envelope as the DOM fallback's signature ghost in
// ChapterJourney.tsx, so whichever one is actually on screen plays at the
// same narrative moment: arrive, hold, then dissolve — finishing by the
// time the chapter itself does.
const ARRIVE_START = 0.56;
const HOLD_END = 0.84;
const DISSOLVE_END = 1.0;

const WARM_TINT = new THREE.Color("#EFE0C0"); // ivory/champagne, this project's existing accent family

type LoadState = { status: "error" } | { status: "loaded"; texture: THREE.Texture };

function useSignatureTexture(enabled: boolean): LoadState | null {
  const [state, setState] = useState<LoadState | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    new THREE.TextureLoader().load(
      SIGNATURE_SRC,
      (texture) => {
        if (cancelled) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        setState({ status: "loaded", texture });
      },
      undefined,
      () => {
        if (!cancelled) setState({ status: "error" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uDissolve;
  uniform float uPointSize;
  attribute vec3 aTarget;
  attribute vec2 aUv;
  varying vec2 vUv;
  void main() {
    vUv = aUv;
    vec3 pos = mix(position, aTarget, uDissolve);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointSize * (240.0 / max(0.001, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uDissolve;
  uniform float uOpacity;
  uniform vec3 uWarmTint;
  varying vec2 vUv;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.15, d);
    vec3 texColor = texture2D(uTexture, vUv).rgb;
    vec3 color = mix(texColor, uWarmTint, clamp(uDissolve * 1.25, 0.0, 1.0));
    gl_FragColor = vec4(color, edge * uOpacity);
  }
`;

function LoadedPhotoDissolve({
  texture,
  progressRef,
  count,
}: {
  texture: THREE.Texture;
  progressRef: RefObject<SceneProgressRef>;
  count: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const opacityRef = useRef(0);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    // Grid across the photo's own aspect ratio, in the same rough world
    // space Tarun runs through. Positioned ahead of and slightly above his
    // own placement (TarunRunner.tsx's PLACEMENT), matching "a large
    // photograph fills much of the horizon" and "he runs toward it."
    const cols = Math.round(Math.sqrt(count * SIGNATURE_ASPECT));
    const rows = Math.round(count / cols);
    const width = 2.6;
    const height = width / SIGNATURE_ASPECT;
    const planeCenter = new THREE.Vector3(0.2, -0.15, -5.4);

    const positions = new Float32Array(cols * rows * 3);
    const targets = new Float32Array(cols * rows * 3);
    const uvs = new Float32Array(cols * rows * 2);

    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const u = cols > 1 ? x / (cols - 1) : 0.5;
        const v = rows > 1 ? y / (rows - 1) : 0.5;

        const px = planeCenter.x + (u - 0.5) * width;
        const py = planeCenter.y + (0.5 - v) * height;
        const pz = planeCenter.z;
        positions[i * 3] = px;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = pz;

        // Scattered target: outward from the plane's centre, biased upward
        // and toward the camera — "particles rise... become stars" — using
        // Math.random here is fine (this runs once, inside an effect, never
        // during render).
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 2.6;
        targets[i * 3] = px + Math.cos(angle) * radius * 0.6;
        targets[i * 3 + 1] = py + Math.abs(Math.sin(angle)) * radius + Math.random() * 1.4;
        targets[i * 3 + 2] = pz + Math.random() * 2.2;

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = 1 - v;
        i++;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
  }, [count]);

  useFrame((state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const material = materialRef.current;
    if (!material) return;

    const progress = progressRef.current;
    const active = isChapterActive(progress, MODEL_CHAPTER_ID);
    const p = active ? progress.chapterProgress : 0;

    let targetOpacity = 0;
    let dissolve = 0;
    if (active) {
      if (p < ARRIVE_START) {
        targetOpacity = 0;
      } else if (p < HOLD_END) {
        targetOpacity = THREE.MathUtils.smoothstep(p, ARRIVE_START, ARRIVE_START + 0.06);
        dissolve = 0;
      } else if (p < DISSOLVE_END) {
        const t = (p - HOLD_END) / (DISSOLVE_END - HOLD_END);
        dissolve = t;
        targetOpacity = 1 - THREE.MathUtils.smoothstep(t, 0.55, 1);
      } else {
        targetOpacity = 0;
        dissolve = 1;
      }
    }

    opacityRef.current += (targetOpacity - opacityRef.current) * Math.min(1, delta * 4);
    material.uniforms.uOpacity.value = opacityRef.current * 0.85;
    material.uniforms.uDissolve.value = dissolve;
  });

  return (
    <points visible>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={{
          uTexture: { value: texture },
          uDissolve: { value: 0 },
          uOpacity: { value: 0 },
          uPointSize: { value: 2.4 },
          uWarmTint: { value: WARM_TINT },
        }}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

/**
 * Renders `null` until the texture is loaded (never a spinner or a broken
 * canvas) — the DOM fallback owns the moment until then, per
 * `useWebGLActive`. Particle count is device-tiered here rather than reused
 * from `CosmicTier`: this needs its own, coarser budget (a few thousand
 * points, not tens of thousands) independent of the star/nebula quality
 * settings.
 */
export default function PhotoDissolve({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const near = useNearChapter(MODEL_CHAPTER_ID, "150% 0px");
  const state = useSignatureTexture(near);
  const count = narrow || coarsePointer ? 1600 : 5400;

  if (state?.status !== "loaded") return null;
  return <LoadedPhotoDissolve texture={state.texture} progressRef={progressRef} count={count} />;
}
