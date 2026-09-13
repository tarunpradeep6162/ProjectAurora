"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SceneProgressRef } from "./sceneProgress";

function buildNebulaMesh() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uDepth: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(
          typeof window !== "undefined" ? window.innerWidth : 1920,
          typeof window !== "undefined" ? window.innerHeight : 1080
        ),
      },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uDepth;
      uniform vec2 uResolution;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          sum += amp * noise(p);
          p = p * 2.02 + vec2(4.7, 2.3);
          amp *= 0.5;
        }
        return sum;
      }

      void main() {
        vec2 uv = vUv - 0.5;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
        float t = uTime * 0.02;

        float cloud = fbm(uv * 1.8 + vec2(t, t * 0.6));
        float detail = fbm(uv * 3.4 - vec2(t * 0.8, t * 0.3));

        /* Aurora candlelight palette: near-black, bronze, champagne, ivory. */
        vec3 deep = vec3(0.027, 0.024, 0.02);
        vec3 bronze = vec3(0.16, 0.12, 0.07);
        vec3 champagne = vec3(0.44, 0.35, 0.22);
        vec3 gold = vec3(0.84, 0.72, 0.48);

        /* Desaturated hard from the original mix. The nebula's job is to be
           atmospheric *colour in the dark* — a sense that the black is not
           uniform — not a visible cloud with its own shape. The champagne
           and gold contributions in particular were strong enough that the
           plane read as a distinct object floating behind the text. */
        vec3 color = mix(deep, bronze, smoothstep(0.36, 0.82, cloud));
        color = mix(color, champagne, smoothstep(0.55, 0.92, detail) * 0.4);
        color += gold * pow(max(detail - 0.76, 0.0), 2.0) * 0.25;

        /* "Traveling deeper into space" (brief Part 1): as the whole page
           scrolls, blend a touch of near-black indigo into the nebula so it
           reads as further/colder without ever leaving the established
           candlelight family — capped well short of a visible palette swap. */
        vec3 indigo = vec3(0.035, 0.035, 0.06);
        color = mix(color, indigo, uDepth * 0.3);

        float mask = smoothstep(0.34, 0.92, cloud * 0.6 + detail * 0.5);
        float vignette = 1.0 - smoothstep(0.3, 1.1, length(uv));
        float alpha = mask * 0.2 * mix(0.55, 1.0, vignette);

        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.24));
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.position.set(0, 0, -35);
  mesh.scale.setScalar(90);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Single fbm-noise nebula plane, ported from the Vite sibling's
 * `src/scene/Nebula.jsx`. Re-tinted from that project's violet/rose/gold
 * palette into this project's candlelight gold/bronze range so it reads as
 * an extension of the established palette rather than a generic "cosmic"
 * gradient.
 *
 * Built imperatively inside an effect and only ever touched from inside
 * `useFrame` (see StarField.tsx for why) rather than through declarative
 * JSX material/geometry props, since its `uTime` uniform and transform are
 * both mutated every frame.
 */
export default function CosmicNebula({
  progressRef,
}: {
  progressRef?: RefObject<SceneProgressRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const group = groupRef.current;
    const mesh = buildNebulaMesh();
    meshRef.current = mesh;
    group?.add(mesh);
    return () => {
      group?.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      meshRef.current = null;
    };
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uDepth.value = progressRef?.current.overall ?? 0;
    mesh.rotation.z = Math.sin(clock.elapsedTime * 0.015) * 0.01;
    // Keep the backdrop centred on the camera so its (finite) edges never
    // scroll into view as the camera drifts.
    mesh.position.set(camera.position.x, camera.position.y, camera.position.z - 35);
  });

  return <group ref={groupRef} />;
}
