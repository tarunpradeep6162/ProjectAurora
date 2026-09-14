"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SceneProgressRef } from "./sceneProgress";
import { gradeAt } from "./grade";

/**
 * Star temperatures, weighted. Deliberately dominated by whites: an earlier
 * revision drew from a five-colour list that was three parts accent, which
 * made the sky read as a colour haze rather than as stars. Rose/lavender is
 * the rare accent here, not the population — most stars are plain neutral
 * or warm white, closer to how a real sky reads, with only a scattered few
 * carrying any tint at all and fewer still the rose accent.
 */
const TEMPERATURES: Array<{ hex: string; weight: number }> = [
  { hex: "#f0e8e1", weight: 0.62 }, // neutral white
  { hex: "#ddd0c9", weight: 0.22 }, // warm white
  { hex: "#c6bcd4", weight: 0.12 }, // faint lavender-white
  { hex: "#b6738f", weight: 0.04 }, // dusty rose, rare
];

/**
 * Four perceived depth layers plus a fifth, invisible-as-points "core haze"
 * tier. Layers are a vertex attribute rather than separate `THREE.Points`
 * objects so the whole sky stays one draw call: depth is expressed through
 * radius (real perspective parallax), spin rate, size and opacity, all read
 * from `aLayer` in the shader.
 *
 * `share` is the fraction of the total budget each layer receives; `radius`
 * is its distance band from the camera's resting position.
 */
const LAYERS = [
  { share: 0.42, radius: [46, 78] as const }, // 0 — distant universe
  { share: 0.36, radius: [26, 46] as const }, // 1 — midfield
  { share: 0.19, radius: [14, 26] as const }, // 2 — atmospheric dust
  { share: 0.02, radius: [7, 14] as const }, // 3 — foreground bokeh
  { share: 0.01, radius: [52, 66] as const }, // 4 — galaxy core haze
];

/** Direction of the one distant galactic-light region (unit-ish vector). */
const CORE_DIR = new THREE.Vector3(-0.62, 0.26, -0.74).normalize();

function pickTemperature(): THREE.Color {
  let r = Math.random();
  for (const t of TEMPERATURES) {
    if (r < t.weight) return new THREE.Color(t.hex);
    r -= t.weight;
  }
  return new THREE.Color(TEMPERATURES[0].hex);
}

/**
 * Brightness in three tiers rather than one continuous ramp: overwhelmingly
 * faint, a few medium, very few genuinely bright. A sky where brightness is
 * uniformly distributed reads as noise; the tiering is what makes a handful
 * of stars feel like landmarks.
 */
function pickBrightness(): number {
  const r = Math.random();
  if (r > 0.98) return 0.85 + Math.random() * 0.15; // ~2% bright
  if (r > 0.86) return 0.6 + Math.random() * 0.25; // ~12% medium
  return 0.32 + Math.random() * 0.28; // ~86% faint
}

/**
 * Cluster centres give the sky composition. Pure uniform-random placement —
 * what this used to do — produces an even speckle with no sparse regions and
 * no groupings, which is the one distribution a real sky never has. Roughly
 * half the stars are drawn toward a centre, leaving genuine voids between
 * them; negative space is as much a part of the composition as the stars.
 */
function makeClusterCentres(n: number): THREE.Vector3[] {
  const centres: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    centres.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1.1,
        (Math.random() - 0.5) * 2
      ).normalize()
    );
  }
  return centres;
}

function buildPoints(total: number) {
  const counts = LAYERS.map((l) => Math.max(1, Math.round(total * l.share)));
  const count = counts.reduce((a, b) => a + b, 0);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const brights = new Float32Array(count);
  const layers = new Float32Array(count);

  const centres = makeClusterCentres(7);
  let i = 0;

  for (let layer = 0; layer < LAYERS.length; layer++) {
    const [rMin, rMax] = LAYERS[layer].radius;
    const isCore = layer === 4;

    for (let n = 0; n < counts[layer]; n++, i++) {
      let dir: THREE.Vector3;

      if (isCore) {
        // The galactic core: a tight, slightly flattened concentration around
        // one fixed direction, so it reads as a distant region of the galaxy
        // rather than a sphere of stars around the viewer.
        dir = CORE_DIR.clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.16,
              (Math.random() - 0.5) * 0.5
            )
          )
          .normalize();
      } else if (Math.random() < 0.5) {
        // Clustered: jitter around a centre, tighter for distant layers so
        // near-field particles stay loose and atmospheric.
        const c = centres[Math.floor(Math.random() * centres.length)];
        const spread = layer === 0 ? 0.3 : 0.45;
        dir = c
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread
            )
          )
          .normalize();
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        );
      }

      const radius = rMin + Math.random() * (rMax - rMin);
      positions[i * 3] = dir.x * radius;
      // Flattened vertically — a galactic plane rather than a ball, which also
      // keeps stars out of the vertical band where most text sits.
      positions[i * 3 + 1] = dir.y * radius * 0.62;
      positions[i * 3 + 2] = dir.z * radius - 20;

      const c = isCore ? new THREE.Color("#efe4e2") : pickTemperature();
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      if (isCore) {
        sizes[i] = 34 + Math.random() * 26;
        brights[i] = 0.1 + Math.random() * 0.06;
      } else if (layer === 3) {
        sizes[i] = 3 + Math.random() * 3; // foreground bokeh, defocused
        brights[i] = 0.12 + Math.random() * 0.12;
      } else if (layer === 2) {
        sizes[i] = 0.5 + Math.random() * 0.6; // atmospheric dust
        brights[i] = 0.18 + Math.random() * 0.2;
      } else {
        const b = pickBrightness();
        sizes[i] = (layer === 0 ? 0.5 : 0.85) + b * (layer === 0 ? 0.7 : 1.2);
        brights[i] = b;
      }

      phases[i] = Math.random() * Math.PI * 2;
      // Per-star twinkle frequency. Previously every star shared one rate and
      // only its phase differed, which makes the whole sky pulse in lockstep
      // patterns once you notice it. Faint stars are allowed to shimmer a
      // little faster than bright ones, as atmosphere actually behaves.
      speeds[i] = 0.18 + Math.random() * 0.62;
      layers[i] = layer;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aBright", new THREE.BufferAttribute(brights, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layers, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uAngle: { value: 0 },
      uPixelRatio: { value: 1 },
      uCalm: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAngle;
      uniform float uPixelRatio;
      uniform float uCalm;
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aBright;
      attribute float aLayer;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSoft;

      void main() {
        // Differential drift per depth layer: the distant universe and the
        // galactic core stay fixed (the core has to stay aligned with the
        // nebula's bulge), the near field moves most. Combined with real
        // perspective parallax from the radius bands, this sells depth
        // without simply adding more stars.
        //
        // uAngle is integrated on the CPU. Computing it here as
        // uTime * rate(uCalm) made the angle jump whenever calm changed at a
        // chapter boundary, by more than a full turn once a visit had run a
        // few minutes.
        float mul = aLayer > 3.5 ? 0.0
          : aLayer > 2.5 ? 1.8
          : aLayer > 1.5 ? 1.0
          : aLayer > 0.5 ? 0.35
          : 0.0;
        float ang = uAngle * mul;
        float s = sin(ang);
        float c = cos(ang);
        // Rotate about the shell's own centre (z = -20), not the world
        // origin, so the layers turn in place instead of orbiting the camera.
        vec3 p = position;
        p.z += 20.0;
        p.xz = mat2(c, -s, s, c) * p.xz;
        p.z -= 20.0;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        // Small luminosity variation only — never invisible-to-full-white.
        float twinkle = 0.86 + sin(uTime * aSpeed + aPhase) * 0.14;

        float maxSize = aLayer > 3.5 ? 150.0 : (aLayer > 2.5 ? 34.0 : 9.0);
        gl_PointSize = clamp(
          aSize * twinkle * uPixelRatio * (60.0 / max(3.0, -mv.z)),
          1.0,
          maxSize
        );

        vColor = aColor;
        vAlpha = aBright * twinkle;
        // Bokeh and core haze render as soft discs; true stars stay tight.
        vSoft = aLayer > 2.5 ? 1.0 : 0.0;
      }
    `,
    fragmentShader: `
      uniform float uCalm;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSoft;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float tight = 1.0 - smoothstep(0.0, 0.5, d);
        float soft = 1.0 - smoothstep(0.0, 0.5, d);
        soft = soft * soft;
        float core = mix(tight, soft, vSoft);
        gl_FragColor = vec4(vColor, core * vAlpha * (1.0 - uCalm * 0.62));
      }
    `,
  });

  return new THREE.Points(geometry, material);
}

/**
 * GPU-light layered starfield: one additive-blended points draw call, no
 * external assets, with depth, star temperature, brightness tiering and
 * per-star twinkle frequency all encoded as vertex attributes so the sky has
 * composition rather than uniform speckle. Includes one distant galactic-core
 * region as a concentration of stars plus a very faint haze, rendered from
 * the same buffer rather than as a second pass.
 *
 * Built and attached imperatively inside an effect rather than through
 * declarative JSX props: the geometry needs `Math.random` (impure, so it
 * can't run during render) and the material's `uTime` uniform is mutated
 * every frame, and this project's stricter (React Compiler-era) hooks lint
 * disallows both calling impure functions during render and reading a ref's
 * `.current` during render.
 */
export default function CosmicStarField({
  count = 2100,
  progressRef,
}: {
  count?: number;
  progressRef?: RefObject<SceneProgressRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const calmRef = useRef(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const group = groupRef.current;
    const points = buildPoints(count);
    pointsRef.current = points;
    group?.add(points);
    return () => {
      group?.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
      pointsRef.current = null;
    };
  }, [count]);

  useFrame((state, delta) => {
    // A hidden tab should not keep driving shader time; nothing here needs to
    // stay in sync with wall-clock, so pausing is free and resuming is safe.
    if (typeof document !== "undefined" && document.hidden) return;

    const points = pointsRef.current;
    if (!points) return;
    const material = points.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);

    // "How quiet should the sky be right now" comes from the shared
    // per-chapter grading table (grade.ts) rather than a hard `=== "letter"`
    // check, so it eases across chapter boundaries along with every other
    // graded property instead of snapping on and off at one of them.
    const targetCalm = progressRef
      ? gradeAt(progressRef.current.storyPosition).quiet
      : 0;
    calmRef.current += (targetCalm - calmRef.current) * Math.min(1, delta * 1.5);
    material.uniforms.uCalm.value = calmRef.current;

    angleRef.current += delta * 0.006 * (1 - calmRef.current * 0.6);
    material.uniforms.uAngle.value = angleRef.current;
  });

  return <group ref={groupRef} />;
}
