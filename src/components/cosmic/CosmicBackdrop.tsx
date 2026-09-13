"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

// The WebGL canvas has no server-side equivalent and is non-trivial GPU
// work, so it is loaded only on the client and only once we've decided it
// is worth mounting at all (see the gating below).
const CosmicScene = dynamic(() => import("./CosmicScene"), { ssr: false });

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
 * through continuously as the page scrolls; `CameraDrift` inside
 * `CosmicScene` already reads whole-document scroll progress, so the
 * "flying through space" motion now plays across the entire site instead
 * of just the portal's own height.
 *
 * This never *replaces* the CSS cosmic layer (`CosmicAtmosphere`) — it
 * layers on top of it as a progressive enhancement. Whenever the canvas is
 * absent for any reason at all (reduced motion, a small/low-end viewport,
 * WebGL unavailable, or the GL context being lost mid-visit) that graded
 * CSS sky is already the complete, fully-visible backdrop underneath, so
 * there is no state this component can reach that leaves a chapter looking
 * broken or empty — and no failure that needs an error overlay in front of
 * someone who is trying to read a love letter.
 */
export default function CosmicBackdrop() {
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const coarsePointer = useCoarsePointer();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // A "low-end/very small viewport" heuristic: narrow width alone can still
  // be a capable phone, but narrow *and* a coarse (touch) pointer together
  // is the combination the brief calls out, so that's what skips the canvas.
  const shouldSkip = reduced || (narrow && coarsePointer) || contextLost;

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
    if (canvasLive) root.setAttribute("data-webgl", "on");
    else root.removeAttribute("data-webgl");
    return () => root.removeAttribute("data-webgl");
  }, [canvasLive]);

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
