"use client";

import { useSyncExternalStore } from "react";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let lowPowerCache: boolean | null = null;

/**
 * "Should this device skip WebGL entirely?" Deliberately conservative: only
 * clear signals count.
 *
 *  - Data Saver is on.
 *  - Two or fewer logical cores, or 2GB or less of device memory (Chromium
 *    exposes this; other engines simply don't contribute the signal).
 *  - No WebGL, or WebGL that the browser itself says would carry a major
 *    performance caveat (software rendering / a blocklisted GPU). The probe
 *    context is released immediately.
 *
 * Measured once per page load and cached, so it is safe to call from a
 * `useSyncExternalStore` snapshot.
 */
function detectLowPower(): boolean {
  if (lowPowerCache !== null) return lowPowerCache;
  const nav = navigator as NavigatorHints;
  let low = false;
  if (nav.connection?.saveData) {
    low = true;
  } else if (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) {
    low = true;
  } else if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 2) {
    low = true;
  } else {
    try {
      const canvas = document.createElement("canvas");
      const attrs: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
      const gl: WebGLRenderingContext | WebGL2RenderingContext | null =
        canvas.getContext("webgl2", attrs) ?? canvas.getContext("webgl", attrs);
      if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
      else low = true;
    } catch {
      low = true;
    }
  }
  lowPowerCache = low;
  return low;
}

const subscribeNever = () => () => {};

/** Static per-visit signal; the server snapshot keeps WebGL off until hydration. */
export function useLowPowerDevice(): boolean {
  return useSyncExternalStore(subscribeNever, detectLowPower, () => true);
}
