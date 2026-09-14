"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { keyframes } from "./cakeMotion";
import type { CakeMotion } from "./cakeMotion";
import { CONFETTI_BOTTOM, CONFETTI_KINDS, CONFETTI_TOP } from "./celebrationData";

// Reused every frame to write instance matrices; never read back.
const scratch = new THREE.Object3D();
const scratchColor = new THREE.Color();

/**
 * Overall visibility, keyed to seconds since the wish — the original's
 * curve: a quick rise, a full hold, then it thins to an ambient scatter that
 * keeps drifting rather than stopping outright.
 */
function confettiEnvelope(elapsed: number, reduced: boolean): number {
  const value = keyframes(elapsed, [[0, 0], [2.4, 0], [3, 1], [11.4, 1], [18.4, 0.45]]);
  return reduced ? value * 0.4 : value;
}

type Piece = {
  kindIndex: number;
  x: number;
  z: number;
  offset: number;
  fallSpeed: number;
  swayAmp: number;
  swayFreq: number;
  spinPhase: number;
};

function buildPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    kindIndex: i % CONFETTI_KINDS.length,
    x: (Math.random() - 0.5) * 4.4,
    z: (Math.random() - 0.5) * 2.6 - 0.4,
    offset: Math.random(),
    fallSpeed: 0.32 + Math.random() * 0.7,
    swayAmp: 0.12 + Math.random() * 0.3,
    swayFreq: 0.4 + Math.random() * 0.8,
    spinPhase: Math.random() * Math.PI * 2,
  }));
}

/**
 * Falling confetti after the wish, ported from the original — thin coloured
 * planes rather than simulated paper, looping continuously rather than
 * firing once. Count is well down from the original's 220/90 (first to
 * 120/60, now 64/32): a restrained scatter of champagne/rose/ivory light,
 * not a party-cannon burst, and plenty of headroom for the cake, candles
 * and the persistent galaxy alongside it.
 */
export default function Confetti({
  motion,
  reduced,
  compact,
}: {
  motion: RefObject<CakeMotion>;
  reduced: boolean;
  compact: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const coloredRef = useRef(false);
  const count = compact ? 32 : 64;
  const pieces = useMemo(() => buildPieces(count), [count]);
  const range = CONFETTI_TOP - CONFETTI_BOTTOM;

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = motion.current.elapsed;
    const envelope = elapsed === null ? 0 : confettiEnvelope(elapsed, reduced);

    if (!coloredRef.current) {
      pieces.forEach((piece, i) => {
        scratchColor.set(CONFETTI_KINDS[piece.kindIndex].color);
        mesh.setColorAt(i, scratchColor);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      coloredRef.current = true;
    }

    mesh.visible = envelope > 0.01;
    if (!mesh.visible) return;

    const t = state.clock.elapsedTime;
    const activeCount = Math.floor(pieces.length * envelope);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (i >= activeCount) {
        scratch.scale.setScalar(1e-4);
        scratch.position.set(0, CONFETTI_TOP, 0);
        scratch.updateMatrix();
        mesh.setMatrixAt(i, scratch.matrix);
        continue;
      }
      const fall = reduced ? piece.offset : (piece.offset + t * piece.fallSpeed * 0.06) % 1;
      const y = CONFETTI_TOP - fall * range;
      const sway = Math.sin(t * piece.swayFreq + piece.spinPhase) * piece.swayAmp;
      const kind = CONFETTI_KINDS[piece.kindIndex];
      scratch.position.set(piece.x + sway, y, piece.z);
      if (reduced) {
        scratch.rotation.set(0, piece.spinPhase, 0);
      } else {
        scratch.rotation.set(
          t * kind.spin * 0.6 + piece.spinPhase,
          t * kind.spin + piece.spinPhase,
          Math.sin(t * piece.swayFreq) * 0.5
        );
      }
      scratch.scale.set(...kind.scale);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} visible={false} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        emissive="#ffffff"
        emissiveIntensity={0.35}
        roughness={0.4}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
