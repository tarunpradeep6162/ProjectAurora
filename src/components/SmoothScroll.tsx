"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useMediaQuery";
import { useMotionEngineAlive } from "@/components/chapters/useMotionEngine";

/**
 * The site's smooth, weighted scroll — every wheel/trackpad input eases
 * toward its target instead of jumping there, the same feel
 * `project-aurora`'s Lenis integration has. Native touch scrolling is left
 * alone (Lenis's own touch smoothing fights momentum scrolling on a phone,
 * the same reason `ChapterTimeline` skips its GSAP pin there).
 *
 * Gated on `useMotionEngineAlive()` for the same reason every other
 * animation-frame-dependent feature in this project is: Lenis drives scroll
 * entirely through `requestAnimationFrame`, so in an environment where rAF
 * never fires (see MotionSafetyNet's doc comment), turning it on would leave
 * the page unable to scroll at all rather than merely un-smoothed. Native
 * scrolling — and every reveal built on it (`useInViewReveal`,
 * `sceneProgress.ts`, which both read `window.scrollY` directly) — is the
 * default until that probe confirms frames are real, and stays the default
 * for reduced motion or a touch-primary device.
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const engineAlive = useMotionEngineAlive();
  const enabled = engineAlive && !reduced && !coarsePointer;

  useEffect(() => {
    if (!enabled) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      touchMultiplier: 1,
    });

    // Lenis still drives the real `window` scroll position (it calls
    // `window.scrollTo` under the hood), so `sceneProgress.ts`'s native
    // `scroll` listener and ScrollTrigger both keep working unmodified —
    // this only has to keep the two in step on the same frame.
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    // Lenis already smooths the motion; GSAP's own lag-smoothing would
    // otherwise occasionally skip frames to catch up, which reads as a
    // stutter on top of an already-eased scroll.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [enabled]);

  return null;
}
