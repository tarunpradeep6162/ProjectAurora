"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
}

function getSnapshot(query: string) {
  return () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };
}

function getServerSnapshot() {
  return false;
}

/**
 * Generic matchMedia hook, same reactive pattern as useReducedMotion.
 * Always returns `false` on the server / before hydration so nothing
 * conditionally renders different markup between server and client —
 * consumers should only use this to adjust *behavior* inside effects,
 * not to change what gets rendered on first paint.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    getSnapshot(query),
    getServerSnapshot
  );
}

/** True for touch/stylus-primary input — used to disable hover-only affordances. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

/** True at narrow (phone/small-tablet) viewport widths. */
export function useNarrowViewport(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
