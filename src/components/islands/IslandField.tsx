"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";
import Island, { type IslandMotion } from "./Island";
import { ISLAND_SCENES } from "./islandData";
import { focusWindow, slotPosition } from "@/lib/curves";
import { isChapterActive, type SceneProgressRef } from "@/components/cosmic/sceneProgress";

/** Chapter 03 ("Our story became a world") pins for five viewport-heights of scroll — see ChapterTimeline.tsx — one per island, in the same order as `timeline`. */
const HOST_CHAPTER_ID = "story";

/** Half-width of each island's focus window in chapter progress, the original's. */
const WINDOW_HALF_WIDTH = 0.22;

/**
 * World placement for the five islands: a loose, winding path drifting past
 * the "story" chapter's camera position, below the horizon line the way
 * `CoupleModel` stages its own figure. Not the original's raw coordinates
 * (those were authored for a camera system this project doesn't share) —
 * composed for this project's own camera arc instead.
 */
const ISLAND_POSITIONS: [number, number, number][] = [
  [-1.1, -0.35, 2.6],
  [1.0, -0.45, 1.6],
  [-0.9, -0.55, 0.5],
  [0.85, -0.6, -0.6],
  [-0.6, -0.68, -1.8],
];

function createMotion(): IslandMotion {
  return { opacity: 0 };
}

/**
 * Advances one island's activation toward its target. Takes the ref itself
 * (never captured from an outer array) so each call writes straight through
 * a ref this component owns — the same pattern `CameraRig` uses for its own
 * per-frame state.
 */
function updateIslandMotion(
  ref: RefObject<IslandMotion>,
  index: number,
  count: number,
  active: boolean,
  chapterProgress: number,
  damp: number
) {
  const m = ref.current;
  if (!m) return;
  const slot = slotPosition(index, count);
  const target = active ? focusWindow(chapterProgress, slot, WINDOW_HALF_WIDTH) : 0;
  m.opacity += (target - m.opacity) * damp;
}

/**
 * The five little 3D scenes behind Chapter 03's timeline (see
 * `islandData.ts`), each fading in as its own moment reaches the centre of
 * the pinned scroll and fading out again as the next takes over — mirroring
 * the same crossfade the DOM captions in `ChapterTimeline` already use, so
 * the 3D vignette and the text stay in lockstep.
 */
export default function IslandField({
  progressRef,
  compact,
  reduced,
}: {
  progressRef: RefObject<SceneProgressRef>;
  compact: boolean;
  reduced: boolean;
}) {
  // `ISLAND_SCENES` is a fixed 5-entry constant, so five explicit `useRef`
  // calls (rather than one built inside a loop or `.map`) keep this a
  // static, unconditional set of hook calls. Each ref object — not its
  // `.current` — is what gets handed to its `<Island>` below, so nothing
  // here reads a ref's value during render.
  const motion0 = useRef<IslandMotion>(createMotion());
  const motion1 = useRef<IslandMotion>(createMotion());
  const motion2 = useRef<IslandMotion>(createMotion());
  const motion3 = useRef<IslandMotion>(createMotion());
  const motion4 = useRef<IslandMotion>(createMotion());
  const motionRefs: RefObject<IslandMotion>[] = [motion0, motion1, motion2, motion3, motion4];
  const count = motionRefs.length;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const progress = progressRef.current;
    const active = isChapterActive(progress, HOST_CHAPTER_ID);
    const chapterProgress = progress.chapterProgress;
    const damp = 1 - Math.exp(-delta / 0.35);

    updateIslandMotion(motion0, 0, count, active, chapterProgress, damp);
    updateIslandMotion(motion1, 1, count, active, chapterProgress, damp);
    updateIslandMotion(motion2, 2, count, active, chapterProgress, damp);
    updateIslandMotion(motion3, 3, count, active, chapterProgress, damp);
    updateIslandMotion(motion4, 4, count, active, chapterProgress, damp);
  });

  // Five explicit elements rather than `.map()` over `motionRefs`: each
  // `<Island>` needs its own named ref handed to it directly (see the note
  // on `motion0`..`motion4` above) — indexing into an array of refs inside
  // JSX loses the static reference the lint (and React) needs to track.
  return (
    <>
      <group position={ISLAND_POSITIONS[0]}>
        <Island scene={ISLAND_SCENES[0]} motion={motion0} compact={compact} reduced={reduced} seed={0} />
      </group>
      <group position={ISLAND_POSITIONS[1]}>
        <Island scene={ISLAND_SCENES[1]} motion={motion1} compact={compact} reduced={reduced} seed={3.7} />
      </group>
      <group position={ISLAND_POSITIONS[2]}>
        <Island scene={ISLAND_SCENES[2]} motion={motion2} compact={compact} reduced={reduced} seed={7.4} />
      </group>
      <group position={ISLAND_POSITIONS[3]}>
        <Island scene={ISLAND_SCENES[3]} motion={motion3} compact={compact} reduced={reduced} seed={11.1} />
      </group>
      <group position={ISLAND_POSITIONS[4]}>
        <Island scene={ISLAND_SCENES[4]} motion={motion4} compact={compact} reduced={reduced} seed={14.8} />
      </group>
    </>
  );
}
