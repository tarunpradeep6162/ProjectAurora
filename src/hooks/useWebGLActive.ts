"use client";

import { useEffect, useState } from "react";

/**
 * Whether the persistent cosmic canvas is actually live right now —
 * `CosmicBackdrop.tsx` is the single source of truth, setting
 * `data-webgl="on"` on `<html>` once it has decided reduced motion, a
 * low-power device and WebGL availability all allow it, and clearing it on
 * unmount or a lost context. Consumers use this to know whether a WebGL-only
 * enhancement (the Journey photo-dissolve particle system) is the thing on
 * screen right now, or whether its DOM/CSS fallback is carrying the moment
 * instead — never both at once.
 *
 * A `MutationObserver` on the one attribute, not a poll: this can flip at
 * any time (a lost GL context mid-visit), and the same
 * `useSyncExternalStore`-adjacent pattern this project already uses
 * elsewhere (sceneProgress.ts, HiddenMessages.tsx) for exactly this reason —
 * cheap, and correct if the value changes after mount.
 */
export function useWebGLActive(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setActive(root.getAttribute("data-webgl") === "on");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-webgl"] });
    return () => observer.disconnect();
  }, []);

  return active;
}
