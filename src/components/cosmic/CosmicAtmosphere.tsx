"use client";

import { useEffect } from "react";
import {
  chapterTop,
  readSceneProgress,
  subscribeSceneFrame,
} from "./sceneProgress";
import { gradeAt } from "./grade";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Seams the cinematic transitions hang off. Each one is the boundary
 * between two chapter sections; `weight` peaks at 1 exactly when that
 * boundary sits at the viewport's vertical centre and falls to 0 roughly
 * `RANGE` viewport-heights either side of it.
 *
 * Peaking *at the seam* rather than across a whole chapter is what keeps
 * these safe: by the time either chapter's own text is centred and being
 * read, its transition treatment has already returned to zero. Nothing
 * here can ever sit on top of something the visitor is trying to read.
 */
// `--seam-constellation` (at the old "journey" boundary) and `--seam-arrival`
// (at the old "memories" boundary) are gone: chapters 03-05 merged into one
// "story" chapter (content.ts) whose carousel now carries those transitions
// internally, card to card, rather than as a hard boundary between DOM
// sections — the DOM pieces that read them (ChapterTimeline.tsx's
// constellation, MemoryGallery.tsx's `.memories-arrival`) have been deleted
// along with the rest of those two files.
const SEAMS = [
  // Merged chapter 03 (story) into chapter 04 (the letter): motion slows,
  // the sky dims, the background warms, and the letter emerges — the
  // external universe becoming an internal one.
  { varName: "--seam-inward", at: "letter", range: 1.0 },
  // Chapter 04 (the letter) into chapter 05 (the candles): the signature
  // settles, the screen darkens almost completely, and a single remaining
  // light is left burning where the flame is about to be.
  { varName: "--seam-lastlight", at: "birthday", range: 0.85 },
] as const;

const RESET: Record<string, string> = {
  "--seam-inward": "0",
  "--seam-lastlight": "0",
  "--seam-lastlight-drift": "0",
};

/**
 * The site's CSS cosmic layer: a deep, always-present radial-gradient sky
 * whose colour is graded from scroll position (see grade.ts), plus the
 * seam-driven scene transitions between chapters.
 *
 * This is deliberately *not* conditional on WebGL. It is the base the
 * canvas sits on top of, which means it doubles — with no extra code path
 * and nothing that has to be switched on in an emergency — as the complete
 * fallback whenever the canvas is absent: reduced motion, a low-end or
 * narrow device, WebGL unavailable, or a lost GL context mid-visit. The
 * `[data-webgl]` attribute on `<html>` lets the stylesheet give this layer
 * a little more presence in those cases (see globals.css).
 *
 * Everything here is driven by writing CSS custom properties from the
 * shared scroll store. No `requestAnimationFrame`, no `IntersectionObserver`
 * and no `ResizeObserver` anywhere in this path — a plain scroll event
 * writes the variables and CSS does the rest, so the grading and the
 * transitions work even in embedding contexts where those callback APIs
 * never fire.
 */
export default function CosmicAtmosphere() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const state = readSceneProgress();
      const g = gradeAt(state.storyPosition);

      root.style.setProperty("--grade-base", g.base);
      root.style.setProperty("--grade-glow", g.glow);
      root.style.setProperty("--grade-glow-strength", g.glowStrength.toFixed(3));
      root.style.setProperty("--grade-quiet", g.quiet.toFixed(3));
      root.style.setProperty("--grain-scale", g.grain.toFixed(3));

      if (reduced) {
        // A screen-wide darkening sweep is exactly the kind of thing
        // prefers-reduced-motion is asking us not to do. The grading above
        // is a slow colour wash and stays; the seam transitions do not.
        for (const [k, v] of Object.entries(RESET)) root.style.setProperty(k, v);
        return;
      }

      const vh = Math.max(1, window.innerHeight);
      const centre = window.scrollY + vh * 0.5;

      for (const seam of SEAMS) {
        const top = chapterTop(seam.at);
        if (top === null) {
          root.style.setProperty(seam.varName, "0");
          continue;
        }
        const signed = (top - centre) / vh;
        const weight = Math.max(0, 1 - Math.abs(signed) / seam.range);
        // Eased so the effect stays near zero for most of the approach and
        // only really arrives at the boundary itself.
        root.style.setProperty(
          seam.varName,
          (weight * weight * (3 - 2 * weight)).toFixed(4)
        );
        if (seam.varName === "--seam-lastlight") {
          // Signed, for the single remaining light's slow downward drift
          // as the visitor crosses into the candles.
          root.style.setProperty(
            "--seam-lastlight-drift",
            Math.max(-1, Math.min(1, -signed / seam.range)).toFixed(4)
          );
        }
      }
    };

    const unsubscribe = subscribeSceneFrame(apply);
    return () => {
      unsubscribe();
      for (const [k, v] of Object.entries(RESET)) root.style.setProperty(k, v);
    };
  }, [reduced]);

  return (
    <>
      {/* Base sky. Sits behind everything, including the WebGL canvas. */}
      <div className="cosmic-sky" aria-hidden="true">
        <span className="cosmic-sky__glow" />
        {/* Only raised into view when the canvas is not carrying the sky. */}
        <span className="cosmic-sky__stars" />
        <span className="cosmic-sky__warm" />
      </div>
      {/* The single remaining light: a near-total darkening of the frame
          with one soft warm point left in it, peaking exactly on the
          letter/candle boundary and gone again before either chapter's
          own text is centred. */}
      <div className="last-light" aria-hidden="true">
        <span className="last-light__flame" />
      </div>
    </>
  );
}
