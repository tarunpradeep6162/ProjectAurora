"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  AURORA_SEQUENCE_LENGTH,
  masterSheet,
  theatreCamera,
  theatreWorld,
} from "./auroraProject";
import type { SceneProgressRef } from "@/components/cosmic/sceneProgress";

export type TheatreCameraCorrection = {
  fovBias: number;
  driftMultiplier: number;
  boostX: number;
  boostY: number;
  boostZ: number;
};

const IDENTITY_CORRECTION: TheatreCameraCorrection = {
  fovBias: 0,
  driftMultiplier: 1,
  boostX: 0,
  boostY: 0,
  boostZ: 0,
};

/**
 * Subscribes once to the live Theatre "Camera" object and mirrors its
 * values into a plain ref — never React state, so a Studio edit (or the
 * object's own default) can never trigger a re-render of anything in the
 * R3F tree. `CameraRig` (CosmicScene.tsx) reads this ref inside its own
 * `useFrame` and applies it as a small correction on top of the existing
 * hand-authored spline, after computing that spline's own target pose.
 */
export function useTheatreCameraCorrection(): RefObject<TheatreCameraCorrection> {
  const ref = useRef<TheatreCameraCorrection>({ ...IDENTITY_CORRECTION });

  useEffect(() => {
    return theatreCamera.onValuesChange((v) => {
      ref.current.fovBias = v.fovBias;
      ref.current.driftMultiplier = v.driftMultiplier;
      ref.current.boostX = v.positionBoost.x;
      ref.current.boostY = v.positionBoost.y;
      ref.current.boostZ = v.positionBoost.z;
    });
  }, []);

  return ref;
}

/**
 * Same pattern as above, for the "World" object's offset — read by the
 * `<group>` in CosmicScene.tsx that wraps every visual object (stars,
 * nebula, moons, Tarun, the couple, the photo dissolve) but not the camera
 * or the lights.
 */
export function useTheatreWorldOffset(): RefObject<THREE.Vector3> {
  const ref = useRef(new THREE.Vector3());

  useEffect(() => {
    return theatreWorld.onValuesChange((v) => {
      ref.current.set(v.offset.x, v.offset.y, v.offset.z);
    });
  }, []);

  return ref;
}

/**
 * Drives Theatre's one shared master sequence from the canonical scroll
 * signal (`sceneProgress`'s `storyPosition`) every frame — this is the "one
 * shared cinematic clock" the brief asks for, and it is genuinely live:
 * open `@theatre/studio` locally (it self-initializes in development, see
 * auroraProject.ts) and its timeline playhead scrubs in real time as the
 * real site is scrolled, because it's reading the same number everything
 * else on the page already agrees on. No React state, no allocation.
 */
export function TheatreClock({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  useFrame(() => {
    masterSheet.sequence.position = progressRef.current.storyPosition * AURORA_SEQUENCE_LENGTH;
  });
  return null;
}
