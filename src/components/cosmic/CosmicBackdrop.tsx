"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  useCoarsePointer,
  useMediaQuery,
  useNarrowViewport,
} from "@/hooks/useMediaQuery";
import type { CosmicTier } from "./CosmicScene";

// The WebGL canvas has no server-side equivalent and is non-trivial GPU
// work, so it is loaded only on the client and only once we've decided it
// is worth mounting at all (see the gating below). The `type` import above
// is erased at build time and does not pull this chunk in early.
const CosmicScene = dynamic(() => import("./CosmicScene"), { ssr: false });

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let lowPowerCache: boolean | null = null;

/**
 * "Should this device get the CSS sky instead of WebGL at all?" — the fourth,
 * low-power tier. Deliberately conservative: only clear signals count.
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

/** Static per-visit signal; the server snapshot keeps the canvas off until hydration. */
function useLowPowerDevice(): boolean {
  return useSyncExternalStore(subscribeNever, detectLowPower, () => true);
}

/**
 * Ported from the Vite/R3F sibling project's `src/scene/CosmicCanvas.jsx`
 * (starfield + nebula + moon), reimplemented here as a proper Next.js
 * client component and re-tinted into this project's gold-on-obsidian
 * palette instead of that project's blue/violet cosmic look.
 *
 * Mounted once at the page level (see `page.tsx`) as a `position: fixed`
 * layer behind every chapter, rather than scoped to the portal section —
 * the brief's "space as the whole site's identity, not just the opening"
 * ask. Chapters keep their sections transparent/low-opacity so this shows
 * through continuously as the page scrolls; the camera arc inside
 * `CosmicScene` reads whole-story progress, so the "flying through space"
 * motion plays across the entire site.
 *
 * Quality tiers, decided here and handed to the scene:
 *
 *   high    desktop (fine pointer, >= 768px wide)
 *   medium  tablet (coarse pointer, >= 768px wide, not a landscape phone)
 *   low     phone (< 768px wide, or a coarse-pointer landscape phone)
 *   (none)  reduced motion, or a low-power device — the CSS sky alone
 *
 * This never *replaces* the CSS cosmic layer (`CosmicAtmosphere`) — it
 * layers on top of it as a progressive enhancement. Whenever the canvas is
 * absent for any reason at all (reduced motion, a low-power device, WebGL
 * unavailable, or the GL context being lost mid-visit) that graded CSS sky
 * is already the complete, fully-visible backdrop underneath, so there is no
 * state this component can reach that leaves a chapter looking broken or
 * empty — and no failure that needs an error overlay in front of someone who
 * is trying to read a love letter.
 */
export default function CosmicBackdrop() {
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const coarsePointer = useCoarsePointer();
  const landscapePhone = useMediaQuery("(pointer: coarse) and (max-height: 600px)");
  const lowPower = useLowPowerDevice();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const tier: CosmicTier =
    narrow || landscapePhone ? "low" : coarsePointer ? "medium" : "high";
  const shouldSkip = reduced || lowPower || contextLost;

  useEffect(() => {
    // Nothing to do when skipped — the render check below already hides
    // the canvas regardless of `ready`, so there's no need to reset state
    // here (and doing so synchronously inside the effect body is exactly
    // the cascading-render pattern this project's hooks lint disallows).
    if (shouldSkip) return;
    // Mount on the next tick rather than immediately, so this never
    // competes with the portal's own entrance timeline for the first paint.
    const id = window.setTimeout(() => setReady(true), 50);
    return () => window.clearTimeout(id);
  }, [shouldSkip]);

  // Tells the stylesheet whether the canvas is currently carrying the sky.
  // When it isn't, CosmicAtmosphere's static CSS starfield fades up to take
  // its place (see `:root:not([data-webgl="on"])` in globals.css).
  const canvasLive = !shouldSkip && ready && visible;
  useEffect(() => {
    const root = document.documentElement;
    if (canvasLive) {
      root.setAttribute("data-webgl", "on");
      root.setAttribute("data-cosmic-tier", tier);
    } else {
      root.removeAttribute("data-webgl");
      root.removeAttribute("data-cosmic-tier");
    }
    return () => {
      root.removeAttribute("data-webgl");
      root.removeAttribute("data-cosmic-tier");
    };
  }, [canvasLive, tier]);

  if (shouldSkip || !ready) return null;

  return (
    <div
      aria-hidden="true"
      data-motion-exempt
      className="pointer-events-none fixed inset-0 transition-opacity duration-[1200ms] ease-out"
      // Explicit inline z-index rather than a Tailwind `-z-*` utility: this
      // must reliably paint behind every chapter's content but in front of
      // the graded CSS sky at -3. See the stacking-order table at the top of
      // globals.css.
      style={{ opacity: visible ? 1 : 0, zIndex: -2 }}
    >
      <CosmicScene
        tier={tier}
        pointerParallax={!coarsePointer}
        onReady={() => setVisible(true)}
        onContextLost={() => {
          // A lost GL context (GPU reset, driver hiccup, the tab being
          // evicted from the GPU process) would otherwise leave a frozen or
          // blank canvas sitting over the page forever. Unmount it and let
          // the CSS sky underneath simply carry on — the visitor keeps
          // reading, and nothing announces that anything went wrong.
          setVisible(false);
          setContextLost(true);
        }}
      />
    </div>
  );
}
