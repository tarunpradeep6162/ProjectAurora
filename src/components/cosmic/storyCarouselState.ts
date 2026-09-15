"use client";

import { useSyncExternalStore } from "react";

/**
 * Which card StoryCarousel.tsx currently has at the front, shared with the
 * merged story chapter's DOM caption (ChapterStory.tsx) so the small visible
 * caption below the carousel always names whatever the visitor is actually
 * looking at. Same minimal external-store pattern HiddenMessages.tsx already
 * uses for its found-state, rather than routing this through React context
 * or a prop drilled down from CosmicScene — the WebGL canvas and the DOM
 * caption are siblings in the tree, not parent/child.
 */
let activeIndex = 0;
const listeners = new Set<() => void>();

export function setActiveCardIndex(index: number) {
  if (index === activeIndex) return;
  activeIndex = index;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useActiveCardIndex(): number {
  return useSyncExternalStore(
    subscribe,
    () => activeIndex,
    () => 0
  );
}

/** Plain, non-React read of the same value — for `useFrame` loops (e.g.
 * StoryPlantWall.tsx's "Hard Days" mood dip), which aren't React render
 * contexts and shouldn't subscribe to re-renders just to read one number
 * every frame. */
export function getActiveCardIndex(): number {
  return activeIndex;
}
