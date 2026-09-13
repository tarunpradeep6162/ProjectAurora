"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { hasReachedChapter, type SceneProgressRef } from "./sceneProgress";

type MoonVariant = "primary" | "secondary";

const VARIANTS: Record<
  MoonVariant,
  {
    position: [number, number, number];
    scale: number;
    color: string;
    opacity: number;
  }
> = {
  // Pushed further back (was z -14) and shrunk (was scale 1.6) so it sits
  // high in the corner of the frame instead of hanging over the middle of
  // the column where the headings are, and dimmed off near-white towards a
  // dusty bronze-champagne. The reference for this is a moon seen through
  // atmosphere at night, not a studio-lit sphere.
  primary: {
    position: [7.6, 4.1, -21],
    scale: 1.28,
    color: "#bda882",
    opacity: 1,
  },
  // A smaller, quieter companion (brief Part 1's "second moon" suggestion)
  // that joins the sky once the visitor reaches "The journey between us" —
  // a pale, cooler champagne-silver rather than a repeat of the primary's
  // warm gold, so the two read as distinct without leaving the palette.
  // Pushed much further out than the primary (z -34 against -21) so the two
  // genuinely separate in depth rather than looking like two spheres pinned
  // to the same plane, and held well below full opacity so it stays a
  // suggestion.
  secondary: {
    position: [-10.5, -3.1, -34],
    scale: 0.5,
    color: "#b9b3a8",
    opacity: 0.55,
  },
};

/**
 * A quiet, softly-lit sphere standing in for the sibling project's
 * photo-textured moon (`src/scene/Moon.jsx`). That version pulls a 15MB
 * JPEG and downscales it client-side — too heavy a network cost for what
 * is meant to be a light background flourish, and a literal grey moon photo
 * doesn't sit naturally in this project's gold-on-obsidian palette. This
 * keeps the same "one glowing orb drifting in frame" idea as a procedural
 * champagne/bronze-shaded sphere instead, at zero extra network cost.
 *
 * `variant="secondary"` renders the second, smaller moon: invisible until
 * the visitor reaches the Journey chapter, then fades in and — via a
 * component-local latch, not a live chapter check — stays, echoing that
 * chapter's "choosing each other" throughline as a quiet permanence rather
 * than something that reverses if the visitor scrolls back up.
 */
export default function CosmicMoon({
  variant = "primary",
  progressRef,
}: {
  variant?: MoonVariant;
  progressRef?: RefObject<SceneProgressRef>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const opacityRef = useRef(0);
  const everReachedRef = useRef(false);
  const config = VARIANTS[variant];

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.03;

    if (variant === "secondary" && materialRef.current) {
      if (progressRef && hasReachedChapter(progressRef.current, "journey")) {
        everReachedRef.current = true;
      }
      const target = everReachedRef.current ? config.opacity : 0;
      opacityRef.current += (target - opacityRef.current) * Math.min(1, delta * 0.8);
      materialRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <mesh ref={meshRef} position={config.position} scale={config.scale}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial
        ref={materialRef}
        color={config.color}
        roughness={0.95}
        metalness={0}
        transparent={variant === "secondary"}
        opacity={variant === "secondary" ? 0 : 1}
      />
    </mesh>
  );
}
